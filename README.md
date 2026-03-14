# Personalized Video Generator

FastAPI backend plus a Vite/React frontend for generating personalized Hindi videos through avatar and Remotion-based flows.

The backend currently supports:

1. Direct video generation with an existing `avatar_id`
2. Template-based video generation with an existing `template_id`
3. Cinematic Remotion generation with scene-based, lead-personalized MP4 output
4. Polling video status and saving metadata / downloaded MP4 output
5. Post-processing completed videos with branded logo overlays and styled burned-in subtitles

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
├── Remotion/
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
FFMPEG_BINARY=ffmpeg
REMOTION_DIR=Remotion
EDGE_TTS_BINARY=edge-tts
REMOTION_NPX_BINARY=npx
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

Remotion project:

```bash
cd /Users/aditya/Downloads/heygen_video_generator/Remotion
npm install
```

Optional local preview studio:

```bash
cd /Users/aditya/Downloads/heygen_video_generator/Remotion
npm run dev
```

Optional composition bundle smoke check:

```bash
cd /Users/aditya/Downloads/heygen_video_generator/Remotion
./node_modules/.bin/remotion bundle src/index.jsx /tmp/remotion-bundle
```

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
- `POST /generate/remotion`
- `GET /videos/{video_id}/status`
- `POST /videos/{video_id}/stylize`
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

## Example Remotion Request

```bash
curl -X POST http://127.0.0.1:8000/generate/remotion \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Ramesh Kumar",
    "lan": "LAN12345",
    "client_name": "ABC Finance",
    "tos": 38450,
    "loan_amount": 120000,
    "contact_details": "1800-123-456",
    "product_type": "loan",
    "language": "Hindi",
    "script_text": "नमस्ते {customer_name}। आपके {product_type} खाते {lan} के संबंध में यह एक महत्वपूर्ण औपचारिक सूचना है।"
  }'
```

## Example Styling Request

Use this after `/generate/direct?wait=false` has returned a `video_id` and the status endpoint shows it as completed.

```bash
curl -X POST http://127.0.0.1:8000/videos/VIDEO_ID/stylize \
  -F include_captions=true \
  -F subtitle_color=Yellow \
  -F subtitle_position=Bottom \
  -F transcript='नमस्ते रमेश कुमार। कृपया तुरंत भुगतान या संपर्क करें।' \
  -F logo_position='Top Right' \
  -F logo_opacity=80 \
  -F logo_file=@/absolute/path/to/logo.png
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
- Styled artifacts are served from `/artifacts/...` and written under `output/styled/`.
- Subtitle styling and logo overlay use local `ffmpeg`; the provider video is generated first and then post-processed.
- Remotion rendering uses the local [Remotion/](/Users/aditya/Downloads/heygen_video_generator/Remotion) project plus `edge-tts`.
- The Remotion composition is now a multi-scene cinematic timeline, not a static single-card template. It personalizes each lead through scene payloads, animated amount emphasis, subtitle-aware motion, and a CTA scene.
- `/generate/remotion` keeps the existing request shape. The backend enriches each lead record with `display_amounts`, `scene_payload`, `headline_text`, `cta_text`, and `urgency_level` before render.
- Single-brace placeholders like `{customer_name}` and shorthand aliases such as `{loan_amt}`, `{balance}`, `{helpline}`, and `{product}` are supported in Remotion script input.
- Local Remotion rendering depends on a working browser runtime. Bundling works with `remotion bundle`; full local MP4 rendering may require Chrome / Headless Shell availability on the machine.
- The frontend uses [Frontend/src/lib/api.ts](/Users/aditya/Downloads/heygen_video_generator/Frontend/src/lib/api.ts) for all backend calls.
