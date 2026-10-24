FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (libgomp1 required for LightGBM)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY services/api/requirements.txt /app/services/api/requirements.txt
COPY packages/impactmap_core /app/packages/impactmap_core

RUN pip install --no-cache-dir -r /app/services/api/requirements.txt \
    && pip install --no-cache-dir -e /app/packages/impactmap_core --no-deps

COPY . /app

ENV PORT=8000
ENV PYTHONUNBUFFERED=1
EXPOSE 8000

CMD ["sh", "-c", "uvicorn services.api.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
