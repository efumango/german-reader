import shutil
from flask import current_app
from celery_utils import celery
from werkzeug.utils import secure_filename
from models import User, UserDictionaryMapping, DictionaryEntry
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import OperationalError
from extensions import db
import time
import os
from global_sessions import upload_sessions

#@celery.task(bind=True)
def process_chunk_async(chunk_path, user_identity, uuid, total_chunks):
    user = User.query.filter_by(id=user_identity).first()
    if not user:
        raise Exception('User not found')

    session = upload_sessions.setdefault(uuid, {
        'processed_chunks': 0, 
        'total_chunks': total_chunks, 
        'complete': False, 
        'last_line': ''
    })

    # Parse chunks
    entries_data = []
    with open(chunk_path, 'r', encoding='utf-8') as file:
        content = session['last_line'] + file.read()
        lines = content.split('\n')
        
        # Check if the last line in this chunk is complete
        if not content.endswith('\n'):
            # Save the last line to append to the next chunk
            session['last_line'] = lines[-1]
            # Remove the last, incomplete line from processing in this chunk
            lines = lines[:-1]
        else:
            # If the chunk ends with a newline, don't carry over any data
            session['last_line'] = ''
        
        for line in lines:
            if line.startswith('#'):  # Skipping comment lines
                continue
            parts = line.strip().split('\t')
            if len(parts) < 2:  # Ensure there's at least a word and definition
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
                stmt = insert(DictionaryEntry).values(batch).on_conflict_do_nothing(index_elements=['word'])
                
                retries = 5
                backoff = 1

                for attempt in range(retries):
                    try:
                        db.session.execute(stmt)
                        db.session.flush()  # Flush here to ensure entries are processed for mapping
                        mappings_data = []
                        for entry in batch:
                            # Query the database for the ID of the entry that has the word we're processing
                            entry_obj = DictionaryEntry.query.with_for_update().filter_by(word=entry['word']).first()
                            if entry_obj:
                                mapping_exists = UserDictionaryMapping.query.filter_by(
                                    user_id=user.id, 
                                    entry_id=entry_obj.id
                                ).first() is not None
                                
                                if not mapping_exists:
                                    mappings_data.append({'user_id': user.id, 'entry_id': entry_obj.id})

                        # After the loop, perform the bulk insert for UserDictionaryMapping with on_conflict_do_nothing
                        if mappings_data:
                            stmt = insert(UserDictionaryMapping).values(mappings_data).on_conflict_do_nothing(index_elements=['user_id', 'entry_id'])
                            db.session.execute(stmt)

                            break  # If successful, break out of the retry loop
                    except OperationalError as e:
                        if 'database is locked' in str(e):
                            time.sleep(backoff)
                            backoff *= 2  # Exponential backoff
                        else:
                            raise e  # If the error is not a lock, re-raise
                
        
            # Commit once after all batches and mappings are processed
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e
        
    update_upload_session(uuid, total_chunks)

def update_upload_session(uuid, total_chunks):
    # Get or initialize session
    session = upload_sessions.setdefault(uuid, {'processed_chunks': 0, 'total_chunks': total_chunks, 'complete': False, 'last_line': ''})
    
    # Update processed chunk count
    session['processed_chunks'] += 1
    
    # Check if all chunks are processed
    if session['processed_chunks'] == session['total_chunks']:
        session['complete'] = True
        finalize_upload_async(uuid)

#@celery.task(bind=True)
def finalize_upload_async(uuid):
    session = upload_sessions.get(uuid)
    if session and session['complete']:
        # Cleanup temporary files
        temp_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], uuid)
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
            
        # Delete the session from the tracking mechanism
        del upload_sessions[uuid]
