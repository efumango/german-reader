import pandas as pd
import matplotlib.pyplot as plt

# Load the CSV file
df = pd.read_csv('other-scripts/logging_plot/logging.csv')

# Convert the 'timestamp' column to datetime
df['timestamp'] = pd.to_datetime(df['timestamp'])

# Filter rows to keep only the relevant activities
df_filtered = df[df['activity'].str.contains('select dict to upload|dict processed')]

# Sort the dataframe by user and timestamp
df_filtered = df_filtered.sort_values(by=['user', 'timestamp'])

# Initialize lists to store the number of attempts and time differences
attempt_counts = []
process_times = []

# Iterate over the unique users
for user in df_filtered['user'].unique():
    user_df = df_filtered[df_filtered['user'] == user]
    
    # Initialize variables for tracking the first select dict timestamp
    first_select_time = None
    select_count = 0
    
    for index, row in user_df.iterrows():
        if 'select dict to upload' in row['activity']:
            if first_select_time is None:
                first_select_time = row['timestamp']
            select_count += 1
        elif 'dict processed' in row['activity']:
            if first_select_time is not None:
                process_time = (row['timestamp'] - first_select_time).total_seconds()
                attempt_counts.append(select_count)
                process_times.append(process_time)
                # Reset tracking variables for the next sequence
                first_select_time = None
                select_count = 0

# Remove outliers from process times
if process_times:
    Q1 = pd.Series(process_times).quantile(0.25)
    Q3 = pd.Series(process_times).quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    process_times = [x for x in process_times if lower_bound <= x <= upper_bound]

# Calculate the average processing time
if process_times:
    average_process_time = sum(process_times) / len(process_times)
else:
    average_process_time = None

# Print the average processing time
print(f"Average Processing Time (seconds): {average_process_time:.2f}" if average_process_time is not None else "No data available")

# Plot the number of attempts
plt.figure(figsize=(10, 5))
plt.hist(attempt_counts, bins=range(1, max(attempt_counts) + 2), edgecolor='black', align='left')
plt.xlabel('Number of Attempts')
plt.ylabel('Frequency')
plt.title('Distribution of Number of Attempts to Upload Dictionary')
plt.show()

# Plot the processing times
plt.figure(figsize=(10, 5))
plt.hist(process_times, bins=30, edgecolor='black')
plt.xlabel('Time to Process (seconds)')
plt.ylabel('Frequency')
plt.title('Distribution of Time to Process Dictionary')
plt.grid(True)
plt.xlim(left=0)  # Set the x-axis limit to start from 0
plt.show()
