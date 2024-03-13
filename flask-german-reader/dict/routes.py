import os
from flask import Flask, request, jsonify, current_app
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
from .dictionary_services import process_dictionary
from flask import Blueprint

dictionary_bp = Blueprint('dictionary_bp', __name__)

upload_status_tracker = {}

@dictionary_bp.route('/upload-dictionary', methods=['POST'])
@jwt_required()
def upload_dictionary():
    # Check if the post request has the file part
    if 'dictionary' not in request.files:
        return jsonify({'message': 'No dictionary file part'}), 400
    file = request.files['dictionary']
    # Chunk information
    chunk_index = request.form['dzchunkindex']
    total_chunks = request.form['dztotalchunkcount']
    uuid = request.form['dzuuid']
    
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    
    # Secure a filename and create a directory for the chunks if it doesn't exist
    filename = secure_filename(file.filename)
    temp_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], uuid)
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir, exist_ok=True)
    
    # Save the chunk
    chunk_name = f"{filename}.part{chunk_index}"
    chunk_path = os.path.join(temp_dir, chunk_name)
    file.save(chunk_path)
    
    # Check if all chunks have been uploaded
    if all_chunks_received(uuid, total_chunks, current_app.config['UPLOAD_FOLDER'], filename):
        # Merge chunks
        final_path = merge_chunks(uuid, total_chunks, current_app.config['UPLOAD_FOLDER'], filename)
        # Get user id
        user_identity = get_jwt_identity()
        # Mark the upload as processing 
        upload_status_tracker[uuid] = 'processing'
        try:
            # Process the dictionary file
            process_dictionary(final_path, user_identity)
            upload_status_tracker[uuid] = 'processed'
        except Exception as e:
            upload_status_tracker[uuid] = 'failed'
        # Cleanup: remove the chunks and directory
        cleanup_chunks(uuid, current_app.config['UPLOAD_FOLDER'])
        return jsonify({'message': 'Dictionary uploaded and processed'}), 200
    
    return jsonify({'message': 'Chunk uploaded'}), 200

@dictionary_bp.route('/upload-status/<uuid>', methods=['GET'])
@jwt_required()
def get_upload_status(uuid):
    status = upload_status_tracker.get(uuid, 'unknown')
    return jsonify({'status': status}), 200

def all_chunks_received(uuid, total_chunks, upload_folder, filename):
    temp_dir = os.path.join(upload_folder, uuid)
    return len(os.listdir(temp_dir)) == int(total_chunks)

def merge_chunks(uuid, total_chunks, upload_folder, filename):
    temp_dir = os.path.join(upload_folder, uuid)
    final_path = os.path.join(upload_folder, filename)
    with open(final_path, 'wb') as outfile:
        for i in range(int(total_chunks)):
            chunk_path = os.path.join(temp_dir, f"{filename}.part{i}")
            with open(chunk_path, 'rb') as infile:
                outfile.write(infile.read())
    return final_path

def cleanup_chunks(uuid, upload_folder):
    temp_dir = os.path.join(upload_folder, uuid)
    # Check if the temporary directory exists
    if os.path.exists(temp_dir):
        # Get the list of chunk files
        chunk_files = [f for f in os.listdir(temp_dir) if os.path.isfile(os.path.join(temp_dir, f))]
        # Iterate over chunk files and delete them
        for chunk_file in chunk_files:
            try:
                os.remove(os.path.join(temp_dir, chunk_file))
            except OSError as e:
                print(f"Error deleting file {chunk_file}: {e.strerror}")
        # After all chunks are deleted, attempt to remove the directory
        try:
            os.rmdir(temp_dir)  # This will only work if the directory is empty
        except OSError as e:
            print(f"Error removing directory {temp_dir}: {e.strerror}")

