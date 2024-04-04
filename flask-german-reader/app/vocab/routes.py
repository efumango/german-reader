from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import UserVocab
from app.extensions import db

vocab_bp = Blueprint('vocab_bp', __name__)

@vocab_bp.route('/add-word', methods=['POST'])
@jwt_required()
def add_word():
    data = request.get_json()
    user_identity = get_jwt_identity()
    new_word = UserVocab(user_id=user_identity, word=data['word'], definition=data['definition'], inflection=data['inflection'], sentence=data['sentence'])
    db.session.add(new_word)
    db.session.commit()
    return jsonify({"success": True, "response": "Word added"}), 201

@vocab_bp.route('/show-list-vocab', methods=['GET'])
@jwt_required()
def get_vocab():
    user_identity = get_jwt_identity()
    words = UserVocab.query.filter_by(user_id=user_identity).all()
    return jsonify([{'id': word.id, 'word': word.word, 'definition': word.definition, 'inflection': word.inflection, 'sentence': word.sentence} for word in words])

@vocab_bp.route('/deduplicate', methods=['POST'])
@jwt_required()
def deduplicate_words():
    user_identity = get_jwt_identity()

    # Fetch all words
    words = UserVocab.query.filter_by(user_id=user_identity).all()

    seen = {}
    to_delete = []

    for word in words:
        key = (word.word, word.definition)
        if key in seen:
            to_delete.append(word)
        else:
            seen[key] = word

    # Delete duplicates
    for word in to_delete:
        db.session.delete(word)

    db.session.commit()
    return jsonify({"success": True, "message": "Duplicates removed"})

@vocab_bp.route('/delete', methods=['POST'])
@jwt_required()
def delete_words():
    user_identity = get_jwt_identity()
    data = request.get_json()
    word_ids = data.get('word_ids')  # Expect a list of word IDs to delete

    # Validate input
    if not word_ids:
        return jsonify({"error": "No word IDs provided"}), 400

    try:
        # Fetch and delete words that match the provided IDs and belong to the user
        UserVocab.query.filter(UserVocab.id.in_(word_ids), UserVocab.user_id == user_identity).delete(synchronize_session=False)
        db.session.commit()
        print("Deleting word IDs:", word_ids)
        print("User Identity:", user_identity)
        print("Request Data:", request.data)  # Raw data
        print("Parsed JSON:", request.json)  # Parsed JSON

        return jsonify({"success": True, "message": "Words deleted"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "An error occurred during deletion", "details": str(e)}), 500
