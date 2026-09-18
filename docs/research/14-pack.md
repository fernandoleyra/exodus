# Forced Displacement, Crisis & Near-Real-Time Signals — Verified Source Layer

All endpoints below were probed live on **2026-09-18**. `[verified]` = observed in this session. `[UNVERIFIED]` = plausible but not confirmed against a retrievable source. HTTP status codes are actual observed responses.

---

## 1. UNHCR — Refugee Data Finder / Population Statistics API

**Base URL:** `https://api.unhcr.org/population/v1/` **[verified]**
**Docs:** `https://api.unhcr.org/docs/refugee-statistics.html` → HTTP 200, Swagger UI **[verified]**
**Auth: NONE** **[verified]** — `GET /population/?limit=1&yearFrom=2024&yearTo=2024&coo_all=true` → HTTP 200, `application/json`, no key, no header.

### Endpoint paths — all probed
| Path | Content | Status |
|---|---|---|
| `/population/` | End-year stock: refugees, asylum_seekers, returned_refugees, idps, returned_idps, stateless, ooc, oip, hst by COO×COA×year | **200** [verified] |
| `/asylum-applications/` | New asylum applications | **200** [verified] |
| `/asylum-decisions/` | Recognized / rejected / otherwise closed | listed in docs [UNVERIFIED] |
| `/demographics/` | Age-sex breakdowns | **200** [verified] |
| `/solutions/` | Returns, resettlement, naturalisation | **200** [verified] |
| `/idmc/` | IDMC conflict-IDP stock mirrored inside UNHCR API | **200** — `2023 → 67,332,380` [verified] |
| `/unrwa/` | Palestine refugees registered with UNRWA | **200** — `2024 → 5,914,401` [verified] |
| `/nowcasting/` | UNHCR forward estimates | **200** — `{"year":2026,"month":"July","refugees":28205732,"asylum_seekers":8919646}` [verified] |
| `/countries/`, `/regions/`, `/years/`, `/footnotes/` | Reference dimensions | listed in docs [UNVERIFIED] |

A bogus path (`/population/v1/notreal/`) returns **404** [verified] — so 200-vs-404 is a valid way to confirm any additional path before writing an adapter.

**Corrected field names.** `/demographics/` returns `f_0_4`, `f_5_11`, `f_12_17`, `f_18_59`, `f_60`, `f_other`, `f_total` and the `m_` equivalents [verified]. There is **no** `m_60plus` field. Note the bucket boundaries are 0-4 / 5-11 / 12-17 / 18-59 / 60+ — do not assume standard 5-year bands.

`/idmc/`, `/unrwa/` and `/nowcasting/` return a flat `{year, total}` shape with the COO/COA dimensions stubbed to `"-"` [verified]. Do not write a generic parser that expects `refugees`/`idps` columns across all endpoints.

### Parameters
`limit` (int), `page` (int), `yearFrom`/`yearTo` (int), `year` (int, single-value form verified working), `coo`/`coa` (ISO3 or UNHCR code), `coo_all`/`coa_all` (bool — explode the dimension), `cf_type=ISO`, `download=true` (CSV stream). **[partially verified]** — `limit`, `year`, `yearFrom`/`yearTo`, `coo_all` confirmed live; the rest are from the docs page.

**Response envelope:** `{page, short-url, maxPages, total, items[]}` **[verified]**. `maxPages` drives pagination — there is no cursor. Note `total` was observed as an empty array `[]` on every call, so **do not rely on `total` for a record count**; use `maxPages` × `limit`.

**Cadence:** stock figures are **biannual** — mid-year statistics ~October, end-year (Global Trends) ~June [UNVERIFIED — the unhcr.org statistics page returned 403 to this fetcher]. `/nowcasting/` is monthly and was live with a July 2026 value on 2026-09-18 [verified].
**Rate limits:** not published. ~20 sequential requests in this session drew no throttling. Treat ~1 req/s as an **operational guess, not a documented figure**; cache aggressively — this is reference data, not a ticker.
**License:** **CC BY 4.0 [verified for ODP only]** — the ODP API registration page explicitly states "Creative Commons Attribution 4.0 International Public License". The Population API docs page states **no data licence at all** (its only licence strings are bundled MIT/Apache JS libraries) [verified]. So: CC BY 4.0 is confirmed for ODP and **inferred** for `api.unhcr.org/population` [UNVERIFIED]. Attribute and, for a public deployment, confirm in writing with UNHCR.

## 2. UNHCR Operational Data Portal (ODP)

**Portal:** `https://data.unhcr.org/` — situation views (Ukraine, Sudan, Afghanistan, Venezuela…), country views.
**API registration:** `https://data.unhcr.org/en/api/api-registration` → HTTP 200, form-gated (focal point, email, org, project, URL) [verified]. Licence stated on that page: **CC BY 4.0 International Public License** [verified].
**Geoservices:** `https://data.unhcr.org/en/geoservices/` (ArcGIS REST + GeoJSON layers) [UNVERIFIED].
**[UNVERIFIED]:** the exact ODP API base path and endpoint list are behind the registration form. Do **not** hardcode a guessed ODP path. Implement ODP as a pluggable adapter whose base URL is a config value supplied after registration.
**Cadence:** per-situation, **daily** in active emergencies to weekly [UNVERIFIED]. If it holds, this is the highest-frequency *official refugee count* source in the stack.

## 3. IOM DTM (Displacement Tracking Matrix) — routes now VERIFIED

This section was the weakest in the original pack and is now resolved. The routes were extracted from the official `dtmapi` 0.1.8 wheel and confirmed live.

**API base host: `https://dtmapi.iom.int/`** **[verified]** — **not** `dtm-apim-portal.iom.int`, which is only the developer portal where you register and collect a subscription key.

| Verified route | Purpose |
|---|---|
| `https://dtmapi.iom.int/v3/displacement/admin0` | IDP counts at country level |
| `https://dtmapi.iom.int/v3/displacement/admin1` | admin1 |
| `https://dtmapi.iom.int/v3/displacement/admin2` | admin2 |
| `https://dtmapi.iom.int/v3/displacement/country-list` | country dimension |
| `https://dtmapi.iom.int/v3/displacement/operation-list` | operation dimension |

Legacy v2 (unmaintained, still routed): `https://dtmapi.iom.int/v2/{CountryList, OperationList, IdpAdmin0Data, IdpAdmin1Data, IdpAdmin2Data}` **[verified]**.

**Auth: header `Ocp-Apim-Subscription-Key`** **[verified]** — from `dtmapi/api.py` and confirmed by live probe:
- no key → `HTTP 401 {"statusCode":401,"message":"Access denied due to missing subscription key..."}`
- bad key → `HTTP 401 {"statusCode":401,"message":"Access denied due to invalid subscription key..."}`
- bogus path (`/v3/displacement/bogus`) → `HTTP 404 {"statusCode":404,"message":"Resource not found"}`

That 401-vs-404 split is what proves the five routes above are real. The package also reads the key from env var **`DTMAPI_SUBSCRIPTION_KEY`** [verified].

**Official clients:** Python `dtmapi` **0.1.8** on PyPI [verified], repo `github.com/Displacement-Tracking-Matrix/dtmapi`, docs `https://dtmapi.readthedocs.io/en/latest/` [verified from PyPI metadata]. An R client is referenced by the pack as `dtmapi-R` on CRAN — **[UNVERIFIED]**, not checked. Since the routes are now known you may hand-roll the HTTP calls; using the package is a convenience, no longer a necessity.

**v3 content:** adds displacement **drivers**, **sex**, and **broad origins** alongside IDP counts at admin0/1/2 [UNVERIFIED — from release notes, not observed, since responses are key-gated].
**Mirror without auth:** HDX dataset `global-iom-dtm-from-api` — `https://data.humdata.org/api/3/action/package_show?id=global-iom-dtm-from-api` → **HTTP 200** [verified]. Use this for MVP day-1; it needs no key.
**Cadence:** rounds, per-operation — some weekly, most monthly/quarterly, some annual. Never assume a fixed interval; read `roundNumber` + `reportingDate` per country [UNVERIFIED].
**License:** DTM terms at `https://dtm.iom.int/terms-and-conditions`. Citation required: `International Organization for Migration (IOM). Accessed on [date]. DTM API.` [UNVERIFIED].

## 4. IDMC — IDU (live-ish) and GIDD (annual)

**Base:** `https://helix-tools-api.idmcdb.org/external-api/` **[verified]**
**Auth:** `client_id` query param. Confirmed behaviour: `?client_id=test` → `HTTP 403 {"detail":"Client is not registered."}`; bogus path → `HTTP 404` [verified]. This 403-vs-404 split confirms path validity independently of holding a key, and it discriminates at full path depth — `/external-api/idus/not-a-real-window/` returns 404 while `/external-api/idus/last-180-days/` returns 403 [verified].

| Verified-valid path (403, i.e. exists) | Content |
|---|---|
| `/idus/last-180-days/?client_id=KEY` | **IDU** — preliminary new-displacement events, rolling 180 days, updated daily |
| `/idus/all/?client_id=KEY` | Full IDU series — **newly confirmed, not in the original pack** |
| `/gidd/disasters/disaster-export/?client_id=KEY` | GIDD disaster displacement export |
| `/gidd/displacements/displacement-export/?iso3__in=COD&start_year=2008&end_year=2022&client_id=KEY&release_environment=PRE_RELEASE` | GIDD stock+flow export |
| `/gidd/disaggregations/disaggregation-geojson/?client_id=KEY` | GeoJSON disaggregation |
| `/gidd/public-figure-analyses/?client_id=KEY` | Methodology, caveats, revision history — **read this to render provenance tooltips** |

**IDU record fields (codebook):** `id`, `iso3`, `country`, `latitude`, `longitude`, `centroid`, `displacement_type` (Conflict | Disaster | Development), `figure`, `displacement_date`, `displacement_start_date`, `displacement_end_date`, `event_name`, `standard_popup_text`, `sources`. [UNVERIFIED — key-gated, from codebook.]
**Key access:** contact `ch.datainfo@idmc.ch` for an organizational `client_id` [UNVERIFIED].
**Unauthenticated mirror:** HDX `preliminary-internal-displacement-updates` [UNVERIFIED].
**License:** IDMC data is CC BY (attribution to IDMC / NRC) **[UNVERIFIED]** — not confirmed against an IDMC page in this session. GIDD is annual (Global Report on Internal Displacement, ~May) [UNVERIFIED].

## 5. GDELT 2.0 — the only true 15-minute feed

**Verified live:** `https://data.gdeltproject.org/gdeltv2/lastupdate.txt` → HTTP 200:
```
69421   a9b368924fbaf1a0412f79d7ca3ac15e http://data.gdeltproject.org/gdeltv2/20260918163000.export.CSV.zip
109073  a9d348e9fdf1705ac61f551cf25f081b http://data.gdeltproject.org/gdeltv2/20260918163000.mentions.CSV.zip
5357335 8ac1cc8a1863c5c0718f131b3375e058 http://data.gdeltproject.org/gdeltv2/20260918163000.gkg.csv.zip
```
Timestamp `20260918163000` = **15-minute slot granularity, confirmed** [verified]. Format: `size  md5  url`, exactly three lines (export / mentions / gkg).

**The translingual feed WORKS** — the original pack's "empty body, treat as UNVERIFIED" was wrong. `https://data.gdeltproject.org/gdeltv2/lastupdate-translation.txt` → **HTTP 200** [verified]:
```
73764    ac7b889ceca32b6fb8a2fd0bdce8686c .../20260918161500.translation.export.CSV.zip
105406   8e808995e19d9dfe215114258ed1336a .../20260918161500.translation.mentions.CSV.zip
10607026 9a2dd948ef8d9e0e2e65ef4fe6cf8a43 .../20260918161500.translation.gkg.csv.zip
```
**New operational finding:** the translation feed lagged the English feed by one 15-minute slot (161500 vs 163000) at probe time [verified]. Track the two feeds' slot cursors **independently** — a single shared cursor will silently skip translingual slots.

| Asset | URL | Status |
|---|---|---|
| Latest English slot | `https://data.gdeltproject.org/gdeltv2/lastupdate.txt` | **200** [verified] |
| Latest translingual (65 langs) | `https://data.gdeltproject.org/gdeltv2/lastupdate-translation.txt` | **200** [verified] |
| Full historical index | `https://data.gdeltproject.org/gdeltv2/masterfilelist.txt` | **200**, ~128 MB, back to 20150218230000 [verified] |
| DOC 2.0 query API | `https://api.gdeltproject.org/api/v2/doc/doc` | [UNVERIFIED] |
| GEO 2.0 API | `https://api.gdeltproject.org/api/v2/geo/geo` | [UNVERIFIED] |

**masterfilelist.txt is ~128 MB** [verified] — stream and parse incrementally; do not load it into memory in a browser or a small container.

**DOC API params** [UNVERIFIED — from documentation, endpoint not probed]: `query` (phrases, `OR`, `-` negation, operators `domain:`, `sourcelang:`, `theme:`, `tone<`, `imagetag:`), `mode` = `artlist|artgallery|imagecollage|imagecollageinfo|timelinevol|timelinevolinfo|timelinevolraw|tonechart|wordcloud*`, `format` = `html|csv|json|jsonp|rss|rssarchive|jsonfeed`, `timespan` (default 3 months), `startdatetime`/`enddatetime` (`YYYYMMDDHHMMSS`), `maxrecords` (default 75, max 250), `sort`, `timelinesmooth` (≤30).
**Migration-relevant GKG themes** [UNVERIFIED]: `REFUGEES`, `DISPLACED`, `IMMIGRATION`, `MIGRATION`, `BORDER`, `HUMAN_TRAFFICKING`, `ASYLUM`, `CRISISLEX_*`, `TAX_ETHNICITY_*`. GKG columns of interest: `V2Themes`, `V2Locations` (ADM1 + lat/lon), `V2Tone`, `V2.1Counts` (`REFUGEE#<n>#…`). Validate theme strings against a downloaded GKG slot before shipping — theme vocabularies drift.
**Auth:** none [verified]. **Rate limits:** DOC API is soft-throttled and undocumented — keep ≥5 s between DOC calls; for the raw feed, poll `lastupdate.txt` on a **1-minute** timer and download only when the slot timestamp changes.
**License — now quotable [verified]** from `gdeltproject.org/about.html`: "all datasets released by the GDELT Project are available for unlimited and unrestricted use for any academic, commercial, or governmental use of any kind without fee." Redistribution is explicit: you may "redistribute, rehost, republish, and mirror any of the GDELT datasets in any form." Sole condition: "any use or redistribution of the data must include a citation to the GDELT Project and a link to this website (https://www.gdeltproject.org/)." No SPDX identifier; these are bespoke terms, but they are permissive and cover commercial use.

## 6. ACLED

**Base:** `https://acleddata.com/api/` — read route `https://acleddata.com/api/acled/read` [verified: returns `HTTP 403 {"message":"Access denied"}` unauthenticated, confirming the route exists and is auth-gated]. Also `deleted` and `cast` (forecast) endpoints [UNVERIFIED].
**OAuth 2 token endpoint:** `POST https://acleddata.com/oauth/token` **[verified]**
Body: `username=<email>`, `password=<pw>`, `grant_type=password`, `client_id=acled` (literal), `scope=authenticated` (literal). Probed with deliberately bad credentials → `HTTP 400 {"error":"invalid_grant","error_description":"The user credentials were incorrect."}` — an `invalid_grant` rather than `invalid_client` confirms the endpoint, the `client_id=acled` literal and the parameter shape are all correct [verified].
Access token **86400 s / 24 h**; refresh token **14 days**; refresh via same URL with `grant_type=refresh_token`, `client_id=acled` [verified from acleddata.com/api-documentation/getting-started].
**Params:** `_format=json|csv|xml`, `country=Sudan|Chad` (pipe-delimited), `year=2025&year_where=BETWEEN`, `limit=` (**default and max page = 5000 rows** [verified]), `fields=` (pipe-delimited column projection), `with_total=true`. Pagination parameter names beyond `limit` are [UNVERIFIED].
**Deleted from the original pack:** the claim that offset pagination is "deprecated 2026-10-01 for non-monadic exports". The ACLED pagination doc page 404s, and neither the getting-started guide nor the documentation hub mentions a deprecation date, a `cursor` parameter, or "monadic". Do not build a migration deadline into the roadmap on this basis — **read the current ACLED docs at implementation time**.
**Cadence: weekly**, published Monday or Tuesday, covering events through the preceding Friday, including retroactive corrections [UNVERIFIED]. If it holds, re-pull a trailing 60-day window each cycle rather than appending — but confirm the correction window against ACLED's own guidance.

**License — CRITICAL BLOCKER, now quoted verbatim [verified]** from `https://acleddata.com/contentusage`. Prohibited uses include:
- "To create or develop any dataset, product, or platform that competes with, or creates a functional substitute for, any of ACLED's content, products, or platforms."
- "To train, test, develop, or improve any machine learning (ML) models, large language models (LLMs), artificial intelligence (AI) systems, or similar technologies in any way that creates a substitute for ACLED, allows access to ACLED data, or violates our Terms & Conditions in any other way."
- "To provide services to or for any other person, entity, or organization without authorization."
- "To attribute any of your analysis or manipulation of ACLED's data to ACLED."

The terms state these restrictions apply **regardless of whether use is commercial, academic, or experimental** [verified]. An open-source public dashboard that re-serves ACLED events is squarely within "creates a functional substitute" — this is now a reading of quoted text, not a paraphrase.
→ In the MVP, ACLED must be a **user-keyed, client-side-only adapter**: the user supplies their own credentials, data is fetched to their browser/their server, the project ships **no ACLED-derived cache and no redistributed ACLED records**, and the UI must not attribute any derived analysis to ACLED. Default OFF.

## 7. UCDP GED

**Base:** `https://ucdpapi.pcr.uu.se/api/<resource>/<version>` — GED resource is `gedevents` [verified].
Example: `https://ucdpapi.pcr.uu.se/api/gedevents/26.1?pagesize=1000&page=0`

**Auth: REQUIRED — this is now confirmed, not a hedge. [verified]**
Every probed call returned:
```
HTTP 401
API token required. Add header: x-ucdp-access-token: <your-token>
```
The header name is exactly **`x-ucdp-access-token`** — not `Authorization: Bearer`, not a query parameter. Obtain a token by emailing the API maintainer (`mertcan.yilmaz@pcr.uu.se`) [verified from ucdp.uu.se/apidocs].

**Do not attempt build-time version probing.** The original pack instructed resolving the latest version by probing `/api/gedevents/26.1`. This **cannot work**: the 401 is returned before any version validation, so `/api/gedevents/99.9` also returns 401, not 404 [verified]. Version existence is undiscoverable without a token. Read the version from `ucdp.uu.se/apidocs` or make it a config value.

**Versions [verified from ucdp.uu.se/apidocs]:**
- **26.1** — current **final** global release.
- **25.1** — previous final, 1989-01-01 → 2024-12-31.
- Monthly candidate: `26.0.7` form. Quarterly candidate: **`26.01.26.06`** form (corrected — the original pack described only a vague "quarterly form").
- UCDP guarantees "each API call is guaranteed to return the same data at the same version indefinitely" — so pinning a version string is safe and reproducible.

**Key fields** [UNVERIFIED — token-gated, from codebook]: `id`, `year`, `type_of_violence` (1 state-based, 2 non-state, 3 one-sided), `conflict_new_id`, `side_a`, `side_b`, `latitude`, `longitude`, `where_prec`, `date_prec`, `date_start`, `date_end`, `deaths_a`, `deaths_b`, `deaths_civilians`, `deaths_unknown`, `best`, `high`, `low`.
**Cadence:** GED final = annual; GED Candidate = monthly. Latency ~30–45 days from event to record [UNVERIFIED].
**License: CC BY 4.0 [UNVERIFIED]** — widely stated and very likely correct, but **not confirmed against a UCDP page in this session**. This is the single most load-bearing licence claim in the document, because the whole architecture routes around ACLED specifically to land on UCDP. **Confirm it before committing the design**, and note that even if CC BY 4.0 holds for the dataset, API access is now token-gated, so UCDP is no longer a zero-friction default — budget for the 3–5 day token turnaround in the build plan.

## 8. ReliefWeb API v2

**Base:** `https://api.reliefweb.int/v2/` — paths `/reports`, `/disasters`, `/jobs`, `/training`, `/sources`, `/countries`, `/{type}/{id}`.
**Auth:** no key, but a **pre-approved `appname` is mandatory since 2025-11-01** [verified]. `GET /v2/disasters?appname=exodus-test&limit=1` → `HTTP 403 AccessDeniedHttpException` — "You are not using an approved appname. Kindly request an appname from ReliefWeb here: https://apidoc.reliefweb.int/parameters#appname". A guessed conventional name (`rwint-user-0`) also 403s [verified] — **there is no fallback appname; registration is unavoidable.**
**v1 is decommissioned** — `https://api.reliefweb.int/v1/reports` → **`HTTP 410`** with "The API version 'v1' has been decommissioned. Please use version 'v2' instead." [verified]
The documented appname format is "a combination of your (organization) name, purpose and random characters" [verified].
→ **Action for the build agent: register an appname before writing the adapter; the adapter must surface a clear "unregistered appname" error state, not a blank panel.**

**Rate limits (hard, published) [verified]** — note these appear on the **apidoc root**, not on `/parameters` as the original pack implied:
- "The maximum number of calls allowed per day is 1000."
- "The maximum number of entries returned per call is 1000."
- **Default `limit` is 10**, not 1000 — always set `limit` explicitly.
- Higher quotas are reviewed case-by-case on request; ReliefWeb logs and analyses API usage patterns.

At 1,000 calls/day a continuous polling loop can run at most every ~86 s. Budget it, and remember every paginated page is a call against the same quota.
**Query syntax:** GET with `filter[field]=`, `query[value]=`, `fields[include][]=`, `sort[]=date:desc`, `limit=`, `offset=`; POST accepts a JSON body with the same structure (`appname` stays in the URL) [UNVERIFIED].
**License:** the apidoc site states "Except where otherwise noted, content on this site is licensed under a Creative Commons Attribution 4.0 International license" [verified] — but this is stated of the **documentation site**, and the docs do not explicitly extend it to API-returned metadata [verified]. Attached report bodies carry third-party copyright regardless — **link out, never rehost full texts.** Treat metadata-is-CC-BY as [UNVERIFIED] and confirm when requesting the appname.

## 9. HDX + HAPI (Humanitarian API) — the aggregation shortcut

**Base:** `https://hapi.humdata.org/api/v2/` — **OpenAPI verified live**, `info.version = 0.9.14`, spec at `https://hapi.humdata.org/openapi.json` (~280 KB), **exactly 27 paths** [verified]. `GET /api/v2/util/version` → `{"api_version":"0.9.14","hapi_sqlalchemy_schema_version":"0.9.17"}` [verified] — note the schema version differs from the API version; log both.
**Auth:** `app_identifier` on every query, as query param or header `X-HDX-HAPI-APP-IDENTIFIER`. It is **base64 of `appname:email`** — **confirmed by construction** [verified]: `GET /api/v2/encode_app_identifier?application=exodus&email=...` returned exactly the same string as locally computing `base64("exodus:<email>")`. You may mint it offline; no account needed, no network call required.
**Live query confirmed** [verified]: `/api/v2/affected-people/refugees-persons-of-concern?location_code=SDN&limit=1&app_identifier=<id>` → HTTP 200, returning rows keyed by `resource_hdx_id`, `population_group` (e.g. `OOC`), `gender`, `age_range`, `min_age`, `max_age`, `population`, `reference_period_start/end`, `origin_location_code/name`, `asylum_location_code/name`.
**Response shape is `{"data":[...]}`** [verified] — a bare object with no pagination metadata envelope. Track `offset` yourself; do not expect a `total` or `next`.
**Caution observed:** the `location_code=SDN` filter returned Afghanistan-origin rows, because `origin_location_code` and `asylum_location_code` are distinct dimensions and `location_code` does not disambiguate them. **Filter explicitly on `origin_location_code` or `asylum_location_code`, never the generic `location_code`, for this endpoint.** This is a real footgun not flagged in the original pack.
**Limits:** default max 10,000 records per query if `limit` omitted; `limit`/`offset` pagination on all endpoints; `output_format=json|csv`. String filters are implicit wildcards and case-insensitive (`location_name=Mali` also matches Somalia — **always filter on ISO3 codes, never `location_name`**) [UNVERIFIED — from docs].

**Full endpoint list — enumerated directly from the live OpenAPI spec, all 27 [verified]:**
```
/api/v2/affected-people/humanitarian-needs
/api/v2/affected-people/idps
/api/v2/affected-people/refugees-persons-of-concern
/api/v2/affected-people/returnees
/api/v2/climate/rainfall
/api/v2/coordination-context/conflict-events
/api/v2/coordination-context/funding
/api/v2/coordination-context/national-risk
/api/v2/coordination-context/operational-presence
/api/v2/encode_app_identifier
/api/v2/food-security-nutrition-poverty/food-prices-market-monitor
/api/v2/food-security-nutrition-poverty/food-security
/api/v2/food-security-nutrition-poverty/poverty-rate
/api/v2/geography-infrastructure/baseline-population
/api/v2/metadata/admin1
/api/v2/metadata/admin2
/api/v2/metadata/currency
/api/v2/metadata/data-availability
/api/v2/metadata/dataset
/api/v2/metadata/location
/api/v2/metadata/org
/api/v2/metadata/org-type
/api/v2/metadata/resource
/api/v2/metadata/sector
/api/v2/metadata/wfp-commodity
/api/v2/metadata/wfp-market
/api/v2/util/version
```
**This remains the single highest-leverage source in the assignment.** It normalises UNHCR, IOM DTM, IDMC, IPC, conflict events, INFORM risk and WorldPop baseline population onto one admin1/admin2 p-code grid, with **no account and no key** — the only source in this stack of which that is now true. **Build the MVP's country/admin panel on HAPI first**, then add per-source adapters for freshness.
**Cadence:** per-source; HAPI refreshes as upstream HDX datasets update [UNVERIFIED]. **Beta** — pin `openapi.json` version and diff on CI. The 27-path list above is your CI baseline.
**License:** governed by HDX HAPI terms; underlying datasets carry their own licences, exposed via `/metadata/dataset`. **Corrected URL:** `https://data.humdata.org/hapi/terms` does **not** serve a terms page — it 302-redirects to `https://docs.humdata.org/build/overview/hdx-api-overview` [verified]. **Render the per-dataset licence in the UI** — do not assume CC BY across the board.

## 10. GDACS

**Event list (GeoJSON):** `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD`
**Verified live:** `HTTP 200`, `application/json; charset=utf-8`, `{"type":"FeatureCollection","features":[…]}`, 7 features for a 2026-09-10→18 window [verified].

**Full verified property list** on each feature:
```
Class, affectedcountries, alertlevel, alertscore, country, datemodified, description,
episodealertlevel, episodealertscore, episodeid, eventid, eventname, eventtype,
fromdate, glide, htmldescription, icon, iconoverall, iscurrent, iso3, istemporary,
name, polygonlabel, severitydata, source, sourceid, todate, url
```
**Corrected — do not parse the icon URL.** The original pack said "alert colour encoded in the icon path… drive the map's alert ramp directly off `iconoverall`". Unnecessary and fragile: GDACS exposes **`alertlevel`** as a plain string (`"Orange"`) and **`alertscore`** as an integer (`2`) [verified]. Use those.
**Also corrected:** `alertlevel` and `episodealertlevel` can differ — an observed flood event had `alertlevel: "Orange"` but `episodealertlevel: "Green"`, and correspondingly `icon` pointed at a Green asset while `iconoverall` pointed at Orange [verified]. Decide explicitly whether your ramp shows **overall event severity** (`alertlevel`) or **current episode severity** (`episodealertlevel`) and label it in the UI. Silently mixing them will make the map contradict the GDACS site.
`severitydata` is a nested object `{severity, severitytext, severityunit}` and can be degenerate (`severity: 0.0`, `severitytext: "Magnitude 0 "` — note the trailing space) [verified]. Do not render `severitytext` raw; trim and validate.
`url` is a nested object containing at minimum `geometry` (→ `https://www.gdacs.org/gdacsapi/api/polygons/getgeometry?eventtype=&eventid=&episodeid=`) and `report` [verified] — the geometry sub-URL gives you real footprint polygons for free.

**Single event:** `https://www.gdacs.org/gdacsapi/api/events/geteventdata?eventtype=FL&eventid=<id>` [UNVERIFIED].
**Event types:** `EQ`, `TC`, `FL`, `VO`, `WF`, `DR`. **Alert levels:** Green / Orange / Red.
**Auth:** none [verified]. **Rate limits:** unpublished; poll every 5 minutes.
**Latency:** minutes for EQ, tens of minutes to hours for TC/FL [UNVERIFIED]. After GDELT this is the freshest thing in the stack.
**License:** GDACS is a JRC/UN joint product, openly reusable with attribution [UNVERIFIED].

## 11. Copernicus EMS Rapid Mapping

**Activations JSON [verified, HTTP 200]:** `https://rapidmapping.emergency.copernicus.eu/backend/dashboard-api/public-activations-info/`
Response is a **DRF-style paginated envelope**: `{"count":265, "next":"…?limit=10&offset=10", "previous":null, "results":[…]}` [verified]. **Default page size is 10** — the original pack did not mention pagination at all; a naive adapter will silently ingest 10 of 265 activations. Use `limit`/`offset`.
Each result carries `code` (e.g. `EMSR932`), `countries[]`, `eventTime`, `name`, `centroid` (WKT `POINT (lon lat)` — **WKT, not GeoJSON**; parse accordingly), `activationTime`, `category` (e.g. `Wildfire`), `lastUpdate` [verified].
**RSS discovery feed [verified, HTTP 200]:** `https://mapping.emergency.copernicus.eu/latest/feed/` — RSS 2.0, channel title "CEMS On Demand Mapping News", items carry `EMSR###` codes in title/link/description plus an `<enclosure>` JPEG [verified].
**Risk & Recovery search:** `https://riskandrecovery.emergency.copernicus.eu/search/` → HTTP 200 [verified].
**Harvesting guide:** `https://mapping.emergency.copernicus.eu/about/how-to-harvest-cems-mapping-data/` → HTTP 200 [verified].
Note `https://rapidmapping.emergency.copernicus.eu/` 302-redirects to `https://mapping.emergency.copernicus.eu/activations/` [verified] — the two hostnames are one service; only the `/backend/dashboard-api/` path is machine-readable.
**Auth:** none for public activations [verified]. **Latency:** activation posted within hours; delineation/grading products 6 h–3 days after [UNVERIFIED].
**License — corrected.** The original pack cited **Regulation (EU) No 377/2014**; that instrument has been **superseded by Regulation (EU) 2021/696** establishing the Union Space Programme [verified via copernicus.eu]. The Copernicus "free, full and open" data policy is real background, but the CEMS legal-notice page returns **404** [verified] and the harvest page carries only "© European Union, 1995 - 2026" [verified]. So: redistribution is near-certainly permitted with attribution, but the exact licence text and the attribution string "© European Union, Copernicus Emergency Management Service" are **[UNVERIFIED]**. Locate a live CEMS licence page before shipping the attribution string.
**Use:** overlay flood/fire/earthquake AOI polygons under the displacement layer; gives spatial ground truth GDELT and GDACS cannot.

## 12. Food security: IPC/CH, FEWS NET, WFP HungerMap

**IPC/CH — endpoint names now verified.** Docs `https://docs.api.ipcinfo.org/` → HTTP 200, "IPC Public API Documentation" v2.0 [verified]. Base `https://api.ipcinfo.org/`.
Endpoint existence confirmed by 401-vs-404 discrimination [verified] — an unauthenticated GET to a real route returns `HTTP 401 {"error":"API key required","code":"API_KEY_MISSING"}`, a bogus route returns `HTTP 404`:

| Route | Result |
|---|---|
| `/country` | 401 → **exists** |
| `/areas` | 401 → **exists** |
| `/points` | 401 → **exists** |
| `/analyses` | 401 → **exists** |
| `/population` | 401 → **exists** |
| `/areas?year=2025` | 401 → query params accepted |
| `/analysis` (singular) | **404** → does not exist |
| `/country/SDN` | **404** → **path-segment style is NOT supported** |

That last row is the important correction: **the IPC API is query-parameter based**. Do not build `/{resource}/{iso3}` URLs. The *simplified* vs *advanced* variants described in the original pack are **[UNVERIFIED]** — not observable without a key.
**Key required** via request form at `https://www.ipcinfo.org/ipc-country-analysis/api/`; terms at `.../api/terms-of-use/en/` [UNVERIFIED]. Content = IPC Acute Food Insecurity phases 1–5 per analysis unit (admin area, urban area, IDP camp, HFA-receiving area). **Cadence: per-analysis, roughly quarterly per country, no fixed global date** [UNVERIFIED]. R reference implementation: CRAN `ripc` [UNVERIFIED].

**FEWS NET Data Warehouse — root enumerated live [verified].** `https://fdw.fews.net/api/` → HTTP 200, returning a JSON map of ~120 endpoint names to URLs. Corrections and additions:
- The endpoint is lowercase **`ipcclassification`**, not `IPCClassification`: `https://fdw.fews.net/api/ipcclassification/` [verified].
- Related IPC routes the original pack omitted: `ipcpopulation`, `ipcphase`, `ipchfa`, `ipchfavalue`, `ipcphasemap`, `ipcpackage`, `ipcpopulationsize`, `ipcclassificationdataset`, `ipcpopulationdataset` [verified].
- **Directly migration-relevant routes the original pack missed entirely** [verified]: **`migrationflow`**, **`migrationflowvalue`**, **`displacementtracking`**, **`displacementtrackingvalue`**, **`populationprojection`**, **`populationprojectionvalue`**, `remittances`, `remittancesvalue`, `heatexposure`, `acaps`. For a migration product, `migrationflow` and `displacementtracking` are arguably the most valuable endpoints in this entire section and deserve their own spike.
- **`licence`** and **`datausagepolicy`** / **`datausagepolicyreason`** endpoints exist [verified] — you can read per-dataset licence terms **programmatically**, which directly serves the Provenance requirement below. Wire these into the licence surfacing rather than hardcoding a licence string for FEWS NET.
- **Known upstream bug:** the root listing gives `ipchfavalue` as `https://fdw.fews.net/ipchfavalue/` — missing the `/api/` segment [verified]. Normalise paths yourself; do not trust the root map blindly.
- **Operational note:** `GET /api/ipcclassification/?format=json&limit=1` timed out twice at 40 s and 60 s (curl exit 28, HTTP 000) [verified]. These are heavy analytical endpoints. Set generous timeouts, always paginate, and never put an FDW call on a user-facing synchronous path.
Auth: session or token; unauthenticated calls succeed but return **public data only** [UNVERIFIED]. Help: `https://help.fews.net/fdw/fews-net-api` → HTTP 200 [verified].

**WFP HungerMap LIVE — independently reconfirmed as degraded [verified].** `https://api.hungermapdata.org/v2/adm0/108/countryData.json` → **`HTTP 503 {"message":"Service Unavailable"}`**; `https://api.hungermapdata.org/v1/foodsecurity/country/SDN` → **`HTTP 401 {"message":"Unauthorized"}`**; API root → 404 [all verified, 2026-09-18]. Two independent probe rounds gave identical results, so this is **not** a transient blip or a proxy artefact — v2 is down and v1 is auth-gated. Docs mirror `https://docs-wfp-hungermap.netlify.app/` → HTTP 200 [verified].
→ **Implement the adapter, ship it disabled, fall back to HAPI `/food-security-nutrition-poverty/food-security`.** Fields when available: `adm0_code`, `population` (millions), FCS, `fcsMinus1`/`fcsMinus3`, rCSI, import-dependency %, trend graphs; daily predictive nowcast across 90+ countries [UNVERIFIED]. Licence unknown [UNVERIFIED].

## 13. EM-DAT

**Portal:** `https://public.emdat.be/` — registration required. Docs `https://doc.emdat.be/`.
**Access:** free for **non-commercial use only** after registration; commercial use requires a separate Database License Agreement (paid annual subscription) [verified]. Download is an **.xlsx flat table** via the "Access Data" tab [UNVERIFIED].
**No open REST API on the public tier.** The terms document makes **no reference to any API, public or subscriber-only** [verified]. Do not fabricate one.
**License — corrected, and stricter than the original pack claimed.** The pack said "Archive on UCLouvain Dataverse under CC BY-NC-ND". `https://doc.emdat.be/docs/legal/terms-of-use/` names **no Creative Commons licence at all** [verified] — EM-DAT is copyrighted material owned by CRED/UCLouvain under bespoke terms. The binding restrictions are:
- Users must not "reproduce, copy, communicate, lend, or otherwise distribute EM-DAT or a substantial part of EM-DAT."
- Users must not "create substitute or derivative databases of EM-DAT."
- Commercial purposes are prohibited "except in the event such users enter into a separate Database License Agreement."
- Proper citation is required in all public use.
**Licensing consequence — unchanged conclusion, stronger footing.** A dashboard that reshapes EM-DAT rows is a derivative database and a redistribution. → **Exclude EM-DAT from the redistributable core.** Use GDACS + Copernicus EMS + IDMC GIDD-disaster for the same analytical job. Because the prohibition is contractual rather than a CC licence, there is no NonCommercial-style carve-out to argue about — the cleanest reading is simply not to ship it.

## 14. Frontex

**No public API.** Verified: the plausible-looking route `https://www.frontex.europa.eu/assets/Migratory_routes/json/migratory_routes.json` → **`HTTP 404`** [verified]. Do **not** invent a Frontex endpoint.
**What exists:** the Migratory Map (`https://www.frontex.europa.eu/what-we-do/monitoring-and-risk-analysis/migratory-map/` → HTTP 200 [verified]) and monthly news releases carrying preliminary detections of illegal border-crossing (IBC) by route (Central Mediterranean, Eastern Mediterranean, Western Balkans, Western Mediterranean, Western African, Eastern Borders, Channel). Source systems: FRAN and JORA [UNVERIFIED].
**Cadence: monthly, preliminary, revised retroactively** [UNVERIFIED].
**Deleted:** the original pack's "~75,000 detections Jan–Aug 2026, −35% YoY (Frontex, Sept 2026)". No retrievable source. Do not seed the repo with this figure — an unsourced headline number is precisely the failure mode that discredits the product with its intended audience.
**Integration plan:** scrape the map's XHR payload at build time OR maintain a small manually-curated monthly CSV in-repo with a `source_url` per row pointing at the specific Frontex news release. Flag the layer "preliminary, route-level, revised monthly." **A detection ≠ a person** (double-counting across routes) — state this in the UI.

## 15. IOM Missing Migrants Project

**Downloads:** `https://missingmigrants.iom.int/downloads` (CSV) — returned **HTTP 403 to an automated fetcher** [verified]; the page is browser-accessible but bot-blocked, so **you cannot wire a naive scheduled CSV pull**. Plan a manual or authenticated ingest, or mirror via HDX.
Data page `https://missingmigrants.iom.int/data`.
**License: CC BY 4.0 [verified]** — the data page states the dataset is under a "Creative Commons Attribution 4.0 International License" and that "Missing Migrants Project data and website content is free to share and adapt, as long as the appropriate attribution is given." Cleanest licence in the crisis stack, and one of only two sources here verified to a licence statement (the other being ODP).
**Cadence:** records added continuously, published in batches; incident-to-record latency days→weeks [UNVERIFIED].
**Content:** incident-level records since 2014 — region, route, cause of death, number dead / missing / survivors, coordinates, source [UNVERIFIED].
**Coverage caveat:** severe undercount, especially Sahara and Indian Ocean routes. Render as a **lower bound**, never a count.

## 16. UNRWA

No standalone public API found. **Use the UNHCR route:** `https://api.unhcr.org/population/v1/unrwa/?year=2024` → HTTP 200, `{"year":2024, "total":5914401}` [verified]. Series runs from 1952 (`394,811`) forward, 37 pages at default page size [verified]. Annual cadence. Field is `total`, not `refugees`. For Gaza/West Bank operational situation reports, use ReliefWeb `/reports` filtered to source `UNRWA` (appname required).

---

## FRESHNESS RANKING — what can drive a genuinely LIVE ticker

**Tier A — true live, sub-hour (build the ticker on these three, nothing else):**
1. **GDELT 2.0** — **15 min**, verified, both English and translingual feeds live. Poll `lastupdate.txt` every 60 s; ingest on timestamp change; track the two feeds' cursors separately. The only feed producing a visibly moving global signal.
2. **GDACS** — minutes (EQ) to low hours (TC/FL). GeoJSON, no auth, verified.
3. **ReliefWeb v2** — continuous editorial ingest, but the verified **1,000 calls/day** cap forces ≥86 s polling. Headline crawl, not a per-second counter. Appname-gated.

**Tier B — daily:**
4. **IDMC IDU** — daily refresh, 180-day rolling window. Closest thing to a live *displacement* feed. Key-gated.
5. **UNHCR ODP** — daily in active emergencies. Registration-gated.
6. **Copernicus EMS** — hours-to-days per activation; RSS-discoverable; remember the 10-per-page default.
7. **WFP HungerMap** — daily nowcast *when reachable*; currently 503/401, reconfirmed twice.

**Tier C — weekly to monthly:**
8. **ACLED** — weekly + retro corrections. Licence-encumbered; BYO-key only.
9. **Frontex IBC** — monthly, preliminary, no API.
10. **UCDP GED Candidate** — monthly release, ~30–45 day latency, **now token-gated**.
11. **HDX HAPI** — aggregate refresh follows upstream; effectively daily crawl over mostly monthly/annual sources.

**Tier D — episodic to annual (reference layer, never a ticker):**
12. **IPC/CH** and **FEWS NET** — per analysis cycle (~quarterly per country).
13. **IOM DTM** — per round; weekly in a few operations, otherwise monthly→annual.
14. **UNHCR RDF stock figures** — biannual. `/nowcasting/` is the monthly exception.
15. **IDMC GIDD** — annual (~May). **EM-DAT** — batch, weeks-to-months, excluded anyway. **Missing Migrants** — batched, and bot-blocked.

**Design consequence:** the "LIVE" chrome in the UI must be **bound to Tier A only**. Every other layer renders with an explicit `as-of` timestamp and a cadence badge. Animating an annual UNHCR stock figure as if live is the fastest way to destroy credibility with the institutional audience this is aimed at.

**Access-friction consequence (new).** Of the sixteen sources, only **four** are usable with zero registration: GDELT, GDACS, Copernicus EMS, and HDX HAPI. UNHCR's Population API is also key-free but is reference-cadence, not live. Everything else needs a form, a key, an email exchange, or an approval. **The MVP's day-one demo must be buildable from those four alone**, with every other adapter shipping disabled behind a config value. Sequence the credential requests (ReliefWeb appname, IDMC client_id, UCDP token, DTM subscription, IPC key) on day one, in parallel, because several have multi-day human turnarounds.

---

## HARD PRIVACY CONSTRAINTS — never render at individual granularity

Enforced in the **data layer**, not the view layer:

1. **No individual records, ever.** Missing Migrants incident rows, DTM flow-monitoring survey responses, ACLED/UCDP event descriptions naming individuals, and ReliefWeb case narratives must not be rendered as person-level entities. Missing Migrants rows may be plotted as incidents **without** any narrative field, name, nationality-plus-location combination, or source link identifying a named decedent.
2. **Minimum cell size: suppress any count < 25** at admin2 or finer for refugee/asylum-seeker/IDP populations. UNHCR is reported to apply asterisk-suppression (`*` = 1–4 persons) in Refugee Data Finder [UNVERIFIED — no asterisk appeared in any of the ~15 API responses observed in this session]. Parse `*` defensively anyway: **never coerce it to 0 or 1**, and fail loudly on any non-numeric value rather than silently casting.
3. **No reverse-geocoding of displaced-population locations below admin2.** No camp-level or settlement-level asylum-seeker counts on a zoomable globe; at high zoom, degrade to admin1 choropleth. Precise camp coordinates plus population plus nationality is a targeting dataset.
4. **Never cross-join** nationality × exact location × age-sex at subnational level. Any two of the three is acceptable; all three is re-identifying for small populations. Note HAPI's refugee endpoint returns `gender` × `age_range` × `origin_location_code` × `asylum_location_code` in a single row [verified] — this endpoint makes violating this rule the *default* if you render rows naively. Aggregate before rendering.
5. **UCDP `where_prec` and `date_prec` must gate rendering.** `where_prec` ≥ 4 (only admin2/country known) must not be drawn as a point at its nominal lat/lon — draw as an admin polygon or not at all. Same for IDU `latitude`/`longitude`, frequently centroids. Same for Copernicus `centroid`, which is explicitly a WKT centroid, not a footprint — use the GDACS `url.geometry` polygon endpoint [verified] where a real footprint is needed.
6. **No predictive scoring of individuals or households.** Simulations operate on aggregate cohorts (≥1,000 persons per synthetic cohort). No "likelihood this person migrates" surface.
7. **No border-enforcement targeting affordances.** No route-level near-real-time crossing predictions at a resolution usable for interception (finer than admin1 + monthly). Frontex IBC stays at route × month.
8. **Vulnerable-group flags** (unaccompanied minors, LGBTQ+ asylum claims, trafficking victims, specific ethnic minorities) must not be rendered subnationally under any circumstance — national aggregate only, and only where the source already publishes it nationally.
9. **Provenance is mandatory on every rendered number:** source name, dataset id, `as-of` date, licence string, and a link to the source record. Implement as a shared `Provenance` type every adapter must return; make it a compile-time requirement. Populate the licence field from `/metadata/dataset` (HAPI) and `/api/licence/` + `/api/datausagepolicy/` (FEWS NET) [verified these endpoints exist] rather than hardcoding.

---

## LICENCE DECISION TABLE FOR THE MVP

Confidence column added — most licence claims in the original pack were asserted without a verified source.

| Source | Licence | Confidence | Redistribute derived data? | MVP treatment |
|---|---|---|---|---|
| UNHCR ODP | CC BY 4.0 | **[verified]** | Yes | Core |
| UNHCR RDF (Population API) | CC BY 4.0 inferred from ODP | [UNVERIFIED] | Probably | Core; confirm before public launch |
| Missing Migrants | CC BY 4.0 | **[verified]** | Yes (aggregated only) | Core; downloads bot-blocked (403) |
| GDELT 2.0 | Bespoke, unlimited + unrestricted use, redistribution explicit, citation required | **[verified, quotable]** | **Yes, explicitly** | Core, live tier |
| ReliefWeb v2 | CC BY 4.0 stated of the docs site; extension to API metadata not stated | [UNVERIFIED] | Metadata probably; **link out for bodies** | Core, appname-gated |
| UCDP GED | CC BY 4.0 | **[UNVERIFIED — load-bearing, confirm first]** | Presumed yes | Default conflict layer, **token-gated** |
| GDACS | Open (JRC/UN), attribution | [UNVERIFIED] | Presumed yes | Core, live tier |
| Copernicus EMS | Free/full/open policy; Reg. (EU) 2021/696 | [UNVERIFIED — legal-notice page 404s] | Presumed yes | Core |
| HDX HAPI | HAPI ToU + per-dataset | **Per-dataset — read `/metadata/dataset`** | Core, per-layer licence surfaced |
| IDMC IDU/GIDD | CC BY, key-gated | [UNVERIFIED] | Presumed yes, with attribution | Core, key required |
| IOM DTM | IOM T&C, citation required | [UNVERIFIED] | Presumed yes with citation | Core via HDX mirror |
| IPC/CH | Key + ToU | [UNVERIFIED] | Restricted | Adapter, key-gated |
| FEWS NET | Public tier open; per-dataset via `/api/licence/` | [UNVERIFIED] | Read it from the API | Adapter |
| **ACLED** | **No functional substitutes, no unauthorised service provision, no AI/ML training** | **[verified, quotable]** | **NO** | **BYO-key, client-side, no cache, default OFF** |
| **EM-DAT** | **Bespoke CRED/UCLouvain terms — no CC licence; no distribution, no derivative/substitute databases, non-commercial only** | **[verified, quotable]** | **NO** | **EXCLUDE from core** |
| WFP HungerMap | Unclear; endpoint 503/401 | [UNVERIFIED] | Unknown | Adapter, disabled |
| Frontex | EU public info, no API | [UNVERIFIED] | Link + manual CSV | Manual layer, monthly |

**Standing instruction:** ship a `LICENCES.md` that records, per source, the licence string, the URL it was read from, and the date it was read. Re-check quarterly. Three of the original pack's licence claims (EM-DAT, Copernicus regulation, ACLED wording) were wrong or stale, which is a ~20% error rate on exactly the claims that carry legal risk.

---

## TWO DERIVED SIGNALS THE BUILD AGENT SHOULD IMPLEMENT

Both are **original constructions by the pack author, not drawn from published literature.** No coefficient, weight or functional form below is attributable to any paper. Label them as bespoke heuristics in the UI; do not present them as established indices.

**Displacement Pressure Index (DPI)** — per origin country `c`, per week `t`, range 0–1:

```
DPI(c,t) = w1·Z(gdelt_theme_volume(c,t))        // GDELT GKG REFUGEES+DISPLACED+CONFLICT normalised article volume
         + w2·Z(ucdp_deaths_90d(c,t))           // UCDP GED best-estimate deaths, trailing 90 days, per 100k pop
         + w3·Z(idu_new_displacements_30d(c,t)) // IDMC IDU figure sum, trailing 30 days, per 100k pop
         + w4·Z(ipc_phase3plus_share(c))        // IPC/CH population in Phase 3+ / total pop
         + w5·Z(gdacs_alert_weight_30d(c,t))    // Σ over events: Red=3, Orange=2, Green=1, trailing 30 days
```
with `Z(x) = (x − μ_global,t) / σ_global,t` computed cross-sectionally per week (not per-country time series, to avoid drift), clipped to [−3, 3] then min-max scaled to [0,1]. Default weights `w = [0.20, 0.25, 0.30, 0.15, 0.10]` — **arbitrary, chosen by the pack author, with no empirical basis** — exposed as UI sliders. **Each term must carry its own freshness badge; DPI inherits the WORST cadence among contributing terms.**

Three implementation cautions, all now grounded in verified findings:
- **Terms w2, w3 and w4 are all credential-gated** (UCDP token, IDMC client_id, IPC key). On day one the index will run on w1 and w5 only. Make the weight vector renormalise over *available* terms and display which terms are missing — a DPI silently computed from 2 of 5 inputs is worse than no DPI.
- **The GDACS alert weight must read `alertlevel`, not the icon URL** [verified], and must state whether it uses `alertlevel` or `episodealertlevel`.
- With weekly cross-sectional Z-scoring, a country entering or leaving the panel shifts μ and σ for everyone. Fix the reference set or the index will move for countries where nothing happened.

**Data Freshness Score (DFS)** — shown on every panel: `DFS = exp(−Δt / τ_source)` where `Δt` = hours since `as_of` and `τ_source` = the source's nominal cadence in hours (GDELT 0.25, GDACS 1, IDU 24, ACLED 168, IPC 2160, UNHCR RDF 4380). Render as a decaying dot, green→amber→grey. Also bespoke, but sound: it is a monotone transform of staleness relative to expected cadence and makes no empirical claim. This single component is what makes the dashboard read as honest rather than as theatre.

---

## MVP IMPLICATIONS — corrected

- **Build the data spine on HDX HAPI v2 first.** `https://hapi.humdata.org/api/v2/`, OpenAPI **0.9.14**, **27 endpoints**, all enumerated above [verified]. No account needed; `app_identifier` is base64 of `appname:email` and can be minted offline [verified]. Pin the 27-path list as a CI baseline and diff `openapi.json` on every build — it is beta. **Filter on `origin_location_code`/`asylum_location_code`, not the generic `location_code`** [verified footgun].
- **Bind "LIVE" chrome to Tier A only**: GDELT 2.0 (15-minute slots verified, English *and* translingual), GDACS (GeoJSON 200 verified), ReliefWeb v2. Everything else gets a visible as-of timestamp and cadence badge.
- **ACLED: bring-your-own-key, client-side-only, default OFF, zero server cache, zero redistribution** — and do not attribute derived analysis to ACLED. Justified by verbatim terms, not paraphrase. Use UCDP GED as the default conflict layer — but note UCDP is **now token-gated** (`x-ucdp-access-token`, email `mertcan.yilmaz@pcr.uu.se`), so it is no longer friction-free, and **verify its CC BY 4.0 licence before building the architecture around it.**
- **Exclude EM-DAT entirely.** Its terms forbid distribution and derivative/substitute databases outright under bespoke CRED/UCLouvain copyright — not a CC licence [verified]. Cover the ground with GDACS + Copernicus EMS + IDMC GIDD-disaster.
- **Register a ReliefWeb appname before writing the adapter.** Unapproved appnames 403 since 2025-11-01; v1 returns 410 Gone; guessed conventional names do not work [all verified]. Published caps: 1,000 entries/call and **1,000 calls/day**, capping polling at ~86 s. Default `limit` is 10 — always set it.
- **DTM: the routes are known now — use them.** `https://dtmapi.iom.int/v3/displacement/{admin0,admin1,admin2,country-list,operation-list}`, header `Ocp-Apim-Subscription-Key`, env `DTMAPI_SUBSCRIPTION_KEY` [all verified]. `dtm-apim-portal.iom.int` is only for obtaining the key. Ship a day-one fallback on the unauthenticated HDX mirror `global-iom-dtm-from-api` (package_show → 200 [verified]).
- **IDMC**: obtain a client_id from `ch.datainfo@idmc.ch`; wire `/external-api/idus/last-180-days/?client_id=KEY` as the primary displacement feed, and note `/external-api/idus/all/` also exists [verified]. Closest thing to a live displacement feed in the stack.
- **Never hardcode a Frontex endpoint** (asset path 404s [verified]). Manually-curated monthly route-level IBC CSV with per-row `source_url`; label "preliminary, revised monthly" and "a detection is not a person". **Do not seed it with the unsourced ~75,000 figure.**
- **HungerMap ships disabled** — v2 503, v1 401, reconfirmed across two probe rounds [verified]. Fall back to HAPI `/food-security-nutrition-poverty/food-security`.
- **IPC: query-parameter URLs only.** `country`, `areas`, `points`, `analyses`, `population` exist; `/country/SDN` does not [verified].
- **FEWS NET: spike `migrationflow` and `displacementtracking` early** — the FDW root exposes them [verified] and they were entirely absent from the original research. Also wire `/api/licence/` and `/api/datausagepolicy/` into the Provenance layer. Expect slow responses; keep FDW off synchronous request paths (two probes timed out at 60 s [verified]).
- **Enforce privacy in the data layer**: suppress counts under 25 at admin2 or finer; parse `*` defensively and never coerce it; degrade to admin1 choropleth at high zoom; never render nationality × exact location × age-sex together — and note HAPI's refugee endpoint hands you exactly that combination in one row [verified], so aggregate before render.
- **Gate point rendering on precision flags**: UCDP `where_prec` ≥ 4, IDMC IDU coordinates, and Copernicus WKT `centroid` values are centroids, not event sites. Render as admin polygons, or pull the real footprint from GDACS `url.geometry` [verified].
- **Make `Provenance` a compile-time requirement** on every adapter return: source name, dataset id, as-of date, licence string, source record URL. Surface per-layer licences from HAPI `/metadata/dataset` — do not assume uniform CC BY.
- **Poll GDELT via `lastupdate.txt` on a 60-second timer**, downloading only on slot change; the file is exactly three `size md5 url` lines for export/mentions/gkg [verified]. Track the translingual cursor separately — it lagged by one slot at probe time [verified]. `masterfilelist.txt` is ~128 MB; stream it [verified]. Keep DOC 2.0 calls ≥5 s apart.
- **ACLED pagination:** use `limit=5000` (default and max [verified]) and **read the current ACLED docs for the pagination scheme at implementation time** — the previously-claimed 2026-10-01 offset-deprecation could not be substantiated. Re-pull a trailing 60-day window each cycle for retroactive corrections [UNVERIFIED cadence claim — confirm].
- **Implement DFS** `= exp(−hours_since_as_of / τ_source)` as a decaying green→amber→grey dot on every panel (τ: GDELT 0.25 h, GDACS 1 h, IDU 24 h, ACLED 168 h, IPC 2160 h, UNHCR RDF 4380 h). Any composite index inherits the **worst** cadence among its terms, and must show which of its terms are unavailable.
- **Ban person- and household-level prediction outright**: cohorts ≥1,000 persons; no route-level near-real-time crossing forecast finer than admin1 × month.
- **New: sequence credential requests on day one, in parallel** — ReliefWeb appname, UCDP token (3–5 working days), IDMC client_id, DTM subscription key, IPC key. Only GDELT, GDACS, Copernicus EMS and HDX HAPI work with no registration at all, so the day-one demo must stand on those four.