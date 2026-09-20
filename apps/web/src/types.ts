/** Estimate kind is a visual channel you cannot turn off. It is never decorative. */
export type EstimateKind = 'observed' | 'modelled' | 'absent';
export type LatencyClass = 'annual' | 'quinquennial' | 'modelled';

export interface Place {
  iso3: string; name: string; centroid: [number, number];
  pop: number | null; popYear: number | null;
  stock: number | null; stockYear: number | null;
  unemp: number | null; unempYear: number | null;
  gdppc: number | null; gdppcYear: number | null;
  /** Real: share of indicators this country reports, discounted by staleness. Drives arc opacity. */
  coverage: number;
  indicatorsPresent: number;
  /** Service stocks for the headroom model, each with its own observation year. */
  beds: number | null; bedsYear: number | null;
  phys: number | null; physYear: number | null;
  emp: number | null; empYear: number | null;
  ptr: number | null; ptrYear: number | null;
}

export interface Corridor {
  o: number; d: number;
  /** One value per year, 1990..2023, from the spine. A flipbook, not an interpolation. */
  v: number[];
  /** Model A and model B period totals, on the shared 5-year grid. null where that model
   *  says nothing. The landing renders both so divergence is seen, not asserted. */
  a5: (number | null)[];
  b5: (number | null)[];
  /** Cross-model disagreement per 5-year period, |a−b| / mean.
   *  null where the second model says nothing — never interpolated across that gap. */
  dpp: (number | null)[];
  /** Model-internal spread (the spine's own std/mean). A different thing from dpp;
   *  never conflate them. */
  spread: number | null;
  /** min(coverage_origin, coverage_dest). Rendered as opacity. */
  cov: number;
}

export interface SourceRec {
  id: string; title: string; licence: string;
  estimateKind: EstimateKind; latencyClass: LatencyClass; vintage: string; note: string;
}

export interface Benchmark { value: number; n: number }

export interface Manifest {
  benchmarks?: { beds: Benchmark | null; phys: Benchmark | null; emp: Benchmark | null; ptr: Benchmark | null };
  modelScaleRatio?: number;
  builtFrom: string; corridorCount: number; placeCount: number;
  yearRange: [number, number]; periodStarts: number[];
  corridorsWithSecondModel: number;
  sources: SourceRec[];
  disputedRenderedWithoutData: string[];
}

/**
 * The newest five-year window at or before this year, or -1 if the year precedes them all.
 *
 * This replaced a strict "which window is this year INSIDE", which returned -1 from 2020
 * because the windows stop in 2015 — so the disagreement surface emptied the globe and the
 * halos disappeared, with the only explanation a hint in the corner of the timeline. Holding
 * the last window is continuous; naming it is what keeps it honest, and every reader of this
 * function has to do that. The surface says so in the panel, the halos in their chip.
 */
export function periodAtOrBefore(periodStarts: number[], year: number): number {
  let idx = -1;
  for (let i = 0; i < periodStarts.length; i++) if (periodStarts[i]! <= year) idx = i;
  return idx;
}

/**
 * The index into a corridor's annual array for a cursor year, clamped to the spine's frames.
 *
 * The cursor runs to 2026 because other layers reach that far; the spine's annual frames stop
 * at 2023. Reading v[36] gives undefined, which every caller turned into 0 — so the arcs
 * vanished, the choropleth emptied and the inspector reported no arrivals, three
 * different-looking failures with one cause, all at the year the reader crossed. Holding the
 * last frame and naming it is the rule catalogue.resolve applies to every other layer, and
 * this is that rule for the spine. It lives here, once, because it drifted when it did not.
 */
export function spineFrame(range: [number, number], year: number): number {
  const [min, max] = range;
  return Math.min(Math.max(year, min), max) - min;
}
