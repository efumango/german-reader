from sqlite3 import OperationalError
import time
from flask import Blueprint
from sqlalchemy import insert
from models import DictionaryEntry
from extensions import db
from models.user import User

dictionary_bp = Blueprint('dictionary_bp', __name__)

def process_dictionary(filepath, user_identity):
    user = User.query.filter_by(id=user_identity).first()
    if not user:
        raise Exception('User not found')

    entries_data = []
    with open(filepath, 'r', encoding='utf-8') as file:
        for line in file:
            if line.startswith('#'):
                continue
            parts = line.strip().split('\t')
            if len(parts) < 2:
                continue
            word, definition = parts[0], parts[1]
            pos = parts[2] if len(parts) > 2 else None
            additional_info = parts[3] if len(parts) > 3 else None
            entries_data.append({
                'user_id': user.id,
                'word': word,
                'definition': definition,
                'pos': pos,
                'additional_info': additional_info
            })

    batch_size = 500 
    if entries_data:
        try:
            for i in range(0, len(entries_data), batch_size):
                batch = entries_data[i:i+batch_size]
                stmt = insert(DictionaryEntry).values(batch)

                retries = 5
                backoff = 1

                for attempt in range(retries):
                    try:
                        db.session.execute(stmt)
                        break  # If successful, break out of the retry loop
                    except OperationalError as e:
                        if 'database is locked' in str(e):
                            time.sleep(backoff)
                            backoff *= 2  # Exponential backoff
                        else:
                            raise e  # If the error is not a lock, re-raise
            # Commit only once outside the loop after all batches are inserted
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise