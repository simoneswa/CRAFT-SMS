FROM python:3.11-slim

# Labels for Cloud Run / GCP traceability
LABEL maintainer="craft-sms" \
      service="craft-sms-backend" \
      runtime="python3.11"

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

# Create a non-root user for security hardening
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code (excluding files in .dockerignore)
COPY . .

# Transfer ownership to non-root user
RUN chown -R appuser:appgroup /app
USER appuser

# Health check — Cloud Run requires this to declare liveness
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/health')"

# Run the FastAPI application using uvicorn
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT}
