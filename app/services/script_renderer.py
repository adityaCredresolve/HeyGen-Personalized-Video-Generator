from pathlib import Path

from jinja2 import Environment, FileSystemLoader, StrictUndefined

from app.models import LeadRecord
from app.utils.validation import parse_money


TEMPLATE_DIR = Path(__file__).resolve().parent.parent / 'templates'
_env = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    undefined=StrictUndefined,
    autoescape=False,
    trim_blocks=True,
    lstrip_blocks=True,
)


def build_context(lead: LeadRecord) -> dict:
    loan_amount = parse_money(lead.loan_amount, field_name='loan_amount') if lead.loan_amount is not None else ''
    return {
        'customer_name': lead.customer_name,
        'lan': lead.lan,
        'client_name': lead.client_name,
        'tos': parse_money(lead.tos, field_name='tos'),
        'loan_amt': loan_amount,
        'loan_amount': loan_amount,
        'contact_details': lead.contact_details or '',
    }


def render_template(template_name: str, lead: LeadRecord) -> str:
    context = build_context(lead)
    template = _env.get_template(template_name)
    rendered = template.render(**context)
    return ' '.join(rendered.split())


def render_inline_template(text: str, lead: LeadRecord) -> str:
    context = build_context(lead)
    template = _env.from_string(text)
    rendered = template.render(**context)
    return ' '.join(rendered.split())
