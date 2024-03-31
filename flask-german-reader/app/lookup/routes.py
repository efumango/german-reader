from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.lookup.lookup_services import hanta_processing, query_dict_entries

lookup_bp = Blueprint('lookup_bp', __name__)

@lookup_bp.route('/query', methods=['POST'])
@jwt_required()
def handle_query():
    data = request.get_json()
    user_identity = get_jwt_identity()

    # Check if the required 'text' or 'searchQuery' field is present
    text = data.get('text') or data.get('searchQuery')
    if not text:
        return jsonify({'error': 'Missing text or search query'}), 400

    # Determine if 'all' query parameter is set to fetch all entries
    fetch_all = request.args.get('all', '').lower() == 'true'

    # Query for the text in the database with or without limit based on 'all' parameter
    limit = None if fetch_all else 10
    response_data = query_dict_entries(text, user_identity, limit, context=None, wordType=None)

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
    limit = 10 

    # Process the text and optional context
    if context:
        response_data = query_dict_entries(text, user_identity, limit, context, wordType)

    return response_data

