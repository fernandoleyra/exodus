# M0 verification ledger

Every figure the critics flagged as unverified, probed against its primary source and then
independently re-checked where the first pass was not a clean confirmation.

**Two claims were refuted outright and would have shipped as false product copy. Five more
were materially wrong in their specifics.** Anything below that is not CONFIRMED must be
corrected in `docs/prompt/BUILD_PROMPT.md` before it reaches a screen.

| Status | Meaning |
|---|---|
| `REFUTED` | The claim is false. Do not ship it. |
| `CORRECTED` | The substance survives but the specifics were wrong. Ship the corrected value. |
| `CONFIRMED` | Verbatim correct. Ship it. |


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

**Verdict.** UNHCR statistical products DO use a bare asterisk inside numeric data cells — UNHCR's Global Trends annex Table 4 (statelessness) carries 84 cells whose entire value is "*" — so telling a builder not to write asterisk parsing is wrong; however the contested rationale is also wrong, because the asterisk does not mean "a value between 1 and 4": it means UNHCR has information about stateless persons in that country but no reliable data, while genuinely small values (0-5) are rounded to multiples of five and "-" marks zero/not available/not applicable.

**Corrected value.** UNHCR uses THREE non-numeric conventions, none of which is "* = 1 to 4": (1) "*" = "Countries for which UNHCR has information about stateless persons but no reliable data have been included in the table and marked with an asterisk (*)" — Global Trends annex Table 4; (2) "Small values between zero and five have been rounded to multiples of five"; (3) 'A dash ("-") indicates that the value is zero, not available or not applicable.' A parser must treat "*" and "-" as non-numeric sentinels, not coerce them to 0.

**What the build must do.** Do not ship this claim. Ship this corrected value: "UNHCR annex tables use a bare asterisk (*) for 'information exists but no reliable data' and a dash (-) for zero/not available/not applicable; small values between zero and five are rounded to multiples of five. Asterisk parsing IS required." Concretely: the ingester must treat "*" and "-" as non-numeric sentinels and must not coerce them to 0 — an int-cast of Global Trends annex Table 4 will hit 84 asterisk cells and either crash or silently turn "no reliable data" into zero for countries including Afghanistan and Bhutan. The Refugee Data Finder API and CSV export are asterisk-free today but still emit "-", so sentinel handling is needed on every route. Also strike the "* means a value between 1 and 4" gloss wherever it appears: it is not UNHCR's documented convention.

<details><summary>Evidence</summary>

PRIMARY SOURCE 1 — UNHCR Global Trends 2023 annex workbook, hosted by UNHCR at https://unhcr-web.github.io/refugee-statistics/data/Annexes_GT_2023.xlsx (curl: status=200, bytes=521452, content-type application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, file(1): "Microsoft Excel 2007+"). Sheets: Index, T1-T15. Programmatic scan (openpyxl 3.1.5) of every cell in every sheet found 84 cells in sheet T4 whose entire string value is "*" (first eight: B10, C10, E10, F10, B20, C20, E20, F20). Sheet T4 header text, verbatim: A1 "Table 4 | Persons under UNHCR's statelessness mandate | 2023"; A4 "Data is not complete and includes estimates. Countries for which UNHCR has information about stateless persons but no reliable data have been included in the table and marked with an asterisk (*)."; A6 "Small values between zero and five have been rounded to multiples of five. A dash (\"-\") indicates that the value is zero, not available or not applicable." Data rows in context — row 9 headers are ['Country of residence', "Total number of persons under UNHCR's statelessness mandate", 'Total number of stateless people including forcibly displaced Stateless', 'of whom: UNHCR-assisted', ...]; row 10 is ['Afghanistan', '*', '*', 0, '*', '*', 0]; row 20 is ['Bhutan', '*', '*', 0, '*', '*', 0]. So the asterisk sits in columns an ingester would read as integers. Sheets T6 and T7 additionally carry a footnote-marker asterisk: A4 "* Indicates the proportion of the population type in the country for which the demographic data are available..." with the header cell U8 "Coverage*".

PRIMARY SOURCE 2 — Refugee Data Finder API, https://api.unhcr.org/population/v1/population/?limit=1000&yearFrom=2023&yearTo=2023&coo_all=true&coa_all=true (status=200, 277601 bytes, 1000 items). Zero occurrences of "*" as a value. The only non-numeric value present is "-" (1000 occurrences, field oip). No value between 1 and 4 occurs in any of refugees/asylum_seekers/returned_refugees/idps/returned_idps/stateless/ooc/oip/hst; the smallest non-zero refugee count is 5 (134 rows), which corroborates the "rounded to multiples of five" rule rather than any asterisk suppression. Same for https://api.unhcr.org/population/v1/demographics/?limit=200&yearFrom=2023&yearTo=2023&coa_all=true (status=200, 60535 bytes): zero asterisks. CSV export https://api.unhcr.org/population/v1/population/?download=true&yearFrom=2023&yearTo=2023&coo=SYR&coa_all=true (status=200, application/zip) unzips to population.csv + footnotes.csv; grep for "*" in population.csv returned no matches, and "-" appears as the sentinel in the "Other people in need of international protection" column.

NOT REACHED — www.unhcr.org is behind a bot wall from this environment and cannot be quoted: https://www.unhcr.org/refugee-statistics/methodology/ HTTP 403 (182754-byte HTML block page, <title>UNHCR - the UN Refugee Agency</title>, meta robots noindex,nofollow, zero occurrences of "asterisk"), /refugee-statistics/methodology/data-content/ HTTP 403, /sites/default/files/2025-06/global-trends-report-2024.pdf HTTP 403 (returns HTML, not PDF), unhcr.org/2021-global-trends-annex-table-statelessness.xlsx HTTP 403, www.unhcr.org/us/global-trends 403, reporting.unhcr.org 403, www.acnur.org 403; popstats.unhcr.org resets the connection (curl 35). Wayback has no snapshot of the methodology pages and its CDX endpoint returned 504. The verdict does not rest on any of these — it rests on the two primary artifacts above, both fetched at HTTP 200 from UNHCR-controlled hosts.

</details>


---

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

## CONFIRMED — `cepii.gravity.202211.licence`

**Verdict.** The CEPII Gravity database version 202211 is published under the Etalab 2.0 open licence, stated verbatim on the official CEPII dataset landing page.

**What the build must do.** ship this exact value — render the licence for CEPII Gravity 202211 as "Etalab 2.0" (Etalab Open Licence 2.0 / Licence Ouverte 2.0). Link the licence to https://www.etalab.gouv.fr/wp-content/uploads/2018/11/open-licence.pdf, exactly as CEPII does, but do not put that URL behind a build-time liveness check — it was unreachable from this network and would fail such a gate for reasons unrelated to the claim. The licence gate should pass this row as redistributable-with-attribution; the required attribution string is the CEPII-specified citation: Conte, M., P. Cotterlaz and T. Mayer (2022), "The CEPII Gravity database", CEPII Working Paper N°2022-05, July 2022.

<details><summary>Evidence</summary>

Primary source fetched with curl (not a summarizer): GET https://www.cepii.fr/CEPII/en/bdd_modele/bdd_modele_item.asp?id=8 -> HTTP 200, 28562 bytes, no redirect. Raw HTML line 393 verbatim: `<b>Licence:</b>&nbsp;<a href="https://www.etalab.gouv.fr/wp-content/uploads/2018/11/open-licence.pdf" target="_blank">Etalab 2.0</a>` — i.e. the rendered page reads "Licence:  Etalab 2.0". Version binding on the same page, raw HTML line 404 verbatim: `<em>This is the 202211 version.</em>`, immediately above the download links `https://www.cepii.fr/DATA_DOWNLOAD/gravity/data/Gravity_csv_V202211.zip`, `.../Gravity_rds_V202211.zip`, `.../Gravity_dta_V202211.zip`. So the "Etalab 2.0" licence line and the 202211 release are on the same landing page, and 202211 is the current (non-archive) version — older releases 202202, 202102 and 202010 are listed separately under the page's "Archives"/"Do not use: the versions below are provided only for reproducibility reasons" block. Citation line 390 verbatim: Conte, M., P. Cotterlaz and T. Mayer (2022), "The CEPII Gravity database". CEPII Working Paper N°2022-05, July 2022. One caveat, non-blocking: the outbound licence-text link itself, https://www.etalab.gouv.fr/wp-content/uploads/2018/11/open-licence.pdf, could not be reached from this environment — curl exit 35, "Recv failure: Connection reset by peer", HTTP 000, 0 bytes, on two attempts (agent proxy reported ws_closed_mid_exchange for www.etalab.gouv.fr:443). That is an egress-proxy failure on the third-party host, not evidence about the licence id, which is asserted by CEPII itself on the page above.

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
