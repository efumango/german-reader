from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

lookup_bp = Blueprint('lookup_bp', __name__)

@lookup_bp.route('/analyze-text', methods=['POST'])
@jwt_required()
def analyze_word():
    data = request.json
    selected_text = data.get('text', '')
    print("Received text:", selected_text)
    
    return jsonify({'message': 'Text processed successfully'}), 200