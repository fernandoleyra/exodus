All endpoints below were called live on **2026-09-18** unless marked UNVERIFIED. Response evidence is quoted.

## 1. The core honesty problem

"Real-time migration monitoring" does not exist as a data product. **Nobody publishes a live feed of people crossing borders.** What exists is:

- **Truly streaming (minutes):** hazard and news-event signals — earthquakes, disaster alerts, media-coded conflict events.
- **Daily/near-real-time (T+1 to T+7):** displacement *event* reports (IDMC IDU), humanitarian situation reports.
- **Monthly/quarterly, bot-protected:** border-crossing counters (Frontex, US CBP) — published as PDF/XLSX press artifacts, not APIs.
- **Annual with 6–18 month lag:** the actual migration stocks and flows everyone wants (UN DESA, UNHCR, World Bank, OECD, ILO).
- **Modelled:** everything the "calculator" outputs.

The MVP must make this distinction a **first-class visual primitive**, not a footnote. Mixing a 15-minute GDELT signal with a 2024 migrant-stock estimate on the same globe without visual differentiation is the product's central failure mode.

## 2. Verified source register

### 2a. Genuinely live (sub-hour to hourly)

| Source | Exact endpoint | Verified cadence / latency | Auth | License |
|---|---|---|---|---|
| **GDELT 2.0 Events/Mentions/GKG** | `https://data.gdeltproject.org/gdeltv2/lastupdate.txt` → returns 3 lines (export/mentions/gkg `.CSV.zip`). Master list: `https://data.gdeltproject.org/gdeltv2/masterfilelist.txt`. Translingual: `lastupdate-translation.txt` | **15 min.** Verified: returned batch `20260918160000` (i.e. 16:00 UTC today). GKG zip ≈ 6.4 MB/batch, export ≈ 93 KB | None | **Verbatim from gdeltproject.org/about.html:** "all datasets released by the GDELT Project are available for unlimited and unrestricted use for any academic, commercial, or governmental use of any kind without fee." Cleanest license in the whole stack |
| **EMSC seismic (FDSN-WS)** | `https://www.seismicportal.eu/fdsnws/event/1/query?limit=N&format=json&orderby=time` | **~2 min.** Verified: event `20260918_0000241`, `time: 2026-09-18T15:55:01Z`, `lastupdate: 2026-09-18T15:57:52Z` — called at ~16:0x UTC. Also offers a WebSocket push service (`www.seismicportal.eu/standing_order/websocket` — UNVERIFIED path) | None | ODbL/attribution — exact string UNVERIFIED |
| **USGS earthquakes** | `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/{significant,4.5,2.5,all}_{hour,day,week,month}.geojson` | **1–5 min.** Verified `significant_week.geojson`, `api: "2.7.0"` | None | US Gov public domain |
| **GDACS** | JSON: `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD` (GeoJSON FeatureCollection, verified 13.3 KB for 8-day window). RSS: `https://www.gdacs.org/xml/rss.xml`. Polygons: `https://www.gdacs.org/gdacsapi/api/polygons/getgeometry?eventtype={FL,EQ,TC,DR,VO,WF}&eventid=&episodeid=` | **~15–60 min.** Verified RSS `pubDate: Fri, 18 Sep 2026 15:55:01 GMT` | None | Free reuse w/ attribution (JRC) — exact string UNVERIFIED |

### 2b. Near-real-time (daily)

| Source | Endpoint | Verified latency | Auth | License — **READ THIS** |
|---|---|---|---|---|
| **IDMC IDU** (Internal Displacement Updates) | `https://helix-tools-api.idmcdb.org/external-api/idus/last-180-days/?client_id=KEY` — also `.../idus/all/`, `/idus/last-180-days-geojson/`, `/idus/all-geojson/`, `/idus/all/disaster/`, `/idus/references/` | **T+1.** Verified: 3,953 records returned, newest `displacement_date: "2026-09-17"`. Gzipped, 612 KB. Docs say "updated on a daily basis" | `client_id` query param, **required**. Public demo key `IDMCWSHSOLO009` returned HTTP 200. Production key: email `ch.datainfo@idmc.ch` | **CC BY-NC-SA 3.0 IGO** — verified from OpenAPI `info.license`. **NON-COMMERCIAL + SHARE-ALIKE.** This is a hard constraint: an "open-source Palantir" that bundles IDU cannot be commercially licensed, and derived works must be BY-NC-SA |

IDU record shape (verified, abbreviated): `id, country, iso3, latitude, longitude, centroid, role ("Recommended figure"|"Triangulation figure"), displacement_type ("Conflict"|"Disaster"), qualifier, figure, displacement_date, displacement_start_date, displacement_end_date, year, event_id, event_name, event_codes, type, subtype, standard_popup_text (HTML), sources, source_url, locations_name, locations_coordinates, locations_accuracy ("County/City/town/Village/Woreda (ADM3)")`.

**Critical ingest rule from IDMC docs (verbatim):** "Use the 'Recommended Figure' over 'Triangulation Figure' for the most accurate data" and "For spatial analysis, preprocess multi-location data to avoid double counting." Filter `role == "Recommended figure"` or you will double-count.

### 2c. The aggregator that unblocks the MVP: **HDX HAPI v2**

Verified version `0.9.14`. Base `https://hapi.humdata.org/api/v2/`. Auth = `app_identifier` query param, which is just **base64 of `"appname:email"`** (verified: `dGVzdDp0ZXN0QHRlc3QuY29t` = `test:test@test.com` returned HTTP 200). Self-service encoder at `/api/v2/encode_app_identifier`. Full OpenAPI at `https://hapi.humdata.org/openapi.json` (280 KB).

Verified endpoint list:

```
/affected-people/humanitarian-needs      /affected-people/idps
/affected-people/refugees-persons-of-concern  /affected-people/returnees
/climate/rainfall                        /coordination-context/conflict-events
/coordination-context/funding            /coordination-context/national-risk
/coordination-context/operational-presence
/food-security-nutrition-poverty/food-security
/food-security-nutrition-poverty/food-prices-market-monitor
/food-security-nutrition-poverty/poverty-rate
/geography-infrastructure/baseline-population
/metadata/{admin1,admin2,currency,data-availability,dataset,location,org,org-type,resource,sector,wfp-commodity,wfp-market}
```

Why this matters more than any other finding: **HAPI already normalises IOM DTM, UNHCR, ACLED-derived, and IPC data onto a common admin1/admin2 P-code grid with explicit `reference_period_start`/`reference_period_end` on every row.** Verified samples:

- `affected-people/idps`: `{location_code:"AFG", admin1_code:"AF01", admin2_code:"AF0101", admin_level:2, population:196303, reference_period_start:"2025-01-31", ...}` (IOM DTM source)
- `coordination-context/conflict-events`: `{event_type:"civilian_targeting", events:3, fatalities:0, reference_period_start:"2017-01-01", reference_period_end:"2017-01-31"}` — **monthly aggregate at admin2**, ACLED-derived but pre-aggregated
- `food-security-nutrition-poverty/food-security`: `{ipc_phase:"1", ipc_type:"current", population_in_phase:381227, population_fraction_in_phase:0.45, reference_period_start:"2025-09-01"}`
- `metadata/data-availability` carries **`hapi_updated_date`** (verified `"2026-09-07T01:33:17.350664"`) — use this directly as the `fetchedAt`/`publishedAt` field. HAPI has already solved half the provenance problem; do not reinvent it.

### 2d. Annual / lagged (the "calculator" substrate)

| Source | Endpoint | Latest vintage verified today | Auth | License |
|---|---|---|---|---|
| **UNHCR Refugee Statistics API** | `https://api.unhcr.org/population/v1/population/?yearFrom=&yearTo=&coo=&coa=&limit=` ; also `/asylum-applications/`, `/years/` | **2025** available. Verified global 2025: `refugees 28,461,306; asylum_seekers 8,998,097; idps 64,239,352; returned_refugees 4,362,272; stateless 4,477,220`. (2024: refugees 30,958,200; idps 68,131,711.) `/years/` returns 1951→present | **None** — no key needed | Free reuse w/ attribution |
| **World Bank WDI** | `https://api.worldbank.org/v2/country/all/indicator/SM.POP.TOTL?format=json&mrnev=1` | `date:"2024"`, `lastupdated:"2026-07-13"`. So migrant stock is **~2 years stale** | None | CC BY 4.0 |
| **HDX CKAN** | `https://data.humdata.org/api/3/action/package_search?q=&rows=` | Verified `success:true`, 1,190 hits for `q=migration`; per-dataset `license_id` (e.g. `cc-by`) and `metadata_modified` | None | Per-dataset |
| **ILOSTAT** | `https://rplumber.ilo.org/data/indicator/?id=&format=.json&lang=en` | HTTP 200 but empty body for `EAP_TEAP_SEX_AGE_NB_A` — **parameter form UNVERIFIED** | None | CC BY 4.0 |
| **UN DESA International Migrant Stock** | `un.org/development/desa/pd/content/international-migrant-stock` → **HTTP 403** (bot-protected). No API. Bulk XLSX only, manual download | — | — | Attribution |

## 3. Sources that are broken, blocked, or license-hostile — do not design around them

| Source | Verified status today | Consequence |
|---|---|---|
| **ReliefWeb API v1** | **HTTP 410 GONE.** Verbatim: `"The API version 'v1' has been decommissioned. Please use version 'v2' instead."` | Any tutorial/LLM memory using `api.reliefweb.int/v1/` is **dead**. Hard-fail the build if v1 appears |
| **ReliefWeb API v2** | `https://api.reliefweb.int/v2/{reports,disasters,sources}` returned **HTTP 403**: `"You are not using an approved appname."` Docs: "From 1 November 2025, API users will require a pre-approved appname." | Requires a human to register at `https://apidoc.reliefweb.int/parameters#appname`. Treat as **optional, key-gated**; never on the MVP critical path |
| **ACLED** | Base `https://acleddata.com/api/`, OAuth at `https://acleddata.com/oauth/token` (`grant_type=password, client_id=acled, scope=authenticated`), default 5,000 rows/request. **Terms: non-commercial only; "prohibited from providing, permitting, or allowing direct access to any of ACLED's original/raw data to any other user"; prohibited from building anything "similar to, or in competition with… any of ACLED's content, products, or platform."** | **Do not ship raw ACLED in an open dashboard.** It is both a redistribution breach and arguably a "competing platform" breach. Use HAPI's pre-aggregated `conflict-events` (admin2/month) or GDELT for the live conflict layer. Make ACLED a **user-supplied-key optional plugin** |
| **UNHCR Operational Data Portal** (`data.unhcr.org`) | Returns an **obfuscated JavaScript bot challenge**, not JSON | Not scrapeable. Use `api.unhcr.org` instead |
| **Frontex** | Migratory Map page → **HTTP 403**; `/we-know/migratory-situation-at-eu-external-borders/` → **404**. Data released as monthly press releases (e.g. "irregular border crossings down 35% in first eight months of 2026, nearly 75,000 detections"; sourced FRAN/JORA) | **Monthly, manual, no API.** Ship as a curated, hand-versioned CSV with explicit `vintage` |
| **US CBP** | `cbp.gov/document/stats/nationwide-encounters` → **HTTP 403** | Monthly XLSX/CSV, manual. Same treatment |
| **WFP HungerMap LIVE** | `api.hungermapdata.org/v2/*` → **503 / 404**; `/v1/foodsecurity/country` → **401 Unauthorized** | Public API is **not openly usable**. Use HAPI `food-security` (IPC) instead. A v3 endpoint at `b8m0cvbhz3.execute-api.eu-west-1.amazonaws.com/v3` is reported but **UNVERIFIED** |
| **NASA FIRMS** | `https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{VIIRS_SNPP_NRT}/world/1` → `Invalid MAP_KEY` (HTTP 400) with DEMO_KEY | Works, but needs a free registered MAP_KEY. Genuinely NRT (~3 h). Optional layer |
| **IOM DTM API** (`dtmapi.iom.int`) | Every probed path returned `{"statusCode":404,"message":"Resource not found"}` (`/api/IdpAdmin0Data/GetAdmin0Data`, `/api/Common/GetAllCountryList`, `/swagger/v1/swagger.json`) | **Exact path UNVERIFIED — do not hardcode.** Get DTM IDP figures via HAPI `/affected-people/idps` (verified working) |
| **Meta Data for Good — Movement Range Maps** | Discontinued; no updates after **2022-05-22** | Dead |
| **Google COVID-19 Community Mobility** | Stopped publishing **2022-10-15**; archive remains | Dead |
| **Meta Movement Distribution Maps** | Coverage reported **2024-05-01 → 2025-02-26**, HDX-hosted | Effectively frozen; historical only |
| **Flight / AIS** | OpenSky, ADS-B Exchange, AISStream exist but are **aircraft/vessel** telemetry, not people. Licenses are research-only or paid | **Explicitly out of scope for MVP.** A plane track is not a migrant. Using it as a "migration" signal is the kind of inference that discredits the whole product |

## 4. The freshness taxonomy — normative spec

Every datum entering the system is wrapped in this envelope. No exceptions, no nullable provenance.

```ts
type LatencyClass =
  | 'live'        // observedAt within 6h, source cadence <= 1h
  | 'daily'       // source cadence <= 24h, observedAt within 7d
  | 'periodic'    // monthly / quarterly official release
  | 'annual'      // annual official estimate, may be 6-24 months stale
  | 'modelled'    // computed by this system, never observed
  | 'projected';  // scenario output, counterfactual, no truth value

interface Datum<T> {
  value: T;
  observedAt:  string | null;  // ISO8601. When the phenomenon happened.
  publishedAt: string;         // ISO8601. When the source released it.
  fetchedAt:   string;         // ISO8601. When we pulled it.
  vintage:     string;         // "2025", "2026-08", "2026-09-18T16:00Z"
  latencyClass: LatencyClass;
  sourceId:    string;         // 'gdelt.v2.events', 'idmc.idu', 'hapi.idps'
  license:     string;         // SPDX-ish: 'CC-BY-4.0','CC-BY-NC-SA-3.0-IGO','public-domain','gdelt-unrestricted'
  commercialUse: boolean;      // derived from license; gates export
  geoPrecision: 'point'|'adm2'|'adm1'|'adm0'|'region';
  confidence:  number;         // 0..1
  isEstimate:  boolean;
  provenanceUrl: string;       // deep link to the source record
}
```

**Staleness and freshness.** Let `s = now − max(observedAt, publishedAt)` in seconds. Define per-class decay constant τ:

| class | τ (seconds) | τ as duration |
|---|---|---|
| live | 21 600 | 6 h |
| daily | 604 800 | 7 d |
| periodic | 7 776 000 | 90 d |
| annual | 63 072 000 | 730 d |

Freshness score `F = exp(−s / τ)`, `F ∈ (0,1]`. Displayed confidence `C_display = confidence × F`. A datum with `F < 0.05` is rendered **greyed and struck-through in tooltips** and is **excluded from any aggregate that drives a recommendation**. `modelled` and `projected` have no τ and never decay — they are stamped with the `vintage` of their **oldest input**, which is the honest bound.

**Propagation rule (non-negotiable):** any derived metric inherits the **worst** `latencyClass` and the **oldest** `vintage` of its inputs. A "workforce absorption capacity" figure computed from 2024 World Bank stock + 2026 GDELT events is an **`annual` / vintage 2024** figure, not a live one. Implement as a monotone lattice: `live < daily < periodic < annual < modelled < projected`, take the max.

## 5. UI semantics — how each class must render

| class | Globe encoding | Motion | Chrome | Timestamp label |
|---|---|---|---|---|
| **live** | Emissive point, full saturation, additive blend. `ScatterplotLayer` + pulse shader | Pulse ring, 1.2 s period, amplitude ∝ F | Solid 1px border; "LIVE" dot in legend | Relative: "4 min ago" |
| **daily** | Solid point, 70% opacity, no bloom | Single arrival pulse on ingest, then static | Solid border | "17 Sep · T+1" |
| **periodic** | Choropleth / extruded `ColumnLayer` on adm0 | None | Solid fill | "Aug 2026 · monthly" |
| **annual** | Flat choropleth, desaturated ramp, **4px diagonal hatch overlay** | **None, ever** | Dashed border | "2024 estimate" |
| **modelled** | Arcs/flows drawn as **dashed** `ArcLayer` (dash via `getDashArray`), reduced alpha | Slow directional flow only | Dashed border + ƒ glyph | "modelled from 2024–2025" |
| **projected** | Same as modelled but **hollow / outline-only**, distinct hue family | Scenario-scrub only | Dashed border + "SCENARIO" watermark **on the canvas, not just the panel** | "scenario · 2030" |

Hard UI rules:
1. **Animated motion is reserved for observed events.** If a particle moves on the globe, a human observed something. Modelled flows may only *flow*, never *pulse*; projections may not move at all outside scenario playback.
2. **A single global "AS OF" chip** in the top bar shows the *oldest* vintage contributing to the currently visible view — not the newest. The instinct to show the newest is the lie.
3. **Every tooltip ends with a provenance line**: source name → vintage → license → deep link. No exceptions.
4. **Colour never encodes freshness.** Colour encodes magnitude/type; freshness is encoded by *texture* (hatch), *border style* (solid/dashed) and *motion*. This keeps freshness readable for colour-blind users and survives the dark/light theme switch.
5. **A `live` layer and an `annual` layer must never be summed into one number.** If a user composes them, the UI emits an inline warning band, not a silent result.

## 6. The defensible "live" layer

Ship exactly one live layer, built from event signals, explicitly labelled **"Displacement Pressure Signals — not migration flows"**:

| Signal | Source | Cadence |
|---|---|---|
| Conflict/protest/violence events, geocoded, with tone | GDELT 2.0 Events (`EventRootCode` 14/17/18/19/20, `ActionGeo_Lat/Long`, `GoldsteinScale`, `AvgTone`) | 15 min |
| Disaster alerts w/ severity + polygon | GDACS (`eventtype`, `alertlevel`, polygon API) | 15–60 min |
| Seismic | EMSC ~2 min / USGS 1–5 min | minutes |
| New internal displacement reports | IDMC IDU (`role == "Recommended figure"`) | daily |
| Food insecurity phase | HAPI `food-security` (IPC) | per IPC release |

Composite **Displacement Pressure Index** per adm1, published as a modelled datum (never as "live"):

```
DPI(a, t) = w_c · Z(conflict_events_14d(a,t))
          + w_d · Z(gdacs_severity_30d(a,t))
          + w_f · Z(ipc_phase3plus_fraction(a))
          + w_i · Z(idu_new_displacements_30d(a,t))
```
`Z` = robust z-score using median and MAD over the trailing 24 months for that admin unit (MAD chosen over σ because these series are heavy-tailed and zero-inflated). Default `w_c=0.3, w_d=0.25, w_f=0.25, w_i=0.20`, **user-adjustable and displayed**. `latencyClass = 'modelled'`, `vintage` = oldest input vintage. **DPI is a pressure indicator, not a forecast of arrivals** — put that sentence in the tooltip.

## 7. Ingestion architecture

**Topology.** Sources → per-source *Connector* (pure fn: fetch → normalise → `Datum[]`) → *Normaliser* (P-code join via HAPI `metadata/admin1|admin2`) → Postgres/PostGIS + DuckDB columnar cache → *Event bus* → SSE fan-out → browser. Connectors are the only source-aware code; everything downstream sees only `Datum`. This is what makes it "cross-agnostic": adding a country's national statistics office = adding one file.

**Poll cadences (server-side; browsers never hit third-party APIs directly — CORS, keys, and rate limits all break):**

| Source | Poll | Conditional-request strategy |
|---|---|---|
| GDELT `lastupdate.txt` | **every 60 s**, act only when the batch timestamp changes (it advances every 15 min) | Compare returned MD5 + filename; the file is ~200 bytes, so 60 s polling is free |
| EMSC | 60 s (or WebSocket if available) | `orderby=time`, `limit`, dedupe on `properties.source_id` |
| USGS | 60 s | `If-Modified-Since`; `metadata.generated` as watermark |
| GDACS | 5 min | RSS `pubDate` watermark, then hydrate via JSON API |
| IDMC IDU | **6 h** (daily data; 4×/day is ample) | Full 180-day pull, upsert on `id`; the payload is only ~612 KB gzipped |
| HAPI | 24 h | `metadata/data-availability` → compare `hapi_updated_date` per category; only refetch changed subcategories |
| UNHCR / World Bank | 7 d | Vintage rarely changes |
| ReliefWeb v2 | 15 min, **only if an approved appname is configured**; otherwise the connector reports `status: 'unconfigured'` and the UI hides the layer rather than showing an error | |

**SSE, not WebSocket.** The data flow is server→client only, one-directional, text/JSON. SSE gives automatic reconnect with `Last-Event-ID`, survives proxies, needs no extra protocol layer, and works with HTTP caching. Use `text/event-stream` at `GET /api/stream?layers=gdelt,gdacs,emsc,idu&bbox=`. Reserve WebSocket for the *collaboration* layer (shared cursors, annotations) where it is genuinely bidirectional. Emit `id:` on every event = monotonic ingest sequence, so a reconnecting client replays only the gap.

**Backoff.** Exponential with full jitter: `delay = random(0, min(cap, base · 2^attempt))`, `base = 1 s`, `cap = 300 s`. Honour `Retry-After` when present. After 5 consecutive failures the connector enters `degraded`; the UI shows the layer with a **struck-through legend entry and its last-good `fetchedAt`** — it does not silently show stale data as current, and it does not disappear (disappearing layers make users think there is no conflict).

**Caching.** Three tiers: (1) raw source response on disk, content-addressed by SHA-256, TTL = 2× poll interval — this is also the replay corpus; (2) normalised `Datum[]` in Postgres, partitioned by `sourceId` + day; (3) tile/binary payloads for deck.gl as Arrow IPC or binary attribute arrays — **never JSON for >10k points**; `ScatterplotLayer` with `data: {length, attributes: {getPosition: {value: Float32Array, size: 3}}}` is roughly an order of magnitude faster to parse than GeoJSON.

**Rendering stack (npm versions verified 2026-09-18):** `deck.gl@9.4.0` (published 2026-09-05), `maplibre-gl@6.10.0` (published 2026-09-15), `@deck.gl/maplibre@9.4.0` — note `@deck.gl/maplibre` is the module that **replaces `@deck.gl/mapbox`** and speaks MapLibre 6; MapLibre's globe projection is supported in both interleaved and overlaid modes. Pin these exactly. Use MapLibre globe projection rather than deck.gl's experimental `GlobeView` for the basemap, with deck.gl layers interleaved.

## 8. Deterministic replay mode — required, not optional

Demos will be given on hotel wifi and APIs will rate-limit. Build this on day one, not as an afterthought.

- Every connector response is written to `./corpus/{sourceId}/{ISO8601}.{ext}` with a `manifest.json` recording `{sourceId, url, fetchedAt, sha256, httpStatus}`.
- `EXODUS_MODE=replay EXODUS_CLOCK=2026-09-18T16:00:00Z` makes all connectors read from the corpus and makes `now()` a single injected clock function. **No `Date.now()` anywhere outside the clock module** — enforce with an ESLint `no-restricted-globals` rule, because a stray `Date.now()` silently desynchronises replay and is very hard to debug.
- Replay is **frame-deterministic**: same corpus + same clock + same seed ⇒ byte-identical layer state. Seed every RNG (particle jitter, simulation sampling) from a single `EXODUS_SEED`.
- Ship a **90-day committed corpus** (~200 MB) in the repo or as a release asset so `git clone && npm run dev:replay` works offline with zero keys. This is also the CI fixture set and the golden-image test basis.
- The UI shows a **"REPLAY · 2026-09-18 16:00Z"** badge in replay mode. Never fake liveness.

## 9. Anti-patterns the coding agent must refuse

1. Inventing endpoints. If a path is not in this document as *verified*, the connector must be written as `status: 'unconfigured'` with a TODO — **not** a plausible guess.
2. `api.reliefweb.int/v1/` — decommissioned, returns 410.
3. Shipping raw ACLED events in the public bundle — license breach on two independent grounds.
4. Licensing the repo MIT/Apache while bundling IDMC IDU data — IDU is **CC BY-NC-SA 3.0 IGO**. Separate **code license** (MIT/Apache-2.0) from **data license** (per-source, enforced by the `license`/`commercialUse` fields, checked at export time).
5. Scraping `data.unhcr.org`, `frontex.europa.eu`, or `cbp.gov` — all return bot challenges or 403.
6. Animating annual estimates as if they were flows.
7. Labelling anything the system computes as "real-time".
