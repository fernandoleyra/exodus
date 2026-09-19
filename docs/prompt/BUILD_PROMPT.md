# BUILD PROMPT — Exodus

**An open-source migration intelligence workspace: a WebGL globe over the whole world's bilateral migration system, a service-capacity calculator, and a placement optimiser that helps people land somewhere they can actually live.**

---

## §0. How to use this document

You are an autonomous coding agent. This document is your entire brief — there is no follow-up conversation, no one to ask. It was produced by fourteen research agents with live web access, each adversarially fact-checked against primary sources, then three competing designs scored by a judge panel, then eleven section writers, then four critics. Endpoints were probed, licences were read, package versions were resolved against the registry, and published coefficients were checked against the papers they came from.

**Read §0, §1, §2 and §11 before you write any code.** Then work the milestones in §11 in order.

### §0.1 Precedence

When two parts of this document disagree — and they do, because it was written in parallel — resolve in this order:

1. **§0.3 (scope decisions)** — the product owner's explicit calls. These override everything.
2. **§0.4 (binding errata)** — corrections found by the critics after the sections were written.
3. **`docs/review/*.md`** — the four full critic reports. Every finding in them is binding unless §0.3 or §0.4 overrides it. **Work the contradiction and blocker lists at M0, before you write a connector**, because most of them name a type you are about to implement three incompatible times.
4. The numbered sections, §1 through §12.
5. `docs/design/04-FINAL-mvp-design.md`.

If something is still ambiguous after all five, choose the option that renders fewer numbers with more provenance, record the choice in `DECISIONS.md`, and keep moving. **Never stall waiting for a clarification that cannot come.**

### §0.2 What this product is

A globe that flipbooks the entire world's bilateral migration system, one year per frame, 1990→2023, at 60fps, offline — and that shows, on the same arc, how much the best available evidence disagrees with itself.

That last clause is the product. Every existing migration globe renders one number per arc, which is a lie: no bilateral migration figure on Earth is *observed*: it is modelled, and two competent models of the same corridor disagree by tens of percent. This one renders the disagreement as a visual property of the arc, dims the corridors of states with no statistical office so they cannot borrow the authority of German register data, and renders `—` where the world has no data.

On top of that sits the part that helps people directly: a **placement optimiser** (§12) that takes families who already hold a legal basis to be admitted and finds them localities where they can work, be understood, reach a relative, and get the schooling and healthcare they need.

### §0.3 Scope decisions — made by the product owner, not negotiable

Three capabilities in the original brief were assessed by the design process and explicitly ruled on. **These decisions override every section of this document, including any section that argues the opposite.**

| Capability | Decision | Consequence |
|---|---|---|
| **Smart distribution of migrants** | **BUILD IT.** §12. | The design put this at the top of its OUT list, arguing a placement optimiser can function as a migration-control targeting tool. That call is **overridden**: the purpose is to help migrants. The objection was right about the *mechanism* of harm, so §12 makes the harm architecturally unrepresentable rather than merely discouraged. |
| **Live / real-time layer** | **CUT.** | v1 is a **static site**. No SSE server, no poll schedulers, no degradation state machine. §8's latency taxonomy still ships in full, because the incident ribbon renders from the committed corpus and needs it. The live sidecar is **not rescheduled** — M9 now belongs to §12. |
| **Cross-country / cross-region simulations** | **CUT.** | No Scenario Studio, no Compare view, no Brief export. Returns in v2, one route at a time, each earning its place. |

**Blocker #1 in `docs/review/buildability.md` must be resolved the opposite way from what that report recommends.** The critic reviewed an assembly in which §12 was missing, and correctly concluded that §7 and §9's references to `apps/placement`, `packages/placement`, `highs`, `/solve → /placement`, `GOVERNANCE.md`, `compliance/ai-act/*` and three additional `RefusalCode`s were dangling. **They are not dangling — §12 exists, and it is in scope.** Therefore:

- **Keep** every §12 reference in §7 and §9.
- **Delete instead** the prohibitions that contradict it: §1.8 N1, §2.8 D-45, §5.10's refusal, and §10.6's ban on solver code. The allocation solver moves **out** of the `NON_GOALS` array and **into** the model cards.
- `/solve` redirects to `/placement`, not to `/methods#allocation`.
- `REFUSAL_CODES` has **eight** members, not five. It is closed at eight.
- `NON_GOALS.length` is **17**, not 18. Fix the test in §1.6 that asserts 18.
- `/methods` must still carry an allocation section — but it now explains the guardrails the module ships with and what it still refuses to do, rather than explaining why it was not built.

### §0.4 Binding errata

The four critics found real defects after the sections were written. These corrections are binding. The full reports are in `docs/review/` and every finding in them applies; these are the ones that will cost you the most if you miss them.

#### Factual corrections — you would otherwise ship false statements

1. **The `/methods` headline sentence inverts the paper it cites.** The mandated copy — *"roughly half the achievable accuracy in this field lives in getting origin outflow totals right"* — asserts the reverse of Robinson & Dilkina's finding. Their ML models **without** a production function **outperform** the same models with one, in 5 of 6 metrics; the production function is a crude constant-share-of-population estimate that *constrains and degrades* the model. Accuracy is not where the sentence says it lives; it is where it is **lost**. Replace with: *"A model handed a crude origin-outflow production function scores roughly half what the same model scores when it predicts flows directly — which tells you how much of a published CPC is an artefact of the constraint, not of the model."* Delete the trailing "which is why we do not ship a fitted flow model" clause; it follows from neither reading.

2. **The six CPC scoreboard digits are unsourced.** 0.16 / 0.16 / 0.21 / 0.22 / 0.43 / 0.40 could not be read from the paper — the render truncates the table cells. This document's own rule forbids publishing a number it cannot support. **At M0, read Tables 2–3 of `doi:10.1145/3209811.3209868`, commit them as `packages/kernel/golden/cpc-reference.json` with the table, row and column each digit came from, and render the scoreboard from that fixture. Until it exists, render `—`.** Only the two ML rows have a without-production-function column; gravity and radiation cannot, because the production function is what defines them.

3. **Abel & Cohen is misattributed.** figshare 14579241 is *"Bilateral international migration flow estimates by sex and type of move"*, file `bilat_mig_sex_type.csv`, sole listed author **Guy Abel**. Name the file in `plan()`, cite the deposit as Abel (figshare 14579241) and the *method* as Abel & Cohen, keeping them as two distinct strings. Verify the "v6" label against the figshare version history at M0.

4. **`erasableSyntaxOnly` does not raise TS1294 on every `namespace`.** It fires on constructs with runtime emit. Type-only and `declare` namespaces compile fine. Keep the ban as a style rule if you like, but do not claim empirical confirmation for compiler behaviour that does not exist.

#### API and code defects — these will not compile or will silently do nothing

5. **`FillStyleExtension({pattern: true})` renders no pattern.** The flag is `proceduralPattern: true`, which enables `pattern` and causes `fillPatternAtlas` to be ignored, and it still needs `fillPatternMapping` (pattern configs, not atlas coordinates) plus `getFillPattern`. The pre-decided PNG-atlas fallback is the *worse* of the two paths — demote it.
6. **`TimelineWidget` is exported as `_TimelineWidget`.** A plain named import does not resolve. Its experimental status strengthens the decision to hand-roll the track.
7. **`contiguousF32` does not compile under `noUncheckedIndexedAccess`.** Use `out.set(values.subarray(off, off + len), o)` — also ~50× faster. **Treat every code sample in this document as pseudocode; none is compile-checked.**
8. **Zod 3 syntax against a Zod 4 pin.** `z.string().url()` → `z.url()`, `z.string().datetime()` → `z.iso.datetime()`.
9. **POADR uses the wrong life-table denominator.** `e(a) = T(a)/l(a)`, where `T(a) = Σ_{x≥a} L(x)` and `l(a)` is survivors at exact age `a` — not `/L(a)`. The bias is material at 65+ and silently shifts every POADR figure. **`wpp_life.parquet` must therefore also ship `lx`**, which the current column list omits, so the correct formula is not even computable from the specified table.
10. **`rankFlipTarget` is off by one rank** — the comparator is the **smallest** `H_j` for `j ≠ k`, not the second-smallest.
11. **`headroomPersons` carries persons *per year*.** Rename to `headroomPersonsPerYear` and set the unit to `'persons_per_year'`.

#### Product-logic defects

12. **K-anonymity suppression would gut the globe.** K=25 applied to `flows.parquet` suppresses a large fraction of 408k corridor-years of *neural-network estimates* — epistemically meaningless, since nobody can be re-identified from a model output. **Suppression applies only to rows with `estimate_kind ∈ {observed, observed_flagged}`. Modelled rows are exempt**, and that exemption is rendered on `/methods#suppression` as a sentence.
13. **The CPC hold-out year contradicts itself** — fixed at 2010 in one place, shown as 2022 in a mock, which is inside the selection window and is leakage by this document's own definition. **2010 everywhere.**
14. **`pnpm i` cannot run with networking disabled.** State the claim precisely everywhere, including the README hero: *install once with the network; everything after install — `dev`, `build`, every test, every route — runs with networking disabled at the container level.*

#### Duplicate type definitions — resolve these at M0, before any connector

`Fact` is defined **three times, mutually incompatibly**, all in `packages/contracts`, and two of them directly contradict on whether a missing value is `null` or an absent row. `Provenance`, `UNITS`, `ESTIMATE_KINDS`, `LATENCY_CLASSES`, `PERIOD_TYPES` and `LayerSpec` each have 2–3 conflicting declarations. `DataSource.transform()` is the seam every connector crosses, so this blocks everything.

**Resolution:** §4.7's `Fact` is canonical — nested `Provenance`, `value` never null, a missing value is an **absent row**. Delete the `Fact` blocks in §3.8 and §9.4.1. One file, `contracts/src/primitives.ts`, owns every closed set exactly once; §4.6's unit spellings win. `licenseIds` is an **array**, never a `' AND '`-joined string. For `LayerSpec`, merge §9.4.6's geometry payload with §6.6's `never` keys; dash is platform-owned, like opacity.

See `docs/review/contradictions.md` for the other ~30, including three snapshot file layouts, three default cameras, two corridor encodings, and three paths for one perf harness.

#### Budget discipline

15. **~150 individually-blocking acceptance checks is a budget blower.** Designate a **core set of ~25** that prove the thesis as blocking; mark the rest `blocking: false` with a one-line `BACKLOG.md` entry each. State plainly: *a non-blocking check that has not been written is recorded in `BACKLOG.md`, not faked.*
16. **Pixel-sampling tests are the flakiest, most expensive part of the suite.** Move the luminance, hue and contrast assertions to unit tests over the token and palette modules — compute contrast from the hex values, assert the alpha *inputs* differ, rather than sampling rendered pixels. Keep exactly one render-based test, the hatch, because it genuinely cannot be checked another way.
17. **Every version is an exact pin with no fallback, and install is the first thing that happens.** Add a blanket rule: *if an exact pin does not resolve, take the highest published version sharing the same major (same minor for `deck.gl`/`@luma.gl`/`@loaders.gl`, which peer-range in lockstep), record it in `DECISIONS.md` with the registry error, and continue.* Add a preflight that `npm view`s every pin before M0 command 1.
18. **M0 as written cannot run** — it requires byte measurements and real feature counts from connectors that are M1 deliverables. Rewrite M0.3 as explicitly synthetic: the full r3 cell set comes from `h3-js` (`getRes0Cells()` → `cellToChildren(c, 3)` = exactly 41,162) and needs no data at all.

### §0.5 Verified — the ledger is binding

These were probed against primary sources and independently re-checked. The full evidence is
in **`docs/verification/M0-LEDGER.md`, which overrides any figure stated elsewhere in this
document.** Do not re-derive these; do not restore the originals.

**Refuted — these would have shipped as false. Never render them:**

1. **The intraregional share is 45%, not 53%.** UN DESA IMS 2024: *45% of international
   migrants were living in their region of origin in 2024* — Europe 74%, Oceania 73%,
   sub-Saharan Africa 64% (not 83/73/63). Also say **"living in"**, not "moved within": the
   figure is a stock, and "moved" turns it into a flow claim the source does not make.
2. **UNHCR does use a bare asterisk in numeric cells, and it does not mean 1–4.** The
   Global Trends statelessness annex carries 84 cells whose entire value is `*`, meaning
   *"information exists but no reliable data"*. A dash means zero, not available, or not
   applicable. **Write the parsing.** Treating `*` as a number, or as 1–4, silently
   fabricates data for exactly the populations least able to contest it.

**Corrected — the substance holds, the specifics were wrong:**

3. **There is no Table 8 in ESA/P/WP.160, and the Korea figure is not 5,149,000,000.** The
   report's tables are Table 1, I.1–I.2, III.1, IV.1–IV.22 and A.1–A.20. Cite **Table 1
   (report p. 2), Republic of Korea, scenario V, 2000–2050: 5,128,147 thousand**, or
   Table IV.4 for the 1995–2050 window: 5,148,928 thousand. Note the unit is **thousands**.
   This was the most prominent number in the product and every part of its citation was wrong.
4. **WPP:** the postponement is real and sourced (E/CN.9/2026/CRP.1, 26 March 2026: *"the
   release of the World Population Prospects has been postponed from 2026 to 2027"*), but the
   delayed edition is the **2027 revision**, not "the 2026 revision". Latest published: WPP 2024.
5. **GHS-POP 323,340,844 bytes is right only for a fully pinned product**: GHS-POP R2023A,
   **epoch 2025, Mollweide, 1 km**. Never call it "the GHS-POP R2023A global archive" — that
   name covers many files of different sizes and the assertion will fail against the wrong one.
6. **JRC Atlas: "198 countries and territories"**, never "198 countries". The digits are
   right; the noun is the JRC's own and the distinction is politically load-bearing.
7. **`visgl:webgl-only` is published by deck.gl only** — `@deck.gl/core`, `layers`,
   `aggregation-layers`, `geo-layers`, `mesh-layers` at 9.4.0. **luma.gl does not publish it.**

**Confirmed verbatim — ship as written:**

8. Gaskin & Abel **73%** — a Pearson R on held-out test flows (94% on training), fivefold
   cross-validated. Render it as a test-set correlation, not as accuracy.
9. UN DESA IMS XLSX **6,005,287 bytes**, and the 403-vs-200 user-agent gate is real (a
   CloudFront edge block, so the connector must send a browser user-agent).
10. **CEPII Gravity 202211 is Etalab 2.0**, stated on the dataset landing page.
11. **GDELT GEO 2.0 returns HTTP 404** on its own documented example, while sibling APIs on
    the same host answer normally. The trap copy is accurate.

Still outstanding at the time of writing, and still governed by §0.6 until the ledger says
otherwise: the Sanderson–Scherbov Germany figures, and the six CPC scoreboard digits.

### §0.6 The rule that outranks every other rule

**Never publish a number this document does not support.** If you need a figure and cannot trace it to a committed fixture, a probed endpoint or a cited table, render `—` and a refusal. A dashboard that admits what it does not know is the entire product thesis; a dashboard that quietly fills a gap with a plausible number is the thing this project exists to argue against.

---


---

## 1. Mission, product thesis and non-goals

### 1.1 Who you are and what you are building

You are an autonomous coding agent with one sustained effort and no follow-up conversation. Nobody will answer a question you ask. Every fork in the road that matters has already been decided in this document; where a decision is pre-made, apply it and record it in `DECISIONS.md`. Where reality contradicts the document — a DOI that does not resolve, a schema that does not match, a frame budget that does not hold — apply the named fallback, record the failure with its date and HTTP status, and keep building. **Stalling is the only failure mode with no recovery path.**

You are building **Exodus**: an offline-first, statically-hosted globe that flipbooks the entire world's bilateral migration system, one year per frame, 1990→2023, at 60fps — and that renders, on the same arc, how much the best available evidence disagrees with itself.

It is a monorepo (pnpm + Turborepo), a Vite React SPA, a deck.gl `_GlobeView`, a committed ≤40 MiB Parquet bundle, five pure kernel models, three plugin contracts, and one policy package with one linter binary. `git clone && pnpm i && pnpm dev` renders the whole world **with the network cable out**. There is no server, no account, no API key, and no runtime fetch in v1.

### 1.2 The thesis, in one sentence

> **A globe that flipbooks the entire world's bilateral migration system, one year per frame, 1990→2023, at 60fps, offline — and that shows, on the same arc, how much the best available evidence disagrees with itself.**

The spectacle and the epistemics are the same object. This is the whole product and it is the thing you must not compromise.

Every existing migration globe renders one number per arc, which is a lie, because **no bilateral migration number on earth is observed** — it is modelled, and two competent models of the same corridor disagree by tens of percent. Exodus renders that disagreement as a visual property of the arc (dash density), dims the corridors of states with no functioning statistical office so they cannot borrow the authority of German register data (arc opacity), and renders `—` with a reason where the world has no data. It is the first migration tool whose most striking image is an argument about what is not known.

Three sentences you will be tempted to soften. Do not:

1. **Model disagreement is not uncertainty.** Both models are fitted to the same underlying stock tables, so their agreement is correlated and the band is a *lower bound* on true uncertainty. The words "confidence interval" and "uncertainty band" are banned adjacent to this figure, in copy, in identifiers, in tooltips, in commit messages.
2. **The stepping is the product.** 34 discrete annual frames, zero interpolation, no `transitions` on any data accessor. Easing implies a temporal resolution the data does not have.
3. **Refusal is a rendered surface.** A missing value is `—` with a badge or a typed `Refusal` rendered as a sentence. Never `0`, never a forward-fill, never a silent interpolation.

### 1.3 The one sentence, twice — ship both verbatim

Both strings are product copy. The first is the `/methods` opening line and the About panel; the second is the README hero paragraph and the repository description. Neither may be paraphrased.

**To a minister:**
> "For every country on earth and every year since 1990, Exodus shows you how many people moved where — and, on the same screen, exactly how much the best available evidence disagrees with itself, so you can see which of these numbers you are allowed to act on."

**To a hacker:**
> "A deck.gl globe that flipbooks 34 years of the global bilateral migration matrix at 60fps off a 40 MiB committed Parquet bundle with the network disabled, where arc dash density is cross-model disagreement, arc opacity is per-country data coverage, and a CI-enforced AST rule means no number can render outside `<Figure>`."

### 1.4 Audience — five readers, five entry points, five proof obligations

Build for all five. Each one arrives at a different route and each one must be convinced by a different property. If you have to choose whose experience to protect under time pressure, protect them in this order.

| # | Reader | Arrives at | The question they open with | What must convince them (your proof obligation) |
|---|---|---|---|---|
| 1 | **Ministry / NSO analyst** | `/place/:iso3`, then `/headroom/:iso3` | *"Can I put this number in a submission without being embarrassed?"* | Every figure carries source, vintage, latency days, `estimate_kind` and licence, one click away. Headroom names its **binding indicator** and refuses below three indicators. Negative headroom renders as a service deficit, not a bug. |
| 2 | **UN / NGO planner** | `/place/:iso3`, then `/sources` | *"Which of my planning inputs is six years stale, and where is the coverage hole?"* | The global AS-OF chip shows the **oldest** contributing vintage. `/sources` lists cadence, measured bundle size, licence and *known traps* per source, plus the three exclusion rows by name. |
| 3 | **Researcher** | `/corridor/:orig-:dest`, then `/methods` | *"What exactly is the estimand, and what is your accuracy ceiling?"* | `/methods` opens with the CPC scoreboard (0.16 / 0.16 / 0.21 / 0.22 with a production function; 0.43 / 0.40 without). The drawer shows two model estimates on the shared period grid, their disagreement, the model-internal spread as a separately named channel, and — for EU pairs — two national statistical offices disagreeing with each other. |
| 4 | **Journalist** | `/` , then a screenshot | *"Is there a picture here, and can I caption it without lying?"* | The flipbook, the hatch that steps at period boundaries, the faint Gulf corridors. Every export-grade claim is available as copy on `/methods` and `/sources`. `Shift+G` gives the top-25 table for anyone who cannot read a globe. |
| 5 | **Civic hacker** | `README`, then `pnpm gen:connector` | *"How long until I have my own source on this globe?"* | Three contracts, not seven. `pnpm gen:connector <id> && pnpm ingest --only <id> && pnpm snapshot:build` with **zero diffs outside `packages/connectors/<id>/` and `snapshot/`** — asserted in CI, not claimed in a README. |

Nothing in this product is person-shaped. The `Cmd+K` palette indexes actions, datasets, countries and corridors — and **no person-shaped type exists in the schema at all**. That is a build-time CI check, not an aspiration.

### 1.5 Positioning — what exists, and what you are doing differently

All rows below are verified prior art as of 2026-09-18. Use them to calibrate; do not vendor, fork or fetch any of them at runtime.

| Prior art | What it does well | Why it is not this | What Exodus does instead |
|---|---|---|---|
| **IOM Migration Data Portal** | Best per-indicator metadata in the field | **No API at all; returns HTTP 403 to scripted clients.** SaaS, read-only | Provenance popover on every `<Figure>`, from a committed bundle, offline |
| **UNHCR Refugee Data Finder** | The most reliable open bilateral forced-displacement API, series from 1951 | Annual; forced displacement only; **licence contradictory across two verification passes → [UNVERIFIED]** | Ships as a **recipe connector** — code, never bytes. See §1.8 non-goal N10 |
| **JRC Atlas of Migration (2025 ed., 198 countries)** | Harmonised, policy-grade, "Stories" format | Read-only output of someone else's assumptions; EU-framed; report-like | Editable assumption sets on `/headroom`, encoded into a permalink |
| **Frontex Migratory Map** | Fastest official European monthly series | **Counts detections, not persons**; enforcement framing; 403 to scripts | Not ingested. Cited on `/methods` as the canonical broken-denominator example |
| **DRC Foresight** | The only operational displacement forecast; publishes a model card | 27 countries, PDF-only, origin-side only | **No forecasting of departures at all** (N12). The model card discipline is copied wholesale |
| **kepler.gl** | Free GPU layers, config-as-JSON | A generic viewer with no domain model; peer-depends `styled-components ^6.1.0`, which collides with this stack | Config-as-URL survives: `base64url(deflate-raw(json))` permalinks. kepler itself is a non-goal (N13) |
| **Dark-globe demos / "OSIRIS"-style dashboards** | The dense dark aesthetic | They animate particles: motion implying a resolution nobody has. Several are zero-star forks — **do not vendor any of them** | The only thing that animates is the time cursor, under the user's hand, in discrete annual steps |

The five-part wedge, stated so you can check your own work against it:

1. **Nobody renders the disagreement.** One number per arc is the field's default and it is dishonest.
2. **Nobody dims what nobody counted.** Coverage asymmetry is computed in `semantic` and a layer author *cannot* override it.
3. **Nobody is genuinely offline.** Four incumbents 403 scripted clients; two need tokens. `--network=none` is the acceptance criterion, not the aspiration.
4. **Nobody treats the connector layer as the product.** Four independently verified upstream breakages in a single probing session is the evidence.
5. **Nobody renders their own absence.** `/methods` is the loudest screen: the field's honest accuracy ceiling first, the refusals after.

### 1.6 The name: Exodus — and the rename you perform first

**Decision (already made, do not relitigate): the product, the repository, the npm scope and every identifier are `Exodus` / `corridor` / `@exodus`. `EXODUS` is retired.**

Rationale, in one line: *"Exodus" is mass-flight-under-duress imagery, squarely inside the war/pressure family of the seven dehumanising source concepts (animal, vermin, parasite, physical pressure, water, commodity, war; Mendelsohn & Budak, arXiv:2502.13246, ACL 2025) on which this project's own lexicon lint is structured. A product name that fails your own CI gate is the first credibility hole a critic finds.* "Corridor" is the field's neutral technical term for an origin–destination pair, it is the product's core geometry, and it survives every rule in `@exodus/policy`.

**The checkout you have been handed is named `exodus`.** Your first commit performs the rename:

| Step | Action | Verification |
|---|---|---|
| 1 | Rename the checkout directory to `corridor`; update the git remote URL if one is configured | `basename $(git rev-parse --show-toplevel) === 'corridor'` |
| 2 | Workspace root `package.json` → `"name": "corridor"`; every package → `@exodus/<pkg>` | `pnpm check:policy` lexicon module walks package names |
| 3 | Environment variables: `EXODUS_MODE`, `EXODUS_CLOCK`. No `EXODUS_*` anywhere | grep gate in the lexicon module |
| 4 | Keep `docs/research/**` exactly as committed — it is the research corpus, not build output, and it is the only place the retired name may legitimately appear as history | Excluded by path from the lexicon walk, with the exclusion itself unit-tested |
| 5 | Delete the untracked root probe artifacts. `jv.json` is a Eurostat `jvs_q_isco_r2` vacancy probe and vacancies are a non-goal (N9) — delete it. `est.json` is a `migr_asyappctzm` JSON-stat probe; either move it to `packages/connectors/eurostat-asylum/fixtures/` after asserting its dataset code, or delete it. Neither may sit at the repo root | `git status --short` is clean after M0 |
| 6 | If the hosting platform's repository name cannot be changed from inside this build, record it in `DECISIONS.md` as the single outstanding rename, with the reason | `DECISIONS.md` entry exists; all agent-controlled names are already `corridor` |

Write the identity once, in the policy package, and derive everything else from it. This is a contract, not a constant file:

```ts
// packages/policy/src/identity.ts
// Apache-2.0 boundary does not apply here: @exodus/policy is AGPL-3.0-or-later.
// TypeScript 7 with `erasableSyntaxOnly`: no `enum`, no `namespace` (TS1294).

export type Route =
  | '/'
  | '/place/:iso3'
  | '/corridor/:orig-:dest'
  | '/headroom/:iso3'
  | '/sources'
  | '/methods';

export const PRODUCT = {
  name: 'Exodus',
  slug: 'corridor',
  npmScope: '@exodus',
  repoBasename: 'corridor',
  envPrefix: 'EXODUS_',
  tagline:
    'The whole world’s migration system, one year per frame — and how much the evidence disagrees with itself.',
  /** Names retired by decision register #1. Legal ONLY in this file, DECISIONS.md and docs/research/**. */
  retiredNames: ['EXODUS', 'exodus'] as const,
} as const;

export type AudienceId =
  | 'ministry-analyst'
  | 'un-ngo-planner'
  | 'researcher'
  | 'journalist'
  | 'civic-hacker';

export interface AudienceSpec {
  readonly id: AudienceId;
  readonly label: string;
  readonly entryRoute: Route;
  /** Rendered on /methods as the "who this is for" block. */
  readonly primaryQuestion: string;
  /** The build obligation this reader's trust depends on. Bound to a test id. */
  readonly proofObligation: string;
  readonly testId: string;
}

export type NonGoalReturn =
  | 'never'
  | 'v2'
  | 'm9-optional'
  | 'on-written-licence'
  | 'when-the-data-exists';

export type NonGoalId =
  | 'allocation-solver'
  | 'fitted-econometrics'
  | 'placeholder-coefficients'
  | 'live-server'
  | 'adm1-and-pmtiles'
  | 'flat-mercator'
  | 'extra-routes'
  | 'live-projection-engine'
  | 'occupational-dimension'
  | 'undesa-bytes'
  | 'unhcr-bytes'
  | 'blocked-licence-sources'
  | 'heavy-render-deps'
  | 'post-fx-bloom'
  | 'accounts-and-extras'
  | 'departure-forecasting'
  | 'person-shaped-types'
  | 'route-geometry';

export interface NonGoal {
  readonly id: NonGoalId;
  readonly title: string;
  /** One sentence. Rendered verbatim on /methods#refusals. */
  readonly why: string;
  readonly returns: NonGoalReturn;
  /** Anchor on /methods. Every non-goal is addressable by URL. */
  readonly anchor: `#${string}`;
  /** Identifiers whose presence in source proves the non-goal was violated. */
  readonly bannedIdentifiers: readonly string[];
}

export const NON_GOALS: readonly NonGoal[] = [
  {
    id: 'allocation-solver',
    title: 'The allocation MILP and any placement shortlist',
    why: 'Its output is a ranked placement shortlist over destinations for people; on a targeting-tool axis, absence beats mitigation.',
    returns: 'never',
    anchor: '#allocation',
    bannedIdentifiers: ['highs', 'lp-model', 'glpk', 'solvePlacement', 'commitPlacement'],
  },
  // ...one entry per N1–N18 in §1.8. The list is the source of truth for /methods.
];

export const isRetiredName = (s: string): boolean =>
  PRODUCT.retiredNames.some((n) => s.toLowerCase().includes(n.toLowerCase()));
```

*Acceptance:* `/methods#refusals` renders every entry of `NON_GOALS` in array order, allocation solver first; a test asserts `NON_GOALS.length === 18` and that every `anchor` resolves to a rendered heading; the policy linter's banned-identifier rule is seeded from `NON_GOALS[].bannedIdentifiers` and exits non-zero on a planted violation; `isRetiredName` is applied to the workspace root package name, every package name, every route path and every asset filename.

### 1.7 Tagline and README hero copy

**Tagline (one line, canonical, used in `README.md`, the root `package.json` `description`, the repository description and `<meta name="description">`):**

> The whole world's migration system, one year per frame — and how much the evidence disagrees with itself.

Write `README.md` at M0 with exactly this hero, then extend it below the fold as the build progresses. Do not decorate it with badges that do not resolve offline.

```markdown
# Exodus

**The whole world's migration system, one year per frame — and how much the evidence
disagrees with itself.**

A deck.gl globe that flipbooks 34 years of the global bilateral migration matrix at 60fps
off a 40 MiB committed Parquet bundle with the network disabled, where arc dash density is
cross-model disagreement, arc opacity is per-country data coverage, and a CI-enforced AST
rule means no number can render outside `<Figure>`.

```sh
git clone <this repo> && cd corridor
pnpm install
pnpm dev          # then pull the network cable. It still works.
```

No account. No API key. No server. No runtime fetch.

### Why it looks like this

No bilateral migration number on earth is observed — every one of them is modelled, and two
competent models of the same corridor disagree by tens of percent. A globe that renders one
number per arc is lying. So:

- **Dashes mean doubt.** Arc dash density is the disagreement between two independent
  published models, held constant within each five-year period, so the hatch visibly steps
  at period boundaries. This is *model disagreement*, not uncertainty: both models are
  fitted to the same underlying stock tables, so it is a lower bound.
- **Dimness means nobody counted.** Arc opacity is a per-country data-coverage score
  computed by the platform. A layer author cannot override it. Corridors served by no
  functioning statistical office are literally faint.
- **Warm hue never means people.** Red, orange and yellow are reserved for service and
  rights deficits.
- **`—` means we do not know.** Never `0`, never an interpolation. Where a model cannot
  answer it returns a typed refusal that renders as a sentence.

### The two screens that make the argument

- **`/methods`** — the accuracy ceiling of this entire field, then the model cards, then
  every capability this project refused to build and why.
- **`/sources`** — the licence, cadence and *known-traps* ledger, with the exact URLs each
  connector would fetch, and three sources excluded by name.

### What this is not

Not a decision system. There is no departure forecast, no origin-side pressure index, and no
person-shaped type anywhere in **the core packages or the six core routes**.

> **Amended by §0.3.** The allocation solver and its placement shortlist *are* built, as §12,
> in a separate workspace package with its own schema, route tree and auth scope, excluded
> from the public build. Person-shaped types exist there and only there. The paragraph below
> describes the core product, which is unchanged: it still contains none of this.
`/solve` redirects to `/methods#allocation`, where the thing we did not build is described
in full. See [ETHICS.md](./ETHICS.md).

### Licence

Code is **AGPL-3.0-or-later**, except `packages/contracts` and the connector template, which
are **Apache-2.0** so implementers get the patent grant. AGPL §13's offer of Corresponding
Source runs to *all* users interacting with a modified version over a network, including
internal ones — there is no "public" qualifier, and we are not going to pretend otherwise.

We considered a use-restricted licence and did not ship one: Open Source Definition clauses
5 and 6 forbid discrimination against persons, groups and fields of endeavour, so a use
restriction would forfeit the open-source designation. We publish a separate Acceptable Use
Policy instead, and we say the trade-off out loud rather than hiding it.

Data is per-source. Every committed file is declared in `REUSE.toml`; every fact row carries
`license_id` and `redistributable` as mandatory columns, and `pnpm bundle:verify` refuses a
non-redistributable row by name.

### If this harms someone

Open a [harm report](./.github/ISSUE_TEMPLATE/harm-report.yml). We answer within 30 days, we
can de-publish a layer, and every de-publication is logged in public.
```

### 1.8 NON-GOALS — what you will not build, and what happens if you try

This list is binding and it is rendered in the product. Every entry has a `NonGoalId`, an anchor on `/methods#refusals`, and a set of banned identifiers the policy linter enforces. **Building any of these is a scope breach even if it is easy, even if a research document describes it in full, and even if the description in this prompt is detailed enough to implement from.** For the allocation solver in particular: *the description is the deliverable.*

| # | Non-goal | Why | Returns |
|---|---|---|---|
| **N1** | **Allocation MILP, placement shortlist, `solve()` stub, `highs`/`lp-model`/`glpk` import** | It is the one capability in the source designs that functions as a migration-control targeting tool. Absence beats mitigation; per-term decomposition of an invented weight vector is fake precision in its purest form | **Never in-box.** The `Model` contract is the seam: a third party can implement one against the public SDK and inherit every policy rule |
| **N2** | **Any fitted econometrics — PPML, nested logit, gravity coefficients, IRLS with clustered SEs** | Research results, not build steps; either can swallow the entire budget | v2, as a `Model` plugin, only after `pnpm fit` runs offline and coefficients are committed with diagnostics |
| **N3** | **Any placeholder coefficient** — `β_dist`, `β_comlang`, `β_contig`, Ortega & Peri, diaspora or visa elasticities, the migration hump, at any magnitude, behind any badge | A placeholder coefficient in a dark dashboard becomes a cited coefficient within a week | Only attributed, only fitted, never badged |
| **N4** | **SSE server, poll schedulers, backoff, degradation state machine, live layer** | An SPA plus a server plus schedulers plus a state machine is a second project nobody budgeted. **v1 is a static site**; its degradation ladder has two states, `SNAPSHOT` and `UNAVAILABLE` | M9, explicitly optional and flagged, as a ~150-line `pnpm live` sidecar. If M9 never lands the product is complete |
| **N5** | **ADM1 polygons, PMTiles, MapLibre, `@deck.gl/maplibre`, any basemap** | Every fact in v1 is ADM0-resolved; subnational polygons would imply a resolution the data does not have — the product's own rule | When a v2 source is genuinely ADM1-resolved |
| **N6** | **FLAT / Web Mercator mode** | Per-capita people density must never render on Mercator, and with no basemap there is no zoom-12 use case. Also deletes the documented GlobeView↔MapView switching bug | Only if an Equal Earth path exists |
| **N7** | **`/plugins`, `/compare`, `/brief`, `/graph`, `/studio`, ontology-generated `/o/{type}/{id}`** | Six routes exist. The globe *is* the corridor graph, and a page generator is the most reliable way to turn a day of screens into a week of debugging a generator | v2, one at a time, each earning its route |
| **N8** | **Live cohort-component projection engine** | Reproducing WPP medium to 0.5% at 2050 from raw `L(a)`/ASFR/SRB is a research result. WPP differentials ship as **precomputed columns** | v2, as a kernel model with WPP golden vectors |
| **N9** | **Occupational and vacancy dimension** | ILOSTAT gives ISCO 1-digit crossed with birth status; vacancies cover ~37 reporters. A global occupational layer would be fabrication for 150 countries | When the data exists |
| **N10** | **UN DESA IMS as shipped bytes** | Non-commercial, no derivative works — it cannot sit in a redistributable bundle | Never as bytes. Ships now as a recipe connector |
| **N11** | **UNHCR in the committed bundle** | Licence **[UNVERIFIED]** — contradictory across two verification passes. **Do not attempt to resolve this by reading the terms page; it is resolvable only by written reply from `webportal@unhcr.org`, which will not arrive during this build. Treat it as a permanent v1 non-goal and say so on `/sources`.** | On written resolution. Recipe connector until then |
| **N12** | **ACLED, EM-DAT, IDMC/IDU, GADM, MIPEX, ReliefWeb, DTM, VIEWS, UNESCO UIS, gbOpen bulk** | Each blocked on independent licence grounds. UNESCO's CC BY-SA and IDMC's CC BY-NC-SA are contamination vectors for the entire data component — one file relicenses the bundle | Individually, on written terms |
| **N13** | **`@geoarrow/deck.gl-geoarrow`, kepler.gl, TerrainLayer, Tile3DLayer, MaskExtension, HeatmapLayer, ContourLayer, DuckDB-WASM, Git LFS** | geoarrow's devDeps pin two minors behind and it ships no GeoJson/Icon layer; kepler collides on styled-components 6; the rest are unsupported on globe or unnecessary at 40 MiB. Git LFS bills the parent repo's bandwidth for every fork until `git clone` breaks for everyone | Not planned. Git LFS: never, for anything, for any reason |
| **N14** | **Bloom and all post-FX except FXAA and a subtle vignette** | Bloom's only subject was the live incident layer, which is now corpus replay and must not look live | With M9 |
| **N15** | **Accounts, RBAC, WebSockets, remittance/trade/climate layers, 3D columns, agent-based simulation, mobile, any LLM that states figures** | Noise, or actively harmful | Not planned |
| **N16** | **Departure forecasting, outflow-risk scores, origin-side "pressure index", any composite with author-invented weights, any cohort scoring** | Forecast targets are restricted to arrivals and needs at destination. Group-level scoring is barred by ECHR Protocol 4 Art. 4 and Charter Art. 19(1) | Never |
| **N17** | **Any person-shaped type** — `person`, `individual`, `case_id`, `applicant`, `biometric`, `name`, `dob` in any schema; anything person-shaped in global search; any EU AI Act Annex III(7) function | Structural, not stylistic: the schema cannot express the harm | Never |
| **N18** | **Route geometry** — waypoints, crossing points, bathymetry, vessel or aircraft telemetry, any movement `LineString` with more than two vertices, any Missing Migrants coordinate, any H3 people layer finer than r3, any nationality cross-tab below ADM0 | Four geometry rules, each with a test. Corridors are two-vertex great circles between ADM0 centroids and nothing else | Never |

Two further prohibitions that are not features but are the likeliest way you will damage the product without noticing:

- **Do not write design documents, status reports, progress summaries or analysis markdown.** `DECISIONS.md`, `SNAPSHOT.md`, `PARAMETERS.md`, `BACKLOG.md`, `README.md`, `ETHICS.md` and `REUSE.toml` are the only documents in this build. Everything else that needs saying goes on `/methods` or `/sources`, where users can read it.
- **Do not publish a number this prompt does not support.** Specifically: the "80% of the world's land area" figure was never computed and must never appear; no indicator count for the JRC Atlas may be quoted (**[UNVERIFIED]**); UNHCR's 2026 portal launch is *our inference* as an endpoint-stability risk, not UNHCR's statement, and must be labelled as our inference wherever it appears on `/sources`. If you need a number and cannot trace it to this prompt, render `—` and a refusal instead.

### 1.9 The standard of craft

This product is judged on whether a stranger, offline, on integrated graphics, is convinced in sixty seconds. Hold yourself to these:

| Dimension | The bar | How it is checked |
|---|---|---|
| **Runs** | `git clone && pnpm i && pnpm dev` with `--network=none` renders the whole product | Playwright in CI with networking disabled at the container level |
| **Fast** | ≥55fps median over a 10s scripted orbit and over a full 1990→2023 scrub, no frame >50ms, zero network requests | Committed Playwright + SwiftShader harness, from M0 |
| **Small** | Committed bundle ≤40 MiB | `pnpm snapshot:measure` prints per-table compressed bytes and **fails CI** above the cap; the cut ladder is pre-decided, do not improvise |
| **Honest** | No numeric literal or numeric-typed expression renders outside `<Figure>`; no `transitions` on an annual data accessor; no banned lexeme in source, copy, built bundle, package names, route paths, asset filenames or the repository name | `pnpm check:policy` — one binary, six rule modules, one file walk — exits non-zero on a seeded violation of each module |
| **Pure** | No `Date.now()` outside `packages/kernel/clock`, no `Math.random()` in `kernel`, no I/O in any model | ESLint `no-restricted-syntax`; no inline disables |
| **Layered** | `connectors/* → contracts, sdk` only; `kernel → contracts` only | `dependency-cruiser` config in CI; `pnpm check:dogfood` over `connectors/*` |
| **Accessible** | axe-core clean on all six routes; no colour-alone encoding; `--border-interactive` on every control; `Shift+G` text alternative; `prefers-reduced-motion` honoured | Per-route axe run, keyboard-navigation test |
| **Finished** | No `TODO`, no commented-out code, no `console.log`, no lorem, no placeholder copy in a shipped route | Biome + a grep gate |

Two habits that will save the build:

1. **Each milestone runs end-to-end from a cold install before the next begins.** The build order is the spine; every milestone leaves something you could show someone. This is the only protection against a budget that ends early.
2. **Write the prose as product.** `/methods` and `/sources` are almost entirely text, they are the cheapest screens in the build, and they are the most persuasive. A trap paragraph on `/sources` is bound by id to a fixture-backed regression test, so a trap that stops being true fails CI. Prose here is code with a different renderer — hold it to the same standard.

The work is worth doing properly. Every arc on this globe is a claim about people who had no say in being counted, and most of those claims are weaker than the field admits. Building the thing that says so, at 60fps, offline, in a way a minister can act on — that is the whole job.


---

## 2. Decisions already made (do not re-litigate)

This section is a register of settled decisions. You accept every row and build on it. You do not re-open a row because a newer package version exists, because a rejected alternative looks cleaner mid-build, or because a research note elsewhere in this document mentions a technology this register cut. Every rejected alternative below was rejected on purpose, and the reason is stated so you do not have to rediscover it.

Three rules govern the register:

1. **A decision here outranks any convenience you discover later.** If an implementation detail collides with a decision, the detail changes.
2. **Version pins are exact. No `^`, no `~`, no `latest`, no `next`.** The `~9.4.0` peer ranges inside the deck.gl and luma.gl packages already force lockstep; your `package.json` makes that explicit rather than relying on resolution luck.
3. **If a decision cannot be honoured** — a registry version is unpublished, a pinned package does not install, a smoke test in M0 fails — you do not substitute your own choice. You apply the pre-decided fallback where one exists (the spine fallback in §4, the corridor-count ladder in M0, the size cut ladder in §4), record what happened in `DECISIONS.md` with the date and the observed error, and continue. Stalling is the only forbidden response.

### 2.1 Identity and naming

| ID | DECISION | WHY | REJECTED ALTERNATIVE |
|---|---|---|---|
| D-01 | The product, the repository, the workspace root package, every package scope (`@exodus/*`), every environment variable prefix (`EXODUS_`), every route path and every asset filename use **Exodus**. The token `EXODUS`/`exodus` appears nowhere in the shipped repository. | "Exodus" is mass-flight-under-duress imagery, inside the war and physical-pressure source concepts that the project's own lexicon rule module (§ policy package) is built on. A product name that fails its own CI gate is the first credibility hole a critic finds. | Keeping `EXODUS` as the platform name with `Exodus` as the app name |
| D-01a | **The checkout you are handed may be a directory named `exodus`, on a git remote named `exodus`.** Neither is authoritative. Set the workspace root `package.json` `"name": "corridor"`, scope every package `@exodus/*`, and name the git remote target `corridor` when you push. If you cannot rename the remote, record that in `DECISIONS.md` as an outstanding lexicon-lint exception with the exact remote URL — do not silently let the old name into a package name, a route, an env var, an asset path or a `README` title. | The lexicon rule module runs over package names, route paths, asset filenames **and the repository name**. A directory name inherited from a previous design is not a licence to ship the lexeme. | Renaming only the app and leaving package scopes as `@exodus/*` |
| D-02 | Schema-level renames are frozen: `watchlist` → `saved_views`, `target` → `area_of_interest`, `entity` → `place` or `indicator`. | A norm enforced at schema level cannot be reintroduced by a careless contributor; a norm enforced in a style guide can. | Documenting preferred vocabulary in `CONTRIBUTING.md` |

### 2.2 Language, runtime, package manager, monorepo

| ID | DECISION | WHY | REJECTED ALTERNATIVE |
|---|---|---|---|
| D-03 | **TypeScript 7.0.2**, strict, with `erasableSyntaxOnly`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`. | Native-port compiler; `erasableSyntaxOnly` keeps every package loadable as plain ESM, which is what makes a third-party connector a drop-in. | Plain `strict` without the erasable-syntax gate |
| D-03a | **No `enum`, no `namespace`, anywhere.** Use `as const` objects plus string-union types. | `erasableSyntaxOnly` raises **TS1294** on both, confirmed empirically on 7.0.2. This is a compile error, not a preference. | `const enum` for codes; namespaces for grouping |
| D-04 | **Node 24.21.0 LTS ("Krypton")**, pinned in `.nvmrc` and in root `engines`. | It is the current LTS line. | Node 26.9.0 — it is Current, `lts: false`; do not use it |
| D-05 | **pnpm 12.4.2** workspaces, with the shared dependency set pinned once in `pnpm-workspace.yaml` under the `catalog` field and consumed as `catalog:` by every package. | Content-addressed store plus strict `node_modules` catches the phantom dependencies that silently break plugin isolation; the catalog is what keeps `apache-arrow` at one version across six packages. | npm/yarn workspaces; per-package duplicated version strings |
| D-06 | **Turborepo 2.11.2** as the task runner. Ingest is cached per connector package; `turbo run ingest --affected --filter=./packages/connectors/*` selects the intersection of "changed on this branch" and "is a connector". | Content-hash caching plus documented intersection semantics for `--affected` + `--filter` is exactly what per-connector incremental ingest needs. | Nx (its plugin inference fights a repo that has its own plugin concept); Lerna (publish-only); raw pnpm scripts |
| D-07 | The import graph in the architecture section is **enforced in CI by a real graph checker** (`dependency-cruiser` config), not by convention or by an in-file lint rule. | An in-file pattern matcher cannot see a transitive import. The rule that `connectors/*` may import only `@exodus/contracts` and `@exodus/sdk` is the seam the whole plugin story rests on. | Trusting code review; a Biome/GritQL in-file rule as a substitute for graph analysis |

### 2.3 Application framework, state, validation, styling

| ID | DECISION | WHY | REJECTED ALTERNATIVE |
|---|---|---|---|
| D-08 | **Vite 8.3.0 + React 19.3.0**, output is a **static directory**. No SSR, no server runtime, no edge functions, no API routes in v1. | The load-bearing constraint is `git clone && pnpm i && pnpm dev` with the network cable out, and `pnpm build` producing a folder any host can serve. Vite satisfies that directly. | Next.js 16.3.5. **[UNVERIFIED]** — the claim that Next *cannot* static-export this well was never re-tested. Justify this decision on the static-host constraint only; **do not write copy or comments asserting a Next.js limitation.** |
| D-09 | **TanStack Router 1.170.38**, search params validated by Zod. Six routes exist and no seventh ships. | The URL is the shareable state. Typed, validated search params are how the scenario permalink stays honest. | React Router 8.4.0 (acceptable fallback if 1.170.38 does not install; record the substitution in `DECISIONS.md`) |
| D-10 | **Zustand 5.0.15** for client state, one store per concern. `timeStore` (`{cursor, playing}`) and `workingSet` live in `@exodus/store`. **No component holds local year state.** | One global time cursor is what makes the flipbook a single coherent object rather than 15 components disagreeing about the year. The 60 Hz animation loop writes to a store, never to React state. | Jotai 3.0.0. **[UNVERIFIED]** — the "atom-per-indicator explodes" reasoning was never benchmarked. Do not repeat it as fact; the decision stands on the single-time-cursor requirement. |
| D-11 | **Zod 4.6.5** is the only validation library. Every plugin manifest, every ingested row batch, every permalink payload is parsed at the boundary. JSON Schema for non-TypeScript consumers is generated with `z.toJSONSchema()` (confirmed present in 4.6.5). | One schema source produces runtime validation, TS types and the published contract. | Valibot 1.5.0, ArkType 2.2.3. **[UNVERIFIED]** — the ergonomic arguments against them were never benchmarked. The decision stands on `z.toJSONSchema()` being the published-contract mechanism. |
| D-12 | Design tokens are **CSS custom properties on `:root`** and are the single source of truth for colour, type scale, spacing, radii and borders. **Tailwind CSS 4.3.3** is permitted as a utility layer that reads those tokens; it may not define a colour. Headless primitives: **radix-ui 1.6.7** (popover, dialog, tabs only). Icons: **lucide-react 1.47.0**. | Every contrast ratio in the design is computed against a specific hex value. If a utility framework can invent a colour, the ratios stop being true. | styled-components 6 (it is the reason kepler.gl is excluded, so it must not arrive by another door); CSS-in-JS runtimes generally |
| D-13 | **Biome 2.5.14** is the formatter and primary linter (`biome ci .`, zero warnings). One **ESLint** config exists for exactly one purpose: a `no-restricted-syntax` rule banning `Date.now()` outside `packages/kernel/clock` and `Math.random()` anywhere in `packages/kernel`. | One fast binary for formatting and lint; one tiny second config for the determinism rule, because determinism is a correctness property and deserves a hard gate. Inline disables are forbidden. | Adding ESLint as the general linter; enforcing determinism by code review |
| D-14 | Internationalisation: **English only in v1.** No i18n framework, no locale files, no RTL mirroring work. All numbers are formatted with `Intl.NumberFormat`, never by hand. | `/methods` and `/sources` are long-form prose arguments; translating them is a second project, and mistranslating an epistemic caveat is worse than not shipping it. `Intl.NumberFormat` costs nothing now and keeps v2 open. | Shipping `en`/`es`/`fr`/`ar`/`zh-Hans` with ICU MessageFormat at MVP |

### 2.4 Rendering stack

Every version in this block is pinned exactly and installed together. A mismatch between deck.gl and luma.gl is a build failure, not a warning.

| ID | DECISION | WHY | REJECTED ALTERNATIVE |
|---|---|---|---|
| D-15 | **deck.gl 9.4.0** (`deck.gl`, `@deck.gl/core`, `@deck.gl/layers`, `@deck.gl/geo-layers`, `@deck.gl/aggregation-layers`, `@deck.gl/extensions`, `@deck.gl/widgets`, `@deck.gl/react`) on **@luma.gl/core 9.4.1** and **@luma.gl/engine 9.4.1**. | One rendering engine, one projection system, one picking system, one binary-attribute path. | three.js (you would reimplement projection, tiling, GPU picking and 64-bit-emulated precision); Cesium/Resium (bundle weight, an Entity API that fights binary attributes); globe.gl / three-globe / cobe (no picking, no data-driven attributes, collapses well below 12k arcs); Mapbox GL JS 3.x (its licence requires an active Mapbox account and terminates when the account lapses) |
| D-16 | Post-processing comes from **@luma.gl/effects 9.4.1**. `fxaa` always on, `vignette` subtle. **No bloom in v1.** No chromatic aberration. | `@luma.gl/shadertools` contains no post-processing passes at all — it ships only `color`, `engine`, `geospatial`, `lighting`, `math`, `volume`. Bloom's only subject was the live incident layer, which in v1 is corpus replay and must not look live. Chromatic aberration is not a standalone module; it exists only as a prop of the bloom lens pipeline, and colour-fringing a data visualisation is a correctness bug. | Chaining a standalone chromatic-aberration pass (it does not exist); enabling bloom over replayed data |
| D-17 | **`_GlobeView` only, globe-only, no basemap, no second view host.** Import it aliased: `import {_GlobeView as GlobeView} from '@deck.gl/core';`. | It is an experimental API and you are accepting that knowingly. Removing FLAT mode also removes the documented GlobeView-to-MapView switching bug, the largest gating unknown in the source designs. | A GLOBE/FLAT toggle; a second `MapView` host; a separate flat route |
| D-18 | **No MapLibre, no `@deck.gl/maplibre`, no `@deck.gl/mapbox`, no `pmtiles`, no `@protomaps/basemaps`, no basemap of any kind, no raster `BitmapLayer`.** | Every fact in v1 is ADM0-resolved and per-capita people density must never render on Web Mercator; with no basemap there is no zoom-12 use case left. This deletes four dependencies, the ODbL contamination question, and the Protomaps hosting problem in one stroke. It also makes the unresolved VIIRS/Black Marble night-lights licence question moot — that texture is not in the layer stack. | Keeping a dark basemap "for orientation"; keeping PMTiles for a later FLAT mode |
| D-19 | **Arrow tables are read into plain typed arrays and handed to stock deck.gl layers via `data: {length, attributes}`.** `apache-arrow@21.2.0`, `@loaders.gl/parquet@4.5.1`, `@loaders.gl/core@4.5.1`. | The binary attribute path is the whole performance story and stock layers give it to you without a third-party bridge. | `@geoarrow/deck.gl-geoarrow@0.4.2` — its devDependencies pin `@deck.gl/* ^9.2.1` (built two minors behind 9.4), it carries a runtime dependency on `threads@1.7.0` (last published 2021), and it ships no GeoJson layer and no Icon layer. `@geoarrow/deck.gl-layers` is staler still. |
| D-20 | **`PathLayer` with `PathStyleExtension({dash: true})` carries all corridors**, great circles tessellated to **32 points**, one geometry carrying three channels: width, dash density, opacity. | `ArcLayer` cannot be dashed and `PathStyleExtension` does not support it. Dash density is the disagreement channel and it is non-negotiable, so `PathLayer` is not optional. | `ArcLayer` + `greatCircle: true`; `GreatCircleLayer`; a second halo geometry behind every corridor |
| D-21 | **An opaque ocean sphere is mandatory**, and `parameters: {cullMode: 'none'}` is set per-layer on the corridor layer. | `cullMode: 'none'` is a per-layer override of GlobeView's default back-face culling, so culling can no longer be your occlusion strategy for those marks; without the sphere, far-side corridors bleed through the Earth. | Relying on back-face culling; treating the sphere as a styling choice |
| D-22 | **`H3HexagonLayer` at r3 (41,162 cells), `highPrecision: 'auto'`, rendering `pop / area_km2`.** | High precision is required at resolutions 0–5, for pentagons and for mixed resolutions — forcing `false` at r3 renders visibly wrong hexagons. r3 is also the ethical cap for gridded people layers, and density is the only honest encoding since cell area varies by more than 2x within a resolution. | r4 or finer globally; `highPrecision: false` "for speed"; rendering raw counts |
| D-23 | **`HeatmapLayer`, `ContourLayer`, `MaskExtension`, `TerrainLayer`, `TerrainExtension`, `Tile3DLayer` are not used.** | The first three are documented as unsupported under GlobeView and nothing contradicts that. The last three have contradicting official pages and none of them is needed at ADM0 resolution — an unnecessary smoke test is budget you do not have. | Smoke-testing terrain-on-globe "in case it works now" |
| D-24 | **WebGL2 only.** Configure the bundler to resolve the `visgl:webgl-only` export condition so WebGPU branches and WGSL sources are stripped from the bundle. No `?renderer=webgpu` flag. | deck.gl's own release notes state WebGPU support remains experimental and is not recommended for production. Stripping it is free bundle size. | Shipping WebGPU behind a query flag |
| D-25 | **Zero `transitions` on any data accessor, on any layer whose data is annual.** Enforced by a unit test and by an AST rule that fails the build. | 180 ms eased motion across neural-network ensemble output at 73% test correlation implies a continuous observed resolution the source does not have. The stepping is the product. | Easing "just on the choropleth"; a 120 ms transition under a `prefers-reduced-motion` guard |

### 2.5 Data, storage and formats

| ID | DECISION | WHY | REJECTED ALTERNATIVE |
|---|---|---|---|
| D-26 | **The canonical fact table is the interface everything crosses**, with `license_id TEXT NOT NULL` and `redistributable BOOLEAN NOT NULL` as mandatory columns on every row. A row missing either fails ingest. | Licence compliance is mechanical or it does not exist. Adding a source adds rows, never a column and never a code path. | Licences as a per-source lookup table consulted at export time |
| D-27 | **Tier A is committed plain to git, hard cap 40 MiB**, enforced by `pnpm snapshot:measure` failing CI, with the pre-decided cut ladder applied in order when it is exceeded. **Tier B is a GitHub Release asset** fetched by `pnpm data:full`. | Converts the largest unquantified risk in the plan into a build failure instead of a late surprise. Release assets are under 2 GiB each, up to 1000, with no documented total-size or bandwidth cap. | A soft "measure it in week one" instruction; a target with no gate |
| D-28 | **No Git LFS, for anything, for any reason.** | Forking and pulling a repository counts against the **parent** repository's bandwidth quota, so downstream clones drain yours until `git clone` breaks for everyone. | LFS for the full flow table, "just for Tier B" |
| D-29 | **No DuckDB-WASM in the browser**, no OPFS, no IndexedDB. Browser persistence is limited to: `sessionStorage` for the once-per-session entry animation, `localStorage` for the `saved_views` tray, and the URL for everything shareable. | At 40 MiB the whole bundle is GPU- and memory-resident; an analytical engine in the browser buys nothing and costs a COOP/COEP deployment constraint, a dev-build version trap and a large bundle. OPFS is an evictable cache, never storage. | `@duckdb/duckdb-wasm` in a worker behind Comlink |
| D-30 | **The permalink encoding is `base64url(deflate-raw(json))`**, kept under ~2 KB. It encodes year cursor, camera, layer visibility, working set and headroom assumption set. | `CompressionStream` supports gzip, deflate and deflate-raw only — **not zstd**; client-side zstd would need a WebAssembly polyfill. It is a permalink, not a scenario engine. | zstd; an uncompressed JSON query string; a server-side short-link service |
| D-31 | **`align(series, grid, method)` defaults to `"none"`.** A missing year is a visible gap. A missing source is an em-dash with a badge, or a typed `Refusal`. Never `0`, never forward-fill, never silent interpolation. | A silently interpolated value is indistinguishable from an observation, which is the single failure the product exists to refuse. | `hold_last` as a "sensible" default |
| D-32 | The degradation ladder in v1 has exactly **two states: `SNAPSHOT` and `UNAVAILABLE`.** `LIVE` and `CACHED` are introduced only by M9, if M9 lands. | v1 is a static site. A four-state machine with nothing to drive two of its states is code that cannot be tested. | Implementing the full `LIVE -> CACHED -> SNAPSHOT -> UNAVAILABLE` enum now |

### 2.6 API style, contracts, testing, deployment

| ID | DECISION | WHY | REJECTED ALTERNATIVE |
|---|---|---|---|
| D-33 | **There is no HTTP API in v1.** The machine-readable interface for researchers is the committed Parquet plus `snapshot/manifest.json` plus the JSON Schema generated from the Zod contracts — readable from Python or R through pyarrow or DuckDB with no server at all. | With no server in the default deployment, describing a REST API would be describing something nothing serves. The files *are* the API. | REST + OpenAPI 3.1 with a generated client; tRPC (it would make the contract TypeScript-only, which excludes the Python and R researchers who are the actual audience) |
| D-34 | **Three plugin contracts: `DataSource`, `Model`, `MapLayer`** — no more — each with at least two independent implementations at merge. | Seven contracts plus an ontology-generated UI is the failure mode where the budget goes into Zod schemas with a blank globe behind them. Three contracts are satisfied naturally by what v1 already builds. | Seven contracts (`Indicator`, `Panel`, `Scenario`, ontology) with a three-implementations rule |
| D-35 | **Vitest 5.0.1** for unit and integration tests; **fast-check 4.10.1** for property tests asserting `run(x, seed) === run(x, seed)` on every `Model`; coverage gate on `packages/kernel`. | The kernel is pure functions, so it is cheap to test to a high bar and expensive to debug if it is not. | Jest; skipping determinism property tests |
| D-36 | **Playwright 1.63.0**, Chromium only, launched with `--use-gl=angle --use-angle=swiftshader-webgl --enable-unsafe-swiftshader`. Visual regressions use `toHaveScreenshot({maxDiffPixelRatio: 0.01})`. Screenshots gate on an idle flag you set yourself from `onAfterRender` plus `deck.needsRedraw()` — deck.gl exposes no such flag. | Plain `--use-gl=swiftshader` is legacy and the automatic SwiftShader WebGL fallback is deprecated; without the current flags CI has no GPU at all. | The legacy flag; multi-browser matrices; a fixed sleep before screenshots |
| D-37 | **CI runs the offline tests with networking disabled at the container level** (`--network=none`), not by mocking `fetch`. | A mock proves your mock works. Container-level isolation proves the product works. | A `vi.mock` of the HTTP client |
| D-38 | **Deployment target: any static host.** `pnpm build` produces a directory. Default host is GitHub Pages. The build may depend on **no** host feature other than a committed redirect rule file. | Zero accounts is the constraint that makes the product verifiable by a stranger. | Vercel/Netlify-specific adapters; a Node server; Docker as the supported path |
| D-38a | `/solve` redirects to `/methods#allocation`: a committed host redirect rule (`apps/web/public/_redirects`) issues the 301 where the host honours it, and a client-side replace-navigation guarantees the landing regardless of host. **The acceptance test asserts the landing URL, not the status code.** | A pure static host cannot emit a 301 from the application bundle. Asserting the status code in CI would make the test a test of the host. | A `/solve` route that renders a "moved" page; asserting a 301 in an environment that cannot produce one |

### 2.7 Licensing and governance

| ID | DECISION | WHY | REJECTED ALTERNATIVE |
|---|---|---|---|
| D-39 | **`packages/contracts` and the connector template are Apache-2.0.** Everything else is **AGPL-3.0-or-later**. | The patent grant matters for third parties implementing the interface; copyleft matters for the product so a vendor cannot close it and resell it to ministries. | MIT or Apache-2.0 throughout; AGPL throughout including the contracts |
| D-40 | The README states AGPL **§13's actual scope**: the offer of Corresponding Source runs to *all* users interacting with a modified version remotely over a network, **including internal ones**. There is no "public" qualifier. | Telling an institution the obligation "only triggers publicly" is false, and being caught being false about your own licence is fatal for a trust product. The accurate reassurance is that a ministry's internal users are all inside the ministry. | Repeating the common "public network use" paraphrase |
| D-41 | **REUSE 3.3 via `REUSE.toml`**, `reuse lint` in CI. **DCO sign-off (`git commit -s`), not a CLA.** | DEP5 is deprecated and the two are mutually exclusive, so `REUSE.toml` is the only correct choice. A CLA deters exactly the institutional and academic contributors this project needs. | A DEP5 `.reuse/dep5` file; a CLA bot |
| D-42 | The README states the **OSD clause 5 and 6 trade-off out loud**: a use-restricted licence forfeits the open-source designation, and this project does not add use restrictions to its licence. Its ethical rules live in `@exodus/policy`, which is executable, not in the licence, which is not. | A norm enforced by an importable, unit-tested package ships every time a third party installs it. A norm in a `CONDUCT.md` ships once. | A custom ethical-source licence; hiding the trade-off |
| D-43 | **Redress is a shipped artifact**: `.github/ISSUE_TEMPLATE/harm-report.yml`, a monitored address, a **30-day response SLA**, the power to de-publish a layer, and a public de-publication log. | A trust product with no complaint path is a claim. | A `SECURITY.md` and nothing else |
| D-44 | **Viewer privacy**: zero third-party scripts, cookieless self-hosted analytics if any, 7-day retention, IP truncated to **/24 IPv4 and /32 IPv6**. | A /48 IPv6 prefix can still single out a household; /32 is the truncation that actually anonymises. | /48 IPv6 truncation; any hosted analytics SDK |

### 2.8 Product decisions carried over in full

These are settled at the design level and restated here because they are the ones most likely to be re-opened mid-build.

| ID | DECISION | WHY | REJECTED ALTERNATIVE |
|---|---|---|---|
| D-45 | **The allocation MILP is cut entirely.** Its absence is rendered at `/methods#allocation` with its full objective function and weight vector as prose. | Its output is a ranked placement shortlist over destinations for people; on a targeting-tool axis, absence beats mitigation. The description **is** the deliverable. | Shipping it behind a human-actor-id gate and an adversary-AUC test. Do not import `highs`, do not write the objective in code, do not add a `solve()` stub. |
| D-46 | **No fitted models and no placeholder coefficients**, at any magnitude, behind any badge. | A placeholder coefficient in a dark dashboard becomes a cited coefficient within a week. | Shipping Ortega & Peri or any `β_dist`/`β_comlang`/`β_contig` labelled "placeholder" |
| D-47 | **The spine is Gaskin & Abel**, verified at M0 with the network on, before any product code, with the Abel & Cohen fallback pre-decided. | It is the only global bilateral source that is annual, CC BY 4.0, and ships per-cell uncertainty — the property the whole product rests on. If the citation is wrong, every downstream figure is invented; that is the only failure mode that poisons everything. | UN DESA IMS (non-commercial, no derivative works — unshippable); verifying at M1 alongside ingest |
| D-48 | **Disagreement is computed on the 5-year period grid** as a step function, and is called **"model disagreement", never "uncertainty" and never "confidence interval"**, with a permanent correlation caveat. Model-internal spread is a **separate, separately named, drawer-only** channel. | Annualising a period total manufactures a methodological artefact and sells it as substance. Both models are fitted to the same underlying stock tables, so the band is a lower bound on true uncertainty — marketing it as *the* uncertainty would be the product's own central lie. | Annualising Abel & Cohen with a tooltip disclosure; one pooled interval labelled as an uncertainty band |
| D-49 | **Coverage-asymmetry is computed in `packages/semantic`.** `MapLayer.encode()` has no access to the opacity field, proven by a type-level test. | If a layer author can choose authority, a plugin can render Gulf corridors with German-register confidence. | Opacity as a layer styling choice with a documented convention |
| D-50 | **Capacity is a per-indicator panel with a named binding constraint, never a scalar**, taken over `K_stock` only (five stock ratios). | Taking the Liebig minimum across all twelve indicators yields a value at or below zero for every country on earth, which looks like a bug and gets "fixed" by silently widening the set. A scalar would also be a policy limit in all but name. | A single headroom number with a caveat |
| D-51 | **Typed `Refusal{code, reason, sourceIds}` is a first-class kernel result**, rendered as a sentence. | Naming *why* a value is absent is stronger than an em-dash, and it structurally prevents a zero standing in for a gap. | A generic missing-data badge |
| D-52 | **One policy package, six rule modules, one file walk, one linter binary** (`pnpm check:policy`). Ethics ship as importable, unit-tested code. | Twelve bespoke CI scripts are twelve mini-projects that render no pixels. Six word lists behind one walker is one afternoon, and a third-party layer inherits every rule without its author reading a document. | Twelve independent CI scripts; a `CONDUCT.md` plus ad-hoc greps |
| D-53 | **The Year Machine is a generic `AttributeCube` driven by `snapshot/manifest.json`.** Corridor count, year range and attribute list come from the manifest, never from a dataset's name. | Hard-coding the spine into the renderer makes the spine unswappable and pushes source coupling into the render layer — which the pre-decided fallback in §4 would then break. | Hard-coding 12,000 corridors and 34 years into the layer code |
| D-54 | **Recipe connectors ship the pipe, never the water** (UN DESA IMS, UNHCR). Code committed, bytes never, tested offline against recorded fixtures, writing to a gitignored path. `bundle:verify` refuses a deliberately inserted non-redistributable row and names the reason in stderr. | Turns a licence problem into a build step, and a hostile test of a policy claim proves the licence engine exists instead of asserting it. | An online-only connector that renders UNAVAILABLE; asserting the licence gate in prose |
| D-55 | **`comcol` and `col45` are a radio group**, never two checkboxes. | They are alternative specifications of one colonial dummy; a radio makes double-counting structurally unrepresentable rather than merely warned against. | Two checkboxes with a prose warning |
| D-56 | **Per-source known traps are shipped product copy, each bound by id to a fixture-backed regression test.** | Concrete failure modes as copy make `/sources` an argument rather than a table, and binding them to fixtures means a trap that stops being true fails CI instead of quietly becoming a lie. | Traps as documentation in a markdown file |

### 2.9 Deliberately left open — with the default to use if unsure

These are genuinely your call. Each has a default. **Take the default unless you have a measured reason not to, and record any deviation in `DECISIONS.md` with the measurement that justified it.**

| Open question | Default if unsure | Constraint that must hold either way |
|---|---|---|
| Parquet compression codec for Tier A | **Snappy** | Whatever you choose must be readable by `@loaders.gl/parquet@4.5.1` with the network off. Reach for zstd **only** after the §4 cut ladder has been fully applied and `snapshot:measure` still exceeds 40 MiB, and then smoke-test the reader before committing a single file. |
| Build-time query engine inside `apps/cli` for ingest and `snapshot:build` | **`@duckdb/node-api@1.5.5-r.5`**, imported by `apps/cli` only | It must never appear in `packages/*` or in any browser bundle. D-29 bans DuckDB in the browser; it says nothing about the build machine. |
| The year scrubber: hand-rolled vs `TimelineWidget` from `@deck.gl/widgets` | **Hand-rolled** | The acceptance criteria govern: 34 notched positions, integer-year stepping, the year at 44px tabular-nums, arrow keys step, `Space` plays, no easing. Evaluate the widget first; if it cannot meet all six, hand-roll without further deliberation. |
| Default camera position | **longitude 20, latitude 5** (Africa-centred), tuned once at M2 and then frozen | It must place the Global South in frame and its tooltip must cite the 53% intra-regional figure. Record the final value in `DECISIONS.md`. |
| Bundle-size gate | **`size-limit@14.0.0`**, budget set from the first measured M2 build plus 10% | Do **not** adopt any pre-stated KiB figure as if it were measured — every such number in the research is `[UNVERIFIED]`. Measure, then gate. |
| Versioning and release tooling | **Changesets 3.0.3** if you publish any package to npm; otherwise a single repo version and no tooling | Do not add release tooling before there is something to release. |
| Analytics | **Ship none in v1** | If a deployer adds analytics, D-44's constraints bind them; the repo ships the policy text, not the script. |
| Test-data fixture format per connector | **The raw upstream bytes, verbatim, plus a `{url, fetchedAt, sha256, httpStatus, redirectChain}` sidecar** | Every `transform()` must be unit-testable with the network off, and `pnpm snapshot:build --from-fixtures` must run offline. |
| Whether `packages/globe` mounts deck.gl through `@deck.gl/react` or instantiates `Deck` directly | **`@deck.gl/react@9.4.0`** | The 60 Hz animation loop writes to the Zustand store, never to React state, whichever mounting strategy you pick. |

### 2.10 Decisions encoded as code

Write this file at `packages/contracts/src/decisions.ts`. It is the machine-readable half of this register, and `pnpm check:policy` reads it.

```ts
// packages/contracts/src/decisions.ts
// Frozen at M0. Changing a value here is a design change, not an implementation choice.
// No enum, no namespace: `erasableSyntaxOnly` raises TS1294 on both.

export const TOOLCHAIN = {
  node: '24.21.0',
  pnpm: '12.4.2',
  turbo: '2.11.2',
  typescript: '7.0.2',
  vite: '8.3.0',
  react: '19.3.0',
  '@tanstack/react-router': '1.170.38',
  zustand: '5.0.15',
  zod: '4.6.5',
  tailwindcss: '4.3.3',
  'radix-ui': '1.6.7',
  'lucide-react': '1.47.0',
  '@biomejs/biome': '2.5.14',
  vitest: '5.0.1',
  'fast-check': '4.10.1',
  '@playwright/test': '1.63.0',
} as const;

export const RENDER_PINS = {
  'deck.gl': '9.4.0',
  '@deck.gl/core': '9.4.0',
  '@deck.gl/layers': '9.4.0',
  '@deck.gl/geo-layers': '9.4.0',
  '@deck.gl/aggregation-layers': '9.4.0',
  '@deck.gl/extensions': '9.4.0',
  '@deck.gl/widgets': '9.4.0',
  '@deck.gl/react': '9.4.0',
  '@luma.gl/core': '9.4.1',
  '@luma.gl/engine': '9.4.1',
  '@luma.gl/effects': '9.4.1',
  'apache-arrow': '21.2.0',
  'h3-js': '4.5.0',
  '@loaders.gl/core': '4.5.1',
  '@loaders.gl/parquet': '4.5.1',
} as const;

/**
 * Packages that must never appear in any dependency field, at any version.
 * `pnpm check:policy` reads this list and fails the build on a match.
 */
export const FORBIDDEN_DEPENDENCIES = [
  'maplibre-gl',
  '@deck.gl/maplibre',
  '@deck.gl/mapbox',
  'mapbox-gl',
  'pmtiles',
  '@protomaps/basemaps',
  '@geoarrow/deck.gl-geoarrow',
  '@geoarrow/deck.gl-layers',
  '@duckdb/duckdb-wasm',
  'kepler.gl',
  'highs',
  'lp-model',
  'glpk.js',
  'javascript-lp-solver',
  'styled-components',
] as const;

/** v1 is a static site. LIVE and CACHED arrive only with the optional M9 sidecar. */
export type DataState = 'SNAPSHOT' | 'UNAVAILABLE';

/** Every version above is an exact pin. Ranges are a build failure, not a warning. */
export function isExactPin(range: string): boolean {
  const core = range.split('-')[0] ?? '';
  const parts = core.split('.');
  if (parts.length !== 3) return false;
  return parts.every(
    (part) => part.length > 0 && [...part].every((ch) => ch >= '0' && ch <= '9'),
  );
}

export function assertExactPins(deps: Readonly<Record<string, string>>): void {
  const offenders = Object.entries(deps)
    .filter(([, range]) => !isExactPin(range))
    .map(([name, range]) => `${name}@${range}`);
  if (offenders.length > 0) {
    throw new Error(
      `Dependencies must be pinned exactly (no ^, ~, latest or next): ${offenders.join(', ')}`,
    );
  }
}
```

### 2.11 `[UNVERIFIED]` markers carried into this section

Each of these is a claim the research could not confirm. The **decision** in each case still stands — it rests on a different, verified argument. What you must not do is repeat the unverified claim as a justification, in code comments, in `DECISIONS.md`, in `/methods` copy, or in a commit message.

| Claim | Status | What you do about it |
|---|---|---|
| "Next.js cannot produce a satisfactory static export for this app" | `[UNVERIFIED]` — never re-tested | Keep D-08. Justify it as "Vite gives us a static directory with no server"; delete any sentence about Next.js limitations. |
| "Jotai's atom-per-indicator model degrades at scale" | `[UNVERIFIED]` — never benchmarked | Keep D-10. Justify it as "one global time cursor, one store per concern". |
| Ergonomic arguments against Valibot and ArkType | `[UNVERIFIED]` | Keep D-11. Justify it as "`z.toJSONSchema()` publishes the contract to non-TypeScript authors". |
| SSE's advantages over WebSockets | `[UNVERIFIED]` engineering judgement | Irrelevant to v1 (there is no server). If M9 lands, state it as a judgement, not a finding. |
| Every GPU-millisecond and wire-byte budget in the research | `[UNVERIFIED]` — budgets, not measurements | Treat them as targets to measure against at M0 and M3. Publish the **measured** numbers to `/sources` and `SNAPSHOT.md`. Never quote an unmeasured figure in the UI. |
| Any pre-stated bundle-size or snapshot-size target other than the 40 MiB cap | `[UNVERIFIED]` | The 40 MiB cap is the only binding number, and it is binding because `snapshot:measure` enforces it. Derive every other budget from a measurement. |
| UNHCR's redistribution terms | `[UNVERIFIED]` — two verification passes found contradictory terms | Ship UNHCR as a recipe connector only (D-54). `/sources` records the contradiction and the date. Do not resolve it by picking the permissive reading. |
| deck.gl 9.4 being the final v9 release, with v10 bringing luma.gl 10 and loaders.gl 5 | Verified as a stated expectation, not a dated plan | Do not attempt any v10 migration in v1. Record it as a known future cost in `BACKLOG.md` and move on. |


---

## 3. The data layer: sources, snapshot, ingestion and provenance

This section defines every byte that ships. Read it before you write a connector, a schema, or a loader. Three rules govern everything below and none of them bend:

1. **Nothing is invented.** If a URL, a column name, a byte count or a licence is not confirmed in this section as `[verified]`, you resolve it at M0 with the network on and record the result, or you apply the named fallback. You never infer a column name from a design document, never "adapt" to a file that looks similar, never write a schema you have not seen.
2. **Nothing is imputed.** A missing year is a gap. A missing source is `—` with a badge or a typed `Refusal`. There is no interpolation, no forward-fill, no region-median substitution, no zero-fill, anywhere in the pipeline.
3. **Nothing crosses the ingest boundary without provenance.** `source_id`, `vintage_date`, `latency_days`, `estimate_kind`, `license_id` and `redistributable` are mandatory columns on every fact row. A row missing any of them fails ingest with a named error.

### 3.1 The v1 data bundle

Two tiers plus a third category that ships code only.

- **Tier A** is committed to git under `snapshot/`. It is what `pnpm dev --network=none` renders. Hard cap **40 MiB = 41,943,040 bytes**, enforced by `pnpm snapshot:measure` failing CI.
- **Tier B** is a single GitHub Release asset fetched by an explicit `pnpm data:full` into the gitignored `snapshot/full/`. Never Git LFS, for anything, ever — forks and pulls bill the parent repo's bandwidth until `git clone` breaks for everyone.
- **Recipe connectors** ship `plan()`/`fetch()`/`transform()` and tests, and write to a gitignored path. Their bytes are never committed and never enter `snapshot:build` output.

#### 3.1a Identity, access and format

`Ver` is the verification state of the **access method** as of the research probe on 2026-09-18. `[v]` = confirmed live. `[U]` = unconfirmed; §3.2 tells you exactly what to do about it.

| id | Provider | What it gives | Access method (exact) | Format | Ver |
|---|---|---|---|---|---|
| `gaskin-abel` | Gaskin & Abel, *Nature* 655(8121):148–157 | Annual bilateral flows + per-cell σ | Zenodo record `https://zenodo.org/records/17344747` (DOI `10.5281/zenodo.17344747`), resolve the file URL from `https://zenodo.org/api/records/17344747` → `files[].links.self` where `key == "mig_bilateral.csv"`. **Never fetch `T.nc` (3,352,781,156 B).** | CSV, 145,597,904 B | `[v]` record + file listing + header; `[U]` direct file URL shape → resolve via API |
| `abel-cohen` | Abel & Cohen v6, figshare 14579241 | 5-year bilateral flows, 3 estimators | `https://ndownloader.figshare.com/files/53236079` — 302s to S3, **follow redirects** | CSV, 65,341,478 B, 1,882,417 lines | `[v]` downloaded and profiled in full |
| `eurostat-mirror` | Eurostat | `migr_imm5prv` + `migr_emi3nxt`, both directions per EU pair | `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/{code}?format=JSON&lang=EN&geo={GEO}&partner={GEO}&time={YYYY}` — **chunk by year**; a query whose estimated cost exceeds 5,000,000 cells is rejected or diverted to the async API | JSON-stat 2.0 | `[v]` base, shapes, cell ceiling |
| `eurostat-asylum` | Eurostat | `migr_asyappctzm`, monthly asylum applicants | Same base, `migr_asyappctzm`, chunked by month | JSON-stat 2.0 | `[v]` (103,640,312 source rows, data through 2026-08, updated 17.09.2026) |
| `wpp` | UN DESA Population Division, WPP 2024 | Demography, life tables, ASFR, SRB, VarID 2/7 | Bulk under `https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/` — the folder is `1_Indicator (Standard)`, **singular**; files `WPP2024_Demographic_Indicators_Medium.csv.gz` (16,557,272 B), `…_OtherVariants.csv.gz` (75,342,445 B), `WPP2024_Population1JanuaryBySingleAgeSex_Medium_2024-2100.csv.gz` (67,882,675 B), `WPP2024_Fertility_by_Age1.csv.gz` (301,907,467 B), `WPP2024_Life_Table_Complete_Medium_Both_1950-2023.csv.gz` (200,036,668 B) | multi-member gzip CSV, UTF-8 BOM | `[v]` all URLs + byte counts |
| `wdi-who` → connector `wdi` | World Bank WDI v2 | Capacity indicators, population, GDP pc PPP | `https://api.worldbank.org/v2/country/all/indicator/{code}?format=json&per_page=20000&mrnev=1` | JSON | `[v]` (`lastupdated` 2026-07-13, 265 rows) |
| `wdi-who` → connector `who-gho` | WHO GHO | Physicians / nurses+midwives / beds density, gap-fill only | `https://ghoapi.azureedge.net/api/{INDICATOR}?$filter=SpatialDimType eq 'COUNTRY'` — JSON by default, `$format=json` is a no-op | OData JSON | `[v]` base + indicator codes `WHS6_102`, `HRH_26`, `HRH_33` |
| `cepii` | CEPII Gravity 202211 | Dyad context for the drawer | **`[U]` — no bulk URL was confirmed.** Resolve at M0 from the CEPII Gravity dataset page; record the resolved URL and its HTTP status in `DECISIONS.md` | CSV/RDS/dta (resolve) | `[U]` access; `[v]` field names |
| `ghs-h3` | JRC GHSL, GHS-POP R2023A | H3 r3 `pop` + `area_km2` | `https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/GHS_POP_GLOBE_R2023A/GHS_POP_E2025_GLOBE_R2023A_54009_1000/V1-0/GHS_POP_E2025_GLOBE_R2023A_54009_1000_V1_0.zip` (323,340,844 B). Directory uses `V1-0`, filename uses `V1_0` — this asymmetry is real | zipped GeoTIFF, Mollweide ESRI:54009 | `[v]` URL grammar + bytes |
| `iom-mm` | IOM Missing Migrants | ADM0 annual incident counts | **`[U]` — `https://missingmigrants.iom.int/downloads` returns 403 to scripted clients.** Resolve at M0 | per-year CSV | `[U]` access; `[v]` licence |
| `naturalearth` | Natural Earth 5.1.1 (as served by naciscdn) | 258 ADM0 polygons + disputed areas | `https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_0_countries.zip` (4,930,492 B); `…/ne_10m_admin_0_disputed_areas.zip` (215,221 B). The layer is `disputed_areas`; `breakaway_disputed_areas` 403s | zipped Shapefile | `[v]` both URLs + bytes + `VERSION.txt` = 5.1.1 |
| `centroids` | derived | 258 arc endpoints | Derived from `naturalearth` at ingest; committed override table at `packages/connectors/centroids/overrides.ts` | derived | `[v]` derived |
| `xwalk` | hand-built, versioned | 5-namespace country-code crosswalk with validity ranges | Committed source table at `packages/connectors/xwalk/table.csv` | CSV → Parquet | `[v]` all collisions sourced |
| `corpus` → `gdelt` | GDELT 2.0 | 72h incident replay | `https://data.gdeltproject.org/gdeltv2/lastupdate.txt` → 3 lines `size md5 url`; **rewrite the embedded `http://` to `https://`**. `export` + `mentions` only — **GKG excluded** (5,713,997 B per 15-min slot). Translingual feed at `lastupdate-translation.txt` lags one slot | ZIP of CSV | `[v]` both files, 3-line format, slot lag |
| `corpus` → `gdacs` | GDACS | 72h alert replay | `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD` | GeoJSON | `[v]` 200, FeatureCollection, `alertlevel`/`alertscore`/`episodealertlevel` present |
| `corpus` → `usgs` | USGS | 72h earthquake replay | **`[U]` — no USGS endpoint was probed.** Resolve at M0 | GeoJSON | `[U]` |
| `fixtures` | per-connector | Recorded responses + 2 MiB demo slice | Written by `pnpm ingest --record` at M0; committed under `packages/connectors/<id>/fixtures/` and `snapshot/demo/` | raw bytes + JSON sidecar | derived |
| **Tier B** `flows-full` | Gaskin & Abel | All corridors × 34 years × all σ columns (~1.8M rows) | GitHub Release asset, fetched by `pnpm data:full` into `snapshot/full/` | Parquet (SNAPPY) | derived |
| **Recipe** `undesa-ims` | UN DESA IMS 2024 | Bilateral stocks, 233 countries | `https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/undesa_pd_2024_ims_stock_by_sex_destination_and_origin.xlsx` (6,005,287 B, Last-Modified 2025-01-27). **Requires `User-Agent: Mozilla/5.0 (X11; Linux x86_64)` — the default UA gets 403** | XLSX | `[v]` URL, bytes, UA trap |
| **Recipe** `unhcr` | UNHCR RDF | Refugee/asylum stocks | `https://api.unhcr.org/population/v1/population/?yearFrom=&yearTo=&cf_type=ISO&coo=&coa=` | JSON | `[v]` base, `cf_type=ISO` requirement, code collisions |

#### 3.1b Coverage, vintage, cadence, licence, size, role

`Committed` is the Tier A byte budget measured at M0 and written into `snapshot/manifest.json`. `Licence ver` marks whether the licence itself was read from a primary source.

| id | Coverage | Vintage | Cadence | `license_id` (SPDX or `LicenseRef-`) | Licence ver | Raw → committed | Role |
|---|---|---|---|---|---|---|---|
| `gaskin-abel` | 230 countries, 1990–2023, annual | Zenodo deposit 2025-10-13; paper 2026-06-10 | `annual` (frozen deposit) | `CC-BY-4.0` | `[v]` | 145,597,904 B → **9 MiB** | **The spine.** Top 12,000 corridors by mean 2015–2023 `mig_prev` × 34 years ≈ 408k rows. Drives every arc, the Year Machine and M3's `A_p`. `estimate_kind='modelled'` on every row |
| `abel-cohen` | 232 countries, `year0 ∈ {1990,1995,2000,2005,2010,2015}` | v6 published 2025-03-26 | `quinquennial` (frozen) | `CC-BY-4.0` | `[v]` | 65,341,478 B → **1 MiB** | Second model for M3 disagreement. Aggregated to the 12k spine corridors × 6 periods |
| `eurostat-mirror` | EU/EFTA pairs, last 10 years, both directions | `migr_imm5prv` updated 02.07.2026 | `annual` | `CC-BY-4.0` (Decision 2011/833/EU; commercial reuse explicit) | `[v]` | — → **0.5 MiB** | M3c. The only genuinely independent comparison in the product: two national statistical offices, not two fits to the same table |
| `eurostat-asylum` | EU+EFTA destinations × ~190 citizenships, last 24 months through 2026-08 | updated 17.09.2026 | `monthly` | `CC-BY-4.0` | `[v]` | — → **2 MiB** | The only true sub-annual bilateral series. One figure on `/place`, one row on `/sources`, ~4-week lag badge. **Never labelled "real-time"** |
| `wpp` | 237 `Country/Area`, single-year ages 0–100+, 1950–2100 | WPP 2024, 28th edition, released July 2024; 2026 revision postponed to 2027 | `frozen` until 2027 | `CC-BY-3.0-IGO` → `LicenseRef-CC-BY-3.0-IGO` | `[v]` | — → **5 MiB** | M2. 2024 pop by age×sex; `L(a)`, ASFR, SRB for the bisection; precomputed `D(c,y) = VarID2 − VarID7` for 2024–2050; PSR and POADR series |
| `wdi` | 187–216 sovereign economies per indicator | `lastupdated` 2026-07-13 | `annual` | `CC-BY-4.0` (World Bank default; individual series may carry ODbL or custom terms — check per-series metadata at ingest) | `[v]` | — → 1 MiB (shared row) | M1 `K_stock` and the `/place` capacity panel |
| `who-gho` | ~190 countries | per-indicator; key on `TimeDim` | `annual` | `CC-BY-4.0` **`[U]`** — `data.who.int` states CC BY 4.0, the older `who.int` data-policy page asserts a non-commercial custom grant. Carry the ambiguity to `/sources` as a named trap; do not assert an NC flag WHO does not apply here | `[U]` | — → (shared) | **Gap-fill only.** Use `wdi` first for all five `K_stock` indicators; emit a `who-gho` row only where the WDI row is absent |
| `cepii` | Gravity 202211, restricted to the 12k spine corridors | 202211 | `frozen` | `Etalab-2.0` → `LicenseRef-Etalab-2.0` | `[v]` | — → **0.5 MiB** | Drawer dyad context: `dist, distcap, distw_harmonic, contig, comlang_off, comlang_ethno, comcol, col45, comrelig, scaled_sci_2021` |
| `ghs-h3` | 41,162 H3 r3 cells, global | GHS-POP R2023A, epoch E2025 (**a projection — label it**) | `frozen` | `CC-BY-4.0` (JRC `copyright.txt`, Decision 2011/833/EU) | `[v]` | 323,340,844 B → **1 MiB** | The density layer. Stores `pop` and `area_km2` so the renderer computes **density**, never raw count. r3 is the ethical cap for gridded people layers |
| `iom-mm` | ADM0, 2014–2026 | per-year CSV | `annual` batches | `CC-BY-4.0` | `[v]` | — → **0.2 MiB** | **Annual ADM0 counts only. Coordinates dropped at ingest. No map layer, ever.** Rendered as a lower bound, never a count |
| `naturalearth` | 258 ADM0 records, 33 `FCLASS_*` POV fields | 5.1.1 as served by naciscdn | `frozen` | Public domain / CC0, **no attribution required** → `CC0-1.0` | `[v]` | 5,145,713 B → **3 MiB** | 258 ADM0 polygons simplified for the globe, shipped as gzipped GeoJSON. **No PMTiles, no vector tiles, no basemap** |
| `centroids` | 258 | derived | `frozen` | `CC0-1.0` | derived | → **0.1 MiB** | Arc endpoints. Corridors are 2-vertex great circles between these and nothing else |
| `xwalk` | 5 namespaces, with validity date ranges | hand-built, versioned | `frozen` | `CC0-1.0` | n/a | → **0.1 MiB** | The join key. See §3.4 |
| `corpus` | **72 hours only**, GDELT + GDACS (+ USGS if resolved) | recorded at M1 | `sub-hour` at record time, `frozen` thereafter | GDELT: redistribution, rehosting and mirroring explicitly permitted with citation + link → `LicenseRef-GDELT`. USGS: public domain → `CC0-1.0`. GDACS: **`[U]`** — no licence page located | GDELT `[v]`, USGS `[U]`, GDACS `[U]` | → **6 MiB** | The incident ribbon, rendered in `SNAPSHOT` chrome. **No pulse, no emissive, no bloom in v1.** GKG excluded |
| `fixtures` | per-connector | recorded at M0 | `frozen` | per-source (inherits) | inherits | → **4 MiB** | Makes every `transform()` unit-testable with the network off, and makes `pnpm snapshot:build --from-fixtures` runnable offline |

**Budget total ≈ 33.4 MiB against a 40 MiB cap.** Measured at M0 by `pnpm snapshot:measure`, written into `snapshot/manifest.json`, published on `/sources`.

#### 3.1c The three exclusions, rendered by name on `/sources`

These are product copy, not documentation. Each gets a row with its reason and the condition under which it returns.

| id | Why it is not in the bundle | Returns when |
|---|---|---|
| `undesa-ims` | UN Terms of Use grant personal, non-commercial use only, *"without any right to resell or redistribute them or to compile or create derivative works therefrom."* No Creative Commons licence exists | Never as bytes. Ships now as a recipe connector |
| `unhcr` | Licence contradictory across two independent verification passes: one read the Terms as CC BY 4.0, the other read the same page as *"not for sale or for use in conjunction with commercial purposes."* Unresolved | On written resolution with `webportal@unhcr.org` |
| `acled` | Content Usage Terms prohibit creating a "functional substitute", providing services to others without authorisation, and ML/LLM training *"regardless of whether such use is commercial, academic, or experimental"* | On written terms. UCDP GED is the licence-safe alternative if a conflict layer is ever scoped |

Also permanently excluded from `snapshot/` and `corpus/`, each on independent licence grounds: EM-DAT, IDMC/IDU (CC BY-NC-SA 3.0 IGO), GADM ("redistribution or commercial use is not allowed"), MIPEX, ReliefWeb, DTM, VIEWS, UNESCO UIS (CC BY-SA 3.0 IGO — ShareAlike is the contamination vector), gbOpen bulk (36.5% ODbL at ADM0, 42.2% at ADM1). **One IDU file makes the repository's entire data component CC BY-NC-SA.**

### 3.2 How you handle `[U]`, and the pre-decided fallbacks

**M0 runs `pnpm verify:sources` with the network ON, before any product code.** For every source whose `access.verification !== 'verified'`, it executes `plan()`, follows redirects, and asserts the declared shape: byte count within ±5% where one is declared, exact column list where one is declared, and a row-count floor.

Then, in order:

1. **On success** — flip `verification` to `'verified'` in the connector, write the resolved URL into `plan()`, append the HTTP status, final URL and date to `DECISIONS.md`. Continue.
2. **On failure** — apply the fallback in the table below. Append the failed URL, HTTP status and date to `DECISIONS.md` **and** add a refusal entry to `/methods`. Continue. Do not stall, do not retry a guessed variant, do not construct a URL from a pattern you have not seen return 200.
3. **Never** infer a column name, never write a schema from this document, never "adapt to what looks similar." Fabricating a schema silently invents every figure downstream. This is kill-list item 1.
4. The `[U]` state is **carried through to the UI**: `/sources` renders the verification badge per source, and the trap copy states exactly what was not confirmed.

| Source | If it does not resolve exactly |
|---|---|
| `gaskin-abel` | Apply the §4 spine fallback in full: `abel-cohen` becomes the spine; the Year Machine becomes **6 period steps** (1990-95 … 2015-20) instead of 34 annual frames; cross-model disagreement degrades to Abel & Cohen's **within-method** spread across `da_min_open`/`da_min_closed`/`da_pb_closed`, **relabelled as within-method everywhere**, plus the Eurostat mirror as the only cross-source comparison. `manifest.cube.years` becomes the six period starts and the renderer is unchanged — that is the whole point of the `AttributeCube` indirection |
| `cepii` | Ship without dyad context. The drawer's dyad panel renders a typed `Refusal`, not blanks. `comcol`/`col45` radio group is not built |
| `iom-mm` | Drop from Tier A. `/sources` carries the row as a fourth exclusion with the 403 recorded |
| `usgs` | Corpus ships GDELT + GDACS only. The incident ribbon is unaffected |
| `gdacs` (licence) | If no primary licence page is located by M1, drop GDACS from the committed corpus. GDELT alone drives the ribbon |
| `who-gho` (licence) | Keep, restricted to the five `K_stock` indicators, with the ambiguity as a named trap on `/sources`. If a lawyer resolves it as non-commercial, drop `who-gho` entirely — `wdi` covers all five indicators for 188–208 countries |
| **Total network failure at M0** | Last resort, and only this: run `pnpm fixtures:synth`, which emits schema-valid, obviously-synthetic data with `source_id='synthetic'`, `estimate_kind='modelled'` and values drawn from a seeded PRNG. Every route renders a non-dismissible `SYNTHETIC — NOT DATA` banner, `bundle:verify` refuses to mark the bundle shippable, and `DECISIONS.md` records the failure. Shipping synthetic data without that banner is the single worst thing you can do in this build |

### 3.3 The snapshot builder

#### Paths

```
snapshot/                      COMMITTED. What `pnpm dev --network=none` reads.
  manifest.json                The interface. Drives the registry, the AttributeCube and /sources.
  suppression-ledger.json      Append-only. Committed. See §3.6.
  flows.parquet                gaskin-abel spine, 12k corridors x 34 years
  flows_period.parquet         abel-cohen, 12k corridors x 6 periods, summed over sex, type='outward'
  mirror.parquet               eurostat-mirror, EU pairs, both directions, with OBS_FLAG/CONF_STATUS
  asylum.parquet               eurostat-asylum, 24 months
  wpp_pop.parquet              2024 population by single-year age x sex
  wpp_life.parquet             L(a), ASFR, SRB per country-year
  wpp_diff.parquet             D(c,y) = VarID2 - VarID7, PSR, POADR, 2024-2050
  capacity.parquet             wdi + who-gho, K_stock and /place indicators
  dyads.parquet                cepii, restricted to the 12k spine corridors
  h3_pop.parquet               41,162 r3 cells: h3, pop, area_km2
  incidents.parquet            iom-mm, ADM0 annual counts, no coordinates
  xwalk.parquet                the crosswalk, with validity ranges
  centroids.parquet            258 arc endpoints
  geo/adm0.geojson.gz          258 simplified ADM0 polygons + FCLASS_* columns
  geo/disputed.geojson.gz      ne_10m_admin_0_disputed_areas, simplified
  corpus/{sourceId}/{ISO8601}.{ext}   72h replay + .meta.json sidecars
  demo/                        the 2 MiB slice produced by --from-fixtures
  full/                        GITIGNORED. Tier B lands here.
raw/                           GITIGNORED. `pnpm ingest` output, pre-normalisation.
.recipe-out/                   GITIGNORED. Recipe connector output. Never read by snapshot:build.
packages/connectors/<id>/fixtures/   COMMITTED. Recorded responses + .meta.json.
```

#### Commands

| Command | Does | Network |
|---|---|---|
| `pnpm verify:sources` | Executes every `plan()`, asserts declared shape, flips verification state | **ON**, M0 only |
| `pnpm ingest [--only <id>] [--record]` | `plan()` → `fetch()` through the record-replay client → `transform()` → `raw/<id>/*.arrow`. `--record` also writes fixtures | ON |
| `pnpm ingest --replay` | Same, reading `corpus/` and `fixtures/` | **OFF** |
| `pnpm snapshot:build [--from-fixtures]` | `raw/` (or fixtures) → normalise → suppress → round → write Parquet + manifest | **OFF, always.** `snapshot:build` performs no I/O beyond the local filesystem; a network call from it is a build failure |
| `pnpm snapshot:measure` | Per-table compressed bytes + sha256 → `budget` in the manifest and `SNAPSHOT.md`; **exit 1 above 40 MiB** | OFF |
| `pnpm bundle:verify` | The licence and geometry gates of §3.7 | OFF |
| `pnpm data:full` | Tier B Release asset → `snapshot/full/`, checksum-verified | ON, opt-in |
| `pnpm gen:connector <id>` | Scaffolds `packages/connectors/<id>/` from the SDK template | OFF |

#### Committed vs downloaded — the rule

**Nothing is downloaded at install time.** No package in the workspace may declare a `postinstall`, `prepare`, `preinstall` or `prepublish` script that performs network I/O. `check:policy` rule module 6 fails the build if any `package.json` in the workspace declares such a script whose body matches `/\b(curl|wget|fetch|https?:\/\/|node-fetch|undici)\b/`. The only permitted postinstall work is an offline checksum verification of `snapshot/` against `manifest.json`, which prints a warning and exits 0 on mismatch so a cold clone never hard-fails.

Tier B is opt-in and the product must be complete without it: when `snapshot/full/` is absent the globe renders the top 12k corridors from `flows.parquet`, the `Shift+G` table shows the top 25, and arbitrary-corridor lookup outside the 12k returns `Refusal('NoSharedPeriodGrid')` or a `—`, never a spinner and never an error toast.

#### Encoding and determinism

- **Parquet, SNAPPY compression, nothing else.** Zstd Parquet requires a compressor shim the browser reader may not have; SNAPPY is the safe intersection. A zstd-compressed table is a build failure. Row-group size fixed at 65,536 rows.
- Read in the browser with `@loaders.gl/parquet@4.5.1` into `apache-arrow@21.2.0` tables, then into **plain typed arrays** handed to stock deck.gl layers via `data: {length, attributes}`. No `@geoarrow/deck.gl-geoarrow`, no DuckDB-WASM.
- GeoJSON ships gzipped and is decompressed in the loader with `DecompressionStream('gzip')` — gzip, deflate and deflate-raw are the only supported formats; zstd is not available.
- **`snapshot:build` is byte-reproducible.** Every table declares a sort key in the manifest and is written in that order. No timestamps appear in any file except `manifest.builtAt` and `manifest.builderCommit`. Running `pnpm snapshot:build --from-fixtures` twice must produce identical `sha256` for every table; CI asserts this. A 40 MiB committed bundle that churns on every rebuild is unreviewable.
- **Corridor selection is deterministic**: top 12,000 by mean `mig_prev` over 2015–2023, `orig != dest`, ties broken by `(orig, dest)` lexicographic ascending. The selected set is written to `manifest.cube` and is the authority for every downstream consumer.

#### The pre-decided cut ladder

If `snapshot:measure` exceeds 40 MiB, apply **in this order** and stop as soon as you are under. Do not improvise, do not reorder, record each step applied in `manifest.budget.cutLadderApplied` and in `DECISIONS.md`:

1. `corpus` 72h → 24h
2. corridors 12,000 → 6,000
3. `eurostat-asylum` 24 months → 12 months
4. Drop `stock_mean` / `stock_std` from `flows.parquet` (drawer-only via Tier B)

#### Assertions that must be in the M1 test suite

These are the traps that fail silently. Each is a hard assertion in `snapshot:build`, not a warning.

| Assertion | Failure it prevents |
|---|---|
| WPP ingest yields **> 600,000 rows** per file | Single-member gzip reader returns 634 bytes — a header and zero rows — with **no error** |
| `gaskin-abel` header equals `,orig,dest,year,stock_mean,stock_std,mig_prev,mig_prev_std,mig_brth,mig_brth_std` exactly | Silently fabricated schema poisoning every downstream figure |
| `abel-cohen` row count == 1,882,416; `sex` values == `{female, male}`; rows filtered to `type='outward'` | Missing sex total (there is no total row); triple-counting across `{outward, return, transit}` |
| `wpp` rows filtered to `LocTypeName == 'Country/Area'`, yielding **237 distinct ISO3** | 234 aggregate groupings (`BRICS`, `ASEAN`, `African Union`…) carry a **blank** `LocTypeName` and blank `ISO3_code` |
| `SRB` mean ≈ 1.058 after `/100`; ASFR max < 1.0 after `/1000` | A 99.1% male birth share; a TFR off by 1000× |
| `h3_pop` row count == 41,162 | Wrong resolution |
| `adm0.geojson.gz` feature count == 258 | Wrong Natural Earth layer |
| Every row of every table carries non-null `license_id` and `redistributable` | A CC BY bundle silently containing restricted cells |

### 3.4 Normalisation rules

#### The join key

**ISO 3166-1 alpha-3 is the only join key.** Every fact row's `origin_iso3` and `dest_iso3` are alpha-3. Every connector resolves its own namespace through `xwalk` at `transform()` time; a code that does not resolve fails ingest with a named error listing the code, the namespace and the source — it is never dropped silently and never passed through.

`xwalk` is **a versioned table with validity date ranges, not a dict literal**, with columns `(namespace, code, iso3, valid_from, valid_to, note)`. Five namespaces:

| Namespace | Notes that must be encoded as explicit rows |
|---|---|
| `M49` | UN numeric |
| `ISO3` | Identity, with validity ranges for historic codes |
| `EUROSTAT_GEO` | **`UK` not `GB`, `EL` not `GR`, `XK` for Kosovo** |
| `OECD_REF_AREA` | Plus `W` = world in `CITIZENSHIP`, which must be filtered, not joined |
| `UNHCR_LEGACY` | **`AUS` = Austria in UNHCR and Australia in ISO 3166-1. `CHI` = China.** 398 destination-code mismatches were observed in a single 1,000-row page. Recipe connectors join on `coo_iso`/`coa_iso`, never on `coo`/`coa`; the legacy namespace exists in `xwalk` so the collision is representable and testable, not so it is joined on |

Explicit, unit-tested rows for: Kosovo, Taiwan, Palestine, Western Sahara, Curaçao/Netherlands Antilles, Sudan/South Sudan (2011), Serbia and Montenegro (2006), USSR, Yugoslavia.

#### Disputed territories

Worldview is a first-class dimension, not a shapefile choice. **v1 ships exactly one worldview, `UN`**, declared in `manifest.worldview`; the machinery exists so a second is a data change, not a code change.

1. Base geometry is Natural Earth 5.1.1, de-facto administration.
2. Feature class is resolved as `COALESCE(NULLIF(fclass_{worldview}, ''), fclass_iso)` — **always**. The POV fields are sparse deltas: `FCLASS_US` is null for 249 of 258 records, `FCLASS_CN` for 244, `FCLASS_IN` for 248. A renderer keyed directly on `fclass_{worldview}` draws nothing for ~96% of features.
3. The real value domain is `Admin-0 country`, `Admin-0 dependency`, `Unrecognized`, `Admin-0 lease`, `Admin-0 breakaway and disputed`, `Admin-1 region`, `Admin-1 states provinces`, and empty. **`Disputed`, `Indeterminate` and `Breakaway` do not exist and match nothing.** A unit test asserts the observed domain against the committed geometry.
4. Rendering: solid for `Admin-0 country` and `Admin-0 dependency`; **dashed** for `Admin-0 breakaway and disputed` and `Unrecognized`; **dotted** for lines of control.
5. **Statistics are keyed to `iso3`, never to a polygon.** Every geometry row carries `worldview`; every fact row's source carries `source_worldview`. The join predicate requires equality. There is no `allow_cross_worldview` escape hatch in v1.
6. Required copy, rendered non-dismissibly: the map disclaimer *"The boundaries and names shown and the designations used on this map do not imply official endorsement or acceptance."*; the Jammu & Kashmir note *"Dotted line represents approximately the Line of Control in Jammu and Kashmir agreed upon by India and Pakistan. The final status of Jammu and Kashmir has not yet been agreed upon by the parties."*; the Kosovo formula *"This designation is without prejudice to positions on status and is in line with UNSCR 1244 and the ICJ Opinion on the Kosovo declaration of independence."*; and for Abyei *"Final boundary … has not yet been determined."*
7. Crimea and the occupied oblasts count within Ukraine under `UN`. State explicitly that post-2022 figures for those oblasts are unreliable.

#### Year alignment

- `year` in the fact table is a **period-start key**, always an integer calendar year. `period_type` disambiguates what the period is.
- The §6 fact-table column list is the **minimum** column set. A physical table may add the key columns its `period_type` requires (`month` for monthly, `quarter` for quarterly) and **must** declare them in the manifest's `timeKey`. No physical table may omit a §6 column.
- The spine grid is `manifest.cube.years` = `[1990 … 2023]`, 34 entries. Nothing downstream hard-codes 1990, 2023 or 34.
- The period grid is six periods, each `[start, start+4]` **inclusive of five years**: 1990-1995 … 2015-2020, keyed by `start` ∈ `{1990,1995,2000,2005,2010,2015}`.
- `A_p = Σ_{y ∈ [start, start+4]} GA.mig_prev(o,d,y)`. `B_p = Σ_{sex} AC.da_pb_closed(o,d,start, type='outward')`. Compared **as period totals only**. Never annualise Abel & Cohen. Corridor-years outside the shared grid — which is every year from 2020 on — return `Refusal('NoSharedPeriodGrid')`.
- `d_p` is **held constant across every year in its period**, so the hatch density visibly steps at period boundaries. That step is the data, not an artefact to smooth.
- `align(series, grid, method)` defaults to **`"none"`**. A missing year is a visible gap on the sparkline. The signature exists so a future caller must name an interpolation method explicitly and be seen doing it.
- **`vintage_date` is not `year`.** `vintage_date` is when the publisher released or the connector extracted; `year` is the reference period. The WHO GHO rows for Germany carry `Date: 2025-09-30` on both the 2018 and the 2023 observation — key on `TimeDim`, and **sort by `TimeDim` before taking a latest value, because the array is unsorted and the first element is not the newest.**

#### The unit registry

Every column in every table declares a `UnitId` in the manifest. An undeclared unit fails `snapshot:build`. Conversions run **once**, at `transform()`, and are unit-tested.

| Source field | Ships as | Convert to | Trap if you don't |
|---|---|---|---|
| WPP `SRB` | males per 100 females (105.8) | `/100` → `ratio` | 99.1% male birth share |
| WPP `ASFR` | per 1,000 women | `/1000` → `fraction` | TFR off by 1000× |
| WPP `TPopulation*`, `Births`, `Deaths`, `NetMigrations` | thousands | `×1000` → `persons` | Every demographic figure off by 1000× |
| WHO `WHS6_102` | per 10,000 population | `/10` → `per_1000_pop` | Beds density off by 10× |
| WHO `HRH_26`, `HRH_33` | per 1,000 population | none → `per_1000_pop` | — |
| WDI `NY.GDP.PCAP.PP.KD` | **constant 2021 international $** | none → `usd_2021_ppp_per_capita` | A 2011-PPP threshold silently compared against 2021-PPP values |
| GHS-POP | persons per 1 km² Mollweide pixel | sum to H3 r3 → `persons`; area from `h3-js cellArea(h3,'km2')` → `km2` | Raw counts read as density; r3 cell areas vary enough to invert the reading |
| Eurostat, UNHCR numerics | strings, and `"-"` | coerce; `"-"` → **null, never 0** | A sentinel rendered as zero |

**The dimensionless-ratio rule.** `assertSameUnit(a, b)` is called before every division in `@exodus/kernel`. M1's `H_k = ((r_k / t_k) − 1) · P / T` requires `r_k` and `t_k` in the *same* per-capita unit so the ratio is dimensionless. This is the form that structurally prevents the factor-of-1,000 error: you never multiply a per-1,000 rate by population without dividing by 1,000, because the type system will not let you divide `per_1000_pop` by `persons`.

#### Missing data

- **Nothing is imputed. Ever.** The absorptive-capacity research describes a four-step imputation ladder (same-country latest → linear interpolation → region median → income-group median). **Do not implement it.** v1 imputes nothing.
- A missing value is an absent row. The renderer shows `—` with a badge naming the source that was queried and the reason it had nothing.
- A missing *set* of values produces a typed `Refusal`: fewer than three `K_stock` indicators for a country → `Refusal('NoServiceStockData')`; a non-EU pair asked for the mirror → `Refusal('NoMirrorPair')`; a corridor-year outside the shared period grid → `Refusal('NoSharedPeriodGrid')`.
- **`estimate_kind='assumed_zero'` has no producer in v1.** The value exists in the enum for connectors whose publisher declares a corridor zero by fiat. `bundle:verify` fails any `assumed_zero` row whose connector has not registered a `declaredZeroRule` naming the publisher statement. If you find yourself wanting to write one, you are about to invent data.
- **A measured zero is not a missing value.** An H3 cell whose GHS-POP intersection sums to zero carries `pop = 0`. A cell with no land intersection carries `pop = null` and renders in the no-data hatch, not at the ramp floor. A test asserts both cases exist in `h3_pop.parquet`.
- **No stale-vintage drop rule.** Old data is kept and its age is rendered. Silently deleting a 2017 observation because it is old is editing, not hygiene.

### 3.5 The provenance model, ingestion to tooltip

The chain has five links and no gaps.

**1. Declaration.** Each connector exports a `SourceEntry` (typed in §3.8) carrying provider, licence, cadence, latency class, coverage, its `plan()` output and its known traps. This is the row rendered on `/sources`. `plan()` is **declarative and inspectable without running** — `/sources` renders the exact URLs the system would fetch, with headers, as text.

**2. Stamping.** `transform()` is pure and stamps every `Fact` with `source_id`, `vintage_date`, `latency_days`, `estimate_kind`, `license_id`, `redistributable`, plus `obs_flag` and `conf_status` where the source supplies them. `snapshot:build` rejects a row missing any of the six with `MissingProvenance: <sourceId> row <n> lacks <field>`.

**3. Inheritance.** Any derived value in `@exodus/semantic` calls `inheritProvenance(parts)`, which takes the **worst** `latencyClass`, the **worst** `estimateKind`, the **oldest** `vintageDate`, the **largest** `latencyDays`, the logical **AND** of `redistributable`, and the union of `sourceIds` and `licenseIds`. The badness orders are declared once, as const arrays, and are the only orders used:

- `latencyClass`: `live < daily < periodic < annual < modelled < projected`
- `estimateKind`: `observed < observed_flagged < modelled < extrapolated < assumed_zero`

**4. Rendering.** `<Figure>` is the only component permitted to render a number, enforced by a JSX AST rule that fails the build on any numeric literal or numeric-typed expression outside it. It takes `{value, unit, sourceId, vintage, latencyDays, estimateKind, licence, ci}`. A missing value renders `—` with a badge — **never `0`**. The provenance popover opens from any `<Figure>` by click **and by keyboard** and shows source, vintage, latency days, estimate kind, licence and CI.

**5. The global AS-OF chip** shows the **oldest** contributing vintage in the current working set. Showing the newest is the lie.

**Known traps are product copy bound to fixture-backed tests.** Each trap has an `id`, a `body` (the sentence rendered on `/sources`), a `fixture` path and a `test` id. If a trap stops being true, its test fails and CI goes red — the ledger cannot rot. The v1 trap set:

| Trap id | Body (the claim the test defends) |
|---|---|
| `trap.gaskin-abel.self-pairs` | The file includes `orig == dest` rows (`ABW,ABW,1990,…`). They are filtered at ingest |
| `trap.gaskin-abel.tensor` | `T.nc` is 3,352,781,156 B and is never fetched; `plan()` contains no reference to it |
| `trap.gaskin-abel.modelled` | Estimates are synthetic outputs of a neural-network ensemble, 73% test correlation, never derived by aggregating individual records; African net migration is least certain |
| `trap.abel-cohen.no-sex-total` | `sex ∈ {female, male}` only — there is no total row; you must sum |
| `trap.abel-cohen.type-triple-count` | `type ∈ {outward, return, transit}`; naive summation triple-counts |
| `trap.abel-cohen.sparse` | 1,882,416 data rows against a dense product of 1,937,664 — the file is slightly sparse; do not assume a rectangle |
| `trap.eurostat.cell-ceiling` | A query whose estimated cost exceeds 5,000,000 cells is rejected or diverted to the async API. Chunk by year |
| `trap.eurostat.obs-flag-e` | DE←SY 2023 (88,973) and 2024 (63,444) both carry `OBS_FLAG="e"`. Eurostat rows are not uniformly observed |
| `trap.eurostat.geo-codes` | Eurostat GEO uses `UK` not `GB`, `EL` not `GR`, `XK` for Kosovo |
| `trap.wpp.multimember-gzip` | The `.csv.gz` files are multi-member. A single-member reader returns 634 bytes and zero rows with **no error** |
| `trap.wpp.srb-scale` | `SRB` ships as males per 100 females |
| `trap.wpp.asfr-scale` | `ASFR` ships per 1,000 women |
| `trap.wpp.thousands` | Population, births, deaths and net migration ship in thousands |
| `trap.wpp.loctype` | 234 aggregate groupings carry a blank `LocTypeName` and blank `ISO3_code` |
| `trap.who.timedim` | Key the year on `TimeDim`, never `Date`; the response array is unsorted |
| `trap.who.upstream` | Rows whose `Comments` credit OECD Health Statistics are outside WHO's own terms |
| `trap.who.licence` | WHO's two live terms pages disagree on whether GHO data is CC BY 4.0 or non-commercial. Unresolved |
| `trap.wdi.ppp-base` | `NY.GDP.PCAP.PP.KD` is constant **2021** international $ |
| `trap.cepii.absent-fields` | `distw`, `distwces`, `colony` and `smctry` **do not exist** in Gravity — they are legacy GeoDist |
| `trap.cepii.colonial-dummy` | `comcol` and `col45` are alternative specifications of one dummy. They are a radio group; selecting both double-counts |
| `trap.naturalearth.fclass-sparse` | `FCLASS_US` is null for 249 of 258 records |
| `trap.naturalearth.fclass-domain` | `Disputed`, `Indeterminate` and `Breakaway` are not values in this dataset |
| `trap.naturalearth.layer-name` | The layer is `ne_10m_admin_0_disputed_areas`; `breakaway_disputed_areas` 403s |
| `trap.h3.density` | r3 cell areas vary; render `pop / area_km2`, never raw count |
| `trap.gdelt.http-urls` | `lastupdate.txt` embeds `http://` URLs; rewrite to HTTPS. The translingual feed lags one 15-minute slot |
| `trap.gdelt.gkg-size` | GKG is ~5.3–5.9 MB per 15-minute slot and is excluded from the corpus |
| `trap.gdacs.icon-path` | Read `alertlevel`/`alertscore`/`episodealertlevel`. In a sampled row `icon` said Green while `alertlevel` said Orange |
| `trap.iom-mm.coordinates` | Coordinates are dropped at ingest. There is no Missing Migrants map layer |
| `trap.undesa.user-agent` | `un.org` returns 403 to a default UA and 200 to `Mozilla/5.0 (X11; Linux x86_64)` |
| `trap.undesa.extrapolated` | 60 of 233 countries were reassessed in 2024; the remaining 173 are extrapolations of the 2020 edition |
| `trap.unhcr.cf-type` | Without `cf_type=ISO`, `coa=DEU` returns **0 rows at HTTP 200** — indistinguishable from no data |
| `trap.unhcr.code-collision` | `AUS` is Austria in UNHCR and Australia in ISO 3166-1; `CHI` is China. Join on `coo_iso`/`coa_iso` |
| `trap.unhcr.rounding` | Values below five are rounded to the nearest multiple of five. **There is no asterisk convention — do not build asterisk parsing** |

### 3.6 Suppression and rounding

Runs inside `snapshot:build`, after normalisation, before write. **Rounding runs after suppression, never instead of it.**

- K = **25** at ADM0×ADM0. Denominator floor 10,000 population.
- **Complementary suppression**: in any margin with exactly one suppressed cell, suppress the next-smallest cell in that margin.
- **Frozen suppression**: once suppressed, always suppressed. The decision is appended to `snapshot/suppression-ledger.json`, which is committed and append-only. A test asserts append-only by replaying the ledger's prior state from git history and failing on any removed or mutated entry.
- A suppressed cell is **omitted from the table**, not written as zero and not written as null-with-a-flag. The renderer sees no row, looks up the key in the ledger, and renders `—` with the badge *"suppressed: fewer than 25"*. The ledger is the provenance of the gap.
- Rounding after suppression: `5·round(n/5)` below 1,000; `10·round(n/10)` below 10,000; 3 significant figures above.
- Gridded people layers are capped at H3 r3. `bundle:verify` fails on any finer cell.

### 3.7 `bundle:verify` — the gates

Runs over `snapshot/` and `corpus/` and exits non-zero naming the reason on stderr. Each gate has a seeded-violation test.

| # | Gate |
|---|---|
| 1 | Every row of every table has non-null `license_id` and `redistributable === true` |
| 2 | Every `license_id` is in the allowlist: `CC-BY-4.0`, `CC0-1.0`, `LicenseRef-CC-BY-3.0-IGO`, `LicenseRef-Etalab-2.0`, `LicenseRef-GDELT` |
| 3 | No `source_id` from the denylist appears anywhere: `undesa-ims`, `unhcr`, `acled`, `emdat`, `idmc`, `idu`, `gadm`, `mipex`, `unesco-uis`, `reliefweb`, `dtm`, `views`, `gboOpen`, `ess`. **A deliberately inserted UNHCR row must be refused and the reason named** |
| 4 | No ShareAlike or NonCommercial licence string appears in any manifest entry |
| 5 | `incidents.parquet` has no latitude, longitude or geometry column |
| 6 | No movement geometry has more than 2 vertices |
| 7 | No H3 cell in a people layer is finer than r3 |
| 8 | No nationality cross-tab below ADM0 |
| 9 | No file under `snapshot/` is a Git LFS pointer (a 134-byte file beginning `version https://git-lfs`) |
| 10 | No file under `snapshot/` exceeds 50 MiB, and the total is at or under 40 MiB |
| 11 | Every `assumed_zero` row's connector has a registered `declaredZeroRule` |
| 12 | Every table's declared sha256 matches its bytes |

### 3.8 The manifest contract

`snapshot/manifest.json` is the interface between the build and the product. The registry, the `AttributeCube`, `/sources` and the provenance chain all read it and nothing else. Swapping the spine changes the manifest, not the renderer.

All of the following lives in `packages/contracts/src/snapshot-manifest.ts`. TypeScript 7.0.2 runs with `erasableSyntaxOnly`: **no `enum`, no `namespace`** — const arrays plus derived string unions, or you get TS1294.

```ts
// packages/contracts/src/snapshot-manifest.ts

export const SNAPSHOT_SCHEMA_VERSION = '1.0.0';

export const MIB = 1_048_576;
export const SNAPSHOT_CAP_BYTES = 40 * MIB; // 41_943_040

/** Ordered worst-last. Index is the badness ordinal used by inheritProvenance. */
export const LATENCY_CLASSES = [
  'live', 'daily', 'periodic', 'annual', 'modelled', 'projected',
] as const;
export type LatencyClass = (typeof LATENCY_CLASSES)[number];

/** Ordered worst-last. */
export const ESTIMATE_KINDS = [
  'observed', 'observed_flagged', 'modelled', 'extrapolated', 'assumed_zero',
] as const;
export type EstimateKind = (typeof ESTIMATE_KINDS)[number];

export const CADENCES = [
  'sub-hour', 'daily', 'monthly', 'quarterly', 'annual', 'quinquennial', 'frozen',
] as const;
export type Cadence = (typeof CADENCES)[number];

export const PERIOD_TYPES = ['annual', '5yr', 'monthly', 'quarterly'] as const;
export type PeriodType = (typeof PERIOD_TYPES)[number];

export const UNITS = [
  'persons', 'persons_per_year', 'ratio', 'fraction', 'percent',
  'per_1000_pop', 'per_10000_pop', 'usd_2021_ppp_per_capita', 'usd_current',
  'km', 'km2', 'persons_per_km2', 'years', 'count', 'dimensionless',
  'iso_year', 'iso_month', 'iso_date', 'code', 'text',
] as const;
export type UnitId = (typeof UNITS)[number];

export const VERIFICATION_STATES = ['verified', 'unverified', 'fallback-applied'] as const;
export type VerificationState = (typeof VERIFICATION_STATES)[number];

export const TIERS = ['A', 'B', 'recipe', 'excluded'] as const;
export type Tier = (typeof TIERS)[number];

export const ACCESS_KINDS = [
  'bulk-file', 'rest', 'sdmx', 'jsonstat', 'derived', 'recorded',
] as const;
export type AccessKind = (typeof ACCESS_KINDS)[number];

/** Declarative and inspectable WITHOUT running. Rendered verbatim on /sources. */
export interface FetchPlan {
  readonly url: string;
  readonly method: 'GET' | 'POST';
  readonly headers: Readonly<Record<string, string>>;
  /** Why this request exists, in one sentence. Rendered on /sources. */
  readonly note: string;
  readonly expectedBytes: number | null;
  readonly sha256: string | null;
}

export interface LicenceRef {
  /** SPDX id, or 'LicenseRef-<slug>' where no SPDX id exists. */
  readonly spdx: string;
  readonly url: string;
  readonly attribution: string;
  readonly redistributable: boolean;
  readonly commercialUse: boolean;
  readonly shareAlike: boolean;
  readonly verification: VerificationState;
  readonly note: string | null;
}

/** Product copy on /sources, bound by id to a fixture-backed regression test. */
export interface KnownTrap {
  readonly id: string;      // 'trap.<sourceId>.<slug>'
  readonly body: string;
  readonly fixture: string; // repo-relative path under packages/connectors/<id>/fixtures/
  readonly test: string;    // vitest test id that fails if the trap stops being true
}

export interface Coverage {
  readonly iso3: readonly string[] | 'all';
  readonly years: readonly [number, number] | null;
  readonly note: string | null;
}

export interface SourceEntry {
  readonly id: string;
  readonly provider: string;
  readonly title: string;
  readonly tier: Tier;
  /** One entry may be served by several connectors (e.g. 'wdi-who' -> wdi, who-gho). */
  readonly connectorIds: readonly string[];
  readonly gives: string;
  readonly role: string;
  readonly accessKind: AccessKind;
  readonly plans: readonly FetchPlan[];
  readonly accessVerification: VerificationState;
  readonly format: string;
  readonly coverage: Coverage;
  /** Newest observation reference date present in the bundle, YYYY-MM-DD. */
  readonly newestVintage: string | null;
  /** Oldest observation reference date present in the bundle, YYYY-MM-DD. */
  readonly oldestVintage: string | null;
  /** When the connector last extracted, YYYY-MM-DD. Never conflated with vintage. */
  readonly extractedAt: string | null;
  readonly cadence: Cadence;
  readonly latencyClass: LatencyClass;
  readonly licence: LicenceRef;
  readonly rawBytes: number | null;
  readonly committedBytes: number;
  readonly traps: readonly KnownTrap[];
  /** Populated when a §3.2 fallback was applied. Rendered as a refusal on /methods. */
  readonly fallbackApplied: {
    readonly reason: string;
    readonly httpStatus: number | null;
    readonly date: string;
  } | null;
}

export interface ColumnEntry {
  readonly name: string;
  /** Arrow type name, e.g. 'Utf8' | 'Int32' | 'Float32' | 'Date32' | 'Uint64'. */
  readonly arrowType: string;
  readonly unit: UnitId;
  readonly nullable: boolean;
}

export interface TableEntry {
  /** Relative to snapshot/, e.g. 'flows.parquet' or 'geo/adm0.geojson.gz'. */
  readonly path: string;
  readonly format: 'parquet' | 'arrow' | 'geojson.gz' | 'json';
  readonly compression: 'snappy' | 'gzip' | 'none';
  readonly periodType: PeriodType | null;
  /** Key columns for the time dimension: ['year'] | ['year','month'] | ['year','quarter'] | []. */
  readonly timeKey: readonly string[];
  /** Deterministic write order. snapshot:build is byte-reproducible under this key. */
  readonly sortKey: readonly string[];
  readonly rows: number;
  readonly bytes: number;
  readonly sha256: string;
  readonly sourceIds: readonly string[];
  readonly columns: readonly ColumnEntry[];
}

export interface CubeAttribute {
  /** Stable id consumed by the globe: 'width' | 'dash' | 'opacity' in v1. */
  readonly id: string;
  readonly table: string;
  readonly column: string;
  readonly unit: UnitId;
  /** Pre-quantisation range used to build the GPU buffer. */
  readonly domain: readonly [number, number];
  readonly quantisation: 'f32' | 'u8';
}

/**
 * The Year Machine reads ONLY this. Corridor count, year range and attribute list
 * come from here, never from any dataset's name.
 */
export interface CubeSpec {
  readonly entityPairIdColumn: string;
  readonly corridorCount: number;
  readonly years: readonly number[];
  readonly attributes: readonly CubeAttribute[];
}

export interface PeriodRef {
  readonly id: string;        // '1990-1995'
  readonly startYear: number; // inclusive
  readonly endYear: number;   // inclusive; a period spans 5 years
}

export interface ExclusionEntry {
  readonly id: string;
  readonly title: string;
  readonly reason: string;
  readonly licenceUrl: string;
  readonly returnsWhen: string;
}

export interface BudgetEntry {
  readonly capBytes: number;
  readonly totalBytes: number;
  /** Cut-ladder steps applied, in the order applied. Empty when under cap on the first build. */
  readonly cutLadderApplied: readonly string[];
}

export interface SuppressionEntry {
  readonly k: number;                 // 25
  readonly denominatorFloor: number;  // 10_000
  readonly ledgerPath: string;        // 'snapshot/suppression-ledger.json'
  readonly ledgerSha256: string;
  readonly suppressedCells: number;
}

export interface SnapshotManifest {
  readonly schemaVersion: typeof SNAPSHOT_SCHEMA_VERSION;
  readonly builtAt: string;       // ISO-8601; the ONLY timestamp in the bundle
  readonly builderCommit: string;
  /** True when produced by `snapshot:build --from-fixtures`. Drives a visible banner. */
  readonly fromFixtures: boolean;
  /** True only when produced by `fixtures:synth`. Forces the SYNTHETIC banner. */
  readonly synthetic: boolean;
  readonly worldview: 'UN';
  readonly budget: BudgetEntry;
  readonly sources: readonly SourceEntry[];
  readonly tables: readonly TableEntry[];
  readonly cube: CubeSpec;
  readonly periodGrid: readonly PeriodRef[];
  readonly exclusions: readonly ExclusionEntry[];
  readonly suppression: SuppressionEntry;
}
```

The fact interface and the provenance object it carries, in the same package:

```ts
// packages/contracts/src/fact.ts

export interface Provenance {
  readonly sourceIds: readonly string[];
  readonly vintageDate: string;   // YYYY-MM-DD; the OLDEST when derived
  readonly latencyDays: number;   // the LARGEST when derived
  readonly latencyClass: LatencyClass;
  readonly estimateKind: EstimateKind;
  readonly licenseIds: readonly string[];
  readonly redistributable: boolean;
}

export interface Fact {
  readonly originIso3: string;
  readonly destIso3: string;
  readonly year: number;          // period-start key
  readonly periodType: PeriodType;
  readonly sex: 'm' | 'f' | 't';
  readonly ageBand: string | null;
  readonly measureCode: string;
  readonly value: number | null;  // null is a gap, never a zero
  readonly unit: UnitId;
  readonly sourceId: string;
  readonly vintageDate: string;
  readonly latencyDays: number;
  readonly estimateKind: EstimateKind;
  readonly obsFlag: string | null;
  readonly confStatus: string | null;
  readonly ciLow: number | null;
  readonly ciHigh: number | null;
  readonly licenseId: string;     // NOT NULL. A row without it fails ingest.
  readonly redistributable: boolean; // NOT NULL.
}

/**
 * Worst latency class, worst estimate kind, oldest vintage, largest latency,
 * AND of redistributable, union of ids. Pure. Unit-tested against a fixture
 * that mixes an `observed` Eurostat row with a `modelled` spine row and asserts
 * the result is `modelled` with the Eurostat vintage when Eurostat is older.
 */
export declare function inheritProvenance(parts: readonly Provenance[]): Provenance;

/** Throws unless both operands carry the same UnitId. Called before every division in kernel. */
export declare function assertSameUnit(a: UnitId, b: UnitId): void;
```

The Zod mirror lives beside it and generates `snapshot/manifest.schema.json` via `z.toJSONSchema()`; `snapshot:build` validates its own output against it before writing, and the web app validates the manifest at load and refuses to render on a parse failure rather than degrading silently:

```ts
// packages/contracts/src/snapshot-manifest.zod.ts
import { z } from 'zod';
import {
  CADENCES, ESTIMATE_KINDS, LATENCY_CLASSES, PERIOD_TYPES, TIERS,
  UNITS, VERIFICATION_STATES, ACCESS_KINDS, SNAPSHOT_CAP_BYTES,
} from './snapshot-manifest.js';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');
const sha256 = z.string().regex(/^[0-9a-f]{64}$/, 'lowercase hex sha256');

export const FetchPlanSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'POST']),
  headers: z.record(z.string(), z.string()),
  note: z.string().min(1),
  expectedBytes: z.number().int().positive().nullable(),
  sha256: sha256.nullable(),
});

export const LicenceRefSchema = z.object({
  spdx: z.string().min(1),
  url: z.string().url(),
  attribution: z.string().min(1),
  redistributable: z.boolean(),
  commercialUse: z.boolean(),
  shareAlike: z.boolean(),
  verification: z.enum(VERIFICATION_STATES),
  note: z.string().nullable(),
});

export const KnownTrapSchema = z.object({
  id: z.string().regex(/^trap\.[a-z0-9-]+\.[a-z0-9-]+$/),
  body: z.string().min(1),
  fixture: z.string().min(1),
  test: z.string().min(1),
});

export const ColumnEntrySchema = z.object({
  name: z.string().min(1),
  arrowType: z.string().min(1),
  unit: z.enum(UNITS),
  nullable: z.boolean(),
});

export const TableEntrySchema = z.object({
  path: z.string().min(1),
  format: z.enum(['parquet', 'arrow', 'geojson.gz', 'json']),
  // zstd is a build failure: the browser reader is not guaranteed to decode it.
  compression: z.enum(['snappy', 'gzip', 'none']),
  periodType: z.enum(PERIOD_TYPES).nullable(),
  timeKey: z.array(z.string()),
  sortKey: z.array(z.string()).min(1),
  rows: z.number().int().nonnegative(),
  bytes: z.number().int().positive(),
  sha256,
  sourceIds: z.array(z.string()).min(1),
  columns: z.array(ColumnEntrySchema).min(1),
});

export const SourceEntrySchema = z.object({
  id: z.string().min(1),
  provider: z.string().min(1),
  title: z.string().min(1),
  tier: z.enum(TIERS),
  connectorIds: z.array(z.string()).min(1),
  gives: z.string().min(1),
  role: z.string().min(1),
  accessKind: z.enum(ACCESS_KINDS),
  plans: z.array(FetchPlanSchema),
  accessVerification: z.enum(VERIFICATION_STATES),
  format: z.string().min(1),
  coverage: z.object({
    iso3: z.union([z.array(z.string().length(3)), z.literal('all')]),
    years: z.tuple([z.number().int(), z.number().int()]).nullable(),
    note: z.string().nullable(),
  }),
  newestVintage: isoDate.nullable(),
  oldestVintage: isoDate.nullable(),
  extractedAt: isoDate.nullable(),
  cadence: z.enum(CADENCES),
  latencyClass: z.enum(LATENCY_CLASSES),
  licence: LicenceRefSchema,
  rawBytes: z.number().int().positive().nullable(),
  committedBytes: z.number().int().nonnegative(),
  traps: z.array(KnownTrapSchema),
  fallbackApplied: z.object({
    reason: z.string().min(1),
    httpStatus: z.number().int().nullable(),
    date: isoDate,
  }).nullable(),
});

export const SnapshotManifestSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  builtAt: z.string().datetime(),
  builderCommit: z.string().min(7),
  fromFixtures: z.boolean(),
  synthetic: z.boolean(),
  worldview: z.literal('UN'),
  budget: z.object({
    capBytes: z.literal(SNAPSHOT_CAP_BYTES),
    totalBytes: z.number().int().max(SNAPSHOT_CAP_BYTES),
    cutLadderApplied: z.array(z.string()),
  }),
  sources: z.array(SourceEntrySchema).min(1),
  tables: z.array(TableEntrySchema).min(1),
  cube: z.object({
    entityPairIdColumn: z.string().min(1),
    corridorCount: z.number().int().positive(),
    years: z.array(z.number().int()).min(1),
    attributes: z.array(z.object({
      id: z.string().min(1),
      table: z.string().min(1),
      column: z.string().min(1),
      unit: z.enum(UNITS),
      domain: z.tuple([z.number(), z.number()]),
      quantisation: z.enum(['f32', 'u8']),
    })).min(1),
  }),
  periodGrid: z.array(z.object({
    id: z.string().regex(/^\d{4}-\d{4}$/),
    startYear: z.number().int(),
    endYear: z.number().int(),
  })),
  exclusions: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    reason: z.string().min(1),
    licenceUrl: z.string().url(),
    returnsWhen: z.string().min(1),
  })).min(3), // UN DESA, UNHCR, ACLED are mandatory rows
  suppression: z.object({
    k: z.literal(25),
    denominatorFloor: z.literal(10_000),
    ledgerPath: z.literal('snapshot/suppression-ledger.json'),
    ledgerSha256: sha256,
    suppressedCells: z.number().int().nonnegative(),
  }),
});

export type SnapshotManifestParsed = z.infer<typeof SnapshotManifestSchema>;
```

Note the two schema-level gates: `budget.totalBytes` cannot exceed the cap, and `exclusions` cannot have fewer than three entries. The 40 MiB cap and the three named exclusions are not policy someone remembers to check — they are parse errors.

### 3.9 Acceptance criteria for this section

| # | Criterion |
|---|---|
| D1 | `pnpm verify:sources` runs at M0 with the network on, prints a per-source verification table, and writes every resolution or fallback to `DECISIONS.md` |
| D2 | `pnpm ingest && pnpm snapshot:build` produces every Tier A file from raw sources |
| D3 | `pnpm snapshot:build --from-fixtures` produces the 2 MiB demo slice **with the network off**, and running it twice yields identical sha256 for every table |
| D4 | `pnpm snapshot:measure` prints per-table compressed bytes, writes them into the manifest, and exits non-zero above 41,943,040 bytes |
| D5 | Every row of every table carries `license_id` and `redistributable`; a row missing either fails ingest with a named error |
| D6 | `bundle:verify` refuses a deliberately inserted UNHCR row and names the reason on stderr; each of its twelve gates has a seeded-violation test |
| D7 | The crosswalk resolves all five namespaces, with `AUS`, `CHI`, `UK`/`GB`, `EL`/`GR`, `XK` and Sudan-2011 unit-tested |
| D8 | WPP normalisation is unit-tested (`SRB/100` must not yield a 99.1% male birth share) and the multi-member gzip reader is asserted to return **> 600,000 rows, not 634 bytes** |
| D9 | Abel & Cohen is asserted to be summed across `sex` and filtered to `type='outward'` |
| D10 | `manifest.json` validates against `manifest.schema.json`; the web app refuses to render on a parse failure rather than degrading silently |
| D11 | Every source in the manifest appears on `/sources` with its `plan()` URLs, measured bytes, verification badge and trap list; the three exclusion rows are present |
| D12 | Every trap id is bound to a fixture-backed test; removing the fixture or changing the upstream behaviour fails CI |
| D13 | No workspace `package.json` declares an install-time script performing network I/O; `check:policy` fails a seeded violation |
| D14 | A fixture with a deliberately missing value renders `—` with a badge and never `0`; a fixture with fewer than three `K_stock` indicators renders `Refusal('NoServiceStockData')` as a sentence |

---

## 4. Ontology and semantic layer

This section defines the object model that every other part of Exodus is a view over. Build it first inside `packages/contracts` and `packages/semantic`; every panel, layer, model and route in §3 and §6 reads it and nothing else.

Read three sentences before you write a line of it:

1. **The ontology is a type system and a registry. It is not a page generator.** Decision 15 and kill-list item 15 stand: there are no `/o/{typeId}/{objectId}` routes, no generated object pages, no `/graph`. Six routes exist. The ontology's job is to make a *new dataset* a data change instead of a code change — not to spawn screens.
2. **The ontology adds no fourth plugin contract.** §6 ships exactly three (`DataSource`, `MapLayer`, `Model`). Object types, link types and indicator specs are *data*, validated by Zod schemas in `packages/contracts`, emitted into `snapshot/manifest.json` by `pnpm snapshot:build`, and loaded by `packages/registry` at boot.
3. **The word `entity` is banned in identifiers by `@exodus/policy` rule module 4** (`entity → place|indicator`). Use the Foundry vocabulary instead: *object type, property, link type, function*. §6 writes `buildAttributeCube` as generic over `(entityPairId, year, value)`; **the field ships as `pairId`.** It is the same field. Do not reintroduce `entityPairId` anywhere — `pnpm check:policy` fails the build on it.

### 4.1 Foundry vocabulary, mapped

| Palantir Foundry term | Exodus artefact | Where it lives |
|---|---|---|
| Object type | `ObjectTypeSpec` (nine of them, §4.2) | `packages/contracts/src/ontology/object-types.ts` |
| Property | `Fact` rows keyed by `IndicatorSpec.id`, plus a small fixed set of intrinsic fields on each object | `packages/contracts/src/ontology/facts.ts` |
| Link type | `LinkTypeSpec` (§4.5), traversed in `semantic` | `packages/contracts/src/ontology/links.ts` |
| Function | `Model` (M1–M5), pure, `Result<T> = Ok<T> | Refusal` | `packages/kernel` |
| Interface | the three plugin contracts | `packages/contracts` |
| **Action type** | **not implemented.** v1 is a static site with no writes and no server. Do not add one. | — |

### 4.2 The nine object types

`packages/contracts/src/ontology/object-types.ts`:

```ts
export const OBJECT_TYPES = [
  'place', 'corridor', 'cohort', 'worldEvent',
  'indicator', 'scenario', 'policy', 'occupation', 'source',
] as const;
export type ObjectTypeId = (typeof OBJECT_TYPES)[number];

/** Where this type's rows physically live. The single most useful field in the file. */
export const STORAGE_KINDS = ['snapshot', 'derived', 'url', 'reserved'] as const;
export type StorageKind = (typeof STORAGE_KINDS)[number];

/** Cmd+K sigil, or false for "never indexed". No type is ever person-shaped. */
export type PaletteSigil = '>' | '#' | '@' | '~' | false;

export interface ObjectTypeSpec {
  readonly id: ObjectTypeId;
  /** Canonical id form. Ids are OURS and stable; never a source's own key. */
  readonly idPattern: RegExp;
  readonly storage: StorageKind;
  /** Tier A table basename, or null when storage !== 'snapshot'. */
  readonly table: string | null;
  readonly populatedInV1: boolean;
  readonly paletteSigil: PaletteSigil;
  /** MANDATORY when populatedInV1 is false: renders verbatim on /methods. */
  readonly reservedReason?: string;
  /** MANDATORY when populatedInV1 is false: the condition that populates it. */
  readonly populatedWhen?: string;
}
```

The registry, verbatim, with v1 status:

| `id` | `idPattern` example | storage | table | v1 | Cmd+K | Why |
|---|---|---|---|---|---|---|
| `place` | `place:DEU`, `place:h3:832a10fffffffff` | `snapshot` | `places` | yes | `@` | 258 ADM0 + 41,162 H3 r3 cells |
| `corridor` | `corridor:SYR-DEU` | `snapshot` | `corridors` | yes | `~` | top 12,000 spine corridors |
| `cohort` | `cohort:t.15-64` | `snapshot` | `cohorts` | yes | `false` | WPP age×sex buckets; **aggregate buckets, never people** |
| `worldEvent` | `worldEvent:usgs:us7000abcd` | `snapshot` | `corpus_events` | yes | `false` | 72h replay corpus, `SNAPSHOT` chrome |
| `indicator` | `indicator:physicians_per_1k` | `snapshot` | `manifest.json#indicators` | yes | `#` | the indicator registry, §4.6 |
| `source` | `source:gaskin-abel` | `snapshot` | `manifest.json#sources` | yes | `#` | drives `/sources` and every provenance popover |
| `scenario` | `scenario:url` | `url` | `null` | yes | `false` | the decoded permalink, §4.8. **Not** a scenario engine |
| `policy` | `policy:mipex:DEU:2025` | `reserved` | `null` | **no** | `false` | MIPEX 56 / IMPIC 33 / DEMIG-QuantMig 31 countries; no global policy index exists, and MIPEX publishes no machine-readable current edition. Populated when a ≥150-country, openly-licensed, machine-readable policy series exists |
| `occupation` | `occupation:isco08:2211` | `reserved` | `null` | **no** | `false` | ILOSTAT gives ISCO 1-digit crossed with birth status only; no vacancy dataflow exists; vacancies cover ~37 reporters. Populated when a source gives employment × ≥2-digit ISCO × birth status for ≥150 countries |

`Place` has one further reserved arm: `kind: 'admin1'`. Declared in the type, **zero rows in v1** (ADM1 polygons are cut, decision 12). Declaring it costs nothing and means a v2 ADM1 source is an ingest change, not a schema migration.

A reserved type is not decoration. `snapshot:build` asserts `rowCount === 0` for every type whose `populatedInV1` is false, and `/methods` renders `reservedReason` and `populatedWhen` as prose. A reserved type that acquires rows fails CI.

### 4.3 Place

```ts
export const PLACE_KINDS = ['country', 'admin1', 'h3cell'] as const;
export type PlaceKind = (typeof PLACE_KINDS)[number];

export interface Place {
  /** 'place:DEU' | 'place:DEU.BY' (reserved) | 'place:h3:<index>' */
  readonly id: string;
  readonly kind: PlaceKind;
  readonly iso3: string | null;          // null iff kind === 'h3cell'
  readonly m49: number | null;
  readonly name: string;
  /** Validity window. Sudan-2011, Serbia-Montenegro-2006, USSR, Yugoslavia are real rows. */
  readonly validFrom: string;            // ISO 8601 date
  readonly validTo: string | null;
  readonly successorIds: readonly string[];
  /** lon, lat. The ONLY arc endpoint source. null for h3cell and admin1. */
  readonly centroid: readonly [number, number] | null;
  /** Natural Earth 5.1.1, COALESCE(NULLIF(fclass_{pov},''), fclass_iso). */
  readonly fclass: string | null;
  readonly cell: { readonly h3: string; readonly resolution: 3; readonly areaKm2: number } | null;
  /** Written by `semantic`. No layer author can read or set this. */
  readonly coverage: CoverageScore | null;
}

/** M4. Author construction, badged as such everywhere it renders. */
export interface CoverageScore {
  readonly c: number;                    // [0,1] = 0.4*(m/M) + 0.3*exp(-dt/5) + 0.3*fObs
  readonly measuresPresent: number;      // m
  readonly measuresRequested: number;    // M
  readonly newestVintageAgeYears: number;// dt
  readonly observedShare: number;        // fObs, share of rows with estimateKind in {observed, observed_flagged}
  readonly construction: 'corridor-author-construction-v1';
}
```

Rules that are enforced, not documented:

- **`resolution` is the literal `3`.** The type cannot express an r4 people cell. Kill-list item 20, made structural.
- **`coverage` is absent from every type visible to a `MapLayer` author.** `MapLayer.encode(facts: Fact[]): LayerSpec` receives `Fact[]`, and `Fact` has no `coverage` field. Opacity is merged after `encode()` in `semantic`. Write the type-level test that proves `LayerSpec` has no assignable opacity key.
- **`centroid` is the only geometry a corridor may touch.** H3 cells and admin1 places carry `centroid: null`, so a corridor cannot be built from them at the type level.

### 4.4 Corridor, Cohort, WorldEvent

```ts
export interface Corridor {
  readonly id: string;                   // 'corridor:SYR-DEU', route /corridor/SYR-DEU
  readonly originPlaceId: string;        // MUST resolve to a Place with kind === 'country'
  readonly destPlaceId: string;
  readonly inSpine: boolean;             // in the top 12,000 by mean 2015–2023 mig_prev
  readonly spineRank: number | null;
  /**
   * EXACTLY TWO POINTS, both ADM0 centroids. There is no waypoint field and never
   * will be. Great-circle tessellation to 32 points happens in @exodus/globe at
   * render time and is never persisted. Zod refinement asserts length === 2.
   */
  readonly endpoints: readonly [readonly [number, number], readonly [number, number]];
  readonly dyad: DyadContext | null;
  /** min(C_origin, C_dest). Written by `semantic`. */
  readonly opacity: number;
}

export interface DyadContext {                 // CEPII Gravity 202211, Etalab 2.0
  readonly dist: number;
  readonly distcap: number;
  readonly distwHarmonic: number;              // distw / distwces DO NOT EXIST in Gravity
  readonly contig: 0 | 1;
  readonly comlangOff: 0 | 1;
  readonly comlangEthno: 0 | 1;
  /** Radio group, never two booleans. `colony` and `smctry` do not exist in Gravity. */
  readonly colonialDummy: 'comcol' | 'col45' | null;
  readonly comrelig: number;
  readonly scaledSci2021: number | null;
}

export const SEXES = ['m', 'f', 't'] as const;
export type Sex = (typeof SEXES)[number];

export interface Cohort {
  readonly id: string;                   // 'cohort:t.15-64', 'cohort:f.65+'
  readonly sex: Sex;
  readonly ageBand: string;              // '0-4' … '100+' | '15-64' | '65+' | 'all'
  /** Reserved: v1 has no ISCED or skill dimension. Typed as the literal null. */
  readonly attainment: null;
}

export const EVENT_KINDS = ['earthquake', 'disaster-alert', 'news-slot'] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

/** Named WorldEvent, not Event: `Event` is a DOM global and shadowing it is a bug farm. */
export interface WorldEvent {
  readonly id: string;
  readonly kind: EventKind;
  readonly occurredAt: string;
  readonly fetchedAt: string;
  readonly placeId: string | null;             // ADM0 only
  /**
   * Geophysical kinds ONLY. Zod refinement: kind === 'news-slot' => point === null.
   * There is no event kind whose subject is a person, so there is no code path that
   * can render a human coordinate. IOM Missing Migrants coordinates are dropped at
   * ingest and never reach this type.
   */
  readonly point: readonly [number, number] | null;
  /** GDACS alertlevel / alertscore. NEVER string-matched from the icon path. */
  readonly alertLevel: 'Green' | 'Orange' | 'Red' | null;
  readonly alertScore: number | null;
  readonly sourceId: string;
  /** Frozen literal. Corpus replay may not borrow live chrome. */
  readonly chrome: 'SNAPSHOT';
}
```

Cohort carries one further invariant, enforced by the query planner in `semantic` and by `@exodus/policy` rule module 6: **a Cohort may be crossed with a `Place` of kind `country` and nothing finer.** `crossTab(cohortId, placeId)` returns a `PolicyVerdict{deny, code, body}` for any `placeId` whose kind is `admin1` or `h3cell`. That is the nationality × sub-ADM0 ban expressed once, in the ontology, instead of in every panel.

### 4.5 Link types

`packages/contracts/src/ontology/links.ts`. Links are declarative, typed, and traversed by `semantic`; there is no graph database and no query language.

```ts
export interface LinkTypeSpec {
  readonly id: string;
  readonly from: ObjectTypeId;
  readonly to: ObjectTypeId;
  readonly cardinality: '1:1' | 'n:1' | '1:n' | 'n:n';
  readonly required: boolean;
  /** Free text, but every entry here has a named test in §4.11. */
  readonly invariant?: string;
}

export const LINK_TYPES = [
  { id: 'corridor.origin', from: 'corridor', to: 'place', cardinality: 'n:1', required: true,
    invariant: 'target Place.kind === "country"' },
  { id: 'corridor.destination', from: 'corridor', to: 'place', cardinality: 'n:1', required: true,
    invariant: 'target Place.kind === "country"' },
  { id: 'place.cells', from: 'place', to: 'place', cardinality: '1:n', required: false,
    invariant: 'source.kind === "country" && target.kind === "h3cell"; containment only' },
  { id: 'place.successors', from: 'place', to: 'place', cardinality: '1:n', required: false,
    invariant: 'only when validTo !== null; Sudan-2011, SCG-2006, USSR, YUG' },
  { id: 'indicator.boundTo', from: 'indicator', to: 'source', cardinality: 'n:1', required: true },
  { id: 'source.excludes', from: 'source', to: 'source', cardinality: 'n:n', required: false,
    invariant: 'the three /sources exclusion rows: UN DESA IMS, UNHCR, ACLED' },
  { id: 'worldEvent.at', from: 'worldEvent', to: 'place', cardinality: 'n:1', required: false,
    invariant: 'target Place.kind === "country"' },
  { id: 'cohort.of', from: 'cohort', to: 'place', cardinality: 'n:n', required: false,
    invariant: 'target Place.kind === "country" — ADM0 or coarser, always' },
  { id: 'scenario.workingSet', from: 'scenario', to: 'place', cardinality: 'n:n', required: false },
  { id: 'scenario.workingSetCorridors', from: 'scenario', to: 'corridor', cardinality: 'n:n', required: false },
] as const satisfies readonly LinkTypeSpec[];
```

There is deliberately **no** `place.people`, no `cohort.members`, no `worldEvent.subjects`. The link table is the place where a person-shaped type would have to appear, and it does not.

### 4.6 The indicator registry

An `IndicatorSpec` is authored once, in the connector that produces it, at `packages/connectors/<id>/indicators.ts`. `snapshot:build` collects every connector's exported specs, validates them, measures their coverage against the rows actually ingested, and writes them into `snapshot/manifest.json#indicators`. `packages/registry` reads that file at boot. **No core file is edited when an indicator is added.**

```ts
export const DIRECTIONS = ['higher_is_better', 'lower_is_better', 'neutral'] as const;
export type Direction = (typeof DIRECTIONS)[number];

/** UCUM-ish, deliberately not UCUM. Closed union: a new unit is a contracts change. */
export const UNITS = [
  'persons', 'persons_per_year', 'per_1k_persons', 'per_10k_persons',
  'persons_per_km2', 'ratio', 'share', 'years', 'km2',
  'usd_current', 'usd_2021_ppp',
] as const;
export type Unit = (typeof UNITS)[number];

export const PERIOD_TYPES = ['annual', '5yr', 'monthly', 'quarterly'] as const;
export type PeriodType = (typeof PERIOD_TYPES)[number];

export const ESTIMATE_KINDS = [
  'observed', 'observed_flagged', 'modelled', 'extrapolated', 'assumed_zero',
] as const;
export type EstimateKind = (typeof ESTIMATE_KINDS)[number];

export const LATENCY_CLASSES = [
  'live', 'daily', 'periodic', 'annual', 'modelled', 'projected',
] as const;
export type LatencyClass = (typeof LATENCY_CLASSES)[number];

/** Choropleth / sparkline ramp only. NOT index construction. See the ban below. */
export interface DisplayScale {
  readonly scale: 'linear' | 'log' | 'sqrt';
  readonly domain: 'observed_p05_p95' | 'fixed';
  readonly fixedDomain?: readonly [number, number];
  readonly clamp: boolean;
}

/**
 * The closed set of unit conversions a connector may apply. Named, unit-tested,
 * and the reason the factor-of-1,000 class of error cannot ship. A connector that
 * needs arithmetic outside this list is not permitted; extend the union with a test.
 */
export const CANONICALISERS = [
  'identity',
  'divide_100',        // WPP SRB: 105.8 males per 100 females -> ratio
  'divide_1000',       // WPP ASFR
  'multiply_1000',     // WPP population (thousands -> persons)
  'per_10k_to_per_1k', // WHO GHO WHS6_102
  'percent_to_share',
] as const;
export type Canonicaliser = (typeof CANONICALISERS)[number];

export interface SourceBinding {
  readonly sourceId: string;
  /** The source's own code, quarantined here. It is NEVER the indicator id. */
  readonly measureCodeAtSource: string;
  readonly unitAtSource: string;
  readonly toCanonical: Canonicaliser;
  readonly estimateKindDefault: EstimateKind;
  readonly latencyClass: LatencyClass;
  /** Per-row provenance override, e.g. WHO GHO rows whose `Comments` name OECD. */
  readonly provenanceOverrideField: string | null;
}

/** WRITTEN BY snapshot:build. Hand-authoring any field here fails CI. */
export interface MeasuredCoverage {
  readonly iso3: readonly string[];
  readonly years: readonly [number, number];
  readonly nPlaces: number;
  readonly nPlacesSince2016: number;
  readonly medianVintageYear: number;
  readonly measuredAt: string;
  readonly snapshotBuildId: string;
}

export interface IndicatorSpec {
  /** snake_case, ours, stable forever. Never 'SH.MED.PHYS.ZS'. */
  readonly id: string;
  readonly title: string;
  readonly unit: Unit;                       // canonical unit AFTER toCanonical
  readonly direction: Direction;
  readonly subject: 'place' | 'corridor';
  readonly periodType: PeriodType;
  readonly display: DisplayScale;
  /** Member of M1's K_stock. Exactly five specs may set this true. */
  readonly kStock: boolean;
  /** Vintage guard. A fact older than this is is_stale and does not count toward K_stock. */
  readonly staleAfterYears: number;
  readonly binding: SourceBinding;
  readonly coverage: MeasuredCoverage;
  /**
   * Literal false. The registry CANNOT express a weighted composite index.
   * No DPI, no ACI, no author weight vector. Decision 3 and the §5 not-implemented
   * list, made structural rather than aspirational.
   */
  readonly composite: false;
}

/** One source of truth. `higherIsBetter` is derived, never stored. */
export const higherIsBetter = (i: IndicatorSpec): boolean => i.direction === 'higher_is_better';
```

Three registry-level bans, each with a test in §4.11:

- **No composite.** `composite: false` is a literal type. There is no `dependsOn`, no `weights`, no `compute(inputs)`. An indicator is a measurement bound to one source measure, or it does not exist. Cross-indicator arithmetic happens in `@exodus/kernel` (M1–M5), where it is named, seeded and refusable.
- **No normalisation for scoring.** `DisplayScale` sets a ramp domain. It does not z-score, min-max or quantile anything into a unitless index. The research pack's ACI weighting, and every DPI-style weight vector, are author constructions with no literature behind them and are out of scope (§5, "Not implemented").
- **No hard-coded coverage integers.** Country counts move with every WDI/WHO refresh. `MeasuredCoverage` is written at build. `/sources` renders it. Any source file containing a literal country count for an indicator fails `check:policy`.

### 4.7 The Fact — the one shape everything crosses

§6 gives the physical `migration_fact` table. That is the **corridor-subject** projection of the logical `Fact`. Place-subject facts (WDI/WHO/WPP capacity and demography) live in a second physical table, `place_fact`, with byte-identical provenance columns. Both are projections of one TypeScript type, and `DataSource.transform(raw): Fact[]` returns that type.

```ts
export type SubjectRef =
  | { readonly kind: 'place'; readonly placeId: string }
  | { readonly kind: 'corridor'; readonly corridorId: string }
  | { readonly kind: 'cell'; readonly h3: string };

export interface Provenance {
  /** One id for an ingested row; many for a derived value. See inheritProvenance. */
  readonly sourceIds: readonly string[];
  readonly vintageDate: string;
  readonly latencyDays: number;
  readonly latencyClass: LatencyClass;
  readonly estimateKind: EstimateKind;
  readonly obsFlag: string | null;      // Eurostat OBS_FLAG, e.g. 'e'
  readonly confStatus: string | null;
  readonly ciLow: number | null;
  readonly ciHigh: number | null;
  /** MANDATORY. A row without these fails ingest — they are not documentation. */
  readonly licenseId: string;
  readonly redistributable: boolean;
}

export interface Fact {
  readonly subject: SubjectRef;
  readonly indicatorId: string;         // MUST exist in the indicator registry
  readonly year: number;
  readonly periodType: PeriodType;
  readonly sex: Sex;
  readonly ageBand: string;
  readonly value: number;               // never null: a missing value is an ABSENT ROW
  readonly provenance: Provenance;
}
```

Physical column mapping — one codec, `packages/contracts/src/ontology/codec.ts`, generated from this type and unit-tested both ways:

| `Fact` field | `migration_fact` column | `place_fact` column |
|---|---|---|
| `subject.corridorId` | `origin_iso3`, `dest_iso3` (split) | — |
| `subject.placeId` / `subject.h3` | — | `place_id` |
| `indicatorId` | `measure_code` | `measure_code` |
| `year`, `periodType`, `sex`, `ageBand`, `value` | same names, snake_case | same |
| `provenance.sourceIds` | `source_id` (exactly one on ingested rows) | `source_id` |
| `provenance.*` | `vintage_date`, `latency_days`, `estimate_kind`, `obs_flag`, `conf_status`, `ci_low`, `ci_high`, `license_id`, `redistributable` | identical |

**There is no null `value` and no densified grid.** A missing year is an absent row, which `align(series, grid, 'none')` renders as a visible gap on the sparkline and `<Figure>` renders as `—` with a badge. Never `0`, never forward-filled, never interpolated.

**Provenance inheritance is one function and every derived figure goes through it:**

```ts
const LATENCY_CLASS_ORDER: Record<LatencyClass, number> =
  { live: 0, daily: 1, periodic: 2, annual: 3, modelled: 4, projected: 5 };
const ESTIMATE_KIND_ORDER: Record<EstimateKind, number> =
  { observed: 0, observed_flagged: 1, modelled: 2, extrapolated: 3, assumed_zero: 4 };

/** Worst latency class, OLDEST vintage, worst estimate kind, AND of licence flags. */
export function inheritProvenance(parts: readonly Provenance[]): Provenance {
  if (parts.length === 0) throw new Error('inheritProvenance: no parts');
  const worstLatency = parts.reduce((a, b) =>
    LATENCY_CLASS_ORDER[a.latencyClass] >= LATENCY_CLASS_ORDER[b.latencyClass] ? a : b);
  const worstKind = parts.reduce((a, b) =>
    ESTIMATE_KIND_ORDER[a.estimateKind] >= ESTIMATE_KIND_ORDER[b.estimateKind] ? a : b);
  const oldest = parts.reduce((a, b) => (a.vintageDate <= b.vintageDate ? a : b));
  const single = parts.length === 1 ? parts[0]! : null;
  return {
    sourceIds: [...new Set(parts.flatMap((p) => p.sourceIds))].sort(),
    vintageDate: oldest.vintageDate,
    latencyDays: Math.max(...parts.map((p) => p.latencyDays)),
    latencyClass: worstLatency.latencyClass,
    estimateKind: worstKind.estimateKind,
    obsFlag: single === null ? null : single.obsFlag,
    confStatus: single === null ? null : single.confStatus,
    ciLow: null,
    ciHigh: null,
    licenseId: [...new Set(parts.map((p) => p.licenseId))].sort().join(' AND '),
    redistributable: parts.every((p) => p.redistributable),
  };
}
```

The global AS-OF chip is `inheritProvenance(all facts currently on screen).vintageDate` — the **oldest** contributing vintage. Showing the newest is the lie.

### 4.8 Scenario is the URL, not an engine

```ts
export interface ScenarioObject {
  readonly id: 'scenario:url';
  readonly yearCursor: number;            // 1990..2023, integer, never fractional
  readonly camera: { readonly longitude: number; readonly latitude: number; readonly zoom: number };
  readonly layerVisibility: Readonly<Record<string, boolean>>;
  readonly workingSet: { readonly placeIds: readonly string[]; readonly corridorIds: readonly string[] };
  readonly headroomAssumptions: Readonly<Record<string, number>>;  // target_k by indicator id
  readonly assumptionSetName: string;
}
```

Serialised as `base64url(deflate-raw(json))` — `CompressionStream` supports gzip/deflate/deflate-raw only, never zstd. Keep the blob under ~2 KB so links survive mail gateways. The tray that holds these is `saved_views`; the identifier `watchlist` is banned by `@exodus/policy` rule module 4.

### 4.9 Resolution: the crosswalk is ontology, not a dict

`packages/semantic/src/resolve.ts` is the only place a source's own code becomes a `Place.id`.

```ts
export const NAMESPACES = ['m49', 'iso3', 'eurostat_geo', 'oecd_ref_area', 'unhcr_legacy'] as const;
export type Namespace = (typeof NAMESPACES)[number];

/** Reads snapshot/xwalk.parquet: a versioned table with validity date ranges. */
export function resolvePlace(ns: Namespace, code: string, onDate: string): string | null;
```

Returning `null` is an **ingest-time failure**, not a runtime `Refusal`. `RefusalCode` is closed at the **eight** codes §5 and §12.6.1 name — five core plus the three §12 adds; ontology resolution failures throw named ingest errors (`CrosswalkMiss`, `UnknownIndicator`, `ReservedTypeHasRows`) that print observed-vs-expected and stop the build. Do not add a ninth `RefusalCode`.

Golden rows that must be unit-tested at M1, because each one silently corrupts a corridor otherwise:

| Namespace | Code | Resolves to | Trap |
|---|---|---|---|
| `unhcr_legacy` | `AUS` | `place:AUT` | **`AUS` is Austria in UNHCR, Australia in ISO 3166-1** |
| `unhcr_legacy` | `CHI` | `place:CHN` | `CHI` is China in UNHCR (Channel Islands elsewhere) |
| `eurostat_geo` | `UK` | `place:GBR` | Eurostat uses `UK`, not `GB` |
| `eurostat_geo` | `EL` | `place:GRC` | Eurostat uses `EL`, not `GR` |
| `eurostat_geo` | `XK` | `place:XKX` | Kosovo, explicit row |
| `iso3` | `SDN`, `onDate < 2011-07-09` | pre-split `place:SDN` with `successorIds: ['place:SSD']` | Sudan-2011 |
| `oecd_ref_area` | `W` | `null` (world aggregate, discarded) | aggregates are not places |

### 4.10 Three worked entities

**(a) `place:DEU` — a country as it actually materialises.** Values below are the ones the research verifies; every other property is written by ingest and must never be hand-typed.

```ts
const deu: Place = {
  id: 'place:DEU', kind: 'country', iso3: 'DEU', m49: 276, name: 'Germany',
  validFrom: '1990-10-03', validTo: null, successorIds: [],
  centroid: [10.45, 51.17],            // from snapshot/centroids, derived from Natural Earth 5.1.1
  fclass: 'Admin-0 country', cell: null,
  coverage: { c: 0.94, measuresPresent: 12, measuresRequested: 12,
              newestVintageAgeYears: 1.2, observedShare: 0.83,
              construction: 'corridor-author-construction-v1' },
};
```

Its `hospital_beds_per_1k` fact, and the reason this example is here:

```ts
const deuBeds: Fact = {
  subject: { kind: 'place', placeId: 'place:DEU' },
  indicatorId: 'hospital_beds_per_1k',
  year: 2023, periodType: 'annual', sex: 't', ageBand: 'all',
  value: 7.5501753526,                 // WHO GHO WHS6_102 = 75.501753526 per 10k, per_10k_to_per_1k
  provenance: {
    sourceIds: ['who-gho'], vintageDate: '2025-09-30', latencyDays: 640,
    latencyClass: 'annual', estimateKind: 'observed',
    obsFlag: null, confStatus: null, ciLow: null, ciHigh: null,
    licenseId: 'CC-BY-4.0', redistributable: true,
  },
};
```

Three things this one row proves. The year is keyed on GHO's `TimeDim` (2023), **not** on `Date` (2025-09-30, which is a refresh stamp shared with the 2018 row of 79.392089869 per 10k) — sort by `TimeDim` before taking a latest value, because the GHO array is unsorted. The unit conversion is the named `per_10k_to_per_1k`, not open-coded arithmetic. And the live DEU rows carry `Comments: "OECD Health Statistics Database, data extracted on 31 January 2025"`, so `SourceBinding.provenanceOverrideField = 'Comments'` makes ingest rewrite `sourceIds` and `licenseId` for exactly those rows — WHO's terms do not cover data credited to another publisher. [UNVERIFIED: `ghoapi.azureedge.net` predates `data.who.int`, and WHO's two live terms pages disagree (CC BY 4.0 vs a non-commercial custom grant). Ingest `who-gho` with `licenseId: 'CC-BY-4.0'` **and** a `/sources` trap row recording the ambiguity verbatim; do not encode an NC flag WHO does not apply here, and do not resolve it yourself.]

**(b) `corridor:SYR-DEU` — the drawer's three ignorance channels on one object.**

```ts
const syrDeu: Corridor = {
  id: 'corridor:SYR-DEU',
  originPlaceId: 'place:SYR', destPlaceId: 'place:DEU',
  inSpine: true, spineRank: 31,                    // rank written by snapshot:build
  endpoints: [[38.51, 35.02], [10.45, 51.17]],     // two ADM0 centroids. No third element exists.
  dyad: { dist: 2937.4, distcap: 2937.4, distwHarmonic: 2891.0, contig: 0,
          comlangOff: 0, comlangEthno: 0, colonialDummy: null, comrelig: 0.03,
          scaledSci2021: null },                   // all from CEPII Gravity 202211 at ingest
  opacity: 0.61,                                   // min(C_SYR, C_DEU), written by semantic
};
```

Its Eurostat mirror pair — the only genuinely independent comparison in the product, and the only part of this corridor's numbers the research verifies:

```ts
const mirrorIn: Fact = {
  subject: { kind: 'corridor', corridorId: 'corridor:SYR-DEU' },
  indicatorId: 'immigration_by_prev_residence', year: 2023, periodType: 'annual',
  sex: 't', ageBand: 'all', value: 88973,
  provenance: {
    sourceIds: ['eurostat-mirror'], vintageDate: '2026-09-17', latencyDays: 625,
    latencyClass: 'annual',
    estimateKind: 'observed_flagged',   // OBS_FLAG = 'e' — Eurostat itself calls this estimated
    obsFlag: 'e', confStatus: null, ciLow: null, ciHigh: null,
    licenseId: 'CC-BY-4.0', redistributable: true,
  },
};
```

The 2024 value on the same series is 63,444, also `OBS_FLAG='e'`. The emigration mirror is `migr_emi3nxt[geo=SYR, partner=DEU]`, which does not exist — Syria is not a Eurostat reporter — so M3c returns `Refusal('NoMirrorPair')` for this corridor and the drawer renders that as a sentence, not a zero. The two model estimates (`gaskin-abel.mig_prev` summed to period totals, `abel-cohen.da_pb_closed` summed across sex and filtered to `type='outward'`) and `d_p` are written by ingest at M1. **Do not hand-write a value for them anywhere, including in a fixture.** The fixture for this corridor is the recorded Eurostat response plus a synthetic 3-corridor spine slice.

**(c) `source:gaskin-abel` and one bound indicator.**

```ts
const gaskinAbel = {
  id: 'source:gaskin-abel',
  publisher: 'Gaskin & Abel', title: 'Global bilateral migration flows, 1990–2023',
  citation: 'Nature 655(8121):148–157',
  doi: '10.5281/zenodo.17344747', file: 'mig_bilateral.csv', rawBytes: 145597904,
  licenseId: 'CC-BY-4.0', redistributable: true,
  cadence: 'annual', latencyClass: 'modelled',
  coverage: { nPlaces: 230, years: [1990, 2023] as const },
  traps: [
    { id: 'trap.ga.self', body: 'orig === dest rows exist and are not migration. Filtered at ingest.',
      testId: 'connectors/gaskin-abel/transform.test.ts#drops-self-corridors' },
    { id: 'trap.ga.modelled', body: 'Synthetic outputs of a neural-network ensemble, never derived by direct aggregation of individual records. 73% test correlation. African net migration least certain.',
      testId: 'connectors/gaskin-abel/transform.test.ts#estimate-kind-is-modelled' },
    { id: 'trap.ga.tnc', body: 'T.nc is 3.3 GB and is never fetched.',
      testId: 'connectors/gaskin-abel/plan.test.ts#plan-returns-one-url' },
  ],
} as const;

const physicians: IndicatorSpec = {
  id: 'physicians_per_1k', title: 'Physicians per 1,000 people',
  unit: 'per_1k_persons', direction: 'higher_is_better',
  subject: 'place', periodType: 'annual',
  display: { scale: 'linear', domain: 'observed_p05_p95', clamp: true },
  kStock: true, staleAfterYears: 10,
  binding: {
    sourceId: 'wdi', measureCodeAtSource: 'SH.MED.PHYS.ZS',
    unitAtSource: 'per 1,000 people', toCanonical: 'identity',
    estimateKindDefault: 'observed', latencyClass: 'annual',
    provenanceOverrideField: null,
  },
  coverage: {                                  // WRITTEN BY snapshot:build — shown for shape only
    iso3: [], years: [1990, 2025], nPlaces: 208, nPlacesSince2016: 187,
    medianVintageYear: 2022, measuredAt: '', snapshotBuildId: '',
  },
  composite: false,
};
```

`kStock: true` appears on exactly five specs: `physicians_per_1k`, `nurses_midwives_per_1k`, `hospital_beds_per_1k`, `health_spend_per_capita`, `dwellings_per_1k`. A build-time assertion counts them. [UNVERIFIED: no global dwelling-stock series exists in any open API — the research finds nothing beyond ~50 OECD countries. Bind `dwellings_per_1k` to the best WDI proxy you can resolve at M1, record the binding and its measured `nPlaces` in `DECISIONS.md`, and let the low coverage do its job: countries with fewer than three non-stale `K_stock` indicators get `Refusal('NoServiceStockData')` from M1, which is the correct and already-specified behaviour. Do not substitute a fabricated global series.]

### 4.11 Every panel is a view over this ontology

No panel queries a connector, a source or a table. Each declares the object type it opens on, the links it traverses and the indicator ids it needs; `semantic` returns objects plus facts plus inherited provenance. A panel whose indicators are absent renders `—` with a badge or a typed `Refusal` — it never crashes and it never shows zero.

| Route / overlay | Opens on | Links traversed | Indicators / models |
|---|---|---|---|
| `/` Situation Globe | `place` (258 country) + `place` (41,162 h3cell) + `corridor` (12k spine) | `place.cells`, `corridor.origin`, `corridor.destination` | `population_density` (`pop/area_km2`, never raw count), spine flow per capita, M3 `d_p` → dash density, M4 `C` → opacity |
| `/place/:iso3` | one `place`, `kind==='country'` | `place.successors`, `cohort.of` | the 12 registry indicators + WPP differential + PSR + POADR; `—` where absent |
| `/corridor/:orig-:dest` | one `corridor` | `corridor.origin/destination`, `indicator.boundTo` | M3 (`d_p`, period grid), M3b (`s`), M3c (mirror), M5 (radiation + CPC vs 0.16), `dyad` |
| `/headroom/:iso3` | one `place` | — | M1 over the five `kStock: true` indicators; `bindingIndicator` always named; `perIndicator[]` ≥3 or `Refusal` |
| `/sources` | every `source` | `source.excludes`, `indicator.boundTo` | each source's `plan()` URLs, measured bundle bytes, `traps[].body` bound by `testId` |
| `/methods` | every `source` + the five `Model`s + reserved `ObjectTypeSpec`s | — | CPC scoreboard, model cards, `reservedReason`/`populatedWhen` prose, refusals, Scenario VI |
| `Cmd+K` | `place` (`@`), `corridor` (`~`), `source`+`indicator` (`#`), actions (`>`) | — | Index built from `ObjectTypeSpec.paletteSigil`. `cohort`, `worldEvent`, `policy`, `occupation`, `scenario` are `false` — **the palette indexes no person-shaped type, structurally** |
| `Shift+G` | `corridor`, top 25 by flow | `corridor.origin/destination` | sorted keyboard-navigable table, `role="application"` + `aria-describedby` |
| Provenance popover | any `Fact` | — | `inheritProvenance` output: sources, vintage, latency days, estimate kind, licence, CI |
| `saved_views` tray | `scenario` | `scenario.workingSet*` | decoded permalink; never `watchlist` |

`<Figure>` takes one `provenance: Provenance` object. The design names its content as `{value, unit, sourceId, vintage, latencyDays, estimateKind, licence, ci}`; `sourceId` generalises to `sourceIds` because a derived figure has several. That is the only change, and the popover renders them as a list.

### 4.12 How a new dataset becomes new ontology without touching the UI

Seven steps. Steps 1–5 touch only `packages/connectors/<id>/`; step 6 is generated; step 7 is a boot-time read. The M8 acceptance criterion — **zero diffs outside `packages/connectors/<id>/` and `snapshot/`** — is the proof, and CI runs it for `demo-wdi-gdp`.

1. `pnpm gen:connector <id>` scaffolds `plugin.ts`, `schema.ts`, `indicators.ts`, `fixtures/`, `plugin.test.ts`, `LICENSE`.
2. Write `plan()` (declarative, inspectable without running — `/sources` renders its URLs) and `fetch()` through the SDK's record-replay client. Record a fixture.
3. Write `transform(raw): Fact[]`. Pure. It asserts its column list, resolves every code through `resolvePlace(ns, code, onDate)`, applies a named `Canonicaliser`, and stamps `licenseId` + `redistributable` on every row.
4. Export `IndicatorSpec[]` from `indicators.ts`, one per measure, each with `composite: false` and `coverage` left as the build-written stub.
5. If the source uses a code namespace not in `NAMESPACES`, add rows to `snapshot/xwalk.parquet` and a golden test. This is the only case that touches a shared file, and it is data.
6. `pnpm ingest --only <id> && pnpm snapshot:build`. The build validates every spec, measures coverage against ingested rows, writes `snapshot/manifest.json#{sources,indicators,objectTypes,tables}`, and runs `bundle:verify`, which **refuses** any row whose `redistributable` is false and names the reason on stderr.
7. Boot. `packages/registry` reads the manifest. New indicators appear in `Cmd+K` under `#`, on `/sources` with their `plan()` URLs and measured bytes, in the `/place` grid, and in any panel that declared them. **Zero UI files changed.**

What this recipe does **not** cover, stated so you do not attempt it:

| Change | Cost | Rule |
|---|---|---|
| New indicator on an existing subject | connector only | the recipe above |
| New source, new licence, new traps | connector only | the recipe above |
| New crosswalk namespace | connector + `xwalk` rows + golden test | data, not code |
| New `Unit` or `Canonicaliser` | `packages/contracts` + unit test | closed unions, deliberately |
| New geometry kind (e.g. a 3rd `MapLayer.geometry`) | `contracts` + `globe` + a v2 decision | not in v1 |
| New object type (a tenth `ObjectTypeId`) | `contracts` + `semantic` + a snapshot table + a `/methods` entry | requires the type to be populated; a reserved type is the cheaper answer |
| Populating a reserved type (`policy`, `occupation`, `admin1`) | connector + flip `populatedInV1` + delete the `rowCount === 0` assertion | permitted only when `populatedWhen` is genuinely satisfied |

### 4.13 Acceptance criteria

Every row is a test that exists and runs in CI.

| # | Assertion | Where |
|---|---|---|
| O1 | `OBJECT_TYPES` has exactly nine members and every one has an `ObjectTypeSpec` | `contracts/ontology.test.ts` |
| O2 | Every spec with `populatedInV1: false` has both `reservedReason` and `populatedWhen`, and its `rowCount` in the manifest is `0` | `snapshot:build` + test |
| O3 | `Corridor.endpoints` rejects an array of length ≠ 2 at construction (Zod refinement) | `contracts/geometry.test.ts` |
| O4 | `Corridor.origin`/`.destination` reject any `Place` whose `kind !== 'country'` | `semantic/links.test.ts` |
| O5 | `Place.cell.resolution` is the literal `3`; an r4 cell fails to typecheck and fails at runtime | `contracts/h3.test.ts` |
| O6 | `WorldEvent` with `kind: 'news-slot'` and a non-null `point` is rejected; no event kind has a human subject | `contracts/event.test.ts` |
| O7 | `crossTab(cohortId, placeId)` returns a `PolicyVerdict{deny}` for `admin1` and `h3cell` targets | `policy/verdict.test.ts` |
| O8 | `LayerSpec` has no assignable opacity, `latencyClass` or `estimateKind` key — a type-level test, not a runtime one | `globe/encode.type-test.ts` |
| O9 | Exactly five `IndicatorSpec`s have `kStock: true` | `snapshot:build` assertion |
| O10 | Every `IndicatorSpec.composite` is `false`; no registry entry declares weights or dependencies | `registry/indicators.test.ts` |
| O11 | Every `IndicatorSpec.coverage` field is build-written; a hand-authored non-zero `nPlaces` in a connector source file fails | `check:policy` rule module 2 walk |
| O12 | `inheritProvenance` returns the oldest `vintageDate`, the worst `latencyClass` and `estimateKind`, and `redistributable === false` if any part is false | `semantic/provenance.test.ts` (property test) |
| O13 | The crosswalk golden rows in §4.9 all resolve, including `unhcr_legacy AUS → place:AUT` and Sudan-2011 | `semantic/resolve.test.ts` |
| O14 | Every `Fact` carries a non-empty `licenseId` and a boolean `redistributable`; ingest fails on a row without them | `cli/ingest.test.ts` |
| O15 | No source file, copy string, route path, package name or built-bundle string contains `entity`, `entityPairId`, `watchlist`, `target` or `dossier` as an identifier | `pnpm check:policy` module 4 |
| O16 | `buildAttributeCube` is generic over `(pairId, year, value)` and passes against a synthetic 3-corridor 4-year fixture and against the real snapshot through the same code path | `semantic/attribute-cube.test.ts` |
| O17 | Adding `demo-wdi-gdp` via the §4.12 recipe produces zero diffs outside `packages/connectors/demo-wdi-gdp/` and `snapshot/` | M8 CI job |

---

## 5. The calculator: capacity, pressure, flows, matching and scenarios

This section specifies every computation Exodus performs, and every computation it refuses to perform. Both are deliverables. You implement the first set in `packages/kernel`; you render the second set as prose on `/methods`, bound to tests that fail if the code ever appears.

The heading of this section names seven capabilities. Three exist as code, one exists as a degraded form of itself, and three exist only as refusals. Resolve the mapping now and do not revisit it:

| Capability named in this section | Verdict | Where it lives |
|---|---|---|
| (a) Demographic need / replacement-migration requirement | **Built** | `M2`, §5.3 |
| (b) Absorptive capacity envelope | **Built, narrowed to service stock** | `M1`, §5.4 |
| (c) Occupational shortage matching | **Refused** | `/methods` model card, §5.7 |
| (d) Migration pressure & risk index | **Refused, and structurally unrepresentable** | `/methods` refusal, §5.8 |
| (e) Baseline bilateral flow model | **Refused as a fitted model; a parameter-free null ships** | `M5`, §5.6; refusal copy in §5.6.4 |
| (f) Scenario simulation over a time horizon | **Replaced by replay + two named WPP variants + a permalink** | §5.9 |
| (g) The allocation optimiser | **Refused, rendered in full including its solver and budget** | `/methods#allocation`, §5.10 |

Two further kernel models — `M3` (cross-model disagreement) and `M4` (coverage asymmetry) — are specified here as well, because `@exodus/kernel` is one package and all five models share the contracts in §5.1. Their visual encoding is specified elsewhere; their arithmetic is specified here.

### 5.1 Shared contracts, and the rule that every output states its own ignorance

Everything in `packages/kernel` obeys five invariants. Each is enforced, not merely stated.

| Invariant | Enforcement |
|---|---|
| Pure. No I/O, no `fetch`, no filesystem. | `dependency-cruiser`: `kernel → contracts` only. CI fails on any other edge. |
| No clock. `Date.now()` and `new Date()` are forbidden. | ESLint `no-restricted-syntax`, allowlisting only `packages/kernel/clock`. No inline disables; the policy linter greps for `eslint-disable` in `packages/kernel` and fails. |
| No RNG. `Math.random()` appears nowhere in `kernel`. | Same rule. Every `run()` takes an explicit `seed: number`. |
| Deterministic. Same inputs, same output, byte for byte. | For each model, a test asserts `deepStrictEqual(run(i, w, 1), run(i, w, 2))` and `deepStrictEqual(run(i, w, 7), run(i, w, 7))`. No v1 model is stochastic; the seed is a contract placeholder and the test proves it is unused. |
| Every result is `Ok` or `Refusal`. Never a thrown exception as control flow, never `NaN`, never `0` standing in for a gap. | A test asserts `Number.isFinite` on every numeric field of every `Ok` across the full snapshot sweep, and that no model throws on any country/corridor/year in the snapshot. |

```ts
// packages/kernel/result.ts
export const REFUSAL_CODES = [
  'NoServiceStockData',
  'NonMonotoneBisection',
  'NoSharedPeriodGrid',
  'NoMirrorPair',
  'InsufficientHistory',
] as const;
export type RefusalCode = (typeof REFUSAL_CODES)[number];

export interface Refusal {
  readonly kind: 'refusal';
  readonly code: RefusalCode;
  readonly reason: string;            // a sentence, rendered verbatim; never a template with a number in it
  readonly sourceIds: readonly string[];
}
export interface Ok<T> { readonly kind: 'ok'; readonly value: T }
export type Result<T> = Ok<T> | Refusal;

export const ok = <T>(value: T): Ok<T> => ({ kind: 'ok', value });
export const refuse = (
  code: RefusalCode,
  reason: string,
  sourceIds: readonly string[],
): Refusal => ({ kind: 'refusal', code, reason, sourceIds });
```

The `RefusalCode` union is closed at **eight** members: the five named here plus the three §12.6.1 adds (`NoConsentRecord`, `NoPreferenceCoverage`, `NoLegalBasis`). You do not add a ninth. Where a new failure mode appears, map it to the nearest existing code and distinguish it by `reason`; §5.3 lists the four distinct `reason` strings that share `NonMonotoneBisection`.

`erasableSyntaxOnly` is on. `enum` and `namespace` are TS1294 errors. Every closed set in this section is a `readonly` tuple plus a `typeof[number]` union, as above. Do not deviate.

#### 5.1.1 Uncertainty: what every output must carry, and the one place the brief is overridden

**Requirement:** every kernel output carries an interval and a plain-language caveat.

**Override, stated once and binding:** the interval is **never** called a confidence interval, and it is **never** fabricated. Design §5/M3 forbids labelling cross-model disagreement as uncertainty, and the banned-strings module lints for it. An output whose quantity is a deterministic identity over shipped inputs — `M1` headroom, `M2`'s intake solution — has no sampling distribution, and manufacturing one from author-invented priors is precisely the fake precision this product exists to refuse. Such outputs carry `{ kind: 'none', whyAbsent }` with a required sentence, plus a **deterministic parameter sensitivity** (§5.4.5, §5.3.6) that answers the question a confidence interval would have been asked to answer.

There is no Monte Carlo anywhere in v1. The 10,000-draw envelope in the research is not built: it requires log-normal priors on elasticities, beta priors on shares and normal priors on J-curve parameters that no source supplies, and a sampled band drawn from invented priors renders identically to a measured one. Record this on `/methods` as a refusal.

```ts
// packages/kernel/spread.ts
export const SPREAD_KINDS = [
  'model-disagreement',      // M3: two models, same stock tables. A LOWER BOUND.
  'model-internal-spread',   // M3b: GA mig_prev_std / mig_prev
  'mirror-divergence',       // M3c: two national statistical offices
  'source-reported',         // ci_low / ci_high carried from the source row
  'parameter-sensitivity',   // M1: the range of the output across the shipped assumption sets
  'none',
] as const;
export type SpreadKind = (typeof SPREAD_KINDS)[number];

export type Spread =
  | {
      readonly kind: Exclude<SpreadKind, 'none'>;
      readonly low: number;
      readonly high: number;
      readonly basis: string;   // e.g. 'GA period total vs AC da_pb_closed, period 2010-2015'
    }
  | { readonly kind: 'none'; readonly whyAbsent: string };

export const ESTIMATE_KINDS = [
  'observed', 'observed_flagged', 'modelled', 'extrapolated', 'assumed_zero',
] as const;
export type EstimateKind = (typeof ESTIMATE_KINDS)[number];

export interface Measured<T> {
  readonly value: T;
  readonly unit: string;                      // token, e.g. 'persons', 'persons/year', 'dimensionless'
  readonly spread: Spread;
  readonly caveats: readonly CaveatId[];      // at least one; see §5.1.2
  readonly sourceIds: readonly string[];      // at least one
  readonly vintage: string;                   // ISO 8601 date — the OLDEST contributing vintage, never the newest
  readonly estimateKind: EstimateKind;        // the WORST class among contributors
  readonly latencyDays: number;               // the LARGEST among contributors
}
```

A type-level test proves `Measured<T>` has no optional fields. A runtime test asserts, over the whole snapshot sweep, that `caveats.length >= 1` and `sourceIds.length >= 1` on every `Measured` any model returns. `<Figure>` reads `Measured` directly; a `Measured` is the only thing `<Figure>` accepts from the kernel.

#### 5.1.2 The caveat lexicon — exact copy, frozen

`packages/kernel/caveats.ts` is a frozen const object. The strings below are the copy. Do not paraphrase, do not reflow, do not add a trailing period where there is none, do not interpolate a value into one.

```ts
export const CAVEATS = {
  'disagreement.correlated':
    'Model disagreement. Both estimates derive from the same underlying stock tables, so this is a lower bound on true uncertainty, not a confidence interval.',
  'disagreement.periodGrid':
    'Compared as five-year period totals. The two methods count within-period repeat and return moves differently, and that difference is part of the disagreement rather than noise.',
  'disagreement.bothZero':
    'Both models estimate no movement on this corridor in this period. The zero is agreement, not absence of data.',
  'spread.modelInternal':
    'Model-internal spread from the estimating ensemble. It describes one model’s own variability and says nothing about whether that model is right.',
  'mirror.divergence':
    'Two national statistical offices counting the same pair. Neither figure is the truth; the gap between them is the only independent check in this product.',
  'headroom.understates':
    'This formula holds service stock fixed while growing population. Migrants bring physicians. It therefore systematically understates.',
  'headroom.notAPolicyLimit':
    'Modelled labour-market absorption under assumption set «name» — not a policy limit.',
  'headroom.whoFloor':
    'The WHO figure of 4.45 physicians, nurses and midwives per 1,000 people is a floor for minimum service coverage. It is explicitly not an optimum and not a target.',
  'headroom.targetIsAnAssumption':
    'Every target on this panel is an assumption you can change. Change the assumption and the answer changes. There is no scientifically correct setting.',
  'psr.definition':
    'Potential support ratio is people aged 15–64 per person aged 65 and over, the United Nations definition. A working-age band of 20–64 systematically overstates replacement need.',
  'psr.linearInDifferential':
    'Intake is scaled along the officially published difference between the medium and zero-migration variants. This is arithmetic on two published projections, not a cohort-component projection of our own.',
  'psr.ageingNotSolved':
    'Migration can raise the number of working-age people. It cannot hold the old-age support ratio constant at any politically conceivable level, because migrants age too.',
  'poadr.prospective':
    'Prospective old-age dependency counts a person as old when remaining life expectancy falls to fifteen years or less. It diverges enormously from the fixed age-65 measure beside it.',
  'coverage.authorConstruction':
    'This project’s construction. No literature is claimed for these weights, and no source endorses them.',
  'radiation.nullModel':
    'A parameter-free null model, shown so you can see what no explanation at all predicts. It is not this product’s baseline and nothing here is fitted to it.',
  'cpc.truncatedMatrix':
    'Computed over the 12,000 corridors this bundle ships, not the full country-by-country matrix, and therefore not directly comparable to the published global figures beside it.',
  'cpc.heldOut':
    'Computed on a year held out of corridor selection, so the corridors were not chosen using the year they are scored on.',
} as const;

export type CaveatId = keyof typeof CAVEATS;
export const caveatText = (id: CaveatId): string => CAVEATS[id];
```

Three tests bind this file:

1. **Resolution.** Every `CaveatId` emitted anywhere in the snapshot sweep resolves; every key in `CAVEATS` is emitted by at least one model or is listed in a documented `UNUSED` allowlist that must be empty at M7.
2. **Byte equality.** `caveats.spec.ts` asserts each string against a committed fixture, so a copy edit is a deliberate, reviewed diff.
3. **Banned strings.** `pnpm check:policy` runs its lexicon and banned-string modules over `caveats.ts` like any other source file.

`'disagreement.correlated'` contains the string `confidence interval`, which module 2 bans adjacent to a disagreement figure. This is the single allowlisted occurrence in the product. Implement the exception as one hash-pinned entry, not a pattern:

```ts
// packages/policy/rules/banned-strings.allowlist.ts
export const BANNED_STRING_ALLOWLIST = [
  {
    id: 'caveat.disagreement.correlated',
    file: 'packages/kernel/caveats.ts',
    sha256: '<sha256 of the exact caveat string, computed at M7 and committed>',
    reason: 'The design mandates this exact sentence; it uses the banned phrase to negate it.',
  },
] as const;
```

The rule module hashes the candidate occurrence and matches against `sha256`. A byte that changes invalidates the allowlist and fails the build. No other allowlist entry is added for any reason.

#### 5.1.3 `WorldView`, `Model`, and parameter provenance

```ts
// packages/contracts/world.ts
export type PeriodKey =
  | '1990-1995' | '1995-2000' | '2000-2005'
  | '2005-2010' | '2010-2015' | '2015-2020';

export interface Observation {
  readonly year: number;
  readonly value: number;
  readonly sourceId: string;
  readonly vintageDate: string;
  readonly latencyDays: number;
  readonly estimateKind: EstimateKind;
  readonly obsFlag: string | null;
  readonly confStatus: string | null;
  readonly ciLow: number | null;
  readonly ciHigh: number | null;
}

export interface ParameterProvenance {
  readonly value: number;
  readonly unit: string;
  readonly sourceId: string;
  readonly sourceUrl: string;
  readonly vintage: string;
  readonly confidence: 'measured' | 'estimated' | 'placeholder';
  readonly basis: string;   // human-readable derivation, e.g. 'OECD median, 2022 vintage, 34 reporters'
}

export interface AssumptionSet {
  readonly name: string;
  readonly targets: Readonly<Record<string, ParameterProvenance>>;
}

/** A pure, synchronous read interface over the loaded snapshot. No async, no I/O. */
export interface WorldView {
  readonly snapshotVintage: string;
  readonly periodGrid: readonly PeriodKey[];
  country(iso3: string): CountryRecord | null;
  series(iso3: string, measure: string): readonly Observation[] | null;
  corridor(orig: string, dest: string): CorridorRecord | null;
  assumptionSet(name: string): AssumptionSet | null;
}
```

`Model<I, O>` is defined in §6 of this document. Every model in this section implements it, declares its `assumptions: AssumptionSpec[]`, and **every shipped `AssumptionSpec` has `placeholder: false`**. The M7 acceptance criterion is that the five model cards render with all `placeholder` flags false. If you find yourself needing a placeholder coefficient to make a model produce a number, the model does not ship — it becomes a refusal.

`PARAMETERS.md` is generated, not written: `pnpm gen:parameters` walks every model's `assumptions`, emits one row per parameter with `value`, `unit`, `sourceUrl`, `vintage`, `confidence` and `basis`, and CI fails if the committed file differs from the generated one.

### 5.2 The five models at a glance

| id | Name | Purpose in one line | Pure inputs | Refusals it can return | Budget cap |
|---|---|---|---|---|---|
| `M1` | Service-stock headroom | Which service is the binding constraint, and is it already in deficit? | `iso3`, horizon `T`, assumption-set name | `NoServiceStockData` | ≤ 1 ms / country; ≤ 60 ms full sweep |
| `M2` | Replacement-migration differential and constant-PSR intake | How much intake holds the UN support ratio where it is? | `iso3`, `baseYear`, `targetYear` | `NonMonotoneBisection`, `InsufficientHistory` | ≤ 2 ms / country / target year |
| `M3` | Cross-model disagreement on the period grid | How far apart are the two best models on this corridor? | `orig`, `dest`, `period` | `NoSharedPeriodGrid`, `NoMirrorPair` (M3c), `InsufficientHistory` (M3b) | ≤ 0.05 ms / corridor-period; ≤ 120 ms for 12,000 × 6 |
| `M4` | Coverage-asymmetry score | How much authority has this country's data earned? | `iso3` | none (a country with no measures scores 0) | ≤ 40 ms full sweep |
| `M5` | Radiation null model and CPC | What does the simplest possible explanation predict, and how badly? | corridor set, hold-out year | `InsufficientHistory` | ≤ 250 ms at ingest; ≤ 2 ms for in-browser CPC |

Budget caps are **caps, asserted in CI, not measurements**. Each is checked by a Vitest assertion on the CI runner with a 3× headroom multiplier, so a cap of 60 ms fails at 180 ms. A cap breached at M0 is resolved by reducing scope (fewer corridors, fewer indicator rows), never by loosening the cap.

### 5.3 (a) M2 — demographic need: replacement-migration differential and the constant-PSR bisection

#### 5.3.1 Purpose

Answer two distinct questions and never conflate them:

1. **The differential.** How many more people does a country have in year *y* under the UN's medium projection than under its zero-migration projection? This is `Pop(VarID 2) − Pop(VarID 7)`, the officially sanctioned migration counterfactual, and it ships precomputed.
2. **The requirement.** What constant annual net intake, held flat from `baseYear` to `targetYear`, leaves the potential support ratio at `targetYear` equal to its value at `baseYear`? This is the only live numerical solve in the product.

#### 5.3.2 Definitions, fixed

```
PSR(c, y)  = P[15,64](c, y) / P[65+](c, y)            // UN definition. 15-64, never 20-64.
OADR(c, y) = P[65+](c, y)  / P[15,64](c, y)           // the reciprocal, rendered for continuity with the literature
D(c, y)    = Pop_VarID2(c, y) - Pop_VarID7(c, y)      // precomputed column, persons
```

The `wpp` snapshot table carries, per country × year for 2024–2050, **six** population aggregates rather than the two totals: `{pop_total, pop_15_64, pop_65p} × {varid2, varid7}`. At 237 countries × 27 years × 6 columns × 8 bytes this is 307 KB uncompressed, well inside the 5 MiB `wpp` budget. It also carries one scalar per country, `wpp_mean_annual_netmig`, the mean annual net migration implied by the medium variant over 2024–2050. These are ingest-time aggregations of the shipped WPP single-year-age tables; they are not projections of ours.

WPP ingest normalisation is asserted at M1 and is load-bearing here: `SRB/100`, `ASFR/1000`, `population×1000`, filter `LocTypeName='Country/Area'`, and a **multi-member gzip reader** — a single-member reader returns 634 bytes and no error.

#### 5.3.3 The intake response, and why it is a scaling and not a projection

A live cohort-component projection engine is out of scope (design §2, OUT #8). The bisection nonetheless needs `PSR(c, y; m)` for a candidate intake `m`. Obtain it by scaling the published differential, which is the only migration counterfactual the UN itself sanctions:

```
For each band b in {w = 15-64, o = 65+}:
  A_b(c, y) = P_b^{V7}(c, y)                        // zero-migration trajectory
  Δ_b(c, y) = P_b^{V2}(c, y) - P_b^{V7}(c, y)       // the published migration differential, by band
  λ(m)      = m / m̄(c)                              // m̄ = wpp_mean_annual_netmig, persons/year
  P_b(c, y; m) = A_b(c, y) + λ(m) · Δ_b(c, y)
  PSR(c, y; m) = P_w(c, y; m) / P_o(c, y; m)
  f(m)         = PSR(c, y_target; m) − PSR(c, y_0)
```

This is arithmetic on two published projections. It reproduces WPP exactly at `m = m̄` (λ = 1) and at `m = 0` (λ = 0), and interpolates and extrapolates linearly between and beyond. The caveat `'psr.linearInDifferential'` is mandatory on the output and says exactly this. If `m̄(c) ≤ 0` — a country whose medium variant has net emigration — the scaling has no meaningful direction; return `Refusal('NonMonotoneBisection', 'The medium projection for this country assumes net emigration, so there is no published migration differential to scale.', ['wpp'])`.

`PSR(·; m)` is a ratio of two affine functions of λ, so

```
d PSR / dλ = (Δ_w · A_o − Δ_o · A_w) / (A_o + λ·Δ_o)²
```

is single-signed wherever the denominator does not vanish. Define `S = Δ_w·A_o − Δ_o·A_w` evaluated at `y_target`. **`S ≤ 0` is exactly the failure the design names: an age profile weighted toward 65+, where more intake does not raise the support ratio.** This gives a closed-form monotonicity precheck, which you implement in addition to — never instead of — the two mandated guards.

#### 5.3.4 The solve

```
Guard 0 (analytic):  if S ≤ 0            → Refusal('NonMonotoneBisection', REASON_NONMONOTONE)
Bracket:  m_lo = 0
          m_hi = m̄(c);  while f(m_hi) < 0 and expansions < 12: m_hi ·= 2
          if f(m_hi) < 0 after 12 expansions → Refusal('NonMonotoneBisection', REASON_UNREACHABLE)
Guard 1:  assert sign(f(m_lo)) ≠ sign(f(m_hi))                    else Refusal('NonMonotoneBisection', REASON_BRACKET)
Guard 2:  9-point scan of f over [m_lo, m_hi] must be monotone     else Refusal('NonMonotoneBisection', REASON_NONMONOTONE)
Converge: bisection, ≤ 20 iterations, stop when |f(m)| / max(PSR(c, y_0), 1e-9) < 1e-4
          if 20 iterations do not reach tolerance → Refusal('NonMonotoneBisection', REASON_NOCONVERGE)
```

The four `reason` strings, verbatim:

```ts
const REASON_NONMONOTONE =
  'No unique solution: the potential support ratio is non-monotone in intake for this age profile, because the published migration differential adds proportionally more people aged 65 and over than people aged 15 to 64.';
const REASON_UNREACHABLE =
  'No solution: the base-year support ratio is not reachable at any intake within four thousand times this country’s own projected net migration.';
const REASON_BRACKET =
  'No unique solution: zero intake and the upper bracket do not straddle the target support ratio.';
const REASON_NOCONVERGE =
  'No solution: the bisection did not reach one part in ten thousand within twenty iterations.';
```

`Guard 0` and `Guard 2` must agree. A unit test asserts, over all 237 countries × target years {2035, 2040, 2050}, that `S ≤ 0` if and only if the 9-point scan reports non-monotone. A disagreement is a bug in one of the two and fails CI.

A 9-point scan plus at most 12 bracket expansions plus 20 bisection steps is at most 41 evaluations of `f`, each 8 floating-point operations. The 2-ms cap is generous by three orders of magnitude and exists to catch an accidental O(n²) rewrite.

#### 5.3.5 POADR, beside every conventional figure

Sanderson–Scherbov prospective old-age dependency. "Old" begins at the age `α(c, y)` where remaining life expectancy falls to 15 years:

```
e(a)      = Σ_{x ≥ a} L(x) / L(a) - 0.5          // from the shipped WPP L(a), single-year ages
α(c, y)   = the a where e(a) = 15, by linear interpolation between the bracketing integer ages
POADR     = P[≥ α](c, y) / P[15, α)(c, y)
```

`e(a)` is monotone decreasing in `a` by construction; assert it in a test and refuse to interpolate across a non-monotone segment. POADR and OADR render side by side on `/place` and `/headroom` with caveat `'poadr.prospective'`. The published Sanderson–Scherbov comparison for Germany (+11.3% prospective against +49.2% conventional) ships as a **static, cited reference figure** rendered beside our computed series and badged as such. Do not attempt to reproduce it; it is computed over their period on their vintage.

#### 5.3.6 Sensitivity, outputs and golden vectors

`PsrOutput` carries a deterministic three-point sensitivity, not a sampled band: the solution recomputed at `targetYear − 5`, `targetYear`, `targetYear + 5` (clipped to 2050), which is the single assumption a reader is most likely to want moved. The `Spread` is `{ kind: 'none', whyAbsent: 'This is the exact solution of a stated equation over two published projections. It has no sampling distribution; the horizon sensitivity beside it is the honest substitute.' }`.

```ts
export interface PsrInput {
  readonly iso3: string;
  readonly baseYear: number;      // 2024..2049
  readonly targetYear: number;    // baseYear+1 .. 2050
}

export interface PsrHorizonPoint {
  readonly targetYear: number;
  readonly requiredAnnualIntake: number;   // persons/year
}

export interface PsrOutput {
  readonly requiredAnnualIntake: Measured<number>;   // unit: 'persons/year'
  readonly lambdaAtSolution: number;                 // multiples of this country's own projected net migration
  readonly psrBase: number;
  readonly psrAtSolution: number;
  readonly iterations: number;
  readonly residualRelative: number;
  readonly oadr: { readonly base: number; readonly target: number };
  readonly poadr: {
    readonly base: number; readonly target: number;
    readonly oldAgeThresholdBase: number; readonly oldAgeThresholdTarget: number;
  };
  readonly horizonSensitivity: readonly PsrHorizonPoint[];  // length 1..3
}

export declare function runConstantPsrIntake(
  inputs: PsrInput, world: WorldView, seed: number,
): Result<PsrOutput>;

export interface ReplacementDifferentialInput {
  readonly iso3: string;
  readonly years: readonly number[];    // subset of 2024..2050
}
export interface ReplacementDifferentialOutput {
  readonly perYear: readonly {
    readonly year: number;
    readonly differential: Measured<number>;   // unit: 'persons'
    readonly psrMedium: number;
    readonly psrZeroMigration: number;
  }[];
}
export declare function runReplacementDifferential(
  inputs: ReplacementDifferentialInput, world: WorldView, seed: number,
): Result<ReplacementDifferentialOutput>;
```

Mandatory caveats on `requiredAnnualIntake`: `['psr.definition', 'psr.linearInDifferential', 'psr.ageingNotSolved']`.

**Golden vectors — read this before writing the test.** UN ESA/P/WP.160 Table 8 ships as a **static committed fixture**, and the golden test is a fixture-equality test over the rendered values, not a reproduction by `M2`. The 2000 study used the 1998 Revision, a 1995 base year and a different band definition; reproducing its arithmetic from WPP 2024 is impossible, and an agent that "calibrates" `M2` until it matches has fabricated a result. State this in the test file's header comment.

Committed values, 1995–2050 totals (the source's own units are thousands; store as persons):

| Scenario | Entity | Value |
|---|---|---|
| V (PSR floor 3.0) | European Union | 153,600,000 |
| V | Japan | 94,800,000 |
| V | Germany | 40,500,000 |
| V | United States | 44,900,000 |
| V | Italy | 35,100,000 |
| VI (hold 1995 PSR) | European Union | 700,500,000 |
| VI | Japan | 553,500,000 |
| VI | **Republic of Korea** | **5,149,000,000** |
| VI | Italy | 119,700,000 |
| III (constant total population) | European Union | 47,500,000 |
| III | Italy | 12,900,000 |

The Scenario VI panel renders the Republic of Korea figure with the table's own footnote — *"Scenario VI is considered to be unrealistic."* — non-dismissibly, attributed to UN ESA/P/WP.160 Table 8, never as our editorial.

#### 5.3.7 Known-answer unit tests for M2

| Test | Input | Expected |
|---|---|---|
| `psr.identity` | Synthetic country, `Δ_w = Δ_o = 0` | `Refusal('NonMonotoneBisection', REASON_NONMONOTONE)` — `S = 0` |
| `psr.exactZero` | Synthetic where `PSR^{V7}(y_target) = PSR(y_0)` | `requiredAnnualIntake === 0`, `iterations ≤ 1` |
| `psr.exactMedium` | Synthetic where `PSR^{V2}(y_target) = PSR(y_0)` | `lambdaAtSolution` within 1e-4 of 1.0 |
| `psr.oldSkewed` | Synthetic with `Δ_o / A_o > Δ_w / A_w` | `Refusal`, `REASON_NONMONOTONE`, and `S ≤ 0` |
| `psr.guardAgreement` | All 237 countries × {2035, 2040, 2050} | Guard 0 verdict === Guard 2 verdict, every case |
| `psr.iterationCap` | All 237 countries × {2035, 2040, 2050} | every `Ok` has `iterations ≤ 20` and `residualRelative < 1e-4` |
| `psr.definition` | Any country | `psrBase` matches a hand-computed 15–64 value and differs from the 20–64 value |
| `poadr.threshold` | Synthetic life table with `e(65) = 15` exactly | `oldAgeThreshold === 65`, POADR === OADR |
| `psr.determinism` | Any country, seeds 1 and 2 | deep-equal |
| `wp160.golden` | The fixture | byte-equal to the eleven rows above |

### 5.4 (b) M1 — the absorptive capacity envelope, narrowed to service stock

#### 5.4.1 Purpose and the narrowing, stated out loud

The research proposes six constraint modules — labour, housing, services, fiscal, acceptance, demographic — combined by a soft minimum. **Five of the six do not ship.** Record the reasons on `/methods`, because they are the product's argument:

- **Labour.** Requires vacancies by occupation. Eurostat's quarterly vacancy series covers roughly 37 national reporters at ISCO 1-digit; JOLTS has no occupational dimension at all; time-to-fill is derivable nowhere at global scale. See §5.7.
- **Housing.** Requires dwelling completions. Eurostat publishes building permits (`sts_cobp_a`, `indic_bt = BPRM_DW`), not completions, and no harmonised completions series exists; the only EU dwelling-stock data is census-year. The supply elasticity `ε_S` is country-specific and must be parsed from a PDF annex; `ε_D` and `β_vac` have no citation at all.
- **Fiscal.** The 75-year net present value flips sign on the public-goods allocation rule, by roughly $80,000–$85,000 per immigrant on the NAS 2016 figures. A tool that renders a signed number whose sign is an accounting choice is lying with pixels, and the specific per-immigrant figures circulating in secondary commentary could not be located in the NAS report itself.
- **Acceptance.** Gallup's Migrant Acceptance Index sits inside the licensed Gallup World Poll with no confirmed public country-level dataset, and MIPEX is CC BY-NC-SA 2.0 UK — non-commercial and ShareAlike-viral, a contamination vector for the whole data component. All four of its coefficients are free parameters with no literature behind them.
- **The soft-minimum combiner.** With `θ = 0.15·min_j A_j` and six tied modules, the un-normalised log-sum-exp returns `A − 0.27·A`: a 27% haircut with no constraint binding. The fix is the `1/J` normalisation. We do not ship the combiner at all, because with one module there is nothing to combine — which is itself the honest statement.

#### 5.4.2 Formula, and the unit discipline that prevents the factor-of-1,000 error

For country `c`, horizon `T` years, population `P`, over `K_stock`:

```
H_k = ((r_k / t_k) − 1) · P / T          for each k ∈ K_stock with role 'constraint'
H   = min_k H_k
binding = argmin_k H_k        (ties broken by the fixed K_STOCK order, deterministically)
```

`r_k` and `t_k` are expressed **in the same per-capita units**, so `r_k / t_k` is dimensionless. This is the form that structurally prevents the factor-of-1,000 error: never multiply a per-1,000 rate by population without dividing by 1,000. The scale-invariance test in §5.4.6 is the enforcement.

The minimum is taken over **stock ratios only**. Taking it over flow or utilisation indicators returns ≤ 0 for every country on earth — 216 of 216 sit at or below a 100% electricity target — and is a category error that will look like a bug and be "fixed" by silently widening the set. The `K_STOCK` tuple is closed in code and a test asserts its membership.

#### 5.4.3 `K_stock`, units, sources and the one unverified member

```ts
export const K_STOCK = [
  'physicians',
  'nurses_midwives',
  'hospital_beds',
  'dwellings',
  'health_spend_pc',
] as const;
export type StockIndicator = (typeof K_STOCK)[number];
```

| Indicator | Unit for both `r` and `t` | Source | Notes |
|---|---|---|---|
| `physicians` | per 1,000 population | `wdi-who` — WDI `SH.MED.PHYS.ZS`, WHO GHO fallback | GHO: key on `TimeDim`, not `Date`; **the array is unsorted — sort before taking latest** |
| `nurses_midwives` | per 1,000 population | `wdi-who` — WDI `SH.MED.NUMW.P3` | as above |
| `hospital_beds` | per 1,000 population | `wdi-who` — WDI `SH.MED.BEDS.ZS` | as above |
| `health_spend_pc` | current US$ per person | `wdi-who` — WDI `SH.XPD.CHEX.PC.CD` | per-capita by construction; no division by population |
| `dwellings` | dwellings per 1,000 population | **[UNVERIFIED]** | see below |

**`dwellings` is [UNVERIFIED] and you resolve it at M1, with the network on.** No dwelling-stock series with global coverage was confirmed in research; Eurostat's only EU dwelling-stock data is census-year 2021, and `sts_cobp_a` is permits rather than completions. At M1, query the live WDI v2 catalogue for a dwelling-stock or housing-units series with ≥ 100 countries reporting since 2010. If one exists, wire it, record the exact indicator code in `DECISIONS.md`, and add it to `/sources` with its trap. **If none exists, drop `dwellings` from `K_STOCK`, making it four members**, record the drop in `DECISIONS.md` with the date and the catalogue query used, and add a `/methods` refusal entry naming it. Do not substitute a proxy. Do not synthesise dwellings from urbanisation or household size.

#### 5.4.4 Assumption sets — targets are assumptions, and they are named

Three assumption sets ship as committed JSON under `packages/kernel/assumptions/`, each entry a full `ParameterProvenance`. The set name is part of the permalink payload (§5.9.2) and appears in the mandatory label.

| Set name | All five constraint targets |
|---|---|
| `oecd-median` (default) | median of reporting OECD countries at the latest common vintage |
| `eu27-median` | median of reporting EU-27 countries at the latest common vintage |
| `who-floor` | as `oecd-median`, **plus one reference row** (below) |

Every target carries `confidence: 'estimated'` and `basis: 'median of reporting <group> countries at vintage <date>, computed at ingest'`. **No target is `placeholder`**, because a median of shipped observations is a computation over shipped data; and no target claims to be a standard.

The `who-floor` set adds one **reference row**: `physicians + nurses_midwives` against **4.45 per 1,000**, WHO's SDG index threshold, `confidence: 'measured'`, caveat `'headroom.whoFloor'`. It is `role: 'reference'` and is excluded from the minimum, because 4.45 is a floor over the sum of two indicators and cannot be split across them without invention. A test asserts a `role: 'reference'` row is never returned as `bindingIndicator`.

#### 5.4.5 Sensitivity: rank-flip thresholds, not a sampled band

For each constraint row, compute two deterministic quantities:

```
dH_k/dt_k      = −(r_k / t_k²) · P / T
rankFlipTarget = the value t_k* at which H_k equals the second-smallest H over the other constraint rows,
                 i.e. t_k* = r_k / (1 + H_(2) · T / P);  null if no positive solution exists
```

`rankFlipTarget` answers the question a confidence interval would be asked: *how far would this target have to move before a different service became the binding constraint?* It is exact, cheap and honest. The output's `Spread` is `{ kind: 'parameter-sensitivity', low, high, basis }` where `low` and `high` are `H` recomputed under the other two shipped assumption sets — a range over stated, named, inspectable assumptions rather than over invented priors.

#### 5.4.6 Signature, outputs, refusal, tests

```ts
export interface HeadroomInput {
  readonly iso3: string;
  readonly horizonYears: number;         // T, integer, 1..50; out of range is a Zod parse failure, not a Refusal
  readonly assumptionSetName: string;    // must resolve via world.assumptionSet()
}

export interface IndicatorRow {
  readonly indicator: StockIndicator | 'health_workforce_combined';
  readonly role: 'constraint' | 'reference';
  readonly ratio: number;                          // r_k
  readonly target: number;                         // t_k, same unit as ratio
  readonly unit: string;
  readonly headroomPersons: number;                // H_k; negative means service deficit
  readonly targetProvenance: ParameterProvenance;
  readonly ratioVintage: string;
  readonly sensitivity: {
    readonly dHdTarget: number;
    readonly rankFlipTarget: number | null;
  };
}

export interface HeadroomOutput {
  readonly value: Measured<number>;                // H, unit 'persons/year'
  readonly bindingIndicator: StockIndicator;
  readonly perIndicator: readonly IndicatorRow[];  // ≥ 3 constraint rows, or the call refused
  readonly assumptionSetName: string;
  readonly horizonYears: number;
  readonly isDeficit: boolean;                     // H < 0
}

export declare function runHeadroom(
  inputs: HeadroomInput, world: WorldView, seed: number,
): Result<HeadroomOutput>;
```

Refusal: fewer than three `K_stock` indicators with a value for `c` at any vintage →

```ts
refuse(
  'NoServiceStockData',
  'Fewer than three of the five service-stock indicators are reported for this country, so there is nothing to take a minimum over.',
  ['wdi-who'],
);
```

Mandatory caveats on `value`: `['headroom.notAPolicyLimit', 'headroom.understates', 'headroom.targetIsAnAssumption']`, plus `'headroom.whoFloor'` whenever the reference row is present. The `«name»` in `'headroom.notAPolicyLimit'` is substituted by the renderer from `assumptionSetName`; the stored string keeps the guillemets literal so the linter sees a stable byte sequence.

Negative `H` renders as a **service deficit in warm hue**. This is the true state of nearly every country under any median target, and it is the correct reading: warm hue marks a failure of provision, never a quantity of persons.

Banned strings — `capacity limit`, `carrying capacity`, `maximum`, `threshold`, `saturation` — are linted **against the built bundle**, not only against source. A minified string survives a source-level grep.

| Test | Input | Expected |
|---|---|---|
| `headroom.scaleInvariance` | Same country with all ratios and targets per-1 instead of per-1,000 | `H` identical to 1e-9 relative. **This is the factor-of-1,000 regression test.** |
| `headroom.knownAnswer` | `r = 4.0/1000`, `t = 4.45/1000`, `P = 10,000,000`, `T = 10` | `H_k = ((4.0/4.45) − 1)·1e7/10 = −101,123.595…`; assert to 1e-6 relative |
| `headroom.positive` | `r = 5.0/1000`, `t = 4.45/1000`, `P = 10,000,000`, `T = 10` | `H_k = +123,595.505…` |
| `headroom.binding` | Synthetic with a known argmin | `bindingIndicator` matches; `value.value === perIndicator[binding].headroomPersons` |
| `headroom.tieOrder` | Two rows exactly equal and minimal | binding is the earlier member of `K_STOCK`; deterministic across runs |
| `headroom.referenceNeverBinds` | `who-floor` set, reference row minimal | `bindingIndicator` is a constraint row |
| `headroom.refusal` | Country with two indicators | `Refusal('NoServiceStockData')`, prose rendered, no number |
| `headroom.rankFlip` | Synthetic | setting `t_k = rankFlipTarget + ε` changes `bindingIndicator` |
| `headroom.sweep` | 258 countries × `T ∈ {5, 10, 20}` × 3 assumption sets | no throw; every `Ok` has ≥ 3 constraint rows and finite `H` |
| `headroom.bannedStrings` | The built bundle | zero matches |

### 5.5 M3 — cross-model disagreement, and M4 — coverage asymmetry

Specified here because they live in `@exodus/kernel`. Their visual encoding is specified in the rendering section; encode nothing here.

#### 5.5.1 M3 — disagreement on the period grid

```
A_p = Σ_{y ∈ p}  GA.mig_prev(o, d, y)                                  // annual → period total
B_p = Σ_{sex ∈ {female, male}} AC.da_pb_closed(o, d, p, type='outward') // never sum over {outward, return, transit}
d_p = |A_p − B_p| / ((A_p + B_p) / 2)      clamped to [0, 2]
```

Compared as **period totals**. Never annualise Abel & Cohen. `d_p` is held constant across every year in the period. Corridor-years outside the shared grid return:

```ts
refuse('NoSharedPeriodGrid',
  'The two models share only six five-year periods from 1990 to 2020. This year lies outside that shared grid, so there is nothing to compare.',
  ['gaskin-abel', 'abel-cohen']);
```

Guard: if `A_p + B_p < 1` person, return `Ok` with `d = 0`, `Spread.kind = 'none'`, `whyAbsent` set, and caveat `'disagreement.bothZero'`. Do not divide by zero and do not refuse — both models agreeing on nothing is a real, reportable fact.

Mandatory caveats: `['disagreement.correlated', 'disagreement.periodGrid']`. `Spread.kind` is `'model-disagreement'` with `low = min(A_p, B_p)`, `high = max(A_p, B_p)`, `basis` naming both estimator columns and the period.

```ts
export interface DisagreementInput { readonly orig: string; readonly dest: string; readonly period: PeriodKey }
export interface DisagreementOutput {
  readonly d: Measured<number>;      // unit 'dimensionless'
  readonly gaPeriodTotal: number;
  readonly acPeriodTotal: number;
  readonly period: PeriodKey;
  readonly clamped: boolean;
}
export declare function runDisagreement(
  inputs: DisagreementInput, world: WorldView, seed: number,
): Result<DisagreementOutput>;
```

**M3b — model-internal spread**, drawer-only, a separately named channel:

```
s(o, d, y) = GA.mig_prev_std(o, d, y) / GA.mig_prev(o, d, y)
```

`Spread.kind = 'model-internal-spread'`, caveat `['spread.modelInternal']`. Guard `mig_prev === 0` → `Refusal('InsufficientHistory', 'This model estimates no movement on this corridor in this year, so a relative spread is undefined.', ['gaskin-abel'])`. A string test asserts the two channels never share a label in the lexicon fixture.

**M3c — Eurostat mirror divergence**, EU pairs only:

```
I = migr_imm5prv[geo = d, partner = o]
E = migr_emi3nxt[geo = o, partner = d]
m = |I − E| / ((I + E) / 2)
```

Non-EU pairs → `Refusal('NoMirrorPair', 'Only EU member states publish both an immigration figure by previous residence and an emigration figure by next residence, so there is no independent second count for this pair.', ['eurostat-mirror'])`. `OBS_FLAG` and `CONF_STATUS` are carried through and rendered as inline glyphs. Caveat `['mirror.divergence']`.

#### 5.5.2 M4 — coverage-asymmetry score

```
C = 0.4·(m/M) + 0.3·exp(−Δt / 5) + 0.3·f_obs          C ∈ [0, 1]
```

where `m/M` is measures present over measures requested, `Δt` is the age in years of the newest vintage for `c`, and `f_obs` is the share of that country's rows with `estimate_kind ∈ {observed, observed_flagged}`. Corridor opacity is `min(C_o, C_d)`.

**Computed in `semantic`, merged after `encode()`. A type-level test proves `MapLayer.encode()` has no access to the opacity field.** If a layer author can choose authority, a plugin can render Gulf corridors with German-register confidence.

Mandatory caveat `['coverage.authorConstruction']`. The weights `0.4 / 0.3 / 0.3` and the 5-year decay constant are this project's construction; they appear in `PARAMETERS.md` with `confidence: 'estimated'` and `basis: 'author construction, no literature claimed'`. Tests: `C ∈ [0,1]` for all 258 countries; a country with zero measures scores exactly 0; a country with all measures, a same-year vintage and `f_obs = 1` scores exactly 1.0.

### 5.6 (e) The baseline bilateral flow model — M5, a null, and a refusal

#### 5.6.1 What ships

A parameter-free radiation model, drawer-only, explicitly a null model and never the baseline:

```
T_ij = T_i · (m_i · n_j) / ((m_i + s_ij) · (m_i + n_j + s_ij))
```

`m_i` origin population, `n_j` destination population, `s_ij` the total population of all countries whose centroid falls within the circle centred on `i` of radius `d_ij`, excluding `i` and `j` (Simini, González, Maritan & Barabási, *Nature* 484(7392):96–100, 2012, doi:10.1038/nature10856). `T_i` is the origin's total observed outflow **taken from the spine**, not predicted — the model is given the production function, exactly as in the reference literature.

Simini's finite-system normalisation, divide by `(1 − m_i / M)`, ships as a named boolean parameter `finiteSystemNormalisation`, **defaulted `false`** so the rendered formula matches the executed one, with the citation recorded and both branches unit-tested.

`d_ij` is `cepii.dist` (geodesic between most populated cities). `distw`, `distwces`, `colony` and `smctry` **do not exist in CEPII Gravity 202211**; do not reference them.

#### 5.6.2 CPC, and the two things that make ours not comparable

```
CPC(T, T̂) = 2 · Σ_ij min(T_ij, T̂_ij) / (Σ_ij T_ij + Σ_ij T̂_ij)          ∈ [0, 1]
```

This is the Bray–Curtis similarity score. Two disclosures are mandatory and permanent:

1. **Hold-out year is 2010.** The 12,000 shipped corridors are selected by mean `mig_prev` over 2015–2023. Scoring on any year inside that window leaks the selection into the evaluation. 2010 is outside it. Caveat `'cpc.heldOut'`.
2. **The matrix is truncated.** We ship 12,000 corridors, not the full 230 × 230 matrix, and CPC over a volume-selected subset is not the statistic the published references report. Caveat `'cpc.truncatedMatrix'`.

The Robinson & Dilkina reference values (COMPASS '18, doi:10.1145/3209811.3209868, Tables 2–3) render beside ours as a static cited table, never recomputed:

| Model | Global CPC, with a production function | Without |
|---|---|---|
| Gravity, exponential decay | 0.16 | — |
| Gravity, power-law decay | 0.16 | — |
| Radiation | 0.16 | — |
| Extended radiation | 0.16 | — |
| XGBoost, extended features | 0.21 | 0.43 |
| ANN, extended features | 0.22 | 0.40 |

And the sentence that makes this the first thing on `/methods`: *"roughly half the achievable accuracy in this field lives in getting origin outflow totals right, which is why we do not ship a fitted flow model."*

#### 5.6.3 Computation, budget and signature

`s_ij` is computed once at ingest. For each origin, sort the other 229 countries by `d`, take a prefix sum of populations: O(N² log N), under 250 ms in the ingest process. Ship the result as two derived columns on the corridor table for the hold-out year only — `radiation_pred` (12,000 float32, 48 KB) and `s_ij` (48 KB) — which keeps the in-browser CPC a single pass over 12,000 elements, under 2 ms.

```ts
export interface RadiationInput {
  readonly corridors: readonly { readonly orig: string; readonly dest: string }[];
  readonly year: number;                              // must equal the snapshot's declared hold-out year
  readonly finiteSystemNormalisation: boolean;        // default false
}
export interface RadiationOutput {
  readonly predictions: readonly { readonly orig: string; readonly dest: string; readonly predicted: number }[];
  readonly cpc: Measured<number>;                     // unit 'dimensionless'
  readonly corridorCount: number;
  readonly heldOutYear: number;
}
export declare function runRadiationNull(
  inputs: RadiationInput, world: WorldView, seed: number,
): Result<RadiationOutput>;
```

Mandatory caveats on `cpc`: `['radiation.nullModel', 'cpc.truncatedMatrix', 'cpc.heldOut']`. `Spread.kind = 'none'` with `whyAbsent: 'A single scalar computed over a fixed corridor set and a fixed year. It has no sampling distribution.'`

Tests: a two-country world where `s_ij = 0` reduces to `T_ij = T_i · n_j / (m_i + n_j)`, hand-checked; `CPC(T, T) === 1` exactly; `CPC(T, 0) === 0`; CPC symmetric in its arguments; a synthetic three-country fixture with a hand-computed `s_ij` ring.

#### 5.6.4 The refusal: no fitted flow model

Render at `/methods`, below the CPC scoreboard, as a model card for a model that does not exist. Copy, as written:

> **Not built: a fitted bilateral flow model.**
>
> The obvious thing to build here is a gravity model estimated by Poisson pseudo-maximum likelihood with origin-year and destination-year fixed effects, or a nested logit with multilateral resistance. We did not build either, and we ship no coefficients.
>
> A fitted model is a research result, not a build step. It needs a panel, a separation-safe estimator, clustered standard errors, a held-out backtest across at least ten rolling origins, and a published covariance matrix — and Abel & Cohen gives six five-year periods, which cannot support a ten-window rolling backtest at all. The estimator literature is not settled either: PPML is consistent under a correctly specified conditional mean, but alternatives have been found less biased under economically determined zeros, and this product will not write "PPML is unbiased" anywhere.
>
> The available published coefficients cannot be shipped as defaults. They were estimated on `log(flow + 1)` by ordinary least squares with fixed effects — the exact specification the same literature says not to use — and dropping a reduced-form coefficient into a λ-scaled nested-logit kernel does not reproduce the effect it was estimated for. The distance, common-language and contiguity magnitudes could not be verified against a primary source at all; only their signs could.
>
> So there is no `coefficients.json` in this repository, no `β_dist`, no `β_comlang`, no `β_contig`, no diaspora elasticity, no visa elasticity, no migration hump, at any magnitude, behind any badge. A placeholder coefficient in a dark dashboard becomes a cited coefficient within a week.
>
> What we ship instead is above: a parameter-free null model, and the field's own accuracy ceiling printed beside it.

Enforcement: `pnpm check:policy` fails the build if any of `coefficients.json`, `beta_`, `β_`, `ppml`, `nested_logit`, `gravity_fit` appears as an identifier, filename or export anywhere outside `/methods` copy and this refusal's fixture.

### 5.7 (c) Occupational shortage matching — refused

There is no occupational dimension anywhere in v1. No `isco`, `occupation`, `soc`, `noc`, `anzsco`, `osca`, `kldb` or `esco` column exists in any snapshot table. A test asserts this by reading `snapshot/manifest.json` and failing on any column whose name matches those tokens.

`/methods` model card copy, as written:

> **Not built: occupational shortage matching.**
>
> The question — which occupations is a destination short of, and who could fill them — is the right question, and it is the one the EU Talent Pool regulation will consume. The data to answer it globally does not exist.
>
> ILOSTAT is the only worldwide source that crosses employment by occupation with place of birth, and it does so at **ISCO-08 one-digit only** — ten major groups. Its two-digit table drops the birth-status dimension entirely, so you cannot cross the two. Employment by four-digit occupation and foreign-born status is not available from any free API anywhere.
>
> Vacancies are worse. Eurostat's quarterly vacancy series carries **roughly 37 national reporters**, at one-digit ISCO. The United States JOLTS survey has **no occupational dimension at all** — job openings are published by industry and region, and the Bureau of Labor Statistics says it does not collect occupation. Time-to-fill, the input every shortage index needs, is derivable nowhere at scale; Australia's employer survey reports a fill rate, not a time to fill.
>
> The crosswalks leak too. There is no official correspondence table between Canada's NOC 2021 and ISCO-08; the route is a two-hop chain through two earlier vintages. Germany's official crosswalk maps 1,300 national codes onto 420 of the 436 ISCO unit groups, with 387 rows explicitly flagged as non-unique. Japan and Korea key their admission schemes on economic sector, not occupation, and cannot be expressed in ISCO without fabricating the mapping.
>
> A global occupational layer would therefore be fabrication for roughly 150 countries, rendered at the same visual weight as the handful where it is real. It returns when the data does.

Traps bound to fixture-backed regression tests on `/sources`: the ILOSTAT one-digit ceiling, the JOLTS absence, the 37-reporter vacancy coverage, the missing NOC 2021 crosswalk.

### 5.8 (d) Migration pressure and risk index — refused, and unrepresentable

This is not a scope cut. It is a prohibition, and you implement it as one.

No origin-side pressure index, no displacement pressure index, no outflow risk score, no departure forecast, no propensity score, no cohort scoring, no hotspot ranking of origins. Forecast targets, if any ever ship, are restricted to arrivals and needs at destination.

Three independent reasons, all rendered:

1. **The weights are invented.** Every composite of this shape in the source material carries author-chosen weights with no literature behind any number. A five-term index with weights summing to 1.00 reads as calibrated and is not.
2. **The arithmetic breaks.** Robust Z-scoring requires `(x − median) / max(1.4826·MAD, ε)`, and the median absolute deviation is zero for most administrative units, so the naive form emits `Infinity` and `NaN`. A cross-sectional Z-score is also structurally incapable of showing global escalation, which is the one thing such an index would be read as showing.
3. **It is the function the law names.** EU AI Act Annex III point 7(b) covers systems for *assessing a risk, including a security risk, an irregular-migration risk or a health risk, posed by a natural person who intends to enter or has entered a Member State*. An origin-side pressure score is that function with the person aggregated away. Absence beats mitigation.

Enforcement, as an addition to the banned-strings rule module's word list, checked over source, copy, the built bundle, package names, route paths and asset filenames like every other entry:

```
pressure_index · risk_score · propensity · displacement_pressure
```

`/methods` copy, as written:

> **Not built: a migration pressure or risk index.**
>
> We do not score origins. There is no index here that ranks countries by how many people are about to leave them, and there will not be one.
>
> Any such index is a weighted composite, and every weight in every published version of it is an author's choice with no evidence behind the specific number. Its arithmetic fails quietly: the robust standardisation it needs divides by a dispersion that is zero for most administrative units, and a cross-sectional score cannot show global escalation at all, which is the only thing a reader would use it for.
>
> More decisively, the European Union's Artificial Intelligence Act, Annex III point 7(b), names systems that assess a risk — security, irregular-migration or health — posed by a person intending to enter a Member State. An origin-side pressure score is that system with the individual aggregated away. We would rather not build it than build it carefully.
>
> What this product shows instead is what has already been estimated to have happened, how much the estimates disagree, and where nobody counted.

### 5.9 (f) Scenario simulation over a time horizon

There is no scenario engine. There are three time surfaces, and a permalink.

#### 5.9.1 The three time surfaces

| Surface | Range | What moves | What the user may change |
|---|---|---|---|
| **The Year Machine** | 1990–2023, 34 discrete annual frames | the time cursor only | the year, by handle, arrow keys or `Space` |
| **The replacement differential** | 2024–2050, annual | nothing; it is a shipped series | which of the two named WPP variants is shown, and both simultaneously |
| **The PSR solve** | `baseYear` → `targetYear` within 2024–2050 | nothing; one scalar per solve | `baseYear`, `targetYear` |

**No interpolation, anywhere.** No `transitions` on any data accessor; an AST rule fails the build if `transitions` appears in any layer whose data is annual. `align(series, grid, method)` defaults to `"none"`: a missing year is a visible gap on a sparkline, never a forward-fill, never a zero. Under `prefers-reduced-motion` the behaviour is identical, because it was already honest.

The only user-editable model parameters in the entire product are: the headroom assumption-set name, the headroom horizon `T`, the PSR base and target years, and the corridor selection. That is the complete list. Nothing else is a slider, and nothing that is not on this list may become one.

#### 5.9.2 The permalink — an encoding, not an engine

```ts
export interface ScenarioPermalinkV1 {
  readonly v: 1;
  readonly year: number;                       // 1990..2023
  readonly camera: {
    readonly lon: number; readonly lat: number; readonly zoom: number;
    readonly pitch: number; readonly bearing: number;
  };
  readonly layers: Readonly<Record<string, boolean>>;
  readonly workingSet: readonly string[];      // iso3 and 'ORIG-DEST' corridor ids
  readonly headroom: {
    readonly iso3: string; readonly assumptionSetName: string; readonly horizonYears: number;
  } | null;
  readonly psr: {
    readonly iso3: string; readonly baseYear: number; readonly targetYear: number;
  } | null;
}

export declare function encodeScenario(s: ScenarioPermalinkV1): Promise<string>;
export declare function decodeScenario(token: string): Promise<Result<ScenarioPermalinkV1>>;
```

Encoding is `base64url(deflate-raw(JSON.stringify(s)))`. `CompressionStream` supports gzip, deflate and deflate-raw only — **not zstd**. Cap the encoded token at 4,096 characters; a payload that exceeds it drops `workingSet` entries from the end until it fits and sets a visible truncation badge. A token that fails to decode, fails Zod validation, or carries `v !== 1` yields `Refusal('InsufficientHistory', 'This link was not produced by this version of the product and cannot be read.', [])`, rendered as a sentence over the default camera — never a crash, never a silent fallback that looks like a successful load.

Round-trip test: 1,000 `ScenarioPermalinkV1` values generated from a fixed in-test seed encode and decode to deep-equal.

### 5.10 (g) The allocation optimiser — refused, and rendered in full at `/methods#allocation`

`/solve` 301s here. This is the first refusal on the page, and it is the longest.

**Hard prohibition, restated because the description is detailed enough to be mistaken for a specification.** Do not import `highs`. Do not import `lp-model`, `glpk.js`, `javascript-lp-solver` or `munkres-js`. Do not write an objective function in code. Do not add a `solve()` stub, a `Model` implementation, or a type named `Assignment`, `Placement` or `Shortlist`. **The description is the deliverable.** `pnpm check:policy` fails the build if any of those five package names appears in any `package.json`, in the lockfile, or in an import statement, and a test asserts the objective function below exists only as a string in the `/methods` copy fixture.

The rendered content, in this order.

**The objective function**, as plain text:

```
max  Σ_i Σ_{j∈C_i} ( w_E·E_ij + w_N·N_ij + w_L·L_ij + w_H·H_ij + w_P·P_ij − w_K·K_ij ) · x_ij
   + w_F·t
   − w_U·Σ_i v_i
   − w_S·Σ_j Σ_d z_jd
   − w_Q·Σ_m δ_m
```

**The weight vector**, as a table with the sum shown: `w_E 0.30`, `w_P 0.25`, `w_N 0.15`, `w_L 0.10`, `w_H 0.08`, `w_K 0.05`, `w_F 0.07` — seven weights summing to 1.00. `w_U` (big-M, 1000), `w_S` (0.02) and `w_Q` (0.10) sit **outside** that normalisation; say so, because the source material's blanket "with Σw = 1" was misleading.

**The three spec bugs, as open issues:**

1. `z_jd` is referenced in the objective with no definition anywhere — neither variable nor parameter. It must be defined as a congestion variable: `z_jd ≥ (Σ_i s_id·x_ij) − θ·c_jd`, `z_jd ≥ 0`, with `θ` defaulting to 0.85. Without this the objective is unimplementable as written.
2. The responsibility-sharing-key constraint was written as `|·| ≤ δ_m`. An absolute value is not a linear constraint. It must be two rows.
3. The anti-concentration cap `ρ = 0.02` names no time window. Two per cent per solve round and two per cent per year are very different policies, and the specification named neither.

Add a fourth, which is the one that would have cost a week: **the LP relaxation is not integral.** Total unimodularity holds only for unit case sizes on a single capacity dimension. Integer multi-person cases across six capacity dimensions destroy the network structure, and the family-unity, anti-dumping, anti-concentration and group-fairness constraints each destroy it again independently. A mixed-integer solve is required in every realistic configuration.

**The solver choice and its budget**, as documentation of a build that did not happen:

| | |
|---|---|
| Solver | HiGHS via WebAssembly — npm `highs`, version 1.15.3, MIT licence, embeds HiGHS 1.15.x, requires Node ≥ 18 |
| Modelling layer | `lp-model` 0.4.2, MIT, CPLEX LP format |
| Explicitly rejected | `glpk.js` 5.0.0 — GPL-3.0, which would contaminate the licence of the data component and the dashboard |
| WASM-blocked fallback | `javascript-lp-solver` 1.0.3, Unlicense |
| Where it would run | a Web Worker, never the main thread |
| Solver settings | `mip_rel_gap = 0.01`, time limit 8 s, return the incumbent with its achieved gap displayed rather than blocking the interface |
| Interactive target | ≤ 2,000 cases × ≤ 400 localities, candidate set pruned to K = 20 per case: p50 ≤ 1.5 s, p95 ≤ 5 s, hard cap 10 s |
| Problem size after pruning | 40,000 binaries, roughly **300,000 nonzeros** with six capacity dimensions — not the 140,000 the source material claimed |
| Status of every latency figure above | **unbenchmarked hypotheses.** None rests on a measurement on any hardware. |

**The legal and evidential constraints**, rendered last and not softened:

> The General Data Protection Regulation, Article 22, gives a person the right not to be subject to a decision based **solely** on automated processing that produces legal effects or similarly significantly affects them. A placement optimiser sits squarely against that article. The mitigation the literature proposes — return a ranked shortlist of three with a per-term decomposition, require a named human actor and a recorded override reason before any placement commits — is a real mitigation, and it does not fix the epistemics.
>
> The reported gains are contested. The headline figures are roughly +40% employment in a United States backtest and roughly +75% in a Swiss one, and +22% to +38% relative on a 496-person cohort. Those are off-policy backtest estimates, not trial results; no randomised trial has been published. In February 2026 a paper built a synthetic refugee-matching environment calibrated to the real setting but constructed so that **no assignment policy can beat random**, and found that model-based policy evaluation reported stable gains of around 60% when the true effect was zero — on par with the 22% to 75% improvements reported in the literature. A later paper by the original authors finds the estimates robust across inverse-probability and doubly-robust estimators. Both are real; we cite both, because omitting the second while citing the first is exactly the failure this product exists to prevent.
>
> A critical study of the Dutch deployment, based on freedom-of-information requests, found that the system "prioritises aggregate optimisation over individual opportunities," with disproportionate risk of discrimination on the basis of ethnicity, gender or marital status, and that it reduced the capacity of both refugees and caseworkers to contest an automated decision.
>
> So: we did not build it. Its output is a ranked shortlist of destinations for people. On a targeting-tool axis, absence beats mitigation, and a per-term decomposition of an invented weight vector is fake precision in its purest form. The `Model` contract in this repository is the seam. A third party can implement one against the public software development kit and will inherit every policy rule in `@exodus/policy` by construction — which is a better outcome than us shipping it with a disclaimer.

### 5.11 The full test and budget ledger

Every model ships with the tests named in its subsection. In addition, one sweep test in `packages/kernel/sweep.spec.ts` runs all five models over the entire committed snapshot and asserts:

- no throw, for any country, corridor, period or year in the snapshot
- every `Ok` numeric field passes `Number.isFinite`
- every `Measured` has `caveats.length ≥ 1` and `sourceIds.length ≥ 1`
- every `CaveatId` emitted resolves in `CAVEATS`
- every `Refusal` has a `reason` of at least 40 characters that ends in a full stop and contains no digit
- `vintage` on every `Measured` equals the **oldest** contributing vintage, `latencyDays` the **largest**, and `estimateKind` the **worst** class among contributors, checked against a hand-computed fixture for three corridors and three countries
- seeds 1 and 2 produce deep-equal results for every model
- the wall-clock total is within the caps in §5.2, with a 3× headroom multiplier

Three refusal paths are exercised end-to-end through the renderer at M6 and M7 — `NoServiceStockData`, `NonMonotoneBisection`, `NoSharedPeriodGrid` — and each is asserted to render prose, not a number. `NoMirrorPair` and `InsufficientHistory` are exercised at the kernel level.

---

## 6. The WebGL globe and visual system

This section is the complete rendering spec. It is binding. Where a research note, a deck.gl example or your own instinct suggests a layer, an effect or a motion that is not listed here, the answer is no — §2 OUT and §10 of the design already decided it. Build exactly this stack, feed it exactly this way, and prove it with exactly these tests.

The globe has one job the rest of the product does not: it must make ignorance visible at a glance. Width is what we think happened, dash is how much the two best models disagree, dimness is whether anybody counted. Everything below exists to keep those three channels legible at 12,000 corridors on software rendering.

### 6.1 Pinned dependencies, build flags, and what is forbidden

Install exactly these versions. No carets on deck.gl or luma.gl — their peer ranges use `~`, so they must move in lockstep.

| Package | Version | Why it is here |
|---|---|---|
| `deck.gl` | `9.4.0` | Meta-package. Terminal release of the v9 line; v10 is a future migration, not this build. |
| `@deck.gl/core` | `9.4.0` | `_GlobeView`, `Deck`, `PostProcessEffect`. |
| `@deck.gl/layers` | `9.4.0` | `PathLayer`, `SolidPolygonLayer`, `ScatterplotLayer`, `TextLayer`, `GeoJsonLayer`. |
| `@deck.gl/geo-layers` | `9.4.0` | `H3HexagonLayer`. |
| `@deck.gl/extensions` | `9.4.0` | `PathStyleExtension`, `CollisionFilterExtension`, `FillStyleExtension`. |
| `@deck.gl/react` | `9.4.0` | `<DeckGL>` host. |
| `@luma.gl/core` | `9.4.1` | Device, `Buffer`, render-pipeline parameter types. |
| `@luma.gl/effects` | `9.4.1` | **Post-FX live here.** `@luma.gl/shadertools` ships only `color`, `engine`, `geospatial`, `lighting`, `math`, `volume` — no post-processing pass at all. |
| `apache-arrow` | `21.2.0` | Parquet → Arrow → plain typed arrays. |
| `@loaders.gl/parquet` | `4.5.1` | Reads `snapshot/*.parquet`. Pin exactly; 5.0.0 alphas are published. |
| `h3-js` | `4.5.0` | Build-time r3 cell handling only. Not called per frame. |

**Do not install, do not import, do not add to `package.json`:** `@geoarrow/deck.gl-geoarrow`, `@geoarrow/deck.gl-layers`, `maplibre-gl`, `@deck.gl/maplibre`, `@deck.gl/mapbox`, `pmtiles`, `@protomaps/basemaps`, `@duckdb/duckdb-wasm`, `kepler.gl`, `three`, `cesium`, `globe.gl`, `cobe`. `pnpm check:policy` includes a dependency-manifest rule that fails the build if any of these strings appears in any `package.json` in the workspace.

**Renderer:** WebGL2 only. Do not pass `device: 'webgpu'`, do not add a `?renderer=` switch. WebGPU in 9.4 is documented as experimental and not recommended for production, and a second rendering path is a second product. Add to `apps/web/vite.config.ts`:

```ts
resolve: { conditions: ['visgl:webgl-only', 'import', 'module', 'browser', 'default'] }
```

This resolves deck.gl's alternate builds with the WGSL sources and WebGPU branches stripped. Verify at M2 that the bundle shrinks and that `pnpm build` still renders; if the condition does not resolve, remove it and record the bundle delta in `DECISIONS.md` — it is a size optimisation, never a correctness requirement.

### 6.2 The view, the camera, and the projection rules

```ts
// packages/globe/src/view.ts
import { _GlobeView as GlobeView } from '@deck.gl/core';
```

`GlobeView` is an experimental class exported under an underscore. **Always import it aliased.** It supports `coordinateSystem: 'lnglat'` only — never pass another coordinate system to any layer on this view. There is exactly one view in the product; `MapView` is never instantiated, which is what removes the documented GlobeView↔MapView switching bug from the build entirely.

```ts
// packages/globe/src/camera.ts
export interface GlobeCamera {
  readonly longitude: number;
  readonly latitude: number;
  readonly zoom: number;
  readonly pitch: 0;
  readonly bearing: 0;
}

/** Global South default. Art direction, committed once, tuned only against CAM-01. */
export const DEFAULT_CAMERA: GlobeCamera = {
  longitude: 25,
  latitude: 5,
  zoom: 0.55,
  pitch: 0,
  bearing: 0,
};

export const ZOOM_RANGE: readonly [number, number] = [0.2, 5.5];
```

`pitch` and `bearing` are typed as the literal `0` so a tilted or rotated globe is a compile error. `GlobeController` in 9.4 supports bearing and pitch via shift-drag; you disable both (`controller: { dragRotate: false, touchRotate: false, keyboard: true, inertia: false }`). Inertial spin is off because an unattended globe that keeps moving after the user lets go is motion the data does not justify.

**CAM-01 (test, M2):** at `DEFAULT_CAMERA` on a 1440×900 canvas, project the ADM0 centroids of `NGA`, `ETH`, `IND`, `IDN`, `MEX`, `SYR` through the deck viewport and assert all six land inside the canvas bounds with a 48px margin. If any fails, adjust `DEFAULT_CAMERA` until it passes and commit the new value. Do not adjust the test.

Maximum zoom is capped at 5.5 because `GlobeView` has no high-precision rendering above zoom 12 and there is no basemap to justify going there. The zoom cap is enforced in the controller, not by hope.

### 6.3 The layer stack, exactly

Seven layers. deck.gl draws in array order and the last drawn is on top, so the array is the design's "top to bottom" list **reversed**:

```ts
// packages/globe/src/build-layers.ts — the only place a deck.gl layer is constructed
export const LAYER_ORDER = [
  'ocean-sphere',    // 7 — bottom, mandatory, opaque
  'graticule',       // 6
  'countries',       // 5 — ADM0 choropleth
  'h3-density',      // 4 — r3, pop / area_km2
  'corridors',       // 3 — the product
  'incidents',       // 2 — corpus ribbon, SNAPSHOT chrome
  'labels',          // 1 — top
] as const;
export type GlobeLayerId = (typeof LAYER_ORDER)[number];
```

Plus exactly one transient overlay, `selection-halo`, appended after `corridors` when and only when something is selected (§6.9). Eight layers maximum, four pickable — against documented ceilings of ~100 comfortable layers and 256 pickable layers, this is not a scale problem and you must not treat it as one.

| id | Class | Count | Pickable | `parameters` |
|---|---|---|---|---|
| `ocean-sphere` | `SolidPolygonLayer` | 1 polygon | **yes** (depth only, §6.9) | `{cullMode:'back', depthWriteEnabled:true, depthCompare:'less-equal'}` |
| `graticule` | `GeoJsonLayer` | 36 meridians + 17 parallels | no | `{cullMode:'back', depthWriteEnabled:false, depthCompare:'always'}` |
| `countries` | `SolidPolygonLayer` | 258 | yes | `{cullMode:'back', depthWriteEnabled:false, depthCompare:'always'}` |
| `h3-density` | `H3HexagonLayer` | 41,162 | yes | `{cullMode:'back', depthWriteEnabled:false, depthCompare:'always'}` |
| `corridors` | `PathLayer` + `PathStyleExtension` | ≤12,000 | yes | `{cullMode:'none', depthWriteEnabled:false, depthCompare:'less-equal'}` |
| `selection-halo` | `PathLayer` | ≤2 | no | `{cullMode:'none', depthWriteEnabled:false, depthCompare:'less-equal'}` |
| `incidents` | `ScatterplotLayer` | ≤3,000 | yes | `{cullMode:'none', depthWriteEnabled:false, depthCompare:'less-equal'}` |
| `labels` | `TextLayer` + `CollisionFilterExtension` | ≤60 visible | no | `{depthCompare:'always'}` |

**The occlusion contract, and why every cell in that table is the value it is.** `GlobeView` enables back-face culling by default, and `cullMode:'none'` is a per-layer override — so the moment you override it on `corridors`, culling stops being your occlusion strategy for that layer. The opaque ocean sphere is therefore **mandatory, not optional**: it is the only thing that hides far-side corridors, and it does so by writing depth. That is why `ocean-sphere` is the single layer in the stack with `depthWriteEnabled: true`.

The three surface layers (`graticule`, `countries`, `h3-density`) are geometrically coincident with the sphere. Depth-testing coincident surfaces produces z-fighting speckle. They therefore use `depthCompare:'always'` + `depthWriteEnabled:false` and rely on (a) back-face culling to drop the far hemisphere and (b) array order to stack correctly. Do not "fix" this by nudging their altitude.

Consequence to know before you see it and call it a bug: **the graticule is drawn before the choropleth, so it is visible over ocean and hidden under land.** That is the design's stated order. Leave it.

`parameters` key names are luma.gl v9 (WebGPU-style) names. `cullMode` is documented verbatim on the `ArcLayer` and `TripsLayer` pages; `depthWriteEnabled` / `depthCompare` are **[UNVERIFIED]** as exact spellings. At M0, read `RenderPipelineParameters` from the installed `@luma.gl/core@9.4.1` type definitions and correct the key names in one file (`packages/globe/src/parameters.ts`) before writing any layer. Do not guess twice.

### 6.4 How each layer is fed

There is no tile server, no basemap, no vector tiles, no raster texture, no night-lights image and no terrain. Every byte the globe renders comes from `snapshot/`, committed to git, and loads with the network disabled.

| Layer | Source file | Transport | Materialisation |
|---|---|---|---|
| `ocean-sphere` | none | generated in code | one polygon ring `[[-180,-90],[180,-90],[180,90],[-180,90]]`, closed |
| `graticule` | none | generated in code | `packages/globe/src/geometry/graticule.ts`, 10° spacing, vertices every 2° so the lines curve on the sphere |
| `countries` | `snapshot/adm0.geojson.gz` (3 MiB budget) | `DecompressionStream('gzip')` → `JSON.parse` | 258 plain objects; accessors, not binary |
| `h3-density` | `snapshot/h3_r3.parquet` | `@loaders.gl/parquet` → Arrow `Table` → typed arrays | 41,162 objects `{h3: string, pop: number, area_km2: number}` built once at load |
| `corridors` | `snapshot/corridors.parquet` + `snapshot/manifest.json` | Parquet → Arrow → `buildAttributeCube()` | binary `data.attributes`, §6.5 |
| `incidents` | `snapshot/corpus-index.json` | fetch | ≤3,000 plain objects |
| `labels` | derived from `countries` + current year's rank | in memory | ≤60 objects |

**Binary attributes are required for `corridors` and forbidden as premature optimisation everywhere else.** 258 polygons and 41,162 hexes are below the cost threshold, are built exactly once, and never re-run because their accessors are scoped by `updateTriggers`. Writing a binary polygon packer for 258 features is how you lose a day.

**The Arrow chunking trap.** An `apache-arrow` column with more than one record batch has no single contiguous buffer, and reading `.values` off the first chunk silently truncates your data. Always materialise:

```ts
// packages/semantic/src/arrow.ts
import type { Table } from 'apache-arrow';

export function contiguousF32(table: Table, name: string): Float32Array {
  const col = table.getChild(name);
  if (col === null) throw new Error(`arrow column missing: ${name}`);
  const out = new Float32Array(col.length);
  let o = 0;
  for (const chunk of col.data) {
    const values = chunk.values as ArrayLike<number>;
    for (let i = 0; i < chunk.length; i++) out[o++] = values[chunk.offset + i];
  }
  if (o !== col.length) throw new Error(`arrow column ${name}: wrote ${o} of ${col.length}`);
  return out;
}
```

**ARROW-01 (test, M0 gate (c)):** a fixture Parquet written with a forced 3-batch layout round-trips through `contiguousF32` to the exact expected values, and a unit test asserts `col.data.length > 1` for that fixture so the test cannot pass trivially.

### 6.5 The Year Machine: geometry, the AttributeCube, and the no-easing rule

Great circles are tessellated **once, at load**, from the 2-vertex corridor definition. This distinction is load-bearing and the policy package depends on it:

> The *fact* is a 2-vertex great circle between two ADM0 centroids. The *render buffer* is a 32-point sample of that same great circle. The 32-point form exists only inside `packages/globe`, is never written to a `Fact`, never persisted, never exported, never encoded into a permalink, and never returned by any public API. `packages/policy`'s >2-vertex `LineString` refinement guards the fact; it must not be applied to the render buffer, and the render buffer must not be given a type that could be mistaken for a movement geometry.

```ts
// packages/globe/src/geometry/great-circle.ts
const SEGMENTS = 32;
const ALT_MIN_M = 8_000;
const ALT_MAX_M = 180_000;

function toVec(lng: number, lat: number): readonly [number, number, number] {
  const p = (lat * Math.PI) / 180;
  const l = (lng * Math.PI) / 180;
  return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)];
}

/** Writes SEGMENTS * 3 floats (lng, lat, altitudeMetres) into `out` at `offset`. */
export function writeGreatCircle(
  a: readonly [number, number],
  b: readonly [number, number],
  out: Float32Array,
  offset: number,
): void {
  const v0 = toVec(a[0], a[1]);
  const v1 = toVec(b[0], b[1]);
  const dot = Math.min(1, Math.max(-1, v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2]));
  const omega = Math.acos(dot);
  if (omega < 1e-9) throw new Error('degenerate corridor: identical endpoints');
  if (omega > Math.PI - 1e-6) throw new Error('degenerate corridor: antipodal endpoints');
  const sinOmega = Math.sin(omega);
  for (let i = 0; i < SEGMENTS; i++) {
    const t = i / (SEGMENTS - 1);
    const w0 = Math.sin((1 - t) * omega) / sinOmega;
    const w1 = Math.sin(t * omega) / sinOmega;
    const x = w0 * v0[0] + w1 * v1[0];
    const y = w0 * v0[1] + w1 * v1[1];
    const z = w0 * v0[2] + w1 * v1[2];
    const r = Math.hypot(x, y, z);
    const k = offset + i * 3;
    out[k] = (Math.atan2(y, x) * 180) / Math.PI;
    out[k + 1] = (Math.asin(z / r) * 180) / Math.PI;
    out[k + 2] = ALT_MIN_M + (ALT_MAX_M - ALT_MIN_M) * Math.sin(Math.PI * t);
  }
}
```

**Altitude carries no data and never will.** The sine profile exists for exactly two reasons: a path at altitude 0 is coplanar with the ocean sphere and the choropleth and would z-fight into invisibility, and lifted paths let overlapping corridors be told apart. 180 km is 2.8% of Earth's radius — a gentle lift, not a fountain. **Do not map altitude to volume, distance, disagreement or anything else.** Decision 14 fixes the corridor layer at exactly three channels; altitude-by-volume would be a fourth and is refused.

Do **not** unwrap longitudes across the antimeridian. On `GlobeView` each vertex is projected independently onto the sphere, so a step from +179° to −179° is a small 3D step and renders correctly. Adding seam handling breaks it.

```ts
// packages/semantic/src/attribute-cube.ts
export interface AttributeCube {
  /** Ascending, from snapshot/manifest.json. NOT from any dataset's name. */
  readonly years: readonly number[];
  /** Rank-ordered by mean flow, descending. Length = corridorCount. */
  readonly pairIds: readonly string[];
  readonly corridorCount: number;
  readonly segments: number;
  /** Static. corridorCount * segments * 3 floats: lng, lat, altitudeMetres. */
  readonly positions: Float32Array;
  /** Static. Length corridorCount + 1; startIndices[i] is a VERTEX index. */
  readonly startIndices: Uint32Array;
  /** One pre-quantised frame per year, indexed by position in `years`. */
  readonly frames: {
    readonly width: readonly Float32Array[];     // corridorCount
    readonly dashArray: readonly Float32Array[]; // corridorCount * 2, pixels
    readonly color: readonly Uint8Array[];       // corridorCount * 4, RGBA
  };
}

export function buildAttributeCube(
  facts: readonly Fact[],
  manifest: SnapshotManifest,
): AttributeCube;
```

`corridorCount`, `years` and the animated attribute list come from `snapshot/manifest.json`. Nothing in `packages/globe` may mention Gaskin & Abel, 12,000 or 1990–2023 as a literal. Swapping the spine changes the manifest; the renderer does not change. **GLOBE-02 (test, M3):** `buildAttributeCube` passes against a synthetic 3-corridor 4-year fixture and against the real snapshot through the same code path, and a source-grep test fails if the literals `12000`, `12,000`, `1990`, `2023` or `gaskin` appear anywhere under `packages/globe/src`.

**Exact memory.** Static geometry 12,000 × 32 × 3 × 4 B = **4.61 MB** plus 48 KB of `startIndices`. Animated cube 34 × 12,000 × (4 + 8 + 4) B = **6.53 MB**, inside the design's ≈8 MB envelope. Total corridor VRAM ≈ **11.2 MB**. Create all 34 × 3 frames as luma.gl `Buffer` objects at load so scrubbing rebinds rather than uploads.

```ts
// packages/globe/src/corridors.ts
const attributes = {
  getPath:      { value: cube.positions, size: 3 },
  getWidth:     { buffer: gpu.width[yearIndex],     size: 1, type: 'float32' },
  getDashArray: { buffer: gpu.dashArray[yearIndex], size: 2, type: 'float32' },
  getColor:     { buffer: gpu.color[yearIndex],     size: 4, type: 'uint8', normalized: true },
};
```

Two things here are **[UNVERIFIED]** and must be settled at M0 before the corridor layer is written, each with a pre-decided fallback so you never stall:

1. **Object-level binary attributes on `PathLayer`.** The exact `BinaryAttribute` descriptor keys (`buffer` vs `value`, `type` spellings, whether non-position attributes on a path layer are read per-path or per-vertex) must be read from the installed `@deck.gl/core@9.4.0` `.d.ts`. *If non-position attributes are per-vertex only:* keep the cube per-corridor exactly as specified, add `packages/globe/src/expand.ts` which expands the current year's three frames into three reusable per-vertex staging buffers (384,000 vertices) on year change, double-buffered, budget **≤2.0 ms per year step**, asserted by a Vitest benchmark. The cube's size and the design's ≈8 MB figure do not change.
2. **`PathStyleExtension` dash units.** `PathStyleExtension({dash: true})` is mandatory. v9.4 adds `dashMode` and `dashUnits`; **you must select pixel units.** If the dash is expressed in common (world) space, the hatch density on screen changes as the user zooms, which means the disagreement encoding would mean different things at different camera positions. That is a correctness bug, not a style choice. *If a pixel dash unit does not exist in the installed build:* fall back to common units and recompute `getDashArray` from `d_p` **and the current zoom** on every `onViewStateChange`, writing into the staging buffer from (1); record the workaround in `DECISIONS.md`.

**The no-easing rule, restated as code you must be able to prove.** No `transitions` prop on any layer in `packages/globe`. No CSS transition on the year control's value. No interpolation between frames anywhere. `GLOBE-03 (test, M3)`: a Vitest unit test walks every object returned by `buildGlobeLayers()` and asserts `transitions` is `undefined` for all of them; `pnpm check:policy`'s AST module fails the build if the identifier `transitions` appears in any file under `packages/globe/src` or in any layer construction in `apps/web`. Under `prefers-reduced-motion` the behaviour is byte-identical, because it was already honest.

Do not use `TimelineWidget` from `@deck.gl/widgets`. It models time as a continuous controlled value, which is the exact implication the product refuses. The year control is a custom notched track: 34 stops, integer snapping, the year rendered at 44px tabular-nums, arrow keys step ±1, `Home`/`End` jump to 1990/2023, `Space` plays at 4 years/second, tooltip *"Annual estimates. No values are interpolated between years."*

Frame pacing: the year cursor lives in `packages/store/time-store.ts`. During a drag or playback, one `requestAnimationFrame` loop reads the store and calls `deck.setProps({layers})`. React state is never written at 60 Hz. **When nothing is being scrubbed the canvas must issue zero draw calls.** `GLOBE-04 (test, M3)`: with the page idle for 3 seconds, `onAfterRender` fires at most twice.

### 6.6 The corridor layer in full

One geometry, three channels, one platform channel the layer author cannot touch.

| Channel | Source | Mapping | Floor/clamp |
|---|---|---|---|
| **width** | flow, per-capita by default | `getWidth` = f32 px from a rank-preserving sqrt scale over the current year's values | `widthMinPixels: 1.2`, `widthMaxPixels: 6`, `widthUnits: 'pixels'` |
| **dash density** | `d_p` cross-model disagreement (M3), held constant within each 5-year period | `d_p < 0.10` → `[1, 0]` (solid). Otherwise `dashArray = [max(2, 12 − 10·min(d_p,1)), 2 + 10·min(d_p,1)]` in pixels | clamp `d_p` to `[0, 2]` upstream; at `d_p ≥ 1` the dash is `[2, 12]` and reads as a broken line |
| **opacity** | coverage-asymmetry `C = min(C_o, C_d)` (M4) | alpha byte = `round(255 · (0.15 + 0.85·C))` | floor at 0.15 so a corridor never vanishes entirely — an invisible corridor and an absent corridor must not look the same |
| **hue** | direction, not magnitude | slot 0 `#3987e5` inbound to the focused country, slot 2 `#199e70` outbound; slot 1 `#d95926` is **selection only** | §6.8 |

The dash mapping is a step function by construction: `d_p` is defined only on the six shared periods and is held constant across every year inside a period, so as the user scrubs, the hatch pattern visibly changes at 1995, 2000, 2005, 2010 and 2015 and nowhere else. **GLOBE-05 (test, M5):** capture the `dashArray` frame for every year, assert it is byte-identical within each period and differs across at least four period boundaries for a corridor with known disagreement.

Corridor-years with no `d_p` (outside the shared period grid) do **not** render as solid. Solid means *the models agree*. A corridor with no comparison renders with `dashArray = [3, 3]` **and** an alpha already dimmed by `C`, and its drawer states the `Refusal('NoSharedPeriodGrid')` as a sentence. A test asserts no corridor-year maps a missing `d_p` to `[1, 0]`.

`getColor`'s RGB comes from the layer author's palette slot; **the alpha byte is written by `semantic` after `encode()` returns**, and the type system prevents any other outcome:

```ts
// packages/contracts/src/layer.ts
export type PaletteSlot = 0 | 1 | 2;

/** Everything a MapLayer author may set. Note the `never`s. */
export interface LayerSpec {
  readonly id: string;
  readonly geometry: 'arc' | 'choropleth' | 'h3' | 'point';
  readonly paletteSlot: PaletteSlot;
  readonly width?: Float32Array;
  readonly dashArray?: Float32Array;
  readonly pickable: boolean;
  /** Platform-owned. Setting any of these is a compile error. */
  readonly opacity?: never;
  readonly alpha?: never;
  readonly estimateKind?: never;
  readonly latencyClass?: never;
}

export interface PlatformChannels {
  /** Coverage asymmetry C per corridor, [0,1], computed in `semantic`. */
  readonly coverage: Float32Array;
  readonly latencyClass: LatencyClass;
}

export interface ResolvedLayerSpec extends Omit<LayerSpec, 'opacity' | 'alpha'> {
  /** RGBA, alpha written from PlatformChannels.coverage. */
  readonly color: Uint8Array;
}

export function mergePlatformChannels(
  spec: LayerSpec,
  platform: PlatformChannels,
): ResolvedLayerSpec;
```

**GLOBE-06 (type-level test, M2):** a `// @ts-expect-error` fixture in `packages/contracts/test/` attempts `{ ...spec, opacity: 0.5 }` and the test suite fails if the error is *not* raised. Paired with a screenshot test: a Gulf corridor and a German corridor at the same width render at visibly different alpha, asserted by sampling the rendered pixels along each path and comparing mean luminance with a ≥25% gap.

### 6.7 The five signature effects — and the five that are refused

These five are what a screenshot must show. Nothing else animates.

**S1 — The flipbook.** 34 discrete global frames. One handle. The year at 44px in the corner. Zero interpolation. Implementation is §6.5 in its entirety: buffer rebinding plus an `updateTriggers` bump on `getWidth`, `getDashArray` and `getColor` — never on `getPath`, which must never be invalidated because re-tessellating 384,000 vertices mid-drag is the one way to blow the frame budget. The stepping *is* the effect. **Adding easing because it feels better is kill-list item 2 and the single most likely aesthetic regression in this build.**

**S2 — Dashes mean doubt, and they step.** §6.6. Pixel-space dashes so the reading is camera-invariant; step changes at period boundaries; roughly half the globe visibly hatched. Analytic antialiasing (`antialiasing: true` on `PathLayer`, HIGH and MED tiers only) keeps a 1.2px dashed line from aliasing into a dotted line; at LOW it is off and `widthMinPixels` rises to 1.6 to compensate.

**S3 — Dimness means nobody counted.** §6.6, alpha from `C`, floored at 0.15, unavailable to any layer author. This is the one effect that must survive every performance cut: if the tier ladder drops corridors from 12,000 to 4,000, the survivors are the top 4,000 by rank, which preserves the geography of the dimming.

**S4 — Warm hue is a service deficit, never a person.** On the globe, `countries` renders one of three states: a cool sequential ramp for the active per-capita indicator, a **hatch** for no data (§6.8), or — on `/headroom` context only — a warm deficit ramp anchored on `#d95926`. No warm hue ever encodes a count, rate or flow of people. **GLOBE-07 (test, M6):** a palette unit test enumerates every colour any globe layer can emit for a people-valued encoding and asserts hue ∉ [0°, 60°] ∪ [330°, 360°].

**S5 — Refusal is a rendered surface.** A country with no value for the active indicator is not grey and is not zero. It is filled with a 45° hatch at 6px pitch via `FillStyleExtension({pattern: true})` and appears in the `Shift+G` table as `—` with its refusal sentence. This also repairs a measured contrast failure: the diverging neutral `#383835` (1.64:1) reads identically to no-data as a flat fill, and a structural hatch is the only encoding that survives greyscale. **[UNVERIFIED]:** that 9.4's `FillStyleExtension` generates hatch patterns procedurally with no texture atlas. Verify at M2; *if it still requires an atlas*, commit `apps/web/public/hatch-45.png`, a 64×64 1-bit PNG under 300 bytes, and supply it as `fillPatternAtlas` — the visual result is identical and the budget impact is nil.

**GLOBE-08 (test, M6):** render a frame containing one no-data country and one country whose value is exactly zero. Convert to greyscale. Sample 25 pixels along a scanline inside each polygon. Assert the no-data polygon's luminance variance exceeds 400 and the zero polygon's is under 25. This proves the encoding is not colour-alone and that zero never reads as missing.

**The five effects that are refused, and the reason for each.** These are the ones you will be tempted to build because the research packs describe them in loving detail. Building any of them is a scope breach.

| Refused | Why |
|---|---|
| **GPU-advected particle flow field / animated arc pulses** | The data is annual. A particle implies continuous movement at sub-annual resolution the source does not have. §1: "they animate particles. Exodus animates nothing except the time cursor." Do not subclass `ArcLayer`, do not inject `DECKGL_FILTER_COLOR`, do not add a `uTime` uniform. |
| **Bloom / hex-binned pressure bloom / emissive pulses** | Bloom's only subject was the live incident layer, which is now corpus replay. Glowing chrome over replayed data is the exact freshness lie the latency-class rules exist to prevent. `@luma.gl/effects` ships `bloom`; do not import it. |
| **Chromatic aberration** | It exists only as a `chromaticAberration` prop of the bloom lens pipeline, and colour-fringing a data visualisation displaces marks by a subpixel amount that means nothing. It is a correctness bug wearing a film grade. |
| **Terminator / day-night / night-lights texture** | It requires a wall clock (`Date.now()` is banned outside `packages/kernel/clock`), it implies a sub-annual time base that contradicts the year cursor, the VIIRS/Black Marble redistribution terms are unestablished, and it costs a multi-MB texture against a 40 MiB cap. |
| **Cinematic fly-to on selection** | A camera move on selection destroys the frame-to-frame comparability that the entire flipbook exists to provide, and §7 permits exactly one camera move in the product. Selecting a corridor opens the drawer and draws the halo. The camera does not move. |

**The one permitted camera move,** implemented **last**, in M8, and shipped without if it is not done:

```ts
// packages/globe/src/entry.ts
export const ENTRY_DURATION_MS = 2400;
export const ENTRY_START: GlobeCamera = { ...DEFAULT_CAMERA, zoom: 0.2, longitude: 55 };

export function entryCamera(elapsedMs: number): GlobeCamera {
  const t = Math.min(1, Math.max(0, elapsedMs / ENTRY_DURATION_MS));
  const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  return {
    longitude: ENTRY_START.longitude + (DEFAULT_CAMERA.longitude - ENTRY_START.longitude) * e,
    latitude: ENTRY_START.latitude + (DEFAULT_CAMERA.latitude - ENTRY_START.latitude) * e,
    zoom: ENTRY_START.zoom + (DEFAULT_CAMERA.zoom - ENTRY_START.zoom) * e,
    pitch: 0,
    bearing: 0,
  };
}
```

Rules, all tested: the world is fully rendered at frame one (no layer fades in, no mark animates); once per session via `sessionStorage`; cancelled by any pointer, key or wheel event, which jumps immediately to `DEFAULT_CAMERA`; zero-length under `prefers-reduced-motion`; ends exactly at `DEFAULT_CAMERA`; `yearIndex` is constant throughout and no `updateTriggers` value changes during it. **GLOBE-09 (test, M8):** assert all six.

### 6.8 Post-processing, palette, and the in-canvas scrim

```ts
// packages/globe/src/effects.ts
import { PostProcessEffect } from '@deck.gl/core';
import { fxaa, vignette } from '@luma.gl/effects';

export const GLOBE_EFFECTS = [
  new PostProcessEffect(fxaa, {}),
  new PostProcessEffect(vignette, { radius: 0.78, amount: 0.32 }),
];
```

`fxaa` always; `vignette` subtle, with `radius` 0..1 (0 = centre of frame, 1 = edge) and `amount` 0..1. Dropped entirely at the LOW tier. **No bloom, no tone mapping, no SSAO, no outline pipeline, no scanline, no custom pass.** Post-FX operate on the framebuffer after all layers, so they cannot alter an encoding and are outside the `<Figure>` rule's scope — but they must not be allowed to reduce contrast below the token thresholds, which `GLOBE-10` checks.

**Palette bindings on the globe.** Three slots only, all-pairs ΔE2000 41.5 normal / 16.5 protan / 18.2 deutan:

| Slot | Hex | Meaning on the globe | Never |
|---|---|---|---|
| 0 | `#3987e5` | corridors inbound to the focused country; the cool sequential ramp's anchor | — |
| 1 | `#d95926` | **selection and active mark only** — the halo, the selected country's outline, the active period tick | a quantity of people |
| 2 | `#199e70` | corridors outbound from the focused country | — |

This assignment is binding. It is the only assignment of "direction and selection" across the three slots that also satisfies the rule that warm hue never means people: the warm slot is spent on selection, which is an interaction state, not a count. The sequential ramp for choropleth values stops at `#256abf` (3.58:1) — the next darker step measures 2.91:1 and fails. The warm *deficit* ramp is defined in `packages/ui/src/tokens.ts`, anchored on `#d95926`, and every stop is gated by a token test asserting ≥3:1 against `--surface-0 #0B0E14`. Do not hard-code a deficit hex inside `packages/globe`.

**`--scrim-globe` inside the canvas.** Every measured contrast ratio is void over a WebGL canvas, so every label needs the scrim — and the labels are inside the canvas, so the scrim must be too:

```ts
new TextLayer({
  id: 'labels',
  background: true,
  getBackgroundColor: [6, 8, 12, 184],   // --scrim-globe rgba(6,8,12,.72) → 0.72 * 255
  backgroundPadding: [5, 3, 5, 3],
  getColor: [232, 236, 242, 255],         // --text-primary
  getSize: 12,
  fontFamily: 'ui-monospace, monospace',
  characterSet: 'auto',
  extensions: [new CollisionFilterExtension()],
  collisionTestProps: { sizeScale: 1.3 },
  parameters: { depthCompare: 'always' },
});
```

**GLOBE-10 (test, M2):** sample the rendered pixels of the label background and the glyph body for ten labels over ocean, land, and a dense corridor bundle; assert the computed contrast ratio is ≥ 4.5:1 in every case, **after** the post-FX chain has run.

Far-side labels are not depth-culled (`depthCompare:'always'`), so they must be culled on the CPU. On each `onViewStateChange`, compute `dot(surfaceNormal(lng,lat), cameraDirection)` for the ≤60 candidate labels and set alpha 0 below 0.08. Sixty dot products is free; do it in the same frame, not in a worker.

### 6.9 Picking and hover at scale

Four pickable layers: `countries`, `h3-density`, `corridors`, `incidents` — plus `ocean-sphere`, pickable for depth only. Documented limits are 16M items per layer and 256 pickable layers; you are three orders of magnitude clear of both, so picking is a *correctness* problem here, not a performance one.

```ts
// packages/globe/src/picking.ts
export interface HoverTarget {
  readonly layerId: GlobeLayerId;
  readonly index: number;
}

/** Called at most once per animation frame from a pointermove listener. */
export function pickAt(deck: Deck, x: number, y: number): HoverTarget | null;
```

Rules:

1. **Throttle to one `pickObject` per animation frame.** Never call it directly from `pointermove`; buffer the last coordinates and drain in the rAF loop. Never call `pickMultipleObjects`.
2. **`radius: 6`** on `pickObject`. A 1.2px dashed path is unhittable with radius 0, and `dashGapPickable: true` on the extension so the gaps in a high-disagreement corridor are still hoverable — otherwise the corridors you most need to inspect become the hardest to click, which inverts the product's argument.
3. **The far-side picking problem.** deck.gl's picking pass draws only pickable layers, so with `cullMode:'none'` on `corridors` a far-side corridor is pickable straight through the Earth unless something writes depth in that pass. `ocean-sphere` is therefore `pickable: true`; a hit on it resolves to `null` in `pickAt` and never opens anything. **[UNVERIFIED]** that a pickable non-interactive layer writes depth in 9.4's picking pass. **GLOBE-11 (test, M2)** verifies it: position the camera so a known corridor passes behind the globe, `pickObject` at a screen point over near-side ocean where that corridor projects, and assert the result is the sphere or `null` — never the corridor. *If the sphere does not occlude in the picking pass:* reject on the CPU instead, by testing the picked corridor's mid-vertex normal against the camera direction and discarding when `dot < 0`.
4. **No `autoHighlight` on `corridors`.** Hover is expressed by the `selection-halo` layer, not by a colour modulation, because colour alone is a banned encoding. The halo is ≤2 paths — the hovered corridor and, on `/corridor/:orig-:dest`, its mirror — drawn from the same `positions` slice with `+3,000 m` added to each vertex's altitude so it cannot z-fight with the corridor it surrounds, at `getWidth` = corridor width + 2.5px, colour slot 1 `#d95926` at full alpha.
5. **Decision 14 is not repealed by the halo.** `selection-halo` may contain at most two objects and its `data.length` is asserted `<= 2` in a unit test. A per-corridor halo behind every corridor — the thing decision 14 rejects — is structurally impossible if that assertion holds.
6. Hover writes to a DOM tooltip and to the halo layer only. It never triggers a cube rebuild, never bumps `getPath`'s `updateTriggers`, and never touches the year cursor.

**GLOBE-12 (test, M3):** a scripted 200-point pointer sweep across the densest corridor bundle holds ≥55fps median, proving picking is not on the critical path.

### 6.10 LOD and culling

There is exactly one LOD mechanism and it costs nothing per frame.

**Corridors — rank-prefix rendering.** `pairIds` is rank-ordered at build time by mean flow, descending, and `positions`/`startIndices` follow that order. LOD is therefore a prefix: render the first `N` corridors by setting `data.length = N` and slicing `startIndices` to `N + 1`. No filtering, no re-upload, no CPU pass, no per-frame branch. `N` comes from the tier (§6.12) and never from the camera — a corridor must not appear or disappear as the user rotates the globe, because that would make the picture depend on where you are standing, which is precisely the property the product is arguing against.

**Hexes — none.** One global H3 r3 layer, 41,162 cells, always. r3 is the ethical cap for gridded people layers and there is no finer tier to descend to, so there is no LOD to build. `highPrecision` stays at its `'auto'` default: high precision is *required* at resolutions 0–5 and for pentagons, and forcing `false` at r3 renders geometrically wrong hexagons. **Never pass `highPrecision: false`.** `extruded: false` — 3D columns are out of scope.

```ts
new H3HexagonLayer({
  id: 'h3-density',
  data: hexes,                       // 41,162 objects, built once
  highPrecision: 'auto',
  extruded: false,
  coverage: 0.92,
  getHexagon: (d: H3Cell) => d.h3,
  getFillColor: (d: H3Cell) => densityRamp(d.pop / d.area_km2),
  updateTriggers: { getFillColor: [rampId] },
  pickable: true,
});
```

`pop / area_km2` is computed in the accessor, never pre-baked as a count, and `area_km2` ships per cell because r3 cell areas are not uniform. **GLOBE-13 (test, M2):** a unit test asserts no globe layer reads a `pop` column without dividing by `area_km2`, by grepping for `getFillColor` bodies referencing `pop` and requiring `area_km2` in the same expression.

**Culling.** Back-face culling from the view default does the hemisphere work for the four surface layers. `corridors`, `selection-halo` and `incidents` override to `cullMode:'none'` and are occluded by the sphere's depth instead. Labels are CPU-culled by normal (§6.8). Frustum culling is deck.gl's; do not add your own.

### 6.11 Frame budgets and the performance harness

Two budgets. The real-GPU budget is what the product feels like; the SwiftShader budget is what CI enforces, because CI has no GPU and a software-rendering gate is a far harsher and more honest test than a developer's laptop.

| Layer | Real GPU (target 16.67 ms/frame) | SwiftShader (gate 18.18 ms/frame) |
|---|---|---|
| `ocean-sphere` | 0.2 ms | 0.6 ms |
| `graticule` | 0.2 ms | 0.5 ms |
| `countries` (258) | 0.6 ms | 2.4 ms |
| `h3-density` (41,162) | 3.0 ms | 6.0 ms |
| `corridors` (12,000 × 32) | 2.2 ms | 5.5 ms |
| `incidents` + `selection-halo` | 0.3 ms | 0.5 ms |
| `labels` (≤60) | 0.4 ms | 0.8 ms |
| post-FX (`fxaa` + `vignette`) | 0.9 ms | 1.4 ms |
| JS main thread (store, picking, layer construction) | 1.5 ms | 1.5 ms |
| **slack** | **7.4 ms** | **−0.9 ms** |

**Every millisecond in that table is an [UNVERIFIED] budget, not a measurement.** The SwiftShader column is deliberately over-subscribed; that is the point of the M0 gate. Measure at M0, write the real numbers into `docs/smoke/perf-m0.json`, and if the median exceeds the gate, apply the design's pre-decided ladder **in order and without improvising**: corridors 12,000 → 6,000 → 4,000. Record which rung you landed on in `DECISIONS.md` and write it into `snapshot/manifest.json` so the renderer picks it up without a code change.

The harness is committed at M0 and runs in CI at every milestone thereafter.

```ts
// apps/web/e2e/perf/orbit.spec.ts
export interface OrbitPerfResult {
  readonly frameCount: number;
  readonly medianFrameMs: number;
  readonly p95FrameMs: number;
  readonly maxFrameMs: number;
  readonly networkRequests: number;
  readonly corridorCount: number;
  readonly hexCount: number;
  readonly countryCount: number;
}
```

Harness rules, all mandatory for the number to mean anything:

- Playwright 1.63.0, Chromium, launched with `--use-gl=angle --use-angle=swiftshader-webgl --enable-unsafe-swiftshader`. Plain `--use-gl=swiftshader` is legacy and must not be used.
- Container networking disabled (`--network=none`), and the harness additionally counts requests via `page.on('request')` and **fails on any count above zero**.
- Viewport 1440×900, `deviceScaleFactor: 1`, deck configured `useDevicePixels: 1`. A retina harness measures a different product.
- The orbit is scripted and deterministic: 10 seconds, longitude swept `DEFAULT_CAMERA.longitude` → `+360°` linearly, zoom constant, driven by setting `viewState` from the page's own rAF loop. No mouse input, no inertia.
- Frame times are collected in-page from `requestAnimationFrame` timestamp deltas, discarding the first 30 frames as warm-up, and returned via `page.evaluate`.
- Assertions: `medianFrameMs <= 18.18` (≥55fps), `maxFrameMs <= 50`, `networkRequests === 0`, `countryCount >= 190`, `hexCount === 41162`, `corridorCount === manifest.corridorCount`.
- A second spec, `scrub.spec.ts`, drags the year handle 1990→2023 over 3 seconds and asserts the same thresholds plus zero network requests. This is the M3 gate and it is the headline claim of the product.

Publish the measured medians to `/methods` as a figure, in `<Figure>`, with the hardware described. A performance claim with no measurement beside it is the same category of lie as an interpolated year.

### 6.12 Tier ladder and graceful degradation

Selected once per session, overridable with `?tier=LOW`, persisted in `sessionStorage`. The probe window is the 2.4s entry camera move; if the move is skipped (reduced motion, returning session, or M8 not built) run a hidden 30-frame probe at load instead.

| Tier | Trigger | Corridors | H3 | Post-FX | `useDevicePixels` | `antialiasing` |
|---|---|---|---|---|---|---|
| **HIGH** | `hardwareConcurrency ≥ 8` **and** `deviceMemory ≥ 8` **and** probe ≥ 55fps | `manifest.corridorCount` (≤12,000) | r3, 41,162 | fxaa + vignette | `true` | `true` |
| **MED** | probe ≥ 40fps | 8,000 | r3, 41,162 | fxaa + vignette | `1` | `true` |
| **LOW** | probe ≥ 20fps | 4,000 | **r2, 5,882** | fxaa only | `false` | `false`, `widthMinPixels: 1.6` |
| **FALLBACK** | no WebGL2 context, **or** viewport width < 640 CSS px | — | — | — | — | — |

The probe reads `navigator.hardwareConcurrency` and `navigator.deviceMemory` locally and transmits nothing. Do not read the WebGL debug renderer string; it is a fingerprinting surface and the tier ladder does not need it.

**LOW drops H3 to r2.** r2 is 5,882 cells — coarser than r3, never finer. The ethical cap is a ceiling on resolution, so degrading downward is always permitted and degrading upward never is. The r2 roll-up is produced by `h3-js` `cellToParent` at snapshot build and committed as a second tiny table; population is additive under H3 parent aggregation, so the roll-up is exact and the density denominator is recomputed from the r2 cell areas.

**FALLBACK is the accessibility surface, not a sad face.** When there is no WebGL2 context, `/` renders the `Shift+G` text alternative as the page's primary content: the sorted, keyboard-navigable top-25 corridor table, the year control, the AS-OF chip and the full provenance popovers, with one sentence explaining that the globe requires WebGL2. That surface already exists for §2 item 17, already has `role="application"` and `aria-describedby`, and is already axe-clean, so this costs one conditional and zero new UI. **GLOBE-14 (test, M8):** launch Playwright with WebGL disabled and assert `/` is axe-clean, renders ≥25 corridor rows, and contains no `<canvas>`.

**Mobile is out of scope and is not silently half-built.** Below 640 CSS px the product renders FALLBACK with the same sentence. Do not build touch gestures for the globe, do not add a mobile layout for the corridor drawer, do not test on a phone viewport beyond confirming FALLBACK renders and passes axe. A globe that half-works on a phone is worse than one that honestly declines.

### 6.13 Acceptance tests for this section

| ID | Milestone | Assertion | Fails the build |
|---|---|---|---|
| ARROW-01 | M0 | Multi-batch Arrow column materialises contiguously; fixture has >1 batch | yes |
| PERF-01 | M0 | `orbit.spec.ts`: median ≤18.18 ms, max ≤50 ms, 0 requests, ≥190 countries, 41,162 hexes, 12,000 corridors on SwiftShader | yes — triggers the 12k→6k→4k ladder |
| PERF-02 | M3 | `scrub.spec.ts`: full 1990→2023 drag, same thresholds, 0 requests | yes |
| CAM-01 | M2 | Six Global South centroids in frame at `DEFAULT_CAMERA`, 48px margin | yes |
| GLOBE-02 | M3 | `buildAttributeCube` passes synthetic + real fixtures; no dataset literals in `packages/globe/src` | yes |
| GLOBE-03 | M3 | No `transitions` on any layer; identifier banned by AST rule in `packages/globe` | yes |
| GLOBE-04 | M3 | Idle canvas issues ≤2 renders in 3 s | yes |
| GLOBE-05 | M5 | `dashArray` is byte-identical within each period, differs at ≥4 period boundaries | yes |
| GLOBE-06 | M2 | `LayerSpec.opacity` is a type error; Gulf vs German corridor luminance gap ≥25% | yes |
| GLOBE-07 | M6 | No people-valued globe encoding emits hue in [0,60]∪[330,360] | yes |
| GLOBE-08 | M6 | No-data hatch survives greyscale; zero ≠ missing by luminance variance | yes |
| GLOBE-09 | M8 | Entry move: once/session, cancellable, 0 ms under reduced motion, ends at `DEFAULT_CAMERA`, no data mark animates | yes (only if M8 ships the move) |
| GLOBE-10 | M2 | Label contrast ≥4.5:1 over ocean, land and corridor bundle, after post-FX | yes |
| GLOBE-11 | M2 | Far-side corridors are not pickable through the globe | yes |
| GLOBE-12 | M3 | 200-point pointer sweep holds ≥55fps median | yes |
| GLOBE-13 | M2 | H3 layer divides `pop` by `area_km2` | yes |
| GLOBE-14 | M8 | WebGL-disabled `/` is axe-clean, ≥25 rows, no `<canvas>` | yes |

### 6.14 The [UNVERIFIED] register for this section

Each of these must be resolved by reading the installed package, not by searching the web, and each already has its fallback decided. Resolve them in this order, at the milestone named, and record each outcome in `DECISIONS.md` in one line.

| # | Claim | Resolve at | Fallback if false |
|---|---|---|---|
| 1 | luma.gl v9 parameter keys `depthWriteEnabled` / `depthCompare` | M0, before any layer is written | read `RenderPipelineParameters` from `@luma.gl/core@9.4.1` `.d.ts` and correct `packages/globe/src/parameters.ts` |
| 2 | `PathLayer` accepts object-level binary attributes for `getWidth`/`getDashArray`/`getColor`, and accepts `{buffer}` descriptors | M0 | per-vertex expansion into double-buffered staging arrays, ≤2.0 ms/step, cube size unchanged |
| 3 | `PathStyleExtension` exposes pixel dash units in 9.4 | M0 | common units + recompute `getDashArray` on `onViewStateChange` |
| 4 | `GlobeView` reads the third position component as altitude in metres | M0 | scale the altitude constant until arcs visibly clear the sphere at zoom 0.55, commit the value, add a screenshot test |
| 5 | `FillStyleExtension` generates hatch patterns with no atlas | M2 | commit a 64×64 1-bit `hatch-45.png` (<300 B) as `fillPatternAtlas` |
| 6 | A pickable layer writes depth in the picking pass, so the sphere occludes far-side corridors | M2 (GLOBE-11) | CPU rejection by mid-vertex normal · camera dot product |
| 7 | The `visgl:webgl-only` export condition resolves under Vite 7 | M2 | remove the condition; record the bundle delta |
| 8 | Every millisecond in the §6.11 budget table | M0 | replace with measurements from `docs/smoke/perf-m0.json`; apply the 12k→6k→4k ladder if the gate fails |

**Do not upgrade any of these to verified without a reading. Do not proceed past M0 on 1–4.**


---

## 7. UX, information architecture and design system

This section is binding on everything the public build renders. It is written against the six routes and four overlays fixed in §3, the layer stack fixed in §6, and the visual signature fixed in §7 of the authoritative design. Where a screen named in an older brief does not appear here — Scenario Studio, Compare, Brief, Corridor Graph, `/plugins`, `/o/{type}/{id}` — it is cut, and §7.1 says where its one genuinely load-bearing capability now lives. Do not reintroduce a route. Six routes exist in `apps/web`. The three `apps/placement` routes specified in §12 are a separate route tree, a separate auth scope and a separate build artefact; they inherit the tokens in §7.9 and the components in §7.4, and nothing else in this section applies to them.

### 7.1 Resolutions: four cut screens, and where their capability went

Build these as specified. Do not build the cut route "because the capability exists".

| Cut screen | The one capability worth keeping | Where it now lives |
|---|---|---|
| Scenario Studio (`/studio`) | Editing a named assumption set and sharing the result | The **assumption-set editor** on `/headroom/:iso3` (§7.2.4) plus the **scenario permalink** (§7.7). No solver, no run button, no scenario object. |
| Compare (`/compare`) | Two estimates of the same quantity, side by side, with their divergence | The **three-channel comparison block** in the corridor drawer (§7.2.3): Gaskin & Abel vs Abel & Cohen on the period grid, plus the Eurostat mirror pair where it exists. Comparison is between *models of one corridor*, never between countries ranked in a league table. |
| Brief (`/brief`) | Handing someone a figure that keeps its provenance | The **export action** in the command palette (§7.7), producing a PNG or SVG with the §7.7 stamp burned in, plus a permalink that encodes the snapshot vintage hash. No composition surface, no version history. |
| Corridor Graph (`/graph`) | Seeing what connects to what | The globe **is** the corridor graph. Selection-driven neighbour reveal (§7.5) is the expansion interaction. |

`/solve` redirects to `/placement` per §12, **not** to `/methods#allocation`. `/methods` keeps an allocation section, but it now documents the guardrails and the module's own refusals rather than listing the solver as unbuilt. Every other unknown route renders the 404 non-ideal state in §7.10.

### 7.2 The global frame

One shell, identical on all six routes. The map canvas is the interface; chrome takes at most 20% of pixels at 1440×900.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TOPBAR 40px  Exodus │ Globe  Sources  Methods │ AS OF 2019-11-04 (oldest) │⌘K│ ← 40px, surface-0
├───────────────┬──────────────────────────────────────────┬───────────────────┤
│ LAYER STACK   │                                          │ CONTEXT RAIL      │
│ 280px         │                                          │ 320px             │
│ surface-1     │        WebGL CANVAS (deck.gl)            │ surface-1         │
│               │        bg-canvas #06080C                 │                   │
│ §7.6          │        _GlobeView, 7 layers              │ legend + selection│
│               │                                          │ + provenance      │
│               │   [saved_views tray, collapsed, ↓left]   │ §7.2.1            │
├───────────────┴──────────────────────────────────────────┴───────────────────┤
│ YEAR MACHINE 80px   2019   ├──┬──┬──┬──╫──┬──┬──┬──┤   ▶  1×  §7.5           │
│ FOOTER 20px  Estimates with uncertainty · vintages vary · not for operational │
│              targeting · [How this number was made] [Methods] [Report a harm] │
└──────────────────────────────────────────────────────────────────────────────┘
```

Fixed rules:

1. **Panel gap is a 1px `--border-hairline`, never whitespace.** Panel padding is 12px.
2. **Both side panels collapse** to a 32px rail (`l` and `i`). The Year Machine never collapses and is present on all six routes; on `/sources` and `/methods` it is rendered but disabled, with the cursor year shown, because those routes are not year-bound. Do not hide it — the time cursor is global state and must never appear to have been discarded.
3. **The footer strip is never dismissible** and never scrolls away. Exact copy as shown, 11px, `--text-muted`.
4. **One AS-OF chip, showing the oldest contributing vintage** across every source feeding the current view. Showing the newest is the lie. Clicking it opens `/sources` filtered to the contributing sources.
5. **Minimum viewport 1024×720.** Below it, render the `ViewportTooSmall` non-ideal state (§7.10) whose primary action opens the `Shift+G` table, which is fully usable at any width. Do not build a responsive globe. Mobile is cut.
6. **Z-order:** canvas 0 · panels 10 · Year Machine 20 · saved_views tray 30 · provenance popover 40 · command palette 50 · refusal/policy sheet 60 · first-run notice 70.
7. Routes `/place`, `/corridor` and `/headroom` render **over** the canvas, not instead of it: `/place` and `/headroom` as a 560px right-hand sheet, `/corridor` as a 480px right-hand drawer. The globe stays live behind them and stays bound to the same cursor. `/sources` and `/methods` are full-width documents on `--surface-0` with the canvas unmounted.

### 7.3 Screen inventory

#### 7.3.1 `/` — Situation Globe

*What did the whole world's migration system look like in year N, and where is that picture least trustworthy?*

```
LAYER STACK (280)                      CANVAS                    CONTEXT RAIL (320)
┌────────────────────┐                                     ┌────────────────────────┐
│ LAYERS             │                                     │ NOTHING SELECTED       │
│ ◉ Labels        ⓘ  │         ╭──────────╮                │ Hover a country or arc │
│ ◉ Incidents  SNAP ⓘ│       ╭─┤  GLOBE   ├─╮              ├────────────────────────┤
│ ◉ Corridors     ⓘ  │       │ │ default  │ │              │ LEGEND                 │
│    width  flow/cap │       ╰─┤  camera  ├─╯               │ WIDTH  movements per   │
│    dash   disagree │         ╰──────────╯                │        1,000 pop       │
│    alpha  coverage │                                     │  ▁▂▃▅▇ fixed 1990–2023│
│ ○ People density ⓘ │                                     │ DASH   model disagree  │
│ ◉ Country fill  ⓘ  │                                     │  ──── <10% agree       │
│    ◉ coverage      │                                     │  ─ ─ ─ 10–25%          │
│    ○ net balance   │                                     │  ·  ·  ≥100%           │
│ ◉ Graticule        │                                     │  ····· not computable  │
│ ▣ Ocean     locked │                                     │ ALPHA  coverage 0→1    │
└────────────────────┘                                     │ ▨ no data              │
                                                            └────────────────────────┘
```

- **Default camera** leads with the Global South: `{longitude: 20, latitude: 8, zoom: 0.4, pitch: 0, bearing: 0}`. The tooltip on the camera-reset control states the justification verbatim: *"53% of international migrants moved within their own region of origin (UN DESA, International Migrant Stock 2024). A Europe-centred default misrepresents the majority of the phenomenon."* Never auto-rotate.
- **Default fill is coverage-asymmetry `C`**, in the neutral grey sequential ramp (§7.9.4). It answers the route's second question directly and avoids a second blue ramp competing with people density. Net balance per 1,000 population is the alternate fill, a radio choice, rendered in the diverging blue↔purple ramp.
- **People density (H3 r3)** renders `pop / area_km2` on the sequential blue ramp, off by default, on by one click. The layer label states the unit; there is no raw-count mode.
- **Context rail states:** nothing selected → legend only. Hover → a preview card at 35%-dimmed page. Selection → the entity summary in §7.4 `<EntitySummary>` with its top-8 corridors, each a link to `/corridor/:o-:d`.
- **The incident ribbon** renders `SNAPSHOT` chrome: a struck-through `SNAPSHOT · 72h corpus · replay` badge on the layer row, static 2px dots at `--text-secondary`, **no pulse, no emissive, no bloom**. If a reviewer cannot tell it is replay at a glance, it is wrong.

#### 7.3.2 `/place/:iso3` — Country page

*What do we actually know about this country, and how old is each thing we know?*

A 560px sheet, one scroll, twelve figures, no tabs.

```
┌ DEU  Germany ──────────────────────────── AS OF 2019-11-04 ─ ✕ ┐
│ COVERAGE  C = 0.87  ▰▰▰▰▰▰▰▰▱▱   m/M 9/10 · Δt 1.2y · f_obs .71│
├────────────────────────────────────────────────────────────────┤
│ POPULATION            83,300,000   observed  WPP 2024      ⓘ   │
│ NET BALANCE 2019        +4.1 /1k   modelled  Gaskin & Abel ⓘ   │
│ IN 2019               1,290,000    modelled                ⓘ   │
│ OUT 2019                948,000    modelled                ⓘ   │
│ ├ sparkline 1990────────────────2023, gaps shown as breaks ─┤  │
├────────────────────────────────────────────────────────────────┤
│ PSR 2024                    3.06   observed  WPP           ⓘ   │
│ POADR 2024                  0.19   observed  Sanderson–Sch ⓘ   │
│ WPP differential 2050  +9,110,000  modelled  VarID 2 − 7   ⓘ   │
├────────────────────────────────────────────────────────────────┤
│ PHYSICIANS /1k              4.49   observed  WDI 2021      ⓘ   │
│ NURSES+MIDWIVES /1k        12.06   observed  WDI 2021      ⓘ   │
│ HOSPITAL BEDS /1k           7.82   observed  WDI 2017      ⓘ   │
│ HEALTH SPEND pc PPP$        —      no source               ⓘ   │
│ ASYLUM APPS last 24m   ▁▂▃▅▇▅▃▂   monthly  Eurostat  ~4wk lag  │
├────────────────────────────────────────────────────────────────┤
│ [ Headroom → ]  [ Top corridors ▾ ]  [ Add to saved views  w ]  │
└────────────────────────────────────────────────────────────────┘
```

- **All twelve rows render for every country**, with `—` plus a badge where a value is absent. A country with three figures and nine em-dashes is a correct render, not a bug. Do not hide absent rows; the absences are the point.
- The coverage bar at the top decomposes `C` into its three verified terms and carries the badge *"this project's construction, no literature claimed"*.
- The asylum sparkline is the only sub-annual series in the product. It carries a `~4-week lag` badge and the label `monthly`. The word `real-time` is banned adjacent to it by the policy linter.
- Selecting a country anywhere sets the same selection; `/place` is the deep link, not a separate state.

#### 7.3.3 `/corridor/:orig-:dest` — Corridor drawer

*How much do the two best models disagree about this specific corridor, and does anything independent corroborate either of them?* **This is the screen that wins the argument.** 480px drawer, permalinked, openable from an arc, a table row, or `~` in the palette.

```
┌ SYR → DEU ─────────────────────────────────────────── ✕ ┐
│ MODEL DISAGREEMENT, PERIOD GRID                          │
│                                                          │
│  ●  Gaskin & Abel (annual → period total)                │
│  ■  Abel & Cohen v6 (native 5-yr, outward, sexes summed) │
│                                                          │
│  600k ┤            ●                                     │
│       │        ■   ■                                     │
│  300k ┤    ●                                             │
│       │ ●  ■                                             │
│     0 └──┴────┴────┴────┴────┴────┴──                    │
│      90-95  95-00 00-05 05-10 10-15 15-20                │
│  d_p  8%    14%   22%   19%   41%   63%                  │
│  ▀▀▀  step function, held constant within each period    │
│                                                          │
│  ⓘ Model disagreement. Both estimates derive from the     │
│    same underlying stock tables, so this is a lower bound │
│    on true uncertainty, not a confidence interval.        │
├──────────────────────────────────────────────────────────┤
│ INDEPENDENT COMPARISON — EUROSTAT MIRROR                 │
│  ▲ migr_imm5prv [geo=DEU, partner=SYR]  88,973   e       │
│  ▽ migr_emi3nxt [geo=SYR, partner=DEU]   — no reporter   │
│  divergence — · Refusal: NoMirrorPair for non-EU origin  │
├──────────────────────────────────────────────────────────┤
│ MODEL-INTERNAL SPREAD (Gaskin & Abel)                    │
│  s(o,d,2019) = mig_prev_std / mig_prev = 0.34            │
│  ⓘ A different quantity from the disagreement above.     │
├──────────────────────────────────────────────────────────┤
│ NULL MODEL                                               │
│  Radiation CPC (held-out 2022) 0.14                      │
│  Robinson & Dilkina global reference: gravity 0.16,      │
│  radiation 0.16, XGBoost+ext 0.21, ANN+ext 0.22          │
├──────────────────────────────────────────────────────────┤
│ DYAD CONTEXT (CEPII Gravity 202211)                      │
│  dist 2,896 km · distw_harmonic 3,014 · contig 0         │
│  comlang_off 0 · comrelig 0.02 · scaled_sci_2021 0.0011  │
│  Colonial dummy:  ( ) comcol   (•) col45   ( ) none      │
└──────────────────────────────────────────────────────────┘
```

Binding details:

- Four mark types, distinguished by **shape first**: `●` Gaskin & Abel `#3987e5`, `■` Abel & Cohen `#199e70`, `▲` Eurostat immigration-side `--text-primary` filled, `▽` Eurostat emigration-side `--text-primary` hollow. No warm hue appears on any mark that counts people. The two Eurostat marks use the neutral foreground because they are the only *observed* marks in the drawer and that reads correctly.
- `OBS_FLAG` renders as an inline superscript glyph next to the value (`e` estimated, `p` provisional, `b` break, `d` definition differs), with the flag's meaning in the provenance popover. `CONF_STATUS` renders as a lock glyph.
- `d_p` is a **step function**, drawn with `curveStepAfter` semantics and visible vertical risers at period boundaries. Never a smoothed line, never an interpolated point between periods.
- The colonial dummy is a **radio group** with three options including "none". Two checkboxes are a build failure; a test asserts the control's `role="radiogroup"`.
- Corridor-years outside the shared period grid render the `NoSharedPeriodGrid` refusal sentence in place of the chart, and the arc on the globe takes the "not computable" dotted treatment (§7.9.5) — never the maximum-disagreement dash.

#### 7.3.4 `/headroom/:iso3` — Service-stock headroom

*Under a named, editable assumption set, which service is the binding constraint — and is it already in deficit?*

```
┌ Headroom — Germany — assumption set «WHO floors, 10-year» ──── ✕ ┐
│ ⚠ Modelled labour-market absorption under assumption set          │
│   «WHO floors, 10-year» — not a policy limit.                     │
├───────────────────────────────────────────────────────────────────┤
│ BINDING INDICATOR:  hospital beds                                 │
│ H = −41,300 persons / year          ← warm deficit field          │
│                                                                   │
│ physicians        r 4.49  t 4.45   H  +14,800 ▏▏▏▏▏▏▏▏           │
│ nurses+midwives   r12.06  t 4.45   H +226,000 ▏▏▏▏▏▏▏▏▏▏▏▏▏▏     │
│ hospital beds     r 7.82  t 8.00   H  −41,300 ███ deficit         │
│ dwellings         r  —    t  —     H  — no source                 │
│ health spend pc   r  —    t  —     H  — no source                 │
│                                                                   │
│ ⓘ This formula holds service stock fixed while growing            │
│   population. Migrants bring physicians. It therefore             │
│   systematically understates.                                     │
│ ⓘ WHO's 4.45 per 1,000 is a floor, explicitly not an optimum.     │
├───────────────────────────────────────────────────────────────────┤
│ ASSUMPTIONS   name «WHO floors, 10-year»          [ Copy link ]   │
│   horizon T        [ 10 ] years      ▏──────●──────▏ 1–30        │
│   target physicians/1k        [ 4.45 ]  source: WHO SDG 3.c.1 ⓘ  │
│   target beds/1k              [ 8.00 ]  source: user-set      ⚠  │
│   ⚠ user-set values are badged on every figure they produce      │
├───────────────────────────────────────────────────────────────────┤
│ REPLACEMENT MIGRATION                                             │
│   PSR 2024 3.06 → 2050 1.71 (UN definition, P[15,64]/P[65+])     │
│   POADR 2024 0.19 → 2050 0.28  (Sanderson–Scherbov)              │
│   Constant-PSR intake, bisection: 1,240,000 / year  (12 iter)    │
│   WPP VarID 2 − VarID 7, 2050: +9,110,000                        │
│   [ UN ESA/P/WP.160 Table 8 golden vectors ▾ ]                   │
└───────────────────────────────────────────────────────────────────┘
```

- **The per-indicator panel is the output.** There is no scalar headroom figure anywhere in the UI, and no control that produces one. The binding indicator is named in 18px type above the panel.
- Negative `H` renders as a **warm deficit field**: bar fill `--status-serious #F2763A`, the word `deficit` in text, and a 135° hatch. Positive `H` renders as a cool `#3987e5` bar. This is the one place warm hue is correct, because it marks a failure of provision, not a quantity of persons.
- Fewer than three `K_stock` indicators present → the whole panel is replaced by the `NoServiceStockData` refusal sentence. No partial scoring.
- A user-edited assumption sets `placeholder: true` on every derived figure, which renders a `⚠ user-set` badge inside `<Figure>` and is carried into the export stamp and the permalink.
- Non-monotone bisection renders: *"No unique solution: the projected support ratio is not monotone in annual intake for this age profile, so no constant intake reproduces the 2024 value."* Never a number, never a nearest guess.

#### 7.3.5 `/sources` — Licence, cadence and traps ledger

Full-width document, `--surface-0`, no canvas. One `<section>` per source, in manifest order, each with a stable `id` used by the trap regression tests.

Per source, in this order: **id · provider · vintage (reference period and retrieval date) · cadence · latency class · SPDX licence and redistributable flag · measured compressed bytes in the committed bundle · the exact URLs `plan()` returns, rendered as a code block · known traps.** Each trap is a paragraph with `data-trap-id`, and `packages/connectors/<id>/traps.test.ts` asserts each id still holds against its recorded fixture. A trap that stops being true fails CI.

Then, below a hairline, the **three exclusion rows** — UN DESA IMS, UNHCR, ACLED — each with the licence sentence that excludes it, the date of the determination, and for UNHCR the unresolved-contradiction note and the contact address. These rows are as visually prominent as the included sources. Sortable by staleness, licence and size. Default sort: staleness descending.

#### 7.3.6 `/methods` — Refusals and scoreboard

The most persuasive screen in the product, and almost entirely prose. Fixed order, top to bottom. Do not reorder.

1. **The CPC scoreboard, first, above the fold.** A single horizontal figure: gravity-exponential 0.16, gravity-power 0.16, radiation 0.16, XGBoost+extended 0.21, ANN+extended 0.22 with a production function; 0.43 and 0.40 without one. Beneath it, in 18px: *"Roughly half the achievable accuracy in this field lives in getting origin outflow totals right, which is why we do not ship a fitted flow model."* Cited to Robinson & Dilkina, COMPASS '18, doi:10.1145/3209811.3209868.
2. **Five model cards** (M1–M5), each with inputs, outputs, assumptions with provenance, and a `placeholder` flag column that is `false` on every row. If any row reads `true`, the build is wrong.
3. **The refusals**, allocation first: the full objective function, the weight vector `w_E .30, w_P .25, w_N .15, w_L .10, w_H .08, w_K .05, w_F .07`, the three spec defects as named open issues, the GDPR Art. 22 constraint in the Regulation's own words, and — per §12 — the guardrails the module ships with and the things it still refuses to do. Then the remaining refusals: fitted econometrics, placeholder coefficients, the live layer, ADM1, FLAT mode, departure forecasting, origin-side pressure indices.
4. **The Scenario VI panel**, last: Republic of Korea, 5.149 billion, with the UN's own footnote *"Scenario VI is considered to be unrealistic"* rendered inline and **non-dismissibly**. No close button, no collapse, no `aria-hidden`. A Playwright test asserts the footnote is in the accessibility tree.

#### 7.3.7 The four overlays

| Overlay | Trigger | Behaviour |
|---|---|---|
| **Command palette** | `⌘K` / `Ctrl+K`, `/` | §7.4.1 |
| **Globe text alternative** | `Shift+G` | §7.11.4 |
| **Provenance popover** | click or `Enter` on any `<Figure>`'s `ⓘ` | §7.4.3 |
| **`saved_views` tray** | `w` adds, `Shift+W` opens | Bottom-left, collapsed to a 24px pill showing a count. Holds places, corridors and permalinked views. Persists in `localStorage` under `corridor.saved_views.v1`, wrapped in try/catch, and renders empty without error when storage is unavailable. The identifier is `saved_views` everywhere — in the store, the URL param, the DOM and the copy. `watchlist` fails the policy linter. |

### 7.4 Component inventory and contracts

`packages/ui` exports exactly these. A component not on this list does not ship in v1.

| Component | Purpose | Notes |
|---|---|---|
| `<Figure>` | **The only component permitted to render a number** | §7.4.2 |
| `<ProvenancePopover>` | Source, vintage, latency, estimate kind, licence, interval | §7.4.3 |
| `<RefusalSentence>` | Renders a typed `Refusal` as prose | Never a number, never `—` alone |
| `<PolicyVerdictSheet>` | Renders a `PolicyVerdict` denial with its machine-readable body as JSON | §7.10 |
| `<EstimateKindGlyph>` | `ƒ` modelled · `≈` extrapolated · `⊘` assumed zero · none for observed · `ᵉ` flagged | Always paired with text in the popover |
| `<AsOfChip>` | Oldest contributing vintage | Global, one instance |
| `<CoverageBar>` | `C` with its three decomposed terms and the construction badge | |
| `<Sparkline>` | Annual series with **visible breaks at missing years** | `align()` is `"none"`; no line crosses a gap |
| `<StepSeries>` | Period-grid series drawn as a step function | Used for `d_p` |
| `<DualEstimateChart>` | Two model marks plus divergence, shape-first | Corridor drawer |
| `<IndicatorPanel>` | Per-indicator headroom rows with the named binding constraint | Never emits a scalar |
| `<YearMachine>` | The time handle, track, numeral and transport | §7.5 |
| `<LayerStack>` | The layer panel | §7.6 |
| `<CommandPalette>` | `⌘K` | §7.4.1 |
| `<SavedViewsTray>` | Working set | |
| `<GlobeTextAlternative>` | The `Shift+G` table | §7.11.4 |
| `<NonIdealState>` | Loading, empty, error, 404, viewport-too-small | §7.10 |
| `<AssumptionEditor>` | Named assumption set with per-field provenance and the user-set badge | `/headroom` |
| `<SourceCard>` | One `/sources` section including `plan()` URLs and traps | |
| `<ExportStamp>` | The burned-in export footer | §7.7 |

#### 7.4.1 Command palette — search-first navigation

```ts
// packages/ui/src/palette/types.ts
export const PALETTE_SCOPES = ['>', '#', '@', '~'] as const;
export type PaletteScope = (typeof PALETTE_SCOPES)[number];

export interface PaletteItem {
  readonly scope: PaletteScope;
  readonly id: string;
  readonly label: string;
  readonly hint?: string;        // right-aligned, --text-muted, e.g. "DEU · 83.3M · C 0.87"
  readonly keywords?: readonly string[];
  readonly run: () => void;
}

export interface PaletteIndex {
  /** '>' actions, '#' datasets, '@' countries, '~' corridors. There is no fifth scope
   *  and no person-shaped type is indexable. Adding one fails the policy linter. */
  readonly items: readonly PaletteItem[];
  /** Prefix-and-substring rank; deterministic; no fuzzy library, no network. */
  search(query: string, scope: PaletteScope | null): readonly PaletteItem[];
}
```

Rules: opens in ≤1 frame from a prebuilt index (258 places, 12,000 corridors, ~13 datasets, ~30 actions); ranks exact-prefix above substring and never reorders on a tie; `Esc` closes; `↑ ↓` move, `Enter` runs, `⌘Enter` opens in the drawer without navigating. The `>` actions are exactly: go to route, toggle layer, set year, reset camera, copy permalink, export PNG, export SVG, open globe text alternative, toggle theme, add to saved views, open harm report.

#### 7.4.2 `<Figure>` — the credibility of the entire product

```ts
// packages/ui/src/figure/types.ts
import type { Refusal } from '@exodus/contracts';

export const ESTIMATE_KINDS = [
  'observed', 'observed_flagged', 'modelled', 'extrapolated', 'assumed_zero',
] as const;
export type EstimateKind = (typeof ESTIMATE_KINDS)[number];

export interface Provenance {
  readonly sourceId: string;
  readonly vintage: string;        // ISO 8601 date of the reference period
  readonly retrievedAt: string;    // ISO 8601 date the bytes were fetched
  readonly latencyDays: number;
  readonly estimateKind: EstimateKind;
  readonly licence: string;        // SPDX id, or the verbatim terms string when no SPDX id exists
  readonly redistributable: boolean;
  readonly obsFlag: string | null;
  readonly confStatus: string | null;
  /** Rendered ONLY when the source supplies one. Gaskin & Abel supplies mig_prev_std,
   *  which renders as ±1 s.d. with label 'model-internal spread (1 s.d.)'.
   *  The strings 'confidence interval' and 'uncertainty band' are banned here. */
  readonly interval: { readonly low: number; readonly high: number; readonly label: string } | null;
  readonly placeholder: boolean;   // true for any user-edited assumption in the chain
}

export interface DataFigure {
  readonly source: 'data';
  readonly value: number | null;   // null renders '—' with a badge, never 0
  readonly unit: string;
  readonly provenance: Provenance;
}

/** UI state that is a number but is not a datum: the year cursor, a selection count,
 *  a keyboard hint. It still renders through <Figure> so the AST rule has nothing to
 *  special-case, and it carries no provenance affordance. */
export interface UiStateFigure {
  readonly source: 'ui-state';
  readonly value: number;
  readonly unit: string;
}

export type FigureInput = DataFigure | UiStateFigure | Refusal;

export interface FormatSpec {
  readonly kind:
    | 'count' | 'rate_per_1k' | 'ratio' | 'percent'
    | 'year' | 'currency_ppp' | 'days' | 'bytes';
  readonly emphasis?: 'hero' | 'default' | 'inline';
}

export interface FigureProps {
  readonly f: FigureInput;
  readonly spec: FormatSpec;
  readonly label?: string;
}
```

Enforcement, and read this before writing the rule so you do not fight your own linter: **the `<Figure>` AST rule targets JSX text children and JSX expression children whose inferred type is `number`, in `apps/web` and `packages/ui`. It does not target JSX attributes** (`width={280}` is fine), **CSS-in-JS values, or code outside JSX.** Numbers that are UI state go through the `ui-state` variant rather than being exempted by path. Seed one violation of each form in the policy package's fixtures and assert the rule fails.

#### 7.4.3 Provenance popover

Opens from every `<Figure>` whose `source` is `data`, by click **and** by keyboard (`Enter` on the focused `ⓘ`, which is a real `<button>` with `aria-expanded`). Contents, in order: source id and title (link to `/sources#<id>`) · reference vintage · retrieval date · latency days · estimate kind with its glyph and its plain-English sentence · licence string and redistributable flag · the interval and its label, or `± n/a` · the transform chain `source → connector@version → transform commit SHA → suppression rule → rounding rule` · a permalink carrying the snapshot vintage hash. Focus is trapped while open; `Esc` returns focus to the trigger. Width 320px, `--surface-2`, elevation `e2`.

### 7.5 The Year Machine and temporal brushing

```ts
// packages/store/src/time.ts
export interface TimeState {
  /** Integer year. The globe renders exactly this year and no blend of years. */
  readonly cursor: number;
  /** Chart-only range selection. It filters and shades sparklines and the drawer's
   *  series. It NEVER averages, interpolates or aggregates the globe. */
  readonly window: readonly [number, number] | null;
  readonly playing: boolean;
  readonly msPerYear: 500 | 250 | 125;   // 1x, 2x, 4x
}

export interface TimeStore {
  get(): TimeState;
  setCursor(year: number): void;          // clamped to the manifest's [minYear, maxYear]
  stepCursor(delta: number): void;
  setWindow(w: readonly [number, number] | null): void;
  play(): void; pause(); // toggled by Space
  subscribe(fn: (s: TimeState) => void): () => void;
}
```

Binding behaviour:

1. **One store. No component holds a date.** A component with local year state is a defect.
2. **The handle moves continuously; the data steps.** The track carries 34 notches, one per year, and the handle snaps to the nearest notch on release and on every keyboard step. There is **no `transitions` prop on any data accessor**, ever. Scrubbing swaps pre-quantised GPU buffer references and bumps `updateTriggers`.
3. **The year numeral is 44px, tabular-nums, in the bottom-left of the Year Machine bar**, rendered through `<Figure>` with `kind: 'year'` and the `ui-state` variant. Year values are never group-separated: `1990`, not `1,990`.
4. **Tooltip on the track, exact text:** *"Annual estimates. No values are interpolated between years."*
5. **Period boundaries are marked on the track** with a 2px tick at 1990, 1995, 2000, 2005, 2010, 2015, 2020, because the disagreement channel steps there and the user must be able to predict it.
6. **Playback** cuts hard between frames at `msPerYear`; it never eases, at any speed, under any motion preference. Playback stops at 2023 and does not loop.
7. **Brushing** is one behaviour on every surface: drag on the track or on any chart's x-axis sets `window`; drag the window body to slide it; click outside clears it. The globe's appearance does not change when a window is set, except that the track shades the range — because the globe is bound to `cursor` only. Say so in the window's tooltip: *"Range selection filters charts. The globe always shows one year."*
8. **Fallback mode.** If the §4 spine fallback fires, the manifest carries six period steps instead of 34 years, the notches, numeral format (`1990–95`) and tick marks come from the manifest, and nothing in this component changes. `<YearMachine>` reads `snapshot/manifest.json`; it must not know a dataset's name.

*Accept:* a unit test asserts `transitions` is absent or `0` on every layer prop object built by `packages/globe`; an AST rule fails the build on the identifier `transitions` in any file under `packages/globe`; a Playwright test drags the full range and asserts median ≥55fps, no frame >50ms, and zero network requests.

### 7.6 The layer stack panel

```ts
// packages/registry/src/layers.ts
export interface LayerStackItem {
  readonly id: string;
  readonly label: string;
  readonly order: number;                 // fixed by the registry; the user cannot reorder
  readonly geometry: 'text' | 'point' | 'arc' | 'h3' | 'choropleth' | 'graticule' | 'sphere';
  readonly lockedVisible: boolean;        // true for sphere and graticule
  readonly channels: readonly LayerChannel[];
  /** Channels computed in @exodus/semantic and merged AFTER encode().
   *  A layer author cannot set these, and the panel cannot expose a control for them. */
  readonly platformComputed: readonly ('opacity' | 'estimateKindStyling' | 'latencyClass')[];
  readonly legend: LegendSpec;
}

export interface LayerChannel {
  readonly visual: 'width' | 'dash' | 'opacity' | 'hue' | 'fill' | 'size';
  readonly meaning: string;               // rendered verbatim in the legend
  readonly domain: readonly [number, number];   // FIXED across all years — see below
  readonly unit: string;
}
```

Rules:

1. **Order is fixed** and matches §6 exactly: labels · incidents · corridors · people density · country fill · graticule · ocean sphere. There is no reorder affordance. The ocean sphere and graticule cannot be hidden.
2. **There is no opacity slider anywhere in the product.** Arc opacity is the coverage-asymmetry score. A uniform user multiplier would let someone produce a screenshot in which Gulf corridors carry German-register authority, which is the exact failure the channel exists to prevent. Per-layer control is visibility only.
3. **Every channel's domain is computed once over all 34 years and frozen**, so a corridor that is thicker in 2015 than in 1995 is genuinely larger. A per-year rescale would make the flipbook meaningless. *Accept:* a test asserts the width scale's domain is identical at `cursor = 1990` and `cursor = 2023`.
4. **Each row states its channels in the legend, in words**, and carries its own no-data swatch.
5. **`ⓘ` on every row** opens the source list feeding that layer, with each source's AS-OF date.
6. Adding a layer from an arbitrary dataset is **not** a v1 feature. The registry is data-driven from `snapshot/manifest.json`, but the panel is a viewer, not a builder.

### 7.7 Assumption sets, permalinks and export

**Permalink format:** `?v=` + `base64url(deflate-raw(JSON.stringify(state)))`. `CompressionStream` supports gzip, deflate and deflate-raw only — never zstd.

```ts
// packages/store/src/permalink.ts
export interface ViewState {
  readonly v: 1;
  readonly year: number;
  readonly camera: { readonly longitude: number; readonly latitude: number;
                     readonly zoom: number; readonly bearing: number; readonly pitch: number };
  readonly layers: Readonly<Record<string, boolean>>;
  readonly fill: 'coverage' | 'net_balance';
  readonly selection: SelectionRef | null;
  readonly savedViews: readonly SelectionRef[];
  readonly assumptions: Readonly<Record<string, number>> | null;
  readonly assumptionSetName: string | null;
  /** Content hash of snapshot/manifest.json. A permalink opened against a different
   *  snapshot renders a banner naming both hashes before it restores anything. */
  readonly snapshotHash: string;
}

export function encodeView(s: ViewState): Promise<string>;
export function decodeView(q: string): Promise<ViewState | null>;   // null on any parse failure
```

A decode failure renders the `BadPermalink` non-ideal state with the raw parameter shown, and loads the default view. It never silently loads a partial state.

**Export.** Palette actions `> export png` and `> export svg` render the current canvas plus the visible panels to a file, client-side, in the **light theme** (the print theme), with this stamp burned into the bottom edge at ≥11px, not removable from the UI:

> «Indicator» — «geography» — «period». «value» «unit» («interval label» «lo»–«hi»). Source: «sourceId», vintage «date», «estimateKind». Cells under 25 withheld at ADM0×ADM0. Estimates, not counts — not for operational targeting. Reproduce this exact view: «short-url» · «snapshotHash»

`K` is interpolated from the rendered granularity. v1 renders only ADM0×ADM0, so v1 always interpolates 25 — build the interpolation anyway, from the granularity, not as a constant. If any figure in the export carries `placeholder: true`, the stamp gains a second line: `Contains user-set assumptions: «list».`

### 7.8 Interaction grammar

Identical on every surface. If two surfaces differ, one of them is wrong.

| Input | Meaning everywhere |
|---|---|
| **Hover** | Reveal, never commit. Target and its linked objects to full strength; everything else to 35% of its computed alpha. Tooltip shows value plus a provenance chip. Hovering never changes selection, never moves the camera, never changes the year. |
| **Click** | Select. Selection is global: globe, charts, tables and panels all reflect it. One primary selection. |
| **⌘/Ctrl + click** | Add to or remove from the multi-selection (max 8; the 9th replaces the oldest and says so). |
| **Double-click** | Drill in — open `/place/:iso3` or `/corridor/:o-:d`. |
| **Drag on canvas** | Pan. `Shift`+drag box-selects countries. `Alt`+drag pitches and rotates. |
| **Drag on the time track or any chart x-axis** | Brush a year window (§7.5). One behaviour, two places. |
| **Scroll on canvas** | Zoom. `Shift`+scroll pans tables horizontally. Never hijack page scroll in a panel that cannot zoom. |
| **Right-click** | Context menu for that object: Open · Add to saved views · Copy ISO3 / corridor id · Copy permalink · Cite · Open provenance. No other entries. |
| **Esc** | Close the topmost overlay → else clear multi-selection → else clear selection → else blur. Always reversible, never destructive. |

**Keyboard map.** The `?` dialog lists exactly these and nothing else.

| Key | Action |
|---|---|
| `⌘K` / `Ctrl+K`, `/` | Command palette |
| `?` | Keyboard help |
| `g` `g` | Globe `/` |
| `g` `s` | `/sources` |
| `g` `m` | `/methods` |
| `g` `p` | Palette scoped to `@` (places) |
| `g` `h` | `/headroom` for the current selection, else palette scoped to `@` |
| `g` `c` | Palette scoped to `~` (corridors) |
| `Space` | Play / pause the year |
| `[` `]` | Step the year by 1 |
| `Shift+[` `Shift+]` | Jump to the previous / next period boundary |
| `Home` `End` | First / last year |
| `.` | Move the camera to the selection (600ms; 0ms under reduced motion) |
| `f` | Fit camera to the visible data |
| `l` | Toggle the layer stack |
| `i` | Toggle the context rail |
| `w` | Add selection to `saved_views` |
| `Shift+W` | Open the `saved_views` tray |
| `Shift+G` | Globe text alternative |
| `Shift+T` | Toggle theme |
| `Tab` / `Shift+Tab` | Roving focus within the focused region |
| `F6` / `Shift+F6` | Move between regions: topbar → layers → canvas → rail → year machine |

**Selection contract.**

```ts
// packages/store/src/selection.ts
export type SelectionRef =
  | { readonly kind: 'place'; readonly iso3: string }
  | { readonly kind: 'corridor'; readonly orig: string; readonly dest: string }
  | { readonly kind: 'indicator'; readonly code: string };

export interface SelectionState {
  readonly primary: SelectionRef | null;
  readonly multi: readonly SelectionRef[];
  readonly sourceSurface: 'globe' | 'palette' | 'table' | 'chart' | 'url';
}
```

There is no person-shaped variant and adding one fails the policy linter. Cross-surface propagation budget: **120ms from click to every bound surface reflecting it**. [UNVERIFIED as a perceptual threshold — the research pack flags it as a design target, not a measured finding.] Treat it as a budget to measure in the M3 Playwright harness and report in `SNAPSHOT.md`; do not cite it as a human-factors result.

**Selection rendering on the globe:** with a place selected, its inbound corridors take `#3987e5`, its outbound corridors take `#d95926`, corridors in `saved_views` take `#199e70`, and every other corridor drops to `--text-muted` at 20% of its computed alpha. That is the entire use of the three-slot map palette: **hue encodes direction and selection state, never a quantity of people.** Magnitude is width; doubt is dash; authority is alpha.

### 7.9 Design system

#### 7.9.1 Tokens

```ts
// packages/ui/src/tokens.ts  — emitted to CSS custom properties at build time
export const DARK = {
  bgCanvas:          '#06080C',
  surface0:          '#0B0E14',
  surface1:          '#11151D',
  surface2:          '#171C26',
  surface3:          '#1E2531',
  borderHairline:    '#1C2230',
  borderDefault:     '#2A3242',   // 1.50:1 — DECORATIVE ONLY, never around a control
  borderInteractive: '#5C6B85',   // 3.58:1 on surface-0, 3.39:1 on surface-1
  textPrimary:       '#E8ECF2',   // 16.29:1
  textSecondary:     '#A3ADBD',   // 8.53:1
  textMuted:         '#6E7A8C',   // 4.44:1 — labels and axes only, NEVER body
  accent:            '#4DA3FF',   // 7.36:1 — chrome and selection only, never a data series
  focusRing:         '#7CC4FF',   // 9.75:1 on surface-1
  statusGood:        '#2BD49B',   // 10.11:1
  statusWarning:     '#E3A008',   // 8.55:1
  statusSerious:     '#F2763A',   // 6.83:1
  statusCritical:    '#FF6B6B',   // 6.96:1
  scrimGlobe:        'rgba(6,8,12,.72)',
} as const;

export type ThemeTokens = { readonly [K in keyof typeof DARK]: string };

export const LIGHT: ThemeTokens = {
  bgCanvas:          '#EEF1F5',
  surface0:          '#FAFAF9',
  surface1:          '#FFFFFF',
  surface2:          '#FFFFFF',
  surface3:          '#F0F1F3',
  borderHairline:    '#E4E6EA',
  borderDefault:     '#D3D7DE',
  borderInteractive: '#87909D',   // 3.09:1 on #FAFAF9, 3.23:1 on #FFFFFF — NOT #8A93A0 (2.97:1, fails)
  textPrimary:       '#0E1116',   // 18.11:1
  textSecondary:     '#4A5361',   // 7.44:1
  textMuted:         '#6B7686',   // 4.41:1 — labels and axes only
  accent:            '#1560BD',   // 5.85:1
  focusRing:         '#1560BD',
  statusGood:        '#0E7A57',   // 5.10:1
  statusWarning:     '#8A5A00',   // 5.67:1
  statusSerious:     '#B44214',   // 5.39:1
  statusCritical:    '#C42B2B',   // 5.39:1
  scrimGlobe:        'rgba(250,250,249,.80)',
} as const;
```

Every ratio above is from the verified research pack. Four light-theme values are not — `bgCanvas`, `surface2`, `surface3`, `borderHairline`, `borderDefault` — they are structural, carry no text, and are [CONSTRUCTED]. **Dark is the default theme. Light is the print and export theme**, selected automatically for export and by `Shift+T` manually.

**`--scrim-globe` is mandatory behind every piece of text, every hairline and every legend drawn over the WebGL canvas.** Every measured contrast ratio in this section assumes a flat surface and is void over a GL canvas. A tooltip, a label, a ticker or a legend without the scrim is a build defect. *Accept:* a test asserts every canvas-overlay component's computed background is the scrim token.

#### 7.9.2 Type

```
--font-ui:   'Inter var', Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif
--font-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, 'JetBrains Mono', Menlo, monospace
```

Both self-hosted as subset woff2 (Latin + the glyphs the UI uses), preloaded, `font-display: block`. Inter 400/500/600, Plex Mono 400/500. **No Google Fonts request, no CDN request of any kind at runtime** — an offline-first tool that phones a third party on load contradicts its own positioning, and the M2 `--network=none` test would fail anyway. Licence: SIL OFL 1.1 for both; record them in `REUSE.toml`. Budget ≤160 KiB total, counted separately from the 40 MiB snapshot cap; report it in `SNAPSHOT.md`.

Scale: **11 · 12 · 13 · 15 · 18 · 24 · 32 · 44** px. Body 13/18. Labels 11px, `letter-spacing: .04em`, `text-transform: uppercase`, `--text-muted`. Hero figures 32–44px. **Every numeral in the product is `--font-mono` with `font-variant-numeric: tabular-nums`,** including numerals inside running prose on `/methods` and `/sources`. Column alignment across a scrubbing year is worth more than typographic purity.

#### 7.9.3 Spacing, radii, controls, elevation, motion

- **Spacing (4px base):** 2 · 4 · 6 · 8 · 12 · 16 · 24 · 32 · 48 · 64. Panel padding 12. Panel gap 1px hairline.
- **Radii:** 0 (canvas, tables, panels) · 2 (inputs, chips) · 4 (cards, popovers) · 6 (sheets) · 9999 (status dots only). Nothing softer; roundness reads consumer.
- **Control heights:** 24 compact · 30 default · 36 primary. Icon grid 16px. Hit target ≥32×32 regardless of visual size. 24 and 30 and the 16px icon grid are Blueprint's verified conventions; **36 is ours — Blueprint's large is 40px. Do not attribute 36 to Palantir.**
- **Elevation (dark):** `e0` none · `e1` 1px `--border-default` + `0 1px 2px rgba(0,0,0,.4)` · `e2` popover, 1px `--border-interactive` + `0 8px 24px rgba(0,0,0,.55)` · `e3` sheet/modal, `0 16px 48px rgba(0,0,0,.65)` with backdrop `rgba(6,8,12,.6)`.
- **Motion:** `--dur-instant 80ms` hover · `--dur-micro 120ms` toggle · `--dur-panel 180ms` drawer and popover · `--dur-camera 600ms` camera ease · `--dur-flyto 900ms` camera flight · `--dur-entry 2400ms` the one establishing move (§7.13). Easings: standard `cubic-bezier(.2,0,.1,1)`, decelerate `cubic-bezier(.2,0,0,1)`, accelerate `cubic-bezier(.4,0,1,1)`.
- **Motion prohibitions, absolute:** no entrance animation on any data mark · no auto-rotating globe · no particle system · no arc travel or draw-on animation · no convergence-toward-destination motion · no arrival pulse or ripple · no easing on any year change at any speed · no bloom, no chromatic aberration. Post-FX is `fxaa` always plus a subtle `vignette`, and nothing else.

#### 7.9.4 Data-viz palettes

**Categorical, dark, fixed slot order, never cycled:** `#3987e5` · `#d95926` · `#199e70` · `#c98500` · `#d55181` · `#008300` · `#9085e9` · `#e66767`. All eight ≥3:1 vs `#0B0E14` (min 3.91). Worst adjacent ΔE2000: normal 34.9, protan 14.8, deutan 18.2 (CIEDE2000 + Viénot 1999, full severity). **Map, scatter and choropleth are capped at three slots** (`#3987e5`, `#d95926`, `#199e70`; all-pairs ΔE2000 normal 41.5, protan 16.5, deutan 18.2). Beyond three on a map, fold to "Other" or facet.

Light categorical: `#2a78d6` · `#eb6834` · `#1baf7a` · `#eda100` · `#e87ba4` · `#008300` · `#4a3aa7` · `#e34948`. **Three slots fail 3:1 on `#FAFAF9`** — `#1baf7a` 2.70, `#eda100` 2.07, `#e87ba4` 2.58 — so any light-theme chart using slots 3, 4 or 5 **must** carry direct labels or ship as the table view. Enforce it: a chart component with `theme === 'light'` and more than two series and no direct labels throws in development.

**Sequential (people density, magnitude) — direction flips by theme so magnitude always means more contrast against the page:**

| Tier | Dark (low→high) | ratio vs `#0B0E14` | Light (low→high) | ratio vs `#FAFAF9` |
|---|---|---|---|---|
| 1 | `#256abf` | 3.58 | `#3987e5` | 3.48 |
| 2 | `#3987e5` | 5.31 | `#256abf` | 5.17 |
| 3 | `#6da7ec` | 7.72 | `#1c5cab` | 6.35 |
| 4 | `#9ec5f4` | 10.81 | `#104281` | 9.49 |
| 5 | `#cde2fb` | 14.60 | `#0d366b` | 11.44 |

Never go darker than `#256abf` on dark (the next step `#1c5cab` is 2.91:1) and never lighter than `#3987e5` on light. Never a rainbow. Never viridis-for-everything.

**Diverging (net balance, gap, deficit) — blue for inflow, purple for outflow, and no warm hue anywhere on it:**

| | Dark | ratio | Light | ratio |
|---|---|---|---|---|
| out 4 (strongest) | `#c9c2f7` | 11.54 | `#42349a` | 9.18 |
| out 3 | `#b3a9f2` | 9.08 | `#5342b8` | 7.08 |
| out 2 | `#9085e9` | 6.18 | `#6455d4` | 5.30 |
| out 1 | `#7a6ee0` | 4.72 | `#7a6ee0` | 3.92 |
| **neutral / zero** | `#5F5F5A` | 3.01 | `#908F8E` | 3.09 |
| in 1 | `#2a78d6` | 4.37 | `#3987e5` | 3.48 |
| in 2 | `#3987e5` | 5.31 | `#256abf` | 5.17 |
| in 3 | `#6da7ec` | 7.72 | `#1c5cab` | 6.35 |
| in 4 (strongest) | `#9ec5f4` | 10.81 | `#104281` | 9.49 |

Zero is pinned to the neutral, never to the data mean; both arms carry equal tier counts. **Both published fixes for the diverging defect are adopted, not one:** the neutral clears 3:1 *and* every filled region takes a `--border-interactive` hairline stroke *and* no-data takes a visually distinct 45° hatch at `--text-muted`. Zero must never read as absent.

The purple arm is [CONSTRUCTED for this build — contrast computed with the WCAG sRGB relative-luminance formula and reproducible from the hexes above; **ΔE2000 / CVD separation from the blue arm has NOT been computed**]. At M2, run CIEDE2000 + Viénot 1999 across the blue and purple arms. If the worst cross-arm protan ΔE2000 is below 12, replace the purple arm with `#9085e9` alone at varying alpha and promote hatch direction (45° outflow, 135° inflow) to the primary channel. The hatch ships either way, so a CVD failure degrades to a still-correct render.

**Neutral sequential (coverage-asymmetry `C`, the default fill):** dark `#5F5F5A` (3.01) → `#6E7A8C` (4.44) → `#87909D` (5.98) → `#A3ADBD` (8.53); light `#87909D` (3.09) → `#6E7A8C` (4.17) → `#5C6B85` (5.16) → `#4A5361` (7.44). Low coverage renders darkest on dark and lightest on light — literally faint, which is the semantics.

**Status colours** `#2BD49B` `#E3A008` `#F2763A` `#FF6B6B` are validated for contrast against the dark surfaces only. [UNVERIFIED: their ΔE separation from the eight categorical slots was never computed, so a status colour could impersonate a data series.] Enforce separation **structurally rather than measuring it**: status colours never appear inside a plot area, and always ship with an icon plus a text label. A status colour used as a series fill is a build defect.

#### 7.9.5 Chart and mark conventions

1. **Modelled vs observed is a visual distinction, not a footnote.** Observed = solid stroke and fill. Modelled/extrapolated = dashed stroke + 12%-alpha hatch + the word `modelled` in the tooltip + the `ƒ` glyph. Assumed zero = `⊘` glyph and an explicit "assumed zero, not measured" tooltip; it is never plotted as a zero point on a line.
2. **Corridor arcs carry exactly three channels**, and the legend states all three in words:

| Channel | Meaning | Mapping |
|---|---|---|
| width | movements per 1,000 destination population, per year | `sqrt` scale, domain frozen over all 34 years, clamped to [p05, p99], output 0.6–6.0 px |
| dash | cross-model disagreement `d_p`, held constant within each 5-year period | `d_p < .10` solid · `.10–.25` `[12,4]` · `.25–.50` `[8,6]` · `.50–1.0` `[4,8]` · `≥1.0` `[2,10]` |
| opacity | `min(C_o, C_d)` coverage-asymmetry, computed in `semantic` | `alpha = 0.12 + 0.68·C` |

3. **"Not computable" is not "maximum".** A corridor whose `d_p` returns `Refusal('NoSharedPeriodGrid')` renders 1px dotted `[1,14]` at 0.35× its computed alpha, is excluded from the dash legend's ordinal scale, and gets its own legend entry: *"disagreement not computable — outside the shared period grid"*. Collapsing a refusal into an extreme value is the single most tempting correctness bug in this layer.
4. **Gaps are gaps.** `align()` defaults to `"none"`. A missing year breaks the line; it is never bridged, forward-filled or smoothed. A sparkline over a series with two missing years shows two breaks.
5. **Period data is a step function** with visible risers at boundaries. Annual data is a line with vertices at years. Never mix the two in one mark.
6. **Bars start at zero, always.** Truncated bar axes are a build defect. Line charts may use a non-zero y-domain and must label it.
7. **Axes:** 11px uppercase labels, one hairline axis line at `--border-default`, no gridlines except a single hairline at zero on diverging charts. No chart titles inside the plot area — the panel heading is the title.
8. **Direct labels beat legends** for ≤4 series. Above 4 series, a legend at the top with the fixed slot order, never reflowed by value.
9. **Ranking controls are disabled for degraded values.** Any figure whose relative interval width exceeds 0.5 renders greyed at `--text-muted`, is labelled `indicative only`, and is **excluded from every sort and every top-N**, including the `Shift+G` table. [The 0.5 cut-point is project policy, not a published convention — say so in `PARAMETERS.md`.]

#### 7.9.6 Number formatting

```ts
// packages/ui/src/figure/format.ts
export interface FormatResult { readonly text: string; readonly title: string; }

/** Deterministic. Pinned locale. Unit-tested against a golden table.
 *  Returns '—' for null. Never returns '0' for a missing value. */
export function formatValue(
  value: number | null, spec: FormatSpec, kind: EstimateKind,
): FormatResult;
```

| Rule | Value |
|---|---|
| Locale | `new Intl.NumberFormat('en-GB', …)`, pinned; golden-table unit test so an ICU change fails CI rather than drifting |
| Significant figures | modelled and extrapolated **2 s.f.**; observed and observed_flagged **3 s.f.** |
| Interaction with pipeline rounding | `semantic` applies `5·round(n/5)` below 1,000, `10·round(n/10)` below 10,000, 3 s.f. at or above 10,000, **after** suppression. `<Figure>` then applies the s.f. cap. **The tighter of the two wins.** Never widen a pipeline-rounded value back out. |
| Grouping | comma thousands separators for counts; **never for years** (`1990`, not `1,990`); never for ISO codes |
| Rates | `per 1,000 population`, 2 d.p., with the denominator named in the row label — never a bare rate |
| Percent | 0 d.p. for `d_p` and coverage shares; the range is `0–200%` because `d_p` is clamped to `[0,2]` |
| Ratios | 2 d.p. (`PSR 3.06`, `s = 0.34`) |
| Currency | `PPP$ (constant 2021 international $)` spelled out on first use per panel; never a bare `$` |
| Missing | `—` at `--text-muted` plus a badge naming the reason (`no source`, `withheld <25`, `outside coverage`) |
| Zero | only when the source genuinely reports zero. `assumed_zero` renders `⊘ assumed zero` as text, not `0`. |
| Negative | leading minus, never parentheses, never a colour-only cue |
| Denominator mandate | no absolute people-count renders without a per-capita value in the same visual unit; per-capita is the default encoding everywhere |

### 7.10 Empty, loading, refusal and error states

Five states, one component, all named and testable. **The v1 degradation ladder has exactly two rungs: `SNAPSHOT` and `UNAVAILABLE`.** `LIVE` and `CACHED` do not exist in v1 and no code path may produce them.

| State | Trigger | Render |
|---|---|---|
| **Loading** | Parquet parse and `AttributeCube` build, before first paint | A deterministic load panel on `--surface-0`: wordmark, then one row per Tier A table with its measured byte count, ticking to done. **No spinner, no progress bar over the canvas, and the canvas does not mount until every table needed by `/` is ready** — so no layer ever pops in. Target ≤3s to interactive on the M0 reference machine; measure it in the M2 harness and report it in `SNAPSHOT.md`. Over 3s is an M2 defect, not a size problem. |
| **Empty** | A valid query with no data | The figure renders `—` with its badge in place. The panel does **not** disappear and does **not** collapse. A country with nine em-dashes is the correct render. |
| **Refusal** | A kernel `Refusal` | `<RefusalSentence>`: the reason as prose, the `code` in 11px mono beneath it, and the contributing `sourceIds` as links. Example, verbatim in kind: *"No unique solution: the projected support ratio is not monotone in annual intake for this age profile."* Never a number, never a bare em-dash, never an interpolation. Handle all eight `RefusalCode` values, including the three added in §12. |
| **Error** | Parse failure, manifest mismatch, bad permalink, unknown route | `<NonIdealState>` naming what failed, the observed-vs-expected values, and one action. Never a generic "Something went wrong". A manifest-hash mismatch names both hashes. |
| **Policy denial** | A `PolicyVerdict{deny}` from `@exodus/policy` | `<PolicyVerdictSheet>`: the refusal sentence, then the machine-readable body rendered as formatted JSON in a `<pre>`, then a link to the rule. The **403-not-451** specification is documented here and the verdict function is tested; there is no server in v1 to return a status code, so do not render a status code as though one were returned. |

### 7.11 Accessibility

`axe-core` must be clean on all six routes **and** with each of the four overlays open. That is ten axe runs in CI, not six.

#### 7.11.1 Contrast

Body text ≥4.5:1 (WCAG 2.2 SC 1.4.3). Large text ≥3:1. **Interactive-control boundaries and graphical objects ≥3:1 (SC 1.4.11)** — which is why `--border-interactive` and never `--border-default` surrounds anything clickable, and why the sequential and diverging ramps are capped where they are. `--text-muted` is 4.44:1 dark / 4.41:1 light, marginally under the body floor; **the "labels and axes only, never body" restriction is load-bearing and must not be relaxed.** Focus indicator: 2px `--focus-ring` with a 2px offset, ≥3:1 against both the control and the adjacent surface. Every ratio in this section is void over the WebGL canvas without `--scrim-globe`.

#### 7.11.2 Never colour alone

Every categorical encoding carries a second channel: direct label (≤4 series), shape, or a 45°/135° hatch texture. Hatch turns on automatically under `forced-colors: active`, in print, and under the user's a11y setting. Status colours always ship with an icon plus a text label. Arc direction is carried by hue **and** by the arrow glyph in the tooltip and the `→` in the corridor id. *Accept:* an M8 test asserts no encoding in the layer registry has `channels.length === 1` where that channel is `hue` or `fill`.

#### 7.11.3 Keyboard paths

Every route is fully operable from the keyboard with no pointer. The canvas has `role="application"`, an `aria-label`, and `aria-describedby` pointing at the always-present (visually collapsed, never `display:none`) globe text alternative. Arrow keys move a country cursor through a spatially-sorted list of the 258 ADM0 features; `Enter` selects; `Shift+Enter` opens `/place`. Focus order follows the F6 regions in §7.8. Focus is trapped in the palette, the provenance popover, the refusal sheet and the first-run notice, and returns to the trigger on close. No keyboard trap anywhere else — verified by an axe rule and by a scripted `Tab`-through of every route.

#### 7.11.4 The screen-reader alternative to the globe

`Shift+G` yields `<GlobeTextAlternative>`, and it is **mandatory, not a courtesy**.

```ts
export interface GlobeAltRow {
  readonly rank: number;
  readonly origin: string;            // ISO3 + English name
  readonly destination: string;
  readonly value: DataFigure;         // movements, with unit and provenance
  readonly perCapita: DataFigure;
  readonly changeFromPrevYear: DataFigure | Refusal;
  readonly disagreement: DataFigure | Refusal;   // d_p, or the not-computable refusal
  readonly coverage: DataFigure;                 // min(C_o, C_d)
}

export interface GlobeAltProps {
  readonly year: number;
  readonly rows: readonly GlobeAltRow[];   // top 25 by the current width channel
  readonly sort: keyof GlobeAltRow;
  readonly onSort: (k: keyof GlobeAltRow) => void;
}
```

A real `<table>` with a `<caption>` naming the year and the sort, `scope` on every header, sortable by every column from the keyboard, and every cell rendered through `<Figure>` so provenance is reachable without a pointer. It reflects the **same** selection, year and layer visibility as the canvas, and it updates when they change. Degraded values are present but marked `indicative only` and excluded from the ranking. With Tier B installed, the table gains a corridor search and is no longer capped at 25.

#### 7.11.5 Reduced motion

| Under `prefers-reduced-motion: reduce` | Behaviour |
|---|---|
| Establishing camera move (§7.13) | **Zero-length.** Not shortened — absent. |
| `.` move-to-selection, `f` fit | Instant cut, 0ms |
| Panel, drawer, popover transitions | 0ms, except opacity ≤80ms |
| Year scrubbing and playback | **Identical to the default**, because it was already discrete cuts with no interpolation. Say this in the `?` dialog: the honest behaviour needed no reduced-motion variant. |
| Hover dimming | Instant, no fade |

*Accept:* an M8 test runs the suite with `prefers-reduced-motion: reduce` forced and asserts the entry animation's duration is 0 and that no `transition` property with a non-zero duration exists on any mounted element except opacity.

### 7.12 Binding anti-dehumanising visual constraints

These are not guidance. Each is enforced by a named `@exodus/policy` rule module over source, copy, the **built bundle**, package names, route paths, asset filenames and the repository name, and each has a test that fails on a seeded violation.

| # | Constraint | Enforcement |
|---|---|---|
| 1 | **Warm hue never means people.** Red, orange and yellow are reserved for service and rights deficits. The only warm marks in the product are negative-headroom bars and status chips outside plot areas. The map's `#d95926` slot encodes **direction**, never magnitude. | Rule 4 + a screenshot test asserting no warm pixel inside the people-density or corridor-width legend swatches |
| 2 | **No diverging palette on a people-count layer.** Diverging is for balance, gap, deficit and change only, with a labelled neutral. | Registry assertion: `geometry: 'h3'` and the sequential ramp are bound together in the layer registry |
| 3 | **Symmetric direction by default.** Inbound and outbound render at identical weight; a destination-only default reads as siege. | Default layer config test |
| 4 | **Per-capita is the default encoding.** An absolute-count mode exists behind an explicit toggle and carries a permanent denominator chip. | Default config test + the `<Figure>` denominator mandate |
| 5 | **No convergence motion.** Arcs do not travel, accelerate toward a destination, pulse on arrival, or ripple at the endpoint. No particles at all. | Motion prohibitions in §7.9.3; an AST rule banning `TripsLayer` and any animated accessor in `packages/globe` |
| 6 | **No route geometry.** Corridors are 2-vertex great circles between ADM0 centroids, tessellated for rendering only. Any movement-layer `LineString` with more than two source vertices is rejected at construction by a Zod refinement. | Rule 6 geometry guard, unit-tested |
| 7 | **No Missing Migrants coordinates, ever.** Coordinates are dropped at ingest; the dataset renders as ADM0 annual counts and has no map layer. | `bundle:verify` + a schema test asserting the columns do not exist |
| 8 | **No gridded people layer finer than H3 r3**, and it renders `pop / area_km2`, never a raw count. | Registry assertion + `max_h3_resolution` in `layer_policy.yaml` |
| 9 | **No nationality cross-tab below ADM0.** | Rule 6 policy verdict, rendered as §7.10's policy sheet |
| 10 | **Banned visual motifs:** `crosshair`, `reticle`, `radar`, `sweep`, `target`, `track`, `lock`, `watchlist`, `dossier`, scanlines, threat pulses over populated places, person silhouettes as icons, national flags as a population's primary identifier. Schema renames are mandatory: `watchlist → saved_views`, `target → area_of_interest`, `entity → place \| indicator`. | Rule 4, over identifiers, asset filenames and route paths |
| 11 | **The search index contains no person-shaped type.** Four scopes: actions, datasets, countries, corridors. | Rule 3 + a `PaletteScope` union with exactly four members |
| 12 | **Banned lexicon**, structured on the seven dehumanising source concepts (animal, vermin, parasite, physical pressure, water, commodity, war): `illegal` of a person, `alien`, `flood`, `wave`, `surge`, `influx`, `tide`, `stream`, `swarm`, `invasion`, `bogus`, `burden`, `host` for destination, `absorb`/`absorption` of people rather than labour markets. Required form: *"migrant in an irregular situation"* / *"non-documented or irregular migrant workers"* (UNGA Res. 3449 (XXX), 9 Dec 1975). Replacements: `flows → movements`, `influx → arrivals`, `host country → destination country`. | Rule 1, over the built bundle |
| 13 | **Banned output strings:** `capacity limit`, `carrying capacity`, `maximum`, `threshold`, `saturation`, `real-time` adjacent to a stock or flow, `PPML is unbiased`, `confidence interval` adjacent to the disagreement figure. Required label wherever headroom renders: *"Modelled labour-market absorption under assumption set «name» — not a policy limit."* | Rule 2, over the built bundle |
| 14 | **Contested official statistics** never render in a default view without a hatched overlay and a "Contested — see note" chip. | `contestation` flag on the source manifest; default-view test |
| 15 | **Viewer privacy is a UI constraint:** zero third-party scripts, no fonts from a CDN, no account, no cookies, cookieless self-hosted analytics with 7-day retention and IPs truncated to /24 IPv4 and **/32 IPv6**, or no analytics at all. | CSP `connect-src 'self'`; the M2 `--network=none` test proves it |

### 7.13 First run

#### 7.13.1 The first ten seconds

| t | What the visitor sees |
|---|---|
| 0.0–≤3.0s | The load panel: wordmark, the table list ticking to done with measured byte counts. No globe yet, because a globe that gains layers is a globe that lies about being ready. |
| ≤3.0s | The canvas mounts **fully rendered at frame one** — ocean sphere, 258 polygons, 41,162 hexes, 12,000 corridors, graticule, labels — at the Global South default camera, year 2023, coverage fill. Nothing pops in. Nothing animates. |
| 3.0s | The first-run notice (§7.13.2) fades in over the scrim at 80ms opacity, **over the live globe, not instead of it**. Half the arcs are visibly hatched behind it. That image is the product's argument and the visitor gets it before reading a word. |
| 3.0s–…| The visitor reads and scrolls the notice to the end. Repeat visitors never see it (`localStorage` key `corridor.firstrun.v1`), and skip straight to the next row. |
| on acknowledge | The notice dismisses in 180ms and the **2.4s establishing camera move** begins — camera only, deterministic keyframes, decelerate easing, ending exactly at the default camera. Any input cancels it. Once per session (`sessionStorage` key `corridor.entry.v1`). Zero-length under reduced motion. |
| +2.4s | Idle at the default view, tour prompt visible in the context rail: `New here? Take the 90-second tour  ↵`. It is a suggestion, never a modal, and it disappears on any interaction. |

**Resolution of an apparent conflict, stated so you do not re-litigate it mid-build:** the ethics research requires a blocking first-run notice; the design requires the world fully rendered at frame one. Both hold, because the notice sits *over* a fully rendered globe on the scrim, not over a loading screen. If `localStorage` is unavailable, **fail closed and show the notice** — an unknown visitor is treated as a new one.

#### 7.13.2 First-run notice

A modal on `e3` elevation over `--scrim-globe`, max-width 640px, scroll-to-end required before the primary action enables, focus trapped, `Esc` does **not** dismiss it. Shown once per browser and again on any methodology major-version bump. Copy, verbatim:

> **Before you use these numbers**
>
> This atlas is about people. Every figure on it represents someone's life, and most of those people had no say in being counted.
>
> **These are estimates, not counts.** Migration data is incomplete everywhere. People in irregular situations, unregistered displaced people, and anyone with reason to avoid being enumerated are systematically undercounted. Different countries count different things, at different times, using different definitions. We show disagreement on every figure because the disagreement is real and often large.
>
> **This tool is not for finding people.** We publish nothing about individuals. Movement data is deliberately delayed, coarsened and abstracted: no routes, no crossing points, no live tracking. Small cells are withheld — the threshold varies by geographic detail and is published in full in our methods. If you are looking for a tool to locate, intercept, screen or remove anyone, this is not that tool and we have built it so that it cannot become one.
>
> **Numbers are not decisions.** Our models estimate what labour markets and public services might absorb under stated assumptions. They do not tell you how many people a country should admit. That is a political and legal question, governed by the right to seek asylum, the prohibition of refoulement, and the prohibition of collective expulsion — none of which a model can weigh.
>
> **Words matter here.** We use *refugee*, *asylum-seeker*, *internally displaced person*, *stateless person*, and *migrant in an irregular situation* precisely, following the IOM Glossary on Migration. No person is illegal.
>
> If something here is wrong, or if you believe this tool is causing harm, tell us: **[Report a problem]** — we answer within 30 days and we will withdraw a layer if we have to.
>
> `[ I understand — open the atlas ]`  `[ Read the methods ]`

Note what this copy does **not** say: it does not hard-code a suppression threshold, because `K` differs by granularity and a wrong number in the most-read paragraph in the product is the worst possible place for one.

#### 7.13.3 The guided tour

Five steps, keyboard-driven, dismissible at every step, never auto-advancing, and it **animates no data mark** — each step only moves focus and opens the panel it is describing. Stored under `corridor.tour.v1`. Reachable forever from the palette (`> take the tour`) and from `?`.

| Step | Anchor | The single sentence it teaches |
|---|---|---|
| 1 | The Year Machine | "One handle, thirty-four years. The data steps; nothing is interpolated between years." — then it steps the cursor 2023 → 2019 → 2023 so the flipbook is felt, not described. |
| 2 | A hatched arc in the corridor layer | "Dashes mean the two best models disagree, and the pattern steps at five-year boundaries because the models live on different time grids." |
| 3 | A faint Gulf corridor | "Faint means nobody counted. Opacity is data coverage, computed by the platform — no layer can opt out of it." |
| 4 | A `<Figure>` and its `ⓘ` | "Every number here carries its source, its vintage and how it was made. A number with no source renders as an em dash, never as zero." |
| 5 | The `/methods` link | "This is the loudest screen we have: what this field can actually predict, and what we refused to build." |

*Accept:* a Playwright test walks all five steps by keyboard, asserts the tour never sets `transitions` on a data accessor, asserts each step's anchor is focused and its `aria-live` announcement fires, and asserts that dismissing at any step writes the storage key and never shows it again.

### 7.14 Section acceptance criteria

The build is not done with this section until every one of these passes.

1. `axe-core` clean on six routes and four overlays — ten runs.
2. A scripted `Tab`-through of every route reaches every interactive control, traps focus only in the four designated overlays, and returns focus to each trigger on close.
3. `Shift+G` renders a real sorted `<table>` of 25 rows, keyboard-sortable on every column, with provenance reachable per cell, reflecting the current year and selection.
4. Every interactive control's computed border colour is `--border-interactive`; a seeded `--border-default` on a control fails the test.
5. Every canvas-overlay text node's computed background is `--scrim-globe`.
6. A seeded numeric literal in JSX text, and a seeded numeric-typed JSX expression child, each fail the `<Figure>` AST rule; `width={280}` does not.
7. A fixture with a null value renders `—` with a badge and never `0`; a fixture returning each of the eight `RefusalCode` values renders a sentence.
8. The width scale domain is identical at `cursor = 1990` and `cursor = 2023`.
9. A `NoSharedPeriodGrid` corridor renders the dotted not-computable treatment and a distinct legend entry, not the maximum dash density.
10. No UI surface exposes an opacity control for the corridor layer; a type-level test proves `MapLayer.encode()` cannot reach the opacity field.
11. `pnpm check:policy` exits non-zero on a seeded violation of each of the six rule modules, including one seeded in the **built bundle** rather than in source.
12. The colonial-dummy control reports `role="radiogroup"` with three options.
13. Running with `prefers-reduced-motion: reduce`, the entry animation duration is 0 and year scrubbing is byte-identical in behaviour to the default.
14. A golden-table test pins `formatValue` output for 24 cases across all eight `FormatSpec.kind` values and all five estimate kinds.
15. The Scenario VI footnote is present in the accessibility tree and has no dismiss control.
16. `localStorage` disabled: the first-run notice shows, `saved_views` renders empty, and nothing throws.

---

## 8. Live layer: streaming signals, freshness and offline truth

This section governs every clock in the product: how old each number is, how the interface says so, what the optional live sidecar may do, and how the whole thing stays fully demo-able with the network cable out. It is binding on `packages/contracts`, `packages/semantic`, `packages/sdk`, `packages/globe`, `apps/web`, and — only at M9 — `apps/live`.

Read §8.1 before you write any connector. Read §8.2 before you render any timestamp. Read §8.10 before you write any fetch.

### 8.1 The v1 gate: what exists, what does not

v1 is a **static site**. There is no server, no SSE endpoint, no poll scheduler, no WebSocket, no degradation state machine with more than two states. Kill-list item 3 is in force.

| Capability | v1 (M0–M8) | M9 (optional, flagged) |
|---|---|---|
| Incident ribbon on the globe | Yes — reads the committed 72h corpus, `SNAPSHOT` chrome | Yes — same layer, `LIVE` chrome while the stream is genuinely live |
| Pulse, emissive blend, bloom | **Never.** No pulse, no emissive, no bloom post-FX | Arrival pulse and bloom permitted, only while the ladder state is `LIVE` |
| Server process | None. `pnpm build` emits a directory | `pnpm live`, a standalone Node process, roughly 150 lines |
| Transport | None — the corpus is a build artefact | SSE, one multiplexed stream |
| Degradation ladder states | `SNAPSHOT`, `UNAVAILABLE` | `LIVE`, `CACHED`, `SNAPSHOT`, `UNAVAILABLE` |
| Replay mode | Yes, and it is the only mode | Yes — `pnpm live --replay` drives the same stream from the corpus |

Gate: **M9 starts only when M0–M8 are complete and green.** If M9 never lands, the product is complete and no acceptance criterion elsewhere in this document fails. `apps/live` must not appear in `apps/web`'s dependency graph; `dependency-cruiser` fails the build if it does.

The one thing you must build in v1 that looks like live plumbing: the **record-replay HTTP client in `packages/sdk`** (§8.10) and the **corpus transform path** (§8.4). Both are needed for ingest and for the incident ribbon regardless of M9.

### 8.2 The latency taxonomy

Six classes. The union in `packages/contracts/src/latency.ts` is authoritative and closed; do not add a seventh, do not rename one. The section brief's informal names map onto it as follows, and only the code tokens ever appear in identifiers, JSON or CSS class names.

| Code token | Informal name | Exact definition | Permitted only when |
|---|---|---|---|
| `live` | live | Source publishes on a cadence of one hour or less, and the newest observation in the layer is under 6 hours old at render time | `cadence === 'sub-hour'` and the collector's ladder state is `LIVE` |
| `daily` | near-real-time | Source cadence 24 hours or less; newest observation under 7 days old | `cadence === 'daily'` |
| `periodic` | recent | An official release on a biweekly, monthly or quarterly schedule, with a stated publication lag | `cadence` in `monthly`, `quarterly` |
| `annual` | annual | An annual official estimate or register count; typically 6 to 24 months stale | `cadence` in `annual`, `quinquennial`, `frozen` |
| `modelled` | modelled | Computed by a model, never observed. No decay: stamped with the vintage of its **oldest** input | any `estimate_kind` of `modelled` or `extrapolated`, or any `@exodus/kernel` output |
| `projected` | projected | A scenario or counterfactual with no truth value at any date | WPP variant differentials, the constant-PSR bisection result |

```ts
// packages/contracts/src/latency.ts
export const LATENCY_CLASSES = [
  'live', 'daily', 'periodic', 'annual', 'modelled', 'projected',
] as const;
export type LatencyClass = (typeof LATENCY_CLASSES)[number];

export const CADENCES = [
  'sub-hour', 'daily', 'monthly', 'quarterly', 'annual', 'quinquennial', 'frozen',
] as const;
export type Cadence = (typeof CADENCES)[number];

// Monotone lattice. Higher index = weaker claim on reality.
const RANK: Record<LatencyClass, number> = {
  live: 0, daily: 1, periodic: 2, annual: 3, modelled: 4, projected: 5,
};

/** A derived value inherits the WEAKEST class of its inputs. */
export function worstLatency(inputs: readonly LatencyClass[]): LatencyClass {
  if (inputs.length === 0) throw new Error('worstLatency: no inputs');
  return inputs.reduce((a, b) => (RANK[a] >= RANK[b] ? a : b));
}

/** A derived value inherits the OLDEST vintage of its inputs. ISO-8601 dates. */
export function oldestVintage(inputs: readonly string[]): string {
  if (inputs.length === 0) throw new Error('oldestVintage: no inputs');
  return inputs.reduce((a, b) => (a <= b ? a : b));
}

/** Licence flags AND across inputs. Unknown is false, never true. */
export function inheritLicence(
  inputs: readonly { redistributable: boolean }[],
): { redistributable: boolean } {
  return { redistributable: inputs.every((i) => i.redistributable) };
}
```

**Propagation is not advice, it is `packages/semantic`'s job.** `align()`, every join and every `AttributeCube` attribute runs its inputs through `worstLatency`, `oldestVintage` and `inheritLicence`. A layer author cannot set `latencyClass` any more than they can set opacity (§6, decision 19). A unit test asserts that a value derived from a 2023 `modelled` spine row and a 2026 `live` signal is `modelled`, vintage 2023 — never `live`.

Class assignment for every Tier A source, fixed at M1 and rendered on `/sources`:

| Source id | `cadence` | `latencyClass` | Typical lag | Note that must appear on `/sources` |
|---|---|---|---|---|
| `gaskin-abel` | `annual` | `modelled` | 1–2 years | Neural-network ensemble output, 73% test correlation, never derived by aggregating records |
| `abel-cohen` | `quinquennial` | `modelled` | 5-year periods, latest 2015–2020 | Six period points only |
| `eurostat-mirror` | `annual` | `annual` | ~12–24 months | Two national statistical offices, `OBS_FLAG` per row |
| `eurostat-asylum` | `monthly` | `periodic` | ~4 weeks | The only true sub-annual bilateral series in the product. Badge reads `monthly, approx. 4-week lag`. The word `real-time` is banned adjacent to it |
| `wpp` | `annual` | `projected` for variant differentials, `annual` for 2024 base | n/a | VarID 2 minus VarID 7 is a counterfactual |
| `wdi-who` | `annual` | `annual` | 1–3 years | GHO array is unsorted; sort before taking latest |
| `cepii` | `frozen` | `annual` | fixed 202211 vintage | Dyad context only |
| `ghs-h3` | `frozen` | `modelled` | n/a | Gridded population is modelled |
| `iom-mm` | `annual` | `annual` | weeks to months | Severe undercount; render as a lower bound, never a count |
| `naturalearth`, `centroids`, `xwalk` | `frozen` | `annual` | n/a | Geometry, not measurement |
| `corpus` | `sub-hour` | `live` at record time, **rendered as `periodic`** in v1 | see §8.10 | Replayed, not live. Chrome is `SNAPSHOT` |

The last row is the important one. A signal recorded from a sub-hour feed **does not stay `live` once it is committed to git**. `snapshot:build` rewrites `latencyClass` to `periodic` for every corpus-derived row and stamps `vintage` with the corpus window end. Only a running collector (§8.7) may emit `live`, and only while its ladder state is `LIVE`.

### 8.3 Freshness in the UI

Freshness is rendered by **texture, border and motion — never by colour** (colour carries direction and selection only; warm hues are reserved for service and rights deficits). This keeps freshness readable under both simulated colour-vision deficiencies and the dark theme, and it survives a screenshot.

| Class | Mark treatment | Motion | Border chrome | Timestamp label format |
|---|---|---|---|---|
| `live` (M9 only) | Point mark, full saturation, additive blend permitted | **One** arrival pulse of 1.2s on first ingest, then static | Solid 1px, `--border-interactive`; `LIVE` dot in the legend | Relative: `4 min ago` |
| `daily` | Solid point, 70% opacity | Single arrival pulse on ingest, then static | Solid 1px | `18 Sep, T+0` |
| `periodic` | Choropleth or static point, no glow | **None** | Solid 1px | `1-16 Aug 2026, biweekly` or `monthly, approx. 4-week lag` |
| `annual` | Flat choropleth, desaturated ramp, 4px diagonal hatch overlay | **None, ever** | Dashed 1px | `2024 estimate` |
| `modelled` | Dashed `PathLayer` stroke, reduced alpha, small `f` glyph | None beyond the year cursor | Dashed 1px | `modelled from 2015-2020` |
| `projected` | Hollow, outline only | Scenario controls only | Dashed 1px plus a non-dismissible `SCENARIO` watermark drawn **on the canvas**, not only in the panel | `scenario, 2050` |

Binding rules, each with a test:

1. **One global AS-OF chip** in the top bar shows the **oldest** contributing vintage across everything currently visible. Showing the newest is the lie. Test: a view combining a 2023 spine row and a 2026 corpus signal renders `AS OF 2023`.
2. **Every `<Figure>` provenance popover ends with a provenance line**: source name, vintage, `latencyDays`, `estimateKind`, licence, deep link. No exceptions; this is already `<Figure>`'s contract (§2, item 10).
3. **A `live` mark and an `annual` mark are never summed into one number.** If a composition would do so, `semantic` returns the value with `worstLatency` applied and the UI renders an inline caution band naming both classes. It does not silently produce a number.
4. **Motion is reserved for observed events and for the time cursor under the user's hand.** Annual data never moves. A pulse repeated on a loop over a populated place is a banned visual motif (radar sweep, threat pulse); the arrival pulse is a single 1.2s event on first render and then the mark is static. `prefers-reduced-motion` removes the arrival pulse entirely and the mark appears at its final state.
5. **The word `real-time` never appears adjacent to a stock or a flow.** Banned-strings rule module 2 runs over source, copy and the built bundle. `live` in the code token sense is permitted only as an identifier under the conditions in §8.2.
6. **Freshness never multiplies a confidence, an opacity or a disagreement value.** Arc opacity is coverage-asymmetry `C` (§5, M4) and nothing else may touch it. A freshness decay score, if you render one at all, is a label and a legend state — never a channel. Any exponential decay constant is an author choice with no literature behind it and must be badged as such in `PARAMETERS.md` if you introduce one; prefer the plain relative-age label, which needs no coefficient.
7. **A stale or absent signal source is not a `Refusal`.** Do not widen `RefusalCode`. It is a degraded layer: struck-through legend entry, last-good `fetchedAt` shown, the layer still drawn from the last good data (§8.9).

### 8.4 The event pipeline: raw source to globe mark

One pipeline, two drivers. Stages 1 to 5 are identical in v1 and M9; only the thing that calls stage 1 differs. This is what makes the live layer cheap when it arrives and harmless when it does not.

| # | Stage | Owner | v1 driver | M9 driver |
|---|---|---|---|---|
| 1 | `plan()` returns declarative `FetchPlan[]`, inspectable without running | `packages/connectors/<id>` | `pnpm ingest`, rendered verbatim on `/sources` | collector tick |
| 2 | `fetch(plan, ctx)` through the record-replay client — the only network path in the codebase | `packages/sdk` | record mode during corpus capture; replay mode thereafter | record mode, live |
| 3 | `transform(raw): Signal[]` — **pure**, no clock, no network, asserts its schema | `packages/connectors/<id>` | called by `snapshot:build` over corpus entries | called per poll |
| 4 | Dedupe and upsert by `signalKey` (§8.5); policy gate: licence, banned fields, geometry | `packages/semantic` + `packages/policy` | build time | per event |
| 5 | Latency and licence inheritance, `estimate_kind` styling merged after `encode()` | `packages/semantic` | build time, written to `snapshot/signals.parquet` | in-process, then SSE frame |
| 6 | Mark | `packages/globe` | `ScatterplotLayer`, `SNAPSHOT` chrome, no pulse, no emissive, no bloom | same layer, `LIVE` chrome, arrival pulse, bloom permitted |

Two invariants that a test must enforce:

- **One `transform` per source, two callers.** A test runs `transform()` over a committed fixture and asserts the resulting `Signal[]` is byte-identical to the rows `snapshot:build` wrote for the same fixture. If M9 ever needs a second transform for the same source, the design is wrong.
- **The incident ribbon is not on the year axis.** The corpus window is present-tense; the Year Machine covers 1990 to 2023. The ribbon renders **only when the time cursor is at the final frame**. Scrubbing off that frame hides the marks and greys — never removes — the legend entry, whose text reads `present-day signal window, not part of the 1990-2023 series`. The ribbon never enters the `AttributeCube` and never allocates a per-year buffer.

### 8.5 The normalised Signal event

```ts
// packages/contracts/src/signal.ts
import { z } from 'zod';
import { LATENCY_CLASSES } from './latency';

export const SIGNAL_KINDS = ['quake', 'disaster_alert', 'news_event'] as const;
export type SignalKind = (typeof SIGNAL_KINDS)[number];

export const GEO_PRECISIONS = ['point', 'adm1', 'adm0'] as const;
export type GeoPrecision = (typeof GEO_PRECISIONS)[number];

export const SEVERITY_SCALES = [
  'gdacs_alertscore',  // integer 1|2|3, from the alertscore field
  'moment_magnitude',  // USGS mag
  'cameo_root',        // GDELT EventRootCode, ordinal, NOT cardinal
] as const;
export type SeverityScale = (typeof SEVERITY_SCALES)[number];

export const SignalSchema = z.object({
  // Identity
  signalKey: z.string(),        // `${sourceId}:${externalId}` - the upsert key
  sourceId: z.string(),         // 'gdelt.v2.events' | 'usgs.quakes' | 'gdacs.events'
  externalId: z.string(),       // GLOBALEVENTID | USGS feature id | `${eventtype}${eventid}`
  revision: z.number().int(),   // episodeid for GDACS, 0 elsewhere; higher wins on upsert

  // What
  kind: z.enum(SIGNAL_KINDS),
  subtype: z.string(),          // 'EQ'|'FL'|'TC'|'VO'|'WF'|'DR' | cameo root as string
  severity: z.object({
    scale: z.enum(SEVERITY_SCALES),
    value: z.number(),
    label: z.string(),          // 'Orange', 'M 5.4', 'FIGHT' - rendered verbatim
  }),

  // Where - hazard or news location, never a person and never a movement
  lon: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  geoPrecision: z.enum(GEO_PRECISIONS),
  iso3: z.string().length(3).nullable(),

  // When
  occurredAt: z.string().datetime().nullable(),  // when the phenomenon happened
  publishedAt: z.string().datetime(),            // when the source released it
  fetchedAt: z.string().datetime(),              // when we pulled it
  slot: z.string(),                              // source watermark, e.g. '20260918213000'

  // Provenance and rights - mandatory, exactly as on every fact row
  latencyClass: z.enum(LATENCY_CLASSES),
  licenseId: z.string(),
  redistributable: z.boolean(),
  provenanceUrl: z.string().url(),
  corpusSha256: z.string().length(64).nullable(),  // sha256 of the upstream artefact
});

export type Signal = z.infer<typeof SignalSchema>;
```

Invariants, each enforced by a test in `packages/policy`:

1. **No person-shaped field, ever.** `Signal` carries no `figure`, `population`, `affected`, `casualties`, `person`, `name`, `dob`, `case_id`, `applicant` or `biometric`. Banned-schema-fields rule module 3 walks the generated JSON Schema, not only the source. A signal is a hazard or a news event; it is never a count of people and never a movement.
2. **No route geometry.** A `Signal` has one point, not a `LineString`. The greater-than-two-vertex guard (§6, rule module 6) applies to the whole codebase; there is no path through which a signal can acquire a second vertex.
3. **Precision is rendered, not laundered.** A signal with `geoPrecision: 'adm0'` renders at the ADM0 centroid as a **hollow** glyph, and its tooltip reads `country-level, not a location`. It never renders as a filled point at a nominal latitude and longitude that implies a street.
4. **`licenseId` and `redistributable` are mandatory.** A signal missing either fails `snapshot:build` and fails the SSE frame validator. `bundle:verify` refuses a corpus containing any source outside the three in §8.6 and names the reason on stderr.
5. **No composite index.** Do not build a Displacement Pressure Index or any weighted composite of these signals. Author-invented weights are on the not-implemented list (§5) and a robust z-score over mostly-zero series divides by a zero median absolute deviation. The ribbon shows events; it does not score places.

Upsert semantics: key on `signalKey`; replace when the incoming `revision` is greater, or when `revision` is equal and `publishedAt` is newer; otherwise discard. Never sum two signals that share a `signalKey`.

### 8.6 Sources, watermarks and polling cadence

Exactly three sources feed the corpus and the M9 stream. All three are unambiguously redistributable, which is why they are the three.

| Source | Endpoint (verified) | Watermark | Poll | Licence |
|---|---|---|---|---|
| GDELT 2.0 Events | `https://data.gdeltproject.org/gdeltv2/lastupdate.txt` (3 lines, `size md5 url`); backfill index `https://data.gdeltproject.org/gdeltv2/masterfilelist.txt` | the 14-digit slot stamp in the filename; act only when it changes | **60s timer**, download only on slot change | Redistribution, rehosting and mirroring explicitly permitted with citation and a link to gdeltproject.org |
| USGS earthquakes | `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson` | `metadata.generated` | **5 min**, with `If-Modified-Since` | US Government public domain |
| GDACS | `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD` | RSS `pubDate` at `https://www.gdacs.org/xml/rss.xml`, then hydrate via the JSON list | **5 min** | RSS self-declares public domain; attribute to JRC/GDACS regardless. Site-wide licence statement is **[UNVERIFIED]** — see §8.12 |

Per-source traps. Each becomes a paragraph of shipped copy on `/sources`, bound by id to a fixture-backed regression test that fails if the trap stops being true (decision 29).

- **GDELT, URL scheme.** The URLs inside `lastupdate.txt` are plain `http://`. Rewrite to `https://` before fetching. Test id `trap.gdelt.http-scheme`.
- **GDELT, batch size varies.** Observed `export.CSV.zip` 70 to 115 KB, `mentions.CSV.zip` 109 to 121 KB. Size every buffer from the `size` field in `lastupdate.txt`; do not hardcode. Test id `trap.gdelt.variable-size`.
- **GDELT, GKG is excluded.** 5.3 to 5.9 MB per 15-minute slot, roughly 50 GB for 90 days. Never fetched, never recorded, never committed. Test id `trap.gdelt.no-gkg`.
- **GDELT, translingual lags one slot.** `lastupdate-translation.txt` served slot `203000` while `lastupdate.txt` served `204500`. The translingual feed is **out of scope**; if you ever add it, it needs its own watermark and a 1 to 2 slot skew allowance, never a join on an identical timestamp. Test id `trap.gdelt.translation-skew`.
- **GDELT, GEO 2.0 is 404.** `api.gdeltproject.org/api/v2/geo/geo` returns HTTP 404 including on GDELT's own documented example. **Do not build a GEO adapter.** Test id `trap.gdelt.geo-404`.
- **GDELT, DOC API is not used.** It enforces at least 5 seconds between calls and returned 429 on a first call from a shared egress IP. The raw file feed needs no DOC call; do not add one. Test id `trap.gdelt.no-doc`.
- **GDELT, event filter.** Keep CAMEO `EventRootCode` in 14 (PROTEST), 17 (COERCE), 18 (ASSAULT), 19 (FIGHT), 20 (USE UNCONVENTIONAL MASS VIOLENCE). 15 (EXHIBIT FORCE POSTURE) and 16 (REDUCE RELATIONS) are excluded as posturing, not events. Test id `trap.gdelt.cameo-roots`.
- **GDACS, never parse the icon path.** Read `alertlevel` (string), `alertscore` (integer) and `episodealertlevel`. In a sampled row `icon` pointed at Green while `alertlevel` was Orange and `episodealertlevel` was Green. Follow the pre-built `url.geometry`, `url.report` and `url.details` values rather than assembling paths. Test id `trap.gdacs.icon-vs-alertlevel`.
- **USGS, watermark not wall clock.** Use `metadata.generated`; the feed is regenerated on a schedule independent of your poll. Test id `trap.usgs.generated-watermark`.

Excluded from the live layer and from the corpus, by name, with the reason rendered on `/sources`:

| Excluded | Reason |
|---|---|
| EMSC seismic | All rights reserved with a non-commercial carve-out. Better latency than USGS does not buy it in |
| IDMC IDU | CC BY-NC-SA 3.0 IGO. One IDU row makes the repository's data component share-alike non-commercial |
| ACLED, including via HDX HAPI `conflict-events` | HAPI names ACLED as the provider; the aggregation changes the channel, not the rights. Terms forbid functional substitutes and ML training regardless of commercial, academic or experimental framing |
| ReliefWeb | UN terms of use, link-out only, approved appname gated, v1 is 410 Gone |
| Any flight or vessel telemetry | A plane track is not a migrant. Out of scope on epistemic grounds, not licence grounds |

### 8.7 The collector (M9 only): `apps/live`

A single Node process, roughly 150 lines plus the three connector modules it reuses unchanged from `packages/connectors`. It has no database. Its state is an in-memory ring buffer plus the corpus writer.

```ts
// apps/live/src/collector.ts
import type { Signal } from '@exodus/contracts';

export type LadderState = 'LIVE' | 'CACHED' | 'SNAPSHOT' | 'UNAVAILABLE';

export interface CollectorSpec {
  sourceId: string;
  pollMs: number;                                   // 60_000 | 300_000, from the table in 8.6
  /** Returns the current upstream watermark, or null when unreachable. */
  readWatermark(now: Date): Promise<string | null>;
  /** Called only when the watermark changed. Pure transform, impure fetch. */
  collect(watermark: string, now: Date): Promise<Signal[]>;
}

export interface CollectorState {
  readonly sourceId: string;
  watermark: string | null;
  consecutiveFailures: number;
  lastGoodFetchedAt: string | null;
  state: LadderState;
}

/** Full-jitter backoff. base 1s, cap 300s. rand is injected so replay is deterministic. */
export function nextDelayMs(attempt: number, rand: () => number): number {
  const base = 1_000;
  const cap = 300_000;
  const ceiling = Math.min(cap, base * 2 ** Math.min(attempt, 10));
  return Math.floor(rand() * ceiling);
}

/** The only place a ladder state is computed. Five failures means degraded, not gone. */
export function advance(
  prev: CollectorState,
  outcome: { ok: boolean; retryAfterMs?: number },
): CollectorState {
  if (outcome.ok) {
    return { ...prev, consecutiveFailures: 0, state: 'LIVE' };
  }
  const failures = prev.consecutiveFailures + 1;
  const state: LadderState =
    failures < 5 ? prev.state
    : prev.lastGoodFetchedAt !== null ? 'CACHED'
    : 'SNAPSHOT';
  return { ...prev, consecutiveFailures: failures, state };
}
```

Rules:

1. **The browser never touches a third-party API.** CORS, rate limits and user-agent gates all break, and it would put the viewer's IP in someone's log. All fetching is server-side, in this process, behind one egress.
2. **`Retry-After` wins over the backoff curve** when the header is present and parses.
3. **Degraded layers do not disappear.** After five consecutive failures the legend entry is struck through and shows the last-good `fetchedAt`; the marks stay drawn from the last good payload. A vanishing conflict layer reads as no conflict.
4. **Killing the process walks the ladder without a layer vanishing:** `LIVE` to `CACHED` (client still holds signals, bloom off, chrome changes) to `SNAPSHOT` (client falls back to the committed corpus). A Playwright test kills the sidecar mid-session and asserts the mark count never drops to zero and that `LIVE` chrome is gone within one reconnect interval.
5. **Bloom is enabled only while the ladder state is exactly `LIVE`.** `CACHED`, `SNAPSHOT`, `UNAVAILABLE` and replay all disable it. Pulsing chrome over replayed data is the exact freshness lie this whole section exists to prevent (decision 11).
6. **No clock outside the clock module.** `apps/live` takes its `now` from `@exodus/kernel/clock`, injected. `Date.now()` outside `packages/kernel/clock` is an ESLint error with no inline disable permitted; `Math.random()` is banned in `kernel` entirely and injected here so replay is reproducible.

### 8.8 Transport: SSE, and why not WebSockets

`GET /live/stream?sources=gdelt,gdacs,usgs`, `Content-Type: text/event-stream`. One multiplexed stream, not one per source.

Why SSE: the flow is server to client only, one-directional, text. SSE gives automatic reconnection with `Last-Event-ID` for free, survives proxies that mangle upgrade requests, needs no second protocol, and works with ordinary HTTP caching and logging. WebSockets are explicitly cut (§2, OUT item 15); a bidirectional protocol for a one-directional feed is a second thing to get wrong. There is no collaboration layer in v1 or M9, so there is no bidirectional use case to justify one.

Frame contract:

```ts
// packages/contracts/src/stream.ts
import { z } from 'zod';
import { SignalSchema } from './signal';

export const StreamFrameSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('signal'),
    seq: z.number().int().positive(),   // monotonic ingest sequence == the SSE id: field
    signal: SignalSchema,
  }),
  z.object({
    type: z.literal('state'),
    seq: z.number().int().positive(),
    sourceId: z.string(),
    state: z.enum(['LIVE', 'CACHED', 'SNAPSHOT', 'UNAVAILABLE']),
    lastGoodFetchedAt: z.string().datetime().nullable(),
    consecutiveFailures: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal('heartbeat'),
    seq: z.number().int().positive(),
    at: z.string().datetime(),
  }),
]);
export type StreamFrame = z.infer<typeof StreamFrameSchema>;
```

Wire rules:

- Every frame carries `id: <seq>`. `seq` is a single monotonic counter across all sources, held in memory by the collector and reset only on process restart, at which point the server emits a `state` frame for every source before any `signal` frame.
- A reconnecting client sends `Last-Event-ID`; the server replays from the ring buffer starting at `seq + 1`, or, if `seq` is older than the buffer's oldest entry, emits one `state` frame per source and then the full current buffer. It never silently skips a gap.
- **Heartbeat every 20 seconds.** It is how the client distinguishes a quiet feed from a dead one, and it keeps intermediaries from closing an idle connection.
- The server validates every frame against `StreamFrameSchema` before writing it. An invalid frame is dropped and logged; it is never written half-formed.
- The endpoint is read-only and unauthenticated, serves no user data, sets no cookie, and logs no client IP beyond the truncation policy in §6.

### 8.9 Client cache, reconnection and chrome

Client state lives in `apps/web` and is memory-only.

- **Ring buffer**, keyed by `signalKey`, capped at 5,000 entries or the last 72 hours, whichever binds first. Upsert by the rule in §8.5. The cap is a constant in one place and is rendered in the legend as `showing the most recent N signals`.
- **No `localStorage`, no `sessionStorage`, no IndexedDB for signals.** On reload the app renders the committed corpus immediately, then attaches to the stream if the flag is on. The only permitted `sessionStorage` key in the whole product is the once-per-session entry-animation flag (§7).
- **Reconnection** uses the browser's native `EventSource` retry plus the same full-jitter curve enforced client-side through the `retry:` field the server emits. The client never opens a second connection while one is pending.
- **Chrome state machine**, rendered as one chip in the top bar, adjacent to but distinct from the AS-OF chip:

| Ladder state | Chip text | Bloom | Arrival pulse | Legend |
|---|---|---|---|---|
| `LIVE` | `LIVE` plus relative age of newest signal | on | on | live dot |
| `CACHED` | `CACHED, last update 14:05Z` | off | off | struck-through per degraded source |
| `SNAPSHOT` | `SNAPSHOT, 72h corpus to <window end>` | off | off | normal |
| `UNAVAILABLE` | `UNAVAILABLE` plus the reason | off | off | struck-through, marks absent, text alternative still reachable |

In v1 only `SNAPSHOT` and `UNAVAILABLE` are reachable, and the chip is rendered by the same component so M9 adds no new surface.

Replay adds no ladder state. In replay the ladder is pinned to `SNAPSHOT` and a second chip reads `REPLAY, <clock>`. Replay never shows `LIVE`, never enables bloom and never shows a relative age computed from wall-clock time.

### 8.10 Deterministic replay and the committed corpus

Replay is day one, not an afterthought. It is what makes `pnpm dev` with `--network=none` render the whole product, and it is what makes `transform()` unit-testable for sources the build agent cannot reach.

**The record-replay client in `packages/sdk` is the only way any connector touches the network.** A connector that calls `fetch` directly fails `check:dogfood`, which is restricted to `connectors/*` and permits imports of `@exodus/contracts` and `@exodus/sdk` and nothing else.

```ts
// packages/sdk/src/replay-client.ts
export interface CorpusEntry {
  sourceId: string;
  url: string;
  fetchedAt: string;        // ISO-8601
  sha256: string;           // of the UPSTREAM artefact, before any filtering
  httpStatus: number;
  redirectChain: string[];  // record it: a 302 hop is invisible otherwise
  filter: string | null;    // null when the stored body is the upstream artefact verbatim
  bodyPath: string;         // relative to the corpus root
}

export type ClientMode = 'record' | 'replay';

export interface ReplayClient {
  readonly mode: ClientMode;
  /** In replay, resolves from the corpus and never opens a socket. */
  get(url: string, init?: { headers?: Record<string, string> }): Promise<{
    status: number;
    body: Uint8Array;
    entry: CorpusEntry;
  }>;
}
```

Layout and environment:

- Corpus root `./corpus/{sourceId}/{ISO8601}.{ext}`, with `./corpus/manifest.json` holding one `CorpusEntry` per artefact.
- `EXODUS_MODE=replay EXODUS_CLOCK=2026-09-18T21:30:00Z EXODUS_SEED=1` makes every connector read from the corpus, makes `now()` the injected constant and seeds every injected `rand`. The `EXODUS` prefix is retired from env vars along with the name (decision 1); the lexicon module walks env var names.
- **Frame determinism:** same corpus plus same clock plus same seed produces byte-identical `Signal[]` and byte-identical layer props. A test runs the pipeline twice and asserts deep equality of the serialised layer props, not merely of the row count.
- `pnpm live --replay --speed=60` drives the SSE stream from the corpus in recorded order, 60x wall clock, with timestamps derived from the injected clock. This is how the live layer is demonstrated on hotel wifi. The chrome reads `REPLAY`, never `LIVE`.

Corpus contents and budget:

- **72 hours only. GKG excluded.** Sources: `gdelt`, `usgs`, `gdacs`. Nothing else. `bundle:verify` refuses a corpus row from any other source and names the reason on stderr; a deliberately inserted row is a CI test.
- The committed body for GDELT is the **filtered** event rows (CAMEO roots from §8.6, geocoded, projected to the columns `Signal` needs), gzip-compressed, with `filter` describing the reduction and `sha256` recording the upstream artefact so the provenance chain stays honest. Committing 288 raw slots of `export.CSV.zip` would be roughly 26 MB against a 6 MiB budget line and is not permitted.
- One **full, unfiltered** artefact per source lives in `fixtures/` so `transform()` is unit-testable against exactly what the source emits. This is the only place a raw upstream artefact is committed.
- Estimated committed size is roughly 2 MB for GDELT plus well under 1 MB for USGS and GDACS combined, against the 6 MiB corpus line in the Tier A budget. **This is an estimate, not a measurement.** `pnpm snapshot:measure` prints the real compressed bytes and fails CI above the 40 MiB total. If the total exceeds the cap, apply the pre-decided cut ladder in order, starting with corpus 72h to 24h. Do not improvise a different reduction.

### 8.11 Acceptance criteria

| # | Criterion | How it is checked |
|---|---|---|
| 8.1 | `pnpm dev` with `--network=none` renders the incident ribbon from the committed corpus in `SNAPSHOT` chrome | Playwright, networking disabled at the container level |
| 8.2 | No pulse, no emissive blend and no bloom exists in the v1 bundle | AST and built-bundle grep for `bloom`, `emissive`, `additive` in globe layer props; fails on a seeded violation |
| 8.3 | `worstLatency`, `oldestVintage` and `inheritLicence` are unit-tested, including the case of a `modelled` 2023 input joined to a `live` 2026 input yielding `modelled` at vintage 2023 | Vitest |
| 8.4 | The AS-OF chip shows the oldest contributing vintage for the current view | Vitest plus one Playwright assertion |
| 8.5 | `real-time` does not appear adjacent to a stock or flow anywhere in the built bundle | `pnpm check:policy` rule module 2 |
| 8.6 | `SignalSchema`'s generated JSON Schema contains none of the banned person-shaped fields | `pnpm check:policy` rule module 3 over the generated schema |
| 8.7 | A `Signal` cannot be constructed with more than one vertex, and a `geoPrecision: 'adm0'` signal renders hollow with the country-level tooltip | Zod refinement test plus one snapshot test |
| 8.8 | Each of the nine traps in §8.6 is bound by id to a fixture-backed test that fails if the trap stops being true | Test ids `trap.*` enumerated on `/sources` |
| 8.9 | `transform()` output from a fixture equals the rows `snapshot:build` writes for that fixture | Vitest |
| 8.10 | Replay is frame-deterministic: two runs at the same clock and seed produce identical serialised layer props | Vitest |
| 8.11 | `bundle:verify` refuses a corpus entry from a source outside `gdelt`, `usgs`, `gdacs` and names the reason on stderr | CI, with a deliberately inserted row |
| 8.12 | The ribbon is hidden and its legend entry greyed when the year cursor is off the final frame | Playwright |
| 8.13 | M9 only: `nextDelayMs` never exceeds 300,000 ms and never returns a negative value across the full attempt range | Property test with a seeded rand |
| 8.14 | M9 only: killing `pnpm live` walks `LIVE` to `CACHED` to `SNAPSHOT` with the mark count never reaching zero and `LIVE` chrome gone within one reconnect interval | Playwright, sidecar killed mid-session |
| 8.15 | M9 only: a reconnect with `Last-Event-ID` replays exactly the missed frames, and an out-of-range id triggers a full state resync rather than a silent gap | Integration test against the collector |
| 8.16 | M9 only: `apps/live` does not appear in `apps/web`'s import graph | `dependency-cruiser` |

### 8.12 Unverified items and what to do about them

Carry these markers forward; do not launder them into facts.

| Item | Status | What you do |
|---|---|---|
| GDACS site-wide licence | **[UNVERIFIED]** — the RSS feed self-declares public domain; no first-party site-wide statement was located. Third-party CC BY 4.0 claims are unconfirmed | Ship GDACS with `licenseId: 'gdacs-unverified'` and `redistributable: false` until a written statement is obtained. A `redistributable: false` corpus row **fails `bundle:verify`**, so if the statement does not arrive before M9, GDACS ships as a live-only source that is never committed to the corpus, and `/sources` records the open question by name with the date it was checked |
| GDELT `ActionGeo_Type` column, used to set `geoPrecision` | **[UNVERIFIED]** — the column layout of `export.CSV` was not asserted in this research pass | At M9, assert the column layout against the recorded fixture in `packages/connectors/gdelt/schema.ts`. If the column is absent or ambiguous, set `geoPrecision: 'adm0'` for **every** GDELT signal and render them all hollow. Never guess a finer precision than you can prove |
| GDACS event-to-publication latency for tropical cyclones and floods | **[UNVERIFIED]** — minutes for earthquakes, tens of minutes to hours otherwise | Do not state a latency figure in the UI for GDACS. Render the observed `publishedAt` and let the age speak |
| Any exponential freshness decay constant | Author-chosen, no literature | Prefer the plain relative-age label. If you introduce a decay constant at all, badge it in `PARAMETERS.md` as this project's construction with no literature claimed, expose it in config, and never let it modulate opacity, confidence or disagreement |
| Arrow versus GeoJSON parse speedup for large point payloads | **[UNVERIFIED]** rule of thumb | Use typed arrays via `data: {length, attributes}` because it is the stack's documented path, not because of a speed multiple. Do not quote a figure |

---

## 9. Architecture, plugin SDK and repo engineering

This section is the build contract for the repository itself: what exists on disk, what may import what, the exact TypeScript every plugin implements, how the thing runs with no configuration at all, what CI enforces, and what you write down. Implement it before M1 ingest code, because every later milestone lands inside the structure defined here.

Three standing rules govern everything below.

1. **The product is a static site.** `pnpm build` emits a directory. There is no server, no API process, no database, no SSE, no WebSockets in the shipped artefact. `apps/cli` is a build-time tool, not a runtime.
2. **Zero configuration is the default path.** `git clone && pnpm i && pnpm dev` with the network cable out renders the whole product. Every environment variable is optional and has a working default. A missing `.env` is the normal case, not a degraded one.
3. **Three plugin contracts exist: `DataSource`, `Model`, `MapLayer`.** `Indicator`, `Panel` and `Scenario` are named in the source research as contracts and are **not** contracts here — §9.5 states exactly what each becomes instead. Do not create interfaces for them, do not create a loader for them, do not create `packages/ontology`.

---

### 9.1 The repository tree

Create exactly this. A directory not listed here is a scope breach; a file you want to add that has no home here is a signal to re-read §9.16 before creating it.

```
corridor/
├─ package.json                      # root scripts only; no app deps
├─ pnpm-workspace.yaml               # packages/*, packages/connectors/*, apps/*  + catalog:
├─ turbo.json                        # task graph, cache inputs/outputs
├─ tsconfig.base.json                # strict, erasableSyntaxOnly, project refs
├─ biome.json                        # + plugins: tools/grit/*.grit
├─ .dependency-cruiser.cjs           # the import-graph law of §9.3
├─ .nvmrc                            # 24.21.0
├─ .npmrc                            # engine-strict=true, save-exact=true
├─ REUSE.toml                        # per-path SPDX for code AND data
├─ LICENSES/                         # AGPL-3.0-or-later.txt, Apache-2.0.txt, CC-BY-4.0.txt, CC0-1.0.txt
├─ README.md   CONTRIBUTING.md   SECURITY.md   GOVERNANCE.md
├─ DECISIONS.md   SNAPSHOT.md   PARAMETERS.md   BACKLOG.md        # §9.16 — the only narrative docs
├─ CITATION.cff
├─ .github/
│  ├─ workflows/ci.yml               # the single workflow; §9.11
│  ├─ ISSUE_TEMPLATE/harm-report.yml
│  └─ dependabot.yml
├─ tools/
│  ├─ grit/                          # no-clock.grit, no-physical-css.grit
│  └─ perf/globe-orbit.spec.ts       # the committed fps harness used from M0 onward
├─ snapshot/                         # COMMITTED Tier A bundle, written by `pnpm snapshot:build`
│  ├─ manifest.json                  # the only thing the renderer reads for shape/extent
│  ├─ suppression-ledger.json        # append-only; a test asserts append-only
│  ├─ flows.parquet  stocks.parquet  disagreement.parquet
│  ├─ places.parquet  capacity.parquet  demography.parquet  dyads.parquet
│  ├─ h3_r3.parquet  mirror.parquet  asylum_monthly.parquet  incidents.parquet
│  ├─ admin0.geojson.gz  graticule.geojson.gz  centroids.parquet  xwalk.parquet
├─ corpus/                           # 72h replay corpus: gdelt/, usgs/, gdacs/
├─ .cache/                           # gitignored: raw fetch output, recipe-connector output
├─ apps/
│  ├─ web/                           # Vite SPA → the static site
│  │  ├─ index.html  vite.config.ts  size-limit.json
│  │  └─ src/
│  │     ├─ main.tsx  router.tsx  app-shell.tsx
│  │     ├─ routes/   index.tsx place.tsx corridor.tsx headroom.tsx sources.tsx methods.tsx
│  │     ├─ overlays/ palette.tsx globe-alt.tsx provenance.tsx saved-views.tsx
│  │     └─ panels/   *.tsx          # plain components; NOT a plugin kind (§9.5)
│  ├─ cli/                           # ingest, snapshot:*, bundle:verify, gen:connector, check:policy
│  │  └─ src/commands/*.ts
│  └─ placement/                     # §12 only; excluded from `pnpm build`
├─ packages/
│  ├─ contracts/                     # [Apache-2.0] Zod schemas + TS types + generated JSON Schema
│  ├─ sdk/                           # [Apache-2.0] defineSource/defineModel/defineLayer, replay HTTP client, scaffold
│  ├─ kernel/                        # M1–M5, pure; src/clock/ is the ONLY file allowed to touch Date
│  │  └─ golden/                     # committed golden vectors (§9.10)
│  ├─ policy/                        # six rule modules, one walker, verdict fn, suppression
│  ├─ registry/                      # data-driven source/model/layer registry from snapshot/manifest.json
│  ├─ store/                         # timeStore, workingSet, permalink codec
│  ├─ semantic/                      # joins, align(), inheritance, coverage-asymmetry, AttributeCube
│  ├─ ui/                            # <Figure>, provenance popover, tokens, Refusal renderer, locales/
│  ├─ globe/                         # deck.gl layer stack, AttributeCube consumer
│  ├─ placement/                     # §12 only
│  └─ connectors/
│     ├─ _template/                  # [Apache-2.0] what gen:connector copies
│     ├─ gaskin-abel/ abel-cohen/ eurostat-mirror/ eurostat-asylum/ wpp/
│     ├─ wdi-who/ cepii/ ghs-h3/ iom-mm/ naturalearth/ corpus-replay/
│     ├─ undesa-ims/ unhcr/          # recipe connectors: code shipped, bytes never
│     └─ demo-wdi-gdp/               # the worked reference of §9.6, exercised by CI
└─ e2e/                              # Playwright: smoke.spec.ts, offline.spec.ts, a11y.spec.ts, visual.spec.ts
```

Package names are `@exodus/<dir>`; connectors are `@exodus/connector-<id>`. No package, route, env var, asset filename or identifier anywhere contains `exodus`, and the lexicon rule module walks all of them.

---

### 9.2 Package responsibilities

| Package | Licence | Owns | Must never contain |
|---|---|---|---|
| `contracts` | Apache-2.0 | `Fact`, `Result`/`Refusal`, `PluginManifest`, the three plugin interfaces, `SnapshotManifest`, Zod schemas, `z.toJSONSchema()` output at `contracts/schema/*.json` | Runtime deps beyond `zod`; any I/O; any React |
| `sdk` | Apache-2.0 | `defineSource`/`defineModel`/`defineLayer`, the record-replay HTTP client (the only network path a connector has), the `sourceConformance()` test suite, the `gen:connector` template writer | Domain logic; knowledge of any specific source |
| `kernel` | AGPL-3.0-or-later | M1 headroom, M2 differential + bisection, M3/M3b/M3c disagreement, M4 coverage-asymmetry, M5 radiation + CPC | I/O, `fetch`, `Date.now()` outside `src/clock/`, `Math.random()` anywhere |
| `policy` | AGPL-3.0-or-later | six rule modules + one file walker, `verdict()`, suppression + the frozen ledger, the `<Figure>` AST rule | Bespoke CI scripts; anything not importable and unit-testable |
| `registry` | AGPL-3.0-or-later | reads `snapshot/manifest.json` and `packages/connectors/*/package.json#corridor`, exposes sources/models/layers/measures by id | Hard-coded dataset ids, hard-coded corridor counts |
| `store` | AGPL-3.0-or-later | `timeStore {cursor, playing}`, `workingSet`, `savedViews`, permalink encode/decode | Fetching; deck.gl imports |
| `semantic` | AGPL-3.0-or-later | joins, `align()`, latency/licence/vintage inheritance, coverage-asymmetry application, `buildAttributeCube()`, platform-channel merge | Layer styling decisions an author could make |
| `ui` | AGPL-3.0-or-later | `<Figure>`, `<Provenance>`, `<RefusalSentence>`, tokens, `locales/en.json` | Raw numbers outside `<Figure>`; any `fetch` |
| `globe` | AGPL-3.0-or-later | the seven-layer deck.gl stack, camera, picking, post-FX (`fxaa` + `vignette`) | Data access; `transitions` on any data accessor |
| `connectors/*` | per-source | `plan`/`fetch`/`transform`, fixtures, schema assertion, traps + their regression tests | Imports of anything but `@exodus/contracts`, `@exodus/sdk`, `zod` |
| `apps/web` | AGPL-3.0-or-later | six routes, four overlays, composition | Direct connector or store-internal imports |
| `apps/cli` | AGPL-3.0-or-later | `ingest`, `snapshot:build|measure|verify`, `bundle:verify`, `gen:connector`, `check:policy` | Being required at runtime by `apps/web` |

`@duckdb/node-api` (`1.5.5-r.5`) is permitted in **`apps/cli` only**, to write Parquet. Parquet compression is **Snappy**, decided once, here: `@loaders.gl/parquet@4.5.1` reads it in the browser without a codec add-on. Never write zstd Parquet.

---

### 9.3 Dependency rules and how they are enforced

The law, as a table. `→` means "may import"; everything not listed is forbidden.

| From | May import |
|---|---|
| `contracts` | *(nothing but `zod`)* |
| `sdk` | `contracts` |
| `kernel` | `contracts` |
| `policy` | `contracts` |
| `store` | `contracts` |
| `registry` | `contracts` |
| `semantic` | `contracts`, `registry`, `store`, `kernel`, `policy` |
| `ui` | `contracts`, `semantic` |
| `globe` | `contracts`, `semantic` |
| `connectors/*` | `contracts`, `sdk` |
| `apps/web` | `ui`, `globe`, `semantic`, `store`, `contracts` |
| `apps/cli` | everything except `ui`, `globe`, `apps/web` |
| `placement`, `apps/placement` | per §12; **nothing in the list above may import them** |

Three mechanisms, no more:

1. **`pnpm check:deps`** — `dependency-cruiser` over the workspace, config at `.dependency-cruiser.cjs`. Pin the version resolved on the M0 network-on day and record it in `DECISIONS.md`; do not guess a version number now.

```js
// .dependency-cruiser.cjs  (excerpt — write one rule per row of the table above)
module.exports = {
  forbidden: [
    { name: 'kernel-is-pure', severity: 'error',
      from: { path: '^packages/kernel' },
      to:   { pathNot: '^(packages/kernel|packages/contracts)' } },
    { name: 'connectors-dogfood', severity: 'error',
      from: { path: '^packages/connectors' },
      to:   { pathNot: '^(packages/connectors/[^/]+|packages/contracts|packages/sdk|node_modules/zod)' } },
    { name: 'no-placement-leak', severity: 'error',
      from: { pathNot: '^(packages/placement|apps/placement)' },
      to:   { path: '^packages/placement' } },
    { name: 'render-layer-knows-no-source', severity: 'error',
      from: { path: '^packages/(ui|globe)' },
      to:   { path: '^packages/(connectors|store/src/internal)' } },
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
  ],
  options: { tsConfig: { fileName: 'tsconfig.base.json' }, doNotFollow: { path: 'node_modules' } },
};
```

2. **`pnpm check:dogfood`** — restricted to `packages/connectors/*` only. It reads each connector's `package.json` and fails unless `dependencies` is a subset of `{"@exodus/contracts", "@exodus/sdk", "zod"}`. This catches what the import graph cannot: a connector that reaches for `axios` or `papaparse`.
3. **pnpm strictness** — `.npmrc` sets `engine-strict=true` and `save-exact=true`; workspace deps use `workspace:*`; all third-party versions live in the `catalog:` block of `pnpm-workspace.yaml` so `apache-arrow`, `zod` and `deck.gl` cannot skew between packages.

*Accept:* a seeded `import { arcLayer } from '@exodus/globe'` inside `packages/kernel/src/headroom.ts` fails `pnpm check:deps` by rule name; a seeded `"papaparse"` in a connector's `package.json` fails `pnpm check:dogfood` naming the package and the offending dependency.

---

### 9.4 The plugin contracts

All of the following is real, compiling TypeScript under `--strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --verbatimModuleSyntax --erasableSyntaxOnly`. **No `enum`, no `namespace`, no parameter properties** — TS 7.0.2 raises TS1294. Closed sets are `as const` arrays plus a derived union, always.

#### 9.4.1 Primitives (`packages/contracts/src/primitives.ts`)

```ts
import type { ZodType } from 'zod';

export const API_VERSION = '1.0';

export type Iso3 = string & { readonly __brand: 'Iso3' };
export type SourceId = string & { readonly __brand: 'SourceId' };
/** ISO-8601 date, YYYY-MM-DD. */
export type IsoDate = string & { readonly __brand: 'IsoDate' };

export const CADENCES = ['sub-hour', 'daily', 'monthly', 'quarterly',
  'annual', 'quinquennial', 'frozen'] as const;
export type Cadence = (typeof CADENCES)[number];

export const LATENCY_CLASSES = ['live', 'daily', 'periodic', 'annual',
  'modelled', 'projected'] as const;
export type LatencyClass = (typeof LATENCY_CLASSES)[number];

export const ESTIMATE_KINDS = ['observed', 'observed_flagged', 'modelled',
  'extrapolated', 'assumed_zero'] as const;
export type EstimateKind = (typeof ESTIMATE_KINDS)[number];

export const PERIOD_TYPES = ['annual', '5yr', 'monthly', 'quarterly'] as const;
export type PeriodType = (typeof PERIOD_TYPES)[number];

/** One row of the fact table. Column names map 1:1 to snake_case in Parquet.
 *  `destIso3 === null` marks a place-level measure (capacity, demography, coverage);
 *  a corridor fact has both endpoints and, for the spine, origin !== dest. */
export interface Fact {
  readonly originIso3: Iso3;
  readonly destIso3: Iso3 | null;
  readonly year: number;
  readonly periodType: PeriodType;
  readonly sex: 'm' | 'f' | 't';
  readonly ageBand: string | null;
  readonly measureCode: string;
  readonly value: number;
  readonly sourceId: SourceId;
  readonly vintageDate: IsoDate;
  readonly latencyDays: number;
  readonly estimateKind: EstimateKind;
  readonly obsFlag: string | null;
  readonly confStatus: string | null;
  readonly ciLow: number | null;
  readonly ciHigh: number | null;
  /** Mandatory on every row. A row missing either fails ingest. */
  readonly licenseId: string;
  readonly redistributable: boolean;
}
```

#### 9.4.2 Results and refusals (`packages/contracts/src/result.ts`)

```ts
export const REFUSAL_CODES = [
  'NoServiceStockData', 'NonMonotoneBisection', 'NoSharedPeriodGrid',
  'NoMirrorPair', 'InsufficientHistory',
  // §12 extends the union to exactly eight, then closes it again. No ninth.
  'NoConsentRecord', 'NoPreferenceCoverage', 'NoLegalBasis',
] as const;
export type RefusalCode = (typeof REFUSAL_CODES)[number];

export interface Refusal {
  readonly kind: 'refusal';
  readonly code: RefusalCode;
  /** A sentence, rendered verbatim. Never a number, never an em-dash alone. */
  readonly reason: string;
  readonly sourceIds: readonly SourceId[];
}
export interface Ok<T> { readonly kind: 'ok'; readonly value: T }
export type Result<T> = Ok<T> | Refusal;

export const ok = <T>(value: T): Ok<T> => ({ kind: 'ok', value });
export const refuse = (
  code: RefusalCode, reason: string, sourceIds: readonly SourceId[] = [],
): Refusal => ({ kind: 'refusal', code, reason, sourceIds });
export const isRefusal = <T>(r: Result<T>): r is Refusal => r.kind === 'refusal';
```

#### 9.4.3 Manifest and snapshot (`packages/contracts/src/manifest.ts`)

```ts
export const CAPABILITIES = ['net:https', 'fs:corpus', 'kernel', 'layer'] as const;
export type Capability = (typeof CAPABILITIES)[number];

export interface PluginManifest {
  /** reverse-DNS, e.g. "org.corridor.eurostat-mirror" */
  readonly id: string;
  /** Hard major gate. A mismatch refuses BY NAME and never throws. */
  readonly apiVersion: `${number}.${number}`;
  readonly version: string;
  readonly license: {
    readonly spdx: string;
    readonly url: string;
    readonly attribution: string;
    readonly redistributable: boolean | 'unknown';
  };
  readonly capabilities: readonly Capability[];
}

/** snapshot/manifest.json. The renderer reads shape and extent ONLY from here —
 *  never from a dataset's name, never from a constant in packages/globe. */
export interface SnapshotManifest {
  readonly schemaVersion: 1;
  readonly builtAt: IsoDate;
  readonly years: readonly number[];              // e.g. 1990..2023 — length drives the flipbook
  readonly corridorCount: number;                 // e.g. 12000 — drives buffer allocation
  readonly animatedAttributes: readonly string[]; // e.g. ['flow_per_capita','disagreement','coverage']
  readonly periodGrid: readonly { readonly id: string; readonly years: readonly number[] }[];
  readonly tables: readonly {
    readonly name: string;
    readonly path: string;
    readonly rows: number;
    readonly bytesCompressed: number;
    readonly sha256: string;
    readonly sourceIds: readonly SourceId[];
  }[];
  readonly sources: readonly {
    readonly sourceId: SourceId;
    readonly manifest: PluginManifest;
    readonly vintageDate: IsoDate;
    readonly latencyDays: number;
    readonly cadence: Cadence;
    readonly latencyClass: LatencyClass;
    readonly plannedUrls: readonly string[];      // rendered verbatim on /sources
    readonly traps: readonly { readonly id: string; readonly body: string }[];
  }[];
  readonly excluded: readonly {
    readonly sourceId: SourceId; readonly reason: string; readonly resolvedOn: IsoDate | null;
  }[];
}
```

`sha256` per table is advisory provenance printed on `/sources`; the app does **not** hard-fail boot on a hash mismatch — a static site that refuses to render because a fork re-ran `snapshot:build` is a worse failure than a stale hash. The hash gate lives in `pnpm snapshot:verify`, which CI runs.

#### 9.4.4 `DataSource`

```ts
export interface FetchPlan {
  readonly planId: string;        // stable; part of the cache key
  readonly url: string;           // rendered verbatim on /sources
  readonly method: 'GET';
  readonly headers: Readonly<Record<string, string>>;
  readonly expectedBytes: number | null;
  readonly note: string;          // e.g. "chunked by year to stay under the 5,000,000-cell cost ceiling"
}

export interface RawArtifact {
  readonly planId: string;
  readonly contentType: string;
  readonly bytes: Uint8Array;
  readonly sha256: string;
  readonly httpStatus: number;
  readonly redirectChain: readonly string[];
  readonly fetchedAt: IsoDate;
}

export interface ReplayClient {
  /** The ONLY network path a connector has. In 'replay' mode it reads corpus/
   *  or fixtures/ and never opens a socket; in 'record' it writes both. */
  get(plan: FetchPlan, signal: AbortSignal): Promise<RawArtifact>;
}

export interface IngestCtx {
  readonly mode: 'replay' | 'record' | 'live';
  readonly http: ReplayClient;
  readonly now: () => IsoDate;    // frozen in replay mode
  readonly signal: AbortSignal;
  /** Allowlisted, already-parsed env. A connector never touches process.env. */
  readonly env: Readonly<Record<string, string | undefined>>;
}

export interface DataSource<T> {
  readonly manifest: PluginManifest;
  readonly schema: ZodType<T>;
  readonly cadence: Cadence;
  readonly latencyClass: LatencyClass;
  readonly coverage: { readonly iso3: readonly Iso3[]; readonly years: readonly [number, number] };
  readonly traps: readonly { readonly id: string; readonly body: string }[];
  /** SYNCHRONOUS and pure: /sources renders these URLs at build time without fetching. */
  plan(ctx: IngestCtx): readonly FetchPlan[];
  fetch(plan: FetchPlan, ctx: IngestCtx): Promise<RawArtifact>;
  /** PURE. No network, no clock, no RNG. Asserts its own schema and throws
   *  SchemaDriftError (observed vs expected columns) on drift. */
  transform(raw: RawArtifact): readonly Fact[];
}
```

`plan()` being synchronous is load-bearing: `/sources` must render "the exact URLs the system would fetch" from a build-time call with the network off.

#### 9.4.5 `Model`

```ts
export interface AssumptionSpec {
  readonly key: string;
  readonly label: string;
  readonly value: number | string | boolean;
  readonly unit: string | null;
  readonly provenance: string;     // citation or "this project's construction"
  readonly placeholder: boolean;   // MUST be false for everything that ships in v1
}

export interface FactQuery {
  readonly measureCode?: string;
  readonly originIso3?: Iso3;
  readonly destIso3?: Iso3 | null;
  readonly year?: number;
  readonly sourceId?: SourceId;
}

/** Read-only view over the snapshot handed to every model. No fetching. */
export interface WorldView {
  readonly manifest: SnapshotManifest;
  facts(q: FactQuery): readonly Fact[];
  measure(iso3: Iso3, measureCode: string, year: number): Fact | null;
  series(iso3: Iso3, measureCode: string): readonly Fact[];
}

export interface Model<I, O> {
  readonly manifest: PluginManifest;
  readonly id: string;
  readonly inputs: ZodType<I>;
  readonly outputs: ZodType<O>;
  readonly assumptions: readonly AssumptionSpec[];
  /** PURE and deterministic in (inputs, world, seed). May return Refusal. */
  run(inputs: I, world: WorldView, seed: number): Result<O>;
}
```

#### 9.4.6 `MapLayer`, and the type-level proof that authority is not authorable

```ts
export const AUTHOR_CHANNELS = ['width', 'color', 'elevation', 'radius'] as const;
export type AuthorChannel = (typeof AUTHOR_CHANNELS)[number];

/** What encode() may return. Note what is absent. */
export interface LayerSpec {
  readonly geometry: 'arc' | 'choropleth' | 'h3' | 'point';
  readonly positions: Float32Array;
  readonly indices: Uint32Array | null;
  readonly channels: Readonly<Record<AuthorChannel, Float32Array>>;
  readonly pickingIds: Uint32Array;
}

export interface MapLayer {
  readonly manifest: PluginManifest;
  readonly id: string;
  readonly geometry: LayerSpec['geometry'];
  /** Cannot set opacity, dashArray, latencyClass or estimate_kind styling:
   *  semantic/merge-platform-channels.ts computes those and merges AFTER encode(). */
  encode(facts: readonly Fact[]): LayerSpec;
}

// --- type-level test, lives in packages/contracts/src/layer.type-test.ts ---
type PlatformOwned = 'opacity' | 'dashArray' | 'hatch' | 'latencyClass' | 'estimateKind';
type HasNone<T> = Extract<keyof T, PlatformOwned> extends never ? true : never;
const _specIsClean: HasNone<LayerSpec> = true;
const _channelsAreClean: HasNone<LayerSpec['channels']> = true;
void _specIsClean; void _channelsAreClean;
```

`semantic` owns the merge:

```ts
// packages/semantic/src/merge-platform-channels.ts
export interface RenderableLayer extends LayerSpec {
  readonly opacity: Float32Array;    // = min(C_origin, C_dest), the M4 coverage-asymmetry score
  readonly dashArray: Float32Array;  // = M3 disagreement d_p, step-held within each period
}
export declare function mergePlatformChannels(
  spec: LayerSpec, facts: readonly Fact[], world: WorldView,
): RenderableLayer;
```

*Accept:* `packages/contracts/src/layer.type-test.ts` compiles; a seeded `opacity: new Float32Array()` added to a `LayerSpec` literal in any layer fails `pnpm typecheck` with TS2353.

**Contract-lands rule:** a contract ships only with ≥2 independent implementations at merge. `DataSource` has a bulk CSV (`gaskin-abel`), a JSON-stat REST source (`eurostat-mirror`) and a recipe connector (`unhcr`). `MapLayer` has arc, choropleth and h3. `Model` has five. Nothing else gets an interface.

---

### 9.5 What is deliberately *not* a plugin contract

The source research names six plugin kinds. Three of them do not exist here, and you must not create them. Each has a concrete replacement.

| Named in research | Status | What it is instead |
|---|---|---|
| `Indicator` | **Not a contract** | A `measureCode` string plus a row in `packages/registry/src/measures.ts`: `{ id, unit, direction, domain, labelKey, decimals }`. Derived quantities are kernel functions (M1–M5), not plugins. There is no `compute()`, no `dependsOn`, no topological sort, no normalisation config. The `labour_absorption_gap` example in the research **is negative for essentially every country and has two undefined terms — never implement it.** |
| `Panel` | **Not a contract** | Ordinary React components in `apps/web/src/panels/`, composed statically by each route. No slots, no runtime registration, no `defaultSize`. |
| `Scenario` | **Not a contract** | A permalink codec in `packages/store/src/permalink.ts`. `base64url(deflate-raw(json))` via `CompressionStream` (gzip/deflate/deflate-raw only — **not zstd**), Zod-validated on decode, budget ≤2 KB, carrying year cursor, camera, layer visibility, working set and the headroom assumption set. A permalink, not a scenario engine. |
| `Ontology` package | **Not built** | The crosswalk is `snapshot/xwalk.parquet` — a versioned table with validity date ranges — read through `registry`. No `packages/ontology`, no `/o/{type}/{id}` route generator. |

```ts
// packages/store/src/permalink.ts
export interface Permalink {
  readonly y: number;                       // year cursor
  readonly cam: readonly [number, number, number]; // lon, lat, zoom
  readonly layers: readonly string[];
  readonly ws: readonly string[];           // working set: place / corridor ids
  readonly hr: Readonly<Record<string, number>> | null; // headroom assumption set
}
export declare function encodePermalink(p: Permalink): Promise<string>;
export declare function decodePermalink(s: string): Promise<Permalink | null>; // null = malformed, never throws
```

---

### 9.6 The worked reference plugin, end to end: `demo-wdi-gdp`

This is the connector CI generates, ingests and snapshots at M8 to prove the seam. Implement it exactly; it is both the reference and a test fixture. Ten files, zero core edits.

**(1) `packages/connectors/demo-wdi-gdp/package.json`** — discovery is a glob over this file's `corridor` field.

```json
{
  "name": "@exodus/connector-demo-wdi-gdp",
  "version": "0.1.0",
  "license": "Apache-2.0",
  "type": "module",
  "main": "./src/index.ts",
  "corridor": { "kind": "datasource", "id": "demo-wdi-gdp", "apiVersion": "1.0" },
  "dependencies": {
    "@exodus/contracts": "workspace:*",
    "@exodus/sdk": "workspace:*",
    "zod": "catalog:"
  },
  "scripts": { "test": "vitest run" }
}
```

**(2) `src/endpoints.ts`** — every URL the connector will ever touch, in one file, so a breakage is one edit.

```ts
/** [UNVERIFIED] The exact WDI v2 path was not verified in research; only
 *  "WDI v2, no key, lastupdated 2026-07-13, 265 rows" is confirmed.
 *  M0 ACTION, network on: resolve this URL, paste the first 200 bytes of the
 *  response into fixtures/, record the resolved URL and HTTP status in
 *  DECISIONS.md. If it does not resolve, swap the demo connector to WHO GHO
 *  (https://ghoapi.azureedge.net/api, verified) and record that swap.
 *  Everything downstream is fixture-driven and unaffected either way. */
export const WDI_BASE = 'https://api.worldbank.org/v2';
export const INDICATOR = 'NY.GDP.PCAP.PP.KD'; // constant 2021 international $
export const PAGE_SIZE = 1000;
```

**(3) `src/schema.ts`** — the schema *is* the interface; drift fails loudly.

```ts
import { z } from 'zod';

export const WdiRow = z.object({
  countryiso3code: z.string().length(3),
  date: z.string().regex(/^\d{4}$/),
  value: z.number().nullable(),
  indicator: z.object({ id: z.string() }),
});
export const WdiPage = z.tuple([
  z.object({ page: z.number(), pages: z.number(), total: z.number() }),
  z.array(WdiRow),
]);
export type WdiPage = z.infer<typeof WdiPage>;

export const EXPECTED_KEYS = ['countryiso3code', 'date', 'value', 'indicator'] as const;
```

**(4) `src/index.ts`** — the whole plugin.

```ts
import { z } from 'zod';
import {
  defineSource, SchemaDriftError, decodeUtf8, sha256Hex,
} from '@exodus/sdk';
import type {
  Fact, FetchPlan, IngestCtx, Iso3, RawArtifact, SourceId,
} from '@exodus/contracts';
import { WdiPage, EXPECTED_KEYS } from './schema.js';
import { WDI_BASE, INDICATOR, PAGE_SIZE } from './endpoints.js';

const SOURCE_ID = 'demo-wdi-gdp' as SourceId;
const PAGES = [1, 2, 3] as const; // 265 country rows + aggregates fit in three pages

export default defineSource<WdiPage>({
  manifest: {
    id: 'org.corridor.demo-wdi-gdp',
    apiVersion: '1.0',
    version: '0.1.0',
    license: {
      spdx: 'CC-BY-4.0',
      url: 'https://datacatalog.worldbank.org/public-licenses',
      attribution: 'World Bank, World Development Indicators',
      redistributable: true,
    },
    capabilities: ['net:https'],
  },
  schema: WdiPage,
  cadence: 'annual',
  latencyClass: 'annual',
  coverage: { iso3: [], years: [1990, 2024] }, // [] = global; registry expands from xwalk
  traps: [{
    id: 'wdi-aggregate-rows',
    body: 'WDI returns regional and income-group aggregates in the same array as countries. '
        + 'Rows whose countryiso3code is absent from the ISO3 crosswalk are aggregates and '
        + 'are dropped at transform. Summing the raw array double-counts every country.',
  }],

  plan(_ctx: IngestCtx): readonly FetchPlan[] {
    return PAGES.map((page) => ({
      planId: `wdi-${INDICATOR}-p${page}`,
      url: `${WDI_BASE}/country/all/indicator/${INDICATOR}?format=json&per_page=${PAGE_SIZE}&page=${page}`,
      method: 'GET' as const,
      headers: { accept: 'application/json' },
      expectedBytes: null,
      note: `page ${page} of ${PAGES.length}; paginated because per_page caps at ${PAGE_SIZE}`,
    }));
  },

  fetch(plan: FetchPlan, ctx: IngestCtx): Promise<RawArtifact> {
    return ctx.http.get(plan, ctx.signal); // the ONLY network call in this package
  },

  transform(raw: RawArtifact): readonly Fact[] {
    const parsed: unknown = JSON.parse(decodeUtf8(raw.bytes));
    const result = WdiPage.safeParse(parsed);
    if (!result.success) {
      const observed = Array.isArray(parsed) && Array.isArray((parsed as unknown[])[1])
        ? Object.keys(((parsed as unknown[])[1] as object[])[0] ?? {})
        : [];
      throw new SchemaDriftError(SOURCE_ID, {
        expected: [...EXPECTED_KEYS], observed, detail: z.prettifyError(result.error),
      });
    }
    const [, rows] = result.data;
    const facts: Fact[] = [];
    for (const row of rows) {
      if (row.value === null) continue;              // a gap is a gap; never 0, never forward-filled
      if (row.countryiso3code.trim() === '') continue; // aggregate row — see trap wdi-aggregate-rows
      facts.push({
        originIso3: row.countryiso3code as Iso3,
        destIso3: null,                              // place-level measure
        year: Number(row.date),
        periodType: 'annual',
        sex: 't',
        ageBand: null,
        measureCode: 'gdp_pc_ppp_kd_2021',
        value: row.value,
        sourceId: SOURCE_ID,
        vintageDate: '2026-07-13' as Fact['vintageDate'],
        latencyDays: 365,
        estimateKind: 'observed',
        obsFlag: null, confStatus: null, ciLow: null, ciHigh: null,
        licenseId: 'CC-BY-4.0',
        redistributable: true,
      });
    }
    if (facts.length === 0) throw new SchemaDriftError(SOURCE_ID, {
      expected: [...EXPECTED_KEYS], observed: [], detail: 'zero rows after filtering',
    });
    return facts;
  },
});

export { SOURCE_ID, sha256Hex };
```

**(5) `fixtures/wdi-p1.json`, `p2`, `p3`** plus **`fixtures/index.json`** — the recorded envelope the replay client reads:

```json
[{ "planId": "wdi-NY.GDP.PCAP.PP.KD-p1", "file": "wdi-p1.json",
   "url": "…as planned…", "fetchedAt": "2026-09-19", "sha256": "…",
   "httpStatus": 200, "redirectChain": [] }]
```

**(6) `src/transform.test.ts`** — offline, and it must fail for the right reason:

```ts
import { describe, expect, it } from 'vitest';
import { fixtureArtifact, sourceConformance } from '@exodus/sdk/testing';
import source, { SOURCE_ID } from './index.js';

describe(SOURCE_ID, () => {
  sourceConformance(source);                               // shared suite, §9.10

  it('drops aggregate rows and null values', () => {
    const facts = source.transform(fixtureArtifact('wdi-p1.json'));
    expect(facts.every((f) => f.originIso3.length === 3)).toBe(true);
    expect(facts.every((f) => Number.isFinite(f.value))).toBe(true);
    expect(facts.every((f) => f.licenseId !== '' && f.redistributable === true)).toBe(true);
  });

  it('names observed vs expected columns on schema drift', () => {
    const broken = fixtureArtifact('wdi-p1.json', { mutate: (s) => s.replaceAll('"value"', '"val"') });
    expect(() => source.transform(broken)).toThrowError(/expected.*value.*observed.*val/s);
  });

  it('plan() is pure and needs no network', () => {
    expect(source.plan({} as never).map((p) => p.url)).toMatchSnapshot();
  });
});
```

**(7) `traps.test.ts`** binds the trap copy to the fixture: it asserts that `fixtures/wdi-p1.json` still contains at least one blank-`countryiso3code` row. If the upstream stops emitting aggregates, the trap stops being true and CI fails — which is what §11 of the design requires of every trap paragraph.

**The full loop CI runs at M8:**

```bash
pnpm gen:connector demo-wdi-gdp          # scaffolds files 1–6 from packages/connectors/_template
pnpm ingest --only demo-wdi-gdp          # replay mode, reads fixtures/, writes .cache/raw/demo-wdi-gdp/
pnpm snapshot:build --from-fixtures      # appends a table + a manifest.sources[] entry
git status --porcelain | grep -Ev '^\?\? (packages/connectors/demo-wdi-gdp/|snapshot/)' && exit 1
```

*Accept:* the sequence exits 0 and the `git status` filter finds **zero** paths outside `packages/connectors/demo-wdi-gdp/` and `snapshot/`.

Reference implementations for the other two contracts, for shape:

```ts
// packages/kernel/src/models/radiation.ts  (M5)
import { defineModel } from '@exodus/sdk';
export default defineModel({ /* id, inputs, outputs, assumptions */ }, (inputs, world, _seed) => { /* … */ });

// packages/globe/src/layers/corridor-path.ts  (one of three MapLayer impls)
import { defineLayer } from '@exodus/sdk';
export default defineLayer({ id: 'corridor-path', geometry: 'arc' }, (facts) => ({
  geometry: 'arc', positions: tessellate(facts, 32), indices: null,
  channels: { width: perCapitaWidth(facts), color: directionColor(facts),
              elevation: new Float32Array(0), radius: new Float32Array(0) },
  pickingIds: idsOf(facts),
}));
```

---

### 9.7 Registry and discovery

`packages/registry` builds three maps at module load and exposes them by id:

- **sources** — glob `packages/connectors/*/package.json`, read `corridor.kind === 'datasource'`, dynamic-import the entry, **refuse by name** (never throw) if `manifest.apiVersion` major ≠ `API_VERSION` major, logging `plugin <id> declares apiVersion X, core is 1.0 — not loaded`.
- **models** — a static array in `packages/kernel/src/models/index.ts`. Models are in-tree in v1; third parties implement against the published `Model` interface.
- **layers** — a static array in `packages/globe/src/layers/index.ts`, filtered by what `snapshot/manifest.json` actually contains.

The web app never imports a connector. It reads `snapshot/manifest.json` + Parquet tables. Deleting a connector directory must leave the app booting with reduced coverage and a `/sources` row moved to `excluded[]` — never a crash.

---

### 9.8 Configuration and environment

**It runs with none.** Every variable below is optional; the defaults are the shipped product. There is no `.env.example` containing anything required, no secret, no API key, anywhere in the repo — none of the Tier A sources need one.

| Variable | Values | Default | Effect |
|---|---|---|---|
| `EXODUS_MODE` | `replay` \| `record` \| `live` | `replay` | Replay reads `corpus/` + connector `fixtures/` and opens no socket. `record` and `live` are only legal under `apps/cli`. |
| `EXODUS_CLOCK` | ISO-8601 instant | `manifest.builtAt` | Freezes `IngestCtx.now()` and the AS-OF chip for deterministic tests. |
| `EXODUS_SNAPSHOT_DIR` | path | `./snapshot` | Where the CLI writes and the dev server serves the bundle from. |
| `EXODUS_BASE_PATH` | url path | `/` | Static-host sub-path; becomes Vite `base`. |
| `EXODUS_LOCALE` | BCP-47 | `en` | Only `en` ships in v1 (§9.14). |
| `EXODUS_CORRIDOR_LIMIT` | integer | `manifest.corridorCount` | M0 escape hatch for the 12,000 → 6,000 → 4,000 ladder. Logged on screen when it overrides the manifest. |
| `EXODUS_PERF_TRACE` | `0` \| `1` | `0` | Emits `window.__corridorFrames` for the Playwright fps harness. |

Rules, all enforced:

1. The prefix is `EXODUS_`. `EXODUS_*` is a lexicon violation and fails `pnpm check:policy`.
2. `process.env` / `import.meta.env` may be read **only** in `packages/sdk/src/env.ts` and `apps/cli/src/env.ts`. Everything else receives values as arguments. Enforced by a Biome GritQL plugin in `tools/grit/`.
3. Both env modules Zod-parse into a frozen typed object and **fail fast on an invalid value** (`EXODUS_MODE=repaly` exits 1 naming the variable, the bad value and the legal set). An *unknown* `EXODUS_*` variable prints one warning and continues — a typo must not brick a clone.
4. The browser build inlines only `EXODUS_BASE_PATH`, `EXODUS_LOCALE` and `EXODUS_PERF_TRACE`. Any other variable reaching the client bundle fails `bundle:verify`.
5. Data shape is configuration too, and it lives in `snapshot/manifest.json` — never in a TypeScript constant. `corridorCount`, `years` and `animatedAttributes` are read, never assumed.

---

### 9.9 Scripts, task graph and workspace

Root `package.json` scripts, verbatim names — CI, docs and every acceptance criterion reference these and nothing else:

| Script | Runs | Gate |
|---|---|---|
| `pnpm dev` | `turbo run dev --filter=@exodus/web` | Boots from `snapshot/` with zero network requests |
| `pnpm build` | `turbo run build --filter=@exodus/web` | Static output at `apps/web/dist/`; **excludes `apps/placement`** |
| `pnpm typecheck` | `tsc -b --noEmit` | Zero errors across project references |
| `pnpm lint` | `biome ci .` | Zero warnings |
| `pnpm test` | `vitest run --coverage` | See §9.10 thresholds |
| `pnpm test:e2e` | `playwright test` | §9.11 offline + a11y + visual |
| `pnpm check:deps` | `depcruise --config .dependency-cruiser.cjs` | §9.3 |
| `pnpm check:dogfood` | `tsx apps/cli/src/commands/dogfood.ts` | `connectors/*` deps allowlist |
| `pnpm check:policy` | `corridor policy` (one binary, six rule modules, one walk) | Non-zero on a seeded violation of each module |
| `pnpm ingest [--only <id>]` | plan → fetch → transform → `.cache/raw/<id>/<planHash>.json` | Schema drift is a named failure |
| `pnpm snapshot:build [--from-fixtures]` | `.cache` → Parquet + `manifest.json` | Every row carries `license_id` + `redistributable` |
| `pnpm snapshot:measure` | prints per-table compressed bytes + total | **Fails above 40 MiB**; then apply the §4 cut ladder in order |
| `pnpm snapshot:verify` | re-hashes tables against the manifest | Hash + coverage mismatch fails |
| `pnpm bundle:verify` | scans `snapshot/` + `apps/web/dist/` | Refuses non-redistributable rows, third-party origins, leaked env |
| `pnpm gen:connector <id>` | copies `_template` | New connector compiles and passes `sourceConformance` immediately |
| `pnpm data:full` | fetches the Tier B release asset into `.cache/` | Idempotent; never required for `dev` |
| `pnpm golden:accept` | rewrites `packages/kernel/golden/*` and prints the diff | Refuses without `--reason` |
| `pnpm verify` | `lint && typecheck && check:deps && check:dogfood && check:policy && test` | The one command a contributor runs |

`turbo.json` — cache correctness matters more than speed; get `inputs` right:

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build":    { "dependsOn": ["^build"], "outputs": ["dist/**"], "inputs": ["src/**", "package.json", "../../snapshot/manifest.json"] },
    "test":     { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "lint":     { "outputs": [] },
    "typecheck":{ "dependsOn": ["^build"], "outputs": [] },
    "ingest":   { "cache": true, "inputs": ["src/**", "fixtures/**"], "outputs": ["../../.cache/raw/**"] }
  },
  "globalEnv": ["EXODUS_MODE", "EXODUS_CLOCK", "EXODUS_BASE_PATH", "EXODUS_LOCALE"]
}
```

`turbo run ingest --affected --filter=./packages/connectors/*` selects the **intersection** of "changed on this branch" and "is a connector", so touching one connector re-ingests one source.

`pnpm-workspace.yaml` pins every shared dependency once, in the catalog — six packages share `apache-arrow`, and a skew between them is a silent memory-layout bug:

```yaml
packages: ['packages/*', 'packages/connectors/*', 'apps/*']
catalog:
  zod: 4.6.5
  apache-arrow: 21.2.0
  h3-js: 4.5.0
  deck.gl: 9.4.0
  '@luma.gl/core': 9.4.1
  '@luma.gl/effects': 9.4.1
  '@loaders.gl/parquet': 4.5.1
  react: 19.3.0
  vite: 8.3.0
  '@tanstack/react-router': 1.170.38
```

Toolchain pins, exact, no carets: pnpm 12.4.2 · Turborepo 2.11.2 · Node 24.21.0 LTS (`.nvmrc` + `engines`) · TypeScript 7.0.2 · Biome 2.5.14 · Vitest 5.0.1 · Playwright 1.63.0 · `fast-check` 4.10.1 · `size-limit` 14.0.0 · `@duckdb/node-api` 1.5.5-r.5 (CLI only). Do **not** install: MapLibre, `pmtiles`, `@deck.gl/maplibre`, `@geoarrow/deck.gl-geoarrow`, `@duckdb/duckdb-wasm`, `kepler.gl`, `highs` (outside `packages/placement`), ESLint, Prettier, Tailwind. Styling is CSS Modules over the token set in §7 of the design.

---

### 9.10 Testing strategy, layer by layer

| Layer | Tool | What is tested | Threshold |
|---|---|---|---|
| `contracts` | Vitest project `contracts` | Zod round-trip for every schema; `z.toJSONSchema()` output committed at `contracts/schema/*.json` and diff-checked; the `LayerSpec` type test compiles | Any schema change without a regenerated JSON Schema fails |
| `kernel` | Vitest + `fast-check` | **Golden files** (below); purity; determinism `run(x,w,s)` deep-equals `run(x,w,s)`; every `Refusal` path | **≥95% lines**, 100% of `REFUSAL_CODES` exercised |
| `semantic` | Vitest | `buildAttributeCube` against a synthetic 3-corridor × 4-year fixture **and** against the real snapshot through the same code path; `align()` default `"none"` leaves a hole; latency/licence/vintage inheritance takes worst/oldest/AND | Buffer byte-length and quantisation asserted exactly |
| `connectors/*` | Vitest project `connectors` | `sourceConformance()` + per-source `transform` fixtures + trap regression tests, all with the network off | Every connector; a connector without a fixture does not merge |
| `policy` | Vitest | Six rule modules against seeded violations and against clean text (no false positives on `/methods` copy) | `pnpm check:policy` exits non-zero once per module |
| `store` | Vitest | Permalink round-trip, ≤2 KB budget, malformed input returns `null` | Property-tested over random valid `Permalink`s |
| `ui` | Vitest + Testing Library | `<Figure>` renders `—` + badge for a missing value and never `0`; `<RefusalSentence>` renders prose; the `<Figure>` AST rule fails a seeded violation | Snapshot of the refusal sentences |
| `globe` / app | Playwright 1.63.0 | Smoke, offline, fps, a11y, visual | §9.11–§9.12 |

**Golden-file tests for the models.** `packages/kernel/golden/` holds committed JSON vectors; each test loads the vector, runs the model, and compares with an explicit tolerance. Minimum set:

| Golden file | Source of truth | Tolerance |
|---|---|---|
| `wpp-table8-scenario-v.json` | UN ESA/P/WP.160 Table 8 Scenario V — EU 153.6M, Japan 94.8M, Germany 40.5M, USA 44.9M, Italy 35.1M | ±0.1M absolute |
| `wpp-table8-scenario-vi.json` | Scenario VI incl. Republic of Korea 5.149 billion, plus the table's own "unrealistic" footnote string | exact string, ±0.001bn |
| `psr-bisection.json` | Bisection convergence: ≤20 iterations at 1e-4 rel tol, plus a 65+-weighted profile that must return `Refusal('NonMonotoneBisection')` | iteration count asserted ≤20 |
| `headroom-liebig.json` | M1 over `K_stock` for 8 named countries, incl. one negative (service deficit) and one with 2 indicators → `Refusal('NoServiceStockData')` | ±1e-6 relative; `bindingIndicator` exact |
| `disagreement-period-grid.json` | M3 on six periods; asserts the series is piecewise-constant within each period and that a corridor-year outside the shared grid returns `Refusal('NoSharedPeriodGrid')` | exact step boundaries |
| `radiation-cpc.json` | M5 CPC on a held-out year beside the Robinson & Dilkina 0.16 reference | ±0.005 |
| `coverage-asymmetry.json` | M4 `C` for 10 countries; Gulf/China/Russia/Iran strictly below Germany/Sweden | ordering asserted |
| `wpp-normalisation.json` | `SRB/100`, `ASFR/1000`, `population×1000`; asserts the male birth share lands near 0.515, **not 0.991** | ±0.002 |

Goldens are never rewritten by `vitest -u`. `pnpm golden:accept --reason "<text>"` is the only path; it prints a per-country diff and appends an entry to `DECISIONS.md`. A kernel formula change without a golden diff is a review failure.

**Purity, mechanically.** `packages/kernel/vitest.setup.ts` replaces `Date.now`, `Date`, `performance.now` and `Math.random` with functions that throw `PurityViolation`. Any kernel test touching them fails. The Biome GritQL plugin `tools/grit/no-clock.grit` additionally bans `Date.now()` outside `packages/kernel/src/clock/` — this is the `no-restricted-syntax` rule the design calls for, implemented in the pinned toolchain rather than by adding ESLint.

**Network isolation, mechanically.** `vitest.setup.ts` at the root replaces `globalThis.fetch` with a thrower. A test that needs bytes uses `fixtureArtifact()`. The offline Playwright project runs in a container with networking disabled, and `e2e/offline.spec.ts` additionally asserts `performance.getEntriesByType('resource')` contains zero cross-origin entries during a full 1990→2023 scrub.

**Shared conformance suite** (`@exodus/sdk/testing`), run by every connector: manifest parses and `apiVersion` major is `1`; `plan()` is synchronous, deterministic across two calls, and returns only `https:` URLs; `transform()` is called twice on the same artefact and returns deep-equal output; every returned `Fact` parses against the `Fact` schema, carries a non-empty `licenseId`, and has `redistributable === false` **only** if the source manifest says so; a mutated artefact throws `SchemaDriftError` and not a `TypeError`.

---

### 9.11 CI

One workflow, `.github/workflows/ci.yml`. Every action pinned to a full commit SHA (`actions/checkout@<sha>`), `permissions: contents: read`, concurrency group per ref with `cancel-in-progress: true`.

| Job | Command | Gate |
|---|---|---|
| `lint` | `pnpm lint` | zero warnings |
| `types` | `pnpm typecheck` | zero errors |
| `deps` | `pnpm check:deps && pnpm check:dogfood` | §9.3 rules by name |
| `policy` | `pnpm check:policy` + six seeded-violation fixtures | non-zero exactly once per rule module |
| `unit` | `pnpm test` | kernel ≥95% lines; goldens byte-stable |
| `connectors` | `vitest run --project connectors` | every fixture + every trap test |
| `snapshot` | `pnpm snapshot:build --from-fixtures && pnpm snapshot:measure && pnpm snapshot:verify` | **total ≤ 40 MiB**, printed per table |
| `licence` | `pnpm bundle:verify` + the seeded UNHCR row | refuses and **names the reason on stderr** |
| `reuse` | `reuse lint` | every file carries SPDX |
| `connector-proof` | the §9.6 five-line loop | zero diffs outside `packages/connectors/demo-wdi-gdp/` and `snapshot/` |
| `offline` | `docker compose run --rm verify` (`network_mode: none`) | `pnpm dev` + Playwright render the whole product |
| `perf` | `playwright test tools/perf/globe-orbit.spec.ts` | §9.12 budgets |
| `a11y` | `playwright test e2e/a11y.spec.ts` | axe-core clean on all six routes |
| `visual` | `playwright test --grep @visual` | `toHaveScreenshot({ maxDiffPixelRatio: 0.01 })` |
| `size` | `size-limit` | §9.12 budgets |

Chromium for every browser job launches with `--use-gl=angle --use-angle=swiftshader-webgl --enable-unsafe-swiftshader`. Plain `--use-gl=swiftshader` is legacy and the automatic SwiftShader fallback is deprecated; do not use it. Gate every screenshot behind `await page.waitForFunction(() => window.__deckIdle === true)` — `__deckIdle` is **not** a deck.gl API, you set it yourself from `onAfterRender` when `deck.needsRedraw()` is false.

The offline job is the load-bearing one:

```yaml
  offline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha>
      - uses: actions/setup-node@<sha>
        with: { node-version-file: '.nvmrc' }
      - run: corepack enable && pnpm install --frozen-lockfile   # network ON, install only
      - run: docker compose build verify
      - run: docker compose run --rm verify                      # network_mode: none
```

Scheduled data refresh (`cron`) runs `pnpm ingest && pnpm snapshot:build && pnpm snapshot:measure` and opens a PR titled `data: refresh <sourceId> → vintage <date>` with the manifest diff in the body. **No scheduled job writes to `main`.** Data changes go through review exactly like code.

---

### 9.12 Performance budgets, enforced in CI

| Budget | Value | Measured by | On failure |
|---|---|---|---|
| Globe orbit | **≥55fps median** over a 10s scripted orbit, SwiftShader | `tools/perf/globe-orbit.spec.ts` | Drop corridors 12,000 → 6,000 → 4,000 via `EXODUS_CORRIDOR_LIMIT`, record in `DECISIONS.md` |
| Full-range scrub 1990→2023 | **≥55fps median, no frame >50ms, zero network requests** | same harness + resource-timing assertion | Build fails; do not "fix" it by adding easing |
| Committed bundle | **≤40 MiB total**, per-table bytes printed | `pnpm snapshot:measure` | Apply the §4 cut ladder in order: corpus 72h→24h · corridors 12,000→6,000 · asylum 24→12 months · drop `stock_mean`/`stock_std` |
| Initial JS (non-globe routes) | ≤350 KiB gzip | `size-limit` | Fails |
| Globe chunk | ≤1.2 MiB gzip **[UNVERIFIED budget]** | `size-limit` | Measure at M2, then ratchet the number down to measured + 10% and commit it |
| GPU attribute buffers | 34 years × `corridorCount` × {width f32, dashArray 2×f32, color u8×4} ≈ 8 MB | unit assertion on `buildAttributeCube` byte-lengths | Fails if the cube allocates per-frame |
| Cold boot to first globe paint | <3s at 4× CPU throttle **(lab proxy, not a Core Web Vitals pass — label it as such wherever it is reported)** | Playwright | Fails |

`EXODUS_PERF_TRACE=1` makes the app push frame durations onto `window.__corridorFrames`; the harness reads it, computes median and max, and writes `docs/smoke/perf-<sha>.json` for the M0 evidence set.

---

### 9.13 Docker, compose and static deployment

Docker exists for two reasons only: a reproducible offline CI run, and a ministry that wants an air-gapped container. It is never required for development.

```dockerfile
# Dockerfile — pin both image digests on the M0 network-on day; record them in DECISIONS.md
FROM node:24.21.0-bookworm-slim@sha256:<PIN-AT-M0> AS build
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile --offline && pnpm build

FROM nginx:1.27-alpine@sha256:<PIN-AT-M0>
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf   # SPA history fallback to /index.html
EXPOSE 8080
```

```yaml
# compose.yaml
services:
  web:
    build: .
    ports: ["8080:8080"]
  verify:                      # what CI's `offline` job runs
    build: { context: ., target: build }
    network_mode: "none"       # the whole point
    command: sh -c "pnpm test:e2e --project=offline"
```

**Static export is the product.** `pnpm build` writes `apps/web/dist/` containing `index.html`, hashed assets, a copy of `snapshot/` and a `404.html` that is a byte copy of `index.html` (GitHub Pages history fallback). All asset URLs are relative to `EXODUS_BASE_PATH`. Verify deployability with `npx http-server apps/web/dist` and nothing else — if it needs a runtime, you have built the wrong thing. Parquet is fetched with plain `fetch()` + `Range` where the host supports it; no service worker, no server-side anything, and `pnpm build` must not emit `apps/placement` (§12: `grep -r "highs" apps/web/dist/` returns nothing).

---

### 9.14 i18n and RTL readiness

v1 ships `en` only. It ships **ready**, which costs one afternoon now and a rewrite later.

1. **No string literals in JSX.** Every user-visible string is an ICU MessageFormat entry in `packages/ui/locales/en.json`, addressed by key. This is also what makes the lexicon rule module able to walk "copy" as a surface, since all copy is in one file.
2. **No sentence concatenation, ever.** Refusal sentences are single ICU messages with named arguments, because word order is not universal.
3. **All numbers through `Intl.NumberFormat(locale, …)`**, all dates through `Intl.DateTimeFormat`. Hand-formatting a number is a `<Figure>` violation as well as an i18n one. `font-variant-numeric: tabular-nums` everywhere a figure renders.
4. **Logical properties only** in CSS: `margin-inline-start`, `padding-inline-end`, `inset-inline-start`. `tools/grit/no-physical-css.grit` fails the build on `margin-left`, `padding-right`, `left:`, `right:` inside `packages/ui/**` and `apps/web/**`. There is no Tailwind, so there is no class-string escape hatch to police.
5. `dir` is set on `<html>` from a locale table in `packages/ui/src/locales/index.ts`. UI chrome mirrors; **the year track never mirrors** — time flows left→right by cartographic convention — and the globe canvas is direction-agnostic.
6. Place names come from the crosswalk keyed by locale, falling back to `en` with a visible `(en)` marker. A silent fallback is a provenance lie.

*Accept:* a test renders every route under a synthetic pseudo-locale `en-XA` with `dir="rtl"` and asserts no horizontal overflow and no physical-property computed style on any interactive control.

---

### 9.15 Error handling and telemetry

**Refusals are not errors.** `Refusal` is a value that flows to the UI and renders as a sentence. Never `throw` a refusal, never `catch` one, never log one as an error, never map one to `0`.

Errors are a small closed taxonomy in `packages/contracts/src/errors.ts`, each carrying a code and enough context to fix the problem in one edit:

| Error | Thrown by | Message must contain |
|---|---|---|
| `SchemaDriftError` | `transform()` | source id, expected columns, observed columns, the one file to edit (`packages/connectors/<id>/schema.ts`) |
| `LicenceViolationError` | `snapshot:build`, `bundle:verify` | source id, `license_id`, why the row is not redistributable, row count refused |
| `BudgetExceededError` | `snapshot:measure` | per-table bytes, total, cap, and the next rung of the cut ladder |
| `PolicyViolationError` | `check:policy` | rule module, file, line, the matched lexeme, the required form |
| `PurityViolation` | kernel test setup | which forbidden global was touched, and the file |
| `ManifestMismatchError` | `snapshot:verify` | table, expected sha256, observed sha256 |

In the browser: one React error boundary per route, rendering the route's name, the failing panel and a copyable diagnostic; the globe canvas itself never unmounts on a panel error. Missing data is `—` plus a badge, or a `Refusal` sentence — never a blank, never a zero, never a spinner that never resolves. The v1 degradation ladder has exactly two states: `SNAPSHOT` and `UNAVAILABLE`. Do not implement `LIVE` or `CACHED`; there is no live layer in v1.

**Telemetry: none, by construction.** No analytics, no error reporting service, no third-party script, no font CDN, no web font fetched at runtime, no beacon, no cookie, no `localStorage` beyond the once-per-session entry-animation flag in `sessionStorage`. `bundle:verify` scans the built output for any `http(s)://` literal whose origin is not the deploy origin and fails naming each one. If self-hosted analytics is ever added by an operator, the README states the required posture: cookieless, 7-day retention, IPv4 truncated to /24 and **IPv6 to /32**.

---

### 9.16 The documents you write, and the ones you do not

Writing markdown instead of code is the second-most-likely way this build fails. The permitted set is closed. Anything else that needs saying belongs on `/methods` or `/sources`, where users can actually read it.

| Requested artefact | Where it actually ships |
|---|---|
| README | `README.md` — what it is, `git clone && pnpm i && pnpm dev`, the six routes, the licence split (AGPL-3.0-or-later core; Apache-2.0 for `contracts` and `connectors/_template`), **AGPL §13 stated accurately** (the offer of Corresponding Source runs to *all* users interacting over a network, including internal ones — there is no "public" qualifier), the OSD clause 5/6 trade-off stated out loud, and the harm-report route with its 30-day SLA |
| ARCHITECTURE | A `## Architecture` section of `README.md` (the tree of §9.1 plus the dependency table of §9.3) **plus** the ADR entries in `DECISIONS.md`. No `ARCHITECTURE.md`. |
| METHODOLOGY | **`/methods`, as product copy** — CPC scoreboard first, then the five model cards, then the refusals with the allocation discussion, then the Scenario VI panel. Parameters and their provenance live in `PARAMETERS.md`, one row per assumption with `placeholder: boolean` (all `false` in v1). |
| DATA_SOURCES | **`/sources`, as product copy**, generated from `snapshot/manifest.json` — licence, cadence, `plan()` URLs, measured bytes, known traps, and the three exclusion rows. `SNAPSHOT.md` holds the measured size table only. |
| ETHICS | `packages/policy` — an importable, unit-tested package, plus the refusal copy on `/methods`. A third-party layer inherits every rule without its author reading a document. Governance and the ethics-board process live in `GOVERNANCE.md` (added by §12). |
| CONTRIBUTING | `CONTRIBUTING.md` — DCO sign-off (`git commit -s`), **not a CLA**; `pnpm verify` before pushing; the two-maintainer rule for `packages/kernel` and any formula change (methodological note + citation + golden diff showing which countries move); how to add a connector (`gen:connector` → `ingest --only` → `snapshot:build`, zero core edits). |
| ADRs | **`DECISIONS.md`, one append-only file.** Pre-seed it with the 30 rows of the design's decision register as ADR-001…ADR-030, then append. Each entry: `## ADR-NNN — <title>` + `Date` / `Status (accepted|superseded by ADR-NNN)` / `Context` / `Decision` / `Consequences` / `Evidence` (URL, HTTP status, date probed). Every M0 resolution, every cut-ladder rung applied, every golden acceptance and every pinned digest lands here. No `docs/adr/*.md` directory. |

Also permitted, and nothing else: `SECURITY.md` (90-day disclosure window), `BACKLOG.md` (everything cut, so it stops being proposed), `REUSE.toml` + `LICENSES/` (REUSE spec **3.3**, `REUSE.toml` only — DEP5 is deprecated and the two are mutually exclusive), `CITATION.cff`, `.github/ISSUE_TEMPLATE/harm-report.yml`, `docs/smoke/` (M0 screenshots and perf JSON, not prose), and the §12-owned `GOVERNANCE.md` + `compliance/ai-act/*.md`.

*Accept:* a `check:policy` docs rule fails the build on any `.md` file in the repository outside this list and outside `packages/*/README.md` (one paragraph each, max 40 lines, stating what the package owns).

---

### 9.17 Section acceptance checklist

1. `pnpm verify` passes from a cold clone with the network disabled after install.
2. `pnpm check:deps` fails by rule name on a seeded `kernel → globe` import; `pnpm check:dogfood` fails on a seeded extra dependency in a connector.
3. `packages/contracts` exports exactly three plugin interfaces; no `Indicator`, `Panel` or `Scenario` interface exists anywhere; `packages/ontology` does not exist.
4. The `LayerSpec` type test compiles, and adding `opacity` to a layer's returned spec fails `pnpm typecheck`.
5. `pnpm gen:connector demo-wdi-gdp && pnpm ingest --only demo-wdi-gdp && pnpm snapshot:build` produces zero diffs outside `packages/connectors/demo-wdi-gdp/` and `snapshot/`.
6. `pnpm snapshot:measure` prints a per-table byte table and fails above 40 MiB.
7. `docker compose run --rm verify` renders the whole product with `network_mode: none`.
8. Every golden file in §9.10 exists and passes; `vitest -u` cannot rewrite one.
9. The built bundle contains no third-party origin and no `EXODUS_*` value beyond the three inlined ones.
10. The repository contains no markdown file outside the §9.16 list.

---

## 10. Ethics, safety and honest-numbers requirements

This section is normative. Every rule is a MUST or a MUST NOT and every rule names the artefact that proves it. Where a rule could be read as conflicting with another section, the resolution is stated here explicitly and you follow it.

Three framing facts you carry into every rule below:

1. **Exodus holds no personal data and has no server.** v1 is a static site. There is no query planner to reject a request at runtime, no HTTP status to return, no account, no telemetry endpoint. Policy is therefore enforced at three earlier points: **ingest** (rows that violate policy are never written), **build** (the linter and the AST rule fail CI), and **render** (`<Figure>`, the coverage channel and the refusal renderer). You do not build a runtime policy server to satisfy any rule in this section.
2. **Absence is the countermeasure.** The allocation optimiser, the departure forecast, the origin-pressure index, route geometry, ADM1 people layers and every person-shaped type are cut. Do not re-add any of them as a guarded, gated or flagged variant. A guarded targeting feature is still a targeting feature.
3. **Project policy is labelled as project policy.** The aggregation floors, the significant-figure caps, the redress SLA and the latency rules below are ours. No standards body publishes them. You MUST NOT present any of them in the UI or in the repo as an obligation inherited from IOM, UNHCR, OCHA or the IASC. The externally anchored rules are separately marked.

### 10.1 No individual-level data, ever

| # | Rule | Enforced by | Acceptance |
|---|---|---|---|
| E1 | The schema MUST NOT contain a person-shaped type. The banned field tokens are `person`, `individual`, `case_id`, `applicant`, `biometric`, `name`, `dob`. | `@exodus/policy` rule module 3 (banned schema fields), same file walk as the lexicon rule | `pnpm check:policy` exits non-zero on a seeded `case_id` field in any Zod schema or TS interface under `packages/` |
| E2 | No connector may write a row with a granularity finer than ADM0 for any movement measure, and no connector may write a coordinate pair for a person, body or incident involving a person. `iom-mm` coordinates are dropped inside `transform()`, before the fact rows exist. | connector `transform()` + ingest assertion | a `transform()` unit test on the recorded `iom-mm` fixture asserts the output `Fact[]` contains no `lat`/`lon`/`geometry` key and that row count equals distinct `(country, year)` pairs |
| E3 | `iom-mm` MUST NOT bind to any map layer, in v1 or ever. It renders as an ADM0 annual count in a `<Figure>` on `/place/:iso3` and a row on `/sources`. | layer registry | a test asserts no entry in the layer registry has `sourceId === 'iom-mm'` |
| E4 | The `Cmd+K` palette indexes exactly four namespaces: `>` actions, `#` datasets, `@` countries, `~` corridors. It MUST NOT index any fifth namespace, and no namespace may resolve to a person, a case or a household. | palette index builder | a test enumerates the palette index types and asserts the set equals those four |
| E5 | Movement geometry is a 2-vertex great circle between ADM0 centroids, tessellated for rendering only. Any movement `LineString` with more than 2 authored vertices MUST be rejected at construction. Tessellation to 32 points happens inside the layer, after the geometry has passed the guard. | Zod refinement in `@exodus/contracts` | a unit test constructs a 3-vertex movement geometry and asserts the Zod parse throws with a named error; a second test asserts the 32-point tessellated path still passes because it is derived, not authored |
| E6 | Nationality or country-of-origin MUST NOT be crossed with geography finer than ADM0. Ethnicity, religion, sexual orientation, health status and political opinion are not layers, not columns and not filters at any granularity. | `@exodus/policy` verdict function | the verdict function returns `allow: false` with code `SubAdm0Nationality` for a seeded ADM1-crossed request, and `SpecialCategory` for a seeded religion dimension; both tested as pure functions |
| E7 | Gridded people layers MUST NOT go finer than H3 resolution 3, and MUST render `pop / area_km2`, never a raw count. | `ghs-h3` connector + layer encode | a test asserts every cell id in the snapshot has resolution 3 and that the layer's value accessor divides by `area_km2` |

The verdict function is a pure function with no server behind it. Ship it and test it anyway: it is the seam a third-party `Model` or `MapLayer` inherits.

```ts
// packages/policy/src/verdict.ts
export type PolicyDenyCode =
  | 'IndividualLevelRequest'
  | 'SubAdm0Nationality'
  | 'RouteGeometry'
  | 'SpecialCategory'
  | 'GridTooFine'
  | 'CellSuppressed';

export interface PolicyDenyBody {
  readonly code: PolicyDenyCode;
  readonly reason: string;
  /** Anchor on /methods that explains the rule in prose. */
  readonly rule: string;
  /** Always 403 when this project is ever served over HTTP. Never 451:
   *  RFC 7725 reserves 451 for legally-compelled blocking, and this is our
   *  own policy, not a legal instrument. No server exists in v1. */
  readonly httpStatusIfServed: 403;
}

export type PolicyVerdict =
  | { readonly allow: true }
  | { readonly allow: false; readonly body: PolicyDenyBody };

export interface PolicyRequest {
  readonly measureCode: string;
  readonly dimensions: readonly string[];
  readonly originGranularity: 'none' | 'adm0';
  readonly destGranularity: 'adm0';
  readonly h3Resolution: number | null;
  readonly vertexCount: number | null;
}

export declare function verdict(req: PolicyRequest): PolicyVerdict;
```

A denied verdict renders as a **refusal sheet**: the prose reason, then the `PolicyDenyBody` shown verbatim as formatted JSON. Users see the machine-readable rule, not a shrug.

### 10.2 Aggregation floors, suppression and rounding

All thresholds in this subsection are **project policy**. The single externally anchored rule adopted here is the HDX sharing threshold — global re-identification risk below 3% and no record violating 3-anonymity — which binds only if a future microdata-derived layer arrives. v1 has none, so record it in `ETHICS.md` as adopted-and-not-yet-triggered; do not claim it was applied.

| Granularity | K | Status in v1 |
|---|---|---|
| ADM0 x ADM0 corridor, stock or flow | 25 | active |
| ADM0 x ADM0 corridor, monthly asylum series | 25 | active |
| ADM1 destination x ADM0 origin | 100 | unrepresentable — ADM1 is cut; the row ships in the policy table and the verdict function so the rule is executable the day ADM1 arrives |
| ADM2 x origin nationality | prohibited | unrepresentable |
| Any geography x ethnicity, religion, orientation, health, political opinion | prohibited | unrepresentable |
| Gridded people | H3 resolution 3 maximum | active |

Publish a cell only when **all** of the following hold:

1. `n >= K(granularity)`
2. `pop(geography) >= 10000` (denominator floor)
3. complementary suppression: if exactly one cell in any margin is suppressed, the next-smallest cell in that margin is suppressed too, so the withheld value cannot be recovered as a residual
4. the cell is not suppressed in any prior vintage (**frozen suppression**)

Rounding runs **after** suppression, never instead of it: `5 * round(n/5)` below 1000, `10 * round(n/10)` below 10000, three significant figures above. State in the suppression note that rounding makes margins approximate and MUST NOT be forced to re-add.

The ledger is committed at `snapshot/suppression-ledger.json`, append-only, with a test that fails if any existing entry is mutated or removed between two builds.

```ts
// packages/policy/src/suppression.ts
export interface SuppressionLedgerEntry {
  /** Stable key: measure + origin + dest + period. Never a person key. */
  readonly cellKey: string;
  readonly measureCode: string;
  readonly firstSuppressedVintage: string; // ISO date of the snapshot build
  readonly reason: 'below_k' | 'denominator_floor' | 'complementary' | 'frozen';
  readonly k: 25 | 100;
  readonly sourceIds: readonly string[];
}

export interface SuppressionLedger {
  readonly schemaVersion: 1;
  readonly entries: readonly SuppressionLedgerEntry[];
}
```

A suppressed cell MUST render the literal string `<25` (or `<100`) with a **withheld** badge. It MUST NOT render `—`, which means *no data exists*, and it MUST NOT render `0`. The two badges are visually and textually distinct, and a test asserts both render from a fixture that contains one of each.

**Suppressed-cell tooltip — exact copy:**

> **Withheld.** Fewer than «K» people are estimated in this cell. Publishing it could help identify individuals or a small community. This cell stays withheld in every future release, so it cannot be recovered by comparing versions. [Why we do this]

`«K»` is interpolated from the rendered granularity. A hard-coded `25` in this string is a bug and a test asserts the interpolation.

### 10.3 Dual-use countermeasures, as shipped mechanisms

Each row names the mechanism that already exists in this build. You do not add new machinery; you prove these bind.

| ID | Misuse | Countermeasure in v1 | Proof |
|---|---|---|---|
| D1 | Interdiction targeting | **Operational Latency Floor (project policy).** Movement layers at 7-day minimum lag, monthly minimum bucket, ADM0 only. v1 satisfies this structurally: the globe renders annual estimates at least one year old. `eurostat-asylum` is monthly, ADM0 x ADM0, ~4-week lag — permitted, but it MUST NOT bind to any map layer. | `layer_policy.yaml` carries `min_lag_days`, `min_admin_level`, `min_temporal_bucket`, `max_h3_resolution` per layer; a test asserts every registered layer satisfies its own policy row, and that no layer declares `eurostat-asylum` |
| D2 | Route reconnaissance | Great-circle arcs between ADM0 centroids only. No waypoints, no coastline snapping, no bathymetry, no crossing-point type. | E5 |
| D3 | Community profiling | E6 cross-tab lock | verdict function tests |
| D4 | Xenophobic decontextualised counts | **Denominator mandate:** per-capita is the default encoding for every people quantity; an absolute count MUST NOT render without its denominator visible in the same `<Figure>` group. Arcs render symmetrically in and out by default. | a test renders the corridor drawer with an absolute measure and asserts a per-capita `<Figure>` is present in the same group; a test asserts the default arc set contains both directions for a sampled pair |
| D5 | False precision | Significant-figure cap: `estimateKind === 'modelled'` renders at 2 s.f., `observed`/`observed_flagged` at 3 s.f. (project policy). | a unit test on the `<Figure>` formatter |
| D6 | "Carrying capacity" weaponised as a cap | M1 returns a per-indicator panel with a named binding indicator, never a scalar; banned strings linted against the built bundle | rule module 2, run over `apps/web/dist` |
| D7 | Tactical semiotics | rule module 4 (banned visual motifs) + the visual rules in 10.5 | seeded-violation test |
| D8 | Re-identification by differencing across releases | frozen suppression + append-only ledger | ledger append-only test |
| D9 | Viewer surveillance | zero third-party scripts; cookieless self-hosted analytics with 7-day retention, IPv4 truncated to /24 and **IPv6 truncated to /32** (a /48 can still single out one household); or no analytics at all | a build test asserts the bundle contains no third-party script origin and no cookie write; CSP allows `connect-src 'self'` only |
| D10 | Laundering of contested statistics | per-source `contestation` flag rendered as a hatched chip on `/sources` and in the provenance popover | a fixture source with `contestation: true` renders the chip |
| D11 | Automated decisioning built on the product | there is no allocator and no decision endpoint; the SDK's `Model` contract carries the prohibited-use block that a third-party implementation inherits | 10.6 |
| D12 | Forecast used to pre-empt | no forecast of departures, no outflow risk score, no origin pressure index, no composite with author-invented weights. The only forward-looking figures are WPP's own precomputed variant differentials and the constant-PSR bisection, both labelled as demography, not prediction of movement. | a test asserts the model registry contains exactly the five models M1–M5 |

### 10.4 Framing, terminology and the banned-word list

The lexicon rule module is structured on the **seven dehumanising source concepts** measured by Mendelsohn and Budak (arXiv:2502.13246, ACL 2025): animal, vermin, parasite, physical pressure, water, commodity, war. Structure the rule that way, not as a flat list, so a new term lands in a named category and the failure message can explain itself. **UNGA Res. 3449 (XXX), 9 December 1975** requires "non-documented or irregular migrant workers" in place of "illegal migrant worker" — cite it in the lint's failure output; this is a General Assembly basis, not a style preference.

| Concept | Banned tokens (case-insensitive, word-boundary) |
|---|---|
| water | `flood`, `flooding`, `wave of`, `waves of`, `tide of`, `surge of`, `influx`, `stream of migrants`, `awash` |
| physical pressure | `pressure on` (applied to a country receiving people), `burden`, `overwhelm`, `strain of migrants` |
| animal / vermin / parasite | `swarm`, `swarming`, `infest`, `horde`, `breeding` |
| war | `invasion`, `invaders`, `onslaught`, `front line` (applied to a destination), `exodus` |
| commodity | `dumping` (of people), `offload`, `absorb` / `absorption` applied to people |
| legal-status slurs | `illegal` (of a person), `illegals`, `alien`, `bogus`, `economic migrant` as a pejorative contrast to refugee |
| framing | `host country` / `host state` (use destination), `migrant crisis`, `refugee crisis` as a modifier of a people, `real-time` within 80 characters of a stock or flow noun |

Additional banned strings, same walker, different list: `capacity limit`, `carrying capacity`, `maximum` (of people), `threshold` (of people), `saturation`, `PPML is unbiased`, `confidence interval` within 200 characters of the disagreement figure, `uncertainty band` in the same adjacency, `EXODUS` anywhere.

**Scope and the allowlist — read this or the linter will fail the build for its own repository.** The walker runs over: `.ts`/`.tsx` string literals and identifiers, copy and i18n files, `.md` files in the repo, route paths, package names, asset filenames, the repository name, and `apps/web/dist`. It carries a fixed, committed allowlist so unavoidable technical vocabulary passes:

| Token | Allowed where | Why |
|---|---|---|
| `flow`, `flows`, `flows_full.parquet` | anywhere | the design's own vocabulary for the measure; only the *liquid-metaphor* constructions above are banned, and bare `flow` is not one of them |
| `absorption` | only inside the exact phrase `labour-market absorption` | M1's mandated label |
| `target` | `event.target`, `EventTarget`, `e.target`, `target` in `tsconfig*.json` and Vite config, the HTML `target` attribute | DOM and tooling; every other declared identifier named `target` fails and must be renamed `area_of_interest` |
| `host` | `hostname`, `host` in dev-server and Vite config | networking; user-facing prose uses *destination* |
| `capacity` | bare `capacity` in indicator names | only the banned phrases above are prohibited |

Every allowlist entry is a committed line with a one-line justification. Adding an entry is a reviewed change, and `pnpm check:policy` prints the allowlist it used.

**Preferred-term glossary.** Ship it as typed data so `/methods` and the provenance popover render it, and so the lint's failure message can propose the replacement.

```ts
// packages/policy/src/glossary.ts
export interface GlossaryEntry {
  readonly term: string;
  readonly definition: string;
  /** Terms this one replaces; the lexicon lint proposes `term` when it hits one. */
  readonly replaces: readonly string[];
  /** Authority for the definition, rendered in the UI next to the entry. */
  readonly authority: 'IOM Glossary on Migration, IML No. 34 (2019, 3rd ed.)'
    | 'UNGA Res. 3449 (XXX), 9 Dec 1975'
    | '1951 Refugee Convention'
    | '1954 Statelessness Convention'
    | 'UN DESA operational definition'
    | 'this project';
  /** Retrieval date. The IOM Glossary is a living document; a stale date is a bug. */
  readonly retrievedOn: string;
}

export declare const GLOSSARY: readonly GlossaryEntry[];
```

| Preferred term | Replaces | Rule |
|---|---|---|
| movements, arrivals | influx, wave, surge, flood | copy only; `flow` remains the measure name |
| destination country | host country | always |
| migrant in an irregular situation | illegal / illegals / alien / undocumented-as-pejorative | the only permitted phrasing for this population |
| refugee | — | own category, never merged into "migrant" |
| asylum-seeker | — | own category; MUST NOT be rendered as a sub-type of "irregular" |
| internally displaced person | — | own category; MUST NOT appear in any cross-border total |
| stateless person | — | own category, shown even when small, subject to suppression |
| international migrant | — | umbrella only where explicitly labelled as an umbrella; no international legal definition exists, and the product uses the UN DESA operational definition |
| model disagreement | uncertainty, confidence interval, error bar | binding on M3 everywhere: copy, identifiers, tooltips, commit messages |
| model-internal spread | uncertainty | binding on M3b |
| labour-market absorption | capacity, carrying capacity, absorption of people | binding on M1 |
| service deficit | negative capacity, overcapacity | binding on negative M1 output |
| saved_views | watchlist | schema-level rename |
| area_of_interest | target | schema-level rename |
| place, indicator | entity | schema-level rename |

Every status term rendered in the UI MUST link to its glossary entry, and the entry MUST show its authority and retrieval date.

### 10.5 Visual language: rules against dehumanising metaphor

These are binding on the WebGL layer and on every chart.

1. **Warm hue never means people.** People quantities use the cool slot `#3987e5` and the three-slot map palette for direction and selection. Red, orange and yellow are reserved exclusively for **service and rights deficits** — negative M1 headroom renders as a warm deficit field because that is a failure of provision, not a quantity of persons. A test samples the rendered colour ramp for every people-valued layer and asserts no channel falls in the reserved warm range.
2. **No diverging palette on a people layer.** Diverging ramps only on gap, deficit and change metrics, with a labelled neutral point. The neutral must not be confusable with no-data: no-data is hatched, not merely grey.
3. **Symmetric rendering.** Both directions of every corridor render by default at identical weight. A destination-only default reads as siege and MUST NOT ship.
4. **Per-capita by default** (see D4).
5. **No convergence-on-target motion.** Arcs do not animate along their length, do not accelerate toward the destination, do not pulse on arrival and trigger no impact or ripple at the destination. The only motion in the product is the time cursor under the user's hand and the one 2.4s establishing camera move. No pulse, no emissive, no bloom in v1.
6. **Banned motifs**, in identifiers, asset filenames, route paths and pixels alike: `crosshair`, `reticle`, `radar`, `sweep`, `scanline`, `target`, `track`, `lock`, `watchlist`, `dossier`. Also banned as imagery: person silhouettes as icons, mugshot or dossier card layouts, blinking red alerts over populated places, and national flags as the primary identifier of a population.
7. **Default camera leads with the Global South.** Justification rendered in the tooltip: UN DESA, International Migrant Stock 2024 — at mid-2024, **53% of all international migrants had moved within their own region of origin** (83% in Eastern and South-Eastern Asia, 73% in Latin America and the Caribbean, 63% in Central and Southern Asia). A Europe-centred default misrepresents the majority of the phenomenon.
8. **No Web Mercator for people density, ever.** FLAT mode is cut; if a 2D path ever returns it is Equal Earth.
9. **Accessibility is an ethics requirement, not a checklist.** `Shift+G` yields a sorted, keyboard-navigable top-25 table; no encoding is colour-alone; `prefers-reduced-motion` zeroes the camera move and changes nothing about the data, because the data already steps.

### 10.6 The allocation optimiser: guardrails as published refusal, not as code

**You MUST NOT implement the allocation optimiser.** Do not add `highs`, `lp-model`, `glpk.js`, `javascript-lp-solver` or `munkres-js` to any manifest. Do not write the objective function in TypeScript. Do not add a `solve()` stub, a `Placement` type, a `Case` type, or a `commitPlacement()` symbol. `/solve` 301s to `/methods#allocation`. The description **is** the deliverable.

`/methods#allocation` is the first refusal on the page and MUST render all of the following. Every item is checked by a fixture-backed content test that fails if the element is missing.

1. **The objective function, printed in full**, as the source designs specified it:
   `max Σ_i Σ_{j in C_i} ( w_E E_ij + w_N N_ij + w_L L_ij + w_H H_ij + w_P P_ij − w_K K_ij ) x_ij + w_F t − w_U Σ_i v_i − w_S Σ_j Σ_d z_jd − w_Q Σ_m δ_m`
2. **The weight vector, printed with its arithmetic**: `w_E .30, w_P .25, w_N .15, w_L .10, w_H .08, w_K .05, w_F .07`, seven weights summing to 1.00, with `w_U`, `w_S`, `w_Q` stated as sitting **outside** that normalisation. Followed by the sentence: *"These weights are an author construction. No literature sets them. A tool whose most consequential number is a weight nobody has published is the definition of fake precision."*
3. **The three spec bugs, as open problems**: (a) `z_jd` was referenced in the objective with no definition anywhere — it needs `z_jd >= (Σ_i s_id x_ij) − θ c_jd, z_jd >= 0` with θ default 0.85; (b) the responsibility-key constraint C8 was written with an absolute value, which is not a linear constraint and must be two rows; (c) the anti-concentration cap C6 with `ρ = 0.02` names no time window, and 2% per solve round and 2% per year are different policies.
4. **The guardrails any implementation would have to carry**, stated as the reason they are hard rather than as a promise:
   - **Consent is a gate, not a score.** No assignment without a stored consent record id; withdrawal reopens the case.
   - **Preferences are three distinct objects and must never be conflated**: an unlimited hard veto list; a ranked menu of up to `R_i` localities feeding `P_ij = 1 − (r−1)/R_i`; and attribute-level wishes that expand into menu construction only. A run whose median `R_i` is 0 is a people-shuffler and must be refused, not reported.
   - **Family unity.** The case — the family unit that moves together — is the atomic decision object. Individuals are never the assignment unit.
   - **Non-refoulement is a pre-filter, not a penalty term.** Destinations without an affirmative admission legal basis, or under a current non-return advisory, are removed from the candidate set before the model is built. Anchors: 1951 Refugee Convention Art. 33(1) and ECHR Art. 3 **[UNVERIFIED — foundational, not re-checked; render the article numbers only if the agent can cite them from a committed fixture, otherwise name the instruments without article numbers]**.
   - **Deportation must be unrepresentable, not discouraged.** `DestinationLegalBasis` would be a closed enum of admission-type values only — `resettlement`, `relocation_intra_state`, `relocation_inter_state`, `complementary_pathway`, `labour_mobility`, `family_reunification`, `community_sponsorship` — with no `return`, `readmission`, `transit` or `offshore_processing` variant.
   - **Human in the loop, stated precisely.** GDPR Art. 22 bars decisions based **solely** on automated processing producing legal or similarly significant effects. Write it that way. "GDPR requires a human decision" is a shorthand a regulator will not accept. An implementation returns a ranked shortlist with per-term decomposition and the runner-up's losing term, never a committed placement, and has no code path from `solve()` to `commitPlacement()` without a human actor id.
   - **Protected attributes out of the outcome model**, with a proxy audit; the adversary-AUC gate of 0.65 is a project convention, not a standard, and must be labelled as chosen.
5. **The contested evidence, both sides, at equal weight.** Report the headline effects as *off-policy backtest estimates, contested*: Science 359(6373):325–329 (2018) approximately +40% (US) and +75% (CH, 2013 entrants 15% to 26%); Annie MOORE, Operations Research 69(5):1468–1486 (2021), +22% to +38% relative on the 496-person HIAS 2017 cohort of whom 159 found work within 90 days. Then, in the same block and at the same visual weight: **arXiv 2605.06686** (robustness across IPW/AIPW estimators, gains "consistent in magnitude in all scenarios") **and arXiv 2602.08892** (Bastani, Bastani and McLaughlin — model-based evaluation reports gains around 60% in a refugee-matching simulation constructed so the true effect is zero, "on par with improvements of 22–75% reported in the literature"). Citing the first without the second is the exact failure this product exists to prevent, and a content test asserts both arXiv ids appear.
6. **The critique**: Alajak, Burnazoglu, Leurs and van Schie, *Social Inclusion* 14 (2026), art. 10923, doi:10.17645/si.10923 — the Dutch GeoMatch deployment "prioritises aggregate optimisation over individual opportunities", with disproportionate discrimination risk on ethnicity, gender and marital status, and reduced capacity for refugees and caseworkers to contest decisions.
7. **The AI Act boundary.** Exodus implements no function in **Annex III point 7** of Regulation (EU) 2024/1689 — no polygraph-like inference; no assessment of a risk, including a security risk, a risk of irregular migration or a health risk, posed by a person intending to enter or having entered a Member State; no assistance in examining asylum, visa or residence applications; no detection, recognition or identification of natural persons. Nor any Art. 5(1)(g) biometric categorisation. Dates, citable: Art. 5 prohibitions applicable since 2 February 2025; new Art. 5(1)(ba)/(bb) from 2 December 2026; Annex III high-risk obligations from 2 December 2027 and Annex I from 2 August 2028, per **Regulation (EU) 2026/1744** (Digital Omnibus on AI), OJ 24 July 2026. You MUST NOT create `/compliance/ai-act/` or a DPIA template: those are artefacts of a high-risk system, and building them would imply we built one.

The `Model` contract carries the inheritance seam. Every model, including a third party's, declares its prohibited uses, and `/methods` renders them.

```ts
// packages/contracts/src/model-card.ts
export type ProhibitedUse =
  | 'border_enforcement'
  | 'individual_screening'
  | 'group_screening'
  | 'return_or_removal_decisions'
  | 'interdiction_planning'
  | 'ai_act_annex_iii_7'
  | 'departure_forecasting';

export interface ModelAssumption {
  readonly name: string;
  readonly value: number | string;
  readonly provenance: string;
  /** Literal false: a card with a placeholder assumption does not type-check,
   *  which is how "no placeholder coefficients ship" becomes a compile error. */
  readonly placeholder: false;
}

export interface ModelCard {
  readonly modelId: 'm1-headroom' | 'm2-replacement' | 'm3-disagreement'
    | 'm4-coverage' | 'm5-radiation';
  readonly title: string;
  readonly version: string;
  readonly maintainer: string;
  readonly reviewedOn: string;          // ISO date
  readonly intendedUse: readonly string[];
  readonly prohibitedUse: readonly ProhibitedUse[];   // non-empty, checked at runtime
  readonly factors: readonly string[];
  readonly metrics: readonly { readonly label: string; readonly value: number | null;
                               readonly unit: string; readonly sourceId: string }[];
  readonly evaluationData: readonly string[];
  readonly trainingData: readonly string[] | null;    // null where none: M3, M4, M5
  readonly ethicalConsiderations: readonly string[];
  readonly caveats: readonly string[];
  readonly assumptions: readonly ModelAssumption[];
}
```

### 10.7 Uncertainty always visible, provenance always one click away

**Terminology first, because the product's central honesty claim rests on it.** M3 produces **model disagreement**, not uncertainty. Both models are fitted to the same underlying stock tables, so their agreement is correlated and the figure is a **lower bound on true uncertainty**. The permanent, non-dismissible note beside it reads, verbatim:

> Model disagreement. Both estimates derive from the same underlying stock tables, so this is a lower bound on true uncertainty, not a confidence interval.

Rules:

| # | Rule | Proof |
|---|---|---|
| U1 | The words `confidence interval`, `uncertainty band` and `error bar` MUST NOT appear within 200 characters of the disagreement figure, in copy, in a label, in a tooltip, in an identifier or in a commit message. | banned-strings module, run over source and over `apps/web/dist` |
| U2 | M3 (cross-model disagreement) and M3b (model-internal spread) have distinct names in the lexicon fixture and are never rendered in the same visual channel. M3b is drawer-only. | lexicon fixture test; a layer test asserts the globe's dash channel is fed only by M3 |
| U3 | `mig_prev_std` MUST NOT be converted into a confidence interval, a percentile band or a `ci` value. It is a standard deviation from a neural-network ensemble and renders as the named model-internal spread. `Figure.ci` is populated **only** where the source itself publishes an interval, and carries its level explicitly. | a test asserts no code path writes `ci` from a `_std` column |
| U4 | Every rendered number carries `estimateKind`, and `estimateKind` binds to a visual channel that cannot be turned off: modelled is dashed with a hatch and an f glyph; observed is solid; `observed_flagged` shows its `OBS_FLAG` glyph inline. | screenshot test on a fixture containing one of each |
| U5 | Arc opacity is the coverage-asymmetry score `C`, computed in `semantic`. `MapLayer.encode()` has no access to it. Gulf, Chinese, Russian and Iranian corridors are visibly fainter than German-register corridors. | type-level test that `encode()`'s return type has no opacity field; screenshot pair |
| U6 | Missing renders `—` with a badge. Never `0`, never a forward-fill, never an interpolation. `align()` defaults to `"none"` and a missing year is a visible gap on the sparkline. | `<Figure>` fixture test with a deliberately absent value |
| U7 | A typed `Refusal` renders as a sentence naming why the value is absent — "no unique solution: PSR is non-monotone in intake for this age profile" — never as a number and never as a bare em dash. | the three refusal-path tests |
| U8 | Significant figures are capped: 2 for `modelled`, 3 for `observed`/`observed_flagged` (project policy). | formatter unit test |
| U9 | The global AS-OF chip shows the **oldest** contributing vintage. Showing the newest is the lie. Any derived figure inherits the worst latency class, the oldest vintage and the AND of licence flags. | a test builds a derived figure from two sources and asserts inheritance |

**Provenance is one click and one keystroke away from every number.** The popover opens from any `<Figure>` by click and by keyboard, and MUST contain: source id and title; vintage date; latency days; `estimateKind`; licence SPDX and attribution string; `ci` with its level where present; the formula with every variable defined; and the **transformation chain** — `sourceId -> connector id -> transform commit SHA -> suppression rule applied -> rounding rule applied`. It ends with a permalink that encodes the snapshot manifest content hash, so a screenshot taken today can be audited later. All of this is computed offline from `snapshot/manifest.json`; no network call is permitted to open a popover.

### 10.8 Model cards and dataset datasheets, shipped in-repo

The build plan permits five documents — `DECISIONS.md`, `SNAPSHOT.md`, `PARAMETERS.md`, `BACKLOG.md`, `REUSE.toml` — plus `ETHICS.md` and the REUSE licence files. Model cards and datasheets are therefore **not** loose markdown. They ship as **typed, Zod-validated data in the registry**, rendered on `/methods` and `/sources`. This satisfies both the documentation requirement and the rule that everything users need to read lives on a page they can actually reach.

| Artefact | Path | Standard followed | CI gate |
|---|---|---|---|
| Model card, one per model | `packages/registry/src/model-cards/<modelId>.ts` | Mitchell et al., arXiv:1810.03993 | a test asserts a card exists for each of M1–M5, that `prohibitedUse` is non-empty, and that every `assumptions[].placeholder` is `false` (the literal type makes a placeholder a compile error, and the runtime test catches a card built from `unknown`) |
| Dataset datasheet, one per source | `packages/connectors/<id>/datasheet.ts` | Gebru et al., arXiv:1803.09010, plus four project fields | `pnpm check:policy` fails if any source in `snapshot/manifest.json` has no datasheet, or if `vintage.retrievedOn` is absent |

```ts
// packages/contracts/src/datasheet.ts
export interface KnownTrap {
  readonly id: string;        // e.g. 'unhcr-cf-type-iso'
  readonly body: string;      // shipped product copy on /sources
  readonly testId: string;    // the fixture-backed test that fails if the trap stops being true
}

export interface DatasetDatasheet {
  readonly sourceId: string;
  readonly motivation: string;
  readonly composition: string;
  readonly collectionProcess: string;
  readonly preprocessing: string;
  readonly uses: string;
  readonly distribution: string;
  readonly maintenance: string;
  readonly licence: {
    readonly spdx: string;
    readonly url: string;
    readonly attribution: string;
    readonly redistributable: boolean | 'unknown';
  };
  readonly vintage: { readonly referencePeriod: string; readonly retrievedOn: string };
  readonly updateCadence: string;
  /** Names who is missing: people in irregular situations, unregistered displaced
   *  people, anyone avoiding enumeration. Never the empty string. */
  readonly knownUndercount: string;
  readonly knownTraps: readonly KnownTrap[];
  readonly contestation: boolean;
}
```

`knownUndercount` MUST be non-empty for every source and MUST name a population, not a caveat. A datasheet reading "some undercount possible" fails review.

Retrieval dates are load-bearing: the IOM Glossary is a living document, UNHCR revises statistical methodology, and the OCHA Data Responsibility Guidelines are on a two-year review cycle. Every datasheet and every citation carries a retrieval date or the repo drifts silently.

### 10.9 Exact copy

#### 10.9.1 In-app limitations notice

**Resolution, binding:** this is **not** a blocking modal. The design requires the world to be fully rendered at frame one, and a modal would contradict it. Ship it as (a) a **first-run panel** in the `/` route's own chrome — not a new route, not a fifth overlay — shown once per browser via `localStorage`, plus again whenever the methodology major version changes, dismissed by a single control and by any navigation; and (b) a **persistent footer strip** that is never dismissible. The globe renders behind the panel from frame one.

Exact copy of the first-run panel:

> **Before you read these numbers**
>
> This atlas is about people. Every figure on it stands for someone's life, and most of those people had no say in being counted.
>
> **These are estimates, not counts.** No bilateral migration number on this globe was observed. All of them are modelled, and two competent models of the same corridor disagree by tens of percent. People in irregular situations, unregistered displaced people and anyone with reason to avoid being enumerated are systematically undercounted. Different countries count different things, at different times, under different definitions.
>
> **We render the disagreement instead of hiding it.** Dashes on an arc mean two models disagree about it. A faint arc means nobody counted it carefully. An em dash means the world has no number, and we will not print a zero in its place.
>
> **This tool is not for finding people.** It holds no data about individuals, no routes, no crossing points and no live tracking. Corridors are straight great-circle arcs between country centroids because the real paths are none of our business. Small cells are withheld, and once withheld they stay withheld, so nothing can be recovered by comparing versions.
>
> **Numbers are not decisions.** Our service-stock model estimates what public services might absorb under assumptions you can read and change. It does not tell you how many people a country should admit. That is a political and legal question, governed by the right to seek asylum, the prohibition of refoulement and the prohibition of collective expulsion, none of which a model can weigh. We did not build the allocation solver, and we explain why on the methods page.
>
> **Words matter here.** We use refugee, asylum-seeker, internally displaced person, stateless person and migrant in an irregular situation precisely, following the IOM Glossary on Migration. No person is illegal.
>
> If something here is wrong, or if you believe this tool is causing harm, tell us. We answer within 30 days and we will withdraw a layer if we have to.
>
> `[ I understand — open the atlas ]`   `[ Read the methods ]`   `[ Report a problem ]`

The panel MUST NOT state a numeric suppression threshold: `K` varies by granularity, and a hard-coded "25" is false the moment a finer layer exists. It links to the table instead.

Persistent footer strip, never dismissible, always visible:

> Estimates, not counts · vintages differ by source · **not for operational targeting** · [How this number was made] · [Sources] · [Methods] · [Report a harm]

**There is no export or download feature in v1**, so no export stamp ships. Record in `ETHICS.md` that if one is ever added it MUST burn this line into the artefact at 11px minimum, not removable from the UI: *"«Indicator» — «geography» — «period». «value». Source: «source», vintage «date». Cells under «K» withheld at this granularity. Estimates, not counts — not for operational targeting. Reproduce this exact view: «short-url» · «vintage-hash»"*.

#### 10.9.2 Methodology page intro

**Resolution, binding:** the acceptance criterion is that the CPC scoreboard is the first thing on `/methods`. Render this intro **inside** `<section id="scoreboard">`, as that section's lede, above the table. The first section of the page remains the scoreboard, and the test asserting that still passes.

Exact copy:

> **What this field can actually do, and what we refused to build.**
>
> Below is the honest accuracy ceiling of global bilateral migration modelling, measured as Common Part of Commuters against a held-out year. Read the numbers before you read anything else on this site. Roughly half the achievable accuracy in this field lives in getting origin outflow totals right, which is why we do not ship a fitted flow model, and why the null model sits on this page beside the published references rather than behind a badge.
>
> Everything after the scoreboard is in three parts: what the five models in this product do and where each one breaks; what we chose not to build and the full argument for each refusal, starting with the allocation solver; and one table from the United Nations that makes the case against scalar capacity better than we could.

#### 10.9.3 Absorption panel header (M1), verbatim

> Modelled labour-market absorption under assumption set «name» — not a policy limit.

and, wherever the result is negative:

> This formula holds service stock fixed while growing population. Migrants bring physicians. It therefore systematically understates.

and beside the WHO figure:

> WHO's 4.45 doctors, nurses and midwives per 1,000 is a floor, explicitly not an optimum.

#### 10.9.4 Scenario VI panel, non-dismissible

The UN's own footnote renders with the figure and cannot be dismissed:

> Scenario VI is considered to be unrealistic.

attributed to UN ESA/P/WP.160, Table 8. Do not paraphrase it, do not soften it, do not put it behind a disclosure. It is the strongest argument in the product that capacity is not a number, and it is made by the primary source, not by us.

### 10.10 `ETHICS.md` outline

One file, repo root, linked from the README's first screen. It is a normative artefact, not a status report or a design document, which is why it exists alongside the five build documents. Fourteen sections, in this order, each one sentence or more, none of them empty:

1. **Why this file is first.** The tool models human beings; the scope of the commitment.
2. **What Exodus is, and the five things it will never be.** No individual data. No route intelligence. No screening or scoring of persons or groups. No departure forecast or origin pressure index. No EU AI Act Annex III(7) function.
3. **Frameworks we hold ourselves to**, as a table with links and retrieval dates and the specific obligation derived from each — IOM Data Protection Principles; UNHCR General Policy on Personal Data Protection and Privacy (UNHCR/HCP/2022/02); OCHA Data Responsibility Guidelines (finalised October 2021, current edition 2025); IASC Operational Guidance on Data Responsibility (first endorsed February 2021, current version April 2023); Centre for Humanitarian Data Guidance Note #1 on Statistical Disclosure Control (August 2019); the Signal Code (January 2017); GDPR; Regulation (EU) 2024/1689 as amended by Regulation (EU) 2026/1744; non-refoulement; ECHR Protocol No. 4 Art. 4 and Charter Art. 19(1); UNGA Res. 3449 (XXX). **With an explicit line separating external obligations from our own chosen numbers.**
4. **Data responsibility.** The floors in 10.2 reproduced verbatim and labelled project policy; the HDX rule adopted (global risk under 3%, no record violating 3-anonymity) and marked as not yet triggered because v1 ingests no microdata; the frozen-suppression ledger and where to read it; what we do not collect about viewers.
5. **Dual-use risk register**, the table in 10.3, each row linking to the file that implements it.
6. **Language policy**: the banned list, the seven metaphor concepts it is structured on, the glossary, the allowlist and its justifications, the lint command, and how to propose a change.
7. **Visual-design ethics**: the nine rules in 10.5 with rationale.
8. **Model and data documentation standard**: the two contracts in 10.8 and the CI gates.
9. **Honest-numbers policy**: disagreement is not uncertainty; the significant-figure caps; the missing-versus-withheld distinction; refusals as sentences; the AS-OF chip showing the oldest vintage.
10. **Acceptable use**, as a separate published document, not a licence term. State the trade-off out loud: Open Source Definition clause 5 forbids discrimination against persons or groups and clause 6 forbids discrimination against fields of endeavour, so a use-restricted licence forfeits the open-source designation. The Hippocratic License 3.0 is commonly held to fail both, a reading its author disputes; OpenRAIL's status is **[UNVERIFIED — do not assert it either way; either cite a primary source the agent can reach at M0 or write "not assessed"]**. Governance, not licence text, is the real control.
11. **Redress**, the Signal Code right made operational: `.github/ISSUE_TEMPLATE/harm-report.yml`, a monitored address, a **30-day response SLA** (project policy), the power to de-publish a layer, and a public de-publication log with reasons.
12. **Governance**: named maintainers; an advisory group including people with lived experience of displacement and at least one migrant-led organisation; the rule that no new people-layer ships without their sign-off; disclosure of any government or agency contributor.
13. **Conflicts and funding**: full disclosure of funders and a standing refusal of funding conditioned on enforcement features.
14. **Known failures and open problems**: undercounts, definitional incomparability, the gap between what the tool shows and what it cannot show, and the things we have got wrong so far — including every entry in `DECISIONS.md` where a fallback was applied.

### 10.11 Licence decision and the data-attribution surface

| Component | Licence | Reason |
|---|---|---|
| `packages/contracts`, `packages/sdk` connector template | **Apache-2.0** | the express patent grant matters for third parties implementing the contracts |
| all other code | **AGPL-3.0-or-later** | closes the network loophole. The README states §13's actual scope: the offer of Corresponding Source runs to **all** users interacting with a modified version over a network, including internal ones, with no "public" qualifier |
| the committed data bundle | **CC BY 4.0**, and nothing that contaminates it | every Tier A source is CC BY 4.0, Etalab 2.0, CC0 or public domain. A single CC BY-NC-SA or ODbL row re-licenses the whole data component |
| Acceptable Use Policy | **not a licence** — a separate published document | an OSI-approved licence cannot restrict fields of use; see `ETHICS.md` §10 |

Compliance mechanics: **REUSE 3.3** with `REUSE.toml` (DEP5 is deprecated and mutually exclusive with it), `reuse lint` in CI, **DCO sign-off** rather than a CLA.

Rules that bind the build:

| # | Rule | Proof |
|---|---|---|
| L1 | `license_id` and `redistributable` are mandatory NOT NULL columns on every fact row. A row without them fails ingest with a named error. | an ingest unit test feeds a row missing `license_id` and asserts the named failure |
| L2 | `bundle:verify` MUST refuse a deliberately inserted non-redistributable row and **name the reason in stderr**, identifying the source and the licence. | CI inserts a synthetic UNHCR row and asserts a non-zero exit plus the reason string |
| L3 | UN DESA IMS and UNHCR ship as **recipe connectors**: code that writes to a gitignored path, prints the licence text before running, is excluded from `snapshot:build` outputs, and is unit-tested offline against a recorded fixture. Their bytes MUST NOT enter `snapshot/` or `corpus/`. | `bundle:verify` + a test asserting the recipe connectors' outputs are absent from the manifest |
| L4 | UNHCR's licence is **[UNVERIFIED]** — two verification passes returned contradictory terms. Render it on `/sources` as `unknown`, never as CC BY 4.0, with the exclusion reason and the instruction that resolution requires written confirmation from `webportal@unhcr.org`. Do not upgrade this marker on any evidence short of that written resolution. | a `/sources` content test asserts the UNHCR row shows `unknown` and the exclusion reason |
| L5 | The three exclusion rows — UN DESA IMS, UNHCR, ACLED — appear by name on `/sources` with their reason. | `/sources` content test |
| L6 | Natural Earth is public domain / CC0 and requires **no** attribution. List it on `/sources` for completeness, but MUST NOT print a false "attribution required" claim next to it. | a content test asserts the Natural Earth row's `attribution` field renders as "not required" |

**The attribution surface** is four places, all offline-resolvable:

1. `/sources` — the ledger. Every source with its SPDX id, licence URL, the exact attribution string, `redistributable`, cadence, latency class, measured bundle bytes, its `plan()` output rendered as the literal URLs the system would fetch, and its known traps. Each trap is bound by `id` to a fixture-backed regression test that fails when the trap stops being true.
2. The **provenance popover** on every `<Figure>` — licence id and attribution string for that specific number, plus the transformation chain.
3. `REUSE.toml` plus `LICENSES/` — machine-readable, `reuse lint` clean.
4. A repo-root `NOTICE` file generated by `snapshot:build` from the datasheets, so attribution strings cannot drift from the data they describe. A test asserts `NOTICE` regenerates byte-identically from the current manifest.

### 10.12 Redress, viewer privacy, and the things that must be true at M7

| # | Rule | Artefact |
|---|---|---|
| R1 | `.github/ISSUE_TEMPLATE/harm-report.yml` exists, names a monitored address, and states a **30-day response SLA** (project policy). | file present; a test asserts the SLA string and the address are non-placeholder |
| R2 | A public de-publication log exists at `/sources`, empty at launch, with its schema and the commitment to log every removal with a reason. | `/sources` content test |
| R3 | Zero third-party scripts, zero cookies, no account to view anything, no fingerprinting. Analytics, if any, are self-hosted and cookieless with 7-day retention and IPs truncated to /24 (IPv4) and /32 (IPv6). | bundle test asserting no third-party origin and no cookie write |
| R4 | Any CI link-checker MUST allowlist `iom.int`, `publications.iom.int`, `unhcr.org`, `refworld.org` and `hhi.harvard.edu`, which return 403 to non-browser clients. Without the allowlist the check reports false dead links and nobody trusts it. | the allowlist is a committed config line with this justification |

**Do not attempt to re-verify the citations in this section over the network after M0.** The `[UNVERIFIED]` markers stay as they are: carry them into the copy as written, render the instrument name without the disputed detail, or omit the detail entirely. Upgrading a marker on inference is the single most damaging thing you can do to this product's credibility, because the whole argument is that we say what we do not know.

### 10.13 Acceptance summary for this section

`pnpm check:policy` exits non-zero on a seeded violation of each of its six rule modules. In addition, these tests must exist and pass before M7 is complete:

| Test | Asserts |
|---|---|
| `policy/schema-fields.test.ts` | E1 banned field tokens, including through a re-exported type alias |
| `policy/lexicon.test.ts` | every banned token in 10.4 fails; every allowlist entry passes; the failure message names the metaphor concept and proposes the glossary replacement |
| `policy/bundle-strings.test.ts` | rule module 2 run over `apps/web/dist`, not only over source |
| `policy/verdict.test.ts` | E6 deny codes, and that the body carries `httpStatusIfServed: 403`, never 451 |
| `policy/suppression-ledger.test.ts` | append-only; a mutated or removed entry fails |
| `policy/figure-ast.test.ts` | no numeric literal or numeric-typed expression renders outside `<Figure>`; a seeded violation fails |
| `ui/missing-vs-withheld.test.tsx` | `—` and `<25` render from one fixture with distinct badges; neither renders `0` |
| `ui/disagreement-terminology.test.tsx` | U1 adjacency rule, over rendered output |
| `registry/model-cards.test.ts` | five cards, non-empty `prohibitedUse`, every assumption `placeholder: false` |
| `registry/datasheets.test.ts` | one datasheet per manifest source, non-empty `knownUndercount`, present `retrievedOn` |
| `methods/allocation-refusal.test.tsx` | all seven required elements of 10.6, including both arXiv ids |
| `methods/scenario-vi.test.tsx` | 5.149 billion renders with the UN footnote, and the footnote has no dismiss control |
| `cli/bundle-verify.test.ts` | L2 — refusal, non-zero exit, reason named in stderr |
| `cli/notice.test.ts` | `NOTICE` regenerates byte-identically from the manifest |


---

## 11. Build plan, acceptance criteria and agent operating rules

You are building Exodus in one sustained effort. There is no follow-up conversation, no reviewer to unblock you, and no second chance to ask what a term means. This section tells you the order to build in, the exact condition that closes each milestone, the rules you operate under while building, and the rubric you run before you are allowed to say you are done.

Read §11.1 before you run anything. Then run the five commands in §11.12.

---

### 11.1 How the build is gated

Nine milestones, M0 through M8, plus one optional M9. Each milestone has a **goal**, a list of **deliverables by path**, a **demo** (one sentence you could say to a stranger while pointing at a screen), and a table of **acceptance checks**. Every acceptance check has an id, a command and a pass condition. A milestone is closed when every blocking check in its table passes from a cold install, in one run, and you have tagged the commit.

You do not start milestone N+1 until milestone N is tagged. This is kill-list rule 22 and it is the single strongest protection you have against a budget that ends early: every milestone leaves behind something that runs.

**The milestone order in §8 of the design is already the thin vertical slice. Do not reorder it, and do not "get ahead" by starting a later milestone's screen while an earlier gate is red.** The slice runs: M0 gives you a globe that renders (synthetic geometry, real layer stack, measured frame times) → M1 replaces the synthetic geometry with the real spine (one dataset → fact table → manifest) → M2 renders the real world offline → M4 puts a provenance-bearing `<Figure>` panel on top of it. One dataset, through the ontology, onto the globe, into a panel, by M4 — and running end-to-end at every step in between. Everything after M4 widens that slice; nothing after M4 changes its shape.

```ts
// packages/cli/src/gates.ts — the gate contract. One file, no framework.
export type MilestoneId =
  | 'M0' | 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6' | 'M7' | 'M8' | 'M9';

export type CheckKind = 'unit' | 'lint' | 'measure' | 'e2e' | 'artifact';

export interface AcceptanceCheck {
  readonly id: string;            // 'M3.2' — stable, referenced from DECISIONS.md
  readonly milestone: MilestoneId;
  readonly statement: string;     // the criterion in one sentence, as written in this section
  readonly command: string;       // the exact shell command that decides it
  readonly kind: CheckKind;
  readonly blocking: boolean;     // false only for M9
}

export type GateResult =
  | { readonly outcome: 'pass'; readonly id: string; readonly evidence: string }
  | { readonly outcome: 'fail'; readonly id: string; readonly expected: string; readonly observed: string };

export interface GateReport {
  readonly milestone: MilestoneId;
  readonly results: readonly GateResult[];
  readonly green: boolean;        // every blocking result is 'pass'
}

export declare function runGate(milestone: MilestoneId): Promise<GateReport>;
```

`pnpm gate:m0` … `pnpm gate:m9` each run `runGate` and exit non-zero on any blocking failure. `pnpm gate:all` runs M0 through the highest tagged milestone and is what CI runs on every push. A `GateResult` of `fail` prints `expected` and `observed` on adjacent lines — never a bare boolean, because a gate that cannot tell you what it saw is a gate you will disable.

Alongside the gate, one composite command is your per-commit guard:

```
pnpm verify   ==  turbo run typecheck lint test --affected && pnpm check:policy && pnpm check:dogfood
```

`pnpm verify` must be green before every commit. Not before every push — before every commit. See R7.

---

### 11.2 M0 — Resolve and gate (network ON)

**Goal.** Convert the four assumptions that can poison everything downstream into observed facts, before a single line of product code exists. Those four are: the spine dataset resolves exactly as specified; the globe layer stack hits frame budget on integrated graphics; Arrow → typed arrays → deck.gl works without geoarrow; the committed bundle fits under 40 MiB.

This is the only milestone that runs with the network on. Decision 5 in §9 puts it first for one reason: if the citation is wrong and you infer a schema from this document, every figure downstream is invented and nothing later in the build can detect it.

**Deliverables**

| Path | What it is |
|---|---|
| `.nvmrc`, `package.json`, `pnpm-workspace.yaml`, `turbo.json` | Toolchain pinned exactly to §6. No `^`, no `~`, anywhere. |
| `docs/smoke/m0-spine-resolve.txt` | The full curl status/redirect chain for the spine DOI, verbatim. |
| `docs/smoke/m0-spine-header.txt` | The first line of `mig_bilateral.csv` as observed, and the assertion diff against the expected column list. |
| `docs/smoke/m0-fallback-resolve.txt` | The Abel & Cohen figshare status line, captured whether or not you need it. |
| `docs/smoke/globe-{polygons,paths,hexes}.png` | Three screenshots from the Playwright harness. |
| `docs/perf/m0-orbit.json` | Measured frame times: median, p95, max, feature counts, GPU string. |
| `packages/testkit/perf/orbit.spec.ts` | The committed 10-second scripted orbit harness. Reused unchanged at M2, M3 and M8. |
| `packages/connectors/gaskin-abel/schema.ts` | The observed column list, asserted. One file. The fact table is the interface. |
| `DECISIONS.md` | D-001 … D-00n, one per M0 finding, in the §11.8 format. |
| `SNAPSHOT.md` | The per-table byte budget table with a `measured` column, filled where measurable. |

**Demo.** "Here is the exact header of the spine file as the server returned it. Here is a globe holding 58fps median with 12,000 dashed great-circle paths and 41,162 hexes on integrated graphics. Here is the byte table. Nothing is guessed."

**Acceptance**

| id | Statement | Command | Pass |
|---|---|---|---|
| M0.1 | The spine DOI resolves and `mig_bilateral.csv` exists at the resolved record. | `pnpm gate:m0 --check spine-resolve` | 2xx after redirects, chain recorded in `docs/smoke/m0-spine-resolve.txt` |
| M0.2 | Every column in `orig,dest,year,stock_mean,stock_std,mig_prev,mig_prev_std,mig_brth,mig_brth_std` is present in the observed header. | `pnpm gate:m0 --check spine-schema` | Exact set match, or **the §4 fallback is applied and D-00n records the failure with date and HTTP status** |
| M0.3 | `_GlobeView` renders an opaque ocean sphere, 258 ADM0 polygons, 12,000 32-point dashed `PathLayer` paths and 41,162 H3 r3 hexes. | `pnpm test:perf` | All four layers present in the rendered frame; screenshots written |
| M0.4 | ≥55fps median over a 10s scripted orbit on integrated graphics, no frame >50ms. | `pnpm test:perf` | Median ≥55fps. **On failure drop corridors 12,000 → 6,000, re-measure, then → 4,000. Record the drop as a decision. Do not lower the fps target.** |
| M0.5 | `apache-arrow@21.2.0` → plain typed arrays → deck.gl `data: {length, attributes}` renders without `@geoarrow/deck.gl-geoarrow`. | `pnpm test --filter @exodus/globe -t arrow-binary` | Layer renders from a binary attribute payload |
| M0.6 | `pnpm snapshot:measure` prints real compressed bytes per table and a total. | `pnpm snapshot:measure` | Total < 40 MiB, **or the §4 cut ladder is applied in order (corpus 72h→24h, corridors 12k→6k, asylum 24mo→12mo, drop `stock_mean`/`stock_std` from the render table) and the applied rungs are recorded** |
| M0.7 | The repository, packages, route paths, env vars and asset filenames contain no banned lexeme, including `exodus`. | `pnpm check:policy` | Exit 0 |

**Exit.** `git tag m0-green`. The working tree contains a running globe and zero product features. That is correct.

---

### 11.3 M1 — Ingest, snapshot, manifest (the true gate)

**Goal.** Every Tier A dataset lands in the fact table with its licence attached, and the whole thing rebuilds from committed fixtures with the network off.

**Build order inside M1 — this matters.** Do the spine slice first: `gaskin-abel` → `naturalearth` → `centroids` → `xwalk`. Those four alone unblock all of M2. Only when the spine slice produces a loadable `snapshot/` do you add `abel-cohen`, `wpp`, `wdi-who`, `eurostat-mirror`, `eurostat-asylum`, `cepii`, `ghs-h3`, `iom-mm`, `corpus`, `fixtures`. Each connector is one commit. Each connector records its fixture in the same commit as its `transform()`.

**Deliverables.** `packages/connectors/<id>/` for each Tier A source, each with `plan.ts`, `fetch.ts`, `transform.ts`, `schema.ts`, `fixtures/`, `<id>.test.ts`, `LICENSE`. `packages/cli/` with `ingest`, `snapshot:build`, `snapshot:measure`, `bundle:verify`. `snapshot/manifest.json`, `snapshot/suppression-ledger.json`, the Tier A tables. `SNAPSHOT.md` with measured sizes. `packages/connectors/undesa-ims/` and `packages/connectors/unhcr/` as recipe connectors writing to a gitignored path.

**Demo.** "`pnpm snapshot:build --from-fixtures` with the network unplugged rebuilds the whole bundle. Here is the manifest. Every row carries a licence id."

**Acceptance**

| id | Statement | Command | Pass |
|---|---|---|---|
| M1.1 | `pnpm ingest && pnpm snapshot:build` produces every Tier A file from raw sources. | `pnpm ingest && pnpm snapshot:build` | All manifest entries written, non-zero row counts |
| M1.2 | The 2 MiB demo slice rebuilds with the network off. | `pnpm snapshot:build --from-fixtures` under `--network=none` | Exit 0, byte-identical across two runs |
| M1.3 | `license_id` and `redistributable` are non-null on every fact row. | `pnpm test -t fact-licence-columns` | Zero violating rows; a seeded null fails ingest with a named error |
| M1.4 | `bundle:verify` refuses a deliberately inserted UNHCR row and names the reason on stderr. | `pnpm test -t bundle-verify-hostile` | Non-zero exit, stderr contains the source id and the licence reason |
| M1.5 | The crosswalk resolves five namespaces with the collisions unit-tested. | `pnpm test --filter @exodus/semantic -t xwalk` | `AUS`(Austria≠Australia), `CHI`(China), `UK`/`GB`, `EL`/`GR`, `XK`, Sudan-2011 all asserted with validity ranges |
| M1.6 | WPP normalisation is unit-tested. | `pnpm test -t wpp-normalisation` | `SRB/100`, `ASFR/1000`, `population×1000`; a test asserts the male birth share is ≈0.514, **not 0.991** |
| M1.7 | The WPP reader is multi-member gzip. | `pnpm test -t wpp-gzip-members` | Row count **> 600,000**. A single-member reader returns 634 bytes and no error; this test is the only thing that catches it |
| M1.8 | Abel & Cohen is summed across `sex` and filtered to `type='outward'`. | `pnpm test -t abel-cohen-aggregation` | Summing across `{outward,return,transit}` fails the test; omitting the sex sum fails the test |
| M1.9 | Eurostat requests stay under the 5,000,000-cell cost ceiling. | `pnpm test -t eurostat-chunking` | Every generated `plan()` unit is chunked by year; no unit exceeds the ceiling |
| M1.10 | `snapshot:measure` total is under 40 MiB. | `pnpm snapshot:measure` | Under cap, cut ladder rungs recorded if applied |

**Exit.** `git tag m1-green`.

---

### 11.4 M2 — Globe v1, offline

**Goal.** The whole world, from a cold clone, with the network cable out.

**Deliverables.** `packages/globe/` with the seven-layer stack in the §6 order. `packages/semantic/` with `align()` (default `"none"`), the coverage-asymmetry computation, and the latency/licence/vintage inheritance. `packages/registry/` driven from `snapshot/manifest.json`. `apps/web/` route `/`. `packages/ui/` tokens including `--scrim-globe` and `--border-interactive`.

**Demo.** "`git clone && pnpm i && pnpm dev` on a plane. Here is every country on earth."

**Acceptance**

| id | Statement | Command | Pass |
|---|---|---|---|
| M2.1 | Cold clone renders ≥190 countries with networking disabled at the container level. | `pnpm test:e2e -g @offline-boot` | ≥190 ADM0 features rendered, zero network requests recorded |
| M2.2 | H3 renders `pop / area_km2`, never raw count. | `pnpm test --filter @exodus/globe -t h3-density` | Accessor divides by `area_km2`; `highPrecision` is `'auto'`, and a test fails if it is forced `false` |
| M2.3 | Corridor opacity is coverage-asymmetry `min(C_o, C_d)`, computed in `semantic`. | `pnpm test -t opacity-not-authorable` | A type-level test proves `MapLayer.encode()` cannot reach the opacity field |
| M2.4 | The opaque ocean sphere is present and far-side marks do not bleed through. | `pnpm test:e2e -g @ocean-sphere` | Screenshot comparison at two antipodal cameras |
| M2.5 | Only the three-slot map palette carries people. | `pnpm check:policy` | No warm hue bound to a people-valued accessor |
| M2.6 | The AS-OF chip shows the **oldest** contributing vintage. | `pnpm test -t asof-oldest` | Chip equals `min(vintage)`; a fixture where newest ≠ oldest fails if newest is shown |
| M2.7 | Default camera is the Global South, with the 53% intra-regional justification in its tooltip. | `pnpm test:e2e -g @default-camera` | Camera matches the committed keyframe; tooltip text asserted |

**Exit.** `git tag m2-green`.

---

### 11.5 M3 — The Year Machine

**Goal.** The headline. One handle, 34 discrete global frames, the whole planet, no interpolation.

**Deliverables.** `packages/semantic/attribute-cube.ts` with `buildAttributeCube(facts, manifest)`. `packages/store/timeStore.ts` — one global store, no component holds local date state. The notched track, the 44px tabular-nums year, arrow-key stepping and `Space` play in `packages/ui/`.

**Demo.** "Drag this. Thirty-four years of the entire world's migration system, at 60fps, with the network off."

**Acceptance**

| id | Statement | Command | Pass |
|---|---|---|---|
| M3.1 | Dragging 1990→2023 holds ≥55fps median, no frame >50ms, **zero network requests**. | `pnpm test:perf -g @year-scrub` | All three conditions; the request count assertion is `=== 0`, not `< n` |
| M3.2 | No `transitions` on any data accessor. | `pnpm check:policy` + `pnpm test -t no-transitions` | The AST rule fails the build if `transitions` appears in any layer whose data is annual |
| M3.3 | `buildAttributeCube` is generic over the manifest, not the spine. | `pnpm test -t attribute-cube` | Passes against a synthetic 3-corridor 4-year fixture **and** against the real snapshot through the same code path |
| M3.4 | The track steps to integer years and the year is legible at 44px. | `pnpm test:e2e -g @year-handle` | 34 notch positions; computed font-size 44px; `font-variant-numeric: tabular-nums` |
| M3.5 | `prefers-reduced-motion` changes nothing about the data behaviour. | `pnpm test:e2e -g @reduced-motion-year` | Identical frame output under both media states |

**Exit.** `git tag m3-green`.

---

### 11.6 M4 — Provenance and `/sources`

**Goal.** Click any number, see its papers. This is where the vertical slice closes: one dataset, through the ontology, onto the globe, into a panel with its provenance attached.

**Deliverables.** `packages/ui/Figure.tsx` rendering `{value, unit, sourceId, vintage, latencyDays, estimateKind, licence, ci}`. The provenance popover, reachable by click **and** by keyboard. `packages/policy/rules/figure-ast.ts`. `apps/web/routes/sources.tsx`. One fixture-backed regression test per known trap, bound by id.

**Demo.** "Every number on this screen is clickable, and the click shows you the paper, the vintage, the lag and the licence. Here is the page listing the three datasets we refused to ship."

**Acceptance**

| id | Statement | Command | Pass |
|---|---|---|---|
| M4.1 | No numeric literal or numeric-typed expression renders outside `<Figure>`. | `pnpm check:policy` | Passes clean; **fails on a seeded violation** — prove both directions |
| M4.2 | A missing value renders `—` with a badge, never `0`. | `pnpm test -t figure-missing` | Fixture with a deliberately absent value renders the em dash and the badge |
| M4.3 | `/sources` lists every source in the manifest with its `plan()` URLs, measured bundle size and traps. | `pnpm test:e2e -g @sources-complete` | Manifest ids ⊆ rendered ids; `plan()` output rendered as the exact URLs the system would fetch |
| M4.4 | The three exclusion rows are present by name. | `pnpm test:e2e -g @sources-exclusions` | UN DESA, UNHCR and ACLED rows render with their reasons |
| M4.5 | Each trap paragraph is bound by id to a fixture-backed test that fails if the trap stops being true. | `pnpm test --filter @exodus/connectors -t traps` | Every `trapId` in copy has a matching test; an orphan id on either side fails |

**Exit.** `git tag m4-green`. At this tag the product is already demonstrable to a stranger. Everything after this widens it.

---

### 11.7 M5 — M8

**M5 — Corridor drawer: the three ignorance channels.**
*Goal:* the screen that wins the argument. *Deliverables:* `packages/kernel/m3-disagreement.ts` (period grid), `m3b-spread.ts`, `m3c-mirror.ts`, `m5-radiation.ts` with CPC; `apps/web/routes/corridor.tsx` at `/corridor/:orig-:dest`. *Demo:* "Two models, six period points, and the size of their disagreement — plus, for EU pairs, two national statistical offices contradicting each other."

| id | Statement | Pass |
|---|---|---|
| M5.1 | Disagreement is computed on period totals only. | A test asserts `d_p` is piecewise-constant within each period and that no value exists for a corridor-year outside the shared grid; `Refusal('NoSharedPeriodGrid')` otherwise |
| M5.2 | The label is "model disagreement", with the correlation caveat permanently on screen. | A string test asserts the UI never renders "confidence interval" or "uncertainty band" adjacent to the disagreement figure |
| M5.3 | Model-internal spread is a separately named drawer-only channel. | Distinct labels present in the lexicon fixture; the two never share a visual channel |
| M5.4 | EU pairs show `migr_imm5prv[geo=B,partner=A]` and `migr_emi3nxt[geo=A,partner=B]` plus their divergence, with `OBS_FLAG` glyphs inline. | Named-pair e2e; non-EU pairs return `Refusal('NoMirrorPair')` rendered as a sentence |
| M5.5 | Dash density steps visibly at period boundaries. | Screenshot pair either side of a boundary differs above threshold |
| M5.6 | Radiation CPC renders beside the Robinson & Dilkina 0.16 reference, on a held-out year. | Figure present with the baseline adjacent |
| M5.7 | `comcol` and `col45` are a radio group. | A test asserts both cannot be selected simultaneously |
| M5.8 | Movement `LineString` with >2 vertices is rejected at construction. | Zod refinement unit test |

**M6 — `/place` and `/headroom`.**
*Goal:* pick any of 190+ countries, get a dense one-screen answer. *Deliverables:* `packages/kernel/m1-headroom.ts`, `m2-replacement.ts` with the bisection and its two guards; `apps/web/routes/{place,headroom}.tsx`. *Demo:* "Pick a country. Here is what we know, how old each thing is, and which service is the binding constraint."

| id | Statement | Pass |
|---|---|---|
| M6.1 | 12 figures render for **every** country, with `—` where absent. | Iterate all ISO3 in the manifest; zero exceptions, zero zeros-for-missing |
| M6.2 | Headroom names its binding indicator and returns `perIndicator[]` of length ≥3 or `Refusal('NoServiceStockData')`. | Kernel unit test over all countries |
| M6.3 | The Liebig minimum is taken over `K_stock` only. | A test asserts the indicator set is exactly the five stock ratios; widening it fails |
| M6.4 | Banned strings pass **against the built bundle**, not the source. | `pnpm build && pnpm check:policy --target dist` |
| M6.5 | Negative headroom renders as a warm-hue service deficit with the understatement note. | e2e on a country known to be negative |
| M6.6 | The bisection converges in ≤20 iterations at 1e-4 rel tol or returns `Refusal('NonMonotoneBisection')`. | Both guards exercised: bracket-sign and 9-point monotone scan |
| M6.7 | The WPP VarID 2 − VarID 7 differential and Sanderson–Scherbov POADR render side by side. | Golden test reproduces ESA/P/WP.160 Table 8 Scenario V for EU, Japan, Germany, USA, Italy |

**M7 — `/methods` and the policy package.**
*Goal:* the refusals page. Cheap prose, the highest persuasion per hour anywhere in this build. Do not let it slip; it is the screen that makes the rest defensible. *Deliverables:* `apps/web/routes/methods.tsx`, the `/solve` → `/methods#allocation` 301, `packages/policy/` with its six rule modules behind one file walk.

| id | Statement | Pass |
|---|---|---|
| M7.1 | The CPC scoreboard is the first thing on the page. | DOM order assertion: 0.16 / 0.16 / 0.21 / 0.22 with a production function, 0.43 / 0.40 without, plus the "roughly half the achievable accuracy" sentence |
| M7.2 | Five model cards render with `placeholder` flags, all false. | Any true `placeholder` in a shipped model fails the build |
| M7.3 | The refusal list renders with the allocation solver first, showing its objective function, the weight vector `w_E .30, w_P .25, w_N .15, w_L .10, w_H .08, w_K .05, w_F .07`, its three spec bugs and the GDPR Art. 22 constraint. | e2e text assertions |
| M7.4 | `/solve` 301s to `/methods#allocation`. | Status code 301 asserted, not 302 |
| M7.5 | The Scenario VI panel renders 5.149 billion for the Republic of Korea with the UN's own footnote, non-dismissibly. | No dismiss control exists in the DOM |
| M7.6 | `pnpm check:policy` exits non-zero on a seeded violation of **each** of the six rule modules. | Six seeded violations, six non-zero exits, one file walk |

**M8 — Connector proof, accessibility, entry.**
*Goal:* a stranger adds a source; the globe is keyboard-usable; the camera move exists. *Deliverables:* `packages/sdk/gen-connector`, `packages/connectors/demo-wdi-gdp/`, the `Shift+G` table, the 2.4s establishing camera move.

| id | Statement | Pass |
|---|---|---|
| M8.1 | `pnpm gen:connector demo-wdi-gdp && pnpm ingest --only demo-wdi-gdp && pnpm snapshot:build` runs in CI. | Sequence exits 0 |
| M8.2 | That sequence produces **zero diffs outside `packages/connectors/demo-wdi-gdp/` and `snapshot/`**. | `git status --porcelain` filtered; any other path fails |
| M8.3 | `check:dogfood` passes over `connectors/*`. | Connectors import only `@exodus/contracts` and `@exodus/sdk` |
| M8.4 | `Shift+G` yields a sorted, keyboard-navigable top-25 table with `role="application"` and `aria-describedby`. | axe-core + keyboard traversal e2e |
| M8.5 | axe-core is clean on all six routes. | Zero violations at serious or critical |
| M8.6 | No encoding is colour-alone. | Each encoded channel pairs hue with size, opacity or pattern |
| M8.7 | The entry animation is skippable by any input, once per session via `sessionStorage`, zero-length under `prefers-reduced-motion`, and animates no data mark. | Four separate assertions. **Implement this last. If it is not done, ship without it.** |

**Exit.** `git tag m5-green` … `git tag m8-green` in order. At `m8-green` the product is complete.

**M9 — OPTIONAL, FLAGGED: the live sidecar.** Only attempt this if M0–M8 are tagged and `pnpm gate:all` is green with time left over. Its checks are the only non-blocking ones in the gate table. `pnpm live` is a standalone ~150-line Node process exposing `GET /live/stream?sources=a,b` over SSE; GDELT `lastupdate.txt` on a 60s timer acting on slot change, `http://` rewritten to `https://`, translingual feed lagging one slot, **GEO 2.0 is 404 — do not build it**; GDACS read from `alertlevel`/`alertscore`/`episodealertlevel`, never the icon path; USGS at 5 minutes; backoff full jitter base 1s cap 300s, `degraded` after five failures with a struck-through legend entry that does not disappear; killing the process walks `LIVE → CACHED → SNAPSHOT` with no layer vanishing; bloom enabled only while the stream is genuinely LIVE. **If M9 does not land, the product is complete.** Do not start M9 with a red gate anywhere behind it.

---

### 11.8 Agent operating rules

These bind for the whole build. Where a rule and a milestone appear to conflict, the rule wins and you record the conflict.

**R1 — Verify every endpoint before you write code against it.** Before the first fetch in any connector, probe the URL with the network on and paste the observed status line into a comment directly above the call. The `plan()` output is what `/sources` renders; it must be the URLs the system actually fetches, not an approximation.

**R2 — HTTP 200 is not proof of correctness.** Several sources in this stack return 200 with an empty or wrong body: UNHCR returns zero rows at HTTP 200 for a missing `cf_type=ISO` or the camelCase `cfType`; Data360 silently ignores `timePeriodFrom` without `timePeriodTo`; a single-member gzip reader on WPP returns 634 bytes with no error; WHO GHO returns an unsorted array so "latest" is wrong unless you sort. **Every connector test asserts a non-empty result and a known-good spot value, never a status code alone.**

**R3 — When a source does not resolve as specified, fall back to the documented default. Never infer a schema.** Do not adapt to what looks similar. Do not write a schema from this document. For the spine, apply the §4 fallback exactly: `abel-cohen` becomes the spine, the Year Machine becomes 6 period steps, disagreement degrades to Abel & Cohen's within-method spread across `da_min_open`/`da_min_closed`/`da_pb_closed` **relabelled as within-method everywhere**, plus the Eurostat mirror as the only cross-source comparison, and `/methods` gains a refusal entry with the date and HTTP status. Then continue. Do not stall, and do not ask.

**R4 — Never leave a TODO in place of a model.** A model either runs and returns `Ok<T>`, or it returns a typed `Refusal` rendered as a sentence. There is no third state. No stub that returns a plausible number, no `// TODO: implement`, no commented-out formula, no function that throws `not implemented`. If you cannot implement a model, the honest artefact is a `Refusal` with a `RefusalCode` and a reason string, plus a `/methods` entry saying so.

**R5 — Ship no placeholder coefficient, at any magnitude, behind any badge.** No `β_dist`, `β_comlang`, `β_contig`, no Ortega & Peri value, no diaspora or visa elasticity, no migration-hump parameter. A placeholder coefficient in a dark dashboard becomes a cited coefficient within a week. The `assumptions: AssumptionSpec[]` array on every `Model` carries `placeholder: boolean`, and every shipped model has it false on every entry — M7.2 checks this.

**R6 — Commit in small logical units.** One concern per commit. As a working bound: if a commit changes more than ~400 lines or touches more than one package for reasons other than a rename, split it. Message format:

```
<type>(<package>): <imperative summary under 72 chars>

<why, not what — the diff already says what>
<check id this advances, e.g. "Advances M1.7">
```

`type ∈ {feat, fix, data, perf, test, policy, chore, docs}`. `data:` is reserved for snapshot content changes and must include the manifest diff in the body. Never write "uncertainty" in a commit message when you mean model disagreement — the banned-strings module reads commit messages too, and working around it is R14.

**R7 — Keep typecheck, lint and tests green at every commit.** `pnpm verify` before every `git commit`, no exceptions, including on a commit you intend to amend. A red tree that you intend to fix "in the next commit" is how a five-hour debugging session starts. If a change cannot be made green in one commit, the change is too large — split it (R6).

**R8 — Measure performance. Never assume it.** Every millisecond and frame-rate figure in the research is an unmeasured budget, explicitly labelled as such. The only numbers you may state are ones `packages/testkit/perf/orbit.spec.ts` produced on the machine you are on, written to `docs/perf/`. Re-measure at M0, M2, M3 and M8 and commit each result. If a measurement misses budget, apply the documented reduction (corridors 12,000 → 6,000 → 4,000) rather than lowering the target, and record which rung you are on.

**R9 — Add no dependency outside the §6 pinned list without recording an ADR.** The approved list is exactly the pinned toolchain in §6 plus the packages those pin transitively. Adding anything else requires a `DECISionRecord` entry (§11.9) stating what you tried first and why it failed, committed in the same commit as the `package.json` change. A test in `packages/testkit/deps.test.ts` asserts the union of all workspace `dependencies` equals `ALLOWED_DEPS.json`; adding a dependency without updating both files fails. Explicitly forbidden, and not reopenable by ADR: `@geoarrow/deck.gl-geoarrow`, `kepler.gl`, `maplibre-gl`, `pmtiles`, `@duckdb/duckdb-wasm`, `highs`, `glpk.js`, `lp-model`, Git LFS. Pin exactly — no `^`, no `~`, anywhere in any `package.json`.

**R10 — When blocked, take the documented default and record the assumption. Do not stop.** Every irreversible decision in this build already has a pre-decided answer: the spine fallback (§4), the cut ladder (§4), the corridor-count reduction (M0.4), the palette, the milestone order. If you hit something with no documented default, choose the option that (a) renders a refusal rather than a number, (b) shows a gap rather than an interpolation, (c) removes a capability rather than adding an assumption — in that priority order — then write the `DecisionRecord` and continue. You have no one to ask.

**R11 — Put a byte budget and a page cap on every fetch loop.** Eurostat rejects or diverts a query whose estimated cost exceeds 5,000,000 cells, so chunk by year. UNHCR's bilateral matrix is thousands of pages at `limit=250`, so an uncapped paginator runs for hours. Every loop throws on exceeding its declared budget rather than continuing quietly. Pre-aggregate at ingest; the browser never downloads raw records.

**R12 — Write code, not documents.** `DECISIONS.md`, `SNAPSHOT.md`, `PARAMETERS.md`, `BACKLOG.md` and `REUSE.toml` are the only documents in this build. No status reports, no summary markdown, no design notes, no "implementation plan" files. Everything else that needs saying goes on `/methods` or `/sources`, where users can read it. (`docs/smoke/` and `docs/perf/` hold captured evidence, not prose.)

**R13 — Do not widen scope, even when widening is easy.** Six routes exist. A seventh is a scope breach even if it takes ten minutes. Anything you think of that is not in §2 IN goes to `BACKLOG.md` as one line and no code.

**R14 — Never disable a test, skip a spec, add an inline lint suppression, or route around a policy rule.** If `check:policy` blocks a word, change the word. If a kernel test fails, the kernel is wrong. `it.skip`, `// biome-ignore`, `@ts-expect-error` outside a test that is specifically asserting a type error, and `--no-verify` are all prohibited. The M1 aggregation tests (M1.7, M1.8) exist precisely because their failure modes are silent; disabling one is how a silently wrong build ships.

**R15 — Kernel code is pure.** No `Date.now()` outside `packages/kernel/clock`, no `Math.random()` anywhere in `kernel`, no I/O, no environment reads. ESLint's `no-restricted-syntax` enforces the clock rule; a property test asserts `run(x, seed) === run(x, seed)` for every model.

**R16 — Licence compliance is code, not a promise.** `license_id` and `redistributable` are mandatory columns; a row without them fails ingest. `bundle:verify` refuses non-redistributable rows and names the source. Never download UN DESA IMS, UNHCR, IDMC, ACLED, EM-DAT, GADM, MIPEX or UNESCO bytes into `snapshot/` or `corpus/`, not even temporarily, not even to test — construct the hostile-test row synthetically with the right `source_id`.

**R17 — You cannot ask.** There is no follow-up conversation. Do not end a milestone with a question, do not write "confirm before proceeding", do not leave a decision open for a human. Apply R10 and move.

**R18 — Modules introduced by later sections of this document.** Milestones M0–M8 gate the core product, and the §10 kill list binds absolutely within `packages/{contracts,sdk,kernel,semantic,registry,store,ui,globe,policy,connectors}` and the six core routes: no allocation solver, no person-shaped type, no `solve()` stub, no fitted coefficients. Where a later section of this prompt explicitly and on the record reverses a §2 OUT decision, treat it as a post-M8 milestone with its own workspace package, its own route tree, its own schema and its own auth scope; it is built only after `m8-green`, it may not modify any M0–M8 acceptance criterion, and the reversal is recorded in `DECISIONS.md` and rendered on `/methods` beside the original refusal. If such a module cannot be built without touching a core gate, it does not ship.

---

### 11.9 Recording decisions and assumptions

Every application of a fallback, every cut-ladder rung, every dependency addition, every assumption taken under R10 gets one record appended to `DECISIONS.md`. The file is append-only; a superseded record is marked, never deleted.

```ts
// packages/cli/src/decisions.ts
export interface Evidence {
  readonly url: string;
  readonly httpStatus: number;
  readonly observedAt: string;   // ISO-8601, from the shell at the time of the probe
  readonly note: string;         // what you saw, in one line
}

export interface DecisionRecord {
  readonly id: `D-${number}`;
  readonly date: string;                 // ISO-8601 date
  readonly milestone: MilestoneId;
  readonly title: string;                // imperative, under 72 chars
  readonly context: string;              // what forced the decision
  readonly choice: string;               // what you did
  readonly rejected: readonly string[];  // what you did not do, and why
  readonly evidence: readonly Evidence[];// empty only for decisions with no external fact
  readonly affectsChecks: readonly string[]; // e.g. ['M0.2', 'M3.1']
  readonly reversible: boolean;
  readonly supersededBy?: `D-${number}`;
}
```

The rule that makes this worth doing: **an assumption that is not in `DECISIONS.md` does not exist, and a figure that depends on one must render a refusal or a badge.** If you assumed something to make a number appear, either record it and badge it, or do not render the number.

**Carried `[UNVERIFIED]` markers and what you do about each:**

| Marker | Status | Your instruction |
|---|---|---|
| Committed bundle size (the research's 45 MiB estimate was never measured) | Superseded by a hard 40 MiB cap | Measure at M0 with `pnpm snapshot:measure`; the cap is CI-enforced and the cut ladder is pre-decided. Never state a size you have not measured. |
| UNHCR licence (two verification passes produced contradictory terms) | Unresolved | Recipe connector only. Never bytes in `snapshot/`. `/sources` states the contradiction and names `webportal@unhcr.org` as the resolution path. |
| All frame-time and latency budgets in the research | Unmeasured hypotheses | R8. Only measured numbers ship, and only from `docs/perf/`. |
| `TerrainLayer` / `Tile3DLayer` on globe (two contradicting official pages) | Moot | Not in scope. Do not smoke-test what you will not ship. |
| Migration-hump functional form and its PPP base year | Author construction, no literature | Not implemented. It is on the §5 not-implemented list. |
| IDU 180-day window, JRC indicator count, admin2 geometry size | Unconfirmed | All belong to cut sources. Do not cite any of them anywhere in the product. |

---

### 11.10 Top failure modes, each with its preventive instruction

Ranked by likelihood. Each has a guard; the guard's check id is the thing that stops it reaching the build.

| # | Failure mode | Preventive instruction | Guard |
|---|---|---|---|
| 1 | Proceeding on a spine schema you could not verify — inferring column names from this document. | Assert the exact column list in `transform()`. On mismatch, fail ingest with a named error printing observed-vs-expected, then apply the §4 fallback and record it. Never infer. | M0.2, M1.1 |
| 2 | Adding easing to the year scrub because it feels better. | No `transitions` on any data accessor, ever. The handle moves continuously; the data steps. 180ms eased motion across neural-network ensemble output at 73% test correlation implies a resolution the source does not have. | M3.2 |
| 3 | An endpoint that returns HTTP 200 with silently wrong or empty data. | Assert a non-empty result and a known-good spot value in every connector test. Specifically: `cf_type=ISO` snake_case for UNHCR, `yearFrom`/`yearTo` (never `year`), multi-member gzip for WPP, sort the GHO array before taking "latest", pair `timePeriodFrom` with `timePeriodTo`. | R2, M1.6, M1.7 |
| 4 | Building the SSE server, the poll schedulers, the backoff and the degradation state machine. | v1 is a static site. The v1 ladder has two states: `SNAPSHOT` and `UNAVAILABLE`. Live is M9, optional, behind a flag, and only after `m8-green`. | §11.7 M9 gating |
| 5 | Filling a gap with `0`, an interpolation or a silent forward-fill. | `align()` defaults to `"none"`. A missing year is a visible gap on the sparkline. A missing source is `—` with a badge or a typed `Refusal` rendered as a sentence. | M4.2, M6.1 |
| 6 | A 5fps globe: per-frame layer construction, unaggregated marks, CPU geometry work while scrubbing. | Pre-quantise one buffer per animated attribute per year (34 × 12,000 × {width f32, dashArray 2×f32, color u8×4} ≈ 8 MB GPU-resident). Scrubbing swaps buffer references and bumps `updateTriggers`. Zero re-tessellation. Measure, don't assume. | M0.4, M3.1 |
| 7 | Scope sprawl: fourteen half-built panels and nothing that runs end-to-end. | Each milestone runs end-to-end from a cold install before the next begins. Six routes. Everything else is one line in `BACKLOG.md`. | R13, tag discipline |
| 8 | Fake precision: a capacity figure rendered as a scalar, at full precision, without its binding constraint. | Capacity is a per-indicator panel with the binding indicator always named. Liebig minimum over `K_stock` only — the min over all twelve indicators is ≤0 for every country on earth (216/216 at or below a 100% electricity target), which will look like a bug and get "fixed" by widening the set. | M6.2, M6.3 |
| 9 | Calling model disagreement "uncertainty" or "confidence interval". | Both models are fitted to the same underlying stock tables; their agreement is correlated, so the band is a lower bound on true uncertainty. The permanent caveat is on screen. Do not work around the linter — change the word. | M5.2, M7.6 |
| 10 | Annualising Abel & Cohen, or comparing it to the spine at annual resolution. | Period totals only. Six period points. Step function held constant within each period. Corridor-years outside the shared grid return `Refusal('NoSharedPeriodGrid')`. | M5.1 |
| 11 | Summing Abel & Cohen across `type ∈ {outward, return, transit}` (triple-counts) or forgetting to sum across `sex` (there is no total row). | Both are unit-tested at M1. Do not disable the test. | M1.8 |
| 12 | A single-member gzip reader on WPP — returns 634 bytes and no error. | The assertion is row count **> 600,000**, not "no exception". | M1.7 |
| 13 | Ethics treated as documentation: a `CONDUCT.md` and some CI scripts. | `@exodus/policy` is an importable, unit-tested package with six rule modules behind one file walk, running over source, copy, the built bundle, package names, route paths and asset filenames. A third-party layer inherits every rule without its author reading anything. | M7.6, M6.4 |
| 14 | Twelve bespoke CI scripts. | One binary, six rule modules, one file walk. If a gate needs its own project, it does not ship in v1. | R9, M7.6 |
| 15 | A licence contamination event: one IDMC, UNESCO or ACLED file in `snapshot/` or `corpus/` makes the whole data component non-redistributable. | `license_id` and `redistributable` are mandatory columns; `bundle:verify` refuses and names the reason. Never disable it "temporarily". | M1.3, M1.4 |
| 16 | Git LFS, for anything, for any reason. | Forking and pulling counts against the parent repository's bandwidth until `git clone` breaks for everyone. Tier B is a GitHub Release asset. | R9 (non-reopenable) |
| 17 | Unreadable dark UI: contrast ratios computed against a flat surface but rendered over a WebGL canvas. | `--scrim-globe: rgba(6,8,12,.72)` behind every label over the canvas; `--border-interactive #5C6B85` (3.58:1) around every interactive control; `--border-default` is 1.50:1 and decorative only. | M8.5 |
| 18 | Rendering a Missing Migrants coordinate, a route with >2 vertices, an H3 people layer finer than r3, or a nationality cross-tab below ADM0. | Four geometry rules, four tests. Coordinates are dropped at ingest, not at render. | M5.8, M2.2, M7.6 |

---

### 11.11 Self-review rubric and definition of done

**Run this rubric in full before you declare the build complete.** Every line is a binary verdict with a command behind it. A single NO means not done — fix it and re-run the whole rubric, not just the failing line.

| # | Question | How you answer it | Verdict |
|---|---|---|---|
| 1 | Does a cold clone render the whole product with the network off? | `git clean -xfd && pnpm i --offline && pnpm build && pnpm test:e2e -g @offline-boot` with networking disabled at the container level | YES / NO |
| 2 | Is every gate green from M0 to M8, in one run? | `pnpm gate:all` | YES / NO |
| 3 | Is every number on every screen inside a `<Figure>` with real provenance? | `pnpm check:policy`, then open each of the six routes and click three numbers at random | YES / NO |
| 4 | Does every absent value render `—` or a refusal sentence, and never `0`? | Grep the rendered DOM of all six routes for a `0` in a figure slot; inspect each hit | YES / NO |
| 5 | Are all three refusal paths exercised and rendered as prose? | `pnpm test -t refusal` — `NoServiceStockData`, `NonMonotoneBisection`, `NoSharedPeriodGrid` | YES / NO |
| 6 | Does the disagreement channel never borrow the language of uncertainty? | `pnpm check:policy` plus a manual read of every tooltip and caption on `/corridor/:orig-:dest` | YES / NO |
| 7 | Are the measured frame numbers in `docs/perf/` from this machine, this build, this commit? | Compare `git rev-parse HEAD` against the `commit` field in each perf JSON | YES / NO |
| 8 | Is the committed bundle under 40 MiB, measured, with the applied cut-ladder rungs recorded? | `pnpm snapshot:measure` and read `SNAPSHOT.md` | YES / NO |
| 9 | Does `bundle:verify` still refuse the hostile row, and name the reason? | `pnpm test -t bundle-verify-hostile` and read the stderr yourself | YES / NO |
| 10 | Is there a single `TODO`, `FIXME`, `it.skip`, `xit`, `describe.skip`, `@ts-expect-error` outside a type-assertion test, or lint suppression anywhere in the tree? | `rg -n 'TODO\|FIXME\|it\.skip\|xit(\|describe\.skip\|biome-ignore\|ts-expect-error\|eslint-disable'` | Must be **zero** |
| 11 | Does every dependency in every `package.json` appear in `ALLOWED_DEPS.json`, pinned exactly, with no `^` or `~`? | `pnpm test -t deps-allowlist` | YES / NO |
| 12 | Does `DECISIONS.md` contain a record for every fallback, cut rung, assumption and dependency addition actually applied? | Read the file against `git log --oneline` and the perf/measure outputs | YES / NO |
| 13 | Does the connector proof produce zero diffs outside its own package and `snapshot/`? | `pnpm gen:connector demo-wdi-gdp && pnpm ingest --only demo-wdi-gdp && pnpm snapshot:build && git status --porcelain` | YES / NO |
| 14 | Is axe-core clean on all six routes, and is `Shift+G` fully keyboard-operable? | `pnpm test:e2e -g @a11y`, then traverse the table with the keyboard yourself | YES / NO |
| 15 | Read your own diff as a hostile critic: find the one place where you rendered a number you could not fully defend. | `git diff m0-green..HEAD -- '*.tsx'` — read every `<Figure>` call site | Name it, then fix or refuse it |
| 16 | Does any screen imply a resolution, freshness or authority the data does not have? | Open all six routes and ask, per mark: what cadence is this, what is its oldest vintage, and does the mark say so? | YES / NO |

**Definition of done.** All of the following, simultaneously, on one commit:

- [ ] `m0-green` through `m8-green` tagged, in order, each on a commit where `pnpm verify` and `pnpm gate:m<N>` were both green.
- [ ] `pnpm gate:all` green from a cold clone with `--network=none`.
- [ ] `pnpm snapshot:measure` under 40 MiB, printed per table, published to `/sources`.
- [ ] `pnpm check:policy` exits 0 over source, copy, the built bundle, package names, route paths and asset filenames — and exits non-zero on a seeded violation of each of its six rule modules.
- [ ] `pnpm check:dogfood` green over `connectors/*`.
- [ ] Six routes exist. `/solve` 301s to `/methods#allocation`. `/plugins`, `/compare`, `/brief`, `/graph`, `/studio` and `/o/*` return nothing because they were never built.
- [ ] Five models implemented, all pure, all seeded, every `AssumptionSpec.placeholder` false.
- [ ] Rubric §11.11 answered YES on every line, with line 15 named and resolved.
- [ ] `DECISIONS.md`, `SNAPSHOT.md`, `PARAMETERS.md`, `BACKLOG.md`, `REUSE.toml` present and current. No other document added.
- [ ] `git status --porcelain` is empty.

---

### 11.12 The first five commands

Run these in order, before writing any product code. Commands 2 through 4 are the M0 network-on probes; they exist because an offline agent cannot verify a June 2026 DOI, and because the cost of guessing is every downstream figure.

```bash
# 1. Pin and confirm the toolchain. Both lines must match exactly; if not, fix the
#    environment before anything else. Then take the repository off the banned name:
#    the lexicon module runs over the repository name, and a name that fails your own
#    CI gate is the first credibility hole a critic finds.
node -v && corepack use pnpm@12.4.2 && pnpm -v && git rev-parse --show-toplevel
#    expect: v24.21.0  /  12.4.2

# 2. Resolve the spine DOI with the network on and keep the whole redirect chain.
mkdir -p docs/smoke docs/perf && \
curl -sSIL --max-time 60 https://doi.org/10.5281/zenodo.17344747 \
  | tee docs/smoke/m0-spine-resolve.txt

# 3. Read the spine header WITHOUT downloading 145,597,904 bytes. Set GA_URL to the
#    file URL for mig_bilateral.csv as shown on the record resolved in step 2 — read it,
#    do not construct it. `head -c` closes the pipe, so this aborts early even if the
#    server ignores Range.
export GA_URL='<the mig_bilateral.csv URL observed in step 2>' && \
curl -sS --max-time 180 -r 0-131071 "$GA_URL" | head -c 131072 > /tmp/ga-head.csv && \
head -n 1 /tmp/ga-head.csv | tee docs/smoke/m0-spine-header.txt
#    expect exactly: ,orig,dest,year,stock_mean,stock_std,mig_prev,mig_prev_std,mig_brth,mig_brth_std
#    anything else -> apply the §4 fallback, write D-002, continue. Do NOT infer columns.

# 4. Prove the fallback exists before you might need it.
curl -sSI --max-time 120 https://ndownloader.figshare.com/files/53236079 \
  | tee docs/smoke/m0-fallback-resolve.txt
#    expect: 2xx (after redirect) and content-length 65341478

# 5. Commit the pinned toolchain and the M0 evidence as the first unit of work.
printf '24.21.0\n' > .nvmrc && \
git add .nvmrc docs/smoke && \
git commit -s -m "chore(repo): pin node 24.21.0 / pnpm 12.4.2 and record M0 spine probes" \
  -m "Network-on resolution of the spine DOI and its pre-decided fallback, captured verbatim before any product code. Advances M0.1, M0.2."
```

After command 5, scaffold the workspace to the §6 package layout, write `packages/testkit/perf/orbit.spec.ts`, and finish M0. Do not write a connector, a route, a model or a `<Figure>` until `pnpm gate:m0` is green and `m0-green` is tagged.


---

## 12. The Placement & Solidarity module (`@exodus/placement`)

### 12.0 Why this section exists, and what it overrides

The design in `docs/design/04-FINAL-mvp-design.md` put the allocation optimiser at the top of its OUT list, arguing that absence beats mitigation because a placement solver can function as a migration-control targeting tool.

**That decision is overridden by the product owner, deliberately and on the record.** The purpose of this module is to *help migrants* — to raise the probability that a person who has already been granted admission lands somewhere they can work, be understood, reach a relative, and get the health and schooling their family needs. That is the documented effect of every deployed system in this class, and refusing to build it does not prevent a worse system being built by someone who will not ship the guardrails.

The objection was nonetheless correct about the *mechanism* of harm. So this module is built with the harm made **architecturally unrepresentable** rather than merely discouraged. Three amendments to the authoritative design follow, and they bind:

| Design rule | Amendment |
|---|---|
| OUT #1 — no allocation solver | **Reversed.** The solver is IN, as `@exodus/placement`, a separate workspace package and a separate route tree. |
| "no person-shaped type anywhere in the schema" | **Preserved for `@exodus/semantic`.** The public globe, `/place`, `/corridor`, `/headroom`, `/sources` and `/methods` still contain zero person-shaped types. Person-shaped types exist **only** in `@exodus/placement`, under a different schema, a different auth scope and a different visual chrome. The two never share a table, a store or a build artefact. |
| `RefusalCode` closed at five codes | **Extended to eight**, and closed again. The three additions are named in §12.6. No ninth. |

`OUT #4` (no live layer) and `OUT #7` (no Scenario Studio, no Compare, no Brief) **remain cut** and are not reopened by this section.

### 12.1 What this module is, and the three things it is not

It takes a set of **cases** (a case is a family unit that moves together — never an individual) who **already hold an affirmative legal basis to be admitted**, and a set of **localities** with declared, multidimensional capacity, and returns for each case a **ranked shortlist of three localities** with a per-term explanation of why each scored as it did.

It is **not**:

1. **Not a decision system.** `solve()` cannot commit a placement. There is no code path from the solver to `commitPlacement()` that does not pass through a human actor id and a stored free-text reason. This is a GDPR Article 22 requirement, and state it in the Regulation's own terms: a data subject has the right not to be subject to a decision based **solely** on automated processing which produces legal effects concerning them or similarly significantly affects them. "GDPR requires a human in the loop" is a shorthand a regulator will not accept.
2. **Not a border or removal tool.** See §12.6.1 — the legal-basis enum has no value that could express one.
3. **Not a forecaster of who will move.** It allocates people who are already coming. There is no departure prediction anywhere in this module.

### 12.2 Architectural separation — build this first, before any solver code

```
packages/
  placement/
    schema/        # Case, Locality, Capacity, Consent, Preference — person-shaped, never imported by semantic/
    kernel/        # M6–M9, pure functions, Result<T> = Ok<T> | Refusal
    solver/        # HiGHS WASM worker boundary
    audit/         # append-only hash-chained log
apps/
  placement/       # separate route tree, separate auth scope, separate chrome
```

Enforce the separation mechanically, not by convention:

- **Dependency rule, CI-enforced:** `@exodus/semantic` and `@exodus/kernel` MUST NOT import from `@exodus/placement/*`. Add the edge to the existing dependency-cruiser config as a `forbidden` rule. *Accept:* a seeded import in `packages/semantic` fails `pnpm check:deps` with a named error.
- **Chrome rule:** every route under `apps/placement` renders a persistent, non-dismissible banner. In sandbox mode the words are exactly `SIMULATION — NOT AN ORDER`. *Accept:* a Playwright test asserts the banner is present and has a computed opacity ≥ 0.9 on every placement route, and that no runtime flag promotes a sandbox scenario into an operational batch.
- **Auth rule:** operational mode requires an authenticated actor with role `caseworker` or `supervisor`. The public build (`pnpm build`) **excludes `apps/placement` entirely** — the deployed static site that carries the globe ships no placement code at all. *Accept:* `pnpm build && grep -r "highs" dist/` returns nothing.

### 12.3 Ontology extension (lives only in `@exodus/placement/schema`)

```ts
/** A case is the atomic unit of assignment: the family that moves together.
 *  Never model an individual as the assignment unit — that breaks family unity,
 *  which is the entire contribution of Delacrétaz, Kominers & Teytelboym,
 *  American Economic Review 113(10):2689–2717 (2023), DOI 10.1257/aer.20210096. */
export interface Case {
  readonly id: CaseId;                    // opaque pseudonym; never a name, never a case-file number
  readonly persons: number;               // ≥ 1
  readonly demand: Readonly<Record<CapacityDim, number>>;   // s_id
  readonly required: readonly ServiceReq[];                 // hard gate, see C3
  readonly languages: readonly Iso639_3[];
  readonly legalBasis: DestinationLegalBasis;               // closed enum, §12.6.1
  readonly consent: ConsentRecord | null;                   // gate, not a score
  readonly preference: PreferenceSet;                       // §12.5
  readonly linkedTo: readonly CaseId[];                     // extended family, drives C4
}

export const CAPACITY_DIMS = [
  'beds', 'school_places', 'primary_care_slots',
  'language_course_seats', 'accessible_housing', 'protected_category_slots',
] as const;
export type CapacityDim = (typeof CAPACITY_DIMS)[number];

export interface Locality {
  readonly id: LocalityId;
  readonly placeId: PlaceId;              // FK into @exodus/semantic Place — the ONLY join between the two schemas
  readonly capacity: Readonly<Record<CapacityDim, number>>;  // c_jd
  readonly servicesOffered: readonly ServiceReq[];
  readonly languagesServed: readonly Iso639_3[];
  readonly population: number;            // pop_j, for the C6 concentration cap
  readonly pledge: number | null;         // ℓ_j, drives the C5 anti-dumping floor
}

export interface ConsentRecord {
  readonly id: ConsentId;
  readonly recordedAt: IsoDate;
  readonly withdrawable: true;            // literal — withdrawal always re-opens the case and triggers re-solve
}
```

**The geography layer is pluggable and this is not optional.** The Dutch deployment allocates across **35 labour-market regions**, not NUTS-3. `Locality` binds to a `PlaceId` at whatever resolution the deployment declares. Do not hard-code NUTS-3.

### 12.4 The models: M6–M9

These continue the M1–M5 sequence in `@exodus/kernel` and follow the same contract — pure functions, deterministic, `Result<T> = Ok<T> | Refusal`, every returned figure carrying its provenance.

#### M6 — candidate generation and hard gates

```ts
export function generateCandidates(
  cases: readonly Case[], localities: readonly Locality[], opts: { K: number },
): Result<Map<CaseId, readonly LocalityId[]>>;
```

Applies the four hard gates **before** any scoring, by removing `j` from `C_i` — never as a constraint row, never as a penalty weight:

- **C3 minimum service** — every `q ∈ required_i` absent at `j` removes `j`.
- **C9 non-refoulement** — `j` is removed unless the destination state carries an affirmative admission legal basis for this case, and is removed outright if under a current UNHCR non-return position or an ECtHR Rule 39 interim measure. Anchors: 1951 Refugee Convention Art. 33(1); ECHR Art. 3; EU Charter Art. 19(2).
- **C10 consent** — if `consent_i` is null, `C_i = ∅` and the case returns `Refusal('NoConsentRecord')`.
- **Veto** — every locality on the case's veto list is removed. Unlimited length. No score overrides it.

Then keeps the **top K = 20** by a cheap pre-score. This pruning is the core performance trick, not an optimisation detail: 2,000 cases × 400 localities is **800,000 binaries** unpruned; at K=20 it is **40,000 binaries** and roughly **300,000 nonzeros** once the six capacity dimensions are counted (each `x_ij` appears in C1 and in each of six C2 rows).

#### M7 — per-(i,j) scoring

Six terms, each normalised to [0,1] before weighting:

| Term | Meaning |
|---|---|
| `E_ij` | Predicted probability of employment / income adequacy at 90 days. Gradient-boosted trees or regularised logit on historical placements. |
| `N_ij` | Diaspora and kinship tie strength: log of co-national population at `j`, plus an explicit named-contact bonus, min-max scaled. |
| `L_ij` | Language-service match — fraction of the case's languages served at `j`. |
| `H_ij` | Health, disability and trauma-service match. |
| `P_ij` | **Preference satisfaction.** If the case ranked `j` at position `r` of `R_i`, then `P_ij = 1 − (r−1)/R_i`; otherwise `0`. |
| `K_ij` | Per-capita placement + first-year support cost, min-max scaled, entering negatively. |

**`E_ij` MUST NOT be trained on nationality, ethnicity, religion, gender or marital status.** Hold them out of the feature set entirely. Then run the **proxy audit**: fit an adversary predicting each protected attribute from the model score plus the features; if any AUC > **0.65**, CI blocks the build. Document 0.65 as a **project convention, not a standard** — no literature source sets it.

This answers a specific, published finding, and cite it in the model card: Alajak, Burnazoglu, Leurs & van Schie, *GeoMatch/MisMatch: A Critical Investigation of a Refugee Resettlement and Labour Market Integration Algorithm in the Netherlands*, **Social Inclusion 14 (2026), art. 10923**, DOI `10.17645/si.10923`, which found the Dutch deployment "prioritises aggregate optimisation over individual opportunities, with a disproportionate risk of discrimination on the basis of ethnicity, gender, or marital status," and reduced the capacity of both refugees and caseworkers to contest decisions.

#### M8 — the MILP

**Decision variables.** `x_ij ∈ {0,1}` for `j ∈ C_i`; `u_jd ≥ 0` capacity slack; `v_i ∈ {0,1}` unplaced (soft, big-M); `t ≥ 0` max-min fairness level; `δ_m ≥ 0` key deviation; `z_jd ≥ 0` congestion.

**Objective (maximise):**

```
max  Σ_i Σ_{j∈C_i} ( w_E·E_ij + w_N·N_ij + w_L·L_ij + w_H·H_ij + w_P·P_ij − w_K·K_ij ) · x_ij
   + w_F·t
   − w_U·Σ_i v_i
   − w_S·Σ_j Σ_d z_jd
   − w_Q·Σ_m δ_m
```

**Constraints.**

| # | Constraint | Form |
|---|---|---|
| C1 | Assignment | `Σ_{j∈C_i} x_ij + v_i = 1  ∀i` |
| C2 | Multidimensional capacity | `Σ_i s_id·x_ij + u_jd = c_jd  ∀j,d` |
| C3 | Minimum service | Precomputed in M6 as candidate-set removal — **not a constraint row** |
| C4 | Family unity | `x_ij = x_i'j  ∀j`, for `(i,i') ∈ Link` |
| C5 | Anti-dumping floor | `Σ_i x_ij ≥ ℓ_j`, only where locality `j` pledged `ℓ_j` |
| C6 | Anti-concentration cap | `Σ_i persons_i·x_ij ≤ ρ·pop_j`, default `ρ = 0.02` **per solve round** — state the window in the UI, because 2% per round and 2% per year are different policies |
| C7 | Group fairness (max-min on group mean predicted outcome) | `(1/\|I_g\|)·Σ_{i∈I_g}Σ_j E_ij·x_ij ≥ t  ∀g∈G` |
| C8 | Responsibility-sharing key | **Two linear rows, never an absolute value:** `Σ_{j∈m}Σ_i persons_i·x_ij − key_m·TotalPersons ≤ δ_m` and `key_m·TotalPersons − Σ_{j∈m}Σ_i persons_i·x_ij ≤ δ_m`, `δ_m ≥ 0`. **Report `δ_m`; never silently enforce it.** |
| C9 | Non-refoulement | Precomputed in M6 as candidate-set removal |
| C10 | Consent | Precomputed in M6 as candidate-set removal |
| — | **Congestion definition** | `z_jd ≥ (Σ_i s_id·x_ij) − θ·c_jd`, `z_jd ≥ 0`, default `θ = 0.85`. Without this row the objective's `z_jd` term is undefined and the model will not build. |

**Weights.** Defaults `w_E=0.30, w_P=0.25, w_N=0.15, w_L=0.10, w_H=0.08, w_K=0.05, w_F=0.07` — these seven sum to exactly 1.00. `w_U=1000` (big-M), `w_S=0.02` and `w_Q=0.10` sit **outside** that normalisation; do not describe all ten as summing to one. **Never hard-code any of them** — read from a signed `weights.json`, and changing it requires the two-key ritual in §12.6.9.

**Do not rely on LP integrality.** The transportation / total-unimodularity argument holds only for unit case sizes on a single capacity dimension. Integer multi-person cases across six dimensions destroy the network structure, and C4, C5, C6 and C7 each destroy it again independently. **MILP is required in every realistic configuration.** Always surface the achieved MIP gap in the UI.

#### M9 — responsibility-sharing keys

A pluggable, reportable layer with three presets:

| Preset | Formula |
|---|---|
| **EU 2015 Commission proposal** | `0.40·pop + 0.40·GDP + 0.10·avgAsylumApps(2010–14) + 0.10·unemploymentRate`, each normalised to the EU-28 total. Label it as the **proposed** key — the annexes to Council Decisions (EU) 2015/1523 and (EU) 2015/1601 carried politically negotiated per-state numbers, not this formula's output. |
| **AMMR Art. 66** | `50% population + 50% GDP` on latest available Eurostat data; formula in Annex I of Regulation (EU) 2024/1351. |
| **User-defined** | Any weighting, audited. |

Seed the module with the verified first Annual Solidarity Pool — Council Implementing Decision (EU) 2025/2642 of 19 Dec 2025: **21,000 relocations and EUR 420,000,000**, applying **from 12 June 2026** (Art. 2); pressure states **Greece, Spain, Italy, Cyprus**; an indicative **42%** SAR earmark; Germany pledged 4,555 against a 21.6890% fair share, France 3,361 against 16.0021%; Hungary and Slovakia recorded no pledge, while Czechia, Croatia, Austria and Poland show an adjusted 0.

Three accuracy requirements, each of which the source research caught the first draft getting wrong:

- **Do not call the 2026 pool "below the statutory floor."** The 30,000 / EUR 600m minimum in AMMR Art. 12(2) binds the **Commission's proposal**, not the Council's adopted pool; recital 10 attributes the smaller first pool to a part-year cycle.
- **The Regulation applies from 1 July 2026** (Art. 85), not 12 June 2026. The 12 June 2026 date belongs to the Implementing Decision. Articles 7–15 and 56–57 have applied since 11 June 2024.
- **The 2015 relocation denominator is ambiguous** — Decision (EU) 2016/1754 let states offset against Syrians admitted from Turkey, making the operative target ~106,000 rather than the nominal 160,000. 33,846 were relocated as of 7 March 2018. That is ~22% of 160,000 or ~33% of ~106,000. **Report both denominators or neither.**

**Product insight to build around:** the key produces an *indicative* number and the pledge produces the *real* one. **The gap between them is the interesting variable.** Model and render both. The 2015 mechanism's failure was not algorithmic — it was no refugee preferences (hence secondary movement), no host-community preferences (hence no local buy-in), binary compliance with no menu of contributions, and a key computed once, centrally, opaquely. Build against all four.

### 12.5 Preference representation — the anti-people-shuffling requirement

Three distinct objects. **Never conflate them.**

1. **Veto list** — hard, unlimited, removes the locality from `C_i`. No score overrides it.
2. **Ranked menu** — the case ranks up to `R_i` localities from an offered menu. Feeds `P_ij`. If `R_i = 0` the case is "no stated preference", `P_ij = 0` uniformly, **and that fact is displayed, not hidden.**
3. **Attribute-level wishes** (coastal, urban, near a mosque, near a named relative) — expand into `N_ij` and into menu construction. **Never enter the objective directly.**

**Preference-coverage KPI:** the percentage of cases with `R_i ≥ 3`, displayed next to the employment-gain figure **at equal visual weight**.

**Hard block:** any operational country-scale run where median `R_i = 0` is refused with `Refusal('NoPreferenceCoverage')`. That configuration is a people-shuffler and the product must decline to be one. *Accept:* a fixture with all-empty preference sets returns the refusal and renders it as a sentence.

Do not let the UI promise choice it cannot deliver. It offers a **menu and a veto**, and it says so in those words.

### 12.6 Guardrails — testable product requirements, not principles

1. **Deportation must be unrepresentable.** `DestinationLegalBasis` is a closed enum of admission types only: `resettlement`, `relocation_intra_state`, `relocation_inter_state`, `complementary_pathway`, `labour_mobility`, `family_reunification`, `community_sponsorship`. There is no `return`, `readmission`, `transit` or `offshore_processing` value, and adding one is a breaking change that fails the policy linter. *Accept:* an import fixture with `legal_basis: null` or an unknown value fails with a named error and **zero rows written**.
2. **Non-refoulement pre-filter (C9).** A seeded UNHCR non-return advisory strips every affected `x_ij` column and renders a red blocking banner. *Accept:* the seeded-advisory test asserts the columns are gone from the model, not merely penalised.
3. **Consent is a gate (C10).** No assignment without a stored consent record id; withdrawal re-opens the case and triggers re-solve.
4. **Human decision required.** `solve()` returns a **ranked shortlist of three** with scores and reasons. It never writes a committed placement. *Accept:* no code path from `solve()` to `commitPlacement()` without a human actor id and a stored override reason. Override rate and reasons are published as an aggregate metric.
5. **Per-case explanation.** For each recommendation, show the objective decomposed by term (E/N/L/H/P/K, absolute contributions summing to the score), plus the runner-up and **the single term that decided it**. This is the direct, buildable answer to the contestability finding in Alajak et al.
6. **Protected attributes are never features.** Per M7, plus the adversary-AUC ≤ 0.65 CI gate.
7. **Group-fairness floor on by default (C7)**, with the **price of fairness computed per run and displayed**. Freund, Lykouris, Paulson, Sturt & Weng (*Group fairness in dynamic refugee assignment*, arXiv 2301.10642) report "substantial improvements in group fairness … with only small relative decreases (≈1%–5%) in global performance" — but that figure is specific to their group definitions, their bid-price algorithms and US + Netherlands data. **It is not a constant. Never display it as one.** Compute your own.
8. **Anti-dumping floor (C5) and anti-concentration cap (C6) always on**, `ρ` default 0.02 with its time window stated, all changes audited.
9. **Two-key changes.** Editing `weights.json`, disabling the fairness floor, or enabling the tradable-quota scenario requires two authenticated roles and writes an append-only, hash-chained audit entry. Every accepted batch publishes: weight vector, model version, dataset vintages, MIP gap, fairness slack, and key deviation `δ_m`.
10. **No individual-level export, ever.** The API emits opaque pseudonyms. Public aggregates suppress cells with **k < 10**. *Accept:* a request for any cell with n < 10 returns `SUPPRESSED`, not a number. No individual tracks, no vessel-level or person-level trajectories, anywhere, ever.
11. **Simulation and operations are physically separated** — §12.2.
12. **EU AI Act posture — state it accurately or not at all.** An allocation tool used by a public authority sits **adjacent to**, and not squarely inside, Annex III point 7 of Regulation (EU) 2024/1689, whose four limbs cover polygraphs, risk assessment of a natural person entering a Member State, assisting authorities examining asylum/visa/residence applications, and person detection or identification in the migration context. A placement optimiser for people already admitted is not plainly any of them. **Get a legal opinion; do not assert the classification in either direction.** Annex III high-risk obligations now apply from **2 December 2027** following Regulation (EU) 2026/1744 (Digital Omnibus on AI, OJ 24 July 2026). Build the Art. 9–15 artefacts now, as files: `/compliance/ai-act/{risk-management,data-governance,technical-documentation,logging,human-oversight,accuracy-robustness}.md`, plus a GDPR Art. 35 DPIA template pre-filled for this processing.
13. **Licensing honesty.** This module follows the repository's licence split (§9/§10): **AGPL-3.0-or-later**, like all other application code, with only `contracts` and `connectors/_template` under Apache-2.0 for the patent grant. Do not license `@exodus/placement` permissively — the network-use clause is the point for a module institutions will self-host. Say plainly in `GOVERNANCE.md` that OSI-approved licences **cannot** restrict fields of use (Open Source Definition clause 6) and that ethical-source licences such as Hippocratic are not OSI-approved — **governance is the real control, not licence text**. Name an ethics board and a documented deployment-support-revocation process.
14. **Contestability.** Every placed case gets a human-readable reason sheet and a named route to challenge it. Log challenges; publish the challenge-and-reversal rate. *A system that can allocate but cannot be appealed is a containment planner regardless of its objective function.*

#### 12.6.1 The three new refusal codes

Extending `RefusalCode` from five to eight, then closed again: `NoConsentRecord`, `NoPreferenceCoverage`, `NoLegalBasis`. Each renders as a sentence, never as `0`, never interpolated. Do not add a ninth.

### 12.7 Solver, sizing and budgets

| Library | Version | Licence | Verdict |
|---|---|---|---|
| **`highs` (highs-js)** | 1.15.3 (2026-09-11) | **MIT** | **Primary.** LP/MILP/QP via WASM, embeds HiGHS 1.15.x, Node ≥18. CDN `https://cdn.jsdelivr.net/npm/highs/build/highs.js`. |
| `lp-model` | 0.4.2 | MIT | Modelling layer; reads/writes CPLEX LP format, drives highs-js. |
| `javascript-lp-solver` | 1.0.3 | Unlicense | Zero-dependency fallback when WASM is blocked. |
| `munkres-js` | 1.2.2 | Apache-2.0 OR BSD-3-Clause | Pure 1:1 fallback only. |
| `glpk.js` | 5.0.0 | **GPL-3.0** | **Do not use.** Copyleft contaminates the dashboard's licence. |

Also: `github.com/pgoelz/dynamicrefugees` carries **no licence file** and is therefore all-rights-reserved. **Read it for method; do not copy or vendor it.**

**Run the solver in a Web Worker. Never on the main thread.**

| Mode | Instance | Target | Hard cap | Technique |
|---|---|---|---|---|
| Interactive country | ≤2,000 cases × ≤400 localities, K=20 | p50 ≤ 1.5 s, p95 ≤ 5 s | 10 s, then return incumbent | HiGHS MILP, presolve on, `mip_rel_gap = 0.01`, time limit 8 s |
| Region / EU | ≤50,000 × ≤5,000 | ≤ 60 s | 180 s | Decompose per receiving state into parallel workers; coordinate C2/C8 duals with a bid-price loop |
| Online arrivals | 1 case at a time | ≤ 200 ms | 1 s | Cached bid prices, duals refreshed every 50 arrivals or on capacity change |

**Every latency figure in this table is an engineering extrapolation from problem size, not a measurement.** Treat them as hypotheses and benchmark on real hardware before any of them appears in a contract, an SLA or a funding document. Return the incumbent with its gap displayed rather than blocking the UI.

### 12.8 Effect sizes — the honesty requirement that decides this module's credibility

The literature reports large gains. It is also under live, serious challenge. **Cite both sides or cite neither.**

| Finding | Source |
|---|---|
| ~+40% (US) and ~+75% (Switzerland) employment vs status quo, out-of-sample; Swiss 2013 entrants 15% → 26% | Bansak, Ferwerda, Hainmueller, Dillon, Hangartner, Lawrence & Weinstein, **Science 359(6373):325–329 (2018)**, DOI `10.1126/science.aao4408` |
| **Annie™ MOORE** (*Matching for Outcome Optimization and Refugee Empowerment*), live at HIAS since 2018, 1,100+ refugees matched: +22% to +38% relative, backtested on the 496 refugees HIAS resettled in 2017, of whom 159 found work within 90 days | Ahani, Andersson, Martinello, Teytelboym & Trapp, **Operations Research 69(5):1468–1486 (2021)**, DOI `10.1287/opre.2020.2093` |
| Dynamic placement reaches >98% of hindsight-optimal employment vs <90% for greedy practice | Ahani, Gölz, Procaccia, Teytelboym & Trapp, **Operations Research 72(3):1087–1104 (2024)** |
| Preference-based mechanisms improve match efficiency, respect community priorities, and incentivise truthful reporting | Delacrétaz, Kominers & Teytelboym, **AER 113(10):2689–2717 (2023)**, DOI `10.1257/aer.20210096` |
| **Robustness defence:** across IPW and multiple AIPW specifications, "the impact estimates remain consistent in magnitude in all scenarios as well as statistically significant in most cases" | **arXiv 2605.06686** (2026-04-25). Note: by the original authors, and it varies the *estimator*, not the evaluation paradigm. |
| **The attack:** a synthetic refugee-matching environment calibrated to the real setting but built so that **no policy can beat random** still produced "large, stable gains of around 60% … on par with improvements of 22–75% reported in the literature" under model-based evaluation | Bastani, Bastani & McLaughlin, *Winner's Curse Drives False Promises in Data-Driven Decisions: A Case Study in Refugee Matching*, **arXiv 2602.08892** (2026-02-09) |

**Binding requirement.** No number in this module's UI may be presented as an expected effect of deployment. Every displayed effect size carries the label **"off-policy backtest estimate, contested"** and links to `/methods#matching-evidence`, which presents both arXiv papers side by side. **No RCT has been published in this field.** Omitting the winner's-curse paper while citing the robustness paper is precisely the failure mode this entire product was built to prevent — and a reviewer will notice.

*Accept:* a string test asserts that every rendered percentage in `apps/placement` is adjacent to the contested-estimate label; the `/methods#matching-evidence` route renders both citations.

### 12.9 Screens

Three routes, added to the six in §3. All under `apps/placement`, all behind auth, all carrying the chrome banner.

| Route | Screen | The question it answers |
|---|---|---|
| `/placement/cohort/:id` | **Cohort workspace** | *For this set of cases and this set of localities, what does the model recommend, and how confident is the solve?* Shows MIP gap, preference coverage %, price of fairness, key deviation `δ_m`, and unplaced count — all five, always, never collapsed into one score. |
| `/placement/case/:id` | **Case sheet** | *Why these three localities for this family, and what single term decided it?* Per-term decomposition, runner-up, veto list, consent status, and the challenge route. |
| `/placement/solidarity` | **Solidarity ledger** | *What is each state's indicative fair share under the selected key, what did it actually pledge, and how big is the gap?* |

`/solve` no longer 301s to `/methods#allocation`; it redirects to `/placement`. Update the §3 route table and the `/methods` copy accordingly: the allocation solver moves out of the refusals list and into the model cards, and `/methods` must instead explain the guardrails and name what the module still refuses to do.

### 12.10 Milestone and acceptance

Insert as **M9**, after the public product is green — the globe, `/sources` and `/methods` ship first and stand alone. The placement module must never be on the critical path of the public site.

M9 was previously reserved for the optional live-signal sidecar. **That sidecar is cut and is not rescheduled**, so M9 is free; §8's latency taxonomy still ships, because the incident ribbon renders from the committed corpus and needs it. Nothing else in the milestone sequence moves.

**Definition of done for M9:**

1. `pnpm check:deps` fails on a seeded `semantic → placement` import.
2. `pnpm build` produces a public bundle containing no solver code.
3. The legal-basis fixture test writes zero rows on an unknown value.
4. The seeded non-return advisory strips columns from the model.
5. There is no `solve()` → `commitPlacement()` path without a human actor id.
6. The adversary-AUC gate blocks the build at > 0.65.
7. A median-`R_i`-of-0 cohort returns `Refusal('NoPreferenceCoverage')` as prose.
8. A k < 10 aggregate request returns `SUPPRESSED`.
9. Every rendered percentage carries the contested-estimate label.
10. The two-key ritual is required to change `weights.json`, and writes a hash-chained audit entry.
11. An interactive-mode solve on the seeded 2,000 × 400 fixture returns a shortlist of three per case with per-term decomposition, and reports its MIP gap.
12. `/methods#matching-evidence` renders both the robustness and the winner's-curse citations.


---

