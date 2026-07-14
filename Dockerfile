# Stage 1: Build the React frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Final lightweight runner stage with Python backend
FROM python:3.11-slim
WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend codebase
COPY backend/ /app/backend/

# Copy built frontend assets from the builder stage
COPY --from=frontend-builder /app/frontend/dist/ /app/frontend/dist/

# Expose Cloud Run injected port variable
ENV PORT=8080
EXPOSE 8080

# Run FastAPI via Uvicorn
CMD exec uvicorn backend.main:app --host 0.0.0.0 --port $PORT
