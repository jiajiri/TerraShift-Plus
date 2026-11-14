# syntax=docker/dockerfile:1
FROM python:3.12-slim AS backend

WORKDIR /app

# Prevent Python from writing .pyc and buffer logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.3

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN pip install "poetry==$POETRY_VERSION"

COPY pyproject.toml poetry.lock* README.md /app/
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root || true

COPY backend/ /app/backend/

EXPOSE 8000

CMD ["python3", "-m", "backend.app.main"]
