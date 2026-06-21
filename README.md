# Customer Analytic CRM

Single Vercel deployment for the React CRM frontend and FastAPI backend.

## Project Layout

- `frontend/` - Vite React application
- `api/` - FastAPI serverless API for Vercel
- `vercel.json` - Vercel build, output, and route configuration
- `requirements.txt` - Python dependencies needed by the deployed API
- `requirements-legacy.txt` - old local/Streamlit dependencies kept for reference

## Vercel Setup

Set the Vercel project Root Directory to the repository root, not `frontend`.

Required environment variable:

```text
GOOGLE_APPLICATION_CREDENTIALS_JSON
```

Use the full Google service account JSON as the value.

## Local Checks

```powershell
python -c "from api.main import app; print(app.title)"
cd frontend
npm ci
npm.cmd run build
```

## Production Routes

- `/` serves the React app
- `/api/health` checks the FastAPI backend
- `/api/login`, `/api/bootstrap`, `/api/potentials/*`, and `/api/daily-plan` are handled by FastAPI
