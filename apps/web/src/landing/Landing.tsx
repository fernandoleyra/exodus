import { useEffect, useMemo, useRef, useState } from 'react';
import { createScene, type SceneData, type SceneHandle } from './scene';
import { useStore } from '../state';
import { accept, hasAccepted, navigate } from '../router';
import './landing.css';

/** Each act pairs a short line with a VISUAL that carries the evidence. The numbers count
 *  up as the act enters, so the figure is watched arriving rather than read. */
type Metric = { value: number; suffix?: string; prefix?: string; label: string; tone?: 'cool' | 'warm' | 'dim' };

interface Act {
  kicker: string;
  title: string;
  body?: string;
  metrics?: Metric[];
  /** A small inline visual: a divergence bar, a coverage meter, a period grid. */
  figure?: 'divergence' | 'coverage' | 'grid' | 'scale';
}

const ACTS: Act[] = [
  {
    kicker: 'Exodus',
    title: 'Nobody has ever counted\nthe world’s migrants.',
    body: 'Every figure you have read is the output of a model.',
    metrics: [
      { value: 0, suffix: '', label: 'corridors ever directly observed', tone: 'dim' },
    ],
  },
  {
    kicker: '01 — The record',
    title: 'Four decades.\nEvery corridor.',
    metrics: [
      { value: 34, label: 'years, 1990–2023' },
      { value: 230, label: 'countries in the spine' },
      { value: 1548, label: 'corridors rendered' },
    ],
    figure: 'grid',
  },
  {
    kicker: '02 — The argument',
    title: 'Two good models.\nOne corridor.\nA different answer.',
    body: 'Both are published. Both are competent. Watch them separate.',
    metrics: [
      { value: 76, suffix: '%', label: 'median disagreement', tone: 'warm' },
      { value: 177, suffix: '%', label: 'at the 90th percentile', tone: 'warm' },
    ],
    figure: 'divergence',
  },
  {
    kicker: '03 — The weight',
    title: 'Where it actually\nfalls.',
    body: 'Volume rises where people concentrate — not where a narrative puts them.',
    figure: 'scale',
  },
  {
    kicker: '04 — The edge of the evidence',
    title: 'After 2019,\nnobody checked.',
    body: 'The two models share no ground past 2019. Every corridor beyond it goes grey.',
    metrics: [
      { value: 1538, label: 'corridors with a second opinion' },
      { value: 2019, label: 'last corroborated year', tone: 'warm' },
    ],
    figure: 'coverage',
  },
  {
    kicker: '05 — The point',
    title: 'Migration is used\nas leverage.',
    body: 'Numbers with no provenance move borders, budgets and votes. This is an instrument for reading the evidence yourself.',
  },
];

/** Counts to a target when the element enters view. The arrival is the point: a number that
 *  lands is remembered, a number that is simply printed is not. */
function Counter({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setN(to); return; }
    let raf = 0, start = 0;
    const io = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) return;
      io.disconnect();
      const step = (t: number) => {
        if (!start) start = t;
        const k = Math.min(1, (t - start) / 1100);
        const eased = 1 - Math.pow(1 - k, 3);
        setN(to * eased);
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  const shown = to >= 1000 ? Math.round(n).toLocaleString('en-US')
    : to % 1 === 0 ? String(Math.round(n)) : n.toFixed(1);
  return <span ref={ref} className="counter">{prefix}{shown}{suffix}</span>;
}

/** Two bars that separate as they enter: the disagreement, drawn rather than described. */
function DivergenceFigure() {
  return (
    <div className="fig fig-div">
      {[
        { name: 'SYR → TUR', a: 62, b: 11 },
        { name: 'IND → ARE', a: 74, b: 21 },
        { name: 'MEX → USA', a: 55, b: 71 },
      ].map((r) => (
        <div className="divrow" key={r.name}>
          <span className="divname">{r.name}</span>
          <span className="divbars">
            <i className="bar-a" style={{ ['--w' as string]: `${r.a}%` }} />
            <i className="bar-b" style={{ ['--w' as string]: `${r.b}%` }} />
          </span>
        </div>
      ))}
      <div className="divkey">
        <span><i className="sw sw-a" /> spine model</span>
        <span><i className="sw sw-b" /> second opinion</span>
      </div>
    </div>
  );
}

/** Six periods, the last two empty: the shared grid ending, shown as a row of cells. */
function CoverageFigure() {
  const periods = ['1990', '1995', '2000', '2005', '2010', '2015', '2020+'];
  return (
    <div className="fig fig-cov">
      {periods.map((y, i) => (
        <span className={`cell ${i <= 5 ? 'on' : 'off'}`} key={y} style={{ ['--d' as string]: `${i * 90}ms` }}>
          <b>{y}</b>
          <span>{i <= 5 ? 'checked' : 'no second model'}</span>
        </span>
      ))}
    </div>
  );
}

function GridFigure() {
  return (
    <div className="fig fig-grid" aria-hidden="true">
      {Array.from({ length: 34 }, (_, i) => (
        <i key={i} style={{ ['--d' as string]: `${i * 26}ms` }} />
      ))}
      <span className="gridlabel">1990 → 2023, one cell per year</span>
    </div>
  );
}

function ScaleFigure() {
  const rows = [
    { n: 'Gulf states', v: 88 }, { n: 'Western Europe', v: 71 },
    { n: 'North America', v: 64 }, { n: 'Sub-Saharan Africa', v: 22 },
  ];
  return (
    <div className="fig fig-scale">
      {rows.map((r, i) => (
        <div className="scalerow" key={r.n}>
          <span className="scalename">{r.n}</span>
          <span className="scalebar"><i style={{ ['--w' as string]: `${r.v}%`, ['--d' as string]: `${i * 110}ms` }} /></span>
        </div>
      ))}
      <span className="scalenote">share of population born elsewhere, relative</span>
    </div>
  );
}

const FIGURES = { divergence: DivergenceFigure, coverage: CoverageFigure, grid: GridFigure, scale: ScaleFigure };

function useScrollProgress(ref: React.RefObject<HTMLDivElement | null>) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const read = () => {
      const el = ref.current;
      if (el) {
        const total = el.scrollHeight - window.innerHeight;
        setP(total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0);
      }
      raf = 0;
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, [ref]);
  return p;
}

/** Builds GPU buffers from the real snapshot. No invented geometry: the point cloud is the
 *  actual place set, the arcs are actual corridors, the columns are actual inbound volume. */
function useSceneData(): SceneData | null {
  const { places, corridors, ready } = useStore();
  return useMemo(() => {
    if (!ready || !places.length) return null;

    const maxStock = Math.max(1, ...places.map((p) => p.stock ?? 0));

    // A Fibonacci sphere, not a scatter around centroids: an even shell of candidate points,
    // each lit only if it falls near a country and coloured by that country's weight. The
    // continents then emerge from the data instead of being drawn, and the oceans stay dark
    // because nothing is there to light them.
    const N = 24000;
    const GOLDEN = Math.PI * (3 - Math.sqrt(5));
    const cent = places.map((p) => {
      const la = (p.centroid[1] * Math.PI) / 180, lo = (p.centroid[0] * Math.PI) / 180;
      return {
        x: Math.cos(la) * Math.cos(lo), y: Math.cos(la) * Math.sin(lo), z: Math.sin(la),
        w: (p.stock ?? 0) / maxStock,
      };
    });
    const pts: number[] = [];
    for (let i = 0; i < N; i++) {
      const z = 1 - (2 * i) / (N - 1);
      const r = Math.sqrt(Math.max(0, 1 - z * z));
      const th = GOLDEN * i;
      const x = Math.cos(th) * r, y = Math.sin(th) * r;
      // Nearest country by chord distance on the unit sphere.
      let best = -2, bw = 0;
      for (const c of cent) {
        const d = x * c.x + y * c.y + z * c.z;
        if (d > best) { best = d; bw = c.w; }
      }
      // ~13 degrees of influence. Beyond that the point is ocean and is not emitted at all.
      const ang = Math.acos(Math.min(1, Math.max(-1, best)));
      if (ang > 0.23) continue;
      const falloff = 1 - ang / 0.23;
      const lon = (Math.atan2(y, x) * 180) / Math.PI;
      const lat = (Math.asin(Math.max(-1, Math.min(1, z))) * 180) / Math.PI;
      pts.push(lon, lat, Math.min(1, (0.16 + 0.84 * bw) * (0.45 + 0.55 * falloff)));
    }

    const yi = 2019 - 1990;
    const scored = corridors
      .map((c) => ({ c, v: c.v[yi] ?? 0 }))
      .filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v)
      .slice(0, 520);
    const maxV = Math.max(1, ...scored.map((x) => x.v));
    const arcs: number[] = [];
    for (const { c, v } of scored) {
      const o = places[c.o], d = places[c.d];
      if (!o || !d) continue;
      const dp = c.dpp.find((x) => x != null) ?? null;
      arcs.push(o.centroid[0], o.centroid[1], d.centroid[0], d.centroid[1],
                Math.sqrt(v / maxV), dp == null ? 0 : Math.min(1, dp / 1.6));
    }

    // Model B on the same corridors, for the divergence act. Where B says nothing the
    // instance still exists but carries zero volume, so it simply does not draw — an
    // absence, never a zero.
    const PERIOD = 5;           // index of the 2015 period, the last both models cover
    const arcsB: number[] = [];
    for (const { c } of scored) {
      const o = places[c.o], d = places[c.d];
      if (!o || !d) continue;
      const b = c.b5?.[PERIOD] ?? null;
      const a = c.a5?.[PERIOD] ?? null;
      const rel = a && b ? Math.min(1, Math.abs(a - b) / ((a + b) / 2) / 1.6) : 0;
      arcsB.push(o.centroid[0], o.centroid[1], d.centroid[0], d.centroid[1],
                 b == null ? 0 : Math.sqrt(Math.min(1, b / (maxV * 5))), rel);
    }

    const inbound = new Map<number, number>();
    for (const { c, v } of scored) inbound.set(c.d, (inbound.get(c.d) ?? 0) + v);
    const maxIn = Math.max(1, ...inbound.values());
    const cols: number[] = [];
    for (const [i, v] of inbound) {
      const p = places[i];
      if (p) cols.push(p.centroid[0], p.centroid[1], Math.sqrt(v / maxIn));
    }

    return {
      points: new Float32Array(pts),
      arcs: new Float32Array(arcs),
      arcsB: new Float32Array(arcsB),
      columns: new Float32Array(cols),
    };
  }, [places, corridors, ready]);
}

function Gate({ onEnter }: { onEnter: () => void }) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-h">
      <div className="gate-panel">
        <div className="gate-rule" />
        <div className="gate-kicker">Restricted only by your own understanding</div>
        <h2 id="gate-h">Enter the Exodus Observer</h2>
        <p className="gate-lede">
          No account. No login. No cookies. No analytics. We do not know who you are and we
          have built nothing that could find out.
        </p>
        <ul className="gate-terms">
          <li><b>Every figure here is a modelled estimate</b>, not an observation. Treat it as
            an argument about the world, not a measurement of it.</li>
          <li><b>You are responsible for how you read and use it.</b> Conclusions you draw,
            decisions you take and anything you publish from it are yours.</li>
          <li><b>It is provided as-is, with no warranty</b> — of accuracy, completeness,
            fitness for any purpose, or continued availability. Source data may be wrong,
            stale, withdrawn or silently revised upstream.</li>
          <li><b>It is not advice</b> — legal, policy, operational or humanitarian — and it
            must not be used to identify, target or act against any person or group.</li>
        </ul>
        <label className="gate-check">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          <span>I have read the <a href="#/legal" onClick={(e) => e.stopPropagation()}>Terms of Use</a> and
            accept them.</span>
        </label>
        <button className="gate-enter" disabled={!checked} onClick={onEnter}>
          Enter the Observer
        </button>
        <p className="gate-foot">
          Some liabilities cannot be excluded by any agreement, and we do not pretend
          otherwise — the <a href="#/legal">Terms</a> say exactly which.
        </p>
      </div>
    </div>
  );
}

export function Landing() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  const progress = useScrollProgress(wrapRef);
  const data = useSceneData();
  const load = useStore((s) => s.load);
  const ready = useStore((s) => s.ready);
  const [gate, setGate] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!data || !canvasRef.current || sceneRef.current) return;
    try { sceneRef.current = createScene(canvasRef.current, data); }
    catch { setFailed(true); }
    return () => { sceneRef.current?.destroy(); sceneRef.current = null; };
  }, [data]);

  useEffect(() => { sceneRef.current?.setProgress(progress); }, [progress]);

  const enter = () => { accept(); navigate('observer'); };

  return (
    <div className="landing" ref={wrapRef}>
      <canvas ref={canvasRef} className="landing-canvas" aria-hidden="true" />
      {failed && <div className="landing-fallback">
        This browser could not start WebGL2. The Observer needs it.
      </div>}

      <header className="landing-nav">
        <span className="wordmark">EXODUS</span>
        <nav>
          <a href="#/sources">Sources</a>
          <a href="#/concordance">Concordance</a>
          <a href="#/methods">Methods</a>
          <a href="#/legal">Legal</a>
          <button className="nav-enter" onClick={() => (hasAccepted() ? navigate('observer') : setGate(true))}>
            Enter the Observer
          </button>
        </nav>
      </header>

      <div className="acts">
        {ACTS.map((a, i) => {
          const Fig = a.figure ? FIGURES[a.figure] : null;
          return (
            <section className="act" key={i} style={{ ['--i' as string]: i }}>
              <div className="act-inner">
                <div className="act-kicker">{a.kicker}</div>
                <h1 className="act-title">{a.title.split('\n').map((l, k) => <span key={k}>{l}</span>)}</h1>
                {a.body && <p className="act-body">{a.body}</p>}
                {a.metrics && (
                  <div className="metrics">
                    {a.metrics.map((m) => (
                      <div className={`metric tone-${m.tone ?? 'cool'}`} key={m.label}>
                        <Counter to={m.value} prefix={m.prefix} suffix={m.suffix} />
                        <span className="metric-label">{m.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                {Fig && <Fig />}
              </div>
            </section>
          );
        })}

        <section className="act act-final">
          <div className="act-inner">
            <div className="act-kicker">Open instrument</div>
            <h1 className="act-title"><span>Read it yourself.</span></h1>
            <p className="act-body">
              Open source, open data, no account, nothing collected. The whole world, offline,
              from a committed snapshot.
            </p>
            <button className="cta" onClick={() => (hasAccepted() ? navigate('observer') : setGate(true))}>
              Enter the Observer
              <span className="cta-sub">{ready ? 'live · 1,548 corridors · 174 places' : 'loading snapshot…'}</span>
            </button>
          </div>
        </section>
      </div>

      <div className="scrollhint" aria-hidden="true" style={{ opacity: progress > 0.02 ? 0 : 1 }}>
        scroll
      </div>

      {gate && <Gate onEnter={enter} />}
    </div>
  );
}
