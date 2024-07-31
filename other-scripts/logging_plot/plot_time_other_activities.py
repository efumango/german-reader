import pandas as pd
import matplotlib.pyplot as plt

# Load the CSV file
df = pd.read_csv('other-scripts/logging_plot/logging.csv')

# Convert the 'timestamp' column to datetime
df['timestamp'] = pd.to_datetime(df['timestamp'])

# Define the activity keywords
activity_keywords = {
    'upload_file': 'upload file',
    'delete_file': 'delete file',
    'open_file': 'open file',
    'receive_lookup_results': 'receive lookup results',
    'receive_decompound_results': 'receive decompound results',
    'add_to_vocab': 'add to vocab',
    'delete_word': 'delete word',
    'remove_deduplicate': 'remove deduplicate',
    'edit': 'edit',
    'export': 'export'
}

# Initialize dictionaries to store time differences for each activity
time_differences = {key: [] for key in activity_keywords.keys()}

# Iterate over the unique users
for user in df['user'].unique():
    user_df = df[df['user'] == user].sort_values(by='timestamp')
    
    # Iterate through each row in the user's DataFrame
    for i in range(1, len(user_df)):
        current_row = user_df.iloc[i]
        previous_row = user_df.iloc[i - 1]
        
        current_activity = current_row['activity']
        current_timestamp = current_row['timestamp']
        
        previous_activity = previous_row['activity']
        previous_timestamp = previous_row['timestamp']
        
        # Determine if the current activity matches one of the keywords
        matched_key = None
        for key, keyword in activity_keywords.items():
            if current_activity.startswith(keyword):
                matched_key = key
                break
        
        if matched_key:
            # Calculate the time difference from the previous timestamp
            time_diff = (current_timestamp - previous_timestamp).total_seconds()
            time_differences[matched_key].append(time_diff)

# Remove outliers and calculate average time for each activity
average_times = {}

for key, times in time_differences.items():
    if len(times) > 1:
        Q1 = pd.Series(times).quantile(0.25)
        Q3 = pd.Series(times).quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        clean_times = [x for x in times if lower_bound <= x <= upper_bound]
    else:
        clean_times = times
    
    if clean_times:
        average_times[key] = sum(clean_times) / len(clean_times)
    else:
        average_times[key] = None

# Print the average times
print("Average Times for Activities (Outliers Removed):")
for key, avg_time in average_times.items():
    if avg_time is not None:
        print(f"{activity_keywords[key].capitalize()}: {avg_time:.2f} seconds")
    else:
        print(f"{activity_keywords[key].capitalize()}: No data")

# Plotting the time distributions for each activity
for key, times in time_differences.items():
    # Remove outliers
    if len(times) > 1:
        Q1 = pd.Series(times).quantile(0.25)
        Q3 = pd.Series(times).quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        clean_times = [x for x in times if lower_bound <= x <= upper_bound]
    else:
        clean_times = times
    
    plt.figure(figsize=(10, 5))
    plt.hist(clean_times, bins=30, edgecolor='black')
    plt.xlabel('Time (seconds)')
    plt.ylabel('Frequency')
    plt.title(f'Distribution of Time for {activity_keywords[key].capitalize()} (Outliers Removed)')
    plt.grid(True)
    plt.xlim(left=0)  # Set the x-axis limit to start from 0
    plt.tight_layout()

    # Save the plot to a file
    filename = f'{key}_time_distribution_no_outliers.png'
    plt.savefig(filename)
    plt.close()  # Close the figure to free up memory

print("Plots saved successfully.")
