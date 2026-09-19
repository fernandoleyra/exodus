/** The separation between the public globe and the person-shaped placement module is a
 *  product requirement, not a convention. These tests fail the build if it erodes. */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = new URL('../', import.meta.url).pathname;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

describe('placement stays quarantined', () => {
  it('no file outside src/placement imports from it', () => {
    const offenders: string[] = [];
    for (const f of walk(SRC)) {
      if (!/\.tsx?$/.test(f) || f.includes('/placement/')) continue;
      const src = readFileSync(f, 'utf8');
      if (/from\s+['"].*placement/.test(src)) offenders.push(f.replace(SRC, ''));
    }
    expect(offenders).toEqual([]);
  });

  it('the production bundle contains no solver or person-shaped symbols', () => {
    const dist = join(SRC, '../dist');
    if (!existsSync(dist)) {
      execSync('npm run build', { cwd: join(SRC, '..'), stdio: 'pipe' });
    }
    const leaked: string[] = [];
    for (const f of walk(dist)) {
      if (!/\.(js|css|html)$/.test(f)) continue;
      const src = readFileSync(f, 'utf8');
      for (const sym of ['commitPlacement', 'NoConsentRecord', 'DESTINATION_LEGAL_BASIS', 'non-refoulement']) {
        if (src.includes(sym)) leaked.push(`${f.replace(dist, 'dist')} contains ${sym}`);
      }
    }
    expect(leaked).toEqual([]);
  }, 120_000);
});
