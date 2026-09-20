// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The Methods page quotes figures computed from the snapshot. Three of them had gone
// stale — a corridor count, a corroborated-period count and a median — because the
// pipeline changed underneath prose that nobody recomputed. Numbers written into prose
// need a test or they drift, so these are read back out of the page and checked against
// the data they claim to describe.
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { SOURCES } from './Sources';

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

describe('the source ledger against what is actually shipping', () => {
  const idxPath = new URL('../../public/snapshot/layers/index.json', import.meta.url);
  const present = existsSync(idxPath);

  it.runIf(present)('has a ledger entry for every producer with layers in the snapshot', () => {
    // Six producers were shipping data with no row on /#/sources. Every one of their licences
    // requires attribution, and two of them are not Creative Commons, so an incomplete ledger
    // is a compliance failure rather than a documentation gap. Deriving the whole page from
    // the index would lose the curated prose; asserting the join keeps both.
    const { layers } = JSON.parse(readFileSync(idxPath, 'utf8'));
    const shipping = new Set<string>(layers.map((l: { vintage: { producer: string } }) => l.vintage.producer));
    const ledger = new Set(SOURCES.map((s) => s.producer).filter(Boolean));
    const missing = [...shipping].filter((p) => !ledger.has(p));
    expect(missing, `producers shipping layers with no entry on /#/sources: ${missing.join(', ')}`).toEqual([]);
  });

  it.runIf(present)('agrees with the adapters about who does not grant commercial reuse', () => {
    const { layers } = JSON.parse(readFileSync(idxPath, 'utf8'));
    for (const s of SOURCES) {
      if (!s.producer) continue;
      const mine = layers.filter((l: { vintage: { producer: string } }) => l.vintage.producer === s.producer);
      if (!mine.length) continue;
      const adaptersSay = mine.every((l: { vintage: { commercialUseClear: boolean } }) => l.vintage.commercialUseClear);
      const pageSays = s.commercialUseClear !== false;
      expect(pageSays, `${s.producer}: the page and the adapters disagree about commercial reuse`).toBe(adaptersSay);
    }
  });
});
