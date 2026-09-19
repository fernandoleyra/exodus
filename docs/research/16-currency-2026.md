<!--
SPDX-FileCopyrightText: 2026 Exodus contributors
SPDX-License-Identifier: CC-BY-4.0
-->

# Making Exodus current — a verified plan

Produced 2026-09-19 by five parallel research lanes, each adversarially re-probed by a second
agent whose job was to refute it. **33 claims were refuted across the five lanes**, and where a
verifier contradicted a sweep the verifier's answer is the one recorded here.

## Corrections made after this document was returned

Two of its claims were checked against this repository and do not hold. They are left in place
below rather than edited out, because a research pack that quietly rewrites itself teaches
nothing:

1. **"`SE.PRM.ENRL.TC.ZS` is one of the four indicators in the coverage surface denominator
   (`build-snapshot-real.mjs:169`)" is FALSE.** The denominator is
   `const present = [p, s, u, g]` — population, migrant stock, unemployment, GDP per capita.
   The pupil-teacher ratio is not in it. The underlying observation is still right: that series
   is stale (max 2019, median 2018, 20 countries null), but the app already prints each figure's
   own observation year and already labels this one "Context only", so it is honest rather than
   broken. Nothing needs retiring.

2. **"delete the orphan `.cache/refugees.json`" describes a local artefact, not a shipped one.**
   `.cache/` is in `.gitignore`, so that 2-byte file was never committed. The latent break it
   points at is real and worth guarding — `SM.POP.REFG` and `SM.POP.REFG.OR` are deleted
   indicators that answer **HTTP 200** with a one-element array, so `j[1]` throws on a success
   status — but there is no repository debris to clean up.

## Confirmed independently

The plan's single most valuable claim was re-checked directly against `.cache/raw/mig_bilateral.csv`
and holds exactly:

| year | rows with `stock_mean` > 0 | rows with `mig_prev` > 0 |
|---|---|---|
| 2022 | 53,348 | 53,130 |
| 2023 | 53,343 | 53,130 |
| **2024** | **53,284** | **0** |

A 2024 bilateral stock layer — 53,130 off-diagonal corridors, 307.01 M people — is already
present in the file this repository builds from, under a licence already cleared and credited.
The flow spine really does terminate at 2023, and the same file proves both halves of that
sentence.

---

# EXODUS BUILD PLAN — "Can this be 2026?"

**Date:** 2026-09-19 · **Repo:** fernandoleyra/exodus (AGPL-3.0) · **Inputs:** five adversarially-verified lanes + completeness critic
**Author's own probes this session:** `migr_resfirst` (4 calls, plain curl, results below), repo inspection of `apps/web/src/{state,layers,App}.tsx`, `concordance/{types,stats}.ts`, `public/snapshot/{manifest,places,concordance}.json`, `scripts/`, `.cache/`.

---

## 1. The honest answer

**The bilateral flow spine cannot move past 2023, by anyone, under any licence, and that is arithmetic rather than laziness** — Gaskin & Abel read annual flows off a network trained to hit UN DESA bilateral stock anchors, the verifier opened `Data/UN_stock_data/stock_data.nc` and found `Year = [1990,1995,2000,2005,2010,2015,2020,2024]`, so the terminal flow year is (terminal anchor − 1) = 2023, and it moves only when UN DESA publishes a new anchor (no announced date; the "2027" figure is **[UNVERIFIED]**) and someone re-runs the model.

**What can carry genuine recency is everything that is not the spine:** a bilateral EU permits layer at 2025 and an EU protection layer at 2026-Q2 / 2026-07, four national registers at 2025–July 2026, a global bilateral UNHCR displacement layer at 2025, and macro context at 2025 with one real 2026-Q1 quarter from IMF BOP — none of which is a substitute for the spine, all of which are current.

**Therefore the platform should claim exactly this and nothing more:** *a 2023 global bilateral flow spine, a 2024 global bilateral stock layer, and clearly-badged current layers running to July 2026, each carrying its own vintage and latency* — a 2023 matrix shown beside a 2026-Q2 protection layer is honest; a single "2026" headline over the whole thing is a fabrication, and the word **"live" should be retired entirely**: the fastest complete bilateral cut anywhere in this investigation is 50 days old.

---

## 2. Tier 1 — wire now

Ordered by value per unit of work. **Latency is stated as age at 2026-09-19, computed from reference-period end.** Do not store these numbers — both the Eurostat and the IMF verifier independently caught the sweeps freezing `latencyDays` measured to the publisher's `updated` stamp, which drifts upward daily without the data changing. Store `periodEnd`; compute at render.

### T1-0 — Prerequisite, free, no network: split the spine's own badge
The verifier **refuted the spine lane's headline claim as fatal**: migrating Zenodo 17344747 → 18508919 does **not** buy a stock year. `stocks.nc` in the record Exodus already ships has `Year` dim = 35 (1990–2024), 2024 slice zero nulls, 53,053 populated off-diagonal corridors, 307.01 M total. **The stocks:2024 / flows:2023 split is available today from the shipped snapshot.** Do it first; it costs nothing and it is the architectural change every lane independently asked for.

The vintage migration to 18508919 is still worth doing, but justify it on **correctness, not on a year it does not deliver**, and put these in the acceptance criteria: 2023 global flow total moves 36.451 M → 34.724 M (−4.7%); `stock_std` shrinks ~10× (ZWE 2019: 1,375,890.2 → 158,333.69), which visibly changes any uncertainty band; columns renamed `orig`→`Origin ISO`, `dest`→`Destination ISO`, `year`→`Year`; **two** files removed, not one — `test_flows.nc` **and** `Iso_code_lookup.csv` (the verifier caught the second, and it is the crosswalk file the project needs — substitute the HuggingFace copy, 6,045 B, 249 rows, maps 234/235 IMS2024 destinations, the sole miss being M49 830 Channel Islands which has no ISO numeric code). Both files are `NETCDF3_64BIT_OFFSET`, **not** NetCDF4 — `h5py`/`h5netcdf` will fail.

---

### T1-1 — World Bank WDI, in-place refresh + displacement family
**Highest value-per-work in the entire investigation.** One existing script (`apps/web/scripts/fetch-wb.mjs`), one licence already cleared, five indicator upgrades and five new layers.

- **Endpoint:** `https://api.worldbank.org/v2/country/all/indicator/<CODE>?format=json&date=<Y>&per_page=3000`
- **Shape:** 2-element array; `[0]` header `{page,pages,per_page,total,sourceid,lastupdated}` (`lastupdated` = `2026-07-13`); `[1]` rows `{indicator,country,countryiso3code,date,value,unit,obs_status,decimal}`. **Value field = `value`.** Filter aggregates by joining `countryiso3code` against `https://api.worldbank.org/v2/country?format=json&per_page=400`, keeping `region.id` ∉ {`NA`, ""} → exactly 217 real countries.
- **Licence:** CC BY 4.0. *"The World Bank Group makes data publicly available according to open data standards and licenses datasets under the Creative Commons Attribution 4.0 International license (CC-BY 4.0)."* — https://datacatalog.worldbank.org/public-licenses. Redistribution of a derived dataset: permitted. Keyless.

| Code | Now in snapshot | Move to | Coverage | Kind | Age |
|---|---|---|---|---|---|
| `SP.POP.TOTL` | 2023 (169 places) | **2025** | 217/217 | modelled (midyear est.; WPP revision **[UNVERIFIED]**) | 262 d |
| `SM.POP.NETM` | not wired | **2025** | 217/217, now **annual** not 5-yr blocks | modelled (WPP, no national component) | 262 d |
| `SM.POP.TOTL` | 2020 (169 places) | **2024** | 215 | modelled (UN DESA, mid-year ref) | 810 d |
| `SL.UEM.TOTL.ZS` | 2023 | **2025** | 182 | **modelled ILO** — already badged correctly | 262 d |
| `NY.GDP.PCAP.PP.KD` | 2023 (161 places) | **2024**, not 2025 | 195 vs 185 at 2025 | modelled (ICP conversion) | 627 d |
| `SM.POP.RHCR.EA` / `.EO` | not wired | **2025** | 176 / 198 | reported (UNHCR-sourced) | 262 d |
| `SM.POP.ASYS.EA` / `.EO` | not wired | **2025** | 175 / 199 | reported | 262 d |
| `SM.POP.FDIP` | not wired | **2025** | 178 | reported | 262 d |

**UI surfaces:** `stockshare` surface moves 2020 → 2024 (the snapshot currently has `stockYear: 2020` for all 169 places). New **diverging** surface `netmigration` — the `buildScale` diverging path and `DIV_NEG`/`DIV_MID`/`DIV_POS` ramps already exist and are unused by any surface except `net`; verified values track real events (UKR 2022 −5,699,445 → 2025 +1,702,358; DEU 2022 +981,552 → 2025 −334,072). Two new sequential surfaces: **Refugees hosted** (`.EA`) and **Refugees originating** (`.EO`) — these are **marginal totals, not a matrix**; the UI must not let a user click through to a corridor.

**Two latent breaks to fix in the same PR:**
1. `SM.POP.REFG` and `SM.POP.REFG.OR` are **deleted**. They return **HTTP 200** with body `[{"message":[{"id":"175","key":"Invalid format","value":"The indicator was not found. It may have been deleted or archived."}]}]` — a single-element array, so `d[1]` throws `IndexError` on a 200. `apps/web/.cache/refugees.json` is **2 bytes containing `[]`** and no fetch script references it: an abandoned attempt, exactly this failure. Guard: assert `d[1]` exists and is non-null. Note `date=2026` also returns 200 with `d[1] === null`.
2. **`SE.PRM.ENRL.TC.ZS` is wired and is rendering 2010–2019 data under a 2023 headline.** Shipped `places.json` `ptrYear` distribution: 2018=70, 2017=46, 2016=12, 2015=9, 2019=3, ≤2014=14, **null=20**; maximum 2019. It is one of the four indicators in the `coverage` surface denominator (`build-snapshot-real.mjs:169`). Either drop it from the denominator or pin it at 2018 with its own 8-year badge. Do not "refresh" it — it is dead (2019 has 4 real countries; nothing 2020–2026).

---

### T1-2 — Eurostat `migr_resfirst` — first residence permits (2025). **The strongest EU layer, and no lane swept it.**
Found by the completeness critic; **I re-probed it independently this session** and reproduce it exactly.

- **Endpoint:** `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/migr_resfirst?format=JSON&citizen=TOTAL&reason=TOTAL&duration=TOTAL&unit=PER&geo=DE&lastTimePeriod=3`
- **My probe:** HTTP 200, `application/json`, 2,873 B. `updated 2026-09-11T11:00:00+0200`. `id = ['freq','reason','citizen','duration','unit','geo','time']` (**no sex, no age, no agedef**). Time categories `{2023:0, 2024:1, 2025:2}`. DE TOTAL: 2023 = 662,888 / 2024 = 544,987 / **2025 = 605,292** — digit-for-digit the critic's figure. DOI `10.2908/MIGR_RESFIRST`.
- **Bilateral, confirmed by me:** `geo=DE&time=2025` with `citizen` unpinned → `size [1,1,178,1,1,1,1]`, **177 populated, 165 non-zero**. `citizen=SY&time=2025` → 35 geo entries in codelist, **32 populated** (AT 4,368; BE 4,229; BG 116; CH 214; CY 1,444; CZ 144). A genuine origin × destination matrix.
- **`unit=NR` trap, confirmed by me:** HTTP 200 with `size [1,1,1,1,**0**,1,1]` and `value {}`. Use `unit=PER`. The generic guard the Eurostat verifier proposed — **assert `min(size) > 0` before decoding** — catches this and the `age=TOTAL`-on-`migr_asyumactm` class in one line.
- **No partial-tail trap on this table.** `extension.annotation` carries `{"type":"OBS_PERIOD_OVERALL_LATEST","title":"2025"}` — 2026 is not in the codelist at all. **New generic finding: `OBS_PERIOD_OVERALL_LATEST` gives the newest period in any Eurostat dataset without a data pull.** Use it to pick a period before fetching.
- **Newest period:** 2025 · **coverage** 32 geo (31 reporters + EU27_2020; only IS drops vs 2024) · **kind** reported · **age 262 d**.
- **Licence:** Commission Decision 2011/833/EU. *"Reuse of statistical data, metadata, publications, and other dissemination tools published on this website for commercial or non-commercial purposes is authorised provided the source is acknowledged. The reuse policy of the European Commission is implemented by the Decision of 12 December 2011."* — https://ec.europa.eu/eurostat/web/main/help/copyright-notice (verifier confirmed verbatim, HTTP 200). **Not CC BY** — that page confines CC BY 4.0 to *"the editorial content of this website."* Keyless.
- **Why it matters more than the asylum tables:** it measures **labour, family and study migration** — the thing Gaskin & Abel actually estimates — not protection. DE 2025 splits EDUC 112,500 / EMP 108,091 / FAM 225,591 / OTH 159,110 / TOTAL 605,292. It is a year fresher than `migr_imm1ctz` (2025 vs 2024) and it defeats the Eurostat lane's own correct objection that asylum is 1–2% of global flows selected on the least representative corridors.
- **UI surface:** a new corridor layer **"EU first residence permits"** with a reason facet (the app has no facet control today — this is the first layer that needs one), plus the concordance pair in §6.3. Siblings also at 2025: `migr_resvalid` (permit stocks), `migr_eirtn` (returns, and it carries a `c_dest` dimension — an actual destination-of-return axis, the only outbound-directed EU series found).

---

### T1-3 — Eurostat quarterly protection: `migr_asydcfstq` at 2026-Q2
- **Endpoint:** `.../migr_asydcfstq?format=JSON&citizen=TOTAL&sex=T&age=TOTAL&unit=PER&decision=TOTAL&lastTimePeriod=5`
- **Newest period 2026-Q2, 33 geo entries, full — and it is the last entry in the time codelist, so no partial tail.** Verifier reproduced every reporter count exactly. Bilateral confirmed: `citizen=AF` at 2026-Q2 resolves across all 33 destinations (AT 715, BE 940, BG 50, CH 1,275, CY 60, CZ 5, DE 12,360, DK 40…); `geo=DE` carries values for all 206 citizen members.
- **Kind: reported, with publisher flags — the verifier refuted the sweep here and wins.** A top-level **`status`** dict exists in 12 of 14 tables, keyed by the same flat index as `value`. `migr_asydcfstq` returned `{"42":"b","45":"p","46":"p","47":"p","48":"p","49":"p"}` = **Greece break-in-series at 2025-Q4** (value 15,950) and **Spain provisional at 2025-Q2/Q3/Q4, 2026-Q1 and 2026-Q2** (25,275). The sweep asserted no `status` key was present in any response. It is present, and it means `estimateKind: "reported"` is not uniformly right for 2026 cells.
- **`decision` has SIX codes, not four** (verifier): `['TOTAL','POS','POS_RFG','POS_HUM','POS_SPROT','NEG']`, and `POS` is an aggregate of the three `POS_*`. `migr_asywitfstq` has a **different** four (`['TOTAL','POS_RFG','POS_HUM','POS_SPROT']`, no POS, no NEG) — the two quarterly tables **cannot share a decision enum**.
- **Age 81 d** (not the sweep's stored 78). **Licence** as T1-2, DOI `10.2908/MIGR_ASYDCFSTQ` in `extension.annotation`. Keyless.
- **UI surface:** a new **quarterly** corridor layer, "EU asylum decisions", with a provisional/break glyph. Also wire `migr_asytpfq` and `migr_asywitfstq` (both 2026-Q2, 33 reporters, full) — one JSON-stat decoder serves all.
- **Mandatory before summing:** drop `EU27_2020`/`EA21` from the **geo** axis *and* aggregates from the **citizen** axis. The verifier's sharpest catch: the sweep flagged citizen-axis contamination only for `migr_imm1ctz` and missed it for the asylum lane. At `geo=DE, time=2026-Q2`, `citizen=TOTAL` is 42,825 while the sum of two-letter members is 41,955 — **naive summation across the 206 members returns roughly 3× the truth**, because TOTAL, EU27_2020 and EXT_EU27_2020 all sit inside the axis. Denylist ≥ `{TOTAL, EU27_2020, EXT_EU27_2020, STLS, UNK, RNC, UK_OCT}`.
- **Do not advertise 206 origins.** At `geo=DE, 2026-Q2` all 206 return a value but **only 101 are non-zero**. Real corridor breadth into Germany is ~100.

### T1-4 — Eurostat monthly temporary protection: `migr_asytpsm` (stock) + `migr_asytpfm` (flow) at 2026-07
Freshest near-complete bilateral cut anywhere in the investigation. **Age 50 d.** Coverage 31 geo entries — the verifier corrected "31 of 31" to **31 of 32**: Iceland drops out at 2026-07, so 30 real reporters against 31 in prior months. Identical `id` shapes, one adapter serves both. `migr_asytpsm` is a **stock at end of month — never sum across months**. Overwhelmingly Ukrainian (DE 2026-06: UA 1,250,825 of TOTAL 1,286,840 = 97%), so it answers a different question from applications and must be its own layer.

### T1-5 — Eurostat monthly applications `migr_asyappctzm` at 2026-06 (age 81 d)
Dimension is **`applicant`**, not `asyl_app` (the latter returns HTTP 400 id 150 `INVALID_QUERY_DIMENSION` on a fully-pinned query; on an *unfiltered* query it surfaces as 413 instead, because the size check runs before dimension validation). Codes `TOTAL|FRST|SSEQ`. Values sanity-checked: DE 5,790, FR 11,105, BE 2,195, EL 4,120, ES 3,005, CH 1,775, EU27_2020 43,120. **Spain is flagged provisional at 2026-03..06** — and ES 3,005 is a steep drop from 8,275 the month before, exactly the case where an unread provisional flag becomes a false headline.

**The partial-tail rule, which applies to every monthly table here:** `lastTimePeriod=N` returns the last N entries of the **time codelist**, not the last N periods with data. 2026-07 (13 of 32) and 2026-08 (3: EE, LI, ME) return HTTP 200 with real numbers from a self-selected handful of fast reporters; the EU27_2020 aggregate runs 57,725 → 52,660 → 50,670 → 43,120 for 2026-03..06 and then **vanishes entirely** while BE and CH keep reporting. Charting that tail shows applications collapsing ~90% in two months. **Gate on reporter count against the trailing median, not on non-nullness.** `updated` is not a freshness ranking: `migr_asypenctzm` has the latest stamp (2026-09-18) and the stalest usable data (2026-05).

### T1-6 — CBS Netherlands `85484NED` — monthly, July 2026, **the cleanest source found**
- **Endpoint:** `https://opendata.cbs.nl/ODataApi/OData/85484NED/TypedDataSet?$filter=Perioden eq '2026MM07' and Geslacht eq 'T001038' and Geboorteland eq 'T001638'&$select=Herkomstland,Immigratie_1,EmigratieInclusiefAdministratieveC_2`
- **Newest 2026MM07**, national total in 23,148 / out 24,524; `Modified 2026-08-31T02:00:00`; **age 50 d**; both directions in one call.
- **Coverage — verifier correction:** the sweep's "266 origin countries" is the non-null *cell* count. 13 of those 266 are aggregates/residuals (`T001040` Totaal, `1012600` Nederland, `2012605` Buiten Nederland, five continents, three "excl." variants, `2012659` Onbekend). **Genuine countries = 253**, and the aggregates **nest** (Afrika and Afrika-excl-Marokko both present), so naive summing double-counts badly.
- **`Herkomstland` is the bilateral dimension; `Geboorteland` has only 3 codes.** Period codes `YYYYMM##` (monthly) and `YYYYJJ00` (annual) live in the same table — filter to the MM form. `$orderby` is silently ignored. 2026 figures are *voorlopig* (provisional); ≤2025 definitief.
- **Licence:** CC BY 4.0. Cite **https://data.overheid.nl** (CKAN declares dataset 85484NED `license_id: http://creativecommons.org/licenses/by/4.0/deed.nl`), **not** the CBS website copyright page — that page is scoped to *"the content of this website"* and is the website-vs-data trap this project has already been burned by twice. Keyless.
- **UI surface:** the first **monthly** layer in the app, and the anchor for the per-layer cadence model in §5.

### T1-7 — IRCC Canada — PR admissions + asylum claimants, July 2026 (age 50 d)
- **PR admissions:** `https://www.ircc.canada.ca/opendata-donneesouvertes/data/EN_ODP-PR-Citz.xlsx` — HTTP 200, 204,764 B, `Last-Modified: Tue, 15 Sep 2026 11:30:32 GMT`, title cell *"…January 2015 - July 2026"*. **No `xl/sharedStrings.xml` — every cell including the numerics is an inline `<is><t>`, so a parser reading `<v>` gets nothing at all**, not merely missing labels. Layout: row 0 title, row 2 year band, row 3 quarter band, row 4 month header, rows 5+ one country each.
- **Coverage — verifier correction:** 218 country rows, 190 numeric, **only 144 non-zero for July 2026**. "~220 countries" is a row count. `'--'` means suppressed, **and literal `0` also appears 46 times in the same column** — they are distinct in the data, and the workbook's own note claiming 0–5 are always shown as `--` is contradicted by the data. Counts are rounded to 5.
- **New, verifier-only:** the 2026 band carries a trailing **`Q3 Total` column that equals July alone** (GP == GO for all 218 rows). An adapter keeping quarter totals will publish a "Q3" that is one month.
- **Asylum claimants:** `.../ODP-Asylum-Top25CitzProv-LastMonth.csv` — 1,176,882 B, 14,287 rows, tab-separated despite the extension, newest (2026, Jul) with 26 citizenship labels. **The file is valid UTF-8 — the sweep's `encoding='latin1'` instruction is inverted and is the single most damaging line in the whole investigation.** `raw.decode('utf-8')` succeeds on all bytes; É is `0xC3 0x89`. Following the sweep verbatim ships mojibake across every French column and accented country name. Top-25 only, so national totals by country cannot be reconstructed.
- **Licence:** Open Government Licence – Canada. *"Copy, modify, publish, translate, adapt, distribute or otherwise use the Information in any medium, mode or format for any lawful purpose."* — open.canada.ca CKAN declares `license_id: ca-ogl-lgo` machine-readably. Keyless. These are **admissions** (a legal-status event), not residence registrations.

### T1-8 — IMF BOP quarterly — **the only genuine 2026 reference period in the macro stack**
- **Endpoint:** `https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/BOP/21.0.0/*.CD_T.D752_S1W.USD.Q?attributes=none&format=sdmx-json` (371,216 B; the dataflow version `21.0.0` is **mandatory** — omit it and you get 404).
- **Newest usable 2026-Q1 at 88 countries** (2026-Q2 exists at 21 — a leading edge, not a layer). Verifier re-counted **non-zero** separately to test for zero-padding: 2026-Q1 = 87/88 genuinely non-zero. MEX personal transfers 2026-Q1 = 14,698,428,632. **Age 172 d.** Kind: **reported outturns**. Keyless. Use `CD_T` (credit ≈ money sent home by this country's emigrants) **and** `DB_T` (debit ≈ sent out by immigrants living here) for a bidirectional read — strictly more informative than the World Bank's receipts-only series, though still **not bilateral** (no counterpart-country dimension exists).
- **Licence — the verifier closed a blocking compliance item the sweep declared unresolvable.** `www.imf.org/en/About/copyright-and-terms` is 403 Akamai to every client, but **web.archive.org serves it** (capture `20251229102103`), contradicting the sweep's claim that the archive was unreachable. Operative Data clause: *"You may download, extract, copy, create derivative works, publish, distribute, and use Data obtained from IMF Sites, subject to the following conditions:"* — attribution in the form *"Source: International Monetary Fund, Database Name, <<link to the dataset>>"*, no alteration affecting nature or accuracy, explicit statement if materially transformed. The scope list names **Balance of Payments (BOP)** and the **World Economic Outlook database** explicitly.
- **⚠ Carve-out no sweep surfaced, and it sits directly on this lane's only 2026 finding:** *"For any potential commercial reuse of IMF Data, please email copyright@imf.org to request permission."* Exodus is AGPL-3.0, which permits commercial downstream use. **IMF layers are therefore not equivalent to the CC BY 4.0 layers and must not be badged as though they were.** This is a maintainer decision, not a blocker — see §7 of the licence audit below.
- **Parser traps (two the sweeps missed, both crashed the verifier's code):** (a) some `series` objects have **no `observations` key** — use `.get()` and skip; (b) series-level `attributes` arrays **mix integer indices with inline literal strings**: for `USA.PPPPC` the array is `[0, 0, 0, '9/30/2025']`, so reading the `values` list for `COUNTRY_UPDATE_DATE` returns empty and makes a populated attribute look unpopulated. Also: observation dimension entries carry a **`value`** key, not `id`; empty path segments return 200 with **no `series` key**; `dimensionAtObservation=AllDimensions` silently discards the key filter.
- **UI surface:** a remittance context figure in the LayerPanel, plus the concordance pair in §6.7. **Do not use `R1_S1W`** — 16 countries at 2025, of which only **4 non-zero**.

### T1-9 — Destatis (DE, 2025) and ISTAT (IT, 2025) — the pair that enables cross-validation
- **Destatis:** `https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Wanderungen/Publikationen/Downloads-Wanderungen/statistischer-bericht-wanderungen-2010120257005.xlsx?__blob=publicationFile` — 573,049 B, 35 sheets, use **`csv-12711-05`**. Columns `Statistik_Code…Wanderungssaldo_Ausland`; value fields `Zuzuege_aus_dem_Ausland` **and** `Fortzuege_in_das_Ausland` — **both directions in one table**, unique in this investigation. Europa/Insgesamt/2025 = 907,199 in / 822,085 out / +85,114. Verifier correction: **627 data rows = 209 partners × 3 sex categories**, not 210 × 3 (630 is arithmetically impossible); 210 is the count of distinct partner labels. `EU-Staaten (EU27)` is present alongside the continent aggregates, so **filter by explicit allow-list, not by the names given**. Requires a browser UA; `?__blob=publicationFile` is mandatory; the file-id segment encodes the year (…**5**7005 = 2025), so it is **not** a stable "latest" pointer — discover the link from the publications page.
- **Destatis licence — verifier corrections in both directions:** the sweep's `[UNVERIFIED]` flag is **over-cautious** (the page reads fine as raw text: *"The statistical data can be reused in compliance with the Data Licence Germany 2.0 conditions."*), but the **specific instrument is genuinely unconfirmed** — DL-DE 2.0 exists as both *Namensnennung* (BY) and *Zero*, the page names neither, and the workbook contains zero occurrences of "Lizenz"/"DL-DE", granting only *"Vervielfältigung und Verbreitung, auch auszugsweise, mit Quellenangabe gestattet."* Redistribution with attribution is clearly permitted; **"DL-DE BY 2.0" remains an inference** and should be badged as "Data Licence Germany 2.0 (variant unconfirmed)".
- **ISTAT:** `https://esploradati.istat.it/SDMXWS/rest/data/IT1,28_185_DF_DCIS_MIGRAZIONI_3,1.0/all?startPeriod=2025` with `Accept: application/vnd.sdmx.data+csv`. Inbound `_3`: 197 `COUNTRY_PREV_RESID` at 2025; outbound `_6`: 181 `COUNTRY_NEXT_RESID`. Value field `OBS_VALUE`. **100% of 2025 rows carry `OBS_STATUS='p'` — provisional, and must be rendered as such.** Licence CC BY 4.0: *"Share — copy and redistribute the material in any medium or format for any purpose, even commercially"* / *"Adapt — remix, transform, and build upon the material for any purpose, even commercially"* (https://www.istat.it/en/legal-notice/, verbatim). **Hard rate limit 5 req/min per IP; exceeding it blocks the IP for 1–2 days** — the snapshot builder must throttle. `/dataflow/IT1/DCIS_MIGRAZIONI/latest` is 404: that is the *datastructure* id, not the dataflow id.
- **Age 262 d each.** Both keyless. **Why they are worth the extra work despite that:** DE and IT both publish origin *and* destination detail at 2025, which makes §6.10 — the only true bilateral cross-validation available anywhere in this investigation — possible today.

### T1-10 — UK Home Office asylum tables, 2026-Q2 (age 81 d)
`https://assets.publishing.service.gov.uk/media/6a85c315b0504df9f2c89800/asylum-summary-jun-2026-tables.ods` — HTTP 200, 121,209 B, 25 tables, nationality detail present, `'2026 Q2'` appears 26 times and `'2026 Q3'` zero times. OGL v3.0: *"You are free to: copy, publish, distribute and transmit the Information; adapt the Information; exploit the Information commercially and non-commercially"* (nationalarchives.gov.uk, verbatim). **The media path carries a per-release content hash that changes every quarter** — the adapter must scrape https://www.gov.uk/government/statistical-data-sets/immigration-system-statistics-data-tables. Browser UA required. ODS uses `table:number-columns-repeated` compression. Lower priority than T1-1..9 purely because of the hash-scraping cost.

---

### Tier 1-B — ready to wire, **blocked on one human action each. Not cleared to ship.**

**B1 — UNHCR Population API, 2025. The single biggest prize in the investigation, and it is licence-blocked.**
Global bilateral: `/population/` = 6,290 rows, 209 origins × 178 destinations, **one request** at `limit=10000`; `/asylum-applications/` = 6,009 rows, `total: {"applied": 3343203}`; `/solutions/` = 846 rows (the most **flow-like** layer in the stack, hence the closest analogue to the spine); `/demographics/` = **6,292 rows, not ~21,000** (verifier: `maxPages:630` at `limit=10`, and the whole year returns in one page at `limit=20000` — the sweep's figure was 3.3× too high and would mislead anyone sizing the pull). Reconciles exactly to the published Global Trends: 28,461,306 + 7,177,473 + 5,964,782 = **41,603,561** = the stated "41.6 million". **Age 262 d.** Keyless. `/nowcasting/` reaches **July 2026** but is **destination-only** — every row `coo_iso="UNK"`, and the 170 rows sum exactly to the flat global 28,205,732, proving origin is absent rather than suppressed. It uniquely carries a per-row `source` string (UNHCR operational data 83, official statistics 36, Government 17, + 6 combinations).

**Why blocked:** `www.unhcr.org` is a **total WAF block** — 403 to plain curl, to Mac and Linux Chrome UAs, to WebFetch, on `/us/terms-use-datasets`, `/terms-use-datasets`, three country mirrors and the canonical `/what-we-do/data-and-publications/data-and-statistics/terms-use-datasets`. Unlike imf.org (curl works) and un.org (browser UA works), **nothing works**. `api.unhcr.org/docs/refugee-statistics.html` (1,224,488 B) contains **no data licence at all** — every licence string is bundled JS. **The sweep's structured fields said `redistributable: true, verified: true` while its own prose said a human must confirm before shipping** — a pipeline reading the JSON ships five datasets on a licence nobody has read. **Set `redistributable: false-pending`.** And the verifier's HDX CKAN probe shows UNHCR licensing its own datasets under **at least four different instruments** — the Statistical Yearbook, the closest analogue to this corpus, is `cc-by-igo`, a *different instrument* from CC BY 4.0, with differing warranty and dispute terms that an AGPL project must assess separately.
**The one action:** a human on an unblocked network opens https://www.unhcr.org/what-we-do/data-and-publications/data-and-statistics/terms-use-datasets, establishes **which** Creative Commons instrument applies to the Population API, and pastes the sentence. **Also retry web.archive.org** — one lane declared it unreachable and the IMF verifier proved that wrong, closing a blocking item.
**Regardless of outcome: `/idmc/` and `/unrwa/` stay out** on the §6 third-party carve-out (*"Some datasets and indicators are provided by third parties, and may not be shared, redistributed or reused without the consent of the original data provider"*). Note the verifier refuted the sweep's shape claim — both **do** return country rows under `coo_all/coa_all` (IDMC 53, UNRWA 5) — but the blocker is legal, not technical. UNRWA's 5,964,782 is required to reproduce UNHCR's published 41.6 M headline, so **cite UNRWA directly** rather than relaying.

**B2 — Frontex monthly border detections, JUL2026. The fastest migration count anywhere (41-day publication lag, age 50 d), and its licence is unread.**
`https://www.frontex.europa.eu/assets/Migratory_routes/2026/Monthly_detections_of_IBC_2026_09_02.xlsx` — HTTP 200, 1,504,049 B, sheet `Detections_of_IBC`, 211 monthly columns JAN2009→JUL2026, **899 of 900 rows populated at JUL2026**, 162 nationalities (66 non-zero), 9 routes, total 13,033 (Algeria 2,585, Morocco 2,068, Sudan 1,103, Afghanistan 803, Ukraine 772). **No partial-reporter tail** — cleaner than every Eurostat monthly series.
**Why blocked:** `frontex.europa.eu/legal/` is **404** and the reuse terms were never read. **Frontex is an EU *agency*; Decision 2011/833/EU covers Commission documents and agencies adopt it separately — do not assume the Eurostat licence carries over.** Also: nationality is a **free-text English country name**, the worst coding system encountered.
**The one action:** locate and read the Frontex reuse decision. If it grants derivative redistribution, this is a Tier 1 layer and arguably the best "fast" layer the platform can have.

**B3 — UN DESA International Migrant Stock 2024.** `https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/undesa_pd_2024_ims_stock_by_sex_destination_and_origin.xlsx` — 6,005,287 B, **browser UA required (curl default UA → 403, the exact inverse of imf.org)**. Table 1, **header on row 11**, three repeated 8-column year blocks (both sexes / male / female), join on UN **M49** codes. Genuinely bilateral: 9,042 country×country corridors at 2024 summing to **281.96 M**. Cell D6 of every sheet reads verbatim: *"Copyright © 2024 by United Nations, made available under a Creative Commons license CC BY 3.0 IGO."*
**Why blocked:** the spine lane gave this a green light **without opening the terms page**, and `https://www.un.org/en/about-us/terms-of-use` says the opposite — *"…for the User's personal, non-commercial use, without any right to resell or redistribute them or to compile or create derivative works therefrom…"* — reserving only more specific **restrictions**, not more specific grants. **This reverses a recorded project decision:** `docs/design/01-candidate-rigour-first.md` D1 already quotes that exact sentence, concludes *"A git clone that ships a derivative of it is a licence violation on the first commit"*, and routes DESA to a gitignored local-ingest path excluded from `snapshot:build`. **The verifier wins; the sweep's green light does not stand.** The specific-over-general argument (an embedded CC grant inside the work beats general site terms) is genuinely arguable and may well be right — but it must be **made explicitly and written down as a decision record**, not assumed.

---

## 3. Tier 2 — optional pluggable adapters only

**Rule 3 is absolute: the snapshot must rebuild from a clean clone.** None of these may be a hard dependency.

| Source | Gate (verbatim) | What it would add | Vintage |
|---|---|---|---|
| **UCDP GED** | HTTP 401 `text/plain`: *"API token required. Add header: x-ucdp-access-token: <your-token>"* — on **every** version (25.1, 24.1, 23.1, 22.1). No keyless escape hatch. **Any project note saying UCDP is keyless is stale.** | Conflict events + fatalities as a push-factor trigger. Data itself is CC BY 4.0, so a registered user *could* redistribute — the gate is the only blocker. | current |
| **IDMC GIDD** | HTTP 403 `application/json`: `{"detail":"Client is not registered."}` — identical with `&client_id=test`, confirming a real allowlist. | IDP stocks and new displacements, country-level. Also the only lawful route to the `/idmc/` numbers. | 2025 |
| **Destatis GENESIS-Online** (table 12711) | 307 → SPA HTML; anonymous `GAST/GAST` no longer works; free registration required. | Richer cut of the same 12711 table. **The open Statistischer Bericht xlsx (T1-9) is the key-free substitute and carries the same 2025 origin-country table** — so this is low priority. | 2025 |
| **US Census ACS** | HTTP 302 → `api.census.gov/data/missing_key.html`. | `B05006` foreign-born **stock** by place of birth. Newest vintage in `data.json` is **2024** — so a key buys a 2024 stock, not currency. | 2024 |
| **Banxico SIE** | 200 with a **2-byte body** without a token. | Mexican remittance detail. | — |

**Config surface (one pattern for all five).** The repo already has the right shape from D1's DESA decision — generalise it:
- `apps/web/adapters.local.json` (gitignored), `{ "<adapterId>": { "token": "…" } }`, plus `EXODUS_<ADAPTER>_TOKEN` env override for CI/secret managers.
- One command per adapter: `npm run ingest:local -- <adapterId>`, writing to `apps/web/.cache/local/<adapterId>/` (gitignored). **No optional adapter may write into `public/snapshot/`.**
- `npm run snapshot` must not read `.cache/local/` at all. Add a CI job that builds from a **clean clone with `adapters.local.json` absent** and asserts a byte-identical snapshot — that is the only real enforcement of rule 3.
- Every optional layer renders with an explicit "local adapter — not in the public snapshot" badge, so a fork's screenshots never imply the public build contains it.

---

## 4. Tier 3 — rejected, with reasons

**This section is the deliverable.** Several of these were paid for twice already.

**Spine successors — all dead for recency**
- **Re-running the Gaskin & Abel model.** GPL-3.0, code archived at `10.5281/zenodo.19555786`, retrainable in principle. **Buys zero extra flow years** — the network is trained to hit UN DESA anchors and the terminal anchor is 2024, which the published vintage already exploits. Fresher covariates cannot manufacture an anchor. Would also produce numbers diverging from the peer-reviewed Nature figures with no authority behind them. **Do not do this.**
- **A newer Gaskin Zenodo version.** Does not exist. Concept `15623215` has exactly 3 versions; the newest (18508919, 2026-05-22) still has `flows.nc Year` dim = 34 ending 2023. Its *description* still says "Year: 1990–2023" while the data contains a 2024 **stock** year — stale in the opposite direction from usual.
- **Abel figshare 7731233 v8.** The most important negative in the investigation: v8 **did** ingest IMS2024/WPP2024, so it looks like it should reach 2020–2024. It does not — `year0` tops out at 2015 (verifier counted: 1990/1995/2000/2005 = 51,984 each, 2010/2015 = 52,900 each). Abel's stated reason, confirmed word-for-word on his own site: *"Although the IMS2024 contain bilateral stocks for 2024, I did not generate flow estimates for the 2020-2024 period, to avoid having a mix of estimates on four-year and five-year migration intervals over the entire period."* **A deliberate methodological refusal, not a pending release. Do not wait for it.** Same for figshare 14579241 v6 (the shipped second opinion) — refresh for the input revision if you like, but it buys no recency.
- **QuantMig.** The 5.93 GB Zenodo 8224827 deposit is raw MCMC `.RData` needing an R runtime — do not build an adapter. The **238,404-byte** derivative at `huggingface.co/datasets/ThGaskin/Migration_flows/…/Quantmig_flows.nc` is the usable form (30×30 European corridors, 2009–2019, 2.5/50/97.5% quantiles) — **worthless for recency, genuinely useful as an uncertainty comparator**. Note its diagonal is **NaN** (30 per year slice) and will poison a naive aggregate. Repo card stamps GPL-3.0 (AGPL-compatible); prefer the CC BY 4.0 Zenodo copies where a permissive licence matters.
- **Yildiz & Abel, Scientific Data 13:1279.** Deposited 2026-06-23; newest reference period **2015–2020**. A 2026 publication that is not a 2026 dataset — the exact failure rule 1 exists to catch. Also **destination-only**.
- **Any bilateral flow dataset with a 2025 or 2026 reference period, under any licence.** None exists. Not even a lagged one.

**OECD — budget zero engineering effort against it for the headline year**
- `DSD_MIG@DF_MIG` with the bare key `all` and `startPeriod=2025` → **HTTP 404, body `NoRecordsFound`, exactly 14 bytes**. There is no 2025 observation anywhere in the OECD international migration database, for any measure, any country. `B11` (inflows by nationality), `B12` (outflows) and `B16` (acquisitions of nationality) all 404 at `startPeriod=2024` — they stop at **2023, exactly where Gaskin & Abel already stops**. Only `B13` (asylum seekers) steps forward, to 2024 (36 destinations × 202 citizenships, of which one is `W`=World, so **201 true origins**). The premise that OECD publishes faster than the global compilations is **false** for the measures that matter.
- **OECD licence is `[UNVERIFIED]` and unverifiable from here:** `www.oecd.org/en/about/terms-conditions.html` is 403 Cloudflare to curl default UA **and** Chrome UA — a **third block pattern** distinct from imf.org and un.org. Since the only OECD contribution is one extra year on the asylum layer that Eurostat already beats at 2026-Q2, **this is not worth the licence work.**
- **Verifier correction to record:** the sweep's gotcha *"a 9-segment key yields 404"* is **inverted**. A 9-segment key returns **HTTP 200 with the same data** (525,499 B, 5,640 series). Over-long keys are silently tolerated, so a malformed adapter key produces plausible-looking data with no signal. Key validation cannot rely on server rejection.

**World Bank / IMF rejections**
- `SM.POP.REFG`, `SM.POP.REFG.OR` — **deleted**; 200 with an error-message body (see T1-1).
- `SE.PRM.ENRL.TC.ZS` — dead. Verifier correction: the sweep's counts were inflated by exactly 43 aggregate rows. Real-country counts are **2016=142, 2017=135, 2018=90, 2019=4, nothing 2020–2026**. "2018 (133 countries)" should read **90**.
- `VC.IDP.NWCV` / `VC.IDP.NWDS` — stop at 2023 (44 / 145 countries). Conceptually attractive (true annual flows) and two years too stale.
- `BX.TRF.PWKR.CD.DT` at 2025 — **94 of 217 countries**. A textbook rule-1 failure: rows exist, the layer does not. 2024 (160) is the last defensible year.
- `SH.MED.BEDS.ZS` / `SH.MED.PHYS.ZS` — terminate at 2023 and the 2023 cell (73 / 58 countries) is **worse than 2022** (111 / 125). **Pin at 2022 with a ~3-year badge; do not refresh.** Shipped `bedsYear`/`physYear` already spread 2010–2023 per country, which the per-layer model in §5 makes honest rather than hidden.
- `SM.POP.OPIP.EA/.EO` (27 / 2 countries), `SM.POP.RRWA.EA/.EO` (4 / 1) — too thin.
- **WDI for any 2026 period** — nothing. `date=2026` returns 200 with `{"page":0,"pages":0,"per_page":0,"total":0}` and `d[1] === null`.
- **IMF `R1_S1W`** — 16 countries at 2025, **4 non-zero**.
- **IMF projection-year marker** — does not exist through any reachable endpoint. `DSD_WEO(9.0.0)` declares an observation-level `DERIVATION_TYPE` attribute — exactly the right field — and it is returned with a **zero-length values array** under `attributes=dsd`, `all` **and** `msd`, in both the current and vintage flows. `OVERLAP` is the constant `'OL'` across all 208 series. The WEO bulk file carrying "Estimates Start After" is unreachable: the `.ashx` **302s to a `.pdf` URL that returns HTTP 200 with an Azure `BlobNotFound` body**, so a status-only check records success. **Consequence:** DataMapper is on the **April 2026** vintage, so **2025 is a staff-estimate year** — moving the app 2023 → 2025 recovers two years but 2025 must be labelled *"IMF staff estimate"*, never outturn. Cross-validate for free: where WDI has a non-null 2025 cell for the same concept, treat IMF 2025 as corroborated. **DataMapper silently ignores both the country path segment and every query parameter** (`/PPPPC`, `/PPPPC/DEU` and `/PPPPC?periods=…` are byte-identical at 179,847 B) — fetch the whole indicator and filter client-side. An unknown indicator returns 200 with no `values` key.

**Eurostat rejections**
- `lfsa_urgan` — has a `citizen` dimension but only **7 aggregate codes** (`EU27_2020_FOR`, `NEU27_2020_FOR`, `FOR`, `NAT`, `STLS`, `TOTAL`, `NRP`). No Syria, no Afghanistan. **Cannot be joined to a corridor**, and annual anyway.
- `une_rt_m` — usable at 2026-07 across 34 geos but **destination-only and modelled** (seasonally-adjusted output over an LFS sample, routinely revised). Admit as a **concordance series** (§6.8), not as a bilateral layer. **Verifier refutation:** the sweep's guard *"unpinned returns an empty value object"* is false — unpinned returns **162 non-null values mixing SA/NSA/TC and mixing `PC_ACT` percentages with `THS_PER` thousands in one object** (81, 199, 251 next to 5.7 and 4.1). A guard on "empty value object" **will never fire**, and the real hazard is silently averaging percentages against headcounts.
- `jvs_q_nace2` (job vacancies) — newest **2025-Q4**, `updated 2026-03-20`. The table looks frozen; **it is not a 2026 layer**. Recorded as a negative so nobody re-probes it.
- `migr_asyaccm`, `migr_asyumactm` — **subsets of `migr_asyappctzm`, never add them**. Useful only as ratios (accelerated-procedure intensity, unaccompanied-minor share). `migr_asyumactm`'s age codelist is `['Y_LT14','Y14-17','Y_LT18','UNK']` with **no TOTAL**; `age=TOTAL` returns 200 with `value:{}` and a literal `0` in the `size` array — the cheapest generic detector is **`assert min(size) > 0`**.
- `migr_asypenctzm` — worst lag in the lane, usable only at 2026-05 (age 111 d) despite the freshest `updated` stamp. Stock, never summed.
- `https://ec.europa.eu/eurostat/about-us/policies/copyright` — **404**, and widely cited. `https://ec.europa.eu/eurostat/about/policies/copyright` **302s into the ECAS login wall and returns HTTP 200 with a login page**, so a naive status check records it as a valid licence page. Live page: `/web/main/help/copyright-notice`.
- **Commercial-reuse exception, resolved but not as the sweep claimed.** The notice restricts commercial reuse of data for non-EU/EFTA/candidate countries; the sweep resolved it via a declaring-country analogy and asserted *"I verified every declaring country … is EU27, EFTA, UK or candidate."* **False:** `migr_pop1ctz` declares **AM** (Armenia, 2,991,201) and **MC** (Monaco), and `une_rt_m` declares **US, JP, TR, BA, MK** — and US and JP are the notice's **own named examples** of the exception. Moot for Exodus (*"non-commercial reuse is possible without restriction"*), but **a commercial downstream fork of this AGPL project must drop AM/MC from `migr_pop1ctz` and US/JP from `une_rt_m`.** Record it; do not re-litigate it.

**National / other rejections**
- **ABS Australia** — there is **no bilateral flow dataflow at all**. Every migration dataflow (`NOM_*`, `ABS_NOM_VISA_*`, `NIM_*`, `RIME_*`) lacks a country-of-origin dimension; `OAD_COUNTRY` is tourism. `ERP_COB` is a country-of-**birth stock** (2025, 256 SACC codes of which the `xx99` forms are "not further defined" residuals), **modelled**, and cannot extend a flow matrix.
- **Spain INE** — detailed bilateral table 69690 **stops at 2024** (verified `Anyo ∈ {2022,2023,2024}`). The quarterly ECP 59011 reaches 2026-Q2 but publishes **only the 10 largest origins, rounded to the nearest 100** (10 of 61 series non-null). **Verifier correction:** `Fecha` epoch-ms decodes in **UTC** to 2026-06-30T22:00, i.e. 2026-07-01 **only in Europe/Madrid** — the sweep's instruction to "decode Fecha" without a timezone invites a systematic off-by-one at every period boundary.
- **ONS UK LTIM** — OGL v3.0, YE Dec 2025, but the nationality dimension is **three coarse groups** (British / EU+ / Non-EU+) plus a top-ten table. **Not bilateral.** Also modelled (British estimates rest on a NINo/Migrant Worker Scan rule that *"may differ from legal definitions of nationality"*). `cdn.ons.gov.uk` 404s where `www.ons.gov.uk` 200s; there is no working `/current/` alias.
- **CBS table 03742** — `Frequency: Stopgezet`, period 1995–2022. It is the first result a search surfaces and looks live until you read that field.
- **ACLED** — fails **two** rules: key-gated (rule 3) **and** its terms forbid redistribution of the underlying data (rule 2). **Not viable even as an optional adapter**, unlike UCDP.
- **IOM DTM on HDX** — non-commercial, no redistribution, no derivative works. Carried from the project brief; **not re-probed this session, so treat the specific terms as [UNVERIFIED] though the conclusion is settled.**
- **IIASA Global Annual Migration Data Explorer** — a visualisation front-end over the same Gaskin & Abel estimates, no API, no independent data, no separate licence grant. **Verifier correction:** the sweep reported a Cloudflare 403; it does **not** reproduce — `migration.iiasa.ac.at` has **no DNS record** (HTTP 000, connection failure). Do **not** add it to the known-traps list as a Cloudflare interstitial.
- **nature.com** — 303 redirect to `idp.nature.com/authorize`. A **redirect, not a 403**, so a naive fetcher stores the login page as content. Use the PMC mirror.
- **US (CBP Nationwide Encounters, State Dept NIV/IV issuance, RPC/WRAPS arrivals, DHS OHSS)** — **`cbp.gov`, `travel.state.gov` and `ohss.dhs.gov` all 403 to a browser UA.** But **US federal works are public domain under 17 USC §105 — the cleanest licence in the whole investigation, needing no quote at all.** This is therefore **rejected-with-reopen, not rejected**: see the mirror action in §5's checklist. Do not treat "the US cannot be a currency source" as settled; it is "the US was not reached."
- **Satellite / airline / mobile-phone mobility data** — ruled out explicitly, so nobody re-litigates it: none of it measures migration (a change of usual residence). Airline and roaming data measure *trips*; nighttime-lights and settlement rasters measure *presence*; all commercially licensed sources in this space are key-gated and forbid redistribution of derived datasets, failing rules 2 and 3 together. There is no keyless, redistributable, origin×destination mobility source. **Not probed this session — [UNVERIFIED] as to any specific provider — but the structural objection stands regardless of provider.**

**Two API traps worth more than several dead ends**
1. **Eurostat returns TWO distinct HTTP 413s sharing id 413.** `EXTRACTION_TOO_BIG` is **permanent** ("…estimated 8068608 rows, max authorised is 5000000") and means re-filter; `ASYNCHRONOUS_RESPONSE. Your request will be treated asynchronously. Please try again later.` is **transient** and means retry. Retry-all spins forever on the first; fail-hard aborts spuriously on the second. **Discriminate on the label prefix.**
2. **The size-limit 413 is returned *before* dimension validation** — so an invalid dimension name in an unfiltered query surfaces as 413 rather than 400. **Validate dimension names only against a fully pinned query.**

---

## 5. What the app must change to be honest about time

Today: `state.ts` holds a single `year: number` (default 2019); `App.tsx:280` renders one `<input type="range" min={1990} max={2023} step={1}>`; `App.tsx:260` hard-codes `years 1990–2023`; `App.tsx:202` computes staleness as `2023 - p.stockYear`. One integer axis, and a constant `2023` embedded in arithmetic. Adding monthly asylum, quarterly decisions, annual registers and quinquennial stocks makes that untenable.

**5.1 The data model.** Every layer carries a `Vintage`, and the manifest's existing `latencyClass` field is replaced by it:

```ts
interface Vintage {
  periodEnd: string;                 // ISO date: '2026-06-30' | '2026-07-31' | '2025-12-31'
  periodLabel: string;               // '2026-Q2' | '2026-07' | '2025' — as the producer names it
  cadence: 'monthly'|'quarterly'|'annual'|'quinquennial'|'point';
  coverage: [string, string];        // the layer's full period span
  estimateKind: 'observed'|'reported'|'modelled';
  provisional: boolean;              // Eurostat status 'p'; ISTAT OBS_STATUS 'p'; CBS voorlopig
  breakAt?: string[];                // Eurostat status 'b' — render as a discontinuity, never a trend
  reporters?: { n: number; expected: number };   // for partial-coverage gating
  producer: string; licenceId: string; doi?: string;
}
```

**`latencyDays` is never stored.** Compute `Math.floor((Date.now() - Date.parse(periodEnd)) / 86400e3)` at render. Both the Eurostat and IMF verifiers made this point independently: every stored `latencyDays` in the sweeps was measured to the publisher's `updated` stamp and is wrong by construction the day after it is written.

**5.2 The year control becomes a cursor over a date axis.** Replace `year: number` with `cursor: { date: string; cadence: Cadence }`. The **active surface layer owns the cursor** and sets its cadence — select the monthly TP layer and the control snaps to months; select the spine and it snaps to years. Overlays that cannot resolve the cursor **grey out in the panel and state their own nearest period** ("EU asylum decisions — nearest 2026-Q2"). **Never resample a quarterly series onto an annual cursor, and never carry a value forward.** The codebase already holds the right principle — `NO_DATA_FILL` exists precisely so *"a country with no data must not look like a country with a small value"*, and `computeMetrics` already returns `null` rather than 0 for absent corridors. Extend it from space to time: **absent at this instant ≠ zero at this instant.**

**5.3 What the user must be told, on every layer chip.** `vintage · age · kind`, e.g. `EU asylum decisions · 2026-Q2 · 81 d · reported (ES provisional)`. Plus, in the panel header, one sentence that cannot be dismissed: *"The bilateral flow spine is 2023. Layers shown beside it have their own vintages, printed on each. Nothing here is live; the fastest complete layer is 50 days old."*

**5.4 Concrete tasks, in order.**
1. Split the spine badge — **flows: 2023 / stocks: 2024** — from the snapshot already shipped (T1-0). Remove the hard-coded `2023 -` in `App.tsx:202` and `1990–2023` in `App.tsx:260`.
2. Add `Vintage` to the manifest source records and to each `SurfaceSpec` in `layers.ts` (`SURFACES` is already the UI registry — extend the struct, not a parallel map).
3. Cursor refactor in `state.ts` + `App.tsx`; add cadence-aware snapping and the grey-out rule.
4. Adapter contract: every adapter returns `{rows, vintage}`; the snapshot builder refuses a layer whose `vintage.periodEnd` is absent. Add the three assertions the Eurostat verifier earned: **`min(size) > 0`**; **parse `status` alongside `value`**; **an explicit non-origin denylist on the citizen axis**.
5. **Partial-period gate:** accept the newest period only if `reporters.n` is within tolerance of the trailing median; otherwise fall back and surface "n of m reporting" in the UI. A period that fails the gate must be *visible as incomplete*, not silently dropped — the user should be able to see that 2026-07 exists and why it is not charted.
6. Retire or re-pin `SE.PRM.ENRL.TC.ZS` in the `coverage` denominator; delete the orphan `.cache/refugees.json`.
7. **Country-code crosswalk gets a named owner and one module.** Six incompatible systems are now in play — UN **M49**, **ISO3**, UNHCR's own (Germany = `GFR`, and `coa:"ARE"` was observed paired with `coa_name:"Egypt"`/`coa_iso:"EGY"` **in a single row** — always key on `coo_iso`/`coa_iso`), Eurostat `geo`, CBS `Herkomstland`, ABS 4-digit SACC — plus Frontex free-text English names. `scripts/m49.json` exists; the HuggingFace `Iso_code_lookup.csv` (249 rows) covers M49; Frontex needs a name→ISO3 table with a **failing test on unmatched names**, not a silent drop.
8. **Two standing re-probes** (the cheapest item on this list, and nobody proposed one): **(a) after 2026-10-31**, `GET /population/v1/population/?yearFrom=2026` and `/asylum-applications/?yearFrom=2026` — UNHCR Mid-Year Trends 2026 is the **only** route to a 2026 bilateral row, and today both return HTTP 200 with `maxPages:0, items:[]`, a **silent empty that an adapter will not fail on**; **(b) quarterly**, the UN DESA Population Division releases page — the next stock anchor is the **only** route to a post-2023 flow year.
9. **Mirror-first policy for WAF-blocked hosts.** Five lanes hit WAFs on imf.org, un.org, unhcr.org, oecd.org, cbp.gov, travel.state.gov and ohss.dhs.gov; **exactly one tried a mirror, and that one attempt closed a blocking compliance item a lane had declared unresolvable.** Before any host is written off: try `web.archive.org`, `catalog.data.gov` CKAN, `data.humdata.org` CKAN, `data.overheid.nl` CKAN, `open.canada.ca` CKAN and agency bulk paths. Two Tier-1-B blockers (UNHCR terms, Frontex terms) and the entire US question may fall to this.

---

## 6. Concordance opportunities

The page (`concordance/stats.ts`) classifies a pair on two axes — log-space dispersion (MAD) and Spearman rank — into `same` (≤2%) / `offset` (≤4% with a level shift) / `residual` / `scatter` (>8%) / `divergent` (>50%) / `conflict` (rank ρ < 0.8), with `MIN_N = 8`. It ships five measures: `inflow` (2022), `corridor` (2015), `unemployment` (2023), `gdppc` (2023), `population` (2023).

**Schema change required first:** `Measure.year: number` must become `Measure.period: {a: Vintage, b: Vintage}` — most valuable new pairs compare **different periods or different cadences**, and a single integer cannot express that. The page must print both vintages beside the ratio, or it will manufacture a "disagreement" that is really a 12-month gap.

**New pairs, most valuable first:**

**6.1 — Germany's recorded emigration to Italy vs Italy's recorded immigration from Germany (and the reverse), both 2025.** Destatis `csv-12711-05` `Fortzuege_in_das_Ausland` vs ISTAT `_3` `COUNTRY_PREV_RESID`; ISTAT `_6` `COUNTRY_NEXT_RESID` vs Destatis `Zuzuege_aus_dem_Ausland`. **The only true bilateral cross-validation available anywhere in this investigation, and both sides are at 2025 today.** *Expect `divergent`, asymmetrically:* the destination's inbound count should substantially exceed the origin's outbound count, because **a person leaving is far less likely to deregister than an arrival is to register** — EU emigration is systematically under-recorded. The magnitude of that asymmetry *is the finding*, and it is the single most defensible thing a "migration intelligence platform" can show that no one else shows. Entity: corridor (n = 2, so this is a **figure, not a classified pair** — `MIN_N = 8` correctly refuses it; render it as a dedicated two-sided panel, and extend to n ≥ 8 only if more origin-side registers are added).

**6.2 — UN DESA migrant stock 2024 vs Gaskin & Abel `stocks.nc` 2024, destination margins.** Both verified: DESA **281.96 M over 9,042 observed country-pair corridors**; Gaskin **303.07 M over all 53,361**. *Expect `offset` at country level with `scatter` concentrated on countries where DESA coverage is sparse.* **The ~21 M gap is the model's imputation of unobserved corridors, not new migrants** — and visualising it is more honest than showing either number alone. (Gated on B3's licence question if DESA is redistributed; if that resolves against, compute the comparison at build time from a local-ingest path and ship only the derived ratio, which is what D1 already contemplates.)

**6.3 — Eurostat `migr_resfirst` 2025 (permits) vs `migr_imm1ctz` 2024 (immigration by citizenship), same destination, third-country origins only.** Permits issued vs residence registrations — two instruments measuring adjacent things. *Expect `divergent` or `scatter`:* a permit is an **authorisation**, a registration is a **presence**, and they are separated by non-take-up, by multi-year permits, and (in the opposite direction) by intra-EU free movement producing registrations with no permit. **Restrict to non-EU origins or the free-movement asymmetry will dominate and the classification will be uninterpretable.** This measures the gap between legal admission and actual settlement — the most substantively interesting pair on the list.

**6.4 — Eurostat asylum applications (2025 months summed) vs UNHCR `/asylum-applications/` 2025 `applied`, 32 EU/EFTA destinations.** The critic's suggestion, with the cadence caveat handled by summing. *Expect `same` or `offset` for most countries, with a small number of `conflict` rows:* UNHCR sources EU figures from Eurostat but applies its own filters, and **the sweep's dimension enumeration was incomplete — the verifier found `app_type` has six values (N 3,674 / A 1,320 / R 710 / NR 189 / RA 109 / J 7), `dec_level` nine, `procedure_type` three. Filtering to the documented members silently drops 2,335 of 6,009 rows, 39% of the year.** The remaining divergence should be Eurostat's `applicant=TOTAL` (first + subsequent) against UNHCR's new-applications scope — a definitional gap, exactly what the `offset` class exists to name. **Gated on B1.**

**6.5 — UNHCR `/population/` 2025 refugees by country of asylum vs WDI `SM.POP.RHCR.EA` 2025.** *Expect `same`, ratio ≈ 1.00 — and that is the point.* The World Bank sources this directly from UNHCR (`sourceOrganization` confirms it), so this is a **known-identity control pair**: if it is not `same`, the join or the code crosswalk is broken. The page already has one such pair by accident (`estat` vs `imf` unemployment, medianRatio 1.000, `same`); make the role explicit and badge it as a self-test. **Gated on B1 for the UNHCR side — but note WDI alone is unblocked, so a second control can be built from `SM.POP.ASYS.EA` vs `SM.POP.FDIP` minus `SM.POP.RHCR.EA` (should be near-identity by construction).**

**6.6 — UNHCR `/nowcasting/` July 2026 vs `/population/` end-2025, refugees by country of asylum.** Same producer, seven months apart, one modelled/operational and one reported. *Expect `offset` (growth) with `scatter` on the countries whose `source` string says "UNHCR operational data" rather than "Government" or "UNHCR official statistics".* **This is the only pair in the investigation where the disagreement can be coloured by per-row provenance** — the 170-row `source` distribution (operational 83 / official 36 / Government 17 / six combinations) makes it possible. Also the only way to put a 2026 reference period on the concordance page. **Gated on B1.**

**6.7 — IMF BOP `D752_S1W` credit, annual 2025 vs WDI `BX.TRF.PWKR.CD.DT` 2024.** Personal transfers received, two producers, and the World Bank compiles substantially from IMF BOP. *Expect `same`/`offset` on the reporting countries, with `conflict` on the subset where the Bank substitutes its own estimate for non-reporters.* **The one-year gap must be printed** — and this pair is the concrete argument for the §6 schema change. Coverage: IMF 126 countries at 2025, WDI 160 at 2024.

**6.8 — Upgrade the existing `unemployment` measure from 2023 to 2025 and make it four-way.** WDI `SL.UEM.TOTL.ZS` 2025 (182, **modelled ILO**) vs IMF DataMapper `LUR` 2025 (109, **staff estimate**) vs Eurostat `une_rt_a` 2025 vs Eurostat `une_rt_m` 2026-07 annualised (34, **modelled SA over an LFS sample**). *Expect the shipped pattern to hold* (`wb`↔`estat` `same` at 0.994; `wb`↔`imf` `residual` at 0.988; `estat`↔`imf` `same` at 1.000) — the value is a free two-year upgrade plus the first monthly series on the page. **Pin `s_adj`, `unit`, `age` and `sex` on `une_rt_m` or you will average `PC_ACT` percentages against `THS_PER` thousands** (see §4).

**6.9 — Also free: refresh the existing `inflow` measure from 2022 to 2024.** `migr_imm1ctz` has moved 2022 → **2024** (34 reporters) on the same adapter shape, with `migr_emi1ctz` at 2024 (33) and `migr_pop1ctz` at **2025** stocks (39 geo entries, the widest in the lane). **`agedef` trap confirmed on imm/emi** (codes `REACH`/`COMPLET`; not pinning doubles cells and shifts every index — pin `REACH`), and **`migr_pop1ctz` has no `agedef` dimension at all** — appending it returns HTTP 400. A shared adapter must special-case it. Honest caveat the verifier insisted on: **2024 still does not meet the brief's definition of "current"** — this is a two-year improvement, not a solution.

**6.10 — One pair to deliberately NOT ship.** Monthly applications (summed to quarter) vs quarterly first-instance decisions `migr_asydcfstq`, same producer, same period. The classifier would return `divergent` — and it would be a **false positive**: decisions lag applications by the processing time, so the two measure different points in one pipeline, not two estimates of one quantity. **The page's contract is "the same quantity from different producers"; this violates it.** Ship it instead as a **queue/backlog indicator** on the protection layer (applications − decisions, with `migr_asypenctzm` pending stock as the third term), and record here why it is not a concordance pair — otherwise someone will add it.

---

## Appendix — the one thing that must not slip: a single licence owner

Five lanes each cleared their own licence and nobody summed them. The aggregate surface contains a live contradiction and at least two unmet obligations. **This needs one owner, one audit, and one decision record before any of Tier 1 ships:**

1. **Eurostat** — two obligations Exodus is probably not honouring today, both quoted verbatim by the verifier: *"When reuse involves translations of publications or modifications to the data or text, this must be stated clearly to the end user of the information. A disclaimer regarding the non-responsibility of Eurostat shall be included."* Exodus **modifies** (aggregates, filters, derives) every Eurostat series it touches.
2. **IMF** — the Data clause permits derivatives and distribution, **but** *"For any potential commercial reuse of IMF Data, please email copyright@imf.org to request permission,"* which sits in tension with AGPL-3.0's permission of commercial downstream use. IMF BOP is the **only genuine 2026 reference period** in the macro stack, so this caveat sits on the lane's headline finding.
3. **UNHCR** — unresolved, and possibly **CC BY-IGO** rather than CC BY 4.0. `redistributable: false-pending` until a human reads the terms page.
4. **UN DESA** — an embedded CC BY 3.0 IGO grant against un.org's blanket no-derivatives terms, where one lane's green light **reverses a recorded project decision (D1) on one-sided evidence**.
5. **Destatis** — "Data Licence Germany 2.0" confirmed, **BY-vs-Zero variant unconfirmed**.
6. **Frontex** — unread; `frontex.europa.eu/legal/` is 404 and agency ≠ Commission.
7. **Eurostat commercial exception** — non-binding for Exodus, but a commercial fork must drop AM/MC from `migr_pop1ctz` and US/JP from `une_rt_m`.

**A platform that reaches 2026 while violating four licences is worse than one honestly stuck at 2023.**

---

## Do this week, in order

1. **T1-0** — split flows:2023 / stocks:2024 from the shipped snapshot; strip the hard-coded `2023` from `App.tsx`. *(No network. Half a day.)*
2. **T1-1** — WDI refresh + displacement family; fix the `SM.POP.REFG` latent break; retire `SE.PRM.ENRL.TC.ZS` from the coverage denominator. *(One existing script.)*
3. **T1-2** — `migr_resfirst` 2025 as the EU layer. **It is better than everything the five lanes proposed, and none of them opened it.**
4. In parallel, and not on the engineer's critical path: send one human to read the **UNHCR** and **Frontex** terms pages from an unblocked browser, and to retry every WAF-blocked host through archive.org and the CKAN mirrors. One such retry has already closed a blocking compliance item; two more are waiting.