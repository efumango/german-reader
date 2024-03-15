from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from dict.dictionary_services import process_chunk_async
from flask_jwt_extended import jwt_required, get_jwt_identity
from global_sessions import upload_sessions
import os 

dictionary_bp = Blueprint('dictionary_bp', __name__)

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

    #temporarily remove celery for testing
    process_chunk_async(chunk_path, user_identity, uuid, total_chunks)
    
    return jsonify({'message': 'Chunk received'}), 202

@dictionary_bp.route('/upload-status/<uuid>', methods=['GET'])
def upload_status(uuid):
    session = upload_sessions.get(uuid)
    if not session:
        return jsonify({'message': 'Upload session not found'}), 404
    
    status = 'complete' if session.get('complete', False) else 'processing'
    return jsonify({'status': status, 'processed_chunks': session.get('processed_chunks', 0), 'total_chunks': session.get('total_chunks', 0)}), 200
