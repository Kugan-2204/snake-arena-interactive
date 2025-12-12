.PHONY: install run test clean

install:
	uv sync

run:
	uv run uvicorn main:app --reload

test:
	uv run python -m pytest

clean:
	rm -rf __pycache__
	rm -rf .pytest_cache
	rm -rf .venv

init-db:
	uv run python -c "import asyncio; from database import init_db; asyncio.run(init_db())"

