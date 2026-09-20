// SPDX-FileCopyrightText: Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMemo } from 'react';
import { useStore, type LayerMeta } from './state';
import { periodAtOrBefore, spineFrame } from './types';
import { resolve, useCatalogue } from './catalogue';
import { SURFACES, buildScale, computeMetrics, type PlaceMetrics, type Scale, type SurfaceId, type SurfaceSpec } from './layers';

/** A surface is either a built-in id, or `layer:<id>` for one of the snapshot's data layers. */
export const LAYER_PREFIX = 'layer:';
export const layerSurfaceId = (id: string): SurfaceId => `${LAYER_PREFIX}${id}` as SurfaceId;
export const surfaceLayerId = (s: string) => (s.startsWith(LAYER_PREFIX) ? s.slice(LAYER_PREFIX.length) : null);

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
  const { places, corridors, year, periodStarts, surface, layerRows, manifest } = useStore();

  // The panel's own list and the panel's own rule, not a second copy of either. The bug this
  // closes was exactly a second copy: the panel clamped to the newest period a layer has and
  // said so, while this file handed the cursor's raw year to the spine, so at 2026 the panel
  // read "Showing 2023" over an empty globe.
  const catalogue = useCatalogue();
  const entry = useMemo(() => catalogue.find((e) => e.id === surface) ?? null, [catalogue, surface]);
  const layer = entry?.layer ?? null;
  const resolved = useMemo(() => (entry ? resolve(entry, year) : null), [entry, year]);
  const period = resolved?.period ?? null;

  // The spine holds annual frames to 2023 and the cursor now runs to 2026, because other
  // layers reach that far. Past its end the spine surfaces hold their last frame and the
  // panel names it. They used to empty the globe instead, which is the discontinuity a
  // reader sees as "the map behaves differently after 2021".
  const yi = spineFrame(manifest?.yearRange ?? [1990, 2023], year);
  const pi = periodAtOrBefore(periodStarts, year);

  const metrics = useMemo(() => computeMetrics(places, corridors, yi, pi),
    [places, corridors, yi, pi]);

  const values = useMemo(() => {
    if (layer) {
      const rows = layerRows[layer.id];
      if (!rows || !period) return places.map(() => null);
      return places.map((p) => {
        const v = rows[p.iso3]?.[period];
        return typeof v === 'number' && Number.isFinite(v) ? v : null;
      });
    }
    // A built-in obeys its declared periods too. The foreign-born share is one 2024
    // measurement; painting it at 1990 because the value happens to be in memory is the
    // same lie whichever side of the panel it comes from.
    if (entry && entry.periods.length > 0 && period == null) return places.map(() => null);
    const spec = SURFACES.find((s) => s.id === surface) ?? SURFACES[0]!;
    return places.map((_, i) => {
      const m = metrics.get(i);
      return m ? ((m as unknown as Record<string, number | null>)[spec.id] ?? null) : null;
    });
  }, [places, metrics, surface, entry, layer, layerRows, period]);

  const spec = layer ? specForLayer(layer) : (SURFACES.find((s) => s.id === surface) ?? SURFACES[0]!);
  const scale = useMemo(() => buildScale(spec, values), [spec, values]);
  const noDataCount = useMemo(() => values.filter((v) => v == null).length, [values]);

  return { spec, metrics, scale, valueFor: (i) => values[i] ?? null, noDataCount, layer, period };
}
