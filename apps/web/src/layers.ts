// SPDX-FileCopyrightText: Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
/** The layer system: what can be painted on the planet, and how it is coloured.
 *
 *  Two independent channels. ONE surface layer at a time, because two colour fields on one
 *  surface cannot both be read. Overlays stack freely, because they use different visual
 *  channels (line, halo, height) and do not compete for the same pixels.
 */
import type { Corridor, Place } from './types';

/* ---------- ramps ----------
 * Sequential: one hue, monotone lightness, uniform steps of ~0.095 in OKLab L, anchored so
 * that "near zero" recedes into the dark surface and high values emit light.
 * Diverging: two hues with a NEUTRAL midpoint, equal arms — never a hue at the middle,
 * because a coloured midpoint reads as a value rather than as "no difference".
 */
export const SEQ = ['#104281', '#1c5cab', '#2a78d6', '#5598e7', '#86b6ef', '#b7d3f6'];
export const DIV_NEG = ['#8f2020', '#b53030', '#d03b3b', '#e66767', '#f0a0a0'];
export const DIV_MID = '#4a4a46';
export const DIV_POS = ['#9ec5f4', '#5598e7', '#2a78d6', '#1c5cab', '#104281'].reverse();

/** Never the low end of a ramp. A country with no data must not look like a country with
 *  a small value — that is the single most common lie a choropleth tells. */
export const NO_DATA_FILL: [number, number, number] = [26, 33, 42];
export const NO_DATA_LINE: [number, number, number] = [72, 86, 102];

export const hexToRgb = (h: string): [number, number, number] =>
  [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

export type SurfaceId =
  | 'none' | 'inbound' | 'outbound' | 'net' | 'stockshare' | 'disagreement' | 'coverage';

export interface SurfaceSpec {
  id: SurfaceId;
  name: string;
  short: string;
  /** What the reader is actually looking at, in one line. */
  what: string;
  kind: 'sequential' | 'diverging' | 'none';
  estimate: 'modelled' | 'observed' | 'derived';
  unit: string;
  /** Formats a value for the legend and the tooltip. */
  fmt: (v: number) => string;
}

export const SURFACES: SurfaceSpec[] = [
  { id: 'none', name: 'No surface layer', short: 'Off', what: 'Geometry only.',
    kind: 'none', estimate: 'observed', unit: '', fmt: () => '' },
  { id: 'inbound', name: 'Arrivals', short: 'In', kind: 'sequential', estimate: 'modelled',
    what: 'People arriving, summed over every corridor ending here in the selected year.',
    unit: 'people / yr', fmt: (v) => Math.round(v).toLocaleString('en-US') },
  { id: 'outbound', name: 'Departures', short: 'Out', kind: 'sequential', estimate: 'modelled',
    what: 'People leaving, summed over every corridor starting here in the selected year.',
    unit: 'people / yr', fmt: (v) => Math.round(v).toLocaleString('en-US') },
  { id: 'net', name: 'Net balance', short: 'Net', kind: 'diverging', estimate: 'modelled',
    what: 'Arrivals minus departures. Blue gains, red loses, grey is balanced.',
    unit: 'people / yr', fmt: (v) => (v > 0 ? '+' : '') + Math.round(v).toLocaleString('en-US') },
  { id: 'stockshare', name: 'Foreign-born share', short: 'Share', kind: 'sequential', estimate: 'modelled',
    what: 'Migrant stock as a share of population. A stock, not a flow.',
    unit: '% of population', fmt: (v) => `${(v * 100).toFixed(1)}%` },
  { id: 'disagreement', name: 'Model disagreement', short: 'Argue', kind: 'sequential', estimate: 'derived',
    what: 'How far the two published models differ across this country’s corridors.',
    unit: 'relative difference', fmt: (v) => `${Math.round(v * 100)}%` },
  { id: 'coverage', name: 'Reporting completeness', short: 'Cover', kind: 'sequential', estimate: 'derived',
    what: 'How much this country actually reports. Not a measure of its migration.',
    unit: 'of 4 indicators', fmt: (v) => `${Math.round(v * 100)}%` },
];

export interface Overlays {
  corridors: boolean;
  halos: boolean;
  columns: boolean;
  borders: boolean;
}
export const DEFAULT_OVERLAYS: Overlays = { corridors: true, halos: true, columns: false, borders: true };

export interface Filters {
  /** Hide corridors below this share of the largest in the current year. */
  minVolume: number;
  /** Show only corridors a second model has checked. */
  corroboratedOnly: boolean;
}
export const DEFAULT_FILTERS: Filters = { minVolume: 0, corroboratedOnly: false };

/** Per-country values for every surface layer, computed once per year. */
export interface PlaceMetrics {
  inbound: number | null;
  outbound: number | null;
  net: number | null;
  stockshare: number | null;
  disagreement: number | null;
  coverage: number | null;
}

export function computeMetrics(
  places: Place[], corridors: Corridor[], yearIndex: number, periodIndex: number,
): Map<number, PlaceMetrics> {
  const inb = new Map<number, number>(), out = new Map<number, number>();
  const dpSum = new Map<number, number>(), dpN = new Map<number, number>();
  for (const c of corridors) {
    const v = c.v[yearIndex] ?? 0;
    if (v > 0) {
      inb.set(c.d, (inb.get(c.d) ?? 0) + v);
      out.set(c.o, (out.get(c.o) ?? 0) + v);
    }
    const dp = periodIndex >= 0 ? c.dpp[periodIndex] : null;
    if (dp != null) {
      for (const i of [c.o, c.d]) {
        dpSum.set(i, (dpSum.get(i) ?? 0) + dp);
        dpN.set(i, (dpN.get(i) ?? 0) + 1);
      }
    }
  }
  const m = new Map<number, PlaceMetrics>();
  places.forEach((p, i) => {
    const iv = inb.get(i) ?? null, ov = out.get(i) ?? null;
    const n = dpN.get(i) ?? 0;
    m.set(i, {
      // A country with no corridor in the shipped set has NO value, not a zero. The
      // snapshot keeps nine destinations per origin; absence here is a truncation, not a
      // finding, and it must not be painted as "low".
      inbound: iv, outbound: ov,
      net: iv != null || ov != null ? (iv ?? 0) - (ov ?? 0) : null,
      stockshare: p.stock != null && p.pop ? p.stock / p.pop : null,
      disagreement: n ? (dpSum.get(i) ?? 0) / n : null,
      coverage: p.coverage ?? null,
    });
  });
  return m;
}

export interface Scale {
  /** Colour for a value, or null when there is no value to colour. */
  color: (v: number | null) => [number, number, number] | null;
  /** Legend stops, low to high. */
  stops: { hex: string; label: string }[];
  domain: [number, number];
}

/** Quantile binning, not linear: migration volumes are heavy-tailed, and a linear ramp
 *  paints 190 countries the same colour and one bright. */
export function buildScale(spec: SurfaceSpec, values: (number | null)[]): Scale | null {
  const v = values.filter((x): x is number => x != null && isFinite(x));
  if (v.length < 4 || spec.kind === 'none') return null;
  const sorted = [...v].sort((a, b) => a - b);
  const q = (f: number) => sorted[Math.min(sorted.length - 1, Math.floor(f * sorted.length))]!;

  if (spec.kind === 'diverging') {
    const mag = Math.max(Math.abs(q(0.04)), Math.abs(q(0.96))) || 1;
    const arms = DIV_NEG.length;
    const edges = Array.from({ length: arms }, (_, i) => (mag * (i + 1)) / arms);
    const negRgb = DIV_NEG.map(hexToRgb), posRgb = DIV_POS.map(hexToRgb), midRgb = hexToRgb(DIV_MID);
    return {
      domain: [-mag, mag],
      color: (x) => {
        if (x == null || !isFinite(x)) return null;
        if (Math.abs(x) < edges[0]! * 0.18) return midRgb;
        const arm = x < 0 ? negRgb : posRgb;
        const a = Math.abs(x);
        for (let i = 0; i < edges.length; i++) if (a <= edges[i]!) return arm[arm.length - 1 - i] ?? arm[0]!;
        return arm[0]!;
      },
      stops: [
        ...DIV_NEG.map((h, i) => ({ hex: h, label: i === 0 ? spec.fmt(-mag) : '' })),
        { hex: DIV_MID, label: '0' },
        ...DIV_POS.slice().reverse().map((h, i, arr) => ({ hex: h, label: i === arr.length - 1 ? spec.fmt(mag) : '' })),
      ],
    };
  }

  const bins = SEQ.length;
  const edges = Array.from({ length: bins }, (_, i) => q((i + 1) / bins));
  const rgb = SEQ.map(hexToRgb);
  return {
    domain: [sorted[0]!, sorted[sorted.length - 1]!],
    color: (x) => {
      if (x == null || !isFinite(x)) return null;
      for (let i = 0; i < edges.length; i++) if (x <= edges[i]!) return rgb[i]!;
      return rgb[rgb.length - 1]!;
    },
    stops: SEQ.map((h, i) => ({
      hex: h,
      label: i === 0 ? spec.fmt(sorted[0]!) : i === SEQ.length - 1 ? spec.fmt(sorted[sorted.length - 1]!) : '',
    })),
  };
}
