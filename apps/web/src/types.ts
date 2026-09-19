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
  /** One value per year, 1990..2023. A flipbook, not an interpolation. */
  v: number[];
  /** Cross-model disagreement, |a−b| / mean. Rendered as the uncertainty envelope. */
  dp: number;
  /** min(coverage_origin, coverage_dest). Rendered as opacity. */
  cov: number;
}

export interface SourceRec {
  id: string; title: string; licence: string;
  estimateKind: EstimateKind; latencyClass: LatencyClass; vintage: string; note: string;
}

export interface Manifest {
  builtFrom: string; corridorCount: number; placeCount: number;
  yearRange: [number, number]; sources: SourceRec[];
  disputedRenderedWithoutData: string[];
}
