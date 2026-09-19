import { useEffect, useMemo } from 'react';
import { navigate, useRoute, hasAccepted } from './router';
import { Landing } from './landing/Landing';
import { Legal } from './pages/Legal';
import { Sources as SourcesPage } from './pages/Sources';
import { Methods } from './pages/Methods';
import { ConcordancePage } from './concordance/Concordance';
import { Globe } from './Globe';
import { useStore } from './state';
import { periodIndex } from './types';
import { headroom } from './kernel/headroom';
import { LayerPanel } from './LayerPanel';
import { useSurface } from './useSurface';
import type { EstimateKind, Place } from './types';

const nf = new Intl.NumberFormat('en-US');
const fmt = (v: number | null, unit?: string) =>
  v == null ? null : `${nf.format(Math.round(v))}${unit ?? ''}`;

/** A number never reaches the screen without its vintage and estimate kind.
 *  A missing value renders an em-dash and says so. It never renders 0. */
function Figure({ label, value, vintage, kind = 'observed', absentNote = 'no data' }: {
  label: string; value: string | null; vintage?: number | null; kind?: EstimateKind;
  absentNote?: string;
}) {
  const absent = value == null;
  return (
    <div className="figure">
      <span className="lbl">{label}</span>
      <span>
        <span className={`val${absent ? ' absent' : ''}`}>{absent ? '—' : value}</span>
        {absent
          ? <span className="badge absent" style={{ marginLeft: 8 }}>{absentNote}</span>
          : vintage != null && <span className="vintage">{vintage}</span>}
        {!absent && kind === 'modelled' && <span className="badge modelled" style={{ marginLeft: 8 }}>modelled</span>}
      </span>
    </div>
  );
}

function Inspector() {
  const { places, corridors, selected, hovered, year, select } = useStore();
  const iso = selected ?? hovered;
  const p = useMemo(() => places.find((x) => x.iso3 === iso), [places, iso]);
  const yi = year - 1990;

  const periodStarts = useStore((s) => s.periodStarts);
  const { spec: surfaceSpec, valueFor } = useSurface();
  const surfaceValue = p ? valueFor(places.indexOf(p)) : null;
  const manifest = useStore((s) => s.manifest);
  const flows = useMemo(() => {
    if (!p) return null;
    const i = places.indexOf(p);
    const pi = periodIndex(periodStarts, year);
    let inb = 0, out = 0, nIn = 0, nOut = 0, dpMax = 0;
    const dps: number[] = [];
    for (const c of corridors) {
      const v = c.v[yi] ?? 0;
      const touches = c.d === i || c.o === i;
      if (c.d === i) { inb += v; nIn++; }
      if (c.o === i) { out += v; nOut++; }
      if (touches && pi >= 0) {
        const dp = c.dpp[pi];
        if (dp != null) { dps.push(dp); if (dp > dpMax) dpMax = dp; }
      }
    }
    dps.sort((a, b) => a - b);
    const median = dps.length ? dps[dps.length >> 1]! : null;
    return { inb, out, nIn, nOut, checked: dps.length, dpMedian: median, dpMax };
  }, [p, places, corridors, yi, year, periodStarts]);

  if (!p) {
    return <div className="empty">Hover or click a country to inspect what is actually known about it.
      Click empty space or press <b>Esc</b> to come back out to the whole world.<br /><br />
      Every figure here carries its source year. Where the world has no data, this panel says so rather than showing a zero.</div>;
  }

  return (
    <>
      <div className="sec sec-head">
        <h2>{p.name}</h2>
        {selected && (
          <button className="clear-sel" onClick={() => select(null)} title="Back to the whole world (Esc)">
            Clear <span className="layerkey">Esc</span>
          </button>
        )}
        {!selected && hovered && <span className="hover-hint">hovering &middot; click to pin</span>}
        <Figure label="Population" value={fmt(p.pop)} vintage={p.popYear} />
        <Figure label="Migrant stock" value={fmt(p.stock)} vintage={p.stockYear} kind="modelled" />
        <Figure label="GDP per capita (PPP)" value={p.gdppc == null ? null : `$${fmt(p.gdppc)}`} vintage={p.gdppcYear} />
        <Figure label="Unemployment" value={p.unemp == null ? null : `${p.unemp.toFixed(1)}%`}
                vintage={p.unempYear} kind="modelled" />
      </div>
      <div className="sec">
        <h2>Corridors in {year}</h2>
        <Figure label="Inbound (modelled)" value={flows!.nIn ? fmt(flows!.inb) : null}
                kind="modelled" absentNote="not in the top-9 set" />
        <Figure label="Outbound (modelled)" value={flows!.nOut ? fmt(flows!.out) : null}
                kind="modelled" absentNote="not in the top-9 set" />
        {!flows!.nIn && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.55, margin: '6px 0 0' }}>
            The snapshot keeps only each origin&rsquo;s nine largest destinations, and this
            country is nobody&rsquo;s top nine. People do arrive here; those corridors are
            below the cut we ship. That is a limit of this snapshot, not a finding about this
            country.
          </p>
        )}
        <div className="kv"><span className="k">corridors rendered</span><span className="v">{flows!.nIn} in · {flows!.nOut} out</span></div>
      </div>
      <div className="sec">
        <h2>{surfaceSpec.name}</h2>
        <Figure label={surfaceSpec.name} kind={surfaceSpec.estimate === 'observed' ? 'observed' : 'modelled'}
                value={surfaceValue == null ? null : surfaceSpec.fmt(surfaceValue)}
                absentNote="no value here" />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.55, margin: '4px 0 0' }}>
          {surfaceSpec.what}
        </p>
      </div>
      <div className="sec">
        <h2>How many more could it hold?</h2>
        {(() => {
          const h = headroom(p, manifest?.benchmarks ?? null);
          const rows = h.perIndicator.map((row) => (
            <div key={row.id} style={{ padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="kv">
                <span className="k">
                  {row.label}
                  {h.kind === 'ok' && row.id === h.bindingIndicator ? ' ←' : ''}
                  {row.estimateKind === 'modelled' && (
                    <span className="badge modelled" style={{ marginLeft: 6 }}>modelled</span>
                  )}
                </span>
                <span className="v">
                  {row.observed == null ? '— not published'
                    : `${row.observed.toFixed(1)} vs ${row.target ?? '—'} ${row.unit}`}
                  {row.observedYear ? ` · ${row.observedYear}` : ''}
                </span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 2 }}>
                {row.excludedBecause
                  ? <>Context only — {row.excludedBecause}.</>
                  : <>Benchmark: {row.basis}.</>}
              </div>
            </div>
          ));
          if (h.kind === 'refusal') {
            return (
              <>
                <div className="figure">
                  <span className="lbl">Binding constraint</span>
                  <span><span className="val absent">—</span>
                    <span className="badge absent" style={{ marginLeft: 8 }}>can&rsquo;t say</span></span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.55, margin: '6px 0 10px' }}>
                  {h.reason}
                </p>
                {rows}
              </>
            );
          }
          return (
            <>
              <Figure label={`Headroom (${h.bindingLabel.toLowerCase()} binds)`} kind="modelled"
                      value={`${nf.format(h.headroomPersonsPerYear)} / yr`} />
              {rows}
              <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.55, margin: '10px 0 0' }}>
                {h.caveat}
              </p>
            </>
          );
        })()}
      </div>
      <div className="sec">
        <h2>Do the models agree?</h2>
        <Figure label="Median disagreement" kind="modelled"
                value={flows!.dpMedian == null ? null : `${(flows!.dpMedian * 100).toFixed(0)}%`}
                absentNote="not checked" />
        <Figure label="Worst corridor" kind="modelled"
                value={flows!.dpMax ? `${(flows!.dpMax * 100).toFixed(0)}%` : null}
                absentNote="not checked" />
        <div className="kv">
          <span className="k">corridors with a second model</span>
          <span className="v">{flows!.checked} of {flows!.nIn + flows!.nOut}</span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 0 }}>
          Two independent published estimates of the same corridor, compared on the only grid
          they share. The measure is the symmetric relative difference, |a−b| ÷ their mean,
          so it runs <b>0 to 200%</b>, not 0 to 100: 200% means one model says a number and
          the other says roughly nothing. A corridor nobody checked is drawn grey and
          dotted — that is not the same as the models agreeing.
        </p>
      </div>
      <div className="sec">
        <h2>How much to trust this</h2>
        <div className="kv"><span className="k">reporting completeness</span><span className="v">{(p.coverage * 100).toFixed(0)}%</span></div>
        <div className="bar"><i style={{ width: `${p.coverage * 100}%` }} /></div>
        <div className="kv" style={{ marginTop: 8 }}>
          <span className="k">indicators reported</span><span className="v">{p.indicatorsPresent} of 4</span>
        </div>
        <div className="kv">
          <span className="k">migrant stock vintage</span>
          <span className="v">{p.stockYear ?? '—'}{p.stockYear ? ` · ${2023 - p.stockYear}y old` : ''}</span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 0 }}>
          Computed from what this country actually reports to the World Bank, not asserted. It
          sets the opacity of every arc touching it. It measures <i>whether</i> a country reports,
          not how good the reporting is, so most reporters cluster near the top — a weak
          discriminator that a real build must replace with per-series quality flags.
        </p>
      </div>
    </>
  );
}

function Sources() {
  const manifest = useStore((s) => s.manifest);
  if (!manifest) return null;
  return (
    <div className="sec">
      <h2>Sources</h2>
      {manifest.sources.map((s) => (
        <div className="src" key={s.id}>
          <div className="t">{s.title} <span className={`badge ${s.estimateKind}`}>{s.estimateKind}</span></div>
          <div className="kv"><span className="k">licence</span><span className="v">{s.licence}</span></div>
          <div className="kv"><span className="k">vintage</span><span className="v">{s.vintage}</span></div>
          <div className="n">{s.note}</div>
        </div>
      ))}
    </div>
  );
}

function useEscapeClears() {
  const select = useStore((s) => s.select);
  useEffect(() => {
    const on = (e: KeyboardEvent) => { if (e.key === 'Escape') select(null); };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [select]);
}

export function Observer() {
  useEscapeClears();
  const { load, ready, year, setYear, manifest, corridors, places } = useStore();
  useEffect(() => { void load(); }, [load]);

  return (
    <div className="app">
      <aside className="panel left">
        <div className="brand">
          <button className="brand-btn" onClick={() => navigate('landing')}><h1>Exodus</h1></button>
          <div className="tag">Migration intelligence. Every number carries its source, its vintage, and how much the best available evidence disagrees with itself.</div>
        </div>
        <div className="panel-scroll">
          <LayerPanel />
          <div className="sec">
            <h2>Coverage</h2>
            <div className="kv"><span className="k">places</span><span className="v">{places.length}</span></div>
            <div className="kv"><span className="k">corridors</span><span className="v">{corridors.length}</span></div>
            <div className="kv"><span className="k">years</span><span className="v">1990–2023</span></div>
            <div className="kv"><span className="k">with a second model</span><span className="v">{manifest?.corridorsWithSecondModel ?? 0}</span></div>
            <div className="kv"><span className="k">disputed, no data join</span><span className="v">{manifest?.disputedRenderedWithoutData.length ?? 0}</span></div>
          </div>
          <Sources />
        </div>
      </aside>

      <main className="stage">
        <div className="topbar">
          <button className="pill pill-btn" onClick={() => navigate('landing')}>← Exodus</button>
          <span className="pill">offline · committed snapshot</span>
          <span className="pill">every corridor is modelled — no bilateral flow on earth is observed</span>
          <a className="pill pill-link" href="#/concordance">do the sources agree? →</a>
          {!ready && <span className="pill">loading…</span>}
        </div>
        <Globe />
        <div className="timebar">
          <span className="year">{year}</span>
          <input
            type="range" min={1990} max={2023} step={1} value={year}
            onChange={(e) => setYear(+e.target.value)}
            aria-label="Year"
          />
          <span className="hint">
            {periodIndex(useStore.getState().periodStarts, year) < 0
              ? 'past 2019 · no second model exists here, so nothing is corroborated'
              : 'discrete annual frames — nothing is interpolated'}
          </span>
        </div>
      </main>

      <aside className="panel right">
        <div className="panel-scroll"><Inspector /></div>
      </aside>
    </div>
  );
}

export function App() {
  const route = useRoute();
  useEffect(() => {
    document.body.dataset.route = route;
    return () => { delete document.body.dataset.route; };
  }, [route]);

  useEffect(() => {
    // The Observer is reachable only after the terms have been accepted. Deep links are
    // honoured, not discarded: an unaccepted visitor is sent to the landing, where the
    // gate opens.
    if (route === 'observer' && !hasAccepted()) navigate('landing');
  }, [route]);

  if (route === 'legal') return <Legal />;
  if (route === 'sources') return <SourcesPage />;
  if (route === 'methods') return <Methods />;
  if (route === 'concordance') return <ConcordancePage />;
  if (route === 'observer' && hasAccepted()) return <Observer />;
  return <Landing />;
}
