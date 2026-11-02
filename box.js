                                            

/** Infinite well on [0,L], with hbar = 1 and an orthonormal sine basis. */
                                                               
                             
                                                                  
               
                
                 
                    
                     
                          
 
                             
             
                              
                        
              
                       
                                                                        
                   
                      
                                                        
 
                                                                      
                                                                               

export const MAX_BOX_MODES = 16;
export const MAX_BOX_TIME_SAMPLES = 16385;
export const BOX_NORMALIZATION_TOLERANCE = 2e-12;
const PHASE_SAMPLES_PER_PERIOD = 32;
const PI2 = Math.PI ** 2;

function finite(value        , name        )         {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
  return value;
}

function parameters(params               )                {
  if (!params || !Number.isFinite(params.length) || params.length <= 0 || !Number.isFinite(params.mass) || params.mass <= 0) {
    throw new RangeError('Box length and mass must be positive finite numbers');
  }
  return params;
}

function modes(count        )         {
  if (!Number.isInteger(count) || count < 1 || count > MAX_BOX_MODES) throw new RangeError(`Choose 1–${MAX_BOX_MODES} box modes`);
  return count;
}

function coefficients(coeffs                    )                     {
  if (!Array.isArray(coeffs)) throw new RangeError('Box coefficients must be an array');
  modes(coeffs.length);
  for (const c of coeffs) {
    if (!c || !Number.isFinite(c.re) || !Number.isFinite(c.im)) throw new RangeError('Box coefficients must be finite complex numbers');
  }
  return coeffs;
}

function state(coeffs                    )                     {
  coefficients(coeffs);
  const norm = coeffs.reduce((sum, c) => sum + c.re ** 2 + c.im ** 2, 0);
  if (Math.abs(norm - 1) > BOX_NORMALIZATION_TOLERANCE) throw new RangeError('Box state must be normalized explicitly');
  return coeffs;
}

const copy = (coeffs                    )            => coeffs.map((c) => ({ re: c.re, im: c.im }));

/** Explicit state construction, scaled to avoid overflow/underflow in raw inputs. */
export function normalizeBox(coeffs                    )            {
  coefficients(coeffs);
  const scale = Math.max(...coeffs.flatMap((c) => [Math.abs(c.re), Math.abs(c.im)]));
  if (scale === 0) throw new RangeError('A zero coefficient vector cannot be normalized');
  const scaledNorm = Math.hypot(...coeffs.flatMap((c) => [c.re / scale, c.im / scale]));
  return coeffs.map((c) => ({ re: (c.re / scale) / scaledNorm, im: (c.im / scale) / scaledNorm }));
}

export function boxEnergy(n        , params               )         {
  modes(n);
  parameters(params);
  const energy = (n * Math.PI / params.length) ** 2 / (2 * params.mass);
  if (!Number.isFinite(energy) || energy <= 0) throw new RangeError('Box energy is outside the finite numerical range');
  return energy;
}

export function boxEigenfunction(n        , x        , params               )         {
  modes(n);
  parameters(params);
  finite(x, 'Position');
  if (x <= 0 || x >= params.length) return 0;
  return finite(Math.sqrt(2 / params.length) * Math.sin(n * Math.PI * (x / params.length)), 'Eigenfunction');
}

// @snippet box-wavefunction:start
export function boxWavefunction(coeffs                    , x        , params               )          {
  state(coeffs);
  parameters(params);
  finite(x, 'Position');
  let re = 0, im = 0;
  for (let j = 0; j < coeffs.length; j++) {
    const basis = boxEigenfunction(j + 1, x, params);
    re += coeffs[j].re * basis;
    im += coeffs[j].im * basis;
  }
  return { re, im };
}
// @snippet box-wavefunction:end

// @snippet box-evolution:start
export function boxEvolve(coeffs                    , time        , params               )            {
  state(coeffs);
  parameters(params);
  finite(time, 'Physical time');
  return coeffs.map((c, j) => {
    const phase = finite(boxEnergy(j + 1, params) * time, 'Spectral phase');
    const cosine = Math.cos(phase), sine = Math.sin(phase);
    // c_n(t) = c_n(0) exp(-i E_n t), with hbar = 1.
    return { re: c.re * cosine + c.im * sine,
      im: c.im * cosine - c.re * sine };
  });
}
// @snippet box-evolution:end

                                                                                            
const quarterSine = (integer        )         => [0, 1, 0, -1][((integer % 4) + 4) % 4];

/** Analytic sine-basis matrix elements: no spatial quadrature in observables. */
function momentMatrices(count        , params               )                 {
  const L = parameters(params).length;
  const x             = [], x2             = [], left             = [];
  for (let j = 0; j < count; j++) {
    const n = j + 1;
    x[j] = []; x2[j] = []; left[j] = [];
    for (let k = 0; k < count; k++) {
      const m = k + 1;
      if (n === m) {
        x[j][k] = L / 2;
        x2[j][k] = L ** 2 * (1 / 3 - 1 / (2 * PI2 * n ** 2));
        left[j][k] = 0.5;
      } else {
        const denominator = PI2 * (n ** 2 - m ** 2) ** 2;
        const parity = (n + m) % 2 === 0 ? 1 : -1;
        x[j][k] = parity === 1 ? 0 : -8 * L * n * m / denominator;
        x2[j][k] = 8 * L ** 2 * parity * n * m / denominator;
        left[j][k] = quarterSine(n - m) / ((n - m) * Math.PI) - quarterSine(n + m) / ((n + m) * Math.PI);
      }
    }
  }
  return { x, x2, left, energy: Array.from({ length: count }, (_, j) => boxEnergy(j + 1, params)) };
}

function summarize(coeffs                    , matrix                )             {
  let norm = 0, meanX = 0, meanX2 = 0, meanEnergy = 0, leftProbability = 0;
  for (let j = 0; j < coeffs.length; j++) {
    const weight = coeffs[j].re ** 2 + coeffs[j].im ** 2;
    norm += weight;
    meanX += weight * matrix.x[j][j];
    meanX2 += weight * matrix.x2[j][j];
    meanEnergy += weight * matrix.energy[j];
    leftProbability += weight * matrix.left[j][j];
    for (let k = j + 1; k < coeffs.length; k++) {
      const interference = 2 * (coeffs[j].re * coeffs[k].re + coeffs[j].im * coeffs[k].im);
      meanX += interference * matrix.x[j][k];
      meanX2 += interference * matrix.x2[j][k];
      leftProbability += interference * matrix.left[j][k];
    }
  }
  const varianceX = Math.max(0, meanX2 - meanX ** 2);
  for (const value of [norm, meanX, meanX2, varianceX, meanEnergy, leftProbability]) finite(value, 'Box moment');
  // Finite-state arithmetic can place a probability a few ulps outside [0,1].
  if (leftProbability < -BOX_NORMALIZATION_TOLERANCE || leftProbability > 1 + BOX_NORMALIZATION_TOLERANCE) {
    throw new RangeError('Computed left-half probability is outside its physical range');
  }
  return { norm, meanX, meanX2, varianceX, meanEnergy, leftProbability: Math.max(0, Math.min(1, leftProbability)) };
}

export function boxMoments(coeffs                    , params               )             {
  state(coeffs);
  return summarize(coeffs, momentMatrices(coeffs.length, params));
}

let localizedProjection                                                ;

/** One fixed dimensionless target for every cutoff and physical box size.
 * g(y)=y(1-y) exp[-(y-1/4)^2/(2*0.1^2)], 0<=y<=1.
 * Composite Simpson quadrature (4096 intervals) is used only for projection.
 */
function localizedTarget()                                     {
  if (localizedProjection) return localizedProjection;
  const intervals = 4096;
  let norm = 0;
  const coeffs = Array        (MAX_BOX_MODES).fill(0);
  for (let i = 0; i <= intervals; i++) {
    const y = i / intervals;
    const g = y * (1 - y) * Math.exp(-0.5 * ((y - 0.25) / 0.1) ** 2);
    const weight = (i === 0 || i === intervals ? 1 : i % 2 === 0 ? 2 : 4) / (3 * intervals);
    norm += weight * g ** 2;
    for (let n = 1; n <= MAX_BOX_MODES; n++) coeffs[n - 1] += weight * Math.SQRT2 * g * Math.sin(n * Math.PI * y);
  }
  localizedProjection = { coeffs, norm };
  return localizedProjection;
}

export function boxPreset(kind               , count        , params               )            {
  modes(count);
  parameters(params);
  if (kind === 'localized') {
    const target = localizedTarget();
    const raw = target.coeffs.slice(0, count).map((re) => ({ re, im: 0 }));
    const retainedWeight = raw.reduce((sum, c) => sum + c.re ** 2, 0) / target.norm;
    return { coeffs: normalizeBox(raw), retainedWeight: Math.min(1, retainedWeight) };
  }
  if (kind !== 'ground' && kind !== 'pair' && kind !== 'phase') throw new RangeError('Unknown box preset');
  if (kind !== 'ground' && count < 2) throw new RangeError('A two-mode preset needs at least two modes');
  const coeffs            = Array.from({ length: count }, () => ({ re: 0, im: 0 }));
  coeffs[0] = { re: 1, im: 0 };
  if (kind !== 'ground') coeffs[1] = kind === 'pair' ? { re: 1, im: 0 } : { re: 0, im: 1 };
  return { coeffs: normalizeBox(coeffs), retainedWeight: null };
}

// @snippet box-energy-measurement:start
export function measureBoxEnergy(coeffs                    , params               , draw        )   
                                                                   
  {
  state(coeffs);
  parameters(params);
  if (!Number.isFinite(draw) || draw < 0 || draw >= 1) throw new RangeError('A draw must lie in [0,1)');
  const weights = coeffs.map((c) => c.re ** 2 + c.im ** 2);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cumulative = 0, selected = 0;
  for (let j = 0; j < weights.length; j++) {
    if (weights[j] > 0) selected = j; // Last positive weight is the roundoff fallback.
    cumulative += weights[j];
    if (draw * total < cumulative) { selected = j; break; }
  }
  const magnitude = Math.sqrt(weights[selected]);
  const collapsed = coeffs.map((c, j) => j === selected ? { re: c.re / magnitude, im: c.im / magnitude } : { re: 0, im: 0 });
  return { n: selected + 1, energy: boxEnergy(selected + 1, params),
    probability: weights[selected] / total, state: collapsed };
}
// @snippet box-energy-measurement:end

/** A stored observable history. This sampling budget does not limit exact point evaluation. */
export function boxTimeRun(initial                    , params               , end        , id        )             {
  state(initial);
  parameters(params);
  if (!Number.isFinite(end) || end <= 0 || end > 100) throw new RangeError('Time interval must be in (0,100]');
  const matrix = momentMatrices(initial.length, params);
  const occupied = initial.flatMap((c, j) => c.re !== 0 || c.im !== 0 ? [matrix.energy[j]] : []);
  const maxEnergyGap = Math.max(...occupied) - Math.min(...occupied);
  const intervals = Math.max(200, Math.ceil(PHASE_SAMPLES_PER_PERIOD * maxEnergyGap * end / (2 * Math.PI)));
  if (!Number.isFinite(intervals) || intervals + 1 > MAX_BOX_TIME_SAMPLES) {
    throw new RangeError(`Time history requires ${intervals + 1} samples; maximum is ${MAX_BOX_TIME_SAMPLES}. Reduce the interval or occupied modes.`);
  }
  const points = Array.from({ length: intervals + 1 }, (_, i) => {
    const t = end * i / intervals;
    return { t, moments: summarize(boxEvolve(initial, t, params), matrix) };
  });
  return { id, initial: copy(initial), params: { ...params }, end, maxEnergyGap,
    phaseGap: maxEnergyGap * end / intervals, sampleCount: points.length, points };
}
