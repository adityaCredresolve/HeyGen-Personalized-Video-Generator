import os
from pathlib import Path

import pytest

os.environ.setdefault('HEYGEN_API_KEY', 'test-key')

from app.models import DirectVideoRequest
from app.services.remotion_service import RemotionService


def make_request(script_text: str | None = None) -> DirectVideoRequest:
    return DirectVideoRequest(
        customer_name='Ramesh Kumar',
        lan='LAN12345',
        client_name='ABC Finance',
        tos='38450',
        loan_amount='120000',
        contact_details='1800-123-456',
        product_type='loan',
        language='Hindi',
        script_text=script_text,
    )


def test_render_script_supports_aliases_and_single_braces(tmp_path: Path) -> None:
    service = RemotionService(remotion_path=tmp_path)
    request = make_request(
        '{customer} {client} {loan_amt} {balance} {account_number} {helpline} {product}'
    )

    rendered = service.render_script(request)

    assert rendered == 'Ramesh Kumar ABC Finance 120000 38450 LAN12345 1800-123-456 loan'


def test_ensure_project_available_requires_checkout(tmp_path: Path) -> None:
    service = RemotionService(remotion_path=tmp_path / 'missing')

    with pytest.raises(RuntimeError, match='Remotion project is incomplete'):
        service.ensure_project_available()


def test_build_render_payload_enriches_scene_data(tmp_path: Path) -> None:
    service = RemotionService(remotion_path=tmp_path)

    payload = service.build_render_payload(make_request(), 'job-1', 'Rendered script')

    assert payload['display_amounts']['primary']['value'] == '₹38,450'
    assert payload['display_amounts']['secondary']['value'] == '₹1,20,000'
    assert payload['scene_payload']['opening']['headline'].startswith('Ramesh Kumar')
    assert payload['scene_payload']['action']['cta_value'] == '1800-123-456'
    assert payload['headline_text'] == payload['scene_payload']['headline_text']
    assert payload['cta_text'] == payload['scene_payload']['cta_text']
    assert payload['urgency_level'] == 'elevated'


def test_build_render_payload_handles_missing_loan_amount_and_product_variants(tmp_path: Path) -> None:
    service = RemotionService(remotion_path=tmp_path)
    request = make_request()
    request.loan_amount = None
    request.product_type = 'insurance'

    payload = service.build_render_payload(request, 'job-2', 'Rendered script')

    assert payload['display_amounts']['secondary']['available'] is False
    assert payload['display_amounts']['secondary']['value'] == 'राशि उपलब्ध नहीं'
    assert payload['scene_payload']['account']['eyebrow'] == 'बीमा भुगतान स्थिति'
    assert 'बीमा खाते' in payload['scene_payload']['opening']['headline']


def test_format_amount_display_supports_numeric_strings(tmp_path: Path) -> None:
    service = RemotionService(remotion_path=tmp_path)

    assert service.format_amount_display('₹120000') == '₹1,20,000'
    assert service.format_amount_display('38,450') == '₹38,450'
    assert service.format_amount_display(None) == 'राशि उपलब्ध नहीं'
