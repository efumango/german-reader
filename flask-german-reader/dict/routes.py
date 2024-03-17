from http.client import REQUEST_ENTITY_TOO_LARGE
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from dict.dictionary_services import process_chunk
from flask_jwt_extended import jwt_required, get_jwt_identity
import os 

dictionary_bp = Blueprint('dictionary_bp', __name__)

@dictionary_bp.errorhandler(REQUEST_ENTITY_TOO_LARGE)
def handle_file_too_large(e):
    return jsonify({'message': 'File size exceeds 20 MB.'}), 413

@dictionary_bp.route('/upload-dictionary', methods=['POST'])
@jwt_required()
def upload_dictionary():
    user_identity = get_jwt_identity()
    uuid = request.form.get('dzuuid')
    total_chunks = request.form.get('dztotalchunkcount')
    
    file = request.files['dictionary']
    if not file:
        return jsonify({'message': 'No file part'}), 400

    filename = secure_filename(file.filename)
    chunk_index = request.form.get('dzchunkindex')
    
    temp_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], uuid)
    os.makedirs(temp_dir, exist_ok=True)
    
    chunk_path = os.path.join(temp_dir, f"{filename}.part{chunk_index}")
    file.save(chunk_path)

    process_chunk(chunk_path, user_identity)
    
    return jsonify({'message': 'Chunk processed'}), 200
