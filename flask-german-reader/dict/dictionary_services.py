from flask import Blueprint
from flask_login import current_user
from models import DictionaryEntry
from extensions import db
from models.user import User

# Create a Blueprint
dictionary_bp = Blueprint('dictionary_bp', __name__)

def insert_into_database(user_id, word, definition, pos=None, additional_info=None):
    new_entry = DictionaryEntry(user_id=user_id, word=word, definition=definition, pos=pos, additional_info=additional_info)
    db.session.add(new_entry)
    db.session.commit()

def process_dictionary(filepath, user_identity):
    # Retrieve the user based on user_identity
    user = User.query.filter_by(id=user_identity).first()

    if not user:
        raise Exception('User not found')
    
    user_id = user.id 

    with open(filepath, 'r', encoding='utf-8') as file:
        for line in file:
            # Skip metadata lines
            if line.startswith('#'):
                continue
            
            # Split line into components and ensure there are at least 2 non-null columns
            parts = line.strip().split('\t')
            if len(parts) < 2:
                continue  # Skip lines that don't have at least word and definition
            
            word, definition = parts[0], parts[1]
            pos = parts[2] if len(parts) > 2 else None
            additional_info = parts[3] if len(parts) > 3 else None
            
            # Insert into database with user_id
            insert_into_database(user_id, word, definition, pos, additional_info)

