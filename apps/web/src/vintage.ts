// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Exodus used to have one integer year axis running to 2023. That worked while every layer
// was annual and came from the same place. It stops working the moment the app carries a
// monthly Dutch register at 2026-07 beside a quinquennial stock table and a modelled flow
// spine that terminates, by construction, at 2023.
//
// So time stops being a number and becomes a property of each layer.

export type Cadence = 'monthly' | 'quarterly' | 'annual' | 'quinquennial' | 'point';

/** How a number came to exist. A gap between two `reported` series means something quite
 *  different from a gap between a `reported` one and a `modelled` one. */
export type EstimateKind = 'observed' | 'reported' | 'modelled';

export interface Vintage {
  /** ISO date of the LAST DAY the period covers. Everything else is derived from this. */
  periodEnd: string;
  /** How the producer names the period: '2026-Q2', '2026-07', '2025'. Never reformatted. */
  periodLabel: string;
  cadence: Cadence;
  /** First and last period the layer covers, as the producer labels them. */
  coverage: [string, string];
  estimateKind: EstimateKind;
  /** Eurostat status 'p', ISTAT OBS_STATUS 'p', CBS voorlopig. A provisional headline that
   *  reads as a collapse is the commonest way this data lies. */
  provisional: boolean;
  /** Eurostat status 'b'. Render as a discontinuity, never as part of a trend. */
  breaks?: string[];
  /** How many reporters are in the newest period against how many are expected. The tail of
   *  a monthly Eurostat table is a self-selected handful of fast reporters, and charting it
   *  shows applications collapsing 90% in two months. */
  reporters?: { n: number; expected: number };
  producer: string;
  licenceId: string;
  doi?: string;
  /** True when the licence permits commercial downstream use. IMF Data does not, cleanly,
   *  so it cannot be badged as though it were CC BY. */
  commercialUseClear: boolean;
}

/**
 * Age in days, computed at render and never stored.
 *
 * Every latency figure in the research that produced this file was measured to the
 * publisher's `updated` stamp and was wrong the day after it was written. Age is a function
 * of now, so it is computed from now.
 */
export function ageDays(v: Pick<Vintage, 'periodEnd'>, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - Date.parse(v.periodEnd)) / 86_400_000));
}

/** '2026-Q2 · 81 d · reported' — what goes on a layer chip. */
export function vintageLabel(v: Vintage, now?: Date): string {
  const bits = [v.periodLabel, `${ageDays(v, now)} d`, v.estimateKind];
  if (v.provisional) bits.push('provisional');
  return bits.join(' · ');
}

/** Sort key so the UI can lead with the freshest layer without re-deriving age everywhere. */
export const byFreshness = (a: Vintage, b: Vintage) => Date.parse(b.periodEnd) - Date.parse(a.periodEnd);

/**
 * Can this layer answer for the instant the cursor is on?
 *
 * The rule is the same one NO_DATA_FILL encodes in space, moved into time: a layer with no
 * value at this instant must not be resampled, interpolated or carried forward to produce
 * one. It says what its nearest period is and greys out. Absent at this instant is not zero
 * at this instant.
 */
export function resolvesAt(periods: string[], cursor: string): { hit: boolean; nearest: string | null } {
  if (periods.length === 0) return { hit: false, nearest: null };
  if (periods.includes(cursor)) return { hit: true, nearest: cursor };
  const t = Date.parse(periodEndOf(cursor));
  let nearest = periods[0]!;
  let best = Infinity;
  for (const p of periods) {
    const d = Math.abs(Date.parse(periodEndOf(p)) - t);
    if (d < best) { best = d; nearest = p; }
  }
  return { hit: false, nearest };
}

/** Last day of a period label, for labels of the form 2025, 2026-Q2, 2026-07 or 2026-07-31. */
export function periodEndOf(label: string): string {
  const q = /^(\d{4})-Q([1-4])$/.exec(label);
  if (q) return `${q[1]}-${['03-31', '06-30', '09-30', '12-31'][+q[2]! - 1]}`;
  const m = /^(\d{4})-(\d{2})$/.exec(label);
  if (m) return `${m[1]}-${m[2]}-${new Date(Date.UTC(+m[1]!, +m[2]!, 0)).getUTCDate()}`;
  if (/^\d{4}$/.test(label)) return `${label}-12-31`;
  return label;
}
