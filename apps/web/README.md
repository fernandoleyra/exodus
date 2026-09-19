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
| Corridors | **SYNTHETIC.** A gravity fixture over the real stocks. Two friction exponents stand in for two models and their divergence drives the disagreement channel. Badged in the UI and in the source ledger. Not a published estimate. |

The real bilateral spine (Gaskin & Abel, Zenodo 17344747, 146 MB) is what replaces the
fixture at M1. Nothing else in the pipeline has to change: the renderer reads corridors by
index into places, which is what the connector will emit.

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
