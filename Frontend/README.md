# Frontend

This is the active Vite + React app for the personalized video generator.

## Local Development

```bash
cd Frontend
npm install
npm run dev
```

Open `http://127.0.0.1:8080`.

The app defaults `VITE_API_BASE_URL` to `/api`, and Vite proxies that to `http://127.0.0.1:8000` during development.

If you want the browser to call FastAPI directly instead of using the proxy, create `Frontend/.env` with:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Docker

Build:

```bash
cd Frontend
docker build -t personalized-video-frontend .
```

Run:

```bash
docker run --rm -p 8080:80 personalized-video-frontend
```

Docker defaults:

- `VITE_API_BASE_URL=/api`
- `BACKEND_ORIGIN=http://host.docker.internal:8000`

Override the backend origin at runtime if needed:

```bash
docker run --rm \
  -p 8080:80 \
  -e BACKEND_ORIGIN=http://host.docker.internal:8000 \
  personalized-video-frontend
```

On Linux, also add:

```bash
--add-host=host.docker.internal:host-gateway
```

The Nginx template proxies both `/api` and `/artifacts` to the backend, so avatar, remotion, auth, drafts, and video playback all work through the same frontend container.

## Key Files

- `src/pages/Index.tsx`
- `src/pages/MyVideos.tsx`
- `src/pages/Login.tsx`
- `src/pages/Signup.tsx`
- `src/store/wizardStore.ts`
- `src/lib/api.ts`
- `nginx.conf.template`
- `Dockerfile`
