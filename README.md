# Personalized Video Generator

FastAPI backend plus a Vite/React frontend for generating Hindi personalized videos through an external avatar video provider.

The backend currently supports:

1. Direct video generation with an existing `avatar_id`
2. Template-based video generation with an existing `template_id`
3. Polling video status and saving metadata / downloaded MP4 output

The active frontend lives in [Frontend/README.md](/Users/aditya/Downloads/heygen_video_generator/Frontend/README.md).

## Repo Layout

```text
heygen_video_generator/
├── app/
│   ├── config.py
│   ├── main.py
│   ├── models.py
│   ├── services/
│   └── templates/
├── Frontend/
├── input/
├── output/
├── sample_data/
├── scripts/
├── tests/
├── .env.example
├── Dockerfile
└── README.md
```

## Environment

Copy [.env.example](/Users/aditya/Downloads/heygen_video_generator/.env.example) to `.env` and fill in:

```env
HEYGEN_API_KEY=...
HEYGEN_AVATAR_ID=...
HEYGEN_VOICE_ID=...
HEYGEN_TEMPLATE_ID=...
HEYGEN_TEMPLATE_PAYLOAD_PATH=sample_data/template_payload.json
DEFAULT_VIDEO_WIDTH=1280
DEFAULT_VIDEO_HEIGHT=720
DEFAULT_BACKGROUND_COLOR=#F4F4F4
DEFAULT_OUTPUT_DIR=output
POLL_INTERVAL_SECONDS=8
POLL_TIMEOUT_SECONDS=1200
CORS_ALLOW_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

## Run Locally

Backend:

```bash
cd /Users/aditya/Downloads/heygen_video_generator
python3.11 -m venv .venv311
source .venv311/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd /Users/aditya/Downloads/heygen_video_generator/Frontend
npm install
npm run dev
```

Open `http://127.0.0.1:8080`.

If you want the frontend to call a custom backend directly, copy [Frontend/.env.example](/Users/aditya/Downloads/heygen_video_generator/Frontend/.env.example) to `Frontend/.env` and set `VITE_API_BASE_URL`.

## Docker

Backend image:

```bash
cd /Users/aditya/Downloads/heygen_video_generator
docker build -t personalized-video-backend .
docker run --rm \
  -p 8000:8000 \
  --env-file .env \
  -v "$(pwd)/input:/app/input" \
  -v "$(pwd)/output:/app/output" \
  personalized-video-backend
```

Frontend image:

```bash
cd /Users/aditya/Downloads/heygen_video_generator/Frontend
docker build -t personalized-video-frontend .
docker run --rm -p 8080:80 personalized-video-frontend
```

The frontend Docker build currently defaults `VITE_API_BASE_URL` to `http://13.127.221.158:8000`.
To override it at build time:

```bash
docker build --build-arg VITE_API_BASE_URL=http://127.0.0.1:8000 -t personalized-video-frontend .
```

If you build the frontend with `VITE_API_BASE_URL=/api`, the bundled Nginx config can proxy `/api` requests to `BACKEND_ORIGIN`.

## API Endpoints

- `GET /health`
- `GET /meta/avatars`
- `GET /meta/voices`
- `GET /meta/templates`
- `GET /meta/template/{template_id}`
- `POST /generate/direct`
- `GET /videos/{video_id}/status`
- `POST /generate/template`

## Example Direct Request

```bash
curl -X POST http://127.0.0.1:8000/generate/direct?wait=true \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Ramesh Kumar",
    "lan": "LAN12345",
    "client_name": "ABC Finance",
    "tos": 38450,
    "loan_amount": 120000,
    "contact_details": "1800-123-456",
    "template_name": "legal_notice_safe_hi.txt"
  }'
```

## Example Template Request

```bash
curl -X POST http://127.0.0.1:8000/generate/template?wait=true \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Ramesh Kumar",
    "lan": "LAN12345",
    "client_name": "ABC Finance",
    "tos": 38450,
    "loan_amount": 120000
  }'
```

## Account Inspection

```bash
source .venv311/bin/activate
python scripts/inspect_account.py avatars
python scripts/inspect_account.py voices
python scripts/inspect_account.py templates
python scripts/get_template_details.py YOUR_TEMPLATE_ID --version v3
```

## Tests

```bash
cd /Users/aditya/Downloads/heygen_video_generator
source .venv311/bin/activate
PYTHONPATH=. pytest -q
```

## Notes

- The Hindi transcript templates live in [app/templates/legal_notice_raw_hi.txt](/Users/aditya/Downloads/heygen_video_generator/app/templates/legal_notice_raw_hi.txt) and [app/templates/legal_notice_safe_hi.txt](/Users/aditya/Downloads/heygen_video_generator/app/templates/legal_notice_safe_hi.txt).
- Output metadata and downloaded videos are written under `output/`.
- The frontend uses [Frontend/src/lib/api.ts](/Users/aditya/Downloads/heygen_video_generator/Frontend/src/lib/api.ts) for all backend calls.
