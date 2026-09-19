import { describe, expect, it } from 'vitest';
import { headroom, type Benchmarks } from './headroom';
import type { Place } from '../types';

const B: Benchmarks = {
  beds: { value: 2.16, n: 154 }, phys: { value: 1.69, n: 166 },
  emp: { value: 58.19, n: 168 }, ptr: { value: 21.74, n: 154 },
};

const base: Place = {
  iso3: 'TST', name: 'Testland', centroid: [0, 0],
  pop: 10_000_000, popYear: 2023, stock: null, stockYear: null,
  unemp: null, unempYear: null, gdppc: null, gdppcYear: null,
  coverage: 0.5, indicatorsPresent: 2,
  beds: null, bedsYear: null, phys: null, physYear: null,
  emp: null, empYear: null, ptr: null, ptrYear: null,
};

describe('headroom refuses rather than inventing', () => {
  it('refuses when fewer than two convertible stocks are published', () => {
    const r = headroom({ ...base, beds: 3.0, bedsYear: 2021 }, B);
    expect(r.kind).toBe('refusal');
    if (r.kind === 'refusal') expect(r.reason).toMatch(/would invent the answer/);
  });

  it('never returns a bare scalar: the binding indicator is always named', () => {
    const r = headroom({ ...base, beds: 6, bedsYear: 2021, phys: 4, physYear: 2022 }, B);
    expect(r.kind).toBe('ok');
    if (r.kind !== 'ok') return;
    expect(r.bindingLabel).toBeTruthy();
    expect(r.caveat).toMatch(/not a forecast/i);
  });

  it('reports a deficit as negative rather than clamping to zero', () => {
    const r = headroom({ ...base, beds: 0.5, bedsYear: 2021, phys: 0.3, physYear: 2022 }, B);
    if (r.kind !== 'ok') throw new Error();
    expect(r.headroomPersonsPerYear).toBeLessThan(0);
  });

  it('takes the minimum, not the mean', () => {
    const r = headroom({ ...base, beds: 9, bedsYear: 2021, phys: 1.8, physYear: 2022 }, B);
    if (r.kind !== 'ok') throw new Error();
    expect(r.bindingIndicator).toBe('physicians');
    const all = r.perIndicator.filter((x) => x.headroomPersonsPerYear != null)
      .map((x) => x.headroomPersonsPerYear!);
    expect(r.headroomPersonsPerYear).toBe(Math.min(...all));
  });

  it('EXCLUDES ratio and rate axes from the minimum, and says why', () => {
    // A pupil-teacher ratio scaled by total population produced values larger than the
    // population itself. Those axes are context now, never terms.
    const r = headroom({ ...base, beds: 6, bedsYear: 2021, phys: 4, physYear: 2022,
      ptr: 9.16, ptrYear: 2018, emp: 40, empYear: 2023 }, B);
    if (r.kind !== 'ok') throw new Error();
    for (const id of ['schooling', 'employment'] as const) {
      const row = r.perIndicator.find((x) => x.id === id)!;
      expect(row.headroomPersonsPerYear).toBeNull();
      expect(row.excludedBecause).toBeTruthy();
    }
    // Sanity: no headroom term may exceed the population over the horizon.
    for (const row of r.perIndicator) {
      if (row.headroomPersonsPerYear != null) {
        expect(Math.abs(row.headroomPersonsPerYear) * r.horizonYears).toBeLessThan(base.pop! * 5);
      }
    }
  });

  it('every target carries a stated basis, never a bare number', () => {
    const r = headroom({ ...base, beds: 6, bedsYear: 2021, phys: 4, physYear: 2022 }, B);
    if (r.kind !== 'ok') throw new Error();
    for (const row of r.perIndicator) expect(row.basis).toMatch(/median of the \d+ countries|no benchmark/);
  });

  it('marks the ILO-modelled series as modelled, not observed', () => {
    const r = headroom({ ...base, beds: 6, bedsYear: 2021, phys: 4, physYear: 2022, emp: 60, empYear: 2023 }, B);
    if (r.kind !== 'ok') throw new Error();
    expect(r.perIndicator.find((x) => x.id === 'employment')!.estimateKind).toBe('modelled');
  });
});
