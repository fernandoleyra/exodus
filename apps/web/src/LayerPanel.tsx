// SPDX-FileCopyrightText: Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect } from 'react';
import { useStore } from './state';
import { SURFACES, type Overlays } from './layers';
import { useSurface } from './useSurface';

const OVERLAY_ROWS: { k: keyof Overlays; name: string; what: string; key: string }[] = [
  { k: 'corridors', name: 'Corridors', what: 'One arc per modelled flow', key: 'Q' },
  { k: 'halos', name: 'Disagreement halos', what: 'Width = how far the two models differ', key: 'W' },
  { k: 'columns', name: 'Hotspot volume', what: 'Height = arrivals, rising from the surface', key: 'E' },
  { k: 'borders', name: 'Country outlines', what: 'Admin-0 boundaries', key: 'R' },
];

export function LayerPanel() {
  const { surface, setSurface, overlays, toggleOverlay, filters, setFilters } = useStore();
  const { spec, scale, noDataCount } = useSurface();

  // An intelligence surface should be drivable from the keyboard. Digits pick the surface
  // layer, letters toggle overlays — the same order they appear in.
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      const d = Number(e.key);
      if (d >= 1 && d <= SURFACES.length) { setSurface(SURFACES[d - 1]!.id); return; }
      const row = OVERLAY_ROWS.find((r) => r.key.toLowerCase() === e.key.toLowerCase());
      if (row) toggleOverlay(row.k);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [setSurface, toggleOverlay]);

  return (
    <>
      <div className="sec">
        <h2>Surface layer</h2>
        <div className="layerlist" role="radiogroup" aria-label="Surface layer">
          {SURFACES.map((s, i) => (
            <button
              key={s.id}
              role="radio"
              aria-checked={surface === s.id}
              className={`layerrow${surface === s.id ? ' on' : ''}`}
              onClick={() => setSurface(s.id)}
            >
              <span className="layerkey">{i + 1}</span>
              <span className="layertext">
                <span className="layername">{s.name}</span>
                <span className="layerwhat">{s.what}</span>
              </span>
              {s.estimate !== 'observed' && <span className={`badge ${s.estimate === 'modelled' ? 'modelled' : 'absent'}`}>{s.estimate}</span>}
            </button>
          ))}
        </div>
      </div>

      {scale && (
        <div className="sec">
          <h2>{spec.name} &mdash; scale</h2>
          <div className="ramp" aria-hidden="true">
            {scale.stops.map((st, i) => <i key={i} style={{ background: st.hex }} />)}
          </div>
          <div className="ramplabels">
            <span>{scale.stops[0]?.label}</span>
            <span>{spec.unit}</span>
            <span>{scale.stops[scale.stops.length - 1]?.label}</span>
          </div>
          <div className="nodata-row">
            <i className="nodata-sw" />
            <span>
              <b>{noDataCount}</b> of 174 have no value here &mdash; drawn as no data, never as
              a low value.
            </span>
          </div>
          <p className="ramp-note">
            Corridors dim automatically while a surface layer is painted &mdash; two
            full-strength encodings on one globe cannot both be read.
          </p>
          <p className="ramp-note">
            Bins are quantiles, not equal widths: migration volumes are heavy-tailed, and an
            equal-width ramp paints one country bright and the rest identical.
          </p>
        </div>
      )}

      <div className="sec">
        <h2>Overlays</h2>
        {OVERLAY_ROWS.map((r) => (
          <button
            key={r.k}
            className={`toggle${overlays[r.k] ? ' on' : ''}`}
            role="switch"
            aria-checked={overlays[r.k]}
            onClick={() => toggleOverlay(r.k)}
          >
            <span className="tick" aria-hidden="true">{overlays[r.k] ? '✓' : ''}</span>
            <span className="layertext">
              <span className="layername">{r.name}</span>
              <span className="layerwhat">{r.what}</span>
            </span>
            <span className="layerkey">{r.key}</span>
          </button>
        ))}
      </div>

      <div className="sec">
        <h2>Filter corridors</h2>
        <label className="slider">
          <span className="slider-head">
            <span>Minimum size</span>
            <span className="slider-val">
              {filters.minVolume === 0 ? 'all' : `top ${Math.round((1 - filters.minVolume) * 100)}%`}
            </span>
          </span>
          <input
            type="range" min={0} max={0.5} step={0.01} value={filters.minVolume}
            onChange={(e) => setFilters({ minVolume: Number(e.target.value) })}
          />
        </label>
        <button
          className={`toggle${filters.corroboratedOnly ? ' on' : ''}`}
          role="switch"
          aria-checked={filters.corroboratedOnly}
          onClick={() => setFilters({ corroboratedOnly: !filters.corroboratedOnly })}
        >
          <span className="tick" aria-hidden="true">{filters.corroboratedOnly ? '✓' : ''}</span>
          <span className="layertext">
            <span className="layername">Corroborated only</span>
            <span className="layerwhat">Hide corridors no second model has checked</span>
          </span>
        </button>
      </div>
    </>
  );
}
