from typing import Literal

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.models import DirectVideoRequest, StyledVideoResult, TemplateVideoRequest, VideoJobResult
from app.services.heygen_client import HeyGenClient
from app.services.media_styling_service import MediaStylingService, StyleRequest
from app.services.remotion_service import RemotionService
from app.services.video_service import VideoService

app = FastAPI(title='Personalized Video Generator', version='1.0.0')
settings.output_dir.mkdir(parents=True, exist_ok=True)
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'] if settings.cors_allow_all else settings.cors_origins,
    allow_credentials=not settings.cors_allow_all,
    allow_methods=['*'],
    allow_headers=['*'],
)
app.mount('/artifacts', StaticFiles(directory=settings.output_dir), name='artifacts')
service = VideoService()
client = HeyGenClient()
styling_service = MediaStylingService(client=client)
remotion_service = RemotionService()


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


@app.post('/videos/{video_id}/stylize', response_model=StyledVideoResult)
async def stylize_video(
    video_id: str,
    request: Request,
    include_captions: bool = Form(False),
    subtitle_color: str = Form('White'),
    subtitle_position: str = Form('Bottom'),
    transcript: str | None = Form(None),
    logo_position: str = Form('Top Right'),
    logo_opacity: int = Form(80),
    logo_file: UploadFile | None = File(None),
):
    try:
        artifact = styling_service.style_video(
            video_id,
            StyleRequest(
                include_captions=include_captions,
                subtitle_color=subtitle_color,
                subtitle_position=subtitle_position,
                transcript=transcript,
                logo_position=logo_position,
                logo_opacity=logo_opacity,
                logo_filename=logo_file.filename if logo_file else None,
                logo_bytes=await logo_file.read() if logo_file else None,
            ),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    final_relative = artifact.final_video_path.relative_to(settings.output_dir).as_posix()
    return StyledVideoResult(
        video_id=video_id,
        status='styled',
        source_video_path=artifact.source_video_path,
        source_video_url=artifact.source_video_url,
        final_video_path=artifact.final_video_path,
        final_video_url=str(request.url_for('artifacts', path=final_relative)),
        subtitle_file_path=artifact.subtitle_file_path,
        logo_file_path=artifact.logo_file_path,
        subtitle_source=artifact.subtitle_source,
    )


@app.post('/generate/template')
def generate_template(request: TemplateVideoRequest, wait: bool = True):
    return service.generate_from_template(request, wait=wait)


@app.post('/generate/remotion', response_model=VideoJobResult)
async def generate_remotion(payload: DirectVideoRequest, request: Request):
    result = await remotion_service.generate_video(payload)
    relative_video_path = result['video_path'].relative_to(settings.output_dir).as_posix()
    return VideoJobResult(
        request_mode='remotion',
        video_id=result['job_id'],
        status='completed',
        video_url=str(request.url_for('artifacts', path=relative_video_path)),
        thumbnail_url=None,
        title=f"{payload.title_prefix} - {payload.customer_name} - {payload.lan}",
        raw_response={
            'job_id': result['job_id'],
            'audio_path': str(result['audio_path']),
            'text': result['text'],
        },
        saved_to=result['video_path'],
        video_path=str(result['video_path']),
        audio_path=str(result['audio_path']),
    )
