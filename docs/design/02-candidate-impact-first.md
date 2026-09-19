# Exodus — MVP design (IMPACT-FIRST lens)

**Working title change, deliberate.** The repo codename `EXODUS` is retired. Lexicon rule 10 structures its ban on the seven dehumanising source concepts from Mendelsohn & Budak (arXiv:2502.13246, ACL 2025) — animal, vermin, parasite, physical pressure, water, commodity, war. "Exodus" is mass-flight-under-duress imagery in the war/pressure family. **Exodus** is the product's own core object: the arc between two ADM0 centroids. It is neutral, it is what the user actually clicks, and it survives the project's own CI lint. Shipping a migration tool whose name fails its own lexicon gate is the first credibility hole a critic finds.

---

## 0. The lens, stated plainly

Thirty seconds is the whole budget. In that window a viewer must conclude three things, in order:

1. **This is the entire world, and it is dense.** Not a pilot, not a region, not a hero corridor with fake particles. 258 ADM0 polygons, 14,909 ADM1 polygons, 41,162 population-density hexes, ~12,000 live corridors, all on screen at once, all interactive.
2. **It moves, and the motion is the data.** Drag one handle and 34 years of the global migration system re-render continuously at 60fps. Nothing decorative is animating. What is moving is time, and the year is 44px in the corner.
3. **It is not lying to me.** Half the arcs are hatched because they are modelled. Some are split into two visibly disagreeing widths because two independent models disagree. The AS-OF chip says 2023, not today. There is a `/sources` link in the chrome.

The third point is what makes the first two impressive rather than merely pretty. Every globe demo on the internet renders one number per arc. **A globe showing one number per arc is lying.** Exodus renders the disagreement, and that is the thing nobody has seen before.

**What I am spending the budget on:** the globe, the flow rendering, the year scrub, the uncertainty encoding, the density of legible information, the entry.
**What I am buying that with:** the solver, the estimation stack, three of the eight surfaces, and the whole occupational dimension.

### The one aesthetic override, owned up front

UX pack §4 says: *no entrance animations, no auto-rotating globe, no convergence-on-target arc motion, no impact ripple at destination.* I keep three of those four absolutely — auto-rotation, arc convergence motion and destination ripples are banned in this design too, because they are the motifs that make a migration tool read as a targeting system (ethical rule 13's neighbourhood).

I override exactly one: **no entrance animations.** Exodus has a 2.4s establishing camera move. Its constraints are tight enough that it is not the thing the rule was written against:

- The world is **fully rendered at frame one**. No layer pops in, no mark animates, no arc draws itself. Only the camera moves.
- It runs **once per session** (`sessionStorage`), and **any input cancels it instantly**.
- It is **zero-length under `prefers-reduced-motion`**.
- It ends at the default Global South camera (rule 17: 53% of all international migrants moved within their own region of origin — UN DESA IMS 2024).
- It is deterministic: same keyframes every time, no randomness, no `Date.now()`.

This touches no §6 ethical rule. I am calling it out rather than burying it because a design that quietly ignores its own guidance is a design nobody should trust with the rules that actually matter.

---

## 1. Scope in

| # | Capability | Why it earns globe budget |
|---|---|---|
| 1 | **Situation Globe** — `_GlobeView`, opaque sphere, ADM0 choropleth, ADM1 on zoom, H3 r3 density, 12k corridors, incident ribbon | The product |
| 2 | **The Year Machine** — 1990-2023 scrub, GPU-resident, 60fps | The headline motion, and it is honest: the data has a time axis and the user drives it |
| 3 | **Two-model uncertainty band per corridor** | Headline feature #1 from the research; nothing else in the field does it |
| 4 | **Coverage-asymmetry encoding** | Headline feature #2; stops the globe from flattering register-rich states |
| 5 | **Absorption headroom calculator** | The one deep analytic; retains the first half of differentiation thesis #1 |
| 6 | **Replacement-migration differential** | The most quotable demographic number in the field, shipped with its own "unrealistic" footnote |
| 7 | **Radiation null model + CPC** | ~80 lines that prove the project knows what accuracy means |
| 8 | **Entity page + corridor drawer** | Density of legible information, one screen each |
| 9 | **`/sources`** | The trust argument, rendered |
| 10 | **`<Figure>` + provenance popover** | Every number carries its papers |
| 11 | **Degradation ladder + AS-OF chip** | Never blank, never zero-as-missing, oldest vintage wins |
| 12 | **Live incident ribbon** | The only marks allowed to pulse |
| 13 | **Full offline first run** | Architecture, not convenience |
| 14 | **A11y: Shift+G table, reduced-motion, non-colour encoding** | Non-negotiable |
| 15 | **Plugin connector contract + replay corpus** | Differentiation thesis #5 |

## 2. Scope out, and what it costs

**The allocation MILP is cut.** No `solve()`, no shortlist, no assignment across destinations. This is the research's differentiation thesis #1, half-abandoned. I keep "how many can X absorb"; I drop "what is the welfare-maximising assignment". The honest reason: the MILP has three known spec bugs (`z_jd` undefined, C8 using an absolute value, C6's `ρ=0.02` missing a time window), candidate pruning is the only thing making it tractable, every latency target in the research is an unbenchmarked hypothesis, and GDPR Art. 22 plus the Alajak et al. GeoMatch finding mean the whole feature needs a human-actor audit path before a single line is useful. That is a milestone of its own. It does not fit beside a 60fps globe.

**Cut with it:** PPML, nested logit, fitted gravity coefficients (I do not even ship the Ortega & Peri numbers as placeholders — a placeholder coefficient in a UI becomes a cited coefficient), Scenario Studio, Compare, Brief, Corridor Graph, the live cohort-component engine, the entire occupational/vacancy dimension (ILOSTAT gives ISCO 1-digit crossed with birth status; vacancy data covers ~40 reporters not 200; a global occupational layer in v1 would be fabrication for 150 countries), UN DESA IMS, UNHCR-in-the-bundle, ACLED, EM-DAT, IDMC, GADM, MIPEX, ReliefWeb, DTM, VIEWS, geoarrow, kepler.gl, TerrainLayer, accounts, websockets, ADM2, remittances, 3D columns, any LLM.

**`/solve` still exists as a route.** It renders the absence: the full objective function, the weight vector `w_E .30, w_P .25, w_N .15, w_L .10, w_H .08, w_K .05, w_F .07`, the three spec bugs listed as open issues, the GDPR Art. 22 constraint, the OSD clause 5/6 trade-off, and "not implemented in v1". Making the gap the loudest thing on that screen is the only mitigation that works.

---

## 3. Screen inventory

Five routes, five overlays. Nothing else.

### `/` — Situation Globe
Full-bleed WebGL canvas. Chrome floats over it on `--scrim-globe: rgba(6,8,12,.72)` (every measured contrast ratio in the design tokens is void over a WebGL canvas; the scrim is what makes them true again).

- **Top-left, 44px tabular-nums:** the year. The largest thing on screen after the Earth.
- **Bottom, full width:** the Year Machine — a 1990→2023 track, 34 notches, with a stacked area of global flow volume behind the handle. Drag, arrow-key, or `Space` to step. This is the single most important control in the product and it gets the most pixels of any control.
- **Left rail, 280px:** layer registry (data-driven, not hand-coded). Each entry shows its latency class glyph and its own vintage. A degraded layer is struck through but **stays visible** — a vanished conflict layer reads as "no conflict".
- **Right rail, 320px, collapsible:** the working set. Countries and corridors the viewer has pinned. Persists to the URL.
- **Status bar, 24px:** `LIVE | CACHED | SNAPSHOT | UNAVAILABLE` per source group, plus **one AS-OF chip showing the oldest contributing vintage**. Showing the newest is the lie.
- **Legend:** three map slots only (`#3987e5`, `#d95926`, `#199e70` — all-pairs ΔE2000 41.5 normal / 16.5 protan / 18.2 deutan). People are never red, orange or yellow; warm hues are reserved for service and rights deficits.

Interactions: hover a corridor → provenance popover with both model estimates and the divergence. Click → corridor drawer. Click a country → entity page. `Shift+G` → the mandatory text alternative.

### `/place/:iso3` — Entity page
One screen, no scrolling for the primary facts. Left 40%: a small non-interactive globe inset showing that country's top-25 corridors in and out, symmetric by default (rule 9). Right 60%, a 12-cell figure grid: population (WPP 2024), foreign-born stock and per-capita (Gaskin & Abel `stock_mean` ± `stock_std`), net flow 2023, top 5 origins and top 5 destinations, PSR and POADR side by side, physicians/nurses/beds per 1,000 against the WHO 4.45 floor, absorption headroom with its binding indicator named, coverage-asymmetry score, Missing Migrants annual count at ADM0 (no coordinates, ever), revision status, and the country's own AS-OF.

Every one of those is a `<Figure>`. A missing source renders `—` with a badge. Never `0`.

### `/corridor/:origin-:dest` — Corridor drawer
Opens as an overlay on the globe, permalinkable as a route. Contents: the two model estimates as a dumbbell with the divergence percentage between them; for EU pairs, the Eurostat mirror pair (`migr_imm5prv[geo=B,partner=A]` vs `migr_emi3nxt[geo=A,partner=B]`) as a third mark; the 34-year series as a sparkline with per-year `estimate_kind` as the stroke pattern; CEPII dyad context (distance `distw_harmonic`, contiguity, `comlang_off`, `comcol`/`col45` — **one colonial dummy, never both**, adding them double-counts — `comrelig`, `scaled_sci_2021`); and the radiation null model prediction with CPC against the Robinson & Dilkina global baseline of 0.16.

No route geometry. Great-circle between ADM0 centroids, two vertices, enforced at the query planner (rule 4).

### `/headroom/:iso3` — Absorption calculator
The one deep analytic, one screen. Five sliders (physicians, nurses+midwives, hospital beds, dwellings, health spend per capita targets), one horizon slider, one assumption-set name. Output: a single figure with the **binding indicator named explicitly**, and the mandatory label *"Modelled labour-market absorption under assumption set «name» — not a policy limit."* Banned strings (`capacity limit`, `carrying capacity`, `maximum`, `threshold`, `saturation`) are CI-enforced against the built bundle, not just the source.

The honest part: under WHO floors this is **negative for essentially every country on Earth** (216/216 at or below a 100% electricity target, 214/214 at or below 100% water). Exodus renders negative headroom as a **service deficit in warm hue**, which is what it actually is, and states in the panel that the formula holds service stock fixed while growing population — migrants bring physicians, so it systematically understates. A calculator that admits its own sign error in public is more impressive than one that hides it.

### `/sources` — Licence and cadence ledger
A table of every source: id, licence SPDX, `redistributable` boolean, cadence, vintage, latency days, coverage count, estimate kind, and what breaks without it. Sorted by latency. Three rows are the argument: **UN DESA IMS — excluded, non-commercial no-derivatives, replaced by Gaskin & Abel**; **UNHCR — licence contradictory across two verification passes, online-only connector, not redistributed, unresolved with webportal@unhcr.org**; **ACLED — excluded, no AI/ML training regardless of purpose**. Nobody else ships this screen. It costs a day.

### `/solve` — the designed absence
As described in §2.

### Overlays
`Cmd+K` palette (`>` actions, `#` datasets, `@` countries, `~` corridors) · `Shift+G` globe text alternative (top-25 corridors as a sorted keyboard-navigable table, `role="application"` + `aria-describedby`) · provenance popover · keyboard help · `saved_views` tray (never `watchlist`).

---

## 4. The exact data bundle

Two tiers. Tier A is committed to git and is what `pnpm dev` uses with the network off. Tier B is a GitHub Release asset (releases: <2 GiB each, up to 1000, no total-size or bandwidth limit) fetched by `pnpm data:full`. **No Git LFS** — forks and pulls count against the parent repo's bandwidth until `git clone` breaks for everyone.

### Tier A — committed, target ≤45 MiB total (MEASURE IN WEEK ONE; the 45 MiB figure is an unverified estimate and nullable CI columns are the blow-up risk)

| File | Source | Licence | Shape | Est. size |
|---|---|---|---|---|
| `flows_render.parquet` | **Gaskin & Abel**, *Nature* 655(8121):148-157, Zenodo 10.5281/zenodo.17344747, `mig_bilateral.csv` | CC BY 4.0 | top 12,000 corridors by mean 2015-2023 `mig_prev`, × 34 years = ~408k rows. Cols: `orig, dest, year, stock_mean, stock_std, mig_prev, mig_prev_std, mig_brth, mig_brth_std`. Filter `orig == dest`. `estimate_kind='modelled'` on every row. | 6-9 MiB |
| `flows_5yr.parquet` | **Abel & Cohen v6**, figshare 14579241 / file 53236079 | CC BY 4.0 | 232 countries, `year0 ∈ {1990,1995,2000,2005,2010,2015}`. **Sum `sex ∈ {female,male}` — there is no total row.** Keep `da_pb_closed` as the default estimator and `da_min_open`/`da_min_closed` as the spread. **Never sum across `type ∈ {outward,return,transit}` — naive summation triple-counts.** | 3-4 MiB |
| `eurostat_monthly.parquet` | `migr_asyappctzm` + siblings | CC BY 4.0 (Decision 2011/833/EU, commercial reuse explicit) | last 36 months, EU+EFTA destinations × ~190 citizenships, through 2026-08. Carries `OBS_FLAG`/`CONF_STATUS` per row. | 2-3 MiB |
| `eurostat_mirror.parquet` | `migr_imm5prv` + `migr_emi3nxt` | CC BY 4.0 | last 10 years, EU pairs only, both directions, for the mirror band | 2-3 MiB |
| `indicators.parquet` | WDI v2, WHO GHO, WB Data360 | CC BY 4.0 | per country-year: population, `NY.GDP.PCAP.PP.KD` (constant 2021 international $ — **not 2011 PPP**), physicians/nurses+midwives/beds per 1,000, health spend pc, urbanisation | 2 MiB |
| `demography.parquet` | UN WPP 2024 (237 countries) | CC BY 3.0 IGO | 2024 population by single-year age × sex; PSR (**15-64 / 65+**, the UN definition) and Sanderson-Scherbov POADR 2024-2050; **VarID 2 (Medium) minus VarID 7 (Zero migration)** totals per year. Unit normalisation applied at ingest: `SRB/100`, `ASFR/1000`, `population×1000`. **The `.csv.gz` files are multi-member gzip — a single-member reader returns 634 bytes with no error.** | 4-6 MiB |
| `dyad.parquet` | CEPII Gravity 202211 | Etalab 2.0 | `dist, distcap, distw_harmonic, contig, comlang_off, comlang_ethno, comcol, col45, comrelig, scaled_sci_2021`. **`distw`, `distwces`, `colony`, `smctry` do not exist in Gravity.** | 3-4 MiB |
| `density_h3r3.parquet` | GHS-POP → H3 r3 | CC BY 4.0 | **41,162 cells**, storing `pop` and `area_km2` so the renderer can compute density. Rule 3 caps gridded people layers at H3 r3; this is exactly the cap. | ~1 MiB |
| `missing_migrants.parquet` | IOM Missing Migrants | CC BY 4.0 — the only unambiguously redistributable IOM dataset | **ADM0-aggregated annual counts only. Coordinates dropped at ingest.** No map layer. | <0.5 MiB |
| `geo/world.pmtiles` | Natural Earth 5.1.1 ADM0 + `ne_10m_admin_1_states_provinces` (14,909,524 B source) | **Public domain / CC0, no attribution required** | ADM0 + 14,909 ADM1, simplified for globe. POV resolution `COALESCE(NULLIF(fclass_{pov},''), fclass_iso)` — `FCLASS_US` is null for 249/258 records. Disputed layer is `ne_10m_admin_0_disputed_areas`. | 10-14 MiB |
| `geo/centroids.parquet` | derived from ADM0 | CC0 | 258 arc endpoints | tiny |
| `crosswalk.parquet` | hand-built, versioned | CC0 | **A versioned table with validity date ranges, not a dict literal.** Five namespaces: UN M49, ISO3, Eurostat GEO (`UK` not `GB`, `EL` not `GR`, `XK`), OECD `REF_AREA` (+`W`), KNOMAD `WB_KNOMAD_<ISO3>`, UNHCR legacy (**collides with ISO3: `AUS` = Austria in UNHCR, Australia in ISO**). Explicit rows for Kosovo, Taiwan, Palestine, Western Sahara, Curaçao, Sudan-2011, Serbia-Montenegro-2006, USSR, Yugoslavia. | tiny |
| `corpus/{gdelt,usgs,gdacs}/` | replay corpus | GDELT redistribution explicitly permitted with citation; USGS/GDACS public | **7 days only. GKG excluded** — GKG alone is ~5.3-5.9 MB per 15-min slot, 90 days ≈ 45-50 GB. Each entry: `{url, fetchedAt, sha256, httpStatus, redirectChain}`. | 8-12 MiB |

### Tier B — release asset, `pnpm data:full`
`flows_full.parquet` — all Gaskin & Abel corridors, all 34 years, all uncertainty columns (~1.8M rows). The globe renders the top 12k either way; Tier B unlocks arbitrary corridor lookup and the full Shift+G table.

### Online-only connectors (never committed, degrade to UNAVAILABLE)
- **UNHCR RDF** `https://api.unhcr.org/population/v1/` — client contract baked into the connector: send `cf_type=ISO` (snake_case) or `coa=DEU` returns 0 rows at HTTP 200; `yearFrom`/`yearTo` only (`year=` is silently ignored); `coo_all`/`coa_all` are dimension-expansion switches that override filters when both are passed; discard `"-"` aggregate rows; **join on `coo_iso`/`coa_iso`, never `coo`/`coa`**; coerce string numerics. Values <5 are rounded to the nearest 5 — **no asterisk convention exists, do not build asterisk parsing.** Layer renders UNAVAILABLE with the reason "licence unresolved — not redistributed" when offline.
- **GDELT** — poll `lastupdate.txt` (3 lines: `size md5 url`, `http://` → rewrite to https) on a 60s timer, act on slot change. Translingual feed lags one slot. DOC API needs ≥5s spacing. **GEO 2.0 is 404 — do not build it.**
- **GDACS** GeoJSON — use `alertlevel`/`alertscore`/`episodealertlevel`. **Never string-match the icon path**; a sampled row had `icon`=Green while `alertlevel`=Orange.
- **USGS** quakes, 1-5 min.
- **Eurostat TOC** `catalogue/toc/txt?lang=en` polled daily for `last update of data` to drive incremental ingest. A query over ~5,000,000 estimated cells is rejected or diverted to the async API — the connector chunks by year.

### The single most important data decision
**Gaskin & Abel replaces UN DESA IMS as the bilateral spine.** DESA is the field's default, and it is non-commercial with no right to create derivative works — it cannot be in a CC BY bundle. Gaskin & Abel is annual (not quinquennial), 1990-2023 (not frozen at 2024 with 173 of 233 countries extrapolated from 2020), 230 countries, CC BY 4.0, and it is the only global bilateral source shipping **per-cell uncertainty**. That last property is what makes the entire uncertainty-band thesis possible. Its cost, stated in the UI on every arc: it is neural-network ensemble output, 73% test correlation, never derived by direct aggregation of individual records, and **African net migration is its least certain region**. `estimate_kind='modelled'` on every row, dashed path + 12% hatch + "modelled" in the tooltip.

### Fact table
Exactly as specified in the research, with `license_id` and `redistributable` as **mandatory columns on every row**, gated at export. `align(series, grid, method)` defaults to `"none"` — a missing year is a visible gap on the sparkline, never a silent interpolation.

---

## 5. The exact models implemented

Five. All pure, all seeded, all in `kernel` with no I/O and no `Date.now()`.

**M1 — Absorption headroom (Liebig minimum over per-capita service stock ratios).**
`AnnualIntakeCapacity = min_{k ∈ K_stock} [ (x_k / target_k − 1) · pop ] / horizon`, with `K_stock = {physicians, nurses+midwives, hospital beds, dwellings, health spend pc}`. **Two research-flagged defects fixed before coding:** per-1,000 ratios are converted to absolute stocks before multiplying by population (the factor-of-1,000 error), and the minimum is taken over stock ratios only — never over flow or utilisation indicators. Returns `{value, bindingIndicator, perIndicator[]}`. The binding indicator is always named in the UI. WHO's 4.45 doctors+nurses+midwives per 1,000 is labelled **a floor, explicitly not an optimum**. Negative results render as service deficits, not as zero.

**M2 — Replacement-migration differential.**
Precomputed WPP 2024 **VarID 2 (Medium) − VarID 7 (Zero migration)** per country per year 2024-2050 — the officially sanctioned migration counterfactual and the product's core demographic primitive. PSR shown as `P_15-64 / P_65+` (a WAP of 20-64 systematically overstates replacement need) alongside Sanderson-Scherbov POADR, because the gap between them is the story: Germany +11.3% on POADR vs +49.2% conventional. The one live computation is a **bisection for the intake path that holds PSR constant**: ~14-17 iterations at 1e-4 relative tolerance, with a **mandatory bracket-endpoint straddle check first** — monotonicity fails for profiles weighted toward 65+. The UN Replacement Migration (ESA/P/WP.160, 2000) Table 8 anchors ship as static reference figures with Scenario VI's own footnote quoted verbatim: *"Scenario VI is considered to be unrealistic."* Republic of Korea's 5.149 billion is displayed precisely because it demonstrates what the method does at its limit.

**M3 — Corridor disagreement (the headline).**
Not a fitted model — an agreement computation. Per corridor-year: `divergence = |A − B| / mean(A, B)` where A = Gaskin & Abel `mig_prev` and B = Abel & Cohen `da_pb_closed` (annualised from the 5-year period, and the annualisation stated as an assumption in the tooltip). For EU destination pairs, the Eurostat mirror pair is computed and rendered as a third mark. Drives arc hatch density and the dumbbell in the drawer. Two independent models over the same stock tables, whose disagreement is the best available uncertainty proxy.

**M4 — Coverage-asymmetry score.**
Per country, 0-1, from distinct `measure_code` count × recency of newest vintage × share of rows with `estimate_kind ∈ {observed, observed_flagged}`. Drives arc opacity and a choropleth overlay mode. **Author construction, badged as such in the UI and in `PARAMETERS.md`.** Its job: Gulf labour corridors, China, Russia and Iran must not render with the same visual authority as German register data.

**M5 — Radiation null model.**
Parameter-free, corridor drawer only, explicitly framed as a *null model and never the baseline*. Displayed with Common Part of Commuters `CPC = 2·Σ min(T_ij, T̂_ij) / (ΣT_ij + ΣT̂_ij)` and the Robinson & Dilkina (COMPASS '18, doi:10.1145/3209811.3209868) global reference printed beside it: gravity-exponential 0.16, gravity-power 0.16, radiation 0.16, XGBoost+extended 0.21, ANN+extended 0.22 with a production function; 0.43 and 0.40 **without** one — i.e. roughly half the achievable accuracy lives in getting origin outflow totals right. Stating that in the UI is worth more than shipping a mediocre gravity fit.

**Not implemented, and no placeholders shipped:** PPML (and the UI never contains the string "PPML is unbiased"), nested logit with multilateral resistance, any Ortega & Peri coefficient, any diaspora elasticity, any visa-restriction elasticity, the migration hump toggle, the MILP, any forecast of departures. A placeholder coefficient rendered in a dark dashboard becomes a cited coefficient within a week.

---

## 6. Architecture

**Toolchain (pinned):** pnpm 12.4.2 · Turborepo 2.11.2 · Node 24.21.0 LTS · TypeScript 7.0.2 with `erasableSyntaxOnly` (**no `enum`, no `namespace` — const objects + string unions, or TS1294**) · Vite + React · Zod 4.6.5 (`z.toJSONSchema()`) · Biome 2.5.14 · Vitest 5.0.1 · Playwright 1.63.0 (`--use-gl=angle --use-angle=swiftshader-webgl --enable-unsafe-swiftshader`).

**Rendering (pinned):** `deck.gl@9.4.0` · `@luma.gl/core@9.4.1` · `@luma.gl/effects@9.4.1` (post-FX lives here, not in `shadertools`) · `maplibre-gl@6.10.0` (**ESM-only: no `main`, no `require` condition**) · `@deck.gl/maplibre@9.4.0` with `@deck.gl/mapbox@9.4.0` retained as fallback · `pmtiles@4.5.0` · `apache-arrow@21.2.0` · `h3-js@4.5.0` · `@loaders.gl/parquet@4.5.1`. **No `@geoarrow/deck.gl-geoarrow`** — 0.4.2 declares peers `^9.0.0` but its devDeps pin `@deck.gl/* ^9.2.1`, it carries a runtime dep on `threads@1.7.0` (last published 2021), and it ships no `GeoArrowGeoJsonLayer` and no `GeoArrowIconLayer`. Arrow tables are read into plain typed arrays and handed to stock deck.gl layers via `data: {length, attributes}`. This deletes gating unknown #3 from the risk register on day zero, at the cost of ~150 lines of buffer plumbing. **No kepler.gl** — it peer-depends `styled-components ^6.1.0`, which collides with the token architecture.

### Package graph (CI-enforced)
```
connectors/*  → contracts                                   (only)
kernel        → contracts                                   (only, no I/O)
semantic      → contracts, ontology, registry, store, kernel
ui, globe     → contracts, semantic
apps/web      → ui, globe, semantic
```
Violations fail CI. `contracts` and the connector template are **Apache-2.0** for the patent grant; everything else **AGPL-3.0-or-later** — and the README states §13's actual scope: the offer of Corresponding Source runs to *all* users interacting over a network, including internal ones, with no "public" qualifier. REUSE spec 3.3 (`REUSE.toml`; DEP5 is deprecated and mutually exclusive), `reuse lint` in CI, DCO sign-off rather than a CLA.

### The globe layer stack (top to bottom)
1. `TextLayer` — country labels, collision-filtered
2. `ScatterplotLayer` — live incidents, **the only emissive marks**, feeding bloom
3. `PathLayer` — modelled/hatched corridors, great circles tessellated to 48 points (**`ArcLayer` cannot be dashed; `PathStyleExtension` does not support it**)
4. `ArcLayer` — observed corridors, `parameters: {cullMode: 'none'}`
5. `H3HexagonLayer` — r3 density, `highPrecision: 'auto'` (**never forced `false`** — high precision is required at res 0-5, for pentagons, and for mixed resolutions), rendering `pop / area_km2`, never raw count
6. `PolygonLayer` — ADM1, zoom > 2.5
7. `SolidPolygonLayer` — ADM0 choropleth
8. `GeoJsonLayer` — graticule, 10°, `--border-default` weight
9. **Opaque ocean sphere — mandatory, not optional.** `cullMode:'none'` is a per-layer override, so without an opaque sphere the far-side arcs bleed through the Earth.

Feature count at default view: ~41k hexes + 12k arcs + 15k ADM1 + 258 ADM0 + ~400 incidents ≈ **69k features across 9 layers** — far inside deck.gl's documented 60fps-to-1M ceiling and its ~100-layer comfort zone. Overdraw is the real constraint (4M points at 3px ≈ 113M fragments/frame), so the density layer caps alpha and the incident layer is radius-capped.

Post-FX from `@luma.gl/effects`: `bloom` (`radius`/`threshold`/`intensity` — **there is no mip-level prop**) thresholded so only the incident layer blooms, `vignette` (`radius`/`amount`), `fxaa`, `toneMapping`. **No standalone chromatic aberration module exists** — it is only a `chromaticAberration` prop on the bloom lens pipeline, and it is off; colour-fringing a data visualisation is a correctness bug.

### How the Year Machine hits 60fps
Arc **geometry is invariant across years** — the same 12,000 ADM0-centroid pairs. Only `getWidth`, `getHeight`, `getSourceColor`, `getTargetColor` and hatch density change. So:
- At load, build **34 pre-quantised `Float32Array`/`Uint8Array` buffers per animated attribute** (34 × 12k × 4 attrs ≈ 12 MB resident).
- Scrubbing swaps buffer references and bumps `updateTriggers`. **Zero re-tessellation, zero CPU geometry work, one GPU upload per frame at most.**
- `transitions: {getWidth: 180, getSourceColor: 180}` — 180ms is on the approved motion scale, and it makes the scrub feel liquid rather than steppy.
- Under `prefers-reduced-motion`: transitions to 0, the track snaps to discrete year notches, arcs are static.

### Globe ↔ Flat
`_GlobeView` is **experimental**, imported aliased as `{_GlobeView as GlobeView}`, `lnglat` only, with documented issues mixing or switching between GlobeView and MapView. This is gating unknown #1 and is prototyped in the first hours. FLAT mode above zoom 6 is MapLibre + `MapboxOverlay` interleaved for place context. **Per-capita people-density encoding is never rendered on Web Mercator** — the density layer is hidden in Mercator FLAT mode and the legend says why. There is no Equal Earth projection in MapLibre; rather than fake one, Exodus restricts Mercator to non-density place context and keeps all density work on the globe.

### Live transport and degradation
One multiplexed SSE stream, `GET /live/stream?sources=a,b`. Not websockets. Poll cadence: GDELT 60s on `lastupdate.txt`, GDACS 15 min, USGS 5 min, Eurostat TOC daily. Backoff: full jitter, base 1s, cap 300s, `degraded` after 5 consecutive failures with a struck-through legend entry that **does not disappear**. Ladder `LIVE → CACHED → SNAPSHOT → UNAVAILABLE`, explicit in the status bar.

**Latency class drives visual encoding, and any derived metric inherits the worst class, the oldest vintage, and the AND of licence flags.** `live` emissive/pulsing (GDELT, USGS, GDACS only) · `daily` solid, one arrival pulse · `periodic` choropleth, no motion · `annual` desaturated + 4px diagonal hatch, **no motion ever** · `modelled` dashed + ƒ glyph · `projected` hollow + SCENARIO watermark.

**The scrub does not violate "annual: no motion ever."** That rule bans decorative motion applied to annual marks — particles travelling along arcs, arcs drawing themselves, pulses at destinations. All three are banned here too. What the scrub animates is the **time cursor**, under direct user control, with the year rendered at 44px and the annual hatch persisting through every frame. The rule exists to stop a globe implying freshness it does not have; a scrub that puts "1997" on screen in the largest type in the product does the opposite.

### Determinism
`EXODUS_MODE=replay EXODUS_CLOCK=<iso>` with **no `Date.now()` outside the clock module**, ESLint-enforced. Corpus at `./corpus/{sourceId}/{ISO8601}.{ext}` recording the full redirect chain.

### Scenario URLs
`base64url(deflate-raw(json))` — **`CompressionStream` supports gzip/deflate/deflate-raw only, not zstd.** Encodes: year cursor, camera, layer visibility, working set, headroom assumption set. Not a scenario engine; a permalink.

### Policy enforcement in CI (fails the build)
- `layer_policy.yaml` enforced **server-side**: movement layers ≥7-day lag, ≥monthly bucket, ADM1 or coarser. Capacity is live and fine-grained; people are not.
- Schema scan rejecting `person`, `individual`, `case_id`, `applicant`, `biometric`, `name`, `dob`.
- Suppression: K=25 ADM0×ADM0, K=100 ADM1+, denominator floor 10,000, complementary suppression, **frozen suppression with an append-only published ledger**. Rounding runs after suppression, never instead of it.
- Movement `LineString` vertex count > 2 → reject.
- Nationality × sub-ADM0 geography → **HTTP 403** with a machine-readable policy body (**not 451** — RFC 7725 is for legally-compelled blocking).
- Lexicon lint over source, copy and the built bundle.
- Banned-visual-motif lint over asset names and identifiers: crosshair, reticle, radar, sweep, target, track, lock, watchlist, dossier.
- Schema names: `watchlist → saved_views`, `target → area_of_interest`, `entity → place|indicator`.
- Zero third-party scripts; cookieless self-hosted analytics, 7-day retention, IP truncated to /24 IPv4 and **/32 IPv6, not /48** (a /48 can still single out a household).
- `.github/ISSUE_TEMPLATE/harm-report.yml`, monitored address, **30-day response SLA**, power to de-publish a layer, public de-publication log.
- **No Annex III(7) function of any kind** and no Art. 5(1)(g) biometric categorisation — documented against Regulation (EU) 2026/1744 dates (Art. 5 applicable 2 Feb 2025; Art. 5(1)(ba)/(bb) from 2 Dec 2026; Annex III high-risk from 2 Dec 2027).

---

## 7. Milestones and acceptance criteria

One sustained build. Each milestone must run end-to-end from a cold install before the next begins.

**M0 — Gating smoke tests (first, before any product code).**
Accept when: (a) `_GlobeView` renders an opaque sphere + 12,000 `ArcLayer` arcs with `cullMode:'none'` + 41,162 H3 r3 hexes at **≥55fps median over a 10s orbit** on integrated graphics in Chrome, measured by a committed Playwright perf harness; (b) GLOBE↔FLAT switches both directions with no black frame and no lost layers; (c) `apache-arrow@21.2.0` → typed arrays → deck.gl path works without geoarrow. Failing (a) drops the corridor count to 6,000 before anything else is cut. Failing (b) makes FLAT a separate route rather than a toggle.

**M1 — Contracts + snapshot.**
Accept when: `pnpm ingest && pnpm snapshot:build` produces every Tier A file from raw sources; **total committed size is measured and recorded in `SNAPSHOT.md`** (no file >50 MiB); every row carries `license_id` and `redistributable`; the crosswalk resolves all five namespaces with the collision cases unit-tested (`AUS`, `UK`/`GB`, `EL`/`GR`, `XK`, `WB_KNOMAD_WLD` exclusion); WPP unit normalisation is unit-tested (`SRB/100` must not yield a 99.1% male birth share) and the multi-member gzip reader is asserted to return >600,000 rows, not 634 bytes.

**M2 — Globe v1.**
Accept when: `git clone && pnpm i && pnpm dev` with **`--network=none`** renders 190+ countries, ADM0 choropleth, ADM1 above zoom 2.5, H3 density as `pop/area_km2`, and the top 12k corridors, at the Global South default camera; the three-slot map palette is the only colour used for people; the AS-OF chip shows the oldest contributing vintage.

**M3 — The Year Machine.**
Accept when: dragging 1990→2023 holds **≥55fps median with no frame >50ms**; 34 years are resident with zero network calls during the scrub; `prefers-reduced-motion` produces discrete notch steps with zero transitions; the year is legible at 44px; keyboard arrows step years and `Space` plays.

**M4 — Provenance.**
Accept when: a CI check proves **no number renders outside `<Figure>`** (AST rule over JSX); missing sources render `—` with a badge and never `0`; the provenance popover shows source, vintage, latency days, estimate kind, licence, CI; `/sources` lists every source with the three exclusion rows present.

**M5 — Corridor drawer + uncertainty.**
Accept when: every corridor shows two model estimates and their divergence; EU pairs additionally show the Eurostat mirror band; modelled corridors are dashed + 12% hatch + labelled in the tooltip; the radiation null model and CPC render against the 0.16 reference; the great-circle vertex guard rejects any >2-vertex movement geometry in tests.

**M6 — Entity page + headroom.**
Accept when: 12 figures render for **every one of 190+ countries** with `—` where absent; headroom names its binding indicator; the banned-string lint passes against the built bundle; negative headroom renders as a warm-hue service deficit with the systematic-understatement note; the constant-PSR bisection converges in ≤20 iterations and refuses with a clear message when the bracket does not straddle.

**M7 — Live ribbon + degradation.**
Accept when: with network on, GDELT/USGS/GDACS marks appear with `live` chrome and the status bar reads LIVE; killing the network moves it to CACHED then SNAPSHOT **without any layer disappearing**; a forced 5× failure marks the source degraded and struck-through but still rendered; `EXODUS_MODE=replay` reproduces a byte-identical scene from the corpus.

**M8 — A11y, policy, entry.**
Accept when: `Shift+G` gives a keyboard-navigable sorted top-25 table with `role="application"` and `aria-describedby`; no encoding is colour-alone; all interactive controls carry `--border-interactive #5C6B85` (3.58:1), never `--border-default` (1.50:1, decorative only); the globe scrim is applied under all floating chrome; every CI policy gate in §6 is green; **the cinematic entry is implemented last** and is provably skippable, once-per-session, zero-length under reduced motion, and animates no data mark.

**Explicitly deferred to `BACKLOG.md`:** everything in §2.

---

## 8. Why this is the most impressive open-source thing in the room — truthfully

- **It is the whole world at frame one, offline.** No loading spinner, no "select a region", no API key. That alone beats every migration tool that exists, all of which 403 a scripted client.
- **One handle moves 34 years of the planet.** Nobody has shipped a global bilateral migration system that scrubs continuously, because until Gaskin & Abel (10 June 2026) the annual global bilateral series did not exist. This design is possible for the first time this year.
- **The uncertainty is the aesthetic.** Two models, visibly disagreeing, on the same arc. Hatched modelled paths. Coverage asymmetry dimming the states with no statistical office. A dark globe that *refuses to look confident where it isn't* is a stronger image than any particle system.
- **`/sources` and `/solve` are the flex.** A screen that lists what the project refused to ship and why, and a screen that renders a missing feature's full specification, are things only a project confident in its own integrity builds.
- **Every ethical rule is a CI gate, not a paragraph.** The lexicon lint, the vertex guard, the 403-not-451 policy body, the frozen-suppression ledger, the `<Figure>` AST rule. That is checkable by a stranger in ten minutes.

## 9. What was deliberately cut, restated without softening

The solver. The estimation stack. The occupational dimension. Three of eight surfaces. A tool named for a calculator that does not optimise anything is the price of the globe, and §"biggest risk" is where that bill comes due.
