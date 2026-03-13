# HeyGen Personalized Video Generator

Production-oriented starter pack for **non-conversational personalized Hindi videos** using the HeyGen paid API.

It supports two practical modes:

1. **Direct video generation** using an existing `avatar_id` and optional `voice_id`
2. **Template-based generation** using an existing HeyGen `template_id`

This repo is designed for your loan-recall / collections communication flow:

- lead table ingestion from CSV/XLSX
- strict validation for required variables
- script rendering with placeholders
- async polling until video completes
- MP4 download + metadata save

## Folder structure

```text
heygen_video_generator/
├── app/
│   ├── assets/
│   │   └── avatar_source.png
│   ├── services/
│   │   ├── heygen_client.py
│   │   ├── leads_service.py
│   │   ├── script_renderer.py
│   │   └── video_service.py
│   ├── templates/
│   │   ├── legal_notice_raw_hi.txt
│   │   └── legal_notice_safe_hi.txt
│   ├── config.py
│   ├── main.py
│   └── models.py
├── output/
├── sample_data/
│   ├── leads.csv
│   └── template_payload.json
├── scripts/
│   ├── generate_from_csv.py
│   ├── get_template_details.py
│   └── inspect_account.py
├── tests/
│   └── test_validation.py
├── .env.example
├── requirements.txt
└── README.md
```

## What you need in HeyGen first

### Option A — direct mode
Use this if you already have a **Photo Avatar / Digital Twin / Avatar ID** in HeyGen.

Set in `.env`:

```env
HEYGEN_API_KEY=...
HEYGEN_AVATAR_ID=...
HEYGEN_VOICE_ID=...
```

### Option B — template mode
Use this if you created a template in HeyGen Studio and want to replace variables like:

- `customer_name`
- `lan`
- `client_name`
- `tos`
- `loan_amount`

Set in `.env`:

```env
HEYGEN_API_KEY=...
HEYGEN_TEMPLATE_ID=...
HEYGEN_TEMPLATE_PAYLOAD_PATH=sample_data/template_payload.json
```

Then edit `sample_data/template_payload.json` to match your real template payload shape from HeyGen.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Update `.env` with your HeyGen API key and IDs.

## Check your account resources

List avatars:

```bash
python scripts/inspect_account.py avatars
```

List voices:

```bash
python scripts/inspect_account.py voices
```

List templates:

```bash
python scripts/inspect_account.py templates
```

Fetch template details:

```bash
python scripts/get_template_details.py YOUR_TEMPLATE_ID --version v3
```

## Run local API

```bash
uvicorn app.main:app --reload
```

## Run the wizard frontend

```bash
cd avatar-studio-wizard-main
npm install
npm run dev
```

By default the Vite app runs on `http://127.0.0.1:8080` and proxies `/api/*` calls to the FastAPI server on `http://127.0.0.1:8000`.
If you want the frontend to call FastAPI directly instead, copy `avatar-studio-wizard-main/.env.example` to `avatar-studio-wizard-main/.env` and set `VITE_API_BASE_URL`.

Useful endpoints:

- `GET /health`
- `GET /meta/avatars`
- `GET /meta/voices`
- `GET /meta/templates`
- `GET /meta/template/{template_id}`
- `POST /generate/direct`
- `POST /generate/template`

## Generate one direct video

```bash
curl -X POST http://127.0.0.1:8000/generate/direct?wait=true \
  -H 'Content-Type: application/json' \
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

## Batch generate from CSV

Direct mode:

```bash
python scripts/generate_from_csv.py sample_data/leads.csv --mode direct
```

Template mode:

```bash
python scripts/generate_from_csv.py sample_data/leads.csv --mode template --payload-path sample_data/template_payload.json
```

## Notes on payloads

### Direct mode payload
The code builds a `POST /v2/video/generate` request with:

- one scene in `video_inputs`
- avatar block
- voice block using rendered Hindi script
- solid background color
- width/height from `.env`

If your HeyGen account or avatar type expects slightly different request fields, adjust `_build_direct_payload()` in `app/services/video_service.py`.

### Template mode payload
Template mode intentionally uses a JSON file so you can adapt quickly to your actual HeyGen template schema. The repo replaces placeholders like `{{customer_name}}` and `{{lan}}` inside that JSON before sending it.

## Compliance note
The included safer Hindi template avoids falsely claiming the avatar is a licensed legal expert. If your legal/compliance team approves a stronger script, you can switch to `legal_notice_raw_hi.txt` or add your own template.

## Tests

```bash
pytest -q
```

## Suggested production flow

1. Create / choose your HeyGen avatar in the dashboard
2. Confirm `avatar_id` or `template_id`
3. Validate incoming lead table
4. Render script or variable payload
5. Submit generation job to HeyGen
6. Poll status until complete
7. Save MP4 + JSON metadata
8. Push final video URL into WhatsApp / email / CRM workflow
