# EXODUS / LEDGER — rigour-first MVP design

**One line.** A self-hostable, offline-first migration intelligence workbench in which no number can render without its provenance, no corridor renders as a single line, and no capacity question returns a scalar.

**Build order is the spine of this document.** Everything below is ordered so that an agent building it top to bottom always has a running application.

---

## 0. The three decisions that define this design

Three calls separate this from a middle-of-the-road build. They are load-bearing; reversing any one of them collapses the lens.

**D1 — The bilateral spine is Gaskin & Abel, not UN DESA.** UN DESA IMS 2024 is the dataset everyone expects and the one we cannot ship: UN Terms of Use, personal and non-commercial, *"without any right to resell or redistribute them or to compile or create derivative works therefrom"*, no Creative Commons. A `git clone` that ships a derivative of it is a licence violation on the first commit. Gaskin & Abel (*Nature* 655(8121):148–157, 10 June 2026, Zenodo 10.5281/zenodo.17344747) is CC BY 4.0, annual 1990–2023, 230 countries, and is the only global bilateral source shipping per-cell uncertainty. It is modelled output — a neural-network ensemble, 73% test correlation, African net migration least certain — and we say so on every mark. DESA remains reachable through `pnpm ingest:local desa`, which writes to a gitignored path, is excluded from `snapshot:build` outputs, and prints the licence text before it runs.

**D2 — Uncertainty is the product, not a caveat.** The headline visual is not a glowing arc; it is a *band of bands*. For any corridor we render, side by side and never pooled into one fake interval: Gaskin & Abel `stock_std` / `mig_prev_std`, the Abel & Cohen v6 spread across `da_min_open` / `da_min_closed` / `da_pb_closed`, and — for EU pairs — the Eurostat mirror divergence between `migr_imm5prv[geo=B, partner=A]` and `migr_emi3nxt[geo=A, partner=B]`. Two independent models over the same underlying stock tables disagreeing is the best available uncertainty proxy outside Europe, and it is honest in a way a single confidence interval never is.

**D3 — Capacity is a panel, never a number.** Every banned string (`capacity limit`, `carrying capacity`, `maximum`, `threshold`, `saturation`) is a CI-failing lexeme. The Liebig minimum over the 12-indicator set is not shipped as a headline because it is empirically degenerate — taking the min across all indicators yields ≤0 for every country on Earth (216/216 at or below a 100% electricity target). We ship the min over `K_stock` only (physicians, nurses/midwives, beds, health spend per capita, dwellings), as five separate numbers with a fifth-percentile envelope, plus the explicit statement that holding service stock fixed while growing population systematically understates because migrants bring physicians.

---

## 1. Screen inventory

Eight surfaces, four overlays. Entity-centric permalinks throughout: `/o/{typeId}/{objectId}`. One global `timeStore {cursor, window, playing, speed}`; no component holds local date state.

### 1.1 `/` Situation Globe
deck.gl `_GlobeView` (experimental, aliased on import), opaque ocean sphere (mandatory, because `cullMode:'none'` is a per-layer override and arcs would otherwise draw through the planet). Default camera centred on the Global South — justified in the tooltip by UN DESA IMS 2024's finding that 53% of international migrants moved within their own region of origin (83% Eastern/South-Eastern Asia, 73% LAC, 63% Central/Southern Asia).

Layers, all from the registry, all toggleable, all carrying a legend entry with latency class:
- **Corridors** — great-circle paths between ADM0 centroids, tessellated to 48 points and drawn with `PathLayer` (not `ArcLayer`: arcs cannot be dashed, and `PathStyleExtension` does not support them). Solid = measured; dashed + ƒ glyph = modelled. Width encodes per-capita rate by default; absolute counts require an explicit toggle and always render the per-capita figure simultaneously (denominator mandate). Symmetric in/out by default.
- **Disagreement halo** — a second, wider, low-alpha path behind each corridor whose width is the model-spread ratio. This is the single most visually distinctive element in the product and it encodes ignorance.
- **Country choropleth** — `GeoArrowPolygonLayer` over Natural Earth 10m ADM0; sequential ramp stops at `#256abf`; no-data is a distinct hatch, never the diverging neutral.
- **Capacity density** — H3 r4 (288,122 cells, the global ceiling), rendered as density = pop/cellArea, never raw count, because r4 cell area spans 896.58–2,135.99 km² (2.38×). `highPrecision:'auto'`, always.
- **Incidents** — GDACS/USGS/GDELT marks, the only layer permitted emissive/pulsing chrome.

Status bar: degradation ladder chip (`LIVE | CACHED | SNAPSHOT | UNAVAILABLE`) and one global **AS OF** chip showing the *oldest* contributing vintage across every visible layer. Showing the newest is the lie.

`Shift+G` opens the mandatory text alternative: top-25 corridors as a sorted, keyboard-navigable table with the same figures, same provenance popovers.

### 1.2 `/o/country/{iso3}` Entity page
Five stacked sections, each collapsible, each independently citable: Demography (pyramid, PSR, POADR, dependency trajectory); Corridors in/out with disagreement bands; Service stock (the five `K_stock` indicators against WHO SDG 4.45/1,000 floor — labelled a floor, explicitly not an optimum); Labour (ISCO 1-digit × native/foreign-born from ILOSTAT, vacancies only for the 37 Eurostat reporters, "no demand data" everywhere else); Data density (our coverage-asymmetry score, with its own methodology link and a "this is our construction, not literature" badge).

### 1.3 `/o/corridor/{orig}-{dest}` Corridor page
The mirror-statistics screen. Time series with every estimator drawn as its own line, never averaged. For EU pairs, the two-sided Eurostat reconciliation with `OBS_FLAG` markers inline (DE←SY 2023 = 88,973 and 2024 = 63,444 both carry `e`, and both render with the estimated-flag glyph). For everything else, Gaskin & Abel vs Abel & Cohen. A plain-language "what would have to be true for these to agree" note generated from the metadata, not from a model.

### 1.4 `/capacity` Capacity Workbench
Three stacked, independent answers to "how many":
1. **Demographic gap** — WPP medium (VarID 2) minus zero-migration (VarID 7), the officially sanctioned counterfactual, per country per year to 2100.
2. **Replacement migration** — bisection to hold PSR constant, with the UN Replacement Migration (ESA/P/WP.160, 2000) Table 8 values shipped as validation fixtures: EU 153.6M under Scenario V, and Scenario VI's EU 700.5M / Republic of Korea 5.149 **billion** shown deliberately, with the UN's own footnote "*Scenario VI is considered to be unrealistic*" rendered non-dismissibly. That footnote is the best argument in the product for why capacity is not a number.
3. **Service-stock headroom** — the five-indicator panel, per assumption set.

Assumption-set selector at the top; every parameter row shows its provenance badge (`literature | our construction | placeholder`). Placeholders are the majority and are coloured as such.

### 1.5 `/scenario/{id}` Scenario Studio
Physically separated from reference data: separate schema, separate store slice, distinct chrome, non-dismissible **"SCENARIO — MODELLED, NOT POLICY"** watermark on the canvas. Three scenario types in v1: corridor restriction (nested logit redistributes, never deletes), assumption-set sweep, and distribution LP. Output is a signed, forkable, diffable scenario JSON, URL-encoded as `base64url(deflate-raw(json))` — `CompressionStream` supports gzip/deflate/deflate-raw only, not zstd.

### 1.6 `/compare`
Up to four countries or corridors side by side, sharing the timeStore cursor. Enforces identical latency class across compared series or refuses and explains why.

### 1.7 `/brief/{id}`
Working-set → composed brief → export. The export gate is a licence gate: any figure whose `redistributable` flag is false blocks PDF/PNG export and offers a link-out instead. Derived metrics inherit the worst latency class, the oldest vintage, and the AND of licence flags — enforced in `semantic`, not in the UI.

### 1.8 `/sources` and `/methods`
The trust argument, and the two pages an IOM analyst will open first.

`/sources`: one row per dataset — id, publisher, endpoint, licence SPDX + URL, `redistributable`, cadence, coverage (countries × years), vintage, latency days, known traps. The traps are shipped as content, not folklore: UNHCR needs `cf_type=ISO` or `coa=DEU` silently returns zero rows at HTTP 200; `AUS` is Austria in UNHCR and Australia in ISO 3166-1; OECD `DSD_MIG@DF_MIG` has key arity of exactly 8 and wrong arity returns 404 `NoResultsFound` which looks like missing data; `B14` is not in `DF_MIG` at all; Data360's `timePeriodFrom` alone is silently ignored; WPP `.csv.gz` files are multi-member gzip and a single-member reader returns 634 bytes with no error.

`/methods`: the model cards, the CPC scoreboard, the refusals. The refusals page is short and blunt: we do not ship a Displacement Pressure Index because its weights have no literature behind them; we do not ship departure forecasts; we do not ship a scalar capacity.

### 1.9 Overlays
`Cmd+K` palette (`>` actions, `#` datasets, `@` countries, `~` corridors — and it indexes no person-shaped type); keyboard help; working-set tray (`saved_views`, `area_of_interest` — never `watchlist`, never `target`); provenance popover, reachable from every `<Figure>` by click and by keyboard.

### 1.10 Visual system
Tokens exactly as verified: `--bg-canvas #06080C`, `--surface-0 #0B0E14`, `--text-primary #E8ECF2`, `--text-muted #6E7A8C` (labels and axes only, never body), `--accent #4DA3FF` (never a data series), `--border-interactive #5C6B85` around every interactive control (`--border-default #2A3242` is 1.50:1 and decorative only), `--scrim-globe: rgba(6,8,12,.72)` behind every label over the WebGL canvas. Categorical palette in fixed slot order, never cycled; map/scatter/choropleth capped at three slots (`#3987e5`, `#d95926`, `#199e70`). Diverging neutrals raised to `#5F5F5A`/`#908F8E` with a hairline stroke on every filled region. **People are never red, orange or yellow** — warm hues mark service and rights deficits only. Type 11/12/13/15/18/24/32/44, base 13/18, tabular-nums everywhere. Motion 80/120/180/600/900ms; `prefers-reduced-motion` gives instant cuts, static arcs and discrete time stepping.

---

## 2. The exact data bundle

Two artefacts. `snapshot/world.parquet` (the fact table) and `snapshot/geo/*.pmtiles` (geometry), plus `snapshot/xwalk.parquet` and `snapshot/sources.json`. Everything is built by `pnpm ingest && pnpm snapshot:build` and published as a GitHub **release asset** (< 2 GiB each, up to 1000, no total-size or bandwidth limit) — never Git LFS, because forking and pulling counts against the parent repository's bandwidth and downstream clones would eventually break `git clone` for everyone.

### 2.1 Fact table schema
```
migration_fact(origin_iso3, dest_iso3, year,
  period_type ENUM('annual','5yr','monthly','quarterly'),
  sex ENUM('m','f','t'), age_band, measure_code, value NUMERIC,
  source_id, vintage_date, latency_days,
  estimate_kind ENUM('observed','observed_flagged','modelled','extrapolated','assumed_zero'),
  obs_flag TEXT NULL, conf_status TEXT NULL, ci_low NUMERIC NULL, ci_high NUMERIC NULL,
  license_id TEXT, redistributable BOOLEAN)
```
`license_id` and `redistributable` are mandatory columns, not documentation. A row without them fails ingest.

### 2.2 Sources committed to the bundle
| Source | What we take | estimate_kind | Licence |
|---|---|---|---|
| **Gaskin & Abel 2026** (Zenodo 10.5281/zenodo.17344747, `mig_bilateral.csv`, 145,597,904 B) | bilateral 1990–2023, 230 countries, `stock_mean/std`, `mig_prev/std`, `mig_brth/std`; filter `orig == dest`; skip `T.nc` (3.3 GB) | `modelled` | CC BY 4.0 |
| **Abel & Cohen v6** (figshare 53236079, 65,341,478 B) | 232 countries, six 5-yr periods 1990–2015; **sum the two sexes yourself** (no total row); `da_pb_closed` default, all three estimators kept as the spread; never naively sum `type ∈ {outward,return,transit}` — that triple-counts | `modelled` | CC BY 4.0 |
| **Eurostat** (no key; TOC at `catalogue/toc/txt?lang=en`) | `migr_imm*`, `migr_emi*`, `migr_pop*` annual; the six monthly asylum tables (`migr_asyappctzm` through 2026-08, updated 17.09.2026); `jvs_q_isco_r2` (37 reporters); `jvs_a_isco3_r1` flagged experimental; `lfsa_egised`. `OBS_FLAG`/`CONF_STATUS` preserved per row. Queries kept under the 5,000,000-cell cost ceiling | `observed` / `observed_flagged` | CC BY 4.0 |
| **OECD IMD SDMX** (`sdmx.oecd.org/public/rest`, agency `OECD.ELS.IMD`) | `B11`,`B12`,`B13`,`B15`,`B16`,`B21`,`B22` from `DSD_MIG@DF_MIG` with exact 8-part key; `B14` from `DSD_MIG_F@DF_MIG_POPF`; codelist `CL_MEASURE_MIG`; `format=csvfilewithlabels` | `observed` | CC BY 4.0 (from 2024-07-01) |
| **WB Data360 / KNOMAD BRE** | 10,619 rows, frozen TIME_PERIOD=2021; `REF_AREA`=remitting, `COMP_BREAKDOWN_1`=receiving; drop `WB_KNOMAD_WLD`; the six politically-zeroed corridors written as explicit `assumed_zero` rows, never interpolated | `modelled` / `assumed_zero` | CC BY 4.0 + WB addendum |
| **WDI v2** | GDP pc PPP (`NY.GDP.PCAP.PP.KD`, constant 2021 international $ — rebase any threshold before use), population, urbanisation | `observed` | CC BY 4.0 |
| **WHO GHO** (`ghoapi.azureedge.net/api`) | physicians, nurses/midwives, beds, health spend pc. Key on `TimeDim`, not `Date`; the array is unsorted — sort before taking latest; parse `Comments` for OECD-sourced rows | `observed` | CC BY-NC-SA? → verified open, flagged in manifest |
| **ILOSTAT SDMX** | `DF_EMP_TEMP_SEX_OCU_CBR_NB` — ISCO-08 **1-digit only** × sex × native/foreign-born. No vacancy dataflow exists; `rplumber.ilo.org` bulk is dead | `observed` | CC BY 4.0 (2023-05-03+) |
| **UN WPP 2024** | 237 countries, single-year ages, 1950–2100, VarID 2 and VarID 7. Multi-member gzip reader mandatory; filter `LocTypeName='Country/Area'`; `SRB/100`, `ASFR/1000`, `population×1000` | `observed`/`projected` | open |
| **CEPII Gravity 202211** | `dist`, `distcap`, `distw_harmonic`, `contig`, `comlang_off`, `comlang_ethno`, `comcol`, `col45`, `comrelig`, `scaled_sci_2021`. `distw`, `distwces`, `colony`, `smctry` do not exist in Gravity — do not reference them | `observed` | Etalab 2.0 |
| **Natural Earth 5.1.1** | `ne_10m_admin_0_countries`, `ne_10m_admin_1_states_provinces` (14,909,524 B), `ne_10m_admin_0_disputed_areas`. POV via `COALESCE(NULLIF(fclass_{pov},''), fclass_iso)` — `FCLASS_US` is null for 249/258 records | — | public domain |
| **IOM Missing Migrants** | 2014–2026, per-year CSV | `observed` | CC BY 4.0 |
| **HDX HAPI v2** (`app_identifier` self-minted, no registration) | `/affected-people/idps` (DTM-sourced, routed through HAPI to avoid the DTM token). `/coordination-context/conflict-events` **excluded** (ACLED, `hdx-other`). Licences resolved by following `hdx_api_link` to CKAN `package_show`, because `/metadata/dataset` carries no licence field | `observed` | per-dataset |

### 2.3 Sources deliberately not in the bundle
UN DESA IMS (local-only ingest), UNHCR RDF (connector ships, ingest flagged off pending written licence resolution), IDMC/IDU (CC BY-NC-SA 3.0 IGO — would contaminate the whole data component), ACLED, EM-DAT, ReliefWeb, MIPEX, GADM, gbOpen bulk (36.5% ODbL at ADM0, 42.2% at ADM1), VIEWS (licence undocumented; MIT covers the code only — blocking).

### 2.4 Crosswalk
`xwalk.parquet` is a versioned table with validity date ranges, not a dict literal. Five namespaces: UN M49, ISO3, Eurostat GEO (`UK` not `GB`, `EL` not `GR`, `XK`), OECD `REF_AREA` (+`W`), KNOMAD `WB_KNOMAD_<ISO3>`, UNHCR legacy (which collides with ISO3 — `AUS`=Austria, `CHI`=China). Explicit rows for Kosovo, Taiwan, Palestine, Western Sahara, Curaçao, Sudan-2011, Serbia-Montenegro-2006, USSR, Yugoslavia. Joins against UNHCR always use `coo_iso`/`coa_iso`, never `coo`/`coa`.

### 2.5 Replay corpus
`./corpus/{sourceId}/{ISO8601}.{ext}` with `{url, fetchedAt, sha256, httpStatus, redirectChain}`. Committed corpus contains only `gdelt`, `usgs`, `gdacs` and a synthetic movement-distribution fixture — an IDU-containing corpus would make the repo's data component CC BY-NC-SA. GKG is excluded outright (~5.3–5.9 MB per 15-min slot → 45–50 GB for 90 days).

### 2.6 Size
Target ≤45 MiB for `world.parquet`. This is an unmeasured estimate; back-of-envelope is 11–32 MiB with nullable CI columns as the blow-up risk. **Measure in week one** (M1 acceptance criterion) and report the real number in `/sources`. GitHub warns at 50 MiB and blocks at 100 MiB per file, so if the measurement exceeds 45 MiB the bundle moves entirely to release assets and the repo ships a 2 MiB demo slice.

---

## 3. The exact models implemented

Every model is a pure function `run(inputs, world, seed)` in `packages/kernel`, with no I/O, no `Date.now()`, no `Math.random()`. Every model ships a model card at `/methods/{modelId}` stating estimator, inputs, known bias, validation result and parameter provenance.

**M1 — Cohort-component projection.** WPP-consistent, single-year ages. `S[a] = L[a+1]/L[a]`; `B = Σ_{15..49} f[a]·0.5·(P_F[a][t] + P_F[a][t+1])`. Unit normalisation is a validated precondition: `SRB/100` (ships as 105.8 males per 100 females — raw use gives a 99.1% male birth share), `ASFR/1000`, `population×1000`. Golden test reproduces WPP medium for 20 countries to within 0.5% at 2050.

**M2 — Migration counterfactual.** VarID 2 (medium) − VarID 7 (zero migration). This is the officially sanctioned counterfactual and the product's core demographic primitive.

**M3 — Replacement migration bisection.** Solve for the constant annual net inflow holding **UN PSR = P_15–64 / P_65+** (a `wap` of 20–64 systematically overstates need; we use the UN definition and say so). Bisection converges in ~14–17 iterations at 1e-4 relative tolerance. Two guards: check bracket endpoints straddle the target *before* iterating, and detect non-monotonicity — which genuinely occurs for age profiles weighted toward 65+ — returning an explicit "non-monotone, no unique solution" state rather than a number. Sanderson–Scherbov POADR displayed alongside every conventional figure (Germany +11.3% vs conventional +49.2%). Validated against ESA/P/WP.160 Table 8.

**M4 — Service-stock headroom.** `AnnualIntakeCapacity_k = [(x_k/target_k − 1)·pop] / horizon`, over `K_stock` = {physicians, nurses+midwives, beds, health spend pc, dwellings} **only**, reported per indicator. Two aggregators offered and both shown: the Liebig minimum, and a `1/J`-normalised soft-min (unnormalised soft-min produces a spurious ~27% haircut when six modules tie). Module C's per-1,000 ratios are converted to absolute counts before combination — the factor-of-1,000 error is a unit test. Per-occupation annualisation `365/TTF_o` sits **inside** the Σ. WHO's 4.45 per 1,000 is labelled a floor, explicitly not an optimum. Required label on every output: *"Modelled labour-market absorption under assumption set «name» — not a policy limit."*

**M5 — Nested logit with multilateral resistance.** Bertoli & Fernández-Huertas Moraga (*JDE* 102:79–100, 2013): `I_ir = λ_r·ln Σ_{j∈r} exp(ln A_ij / λ_r)`, `M̂_ij = O_i · P(r|i) · P(j|i,r)`. Row sums equal `O_i` by construction, so closing a corridor redistributes rather than deletes — the property every restriction scenario requires. The visa effect is **calibrated, not injected**: Ramos (IZA WoL, Feb 2016) gives −40% to −47% inflow and +2.8% to +16.9% diversion as reduced-form gravity effects; we tune the λ-scaled utility shift until the *simulated* drop lands in the 40–47% band, and the calibration residual is shown.

**M6 — PPML gravity fit.** Poisson quasi-ML with clustered standard errors (Santos Silva & Tenreyro 2006), implemented as IRLS in `packages/kernel`, run offline by `pnpm fit`, with coefficients + SEs + diagnostics committed as `snapshot/coefficients.parquet` and regenerable bit-for-bit. The UI never writes "PPML is unbiased" — the model card cites Martin & Pham (*Applied Economics* 2020) finding alternatives less biased under economically-determined zeros. Ortega & Peri (2013) coefficients ship as a clearly-labelled *alternative* set (`β_yd +0.76`, European-pairs override `+1.90`, non-European destination `+0.42`, `β_yo −0.33`, colony `+0.85` **or** `+0.77` — never both, they are alternative specifications of one dummy; entry-law tightening `−0.06`/`−0.02`; Maastricht `+10%`), with the estimator mismatch stated on the card: their `log(flow+1)` OLS-with-FE is exactly what our baseline forbids. Diaspora elasticity ≈ +1.0 (Beine, Docquier & Özden 2011), not 0.70. `β_dist`, `β_comlang`, `β_contig` ship with verified signs and **unattributed magnitudes**, badged `placeholder`.

**M7 — Null models and the scoreboard.** Radiation, extended radiation and gravity-exponential implemented as *null models* and rendered as such. The honest baseline is published on `/methods` as the first thing an analyst sees: Robinson & Dilkina (COMPASS '18) at global scale with a production function — gravity 0.16, radiation 0.16, XGBoost+extended 0.21, ANN+extended 0.22; without a production function XGBoost 0.43, ANN 0.40. Roughly half the achievable accuracy lives in getting origin outflow totals right, and we say that in the UI. CPC = `2·Σ min(T_ij, T̂_ij) / (ΣT_ij + ΣT̂_ij)`, computed on a held-out year, reported per model per region.

**M8 — Matching function.** `M = A·U^α·V^(1−α)`, **α = 0.6** (Petrongolo & Pissarides, *JEL* 39(2):390–431, range 0.5–0.7). `JVR = V/(V+O)×100` per the Eurostat definition. Runs only for the 37 Eurostat vacancy reporters; every other country returns a typed `NoDemandData` result that the UI renders as "no demand data" — never zero, never interpolated.

**M9 — Distribution LP.** Continuous shares `x_ij ∈ [0,1]` over destination × origin-cohort aggregates. Objective `max Σ(w_E·E + w_P·P + w_N·N + w_L·L + w_H·H − w_K·K)·x_ij + w_F·t − w_U·Σv_i − w_S·Σz_jd − w_Q·Σδ_m`, weights `w_E .30, w_P .25, w_N .15, w_L .10, w_H .08, w_K .05, w_F .07`. The three spec bugs are fixed: `z_jd` is defined as `z_jd ≥ Σ s_id·x_ij − θ·c_jd` with θ=0.85; C8 is expressed as two linear rows, never `|·| ≤ δ_m`; C6's `ρ=0.02` carries an explicit rolling-12-month window. Candidate pruning K=20 (≈300k nonzeros with six capacity dimensions). Because we allocate aggregate shares rather than indivisible cases, **integrality is never assumed** — the C4–C7 unimodularity trap is designed out rather than mitigated. Solver: `highs@1.15.3` (MIT) + `lp-model@0.4.2`; `javascript-lp-solver@1.0.3` (Unlicense) as the WASM-blocked fallback; `glpk.js` is excluded on GPL-3.0 grounds. Output is a ranked shortlist of three with a per-term score decomposition and the runner-up's losing term. There is no code path from `solve()` to `commitPlacement()` without a human actor id (GDPR Art. 22), and the override rate is published. Protected attributes are excluded from `E_ij` features, gated in CI by an adversary AUC ≤0.65 test — a project convention, documented as chosen, answering Alajak et al. (*Social Inclusion* 14 (2026) art. 10923) on the Dutch GeoMatch deployment.

**M10 — Uncertainty composition.** Never pools. Returns a typed `SpreadSet` of independently-sourced intervals plus the mirror divergence, and the renderer draws all of them.

**M11 — Coverage-asymmetry score.** Per country-year: fraction of requested measures present, mean `latency_days`, share of rows with `estimate_kind ∈ {modelled, extrapolated}`, share carrying `obs_flag`. Drives arc opacity and choropleth hatch density, so that Gulf labour corridors, China, Russia and Iran do not render with the authority of German register data. Documented as our construction, no literature claimed. Robust Z where used is `(x − median)/max(1.4826·MAD, ε)` with ε = one meaningful unit, suppressed entirely for units with insufficient nonzero history.

**Explicitly refused models.** The Displacement Pressure Index (weights have no literature; inherits the worst cadence of its terms so it could never sit under LIVE chrome anyway; the UCDP term cannot be weekly — GED final is annual, Candidate is monthly with ~1-month lag and coverage only from 2011). The `labour_absorption_gap` example (negative for essentially every country under normal `u*`, uses two undefined terms, fails its own two-maintainer gate). The migration hump ships as an off-by-default toggle with both sides stated — Clemens (IZA DP 13614) reverses ≈$10,000 PPP with the base year unverified; Benček & Schneiderheinze (*World Development* 182, 2024) find it disappears under country FE with a significant negative relation. The functional form `h(y) = 1 − ((ln y − ln y*)/σ_y)²` is labelled as this project's own construction, not literature, and `y*` is rebased for constant 2021 international $.

---

## 4. Architecture

**Monorepo**, pnpm 12.4.2 + Turborepo 2.11.2, TypeScript 7.0.2 (`erasableSyntaxOnly`: no enums, no namespaces — the ENUMs above are string-literal unions), Node 24.21.0 LTS, Zod 4.6.5, Biome 2.5.14, Vitest 5.0.1, Playwright 1.63.0 (`--use-gl=angle --use-angle=swiftshader-webgl --enable-unsafe-swiftshader`).

```
packages/
  contracts/     zod schemas, PluginManifest, DataSource, Indicator, Model, MapLayer, Panel, Scenario   [Apache-2.0]
  connectors/*   one per source; imports contracts only
  kernel/        M1..M11; pure; imports contracts only; no I/O, no clock, no RNG
  ontology/      object types, properties, link types, action types
  registry/      layer + model + source registry, data-driven
  store/         timeStore, workingSet, scenario slice (partitioned)
  semantic/      joins, align(), latency/licence inheritance, suppression, policy gate
  ui/            <Figure>, provenance popover, palette, tokens
  globe/         deck.gl layers, GlobeView/MapView switch
apps/
  web/           Next-less Vite SPA; imports ui, globe, semantic
  cli/           ingest, snapshot:build, fit, verify, gen:connector
```

**CI-enforced import graph** (dependency-cruiser, failing build): `connectors/* → contracts` only · `kernel → contracts` only · `semantic → contracts, ontology, registry, store, kernel` · `ui, globe → contracts, semantic` · `apps/web → ui, globe, semantic`.

**Rendering pins and their traps.** `deck.gl@9.4.0`, `@luma.gl/core@9.4.1`, `@luma.gl/effects@9.4.1` (post-FX lives here; `shadertools` does not have them; there is no standalone chromatic-aberration module — it is a prop of the bloom lens pipeline; `bloom` has no mip-level prop), `maplibre-gl@6.10.0` (ESM-only: no `main`, no `require` condition), `@deck.gl/maplibre@9.4.0` with `@deck.gl/mapbox@9.4.0` retained as fallback, `pmtiles@4.5.0`, `apache-arrow@21.2.0`, `h3-js@4.5.0`, `@loaders.gl/parquet@4.5.1`, `@duckdb/duckdb-wasm@1.32.0`. `@geoarrow/deck.gl-geoarrow@0.4.2` is gated by a day-one smoke test (its devDeps pin deck.gl ^9.2.1, it carries a 2021 `threads@1.7.0` runtime dep, and it ships no `GeoArrowGeoJsonLayer` and no `GeoArrowIconLayer`); fallback pin 9.2.1 is pre-written. `HeatmapLayer`, `ContourLayer` and `MaskExtension` are unsupported on globe and are not used. Flat mode above zoom 6 is MapLibre + interleaved `MapboxOverlay`. Budget: ≤1M items for 60fps, and the overdraw arithmetic (4M points at 3px ≈ 113M fragments/frame) is why corridors are capped and per-capita filtering is the default. Effects used: `fxaa` always, `vignette` subtle, `bloom` only on incident marks.

**Transport and liveness.** One multiplexed SSE stream `GET /live/stream?sources=a,b`, never WebSockets. GDELT `lastupdate.txt` polled on a 60s timer, acting on slot change (rewrite `http://` to `https://`; the translingual feed lags one slot; the DOC API enforces ≥5s spacing and 429s on a shared-IP first call; GEO 2.0 is 404 and is not built). GDACS read from `alertlevel`/`alertscore`/`episodealertlevel`, never the icon path. HAPI every 24h against `hapi_updated_date`. Eurostat TOC daily. Backoff: full jitter, base 1s, cap 300s, `degraded` after five failures with a struck-through legend entry — degraded layers do **not** disappear, because disappearance reads as "no conflict".

**Freshness scoring.** `exp(−Δt/τ)` with τ ≈ 3–4× cadence, scored against expected-next-update, not against a naive one-period τ (τ_GDELT=0.25h would render the freshest feed in the stack stale within 30 minutes).

**Determinism.** `EXODUS_MODE=replay EXODUS_CLOCK=…`; no `Date.now()` outside `packages/kernel/clock` (ESLint-enforced); every model seeded; `pnpm verify` rebuilds `world.parquet` and `coefficients.parquet` from the corpus and asserts sha256 equality.

**Licensing.** Code AGPL-3.0-or-later; `contracts` and the connector template Apache-2.0 for the patent grant. AGPL §13 obliges an offer of Corresponding Source to all users interacting over a network, including internal ones — there is no "public" qualifier, and the deployment doc says so. DCO sign-off, not a CLA. REUSE 3.3 (`REUSE.toml`, not deprecated DEP5), `reuse lint` in CI. The README states plainly that OSD clauses 5 and 6 mean a use-restricted licence would forfeit the open-source designation, and that we chose not to restrict use — trade-off stated, not hidden.

**Ethics enforcement, in code.** `layer_policy.yaml` enforced server-side: movement layers ≥7-day lag, ≥monthly bucket, ADM1 or coarser wherever origin is disaggregated; ADM2 destination only with origin fully undisaggregated at ≥30-day lag and ≥quarterly. Capacity is live and fine-grained; people are not. Schema lint fails CI on `person`, `individual`, `case_id`, `applicant`, `biometric`, `name`, `dob`. Suppression: K=25 at ADM0×ADM0, K=100 at ADM1/ADM2, denominator floor 10,000, complementary suppression, frozen suppression with an append-only published ledger; rounding (`5·round(n/5)` <1000, `10·round(n/10)` <10k, 3 s.f. above) runs *after* suppression and is never a safeguard on its own. Movement `LineString` with >2 vertices is rejected at the query planner. Nationality × sub-ADM0 geography, and ethnicity/religion/orientation/health/political opinion as layers, are rejected with **HTTP 403** and a machine-readable policy body — not 451, which RFC 7725 reserves for legally-compelled blocking. Lexicon lint (exit non-zero) structured on Mendelsohn & Budak's seven dehumanising source concepts (animal, vermin, parasite, physical pressure, water, commodity, war), with UNGA Res. 3449 (XXX) as the basis for "non-documented or irregular migrant workers". Viewer privacy: zero third-party scripts, cookieless self-hosted analytics, 7-day retention, IP truncation to /24 IPv4 and /32 IPv6 (/48 can still single out a household). Redress: `.github/ISSUE_TEMPLATE/harm-report.yml`, monitored address, 30-day response SLA, power to de-publish a layer, public de-publication log.

---

## 5. Milestone plan

Each milestone must run end-to-end from a **cold install with the network disabled** before the next begins. Anything not listed goes to `BACKLOG.md`.

**M0 — Gating smoke tests (day 1).** Prove `_GlobeView` renders with an opaque sphere and `cullMode:'none'` arcs; prove `@geoarrow/deck.gl-geoarrow@0.4.2` works against deck.gl 9.4.0 or fall back to the 9.2.1 pin; prove `TerrainLayer`-on-globe status. *Accept:* three screenshots in `docs/smoke/`, decision recorded in `DECISIONS.md`, fallback pin applied if needed.

**M1 — Ingest + snapshot + measured size.** Connectors for Gaskin & Abel, Abel & Cohen, Eurostat annual, WDI, Natural Earth. `world.parquet` built, `license_id`/`redistributable` on every row, crosswalk table populated. *Accept:* `pnpm ingest && pnpm snapshot:build` runs from corpus only; ≥190 countries present; **measured file size published in `/sources`**; `reuse lint` passes; zero rows missing licence metadata.

**M2 — Globe + choropleth, offline.** *Accept:* `git clone && pnpm i && pnpm dev` with network disabled renders ≥190 countries, 60fps at ≤1M items measured in Playwright with SwiftShader, `Shift+G` table alternative works, no `Date.now()` outside the clock module.

**M3 — Provenance drawer + `<Figure>` + `/sources`.** *Accept:* no number renders outside `<Figure>` (AST lint); every figure's popover shows source, vintage, latency class, estimate_kind and licence; a deliberately-missing value renders `—` with a badge and never `0`; `/sources` lists every dataset with its traps.

**M4 — Capacity Workbench (M1–M4 models).** *Accept:* WPP golden test within 0.5% at 2050 for 20 countries; replacement-migration reproduces ESA/P/WP.160 Table 8 to published precision including Scenario VI's 5.149bn for Korea with its footnote rendered; non-monotone cases return the typed refusal; lexicon lint passes on all capacity copy; no banned scalar string anywhere in the bundle.

**M5 — Corridors + disagreement bands.** *Accept:* every corridor renders ≥2 independent estimates; EU pairs render the mirror divergence; modelled corridors are dashed + hatched + labelled in the tooltip; arc opacity is driven by the coverage-asymmetry score, demonstrated on a Gulf-vs-Germany screenshot pair.

**M6 — Scenario Studio + nested logit.** *Accept:* closing a corridor conserves `O_i` to 1e-9; a visa-restriction scenario lands in the 40–47% simulated band after calibration, with the residual displayed; scenario JSON round-trips through `base64url(deflate-raw(...))`; the SCENARIO watermark cannot be dismissed; scenario state cannot reach the reference store (type-level separation, tested).

**M7 — Distribution LP.** *Accept:* HiGHS solves the pruned instance in-browser; shortlist of three with full term decomposition and the runner-up's losing term; `commitPlacement()` rejects without a human actor id (test); adversary-AUC gate ≤0.65 passes in CI; solve is deterministic under a fixed seed.

**M8 — Live signal + degradation ladder.** *Accept:* with the network on, GDELT slot changes advance the incident layer within 90s; with the network cut mid-session the status chip walks `LIVE → CACHED → SNAPSHOT` without a blank frame; degraded layers remain visible and struck through; the AS OF chip shows the *oldest* contributing vintage, verified by a test that injects a stale layer.

**M9 — Brief export + licence gate.** *Accept:* a brief containing a non-redistributable figure blocks export and offers link-out; derived metrics demonstrably inherit worst latency class, oldest vintage, AND of licence flags.

**M10 — Connector SDK proof.** *Accept:* a fresh third-party source is added by `pnpm gen:connector` + `pnpm ingest --only <id>` + `pnpm snapshot:build` with **zero diffs outside `packages/connectors/<id>` and `snapshot/`**, proven in CI.

---

## 6. What makes it impressive

Not the glow. Four things an analyst will notice in the first two minutes:

1. **The disagreement halo.** Two independent global models of the same corridor, drawn simultaneously, at global scale. No existing tool does this, and it turns the field's central weakness into the most legible thing on screen.
2. **The Scenario VI moment.** The capacity screen shows, from the UN's own 2000 table, that holding Korea's 1995 PSR constant requires 5.149 billion migrants — with the UN's footnote calling it unrealistic. It is the fastest possible demonstration that "how many can a country hold" is a malformed question, made by a primary source rather than by us.
3. **`/sources` as an argument.** Twenty datasets, each with its licence, vintage, coverage and the specific way it silently lies to you. Four independently verified breakages in one probing session — DTM v3 tokens, GDELT GEO 2.0 now 404, Data360 frozen at 2021, UNHCR returning zero rows at HTTP 200 on the wrong code convention — are the evidence that the connector layer is the product.
4. **It runs on a plane.** `git clone && pnpm i && pnpm dev`, network off, whole world, working sliders, working solver. Every incumbent is SaaS behind a 403.

## 7. What is deliberately cut, and why

The Displacement Pressure Index (invented weights). Real-time branding (nothing bilateral is faster than monthly). UN DESA in the bundle (licence). UNHCR on launch (contradictory terms). The placement MILP (integrality trap, unbenchmarked latency, and person-level connotations we refuse). 4-digit occupational matching (does not exist in any free API). Global policy-restrictiveness beyond ~56 countries (fabrication). ADM2 people layers, route geometry, departure forecasting (ethics). WebSockets, accounts, LLM narration, 3D columns (noise). Every one of these cuts is written down on `/methods` with its reason, because the refusals are part of the argument.
