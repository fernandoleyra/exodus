# Bilateral migration stock & flow datasets — verified inventory (probed 2026-09-18)

Every URL, parameter name and row count below was executed against the live service today unless explicitly marked **UNVERIFIED**.

## 0. The cadence truth the product must not lie about

| Tier | Sources | Real latency |
|---|---|---|
| **Quinquennial / irregular** | UN DESA IMS (1990,1995,2000,2005,2010,2015,2020,**2024**), WB GBMD (1960–2000 decennial), Abel & Cohen (5-yr intervals to 2015–2020), OECD DIOC (2000/01, 2005/06, 2010/11, 2015/16, **2020/21**), IMEM/QuantMig (2002–2019) | 4–10 years between vintages |
| **Annual** | Eurostat `migr_imm*`/`migr_emi*`/`migr_pop*`, OECD IMD (`DSD_MIG@DF_MIG`), WB WDI `SM.POP.TOTL`, KNOMAD BRE | 12–30 month publication lag |
| **Quarterly** | Eurostat `migr_asydcfstq`, `migr_asytpfq`, `migr_asywitfstq` | ~3 months |
| **Monthly (the only near-live bilateral signal)** | Eurostat `migr_asyappctzm`, `migr_asypenctzm`, `migr_asytpsm`, `migr_asytpfm`; UNHCR `asylum-applications` | **~4–8 weeks** |
| **Genuinely continuous** | IOM DTM API (key required), UNHCR ODP situation feeds | days–weeks, IDP/refugee only, not bilateral labour migration |

**There is no real-time bilateral migration stock or flow dataset anywhere on Earth.** The fastest true bilateral origin×destination series in existence is Eurostat `migr_asyappctzm` (asylum applicants, monthly, EU+EFTA destinations only) — as of today it carries data through **2026-08**, last updated **2026-09-17**. The MVP must label every layer with its vintage and a `latency_days` field, and reserve the word "live" for the asylum/displacement layer only.

---

## 1. UN DESA International Migrant Stock 2024 — the bilateral spine

- **Landing:** `https://www.un.org/development/desa/pd/content/international-migrant-stock`
- **Files** (base `https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/`):

| File | Bytes | Last-Modified |
|---|---|---|
| `undesa_pd_2024_ims_stock_by_sex_destination_and_origin.xlsx` | 6,005,287 | 2025-01-27 |
| `undesa_pd_2024_ims_stock_by_sex_and_destination.xlsx` | 541,936 | 2025-02-07 |
| `undesa_pd_2024_ims_stock_by_sex_and_origin.xlsx` | 231,809 | 2025-02-07 |
| `undesa_pd_2020_ims_stock_by_age_sex_and_destination.xlsx` (age bands only exist in 2020 ed.) | — | — |

- **CRITICAL IMPLEMENTATION GOTCHA (verified):** `un.org` returns **HTTP 403** to `curl` with the default UA. Sending `User-Agent: Mozilla/5.0 (X11; Linux x86_64)` returns **200/206** with `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. Range requests (`Range: bytes=0-`) are honoured. Any ingest worker must set a browser UA.
- **Granularity:** 233 countries/areas, destination × origin × sex (`male`/`female`/`both`), reference dates 1 July of 1990, 1995, 2000, 2005, 2010, 2015, 2020, **2024**. Matrix scale ≈ 233 × 233 × 8 × 3 ≈ 1.3M potential cells (sparse in the workbook).
- **Format:** XLSX only. **No API.** No SDMX. No CSV mirror from DESA.
- **Cadence:** irregular, ~4–5 years (2017, 2019, 2020, 2024 editions).
- **Known bias — must surface in UI:** only **60 of 233** countries/areas received a full reassessment in the 2024 edition; the remainder are **extrapolations of the 2020 edition**. Store a per-country `revision_status ∈ {reassessed_2024, extrapolated_from_2020}` flag and grey out/annotate extrapolated countries. Gulf states and several African countries have chronically weak register data. Refugee populations are folded into the stock, which double-counts against UNHCR layers if naively summed.
- **License:** UNVERIFIED as an SPDX string. UN Population Division data are customarily free to use with attribution to "United Nations, Department of Economic and Social Affairs, Population Division (2025). International Migrant Stock 2024." Do not assert CC BY.

### UN DESA Population Data Portal API (related, net migration only)
- Metadata endpoints are **open, no key**: `GET https://population.un.org/dataportalapi/api/v1/indicators/?format=json&pageSize=200` → 200 OK. Migration indicators: **id 65 `TNetMigration`** (Total net-migration), **id 66 `TNetMigRT`** (Crude rate of net migration). `…/api/v1/locations?format=json` → 200.
- **Data endpoints now require a bearer token**: `GET …/api/v1/data/indicators/65/locations/276/start/2024/end/2025` returned **HTTP 401 with an empty body**. Free registration required. Treat as **registration-gated**.
- Net migration is WPP-derived, **not bilateral** — it is a residual, and for many countries it is a demographic balancing term, not a measurement.

## 2. UN DESA International Migration Flows — dead since 2015

- **Landing:** `https://www.un.org/development/desa/pd/data/international-migration-flows` (note: `/content/international-migration-flows` is **404**; use `/data/`).
- **File:** `https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/undesa_pd_2015_migration_flow_totals.xlsx` — **66,462 bytes, Last-Modified 2020-11-09**.
- **Docs:** `…/undesa_pd_2015_migration_flow_documentation.pdf`
- **2015 Revision, 45 reporting countries, 1980–2013**, inflows and outflows by country of birth / citizenship / previous-next residence. **No update in 11 years.** Include only as a historical validation set; never as a current layer.

## 3. World Bank Global Bilateral Migration Database (GBMD)

- **Catalog:** `https://datacatalog.worldbank.org/search/dataset/0039577/global-bilateral-migration-database` (`dataset_unique_id = 0039577`)
- **DataBank:** `https://databank.worldbank.org/source/global-bilateral-migration` — dimensions confirmed on the live page: **232 countries of origin × 231 destinations × 5 years**.
- **Coverage:** 1960, 1970, 1980, 1990, 2000, by sex. Row scale ≈ 232 × 231 × 5 × 3 ≈ **804k**. Underlying: >1,000 census/register records; global stock 92M → 165M over the period.
- **License:** **CC BY 4.0**, Access to Information classification "Public".
- **Access:** the catalog page and DataBank export are the supported routes. **UNVERIFIED:** I could not resolve a stable direct bulk URL — `https://datacatalogfiles.worldbank.org/ddh-published/0039577/DR0045623/GlobalBilateralMigrationDatabase_csv.zip` returned **404**, and `https://databank.worldbank.org/data/download/GlobalBilateralMigration_CSV.zip` returned **404**. `https://datacatalogapi.worldbank.org/ddhxext/DatasetView?dataset_unique_id=0039577` rate-limited (**429**) then **404** on `DatasetResources`. GBMD is **not** exposed in `api.worldbank.org/v2` — I enumerated all 71 sources and no bilateral-migration source exists. **Treat GBMD as a manual one-time download, vendored into the repo.**
- **Gap:** ends in 2000. It is the historical backbone for Abel & Cohen, not a current layer.

### World Bank WDI (aggregate stock, API, no key) — verified working
```
GET https://api.worldbank.org/v2/country/all/indicator/SM.POP.TOTL?date=2024&format=json&per_page=500
→ {"page":1,"pages":53,"per_page":5,"total":265,"sourceid":"2","lastupdated":"2026-07-13"}
   e.g. AFE 2024 = 14,970,184
```
Source 2 = WDI, `lastupdated 2026-07-13`. Companion indicators: `SM.POP.TOTL.ZS` (% of population), `SM.POP.REFG`, `SM.POP.NETM` (net migration, 5-yr). **Not bilateral** — these are UN DESA IMS re-served.

## 4. KNOMAD bilateral remittance matrix — moved into Data360

`knomad.org/data/remittances` now **301-redirects to** `https://www.worldbank.org/en/brief/2024/09/18/remittances-knomad`. The data live in **World Bank Data360**, API open, **no key**:

```
GET https://data360api.worldbank.org/data360/indicators?datasetId=WB_KNOMAD
→ ["WB_KNOMAD_BRE","WB_KNOMAD_MRI","WB_KNOMAD_MRO","WB_KNOMAD_MIG"]

GET https://data360api.worldbank.org/data360/data?DATABASE_ID=WB_KNOMAD&INDICATOR=WB_KNOMAD_BRE&REF_AREA=USA
→ count 135
```

| Indicator | Meaning |
|---|---|
| `WB_KNOMAD_BRE` | Bilateral Remittance Estimates (migrant-stock-weighted) |
| `WB_KNOMAD_MRI` | Migrant remittance inflows (US$ m) |
| `WB_KNOMAD_MRO` | Migrant remittance outflows (US$ m) |
| `WB_KNOMAD_MIG` | Migration stock series |

- **Record shape (verified):** `{OBS_VALUE, REF_AREA, COMP_BREAKDOWN_1, TIME_PERIOD, FREQ:"A", UNIT_MEASURE:"USD_CUR", UNIT_MULT:0, SEX:"_T", AGE:"_T", OBS_STATUS:"A", LATEST_DATA:true}`.
- **Direction semantics (verified empirically):** `REF_AREA` = **remitting/source** country; `COMP_BREAKDOWN_1` = **receiving** country, prefixed `WB_KNOMAD_<ISO3>`. For `REF_AREA=USA`, `TIME_PERIOD=2021`: `WB_KNOMAD_WLD` = 200,216.09 (US$ m, i.e. $200.2bn total outward), `MEX` 52,595.34, `IND` 15,808.03, `GTM` 14,078.19, `PHL` 12,836.64, `CHN` 12,690.79, `DOM` 7,951.99, `VNM` 7,894.71. **A `WLD` aggregate row is mixed into the same result set — filter it out or you double the totals.**
- **Total BRE matrix size: `count` = 10,619 rows, single reference year 2021.** Pagination via `&skip=N`. **The bilateral matrix is frozen at 2021** — KNOMAD as a unit was wound down; only aggregate inflow/outflow series continue.
- **Metadata PDF (200 OK):** `https://data360files.worldbank.org/data360-data/metadata/WB_KNOMAD/WB_KNOMAD_BRE.pdf`
- **Bias:** BRE is not measured — it is **modelled by allocating BoP-recorded aggregate remittances across bilateral migrant stocks weighted by origin/destination per-capita income**. It therefore *cannot* be used as independent evidence about migrant stocks; it is derived from them. Label it "model output", never "data".
- **License:** World Bank open data terms, **CC BY 4.0** for the WDI-family; **UNVERIFIED** specifically for `WB_KNOMAD_BRE`.

## 5. OECD International Migration Database (IMD) — SDMX, no key, genuinely bilateral

Base: `https://sdmx.oecd.org/public/rest`. Agency `OECD.ELS.IMD`.

**Dataflows (enumerated live from `/dataflow/OECD.ELS.IMD/all/latest`):**

| Dataflow | Name |
|---|---|
| `DSD_MIG@DF_MIG` | International migration database |
| `DSD_MIG@DF_MIG_EMP_EDU` | Labour market outcomes of immigrants — employment rates by educational attainment |
| `DSD_MIG@DF_MIG_NUP_SEX` | Labour market outcomes of immigrants — employment, unemployment, participation rates |
| `DSD_MIG_F@DF_MIG_POPF` | IMD — stocks of foreign-born population |
| `DSD_MIG_INT@DF_MIG_INT` | Harmonised flows — internal database |
| `DSD_MIG_INT@DF_MIG_INT_PER` | Standardised inflows of permanent-type migrants |
| `DSD_MIG_INT@DF_MIG_INT_TEMP` | Standardised inflows of temporary migrants |

**Key order for `DSD_MIG@DF_MIG` (8 components, verified from returned CSV header):**
`REF_AREA . CITIZENSHIP . FREQ . MEASURE . SEX . BIRTH_PLACE . EDUCATION_LEV . UNIT_MEASURE`

**Working bilateral example (returns 200):**
```
GET https://sdmx.oecd.org/public/rest/data/OECD.ELS.IMD,DSD_MIG@DF_MIG,1.0/DEU.SYR.A.._T...?startPeriod=2023&endPeriod=2023
Accept: application/vnd.sdmx.data+csv
```
→
```
DEU,SYR,A,B11,_T,_Z,_Z,PS,2023,128742   # inflows of foreign population by nationality
DEU,SYR,A,B12,_T,_Z,_Z,PS,2023,18419    # outflows
DEU,SYR,A,B13,_T,_Z,_Z,PS,2023,102930   # acquisitions of nationality
DEU,SYR,A,B15,_T,_Z,_Z,PS,2023,923805   # stock of foreign population
DEU,SYR,A,B16,_T,_Z,_Z,PS,2023,75485
```
Use `CITIZENSHIP=W` for world totals (`DEU.W.A.B11._T...` → 2022: 2,481,019; 2023: 1,741,153).

- **MEASURE codes in use:** `B11`, `B12`, `B13`, `B15`, `B16`. `CL_MIG_MEASURE` under `OECD.ELS.IMD` returns **404** — resolve labels from the DSD referenced by the dataflow instead. Mapping above for B11/B12/B13/B15 is inferred from magnitudes and OECD convention; **B16 label UNVERIFIED**.
- **Latest year (verified):** reference period **2023** is fully populated; **2024** exists only for `B13` (36 countries) and `B15` (26 countries) as of today. Ingest must not assume rectangular year coverage.
- **Spatial:** 38 OECD destinations × ~200 citizenships. **Only OECD destinations** — Gulf, most of Africa, most of Asia absent. This is the single largest coverage hole for a "whole world" product.
- **Cadence:** annual, typically published with the *International Migration Outlook* in Q4; ~18–24 month lag.
- **Auth:** **none.** `Accept: application/vnd.sdmx.data+csv; version=1.0.0` for flat CSV; `?dimensionAtObservation=AllDimensions` for fully-keyed output. Terms: OECD Terms and Conditions; **UNVERIFIED** whether this is CC BY 4.0 for the migration tables specifically.

## 6. OECD DIOC — census-based immigrant characteristics, bulk XLSX only

- **Landing:** `https://www.oecd.org/en/data/datasets/database-on-immigrants-in-oecd-and-non-oecd-countries.html`
- **Bulk directory (HTTP 200, plain IIS directory listing):**
  `https://webfs.oecd.org/els-com/Migration/Databases/Database%20on%20Immigrants%20in%20OECD%20and%20non-OECD%20Countries%20DIOC/DIOC%20database%20-%20click%20here/`
  with `Reference%20years%202020-2021/` containing `t1_TOP100.xlsx`, `t3_TOP100.xlsx`, `t4_TOP100.xlsx`, `t5_TOP100.xlsx`, `t6_TOP100.xlsx`. Directory timestamps observed: 2024-05-28 and **2024-10-14**.
- **Latest round: 2020/21.** Prior rounds 2000/01, 2005/06, 2010/11, 2015/16.
- **Content:** ~34–38 destination countries × 200+ origins, cross-classified by **age, sex, duration of stay, educational attainment, field of study, labour force status, occupation**. This is the *only* open dataset that gives you origin × destination × **skill level**, which is what a "how much workforce can it hold" calculator actually needs.
- **Format:** XLSX, no API, no SDMX. Scrape the directory listing.
- **Cadence:** quinquennial, ~3-year lag after the census round.
- **Bias:** built from national census microdata with heterogeneous education coding (ISCED mapping varies); "TOP100" files truncate to the 100 largest origins, hiding the long tail.

## 7. Eurostat `migr_*` — the richest, fastest, cleanest bilateral source on the planet (for Europe)

**REST base:** `https://ec.europa.eu/eurostat/api/dissemination/`. **No API key. No registration. No rate limit encountered.**

**Three access shapes, all verified 200:**
```
# JSON-stat 2.0
GET .../statistics/1.0/data/migr_imm5prv?format=JSON&lang=EN&geo=DE&time=2023

# SDMX 2.1, key order = freq.partner.agedef.age.unit.sex.geo
GET .../sdmx/2.1/data/migr_imm5prv/A.SY.COMPLET.TOTAL.NR.T.DE?startPeriod=2023&endPeriod=2024
  → 2023: 88,973 ; 2024: 63,444   (Syrian immigration to Germany)

# DSD (dimension order discovery)
GET .../sdmx/2.1/datastructure/ESTAT/MIGR_IMM5PRV

# Full-table bulk, gzipped SDMX-CSV
GET .../sdmx/2.1/data/migr_imm5prv/?format=SDMX-CSV&compressed=true
  → 38,137,114 bytes gz → 798,877,341 bytes raw → 10,037,576 rows
  header: DATAFLOW,LAST UPDATE,freq,partner,agedef,age,unit,sex,geo,TIME_PERIOD,OBS_VALUE,OBS_FLAG,CONF_STATUS

# Machine-readable catalogue (use this to auto-detect refreshes)
GET .../catalogue/toc/txt?lang=en      → 1,976,422 bytes; 240 migr_* codes
```
The TOC is TSV: `title, code, type, ..., last_update, ..., data_start, data_end, values`. **Poll it to drive incremental ingest.**

**Annual bilateral tables (last update / coverage / row count — all read from the live TOC today):**

| Code | Title | Last update | Years | Rows |
|---|---|---|---|---|
| `migr_imm1ctz` | Immigration by age group, sex and citizenship | 29.05.2026 | 1998–2024 | 12,212,694 |
| `migr_imm5prv` | Immigration by age group, sex and country of previous residence | 02.07.2026 | 1998–2024 | 9,971,243 |
| `migr_imm3ctb` | Immigration by age group, sex and country of birth | 02.07.2026 | 2008–2024 | 10,077,044 |
| `migr_emi1ctz` | Emigration by age group, sex and citizenship | 01.07.2026 | 1998–2024 | 12,025,398 |
| `migr_emi3nxt` | Emigration by age group, sex and country of next usual residence | 02.07.2026 | 1998–2024 | 9,398,363 |
| `migr_emi4ctb` | Emigration by age group, sex and country of birth | 02.07.2026 | 2008–2024 | 9,155,661 |
| `migr_pop1ctz` | Population 1 Jan by age group, sex and citizenship | 10.08.2026 | 1998–**2025** | 8,785,137 |
| `migr_pop3ctb` | Population 1 Jan by age group, sex and country of birth | 10.08.2026 | 1998–**2025** | 7,071,362 |
| `migr_acq` | Acquisition of citizenship by age group, sex, former citizenship | 27.03.2026 | 1998–2024 | 13,155,955 |
| `migr_resfirst` | First residence permits by reason, validity, citizenship | 11.09.2026 | 2008–**2025** | 2,013,621 |
| `migr_resocc` | First permits for remunerated activities by reason/validity | 11.09.2026 | 2008–**2025** | 2,118,914 |
| `migr_resvalid` | All valid permits by reason, validity, citizenship (31 Dec) | 11.09.2026 | 2008–**2025** | 1,656,392 |

**Sub-annual tables — the product's "live" layer:**

| Code | Title | Last update | Coverage | Rows |
|---|---|---|---|---|
| `migr_asyappctzm` | Asylum applicants by type, citizenship, age, sex — **monthly** | **17.09.2026** | 2008-01 → **2026-08** | 103,640,312 |
| `migr_asypenctzm` | Pending applications end of month | 16.09.2026 | 2008-01 → 2026-08 | 44,911,194 |
| `migr_asyaccm` | Applications processed under Dublin — monthly | 17.09.2026 | 2021-01 → 2026-08 | 13,690,760 |
| `migr_asytpsm` | Beneficiaries of temporary protection, end of month (Ukraine) | 14.09.2026 | 2022-03 → 2026-08 | 10,748,092 |
| `migr_asytpfm` | Decisions granting temporary protection — monthly | 14.09.2026 | 2022-03 → 2026-08 | 10,786,364 |
| `migr_asydcfstq` | First-instance decisions by type, citizenship — **quarterly** | 16.09.2026 | 2008-Q1 → 2026-Q2 | 91,495,560 |
| `migr_asyumactm` | Unaccompanied minor applicants — monthly | 17.09.2026 | 2021-01 → 2026-08 | 19,975,896 |

**Latency measured today: reference month 2026-08, updated 2026-09-17 → ~4 weeks.** That is the product's real "live" ceiling.

- **Spatial:** 27 EU + EFTA + candidate destinations; `partner`/`citizen` dimension covers ~250 origins.
- **License:** Eurostat re-use policy, free re-use with source acknowledgement, per **Commission Decision 2011/833/EU**. Practically CC BY 4.0-equivalent.
- **Bias:** national definitions of "immigration" vary despite Regulation (EC) 862/2007; the 12-month duration criterion is applied inconsistently. Origin↔destination mirror statistics disagree by up to 2× for some pairs (e.g. PL↔UK historically) — this is exactly what IMEM/QuantMig was built to fix.

## 8. Abel & Cohen bilateral flow estimates — the only whole-world bilateral **flow** dataset

- **figshare article 14579241, "Bilateral international migration flow estimates by sex and type of move"**
- **Version 6, published 2025-03-26, license CC BY 4.0**
- **Direct download (verified 206 with Range):** `https://ndownloader.figshare.com/files/53236079` — `bilat_mig_sex_type.csv`, **65,341,478 bytes**
- **Metadata API (no key):** `https://api.figshare.com/v2/articles/14579241`
- **Verified CSV header:** `year0,sex,orig,dest,type,da_min_open,da_min_closed,da_pb_closed`
  - `year0` = start of the 5-year interval (1990, 1995, … 2015)
  - `sex ∈ {male, female}` (and total, UNVERIFIED)
  - `orig`, `dest` = ISO3
  - `type ∈ {outward, return, transit}` — **this decomposition matters: naive summation of all three triple-counts**
  - `da_min_open`, `da_min_closed`, `da_pb_closed` = three estimator variants (demographic accounting, minimisation vs pseudo-Bayesian, open vs closed demography). The papers find the **closed demographic accounting** estimators perform best; default to `da_pb_closed` and expose the spread between the three as the uncertainty band.
- **Countries:** 200 (companion country list: figshare 21408174)
- **Latest interval: 2015–2020.** v6 is rebased on **IMS2024**, but flows for **2020–2024 were deliberately NOT generated**, to avoid mixing 4-year and 5-year intervals. Do not fabricate a 2020–2025 flow layer.
- **Papers:** Abel & Cohen, *Scientific Data* 6:82 (2019), `https://www.nature.com/articles/s41597-019-0089-3`; Abel & Cohen, *Scientific Data* 9:173 (2022), `https://www.nature.com/articles/s41597-022-01271-z`
- **Fundamental caveat:** these are **not observed flows**. They are the minimum set of moves consistent with two consecutive stock tables plus births/deaths. They systematically understate churn (circular and repeat migration cancel out) and are entirely dependent on IMS quality.
- **Newer contender, UNVERIFIED:** arXiv **2506.22821**, "Deep learning four decades of human migration" — claims annual bilateral flow estimates. Do not wire it in without reading the data availability statement.

## 9. IMEM → QuantMig

- **IMEM:** `https://www.imem.cpc.ac.uk/` — Bayesian harmonised flows, **31 EU/EFTA countries + rest-of-world**, by origin, destination, age, sex, **2002–2008 only**. Web query tool; **UNVERIFIED** whether a bulk file exists.
- **Successor — QuantMig Migration Estimates Explorer:** `https://www.quantmig.eu/data_and_estimates/estimates_explorer/` — **32 countries** (EU + UK + EFTA + North Macedonia) plus **8 world macro-regions** (Other Europe, North Africa, Sub-Saharan Africa, Middle East, South & South-East Asia, East Asia, Latin America, Northern America & Australia-Oceania), **2002–2019**, probabilistic with credible intervals, by origin, destination, sex, age, region of birth. Integrates IMEM for 2002–2008.
- **Bulk data:** Zenodo community `https://zenodo.org/communities/quantmig`. **UNVERIFIED:** I did not resolve the specific record DOI for the estimates file. Related records seen in search: `zenodo.org/records/8169110` (DEMIG-QuantMig Policy Database), `zenodo.org/records/7709443`, `zenodo.org/records/7728049`. Resolve via the Zenodo API before hardcoding: `https://zenodo.org/api/records?communities=quantmig&size=50`.
- **Project ended (H2020 GA 870299) — no further updates expected.** This is the gold standard for *uncertainty-aware* European flows and should drive the MVP's confidence-interval UI, but it is frozen at 2019.

## 10. IOM GMDAC / Global Migration Data Portal — aggregator, not a source

- `https://www.migrationdataportal.org/` — **returns HTTP 403 to automated fetchers.**
- It **hosts no primary data and exposes no API**. It re-serves UN DESA, UNSD, Eurostat, OECD and WDI behind visualisations, plus its own editorial layer (thematic pages, *Essentials of Migration Data* handbook, SDG 10.7 indicator pages).
- **Use it as a documentation/metadata reference for humans, never as an ingest target.**

## 11. IOM Displacement Tracking Matrix (DTM) — registration required

- **Portal:** `https://dtm.iom.int/data-and-analysis/dtm-api` · key signup `https://dtm-apim-portal.iom.int/signin`
- **API v3 requires a subscription key** in `DTM_SUBSCRIPTION_KEY`. Official clients: `dtmapi` (PyPI) and `dtmapi-R` (`https://displacement-tracking-matrix.github.io/dtmapi-R/`), functions `get_idp_admin_0_data()`, `get_idp_admin_1_data()`, `get_idp_admin_2_data()`, `get_all_countries()`, `get_all_operations()`.
- **Legacy keyless host is gone:** `https://dtmapi.iom.int/api/...` returns `{"statusCode":404,"message":"Resource not found"}` for every path I tried. **Do not hardcode dtmapi.iom.int paths.**
- Content: **non-sensitive IDP figures only**, aggregated to admin0/1/2, 50+ countries. **Internal displacement, not international bilateral migration.**
- **Keyless mirror that works today:** HDX — `https://data.humdata.org/dataset/global-iom-dtm-from-api` (CKAN API: `https://data.humdata.org/api/3/action/package_show?id=global-iom-dtm-from-api`).

## 12. UNHCR Refugee Data Finder API — the best keyless near-live bilateral feed

**Base `https://api.unhcr.org/population/v1/`. No key. No registration. Verified working today.**

```
GET .../population/?year=2024&coo_all=true&coa_all=true&coo=SYR&coa=DEU
GET .../asylum-applications/?year=2025&coo_all=true&coa_all=true&coa=DEU
   → {"total":{"applied":3343203}, "maxPages":3005, items:[{year,coo_iso,coa_iso,procedure_type,app_type,dec_level,app_pc,applied}]}
GET .../years/    → 1951 … present
```
Endpoints: `population`, `asylum-applications`, `asylum-decisions`, `solutions`, `demographics`, `unrwa`, `idmc`, `years`, `countries`.

- **CRITICAL QUIRKS (both observed live):**
  1. Omitting `coo_all=true&coa_all=true` collapses everything into a single aggregate row with `coo="-"`. You **must** pass both to get a bilateral breakdown.
  2. The `coo`/`coa` fields are **not reliable ISO3**. One returned record read `"coa_name":"Egypt","coa":"ARE","coa_iso":"EGY"` — the short code disagreed with the name and the ISO field. **Always join on `coo_iso`/`coa_iso`, never `coo`/`coa`.**
- Pagination: `&limit=` and `&page=`; `maxPages` in the envelope. Global 2024 totals returned: refugees 30,958,200; asylum seekers 8,352,712; IDPs 68,131,711; stateless 4,360,087; returned refugees 1,615,821.
- **Cadence:** mid-year and year-end releases for stocks; asylum applications updated far more frequently — **2025 data already complete today**.
- **License:** UNVERIFIED as SPDX. UNHCR Refugee Data Finder is published as open data with attribution required.

---

## 13. Ingest-architecture consequences

**Canonical fact table** — every source normalises to one shape:
```
migration_fact(
  origin_iso3, dest_iso3, year, period_type ENUM('annual','5yr','monthly','quarterly'),
  sex ENUM('m','f','t'), age_band, measure_code, value NUMERIC,
  source_id, vintage_date, latency_days,
  estimate_kind ENUM('observed','modelled','extrapolated'),
  ci_low NUMERIC NULL, ci_high NUMERIC NULL
)
```
`estimate_kind` is non-negotiable: UN DESA extrapolated countries, KNOMAD BRE, Abel & Cohen and QuantMig are all **modelled**, and rendering them in the same visual register as Eurostat register counts would be the product's core integrity failure.

**Country-code reconciliation is a first-class module.** You are joining: UN M49 numeric (DESA), ISO3 (WB, Abel, UNHCR), Eurostat GEO codes (`UK` not `GB`, `EL` not `GR`, `XK` for Kosovo), OECD SDMX REF_AREA, and KNOMAD's `WB_KNOMAD_<ISO3>` prefixes. Kosovo, Taiwan, Palestine, Western Sahara, Curaçao/Netherlands Antilles, Sudan/South Sudan (2011), Serbia and Montenegro (2006), USSR/Yugoslavia successor states all need explicit crosswalk rows with validity date ranges. Build this against a versioned table, not a dict literal.

**Mirror-statistics reconciliation is the honest headline feature.** For any EU pair you can compute both `migr_imm5prv[dest=B, partner=A]` and `migr_emi3nxt[dest=A, partner=B]` and show the divergence. That divergence *is* the data-quality story, and it is what QuantMig/IMEM exist to model. A globe that shows one number per arc is lying; a globe that shows the arc plus its reported-by-sender / reported-by-receiver spread is a genuine intelligence product.

**Refresh scheduler, by real cadence:**
| Source | Poll |
|---|---|
| Eurostat TOC (`catalogue/toc/txt`) | daily — it carries `last_update` for all 240 `migr_*` codes |
| UNHCR `asylum-applications` | daily |
| Eurostat monthly asylum tables | weekly |
| OECD SDMX `DSD_MIG@DF_MIG` | monthly |
| WB Data360 / WDI | monthly |
| UN DESA IMS, GBMD, DIOC, Abel figshare, QuantMig Zenodo | quarterly HEAD/etag check; effectively vendored |

## 14. Coverage honesty map (what "whole world" actually means)

| Region | Bilateral stock | Bilateral flow | Sub-annual signal |
|---|---|---|---|
| EU/EFTA | Eurostat + DESA + OECD | **Eurostat annual, register-grade** | **Monthly asylum** |
| Other OECD (US, CA, AU, NZ, JP, KR, MX, CL, TR, IL) | DESA + OECD IMD + DIOC | OECD IMD annual | UNHCR only |
| Gulf (GCC) | **DESA only, extrapolated** | **Abel & Cohen model only** | none |
| Sub-Saharan Africa | DESA + GBMD (to 2000) | **Abel & Cohen model only** | UNHCR + DTM (key) |
| South/SE Asia | DESA | **Abel & Cohen model only** | UNHCR + DTM (key) |
| Latin America | DESA + partial OECD | Abel & Cohen; some national | UNHCR (R4V for VEN) |
| China, Russia, Iran | DESA, thin | model only | none |

Roughly **80% of the world's land area has exactly one bilateral flow source, and it is a model.** The MVP's globe must encode this — e.g. arc opacity or a hatch pattern driven by `estimate_kind`, and a per-country data-density score — or it will present Gulf labour corridors with the same visual authority as German register data.

## 15. Sources

- https://www.un.org/development/desa/pd/content/international-migrant-stock
- https://www.un.org/development/desa/pd/data/international-migration-flows
- https://population.un.org/dataportalapi/api/v1/indicators/
- https://datacatalog.worldbank.org/search/dataset/0039577/global-bilateral-migration-database
- https://databank.worldbank.org/source/global-bilateral-migration
- https://data360api.worldbank.org/data360/indicators?datasetId=WB_KNOMAD
- https://data360files.worldbank.org/data360-data/metadata/WB_KNOMAD/WB_KNOMAD_BRE.pdf
- https://www.worldbank.org/en/brief/2024/09/18/remittances-knomad
- https://api.worldbank.org/v2/country/all/indicator/SM.POP.TOTL
- https://sdmx.oecd.org/public/rest/dataflow/OECD.ELS.IMD/all/latest
- https://www.oecd.org/en/data/datasets/database-on-immigrants-in-oecd-and-non-oecd-countries.html
- https://webfs.oecd.org/els-com/Migration/Databases/Database%20on%20Immigrants%20in%20OECD%20and%20non-OECD%20Countries%20DIOC/DIOC%20database%20-%20click%20here/
- https://ec.europa.eu/eurostat/api/dissemination/catalogue/toc/txt?lang=en
- https://ec.europa.eu/eurostat/cache/metadata/en/migr_immi_esms.htm
- https://api.figshare.com/v2/articles/14579241
- https://www.nature.com/articles/s41597-022-01271-z
- https://www.nature.com/articles/s41597-019-0089-3
- https://www.imem.cpc.ac.uk/
- https://www.quantmig.eu/data_and_estimates/estimates_explorer/
- https://zenodo.org/communities/quantmig
- https://www.migrationdataportal.org/themes/international-migrant-stocks-overview
- https://dtm.iom.int/data-and-analysis/dtm-api
- https://displacement-tracking-matrix.github.io/dtmapi-R/
- https://data.humdata.org/dataset/global-iom-dtm-from-api
- https://api.unhcr.org/population/v1/