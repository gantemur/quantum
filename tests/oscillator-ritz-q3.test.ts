import test from 'node:test';
import assert from 'node:assert/strict';
import { rayleighRitzGround } from '../src/oscillator.ts';

test('quartic Rayleigh-Ritz bounds decrease under nested basis refinement',()=>{
  const e=[4,8,12,20,28,32].map(n=>rayleighRitzGround(n,0.2).energy);
  for(let i=1;i<e.length;i++) assert.ok(e[i] <= e[i-1] + 2e-12, `${e[i-1]} -> ${e[i]}`);
  assert.ok(e[1]-e.at(-1)! < 0.002);
});
