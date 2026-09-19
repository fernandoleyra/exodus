import { useEffect, useMemo } from 'react';
import { Globe } from './Globe';
import { useStore } from './state';
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
        <span className="swatch" style={{ background: 'linear-gradient(90deg,#6ba8f5,#4dd4ac)', height: 3, alignSelf: 'center' }} />
        <span className="desc"><b>Arc</b> — one modelled corridor. Blue end is origin, green is destination. Width is volume in the selected year.</span>
      </div>
      <div className="legend-row">
        <span className="swatch" style={{ alignSelf: 'center' }}>
          <span style={{ display: 'block', height: 3, background: '#4dd4ac', opacity: .15 }} />
          <span style={{ display: 'block', height: 3, background: '#4dd4ac', opacity: .95, marginTop: 3 }} />
        </span>
        <span className="desc"><b>Opacity = data coverage.</b> A corridor whose endpoints publish little statistics stays dim. It cannot borrow the authority of one that publishes a lot.</span>
      </div>
      <div className="legend-row">
        <span className="swatch" style={{ alignSelf: 'center', background: 'rgba(232,163,61,.22)', borderTop: '1px solid rgba(232,163,61,.5)', borderBottom: '1px solid rgba(232,163,61,.5)' }} />
        <span className="desc"><b>Halo = model disagreement.</b> Two models of the same corridor disagree. The fuzzier the arc, the more they argue. No single number is the truth.</span>
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

  const flows = useMemo(() => {
    if (!p) return null;
    const i = places.indexOf(p);
    let inb = 0, out = 0, nIn = 0, nOut = 0;
    for (const c of corridors) {
      const v = c.v[yi] ?? 0;
      if (c.d === i) { inb += v; nIn++; }
      if (c.o === i) { out += v; nOut++; }
    }
    return { inb, out, nIn, nOut };
  }, [p, places, corridors, yi]);

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

export function App() {
  const { load, ready, year, setYear, manifest, corridors, places } = useStore();
  useEffect(() => { void load(); }, [load]);

  return (
    <div className="app">
      <aside className="panel left">
        <div className="brand">
          <h1>Exodus</h1>
          <div className="tag">Migration intelligence. Every number carries its source, its vintage and how much the evidence disagrees with itself.</div>
        </div>
        <div className="panel-scroll">
          <Legend />
          <div className="sec">
            <h2>Coverage</h2>
            <div className="kv"><span className="k">places</span><span className="v">{places.length}</span></div>
            <div className="kv"><span className="k">corridors</span><span className="v">{corridors.length}</span></div>
            <div className="kv"><span className="k">years</span><span className="v">1990–2023</span></div>
            <div className="kv"><span className="k">disputed, no data join</span><span className="v">{manifest?.disputedRenderedWithoutData.length ?? 0}</span></div>
          </div>
          <Sources />
        </div>
      </aside>

      <main className="stage">
        <div className="topbar">
          <span className="pill">offline · committed snapshot</span>
          <span className="pill warn">corridors are a SYNTHETIC M0 fixture — not a published estimate</span>
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
          <span className="hint">discrete annual frames — the data has no sub-annual resolution, so nothing is interpolated</span>
        </div>
      </main>

      <aside className="panel right">
        <div className="panel-scroll"><Inspector /></div>
      </aside>
    </div>
  );
}
