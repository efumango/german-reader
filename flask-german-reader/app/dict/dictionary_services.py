import os
import sqlite3
from app.models import User
from app.config import DevelopmentConfig

def process_chunk(chunk_path, user_identity):
    conn = sqlite3.connect(DevelopmentConfig.DB_PATH)
    cursor = conn.cursor()
    
    user = User.query.filter_by(id=user_identity).first()
    if not user:
        raise Exception('User not found')

    # Parse file
    entries_data = []
    with open(chunk_path, 'r', encoding='utf-8') as file:
        content = file.read()
        lines = content.split('\n')
        
        for line in lines:
            if line.startswith('#'):  # Skipping comment lines
                continue
            parts = line.strip().split('\t')
            if len(parts) < 2:  # Ensure there's at least a word and definition
                continue
            word, definition = parts[0], parts[1]
            entries_data.append({
                'word': word,
                'original_form': None,
                'definition': definition,
                'inflection': None,
                'source': 'custom'
            })

    unique_entries = {entry['word']: entry for entry in entries_data}.values()

    # Insert unique words
    entries_to_insert = [
        (entry['word'], entry['original_form'], entry['definition'], entry['inflection'], entry['source']) for entry in unique_entries
    ]
    
    cursor.executemany('INSERT OR IGNORE INTO dictionary_entry (word, original_form, definition, inflection, source) VALUES (?, ?, ?, ?, ?)', entries_to_insert)
    
    # Fetch entry_ids for all words in this batch
    words = [entry['word'] for entry in unique_entries]
    cursor.execute('SELECT id, word FROM dictionary_entry WHERE word IN ({seq})'.format(seq=','.join(['?']*len(words))), words)
    word_to_entry_id = {word: entry_id for entry_id, word in cursor.fetchall()}
    
    # Prepare UserDictionaryMapping
    mappings_to_insert = []
    for entry in unique_entries:
        entry_id = word_to_entry_id.get(entry['word'])
        if entry_id:
            mappings_to_insert.append((user_identity, entry_id))
    
    cursor.executemany('INSERT OR IGNORE INTO user_dictionary_mapping (user_id, entry_id) VALUES (?, ?)', mappings_to_insert)

    # Commit and clean up
    conn.commit()
    conn.close()
    os.remove(chunk_path)

  