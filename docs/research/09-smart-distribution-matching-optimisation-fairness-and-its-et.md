## 1. What actually exists (deployed or piloted), with measured effects

| System | Who | Method | Scale / status (as of 2026-09) | Measured effect | Source |
|---|---|---|---|---|---|
| **Annie™ MOORE** (Matching and Outcome Optimization for Refugee Empowerment) | Trapp (WPI), Teytelboym (Oxford), Andersson & Martinello (Lund), Ahani; deployed at **HIAS** (US) | Supervised ML for employment probability + **integer programming** placement | Live at HIAS since **2018**, 1,100+ refugees matched in early years | Backtest on HIAS 2017 cohort: **+22% to +38%** employment within 90 days, depending on which constraints staff activate | Trapp et al., *Placement Optimization in Refugee Resettlement*, **Operations Research**, DOI `10.1287/opre.2020.2093` |
| **GeoMatch** | Immigration Policy Lab (Stanford + ETH Zurich) | ML prediction + **optimal matching** (bipartite assignment) | Pilots: US, Switzerland, Netherlands (COA; **trial phase since 2025**, ~35,000 refugees/yr expected), Canada funding since 2021 | **~+40% (US)**, **~+75% (CH)** employment vs. status-quo assignment (out-of-sample) | Bansak, Ferwerda, Hainmueller, Dillon, Hangartner, Lawrence, Weinstein, **Science** 359(6373):325–329 (2018), DOI `10.1126/science.aao4408` |
| **Dynamic placement** (online arrivals) | Ahani, Gölz, Procaccia, Teytelboym, Trapp | **Two-stage stochastic programming** + bid prices | Research→HIAS; code: `github.com/pgoelz/dynamicrefugees` | **>98%** of hindsight-optimal employment vs **<90%** for greedy practice | *Dynamic Placement in Refugee Resettlement*, **Operations Research** 72(3):1087–1104 (2024); EC'21 DOI `10.1145/3465456.3467534` |
| **Allocation-balanced dynamic assignment** | Bansak & Paulson | Online outcome maximisation with even-spread regulariser | Research | Trades outcome for allocation evenness across sites | **Operations Research** 72(6):2375–2390 (2024), DOI `10.1287/opre.2022.0445` |
| **Group-fair dynamic assignment** | Freund, Lykouris, Paulson, Sturt, Weng | **Bid-price algorithms** with provable group-fairness (max-min, proportionally-optimised-within-group) | Research; validated on US + NL data | Large fairness gains at **≈1–5%** loss in aggregate employment ("price of fairness") | arXiv **2301.10642** v3 (2025-01-22) |
| **Match'In / Match'In 2.0** | Univ. Hildesheim + FAU Erlangen-Nürnberg, funded by Stiftung Mercator | Needs↔municipal-capacity matching | Phase 1 **2021–2025**, prototype live to autumn 2024 in **20+ municipalities**, 4 Länder; 2.0 running | Policy paper published 2025 (`stiftung-mercator.de`, Match-In_Policy-Paper_English.pdf) | `matchin-projekt.de/en/` |
| **Re:Match** | Berlin Governance Platform + **Pairity** | **Preference-based** two-sided matching (refugee prefs ↔ city capacities) | Pilot 2023 + Phase II 2024: **137 Ukrainian protection seekers → 8 German municipalities**; 12-month results Feb 2025 | Published interim + 12-month evaluations; implementation guide available | `rematch-eu.org`, `governance-platform.org` |
| **Matching-mechanism theory** | Delacrétaz, Kominers, Teytelboym | Matching under **multidimensional knapsack constraints**; 4 mechanisms, 2 solution concepts | Theory + simulations; data/code openICPSR project **191062** | Preference-based mechanisms improve efficiency, respect community priorities, are strategy-proof-ish | **American Economic Review** 113(10):2689–2717 (2023), DOI `10.1257/aer.20210096` |

**Robustness caveat, recent:** Bansak, Paulson, Rothenhäusler, Ferwerda, Hainmueller, Hotard, *Robustness of Refugee-Matching Gains to Off-Policy Evaluation Choices*, **arXiv 2605.06686** (submitted 2026-04-25) — IPW and augmented variants across many model/assignment specs leave the 2018 gains "consistent in magnitude in all scenarios" and significant in most. These effect sizes are **off-policy backtests**, not RCTs. Label them as such in the UI.

## 2. Distribution keys and responsibility sharing — the political layer

**EU 2015 emergency relocation key** (Decisions (EU) 2015/1523 = 40,000; 2015/1601 = 120,000; total 160,000 from Italy + Greece):

`share_m = 0.40·pop_m + 0.40·GDP_m + 0.10·avgAsylumApps_m(2010–14) + 0.10·unemploymentRate_m` (each factor normalised to EU-28 total)

Outcome: **~34,705 people relocated by April 2018 ≈ 22% of target.** Legal aftermath: CJEU dismissed Slovakia's and Hungary's annulment actions (Joined Cases **C-643/15 and C-647/15**, 6 Sep 2017); the Court found Poland, Hungary and Czechia in breach (Joined Cases **C-715/17, C-718/17, C-719/17**, 2 Apr 2020). Failure mode was **not algorithmic** — it was (i) no refugee preferences, so secondary movement; (ii) no host-community preferences, so no local buy-in; (iii) binary compliance with no menu of contributions; (iv) key computed once, centrally, opaquely.

**Current law (this is live right now):** Regulation **(EU) 2024/1351** (Asylum and Migration Management Regulation). **Article 66** sets the reference key = **50% population + 50% GDP** (Eurostat data). Minimum annual solidarity: **30,000 relocations and €600,000,000**, "save in exceptional situations". Applies from **12 June 2026** per the EUR-Lex summary (some sources say 1 July 2026 — **UNVERIFIED which provision governs**).

**First Annual Solidarity Pool (2026)** — Council Implementing Decision **(EU) 2025/2642** of 19 Dec 2025, politically agreed 8 Dec 2025: **21,000 relocations and €420 million** — i.e. **below the statutory 30,000/€600m floor**. Member States under migratory pressure: **Cyprus, Greece, Italy, Spain.** Relocation pledges led by **Germany 4,555** and **France 3,361**; all Member States pledged something **except Hungary and Slovakia**. Product lesson: the key produces an *indicative* number, the pledge produces the *real* number, and the gap is the interesting variable. Model both.

**Tradable quotas:** Fernández-Huertas Moraga & Rapoport, *Tradable immigration quotas*, **J. Public Economics** 115:94–108 (2014); *Tradable Refugee-admission Quotas and EU Asylum Policy*, **CESifo Economic Studies** 61(3–4):638–672 (2015); *Tradable immigration quotas revisited*, **J. Public Economics** 208 (2022). Design: quota market **coupled with a matching mechanism** over countries' and refugees' preferences. Criticisms to surface in-product: commodification of a non-derogable protection obligation; repugnant-market objection; wealthy states buy out of protection and the cheapest-cost states become de facto containment sites; quality of reception is unpriced and therefore races to the bottom; without the matching layer refugees are pure transfer objects. **Implement tradable quotas only as an explicitly-labelled scenario, never as a default.**

## 3. Algorithm family — what to use where

| Problem shape | Method | MVP verdict |
|---|---|---|
| Static batch, 1 person ↔ 1 slot, one capacity dim | Hungarian / Munkres O(n³) | Fallback only; `munkres-js` (Apache-2.0 OR BSD-3-Clause), cap n≈800 in-browser |
| Static batch, families (multi-person), multi-dim capacity | **MILP / multidimensional knapsack assignment** | **Primary MVP engine** |
| Two-sided preferences, strategy-proofness, couples | Deferred acceptance; DA-with-couples is **NP-hard**, no stable match guaranteed | Use as *preference-round* layer, not core; report instability count |
| Continuous mass flows between regions (not individuals) | **Entropic optimal transport (Sinkhorn)** | Use for the *aggregate* cross-region simulation view; no mature JS OT library exists — **hand-roll Sinkhorn** (~80 lines, typed arrays). Any named npm OT package is **UNVERIFIED** |
| Sequential arrivals, unknown future | Two-stage stochastic programming; **bid-price / dual-based online** | MVP = bid-price with duals refreshed every N arrivals |
| Fairness | max-min (leximin surrogate), proportionality, envy-freeness-up-to-one | max-min group floor as a **hard-ish constraint with a slack + published price of fairness** |

## 4. MVP optimiser spec (implement exactly this)

**Sets.** `I` = cases (a *case* is the family unit that moves together — the atom). `J` = localities (NUTS-3 / admin-2 / labour-market region). `D` = capacity dimensions: `{beds, school_places, primary_care_slots, language_course_seats, accessible_housing, protected_category_slots}`. `G` = protected groups for fairness audit. `C_i ⊆ J` = **candidate set** for case i after hard gates (top-K by score, K=20).

**Parameters.** `s_id` ≥ 0 = demand of case i on dimension d. `c_jd` ≥ 0 = capacity. `persons_i`. `pop_j`. `key_m` = responsibility share of state m.

**Per-(i,j) scores, each normalised to [0,1] before weighting.**
- `E_ij` — predicted probability of employment/income-adequacy at 90 days (gradient-boosted trees or regularised logit, trained on historical placements; this is the Bansak/Trapp term).
- `N_ij` — diaspora/kinship tie strength (log of co-national population + explicit named-contact bonus, min-max scaled).
- `L_ij` — language-service match (fraction of case's languages served at j).
- `H_ij` — health/disability/trauma-service match.
- `P_ij` — **preference satisfaction**: if case i ranked j at position `r` out of `R_i` ranked options, `P_ij = 1 − (r−1)/R_i`; else `P_ij = 0`.
- `K_ij` — per-capita placement + first-year support cost, min-max scaled (enters negatively).

**Decision variables.** `x_ij ∈ {0,1}` for `j ∈ C_i`. `u_jd ≥ 0` capacity slack. `v_i ∈ {0,1}` unplaced (soft, big-M). `t ≥ 0` max-min fairness level. `δ_m ≥ 0` key deviation.

**Objective (maximise), with `Σw = 1` and the weight vector published with every run:**

```
max  Σ_i Σ_{j∈C_i} ( w_E·E_ij + w_N·N_ij + w_L·L_ij + w_H·H_ij + w_P·P_ij − w_K·K_ij ) · x_ij
   + w_F·t
   − w_U·Σ_i v_i
   − w_S·Σ_j Σ_d (congestion_jd)
   − w_Q·Σ_m δ_m
```
Defaults: `w_E=0.30, w_P=0.25, w_N=0.15, w_L=0.10, w_H=0.08, w_K=0.05, w_F=0.07`; `w_U=1000` (big-M), `w_S=0.02`, `w_Q=0.10`. Never hard-code — read from a signed `weights.json`.

**Constraints.**
- **C1 assignment:** `Σ_{j∈C_i} x_ij + v_i = 1  ∀i`
- **C2 multidimensional capacity:** `Σ_i s_id·x_ij + u_jd = c_jd  ∀j,d`
- **C3 minimum service (hard gate):** for every required service `q ∈ Req_i` absent at `j`, `j ∉ C_i` (precomputed, not a constraint row)
- **C4 family unity:** cases are atomic; for linked extended-family cases `(i,i') ∈ Link`: `x_ij = x_i'j  ∀j`
- **C5 anti-dumping floor:** `Σ_i x_ij ≥ ℓ_j` only where locality j pledged `ℓ_j`
- **C6 anti-concentration cap:** `Σ_i persons_i·x_ij ≤ ρ·pop_j`, default `ρ = 0.02`
- **C7 group fairness (max-min):** `(1/|I_g|)·Σ_{i∈I_g}Σ_j E_ij·x_ij ≥ t  ∀g∈G`
- **C8 responsibility-sharing key:** `|Σ_{j∈m}Σ_i persons_i·x_ij − key_m·TotalPersons| ≤ δ_m  ∀m` — **report deviation, never silently enforce**
- **C9 non-refoulement (hard gate):** `j ∉ C_i` unless the destination state has an affirmative admission legal basis for case i and is not subject to a current non-return advisory
- **C10 consent (hard gate):** `x_ij = 0` for all j unless `consent_i = true` with a stored consent record id

**Solver choice (verified 2026-09-18).**

| Library | Version | Licence | Use |
|---|---|---|---|
| **`highs` (highs-js)** | **v1.15.3, released 2026-09-11** (embeds HiGHS ≥1.15.1) | **MIT** | **Primary.** LP/MILP/QP via WASM. CDN `https://cdn.jsdelivr.net/npm/highs/build/highs.js` |
| `lp-model` (Dominik Peters) | npm `lp-model` | MIT | Modelling layer; emits CPLEX LP format; drives highs-js, glpk.js, jsLPSolver |
| `glpk.js` (jvail) | 4.0.x | **GPL-3.0** | **Avoid** — copyleft contaminates a permissive open-source dashboard. Isolate behind a process boundary if used at all |
| `javascript-lp-solver` / jsLPSolver | 1.0.3 (Unlicense reported — **UNVERIFIED**, maintainer changed from 0.4.x) | Unlicense | Zero-dep fallback when WASM is blocked |
| `munkres-js` | npm `munkres-js` | Apache-2.0 OR BSD-3-Clause | Pure 1:1 fallback |

**Sizing and solve-time budget.** Run **in a Web Worker**, never on the main thread. Candidate pruning is what makes this tractable: `|I|=2,000 × |J|=400` = 800,000 binaries unpruned; with `K=20` → **40,000 binaries, ~140k nonzeros**.

| Mode | Instance | Target | Hard cap | Technique |
|---|---|---|---|---|
| Interactive country | ≤2,000 cases × ≤400 localities, K=20 | **p50 ≤ 1.5 s, p95 ≤ 5 s** | 10 s then return incumbent | HiGHS MILP, presolve on, `mip_rel_gap = 0.01`, time limit 8 s |
| Region / EU | ≤50,000 cases × ≤5,000 localities | ≤ 60 s | 180 s | Decompose per receiving state into parallel workers; coordinate C2/C8 duals with a **bid-price loop** (≤15 iterations) |
| World scenario | aggregate flows, not individuals | ≤ 10 s | 30 s | **Sinkhorn OT** on a `|R|×|R|` region matrix, ε=0.05, 200 iterations |
| Online arrivals | 1 case at a time | ≤ 200 ms | 1 s | Bid prices cached; refresh duals every 50 arrivals or on capacity change |

Note: with only C1+C2 and unit case sizes, the LP is a transportation problem (totally unimodular → LP relaxation is integral, use simplex and skip branching). **C4, C5, C6, C7 destroy unimodularity** — that is why MILP is required. Always report the achieved MIP gap in the UI.

## 5. Preference representation — the anti-people-shuffling requirement

Three distinct objects, never conflated:
1. **Veto list** `Veto_i` — hard, removes j from `C_i`. Unlimited length. No score can override it.
2. **Ranked menu** — the case ranks up to `R_i` localities from an offered menu (Re:Match's design). Feeds `P_ij`. If `R_i = 0` the case is "no stated preference" and `P_ij = 0` uniformly — which must be visible, not hidden.
3. **Attribute-level wishes** (coastal/urban, near-a-mosque, near-a-named-relative) — expand into `N_ij`/menu construction, never directly into the objective.

**Preference-coverage KPI:** `%` of cases with `R_i ≥ 3`. Display next to the employment-gain number at equal visual weight. **Block any country-scale operational run where median `R_i = 0`** — that configuration is a people-shuffler, and the product must refuse it. Delacrétaz–Kominers–Teytelboym is the citation for why preference-based mechanisms are also *efficient*, not merely nicer.

## 6. Ethics guardrails — concrete, testable product requirements

These are build requirements with acceptance tests, not principles.

1. **Deportation/containment must be unrepresentable, not merely discouraged.** `DestinationLegalBasis` is a closed enum with admission-type values only (`resettlement`, `relocation_intra_state`, `relocation_inter_state`, `complementary_pathway`, `labour_mobility`, `family_reunification`, `community_sponsorship`). There is no `return`, `readmission`, `transit`, or `offshore_processing` variant. **Acceptance test:** an import fixture with `legal_basis: null` or an unknown value fails the import with a named error and zero rows written.
2. **Non-refoulement pre-filter (C9)** anchored on 1951 Convention Art. 33(1), ECHR Art. 3, EU Charter Art. 19(2). Destination states must carry an explicit legal-basis record. Any destination under a current UNHCR non-return position or ECtHR interim measure renders a red blocking banner and is stripped from `C_i`. **Acceptance test:** a seeded advisory removes every affected `x_ij` column.
3. **Consent is a gate, not a score (C10).** No assignment commits without a stored consent record id. Withdrawal re-opens the case and triggers re-solve. UNHCR's own doctrine is that refugees cannot choose their resettlement country — so the UI must **not promise choice it cannot deliver**; it offers a menu and a veto, and says so in those words.
4. **Human decision required — GDPR Art. 22.** The optimiser returns a **ranked shortlist of 3** with scores and reasons; it never writes a committed placement. The caseworker selects and records a free-text reason on override. Override rate and reasons are a published aggregate metric. **Acceptance test:** there is no code path from `solve()` to `commitPlacement()` without a human actor id.
5. **Per-case explanation.** For each recommendation show the objective decomposition by term (E/N/L/H/P/K, absolute contributions summing to the score) plus the runner-up and the single term that decided it.
6. **Protected attributes are never direct features of `E_ij`.** Nationality, ethnicity, religion, gender, marital status held out of training. **Proxy audit:** fit an adversary predicting each protected attribute from the model score + features; if AUC > 0.65, deployment is blocked in CI. This is the direct answer to Alajak, Burnazoglu, Leurs & van Schie, *GeoMatch/MisMatch*, **Social Inclusion** vol. 14 (2026), art. 10923, which found the Dutch deployment "prioritises aggregate optimisation over individual opportunities" with disproportionate discrimination risk on ethnicity, gender and marital status.
7. **Group-fairness floor on by default (C7)**, with the **price of fairness** shown numerically (literature range ≈1–5% aggregate employment; Freund et al. arXiv 2301.10642). Turning it off requires the two-key ritual in #9.
8. **Anti-dumping floor (C5) and anti-concentration cap (C6)** always on; `ρ` default 0.02, changes audited.
9. **Two-key weight changes.** Editing `weights.json`, disabling fairness, or enabling the tradable-quota scenario requires two authenticated roles and writes an append-only, hash-chained audit entry. Every accepted batch publishes: weight vector, model version, dataset vintages, MIP gap, fairness slack, key deviation `δ_m`.
10. **No individual-level export, ever.** The public API emits opaque pseudonyms; any public aggregate suppresses cells with **k < 10**. Real-time "hotspot" layers render density fields only — **no individual tracks, no vessel-level or person-level trajectories**. Acceptance test: a request for any cell with n<10 returns `SUPPRESSED`, not a number.
11. **Simulation and operations are physically separated** — different schema, different auth scope, different colour chrome, a persistent "SIMULATION — NOT AN ORDER" watermark. There must be no runtime flag that promotes a sandbox scenario to an operational batch.
12. **EU AI Act posture.** An allocation tool used by a public authority sits adjacent to Annex III point 7 of Regulation **(EU) 2024/1689** (migration/asylum/border high-risk; 7(a) polygraphs, 7(b) risk assessment, 7(c) assistance in examining asylum/visa/residence applications, 7(d) detection/identification of natural persons). Annex III high-risk obligations apply from **2 December 2027** following the Digital Omnibus amendments (transparency rules and enforcement from 2 Aug 2026). Build the Art. 9–15 artefacts now, as files: `/compliance/ai-act/{risk-management.md,data-governance.md,technical-documentation.md,logging.md,human-oversight.md,accuracy-robustness.md}`. Also ship a GDPR Art. 35 **DPIA template** pre-filled for this processing.
13. **Licensing honesty.** Ship under a permissive licence (Apache-2.0 recommended for its patent grant) plus a `GOVERNANCE.md` naming an ethics board and a documented deployment-support-revocation process. State plainly that OSI-approved licences cannot restrict fields of use and that ethical-source licences (e.g. Hippocratic) are not OSI-approved — governance, not licence text, is the real control. Avoid `glpk.js` (GPL-3.0) so the licence story stays clean.
14. **Contestability.** Every placed case gets a human-readable reason sheet and a named route to challenge. Log challenges; publish the challenge-and-reversal rate. A system that can allocate but cannot be appealed is a containment planner regardless of its objective function.
