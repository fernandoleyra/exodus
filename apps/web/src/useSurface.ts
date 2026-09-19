// SPDX-FileCopyrightText: Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMemo } from 'react';
import { useStore } from './state';
import { periodIndex } from './types';
import { SURFACES, buildScale, computeMetrics, type PlaceMetrics, type Scale, type SurfaceSpec } from './layers';

/** One computation of the active surface layer, shared by the globe and the panel, so the
 *  legend can never disagree with what is painted. */
export function useSurface(): {
  spec: SurfaceSpec; metrics: Map<number, PlaceMetrics>; scale: Scale | null;
  valueFor: (placeIndex: number) => number | null; noDataCount: number;
} {
  const { places, corridors, year, periodStarts, surface } = useStore();
  const yi = year - 1990;
  const pi = periodIndex(periodStarts, year);
  const spec = SURFACES.find((s) => s.id === surface) ?? SURFACES[0]!;

  const metrics = useMemo(() => computeMetrics(places, corridors, yi, pi),
    [places, corridors, yi, pi]);

  const values = useMemo(() => places.map((_, i) => {
    const m = metrics.get(i);
    return m ? ((m as unknown as Record<string, number | null>)[spec.id] ?? null) : null;
  }), [places, metrics, spec.id]);

  const scale = useMemo(() => buildScale(spec, values), [spec, values]);
  const noDataCount = useMemo(() => values.filter((v) => v == null).length, [values]);

  return { spec, metrics, scale, valueFor: (i) => values[i] ?? null, noDataCount };
}
