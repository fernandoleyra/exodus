// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Eurostat's two-letter `geo` and `citizen` codes, resolved to ISO-3166-1 alpha-3.
//
// This lives in its own file because two adapters need it and getting it wrong is silent:
// `places.json` and the globe are keyed by ISO3, so a layer keyed by two-letter codes loads,
// validates on every other axis, and paints an entirely empty world. That is exactly what
// happened to the protection layers, which is why build-layers.mjs now checks key shape and
// why this table is shared rather than copied.
//
// Eurostat departs from the standard in two places and both are in here: EL is Greece and UK
// is the United Kingdom. The table is hardcoded rather than fetched so the snapshot still
// rebuilds from a clean clone without a second network dependency, and it is re-checked
// against scripts/m49.json at load time so a typo cannot survive.
import { readFile } from 'node:fs/promises';

export const ISO3 = {
  AD:'AND', AE:'ARE', AF:'AFG', AG:'ATG', AL:'ALB', AM:'ARM', AO:'AGO', AR:'ARG', AT:'AUT',
  AU:'AUS', AZ:'AZE', BA:'BIH', BB:'BRB', BD:'BGD', BE:'BEL', BF:'BFA', BG:'BGR', BH:'BHR',
  BI:'BDI', BJ:'BEN', BN:'BRN', BO:'BOL', BR:'BRA', BS:'BHS', BT:'BTN', BW:'BWA', BY:'BLR',
  BZ:'BLZ', CA:'CAN', CD:'COD', CF:'CAF', CG:'COG', CH:'CHE', CI:'CIV', CK:'COK', CL:'CHL',
  CM:'CMR', CN:'CHN', CO:'COL', CR:'CRI', CU:'CUB', CV:'CPV', CY:'CYP', CZ:'CZE', DE:'DEU',
  DJ:'DJI', DK:'DNK', DM:'DMA', DO:'DOM', DZ:'DZA', EC:'ECU', EE:'EST', EG:'EGY', EH:'ESH',
  EL:'GRC', ER:'ERI', ES:'ESP', ET:'ETH', FI:'FIN', FJ:'FJI', FM:'FSM', FR:'FRA', GA:'GAB',
  GD:'GRD', GE:'GEO', GH:'GHA', GM:'GMB', GN:'GIN', GQ:'GNQ', GT:'GTM', GW:'GNB', GY:'GUY',
  HN:'HND', HR:'HRV', HT:'HTI', HU:'HUN', ID:'IDN', IE:'IRL', IL:'ISR', IN:'IND', IQ:'IRQ',
  IR:'IRN', IS:'ISL', IT:'ITA', JM:'JAM', JO:'JOR', JP:'JPN', KE:'KEN', KG:'KGZ', KH:'KHM',
  KI:'KIR', KM:'COM', KN:'KNA', KP:'PRK', KR:'KOR', KW:'KWT', KZ:'KAZ', LA:'LAO', LB:'LBN',
  LC:'LCA', LI:'LIE', LK:'LKA', LR:'LBR', LS:'LSO', LT:'LTU', LU:'LUX', LV:'LVA', LY:'LBY',
  MA:'MAR', MC:'MCO', MD:'MDA', ME:'MNE', MG:'MDG', MH:'MHL', MK:'MKD', ML:'MLI', MM:'MMR',
  MN:'MNG', MR:'MRT', MT:'MLT', MU:'MUS', MV:'MDV', MW:'MWI', MX:'MEX', MY:'MYS', MZ:'MOZ',
  NA:'NAM', NE:'NER', NG:'NGA', NI:'NIC', NL:'NLD', NO:'NOR', NP:'NPL', NR:'NRU', NZ:'NZL',
  OM:'OMN', PA:'PAN', PE:'PER', PG:'PNG', PH:'PHL', PK:'PAK', PL:'POL', PS:'PSE', PT:'PRT',
  PW:'PLW', PY:'PRY', QA:'QAT', RO:'ROU', RS:'SRB', RU:'RUS', RW:'RWA', SA:'SAU', SB:'SLB',
  SC:'SYC', SD:'SDN', SE:'SWE', SG:'SGP', SI:'SVN', SK:'SVK', SL:'SLE', SM:'SMR', SN:'SEN',
  SO:'SOM', SR:'SUR', SS:'SSD', ST:'STP', SV:'SLV', SY:'SYR', SZ:'SWZ', TD:'TCD', TG:'TGO',
  TH:'THA', TJ:'TJK', TL:'TLS', TM:'TKM', TN:'TUN', TO:'TON', TR:'TUR', TT:'TTO', TV:'TUV',
  TW:'TWN', TZ:'TZA', UA:'UKR', UG:'UGA', UK:'GBR', US:'USA', UY:'URY', UZ:'UZB', VA:'VAT',
  VC:'VCT', VE:'VEN', VN:'VNM', VU:'VUT', WS:'WSM', XK:'XKX', YE:'YEM', ZA:'ZAF', ZM:'ZMB',
  ZW:'ZWE',
};

/** Kosovo has no M49 entry because it has no UN membership; XKX is the user-assigned code
 *  the World Bank, the IMF and Eurostat's own XK all resolve to. Listing it here keeps the
 *  m49 cross-check strict for the other 198 instead of loosening it for all of them. */
const NOT_IN_M49 = new Set(['XKX']);

export async function checkIso3() {
  const m49 = JSON.parse(await readFile(new URL('../m49.json', import.meta.url), 'utf8'));
  const valid = new Set(Object.values(m49));
  const bad = Object.entries(ISO3).filter(([, a3]) => !valid.has(a3) && !NOT_IN_M49.has(a3));
  if (bad.length) throw new Error(`ISO3 table has ${bad.length} alpha-3 code(s) absent from scripts/m49.json: ${bad.map(([a2, a3]) => `${a2}->${a3}`).join(', ')}`);
  const seen = new Map();
  for (const [a2, a3] of Object.entries(ISO3)) {
    if (seen.has(a3)) throw new Error(`ISO3 table maps both ${seen.get(a3)} and ${a2} to ${a3}`);
    seen.set(a3, a2);
  }
  return ISO3;
}

/**
 * Resolve a two-letter code, or return null for anything that is not one.
 *
 * A code is an aggregate unless it is exactly two letters — stronger than an enumerated
 * deny-list because it also catches the ones nobody has met yet: EU27_2020, EU28, EA20 and
 * EA21 on geo, and on citizen the nesting set that makes a naive sum read about three times
 * the truth.
 */
export function toIso3(code) {
  if (!/^[A-Z]{2}$/.test(code)) return null;
  return ISO3[code] ?? null;
}
