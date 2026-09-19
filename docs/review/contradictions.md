every downstream section reads a different one.

3. **H3 (M6.7 vs §5.3.6)** — the milestone table orders the one thing §5.3.6 names as fabrication. Fix the gate text before an agent calibrates `M2` against WP.160.

---

## Addendum — findings not yet listed

**I1. `LayerSpec` has two incompatible definitions.**
§6.6 `packages/contracts/src/layer.ts`: `{id, geometry, paletteSlot, width?, dashArray?, pickable, opacity?: never, alpha?: never, estimateKind?: never, latencyClass?: never}` plus `PlatformChannels` and `mergePlatformChannels(spec, platform)`. §9.4.6, same package: `{geometry, positions: Float32Array, indices, channels: Record<AuthorChannel, Float32Array>, pickingIds}` — no `id`, no `paletteSlot`, no `never` fields, and a different `mergePlatformChannels(spec, facts, world)` signature returning `RenderableLayer`.
*Resolution:* one interface. §9.4.6's carries the geometry payload `encode()` must return; §6.6's carries the `never` fields that make GLOBE-06 and §4.13 O8 provable. Merge: §9.4.6's fields plus §6.6's `never` keys plus `id`/`paletteSlot`, and one `mergePlatformChannels` signature.

**I2. `MapLayer.encode()` receives two different inputs.**
§4.3 and §4.13 O8: `encode(facts: Fact[]): LayerSpec`. §9.4.6: same. But §6.5/§6.6 feed the corridor layer from an `AttributeCube` built by `semantic` from `Fact[]` + manifest, and `buildGlobeLayers()` constructs deck layers directly from `cube.frames` — no `encode()` call appears anywhere in §6.
*Resolution:* state where the in-tree corridor layer sits relative to the `MapLayer` contract. As written, the contract that D-34 requires two independent implementations of is never invoked by the layer that matters, and §9.4's "contract-lands rule" (`MapLayer` has arc, choropleth and h3 implementations) has no call site.

**I3. `AuthorChannel` omits the one channel the corridor layer needs.**
§9.4.6 `AUTHOR_CHANNELS = ['width','color','elevation','radius']`. §6.6's corridor layer sets `dashArray` as an author-facing channel, and §6.6's own `LayerSpec` lists `dashArray?: Float32Array`. But §9.4.6's `RenderableLayer` makes `dashArray` **platform-owned** (`mergePlatformChannels` writes it from M3), and §6.6's `LayerSpec` makes it author-settable.
*Resolution:* dash is the disagreement channel and §2.8 D-49's logic applies to it exactly as to opacity — make it platform-owned, add it to §6.6's `never` list, and delete it from `LayerSpec`.

**I4. Two `PlatformChannels`/platform-owned key lists.**
§6.6: platform owns `opacity`, `alpha`, `estimateKind`, `latencyClass`. §9.4.6's type test: `PlatformOwned = 'opacity' | 'dashArray' | 'hatch' | 'latencyClass' | 'estimateKind'`. §7.6 `LayerStackItem.platformComputed: ('opacity' | 'estimateKindStyling' | 'latencyClass')[]` — a third list with a third spelling (`estimateKindStyling`).
*Resolution:* one const array in contracts; the type test, the `never` keys and the registry field all derive from it.

**I5. `geometry` value domains disagree.**
§6.6/§9.4.6 `LayerSpec.geometry: 'arc' | 'choropleth' | 'h3' | 'point'`. §7.6 `LayerStackItem.geometry: 'text' | 'point' | 'arc' | 'h3' | 'choropleth' | 'graticule' | 'sphere'`. §4.12's change table says "New geometry kind (e.g. a **3rd** `MapLayer.geometry`)" — implying two exist, not four or seven.
*Resolution:* one union; §7.6's is the superset the layer panel needs, but then §4.12's "3rd" is wrong.

**I6. `DisplayScale` vs `CubeAttribute.domain` — two places own the ramp domain.**
§4.6 `IndicatorSpec.display: {scale, domain: 'observed_p05_p95' | 'fixed', fixedDomain?, clamp}`. §3.8 `CubeAttribute.domain: readonly [number, number]` "Pre-quantisation range used to build the GPU buffer". §7.6 `LayerChannel.domain` "**FIXED across all years**". §7.9.5 width "clamped to [p05, p99]" vs §4.6's `observed_p05_p95`.
*Resolution:* the cube's domain is authoritative for the globe (it is baked into the u8/f32 quantisation and cannot be changed at runtime); `DisplayScale` governs sparklines and the choropleth only. Say so, and reconcile p95 vs p99.

**I7. `estimate_kind` styling is platform-owned and author-specified.**
§6.6 and §9.4.6 make `estimateKind` a platform key an author cannot set. §7.9.5 rule 1 requires modelled marks to carry "dashed stroke + 12%-alpha hatch + the word `modelled` + the `ƒ` glyph" — a styling decision with no owner named, applied to charts (`packages/ui`) that never go through `mergePlatformChannels`.
*Resolution:* name the function in `semantic` that emits estimate-kind styling for both surfaces, or scope the platform ownership to globe layers only.

---

## J. Remaining data-layer contradictions

**J1. `wpp` table names and contents.**
§3.3 lists `wpp_pop.parquet` ("2024 population by single-year age × sex"), `wpp_life.parquet`, `wpp_diff.parquet` ("D(c,y) = VarID2 − VarID7, PSR, POADR, 2024-2050"). §5.3.2 says the `wpp` table carries "**six** population aggregates … `{pop_total, pop_15_64, pop_65p} × {varid2, varid7}`" per country-year 2024–2050 plus `wpp_mean_annual_netmig` — a single table named `wpp`, with columns that appear in none of the three §3.3 tables. §9.1 names one table, `demography.parquet`.
*Resolution:* M2's bisection cannot run without the six aggregates and `wpp_mean_annual_netmig`; add them to `wpp_diff.parquet` explicitly in §3.3 and in the manifest's column list, and delete §5.3.2's implied fourth table.

**J2. POADR is precomputed and computed live.**
§3.3 `wpp_diff.parquet` ships "PSR, POADR, 2024-2050" as precomputed columns; §1.8 N8 says "WPP differentials ship as **precomputed columns**". §5.3.5 computes `α(c,y)` live from the shipped `L(a)` by linear interpolation, with a monotonicity assertion, and §5.2 budgets it.
*Resolution:* pick one. If POADR is precomputed, §5.3.5's algorithm and its test are dead code; if computed, `wpp_life.parquet` must ship single-year `L(a)` for every country-year in range, which is a materially larger table than the 5 MiB `wpp` budget assumes.

**J3. `h3_pop` vs `h3_r3` vs the r2 roll-up.**
§3.3 `h3_pop.parquet` ("41,162 r3 cells: h3, pop, area_km2"); §6.4/§9.1 `h3_r3.parquet`; §6.12 requires a second committed r2 table (5,882 cells) that appears in no path list, no manifest example and no byte budget.
*Resolution:* one name, and add the r2 table to §3.3, §3.1b's budget and §3.8's `tables[]`.

**J4. GHS-POP epoch is a projection labelled as a measurement.**
§3.1b: "GHS-POP R2023A, **epoch E2025** (**a projection — label it**)", `latencyClass` assigned `modelled` in §8.2. But §3.5's estimate-kind stamping gives no rule for it, and §7.3.1's people-density layer carries no projection badge in the mock legend.
*Resolution:* `estimate_kind = 'extrapolated'` on every `h3_pop` row and a badge in the layer legend; otherwise the density layer is the one people-valued surface with no vintage disclosure.

**J5. `centroids` is both derived at ingest and committed as an override table.**
§3.1a: "Derived from `naturalearth` at ingest; **committed override table** at `packages/connectors/centroids/overrides.ts`". §3.3: `centroids.parquet` in the snapshot. §4.3: `Place.centroid` is "the **ONLY** arc endpoint source".
*Resolution:* consistent, but the override table's contents are unspecified and it is the only hand-authored geometry in the product — it needs the same golden test as `xwalk` (§4.9), which no section assigns.

**J6. `xwalk` namespace tokens are uppercase in the table and lowercase in the type.**
§3.4: `M49`, `ISO3`, `EUROSTAT_GEO`, `OECD_REF_AREA`, `UNHCR_LEGACY` as the `namespace` column values. §4.9: `NAMESPACES = ['m49','iso3','eurostat_geo','oecd_ref_area','unhcr_legacy']`, and `resolvePlace(ns: Namespace, …)` reads `snapshot/xwalk.parquet`.
*Resolution:* lowercase (the type is the consumer); fix §3.4's table.

**J7. `estimate_kind='assumed_zero'` has no producer, and a gate that requires one.**
§3.4: "`estimate_kind='assumed_zero'` has **no producer in v1**." §3.7 gate 11: "Every `assumed_zero` row's connector has a registered `declaredZeroRule`", with §3.7's requirement that "Each gate has a **seeded-violation test**".
*Resolution:* consistent only if the seeded violation is synthetic; say so explicitly, since §11.8 R16 forbids constructing hostile rows from real restricted bytes and this one has no natural source at all.

**J8. Two sets of assertions for the same ingest traps.**
§3.3's assertion table and §3.5's trap table cover the same eight facts (WPP row count, GA header, AC row count and `type` filter, WPP `LocTypeName`, SRB/ASFR scaling, h3 count, ADM0 feature count, licence columns) with different phrasings and different binding mechanisms (hard assertion in `snapshot:build` vs fixture-backed regression test bound by trap id).
*Resolution:* one mechanism per fact. A build assertion and a trap test that both cover WPP's multi-member gzip will diverge the first time one is edited; §3.5's trap ids are the ones `/sources` renders, so make the build assertion call the same predicate.

**J9. The demo slice is committed but unbudgeted.**
§3.3 lists `snapshot/demo/` as committed; §3.9 D3 and §11.3 M1.2 size it at 2 MiB. §3.1b's budget table (total ≈33.4 MiB) has no `demo` row, and §3.7 gate 10 caps the `snapshot/` **total** at 40 MiB.
*Resolution:* add a `demo` row to the budget, or gitignore `snapshot/demo/` and generate it on demand — but then `--from-fixtures` output is not reviewable, which §3.3's byte-reproducibility rule exists to guarantee.

**J10. `radiation_pred` and `s_ij` columns are specified but unallocated.**
§5.6.3 ships two derived float32 columns on the corridor table for the hold-out year (48 KB each). They appear in no §3.3 path, no §3.1b budget row, no §3.8 `columns[]` example, and no §6.5 cube attribute.
*Resolution:* add them to `flows.parquet`'s column list in the manifest, or to a separate `radiation.parquet` with its own budget line.

---

## K. Remaining UX contradictions

**K1. Layer ids differ between the renderer and the panel.**
§6.3 `LAYER_ORDER`: `'ocean-sphere' | 'graticule' | 'countries' | 'h3-density' | 'corridors' | 'incidents' | 'labels'`, typed as `GlobeLayerId` and used as the key in `HoverTarget.layerId` (§6.9). §7.6 rule 1 names them "labels · incidents · corridors · **people density** · **country fill** · graticule · ocean sphere"; §7.3.1's panel mock shows "People density", "Country fill", "Ocean locked".
*Resolution:* ids are `GlobeLayerId`; labels are copy. §7.6 rule 1 should say the order matches `LAYER_ORDER` reversed and stop restating names. Also `selection-halo` is absent from §7.6's fixed order entirely.

**K2. The context rail and the layer stack both claim the legend.**
§7.2's frame puts "legend + selection + provenance" in the 320px context rail (§7.2.1, which is referenced but never written). §7.6 rule 4: "**Each row states its channels in the legend**, in words, and carries its own no-data swatch" — a per-row legend in the 280px layer stack. §7.3.1's mock shows the full legend in the rail and channel sub-labels in the stack.
*Resolution:* §7.3.1's split is workable; §7.2.1 is referenced and missing, and §7.6 rule 4 needs to say "in the rail's legend entry for that layer".

**K3. `/methods` section order has two versions.**
§7.3.6: scoreboard → five model cards → refusals (allocation first) → Scenario VI last, "**Do not reorder.**" §1.6's acceptance: "`/methods#refusals` renders **every entry of `NON_GOALS` in array order, allocation solver first**; a test asserts `NON_GOALS.length === 18` and that every `anchor` resolves to a rendered heading." §7.3.6's refusal list names seven refusals, not eighteen: "fitted econometrics, placeholder coefficients, the live layer, ADM1, FLAT mode, departure forecasting, origin-side pressure indices" plus allocation.
*Resolution:* the refusals section renders all 18 `NON_GOALS` entries; §7.3.6's seven-item list is a subset and will be built as the whole.

**K4. Two `<Figure>`-adjacent provenance popover content lists.**
§3.5 link 4: "shows source, vintage, latency days, estimate kind, licence and CI". §7.4.3: source id + title, reference vintage, **retrieval date**, latency days, estimate kind + glyph + plain-English sentence, licence + redistributable flag, interval + label, **the transform chain** `source → connector@version → transform commit SHA → suppression rule → rounding rule`, **permalink with the snapshot vintage hash**. §10.7: the same as §7.4.3, plus "the **formula** with every variable defined".
*Resolution:* §10.7's is the superset and the one the ethics acceptance tests check; make §3.5 and §7.4.3 defer to it. Note the transform chain requires a commit SHA in the bundle, which §3.3's byte-reproducibility rule ("no timestamps appear in any file except `manifest.builtAt` and `manifest.builderCommit`") permits only via `builderCommit` — a single repo-level SHA, not a per-connector one.

**K5. `saved_views` corridors have a colour and are not in the palette.**
§7.8: "corridors in `saved_views` take `#199e70`". §6.8: slot 2 `#199e70` is "corridors outbound from the focused country". The three-slot map palette has no fourth slot for saved views.
*Resolution:* falls out of B5 — once direction owns slots 0 and 2 and selection owns slot 1, `saved_views` needs a non-hue channel (§7.12 #10's "never colour alone" already implies one).

**K6. Hover dimming percentage.**
§7.3.1: "Hover → a preview card at **35%-dimmed page**". §7.8: "Target and its linked objects to full strength; everything else to **35% of its computed alpha**". §7.8's selection rendering: "every other corridor drops to `--text-muted` at **20%** of its computed alpha".
*Resolution:* one hover constant and one selection constant, both in tokens; the first two sentences describe different things in the same words.

**K7. The `?` dialog lists "exactly these and nothing else" and is missing entries the spec mandates.**
§7.8's keymap has no arrow-key entries (see H7), no `Esc` (documented separately in the same section), and no entry for the tour (`> take the tour`, §7.13.3, "Reachable forever from the palette and from `?`").
*Resolution:* one keymap table that includes `Esc`, the canvas cursor keys and the tour entry.

**K8. Two storage-failure postures.**
§7.3.7: `saved_views` "persists in `localStorage` … wrapped in try/catch, and renders empty without error when storage is unavailable". §7.13.1: "If `localStorage` is unavailable, **fail closed and show the notice**." §7.14 criterion 16: "`localStorage` disabled: the first-run notice shows, `saved_views` renders empty, and nothing throws."
*Resolution:* consistent as written — but only because the two keys have opposite failure semantics. State that explicitly so an agent does not unify them behind one storage helper.

**K9. The tour steps the year cursor, and the tour must not animate.**
§7.13.3: "it **animates no data mark** — each step only moves focus and opens the panel it is describing", then step 1: "**it steps the cursor 2023 → 2019 → 2023** so the flipbook is felt". Stepping the cursor re-binds every corridor's width, dash and colour buffer.
*Resolution:* reword the constraint to "no easing, no entrance animation, no motion beyond discrete year cuts", which is what step 1 actually does and what §6.5 permits.

**K10. `/place` route target vs sheet.**
§7.2 rule 7: `/place` renders "as a 560px right-hand **sheet**" over a live canvas. §7.3.2's header shows a `✕` close control, and §7.8's `Esc` order closes "the topmost overlay → else clear multi-selection". A route is not an overlay, and `Esc` on `/place` has no defined behaviour (does it navigate to `/`?).
*Resolution:* define `Esc` and `✕` on the three over-canvas routes as `navigate('/')` preserving year and camera, and add that to §7.8's `Esc` ladder.

---

## L. Live-layer contradictions not yet listed

**L1. The v1 ladder has two states; the chrome table has four and the client renders them.**
§2.5 D-32 and §7.10: "exactly **two** rungs: `SNAPSHOT` and `UNAVAILABLE`. `LIVE` and `CACHED` do not exist in v1 and **no code path may produce them**." §8.9's chrome table specifies all four and says "In v1 only `SNAPSHOT` and `UNAVAILABLE` are reachable, and the chip is rendered by the **same component** so M9 adds no new surface". §9.4.2/§8.7 type `LadderState` as four members in `apps/live`.
*Resolution:* consistent only if `DataState` (§2.10, two members, in contracts) and `LadderState` (§8.7, four members, in `apps/live`) stay separate types and the v1 chip is typed `DataState`. Say so, or the two-state rule is unenforceable.

**L2. The record-replay client is v1 infrastructure and lives behind an M9 gate.**
§8.1: "The one thing you must build in v1 that looks like live plumbing: the **record-replay HTTP client in `packages/sdk`** and the **corpus transform path**." §8.7 and §8.8 are M9-only. But §8.10's `ReplayClient` interface, `CorpusEntry` and the `CORRIDOR_MODE` contract are cited by §9.4.4's `IngestCtx` and by §9.6's reference connector at M1.
*Resolution:* consistent; but §8's heading ("Live layer") and §11.7's M9 description both read as if all of §8 is optional. Split §8 explicitly into "v1 (M1)" and "M9" subsections, or an agent under time pressure will skip the client and have no offline ingest.

**L3. Two `ReplayClient` interfaces.**
§8.10: `get(url: string, init?): Promise<{status, body, entry}>`. §9.4.4: `get(plan: FetchPlan, signal: AbortSignal): Promise<RawArtifact>`.
*Resolution:* §9.4.4's — it carries the `planId` the fixture index keys on and the `AbortSignal` the budget rule (§11.8 R11) needs.

**L4. `CorpusEntry` vs the fixture sidecar vs `RawArtifact`.**
§8.10 `CorpusEntry`: `{sourceId, url, fetchedAt, sha256, httpStatus, redirectChain, filter, bodyPath}`. §2.9's fixture default: "`{url, fetchedAt, sha256, httpStatus, redirectChain}` sidecar". §9.4.4 `RawArtifact`: `{planId, contentType, bytes, sha256, httpStatus, redirectChain, fetchedAt}`. §9.6's `fixtures/index.json`: `{planId, file, url, fetchedAt, sha256, httpStatus, redirectChain}`.
*Resolution:* one envelope type with `planId`, `bodyPath`/`file` unified, and `filter` present (it is load-bearing for the GDELT corpus, which commits filtered rows while hashing the upstream artefact).

**L5. GDELT slot cadence: 15 minutes and 60 seconds.**
§3.1a and §3.5 describe 15-minute slots; §8.6 polls `lastupdate.txt` on a "**60s timer**, download only on slot change". Consistent — but §8.6's traps table and §3.5's trap table state the same four GDELT traps with different ids (`trap.gdelt.http-urls` vs `trap.gdelt.http-scheme`, `trap.gdelt.gkg-size` vs `trap.gdelt.no-gkg`), and §8.6 adds five traps (`geo-404`, `no-doc`, `cameo-roots`, `variable-size`, `translation-skew`) that §3.5's v1 trap set omits.
*Resolution:* one trap registry; §8.11 criterion 8.8 asserts "each of the **nine** traps in §8.6", while §3.5's table is presented as "the v1 trap set".

**L6. The CAMEO event filter exists in one section only.**
§8.6: keep `EventRootCode` in {14, 17, 18, 19, 20}. §3.1a's `corpus → gdelt` row says "`export` + `mentions` only — GKG excluded" with no event filter, and §3.1b budgets the corpus at 6 MiB on that basis.
*Resolution:* add the filter to §3.1a's access description; it is a ~10× reduction and the budget depends on it.

---

## M. Ethics-section contradictions not yet listed

**M1. Model cards: five, with two different field sets and two locations.**
§5.1.3 / §7.3.6: model cards render "inputs, outputs, assumptions with provenance, and a `placeholder` flag column". §10.8: `ModelCard` at `packages/registry/src/model-cards/<modelId>.ts` with fourteen fields including `prohibitedUse`, `reviewedOn`, `maintainer`, `trainingData`, `ethicalConsiderations`. §5.1.3 says the cards are generated from each model's `assumptions: AssumptionSpec[]`, and `PARAMETERS.md` is generated by `pnpm gen:parameters` walking the same array.
*Resolution:* `ModelCard` in registry is the artefact; `AssumptionSpec[]` on the `Model` is its source for the assumptions field only. Note `ModelAssumption.placeholder: false` (§10.8, a literal type) and `AssumptionSpec.placeholder: boolean` (§9.4.5) are different types for the same field — the literal is the better one and should replace the boolean.

**M2. `ModelCard.modelId` union vs the model ids used everywhere else.**
§10.8: `'m1-headroom' | 'm2-replacement' | 'm3-disagreement' | 'm4-coverage' | 'm5-radiation'`. §5.2's table and §5.11 use `M1`…`M5`; §5.5.1 names sub-models `M3b` and `M3c`, which have no card slot and no id.
*Resolution:* one id scheme, and decide whether M3b/M3c are separate cards or sections of the M3 card — §7.3.6 requires "**five** model cards", so they must be sections.

**M3. Datasheets are required per source and exist for none of them.**
§10.8: "`pnpm check:policy` fails if any source in `snapshot/manifest.json` has **no datasheet**", at `packages/connectors/<id>/datasheet.ts` with a mandatory non-empty `knownUndercount`. Neither §3.1's source tables, §9.1's connector file list (`plugin.ts`, `schema.ts`, `indicators.ts`, `fixtures/`, `plugin.test.ts`, `LICENSE`), §4.12's seven-step recipe, nor §9.6's ten-file reference connector includes a datasheet.
*Resolution:* add `datasheet.ts` to the `gen:connector` template, to §4.12 step 4 and to §9.6's file list, or the M8 connector-proof job fails `check:policy` on the connector it just generated.

**M4. Two connector file manifests.**
§9.1/§9.6: `plugin.ts` (or `index.ts`), `schema.ts`, `indicators.ts`, `endpoints.ts`, `fixtures/`, `plugin.test.ts`/`transform.test.ts`, `traps.test.ts`, `LICENSE`, `package.json`. §4.12 step 1: "`plugin.ts`, `schema.ts`, `indicators.ts`, `fixtures/`, `plugin.test.ts`, `LICENSE`". §11.3: "`plan.ts`, `fetch.ts`, `transform.ts`, `schema.ts`, `fixtures/`, `<id>.test.ts`, `LICENSE`" — three files where the others have one.
*Resolution:* one template, since `gen:connector` writes it and M8.2 asserts zero diffs outside the generated directory.

**M5. The AI Act boundary is stated twice with different dates and different scope.**
§5.8 cites "EU AI Act Annex III point 7(b)" for the pressure-index refusal. §10.6 item 7 cites Annex III point 7 in full, Art. 5(1)(g), and five dates from "Regulation (EU) 2026/1744 (Digital Omnibus on AI), OJ 24 July 2026". §1.8 N17 cites "EU AI Act Annex III(7)". §1.8 N16 cites "ECHR Protocol 4 Art. 4 and Charter Art. 19(1)".
*Resolution:* one citation block in `ETHICS.md` §3, referenced by id from the three refusal copies. §10.12 forbids re-verifying any of it after M0, so a single source of truth matters more than usual.

**M6. The `[UNVERIFIED]` register is split across four sections with different instructions for the same item.**
§2.11 (eight items), §3.2 (per-source fallbacks), §6.14 (eight render items with milestones and fallbacks), §8.12 (five live items), §11.9 (six items). UNHCR's licence appears in §2.11, §3.1c, §3.2, §10.11 L4 and §11.9 with compatible but separately worded instructions; the frame budgets appear in §2.11, §6.11, §6.14 item 8, §9.12 and §11.9 with four different remediation paths.
*Resolution:* one register, one row per claim, with `resolveAt`, `fallback` and `mayNeverBeUpgradedWithout` columns — and make it the thing `DECISIONS.md` appends against.

**M7. Two allocation-refusal content specifications.**
§5.10 lists the objective, weight vector, three spec bugs, a fourth bug (LP relaxation not integral), the solver-choice table with six rows of budget, and the legal block. §10.6 lists seven required elements with a fixture-backed content test, adds the guardrail block (consent, preferences, family unity, non-refoulement pre-filter, `DestinationLegalBasis`, human-in-the-loop, protected attributes) and **omits** the fourth bug and the solver budget table. §11.7 M7.3 asserts a third, shorter subset.
*Resolution:* §10.6's seven elements plus §5.10's fourth bug and solver table; one test list; M7.3 cites it rather than restating three of them.

**M8. The contested-evidence citation set differs between the two copies.**
§5.10: "+40% employment in a United States backtest and roughly +75% in a Swiss one, and +22% to +38% relative on a 496-person cohort", "In February 2026 a paper built a synthetic refugee-matching environment…", "A later paper by the original authors finds the estimates robust". §10.6 item 5 gives the same effects with full citations (Science 359(6373):325–329; Operations Research 69(5):1468–1486; arXiv 2605.06686; arXiv 2602.08892 with named authors) and asserts "**a content test asserts both arXiv ids appear**" — ids that §5.10 does not carry, and §5.10 reverses which paper came first.
*Resolution:* §10.6's citations verbatim; delete §5.10's paraphrase or make it a pointer.

---

## N. Two structural problems worth naming separately

**N1. The document specifies the same artefact in two voices, and neither is marked authoritative.**
§1–§2 and §9–§11 read as the build contract; §3–§8 read as detailed design written earlier against a different section numbering, a different package layout (`packages/cli`, `apps/web/e2e`, root `corpus/`), a different `Fact`/`Provenance`/manifest, and a `§12` that does not exist. Roughly two-thirds of the findings above are one document overwriting another and neither winning.
*Resolution:* add a precedence clause at the top — e.g. "where §3–§8 and §9–§11 conflict, §9–§11 wins for repository structure, commands and gates; §3–§8 wins for data semantics, formulas and copy" — and then do one pass reconciling the type definitions, which precedence alone cannot fix.

**N2. Acceptance criteria are defined in nine places and gated in one.**
§3.9, §4.13, §5.11, §6.13, §7.14, §8.11, §9.17, §10.13 and §11.2–§11.7 each define a criteria set, with overlapping ids (`D1`…`D14`, `O1`…`O17`, `ARROW-01`/`PERF-01`/`CAM-01`/`GLOBE-02`…`GLOBE-14`, `8.1`…`8.16`, `M0.1`…`M8.7`) and no cross-index. §11.1's `AcceptanceCheck.id` format (`'M3.2'`) can only express §11's.
*Resolution:* one `checks.ts` registry keyed by the section-local id, each carrying `milestone` and `blocking`, assembled into `runGate`. Until that exists, `pnpm gate:all` green is not the definition of done that §11.11 claims.