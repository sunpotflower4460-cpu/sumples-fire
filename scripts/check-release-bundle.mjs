#!/usr/bin/env node
/* global process, console */
/**
 * Release guard: the scripted purchase mock (E2E/dev only) must never ship.
 *
 * Run after a production build. Fails if any JavaScript in the output contains
 * the mock's markers, and also fails if the real StoreKit bridge is missing
 * (which would mean Plus can never be bought).
 *
 *   node scripts/check-release-bundle.mjs [distDir]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const distDir = resolve(process.argv[2] ?? 'dist');

const FORBIDDEN = [
  'FIRE_PLUS_MOCK_STORE_MARKER',
  '__FIRE_PLUS_MOCK__',
  '__FIRE_PLUS_MOCK_CONTROL__',
  'fire-plus-mock-owned',
];
const REQUIRED = ['com.sunpotflower.sumplesfire.plus', 'PlusStore'];

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});

let files;
try {
  files = walk(distDir).filter((file) => /\.(m?js|html)$/.test(file));
} catch {
  console.error(`check-release-bundle: cannot read ${distDir}. Build first.`);
  process.exit(2);
}

const contents = files.map((file) => ({ file, text: readFileSync(file, 'utf-8') }));
const problems = [];

for (const marker of FORBIDDEN) {
  for (const { file, text } of contents) {
    if (text.includes(marker)) problems.push(`mock marker "${marker}" found in ${file}`);
  }
}
for (const needle of REQUIRED) {
  if (!contents.some(({ text }) => text.includes(needle))) {
    problems.push(`expected "${needle}" in the bundle but it is missing`);
  }
}

if (problems.length > 0) {
  console.error('check-release-bundle: FAILED');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`check-release-bundle: ok (${files.length} files, no test-only purchase code, StoreKit bridge present)`);
