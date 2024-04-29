from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import joinedload
from app.models import UserVocab, DictionaryEntry
from app.extensions import db

vocab_bp = Blueprint('vocab_bp', __name__)

@vocab_bp.route('/add-word', methods=['POST'])
@jwt_required()
def add_word():
    data = request.get_json()
    user_identity = get_jwt_identity()
    
    # Look up the dictionary entry
    word = data['word']
    entry = DictionaryEntry.query.filter_by(word=word).first()
    if not entry:
        return jsonify({"error": "Word does not exist in the dictionary"}), 404
    
    # Create UserVocab entry
    new_word = UserVocab(
        user_id=user_identity,
        dictionary_entry_id=entry.id,
        word=entry.word,  # Copy word from DictionaryEntry
        definition=entry.definition,  # Copy definition from DictionaryEntry
        inflection=entry.inflection, # Copy inflection from DictionaryEntry
        sentence=data['sentence'],
        filename=data['filename']
    )
    db.session.add(new_word)
    db.session.commit()
    return jsonify({"success": True, "response": "Word added"}), 201

@vocab_bp.route('/show-list-vocab', methods=['GET'])
@jwt_required()
def get_vocab():
    user_identity = get_jwt_identity()
    words = UserVocab.query.filter_by(user_id=user_identity).all()
    return jsonify([{'id': word.id, 'word': word.word, 'definition': word.definition, 'inflection': word.inflection, 'sentence': word.sentence, 'filename': word.filename} for word in words])

@vocab_bp.route('/deduplicate', methods=['POST'])
@jwt_required()
def deduplicate_words():
    user_identity = get_jwt_identity()
    words = UserVocab.query.filter_by(user_id=user_identity).all()

    seen = {}
    to_delete = []
    deleted_words = []  # List to store details of deleted words

    for word in words:
        key = (word.word, word.definition)
        if key in seen:
            to_delete.append(word)
            deleted_words.append({
                'id': word.id,
                'word': word.word,
                'definition': word.definition,
                'inflection': word.inflection,
                'sentence': word.sentence,
                'filename': word.filename
            })
        else:
            seen[key] = word

    for word in to_delete:
        db.session.delete(word)

    db.session.commit()
    return jsonify({
        "success": True,
        "message": "Duplicates removed",
        "deleted_words": deleted_words
    })

@vocab_bp.route('/delete', methods=['POST'])
@jwt_required()
def delete_words():
    user_identity = get_jwt_identity()
    data = request.get_json()
    word_ids = data.get('word_ids')
    
    if not word_ids:
        return jsonify({"error": "No word IDs provided"}), 400

    try:
        UserVocab.query.filter(UserVocab.id.in_(word_ids), UserVocab.user_id == user_identity).delete(synchronize_session='fetch')
        db.session.commit()
        return jsonify({"success": True, "message": "Words deleted"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "An error occurred during deletion", "details": str(e)}), 500

@vocab_bp.route('/update', methods=['PUT'])
@jwt_required()  
def update_vocab_batch():
    data = request.get_json()
    user_identity = get_jwt_identity()

    if not data:
        return jsonify({'message': 'No data provided'}), 400

    try:
        for item in data:
            vocab_id = item.get('id')
            vocab = UserVocab.query.filter_by(id=vocab_id, user_id=user_identity).first()
            
            if not vocab:
                continue

            # Update sentence
            vocab.sentence = item.get('sentence', vocab.sentence)
            
            # Update word and definition
            vocab.word = item.get('word', vocab.word)
            vocab.definition = item.get('definition', vocab.definition)

        db.session.commit()
        return jsonify({'message': 'Vocabulary items updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update vocabulary items', 'error': str(e)}), 500
