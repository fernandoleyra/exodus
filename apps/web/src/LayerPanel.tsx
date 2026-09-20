// SPDX-FileCopyrightText: Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// One list. The panel used to carry two of them — seven spine surfaces with a paragraph each,
// then forty-three snapshot layers grouped by publisher with a paragraph each — which made
// fifty rows of prose that behaved differently from one another when the cursor moved.
//
// A row is now one line, a coverage bar and a chip. The bar is doing the work the paragraphs
// were doing badly: it shows at a glance which part of the timeline a layer covers and where
// the cursor is inside it, so "why did the map change when I crossed 2020" is answered by
// looking rather than by reading.
import { useEffect, useMemo, useState } from 'react';
import { useStore } from './state';
import { periodAtOrBefore } from './types';
import { type Overlays } from './layers';
import { surfaceLayerId, useSurface } from './useSurface';
import { GROUP_LABEL, resolve, span, useCatalogue, type Entry, type Group } from './catalogue';

const OVERLAY_ROWS: { k: keyof Overlays; name: string; key: string }[] = [
  { k: 'corridors', name: 'Corridors', key: 'Q' },
  { k: 'halos', name: 'Disagreement halos', key: 'W' },
  { k: 'columns', name: 'Hotspot volume', key: 'E' },
  { k: 'borders', name: 'Country outlines', key: 'R' },
];

const GROUPS: Group[] = ['movement', 'population', 'context'];

/** Where a layer has data, and where the cursor is inside it. */
function CoverageBar({ entry, axisMin, axisMax, year }: { entry: Entry; axisMin: number; axisMax: number; year: number }) {
  const s = span(entry, axisMin, axisMax);
  const at = Math.max(0, Math.min(1, (year - axisMin) / Math.max(1, axisMax - axisMin)));
  if (!s) return <span className="cov cov-timeless" title="No time dimension — the same value at every year" />;
  const [a, b] = s;
  const { period, exact } = resolve(entry, year);
  const state = period == null ? 'none' : exact ? 'exact' : 'behind';
  return (
    <span className={`cov cov-${state}`}>
      <i style={{ left: `${a * 100}%`, width: `${Math.max(1.5, (b - a) * 100)}%` }} />
      <b style={{ left: `${at * 100}%` }} />
    </span>
  );
}

export function LayerPanel() {
  const { surface, setSurface, overlays, toggleOverlay, filters, setFilters,
          layerRows, layerPending, loadLayer, year, manifest, layerIndex, periodStarts } = useStore();
  const { spec, scale, noDataCount } = useSurface();
  const catalogue = useCatalogue();
  const [q, setQ] = useState('');

  const axisMin = manifest?.yearRange?.[0] ?? 1990;
  const axisMax = useMemo(() => Math.max(
    manifest?.yearRange?.[1] ?? 2023,
    ...layerIndex.map((l) => Number(l.vintage.periodEnd.slice(0, 4))).filter(Number.isFinite),
  ), [manifest, layerIndex]);

  const active = catalogue.find((e) => e.id === surface) ?? null;
  const resolved = active ? resolve(active, year) : null;

  // The halos paint cross-model disagreement per five-year window, and the windows stop in
  // 2015. Past that they hold the last one — the alternative was them vanishing at 2020 —
  // so the chip has to say which window a reader is looking at, the same way a layer row does.
  const haloWindow = useMemo(() => {
    const i = periodAtOrBefore(periodStarts, year);
    const start = i < 0 ? null : periodStarts[i] ?? null;
    return start == null || year < start + 5 ? null : String(start);
  }, [periodStarts, year]);

  // Fetch a snapshot layer only once it is the thing being painted. These files are much
  // larger than the index and most visitors open a handful of the fifty.
  const activeLayerId = surfaceLayerId(surface);
  useEffect(() => { if (activeLayerId) void loadLayer(activeLayerId); }, [activeLayerId, loadLayer]);

  const needle = q.trim().toLowerCase();
  const shown = useMemo(() => catalogue.filter((e) =>
    !needle || e.name.toLowerCase().includes(needle) || e.producer.toLowerCase().includes(needle)
    || e.what.toLowerCase().includes(needle)), [catalogue, needle]);

  // Digits still pick the first nine, because they always have.
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      const d = Number(e.key);
      if (d >= 1 && d <= 9 && catalogue[d - 1]) { setSurface(catalogue[d - 1]!.id); return; }
      const row = OVERLAY_ROWS.find((r) => r.key.toLowerCase() === e.key.toLowerCase());
      if (row) toggleOverlay(row.k);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [setSurface, toggleOverlay, catalogue]);

  return (
    <>
      {active && (
        <div className="sec">
          <div className="activehead">
            <span>{active.name}{active.qualifier ? ` \u00b7 ${active.qualifier}` : ''}</span>
            <span className={`badge ${active.estimate === 'modelled' ? 'modelled' : active.estimate === 'derived' ? 'absent' : ''}`}>
              {active.estimate}
            </span>
          </div>
          <p className="activewhat">{active.what}</p>
          <p className="activewhen">
            {resolved?.timeless
              ? <>No time dimension &mdash; the same value at every year.</>
              : resolved?.period == null
                ? <><b className="warn">Nothing at {year}.</b> This layer starts at {active.periods[0]}.</>
                : resolved.exact
                  ? <>Showing <b>{resolved.period}</b>.</>
                  : <><b className="warn">Showing {resolved.period}</b>, the newest it has &mdash; the cursor is at {year}.</>}
            {' '}{active.producer}{active.provisional && <> &middot; <b className="warn">provisional</b></>}
            {!active.commercialUseClear && <> &middot; <b className="warn">restricted terms</b></>}
          </p>

          {scale && (
            <>
              <div className="legend">
                {scale.stops.map((s, i) => <i key={i} style={{ background: s.hex }} title={s.label} />)}
              </div>
              <div className="legend-ends">
                <span>{scale.stops[0]?.label}</span>
                <span className="legend-unit">{spec.unit}</span>
                <span>{scale.stops[scale.stops.length - 1]?.label}</span>
              </div>
              <p className="legend-note">
                <span className="nodata-swatch" /> {noDataCount} of 174 have no value here, drawn as no data
                rather than as a low one. Bins are quantiles.
              </p>
            </>
          )}
        </div>
      )}

      <div className="sec">
        <div className="sec-bar">
          <h2>Layers</h2>
          <input className="layerfind" type="search" value={q} placeholder="Filter"
                 onChange={(e) => setQ(e.target.value)} aria-label="Filter layers" />
        </div>

        <div className="layerlist" role="radiogroup" aria-label="Layers">
          {/* Geometry-only sits above the groups: it is not a measurement of anything and
              putting it under a heading implies it belongs to that family. */}
          {shown.filter((e) => e.id === 'none').map((e) => (
            <button key={e.id} role="radio" aria-checked={surface === e.id}
                    className={`layerrow${surface === e.id ? ' on' : ''}`}
                    onClick={() => setSurface(e.id)}>
              <span className="layername">{e.name}</span>
              <CoverageBar entry={e} axisMin={axisMin} axisMax={axisMax} year={year} />
              <span className="layerat">any year</span>
            </button>
          ))}
          {GROUPS.map((g) => {
            const rows = shown.filter((e) => e.group === g && e.id !== 'none');
            if (!rows.length) return null;
            return (
              <div key={g} className="layergroup">
                <div className="layergroup-head"><span>{GROUP_LABEL[g]}</span><span>{rows.length}</span></div>
                {rows.map((e) => {
                  const r = resolve(e, year);
                  const on = surface === e.id;
                  const loading = e.layer && layerPending[e.layer.id] && !layerRows[e.layer.id];
                  return (
                    <button key={e.id} role="radio" aria-checked={on}
                            className={`layerrow${on ? ' on' : ''}${r.period == null && !r.timeless ? ' off' : ''}`}
                            onClick={() => setSurface(e.id)}>
                      <span className="layername" title={e.what}>
                        {e.name}{e.qualifier && <em>{e.qualifier}</em>}
                      </span>
                      <CoverageBar entry={e} axisMin={axisMin} axisMax={axisMax} year={year} />
                      <span className="layerat">
                        {r.timeless ? 'any year'
                          : r.period == null ? `from ${e.periods[0]}`
                          : r.exact ? r.period
                          : r.period}
                        {loading && '…'}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
          {shown.length === 0 && <p className="layernote">Nothing matches &ldquo;{q}&rdquo;.</p>}
        </div>
      </div>

      <div className="sec">
        <h2>Overlays</h2>
        <div className="overlaylist">
          {OVERLAY_ROWS.map((r) => (
            <button key={r.k} className={`chip${overlays[r.k] ? ' on' : ''}`} onClick={() => toggleOverlay(r.k)}>
              {r.name}
              {r.k === 'halos' && haloWindow && <span className="chip-at">{haloWindow}</span>}
              {' '}<span className="layerkey">{r.key}</span>
            </button>
          ))}
        </div>
        <div className="filterrow">
          <label className="filterslider">
            <span>Corridor size</span>
            <input type="range" min={0} max={0.5} step={0.01} value={filters.minVolume}
                   onChange={(e) => setFilters({ minVolume: Number(e.target.value) })}
                   aria-label="Minimum corridor size" />
            <b>{filters.minVolume === 0 ? 'all' : `top ${Math.round((1 - filters.minVolume) * 100)}%`}</b>
          </label>
          <button className={`chip${filters.corroboratedOnly ? ' on' : ''}`} role="switch"
                  aria-checked={filters.corroboratedOnly}
                  onClick={() => setFilters({ corroboratedOnly: !filters.corroboratedOnly })}>
            Corroborated only
          </button>
        </div>
      </div>
    </>
  );
}
