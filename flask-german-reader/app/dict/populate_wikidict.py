import psycopg2
from app.config import ProductionConfig

def populate_wikidict():
    # Connect to the PostgreSQL database
    conn = psycopg2.connect(ProductionConfig.SQLALCHEMY_DATABASE_URI)
    cursor = conn.cursor()
    
    # Parse file
    entries_data = []
    with open(ProductionConfig.WIKI_DICT_PATH, 'r', encoding='utf-8') as file:
        content = file.read()
        lines = content.split('\n')
        
        for line in lines:
            parts = line.strip().split('\t')
            word = parts[0] if len(parts) > 0 else None
            original_form = parts[1] if len(parts) > 1 else None
            definition = parts[2] if len(parts) > 2 else None
            inflection = parts[3] if len(parts) > 3 else None
            
            # Skip entries without a word or definition
            if not word or not definition:
                continue
            
            entries_data.append({
                'word': word,
                'original_form': original_form or None,
                'definition': definition,
                'inflection': inflection or None,
                'source': 'prepared'
            })

    # Remove duplicates based on 'word' and prepare for insertion
    unique_entries = {entry['word']: entry for entry in entries_data}.values()
    entries_to_insert = [
        (entry['word'], entry['original_form'], entry['definition'], entry['inflection'], entry['source']) for entry in unique_entries
    ]
    
    # Prepare the SQL command to insert data, handling duplicates using ON CONFLICT
    insert_query = '''
    INSERT INTO dictionary_entry (word, original_form, definition, inflection, source)
    VALUES (%s, %s, %s, %s, %s)
    ON CONFLICT (word) DO NOTHING;
    '''
    cursor.executemany(insert_query, entries_to_insert)
    
    # Commit and clean up
    conn.commit()
    conn.close()
