// SPDX-FileCopyrightText: Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useMemo } from 'react';
import { useStore } from './state';
import { SURFACES, type Overlays } from './layers';
import { layerSurfaceId, surfaceLayerId, useSurface } from './useSurface';
import { ageDays } from './vintage';

/** First period a layer covers. */
const l0 = (periods: string[]) => periods[0] ?? '?';

const OVERLAY_ROWS: { k: keyof Overlays; name: string; what: string; key: string }[] = [
  { k: 'corridors', name: 'Corridors', what: 'One arc per modelled flow', key: 'Q' },
  { k: 'halos', name: 'Disagreement halos', what: 'Width = how far the two models differ', key: 'W' },
  { k: 'columns', name: 'Hotspot volume', what: 'Height = arrivals, rising from the surface', key: 'E' },
  { k: 'borders', name: 'Country outlines', what: 'Admin-0 boundaries', key: 'R' },
];

export function LayerPanel() {
  const { surface, setSurface, overlays, toggleOverlay, filters, setFilters,
          layerIndex, layerRows, layerPending, loadLayer, year } = useStore();
  const { spec, scale, noDataCount, layer, period } = useSurface();

  // Only country layers can paint a choropleth. Corridor layers are origin-destination
  // matrices; they belong to the inspector and the concordance page, and offering them here
  // as a surface would promise something the globe cannot draw.
  const countryLayers = layerIndex.filter((l) => l.entity === 'country');

  // Twenty-odd layers in one flat list is a wall. Group by producer, freshest first inside
  // each group and groups ordered by their own freshest member, so the thing that moved most
  // recently is the thing nearest the top.
  const grouped = useMemo(() => {
    const m = new Map<string, typeof countryLayers>();
    for (const l of countryLayers) {
      const k = l.vintage.producer;
      (m.get(k) ?? m.set(k, []).get(k))!.push(l);
    }
    for (const g of m.values()) g.sort((a, b) => Date.parse(b.vintage.periodEnd) - Date.parse(a.vintage.periodEnd));
    return [...m.entries()].sort(
      (a, b) => Date.parse(b[1][0]!.vintage.periodEnd) - Date.parse(a[1][0]!.vintage.periodEnd));
  }, [countryLayers]);

  // Fetch the rows the moment a layer becomes the active surface, not on page load: these
  // files are much larger than the index and most visitors will never open most of them.
  const activeLayerId = surfaceLayerId(surface);
  useEffect(() => { if (activeLayerId) void loadLayer(activeLayerId); }, [activeLayerId, loadLayer]);

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

      {countryLayers.length > 0 && (
        <div className="sec">
          <h2>Data layers</h2>
          <p className="seclede">
            Each carries its own vintage and cadence. The flow spine above is annual and stops
            at 2023; these do not follow it, and a layer that cannot answer for the year you
            are on says so rather than guessing.
          </p>
          <div className="layerlist" role="radiogroup" aria-label="Data layers">
            {grouped.map(([producer, group]) => (
              <div key={producer} className="layergroup">
                <div className="layergroup-head">
                  <span>{producer}</span>
                  <span>{group.length} &middot; freshest {group[0]!.vintage.periodLabel}</span>
                </div>
                {group.map((l) => {
              const id = layerSurfaceId(l.id);
              const on = surface === id;
              const loading = layerPending[l.id] && !layerRows[l.id];
              const answers = l.periods.some((p) => p <= String(year) || l.vintage.cadence !== 'annual');
              return (
                <button
                  key={l.id}
                  role="radio"
                  aria-checked={on}
                  className={`layerrow${on ? ' on' : ''}${answers ? '' : ' stale'}`}
                  onClick={() => setSurface(id)}
                >
                  <span className="layerkey">{l.vintage.cadence === 'monthly' ? 'M' : l.vintage.cadence === 'quarterly' ? 'Q' : 'Y'}</span>
                  <span className="layertext">
                    <span className="layername">{l.title}</span>
                    <span className="layerwhat">{l.question}</span>
                    <span className="layervintage">
                      {l.vintage.periodLabel} &middot; {ageDays(l.vintage)} d &middot; {l.vintage.estimateKind}
                      {l.vintage.provisional && <> &middot; <b>provisional</b></>}
                      {loading && <> &middot; loading&hellip;</>}
                    </span>
                  </span>
                  {!l.vintage.commercialUseClear && <span className="badge absent" title="This producer does not clearly grant commercial reuse">terms</span>}
                </button>
                );
                })}
              </div>
            ))}
          </div>
          {layer && (
            <p className="layernote">
              {period
                ? <>Painting <b>{period}</b>{period !== String(year) && <> &mdash; the newest period this layer has at or before {year}, not carried forward and not interpolated</>}. {layer.note}</>
                : <>This layer starts at <b>{l0(layer.periods)}</b> and has nothing at or before {year}. Nothing is painted, and nothing has been carried backwards to pretend otherwise.</>}
            </p>
          )}
        </div>
      )}

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
