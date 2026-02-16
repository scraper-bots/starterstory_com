"""
Combine all bank partner CSVs into a single data/data.csv.

Unified schema
--------------
source          – bank name (PASHA Bank / ABB Home / Xalq Bank / BirBank)
name            – residential complex or project name
partner_name    – developer / construction company
region          – city or region
address         – full street address
phone           – primary contact phone
email           –
website         –
facebook        –
instagram       –
logo_url        – partner/complex logo URL
down_payment    – minimum initial payment (% or label)
annual_rate     – minimum annual interest rate (% or label)
term            – maximum loan term (years or label)
min_loan_amount –
max_loan_amount –
latitude        – (BirBank only)
longitude       – (BirBank only)

Source file field mappings
--------------------------
pashabank.csv   → name, address, phone, website, logo_url,
                  down_payment, annual_rate, term
abbhome.csv     → name (title), phone, address, website, logo_url,
                  down_payment (min_down_payment), annual_rate (min_annual_rate),
                  term (max_term), max_loan_amount
xalqbank.csv    → name, region, address, phone, website, logo_url
birbank.csv     → name (complex_name), partner_name, region_id→region,
                  address (partner_address), phone (phone_mobile1),
                  email, website, facebook, instagram,
                  logo_url (complex_logo_url),
                  down_payment (initial_payment_pct),
                  annual_rate (mortgage_rate_pct),
                  term (mortgage_period_years),
                  min_loan_amount, max_loan_amount,
                  latitude, longitude
"""

import csv
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
OUTPUT = os.path.join(DATA_DIR, "data.csv")

FIELDS = [
    "source",
    "name",
    "partner_name",
    "region",
    "address",
    "phone",
    "email",
    "website",
    "facebook",
    "instagram",
    "logo_url",
    "down_payment",
    "annual_rate",
    "term",
    "min_loan_amount",
    "max_loan_amount",
    "latitude",
    "longitude",
]


def _read(filename: str) -> list[dict]:
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        print(f"[WARN] {filename} not found – skipping.")
        return []
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _row(**kwargs) -> dict:
    """Build a unified row; missing fields default to empty string."""
    base = {f: "" for f in FIELDS}
    base.update({k: (v or "") for k, v in kwargs.items()})
    return base


# ---------------------------------------------------------------------------
# Per-source transformers
# ---------------------------------------------------------------------------

def from_pashabank() -> list[dict]:
    rows = _read("pashabank.csv")
    out = []
    for r in rows:
        out.append(_row(
            source="PASHA Bank",
            name=r["name"],
            address=r["address"],
            phone=r["phone"],
            website=r["website"],
            logo_url=r["logo_url"],
            down_payment=r["down_payment"],
            annual_rate=r["annual_rate"],
            term=r["term"],
        ))
    return out


def from_abbhome() -> list[dict]:
    rows = _read("abbhome.csv")
    out = []
    for r in rows:
        out.append(_row(
            source="ABB Home",
            name=r["name"],
            phone=r["phone"],
            address=r["address"],
            website=r["website"],
            logo_url=r["logo_url"],
            down_payment=r["min_down_payment"],
            annual_rate=r["min_annual_rate"],
            term=r["max_term"],
            max_loan_amount=r["max_loan_amount"],
        ))
    return out


def from_xalqbank() -> list[dict]:
    rows = _read("xalqbank.csv")
    out = []
    for r in rows:
        out.append(_row(
            source="Xalq Bank",
            name=r["name"],
            region=r["region"],
            address=r["address"],
            phone=r["phone"],
            website=r["website"],
            logo_url=r["logo_url"],
        ))
    return out


def from_birbank() -> list[dict]:
    rows = _read("birbank.csv")
    out = []
    for r in rows:
        out.append(_row(
            source="BirBank",
            name=r["complex_name"] or r["partner_name"],
            partner_name=r["partner_name"],
            address=r["partner_address"],
            phone=r["phone_mobile1"] or r["phone_short"],
            email=r["email"],
            website=r["website"],
            facebook=r["facebook"],
            instagram=r["instagram"],
            logo_url=r["complex_logo_url"] or r["partner_logo_url"],
            down_payment=r["initial_payment_pct"],
            annual_rate=r["mortgage_rate_pct"],
            term=r["mortgage_period_years"],
            min_loan_amount=r["min_loan_amount"],
            max_loan_amount=r["max_loan_amount"],
            latitude=r["latitude"],
            longitude=r["longitude"],
        ))
    return out


# ---------------------------------------------------------------------------

def main() -> None:
    all_rows: list[dict] = []
    all_rows.extend(from_pashabank())
    all_rows.extend(from_abbhome())
    all_rows.extend(from_xalqbank())
    all_rows.extend(from_birbank())

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(OUTPUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(all_rows)

    # Summary
    print(f"[OK] data/data.csv written — {len(all_rows)} total rows")
    from collections import Counter
    counts = Counter(r["source"] for r in all_rows)
    for src, n in counts.items():
        print(f"       {src}: {n}")


if __name__ == "__main__":
    main()
