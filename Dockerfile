# Build frontend
FROM node:20-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production server
FROM python:3.12-slim
WORKDIR /app
COPY server/requirements.txt server/requirements.txt
RUN pip install --no-cache-dir -r server/requirements.txt
COPY server/ server/
COPY alembic.ini alembic.ini
COPY --from=frontend /app/dist dist/
CMD sh -c "python -m uvicorn server.main:app --host 0.0.0.0 --port ${PORT:-8000}"
