import { useEffect, useMemo } from 'react';
import { navigate, useRoute, hasAccepted } from './router';
import { Landing } from './landing/Landing';
import { Legal } from './pages/Legal';
import { Sources as SourcesPage } from './pages/Sources';
import { Methods } from './pages/Methods';
import { Globe } from './Globe';
import { useStore } from './state';
import { periodIndex } from './types';
import { headroom } from './kernel/headroom';
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

function Legend() {
  return (
    <div className="sec">
      <h2>Reading the globe</h2>
      <div className="legend-row">
        <span className="swatch" style={{ background: '#60bed6', height: 3, alignSelf: 'center' }} />
        <span className="desc"><b>Arc</b> — one corridor, from the spine model. Width is that year&rsquo;s flow.</span>
      </div>
      <div className="legend-row">
        <span className="swatch" style={{ alignSelf: 'center' }}>
          <span style={{ display: 'block', height: 3, background: '#60bed6', opacity: .18 }} />
          <span style={{ display: 'block', height: 3, background: '#60bed6', opacity: .95, marginTop: 3 }} />
        </span>
        <span className="desc"><b>Opacity = reporting completeness.</b> A corridor whose endpoints publish little cannot borrow the authority of one that publishes a lot.</span>
      </div>
      <div className="legend-row">
        <span className="swatch" style={{ alignSelf: 'center', background: 'rgba(232,163,61,.24)', borderTop: '1px solid rgba(232,163,61,.55)', borderBottom: '1px solid rgba(232,163,61,.55)' }} />
        <span className="desc"><b>Halo = the two models disagree.</b> Wider halo, bigger argument. It is a step function on 5-year periods, because that is the only grid both models share.</span>
      </div>
      <div className="legend-row">
        <span className="swatch" style={{ alignSelf: 'center', borderTop: '3px dotted #7e8e9e' }} />
        <span className="desc"><b>Grey and dotted = nobody checked it.</b> The second model says nothing about this corridor-period, so there is no halo to draw. That is not agreement.</span>
      </div>
      <div className="legend-row">
        <span className="swatch" style={{ alignSelf: 'center', background: '#161f29', border: '1px solid #2e3e4e' }} />
        <span className="desc"><b>Unfilled land</b> — disputed or unrecognised, rendered as geometry with no data join and no corridors.</span>
      </div>
    </div>
  );
}

function Inspector() {
  const { places, corridors, selected, hovered, year } = useStore();
  const iso = selected ?? hovered;
  const p = useMemo(() => places.find((x) => x.iso3 === iso), [places, iso]);
  const yi = year - 1990;

  const periodStarts = useStore((s) => s.periodStarts);
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
    return <div className="empty">Hover or click a country to inspect what is actually known about it.<br /><br />
      Every figure here carries its source year. Where the world has no data, this panel says so rather than showing a zero.</div>;
  }

  return (
    <>
      <div className="sec">
        <h2>{p.name}</h2>
        <Figure label="Population" value={fmt(p.pop)} vintage={p.popYear} />
        <Figure label="Migrant stock" value={fmt(p.stock)} vintage={p.stockYear} />
        <Figure label="GDP per capita (PPP)" value={p.gdppc == null ? null : `$${fmt(p.gdppc)}`} vintage={p.gdppcYear} />
        <Figure label="Unemployment" value={p.unemp == null ? null : `${p.unemp.toFixed(1)}%`} vintage={p.unempYear} />
      </div>
      <div className="sec">
        <h2>Corridors in {year}</h2>
        <Figure label="Inbound (modelled)" value={flows!.nIn ? fmt(flows!.inb) : null}
                kind="modelled" absentNote="none in fixture" />
        <Figure label="Outbound (modelled)" value={flows!.nOut ? fmt(flows!.out) : null}
                kind="modelled" absentNote="none in fixture" />
        {!flows!.nIn && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.55, margin: '6px 0 0' }}>
            The M0 gravity fixture only generates corridors toward higher-income destinations,
            so low-income origins have no inbound arcs. That is a limit of the fixture, not a
            finding about this country.
          </p>
        )}
        <div className="kv"><span className="k">corridors rendered</span><span className="v">{flows!.nIn} in · {flows!.nOut} out</span></div>
      </div>
      <div className="sec">
        <h2>How many more could it hold?</h2>
        {(() => {
          const h = headroom(p);
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
                {h.perIndicator.map((row) => (
                  <div className="kv" key={row.id}>
                    <span className="k">{row.label}</span>
                    <span className="v">{row.observed == null ? '— not published' : `${row.observed.toFixed(1)} ${row.unit}`}</span>
                  </div>
                ))}
              </>
            );
          }
          return (
            <>
              <Figure label={`Headroom (${h.bindingLabel.toLowerCase()} binds)`} kind="modelled"
                      value={`${nf.format(h.headroomPersonsPerYear)} / yr`} />
              {h.perIndicator.map((row) => (
                <div className="kv" key={row.id}>
                  <span className="k">{row.label}{row.id === h.bindingIndicator ? ' ←' : ''}</span>
                  <span className="v">
                    {row.observed == null ? '— not published'
                      : `${row.observed.toFixed(1)} vs ${row.target} ${row.unit}`}
                    {row.observedYear ? ` · ${row.observedYear}` : ''}
                  </span>
                </div>
              ))}
              <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 0 }}>
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

export function Observer() {
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
          <Legend />
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
    // The Observer is reachable only after the terms have been accepted. Deep links are
    // honoured, not discarded: an unaccepted visitor is sent to the landing, where the
    // gate opens.
    if (route === 'observer' && !hasAccepted()) navigate('landing');
  }, [route]);

  if (route === 'legal') return <Legal />;
  if (route === 'sources') return <SourcesPage />;
  if (route === 'methods') return <Methods />;
  if (route === 'observer' && hasAccepted()) return <Observer />;
  return <Landing />;
}
