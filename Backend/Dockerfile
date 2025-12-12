FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies using uv
# --frozen ensures we stick to the lockfile
# --no-install-project skips installing the package itself (we just want deps)
# --no-dev excludes dev dependencies
RUN uv sync --frozen --no-install-project --no-dev

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Startup command
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
