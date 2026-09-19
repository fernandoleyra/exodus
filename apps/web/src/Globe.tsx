import { useMemo, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { _GlobeView as GlobeView, COORDINATE_SYSTEM } from '@deck.gl/core';
import { GeoJsonLayer, PathLayer } from '@deck.gl/layers';
import { PathStyleExtension } from '@deck.gl/extensions';
import { greatCircle } from './greatcircle';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { SphereGeometry } from '@luma.gl/engine';
import { useStore } from './state';

/** Unit vector for a lon/lat, used to decide which hemisphere faces the camera. */
function unit(lon: number, lat: number): [number, number, number] {
  const a = (lon * Math.PI) / 180, b = (lat * Math.PI) / 180;
  return [Math.cos(b) * Math.cos(a), Math.cos(b) * Math.sin(a), Math.sin(b)];
}
const dot = (p: [number, number, number], q: [number, number, number]) =>
  p[0] * q[0] + p[1] * q[1] + p[2] * q[2];

const INITIAL = { longitude: 14, latitude: 24, zoom: 1.65, pitch: 0, bearing: 0 };

export function Globe() {
  const { places, corridors, adm0, year, selected, hovered, select, hover } = useStore();
  const [view, setView] = useState(INITIAL);
  const yi = year - 1990;

  const rows = useMemo(() => {
    if (!places.length) return [];
    // Arcs are drawn without depth testing so the globe cannot swallow them, which means
    // the far hemisphere must be culled here instead. A corridor is drawn only when both
    // endpoints face the camera.
    const cam = unit(view.longitude, view.latitude);
    return corridors.map((c) => {
      const o = places[c.o]!, d = places[c.d]!;
      return { o, d, value: c.v[yi] ?? 0, dp: c.dp, cov: c.cov, path: greatCircle(o.centroid, d.centroid) };
    }).filter((r) =>
      r.value > 0 &&
      dot(unit(r.o.centroid[0], r.o.centroid[1]), cam) > 0.08 &&
      dot(unit(r.d.centroid[0], r.d.centroid[1]), cam) > 0.08);
  }, [corridors, places, yi, view.longitude, view.latitude]);

  const focus = selected ?? hovered;
  const related = (r: { o: Place; d: Place }) =>
    r.o.iso3 === focus || r.d.iso3 === focus;
  /** 0 = ambient (nothing selected), 1 = this corridor is the subject, -1 = pushed back. */
  const emphasis = (r: { o: Place; d: Place }) => (!focus ? 0 : related(r) ? 1 : -1);

  const maxV = useMemo(() => Math.max(1, ...rows.map((r) => r.value)), [rows]);
  const width = (v: number) => 0.55 + 3.6 * Math.sqrt(v / maxV);

  (window as any).__rows = rows.length;

  const layers = [
    // Opaque ocean sphere — without it the globe is see-through and arcs on the far
    // side read as if they were on the near side.
    new SimpleMeshLayer({
      id: 'ocean-sphere',
      data: [0],
      mesh: new SphereGeometry({ radius: 6335000, nlat: 72, nlong: 144 }),
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      getPosition: [0, 0, 0],
      getColor: [10, 16, 24],
      parameters: { cullMode: 'back' },
    }),
    new GeoJsonLayer({
      id: 'countries',
      data: adm0 ?? { type: 'FeatureCollection', features: [] },
      stroked: true, filled: true,
      getFillColor: (f: any) => (focus && f.properties?.iso3 === focus ? [30, 58, 52] : [22, 31, 41]),
      getLineColor: [46, 62, 78],
      getLineWidth: 1, lineWidthUnits: 'pixels',
      pickable: true,
      onHover: (i: any) => hover(i.object?.properties?.iso3 ?? null),
      onClick: (i: any) => select(i.object?.properties?.iso3 ?? null),
      updateTriggers: { getFillColor: [focus] },
    }),
    // The uncertainty envelope. Its width IS the cross-model disagreement: a corridor
    // two models argue about is visibly fuzzier than one they agree on.
    new PathLayer({
      id: 'corridor-envelope',
      data: rows,
      getPath: (r: any) => r.path,
      getColor: (r: any) => { const e = emphasis(r); return [232, 163, 61, (e === 1 ? 52 : e === 0 ? 14 : 2) * (0.3 + 0.7 * r.cov)]; },
      getWidth: (r: any) => width(r.value) * (1 + 14 * r.dp),
      widthUnits: 'pixels', capRounded: true, jointRounded: true,
      parameters: { depthCompare: 'always', depthWriteEnabled: false },
      updateTriggers: { getColor: [focus], getWidth: [yi] },
    }),
    // The estimate itself. Opacity IS data coverage; the dash gaps widen with
    // disagreement, so a contested corridor reads as broken rather than solid.
    new PathLayer({
      id: 'corridors',
      data: rows,
      getPath: (r: any) => r.path,
      getColor: (r: any) => { const e = emphasis(r); return [96, 190, 214, (e === 1 ? 240 : e === 0 ? 46 : 8) * (0.3 + 0.7 * r.cov)]; },
      getWidth: (r: any) => width(r.value),
      widthUnits: 'pixels', capRounded: true, jointRounded: true,
      getDashArray: (r: any) => [Math.max(2, 14 - 48 * r.dp), 1 + 34 * r.dp],
      dashJustified: true, dashGapPickable: false,
      extensions: [new PathStyleExtension({ dash: true })],
      parameters: { depthCompare: 'always', depthWriteEnabled: false },
      pickable: true,
      updateTriggers: { getColor: [focus], getWidth: [yi], getDashArray: [yi] },
    }),
  ];

  return (
    <DeckGL
      id="deck-canvas"
      views={new GlobeView({ resolution: 12 })}
      initialViewState={INITIAL}
      controller={{ dragRotate: true, inertia: 250 }}
      onViewStateChange={({ viewState }: any) => setView(viewState)}
      layers={layers}
    />
  );
}

type Place = { iso3: string };
