import sqlite3
from app.config import DevelopmentConfig, Config

def populate_wikidict():
    conn = sqlite3.connect(DevelopmentConfig.DB_PATH)
    cursor = conn.cursor()
    
    # Parse file
    entries_data = []
    with open(Config.WIKI_DICT_PATH, 'r', encoding='utf-8') as file:
        content = file.read()
        lines = content.split('\n')
        
        for line in lines:
            parts = line.strip().split('\t')
            # Initialize missing parts as None
            word = parts[0] if len(parts) > 0 else None
            original_form = parts[1] if len(parts) > 1 else None
            definition = parts[2] if len(parts) > 2 else None
            inflection = parts[3] if len(parts) > 3 else None
            
            # Skip entries without a word or definition
            if not word or not definition:
                continue
            
            entries_data.append({
                'word': word,
                'original_form': original_form,
                'definition': definition,
                'inflection': inflection
            })

    # Remove duplicates based on 'word' and prepare for insertion
    unique_entries = {entry['word']: entry for entry in entries_data}.values()
    entries_to_insert = [
        (entry['word'], entry['original_form'], entry['definition'], entry['inflection']) for entry in unique_entries
    ]
    
    cursor.executemany('INSERT OR IGNORE INTO wiki_dict_entry (word, original_form, definition, inflection) VALUES (?, ?, ?, ?)', entries_to_insert)
    
    # Commit and clean up
    conn.commit()
    conn.close()