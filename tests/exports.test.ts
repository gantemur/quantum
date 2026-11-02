import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dataCsv } from '../src/exports.ts';

test('CSV keeps provenance separate, quotes text, and preserves undefined degeneracy', () => {
  const csv = dataCsv({ metadata: { coordinate: 'lambda; not time', inputs: { delta: 0 } }, columns: ['lambda', 'state', 'note'], rows: [[0, null, 'degenerate, no eigenaxis'], [1, 'lower', 'quote " preserved']] });
  assert.match(csv, /^# coordinate: "lambda; not time"\n# inputs: {"delta":0}\n/);
  assert.ok(csv.includes('0,,"degenerate, no eigenaxis"'));
  assert.ok(csv.includes('1,lower,"quote "" preserved"'));
  assert.ok(csv.endsWith('\n'));
});
