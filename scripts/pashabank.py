"""
Pasha Bank Ipoteka Partners Scraper
URL: https://ipoteka.pashabank.az/az/ipoteka/partners/partners
Output: data/pashabank.csv
"""

import csv
import os
import time
import requests
from bs4 import BeautifulSoup

BASE_URL = "https://ipoteka.pashabank.az"
PARTNERS_URL = f"{BASE_URL}/az/ipoteka/partners/partners"

HEADERS = {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,ru;q=0.7,az;q=0.6",
    "cache-control": "max-age=0",
    "connection": "keep-alive",
    "dnt": "1",
    "host": "ipoteka.pashabank.az",
    "sec-ch-ua": '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "user-agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/145.0.0.0 Safari/537.36"
    ),
}

# Paste your current session cookie value here if the site requires authentication
COOKIES = {
    "TS0101a0bc": "0156ac68395bdba6df942001e74f28141df37924c3c4e81c01cfcdf80b7975b07d7cb2b4bde7b75e563fb44bc533f18243eb69318d",
    "_ym_uid": "1771259678215569637",
    "_ym_d": "1771259678",
    "_fbp": "fb.1.1771259678263.754891232871962398",
    "_ym_isad": "2",
    "_clck": "1lgkjbb%5E2%5Eg3m%5E0%5E2238",
    "_clsk": "g4ecnq%5E1771259679121%5E1%5E1%5Ea.clarity.ms%2Fcollect",
}

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "pashabank.csv")


def fetch_page(url: str, session: requests.Session) -> BeautifulSoup | None:
    """Fetch a page and return a BeautifulSoup object."""
    try:
        response = session.get(url, timeout=30)
        response.raise_for_status()
        return BeautifulSoup(response.text, "html.parser")
    except requests.RequestException as e:
        print(f"[ERROR] Failed to fetch {url}: {e}")
        return None


def parse_partners(soup: BeautifulSoup) -> list[dict]:
    """
    Parse partner entries from the page.
    Tries multiple selector strategies to handle different HTML layouts.
    """
    partners = []

    # --- Strategy 1: table rows ---
    table = soup.find("table")
    if table:
        rows = table.find_all("tr")
        headers_row = rows[0] if rows else None
        col_names = []
        if headers_row:
            col_names = [th.get_text(strip=True) for th in headers_row.find_all(["th", "td"])]

        for row in rows[1:]:
            cells = row.find_all(["td", "th"])
            if not cells:
                continue
            if col_names:
                record = {col_names[i]: cells[i].get_text(strip=True) for i in range(min(len(col_names), len(cells)))}
            else:
                record = {f"col_{i}": cell.get_text(strip=True) for i, cell in enumerate(cells)}
            partners.append(record)

        if partners:
            print(f"[INFO] Extracted {len(partners)} partners via table strategy.")
            return partners

    # --- Strategy 2: card/list items (common in partner directory pages) ---
    # Try common CSS patterns used in Azerbaijani bank sites
    candidate_selectors = [
        ".partner-item",
        ".partners-list li",
        ".partner-card",
        ".partner",
        "[class*='partner']",
        ".company-item",
        ".company",
        ".list-item",
        ".item",
    ]

    for selector in candidate_selectors:
        items = soup.select(selector)
        if items:
            print(f"[INFO] Found {len(items)} items with selector '{selector}'.")
            for item in items:
                name = (
                    item.select_one("h2, h3, h4, .name, .title, strong")
                    or item
                )
                record = {
                    "name": name.get_text(strip=True) if name else "",
                    "address": _extract_text(item, [".address", "[class*='address']", ".location"]),
                    "phone": _extract_text(item, [".phone", "[class*='phone']", ".tel", "a[href^='tel']"]),
                    "region": _extract_text(item, [".region", ".city", "[class*='region']", "[class*='city']"]),
                    "category": _extract_text(item, [".category", ".type", "[class*='category']", "[class*='type']"]),
                    "raw_text": item.get_text(" | ", strip=True),
                }
                partners.append(record)
            if partners:
                print(f"[INFO] Extracted {len(partners)} partners via selector '{selector}'.")
                return partners

    # --- Strategy 3: dump all visible text blocks as fallback ---
    print("[WARN] No structured partner data found. Falling back to text block extraction.")
    blocks = soup.find_all(["p", "li", "div"], limit=300)
    seen = set()
    for block in blocks:
        text = block.get_text(" ", strip=True)
        if len(text) > 10 and text not in seen:
            seen.add(text)
            partners.append({"raw_text": text})

    return partners


def _extract_text(parent, selectors: list[str]) -> str:
    """Try each CSS selector and return the first non-empty text found."""
    for sel in selectors:
        el = parent.select_one(sel)
        if el:
            return el.get_text(strip=True)
    return ""


def save_csv(records: list[dict], filepath: str) -> None:
    """Save a list of dicts to a CSV file."""
    if not records:
        print("[WARN] No records to save.")
        return

    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    # Collect all field names preserving order
    fieldnames: list[str] = []
    seen_fields: set[str] = set()
    for record in records:
        for key in record:
            if key not in seen_fields:
                fieldnames.append(key)
                seen_fields.add(key)

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(records)

    print(f"[OK] Saved {len(records)} records to {filepath}")


def main() -> None:
    session = requests.Session()
    session.headers.update(HEADERS)
    session.cookies.update(COOKIES)

    print(f"[INFO] Fetching: {PARTNERS_URL}")
    soup = fetch_page(PARTNERS_URL, session)

    if soup is None:
        print("[ERROR] Could not retrieve the page. Check your network or cookie values.")
        return

    # Debug: show page title so we know what we got
    title = soup.find("title")
    print(f"[INFO] Page title: {title.get_text(strip=True) if title else 'N/A'}")

    partners = parse_partners(soup)
    save_csv(partners, OUTPUT_FILE)


if __name__ == "__main__":
    main()
