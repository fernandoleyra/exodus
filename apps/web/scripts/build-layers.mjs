// SPDX-FileCopyrightText: 2026 Exodus contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Runs every adapter under scripts/adapters/ and writes public/snapshot/layers/.
//
// Each layer is its own file so the app can fetch only what a user actually selects, and an
// index carries the metadata the LayerPanel needs to draw a chip without downloading the
// layer behind it. That matters more here than it did with one annual snapshot: these layers
// have different cadences and different vintages, and the panel has to be able to say
// "EU asylum decisions · 2026-Q2 · 81 d · reported" before it has the data.
//
// An adapter that fails does not fail the build. It is recorded as unavailable with its
// error, and the index says so, because a build that dies when one external producer has a
// bad afternoon is a build nobody can run.
import { mkdir, readdir, writeFile, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const OUT = 'public/snapshot/layers';
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const files = (await readdir('scripts/adapters'))
  .filter((f) => f.endsWith('.mjs'))
  .sort();

const index = [];
const failures = [];

for (const file of files) {
  const url = pathToFileURL(`scripts/adapters/${file}`).href;
  let mod;
  try {
    mod = await import(url);
  } catch (e) {
    failures.push({ file, stage: 'import', error: String(e.message ?? e) });
    console.error(`FAIL  ${file.padEnd(28)} import: ${e.message ?? e}`);
    continue;
  }
  if (typeof mod.load !== 'function') {
    failures.push({ file, stage: 'contract', error: 'no exported load()' });
    console.error(`FAIL  ${file.padEnd(28)} does not export load()`);
    continue;
  }

  let result;
  try {
    result = await mod.load();
  } catch (e) {
    failures.push({ file, stage: 'load', error: String(e.message ?? e) });
    console.error(`FAIL  ${file.padEnd(28)} load: ${e.message ?? e}`);
    continue;
  }

  for (const layer of result.layers ?? []) {
    const problems = validate(layer);
    if (problems.length) {
      failures.push({ file, stage: 'validate', layer: layer.id, error: problems.join('; ') });
      console.error(`FAIL  ${(layer.id ?? file).padEnd(28)} ${problems.join('; ')}`);
      continue;
    }
    await writeFile(`${OUT}/${layer.id}.json`, JSON.stringify({ rows: layer.rows }));
    const entities = Object.keys(layer.rows).length;
    index.push({
      id: layer.id, title: layer.title, question: layer.question, unit: layer.unit,
      entity: layer.entity, periods: layer.periods, vintage: layer.vintage,
      note: layer.note, entities, adapter: mod.meta?.id ?? file.replace(/\.mjs$/, ''),
    });
    const v = layer.vintage;
    console.log(
      `ok    ${layer.id.padEnd(28)} ${layer.entity.padEnd(8)} ${String(entities).padStart(6)} entities  ` +
      `${v.periodLabel.padEnd(8)} ${v.cadence.padEnd(12)} ${v.estimateKind}${v.provisional ? ' (provisional)' : ''}`);
  }
}

/** The contract, enforced. An adapter that half-conforms is worse than one that fails. */
function validate(l) {
  const bad = [];
  const need = ['id', 'title', 'question', 'unit', 'entity', 'rows', 'periods', 'vintage', 'note'];
  for (const k of need) if (l?.[k] == null) bad.push(`missing ${k}`);
  if (bad.length) return bad;
  if (!['country', 'corridor'].includes(l.entity)) bad.push(`entity ${l.entity}`);
  if (!Array.isArray(l.periods) || l.periods.length === 0) bad.push('no periods');
  if (Object.keys(l.rows).length === 0) bad.push('no rows');

  const v = l.vintage;
  for (const k of ['periodEnd', 'periodLabel', 'cadence', 'estimateKind', 'producer', 'licenceId']) {
    if (v?.[k] == null) bad.push(`vintage.${k} missing`);
  }
  if (typeof v?.commercialUseClear !== 'boolean') bad.push('vintage.commercialUseClear must be explicit');
  if (typeof v?.provisional !== 'boolean') bad.push('vintage.provisional must be explicit');
  // latencyDays is derived from now and is wrong the day after it is written.
  if (v && 'latencyDays' in v) bad.push('vintage.latencyDays must not be stored');
  if (v?.periodEnd && Number.isNaN(Date.parse(v.periodEnd))) bad.push(`vintage.periodEnd ${v.periodEnd} unparseable`);
  if (v?.periodLabel && !l.periods.includes(v.periodLabel)) bad.push(`vintage.periodLabel ${v.periodLabel} is not in periods`);

  // Every value the app will divide, colour or sum must be a finite number. A null that
  // reaches a choropleth is painted as a low value, which is the commonest lie in the genre.
  let nonFinite = 0;
  for (const row of Object.values(l.rows)) {
    for (const val of Object.values(row)) if (typeof val !== 'number' || !Number.isFinite(val)) nonFinite++;
  }
  if (nonFinite) bad.push(`${nonFinite} non-finite values`);
  return bad;
}

index.sort((a, b) => Date.parse(b.vintage.periodEnd) - Date.parse(a.vintage.periodEnd));
await writeFile(`${OUT}/index.json`, JSON.stringify({ layers: index, failures }));

console.log(`\n${index.length} layers written to ${OUT}, ${failures.length} failures`);
if (index.length) {
  const freshest = index[0].vintage;
  console.log(`freshest layer: ${index[0].id} at ${freshest.periodLabel} (${freshest.cadence})`);
}
if (failures.length) {
  console.log('\nunavailable:');
  for (const f of failures) console.log(`  ${f.file}${f.layer ? `/${f.layer}` : ''} — ${f.stage}: ${f.error}`);
}
