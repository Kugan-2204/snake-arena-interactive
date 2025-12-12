# Stage 1: Build Frontend
FROM node:20-alpine as frontend-builder

WORKDIR /app/frontend
COPY Frontend/package*.json ./
RUN npm ci
COPY Frontend/ .
RUN npm run build

# Stage 2: Final Backend Image
FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Copy Backend dependency files
COPY Backend/pyproject.toml Backend/uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-install-project --no-dev

# Copy Backend code
COPY Backend/ .

# Copy built frontend assets from Stage 1
# We put them in a 'static' directory inside /app
COPY --from=frontend-builder /app/frontend/dist /app/static

# Expose port
EXPOSE 8000

# Run commands using the virtual environment created by uv
ENV PATH="/app/.venv/bin:$PATH"

# Startup command
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
