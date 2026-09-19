# Exodus — M0 vertical slice

A running slice of the product described in `docs/prompt/BUILD_PROMPT.md`: one data path
end to end, from source through the semantic layer to the globe and the inspector.

```bash
npm install
node scripts/fetch-wb.mjs      # real World Bank indicators -> .cache/
node scripts/build-snapshot.mjs # -> public/snapshot/*.json
npm run dev                     # http://127.0.0.1:5173
node e2e/shoot.mjs              # screenshots -> shots/
```

## What is real and what is not

| Layer | Status |
|---|---|
| Country geometry, centroids, disputed-territory policy | **Real.** Natural Earth 110m, public domain. Kosovo, N. Cyprus and Somaliland have no M49 code, so they render as geometry with no data join and no corridors. |
| Population, migrant stock, GDP per capita, unemployment | **Real.** World Bank WDI, CC BY-4.0, each figure rendered with the year it was observed. |
| Reporting completeness | **Real**, derived from which indicators a country actually reports and how stale its migrant-stock observation is. Drives arc opacity. |
| Corridors | **Real.** Gaskin & Abel (Zenodo 17344747, `mig_bilateral.csv`, CC BY-4.0) — a deep recurrent network over 18 covariates, annual 1990–2023, 230 countries. Column `mig_prev`, self-flows dropped. |
| Cross-model disagreement | **Real.** Abel (figshare 14579241, `bilat_mig_sex_type.csv`, CC BY-4.0), estimator `da_pb_closed`, summed across sex and filtered to `type=outward`. Compared only on the six 5-year periods both models share. |

## What the real data turned out to say

The two models disagree far more than the literature's "tens of percent". Median relative
disagreement across 6,378 corroborated corridor-periods is **80%**, p90 is **172%**. Spot
checks on major corridors, 5-year totals:

| Corridor | Period | Spine | Second model | Ratio |
|---|---|---|---|---|
| MEX→USA | 2010 | 1,632,091 | 2,120,611 | 0.77 |
| IND→ARE | 2015 | 1,456,769 | 419,041 | 3.48 |
| SYR→TUR | 2015 | 1,847,235 | 312,320 | 5.91 |
| UKR→POL | 2015 | 114,853 | 18,491 | 6.21 |

These are not bugs. They are two competent published estimates of the same corridor. That
gap is the product.

Only 1,098 of 1,548 corridors have a second opinion at all, and the shared grid stops at
2019 — so from 2020 onward **nothing is corroborated**, and the globe renders every
corridor grey and dotted to say so.

## Known limits of this slice

- **Reporting completeness barely discriminates.** It measures *whether* a country reports,
  so most reporters cluster near 94%. The build prompt requires per-series quality flags
  instead; this is a placeholder and the UI says so.
- **The fixture has no inbound corridors for low-income origins**, because it only generates
  flows toward higher-income destinations. The inspector states this rather than rendering a
  zero.
- Arcs are drawn without depth testing, so the far hemisphere is culled in JS from the camera
  vector instead. `ArcLayer` was tried first and rejected: it draws a chord through the
  sphere, which is mostly inside the globe and renders as endpoint stubs.
