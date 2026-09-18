## 0. The core decision this document forces

The product brief asks for three things that are in direct tension: (a) *live* movement monitoring, (b) *Palantir-like* intelligence aesthetics, (c) *smart distribution of migrants*. Each of those, implemented naively, produces a tool whose highest-value use is interdiction and profiling, not planning. The resolution adopted here, and which the build prompt MUST carry verbatim:

> **The platform is live and high-resolution for CAPACITY (labour markets, housing, services, prices, climate, fiscal) and lagged and coarse for MOVEMENT (flows, routes, arrivals). People are never the real-time layer.**

This single asymmetry — call it the **Operational Latency Floor (OLF)** — is what separates a public-good planning instrument from a border-targeting console, and it costs almost nothing in UX impact because the "wow" of a global WebGL globe comes from density and continuity, not from 15-minute freshness on boat positions.

---

## 1. Governing frameworks — exact instruments and what each one binds

| Instrument | Exact identifier / URL | What it binds in this product |
|---|---|---|
| IOM Data Protection Principles (13 principles) | `https://www.iom.int/resources/iom-data-protection-principles`; full manual: `https://publications.iom.int/books/iom-data-protection-manual`. Principles: lawful & fair collection; specified & legitimate purpose; data quality; consent; transfer to third parties; confidentiality; access & transparency; data security; retention; application of principles; ownership of personal data; oversight/compliance/internal remedies; exceptions | Principles 2, 5, 7, 9, 12 apply even though we hold no personal data: purpose limitation for every ingested layer, transfer rules for redistribution, transparency page, retention/vintage policy, a named accountable reviewer |
| UNHCR General Policy on Personal Data Protection and Privacy | `UNHCR/HCP/2022/02`, issued 20 Dec 2022. PDF: `https://emergency.unhcr.org/sites/default/files/2023-10/UNHCR-HCP-2022-02%20General%20Policy%20on%20Personal%20Data%20Protection%20and%20Privacy.pdf`. Establishes a Chief Data Protection Officer and a Personal Data and Privacy Review Committee | Any UNHCR-derived layer inherits UNHCR's release conditions; we MUST NOT re-aggregate UNHCR microdata or reverse their rounding |
| OCHA Data Responsibility Guidelines | Agreed Oct 2021, updated Jan 2025. `https://centre.humdata.org/the-ocha-data-responsibility-guidelines/`; 2025 PDF on HDX: `https://data.humdata.org/dataset/2048a947-5714-4220-905b-e662cbcd14c8/resource/8bc5b848-8ece-4f1f-a78b-18dd972bb21a/download/data-responsibility-guidelines-2025.pdf` | Data sensitivity classification per layer; data-sharing agreements; incident management |
| IASC Operational Guidance on Data Responsibility in Humanitarian Action | Endorsed Feb 2021, revised April 2023. `https://reliefweb.int/report/world/iasc-operational-guidance-data-responsibility-humanitarian-action-april-2023` | Sector-level baseline our layer policy must not fall below |
| Centre for Humanitarian Data, Guidance Note #1: Statistical Disclosure Control (Aug 2019) | `https://centre.humdata.org/guidance-note-statistical-disclosure-control/`. Verbatim from the PDF: HDX lowered risk "to an acceptable level (i.e. **5% or lower**)"; identity / attribute / inferential disclosure; perturbative vs non-perturbative methods; tool named: `sdcMicro` (R) | Our numeric suppression engine. (A "3% global risk" figure circulates in secondary summaries — **UNVERIFIED**; the 2019 primary text says 5%.) |
| The Signal Code (Harvard HHI Signal Program, 2017) | `https://hhi.harvard.edu/publications/signal-code-human-rights-approach-information-during-crisis`. Five rights: Information; Protection; Privacy and Security; Data Agency; **Rectification and Redress** | The Right to Rectification and Redress is the one usually skipped — it becomes a concrete harm-report channel with an SLA (§7) |
| GDPR | Reg. (EU) 2016/679. Art. 9(1) special categories (racial/ethnic origin, political opinions, religious/philosophical beliefs, trade union membership, genetic, biometric, health, sex life/orientation); Recital 26 (anonymous data out of scope); Art. 89(1) safeguards for statistical purposes | Ethnicity/religion/nationality layers sit in Art. 9 territory even when aggregated if re-identification is feasible; Art. 89(1) safeguards = our aggregation floors |
| EU AI Act (Reg. (EU) 2024/1689) | Art. 5(1)(g) prohibits biometric categorisation to deduce race, political opinions, trade union membership, religious/philosophical beliefs, sex life or sexual orientation — enforceable since **2 Feb 2025**. Annex III(7) classes as high-risk: 7(a) polygraphs; 7(b) risk assessment of persons entering/entered; 7(c) assisting examination of asylum/visa/residence applications; 7(d) detection/recognition/identification of natural persons. Reference: `https://artificialintelligenceact.eu/annex/3/` | Hard scope boundary: this product MUST NOT implement any Annex III(7) function. Compliance deadline for Annex III is reported as **2 Dec 2027** after the 2026 Digital Omnibus extension — **UNVERIFIED**, confirm before citing in the repo |
| Non-refoulement | 1951 Refugee Convention Art. 33(1); ECHR Art. 3 | No layer may be designed to support return decisions about a country the platform itself flags as unsafe |
| Prohibition of collective expulsion | ECHR Protocol No. 4, Art. 4 ("Collective expulsion of aliens is prohibited"); EU Charter Art. 19(1), which per the Charter Explanations has the same meaning and scope | Bans any group-level "removal candidate" or cohort-scoring feature. `https://ks.echr.coe.int/web/echr-ks/article-4-protocol-4` |
| UNGA Res. 3449 (XXX), 9 Dec 1975 | Requests UN organs and specialized agencies to use "non-documented or irregular migrant workers" in all official documents | Lexicon enforcement (§4) has a 50-year-old treaty-body basis, not a style preference |
| Securitisation critique | Angenendt & Koch, *Migration forecasting: expectations, limitations and political functions*, Forced Migration Review — `https://www.fmreview.org/digital-disruption/angenendt-koch/`; *Anticipating human mobility*, Data & Policy (Cambridge) — `https://www.cambridge.org/core/journals/data-and-policy/article/anticipating-human-mobility-methods-data-and-policy-in-forecasting-and-foresight/DE780E46CEB5BA24B3C842451A668E0D`; ICLQ, *AI in border and migration control and the subtle erosion of human rights*; `https://policyreview.info/articles/news/violent-logics-border-ai/2062` | Cited in the methodology page as the reason forecasts are range-only and route-blind |
| Model / data documentation | Model Cards (Mitchell et al., arXiv:1810.03993); Datasheets for Datasets (Gebru et al., arXiv:1803.09010) | Mandatory artefact per model and per dataset (§5) |
| Terminology | IOM *Glossary on Migration*, International Migration Law No. 34 (2019), `https://publications.iom.int/books/international-migration-law-ndeg34-glossary-migration`; UNHCR *'Refugee' or 'migrant' — which is right?*, `https://www.unhcr.org/us/news/stories/unhcr-viewpoint-refugee-or-migrant-which-right` | Single source of truth for the in-app glossary; every status term in the UI links to its glossary entry |

---

## 2. Dual-use risk register — each risk gets a shippable countermeasure

| # | Misuse | Mechanism that enables it | CONCRETE MVP countermeasure (implementable) |
|---|---|---|---|
| D1 | **Interdiction / pushback targeting** | Near-real-time, sub-national, route-level movement layer | **OLF**: movement layers served only at ≥7-day lag, ≥ADM1 destination, ≥monthly bucket. Enforced in the API tier (`layer_policy.yaml`: `min_lag_days`, `min_admin_level`, `min_temporal_bucket`), not in the client. Live tiles exist only for capacity/context layers |
| D2 | **Route reconnaissance** | Rendering actual track geometry, chokepoints, crossing points, departure beaches | Corridors rendered **only** as abstract great-circle arcs between ADM0 centroids. No waypoints, no geodesic-to-coastline snapping, no bathymetry, no "crossing point" entity type in the schema. Reject any GeoJSON ingest whose geometry is `LineString` with >2 vertices for a movement layer |
| D3 | **Community profiling** ("where do the Eritreans live in this city?") | Nationality/ethnicity × fine geography cross-tab | Cross-tab lock: nationality-of-origin MAY be crossed with destination at ADM0 only. Ethnicity and religion are **not layers in the MVP** at all (§3). Enforced as a query-planner guard that rejects the join, returning HTTP 451 + link to the policy |
| D4 | **Xenophobic narrative fuel** (decontextualised absolute counts, screenshot-ready) | Big absolute number on a dark globe with red particles | Denominator mandate: no absolute people-count renders without a simultaneous per-capita / per-1,000-population value in the same visual unit. Default encoding is per-capita. Export stamping (§6) |
| D5 | **False precision driving policy** | Point estimates from thin models presented at 6 significant figures | Significant-figure cap (modelled = 2 s.f., observed = 3 s.f.); mandatory interval; auto-degradation: if relative CI width > 0.5 the value renders greyed, is labelled "indicative only", and is **excluded from sorting and ranking controls** |
| D6 | **"Carrying capacity" weaponised as a cap** | An absorption model that emits one number | Absorption outputs are always a **scenario band with a named assumption set**, never a scalar. Banned strings in the model output layer and UI: `capacity limit`, `carrying capacity`, `maximum`, `threshold`, `saturation`. Required label: "Modelled labour-market absorption under assumption set «name» — not a policy limit." Assumption panel open-by-default on first view |
| D7 | **The aesthetic itself** — tactical/military semiotics lend false authority and signal targeting | Crosshairs, reticles, radar sweeps, red threat pulses, dossier/"entity profile" patterns, verbs like TARGET/TRACK/LOCK/WATCHLIST | Design-system ban list (§4.3). Rename at schema level: `watchlist`→`saved_views`, `target`→`area_of_interest`, `entity`→`place` \| `indicator`. Global search accepts **places, indicators, corridors, policies only** — the search index has no person-shaped type |
| D8 | **Re-identification by differencing across releases** | A cell suppressed in vintage *n* but published in *n+1* leaks the difference | **Frozen suppression**: once a (geography, variable, period) cell is suppressed it stays suppressed in all subsequent vintages. Suppression ledger is an append-only table, published |
| D9 | **Viewer surveillance** (NGO/diaspora staff profiled by who visits which layer) | Third-party analytics, cookies, CDN logging | Zero third-party scripts. Self-hosted, cookieless analytics with IP truncated to /24 (IPv4) and /48 (IPv6) at ingest, 7-day retention, aggregate-only. No account required to view. No fingerprinting libraries. CSP `connect-src 'self'` for telemetry |
| D10 | **Laundering of contested official statistics** | Government-supplied numbers rendered with the same authority as UN series | Per-source `contestation` flag; contested series render with a hatched overlay and a "Contested — see note" chip linking to the dispute, and are excluded from default views |
| D11 | **Automated decisioning built on the API** | Open API + "smart distribution" allocator | The allocator emits **ranked options with explicit trade-offs and a mandatory human-rationale field**, never an assignment. API responses for allocator endpoints include `X-Decision-Support: advisory-only` and a machine-readable `prohibited_uses` block. Acceptable Use Policy in `/legal/aup` and in the API ToS |
| D12 | **Forecast used to pre-emptively close borders** | Departure/route forecasting | Forecast targets are restricted to **arrivals-and-needs at destination** (shelter, school places, health capacity). No departure forecasting, no "pressure index" on origin countries, no country-level "risk of outflow" score in the MVP |

---

## 3. Data minimisation and aggregation floors

No individual-level data is ever ingested, stored, cached, or served. The MVP database has **no person table and no person-shaped type**; enforce with a CI check that fails on a schema containing `person`, `individual`, `case_id`, `applicant`, `biometric`, `name`, `dob`.

### 3.1 Release rule

For a cell *c* with count *n* at granularity *g*, publish iff **all** hold:

1. `n ≥ K(g)` — minimum cell size
2. `pop(geography(c)) ≥ 10,000` — denominator floor
3. `n / pop ≥ 0` and the cell is not a residual that reconstructs a suppressed cell (complementary suppression: if exactly one cell in any margin is suppressed, suppress the next-smallest cell in that margin too)
4. the cell is not suppressed in any prior vintage (frozen suppression, D8)

Otherwise render the literal string `<K` and the tooltip in §6.4.

### 3.2 Thresholds

| Granularity | K | Min temporal bucket | Min lag |
|---|---|---|---|
| ADM0 × ADM0 corridor (stock) | 25 | year | 0 |
| ADM0 × ADM0 corridor (flow) | 25 | month | 7 days |
| ADM1 destination × origin ADM0 | 100 | quarter | 30 days |
| ADM2 destination, origin **not** disaggregated | 100 | quarter | 30 days |
| ADM2 × origin nationality | **prohibited** | — | — |
| Any geography × ethnicity or religion | **prohibited** | — | — |
| Any geography × legal status finer than {refugee, asylum-seeker, IDP, other international migrant, stateless} | **prohibited** | — | — |
| Gridded people layers | H3 resolution ≤ 3 (mean hex ≈ 12,393 km²) | — | — |

### 3.3 Rounding (applied after suppression)

`R(n) = 5·round(n/5)` for `n < 1000`; `10·round(n/10)` for `1000 ≤ n < 10,000`; 3 significant figures for `n ≥ 10,000`. This matches UNHCR practice (small numbers rounded to the nearest multiple of five) and makes totals approximate — state that in the UI, do not silently force additivity.

### 3.4 Special categories (GDPR Art. 9)

Ethnicity, religion, sexual orientation, health status, political opinion: **not layers in the MVP.** If a future version adds them, the gate is: ADM0 only, from a published national census or a UN series, never joined to movement, never joined to time series finer than 5 years, never rendered on the globe as a choropleth, and shipped only with a published DPIA. Nationality is retained (it is a legal-status determinant, not a proxy for ethnicity) but is subject to §3.2.

---

## 4. Framing, language and visual politics

### 4.1 Status terms — the MVP must distinguish, not merge

| Term | Definition used | UI rule |
|---|---|---|
| Refugee | 1951 Convention Art. 1A(2) / regional instruments; recognised or prima facie | Own category, own colour token, never merged into "migrant" |
| Asylum-seeker | Claim lodged, not yet determined | Own category; MUST NOT be shown as a sub-type of "irregular" |
| IDP | Displaced within national borders | Own category; MUST NOT appear in cross-border flow totals |
| Stateless person | 1954 Convention Art. 1 | Own category, always shown even when small (subject to §3.1) |
| International migrant | No international legal definition; UN DESA operational definition (usual residence changed across a border) | Umbrella only where explicitly labelled as such |
| Migrant in an irregular situation | UNGA 3449 (XXX) wording | The only permitted phrasing for this population |

### 4.2 Banned lexicon (enforced by a CI lint over all UI strings, i18n files, chart titles, tooltips, model output templates and generated text)

`illegal` (of a person), `illegals`, `alien`, `flood`, `wave`, `surge`, `influx`, `tide`, `stream`, `swarm`, `invasion`, `crisis` (as a modifier of a nationality or of people, e.g. "migrant crisis" — permitted only as "displacement crisis in «place»"), `bogus`, `economic migrant` (as a pejorative contrast to refugee), `host` (prefer "destination"), `burden`, `absorb`/`absorption` when applied to people rather than to labour markets, `carrying capacity`, `flow` where a per-person verb will do. Lint = `scripts/lint-lexicon.mjs`, exit non-zero, wired into `pnpm test` and the pre-commit hook. Water metaphors are documented as dehumanising in the research base (arXiv:2502.13246; IOM journalist guidance) — this is evidence-based, not taste.

Replacements: `flows` → `movements`; `influx` → `arrivals`; `host country` → `destination country`; `absorb X migrants` → `labour-market absorption modelled at X–Y under assumptions «name»`.

### 4.3 Visual rules (binding on the WebGL layer)

1. **Colour of people is never red, orange or yellow.** People-count and movement layers use a single-hue sequential ramp in the cool range. Red/orange is reserved exclusively for *service and rights deficits* (unfilled shelter places, school shortfall, unmet health capacity) — i.e. red marks a failure of provision, never a quantity of persons.
2. **No diverging palette on people layers.** Diverging palettes only on gap/deficit/change metrics, with a defined and labelled neutral point.
3. **Symmetric rendering.** Every corridor is drawn with identical weight in both directions, and the default view shows emigration and immigration simultaneously. A destination-only default reads as siege.
4. **Particle density is normalised.** Particle count per corridor = `f(value / destination_population)`, not `f(value)`. An absolute-magnitude mode exists but is not the default and carries the denominator chip.
5. **No convergence-on-a-target motion.** Arcs animate at constant speed, do not accelerate toward the destination, do not pulse on arrival, and do not trigger any impact/ripple effect at the destination.
6. **Projection and centring.** Default camera is not centred on Europe or North America; default is a full globe at a rotation that shows the Global South first (most movement is South–South, and the default must not contradict that). Equal-area projection for any 2D fallback (Equal Earth), never Web Mercator for people-density choropleths.
7. **Banned visual motifs:** crosshairs, reticles, radar sweeps, scanlines, "signal acquired" motifs, blinking red alerts over populated places, dossier/mugshot card layouts, silhouettes of people as icons, national-flag icons as the primary identifier of a population.
8. **Motion budget:** respect `prefers-reduced-motion`; particles freeze to static arcs. Accessibility is also an ethics requirement — a tool that only works for the able-bodied technocrat is not a public good.
9. **Uncertainty is visual, not only textual:** arc opacity and choropleth saturation are modulated by CI width; nothing in the MVP may render a modelled value at full saturation.

---

## 5. Model transparency

**Per model**, ship `models/<id>/MODEL_CARD.md` following arXiv:1810.03993: model details & version; intended use; **out-of-scope and prohibited uses** (explicitly: border enforcement, individual or group screening, return decisions, any Annex III(7) function); factors; metrics with CIs; evaluation data; training data; quantitative analyses disaggregated by region and income group; ethical considerations; caveats & recommendations; named maintainer; date.

**Per dataset**, ship `data/<id>/DATASHEET.md` following arXiv:1803.09010: motivation; composition; collection process; preprocessing; uses; distribution; maintenance — plus four project-specific fields: `licence` (exact SPDX or verbatim terms string), `vintage` (ISO date of the reference period **and** of retrieval), `update_cadence` (exact, e.g. `annual, released ~June`), `known_undercount` (free text naming who is missing — irregular migrants, unregistered IDPs, people avoiding enumeration).

**"How this number was made" panel** — attached to every displayed value, opened from a persistent `ⓘ` affordance, ≤1 click, containing: the formula with every variable defined; the input values with their own source links; the vintage of each input; the transformation chain (`source → ingest job → transform commit SHA → suppression rule applied → rounding applied`); the CI and how it was derived; a "this number would be wrong if…" sentence; a permalink that encodes the data-vintage content hash so a screenshot can be audited later.

**Methodology site** at `/methodology`, statically generated from the repo so it cannot drift, with a public changelog and a per-page "last reviewed" date. Every layer chip in the UI links to `/methodology/sources/{source_id}`.

---

## 6. Exact copy

### 6.1 First-run notice (blocking modal, scroll-to-end required, shown once per browser and again on every methodology major-version bump)

> **Before you use these numbers**
>
> This atlas is about people. Every figure on it represents someone's life, and most of those people had no say in being counted.
>
> **These are estimates, not counts.** Migration data is incomplete everywhere. People in irregular situations, unregistered displaced people, and anyone with reason to avoid being enumerated are systematically undercounted. Different countries count different things, at different times, using different definitions. We show uncertainty on every figure because the uncertainty is real and often large.
>
> **This tool is not for finding people.** We publish nothing about individuals. Movement data is deliberately delayed, coarsened and abstracted: no routes, no crossing points, no live tracking. Cells covering fewer than 25 people are withheld. If you are looking for a tool to locate, intercept, screen or remove anyone, this is not that tool and we have built it so that it cannot become one.
>
> **Numbers are not decisions.** Our models estimate what labour markets and public services might absorb under stated assumptions. They do not tell you how many people a country should admit. That is a political and legal question, governed by the right to seek asylum, the prohibition of refoulement, and the prohibition of collective expulsion — none of which a model can weigh.
>
> **Words matter here.** We use *refugee*, *asylum-seeker*, *internally displaced person*, *stateless person*, and *migrant in an irregular situation* precisely, following the IOM Glossary on Migration. No person is illegal.
>
> If something here is wrong, or if you believe this tool is causing harm, tell us: **[Report a problem]** — we answer within 30 days and we will withdraw a layer if we have to.
>
> `[ I understand — open the atlas ]`  `[ Read the full methodology ]`

### 6.2 Persistent footer strip (always visible, never dismissible)

> Estimates with uncertainty · vintages vary by source · **not for operational targeting** · [How this number was made] · [Methodology] · [Report a harm]

### 6.3 Export stamp (burned into every PNG/PDF/SVG export, bottom edge, minimum 11px, not removable via the UI)

> «Indicator» — «geography» — «period». Estimate «value» (90% interval «lo»–«hi»). Source: «source», vintage «date». Cells under 25 withheld. Estimates, not counts — not for operational targeting. Reproduce this exact view: «short-url» · «vintage-hash»

### 6.4 Suppressed-cell tooltip

> **Withheld.** Fewer than 25 people are estimated in this cell. Publishing it could help identify individuals or a small community. This cell stays withheld in all future releases, so it cannot be recovered by comparing versions. [Why we do this]

### 6.5 Forecast panel banner

> **Forecasts of human movement are unreliable and political.** This projection assumes conditions that may not hold and cannot anticipate sudden events. It estimates *arrivals and resulting needs*, not departures, and it must not be used to pre-position enforcement. Treat the range, not the line.

### 6.6 Absorption model header

> Modelled labour-market absorption for «geography», assumption set «name». This is a range of scenarios, not a limit, a quota or a recommendation. [Change assumptions] [How this number was made]

---

## 7. `ETHICS.md` outline (repo root, linked from README first screen)

1. **Why this file is first** — the tool models human beings; scope of the commitment.
2. **What this project is, and the four things it will never be** — no individual data; no route intelligence; no screening/scoring of persons or groups; no Annex III(7) function.
3. **Governing frameworks we hold ourselves to** — the table in §1, with links and the specific obligation we derived from each.
4. **Data responsibility** — sensitivity classification per layer; the aggregation floors in §3 reproduced verbatim; the frozen-suppression ledger and where to read it; retention and vintage policy; what we do *not* collect about viewers.
5. **Dual-use risk register** — §2 as a living table, each row with a link to the code or config that implements the countermeasure (`layer_policy.yaml`, query-planner guard, lexicon lint, design tokens).
6. **Language policy** — banned lexicon, replacements, status-term definitions, the lint command, and how to propose a change.
7. **Visual-design ethics** — the nine rules in §4.3, with rationale and the failing screenshots we rejected.
8. **Model and data documentation standard** — model card and datasheet templates; the rule that no model ships without a card and no dataset ships without a datasheet (CI-enforced).
9. **Uncertainty policy** — significant-figure caps, interval requirement, auto-degradation rule, the ban on ranking degraded values.
10. **Acceptable Use** — the non-uses; why the code licence is **AGPL-3.0-or-later** (OSI-approved, keeps the "open source" claim honest, closes the network loophole) and the Acceptable Use Policy is a **separate, published, non-licence document** — "ethical source" licences (Hippocratic, OpenRAIL-style use restrictions) conflict with OSD §6 (no discrimination against fields of endeavour) and would forfeit the open-source designation; state this trade-off explicitly rather than quietly.
11. **Redress** — Signal Code Right to Rectification and Redress made operational: `.github/ISSUE_TEMPLATE/harm-report.yml`, a monitored contact address, a 30-day response SLA, the power to de-publish a layer, and a public log of every de-publication with reason.
12. **Governance** — named maintainers; an advisory group that includes people with lived experience of displacement and at least one migrant-led organisation; a rule that no new people-layer ships without their sign-off; how a government or agency contributor is disclosed.
13. **Conflicts and funding** — full disclosure of funders; a standing refusal to accept funding conditioned on enforcement features.
14. **Known failures and open problems** — undercounts, definitional incomparability, the gap between what the tool shows and what it cannot show, and the things we got wrong so far.

---

## 8. Hard product requirements for the build prompt

**MUST**
1. Enforce the Operational Latency Floor server-side in `layer_policy.yaml` (`min_lag_days`, `min_admin_level`, `min_temporal_bucket`, `max_h3_resolution`); the client MUST be incapable of requesting finer.
2. Implement §3.1 suppression + §3.3 rounding + the append-only frozen-suppression ledger; expose the ledger at `/methodology/suppression`.
3. Attach `{value, ci_low, ci_high, vintage, method_id, source_id}` to every displayed number; render interval and vintage in the same visual unit as the value.
4. Auto-degrade and de-rank values with relative CI width > 0.5.
5. Cap significant figures: 2 for modelled, 3 for observed.
6. Ship "How this number was made" on every value, ≤1 click, with the transformation chain and a vintage-hashed permalink.
7. Ship a model card per model and a datasheet per dataset; fail CI if a model or dataset lacks one.
8. Ship the lexicon lint over all strings; fail CI on a hit.
9. Default to per-capita encoding; never render an absolute people-count without a visible denominator.
10. Render inflow and outflow symmetrically, both on by default.
11. Use cool single-hue ramps for people; reserve warm/red for service and rights deficits only.
12. Stamp every export per §6.3.
13. Provide `.github/ISSUE_TEMPLATE/harm-report.yml`, a monitored address, a 30-day SLA and a public de-publication log.
14. Self-host cookieless analytics with truncated IPs and 7-day retention, or ship none.
15. Publish `/methodology` generated from the repo, with a changelog.
16. Licence code AGPL-3.0-or-later; publish a separate Acceptable Use Policy; state the OSD §6 trade-off in ETHICS.md.
17. Respect `prefers-reduced-motion`; meet WCAG 2.2 AA for all non-canvas UI and provide a tabular equivalent for every map layer.

**MUST NOT**
18. Store, cache, ingest or serve individual-level data; no person-shaped type may exist in the schema (CI-enforced).
19. Render route geometry, waypoints, crossing points, departure/arrival points, vessel positions or any movement layer geometry with more than two vertices.
20. Cross-tabulate nationality with geography finer than ADM0, or expose ethnicity, religion, sexual orientation, health or political-opinion layers at any granularity in the MVP.
21. Implement any EU AI Act Annex III(7) function: polygraph-like inference, risk assessment of persons entering, assistance in examining asylum/visa/residence applications, or detection/recognition/identification of natural persons. Nor any Art. 5(1)(g) biometric categorisation.
22. Emit a scalar "capacity", "limit", "quota", "carrying capacity" or "maximum" for people; produce group-level allocation *assignments*; or produce departure forecasts, outflow-risk scores or "pressure indices" on origin countries.
23. Use crosshairs, reticles, radar sweeps, threat-alert pulses over populated places, dossier/profile card patterns, person silhouettes as icons, or the verbs TARGET / TRACK / LOCK / WATCHLIST anywhere in code, copy or design tokens.
24. Expose a global search that accepts or indexes anything person-shaped.
25. Ship third-party analytics, trackers, fingerprinting, ad SDKs, or require an account to view public layers.
26. Present contested official statistics in default views without the contestation overlay.
