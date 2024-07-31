import praw
import pandas as pd

# Step 1: Set up Reddit API credentials
client_id = 'qQNzeqPDMJs4Cr3tqBCdjw'  
client_secret = '8w5QdtLAYz_R9b48PmKEulLmRemumg'  
user_agent = 'my_german_reading_app_scraper/0.1 by OwnDefinition6356'  

# Step 2: Initialize Reddit instance
reddit = praw.Reddit(
    client_id=client_id,
    client_secret=client_secret,
    user_agent=user_agent
)

# Step 3: Define the subreddit and search query
subreddit_name = 'languagelearning'
search_query = 'German reading app'

# Step 4: Search for posts
posts = []
total_comments = 0

for submission in reddit.subreddit(subreddit_name).search(search_query, limit=100):
    submission.comments.replace_more(limit=0)  # Expand all comments
    comments = [comment.body for comment in submission.comments.list()]
    posts.append([submission.title, submission.selftext, submission.url, submission.score, submission.num_comments, comments])
    total_comments += len(comments)

# Step 5: Create a DataFrame and save to CSV
df = pd.DataFrame(posts, columns=['Title', 'Body', 'URL', 'Score', 'Comments Count', 'Comments'])
df.to_csv('output/reddit_posts.csv', index=False)

# Count the number of posts and comments
total_posts = len(posts)

print("Scraping complete. Data saved to reddit_posts.csv.")
print(f"Total number of posts: {total_posts}")
print(f"Total number of comments: {total_comments}")
