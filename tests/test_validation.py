from app.utils.validation import parse_money


def test_parse_money_integer() -> None:
    assert parse_money('38450', field_name='tos') == '₹38,450'


def test_parse_money_decimal() -> None:
    assert parse_money('38450.75', field_name='tos') == '₹38,450.75'
