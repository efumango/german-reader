from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import UserVocab
from extensions import db

vocab_bp = Blueprint('vocab_bp', __name__)

@vocab_bp.route('/vocab/add-word', methods=['POST'])
@jwt_required()
def add_word():
    data = request.get_json()
    user_identity = get_jwt_identity()
    new_word = UserVocab(user_id=user_identity, word=data['word'], definition=data['definition'])
    db.session.add(new_word)
    db.session.commit()
    return jsonify({"success": True, "response": "Word added"}), 201

@vocab_bp.route('/vocab', methods=['GET'])
@jwt_required()
def get_vocab():
    user_identity = get_jwt_identity()
    words = UserVocab.query.filter_by(user_id=user_identity).all()
    return jsonify([{'word': word.word, 'definition': word.definition} for word in words])
