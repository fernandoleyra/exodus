/** Deterministic synthetic cohort. Seeded PRNG: no Math.random anywhere at runtime.
 *  These are invented people for testing a mechanism. They are not data about anyone. */
import { CAPACITY_DIMS } from './schema';
import type { Case, Locality, CapacityDim, ServiceReq } from './schema';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

const LANGS = ['ara', 'fra', 'eng', 'fas', 'ukr', 'som', 'pus'];
const GROUPS = ['g1', 'g2', 'g3', 'g4'];
const SERVICES: ServiceReq[] = ['trauma_care', 'disability_access', 'paediatric_care', 'maternity_care', 'literacy_support'];

export function makeLocalities(n: number, seed = 7): Locality[] {
  const r = rng(seed);
  const states = ['ST-A', 'ST-B', 'ST-C', 'ST-D'];
  return Array.from({ length: n }, (_, i) => {
    const cap = {} as Record<CapacityDim, number>;
    for (const d of CAPACITY_DIMS) cap[d] = Math.floor(14 + r() * 40);
    return {
      id: `loc-${i}`,
      name: `Locality ${i}`,
      state: states[i % states.length]!,
      capacity: cap,
      servicesOffered: SERVICES.filter(() => r() > 0.28),
      languagesServed: LANGS.filter(() => r() > 0.55),
      population: Math.floor(40_000 + r() * 700_000),
      pledge: r() > 0.7 ? Math.floor(1 + r() * 3) : null,
      diaspora: Object.fromEntries(GROUPS.map((g) => [g, Math.floor(r() * 9000)])),
      costPerPerson: Math.floor(3200 + r() * 5200),
    } satisfies Locality;
  });
}

export function makeCases(n: number, localities: Locality[], seed = 11, opts: { noPrefs?: boolean } = {}): Case[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const persons = 1 + Math.floor(r() * 4);
    const demand = {} as Record<CapacityDim, number>;
    for (const d of CAPACITY_DIMS) demand[d] = d === 'beds' ? persons : Math.floor(r() * persons);
    const ranked = opts.noPrefs ? [] :
      [...localities].sort(() => r() - 0.5).slice(0, 3 + Math.floor(r() * 3)).map((l) => l.id);
    return {
      id: `case-${i}`,
      persons,
      demand,
      required: SERVICES.filter(() => r() > 0.85),
      languages: LANGS.filter(() => r() > 0.72).slice(0, 2),
      legalBasis: (['resettlement', 'relocation_inter_state', 'family_reunification', 'community_sponsorship'] as const)[Math.floor(r() * 4)]!,
      consent: { id: `consent-${i}`, recordedAt: '2026-01-01', withdrawable: true as const },
      preference: { veto: r() > 0.9 ? [localities[Math.floor(r() * localities.length)]!.id] : [], ranked },
      linkedTo: [],
      auditGroup: GROUPS[Math.floor(r() * GROUPS.length)]!,
    } satisfies Case;
  });
}
