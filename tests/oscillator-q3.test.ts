import test from 'node:test';
import assert from 'node:assert/strict';
import { coherentCoefficients, ladderMatrices, oscillatorMoments, oscillatorTimeRun, rayleighRitzGround, gaussianEnergy, gaussianGradient, optimizeGaussian } from '../src/oscillator.ts';

const close=(a:number,b:number,t=1e-9)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)), `${a} != ${b}`);

test('coherent cutoff and harmonic moments',()=>{
  const alpha={re:1.2,im:-0.4};
  const c=coherentCoefficients(alpha,24);
  assert.ok(c.retainedWeight>1-1e-12);
  const m=oscillatorMoments(c.coeffs,{mass:1,omega:1});
  close(m.meanX,Math.SQRT2*alpha.re,1e-8);
  close(m.meanP,Math.SQRT2*alpha.im,1e-8);
  close(m.varianceX,0.5,1e-8);
  close(m.varianceP,0.5,1e-8);
});

test('coherent time history follows the classical reference',()=>{
  const run=oscillatorTimeRun({re:0.8,im:0.3},24,2*Math.PI,{mass:1,omega:1});
  for(const i of [0,50,100,200]){
    const p=run.points[Math.min(i,run.points.length-1)];
    close(p.meanX,p.classicalX,1e-8);
    close(p.meanP,p.classicalP,1e-8);
  }
});

test('finite ladder commutator records its cutoff defect',()=>{
  const n=8,d=ladderMatrices(n).commutator.map((row,i)=>row[i]);
  for(let i=0;i<n-1;i++) close(d[i],1,1e-12);
  close(d[n-1],1-n,1e-12);
});

test('Rayleigh-Ritz and Gaussian variational calculations have independent diagnostics',()=>{
  close(rayleighRitzGround(8,0).energy,0.5,1e-11);
  const rr=rayleighRitzGround(28,0.2);
  assert.ok(rr.residual<1e-8);
  close(gaussianEnergy(1,0),0.5,1e-12);
  close(gaussianGradient(1,0),0,1e-12);
  const run=optimizeGaussian(0.2,1,0.8,80);
  assert.ok(run.points.at(-1)!.energy<=run.points[0].energy);
  assert.ok(run.points.at(-1)!.energy>=rr.energy-1e-10);
});

// Full observables must not be replaced by the square of a projected operator.
test('cutoff eigenstates retain the correct x and p uncertainties', () => {
  for (const count of [1, 2, 3, 8]) {
    const coeffs = Array.from({ length: count }, (_, i) => ({ re: Number(i === count - 1), im: 0 }));
    const params = { mass: 0.7, omega: 2.2 };
    const got = oscillatorMoments(coeffs, params);
    close(got.varianceX, (count - 0.5) / (params.mass * params.omega), 1e-12);
    close(got.varianceP, (count - 0.5) * params.mass * params.omega, 1e-12);
    assert.ok(got.varianceX * got.varianceP >= 0.25 - 1e-12);
  }
});

test('nonadjacent superpositions contribute to full x² and p² with opposite signs', () => {
  const c = [{ re: 1 / Math.SQRT2, im: 0 }, { re: 0, im: 0 }, { re: 1 / Math.SQRT2, im: 0 }];
  const m = oscillatorMoments(c, { mass: 1, omega: 1 });
  close(m.meanX, 0); close(m.meanP, 0);
  close(m.varianceX, 1.5 + Math.SQRT2 / 2);
  close(m.varianceP, 1.5 - Math.SQRT2 / 2);
});
