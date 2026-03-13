import os

os.environ.setdefault('HEYGEN_API_KEY', 'test-key')

from app.services.video_service import VideoService


class FakeClient:
    def get_video_status(self, video_id: str) -> dict:
        assert video_id == 'video_123'
        return {
            'data': {
                'status': 'completed',
                'video_url': 'https://example.com/video.mp4',
                'thumbnail_url': 'https://example.com/thumb.jpg',
                'title': 'Loan Recall',
            }
        }


def test_get_video_status_result_returns_video_job_result() -> None:
    service = VideoService(client=FakeClient())

    result = service.get_video_status_result('video_123')

    assert result.video_id == 'video_123'
    assert result.status == 'completed'
    assert result.video_url == 'https://example.com/video.mp4'
    assert result.thumbnail_url == 'https://example.com/thumb.jpg'
    assert result.title == 'Loan Recall'
