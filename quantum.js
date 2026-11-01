/** Small, exact qubit models. Dimensionless units: hbar = 1; H = h · sigma. */
                                                     
                                   
                             
                                                           
                                                 
                                                                                          
                                     
               
                               
                      
              
   
                                                                     
                                       
                 
                        
                                       
                      
               
                    
                     
   

export const ROUNDING_TOLERANCE = 1e-12;
export const MAX_PROTOCOL_LENGTH = 8;
export const MAX_TRIALS = 100_000;

function finite(value        , name        )         {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
  return value;
}

function vector(v      , name        )       {
  if (!Array.isArray(v) || v.length !== 3) throw new RangeError(`${name} needs three components`);
  v.forEach((x) => finite(x, name));
  return v;
}

export function norm(v      )         {
  vector(v, 'vector');
  return finite(Math.hypot(...v), 'vector norm');
}

export function dot(a      , b      )         {
  vector(a, 'first vector');
  vector(b, 'second vector');
  return finite(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], 'dot product');
}

function state(r      )       {
  if (norm(r) > 1 + ROUNDING_TOLERANCE) throw new RangeError('Bloch-vector length must not exceed one');
  return r;
}

function unit(n      )       {
  const length = norm(n);
  if (length === 0) throw new RangeError('An axis must have nonzero length');
  return [n[0] / length, n[1] / length, n[2] / length];
}

export function axisVector(axis      )       {
  if (axis === 'x') return [1, 0, 0];
  if (axis === 'y') return [0, 1, 0];
  if (axis === 'z') return [0, 0, 1];
  throw new RangeError('Unknown Pauli axis');
}

export function blochFromAngles(theta        , phi        , length = 1)       {
  finite(theta, 'polar angle');
  finite(phi, 'azimuthal angle');
  finite(length, 'Bloch-vector length');
  if (length < 0 || length > 1) throw new RangeError('Bloch-vector length must be between zero and one');
  return [length * Math.sin(theta) * Math.cos(phi), length * Math.sin(theta) * Math.sin(phi), length * Math.cos(theta)];
}

const complex = (re        , im = 0)          => ({ re, im });
const add = (a         , b         )          => complex(a.re + b.re, a.im + b.im);
const multiply = (a         , b         )          => complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const conjugate = (a         )          => complex(a.re, -a.im);

function multiplyMatrices(a         , b         )          {
  const entry = (i       , j       )          => add(multiply(a[i][0], b[0][j]), multiply(a[i][1], b[1][j]));
  return [[entry(0, 0), entry(0, 1)], [entry(1, 0), entry(1, 1)]];
}

function adjoint(a         )          {
  return [[conjugate(a[0][0]), conjugate(a[1][0])], [conjugate(a[0][1]), conjugate(a[1][1])]];
}

function coordinatesInBasis(r      , basis      )       {
  axisVector(basis);
  if (basis === 'x') return [r[2], -r[1], r[0]];
  if (basis === 'y') return [r[2], r[0], r[1]];
  return [r[0], r[1], r[2]];
}

/** Basis order is (+, -); |±x>=(1,±1)/sqrt(2), |±y>=(1,±i)/sqrt(2). */
export function densityMatrix(r      , basis       = 'z')          {
  const [x, y, z] = coordinatesInBasis(state(r), basis);
  return [[complex((1 + z) / 2), complex(x / 2, -y / 2)], [complex(x / 2, y / 2), complex((1 - z) / 2)]];
}

/** A representative ket, not a unique global phase and never a ket for a mixture. */
export function spinor(r      , basis       = 'z', globalPhase = 0)                {
  state(r);
  axisVector(basis);
  finite(globalPhase, 'global phase');
  if (Math.abs(norm(r) - 1) > ROUNDING_TOLERANCE) return null;
  // Use the larger population to avoid cancellation near either pole.
  let ket        ;
  if (r[2] >= 0) {
    const a = Math.sqrt((1 + r[2]) / 2);
    ket = [complex(a), complex(r[0] / (2 * a), r[1] / (2 * a))];
  } else {
    const b = Math.sqrt((1 - r[2]) / 2), transverse = Math.hypot(r[0], r[1]);
    ket = [complex(transverse / (2 * b)), transverse > 0
      ? complex(b * r[0] / transverse, b * r[1] / transverse) : complex(b)];
  }
  let components         = ket;
  const factor = Math.SQRT1_2;
  if (basis === 'x') {
    components = [complex((ket[0].re + ket[1].re) * factor, (ket[0].im + ket[1].im) * factor),
      complex((ket[0].re - ket[1].re) * factor, (ket[0].im - ket[1].im) * factor)];
  } else if (basis === 'y') {
    const minusIB = complex(ket[1].im, -ket[1].re);
    components = [complex((ket[0].re + minusIB.re) * factor, (ket[0].im + minusIB.im) * factor),
      complex((ket[0].re - minusIB.re) * factor, (ket[0].im - minusIB.im) * factor)];
  }
  const phase = complex(Math.cos(globalPhase), Math.sin(globalPhase));
  return [multiply(phase, components[0]), multiply(phase, components[1])];
}

export function purity(r      )         {
  state(r);
  return (1 + dot(r, r)) / 2;
}

// @snippet probabilities:start
export function probabilities(r      , n      )                                  {
  state(r);
  const direction = unit(n);
  // Tr(rho P+) = (1 + r · n)/2. Clamp only boundary roundoff.
  const plus = Math.max(0, Math.min(1, (1 + dot(r, direction)) / 2));
  return { plus, minus: 1 - plus };
}
// @snippet probabilities:end

// @snippet rotate:start
export function rotate(r      , n      , angle        )       {
  state(r);
  const a = unit(n);
  finite(angle, 'rotation angle');
  const c = Math.cos(angle), s = Math.sin(angle);
  const parallel = dot(a, r) * (1 - c);
  const cross       = [a[1] * r[2] - a[2] * r[1], a[2] * r[0] - a[0] * r[2], a[0] * r[1] - a[1] * r[0]];
  // U = exp(-i angle n · sigma / 2) acts as this spatial rotation.
  return [c * r[0] + s * cross[0] + parallel * a[0],
    c * r[1] + s * cross[1] + parallel * a[1],
    c * r[2] + s * cross[2] + parallel * a[2]];
}
// @snippet rotate:end

// @snippet spectral:start
export function evolveSpectral(r      , h      , time        )       {
  const rho = densityMatrix(r);
  const energy = norm(h);
  finite(time, 'physical time');
  if (energy === 0) return [r[0], r[1], r[2]];
  const phase = finite(energy * time, 'spectral phase');
  const [nx, ny, nz] = unit(h);
  const c = Math.cos(phase), s = Math.sin(phase);
  // Spectral sum U = exp(-iEt) P+ + exp(iEt) P-.
  const U          = [[complex(c, -s * nz), complex(-s * ny, -s * nx)],
    [complex(s * ny, -s * nx), complex(c, s * nz)]];
  const evolved = multiplyMatrices(multiplyMatrices(U, rho), adjoint(U));
  return [2 * evolved[0][1].re, -2 * evolved[0][1].im,
    evolved[0][0].re - evolved[1][1].re];
}
// @snippet spectral:end

export function evolveBloch(r      , h      , time        )       {
  state(r);
  const energy = norm(h);
  finite(time, 'physical time');
  if (energy === 0) return [r[0], r[1], r[2]];
  return rotate(r, h, finite(2 * energy * time, 'rotation angle'));
}

// @snippet spectrum:start
export function spectrum(h      )   
                                                                                           
  {
  const energy = norm(h);
  // At the degeneracy the eigenspace is the full space: no unique axis.
  if (energy === 0) return { energies: [0, 0], lower: null, upper: null, gap: 0 };
  const upper = unit(h);
  const lower       = [-upper[0], -upper[1], -upper[2]];
  return { energies: [-energy, energy], lower, upper, gap: finite(2 * energy, 'energy gap') };
}
// @snippet spectrum:end

// @snippet measure:start
export function measure(r      , n      , draw        )                                                         {
  if (!Number.isFinite(draw) || draw < 0 || draw >= 1) throw new RangeError('A draw must lie in [0, 1)');
  const direction = unit(n);
  const p = probabilities(r, direction);
  const outcome          = draw < p.plus ? 1 : -1;
  // Conditioning on a rank-one Pauli outcome prepares its eigenstate.
  return { outcome, probability: outcome === 1 ? p.plus : p.minus,
    state: [outcome * direction[0], outcome * direction[1], outcome * direction[2]] };
}
// @snippet measure:end

function seedValue(seed        )         {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffff_ffff) throw new RangeError('Seed must be an unsigned 32-bit integer');
  return seed;
}

/** Mulberry32: deterministic educational sampling, not a cryptographic source. */
export function nextRandom(seed        )                                  {
  const next = (seedValue(seed) + 0x6d2b79f5) >>> 0;
  let value = Math.imul(next ^ (next >>> 15), next | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return { value: ((value ^ (value >>> 14)) >>> 0) / 4294967296, seed: next };
}

function protocolAxes(axes                 )                  {
  if (!Array.isArray(axes) || axes.length < 1 || axes.length > MAX_PROTOCOL_LENGTH) {
    throw new RangeError(`A protocol needs 1–${MAX_PROTOCOL_LENGTH} measurement axes`);
  }
  axes.forEach(axisVector);
  return axes;
}

/** Complete joint law, including zero-probability paths. No random draw occurs. */
export function protocolDistribution(r      , axes                 )                 {
  state(r);
  protocolAxes(axes);
  let paths                 = [{ path: '', outcomes: [], probability: 1, state: [r[0], r[1], r[2]] }];
  for (const axis of axes) {
    const direction = axisVector(axis);
    paths = paths.flatMap((prefix) => {
      const p = probabilities(prefix.state, direction);
      return ([1, -1]         ).map((outcome) => ({
        path: prefix.path + (outcome === 1 ? '+' : '-'), outcomes: [...prefix.outcomes, outcome],
        probability: prefix.probability * (outcome === 1 ? p.plus : p.minus),
        state: [outcome * direction[0], outcome * direction[1], outcome * direction[2]]        ,
      }));
    });
  }
  return paths;
}

/** Reprepare r for each trial; measurements within a trial are successive. */
export function sampleProtocol(r      , axes                 , trials        , seed        )                 {
  const law = protocolDistribution(r, axes);
  if (!Number.isInteger(trials) || trials < 1 || trials > MAX_TRIALS) throw new RangeError(`Trials must be an integer from 1 to ${MAX_TRIALS}`);
  const initialSeed = seedValue(seed);
  const counts = new Map(law.map((entry) => [entry.path, 0]));
  let rng = initialSeed;
  for (let trial = 0; trial < trials; trial++) {
    let current       = [r[0], r[1], r[2]];
    let path = '';
    for (const axis of axes) {
      const draw = nextRandom(rng);
      rng = draw.seed; // One draw per event, including deterministic outcomes.
      const event = measure(current, axisVector(axis), draw.value);
      current = event.state;
      path += event.outcome === 1 ? '+' : '-';
    }
    counts.set(path, (counts.get(path) ?? 0) + 1);
  }
  const distribution = law.map((entry) => ({ ...entry, count: counts.get(entry.path) ?? 0 }));
  const finalPlus = distribution.reduce((sum, entry) => sum + (entry.path.endsWith('+') ? entry.count : 0), 0);
  return { trials, axes: [...axes], distribution, initialSeed, seed: rng, finalPlus, finalMinus: trials - finalPlus };
}
