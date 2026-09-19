## 12. The Placement & Solidarity module (`@corridor/placement`)

### 12.0 Why this section exists, and what it overrides

The design in `docs/design/04-FINAL-mvp-design.md` put the allocation optimiser at the top of its OUT list, arguing that absence beats mitigation because a placement solver can function as a migration-control targeting tool.

**That decision is overridden by the product owner, deliberately and on the record.** The purpose of this module is to *help migrants* — to raise the probability that a person who has already been granted admission lands somewhere they can work, be understood, reach a relative, and get the health and schooling their family needs. That is the documented effect of every deployed system in this class, and refusing to build it does not prevent a worse system being built by someone who will not ship the guardrails.

The objection was nonetheless correct about the *mechanism* of harm. So this module is built with the harm made **architecturally unrepresentable** rather than merely discouraged. Three amendments to the authoritative design follow, and they bind:

| Design rule | Amendment |
|---|---|
| OUT #1 — no allocation solver | **Reversed.** The solver is IN, as `@corridor/placement`, a separate workspace package and a separate route tree. |
| "no person-shaped type anywhere in the schema" | **Preserved for `@corridor/semantic`.** The public globe, `/place`, `/corridor`, `/headroom`, `/sources` and `/methods` still contain zero person-shaped types. Person-shaped types exist **only** in `@corridor/placement`, under a different schema, a different auth scope and a different visual chrome. The two never share a table, a store or a build artefact. |
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

- **Dependency rule, CI-enforced:** `@corridor/semantic` and `@corridor/kernel` MUST NOT import from `@corridor/placement/*`. Add the edge to the existing dependency-cruiser config as a `forbidden` rule. *Accept:* a seeded import in `packages/semantic` fails `pnpm check:deps` with a named error.
- **Chrome rule:** every route under `apps/placement` renders a persistent, non-dismissible banner. In sandbox mode the words are exactly `SIMULATION — NOT AN ORDER`. *Accept:* a Playwright test asserts the banner is present and has a computed opacity ≥ 0.9 on every placement route, and that no runtime flag promotes a sandbox scenario into an operational batch.
- **Auth rule:** operational mode requires an authenticated actor with role `caseworker` or `supervisor`. The public build (`pnpm build`) **excludes `apps/placement` entirely** — the deployed static site that carries the globe ships no placement code at all. *Accept:* `pnpm build && grep -r "highs" dist/` returns nothing.

### 12.3 Ontology extension (lives only in `@corridor/placement/schema`)

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
  readonly placeId: PlaceId;              // FK into @corridor/semantic Place — the ONLY join between the two schemas
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

These continue the M1–M5 sequence in `@corridor/kernel` and follow the same contract — pure functions, deterministic, `Result<T> = Ok<T> | Refusal`, every returned figure carrying its provenance.

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
13. **Licensing honesty.** Apache-2.0, for its patent grant. Say plainly in `GOVERNANCE.md` that OSI-approved licences **cannot** restrict fields of use (Open Source Definition clause 6) and that ethical-source licences such as Hippocratic are not OSI-approved — **governance is the real control, not licence text**. Name an ethics board and a documented deployment-support-revocation process.
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
