from pathlib import Path
import re

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
_SINGLE_BRACE_PATTERN = re.compile(r'(?<!{){([^{}\s]+)}(?!})')


def _normalize_placeholder_syntax(text: str) -> str:
    return _SINGLE_BRACE_PATTERN.sub(r'{{\1}}', text)


def build_context(lead: LeadRecord) -> dict:
    language = getattr(lead, 'language', None) or 'Hindi'
    loan_amount = parse_money(lead.loan_amount, field_name='loan_amount') if lead.loan_amount is not None else ''
    tos = parse_money(lead.tos, field_name='tos') or ('बकाया राशि' if language == 'Hindi' else 'outstanding amount')
    contact_details = lead.contact_details or ('बैंक हेल्पलाइन' if language == 'Hindi' else 'the bank helpline')
    product_type = lead.product_type or 'loan'
    return {
        'customer_name': lead.customer_name,
        'customer': lead.customer_name,
        'lan': lead.lan,
        'account_number': lead.lan,
        'client_name': lead.client_name,
        'client': lead.client_name,
        'tos': tos,
        'balance': tos,
        'outstanding': tos,
        'loan_amt': loan_amount,
        'loan_amount': loan_amount,
        'amt': loan_amount,
        'contact_details': contact_details,
        'helpline': contact_details,
        'contact': contact_details,
        'product_type': product_type,
        'product': product_type,
    }


def render_template(template_name: str, lead: LeadRecord) -> str:
    context = build_context(lead)
    template = _env.get_template(template_name)
    rendered = template.render(**context)
    return ' '.join(rendered.split())


def render_inline_template(text: str, lead: LeadRecord) -> str:
    context = build_context(lead)
    template = _env.from_string(_normalize_placeholder_syntax(text))
    rendered = template.render(**context)
    return ' '.join(rendered.split())
