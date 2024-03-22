from flask import jsonify, current_app
from models import User, DictionaryEntry, UserDictionaryMapping
from extensions import db
from HanTa import HanoverTagger as ht
import nltk

def query_db(text, user_identity, limit):
    try:
        # Check if the user exists using SQLAlchemy
        user = User.query.filter_by(id=user_identity).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Search patterns in the order of preference: 
        # exact match, start with, contain, broad match 
        search_patterns = [text, text + " %", "% " + text + " %", "%" + text + "%"]

        entries = []
        for pattern in search_patterns:
            entries = db.session.query(DictionaryEntry.word, DictionaryEntry.definition).join(
                UserDictionaryMapping, DictionaryEntry.id == UserDictionaryMapping.entry_id
            ).filter(
                DictionaryEntry.word.like(pattern),
                UserDictionaryMapping.user_id == user_identity
            ).order_by(db.func.length(DictionaryEntry.word)).limit(limit).all()

            # Break the loop if entries are found for the current pattern
            if entries:
                break

        if entries:
            results = [{'queried_word': text, 'word': word, 'definition': definition} for word, definition in entries]
            return jsonify(results), 200
        else:
            return jsonify({'error': f'Word "{text}" not found in the dictionary for the current user'}), 200
    except Exception as e:
        # Log the exception to your Flask app's logger
        current_app.logger.error(f'Error querying database: {str(e)}')
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
                    else:  # No break encountered
                        lemmatized_word = lem[1]
                    break  # Break the outer loop once processed

                # Handle prefixes
                if wordType == 'canBePrefix' and pos == 'PTKVZ':
                    for previous_lem in reversed(lemmata[:idx]):
                        if previous_lem[2] in ['VV(FIN)', 'VV(IMP)']:
                            lemmatized_word = lem[1] + previous_lem[1]
                            break
                    else:  # No break encountered
                        lemmatized_word = lem[1]
                    break  # Break the outer loop once processed

    # Check if lemmatized_word has been assigned a value
    if lemmatized_word is not None:
        return lemmatized_word
    else:
        # Handle the case where the word was not found
        return text 