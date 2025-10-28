# syntax=docker/dockerfile:1.5
FROM python:3.11-slim AS backend

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system packages needed by pandas/numpy
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend_api.py ./
COPY books_with_emotions.csv ./
COPY cover-not-found.jpg ./

# Copy any other runtime assets (e.g., data cleaning scripts, GIF)
COPY book-reco.gif ./book-reco.gif

# Default environment configuration; override via Fly secrets in production
ENV PORT=8000 \
    CHROMA_PATH=/data/chroma \
    CORS_ORIGINS=http://localhost:5173

# Ensure the persistence directory exists (will be replaced by Fly volume)
RUN mkdir -p ${CHROMA_PATH}

EXPOSE ${PORT}

CMD ["uvicorn", "backend_api:app", "--host", "0.0.0.0", "--port", "8000"]
