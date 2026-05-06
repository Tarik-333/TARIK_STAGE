# Use Python 3.11
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Expose the port Hugging Face uses
EXPOSE 7860

# Command to run the application
# We use 0.0.0.0 to allow external connections and port 7860 for Hugging Face
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
