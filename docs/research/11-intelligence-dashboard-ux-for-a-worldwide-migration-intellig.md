## 1. What actually makes Palantir feel like "intelligence software"

Not the dark theme. Seven mechanisms. Each maps to a build directive — implement all seven or the product reads as a dashboard, not an intelligence system.

| # | Mechanism | What it is | Build directive for the MVP |
|---|---|---|---|
| 1 | **Ontology** | Palantir Foundry's own terminology: *object types*, *link types*, *properties*, *action types*, *functions*, *interfaces* (verified at palantir.com/docs/foundry/ontology/overview). The UI is generated from a typed graph, not hand-built per page. | Define a JSON-Schema ontology file (`ontology/*.json`) with object types `Country`, `AdminRegion`, `Corridor`, `Cohort`, `Sector`, `Policy`, `Event`, `Dataset`, `Scenario`; link types `flows_to`, `borders`, `belongs_to`, `sourced_from`, `affects`. Every screen renders from this, so a new object type produces a working entity page with zero new UI code. |
| 2 | **Entity-centric navigation** | Everything is an object with a permalink; every mention of an object anywhere is a link to its page. | Global URL scheme `/o/{typeId}/{objectId}` and `/o/{typeId}/{objectId}/{tab}`. Country name in a tooltip, a legend, a table cell, a brief, or a graph node is the *same* `<ObjectRef>` component. |
| 3 | **Investigation workspace** | A graph canvas where you expand neighbours, pin, filter by link type, and keep a working set that persists across screens. | A "Working set" tray (bottom-left, collapsible) holding selected objects, surviving navigation and reload. Graph expansion is explicit (`E` on a node) — never auto-expand. |
| 4 | **Time as a first-class axis** | Time slider + temporal brushing: every layer, chart, and number is bound to one global time cursor and window. | Single `timeStore` = `{cursor: ISO date, window: [t0,t1], playing: bool, speed: 1|4|12}`. No component may hold its own date state. Data with a different vintage than the cursor renders with a "stale by N months" badge. |
| 5 | **Layer stack** | Kepler/GIS-style ordered, toggleable, re-orderable layers with per-layer opacity, filter, and colour binding. | Layer registry as data: `{id, kind: 'choropleth'|'arc'|'hex'|'point'|'heat', source, valueField, scale, colorRole, opacity, visible, order}`. Users can add a layer from any dataset in the catalogue. |
| 6 | **Search-first command palette** | Typing is faster than clicking. Objects, actions, layers, saved views, and datasets in one ranked list. | `Cmd/Ctrl+K`. Three result groups: Objects, Actions, Views. Supports scoped prefixes: `>` actions, `#` datasets, `@` countries, `~` corridors. |
| 7 | **Provenance on every number** | The credibility mechanism. A figure with no lineage is a liability in a migration product. | **Hard rule: no numeric renders without a source binding.** All figures go through one `<Figure>` component: `value, unit, sourceId, vintage, method, ci, modelled:boolean`. Hover → popover with dataset id, vintage, retrieval timestamp, licence string, transform-lineage hash. Missing source renders `—` with a "no source" badge, **never `0`**. |

**Visual language (the part people copy badly):** dark, dense but calm; colour is scarce and always means data, never decoration; numerics in a monospace with tabular figures; 1px hairlines instead of boxes and shadows; motion only to show state change (never entrances). Chrome takes ≤ 20% of pixels — the map/graph is the interface.

## 2. Reference points, with verified licences

| Project | Verified version / licence (checked 2026-09-18) | Steal | Avoid |
|---|---|---|---|
| **Blueprint.js** (`@blueprintjs/core`) | **6.20.0**, **Apache-2.0**, peer React 18‖19; actively maintained (22.1k stars) | Its *density conventions*: 30px control height, 16px icon grid, hotkeys dialog, non-ideal-state, multi-select, `Tag` overflow. Palantir's own. | Adopting it wholesale — it is jQuery-era CSS-in-Sass, ships its own icon font, and fights Tailwind. **Decision: do not depend on it; port its dimensional conventions into our tokens.** |
| **deck.gl** | **9.4.0**, **MIT** | The rendering core: `GlobeView`, `ArcLayer`, `H3HexagonLayer`, `TripsLayer`, `ScatterplotLayer`, `MVTLayer`, picking, `@deck.gl/widgets`. | Nothing. This is the correct base. |
| **MapLibre GL JS** | **6.10.0**, **BSD-3-Clause** | Basemap + vector tiles with no vendor key. Pair via `@deck.gl/maplibre`. | Mapbox GL JS ≥ v2 (proprietary licence, billed map loads) — disqualifying for an open-source positioning. |
| **kepler.gl** | npm `latest` dist-tag is **3.3.0-alpha.12**, **MIT** — the published `latest` is a *prerelease* | Its interaction grammar: layer panel, filter panel, time-playback widget, brushing, tooltip config. Read the UX, not the code. | Depending on it. A prerelease `latest` plus a `styled-components@^6` peer is a supply-chain and styling conflict. **UNVERIFIED:** whether a stable 3.x line exists on another dist-tag — do not assume one. |
| **Foursquare Studio** | Proprietary (kepler.gl's commercial descendant) | Layer-stack polish, "add data → auto-suggest layer" flow. | Any code. |
| **Apache Superset** | **Apache-2.0** | Dataset/metric semantic layer, saved-query permalinks, dashboard-level filter scoping. | Its chart-builder UX (form-heavy, slow). |
| **Grafana** | **AGPLv3** (relicensed from Apache-2.0 on 2021-04-20) | Time-range picker semantics, variable/templating model, panel-to-panel time sync, annotations on a time axis. | **Copying code — AGPL would infect the product.** Read the interaction, write our own. |
| **Observable Plot** | **0.6.17**, **ISC** | The chart grammar for every non-map chart. Small, declarative, composes with React. | Full Observable Framework (a static-site build system; wrong shape for a live app). |
| **OpenBB** | **AGPLv3** | Terminal-grade information density; keyboard-first navigation; "every panel is addressable". | Same AGPL caution as Grafana. |
| **Datashader / HoloViz** | BSD-3-Clause (**UNVERIFIED** at time of writing) | The *idea*: server-side rasterise >10M points to a PNG/float tile rather than shipping geometry. Our global agent-level flows need this. | Adding a Python render tier to the MVP. Use deck.gl aggregation layers first. |
| **Radix UI Themes / shadcn** | `@radix-ui/themes` **3.3.0**, **MIT**; `cmdk` **1.1.1**, **MIT** | **Use these.** Radix primitives (unstyled, correct a11y) + `cmdk` for the palette + Tailwind **4.3.3** (MIT) for tokens. | Radix *Themes*' default look — too rounded and soft. Use Radix primitives, not the Themes skin. |
| **Bloomberg Terminal** | Proprietary | Monospace tabular numerics, colour reserved for delta sign, four-panel split, command-line-as-navigation. | Its actual palette (amber-on-black, fails modern contrast norms). |
| **Felt / Atlas / Mapbox Studio** | Proprietary | Cursor-driven map editing, inline legend editing, share-link-with-view-state. | — |

**Fonts (all SIL OFL 1.1):** Inter (UI), IBM Plex Mono or JetBrains Mono (numerics/IDs). Self-host; no Google Fonts CDN call (an intelligence tool that phones a third party on load is a positioning failure).

## 3. MVP screen inventory

Eight surfaces. Each answers one question. If a screen cannot state its question in one sentence, cut it.

| # | Screen | Route | Primary question | Key components |
|---|---|---|---|---|
| 1 | **Situation Globe** | `/` | *What is moving, where, right now?* | deck.gl `GlobeView`; layer stack (left, 280px); time slider + play (bottom, 56px); legend + provenance rail (right, 320px); hotspot ticker; `Cmd+K`. Default layers: net-migration choropleth, top-200 corridor arcs, alert points. |
| 2 | **Entity page** | `/o/country/DEU` | *Everything known about this object, and what it is linked to.* | Header (name, ISO3, flag-free), KPI strip of `<Figure>` tiles, tabs: Overview · Demographics · Labour · Capacity · Corridors · Policy · Sources. Right rail: linked objects by link type. |
| 3 | **Corridor Graph** | `/graph` | *How are these places connected, and through what?* | Force/geo-anchored node-link canvas; expand-on-demand; link-type filter chips; path finding (A→B, k-shortest); pin to working set. |
| 4 | **Capacity Calculator** | `/capacity/{iso3}` | *How many people, of which profile, over what horizon, can this place actually absorb — and what is the binding constraint?* | Constraint-stack bar (housing · jobs · schools · health · fiscal · integration capacity), each with its own `<Figure>`; sensitivity sliders; "binding constraint" callout; assumption ledger with per-assumption source. |
| 5 | **Scenario Studio** | `/scenario/{id}` | *If X happens, what changes — and compared to what baseline?* | Scenario as an object (forkable, diffable); parameter panel; run button (`Cmd+Enter`); baseline-vs-scenario diff shown as a diverging map + waterfall; **every output stamped "SCENARIO — MODELLED, NOT POLICY"**. |
| 6 | **Compare** | `/compare?ids=…` | *How do these N places differ on these M metrics?* | Locked-first-column matrix, tabular-nums, per-cell sparkline, normalise toggle (absolute · per-capita · z-score · index-100), sortable, exportable. |
| 7 | **Brief** | `/brief/{id}` | *What do I hand a decision-maker?* | Composed from saved views; each embedded figure keeps its live provenance; print/PDF stylesheet in the **light** theme; version history. |
| 8 | **Sources** | `/sources` | *Where did every number come from, how fresh is it, and may we use it?* | Dataset catalogue table: id, provider, vintage, cadence, last successful fetch, licence string, coverage %, staleness badge. Sortable by staleness. This screen is the trust argument. |

Overlays (not screens): Command palette (`Cmd+K`), Keyboard help (`?`), Working-set tray, Provenance popover.

## 4. Design tokens

Exact values. Contrast ratios computed (WCAG 2.x relative-luminance formula), not estimated.

### Dark theme — "Night Watch" (default)

| Token | Hex | Note / measured ratio |
|---|---|---|
| `--bg-canvas` | `#06080C` | behind the globe |
| `--surface-0` | `#0B0E14` | app chrome |
| `--surface-1` | `#11151D` | panels, cards |
| `--surface-2` | `#171C26` | popovers, menus |
| `--surface-3` | `#1E2531` | hover fill |
| `--border-hairline` | `#1C2230` | decorative separators only |
| `--border-default` | `#2A3242` | 1.50:1 vs surface-0 — **decorative only** |
| `--border-interactive` | `#5C6B85` | **3.58:1 vs surface-0, 3.39:1 vs surface-1** — required boundary for any interactive control (WCAG 1.4.11) |
| `--text-primary` | `#E8ECF2` | 16.29:1 on surface-0 |
| `--text-secondary` | `#A3ADBD` | 8.53:1 |
| `--text-muted` | `#6E7A8C` | 4.44:1 — labels/axis only, never body |
| `--accent` | `#4DA3FF` | 7.36:1 — selection & interactive chrome; **reserved, never a data series** |
| `--focus-ring` | `#7CC4FF` | 9.75:1 on surface-1; 2px ring + 2px offset |
| `--status-good` | `#2BD49B` | 10.11:1 |
| `--status-warning` | `#E3A008` | 8.55:1 |
| `--status-serious` | `#F2763A` | 6.83:1 |
| `--status-critical` | `#FF6B6B` | 6.96:1 |

### Light theme — "Daylight" (print/brief default)

`--surface-0 #FAFAF9` · `--surface-1 #FFFFFF` · `--border-interactive #8A93A0` · `--text-primary #0E1116` (18.11:1) · `--text-secondary #4A5361` (7.44:1) · `--text-muted #6B7686` (4.41:1) · `--accent #1560BD` (5.85:1) · status: good `#0E7A57` (5.10:1), warning `#8A5A00` (5.67:1), serious `#B44214` (5.39:1), critical `#C42B2B` (5.39:1).

### Data palettes — validated, do not substitute by eye

**Categorical, dark** (in this fixed slot order; never cycled): `#3987e5` · `#d95926` · `#199e70` · `#c98500` · `#d55181` · `#008300` · `#9085e9` · `#e66767`.
Validated against surface `#0B0E14`: lightness band PASS, chroma floor PASS, worst adjacent CVD ΔE **8.4** (protan, `#c98500`↔`#199e70`), worst adjacent normal-vision ΔE **19.3**, all eight ≥ 3:1 vs surface. **All checks pass.**

**Map / scatter / choropleth categories are capped at 3 slots** (`#3987e5`, `#d95926`, `#199e70`): all-pairs CVD ΔE 9.4, normal-vision ΔE 20.9 on `#0B0E14` — PASS. Beyond three on a map, fold to "Other" or facet into small multiples.

**Categorical, light** (same hues re-stepped): `#2a78d6` · `#eb6834` · `#1baf7a` · `#eda100` · `#e87ba4` · `#008300` · `#4a3aa7` · `#e34948`. On `#FAFAF9`: adjacent CVD ΔE 9.1, normal-vision 19.6 — PASS, with a contrast WARN on `#1baf7a` (2.70:1), `#eda100` (2.07:1), `#e87ba4` (2.58:1) → **relief required: visible direct labels or the table view.**

**Sequential (magnitude — density, net migration rate, unemployment):** single blue hue, light→dark: `#cde2fb` `#b7d3f6` `#9ec5f4` `#86b6ef` `#6da7ec` `#5598e7` `#3987e5` `#2a78d6` `#256abf` `#1c5cab` `#184f95` `#104281` `#0d366b`. On dark, the *ordinal* floor is step `#256abf` (3.58:1) — do not go darker for discrete tiers. Never a rainbow, never viridis-for-everything.

**Diverging (net flow in/out, surplus/deficit):** blue ↔ red, neutral gray midpoint (dark `#383835`, light `#f0efec`). Equal step count per arm; zero pinned to the neutral, not to the data mean.

### Scale tokens

- **Type:** `11 / 12 / 13 / 15 / 18 / 24 / 32 / 44` px. Base body **13px/18px**. Labels 11px with `letter-spacing: 0.04em; text-transform: uppercase`. All numerics: mono, `font-variant-numeric: tabular-nums`. Hero figures 32–44px.
- **Spacing (4px base):** `2 · 4 · 6 · 8 · 12 · 16 · 24 · 32 · 48 · 64`. Panel padding 12px; panel gap 1px (hairline, not space).
- **Radii:** `0` (map/canvas, tables) · `2` (inputs, chips) · `4` (cards, popovers) · `6` (modals) · `9999` (status dots only). Nothing softer — roundness reads consumer.
- **Control heights:** 24 (compact) · 30 (default, Blueprint's convention) · 36 (primary). Icon grid 16px. Hit target ≥ 32×32 even when the visual is smaller.
- **Elevation (dark):** do not use big shadows. `e0` none; `e1` = 1px `--border-default` + `0 1px 2px rgba(0,0,0,.4)`; `e2` (popover) = 1px `--border-interactive` + `0 8px 24px rgba(0,0,0,.55)`; `e3` (modal) = `0 16px 48px rgba(0,0,0,.65)` + backdrop `rgba(6,8,12,.6)`.
- **Motion:** `--dur-instant 80ms` (hover/highlight) · `--dur-micro 120ms` (toggle, chip) · `--dur-panel 180ms` (drawer, popover) · `--dur-camera 600ms` (map ease) · `--dur-flyto 900ms` (globe flight). Easings: standard `cubic-bezier(.2,0,.1,1)`, decelerate `cubic-bezier(.2,0,0,1)`, accelerate `cubic-bezier(.4,0,1,1)`. **No entrance animations, no parallax, no auto-rotating globe by default.** Motion exists to show a value changed or a camera moved.

## 5. Interaction grammar — identical on every surface

| Input | Meaning (everywhere) |
|---|---|
| Hover | **Reveal, never commit.** Highlight the object + its linked objects at 100% while others drop to 35% opacity; show tooltip with value + provenance chip. |
| Click | **Select.** Selection is global context: globe, charts, tables, and graph all filter to it. One selection at a time. |
| Cmd/Ctrl + click | Add/remove from multi-selection. |
| Double-click | **Drill in** — navigate to the entity page. |
| Drag (map) | Pan. `Shift`+drag = box select. `Alt`+drag = pitch/rotate. |
| Drag (time axis) | **Brush** a time window; all bound components re-query. Drag the window body to slide it. |
| Drag (chart x-axis) | Same brush semantics — time brushing is one behaviour, not two. |
| Scroll | Zoom (map/graph). `Shift`+scroll = horizontal pan in tables/timelines. Never hijack page scroll inside a panel that can't zoom. |
| Right-click | Context menu of *ontology actions* for that object type (Add to working set · Compare · Open entity · Copy ID · Cite). |
| Esc | Close topmost overlay → else clear selection → else blur. Always reversible. |

**Keyboard map (ship `?` help dialog listing exactly these):** `Cmd/Ctrl+K` palette · `/` search · `?` shortcuts · `g` then `g` globe, `e` entities, `r` graph, `c` capacity, `s` scenario, `b` brief, `d` sources · `Space` play/pause time · `[` `]` step time by one unit · `Shift+[` `]` step by ten · `t` toggle time panel · `l` toggle layer panel · `.` fly to selection · `f` fit to data · `w` add selection to working set · `Cmd+Enter` run scenario · `Cmd+S` save view · `Cmd+\` split panel · `Tab`/`Shift+Tab` roving focus within a panel, `F6` to jump between panels.

**Selection contract:** one `selectionStore` = `{objectType, objectId[], sourceSurface}`. Every surface subscribes; none owns it. Selecting on the globe must visibly update the charts within `--dur-micro`, or the "one system" illusion breaks.

## 6. Accessibility and honesty in a dark tactical UI

1. **Text alternative for the globe is mandatory, not optional.** A `Globe summary` panel (toggle `Shift+G`, and always present to screen readers via `aria-describedby`) renders the same data as a sorted, keyboard-navigable table: top 25 corridors by volume with origin, destination, value, change, source. The globe canvas gets `role="application"` + `aria-label`, and full keyboard control: arrow keys move a country cursor through a spatially-sorted list, `Enter` selects.
2. **Never colour alone.** Every categorical encoding carries a second channel: direct label (≤ 4 series), shape, or a 45°/135° hatch texture (auto-on under `forced-colors`, print, or the a11y setting). Status colours *always* ship with an icon + text label.
3. **Contrast floors:** body text ≥ 4.5:1 (WCAG 1.4.3), large text ≥ 3:1, interactive-control boundaries and graphical objects ≥ 3:1 (1.4.11) — hence `--border-interactive`, not `--border-default`, around anything clickable. Focus indicator ≥ 3:1 against both the control and the adjacent surface.
4. **`prefers-reduced-motion: reduce`** → globe flights become instant cuts, arc animation freezes to static geometry, time playback steps discretely, all transitions drop to 0ms except opacity ≤ 80ms.
5. **Modelled vs measured is a visual distinction, not a footnote.** Measured = solid stroke/fill. Modelled/projected = dashed stroke + 12%-alpha hatch + the word "modelled" in the tooltip. Uncertainty ranges render as a band; a point estimate with no CI shows `± n/a`.
6. **No invented precision.** Round to the source's precision; never interpolate a monthly value from an annual series without flagging it as `interpolated`. Never render a placeholder zero.
7. **Ethical framing is a UX constraint here.** The request's phrase "smart distribution of migrants" must never be literalised in the interface. MVP rules: no individual-level entity exists in the ontology; the minimum aggregation unit is admin-1 or corridor; the system models *capacity and need* and presents *options with trade-offs*; scenario outputs are labelled "scenario — modelled, not policy" and require an explicit "Acknowledge assumptions" click before export. Any screen that looks like an allocation console for human beings is a design failure, regardless of contrast ratios.

## 7. Naming and positioning

| Option | Positioning line | Connotation risk |
|---|---|---|
| **Corridor** ⭐ recommended | "Corridor — open migration intelligence." | **Low.** "Migration corridor" is the domain's own technical term (IOM/UNDESA bilateral stock tables). Neutral, infrastructural, non-mythic, non-alarmist. Risk: generic word, weak trademark; mitigate with a wordmark and the domain `corridor.*`. |
| **Meridian** | "Meridian — the world's migration picture, with its sources attached." | **Low.** Geodetic, calm, no human-displacement baggage. Risk: crowded name (finance/health products); check trademark in class 9/42. |
| **Threshold** | "Threshold — what a place can hold, and what it needs." | **Low-medium.** Reads directly as absorptive capacity, which is the product's actual thesis. Risk: "threshold" can be heard as a gatekeeping/limit metaphor — *how many we let in* — so the copy must anchor it to capacity, not admission. |
| **Basemap for Movement / "Bearing"** | "Bearing — direction, distance, and the data behind both." | **Medium.** Nautical/navigational, warm. Risk: "bearing" is also a load-bearing pun some will read as burden. |
| **Exodus** (current repo name) | — | **High — do not ship as the product name.** Frames all migration as forced biblical flight; carries Israel/Palestine political freight (the 1947 ship, the 1960 film); collides with the well-known Exodus crypto wallet brand. **Keep it only as the internal repo/engine codename**, the way "Blink" sits inside Chrome. |
| **Osiris** (the user's reference) | — | **Disqualifying.** Osiris is the Egyptian god of *the dead and the underworld*. Naming a migration platform after a death deity is the single worst available choice; it also collides with NASA's OSIRIS-REx and several security tools. Use it as nothing. |

**Recommendation:** product name **Corridor**; repo stays `exodus`; tagline *"Open migration intelligence — every number carries its source."* Positioning sentence for the README: "Corridor is what you would build if Palantir Gotham were open source and pointed at human mobility instead of threat networks: a typed ontology, a WebGL globe, provenance on every figure, and scenarios you can fork, diff, and cite."