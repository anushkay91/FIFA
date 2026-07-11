# Use an official Python runtime
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source folders
COPY backend/ /app/backend/
COPY frontend/dist/ /app/frontend/dist/

# Expose Cloud Run injected port variable
ENV PORT=8080
EXPOSE 8080

# Run FastAPI via Uvicorn
CMD exec uvicorn backend.main:app --host 0.0.0.0 --port $PORT
