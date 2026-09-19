// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The Methods page quotes figures computed from the snapshot. Three of them had gone
// stale — a corridor count, a corroborated-period count and a median — because the
// pipeline changed underneath prose that nobody recomputed. Numbers written into prose
// need a test or they drift, so these are read back out of the page and checked against
// the data they claim to describe.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('./Methods.tsx', import.meta.url), 'utf8');
const snap = JSON.parse(readFileSync(new URL('../../public/snapshot/corridors.json', import.meta.url), 'utf8'));

describe('the figures the Methods page states', () => {
  it('quotes the corridor count and the number with a second opinion', () => {
    const withSecond = snap.corridors.filter((c: { dpp?: (number | null)[] }) =>
      (c.dpp ?? []).some(x => x != null)).length;
    expect(page).toContain(`${withSecond.toLocaleString('en')} of ${snap.corridors.length.toLocaleString('en')} corridors`);
  });

  it('quotes the number of corroborated corridor-periods and their median disagreement', () => {
    const diffs: number[] = [];
    for (const c of snap.corridors as { a5?: (number | null)[]; b5?: (number | null)[] }[]) {
      for (let i = 0; i < snap.periodStarts.length; i++) {
        const a = c.a5?.[i];
        const b = c.b5?.[i];
        if (a != null && b != null && a > 0 && b > 0) diffs.push(Math.abs(a - b) / ((a + b) / 2));
      }
    }
    diffs.sort((x, y) => x - y);
    const median = Math.round((diffs[Math.floor(diffs.length / 2)] ?? 0) * 100);
    expect(page).toContain(`<b>${diffs.length.toLocaleString('en')}</b>`);
    expect(page).toContain(`<b>${median}%</b>`);
  });

  it('does not claim a normalisation the pipeline does not perform', () => {
    const build = readFileSync(new URL('../../scripts/build-snapshot-real.mjs', import.meta.url), 'utf8');
    // The second model ships unscaled. If that ever changes, the prose has to change too.
    expect(build).toContain('const scaleB = 1;');
    expect(page).toContain('Neither model is rescaled before the comparison');
  });
});
