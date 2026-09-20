// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Statistics Netherlands (CBS) table 85484NED, "Immi- en emigratie; per maand, geslacht,
// herkomstland, geboorteland" — the Dutch population register, monthly, one month behind.
// At the time of writing this is the only monthly layer in the app, so it is the layer that
// decides what `vintageLabel` looks like next to a quinquennial stock table.
//
// ---------------------------------------------------------------------------------------
// WHAT HERKOMSTLAND IS, AND WHY THERE IS NO CORRIDOR LAYER IN THIS FILE
// ---------------------------------------------------------------------------------------
// The brief this adapter was written from called Herkomstland "the bilateral dimension".
// It is not, and building ORIG>NLD corridors out of it would have shipped a lie. CBS's own
// definition, read out of TableInfos.Description on 2026-09-20:
//
//   "Herkomstland — Kenmerk dat weergeeft in welk land iemand geboren is of waar diens
//    ouders geboren zijn. De herkomst van personen die in het buitenland zijn geboren wordt
//    bepaald door hun eigen geboorteland. Bij personen die in Nederland geboren zijn, wordt
//    de herkomst bepaald door het geboorteland van de ouders."
//
// So it is an attribute of the *person*, not of the journey: country of birth, or the
// parents' country of birth for the Netherlands-born. Three live probes agree with the text
// and rule out "country departed from / settled in":
//   * Herkomstland=Nederland carries 2,339 IMMIGRATIONS in 2026MM07. Immigration from the
//     Netherlands to the Netherlands is not a journey; returning Dutch-origin people are.
//   * Herkomstland=Nederland x Geboorteland=Geboren buiten Nederland is null, and
//     x Geboren in Nederland is the whole 2,339 — exactly what the definition predicts.
//   * Herkomstland=Marokko x Geboorteland=Geboren in Nederland is 71 immigrations, i.e. 71
//     people who were born in the Netherlands and arrived from somewhere unrecorded.
// A corridor keyed MAR>NLD would assert those 71 travelled from Morocco. Nothing in this
// table says that. Hence: two country layers keyed on origin, and no corridor layer.
//
// ---------------------------------------------------------------------------------------
// LICENCE — the trap this project has paid for twice, walked through in full
// ---------------------------------------------------------------------------------------
// The per-dataset licence is the machine-readable declaration in the Dutch national open
// data register, read at
// https://data.overheid.nl/data/api/3/action/package_search?q=85484NED on 2026-09-20. The
// record (id aa763e63-41ef-4b6d-9fe2-14e41b015f13, identifier
// https://opendata.cbs.nl/ODataApi/OData/85484NED, i.e. this exact endpoint) declares,
// verbatim:
//
//   "license_id": "http://creativecommons.org/licenses/by/4.0/deed.nl",
//   "license_title": "CC-BY (4.0)",
//   "license_url": "http://creativecommons.org/licenses/by/4.0/deed.nl",
//   "access_rights": "http://publications.europa.eu/resource/authority/access-right/PUBLIC"
//
// and CC BY 4.0 grants, verbatim from https://creativecommons.org/licenses/by/4.0/ read on
// 2026-09-20: "Share — copy and redistribute the material in any medium or format for any
// purpose, even commercially." Commercial reuse is therefore clearly granted, on the
// condition that CBS is credited. commercialUseClear: true.
//
// What must NOT be cited here is https://www.cbs.nl/en-gb/about-us/website/copyright, which
// reads (fetched 2026-09-20) "Unless otherwise stated, the content of this website is
// subject to Creative Commons Attribution (CC BY 4.0)". That sentence is scoped to *the
// content of this website*. It is a website-content notice, not a licence over the OData
// tables, and it is the precise shape of the mistake this repository has shipped twice.
// The CKAN record above is dataset-scoped and names this endpoint, so it is the one that
// binds.
//
// One honest wrinkle: the same CKAN record carries "isopen": false. That is a CKAN registry
// artefact — CKAN only sets isopen when license_id matches an entry in its own licence
// register, and a bare URL never does. license_id, license_url, license_title and
// access_rights all say CC BY 4.0 / PUBLIC. It is noted rather than hidden.
//
// ---------------------------------------------------------------------------------------
// TRAPS IN THIS ENDPOINT, ALL HIT LIVE ON 2026-09-20
// ---------------------------------------------------------------------------------------
//  * node's fetch gets HTTP 406 with an empty body from opendata.cbs.nl no matter what
//    Accept or User-Agent it sends, while curl gets 200 from the same URL in the same
//    process. Same shape as the imf.org trap already in CONTRACT.md, opposite host. The
//    curl fallback below is not belt-and-braces; without it this adapter does not run here.
//  * A query whose result set would reach 10,000 rows is refused with HTTP **500** and a
//    plain-text body served as content-type application/json:
//    "The given query is not allowed on this table. Please redefine your query so that it
//    returns less than 10000 records." So the history is fetched in period chunks, and
//    JSON.parse failure is reported as what it is rather than as a parse error.
//  * An unknown period answers HTTP 200 with `"value": []`. A zero-length result is the
//    failure mode, not the empty case, so it throws.
//  * $orderby is silently ignored: ...&$orderby=Herkomstland desc returned the codelist
//    order unchanged. Nothing here may depend on row order.
//  * YYYYMM## monthly and YYYYJJ00 annual periods live in the same table (55 monthly and 4
//    annual on 2026-09-20). Mixing them would put 2022's annual total in a monthly series.
//  * null and 0 are different answers: 2012659 "Onbekend herkomstland" is a real 0 in
//    2026MM07 while H008752 "Swaziland" is null in every month because the code is retired.
//    Nulls are dropped; zeros are kept.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

export const meta = {
  id: 'cbs-netherlands',
  producer: 'Statistics Netherlands (CBS)',
  licenceId: 'CC-BY-4.0',
  commercialUseClear: true,
};

const BASE = 'https://opendata.cbs.nl/ODataApi/OData/85484NED/';
/** The cache is keyed by the table's own Modified stamp, not by adapter id alone. CBS revises
 *  published months — its own text says "Tussentijdse bijstellingen van voorgaande maanden
 *  zijn mogelijk" and replaces a whole year of voorlopige cijfers with definitieve ones each
 *  third quarter — so a cache that never expires would pin the snapshot to whatever afternoon
 *  it was first built and quietly stop the newest period from ever advancing. */
const CACHE_ROOT = '.cache/layers/cbs-netherlands';
let CACHE = CACHE_ROOT;

/** Pinned so that a CBS re-cut of the table that drops or renames a code fails loudly rather
 *  than quietly changing what the layer counts. T001038 is both sexes; T001638 is all birth
 *  countries, i.e. the margin over the 3-code Geboorteland axis (Totaal / born in NL / born
 *  outside NL) — Geboorteland is NOT a country axis and must be collapsed, not iterated. */
const PINS = { Geslacht: 'T001038', Geboorteland: 'T001638' };

/** The two topics. EmigratieInclusiefAdministratieveC_2 is emigration net of administrative
 *  corrections — CBS's own text says it "geven een beter beeld van de werkelijke emigratie"
 *  than the gross series, because most administrative removals are undeclared departures.
 *  Being a net figure it does go negative: 114 of the 13,031 emigration cells built on
 *  2026-09-20 were below zero, the deepest being -9. Nothing downstream may treat these as
 *  counts of events, and a diverging colour scale is the only honest one for this layer. */
const TOPICS = {
  immigration: 'Immigratie_1',
  emigration: 'EmigratieInclusiefAdministratieveC_2',
};

/** The three Herkomstland control codes, each asserted against below. Naming them here rather
 *  than inline is what lets the reconciliation read as an identity. */
const TOTAL = 'T001040';        // Totaal
const DOMESTIC = '1012600';     // Nederland — Dutch-origin people, a partition member not an aggregate
const UNKNOWN = '2012659';      // Onbekend herkomstland

/**
 * CBS Herkomstland code -> [ISO 3166-1 alpha-3, the Dutch title the code carried when this
 * table was written]. The title is stored so a code CBS reassigns is caught: every entry is
 * compared against the live codelist on each run and a mismatch throws.
 *
 * Derived on 2026-09-20 by reading .../85484NED/Herkomstland (269 entries) in full, not from
 * any published crosswalk — CBS ships none with this table. 239 entries, every one of them
 * present in scripts/m49.json except Kosovo (see NOT_IN_M49).
 */
const ISO3 = {
  // ---- CategoryGroup 3, Europa (exclusief Nederland) -----------------------------------
  H008534: ['ALB', 'Albanië'], H008538: ['AND', 'Andorra'], H008783: ['BLR', 'Belarus'],
  H008552: ['BEL', 'België'], H008559: ['BIH', 'Bosnië-Herzegovina'], H008567: ['BGR', 'Bulgarije'],
  H008587: ['CYP', 'Cyprus'], H008588: ['DNK', 'Denemarken'], H008592: ['DEU', 'Duitsland'],
  H008598: ['EST', 'Estland'], H008600: ['FRO', 'Faeröer-eilanden'], H008604: ['FIN', 'Finland'],
  H008605: ['FRA', 'Frankrijk'], H008613: ['GIB', 'Gibraltar'], H008615: ['GRC', 'Griekenland'],
  H008627: ['HUN', 'Hongarije'], H008629: ['IRL', 'Ierland'], H008630: ['ISL', 'IJsland'],
  H008636: ['ITA', 'Italië'], H008653: ['XKX', 'Kosovo'], H008654: ['HRV', 'Kroatië'],
  H008657: ['LVA', 'Letland'], H008661: ['LIE', 'Liechtenstein'], H008662: ['LTU', 'Litouwen'],
  H008663: ['LUX', 'Luxemburg'], H008671: ['MLT', 'Malta'], H008672: ['IMN', 'Man'],
  H008682: ['MDA', 'Moldavië'], H008683: ['MCO', 'Monaco'], H008685: ['MNE', 'Montenegro'],
  H008704: ['NOR', 'Noorwegen'], H008706: ['UKR', 'Oekraïne'], H008709: ['AUT', 'Oostenrijk'],
  H008718: ['POL', 'Polen'], H008719: ['PRT', 'Portugal'],
  // CBS keeps the pre-2019 name "Macedonië" as a retired null code and carries the live
  // country under a separate key; MKD must come from the live one.
  H008825: ['MKD', 'Republiek Noord-Macedonië'],
  H008723: ['ROU', 'Roemenië'], H008724: ['RUS', 'Rusland'], H008732: ['SMR', 'San Marino'],
  H008736: ['SRB', 'Servië'], H008744: ['SVN', 'Slovenië'], H008745: ['SVK', 'Slowakije'],
  H008749: ['ESP', 'Spanje'], H008764: ['CZE', 'Tsjechië'], H008773: ['VAT', 'Vaticaanstad'],
  H008776: ['GBR', 'Verenigd Koninkrijk'], H008790: ['SWE', 'Zweden'], H008791: ['CHE', 'Zwitserland'],
  // ---- CategoryGroup 4, "Buiten Europa: 5 grote groepen" -------------------------------
  // Four of the five are ordinary countries pulled out of their continents for presentation;
  // the fifth, Nederlandse Cariben, is a rollup and is denied below.
  H008632: ['IDN', 'Indonesië'], H008673: ['MAR', 'Marokko'], H008751: ['SUR', 'Suriname'],
  H008766: ['TUR', 'Turkije'],
  // ---- CategoryGroup 5, Afrika (exclusief Marokko) -------------------------------------
  H008535: ['DZA', 'Algerije'], H008539: ['AGO', 'Angola'], H008554: ['BEN', 'Benin'],
  H008560: ['BWA', 'Botswana'], H008564: ['IOT', 'Brits Territorium in de Indische Oceaan'],
  H008568: ['BFA', 'Burkina Faso'], H008569: ['BDI', 'Burundi'],
  H008573: ['CAF', 'Centraal-Afrikaanse Republiek'], H008580: ['COM', 'Comoren'],
  H008581: ['COG', 'Congo'], H008582: ['COD', 'Congo (Democratische Republiek)'],
  H008589: ['DJI', 'Djibouti'], H008594: ['EGY', 'Egypte'], H008596: ['GNQ', 'Equatoriaal-Guinea'],
  H008597: ['ERI', 'Eritrea'], H008830: ['SWZ', 'Eswatini'], H008599: ['ETH', 'Ethiopië'],
  H008609: ['GAB', 'Gabon'], H008610: ['GMB', 'Gambia'], H008612: ['GHA', 'Ghana'],
  H008621: ['GIN', 'Guinee'], H008622: ['GNB', 'Guinee-Bissau'], H008637: ['CIV', 'Ivoorkust'],
  H008644: ['CPV', 'Kaapverdië'], H008645: ['CMR', 'Kameroen'], H008649: ['KEN', 'Kenia'],
  H008656: ['LSO', 'Lesotho'], H008659: ['LBR', 'Liberia'], H008660: ['LBY', 'Libië'],
  H008666: ['MDG', 'Madagaskar'], H008667: ['MWI', 'Malawi'], H008670: ['MLI', 'Mali'],
  H008677: ['MRT', 'Mauritanië'], H008678: ['MUS', 'Mauritius'], H008679: ['MYT', 'Mayotte'],
  H008687: ['MOZ', 'Mozambique'], H008689: ['NAM', 'Namibië'], H008698: ['NER', 'Niger'],
  H008699: ['NGA', 'Nigeria'], H008722: ['REU', 'Réunion'], H008726: ['RWA', 'Rwanda'],
  H008733: ['STP', 'Sao Tomé en Principe'], H008735: ['SEN', 'Senegal'], H008738: ['SYC', 'Seychellen'],
  H008739: ['SLE', 'Sierra Leone'], H008741: ['SHN', 'Sint-Helena'], H008746: ['SDN', 'Soedan'],
  H008747: ['SOM', 'Somalië'], H008756: ['TZA', 'Tanzania'], H008759: ['TGO', 'Togo'],
  H008763: ['TCD', 'Tsjaad'], H008765: ['TUN', 'Tunesië'], H008770: ['UGA', 'Uganda'],
  H008784: ['ZMB', 'Zambia'], H008785: ['ZWE', 'Zimbabwe'], H008787: ['ZAF', 'Zuid-Afrika'],
  H008786: ['SSD', 'Zuid-Soedan'],
  // ---- CategoryGroup 6, Amerika en Oceanië ---------------------------------------------
  H008537: ['VIR', 'Amerikaanse Maagdeneilanden'], H008536: ['ASM', 'Amerikaans-Samoa'],
  H008540: ['AIA', 'Anguilla'], H008532: ['ATA', 'Antarctica'], H008541: ['ATG', 'Antigua en Barbuda'],
  H008542: ['ARG', 'Argentinië'], H008544: ['ABW', 'Aruba'], H008545: ['AUS', 'Australië'],
  H008547: ['BHS', "Bahama's"], H008550: ['BRB', 'Barbados'], H008553: ['BLZ', 'Belize'],
  H008555: ['BMU', 'Bermuda'], H008557: ['BOL', 'Bolivia'], H008562: ['BRA', 'Brazilië'],
  H008565: ['VGB', 'Britse Maagdeneilanden'], H008571: ['CAN', 'Canada'],
  H008794: ['BES', 'Caribisch Nederland'], H008572: ['CYM', 'Caymaneilanden'], H008574: ['CHL', 'Chili'],
  H008579: ['COL', 'Colombia'], H008583: ['COK', 'Cookeilanden'], H008584: ['CRI', 'Costa Rica'],
  H008585: ['CUB', 'Cuba'], H008586: ['CUW', 'Curaçao'], H008590: ['DMA', 'Dominica'],
  H008591: ['DOM', 'Dominicaanse Republiek'], H008593: ['ECU', 'Ecuador'], H008595: ['SLV', 'El Salvador'],
  H008601: ['FLK', 'Falklandeilanden'], H008602: ['FJI', 'Fiji'], H008606: ['GUF', 'Frans-Guyana'],
  H008608: ['PYF', 'Frans-Polynesië'], H008614: ['GRD', 'Grenada'], H008616: ['GRL', 'Groenland'],
  H008617: ['GLP', 'Guadeloupe'], H008618: ['GUM', 'Guam'], H008619: ['GTM', 'Guatemala'],
  H008623: ['GUY', 'Guyana'], H008624: ['HTI', 'Haïti'], H008626: ['HND', 'Honduras'],
  H008638: ['JAM', 'Jamaica'], H008651: ['KIR', 'Kiribati'], H008675: ['MHL', 'Marshall-eilanden'],
  H008676: ['MTQ', 'Martinique'], H008680: ['MEX', 'Mexico'], H008681: ['FSM', 'Micronesië'],
  H008686: ['MSR', 'Montserrat'], H008690: ['NRU', 'Nauru'], H008695: ['NIC', 'Nicaragua'],
  H008696: ['NCL', 'Nieuw-Caledonië'], H008697: ['NZL', 'Nieuw-Zeeland'], H008700: ['NIU', 'Niue'],
  H008702: ['MNP', 'Noordelijke Marianen'], H008705: ['NFK', 'Norfolk'], H008711: ['PLW', 'Palau'],
  H008713: ['PAN', 'Panama'], H008714: ['PNG', 'Papoea-Nieuw-Guinea'], H008715: ['PRY', 'Paraguay'],
  H008716: ['PER', 'Peru'], H008717: ['PCN', 'Pitcairneilanden'], H008720: ['PRI', 'Puerto Rico'],
  H008727: ['KNA', 'Saint Kitts en Nevis'], H008728: ['SPM', 'Saint Pierre en Miquelon'],
  H008792: ['BLM', 'Saint-Barthélemy'], H008730: ['SLB', 'Salomonseilanden'], H008731: ['WSM', 'Samoa'],
  H008742: ['LCA', 'Sint Lucia'], H008868: ['MAF', 'Saint-Martin'],
  H008743: ['SXM', 'Sint Maarten (Nederlands deel)'], H008729: ['VCT', 'Sint Vincent en de Grenadines'],
  H008760: ['TKL', 'Tokelau'], H008761: ['TON', 'Tonga'], H008762: ['TTO', 'Trinidad en Tobago'],
  H008768: ['TCA', 'Turks- en Caicoseilanden'], H008769: ['TUV', 'Tuvalu'], H008771: ['URY', 'Uruguay'],
  H008772: ['VUT', 'Vanuatu'], H008774: ['VEN', 'Venezuela'],
  H008778: ['USA', 'Verenigde Staten van Amerika'], H008779: ['UMI', 'Verre eilanden van de VS'],
  H008782: ['WLF', 'Wallis en Futuna'], H008869: ['SGS', 'Zuid-Georgia&Zuidelijke Sandwicheilanden'],
  // ---- CategoryGroup 7, Azië ------------------------------------------------------------
  H008533: ['AFG', 'Afghanistan'], H008543: ['ARM', 'Armenië'], H008546: ['AZE', 'Azerbeidzjan'],
  H008548: ['BHR', 'Bahrein'], H008549: ['BGD', 'Bangladesh'], H006997: ['BTN', 'Bhutan'],
  H008566: ['BRN', 'Brunei'], H008570: ['KHM', 'Cambodja'], H008575: ['CHN', 'China'],
  H008603: ['PHL', 'Filippijnen'], H008828: ['PSE', 'Gazastrook en Westelijke Jordaanoever'],
  H008611: ['GEO', 'Georgië'], H008628: ['HKG', 'Hongkong'], H008631: ['IND', 'India'],
  H008633: ['IRQ', 'Irak'], H008634: ['IRN', 'Iran'], H008635: ['ISR', 'Israël'],
  H008639: ['JPN', 'Japan'], H008640: ['YEM', 'Jemen'], H008643: ['JOR', 'Jordanië'],
  H008647: ['QAT', 'Katar'], H008648: ['KAZ', 'Kazachstan'], H008650: ['KGZ', 'Kirgizië'],
  H008652: ['KWT', 'Koeweit'], H008655: ['LAO', 'Laos'], H008658: ['LBN', 'Libanon'],
  H008664: ['MAC', 'Macau'], H008668: ['MDV', 'Maldiven'], H008669: ['MYS', 'Maleisië'],
  H008684: ['MNG', 'Mongolië'], H008688: ['MMR', 'Myanmar'], H008694: ['NPL', 'Nepal'],
  H008703: ['PRK', 'Noord-Korea'], H008707: ['UZB', 'Oezbekistan'], H008708: ['OMN', 'Oman'],
  H008710: ['PAK', 'Pakistan'], H008734: ['SAU', 'Saoedi-Arabië'], H008740: ['SGP', 'Singapore'],
  H008750: ['LKA', 'Sri Lanka'], H008753: ['SYR', 'Syrië'], H008754: ['TJK', 'Tadzjikistan'],
  H008755: ['TWN', 'Taiwan'], H008757: ['THA', 'Thailand'], H008758: ['TLS', 'Timor Leste'],
  H008767: ['TKM', 'Turkmenistan'], H008777: ['ARE', 'Verenigde Arabische Emiraten'],
  H008780: ['VNM', 'Vietnam'], H008789: ['KOR', 'Zuid-Korea'],
};

/** Kosovo has no M49 entry because it has no UN membership; XKX is the user-assigned code the
 *  rest of this repository already resolves it to (see eurostat-permits). Listed so the m49
 *  cross-check stays strict for the other 238 rather than being loosened for all of them. */
const NOT_IN_M49 = new Set(['XKX']);

/**
 * Codes that are sums over other codes in the same axis. Dropping these is the single
 * highest-stakes decision in this file: they NEST, so naive summation does not merely
 * double-count, it triple-counts parts of Europe.
 *
 * The brief for this adapter listed 13 aggregates (the CategoryGroup 1 "Totalen" block plus
 * Nederland plus Onbekend) and concluded 253 genuine countries. Probing says the deny-list is
 * 13 + these 8, because these eight sit *inside* the country groups where a structural filter
 * on CategoryGroupID cannot see them. Each was confirmed as a rollup by arithmetic against
 * 2026MM07 immigration rather than by its name:
 *   (voormalige) Sovjet-Unie      3,024 = the 15 successor states summed, exactly, and those
 *                                 15 straddle two continents, so it is not a European code
 *   (voormalig) Tsjecho-Slowakije   206 = Tsjechië 78 + Slowakije 127 + the "(oud)" residual 1
 *   (voormalig) Joegoslavië         120 = the seven successor states summed, exactly
 *   Europese Unie (excl. NL)      6,656 | GIPS landen 1,556 | Midden- en Oost-Europese 3,674
 *   Nederlandse Cariben             681 = Aruba 148 + Curaçao 457 + Sint Maarten 42 +
 *                                 Caribisch Nederland 34, all four of which are also listed
 *                                 individually in the Amerika group
 *   Nederlandse Antillen (oud)        0 today, but a rollup over the same islands
 * Keeping all eight would have added 15,917 phantom people to a 23,148-person month.
 */
const ROLLUPS = {
  H007935: 'Europese Unie (exclusief Nederland)',
  H007936: 'GIPS landen in de EU',
  H007937: 'Midden- en Oost-Europese landen in de EU',
  H007069: '(voormalig) Joegoslavië',
  H007204: '(voormalig) Tsjecho-Slowakije',
  H007172: '(voormalige) Sovjet-Unie',
  H007119: 'Nederlandse Cariben',
  H007128: 'Nederlandse Antillen (oud)',
};

/**
 * Real, non-overlapping partition members that have no ISO 3166-1 alpha-3 to key on. They are
 * NOT rollups — the reconciliation below proves it, because the national total only balances
 * when their values are counted as a residual. Dropping them silently would leave the map
 * short by an unstated amount, so they are summed into a residual and reported.
 *
 * "Tsjecho-Slowakije (oud)" is the live example: 1 immigration in 2026MM07, a person whose
 * recorded origin is a state that stopped existing in 1992 and who cannot be assigned to
 * Czechia or Slovakia. There is no alpha-3 for that. CSK, SUN, YUG, SCG and ANT are all
 * ISO 3166-3 *former* codes and are absent from scripts/m49.json by design.
 */
const NO_ISO3 = {
  H007071: 'Federale Republiek Joegoslavië',
  H007072: 'Joegoslavië (oud)',
  H008646: 'Kanaaleilanden',            // Channel Islands: M49 830, no alpha-3; GGY/JEY are separate
  H008665: 'Macedonië',                 // retired in favour of H008825, null in every month
  H008725: 'Rusland (oud)',
  H008737: 'Servië en Montenegro',
  H007186: 'Sovjet-Unie (oud)',
  H007207: 'Tsjecho-Slowakije (oud)',
  H008752: 'Swaziland',                 // retired in favour of H008830 Eswatini
};

/**
 * CategoryGroupIDs that carry no mappable country. They are handled differently from each
 * other, which is the whole point of reading .../CategoryGroups instead of hardcoding codes:
 *
 *   1 "Totalen"   — 11 codes, ALL of them sums: Totaal, Buiten Nederland, Europa (excl. NL),
 *                   Buiten Europa, the four continents and three "(exclusief X)" variants.
 *                   Denied wholesale, so a twelfth aggregate CBS adds here needs no edit.
 *   2 "Nederland" — the single Dutch-origin code. Not an aggregate: it is a real partition
 *                   member that the national total needs, but NLD is the reporter, not an
 *                   origin on this map, so it counts towards the identity and not the rows.
 *   8 "Onbekend"  — origin not established. Same treatment as group 2, and a real 0 rather
 *                   than a null in 2026MM07, which is why it cannot simply be ignored.
 */
const AGGREGATE_GROUP = 1;
const PARTITION_ONLY_GROUPS = new Set([2, 8]);
const NON_COUNTRY_GROUPS = new Set([AGGREGATE_GROUP, ...PARTITION_ONLY_GROUPS]);

const say = (s) => console.log(`cbs   ${s}`);

/**
 * opendata.cbs.nl answers node's fetch with HTTP 406 and an empty body regardless of headers,
 * and answers curl with 200 for the identical URL. fetch is still tried first so the adapter
 * keeps working on a machine where it is not blocked; curl is the path that actually runs
 * here. Both paths reject a non-JSON body explicitly, because the row-cap refusal arrives as
 * plain text labelled application/json.
 */
async function getJson(url) {
  let viaFetch;
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const text = await r.text();
    return parseOrExplain(text, url);
  } catch (e) {
    viaFetch = e.message ?? String(e);
  }
  const { stdout } = await run('curl', ['-sS', '--max-time', '180', url], { maxBuffer: 256 * 1024 * 1024 });
  try {
    return parseOrExplain(stdout, url);
  } catch (e) {
    throw new Error(`${e.message} (node fetch first said: ${viaFetch})`);
  }
}

function parseOrExplain(text, url) {
  try {
    return JSON.parse(text);
  } catch {
    // The 10,000-row cap is the one that bites: HTTP 500, content-type application/json,
    // body a bare English sentence. Surface the sentence, not "Unexpected token E".
    throw new Error(`${url} did not return JSON. Body began: ${text.slice(0, 200).replace(/\s+/g, ' ')}`);
  }
}

/** Every sub-resource of an OData table answers with { value: [...] }, so anything else is a
 *  failure wearing a 200. */
async function odata(path, name) {
  const j = await getJson(BASE + path);
  if (!Array.isArray(j.value)) throw new Error(`${name}: 200 with no value array — ${JSON.stringify(j).slice(0, 200)}`);
  if (j.value.length === 0) throw new Error(`${name}: 200 with a zero-length value array, which is how this API reports a filter that matched nothing`);
  // CBS pads some dimension keys to a fixed width ("3000   " in Geslacht). Trim everything
  // once, here, rather than discovering it as a missing key three layers down.
  for (const row of j.value) for (const k of Object.keys(row)) if (typeof row[k] === 'string') row[k] = row[k].trim();
  return j.value;
}

async function cached(name, fn) {
  const file = `${CACHE}/${name}.json`;
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    const v = await fn();
    await mkdir(CACHE, { recursive: true });
    await writeFile(file, JSON.stringify(v));
    return v;
  }
}

/** '2026MM07' -> '2026-07'. The CBS spelling is not kept as the period label even though the
 *  contract says labels are the producer's: src/vintage.ts parses monthly labels with
 *  /^(\d{4})-(\d{2})$/ in periodEndOf(), and resolvesAt() silently mis-sorts anything it
 *  cannot parse. A label the app cannot read is worse than a reformatted one, and vintage.ts
 *  names '2026-07' as the intended shape in its own header comment. */
const label = (cbsPeriod) => `${cbsPeriod.slice(0, 4)}-${cbsPeriod.slice(6, 8)}`;

/** Last day of a month, computed rather than tabled so February is right in leap years. */
const endOfMonth = (lbl) => {
  const [y, m] = lbl.split('-').map(Number);
  return `${lbl}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`;
};

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

export async function load() {
  /* ---- the table's own vintage stamp, which is also the cache key ----------------------- */
  const info = (await odata('TableInfos', 'TableInfos'))[0];
  if (!info?.Modified || Number.isNaN(Date.parse(info.Modified))) throw new Error(`TableInfos carries no parseable Modified stamp: ${JSON.stringify(info?.Modified)}`);
  if (info.Identifier !== '85484NED') throw new Error(`TableInfos says this is ${info.Identifier}, not 85484NED`);
  CACHE = `${CACHE_ROOT}/${info.Modified.replace(/[^0-9]/g, '')}`;
  say(`table ${info.Identifier} "${info.Title}" modified ${info.Modified}, covering ${info.Period}, output status ${info.OutputStatus}`);

  /* ---- codelists, and the integrity checks that make the crosswalk trustworthy ---------- */
  const [herkomst, groups, perioden, geboorte] = await Promise.all([
    cached('herkomstland', () => odata('Herkomstland', 'Herkomstland')),
    cached('categorygroups', () => odata('CategoryGroups', 'CategoryGroups')),
    cached('perioden', () => odata('Perioden', 'Perioden')),
    cached('geboorteland', () => odata('Geboorteland', 'Geboorteland')),
  ]);

  // Geboorteland having only three codes is why PINS collapses it rather than iterating it.
  // If CBS ever turns it into a country axis this assertion is where that gets noticed.
  if (geboorte.length !== 3) throw new Error(`Geboorteland now has ${geboorte.length} codes, not 3 — it may have become a country axis, in which case pinning it to T001638 is no longer a harmless margin`);

  const titleOf = new Map(herkomst.map((r) => [r.Key, r.Title]));
  const groupOf = new Map(herkomst.map((r) => [r.Key, r.CategoryGroupID]));
  await checkCrosswalk(herkomst, titleOf, groupOf, groups);

  /* ---- periods: monthly only, and chosen by data rather than by codelist position -------- */
  const monthly = perioden.filter((p) => /^\d{4}MM\d{2}$/.test(p.Key)).map((p) => p.Key).sort();
  const annual = perioden.filter((p) => /^\d{4}JJ\d{2}$/.test(p.Key)).map((p) => p.Key);
  if (!monthly.length) throw new Error('Perioden contains no YYYYMM## codes at all');
  say(`periods ${perioden.length} total, ${monthly.length} monthly ${monthly[0]}..${monthly.at(-1)}, ${annual.length} annual dropped (${annual.join(',')}) — the two cadences share this table`);

  const statusOf = new Map(perioden.map((p) => [p.Key, p.Status]));

  /* ---- data, chunked under the 10,000-row cap ------------------------------------------- */
  const perPeriod = herkomst.length;                 // one row per Herkomstland code per period
  const chunk = Math.max(1, Math.floor(9000 / perPeriod));
  const select = ['Perioden', 'Herkomstland', ...Object.values(TOPICS)].join(',');
  const pinFilter = Object.entries(PINS).map(([k, v]) => `${k} eq '${v}'`).join(' and ');

  const raw = [];
  for (let i = 0; i < monthly.length; i += chunk) {
    const slice = monthly.slice(i, i + chunk);
    const q = new URLSearchParams({
      $filter: `(${slice.map((p) => `Perioden eq '${p}'`).join(' or ')}) and ${pinFilter}`,
      $select: select,
    });
    const rows = await cached(`data-${slice[0]}-${slice.at(-1)}`, () => odata(`TypedDataSet?${q}`, `TypedDataSet ${slice[0]}..${slice.at(-1)}`));
    if (rows.length !== slice.length * perPeriod) {
      throw new Error(`TypedDataSet ${slice[0]}..${slice.at(-1)}: ${rows.length} rows, expected ${slice.length * perPeriod} (${slice.length} periods x ${perPeriod} codes) — the cross-product is not dense, so a missing code would read as a country with no migrants`);
    }
    raw.push(...rows);
  }
  say(`fetched ${raw.length} cells in ${Math.ceil(monthly.length / chunk)} request(s) of <=${chunk} periods (a query over 10,000 rows is refused with HTTP 500 and a plain-text body)`);

  /* ---- decode and reconcile, per topic and per period ------------------------------------ */
  const built = {};
  for (const [topicName, field] of Object.entries(TOPICS)) {
    built[topicName] = decode(raw, field, topicName, monthly, titleOf, groupOf);
  }

  /* ---- choose the newest period that actually carries a month's worth of origins ---------- */
  // Immigration and emigration are published in the same row but they are not one series, and
  // a month can be complete in one and thin in the other. So each is gated on its own counts
  // and the OLDER of the two verdicts wins, rather than immigration's verdict being applied to
  // a series it was never measured on.
  const counts = Object.fromEntries(Object.entries(built).map(([t, b]) => [t, periodCounts(b, monthly)]));
  const idx = Math.min(...Object.entries(counts).map(([t, c]) => chooseNewest(c, t)));
  const chosenPeriod = monthly[idx];
  const lbl = label(chosenPeriod);
  const periods = monthly.slice(0, idx + 1).map(label);

  // Falling back has to remove the rejected months from the data, not just from `periods`.
  // build-layers.mjs validates keys and values but never checks a row's periods against the
  // layer's, so a row left carrying the month the gate just rejected would ship it — the thin
  // month would be absent from the axis and still present in the numbers behind it.
  const declared = new Set(periods);
  for (const b of Object.values(built)) {
    for (const [iso, r] of Object.entries(b.rows)) {
      for (const k of Object.keys(r)) if (!declared.has(k)) delete r[k];
      if (!Object.keys(r).length) delete b.rows[iso];
    }
  }

  // Provisional is read off the Perioden codelist, not inferred from the year. CBS states it
  // twice — Status 'Voorlopig' per period, and in the table text "De cijfers tot en met 2025
  // zijn definitief. De cijfers vanaf 2026 zijn voorlopig." The codelist is the machine-
  // readable one, so it is the one used, and it also survives the January in which the rule
  // about which year is provisional changes.
  const status = statusOf.get(chosenPeriod);
  if (!status) throw new Error(`Perioden carries no Status for ${chosenPeriod}`);
  const provisional = status === 'Voorlopig';

  /* ---- how far this classification is from a corridor, measured rather than asserted ------ */
  const bornHere = await nlBornShare(chosenPeriod, select, monthly);

  const vintage = {
    periodEnd: endOfMonth(lbl),
    periodLabel: lbl,
    cadence: 'monthly',
    coverage: [label(monthly[0]), lbl],
    // Municipal population-register events, enumerated and published by the national
    // statistical institute. Not a sample, not a model — but counted by the municipalities
    // and reported onward by CBS, which is what 'reported' means elsewhere in this repo.
    estimateKind: 'reported',
    provisional,
    producer: meta.producer,
    licenceId: meta.licenceId,
    commercialUseClear: meta.commercialUseClear,
  };

  // Two facts about the emigration series that a reader has to have before quoting a cell,
  // both measured here rather than asserted, because "can in principle go negative" is the
  // kind of hedge that hides a real number. Coverage is measured too: `vintage.coverage` is
  // the layer's span, and a handful of origins CBS added to the classification part-way
  // through do not span it.
  const negatives = Object.values(built.emigration.rows)
    .reduce((a, r) => a + Object.values(r).filter((v) => v < 0).length, 0);
  const short = Object.entries(built.immigration.rows)
    .filter(([, r]) => Object.keys(r).length < periods.length)
    .map(([iso, r]) => `${iso} ${Object.keys(r).length}/${periods.length}`);
  if (short.length) say(`${short.length} origin(s) do not span the full coverage — codes CBS added to the classification part-way through: ${short.join(', ')}. Their missing months are absent, not zero.`);

  // The caveat carries a measured number, so it has to be measured on the series it is printed
  // beside: the born-in-NL share is 14.1% of 23,148 on the immigration side and 21.0% of
  // 24,524 on the emigration side for 2026-07. One string pasted into both notes puts an
  // immigration figure, and an immigration month total, under an emigration layer.
  const caveat = (topic, noun) =>
    "Herkomstland is the migrant's own country of birth, or their parents' if they were born " +
    'in the Netherlands, so this is a count of people by origin and not a flow from a place: ' +
    `${bornHere[topic].pct}% of the ${bornHere[topic].total.toLocaleString('en-GB')} ${noun} ` +
    `in ${lbl} were of people born in the Netherlands, and nothing in this table records where ` +
    'any of them travelled from.';

  // Each layer's reporters are counted on its own series at the period actually shipped, which
  // is not necessarily the period that series would have chosen for itself.
  const reportersFor = (topic) => ({ n: counts[topic][idx].n, expected: expectedAt(counts[topic], idx) });

  const layers = [
    {
      id: 'nl-immigration-by-origin',
      title: 'Dutch register: immigration by origin country',
      question: 'How many people of this origin registered as immigrants in the Netherlands this month?',
      unit: 'people',
      entity: 'country',
      rows: built.immigration.rows,
      periods,
      vintage: { ...vintage, reporters: reportersFor('immigration') },
      note: `Immigration is a registration event, not an arrival: a person is counted once a municipality enters them in the population register, which requires an expected stay of at least four months. ${caveat('immigration', 'registrations')}`,
    },
    {
      id: 'nl-emigration-by-origin',
      title: 'Dutch register: emigration by origin country',
      question: 'How many people of this origin left the Dutch register this month?',
      unit: 'people',
      entity: 'country',
      rows: built.emigration.rows,
      periods,
      vintage: { ...vintage, reporters: reportersFor('emigration') },
      note: `This is emigration net of the balance of administrative corrections — CBS's preferred series, because most departures are never declared and surface later as administrative removals — so a cell is a net register movement and not a count of departures, and ${negatives} of the ${Object.values(built.emigration.rows).reduce((a, r) => a + Object.keys(r).length, 0).toLocaleString('en-GB')} cells here are negative. ${caveat('emigration', 'net register departures')}`,
    },
  ];

  for (const l of layers) {
    const topic = l.id.includes('immigration') ? 'immigration' : 'emigration';
    const b = built[topic];
    say(`layer ${l.id.padEnd(26)} ${Object.keys(l.rows).length} origins, ${reportersFor(topic).n} reporting in ${lbl} ` +
        `(trailing median ${reportersFor(topic).expected}), ` +
        `residual (no ISO3) ${b.residual[chosenPeriod] ?? 0} of ${b.total[chosenPeriod]}, ` +
        `${provisional ? 'voorlopig' : 'definitief'}`);
  }

  return { layers };
}

/**
 * Every Herkomstland code must land in exactly one of four buckets, and every ISO3 must be
 * real. A code CBS adds that this file has never seen is a hole in the map that would
 * otherwise show up as nothing at all, so it throws rather than being ignored.
 */
async function checkCrosswalk(herkomst, titleOf, groupOf, groups) {
  const m49 = JSON.parse(await readFile(new URL('../m49.json', import.meta.url), 'utf8'));
  const valid = new Set(Object.values(m49));

  const bad = Object.entries(ISO3).filter(([, [a3]]) => !valid.has(a3) && !NOT_IN_M49.has(a3));
  if (bad.length) throw new Error(`ISO3 table has ${bad.length} alpha-3 code(s) absent from scripts/m49.json: ${bad.map(([k, [a3]]) => `${k}->${a3}`).join(', ')}`);

  const seen = new Map();
  for (const [k, [a3]] of Object.entries(ISO3)) {
    if (seen.has(a3)) throw new Error(`ISO3 table maps both ${seen.get(a3)} and ${k} to ${a3} — two CBS codes for one country would silently overwrite each other`);
    seen.set(a3, k);
  }

  // A code whose title has changed is the one case worth failing on even though the code is
  // known: CBS reuses Hxxxxxx keys across classification revisions, and a reused key is a
  // country quietly becoming a different country.
  const renamed = Object.entries(ISO3).filter(([k, [, nl]]) => titleOf.get(k) !== nl);
  if (renamed.length) throw new Error(`Herkomstland titles moved under these codes, so the crosswalk may no longer mean what it did: ${renamed.map(([k, [a3, nl]]) => `${k} ${a3} was ${JSON.stringify(nl)} now ${JSON.stringify(titleOf.get(k))}`).join('; ')}`);

  // The structural deny rule is only safe while groups 2 and 8 hold exactly the two codes
  // that were read out of the codelist when it was written. If CBS ever files a real country
  // under "Nederland" or "Onbekend", PARTITION_ONLY_GROUPS would drop it off the map without
  // breaking the national identity, because it would still be counted in the sum.
  for (const [group, expected] of [[2, DOMESTIC], [8, UNKNOWN]]) {
    const members = herkomst.filter((r) => r.CategoryGroupID === group).map((r) => r.Key);
    if (members.length !== 1 || members[0] !== expected) throw new Error(`CategoryGroup ${group} now holds [${members.join(', ')}], not just ${expected} — a code added here is counted towards the national total but never reaches the map`);
  }

  const structural = herkomst.filter((r) => NON_COUNTRY_GROUPS.has(r.CategoryGroupID));
  const known = new Set([...structural.map((r) => r.Key), ...Object.keys(ISO3), ...Object.keys(ROLLUPS), ...Object.keys(NO_ISO3)]);
  const orphan = herkomst.filter((r) => !known.has(r.Key));
  if (orphan.length) throw new Error(`${orphan.length} Herkomstland code(s) this adapter has never seen: ${orphan.map((r) => `${r.Key} ${JSON.stringify(r.Title)} (group ${r.CategoryGroupID})`).join('; ')} — classify each as country, rollup or no-ISO3 before shipping, because an unclassified code is either a missing country or a double count`);

  const gone = [...known].filter((k) => !titleOf.has(k));
  if (gone.length) throw new Error(`crosswalk names ${gone.length} code(s) CBS no longer publishes: ${gone.join(', ')}`);

  // A rollup living inside a country group is the trap in one line; naming the groups here
  // makes the log say which structural filter would have missed it.
  const hidden = Object.keys(ROLLUPS).filter((k) => !NON_COUNTRY_GROUPS.has(groupOf.get(k)));
  const totalen = groups.filter((g) => g.DimensionKey === 'Herkomstland' && NON_COUNTRY_GROUPS.has(g.ID)).map((g) => g.Title);
  say(`codelist ${herkomst.length} codes = ${Object.keys(ISO3).length} ISO3 + ${structural.length} in non-country groups (${totalen.join(' / ')}) + ${Object.keys(ROLLUPS).length} rollups + ${Object.keys(NO_ISO3).length} without an alpha-3; ${hidden.length} of the rollups sit inside country groups where CategoryGroupID alone would not catch them`);
}

/**
 * Turn the flat cell list into rows keyed by ISO3, and prove the result against CBS's own
 * total for every period. The identity is:
 *
 *   Totaal = Nederland + Onbekend + sum(ISO3 origins) + sum(origins with no alpha-3)
 *
 * which holds only if the rollups are all out and nothing real has been dropped. It is
 * checked per period, not once for the headline month, because a rollup CBS introduces
 * mid-history would otherwise only be caught in the month somebody happened to look at.
 */
function decode(raw, field, topicName, monthly, titleOf, groupOf) {
  const rows = {};
  const total = {}, residual = {}, parts = {};
  const monthSet = new Set(monthly);

  for (const c of raw) {
    const period = c.Perioden;
    if (!monthSet.has(period)) continue;               // annual YYYYJJ00 rows never reach here
    const code = c.Herkomstland;
    const v = c[field];
    if (code === TOTAL) { total[period] = v; continue; }
    // Two deny paths, kept separate on purpose. The structural one catches the whole Totalen
    // block without naming its members; the explicit one catches the eight rollups hiding
    // inside country groups, which no structural rule can see. Either alone leaves a hole.
    if (groupOf.get(code) === AGGREGATE_GROUP) continue;
    if (code in ROLLUPS) continue;                     // nests; see the ROLLUPS comment
    // null is "no such answer", 0 is "nobody". Only null is dropped, and it is dropped
    // before any arithmetic so that a null never reads as a zero in a sum or on a map.
    if (v === null) continue;
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${topicName} ${period} ${code}: non-numeric value ${JSON.stringify(v)}`);

    parts[period] = (parts[period] ?? 0) + v;
    if (PARTITION_ONLY_GROUPS.has(groupOf.get(code))) continue;   // count towards the identity, never onto the map
    const iso = ISO3[code]?.[0];
    if (iso) {
      (rows[iso] ??= {})[label(period)] = v;
    } else if (code in NO_ISO3) {
      residual[period] = (residual[period] ?? 0) + v;
    } else {
      throw new Error(`${topicName} ${period}: code ${code} ${JSON.stringify(titleOf.get(code) ?? '?')} is neither a mapped country, a rollup nor a known alpha-3 gap`);
    }
  }

  for (const period of monthly) {
    if (!(period in total)) throw new Error(`${topicName}: no ${TOTAL} row for ${period}`);
    if (total[period] === null) continue;              // a month CBS has not filled in at all
    if (parts[period] !== total[period]) {
      throw new Error(`${topicName} ${period}: kept codes sum to ${parts[period]} but CBS's own Totaal is ${total[period]} (difference ${parts[period] - total[period]}). A positive difference means a nesting aggregate is still in the deny-list gap; a negative one means a real origin was dropped.`);
    }
  }
  return { rows, total, residual };
}

/**
 * Origins actually reporting in each month. "Reporters" means origin countries carrying a
 * figure, since this table has exactly one reporting country.
 *
 * A zero is NOT a reporter here, and that distinction is the whole guard. CBS returns a dense
 * cross-product: every one of the 269 Herkomstland codes gets a cell in every month, filled
 * with 0 where nobody moved. Counting cells that merely exist therefore counts the codelist,
 * not the month — measured across the 55 months live on 2026-09-20 it is 236 or 239 in every
 * single one, while the origins that actually carry a figure swing 163..192 and the monthly
 * total swings 18,062..48,447. A gate built on the dense count cannot fall back, ever: a
 * doctored 2026MM07 carrying 61 people across two origins (with Totaal reduced to match, so
 * the per-period identity still balances) passed it and shipped as the newest period.
 */
function periodCounts(built, monthly) {
  return monthly.map((p) => {
    const lbl = label(p);
    const v = Object.values(built.rows);
    return { period: p, n: v.filter((r) => r[lbl] != null && r[lbl] !== 0).length };
  });
}

/** The count a month is held to: the median of the 12 months before it, or of the whole series
 *  at the start. Split out because the shipped period may be one topic's fallback, and the
 *  other topic's reporters then have to be re-measured at that index rather than at its own. */
function expectedAt(counts, i) {
  const trailing = counts.slice(Math.max(0, i - 12), i).map((c) => c.n);
  return Math.round(median(trailing.length ? trailing : counts.map((c) => c.n)));
}

/**
 * The newest code in Perioden is not necessarily a period with a month's worth of data — the
 * same failure the contract records for Eurostat's lastTimePeriod, in a different dress. Walk
 * back from the end until a month carries at least 80% of the trailing median reporter count.
 * Returns the index so the caller can take the older verdict across the two topics.
 */
function chooseNewest(counts, topicName) {
  for (let i = counts.length - 1; i >= 0; i--) {
    const expected = expectedAt(counts, i);
    if (counts[i].n >= 0.8 * expected) {
      if (i !== counts.length - 1) {
        say(`${topicName}: newest period fell back from ${counts.at(-1).period} to ${counts[i].period} — the later month(s) carried ${counts.slice(i + 1).map((c) => c.n).join('/')} reporting origins against a trailing median of ${expected}`);
      }
      return i;
    }
  }
  throw new Error(`${topicName}: no monthly period carries a plausible number of reporting origin countries`);
}

/**
 * The share of the newest month who were born in the Netherlands — per topic, because the two
 * sides differ (14.1% of immigration and 21.0% of emigration in 2026-07) and a note carrying
 * the other series' figure is a wrong number in user-facing text. Both come out of the same
 * two calls, since $select already asks for both topics.
 *
 * This is the cheapest hard number that shows Herkomstland is not a corridor. It is computed
 * at build time and interpolated into the layer note rather than written into it, because a
 * figure written down goes stale and a note nobody re-derives is how a stale figure survives
 * review.
 */
async function nlBornShare(period, select, monthly) {
  const one = async (cacheName, geboorteland, what) => {
    const q = new URLSearchParams({
      $filter: `Perioden eq '${period}' and Geslacht eq '${PINS.Geslacht}' and Geboorteland eq '${geboorteland}' and Herkomstland eq '${TOTAL}'`,
      $select: select,
    });
    const rows = await cached(cacheName, () => odata(`TypedDataSet?${q}`, `TypedDataSet ${what} ${period}`));
    // Every dimension is pinned, so one row is the only correct answer. A misspelt dimension
    // NAME is silently dropped by this API and answers 200 with the un-pinned cross-product
    // (Geslachtt eq 'T001038' returned 807 rows instead of 269 on 2026-09-20), and with
    // $orderby ignored there is no row order to lean on — so rows[0] would be an arbitrary
    // slice of a different margin rather than the figure asked for.
    if (rows.length !== 1) throw new Error(`${what} ${period}: ${rows.length} rows for a fully pinned cell, expected 1 — a dimension name this query pins may no longer exist, in which case CBS drops the clause instead of failing`);
    return rows[0];
  };
  const here = await one(`nlborn-${period}`, 'A051735', 'born-in-NL');
  const all = await one(`nltotal-${period}`, PINS.Geboorteland, 'total');

  const out = {};
  for (const [topicName, field] of Object.entries(TOPICS)) {
    const n = here[field], t = all[field];
    if (!(t > 0) || !(n >= 0) || n > t) throw new Error(`born-in-NL share of ${topicName} for ${period} is not a share: ${n} of ${t}`);
    out[topicName] = { pct: ((n / t) * 100).toFixed(1), total: t, born: n };
  }
  if (monthly.at(-1) !== period) say(`born-in-NL share measured at ${period}, the chosen period, not the codelist tail`);
  return out;
}
