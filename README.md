# Semantic Book Recommender

Modern web application that pairs a semantic-search backend with a glassmorphic React frontend to surface book recommendations that match a reader's curiosity, tone preference, and genre interests.

<img width="1680" height="930" alt="Screenshot 2025-10-27 at 11 33 59 PM" src="https://github.com/user-attachments/assets/75891fe4-8567-4bec-acf3-6fbfd893cfe1" />



## Features
- Natural-language search turns plain-text prompts into book matches using dense vector similarity.
- Mood and genre filters refine results by tone tags (e.g., uplifting, dark) and curated category facets.
- Detailed book view highlights cover, synopsis, publication metadata, and one-click Amazon search links.
- Responsive, modern UI built with Tailwind CSS, glass panels, and animated gradients.
- Local embeddings cache via ChromaDB keeps 5k+ titles searchable offline and can be expanded to tens of thousands.

## Project Layout

```
book-recommender/
├── backend_api.py          # FastAPI service exposing /filters and /recommendations
├── db-books/               # ChromaDB store (persisted vectors and metadata)
├── semantic-book-ui/       # Vite + React frontend
├── books_cleaned.csv       # Preprocessed catalog data
├── books_with_emotions.csv # Tone-labelled dataset
└── notebooks/...           # Data exploration and model experiments
```

## Technology Stack
- **Backend**: FastAPI, Python 3.11, Pandas, ChromaDB, sentence-transformers/OpenAI embeddings (pluggable).
- **Frontend**: React 18, Vite, Tailwind CSS, Axios.
- **Infra**: Docker (optional), Render/Railway/Fly compatible deployment, persistent volume for ChromaDB.
- **Tooling**: npm for UI dependency management, pip/uvicorn for API runtime.

## Prerequisites
- Python 3.11+
- Node.js 18+
- npm or pnpm
- (Optional) Docker for containerized deployment
- OpenAI API key or compatible embedding model credentials if you plan to regenerate vectors.

## Backend Setup
1. Create and activate a virtual environment.
	```bash
	python3 -m venv .venv
	source .venv/bin/activate
	```
2. Install Python dependencies.
	```bash
	pip install -r requirements.txt
	```
3. Copy `.env.example` (create one if missing) to `.env` and set values:
	- `OPENAI_API_KEY` (if used)
	- `CHROMA_PATH=./db-books`
	- `CORS_ORIGINS=http://localhost:5173`
4. Start the API.
	```bash
	uvicorn backend_api:app --reload --host 0.0.0.0 --port 8000
	```

API endpoints:
- `GET /filters` returns available categories and tone tags.
- `POST /recommendations` accepts `{ query, category, tone }` and returns ranked books.

## Frontend Setup
1. Install packages.
	```bash
	cd semantic-book-ui
	npm install
	```
2. Create `semantic-book-ui/.env` (or `.env.local`).
	```bash
	VITE_API_BASE_URL=http://localhost:8000
	```
3. Run the dev server.
	```bash
	npm run dev
	```
4. Open the UI at the URL Vite prints (default `http://localhost:5173`).

To build for production:
```bash
npm run build
npm run preview  # optional sanity check
```

## Data & Embeddings
- Base catalog: `books_cleaned.csv`
- Emotional tone annotations: `books_with_emotions.csv`
- The persisted vector store lives under `db-books/`. If you regenerate embeddings, keep the same path or update `CHROMA_PATH`.
- To scale beyond 5k titles, ingest additional metadata, compute embeddings, and append to the Chroma collection (see notebooks for examples).

## Development Workflow
- `npm run lint` (add ESLint config if desired) for the frontend.
- Write unit or integration tests (e.g., Vitest for React, pytest for FastAPI) as you extend functionality.
- Use feature branches and pull requests; CI can run lint, tests, and `npm run build` / `pytest`.

## Deployment (Render Example)
1. Push repository to GitHub.
2. **Backend**: create a Render Web Service pointing to repo root. Build command `pip install -r requirements.txt`; start command `uvicorn backend_api:app --host 0.0.0.0 --port 10000`. Attach a persistent disk at `/var/data/chroma` and set `CHROMA_PATH=/var/data/chroma`.
3. Upload the contents of `db-books/` to the mounted disk via Render shell (or recreate embeddings at runtime).
4. **Frontend**: create Render Static Site pointing to `semantic-book-ui/`, build command `npm install && npm run build`, publish directory `dist`. Set `VITE_API_BASE_URL` to the backend Render URL.
5. Configure CORS in FastAPI to allow the frontend host. Verify end-to-end requests succeed.
6. Add custom domains and TLS in Render settings if needed.

Other hosts (Railway, Fly.io, Netlify + backend) work with similar steps—ensure the API has persistent storage and the frontend references the deployed API URL.

## Troubleshooting
- **CORS errors**: confirm `CORS_ORIGINS` includes the frontend origin and restart the backend.
- **No results**: ensure the Chroma DB path is correct and embeddings exist; rerun ingestion notebook if needed.
- **UI build fails**: reinstall dependencies (`rm -rf node_modules && npm install`) or clear Vite cache.
- **Backend crashes on startup**: check `.env` values and Python dependency versions; verify embeddings model availability.

## Roadmap
- Expand dataset to 35k+ titles (automated ingestion scripts, scheduled refresh).
- Add tone visualizations and related-picks carousel in the UI.
- Introduce user accounts and saved reading lists.
- Containerize with Docker Compose for one-command local setup.

## License
This project is released under the MIT License. See `LICENSE` for details.

## Acknowledgements
- Inspired by the FreeCodeCamp semantic search tutorial by Patrick Loeber.
- Book metadata initially derived from the Kaggle dataset “7k+ Books With Metadata” by Dylan J. Castillo.
- Emotion analysis model based on work by J. Hartmann (`distilroberta-base-finetuned-emotion`).
