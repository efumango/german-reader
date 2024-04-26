import csv
from flask import Blueprint, jsonify, request

logging_bp = Blueprint('logging_bp', __name__)

@logging_bp.route('/logs', methods=['POST'])
def log_activity():
    log_message = request.json.get('logMessage')

    if log_message:
        # Split log message into its components
        log_components = log_message.split(',')
        
        # Extract data from log message
        timestamp = log_components[0]
        username = log_components[1]
        activity = log_components[2]

        # Check if filename exists in the log message
        if len(log_components) > 3:
            filename = log_components[3]
        else:
            filename = None

        # Write log data to CSV file
        with open('user_activity_log.csv', 'a', newline='') as csvfile:
            fieldnames = ['username', 'activity', 'filename', 'timestamp']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

            # Write header if file is empty
            if csvfile.tell() == 0:
                writer.writeheader()

            log_data = {
                'username': username,
                'activity': activity,
                'timestamp': timestamp
            }

            # Add filename to log data if it exists
            if filename is not None:
                log_data['filename'] = filename

            writer.writerow(log_data)

        return jsonify({'message': 'Log received and processed successfully'}), 200
    else:
        return jsonify({'error': 'No log message received'}), 400
