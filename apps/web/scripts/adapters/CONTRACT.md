<!--
SPDX-FileCopyrightText: 2026 Exodus contributors
SPDX-License-Identifier: CC-BY-4.0
-->

# Adapter contract

One file per source family under `scripts/adapters/`. An adapter owns exactly one producer,
fetches from the network, caches raw under `.cache/layers/`, and returns rows plus a vintage.
It never writes into `public/`, never imports another adapter, and never edits a shared file.

```js
export const meta = {
  id: 'eurostat-protection',        // stable, kebab-case, used as the cache key
  producer: 'Eurostat',
  licenceId: 'LicenseRef-Eurostat-Reuse',
  commercialUseClear: true,
};

/** @returns {Promise<{layers: Layer[]}>} */
export async function load() { /* ... */ }
```

A `Layer` is:

```js
{
  id: 'eu-asylum-decisions',
  title: 'EU asylum decisions',
  question: 'How many first-instance decisions did this country issue?',
  unit: 'people',
  entity: 'country' | 'corridor',      // corridor rows are keyed 'ORIG>DEST'
  rows: { [key: string]: { [period: string]: number } },
  periods: ['2026-Q1', '2026-Q2'],     // ascending, as the producer labels them
  vintage: { /* src/vintage.ts Vintage, minus nothing */ },
  note: 'One sentence a reader needs before quoting a number from this layer.',
}
```

## Rules that are not negotiable

1. **Probe before you write.** Every endpoint, dimension code and period in your adapter must
   be one you observed this session. A code from documentation you did not call is a guess.
2. **Assert the shape before decoding.** For Eurostat, `Math.min(...size) > 0` before touching
   `value` — a wrong `unit` returns HTTP 200 with a zero-length dimension and an empty object.
   Decode **every** dimension in `id`, not the ones you asked for: an undeclared dimension
   shifts every index silently.
3. **Read `status` alongside `value`, and remember the flags are COMPOUND.** Eurostat ships a
   top-level `status` dict keyed by the same flat index. Its codelist
   (`.../codelist/ESTAT/OBS_FLAG`) has **42 codes**, and most of the interesting ones are
   combinations: `ep`, `bep`, `bdep`, `ip`, `bdu`, `dpu`. **Testing `flag === 'p'` misses most
   provisional values** — `migr_imm1ctz` at 2024 carries seven `p` but also four `ep` and one
   `ip`. Substring membership is the only correct test. Set `vintage.provisional` and
   `vintage.breaks` from it. A provisional Spanish month that reads as a 60% collapse is the
   failure this exists to prevent.
4. **`reporters.n` counts reporters, not rows.** A reporter is the body that files the
   statistic. On a corridor layer that is the DESTINATION — the origin is a breakdown of what
   the destination filed — so 31 reporters and 5,352 corridors are both correct about
   different things. `build-layers.mjs` accepts either "returned a cell" or "returned a
   non-zero cell", since a country reporting a real zero has filed.
5. **Never trust the last period in a codelist.** `lastTimePeriod=N` returns the last N entries
   of the time codelist, not the last N with data. Count reporters in the candidate period
   against the trailing median and fall back if it is short; put the real count in
   `vintage.reporters`. A tail of three fast reporters is not a period.
6. **Deny-list aggregates on every axis, not just geo.** `EU27_2020`, `EA20`, `EA21` on geo;
   `TOTAL`, `EU27_2020`, `EXT_EU27_2020`, `STLS`, `UNK`, `RNC`, `UK_OCT` on citizen. Summing a
   citizen axis naively returns roughly three times the truth. CBS aggregates **nest**
   (Afrika and Afrika-excluding-Morocco are both present).
7. **Quote the licence.** Put the operative sentence in a comment above `meta`, with the URL
   you read it at and the date. Watch the trap this project has been burned by twice: an
   organisation licensing its **website content** under CC BY while its **data** sits under a
   different instrument. If commercial reuse is not clearly granted, set
   `commercialUseClear: false` and say why.
8. **`latencyDays` is never stored.** Store `periodEnd`; age is computed at render.
9. **Keys are ISO-3166-1 alpha-3, always.** `places.json` is keyed by ISO3 and the globe looks
   up by ISO3. A layer keyed by Eurostat's two-letter `geo` codes loads cleanly, passes every
   other check, and paints an entirely empty world. Eurostat departs from the standard in two
   places — `EL` is Greece and `UK` is the United Kingdom — and the World Bank country list
   carries the `iso2Code`/`id` pairs to resolve the rest. `build-layers.mjs` rejects a layer
   whose keys are the wrong shape.
10. **A stock is measured at an instant, a flow over a period.** Eurostat's population tables
   are "usual residents on 1 January", so that layer's `periodEnd` is `2025-01-01` with
   `cadence: 'point'` — not the end of the labelled year. Deriving one from the other would
   report a 1 January stock as most of a year fresher than it is.
11. **No key, no registration.** The snapshot must rebuild from a clean clone.

## Traps already paid for, do not rediscover them

- **`www.imf.org`** rejects node's fetch outright and rejects a **browser** User-Agent with 403,
  while letting curl's own default UA through. **`api.imf.org` does not** — all four
  combinations of {curl, fetch} x {default UA, Chrome UA} return 200, probed 2026-09-20. Do not
  conclude from the first that the API is unreachable. `un.org` and `destatis.de` are the
  opposite again and need a browser UA; `opendata.cbs.nl` answers node's fetch with HTTP 406 for
  *any* headers while curl gets 200, and `esploradati.istat.it` answers fetch with 500 where
  curl gets 200 — and there a try-fetch-then-curl fallback is forbidden, because a failed
  attempt still spends one of five requests per minute. Use curl via `node:child_process` where
  fetch is blocked, and check the host rather than the organisation.
- IMF SDMX: the dataflow version is mandatory; some `series` have **no** `observations` key;
  series `attributes` arrays mix integer indices with inline literal strings; observation
  dimension entries carry `value`, not `id`.
- IRCC's xlsx has **no `xl/sharedStrings.xml`** — every cell including numerics is an inline
  `<is><t>`, so a parser reading `<v>` gets nothing at all. Its asylum file is **tab-separated
  despite the .csv extension and is valid UTF-8**; decoding it as latin-1 ships mojibake.
- ISTAT rate-limits to **5 requests/minute per IP** and blocks the IP for 1–2 days past that.
- Eurostat's `extension.annotation` carries `OBS_PERIOD_OVERALL_LATEST`, which gives the newest
  period in any dataset without pulling data. Use it to choose a period before fetching.
