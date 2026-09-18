# Labour Demand, Skills Taxonomies & Shortage Lists — Verified Source Inventory

All endpoints below were called live on **2026-09-18** unless marked UNVERIFIED. HTTP status and sample payloads confirmed by direct request.

---

## 1. HEADLINE DECISION (read this first)

**Standardise the MVP on ISCO-08 4-digit unit groups as the pivot key, with ESCO v1.2.1 as the skill/semantic layer bolted onto it.**

Non-negotiable reasons, each independently verified:

1. **ESCO occupation codes are literally ISCO-08 codes plus a suffix.** Verified: `GET https://ec.europa.eu/esco/api/resource/occupation?uri=http%3A%2F%2Fdata.europa.eu%2Fesco%2Foccupation%2F18e14e61-495b-44cc-a7c6-df4c625934ba&language=en` returns `"code":"2221.3"` and `_links.broaderIscoGroup[0].uri = "http://data.europa.eu/esco/isco/C2221"`. ESCO→ISCO is therefore a **free, lossless, built-in** mapping — a string truncation, not a probabilistic join. No other taxonomy pair has this property.
2. **EU shortage law is written in ISCO-08.** Directive (EU) 2021/1883 (Blue Card recast), Annex I, verbatim: *"Information and communications technology managers and professionals … belonging to the following groups of the ISCO-08 classification: (1) 133 Information and Communications Technology Services Managers; (2) 25 Information and Communications Technology Professionals."* Recital text also allows Member States to set a threshold of **at least 80%** of the national threshold for occupations "in a specific … ISCO classification".
3. **ILOSTAT publishes worldwide occupational data natively on ISCO-08** — including the single most important table for this product (see §3.1).
4. **O\*NET publishes an official ESCO crosswalk** (`ESCO_to_ONET-SOC.xlsx`, HTTP 200 verified, CC-BY 4.0), so US data reaches ISCO via ESCO.
5. Every other national system (KldB 2010, NOC 2021, ANZSCO 2022 / OSCA 2024, SOC 2020) ships an official ISCO-08 correspondence table.

**Do NOT pivot on ESCO alone** (EU-centric, 3,039 occupations, no Asian/African administrative uptake). **Do NOT pivot on O\*NET-SOC** (US-only, 2018-SOC-bound). Use them as *attached layers*, not as the key.

---

## 2. Canonical key schema

```
occupation_key   = ISCO08_UNIT  (4-digit, 436 unit groups)
rollups          = ISCO08_MINOR (3, 130) → ISCO08_SUBMAJOR (2, 43) → ISCO08_MAJOR (1, 10)
skill_layer      = ESCO skill URIs joined via esco_occupation.broaderIscoGroup
skill_level_flag = ISCO skill level 1–4 (derivable from major group: 1→lvl varies, 2→4, 3→3, 4-8→2, 9→1)
```
ILO structural reference: *ISCO-08 Volume I*, `https://webapps.ilo.org/ilostat-files/ISCO/newdocs-08-2021/ISCO-08%20EN%20Vol%201.pdf` (HTTP 200). 436 unit groups / 130 minor / 43 sub-major / 10 major — confirmed.

---

## 3. Supply & demand data sources (VERIFIED)

### 3.1 ILOSTAT SDMX — the global backbone

- Base: `https://sdmx.ilo.org/rest` (server banner: *NSI Web Service v8.19.6.0*, SDMX 2.1). Test env `https://sdmx-test.ilo.org/rest`.
- Dataflow ID convention: **`ILO,DF_<ILOSTAT_INDICATOR_ID>,1.0`**.
- Data URL: `https://sdmx.ilo.org/rest/data/ILO,DF_<ID>,1.0/<REF_AREA>.<dots for remaining dims>?startPeriod=YYYY`
- SDMX-CSV via header `Accept: application/vnd.sdmx.data+csv`.
- Full dataflow list: `GET /rest/dataflow/ILO` → 7.3 MB SDMX-ML, ~1,100 dataflows (484 `DF_EMP_*`, 110 `DF_EAR_*`, 69 `DF_UNE_*`, 63 `DF_POP_*`, 52 `DF_EAP_*`).

**The single most valuable table in this entire brief:**

| Dataflow | What it gives | Verified response |
|---|---|---|
| `ILO,DF_EMP_TEMP_SEX_OCU_CBR_NB,1.0` | Employment × sex × **ISCO-08 major group** × **place of birth (native / foreign-born)** | HTTP 200, 62 KB for ESP 2024 |

Codelists confirmed from live payload:
- `OCU` dimension: `OCU_ISCO08_0` … `OCU_ISCO08_9`, `OCU_ISCO08_TOTAL`, `OCU_ISCO08_X`; also `OCU_SKILL_L1`, `OCU_SKILL_L2`, `OCU_SKILL_L3-4`.
- 2-digit variant dataflow: `DF_EMP_TEMP_SEX_OC2_NB` → codes `OC2_ISCO08_01`, `OC2_ISCO08_11`, `OC2_ISCO08_21`, … (verified for ESP 2024).
- `CBR` dimension: `CBR_BIR_NATIVE`, `CBR_BIR_FOREIGN`, `CBR_BIR_TOTAL`, `CBR_BIR_X`.

Other `*_CBR_*` dataflows verified present (native/foreign-born splits, global coverage):
`DF_EAP_DWAP_SEX_EDU_CBR_RT` (participation rate by education), `DF_EMP_DWAP_SEX_EDU_CBR_RT` (employment-to-population rate by education), `DF_EIP_DWAP_SEX_AGE_CBR_RT`, `DF_EAR_EMTA_SEX_CBR_NB` (mean monthly earnings by birth), `DF_EMP_TEMP_SEX_ECO_CBR_NB` (by economic activity), `DF_EMP_TEMP_SEX_SKN_CBR_NB` / `_SKS_CBR_NB` (skill level), `DF_EMP_STEM_SEX_CBR_NB`, `DF_EMP_CARE_SEX_CBR_NB`, `DF_POP_MFRB_SEX_CBR_NB`.

Earnings by occupation: `DF_EAR_EHRA_SEX_OCU_NB` (mean hourly, local currency), `DF_EAR_EMTM_SEX_OCU_CUR_NB` (mean monthly, multi-currency incl. PPP), `DF_EAR_GGAP_OCU_RT` (gender gap).

**ILOSTAT has NO job-vacancy dataflow.** Grep for `(JVAC|VAC)` over the dataflow list returned zero. Vacancies must come from §3.3–3.5.

**Bulk facility:** documented pattern `https://rplumber.ilo.org/files/<segment>/<id>.csv.gz` and TOC `https://rplumber.ilo.org/files/<segment>/table_of_contents_<lang>.csv`, where `segment ∈ {indicator, ref_area}`. Source: `Rilostat/R/get_ilostat.R` line 504 and `get_ilostat_toc.R` line 112 (read from GitHub raw, HTTP 200). **UNVERIFIED:** every `rplumber.ilo.org` request from this environment returned HTTP 200 with `content-length: 0` (Cloudflare `cf-cache-status: DYNAMIC`, empty body) — the path shape is authoritative from source code, but I could not retrieve a byte of payload. `https://webapps.ilo.org/ilostat-files/WEB_bulk_download/...` returns **404** — that host path is dead; do not hardcode it.

Licence: ILOSTAT data reuse under ILO terms with attribution. **UNVERIFIED** exact SPDX-style string.

### 3.2 OECD Data Explorer SDMX — migrant labour-market outcomes

- Base: `https://sdmx.oecd.org/public/rest`
- Structure query `format` values accepted (server-enumerated): `structure`, `xml-structure-3.0.0`, `sdmx-3.0`, `json-structure-2.0.0`. **`format=sdmx-json` is rejected** — do not use it.
- Data query: `https://sdmx.oecd.org/public/rest/data/<AGENCY>,<DSD@DF>,/all?startPeriod=YYYY&format=csvfilewithlabels&dimensionAtObservation=AllDimensions`

Verified agency `OECD.ELS.IMD` (7 dataflows, complete list):

| Dataflow | Name |
|---|---|
| `DSD_MIG@DF_MIG` | International migration database |
| `DSD_MIG@DF_MIG_EMP_EDU` | Labour market outcomes of immigrants — employment rates by educational attainment |
| `DSD_MIG@DF_MIG_NUP_SEX` | Labour market outcomes of immigrants — employment, unemployment and participation rates by sex |
| `DSD_MIG_F@DF_MIG_POPF` | International migration database — stocks of foreign-born population |
| `DSD_MIG_INT@DF_MIG_INT` | Harmonised flows — internal database |
| `DSD_MIG_INT@DF_MIG_INT_PER` | Standardised inflows of permanent-type migrants |
| `DSD_MIG_INT@DF_MIG_INT_TEMP` | Standardised inflows of temporary migrants |

Live sample (103 KB, HTTP 200): `GET .../data/OECD.ELS.IMD,DSD_MIG@DF_MIG_EMP_EDU,/all?startPeriod=2024&format=csvfilewithlabels` → dimensions `REF_AREA, CITIZENSHIP, FREQ, MEASURE, SEX, BIRTH_PLACE, EDUCATION_LEV, UNIT_MEASURE, TIME_PERIOD`. Example row: `AUT, MEASURE=EMP_WAP, BIRTH_PLACE=NB (Native-born), EDUCATION_LEV=ISCED11_3_4, 2024, 76.43`. `BIRTH_PLACE` takes `NB`/`FB`.

Agency `OECD.SDD.TPS` (labour force): `DSD_LFS@DF_IALFS_UNE_M` (monthly unemployment rate — verified 720 KB, e.g. `ROU, 2026-05, 5.4`), `DF_IALFS_UNE_Q`, `DF_IALFS_EMP_WAP_Q`, `DF_IALFS_LF_WAP_Q` (participation rate), `DF_IALFS_WAP_Q`, `DSD_ALFS@DF_SUMTAB`, **`DSD_OLAB@DF_OIALAB_INDIC` — infra-annual registered unemployment and job vacancies** (this is your cross-OECD vacancy series and the Beveridge-curve input).

### 3.3 Eurostat — vacancies + native/foreign-born splits

Base: `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/<CODE>?format=JSON&lang=EN&geo=XX&lastTimePeriod=N` (JSON-stat 2.0). All codes below returned **HTTP 200** on live call:

| Code | Content | Cadence |
|---|---|---|
| `jvs_q_nace2` | Job vacancy statistics by NACE Rev.2, quarterly (label confirms series 2001–2025; `"updated":"2026-03-20T23:00:00+0100"`) | Quarterly |
| `jvs_a_rate_r2` | Job vacancy rate, annual, by region | Annual |
| `lfsa_urgan` | Unemployment rate **by citizenship** (native / EU / non-EU) | Annual |
| `lfsa_ergan` | Employment rate **by citizenship** | Annual |
| `lfsa_argan` | Activity (participation) rate **by citizenship** | Annual |
| `lfsa_egised` | Employment by sex, **ISCO-08 occupation** and education | Annual |
| `earn_ses_pub1s` | Structure of Earnings Survey, by occupation | 4-yearly (SES) |

Job vacancy rate formula (Eurostat definition, use verbatim):
```
JVR = V / (V + O) × 100
V = number of vacant posts, O = number of occupied posts
```
Licence: Eurostat data reusable under Commission Decision **2011/833/EU** — free for commercial and non-commercial reuse with source acknowledgement.

### 3.4 US — BLS JOLTS (verified working, no key needed for v2 basic)

`POST https://api.bls.gov/publicAPI/v2/timeseries/data/`, body `{"seriesid":[...],"startyear":"2026","endyear":"2026"}`. Live results:

| Series ID | Meaning | Latest verified value |
|---|---|---|
| `JTS000000000000000JOL` | Job openings, level, total nonfarm (thousands, SA) | 2026-M07 = **7,271** (preliminary) |
| `JTS000000000000000JOR` | Job openings **rate**, total nonfarm | 2026-M07 = **4.4** (preliminary) |

Registration-free tier is rate-limited (25 queries/day, 10 years/query); registered v2 key gives 500/day. Cadence: monthly, ~5-week lag. Also pull `HIL` (hires), `TSL` (total separations), `QUR` (quits rate) for the Beveridge/tightness panel.

### 3.5 Other national vacancy sources

- **Germany:** Bundesagentur für Arbeit **Fachkräfteengpassanalyse**, interactive app at `https://statistik.arbeitsagentur.de/DE/Navigation/Statistiken/Interaktive-Statistiken/Fachkraeftebedarf/Engpassanalyse-Nav.html`. Annual. **14 indicators, 6 of them "shortage indicators"**: Vakanzzeit (vacancy duration), berufsspezifische Arbeitslosenquote, Lohnentwicklung, Arbeitsuchende-Stellen-Relation, Ausländeranteil, Abgangsrate aus Arbeitslosigkeit. Keyed on **KldB 2010 (Fassung 2020)**, 5-digit *Berufsgattung*; federal analysis at 4-digit, Länder at 3-digit. 2025 edition: **157 shortage occupations**.
- **UK:** ONS vacancy series (VACS02 / CDID `AP2Y`). **UNVERIFIED** — `api.ons.gov.uk` returned 404 on every path I tried (`/timeseries/{cdid}/dataset/{ds}/data`, `/dataset/{ds}/timeseries/{cdid}/data`, and `/datasets` root). Do not hardcode an ONS API path; scrape the published CSV from the VACS02 release page or treat UK vacancies as a manual CSV drop in the MVP.
- **EURES:** the public JSON search endpoint has moved. `https://europa.eu/eures/eures-apps/searchengine/page/jv-search/search` → **404**; `https://europa.eu/eures/api/jv-search/search` → **403**. **UNVERIFIED — do not build against EURES in the MVP.** Also note EURES T&C prohibit automated extraction for re-publication. EURES vacancies *are* ESCO-coded, so it is the ideal future source — park it behind a feature flag.

### 3.6 Global fallback (190+ countries, covers non-OECD/non-EU)

World Bank API v2, verified: `https://api.worldbank.org/v2/country/all/indicator/SL.TLF.CACT.ZS?format=json&date=2024&per_page=5` → HTTP 200, `"lastupdated":"2026-07-13"`, 265 economies. Use `SL.TLF.CACT.ZS` (LFPR), `SL.UEM.TOTL.ZS` (unemployment), `SL.TLF.ADVN.ZS` (advanced-education labour force). These are modelled ILO estimates — flag them in the UI as `MODELLED`, never as observed.

---

## 4. Taxonomies & crosswalks

| Taxonomy | Version (2026-09-18) | Machine-readable? | Licence | ISCO-08 route |
|---|---|---|---|---|
| **ISCO-08** | 2008, 436 unit groups | PDF + tables; ILOSTAT codelists via SDMX | ILO terms (UNVERIFIED string) | — (is the hub) |
| **ESCO** | **v1.2.1**, released **2025-12-10** (v1.2.0 May 2024) | **Yes** — REST API `https://ec.europa.eu/esco/api` + full download (CSV, RDF/XML, TTL, JSON-LD, ODS, XML); ~6.5M triples | Data reuse under Commission Decision **2011/833/EU**; API *software* under **EUPL 1.2** | **Built-in.** `occupation.code = "2221.3"`; `_links.broaderIscoGroup → .../esco/isco/C2221` |
| **O\*NET** | DB **31.0** (served by Web Services) | **Yes** — `https://services.onetcenter.org/...`, header **`X-API-Key`**; no hard rate limit, 429 → retry after ≥200 ms | Files **CC-BY 4.0**; Web Services require a licence agreement, commercial use permitted | Via `https://www.onetcenter.org/crosswalks/esco/ESCO_to_ONET-SOC.xlsx` (HTTP 200) → ESCO → ISCO. **No direct O\*NET→ISCO file exists on onetcenter.org** (verified: crosswalks page lists MOC, CIP, DOT, RAPIDS, OOH, ESCO, 2018-SOC — no ISCO). Third-party: IBS Warsaw `onetsoc_to_isco` crosswalk (`https://ibs.org.pl/en/resources/occupation-classifications-crosswalks-from-onet-soc-to-isco/`). |
| **NOC** | **2021 Version 1.0**, 5-digit, TEER-based | Yes — CSV on `open.canada.ca`, dataset `1feee3b5-8068-4dbb-b361-180875837593` | **Statistics Canada Open Licence** | StatCan publishes NOC↔ISCO-08 concordance (UNVERIFIED exact file URL) |
| **ANZSCO / OSCA** | ANZSCO 2022 still used by Home Affairs; **ABS has superseded it with OSCA 2024 v1.0** | Yes — ABS data cubes | CC BY 4.0 (ABS standard) | ABS ships an explicit **"Comparison with ISCO-08"** page + correspondence tables for OSCA 2024 v1.0 |
| **KldB** | **KldB 2010, Fassung 2020**, 5-digit | Yes — xlsx Umsteigeschlüssel | BA/Destatis open terms | Official **KldB 2010 (5-digit) → ISCO-08 (4-digit) Umsteigeschlüssel**, xlsx ~198 KB, at `statistik.arbeitsagentur.de/.../KldB2010-Fassung2020/Arbeitsmittel/Umschluesselungstabellen.html`. Caveat: **16 of 436 ISCO-08 unit groups (3.7%) are absent** — "no relevance in Germany". |
| **SOC (UK)** | SOC 2020, 412 4-digit occupations | Yes (ONS) | OGL v3.0 | ONS publishes SOC2020↔ISCO-08 (UNVERIFIED file URL) |

**Critical asymmetry to encode:** crosswalks are many-to-many. Store them as a weighted edge table, never as a unique FK.

---

## 5. Official shortage lists (the "demand signal" ground truth)

| Country/bloc | Instrument | Keyed on | Size | Validity | Notes |
|---|---|---|---|---|---|
| **EU** | Blue Card Directive **(EU) 2021/1883**, Annex I | **ISCO-08** | 2 groups: **133**, **25** | In force | Reduced threshold ≥80% of national threshold; requires ≥3 yrs experience in prior 7 |
| **Germany** | §18g AufenthG *Mangelberufe* + BA Engpassanalyse | ISCO-08 (statute) / KldB 2010 (BA) | 157 shortage occupations (2025 analysis) | Annual | 2026 Blue Card thresholds: **€50,700** general, **€45,934.20** shortage/IT/new entrants |
| **UK** | **Immigration Salary List (ISL)** (replaced SOL on 2024-04-04) | SOC 2020 | ~25 occupations | **Most entries expire 2026-12-31**; care-worker codes 6135, 6136 run to 2028-07-22 | ISL → 80% of the route's going rate |
| **UK** | **Temporary Shortage List (TSL)** | SOC 2020 | ~50 codes, RQF 3–5 | Operates alongside ISL, expected to end late 2026 | General SW threshold 2026: **£41,700** |
| **Canada** | Express Entry **category-based selection 2026** | NOC 2021 (5-digit) | **10 categories** | Annual (IRCC ministerial instruction) | 2026 categories: French, healthcare & social services, STEM, trades, education, **transport**, **physicians**, **senior managers**, **researchers**, **skilled military**. Min. experience raised **6 → 12 months**. Cooks removed from trades. Transport examples: NOC `72600`, `72404`, `22313`, `72410` |
| **Australia** | **Core Skills Occupation List (CSOL)**, in force since 2024-12-07 | **ANZSCO 2022** | ~**456** occupations | Updated more often than old MLTSSL/STSOL; JSA recommends | Core Skills income band (from 2026-07-01): **AUD 79,423 – 146,576** |
| **Japan** | Specified Skilled Worker (*Tokutei Ginō*) | Sector list, **not** an occupation classification | **16** operational sectors; 3 more (linen supply, logistics/warehousing, resource circulation) approved Jan 2026 → 19 | Cabinet decision | **Restaurant sector Type-1 new applications suspended 2026-04-13** (50,000 five-year cap) |
| **Korea** | EPS **E-9** / seasonal **E-8** | Sector quota, not occupational | 2026: **E-9 = 80,000** (mfg 50,000; agri/livestock 10,000; fisheries 7,000; construction 2,000; services 1,000); **E-8 = 109,000**; ~191,000 combined non-professional | Annual quota | Sector-level only — map to ISIC, not ISCO |

**Design consequence:** Japan and Korea are **sector**-keyed (ISIC), not occupation-keyed. The data model must accept a shortage rule keyed on *either* ISCO or ISIC, plus a "national code + crosswalk confidence" field. Do not force Japan/Korea into ISCO or you will fabricate precision.

---

## 6. The matching pipeline (build this literally)

### 6.1 Tables

```sql
dim_occupation_isco (isco_code CHAR(4) PK, label, minor, submajor, major, skill_level SMALLINT)
dim_esco_occupation (esco_uri PK, esco_code, isco_code CHAR(4) FK, pref_label_json)
fact_esco_skill     (esco_uri, skill_uri, relation ENUM('essential','optional'), skill_type ENUM('skill/competence','knowledge'))
xwalk_national      (src_system ENUM('KLDB2010','NOC2021','ANZSCO2022','OSCA2024','SOC2020','ONETSOC2019'),
                     src_code, isco_code, weight NUMERIC, source_url, retrieved_at)   -- many-to-many, weights sum to 1 per src_code
fact_supply         (origin_iso3, isco_code, birth_status ENUM('NB','FB'), sex, year, persons, source, is_modelled BOOL)
fact_demand         (dest_iso3, isco_code|isic_code, year, quarter, vacancies, jvr, source, vintage)
fact_shortage_rule  (dest_iso3, instrument, native_system, native_code, isco_code, weight,
                     salary_floor_local, currency, valid_from, valid_to, legal_ref)
fact_outcomes       (iso3, year, birth_status, edu_level, emp_rate, unemp_rate, lfpr, mean_earnings_ppp)
```

### 6.2 Ingest DAG (cadences are the actual publication cadences)

| Job | Source | Cadence | Idempotency key |
|---|---|---|---|
| `load_isco08` | ILO ISCO-08 Vol I structure | once | isco_code |
| `load_esco` | ESCO v1.2.1 CSV bundle (fallback: `ec.europa.eu/esco/api`) | on version bump (v1.1.2→v1.2 was 27 months; v1.2→v1.2.1 was 19 months) | esco_uri + version |
| `load_onet_esco_xwalk` | `onetcenter.org/crosswalks/esco/ESCO_to_ONET-SOC.xlsx` | on O\*NET DB bump (currently 31.0) | (onetsoc, esco_uri) |
| `load_kldb_isco` | BA Umschlüsselungstabellen xlsx | on KldB Fassung bump | (kldb5, isco4) |
| `pull_ilo_occ_birth` | `sdmx.ilo.org/rest/data/ILO,DF_EMP_TEMP_SEX_OCU_CBR_NB,1.0/all` (+ `_OC2_`) | monthly poll; source is annual | (ref_area, ocu, cbr, year) |
| `pull_oecd_mig` | `OECD.ELS.IMD` × 7 dataflows | quarterly | (ref_area, measure, birth_place, edu, year) |
| `pull_eurostat_jvs` | `jvs_q_nace2`, `jvs_a_rate_r2` | quarterly (`updated` field confirms 2026-03-20) | (geo, nace, quarter) |
| `pull_eurostat_citizenship` | `lfsa_urgan`, `lfsa_ergan`, `lfsa_argan`, `lfsa_egised` | annual | (geo, citizen, year) |
| `pull_jolts` | BLS v2 POST | monthly | (series_id, year, period) |
| `pull_wb_fallback` | World Bank v2 | annual (`lastupdated` 2026-07-13) | (iso3, indicator, year) |
| `scrape_shortage_lists` | 7 national sources | **manual-review queue, quarterly** | (dest_iso3, instrument, native_code, valid_from) |

**Shortage lists must never be auto-scraped into production without human sign-off.** They are legal instruments with hard expiry dates (UK ISL: 2026-12-31). Model them as versioned records with `valid_to` and render an expiry banner in the UI.

### 6.3 Core formulas (implement exactly)

**Vacancy rate (Eurostat):** `JVR = V / (V + O) × 100`

**Labour-market tightness:** `θ_c,o = V_c,o / U_c,o` (vacancies per unemployed person, country × occupation)

**Matching function (Cobb-Douglas, for simulation):**
`M = A · U^α · V^(1−α)`, α ≈ 0.5 as default prior; `A` = matching efficiency calibrated per country from observed hires (JOLTS `HIL` where available).

**Beveridge curve:** scatter `JVR_t` (y) vs `u_t` (x) per country; outward shift ⇒ falling matching efficiency ⇒ shortage is *structural*, not cyclical. This is the single most defensible "is migration the right lever?" visual in the product.

**Composite shortage index** (modelled on BA's six indicators; z-scores computed within country-year across occupations, so it is scale-free and cross-country comparable):

```
S_c,o = w1·z(vacancy_duration) + w2·z(−unemployment_rate_o) + w3·z(wage_growth_o)
      + w4·z(−jobseekers_per_vacancy) + w5·z(foreign_share_o) + w6·z(−outflow_from_unemployment)
default weights w1..w6 = 1/6 each; expose as sliders
flag: SHORTAGE if S_c,o > +1.0 SD  OR  occupation appears on an in-force official list
```
Always show the official-list flag and the computed index as **two separate channels**. The official list is law; the index is a model. Never merge them into one colour.

**Absorption / matchability score for a migrant cohort:**
```
Match(origin i → dest c) = Σ_o  supply_i,o · S_c,o · X_i→c,o
X_i→c,o = ESCO essential-skill Jaccard overlap between origin and destination job profiles for ISCO o
        ∈ [0,1], default 1.0 when both sides resolve to the same ISCO 4-digit
```

### 6.4 Resolution ladder (implement as a cascade with explicit provenance)

```
1. national_code → xwalk_national → isco_code           (weight, confidence = HIGH)
2. free-text job title → ESCO /search?type=occupation → esco_uri → broaderIscoGroup → isco_code  (confidence = MED)
3. O*NET-SOC → ESCO_to_ONET-SOC.xlsx → esco_uri → isco_code                                      (confidence = MED)
4. ISIC sector only (JP, KR) → no ISCO; store at sector grain, render separately                 (confidence = SECTOR-ONLY)
```
Every derived figure in the UI carries `confidence` + `source_url` + `retrieved_at`. This is the difference between "open-source Palantir" and a dashboard nobody trusts.

---

## 7. Known gaps to declare in the UI

- No global vacancy series exists. Vacancy coverage is EU (Eurostat) + OECD (`DSD_OLAB@DF_OIALAB_INDIC`) + US (JOLTS) + DE (BA). **The rest of the world has no vacancy data.** Render those countries in an explicit "no demand data" state, not as zero.
- ILOSTAT occupational data is at **ISCO-08 1-digit and 2-digit** for most countries; 4-digit is rare outside the EU LFS. Build the pivot at 4-digit but expect to aggregate to 2-digit for the world map.
- ESCO is EU-scoped: 3,039 occupations weighted toward European labour markets. Skill profiles for e.g. informal-sector occupations in low-income countries are thin.
- Japan/Korea cannot be expressed in ISCO without fabricating a mapping.
