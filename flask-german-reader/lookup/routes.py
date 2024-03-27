from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from lookup.lookup_services import query_db, hanta_processing, query_all

lookup_bp = Blueprint('lookup_bp', __name__)

@lookup_bp.route('/query-db', methods=['POST'])
@jwt_required()
def handle_query_db():
    data = request.get_json()
    user_identity = get_jwt_identity()

    # Check if the required 'text' field is present
    if not data or 'text' not in data:
        return jsonify({'error': 'Missing text'}), 400
    
    # Retrieve the text from the request
    text = data['text']
    
    # Query for the text in the database 
    response_data = query_db(text, user_identity, limit=10)
    
    return response_data

@lookup_bp.route('/process-and-query-db', methods=['POST'])
@jwt_required()
def process_and_query_db():
    data = request.get_json()
    user_identity = get_jwt_identity()

    # Check if the required 'text' field is present
    if not data or 'text' not in data:
        return jsonify({'error': 'Missing text'}), 400

    text = data['text']
    context = data.get('context')
    wordType = data.get('wordType')

    # Process the text and optional context
    if context:
        lemmatized_text = hanta_processing(text, context, wordType)
        response_data = query_db(lemmatized_text, user_identity, limit=10)

    return response_data

@lookup_bp.route('/query-all', methods=['POST'])
@jwt_required()
def handle_query_all():
    data = request.get_json()
    user_identity = get_jwt_identity()

    # Check if the required 'text' field is present
    if not data or 'searchQuery' not in data:
        return jsonify({'error': 'Missing search query'}), 400
    
    # Retrieve the text from the request
    text = data['searchQuery']
    
    # Query for the text in the database 
    response_data = query_all(text, user_identity)
    
    return response_data
