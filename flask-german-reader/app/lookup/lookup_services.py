from flask import jsonify, current_app
from app.extensions import db
from HanTa import HanoverTagger as ht
import nltk
from sqlalchemy import text

def query_dict_entries(raw_text, user_identity, limit, context, wordType):
    try: 
        # Check if the user exists
        user_result = db.session.execute(
            text("SELECT * FROM user WHERE id = :user_id"),
            {"user_id": user_identity}
        ).fetchone()

        if not user_result:
            return jsonify({'error': 'User not found'}), 404

        results = []
        # NO CONTEXT: query phrases w/o HanTa processing 
        if context is None: 
            results = query_word_in_dict(raw_text, user_identity, limit)
        else:
            # CONTAIN CONTEXT: Perform HanTa processing
            hanta_results = hanta_processing(raw_text, context, wordType)
            # Query for conjugated form first 
            conjugated_results = query_word_in_dict(hanta_results['conjugated_word'], user_identity, limit)
            if conjugated_results:
                # Check if these results include an original form
                for result in conjugated_results:
                    if result['original_form']:
                        # Query for the original form of the first result that has one 
                        original_form_results = query_word_in_dict(result['original_form'], user_identity, limit)
                        conjugated_results.extend(original_form_results)
                        break
                results = conjugated_results
            else:
                # If not exist, query the lemmatized form
                lemmatized_results = query_word_in_dict(hanta_results['lemmatized_word'], user_identity, limit)
                results = lemmatized_results

        return jsonify(results if results else {'error': f'Word "{raw_text}" not found in the dictionary', 'queried_word': raw_text}), 200
    
    except Exception as e:
        current_app.logger.error(f'Error querying database: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500


def query_word_in_dict(raw_text, user_identity, limit):
    # Define search patterns
    search_patterns = [
        raw_text,
        raw_text + " %",
        "% " + raw_text + " %"
    ]

    all_entries = []
    for pattern in search_patterns:
        query = db.session.execute(
            text(
                "SELECT de.word, de.original_form, de.definition, de.inflection FROM dictionary_entry de "
                "LEFT JOIN user_dictionary_mapping udm ON de.id = udm.entry_id AND udm.user_id = :user_id "
                "WHERE de.word LIKE :pattern "
                "AND (de.source = 'prepared' OR (de.source = 'custom' AND udm.user_id IS NOT NULL)) "
                "ORDER BY LENGTH(de.word)" + (" LIMIT :limit" if limit else "")
            ),
            {'pattern': pattern, 'user_id': user_identity, **({'limit': limit} if limit else {})}
        ).fetchall()

        if limit and query:
            # If a limit is set and entries are found, stop searching
            all_entries = query
            break
        elif not limit:
            # If no limit, accumulate entries from all patterns
            all_entries.extend(query)

    if all_entries:
        results = [
            {'queried_word': raw_text, 'word': entry[0], 'original_form': entry[1], 'definition': entry[2], 'inflection': entry[3]}
            for entry in all_entries
        ]
        return results 
    else:
        return None 
 


def hanta_processing(text, context, wordType):
    tagger = ht.HanoverTagger('morphmodel_ger.pgz')
    # Tokenize the context
    words = nltk.word_tokenize(context)
    
    # Lemmatize and tag POS
    lemmata = tagger.tag_sent(words)

    lemmatized_word = None
    conjugated_word = text 

    if wordType == 'default':
        for lem in lemmata:
            if lem[0].lower() == text.lower():
                lemmatized_word = lem[1]
                break  # Exit loop once the word is found

    else:
        for idx, lem in enumerate(lemmata):
            if lem[0].lower() == text.lower():
                pos = lem[2]
                # Handle separable verbs
                if wordType == 'canBeSepVerb' and pos in ['VV(FIN)', 'VV(IMP)']:
                    for subsequent_lem in lemmata[idx + 1:]:
                        if subsequent_lem[2] == 'PTKVZ':
                            lemmatized_word = subsequent_lem[1] + lem[1]
                            conjugated_word = lem[0] + ' ' + subsequent_lem[1]
                            break
                    else:  
                        lemmatized_word = lem[1]
                    break 

                # Handle prefixes
                if wordType == 'canBePrefix' and pos == 'PTKVZ':
                    for previous_lem in reversed(lemmata[:idx]):
                        if previous_lem[2] in ['VV(FIN)', 'VV(IMP)']:
                            lemmatized_word = lem[1] + previous_lem[1]
                            conjugated_word = previous_lem[0] + ' ' + lem[1]
                            break
                    else:  
                        lemmatized_word = lem[1]
                    break  

    return {
        'lemmatized_word': lemmatized_word if lemmatized_word else text,
        'conjugated_word': conjugated_word
    }
