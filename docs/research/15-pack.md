# Bilateral migration stock & flow datasets — adversarially verified inventory (re-probed 2026-09-18)

Everything below was executed against the live service on 2026-09-18 unless marked **[UNVERIFIED]**. Items marked **[verified]** were confirmed byte-for-byte or string-for-string today. Several load-bearing claims in the previous draft were **wrong** and have been fixed in place — see §0a.

## 0a. Corrections to the previous draft (read this first)

1. **OECD MEASURE codes were mislabelled.** `B13` is *Inflows of asylum seekers*, not acquisitions of nationality. `B16` is *Acquisitions of nationality by country of former nationality*. The codelist is `CL_MEASURE_MIG`, not `CL_MIG_MEASURE`. See §5.
2. **UNHCR `coo`/`coa` are not "unreliable ISO3" — they are a different code system.** Germany is `GFR`, Egypt is `ARE`, UAE is `UAE`. `coa=DEU` returns **zero rows**, silently. See §12.
3. **`coo_all=true&coa_all=true` overrides `coo`/`coa` filters**, returning the entire global matrix. The previous draft's flagship example did not do what it claimed. See §12.
4. **IOM DTM data on HDX is not open.** Licence is non-commercial, **no redistribution, no derivative works**. The "keyless MVP fallback" recommendation was a legal-risk recommendation. See §11.
5. **UN DESA IMS 2024 *is* licensed: CC BY 3.0 IGO**, stated inside the workbook. Citation year is (2024), not (2025). See §1.
6. **A far better global bilateral flow dataset exists and was dismissed.** Gaskin & Abel, *Nature* **655**, 148–157 (2026), CC BY 4.0: **annual** origin×destination flows and stocks, 230 countries, 1990–2023, with uncertainty bounds. Data on Zenodo, code on GitHub. This materially changes the product's coverage story. See §8b.
7. **The QuantMig estimates file was found** (Zenodo 8224827) — and it is a **5.93 GB** zip of RData, not a vendorable CSV. The Zenodo API call in the previous draft returns HTTP 400. See §9.
8. **Abel & Cohen v6 has no `total` sex category** — only `male` and `female`. And it covers **232** origins/destinations, not 200.

---

## 0. The cadence truth the product must not lie about

| Tier | Sources | Real latency |
|---|---|---|
| **Quinquennial / irregular** | UN DESA IMS (1990,1995,2000,2005,2010,2015,2020,**2024** [verified from workbook table list]), WB GBMD (1960–2000 decennial), Abel & Cohen (5-yr intervals, last = 2015–2020), OECD DIOC (2000/01, 2005/06, 2010/11, 2015/16, **2020/21**), IMEM/QuantMig (2002–2019) | 4–10 years between vintages |
| **Annual** | Eurostat `migr_imm*`/`migr_emi*`/`migr_pop*`, OECD IMD (`DSD_MIG@DF_MIG`), WB WDI `SM.POP.TOTL`, **Gaskin & Abel 1990–2023** | 12–30 month publication lag |
| **Annual, frozen** | KNOMAD BRE (single year: 2021) | dead |
| **Quarterly** | Eurostat `migr_asydcfstq`, `migr_asytpfq`, `migr_asywitfstq` | ~3 months |
| **Monthly (the only near-live bilateral signal)** | Eurostat `migr_asyappctzm`, `migr_asypenctzm`, `migr_asytpsm`, `migr_asytpfm`, `migr_asyaccm`, `migr_asyumactm`; UNHCR `asylum-applications` | **~4 weeks** |
| **Genuinely continuous** | IOM DTM API (key required, **licence-restricted**), UNHCR ODP situation feeds | days–weeks, IDP/refugee only, not bilateral labour migration |

**There is no real-time bilateral migration stock or flow dataset anywhere on Earth.** [verified] The fastest true bilateral origin×destination series is Eurostat `migr_asyappctzm` (asylum applicants, monthly, EU+EFTA destinations only) — as of today it carries data through **2026-08**, last updated **17.09.2026** [verified from the live TOC]. Every layer must carry a `vintage_date` and `latency_days`, and the word "live" belongs only to the asylum/displacement layer.

---

## 1. UN DESA International Migrant Stock 2024 — the bilateral spine

- **Landing:** `https://www.un.org/development/desa/pd/content/international-migrant-stock` → **200** [verified]
- **Database code:** `POP/DB/MIG/Stock/Rev.2024` [verified, read from the workbook]
- **Files** (base `https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/`):

| File | Bytes | Last-Modified |
|---|---|---|
| `undesa_pd_2024_ims_stock_by_sex_destination_and_origin.xlsx` | 6,005,287 [verified] | 2025-01-27 [verified] |
| `undesa_pd_2024_ims_stock_by_sex_and_destination.xlsx` | 541,936 [verified] | 2025-02-07 [verified] |
| `undesa_pd_2024_ims_stock_by_sex_and_origin.xlsx` | 231,809 [verified] | 2025-02-07 [verified] |

- **CRITICAL IMPLEMENTATION GOTCHA [verified today, both directions]:** `un.org` returns **HTTP 403** to `curl` with the default UA. Sending `User-Agent: Mozilla/5.0 (X11; Linux x86_64)` returns **200** with `content-type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and `accept-ranges: bytes`. Any ingest worker must set a browser UA.
- **Workbook structure [verified by opening the XLSX]:** the destination×origin file has sheets `Table of contents`, `Table 1`…`Table 9`, `Migrant notes`. **`Table 1` is the entire bilateral matrix** — "International migrant stock at mid-year by sex and by region, country or area of destination and origin, 1990-2024". Tables 2–9 are regional aggregate cross-tabs, one per reference year (2024, 2020, 2015, 2010, 2005, 2000, …), which is how the 8 reference dates are confirmed. Row metadata columns are `Region, development group, country or area`, `Coverage`, `Data type`, `Location code` (= **UN M49 numeric**). The by-destination file has sheets `Table of contents`, `Table 1`–`Table 5`, `Migrant notes`, `Population notes`, with sex as three column blocks: *both sexes combined*, *males*, *females*.
- **Granularity:** 233 countries/areas [verified], destination × origin × sex, reference dates 1 July of 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024.
  - **[UNVERIFIED — corrected]** The previous draft's "≈1.3M cells" is a dimensional product (233 × 233 × 8 × 3), not a count of populated cells. Table 1 is stored **wide** (origins as columns), and the whole workbook is 6 MB, so the populated count is far lower. Do not budget storage from the dimensional product; melt Table 1 and count.
- **Format:** XLSX only. **No API. No SDMX. No CSV mirror from DESA.** [verified]
- **Cadence:** irregular, ~4–5 years.
- **Known bias — must surface in UI [verified, directly stated on the landing page]:** of the 233 countries/areas, **60 "received a full reassessment of trends in the number of international migrants residing in the territory"**; the remaining **173** "reflect extrapolations of estimates published in the 2020 edition of the dataset." The Population Division states it "prioritized revising the estimates for countries with new empirical information from population censuses or registers and relatively large numbers of international migrants, as well as for countries affected by ongoing or emergent refugee flows as documented by UNHCR." Store a per-country `revision_status ∈ {reassessed_2024, extrapolated_from_2020}` and encode it visually. Refugee populations are folded into the stock, which double-counts against UNHCR layers if naively summed.
- **License [verified — this replaces the previous "do not assert" note]:** the workbook itself states: *"Copyright © 2024 by United Nations, made available under a Creative Commons license CC BY 3.0 IGO: http://creativecommons.org/licenses/by/3.0/igo/"*. It is **CC BY 3.0 IGO**, not CC BY 4.0 — the IGO variant, which carries a dispute-resolution/privileges-and-immunities clause and is *not* interoperable with CC BY 4.0 in a ShareAlike sense. Suggested citation [verified verbatim]: *"United Nations Department of Economic and Social Affairs, Population Division (**2024**). International Migrant Stock 2024."*

### UN DESA Population Data Portal API (related, net migration only)
- Metadata endpoints are **open, no key** [verified]: `GET https://population.un.org/dataportalapi/api/v1/indicators/?format=json&pageSize=200` → **200**. Migration indicators confirmed by name today: **id 65 `TNetMigration`** ("Total net-migration"), **id 66 `TNetMigRT`** ("Crude rate of net migration") [verified]. `…/api/v1/locations?format=json` → 200.
- **Data endpoints require a token** [verified]: `GET …/api/v1/data/indicators/65/locations/276/start/2024/end/2025` → **HTTP 401, empty body**. Free registration required. Treat as registration-gated.
- Net migration is WPP-derived, **not bilateral** — a residual and, for many countries, a demographic balancing term rather than a measurement.

## 2. UN DESA International Migration Flows — dead since 2015

- **Landing:** `https://www.un.org/development/desa/pd/data/international-migration-flows` → **200** [verified]. `/content/international-migration-flows` → **404** [verified]. Use `/data/`.
- **File:** `…/files/undesa_pd_2015_migration_flow_totals.xlsx` — **66,462 bytes, Last-Modified 2020-11-09** [verified]
- **Docs:** `…/files/undesa_pd_2015_migration_flow_documentation.pdf` — **337,372 bytes, Last-Modified 2020-11-09** [verified]
- **2015 Revision, 45 reporting countries, 1980–2013** [UNVERIFIED — country count and year span not re-confirmed today], inflows and outflows by country of birth / citizenship / previous-next residence. **No update in 11 years** [verified from Last-Modified]. Historical validation set only; never a current layer.

## 3. World Bank Global Bilateral Migration Database (GBMD)

- **Catalog:** `https://datacatalog.worldbank.org/search/dataset/0039577/global-bilateral-migration-database` → **200** [verified] (`dataset_unique_id = 0039577`)
- **License [verified on the catalog page]:** **Creative Commons Attribution 4.0**; Access to Information classification **"Public"**; **last updated 2023-01-19**.
- **Coverage:** 1960–2000, decennial, by sex [verified on catalog page as "1960-2000"].
- **[UNVERIFIED]** The "232 origins × 231 destinations × 5 years" dimension figures come from the DataBank UI and could not be re-confirmed programmatically today (DataBank is a JS app). The derived "≈804k rows" is arithmetic on that, not an observed row count. Do not size infrastructure from it.
- **Access — no bulk URL exists [verified]:** the catalog page shows **"Downloads (0)"**. `https://datacatalogfiles.worldbank.org/ddh-published/0039577/DR0045623/GlobalBilateralMigrationDatabase_csv.zip` → **404**. `https://databank.worldbank.org/data/download/GlobalBilateralMigration_CSV.zip` → **301** (redirect, not a file). `https://datacatalogapi.worldbank.org/ddhxext/DatasetView?dataset_unique_id=0039577` is **aggressively rate-limited — returned HTTP 429 "Rate limit is exceeded. Try again in 30 seconds." on every one of four attempts spread over several minutes** [verified]. GBMD is **not** in `api.worldbank.org/v2`. **Treat GBMD as a manual one-time download via DataBank, vendored into the repo with a checksum.**
- **Gap:** ends in 2000. Historical backbone for Abel & Cohen, not a current layer.

### World Bank WDI (aggregate stock, API, no key) — verified working
```
GET https://api.worldbank.org/v2/country/all/indicator/SM.POP.TOTL?date=2024&format=json&per_page=500
→ {"page":1,"pages":53,"per_page":5,"total":265,"sourceid":"2","lastupdated":"2026-07-13"}
   AFE 2024 = 14,970,184   AFW 2024 = 11,327,779   ARB 2024 = 44,540,617
```
[verified byte-for-byte today]. Source 2 = WDI, `lastupdated 2026-07-13`. Companions: `SM.POP.TOTL.ZS`, `SM.POP.REFG`, `SM.POP.NETM`. **Not bilateral** — this is UN DESA IMS re-served.

## 4. KNOMAD bilateral remittance matrix — moved into Data360

`https://www.knomad.org/data/remittances` returns **HTTP 302** → `https://www.worldbank.org/en/topic/migration/brief/remittances-knomad` [verified — the previous draft's "301 → /en/brief/2024/09/18/remittances-knomad" was wrong on both the status code and the target, though that older path also resolves 200 via its own redirect]. The data live in **World Bank Data360**, API open, **no key**:

```
GET https://data360api.worldbank.org/data360/indicators?datasetId=WB_KNOMAD
→ ["WB_KNOMAD_BRE","WB_KNOMAD_MRI","WB_KNOMAD_MRO","WB_KNOMAD_MIG"]      [verified]

GET https://data360api.worldbank.org/data360/data?DATABASE_ID=WB_KNOMAD&INDICATOR=WB_KNOMAD_BRE&REF_AREA=USA
→ {"count":135, "value":[…]}                                             [verified]
```

| Indicator | Meaning |
|---|---|
| `WB_KNOMAD_BRE` | Bilateral Remittance Estimates (migrant-stock-weighted) |
| `WB_KNOMAD_MRI` | Migrant remittance inflows (US$ m) |
| `WB_KNOMAD_MRO` | Migrant remittance outflows (US$ m) |
| `WB_KNOMAD_MIG` | Migration stock series |

- **Record shape [verified — the previous draft's field list was incomplete]:** the response is `{count, value:[…]}`; each record is
  `{OBS_VALUE, TIME_FORMAT, UNIT_MULT, COMMENT_OBS, OBS_STATUS, OBS_CONF, AGG_METHOD, DECIMALS, COMMENT_TS, DATA_SOURCE, LATEST_DATA, DATABASE_ID, INDICATOR, REF_AREA, SEX, AGE, URBANISATION, COMP_BREAKDOWN_1, COMP_BREAKDOWN_2, COMP_BREAKDOWN_3, TIME_PERIOD, FREQ, UNIT_MEASURE, UNIT_TYPE}`.
  **`OBS_VALUE` is a JSON *string*, not a number** (`"52595.342546"`) — cast before arithmetic or your sums silently concatenate. `AGG_METHOD: "W_AVG"`, `OBS_CONF: "PU"`.
- **Direction semantics — now confirmed, not inferred [verified by a discriminating test]:** `REF_AREA` = **remitting/source** country; `COMP_BREAKDOWN_1` = **receiving** country, prefixed `WB_KNOMAD_<ISO3>`.
  - `REF_AREA=USA`, 2021: `WLD` = 200,216.09 US$m; `MEX` 52,595.34; `IND` 15,808.03; `GTM` 14,078.19; `PHL` 12,836.64; `CHN` 12,690.79; `DOM` 7,951.99; `VNM` 7,894.71; `SLV` 6,710.64 [verified].
  - **The discriminating test:** `REF_AREA=MEX` returns `WLD` = **3,274.9** US$m with top counterparts `USA` 1,844.7, `GTM` 417.8, `HND` 212.9. Mexico's remittance *inflows* in 2021 were ~$51bn; $3.3bn is its *outflow* total. Therefore `REF_AREA` is unambiguously the **sending** side. [verified]
- **A `WLD` aggregate row is mixed into the same result set** — filter `COMP_BREAKDOWN_1 == 'WB_KNOMAD_WLD'` or you double every total [verified].
- **Total BRE matrix: `count` = 10,619 rows, single reference year 2021** [verified]. Pagination via `&skip=N`; `&top=N` limits page size.
- **Metadata PDF:** `https://data360files.worldbank.org/data360-data/metadata/WB_KNOMAD/WB_KNOMAD_BRE.pdf` → **200, 51,386 bytes, `application/octet-stream`** [verified]. (Contents not parsed — no PDF text extractor available in this environment.)
- **Bias:** BRE is **not measured** — it is modelled by allocating BoP-recorded aggregate remittances across bilateral migrant stocks weighted by origin/destination per-capita income. It therefore *cannot* be independent evidence about migrant stocks; it is derived from them. Label it "model output", never "data".
- **License: [UNVERIFIED]** for `WB_KNOMAD_BRE` specifically. World Bank open-data terms are CC BY 4.0 for the WDI family and the catalog page for GBMD explicitly says CC BY 4.0, but no licence string was retrieved for the Data360 KNOMAD indicators. Check before redistributing.

## 5. OECD International Migration Database (IMD) — SDMX, no key, genuinely bilateral

Base: `https://sdmx.oecd.org/public/rest`. Agency `OECD.ELS.IMD`. **No auth** [verified].

**Dataflows [verified — enumerated live from `/dataflow/OECD.ELS.IMD/all/latest`, names quoted from the response]:**

| Dataflow | Name |
|---|---|
| `DSD_MIG@DF_MIG` | International migration database |
| `DSD_MIG@DF_MIG_EMP_EDU` | Labour market outcomes of immigrants - Employment rates by educational attainment |
| `DSD_MIG@DF_MIG_NUP_SEX` | Labour market outcomes of immigrants - Employment, unemployment, and participation rates by sex |
| `DSD_MIG_F@DF_MIG_POPF` | International migration database - stocks of foreign-born population |
| `DSD_MIG_INT@DF_MIG_INT` | Harmonised flows - internal database |
| `DSD_MIG_INT@DF_MIG_INT_PER` | Standardised inflows of permanent-type migrants |
| `DSD_MIG_INT@DF_MIG_INT_TEMP` | Standardised inflows of temporary migrants |

**Key order for `DSD_MIG@DF_MIG` — 8 components [verified from the returned CSV header]:**
`REF_AREA . CITIZENSHIP . FREQ . MEASURE . SEX . BIRTH_PLACE . EDUCATION_LEV . UNIT_MEASURE`

**Working bilateral example (returns 200) [verified verbatim today]:**
```
GET https://sdmx.oecd.org/public/rest/data/OECD.ELS.IMD,DSD_MIG@DF_MIG,1.0/DEU.SYR.A.._T...?startPeriod=2023&endPeriod=2023
Accept: application/vnd.sdmx.data+csv
```
→
```
DEU,SYR,A,B11,_T,_Z,_Z,PS,2023,128742   # Inflows of foreign population
DEU,SYR,A,B12,_T,_Z,_Z,PS,2023,18419    # Outflows of foreign population
DEU,SYR,A,B13,_T,_Z,_Z,PS,2023,102930   # Inflows of asylum seekers        <- WAS MISLABELLED
DEU,SYR,A,B15,_T,_Z,_Z,PS,2023,923805   # Stocks of foreign population
DEU,SYR,A,B16,_T,_Z,_Z,PS,2023,75485    # Acquisitions of nationality      <- WAS UNLABELLED
```
Full CSV columns: `DATAFLOW,REF_AREA,CITIZENSHIP,FREQ,MEASURE,SEX,BIRTH_PLACE,EDUCATION_LEV,UNIT_MEASURE,TIME_PERIOD,OBS_VALUE,OBS_STATUS,UNIT_MULT,DECIMALS`.
`CITIZENSHIP=W` gives world totals: `DEU.W.A.B11._T...` → 2022: 2,481,019; 2023: 1,741,153 [verified].

- **MEASURE codelist — the previous draft had the wrong codelist ID and two wrong labels.** The codelist is **`CL_MEASURE_MIG`**, not `CL_MIG_MEASURE` (which is why the old lookup 404'd). `GET https://sdmx.oecd.org/public/rest/codelist/OECD.ELS.IMD/CL_MEASURE_MIG/latest` → **200** [verified]. Official English labels, read from the DSD (`/datastructure/OECD.ELS.IMD/DSD_MIG/latest?references=children`) [all verified]:

  | Code | Official label |
  |---|---|
  | `B11` | Inflows of foreign population |
  | `B12` | Outflows of foreign population |
  | `B13` | **Inflows of asylum seekers** |
  | `B14` | Stocks of foreign-born population |
  | `B15` | Stocks of foreign population |
  | `B16` | **Acquisitions of nationality by country of former nationality** |
  | `B21` | Inflows of foreign workers |
  | `B22` | Inflows of seasonal foreign workers |

  Sanity check on the correction: DEU/SYR 2023 `B13` = 102,930 matches Germany's Syrian asylum-applicant volume that year, and `B16` = 75,485 matches Syrians as the largest naturalisation group in Germany in 2023 — both consistent with the corrected labels and inconsistent with the old ones.
- **Latest year [verified]:** reference period **2023** is fully populated across B11/B12/B13/B15/B16; **2024 exists only for `B13` (36 reporting countries) and `B15` (26 reporting countries)** — i.e. only asylum-seeker inflows and foreign-population stocks. Ingest must not assume rectangular year coverage.
- **Spatial [verified, corrected]:** **35 reporting destinations for B11 in 2023** and **37 distinct reporters across the 2024 B13+B15 data** — *not* all 38 OECD members. **~210 distinct `CITIZENSHIP` codes** in the B11/2023 slice (9,863 observations). **Only OECD destinations** — Gulf, most of Africa, most of Asia absent. This is the single largest coverage hole for a "whole world" product.
- **Cadence:** annual, typically published with the *International Migration Outlook* in Q4; ~18–24 month lag. [UNVERIFIED — publication timing not re-checked.]
- **Formats:** `Accept: application/vnd.sdmx.data+csv; version=1.0.0` for flat CSV; `?dimensionAtObservation=AllDimensions` for fully-keyed output.
- **License: [UNVERIFIED].** OECD Terms and Conditions. `https://www.oecd.org/en/about/terms-conditions.html` **returns HTTP 403 to automated fetchers** [verified], so the licence text could not be retrieved today. Do **not** assume CC BY. Note the asymmetry: `sdmx.oecd.org` is fully open and unauthenticated, while `www.oecd.org` blocks bots.

## 6. OECD DIOC — census-based immigrant characteristics, bulk XLSX only

- **Landing:** `https://www.oecd.org/en/data/datasets/database-on-immigrants-in-oecd-and-non-oecd-countries.html` — **returns HTTP 403 to automated fetchers** [verified]. Human browser only.
- **Bulk directory (HTTP 200, plain IIS directory listing, no bot block) [verified]:**
  `https://webfs.oecd.org/els-com/Migration/Databases/Database%20on%20Immigrants%20in%20OECD%20and%20non-OECD%20Countries%20DIOC/DIOC%20database%20-%20click%20here/`
  Contents [verified verbatim]:
  ```
  5/28/2024  4:54 PM  <dir>  Reference years 2000-2001
  5/28/2024  4:54 PM  <dir>  Reference years 2005-2006
  5/28/2024  4:54 PM  <dir>  Reference years 2010-2011
  5/28/2024  4:54 PM  <dir>  Reference years 2015-2016
  10/14/2024 4:17 PM  <dir>  Reference years 2020-2021
  ```
- **`Reference years 2020-2021/` contents [verified, with sizes — new]:**
  ```
  10/14/2024 1:23 PM   1,318,512  t1_TOP100.xlsx
  10/14/2024 1:23 PM   1,852,747  t3_TOP100.xlsx
  10/14/2024 1:23 PM   3,268,996  t4_TOP100.xlsx
  10/14/2024 1:23 PM   3,268,996  t5_TOP100.xlsx
  10/14/2024 1:23 PM  11,532,148  t6_TOP100.xlsx
  ```
  Total ~21.2 MB — comfortably vendorable. (Note `t4` and `t5` are byte-identical in size; verify checksums differ before assuming they are distinct tables.)
- **Latest round: 2020/21.** Prior rounds 2000/01, 2005/06, 2010/11, 2015/16. [verified from directory names]
- **Content:** ~34–38 destination countries × 200+ origins, cross-classified by age, sex, duration of stay, educational attainment, field of study, labour force status, occupation. [UNVERIFIED — the cross-classification list was not confirmed by opening the files today.] This is the *only* open dataset plausibly giving origin × destination × **skill level**, which is what a "how much workforce can it hold" calculator actually needs — so **open `t1`…`t6` and confirm the variable list before building on it.**
- **Format:** XLSX, no API, no SDMX. Scrape the `webfs.oecd.org` directory listing (it is plain HTML and unprotected).
- **Cadence:** quinquennial, ~3-year lag after the census round.
- **Bias:** built from national census microdata with heterogeneous education coding (ISCED mapping varies); the **"TOP100" filenames indicate truncation to the 100 largest origins**, hiding the long tail. [Filename convention verified; the semantic is [UNVERIFIED] until a file is opened.]

## 7. Eurostat `migr_*` — the richest, fastest, cleanest bilateral source on the planet (for Europe)

**REST base:** `https://ec.europa.eu/eurostat/api/dissemination/`. **No API key. No registration.** [verified]

**Four access shapes, all verified 200 today:**
```
# JSON-stat 2.0
GET .../statistics/1.0/data/migr_imm5prv?format=JSON&lang=EN&geo=DE&time=2023        → 200

# SDMX 2.1, key order = freq.partner.agedef.age.unit.sex.geo
GET .../sdmx/2.1/data/migr_imm5prv/A.SY.COMPLET.TOTAL.NR.T.DE?startPeriod=2023&endPeriod=2024
  → 2023: 88,973 ; 2024: 63,444   (Syrian immigration to Germany)   [verified exactly]

# DSD (dimension order discovery)
GET .../sdmx/2.1/datastructure/ESTAT/MIGR_IMM5PRV                                     → 200

# Codelists (for the GEO crosswalk)
GET .../sdmx/2.1/codelist/ESTAT/GEO                    → 200, 2,824,963 bytes  [verified]

# Full-table bulk, gzipped SDMX-CSV
GET .../sdmx/2.1/data/migr_imm5prv/?format=SDMX-CSV&compressed=true
  → Content-Length 38,137,114 ; Content-Type application/vnd.sdmx.data+csv;version=1.0.0
    Content-Disposition: attachment; filename="estat_migr_imm5prv_en.csv.gz"          [verified]
  header: DATAFLOW,LAST UPDATE,freq,partner,agedef,age,unit,sex,geo,TIME_PERIOD,OBS_VALUE,OBS_FLAG,CONF_STATUS

# Machine-readable catalogue (use this to auto-detect refreshes)
GET .../catalogue/toc/txt?lang=en      → 200, 1,976,422 bytes                         [verified]
```
The TOC is tab-separated **with quoted fields** (`csv.reader(..., delimiter='\t', quotechar='"')`, not a bare `split('\t')`). Header [verified verbatim]: `title, code, type, last update of data, last table structure change, data start, data end, values`. Titles are **leading-space-indented** to encode folder depth — strip before matching. **Poll it to drive incremental ingest.**

**[CORRECTED] Code count:** the TOC contains **240 `migr_*` lines**, but only **201 distinct codes** — **167 of type `dataset`** and **34 of type `folder`**; the rest are duplicate listings of the same code under multiple folders. The previous draft's "240 `migr_*` codes" is a line count, not a dataset count. Dedupe on `code` before scheduling.

**Annual bilateral tables — all values read from the live TOC today [every row verified exactly]:**

| Code | Title | Last update | Years | Rows |
|---|---|---|---|---|
| `migr_imm1ctz` | Immigration by age group, sex and citizenship | 29.05.2026 | 1998–2024 | 12,212,694 |
| `migr_imm5prv` | Immigration by age group, sex and country of previous residence | 02.07.2026 | 1998–2024 | 9,971,243 |
| `migr_imm3ctb` | Immigration by age group, sex and country of birth | 02.07.2026 | 2008–2024 | 10,077,044 |
| `migr_emi1ctz` | Emigration by age group, sex and citizenship | 01.07.2026 | 1998–2024 | 12,025,398 |
| `migr_emi3nxt` | Emigration by age group, sex and country of next usual residence | 02.07.2026 | 1998–2024 | 9,398,363 |
| `migr_emi4ctb` | Emigration by age group, sex and country of birth | 02.07.2026 | 2008–2024 | 9,155,661 |
| `migr_pop1ctz` | Population on 1 January by age group, sex and citizenship | 10.08.2026 | 1998–**2025** | 8,785,137 |
| `migr_pop3ctb` | Population on 1 January by age group, sex and country of birth | 10.08.2026 | 1998–**2025** | 7,071,362 |
| `migr_acq` | Acquisition of citizenship by age group, sex, former citizenship | 27.03.2026 | 1998–2024 | 13,155,955 |
| `migr_resfirst` | First permits by reason, length of validity and citizenship | 11.09.2026 | 2008–**2025** | 2,013,621 |
| `migr_resocc` | First permits issued for remunerated activities by reason/validity | 11.09.2026 | 2008–**2025** | 2,118,914 |
| `migr_resvalid` | All valid permits by reason, length of validity and citizenship | 11.09.2026 | 2008–**2025** | 1,656,392 |

**Sub-annual tables — the product's "live" layer [all verified exactly]:**

| Code | Title | Last update | Coverage | Rows |
|---|---|---|---|---|
| `migr_asyappctzm` | Asylum applicants by type, citizenship, age, sex — **monthly** | **17.09.2026** | 2008-01 → **2026-08** | 103,640,312 |
| `migr_asypenctzm` | Persons subject of asylum applications pending — monthly | 16.09.2026 | 2008-01 → 2026-08 | 44,911,194 |
| `migr_asyaccm` | Applicants having had their application processed under Dublin — monthly | 17.09.2026 | 2021-01 → 2026-08 | 13,690,760 |
| `migr_asytpsm` | Beneficiaries of temporary protection at end of month (Ukraine) | 14.09.2026 | 2022-03 → 2026-08 | 10,748,092 |
| `migr_asytpfm` | Decisions granting temporary protection — monthly | 14.09.2026 | 2022-03 → 2026-08 | 10,786,364 |
| `migr_asyumactm` | Unaccompanied minor asylum applicants — monthly | 17.09.2026 | 2021-01 → 2026-08 | 19,975,896 |
| `migr_asydcfstq` | First-instance decisions by type, citizenship — **quarterly** | 16.09.2026 | 2008-Q1 → 2026-Q2 | 91,495,560 |
| `migr_asywitfstq` | Decisions withdrawing status granted at first instance — quarterly | 16.09.2026 | 2008-Q1 → 2026-Q2 | 4,071,775 |
| `migr_asytpfq` | Decisions granting temporary protection — quarterly | 31.08.2026 | 2022-Q1 → 2026-Q2 | 3,669,918 |

**Latency measured today: reference month 2026-08, updated 2026-09-17 → ~4 weeks.** That is the product's real "live" ceiling. [verified]

- **Spatial:** 27 EU + EFTA + candidate destinations; `partner`/`citizen` dimension covers ~250 origins. [UNVERIFIED — origin count not re-counted today.]
- **GEO code conventions [verified against the live `ESTAT/GEO` codelist]:** `UK` **present**, `GB` **absent**; `EL` **present**, `GR` **absent**; `XK` (Kosovo) **present**. The crosswalk requirement is real and confirmed.
- **Rate limits [corrected]:** **no throttling was observed** — 12 rapid sequential requests all returned 200, and a completely unfiltered `migr_imm1ctz` JSON-stat query returned **200 with 177,778,540 bytes** rather than a size-limit rejection [verified]. **However, "there is no rate limit" is [UNVERIFIED] as a guarantee**: Eurostat's API-limits wiki (`wikis.ec.europa.eu/.../API+Statistics+-+data+query`) now **redirects to EU Login**, so the documented limits could not be read today. Implement backoff and a concurrency cap anyway; do not design an ingest that depends on unlimited throughput.
- **License [verified against `https://ec.europa.eu/eurostat/web/main/help/copyright-notice`]:** re-use is governed by **Commission Decision 2011/833/EU of 12 December 2011**, and Eurostat **explicitly names the "Creative Commons Attribution 4.0 International licence"**. Attribution requirement: *"acknowledge the source and indicate any changes you have made."*
  **⚠ Exception the previous draft missed, quoted verbatim:** *"Data for countries other than: Member States of the European Union (EU), Member States of the European Free Trade Association (EFTA), official EU acceding and candidate countries. Examples are data for the United States of America, Japan or China. In such cases, the user will need to eliminate these data from the tables before reusing them commercially."* Other non-free items: third-party photos/illustrations, Swiss/Liechtenstein and Austrian trade data, co-published works, logos and trademarks.
  **Practical reading for this product:** in the `migr_*` tables the **reporter** (`geo`) dimension is EU/EFTA/acceding+candidate only, so the tables are commercially reusable as published. The exception bites on *reporter* rows outside that set, not on the `partner`/`citizen` breakdown. Encode it as a filter on `geo`, not on `partner`, and keep a note in the licence module.
- **Bias:** national definitions of "immigration" vary despite Regulation (EC) 862/2007; the 12-month duration criterion is applied inconsistently. Origin↔destination mirror statistics disagree substantially for some pairs — this is exactly what IMEM/QuantMig was built to fix. [The "up to 2×, e.g. PL↔UK" magnitude is [UNVERIFIED] — compute it from the data rather than quoting it.]

## 8. Abel & Cohen bilateral flow estimates — five-year global bilateral flows

- **figshare article 14579241, "Bilateral international migration flow estimates by sex and type of move"** [verified via `https://api.figshare.com/v2/articles/14579241`]
- **Version 6, published 2025-03-26T06:08:45Z, licence CC BY 4.0** (`https://creativecommons.org/licenses/by/4.0/`), **DOI `10.6084/m9.figshare.14579241.v6`** [all verified from the figshare API]
- **Direct download:** `https://ndownloader.figshare.com/files/53236079` → `bilat_mig_sex_type.csv`, **65,341,478 bytes** [verified — downloaded in full today]
- **Verified CSV header and contents [I downloaded and scanned the whole file]:**
  `year0,sex,orig,dest,type,da_min_open,da_min_closed,da_pb_closed`
  - **Rows: 1,882,416** [new, verified]
  - `year0 ∈ {1990, 1995, 2000, 2005, 2010, 2015}` — six 5-year intervals, last = **2015–2020** [verified]
  - **`sex ∈ {female, male}` ONLY — there is no `total`/`both` category** [verified]. The previous draft's "(and total, UNVERIFIED)" is **killed**: you must sum `male + female` yourself.
  - `orig`, `dest`: **232 distinct ISO3 codes each** [verified] — **not 200**. Correct the country count.
  - `type ∈ {outward, return, transit}` [verified] — naive summation of all three triple-counts.
  - `da_min_open`, `da_min_closed`, `da_pb_closed` = three estimator variants (demographic accounting; minimisation vs pseudo-Bayesian; open vs closed demography). Expose the spread across the three as the uncertainty band. [The claim that "the closed demographic accounting estimators perform best" is [UNVERIFIED] — it is a reading of the papers, not something I confirmed; verify before hardcoding `da_pb_closed` as the default.]
- **Latest interval: 2015–2020.** [UNVERIFIED] that v6 is "rebased on IMS2024" and that 2020–2024 was "deliberately not generated to avoid mixing 4- and 5-year intervals" — plausible and consistent with the observed `year0` values, but not confirmed from the figshare description today. What *is* confirmed: **there is no post-2020 interval in the file.** Do not fabricate one.
- **Papers:** Abel & Cohen, *Scientific Data* 6:82 (2019), `https://www.nature.com/articles/s41597-019-0089-3`; Abel & Cohen, *Scientific Data* 9:173 (2022), `https://www.nature.com/articles/s41597-022-01271-z`. [URLs not re-fetched — nature.com auth-gates automated fetchers.]
- **Fundamental caveat:** these are **not observed flows**. They are the minimum set of moves consistent with two consecutive stock tables plus births/deaths. They systematically understate churn (circular and repeat migration cancel out) and are entirely dependent on IMS quality.

## 8b. **Gaskin & Abel (2026) — annual global bilateral flows. NEW, and the biggest single upgrade to this pack.**

The previous draft listed this as "arXiv 2506.22821, UNVERIFIED, do not wire it in." It is now a **published, peer-reviewed, CC BY 4.0 Nature paper with a full open data release**, and it closes the pack's largest stated gap.

- **Citation [verified via Crossref]:** Thomas Gaskin & Guy J. Abel, *"Deep learning four decades of human migration"*, **Nature 655, 148–157 (2026)**, published **2026-06-10**, DOI **`10.1038/s41586-026-10611-7`**, licence **CC BY 4.0** (Crossref `license` field).
- **Preprint:** arXiv **2506.22821v2**, 2025-06-28 [verified via the arXiv API].
- **Data availability statement [verified verbatim from the arXiv HTML]:** *"The complete flow datasets are available at doi.org/10.5281/zenodo.15623215. A trained neural network, all training covariates, the code used to train the network, as well as a Jupyter notebook to evaluate the models and reproduce the plots in this publication, are available at github.com/ThGaskin/Migration_flows."*
- **Zenodo record [verified — resolved and inspected today]:** concept DOI `10.5281/zenodo.15623215` → current version DOI **`10.5281/zenodo.18508919`**, *"Deep learning four decades of human migration: datasets"*, published **2026-05-22**, licence **`cc-by-4.0`**.
- **Coordinates [verified verbatim from the record description]:** `Year: 1990–2023`; `Birth ISO`, `Origin ISO`, `Destination ISO`, `Country ISO` — all **UN ISO3**. Data in **NetCDF (.nc) and CSV**; NetCDF opens as an `xarray.Dataset`.
- **Files and sizes [verified]:**

  | File | Bytes | Contents |
  |---|---|---|
  | `flows.nc` | 14,516,188 | **Total origin×destination flows. Dimensions: Year, Origin ISO, Destination ISO.** ~14.5 MB — fully vendorable. |
  | `stocks.nc` | 14,943,080 | Bilateral stocks |
  | `net_migration.nc` | 64,012 | Net migration by Country ISO |
  | `mig_bilateral.csv` | 144,346,575 | CSV form of the bilateral series |
  | `mig_unilateral.csv` | 897,693 | CSV form of the country-level series |
  | `T.nc` | 3,352,816,336 | Full table disaggregated by **country of birth**: Year × Birth ISO × Origin ISO × Destination ISO. **3.35 GB — do not vendor; fetch and subset server-side.** |
- **Coverage:** 230 countries and regions, **annual**, 1990–2023, with **confidence bounds from a neural-network ensemble plus covariate uncertainty propagation** — i.e. it ships native uncertainty for the whole world, which is what the previous draft said only QuantMig had, and only for Europe.
- **Method and caveat:** an RNN trained on 18 geographic/economic/cultural/societal/political covariates. The abstract claims it *"significantly outperforms traditional methods estimating five-year flows while delivering a significant increase in temporal resolution"* — i.e. it claims to beat Abel & Cohen's approach on held-out data. **It is still `estimate_kind = 'modelled'`, and it is a *learned* model, which means its errors are correlated with covariate availability**, not just with stock-table quality. Render it with the same visual de-emphasis as every other model output, and expose its confidence bounds rather than its point estimates.
- **Product consequence:** this gives the MVP a **whole-world, annual, uncertainty-aware bilateral flow layer** in a 14.5 MB file. It should be a first-class ingest target alongside Eurostat, not a footnote.

## 9. IMEM → QuantMig

- **IMEM:** `https://www.imem.cpc.ac.uk/` → **200** [verified]. Bayesian harmonised flows, 31 EU/EFTA countries + rest-of-world, by origin, destination, age, sex, **2002–2008**. Web query tool; **[UNVERIFIED]** whether a bulk file is offered.
- **Successor — QuantMig Migration Estimates Explorer:** `https://www.quantmig.eu/data_and_estimates/estimates_explorer/` → **200** [verified]. Covers **the EU, the UK, EFTA and North Macedonia** (~32–34 entities) plus migration to and from the rest of the world, probabilistic with credible intervals, disaggregated by sex, 5-year age groups (0-4 … 85+) and region of birth.
  - **[CORRECTED]** Year split: **QuantMig's own estimates are 2009–2019**; the **2002–2008** span comes from the predecessor **IMEM** project. The previous draft's flat "2002–2019" hides that seam — and the two halves come from different models.
  - **[UNVERIFIED]** The previous draft's specific list of "8 world macro-regions" (Other Europe, North Africa, Sub-Saharan Africa, Middle East, South & South-East Asia, East Asia, Latin America, Northern America & Australia-Oceania) was **not confirmed**; the explorer page describes region-of-birth breakdowns more coarsely. Do not hardcode that list.
- **Bulk data — FOUND [verified, this was previously unresolved]:**
  - **Zenodo record `8224827`**, *"MCMC simulations from the posterior distributions of European migration flows"*, DOI **`10.5281/zenodo.8224827`**, published **2023-08-08**, licence **CC BY 4.0**.
  - **The file is `QuantMig D6.4 European Migration Flows - Zenodo deposit.zip`, 5,925,474,965 bytes (≈5.93 GB)** — a zip of **RData** files, not CSV. **This cannot be vendored into a repo.** It requires R (or `pyreadr`) and an out-of-band preprocessing step that reduces the MCMC draws to summaries.
  - Content [verified from the record description]: three RData files of MCMC draws from the Bayesian hierarchical model — **ODT** (origin × destination × time), **ODAST** (+ age and sex), **ODBT** (+ birth region) — plus an R script that computes posterior means and quartiles.
  - Download: `https://zenodo.org/api/records/8224827/files/QuantMig%20D6.4%20European%20Migration%20Flows%20-%20Zenodo%20deposit.zip/content`
  - **Cross-confirmation:** Gaskin & Abel (§8b) cite this same Zenodo DOI.
- **[CORRECTED] Zenodo API call.** The previous draft's `https://zenodo.org/api/records?communities=quantmig&size=50` returns **HTTP 400** (that community-filter parameter form is no longer supported, and `size` is capped). The working call is:
  ```
  GET https://zenodo.org/api/communities/quantmig/records?size=25     → 200, total 15   [verified]
  ```
  Unauthenticated `size` is capped at **25** ("Page size cannot be greater than 25. Please use authenticated requests to increase the limit to 100."). The community holds **15 records** [verified], of which the relevant ones are `8224827` (the estimates), `8215060` (R script to download and pre-process Eurostat migration data), `7728049` (microsimulation projection model), `7954150` and `7709443` (scenario data descriptions). Record **`8169110` is the DEMIG-QuantMig Migration Policy Database** — a different dataset, as the author suspected.
- **Project ended (H2020 GA 870299) — no further updates expected.** [UNVERIFIED grant number.] Frozen at 2019.

## 10. IOM GMDAC / Global Migration Data Portal — aggregator, not a source

- `https://www.migrationdataportal.org/` → **HTTP 403 to automated fetchers** [verified].
- It hosts no primary data and exposes no API. It re-serves UN DESA, UNSD, Eurostat, OECD and WDI behind visualisations, plus its own editorial layer. [UNVERIFIED in detail — the 403 prevented inspection; the "no API" claim rests on the absence of a documented one.]
- **Use it as human documentation, never as an ingest target.**

## 11. IOM Displacement Tracking Matrix (DTM) — key required, **and licence-restricted**

- **Portal:** `https://dtm.iom.int/data-and-analysis/dtm-api` → **200** [verified] · key signup `https://dtm-apim-portal.iom.int/signin`
- **API v3 requires a subscription key.** Official clients: `dtmapi` (PyPI) and `dtmapi-R` (`https://displacement-tracking-matrix.github.io/dtmapi-R/`), with `get_idp_admin_0_data()`, `get_idp_admin_1_data()`, `get_idp_admin_2_data()`, `get_all_countries()`, `get_all_operations()`. [UNVERIFIED — package and function names not confirmed today.]
- **Legacy keyless host is gone [verified]:** `https://dtmapi.iom.int/api/Common/GetAllCountryList` → **HTTP 404 `{"statusCode":404,"message":"Resource not found"}`**. Do not hardcode `dtmapi.iom.int` paths.
- **HDX mirror exists and is fresh [verified]:** `https://data.humdata.org/api/3/action/package_show?id=global-iom-dtm-from-api` → 200. Dataset *"Global IOM Displacement Tracking Matrix (DTM) from API"*, **last modified 2026-09-14**, one CSV resource of **37,955,216 bytes** covering admin levels 0–2. HDX-stated caveat [verified verbatim]: *"This dataset comes from the DTM API, which provides only non-sensitive IDP figures, aggregated at the country, Admin 1, and Admin 2 levels."*
- **🚨 LEGAL RISK — this is the single most dangerous error in the previous draft.** The HDX licence is `license_id: "hdx-other"`, `license_title: "Other"` — **not open**. The licence text states verbatim: *"Copyright © International Organization for Migration 2018 IOM reserves the right to assert ownership of the Materials collected on the https://data.humdata.org/ website. The Materials may be viewed, downloaded, and printed for **non-commercial use only**, without, inter alia, any right to **sell, resell, redistribute or create derivative works therefrom**. At all times the User shall credit the DTM as the [source]."*
  **Consequences:** you may not redistribute DTM data, you may not build derivative products from it, and you may not use it commercially. An open-source intelligence dashboard that ingests and re-serves DTM figures — even aggregated — is a derivative work and a redistribution. **Either drop DTM entirely from the MVP, or link out to it rather than ingesting it, or obtain written permission from IOM.** The previous draft's recommendation to "pull the same content from HDX for a keyless MVP" is withdrawn.
- Content: non-sensitive IDP figures, aggregated to admin0/1/2. **Internal displacement, not international bilateral migration** — it does not serve the product's core question regardless.

## 12. UNHCR Refugee Data Finder API — the best keyless near-live bilateral feed, with two traps

**Base `https://api.unhcr.org/population/v1/`. No key. No registration. Verified working today.**
(Note: the API host is open, but `https://www.unhcr.org/refugee-statistics/` **returns 403 to automated fetchers** [verified] — documentation is human-browser only.)

Endpoints: `population`, `asylum-applications`, `asylum-decisions`, `solutions`, `demographics`, `unrwa`, `idmc`, `years`, `countries`.

### 🚨 Trap 1 — `coo`/`coa` are **UNHCR codes, not ISO3** [verified, and materially worse than the previous draft said]

The previous draft called these fields "unreliable" and cited `coa_name=Egypt, coa=ARE, coa_iso=EGY` as a bug. **It is not a bug — it is a distinct, legacy code system**, and treating it as broken ISO3 will silently produce empty result sets.

```
GET .../asylum-applications/?year=2025&coa=DEU&limit=2   → {"total":{"applied":0}, "items":[]}   ← SILENT ZERO
GET .../asylum-applications/?year=2025&coa=GFR&limit=2   → {"total":{"applied":338233}, …}       ← Germany
GET .../asylum-applications/?year=2025&coa=GFR&coo=SYR   → {"total":{"applied":41266}, …}        ← Syria→Germany
```
[all verified today]

**The crosswalk is served by the API itself:**
```
GET https://api.unhcr.org/population/v1/countries/?limit=300   → 232 rows, maxPages 1   [verified]
{"id":72,  "code":"GFR", "iso":"DEU", "iso2":"DE", "name":"Germany",              "majorArea":"Europe","region":"Western Europe"}
{"id":8,   "code":"ARE", "iso":"EGY", "iso2":"EG", "name":"Egypt",                "majorArea":"Africa","region":"Northern Africa"}
{"id":198, "code":"UAE", "iso":"ARE", "iso2":"AE", "name":"United Arab Emirates", "majorArea":"Asia","region":"Western Asia"}
{"id":185, "code":"SYR", "iso":"SYR", "iso2":"SY", "name":"Syrian Arab Rep.",     "majorArea":"Asia","region":"Western Asia"}
```
Note the collision that makes this actively dangerous: **`ARE` is UNHCR's code for Egypt and ISO3's code for the United Arab Emirates.** A naive ISO3 filter on `coa=ARE` returns Egyptian data. **Fetch `/countries/` once, build `iso → code`, translate before every filter, and join on `coo_iso`/`coa_iso`.**

### 🚨 Trap 2 — `coo_all`/`coa_all` **override** the `coo`/`coa` filters [verified]

```
GET .../asylum-applications/?year=2025&coa_all=true&coo_all=true&coa=DEU&coo=SYR
→ {"total":{"applied":3343203}, "maxPages":3005, items:[{coo_iso:"AFG", coa_iso:"ALB", …}, …]}
```
The `coa`/`coo` filters are **silently ignored** — you get the entire global matrix (~6,010 rows for 2025) with a total of 3,343,203, not the Syria→Germany pair. The previous draft's headline example `population/?year=2024&coo_all=true&coa_all=true&coo=SYR&coa=DEU` **does not return SYR→DEU.**

**The correct rule, replacing the previous draft's:**
- For the **full bilateral matrix**: pass `coo_all=true&coa_all=true` and **no** `coo`/`coa`.
- For a **specific corridor**: pass `coo=<UNHCR code>&coa=<UNHCR code>` and **omit** `coo_all`/`coa_all`.
- Passing **neither** filters nor `_all` flags collapses to a single aggregate row with `coo="-"`, `coa="-"` [verified — this part of the previous draft was right].

### Verified totals and mechanics
- Pagination: `&limit=` and `&page=`; `maxPages` in the envelope scales with `limit`, so do not cache it across different `limit` values.
- Envelope also carries a `short-url` field (e.g. `"NPv651"`).
- **Global 2024 aggregate row [verified exactly]:** refugees 30,958,200; asylum seekers 8,352,712; returned refugees 1,615,821; IDPs 68,131,711; returned IDPs 8,219,597; stateless 4,360,087; `ooc` 3,820,662; `oip` 5,875,359; `hst` 27,279,257.
- `GET .../years/` → 1951 … present, 26 pages at default limit [verified].
- **Cadence:** `asylum-applications` for **2025 is already complete** as of today [verified].
- **License: [UNVERIFIED].** No licence string could be retrieved — `unhcr.org` 403s automated fetchers and the API returns no licence metadata. UNHCR Refugee Data Finder is *presented* as open data with attribution required, but **do not assert a licence** until someone opens the download page in a browser and reads it.

---

## 13. Ingest-architecture consequences

**Canonical fact table** — every source normalises to one shape:
```
migration_fact(
  origin_iso3, dest_iso3, year, period_type ENUM('annual','5yr','monthly','quarterly'),
  sex ENUM('m','f','t'), age_band, measure_code, value NUMERIC,
  source_id, vintage_date, latency_days,
  estimate_kind ENUM('observed','modelled','extrapolated'),
  ci_low NUMERIC NULL, ci_high NUMERIC NULL,
  license_id TEXT NOT NULL,          -- added: see §13b
  commercial_ok BOOLEAN NOT NULL,    -- added
  redistributable BOOLEAN NOT NULL   -- added
)
```
`estimate_kind` is non-negotiable: UN DESA extrapolated countries, KNOMAD BRE, Abel & Cohen, Gaskin & Abel and QuantMig are all **modelled**, and rendering them in the same visual register as Eurostat register counts would be the product's core integrity failure.

### 13b. Licence columns are also non-negotiable
The DTM finding (§11) shows why. Sources in this pack fall into **three** legal buckets, not one:

| Source | Licence | Commercial? | Redistribute? | Status |
|---|---|---|---|---|
| UN DESA IMS 2024 | **CC BY 3.0 IGO** | yes | yes | [verified from workbook] |
| WB GBMD | **CC BY 4.0** | yes | yes | [verified on catalog page] |
| Abel & Cohen v6 | **CC BY 4.0** | yes | yes | [verified via figshare API] |
| Gaskin & Abel datasets | **CC BY 4.0** | yes | yes | [verified via Zenodo + Crossref] |
| QuantMig Zenodo 8224827 | **CC BY 4.0** | yes | yes | [verified via Zenodo API] |
| Eurostat | **CC BY 4.0** via Decision 2011/833/EU, *minus a non-EU/EFTA reporter carve-out* | yes, with filter | yes, with filter | [verified on copyright notice] |
| WB WDI / Data360 KNOMAD | assumed CC BY 4.0 | ? | ? | **[UNVERIFIED]** |
| OECD IMD + DIOC | OECD T&C | ? | ? | **[UNVERIFIED — oecd.org 403s bots]** |
| UNHCR RDF | unknown | ? | ? | **[UNVERIFIED — unhcr.org 403s bots]** |
| **IOM DTM (incl. HDX mirror)** | **IOM proprietary** | **NO** | **NO — no derivative works** | **[verified — blocks ingestion]** |

Do not ship a public build that ingests any row whose `license_id` is unresolved.

**Country-code reconciliation is a first-class module**, and it is worse than the previous draft stated. You are joining:
- **UN M49 numeric** — UN DESA IMS (`Location code` column) [verified]
- **ISO3** — World Bank, Abel & Cohen, Gaskin & Abel, and UNHCR's `coo_iso`/`coa_iso`
- **Eurostat GEO** — `UK` not `GB`, `EL` not `GR`, `XK` for Kosovo [verified against the live codelist]
- **OECD SDMX `REF_AREA`/`CITIZENSHIP`** — ISO3-like, with `W` for world
- **KNOMAD** — `WB_KNOMAD_<ISO3>` prefixes, plus a `WB_KNOMAD_WLD` aggregate mixed into results
- **UNHCR internal codes** — `GFR`=Germany, `ARE`=Egypt, `UAE`=UAE; **`ARE` collides with ISO3's UAE** [verified]

Kosovo, Taiwan, Palestine, Western Sahara, Curaçao/Netherlands Antilles, Sudan/South Sudan (2011), Serbia and Montenegro (2006), USSR/Yugoslavia successor states all need explicit crosswalk rows with validity date ranges. Build this against a versioned table, not a dict literal. Seed it from the machine-readable sources that exist: Eurostat `codelist/ESTAT/GEO` and UNHCR `/countries/`.

**Mirror-statistics reconciliation is the honest headline feature.** For any EU pair you can compute both `migr_imm5prv[geo=B, partner=A]` and `migr_emi3nxt[geo=A, partner=B]` and show the divergence. That divergence *is* the data-quality story, and it is what QuantMig/IMEM exist to model. A globe that shows one number per arc is lying; a globe that shows the arc plus its reported-by-sender / reported-by-receiver spread is a genuine intelligence product.

**Refresh scheduler, by real cadence:**
| Source | Poll |
|---|---|
| Eurostat TOC (`catalogue/toc/txt`) | daily — it carries `last update of data` for every `migr_*` code |
| UNHCR `asylum-applications` | daily |
| Eurostat monthly asylum tables | weekly |
| OECD SDMX `DSD_MIG@DF_MIG` | monthly |
| WB Data360 / WDI | monthly |
| WB DDH catalog API | **rarely, with backoff — it 429s readily** |
| UN DESA IMS, GBMD, DIOC, Abel figshare, Gaskin Zenodo, QuantMig Zenodo | quarterly HEAD/etag check; effectively vendored |

## 14. Coverage honesty map (what "whole world" actually means)

Revised in light of §8b — the global flow picture is better than the previous draft claimed, but it is still one model.

| Region | Bilateral stock | Bilateral flow | Sub-annual signal |
|---|---|---|---|
| EU/EFTA | Eurostat + DESA + OECD | **Eurostat annual, register-grade**; QuantMig 2009–19 w/ credible intervals | **Monthly asylum (~4wk)** |
| Other OECD (US, CA, AU, NZ, JP, KR, MX, CL, TR, IL) | DESA + OECD IMD + DIOC | OECD IMD annual (35–37 reporters) | UNHCR only |
| Gulf (GCC) | **DESA only, extrapolated** | **Model only** — Gaskin & Abel (annual, w/ CI) + Abel & Cohen (5-yr) | none |
| Sub-Saharan Africa | DESA + GBMD (to 2000) | **Model only** — Gaskin & Abel + Abel & Cohen | UNHCR (DTM exists but is licence-blocked) |
| South/SE Asia | DESA | **Model only** — Gaskin & Abel + Abel & Cohen | UNHCR (DTM licence-blocked) |
| Latin America | DESA + partial OECD | Gaskin & Abel + Abel & Cohen; some national | UNHCR (R4V for VEN) |
| China, Russia, Iran | DESA, thin | model only | none |

**[UNVERIFIED — this was the author's own qualitative synthesis, not a computed statistic]** The previous draft's "roughly 80% of the world's land area has exactly one bilateral flow source" is not a measured figure and should not be published as one. **Compute it instead.** The honest, defensible statement is:

> Outside the EU/EFTA and the OECD reporters, every bilateral flow number on this map is model output. For most of the world there are now **two** independent model families — Abel & Cohen's demographic-accounting estimates (5-yearly, to 2015–2020) and Gaskin & Abel's neural estimates (annual, 1990–2023, with confidence bounds) — and **their disagreement is the best available proxy for how little we know.** Render that disagreement.

That is a stronger product feature than the original claim and it is computable from two vendored files. The MVP's globe must still encode provenance — arc opacity or hatch driven by `estimate_kind`, plus a per-country data-density score — or it will present Gulf labour corridors with the same visual authority as German register data.

---

## 15. Sources (all status codes observed 2026-09-18)

**Open to automated clients (200):**
- `https://www.un.org/development/desa/pd/content/international-migrant-stock` — *with browser UA*
- `https://www.un.org/development/desa/pd/data/international-migration-flows` — *with browser UA*
- `https://population.un.org/dataportalapi/api/v1/indicators/` (metadata 200; `/data/…` 401)
- `https://datacatalog.worldbank.org/search/dataset/0039577/global-bilateral-migration-database`
- `https://api.worldbank.org/v2/country/all/indicator/SM.POP.TOTL`
- `https://data360api.worldbank.org/data360/indicators?datasetId=WB_KNOMAD`
- `https://data360files.worldbank.org/data360-data/metadata/WB_KNOMAD/WB_KNOMAD_BRE.pdf`
- `https://sdmx.oecd.org/public/rest/dataflow/OECD.ELS.IMD/all/latest`
- `https://sdmx.oecd.org/public/rest/datastructure/OECD.ELS.IMD/DSD_MIG/latest?references=children`
- `https://sdmx.oecd.org/public/rest/codelist/OECD.ELS.IMD/CL_MEASURE_MIG/latest`
- `https://webfs.oecd.org/els-com/Migration/Databases/…/DIOC%20database%20-%20click%20here/`
- `https://ec.europa.eu/eurostat/api/dissemination/catalogue/toc/txt?lang=en`
- `https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/codelist/ESTAT/GEO`
- `https://ec.europa.eu/eurostat/web/main/help/copyright-notice`
- `https://api.figshare.com/v2/articles/14579241` · `https://ndownloader.figshare.com/files/53236079`
- `https://zenodo.org/api/communities/quantmig/records?size=25`
- `https://zenodo.org/api/records/8224827` (QuantMig estimates)
- `https://zenodo.org/api/records/15623215` (Gaskin & Abel datasets)
- `https://github.com/ThGaskin/Migration_flows`
- `https://api.crossref.org/works/10.1038/s41586-026-10611-7`
- `https://export.arxiv.org/api/query?id_list=2506.22821` · `https://arxiv.org/html/2506.22821v2`
- `https://api.unhcr.org/population/v1/` (incl. `/countries/`, `/years/`, `/population/`, `/asylum-applications/`)
- `https://data.humdata.org/api/3/action/package_show?id=global-iom-dtm-from-api`
- `https://www.imem.cpc.ac.uk/` · `https://www.quantmig.eu/data_and_estimates/estimates_explorer/`
- `https://dtm.iom.int/data-and-analysis/dtm-api`

**Blocks automated clients (403) — human browser only:**
- `https://www.oecd.org/en/about/terms-conditions.html`
- `https://www.oecd.org/en/data/datasets/database-on-immigrants-in-oecd-and-non-oecd-countries.html`
- `https://www.unhcr.org/refugee-statistics/` and `/download/`
- `https://www.migrationdataportal.org/`
- `https://www.nature.com/articles/s41586-*` (redirects to `idp.nature.com`)
- `https://www.un.org/development/desa/pd/*` **with a default curl UA** (200 with a browser UA)

**Rate-limited / gated:**
- `https://datacatalogapi.worldbank.org/ddhxext/*` — HTTP 429 on repeated calls
- `https://wikis.ec.europa.eu/…/EUROSTATHELP/*` — now requires EU Login
- `https://population.un.org/dataportalapi/api/v1/data/*` — HTTP 401, token required

**Dead:**
- `https://dtmapi.iom.int/api/*` — HTTP 404 on every path
- `https://www.un.org/development/desa/pd/content/international-migration-flows` — HTTP 404
- `https://datacatalogfiles.worldbank.org/ddh-published/0039577/DR0045623/GlobalBilateralMigrationDatabase_csv.zip` — 404
- `https://zenodo.org/api/records?communities=quantmig&size=50` — HTTP 400 (wrong API form)

---

# MVP IMPLICATIONS (revised)

1. **Never use the word 'real-time' for stocks or flows.** [verified] Every layer carries `vintage_date` and `latency_days` badges. The only sub-annual bilateral series that exist are Eurostat `migr_asyappctzm` / `migr_asypenctzm` / `migr_asytpsm` / `migr_asytpfm` / `migr_asyaccm` / `migr_asyumactm` (monthly, EU+EFTA destinations only, ~4-week lag, currently through 2026-08) and the UNHCR `asylum-applications` endpoint. Brand these "Live signal" and everything else "Reference".

2. **The ingest worker MUST send `User-Agent: Mozilla/5.0 (X11; Linux x86_64)` when fetching `un.org`.** [verified today, both directions] Default curl/fetch UA gets HTTP 403 on every UN DESA XLSX; the browser UA gets 200 with `accept-ranges: bytes`. Apply the same treatment defensively to `oecd.org`, `unhcr.org` and `nature.com` — though those 403 regardless, so route around them: use `sdmx.oecd.org`, `webfs.oecd.org`, `api.unhcr.org` and `arxiv.org` instead.

3. **Model Eurostat as the primary programmable backbone:** no API key, four formats (JSON-stat 2.0, SDMX 2.1, gzipped SDMX-CSV bulk, codelists), and a machine-readable TOC at `https://ec.europa.eu/eurostat/api/dissemination/catalogue/toc/txt?lang=en` (1,976,422 bytes) carrying `last update of data` for every `migr_*` code. Parse the TOC as **quoted TSV** and **dedupe on `code`** — it has 240 `migr_*` *lines* but only **201 distinct codes** (167 datasets, 34 folders). Poll daily to drive incremental refresh; do not re-download 800 MB tables blindly. **Implement backoff anyway**: no throttling was observed (12 rapid requests, plus a 178 MB unfiltered query, all 200), but Eurostat's documented limits are now behind EU Login and cannot be confirmed.

4. **Add `estimate_kind ENUM('observed','modelled','extrapolated')` to the fact table and bind it to a visual channel** (arc opacity, hatch, desaturation) on the WebGL globe. **UN DESA fully reassessed only 60 of 233 countries in the 2024 edition; the other 173 are extrapolations of the 2020 estimates** — this is stated directly on the DESA landing page [verified], not inferred. KNOMAD BRE, Abel & Cohen, Gaskin & Abel and QuantMig are all model output. Rendering these identically to Eurostat register counts is the product's single largest **integrity** risk.

5. **Add `license_id`, `commercial_ok` and `redistributable` columns too — this is the largest *legal* risk.** [verified] Confirmed permissive: UN DESA IMS is **CC BY 3.0 IGO** (stated in the workbook, cite as "United Nations Department of Economic and Social Affairs, Population Division (**2024**)"); WB GBMD, Abel & Cohen v6, Gaskin & Abel and QuantMig are all **CC BY 4.0**; Eurostat is **CC BY 4.0** under Decision 2011/833/EU. Still unresolved: OECD IMD/DIOC, UNHCR RDF, Data360 KNOMAD. **Confirmed blocking: IOM DTM.**

6. **Do not ingest IOM DTM, including via HDX.** [verified] The HDX licence is `hdx-other` and reads: *"may be viewed, downloaded, and printed for non-commercial use only, without … any right to sell, resell, redistribute or create derivative works therefrom."* An open-source dashboard that re-serves DTM figures is both a redistribution and a derivative work. Link out to `dtm.iom.int` instead, or seek written IOM permission. This reverses the previous recommendation to use HDX as the keyless fallback.

7. **Apply the Eurostat non-EU carve-out as a `geo` filter, not a `partner` filter.** [verified verbatim] Commercial re-use excludes *"Data for countries other than: Member States of the European Union (EU), Member States of the European Free Trade Association (EFTA), official EU acceding and candidate countries… the user will need to eliminate these data from the tables before reusing them commercially."* In `migr_*` the reporter (`geo`) dimension is already EU/EFTA/candidate-only, so the tables are clean as published — but encode the rule so it survives a future table addition.

8. **Build the country-code crosswalk as a versioned table with validity date ranges, not a dict literal.** [verified] You are joining UN M49 numeric (DESA's `Location code`), ISO3, Eurostat GEO (`UK` not `GB`, `EL` not `GR`, `XK` — all confirmed against the live `ESTAT/GEO` codelist), OECD SDMX `REF_AREA`, KNOMAD's `WB_KNOMAD_<ISO3>` prefix, and **UNHCR's own legacy codes**, across USSR/Yugoslavia/Sudan/Serbia-Montenegro/Netherlands-Antilles dissolutions. **Add a collision test to CI: UNHCR `ARE` = Egypt while ISO3 `ARE` = United Arab Emirates.** Seed the table from `codelist/ESTAT/GEO` and `api.unhcr.org/population/v1/countries/` (232 rows, single page) rather than hand-typing it.

9. **Rewrite the UNHCR client — the previous guidance was wrong in both halves.** [verified]
   - `coo`/`coa` take **UNHCR codes, not ISO3**. `coa=DEU` returns `{"total":{"applied":0}}` **silently**; `coa=GFR` returns 338,233 for 2025. Fetch `/countries/` once, build `iso → code`, translate before every filter.
   - `coo_all=true&coa_all=true` **overrides** `coo`/`coa`, returning the whole global matrix. Use `_all` flags **only** for the full matrix; use `coo`/`coa` **alone** for a corridor. Passing neither collapses to one aggregate row with `coo="-"`.
   - Always **join** on `coo_iso`/`coa_iso` (true ISO3), never on `coo`/`coa`.
   - Add an integration test asserting `coa=GFR&coo=SYR` for 2025 returns a non-zero total — it is the single check that catches both traps.

10. **In the Data360 KNOMAD client, filter out `COMP_BREAKDOWN_1 == 'WB_KNOMAD_WLD'` before aggregating** — the world-total row is mixed into the same result set and doubles every country total [verified]. **Cast `OBS_VALUE` from string to float** — it is delivered as a JSON string [verified]. Paginate with `&skip=N`; the full 2021 bilateral matrix is **10,619 rows** [verified]. `REF_AREA` is the **remitting** country and `COMP_BREAKDOWN_1` the **receiving** country [verified by the MEX outflow test, not just inferred]. Label the layer "model output" — BRE is aggregate BoP remittances allocated across migrant stocks, so it is *derived from* stock data and cannot corroborate it.

11. **OECD SDMX keys for `DSD_MIG@DF_MIG` have exactly 8 components in the order `REF_AREA.CITIZENSHIP.FREQ.MEASURE.SEX.BIRTH_PLACE.EDUCATION_LEV.UNIT_MEASURE`** [verified]. A wrong component count returns HTTP 404 `NoResultsFound`, which looks like missing data and is not. Validate key arity before every request.

12. **Use the correct OECD MEASURE labels — the previous draft had two of them wrong.** [verified from the DSD] The codelist is **`CL_MEASURE_MIG`** (the old `CL_MIG_MEASURE` 404s, which is why they went unresolved): `B11` Inflows of foreign population · `B12` Outflows of foreign population · `B13` **Inflows of asylum seekers** · `B14` Stocks of foreign-born population · `B15` Stocks of foreign population · `B16` **Acquisitions of nationality by country of former nationality** · `B21` Inflows of foreign workers · `B22` Inflows of seasonal foreign workers. `B21`/`B22` are directly relevant to a workforce calculator and were missing entirely from the previous draft.

13. **Do not assume rectangular year coverage in OECD IMD.** [verified] 2023 is full across B11/B12/B13/B15/B16, but **2024 exists only for B13 (36 reporting countries) and B15 (26)** — i.e. only asylum-seeker inflows and foreign-population stocks. Also note the reporter count is **35–37, not 38** OECD members, over **~210 citizenships**. Handle ragged year ranges per (country, measure) pair.

14. **Ship mirror-statistics reconciliation as a headline feature, not a footnote:** for EU pairs, compute both `migr_imm5prv[geo=B, partner=A]` and `migr_emi3nxt[geo=A, partner=B]` and render the divergence band on the arc. A single number per corridor is a false claim; the spread is the real intelligence.

15. **Vendor the frozen bulk datasets with checksums rather than fetching at runtime — but check the sizes first, two of them do not fit.**
    - UN DESA IMS 2024: 3 XLSX, **6,778,  ≈6.78 MB total** (6,005,287 + 541,936 + 231,809) — vendor. Parse **`Table 1` only**; it is wide-format.
    - WB GBMD: **manual DataBank download** — catalog shows "Downloads (0)", no direct URL exists, and the DDH API 429s. CC BY 4.0.
    - OECD DIOC 2020/21: scrape `webfs.oecd.org`, 5 XLSX, **≈21.2 MB** — vendor.
    - Abel & Cohen v6: `https://ndownloader.figshare.com/files/53236079`, **65,341,478 B, 1,882,416 rows**, CC BY 4.0 — vendor.
    - **Gaskin & Abel `flows.nc`: 14,516,188 B** from Zenodo `10.5281/zenodo.18508919`, CC BY 4.0 — **vendor this; it is the whole-world annual flow layer in 14.5 MB.**
    - **Gaskin & Abel `T.nc` (birth-disaggregated): 3.35 GB — do NOT vendor.** Fetch and subset out of band.
    - **QuantMig: 5.93 GB zip of RData** (Zenodo `8224827`) — **cannot be vendored.** Build a one-off preprocessing job (R or `pyreadr`) that reduces the MCMC draws to per-corridor mean + credible interval, and vendor *that* output. Resolve records via `https://zenodo.org/api/communities/quantmig/records?size=25` (the previous `?communities=…&size=50` form returns HTTP 400).

16. **Parse the Abel & Cohen `type` column correctly, and stop looking for a `total` sex.** [verified by scanning all 1,882,416 rows] Rows split into `outward`/`return`/`transit` and naive summation triple-counts. **`sex` has only `male` and `female` — there is no total; sum them.** The file covers **232 origins × 232 destinations**, not 200. Expose the spread across `da_min_open` / `da_min_closed` / `da_pb_closed` as the uncertainty band. Flows stop at the **2015–2020** interval — do not synthesize 2020–2025.

17. **Promote Gaskin & Abel (2026) to a first-class flow layer.** [verified] *Nature* **655**, 148–157 (2026), CC BY 4.0, by Guy Abel himself: **annual** origin×destination flows and stocks, **230 countries, 1990–2023**, with ensemble-derived confidence bounds, plus a birth-country-disaggregated table. Data: Zenodo `10.5281/zenodo.15623215` (current version `10.5281/zenodo.18508919`). Code, weights and covariates: `github.com/ThGaskin/Migration_flows`. It is still `estimate_kind='modelled'` — and its errors correlate with covariate availability, not just stock quality — but it gives the MVP a global annual flow layer with native uncertainty, which nothing else does.

18. **Make the two global flow models disagree on screen.** With both Abel & Cohen (5-yearly, demographic accounting) and Gaskin & Abel (annual, neural, with CI) vendored, the corridor-level divergence between them is a computable, defensible uncertainty measure for the ~200 countries with no register data. Publish that instead of the previous draft's uncomputed "roughly 80% of the world's land area" claim, which was a qualitative impression, not a statistic.

19. **OECD DIOC 2020/21 is the only open dataset plausibly giving origin × destination × educational attainment × occupation**, which is what a "how much workforce can it hold" calculator actually requires. Make it a first-class ingest target despite being XLSX-only with no API — but **open `t1`…`t6` and confirm the variable list before designing the workforce model on it**; the cross-classification claim is unverified, and the `TOP100` filenames indicate truncation to the 100 largest origins. Note `t4` and `t5` have identical byte sizes (3,268,996) — checksum them before assuming they are different tables. The landing page 403s bots; only `webfs.oecd.org` is scrapable.

20. **Do not build against `dtmapi.iom.int`** — every legacy path returns 404 [verified]. IOM DTM v3 requires a subscription key from `https://dtm-apim-portal.iom.int/signin`. And per implication 6, **the HDX fallback is licence-blocked**, so there is no keyless DTM path for this product.

21. **Treat `migrationdataportal.org` (IOM GMDAC) as human documentation only.** It hosts no primary data, exposes no API, and returns HTTP 403 to automated fetchers [verified].

22. **The UN DESA Population Data Portal API is split** [verified]: metadata endpoints (`/api/v1/indicators/`, `/api/v1/locations`) are open and return 200 — indicator **65 `TNetMigration`** and **66 `TNetMigRT`** confirmed by name — but data endpoints return **HTTP 401 with an empty body** and need a registration token. Budget for that signup or fall back to World Bank WDI `SM.POP.TOTL` (open, no key, `lastupdated 2026-07-13`, 2024 data present). Either way, net migration is a WPP residual, not a bilateral measurement — do not draw arcs from it.

23. **Back off hard against `datacatalogapi.worldbank.org`.** [verified] It returned HTTP 429 "Rate limit is exceeded. Try again in 30 seconds." on every attempt across several minutes. Do not put it in a hot path; the catalog HTML page carries the licence and last-updated date without the API.