from typing import Literal
from datetime import datetime

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm

from app.config import settings
from app.models import DirectVideoRequest, StyledVideoResult, TemplateVideoRequest, VideoJobResult, UserCreate, Token, UserInDB, VideoRecord
from app.services.heygen_client import HeyGenClient
from app.services.media_styling_service import MediaStylingService, StyleRequest
from app.services.remotion_service import RemotionService
from app.services.video_service import VideoService
from app.database import users_collection, videos_collection, drafts_collection
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user

app = FastAPI(title='Personalized Video Generator', version='1.0.0')
settings.output_dir.mkdir(parents=True, exist_ok=True)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.on_event("startup")
async def startup_db_client():
    try:
        # The ping command is cheap and does not require auth.
        await users_collection.database.command("ping")
        print("\n" + "="*50)
        print("✅ SUCCESS: Connected to MongoDB Cluster successfully!")
        print("="*50 + "\n")
    except Exception as e:
        print("\n" + "!"*50)
        print(f"❌ ERROR: Failed to connect to MongoDB: {e}")
        print("!"*50 + "\n")
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
def list_templates(current_user: str = Depends(get_current_user)) -> dict:
    return client.list_templates()


@app.get('/meta/template/{template_id}')
def get_template_details(template_id: str, version: str = 'v3', current_user: str = Depends(get_current_user)) -> dict:
    return client.get_template_details(template_id, version=version)


# --- Authentication Endpoints ---

@app.post("/auth/signup", response_model=dict)
async def signup(user: UserCreate):
    print(f"DEBUG: Signup request received for user: {user.email}")
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        print(f"DEBUG: User {user.email} already exists")
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    user_dict = user.dict()
    user_dict["hashed_password"] = hashed_password
    del user_dict["password"]
    
    await users_collection.insert_one(user_dict)
    print(f"DEBUG: User {user.email} successfully registered")
    return {"message": "User created successfully"}

@app.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    print(f"DEBUG: Login request received for user: {form_data.username}")
    user = await users_collection.find_one({"username": form_data.username}) # Using username field for login
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        print(f"DEBUG: Login failed for user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"DEBUG: Login successful for user: {form_data.username}")
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}


# --- Video Generation Endpoints ---

@app.post('/generate/direct')
async def generate_direct(request: DirectVideoRequest, wait: bool = True, current_user: str = Depends(get_current_user)):
    result = service.generate_direct(request, wait=wait)
    
    # Save to MongoDB
    video_record = VideoRecord(
        user_email=current_user,
        video_id=result.get("video_id") if isinstance(result, dict) else result.video_id,
        status="completed" if wait else "processing",
        title=f"{request.title_prefix} - {request.customer_name}",
        request_mode="direct",
        job_data=result if isinstance(result, dict) else result.dict()
    )
    await videos_collection.insert_one(video_record.dict())
    
    return result


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
    current_user: str = Depends(get_current_user)
):
    print(f"DEBUG: Stylize request for video {video_id} by {current_user}")
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
        print(f"DEBUG: Stylize failed: {exc}")
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    final_relative = artifact.final_video_path.relative_to(settings.output_dir).as_posix()
    result = StyledVideoResult(
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

    # Update MongoDB record
    await videos_collection.update_one(
        {"video_id": video_id},
        {"$set": {
            "status": "styled",
            "video_url": result.final_video_url,
            "job_data": result.dict()
        }}
    )
    print(f"DEBUG: Stylize completed and updated in DB for video {video_id}")
    return result


@app.post('/generate/template')
async def generate_template(request: TemplateVideoRequest, wait: bool = True, current_user: str = Depends(get_current_user)):
    print(f"DEBUG: Template generation request by {current_user}")
    result = service.generate_from_template(request, wait=wait)
    
    # Save to MongoDB
    video_record = VideoRecord(
        user_email=current_user,
        video_id=result.get("video_id") if isinstance(result, dict) else result.video_id,
        status="completed" if wait else "processing",
        title=f"Template Video - {request.customer_name}",
        request_mode="template",
        job_data=result if isinstance(result, dict) else result.dict()
    )
    await videos_collection.insert_one(video_record.dict())
    print(f"DEBUG: Template generation saved to DB")
    return result


@app.post('/generate/remotion', response_model=VideoJobResult)
async def generate_remotion(payload: DirectVideoRequest, request: Request, current_user: str = Depends(get_current_user)):
    result = await remotion_service.generate_video(payload)
    relative_video_path = result['video_path'].relative_to(settings.output_dir).as_posix()
    
    job_result = VideoJobResult(
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

    # Save to MongoDB
    video_record = VideoRecord(
        user_email=current_user,
        video_id=job_result.video_id,
        status="completed",
        title=job_result.title,
        video_url=job_result.video_url,
        request_mode="remotion",
        job_data=job_result.dict()
    )
    await videos_collection.insert_one(video_record.dict())
    
    return job_result

@app.get('/my-videos')
async def get_my_videos(current_user: str = Depends(get_current_user)):
    print(f"DEBUG: Fetching videos for {current_user}")
    cursor = videos_collection.find({"user_email": current_user}).sort("created_at", -1)
    videos = await cursor.to_list(length=100)
    for video in videos:
        video["_id"] = str(video["_id"])
    return videos

@app.post('/drafts/save')
async def save_draft(draft: dict, current_user: str = Depends(get_current_user)):
    print(f"DEBUG: Saving draft for {current_user}")
    draft_record = {
        "user_email": current_user,
        "content": draft,
        "updated_at": datetime.utcnow(),
        "created_at": datetime.utcnow()
    }
    # Update existing draft or insert new one? Let's insert for now or update if ID provided
    result = await drafts_collection.insert_one(draft_record)
    return {"status": "success", "draft_id": str(result.inserted_id)}

@app.get('/drafts')
async def get_drafts(current_user: str = Depends(get_current_user)):
    print(f"DEBUG: Fetching drafts for {current_user}")
    cursor = drafts_collection.find({"user_email": current_user}).sort("updated_at", -1)
    drafts = await cursor.to_list(length=50)
    for d in drafts:
        d["_id"] = str(d["_id"])
    return drafts
