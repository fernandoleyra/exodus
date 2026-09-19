// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Where two sources describe the same quantity, this is the page that says how far
// apart they are — and, more usefully, which kind of far apart. See stats.ts for
// why "which kind" is the load-bearing half.
import { useEffect, useMemo, useState } from 'react';
import { PageShell } from '../pages/PageShell';
import {
  CLASS_LABEL, CLASS_MEANING, CLASS_SEVERITY,
  DIVERGENT_PCT, MIN_N, OFFSET_PCT, RANK_FLOOR, SAME_PCT, SCATTER_PCT,
  type DiffClass,
} from './stats';
import type { Concordance as Doc, Measure, PairResult } from './types';
import './concordance.css';

const CLASS_TONE: Record<DiffClass, string> = {
  same: 'info', offset: 'ok', residual: 'ok',
  scatter: 'warn', divergent: 'bad', conflict: 'bad', insufficient: 'info',
};

const KIND_LABEL = { observed: 'counted', reported: 'reported', modelled: 'modelled' } as const;

/** Short names for the overview dots. Keyed measure-id + pair index, in the order
 *  build-concordance.mjs emits them; the e2e run asserts every dot finds a name. */
const DOT_LABEL: Record<string, string> = {
  'inflow-0': 'Eurostat, all vs foreign',
  'inflow-1': 'Eurostat vs model',
  'inflow-2': 'Eurostat foreign vs model',
  'corridor-0': 'two flow models',
  'unemployment-0': 'unemployment: WB vs Eurostat',
  'unemployment-1': 'unemployment: WB vs IMF',
  'unemployment-2': 'unemployment: Eurostat vs IMF',
  'gdppc-0': 'GDP per capita',
  'population-0': 'population',
};

/** Written out of the thresholds themselves, so the table on the page cannot come to
 *  describe rules the classifier no longer applies. */
const CONDITION: Record<DiffClass, string> = {
  same: `spread < ${SAME_PCT}% and gap < ${SAME_PCT}%`,
  offset: `spread < ${OFFSET_PCT}%, gap \u2265 ${SAME_PCT}%`,
  residual: `spread < ${SCATTER_PCT}%`,
  scatter: `spread < ${DIVERGENT_PCT}%`,
  divergent: `spread \u2265 ${DIVERGENT_PCT}%`,
  conflict: `\u03c1 < ${RANK_FLOOR.toFixed(2)}, whatever the spread`,
  insufficient: `fewer than ${MIN_N} shared entries`,
};

function fmt(v: number, unit: string): string {
  if (unit.startsWith('%')) return `${v.toFixed(1)}%`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}bn`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}m`;
  if (v >= 1e4) return `${Math.round(v / 1e3)}k`;
  if (v >= 100) return Math.round(v).toLocaleString('en');
  return v.toFixed(2);
}

/** A ratio reads better as "1.7x" above 1 and "-41%" below it. */
function fmtRatio(r: number): string {
  if (r >= 1.25) return `${r.toFixed(2)}×`;
  if (r <= 0.8) return `−${((1 - r) * 100).toFixed(0)}%`;
  return `${r >= 1 ? '+' : '−'}${(Math.abs(r - 1) * 100).toFixed(1)}%`;
}

function Chip({ cls }: { cls: DiffClass }) {
  return <span className={`cc-chip tone-${CLASS_TONE[cls]}`}>{CLASS_LABEL[cls]}</span>;
}

// ---------------------------------------------------------------- the ratio strip
// One tick per entity on a log axis, so A/B and B/A are mirror images rather than
// one squashed against zero. The shaded band is the robust +-1 sigma; the line is
// the median. Level shift reads as the band's position, disagreement as its width.
function RatioStrip({ measure, pair }: { measure: Measure; pair: PairResult }) {
  const [hover, setHover] = useState<{ key: string; x: number } | null>(null);
  const W = 100;
  const points = useMemo(() => {
    const out: { key: string; r: number }[] = [];
    for (const [key, row] of Object.entries(measure.values)) {
      const a = row[pair.a];
      const b = row[pair.b];
      if (a != null && b != null && a > 0 && b > 0) out.push({ key, r: a / b });
    }
    return out.sort((x, y) => x.r - y.r);
  }, [measure, pair]);

  // The axis cannot be scaled to the extremes. In the corridor pair one model
  // estimates 59,000 where the other estimates 1, and letting that set the range
  // squashes all 1,510 entries into a few pixels at the centre — a picture of one
  // outlier rather than of the disagreement. So the axis covers the central 98% and
  // anything past it is pinned to the edge and counted, which is visible rather than
  // quietly dropped.
  const span = useMemo(() => {
    const abs = points.map(p => Math.abs(Math.log(p.r))).sort((m, n) => m - n);
    const p95 = abs.length ? abs[Math.max(0, Math.round((abs.length - 1) * 0.95))]! : 0;
    // Floor of 4x so a pair that agrees closely still gets a legible axis rather than a
    // magnified view of rounding; ceiling of 32x because past that the readable part of
    // the distribution collapses to a few pixels. The corridor pair's 95th percentile is
    // 81x and its 98th is 380x, which is why a percentile alone is not enough.
    return Math.min(Math.max(Math.log(4), p95), Math.log(32));
  }, [points]);
  const clipped = points.filter(p => Math.abs(Math.log(p.r)) > span).length;
  const x = (r: number) => (Math.min(1, Math.max(0, (Math.log(r) / span) * 0.5 + 0.5))) * W;
  const sigma = Math.log(1 + pair.spreadPct / 100);
  const ticks = [1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8].filter(t => Math.abs(Math.log(t)) <= span);

  // A tick is a fraction of a pixel wide and there are up to 1,510 of them, so hovering
  // one directly is not something a hand can do. The whole strip is the hit area
  // instead: the pointer picks whichever entry is nearest along the axis.
  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    if (box.width === 0 || points.length === 0) return;
    const at = ((e.clientX - box.left) / box.width) * W;
    let best = points[0]!;
    let bestD = Infinity;
    for (const p of points) {
      const d = Math.abs(x(p.r) - at);
      if (d < bestD) { bestD = d; best = p; }
    }
    setHover({ key: best.key, x: x(best.r) });
  };

  return (
    <div className="cc-strip-wrap">
      <svg className="cc-strip" viewBox={`0 0 ${W} 22`} preserveAspectRatio="none" role="img"
           aria-label={`Ratio of ${pair.a} to ${pair.b} for ${points.length} entries, median ${pair.medianRatio.toFixed(2)}`}>
        <rect x={x(pair.medianRatio * Math.exp(-sigma))} y="3"
              width={Math.max(0.35, x(pair.medianRatio * Math.exp(sigma)) - x(pair.medianRatio * Math.exp(-sigma)))}
              height="13" className="cc-band" />
        {ticks.map(t => (
          <line key={t} x1={x(t)} x2={x(t)} y1="2" y2="17" className={t === 1 ? 'cc-unity' : 'cc-gridline'} />
        ))}
        {points.map(p => (
          <line key={p.key} x1={x(p.r)} x2={x(p.r)} y1="4.5" y2="15.5" className="cc-tick" />
        ))}
        <line x1={x(pair.medianRatio)} x2={x(pair.medianRatio)} y1="1.5" y2="18" className="cc-median" />
        {hover && <line x1={hover.x} x2={hover.x} y1="2" y2="18" className="cc-cursor" />}
        <rect x="0" y="0" width={W} height="22" className="cc-hit-area"
              onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </svg>
      <div className="cc-strip-axis">
        {ticks.map(t => (
          <span key={t} style={{ left: `${x(t)}%` }} className={t === 1 ? 'unity' : ''}>
            {t === 1 ? 'equal' : t > 1 ? `${t}×` : `1/${Math.round(1 / t)}`}
          </span>
        ))}
      </div>
      {clipped > 0 && (
        <p className="cc-clipped">
          {clipped} of {points.length} sit past this range and are pinned to the edge —
          entries where one source is close to zero and the other is not.
        </p>
      )}
      {hover && <StripTip measure={measure} pair={pair} entry={hover} />}
    </div>
  );
}

// ---------------------------------------------------------------- one pair
function StripTip({ measure, pair, entry }: { measure: Measure; pair: PairResult; entry: { key: string; x: number } }) {
  const row = measure.values[entry.key];
  if (!row) return null;
  const a = row[pair.a];
  const b = row[pair.b];
  if (a == null || b == null) return null;
  return (
    <div className="cc-strip-tip" style={{ left: `${Math.min(88, Math.max(4, entry.x))}%` }}>
      <b>{measure.labels[entry.key]}</b>
      <span>{fmt(a, measure.unit)} vs {fmt(b, measure.unit)}</span>
      <span className="tip-r">{fmtRatio(a / b)}</span>
    </div>
  );
}

function Pair({ measure, pair }: { measure: Measure; pair: PairResult }) {
  const [open, setOpen] = useState(false);
  const a = measure.series.find(s => s.id === pair.a);
  const b = measure.series.find(s => s.id === pair.b);
  if (!a || !b) return null;   // build-concordance never emits this; the test suite proves it
  return (
    <div className={`cc-pair tone-${CLASS_TONE[pair.cls]}`}>
      <div className="cc-pair-head">
        <div className="cc-pair-names">
          <span className="cc-a">{a.label}</span>
          <span className="cc-vs">against</span>
          <span className="cc-b">{b.label}</span>
        </div>
        <Chip cls={pair.cls} />
      </div>

      <dl className="cc-stats">
        <div><dt>typical gap</dt><dd>{fmtRatio(pair.medianRatio)}</dd></div>
        <div><dt>spread</dt><dd>&plusmn;{pair.spreadPct.toFixed(1)}%</dd></div>
        <div><dt>rank agreement</dt><dd className={pair.rankRho !== null && pair.rankRho < RANK_FLOOR ? 'bad' : ''}>
          {pair.rankRho === null ? 'n/a' : pair.rankRho.toFixed(3)}</dd></div>
        <div><dt>shared</dt><dd>{pair.n}</dd></div>
      </dl>

      <RatioStrip measure={measure} pair={pair} />
      <p className="cc-meaning">{CLASS_MEANING[pair.cls]}</p>

      <button className="cc-more" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {open ? 'Hide' : 'Show'} the {pair.worst.length} furthest from the typical gap
      </button>
      {open && (
        <p className="cc-floor-note">
          Drawn from the {pair.materialN} entries that are material on both sides — at or
          above {fmt(pair.floors[0], measure.unit)} and {fmt(pair.floors[1], measure.unit)}{' '}
          respectively. Without that floor this table fills with entries where one source
          rounds to zero, which inflates a ratio without telling you anything.
        </p>
      )}
      {open && (
        <table className="cc-tbl">
          <thead>
            <tr>
              <th>{measure.entity === 'corridor' ? 'Corridor' : 'Country'}</th>
              <th>{a.label}</th>
              <th>{b.label}</th>
              <th>ratio</th>
            </tr>
          </thead>
          <tbody>
            {pair.worst.map(w => {
              const row = measure.values[w.key] ?? {};
              const av = row[pair.a];
              const bv = row[pair.b];
              return (
                <tr key={w.key}>
                  <td>{measure.labels[w.key]}</td>
                  <td>{av == null ? '\u2014' : fmt(av, measure.unit)}</td>
                  <td>{bv == null ? '\u2014' : fmt(bv, measure.unit)}</td>
                  <td className="num">{fmtRatio(w.ratio)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- the overview map
// Every comparison in the app on two axes at once: how wide the disagreement is, and
// whether the ordering survives it. Bottom-left is the only quadrant that means
// "these two agree"; the dashed line is the rank floor below which the level
// statistics stop describing anything.
function Overview({ measures, onPick }: { measures: Measure[]; onPick: (m: string, i: number) => void }) {
  const pts = measures.flatMap((m, mi) => m.pairs.map((p, pi) => ({ m, mi, p, pi })));
  const W = 560, H = 300, L = 54, R = 118, T = 18, B = 40;
  const xs = (pct: number) => L + (Math.log10(Math.max(0.3, pct)) - Math.log10(0.3)) / (Math.log10(300) - Math.log10(0.3)) * (W - L - R);
  const Y0 = 0.775, Y1 = 1.005;
  const ys = (rho: number) => T + (1 - (rho - Y0) / (Y1 - Y0)) * (H - T - B);
  const xticks = [0.3, 1, 3, 10, 30, 100, 300];
  const yticks = [0.8, 0.85, 0.9, 0.95, 1.0];

  // Three of these pairs sit at rank agreement 1.00 within a hair of each other, so
  // labels placed independently write over one another. Place them in one pass: work
  // down the plot and push any label that would land on the previous one clear of it,
  // with a leader line back to its dot so the nudge stays readable.
  const LAB_H = 11;
  const dots = pts
    .map(pt => ({ pt, cx: xs(pt.p.spreadPct), cy: ys(pt.p.rankRho ?? 1) }))
    .sort((m, n) => m.cy - n.cy || m.cx - n.cx);
  const placed: { pt: (typeof pts)[number]; cx: number; cy: number; ly: number; lx: number }[] = [];
  for (const d of dots) {
    // Down first: a label that would sit on one already placed drops below it, with a
    // leader line back to its own dot.
    let ly = d.cy;
    for (const prev of placed) {
      if (Math.abs(prev.ly - ly) < LAB_H && Math.abs(prev.cx - d.cx) < 300) ly = prev.ly + LAB_H;
    }
    // Then right: a nudged label can still run straight through a dot that stacking
    // never considered, so start it clear of every dot on its own line.
    // Clearance is the dot radius plus its hover ring plus a space, so a label never
    // starts under the mark it belongs to or under the one it had to step around.
    const CLEAR = 15;
    let lx = d.cx + CLEAR;
    for (const o of dots) {
      if (o !== d && Math.abs(o.cy - ly) < LAB_H && o.cx >= lx - CLEAR) lx = o.cx + CLEAR;
    }
    placed.push({ ...d, ly, lx });
  }
  return (
    <figure className="cc-overview">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Every source comparison plotted by spread against rank agreement">
        {yticks.map(t => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={ys(t)} y2={ys(t)} className="cc-gridline" />
            <text x={L - 8} y={ys(t) + 3.5} className="cc-axlab end">{t.toFixed(2)}</text>
          </g>
        ))}
        {xticks.map(t => (
          <g key={t}>
            <line x1={xs(t)} x2={xs(t)} y1={T} y2={H - B} className="cc-gridline" />
            <text x={xs(t)} y={H - B + 15} className="cc-axlab mid">{t < 1 ? t : t}%</text>
          </g>
        ))}
        <line x1={L} x2={W - R} y1={ys(RANK_FLOOR)} y2={ys(RANK_FLOOR)} className="cc-floor" />
        <text x={L + 4} y={ys(RANK_FLOOR) - 6} className="cc-axlab dim">rank floor — below this, the ordering itself is in dispute</text>
        {placed.map(({ pt: { m, p, pi }, cx, cy, ly, lx }) => {
          const right = lx < W - R + 40;
          return (
            <g key={`${m.id}-${pi}`} className={`cc-dot tone-${CLASS_TONE[p.cls]}`} onClick={() => onPick(m.id, pi)}
               role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') onPick(m.id, pi); }}>
              {(Math.abs(ly - cy) > 1 || lx > cx + 18) && (
                <line x1={cx} y1={cy} x2={right ? lx - 3 : lx + 3} y2={ly - 3} className="cc-leader" />
              )}
              <circle cx={cx} cy={cy} r="12" className="cc-dot-hit" />
              <circle cx={cx} cy={cy} r="5.5" />
              <text x={right ? lx : cx - 9} y={ly + 3.2} className={`cc-dotlab${right ? '' : ' end'}`}>
                {DOT_LABEL[`${m.id}-${pi}`] ?? m.title}
              </text>
              <title>{`${m.title}: ${m.series.find(s => s.id === p.a)?.label ?? p.a} against ${m.series.find(s => s.id === p.b)?.label ?? p.b} — ${CLASS_LABEL[p.cls]}`}</title>
            </g>
          );
        })}
        <text x={L + (W - L - R) / 2} y={H - 6} className="cc-axtitle mid">spread of the per-entry ratio &rarr;</text>
        <text x={14} y={T + (H - T - B) / 2} className="cc-axtitle" transform={`rotate(-90 14 ${T + (H - T - B) / 2})`}>rank agreement &rarr;</text>
      </svg>
      <ul className="cc-legend">
        {/* Colour is the trust level, not the verdict — two verdicts can share one and
            the wording is what tells them apart, so the legend groups them that way. */}
        <li className="tone-info"><i /> <b>Same number</b> &mdash; not independent</li>
        <li className="tone-ok"><i /> <b>Fixed offset</b> or <b>agree, with residual</b> &mdash; reconcilable</li>
        <li className="tone-warn"><i /> <b>Scatter</b> &mdash; no single factor reconciles it</li>
        <li className="tone-bad"><i /> <b>Substantive disagreement</b> or <b>different ordering</b> &mdash; read as uncertainty</li>
      </ul>
      <figcaption>
        Each dot is one pair of sources measuring one quantity. Click a dot to jump to it.
        Toward the left, the two producers put out nearly the same number; toward the
        bottom they stop agreeing about which places are larger, and at that point the
        distance between them is no longer a units problem.
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------- lookup
// The question a reader actually arrives with is about one country. This answers it
// without making them read five sections to find it.
function bySeverity(x: Measure, y: Measure): number {
  return Math.max(...y.pairs.map(p => CLASS_SEVERITY[p.cls])) - Math.max(...x.pairs.map(p => CLASS_SEVERITY[p.cls]));
}

function Lookup({ measures }: { measures: Measure[] }) {
  const [q, setQ] = useState('');
  // A search for "Switzerland" matches its country rows and every corridor it appears
  // in. The country rows are the answer to the question asked; the corridors are extra.
  // So country measures come first and each measure contributes at most a handful,
  // rather than one measure with 1,510 entries drowning the other four.
  const PER_MEASURE = 6;
  const hits = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    const ordered = [...measures].sort((x, y) =>
      (x.entity === 'corridor' ? 1 : 0) - (y.entity === 'corridor' ? 1 : 0) || bySeverity(x, y));
    const out: { m: Measure; key: string; more: number }[] = [];
    for (const m of ordered) {
      const matches = Object.keys(m.values).filter(key =>
        (m.labels[key] ?? key).toLowerCase().includes(needle) || key.toLowerCase().includes(needle));
      matches.slice(0, PER_MEASURE).forEach((key, i) => out.push({
        m, key, more: i === Math.min(PER_MEASURE, matches.length) - 1 ? matches.length - Math.min(PER_MEASURE, matches.length) : 0,
      }));
    }
    return out;
  }, [q, measures]);

  return (
    <section className="cc-lookup">
      <label htmlFor="cc-q">Look up one place</label>
      <input id="cc-q" type="search" value={q} placeholder="Germany, Colombia, SVK…"
             onChange={e => setQ(e.target.value)} autoComplete="off" spellCheck={false} />
      {q.trim().length >= 2 && hits.length === 0 && (
        <p className="cc-empty">Nothing under that name is covered by two sources here.</p>
      )}
      {hits.map(({ m, key, more }) => {
        const row = m.values[key] ?? {};
        const vals = m.series.flatMap(s => {
          const v = row[s.id];
          return v == null ? [] : [{ s, v }];
        });
        if (vals.length < 2) return null;
        const nums = vals.map(x => x.v);
        const lo = Math.min(...nums), hi = Math.max(...nums);
        return (
          <div className="cc-hit" key={`${m.id}-${key}`}>
            <div className="cc-hit-head">
              <b>{m.labels[key]}</b>
              <span>{m.title}{String(m.title).includes(String(m.year)) ? '' : ` \u00b7 ${m.year}`}</span>
              <span className={`cc-hit-gap ${hi / lo > 1.15 ? 'wide' : ''}`}>
                {hi / lo < 1.005 ? 'sources agree' : `${fmtRatio(hi / lo)} apart`}
              </span>
            </div>
            <ul>
              {vals.map(({ s, v }) => (
                <li key={s.id}>
                  <span className="cc-hit-src">{s.label}</span>
                  <span className={`cc-kind k-${s.kind}`}>{KIND_LABEL[s.kind]}</span>
                  <span className="cc-hit-val">{fmt(v, m.unit)}</span>
                  <span className="cc-hit-bar"><i style={{ width: `${(v / hi) * 100}%` }} /></span>
                </li>
              ))}
            </ul>
            {more > 0 && <p className="cc-more-count">and {more} more {m.entity === 'corridor' ? 'corridors' : 'entries'} matching that name</p>}
          </div>
        );
      })}
    </section>
  );
}

// ---------------------------------------------------------------- page
export function ConcordancePage() {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch('/snapshot/concordance.json')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setDoc)
      .catch(e => setErr(String(e)));
  }, []);

  const jump = (mid: string, pi: number) => {
    document.getElementById(`pair-${mid}-${pi}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <PageShell title="Do the sources agree?" kicker="Concordance">
      <p className="lede">
        Every figure in Exodus comes from somewhere, and for several of them more than
        one organisation publishes a number for the same thing in the same year. Here
        those numbers are put side by side.
      </p>
      <p>
        The useful question is not how big the gap is. It is what kind of gap it is.
        Two sources can sit 60% apart and still be telling one consistent story in
        different units, and two sources can agree on the average while disagreeing about
        every individual country. A single &ldquo;percent different&rdquo; figure hides
        that difference, so each comparison below is placed on two axes instead: how far
        apart the numbers are, and whether they still put countries in the same order.
      </p>
      <p className="honest">
        <b>Nothing here says which source is right.</b> Exodus has no way to adjudicate
        between two statistical agencies and does not try. What it can do is refuse to
        present one number as if it were the only one.
      </p>

      {err && <p className="cc-err">The concordance data did not load: {err}</p>}
      {!doc && !err && <p className="muted">Loading comparisons&hellip;</p>}

      {doc && (
        <>
          <h2>Every comparison at once</h2>
          <Overview measures={doc.measures} onPick={jump} />
          <Lookup measures={doc.measures} />

          {[...doc.measures].sort(bySeverity).map(m => (
              <section key={m.id} className="cc-measure">
                <h2>{m.title}</h2>
                <p className="cc-question">{m.question}</p>
                <p className="cc-scope">
                  <b>{m.year}</b> &middot; {m.unit} &middot; {m.scope} &middot;{' '}
                  {Object.keys(m.values).length} {m.entity === 'corridor' ? 'corridors' : 'countries'} covered by more than one source
                </p>
                <ul className="cc-series">
                  {m.series.map(s => (
                    <li key={s.id}>
                      <span className="cc-hit-src">{s.label}</span>
                      <span className={`cc-kind k-${s.kind}`}>{KIND_LABEL[s.kind]}</span>
                      <span className="cc-method">{s.method}</span>
                    </li>
                  ))}
                </ul>
                <p className="cc-note">{m.note}</p>
                {[...m.pairs]
                  .map((p, i) => ({ p, i }))
                  .sort((x, y) => CLASS_SEVERITY[y.p.cls] - CLASS_SEVERITY[x.p.cls])
                  .map(({ p, i }) => (
                    <div id={`pair-${m.id}-${i}`} key={i}><Pair measure={m} pair={p} /></div>
                  ))}
              </section>
          ))}

          <h2>How the verdicts are decided</h2>
          <p>
            For each pair the ratio of the two figures is taken country by country, in log
            space so that twice and half score the same distance. The <b>typical gap</b> is
            the median of those ratios; the <b>spread</b> is a median-absolute-deviation
            read back as a percentage, so a handful of outliers cannot manufacture it; the{' '}
            <b>rank agreement</b> is Spearman&rsquo;s rho. The thresholds are fixed and
            applied the same way to every pair:
          </p>
          <table className="tbl">
            <thead><tr><th>Verdict</th><th>Condition</th><th>What it means</th></tr></thead>
            <tbody>
              {(['same', 'offset', 'residual', 'scatter', 'divergent', 'conflict'] as DiffClass[]).map(c => (
                <tr key={c}>
                  <td><Chip cls={c} /></td>
                  <td className="cond">{{
                    same: 'spread < 2% and gap < 2%',
                    offset: 'spread < 4%, gap ≥ 2%',
                    residual: 'spread < 8%',
                    scatter: 'spread < 50%',
                    divergent: 'spread ≥ 50%',
                    conflict: 'ρ < 0.80, whatever the spread',
                  }[c as 'same']}</td>
                  <td className="mean">{CLASS_MEANING[c]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">
            The code is <code>src/concordance/stats.ts</code> and the figures above are
            recomputed from the shipped data by its test suite on every build, so a verdict
            cannot drift away from the numbers it describes.
          </p>
        </>
      )}
    </PageShell>
  );
}
