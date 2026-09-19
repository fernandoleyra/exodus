// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
import type { DiffClass } from './stats';

export interface SeriesMeta {
  id: string;
  label: string;
  producer: string;
  /** How the number came to exist. `observed` is a count, `reported` is a national
   *  submission, `modelled` is an estimate. The distinction drives what a gap means. */
  kind: 'observed' | 'reported' | 'modelled';
  method: string;
}

export interface PairResult {
  a: string;
  b: string;
  n: number;
  medianRatio: number;
  spreadPct: number;
  rankRho: number | null;
  cls: DiffClass;
  quantiles: number[];
  /** Entries material enough on both sides to appear in the outlier table. */
  materialN: number;
  /** The lower-quartile floor applied to each side before picking outliers. */
  floors: [number, number];
  worst: { key: string; ratio: number }[];
}

export interface Measure {
  id: string;
  title: string;
  question: string;
  year: number;
  unit: string;
  entity: 'country' | 'corridor';
  scope: string;
  note: string;
  series: SeriesMeta[];
  pairs: PairResult[];
  labels: Record<string, string>;
  values: Record<string, Record<string, number>>;
}

export interface Concordance {
  measures: Measure[];
}
