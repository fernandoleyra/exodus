# CORRIDOR — FINAL MVP DESIGN (v1.0, build-authoritative)

This supersedes all three competing designs. Where it differs from any of them, this document wins. Every "either/or" in the source material is resolved below; nothing is left to the builder's judgement except implementation detail.

---

## 1. Product thesis, positioning, and the two sentences

### Thesis

**A globe that flipbooks the entire world's bilateral migration system, one year per frame, 1990→2023, at 60fps, offline — and that shows, on the same arc, how much the best available evidence disagrees with itself.**

The spectacle and the epistemics are the same object. Every existing migration globe renders one number per arc, which is a lie, because no bilateral migration number on earth is observed — it is modelled, and two competent models of the same corridor disagree by tens of percent. CORRIDOR renders the disagreement as a visual property of the arc, dims the corridors of states with no statistical office so they cannot borrow the authority of German register data, and renders `—` where the world has no data. It is the first migration tool whose most striking image is an argument about what is not known.

### Positioning

- **Against the incumbents** (IOM Migration Data Portal, UNHCR RDF, Frontex, JRC Atlas): they are SaaS behind a 403, read-only outputs of someone else's assumptions, and they render modelled and observed figures identically. CORRIDOR is `git clone && pnpm i && pnpm dev` with the network cable out, and it makes `estimate_kind` a visual channel you cannot turn off.
- **Against the other dark-globe demos**: they animate particles. CORRIDOR animates nothing except the time cursor, under the user's hand, in discrete annual steps, because the data has no sub-annual resolution and implying one is the cheapest available lie.
- **Not a decision system.** There is no allocation solver, no placement shortlist, no departure forecast, no origin-side pressure index, and no person-shaped type anywhere in the schema. The absence is rendered as a screen, not buried in a README.

### The one sentence, twice

**To a minister:** "For every country on earth and every year since 1990, CORRIDOR shows you how many people moved where — and, on the same screen, exactly how much the best available evidence disagrees with itself, so you can see which of these numbers you are allowed to act on."

**To a hacker:** "A deck.gl globe that flipbooks 34 years of the global bilateral migration matrix at 60fps off a 40 MiB committed Parquet bundle with the network disabled, where arc dash density is cross-model disagreement, arc opacity is per-country data coverage, and a CI-enforced AST rule means no number can render outside `<Figure>`."

---

## 2. Final scope

### IN — numbered, each with a machine-checkable acceptance criterion

1. **Situation Globe (`_GlobeView`, globe-only, no basemap).** Opaque ocean sphere, 258 ADM0 polygons, 41,162 H3 r3 density cells, up to 12,000 great-circle corridors, graticule, labels.
 *Accept:* Playwright + SwiftShader renders ≥190 countries and the corridor layer at ≥55fps median over a 10s scripted orbit, with `--network=none`.
2. **The Year Machine — a flipbook, not a fade.** 1990→2023, 34 discrete frames, all GPU-resident, zero interpolation between years.
 *Accept:* dragging the full range holds ≥55fps median with no frame >50ms and **zero network requests**; a unit test asserts `transitions` is unset/0 for every data accessor; an AST rule fails the build if `transitions` appears in any layer whose data is annual.
3. **Cross-model disagreement on the period grid.** Gaskin & Abel (annual, summed to 5-year period totals) vs Abel & Cohen v6 (native 5-year), compared only at the six periods where both exist, rendered as a step function held constant within each period.
 *Accept:* a test asserts the disagreement series is piecewise-constant across each period and that no value is produced for a corridor-year outside the shared period grid.
4. **Model-internal spread, as a separate named channel.** Gaskin & Abel `mig_prev_std / mig_prev`, drawer-only, never conflated with (3).
 *Accept:* a string test asserts the UI never renders the words "confidence interval" or "uncertainty band" adjacent to the disagreement figure; the two channels have distinct labels in the lexicon fixture.
5. **Eurostat mirror statistics for EU pairs** — the only genuinely independent comparison in the product (two national statistical offices, not two fits to the same table).
 *Accept:* for a named EU pair, the drawer shows `migr_imm5prv[geo=B,partner=A]` and `migr_emi3nxt[geo=A,partner=B]` as two marks plus their divergence, with `OBS_FLAG` glyphs inline.
6. **Coverage-asymmetry encoding, computed by the platform.** Arc opacity is set in `semantic`; the layer author cannot override it.
 *Accept:* a type-level test proves `MapLayer.encode()` has no access to the opacity field; a screenshot pair shows Gulf and German corridors at visibly different authority.
7. **Service-stock headroom** (Liebig minimum over `K_stock`), with the binding indicator always named, negative values rendered as service deficits, per-indicator panel, never a scalar.
 *Accept:* banned-string linter passes **against the built bundle**; the returned object always contains `bindingIndicator` and a `perIndicator[]` of length ≥3 or a typed `Refusal`.
8. **Replacement-migration differential** (WPP VarID 2 − VarID 7, precomputed) with PSR and Sanderson–Scherbov POADR side by side, and a live constant-PSR bisection.
 *Accept:* bisection converges in ≤20 iterations at 1e-4 rel tol, or returns `Refusal('non-monotone')`; a golden test reproduces UN ESA/P/WP.160 Table 8 Scenario V for EU, Japan, Germany, USA, Italy.
9. **Radiation null model + CPC**, drawer-only, printed beside the Robinson & Dilkina 0.16 global reference.
 *Accept:* CPC of the radiation prediction against the spine, computed on a held-out year, renders as a figure with the 0.16 baseline beside it.
10. **`<Figure>` provenance discipline.** `{value, unit, sourceId, vintage, latencyDays, estimateKind, licence, ci}`. Missing renders `—` with a badge, never `0`.
 *Accept:* a JSX AST rule proves no numeric literal or numeric-typed expression renders outside `<Figure>`; a fixture with a deliberately missing value renders `—`.
11. **`/sources`** — the licence, cadence and *known-traps* ledger, with each connector's `plan()` output rendered as the exact URLs the system would fetch.
 *Accept:* every source in the manifest appears; the three exclusion rows (UN DESA, UNHCR, ACLED) are present; each trap paragraph is bound by id to a fixture-backed regression test that fails if the trap stops being true.
12. **`/methods`** — the refusals page: the CPC scoreboard first, then the model cards, then what was not built and why (the allocation solver at the top, with its full objective function, its weight vector, its three spec bugs and the GDPR Art. 22 constraint), then the UN's Scenario VI footnote.
 *Accept:* `/solve` 301s to `/methods#allocation`; the Scenario VI figure (Republic of Korea, 5.149 billion) renders with the UN's own footnote non-dismissibly.
13. **Typed refusals as a first-class kernel result.** `Refusal{code, reason, sourceIds}` rendered as a sentence; never `0`, never interpolated.
 *Accept:* three refusal paths are exercised in tests — `NoServiceStockData`, `NonMonotoneBisection`, `NoSharedPeriodGrid` — and each renders prose, not a number.
14. **Full offline first run.** Committed bundle ≤40 MiB; `--network=none` renders the whole product.
 *Accept:* `pnpm snapshot:measure` prints per-table compressed bytes and **fails CI above 40 MiB**; CI runs `pnpm dev` + Playwright with networking disabled at the container level.
15. **Connector contract, proven by use.** `pnpm gen:connector` → `pnpm ingest --only <id>` → `pnpm snapshot:build` adds a source with zero core edits.
 *Accept:* CI runs the full sequence for a demo connector and asserts **zero diffs outside `packages/connectors/<id>/` and `snapshot/`**.
16. **Recipe connectors for non-redistributable sources.** UN DESA IMS and UNHCR ship as code that writes to a gitignored path, tested offline against recorded fixtures, never shipped as bytes.
 *Accept:* `bundle:verify` **refuses** a deliberately inserted UNHCR row and names the reason in its stderr; a `transform()` unit test passes with the network off.
17. **Accessibility.** `Shift+G` text alternative, `prefers-reduced-motion`, non-colour encoding, `--border-interactive` on every control.
 *Accept:* axe-core clean on every route; `Shift+G` yields a sorted, keyboard-navigable top-25 table with `role="application"` + `aria-describedby`; reduced-motion disables the camera move entirely.
18. **One policy package (`@corridor/policy`) with one linter binary.** Importable, unit-tested, runs over source, copy, built bundle, package names, route paths and asset filenames.
 *Accept:* `pnpm check:policy` exits non-zero on a seeded violation of each of its six rule modules.

### OUT — numbered, each with why and when it comes back

1. **The allocation MILP / any placement shortlist.** *Why:* it is the one capability in the source designs that functions as a migration-control targeting tool; absence beats mitigation, and per-term decomposition of an invented weight vector is fake precision in its purest form. *Returns:* never in-box. The `Model` contract is the seam — a third party can implement one against the public SDK and inherit every policy rule.
2. **Any fitted econometrics — PPML, nested logit, gravity coefficients.** *Why:* IRLS with clustered SEs and a calibrated logit are research results, not build steps, and either can swallow the entire budget. *Returns:* v2, as a `Model` plugin, only after `pnpm fit` runs offline and the coefficients are committed with diagnostics.
3. **Ortega & Peri / any placeholder coefficient.** *Why:* a placeholder coefficient in a dark dashboard becomes a cited coefficient within a week. *Returns:* only attributed, only fitted, never badged.
4. **The SSE server and the live layer.** *Why:* "Vite SPA plus a server plus poll schedulers plus backoff plus a degradation state machine" is a second project, and none of the source designs budgeted it. v1 is a **static site**. *Returns:* M9, explicitly optional and flagged, as a ~150-line `pnpm live` sidecar. The incident ribbon already renders from the committed corpus, so if M9 never lands the product is unaffected.
5. **ADM1 polygons and the PMTiles build.** *Why:* every fact in v1 is ADM0-resolved, so subnational polygons would imply a resolution the data does not have — the product's own rule. It also deletes MapLibre, `@deck.gl/maplibre`, `pmtiles` and one gating unknown. *Returns:* when a v2 source is genuinely ADM1-resolved.
6. **FLAT / Web Mercator mode.** *Why:* per-capita people density must never render on Mercator, and with no basemap there is no zoom-12 use case left. It also removes the documented GlobeView↔MapView switching bug. *Returns:* if and only if an Equal Earth path exists.
7. **Scenario Studio, Compare, Brief, Corridor Graph, `/plugins`, `/o/{type}/{id}` ontology-generated pages.** *Why:* screens-per-hour; the globe *is* the corridor graph, and a code generator that produces slightly generic entity pages is the most reliable way to turn a day of screens into a week of debugging the generator. *Returns:* v2, one at a time, each earning its route.
8. **Live cohort-component projection engine.** *Why:* reproducing WPP medium to 0.5% at 2050 from raw `L(a)`/ASFR/SRB is a research result. WPP differentials ship as **precomputed columns**. *Returns:* v2 as a kernel model with WPP golden vectors.
9. **The occupational and vacancy dimension.** *Why:* ILOSTAT gives ISCO 1-digit crossed with birth status; vacancies cover ~37 reporters. A global occupational layer would be fabrication for 150 countries. *Returns:* when the data does.
10. **UN DESA IMS as shipped data.** *Why:* non-commercial, no derivative works — it cannot be in a CC BY bundle. *Returns:* never as bytes; ships now as a recipe connector.
11. **UNHCR in the committed bundle.** *Why:* licence contradictory across two verification passes. *Returns:* on written resolution with `webportal@unhcr.org`; recipe connector until then.
12. **ACLED, EM-DAT, IDMC/IDU, GADM, MIPEX, ReliefWeb, DTM, VIEWS, UNESCO UIS, gbOpen bulk.** *Why:* each blocked on independent licence grounds; UNESCO's CC BY-SA and IDMC's CC BY-NC-SA are contamination vectors for the whole data component. *Returns:* individually, on written terms.
13. **`@geoarrow/deck.gl-geoarrow`, kepler.gl, TerrainLayer, Tile3DLayer, MaskExtension, HeatmapLayer, ContourLayer, DuckDB-WASM.** *Why:* geoarrow's devDeps pin two minors behind and it ships no GeoJson/Icon layer; kepler collides on styled-components 6; the rest are unsupported on globe or unnecessary at 40 MiB. *Returns:* not planned.
14. **Bloom and all post-FX except FXAA and a subtle vignette.** *Why:* bloom's only job was the live incident layer, which is now corpus-replay and must not look live. *Returns:* with M9.
15. **Accounts, RBAC, WebSockets, remittance/trade/climate layers, 3D columns, agent-based simulation, any LLM that states figures, Git LFS, mobile.** *Why:* noise, or actively harmful. *Returns:* not planned.

---

## 3. Screen inventory

Six routes, four overlays. Nothing else ships a URL.

| Route | Screen | The primary question it answers |
|---|---|---|
| `/` | **Situation Globe** | *What did the whole world's migration system look like in year N, and where is that picture least trustworthy?* |
| `/place/:iso3` | **Country page** | *What do we actually know about this country, and how old is each thing we know?* |
| `/corridor/:orig-:dest` | **Corridor drawer** (overlay + permalink) | *How much do the two best models disagree about this specific corridor, and does anything independent corroborate either of them?* |
| `/headroom/:iso3` | **Service-stock headroom** | *Under a named, editable assumption set, which service is the binding constraint — and is it already in deficit?* |
| `/sources` | **Licence, cadence and traps ledger** | *Where did every number come from, may I redistribute it, and how does this source silently lie to me?* |
| `/methods` | **Refusals and scoreboard** | *What is the honest accuracy ceiling of this field, and what did this project refuse to build?* |

**Overlays:** `Cmd+K` palette (`>` actions, `#` datasets, `@` countries, `~` corridors — indexes no person-shaped type) · `Shift+G` globe text alternative · provenance popover (from any `<Figure>`, by click and by keyboard) · `saved_views` tray (never `watchlist`).

`/solve` 301s to `/methods#allocation`. `/plugins`, `/compare`, `/brief`, `/graph`, `/studio`, `/o/*` do not exist.

**`/methods` is the most persuasive screen in the product and it is almost entirely prose.** Order, top to bottom: (1) the CPC scoreboard — gravity 0.16, radiation 0.16, XGBoost+extended 0.21, ANN+extended 0.22 with a production function; 0.43 and 0.40 without one — with the sentence "roughly half the achievable accuracy in this field lives in getting origin outflow totals right, which is why we do not ship a fitted flow model"; (2) model cards for the five models; (3) the refusals, allocation solver first; (4) the UN's Scenario VI panel.

---

## 4. The exact data bundle for v1

Two tiers. **Tier A is committed to git** and is what `pnpm dev` uses with the network off — hard cap **40 MiB**, enforced by `pnpm snapshot:measure` failing CI. **Tier B** is a GitHub Release asset (<2 GiB each, up to 1000, no total-size or bandwidth cap). **No Git LFS, ever** — forks and pulls bill the parent repo's bandwidth until `git clone` breaks for everyone.

### Tier A — committed

| ID | Dataset & locator | Access method | Licence | Size (raw → committed budget) | Role |
|---|---|---|---|---|---|
| `gaskin-abel` | **Gaskin & Abel**, *Nature* 655(8121):148–157, Zenodo `10.5281/zenodo.17344747`, `mig_bilateral.csv` | Bulk CSV over HTTPS, one file, `plan()` returns one URL | CC BY 4.0 | 145,597,904 B → **9 MiB** | **The spine.** Annual bilateral 1990–2023, 230 countries. Top 12,000 corridors by mean 2015–2023 `mig_prev`, × 34 years ≈ 408k rows. Cols `orig, dest, year, stock_mean, stock_std, mig_prev, mig_prev_std, mig_brth, mig_brth_std`. Filter `orig == dest`. `estimate_kind='modelled'` on every row. Skip `T.nc` (3.3 GB). |
| `abel-cohen` | **Abel & Cohen v6**, figshare 14579241, file 53236079 | Bulk CSV over HTTPS | CC BY 4.0 | 65,341,478 B → **1 MiB** | Second model for disagreement. 232 countries, `year0 ∈ {1990…2015}`. **Sum `sex ∈ {female,male}` — there is no total row. Filter `type='outward'` — never sum across `{outward,return,transit}`, that triple-counts.** Estimator `da_pb_closed`; other two kept as within-method spread. Aggregated to the 12k spine corridors × 6 periods. |
| `eurostat-mirror` | Eurostat `migr_imm5prv`, `migr_emi3nxt` | JSON-stat 2.0, no key; chunk by year to stay under the 5,000,000-cell cost ceiling | CC BY 4.0 (Dec. 2011/833/EU, commercial reuse explicit) | — → **0.5 MiB** | The only genuinely independent comparison in the product: two national statistical offices on the same pair. EU pairs, both directions, last 10 years, with `OBS_FLAG`/`CONF_STATUS` per row. |
| `eurostat-asylum` | Eurostat `migr_asyappctzm` | JSON-stat 2.0 | CC BY 4.0 | 103,640,312 rows source → **2 MiB** | The only true sub-annual bilateral series. Last 24 months, EU+EFTA destinations × ~190 citizenships, through 2026-08. One figure on `/place`, one row on `/sources`, ~4-week lag badge. Never "real-time". |
| `wpp` | **UN WPP 2024**, `.csv.gz` bulk | HTTPS, **multi-member gzip reader mandatory** | Open | — → **5 MiB** | Demography. 2024 population by single-year age × sex (237 countries); `L(a)`, ASFR, SRB for the bisection; **precomputed VarID 2 (Medium) − VarID 7 (Zero migration)** totals per country-year 2024–2050; PSR and POADR series. Ingest normalisation: `SRB/100`, `ASFR/1000`, `population×1000`. Filter `LocTypeName='Country/Area'`. |
| `wdi-who` | WDI v2 + WHO GHO (`ghoapi.azureedge.net/api`) | REST JSON, no key | CC BY 4.0 | — → **1 MiB** | Capacity indicators: population, `NY.GDP.PCAP.PP.KD` (**constant 2021 international $**), physicians / nurses+midwives / beds per 1,000, health spend pc, dwellings proxy, urbanisation. GHO: key on `TimeDim` not `Date`; **the array is unsorted — sort before taking latest**. |
| `cepii` | **CEPII Gravity 202211** | Bulk download | Etalab 2.0 | — → **0.5 MiB** | Dyad context for the drawer: `dist, distcap, distw_harmonic, contig, comlang_off, comlang_ethno, comcol, col45, comrelig, scaled_sci_2021`, restricted to the 12k spine corridors. **`distw`, `distwces`, `colony`, `smctry` do not exist in Gravity.** |
| `ghs-h3` | GHS-POP → H3 r3 | Derived at ingest | CC BY 4.0 | — → **1 MiB** | 41,162 cells storing `pop` and `area_km2` so the renderer computes **density**, never raw count. r3 is the ethical cap for gridded people layers. |
| `iom-mm` | IOM Missing Migrants | Per-year CSV | CC BY 4.0 — the only unambiguously redistributable IOM dataset | — → **0.2 MiB** | ADM0-aggregated **annual counts only. Coordinates dropped at ingest. No map layer, ever.** |
| `naturalearth` | Natural Earth 5.1.1 `ne_10m_admin_0_countries` + `ne_10m_admin_0_disputed_areas` | Bulk, naciscdn | **Public domain / CC0, no attribution required** | — → **3 MiB** | 258 ADM0 polygons, simplified for globe, as compressed GeoJSON — **no PMTiles, no vector tiles, no basemap.** POV via `COALESCE(NULLIF(fclass_{pov},''), fclass_iso)` — `FCLASS_US` is null for 249/258 records. |
| `centroids` | derived from ADM0 | Derived | CC0 | → **tiny** | 258 arc endpoints. Corridors are 2-vertex great circles between these and nothing else. |
| `xwalk` | hand-built, versioned | Committed table | CC0 | → **tiny** | **A versioned table with validity date ranges, not a dict literal.** Five namespaces: UN M49, ISO3, Eurostat GEO (`UK` not `GB`, `EL` not `GR`, `XK`), OECD `REF_AREA` (+`W`), UNHCR legacy (**`AUS`=Austria collides with ISO Australia; `CHI`=China**). Explicit rows for Kosovo, Taiwan, Palestine, Western Sahara, Curaçao, Sudan-2011, Serbia-Montenegro-2006, USSR, Yugoslavia. |
| `corpus` | GDELT events / USGS / GDACS | Recorded replay corpus | GDELT redistribution explicitly permitted with citation; USGS/GDACS public | → **6 MiB** | **72 hours only. GKG excluded** (~5.3–5.9 MB per 15-min slot). Each entry `{url, fetchedAt, sha256, httpStatus, redirectChain}`. Drives the incident ribbon in `SNAPSHOT` chrome — **no pulse, no emissive, no bloom in v1.** |
| `fixtures` | per-connector recorded responses + a 2 MiB demo slice | Committed | per-source | → **4 MiB** | Makes every `transform()` unit-testable with the network off, and makes `pnpm snapshot:build --from-fixtures` runnable offline. This is what lets the agent test the ingest pipeline it cannot run. |

**Budget total ≈ 33.4 MiB against a 40 MiB cap.** Measured at M0, published to `/sources`.

**Pre-decided cut ladder if `snapshot:measure` exceeds 40 MiB** (apply in order, do not improvise): corpus 72h → 24h · corridors 12,000 → 6,000 · asylum 24 months → 12 · drop `stock_mean`/`stock_std` from the render table (drawer-only via Tier B).

### Tier B — GitHub Release asset, `pnpm data:full`
`flows_full.parquet` — all Gaskin & Abel corridors, all 34 years, all uncertainty columns (~1.8M rows). The globe renders the top 12k either way; Tier B unlocks arbitrary corridor lookup and the full `Shift+G` table.

### Recipe connectors — code shipped, bytes never
`undesa-ims` (non-commercial, no derivatives; needs `User-Agent: Mozilla/5.0 (X11; Linux x86_64)` or `un.org` 403s; 173 of 233 countries are 2020 extrapolations → per-country `revision_status`) · `unhcr` (licence unresolved; **send `cf_type=ISO` or `coa=DEU` returns 0 rows at HTTP 200**; `yearFrom`/`yearTo` only; join on `coo_iso`/`coa_iso`; numerics are strings and `"-"`; values <5 rounded to nearest 5 with **no asterisk convention — do not build asterisk parsing**).

Each writes to a gitignored path, prints the licence text before running, is excluded from `snapshot:build` outputs, and is unit-tested offline against its recorded fixture.

### The single most important data decision, and its pre-decided failure path

**The spine is Gaskin & Abel** because it is annual (not quinquennial), 1990–2023, CC BY 4.0, and the only global bilateral source shipping per-cell uncertainty — the property the entire product rests on. Its cost is stated on every arc: neural-network ensemble output, 73% test correlation, never derived by aggregating individual records, African net migration least certain.

**M0 verifies it with the network on, before any product code.** The connector's `transform()` asserts the exact column list; an unexpected schema fails ingest with a named error printing observed-vs-expected columns, and the fix is one file (`packages/connectors/gaskin-abel/schema.ts`) because the fact table is the interface.

**If the DOI, file or schema does not resolve exactly as specified, the fallback is decided now and the agent does not stall:**
- `abel-cohen` (verified locator, verified header) becomes the spine.
- The Year Machine becomes **6 period steps** (1990-95 … 2015-20) instead of 34 annual frames. The handle, the flipbook and the headline all survive; "34 years" becomes "30 years in six steps".
- Cross-model disagreement degrades to Abel & Cohen's **within-method** spread across `da_min_open` / `da_min_closed` / `da_pb_closed`, **relabelled as within-method everywhere**, plus the Eurostat mirror for EU pairs as the only cross-source comparison.
- `/methods` gains a refusal entry recording the failed resolution, with the date and the HTTP status.

---

## 5. The exact models in v1

Five. All pure, all seeded, all in `@corridor/kernel`, no I/O, no `Date.now()`, no `Math.random()`. Every model returns `Result<T> = Ok<T> | Refusal`.

```ts
type Refusal = { kind: 'refusal'; code: RefusalCode; reason: string; sourceIds: string[] };
type RefusalCode = 'NoServiceStockData' | 'NonMonotoneBisection' | 'NoSharedPeriodGrid'
                 | 'NoMirrorPair' | 'InsufficientHistory';
```
A `Refusal` renders as a sentence. **Never `0`. Never interpolated. Never an em-dash without the reason behind it.**

### M1 — Service-stock headroom (Liebig minimum)

For country `c`, horizon `T` years, over `K_stock = {physicians, nurses+midwives, hospital beds, dwellings, health spend per capita}`:

```
H_k = ((r_k / t_k) − 1) · P / T          for each k ∈ K_stock
H   = min_k H_k
binding = argmin_k H_k
```

`r_k` and `t_k` are expressed **in the same per-capita units**, so the ratio is dimensionless — this is the form that structurally prevents the factor-of-1,000 error (never multiply a per-1,000 rate by population without dividing by 1,000). The minimum is taken **over stock ratios only**; taking it over flow or utilisation indicators yields ≤0 for every country on earth (216/216 at or below a 100% electricity target) and is a category error.

Returns `{value, bindingIndicator, perIndicator[]}` or `Refusal('NoServiceStockData')` when fewer than three `K_stock` indicators exist for `c`. The binding indicator is **always named on screen**. WHO's 4.45 doctors+nurses+midwives per 1,000 is labelled **a floor, explicitly not an optimum**. Negative `H` renders as a **service deficit in warm hue**, with the panel note: *"This formula holds service stock fixed while growing population. Migrants bring physicians. It therefore systematically understates."* Mandatory label: *"Modelled labour-market absorption under assumption set «name» — not a policy limit."* Banned strings (`capacity limit`, `carrying capacity`, `maximum`, `threshold`, `saturation`) are linted **against the built bundle**.

### M2 — Replacement-migration differential and constant-PSR bisection

`PSR = P[15,64] / P[65+]` — the UN definition. A working-age population of 20–64 systematically overstates replacement need.

Precomputed column: `D(c,y) = Pop_VarID2(c,y) − Pop_VarID7(c,y)` for 2024–2050 — the officially sanctioned migration counterfactual and the product's core demographic primitive.

Live computation, the only one: bisect for the constant annual net intake `m` such that `PSR(c, y_target; m) = PSR(c, y_0)`.

```
Guard 1: assert sign(f(m_lo)) ≠ sign(f(m_hi))   else Refusal('NonMonotoneBisection')
Guard 2: assert f monotone on a 9-point scan    else Refusal('NonMonotoneBisection')
Converge: ≤20 iterations, 1e-4 relative tolerance
```
Monotonicity genuinely fails for age profiles weighted toward 65+. Sanderson–Scherbov POADR renders beside every conventional figure, because the gap is the story (Germany +11.3% vs +49.2%). UN ESA/P/WP.160 Table 8 ships as static golden vectors, including **Scenario VI: Republic of Korea, 5.149 billion**, with the table's own footnote *"Scenario VI is considered to be unrealistic"* rendered non-dismissibly. That footnote is the strongest argument in the product that capacity is not a number, and it is made by the primary source, not by us.

### M3 — Cross-model disagreement, on the period grid

**This is not uncertainty and must never be labelled as such.** Both models are fitted to the same underlying stock tables; their agreement is correlated. The permanent on-screen note reads: *"Model disagreement. Both estimates derive from the same underlying stock tables, so this is a lower bound on true uncertainty, not a confidence interval."*

For corridor `(o,d)` and period `p ∈ {1990-95, …, 2015-20}`:

```
A_p = Σ_{y ∈ p}  GA.mig_prev(o,d,y)                        (annual → period total)
B_p = Σ_{sex}    AC.da_pb_closed(o,d,p, type='outward')
d_p = |A_p − B_p| / ((A_p + B_p) / 2)      clamped to [0, 2]
```

Compared as **period totals**, never by annualising Abel & Cohen. The assumption is stated in the tooltip: the two methods count within-period repeat and return moves differently, and that difference is part of the disagreement rather than noise. `d_p` is **held constant across every year in the period** — the hatch density visibly steps at period boundaries, which is what the data does. Corridor-years outside the shared grid return `Refusal('NoSharedPeriodGrid')`.

**M3b — model-internal spread**, a separate channel with a separate name, drawer-only:
```
s(o,d,y) = GA.mig_prev_std(o,d,y) / GA.mig_prev(o,d,y)
```

**M3c — Eurostat mirror divergence**, EU pairs only, the single genuinely independent comparison in the product:
```
m = |I − E| / ((I + E) / 2),  I = migr_imm5prv[geo=d, partner=o],  E = migr_emi3nxt[geo=o, partner=d]
```
rendered as a third mark with `OBS_FLAG` glyphs inline. Non-EU pairs return `Refusal('NoMirrorPair')`.

### M4 — Coverage-asymmetry score (author construction, badged as such)

Per country `c`:
```
C = 0.4·(m/M) + 0.3·exp(−Δt / 5yr) + 0.3·f_obs      C ∈ [0,1]
```
where `m/M` is measures present over measures requested, `Δt` is the age of the newest vintage, and `f_obs` is the share of rows with `estimate_kind ∈ {observed, observed_flagged}`. Corridor opacity is `min(C_o, C_d)`. **Computed in `semantic`; the layer author cannot set it.** Badged "this project's construction, no literature claimed" in the UI and in `PARAMETERS.md`. Its job: Gulf labour corridors, China, Russia and Iran must not render with the visual authority of German register data.

### M5 — Radiation null model and CPC

Parameter-free, drawer-only, **explicitly a null model and never the baseline**:
```
T_ij = T_i · (m_i · n_j) / ((m_i + s_ij)(m_i + n_j + s_ij))
CPC  = 2·Σ min(T_ij, T̂_ij) / (Σ T_ij + Σ T̂_ij)
```
Computed on a held-out year, printed beside the Robinson & Dilkina (COMPASS '18, doi:10.1145/3209811.3209868) global reference: gravity-exponential 0.16, gravity-power 0.16, radiation 0.16, XGBoost+extended 0.21, ANN+extended 0.22 **with** a production function; 0.43 and 0.40 **without**. Stating that in the UI is worth more than shipping a mediocre gravity fit.

### Not implemented, and no placeholders shipped
PPML · nested logit with multilateral resistance · any Ortega & Peri coefficient · `β_dist`, `β_comlang`, `β_contig` at any magnitude · diaspora or visa elasticities · the migration hump · any Displacement Pressure Index or composite with author-invented weights · the allocation MILP · any forecast of departures · any origin-side risk or pressure score · any cohort scoring.

---

## 6. Architecture

### Package layout

```
packages/
  contracts/     [Apache-2.0] Zod schemas + TS interfaces + generated JSON Schema.
                 Zero deps beyond Zod. Three contracts, nothing else.
  sdk/           [Apache-2.0] gen:connector scaffold, defineSource/defineModel/defineLayer,
                 the record-replay HTTP client — the ONLY way a connector touches the network.
  kernel/        M1–M5. Pure. → contracts only. No I/O, no clock, no RNG.
  policy/        layer_policy.yaml, verdict function, suppression, the six lint rule modules,
                 the frozen suppression ledger. Importable and unit-tested, not a CI script.
  semantic/      joins, align(), latency/licence/vintage inheritance, coverage-asymmetry,
                 the AttributeCube builder. → contracts, registry, store, kernel, policy
  registry/      layer + model + source registry, data-driven from snapshot/manifest.json
  store/         timeStore, workingSet. → contracts
  ui/            <Figure>, provenance popover, tokens, Refusal renderer. → contracts, semantic
  globe/         deck.gl layers, AttributeCube consumer. → contracts, semantic
  connectors/*   one per source. → contracts, sdk  [ONLY]
apps/
  web/           Vite SPA, static output. → ui, globe, semantic
  cli/           ingest, snapshot:build, snapshot:measure, bundle:verify, gen:connector, check:policy
```

**v1 is a static site.** No server, no API, no SSE, no WebSockets. `pnpm build` produces a directory you can host on anything.

### The three plugin contracts

Three, not seven. Each must have **≥2 independent implementations at merge** — satisfied naturally (DataSource: a bulk CSV, a JSON-stat REST source, a recipe connector; MapLayer: arc, choropleth, h3; Model: five).

```ts
export interface PluginManifest {
  id: string;                          // reverse-DNS: org.corridor.eurostat
  apiVersion: `${number}.${number}`;   // hard major gate; mismatch refuses by name, never crashes
  version: string;
  license: { spdx: string; url: string; attribution: string; redistributable: boolean | 'unknown' };
  capabilities: ('net:https' | 'fs:corpus' | 'kernel' | 'layer')[];
}

export interface DataSource<T> {
  schema: ZodType<T>;
  cadence: Cadence;                    // 'sub-hour'|'daily'|'monthly'|'quarterly'|'annual'|'quinquennial'|'frozen'
  latencyClass: LatencyClass;          // 'live'|'daily'|'periodic'|'annual'|'modelled'|'projected'
  coverage: { iso3: string[]; years: [number, number] };
  plan(ctx): FetchPlan[];              // declarative and INSPECTABLE WITHOUT RUNNING — rendered on /sources
  fetch(plan, ctx): Promise<RawArtifact>;  // the only I/O, through the replay client
  transform(raw): Fact[];              // PURE. Fixture-tested. No network, no clock. Asserts its schema.
}

export interface Model<I, O> {
  id: string;
  inputs: ZodType<I>; outputs: ZodType<O>;
  assumptions: AssumptionSpec[];       // every parameter, with provenance and `placeholder: boolean`
  run(inputs: I, world: WorldView, seed: number): Result<O>;   // PURE; may return Refusal
}

export interface MapLayer {
  id: string;
  geometry: 'arc' | 'choropleth' | 'h3' | 'point';
  encode(facts: Fact[]): LayerSpec;    // CANNOT set opacity, latencyClass or estimate_kind styling —
}                                      // those are computed in `semantic` and merged after encode()
```

### Fact table — the interface everything crosses

```
migration_fact(origin_iso3, dest_iso3, year,
  period_type   'annual'|'5yr'|'monthly'|'quarterly',
  sex 'm'|'f'|'t', age_band, measure_code, value NUMERIC,
  source_id, vintage_date, latency_days,
  estimate_kind 'observed'|'observed_flagged'|'modelled'|'extrapolated'|'assumed_zero',
  obs_flag NULL, conf_status NULL, ci_low NULL, ci_high NULL,
  license_id TEXT NOT NULL, redistributable BOOLEAN NOT NULL)
```
`license_id` and `redistributable` are **mandatory columns on every row**, not documentation. A row without them fails ingest. `align(series, grid, method)` defaults to `"none"` — a missing year is a visible gap on the sparkline, never a silent interpolation.

### The Year Machine, decoupled from the spine

```ts
// packages/semantic/attribute-cube.ts
buildAttributeCube(facts: Fact[], manifest: SnapshotManifest): AttributeCube
```
Generic over `(entityPairId, year, value)`. Corridor count, year range and attribute list come from `snapshot/manifest.json`, written by the build — **not from any dataset's name**. Swapping the spine changes the manifest, not the renderer.

At load, build one pre-quantised buffer per animated attribute per year: 34 × 12,000 × {width f32, dashArray 2×f32, color u8×4} ≈ 8 MB GPU-resident. Scrubbing swaps buffer references and bumps `updateTriggers`. Zero re-tessellation, zero CPU geometry work.

**No `transitions` on any data accessor. Ever.** The handle moves continuously; the data steps. The track is notched at 34 positions, the year renders at 44px tabular-nums, and the tooltip reads *"Annual estimates. No values are interpolated between years."* Under `prefers-reduced-motion` the behaviour is identical, because it was already honest.

*Acceptance:* `buildAttributeCube` is tested against a synthetic 3-corridor 4-year fixture and against the real snapshot through the same code path.

### Globe layer stack (top to bottom)

1. `TextLayer` — country labels, `CollisionFilterExtension`, top-N by flow
2. `ScatterplotLayer` — incident ribbon from corpus, `SNAPSHOT` chrome, **no pulse, no emissive**
3. `PathLayer` — all corridors, great circles tessellated to **32 points**, `PathStyleExtension({dash: true})`. One geometry carrying three channels: **width** = flow (per-capita default), **dash density** = `d_p` disagreement, **opacity** = coverage-asymmetry `C`. `ArcLayer` cannot be dashed and `PathStyleExtension` does not support it, so `PathLayer` is not optional.
4. `H3HexagonLayer` — r3, `highPrecision: 'auto'` (**never forced `false`** — high precision is required at res 0–5 and for pentagons), rendering `pop / area_km2`, never raw count
5. `SolidPolygonLayer` — 258 ADM0 polygons, choropleth
6. `GeoJsonLayer` — graticule, 10°
7. **Opaque ocean sphere — mandatory, not optional.** `cullMode:'none'` is a per-layer override, so without it far-side marks bleed through the Earth.

Feature count at default view: ~41k hexes + 12k paths + 258 polygons ≈ 53k features across 7 layers — far inside deck.gl's documented 60fps-to-1M ceiling. Post-FX: `fxaa` always, `vignette` subtle. **No bloom in v1** (its only subject was the live layer). No chromatic aberration — it exists only as a prop of the bloom lens pipeline and colour-fringing a data visualisation is a correctness bug.

### Pinned toolchain

pnpm 12.4.2 · Turborepo 2.11.2 · Node 24.21.0 LTS · TypeScript 7.0.2 with `erasableSyntaxOnly` (**no `enum`, no `namespace` — const objects + string unions, or TS1294**) · Vite + React · Zod 4.6.5 · Biome 2.5.14 · Vitest 5.0.1 · Playwright 1.63.0 (`--use-gl=angle --use-angle=swiftshader-webgl --enable-unsafe-swiftshader`) · `deck.gl@9.4.0` · `@luma.gl/core@9.4.1` · `@luma.gl/effects@9.4.1` (post-FX lives here, not `shadertools`) · `apache-arrow@21.2.0` · `h3-js@4.5.0` · `@loaders.gl/parquet@4.5.1`.

Arrow tables are read into plain typed arrays and handed to stock deck.gl layers via `data: {length, attributes}`. **No `@geoarrow/deck.gl-geoarrow`, no MapLibre, no PMTiles, no DuckDB-WASM, no kepler.gl.**

Scenario permalinks: `base64url(deflate-raw(json))` — `CompressionStream` supports gzip/deflate/deflate-raw only, not zstd. Encodes year cursor, camera, layer visibility, working set, headroom assumption set. A permalink, not a scenario engine.

### One policy package, one linter binary

`@corridor/policy` exports a tested verdict function and six rule modules that share **one file walk** in `pnpm check:policy`. This is the single most important budgeting decision in the build: twelve separate CI scripts are twelve mini-projects; six rule modules behind one walker is one afternoon.

1. **Lexicon** — structured on Mendelsohn & Budak's seven dehumanising source concepts (animal, vermin, parasite, physical pressure, water, commodity, war); UNGA Res. 3449 (XXX)'s "non-documented or irregular migrant workers" as the required form. Runs over source, copy, **the built bundle**, package names, route paths, asset filenames and the repository name.
2. **Banned strings** — `capacity limit`, `carrying capacity`, `maximum`, `threshold`, `saturation`, `real-time` (adjacent to a stock or flow), `PPML is unbiased`, `confidence interval` (adjacent to disagreement). Same walker, different word list.
3. **Banned schema fields** — `person`, `individual`, `case_id`, `applicant`, `biometric`, `name`, `dob`. Same walker.
4. **Banned visual motifs** — `crosshair`, `reticle`, `radar`, `sweep`, `target`, `track`, `lock`, `watchlist`, `dossier` in identifiers and asset names. Schema renames enforced: `watchlist → saved_views`, `target → area_of_interest`, `entity → place|indicator`.
5. **`<Figure>` AST rule** — no numeric literal or numeric-typed expression renders outside `<Figure>`.
6. **Geometry + policy verdict** — movement `LineString` with >2 vertices rejected at construction (Zod refinement, unit-tested); nationality × sub-ADM0 returns a `PolicyVerdict{deny, code, body}` rendered as a refusal sheet with the machine-readable body shown as JSON. The **403-not-451** specification (RFC 7725 reserves 451 for legally-compelled blocking) is documented and the *verdict function* is tested; there is no server in v1 to return a status code.

Separately and cheaply: `no-restricted-syntax` ESLint rule banning `Date.now()` outside `packages/kernel/clock`; `dependency-cruiser` config for the import graph; `pnpm check:dogfood` restricted to `connectors/*` only (they may import `@corridor/contracts` + `@corridor/sdk` and nothing else).

Suppression: K=25 at ADM0×ADM0, denominator floor 10,000, complementary suppression, **frozen suppression with an append-only ledger committed as `snapshot/suppression-ledger.json`** and a test asserting append-only. Rounding runs **after** suppression, never instead of it.

Licensing: `contracts` and the connector template **Apache-2.0** (the patent grant matters for implementers); everything else **AGPL-3.0-or-later**, with the README stating §13's actual scope — the offer of Corresponding Source runs to *all* users interacting over a network, including internal ones, with no "public" qualifier. REUSE 3.3 (`REUSE.toml`; DEP5 is deprecated and mutually exclusive), DCO sign-off rather than a CLA. The README states the OSD clause 5/6 trade-off out loud rather than hiding it.

Redress: `.github/ISSUE_TEMPLATE/harm-report.yml`, monitored address, **30-day response SLA**, power to de-publish a layer, public de-publication log. Viewer privacy: zero third-party scripts, cookieless self-hosted analytics, 7-day retention, IP truncated to /24 IPv4 and **/32 IPv6** (a /48 can still single out a household).

---

## 7. The visual and interaction signature

Five things. If a stranger screenshots the product, these are what make it unmistakably this product and not any other globe.

1. **The flipbook.** One handle, 34 discrete global frames, the year at 44px in the corner, nothing else moving. The motion is time, under the user's hand, and it never eases between years. Competitors ease; easing implies a resolution the data does not have. The stepping *is* the signature.
2. **Dashes mean doubt, and they step.** Arc dash density is cross-model disagreement, held constant within each 5-year period, so as you scrub you watch the hatch pattern change at period boundaries — a visible, honest artefact of the fact that the two models live on different time grids. Solid means the models agree within 10%. Half the globe is visibly hatched.
3. **Dimness means nobody counted.** Arc opacity is the coverage-asymmetry score, computed by the platform, unavailable to any layer author. Gulf labour corridors, China, Russia and Iran are literally faint. It reads in half a second and it is an argument about epistemics.
4. **Warm hue never means people.** The three-slot map palette (`#3987e5`, `#d95926`, `#199e70` — all-pairs ΔE2000 41.5 normal / 16.5 protan / 18.2 deutan) carries direction and selection. Red, orange and yellow are reserved for *service and rights deficits*. Negative headroom — which is the true state of nearly every country under WHO floors — renders as a warm deficit field, because that is what it is.
5. **Refusal is a rendered surface.** `—` with a badge instead of `0`. Typed refusals rendered as sentences ("no unique solution: PSR is non-monotone in intake for this age profile"). `/methods` as the loudest screen in the product, opening with the field's honest accuracy ceiling and closing with what this project would not build. `/sources` listing three exclusions by name. A product that renders its own gaps at full weight is a stronger image than any particle system.

Supporting invariants, non-negotiable: `--scrim-globe: rgba(6,8,12,.72)` behind every label over the WebGL canvas (every measured contrast ratio is void over a GL canvas without it) · `--border-interactive #5C6B85` (3.58:1) around every interactive control, never `--border-default #2A3242` (1.50:1, decorative only) · one global AS-OF chip showing the **oldest** contributing vintage (showing the newest is the lie) · type 11/12/13/15/18/24/32/44, tabular-nums everywhere · symmetric in/out arcs and per-capita by default · default camera on the Global South, justified in the tooltip by the 53% intra-regional figure.

**The one aesthetic override, owned up front:** a 2.4s establishing camera move. The world is fully rendered at frame one — no layer pops in, no mark animates, only the camera moves. Once per session (`sessionStorage`), cancelled by any input, zero-length under `prefers-reduced-motion`, deterministic keyframes, ends at the default camera. It is implemented **last**, in M8, and if it is not done the product ships without it.

---

## 8. Milestones

Each milestone must run end-to-end from a cold install before the next begins. Each has a state you can show someone.

**M0 — Resolve and gate. Network ON. Nothing else happens until this passes.**
*Demo:* three screenshots in `docs/smoke/`, a filled `DECISIONS.md`, and a printed size table.
*Accept:* (a) `gaskin-abel` resolves — DOI, file name and every column asserted against the spec; **if it does not, the pre-decided fallback in §4 is applied and recorded, and the build continues**; (b) `_GlobeView` renders an opaque sphere + 12,000 32-point dashed paths + 41,162 H3 r3 hexes at **≥55fps median over a 10s scripted orbit** on integrated graphics, measured by a committed Playwright harness — failing this drops corridors to 6,000, then 4,000; (c) `apache-arrow@21.2.0` → typed arrays → deck.gl works without geoarrow; (d) `pnpm snapshot:measure` prints real compressed bytes per table and the total is under 40 MiB, or the §4 cut ladder is applied on the spot.

**M1 — Ingest, snapshot, manifest. The true gate.**
*Demo:* `snapshot/` exists, `SNAPSHOT.md` reports measured sizes, `/sources` data is real.
*Accept:* `pnpm ingest && pnpm snapshot:build` produces every Tier A file from raw sources; `pnpm snapshot:build --from-fixtures` produces the 2 MiB demo slice **with the network off**; every row carries `license_id` and `redistributable`; `bundle:verify` refuses a deliberately inserted UNHCR row and names the reason; the crosswalk resolves all five namespaces with `AUS`, `CHI`, `UK`/`GB`, `EL`/`GR`, `XK`, Sudan-2011 unit-tested; WPP normalisation is unit-tested (`SRB/100` must not yield a 99.1% male birth share) and the **multi-member gzip reader is asserted to return >600,000 rows, not 634 bytes**; Abel & Cohen is asserted to be summed across sex and filtered to `type='outward'`.

**M2 — Globe v1, offline.**
*Demo:* the whole world, on a plane.
*Accept:* `git clone && pnpm i && pnpm dev` with **`--network=none`** renders ≥190 countries, ADM0 choropleth, H3 density as `pop/area_km2`, and the top 12k corridors at the Global South default camera; the three-slot palette is the only colour used for people; the AS-OF chip shows the oldest contributing vintage.

**M3 — The Year Machine.**
*Demo:* the headline. One handle, 34 years, the whole planet.
*Accept:* dragging 1990→2023 holds **≥55fps median with no frame >50ms and zero network requests**; a test asserts no `transitions` on any data accessor; the notched track steps to integer years; the year is legible at 44px; arrow keys step and `Space` plays; `AttributeCube` passes its synthetic-fixture test.

**M4 — Provenance and `/sources`.**
*Demo:* click any number, see its papers.
*Accept:* the `<Figure>` AST rule passes and fails a seeded violation; a missing value renders `—` with a badge and never `0`; the provenance popover shows source, vintage, latency days, estimate kind, licence, CI; `/sources` lists every source with its `plan()` URLs, its measured bundle size, its known traps, and the three exclusion rows; **each trap is bound by id to a fixture-backed regression test**.

**M5 — Corridor drawer: the three ignorance channels.**
*Demo:* the screen that wins the argument.
*Accept:* every corridor shows the two period-grid model estimates and `d_p`, labelled "model disagreement" with the correlation caveat; EU pairs show the mirror pair as a third mark with `OBS_FLAG` glyphs; `s(o,d,y)` renders as a separately named model-internal spread; the dash density on the globe visibly steps at period boundaries; the radiation null model and CPC render against the 0.16 reference; `comcol` and `col45` are a **radio group, never two checkboxes**; the >2-vertex guard rejects in tests.

**M6 — `/place` and `/headroom`.**
*Demo:* pick any of 190+ countries, get a dense one-screen answer.
*Accept:* 12 figures render for **every** country with `—` where absent; headroom names its binding indicator and returns a `Refusal` below three indicators; banned-string lint passes **against the built bundle**; negative headroom renders as a warm-hue deficit with the understatement note; the bisection converges in ≤20 iterations or returns `Refusal('NonMonotoneBisection')`; the WPP differential and POADR render side by side.

**M7 — `/methods` and the policy package.**
*Demo:* the refusals page. Cheap prose, highest persuasion per hour in the build.
*Accept:* the CPC scoreboard is the first thing on the page; the five model cards render with `placeholder` flags (all false — no placeholders ship); the refusal list renders with the allocation solver first, showing its objective function, its weight vector `w_E .30, w_P .25, w_N .15, w_L .10, w_H .08, w_K .05, w_F .07`, its three spec bugs as open issues, and the GDPR Art. 22 constraint; `/solve` 301s here; the Scenario VI panel renders 5.149 billion with the UN's footnote, non-dismissibly; `pnpm check:policy` exits non-zero on a seeded violation of each of its six rule modules.

**M8 — Connector proof, a11y, entry.**
*Demo:* a stranger adds a source; the globe is keyboard-usable; the camera move exists.
*Accept:* CI runs `pnpm gen:connector demo-wdi-gdp && pnpm ingest --only demo-wdi-gdp && pnpm snapshot:build` and asserts **zero diffs outside `packages/connectors/demo-wdi-gdp/` and `snapshot/`**; `check:dogfood` passes over `connectors/*`; `Shift+G` yields a sorted keyboard-navigable top-25 table; axe-core clean on all six routes; no encoding is colour-alone; the entry animation is provably skippable, once-per-session, zero-length under reduced motion, and animates no data mark.

**M9 — OPTIONAL, FLAGGED: the live sidecar.** Only if M0–M8 are complete and green.
*Demo:* incidents appear while you watch.
*Accept:* `pnpm live` starts a standalone Node process exposing `GET /live/stream?sources=a,b` (SSE, not WebSockets); GDELT `lastupdate.txt` polled on a 60s timer acting on slot change (rewrite `http://` → `https://`; the translingual feed lags one slot; **GEO 2.0 is 404 — do not build it**); GDACS read from `alertlevel`/`alertscore`/`episodealertlevel`, **never the icon path**; USGS 5 min; backoff full jitter, base 1s, cap 300s, `degraded` after five failures with a struck-through legend entry that **does not disappear**; killing the process walks `LIVE → CACHED → SNAPSHOT` with no layer vanishing; bloom is enabled only while the stream is genuinely LIVE. **If M9 does not land, the product is complete.**

---

## 9. Decision register

| # | Decision | Reason (one line) | Rejected alternative |
|---|---|---|---|
| 1 | Product is **CORRIDOR**; `EXODUS` is retired from repo, packages, env vars and ids | "Exodus" is mass-flight-under-duress imagery in the war/pressure family of the seven source concepts the project's own lexicon lint is built on; a name that fails your own CI gate is the first credibility hole a critic finds | Keeping EXODUS as the platform and CORRIDOR as the app |
| 2 | **Cut the allocation MILP entirely**; render its absence at `/methods#allocation` | Its output is a ranked placement shortlist over destinations for people; on a targeting-tool axis, absence beats mitigation, and a human-actor-id gate does not fix the epistemics | Shipping it behind a human-actor gate and an adversary-AUC test |
| 3 | **No fitted models, no placeholder coefficients** | A placeholder coefficient in a dark dashboard becomes a cited coefficient within a week; PPML-as-IRLS and a calibrated nested logit are research results that can swallow the entire budget | Shipping `β_dist`/`β_comlang`/`β_contig` behind a "placeholder" badge |
| 4 | Spine is **Gaskin & Abel**, with a pre-decided fallback to Abel & Cohen | Only global bilateral source that is annual, CC BY 4.0, and ships per-cell uncertainty — the property the whole product rests on; the fallback exists because an offline agent cannot verify a June 2026 DOI | UN DESA IMS (non-commercial, no derivatives — unshippable) |
| 5 | Spine verification is **M0 with the network on**, before any product code | If the citation is wrong the schema is silently fabricated and every downstream figure is invented; this is the only failure mode that poisons everything | Verifying at M1 alongside ingest |
| 6 | **Disagreement is computed on the 5-year period grid**, never by annualising Abel & Cohen | Annualising a 5-year period total to compare against annual estimates manufactures methodological artefact and sells it as substance | Annualising A&C and disclosing it in a tooltip |
| 7 | It is called **"model disagreement", never "uncertainty"**, with a permanent correlation caveat | Both models are fitted to the same underlying stock tables, so the band is a lower bound on true uncertainty; marketing it as *the* uncertainty is the product's own central lie | Calling it an uncertainty band with a footnote |
| 8 | **Model-internal spread is a separate, separately named channel**, drawer-only | Two genuinely different quantities must not share a visual channel; three channels on a 12k-arc globe is illegible | One pooled interval |
| 9 | **Zero interpolation in the Year Machine**; discrete steps, notched track | 180ms eased motion across neural-net ensemble output at 73% test correlation implies a continuous observed resolution the source does not have; hatch texture is a weak counterweight to liquid motion | 180ms eased attribute transitions |
| 10 | **Cut the SSE server; v1 is a static site**; live becomes an optional M9 sidecar | An SPA plus a server plus poll schedulers plus backoff plus a degradation state machine is a second project that none of the source designs budgeted | Folding SSE into a late milestone as though it were a layer |
| 11 | **Incident ribbon renders from the 72h corpus in SNAPSHOT chrome**; no pulse, no emissive, no bloom in v1 | Pulsing chrome on replayed data is the exact freshness lie the latency-class rules exist to prevent | Shipping live chrome over corpus data |
| 12 | **Cut ADM1 polygons and the PMTiles build** | Every fact in v1 is ADM0-resolved, so subnational polygons imply a resolution the data lacks — the product's own rule — and it deletes a sustained build effort | Shipping 14,909 ADM1 polygons as place context |
| 13 | **Cut FLAT mode, MapLibre, PMTiles, the basemap.** Globe only | Per-capita people density must never render on Web Mercator, and with no basemap there is no zoom-12 use case; this deletes four dependencies and the GlobeView↔MapView switching bug outright | Keeping FLAT as a toggle, or as a separate route |
| 14 | **One PathLayer carries three channels** (width, dash, opacity); no second halo geometry | Halves vertex cost and removes a redundant layer; the spread channel belongs in the drawer, not on a 12k-arc globe | A second wide low-alpha path layer behind every corridor |
| 15 | **Three contracts, not seven**; ≥2 implementations before a contract lands | Seven contracts plus an ontology-generated UI is the failure mode where the agent spends its budget on Zod schemas with a blank globe behind them; "three independent implementations" triples connector work at the moment of least information | Seven contracts, three-implementations rule, ontology-generated pages |
| 16 | **`check:dogfood` restricted to `connectors/*`** | Connectors are where third parties actually arrive; extending the gate to models and layers is the version that fails a hundred times mid-build for reasons unrelated to the product | A full dogfood gate over connectors, models and layers |
| 17 | **The connector contract is exercised by a real CI acceptance criterion** (zero diffs outside `connectors/<id>/` and `snapshot/`) | A plugin contract never tested by the build that ships with it is a claim, not a seam | Listing the contract in scope and never exercising it |
| 18 | **The Year Machine is a generic `AttributeCube` driven by `snapshot/manifest.json`** | Pre-quantising 34 GPU buffers around one dataset's top 12,000 corridors makes the spine unswappable and pushes source coupling into the render layer | Hard-coding 12,000 Gaskin & Abel corridors into the renderer |
| 19 | **Coverage-asymmetry is computed in `semantic`**; layer authors cannot set opacity | If a layer author can choose authority, a plugin can render Gulf corridors with German-register confidence | Making it a layer styling choice |
| 20 | **One linter binary, six rule modules, one file walk** | A dozen bespoke CI gates are a dozen mini-projects that render no pixels; the same walker with six word lists is one afternoon | Twelve independent CI scripts |
| 21 | **Ethics ship as `@corridor/policy`, an importable tested package** | A third-party layer inherits every rule without its author reading the doc; a norm that is not executable ships once | `CONDUCT.md` plus CI scripts |
| 22 | **Recipe connectors: ship the pipe, never the water** (UN DESA, UNHCR) | Testable offline against a recorded fixture, and it turns a licence problem into a build step | An online-only connector that renders UNAVAILABLE |
| 23 | **`bundle:verify` must refuse a deliberately inserted non-redistributable row and name the reason** | A hostile test of a policy claim, writable in fifteen minutes, proves the licence engine exists instead of asserting it | Asserting the licence gate in prose |
| 24 | **`snapshot:measure` fails CI above 40 MiB**, with a pre-decided cut ladder | Converts the largest unquantified risk in the plan into a build failure instead of a late surprise | "MEASURE IN WEEK ONE" as an instruction |
| 25 | **Typed `Refusal` results** rendered as sentences | Naming *why* a value is absent is stronger than an em-dash, and it structurally prevents a zero from standing in for a gap | Rendering `—` with a generic badge |
| 26 | **Capacity is a per-indicator panel with a named binding constraint, never a scalar** | Taking the Liebig minimum across all twelve indicators yields ≤0 for every country on earth; a scalar would be both wrong and a policy limit in all but name | A single headroom number with a caveat |
| 27 | **`/solve` folds into `/methods`** as the first refusal | Generalising one designed absence into a refusals page is free and makes the cheapest screen the most persuasive one | A dedicated `/solve` route |
| 28 | **`comcol` and `col45` are a radio group** | They are alternative specifications of one dummy; adding both double-counts, and a radio makes the error structurally unrepresentable rather than warned against | A prose warning next to two checkboxes |
| 29 | **Per-source known traps are shipped product copy bound to fixture-backed regression tests** | Concrete failure modes as copy make `/sources` an argument rather than a table, and binding them to fixtures means a trap that stops being true fails CI | Traps as documentation |
| 30 | **No Git LFS; Tier B is a GitHub Release asset** | Forks and pulls bill the parent repo's bandwidth until `git clone` breaks for everyone | Git LFS for the full flow table |

---

## 10. The kill list

What the agent must NOT do, ranked by how likely it is to do it anyway.

1. **Proceed on a spine schema it could not verify.** If `gaskin-abel` does not resolve exactly — DOI, file name, every column — do not infer column names, do not "adapt" to what looks similar, do not write a schema from the design document. Apply the §4 fallback, record it in `DECISIONS.md`, move on. Fabricating a schema silently invents every figure downstream.
2. **Add easing to the year scrub because it "feels better".** No `transitions` on any data accessor. The stepping is the product. This is the single most likely aesthetic regression in the build.
3. **Build the SSE server, the poll schedulers, the backoff and the degradation state machine.** v1 is a static site. The degradation ladder in v1 has two states: `SNAPSHOT` and `UNAVAILABLE`. Live is M9, optional, and behind a flag.
4. **Fill a gap with `0`, an interpolation, or a silent forward-fill.** `align()` defaults to `"none"`. A missing year is a visible gap. A missing source is `—` with a badge or a typed `Refusal`.
5. **Ship a placeholder coefficient "just so there's a model there".** No `β_dist`, no `β_comlang`, no `β_contig`, no Ortega & Peri, no diaspora or visa elasticity, at any magnitude, behind any badge.
6. **Build ADM1, PMTiles, MapLibre or FLAT mode because the source designs mentioned them.** They are cut. If a task seems to need a basemap, the task is out of scope.
7. **Write twelve CI scripts.** One binary, six rule modules, one file walk. If a gate needs its own project, it does not ship in v1.
8. **Implement the allocation MILP because `/methods#allocation` describes it in full.** The description *is* the deliverable. Do not import `highs`, do not write an objective function in code, do not add a `solve()` stub.
9. **Call the disagreement figure "uncertainty" or "confidence interval" anywhere** — in copy, in a variable name, in a tooltip, in a commit message. The banned-strings module checks for it; do not work around the linter.
10. **Annualise Abel & Cohen**, or compare it to Gaskin & Abel at annual resolution. Period totals only, six period points, step function.
11. **Sum Abel & Cohen across `type ∈ {outward, return, transit}`** (triple-counts) or forget to sum across `sex` (there is no total row). Both are unit-tested at M1; do not disable the test.
12. **Use a single-member gzip reader for WPP.** It returns 634 bytes and no error. The M1 assertion is `>600,000 rows`.
13. **Take the Liebig minimum over flow or utilisation indicators.** `K_stock` only, five indicators. The min over all twelve is ≤0 for every country on earth, which will look like a bug and will be "fixed" by silently widening the set.
14. **Add both `comcol` and `col45`.** Radio group. Adding both double-counts the colonial dummy.
15. **Build `/plugins`, `/compare`, `/brief`, `/graph`, `/studio`, or ontology-generated `/o/{type}/{id}` pages.** Six routes exist. Adding a seventh is a scope breach even if it is easy.
16. **Reintroduce `EXODUS`, or any banned lexeme, in a package name, a route, an env var, an asset filename or the repository name.** The lexicon module runs over all of them.
17. **Call `Date.now()` outside `packages/kernel/clock`**, or `Math.random()` anywhere in `kernel`. ESLint-enforced; do not add an inline disable.
18. **Download UN DESA IMS, UNHCR, IDMC, ACLED, EM-DAT, GADM, MIPEX or UNESCO bytes into `snapshot/` or `corpus/`.** `bundle:verify` will refuse; do not "temporarily" disable it. One IDU file makes the repo's data component CC BY-NC-SA.
19. **Use Git LFS**, for anything, for any reason.
20. **Render a Missing Migrants coordinate, a route with more than two vertices, an H3 people layer finer than r3, or a nationality cross-tab below ADM0.** These are the four geometry rules; each has a test.
21. **Write design documents, status reports, or summary markdown files instead of code.** `DECISIONS.md`, `SNAPSHOT.md`, `PARAMETERS.md`, `BACKLOG.md` and `REUSE.toml` are the only documents in the build plan; everything else that needs saying goes on `/methods` or `/sources`, where users can read it.
22. **Start M1 before M0 passes, or M3 before M2 runs end-to-end from a cold install.** The build order is the spine; each milestone leaves something that runs, which is the only protection against a budget that ends early.