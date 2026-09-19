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
}

export interface Corridor {
  o: number; d: number;
  /** One value per year, 1990..2023, from the spine. A flipbook, not an interpolation. */
  v: number[];
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

export interface Manifest {
  builtFrom: string; corridorCount: number; placeCount: number;
  yearRange: [number, number]; periodStarts: number[];
  corridorsWithSecondModel: number;
  sources: SourceRec[];
  disputedRenderedWithoutData: string[];
}

/** Which 5-year period a year falls in, or -1 when the second model has no grid there. */
export function periodIndex(periodStarts: number[], year: number): number {
  for (let i = periodStarts.length - 1; i >= 0; i--) {
    const s = periodStarts[i]!;
    if (year >= s && year < s + 5) return i;
  }
  return -1;
}
