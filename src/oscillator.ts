import type { Complex } from './quantum.ts';

export const MAX_OSC_MODES = 32;
export type OscillatorParams = { mass: number; omega: number };
export type OscillatorMoments = { norm: number; meanX: number; meanP: number; varianceX: number; varianceP: number; meanEnergy: number };
export type OscillatorTimePoint = OscillatorMoments & { t: number; classicalX: number; classicalP: number };
export type OscillatorTimeRun = { initial: Complex[]; params: OscillatorParams; end: number; points: OscillatorTimePoint[]; sampleCount: number; retainedWeight: number | null };
export type AnharmonicRun = { coupling: number; basisSize: number; energy: number; vector: number[]; residual: number; x2: number };
export type VariationalPoint = { iteration: number; beta: number; energy: number; gradient: number };
export type VariationalRun = { coupling: number; beta0: number; step: number; iterations: number; points: VariationalPoint[] };

const abs2 = (z: Complex): number => z.re * z.re + z.im * z.im;
const checkedParams = (p: OscillatorParams): OscillatorParams => {
  if (![p.mass, p.omega].every(Number.isFinite) || p.mass <= 0 || p.mass > 5 || p.omega <= 0 || p.omega > 5) throw new RangeError('mass and omega must be in (0,5]');
  return p;
};
const multiply = (a: readonly number[][], b: readonly number[][]): number[][] => {
  const n = a.length;
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => {
    let s = 0; for (let k = 0; k < n; k++) s += a[i][k] * b[k][j]; return s;
  }));
};

export function normalizeOscillator(coeffs: readonly Complex[]): Complex[] {
  if (coeffs.length < 1 || coeffs.length > MAX_OSC_MODES) throw new RangeError('basis size must be 1–32');
  const n2 = coeffs.reduce((s, z) => s + abs2(z), 0);
  if (!Number.isFinite(n2) || n2 <= 0) throw new RangeError('state must have nonzero finite norm');
  const scale = 1 / Math.sqrt(n2);
  return coeffs.map(z => ({ re: z.re * scale, im: z.im * scale }));
}

export function oscillatorEnergy(n: number, params: OscillatorParams): number {
  checkedParams(params);
  if (!Number.isInteger(n) || n < 0) throw new RangeError('n must be a nonnegative integer');
  return params.omega * (n + 0.5);
}

// @snippet oscillator-coherent:start
export function coherentCoefficients(alpha: Complex, count: number): { coeffs: Complex[]; retainedWeight: number } {
  if (!Number.isInteger(count) || count < 1 || count > MAX_OSC_MODES) throw new RangeError('basis size must be 1–32');
  if (![alpha.re, alpha.im].every(Number.isFinite) || abs2(alpha) > 25) throw new RangeError('invalid coherent amplitude');
  const prefactor = Math.exp(-abs2(alpha) / 2), coeffs: Complex[] = [];
  let power: Complex = { re: 1, im: 0 }, sqrtFact = 1;
  for (let n = 0; n < count; n++) {
    if (n > 0) {
      const old = power;
      power = { re: old.re * alpha.re - old.im * alpha.im, im: old.re * alpha.im + old.im * alpha.re };
      sqrtFact *= Math.sqrt(n);
    }
    coeffs.push({ re: prefactor * power.re / sqrtFact, im: prefactor * power.im / sqrtFact });
  }
  const retainedWeight = coeffs.reduce((s, z) => s + abs2(z), 0);
  return { coeffs: normalizeOscillator(coeffs), retainedWeight };
}
// @snippet oscillator-coherent:end

export function oscillatorEvolve(coeffs: readonly Complex[], t: number, params: OscillatorParams): Complex[] {
  checkedParams(params);
  if (!Number.isFinite(t)) throw new RangeError('time must be finite');
  return coeffs.map((z, n) => {
    const phase = -oscillatorEnergy(n, params) * t, c = Math.cos(phase), s = Math.sin(phase);
    return { re: z.re * c - z.im * s, im: z.re * s + z.im * c };
  });
}

export function ladderMatrices(count: number): { a: number[][]; adag: number[][]; commutator: number[][] } {
  if (!Number.isInteger(count) || count < 1 || count > MAX_OSC_MODES) throw new RangeError('basis size must be 1–32');
  const a = Array.from({ length: count }, () => Array(count).fill(0) as number[]);
  for (let n = 1; n < count; n++) a[n - 1][n] = Math.sqrt(n);
  const adag = a.map((_, i) => a.map(row => row[i]));
  const aa = multiply(a, adag), adaga = multiply(adag, a);
  return { a, adag, commutator: aa.map((row, i) => row.map((v, j) => v - adaga[i][j])) };
}

export function positionMatrix(count: number, params: OscillatorParams): number[][] {
  checkedParams(params);
  const { a, adag } = ladderMatrices(count), scale = 1 / Math.sqrt(2 * params.mass * params.omega);
  return a.map((row, i) => row.map((v, j) => scale * (v + adag[i][j])));
}

export function oscillatorMoments(coeffs0: readonly Complex[], params: OscillatorParams): OscillatorMoments {
  checkedParams(params);
  const coeffs = normalizeOscillator(coeffs0), n = coeffs.length, x = positionMatrix(n, params), x2 = multiply(x, x);
  const applyReal = (m: readonly number[][]) => m.map(row => row.reduce((z, a, j) => ({ re: z.re + a * coeffs[j].re, im: z.im + a * coeffs[j].im }), { re: 0, im: 0 }));
  const expReal = (m: readonly number[][]) => {
    const mv = applyReal(m);
    return coeffs.reduce((s, c, i) => s + c.re * mv[i].re + c.im * mv[i].im, 0);
  };
  const ex = expReal(x), ex2 = expReal(x2);
  const { a, adag } = ladderMatrices(n), pscale = Math.sqrt(params.mass * params.omega / 2);
  const pv = coeffs.map((_, i) => Array.from({ length: n }, (_, j) => ({ re: 0, im: pscale * (adag[i][j] - a[i][j]) })))
    .map(row => row.reduce((z, q, j) => ({ re: z.re + q.re * coeffs[j].re - q.im * coeffs[j].im, im: z.im + q.re * coeffs[j].im + q.im * coeffs[j].re }), { re: 0, im: 0 }));
  const ep = coeffs.reduce((s, c, i) => s + c.re * pv[i].re + c.im * pv[i].im, 0), ep2 = pv.reduce((s, z) => s + abs2(z), 0);
  return { norm: 1, meanX: ex, meanP: ep, varianceX: Math.max(0, ex2 - ex * ex), varianceP: Math.max(0, ep2 - ep * ep),
    meanEnergy: coeffs.reduce((s, c, i) => s + abs2(c) * oscillatorEnergy(i, params), 0) };
}

export function oscillatorWavefunction(coeffs0: readonly Complex[], x: number, params: OscillatorParams): Complex {
  checkedParams(params); if (!Number.isFinite(x)) throw new RangeError('x must be finite');
  const coeffs = normalizeOscillator(coeffs0), xi = Math.sqrt(params.mass * params.omega) * x, phi = Array(coeffs.length).fill(0) as number[];
  phi[0] = Math.pow(params.mass * params.omega / Math.PI, 0.25) * Math.exp(-xi * xi / 2);
  if (phi.length > 1) phi[1] = Math.sqrt(2) * xi * phi[0];
  for (let n = 1; n < phi.length - 1; n++) phi[n + 1] = Math.sqrt(2 / (n + 1)) * xi * phi[n] - Math.sqrt(n / (n + 1)) * phi[n - 1];
  return coeffs.reduce((z, c, i) => ({ re: z.re + c.re * phi[i], im: z.im + c.im * phi[i] }), { re: 0, im: 0 });
}

export function oscillatorTimeRun(alpha: Complex, count: number, end: number, params: OscillatorParams): OscillatorTimeRun {
  checkedParams(params);
  if (!Number.isFinite(end) || end <= 0 || end > 100) throw new RangeError('end time must be in (0,100]');
  const prepared = coherentCoefficients(alpha, count), samples = Math.max(201, Math.ceil(64 * params.omega * end / (2 * Math.PI)) + 1);
  if (samples > 16385) throw new RangeError('time sample maximum is 16385');
  const points = Array.from({ length: samples }, (_, i) => {
    const t = end * i / (samples - 1), c = oscillatorEvolve(prepared.coeffs, t, params), m = oscillatorMoments(c, params), phase = params.omega * t;
    const ar = alpha.re * Math.cos(phase) + alpha.im * Math.sin(phase), ai = alpha.im * Math.cos(phase) - alpha.re * Math.sin(phase);
    return { t, ...m, classicalX: Math.sqrt(2 / (params.mass * params.omega)) * ar, classicalP: Math.sqrt(2 * params.mass * params.omega) * ai };
  });
  return { initial: prepared.coeffs.map(z => ({ ...z })), params: { ...params }, end, points, sampleCount: samples, retainedWeight: prepared.retainedWeight };
}

export function anharmonicHamiltonian(count: number, coupling: number): number[][] {
  if (!Number.isInteger(count) || count < 2 || count > MAX_OSC_MODES || !Number.isFinite(coupling) || coupling < 0 || coupling > 2) throw new RangeError('invalid anharmonic basis or coupling');
  const x = positionMatrix(count, { mass: 1, omega: 1 }), x2 = multiply(x, x), x4 = multiply(x2, x2);
  return Array.from({ length: count }, (_, i) => Array.from({ length: count }, (_, j) => (i === j ? i + 0.5 : 0) + coupling * x4[i][j]));
}

function jacobiEigen(a0: readonly number[][]): { values: number[]; vectors: number[][] } {
  const n = a0.length, a = a0.map(row => [...row]);
  const v: number[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 1 : 0));
  for (let sweep = 0; sweep < 80 * n * n; sweep++) {
    let p = 0, q = 1, max = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.abs(a[i][j]) > max) { max = Math.abs(a[i][j]); p = i; q = j; }
    if (max < 1e-13) break;
    const tau = (a[q][q] - a[p][p]) / (2 * a[p][q]), t = (tau >= 0 ? 1 : -1) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
    const c = 1 / Math.sqrt(1 + t * t), s = t * c, app = a[p][p], aqq = a[q][q], apq = a[p][q];
    a[p][p] = app - t * apq; a[q][q] = aqq + t * apq; a[p][q] = a[q][p] = 0;
    for (let k = 0; k < n; k++) if (k !== p && k !== q) {
      const akp = a[k][p], akq = a[k][q]; a[k][p] = a[p][k] = c * akp - s * akq; a[k][q] = a[q][k] = s * akp + c * akq;
    }
    for (let k = 0; k < n; k++) { const vkp = v[k][p], vkq = v[k][q]; v[k][p] = c * vkp - s * vkq; v[k][q] = s * vkp + c * vkq; }
  }
  const order = Array.from({ length: n }, (_, i) => i).sort((i, j) => a[i][i] - a[j][j]);
  return { values: order.map(i => a[i][i]), vectors: order.map(i => v.map(row => row[i])) };
}

// @snippet oscillator-ritz:start
export function rayleighRitzGround(count: number, coupling: number): AnharmonicRun {
  const h = anharmonicHamiltonian(count, coupling), eig = jacobiEigen(h), vector = eig.vectors[0], energy = eig.values[0];
  const hv = h.map(row => row.reduce((s, value, j) => s + value * vector[j], 0));
  const residual = Math.sqrt(hv.reduce((s, value, i) => s + (value - energy * vector[i]) ** 2, 0));
  const x = positionMatrix(count, { mass: 1, omega: 1 }), x2 = multiply(x, x), x2v = x2.map(row => row.reduce((s, value, j) => s + value * vector[j], 0));
  return { coupling, basisSize: count, energy, vector: [...vector], residual, x2: vector.reduce((s, value, i) => s + value * x2v[i], 0) };
}
// @snippet oscillator-ritz:end

export function gaussianEnergy(beta: number, coupling: number): number {
  if (![beta, coupling].every(Number.isFinite) || beta <= 0 || beta > 20 || coupling < 0 || coupling > 2) throw new RangeError('invalid variational parameter');
  return 0.25 * (beta + 1 / beta) + 0.75 * coupling / (beta * beta);
}
export function gaussianGradient(beta: number, coupling: number): number {
  return 0.25 - 0.25 / (beta * beta) - 1.5 * coupling / (beta * beta * beta);
}

// @snippet oscillator-variational:start
export function optimizeGaussian(coupling: number, beta0: number, step: number, iterations: number): VariationalRun {
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > 500 || !Number.isFinite(step) || step <= 0 || step > 2 || !Number.isFinite(beta0) || beta0 <= 0 || beta0 > 20) throw new RangeError('invalid optimizer settings');
  let beta = beta0; const points: VariationalPoint[] = [];
  for (let k = 0; k <= iterations; k++) {
    const energy = gaussianEnergy(beta, coupling), gradient = gaussianGradient(beta, coupling);
    points.push({ iteration: k, beta, energy, gradient });
    if (k === iterations) break;
    const full = Math.max(0.05, Math.min(20, beta - step * gradient));
    beta = gaussianEnergy(full, coupling) <= energy ? full : Math.max(0.05, Math.min(20, beta - 0.25 * step * gradient));
  }
  return { coupling, beta0, step, iterations, points };
}
// @snippet oscillator-variational:end
