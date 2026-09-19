/** @exodus/placement — schema.
 *  Person-shaped types live HERE and nowhere else. Nothing in src/ outside this folder
 *  may import from it, and the public web build excludes it entirely.
 */

/** Closed enum of ADMISSION types. There is deliberately no `return`, `readmission`,
 *  `transit` or `offshore_processing` value: a removal is not expressible in this system,
 *  and adding one is a breaking change that the policy check rejects. */
export const DESTINATION_LEGAL_BASIS = [
  'resettlement',
  'relocation_intra_state',
  'relocation_inter_state',
  'complementary_pathway',
  'labour_mobility',
  'family_reunification',
  'community_sponsorship',
] as const;
export type DestinationLegalBasis = (typeof DESTINATION_LEGAL_BASIS)[number];

export const CAPACITY_DIMS = [
  'beds', 'school_places', 'primary_care_slots',
  'language_course_seats', 'accessible_housing', 'protected_category_slots',
] as const;
export type CapacityDim = (typeof CAPACITY_DIMS)[number];

export const SERVICE_REQS = [
  'trauma_care', 'disability_access', 'paediatric_care', 'maternity_care', 'literacy_support',
] as const;
export type ServiceReq = (typeof SERVICE_REQS)[number];

/** Refusal codes added by this module. The core set has five; these are the three §12 adds.
 *  The union is closed at eight. Do not add a ninth. */
export const PLACEMENT_REFUSALS = ['NoConsentRecord', 'NoPreferenceCoverage', 'NoLegalBasis'] as const;
export type PlacementRefusalCode = (typeof PLACEMENT_REFUSALS)[number];

export class Refusal {
  readonly kind = 'refusal' as const;
  constructor(readonly code: PlacementRefusalCode, readonly reason: string) {}
}
export type Result<T> = { kind: 'ok'; value: T } | Refusal;
export const ok = <T>(value: T): Result<T> => ({ kind: 'ok', value });

export interface ConsentRecord {
  readonly id: string;
  readonly recordedAt: string;
  readonly withdrawable: true;
}

export interface PreferenceSet {
  /** Hard. Unlimited. No score overrides a veto. */
  readonly veto: readonly string[];
  /** Ranked menu of locality ids, best first. Empty means "no stated preference", which
   *  is displayed rather than hidden. */
  readonly ranked: readonly string[];
}

/** The atomic unit of assignment is the family that moves together, never an individual. */
export interface Case {
  readonly id: string;
  readonly persons: number;
  readonly demand: Readonly<Record<CapacityDim, number>>;
  readonly required: readonly ServiceReq[];
  readonly languages: readonly string[];
  readonly legalBasis: DestinationLegalBasis;
  readonly consent: ConsentRecord | null;
  readonly preference: PreferenceSet;
  readonly linkedTo: readonly string[];
  /** Fairness audit groups only. These are NEVER features of the outcome model. */
  readonly auditGroup: string;
}

export interface Locality {
  readonly id: string;
  readonly name: string;
  readonly state: string;
  readonly capacity: Readonly<Record<CapacityDim, number>>;
  readonly servicesOffered: readonly ServiceReq[];
  readonly languagesServed: readonly string[];
  readonly population: number;
  readonly pledge: number | null;
  readonly diaspora: Readonly<Record<string, number>>;
  readonly costPerPerson: number;
}

export class ImportError extends Error {
  constructor(message: string) { super(message); this.name = 'ImportError'; }
}

/** Import gate. A row whose legal basis is missing or outside the closed admission enum
 *  fails the whole import and writes ZERO rows — it is never coerced to a default. */
export function importCases(raw: readonly unknown[]): Case[] {
  const out: Case[] = [];
  for (let i = 0; i < raw.length; i++) {
    const r = raw[i] as Record<string, unknown>;
    const lb = r?.legalBasis;
    if (typeof lb !== 'string' || !(DESTINATION_LEGAL_BASIS as readonly string[]).includes(lb)) {
      throw new ImportError(
        `row ${i} (case ${String(r?.id)}): legalBasis ${JSON.stringify(lb)} is not an admission type. ` +
        `Permitted: ${DESTINATION_LEGAL_BASIS.join(', ')}. Zero rows written.`,
      );
    }
    out.push(r as unknown as Case);
  }
  return out;
}

/** Public aggregates suppress any cell below this count. */
export const K_ANON = 10;
export function suppress(n: number): number | 'SUPPRESSED' {
  return n < K_ANON ? 'SUPPRESSED' : n;
}
