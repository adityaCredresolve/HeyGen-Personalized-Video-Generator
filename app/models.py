from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class LeadRecord(BaseModel):
    customer_name: str = Field(min_length=1)
    lan: str = Field(min_length=1, description='Loan Account Number')
    client_name: str = Field(min_length=1)
    tos: str | float | int
    loan_amount: str | float | int | None = None
    contact_details: str | None = None
    product_type: str | None = "loan"

    @field_validator('customer_name', 'lan', 'client_name')
    @classmethod
    def strip_required(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError('value cannot be empty')
        return cleaned


class DirectVideoRequest(LeadRecord):
    avatar_id: str | None = None
    voice_id: str | None = None
    language: str | None = None
    template_name: str = 'legal_notice_safe_hi.txt'
    script_text: str | None = None
    background_color: str | None = None
    include_captions: bool = False
    folder: str | None = None
    title_prefix: str = 'Loan Recall'
    video_width: int | None = None
    video_height: int | None = None

    @field_validator('script_text')
    @classmethod
    def normalize_script_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @field_validator('video_width', 'video_height')
    @classmethod
    def validate_video_dimension(cls, value: int | None) -> int | None:
        if value is not None and value <= 0:
            raise ValueError('video dimensions must be positive')
        return value


class TemplateVideoRequest(LeadRecord):
    template_id: str | None = None
    payload_path: str | None = None
    folder: str | None = None


class VideoJobResult(BaseModel):
    request_mode: Literal['direct', 'template', 'remotion']
    video_id: str
    status: str
    video_url: str | None = None
    thumbnail_url: str | None = None
    title: str | None = None
    raw_response: dict
    saved_to: Path | None = None


<<<<<<< Updated upstream
class StyledVideoResult(BaseModel):
    video_id: str
    status: Literal['styled']
    source_video_path: Path
    source_video_url: str
    final_video_path: Path
    final_video_url: str
    subtitle_file_path: Path | None = None
    logo_file_path: Path | None = None
    subtitle_source: Literal['provider', 'transcript', 'disabled']
=======
class RemotionVideoResult(BaseModel):
    job_id: str
    status: str
    video_path: str | None = None
    audio_path: str | None = None
    error: str | None = None
>>>>>>> Stashed changes
