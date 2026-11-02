import { coherentCoefficients, ladderMatrices, oscillatorEvolve, oscillatorMoments, oscillatorTimeRun, oscillatorWavefunction, rayleighRitzGround, gaussianEnergy, optimizeGaussian, type OscillatorTimeRun, type AnharmonicRun, type VariationalRun } from './oscillator.ts';
import { lineChart, type Series } from './plots.ts';
import type { Complex } from './quantum.ts';

export type OscillatorMode = 'motion' | 'methods';
type Language = 'mn' | 'en';
type MotionDraft = { alphaRe: string; alphaIm: string; modes: string; end: string; mass: string; omega: string };
type MethodDraft = { coupling: string; basis: string; beta0: string; step: string; iterations: string };
type Notice = { mn: string; en: string; error: boolean };
type OscillatorWorkspace = {
  schema: 'quantum-oscillator-workspace'; schemaVersion: 1; mode: OscillatorMode;
  motionDraft: MotionDraft; methodDraft: MethodDraft; motionRun: OscillatorTimeRun;
  direct: AnharmonicRun; refined: AnharmonicRun; variational: VariationalRun;
  timeCursor: number; iterationCursor: number;
};

let language: Language = 'mn';
let mode: OscillatorMode = 'motion';
let notice: Notice | null = null;
let motionDraft: MotionDraft = { alphaRe: '1.2', alphaIm: '0', modes: '12', end: '12.566370614359172', mass: '1', omega: '1' };
let methodDraft: MethodDraft = { coupling: '0.2', basis: '12', beta0: '1', step: '0.8', iterations: '40' };
let motionRun = oscillatorTimeRun({ re: 1.2, im: 0 }, 12, 4 * Math.PI, { mass: 1, omega: 1 });
let direct = rayleighRitzGround(12, 0.2);
let refined = rayleighRitzGround(28, 0.2);
let variational = optimizeGaussian(0.2, 1, 0.8, 40);
let timeCursor = 0, iterationCursor = variational.points.length - 1;
const opened: Record<OscillatorMode, Set<string>> = {
  motion: new Set(['osc-motion-controls', 'osc-math']),
  methods: new Set(['osc-method-controls', 'osc-math']),
};

const L = (mn: string, en: string): string => language === 'mn' ? mn : en;
const esc = (v: unknown): string => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const fmt = (x: number, n = 5): string => (Math.abs(x) < 0.5 * 10 ** -n ? 0 : x).toFixed(n);
const button = (action: string, label: string, cls = '', extra = '') => `<button type="button" data-action="${action}" class="${cls}" ${extra}>${label}</button>`;
const details = (id: string, title: string, body: string, cls = '') => `<details id="${id}" class="${cls}" ${opened[mode].has(id) ? 'open' : ''}><summary>${title}<span class="chevron" aria-hidden="true">⌄</span></summary>${body}</details>`;
const number = (id: string, label: string, value: string, min: number, max: number, step: string | number, field: string) => `<label class="number-field" for="${id}"><span>${label}</span><input id="${id}" type="number" data-osc-draft="${field}" value="${esc(value)}" min="${min}" max="${max}" step="${step}" required></label>`;
const numeric = (raw: string, min: number, max: number, integer = false): number => {
  const x = raw.trim() === '' ? NaN : Number(raw);
  if (!Number.isFinite(x) || x < min || x > max || (integer && !Number.isInteger(x))) throw new RangeError('invalid oscillator input');
  return x;
};
const nearestTime = (): number => {
  const points = motionRun.points; if (timeCursor <= 0) return 0; if (timeCursor >= motionRun.end) return points.length - 1;
  return Math.max(0, Math.min(points.length - 1, Math.round(timeCursor / motionRun.end * (points.length - 1))));
};
const selectedIteration = () => variational.points[Math.max(0, Math.min(variational.points.length - 1, iterationCursor))];

export function getOscillatorMode(): OscillatorMode { return mode; }
export function selectOscillatorExperiment(next: OscillatorMode): void { if (next === 'motion' || next === 'methods') { mode = next; notice = null; } }
export function captureOscillatorDetails(app: HTMLElement): void {
  for (const d of app.querySelectorAll<HTMLDetailsElement>('details[id^="osc-"]')) d.open ? opened[mode].add(d.id) : opened[mode].delete(d.id);
}

function motionControls(): string {
  return details('osc-motion-controls', `<span class="section-number">01</span>${L('Когерент төлөв ба хувьсал', 'Coherent state and evolution')}`, `<form id="osc-motion-form"><div class="input-row">${number('osc-alpha-re', 'Re α', motionDraft.alphaRe, -5, 5, 'any', 'alphaRe')}${number('osc-alpha-im', 'Im α', motionDraft.alphaIm, -5, 5, 'any', 'alphaIm')}</div><div class="input-row">${number('osc-modes', L('Суурийн хэмжээ N', 'Basis size N'), motionDraft.modes, 2, 32, 1, 'modes')}${number('osc-end', L('Төгсгөлийн хугацаа', 'End time'), motionDraft.end, 0.001, 100, 'any', 'end')}</div><div class="input-row">${number('osc-mass', 'm', motionDraft.mass, 0.1, 5, 'any', 'mass')}${number('osc-omega', 'ω', motionDraft.omega, 0.1, 5, 'any', 'omega')}</div>${button('osc-calculate-motion', L('Хувьслыг тооцоолох', 'Calculate evolution'), 'primary full')}<p class="help">${L('Когерент төлөвийг төгсгөлөг энергийн сууринд огтолж, дараа нь яг спектрийн фазуудаар хувьсгана.', 'The coherent state is truncated in the energy basis, then evolved with exact spectral phases in that retained space.')}</p></form>`, 'control-section');
}
function methodControls(): string {
  return details('osc-method-controls', `<span class="section-number">01</span>${L('Ангармоник үндсэн төлөв', 'Anharmonic ground state')}`, `<form id="osc-method-form">${number('osc-coupling', 'λ', methodDraft.coupling, 0, 2, 'any', 'coupling')}${number('osc-basis', L('Рэлей–Ритцийн N', 'Rayleigh–Ritz N'), methodDraft.basis, 2, 32, 1, 'basis')}<div class="input-row">${number('osc-beta0', 'β₀', methodDraft.beta0, 0.05, 20, 'any', 'beta0')}${number('osc-step', L('Алхам', 'Step'), methodDraft.step, 0.001, 2, 'any', 'step')}</div>${number('osc-iterations', L('Итераци', 'Iterations'), methodDraft.iterations, 1, 500, 1, 'iterations')}${button('osc-calculate-methods', L('Хоёр аргыг тооцоолох', 'Calculate both methods'), 'primary full')}<p class="help">${L('Рэлей–Ритц нь гармоник сууринд матриц диагональчилна. Вариацийн арга нь нэг параметртэй Гауссын гэр бүлийн энергийн функционалыг бууруулна.', 'Rayleigh–Ritz diagonalizes the Hamiltonian in a harmonic basis. The variational method minimizes the energy functional in a one-parameter Gaussian family.')}</p></form>`, 'control-section') + details('osc-persistence', `<span class="section-number">02</span>${L('Ажлын орон зай', 'Workspace')}`, `${button('osc-save-workspace', L('Хөтөчид хадгалах', 'Save in browser'), 'secondary full')}${button('osc-restore-workspace', L('Хадгалснаас сэргээх', 'Restore saved workspace'), 'text-button full')}<p class="help">${L('Схемийн хувилбар, оролт, үр дүн, хугацаа ба итерацийн курсорыг хадгална. Энэ нь зөвхөн осцилляторын Q3 ажлын орон зай.', 'Stores schema version, inputs, results, and the time/iteration cursors. This is the bounded Q3 oscillator workspace.')}</p>`, 'control-section');
}

function waveSamples(coeffs: Complex[], params: { mass: number; omega: number }): Series[] {
  const scale = 4 / Math.sqrt(params.mass * params.omega), count = 241;
  const data = Array.from({ length: count }, (_, i) => {
    const x = -scale + 2 * scale * i / (count - 1), z = oscillatorWavefunction(coeffs, x, params);
    return [x, z.re * z.re + z.im * z.im] as const;
  });
  return [{ label: '|ψ(x)|²', color: '#138a80', data }];
}

function motionPanels(): string {
  const point = motionRun.points[nearestTime()], coeffs = oscillatorEvolve(motionRun.initial, timeCursor, motionRun.params), moments = oscillatorMoments(coeffs, motionRun.params);
  const momentSeries: Series[] = [
    { label: '⟨x⟩ quantum', color: '#138a80', data: motionRun.points.map(p => [p.t, p.meanX] as const) },
    { label: 'x classical', color: '#bc7a29', data: motionRun.points.map(p => [p.t, p.classicalX] as const) },
  ];
  const widthSeries: Series[] = [{ label: 'Δx', color: '#5d6db4', data: motionRun.points.map(p => [p.t, Math.sqrt(p.varianceX)] as const) }];
  const { commutator } = ladderMatrices(motionRun.initial.length);
  const diag = commutator.map((row, i) => row[i]);
  return `<article class="panel is-featured" data-panel="osc-motion-density"><header class="panel-header"><div><strong>${L('Сонгосон хугацааны төлөв', 'State at selected time')}</strong><span class="panel-binding">t=${fmt(timeCursor, 4)} · N=${motionRun.initial.length} · η=${fmt(motionRun.retainedWeight ?? 1, 7)}</span></div></header><div class="panel-body">${lineChart(waveSamples(coeffs, motionRun.params), { id: 'osc-density-chart', xLabel: 'x', yLabel: '|ψ|²', xRange: [-8, 8], yRange: [0, 3], ariaLabel: L('Осцилляторын магадлалын нягт', 'Oscillator probability density') })}<dl class="stats"><div><dt>⟨x⟩</dt><dd>${fmt(moments.meanX)}</dd></div><div><dt>Δx</dt><dd>${fmt(Math.sqrt(moments.varianceX))}</dd></div><div><dt>⟨H⟩</dt><dd>${fmt(moments.meanEnergy)}</dd></div></dl></div></article>
  <article class="panel" data-panel="osc-motion-history"><header class="panel-header"><div><strong>${L('Дундаж байрлал ба классик зам', 'Mean position and classical path')}</strong><span class="panel-binding">${motionRun.sampleCount} ${L('хугацааны цэг', 'time points')}</span></div></header><div class="panel-body">${lineChart(momentSeries, { id: 'osc-moment-chart', xLabel: 'physical time t', yLabel: 'x', xRange: [0, 100], yRange: [-10, 10], ariaLabel: L('Дундаж байрлал', 'Mean position') })}${lineChart(widthSeries, { id: 'osc-width-chart', xLabel: 'physical time t', yLabel: 'Δx', xRange: [0, 100], yRange: [0, 10], ariaLabel: L('Байрлалын өргөн', 'Position width') })}<p class="panel-caption">${L('Когерент төлөвт ⟨x⟩ классик замыг дагана, харин өргөн тогтмол байх ёстой. Огтлолын алдааг η харуулна.', 'For a coherent state, ⟨x⟩ follows the classical trajectory while the width should remain constant. η reports the retained coherent-state weight before renormalization.')}</p></div></article>
  <article class="panel" data-panel="osc-operator"><header class="panel-header"><div><strong>${L('Операторын алгебр ба огтлол', 'Operator algebra and truncation')}</strong><span class="panel-binding">[a,a†] · N=${diag.length}</span></div></header><div class="panel-body"><div class="table-scroll"><table class="results-table"><thead><tr><th>n</th><th>⟨n|[a,a†]|n⟩</th></tr></thead><tbody>${diag.map((v, i) => `<tr><td>${i}</td><td>${fmt(v, 3)}</td></tr>`).join('')}</tbody></table></div><p class="panel-caption">${L('Доод төлөвүүд дээр 1, харин дээд огтлолын төлөв дээр 1−N гарна. Төгсгөлөг матриц яг каноник коммутатор байж чаддаггүй.', 'Low states see 1, while the cutoff state sees 1−N. A finite matrix representation cannot satisfy the canonical commutator exactly everywhere.')}</p></div></article>`;
}

function methodPanels(): string {
  const selected = selectedIteration(), history: Series[] = [
    { label: 'Gaussian E(βₖ)', color: '#138a80', data: variational.points.map(p => [p.iteration, p.energy] as const) },
    { label: `RR N=${direct.basisSize}`, color: '#bc7a29', data: variational.points.map(p => [p.iteration, direct.energy] as const) },
    { label: `reference N=${refined.basisSize}`, color: '#5d6db4', data: variational.points.map(p => [p.iteration, refined.energy] as const) },
  ];
  const landscape: Series[] = [{ label: 'E(β)', color: '#138a80', data: Array.from({ length: 161 }, (_, i) => {
    const beta = 0.25 + i * 2.75 / 160; return [beta, gaussianEnergy(beta, variational.coupling)] as const;
  }) }];
  const rrError = direct.energy - refined.energy, varError = selected.energy - refined.energy;
  return `<article class="panel is-featured" data-panel="osc-method-history"><header class="panel-header"><div><strong>${L('Тооцооллын түүх', 'Computational history')}</strong><span class="panel-binding">${L('итераци', 'iteration')} k=${selected.iteration} · β=${fmt(selected.beta, 6)}</span></div></header><div class="panel-body">${lineChart(history, { id: 'osc-history-chart', xLabel: 'algorithm iteration k', yLabel: 'energy', xRange: [0, 500], yRange: [0, 20], ariaLabel: L('Вариацийн оптимизацийн түүх', 'Variational optimization history') })}<dl class="stats"><div><dt>E(βₖ)</dt><dd>${fmt(selected.energy, 8)}</dd></div><div><dt>|dE/dβ|</dt><dd>${fmt(Math.abs(selected.gradient), 8)}</dd></div><div><dt>E<sub>RR</sub></dt><dd>${fmt(direct.energy, 8)}</dd></div><div><dt>E<sub>ref</sub></dt><dd>${fmt(refined.energy, 8)}</dd></div></dl><p class="panel-caption">${L('k нь алгоритмын итераци; физик хугацаа биш. Жижиг градиент нь сонгосон Гауссын гэр бүлийн доторх оптимизацийн шалгуур бөгөөд суурийн огтлолын алдааг батлахгүй.', 'k is an algorithm iteration, not physical time. A small gradient certifies optimization only within the chosen Gaussian family; it does not certify basis-truncation error.')}</p></div></article>
  <article class="panel" data-panel="osc-method-comparison"><header class="panel-header"><div><strong>${L('Аргуудын харьцуулалт', 'Method comparison')}</strong><span class="panel-binding">λ=${fmt(direct.coupling, 3)}</span></div></header><div class="panel-body"><div class="table-scroll"><table class="results-table"><thead><tr><th>${L('Арга', 'Method')}</th><th>E</th><th>${L('Лавлагаанаас зөрүү', 'Error vs reference')}</th><th>${L('Диагностик', 'Diagnostic')}</th></tr></thead><tbody><tr><td>${L('Гауссын вариац', 'Gaussian variational')}</td><td>${fmt(selected.energy, 8)}</td><td>${fmt(varError, 8)}</td><td>|∂βE|=${fmt(Math.abs(selected.gradient), 6)}</td></tr><tr><td>Rayleigh–Ritz N=${direct.basisSize}</td><td>${fmt(direct.energy, 8)}</td><td>${fmt(rrError, 8)}</td><td>‖Hc−Ec‖=${fmt(direct.residual, 3)}</td></tr><tr><td>${L('Тусдаа нарийвчилсан лавлагаа', 'Separate refined reference')} N=${refined.basisSize}</td><td>${fmt(refined.energy, 8)}</td><td>0</td><td>‖Hc−Ec‖=${fmt(refined.residual, 3)}</td></tr></tbody></table></div><p class="panel-caption">${L('Вариацийн энерги нь өөрийн жижиг гэр бүлийн хязгаарлалтыг агуулна. Рэлей–Ритцийн алдааг илүү том N-ийн тусдаа тооцоотой харьцуулна.', 'The variational energy includes restriction to its small trial family. Rayleigh–Ritz truncation is checked against a separately refined larger basis.')}</p></div></article>
  <article class="panel" data-panel="osc-method-landscape"><header class="panel-header"><div><strong>${L('Энергийн функционал', 'Energy functional')}</strong><span class="panel-binding">E(β) · λ=${fmt(variational.coupling, 3)}</span></div></header><div class="panel-body">${lineChart(landscape, { id: 'osc-landscape-chart', xLabel: 'trial parameter β', yLabel: 'E(β)', ariaLabel: L('Гауссын энергийн функционал', 'Gaussian energy functional') })}<p class="panel-caption">E(β)=¼(β+β⁻¹)+¾λβ⁻².</p></div></article>`;
}

function learning(code: (id: string, title: string) => string): string {
  const methodId = mode === 'motion' ? 'oscillator-coherent' : 'oscillator-variational';
  const methodTitle = mode === 'motion' ? L('Когерент коэффициент ба спектрийн хувьсал', 'Coherent coefficients and spectral evolution') : L('Вариацийн оптимизаци', 'Variational optimization');
  const exercise = mode === 'motion'
    ? `<article class="exercise"><span class="exercise-id">E06</span><h4>${L('Когерент хөдөлгөөн ба тодорхойгүй байдал', 'Coherent motion and uncertainty')}</h4><p>${L('α болон N-ийг өөрчилж ⟨x⟩, Δx, классик зам, η-г зэрэг харьцуул. N-ийг өсгөхөд юу тогтворжих вэ?', 'Change α and N; compare ⟨x⟩, Δx, the classical path, and η. What stabilizes as N increases?')}</p></article><article class="exercise"><span class="exercise-id">E07</span><h4>${L('Огтлол дахь операторын алгебр', 'Operator algebra under truncation')}</h4><p>${L('[a,a†]-ийн диагоналийг N=4,8,16 үед шалгаж, доод төлөв ба огтлолын төлөвийн ялгааг тайлбарла.', 'Inspect the diagonal of [a,a†] for N=4,8,16 and explain the difference between low states and the cutoff state.')}</p></article>`
    : `<article class="exercise"><span class="exercise-id">E09</span><h4>${L('Энергийн функционал ба оптимизатор', 'Energy functional and optimizer')}</h4><p>${L('λ=0,0.1,0.5 үед E(β), итерацийн түүх, Рэлей–Ритцийн лавлагааг харьцуул. Итераци, β, суурийн N-ийг тусдаа координат гэж тайлбарла.', 'For λ=0,0.1,0.5 compare E(β), optimization history, and the Rayleigh–Ritz reference. Explain iteration, β, and basis size N as distinct coordinates.')}</p></article>`;
  const project = mode === 'methods' ? `<article class="exercise"><span class="exercise-id">P02</span><h4>${L('Ангармоник осцилляторын ойролцооллууд', 'Approximations to an anharmonic oscillator')}</h4><p>${L('λ-ийн хэдэн утгад Гауссын вариац ба Рэлей–Ритцийг харьцуул. Рэлей–Ритцийн N-ийг өсгөж тусдаа лавлагаа үүсгэн, аргуудын ашигтай мужийг тодорхойл.', 'Across several λ values compare the Gaussian variational family and Rayleigh–Ritz. Increase the Rayleigh–Ritz basis to form a separate reference and identify regimes where each approximation is useful.')}</p></article>` : '';
  return `<section class="learning" id="osc-learning"><div class="section-title"><div><span class="eyebrow">03 / ${L('Гармоник осциллятор', 'Harmonic oscillator')}</span><h2>${L('Математик, арга ба судлах ажил', 'Mathematics, methods, and investigations')}</h2></div><span class="learning-mark" aria-hidden="true">a†</span></div><div class="learning-grid"><div>${details('osc-math', L('Математик', 'Mathematics'), `<div class="lesson-body"><p>Eₙ=ω(n+½), x=(a+a†)/√(2mω). ${L('Когерент төлөвийн коэффициент cₙ=e^{-|α|²/2}αⁿ/√n!. Ангармоник жишээнд H=½(p²+x²)+λx⁴.', 'For a coherent state cₙ=e^{-|α|²/2}αⁿ/√n!. The anharmonic example uses H=½(p²+x²)+λx⁴.')}</p></div>`, 'lesson')}${details('osc-method', L('Арга ба эх код', 'Method and source'), `<div class="lesson-body"><p>${methodTitle}</p>${code(methodId, methodTitle)}${mode === 'methods' ? code('oscillator-ritz', 'Rayleigh–Ritz') : ''}</div>`, 'lesson')}</div><div>${details('osc-exercises', L('Дасгал', 'Exercises'), `<div class="lesson-body exercises">${exercise}${project}</div>`, 'lesson')}</div></div></section>`;
}

function coordinate(): string {
  if (mode === 'motion') return `<div class="coordinate-strip"><label for="osc-time">${L('Физик хугацаа', 'Physical time')}<output>t=${fmt(timeCursor, 4)}</output></label><input id="osc-time" type="range" min="0" max="${motionRun.end}" step="any" value="${timeCursor}" data-osc-coordinate="time"><span class="coordinate-endpoints"><span>0</span><span>${fmt(motionRun.end, 3)}</span></span></div>`;
  return `<div class="coordinate-strip"><label for="osc-iteration">${L('Алгоритмын итераци', 'Algorithm iteration')}<output>k=${selectedIteration().iteration}</output></label><input id="osc-iteration" type="range" min="0" max="${variational.points.length - 1}" step="1" value="${iterationCursor}" data-osc-coordinate="iteration"><span class="coordinate-endpoints"><span>0</span><span>${variational.points.length - 1}</span></span></div>`;
}

export function renderOscillator(lang: Language, code: (id: string, title: string) => string): string {
  language = lang;
  return `<div class="lab-layout"><aside class="controls" aria-label="${L('Туршилтын тохиргоо', 'Experiment setup')}">${mode === 'motion' ? motionControls() : methodControls()}</aside><section class="workspace" id="osc-workspace" tabindex="-1"><div class="workspace-top"><div><span class="eyebrow">${L('Тооцооллын арга', 'Computational method')}</span><button class="method-link" data-action="osc-show-method">${mode === 'motion' ? L('Аналитик суурь + спектрийн хувьсал', 'Analytic basis + spectral evolution') : L('Вариац + Рэлей–Ритц', 'Variational + Rayleigh–Ritz')} <span aria-hidden="true">↗</span></button></div><div class="workspace-actions">${button('osc-show-method', '&lt;/&gt;', 'code-button')}${mode === 'methods' ? button('osc-save-workspace', L('Хадгалах', 'Save'), 'secondary') : ''}</div></div>${coordinate()}<div class="notice ${notice?.error ? 'error' : ''}" id="osc-notice" role="status">${notice ? esc(notice[language]) : ''}</div><div class="panel-deck">${mode === 'motion' ? motionPanels() : methodPanels()}</div><div class="workspace-bottom"><span class="status-dot"></span>${L('Физик хугацаа ба алгоритмын итераци тусдаа координатууд.', 'Physical time and algorithm iteration are distinct coordinates.')}</div></section></div>${learning(code)}`;
}

function calculateMotion(): void {
  const alpha = { re: numeric(motionDraft.alphaRe, -5, 5), im: numeric(motionDraft.alphaIm, -5, 5) };
  if (alpha.re * alpha.re + alpha.im * alpha.im > 25) throw new RangeError('alpha too large');
  motionRun = oscillatorTimeRun(alpha, numeric(motionDraft.modes, 2, 32, true), numeric(motionDraft.end, 0.001, 100), { mass: numeric(motionDraft.mass, 0.1, 5), omega: numeric(motionDraft.omega, 0.1, 5) });
  timeCursor = 0;
  notice = { mn: 'Когерент төлөвийн хувьслыг шинэ оролтоор тооцооллоо.', en: 'Calculated coherent-state evolution from the new inputs.', error: false };
}
function calculateMethods(): void {
  const coupling = numeric(methodDraft.coupling, 0, 2), basis = numeric(methodDraft.basis, 2, 32, true);
  direct = rayleighRitzGround(basis, coupling);
  refined = rayleighRitzGround(Math.min(32, Math.max(24, basis + 8)), coupling);
  variational = optimizeGaussian(coupling, numeric(methodDraft.beta0, 0.05, 20), numeric(methodDraft.step, 0.001, 2), numeric(methodDraft.iterations, 1, 500, true));
  iterationCursor = variational.points.length - 1;
  notice = { mn: 'Хоёр аргын шинэ үр дүнг тооцооллоо.', en: 'Calculated new results for both methods.', error: false };
}
function workspace(): OscillatorWorkspace {
  return JSON.parse(JSON.stringify({ schema: 'quantum-oscillator-workspace', schemaVersion: 1, mode, motionDraft, methodDraft, motionRun, direct, refined, variational, timeCursor, iterationCursor })) as OscillatorWorkspace;
}
export function oscillatorSnapshot(): unknown { return workspace(); }
export function restoreOscillatorSnapshot(value: unknown): void {
  const w = value as Partial<OscillatorWorkspace>;
  if (w?.schema !== 'quantum-oscillator-workspace' || w.schemaVersion !== 1 || (w.mode !== 'motion' && w.mode !== 'methods') || !w.motionDraft || !w.methodDraft || !w.motionRun || !w.direct || !w.refined || !w.variational) throw new RangeError('unsupported oscillator workspace');
  mode = w.mode; motionDraft = { ...w.motionDraft }; methodDraft = { ...w.methodDraft }; motionRun = w.motionRun; direct = w.direct; refined = w.refined; variational = w.variational;
  timeCursor = Number(w.timeCursor ?? 0); iterationCursor = Number(w.iterationCursor ?? variational.points.length - 1);
}
export function oscillatorExportSetup(): unknown { return workspace(); }
export function oscillatorExportData(): { metadata: Record<string, unknown>; columns: string[]; rows: (string | number | null)[][] } {
  if (mode === 'motion') return { metadata: { system: 'harmonic-oscillator', coordinate: 'physical time', retainedWeight: motionRun.retainedWeight, params: motionRun.params }, columns: ['t','mean_x','classical_x','delta_x','mean_p','classical_p','delta_p','mean_energy'], rows: motionRun.points.map(p => [p.t,p.meanX,p.classicalX,Math.sqrt(p.varianceX),p.meanP,p.classicalP,Math.sqrt(p.varianceP),p.meanEnergy]) };
  return { metadata: { system: 'anharmonic-oscillator', coordinate: 'algorithm iteration', coupling: variational.coupling, rayleighRitz: direct, refinedReference: { basisSize: refined.basisSize, energy: refined.energy, residual: refined.residual } }, columns: ['iteration','beta','energy','gradient','rr_energy','reference_energy'], rows: variational.points.map(p => [p.iteration,p.beta,p.energy,p.gradient,direct.energy,refined.energy]) };
}
export function oscillatorFigureMetadata(panelId: string | number): Record<string, unknown> {
  return { ...workspace(), panelId: String(panelId), selected: mode === 'motion' ? { time: timeCursor } : { iteration: selectedIteration().iteration } };
}

export function handleOscillatorClick(target: HTMLButtonElement): boolean {
  try {
    const action = target.dataset.action;
    if (action === 'osc-calculate-motion') calculateMotion();
    else if (action === 'osc-calculate-methods') calculateMethods();
    else if (action === 'osc-show-method') opened[mode].add('osc-method');
    else if (action === 'osc-save-workspace') { localStorage.setItem('quantum-oscillator-workspace-v1', JSON.stringify(workspace())); notice = { mn: 'Осцилляторын ажлын орон зайг хөтөчид хадгаллаа.', en: 'Saved the oscillator workspace in this browser.', error: false }; }
    else if (action === 'osc-restore-workspace') {
      const raw = localStorage.getItem('quantum-oscillator-workspace-v1'); if (!raw) throw new RangeError('no saved workspace');
      restoreOscillatorSnapshot(JSON.parse(raw)); notice = { mn: 'Хадгалсан ажлын орон зайг сэргээв.', en: 'Restored the saved workspace.', error: false };
    } else return false;
  } catch {
    notice = { mn: 'Оролтын утга эсвэл хадгалсан ажлын орон зайг шалгана уу. Өмнөх үр дүн хэвээр.', en: 'Check the inputs or saved workspace. Previous results are retained.', error: true };
  }
  return true;
}
export function handleOscillatorInput(input: HTMLInputElement): boolean {
  const field = input.dataset.oscDraft;
  if (field) {
    if (field in motionDraft) (motionDraft as unknown as Record<string,string>)[field] = input.value;
    else if (field in methodDraft) (methodDraft as unknown as Record<string,string>)[field] = input.value;
    return true;
  }
  if (input.dataset.oscCoordinate === 'time') { timeCursor = Number(input.value); return true; }
  if (input.dataset.oscCoordinate === 'iteration') { iterationCursor = Number(input.value); return true; }
  return false;
}
export function handleOscillatorChange(input: HTMLInputElement | HTMLSelectElement): boolean { return input instanceof HTMLInputElement ? handleOscillatorInput(input) : false; }
