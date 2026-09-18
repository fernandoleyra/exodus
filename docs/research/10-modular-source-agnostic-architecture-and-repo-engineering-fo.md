## 0. Ground rules the agent must obey literally

1. **Zero external accounts.** `git clone && pnpm install && pnpm dev` must render the entire world with real data. No API key, no Docker, no Postgres, no cloud account. Live connectors are an *enhancement layer* behind a feature flag that fails closed to snapshot data.
2. **Nothing in the render layer knows where data came from.** Renderers read the semantic layer only. A connector can be deleted and the app still boots with degraded coverage, never a crash.
3. **Every number on screen is traceable to a source, a vintage and a license, in one hover.** No unattributed figure ships.
4. Pin every version exactly (no `^`). Versions below were resolved from the npm registry on 2026-09-18.

---

## 1. Toolchain decisions (verified 2026-09-18)

| Concern | Choice | Exact version | License | Why this and not the alternative |
|---|---|---|---|---|
| Package manager | pnpm workspaces | `12.4.2` | MIT | Content-addressed store; strict `node_modules` catches phantom deps that break plugin isolation. `catalog:` protocol pins shared deps in one place — mandatory here because 6 packages share `apache-arrow`. |
| Monorepo task runner | Turborepo | `2.10.13` | MIT | Content-hash task cache + `--affected` means a connector edit rebuilds one package. Nx is heavier and its plugin inference fights a repo that already has its own plugin concept. Lerna is publish-only. |
| Framework | **Vite + React + TanStack Router** (app shell) with a thin **Hono** worker for live proxying | vite `8.3.0`, react `19.3.0`, `@tanstack/react-router` `1.170.38` | MIT | **Reject Next.js `16.3.5` for the MVP.** Next couples you to a Node server and RSC boundaries that are hostile to a WebGL app whose entire state is client-side (DuckDB-Wasm, deck.gl, worker threads). Static Vite build deploys to any static host (GitHub Pages, S3, IPFS) with zero accounts — that is the hard constraint. Remix/React Router `8.4.0` is a valid fallback; SvelteKit is rejected for deck.gl ecosystem reasons. |
| Language | TypeScript | `7.0.2` | Apache-2.0 | Native-port compiler; `--strict`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `verbatimModuleSyntax: true`, `moduleResolution: "bundler"`, `erasableSyntaxOnly: true` (no enums/namespaces — keeps plugins loadable as plain ESM). |
| Runtime | Node | `24.21.0` (LTS "Krypton") | — | Pin via `.nvmrc` + `engines`. Do **not** use `26.9.0` (Current, not LTS). |
| Validation | **Zod** | `4.6.5` | MIT | Every plugin manifest, every ingested row batch, every scenario JSON is Zod-parsed at the boundary. Chosen over Valibot `1.5.0` (smaller but weaker `z.discriminatedUnion` ergonomics for plugin kinds) and ArkType `2.2.3` (fastest, but its type-level parser destroys IDE perf in a repo this size). Derive JSON Schema via `z.toJSONSchema()` to publish the plugin contract to non-TS authors. |
| Server state | TanStack Query | `5.103.1` | MIT | |
| Client state | Zustand | `5.0.15` | MIT | One store per concern (`useViewStore`, `useScenarioStore`, `useSelectionStore`). Jotai `3.0.0` rejected: atom-per-indicator explodes with ~400 indicators. |
| URL state | TanStack Router search params, Zod-validated | — | — | **The URL is the scenario.** `?y=2026&ind=labour_gap&geo=DEU&cmp=POL,UKR&scn=<base64url-zstd>`. Every view is shareable and citable without a backend. |
| Query/API | **REST + OpenAPI 3.1**, generated client via `@hey-api/openapi-ts` `0.99.0` | — | MIT | tRPC `11.19.0` rejected: it makes the API TS-only, and this project must be consumable by Python/R researchers and by institutional integrators. GraphQL rejected: extra runtime, no benefit over a columnar-first data plane. The OpenAPI doc is *generated from the same Zod schemas* used by plugins — single source of truth. |
| Analytical store (browser) | DuckDB-Wasm | **`1.32.0`** or `@next` (`1.33.1-dev64.0`) | MIT | ⚠️ **Hard trap:** the npm `latest` tag is `1.33.1-dev57.0`, which *creates OPFS files but never writes to them*. Pin `1.32.0`. Call `CHECKPOINT;` after every write you need to survive a reload. Treat OPFS as cache, not storage. |
| Analytical store (node/CI) | `@duckdb/node-api` | `1.5.5-r.5` | MIT | Same SQL dialect as the browser, so ingestion transforms and browser queries are literally the same `.sql` files. |
| Columnar interchange | `apache-arrow` `21.2.0`; `hyparquet` `1.31.1` for zero-dep Parquet reads | — | Apache-2.0 / MIT | DuckDB→Arrow→deck.gl with no JS object materialisation. |
| Map render | `deck.gl` `9.4.0` + `maplibre-gl` `6.10.0` + `pmtiles` `4.5.0` | — | MIT / BSD-3 / BSD-3 | PMTiles = single-file tiles over HTTP range requests → basemap with **zero tile server, zero account**. |
| Geo binary layers | `@geoarrow/deck.gl-layers` `0.3.2` | — | MIT | Feed Arrow buffers straight to GPU; ~400k admin-1 polygons without GC pauses. |
| Styling | Tailwind CSS `4.3.3` + `radix-ui` `1.6.7` + `lucide-react` `1.47.0` | — | MIT / ISC | |
| Lint/format | Biome `2.5.14` | — | MIT OR Apache-2.0 | One binary replaces ESLint+Prettier; ~20x faster in CI. |
| Unit/integration tests | Vitest `5.0.1` | — | MIT | Simulation kernel is pure functions → 100% coverage gate on `packages/kernel`. |
| E2E + visual regression | Playwright `1.63.0` | — | Apache-2.0 | `toHaveScreenshot({ maxDiffPixelRatio: 0.01 })` against a WebGL canvas **only after** `await page.waitForFunction(() => window.__deckIdle === true)`; force `--use-gl=swiftshader` in CI for determinism. |
| Release/versioning | Changesets `3.0.3` | — | MIT | Independent versioning per plugin package. |
| Bundler for libs | tsdown `0.23.0` | — | MIT | |
| i18n | `next-intl`-independent: use **`@formatjs/intl`** + ICU MessageFormat files | — | — | See §7. |

---

## 2. Monorepo layout

```
exodus/
├─ pnpm-workspace.yaml          # packages/*, apps/*, connectors/*, catalog:
├─ turbo.json                   # pipelines: build, test, lint, ingest, snapshot
├─ .nvmrc                       # 24.21.0
├─ REUSE.toml                   # per-path SPDX for code AND data (§8)
├─ apps/
│  ├─ web/                      # Vite SPA. Imports ONLY @exodus/semantic + @exodus/ui
│  ├─ gateway/                  # Hono worker: live-source proxy + CORS shim. Optional.
│  └─ docs/                     # Astro/Starlight; renders indicator + source catalogues
├─ packages/
│  ├─ contracts/                # Zod schemas + TS interfaces. ZERO runtime deps. §4
│  ├─ ontology/                 # entity types, ISO/M49 crosswalks, temporal alignment §3
│  ├─ registry/                 # indicator registry, plugin loader, capability negotiation
│  ├─ kernel/                   # pure simulation functions. NO I/O. NO imports outside contracts
│  ├─ store/                    # DuckDB adapter (wasm + node behind one interface)
│  ├─ semantic/                 # THE ONLY API the UI may call
│  ├─ ui/                       # design system, panels, legends, provenance tooltip
│  ├─ globe/                    # deck.gl layers, camera, picking, arc/flow renderers
│  ├─ snapshot/                 # snapshot builder CLI + manifest signing
│  └─ testkit/                  # golden fixtures, property-test generators
└─ connectors/
   ├─ _template/                # `pnpm gen:connector` copies this
   ├─ un-desa-migrant-stock/
   ├─ worldbank-wdi/
   ├─ ilostat/
   ├─ unhcr-refugee/
   ├─ eurostat/
   └─ ...                       # each is an independently publishable npm package
```

**Dependency rule, enforced in CI** (`biome` + a custom `scripts/check-layers.ts` that parses import graphs and exits non-zero):

```
connectors/* → contracts            (may NOT import kernel, ui, globe, semantic)
kernel       → contracts            (may NOT import store, ui, anything with I/O)
semantic     → contracts, ontology, registry, store, kernel
ui, globe    → contracts, semantic  (may NOT import connectors/*, store)
apps/web     → ui, globe, semantic
```

---

## 3. Semantic / ontology layer

Everything normalises to four entity kinds and one fact table shape.

**Entities** — stable IDs, never a source's own ID:
- `Place` — `place:<ISO3166-1 alpha-3>` for countries, `place:<alpha3>.<ISO3166-2 subdivision>` for admin-1, `place:m49.<code>` for UN regions, `place:custom.<uuid>` for user-drawn. Carries `m49`, `iso2`, `iso3`, `wbCode`, `unhcrCode`, `eurostatNuts`, `validFrom`, `validTo` (Sudan/South Sudan 2011, Serbia/Montenegro 2006, and East Timor must all resolve correctly — put these in `testkit` as golden cases).
- `Corridor` — `corridor:<originPlaceId>→<destPlaceId>`.
- `Cohort` — `cohort:<sex>.<ageBand>.<skillLevel>` using ISCED-A levels and 5-year bands.
- `Sector` — `sector:isic4.<code>` with an ISCO-08 occupation crosswalk.

**The one fact shape** (Arrow schema, also the Parquet layout):

```
observation(
  entity_id     DICTIONARY(UTF8),
  indicator_id  DICTIONARY(UTF8),
  period_start  DATE32, period_end DATE32,
  cohort_id     DICTIONARY(UTF8) NULL,
  value         DOUBLE,
  unit          DICTIONARY(UTF8),        -- UCUM-ish: "persons", "persons/year", "ratio", "USD_2021_PPP"
  ci_low DOUBLE NULL, ci_high DOUBLE NULL,
  quality       UINT8,                   -- 0 reported, 1 estimated, 2 modelled, 3 imputed, 4 projected
  source_id     DICTIONARY(UTF8),        -- FK → provenance table
  vintage       DATE32                   -- publication date of THIS figure
)
```

Every renderer, every model, every export reads this. Adding a source adds rows; it never adds a column, never adds a code path.

**Temporal alignment** is explicit, never implicit: `align(series, targetGrid, method)` where `method ∈ {"hold_last","linear","pchip","none"}`. Default `"none"` — a missing year renders as a visible gap, not a silently interpolated lie. This is a trust requirement, not a nicety.

---

## 4. Plugin contracts (`packages/contracts`)

All six kinds share a manifest envelope. `apiVersion` gates loading; the loader refuses a plugin whose major differs from core's.

```ts
export interface PluginManifest {
  id: string;                    // reverse-DNS: "org.unhcr.refugee-population"
  apiVersion: `${number}.${number}`;  // e.g. "1.0" — core rejects mismatched major
  version: string;               // semver of the plugin itself
  title: Record<Locale, string>;
  license: { spdx: string; url: string; attribution: string; redistributable: boolean };
  capabilities: Capability[];    // declared, negotiated at load — see below
}
type Capability =
  | "offline"            // works from snapshot with no network
  | "live"               // can poll a remote endpoint
  | "subnational"        // emits admin-1 or finer
  | "cohort"             // emits age/sex/skill breakdown
  | "corridor"           // emits origin→destination pairs
  | "projection";        // emits future-dated periods
```

```ts
export interface DataSource<Raw = unknown> {
  manifest: PluginManifest;
  schema: z.ZodType<Raw>;                       // validates raw fetch payload
  cadence: { kind: "annual"|"quarterly"|"monthly"|"weekly"|"daily"|"irregular";
             expectedLagDays: number; nextExpected?: string };
  coverage: { places: "global" | string[]; from: string; to: string; granularity: "country"|"admin1"|"admin2"|"point" };
  /** Discover what units of work exist. Pure metadata; no bulk download. */
  plan(ctx: IngestCtx): Promise<FetchUnit[]>;
  /** Fetch one unit. MUST respect ctx.signal and ctx.rateLimit. */
  fetch(unit: FetchUnit, ctx: IngestCtx): Promise<Raw>;
  /** Pure. Raw → canonical rows. Unit-testable with a fixture, no network. */
  transform(raw: Raw, unit: FetchUnit): Observation[];
  /** Optional live channel. Absent ⇒ snapshot-only source. */
  subscribe?(ctx: IngestCtx, emit: (o: Observation[]) => void): Unsubscribe;
}
```

```ts
export interface Indicator {
  manifest: PluginManifest;
  id: string;                        // "labour_absorption_gap"
  unit: string;
  direction: "higher_is_better" | "lower_is_better" | "neutral";
  domain: "demography"|"labour"|"economy"|"protection"|"integration"|"climate"|"governance";
  /** Either raw passthrough… */
  sourceIndicator?: string;
  /** …or derived. Pure, and MUST return null when any input is missing. */
  compute?(inputs: Record<string, number | null>, ctx: IndicatorCtx): number | null;
  dependsOn: string[];               // other indicator ids — registry topo-sorts + detects cycles
  normalise?: { method: "zscore"|"minmax"|"quantile"|"log_minmax"; clampPercentile?: [number, number] };
}
```

Reference derived indicator, to fix the shape (variables defined in the registry entry, all UI-visible):

```
labour_absorption_gap(p, t) =
    ( L_demand(p,t) − L_supply(p,t) ) / L_supply(p,t)

  L_supply(p,t) = POP(p,t,15–64) × LFPR(p,t)                      [persons]
  L_demand(p,t) = L_supply(p,t) × (1 − u*(p)) × (1 + g_v(p,t))     [persons]
  u*(p)   = 10-year trailing median unemployment rate              [ratio]
  g_v(p,t)= vacancy-rate growth, 3-year CAGR                       [ratio]
  absorbable_headcount(p,t) = max(0, L_demand − L_supply) × housing_slack(p,t) × service_slack(p,t)
```

```ts
export interface Model {                       // simulation kernel plugin
  manifest: PluginManifest;
  inputs: z.ZodType<unknown>;                  // scenario params
  outputs: z.ZodType<unknown>;
  /** MUST be pure and deterministic given (inputs, seed). No Date.now(), no Math.random(). */
  run(inputs: unknown, world: WorldSlice, seed: number): ModelResult;
  /** Optional: declare which indicators it perturbs, so the UI can show a diff. */
  affects: string[];
}

export interface MapLayer {
  manifest: PluginManifest;
  kind: "choropleth"|"arc"|"heatmap"|"hexbin"|"trips"|"scatter"|"custom";
  requires: { indicators: string[]; granularity: "country"|"admin1" };
  /** Returns deck.gl layer props from a semantic query result. No data fetching here. */
  build(data: ArrowTable, view: ViewState, theme: Theme): LayerProps[];
  legend(data: ArrowTable): LegendSpec;
}

export interface Panel {
  manifest: PluginManifest;
  slot: "left"|"right"|"bottom"|"modal"|"inspector";
  requires: { indicators: string[]; capabilities: Capability[] };
  Component: React.ComponentType<PanelProps>;  // receives semantic client, never raw store
  defaultSize: { w: number; h: number };
}

export interface Scenario {                    // serialisable, diffable, shareable
  manifest: PluginManifest;
  schema: z.ZodType<ScenarioParams>;
  defaults: ScenarioParams;
  models: string[];                            // Model ids to run, in order
  narrative(params: ScenarioParams, result: ModelResult, locale: Locale): string;
}
```

**Third-party source, zero core changes:**
```
pnpm gen:connector --id org.example.my-source
# writes connectors/my-source/{plugin.ts,fixtures/,plugin.test.ts,LICENSE,README.md}
# registers via connectors/*/package.json "exodus" field — the loader globs it.
pnpm ingest --only org.example.my-source
pnpm snapshot:build
```
Core is never edited. A published npm package with `"exodus": { "kind": "datasource" }` in its manifest is discovered by the same glob when installed.

---

## 5. The zero-account snapshot (the load-bearing constraint)

**Budget, derived from verified GitHub limits** (50 MiB push warning, **100 MiB hard block per file**, 2 GiB per release asset, 1000 assets per release, repo <1 GiB ideal / <5 GiB strong recommendation):

| Artifact | Path | Budget | Transport |
|---|---|---|---|
| Core world snapshot (country-level, all indicators, 1990–2026) | `packages/snapshot/data/world.parquet` | **≤ 45 MiB** | committed to git, plain (no LFS) |
| Country geometry (Natural Earth 1:50m, TopoJSON→PMTiles) | `packages/snapshot/data/admin0.pmtiles` | ≤ 12 MiB | committed to git |
| Basemap tiles (optional, dark, no labels) | release asset | ≤ 400 MiB | `pnpm data:fetch` from GitHub Release |
| Admin-1 pack (~4k units) | release asset `admin1-<vintage>.parquet` | ≤ 600 MiB | opt-in download |
| Cohort/corridor cube | release asset | ≤ 1.5 GiB | opt-in download |

**Do not use Git LFS.** Rationale: LFS free-tier quotas are account-scoped and a fork by an institution inherits a bandwidth wall — which breaks "clone and it works". *(UNVERIFIED: exact current GitHub free LFS quota; commonly cited as 1 GiB storage + 1 GiB/month bandwidth. Do not depend on it either way.)* Use **plain committed files under 50 MiB** for the core tier and **GitHub Release assets fetched by an idempotent `pnpm data:fetch`** for everything larger. Release assets have no bandwidth limit and no per-account quota.

**Snapshot builder** (`packages/snapshot`):
```
pnpm ingest            # runs every connector's plan→fetch→transform into .cache/raw/<sourceId>/<unitHash>.json
pnpm snapshot:build    # DuckDB (node) reads .cache → writes world.parquet + manifest.json
pnpm snapshot:verify   # re-hashes, checks manifest.sha256, checks coverage thresholds
```
`manifest.json` records, per source: `sourceId`, `vintage`, `rowCount`, `sha256`, `license.spdx`, `attribution`, `fetchedAt`, `connectorVersion`. The app **refuses to boot** if `sha256(world.parquet) !== manifest.sha256` — a tampered dataset is a security event for an institutional tool, not a warning.

**Incremental rebuild:** cache key = `sha256(connectorVersion + unitId + upstreamETag/Last-Modified)`. Turborepo caches the `ingest` task per connector package, so touching one connector re-ingests one source. `pnpm snapshot:build --since <manifest.json>` rewrites only changed Parquet row groups (partitioned by `source_id`, then `period_start` year).

**Degradation ladder** (must be implemented as an explicit enum, surfaced in the UI status bar):
`LIVE` (gateway reachable, source responding) → `CACHED` (last live response, age shown) → `SNAPSHOT` (committed Parquet, vintage shown) → `UNAVAILABLE` (indicator greyed, tooltip explains which source is missing). Never blank, never zero-as-missing.

**"Live" transport:** SSE from `apps/gateway` (`GET /live/stream?sources=a,b`), not WebSockets — SSE survives corporate proxies, auto-reconnects, and needs no sticky sessions. The gateway is stateless and optional; with it absent the client reads snapshot only.

**Job scheduling:** GitHub Actions cron per cadence class (`0 4 * * *` daily, `0 5 * * 1` weekly, `0 6 1 * *` monthly). Each run opens a PR titled `data: refresh <sourceId> → vintage <date>` with the manifest diff in the body. **Data updates go through review, exactly like code.** No cron writes to `main`.

---

## 6. Provenance → tooltip, end to end

`source_id` on every observation row FKs to `provenance` (`source_id, publisher, title, url, doi?, spdx, attributionText, vintage, accessedAt, methodNote, quality`). The semantic layer's query result carries a `.provenance: Provenance[]` alongside `.data`, derived by `SELECT DISTINCT source_id` over the same query — so the UI cannot render a value whose sources it doesn't have. `<ProvenanceChip />` in `packages/ui` is the *only* way to render a number; a Biome lint rule forbids raw numeric interpolation inside `packages/ui/panels/**`. Derived indicators propagate the union of their inputs' `source_id`s, and `quality` propagates as `max()` of inputs — a modelled input makes the output modelled. Every panel exports `Copy citation` producing BibTeX + a permalink URL containing the full scenario.

---

## 7. i18n / RTL

ICU MessageFormat JSON under `packages/ui/locales/<bcp47>.json`, loaded lazily per route. Ship `en`, `es`, `fr`, `ar`, `zh-Hans` at MVP. Set `dir` from a locale table on `<html>`; use CSS logical properties exclusively (`margin-inline-start`, never `margin-left`) — enforce with a Biome rule. **deck.gl/WebGL is direction-agnostic but the UI chrome must mirror**: panels flip, the timeline scrubber does *not* (time always flows left→right, per cartographic convention). Numbers via `Intl.NumberFormat(locale, { notation: "compact" })`; never hand-format. Place names come from the ontology's `name` map keyed by locale, falling back to `en` with a visible `(en)` marker rather than a silent fallback.

---

## 8. Licensing

**Code: AGPL-3.0-or-later.**

| Option | Consequence here | Verdict |
|---|---|---|
| MIT / Apache-2.0 | A vendor forks, closes it, sells it to ministries as SaaS with no obligation to return fixes. Apache-2.0 adds an explicit patent grant (better than MIT) but no copyleft. | Rejected for core |
| **AGPL-3.0-or-later** | Network use triggers source disclosure — a hosted fork must publish. This is precisely the "open-source Palantir" positioning. Governments can still self-host and modify internally without publishing (§13 obligation triggers on *public* network interaction). | **Core, apps/** |
| Apache-2.0 | For `packages/contracts` and `connectors/_template` **only**, so third parties can write connectors and embed the contract types without AGPL reach. Patent grant matters for an institutionally-adopted interface. | **contracts, testkit, template** |

Dual-licensing is preserved by requiring a **DCO sign-off** (`git commit -s`), not a CLA. CLAs deter institutional and academic contributors; DCO is what the Linux kernel uses and is legally sufficient for provenance.

**Data is licensed separately from code and must never be assumed to inherit it.**

| Dataset class | License | Redistribution in snapshot? | Obligation |
|---|---|---|---|
| Natural Earth | **Public domain** ("All versions of Natural Earth raster + vector map data found on this website are in the public domain.") | ✅ Commit freely | none (credit appreciated) |
| geoBoundaries | **CC BY 4.0** | ✅ | Attribution string per release, in `NOTICE-DATA.md` and in-app |
| OpenStreetMap-derived (incl. many basemaps) | **ODbL 1.0** | ✅ but: a *Derivative Database* you publicly use must itself be ODbL (§4.4a) and you must provide the derivative or an alterations file (§4.6). A *Produced Work* (a rendered map image, a PDF report) needs only the notice (§4.3a): "Contains information from DATABASE NAME, which is made available here under the Open Database License (ODbL)." | Keep ODbL data in a **separate Parquet file** so the ODbL share-alike never contaminates the CC-BY/PD cube |
| **GADM** | Academic/non-commercial; **"Redistribution or commercial use is not allowed without prior permission."** | ❌ **Never commit, never fetch in `data:fetch`.** | Use geoBoundaries or Natural Earth instead. Add GADM to a CI denylist. |
| CC-BY-4.0 sources (most UN/World Bank/ILO) | CC BY 4.0 | ✅ | Attribution + indicate changes (our `transform` counts as a change — record it) |

Enforce with **REUSE spec 3.3** and a single `REUSE.toml` at repo root (DEP5 is deprecated and mutually exclusive with REUSE.toml). Run `reuse lint` in CI. Every connector manifest's `license.redistributable: false` causes the snapshot builder to **exclude** its rows and mark the indicator `LIVE`-only — license compliance is mechanical, not a README promise.

---

## 9. CI

| Job | Command | Gate |
|---|---|---|
| lint | `biome ci .` | zero warnings |
| layers | `tsx scripts/check-layers.ts` | import-graph rule in §2 |
| types | `tsc -b --noEmit` | zero errors |
| unit | `vitest run --coverage` | `packages/kernel` ≥ 95% lines; property tests via fast-check on every `Model.run` for determinism `run(x,s) === run(x,s)` |
| contracts | `vitest run --project contracts` | every connector's `transform` passes its committed fixture → golden Observations |
| snapshot | `pnpm snapshot:verify` | manifest hash matches; global coverage ≥ 95% of UN M49 members for tier-1 indicators |
| reuse | `reuse lint` | every file has SPDX |
| e2e | `playwright test` | Core Web Vitals budget: LCP < 2.5 s, first globe paint < 3 s on a 4× CPU throttle |
| visual | `playwright test --grep @visual` | `maxDiffPixelRatio: 0.01`, swiftshader |
| size | `size-limit` | `apps/web` initial JS ≤ 350 KiB gzip (deck.gl + DuckDB-Wasm lazy-loaded on interaction) |

---

## 10. Governance (`GOVERNANCE.md`, `CONTRIBUTING.md`)

- **Model:** BDFL-free from day one. Three roles — *Contributor* (DCO sign-off), *Maintainer* (merge rights, per-area in `CODEOWNERS`), *Steering Committee* (5 seats, ≤2 from any one employer, 2-year staggered terms). Publish the employer affiliation of every maintainer. An institution will not trust a migration-policy tool whose governance is opaque.
- **Two-maintainer rule for `packages/kernel` and any Indicator formula change.** A formula change requires: a written methodological note, a citation to peer-reviewed or official methodology, and a golden-test diff showing which countries move and by how much.
- **`METHODOLOGY.md` is normative.** Each indicator has a section: definition, formula with variable table, data requirements, known biases, and an explicit "what this indicator must not be used for" statement. Ship an `ETHICS.md` stating the project publishes no individual-level or identifiable data, refuses connectors emitting person-level records, and that outputs are decision *support*, not enforcement targeting.
- **Security:** `SECURITY.md` with a 90-day disclosure window; `OpenSSF Scorecard` and `OpenSSF Best Practices` badges in CI; all GitHub Actions pinned to commit SHAs; `pnpm audit --prod` gate.
- **Reproducibility:** every release tags a dataset vintage and attaches `manifest.json`; `CITATION.cff` at root so the project itself is citable.
