import { useMemo, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { _GlobeView as GlobeView, COORDINATE_SYSTEM } from '@deck.gl/core';
import { GeoJsonLayer, PathLayer } from '@deck.gl/layers';
import { PathStyleExtension } from '@deck.gl/extensions';
import { greatCircle } from './greatcircle';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { SphereGeometry } from '@luma.gl/engine';
import { useStore } from './state';
import { periodAtOrBefore, spineFrame } from './types';
import { NO_DATA_FILL, NO_DATA_LINE } from './layers';
import { useSurface } from './useSurface';

/** Unit vector for a lon/lat, used to decide which hemisphere faces the camera. */
function unit(lon: number, lat: number): [number, number, number] {
  const a = (lon * Math.PI) / 180, b = (lat * Math.PI) / 180;
  return [Math.cos(b) * Math.cos(a), Math.cos(b) * Math.sin(a), Math.sin(b)];
}
const dot = (p: [number, number, number], q: [number, number, number]) =>
  p[0] * q[0] + p[1] * q[1] + p[2] * q[2];

const INITIAL = { longitude: 14, latitude: 24, zoom: 1.65, pitch: 0, bearing: 0 };

export function Globe() {
  const { places, corridors, adm0, adm0Outline, year, periodStarts, selected, hovered, select, hover,
          surface, overlays, filters, manifest } = useStore();
  const [view, setView] = useState(INITIAL);
  // The camera is CONTROLLED: deck.gl reports every change through onViewStateChange and we
  // hand the result straight back. It used to be uncontrolled, with only initialViewState,
  // which meant the test hook below silently did nothing to the camera — it moved the
  // hemisphere-culling maths and nothing else, so a test that thought it was looking at
  // Russia was looking wherever the globe happened to be.
  //
  // Test hooks: park the camera over a known place, and focus a country, deterministically.
  // Clicking a 9-vertex island through a rotating globe is not a test, it is a coin flip.
  (window as unknown as Record<string, unknown>).__setView =
    (longitude: number, latitude: number, zoom = 2.1) => setView((v) => ({ ...v, longitude, latitude, zoom }));
  (window as unknown as Record<string, unknown>).__select = (iso3: string | null) => select(iso3);
  // The same clamp the surface uses. The cursor runs to 2026 because other layers do; the
  // spine's annual frames stop at 2023. Past that the arcs hold the last frame rather than
  // vanishing, and the timebar says which one — the corridors used to disappear at the same
  // year the choropleth emptied, which read as the map breaking rather than the data ending.
  const yi = spineFrame(manifest?.yearRange ?? [1990, 2023], year);

  const { spec, scale, valueFor } = useSurface();
  const placeIndex = useMemo(
    () => new Map(places.map((p, i) => [p.iso3, i])), [places]);

  const rows = useMemo(() => {
    if (!places.length) return [];
    // Arcs are drawn without depth testing so the globe cannot swallow them, which means
    // the far hemisphere must be culled here instead. A corridor is drawn only when both
    // endpoints face the camera.
    const cam = unit(view.longitude, view.latitude);
    // periodAtOrBefore, not periodIndex: the halos must show the same window the
    // disagreement surface paints, and that one holds the last window past 2019.
    const pi = periodAtOrBefore(periodStarts, year);
    return corridors.map((c) => {
      const o = places[c.o]!, d = places[c.d]!;
      // dp is null when the second model says nothing about this corridor-period. That is a
      // different state from "the models agree", and it must not render the same way.
      const dp = pi < 0 ? null : (c.dpp[pi] ?? null);
      return { o, d, value: c.v[yi] ?? 0, dp, cov: c.cov, path: greatCircle(o.centroid, d.centroid) };
    }).filter((r) =>
      r.value > 0 &&
      dot(unit(r.o.centroid[0], r.o.centroid[1]), cam) > 0.08 &&
      dot(unit(r.d.centroid[0], r.d.centroid[1]), cam) > 0.08);
  }, [corridors, places, yi, year, periodStarts, view.longitude, view.latitude]);

  const maxAll = useMemo(
    () => Math.max(1, ...corridors.map((c) => c.v[yi] ?? 0)), [corridors, yi]);
  const shown = useMemo(() => rows.filter((r) =>
    r.value >= filters.minVolume * maxAll &&
    (!filters.corroboratedOnly || r.dp != null)), [rows, filters, maxAll]);

  const focus = selected ?? hovered;
  // When a surface layer is painted, the corridors recede automatically. Two full-strength
  // encodings on one globe cannot both be read, and making the reader turn one off by hand
  // is work the interface should have done.
  const surfaceOn = spec.kind !== 'none';
  const arcDim = surfaceOn ? 0.34 : 1;

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
      stroked: false, filled: true,
      getFillColor: (f: any) => {
        const iso = f.properties?.iso3;
        if (focus && iso === focus) return [34, 74, 66];
        if (!scale || !iso) return NO_DATA_FILL;
        const idx = placeIndex.get(iso);
        // A country with no value gets the no-data fill, never the low end of the ramp:
        // painting absence as "small" is the commonest lie a choropleth tells.
        return (idx == null ? null : scale.color(valueFor(idx))) ?? NO_DATA_FILL;
      },
      pickable: true,
      onHover: (i: any) => hover(i.object?.properties?.iso3 ?? null),
      onClick: (i: any) => select(i.object?.properties?.iso3 ?? null),
      updateTriggers: { getFillColor: [focus, surface, year, scale] },
    }),
    // Borders are stroked from the ORIGINAL outlines. The fill geometry is cut on a grid so
    // it hugs the sphere, and stroking that would draw every cut as a national boundary.
    new GeoJsonLayer({
      id: 'borders',
      data: overlays.borders ? (adm0Outline ?? { type: 'FeatureCollection', features: [] })
                             : { type: 'FeatureCollection', features: [] },
      stroked: true, filled: false,
      getLineColor: NO_DATA_LINE,
      getLineWidth: 1, lineWidthUnits: 'pixels',
      pickable: false,
      parameters: { depthCompare: 'always', depthWriteEnabled: false },
    }),
    // The uncertainty envelope. Its width IS the cross-model disagreement: a corridor
    // two models argue about is visibly fuzzier than one they agree on.
    new PathLayer({
      id: 'corridor-envelope',
      data: overlays.halos ? shown.filter((r: any) => r.dp != null) : [],
      getPath: (r: any) => r.path,
      getColor: (r: any) => { const e = emphasis(r); return [232, 163, 61, (e === 1 ? 58 : e === 0 ? 16 : 2) * (0.3 + 0.7 * r.cov) * arcDim]; },
      getWidth: (r: any) => width(r.value) * (1 + 3.2 * Math.min(2, r.dp)),
      widthUnits: 'pixels', capRounded: true, jointRounded: true,
      parameters: { depthCompare: 'always', depthWriteEnabled: false },
      updateTriggers: { getColor: [focus, year, arcDim], getWidth: [yi, year] },
    }),
    // The estimate itself. Opacity IS data coverage; the dash gaps widen with
    // disagreement, so a contested corridor reads as broken rather than solid.
    new PathLayer({
      id: 'corridors',
      data: overlays.corridors ? shown : [],
      getPath: (r: any) => r.path,
      getColor: (r: any) => {
        const e = emphasis(r);
        const a = (e === 1 ? 240 : e === 0 ? 46 : 8) * (0.3 + 0.7 * r.cov) * arcDim;
        // No second model means nothing corroborates this arc. It must not borrow the
        // confident colour of one that has been checked against an independent estimate.
        return r.dp == null ? [126, 142, 158, a * 0.85] : [96, 190, 214, a];
      },
      getWidth: (r: any) => width(r.value),
      widthUnits: 'pixels', capRounded: true, jointRounded: true,
      getDashArray: (r: any) => (r.dp == null ? [3, 5] : [Math.max(3, 18 - 7 * r.dp), 1 + 5 * r.dp]),
      dashJustified: true, dashGapPickable: false,
      extensions: [new PathStyleExtension({ dash: true })],
      parameters: { depthCompare: 'always', depthWriteEnabled: false },
      pickable: true,
      updateTriggers: { getColor: [focus, year, arcDim], getWidth: [yi], getDashArray: [yi, year] },
    }),
  ];

  return (
    <DeckGL
      id="deck-canvas"
      views={new GlobeView({ resolution: 12 })}
      viewState={view}
      controller={{ dragRotate: true, inertia: 250 }}
      onClick={(info: any) => { if (!info?.object) select(null); }}
      getCursor={({ isDragging, isHovering }: any) =>
        isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'}
      onViewStateChange={({ viewState }: any) => setView(viewState)}
      layers={layers}
    />
  );
}

type Place = { iso3: string };
