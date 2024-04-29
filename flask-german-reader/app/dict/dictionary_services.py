import os
import psycopg2
from app.config import ProductionConfig

def process_chunk(chunk_path, user_identity):
    # Connect to the PostgreSQL database
    conn = psycopg2.connect(ProductionConfig.SQLALCHEMY_DATABASE_URI)
    cursor = conn.cursor()

    # Check user exists
    cursor.execute('SELECT id FROM "user" WHERE id = %s', (user_identity,))
    if cursor.fetchone() is None:
        raise Exception('User not found')

    # Parse file
    entries_data = []
    with open(chunk_path, 'r', encoding='utf-8') as file:
        content = file.readlines()
        
    for line in content:
        if line.startswith('#'):  # Skipping comment lines
            continue
        parts = line.strip().split('\t')
        if len(parts) < 2:  # Ensure there's at least a word and definition
            continue
        word, definition = parts[0], parts[1]
        entries_data.append((word, None, definition, None, 'custom'))

    # Insert unique words using ON CONFLICT to ignore duplicates
    insert_query = """
        INSERT INTO dictionary_entry (word, original_form, definition, inflection, source) 
        VALUES (%s, %s, %s, %s, %s) ON CONFLICT (word) DO NOTHING
    """
    cursor.executemany(insert_query, entries_data)
    conn.commit()

    # Fetch entry_ids for all words in this batch
    words = tuple(entry[0] for entry in entries_data)  # Make a tuple for SQL IN clause
    cursor.execute("""
        SELECT id, word FROM dictionary_entry WHERE word IN %s
    """, (words,))
    word_to_entry_id = {word: entry_id for entry_id, word in cursor.fetchall()}

    # Prepare UserDictionaryMapping
    mappings_data = [
        (user_identity, word_to_entry_id[word]) for word in words if word in word_to_entry_id
    ]
    insert_mapping_query = """
        INSERT INTO user_dictionary_mapping (user_id, entry_id) 
        VALUES (%s, %s) ON CONFLICT (user_id, entry_id) DO NOTHING
    """
    cursor.executemany(insert_mapping_query, mappings_data)
    conn.commit()

    # Close the cursor and connection
    cursor.close()
    conn.close()

    # Remove the chunk file
    os.remove(chunk_path)
