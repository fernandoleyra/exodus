All endpoints below were called live on 2026-09-18 from this session unless marked UNVERIFIED. Every URL marked "verified" returned HTTP 200 with the described payload shape.

## 0. Architecture decision up front

Absorptive capacity cannot be built from OECD/EU sources — they cover 27–48 countries. The MVP needs a **two-tier model**, and the tiers must be explicit in the data model and in the UI, never silently blended:

- **Tier G (Global, ~190–217 countries)**: World Bank WDI + WHO GHO + UNESCO UIS + UN DESA/WPP. Every indicator in the headline capacity vector must live here.
- **Tier R (Rich, 27–56 countries)**: OECD SDMX, Eurostat, OECD Affordable Housing Database, MIPEX, IMPIC, OECD Settling In. These power a "deep-dive panel" and calibrate Tier G proxies — they never gate the world map.

Store every observation with `{iso3, indicator_id, year, value, source_id, vintage, tier, is_imputed, imputation_method}`. The UI must render `tier` and `is_imputed` as a visible data-quality channel (opacity/hatching on the globe), or the product is dishonest at global scale.

---

## 1. Verified APIs — exact base URLs and call shapes

| Source | Base URL (verified 2026-09-18) | Call shape | Format | Auth | License |
|---|---|---|---|---|---|
| World Bank WDI v2 | `https://api.worldbank.org/v2` | `/country/all/indicator/SH.MED.BEDS.ZS?format=json&per_page=20000&mrnev=1` | JSON/XML | none | CC BY 4.0 (World Bank Open Data ToU) |
| World Bank Data360 | `https://data360api.worldbank.org/data360/data` | `?DATABASE_ID=WB_WDI&INDICATOR=WB_WDI_SP_POP_TOTL&REF_AREA=DEU&timePeriodFrom=2023` | JSON (SDMX-flavoured cols: `OBS_VALUE`,`REF_AREA`,`TIME_PERIOD`,`SEX`,`AGE`,`UNIT_MEASURE`) | none | CC BY 4.0 |
| WHO GHO OData | `https://ghoapi.azureedge.net/api` | `/WHS6_102?$filter=SpatialDim eq 'DEU'` ; `/Indicator?$filter=contains(IndicatorName,'ospital bed')` ; `/Dimension` ; `/DIMENSION/{CODE}/DimensionValues` | XML default, add `$format=json` | none | WHO data policy; CC BY-NC-SA 3.0 IGO on most GHO content — **NC clause: check before any commercial deployment** |
| UNESCO UIS | `https://api.uis.unesco.org/api/public` | `/versions` ; `/definitions/indicators` (5,063 indicators) ; `/data/indicators?indicator=PTRHC.1.TRAINED&geoUnit=KEN&start=2019&end=2024` | JSON | none (public tier) | UIS terms; CC BY-SA 3.0 IGO on UIS data — UNVERIFIED for the API tier specifically |
| Eurostat | `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/{code}` | `?format=JSON&geo=DE&time=2024` → JSON-stat 2.0 | JSON-stat | none | Decision 2011/833/EU, free reuse with attribution; **non-Eurostat-origin series and some trade data excluded from commercial redissemination** |
| OECD SDMX | `https://sdmx.oecd.org/public/rest` | `/dataflow/all/all/latest?detail=allstubs` with header `Accept: application/vnd.sdmx.structure+json;version=1.0` (1,548 dataflows) ; `/data/{AGENCY},{FLOW},{VER}/all?startPeriod=2024&format=csvfilewithlabels` | CSV / SDMX-JSON / SDMX-ML | none | CC BY 4.0 for content published from 2024-07-01 (OECD open-access policy) |
| IMF | `https://api.imf.org/external/sdmx/2.1` | `/dataflow` → SDMX-ML 2.1 (445 KB). Flows: `WEO`, `WEO_2025_OCT_VINTAGE`, `FM`, `FM_2025_OCT_VINTAGE`, `GFS_BS`, `GFS_COFOG`, `QGFS`, `QGFS_2026_MAY_VINTAGE`; DSDs `DSD_WEO`, `DSD_FM`, `DSD_GFS` | SDMX-ML | none | IMF ToU; redistribution of full datasets restricted — attribute, do not mirror wholesale |

**Dead / do not use:** legacy `http://dataservices.imf.org/REST/SDMX_JSON.svc/` returned empty in this environment on 2026-09-18. Treat as retired; use `api.imf.org`. Also: `https://sdmx.oecd.org/public/rest/dataflow/...?format=sdmx-json` is rejected — the server replies "acceptable query values for parameter 'format': structure, xml-structure-3.0.0, sdmx-3.0, json-structure-2.0.0". Use the `Accept` header instead.

---

## 2. Housing

| Item | Identifier / URL | Coverage | Cadence | License |
|---|---|---|---|---|
| OECD Affordable Housing Database | `https://webfs.oecd.org/els-com/Affordable_Housing_Database/HM1-1-Housing-stock-and-construction.xlsx` (verified directory listing) — also `HM1-2-Housing-prices.xlsx`, `HM1-3-Housing-tenures.xlsx`, `HM1-4-Living-arrangements-age-groups.xlsx`, `HM1-5-Housing-stock-by-dwelling-type.xlsx`, `PH4-2-Social-rental-housing-stock.xlsx`, `PH6-1-Rental-regulation.xlsx`, `PH3-1-Public-spending-on-housing-allowances.xlsx` | ~40–46 OECD + key partners | Irregular, roughly annual per indicator sheet | CC BY 4.0 |
| OECD analytical house prices | SDMX flow `OECD.ECO.MPD,DSD_AN_HOUSE_PRICES@DF_HOUSE_PRICES,1.0`. `MEASURE` codes verified: `HPI` (nominal), `RHP` (real), `RPI` (rent), `HPI_YDH` (**price-to-income ratio**), `HPI_YDH_AVG` (standardised price-income), `HPI_RPI`, `HPI_RPI_AVG` | 51 `REF_AREA` values incl. aggregates (EA17 etc.) → ~45 countries | Quarterly; 2025-Q4 present | CC BY 4.0 |
| OECD regional housing | `OECD.CFE.EDS,DSD_REG_SOC@DF_HOUSING,2.4`; `OECD.SDD.TPS,DSD_RHPI@DF_RHPI_ALL,1.0`; `DSD_RHPI@DF_RHPI_TRANSACTIONS,1.0`; `DSD_RHPI_TARGET@DF_RHPI_TARGET,1.0` | OECD subnational (TL2/TL3) | Annual/quarterly | CC BY 4.0 |
| Eurostat overcrowding | `ilc_lvho05a` — verified, `updated 2026-09-17T23:00+0200` | EU27 + EFTA + candidates | Annual (EU-SILC) | 2011/833/EU |
| Eurostat housing cost overburden | `ilc_lvho07a` — verified, `updated 2026-09-17T23:00+0200` | EU27+ | Annual | 2011/833/EU |
| Eurostat house price index | `prc_hpi_a` (annual), `prc_hpi_q` (quarterly) — `prc_hpi_a` verified, `updated 2026-07-02` | EU27+ | Annual / quarterly | 2011/833/EU |
| **Global housing proxy** | WDI `EN.POP.SLUM.UR.ZS` "Population living in slums (% of urban population)" — **196 countries**, 194 since 2016, median vintage 2022 | 196 | Irregular (UN-Habitat/SDG 11.1.1) | CC BY 4.0 |

**Coverage gap, stated plainly:** there is no global dwelling-stock, vacancy-rate, completions or price-to-income series. Anything past ~50 countries on housing is a proxy. The only honest global housing constraint variables are slum share (`EN.POP.SLUM.UR.ZS`), urban share (`SP.URB.TOTL.IN.ZS`, 217), population density (`EN.POP.DNST`, 216) and, at Tier R, overcrowding + price-to-income. Do not invent a global vacancy rate. UN-Habitat Urban Indicators Database as a bulk alternative: UNVERIFIED (no endpoint confirmed in this session).

---

## 3. Health

WHO GHO indicator codes, confirmed by live `/Indicator` query:

| Code | Name | Unit |
|---|---|---|
| `WHS6_102` | Hospital beds (per 10 000 population) | per 10k |
| `HRH_26` | Physicians density (per 1000 population) | per 1k |
| `HRH_33` | Nursing and midwifery personnel density (per 1000 population) | per 1k |
| `WHS6_148` | Nursing and midwifery personnel density (per 10 000 population) | per 10k |
| `HWF_0006` | Nursing and midwifery personnel (per 10,000) | per 10k |
| `HRH_01` / `HRH_02` / `HRH_24` | Counts: nursing personnel / physicians / nursing+midwifery | headcount |

Sample verified: `GET https://ghoapi.azureedge.net/api/WHS6_102?$filter=SpatialDim eq 'DEU'` → `{"NumericValue":79.39,"TimeDim":2018,...,"Comments":"OECD Health Statistics Database, data extracted on 31 January 2025"}`. Note the record carries `Date: 2025-09-30` as the GHO refresh stamp while the observation year is 2018 — **the API mixes refresh date and reference year; key on `TimeDim`, never on `Date`.**

WDI mirrors with better tidiness and measured coverage (sovereign economies only, `mrnev=1`, computed live):

| WDI code | Name | Countries (of 217) | ≥2016 | Median vintage |
|---|---|---|---|---|
| `SH.MED.BEDS.ZS` | Hospital beds per 1,000 | 201 | 157 | 2022 |
| `SH.MED.PHYS.ZS` | Physicians per 1,000 | 208 | 187 | 2022 |
| `SH.MED.NUMW.P3` | Nurses & midwives per 1,000 | 198 | 196 | 2022 |
| `SH.XPD.CHEX.PC.CD` | Current health expenditure per capita, US$ | 193 | 193 | 2023 |

OECD deep panel: `OECD.ELS.HD,DSD_HEALTH_REAC_HOSP@DF_BEDS_SECT,1.1` (beds by sector), `@DF_BEDS_FUNC,1.1` (beds by function), `OECD.ELS.HD,DSD_HEALTH_WFMI@DF_HEALTH_WFMI,1.0` (**health workforce migration** — directly relevant to brain-drain simulation in origin countries).

**Gap:** hospital beds are stale for 44 countries (no post-2016 observation), concentrated in low-income and small-island states. Physicians/nurses are the better global health axis.

---

## 4. Education

UIS API is live: latest version `20260507-91260335`, `themeDataStatus.EDUCATION.lastUpdate = 02/09/2026` ("February 2026 Data Release"), 5,063 indicators.

| UIS code | Name | Records | Range |
|---|---|---|---|
| `PTRHC.1.TRAINED` | Pupil-trained teacher ratio, primary (headcount) | 5,844 | 1997–2025 |
| `PTRHC.1.QUALIFIED` | Pupil-qualified teacher ratio, primary | 3,581 | 1999–2025 |
| `PTRHC.2.TRAINED` / `PTRHC.2T3.TRAINED` / `PTRHC.3.TRAINED` | Lower sec / secondary / upper sec | 3,143 / 3,995 / 2,828 | 1997–2025 |
| `PTRHC.02.TRAINED` | Pre-primary | 4,095 | 1997–2025 |
| `GER.1`, `GER.2T3`, `GER.5T8` | Gross enrolment ratio primary / secondary / tertiary | 17,889 / 16,509 / 15,168 | 1970–2025 |
| `NER.02.CP` | Net enrolment, pre-primary (childcare capacity proxy) | 7,774 | 1997–2025 |

**Important:** the UIS public indicator list contains **no plain (all-teacher) pupil-teacher ratio code** — only `.TRAINED` and `.QUALIFIED` variants. The unconditioned pupil-teacher ratio is only available via WDI `SE.PRM.ENRL.TC.ZS` (206 countries, but **median vintage 2017, only 160 countries since 2016 — the stalest indicator in the whole candidate set**). Prefer `SE.SEC.ENRR` (208 countries, 188 since 2016, median 2024) and `SE.XPD.TOTL.GD.ZS` (203/190, median 2023) for the live vector, and use `PTRHC.1.TRAINED` from UIS as the pressure detail in the deep panel.

OECD education-by-migration-status flows (Tier R, directly usable for integration outcomes): `OECD.EDU.IMEP,DSD_EAG_LSO_EA@DF_LSO_NEAC_EMP_MIGR,1.0` (employment rates by country of birth and age at migration), `@DF_LSO_NEAC_UNEMP_MIGR`, `@DF_LSO_NEAC_INAC_MIGR`, `@DF_LSO_TRANS_MIGR` (NEET by country of birth), `@DF_LSO_EARN_REL_NATIVE` (earnings gap).

---

## 5. Fiscal

| Source | Identifier | Coverage | Cadence |
|---|---|---|---|
| IMF WEO | flow `WEO` (DSD `DSD_WEO`); vintage flow `WEO_2025_OCT_VINTAGE` | ~190+ | 2×/yr (April, October) |
| IMF Fiscal Monitor | flow `FM`; vintage `FM_2025_OCT_VINTAGE` | ~190 | 2×/yr |
| IMF GFS | `GFS_BS`, `GFS_COFOG`, `GFS_SFCP`, `GFS_SOO`, `QGFS` (+ `QGFS_2026_MAY_VINTAGE`) | ~100–150 reporters | Annual / quarterly |
| OECD Revenue Statistics | `OECD.CTP.TPS,DSD_REV_COMP_GLOBAL@DF_RSGLOBAL,2.1` (**Global** — widest), `@DF_RSOECD,2.0`, `@DF_RSLAC,2.0`, `@DF_RSAFRICA,2.0`, `@DF_RSASAP,2.1` | Global comparative file ~120+ | Annual | 
| OECD Government at a Glance | `OECD.GOV.GIP,DSD_GOV@DF_GOV_PF_2025,1.0`, `DSD_GOV_COFOG@DF_GOV_COFOG_2025,1.0`, `DSD_GOV_LEVEL@DF_GOV_LEVEL_2025,1.0`, plus `..._YU` yearly-update variants | OECD+ | Biennial edition + yearly updates |
| OECD SOCX | `OECD.ELS.SPD,DSD_SOCX_AGG@DF_SOCX_AGG,1.0`, `@DF_PUB_PRV,1.0`, `@DF_NET_GDP,1.0` | 38 | Annual |
| WDI fiscal | `GC.TAX.TOTL.GD.ZS` 161/217 (149 since 2016, median 2024); `GC.XPN.TOTL.GD.ZS` 161/217; `NE.CON.GOVT.ZS` 188/217 (181 since 2016, median **2025**); `NY.GDP.PCAP.PP.KD` 199/217 (median 2025) | see left | Annual |

**Gap:** tax revenue/expense ratios collapse to 161 countries — the classic IMF-GFS reporting gap. `NE.CON.GOVT.ZS` (general government final consumption, % GDP, national-accounts derived) covers 188 and is the right fiscal-space proxy for a global vector; carry `GC.TAX.TOTL.GD.ZS` only as Tier-G-optional.

---

## 6. Public attitudes / social capacity

| Instrument | Coverage | Latest public wave | Access | License |
|---|---|---|---|---|
| Gallup World Poll **Migrant Acceptance Index** (3 items: migrants living in country / as neighbours / marrying into family; sum 0–9) | 140 countries 2016–17; **145 countries 2019** | 2019 wave, published Sept 2020 (global mean fell 5.34 → 5.21; range 1.49 North Macedonia → 8.46 Canada). A newer full-panel MAI is **UNVERIFIED** | Country-level scores appear in Gallup news articles and are mirrored by IOM's Migration Data Portal; the microdata and the full country dataset are **commercial, licensed per-seat** | Proprietary. Do not vendor the microdata. Scraping the news tables for ~145 country scores is a legally grey MVP shortcut — flag it in the repo, or substitute WVS/ESS |
| European Social Survey | 30+ European countries, Round 11 (2023/24) integrated file edition 4.x incl. Estonia, Ukraine | ESS11 | `https://ess.sikt.no` — free after registration/login; CSV, SPSS .sav, Stata .dta. Immigration battery (`imbgeco`, `imueclt`, `imwbcnt`) present in every round | Free for non-commercial research; **registration required → cannot be fetched anonymously by a build agent.** Ship a manual-import connector, not a live scraper |
| World Values Survey | 120+ countries cumulatively; Wave 7 (2017–2022) is the last complete global wave; **Wave 8 running 2024–2026**, joint EVS/WVS European fieldwork 2026–27 | WVS7 + trend file 1981–2022 | `worldvaluessurvey.org` free download after form submission | Free, attribution + citation required; redistribution restricted |
| Eurobarometer | EU27 (+candidates) | Standard EB 104 Autumn 2025 | Aggregates: `https://europa.eu/eurobarometer` ; microdata + ZA study numbers at GESIS with DOIs | Commission material: 2011/833/EU. GESIS archive access terms apply to microdata |
| Ipsos Global Advisor / World Refugee Day | ~28–30 countries | Annual | Topline PDFs free, tabulations commercial | Proprietary |

**Decision for the MVP:** public opinion is the weakest global axis. Do **not** put it in the headline capacity score. Ship it as a separate, clearly-labelled "social receptivity" overlay with 140–145 country coverage at a 2019 vintage, or omit it in v1 and show a "no data" channel. A 2019 attitude score presented as live sentiment is the single most misleading thing this product could do.

---

## 7. Integration & policy measurement

| Dataset | Coverage | Vintage | Access | License |
|---|---|---|---|---|
| **MIPEX** (Migration Policy Group + CIDOB) | 56 countries historically; **MIPEX 2025 update covers EU27 for 2020–2023/24** | 2020 full, 2025 EU-only update (results PDF: `https://migpolgroup.com/wp-content/uploads/2025/09/MIPEX-results-2025.pdf`) | `https://www.mipex.eu/` — returned HTTP 503 on 2026-09-18, so the download path and exact file URLs are **UNVERIFIED**; re3data record `r3d100013248` lists license type as "other" | Open access claimed; **not confirmed CC BY**. Treat as manual-import, attribute MPG/CIDOB |
| 8 MIPEX policy strands (labour market mobility, family reunification, education, political participation, permanent residence, access to nationality, anti-discrimination, health) — exact per-strand indicator counts UNVERIFIED in this session | | | | |
| **IMPIC** | 33 OECD countries, **1980–2018** | v2, Helbling/Abou-Chadi/Berger/Bjerre/Breyer/Römer/Zobel (2024), WZB technical report `https://bibliothek.wzb.eu/pdf/2024/vi16-201r.pdf` | WZB / Uni Bamberg; JRC KCMD catalogue `ds00152` | Academic use, citation required |
| **DEMIG POLICY** | 45 countries, ~6,500 policy changes, 1945–2013 | Frozen 2014 | `migrationinstitute.org/data/demig-data` | Free, citation |
| **DEMIG-QuantMig** (the live successor) | 31 European countries, >7,600 changes, **1990–2020** | 2021+ | `https://www.quantmig.eu/data_and_estimates/policy_database/` | Free download |
| **IMPALA** | 20 OECD countries; admission + naturalisation policy | Stalled; `impaladatabase.org` | Academic | Citation |
| **OECD/EU Settling In — Indicators of Immigrant Integration 2023** | All OECD + EU countries, **83 indicators** across labour market & skills, living conditions, civic engagement & social integration | 2023 edition, DOI `10.1787/1d5020a6-en`, PDF `https://www.oecd.org/content/dam/oecd/en/publications/reports/2023/06/indicators-of-immigrant-integration-2023_70d202c4/1d5020a6-en.pdf` | Free | CC BY 4.0 (post-2024 policy applies to re-issues; the 2023 PDF predates it — **verify per-file**) |
| Visa openness | Henley Passport Index: 199 passports × 227 destinations, built on **IATA Timatic** data, updated ~monthly/quarterly. There is **no licensed public API**; scraped GitHub mirrors exist but the underlying access matrix is **not** MIT-licensable | Proprietary (Henley/IATA). For an open build, use DEMIG/IMPIC visa-policy variables or model bilateral visa requirements as a user-supplied CSV |

**Policy-data gap, stated plainly:** there is **no** cross-country immigration-policy index with global coverage. MIPEX = 56, IMPIC = 33, DEMIG-QuantMig = 31. Any "global policy restrictiveness" layer beyond ~56 countries is fabrication.

---

## 8. Labour-market integration outcomes of migrants

| Indicator | Source / code | Coverage |
|---|---|---|
| Employment / unemployment / participation rate, foreign-born vs native-born, by sex | OECD SDMX `OECD.ELS.IMD,DSD_MIG@DF_MIG_NUP_SEX,1.0` — **verified live**; dimensions `REF_AREA, CITIZENSHIP, FREQ, MEASURE (EMP_RATE/UNE_RATE/…), SEX, BIRTH_PLACE (FB/NB), EDUCATION_LEV, UNIT_MEASURE (PT_LF_SUB), TIME_PERIOD` | OECD 38 + partners |
| Employment rate by educational attainment × birthplace | `OECD.ELS.IMD,DSD_MIG@DF_MIG_EMP_EDU,1.0` | OECD |
| Foreign-born stocks | `OECD.ELS.IMD,DSD_MIG_F@DF_MIG_POPF,1.0` | OECD |
| Standardised permanent / temporary inflows | `DSD_MIG_INT@DF_MIG_INT_PER,1.0` / `@DF_MIG_INT_TEMP,1.0` | OECD |
| International migration database (flows by origin×destination) | `OECD.ELS.IMD,DSD_MIG@DF_MIG,1.0` | OECD |
| Over-qualification rate by country of birth | Eurostat **`lfsa_eoqgac`** — verified, `updated 2026-09-10T23:00+0200` | EU27+ |
| Over-qualification rate by citizenship | Eurostat **`lfsa_eoqgan`** — verified, same update stamp | EU27+ |
| Employment rate by citizenship | Eurostat **`lfsa_ergan`** — verified | EU27+ |
| Unemployment rate by citizenship | Eurostat **`lfsa_urgan`** — verified | EU27+ |
| Population by citizenship (stock denominators) | Eurostat **`migr_pop1ctz`** — verified, `updated 2026-08-10` | EU27+ |
| Subnational foreign-born | `OECD.CFE.EDS,DSD_REG_MIGRANT@DF_MIG_STOCK,1.0`; `DSD_FUA_DEMO@DF_ORIGIN,1.2` (cities/FUAs); `DSD_REG_DEMO@DF_MIGR_FLOW,2.4` | OECD regions/FUAs |

Definitions to hard-code: **employment gap** = employment rate (native-born, 15–64) − employment rate (foreign-born, 15–64), percentage points, positive = migrants disadvantaged. **Over-qualification rate** = share of employed persons with ISCED 5–8 working in ISCO major groups 4–9, restricted to ages 20–64.

---

## 9. The proposed absorptive-capacity vector: 12 indicators, measured coverage

All counts computed live on 2026-09-18 against the WDI v2 API with `mrnev=1`, filtered to the **217 World Bank sovereign economies** (`region.id != 'NA'`).

| # | Axis | Indicator | Code | Countries | ≥2016 | Median vintage | Sign |
|---|---|---|---|---|---|---|---|
| 1 | Housing | Population in slums, % urban | `EN.POP.SLUM.UR.ZS` | 196 | 194 | 2022 | − |
| 2 | Housing/space | Population density, per km² | `EN.POP.DNST` | 216 | 216 | 2023 | − |
| 3 | Health | Physicians per 1,000 | `SH.MED.PHYS.ZS` | 208 | 187 | 2022 | + |
| 4 | Health | Nurses & midwives per 1,000 | `SH.MED.NUMW.P3` | 198 | 196 | 2022 | + |
| 5 | Health | Current health expenditure per capita, US$ | `SH.XPD.CHEX.PC.CD` | 193 | 193 | 2023 | + |
| 6 | Education | Secondary gross enrolment ratio | `SE.SEC.ENRR` | 208 | 188 | 2024 | + |
| 7 | Education | Government expenditure on education, % GDP | `SE.XPD.TOTL.GD.ZS` | 203 | 190 | 2023 | + |
| 8 | Infrastructure | Access to electricity, % pop | `EG.ELC.ACCS.ZS` | 216 | 215 | 2024 | + |
| 9 | Infrastructure | Basic drinking water, % pop | `SH.H2O.BASW.ZS` | 214 | 214 | 2024 | + |
| 10 | Fiscal | General gov. final consumption, % GDP | `NE.CON.GOVT.ZS` | 188 | 181 | **2025** | + |
| 11 | Fiscal | GDP per capita, PPP, constant | `NY.GDP.PCAP.PP.KD` | 199 | 199 | **2025** | + |
| 12 | Labour slack | Unemployment rate, % labour force (ILO modelled) | `SL.UEM.TOTL.ZS` | 187 | 187 | **2025** | − |

Mandatory companions (not scored, used as denominators/drivers, all 216–217 countries): `SP.POP.DPND.OL` (old-age dependency, 217, 2025), `SP.DYN.TFRT.IN` (TFR, 217, 2024), `SM.POP.TOTL.ZS` (international migrant stock % of population, 216, **2024 vintage**), `SM.POP.NETM` (net migration, 217, 2025), `SP.URB.TOTL.IN.ZS` (urban share, 217, 2025), `SL.TLF.CACT.ZS` (LFP, 187), `SL.UEM.NEET.ZS` (youth NEET, 182).

**Rejected for the headline vector, with reasons:** `SE.PRM.ENRL.TC.ZS` (206 countries but median vintage **2017**, only 160 post-2016 — too stale); `GC.TAX.TOTL.GD.ZS` (161 only); `GC.DOD.TOTL.GD.ZS` (120 only); `SI.POV.GINI` (171, median 2021, irregular); `SH.MED.BEDS.ZS` (201 nominally but only 157 post-2016); Gallup MAI (145, 2019, proprietary); MIPEX (56); IMPIC (33).

### Computation — write this exactly

For each indicator `k`, country `i`, latest-available observation `x_ik`:

1. **Vintage guard.** Drop any observation older than 10 years (`year < current_year − 10`). Record `is_stale`.
2. **Log transform** for right-skewed levels — indicators 5, 11 (`x' = ln(1+x)`) and for density, indicator 2 (`x' = ln(1+x)`).
3. **Winsorise** at the 5th/95th percentile of the cross-country distribution for that indicator-year: `x'' = clip(x', p05, p95)`.
4. **Direction and min-max normalise** to `[0,1]`: `z_ik = (x'' − p05) / (p95 − p05)` for sign `+`; `z_ik = 1 − (x'' − p05)/(p95 − p05)` for sign `−`.
5. **Sub-index by axis** = unweighted mean of available `z` in that axis (housing: 1–2; health: 3–5; education: 6–7; infrastructure: 8–9; fiscal: 10–11; labour: 12).
6. **Absorptive Capacity Index** `ACI_i = Σ_a w_a · S_ia` with default weights `w = {housing 0.20, health 0.20, education 0.15, infrastructure 0.15, fiscal 0.20, labour 0.10}`, weights renormalised over axes with at least one observation. Weights must be user-editable sliders in the UI, and every published figure must carry the weight vector used.
7. **Coverage score** `C_i = (# non-imputed, non-stale indicators) / 12`. **Suppress the ACI on the map when `C_i < 0.5`** and render the country in a distinct "insufficient data" colour. Never interpolate a country into existence.
8. **Imputation ladder**, in order, each tagged: (a) same country, most recent ≤10y; (b) same country, linear interpolation between bracketing years; (c) regional (World Bank region) median for that indicator-year; (d) income-group median. Stop at (d); do not go global-mean.

### Headroom, the thing the product actually claims

Convert the index into an annual intake figure the user can interrogate:

```
Headroom_i = Σ_k  β_k · max(0, x_ik − target_k) · pop_i / coeff_k
```

where each `k` is a binding constraint expressed in **people per unit of stock**, e.g. physicians: `coeff_physicians = 1000 / x_physicians_per_1000` gives population per physician, and the marginal intake sustainable without degrading that ratio below a floor `target` is `(x_ik/target_k − 1) · pop_i`. Report the **minimum across constraints**, not the sum:

```
AnnualIntakeCapacity_i = min_k [ (x_ik / target_k − 1) · pop_i ] / horizon_years
```

This is a Liebig's-law-of-the-minimum formulation: capacity is set by the scarcest resource, and the UI must **name the binding constraint** for every country. Defaults for `target_k` should be explicit, editable, and sourced (e.g. WHO SDG health-workforce threshold of 4.45 doctors+nurses+midwives per 1,000 — **UNVERIFIED as of the 2026 revision; confirm against the current WHO GHO metadata before hard-coding**). A capacity number without a named binding constraint and an editable threshold is a political assertion, not an estimate.

---

## 10. Biggest coverage gaps, consolidated

1. **Housing**: no global stock/vacancy/completions/price-to-income. Anything beyond ~50 countries is proxy. Slum share is the only defensible global variable.
2. **Fiscal**: tax and expenditure ratios stop at 161 countries; low-income and small-island states missing.
3. **Policy**: hard ceiling at 56 countries (MIPEX), 33 (IMPIC), 31 (DEMIG-QuantMig).
4. **Attitudes**: 145 countries at best, 2019 vintage, proprietary.
5. **Migrant labour-market outcomes**: OECD 38 + EU27 only. No global employment gap or over-qualification series exists.
6. **Education timeliness**: the unconditioned pupil-teacher ratio has a 2017 median vintage worldwide.
7. **Small states**: Monaco, Nauru, Tuvalu, San Marino, and most non-sovereign territories fail the `C_i ≥ 0.5` test on nearly every axis. Expect ~190–200 scorable, not 217.
