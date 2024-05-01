# Use an official Python runtime as a base image
FROM python:3.11

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install -r requirements.txt

# Make port 5000 available to the world outside this container
EXPOSE 5000

# Define environment variable
ENV NAME World
ENV PYTHONPATH=/app

# Run app.py when the container launches
CMD ["gunicorn", "--workers=1", "--bind=0.0.0.0:5000", "app.app:app"]
