from flask import jsonify, current_app
from app.extensions import db
from HanTa import HanoverTagger as ht
from sqlalchemy import text
import nltk
from config import ProductionConfig
nltk.data.path.append(ProductionConfig.NLTK_DATA_PATH)
from nltk.tokenize import word_tokenize
from german_compound_splitter import comp_split

def query_dict_entries(raw_text, user_identity, limit, context):
    queried_word = None

    try: 
        # Check if the user exists
        user_result = db.session.execute(
            text('SELECT id FROM "user" WHERE id = :user_id'),
            {"user_id": user_identity}
        ).fetchone()

        if not user_result:
            return jsonify({'error': 'User not found'}), 404
        
        results = []
        # NO CONTEXT: query phrases without HanTa processing 
        if context is None: 
            queried_word = raw_text
            results = query_word_in_dict(queried_word, user_identity, limit)
        else:
            # CONTAIN CONTEXT: Perform HanTa processing
            hanta_results = hanta_processing(raw_text, context)
            
            # Query for inflected form 
            inflected_form = hanta_results['inflected_form']
            inflected_results = query_word_in_dict(inflected_form, user_identity, limit)

            lemma = hanta_results['lemma']

            # Check if inflected form and lemmatized form are the same
            is_same_form = (inflected_form == lemma)

            if inflected_results:
                original_found = False
                # Check if these results include an original form
                for result in inflected_results:
                    if result['original_form']:
                        original_found = True
                        # Query for the original form of the first result that has one 
                        original_form_results = query_word_in_dict(result['original_form'], user_identity, limit)
                        inflected_results.extend(original_form_results)
                        break
                if not original_found and not is_same_form:
                    # If no original form, query the lemmatized form (if they're different)
                    lemmatized_results = query_word_in_dict(lemma, user_identity, limit)
                    inflected_results.extend(lemmatized_results)
                results = inflected_results
            elif not is_same_form:
                # If no results for inflected form and forms are different, query the lemmatized form
                lemmatized_results = query_word_in_dict(lemma, user_identity, limit)
                results = lemmatized_results
            else:
                # Use the same results as the lemmatized and inflected forms are the same
                results = inflected_results

        return jsonify(results if results else {'error': f'Word "{inflected_form}" and its lemma "{lemma}" not found in the dictionary', 'queried_word': queried_word}), 200

    except Exception as e:
        current_app.logger.error(f'Error querying database: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500


def query_word_in_dict(raw_text, user_identity, limit):

    # Remove ' from raw_text 
    raw_text = raw_text.replace("'", "")

    # Define search patterns
    def get_search_patterns(text):
        return [
            text,
            text + " %",
            "% " + text + " %"
        ]

    def execute_query(patterns, user_identity, limit):
        all_entries = []
        for pattern in patterns:
            query = db.session.execute(
                text(
                    "SELECT de.word, de.original_form, de.definition, de.inflection, de.source FROM dictionary_entry de "
                    "LEFT JOIN user_dictionary_mapping udm ON de.id = udm.entry_id AND udm.user_id = :user_id "
                    "WHERE de.word LIKE :pattern "
                    "AND (de.source = 'prepared' OR (de.source = 'custom' AND udm.user_id IS NOT NULL)) "
                    "ORDER BY LENGTH(de.word)" + (" LIMIT :limit" if limit else "")
                ),
                {'pattern': pattern, 'user_id': user_identity, **({'limit': limit} if limit else {})}
            ).fetchall()

            if limit and query:
                # If a limit is set and entries are found, stop searching
                return query
            elif not limit:
                # If no limit, accumulate entries from all patterns
                all_entries.extend(query)

        return all_entries

    # Attempt with the original text
    search_patterns = get_search_patterns(raw_text)
    all_entries = execute_query(search_patterns, user_identity, limit)

    # If no entries found and the raw text is not all lowercase, attempt with lowercase text
    if not all_entries and raw_text != raw_text.lower():
        lower_text = raw_text.lower()
        search_patterns = get_search_patterns(lower_text)
        all_entries = execute_query(search_patterns, user_identity, limit)

    results = [
        {'queried_word': raw_text, 'word': entry[0], 'original_form': entry[1], 'definition': entry[2], 'inflection': entry[3], 'source': entry[4]}
        for entry in all_entries
    ]
    return results


def hanta_processing(text, context):
    tagger = ht.HanoverTagger('morphmodel_ger.pgz')
    # Tokenize the context
    words = nltk.word_tokenize(context)
    
    # Lemmatize and tag POS
    lemmata = tagger.tag_sent(words)

    lemma = None
    inflected_form = text

    def handle_separable_verb(idx, lem):
        for subsequent_idx in range(idx + 1, len(lemmata)):
            subsequent_lem = lemmata[subsequent_idx]
            if subsequent_lem[2] == 'PTKVZ':
                # Check for verbs between the current and PTKVZ word
                has_intervening_verb = any(lemmata[i][2] in ['VV(FIN)', 'VV(IMP)'] for i in range(idx + 1, subsequent_idx))
                if not has_intervening_verb:
                    return subsequent_lem[1] + lem[1], lem[0] + ' ' + subsequent_lem[1]
        return lem[1], lem[0]

    def handle_prefix(idx, lem):
    # Iterate from the current index backwards to the start
        for i in range(idx - 1, -1, -1):
            previous_lem = lemmata[i]
            if previous_lem[2] in ['VV(FIN)', 'VV(IMP)']:
                return lem[1] + previous_lem[1], previous_lem[0] + ' ' + lem[1]
        return lem[1], lem[0]


    for idx, lem in enumerate(lemmata):
        if lem[0].lower() == text.lower():
            pos = lem[2]
            if pos in ['VV(FIN)', 'VV(IMP)']:
                lemma, inflected_form = handle_separable_verb(idx, lem)
            elif pos == 'PTKVZ':
                lemma, inflected_form = handle_prefix(idx, lem)
            else:
                lemma = lem[1]
                inflected_form = lem[0]
            break

    return {
        'lemma': lemma if lemma else text,
        'inflected_form': inflected_form
    }


def decompound(compound, user_identity, limit):
    input_file = ProductionConfig.GERMAN_WORDLIST
    ahocs = comp_split.read_dictionary_from_file(input_file)

    # Decompound the word
    dissection = comp_split.dissect(compound, ahocs, make_singular=True)
    print('SPLIT WORDS (plain):', dissection)

    all_results = []

    for word in dissection:
        # Query the dictionary for each decompounded word
        results = query_word_in_dict(word, user_identity, limit)
        all_results.extend(results)

    return jsonify(all_results)