import os

os.environ.setdefault('HEYGEN_API_KEY', 'test-key')

from app.models import DirectVideoRequest
from app.services.video_service import VideoService


def test_build_direct_payload_uses_inline_script_and_dimensions() -> None:
    service = VideoService(client=object())
    request = DirectVideoRequest(
        customer_name='Ramesh Kumar',
        lan='LAN12345',
        client_name='ABC Finance',
        tos=38450,
        loan_amount=120000,
        contact_details='1800-123-456',
        avatar_id='avatar_123',
        voice_id='voice_123',
        include_captions=True,
        script_text='Namaste {{customer_name}}. Your account {{lan}} has dues of {{tos}}.',
        video_width=720,
        video_height=1280,
    )

    payload = service._build_direct_payload(request)

    assert payload['caption'] is True
    assert payload['dimension'] == {'width': 720, 'height': 1280}
    assert payload['video_inputs'][0]['character']['avatar_id'] == 'avatar_123'
    assert payload['video_inputs'][0]['voice']['input_text'] == 'Namaste Ramesh Kumar. Your account LAN12345 has dues of ₹38,450.'
    assert payload['video_inputs'][0]['voice']['voice_id'] == 'voice_123'
    assert payload['video_inputs'][0]['voice']['text'] == {
        'input_text': 'Namaste Ramesh Kumar. Your account LAN12345 has dues of ₹38,450.',
        'voice_id': 'voice_123',
    }
