# Forced Displacement, Crisis & Near-Real-Time Signals — Verified Source Layer

All endpoints below were probed live on **2026-09-18** unless marked UNVERIFIED. HTTP status codes shown are actual observed responses from this environment.

---

## 1. UNHCR — Refugee Data Finder / Population Statistics API

**Base URL:** `https://api.unhcr.org/population/v1/`
**Docs:** `https://api.unhcr.org/docs/refugee-statistics.html` (OpenAPI 1.0.0)
**Auth: NONE.** Verified: `GET https://api.unhcr.org/population/v1/population/?limit=1&yearFrom=2024&yearTo=2024&coo_all=true` → `HTTP 200`, `application/json`, no key, no header.

### Verified endpoint paths
| Path | Content | Verified |
|---|---|---|
| `/population/` | End-year stock: REF, ASY, IDP, STA, OIP, OOC, HST by COO×COA×year | 200 |
| `/asylum-applications/` | New asylum applications (individual/group procedure) | listed |
| `/asylum-decisions/` | Recognized / rejected / otherwise closed | listed |
| `/demographics/` | Age-sex breakdowns (f_0_4 … m_60plus) | listed |
| `/solutions/` | Returns, resettlement, naturalisation | listed |
| `/idmc/` | IDMC conflict-IDP stock mirrored inside UNHCR API | **200** — `2023 → 67,332,380` |
| `/unrwa/` | Palestine refugees registered with UNRWA | **200** — `2024 → 5,914,401` |
| `/nowcasting/` | UNHCR's own forward estimates | **200** — returned `{"year":2026,"month":"July","refugees":28205732,"asylum_seekers":8919646}` |
| `/countries/`, `/regions/`, `/years/`, `/footnotes/` | Reference dimensions | listed |

### Parameters (all endpoints)
`limit` (int), `page` (int), `yearFrom`/`yearTo` (int), `year[]` (array), `coo`/`coa` (ISO3 or UNHCR code), `coo_all`/`coa_all` (bool — explode the dimension), `cf_type=ISO` (switch country codes to ISO3), `download=true` (CSV stream).

**Response envelope:** `{page, short-url, maxPages, total, items[]}`. `maxPages` drives pagination — do NOT assume a cursor.

**Cadence:** stock figures are **biannual** — mid-year statistics published ~October, end-year (Global Trends) published ~June. `/nowcasting/` is the only sub-monthly-ish surface and is currently **monthly** (July 2026 value live on 2026-09-18).
**Rate limits:** not published. Treat as ~1 req/s, cache aggressively; this is reference data, not a ticker.
**License:** UNHCR data is published under **CC BY 4.0** on the Refugee Data Finder / ODP (ODP API registration page explicitly states CC BY 4.0 International Public License). Redistribution permitted with attribution.

## 2. UNHCR Operational Data Portal (ODP)

**Portal:** `https://data.unhcr.org/` — situation views (Ukraine, Sudan, Afghanistan, Venezuela…), country views.
**API registration:** `https://data.unhcr.org/en/api/api-registration` — form-gated (focal point, email, org, project, URL). License stated on the registration page: **CC BY 4.0**.
**Geoservices:** `https://data.unhcr.org/en/geoservices/` (ArcGIS REST + GeoJSON layers).
**UNVERIFIED:** the exact ODP API base path and endpoint list are behind the registration form. Do **not** hardcode a guessed ODP path. Implement ODP as a pluggable adapter whose base URL is a config value supplied after registration.
**Cadence:** per-situation, ranging **daily** (active emergencies — Ukraine border crossings, Sudan) to weekly. This is the highest-frequency *official refugee count* source in the stack.

## 3. IOM DTM (Displacement Tracking Matrix)

**Developer portal:** `https://dtm-apim-portal.iom.int/` — register, subscribe to **API-V3**, retrieve Primary key from Profile.
**Current version: v3**, released **2025-08-22**. v3 adds displacement **drivers**, **sex**, and **broad origins** alongside IDP counts at admin0/1/2. v1 and v2 remain reachable but are **unmaintained**.
**Auth:** Azure APIM subscription key (header `Ocp-Apim-Subscription-Key`). **UNVERIFIED:** exact v3 route paths — they are behind the portal login. Official clients exist and encode the real routes: Python `dtmapi` (PyPI), R `dtmapi` (CRAN), repo `github.com/Displacement-Tracking-Matrix/dtmapi-R`. **Build the adapter against the `dtmapi` Python package rather than hand-rolling URLs.**
**Mirror without auth:** HDX dataset `global-iom-dtm-from-api` (`https://data.humdata.org/dataset/global-iom-dtm-from-api`) — same data, CSV, no key. Use this for MVP day-1.
**Cadence:** rounds, per-operation — some weekly, most monthly/quarterly, some annual. Never assume a fixed interval; read `roundNumber` + `reportingDate` per country.
**License:** DTM terms at `https://dtm.iom.int/terms-and-conditions`. Citation required: `International Organization for Migration (IOM). Accessed on [date]. DTM API.`

## 4. IDMC — IDU (live-ish) and GIDD (annual)

**Base:** `https://helix-tools-api.idmcdb.org/external-api/`
**Auth:** `client_id` query param. Verified behaviour: `?client_id=test` → `HTTP 403 {"detail":"Client is not registered."}`; a bogus path → `HTTP 404`. This confirms path validity independently of the key.

| Verified-valid path | Content |
|---|---|
| `/idus/last-180-days/?client_id=KEY` | **IDU** — preliminary new-displacement events, rolling 180 days, **updated daily** |
| `/gidd/disasters/disaster-export/?client_id=KEY` | GIDD disaster displacement export |
| `/gidd/displacements/displacement-export/?iso3__in=COD&start_year=2008&end_year=2022&client_id=KEY&release_environment=PRE_RELEASE` | GIDD stock+flow export |
| `/gidd/disaggregations/disaggregation-geojson/?client_id=KEY` | GeoJSON disaggregation |
| `/gidd/public-figure-analyses/?client_id=KEY` | Methodology, caveats, revision history — **read this to render provenance tooltips** |

**IDU record fields (codebook):** `id`, `iso3`, `country`, `latitude`, `longitude`, `centroid`, `displacement_type` (Conflict | Disaster | Development), `figure`, `displacement_date`, `displacement_start_date`, `displacement_end_date`, `event_name`, `standard_popup_text`, `sources`.
**Key access:** contact `ch.datainfo@idmc.ch` for an organizational `client_id`.
**Unauthenticated mirror:** HDX `preliminary-internal-displacement-updates` (returned 403 to this fetcher but is publicly downloadable via the HDX CKAN API).
**License:** IDMC data is CC BY (attribution to IDMC / NRC). GIDD is annual (Global Report on Internal Displacement, ~May).

## 5. GDELT 2.0 — the only true 15-minute feed

**Verified live:** `https://data.gdeltproject.org/gdeltv2/lastupdate.txt` returned, at fetch time:
```
102637  25802473880af7687bded88e9f586366  http://data.gdeltproject.org/gdeltv2/20260918154500.export.CSV.zip
149984  043feab91411c86f7be233239f845020  http://data.gdeltproject.org/gdeltv2/20260918154500.mentions.CSV.zip
6982259 b056ec744367d4d66ec07bf90ed71898  http://data.gdeltproject.org/gdeltv2/20260918154500.gkg.csv.zip
```
Timestamp `20260918154500` = **15-minute slot granularity, confirmed**. Format: `size  md5  url`, three lines (export / mentions / gkg).

| Asset | URL |
|---|---|
| Latest English slot | `https://data.gdeltproject.org/gdeltv2/lastupdate.txt` |
| Latest translingual (65 langs) | `https://data.gdeltproject.org/gdeltv2/lastupdate-translation.txt` (returned empty body in this environment — retry; treat as UNVERIFIED) |
| Full historical index | `https://data.gdeltproject.org/gdeltv2/masterfilelist.txt` → **HTTP 200** |
| DOC 2.0 query API | `https://api.gdeltproject.org/api/v2/doc/doc` |
| GEO 2.0 API | `https://api.gdeltproject.org/api/v2/geo/geo` |

**DOC API params:** `query` (phrases, `OR`, `-` negation, operators `domain:`, `sourcelang:`, `theme:`, `tone<`, `imagetag:`), `mode` = `artlist|artgallery|imagecollage|imagecollageinfo|timelinevol|timelinevolinfo|timelinevolraw|tonechart|wordcloud*`, `format` = `html|csv|json|jsonp|rss|rssarchive|jsonfeed`, `timespan` (default 3 months), `startdatetime`/`enddatetime` (`YYYYMMDDHHMMSS`), `maxrecords` (default 75, **max 250**), `sort`, `timelinesmooth` (≤30).
**Migration-relevant GKG themes:** `REFUGEES`, `DISPLACED`, `IMMIGRATION`, `MIGRATION`, `BORDER`, `HUMAN_TRAFFICKING`, `ASYLUM`, `CRISISLEX_*`, `TAX_ETHNICITY_*`. GKG columns of interest: `V2Themes`, `V2Locations` (with ADM1 + lat/lon), `V2Tone` (tone, positive, negative, polarity, ARD, SGRD), `V2.1Counts` (`REFUGEE#<n>#…`).
**Auth:** none. **Rate limits:** DOC API is soft-throttled and undocumented — keep ≥5 s between DOC calls; for the raw feed, poll `lastupdate.txt` on a **1-minute** timer and only download when the slot timestamp changes.
**License:** GDELT is stated as 100% free and open; GDELT 2.0 raw files carry no click-through licence. Attribute "The GDELT Project". Redistribution of derived aggregates: allowed.

## 6. ACLED

**Base:** `https://acleddata.com/api/` — primary route `https://acleddata.com/api/acled/read`; also `deleted` and `cast` (forecast) endpoints.
**OAuth 2 token endpoint:** `POST https://acleddata.com/oauth/token`
Body: `username=<email>`, `password=<pw>`, `grant_type=password`, `client_id=acled` (literal), `scope=authenticated` (literal).
Response: access token valid **24 h**, refresh token valid **14 days**. Refresh: same URL, `grant_type=refresh_token`, `client_id=acled`.
**Params:** `_format=json|csv|xml`, `country=Sudan|Chad` (pipe-delimited), `year=2025&year_where=BETWEEN`, `limit=` (**default and max page = 5000 rows**), `page=` (offset) or `cursor=` (**preferred** — standard offset pagination is being **deprecated 2026-10-01** for non-monadic exports), `fields=` (pipe-delimited column projection), `with_total=true`.
**Cadence: weekly**, published **Monday or Tuesday**, covering events through the **preceding Friday**, including retroactive corrections. Corrections mean you must **re-pull a trailing 60-day window each cycle**, not just append.
**License — CRITICAL BLOCKER:** ACLED's EULA (`https://acleddata.com/eula`) + Content Usage Terms (`https://acleddata.com/contentusage`) prohibit (a) creating "secondary products or effective substitutes" for ACLED, (b) monetising products built on ACLED data, and (c) **using ACLED data to train, test, develop, or improve any ML model, LLM, or AI system** where it creates a substitute or allows access to ACLED data. **An open-source public dashboard that re-serves ACLED events is very plausibly an "effective substitute."** → In the MVP, ACLED must be a **user-keyed, client-side-only adapter**: the user supplies their own credentials, data is fetched to their browser/their server, and the project ships **no ACLED-derived cache and no redistributed ACLED records**. Default OFF.

## 7. UCDP GED

**Base:** `https://ucdpapi.pcr.uu.se/api/<resource>/<version>` — resource for GED is `gedevents`.
Example: `https://ucdpapi.pcr.uu.se/api/gedevents/25.1?pagesize=1000&page=0&StartDate=2024-01-01`
**Versions:** GED **25.1** = final, global, **1989-01-01 → 2024-12-31**. GED **Candidate** releases follow `YY.0.M` for monthly (e.g. `26.0.7`) and a quarterly form; per search, latest final is **26.1** — *treat 26.1 as UNVERIFIED, resolve at build time by probing `/api/gedevents/26.1`.*
**Auth:** **UNVERIFIED but likely required** — a 2025 change reportedly requires a token on every API call, obtained by emailing the UCDP API maintainer (3–5 working day turnaround). Build the adapter with an optional bearer/token parameter and fail gracefully.
**Key fields:** `id`, `year`, `type_of_violence` (1 state-based, 2 non-state, 3 one-sided), `conflict_new_id`, `side_a`, `side_b`, `latitude`, `longitude`, `where_prec`, `date_prec`, `date_start`, `date_end`, `deaths_a`, `deaths_b`, `deaths_civilians`, `deaths_unknown`, `best`, `high`, `low`.
**Cadence:** GED final = **annual**; GED Candidate = **monthly**. **Latency ~30–45 days** from event to record.
**License:** **CC BY 4.0** — redistribution permitted with attribution. UCDP is the licensing-safe conflict backbone; use it, not ACLED, as the MVP's default conflict layer.

## 8. ReliefWeb API v2

**Base:** `https://api.reliefweb.int/v2/` — paths `/reports`, `/disasters`, `/jobs`, `/training`, `/sources`, `/countries`, `/{type}/{id}`.
**Auth:** no key, but a **pre-approved `appname` is mandatory since 2025-11-01**. Verified: `GET https://api.reliefweb.int/v2/disasters?appname=exodus-test&limit=1` → `HTTP 403 AccessDeniedHttpException` — *"You are not using an approved appname. Kindly request an appname from ReliefWeb here: https://apidoc.reliefweb.int/parameters#appname"*. **v1 is decommissioned** — verified `https://api.reliefweb.int/v1/reports` → **`HTTP 410 Gone`**.
→ **Action for the build agent: register an appname before writing the adapter; the adapter must surface a clear "unregistered appname" error state, not a blank panel.**
**Rate limits (hard, published):** **max 1,000 entries per call**, **max 1,000 calls per day**. At 1,000 calls/day a polling loop can run at most every ~86 s. Budget it.
**Query syntax:** GET with `filter[field]=`, `query[value]=`, `fields[include][]=`, `sort[]=date:desc`, `limit=`, `offset=`; POST accepts a JSON body with the same structure (`appname` stays in the URL).
**License:** ReliefWeb's own metadata is **CC BY 4.0**; attached report bodies may carry third-party copyright — link out, never rehost full texts.

## 9. HDX + HAPI (Humanitarian API) — the aggregation shortcut

**Base:** `https://hapi.humdata.org/api/v2/` — **OpenAPI verified live**, `version 0.9.14`, spec at `https://hapi.humdata.org/openapi.json`.
**Auth:** `app_identifier` on every query, as query param **or** header `X-HDX-HAPI-APP-IDENTIFIER`. It is simply **base64 of `appname:email`**; mint it at `GET /api/v2/encode_app_identifier`. No account needed.
**Limits:** default max **10,000 records** per query if `limit` omitted; `limit`/`offset` pagination on all endpoints. `output_format=json|csv`. String filters are implicit wildcards and case-insensitive (`location_name=Mali` also matches Somalia — **always filter on `location_code` ISO3, never `location_name`**).

**Full verified endpoint list:**
```
/api/v2/encode_app_identifier
/api/v2/affected-people/refugees-persons-of-concern
/api/v2/affected-people/humanitarian-needs
/api/v2/affected-people/idps
/api/v2/affected-people/returnees
/api/v2/coordination-context/operational-presence
/api/v2/coordination-context/funding
/api/v2/coordination-context/conflict-events
/api/v2/coordination-context/national-risk
/api/v2/food-security-nutrition-poverty/food-security
/api/v2/food-security-nutrition-poverty/food-prices-market-monitor
/api/v2/food-security-nutrition-poverty/poverty-rate
/api/v2/geography-infrastructure/baseline-population
/api/v2/climate/rainfall
/api/v2/metadata/{dataset|resource|location|admin1|admin2|currency|org|org-type|sector|wfp-commodity|wfp-market|data-availability}
/api/v2/util/version
```
**This is the single highest-leverage source in the assignment.** It normalises UNHCR, IOM DTM, IDMC, IPC, ACLED-derived conflict events, INFORM risk, and WorldPop baseline population onto one admin1/admin2 p-code grid. **Build the MVP's country/admin panel on HAPI first**, then add per-source adapters for freshness.
**Cadence:** per-source, HAPI refreshes as upstream HDX datasets update (daily crawl). **Beta** — pin `openapi.json` version and diff on CI.
**License:** governed by HDX HAPI Terms of Use (`https://data.humdata.org/hapi/terms`); underlying datasets carry their own licences, exposed via `/metadata/dataset`. **Render the per-dataset licence in the UI** — do not assume CC BY across the board.

## 10. GDACS

**Event list (GeoJSON):** `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD`
**Verified live:** `HTTP 200`, `application/json`, returns `{"type":"FeatureCollection","features":[…]}`. Sample feature properties observed: `eventtype:"FL"`, `eventid:1104121`, `episodeid:14`, `glide:"FL-2026-000165-IND"`, `name:"Flood in India"`, `htmldescription`, `icon`, `iconoverall` (alert colour encoded in the icon path: Green/Orange/Red).
**Single event:** `https://www.gdacs.org/gdacsapi/api/events/geteventdata?eventtype=FL&eventid=<id>`
Also: default latest-100 (last 4 days) endpoints; GeoRSS feed; CAP 1.2 alerts; formats `xml|geojson|shp`.
**Event types:** `EQ`, `TC`, `FL`, `VO`, `WF`, `DR`. **Alert levels:** Green / Orange / Red — drive the map's alert ramp directly off `iconoverall`.
**Auth:** none. **Rate limits:** unpublished; poll every 5 minutes.
**Latency:** **minutes** for EQ (auto from seismic feeds), tens of minutes to hours for TC/FL. After GDELT this is the freshest thing in the stack.
**License:** GDACS is a JRC/UN joint product, openly reusable with attribution.

## 11. Copernicus EMS Rapid Mapping

**Activations JSON (verified live, `HTTP 200`):** `https://rapidmapping.emergency.copernicus.eu/backend/dashboard-api/public-activations-info/`
**RSS discovery feed:** `https://mapping.emergency.copernicus.eu/latest/feed/` — yields new `EMSR###` activation codes.
**Risk & Recovery search:** `https://riskandrecovery.emergency.copernicus.eu/search/`
**Harvesting guide:** `https://mapping.emergency.copernicus.eu/about/how-to-harvest-cems-mapping-data/`
**Auth:** none for public activations. **Latency:** activation posted within hours; delineation/grading products **6 h–3 days** after activation.
**License:** Copernicus data — **free, full and open** (Regulation (EU) No 377/2014), redistribution allowed with attribution "© European Union, Copernicus Emergency Management Service".
**Use:** overlay flood/fire/earthquake AOI polygons under the displacement layer; gives spatial ground truth GDELT and GDACS cannot.

## 12. Food security: IPC/CH, FEWS NET, WFP HungerMap

**IPC/CH:** docs `https://docs.api.ipcinfo.org/` (Public API v2.0), base `https://api.ipcinfo.org/`. Endpoints: `country`, `areas`, `points`, `analyses`, `population` — each in *simplified* and *advanced* variants. **Key required** via request form at `https://www.ipcinfo.org/ipc-country-analysis/api/`; terms at `.../api/terms-of-use/en/`. Content = IPC Acute Food Insecurity phases 1–5 per analysis unit (admin area, urban area, **IDP camp**, HFA-receiving area). **Cadence: per-analysis, roughly quarterly per country, no fixed global date.** R reference implementation: CRAN `ripc`.
**FEWS NET Data Warehouse:** `https://fdw.fews.net/` with interactive REST docs; key endpoint **`IPCClassification`** (filter `show_ipc_only` to restrict to main Data Series). Auth: session or **token**; unauthenticated calls succeed but return **public data only**. Help: `https://help.fews.net/fdw/fews-net-api`. Cadence: periodic "Data Sprints" + monthly-ish scenario updates.
**WFP HungerMap LIVE:** `https://api.hungermapdata.org/v2/adm0/{adm0_code}/countryData.json` and `.../adm1data.json`. **Probe result 2026-09-18: `HTTP 503 {"message":"Service Unavailable"}` on v2; `HTTP 401 {"message":"Unauthorized"}` on `/v1/foodsecurity/country/{ISO3}`.** → **The public v2 JSON is NOT reliably open right now.** Treat HungerMap as **degraded/auth-gated**: implement the adapter, ship it disabled, and fall back to HAPI `/food-security-nutrition-poverty/food-security`. Fields when available: `adm0_code`, `population` (millions), FCS, `fcsMinus1`/`fcsMinus3`, rCSI, import-dependency %, trend graphs. Cadence when live: **daily** predictive nowcast across 90+ countries. Docs mirror: `https://docs-wfp-hungermap.netlify.app/`.

## 13. EM-DAT

**Portal:** `https://public.emdat.be/` — registration required. Docs `https://doc.emdat.be/`.
**Access:** free for **non-commercial use only**; commercial requires paid annual subscription. Download is **.xlsx flat table** via the "Access Data" tab. Archive on UCLouvain Dataverse under **CC BY-NC-ND**.
**No open REST API on the public tier** — **UNVERIFIED** whether an API endpoint exists for subscribers; do not fabricate one.
**Cadence:** rolling ingest, batch publication; disaster records typically appear **weeks to months** after the event.
**Licensing consequence:** **CC BY-NC-ND forbids both commercial use and distribution of derivatives.** An open dashboard that reshapes EM-DAT rows is a derivative. → **Exclude EM-DAT from the redistributable core.** Use GDACS + Copernicus EMS + IDMC GIDD-disaster for the same analytical job under clean licences.

## 14. Frontex

**No public API.** Verified: a plausible-looking route `https://www.frontex.europa.eu/assets/Migratory_routes/json/migratory_routes.json` → **`HTTP 404`**. Do **not** invent a Frontex endpoint.
**What exists:** the Migratory Map (`https://www.frontex.europa.eu/what-we-do/monitoring-and-risk-analysis/migratory-map/`) and monthly news releases carrying preliminary detections of illegal border-crossing (IBC) by route (Central Mediterranean, Eastern Mediterranean, Western Balkans, Western Mediterranean, Western African, Eastern Borders, Channel). Source systems: **FRAN** and **JORA**.
**Cadence: monthly, preliminary, revised retroactively.** Latest figures at time of research: **~75,000 detections Jan–Aug 2026, −35% YoY** (Frontex, Sept 2026).
**Integration plan:** scrape the map's XHR payload at build time OR maintain a small manually-curated monthly CSV in-repo with a `source_url` per row. Flag the layer "preliminary, route-level, revised monthly." **A detection ≠ a person** (double-counting across routes) — state this in the UI.

## 15. IOM Missing Migrants Project

**Downloads:** `https://missingmigrants.iom.int/downloads` (CSV). Data page `https://missingmigrants.iom.int/data`.
**License: CC BY 4.0** — free to share and adapt with attribution to "IOM's Missing Migrants Project" and indication of changes. Cleanest licence in the whole crisis stack.
**Cadence:** records added continuously, published in batches; incident-to-record latency days→weeks.
**Content:** incident-level records since 2014 — region, route, cause of death, number dead / missing / survivors, coordinates, source.
**Coverage caveat:** severe undercount, especially Sahara and Indian Ocean routes. Render as a **lower bound**, never a count.

## 16. UNRWA

No standalone public API found. **Use the UNHCR route:** `https://api.unhcr.org/population/v1/unrwa/` — verified `HTTP 200`, `2024 → 5,914,401` registered Palestine refugees. Annual cadence. For Gaza/West Bank operational situation reports, use ReliefWeb `/reports?filter[field]=source.name&…` filtered to source `UNRWA`.

---

## FRESHNESS RANKING — what can drive a genuinely LIVE ticker

**Tier A — true live, sub-hour (build the ticker on these three, nothing else):**
1. **GDELT 2.0** — **15 min**, verified. Event + Mentions + GKG. Poll `lastupdate.txt` every 60 s; ingest on timestamp change. This is the only feed that produces a visibly moving global signal.
2. **GDACS** — **minutes** (EQ) to low hours (TC/FL). GeoJSON, no auth, verified.
3. **ReliefWeb v2** — continuous editorial ingest, but the **1,000 calls/day** cap forces ≥86 s polling. Good for a headline crawl, not a per-second counter.

**Tier B — daily:**
4. **IDMC IDU** — daily refresh, 180-day rolling window. **The closest thing to a live *displacement* feed that exists.** Key-gated.
5. **UNHCR ODP** — daily in active emergencies (Ukraine, Sudan). Registration-gated.
6. **Copernicus EMS** — hours-to-days per activation; RSS-discoverable.
7. **WFP HungerMap** — daily nowcast *when reachable*; currently 503/401.

**Tier C — weekly to monthly:**
8. **ACLED** — weekly (Mon/Tue, through prior Friday) + retro corrections. Licence-encumbered.
9. **Frontex IBC** — monthly, preliminary, no API.
10. **UCDP GED Candidate** — monthly release, ~30–45 day event-to-record latency.
11. **HDX HAPI** — aggregate refresh follows upstream; effectively daily crawl over mostly monthly/annual sources.

**Tier D — episodic to annual (reference layer, never a ticker):**
12. **IPC/CH** and **FEWS NET** — per analysis cycle (~quarterly per country).
13. **IOM DTM** — per round; weekly in a few operations, otherwise monthly→annual.
14. **UNHCR RDF stock figures** — biannual (mid-year ~Oct, end-year ~June). `/nowcasting/` is the monthly exception.
15. **IDMC GIDD** — annual (~May). **EM-DAT** — batch, weeks-to-months. **Missing Migrants** — batched.

**Design consequence:** the "LIVE" chrome in the UI must be **bound to Tier A only**. Every other layer renders with an explicit `as-of` timestamp and a cadence badge. A dashboard that animates an annual UNHCR stock figure as if it were live is the single fastest way to destroy the product's credibility with the institutional audience it is aimed at.

---

## HARD PRIVACY CONSTRAINTS — never render at individual granularity

These are non-negotiable and must be enforced in the **data layer**, not the view layer:

1. **No individual records, ever.** Missing Migrants incident rows, DTM flow-monitoring survey responses, ACLED/UCDP event descriptions naming individuals, and ReliefWeb case narratives must not be rendered as person-level entities. Missing Migrants rows may be plotted as incidents **without** any narrative field, name, nationality-plus-location combination, or source link that identifies a named decedent.
2. **Minimum cell size: suppress any count < 25** at admin2 or finer for refugee/asylum-seeker/IDP populations. UNHCR itself applies asterisk-suppression (`*` = 1–4 persons) in Refugee Data Finder — **parse and honour `*`, never coerce it to 0 or 1.**
3. **No reverse-geocoding of displaced-population locations below admin2.** Do not render camp-level or settlement-level asylum-seeker counts on a zoomable globe; at high zoom, degrade to admin1 choropleth. Precise camp coordinates plus population plus nationality is a targeting dataset.
4. **Never cross-join** nationality × exact location × age-sex from `/demographics/` at subnational level. Any two of those three is acceptable; all three is re-identifying for small populations.
5. **UCDP `where_prec` and `date_prec` must gate rendering.** `where_prec` ≥ 4 (only admin2/country known) must not be drawn as a point at its nominal lat/lon — draw as an admin polygon or not at all. Same for IDU `latitude`/`longitude`, which are frequently centroids, not event locations.
6. **No predictive scoring of individuals or households.** Simulations operate on aggregate cohorts (≥1,000 persons per synthetic cohort). No "likelihood this person migrates" surface.
7. **No border-enforcement targeting affordances.** Do not ship route-level near-real-time crossing predictions at a spatial/temporal resolution usable for interception (finer than admin1 + monthly). Frontex IBC data stays at route × month.
8. **Vulnerable-group flags** (unaccompanied minors, LGBTQ+ asylum claims, trafficking victims, specific ethnic minorities) must not be rendered subnationally under any circumstance — national aggregate only, and only where the source already publishes it nationally.
9. **Provenance is mandatory on every rendered number:** source name, dataset id, `as-of` date, licence string, and a link to the source record. Implement as a shared `Provenance` type that every adapter must return; make it a compile-time requirement.

---

## LICENCE DECISION TABLE FOR THE MVP

| Source | Licence | Redistribute derived data? | MVP treatment |
|---|---|---|---|
| UNHCR RDF / ODP | CC BY 4.0 | **Yes** | Core, bundled, cached |
| UCDP GED | CC BY 4.0 | **Yes** | **Default conflict layer** |
| Missing Migrants | CC BY 4.0 | **Yes** (aggregated only) | Core |
| ReliefWeb v2 | CC BY 4.0 (metadata) | Yes, metadata; **link out for bodies** | Core, appname-gated |
| GDELT 2.0 | Open, attribution | **Yes** | Core, live tier |
| GDACS | Open (JRC/UN), attribution | **Yes** | Core, live tier |
| Copernicus EMS | Free, full & open (EU 377/2014) | **Yes** | Core |
| HDX HAPI | HAPI ToU + per-dataset | **Per-dataset — check `/metadata/dataset`** | Core, with per-layer licence surfaced |
| IDMC IDU/GIDD | CC BY, key-gated | Yes, with attribution | Core, key required |
| IOM DTM | IOM T&C, citation required | Yes with citation | Core via HDX mirror |
| IPC/CH | Key + ToU | Restricted | Adapter, key-gated |
| FEWS NET | Public tier open | Yes (public tier) | Adapter |
| **ACLED** | **EULA: no substitutes, no monetisation, no AI training** | **NO** | **BYO-key, client-side, no cache, default OFF** |
| **EM-DAT** | **CC BY-NC-ND** | **NO (no derivatives, no commercial)** | **EXCLUDE from core** |
| WFP HungerMap | Unclear; endpoint 503/401 | Unknown | Adapter, disabled |
| Frontex | EU public info, no API | Link + manual CSV | Manual layer, monthly |

---

## TWO DERIVED SIGNALS THE BUILD AGENT SHOULD IMPLEMENT

**Displacement Pressure Index (DPI)** — per origin country `c`, per week `t`, range 0–1:

```
DPI(c,t) = w1·Z(gdelt_theme_volume(c,t))     // GDELT GKG REFUGEES+DISPLACED+CONFLICT normalised article volume
         + w2·Z(ucdp_deaths_90d(c,t))        // UCDP GED best-estimate deaths, trailing 90 days, per 100k pop
         + w3·Z(idu_new_displacements_30d(c,t)) // IDMC IDU figure sum, trailing 30 days, per 100k pop
         + w4·Z(ipc_phase3plus_share(c))      // IPC/CH population in Phase 3+ / total pop
         + w5·Z(gdacs_alert_weight_30d(c,t))  // Σ over events: Red=3, Orange=2, Green=1, trailing 30 days
```
with `Z(x) = (x − μ_global,t) / σ_global,t` computed cross-sectionally per week (not per country time series, to avoid drift), clipped to [−3, 3] then min-max scaled to [0,1]. Default weights `w = [0.20, 0.25, 0.30, 0.15, 0.10]`, exposed as UI sliders. **Each term must carry its own freshness badge — DPI inherits the WORST cadence among contributing terms.**

**Data Freshness Score (DFS)** — shown on every panel, `DFS = exp(−Δt / τ_source)` where `Δt` = hours since `as_of`, `τ_source` = the source's nominal cadence in hours (GDELT 0.25, GDACS 1, IDU 24, ACLED 168, IPC 2160, UNHCR RDF 4380). Render as a decaying dot, green→amber→grey. This single component is what makes the dashboard read as honest rather than as theatre.
