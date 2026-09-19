/** "How much workforce can a country hold?"
 *
 *  There is no single number, and a product that prints one is lying. This returns a Liebig
 *  minimum over service stocks, ALWAYS naming the binding constraint, never collapsing to a
 *  scalar, and returning a typed refusal when the stocks are not published.
 *
 *  A negative value is a service deficit that already exists — not spare capacity.
 */
import type { Place } from '../types';

export const HEADROOM_INDICATORS = ['housing_proxy', 'schooling', 'primary_care', 'labour'] as const;
export type HeadroomIndicator = (typeof HEADROOM_INDICATORS)[number];

export interface Assumption {
  readonly id: HeadroomIndicator;
  readonly label: string;
  readonly unit: string;
  /** The stock level the country is being held to. Editable: this is a policy choice. */
  readonly target: number;
  readonly horizonYears: number;
  readonly source: string;
  /** true when a HIGHER observed value means MORE capacity. */
  readonly higherIsBetter: boolean;
}

export const DEFAULT_ASSUMPTIONS: readonly Assumption[] = [
  { id: 'primary_care',  label: 'Hospital beds',   unit: 'per 1,000', target: 3.0,  horizonYears: 10, source: 'World Bank SH.MED.BEDS.ZS; target ≈ EU median', higherIsBetter: true },
  { id: 'housing_proxy', label: 'Physicians',      unit: 'per 1,000', target: 3.2,  horizonYears: 10, source: 'World Bank SH.MED.PHYS.ZS; target ≈ EU median', higherIsBetter: true },
  { id: 'schooling',     label: 'Pupils per teacher', unit: 'ratio',  target: 20,   horizonYears: 10, source: 'World Bank SE.PRM.ENRL.TC.ZS; target = UNESCO guideline', higherIsBetter: false },
  { id: 'labour',        label: 'Employment rate', unit: '% of 15+',  target: 60,   horizonYears: 10, source: 'World Bank SL.EMP.TOTL.SP.ZS; target ≈ OECD median', higherIsBetter: true },
];

export interface IndicatorRow {
  readonly id: HeadroomIndicator;
  readonly label: string;
  readonly observed: number | null;
  readonly observedYear: number | null;
  readonly target: number;
  readonly unit: string;
  /** Persons PER YEAR. Negative means the country is already below its own target. */
  readonly headroomPersonsPerYear: number | null;
  readonly source: string;
}

export type HeadroomResult =
  | { kind: 'ok'; bindingIndicator: HeadroomIndicator; bindingLabel: string;
      headroomPersonsPerYear: number; perIndicator: IndicatorRow[]; caveat: string }
  | { kind: 'refusal'; code: 'NoServiceStockData'; reason: string; perIndicator: IndicatorRow[] };

function rowFor(a: Assumption, place: Place): IndicatorRow {
  const pick = (): [number | null, number | null] => {
    switch (a.id) {
      case 'primary_care':  return [place.beds ?? null, place.bedsYear ?? null];
      case 'housing_proxy': return [place.phys ?? null, place.physYear ?? null];
      case 'schooling':     return [place.ptr ?? null, place.ptrYear ?? null];
      case 'labour':        return [place.emp ?? null, place.empYear ?? null];
    }
  };
  const [observed, observedYear] = pick();
  let h: number | null = null;
  if (observed != null && place.pop != null && place.pop > 0) {
    // ratio = how far the observed stock exceeds the target, in the direction that means
    // "more capacity". Headroom = (ratio − 1) · population / horizon, in persons per year.
    const ratio = a.higherIsBetter ? observed / a.target : a.target / observed;
    h = ((ratio - 1) * place.pop) / a.horizonYears;
  }
  return { id: a.id, label: a.label, observed, observedYear, target: a.target, unit: a.unit,
           headroomPersonsPerYear: h == null ? null : Math.round(h), source: a.source };
}

export function headroom(place: Place, assumptions: readonly Assumption[] = DEFAULT_ASSUMPTIONS): HeadroomResult {
  const perIndicator = assumptions.map((a) => rowFor(a, place));
  const usable = perIndicator.filter((r) => r.headroomPersonsPerYear != null);

  // A headroom figure from one stock is not a headroom figure. Require at least three.
  if (usable.length < 3) {
    return {
      kind: 'refusal', code: 'NoServiceStockData', perIndicator,
      reason: `${place.name} publishes ${usable.length} of ${assumptions.length} service stocks. `
        + `A binding constraint cannot be identified from fewer than three, and imputing the `
        + `missing ones would invent the answer.`,
    };
  }
  const binding = usable.reduce((a, b) =>
    (a.headroomPersonsPerYear! <= b.headroomPersonsPerYear! ? a : b));
  return {
    kind: 'ok',
    bindingIndicator: binding.id,
    bindingLabel: binding.label,
    headroomPersonsPerYear: binding.headroomPersonsPerYear!,
    perIndicator,
    caveat: 'A Liebig minimum over published service stocks under stated, editable targets. '
      + 'It is not a forecast. It models no prices, wages, politics or second-order effects, '
      + 'and it says nothing about whether a country should admit anyone.',
  };
}
