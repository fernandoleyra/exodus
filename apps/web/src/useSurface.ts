// SPDX-FileCopyrightText: Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMemo } from 'react';
import { useStore, type LayerMeta } from './state';
import { periodIndex } from './types';
import { SURFACES, buildScale, computeMetrics, type PlaceMetrics, type Scale, type SurfaceId, type SurfaceSpec } from './layers';

/** A surface is either a built-in id, or `layer:<id>` for one of the snapshot's data layers. */
export const LAYER_PREFIX = 'layer:';
export const layerSurfaceId = (id: string): SurfaceId => `${LAYER_PREFIX}${id}` as SurfaceId;
export const surfaceLayerId = (s: string) => (s.startsWith(LAYER_PREFIX) ? s.slice(LAYER_PREFIX.length) : null);

/** Built-in surfaces are all annual and all come off the flow spine, so they share its axis. */
const SPINE_PERIODS = (year: number) => String(year);

/**
 * Turn a layer's metadata into the same SurfaceSpec shape the built-ins use, so the globe and
 * the legend do not need to know which kind they are looking at.
 */
function specForLayer(l: LayerMeta): SurfaceSpec {
  const pct = l.unit.startsWith('%');
  return {
    id: layerSurfaceId(l.id),
    name: l.title,
    short: l.title.split(' ')[0] ?? l.title,
    what: l.question,
    kind: 'sequential',
    estimate: l.vintage.estimateKind === 'modelled' ? 'modelled' : 'observed',
    unit: l.unit,
    fmt: (v: number) =>
      pct ? `${v.toFixed(1)}%`
        : v >= 1e6 ? `${(v / 1e6).toFixed(2)}m`
        : v >= 1e4 ? `${Math.round(v / 1e3)}k`
        : Math.round(v).toLocaleString('en-US'),
  };
}

/** One computation of the active surface layer, shared by the globe and the panel, so the
 *  legend can never disagree with what is painted. */
export function useSurface(): {
  spec: SurfaceSpec; metrics: Map<number, PlaceMetrics>; scale: Scale | null;
  valueFor: (placeIndex: number) => number | null; noDataCount: number;
  /** Set when the active surface is a data layer rather than a built-in. */
  layer: LayerMeta | null;
  /** The period actually painted. Null when the layer cannot answer for the cursor, which is
   *  a state the UI must show rather than paper over. */
  period: string | null;
} {
  const { places, corridors, year, periodStarts, surface, layerIndex, layerRows } = useStore();
  const yi = year - 1990;
  const pi = periodIndex(periodStarts, year);

  const layerId = surfaceLayerId(surface);
  const layer = layerId ? (layerIndex.find((l) => l.id === layerId) ?? null) : null;

  const metrics = useMemo(() => computeMetrics(places, corridors, yi, pi),
    [places, corridors, yi, pi]);

  // A layer is painted at the newest period it has that is not after the cursor. It is never
  // interpolated, never carried past its own coverage, and never resampled onto the spine's
  // annual grid — a quarterly series asked for an annual instant answers with its own
  // quarter or does not answer at all. Absent at this instant is not zero at this instant.
  const period = useMemo(() => {
    if (!layer) return SPINE_PERIODS(year);
    const cursorEnd = `${year}-12-31`;
    const usable = layer.periods.filter((p) => periodEndOf(p) <= cursorEnd);
    return usable.length ? usable[usable.length - 1]! : null;
  }, [layer, year]);

  const values = useMemo(() => {
    if (layer) {
      const rows = layerRows[layer.id];
      if (!rows || !period) return places.map(() => null);
      return places.map((p) => {
        const v = rows[p.iso3]?.[period];
        return typeof v === 'number' && Number.isFinite(v) ? v : null;
      });
    }
    const spec = SURFACES.find((s) => s.id === surface) ?? SURFACES[0]!;
    return places.map((_, i) => {
      const m = metrics.get(i);
      return m ? ((m as unknown as Record<string, number | null>)[spec.id] ?? null) : null;
    });
  }, [places, metrics, surface, layer, layerRows, period]);

  const spec = layer ? specForLayer(layer) : (SURFACES.find((s) => s.id === surface) ?? SURFACES[0]!);
  const scale = useMemo(() => buildScale(spec, values), [spec, values]);
  const noDataCount = useMemo(() => values.filter((v) => v == null).length, [values]);

  return { spec, metrics, scale, valueFor: (i) => values[i] ?? null, noDataCount, layer, period };
}

/** Local copy of vintage.ts's period arithmetic, kept here so this module has no cycle. */
function periodEndOf(label: string): string {
  const q = /^(\d{4})-Q([1-4])$/.exec(label);
  if (q) return `${q[1]}-${['03-31', '06-30', '09-30', '12-31'][+q[2]! - 1]}`;
  const m = /^(\d{4})-(\d{2})$/.exec(label);
  if (m) return `${m[1]}-${m[2]}-${new Date(Date.UTC(+m[1]!, +m[2]!, 0)).getUTCDate()}`;
  if (/^\d{4}$/.test(label)) return `${label}-12-31`;
  return label;
}
