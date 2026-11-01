import { axisVector, blochFromAngles, evolveBloch, evolveSpectral, measure, nextRandom, norm, rotate, sampleProtocol, spectrum,                                           } from './quantum.js';

                                                   
                                                                                                                                                                                                                                          
                                                                                                                                                
                                                                                                                                  
                                                                               
                                                                                                                                                                                                          

const copy = (r      )       => [r[0], r[1], r[2]];

export function timeRun(initial      , h      , end        , method                 , id        )          {
  if (!Number.isFinite(end) || end <= 0 || end > 100) throw new RangeError('Time interval must be in (0, 100]');
  if (h.some(x => !Number.isFinite(x) || Math.abs(x) > 5)) throw new RangeError('Hamiltonian components must be in [-5, 5]');
  if (method !== 'spectral' && method !== 'bloch') throw new RangeError('Unknown evolution method');
  const evolve = method === 'spectral' ? evolveSpectral : evolveBloch;
  // Exact evolution still needs a resolved display grid: at least 32 samples per period.
  const intervals = Math.max(200, Math.ceil(32 * norm(h) * end / Math.PI));
  return { id, initial: copy(initial), h: copy(h), end, method, points: Array.from({ length: intervals + 1 }, (_, i) => {
    const t = end * i / intervals;
    return { t, r: evolve(initial, h, t) };
  }) };
}

export function familyRun(delta        , id        )            {
  if (!Number.isFinite(delta) || delta < 0 || delta > 3) throw new RangeError('Delta must be in [0, 3]');
  return { id, delta, points: Array.from({ length: 201 }, (_, i) => {
    const lambda = (i - 100) * 0.03;
    return { lambda, data: spectrum([delta, 0, lambda]) };
  }) };
}

export function createLab()      {
  const initial = blochFromAngles(Math.PI / 2, 0, 1);
  return { current: initial, prepared: copy(initial), seed: 123456789, operations: [], operationCount: 0,
    time: timeRun(initial, [0, 0, 0.5], 12, 'spectral', 1), family: familyRun(0.6, 2), batch: null, runCount: 2 };
}

function operation(lab     , event                                                                                           )      {
  const index = lab.operationCount + 1;
  return { ...lab, current: copy(event.state), operationCount: index, operations: [...lab.operations, { ...event, before: copy(lab.current), state: copy(event.state), seedBefore: lab.seed, seedAfter: event.seedAfter ?? lab.seed, index }].slice(-12) };
}

export function prepareState(lab     , theta        , phi        , length        )      {
  const r = blochFromAngles(theta * Math.PI / 180, phi * Math.PI / 180, length);
  return { ...operation(lab, { kind: 'prepare', state: r }), prepared: copy(r) };
}
export function reprepare(lab     )      { return operation(lab, { kind: 'prepare', state: lab.prepared }); }
export function rotateState(lab     , axis      , degrees        )      {
  if (!Number.isFinite(degrees) || Math.abs(degrees) > 360) throw new RangeError('Rotation must be in [-360, 360] degrees');
  return operation(lab, { kind: 'rotate', axis, angle: degrees, state: rotate(lab.current, axisVector(axis), degrees * Math.PI / 180) });
}
export function measureState(lab     , axis      )      {
  const draw = nextRandom(lab.seed);
  const event = measure(lab.current, axisVector(axis), draw.value);
  return { ...operation(lab, { kind: 'measure', axis, state: event.state, outcome: event.outcome, probability: event.probability, draw: draw.value, seedAfter: draw.seed }), seed: draw.seed };
}
export function runProtocol(lab     , axes        , trials        )      {
  if (!Number.isInteger(trials) || trials < 1 || trials > 2000) throw new RangeError('Choose 1–2000 trials');
  const sample = sampleProtocol(lab.current, axes, trials, lab.seed);
  const id = lab.runCount + 1;
  return { ...lab, seed: sample.seed, runCount: id, batch: { id, initial: copy(lab.current), sample } };
}
export function calculateTime(lab     , h      , end        , method                 )      {
  const id = lab.runCount + 1;
  return { ...lab, runCount: id, time: timeRun(lab.current, h, end, method, id) };
}
export function calculateFamily(lab     , delta        )      {
  const id = lab.runCount + 1;
  return { ...lab, runCount: id, family: familyRun(delta, id) };
}
