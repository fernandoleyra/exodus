## 0. Verification status legend

Everything below with a URL was hit live on 2026-09-18 (HTTP status and `content-length` recorded) unless tagged **UNVERIFIED**. Do not invent variants of these paths — the UN and JRC paths in particular contain non-obvious spelling (`1_Indicator (Standard)`, singular) that will 404 if "corrected".

---

## 1. UN World Population Prospects — the authoritative national spine

**Current revision is WPP 2024 (28th edition, released 11 July 2024). The 2026 revision has been postponed to 2027** — so for an MVP built in late 2026, WPP 2024 is the latest. 237 countries/areas, 1950–2100, single-year of age, single calendar year.

**License:** CC BY 3.0 IGO. Attribution string to embed in the app footer: `United Nations, Department of Economic and Social Affairs, Population Division (2024). World Population Prospects 2024, Online Edition.`

### 1.1 Bulk CSV — VERIFIED URLs and byte sizes

Base: `https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/`

| File | Bytes (gz) | Content |
|---|---:|---|
| `WPP2024_Demographic_Indicators_Medium.csv.gz` | 16,557,272 | 65 indicators × location × year, medium variant |
| `WPP2024_Demographic_Indicators_OtherVariants.csv.gz` | 75,342,445 | all non-medium variants (see 1.3) |
| `WPP2024_Demographic_Indicators_notes.csv` | small, plain CSV | indicator dictionary (`IndicatorNo,Topic,Indicator,IndicatorName,Unit`) |
| `WPP2024_PopulationBySingleAgeSex_Medium_1950-2023.csv.gz` | 62,082,217 | pop by single age 0–100+, sex |
| `WPP2024_PopulationBySingleAgeSex_Medium_2024-2100.csv.gz` | 66,954,143 | same, projected |
| `WPP2024_Population1JanuaryBySingleAgeSex_Medium_2024-2100.csv.gz` | 67,882,675 | 1 Jan stock (use for cohort-component Jan-to-Jan) |
| `WPP2024_Fertility_by_Age1.csv.gz` | 200 OK | single-year ASFR |
| `WPP2024_Fertility_by_Age5.csv.gz` | 82,864,610 | 5-year ASFR |
| `WPP2024_Life_Table_Complete_Medium_Both_1950-2023.csv.gz` | 200 OK | complete life tables (needs `nLx`, `Tx`) |

### 1.2 Exact column schema of `Demographic_Indicators_Medium` (verified header, UTF-8 BOM present)

```
SortOrder,LocID,Notes,ISO3_code,ISO2_code,SDMX_code,LocTypeID,LocTypeName,ParentID,Location,
VarID,Variant,Time,TPopulation1Jan,TPopulation1July,TPopulationMale1July,TPopulationFemale1July,
PopDensity,PopSexRatio,MedianAgePop,NatChange,NatChangeRT,PopChange,PopGrowthRate,DoublingTime,
Births,Births1519,CBR,TFR,NRR,MAC,SRB,Deaths,DeathsMale,DeathsFemale,CDR,
LEx,LExMale,LExFemale,LE15,LE15Male,LE15Female,LE65,LE65Male,LE65Female,LE80,LE80Male,LE80Female,
InfantDeaths,IMR,LBsurvivingAge1,Under5Deaths,Q5,Q0040,Q0040Male,Q0040Female,Q0060,Q0060Male,Q0060Female,
Q1550,Q1550Male,Q1550Female,Q1560,Q1560Male,Q1560Female,NetMigrations,CNMR
```
Population columns are **in thousands**. `NetMigrations` is thousands of persons per year; `CNMR` is per 1,000 population. `LocTypeName` distinguishes `Country/Area` from aggregates (`World`, `SDG region`, `ADB region: …`) — **filter `LocTypeName='Country/Area'` or you will double-count**.

### 1.3 Projection variants — VERIFIED `VarID,Variant` pairs

`2 Medium` (in the Medium file) · `3 High` · `4 Low` · `5 Constant fertility` · `6 Instant replacement` · **`7 Zero migration`** · `8 Constant mortality` · `9 No change` · `10 Momentum` · `16 Instant replacement zero migration` · `17 No fertility below age 18` · `18 Accelerated ABR decline` · `19 Accelerated ABR decline with rec` · `202 Median PI` · `203 Upper 80 PI` · `204 Lower 80 PI` · `206 Upper 95 PI` · `207 Lower 95 PI` · `208 Mean`.

**VarID 7 (Zero migration) is the single most important series in this product.** `Medium − Zero migration` is the officially sanctioned *migration counterfactual*: it isolates the entire demographic contribution of net migration (direct + the births those migrants have) without you having to re-run a projection. Ship it in the MVP as the headline "what migration is already doing" number.

### 1.4 UN Data Portal API — partially open, **data endpoints now require auth**

- `GET https://population.un.org/dataportalapi/api/v1/indicators?pageSize=100` → **200**, no auth, 86 indicators, JSON with `id`, `name`, `description`, `dimAge`, `dimSex`, `dimVariant`, `dimCategory`, `sourceCitation`.
- `GET https://population.un.org/dataportalapi/api/v1/locations?pageSize=100&pageNumber=N` → **200**, no auth, 300 locations, fields `id,name,iso3,iso2,longitude,latitude`.
- `GET https://population.un.org/dataportalapi/api/v1/data/indicators/{ind}/locations/{loc}/start/{y}/end/{y}` → **HTTP 401** as of 2026-09-18.

**Decision: do not put the Data Portal `/data/` endpoint on the MVP critical path.** Use it only for the free `indicators` and `locations` metadata (good for building the ISO3↔LocID crosswalk and the indicator dictionary); ingest all numeric series from the bulk CSVs above. How to obtain a bearer token is **UNVERIFIED**.

Relevant indicator IDs (verified names + official definitions): `19` TFR · `46/47` pop by 5-yr/1-yr age & sex · `49` total pop by sex · `61` e(0) · `65` total net-migration · `66` crude net migration rate · `67` median age · `83` child dependency ratio · `84` old-age dependency ratio · `85` potential support ratio · `86` total dependency ratio · `70` broad age groups · `75–82` life-table columns · `87–90` population by degree of urbanisation.

Critically, UN **parameterises** the dependency ratios by a category dimension: definition is "population under x1 to persons of working age x1–x2" with (0–24 / 25–64 / 65+) shown as the *example*, not the only option. **The app must let the user pick the working-age window (15–64, 20–64, 25–64) and must label which one is active on every chart** — the 15–64 and 25–64 old-age dependency ratios differ by roughly a third and conflating them is the most common analytical error in this domain.

### 1.5 R package fallback
`PPgp/wpp2024` on GitHub packages the same WPP 2024 tables. Useful for cross-checking your CSV parser against a maintained reference. **UNVERIFIED**: exact CRAN status.

---

## 2. Eurostat EUROPOP2025 — the regional (NUTS-3) layer, and it is brand new

Confirmed live via the Eurostat catalogue TOC and the dissemination API. **EUROPOP2023 is superseded — use EUROPOP2025.**

API pattern (JSON-stat 2.0, no key, no rate limit published):
```
https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/{dataset}?format=JSON&geo=DE&time=2050&projection=BSL
```

| Dataset code | Content | Last update (verified) | Cells |
|---|---|---|---|
| `proj_25np` | Population 1 Jan by single age, sex, variant, 2025–2100 | 2026-06-11 | 5,617,920 |
| `proj_25nanmig` | **Net migration assumptions by age, sex, variant** | 2026-06-11 | 4,186,080 |
| `proj_25naasfr` | Fertility rate assumptions by age | 2026-05-20 | 173,280 |
| `proj_25naasmr` | Mortality rate assumptions by age, sex | 2026-06-11 | 921,120 |
| `proj_25nalexp` | Projected life expectancy by age, sex | 2026-06-11 | 921,120 |
| `proj_25ndbi` | Demographic balances & indicators | 2026-06-11 | 340,480 |
| `proj_25rp5` | **Population by 5-yr age group, sex, variant, NUTS-3** | 2026-06-29 | 1,733,520 |
| `proj_25rdbal` | Demographic balances by NUTS-3 (5-yr aggregates) | 2026-06-29 | 71,065 |
| `proj_25raasfr` / `proj_25ralexp` | TFR / e(0) by NUTS-3 | 2026-06-29 | 17,475 / 34,950 |

**Verified `projection` dimension codes for EUROPOP2025:** `BSL` Baseline · `LFRT` lower fertility · `LMRT` lower mortality · **`HMIGR` higher migration** · **`LMIGR` lower migration** · **`NMIGR` no migration** · `DCONV` delayed convergence.

**Verified `indic_de` codes in `proj_25ndbi`** (ship these as the EU indicator vocabulary): `JAN`, `LBIRTH`, `DEATH`, `NMIGRAT`, `MEDAGEPOP` (+`F`/`M` variants), `DEPRATIO1` (0–14 & 65+ over 15–64), `DEPRATIO3` (0–19 & 65+ over 20–64), `OLDDEP1`, `OLDDEP3`, `YOUNGDEP1`, `YOUNGDEP3`, `PC_Y0_14`, `PC_Y0_19`, `PC_Y15_64`, `PC_Y15_74`, `PC_Y20_64`, `PC_Y65_MAX`, `PC_Y80_MAX`.

EUROPOP2025's `HMIGR`/`LMIGR`/`NMIGR` triplet at NUTS-3 is *the* regional migration-scenario spine for Europe — nothing comparable exists globally. Design the scenario engine so the EU gets these real official variants and the rest of the world gets your own modelled scenarios, clearly badged as such.

**License:** Eurostat content reuse policy — free reuse with source acknowledgement (Commission Decision 2011/833/EU), equivalent to CC BY 4.0 in practice.

**National statistical office projections (ONS, INSEE, Destatis, ABS, StatCan, IBGE, NBS…) are heterogeneous in vintage, variant naming and age grouping.** Do not attempt them in the MVP. Build an `NSOAdapter` interface (`listVariants()`, `getPopByAgeSex(iso3, year, variant)`, `getNetMigration(...)`, `provenance()`) with WPP and Eurostat as the two reference implementations, and leave NSO adapters as plug-ins.

---

## 3. Cohort-component projection — the exact method to implement

This is the only defensible way to answer "what happens if we admit N migrants of profile P". Implement it in TypeScript/WASM client-side so scenarios are instant.

**State:** `P[s][a][t]` = population of sex `s`, single age `a` ∈ [0,100+], at 1 January of year `t`.

**Inputs per year:** survivorship `S[s][a]` (from life table), age-specific fertility `f[a]` for a ∈ [15,49], sex ratio at birth `SRB` (≈1.05 male/female), net migration by age and sex `M[s][a]`.

**Survivorship from a complete life table:**
```
S[s][a] = L[s][a+1] / L[s][a]                 for 0 <= a <= 99
S[s][100+] = T[s][101] / T[s][100]            open-ended interval
S_birth[s] = L[s][0] / (l0 * 1)               survival from birth to age 0 exact
```
where `L[a]` = person-years lived in age interval [a,a+1), `T[a]` = Σ_{x≥a} L[x], `l0` = radix (100000).

**Ageing step (migration applied at mid-interval, the UN convention):**
```
P[s][a+1][t+1] = (P[s][a][t] + 0.5*M[s][a]) * S[s][a] + 0.5*M[s][a]
P[s][100+][t+1] = (P[s][99][t] + 0.5*M[s][99]) * S[s][99]
                + (P[s][100+][t] + 0.5*M[s][100+]) * S[s][100+] + 0.5*(M[s][99]+M[s][100+])
```

**Births:**
```
B = Σ_{a=15..49} f[a] * 0.5 * (P[F][a][t] + P[F][a][t+1])
B_male   = B * SRB/(1+SRB)
B_female = B * 1/(1+SRB)
P[s][0][t+1] = B_s * S_birth[s] + 0.5*M[s][0]
```

**Zero-migration run:** set `M ≡ 0`, keep `S` and `f` identical. The difference against the with-migration run over horizon H is the migration contribution — direct plus second-generation births. Expose this as the app's core "migration delta" primitive.

**Derived indicators (compute, never hard-code):**
```
TDR  = 100 * (Σ_{a<x1} P[a] + Σ_{a>=x2} P[a]) / Σ_{a=x1..x2-1} P[a]
OADR = 100 * Σ_{a>=x2} P[a] / Σ_{a=x1..x2-1} P[a]
CDR_child = 100 * Σ_{a<x1} P[a] / Σ_{a=x1..x2-1} P[a]
PSR  = Σ_{a=x1..x2-1} P[a] / Σ_{a>=x2} P[a]      (= 100/OADR)
TFR  = Σ_{a=15..49} f[a]
NRR  = Σ_{a=15..49} f[a] * (1/(1+SRB)) * L[F][a]/l0
MedianAge: linear interpolation on the cumulative age distribution at 0.5*ΣP
WAP  = Σ_{a=x1..x2-1} P[a]           (working-age population, the "workforce ceiling" numerator)
```
Defaults: `x1=15, x2=65`. Offer `(20,65)` and `(25,65)` as toggles.

**Migration needed to hold OADR constant** — this is the killer computation for the product. Solve for the constant annual net inflow `m` (with a fixed age-sex profile vector `p[s][a]`, Σp = 1) such that `OADR(t+H; m·p) = OADR(t)`. It is monotone in `m`, so a **bisection on m over [0, 50×current WAP/H] converging to 1e-4 relative, ~40 iterations**, each iteration one H-year cohort-component run. For H=25 and 101 single ages × 2 sexes that is ~200k flops per run — trivially real-time in a Web Worker. This reproduces the UN "replacement migration" analysis and gives every country a headline number.

---

## 4. Gridded and subnational population

| Dataset | Vintage / epochs | Resolution | Format | License | Verified size |
|---|---|---|---|---|---|
| **GHS-POP R2023A** | 1975–2030, 5-yr steps (E2025, E2030 are projections) | 100 m & 1 km Mollweide (ESRI:54009); 3″ & 30″ WGS84 | GeoTIFF in ZIP | **CC BY 4.0** (verified in `copyright.txt`) | E2025 1 km: **323,340,844 B**; E2025 30″: **483,694,490 B** |
| **GHS-SMOD R2023A** (Degree of Urbanisation, DEGURBA/L2) | 1975–2030 | 1 km Mollweide | GeoTIFF ZIP | CC BY 4.0 | E2025 1 km V2-0: **29,624,748 B** |
| **GHS-AGE R2025A** (gridded age structure — new) | 2 files only, labelled `1975052020`, `1980102020` | 100 m & 1 km Mollweide | GeoTIFF ZIP | CC BY 4.0 | 1 km: **21,428,813 B**; 100 m: **661 MB** |
| **GHS-UCDB R2024A** (Urban Centre Database) | 2024 edition | polygon/point, per urban centre | GPKG | CC BY 4.0 | UNVERIFIED |
| **WorldPop Global2 R2025A** | **annual 2015–2030**, 242 countries | 100 m and 1 km | GeoTIFF per country-year | CC BY 4.0 | per-file, see REST API |
| **Kontur Population** | `20231101` (latest on HDX) | H3 r8 (~400 m edge) | GPKG gzip | **CC BY 4.0** | 400 m: **2,436,991,241 B**; 3 km 169 MB; 22 km 6 MB |
| **GPW v4.11** | 2000–2020, census-round 2010 | 30″ / 2.5′ / 15′ / 30′ | GeoTIFF/ASCII | CC BY 4.0 | download now behind **NASA Earthdata Login** |
| **Meta HRSL / HRPDM** | **no longer updated since 2024** | 30 m | GeoTIFF / CSV | CC BY 4.0 | via HDX + `s3://dataforgood-fb-data` |
| **LandScan Global 2024** | annual, ambient population | 30″ (~1 km) | GeoTIFF | CC BY 4.0, free via `landscan.ornl.gov` (registration) | UNVERIFIED |

### 4.1 GHSL URL grammar (verified by directory listing)
```
https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/
  GHS_POP_GLOBE_R2023A/GHS_POP_E{YYYY}_GLOBE_R2023A_{CRS}_{RES}/V1-0/
  GHS_POP_E{YYYY}_GLOBE_R2023A_{CRS}_{RES}_V1_0.zip
```
`YYYY ∈ {1975,1980,…,2025,2030}`; `{CRS}_{RES} ∈ {54009_100, 54009_1000, 4326_3ss, 4326_30ss}`.
SMOD substitutes `GHS_SMOD_GLOBE_R2023A` and `V2-0`/`V2_0`.
Also present in the same root: `GHS_BUILT_S/V/H_GLOBE_R2023A`, `GHS_POP_ARCTIC_R2025A`, `GHS_SMOD_ARCTIC_R2025A`, `GHS_UCDB_GLOBE_R2024A`, `GHS_COUNTRY_STATS_MT_GLOBE_R2024A`, `GHS_OBAT_GLOBE_R2024A` (building attributes), `GHS_WUP_*_GLOBE_R2025A` (World Urbanization Prospects support layers).

### 4.2 WorldPop REST API (verified; note `www.worldpop.org/rest` 301-redirects to `hub.worldpop.org/rest`)
```
GET https://hub.worldpop.org/rest/data                              → top-level categories
GET https://hub.worldpop.org/rest/data/pop                          → aliases
GET https://hub.worldpop.org/rest/data/pop/{alias}?iso3=ESP         → per-country file records
GET https://hub.worldpop.org/rest/data/age_structures/{alias}?iso3=  → age/sex grids
```
Verified live aliases: `G2_CN_POP_R25A_100m`, `G2_CN_POP_R25A_1km`, `G2_MOS_POP_R25A_1km` (global mosaics, one record per year 2015…2030, `iso3=WCD`), `G2_UC_POP_R24B_100m`, `G2_CN_POP_R24B_100m`, plus legacy `wpgp`, `wpgpunadj`, `cic2020_100m`. Age/sex: `G2_CN_Age_R24B_100m`, `G2_UC_Age_2024_100m`, `sapya1km` (school-age), `wcba2015` (women of childbearing age).
Response carries `data_file` (relative path), `doi`, `citation`, `date`, `popyear`. Verified example: `GIS/Population/Global_2015_2030/R2025A/2015/ESP/v1/1km_ua/constrained/esp_pop_2015_CN_1km_R2025A_UA_v1.tif`, DOI `10.5258/SOTON/WP00840`. **WorldPop itself labels R2025A an "alpha version … may change over the coming year" — surface that caveat in the UI.**

`G2_MOS_POP_R25A_1km` (global 1 km mosaic, annual 2015–2030, UN-adjusted, constrained) is the best single global raster for this product: it is annual, it extends 5 years past GHS-POP's projection epochs, and it is CC BY 4.0.

### 4.3 Web tiling strategy — concrete

**Two representations, not one.**

**(a) Choropleth / analytical layer → H3, not rasters.** Kontur Population is already H3 r8. Build parent aggregates offline with `h3-js@4.5.0` (`cellToParent`) and store one Parquet file per resolution:

| H3 res | Total cells | Populated cells (est.) | Raw @12 B/cell | Parquet+ZSTD (est.) | Use at zoom |
|---|---:|---:|---:|---:|---|
| r2 | 5,882 | ~3.5k | 42 KB | ~20 KB | z0–2 |
| r3 | 41,162 | ~24k | 288 KB | ~120 KB | z2–4 |
| r4 | 288,122 | ~150k | 1.8 MB | ~700 KB | z4–6 |
| r5 | 2,016,842 | ~900k | 11 MB | ~4 MB | z6–8 |
| r6 | 14,117,882 | ~5M | 60 MB | ~22 MB | z8–10, tiled by r2 parent |

Schema: `h3 UINT64, pop FLOAT32, iso3 DICT, adm1 DICT`. Read with `@loaders.gl/parquet@4.5.1` or DuckDB-WASM; render with `deck.gl@9.4.0` `H3HexagonLayer` (GPU-instanced, handles 1M hexes at 60fps on integrated graphics). Population counts are **additive under H3 parent aggregation** — this is exactly why H3 beats a quadtree of rasters for a "smart distribution" product: any allocation you compute at r5 rolls up exactly to country totals. Cell area varies ±~15% within a resolution, so **always render *density* = pop / `cellArea(h3, 'km2')`, never raw count**, or high-latitude cells will read as artificially empty.

**(b) Continuous surface layer → PMTiles raster.** Reproject `G2_MOS_POP_R25A_1km` (or GHS-POP 1 km) to EPSG:3857, encode population as fixed-point in RGB (`value = (R*65536 + G*256 + B) / 16` → 0–1,048,575 people/px at 1/16 precision, A=0 for nodata), tile z0–8 with `rio-tiler`/`gdal2tiles`, pack with `pmtiles@4.5.0` and serve as a single HTTP-range-read file from any static bucket. **Estimated PMTiles size z0–8 for a 1 km global surface: 180–320 MB — UNVERIFIED, measure it.** Decode in a deck.gl `BitmapLayer` fragment shader. Never ship GeoTIFF to the browser.

**(c) Temporal.** Store year as a separate Parquet column partition (`pop_2015 … pop_2030`) rather than separate files, so scrubbing a timeline is a column swap, not a fetch.

---

## 5. Administrative boundaries and the disputed-territory problem

| Source | Version | Coverage | License | Redistributable? |
|---|---|---|---|---|
| **Natural Earth** | 5.1.2 stable; `master` = `5.2.0-pre` | ADM0/1, 1:10m/50m/110m | **Public domain (CC0)** | **Yes, unconditionally** |
| **geoBoundaries `gbOpen`** | API `current`; site docs still cite 5.0.0 (2022-12-19) — treat the version string as stale, build date on returned records was Dec 2023 | ADM0–ADM4, 200+ entities | **CC BY 4.0** | **Yes, with attribution** |
| geoBoundaries `gbHumanitarian` | mirrors OCHA CODs | ADM0–4 | varies per source | case by case |
| geoBoundaries `gbAuthoritative` | mirrors UN SALB | ADM0–2 | **non-commercial only** | **No** |
| **GADM** | 4.1 | ADM0–5, finest detail | **"Redistribution or commercial use is not allowed without prior permission"** | **NO — do not ship** |
| **OSM boundaries** | live | ADM0–10 | **ODbL 1.0** (share-alike) | Yes, but ODbL infects derived DBs |
| **UN SALB** | rolling | ADM1–2, in-country verified | non-commercial | No |
| OCHA COD-AB (HDX) | per-country, rolling | ADM0–4 | mostly CC BY | mostly yes, check per dataset |

**geoBoundaries API (verified live):**
```
GET https://www.geoboundaries.org/api/current/gbOpen/{ISO3|ALL}/{ADM0|ADM1|ADM2|ADM3|ADM4}/
```
Returns JSON with `boundaryISO`, `boundaryYearRepresented`, `boundarySource`, `boundaryLicense`, `licenseSource`, `staticDownloadLink`, `gjDownloadURL`, `tjDownloadURL` (**TopoJSON — use this**), `simplifiedGeometryGeoJSON`, `admUnitCount`, `meanVertices`. `ALL/ADM0` returned 200 / 410,486 B of metadata. Per-record licences differ (France ADM1 = "Etalab Open License 2.0") — **store `boundaryLicense` per feature and render it in a provenance panel; do not assume CC BY 4.0 for every gbOpen feature.**

**CGAZ (Comprehensive Global Administrative Zones)** — the pre-joined global mosaic:
`https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/CGAZ/geoBoundariesCGAZ_ADM{0,1,2}.{geojson,gpkg,zip}`
Published sizes: ADM0 ~400 MB GeoJSON / ~150 MB GPKG; ADM1 ~350 MB / ~150 MB; ADM2 ~500 MB / ~250 MB. **CGAZ explicitly "removes disputed areas and replaces them with polygons following US Department of State definitions."** That is a political position. Ship CGAZ only as an *optional* worldview, never as the default.

**Verified Natural Earth ZIP sizes** (`https://naciscdn.org/naturalearth/{110m|50m|10m}/cultural/{name}.zip`):
`ne_110m_admin_0_countries` 214,976 B · `ne_50m_admin_0_countries` 799,734 B · `ne_10m_admin_0_map_units` 5,003,719 B · `ne_10m_admin_0_disputed_areas` 215,221 B · `ne_10m_admin_1_states_provinces` 14,909,524 B.

### 5.1 Disputed boundaries — the architecture that avoids taking a position

Do not "solve" this by picking a shapefile. Solve it by making worldview a first-class dimension.

1. **Base geometry = Natural Earth 5.1.2, CC0, de-facto administration.** NE ships `sovereignty`, `countries`, `map_units`, `map_subunits`, **`breakaway_disputed_areas`**, and per-POV boundary classification fields `fclass_iso`, `fclass_us`, `fclass_de`, `fclass_gb`, `fclass_ru`, `fclass_cn`, `fclass_in`, `fclass_il`, `fclass_pk`, `fclass_tr`, `fclass_br`, `fclass_ua`, `fclass_jp`, plus dedicated POV country files (`ne_10m_admin_0_countries_ind`, `…_pak`, `…_chn`, `…_isr`, `…_ukr`, `…_rus` etc.). Those `fclass_*` values (`Admin-0 country`, `Disputed`, `Indeterminate`, `Unrecognized`, `Lease`, `Breakaway`) are exactly a worldview switch.

2. **Implement a `worldview` setting** with values `UN` (default), `ISO`, `US`, `DE`, `CN`, `IN`, `RU`, `IL`, plus `DE_FACTO`. Boundary segments render by `fclass_{worldview}`: solid for `Admin-0 country`, **dashed grey** for `Disputed`/`Indeterminate`, **dotted** for lines of control.

3. **Decouple statistics from geometry.** Statistical entities are keyed by a stable internal code, not by a polygon. Provide an explicit crosswalk table so the numbers are correct regardless of which outline is drawn:

| Territory | Statistical key | WPP 2024 treatment | Boundary render (default `UN` worldview) |
|---|---|---|---|
| **Kosovo** | `XKX` (no ISO 3166-1) | reported within Serbia in WPP; separate series in Eurostat (`XK`) | dashed; label "Kosovo (UNSCR 1244)"; footnote "This designation is without prejudice to positions on status and is in line with UNSCR 1244 and the ICJ Opinion on the Kosovo declaration of independence." — the verbatim EU/UN formula |
| **Palestine** | `PSE` | separate WPP location "State of Palestine" | West Bank + Gaza drawn; boundary dashed; no line drawn across East Jerusalem |
| **Western Sahara** | `ESH` | separate WPP location | hatched fill, dashed boundary, label "Western Sahara (Non-Self-Governing Territory)" |
| **Crimea / Sevastopol** | `UA-43`, `UA-40` | WPP counts within Ukraine (`UKR`) | rendered inside Ukraine's outline under `UN`/`ISO`; `DE_FACTO` shows administration hatch. **Note explicitly that population figures for Crimea are estimates and post-2022 data for occupied oblasts are not reliable.** |
| **Taiwan** | `TWN` | separate WPP location "China, Taiwan Province of China" | dashed; label follows the chosen worldview's own string; under `UN` use the WPP label verbatim and cite it |
| **Jammu & Kashmir / Aksai Chin** | split `IND`/`PAK`/`CHN` per de-facto control | population in respective national totals | **dotted** Line of Control + Line of Actual Control; mandatory map note: "Dotted line represents approximately the Line of Control in Jammu and Kashmir agreed upon by India and Pakistan. The final status of Jammu and Kashmir has not yet been agreed upon by the parties." (UN's own wording) |
| Sudan / South Sudan (Abyei) | `SDN`/`SSD` | separate | dashed; note "Final boundary … has not yet been determined." |

4. **A persistent, non-dismissible map disclaimer**, UN wording: *"The boundaries and names shown and the designations used on this map do not imply official endorsement or acceptance."*

5. **Never join a statistic to a polygon whose worldview differs from the statistic's source worldview.** Enforce in the data layer: every geometry row carries `worldview`, every statistic row carries `source_worldview`; the join predicate requires equality or an explicit `allow_cross_worldview` flag that triggers a UI warning badge.

6. **Reference services if you want a UN-sanctioned basemap:** UN Geospatial "Clear Map" and "CartoTile" (vector tiles, MapLibre-compatible), at `un.org/geospatial/mapsgeo/webservices`. Exact tile URLs and terms are **UNVERIFIED** — fetch and confirm before wiring in.

---

## 6. Recommended bundle for a world-scale WebGL app, with byte budgets

**Design target: ≤ 12 MB on first paint, ≤ 60 MB after the user has explored for five minutes, everything else range-requested.**

### Tier 0 — bundled in the app, loads before first frame (**~2.1 MB**)
| Asset | Source | Budget |
|---|---:|---:|
| ADM0 outlines, TopoJSON quantized 1e5, from `ne_110m_admin_0_countries` (CC0) | Natural Earth 5.1.2 | 260 KB |
| `ne_10m_admin_0_disputed_areas` → TopoJSON, simplified | Natural Earth | 90 KB |
| Worldview `fclass_*` lookup + disputed-territory crosswalk JSON | hand-built | 20 KB |
| WPP 2024 country panel: 237 countries × 76 years (2025–2100) × {TPop, MedianAgePop, TFR, NetMigrations, CNMR, OADR, PSR, WAP}, Medium + Zero-migration, Float32 Parquet | `WPP2024_Demographic_Indicators_*.csv.gz`, pre-processed | 1.4 MB |
| H3 r2 + r3 population Parquet | Kontur `20231101` | 140 KB |
| ISO3↔LocID↔NUTS crosswalk | UN Data Portal `/locations`, Eurostat | 40 KB |
| Indicator dictionary + citations + license strings | `WPP2024_Demographic_Indicators_notes.csv`, GHSL/WorldPop copyright.txt | 60 KB |

### Tier 1 — lazy, on first zoom past z4 (**~14 MB**)
| Asset | Budget |
|---|---:|
| ADM0 from `ne_50m_admin_0_countries` TopoJSON | 700 KB |
| ADM1 global, geoBoundaries `gbOpen` TopoJSON via CGAZ ADM1 → tippecanoe → PMTiles z0–6 | ~9 MB (**UNVERIFIED — measure**) |
| H3 r4 population Parquet | 700 KB |
| GHS-SMOD E2025 1 km reclassified to 3 DEGURBA classes → PNG PMTiles z0–6 | ~3 MB (**UNVERIFIED**) |
| WPP full single-age pyramids for the ~20 countries in view, Parquet column slices | ~500 KB |

### Tier 2 — range-requested only, never fully downloaded
| Asset | On-server size |
|---|---:|
| Population raster PMTiles z0–8 from `G2_MOS_POP_R25A_1km` | 180–320 MB (**UNVERIFIED**) |
| H3 r5 Parquet (global) | ~4 MB |
| H3 r6 Parquet, partitioned by r2 parent (≈5.9k files) | ~22 MB total, ~4 KB/tile |
| EUROPOP2025 NUTS-3 (`proj_25rp5`, `proj_25rdbal`) per-country Parquet | ~25 MB total |
| WPP single-age × sex × 7 variants, full | ~210 MB as Parquet (from 272 MB of source gz) |

### Preprocessing pipeline (run offline, commit outputs to object storage)
1. `curl` the nine WPP CSVs → DuckDB → filter `LocTypeName='Country/Area'` → pivot → Parquet/ZSTD.
2. Eurostat JSON-stat 2.0 → flatten → Parquet, one file per `proj_25*` dataset.
3. Kontur GPKG (2.4 GB) → `ogr2ogr` → DuckDB spatial → `h3_cell_to_parent` roll-ups r7…r2 → Parquet per resolution.
4. WorldPop `G2_MOS_POP_R25A_1km` per year → `gdalwarp -t_srs EPSG:3857` → RGB fixed-point encode → `gdal2tiles`/`rio-mbtiles` → `pmtiles convert`.
5. Natural Earth ZIPs → `mapshaper -simplify visvalingam 8% keep-shapes -o format=topojson quantization=1e5`.
6. geoBoundaries: iterate `api/current/gbOpen/ALL/ADM1/`, fetch each `tjDownloadURL`, **record `boundaryLicense` per feature**, merge, `tippecanoe -z6 --drop-densest-as-needed` → PMTiles.

### Library pins (verified on npm, 2026-09-18)
`deck.gl@9.4.0` (MIT) · `maplibre-gl@6.10.0` (BSD-3-Clause) · `h3-js@4.5.0` (Apache-2.0) · `pmtiles@4.5.0` (BSD-3-Clause) · `@loaders.gl/parquet@4.5.1` (MIT). All license-compatible with an Apache-2.0 or MIT open-source release.

---

## 7. Hard constraints the build must respect

- **GADM cannot be shipped.** Any PR that adds a GADM file to the repo or to the CDN is a licence violation. Same for `gbAuthoritative`/UN SALB.
- **OSM boundaries are ODbL.** Using them to derive the produced database triggers share-alike on that database. Keep OSM out of the MVP data plane.
- GHS-POP E2025 and E2030 are **projections, not observations** — label them in the UI. WorldPop R2025A 2026–2030 likewise, and WorldPop self-labels R2025A "alpha".
- GPW v4.11 now sits behind **NASA Earthdata Login**; it is also anchored on the 2010 census round. Use it only as a validation cross-check, not a primary layer.
- **Meta HRSL is frozen (no updates since 2024).** Use only for the countries where its 30 m detail is genuinely needed; never as a global layer.
- "Real-time migration" does not exist as an open global dataset. Migration *stocks* are annual/5-yearly (UN DESA International Migrant Stock), *flows* are annual and partial (OECD, Eurostat `migr_imm*`), and the only sub-annual global series are UNHCR/IOM displacement feeds. **Label the demographic layer "latest available vintage: {YYYY}" and reserve the word "live" for the displacement feeds only.**
