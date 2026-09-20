// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// One catalogue of everything the globe can paint.
//
// The app grew two parallel systems: seven surfaces computed from the flow spine, and
// forty-three layers loaded from the snapshot. They sat in two lists, answered the time
// cursor by two different rules, and failed in two different ways — which is how the map came
// to behave one way before 2020 and another way after it:
//
//   arrivals / departures / net   1990-2023, then the globe empties
//   model disagreement            1990-2019, then the globe empties — the visible cliff
//   foreign-born share            ONE value, painted identically at 1990 and at 2023
//   reporting completeness        one value, no time dimension at all
//   the 43 data layers            each its own span, from 1990 to 2026-07
//
// So there is one type now, one resolution rule, and one failure mode. A layer declares the
// periods it can answer for; the cursor picks the newest one at or before itself; the panel
// names that period whenever it is not the cursor's own. Nothing is interpolated and nothing
// is silently carried forward — carrying forward is only a lie when the label hides it.
import { useMemo } from 'react';
import { useStore, type LayerMeta } from './state';
import { SURFACES, type SurfaceId } from './layers';
import { periodEndOf } from './vintage';
import type { Cadence, EstimateKind } from './vintage';

/** Three groups, because a reader looking for a number knows which of these they want. */
export type Group = 'movement' | 'population' | 'context';

export const GROUP_LABEL: Record<Group, string> = {
  movement: 'Movement',
  population: 'Population',
  context: 'Context',
};

export interface Entry {
  id: SurfaceId;
  name: string;
  /** One line. Not a paragraph — the panel shows this only for the active layer. */
  what: string;
  group: Group;
  unit: string;
  /** The periods this layer can answer for, ascending. EMPTY means it has no time dimension
   *  and answers everywhere, which is itself a fact the panel states. */
  periods: string[];
  cadence: Cadence | 'none';
  estimate: EstimateKind | 'derived';
  producer: string;
  provisional: boolean;
  commercialUseClear: boolean;
  /** Set only when another entry shares this name, and only then. */
  qualifier?: string;
  /** Present for snapshot layers; absent for the spine-derived surfaces. */
  layer?: LayerMeta;
}

/** Which group a layer belongs in, by what it measures rather than by who published it. */
function groupOf(id: string, unit: string): Group {
  // A standing population is a population even when it is expressed as a share, so the
  // id test runs before the unit test — otherwise "foreign-born share" lands in Context
  // alongside GDP, which is not where anyone would look for it.
  if (/stockshare|stock|population|foreign-born|diaspora|foreign-citizens|valid-permits|refugees|asylum-seekers|forcibly-displaced|pending|protection-stock/.test(id)) return 'population';
  if (/gdp|unemployment|transfers|disagreement|coverage/.test(id)) return 'context';
  if (/%|\$/.test(unit)) return 'context';
  return 'movement';
}

/** Enough of a publisher's name to tell two rows apart, and no more. */
function shortProducer(p: string): string {
  const paren = /\(([^)]+)\)/.exec(p);
  if (paren) return paren[1]!;
  return p.replace(/^(The|Statistisches|Istituto nazionale di)\s+/, '').split(',')[0]!.trim();
}

/** Inclusive run of years as period labels. */
const years = (from: number, to: number) =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => String(from + i));

/**
 * The unified list. Built-ins first inside each group because they are the spine the rest is
 * measured against, then everything else freshest first.
 */
export function useCatalogue(): Entry[] {
  const { layerIndex, manifest, periodStarts, places } = useStore();

  return useMemo(() => {
    const spineMax = manifest?.yearRange?.[1] ?? 2023;
    const spineMin = manifest?.yearRange?.[0] ?? 1990;

    // The one value the foreign-born share actually has. It was painted identically at every
    // year on the axis, which made a 2024 measurement look like a 1990 one.
    const stockYears = [...new Set(places.map((p) => p.stockYear).filter((y): y is number => y != null))];
    const stockLatest = stockYears.length ? String(Math.max(...stockYears)) : null;

    const builtin: Entry[] = SURFACES.map((s): Entry => {
      const common = {
        id: s.id, name: s.name, what: s.what, unit: s.unit,
        estimate: (s.estimate === 'derived' ? 'derived' : s.estimate) as Entry['estimate'],
        producer: 'Exodus, from the spine',
        provisional: false, commercialUseClear: true,
        group: groupOf(String(s.id), s.unit),
      };
      switch (s.id) {
        case 'none':
          return { ...common, periods: [], cadence: 'none' };
        case 'disagreement':
          // Per five-year window, and the windows stop in 2015. This is the cliff: past 2019
          // the app used to paint nothing at all rather than the last window it has.
          return { ...common, periods: periodStarts.map(String), cadence: 'quinquennial' };
        case 'stockshare':
          return { ...common, periods: stockLatest ? [stockLatest] : [], cadence: 'point' };
        case 'coverage':
          return { ...common, periods: [], cadence: 'none' };
        default:
          return { ...common, periods: years(spineMin, spineMax), cadence: 'annual' };
      }
    });

    const fromLayers: Entry[] = layerIndex
      .filter((l) => l.entity === 'country')
      .map((l): Entry => ({
        id: `layer:${l.id}` as SurfaceId,
        name: l.title,
        what: l.question,
        group: groupOf(l.id, l.unit),
        unit: l.unit,
        periods: l.periods,
        cadence: l.vintage.cadence,
        estimate: l.vintage.estimateKind,
        producer: l.vintage.producer,
        provisional: l.vintage.provisional,
        commercialUseClear: l.vintage.commercialUseClear,
        layer: l,
      }));

    const all = [...builtin, ...fromLayers];

    // Two producers can publish the same quantity under the same name — the World Bank and
    // the flow model both call theirs "Foreign-born population" — and two identical rows in a
    // list is worse than a longer label. Disambiguate only where it is actually ambiguous, so
    // the other forty-eight rows stay short.
    const seen = new Map<string, number>();
    for (const e of all) seen.set(e.name, (seen.get(e.name) ?? 0) + 1);
    for (const e of all) if ((seen.get(e.name) ?? 0) > 1) e.qualifier = shortProducer(e.producer);

    // The built-ins keep the order they are declared in, so the digit shortcuts keep meaning
    // what they have always meant and the list does not reshuffle itself as data lands. The
    // snapshot layers follow, freshest first, which is the only order that is useful for
    // fifty of them.
    const order = new Map(SURFACES.map((s, i) => [String(s.id), i]));
    return all.sort((a, b) => {
      const ai = order.get(String(a.id)), bi = order.get(String(b.id));
      if (ai != null && bi != null) return ai - bi;
      if (ai != null) return -1;
      if (bi != null) return 1;
      return Date.parse(lastEnd(b)) - Date.parse(lastEnd(a)) || a.name.localeCompare(b.name);
    });
  }, [layerIndex, manifest, periodStarts, places]);
}

const lastEnd = (e: Entry) => (e.periods.length ? periodEndOf(e.periods[e.periods.length - 1]!) : '9999-12-31');

export interface Resolved {
  /** The period actually painted, or null when the layer has nothing at or before the cursor. */
  period: string | null;
  /** True when the painted period is the cursor's own — i.e. nothing older is standing in. */
  exact: boolean;
  /** True for a layer with no time dimension, which answers the same everywhere. */
  timeless: boolean;
}

/**
 * One rule for every layer: the newest period at or before the cursor.
 *
 * Reaching back is allowed and reaching forward is not, because a reader at 2026 asking a
 * series that ends in 2023 should see 2023 clearly labelled rather than an empty globe — and
 * should never see a 2026 number that does not exist. `exact` is what the panel uses to say
 * which of the two is happening.
 */
export function resolve(e: Entry, cursorYear: number): Resolved {
  if (e.periods.length === 0) return { period: null, exact: true, timeless: true };
  const limit = `${cursorYear}-12-31`;
  let best: string | null = null;
  for (const p of e.periods) if (periodEndOf(p) <= limit) best = p;
  if (best == null) return { period: null, exact: false, timeless: false };

  // "Exact" means the cursor falls INSIDE the period, which is not the same as the period
  // carrying the cursor's year in its label. A five-year window labelled 2015 covers 2019, and
  // telling a reader at 2019 that they are looking at something older would be wrong.
  const startYear = Number(best.slice(0, 4));
  const width = e.cadence === 'quinquennial' ? 5 : 1;
  return { period: best, exact: cursorYear < startYear + width, timeless: false };
}

/** Fraction of the axis a layer covers, as [start, end] in 0..1, for the coverage bar. */
export function span(e: Entry, axisMin: number, axisMax: number): [number, number] | null {
  if (e.periods.length === 0) return null;
  const at = (label: string) => {
    const y = Number(periodEndOf(label).slice(0, 4));
    return Math.max(0, Math.min(1, (y - axisMin) / Math.max(1, axisMax - axisMin)));
  };
  return [at(e.periods[0]!), at(e.periods[e.periods.length - 1]!)];
}
