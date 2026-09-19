/** The separation between the public globe and the person-shaped placement module is a
 *  product requirement, not a convention. These tests fail the build if it erodes. */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
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
      if (/from\s+['"][^'"]*placement/.test(src) || /import\s*\(\s*['"][^'"]*placement/.test(src)) {
        offenders.push(f.replace(SRC, ''));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the production bundle contains no solver or person-shaped symbols', () => {
    // Never trust a pre-existing dist/. Scanning a stale build green-lights a real leak:
    // with a dynamic import of the solver injected into App.tsx, this test passed against an
    // old dist/ and failed the moment the directory was removed. Build fresh, every time,
    // into a directory this test owns.
    const root = join(SRC, '..');
    const dist = join(root, '.quarantine-dist');
    execSync('npx vite build --outDir .quarantine-dist --emptyOutDir', { cwd: root, stdio: 'pipe' });
    const leaked: string[] = [];
    for (const f of walk(dist)) {
      if (!/\.(js|css|html)$/.test(f)) continue;
      const src = readFileSync(f, 'utf8');
      for (const sym of ['commitPlacement', 'NoConsentRecord', 'DESTINATION_LEGAL_BASIS', 'non-refoulement']) {
        if (src.includes(sym)) leaked.push(`${f.replace(dist, 'dist')} contains ${sym}`);
      }
    }
    rmSync(dist, { recursive: true, force: true });
    expect(leaked).toEqual([]);
  }, 180_000);
});
