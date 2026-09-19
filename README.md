# Exodus — build brief for Exodus

This repository does not yet contain an application. It contains the **brief to build one**, and the full, auditable record of how that brief was arrived at.

## The deliverable

**[`docs/prompt/BUILD_PROMPT.md`](docs/prompt/BUILD_PROMPT.md)** — a single, self-contained prompt for an autonomous coding agent. Hand it over and it builds the MVP with no follow-up conversation.

## What it specifies

An open-source migration intelligence workspace:

- A **WebGL globe** flipbooking the world's bilateral migration system, one year per frame, 1990→2023, at 60fps — offline, from a committed data bundle under 40 MiB.
- **Epistemic honesty as the signature visual.** Arc opacity encodes how well-measured a country's statistics are, so corridors from states with no statistical office cannot borrow the authority of German register data. Dash density encodes how much two competent models disagree about that corridor. Missing data renders `—`, never `0`. A CI-enforced rule means no number reaches the screen without its source, vintage, licence and estimate kind attached.
- A **service-capacity calculator** — how much headroom a country's housing, schooling, healthcare and labour market actually have, with the binding constraint always named, never collapsed into a single score.
- A **placement optimiser** that helps families who already hold a legal basis to be admitted find localities where they can work, be understood, reach a relative, and get the schooling and healthcare they need.

## How it was produced

| Stage | What happened |
|---|---|
| **Research** | 14 agents with live web access swept global migration data sources, migration modelling science, absorptive-capacity economics, allocation and matching optimisation, the WebGL stack, intelligence-dashboard UX, modular architecture, ethics and dual-use risk, and prior art. |
| **Verification** | Each pack was handed to an adversarial fact-checker whose job was to break it. Endpoints were re-probed, dataset vintages and licences re-read, library versions resolved against the registry, published coefficients checked against the papers. Unverifiable claims were deleted or marked `[UNVERIFIED]`. |
| **Design** | Three MVP designs written independently under different lenses — rigour-first, impact-first, platform-first — then scored by a three-axis judge panel and synthesised into one authoritative design. |
| **Composition** | Eleven section writers, each working from the final design plus the research relevant to its section. |
| **Critique** | Four critics attacked the assembled prompt for missing pieces, internal contradictions, hallucinated facts, and buildability. Their reports are binding on the building agent. |

Every stage is kept, not just the conclusion.

## Layout

| Path | Contents |
|---|---|
| `docs/prompt/BUILD_PROMPT.md` | **The deliverable.** ~7,000 lines. Scope decisions and errata first, then 12 sections. |
| `docs/prompt/section-12-*.md` | The placement module, also kept standalone. |
| `docs/review/` | The four critic reports. Binding on the builder. |
| `docs/design/` | The ground-truth brief, the three competing designs, and the final synthesis. |
| `docs/research/` | The 14 verified research packs behind all of it. |

## Two things worth knowing before you build

**The product name is unsettled.** The design names the product Exodus; the repository is `exodus`. "Exodus" carries considerable baggage in a migration context, which is why the design moved away from it. Settle this before the first commit of application code.

**Three capabilities from the original brief were ruled on explicitly**, and `§0.3` of the build prompt records the decisions and overrides any section that argues otherwise: the placement optimiser is **built**; the real-time layer is **cut** (v1 is a static site); cross-country simulations are **cut**.
