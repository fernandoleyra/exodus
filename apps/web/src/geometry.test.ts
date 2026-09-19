// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Invariants the shipped geometry has to hold. Each one corresponds to a defect that was
// visible on the globe and invisible in the file, which is the worst combination: the data
// looks perfectly reasonable right up until it is wrapped round a sphere.
//
// e2e/geometry.mjs checks the same three things in pixels. This checks them in the data, so
// a broken build fails in a second instead of after a browser run.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

type Ring = [number, number][];
const read = (f: string) => JSON.parse(readFileSync(new URL(`../public/snapshot/${f}`, import.meta.url), 'utf8'));
const fill = read('adm0.json');
const outline = read('adm0_outline.json');

const EARTH_KM = 6371;
const SPHERE_KM = 6335;          // Globe.tsx draws the ocean mesh at this radius
const CLEARANCE_KM = EARTH_KM - SPHERE_KM;

const rad = (d: number) => (d * Math.PI) / 180;
function arcBetween(a: [number, number], b: [number, number]): number {
  const [x1, y1] = [rad(a[0]), rad(a[1])];
  const [x2, y2] = [rad(b[0]), rad(b[1])];
  return Math.acos(Math.min(1, Math.sin(y1) * Math.sin(y2) + Math.cos(y1) * Math.cos(y2) * Math.cos(x2 - x1)));
}

const fillRings = (): { iso: string; ring: Ring }[] =>
  fill.features.flatMap((f: any) =>
    f.geometry.coordinates.flatMap((poly: Ring[]) => poly.map(ring => ({ iso: f.properties.iso3, ring }))));

describe('the shipped country geometry', () => {
  it('never jumps the antimeridian inside a ring', () => {
    // Fiji, Russia's main body and Antarctica are each stored by Natural Earth as one ring
    // that steps 360 degrees between consecutive vertices. Left alone, deck.gl interpolates
    // that step the long way round and paints the country as a band across the whole planet.
    const offenders: string[] = [];
    for (const { iso, ring } of fillRings()) {
      for (let i = 1; i < ring.length; i++) {
        if (Math.abs(ring[i]![0] - ring[i - 1]![0]) > 180) { offenders.push(iso); break; }
      }
    }
    expect([...new Set(offenders)]).toEqual([]);
  });

  it('keeps every vertex inside the coordinate range, in the outlines too', () => {
    const bad: string[] = [];
    for (const { iso, ring } of fillRings()) {
      for (const [x, y] of ring) if (x < -180.001 || x > 180.001 || y < -90.001 || y > 90.001) { bad.push(`fill/${iso}`); break; }
    }
    for (const f of outline.features) {
      for (const line of f.geometry.coordinates as Ring[]) {
        for (const [x, y] of line) if (x < -180.001 || x > 180.001 || y < -90.001 || y > 90.001) { bad.push(`outline/${f.properties.iso3}`); break; }
      }
    }
    expect([...new Set(bad)]).toEqual([]);
  });

  it('seals Antarctica over the south pole instead of leaving the cap as a hole', () => {
    // Natural Earth's Antarctic ring winds a full turn around the pole but its southernmost
    // vertex is at -85.6, so the pole is outside the polygon and the globe shows a circular
    // hole there.
    const ata = fill.features.find((f: any) => f.properties.iso3 === 'ATA');
    expect(ata, 'Antarctica is missing from the snapshot').toBeTruthy();
    const atPole = ata.geometry.coordinates
      .flat()
      .flatMap((r: Ring) => r)
      .filter(([, y]: [number, number]) => y <= -89.99).length;
    expect(atPole, 'no vertex reaches the south pole').toBeGreaterThan(0);
  });

  it('cuts every polygon small enough that its chord does not sink through the sphere', () => {
    // A flat triangle between two points 16 degrees apart on a sphere passes 65 km below the
    // surface. The ocean mesh sits 36 km down, so anything sagging further is drawn inside
    // the globe and disappears. This is why the grid cut exists, and South Africa — the one
    // polygon with an interior ring — used to be exempt from it.
    const over: string[] = [];
    for (const { iso, ring } of fillRings()) {
      let widest = 0;
      const step = Math.max(1, Math.floor(ring.length / 40));
      for (let i = 0; i < ring.length; i += step) {
        for (let j = i + step; j < ring.length; j += step) {
          const d = arcBetween(ring[i]!, ring[j]!);
          if (d > widest) widest = d;
        }
      }
      if (EARTH_KM * (1 - Math.cos(widest / 2)) > CLEARANCE_KM) over.push(iso);
    }
    expect([...new Set(over)]).toEqual([]);
  });

  it('keeps Lesotho as a hole in South Africa rather than painting over it', () => {
    const zaf = fill.features.find((f: any) => f.properties.iso3 === 'ZAF');
    const withHole = zaf.geometry.coordinates.filter((p: Ring[]) => p.length > 1).length;
    expect(withHole, 'the grid cut dropped the interior ring').toBeGreaterThan(0);
  });

  it('keeps the pieces of a country that straddles the antimeridian on both sides of it', () => {
    // Clamping longitudes instead of splitting would lose Chukotka and half of Fiji, and
    // every check above would still pass.
    for (const iso of ['RUS', 'FJI']) {
      const f = fill.features.find((g: any) => g.properties.iso3 === iso);
      const sides = new Set<string>();
      for (const poly of f.geometry.coordinates as Ring[][]) {
        const mean = poly[0]!.reduce((s, p) => s + p[0], 0) / poly[0]!.length;
        sides.add(Math.abs(mean) > 90 ? (mean > 0 ? 'far-east' : 'far-west') : 'near');
      }
      expect(sides.has('far-east') && sides.has('far-west'), `${iso} lost a side of the antimeridian`).toBe(true);
    }
  });
});
