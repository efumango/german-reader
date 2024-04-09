import os
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

text_bp = Blueprint('text_bp', __name__)

@text_bp.route('/upload-text', methods=['POST'])
@jwt_required()
def upload_text():
    current_user = get_jwt_identity()
    if 'text' not in request.files:
        return jsonify({'error': 'No file part'})
    file = request.files['text']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})
    if file:
        filename = secure_filename(f"{current_user}_{file.filename}")  # Concatenate user's identity with filename
        file.save(os.path.join(current_app.config['UPLOADED_TEXT_FOLDER'], filename))
        return jsonify({'message': 'File uploaded successfully'})
    return jsonify({'error': 'Upload failed'})

@text_bp.route('/files', methods=['GET'])
@jwt_required() 
def get_files():
    current_user = str(get_jwt_identity())
    user_files = [file for file in os.listdir(current_app.config['UPLOADED_TEXT_FOLDER']) if file.startswith(current_user)]
    return jsonify(user_files)

@text_bp.route('/files/<filename>', methods=['GET'])
@jwt_required()
def get_file(filename):
    current_user = str(get_jwt_identity())
    user_file = os.path.join(current_app.config['UPLOADED_TEXT_FOLDER'], filename)
    if not os.path.isfile(user_file) or not filename.startswith(current_user):
        return jsonify({'error': 'File not found or unauthorized'})
    with open(user_file, 'r', encoding='utf-8') as f:
        file_content = f.read()
    return file_content

@text_bp.route('/delete-file', methods=['POST'])
@jwt_required()  
def delete_file():
    current_user = str(get_jwt_identity())
    filename = request.json.get('filename')
    if not filename:
        return jsonify({'error': 'Filename not provided'})
    user_file = os.path.join(current_app.config['UPLOADED_TEXT_FOLDER'], filename)
    if not os.path.isfile(user_file) or not filename.startswith(current_user):
        return jsonify({'error': 'File not found or unauthorized'})
    os.remove(user_file)
    return jsonify({'message': 'File deleted successfully'})