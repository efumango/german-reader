from flask import jsonify, current_app
from flask_sqlalchemy import SQLAlchemy
from models import User, DictionaryEntry, UserDictionaryMapping
from extensions import db


def query_db(text, user_identity, limit):
    try:
        # Check if the user exists using SQLAlchemy
        user = User.query.filter_by(id=user_identity).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Query the dictionary entries for the user
        entries = db.session.query(DictionaryEntry.word, DictionaryEntry.definition).join(
            UserDictionaryMapping, DictionaryEntry.id == UserDictionaryMapping.entry_id
        ).filter(
            (DictionaryEntry.word == text) | (DictionaryEntry.word.like(f'%{text}%')),
            UserDictionaryMapping.user_id == user_identity
        ).limit(limit).all()

        if entries:
            results = [{'word': word, 'definition': definition} for word, definition in entries]
            return jsonify(results), 200
        else:
            return jsonify({'error': f'Word "{text}" not found in the dictionary for the current user'}), 200
    except Exception as e:
        # Log the exception to your Flask app's logger
        current_app.logger.error(f'Error querying database: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500
