import os
from pathlib import Path

import pytest

os.environ.setdefault('HEYGEN_API_KEY', 'test-key')

from app.services.media_styling_service import MediaStylingService, StyleRequest


def test_style_request_requires_captions_or_logo() -> None:
    service = MediaStylingService(client=object())

    with pytest.raises(ValueError, match='Provide captions and/or a logo'):
        service._normalize_style_request(
            StyleRequest(
                include_captions=False,
                subtitle_color='White',
                subtitle_position='Bottom',
                transcript=None,
                logo_position='Top Right',
                logo_opacity=80,
            )
        )


def test_parse_caption_text_supports_webvtt() -> None:
    service = MediaStylingService(client=object())
    cues = service._parse_caption_text(
        'WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nनमस्ते\n\n00:00:02.000 --> 00:00:04.000\nकृपया संपर्क करें\n'
    )

    assert [cue.text for cue in cues] == ['नमस्ते', 'कृपया संपर्क करें']
    assert cues[0].start_seconds == 0
    assert cues[1].end_seconds == 4


def test_build_ffmpeg_command_includes_subtitles_and_logo() -> None:
    service = MediaStylingService(client=object())

    command = service.build_ffmpeg_command(
        source_video_path=Path('/tmp/source.mp4'),
        final_video_path=Path('/tmp/final.mp4'),
        subtitle_file_path=Path('/tmp/captions.ass'),
        logo_file_path=Path('/tmp/logo.png'),
        logo_position='top right',
        logo_opacity=80,
    )
    command_text = ' '.join(command)

    assert '-filter_complex' in command
    assert 'ass=filename=' in command_text
    assert 'colorchannelmixer=aa=0.80' in command_text
    assert 'overlay=main_w-overlay_w-32:32:format=auto' in command_text


def test_style_key_changes_when_logo_changes() -> None:
    service = MediaStylingService(client=object())
    base_request = StyleRequest(
        include_captions=True,
        subtitle_color='white',
        subtitle_position='bottom',
        transcript='नमस्ते ग्राहक',
        logo_position='top right',
        logo_opacity=80,
        logo_filename='logo.png',
        logo_bytes=b'logo-a',
    )

    first_key = service._style_key('video_123', base_request, caption_url=None)
    second_key = service._style_key(
        'video_123',
        StyleRequest(**{**base_request.__dict__, 'logo_bytes': b'logo-b'}),
        caption_url=None,
    )

    assert first_key != second_key
