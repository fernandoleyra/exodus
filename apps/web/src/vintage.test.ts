// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { ageDays, periodEndOf, resolvesAt, vintageLabel, type Vintage } from './vintage';

describe('period arithmetic', () => {
  it('resolves every label shape the producers actually use', () => {
    expect(periodEndOf('2025')).toBe('2025-12-31');
    expect(periodEndOf('2026-Q2')).toBe('2026-06-30');
    expect(periodEndOf('2026-Q4')).toBe('2026-12-31');
    expect(periodEndOf('2026-07')).toBe('2026-07-31');
    expect(periodEndOf('2026-02')).toBe('2026-02-28');
    expect(periodEndOf('2024-02')).toBe('2024-02-29');   // leap year, not 28
  });

  it('measures age from the end of the period, against a fixed now', () => {
    const now = new Date('2026-09-20T00:00:00Z');
    expect(ageDays({ periodEnd: '2026-06-30' }, now)).toBe(82);
    expect(ageDays({ periodEnd: '2026-09-20' }, now)).toBe(0);
    // A period that has not closed yet is 0 days old, never negative.
    expect(ageDays({ periodEnd: '2027-12-31' }, now)).toBe(0);
  });
});

describe('resolving a layer against a cursor', () => {
  const quarters = ['2025-Q4', '2026-Q1', '2026-Q2'];

  it('answers when it has the exact period', () => {
    expect(resolvesAt(quarters, '2026-Q1')).toEqual({ hit: true, nearest: '2026-Q1' });
  });

  it('names its nearest period rather than inventing one', () => {
    const r = resolvesAt(quarters, '2026-Q3');
    expect(r.hit).toBe(false);
    expect(r.nearest).toBe('2026-Q2');
  });

  it('reaches backwards as readily as forwards, and never returns a value', () => {
    // The contract is that a miss returns a LABEL, not a number. Nothing downstream can
    // accidentally paint a nearest period as if it were the requested one.
    const r = resolvesAt(quarters, '2019');
    expect(r.hit).toBe(false);
    expect(r.nearest).toBe('2025-Q4');
    expect(Object.keys(r)).toEqual(['hit', 'nearest']);
  });

  it('has nothing to say about an empty layer', () => {
    expect(resolvesAt([], '2026-Q1')).toEqual({ hit: false, nearest: null });
  });
});

describe('the chip label', () => {
  const v: Vintage = {
    periodEnd: '2026-06-30', periodLabel: '2026-Q2', cadence: 'quarterly',
    coverage: ['2008-Q1', '2026-Q2'], estimateKind: 'reported', provisional: false,
    producer: 'Eurostat', licenceId: 'LicenseRef-Eurostat-Reuse', commercialUseClear: true,
  };

  it('prints period, age and kind', () => {
    expect(vintageLabel(v, new Date('2026-09-20T00:00:00Z'))).toBe('2026-Q2 · 82 d · reported');
  });

  it('says provisional when it is, because an unread provisional flag becomes a false headline', () => {
    expect(vintageLabel({ ...v, provisional: true }, new Date('2026-09-20T00:00:00Z')))
      .toBe('2026-Q2 · 82 d · reported · provisional');
  });
});

describe('the shipped layer index', () => {
  const path = new URL('../public/snapshot/layers/index.json', import.meta.url);
  const present = existsSync(path);

  it.runIf(present)('never stores a latency, because a stored latency is wrong the next day', () => {
    const { layers } = JSON.parse(readFileSync(path, 'utf8'));
    for (const l of layers) expect(l.vintage, l.id).not.toHaveProperty('latencyDays');
  });

  it.runIf(present)('states provisional and commercial-use status explicitly on every layer', () => {
    const { layers } = JSON.parse(readFileSync(path, 'utf8'));
    expect(layers.length).toBeGreaterThan(0);
    for (const l of layers) {
      expect(typeof l.vintage.provisional, l.id).toBe('boolean');
      expect(typeof l.vintage.commercialUseClear, l.id).toBe('boolean');
      expect(l.periods, l.id).toContain(l.vintage.periodLabel);
      // A flow over a period ends when the period does; a STOCK is measured at an instant.
      // Eurostat's population tables are "usual residents on 1 January", so 2025 legitimately
      // ends at 2025-01-01 there and at 2025-12-31 for a flow. Both conventions are right, so
      // the invariant is the weaker true one: periodEnd falls within the labelled period.
      // Monthly and quarterly labels leave no room for that ambiguity, so those are exact.
      const end = l.vintage.periodEnd;
      if (l.vintage.cadence === 'monthly' || l.vintage.cadence === 'quarterly') {
        expect(periodEndOf(l.vintage.periodLabel), l.id).toBe(end);
      } else {
        const year = l.vintage.periodLabel.slice(0, 4);
        expect(end >= `${year}-01-01` && end <= `${year}-12-31`, `${l.id}: periodEnd ${end} is outside ${year}`).toBe(true);
      }
    }
  });

  it.runIf(present)('records any adapter that failed rather than silently shipping fewer layers', () => {
    const doc = JSON.parse(readFileSync(path, 'utf8'));
    expect(Array.isArray(doc.failures)).toBe(true);
  });
});
