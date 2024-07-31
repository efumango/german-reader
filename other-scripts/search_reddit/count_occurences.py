import pandas as pd
import re
from collections import Counter

# Load the list of app names from a .txt file
with open('output/reading_app_names.txt', 'r') as file:
    app_names = [line.strip() for line in file]

# Load the CSV file
df = pd.read_csv('output/reddit_posts.csv')

# Combine posts and comments into a single text column
df['text'] = df['Body'].fillna('') + ' ' + df['Comments'].fillna('')

# Preprocess the text: make lowercase for case-insensitive matching
df['text'] = df['text'].str.lower()

# Count the occurrences of each app name
def count_occurrences(text, app_names):
    word_counts = Counter(re.findall(r'\b\w+\b', text))
    return {app_name.lower(): word_counts[app_name.lower()] for app_name in app_names}

# Apply the counting function to the dataframe
app_occurrences = df['text'].apply(lambda x: count_occurrences(x, app_names))

# Sum the occurrences for each app name
total_counts = Counter()
for occurrences in app_occurrences:
    total_counts.update(occurrences)

# Convert the counts to a DataFrame and save to CSV
app_counts_df = pd.DataFrame.from_dict(total_counts, orient='index', columns=['count']).reset_index()
app_counts_df = app_counts_df.rename(columns={'index': 'app_name'})
app_counts_df.to_csv('output/reading_app_name_occurrences.csv', index=False)

print(app_counts_df)
