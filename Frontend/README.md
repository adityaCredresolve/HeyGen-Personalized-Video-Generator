# Frontend

This is the active Vite + React frontend for the personalized video generator project.

## Run Locally

```bash
cd /Users/aditya/Downloads/heygen_video_generator/Frontend
npm install
npm run dev
```

Open `http://127.0.0.1:8080`.

The frontend talks to FastAPI through [src/lib/api.ts](/Users/aditya/Downloads/heygen_video_generator/Frontend/src/lib/api.ts).

The subtitle/logo step now does two real things:

- uploads a PNG/JPG logo to the backend after the base video is finished
- requests a branded post-processing pass that burns styled subtitles into the final MP4

## API Base URL

Without any env override, the frontend uses `/api`, and Vite proxies that to the local FastAPI server during development.

If you want the browser to call FastAPI directly, set:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

You can set that in [Frontend/.env.example](/Users/aditya/Downloads/heygen_video_generator/Frontend/.env.example) or override it in `Frontend/.env`.

## Docker

Build:

```bash
cd /Users/aditya/Downloads/heygen_video_generator/Frontend
docker build -t personalized-video-frontend .
```

Run:

```bash
docker run --rm -p 8080:80 personalized-video-frontend
```

Current Docker default:

- `VITE_API_BASE_URL=/api`
- `BACKEND_ORIGIN=http://host.docker.internal:8000`

Override it at build time if needed:

```bash
docker build --build-arg VITE_API_BASE_URL=http://127.0.0.1:8000 -t personalized-video-frontend .
```

The default Docker flow now uses [nginx.conf.template](/Users/aditya/Downloads/heygen_video_generator/Frontend/nginx.conf.template) to proxy `/api` requests through `BACKEND_ORIGIN`, so it works with the local FastAPI app including `/generate/remotion`.

## Key Files

- [src/pages/MyVideos.tsx](/Users/aditya/Downloads/heygen_video_generator/Frontend/src/pages/MyVideos.tsx)
- [src/pages/Index.tsx](/Users/aditya/Downloads/heygen_video_generator/Frontend/src/pages/Index.tsx)
- [src/components/steps/StepSubtitle.tsx](/Users/aditya/Downloads/heygen_video_generator/Frontend/src/components/steps/StepSubtitle.tsx)
- [src/store/wizardStore.ts](/Users/aditya/Downloads/heygen_video_generator/Frontend/src/store/wizardStore.ts)
- [Dockerfile](/Users/aditya/Downloads/heygen_video_generator/Frontend/Dockerfile)
