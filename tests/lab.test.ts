import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createLab, prepareState, reprepare, rotateState, measureState, runProtocol,
  calculateTime, calculateFamily, timeRun, familyRun,
} from '../src/lab.ts';
import type { EvolutionMethod } from '../src/lab.ts';
import { axisVector, measure, nextRandom } from '../src/quantum.ts';
import type { Vec3, Axis } from '../src/quantum.ts';

const closeVector = (actual: Vec3, expected: Vec3): void => {
  actual.forEach((value, index) => assert.ok(Math.abs(value - expected[index]) < 1e-12,
    `component ${index}: ${value} differs from ${expected[index]}`));
};
const advanceSeed = (initial: number, draws: number): number => {
  let seed = initial;
  for (let i = 0; i < draws; i++) seed = nextRandom(seed).seed;
  return seed;
};
const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === 'object') {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
};

test('laboratory starts from an explicit +x preparation and separately identified stored results', () => {
  const lab = createLab();
  closeVector(lab.current, [1, 0, 0]);
  closeVector(lab.prepared, [1, 0, 0]);
  assert.notStrictEqual(lab.current, lab.prepared);
  assert.equal(lab.operations.length, 0);
  assert.equal(lab.operationCount, 0);
  assert.equal(lab.batch, null);
  assert.notEqual(lab.time.id, lab.family.id);
  assert.equal(lab.time.method, 'spectral');
  assert.equal(lab.time.points[0].t, 0);
  assert.equal(lab.time.points.at(-1)!.t, lab.time.end);
});

test('physical operations preserve old time, family, and batch snapshots', () => {
  let base = calculateTime(createLab(), [0.3, 0.4, 0.2], 5, 'bloch');
  base = calculateFamily(base, 0);
  base = runProtocol(base, ['z', 'x', 'z'], 32);
  const old = JSON.stringify(base);
  deepFreeze(base);
  let changed = prepareState(base, 0, 0, 1);
  changed = rotateState(changed, 'y', 90);
  changed = measureState(changed, 'z');
  assert.equal(JSON.stringify(base), old);
  assert.strictEqual(changed.time, base.time);
  assert.strictEqual(changed.family, base.family);
  assert.strictEqual(changed.batch, base.batch);
  assert.equal(changed.operationCount, base.operationCount + 3);
  assert.deepEqual(changed.operations.slice(-3).map((event) => event.kind), ['prepare', 'rotate', 'measure']);
  // Replacing results later also leaves every earlier snapshot available intact.
  changed = calculateTime(changed, [1, 0, 0], 2, 'spectral');
  changed = calculateFamily(changed, 1);
  changed = runProtocol(changed, ['x'], 20);
  assert.equal(JSON.stringify(base), old);
  assert.notStrictEqual(changed.time, base.time);
  assert.notStrictEqual(changed.family, base.family);
  assert.notStrictEqual(changed.batch, base.batch);
});

test('preparation, rotation, and deterministic calculations consume no random draws', () => {
  const initial = createLab();
  let lab = prepareState(initial, 90, 90, 0.6);
  closeVector(lab.current, [0, 0.6, 0]);
  lab = rotateState(lab, 'x', 90);
  closeVector(lab.current, [0, 0, 0.6]);
  lab = reprepare(lab);
  closeVector(lab.current, [0, 0.6, 0]);
  lab = calculateTime(lab, [0, 0, 1], 3, 'spectral');
  lab = calculateFamily(lab, 0.2);
  assert.equal(lab.seed, initial.seed);
  const measured = measureState(lab, 'y');
  assert.equal(measured.seed, advanceSeed(initial.seed, 1));
  assert.equal(measured.operations.at(-1)!.kind, 'measure');
  assert.equal(measured.operations.at(-1)!.index, measured.operationCount);
  assert.equal(measured.operations.at(-1)!.axis, 'y');
});

test('a batch consumes N times protocol-length draws while preserving the live state and operations', () => {
  const base = prepareState(createLab(), 0, 0, 1);
  const result = runProtocol(base, ['z', 'x', 'z'], 37);
  assert.equal(result.seed, advanceSeed(base.seed, 37 * 3));
  assert.strictEqual(result.current, base.current);
  assert.strictEqual(result.prepared, base.prepared);
  assert.strictEqual(result.operations, base.operations);
  assert.equal(result.operationCount, base.operationCount);
  assert.equal(result.runCount, base.runCount + 1);
  assert.equal(result.batch!.id, result.runCount);
  closeVector(result.batch!.initial, [0, 0, 1]);
  assert.notStrictEqual(result.batch!.initial, base.current);
  assert.equal(result.batch!.sample.initialSeed, base.seed);
  assert.equal(result.batch!.sample.seed, result.seed);
  assert.equal(result.batch!.sample.distribution.reduce((sum, path) => sum + path.count, 0), 37);
});

test('repreparation restores the last manually prepared state without rewinding randomness', () => {
  const prepared = prepareState(createLab(), 90, 0, 1);
  const measured = measureState(prepared, 'z');
  const restored = reprepare(measured);
  closeVector(restored.current, prepared.current);
  closeVector(restored.prepared, prepared.prepared);
  assert.equal(restored.seed, measured.seed);
  assert.notEqual(restored.seed, prepared.seed);
  assert.equal(restored.operationCount, measured.operationCount + 1);
});

test('fixed-H result records the chosen method, copied inputs, and physical time', () => {
  const initial: [number, number, number] = [1, 0, 0];
  const h: [number, number, number] = [0, 0, 1];
  for (const method of ['spectral', 'bloch'] as const) {
    const result = timeRun(initial, h, Math.PI / 2, method, 17);
    assert.equal(result.id, 17);
    assert.equal(result.method, method);
    assert.equal(result.end, Math.PI / 2);
    assert.equal(result.points.length, 201);
    assert.equal(result.points[100].t, Math.PI / 4);
    closeVector(result.points[100].r, [0, 1, 0]);
    closeVector(result.points[200].r, [-1, 0, 0]);
  }
  const stored = timeRun(initial, h, 2, 'spectral', 18);
  initial[0] = 0;
  h[2] = 0;
  closeVector(stored.initial, [1, 0, 0]);
  closeVector(stored.h, [0, 0, 1]);
  closeVector(stored.points[0].r, [1, 0, 0]);
  const lab = createLab();
  const calculated = calculateTime(lab, [1, 0, 0], 1, 'bloch');
  assert.strictEqual(calculated.current, lab.current);
  assert.strictEqual(calculated.operations, lab.operations);
  assert.equal(calculated.seed, lab.seed);
});

test('parameter families retain lambda as a separate coordinate and preserve degeneracy', () => {
  const crossing = familyRun(0, 21);
  assert.equal(crossing.id, 21);
  assert.equal(crossing.delta, 0);
  assert.equal(crossing.points[0].lambda, -3);
  assert.equal(crossing.points.at(-1)!.lambda, 3);
  const center = crossing.points.find((point) => point.lambda === 0)!;
  assert.deepEqual(center.data, { energies: [0, 0], lower: null, upper: null, gap: 0 });
  const avoided = familyRun(0.4, 22);
  assert.equal(avoided.points[100].lambda, 0);
  assert.equal(avoided.points[100].data.gap, 0.8);
  const lab = createLab();
  const calculated = calculateFamily(lab, 0);
  assert.strictEqual(calculated.time, lab.time);
  assert.strictEqual(calculated.current, lab.current);
  assert.equal(calculated.seed, lab.seed);
  assert.equal(calculated.operationCount, lab.operationCount);
});

test('resetting the explicit seed reproduces sampling without needing to reset a view', () => {
  const initial = createLab();
  const first = runProtocol(initial, ['z', 'x', 'z'], 125);
  // The UI resets this explicit seed field; run identity is intentionally new.
  const replay = runProtocol({ ...first, seed: initial.seed }, ['z', 'x', 'z'], 125);
  assert.deepEqual(replay.batch!.sample, first.batch!.sample);
  assert.notEqual(replay.batch!.id, first.batch!.id);
  const event = measureState(initial, 'z');
  const repeated = measureState({ ...initial, seed: initial.seed }, 'z');
  assert.deepEqual(repeated.current, event.current);
  assert.equal(repeated.operations.at(-1)!.outcome, event.operations.at(-1)!.outcome);
  assert.equal(repeated.seed, event.seed);
});

test('operation retention is bounded without reusing event indices or consuming RNG', () => {
  const initial = createLab();
  let lab = initial;
  for (let i = 0; i < 17; i++) lab = rotateState(lab, 'z', 1);
  assert.equal(lab.operations.length, 12);
  assert.equal(lab.operationCount, 17);
  assert.deepEqual(lab.operations.map((event) => event.index), Array.from({ length: 12 }, (_, i) => i + 6));
  assert.equal(lab.seed, initial.seed);
  assert.equal(initial.operations.length, 0);
});

test('a retained measurement replays from its own provenance after seed resets and history truncation', () => {
  let lab = prepareState(createLab(), 60, 35, 0.65);
  for (let i = 0; i < 15; i++) lab = rotateState(lab, 'z', 1);
  lab = measureState({ ...lab, seed: 777 }, 'y');
  const recorded = lab.operations.at(-1)!;
  const recordedText = JSON.stringify(recorded);
  lab = { ...lab, seed: 42 };
  for (let i = 0; i < 11; i++) lab = rotateState(lab, 'x', 1);
  // The event immediately before this measurement is no longer retained.
  const retained = lab.operations[0];
  assert.equal(retained.index, recorded.index);
  assert.equal(JSON.stringify(retained), recordedText);
  assert.equal(retained.kind, 'measure');
  assert.equal(retained.seedBefore, 777);
  assert.equal(lab.seed, 42);
  const draw = nextRandom(retained.seedBefore);
  assert.equal(retained.draw, draw.value);
  assert.equal(retained.seedAfter, draw.seed);
  const replay = measure(retained.before, axisVector(retained.axis!), draw.value);
  assert.equal(replay.outcome, retained.outcome);
  assert.equal(replay.probability, retained.probability);
  closeVector(replay.state, retained.state);
  assert.notStrictEqual(retained.before, retained.state);
  assert.equal(lab.operations[1].seedBefore, 42);
  assert.equal(lab.operations[1].seedAfter, 42);
  assert.equal(lab.operations[1].draw, undefined);
});

test('the fastest allowed evolution is resolved across its full physical-time interval', () => {
  const h: Vec3 = [5, 5, 5], end = 100, energy = Math.sqrt(75);
  for (const method of ['spectral', 'bloch'] as const) {
    const run = timeRun([0, 0, 1], h, end, method, 50);
    const intervals = run.points.length - 1;
    assert.ok(intervals > 200);
    assert.equal(run.points[0].t, 0);
    assert.equal(run.points.at(-1)!.t, end);
    for (let i = 1; i < run.points.length; i++) {
      const phaseGap = 2 * energy * (run.points[i].t - run.points[i - 1].t);
      assert.ok(phaseGap > 0 && phaseGap <= 2 * Math.PI / 32 + 2e-12,
        `unresolved phase gap ${phaseGap} at sample ${i}`);
    }
    // Analytic rotation about (1,1,1)/sqrt(3), starting on the positive z axis.
    for (const index of [0, 1, Math.floor(intervals / 4), Math.floor(intervals / 2), intervals]) {
      const point = run.points[index];
      const c = Math.cos(2 * energy * point.t), s = Math.sin(2 * energy * point.t);
      closeVector(point.r, [s / Math.sqrt(3) + (1 - c) / 3,
        -s / Math.sqrt(3) + (1 - c) / 3, (1 + 2 * c) / 3]);
    }
  }
});

test('resource and numerical errors propagate without partially changing the laboratory', () => {
  const lab = deepFreeze(createLab());
  const before = JSON.stringify(lab);
  const badActions = [
    () => calculateTime(lab, [0, 0, 1], 0, 'spectral'),
    () => calculateTime(lab, [0, 0, 1], 100.1, 'spectral'),
    () => calculateTime(lab, [0, 0, 1], NaN, 'spectral'),
    () => calculateTime(lab, [0, 0, 5.1], 1, 'spectral'),
    () => calculateTime(lab, [0, Infinity, 0], 1, 'spectral'),
    () => calculateTime(lab, [0, 0, 1], 1, 'other' as EvolutionMethod),
    () => calculateFamily(lab, -0.1),
    () => calculateFamily(lab, 3.1),
    () => calculateFamily(lab, NaN),
    () => runProtocol(lab, ['z'], 0),
    () => runProtocol(lab, ['z'], 2001),
    () => runProtocol(lab, ['z'], 1.5),
    () => runProtocol(lab, [], 10),
    () => runProtocol(lab, ['bad' as Axis], 10),
    () => rotateState(lab, 'x', 361),
    () => rotateState(lab, 'x', NaN),
    () => measureState(lab, 'bad' as Axis),
    () => prepareState(lab, 0, 0, 1.1),
    () => measureState({ ...lab, seed: -1 }, 'z'),
  ];
  for (const action of badActions) {
    assert.throws(action, RangeError);
    assert.equal(JSON.stringify(lab), before);
  }
});
