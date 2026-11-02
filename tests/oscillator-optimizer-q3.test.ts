import test from 'node:test';
import assert from 'node:assert/strict';
import { optimizeGaussian } from '../src/oscillator.ts';

test('bounded backtracking keeps Gaussian variational energy nonincreasing',()=>{
  for(const coupling of [0,0.2,1,2]) for(const beta0 of [0.1,0.5,1,5,15]) {
    const run=optimizeGaussian(coupling,beta0,2,60);
    for(let i=1;i<run.points.length;i++) assert.ok(run.points[i].energy<=run.points[i-1].energy+1e-13);
  }
});
