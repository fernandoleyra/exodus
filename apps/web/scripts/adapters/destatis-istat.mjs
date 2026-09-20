// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Germany (Destatis) and Italy (ISTAT) — the two national population registers that publish
// BOTH directions of movement by partner country at 2025.
//
// Everything asserted, printed or written below was read off a live response on 2026-09-20.
//
// ---------------------------------------------------------------------------------------
// WHY THESE TWO SIT IN ONE FILE
// ---------------------------------------------------------------------------------------
// Every other layer in this app measures a corridor once. These two measure the same
// corridor twice, from opposite ends, in the same calendar year:
//
//   ITA>DEU   Destatis counts arrivals in Germany from Italy       (Zuzuege)
//             ISTAT counts departures from Italy to Germany        (cancellazioni)
//   DEU>ITA   Destatis counts departures from Germany to Italy     (Fortzuege)
//             ISTAT counts arrivals in Italy from Germany          (iscrizioni)
//
// The two registers do not agree, and the size of the gap is computed at the bottom of
// load() rather than written down here, because a number written into a comment goes stale
// the next time either office publishes. As of this run it is roughly a factor of three in
// both directions, always with Germany counting more. That is not a bug in either register
// and it is not something this adapter can adjudicate: German municipalities record an
// Abmeldung at a service counter that people must visit to close their tax and rent
// affairs, while Italian emigration is recorded through AIRE consular enrolment that
// emigrants routinely never complete. The layers are shipped side by side so a reader sees
// the disagreement instead of being handed one side of it.
//
// Neither layer is a "corridor" in the sense the modelled spine means. Both are keyed by
// the country of PREVIOUS or NEXT RESIDENCE — where the person actually moved from or to,
// not their citizenship — which is why these can be keyed 'ORIG>DEST' at all and why
// cbs-netherlands.mjs and ircc-canada.mjs, which are keyed by origin/citizenship, cannot.
// Destatis calls the axis "Herkunfts-/Zielland" and ISTAT calls it COUNTRY_PREV_RESID /
// COUNTRY_NEXT_RESID; both are place-of-move, so they are comparable to each other.
//
// The contract says an adapter owns exactly one producer. This one owns two, deliberately,
// because their whole value is the comparison and splitting them would let one half ship
// without the other. Each layer carries its own producer and its own licence in its own
// vintage, which is what actually reaches the UI; `meta` below names both.
//
// ---------------------------------------------------------------------------------------
// LICENCE — GERMANY. Data Licence Germany 2.0, and the variant IS confirmable.
// ---------------------------------------------------------------------------------------
// The trap this repository has been burned by twice is a WEBSITE-content licence being
// mistaken for a DATA licence. Destatis is the good case: the grant is made on its Open Data
// page and is scoped to the data in terms. Read at
// https://www.destatis.de/EN/Service/OpenData/_node.html on 2026-09-20, verbatim:
//
//   "The statistical data can be reused in compliance with the Data Licence Germany 2.0
//    conditions."
//
// and the German original at https://www.destatis.de/DE/Service/OpenData/_inhalt.html:
//
//   "Die statistischen Daten koennen unter den Bedingungen der Datenlizenz Deutschland 2.0
//    weiterverwendet werden."
//
// Data Licence Germany 2.0 exists in two incompatible variants — Namensnennung (BY) and
// Zero — and the visible prose names neither. The research brief this adapter was written
// from concluded that the variant is therefore an inference and told us to badge it
// "(variant unconfirmed)". That is wrong, and the probe wins: on BOTH the English and the
// German page the licence name is a hyperlink, and on both it points at
//
//   https://www.govdata.de/dl-de/by-2-0
//
// which is the Namensnennung (BY) variant and nothing else. The anchor text is exactly
// "Data Licence Germany 2.0" / "Datenlizenz Deutschland 2.0" and the href was read out of
// the live HTML of both pages this session. The variant is named, just in the href rather
// than in the prose.
//
// That licence text, read at https://www.govdata.de/dl-de/by-2-0 on 2026-09-20, grants
// commercial use in terms — this is the operative sentence:
//
//   "The data and meta-data provided may, for commercial and non-commercial use, in
//    particular be copied, printed, presented, altered, processed and transmitted to third
//    parties; be merged with own data and with the data of others and be combined to form
//    new and independent datasets; be integrated in internal and external business
//    processes, products and applications in public and non-public electronic networks."
//
// so commercialUseClear is true, and the brief's second conclusion — that commercial reuse
// is not clearly granted — is also wrong.
//
// The required source note, from clause (2) of the same text: the name of the provider, the
// annotation "Datenlizenz Deutschland - Namensnennung - Version 2.0" or "dl-de/by-2-0" with
// a reference to www.govdata.de/dl-de/by-2-0, and a reference to the dataset URI.
//
// Two things the brief got RIGHT and that are recorded here rather than smoothed over:
//   - The workbook itself contains zero occurrences of "Lizenz", "DL-DE" or "Datenlizenz".
//     Checked across every XML part in the zip this session: all four counts are 0.
//   - Its Impressum sheet grants only, verbatim: "Vervielfaeltigung und Verbreitung, auch
//     auszugsweise, mit Quellenangabe gestattet." (Reproduction and distribution, including
//     of extracts, permitted with attribution.) That is narrower than DL-DE BY 2.0 — it says
//     nothing about modification or commercial use — but it does not contradict it, and the
//     same sheet points the reader onward: "Fuer die weitere Verwendung der Daten finden Sie
//     Copyright-Informationen im Impressum."
// The wider, data-scoped, variant-identified grant on the Open Data page is the one relied
// on, because it is the one Destatis makes about its statistical data as such.
//
// SPDX has no identifier for DL-DE BY 2.0, so licenceId is a LicenseRef.
//
// ---------------------------------------------------------------------------------------
// LICENCE — ITALY. CC BY 4.0, but NOT from the page the brief pointed at.
// ---------------------------------------------------------------------------------------
// The brief said to confirm CC BY 4.0 at https://www.istat.it/en/legal-notice/. It is there,
// verbatim, read 2026-09-20:
//
//   "Unless otherwise stated, content on this website is licensed under a Creative Commons
//    License - Attribution - 4.0 ."
//   "Share - copy and redistribute the material in any medium or format for any purpose,
//    even commercially"
//   "Adapt - remix, transform, and build upon the material for any purpose, even
//    commercially"
//
// But read the scope: "content on THIS WEBSITE". The data used here does not come from that
// website. It comes from esploradati.istat.it, a different host running the IstatData
// dissemination system. Leaning on the legal notice alone would be the exact failure this
// repository has shipped twice — a website-content licence quoted over a data endpoint it
// does not name.
//
// The sentence that actually covers the endpoint is on ISTAT's Italian Open Data page,
// https://www.istat.it/dati/open-data/, read 2026-09-20, verbatim:
//
//   "Tutti i dati pubblicati da Istat sul proprio sito web e sulle banche dati di diffusione
//    vengono rilasciati sotto licenza Creative Commons versione 4.0 Deed. E' possibile
//    quindi riprodurre, distribuire, trasmettere e adattare liberamente dati e analisi
//    dell'Istituto nazionale di statistica, anche a scopi commerciali, a condizione che
//    venga citata la fonte."
//
// ("All data published by Istat on its own website AND ON THE DISSEMINATION DATABASES are
// released under the Creative Commons 4.0 licence. It is therefore possible to reproduce,
// distribute, transmit and freely adapt Istat's data and analyses, INCLUDING FOR COMMERCIAL
// PURPOSES, provided the source is cited.") "le banche dati di diffusione" is IstatData, and
// https://www.istat.it/en/methods-and-tools/sdmx-web-service/ names
// https://esploradati.istat.it/SDMXWS as its machine-to-machine face. That is what closes
// the gap between the website and the endpoint, and it is why commercialUseClear is true.
//
// One inconsistency in ISTAT's own pages, recorded because a reviewer will find it: the
// ENGLISH open-data page, https://www.istat.it/en/data/open-data/, still says "Creative
// Commons License - Attribution - 3.0" while the Italian page and both legal notices say
// 4.0. Both versions grant commercial reuse, so the conclusion is unchanged, but the version
// number is not consistent across ISTAT's own site and should not be quoted from the English
// open-data page.
//
// ---------------------------------------------------------------------------------------
// ISTAT RATE LIMIT — 5 QUERIES PER MINUTE PER IP, AND A 1-2 DAY BLOCK PAST IT
// ---------------------------------------------------------------------------------------
// Confirmed from the producer rather than from the brief, at
// https://www.istat.it/en/methods-and-tools/sdmx-web-service/, verbatim:
//
//   "To prevent SDMX web service overloading, a limit of 5 queries per minute has been set
//    for each IP. Once this limit is exceeded, an access block lasting between 1 and 2 days
//    is activated."
//
// Losing this IP for two days would block every other agent working in this checkout, so:
// this adapter makes exactly TWO ISTAT requests per refresh, sleeps ISTAT_GAP_MS between
// them, is cache-first with a 24-hour TTL so repeated builds make none at all, and NEVER
// retries. An HTTP 429 is fatal and says so, because retrying is the specific behaviour that
// converts a throttle into a two-day outage.
//
// /dataflow/IT1/DCIS_MIGRAZIONI/latest answers 404 — that is the datastructure id, not the
// dataflow id. Not probed this session precisely because probing costs requests; the two
// dataflow ids below were called directly and both answered 200 with data.
//
// ---------------------------------------------------------------------------------------
// TRAPS IN THE GERMAN WORKBOOK, EVERY ONE OF WHICH FAILS SILENTLY
// ---------------------------------------------------------------------------------------
//  1. THE FILE ID ENCODES THE YEAR. The download is
//     .../statistischer-bericht-wanderungen-2010120257005.xlsx?__blob=publicationFile and
//     that digit string is the Artikelnummer, not a "latest" pointer: the topic page carries
//     2010120237005, 2010120247005 and 2010120257005 side by side, which are reporting years
//     2023, 2024 and 2025. Hardcoding one pins the app to a year forever. This adapter
//     discovers every such link on the topic page, takes the highest Artikelnummer, and then
//     proves the year three ways — the workbook's dc:title, its Impressum Artikelnummer, and
//     the Jahr column of the data itself must all agree — because "highest number wins" is a
//     guess about a numbering scheme and the three cross-checks are facts.
//  2. THE MACHINE-READABLE SHEET IS THE ONE WITH ITS WARNINGS REMOVED. The workbook ships
//     each table twice, as a formatted layout sheet (12711-05) and as a flat sheet
//     (csv-12711-05). Its own explanation sheet says, verbatim: "Fussnoten oder weitere
//     Erlaeuterungen sind in den CSV-Tabellen nicht enthalten." So an adapter that reads only
//     the convenient sheet loses every caveat and cannot tell. This one reads the footnotes
//     off the formatted sibling and asserts they are still there.
//  3. THE TABLE DOES NOT ADD UP, ON PURPOSE. Male + female misses the published total for 138
//     of the 209 partner entities — 175 of the 418 partner-direction cells, which is the
//     figure load() measures and puts in the layer note — and the country rows miss their
//     continent aggregate by a few people too. That is not a parser bug: footnote * of table
//     12711-05 says, verbatim,
//     "Zur Geheimhaltung von Einzelangaben wurde die Cell-Key-Methode eingesetzt. Dabei
//     wurden einige Fallzahlen leicht veraendert. Daher addieren sich die ausgewiesenen
//     Einzelwerte nicht immer zu den entsprechenden Summen." The published cells are
//     individually perturbed for disclosure control. Consequence for this adapter: a partner
//     total must be read from its own row and never reconstructed by summing, and the
//     published aggregates must never be rescaled to match the parts. The size of the
//     perturbation is measured in load() and put in the layer note.
//  4. 627 DATA ROWS, 210 DISTINCT PARTNER LABELS, AND 210 x 3 = 630. The brief flagged this
//     as an arithmetic impossibility and asked which figure is right. Both are: there are 210
//     distinct label STRINGS but only 209 partner ENTITIES, because the unknown-origin
//     partner is spelled two different ways in the same column — "ohne Angabe/ungeklaert" on
//     its Insgesamt row and "ohneAngabe/ungeklaert", with the space missing, on its Maennlich
//     and Weiblich rows. 209 x 3 = 627 exactly. The missing space is not a one-off: the flat
//     sheet is littered with them ("KapVerde", "ElSalvador", "St.Lucia", "VereinigteStaaten,
//     auch USA", "Kongo, DemokratischeRepublik", "Korea, DemokratischeVolksrepublik",
//     "Coete dIvoire") and with mojibake the formatted sheet does not have ("Sao Tome" is
//     written with a circumflex, "Palaestinaensische" with an a-umlaut in place of the e).
//     The lookup below is therefore whitespace- and diacritic-insensitive, which resolves the
//     two spellings to one entity mechanically instead of by hand.
//  5. "EU-Staaten (EU27)" SITS IN THE SAME COLUMN AS THE COUNTRIES, between Europa and
//     Belgien, and so do Nicht-EU-Staaten, Afrika, Amerika, Asien, Australien und Ozeanien,
//     Ausssereuropaeisches Ausland and Insgesamt. Excluding names one happens to recognise
//     would silently admit the next one. This adapter uses an explicit allow-list of 198
//     country labels and an explicit list of the 12 non-country label strings, and throws on
//     anything in neither, so a new partner cannot be dropped in silence.
//
// ---------------------------------------------------------------------------------------
// TRAPS IN THE ITALIAN RESPONSE
// ---------------------------------------------------------------------------------------
//  6. THE PARTNER AXIS CARRIES EIGHT NESTED AGGREGATES. X1033 World, X1013 Europe, X1016
//     Africa, X1019 America, X1022 Asia, X1026 Oceania, X1038 EU27, X1039 Extra-EU27 — and
//     they nest, the way CBS's do: Europe = EU27 + Extra-EU27, World = the five continents.
//     Summing the axis naively returns three times the truth. Both identities are asserted
//     against the live numbers on every run rather than trusted.
//  7. TWO CODES THAT LOOK LIKE AGGREGATES ARE COUNTRIES. X95 is Kosovo and XSD_S is South
//     Sudan — read off a labelled response this session, not guessed. A shape rule that keeps
//     only two-letter codes would drop both. They are mapped explicitly to XKX and SSD.
//  8. THE RESPONSE IS NOT ONE FIGURE PER COUNTRY. Every partner appears up to 45 times, once
//     per CITIZENSHIP x SEX x AGE cell, and CITIZENSHIP/SEX/AGE each carry their own TOTAL
//     member. The headline is the single cell TOTAL/9/TOTAL; summing the rows for a country
//     would multiply it. The table is also sparse — 7,522 of a possible 8,865 inbound cells
//     are present — so small cells are absent rather than zero, and absent is not zero.
//  9. SDMX-CSV IS ONLY SAFE TO SPLIT ON COMMAS WHILE THE LABELS ARE ABSENT. With
//     Accept: application/vnd.sdmx.data+csv the body has zero quote characters and a uniform
//     27 fields per line. Ask for labels=both and country names like "Bolivia, Plurinational
//     State of" arrive quoted, and a naive split shreds every such row without erroring. This
//     adapter asks for the unlabelled form and asserts both properties before splitting.
// 10. NODE'S OWN fetch() GETS A 500 FROM esploradati.istat.it. On the exact URL and Accept
//     header below, node 22's fetch answered HTTP 500 and curl answered 200 with a 705 KB
//     body sixty seconds later, from the same machine. Same family as the imf.org trap the
//     contract already records. See istatFetch() for why this does NOT become a
//     try-fetch-then-curl fallback the way fetch-concordance.mjs does it.
// 11. THE SDMX-CSV BODY IS CRLF-TERMINATED, so a split on "\n" leaves a carriage return
//     glued to the last field of every row. Today that field is UNIT_MULT and it is always
//     empty, so the only symptom is a header comparison that fails on an invisible character;
//     the day ISTAT populates that column it would become a wrong number instead.
// 12. ISTAT USES GB AND GR. The shared _iso3.mjs table encodes Eurostat's two deviations from
//     the standard, EL for Greece and UK for the United Kingdom, and consequently has no
//     entry for the standard codes. ISTAT uses the standard ones. The overlay below adds them
//     and asserts ISTAT never uses EL or UK, so Eurostat's deviations cannot leak in here.
import { mkdir, readFile, writeFile, stat, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { inflateRawSync } from 'node:zlib';
import { ISO3, checkIso3 } from './_iso3.mjs';

const run = promisify(execFile);

export const meta = {
  id: 'destatis-istat',
  // Two producers in one adapter, on purpose — see the header. The authoritative
  // producer/licence for anything the UI renders is on each layer's own vintage.
  producer: 'Statistisches Bundesamt (Destatis) and Istituto nazionale di statistica (ISTAT)',
  licenceId: 'LicenseRef-DL-DE-BY-2.0 AND CC-BY-4.0',
  commercialUseClear: true,
};

const CACHE = '.cache/layers/destatis-istat';

/* ======================================================================================
 * Germany
 * ==================================================================================== */

// destatis.de is listed in the contract's traps as needing a browser User-Agent. Worth being
// precise about what was observed today: through this environment's proxy the topic page
// answered 200 with no UA at all. The header is kept because the contract records a machine
// on which it was required and sending it costs nothing, not because it was proven necessary
// here. `?__blob=publicationFile` genuinely is mandatory — without it the CMS serves a page,
// not the file — and the discovered hrefs already carry it.
const BROWSER_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

// The topic landing page, not a "Publikationen" page: the Publikationen path 404s and this
// one carries all three Statistischer Bericht workbooks in its download list.
const DESTATIS_INDEX =
  'https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Wanderungen/_inhalt.html';
const DESTATIS_ORIGIN = 'https://www.destatis.de';

const CSV_SHEET = 'csv-12711-05';       // flat sheet: data, no footnotes
const LAYOUT_SHEET = '12711-05';        // formatted sibling: footnotes, no flat data

// The nine column headers of csv-12711-05, in order, exactly as read off row 1 this session.
// Asserting the whole header rather than indexing blind is what stops a column being inserted
// upstream and shifting every value one place to the left without any error.
const CSV_HEADER = [
  'Statistik_Code', 'Statistik_Label', 'Gebiet', 'Herkunfts_Ziellaender', 'Geschlecht',
  'Jahr', 'Zuzuege_aus_dem_Ausland', 'Fortzuege_in_das_Ausland', 'Wanderungssaldo_Ausland',
];

const SEX_TOTAL = 'Insgesamt';
const SEX_MEMBERS = ['Insgesamt', 'Männlich', 'Weiblich'];

/**
 * Collapse a label to a lookup key.
 *
 * Whitespace goes because the flat sheet drops spaces at random ("KapVerde", and the
 * unknown-origin partner spelled both ways). Diacritics go because the same sheet mangles
 * them ("Sao Tome" with a circumflex where the formatted sheet has a tilde). Punctuation goes
 * because "St.Lucia" and "St. Lucia" are the same place. None of this can merge two real
 * partners: the assertion in destatisEntities() checks that the only collision among the
 * file's own labels is the unknown-origin pair.
 */
const fold = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

/**
 * The allow-list: 198 partner labels to ISO-3166-1 alpha-3.
 *
 * Spelled exactly as the flat sheet spells them, mojibake and missing spaces included, so
 * that what is written here can be diffed against what was observed. `fold` means a future
 * Destatis release that fixes a typo still matches. Nothing here was taken from a
 * nomenclature document: every label was read off csv-12711-05 this session, and every
 * alpha-3 is checked against scripts/m49.json in load().
 *
 * Three entries are wider than their code and the layer notes say so:
 *   'China (inkl. Hongkong und Macau)' -> CHN also contains Hong Kong and Macau, which every
 *       other layer in this app reports separately as HKG and MAC.
 *   'Sudan (einschl. ehem. Sudan)'     -> SDN also contains the pre-2011 Sudan, i.e. some of
 *       what is now South Sudan, which is listed separately as 'Suedsudan'.
 *   'Vereinigtes Koenigreich'          -> GBR on Destatis's usual national definition.
 * Two are marked in the formatted sheet with footnote 1, "Von Deutschland nicht als Staaten
 * anerkannte Gebiete": Taiwan and Palaestinensische Gebiete. Germany not recognising a
 * territory as a state does not stop it having an ISO 3166-1 code, and places.json is keyed
 * by that code, so both are mapped. Kosovo is NOT footnoted and takes XKX, the user-assigned
 * code _iso3.mjs already documents as having no M49 entry.
 */
const DE_NAME_TO_ISO3 = {
  // --- EU27 minus Germany (26) ---
  'Belgien': 'BEL', 'Bulgarien': 'BGR', 'Dänemark': 'DNK', 'Estland': 'EST',
  'Finnland': 'FIN', 'Frankreich': 'FRA', 'Griechenland': 'GRC', 'Irland': 'IRL',
  'Italien': 'ITA', 'Kroatien': 'HRV', 'Lettland': 'LVA', 'Litauen': 'LTU',
  'Luxemburg': 'LUX', 'Malta': 'MLT', 'Niederlande': 'NLD', 'Österreich': 'AUT',
  'Polen': 'POL', 'Portugal': 'PRT', 'Rumänien': 'ROU', 'Schweden': 'SWE',
  'Slowakei': 'SVK', 'Slowenien': 'SVN', 'Spanien': 'ESP', 'Tschechische Republik': 'CZE',
  'Ungarn': 'HUN', 'Zypern': 'CYP',
  // --- non-EU Europe (20) ---
  'Albanien': 'ALB', 'Andorra': 'AND', 'Belarus': 'BLR', 'Bosnien und Herzegowina': 'BIH',
  'Island': 'ISL', 'Kosovo': 'XKX', 'Liechtenstein': 'LIE', 'Moldau, Republik': 'MDA',
  'Monaco': 'MCO', 'Montenegro': 'MNE', 'Nordmazedonien': 'MKD', 'Norwegen': 'NOR',
  'Russische Föderation': 'RUS', 'San Marino': 'SMR', 'Schweiz': 'CHE', 'Serbien': 'SRB',
  'Türkei': 'TUR', 'Ukraine': 'UKR', 'Vatikanstadt': 'VAT', 'Vereinigtes Königreich': 'GBR',
  // --- Africa (54) ---
  'Ägypten': 'EGY', 'Algerien': 'DZA', 'Angola': 'AGO', 'Äquatorialguinea': 'GNQ',
  'Äthiopien': 'ETH', 'Benin': 'BEN', 'Botsuana': 'BWA', 'Burkina Faso': 'BFA',
  'Burundi': 'BDI', 'Côte dIvoire': 'CIV', 'Dschibuti': 'DJI', 'Eritrea': 'ERI',
  'Eswatini': 'SWZ', 'Gabun': 'GAB', 'Gambia': 'GMB', 'Ghana': 'GHA', 'Guinea': 'GIN',
  'Guinea-Bissau': 'GNB', 'Kamerun': 'CMR', 'KapVerde': 'CPV', 'Kenia': 'KEN',
  'Komoren': 'COM', 'Kongo, Republik': 'COG', 'Kongo, DemokratischeRepublik': 'COD',
  'Lesotho': 'LSO', 'Liberia': 'LBR', 'Libyen': 'LBY', 'Madagaskar': 'MDG',
  'Malawi': 'MWI', 'Mali': 'MLI', 'Marokko': 'MAR', 'Mauretanien': 'MRT',
  'Mauritius': 'MUS', 'Mosambik': 'MOZ', 'Namibia': 'NAM', 'Niger': 'NER',
  'Nigeria': 'NGA', 'Ruanda': 'RWA', 'Sambia': 'ZMB', 'Sâo Tomé und Principe': 'STP',
  'Senegal': 'SEN', 'Seychellen': 'SYC', 'Sierra Leone': 'SLE', 'Simbabwe': 'ZWE',
  'Somalia': 'SOM', 'Südafrika': 'ZAF', 'Sudan (einschl. ehem. Sudan)': 'SDN',
  'Südsudan': 'SSD', 'Tansania': 'TZA', 'Togo': 'TGO', 'Tschad': 'TCD', 'Tunesien': 'TUN',
  'Uganda': 'UGA', 'Zentralafrikanische Republik': 'CAF',
  // --- Americas (35) ---
  'Antigua und Barbuda': 'ATG', 'Argentinien': 'ARG', 'Bahamas': 'BHS', 'Barbados': 'BRB',
  'Belize': 'BLZ', 'Bolivien': 'BOL', 'Brasilien': 'BRA', 'Chile': 'CHL',
  'Costa Rica': 'CRI', 'Dominica': 'DMA', 'Dominikanische Republik': 'DOM',
  'Ecuador': 'ECU', 'ElSalvador': 'SLV', 'Grenada': 'GRD', 'Guatemala': 'GTM',
  'Guyana': 'GUY', 'Haiti': 'HTI', 'Honduras': 'HND', 'Jamaika': 'JAM', 'Kanada': 'CAN',
  'Kolumbien': 'COL', 'Kuba': 'CUB', 'Mexiko': 'MEX', 'Nicaragua': 'NIC', 'Panama': 'PAN',
  'Paraguay': 'PRY', 'Peru': 'PER', 'St. Kitts und Nevis': 'KNA', 'St.Lucia': 'LCA',
  'St.Vincent und die Grenadinen': 'VCT', 'Suriname': 'SUR', 'Trinidad und Tobago': 'TTO',
  'Uruguay': 'URY', 'Venezuela': 'VEN', 'VereinigteStaaten, auch USA': 'USA',
  // --- Asia (47) ---
  'Afghanistan': 'AFG', 'Armenien': 'ARM', 'Aserbaidschan': 'AZE', 'Bahrain': 'BHR',
  'Bangladesch': 'BGD', 'Bhutan': 'BTN', 'Brunei Darussalam': 'BRN',
  'China (inkl. Hongkong und Macau)': 'CHN', 'Georgien': 'GEO', 'Indien': 'IND',
  'Indonesien': 'IDN', 'Irak': 'IRQ', 'Iran': 'IRN', 'Israel': 'ISR', 'Japan': 'JPN',
  'Jemen': 'YEM', 'Jordanien': 'JOR', 'Kambodscha': 'KHM', 'Kasachstan': 'KAZ',
  'Katar': 'QAT', 'Kirgisistan': 'KGZ', 'Korea, DemokratischeVolksrepublik': 'PRK',
  'Korea, Republik': 'KOR', 'Kuwait': 'KWT', 'Laos': 'LAO', 'Libanon': 'LBN',
  'Malaysia': 'MYS', 'Malediven': 'MDV', 'Mongolei': 'MNG', 'Myanmar': 'MMR',
  'Nepal': 'NPL', 'Oman': 'OMN', 'Pakistan': 'PAK',
  // Both spellings are listed on purpose: the flat sheet writes an a-umlaut where the
  // formatted sheet writes an e, and `fold` does not strip the difference.
  'Palästinänsische Gebiete': 'PSE', 'Palästinensische Gebiete': 'PSE',
  'Philippinen': 'PHL', 'Saudi-Arabien': 'SAU', 'Singapur': 'SGP', 'Sri Lanka': 'LKA',
  'Syrien': 'SYR', 'Tadschikistan': 'TJK', 'Taiwan': 'TWN', 'Thailand': 'THA',
  'Timor-Leste': 'TLS', 'Turkmenistan': 'TKM', 'Usbekistan': 'UZB',
  'Vereinigte Arabische Emirate': 'ARE', 'Vietnam': 'VNM',
  // --- Oceania (16) ---
  'Australien': 'AUS', 'Cookinseln': 'COK', 'Fidschi': 'FJI', 'Kiribati': 'KIR',
  'Marshallinseln': 'MHL', 'Mikronesien': 'FSM', 'Nauru': 'NRU', 'Neuseeland': 'NZL',
  'Niue': 'NIU', 'Palau': 'PLW', 'Papua-Neuguinea': 'PNG', 'Salomonen': 'SLB',
  'Samoa': 'WSM', 'Tonga': 'TON', 'Tuvalu': 'TUV', 'Vanuatu': 'VUT',
};

/**
 * Every label in the partner column that is NOT a country, listed rather than pattern-matched.
 *
 * Both spellings of the unknown-origin partner appear because both are in the file; they fold
 * to one key, which is the point. 'unbekanntes Ausland' and 'ohne Angabe/ungeklaert' are
 * different things — the first is a move whose foreign country was not identified, the second
 * a move with no origin/destination area recorded at all — and both are excluded from the
 * country layers because neither is a place. Their size is measured and put in the note,
 * because for departures it is very large.
 */
const DE_NON_COUNTRY = [
  'Insgesamt', 'Europa', 'EU-Staaten (EU27)', 'Nicht-EU-Staaten', 'Außereuropäisches Ausland',
  'Afrika', 'Amerika', 'Asien', 'Australien und Ozeanien',
  'unbekanntes Ausland', 'ohne Angabe/ungeklärt', 'ohneAngabe/ungeklärt',
];

/**
 * Both lists, folded once at load time, with a collision check on the way.
 *
 * Two labels folding together here would be a mistake in THIS file rather than in Destatis's,
 * and it would silently give one country another's number, so it is fatal. The Palestine pair
 * is the one deliberate many-to-one and it is allowed through by value.
 */
const DE_ALLOW = new Map();
for (const [name, iso] of Object.entries(DE_NAME_TO_ISO3)) {
  const k = fold(name);
  const prev = DE_ALLOW.get(k);
  if (prev && prev !== iso) throw new Error(`the Destatis allow-list folds two labels to "${k}" with different codes (${prev} and ${iso})`);
  DE_ALLOW.set(k, iso);
}
const DE_DROP = new Set(DE_NON_COUNTRY.map(fold));
for (const k of DE_DROP) if (DE_ALLOW.has(k)) throw new Error(`"${k}" is in both the Destatis allow-list and the non-country list`);

// Footnote * of table 12711-05, which the flat sheet does not carry. Asserted present on the
// formatted sibling every run: if Destatis ever stops perturbing these cells, or stops saying
// that it does, the note this adapter writes would become false and it should fail instead.
const CELL_KEY_MARKER = 'Cell-Key-Methode';

/* ======================================================================================
 * Italy
 * ==================================================================================== */

const ISTAT_BASE = 'https://esploradati.istat.it/SDMXWS/rest/data';
// Dataflow 3 is iscrizioni (registrations from abroad), dataflow 6 is cancellazioni
// (deregistrations for abroad). Both called live this session; both returned 200 with data.
const ISTAT_INBOUND = 'IT1,28_185_DF_DCIS_MIGRAZIONI_3,1.0';
const ISTAT_OUTBOUND = 'IT1,28_185_DF_DCIS_MIGRAZIONI_6,1.0';
const ISTAT_PERIOD = '2025';
const ISTAT_ACCEPT = 'application/vnd.sdmx.data+csv';

// Two requests per refresh against a five-per-minute limit is already far inside it. The gap
// exists for the case this adapter is run beside another that also touches ISTAT, or twice in
// quick succession by a human, because the penalty is not a 429 to retry but a two-day block.
const ISTAT_GAP_MS = 20_000;
// Cache TTL, shared by both producers. Deliberately long on ISTAT's account: the underlying
// tables are annual, so nothing is gained by asking again today and everything is lost by
// asking too often. Delete .cache/layers/destatis-istat/ to force a refresh.
const TTL_MS = 24 * 60 * 60 * 1000;

const ISTAT_COLUMNS = [
  'DATAFLOW', 'FREQ', 'REF_AREA', 'DATA_TYPE', 'CHANGE_OF_RESIDENCE', 'CITIZENSHIP', 'SEX',
  'AGE', 'TERRITORY_NEXT_RESID', 'COUNTRY_PREV_RESID', 'COUNTRY_NEXT_RESID', 'TIME_PERIOD',
  'OBS_VALUE', 'OBS_STATUS', 'NOTE_DS', 'NOTE_REF_AREA', 'NOTE_DATA_TYPE',
  'NOTE_CHANGE_OF_RESIDENCE', 'NOTE_CITIZENSHIP', 'NOTE_SEX', 'NOTE_AGE',
  'NOTE_TERRITORY_NEXT_RESID', 'NOTE_COUNTRY_PREV_RESID', 'NOTE_COUNTRY_NEXT_RESID',
  'BASE_PER', 'UNIT_MEAS', 'UNIT_MULT',
];

// The headline cell. Each of these three dimensions has its own total member, and picking the
// three totals is the only way to get one figure per country: summing the axis multiplies it.
const ISTAT_HEADLINE = { CITIZENSHIP: 'TOTAL', SEX: '9', AGE: 'TOTAL' };

// Read off a labels=both response this session, not from documentation. The nesting is
// asserted arithmetically in istatHeadline() rather than trusted.
const ISTAT_AGGREGATES = {
  X1033: 'World', X1013: 'Europe', X1016: 'Africa', X1019: 'America', X1022: 'Asia',
  X1026: 'Oceania', X1038: 'EU27', X1039: 'Extra-EU27',
};
const ISTAT_CONTINENTS = ['X1013', 'X1016', 'X1019', 'X1022', 'X1026'];
const ISTAT_WORLD = 'X1033';

// Two partner codes that look like aggregates and are not. Labels quoted verbatim from the
// labelled response: "X95: Kosovo" and "XSD_S: South Sudan (Repubblic of)" (ISTAT's typo).
const ISTAT_NON_ISO2_COUNTRIES = { X95: 'XKX', XSD_S: 'SSD' };

/** ISTAT uses standard alpha-2, so it needs the two codes the Eurostat table cannot hold. */
const ISTAT_OVERLAY = { GB: 'GBR', GR: 'GRC' };
/** ...and must never be seen using Eurostat's deviations, or this overlay would be hiding one. */
const EUROSTAT_ONLY = ['EL', 'UK'];

/* ======================================================================================
 * plumbing
 * ==================================================================================== */

const say = (s) => console.log(`destatis-istat: ${s}`);

/** Cache a downloaded body, and fall back to the cached copy only when the network fails. */
async function cached(name, fetcher, { ttlMs = 0, binary = false } = {}) {
  const file = `${CACHE}/${name}`;
  if (ttlMs > 0) {
    try {
      const st = await stat(file);
      const age = Date.now() - st.mtimeMs;
      if (age < ttlMs) {
        say(`${name}: reusing the cached copy, ${(age / 3600000).toFixed(1)} h old (TTL ${(ttlMs / 3600000).toFixed(0)} h)`);
        return binary ? await readFile(file) : await readFile(file, 'utf8');
      }
    } catch { /* no cache yet */ }
  }
  try {
    const body = await fetcher();
    await mkdir(CACHE, { recursive: true });
    await writeFile(file, body);
    return body;
  } catch (e) {
    try {
      const body = binary ? await readFile(file) : await readFile(file, 'utf8');
      console.warn(`destatis-istat: ${name} unreachable (${e.message}); falling back to the cached copy at ${file}`);
      return body;
    } catch {
      throw new Error(`${name}: ${e.message}, and no cached copy at ${file}`);
    }
  }
}

// ------------------------------------------------------------------ xlsx

/**
 * Just enough of the ZIP container to read an xlsx, on node's own zlib.
 *
 * Deliberately not a library: package.json declares no zip dependency and rule 10 of the
 * contract is that the snapshot rebuilds from a clean clone. This workbook uses both deflate
 * and stored entries, so both are implemented and anything else is an error rather than a
 * silently empty part.
 */
function unzip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 22 - 0xffff; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('no ZIP end-of-central-directory record: the download is not an xlsx');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = new Map();
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error(`ZIP central directory entry ${i} has a bad signature`);
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const cmtLen = buf.readUInt16LE(p + 32);
    const lho = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    if (buf.readUInt32LE(lho) !== 0x04034b50) throw new Error(`ZIP local header for ${name} has a bad signature`);
    // The local header's own name/extra lengths are authoritative; the central directory's
    // extra field is a different field of a different length and using it lands mid-stream.
    const start = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28);
    const raw = buf.subarray(start, start + csize);
    if (method === 8) out.set(name, inflateRawSync(raw));
    else if (method === 0) out.set(name, Buffer.from(raw));
    else throw new Error(`ZIP entry ${name} uses compression method ${method}, which this reader does not implement`);
    p += 46 + nameLen + extraLen + cmtLen;
  }
  return out;
}

const XML_ENTITY = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const unescapeXml = (s) => s.replace(/&(?:#(\d+)|#x([0-9a-fA-F]+)|(amp|lt|gt|quot|apos));/g,
  (_, dec, hex, name) => (dec ? String.fromCodePoint(+dec) : hex ? String.fromCodePoint(parseInt(hex, 16)) : XML_ENTITY[name]));

/**
 * The shared-string table.
 *
 * IRCC's workbook has no sharedStrings part at all and stores every cell as an inline string;
 * this one is the opposite and every label is a shared-string index. A reader written for one
 * returns an empty sheet on the other without erroring, so the part's presence is asserted
 * rather than assumed. Runs inside an <si> are concatenated because a footnote marker is
 * stored as a separate run.
 */
function sharedStrings(parts) {
  const xml = parts.get('xl/sharedStrings.xml');
  if (!xml) throw new Error('xl/sharedStrings.xml is absent: this workbook stores labels somewhere this reader does not look (IRCC-style inline strings?)');
  const text = xml.toString('utf8');
  const out = [];
  for (const m of text.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    let s = '';
    for (const t of m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) s += unescapeXml(t[1]);
    out.push(s);
  }
  return out;
}

/** Sheet name to part path. By NAME: sheet ORDER is not a contract and this workbook has 35. */
function sheetPaths(parts) {
  const wb = parts.get('xl/workbook.xml')?.toString('utf8');
  const rels = parts.get('xl/_rels/workbook.xml.rels')?.toString('utf8');
  if (!wb || !rels) throw new Error('xl/workbook.xml or its rels part is missing');
  const target = new Map();
  for (const m of rels.matchAll(/<Relationship\b([^>]*)\/>/g)) {
    const id = /Id="([^"]+)"/.exec(m[1]);
    const t = /Target="([^"]+)"/.exec(m[1]);
    if (id && t) target.set(id[1], `xl/${t[1].replace(/^\//, '')}`);
  }
  const out = new Map();
  for (const m of wb.matchAll(/<sheet\b([^>]*)\/>/g)) {
    const name = /name="([^"]+)"/.exec(m[1]);
    const rid = /r:id="([^"]+)"/.exec(m[1]);
    if (name && rid && target.has(rid[1])) out.set(unescapeXml(name[1]), target.get(rid[1]));
  }
  return out;
}

const ROW_RE = /<row\b[^>]*\br="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
const CELL_RE = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;

/** rowNumber -> Map(columnLetters -> text). Shared strings resolved, numerics left as text. */
function readSheet(xml, shared) {
  const rows = new Map();
  let cells = 0;
  ROW_RE.lastIndex = 0;
  for (let m; (m = ROW_RE.exec(xml));) {
    const row = new Map();
    CELL_RE.lastIndex = 0;
    for (let c; (c = CELL_RE.exec(m[2]));) {
      const ref = /\br="([A-Z]+)\d+"/.exec(c[1]);
      if (!ref) continue;
      const inner = c[2] ?? '';
      const type = /\bt="([a-zA-Z]+)"/.exec(c[1])?.[1];
      const v = /<v>([\s\S]*?)<\/v>/.exec(inner);
      let value = null;
      if (type === 's') {
        if (v) {
          const s = shared[+v[1]];
          if (s === undefined) throw new Error(`shared-string index ${v[1]} is out of range (${shared.length} entries)`);
          value = s;
        }
      } else if (type === 'inlineStr') {
        value = unescapeXml(/<t[^>]*>([\s\S]*?)<\/t>/.exec(inner)?.[1] ?? '');
      } else if (v) {
        value = unescapeXml(v[1]);
      }
      if (value != null && value !== '') cells++;
      row.set(ref[1], value);
    }
    rows.set(+m[1], row);
  }
  return { rows, cells };
}

/** Every string a sheet renders, for asserting a footnote is still there. */
function sheetText(xml, shared) {
  const { rows } = readSheet(xml, shared);
  const bits = [];
  for (const row of rows.values()) for (const v of row.values()) if (v) bits.push(v);
  return bits.join('\n');
}

// ------------------------------------------------------------------ Destatis: discovery

/**
 * Find the newest Statistischer Bericht workbook from the topic page.
 *
 * The Artikelnummer in the filename encodes the reporting year, so "the one with the biggest
 * number" is a guess about a numbering scheme. It is only used to CHOOSE; the year is then
 * proved from inside the file three independent ways in destatisWorkbook().
 */
async function destatisDiscover() {
  const html = await cached('destatis-index.html', async () => {
    const r = await fetch(DESTATIS_INDEX, { headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const t = await r.text();
    // A CMS error page answers 200 too. The one thing that must be on this page is the link
    // this adapter came for, so that is what is checked, not the status code.
    if (!/statistischer-bericht-wanderungen-\d+\.xlsx/.test(t)) {
      throw new Error(`no statistischer-bericht-wanderungen link on ${DESTATIS_INDEX} (${t.length} bytes) — the page moved or a block page answered 200`);
    }
    return t;
  }, { ttlMs: TTL_MS });

  const found = new Map();                       // article number -> absolute URL
  for (const m of html.matchAll(/href="([^"]*statistischer-bericht-wanderungen-(\d+)\.xlsx[^"]*)"/g)) {
    let href = m[1].replace(/&amp;/g, '&');
    if (!href.startsWith('http')) href = DESTATIS_ORIGIN + (href.startsWith('/') ? href : `/${href}`);
    // Without __blob=publicationFile the CMS serves a landing page rather than the file. The
    // discovered hrefs carry it; appending it if a future template drops it costs nothing.
    if (!href.includes('__blob=publicationFile')) href += (href.includes('?') ? '&' : '?') + '__blob=publicationFile';
    found.set(m[2], href);
  }
  if (!found.size) throw new Error('the topic page matched the workbook pattern but no href could be extracted');
  const articles = [...found.keys()].sort();
  const newest = articles[articles.length - 1];
  say(`Destatis: ${articles.length} Statistischer Bericht workbook(s) on the topic page — Artikelnummer ${articles.join(', ')}; taking ${newest}`);
  return { article: newest, url: found.get(newest) };
}

/** Download and open the workbook, and prove which reporting year it actually is. */
async function destatisWorkbook() {
  const { article, url } = await destatisDiscover();
  const buf = await cached('destatis-wanderungen.xlsx', async () => {
    const r = await fetch(url, { headers: { 'User-Agent': BROWSER_UA } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const b = Buffer.from(await r.arrayBuffer());
    // An IIS error page or a WAF challenge answers 200 with a small HTML body just as
    // happily as the file does, and the zip reader's failure on one would be cryptic.
    if (b.length < 200_000) throw new Error(`${b.length} bytes, expected at least 200,000 — an error page also answers 200`);
    if (b.readUInt32LE(0) !== 0x04034b50) throw new Error('the body does not begin with a ZIP local-file header, so it is not an xlsx');
    return b;
  }, { ttlMs: TTL_MS, binary: true });

  const parts = unzip(buf);
  const shared = sharedStrings(parts);
  const sheets = sheetPaths(parts);
  say(`Destatis: ${(buf.length / 1024).toFixed(0)} KB, ${parts.size} zip entries, ${sheets.size} sheets, ${shared.length} shared strings`);

  // Proof 1: the document title.
  const core = parts.get('docProps/core.xml')?.toString('utf8') ?? '';
  const title = unescapeXml(/<dc:title>([\s\S]*?)<\/dc:title>/.exec(core)?.[1] ?? '');
  const titleYear = /(\d{4})\s*$/.exec(title)?.[1];
  if (!titleYear) throw new Error(`dc:title "${title}" does not end in a year, so the reporting year cannot be proved from it`);

  // Proof 2: the Artikelnummer printed inside the Impressum must be the one in the URL.
  const impressum = sheets.get('Impressum');
  const impressumText = impressum ? sheetText(parts.get(impressum).toString('utf8'), shared) : '';
  const stated = /Artikelnummer:\s*(\d+)/.exec(impressumText)?.[1];
  if (stated !== article) {
    throw new Error(`the URL says Artikelnummer ${article} but the workbook's Impressum says ${stated ?? 'nothing'} — the download is not the file that was chosen`);
  }

  const published = /Erschienen am\s*([^\n]+)/.exec(sheetText(parts.get(sheets.get('Titel')).toString('utf8'), shared))?.[1]?.trim();
  say(`Destatis: "${title}", Artikelnummer ${article}, ${published ? `published ${published}` : 'no publication date on the title sheet'}`);
  return { parts, shared, sheets, titleYear, title, article, url, published };
}

// ------------------------------------------------------------------ Destatis: the table

/**
 * Read csv-12711-05 into one record per partner entity, and prove the shape while doing it.
 *
 * Proof 3 of the reporting year lives here: the Jahr column. If the data disagrees with the
 * title the adapter stops, because a mismatch means the publication template changed and
 * every number below is suspect.
 */
function destatisEntities({ parts, shared, sheets }, titleYear) {
  const path = sheets.get(CSV_SHEET);
  if (!path) throw new Error(`the workbook has no sheet named ${CSV_SHEET}; it has ${[...sheets.keys()].join(', ')}`);
  const { rows, cells } = readSheet(parts.get(path).toString('utf8'), shared);
  if (cells < 1000) throw new Error(`${CSV_SHEET} decoded to only ${cells} non-empty cells — the reader is looking in the wrong place`);

  const header = CSV_HEADER.map((_, i) => rows.get(1)?.get(String.fromCharCode(65 + i)) ?? null);
  if (header.join('|') !== CSV_HEADER.join('|')) {
    throw new Error(`${CSV_SHEET} header is [${header.join(', ')}], expected [${CSV_HEADER.join(', ')}] — a column moved and every value below would be read from the wrong place`);
  }

  const byKey = new Map();             // folded label -> { labels:Set, sex:Map }
  const years = new Set();
  let dataRows = 0;
  for (const [r, row] of rows) {
    if (r === 1) continue;
    const label = row.get('D');
    if (label == null || label === '') continue;         // the sheet ends with one empty row
    const sex = row.get('E');
    const year = row.get('F');
    const inn = Number(row.get('G')), out = Number(row.get('H')), net = Number(row.get('I'));
    if (!Number.isInteger(inn) || !Number.isInteger(out) || !Number.isInteger(net)) {
      throw new Error(`row ${r} (${label}/${sex}) has non-integer values: ${row.get('G')}, ${row.get('H')}, ${row.get('I')}`);
    }
    // The published balance column is an integrity check on the other two, and it held for
    // all 627 rows this session. Cell-key perturbation evidently keeps it consistent within
    // a row while breaking it across rows; if that ever stops being true, stop.
    if (inn - out !== net) {
      throw new Error(`row ${r} (${label}/${sex}): Zuzuege ${inn} - Fortzuege ${out} = ${inn - out}, but Wanderungssaldo says ${net}`);
    }
    if (!SEX_MEMBERS.includes(sex)) throw new Error(`row ${r} has Geschlecht "${sex}", which is not one of ${SEX_MEMBERS.join('/')}`);
    years.add(year);
    dataRows++;
    const key = fold(label);
    let e = byKey.get(key);
    if (!e) byKey.set(key, (e = { labels: new Set(), sex: new Map() }));
    e.labels.add(label);
    if (e.sex.has(sex)) throw new Error(`partner ${label} has two "${sex}" rows; the table is not one row per partner per sex`);
    e.sex.set(sex, { in: inn, out, net });
  }

  if (years.size !== 1) throw new Error(`csv-12711-05 mixes reporting years: ${[...years].join(', ')}`);
  const dataYear = [...years][0];
  if (dataYear !== titleYear) {
    throw new Error(`the workbook title says ${titleYear} but the Jahr column says ${dataYear} — the file-id year and the data disagree`);
  }

  // The 627 / 210 / 630 puzzle, resolved mechanically rather than by hand. Folding must merge
  // exactly the labels that are the same partner spelled two ways, and this asserts that the
  // only such merge is one the allow-list already treats as a non-country.
  const labelStrings = [...byKey.values()].reduce((a, e) => a + e.labels.size, 0);
  const merged = [...byKey.entries()].filter(([, e]) => e.labels.size > 1);
  for (const [, e] of merged) {
    const spellings = [...e.labels];
    if (!spellings.every((s) => DE_NON_COUNTRY.some((n) => fold(n) === fold(s)))) {
      throw new Error(`two spellings of a COUNTRY were merged: ${spellings.join(' / ')} — check this is really one partner before trusting the merge`);
    }
  }
  for (const [, e] of byKey) {
    if (e.sex.size !== SEX_MEMBERS.length) {
      throw new Error(`partner ${[...e.labels].join('/')} has ${e.sex.size} sex rows, expected ${SEX_MEMBERS.length}`);
    }
  }
  say(`Destatis: ${dataRows} data rows = ${byKey.size} partner entities x ${SEX_MEMBERS.length} sex categories, from ${labelStrings} distinct label strings` +
      (merged.length ? ` (${merged.length} partner spelled more than one way: ${merged.map(([, e]) => [...e.labels].join(' = ')).join('; ')})` : ''));
  if (byKey.size * SEX_MEMBERS.length !== dataRows) {
    throw new Error(`${byKey.size} entities x ${SEX_MEMBERS.length} = ${byKey.size * SEX_MEMBERS.length}, but there are ${dataRows} data rows`);
  }

  // The footnote the flat sheet does not carry. Read off the formatted sibling and asserted,
  // because the layer note below states it as fact.
  const layoutPath = sheets.get(LAYOUT_SHEET);
  if (!layoutPath) throw new Error(`the formatted sibling sheet ${LAYOUT_SHEET} is missing, so its footnotes cannot be checked`);
  const layoutText = sheetText(parts.get(layoutPath).toString('utf8'), shared);
  if (!layoutText.includes(CELL_KEY_MARKER)) {
    throw new Error(`sheet ${LAYOUT_SHEET} no longer carries the "${CELL_KEY_MARKER}" footnote; the disclosure-control note this adapter writes would be false`);
  }
  // Provisional is derived from the table's own words rather than from the year. The annual
  // Statistischer Bericht marks provisional tables "Vorlaeufige Ergebnisse" in its footnotes
  // — table 12711-b01, the monthly one, does — and 12711-05 carries no such marker this run.
  const provisional = /vorläufig/i.test(layoutText);
  say(`Destatis: table ${LAYOUT_SHEET} footnotes — cell-key present, provisional marker ${provisional ? 'PRESENT' : 'absent'}`);

  return { byKey, dataYear, provisional };
}

// ------------------------------------------------------------------ ISTAT

let istatLastCall = 0;

/**
 * One ISTAT download. curl, not fetch, and exactly one request per call.
 *
 * node's own fetch got HTTP 500 from esploradati.istat.it on this URL with this Accept
 * header, and curl got 200 with a 705 KB body from the same machine one minute later. That is
 * the same shape as the imf.org trap the contract already records, so the same remedy is
 * used. What is NOT copied from fetch-concordance.mjs is its try-fetch-then-fall-back-to-curl
 * pattern: here a failed attempt still spends one of five requests per minute, and the
 * penalty for running out is an access block of one to two days for this IP, so the transport
 * that works is the only one used.
 *
 * There is no retry anywhere in this function, for the same reason. A 429 or a 5xx is fatal
 * and says what to do about it.
 */
async function istatFetch(dataflow, name) {
  const url = `${ISTAT_BASE}/${dataflow}/all?startPeriod=${ISTAT_PERIOD}`;
  return cached(name, async () => {
    const wait = istatLastCall ? Math.max(0, ISTAT_GAP_MS - (Date.now() - istatLastCall)) : 0;
    if (wait) {
      say(`ISTAT: sleeping ${(wait / 1000).toFixed(0)} s before the next request (5/min per IP, a 1-2 day block past it)`);
      await new Promise((res) => setTimeout(res, wait));
    }
    istatLastCall = Date.now();
    await mkdir(CACHE, { recursive: true });
    // curl writes the body to a file and the status line to stdout, so neither can be mistaken
    // for the other however large the body is or whatever it contains.
    const part = `${CACHE}/${name}.part`;
    const { stdout } = await run('curl', [
      '-sS', '--max-time', '300', '-H', `Accept: ${ISTAT_ACCEPT}`,
      '-o', part, '-w', '%{http_code}\t%{content_type}', url,
    ], { maxBuffer: 1024 * 1024 });
    const [status, ct = ''] = stdout.trim().split('\t');
    try {
      if (status === '429') {
        throw new Error('ISTAT answered 429. Do NOT retry: the documented penalty is an access block of 1-2 days for this IP, which would take out every other adapter working in this checkout. Wait it out.');
      }
      if (status !== '200') throw new Error(`HTTP ${status} from ${url}`);
      if (!ct.includes('vnd.sdmx.data+csv')) throw new Error(`content-type ${ct}, expected SDMX-CSV — a portal or block page answers 200 with HTML`);
      const text = await readFile(part, 'utf8');
      // 200 is not success. An SDMX service answers 200 with an empty dataset for a key that
      // matches nothing, and the header row alone is a perfectly valid empty CSV.
      if (!text.startsWith('DATAFLOW,')) throw new Error(`the body does not begin with the SDMX-CSV header row (first 80 chars: ${JSON.stringify(text.slice(0, 80))})`);
      if (text.split('\n').filter((l) => l.length).length < 2) throw new Error('the response is a header row with no observations');
      say(`ISTAT: ${name} ${(text.length / 1024).toFixed(0)} KB from ${url}`);
      return text;
    } finally {
      await rm(part, { force: true });
    }
  }, { ttlMs: TTL_MS });
}

/**
 * Decode one SDMX-CSV response to the headline cell per partner, and prove the aggregates.
 *
 * `partnerCol` differs between the two dataflows: inbound carries the partner in
 * COUNTRY_PREV_RESID with COUNTRY_NEXT_RESID pinned to X1033, outbound the other way round.
 * Both are asserted, because reading the pinned column would return one number labelled
 * "World" for every country and look like a plausible dataset.
 */
function istatHeadline(text, { dataflow, partnerCol, pinnedCol, dataType }) {
  // Splitting on commas is only safe while no field is quoted. With labels the country names
  // contain commas and arrive quoted, and a comma split would shred those rows in silence.
  if (text.includes('"')) throw new Error('the SDMX-CSV body contains a quote character, so fields are quoted and a comma split is unsafe — ask for the unlabelled media type');
  // The body is CRLF-terminated — 7,523 of 7,523 line breaks on the inbound response are
  // \r\n — so every line's last field carries a trailing carriage return. Today the last
  // column is UNIT_MULT and it is always empty, which is the only reason this is a header
  // check failing loudly rather than a value being silently misread as "0\r".
  const lines = text.split('\n').map((l) => l.replace(/\r$/, '')).filter((l) => l.length);
  const header = lines[0].split(',');
  if (header.join('|') !== ISTAT_COLUMNS.join('|')) {
    throw new Error(`SDMX-CSV header is [${header.join(', ')}], expected [${ISTAT_COLUMNS.join(', ')}]`);
  }
  const at = Object.fromEntries(ISTAT_COLUMNS.map((c, i) => [c, i]));
  // 'IT1,28_185_DF_DCIS_MIGRAZIONI_3,1.0' is how the request names it; the DATAFLOW column
  // writes the same triple as 'IT1:28_185_DF_DCIS_MIGRAZIONI_3(1.0)'.
  const [agency, flowId, version] = dataflow.split(',');
  const stamp = `${agency}:${flowId}(${version})`;

  const values = new Map();            // partner code -> number
  const statuses = new Map();
  let total = 0;
  for (let i = 1; i < lines.length; i++) {
    const f = lines[i].split(',');
    if (f.length !== ISTAT_COLUMNS.length) throw new Error(`line ${i + 1} has ${f.length} fields, expected ${ISTAT_COLUMNS.length}`);
    // Reconstructed in full rather than substring-matched: the two dataflow ids differ only
    // in a trailing digit, so a substring test would accept the wrong one.
    if (f[at.DATAFLOW] !== stamp) throw new Error(`line ${i + 1} belongs to dataflow ${f[at.DATAFLOW]}, not ${stamp}`);
    if (f[at.TIME_PERIOD] !== ISTAT_PERIOD) throw new Error(`line ${i + 1} is period ${f[at.TIME_PERIOD]}, not ${ISTAT_PERIOD}`);
    if (f[at.DATA_TYPE] !== dataType) throw new Error(`line ${i + 1} has DATA_TYPE ${f[at.DATA_TYPE]}, expected ${dataType}`);
    total++;
    if (f[at.CITIZENSHIP] !== ISTAT_HEADLINE.CITIZENSHIP) continue;
    if (f[at.SEX] !== ISTAT_HEADLINE.SEX) continue;
    if (f[at.AGE] !== ISTAT_HEADLINE.AGE) continue;
    if (f[at[pinnedCol]] !== ISTAT_WORLD) {
      throw new Error(`${pinnedCol} is ${f[at[pinnedCol]]} on line ${i + 1}, expected it pinned to ${ISTAT_WORLD} — the partner is in the other column and this decode is the wrong way round`);
    }
    const code = f[at[partnerCol]];
    const v = Number(f[at.OBS_VALUE]);
    if (!Number.isFinite(v)) throw new Error(`line ${i + 1} has OBS_VALUE ${JSON.stringify(f[at.OBS_VALUE])}`);
    if (values.has(code)) throw new Error(`partner ${code} appears twice in the headline cell; the dimension filter is not selecting a unique cell`);
    values.set(code, v);
    statuses.set(code, f[at.OBS_STATUS]);
  }
  if (!values.size) throw new Error(`no ${ISTAT_HEADLINE.CITIZENSHIP}/${ISTAT_HEADLINE.SEX}/${ISTAT_HEADLINE.AGE} cell in a 200 response — the dimension members changed`);

  // The aggregates, checked arithmetically. These are the numbers that decide whether the
  // deny-list is complete: if a ninth aggregate appeared, the country sum would overshoot the
  // World total and this would catch it.
  const world = values.get(ISTAT_WORLD);
  if (world == null) throw new Error(`the partner axis has no ${ISTAT_WORLD} (World) member to check the aggregates against`);
  const countries = [...values].filter(([c]) => !(c in ISTAT_AGGREGATES));
  const countrySum = countries.reduce((a, [, v]) => a + v, 0);
  if (countrySum !== world) {
    throw new Error(`the ${countries.length} non-aggregate partners sum to ${countrySum} but ${ISTAT_WORLD} (World) is ${world}; the aggregate list is incomplete or a member changed`);
  }
  const continentSum = ISTAT_CONTINENTS.reduce((a, c) => a + (values.get(c) ?? 0), 0);
  if (continentSum !== world) throw new Error(`the five continents sum to ${continentSum}, not ${world}`);
  const eu = (values.get('X1038') ?? 0) + (values.get('X1039') ?? 0);
  if (eu !== values.get('X1013')) throw new Error(`EU27 + Extra-EU27 = ${eu}, but Europe (X1013) is ${values.get('X1013')}`);

  // OBS_STATUS is read rather than assumed. Every 2025 cell carried 'p' this session; if that
  // ever stops being uniform the layer is still marked provisional but the log says so.
  const statusCounts = new Map();
  for (const [c, s] of statuses) if (!(c in ISTAT_AGGREGATES)) statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1);
  const provisional = (statusCounts.get('p') ?? 0) > 0;
  say(`ISTAT ${dataType}: ${total} rows, ${values.size} partners at ${ISTAT_HEADLINE.CITIZENSHIP}/${ISTAT_HEADLINE.SEX}/${ISTAT_HEADLINE.AGE} ` +
      `(${countries.length} countries + ${Object.keys(ISTAT_AGGREGATES).length} aggregates), World=${world.toLocaleString('en-GB')}, ` +
      `OBS_STATUS ${[...statusCounts].map(([s, n]) => `${s}=${n}`).join(' ')}`);
  if (statusCounts.size !== 1 || !statusCounts.has('p')) {
    say(`ISTAT ${dataType}: WARNING — OBS_STATUS is not uniformly 'p'; the layer is still badged provisional but the mix is ${[...statusCounts].map(([s, n]) => `${s}=${n}`).join(', ')}`);
  }
  return { values, countries: new Map(countries), world, provisional };
}

/** Partner code to ISO3, or null with a reason. Never a guess: every branch was observed. */
function istatIso3(code) {
  if (code in ISTAT_AGGREGATES) return null;
  if (code in ISTAT_NON_ISO2_COUNTRIES) return ISTAT_NON_ISO2_COUNTRIES[code];
  if (EUROSTAT_ONLY.includes(code)) {
    throw new Error(`ISTAT used "${code}", which is Eurostat's non-standard code, not ISO 3166-1 alpha-2. The overlay in this file assumes the two nomenclatures do not overlap.`);
  }
  return ISTAT_OVERLAY[code] ?? ISO3[code] ?? null;
}

/* ======================================================================================
 * load
 * ==================================================================================== */

export async function load() {
  // The shared table is re-checked against scripts/m49.json so a typo there cannot survive
  // into a layer keyed by a code that resolves to nothing on the globe.
  await checkIso3();
  const m49 = JSON.parse(await readFile(new URL('../m49.json', import.meta.url), 'utf8'));
  const realIso3 = new Set(Object.values(m49));
  realIso3.add('XKX');            // no M49 entry because no UN membership; see _iso3.mjs

  /* ------------------------------------------------------------------ Germany ---------- */
  const wb = await destatisWorkbook();
  const de = destatisEntities(wb, wb.titleYear);
  const year = de.dataYear;
  const periods = [year];

  const deArrivals = {};                 // partner ISO3 -> arrivals in Germany
  const deDepartures = {};
  const deCorridor = {};
  const deAggregates = new Map();        // folded label -> {in,out} for the ones dropped
  const unmapped = [];
  const usedIso3 = new Map();
  for (const [key, e] of de.byKey) {
    const label = [...e.labels][0];
    const cell = e.sex.get(SEX_TOTAL);
    const mapped = DE_ALLOW.get(key);
    if (!mapped) {
      if (DE_DROP.has(key)) { deAggregates.set(key, cell); continue; }
      unmapped.push(label);
      continue;
    }
    if (!realIso3.has(mapped)) throw new Error(`"${label}" maps to ${mapped}, which is not in scripts/m49.json`);
    if (usedIso3.has(mapped)) throw new Error(`"${label}" and "${usedIso3.get(mapped)}" both map to ${mapped}`);
    usedIso3.set(mapped, label);
    deArrivals[mapped] = { [year]: cell.in };
    deDepartures[mapped] = { [year]: cell.out };
    deCorridor[`${mapped}>DEU`] = { [year]: cell.in };
    deCorridor[`DEU>${mapped}`] = { [year]: cell.out };
  }
  // An allow-list that silently drops what it does not know is a deny-list with extra steps.
  if (unmapped.length) {
    throw new Error(`${unmapped.length} partner label(s) in csv-12711-05 are neither in the country allow-list nor in the non-country list: ${unmapped.join(', ')}. Classify them rather than letting them disappear.`);
  }

  // How large the cell-key perturbation actually is, measured instead of hedged. Male+female
  // against the published total is the cleanest place to see it: both are published cells.
  let sexSlack = 0, sexSlackN = 0;
  for (const e of de.byKey.values()) {
    const t = e.sex.get(SEX_TOTAL);
    const m = e.sex.get('Männlich'), f = e.sex.get('Weiblich');
    for (const k of ['in', 'out']) {
      const d = Math.abs(t[k] - (m[k] + f[k]));
      if (d) { sexSlackN++; sexSlack = Math.max(sexSlack, d); }
    }
  }
  // Keyed by the folded label, not the raw one, because the raw spelling of the
  // unknown-origin partner is whichever of its two spellings happened to be read first.
  const agg = (n) => deAggregates.get(fold(n)) ?? { in: 0, out: 0 };
  const deTotal = agg('Insgesamt');
  if (!deTotal.in) throw new Error('the "Insgesamt" row is missing from csv-12711-05, so the coverage shares below cannot be computed');
  const deNoCountry = ['unbekanntes Ausland', 'ohne Angabe/ungeklärt']
    .reduce((a, n) => ({ in: a.in + agg(n).in, out: a.out + agg(n).out }), { in: 0, out: 0 });
  const dePct = (v, t) => ((v / t) * 100).toFixed(1);
  say(`Destatis: ${Object.keys(deArrivals).length} countries mapped; published total ${deTotal.in.toLocaleString('en-GB')} in / ${deTotal.out.toLocaleString('en-GB')} out; ` +
      `no country recorded for ${deNoCountry.in.toLocaleString('en-GB')} (${dePct(deNoCountry.in, deTotal.in)}%) arrivals and ${deNoCountry.out.toLocaleString('en-GB')} (${dePct(deNoCountry.out, deTotal.out)}%) departures`);
  say(`Destatis: cell-key perturbation — male+female misses the published total in ${sexSlackN} of ${de.byKey.size * 2} partner-direction cells, by at most ${sexSlack} people`);

  /* ------------------------------------------------------------------ Italy ------------ */
  const inText = await istatFetch(ISTAT_INBOUND, 'istat-inbound.csv');
  const outText = await istatFetch(ISTAT_OUTBOUND, 'istat-outbound.csv');
  const itIn = istatHeadline(inText, {
    dataflow: ISTAT_INBOUND, partnerCol: 'COUNTRY_PREV_RESID', pinnedCol: 'COUNTRY_NEXT_RESID', dataType: 'TREG',
  });
  const itOut = istatHeadline(outText, {
    dataflow: ISTAT_OUTBOUND, partnerCol: 'COUNTRY_NEXT_RESID', pinnedCol: 'COUNTRY_PREV_RESID', dataType: 'TDEREG',
  });

  const itArrivals = {}, itDepartures = {}, itCorridor = {};
  const itUnmapped = [];
  for (const [side, src, into, corridorKey] of [
    ['inbound', itIn, itArrivals, (iso) => `${iso}>ITA`],
    ['outbound', itOut, itDepartures, (iso) => `ITA>${iso}`],
  ]) {
    for (const [code, v] of src.countries) {
      const iso = istatIso3(code);
      if (!iso) { itUnmapped.push(`${side}:${code}`); continue; }
      if (!realIso3.has(iso)) throw new Error(`ISTAT ${code} maps to ${iso}, which is not in scripts/m49.json`);
      into[iso] = { [year]: v };
      itCorridor[corridorKey(iso)] = { [year]: v };
    }
  }
  if (itUnmapped.length) {
    throw new Error(`${itUnmapped.length} ISTAT partner code(s) resolve to no ISO3: ${itUnmapped.join(', ')}. Classify them rather than letting them disappear.`);
  }
  const itProvisional = itIn.provisional || itOut.provisional;
  say(`ISTAT: ${Object.keys(itArrivals).length} inbound and ${Object.keys(itDepartures).length} outbound partners mapped; ` +
      `${itIn.world.toLocaleString('en-GB')} registrations and ${itOut.world.toLocaleString('en-GB')} deregistrations at ${year}`);

  /* ---------------------------------------------- the bilateral cross-check ------------ */
  // The reason both halves are in one file. Computed, not written down, so it cannot go stale.
  const pair = (a, b) => (b ? `${(a / b).toFixed(2)}x` : 'n/a');
  const x = {
    itaDeu: { de: deCorridor['ITA>DEU'][year], it: itCorridor['ITA>DEU'][year] },
    deuIta: { de: deCorridor['DEU>ITA'][year], it: itCorridor['DEU>ITA'][year] },
  };
  const gap = (k) => {
    const { de: d, it: i } = x[k];
    return `${d.toLocaleString('en-GB')} (Germany) against ${i.toLocaleString('en-GB')} (Italy), ${pair(d, i)}`;
  };
  say(`cross-check ITA>DEU at ${year}: ${gap('itaDeu')}`);
  say(`cross-check DEU>ITA at ${year}: ${gap('deuIta')}`);
  const CROSS =
    `The same two corridors appear on the Italian layers from Italy's own register: at ${year} ` +
    `Italy to Germany is ${gap('itaDeu')} and Germany to Italy is ${gap('deuIta')}. Neither ` +
    'register is wrong; they count different events. A German Abmeldung is transacted at a ' +
    'counter people must visit to end their tax and tenancy obligations, while Italian ' +
    'emigration is recorded through AIRE consular enrolment that emigrants frequently never ' +
    'complete. Read the pair as a measurement of how incomplete emigration statistics are, ' +
    'not as two estimates to average.';

  /* ------------------------------------------------------------------ vintages ---------- */
  // periodEnd is the last day of the calendar year the moves happened in. These are FLOWS
  // over a year, not a stock at an instant, so `cadence: 'annual'` and 2025-12-31 are right
  // and a 1 January population date would be a different layer entirely (contract rule 9).
  const deVintage = {
    periodEnd: `${year}-12-31`,
    periodLabel: year,
    cadence: 'annual',
    coverage: [year, year],
    // Municipal registration and deregistration events, enumerated by the Meldebehoerden and
    // published by the federal office. A total enumeration of administrative records, which
    // is what 'reported' means elsewhere in this repo. The workbook says so itself:
    // "Es handelt sich um eine Totalerhebung auf der Basis von Verwaltungsdaten".
    estimateKind: 'reported',
    provisional: de.provisional,
    producer: 'Statistisches Bundesamt (Destatis)',
    licenceId: 'LicenseRef-DL-DE-BY-2.0',
    commercialUseClear: true,
  };
  const itVintage = {
    periodEnd: `${year}-12-31`,
    periodLabel: year,
    cadence: 'annual',
    coverage: [year, year],
    estimateKind: 'reported',
    // Every 2025 cell in both dataflows carried OBS_STATUS 'p'. Derived, not asserted.
    provisional: itProvisional,
    producer: 'Istituto nazionale di statistica (ISTAT)',
    licenceId: 'CC-BY-4.0',
    commercialUseClear: true,
  };

  const DE_BASIS =
    `Germany's municipal population register, table 12711-05 of the Statistischer Bericht ` +
    `Wanderungen ${year}, counted by country of previous or next residence rather than by ` +
    'citizenship, so a cell is a move between two places. Individual counts are perturbed ' +
    'for disclosure control by the cell-key method — the workbook says so in footnote * and ' +
    `it shows: male plus female misses the published total in ${sexSlackN} of ` +
    `${de.byKey.size * 2} partner-direction cells, by up to ${sexSlack} people — so never ` +
    'rebuild a total by summing parts and never rescale the parts to a total. Two entries ' +
    'are wider than the code they are filed under: China includes Hong Kong and Macau, and ' +
    'Sudan includes the pre-2011 Sudan alongside a separate South Sudan row.';
  const DE_MISSING =
    `Germany recorded no partner country at all for ${deNoCountry.in.toLocaleString('en-GB')} ` +
    `arrivals (${dePct(deNoCountry.in, deTotal.in)}% of ${deTotal.in.toLocaleString('en-GB')}) and ` +
    `${deNoCountry.out.toLocaleString('en-GB')} departures ` +
    `(${dePct(deNoCountry.out, deTotal.out)}% of ${deTotal.out.toLocaleString('en-GB')}) in ${year}; ` +
    'those moves are absent from this layer rather than distributed across it, so the country ' +
    'values do not sum to German migration.';
  const IT_BASIS =
    "Italy's municipal population register (anagrafe), counted by country of previous or next " +
    'residence. Every 2025 cell carries OBS_STATUS "p": these are provisional and ISTAT ' +
    'revises them. Emigration in particular is understood to be undercounted, because leaving ' +
    'the register requires the emigrant to enrol with AIRE at a consulate and many never do.';

  const layers = [
    {
      id: 'de-migration-corridors',
      title: 'German register: moves in and out, by partner country',
      question: 'How many people moved along this corridor in 2025, as Germany recorded it?',
      unit: 'people',
      entity: 'corridor',
      rows: deCorridor,
      periods,
      vintage: { ...deVintage },
      note: `${DE_BASIS} ${CROSS}`,
    },
    {
      id: 'it-migration-corridors',
      title: 'Italian register: moves in and out, by partner country',
      question: 'How many people moved along this corridor in 2025, as Italy recorded it?',
      unit: 'people',
      entity: 'corridor',
      rows: itCorridor,
      periods,
      vintage: { ...itVintage },
      note: `${IT_BASIS} The same two corridors appear on the German layers from Germany's own ` +
            `register: at ${year} Italy to Germany is ${gap('itaDeu')} and Germany to Italy is ` +
            `${gap('deuIta')}. Read the pair as a measurement of how incomplete emigration ` +
            'statistics are, not as two estimates to average.',
    },
    {
      id: 'de-arrivals-by-origin',
      title: 'German register: arrivals from abroad, by country left',
      question: 'How many people moved to Germany from this country in 2025?',
      unit: 'people',
      entity: 'country',
      rows: deArrivals,
      periods,
      vintage: { ...deVintage },
      note: `${DE_BASIS} ${DE_MISSING}`,
    },
    {
      id: 'de-departures-by-destination',
      title: 'German register: departures abroad, by country moved to',
      question: 'How many people left Germany for this country in 2025?',
      unit: 'people',
      entity: 'country',
      rows: deDepartures,
      periods,
      vintage: { ...deVintage },
      note: `${DE_BASIS} ${DE_MISSING} Departures are the weaker half of any register: a move ` +
            'out is recorded only if it is declared or later cleared administratively, which ' +
            'is why the unrecorded-destination share above is roughly twice the one on arrivals.',
    },
    {
      id: 'it-arrivals-by-origin',
      title: 'Italian register: registrations from abroad, by country left',
      question: 'How many people registered in Italy from this country in 2025?',
      unit: 'people',
      entity: 'country',
      rows: itArrivals,
      periods,
      vintage: { ...itVintage },
      note: `${IT_BASIS} The table is sparse rather than zero-filled: a country absent from ` +
            'this layer had no published cell, which is not the same as nobody arriving.',
    },
    {
      id: 'it-departures-by-destination',
      title: 'Italian register: deregistrations for abroad, by country moved to',
      question: 'How many people left the Italian register for this country in 2025?',
      unit: 'people',
      entity: 'country',
      rows: itDepartures,
      periods,
      vintage: { ...itVintage },
      note: `${IT_BASIS} Fewer countries appear here than on the arrivals layer because a ` +
            'destination with no published cell is absent, not zero.',
    },
  ];

  return { layers };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { layers } = await load();
  console.log('');
  for (const l of layers) {
    const n = Object.keys(l.rows).length;
    const p = l.vintage.periodLabel;
    const vals = Object.values(l.rows).map((r) => r[p]).filter((v) => v != null);
    const total = vals.reduce((a, b) => a + b, 0);
    const top = Object.entries(l.rows).sort((a, b) => b[1][p] - a[1][p]).slice(0, 5)
      .map(([k, r]) => `${k}=${r[p].toLocaleString('en-GB')}`).join(' ');
    console.log(`${l.id.padEnd(30)} ${l.entity.padEnd(8)} ${String(n).padStart(4)} keys  ${p}  ` +
      `${l.vintage.estimateKind}${l.vintage.provisional ? '/provisional' : ''}  total=${total.toLocaleString('en-GB')}`);
    console.log(`  top: ${top}`);
  }
}
