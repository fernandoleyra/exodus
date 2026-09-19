import { describe, expect, it } from 'vitest';
import { DEFAULT_ASSUMPTIONS, headroom } from './headroom';
import type { Place } from '../types';

const base: Place = {
  iso3: 'TST', name: 'Testland', centroid: [0, 0],
  pop: 10_000_000, popYear: 2023, stock: null, stockYear: null,
  unemp: null, unempYear: null, gdppc: null, gdppcYear: null,
  coverage: 0.5, indicatorsPresent: 2,
  beds: null, bedsYear: null, phys: null, physYear: null,
  emp: null, empYear: null, ptr: null, ptrYear: null,
};

describe('headroom refuses rather than inventing', () => {
  it('refuses when fewer than three service stocks are published', () => {
    const r = headroom({ ...base, beds: 3.0, bedsYear: 2021 });
    expect(r.kind).toBe('refusal');
    if (r.kind === 'refusal') {
      expect(r.code).toBe('NoServiceStockData');
      expect(r.reason).toMatch(/would invent the answer/);
      expect(r.perIndicator).toHaveLength(DEFAULT_ASSUMPTIONS.length);
    }
  });

  it('never returns a bare scalar: the binding indicator is always named', () => {
    const r = headroom({ ...base, beds: 6.0, bedsYear: 2021, phys: 4.0, physYear: 2022, emp: 66, empYear: 2023 });
    expect(r.kind).toBe('ok');
    if (r.kind !== 'ok') return;
    expect(r.bindingIndicator).toBeTruthy();
    expect(r.bindingLabel).toBeTruthy();
    expect(r.perIndicator.length).toBeGreaterThanOrEqual(3);
    expect(r.caveat).toMatch(/not a forecast/i);
  });

  it('reports a deficit as negative rather than clamping it to zero', () => {
    // Every stock below target: the country is already short, and that must show.
    const r = headroom({ ...base, beds: 0.5, bedsYear: 2021, phys: 0.3, physYear: 2022, emp: 35, empYear: 2023 });
    expect(r.kind).toBe('ok');
    if (r.kind !== 'ok') return;
    expect(r.headroomPersonsPerYear).toBeLessThan(0);
  });

  it('picks the binding constraint, i.e. the minimum, not the average', () => {
    const r = headroom({ ...base, beds: 9.0, bedsYear: 2021, phys: 9.0, physYear: 2022, emp: 40, empYear: 2023 });
    expect(r.kind).toBe('ok');
    if (r.kind !== 'ok') return;
    expect(r.bindingIndicator).toBe('labour');     // employment is the scarce one here
    const all = r.perIndicator.filter((x) => x.headroomPersonsPerYear != null)
      .map((x) => x.headroomPersonsPerYear!);
    expect(r.headroomPersonsPerYear).toBe(Math.min(...all));
  });

  it('carries the observation year for every stock it uses', () => {
    const r = headroom({ ...base, beds: 6, bedsYear: 2021, phys: 4, physYear: 2022, emp: 66, empYear: 2023 });
    if (r.kind !== 'ok') throw new Error();
    for (const row of r.perIndicator) {
      if (row.observed != null) expect(row.observedYear).not.toBeNull();
    }
  });
});
