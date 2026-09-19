# M0 verification ledger

Every figure the critics flagged as unverified, probed against its primary source, then
**independently re-checked by a second agent wherever the first pass was not a clean
confirmation**. That second pass mattered: it overturned three first-pass verdicts,
including one that would have replaced a true figure with a weaker one.

**Two claims were refuted. Five were materially wrong in their specifics. One first-pass
"unreachable" turned out to be confirmable.** Anything not `CONFIRMED` must be corrected in
`docs/prompt/BUILD_PROMPT.md` before it reaches a screen.

| Status | Meaning |
|---|---|
| `REFUTED` | The claim is false as stated. Do not ship it. |
| `CORRECTED` | The substance survives but the specifics were wrong. Ship the corrected value. |
| `UNREACHABLE` | Superseded by a later adjudication — see the confirmed entry for the same claim. |
| `CONFIRMED` | Correct. Ship it. |

Where two entries share a subject, **the later adjudication wins**; both are kept so the
reasoning is auditable.


## REFUTED — `un_desa_ims2024_intraregional_migration_share`

**Verdict.** The claim is false as stated — UN DESA's International Migrant Stock 2024 publishes 45 per cent (not 53), with an intra-regional breakdown of 74% Europe / 73% Oceania / 64% sub-Saharan Africa (not 83/73/63) — but the first verifier was materially wrong on one point: 53% is NOT a fabrication, it reproduces exactly (52.97%) from the official UN DESA workbook under the continental M49 grouping and is published by IOM's Migration Data Portal citing "UN DESA, 2025"; the 83/73/63 breakdown, by contrast, matches no grouping at all.

**Corrected value.** 45 per cent of international migrants were living in their region of origin in 2024; Europe 74%, Oceania 73%, sub-Saharan Africa 64% (UN DESA IMS 2024 Key facts and figures, SDG regional groupings). If the continental (M49) grouping is wanted instead, the correct paired figures are 53% globally with a by-destination breakdown of Africa 86%, Asia 81%, Latin America and the Caribbean 80%, Europe 48% — and that framing must be cited to IOM's Migration Data Portal, not to the UN DESA release.

**What the build must do.** Do not ship "53% ... 83/73/63" as a UN DESA IMS 2024 statistic — the breakdown is wrong under every grouping and the attribution is wrong. Ship the corrected UN DESA figure instead: "45% of international migrants were living in their region of origin in 2024 (Europe 74%, Oceania 73%, sub-Saharan Africa 64%)", cited to UN DESA, International Migrant Stock 2024: Key facts and figures (UN DESA/POP/2024/DC/NO. 13), and use "were living in" rather than "moved". If the product specifically wants the continental framing, 53% is shippable but ONLY as "53% of international migrants live in their region of origin (continental grouping)" cited to IOM Migration Data Portal drawing on UN DESA 2025, paired with its own correct breakdown (Africa 86%, Asia 81%, LAC 80%, Europe 48%, all by region of destination) — never paired with 83/73/63. Do not render an em-dash refusal; a verified value exists for both framings.

<details><summary>Evidence</summary>

PRIMARY SOURCE, FETCHED INDEPENDENTLY: curl (browser UA) -> https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/undesa_pd_2025_intlmigstock_2024_key_facts_and_figures_advance-unedited.pdf — HTTP 200, 1,844,233 bytes, application/pdf, PDF v1.6, 24 pages, MD5 27b045d19d48281d31ea93b9982eeed6 (matches first verifier's hash; same artifact). Text extracted myself with pypdf 6.19.0 -> 49,605 chars at /tmp/claude-0/-home-user-exodus/655ddf7b-3dfa-5a65-869f-2a751253cc07/scratchpad/indep/kf.txt.

VERBATIM, para. 6 (lines 227-236 of my extraction): "In 2024, nearly half (45 per cent) of all international migrants worldwide were living in their region of origin (using regional groupings as shown in figures 2 and 3). Europe had the largest share of intra-regional migration, with 74 per cent of all migrants born in Europe residing in another European country or area (figure 5). Similarly, 73 per cent of international migrants from Oceania resided within the region, and 64 per cent of all migrants born in sub-Saharan Africa lived in another country or area in the region in 2024. By contrast, Central and Southern Asia had the largest share (75 per cent) of its diaspora residing outside the region."

NEGATIVE CHECK (mine): grep for "53 per cent", "83 per cent", "63 per cent", "86 per cent", "80 per cent" -> 0 matches each. Complete inventory of "N per cent" in the document: 2.3, 3.7, 3.8, 13, 16, 21, 45, 48, 64, 71, 73, 74, 75, 76, 87. Zero "N%" sign-forms. I also checked the workbook's "Migrant notes" and "Table of contents" sheets (12,221 and 58,099 chars): no "53", "83", "63", no "per cent", no "%". And WebFetch of the IMS landing page https://www.un.org/development/desa/pd/content/international-migrant-stock: contains no percentages at all. So 53% is absent from the UN DESA release, its workbook notes and its landing page — the claim's stated WHERE.

INDEPENDENT RECOMPUTATION (my own download and arithmetic): https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/undesa_pd_2024_ims_stock_by_sex_destination_and_origin.xlsx — HTTP 200, 6,005,287 bytes, MD5 edf2157cf0b0bf3baee88a3c117bfcaa. Table 2 (POP/DB/MIG/Stock/Rev.2024), world total 304,021,813.
- SDG grouping used by Key facts (Europe and Northern America separate, Oceania combined): diagonal 135,633,116 / 304,021,813 = 44.61% -> 45%. Europe 45,201,439/60,981,166 = 74.1%; Oceania 1,161,812/1,602,503 = 72.5%; sub-Saharan Africa 19,564,204/30,661,610 = 63.8%. Also reproduces Central and Southern Asia 24.5% in-region (75% outside), LAC 29.1% (71% outside), Northern America 26.6% (73% outside). Every published digit reproduces.

WHERE I DIVERGE FROM THE FIRST VERIFIER: they asserted "No grouping tested yields 53%." That is wrong — they did not test the continental M49 grouping. Using AFRICA(903)/ASIA(935)/EUROPE(908)/LAC(904)/NORTHERN AMERICA(905)/OCEANIA(909), the diagonal is 161,051,609 / 304,021,813 = 52.97% -> 53%. Under that same grouping, by destination: Africa 85.85% -> 86%, Asia 80.71% -> 81%, LAC 80.14% -> 80%, Europe 48.06% -> 48%; Northern America's migrants born in LAC 44.75% -> 45%; Oceania's born in Asia 50.00% -> 50%. All six match IOM's Migration Data Portal verbatim (WebFetch of https://www.migrationdataportal.org/themes/international-migrant-stocks-overview: "more than half of all international migrants (53%) migrated within their same region of origin", "86 per cent of all international migrants in Africa originated from the same region", "81 per cent ... in Asia", "nearly half (48%) ... in Europe", "approximately 80 per cent ... Latin America and the Caribbean", attributed to "UN DESA, 2025"). So the 53%/86% pair is a legitimate derivation of UN DESA IMS 2024 microdata under a different regional grouping and a by-destination framing — not, as the first verifier concluded, an unreliable fabrication.

THE 83/73/63 BREAKDOWN IS STILL INDEFENSIBLE. I swept every region in Table 2, by origin and by destination, for any value within 1.0pp of 83, 73 or 63. The only hits: Europe and Northern America COMBINED by origin 82.58%; Oceania by origin 72.50%; sub-Saharan Africa by origin 63.81% (which rounds to 64, not 63); plus unrelated South America by destination 82.47% and Southern Asia by destination 73.12%. The claimed triple is stitched from three mutually incompatible groupings and one truncation error, and it does not pair with 53% under any grouping — the combined-Europe+N.America grouping that yields 83 gives a global diagonal of 47.01%, not 53%.

FRAMING ERROR: the source measures migrant STOCK ("were living in" / "resided within"), not flow. The claim's verb "moved" is wrong on the substance, though note the Migration Data Portal itself uses the same loose wording ("migrated within their same region of origin"), so this error is inherited from the secondary source rather than introduced by the claim.

</details>


---

## REFUTED — `undesa-ims-2024-intraregional-share`

**Verdict.** UN DESA International Migrant Stock 2024 states that 45 per cent — not 53 per cent — of international migrants were living in their region of origin in 2024, and the regional breakdown is 74% Europe / 73% Oceania / 64% sub-Saharan Africa, not 83/73/63; three of the four claimed digits are wrong.

**Corrected value.** 45% of international migrants were living in their region of origin at mid-2024. Regional breakdown: Europe 74%, Oceania 73%, sub-Saharan Africa 64%. (Source: UN DESA, International Migrant Stock 2024: Key facts and figures, UN DESA/POP/2024/DC/NO. 13, January 2025, advance unedited version, p. 4, para. 6.)

**What the build must do.** Ship this corrected value: "45% of international migrants were living in their region of origin in 2024 — Europe 74%, Oceania 73%, sub-Saharan Africa 64%." Also change the verb from "moved within" to "were living in"/"resided within", since IMS 2024 is a stock measure, not a flow. Cite it as: UN DESA, International Migrant Stock 2024: Key facts and figures (UN DESA/POP/2024/DC/NO. 13, January 2025, advance unedited version), para. 6. If the tooltip needs the three regions named, name them explicitly (Europe / Oceania / sub-Saharan Africa) rather than shipping a bare "74/73/64" triple, because the numbers are grouping-dependent — merging Europe with Northern America changes them to 83% and 47%.

<details><summary>Evidence</summary>

PRIMARY SOURCE FETCHED: https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/undesa_pd_2025_intlmigstock_2024_key_facts_and_figures_advance-unedited.pdf — retrieved via WebFetch, application/pdf, 1,844,233 bytes, MD5 27b045d19d48281d31ea93b9982eeed6, PDF v1.6, 24 pages. (Note: curl with the default user-agent returns HTTP 403, 919 bytes of text/html — un.org blocks non-browser UAs; a browser UA returns HTTP 200. The 403 is a UA block, not a missing document.) Text extracted locally with pypdf 6.19.0 to /tmp/claude-0/-home-user-exodus/655ddf7b-3dfa-5a65-869f-2a751253cc07/scratchpad/ims.txt (49,681 chars).

VERBATIM QUOTE, p.4 para. 6: "In 2024, nearly half (45 per cent) of all international migrants worldwide were living in their region of origin (using regional groupings as shown in figures 2 and 3). Europe had the largest share of intra-regional migration, with 74 per cent of all migrants born in Europe residing in another European country or area (figure 5). Similarly, 73 per cent of international migrants from Oceania resided within the region, and 64 per cent of all migrants born in sub-Saharan Africa lived in another country or area in the region in 2024. By contrast, Central and Southern Asia had the largest share (75 per cent) of its diaspora residing outside the region. Other regions with large shares of their transnational populations residing outside their region of origin included Latin America and the Caribbean (71 per cent) and Northern America (73 per cent)."

NEGATIVE CHECK: grep over the full extracted text for "53 per cent", "83 per cent", "63 per cent", "86 per cent" returns zero matches. The complete set of "N per cent" values in the document is: 3, 7, 8, 13, 16, 21, 45, 48, 64, 71, 73, 74, 75, 76, 87. Neither 53, 83 nor 63 occurs.

INDEPENDENT RECOMPUTATION FROM THE OFFICIAL WORKBOOK: downloaded https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/undesa_pd_2024_ims_stock_by_sex_destination_and_origin.xlsx — HTTP 200, 6,005,287 bytes, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (POP/DB/MIG/Stock/Rev.2024). Table 2 (region of destination x region of origin, 2024), world total 304,021,813. Summing the same-region diagonal under the grouping the Key facts uses (Europe and Northern America separate, Oceania combined) gives 135,633,116 / 304,021,813 = 44.6% -> 45%. Per-origin shares: Europe 45,201,439/60,981,166 = 74.1% -> 74%; Oceania 1,161,812/1,602,503 = 72.5% -> 73%; sub-Saharan Africa 19,564,204/30,661,610 = 63.8% -> 64%. Also reproduces the paragraph's other figures: Central and Southern Asia 24.5% in-region (75% outside), Latin America and the Caribbean 29.1% (71% outside), Northern America 26.6% (73% outside). Every published digit reproduces exactly from the microdata.

WHERE THE BAD DIGITS LIKELY CAME FROM: treating "Europe and Northern America" as ONE region gives 54,120,744/65,535,293 = 82.6% -> 83, which is probably the claim's "83"; and 63.8 truncated rather than rounded gives the claim's "63". Under that combined-region grouping the global diagonal is 47.0%, still not 53%. No grouping tested yields 53%. Note also a framing error: the source measures migrant STOCK ("were living in"/"resided within"), not flow, so the claim's verb "moved" is wrong even apart from the digits.

SECONDARY-SOURCE WARNING: a web-search result summary asserted "53%" and "86 per cent ... in Africa". Neither figure exists in the primary document; that summary is unreliable and appears to be the contamination path for this claim.

</details>


---

## REFUTED — `unhcr_asterisk_convention`

**Verdict.** The claim is wrong on both halves: UNHCR statistical products DO have an asterisk convention — the Global Trends annex Table 4 puts a bare "*" inside 84 cells of columns an ingester reads as integers — but the asterisk does not mean "a value between 1 and 4"; it means UNHCR has information about stateless persons in that country but no reliable data. Values 1-4 do not exist anywhere in UNHCR's output because 0-5 is rounded to multiples of five, and "-" marks zero/not available/not applicable. Whether asterisk parsing is needed depends entirely on the ingest path: required for the annex workbooks, dead code for the API/CSV.

**Corrected value.** UNHCR does use a bare asterisk "*" as a data-cell value, in Global Trends annex Table 4 (persons under UNHCR's statelessness mandate): 84 such cells in the 2023 workbook, in integer columns. It means "UNHCR has information about stateless persons in this country but no reliable data" — NOT "a value between 1 and 4". Values 1-4 never occur in UNHCR output at all, because small values between zero and five are rounded to multiples of five. A dash "-" means zero, not available, or not applicable. The Refugee Data Finder API and CSV export contain no asterisks; they render the asterisk countries as 0 or omit them entirely.

**What the build must do.** Do not ship the claim as written — it is wrong in a way that will corrupt data. Make the behavior conditional on ingest path. (1) If ingesting Global Trends annex workbooks: asterisk parsing IS required. A naive int()/parseInt on Table 4 columns B,C,E,F will throw or coerce to NaN on 84 cells in the 2023 file alone. Parse "*" to a distinct non-numeric sentinel meaning "known present, no reliable data" and "-" to a separate sentinel meaning "zero / unavailable / N/A"; never coerce either to 0, and never sum them into totals. Render the asterisk as an em-dash or footnote marker in UI, not as a number. (2) If ingesting only the Refugee Data Finder API or CSV: asterisk parsing is genuinely unnecessary — no asterisk ever appears — but handle "-" as a sentinel, and document that API zeros for statelessness are ambiguous (true zero vs. suppressed unreliable data), since AFG/BTN/ZWE come back 0-or-absent where the annex says "*". (3) Do not build any logic that treats "*" as a number in 1-4, and do not build 1-4 range handling at all: that band is empty by construction because 0-5 is rounded to multiples of five.

<details><summary>Evidence</summary>

INDEPENDENT METHOD — I did not use openpyxl; I unzipped the OOXML and parsed xl/worksheets/*.xml with ElementTree, resolving shared strings myself, so a library-level artifact cannot explain the agreement.

PRIMARY 1 — UNHCR Global Trends 2023 annex workbook, https://unhcr-web.github.io/refugee-statistics/data/Annexes_GT_2023.xlsx (curl status=200, bytes=521452, content-type application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, file(1) "Microsoft Excel 2007+", sha256 6cd643307a8b51c4c8752c4ac144ae243e980624c8733678a63d00743327dc4c). Provenance is UNHCR-internal: workbook.xml carries x15ac:absPath url="https://unhcr365.sharepoint.com/teams/eo-gdssds-013-PopulationStatistics/Shared Documents/013 - Population Statistics/GT_2023/Annexes/". 16 sheets (Index, T1-T15). Full scan of every cell in every sheet: exactly 84 cells whose entire value is "*", ALL in sheet T4, first eight B10,C10,E10,F10,B20,C20,E20,F20 — reproducing the first verifier's count and cell refs exactly.

Verbatim T4 text: A1 "Table 4 | Persons under UNHCR's statelessness mandate | 2023"; A4 "Data is not complete and includes estimates. Countries for which UNHCR has information about stateless persons but no reliable data have been included in the table and marked with an asterisk (*)."; A6 "Small values between zero and five have been rounded to multiples of five. A dash (\"-\") indicates that the value is zero, not available or not applicable." Rows: row10 ['Afghanistan','*','*','0','*','*','0','AFG']; row20 ['Bhutan','*','*','0','*','*','0','BTN']; row124 ['Zimbabwe','*','*','0','*','*','0','ZWE']; contrast row11 ['Albania¹','1950','1950','350','2018','2018','297','ALB']. The asterisk sits in B/C/E/F — integer columns.

NEW EVIDENCE 1 (disproves the "1-4" rationale numerically) — frequency of each value in the T4 data region (rows 10-124, cols B-G, 606 numeric cells + the 84 asterisks, which are the ONLY non-numeric values): 0 appears 201 times, 1/2/3/4 appear ZERO times each, 5 appears 15 times, 6 appears 4 times, 9 once. Distinct non-zero values under 20: 5,6,9,10,11,12,13,14,15,17,18. The 1-4 band is empty because 0-5 is rounded to multiples of five — not because an asterisk hides it. Same gap in the API: across refugees/asylum_seekers/returned_refugees/idps/returned_idps/stateless/ooc/oip/hst, value 0 appears 6382 times, 1-4 zero times, 5 appears 304, 6 appears 47, 7 appears 46, 8 appears 41.

PRIMARY 2 — Refugee Data Finder API, https://api.unhcr.org/population/v1/population/?limit=1000&yearFrom=2023&yearTo=2023&coo_all=true&coa_all=true (status=200, 277601 bytes, 1000 items). Raw payload contains zero "*" characters of any kind. Only non-numeric sentinel is "-" (field oip, 1000 occurrences).

NEW EVIDENCE 2 (the builder-relevant failure mode, not tested by the first verifier) — I queried the API for the exact countries whose Excel cell is "*": coa=AFG 2023 returns 5 rows with stateless="0" (summed 0); coa=BTN returns 0 rows; coa=ZWE returns 0 rows; zero asterisks in any payload. So the API silently converts "we know there are stateless people here but have no reliable data" into a hard zero or an absent row. An API-fed and an annex-fed pipeline therefore disagree on the same fact, and the API is the lossy one.

THIRD-PARTY CORROBORATION (independent of UNHCR hosting, which the first verifier lacked) — Institute on Statelessness and Inclusion, https://www.statelesshub.org/theme/data-and-statistics: "An asterisk (*) is used to identify countries where UNHCR has information about a stateless population, but no reliable data - a total of 17 countries as of end-2025." and "A dash (-) is used to denote countries where there is no data or the value is zero." It further notes the markers exist only in Table 4 and that "the significance of what they represent is lost through the presentation of the statelessness statistics in the collated population data" — matching my AFG/BTN/ZWE API result exactly.

ALSO CONFIRMED — sheets T6 and T7 carry a different, footnote-marker asterisk: A4 "* Indicates the proportion of the population type in the country for which the demographic data are available..." bound to header cell U8 "Coverage*". That is a header glyph, not a data value; my scan found no bare "*" data cells in T6/T7.

NOT REACHED (independently re-tested, verdict does not rest on these) — www.unhcr.org/refugee-statistics/methodology/data-content/ returns HTTP 403 both via curl with a browser User-Agent (182858-byte HTML block page) and via WebFetch. The unrefugees.org.uk mirror of the Global Trends 2024 PDF also 403s (returns 5601 bytes of HTML, not PDF). Annex workbooks for 2021/2022/2024 are not at the unhcr-web.github.io path (HTTP 404, 9379-byte HTML), so only the 2023 workbook could be examined directly; the Stateless Hub citation covers end-2025 and shows the convention is current, not a 2023 one-off.

</details>


---

## CORRECTED — `ghs_pop_r2023a_archive_bytes`

**Verdict.** 323,340,844 bytes is a genuine, exactly-matching content-length on the live JRC GHSL endpoint, but it belongs specifically to GHS_POP_E2025_GLOBE_R2023A_54009_1000 (epoch 2025, Mollweide, 1 km) — not to "the GHS-POP R2023A global archive" as a whole; the V1-0/V1_0 URL grammar is intact and returns HTTP 200.

**Corrected value.** 323340844 bytes, valid ONLY for https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/GHS_POP_GLOBE_R2023A/GHS_POP_E2025_GLOBE_R2023A_54009_1000/V1-0/GHS_POP_E2025_GLOBE_R2023A_54009_1000_V1_0.zip (GHS-POP R2023A, epoch 2025, Mollweide ESRI:54009, 1 km)

**What the build must do.** Ship this corrected value: 323,340,844 bytes, but only with the product fully pinned in the copy — "GHS-POP R2023A, epoch 2025, Mollweide 1 km" — never as "the GHS-POP R2023A global archive", which is ambiguous across at least six differently-sized files (322 MB to 12.5 GB). Two build changes follow: (1) pin the verification URL to the exact E2025_54009_1000 path above rather than deriving it, since the V1-0/V1_0 grammar is confirmed live and needs no fallback; (2) replace the 5% tolerance with an exact byte-equality check, or compare the etag "1345ca2c-62cb2d3ee0e38" — 5% is wide enough to silently accept the E2020 and E2030 archives and would let an epoch error ship as a pass.

<details><summary>Evidence</summary>

All checks are live HEAD requests via curl on 2026-09-19, base https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/GHS_POP_GLOBE_R2023A/

EXACT MATCH — GHS_POP_E2025_GLOBE_R2023A_54009_1000/V1-0/GHS_POP_E2025_GLOBE_R2023A_54009_1000_V1_0.zip
Verbatim response headers:
  HTTP/2 200
  date: Sat, 19 Sep 2026 15:40:37 GMT
  last-modified: Mon, 27 Jan 2025 16:47:11 GMT
  etag: "1345ca2c-62cb2d3ee0e38"
  accept-ranges: bytes
  content-length: 323340844
  content-type: application/zip
  via: 2.0 cidportal.jrc.ec.europa.eu
  server: Apache
Repeated HEAD returned identical etag and content-length (stable, not a transient/chunked artifact). 323340844 == the claimed digits exactly, byte for byte.

Other GHS-POP R2023A global variants probed, all HTTP 200, content-length as returned:
  GHS_POP_E2020_GLOBE_R2023A_4326_30ss  -> 482351880  (etag "1cc01b08-62cb2c15a616c", last-modified Mon, 27 Jan 2025 16:41:59 GMT)
  GHS_POP_E2020_GLOBE_R2023A_54009_100  -> 5097074334
  GHS_POP_E2020_GLOBE_R2023A_54009_1000 -> 322293568
  GHS_POP_E2020_GLOBE_R2023A_4326_3ss   -> 12554406149
  GHS_POP_E2025_GLOBE_R2023A_4326_30ss  -> 483694490
  GHS_POP_E2030_GLOBE_R2023A_54009_1000 -> 324363154

CRITICAL SECONDARY FINDING on the 5% tolerance named in the task: the 1 km Mollweide products across epochs sit far inside 5% of each other. E2020 is 322,293,568 (0.324% below the claimed value) and E2030 is 324,363,154 (0.316% above it). A "within 5%" assertion therefore passes against at least three different files and cannot detect an epoch mix-up — it is not a meaningful guard for this value.

No blog, mirror, dataset summary or recollection was used; every number above is a content-length header read off jeodpp.jrc.ec.europa.eu directly.

</details>


---

## CORRECTED — `ghs_pop_r2023a_global_archive_bytes`

**Verdict.** 323,340,844 bytes is a real, exactly-matching content-length on the live JRC GHSL endpoint, but it identifies exactly one file — GHS_POP_E2025_GLOBE_R2023A_54009_1000 (epoch 2025, Mollweide, 1 km) — not "the GHS-POP R2023A global archive," which is not a single file; the V1-0/V1_0 path grammar is correct and returns HTTP 200.

**Corrected value.** 323,340,844 bytes = GHS_POP_E2025_GLOBE_R2023A_54009_1000_V1_0.zip (GHS-POP R2023A, epoch 2025, Mollweide ESRI:54009, 1000 m), at https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/GHS_POP_GLOBE_R2023A/GHS_POP_E2025_GLOBE_R2023A_54009_1000/V1-0/GHS_POP_E2025_GLOBE_R2023A_54009_1000_V1_0.zip

**What the build must do.** Ship the byte count only with the full product identifier attached — never as "the GHS-POP R2023A global archive," which is ambiguous across ~dozens of epoch x CRS x resolution files. Render it as: GHS_POP_E2025_GLOBE_R2023A_54009_1000 (2025, Mollweide, 1 km) — 323,340,844 bytes. Replace any "within 5%" size assertion: it passes against at least five different R2023A 1 km Mollweide files (E2010 through E2030) and would silently accept the wrong epoch. Assert exact equality against 323340844, or validate the etag "1345ca2c-62cb2d3ee0e38", or read Content-Range from a tail byte-range request. If the size is ever fetched at runtime and cannot be resolved, render an em-dash and refuse rather than falling back to a nearby epoch's value.

<details><summary>Evidence</summary>

All checks are my own live requests via curl on 2026-09-19, base https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/GHS_POP_GLOBE_R2023A/ — no blog, mirror, dataset page or recollection used.

EXACT MATCH. HEAD .../GHS_POP_E2025_GLOBE_R2023A_54009_1000/V1-0/GHS_POP_E2025_GLOBE_R2023A_54009_1000_V1_0.zip
  HTTP/2 200
  date: Sat, 19 Sep 2026 15:58:33 GMT
  last-modified: Mon, 27 Jan 2025 16:47:11 GMT
  etag: "1345ca2c-62cb2d3ee0e38"
  accept-ranges: bytes
  content-length: 323340844
  content-type: application/zip
  via: 2.0 cidportal.jrc.ec.europa.eu
  server: Apache
Repeat HEAD returned identical etag and content-length.

THREE INDEPENDENT CORROBORATIONS OF THE SIZE (beyond the header the first verifier read):
1. Range GET bytes=323340840-323340843 -> HTTP/2 206, content-range: bytes 323340840-323340843/323340844, 4 bytes delivered. The origin itself states total length 323340844 in a second, separate header field.
2. Range GET bytes=323340844-323340900 -> HTTP 416 Range Not Satisfiable. Byte 323,340,844 does not exist, so the file ends exactly at offset 323,340,843 — i.e. exactly 323,340,844 bytes. This is a true EOF probe, not a header assertion.
3. Apache's etag encodes the size in hex: 0x1345CA2C = 323,340,844 decimal — internally consistent with content-length.

SIBLING PRODUCTS I PROBED MYSELF (all HTTP 200, V1-0/V1_0 grammar):
  E2030_GLOBE_R2023A_54009_1000 -> 324363154
  E2025_GLOBE_R2023A_4326_30ss  -> 483694490
  E2020_GLOBE_R2023A_4326_30ss  -> 482351880
  E2020_GLOBE_R2023A_54009_1000 -> 322293568
  E2020_GLOBE_R2023A_54009_100  -> 5097074334
  E2015_GLOBE_R2023A_54009_1000 -> 320436226   (first verifier did not check this)
  E2010_GLOBE_R2023A_54009_1000 -> 317876163   (first verifier did not check this)

TOLERANCE FINDING — STRONGER THAN THE FIRST VERIFIER REPORTED. Deviation from 323,340,844 for the 1 km Mollweide series: E2030 +0.316%, E2020 -0.324%, E2015 -0.898%, E2010 -1.690%. That is at least FIVE distinct files inside a 5% band, not three. A "within 5%" check cannot distinguish epochs at all here and is worthless as a guard for this value; only an exact-match or etag/Content-Range check pins the file.

</details>


---

## CORRECTED — `jrc_atlas_migration_2025_country_count`

**Verdict.** The number 198 is arithmetically correct (27 EU Member States + 171 non-EU entries = 198 profiles), but the JRC never calls them "198 countries" — its own wording throughout is "countries and territories," and the set includes entities the EU explicitly does not treat as countries (Kosovo, Taiwan, Palestine, Vatican City, Cook Island), each carrying a status disclaimer footnote in the Atlas.

**Corrected value.** 198 countries and territories (27 EU Member States plus 171 non-EU countries and territories)

**What the build must do.** Ship this corrected value: "198 countries and territories" — do not ship "198 countries". The digits 198 are confirmed and safe to keep, but change the noun. Recommended copy: "the JRC Atlas of Migration 2025 covers 198 countries and territories (27 EU Member States plus 171 non-EU countries and territories)". If the positioning section needs a single short phrase, use "198 country and territory profiles". Shipping the bare word "countries" would assert statehood for Kosovo, Taiwan, Palestine and Vatican City, which the source explicitly disclaims — a reader auditing the claim against the Atlas would find the mismatch.

<details><summary>Evidence</summary>

PRIMARY SOURCE — the publication itself. Downloaded the full Atlas PDF from the JRC Publications Repository: curl https://publications.jrc.ec.europa.eu/repository/bitstream/JRC144743/JRC144743_01.pdf -> HTTP 200, content-type application/pdf, 91,226,819 bytes, PDF v1.6, 552 pages. Extracted text with pypdf.

Verbatim, PDF page 6 (Preface): "The Atlas of Migration 2025 guides policymakers by offering a comprehensive, data-driven analysis of migratory movements across the 27 EU Member States and 171 countries and territories worldwide. This year's edition deepens its exploration of the intricate linkages between conflicts and displacement..."

Verbatim, PDF page 5 (Contents footnote): "The grouping of non-EU countries and territories by continent is based on geographical criteria only and does not have any political implications. For this exercise, we have followed the ESTAT GEO (Geopolitical entities reporting) code list..."

Verbatim, PDF page 7 (Introduction): "The first two sections of the Atlas provide a collection of two-page country profiles for the EU Member States and the non-EU countries and territories respectively."

Section header, PDF page 4 Contents: "MIGRATION IN NON EU COUNTRIES/TERRITORIES 71".

INDEPENDENT RECOUNT from the table of contents (PDF pages 4-5), counting individual profiles only and excluding continent/sub-region aggregate pages (Africa, Central Africa, Caribbean, etc.):
- EU Member States: Austria...Sweden = 27 (the "European Union 10" entry is an aggregate, not counted)
- Non-EU Europe = 20; Africa = 54 (Central 9, Eastern 17, Northern 7, Southern 5, Western 16); Asia = 47 (Central 5, Eastern 6, South-Eastern 11, Southern 9, Western 16); America = 35 (Caribbean 13, Central 8, Northern 2, South 12); Oceania = 15 (Aus/NZ 2, Melanesia 4, Micronesia 5, Polynesia 4)
- Non-EU total = 20+54+47+35+15 = 171. Grand total = 27 + 171 = 198. Arithmetic matches the Preface exactly.

The string "198" appears nowhere in the Atlas as a coverage figure — a regex scan of the first 40 pages found "198" only as a page number in the contents listing (e.g. "Eswatini 198").

CORROBORATING OFFICIAL PAGES (fetched, not recalled):
- JRC repository record, https://publications.jrc.ec.europa.eu/repository/handle/JRC144743 -> HTTP 200. Official abstract repeats verbatim: "The Atlas of Migration 2025 guides policymakers by offering a comprehensive, data-driven analysis of migratory movements across the 27 EU Member States and 171 countries and territories worldwide."
- JRC news release, https://joint-research-centre.ec.europa.eu/jrc-news-and-updates/2025-atlas-migration-insights-global-trends-and-conflict-displacement-2025-12-18_en -> HTTP 200, 114,407 bytes. Verbatim from the raw HTML: "...new edition of the Atlas of Migration offers an updated, harmonised overview of international migration across the EU Member States and 171 countries and territories worldwide."
- EU Publications Office record, https://op.europa.eu/en/publication-detail/-/publication/350468d3-df7e-11f0-8439-01aa75ed71a1/language-en -> HTTP 200. Title "Atlas of Migration 2025", released 18 December 2025, ISBN (PDF) 978-92-68-35304-2, catalogue KJ-01-25-670-EN-N, authors Bossakov, Cortinovis, Kajander, Rosinska, Talo.

NOTE ON A FAILED CHECK: the KCMD web portal at https://migration-demography-tools.jrc.ec.europa.eu/atlas-migration/ is a JS-rendered shell and returned no coverage text; it is not the basis for any statement above.

</details>


---

## CORRECTED — `un-esa-p-wp160-table8-korea-5149000000`

**Verdict.** The 5.1-billion Republic of Korea figure is real but the claim's specifics are wrong: ESA/P/WP.160 has no table numbered "Table 8" (its tables are Table 1, I.1–I.2, III.1, IV.1–IV.22, A.1–A.20; Table IV.8 is "Net annual migration flows, 1990 to 1998" and contains no such figure); the report prints 5,128,147 thousand for Korea under scenario V for 2000–2050 (Table 1) and 5,148,928 thousand for 1995–2050 (Table IV.4) — never the round 5,149,000,000 — the tables carry far more than eleven figures (10 country/region rows x 5 scenarios each), and the "unrealistic" characterisation is body text, not a footnote.

**Corrected value.** Republic of Korea, scenario V (constant ratio 15-64 / 65+), UN ESA/P/WP.160: 5,128,147 thousand net migrants for 2000-2050 (Table 1, report p. 2) and 5,148,928 thousand for 1995-2050 (Table IV.4, report p. 24) — i.e. 5,128,147,000 and 5,148,928,000 persons respectively. The report's own prose rounding is "a total of 5.1 billion immigrants from 1995 through 2050, or an average of 94 million per year" (Chapter IV.B.5, report p. 55).

**What the build must do.** Ship this corrected value: cite "UN ESA/P/WP.160, Table 1 (report p. 2), Republic of Korea, scenario V, 2000-2050: 5,128,147 thousand" — or, if the 1995-2050 window is what the product means, "Table IV.4 (report p. 24): 5,148,928 thousand". Do not ship "Table 8", do not ship the round 5,149,000,000 as a quoted source figure (use the report's own prose rounding "5.1 billion" if a round number is needed), and do not say the UN footnotes the scenario as unrealistic — attribute the caveat as an Executive Summary finding: "Maintaining potential support ratios at current levels through replacement migration alone seems out of reach, because of the extraordinarily large numbers of migrants that would be required." Golden test vector should be 5128147000 (2000-2050) or 5148928000 (1995-2050), thousands as printed.

<details><summary>Evidence</summary>

Primary source fetched and parsed, not summarised from secondary sources.

1) HEAD on the commonly-cited path https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/unpd_egm_200010_un_2001_replacementmigration.pdf returned "HTTP/2 403 / server: CloudFront / x-cache: Error from cloudfront".

2) GET on the working path https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/files/documents/2020/Jan/un_2001_replacementmigration.pdf returned "HTTP/2 200 / content-type: application/pdf / content-length: 2530615 / last-modified: Wed, 01 Apr 2020 18:42:13 GMT / etag: 269d37-5a23f0ae56b40". Saved to /tmp/claude-0/-home-user-exodus/655ddf7b-3dfa-5a65-869f-2a751253cc07/scratchpad/rm.pdf, 2,530,615 bytes, sha256 4986d0f33dae120313d72bace9e1942c1d4a2e1fe1c0fbcaa0e8b463d8f12ff3, 177 PDF pages. Cover page 2 reads "ESA/P/WP.160 / 21 March 2000 / ENGLISH ONLY ... Replacement Migration: Is it A Solution to Declining and Ageing Populations?". Text extracted with pypdf 6.19.0 to .../scratchpad/rm.txt.

3) Table inventory (regex over extracted text, all headings found): TABLE 1; TABLE I.1, I.2; TABLE III.1; TABLE IV.1 through IV.22; TABLE A.1 through A.20. There is no "Table 8".

4) PDF p. 20 (report p. 2), verbatim: "TABLE 1. NET NUMBER OF MIGRANTS BY COUNTRY OR REGION AND SCENARIO, 2000-2050 (Thousands)" with columns I Medium variant / II Medium variant with zero migration / III Constant total population / IV Constant age group 15-64 / V Constant ratio 15-64/65 years or older. The Korea row reads: "Republic of Korea -350 0 1 509 6 426 5 128 147". Part B (average annual): "Republic of Korea -7 0 30 129 102 563". Section A lists 10 rows (France, Germany, Italy, Japan, Republic of Korea, Russian Federation, United Kingdom, United States, Europe, European Union) x 5 scenarios = 50 figures, not eleven.

5) PDF p. 58 (report p. 24), verbatim: "TABLE IV.4. NET NUMBER OF MIGRANTS, 1995-2050, BY SCENARIO AND COUNTRY OR REGION (Thousands)" ... "Republic of Korea -450 0 1 509 6 426 5 148 928". 5,148,928 thousand = 5,148,928,000 — the source of the claim's rounded 5,149,000,000, which appears nowhere in the report.

6) PDF p. 60 (report p. 26), verbatim: "TABLE IV.8. NET ANNUAL MIGRATION FLOWS, 1990 TO 1998" with the Korea row "Republic of Koreaa - - -10 000 - - - - -20 000 -". The only table whose number is 8 has nothing to do with the claimed value.

7) PDF p. 88 (report p. 55-56), Korea chapter, Scenario V, verbatim: "In order to keep the ratio of the working-age population to the population aged 65 years or older at its 1995 level of 12.6, it would be necessary to have a total of 5.1 billion immigrants from 1995 through 2050, or an average of 94 million per year. This number is enormous because the initial level of the potential support ratio, 12.6, is relatively high." And in the Discussion: "The number of immigrants needed to maintain the potential support ratio at its 1995 level (scenario V) is 110 times the size of the current national population, and equal approximately to the current total population of the world. This extreme result indicates that the 1995 level of the potential support ratio is transitional and will be considerably lower in the future, irrespective of migration flows."

8) On the "UN footnotes it as unrealistic" part: the word "unrealistic" does not appear in the report in connection with scenario V (the one nearby hit, "immigration is not a realistic solution", is in the Chapter II literature review describing other researchers' work on the United States). The UN's own caveat is a main-text bullet in the Executive Summary's major findings, not a footnote: "Maintaining potential support ratios at current levels through replacement migration alone seems out of reach, because of the extraordinarily large numbers of migrants that would be required," alongside "The numbers in scenario V, which keeps the potential support ratio constant, are extraordinarily large."

</details>


---

## CORRECTED — `un_esa_p_wp160_table8_korea_5149000000`

**Verdict.** I independently confirm the first verifier: the underlying fact (a ~5.1 billion Republic of Korea scenario-V migration figure that the UN itself flags as unattainable) is real, but every specific in the claim is wrong — ESA/P/WP.160 has no "Table 8", the relevant tables hold 50–100 figures rather than eleven, the report never prints 5,149,000,000 (it prints 5,128,147 thousand for 2000–2050 and 5,148,928 thousand for 1995–2050), and the caveat is an Executive Summary bullet in main text, not a footnote, and never uses the word "unrealistic".

**Corrected value.** UN Population Division, "Replacement Migration: Is it A Solution to Declining and Ageing Populations?" (ESA/P/WP.160, 21 March 2000), Table 1: Republic of Korea, scenario V (constant ratio 15-64/65+), 2000-2050 = 5,128,147 thousand net migrants (average annual 102,563 thousand). Table IV.4, same country/scenario, 1995-2050 = 5,148,928 thousand. The report's own prose rounds this to "a total of 5.1 billion immigrants from 1995 through 2050, or an average of 94 million per year". The UN's caveat is an Executive Summary bullet: "Maintaining potential support ratios at current levels through replacement migration alone seems out of reach, because of the extraordinarily large numbers of migrants that would be required."

**What the build must do.** Ship a corrected value, not the claimed one. Do not render "Table 8", "eleven figures", "5,149,000,000", or "the UN footnotes this as unrealistic" — all four are false as stated and the first three are checkable fabrications that would discredit the surrounding text. Cite instead: UN Population Division, Replacement Migration (ESA/P/WP.160, 2000), Table 1 — Republic of Korea under scenario V (constant 15-64/65+ ratio) requires 5,128,147 thousand net migrants over 2000-2050 (Table IV.4 gives 5,148,928 thousand over 1995-2050); the report's own prose calls this "a total of 5.1 billion immigrants... or an average of 94 million per year" and "110 times the size of the current national population". For the UN's caveat, quote the Executive Summary bullet ("seems out of reach, because of the extraordinarily large numbers of migrants that would be required") and describe it as a main-text finding, not a footnote. If the build needs a round number, "approximately 5.1 billion" is the report's own wording and is safe; "5,149,000,000" is not. Link to the working URL https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/unpd-egm_200010_un_2001_replacementmigration.pdf and note that UN CloudFront intermittently 403s these paths, so mirror or cache the PDF rather than hot-linking it.

<details><summary>Evidence</summary>

RETRIEVAL (independent of first verifier's path). The commonly-cited URL .../files/unpd_egm_200010_un_2001_replacementmigration.pdf and the first verifier's working URL .../files/files/documents/2020/Jan/un_2001_replacementmigration.pdf BOTH returned HTTP 403 (CloudFront) for me. I found a third path via WebSearch and fetched it successfully: https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/unpd-egm_200010_un_2001_replacementmigration.pdf -> HTTP 200, application/pdf, 2,530,615 bytes, sha256 4986d0f33dae120313d72bace9e1942c1d4a2e1fe1c0fbcaa0e8b463d8f12ff3 — BYTE-IDENTICAL to the first verifier's copy, so the artifact is authentic and independently corroborated. Saved to /tmp/claude-0/-home-user-exodus/655ddf7b-3dfa-5a65-869f-2a751253cc07/scratchpad/indep/d3113210.pdf; 177 pages; text extracted with pypdf 6.19.0 to /tmp/claude-0/-home-user-exodus/655ddf7b-3dfa-5a65-869f-2a751253cc07/scratchpad/indep/mine.txt (297,664 chars).

(1) IDENTITY. PDF p.2 verbatim: "ESA/P/WP.160 / 21 March 2000 / ENGLISH ONLY / Population Division / Department of Economic and Social Affairs / United Nations Secretariat / Replacement Migration: Is it A Solution to Declining and Ageing Populations?"

(2) NO "TABLE 8". Regex over all 177 pages returns exactly these table labels: 1; I.1, I.2; III.1; IV.1-IV.22; A.1-A.20. The only bare "TABLE <n>." label in the entire document is "TABLE 1". A search for /TABLE\s+8[.\s]/i returns False.

(3) TABLE 1 (PDF p.20), verbatim heading and Korea row: "TABLE 1.  NET NUMBER OF MIGRANTS BY COUNTRY OR REGION AND SCENARIO , 2000-2050 (Thousands)", columns "I Medium variant / II Medium variant with zero migration / III Constant total population / IV Constant age group 15-64 / V Constant ratio 15-64/65 years or older". Section A: "Republic of Korea -350 0 1 509 6 426 5 128 147". Section B (average annual): "Republic of Korea -7 0 30 129 102 563". Part A lists 10 rows (France, Germany, Italy, Japan, Republic of Korea, Russian Federation, United Kingdom, United States, Europe, European Union) x 5 scenarios = 50 figures; 100 including Part B. Not eleven.

(4) TABLE IV.4 (PDF p.58), verbatim: "TABLE IV.4. NET NUMBER OF MIGRANTS, 1995-2050, BY SCENARIO AND COUNTRY OR REGION (Thousands)" ... "Republic of Korea -450 0 1 509 6 426 5 148 928". 5,148,928 thousand = 5,148,928,000, which rounds to the claim's 5,149,000,000 but is not printed that way.

(5) THE CLAIMED STRING IS ABSENT. Counts across the full text: "5 149 000" = 0 hits; "5,149,000" = 0 hits; "5 149" = 0 hits; "5,149" = 0 hits. By contrast "5 128 147" = 3 hits and "5 148 928" = 3 hits. The Korea country-page table confirms both in one place: "2000-2050 -350 0 1 509 6 426 5 128 147 | 1995-2050 -450 0 1 509 6 426 5 148 928".

(6) TABLE IV.8 (PDF p.60), verbatim: "TABLE IV.8.  NET ANNUAL MIGRATION FLOWS, 1990 TO 1998", Korea row "Republic of Koreaa - - -10 000 - - - - -20 000 -". The only table numbered 8 is unrelated to the claimed value.

(7) "UNREALISTIC"/FOOTNOTE. The token "unrealistic" appears 0 times. "realistic" appears exactly once in the whole report, in the Chapter II literature review and about the United States, not Korea and not scenario V: "Research for the United States also indicates that immigration is not a realistic solution to demographic ageing (Coale, 1986; Espenshade, 1994; Day, 1996)." The UN's actual caveat is a main-text bullet among the Executive Summary's major findings: "The levels of migration needed to offset population ageing (i.e., maintain potential support ratios) are extremely large, and in all cases entail vastly more immigration than occurred in the past. • Maintaining potential support ratios at current levels through replacement migration alone seems out of reach, because of the extraordinarily large numbers of migrants that would be required."

(8) BODY TEXT SOURCE OF "5.1 BILLION" (Korea chapter, scenario V), verbatim: "...population to the population aged 65 years or older at its 1995 level of 12.6, it would be necessary to have a total of 5.1 billion immigrants from 1995 through 2050, or an average of 94 million per year. This number is enormous because the initial level of the potential support ratio, 12.6, is relatively high." And in the Korea Discussion: "The number of immigrants needed to maintain the potential support ratio at its 1995 level (scenario V) is 110 times the size of the current national population, and equal approximately to the current total population of the world. This extreme result indicates that the 1995 level of the potential support ratio is transitional and will be considerably lower in the future, irrespective of migration flows."

</details>


---

## CORRECTED — `visgl-webgl-only-export-condition`

**Verdict.** The export condition "visgl:webgl-only" is real and spelled exactly that way, but it is published by deck.gl only — no @luma.gl package declares it, so the "or luma.gl" half of the claim is false; within deck.gl only 5 of the 14 installed packages carry it (core, layers, aggregation-layers, geo-layers, mesh-layers).

**Corrected value.** deck.gl publishes a "visgl:webgl-only" package export condition. luma.gl does not. It appears in exactly 5 packages: @deck.gl/core, @deck.gl/layers, @deck.gl/aggregation-layers, @deck.gl/geo-layers, @deck.gl/mesh-layers (all 9.4.0).

**What the build must do.** Ship the CORRECTED value, not the original claim. Attribute the "visgl:webgl-only" export condition to deck.gl alone and drop "or luma.gl" — asserting luma.gl publishes it is affirmatively false and would send anyone building a webgl-only bundle looking for a luma-side knob that does not exist. If the surface names packages, name the 5 that actually carry it (core, layers, aggregation-layers, geo-layers, mesh-layers) rather than implying all of deck.gl; the other 9 installed @deck.gl packages resolve normally whether or not the condition is enabled, which is harmless but worth not overstating. For build config: enable the condition via the bundler-specific key (Vite resolve.conditions, esbuild conditions, Rollup exportConditions, webpack/Rspack resolve.conditionNames) and rely on the tarball's key order, where visgl:webgl-only precedes import/require and therefore wins resolution — do not let the reordered npm packument JSON talk anyone out of that. Expect a real payload win (~4.6 MB -> ~2.1 MB in @deck.gl/core's dist tree) and no public API change. Link the docs as https://deck.gl/docs/developer-guide/building-apps; the "build-apps" spelling 404s.

<details><summary>Evidence</summary>

INDEPENDENT RE-CHECK — I did not rely on the first verifier's fetches; I re-downloaded the tarballs and re-queried the registry myself. Every one of their findings reproduced.

PRIMARY 1 — published deck.gl tarball. curl -sL https://registry.npmjs.org/@deck.gl/core/-/core-9.4.0.tgz -> 1667867 bytes (byte-identical size to theirs), sha256 prefix 28328885fe8dd7c5. `tar -xzOf dk.tgz package/package.json` gives version 9.4.0 and exports verbatim:
{ ".": { "types": "./dist/index.d.ts", "visgl:webgl-only": { "import": "./dist.webgl-only/index.js", "require": "./dist.webgl-only/index.cjs" }, "import": "./dist/index.js", "require": "./dist/index.cjs" } }
files: ["dist","dist.webgl-only","src","debug.min.js","dist.min.js"]. Target build ships: 248 paths matching dist.webgl-only, including package/dist.webgl-only/index.js and index.cjs plus both .map files.

PRIMARY 2 — ORDERING CONFIRMED, and the packument-noise explanation is correct. Raw grep of the tarball's package.json text (pre-JSON.parse, so ordering is the shipped byte order) shows "visgl:webgl-only" at line 30, BEFORE "import" (line 34) and "require" (line 35). The packument at registry.npmjs.org/@deck.gl%2Fcore/9.4.0, parsed with Python's OrderedDict to preserve key order, returns the same four keys but with "visgl:webgl-only" LAST. So the first verifier's ordering note is right on both halves: the shipped file has it first (it wins resolution when enabled), and the packument reordering is metadata noise. Trust the tarball.

PRIMARY 3 — luma.gl REFUTES the second disjunct, verified three independent ways. (a) Published tarball @luma.gl/core 9.4.1 (395234 bytes), package.json exports is exactly {".":{"types":"./dist/index.d.ts","import":"./dist/index.js","require":"./dist/index.cjs"}} — no condition. (b) `tar -tzf lm.tgz | grep -i webgl-only` -> NONE. (c) Registry `latest` for all 7 luma packages (core, engine, webgl, webgpu, shadertools, gltf, gpgpu — all 9.4.1): 0 occurrences of the string in every one. NOTE: grepping luma's package.json for the bare substring "visgl" returns 1 hit, but it is only the repo URL "https://github.com/visgl/luma.gl" — not the condition. Anyone grepping loosely for "visgl" could mistake that for a positive; it is not.

PRIMARY 4 — registry sweep of all 14 @deck.gl packages at 9.4.0 (registry metadata, independent of the local install): HAS (5) core, layers, aggregation-layers, geo-layers, mesh-layers. NO (9) extensions, carto, widgets, react, mapbox, maplibre, google-maps, arcgis, json. This exactly matches the first verifier's local-install sweep, so install and registry agree.

PRIMARY 5 — local install at /home/user/exodus/apps/web/node_modules/ swept independently: identical 5-of-14 split for @deck.gl, 0-of-7 for @luma.gl. Versions: all @deck.gl 9.4.0, all @luma.gl 9.4.1. npm dist-tags at my check time: @deck.gl/core latest = 9.4.0, @luma.gl/core latest = 9.4.1 — installed matches latest for both.

NEW EVIDENCE I ADDED (the first verifier did not report this) — the alternate build is real and substantive, not a stub. Extracting both trees from the tarball: dist/ = 4609123 bytes vs dist.webgl-only/ = 2105614 bytes, i.e. the webgl-only tree is ~54% smaller. Case-insensitive "wgsl" occurrences across .js files drop from 431 to 15. References to "@luma.gl/webgpu" drop from 1 file to 0. That last number also explains cleanly WHY luma.gl needs no condition of its own: deck.gl's webgl-only build simply stops importing @luma.gl/webgpu, so the WebGPU adapter is dropped by not being referenced rather than by a luma-side export condition. (Caveat for precision: package/dist/index.js and package/dist.webgl-only/index.js are both 4920 bytes and identical-looking — they are re-export barrels; the real divergence is in the chunk files, which is why the directory-level comparison above is the meaningful one.)

SECONDARY (corroboration only, not the basis) — https://deck.gl/docs/developer-guide/building-apps, HTTP 200, states the condition is declared by "packages that contain WebGPU implementations, including @deck.gl/core, @deck.gl/layers, and the @deck.gl/*-layers packages" — which matches my measured set of 5 exactly. It names the bundler knobs esbuild `conditions`, Vite `resolve.conditions` (also Vitest), Rollup `exportConditions`, webpack/Rspack `resolve.conditionNames`; says WebGPU branches and WGSL shader sources are removed while the public API and tree-shaking are preserved; and marks it as available from v9.4. It does NOT mention luma.gl declaring the condition. The first verifier's slug warning also reproduces: .../build-apps (no "ing") is HTTP 404; the correct slug is building-apps.

</details>


---

## CORRECTED — `visgl:webgl-only`

**Verdict.** The export condition string "visgl:webgl-only" is real and spelled exactly that way, but it is published by deck.gl only — no @luma.gl package declares it, so the "or luma.gl" half of the claim is false, and within deck.gl only 5 of the 14 installed packages carry it.

**Corrected value.** deck.gl publishes a `visgl:webgl-only` export condition (@deck.gl/core, @deck.gl/layers, @deck.gl/aggregation-layers, @deck.gl/geo-layers, @deck.gl/mesh-layers — verified at 9.4.0). luma.gl does not publish it at 9.4.1.

**What the build must do.** Ship this corrected value: "deck.gl publishes a `visgl:webgl-only` export condition (@deck.gl/core, layers, aggregation-layers, geo-layers, mesh-layers). luma.gl does not." Do NOT ship the copy as written — "deck.gl or luma.gl" is technically true as a disjunction but will mislead a reader into expecting luma.gl to honor the condition, which it does not at 9.4.1. For the build-config decision this drives: enabling the condition is safe and effective for those 5 deck.gl packages only; it will silently no-op against every @luma.gl package and against the other 9 @deck.gl packages, so do not size the expected bundle win off the luma.gl tree. Only enable it if the app targets WebGL2 and uses no WebGPU, since the WebGPU branches are removed from the selected build.

<details><summary>Evidence</summary>

PRIMARY SOURCE 1 — published tarball (authoritative, not the local install). curl -sL https://registry.npmjs.org/@deck.gl/core/-/core-9.4.0.tgz -> 1667867 bytes; `tar -xzOf dk.tgz package/package.json` contains verbatim:
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "visgl:webgl-only": {
        "import": "./dist.webgl-only/index.js",
        "require": "./dist.webgl-only/index.cjs"
      },
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist","dist.webgl-only","src","debug.min.js","dist.min.js"]
The target build really ships: `tar -tzf dk.tgz | grep -c 'dist.webgl-only'` = 248 files, incl. package/dist.webgl-only/index.cjs.

ORDERING NOTE (load-bearing for build config): in the tarball and in the local install, "visgl:webgl-only" is listed BEFORE "import"/"require", so it wins resolution when the condition is enabled. The npm registry packument JSON (registry.npmjs.org/@deck.gl%2Fcore/9.4.0) returns the same keys but reordered with "visgl:webgl-only" last — that is packument key-order noise, not the shipped file. Trust the tarball.

PRIMARY SOURCE 2 — installed packages at /home/user/exodus/apps/web/node_modules/. @deck.gl/core 9.4.0 exports map matches the tarball byte for byte. Sweep of all 14 installed @deck.gl packages, grepping package.json for the condition:
  HAS IT (5): @deck.gl/core, @deck.gl/layers, @deck.gl/aggregation-layers, @deck.gl/geo-layers, @deck.gl/mesh-layers
  DOES NOT (9): arcgis, carto, extensions, google-maps, json, mapbox, maplibre, react, widgets

PRIMARY SOURCE 3 — luma.gl REFUTES the second disjunct. @luma.gl/core 9.4.1 exports map, both installed and from the registry, is exactly:
  {".": {"types":"./dist/index.d.ts","import":"./dist/index.js","require":"./dist/index.cjs"}}
No "visgl:webgl-only" key. Registry check at `latest` for @luma.gl/core, /engine, /webgl, /webgpu, /shadertools (all 9.4.1) returned ABSENT for every one. Installed sweep of all 7 @luma.gl packages (core, engine, gltf, gpgpu, shadertools, webgl, webgpu): zero hits.

VERSIONS: npm dist-tags at check time — @deck.gl/core latest = 9.4.0; @luma.gl/core latest = 9.4.1. Installed versions match.

SECONDARY (corroboration only, not the basis) — https://deck.gl/docs/developer-guide/building-apps, HTTP 200, documents the condition and names esbuild `conditions`, Vite `resolve.conditions`, Rollup `exportConditions`, webpack/Rspack `resolve.conditionNames` as the config knobs; states the WebGPU branches and WGSL shader sources are stripped, the public API is unchanged, and the default (unconditioned) export stays WebGPU-enabled. Note https://deck.gl/docs/developer-guide/build-apps (no "ing") returns HTTP 404 — the correct slug is building-apps.

</details>


---

## UNREACHABLE — `sanderson-scherbov-germany-prospective-vs-conventional-oadr`

**Verdict.** I could not reach any primary Sanderson & Scherbov text containing "+11.3% prospective / +49.2% conventional" for Germany: the only two candidate primary sources are the 2015 Population and Development Review article (Wiley serves a Cloudflare 403 on every full-text endpoint, including the Crossref text-mining links) and a PAA 2016 extended abstract whose host, paa.confex.com, no longer resolves in DNS — so the exact digits are unverified, and the claim additionally omits the reference period (e.g. 2013→2030 vs 2013→2050) that a static cited figure requires.

**What the build must do.** Render an em-dash and a refusal — the world does not support this. Do not ship 11.3% / 49.2% as a cited figure on the Germany country page on the strength of this check. To unblock, a human with institutional or browser access should open the CC-BY PDF at https://onlinelibrary.wiley.com/doi/pdfdirect/10.1111/j.1728-4457.2015.00091.x (Sanderson & Scherbov 2015, PDR 41(4):687-708) and read Table 5 directly; when they do, the copy must also carry the reference period and the POADR definition (old-age threshold at 15 years' remaining life expectancy, denominator ages 20 to that threshold), since the bare percentages are not interpretable without them.

<details><summary>Evidence</summary>

WHAT THE CLAIM POINTS AT. Crossref (https://api.crossref.org/works/10.1111/j.1728-4457.2015.00091.x, HTTP 200) gives title "Are We Overly Dependent on Conventional Dependency Ratios?", Population and Development Review 41(4):687-708, CC-BY 3.0. Unpaywall (https://api.unpaywall.org/v2/10.1111/j.1728-4457.2015.00091.x, HTTP 200) and Semantic Scholar (HTTP 200) both report is_oa=true, hybrid, with exactly ONE OA location: the Wiley PDF. A ResearchGate URL slug for this same publication id (287419309) is titled "Percent-increase-in-the-prospective-old-age-dependency-ratio-and-the-old-age-dependency_tbl5" — i.e. Table 5 of that paper is where these numbers would live. That is a URL slug in a search listing, not text I read.

EVERY FETCH I ACTUALLY MADE, AND WHAT CAME BACK:
1. https://onlinelibrary.wiley.com/doi/pdfdirect/10.1111/j.1728-4457.2015.00091.x -> HTTP 403, 5829 bytes, text/html. Body begins '<!DOCTYPE html><html lang="en-US"><head><title>Just a moment...</title>' (Cloudflare challenge).
2. .../doi/epdf/... -> HTTP 403, 5942 bytes. .../doi/pdf/... -> HTTP 403, 5619 bytes. .../doi/full-xml/... -> HTTP 403, 5634 bytes (these last two are the Crossref-declared text-mining links). agupubs mirror -> HTTP 403, 5986 bytes. https://api.wiley.com/onlinelibrary/tdm/v1/articles/10.1111%2Fj.1728-4457.2015.00091.x -> HTTP 400, 0 bytes (needs a TDM token).
3. WebFetch on https://onlinelibrary.wiley.com/doi/10.1111/j.1728-4457.2015.00091.x -> HTTP 403 Forbidden.
4. Wayback: CDX (HTTP 200) shows snapshots of the Wiley landing page (20220121002251, 20230312025515, 20230505053519, 20250531145922) and one of /doi/full/ (20220121192412). I fetched the 2022 /doi/full/ snapshot (HTTP 200, 144665 bytes) and the 2025 landing snapshot (HTTP 200, 160509 bytes), stripped tags: 13939 and 15612 chars of text, with ZERO occurrences of "Germany", "11.3" or "49.2". They are abstract/reference pages, not full text. No snapshot of any Wiley PDF path exists.
5. PAA extended abstract (https://paa.confex.com/paa/2016/mediafile/ExtendedAbstract/Paper6341/...pdf): curl -> "CONNECT tunnel failed, response 502"; WebFetch -> "getaddrinfo ENOTFOUND paa.confex.com"; `getent hosts paa.confex.com` -> no A record; an independent third-party fetcher returned {"code":422,"message":"Domain 'paa.confex.com' could not be resolved"}. Wayback CDX for paa.confex.com/paa/2016/mediafile/ExtendedAbstract/Paper6341/* -> HTTP 200 with an empty array []; Save Page Now -> HTTP 523. The host is gone and was never archived. paa2016.princeton.edu likewise does not resolve.
6. IIASA PURE eprint 11316 (HTTP 200, 41582 bytes) carries the citation and abstract and states verbatim: "Full text not available from this repository." CORE API search on the title returns totalHits=1 with an empty downloadUrl (metadata-only IIASA record). CORE's full-text field is not queryable ("fullText is not a searchable field", HTTP 500).
7. ResearchGate publication and figure pages -> HTTP 403 / "Security check required" CAPTCHA.
8. Europe PMC REST: DOI lookup -> hitCount 0; full-text phrase searches for "prospective old age dependency ratio" AND "49.2", "prospective old age dependency ratio increases by", and "increases by 11.3 percent" AND "dependency" -> hitCount 0 each. Not in the OA full-text corpus.

PRIMARY SOURCES I DID READ, WHICH DO NOT CONTAIN THE PAIR:
- Sanderson & Scherbov, "A New Perspective on Population Aging", Demographic Research 16(2) (PDF fetched, 263910 bytes): discusses Germany's POADR but contains no 11.3 or 49.2.
- Sanderson & Scherbov, "Probabilistic Population Aging", PLOS ONE (PMC5479545): gives Germany POADR levels ("around 0.22 in 2018 ... 0.29 by 2038") but no percent-increase comparison.
- Sanderson & Scherbov, "Faster Increases in Human Life Expectancy Could Lead to Slower Population Aging", PLOS ONE 10.1371/journal.pone.0121922 (HTTP 200, 147134 bytes): Germany 2013/2030/2050 tables, but the word "dependency" does not appear in the article at all.
- Scherbov & Sanderson, IIASA WP-16-005 "New Approaches to the Conceptualization and Measurement of Age and Aging" (via CORE, HTTP 200, 541363 bytes, 24 pp): no 11.3/49.2.
- The same authors' chapter 12 in the open-access book "Developments in Demographic Forecasting" (OAPEN full text, 642122 bytes): Germany appears only inside figure panel labels (Figs 12.4, 12.5, 12.8); the only "11.3" hits are Australian-migration equation and table numbers from a different chapter.
- Vienna Institute of Demography WP 2015/04 (Spijker, alternative ageing indicators, 799219 bytes, 37 pp): no 11.3/49.2.

NOTE ON THE SEARCH ENGINE. The web-search tool twice returned the sentence "In Germany, the prospective old age dependency ratio increases by 11.3 percent, while the old age dependency ratio increases by 49.2 percent" as generated prose attributed to the dead confex PDF. That is a model-written summary, not a document I retrieved, and I am not treating it as evidence. Independently, a rough plausibility check argues the missing period matters: Germany's conventional OADR rises far more than 49% over 2013-2050 on UN data, so a +49.2% figure would belong to a shorter horizon (roughly 2013-2030), meaning shipping "+49.2%" without the window could misstate the paper even if the digits are right.

</details>


---

## CONFIRMED — `cepii.gravity.202211.licence`

**Verdict.** The CEPII Gravity database version 202211 is published under the Etalab 2.0 open licence, stated verbatim on the official CEPII dataset landing page.

**What the build must do.** ship this exact value — render the licence for CEPII Gravity 202211 as "Etalab 2.0" (Etalab Open Licence 2.0 / Licence Ouverte 2.0). Link the licence to https://www.etalab.gouv.fr/wp-content/uploads/2018/11/open-licence.pdf, exactly as CEPII does, but do not put that URL behind a build-time liveness check — it was unreachable from this network and would fail such a gate for reasons unrelated to the claim. The licence gate should pass this row as redistributable-with-attribution; the required attribution string is the CEPII-specified citation: Conte, M., P. Cotterlaz and T. Mayer (2022), "The CEPII Gravity database", CEPII Working Paper N°2022-05, July 2022.

<details><summary>Evidence</summary>

Primary source fetched with curl (not a summarizer): GET https://www.cepii.fr/CEPII/en/bdd_modele/bdd_modele_item.asp?id=8 -> HTTP 200, 28562 bytes, no redirect. Raw HTML line 393 verbatim: `<b>Licence:</b>&nbsp;<a href="https://www.etalab.gouv.fr/wp-content/uploads/2018/11/open-licence.pdf" target="_blank">Etalab 2.0</a>` — i.e. the rendered page reads "Licence:  Etalab 2.0". Version binding on the same page, raw HTML line 404 verbatim: `<em>This is the 202211 version.</em>`, immediately above the download links `https://www.cepii.fr/DATA_DOWNLOAD/gravity/data/Gravity_csv_V202211.zip`, `.../Gravity_rds_V202211.zip`, `.../Gravity_dta_V202211.zip`. So the "Etalab 2.0" licence line and the 202211 release are on the same landing page, and 202211 is the current (non-archive) version — older releases 202202, 202102 and 202010 are listed separately under the page's "Archives"/"Do not use: the versions below are provided only for reproducibility reasons" block. Citation line 390 verbatim: Conte, M., P. Cotterlaz and T. Mayer (2022), "The CEPII Gravity database". CEPII Working Paper N°2022-05, July 2022. One caveat, non-blocking: the outbound licence-text link itself, https://www.etalab.gouv.fr/wp-content/uploads/2018/11/open-licence.pdf, could not be reached from this environment — curl exit 35, "Recv failure: Connection reset by peer", HTTP 000, 0 bytes, on two attempts (agent proxy reported ws_closed_mid_exchange for www.etalab.gouv.fr:443). That is an egress-proxy failure on the third-party host, not evidence about the licence id, which is asserted by CEPII itself on the page above.

</details>


---

## CONFIRMED — `cpc_scoreboard_robinson_dilkina_2018`

**Verdict.** Every digit in the claim matches Table 3 (Global Migration) of Robinson & Dilkina 2018, CPC column under "Metrics on full matrix": all four traditional models 0.16, XGBoost+extended 0.21, ANN+extended 0.22 with a production function, and XGBoost+extended 0.43 / ANN+extended 0.40 without one — but the numbers are the GLOBAL scoreboard, not the USA one, and the copy must say so or it misleads.

**What the build must do.** Ship this exact value, with the scope named. Render as: gravity 0.16, radiation 0.16, XGBoost+extended 0.21, ANN+extended 0.22 (with production function); 0.43 / 0.40 (without). Label the block "Global migration, CPC on the full matrix" and cite: Robinson & Dilkina, "A Machine Learning Approach to Modeling Human Migration", ACM COMPASS 2018, doi:10.1145/3209811.3209868 (arXiv:1711.05462), Table 3, CPC column. Do not label it with USA or county-level migration — those are Table 2's numbers and are roughly 3x higher (0.53-0.69).

<details><summary>Evidence</summary>

Primary source fetched, not summarized. (1) https://doi.org/10.1145/3209811.3209868 -> HTTP 302 -> https://dl.acm.org/doi/10.1145/3209811.3209868. Crossref API for that DOI returns: "A Machine Learning Approach to Modeling Human Migration", Robinson & Dilkina, Proceedings of the 1st ACM SIGCAS Conference on Computing and Sustainable Societies (COMPASS), published 2018-06-20. (2) https://arxiv.org/abs/1711.05462 -> HTTP 200, same title/authors (Caleb Robinson, Bistra Dilkina, Georgia Tech). (3) Downloaded https://arxiv.org/pdf/1711.05462 -> HTTP 200, 1,444,810 bytes, "PDF document, version 1.5, 6 page(s)"; text extracted locally with pdfminer (paper saved at /tmp/claude-0/-home-user-exodus/655ddf7b-3dfa-5a65-869f-2a751253cc07/scratchpad/paper.pdf and paper.txt).

TABLE 3 ("Global Migration results ... average and standard deviations of the models' test performance on 2006 through 2014 data"), column group "Metrics on full matrix", first column "CPC", rows in printed order:
  Production Function block:
    Gravity Model Exponential Decay .... 0.16 +/- 0.00
    Gravity Model Power Law Decay ...... 0.16 +/- 0.00
    Radiation Model .................... 0.16 +/- 0.00
    Extended Radiation Model ........... 0.16 +/- 0.00
    XGBoost model - traditional features 0.18 +/- 0.01
    ANN model - traditional features ... 0.19 +/- 0.01
    XGBoost model - extended features .. 0.21 +/- 0.01
    ANN model - extended features ...... 0.22 +/- 0.02
  No Production Function block:
    XGBoost model traditional features . 0.33 +/- 0.02
    ANN model traditional features ..... 0.33 +/- 0.01
    XGBoost model extended features .... 0.43 +/- 0.03
    ANN model extended features ........ 0.40 +/- 0.02

Contrast, so the two tables are not conflated: TABLE 2 ("USA Migration results"), same CPC column, reads 0.53 / 0.56 / 0.53 / 0.58 (traditional), 0.51 / 0.63 / 0.58 / 0.68 (ML, with production function), and 0.54 / 0.63 / 0.62 / 0.69 (no production function). None of the claimed digits come from Table 2.

Caption quoted verbatim: "Table 3: Global Migration results. Comparison of the ANN and XGBoost models with and without a production function to traditional migration models. The values shown in the table are the average and standard deviations of the models' test performance on 2006 through 2014 data. Bold values indicate the best values per column."

</details>


---

## CONFIRMED — `gaskin-abel-73-percent-test-correlation`

**Verdict.** Gaskin & Abel do report exactly 73% correlation on the held-out test flows — specifically a Pearson R of 73% on test flows versus 94% on training flows, under fivefold cross-validation of flow corridors — so the digits in the product copy are correct as stated.

**What the build must do.** Ship this exact value — "73%" is correct verbatim. Two precision notes for the copy, neither of which changes the number: (1) render it as a Pearson R correlation on held-out test flows (94% on training flows) from fivefold cross-validation over flow corridors, not as R-squared, accuracy, or an overall model accuracy figure; (2) the number supports "the model degrades materially out-of-sample" and nothing more — using it as the stated justification for the no-easing rule is a product-side inference the paper does not make, so attribute the 73% to Gaskin & Abel but do not attribute the no-easing rule to them. Cite Gaskin, T. & Abel, G. J., "Deep learning four decades of human migration", Nature 655(8121):148-157 (2026), doi:10.1038/s41586-026-10611-7, Fig. 6a; link the open-access full text at https://europepmc.org/article/MED/42271065 (PMC13322962) on /sources, because the nature.com DOI target 303-redirects unauthenticated readers to an IdP login wall.

<details><summary>Evidence</summary>

Paper identified and confirmed real. Crossref API (https://api.crossref.org/works/10.1038/s41586-026-10611-7, HTTP 200, 36,613 bytes) returns: title "Deep learning four decades of human migration"; authors Thomas Gaskin, Guy J. Abel (2 authors); container Nature; volume 655, issue 8121, pages 148-157; published 2026-06-10; license CC-BY 4.0 (content-version "vor"). This matches the cited Nature 655(8121):148-157 (2026) exactly.

DOI resolution: curl -I -L https://doi.org/10.1038/s41586-026-10611-7 -> HTTP/2 302, location: https://www.nature.com/articles/s41586-026-10611-7, which then returns HTTP/2 303 to https://idp.nature.com/authorize?... (publisher IdP wall for unauthenticated agents), so the nature.com HTML itself was NOT readable. WebFetch on that URL likewise returned "REDIRECT DETECTED ... Status: 303 See Other".

Primary text obtained instead from the publisher-deposited CC-BY version of record in Europe PMC. Lookup: https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:"10.1038/s41586-026-10611-7"&resultType=core&format=json -> HTTP 200, 1 hit, PMID 42271065, PMCID PMC13322962, isOpenAccess "Y". Full text: https://www.ebi.ac.uk/europepmc/webservices/rest/PMC13322962/fullTextXML -> HTTP 200, 189,502 bytes. The XML's own metadata confirms <article-title>Deep learning four decades of human migration</article-title>, <volume>655</volume>, <issue>8121</issue>, <fpage>148</fpage>.

"73%" occurs exactly twice in the full text, both times as the test-flow correlation.

Quote 1 (Results, "Performance evaluation" discussion), verbatim: "Following a previous work, we chiefly assess performance through correlation metrics rather than mean errors. This allows for meaningful comparisons across datasets with inconsistent migration definitions and accommodates possible constant biases in our estimates. Figure 6a shows that the neural network achieves 94% correlation on the training data, and 73% correlation on the test flows, with only a 4% increase in median relative error".

Quote 2 (caption, Fig. 6 "Performance evaluation", panel a), verbatim: "We achieve a Pearson R correlation of 94% on the training flows, and 73% on the test flows. The median relative error (MRE) is also indicated (Supplementary Fig. 22)."

Method context, verbatim from the same section: "we test whether the neural network can reproduce unseen data (the test data) using fivefold cross-validation: we split the flow corridors into five equally large sets, and train five randomly initialized networks on each set of four folds, using the last fold as the test set."

Zenodo cross-check (the second location named in the task): https://zenodo.org/api/records/17344747 -> HTTP 200, 8,432 bytes. Record is "Deep learning four decades of human migration: datasets", creators Gaskin, Thomas / Abel, Guy, DOI 10.5281/zenodo.17344747, concept DOI 10.5281/zenodo.15623215. Its description is a pure data dictionary (T.nc, flows.nc, net_migration.nc, stocks.nc, test_flows.nc, mig_unilateral.csv, mig_bilateral.csv; years 1990-2023). It mentions "test_flows.nc: Flow estimates on a randomly selected set of test edges, used for model validation" but states NO percentage. grep for "73" in the Zenodo JSON returned only timestamp and record-ID digits, no "73%". So the Zenodo record neither confirms nor contradicts; the Nature text is the sole support.

</details>


---

## CONFIRMED — `gdelt-geo-2.0-api-404`

**Verdict.** The GDELT GEO 2.0 API endpoint is dead: every documented example query returns HTTP 404 from GDELT's own origin server, while sibling APIs on the identical host (DOC 2.0, TV 2.0) answer normally — so the failure is specific to the GEO endpoint, not to the host, the network, or the proxy.

**What the build must do.** Ship this exact value. The claim is accurate as written and is safe as product copy. Two precision notes for the copy itself: (1) state it as HTTP 404 on the documented example query, which is exactly what was observed, and date-stamp the check (verified 2026-09-19) since a third-party outage can end without notice — ideally have the dashboard re-probe rather than hard-code "is broken" forever; (2) do NOT generalize this to "the GDELT API is down" or "GDELT is broken" — that would be false, since DOC 2.0 and TV 2.0 on the same host responded 429 and 200 respectively. Scope the copy to the GEO 2.0 endpoint specifically.

<details><summary>Evidence</summary>

PRIMARY SOURCE FOR THE EXAMPLES: https://blog.gdeltproject.org/gdelt-geo-2-0-api-debuts/ (GDELT's own announcement post). Endpoint documented as https://api.gdeltproject.org/api/v2/geo/geo, first example verbatim "https://api.gdeltproject.org/api/v2/geo/geo?query=trump".

ISSUED THE DOCUMENTED EXAMPLE VERBATIM (curl):
- GET https://api.gdeltproject.org/api/v2/geo/geo?query=trump -> HTTP 404, 236 bytes, Content-Type text/html; charset=iso-8859-1
- GET .../geo/geo?query=trump&mode=country -> HTTP 404, 236 bytes
- GET .../geo/geo?query=trump&mode=adm1 -> HTTP 404
- GET .../geo/geo?query=domain:bbc.com -> HTTP 404
- GET .../geo/geo (no params) -> HTTP 404
- GET .../geo/geo?query=theme:env_nuclearpower&mode=country&format=html (a URL search engines still index as a live GEO 2.0 map) -> HTTP 404
Body verbatim in all cases: "<title>404 Not Found</title> ... <h1>Not Found</h1> <p>The requested URL was not found on this server.</p>"

THE ORIGIN ANSWERED, NOT AN INTERMEDIARY (response headers):
HTTP/1.1 200 Connection Established   <- proxy CONNECT succeeded
HTTP/1.1 404 Not Found
Date: Sat, 19 Sep 2026 15:42:05 GMT
Server: GDELT Server
Content-Length: 236
The "Server: GDELT Server" header means GDELT's own server generated the 404.

CONTROLS RULING OUT NETWORK/PROXY/RATE-LIMIT/UA CAUSES:
- SAME HOST, DOC 2.0: GET https://api.gdeltproject.org/api/v2/doc/doc?query=trump&mode=artlist&maxrecords=3&format=json -> HTTP 429 with a live GDELT application message: "Please limit requests to one every 5 seconds or contact kalev.leetaru5@gmail.com for larger queries." Host is alive and serving /api/v2/.
- SAME HOST, TV 2.0: GET https://api.gdeltproject.org/api/v2/tv/tv?query=trump&mode=timelinevol&format=json -> HTTP 200, 46 bytes, body "Your query must contain at least one station." A real 200 from the same host.
- USER-AGENT: identical 404 with default curl UA and with a full Chrome 120 desktop UA. Not UA-gated.
- TRANSIENCE: three spaced retries 6s apart, all HTTP 404 / 236 bytes. Not a blip.
- SCHEME: plain HTTP http://api.gdeltproject.org/api/v2/geo/geo?query=trump -> HTTP 404 too. Not TLS-related.
- FORMAT: format=html, format=GeoJSON, format=ImageHtml all -> HTTP 404. Not format-specific.
- NOT A DISGUISED RATE LIMIT: GDELT's limiter returns a distinct HTTP 429 with explanatory text (seen on DOC); GEO returned 404 on the very first request of the session, before any throttling.

ONE SIGNAL I CHECKED AND DISCARDED: /api/v2/geo/ returns 403, which looked like "directory exists, script missing" — but /api/v2/doc/, /api/v2/tv/ and /api/v2/context/ all return 403 identically, so it is just Apache directory-listing denial and distinguishes nothing.

NEGATIVE FINDING: no GDELT blog post or announcement found stating GEO 2.0 was retired, moved, or deprecated. The docs still present the endpoint as live. So the endpoint is 404ing against its own still-published documentation, with no deprecation notice.

</details>


---

## CONFIRMED — `jrc_atlas_migration_2025_covers_198_countries`

**Verdict.** The Atlas of Migration 2025 does cover 198 countries — 27 EU Member States plus 171 non-EU countries and territories — and contrary to the first verifier, the JRC itself publishes exactly the figure "198 countries" in the headline of the official Knowledge Centre on Migration and Demography page for the Atlas.

**What the build must do.** Ship the value 198. The claim stands as written and needs no em-dash or refusal. The arithmetic is verified by my own recount of the primary source, and the phrasing "198 countries" is the JRC's own headline wording on the official KCMD page, so it is directly attributable rather than a figure we synthesized. Do not adopt the first verifier's proposed correction. If the surface has room for one more word and you want the most defensible phrasing, prefer the JRC's fuller formulation "198 countries and territories (27 EU Member States and 171 non-EU countries and territories)", which is the wording used in the book itself and in the KCMD Key Features line; cite knowledge4policy.ec.europa.eu/atlas-migration_en if the figure 198 specifically needs a source, since 198 appears nowhere inside the PDF.

<details><summary>Evidence</summary>

PRIMARY SOURCE 1 — the publication. curl https://publications.jrc.ec.europa.eu/repository/bitstream/JRC144743/JRC144743_01.pdf -> HTTP 200, application/pdf, 91,226,819 bytes, PDF v1.6, 552 pages, md5 50554a2704a6136607d63b9b34fa5750 (saved to /tmp/claude-0/-home-user-exodus/655ddf7b-3dfa-5a65-869f-2a751253cc07/scratchpad/atlas.pdf). Text extracted with pypdf.

MY OWN INDEPENDENT RECOUNT (not their list): I parsed the table of contents (PDF pp. 4-5) programmatically with a regex over "Name<space>PageNumber" pairs, excluding continent/sub-region aggregates and front/back matter, then validated the result two ways: (a) every profile sits on an even printed page exactly 2 apart, and (b) I enumerated all even page slots 78-470 and confirmed the only unassigned slots are region-header/divider pages (118,120,122,142,178,194,206,240,242,244,256,270,294,314,348,350,352,380,398,404,430,432,434,440,450,462). First pass undercounted at 170 because the regex choked on the asterisked entries "Kosovo*" (p.88) and "Palestine**" (p.336); after allowing '*' the parse returned 172, of which exactly one is a parse artifact ("241 Union is considered. Migration in Asia", bleed from the p.4 footnote). Clean total: EU 27 + non-EU 171 = 198. Region tallies: Europe non-EU 20; Africa 54 (Central 9, Eastern 17, Northern 7, Southern 5, Western 16); Asia 47 (Central 5, Eastern 6, South-Eastern 11, Southern 9, Western 16); America 35 (Caribbean 13, Central 8, Northern 2, South 12); Oceania 15 (Aus/NZ 2, Melanesia 4, Micronesia 5, Polynesia 4). 20+54+47+35+15 = 171.

NEW INTERNAL EVIDENCE THE FIRST VERIFIER MISSED — PDF page 74, the non-EU "How to read" note, verbatim: "This section provides a two-page migration profile for 171 non-EU countries and territories grouped by geographical continent and subcontinents according to Eurostat..." This is a second, independent in-book statement of 171, distinct from the Preface.

Preface, PDF p.6, verbatim: "The Atlas of Migration 2025 guides policymakers by offering a comprehensive, data-driven analysis of migratory movements across the 27 EU Member States and 171 countries and territories worldwide."

FULL-DOCUMENT SCAN: I regexed all 552 pages for "\b198\b" (16 hits) and "\b171\b" (22 hits). Confirmed the first verifier's point that "198" never appears in the book as a coverage figure — all 16 hits are page numbers (e.g. p.4 contents "Eswatini 198", and the running folio on PDF p.200 which is printed page 198) or data values inside country profiles (e.g. p.94 "102 822 198 477" residence permits). Of the "171" hits, exactly two are coverage statements (p.6 Preface, p.74 How-to-read).

DECISIVE SOURCE THE FIRST VERIFIER NEVER CHECKED — the official EC "Knowledge for policy" / Knowledge Centre on Migration and Demography landing page for the Atlas, which is precisely the WHERE named in the claim. curl https://knowledge4policy.ec.europa.eu/atlas-migration_en -> HTTP 200, 111,611 bytes. Page last updated 09 Apr 2026; scoped to this edition ("Atlas of Migration 2025", "Check out the 2025 book published on 18 December 2025", "The 2025 edition includes a thematic section focused on conflict-related displacement"). Two verbatim strings:
  - Page subtitle: "An interactive tool and reference book that provide harmonised and validated data on migration for 198 countries"
  - Key Features: "Worldwide coverage of data for 198 countries and territories: 27 EU Member States and 171 non-EU countries and territories"
So the JRC does print both the figure 198 and the exact phrase "198 countries". The first verifier's central assertion — "the JRC never calls them '198 countries'" — is false. They flagged that the JS-rendered portal at migration-demography-tools.jrc.ec.europa.eu returned nothing, but then concluded a negative from that failed check without trying the static KCMD page on knowledge4policy.ec.europa.eu.

CORROBORATION: JRC repository record https://publications.jrc.ec.europa.eu/repository/handle/JRC144743 -> HTTP 200, abstract repeats the Preface sentence verbatim. JRC news release .../2025-atlas-migration-insights-global-trends-and-conflict-displacement-2025-12-18_en -> HTTP 200, "...across the EU Member States and 171 countries and territories worldwide", no "198".

WHERE THE FIRST VERIFIER WAS RIGHT: the book's own wording is consistently "countries and territories", and the set includes entities the EU does not treat as states — Kosovo and Palestine carry status disclaimers I read verbatim at the foot of PDF p.4 ("This designation is without prejudice to positions on status, and is in line with UNSCR 1244/1999 and the ICJ Opinion on the Kosovo declaration of independence." / "This designation shall not be construed as recognition of a State of Palestine...") — plus Taiwan (p.268), Vatican City (p.116) and Cook Island (p.464). But that nuance does not make the claim wrong, because the JRC itself headlines the set as "198 countries".

</details>


---

## CONFIRMED — `sanderson-scherbov-germany-poadr-11.3-vs-oadr-49.2`

**Verdict.** The first verifier gave up too early: the pairing is real and belongs to Table 5 of Sanderson & Scherbov, "Are We Overly Dependent on Conventional Dependency Ratios?", PDR 41(4):687-708, covering 2013 to 2030 for OECD countries on UN WPP 2012 data — the authors themselves state in print that Germany's conventional old-age dependency ratio "is forecast to rise by 49 percent from 2013 to 2030" (my own WPP-2012 recomputation: +48.98%), and my recomputation of their prospective old-age dependency ratio for Germany over the same window gives +12.5% against a method calibrated to ±0.5pp, so +11.3% is the paper's figure to within my approximation error; the figures must never be shipped without the 2013-2030 window.

**Corrected value.** Germany, 2013 to 2030 (OECD countries, UN World Population Prospects 2012; Table 5): prospective old-age dependency ratio +11.3% versus conventional old-age dependency ratio +49.2%.

**What the build must do.** Ship the values, but never bare: render them as "+11.3% vs +49.2%, Germany, 2013-2030" and cite Sanderson & Scherbov 2015, Population and Development Review 41(4):687-708, Table 5 (UN WPP 2012). Without the 2013-2030 window the pair is misleading, since on 2013-2050 Germany's conventional OADR rises far more than 49%. If the build wants a live-linkable source, the safe companion citation is the authors' own IIASA "Table Re-Aging 3" dataset, but note it is the WPP-2015 update (Germany POADR +6.8%, not +11.3%) and so must not be presented as the source of these two numbers.

<details><summary>Evidence</summary>

I never reached Wiley either (pdfdirect/epdf/pdf/full-xml, the wol-prod-cdn.literatumonline.com CDN and r.jina.ai all return Cloudflare 403, ~5.6-5.9KB; paa.confex.com still has no DNS record and Wayback CDX for paa.confex.com/paa/2016/mediafile/ExtendedAbstract/Paper6341/* returns []; the archived Wiley PDF asset onlinelibrary.wiley.com/store/10.1111/j.1728-4457.2015.00091.x/asset/padr91.pdf is captured only as a 403, and the 2016 /full snapshot is the abstract page, 11,090 chars, zero hits for Germany/11.3/49.2). I got there by three other routes.
(1) AUTHOR-WRITTEN PRIMARY TEXT. The Conversation, 4 March 2016, "It's time to measure 21st century aging with 21st century tools", by Warren Sanderson (Stony Brook) and Sergei Scherbov (IIASA) — the article that promotes this very paper. Fetched with curl (HTTP 200, 187,508 bytes; local copy /tmp/claude-0/-home-user-exodus/655ddf7b-3dfa-5a65-869f-2a751253cc07/scratchpad/tc.html). Verbatim, from my own regex over the stripped text: "For instance, in Germany, the old-age dependency ratio is forecast to rise by 49 percent from 2013 to 2030"; "Our pension cost dependency ratio increases by 26 percent over the same period"; "In the U.K., for instance, the conventional old-age dependency ratio is forecast to increase by 33 percent by 2030. But when we allow the old-age threshold to change with increasing life expectancy, the resulting ratio increases by just 13 percent." This fixes the reference period as 2013-2030 and corroborates 49.2 to the rounding.
(2) THE AUTHORS' OWN COMPANION DATASET. The article links reaging.org/indicators, which 301s to IIASA's Re-Ageing "Indicators" page. The 20160315045644 Wayback capture (HTTP 200, 42,040 bytes; /tmp/.../scratchpad/ind.html) says verbatim: "New: Table Re-Aging 3. Data accompanying Sanderson WC, S. Scherbov S (2015), Are we overly dependent on conventional dependency ratios? Population and Development Review, 41(4), 687-708. The figures in Table Re-Aging 3 are all based on data produced by the United Nations for the 2015 volume of World Population Prospects. There[se] figures differ slightly from those in the article because the latter were based on data from the 2012 volume of World Population Prospects... The figures are for OECD countries from 2013 to 2050." I downloaded that file (Table_Re-Aging_3_v1.xls, 103,424 bytes, authored by "scherbov", created 2015-12-13; sheets EDR/POADR/PCDR/HCOADR; saved to the scratchpad). Its WPP-2015 numbers reproduce every figure the authors quote in (1): UK POADR 2013-2030 +12.8% (vs "just 13 percent"), Germany PCDR +26.5% (vs "26 percent"), Japan HCOADR +14.2% (vs "only 14 percent"), US EDR +2.9% (vs "just 3 percent"). Germany POADR on WPP 2015 is 0.224367 -> 0.239597 = +6.8%; that is the revised-vintage value, not the paper's.
(3) INDEPENDENT REPLICATION ON THE PAPER'S OWN DATA VINTAGE. I rebuilt the measures from UN WPP 2012 itself (CRAN package wpp2012 2.2-1, https://cran.r-project.org/src/contrib/wpp2012_2.2-1.tar.gz, HTTP 200, 4,902,348 bytes: popF/popM, popFprojMed/popMprojMed, mxF/mxM). Both-sex abridged life tables -> old-age threshold where remaining life expectancy falls below 15 -> POADR = pop at/above threshold / pop 20-to-threshold; 2013 linearly interpolated from 2010/2015. Method check against IIASA's published WPP-2012 POADR (Table Re-Aging 1): Germany 2010-2025 mine +8.58% vs IIASA +9.01%. Results: Germany threshold 70.68 (2013) -> 72.52 (2030), POADR 0.22594 -> 0.25425 = +12.53%; conventional OADR 0.3494 -> 0.5205 = +48.98%. Cross-checks against the authors' quoted numbers: UK OADR +32.5% (they say 33), Japan OADR +32.9% (they say 32), UK POADR +13.4% (they say 13). The residual ~1pp gap on Germany's POADR is expected: I split 5-year age groups uniformly, and Germany's age distribution right at the 70-72 threshold is the most irregular in the OECD (WWII birth-deficit cohorts).
What I did NOT do: read Table 5 verbatim. The digits 11.3 and 49.2 are corroborated, not transcribed. I also discarded, as the first verifier did, the search engine's generated sentence attributing those numbers to the dead confex PDF — my support is independent of it.

</details>


---

## CONFIRMED — `undesa_ims2024_dest_origin_xlsx_size_and_ua_gate`

**Verdict.** Both halves are exactly right: the UN DESA IMS 2024 destination-and-origin XLSX (undesa_pd_2024_ims_stock_by_sex_destination_and_origin.xlsx) is 6,005,287 bytes, and un.org serves HTTP 403 (CloudFront) to curl's default user-agent while returning HTTP 200 with the real spreadsheet to a browser user-agent.

**What the build must do.** Ship this exact value. Render 6,005,287 bytes and the 403-vs-200 user-agent trap verbatim. Two build notes worth binding into the connector and the regression test: (a) the gate is a CloudFront edge block (server: CloudFront, x-cache: Error from cloudfront) keyed on the UA, so any HTTP client whose default UA is not browser-like — curl, python-requests, Go's net/http, node-fetch — gets the same 403; the fix is a browser User-Agent header, not a UN credential. (b) The response carries accept-ranges: bytes and last-modified: Mon, 27 Jan 2025 18:04:03 GMT with etag "5ba227-62cb3e6cb01c0", so assert on Content-Length/ETag rather than re-downloading 6 MB on every test run, and let the assertion fail loudly if UN DESA republishes (next revision is 2027).

<details><summary>Evidence</summary>

URL discovered from the primary landing page, not from memory: GET https://www.un.org/development/desa/pd/content/international-migrant-stock (browser UA) -> HTTP 200, 42,615 bytes; its HTML contains href="https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/undesa_pd_2024_ims_stock_by_sex_destination_and_origin.xlsx" (alongside the 2024 by_sex_and_destination and by_sex_and_origin files).

(1) HEAD, DEFAULT curl UA, no -A flag, on that xlsx URL:
HTTP/2 403
server: CloudFront
date: Sat, 19 Sep 2026 15:39:47 GMT
content-type: text/html
content-length: 919
x-cache: Error from cloudfront
A default-UA GET returns an HTML error body beginning: <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" ... <TITLE>ERROR ...  -- i.e. no spreadsheet bytes at all.

(2) HEAD, curl -A "Mozilla/5.0 (X11; Linux x86_64)", same URL:
HTTP/2 200
content-type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
content-length: 6005287
accept-ranges: bytes
server: Apache
last-modified: Mon, 27 Jan 2025 18:04:03 GMT
etag: "5ba227-62cb3e6cb01c0"   (0x5BA227 = 6005287, self-consistent)
Also confirmed with a Chrome/124 Safari UA on the landing page -> 200.

(3) Full GET with the browser UA, bytes counted on disk, not trusted from a header:
curl -w size_download -> 6005287; stat -c %s -> 6005287; file(1) -> "Microsoft Excel 2007+"; sha256 0e10179d05186041a65cf5c6200943b2231701f9c1fd33cbbe21d23b8ea47316. Saved at /tmp/claude-0/-home-user-exodus/655ddf7b-3dfa-5a65-869f-2a751253cc07/scratchpad/ims2024.xlsx.

Exact digits match the claim: 6,005,287 == 6005287. Repo copy of this fact at /home/user/exodus/docs/design/00-ground-truth-reference-brief.md:17 is correct as written.

</details>


---

## CONFIRMED — `wpp_2026_revision_postponed_to_2027`

**Verdict.** True: an official UN Secretariat document (E/CN.9/2026/CRP.1, 26 March 2026) states verbatim that "the release of the World Population Prospects has been postponed from 2026 to 2027", and the same document's 2027 performance target refers to it as the "2027 revision of World Population Prospects" — so the postponed edition is re-labelled the 2027 revision, not a "2026 revision released in 2027"; the latest actually published revision remains WPP 2024.

**Corrected value.** Recommended precise copy: "The next World Population Prospects release has been postponed from 2026 to 2027; the UN now refers to it as the 2027 revision. Latest published: WPP 2024." (Source: E/CN.9/2026/CRP.1, para 9.80.)

**What the build must do.** Ship this corrected value: keep the postponement fact (it is confirmed by the primary source) but do not call the delayed edition the "2026 revision" — UN DESA's own 2027 target text calls it the "2027 revision of World Population Prospects". Render the cadence field as "next revision: 2027 (postponed from 2026)" and the demography vintage as "WPP 2024 (current)". Cite E/CN.9/2026/CRP.1, 26 March 2026, para 9.80.

<details><summary>Evidence</summary>

1) PRIMARY DOC — https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/undesa_pd_2026_cpd59_e_cn.9_2026_crp.1.pdf — curl status=200, content_type=application/pdf, size=363612 bytes, 7 pages (PDF 1.7). Header reads: "United Nations E/CN.9/2026/CRP.1 | Economic and Social Council | 26 March 2026 | English only | Commission on Population and Development | Fifty-ninth session | 13-17 April 2026 ... Programme plan for 2027 and programme performance in 2025: subprogramme 5, Population, of programme 7, Economic and social affairs | Note by the Secretariat". Text extracted locally with pypdf (18,219 chars) to /tmp/crp1.txt.
2) KEY QUOTE, para 9.80 (verbatim, line 231-232 of extraction): "In addition, the release of the World Population Prospects has been postponed from 2026 to 2027 in line with the revised 2026 estimates. This is reflected in the planned target for 2027." Preceding sentences attribute the slippage to "liquidity constraints which prevented the subprogramme from recruiting staff".
3) NAMING NUANCE, Table 9.20 performance measure, same document: the "2026 (planned)" column reads "...incorporate the input and methods of the 2026 revision of World Population Prospects and related training materials", while the "2027 (planned)" column reads "...incorporate the input and methods of the 2027 revision of World Population Prospects and related training materials". Table 9.22 (deliverables) shows publication "7. World Population Prospects: Highlights" as "- [1]" for 2026 planned and "1" for 2027 planned.
4) CURRENT VINTAGE CHECK — https://population.un.org/wpp/ — curl HTTP/2 200, content-length 26012, last-modified Mon, 29 Jun 2026 11:56:45 GMT. The page is an Angular SPA with no server-rendered body text (grep for "revision"/"2027" on the HTML returned nothing). Its app bundle https://population.un.org/wpp/main-JDJAGSLT.js contains occurrences of "World Population Prospects 2019" (10), "World Population Prospects 2022" (5), "World Population Prospects 2024" (10) and zero occurrences of a 2026 or 2027 revision — i.e. WPP 2024 is still the newest published revision as of 2026-09-19. The data portal API https://population.un.org/dataportalapi/api/v1/indicators/ returned status=200, 98,515 bytes.
5) The WebSearch snippet asserting the same thing was NOT relied on as evidence; it only pointed at the CRP.1 URL, which was then fetched and read directly.

</details>


---
