# Snake Arena Backend

FastAPI backend for Snake Arena.

## Setup

1.  Navigate to the directory:
    ```bash
    cd Backend
    ```

2.  Sync dependencies (using `uv`):
    ```bash
    uv sync
    ```

## Running the Server

Start the development server with live reload:

```bash
uv run uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.
Docs are available at `http://localhost:8000/docs`.

## Running Tests

Run the test suite:

```bash
uv run python -m pytest
```
