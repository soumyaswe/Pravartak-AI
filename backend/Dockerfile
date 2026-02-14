# Python Flask SocketIO Backend for AI Interviewer Avatar
# Optimized for Cloud Run deployment

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for Google Cloud clients
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY server_ai_interviewer.py .

# Create directory for audio files
RUN mkdir -p audio_files

# Create a non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PRODUCTION=1

# Expose port (Cloud Run will inject PORT env var dynamically)
EXPOSE 8080

# Health check (uses PORT 8080 as default, but Cloud Run will override)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python -c "import requests, os; requests.get(f'http://localhost:{os.environ.get(\"PORT\", \"8080\")}/health', timeout=5)"

# Run with gunicorn for production (Cloud Run compatible)
CMD exec gunicorn --worker-class geventwebsocket.gunicorn.workers.GeventWebSocketWorker \
  --workers 1 \
  --bind 0.0.0.0:$PORT \
  --timeout 300 \
  --keep-alive 5 \
  --log-level info \
  --access-logfile - \
  --error-logfile - \
  server_ai_interviewer:app
