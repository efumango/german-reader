from flask import request, jsonify
from werkzeug.utils import secure_filename
import os
from .dictionary_services import process_dictionary
from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity

dictionary_bp = Blueprint('dictionary_bp', __name__)

@dictionary_bp.route('/upload-dictionary', methods=['POST'])
@jwt_required()
def upload_dictionary():
    if 'dictionary' not in request.files:
        return jsonify({'message': 'No dictionary file part'}), 400
    file = request.files['dictionary']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    if file and file.filename.endswith('.txt'):
        filename = secure_filename(file.filename)
        filepath = os.path.join('uploads', filename)
        file.save(filepath)
        user_identity = get_jwt_identity()
        process_dictionary(filepath, user_identity)
        os.remove(filepath)  
        return jsonify({'message': 'Dictionary uploaded'}), 200
    else:
        return jsonify({'message': 'Invalid file format'}), 400
