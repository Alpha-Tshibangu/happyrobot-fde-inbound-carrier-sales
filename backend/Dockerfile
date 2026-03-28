FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create database directory for persistent volume
RUN mkdir -p /data

# Create a non-root user and give ownership
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app && \
    chown -R appuser:appuser /data
USER appuser

# Set environment variable for database location
ENV DATABASE_URL=sqlite:////data/happyrobot.db

# Expose port (Fly.io uses 8080 internally)
EXPOSE 8080

# Run the application on port 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]