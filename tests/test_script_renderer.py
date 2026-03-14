import os

os.environ.setdefault('HEYGEN_API_KEY', 'test-key')

from app.models import LeadRecord
from app.services.script_renderer import build_context, render_inline_template


def make_lead() -> LeadRecord:
    return LeadRecord(
        customer_name='Ramesh Kumar',
        lan='LAN12345',
        client_name='ABC Finance',
        tos='38450',
        loan_amount='120000',
        contact_details='1800-123-456',
        product_type='loan',
    )


def test_build_context_includes_aliases() -> None:
    context = build_context(make_lead())

    assert context['customer'] == 'Ramesh Kumar'
    assert context['client'] == 'ABC Finance'
    assert context['loan_amt'] == context['loan_amount']
    assert context['balance'] == context['tos']
    assert context['account_number'] == 'LAN12345'
    assert context['helpline'] == '1800-123-456'
    assert context['product'] == 'loan'


def test_render_inline_template_supports_single_brace_placeholders() -> None:
    rendered = render_inline_template(
        '{customer} | {client} | {loan_amt} | {balance} | {account_number} | {helpline} | {product}',
        make_lead(),
    )

    assert rendered == 'Ramesh Kumar | ABC Finance | ₹120,000 | ₹38,450 | LAN12345 | 1800-123-456 | loan'
