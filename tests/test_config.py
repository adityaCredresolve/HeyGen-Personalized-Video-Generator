import os

os.environ.setdefault('HEYGEN_API_KEY', 'test-key')

from app.config import Settings


def test_placeholder_ids_are_treated_as_unset() -> None:
    settings = Settings(
        heygen_api_key='test-key',
        heygen_voice_id='optional_voice_id',
        heygen_template_id='optional_template_id',
    )

    assert settings.heygen_voice_id is None
    assert settings.heygen_template_id is None


def test_cors_allow_all_defaults_to_enabled() -> None:
    settings = Settings(heygen_api_key='test-key')

    assert settings.cors_allow_all is True


def test_ffmpeg_binary_defaults_to_ffmpeg() -> None:
    settings = Settings(heygen_api_key='test-key')

    assert settings.ffmpeg_binary == 'ffmpeg'
