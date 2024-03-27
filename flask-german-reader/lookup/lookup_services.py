from flask import jsonify, current_app
from extensions import db
from HanTa import HanoverTagger as ht
import nltk
from extensions import db 
from sqlalchemy import text

def query_db(raw_text, user_identity, limit):
    try:
        # Check if the user exists with raw SQL
        user_result = db.session.execute(
            text("SELECT * FROM user WHERE id = :user_id"),
            {"user_id": user_identity}
        ).fetchone()

        if not user_result:
            return jsonify({'error': 'User not found'}), 404

        # Search patterns in the order of preference: 
        # exact match, start with, contain
        search_patterns = [
            raw_text,
            raw_text + " %",
            "% " + raw_text + " %"
        ]

        entries = None
        for pattern in search_patterns:
            entries = db.session.execute(
                text(
                    "SELECT de.word, de.definition FROM dictionary_entry de "
                    "JOIN user_dictionary_mapping udm ON de.id = udm.entry_id "
                    "WHERE de.word LIKE :pattern AND udm.user_id = :user_id "
                    "ORDER BY LENGTH(de.word) LIMIT :limit"
                ),
                {'pattern': pattern, 'user_id': user_identity, 'limit': limit}
            ).fetchall()

            # Break the loop if entries are found for the current pattern
            if entries:
                break

        if entries:
            results = [
                {'queried_word': raw_text, 'word': entry[0], 'definition': entry[1]}
                for entry in entries
            ]
            return jsonify(results), 200
        else:
            return jsonify({'error': f'Word "{raw_text}" not found in the dictionary for the current user', 'queried_word': raw_text}), 200
    except Exception as e:
        # Log the exception to your Flask app's logger
        current_app.logger.error(f'Error querying database with raw SQL: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

def query_all(raw_text, user_identity):
    try:
        # Check if the user exists with raw SQL
        user_result = db.session.execute(
            text("SELECT * FROM user WHERE id = :user_id"),
            {"user_id": user_identity}
        ).fetchone()

        if not user_result:
            return jsonify({'error': 'User not found'}), 404

        # Search patterns in the order of preference: 
        # exact match, start with, contain, broad match
        search_patterns = [
            raw_text,
            raw_text + " %",
            "% " + raw_text + " %"
        ]

        all_entries = []
        for pattern in search_patterns:
            entries = db.session.execute(
                text(
                    "SELECT de.word, de.definition FROM dictionary_entry de "
                    "JOIN user_dictionary_mapping udm ON de.id = udm.entry_id "
                    "WHERE de.word LIKE :pattern AND udm.user_id = :user_id "
                    "ORDER BY LENGTH(de.word)"
                ),
                {'pattern': pattern, 'user_id': user_identity}
            ).fetchall()

            all_entries.extend(entries)

        if all_entries:
            results = [
                {'queried_word': raw_text, 'word': entry[0], 'definition': entry[1]}
                for entry in all_entries
            ]
            return jsonify(results), 200
        else:
            return jsonify({'error': f'Word "{raw_text}" not found in the dictionary for the current user', 'queried_word': raw_text}), 200
    except Exception as e:
        # Log the exception to your Flask app's logger
        current_app.logger.error(f'Error querying database with raw SQL: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500


def hanta_processing(text, context, wordType):
    tagger = ht.HanoverTagger('morphmodel_ger.pgz')
    # Tokenize the context
    words = nltk.word_tokenize(context)
    
    # Lemmatize and tag POS
    lemmata = tagger.tag_sent(words)

    lemmatized_word = None

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
                            break
                    else:  
                        lemmatized_word = lem[1]
                    break 

                # Handle prefixes
                if wordType == 'canBePrefix' and pos == 'PTKVZ':
                    for previous_lem in reversed(lemmata[:idx]):
                        if previous_lem[2] in ['VV(FIN)', 'VV(IMP)']:
                            lemmatized_word = lem[1] + previous_lem[1]
                            break
                    else:  
                        lemmatized_word = lem[1]
                    break  

    # Check if lemmatized_word has been assigned a value
    if lemmatized_word is not None:
        return lemmatized_word
    else:
        # Handle the case where the word was not found
        return text 