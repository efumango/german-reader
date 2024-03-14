from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import OperationalError
from models import DictionaryEntry, UserDictionaryMapping, User
from extensions import db
import time

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
            entries_data.append({
                'word': word,
                'definition': definition,
            })

    batch_size = 500 
    if entries_data:
        try:
            for i in range(0, len(entries_data), batch_size):
                batch = entries_data[i:i+batch_size]
                stmt = insert(DictionaryEntry).values(batch).on_conflict_do_nothing(index_elements=['word', 'definition'])
                
                retries = 5
                backoff = 1

                for attempt in range(retries):
                    try:
                        db.session.execute(stmt)
                        db.session.flush()  # Flush here to ensure entries are processed for mapping
                        break  # If successful, break out of the retry loop
                    except OperationalError as e:
                        if 'database is locked' in str(e):
                            time.sleep(backoff)
                            backoff *= 2  # Exponential backoff
                        else:
                            raise e  # If the error is not a lock, re-raise
                
                # Prepare data for UserDictionaryMapping batch
                mappings_data = []
                for entry in batch:
                    entry_obj = DictionaryEntry.query.filter_by(word=entry['word'], definition=entry['definition']).first()
                    if entry_obj:
                        # Check if mapping already exists to avoid duplicates
                        mapping_exists = UserDictionaryMapping.query.filter_by(user_id=user.id, entry_id=entry_obj.id).first() is not None
                        if not mapping_exists:
                            mappings_data.append({'user_id': user.id, 'entry_id': entry_obj.id})

                # Bulk insert mappings for the current batch
                if mappings_data:
                    db.session.bulk_insert_mappings(UserDictionaryMapping, mappings_data)
                    db.session.flush()  # Flush here to ensure mappings are processed before committing

            # Commit once after all batches and mappings are processed
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e
