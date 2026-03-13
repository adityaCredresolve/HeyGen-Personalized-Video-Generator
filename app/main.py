from typing import Literal

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.models import DirectVideoRequest, TemplateVideoRequest
from app.services.heygen_client import HeyGenClient
from app.services.video_service import VideoService

app = FastAPI(title='HeyGen Personalized Video Generator', version='1.0.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'] if settings.cors_allow_all else settings.cors_origins,
    allow_credentials=not settings.cors_allow_all,
    allow_methods=['*'],
    allow_headers=['*'],
)
service = VideoService()
client = HeyGenClient()


@app.exception_handler(RuntimeError)
def handle_runtime_error(_request: Request, exc: RuntimeError) -> JSONResponse:
    return JSONResponse(status_code=502, content={'detail': str(exc)})


@app.exception_handler(TimeoutError)
def handle_timeout_error(_request: Request, exc: TimeoutError) -> JSONResponse:
    return JSONResponse(status_code=504, content={'detail': str(exc)})


@app.get('/health')
def health() -> dict:
    return {'status': 'ok', 'output_dir': str(settings.output_dir.resolve())}


@app.get('/meta/avatars')
def list_avatars() -> dict:
    return client.list_avatars()


@app.get('/meta/voices')
def list_voices() -> dict:
    return client.list_voices()


@app.get('/meta/templates')
def list_templates() -> dict:
    return client.list_templates()


@app.get('/meta/template/{template_id}')
def get_template_details(template_id: str, version: str = 'v3') -> dict:
    return client.get_template_details(template_id, version=version)


@app.post('/generate/direct')
def generate_direct(request: DirectVideoRequest, wait: bool = True):
    return service.generate_direct(request, wait=wait)


@app.get('/videos/{video_id}/status')
def get_video_status(video_id: str, request_mode: Literal['direct', 'template'] = 'direct'):
    return service.get_video_status_result(video_id, request_mode=request_mode)


@app.post('/generate/template')
def generate_template(request: TemplateVideoRequest, wait: bool = True):
    return service.generate_from_template(request, wait=wait)
