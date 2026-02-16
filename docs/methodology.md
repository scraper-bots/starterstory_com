# Data Collection Methodology

## Overview

Data was collected directly from the public-facing partner portals of four Azerbaijani mortgage banks in February 2025. Each source required a different extraction approach due to differing web architectures. No data was purchased or provided by the banks — all information is publicly accessible on their websites.

---

## Sources and Collection Methods

### PASHA Bank
- **URL**: `https://ipoteka.pashabank.az/az/ipoteka/partners/partners`
- **Method**: HTTP request with browser headers + session cookie; HTML parsed with BeautifulSoup
- **Rendering**: Server-side rendered HTML
- **Partner selector**: `#partners-list > div.col-lg-12`
- **Fields extracted**: Name, down payment, annual rate, term, address, phone, website, logo URL
- **Records**: 14

### ABB Home
- **URL**: `https://abbhome.az/partnyor-tikinti-sirketleri-uzre-ipoteka-krediti`
- **Method**: HTTP GET; JSON extracted from embedded `<script id="__NEXT_DATA__">` tag
- **Rendering**: Next.js SSR — full data available in page HTML without JavaScript execution
- **Data path**: `props.pageProps.partners` (partner list) + `props.pageProps.product.additionalInfo` (mortgage terms)
- **Note**: Mortgage terms (rate, down payment, term) are product-level — the same values apply to all 8 partners because ABBHome publishes a single mortgage product.
- **Records**: 8

### Xalq Bank
- **URL**: `https://www.xalqbank.az/az/ferdi/kreditler/ipoteka/partnyor-sirketler-uzre-ipoteka`
- **Method**: HTTP request with browser headers + session cookie; HTML parsed with BeautifulSoup
- **Rendering**: Nuxt.js SSR — partner cards rendered in HTML body
- **Partner selector**: `div.loan__item`
- **Note**: Phone fields contained HTML artifacts (`; &nbsp;`) from server-side template rendering — stripped with regex normalisation.
- **Records**: 14

### BirBank
- **URL**: `https://ipoteka.birbank.az/api/partners?size=1000`
- **Method**: Direct JSON REST API call (no authentication required, publicly accessible)
- **Response structure**: `data.responseDto` — array of partner objects, each containing a `complexes[]` array
- **Flattening**: One-to-many relationship (partner → complexes) was flattened to one row per complex, with partner-level fields repeated across rows.
- **Logo URL**: Constructed as `https://ipoteka.birbank.az/api/files/{filename}`
- **Records**: 100 rows from 75 unique partners

---

## Data Unification

All four sources were combined into a single `data/data.csv` using `scripts/combine.py`. Field names were normalised to a common 18-column schema. A `source` column identifies the originating bank for every row.

Where a source does not provide a field, the cell is left empty (empty string). No imputation or estimation was performed.

---

## Limitations

**ABB Home mortgage terms are not project-specific.** The bank's portal does not publish individual loan conditions per developer — only a single product applies universally. Analysis of ABBHome rate competitiveness is therefore limited to product-level comparison.

**Xalq Bank publishes no mortgage parameters.** The partner portal only lists contact information. Down payment, annual rate, and term are unavailable for all 14 Xalq Bank entries.

**BirBank region data uses internal IDs.** The `region` field in BirBank data comes from a `regionId` integer in the API response, which maps to city names (e.g. `1` = Bakı). If BirBank changes its internal ID mapping, region labels could become incorrect.

**Snapshot data.** All records reflect the state of each bank's partner portal at the time of collection (February 2025). Partner lists change as new developments are added or removed. This dataset is not auto-refreshed.

**Session cookies.** PASHA Bank and Xalq Bank require a valid browser session cookie to return partner data. Cookies embedded in the scraper scripts expire over time and must be refreshed by re-authenticating via a browser and updating `scripts/pashabank.py` and `scripts/xalqbank.py` before re-running.

**Digital presence coverage gaps.** Website, Instagram, and Facebook fields are only as complete as the bank's own portal data. A developer may have an active digital presence that simply was not recorded in the bank's system.

---

## Reproduction

To re-collect data from scratch:

```bash
# 1. Refresh session cookies in scripts/pashabank.py and scripts/xalqbank.py
#    (copy new cookie values from browser DevTools)

# 2. Run all scrapers
python scripts/pashabank.py
python scripts/abbhome.py
python scripts/xalqbank.py
python scripts/birbank.py

# 3. Combine into unified dataset
python scripts/combine.py

# 4. Regenerate charts
python scripts/generate_charts.py
```

Output files: `data/data.csv`, `charts/*.png`
