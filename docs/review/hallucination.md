## FALSE-OR-UNSUPPORTED CLAIMS — verified against primary sources, 2026-09-19

### 1. The `/methods` headline sentence inverts the Robinson & Dilkina finding it cites

**Location:** §1.4 (audience row 3), §5.6.2, §7.3.6 item 1, §11.7 M7.1 — mandated verbatim product copy, first thing on `/methods`.

**Claim:** *"Roughly half the achievable accuracy in this field lives in getting origin outflow totals right, which is why we do not ship a fitted flow model."*

**What the paper says** (arXiv:1711.05462, §Results): *"The ANN and XGBoost models **without** a production function **outperform** the same models **with** a production function in 5 out of the 6 metrics."* The production function is `G_i = α·m_i`, a crude constant-share-of-population estimate of origin outflow. Supplying it *constrains and degrades* ML models — which is exactly why the prompt's own table shows 0.21/0.22 with it and 0.43/0.40 without.

The sentence asserts the reverse mechanism: that outflow totals are where the accuracy *lives*. They are where the accuracy is *lost*. This also makes §5.6.1 incoherent — Exodus's radiation null is "given the production function, exactly as in the reference literature," which the copy then frames as inheriting the field's hard part rather than its handicap.

**Fix:** replace with the mechanism the paper supports, e.g. *"A model handed a crude origin-outflow production function scores roughly half what the same model scores when it predicts flows directly — which tells you how much of a published CPC is an artefact of the constraint, not of the model."* Then delete the "which is why we do not ship a fitted flow model" clause, which does not follow from either reading.

### 2. Six CPC digits are rendered as a cited `<Figure>` scoreboard and are not sourced

**Location:** §5.6.2 table, §7.3.6 item 1, §11.7 M7.1.

I confirmed the paper reports separate with/without-production-function blocks for the Global Migrations dataset and confirmed the direction, but the ar5iv render truncates the table cells — I could not read a single one of 0.16 / 0.16 / 0.16 / 0.16 / 0.21 / 0.22 / 0.43 / 0.40. The prompt's own §1.8 rule says *"Do not publish a number this prompt does not support… If you need a number and cannot trace it to this prompt, render `—` and a refusal instead."*

Also structurally wrong in §7.3.6's phrasing: it lists all five models then appends "0.43 and 0.40 without one," reading as if gravity and radiation have a without-PF value. They cannot — they are defined by the production function.

**Fix:** add an M0 obligation to read Tables 2–3 of doi:10.1145/3209811.3209868, commit them as `packages/kernel/golden/cpc-reference.json` with the table/row/column each digit came from, and render the scoreboard from that fixture. Until the fixture exists, render `—`. Mark the two ML rows as the only ones with a without-PF column.

### 3. `FillStyleExtension({pattern: true})` will not produce the no-data hatch

**Location:** §6.7 effect S5; §6.14 register item 5.

The prompt marks "9.4's `FillStyleExtension` generates hatch patterns procedurally with no texture atlas" as `[UNVERIFIED]` and pre-decides an atlas-PNG fallback. Per the deck.gl FillStyleExtension reference, procedural patterns **do** exist but the API is not what is written: the constructor flag is `proceduralPattern: true` (which itself enables `pattern` and causes `fillPatternAtlas` to be **ignored**), and it still requires `fillPatternMapping` — carrying pattern configs (hatch, cross-hatch, dots) rather than atlas coordinates — plus `getFillPattern`.

So the code as specified silently renders no pattern, and the pre-decided fallback (commit a 64×64 PNG as `fillPatternAtlas`) is the *worse* of the two available paths.

**Fix:** rewrite S5 as `new FillStyleExtension({proceduralPattern: true})` with `fillPatternMapping` defining a 45° hatch and `getFillPattern` returning its name; drop the atlas fallback to second place. Remove register item 5's `[UNVERIFIED]` and replace it with "confirm the `fillPatternMapping` config keys against the installed `@deck.gl/extensions@9.4.0` `.d.ts` at M2."

### 4. Abel & Cohen deposit is misattributed in text rendered on `/sources`

**Location:** §3.1a row `abel-cohen`; §3.1b; §4.10(b).

figshare 14579241 is titled **"Bilateral international migration flow estimates by sex and type of move"**, file **`bilat_mig_sex_type.csv`**, sole listed author **Guy Abel**, CC BY 4.0. Byte count 65,341,478 matches the prompt exactly, and `ndownloader/files/53236079` 302s to S3 as described — the access path is correct.

But the prompt never names the file, calls the deposit "Abel & Cohen v6," and `/sources` renders `plan()` and the citation as product copy.

**Fix:** set the file name to `bilat_mig_sex_type.csv` in `plan()`; cite the deposit as Abel (figshare 14579241) and the *method* as Abel & Cohen, Scientific Data (2022), keeping them as two distinct strings. Verify the "v6" version label against the figshare version history at M0 — I did not confirm it.

### 5. `TimelineWidget` is an underscore-prefixed experimental export

**Location:** §2.9 ("evaluate the widget first"), §6.5 ("Do not use `TimelineWidget` from `@deck.gl/widgets`").

`modules/widgets/src/index.ts` exports `export {TimelineWidget as _TimelineWidget} from './timeline-widget';`. A plain `import {TimelineWidget}` does not resolve. Same convention as `_GlobeView`, which the prompt handles correctly elsewhere.

**Fix:** write it as `_TimelineWidget` in both places, and note that its experimental status is itself an argument for the hand-rolled track — which strengthens the decision rather than weakening it.

### 6. `erasableSyntaxOnly` does not raise TS1294 on every `namespace`

**Location:** D-03a; repeated as a compiler fact in §2.10, §3.8, §5.1, §9.4 ("No `enum`, no `namespace`, anywhere… `erasableSyntaxOnly` raises **TS1294** on both, confirmed empirically on 7.0.2").

TS1294 fires on constructs with runtime emit: value-bearing `namespace`, `enum`, parameter properties. Type-only namespaces, `declare namespace`, and ambient `declare enum` are erasable and compile. The blanket "anywhere" is stated as an observed compiler result and is not one.

**Fix:** keep the ban as a style rule if you want it, but restate the justification: "value-bearing `namespace` and `enum` raise TS1294 under `erasableSyntaxOnly`; we additionally forbid type-only namespaces so no package needs a second rule." Do not claim empirical confirmation for a behaviour the compiler does not have.

### 7. Version-pin vintage mismatch inside the register

**Location:** §6.14 register item 7 — "The `visgl:webgl-only` export condition resolves under **Vite 7**." D-08 and §2.10 pin **Vite 8.3.0**.

The resolution instruction names a version the build will not have installed. Separately, I could not confirm `visgl:webgl-only` is a published export condition at all — flag it as verify-against-the-installed-`package.json`-`exports`-map, not against the web.

### 8. Frame-budget table arithmetic

**Location:** §6.11, SwiftShader column.

Rows sum to 19.2 ms. Against the stated 18.18 ms gate the slack is −1.02 ms, not the printed **−0.9**. (Real-GPU column checks out: 9.3 ms, slack 7.37 ≈ 7.4.) Minor, but the table is published to `/methods` under a rule that measured numbers must be exact.

---

## VERIFIED CORRECT — do not re-litigate these

Stated because several look like the kind of detail that gets "corrected" into an error mid-build:

- **Zenodo 17344747** — real. *"Deep learning four decades of human migration: datasets"*, Gaskin (Cambridge) & Abel (HKU), deposited 2025-10-13, CC BY 4.0. `mig_bilateral.csv` 146 MB, `T.nc` 3.4 GB. The T.nc trap is real. (Undocumented extra file: `Iso_code_lookup.csv`, 6 KB — worth a look before hand-building `xwalk`.)
- **Nature 655(8121):148–157 (2026)**, doi:10.1038/s41586-026-10611-7, published 10 June 2026, 230 countries, 1990–present, deep recurrent NN over 18 covariates. Citation is exact.
- **`@luma.gl/effects` exists** at 9.4.1 with fxaa/vignette/bloom; `@luma.gl/shadertools` 9.4.1 is "Shader module system," no post-FX. D-16 is right.
- **`PathStyleExtension` `dashUnits` and `dashMode` both exist** — §6.14 item 3's fallback is insurance you probably won't need.
- **Natural Earth**: `ne_10m_admin_0_countries.zip` → 200, content-length **4930492** exact; `ne_10m_admin_0_disputed_areas.zip` → 200, **215221** exact; `ne_10m_admin_0_breakaway_disputed_areas.zip` → **403**. Trap `trap.naturalearth.layer-name` holds today.
- **Eurostat 5,000,000-cell ceiling** — exact. 500k–5M diverts to async; >5M is a client error. `trap.eurostat.cell-ceiling` holds.
- **WHO GHO codes** — `WHS6_102` = "Hospital beds (per 10 000 population)"; `HRH_26` = "Physicians density (per 1000 population)"; `HRH_33` = "Nursing and midwifery personnel density (per 1000 population)". All three live, all three units as stated. (Note `HWF_0001`/`HWF_0006` also exist at per-10,000 — do not swap them in without re-deriving the conversion.)
- **Solver package facts in the §5.10 refusal** — `highs` 1.15.3 MIT, `glpk.js` 5.0.0 GPL-3.0, `lp-model` 0.4.2 MIT. All exact.
- **Regulation (EU) 2026/1744** — signed 8 July 2026, OJ 24 July 2026, in force 27 July 2026; Annex III high-risk moved 2 Aug 2026 → **2 Dec 2027**; Annex I → **2 Aug 2028**; Art. 5 prohibitions unchanged from 2 Feb 2025. §10.6 item 7 is accurate.
- **All three contested-evidence arXiv IDs are real and correctly attributed**: 2605.06686 *Robustness of Refugee-Matching Gains to Off-Policy Evaluation Choices* (Bansak, Paulson, Rothenhäusler, Ferwerda, Hainmueller); 2602.08892 *Winner's Curse Drives False Promises in Data-Driven Decisions: A Case Study in Refugee Matching* (Bastani, Bastani, McLaughlin); 2502.13246 *When People are Floods: Analyzing Dehumanizing Metaphors in Immigration Discourse with Large Language Models* (Mendelsohn, Budak).
- **doi:10.17645/si.10923** resolves to Social Inclusion article 10923.
- **All 23 version pins resolve to today's npm `latest`** — typescript 7.0.2, pnpm 12.4.2, turbo 2.11.2, vite 8.3.0, react 19.3.0, zod 4.6.5, zustand 5.0.15, @tanstack/react-router 1.170.38, tailwindcss 4.3.3, radix-ui 1.6.7, lucide-react 1.47.0, @biomejs/biome 2.5.14, vitest 5.0.1, fast-check 4.10.1, @playwright/test 1.63.0, deck.gl 9.4.0, @luma.gl/core 9.4.1, apache-arrow 21.2.0, h3-js 4.5.0, @loaders.gl/parquet 4.5.1, size-limit 14.0.0, @changesets/cli 3.0.3, @duckdb/node-api 1.5.5-r.5. None is invented. (Consequence worth stating in D-02: every pin is bleeding-edge-as-of-today, so "the pinned package does not install" is a live failure mode, not a theoretical one. `dependency-cruiser` is currently 18.3.1 — §9.3 already defers that pin to M0, which is consistent.)
- H3 r3 = 41,162 and r2 = 5,882 both correct (`2 + 120·7^r`). Natural Earth 258 ADM0 features correct. WPP VarID 2 = Medium, VarID 7 = Zero-migration correct. `CompressionStream` gzip/deflate/deflate-raw only, no zstd — correct. AGPL §13 has no "public" qualifier — correct. OSD clauses 5 and 6 — correct. AI Act Annex III 7(b) wording — correct. UNGA Res. 3449 (XXX), 9 Dec 1975 — correct. Simini et al., *Nature* 484(7392):96–100, doi:10.1038/nature10856 — correct. CPC is the Bray–Curtis/Sørensen similarity — correct. GitHub LFS fork bandwidth billing to the parent — correct. §5.4.6 headroom worked examples (−101,123.595 and +123,595.505) — arithmetic correct. §3.1b budget sums to 33.4 MiB — correct.

---

## STILL UNVERIFIED — add an explicit M0 probe for each, or render `—`

I did not reach these, and none of them is currently marked `[UNVERIFIED]` in the prompt even though each is rendered as product copy or drives a build decision:

| Claim | Location | Why it matters |
|---|---|---|
| Gaskin & Abel "**73% test correlation**" | §2.4 D-25, §3.5 `trap.gaskin-abel.modelled`, §1.4 | Quoted as the justification for the entire no-easing rule and rendered on `/sources`. Read it out of the Nature paper at M0 and commit the page/table reference. |
| UN DESA IMS 2024 "**53%** moved within their own region of origin" | §2.9, §7.3.1 camera tooltip, §10.5 rule 7 | Verbatim tooltip copy with a named source. The regional breakdown (83%/73%/63%) is a second set of unsourced digits. |
| WPP "**2026 revision postponed to 2027**" | §3.1b `wpp` row | Drives `cadence: 'frozen'` and the whole M2 model's vintage story. |
| GHS-POP zip = **323,340,844 B** at the stated V1-0/V1_0 path | §3.1a | `verify:sources` asserts ±5%; if the URL grammar shifted the fallback is undefined. |
| UN DESA IMS xlsx URL, **6,005,287 B**, and the `User-Agent` 403 trap | §3.1a, `trap.undesa.user-agent` | Recipe connector + a `/sources` trap bound to a regression test. |
| GDELT GEO 2.0 API "**returns 404 including on its own documented example**" | §8.6 `trap.gdelt.geo-404` | Shipped trap copy asserting a third party's API is broken. |
| CEPII Gravity 202211 licence = **Etalab 2.0** | §3.1b, `bundle:verify` allowlist | A wrong licence id here fails gate 2 or, worse, passes a non-redistributable row. |
| UNHCR "**no asterisk convention** — do not build asterisk parsing" | `trap.unhcr.rounding` | UNHCR products do use `*` for values 1–4 in some outputs. Contested; verify before shipping as a trap. |
| UN ESA/P/WP.160 Table 8 — all eleven figures incl. **Korea 5,149,000,000** and the "unrealistic" footnote | §5.3.6, §7.3.6 item 4 | The single most prominent number in the product, committed as a golden vector. Needs the PDF page, not a recollection. |
| Sanderson–Scherbov Germany **+11.3% vs +49.2%** | §5.3.5 | Rendered as a cited static reference figure. |
| JRC Atlas "2025 ed., **198 countries**" | §1.5 | §1.8 already bans quoting a JRC *indicator* count as `[UNVERIFIED]` but leaves the country count unguarded. |
| `visgl:webgl-only` export condition | §2.4 D-24, §6.1, §6.14 item 7 | Resolve against the installed `exports` map, never the web. |