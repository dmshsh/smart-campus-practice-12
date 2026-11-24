// Prints sha256 of feature files and a one-line summary of evidence files (helper for the Bolt terminal).
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const files = ['src/App.tsx', 'src/index.css', 'src/explain.js', 'src/explain.d.ts', 'src/mockAdapter.js',
  'src/mockAdapter.d.ts', 'src/explain.test.js', 'package.json', 'AGENTS.md'];
for (const f of files) {
  if (existsSync(f)) console.log(f, createHash('sha256').update(readFileSync(f)).digest('hex').slice(0, 12));
}
const dir = process.argv[2];
if (dir && existsSync(dir)) {
  for (const f of readdirSync(dir).sort()) {
    const lines = readFileSync(`${dir}/${f}`, 'utf8').trim().split('\n');
    const keep = lines.filter((l) => /^# (tests|pass|fail)|error|built in|problem|warning|✖|✓/i.test(l));
    console.log(`[${f}] ${(keep.length ? keep : lines.slice(-2)).slice(-6).join(' | ')}`);
  }
}
