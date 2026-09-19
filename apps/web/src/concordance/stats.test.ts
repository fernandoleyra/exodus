// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { comparePair, quantile, ranks, spearman, MIN_N } from './stats';

describe('rank machinery', () => {
  it('averages tied ranks, which is what Spearman assumes', () => {
    expect(ranks([10, 20, 20, 30])).toEqual([1, 2.5, 2.5, 4]);
  });

  it('is 1 for a monotone relation regardless of scale', () => {
    const a = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(spearman(a, a.map(v => v ** 3 * 17)) ?? 0).toBeCloseTo(1, 10);
  });

  it('is -1 for a reversal', () => {
    expect(spearman([1, 2, 3, 4], [4, 3, 2, 1]) ?? 0).toBeCloseTo(-1, 10);
  });

  it('returns null rather than 0 when one side is constant', () => {
    expect(spearman([1, 2, 3, 4], [7, 7, 7, 7])).toBeNull();
  });

  it('interpolates quantiles', () => {
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(quantile([1, 2, 3, 4, 5], 0.25)).toBe(2);
  });
});

/** A deterministic spread generator — no Math.random, so a failure is reproducible. */
function jitter(n: number, amplitude: number): number[] {
  return Array.from({ length: n }, (_, i) => 1 + amplitude * Math.sin(i * 2.39996));
}

describe('classification', () => {
  const base = Array.from({ length: 60 }, (_, i) => 100 + i * 37);

  it('calls an identical series "same"', () => {
    const r = comparePair(base, base);
    expect(r.cls).toBe('same');
    expect(r.medianRatio).toBeCloseTo(1, 12);
    expect(r.spreadPct).toBeCloseTo(0, 12);
  });

  it('calls a uniform scaling "offset", not a disagreement', () => {
    // Every country multiplied by exactly 1.15: a definition, not an argument.
    const r = comparePair(base.map(v => v * 1.15), base);
    expect(r.cls).toBe('offset');
    expect(r.medianRatio).toBeCloseTo(1.15, 10);
    expect(r.spreadPct).toBeCloseTo(0, 10);
    expect(r.rankRho ?? 0).toBeCloseTo(1, 10);
  });

  it('separates a level shift from per-country noise', () => {
    // Same median ratio as the case above, but the shift is not uniform.
    const j3 = jitter(60, 0.3);
    const noisy = base.map((v, i) => v * 1.15 * j3[i]!);
    const shifted = comparePair(base.map(v => v * 1.15), base);
    const scattered = comparePair(noisy, base);
    expect(shifted.medianRatio).toBeCloseTo(scattered.medianRatio, 1);
    expect(shifted.cls).toBe('offset');
    expect(scattered.cls).toBe('scatter');
  });

  it('calls a small residual around the right level "residual"', () => {
    const j45 = jitter(60, 0.045);
    const r = comparePair(base.map((v, i) => v * j45[i]!), base);
    expect(r.cls).toBe('residual');
    expect(Math.abs(r.medianRatio - 1) * 100).toBeLessThan(2);
  });

  it('calls a factor-scale disagreement "divergent" while the ordering survives', () => {
    // Values spanning ten orders of magnitude, so a swing of +240%/-69% per entry
    // moves the numbers enormously without reshuffling which entry is larger.
    // That separation is the whole point: huge spread is not the same finding as
    // a broken ordering, and the two must not collapse into one verdict.
    const wide = Array.from({ length: 60 }, (_, i) => 10 ** (i / 6));
    const r = comparePair(wide.map((v, i) => v * (i % 2 ? 3.4 : 0.31)), wide);
    expect(r.rankRho ?? 0).toBeGreaterThan(0.9);
    expect(r.spreadPct).toBeGreaterThan(50);
    expect(r.cls).toBe('divergent');
  });

  it('a rank failure outranks every level statistic', () => {
    // Mean ratio is ~1 and the spread is modest, but the ordering is shuffled.
    const b = [...base].reverse();
    const r = comparePair(base, b);
    expect(r.cls).toBe('conflict');
  });

  it('is symmetric in log space: A/B and B/A score the same spread', () => {
    const j25 = jitter(60, 0.25);
    const a = base.map((v, i) => v * j25[i]!);
    const ab = comparePair(a, base);
    const ba = comparePair(base, a);
    expect(ab.spreadPct).toBeCloseTo(ba.spreadPct, 10);
    expect(ab.medianRatio).toBeCloseTo(1 / ba.medianRatio, 10);
    // And the quantile strip flips end for end, so the picture is the same picture.
    expect(ab.quantiles[0]!).toBeCloseTo(1 / ba.quantiles[4]!, 10);
  });

  it('refuses to classify below the minimum sample', () => {
    const n = MIN_N - 1;
    expect(comparePair(base.slice(0, n), base.slice(0, n)).cls).toBe('insufficient');
  });

  it('drops pairs a ratio cannot be taken through', () => {
    const a = [...base];
    const b = [...base];
    a[0] = 0; b[1] = NaN; a[2] = -5;
    expect(comparePair(a, b).n).toBe(base.length - 3);
  });
});

describe('the shipped snapshot', () => {
  const snap = JSON.parse(readFileSync(new URL('../../public/snapshot/concordance.json', import.meta.url), 'utf8'));
  const measure = (id: string) => snap.measures.find((m: { id: string }) => m.id === id);

  it('ships every measure the view expects', () => {
    for (const id of ['inflow', 'corridor', 'unemployment', 'gdppc', 'population']) {
      expect(measure(id), id).toBeTruthy();
    }
  });

  it('never stores an entry only one source covers', () => {
    for (const m of snap.measures) {
      for (const [key, row] of Object.entries(m.values as Record<string, Record<string, number>>)) {
        expect(Object.keys(row).length, `${m.id}/${key}`).toBeGreaterThan(1);
      }
    }
  });

  it('labels every entry it ships a value for', () => {
    for (const m of snap.measures) {
      for (const key of Object.keys(m.values)) expect(m.labels[key], `${m.id}/${key}`).toBeTruthy();
    }
  });

  it('names only series that exist, on both sides of every pair', () => {
    for (const m of snap.measures) {
      const ids = new Set(m.series.map((s: { id: string }) => s.id));
      for (const p of m.pairs) {
        expect(ids.has(p.a), `${m.id}: ${p.a}`).toBe(true);
        expect(ids.has(p.b), `${m.id}: ${p.b}`).toBe(true);
      }
    }
  });

  it('recomputes each pair from the shipped values, so the verdict cannot drift from the data', () => {
    for (const m of snap.measures) {
      for (const p of m.pairs) {
        const shared = Object.keys(m.values).filter(k => m.values[k][p.a] != null && m.values[k][p.b] != null);
        const again = comparePair(shared.map(k => m.values[k][p.a]), shared.map(k => m.values[k][p.b]));
        expect(again.n, `${m.id} ${p.a}/${p.b}`).toBe(p.n);
        expect(again.cls, `${m.id} ${p.a}/${p.b}`).toBe(p.cls);
        expect(again.medianRatio, `${m.id} ${p.a}/${p.b}`).toBeCloseTo(p.medianRatio, 3);
      }
    }
  });

  // LICENSES/LicenseRef-Eurostat-Reuse.txt promises this is checked rather than assumed.
  // Commission Decision 2011/833/EU withholds commercial reuse of Eurostat data covering
  // countries outside the EU, EFTA and the official acceding and candidate countries, so a
  // Eurostat series that reached beyond that set would have to be cut before redistribution.
  // Failing the build is the only way that stays true of a dataset nobody re-reads.
  it('carries Eurostat figures only for countries its reuse terms cover', () => {
    const EU = ['AUT', 'BEL', 'BGR', 'HRV', 'CYP', 'CZE', 'DNK', 'EST', 'FIN', 'FRA', 'DEU', 'GRC',
      'HUN', 'IRL', 'ITA', 'LVA', 'LTU', 'LUX', 'MLT', 'NLD', 'POL', 'PRT', 'ROU', 'SVK', 'SVN',
      'ESP', 'SWE'];
    const EFTA = ['ISL', 'LIE', 'NOR', 'CHE'];
    const CANDIDATE = ['ALB', 'BIH', 'GEO', 'MDA', 'MNE', 'MKD', 'SRB', 'TUR', 'UKR', 'XKX'];
    const covered = new Set([...EU, ...EFTA, ...CANDIDATE]);

    let checked = 0;
    for (const m of snap.measures) {
      const ids = m.series.filter((s: { producer: string }) => s.producer === 'Eurostat')
        .map((s: { id: string }) => s.id);
      if (ids.length === 0) continue;
      for (const [key, row] of Object.entries(m.values as Record<string, Record<string, number>>)) {
        if (!ids.some((i: string) => row[i] != null)) continue;
        checked++;
        expect(covered.has(key), `${m.id}: Eurostat value for ${key}, outside EU/EFTA/candidate`).toBe(true);
      }
    }
    expect(checked, 'no Eurostat values found — the check would pass vacuously').toBeGreaterThan(30);
  });

  it('holds the two findings the page states in prose', () => {
    // The IMF republishes the Eurostat LFS rate for EU members rather than
    // collecting its own — so this pair is not independent corroboration.
    const u = measure('unemployment');
    expect(u.pairs.find((p: { a: string; b: string }) => p.a === 'estat' && p.b === 'imf').cls).toBe('same');
    // The two bilateral flow models disagree by more than they agree.
    const c = measure('corridor');
    expect(c.pairs[0].cls).toBe('divergent');
    expect(c.pairs[0].spreadPct).toBeGreaterThan(50);
  });
});
