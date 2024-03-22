from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from lookup.lookup_services import query_db

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
    response_data = query_db(text, user_identity,limit=5)
    
    return response_data

@lookup_bp.route('/process-and-query-db', methods=['POST'])
@jwt_required()
def process_and_query_db():
    data = request.get_json()

    # Check if the required 'text' field is present
    if not data or 'text' not in data:
        return jsonify({'error': 'Missing text'}), 400

    text = data['text']
    context = data.get('context')

    # Process the text and optional context
    if context:
        print("Processing text with context for POS tagging and lemmatization...")
        # Placeholder for actual NLP processing and DB querying logic
        result = {"processed": True, "text": text, "context": context}
    else:
        # Directly query the DB with text if no context is provided
        print("Directly querying the DB with text...")
        # Placeholder for actual DB querying logic
        result = {"queried": True, "text": text}

    return jsonify(result)
