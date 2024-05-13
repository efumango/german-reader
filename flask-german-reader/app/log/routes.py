from datetime import datetime
from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models import Log

logging_bp = Blueprint('logging_bp', __name__)

@logging_bp.route('/logs', methods=['POST'])
def log_activity():
    log_message = request.json.get('logMessage')
    if log_message:
        log_components = log_message.split(',')
        log_entry = Log(
            timestamp=datetime.utcnow(),
            username=log_components[1],
            activity=log_components[2],
            filename=log_components[3] if len(log_components) > 3 else None,
            word=log_components[4] if len(log_components) > 4 else None
        )
        db.session.add(log_entry)
        db.session.commit()
        return jsonify({'message': 'Log received and processed successfully'}), 200
    else:
        return jsonify({'error': 'No log message received'}), 400
