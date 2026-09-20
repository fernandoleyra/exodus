// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// One rule decides what every one of the fifty layers paints at a given cursor. Before this
// there were four rules and the map behaved differently on either side of 2020, so these are
// the cases that behaviour turned on.
import { describe, expect, it } from 'vitest';
import { resolve, span, GROUP_LABEL, type Entry } from './catalogue';

const entry = (over: Partial<Entry>): Entry => ({
  id: 'inbound', name: 'x', what: 'x', group: 'movement', unit: 'people',
  periods: [], cadence: 'annual', estimate: 'modelled', producer: 'p',
  provisional: false, commercialUseClear: true, ...over,
});

const annual = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => String(from + i));

describe('resolving a layer against the cursor', () => {
  it('a layer with no time dimension answers everywhere and says so', () => {
    const r = resolve(entry({ periods: [], cadence: 'none' }), 1995);
    expect(r).toEqual({ period: null, exact: true, timeless: true });
  });

  it('paints the cursor year when it has it', () => {
    const r = resolve(entry({ periods: annual(1990, 2023) }), 2019);
    expect(r).toEqual({ period: '2019', exact: true, timeless: false });
  });

  it('reaches BACK to the newest period it has, and flags that it did', () => {
    // A reader at 2026 asking a series that ends in 2023 should see 2023, clearly labelled.
    // The alternative the app used to choose was an empty globe.
    const r = resolve(entry({ periods: annual(1990, 2023) }), 2026);
    expect(r.period).toBe('2023');
    expect(r.exact).toBe(false);
  });

  it('never reaches FORWARD', () => {
    const r = resolve(entry({ periods: annual(2021, 2025) }), 2019);
    expect(r.period).toBeNull();
    expect(r.exact).toBe(false);
  });

  it('counts a five-year window as covering every year inside it', () => {
    // This was the wording bug the cliff fix introduced: the window labelled 2015 really does
    // cover 2019, and telling a reader at 2019 they were looking at something older was wrong.
    const q = entry({ periods: ['2005', '2010', '2015'], cadence: 'quinquennial' });
    expect(resolve(q, 2015)).toMatchObject({ period: '2015', exact: true });
    expect(resolve(q, 2019)).toMatchObject({ period: '2015', exact: true });
    expect(resolve(q, 2020)).toMatchObject({ period: '2015', exact: false });
    expect(resolve(q, 2014)).toMatchObject({ period: '2010', exact: true });
  });

  it('resolves a monthly layer to its newest month within the cursor year', () => {
    const m = entry({ periods: ['2026-05', '2026-06', '2026-07'], cadence: 'monthly' });
    expect(resolve(m, 2026)).toMatchObject({ period: '2026-07', exact: true });
    expect(resolve(m, 2025).period).toBeNull();
  });

  it('resolves a quarterly layer the same way', () => {
    const q = entry({ periods: ['2025-Q4', '2026-Q1', '2026-Q2'], cadence: 'quarterly' });
    expect(resolve(q, 2026)).toMatchObject({ period: '2026-Q2', exact: true });
    expect(resolve(q, 2025)).toMatchObject({ period: '2025-Q4', exact: true });
  });

  it('treats a single-point layer as answering only from its own year', () => {
    // The foreign-born share used to paint one 2024 measurement identically at 1990 and 2023.
    const p = entry({ periods: ['2024'], cadence: 'point' });
    expect(resolve(p, 2024)).toMatchObject({ period: '2024', exact: true });
    expect(resolve(p, 2026)).toMatchObject({ period: '2024', exact: false });
    expect(resolve(p, 1990).period).toBeNull();
  });
});

describe('the coverage bar', () => {
  it('spans the fraction of the axis a layer covers', () => {
    const e = entry({ periods: annual(2008, 2026) });
    const [a, b] = span(e, 1990, 2026)!;
    expect(a).toBeCloseTo(18 / 36, 6);
    expect(b).toBeCloseTo(1, 6);
  });

  it('has nothing to draw for a layer with no time dimension', () => {
    expect(span(entry({ periods: [] }), 1990, 2026)).toBeNull();
  });

  it('clamps a layer that starts before the axis does', () => {
    const [a] = span(entry({ periods: annual(1960, 2000) }), 1990, 2026)!;
    expect(a).toBe(0);
  });
});

describe('grouping', () => {
  it('names all three groups', () => {
    expect(Object.keys(GROUP_LABEL).sort()).toEqual(['context', 'movement', 'population']);
  });
});

// The panel names a period and the globe paints a frame, and until now each worked that out
// for itself. That is how "Showing 2023" came to sit over an empty globe at 2026. useSurface
// now clamps the spine index the same way resolve clamps the label; this pins the two
// together so a change to one without the other fails here rather than on screen.
describe('the label the panel shows and the frame the globe paints', () => {
  const SPINE_MIN = 1990, SPINE_MAX = 2023;
  const spine = entry({ periods: annual(SPINE_MIN, SPINE_MAX), cadence: 'annual' });

  it('agree at every year the cursor can reach, including past the spine', () => {
    for (let y = SPINE_MIN; y <= 2030; y++) {
      const label = resolve(spine, y).period;
      // What useSurface hands to computeMetrics, as a year rather than an index.
      const painted = Math.min(y, SPINE_MAX);
      expect(label).toBe(String(painted));
    }
  });

  it('marks every year past the spine as standing in for an older one', () => {
    for (let y = SPINE_MAX + 1; y <= 2030; y++) expect(resolve(spine, y).exact).toBe(false);
    for (let y = SPINE_MIN; y <= SPINE_MAX; y++) expect(resolve(spine, y).exact).toBe(true);
  });

  it('paints nothing before a point measurement exists, rather than backdating it', () => {
    // The foreign-born share is one 2024 number. It used to be painted identically at 1990
    // and at 2023 because the value was in memory and the renderer never asked.
    const point = entry({ id: 'stockshare', periods: ['2024'], cadence: 'point', unit: '%' });
    expect(resolve(point, 1990).period).toBeNull();
    expect(resolve(point, 2023).period).toBeNull();
    expect(resolve(point, 2024)).toMatchObject({ period: '2024', exact: true });
    expect(resolve(point, 2026)).toMatchObject({ period: '2024', exact: false });
  });
});
