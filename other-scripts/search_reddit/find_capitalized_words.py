import pandas as pd
import re

# Load the CSV file
df = pd.read_csv('reddit_posts.csv')

# Combine posts and comments into a single text column
df['text'] = df['Body'].fillna('') + ' ' + df['Comments'].fillna('')

# Extract capitalized words
def extract_capitalized_words(text):
    return re.findall(r'\b[A-Z][a-zA-Z]*\b', text)

df['capitalized_words'] = df['text'].apply(extract_capitalized_words)

# Deduplicate and flatten the list of capitalized words
all_capitalized_words = set(word for sublist in df['capitalized_words'] for word in sublist)

# Write the results to a CSV file
capitalized_words_df = pd.DataFrame(list(all_capitalized_words), columns=['Capitalized words'])
capitalized_words_df.to_csv('output/capitalized_words.csv', index=False)

