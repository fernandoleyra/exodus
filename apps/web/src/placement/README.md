# @exodus/placement

The allocation solver. Person-shaped types live here and **nowhere else**; nothing outside
this folder imports from it, and the public web build excludes it entirely.

```bash
npm run test            # 13 guardrail tests
npm run placement:demo  # solves a synthetic cohort and prints what a caseworker sees
```

## What it does

Takes families who **already hold a legal basis to be admitted** and returns, for each, a
**ranked shortlist of three** localities with a per-term explanation. It cannot commit a
placement.

## The harm is unrepresentable, not discouraged

- `DestinationLegalBasis` is a closed enum of seven **admission** types. There is no
  `return`, `readmission`, `transit` or `offshore_processing` value. A test asserts their
  absence, and an import carrying one **writes zero rows** rather than coercing a default.
- **Consent, non-refoulement, required services and vetoes are candidate-set gates**, not
  penalty weights. A gate you can outbid is not a gate.
- `commitPlacement()` throws without a human actor id and a recorded reason. GDPR Art. 22
  bars a decision based *solely* on automated processing that significantly affects a person.
- A cohort whose **median case ranked nothing** is refused outright with
  `NoPreferenceCoverage`: allocating on that basis is shuffling people, not matching them.
- Nationality, ethnicity, religion, gender and marital status are **not inputs to any score
  term**. `auditGroup` exists only to audit fairness of the result.

## The MILP

Binary `x_ij` over a pruned candidate set (K=8), with:

| | |
|---|---|
| C1 | assignment, with a big-M unplaced variable |
| C2 | multidimensional capacity over six dimensions |
| C5 | anti-dumping floor where a locality pledged |
| C6 | anti-concentration cap, `ρ=0.02` **per solve round** |
| C7 | group fairness as a max-min floor on group mean predicted outcome |
| C8 | responsibility-sharing key as **two linear rows** — `\|·\| ≤ δ` is not an LP constraint |
| — | **congestion `z_jd ≥ load − θ·cap`**, which the source spec referenced but never defined; without it the objective is unimplementable |

Solver is HiGHS 1.15.3 (MIT) via WASM. `glpk.js` is deliberately avoided: it is GPL-3.0 and
would contaminate the licence.

## Explaining a displaced case

The solver optimises the cohort, so a case is sometimes moved off its own best-scoring
locality to satisfy a constraint elsewhere. When that happens the result carries
`displaced: { bestLocalityId, scoreGivenUp }` and **no** `decidedBy` term.

This was a real bug caught by running the demo: the code was reporting "decided by E" for a
case whose pick scored *lower* than its runner-up. Claiming a deciding term for a displaced
case is exactly the contestability failure Alajak et al. (*Social Inclusion* 14, 2026, art.
10923) found in a deployed system — it leaves neither the family nor the caseworker able to
challenge the decision.

## Not built here

The three UI routes in §12.9, the two-key weight ritual, the hash-chained audit log, and the
proxy-audit CI gate. The kernel and its guardrails are what this milestone delivers.
