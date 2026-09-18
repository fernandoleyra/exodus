## 0. Verdict (build this, not that)

**Primary renderer: deck.gl v9.4.0 (MIT) on luma.gl 9.4.1, WebGL2 default, WebGPU behind a flag.** Two view hosts sharing one layer registry:

| Mode | Host | Use | Why |
|---|---|---|---|
| **GLOBE** (default) | `@deck.gl/core` **standalone `GlobeView`**, no basemap library | World overview, flows, hotspots, time animation | Full camera control, orthographic-correct great circles, no second projection engine, no basemap tile budget. v9.4 added `GlobeController` bearing+pitch (shift/right-drag, multi-touch) and elastic bounds. |
| **FLAT** (drill-down, zoom > 6) | **MapLibre GL JS 6.10.0** (BSD-3-Clause) + **`@deck.gl/maplibre@9.4.0`** `MapboxOverlay` in `interleaved: true` | Country/admin-1/city analysis, labels, streets | `GlobeView` has **no high-precision rendering above zoom 12** and only *experimental* `TileLayer`/`MVTLayer` support. Flat mode gets real vector tiles, real labels, real terrain. |

`@deck.gl/maplibre` is new in v9.4 and **replaces `@deck.gl/mapbox`**; peer range `maplibre-gl: ^4.5.1 || ^5.0.0 || ^6.0.0`. Note MapLibre v6 ships **ESM-only** (`maplibre-gl.mjs`) — Vite/Rollup fine, plain CJS not.

**Rejected, with reasons:**

| Candidate | Version checked | Verdict |
|---|---|---|
| **Mapbox GL JS** | 3.31.0 (2026-09-17) | **REJECT on license.** `license: SEE LICENSE IN LICENSE.txt` — proprietary since v2.0, requires an active Mapbox account, and explicitly forbids "modifications that change or interfere with marked portions of the code related to billing, accounting, or data collection." Incompatible with an open-source Palantir-alternative positioning. Only v1.13.3 and earlier are BSD-3-Clause. |
| **Cesium / Resium** | cesium 1.145.0 (Apache-2.0), resium 1.26.0 (MIT) | Reject as primary. License is fine; the cost is bundle weight (multi-MB), an opinionated scene graph, an Entity/Primitive API that fights data-driven binary attributes, and terrain/imagery that realistically pulls in Cesium ion. Keep as an *optional* 3D-terrain plugin module, not the core. |
| **three.js / @react-three/fiber** | three 0.186.0, R3F 9.7.0 | Reject as primary. You would reimplement projection, tiling, GPU picking, aggregation, and 64-bit-emulated coordinate precision — all of which deck.gl already ships. Use three.js **only** inside a deck.gl `SimpleMeshLayer`/custom layer if a bespoke mesh is needed. |
| **globe.gl 2.46.2 / three-globe 2.45.2 / cobe 2.0.1** | MIT | Reject. `cobe` is a ~5KB dot-globe with no picking, no data-driven attributes, no layers. `globe.gl` is a three-globe wrapper: fine for 5k arcs, collapses at 200k arcs + 4M points, and has no binary attribute path. |
| **deck.gl WebGPU as default** | 9.4.0 | Reject as default, ship as opt-in. v9.4 ported the **entire official layer catalog to WebGPU with render parity**, but it is still labelled experimental. Browser reality (caniuse, ~87% global, Firefox not enabled by default, Safari only 26.0+ and partial on desktop — **treat this % as UNVERIFIED, re-check at build time**) means WebGL2 is the contract. |

**Bundler flag:** if you ship WebGL2-only builds, set the custom export condition `visgl:webgl-only` in Vite `resolve.conditions` to strip the WGSL/WebGPU code paths out of the bundle.

---

## 1. Exact dependency list (all versions verified on npm registry, 2026-09-18)

```jsonc
// package.json — pin exactly, no carets on deck.gl/luma (they must be lockstep)
{
  "dependencies": {
    "deck.gl":                       "9.4.0",   // MIT, 2026-09-05 (meta-package)
    "@deck.gl/core":                 "9.4.0",
    "@deck.gl/layers":               "9.4.0",
    "@deck.gl/geo-layers":           "9.4.0",
    "@deck.gl/aggregation-layers":   "9.4.0",
    "@deck.gl/extensions":           "9.4.0",
    "@deck.gl/widgets":              "9.4.0",
    "@deck.gl/react":                "9.4.0",
    "@deck.gl/maplibre":             "9.4.0",   // NOT @deck.gl/mapbox
    "@luma.gl/core":                 "9.4.1",   // MIT, 2026-09-11
    "@luma.gl/engine":               "9.4.1",
    "@luma.gl/shadertools":          "9.4.1",   // bloom/blur/vignette post-FX
    "maplibre-gl":                   "6.10.0",  // BSD-3-Clause, 2026-09-15, ESM-only
    "@vis.gl/react-maplibre":        "8.1.3",   // MIT, 2026-09-02 (React binding; react-map-gl 8.1.3 is the Mapbox-flavoured twin)
    "pmtiles":                       "4.5.0",   // BSD-3-Clause, 2026-08-10
    "@protomaps/basemaps":           "5.7.2",   // BSD-3-Clause — style JSON for PMTiles basemap
    "apache-arrow":                  "21.2.0",  // Apache-2.0, 2026-07-21
    "@geoarrow/deck.gl-geoarrow":    "0.4.2",   // MIT, 2026-09-02 (peer @deck.gl/* ^9.0.0)
    "@geoarrow/geoarrow-js":         "0.3.3",
    "@loaders.gl/core":              "4.5.1",   // MIT, 2026-09-09
    "@loaders.gl/arrow":             "4.5.1",
    "@loaders.gl/parquet":           "4.5.1",
    "h3-js":                         "4.5.0",   // Apache-2.0, 2026-07-01
    "flatgeobuf":                    "4.4.0",   // BSD-3-Clause
    "comlink":                       "4.4.2",   // Apache-2.0 — worker RPC
    "zustand":                       "5.0.15"   // MIT — view/filter store
  },
  "optionalDependencies": {
    "@duckdb/duckdb-wasm":           "1.33.1-dev57.0",  // MIT — WARNING: this project publishes DEV builds to `latest`. Pin the exact string; do NOT use ^.
    "parquet-wasm":                  "0.8.0"            // MIT OR Apache-2.0, 2026-09-17 — alternative to duckdb for pure Parquet→Arrow decode
  }
}
```

**Do NOT install** `@geoarrow/deck.gl-layers` (latest 0.3.2, stale). The maintained package is **`@geoarrow/deck.gl-geoarrow@0.4.2`**.

**Known version conflict to resolve at build time (UNVERIFIED):** deck.gl's published `GlobeView` doc page still lists `TerrainLayer`, `HeatmapLayer`, `ContourLayer` and `MaskExtension` as unsupported on globe, while the v9.4 release notes state "TerrainLayer now renders correctly on GlobeView" and "TerrainExtension supports GlobeView." The docs page is likely stale. **The agent must smoke-test `TerrainLayer` under `GlobeView` before depending on it.** Treat `HeatmapLayer`/`ContourLayer` as genuinely unavailable on globe — use `H3HexagonLayer` or a custom screen-space density pass instead.

---

## 2. Layer-by-layer rendering spec — frame budget 16.67 ms @ 60 fps

Allocation: **11.0 ms GPU / 4.0 ms JS main thread / 1.6 ms slack.** Measure with `@deck.gl/widgets` `StatsWidget` (merged FpsWidget in v9.3).

| # | Layer | Class | Data volume | Transport | GPU budget | Notes |
|---|---|---|---|---|---|---|
| 00 | Ocean sphere | `SimpleMeshLayer` (icosphere) or `SolidPolygonLayer` world quad | 1 | inline | 0.2 ms | Required: `GlobeView` lets you see through the far side. Either render this or enable back-face culling. |
| 01 | Basemap raster | `BitmapLayer` | 1 texture, 8192×4096 equirect, WebP q80 ≈ **1.6 MB**; progressive 2048×1024 (≈180 KB) first | HTTP | 0.3 ms | Avoids experimental MVT-on-globe entirely. Swap the low-res in on first paint, high-res at idle. |
| 02 | Night lights / terminator | same `BitmapLayer`, 2nd texture + custom fs | 1 texture 4096×2048 | HTTP | 0.2 ms | Blend factor = `smoothstep(-0.1, 0.1, dot(N, sunDir))`. Signature effect A. |
| 03 | Country choropleth | `GeoJsonLayer` → binary via `data.attributes` | 258 countries, Natural Earth 1:50m | **Arrow IPC**, ~400 KB | 0.6 ms | `extruded: false` on globe; `getFillColor` from a Uint8ClampedArray you swap via `updateTriggers`. |
| 04 | Admin-1 choropleth | `SolidPolygonLayer` (binary) | ~3,600 features | Arrow IPC, ~2.2 MB, **lazy** | 1.0 ms | Load only when `zoom > 3` or a country is selected. |
| 05 | Population grid | `ScatterplotLayer` with `data.attributes` | 1M default / 4M max points | **Float32Array positions + Uint8Array colors**, transferable from worker | 4.0 ms | `radiusUnits:'pixels'`, `radiusMinPixels:1`, `radiusMaxPixels:4`, `pickable:false`, `antialiasing:false`. Overdraw is the killer: 4M × 3px radius ≈ 113M fragments/frame. |
| 06 | H3 capacity/pressure cells | `H3HexagonLayer` | res 3–5 global (~41k–288k cells); res 6–7 on drill-down | Arrow IPC, `h3` as Uint64 pair or string dict | 3.0 ms | Set `highPrecision: false` explicitly when cells are far from poles/antimeridian — `'auto'` will silently fall back to the slow path. `extruded: true` + `material` for signature effect D. |
| 07 | Migration flows | `ArcLayer` with **`greatCircle: true`** | 10k default, 200k ceiling | Arrow IPC: 2× Float32Array(N,2) + 2× Uint8Array(N,4) + Float32Array(N) width | 2.0 ms @ 10k, 6.5 ms @ 200k | `numSegments: 50` default → 200k arcs = 10M vertices. **Drop to `numSegments: 18` above 50k arcs.** `parameters: {cullMode: 'none'}` is mandatory on globe or arcs vanish from the far side. `getHeight` scaled by corridor volume; `getTilt` to fan out same-OD-pair arcs. |
| 08 | Flow pulse (animated) | **`ArcLayer` subclass**, one uniform | same buffers as 07 | 0 extra | +0.0 ms | Signature effect B — see §4. Do **not** use `TripsLayer` for this. |
| 09 | Trajectory playback | `TripsLayer` (`@deck.gl/geo-layers`) | ≤20k paths, ≤200 pts each | binary path + timestamps | 1.5 ms | Props: `currentTime`, `trailLength` (default 120), `fadeTrail` (default true), `getPath`, `getTimestamps`. **Timestamps are float32** — never pass raw unix epoch; store seconds-since-epoch-of-window and validate with `Math.fround(t)`. Needs `parameters:{cullMode:'none'}` on globe. |
| 10 | Hotspots / anomalies | `ScatterplotLayer` + `IconLayer` | ≤2,000 | JSON | 0.4 ms | `pickable: true`. The only pickable layer by default. |
| 11 | Labels | `TextLayer` + `CollisionFilterExtension` | ≤400 visible | JSON | 0.6 ms | v9.4 `TextLayer` supports per-object clipping boxes; use to keep labels inside panels. |
| 12 | Post-processing | `PostProcessEffect` ×3 | — | — | 1.2 ms | bloom → chromatic aberration → vignette. Signature effect C. |

**Picking hard limits (from deck.gl perf docs): 16,777,216 items per layer and 256 pickable layers total.** v9.4 moved picking to shader builtins instead of a color buffer — keep `pickable:false` everywhere except layers 03, 04, 06, 07, 10.

**Scale ceilings (deck.gl official guidance):** ScatterplotLayer holds 60 fps to ~1M items, degrades to 10–20 fps approaching 10M; Chrome's ~1 GB single-allocation cap forces chunking between 10M and 100M. **~100 layers is proven fine; do not design for thousands.**

---

## 3. Data transport & byte budget for first paint < 3 s

**Format decision: Apache Arrow IPC (GeoArrow encoding) over HTTP, `Content-Encoding: zstd` (fallback br), served from object storage + CDN.** Arrow beats protobuf here because `@geoarrow/deck.gl-geoarrow` copies Arrow buffers *straight to the GPU via deck.gl's binary interface — no intermediate representation, no GC pressure*. Protobuf would require a decode-and-reshape pass into typed arrays; that pass is exactly what you are trying to delete.

| Asset | Format | Bytes (wire) | When |
|---|---|---|---|
| App JS (deck.gl core+layers+geo+extensions, React, store) | ESM, brotli | ~420 KB **(UNVERIFIED — measure with `rollup-plugin-visualizer`; budget it, don't assume it)** | critical |
| Basemap raster LOD0 2048×1024 | WebP q80 | ~180 KB | critical |
| Country geometry + 1 indicator | Arrow IPC | ~400 KB | critical |
| Global flow matrix, top 10k arcs | Arrow IPC | ~280 KB (10k × 28 B) | critical |
| H3 res-4 global cells (~288k) + 4 indicators | Arrow IPC | ~9 MB → **ship res-3 (41k, ~1.3 MB) first** | critical (res-3) |
| **Critical path total** | | **≈ 2.3 MB** | **target FCP 1.2 s, first interactive globe < 2.6 s** |
| Basemap raster LOD1 8192×4096 | WebP | ~1.6 MB | idle |
| Admin-1 geometry | Arrow IPC | ~2.2 MB | on demand |
| Population grid 1M pts | Arrow IPC (2×f32 + 1×u8[4]) | ~12 MB | on demand, streamed in 8 chunks |
| H3 res-6 regional tile | Arrow IPC | ~600 KB/tile | on demand |

**Rules:**
- Serve Arrow IPC **streaming** format and consume with `RecordBatchReader` so the first batch renders before the last arrives. One deck.gl layer per record batch (official guidance: chunked layers beat appending to one array).
- **DuckDB-WASM (`1.33.1-dev57.0`) runs in a dedicated Worker** behind Comlink, does the cross-filtering/aggregation/scenario math, and returns Arrow `Table`s. It requires COOP/COEP headers for the multi-threaded bundle — if you cannot set `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`, use the single-threaded bundle or fall back to `parquet-wasm@0.8.0` for decode-only.
- **PMTiles 4.5.0** only for FLAT mode: a single-file HTTP-range-request archive, `pmtiles://` protocol registered on the MapLibre `Map`. Protomaps planet v4 is ~120 GB z0–z15, daily builds at `https://maps.protomaps.com/builds`, ODbL, **OSM attribution required**, and Protomaps explicitly asks you not to hotlink — copy the archive to your own bucket. Serve a small extract per deployment.
- **flatgeobuf 4.4.0** only as an ingest-side format for streaming spatial-indexed reads; do not put it on the browser critical path when Arrow already exists.
- Move all decode to workers, `postMessage` typed arrays as **transferables** (`[buf.buffer]`) — zero-copy handoff, then pass straight into `data: {length, attributes: {getPosition: {value, size: 2}}}`.

---

## 4. The 3–4 signature effects (this is what makes it read as Palantir-grade)

**A. Solar terminator + Fresnel atmosphere rim.** A `PostProcessEffect` (or the `BitmapLayer` fragment shader for the surface half) that (1) blends a VIIRS night-lights texture in by `dot(surfaceNormal, sunDirection)` with a `smoothstep(-0.12, 0.08, d)` soft edge, and (2) adds a rim: `pow(1.0 - abs(dot(viewDir, normal)), 3.0)` tinted `#3FA9F5` at 0.35 alpha, additively blended, radius +1.8% over the sphere. Sun vector is derived from the scrubber's current timestamp, so scrubbing the timeline visibly rotates day/night. Cost ≈ 0.2 ms.

**B. Flow pulse — energy packets travelling origin→destination.** Subclass `ArcLayer`, inject into `DECKGL_FILTER_COLOR`:

```glsl
// uniforms: uTime (s), uPulseSpeed, uPulseWidth, uPulseCount
float s = geometry.uv.x;                         // 0..1 along the arc
float phase = fract(s * uPulseCount - uTime * uPulseSpeed);
float pulse = exp(-pow(phase / uPulseWidth, 2.0));
color.rgb += pulse * uPulseColor * 1.8;
color.a    = max(color.a, pulse * 0.9);
```
One uniform update per frame, zero buffer re-upload, works identically at 10k and 200k arcs. Colour by corridor class (labour / family / study / forced-displacement); pulse **density** encodes annual volume, arc **height** (`getHeight`) encodes distance, arc **width** encodes net flow. This single effect carries most of the product's perceived intelligence.

**C. Bloom + chromatic aberration + scanline ingest sweep.** `PostProcessEffect` chain from `@luma.gl/shadertools@9.4.1`: threshold bloom (threshold 0.72, intensity 0.55, 2 mip levels) → chromatic aberration (0.0015 at screen edge, 0 at centre) → vignette (0.35). On every live data tick, run a 900 ms horizontal scanline of `+0.18` luminance across the framebuffer — the UI *shows* you when it ingests. Keep the whole chain at ≤1.2 ms; drop bloom first on the low tier.

**D. Extruded H3 capacity terrain.** `H3HexagonLayer` with `extruded: true`, `elevationScale` mapped to *absorption-capacity headroom* (not raw population), `material: {ambient: 0.35, diffuse: 0.6, shininess: 32, specularColor: [40,60,90]}`, and a single low-angle directional light at ~18° elevation. Deficit cells render **below** the datum (negative elevation) in amber, surplus **above** in cyan. The relief reads instantly as "where can people go" — this is the money shot for the calculator thesis.

---

## 5. Performance engineering rules the agent must implement

1. **Never hand deck.gl objects.** Every high-cardinality layer uses `data: {length: N, attributes: {...}}` with typed arrays. Accessor callbacks consume ~99% of CPU time during buffer updates — the binary path deletes that entirely.
2. **`updateTriggers` discipline.** Changing the choropleth indicator must only invalidate `getFillColor`, never `getPosition`. Recomputing all buffers is the single most expensive operation in deck.gl and scales linearly with item count.
3. **Never mutate `data` in place.** Use `dataComparator` or immutable swaps; a new array identity with identical contents triggers a full re-upload.
4. **Worker pool:** `nWorkers = min(4, navigator.hardwareConcurrency - 1)`. Jobs: Arrow decode, H3 indexing (`h3-js@4.5.0`), scenario solver, DuckDB. Return transferables only.
5. **Tiered degradation** — auto-select on first frame from `navigator.gpu` presence, `hardwareConcurrency`, `deviceMemory`, and a 30-frame warm-up FPS probe:

| Tier | Trigger | Points | Arcs (`numSegments`) | H3 res | Post-FX | `useDevicePixels` |
|---|---|---|---|---|---|---|
| **HIGH** | dGPU, ≥8 cores, ≥8 GB | 4,000,000 | 200,000 (50) | 6 | bloom+CA+vignette | `true` |
| **MED** | integrated GPU, ≥4 cores | 800,000 | 40,000 (24) | 5 | vignette only | `1` (cap at 1×) |
| **LOW** | mobile / probe < 40 fps | 150,000 | 8,000 (12) | 4 | none | `false` |
| **FALLBACK** | no WebGL2 | — | — | — | — | Static SVG/Canvas choropleth + tables, no globe |

   `useDevicePixels: false` alone removes a 4× fragment cost on Retina — it is the highest-leverage single switch.
6. **Memory ceiling:** keep total GPU buffers under **512 MB** on HIGH, 192 MB on MED. Chunk any dataset above 10M rows; Chrome caps a single allocation near 1 GB.
7. **Layer lifecycle:** toggle `visible` rather than adding/removing layers — removal destroys GPU buffers you will immediately re-upload.
8. **WebGPU opt-in:** `?renderer=webgpu` sets `deck({device: 'webgpu'})`. Log a telemetry comparison; do not make it default until parity is proven on the target fleet.
9. **Frame pacing for time animation:** drive `currentTime` / `uTime` from a single `requestAnimationFrame` loop writing to a zustand store, and never from React state at 60 Hz — React reconciliation at 60 Hz will eat the entire 4 ms JS budget.
10. **Modularity contract (the "cross-agnostic" requirement):** every layer is produced by a pure factory `(spec: LayerSpec, data: Arrow.Table, tier: Tier) => Layer[]`. `LayerSpec` is JSON-serialisable. The view host (`GlobeView` vs `MapboxOverlay`) is injected. Result: the same spec renders on globe, on flat map, and — if you ever need it — server-side in a headless context, and a new dataset ships as a new spec file with no renderer changes.