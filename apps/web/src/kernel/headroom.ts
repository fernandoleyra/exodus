/** "How many more could a country hold?"
 *
 *  There is no single number, and a product that prints one is lying.
 *
 *  This returns a Liebig minimum — but ONLY over axes where the arithmetic is valid. A
 *  per-capita stock (beds or physicians per 1,000) can be converted to persons by
 *  multiplying by population. A pupil-teacher RATIO and an employment RATE cannot: their
 *  denominators are primary enrolment and the working-age population, neither of which the
 *  snapshot carries. Multiplying them by total population produced absurdities — Cuba's
 *  schooling term came out at 118% of its entire population per year — so those two axes now
 *  ship as CONTEXT with no headroom value, and say why.
 */
import type { Place } from '../types';

export const HEADROOM_INDICATORS = ['beds', 'physicians', 'schooling', 'employment'] as const;
export type HeadroomIndicator = (typeof HEADROOM_INDICATORS)[number];

export interface Benchmark { value: number; n: number }
export interface Benchmarks {
  beds: Benchmark | null; phys: Benchmark | null; emp: Benchmark | null; ptr: Benchmark | null;
}

export interface IndicatorRow {
  readonly id: HeadroomIndicator;
  readonly label: string;
  readonly observed: number | null;
  readonly observedYear: number | null;
  readonly target: number | null;
  readonly unit: string;
  /** Persons PER YEAR, or null where the conversion is not dimensionally valid. */
  readonly headroomPersonsPerYear: number | null;
  /** Why the target is what it is, rendered next to it. Never a bare number. */
  readonly basis: string;
  /** Set when this axis is shown for context only and excluded from the minimum. */
  readonly excludedBecause: string | null;
  readonly estimateKind: 'observed' | 'modelled';
}

export type HeadroomResult =
  | { kind: 'ok'; bindingIndicator: HeadroomIndicator; bindingLabel: string;
      headroomPersonsPerYear: number; perIndicator: IndicatorRow[]; horizonYears: number; caveat: string }
  | { kind: 'refusal'; code: 'NoServiceStockData'; reason: string; perIndicator: IndicatorRow[] };

const HORIZON = 10;

export function headroom(place: Place, b: Benchmarks | null): HeadroomResult {
  const bench = (x: Benchmark | null | undefined, what: string) =>
    x ? { target: x.value, basis: `median of the ${x.n} countries that report ${what}` } : { target: null, basis: 'no benchmark available' };

  const perCapita = (observed: number | null, target: number | null): number | null => {
    if (observed == null || target == null || place.pop == null || place.pop <= 0 || target <= 0) return null;
    // (ratio - 1) x population / horizon. Valid only because the stock's own denominator IS
    // population, so the units cancel to persons per year.
    return Math.round(((observed / target - 1) * place.pop) / HORIZON);
  };

  const bBeds = bench(b?.beds, 'hospital beds');
  const bPhys = bench(b?.phys, 'physicians');
  const bPtr = bench(b?.ptr, 'a pupil-teacher ratio');
  const bEmp = bench(b?.emp, 'an employment rate');

  const rows: IndicatorRow[] = [
    {
      id: 'beds', label: 'Hospital beds', unit: 'per 1,000',
      observed: place.beds, observedYear: place.bedsYear,
      target: bBeds.target, basis: bBeds.basis,
      headroomPersonsPerYear: perCapita(place.beds, bBeds.target),
      excludedBecause: null, estimateKind: 'observed',
    },
    {
      id: 'physicians', label: 'Physicians', unit: 'per 1,000',
      observed: place.phys, observedYear: place.physYear,
      target: bPhys.target, basis: bPhys.basis,
      headroomPersonsPerYear: perCapita(place.phys, bPhys.target),
      excludedBecause: null, estimateKind: 'observed',
    },
    {
      id: 'schooling', label: 'Pupils per teacher', unit: 'ratio',
      observed: place.ptr, observedYear: place.ptrYear,
      target: bPtr.target, basis: bPtr.basis,
      headroomPersonsPerYear: null,
      excludedBecause: 'its denominator is primary enrolment, not population, so it cannot be converted to persons here',
      estimateKind: 'observed',
    },
    {
      id: 'employment', label: 'Employment rate', unit: '% of 15+',
      observed: place.emp, observedYear: place.empYear,
      target: bEmp.target, basis: bEmp.basis,
      headroomPersonsPerYear: null,
      excludedBecause: 'its denominator is the working-age population, which the snapshot does not carry — and it is a modelled ILO estimate, not a reported stock',
      estimateKind: 'modelled',
    },
  ];

  const usable = rows.filter((r) => r.headroomPersonsPerYear != null);
  if (usable.length < 2) {
    return {
      kind: 'refusal', code: 'NoServiceStockData', perIndicator: rows,
      reason: `${place.name} publishes ${usable.length} of the 2 per-capita service stocks this model can convert to persons. `
        + `A binding constraint cannot be identified from fewer than two, and imputing the missing one would invent the answer.`,
    };
  }
  const binding = usable.reduce((a, c) =>
    (a.headroomPersonsPerYear! <= c.headroomPersonsPerYear! ? a : c));
  return {
    kind: 'ok',
    bindingIndicator: binding.id,
    bindingLabel: binding.label,
    headroomPersonsPerYear: binding.headroomPersonsPerYear!,
    perIndicator: rows,
    horizonYears: HORIZON,
    caveat: 'A Liebig minimum over two per-capita health stocks, against a benchmark that is '
      + 'simply the median of reporting countries — a descriptive choice, not a standard. It is '
      + 'not a forecast. It models no housing, prices, wages, politics or second-order effects, '
      + 'and it says nothing about whether a country should admit anyone.',
  };
}
