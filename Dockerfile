# Dockerfile at ROOT for Hugging Face
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy everything from the local directory
COPY . .

# Move into the backend directory
WORKDIR /app/backend

# Set environment variable to include current directory in Python path
ENV PYTHONPATH=/app/backend

EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
