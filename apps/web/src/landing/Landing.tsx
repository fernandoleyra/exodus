import { useEffect, useMemo, useRef, useState } from 'react';
import { createScene, type SceneData, type SceneHandle } from './scene';
import { useStore } from '../state';
import { accept, hasAccepted, navigate } from '../router';
import './landing.css';

/** Seven acts. Each holds the camera while one idea lands. */
const ACTS = [
  {
    kicker: 'Exodus',
    title: 'Nobody has ever counted\nthe world’s migrants.',
    body: 'Not one bilateral migration figure on earth is observed. Every number you have read — in a manifesto, a headline, a parliamentary speech — is the output of a model.',
  },
  {
    kicker: '01 — The data',
    title: 'Four decades.\n230 countries.\nEvery corridor.',
    body: 'A deep recurrent network over 18 covariates, 1990 to 2023, published openly under CC BY. We render all of it, one year per frame, with nothing interpolated between.',
  },
  {
    kicker: '02 — The argument',
    title: 'Two good models\ndisagree by 80%.',
    body: 'Compared on the only grid they share, the median corridor splits the two best published estimates by 80 percent. India to the UAE differs by 3.5×. Syria to Turkey by 5.9×. That gap is not noise. It is the state of the evidence.',
  },
  {
    kicker: '03 — The pressure',
    title: 'Where the weight\nactually falls.',
    body: 'Volume rises from the surface where people concentrate. Not where a narrative says they do. Countries that publish little stay dim, because a state with no statistical office cannot borrow the authority of one that has had a census since 1749.',
  },
  {
    kicker: '04 — The refusal',
    title: 'Where we have nothing,\nwe show nothing.',
    body: 'No imputation. No smoothing over a gap. A corridor nobody has checked renders grey and broken, and the panel says so in words. An absent number is an em-dash, never a zero.',
  },
  {
    kicker: '05 — The point',
    title: 'Migration is used\nas leverage.',
    body: 'Numbers with no provenance move borders, budgets and votes. This is an open instrument for reading the evidence yourself — every figure carrying its source, its vintage, and how much the evidence argues with itself.',
  },
] as const;

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
          <a href="#/methods">Methods</a>
          <a href="#/legal">Legal</a>
          <button className="nav-enter" onClick={() => (hasAccepted() ? navigate('observer') : setGate(true))}>
            Enter the Observer
          </button>
        </nav>
      </header>

      <div className="acts">
        {ACTS.map((a, i) => (
          <section className="act" key={i} style={{ ['--i' as string]: i }}>
            <div className="act-inner">
              <div className="act-kicker">{a.kicker}</div>
              <h1 className="act-title">{a.title.split('\n').map((l, k) => <span key={k}>{l}</span>)}</h1>
              <p className="act-body">{a.body}</p>
            </div>
          </section>
        ))}

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
