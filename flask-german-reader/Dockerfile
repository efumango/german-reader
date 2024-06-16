# Use an official Python runtime as a base image
FROM python:3.11-slim

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install git
RUN apt-get update && apt-get install -y git

# Install needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Make port 5000 available to the world outside this container
EXPOSE 5000

# Define environment variable
ENV NAME World
ENV PYTHONPATH=/app
ENV FLASK_APP=app.app:app

# Run app.py when the container launches
CMD ["gunicorn", "--workers=3", "--bind=0.0.0.0:5000", "app.app:app"]
