# EXODUS — an open migration-intelligence platform
### Reference implementation: CORRIDOR
**Lens: platform-first.** The MVP is a set of contracts. The app is the proof.

---

## 0. The one-sentence commitment

Every core connector, model, indicator, layer and panel in the shipped app is written against the *same public SDK a stranger gets*, imported through the same package specifier, gated by the same `apiVersion`, subject to the same policy engine and the same licence engine — and CI fails the build if that stops being true. Nothing about "the core" is special. That is the entire design, and every other decision below is downstream of it.

If this project is remembered in five years it will be because somebody added Bangladeshi BBS data, or a Gulf labour-card series, or a provincial Canadian housing register, in an afternoon, without asking us. The globe is the demo. The SDK is the product.

---

## 1. Scope in / scope out

### 1.1 In scope (v1)

**The platform (60% of build effort)**
1. `@exodus/contracts` — Apache-2.0, zero runtime dependencies beyond Zod. Seven contracts: `DataSource`, `Indicator`, `Model`, `MapLayer`, `Panel`, `Scenario`, `Policy`. Each is a Zod schema plus a TypeScript interface plus a generated JSON Schema (`z.toJSONSchema()`, Zod 4.6.5) published to `contracts/schema/*.json` so non-TypeScript implementers exist.
2. `@exodus/sdk` — the connector SDK: `pnpm gen:connector <id>` scaffolds a working, tested, licence-declaring connector in one command; `defineSource()`, `defineModel()`, `defineIndicator()`, `defineLayer()`, `definePanel()` helpers; a record-replay HTTP client that is the *only* way a connector may touch the network.
3. `@exodus/kernel` — pure functions. No imports outside `contracts`. No `Date.now`, no `Math.random`, no `fetch`, ESLint-enforced. Every model is `run(inputs, world, seed) -> Result`, referentially transparent, golden-vector tested, and runs identically in Node, in a browser worker, and in CI.
4. `@exodus/ontology` + `@exodus/semantic` — object types, properties, link types, action types, functions, interfaces (Foundry's own vocabulary, deliberately). The ontology is data; the entity pages, the Cmd+K palette, the permalinks and the working-set tray are *generated from it*. Adding an object type adds a screen.
5. `@exodus/policy` — `layer_policy.yaml`, the query planner's refusal path, the suppression ledger, the lexicon linter, the banned-schema-field gate. Ethics as an importable, testable package, not a `CONDUCT.md`.
6. `@exodus/license` — `license_id` and `redistributable` as mandatory columns; `bundle:verify` as the export gate; the SPDX declaration in every `PluginManifest`.

**The reference app (40%)**
7. CORRIDOR: nine surfaces, a deck.gl 9.4 globe, an offline world snapshot covering 233 ISO areas, eight models, a MILP allocation solver, a signed scenario format, and an SSE live layer behind a flag.

### 1.2 Out of scope, with the reason

| Cut | Reason |
|---|---|
| UN DESA IMS as shipped data | Non-commercial, *no derivative works*. Ships as a **recipe connector**: `pnpm ingest --only undesa-ims` fetches it to the user's machine with the `Mozilla/5.0` UA that avoids the 403. We redistribute the code, never the bytes. |
| UNHCR in the committed bundle | Two verification passes produced contradictory terms. `redistributable: 'unknown'` fails `bundle:verify` by design. Keyless connector, user-run, enabled by one flag. |
| IDMC, ACLED, EM-DAT, GADM, MIPEX, ReliefWeb, UNESCO UIS | NC, ND, share-alike or ToU-blocked. UNESCO's CC BY-SA 3.0 IGO is the contamination vector and is quarantined out of the core bundle entirely. |
| Any origin-side pressure/risk/departure index | Ethical rule 8. Not softened, not renamed — removed. The DPI composite from the research dies here; its *contract* (`Indicator` with visible weights) survives as a destination-side example. |
| WebSockets, accounts, RBAC | SSE is enough; auth is a distribution decision, not an MVP one. |
| Global ADM2, trajectories, route geometry | Ethical rules 1 and 4. Corridors are 2-vertex great circles between ADM0 centroids, enforced by a schema validator that rejects a third vertex. |
| Agent-based simulation, LLM in the data path | Unjustifiable at this budget; an LLM that states figures is a liability. |
| 4-digit ISCO matching | Does not exist in any free API. Schema is built at 4-digit; population is 1–2 digit; the UI states the gap. |
| kepler.gl | `styled-components ^6.1.0` peer collides with the token architecture. |
| Git LFS | Forks and pulls bill the parent repo's bandwidth until `git clone` breaks for everyone. |

---

## 2. The seven contracts (this is the deliverable)

```ts
// @exodus/contracts — Apache-2.0 (patent grant matters for implementers)
export interface PluginManifest {
  id: string;                    // reverse-DNS: org.exodus.eurostat
  apiVersion: `${number}.${number}`; // major gate, minor advisory
  version: string;               // semver of the plugin itself
  title: string;
  license: { spdx: string; url: string; attribution: string; redistributable: boolean | 'unknown' };
  capabilities: Capability[];    // 'net:https' | 'fs:corpus' | 'kernel' | 'layer' | 'panel'
}

export interface DataSource<T> {
  schema: ZodType<T>;
  cadence: Cadence;              // 'sub-hour'|'daily'|'monthly'|'quarterly'|'annual'|'quinquennial'|'frozen'
  latencyClass: LatencyClass;    // 'live'|'daily'|'periodic'|'annual'|'modelled'|'projected'
  coverage: Coverage;            // { iso3: string[]; years: [number, number]; adminLevel: 0|1 }
  plan(ctx): FetchPlan[];        // declarative: URLs, ranges, pagination — inspectable without running
  fetch(plan, ctx): Promise<RawArtifact>;   // the ONLY I/O, through the replay client
  transform(raw): Fact[];        // PURE. Tested with a recorded fixture. No network, no clock.
  subscribe?(ctx): AsyncIterable<Fact[]>;   // opt-in, only for sub-hour sources
}

export interface Model<I, O> {
  id: string;
  inputs: ZodType<I>;
  outputs: ZodType<O>;
  assumptions: AssumptionSpec[];     // every parameter, with provenance and a `placeholder: boolean`
  run(inputs: I, world: WorldView, seed: number): ModelResult<O>; // PURE
}

export interface Indicator { id; unit; denominatorRequired: boolean; compute(world, ctx): Figure; }
export interface MapLayer  { id; geometry: 'arc'|'choropleth'|'h3'|'point'; latencyClass; encode(facts): LayerSpec; }
export interface Panel     { id; objectTypes: string[]; render(props): ReactNode; }
export interface Scenario  { id; schema; apply(world, params): WorldView; }  // PURE
export interface Policy    { id; evaluate(query: QueryPlan): PolicyVerdict; } // deny -> 403 + machine body
```

**Five rules that make these contracts real rather than decorative:**

1. **The dogfood gate.** `pnpm check:dogfood` walks the import graph of every first-party package under `connectors/`, `models/`, `layers/` and fails if any import resolves outside `@exodus/contracts` + `@exodus/sdk`. There is no `../../core/internals`.
2. **Three implementations or no contract.** A contract may not land until three independent implementations exist. `DataSource` lands with Eurostat + Gaskin&Abel + GDELT — a REST/JSON-stat paginated source, a static bulk CSV, and a 15-minute polling feed. If a contract cannot serve all three, it is wrong, and we find out on day three instead of month six.
3. **`transform()` is pure and fixture-tested.** Every connector ships `fixtures/*.recorded.json` with `{url, fetchedAt, sha256, httpStatus, redirectChain}`. The redirect chain is recorded because IDMC's 302→presigned-S3 hop is otherwise invisible and its ~10-minute URL must never be cached.
4. **`apiVersion` is a hard major gate.** Loading a plugin with a mismatched major refuses with a named error in `/plugins`, never a runtime crash.
5. **Capabilities are enforced, not documented.** A plugin without `net:https` gets a network client that throws. This is what makes running a stranger's connector defensible.

---

## 3. Screen inventory

Nine surfaces, four overlays. Routes are exact.

| # | Route | What it is | Platform property |
|---|---|---|---|
| 1 | `/` | **Situation Globe.** Deck.gl `_GlobeView`, opaque ocean sphere (mandatory, because `cullMode:'none'` is a per-layer override), corridor arcs, per-capita choropleth, H3 r3 capacity hexes. Default camera on the Global South — justified: 53% of migrants move within their region of origin. | Every layer on it comes from the `MapLayer` registry. Removing the registry entry removes the layer with no other edit. |
| 2 | `/o/{typeId}/{objectId}` | **Entity page**, generated from the ontology. `country/DEU`, `corridor/SYR-DEU`, `indicator/physicians_per_1k`, `source/eurostat.migr_asyappctzm`, `scenario/abc123`, `occupation/isco-2`. Header, `<Figure>` grid, linked objects, panels contributed by plugins. | Zero bespoke code per object type. A plugin that registers an object type gets a working page and a Cmd+K entry for free. |
| 3 | `/graph` | **Corridor Graph.** Force-free chord/matrix hybrid over the bilateral matrix, three-slot categorical palette max, arc opacity driven by `estimate_kind` + per-country data-density. | Reads the same `Fact[]` the globe reads, through `semantic`, never a bespoke query. |
| 4 | `/capacity` | **Headroom Calculator.** Liebig-style minimum over per-capita *stock* ratios, assumption sliders, the mandatory label: "Modelled labour-market absorption under assumption set «name» — not a policy limit." | Every slider is an `AssumptionSpec` from the `Model` contract. The panel is generated from `assumptions`, not hand-built. |
| 5 | `/studio` | **Scenario Studio.** Nested-logit redistribution, close-a-corridor, shock GDP, change visa regime. Non-dismissible "SCENARIO — MODELLED, NOT POLICY" watermark on canvas. Scenario is a signed JSON doc, forkable, diffable, URL-encodable. | `Scenario.apply()` is pure and runs in a worker. Simulation and operations are physically separated: different schema namespace, different colour chrome. |
| 6 | `/compare` | **Compare.** 2–6 countries or corridors, tabular-nums, small multiples, explicit temporal `align(series, grid, method)` with default `"none"` — a missing year is a visible gap. | |
| 7 | `/brief/{id}` | **Brief.** A working set rendered as a printable, citable narrative with an AS-OF chip showing the *oldest* contributing vintage. | Composed entirely of `<Figure>` and `Panel` instances. |
| 8 | `/sources`, `/sources/{sourceId}` | **Sources — the trust argument.** Every source: licence SPDX, redistributable flag, cadence, vintage, latency days, coverage map, last fetch, replay corpus status, the exact `plan()` output as inspectable URLs. | This is the connector SDK made visible. It is the screen that recruits contributors. |
| 9 | `/plugins` | **Registry.** Installed plugins, contract versions, apiVersion compatibility, granted capabilities, licence flags, health and degradation state, and a tab with the live contract explorer (JSON Schema rendered from `contracts/schema/*.json`). | **The platform-first screen.** Nobody else in this space has one. It is where "modular and cross-agnostic" stops being a claim. |

**Overlays:** Cmd+K palette (`>` actions, `#` datasets, `@` countries, `~` corridors) · keyboard help · working-set tray (persistent, survives navigation) · provenance popover (any `<Figure>` click) · **policy-refusal sheet** (renders the machine-readable 403 body in human words when the query planner denies a cross-tab — the refusal is a designed surface, not an error toast).

**Non-negotiable UI invariants:**
- `<Figure>` is the only component permitted to render a number. `{value, unit, sourceId, vintage, method, ci, modelled}`. Missing source renders `—` with a badge, **never `0`**.
- One global `timeStore` `{cursor, window, playing, speed}`. No component holds local date state. ESLint rule.
- Latency class drives encoding and **the layer author does not choose it**: `live` emissive/pulsing · `daily` solid + one arrival pulse · `periodic` choropleth, no motion · `annual` desaturated + 4px hatch, no motion ever · `modelled` dashed path + ƒ glyph · `projected` hollow + watermark. Any derived metric inherits the **worst** class, the **oldest** vintage, and the **AND** of licence flags. Computed in `semantic`, not in the layer.
- `ArcLayer` cannot be dashed; modelled corridors tessellate to 32–64-point `PathLayer` great circles.
- Colour of people is never red/orange/yellow. Warm hues mark service and rights deficits only.
- Globe text alternative on `Shift+G`: top-25 corridors as a sorted, keyboard-navigable table, `role="application"` + `aria-describedby`.
- Tokens: `--bg-canvas #06080C`, `--surface-0 #0B0E14`, `--text-primary #E8ECF2`, `--text-muted #6E7A8C` (labels/axis only), `--accent #4DA3FF` (never a data series), `--border-interactive #5C6B85` around every interactive control, `--scrim-globe rgba(6,8,12,.72)` behind every label over the WebGL canvas. Diverging neutrals raised to `#5F5F5A`/`#908F8E` with a hairline stroke and a distinct no-data hatch.

---

## 4. The exact data bundle

**Contract: `git clone && pnpm i && pnpm dev` with the network cable out renders 233 areas, working sliders, a working solver.** Anything that cannot satisfy that is an enhancement.

### 4.1 Committed to the repo (target ≤ 90 MiB total, no single file > 50 MiB, no LFS)

| File | Source | Bytes (target) | Licence | Notes |
|---|---|---|---|---|
| `data/world/flows.parquet` | **Gaskin & Abel, Nature 655(8121), Zenodo 10.5281/zenodo.17344747** | ~28 MiB | CC BY 4.0 | The spine. Annual bilateral flows 1990–2023, 230 countries, **with per-cell uncertainty** (`stock_std`, `mig_prev_std`, `mig_brth_std`). Filter `orig == dest`. `estimate_kind='modelled'`, 73% test correlation, African net migration least certain — all carried as row metadata. Skip `T.nc` (3.3 GB). |
| `data/world/flows_ac6.parquet` | **Abel & Cohen v6**, figshare 14579241 | ~6 MiB | CC BY 4.0 | 232 countries, `year0 ∈ {1990..2015}`, `sex ∈ {female,male}` only — **sum yourself, there is no total**. `type ∈ {outward,return,transit}` — **naive summation triple-counts**. Default estimator `da_pb_closed`; the three-way spread is the uncertainty band. |
| `data/world/asylum_monthly.parquet` | Eurostat `migr_asyappctzm` (+5 siblings) | ~7 MiB | CC BY 4.0, Dec. 2011/833/EU, commercial OK | The only genuinely sub-annual bilateral series. EU+EFTA destinations, through 2026-08. `OBS_FLAG`/`CONF_STATUS` preserved per row (DE←SY 2023/2024 both carry `e`). |
| `data/world/demography_inputs.parquet` | UN WPP 2024 | ~5 MiB | — | **Inputs, not outputs.** Base population by single age × sex × 237 countries, `L(a)` survivorship, `ASFR`, `SRB`. The projection runs in the kernel. Normalisation baked into ingest: `SRB/100`, `ASFR/1000`, `population×1000`; `LocTypeName='Country/Area'`; multi-member gzip reader (a single-member reader returns 634 bytes and **no error**). |
| `data/world/capacity.parquet` | WDI v2, WHO GHO | ~3 MiB | CC BY 4.0 | Physicians, nurses/midwives, hospital beds, health spend per capita, dwellings proxy, GDP pc PPP (`NY.GDP.PCAP.PP.KD`, **constant 2021 international $** — rebase `y*` accordingly). GHO: key on `TimeDim`, sort before taking latest. |
| `data/world/gravity.parquet` | CEPII Gravity 202211 | ~2 MiB | Etalab 2.0 | `dist`, `distcap`, `distw_harmonic`, `contig`, `comlang_off`, `comlang_ethno`, `comcol`, `col45`, `comrelig`, `scaled_sci_2021`. **`distw`, `distwces`, `colony`, `smctry` do not exist in Gravity** — legacy GeoDist only. |
| `data/world/remittances.parquet` | KNOMAD BRE via Data360 | ~0.4 MiB | CC BY 4.0 + WB addendum | 10,619 rows, frozen 2021. `REF_AREA` = remitting, `COMP_BREAKDOWN_1` = receiving. **Filter `WB_KNOMAD_WLD` or you double every total.** Six corridors (India↔Pakistan, Lebanon↔Israel, Azerbaijan↔Armenia) are **absent rows, not zeros** → hard-coded `estimate_kind='assumed_zero'`. |
| `data/world/missing_migrants.parquet` | IOM Missing Migrants | ~1 MiB | CC BY 4.0 | The only unambiguously redistributable crisis dataset in the catalogue. |
| `data/geo/world.pmtiles` | **`ne_10m_admin_1_states_provinces` 5.1.1** + admin_0 + `ne_10m_admin_0_disputed_areas` | ~12 MiB | **Public domain, no attribution required** | Not CGAZ (raw GitHub returns 134-byte LFS pointers), not gbOpen (~42% ODbL at ADM1 → share-alike). POV: `COALESCE(NULLIF(fclass_{pov},''), fclass_iso)` — `FCLASS_US` is null for 249/258 records. |
| `data/xwalk/country_codes.parquet` | ours | ~0.1 MiB | CC0 | **A versioned table with validity date ranges, not a dict literal.** Five namespaces: M49, ISO3, Eurostat GEO (`UK` not `GB`, `EL` not `GR`, `XK`), OECD `REF_AREA` (+`W`), KNOMAD prefix, **UNHCR legacy (collides with ISO3: `AUS`=Austria, `CHI`=China)**. Explicit rows for Kosovo, Taiwan, Palestine, Western Sahara, Curaçao, Sudan-2011, Serbia-Montenegro-2006, USSR, Yugoslavia. |
| `corpus/{gdelt,usgs,gdacs,movement-distribution}/` | replay corpus | ~25 MiB | GDELT redistribution explicitly permitted; USGS/GDACS public | 72 hours of GDELT **events only — GKG excluded** (5.3–5.9 MB per 15-min slot → 45–50 GB for 90 days). No IDU in the corpus: one IDU file makes the repo's data component CC BY-NC-SA. |

**Bundle size is measured in week one, not assumed.** The ≤45 MiB `world.parquet` figure in the research is an unmeasured estimate; nullable CI columns are the blow-up risk. M0 ships a `pnpm snapshot:measure` that prints per-table compressed bytes and fails CI above budget.

### 4.2 Downloadable enhancement packs (GitHub release assets — <2 GiB each, up to 1000, no total-size or bandwidth limit)

`pnpm snapshot:pull` fetches: full Gaskin & Abel with all uncertainty columns, Eurostat `migr_imm5prv` bulk (798 MB raw), OECD IMD extract, HDX HAPI IDP series, WPP full output for validation. **Absent → `SNAPSHOT` mode with reduced columns, never a crash, never a blank.**

### 4.3 Recipe-only connectors (code shipped, data never)

`undesa-ims` (non-commercial, no derivatives; needs `User-Agent: Mozilla/5.0 (X11; Linux x86_64)` or 403; 173 of 233 countries are 2020 extrapolations → per-country `revision_status`), `unhcr` (licence unresolved; `cf_type=ISO` or Germany silently returns 0 rows at HTTP 200; `yearFrom`/`yearTo`; join on `coo_iso`/`coa_iso`; numerics are strings and `"-"`), `idmc-idu` (CC BY-NC-SA), `hdx-hapi` (self-minted `app_identifier`, no registration; **`/coordination-context/conflict-events` is ACLED-sourced and excluded**; licences resolved via `hdx_api_link` → CKAN `package_show`, because `/metadata/dataset` carries no licence field), `ilostat`, `unesco-uis` (quarantined: CC BY-SA 3.0 IGO).

Each one is a full, tested, documented connector. The user runs `pnpm ingest --only unhcr` and it merges into their local world. **We ship the pipe, not the water.** That is the licence answer *and* the platform answer, and they happen to be the same answer.

---

## 5. The exact models implemented

All eight live in `@exodus/kernel`, all pure, all seeded, all with golden vectors, all declaring `assumptions` with `placeholder: true` where the parameter is a placeholder — and **`placeholder: true` renders a visible badge in the UI**. Nothing is ever described as "standard" or "from the literature" unless it is.

**M1 — Cohort-component projection.** WPP 2024 inputs, single-year ages, 237 countries. `S[a]=L[a+1]/L[a]`; `B=Σ_{15..49} f[a]·0.5·(P_F[a][t]+P_F[a][t+1])`. Unit normalisation is the difference between an engine and nonsense and is asserted in tests (`SRB` raw would give a 99.1% male birth share). Provides the **VarID 2 (Medium) − VarID 7 (Zero migration)** counterfactual, which is the product's core primitive.

**M2 — Replacement-migration bisection.** "Migration needed to hold OADR/PSR constant." **UN PSR = P₁₅₋₆₄/P₆₅₊** — a WAP of 20–64 systematically overstates need. **Check that bracket endpoints straddle the target before bisecting: monotonicity fails for profiles weighted toward 65+.** Converges in ~14–17 iterations at 1e-4 relative tolerance. Sanderson–Scherbov POADR displayed alongside (Germany +11.3% vs conventional +49.2%). Ships with the 2000 UN Table 8 values as golden vectors, **including Scenario VI's own footnote that it is unrealistic** (Republic of Korea: 5.149 billion).

**M3 — Absorption headroom (Liebig minimum over per-capita *stock* ratios only).** `AnnualIntakeCapacity = min_{k∈K_stock}[(x_k/target_k − 1)·pop] / horizon`, `K_stock` = physicians, nurses/midwives, beds, health spend pc, dwellings. Three research-identified formula defects fixed before coding: the `365/TTF_o` annualisation multiplier goes **inside** the Σ; the per-1,000 ratios are reconciled with absolute population (a factor-of-1,000 error); the soft-min carries `1/J` normalisation (six tied modules otherwise produce a spurious 27% haircut). Flow indicators are excluded — taking the min across all 12 yields ≤0 for **every country on Earth**. WHO's 4.45/1,000 is used as a **floor, explicitly not an optimum**. The model card states that holding service stock fixed while growing population systematically **understates**, because migrants bring physicians.

**M4 — PPML gravity.** Poisson quasi-ML with clustered SEs, not OLS-on-logs (Santos Silva & Tenreyro 2006). The UI never says "PPML is unbiased" — Martin & Pham (2020) find alternatives less biased under economically-determined zeros, and that caveat ships in the model card. Shipped day-one coefficients, all badged placeholder: `β_yd +0.76` (European pairs +1.90, non-European destination +0.42), `β_yo −0.33`, colony `+0.85` **or** `+0.77` — **alternative specifications of one dummy; adding both double-counts, and the UI enforces the choice as a radio**; entry-law tightening −0.06/−0.02; Maastricht +10% intra-European; diaspora elasticity **≈+1.0** (Beine/Docquier/Özden 2011, *not* 0.70). `β_dist`, `β_comlang`, `β_contig`: signs only, magnitudes unattributed. **Evaluated with CPC (Bray–Curtis) against Gaskin & Abel, with the radiation model rendered beside it as a null model, never as the baseline.** The honest bar is on screen: Robinson & Dilkina's global-scale CPC of 0.16 for gravity/radiation, 0.43 for XGBoost without a production function — and the accompanying note that roughly half the achievable accuracy lives in getting origin outflow totals right.

**M5 — Nested logit with multilateral resistance.** `I_ir = λ_r·ln Σ_{j∈r} exp(ln A_ij/λ_r)`; `M̂_ij = O_i·P(r|i)·P(j|i,r)`. Row sums equal `O_i` by construction, so closing a corridor **redistributes rather than deletes** — this is the only correct engine for "close the Mediterranean" scenarios. Visa effects are **calibrated so the simulated drop lands at 40–47%** with 2.8–16.9% diversion, not dropped in raw: a reduced-form gravity coefficient cannot be inserted into a λ-scaled nested logit.

**M6 — Allocation MILP.** `highs@1.15.3` (MIT) + `lp-model@0.4.2`. **`glpk.js` avoided — GPL-3.0.** Objective `max Σ(w_E·E + w_P·P + w_N·N + w_L·L + w_H·H − w_K·K)·x_ij + w_F·t − w_U·Σv_i − w_S·Σz_jd − w_Q·Σδ_m`, weights `.30/.25/.15/.10/.08/.05/.07`. Three spec bugs fixed: **`z_jd` is defined** (`z_jd ≥ Σs_id·x_ij − θ·c_jd`, θ=0.85), **C8 is two linear rows** not an absolute value, **C6's ρ=0.02 carries an explicit time window**. Candidate pruning K=20 is the performance trick (800k binaries → 40k; ~300k nonzeros with six capacity dimensions). **LP integrality is not relied on** — total unimodularity dies with C4–C7. Output is a **ranked shortlist of three with per-term score decomposition and the runner-up's losing term**; there is no code path from `solve()` to `commitPlacement()` without a human actor id (GDPR Art. 22), and the override rate is published. Protected attributes are excluded from `E_ij` training with a CI gate at adversary AUC ≤0.65.

**M7 — Disagreement band.** For EU pairs, `migr_imm5prv[geo=B,partner=A]` vs `migr_emi3nxt[geo=A,partner=B]` — mirror statistics, rendered as a divergence band on the arc. Everywhere else, **Abel & Cohen v6 vs Gaskin & Abel on the same corridor**: two independent models over the same stock tables, whose disagreement is the best available uncertainty proxy. **A globe showing one number per arc is lying.** This is the headline feature and it is a model, not a decoration.

**M8 — Matching function.** `M = A·U^α·V^(1−α)`, **α ≈ 0.6** (Petrongolo & Pissarides, range 0.5–0.7), `JVR = V/(V+O)×100` (Eurostat definition). Runs only for the ~37 national vacancy reporters. **Every other country renders "no demand data" — never zero, never interpolated.** Occupational resolution is ISCO 1-digit crossed with birth status (`DF_EMP_TEMP_SEX_OCU_CBR_NB`), 2-digit without it; the UI says so on the panel, permanently.

**Explicitly not implemented:** any departure forecast, any outflow-risk score, any origin pressure index, any scalar capacity number. Forecast targets are restricted to arrivals-and-needs at destination. The banned output strings `capacity limit`, `carrying capacity`, `maximum`, `threshold`, `saturation` are CI-enforced. The migration hump ships as a **toggle**, not a default, with both sides on the card: Clemens (reverses ≈$10,000 PPP) and Benček & Schneiderheinze (the hump disappears under country FE, with a significant *negative* relation). The functional form `h(y)=1−((ln y−ln y*)/σ_y)²` is labelled as **this project's own construction, not literature**.

---

## 6. Architecture

### 6.1 Packages and the CI-enforced import graph

```
contracts/          (Apache-2.0)  ← nothing
sdk/                             → contracts
kernel/                          → contracts                 [pure, no I/O, no clock]
policy/                          → contracts
license/                         → contracts
ontology/                        → contracts
registry/                        → contracts, sdk
store/                           → contracts                 [DuckDB-WASM / Arrow]
connectors/*                     → contracts, sdk            [ONLY]
models/*                         → contracts, kernel         [ONLY]
semantic/                        → contracts, ontology, registry, store, kernel, policy, license
ui/, globe/                      → contracts, semantic
apps/corridor/                   → ui, globe, semantic
```

`pnpm check:graph` fails the build on any violation. `pnpm check:dogfood` additionally fails if a first-party connector or model reaches for anything a third party could not import.

### 6.2 Determinism and replay

Corpus at `./corpus/{sourceId}/{ISO8601}.{ext}` with `{url, fetchedAt, sha256, httpStatus, redirectChain}`. `EXODUS_MODE=replay EXODUS_CLOCK=2026-09-18T00:00:00Z` reproduces any render byte-for-byte. **No `Date.now()` outside `@exodus/clock`, ESLint-enforced.** Every model takes an explicit `seed`. This is day-one infrastructure, not an afterthought, because it is the only way a stranger's bug report is actionable.

### 6.3 Live layer (feature-flagged enhancement)

One multiplexed SSE stream, `GET /live/stream?sources=a,b`. Not WebSockets. Poll GDELT `lastupdate.txt` on a 60 s timer and act on slot change (rewrite `http://` → `https://`; the translingual feed lags one slot; the DOC API enforces ≥5 s spacing and 429s on first call from shared IPs; **GEO 2.0 is 404 — do not build it**). IDMC every 6 h, HAPI 24 h against `hapi_updated_date`, Eurostat TOC daily (`catalogue/toc/txt?lang=en`, 240 `migr_*` codes, carries `last update of data`). GDACS via `alertlevel`/`alertscore`/`episodealertlevel` — **never string-match the icon path**. Backoff: full jitter, base 1 s, cap 300 s, `degraded` after 5 failures. **Degraded layers do not disappear** — they render struck-through in the legend, because a vanished conflict layer reads as "no conflict".

Only GDELT, USGS and GDACS may wear LIVE chrome. Eurostat monthly is branded **"Live signal"** with a ~4-week latency badge. Everything else is **"Reference"**. The string "real-time" never appears next to a stock or a flow.

### 6.4 Degradation ladder

`LIVE → CACHED → SNAPSHOT → UNAVAILABLE`, an explicit enum in the status bar. Never blank, never zero-as-missing. `align(series, grid, method)` defaults to `"none"`.

### 6.5 Rendering

`deck.gl@9.4.0` + `@luma.gl/core@9.4.1` + **`@luma.gl/effects@9.4.1`** (post-FX lives here: `bloom` with `radius`/`threshold`/`intensity` and no mip prop, `vignette`, `fxaa`, `toneMapping`, SSAO/outline pipelines; **there is no standalone chromatic-aberration module**, it is a prop of the bloom lens pipeline). `maplibre-gl@6.10.0` (ESM-only, no `require` condition) with `@deck.gl/maplibre@9.4.0`, keeping `@deck.gl/mapbox@9.4.0` as the fallback pin. `_GlobeView` imported aliased, `lnglat` only, with the documented GLOBE↔FLAT switching issues treated as a week-one gate. FLAT mode above zoom 6 is MapLibre + `MapboxOverlay` interleaved. `parameters:{cullMode:'none'}` on arcs and trips, which makes the opaque ocean sphere **mandatory**. `HeatmapLayer`, `ContourLayer` and `MaskExtension` are unsupported on globe and are not used. H3 global ceiling **r4 (288,122)**, people layers capped at **r3** by policy, `highPrecision:'auto'` always, rendering **density = pop/cellArea** (r4 areas span 2.38×). Budget: 60 fps to ~1M items, so the arc layer is capped and ranked, never dumped.

`@geoarrow/deck.gl-geoarrow@0.4.2` is **gated behind a day-one smoke test** — it declares peers `^9.0.0` but dev-pins `9.2.1`, carries a 2021-vintage `threads` dep, and ships **no `GeoArrowGeoJsonLayer` and no `GeoArrowIconLayer`**, so choropleths use `GeoArrowPolygonLayer`/`GeoArrowSolidPolygonLayer` or we fall back to the 9.2.1 pin.

### 6.6 Toolchain

pnpm 12.4.2 · Turborepo 2.11.2 · TypeScript 7.0.2 (`erasableSyntaxOnly` → no enums, no namespaces; the research's ENUM columns become string unions) · Node 24.21.0 LTS · Zod 4.6.5 · Biome 2.5.14 · Vitest 5.0.1 · Playwright 1.63.0 (`--use-gl=angle --use-angle=swiftshader-webgl --enable-unsafe-swiftshader`). Scenario URLs use `base64url(deflate-raw(json))` — **`CompressionStream` has no zstd**. Parquet reading via `@loaders.gl/parquet@4.5.1` and DuckDB-WASM 1.32.0; if any table lands as zstd, `hyparquet-compressors` is required because hyparquet natively reads uncompressed + Snappy only.

### 6.7 Licensing and governance

Code **AGPL-3.0-or-later**; `contracts` and the connector template **Apache-2.0** for the patent grant. §13's network-interaction clause obliges an offer of Corresponding Source to **all** users including internal ones — there is no "public" qualifier, and the README says so plainly. DCO sign-off, not a CLA. **REUSE 3.3** via `REUSE.toml` (DEP5 deprecated, mutually exclusive), `reuse lint` in CI. The README states the OSD trade-off out loud: clauses 5 and 6 mean a use-restricted licence forfeits the open-source designation, so our ethical limits live in the *code and the policy engine*, not in the licence.

### 6.8 Ethics as a package, not a document

`@exodus/policy` enforces, with tests: the **Operational Latency Floor** (movement layers ≥7-day lag, ≥monthly bucket, ADM1 or coarser wherever origin is disaggregated; ADM2 destination only with origin fully undisaggregated at ≥30 days and ≥quarterly) — **capacity is live and fine-grained; people are not**; no individual-level data ever (CI fails on any schema containing `person`, `individual`, `case_id`, `applicant`, `biometric`, `name`, `dob`); suppression K=25/K=100 with denominator floor 10,000, **complementary** and **frozen** suppression with an append-only published ledger, rounding applied *after* suppression; no route geometry (>2-vertex movement LineStrings rejected at the schema); **no cross-tab of nationality with geography finer than ADM0, refused with HTTP 403 and a machine-readable policy body — not 451**, which RFC 7725 reserves for legally-compelled blocking; no EU AI Act Annex III(7) function and no Art. 5(1)(g) biometric categorisation, ever, with the dates cited in the model cards; the denominator mandate (no absolute people-count without a simultaneous per-capita value, per-capita as default encoding, symmetric in/out arcs); the **lexicon lint** structured on Mendelsohn & Budak's seven dehumanising source concepts (animal, vermin, parasite, physical pressure, water, commodity, war) with UNGA Res. 3449 (XXX)'s "non-documented or irregular migrant workers" as the required form; banned visual motifs (no crosshairs, reticles, radar sweeps, threat pulses, dossier cards, silhouettes; `watchlist→saved_views`, `target→area_of_interest`, `entity→place|indicator`; global search indexes no person-shaped type); viewer privacy (zero third-party scripts, cookieless self-hosted analytics, 7-day retention, IP truncation preferring /32 over the /48 ceiling); redress with a 30-day SLA, `.github/ISSUE_TEMPLATE/harm-report.yml`, the power to de-publish a layer and a public de-publication log.

**Because this is a package, a third-party plugin inherits every one of these rules without its author reading a single line of the ethics doc.** That is the platform-first argument for ethics: a norm that is not executable is a norm that ships once.

---

## 7. Milestone plan

Each milestone must run **end-to-end from a cold install with the network disabled** before the next begins. That is the acceptance gate, repeated eight times.

**M0 — Gates and smoke tests (day 1).** Three known unknowns are resolved before any product code: `_GlobeView` GLOBE↔FLAT transition prototype; `@geoarrow/deck.gl-geoarrow@0.4.2` against deck.gl 9.4.0; `pnpm snapshot:measure` printing real compressed parquet bytes.
*Accept:* a globe rotates with one arc layer and one choropleth at ≥60 fps on integrated graphics; the geoarrow verdict is recorded in `DECISIONS.md` with the chosen pin; measured bundle size is under 90 MiB or the column set is cut on the spot.

**M1 — Contracts + SDK + three connectors.** `@exodus/contracts` with all seven interfaces, JSON Schema emitted; `pnpm gen:connector`; Eurostat, Gaskin&Abel and GDELT connectors written *against the public SDK only*.
*Accept:* `pnpm check:graph` and `pnpm check:dogfood` pass; three connectors produce valid `Fact[]` from recorded fixtures with the network off; `pnpm gen:connector demo && pnpm test` passes on a freshly scaffolded connector in under two minutes.

**M2 — Snapshot + store + provenance.** `pnpm ingest`, `pnpm snapshot:build`, `pnpm bundle:verify`. Every row carries `license_id`, `redistributable`, `estimate_kind`, `vintage_date`, `latency_days`.
*Accept:* `bundle:verify` **refuses** to include a deliberately-inserted UNHCR row and names the reason; the committed bundle covers 233 areas; the crosswalk resolves `AUS`, `CHI`, `UK`, `EL`, `XK` and Sudan-2011 correctly in a test.

**M3 — Globe + choropleth from snapshot, offline.** Situation Globe, per-capita default, three-slot map palette, opaque sphere, `<Figure>`, one global `timeStore`.
*Accept:* network off, `pnpm dev`, 233 areas render; `Shift+G` produces the top-25 corridor table and it is keyboard-navigable; `prefers-reduced-motion` gives instant cuts and static arcs; no absolute people-count renders without its per-capita twin (asserted by a Playwright test).

**M4 — Provenance drawer, /sources, /plugins, and the visual pass.** The trust surfaces, plus the deliberate design push: type scale, motion budget, scrim over canvas, hatch for modelled, the AS-OF chip showing the **oldest** vintage.
*Accept:* every number on screen opens a provenance popover naming source, vintage, method and licence; `/sources` lists every connector with its `plan()` URLs; `/plugins` shows apiVersion compatibility; a contrast audit passes at the documented ratios; a designer-quality screenshot exists.

**M5 — Kernel: M1, M2, M3.** Projection, replacement bisection, headroom. `/capacity` generated from `AssumptionSpec`.
*Accept:* golden vectors match UN Table 8 for EU/Japan/Germany/USA/Italy under Scenario V and III; the bisection converges in ≤20 iterations and **refuses with a named error when the bracket does not straddle**; the headroom panel carries the mandatory non-limit label and the understatement caveat; the banned-string linter passes.

**M6 — Corridor arcs, disagreement band, /graph.** M4, M7. Coverage-asymmetry encoding.
*Accept:* an EU pair shows the mirror-statistics divergence band; a non-EU corridor shows the Abel&Cohen vs Gaskin&Abel band; Gulf, China, Russia and Iran corridors visibly render with lower authority than German register data; CPC against Gaskin & Abel is displayed beside the radiation null model.

**M7 — Allocation MILP + Scenario Studio.** M5, M6, M8, signed scenario JSON, URL encoding.
*Accept:* the solver returns three ranked options with per-term decomposition and the runner-up's losing term, in-browser, on a pruned 2,000×400 instance; `commitPlacement()` is unreachable without a human actor id (asserted by a type-level test *and* a runtime test); the scenario watermark is non-dismissible; a scenario round-trips through a URL; closing a corridor **redistributes** rather than deleting, with row sums preserved to 1e-9.

**M8 — Live refresh + incident layer.** SSE, GDELT/USGS/GDACS, degradation ladder.
*Accept:* pulling the network mid-session degrades LIVE → CACHED → SNAPSHOT with the status bar tracking it and no layer disappearing; a struck-through legend entry appears after five failures; replay mode reproduces a prior render byte-for-byte.

Everything else is `BACKLOG.md`.

---

## 8. What makes this impressive

1. **`/plugins` and `/sources` are screens, not appendices.** Open-source projects in this space hide their pipes. Ours are the pitch: every URL the system will fetch, inspectable before it runs, with its licence and its latency next to it.
2. **The disagreement band.** Two independent global models over the same stock tables, rendered as a band on every arc. Nobody else does this, and it is the honest answer to "how confident are you?"
3. **Coverage-asymmetry encoding.** Gulf labour corridors do not get to look like German register data. This is a visual argument about epistemics that reads in half a second.
4. **A stranger adds a source in an afternoon.** `pnpm gen:connector` → `pnpm ingest --only <id>` → `pnpm snapshot:build`. Zero core edits. Demonstrated in the README with a real third-party dataset.
5. **Ethics that execute.** Rules 1–18 are a package with tests, not a document. A plugin inherits them.
6. **Deterministic replay from day one.** `EXODUS_MODE=replay` makes every bug reproducible and every figure auditable.
7. **It works on a plane.** 233 countries, working sliders, a working MILP, no network.

## 9. What is deliberately cut, and I will defend each one

- **Beauty-per-screen, in exchange for screens-per-hour.** The ontology generates entity pages; they are consistent and slightly generic. I take that trade because the tenth object type costs nothing.
- **The composite pressure index.** It was the most seductive feature in the research and it violates ethical rule 8. Gone, not renamed.
- **UNHCR data in the box.** The most-wanted dataset in the domain sits behind one flag and one local command, because two verification passes disagreed on its terms and shipping it anyway would poison the bundle's licence story — which is the only thing making the bundle redistributable at all.
- **Live anything beyond three feeds.** GDELT, USGS, GDACS. Everything else says Reference and shows its vintage.
- **Occupational depth.** 4-digit schema, 1–2 digit data, stated in the UI forever.
- **Mobile.** 1440px+ only.