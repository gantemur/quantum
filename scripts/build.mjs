import { readFile, writeFile, mkdir, readdir, cp, rm } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const name of await readdir(path.join(root, 'src'))) {
  if (!name.endsWith('.ts')) continue;
  const source = await readFile(path.join(root, 'src', name), 'utf8');
  const js = stripTypeScriptTypes(source, { mode: 'strip' }).replace(/(from\s+['"][^'"]+)\.ts(['"])/g, '$1.js$2');
  await writeFile(path.join(out, name.replace(/\.ts$/, '.js')), js);
}
for (const name of ['index.html', 'icon.svg']) await cp(path.join(root, name), path.join(out, name));
await cp(path.join(root, 'src/style.css'), path.join(out, 'style.css'));

const snippets = {};
const sourceFiles = {};
for (const sourceFile of ['src/quantum.ts', 'src/box.ts', 'src/oscillator.ts']) {
  const source = await readFile(path.join(root, sourceFile), 'utf8');
  const sourceHash = createHash('sha256').update(source).digest('hex');
  sourceFiles[sourceFile] = sourceHash;
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const start = lines[i].match(/@snippet ([\w-]+):start/);
    if (!start) continue;
    const end = lines.findIndex((line, n) => n > i && line.includes(`@snippet ${start[1]}:end`));
    if (end < 0) throw new Error(`Missing end marker for ${start[1]}`);
    if (snippets[start[1]]) throw new Error(`Duplicate snippet: ${start[1]}`);
    snippets[start[1]] = { code: lines.slice(i + 1, end).join('\n'), startLine: i + 2, endLine: end, sourceFile, sourceHash };
  }
}
for (const name of ['probabilities', 'spectral', 'rotate', 'spectrum', 'measure', 'box-wavefunction', 'box-evolution', 'box-energy-measurement', 'oscillator-coherent', 'oscillator-ritz', 'oscillator-variational']) {
  if (!snippets[name]) throw new Error(`Required source excerpt missing: ${name}`);
}
let revision = process.env.SOURCE_REVISION || '';
if (!revision) {
  try {
    const clean = !execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (clean) revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { /* Source hash still identifies a local/uncommitted build precisely. */ }
}
if (revision && !/^[a-f0-9]{40}$/.test(revision)) throw new Error('SOURCE_REVISION must be a full commit SHA');
const metadata = { version: '0.2.0', revision: revision || null, sourceFile: 'src/quantum.ts', sourceHash: sourceFiles['src/quantum.ts'], sourceFiles, snippets };
await writeFile(path.join(out, 'source.json'), JSON.stringify(metadata, null, 2) + '\n');
console.log(`Built ${out}; ${Object.keys(snippets).length} exact numerical-source excerpts; SHA-256 ${metadata.sourceHash}`);
