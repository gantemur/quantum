import { densityMatrix, spinor, probabilities, purity, norm, axisVector, dot, type Axis, type Complex, type Vec3 } from './quantum.ts';
import { createLab, prepareState, reprepare, rotateState, measureState, runProtocol, calculateTime, calculateFamily, type TimeRun, type FamilyRun, type BatchRun, type EvolutionMethod, type Operation, type Lab } from './lab.ts';
import { lessonContent, type Language } from './lessons.ts';
import { translator, type TextKey } from './i18n.ts';
import { blochSvg, lineChart } from './plots.ts';
import { getBoxMode, selectBoxExperiment, renderBox, handleBoxClick, handleBoxInput, handleBoxChange, refreshBoxInputs, captureBoxDetails, boxSnapshot, boxExportSetup, boxExportData, boxFigureMetadata, type BoxMode } from './box-ui.ts';
import { getOscillatorMode, selectOscillatorExperiment, renderOscillator, handleOscillatorClick, handleOscillatorInput, handleOscillatorChange, captureOscillatorDetails, oscillatorSnapshot, oscillatorExportSetup, oscillatorExportData, oscillatorFigureMetadata, type OscillatorMode } from './oscillator-ui.ts';
import { dataCsv, downloadText, figureSvg, type DataExport } from './exports.ts';

type Mode = 'state' | 'time' | 'family';
type Tool = 'bloch' | 'density' | 'probabilities' | 'amplitudes' | 'trajectory' | 'spectrum' | 'outcomes';
type Binding = { mode: Mode; r: Vec3 | null; time: TimeRun; family: FamilyRun; batch: BatchRun | null; operations: readonly Operation[]; timeIndex: number; familyIndex: number; branch: 'lower' | 'upper' };
type Panel = { id: number; tool: Tool; basis: Axis; gamma: number; collapsed: boolean; pinned: Binding | null };
type SourceInfo = { version: string; revision: string | null; sourceHash: string; sourceFile: string; sourceFiles?: Record<string, string>; snippets: Record<string, { code: string; startLine: number; endLine: number; sourceFile?: string; sourceHash?: string }> };
type System = 'qubit' | 'box' | 'oscillator';
let system: System = 'qubit';

let lab = createLab();
let mode: Mode = 'state';
let lang: Language = 'mn';
try { if (localStorage.getItem('quantum-language') === 'en') lang = 'en'; } catch { /* Storage is optional. */ }
let t = translator(lang);
let nextPanel = 1;
const panel = (tool: Tool): Panel => ({ id: nextPanel++, tool, basis: 'z', gamma: 0, collapsed: false, pinned: null });
const panels: Record<Mode, Panel[]> = {
  state: [panel('bloch'), panel('density'), panel('probabilities')],
  time: [panel('trajectory'), panel('bloch'), panel('density')],
  family: [panel('spectrum'), panel('bloch'), panel('density')],
};
let timeIndex = 0, familyIndex = 100;
let branch: 'lower' | 'upper' = 'lower';
let codeFragment = 'probabilities';
let source: SourceInfo | null = null;
let notice: TextKey | null = null;
let noticeIsError = false;
let openSections = new Set<string>(window.matchMedia('(max-width: 700px)').matches ? [] : ['prepare-section', 'operations-section', 'time-controls-section', 'math-section']);
let draft = { theta: 90, phi: 0, length: 1, preset: 'plusX', rotationAxis: 'z' as Axis, rotationAngle: 90, measurementAxis: 'z' as Axis, protocol: 'z', trials: 100, seed: 123456789, hx: 0, hy: 0, hz: 0.5, end: 12, method: 'spectral' as EvolutionMethod, delta: 0.6 };
type Draft = typeof draft;
type Origin = 'default' | 'prepared' | 'state-transfer' | 'time-transfer' | 'family-transfer';
type Session = { lab: Lab; draft: Draft; openSections: Set<string>; codeFragment: string; origin: Origin; transfer: Record<string, unknown> | null };
const sessions: Record<Mode, Session> = {
  state: { lab, draft, openSections, codeFragment, origin: 'default', transfer: null },
  time: { lab: createLab(), draft: { ...draft }, openSections: new Set(openSections), codeFragment: 'spectral', origin: 'default', transfer: null },
  family: { lab: createLab(), draft: { ...draft }, openSections: new Set(openSections), codeFragment: 'spectrum', origin: 'default', transfer: null },
};
let renderedContext = '';
const words = (mn: string, en: string): string => lang === 'mn' ? mn : en;
function captureDetails(): void {
  if (system === 'box') { captureBoxDetails(app); return; }
  if (system === 'oscillator') { captureOscillatorDetails(app); return; }
  for (const d of app.querySelectorAll<HTMLDetailsElement>('details[id]')) d.open ? openSections.add(d.id) : openSections.delete(d.id);
}
function saveSession(): void {
  Object.assign(sessions[mode], { lab, draft, openSections, codeFragment });
}
function selectMode(next: Mode): void {
  captureDetails(); saveSession(); mode = next;
  ({ lab, draft, openSections, codeFragment } = sessions[mode]);
  notice = null;
}
function selectSystem(next: System): void {
  captureDetails(); saveSession(); system = next; notice = null;
}
function adoptState(r: Vec3, origin: Origin, transfer: Record<string, unknown>): void {
  const length = Math.min(1, norm(r));
  const theta = length ? Math.acos(Math.max(-1, Math.min(1, r[2] / length))) * 180 / Math.PI : 0;
  const phi = (Math.atan2(r[1], r[0]) * 180 / Math.PI + 360) % 360;
  Object.assign(draft, { theta, phi, length, preset: 'custom' });
  lab = prepareState(lab, theta, phi, length);
  sessions[mode].origin = origin; sessions[mode].transfer = transfer;
}
const app = document.querySelector<HTMLDivElement>('#app')!;
const esc = (value: unknown): string => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const fmt = (x: number, places = 3): string => (Math.abs(x) < 0.5 * 10 ** -places ? 0 : x).toFixed(places);
const vectorText = (r: Vec3): string => `(${r.map(x => fmt(x)).join(', ')})`;
const complexText = (z: Complex): string => {
  const a = Math.abs(z.re) < 0.0005 ? 0 : z.re, b = Math.abs(z.im) < 0.0005 ? 0 : z.im;
  if (!b) return fmt(a);
  if (!a) return `${fmt(b)}i`;
  return `${fmt(a)} ${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))}i`;
};
const option = (value: string, label: string, selected: string): string => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(label)}</option>`;
const axes = (value: Axis): string => (['x', 'y', 'z'] as Axis[]).map(axis => option(axis, axis, value)).join('');
const button = (action: string, label: string, cls = '', extra = ''): string => {
  const key = extra.match(/data-(?:id|lang|mode|preset)="([^"]+)"/)?.[1];
  const id = /(?:^|\s)id=/.test(extra) ? '' : `id="action-${action}${key ? `-${key}` : ''}"`;
  return `<button type="button" ${id} class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
};
const detail = (id: string, title: string, body: string, cls = ''): string => `<details id="${id}" class="${cls}" ${openSections.has(id) ? 'open' : ''}><summary>${title}<span class="chevron" aria-hidden="true">⌄</span></summary>${body}</details>`;
const range = (key: 'theta' | 'phi' | 'length', label: string, min: number, max: number, step: number, suffix: string): string => `<div class="range-field"><label for="${key}">${label}<output data-output="${key}">${draft[key]}${suffix}</output></label><input id="${key}" data-draft="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${draft[key]}" data-suffix="${suffix}"></div>`;
const numberField = (key: string, label: string, value: number, min: number, max: number, step: string | number): string => `<label class="number-field" for="${key}"><span>${label}</span><input id="${key}" type="number" data-draft="${key}" min="${min}" max="${max}" step="${step}" value="${value}" required></label>`;
const timePoint = (run: TimeRun, index: number) => run.points[Math.round(index * (run.points.length - 1) / 200)];

function binding(): Binding {
  let r: Vec3 | null = lab.current;
  if (mode === 'time') r = timePoint(lab.time, timeIndex).r;
  if (mode === 'family') r = lab.family.points[familyIndex].data[branch];
  return { mode, r, time: lab.time, family: lab.family, batch: lab.batch, operations: lab.operations, timeIndex, familyIndex, branch };
}
function bindingLabel(b: Binding): string {
  if (b.mode === 'state') return `${t('current')} · ${words('үйлдэл', 'operation')} ${b.operations.at(-1)?.index ?? 0}`;
  if (b.mode === 'time') return `${words('Хугацааны үр дүн', 'Time result')} ${b.time.id} · t = ${fmt(timePoint(b.time, b.timeIndex).t, 3)} · r₀ = ${vectorText(b.time.initial)} · h = ${vectorText(b.time.h)} · ${t(b.time.method === 'spectral' ? 'spectral' : 'blochMethod')}`;
  return `${words('Параметрийн үр дүн', 'Family result')} ${b.family.id} · λ = ${fmt(b.family.points[b.familyIndex].lambda, 2)} · E${b.branch === 'lower' ? '−' : '+'} ${words('салбар', 'branch')} · Δ = ${fmt(b.family.delta)}`;
}
function eligibleTools(b: Binding = binding()): Tool[] {
  const common: Tool[] = ['bloch', 'density', 'probabilities'];
  const r = b.r;
  if (r && Math.abs(norm(r) - 1) < 1e-12) common.push('amplitudes');
  if (b.mode === 'time') common.unshift('trajectory');
  if (b.mode === 'family') common.unshift('spectrum');
  if (b.mode === 'state') common.push('outcomes');
  return common;
}
function preparationControls(): string {
  const choices: TextKey[] = ['plusZ', 'minusZ', 'plusX', 'minusX', 'plusY', 'mixed'];
  return detail('prepare-section', `<span class="section-number">01</span>${t('preparation')}`, `<form id="prepare-form"><p class="help preparation-draft-label">${t('draft')} · ${words('Бэлтгэх товчоор хэрэгжүүлнэ.', 'Apply with Prepare state.')}</p><label class="field-label" for="preset">${t('preset')}</label><select id="preset" data-draft="preset">${choices.map(key => option(key, t(key), draft.preset)).join('')}${option('custom', t('custom'), draft.preset)}</select>${range('theta', t('polar'), 0, 180, 1, '°')}${range('phi', t('azimuth'), 0, 360, 1, '°')}${range('length', t('length'), 0, 1, 0.01, '')}<p class="help">${t('lengthHelp')}</p>${button('prepare', t('prepare'), 'primary full', 'id="prepare-button"')}${button('reprepare', t('reset'), 'text-button full', `title="${t('resetHelp')}"`)}</form>`, 'control-section');
}
function stateControls(): string {
  return `${preparationControls()}<details id="operations-section" class="control-section" ${openSections.has('operations-section') ? 'open' : ''}><summary><span class="section-number">02</span>${t('operations')}<span class="chevron" aria-hidden="true">⌄</span></summary><form id="operation-form"><label class="field-label">${t('rotation')}</label><div class="input-row"><label class="small-select" for="rotation-axis">${t('axis')}<select id="rotation-axis" data-draft="rotationAxis">${axes(draft.rotationAxis)}</select></label>${numberField('rotationAngle', `${t('angle')} °`, draft.rotationAngle, -360, 360, 1)}</div>${button('rotate', t('rotate'), 'secondary full')}<div class="rule"></div><label class="field-label" for="measurement-axis">${t('measurement')}</label><div class="button-row"><select id="measurement-axis" aria-label="${t('axis')}" data-draft="measurementAxis">${axes(draft.measurementAxis)}</select>${button('measure', t('measure'), 'primary', 'id="measure-button"')}</div><p class="help">${t('measureHelp')}</p></form></details>${detail('sampling-section', `<span class="section-number">03</span>${t('repetitions')}`, `<form id="sampling-form"><label class="field-label" for="protocol">${t('protocol')}</label><select id="protocol" data-draft="protocol">${['x', 'y', 'z', 'zz', 'zxz'].map(v => option(v, v.split('').join(' → '), draft.protocol)).join('')}</select><div class="input-row">${numberField('trials', t('copies'), draft.trials, 1, 2000, 1)}</div>${button('sample', t('sample'), 'primary full', 'id="sample-button"')}<p class="help">${t('samplingHelp')}</p><div class="rule"></div>${numberField('seed', t('seed'), draft.seed, 0, 4294967295, 1)}${button('seed', t('resetSeed'), 'text-button full')}<p class="help">${t('seeded')}</p></form>`, 'control-section')}`;
}
function timeControls(): string {
  return `<details id="time-controls-section" class="control-section" ${openSections.has('time-controls-section') ? 'open' : ''}><summary><span class="section-number">01</span>${t('timeSetup')}<span class="chevron" aria-hidden="true">⌄</span></summary><p class="formula control-formula">H = h · σ</p><form id="time-form"><div class="triple-input">${numberField('hx', 'hₓ', draft.hx, -5, 5, 0.1)}${numberField('hy', 'hᵧ', draft.hy, -5, 5, 0.1)}${numberField('hz', 'h_z', draft.hz, -5, 5, 0.1)}</div>${numberField('end', t('duration'), draft.end, 0.1, 100, 'any')}<label class="field-label" for="evolution-method">${t('method')}</label><select id="evolution-method" data-draft="method">${option('spectral', t('spectral'), draft.method)}${option('bloch', t('blochMethod'), draft.method)}</select><p class="help">${t('hHelp')}</p><div class="input-state"><span>${words('Дараагийн тооцооны эхний төлөв', 'Initial state for next calculation')}</span><code>${vectorText(lab.current)}</code></div>${button('calculate-time', t('calculate'), 'primary full', 'id="calculate-time"')}<p class="help">${t('refreshHelp')}</p></form></details>${preparationControls()}`;
}
function familyControls(): string {
  return `<section class="control-section"><h3><span class="section-number">01</span>${t('familySetup')}</h3><p class="formula control-formula">H(λ) = Δσₓ + λσ_z</p><form id="family-form">${numberField('delta', t('coupling'), draft.delta, 0, 3, 0.05)}${button('calculate-family', t('calculateFamily'), 'primary full', 'id="calculate-family"')}<p class="help">${t('familyHelp')}</p></form><div class="rule"></div><label class="field-label" for="branch">${t('branch')}</label><select id="branch" data-view="branch">${option('lower', t('lower'), branch)}${option('upper', t('upper'), branch)}</select></section><div class="quiet-note"><span class="note-mark">λ</span><p>${t('familyDescription')}</p></div>`;
}
function methodLabel(): string {
  if (mode === 'time') return t(lab.time.method === 'spectral' ? 'spectral' : 'blochMethod');
  return t(mode === 'family' ? 'analytic' : 'born');
}
function coordinateControls(): string {
  if (mode === 'state') return `<div class="state-summary"><span class="status-dot"></span><span>${t('current')}</span><code data-testid="live-state">r = ${vectorText(lab.current)}</code><span class="purity-chip">Tr(ρ²) = ${fmt(purity(lab.current))}</span></div>`;
  const isTime = mode === 'time', value = isTime ? timeIndex : familyIndex;
  const coordinate = isTime ? timePoint(lab.time, value).t : lab.family.points[value].lambda;
  return `<div class="coordinate-strip"><label for="coordinate">${t(isTime ? 'timeSelect' : 'parameter')}<output id="coordinate-output">${isTime ? 't' : 'λ'} = ${fmt(coordinate, 2)}</output></label><div class="coordinate-row">${button('previous', '−', 'square', `aria-label="${t('coordinate')} −"`)}<input id="coordinate" type="range" min="0" max="200" step="1" value="${value}" aria-label="${t(isTime ? 'timeSelect' : 'parameter')}">${button('next', '+', 'square', `aria-label="${t('coordinate')} +"`)}</div><span class="coordinate-endpoints"><span>${isTime ? '0' : '−3'}</span><span>${isTime ? fmt(lab.time.end, 1) : '+3'}</span></span></div>`;
}
function basisControl(p: Panel): string {
  return `<label class="panel-basis" for="basis-${p.id}">${t(p.tool === 'probabilities' ? 'measurementAxis' : 'basis')}<select id="basis-${p.id}" data-panel-basis="${p.id}">${axes(p.basis)}</select></label>`;
}
function statRow(label: string, value: string): string { return `<div><dt>${label}</dt><dd>${value}</dd></div>`; }
function matrixPanel(r: Vec3, p: Panel): string {
  const rho = densityMatrix(r, p.basis), length = norm(r);
  return `${basisControl(p)}<div class="matrix-equation"><span class="math-symbol">ρ =</span><table class="matrix" aria-label="${t('density')}"><tbody>${rho.map(row => `<tr>${row.map(x => `<td>${complexText(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="panel-caption">${t('matrixHelp')}</p><dl class="stats">${statRow(t('trace'), fmt(rho[0][0].re + rho[1][1].re))}${statRow(t('purity'), fmt(purity(r)))}${statRow(t('eigenvalues'), `${fmt((1 + length) / 2)}, ${fmt((1 - length) / 2)}`)}</dl>`;
}
function probabilityPanel(r: Vec3, p: Panel): string {
  const values = probabilities(r, axisVector(p.basis));
  return `${basisControl(p)}<div class="probabilities">${([['+', values.plus, 'plus'], ['−', values.minus, 'minus']] as const).map(([sign, v, label]) => `<div class="probability-item"><div><span>σ<sub>${p.basis}</sub> = ${sign}1</span><strong>${fmt(v)}</strong></div><div class="bar-track" role="meter" aria-label="${t(label)}" aria-valuemin="0" aria-valuemax="1" aria-valuenow="${v}"><span class="bar-${label}" style="width:${v * 100}%"></span></div></div>`).join('')}</div><p class="panel-caption">${t('bornHelp')}</p><div class="formula probability-formula">p± = (1 ± r · n)/2</div>`;
}
function amplitudePanel(r: Vec3, p: Panel): string {
  const ket = spinor(r, p.basis, p.gamma * Math.PI / 180);
  if (!ket) return `<div class="empty-state"><span class="math-symbol">ρ</span><p>${t('mixedNoKet')}</p></div>`;
  return `${basisControl(p)}<div class="amplitudes">${ket.map((z, i) => {
    const mag = Math.hypot(z.re, z.im), phase = Math.atan2(z.im, z.re) * 180 / Math.PI;
    return `<div class="amplitude-row"><span class="ket">|${i === 0 ? '+' : '−'}${p.basis}⟩</span><span class="phasor" aria-hidden="true"><i style="--phase:${-phase}deg;--length:${mag * 46}%"></i></span><div><code>${complexText(z)}</code><small>|a${i === 0 ? '+' : '−'}|² = ${fmt(mag * mag)}</small></div></div>`;
  }).join('')}</div><label class="range-field phase-control" for="gamma-${p.id}"><span>${t('gamma')} <output>${p.gamma}°</output></span><input id="gamma-${p.id}" type="range" data-panel-gamma="${p.id}" min="0" max="360" value="${p.gamma}"></label><p class="panel-caption">${t('gammaHelp')}</p>`;
}
function outcomesPanel(b: Binding): string {
  let html = '';
  if (!b.batch) html = `<div class="empty-state"><span class="math-symbol">±</span><p>${t('noBatch')}</p><small>${t('emptyHint')}</small></div>`;
  else {
    const batch = b.batch, sample = batch.sample;
    html = `<div class="record-heading"><span class="pill">${t('run')} ${batch.id}</span><strong>${sample.axes.join(' → ')}</strong><span>N = ${sample.trials}</span></div><p class="record-input">r₀ = ${vectorText(batch.initial)}<br>${t('seed')}: ${sample.initialSeed}</p><div class="table-scroll"><table class="results-table"><caption>${t('compare')}</caption><thead><tr><th>${t('path')}</th><th>p</th><th>${t('count')}</th><th>${t('observed')}</th></tr></thead><tbody>${sample.distribution.map(d => `<tr><td><code>${d.path.replaceAll('-', '−')}</code></td><td>${fmt(d.probability)}</td><td>${d.count}</td><td>${fmt(d.count / sample.trials)}</td></tr>`).join('')}</tbody></table></div><p class="panel-caption">${t('recordHelp')}</p>`;
  }
  if (b.mode === 'state' && b.operations.length) html += `<div class="event-log"><h4>${t('lastEvents')}</h4><ol>${b.operations.slice(-6).map(e => `<li><span class="event-index">${e.index}</span><span>${t(e.kind === 'prepare' ? 'stateEvent' : e.kind === 'rotate' ? 'rotationEvent' : 'measurementEvent')}${e.axis ? ` · ${e.axis}` : ''}${e.angle !== undefined ? ` · ${e.angle}°` : ''}</span>${e.outcome ? `<strong>${e.outcome > 0 ? '+1' : '−1'}</strong><small>p = ${fmt(e.probability!)}</small>` : ''}</li>`).join('')}</ol></div>`;
  return html;
}
function panelBody(p: Panel): string {
  const b = p.pinned ?? binding(), r = b.r;
  if (p.tool === 'trajectory') {
    if (b.mode !== 'time') return `<p class="empty-state">${t('noTime')}</p>`;
    const colors = ['#138a80', '#bc7a29', '#7064ac'];
    const chart = lineChart(([0, 1, 2] as const).map((i) => ({ label: ['rₓ', 'rᵧ', 'r_z'][i], color: colors[i], data: b.time.points.map(q => [q.t, q.r[i]] as const) })), { xLabel: t('timeSelect'), yLabel: t('components'), xRange: [0, b.time.end], yRange: [-1.1, 1.1], cursor: timePoint(b.time, b.timeIndex).t, id: `trajectory-${p.id}`, ariaLabel: t('trajectory') });
    const energy0 = dot(b.time.h, b.time.initial);
    const drift = Math.max(...b.time.points.map(q => Math.abs(dot(b.time.h, q.r) - energy0)));
    return `<div class="interactive-chart" data-select-coordinate="time">${chart}</div><div class="chart-foot"><span>${t('fixedAxes')}</span><span>Δ⟨H⟩ ≤ ${drift.toExponential(1)}</span></div><dl class="result-details">${statRow(t('initial'), vectorText(b.time.initial))}${statRow('h', vectorText(b.time.h))}${statRow(t('methodUsed'), t(b.time.method === 'spectral' ? 'spectral' : 'blochMethod'))}</dl>`;
  }
  if (p.tool === 'spectrum') {
    if (b.mode !== 'family') return `<p class="empty-state">${t('noFamily')}</p>`;
    const bound = 4.8; // Shared fixed scale for every allowed Delta and pinned comparison.
    const chart = lineChart(([0, 1] as const).map((i) => ({ label: i === 0 ? 'E−' : 'E+', color: i === 0 ? '#138a80' : '#bc7a29', data: b.family.points.map(q => [q.lambda, q.data.energies[i]] as const) })), { xLabel: 'λ', yLabel: t('energy'), xRange: [-3, 3], yRange: [-bound, bound], cursor: b.family.points[b.familyIndex].lambda, id: `spectrum-${p.id}`, ariaLabel: t('spectrum') });
    const eig = b.family.points[b.familyIndex].data;
    return `<div class="interactive-chart" data-select-coordinate="family">${chart}</div><div class="chart-foot"><span>Δ = ${fmt(b.family.delta, 2)}</span><span>${t('gap')}: ${fmt(eig.gap)}</span></div><p class="panel-caption">${t('familyDescription')}</p>`;
  }
  if (p.tool === 'outcomes') return outcomesPanel(b);
  if (p.tool === 'bloch') return `${blochSvg(r, `bloch-${p.id}`, t('bloch'))}${r ? `<div class="component-readouts"><span><i class="dot teal"></i>rₓ <strong>${fmt(r[0])}</strong></span><span><i class="dot amber"></i>rᵧ <strong>${fmt(r[1])}</strong></span><span><i class="dot violet"></i>r<sub>z</sub> <strong>${fmt(r[2])}</strong></span></div><dl class="stats compact">${statRow(t('norm'), fmt(norm(r)))}${statRow('Tr(ρ²)', fmt(purity(r)))}</dl>` : `<p class="panel-caption">${t('noEigenstate')}</p>`}`;
  if (!r) return `<div class="empty-state"><span class="math-symbol">E+ = E−</span><p>${t('noEigenstate')}</p></div>`;
  if (p.tool === 'density') return matrixPanel(r, p);
  if (p.tool === 'probabilities') return probabilityPanel(r, p);
  return amplitudePanel(r, p);
}
function panelHtml(p: Panel, index: number): string {
  const types = eligibleTools(p.pinned ?? binding());
  if (!types.includes(p.tool)) types.push(p.tool);
  return `<article class="panel ${index === 0 ? 'featured' : ''} ${p.collapsed ? 'is-collapsed' : ''}" data-panel="${p.id}" data-tool="${p.tool}"><header class="panel-header"><div class="panel-heading"><span class="panel-number">${String(index + 1).padStart(2, '0')}</span><label class="sr-only" for="tool-${p.id}">${t('instruction')}</label><select id="tool-${p.id}" class="tool-select" data-panel-tool="${p.id}">${types.map(type => option(type, t(type), p.tool)).join('')}</select></div><div class="panel-actions">${button('pin-panel', p.pinned ? '●' : '○', p.pinned ? 'icon-button active' : 'icon-button', `data-id="${p.id}" title="${t(p.pinned ? 'unpin' : 'pin')}" aria-label="${t(p.pinned ? 'unpin' : 'pin')}" aria-pressed="${!!p.pinned}"`)}${index ? button('feature-panel', '↖', 'icon-button', `data-id="${p.id}" title="${t('feature')}" aria-label="${t('feature')}"`) : ''}${button('collapse-panel', p.collapsed ? '+' : '−', 'icon-button', `data-id="${p.id}" title="${t(p.collapsed ? 'expand' : 'collapse')}" aria-label="${t(p.collapsed ? 'expand' : 'collapse')}" aria-expanded="${!p.collapsed}"`)}${button('remove-panel', '×', 'icon-button', `data-id="${p.id}" title="${t('remove')}" aria-label="${t('remove')}" ${panels[mode].length === 1 ? 'disabled' : ''}`)}</div></header><div class="panel-binding">${p.pinned ? `<span class="pin-label">${t('pinned')}</span>` : ''}${bindingLabel(p.pinned ?? binding())}</div><div class="panel-body" ${p.collapsed ? 'hidden' : ''}>${panelBody(p)}</div></article>`;
}
function sourceDisclosure(id: string, title: string): string {
  const snippet = source?.snippets[id];
  const file = snippet?.sourceFile ?? (id.startsWith('box-') ? 'src/box.ts' : 'src/quantum.ts');
  const ref = source?.revision ?? 'main';
  const url = `https://github.com/gantemur/quantum/blob/${ref}/${file}${snippet ? `#L${snippet.startLine}-L${snippet.endLine}` : ''}`;
  return `${title ? `<h4>${esc(title)}</h4>` : ''}${snippet ? `<pre tabindex="0"><code>${esc(snippet.code)}</code></pre><div class="source-meta"><a href="${url}" target="_blank" rel="noreferrer">${t('source')} · ${file} ↗</a><span>${source?.revision ? source.revision.slice(0, 12) : t('localBuild')}</span></div><details class="hash-detail"><summary>${t('sourceHash')}</summary><code>${snippet.sourceHash ?? source?.sourceHash}</code></details>` : `<p>${t('unavailableCode')}</p><a href="${url}" target="_blank" rel="noreferrer">${t('source')} ↗</a>`}`;
}
function codeSection(): string {
  const fragments = { probabilities: 'probabilityCode', rotate: 'rotationCode', spectral: 'spectralCode', spectrum: 'spectrumCode', measure: 'measureCode' } as const;
  return `<div id="method-code"><h4>${t('codeTitle')}</h4><p>${t('codeHelp')}</p><label class="field-label" for="code-fragment">${t('fragment')}</label><select id="code-fragment" data-view="codeFragment">${Object.entries(fragments).map(([id, key]) => option(id, t(key), codeFragment)).join('')}</select>${sourceDisclosure(codeFragment, '')}</div>`;
}
function learning(): string {
  const content = lessonContent(lang, mode);
  return `<section class="learning" id="learning"><div class="section-title"><div><span class="eyebrow">${t('qubit')} / ${experimentLabel()}</span><h2>${t('learning')}</h2><p>${t('learningIntro')}</p></div><span class="learning-mark" aria-hidden="true">ψ</span></div><div class="learning-grid"><div>${detail('math-section', content.mathTitle, `<div class="lesson-body">${content.mathHtml}</div>`, 'lesson')}${detail('method-section', content.methodTitle, `<div class="lesson-body">${content.methodHtml}${codeSection()}</div>`, 'lesson')}${detail('glossary-section', content.glossaryTitle, `<div class="lesson-body">${content.glossaryHtml}</div>`, 'lesson')}</div><div>${detail('exercises-section', content.exercisesTitle, `<div class="lesson-body exercises">${content.exercises.map(ex => `<article class="exercise" id="${ex.id}"><span class="exercise-id">${ex.id}</span><h4>${ex.title}</h4><p>${ex.question}</p><ol>${ex.steps.map(s => `<li>${s}</li>`).join('')}</ol>${button('exercise', t('loadPreset'), 'secondary', `data-preset="${ex.preset}"`)}${detail(`hint-${ex.id}`, t('hint'), `<p>${ex.hint}</p>`, 'hint')}<p class="exercise-check"><strong>${t('check')}.</strong> ${ex.check}</p></article>`).join('')}</div>`, 'lesson')}${detail('project-section', content.projectsTitle, `<div class="lesson-body"><h4>${content.project.title}</h4><p>${content.project.question}</p><ol>${content.project.steps.map(s => `<li>${s}</li>`).join('')}</ol><p class="exercise-check">${content.project.check}</p></div>`, 'lesson')}</div></div></section>`;
}
function experimentLabel(): string {
  if (system === 'box') return getBoxMode() === 'state' ? words('Төлөв бүтээх ба энерги хэмжих', 'State construction & energy measurement') : words('Хугацааны хувьсал', 'Time evolution');
  if (system === 'oscillator') return getOscillatorMode() === 'motion' ? words('Когерент төлөв ба хөдөлгөөн', 'Coherent state and motion') : words('Ангармоник ойролцооллын аргууд', 'Anharmonic approximation methods');
  return words({ state: 'Төлөв бэлтгэх ба хэмжих', time: 'Тогтмол H: хугацааны хувьсал', family: 'H(λ): параметрийн бүл', }[mode], { state: 'State preparation & measurement', time: 'Time evolution at fixed H', family: 'Hamiltonian parameter family' }[mode]);
}
function navigation(): string {
  const experiments = system === 'qubit' ? [
    ['state', words('Төлөв бэлтгэх ба хэмжих', 'State preparation & measurement')],
    ['time', words('Тогтмол H: хугацааны хувьсал', 'Time evolution at fixed H')],
    ['family', words('H(λ): параметрийн бүл', 'Hamiltonian parameter family')],
  ] : system === 'box' ? [
    ['state', words('Төлөв бүтээх ба энерги хэмжих', 'State construction & energy measurement')],
    ['time', words('Хугацааны хувьсал', 'Time evolution')],
  ] : [
    ['motion', words('Когерент төлөв ба хөдөлгөөн', 'Coherent state and motion')],
    ['methods', words('Ангармоник ойролцооллын аргууд', 'Anharmonic approximation methods')],
  ];
  const question = system === 'box' ? (getBoxMode() === 'state'
    ? words('Комплекс коэффициентүүд байрлалын нягт ба энергийн магадлалыг хэрхэн тодорхойлох вэ?', 'How do complex coefficients determine position density and energy probabilities?')
    : words('Тогтмол энергийн магадлалтай үед интерференц ба байрлалын дундаж хэрхэн өөрчлөгдөх вэ?', 'How do interference and mean position evolve while energy probabilities stay fixed?'))
    : system === 'oscillator' ? (getOscillatorMode() === 'motion' ? words('Когерент төлөвийн квант дундаж классик хөдөлгөөнтэй хэрхэн холбогдох вэ?', 'How does coherent-state quantum motion track the classical oscillator?') : words('Вариац ба Рэлей–Ритц нэг үндсэн төлөвийг хэр сайн ойролцоо болгох вэ?', 'How well do variational and Rayleigh–Ritz methods approximate the same ground state?'))
    : words({ state: 'Бэлтгэл, эргэлт, хэмжилт төлөв болон дараагийн үр дүнг хэрхэн өөрчлөх вэ?', time: 'Өгөгдсөн эхний төлөв тогтмол Гамильтонианы дор хэрхэн хувьсах вэ?', family: 'Гамильтониан өөрчлөгдөхөд энерги ба хувийн төлөвүүд хэрхэн өөрчлөгдөх вэ?' }[mode], { state: 'How do preparation, rotation, and measurement change the state and later outcomes?', time: 'How does a chosen initial state evolve under a fixed Hamiltonian?', family: 'How do energies and eigenstates change across a family of Hamiltonians?' }[mode]);
  return `<section class="experiment-navigation" aria-label="${words('Систем ба туршилт', 'System and experiment')}"><div class="context-selectors"><label for="system-select"><span class="eyebrow">${words('Систем', 'System')}</span><select id="system-select">${option('qubit', words('Кубит · хоёр төлөвт систем', 'Qubit · two-level system'), system)}${option('box', words('Хязгааргүй 1D хайрцаг', 'Infinite 1D box'), system)}${option('oscillator', words('Гармоник / ангармоник осциллятор', 'Harmonic / anharmonic oscillator'), system)}</select></label><span class="context-arrow" aria-hidden="true">›</span><label for="experiment-select"><span class="eyebrow">${words('Туршилт', 'Experiment')}</span><select id="experiment-select">${experiments.map(([value, label]) => option(value, label, system === 'qubit' ? mode : system === 'box' ? getBoxMode() : getOscillatorMode())).join('')}</select></label><span class="unit-label">ℏ = 1</span></div><h1>${experimentLabel()}</h1><p class="experiment-question">${question}</p><p class="navigation-help">${words('Туршилт солиход тохиргоо, үр дүн, самбарууд хадгалагдана. Төлөв дамжуулахдаа тусгай товчийг ашиглана.', 'Switching experiments preserves settings, results, and panels. Use an explicit transfer to carry a state into another experiment.')}</p></section>`;
}
function resultStatus(): string {
  let dirty = false;
  if (mode === 'time') dirty = lab.current.some((x, i) => Math.abs(x - lab.time.initial[i]) > 1e-12) || [draft.hx, draft.hy, draft.hz].some((x, i) => x !== lab.time.h[i]) || draft.end !== lab.time.end || draft.method !== lab.time.method;
  if (mode === 'family') dirty = draft.delta !== lab.family.delta;
  const origin = { default: words('Анхны бэлтгэл', 'Default preparation'), prepared: words('Энэ туршилтад бэлтгэсэн', 'Prepared in this experiment'), 'state-transfer': words('Төлөв бэлтгэх туршилтаас хуулсан', 'Copied from state preparation'), 'time-transfer': words('Сонгосон хугацааны төлөвөөс хуулсан', 'Copied from selected time state'), 'family-transfer': words('Сонгосон хувийн төлөв ба H-оос хуулсан', 'Copied from selected eigenstate and H') }[sessions[mode].origin];
  const transfer = mode === 'state' ? button('transfer-to-time', words('Энэ төлөвийг хувьсалд ашиглах →', 'Use this state in evolution →'), 'text-button') : mode === 'family' ? button('transfer-family-to-time', words('Сонгосон хувийн төлөв ба H-ийг ашиглах →', 'Use selected eigenstate and H →'), 'text-button', binding().r ? '' : 'disabled') : button('transfer-time-to-state', words('Сонгосон төлөвийг бэлтгэлд ашиглах →', 'Use selected state in preparation →'), 'text-button');
  return `<div class="result-status ${dirty ? 'is-stale' : ''}" id="result-status"><span>${mode === 'state' ? origin : `${words('Харагдаж буй', 'Showing')}: ${bindingLabel(binding())} · ${methodLabel()}`}</span>${dirty ? `<strong>${words('Оролт өөрчлөгдсөн — шинэ үр дүнг тооцоолно уу.', 'Inputs changed — calculate to replace this result.')}</strong>` : ''}${mode === 'time' ? `<small>${origin}</small>` : ''}${transfer}</div>`;
}
function exportToolbar(): string {
  return `<div class="export-toolbar" aria-label="${words('Экспорт', 'Export')}"><span>${words('Энэ туршилт', 'This experiment')}</span>${button('export-setup', words('Тохиргоо JSON', 'Setup JSON'), 'text-button')}${button('export-data', words('Өгөгдөл CSV', 'Data CSV'), 'text-button')}${button('export-figure', words('Зураг SVG', 'Figure SVG'), 'text-button')}<small>${words('JSON нь тохиргооны бүртгэл. CSV нь одоогийн үр дүн; SVG нь эхний нээлттэй график.', 'JSON records setup. CSV contains the current result; SVG contains the first expanded graph.')}</small></div>`;
}
function render(capture = true): void {
  const activeId = (document.activeElement as HTMLElement | null)?.id;
  const context = `${system}:${system === 'qubit' ? mode : system === 'box' ? getBoxMode() : getOscillatorMode()}`;
  if (capture && renderedContext === context) captureDetails();
  t = translator(lang); document.documentElement.lang = lang;
  document.querySelector<HTMLAnchorElement>('.skip')?.setAttribute('href', system === 'box' ? '#box-workspace' : '#workspace');
  document.title = `${t('brand')} · ${experimentLabel()}`;
  const body = system === 'box' ? renderBox(lang, sourceDisclosure) : `<div class="lab-layout"><aside class="controls" aria-label="${t('experiment')}">${mode === 'state' ? stateControls() : mode === 'time' ? timeControls() : familyControls()}</aside><section class="workspace" id="workspace" tabindex="-1"><div class="workspace-top"><div><span class="eyebrow">${t('method')}</span><button id="method-link" class="method-link" data-action="show-method">${methodLabel()} <span aria-hidden="true">↗</span></button></div><div class="workspace-actions">${button('show-method', '&lt;/&gt;', 'code-button', `aria-label="${t('openMethod')}" title="${t('openMethod')}"`)}${button('add-panel', `+ ${t('addPanel')}`, 'secondary', panels[mode].length >= 4 ? `disabled title="${t('panelLimit')}"` : '')}</div></div>${resultStatus()}${coordinateControls()}<div id="notice" class="notice ${noticeIsError ? 'error' : ''}" role="status" aria-live="polite">${notice ? t(notice) : ''}</div><div class="panel-deck" id="panel-deck">${panels[mode].map(panelHtml).join('')}</div><div class="workspace-bottom"><span class="status-dot"></span>${t('methodHelp')}</div></section></div>${learning()}`;
  app.innerHTML = `<header class="topbar"><a class="brand" href="./"><img src="./icon.svg" width="38" height="38" alt=""><span>${t('brand')}<small>${t('subtitle')}</small></span></a><div class="topbar-right"><div class="language-switch" aria-label="Language / Хэл">${button('language', 'MN', lang === 'mn' ? 'selected' : '', 'data-lang="mn" aria-label="Монгол"')}${button('language', 'EN', lang === 'en' ? 'selected' : '', 'data-lang="en" aria-label="English"')}</div></div></header><main>${navigation()}${exportToolbar()}${body}</main><footer><span>${t('footer')}</span><a href="https://github.com/gantemur/quantum" target="_blank" rel="noreferrer">${t('footerSource')} ↗</a></footer>`;
  renderedContext = context;
  if (activeId) (document.getElementById(activeId) ?? document.querySelector<HTMLElement>('.panel .tool-select'))?.focus({ preventScroll: true });
}
function updatePanels(): void {
  const deck = document.querySelector('#panel-deck');
  if (deck) deck.innerHTML = panels[mode].map(panelHtml).join('');
}
function setNotice(key: TextKey, error = false): void { notice = key; noticeIsError = error; }
function applyPreset(name: string): void {
  const values: Record<string, [number, number, number]> = { plusZ: [0, 0, 1], minusZ: [180, 0, 1], plusX: [90, 0, 1], minusX: [90, 180, 1], plusY: [90, 90, 1], mixed: [90, 0, 0] };
  if (values[name]) [draft.theta, draft.phi, draft.length] = values[name];
  draft.preset = name;
}
function showRecord(): void {
  if (!panels.state.some(p => p.tool === 'outcomes') && panels.state.length < 4) panels.state.push(panel('outcomes'));
}
function setCoordinate(index: number): void {
  const i = Math.max(0, Math.min(200, Math.round(index)));
  if (mode === 'time') timeIndex = i;
  else if (mode === 'family') familyIndex = i;
  const slider = document.querySelector<HTMLInputElement>('#coordinate');
  if (slider) slider.value = String(i);
  const label = document.querySelector('#coordinate-output');
  if (label) label.textContent = mode === 'time' ? `t = ${fmt(timePoint(lab.time, i).t, 2)}` : `λ = ${fmt(lab.family.points[i].lambda, 2)}`;
  updatePanels();
  const status = document.querySelector('#result-status'); if (status) status.outerHTML = resultStatus();
}

function qubitData(b: Binding = binding()): DataExport {
  const metadata: Record<string, unknown> = { system: 'qubit', experiment: b.mode, hbar: 1, source: source?.revision ?? null, sourceFiles: source?.sourceFiles, binding: bindingLabel(b) };
  if (b.mode === 'time') return { metadata: { ...metadata, resultId: b.time.id, initial: b.time.initial, h: b.time.h, end: b.time.end, method: b.time.method, coordinate: 'physical time' }, columns: ['t', 'rx', 'ry', 'rz', 'mean_energy'], rows: b.time.points.map(p => [p.t, ...p.r, dot(b.time.h, p.r)]) };
  if (b.mode === 'family') return { metadata: { ...metadata, resultId: b.family.id, delta: b.family.delta, coordinate: 'Hamiltonian parameter lambda; not physical time', method: 'analytic 2x2 eigensystem' }, columns: ['lambda', 'energy_lower', 'energy_upper', 'lower_rx', 'lower_ry', 'lower_rz', 'upper_rx', 'upper_ry', 'upper_rz'], rows: b.family.points.map(p => [p.lambda, ...p.data.energies, ...(p.data.lower ?? [null, null, null]), ...(p.data.upper ?? [null, null, null])]) };
  return { metadata: { ...metadata, current: b.r, operations: b.operations, batch: b.batch, method: 'Bloch density matrix and Born rule' }, columns: ['rx', 'ry', 'rz', 'purity', 'p_plus_x', 'p_plus_y', 'p_plus_z'], rows: b.r ? [[...b.r, purity(b.r), ...(['x', 'y', 'z'] as Axis[]).map(a => probabilities(b.r!, axisVector(a)).plus)]] : [] };
}
function exportCurrent(kind: string): void {
  saveSession();
  const experiment = system === 'qubit' ? mode : getBoxMode();
  const name = `quantum-${system}-${experiment}`;
  const provenance = { version: source?.version ?? '0.2.0', sourceRevision: source?.revision ?? null, numericalSourceHashes: source?.sourceFiles ?? null };
  if (kind === 'export-setup') {
    const setup = { kind: 'quantum-lab-setup', schemaVersion: 1, scope: 'active experiment; setup record, not full session restoration', system, experiment, provenance, setup: system === 'box' ? boxExportSetup() : { prepared: lab.prepared, current: lab.current, draft, initialStateOrigin: sessions[mode].origin, transferSource: sessions[mode].transfer, seed: lab.seed, actualResult: mode === 'time' ? { id: lab.time.id, initial: lab.time.initial, h: lab.time.h, end: lab.time.end, method: lab.time.method } : mode === 'family' ? { id: lab.family.id, delta: lab.family.delta } : { operationCount: lab.operationCount }, cursor: mode === 'time' ? { index: timeIndex, t: timePoint(lab.time, timeIndex).t } : mode === 'family' ? { index: familyIndex, lambda: lab.family.points[familyIndex].lambda, branch } : null, panels: panels[mode].map(p => ({ id: p.id, tool: p.tool, basis: p.basis, gamma: p.gamma, collapsed: p.collapsed, pinned: p.pinned ? { label: bindingLabel(p.pinned), state: p.pinned.r, mode: p.pinned.mode, result: p.pinned.mode === 'time' ? { id: p.pinned.time.id, initial: p.pinned.time.initial, h: p.pinned.time.h, end: p.pinned.time.end, method: p.pinned.time.method, t: timePoint(p.pinned.time, p.pinned.timeIndex).t } : p.pinned.mode === 'family' ? { id: p.pinned.family.id, delta: p.pinned.family.delta, lambda: p.pinned.family.points[p.pinned.familyIndex].lambda, branch: p.pinned.branch } : { operations: p.pinned.operations, batch: p.pinned.batch } } : null })) } };
    downloadText(`${name}-setup.json`, JSON.stringify(setup, null, 2) + '\n', 'application/json');
  } else if (kind === 'export-data') {
    const data = system === 'box' ? boxExportData() : qubitData();
    data.metadata = { ...data.metadata, provenance };
    downloadText(`${name}-data.csv`, dataCsv(data), 'text/csv;charset=utf-8');
  } else {
    const svg = app.querySelector<SVGSVGElement>('.panel:not(.is-collapsed) .panel-body svg');
    if (!svg) return;
    const element = svg.closest<HTMLElement>('[data-panel]')!;
    const select = element.querySelector<HTMLSelectElement>('.tool-select');
    const title = `${system === 'box' ? words('1D хайрцаг', '1D box') : t('qubit')} · ${select?.selectedOptions[0]?.textContent ?? experimentLabel()}`;
    const caption = `${element.querySelector<HTMLElement>('.panel-binding')?.innerText?.replace(/\s+/g, ' ').trim() ?? ''} · ℏ = 1 · ${source?.revision?.slice(0, 12) ?? 'local'}`;
    const p = panels[mode].find(p => p.id === Number(element.dataset.panel));
    const bound = p?.pinned ?? binding();
    const metadata = system === 'box' ? boxFigureMetadata(element.dataset.panel!) : { ...qubitData(bound).metadata, state: bound.r, cursor: bound.mode === 'time' ? timePoint(bound.time, bound.timeIndex).t : bound.mode === 'family' ? bound.family.points[bound.familyIndex].lambda : null, branch: bound.branch, panel: p ? { tool: p.tool, basis: p.basis, gamma: p.gamma, pinned: !!p.pinned } : null };
    downloadText(`${name}-figure.svg`, figureSvg(svg, title, caption, { ...metadata, provenance }), 'image/svg+xml');
  }
}

app.addEventListener('click', event => {
  const target = (event.target as Element).closest<HTMLButtonElement>('button[data-action]');
  if (!target || target.disabled) return;
  const action = target.dataset.action, id = Number(target.dataset.id);
  if (action?.startsWith('export-')) { exportCurrent(action); return; }
  if (system === 'box' && action !== 'language') { captureBoxDetails(app); if (handleBoxClick(target)) render(false); return; }
  const p = panels[mode].find(x => x.id === id);
  const form = target.closest('form');
  if (form && !form.reportValidity()) return;
  try {
    if (action === 'language') { lang = target.dataset.lang as Language; try { localStorage.setItem('quantum-language', lang); } catch { /* Optional preference. */ } }
    else if (action === 'mode') { selectMode(target.dataset.mode as Mode); }
    else if (action === 'transfer-to-time') { const r = [...lab.current] as Vec3; const from = { experiment: 'state', operation: lab.operationCount, state: r }; selectMode('time'); adoptState(r, 'state-transfer', from); openSections.add('time-controls-section'); }
    else if (action === 'transfer-family-to-time') { const r = binding().r; if (!r) return; const h: Vec3 = [lab.family.delta, 0, lab.family.points[familyIndex].lambda]; const from = { experiment: 'family', resultId: lab.family.id, lambda: h[2], delta: h[0], branch, state: r, h }; selectMode('time'); adoptState(r, 'family-transfer', from); [draft.hx, draft.hy, draft.hz] = h; openSections.add('time-controls-section'); }
    else if (action === 'transfer-time-to-state') { const selected = timePoint(lab.time, timeIndex); const r = [...selected.r] as Vec3; const from = { experiment: 'time', resultId: lab.time.id, t: selected.t, initial: lab.time.initial, h: lab.time.h, method: lab.time.method, state: r }; selectMode('state'); adoptState(r, 'time-transfer', from); openSections.add('prepare-section'); }
    else if (action === 'prepare') { lab = prepareState(lab, draft.theta, draft.phi, draft.length); sessions[mode].origin = 'prepared'; sessions[mode].transfer = null; setNotice('prepared'); }
    else if (action === 'reprepare') { lab = reprepare(lab); setNotice('prepared'); }
    else if (action === 'rotate') { lab = rotateState(lab, draft.rotationAxis, draft.rotationAngle); setNotice('rotated'); }
    else if (action === 'measure') { lab = measureState(lab, draft.measurementAxis); showRecord(); setNotice('measurementEvent'); }
    else if (action === 'sample') { lab = runProtocol(lab, draft.protocol.split('') as Axis[], draft.trials); showRecord(); setNotice('generated'); }
    else if (action === 'seed') {
      if (!Number.isInteger(draft.seed) || draft.seed < 0 || draft.seed > 4294967295) throw new RangeError('seed');
      lab = { ...lab, seed: draft.seed }; setNotice('seedApplied');
    }
    else if (action === 'calculate-time') { lab = calculateTime(lab, [draft.hx, draft.hy, draft.hz], draft.end, draft.method); timeIndex = 0; setNotice('calculated'); }
    else if (action === 'calculate-family') { lab = calculateFamily(lab, draft.delta); setNotice('familyCalculated'); }
    else if (action === 'add-panel') { if (panels[mode].length < 4) panels[mode].push(panel(eligibleTools().find(type => !panels[mode].some(p => p.tool === type)) ?? 'bloch')); }
    else if (action === 'remove-panel' && p && panels[mode].length > 1) panels[mode] = panels[mode].filter(x => x !== p);
    else if (action === 'feature-panel' && p) panels[mode] = [p, ...panels[mode].filter(x => x !== p)];
    else if (action === 'collapse-panel' && p) p.collapsed = !p.collapsed;
    else if (action === 'pin-panel' && p) p.pinned = p.pinned ? null : binding();
    else if (action === 'previous') { setCoordinate((mode === 'time' ? timeIndex : familyIndex) - 1); return; }
    else if (action === 'next') { setCoordinate((mode === 'time' ? timeIndex : familyIndex) + 1); return; }
    else if (action === 'show-method') {
      codeFragment = mode === 'time' ? (lab.time.method === 'spectral' ? 'spectral' : 'rotate') : mode === 'family' ? 'spectrum' : 'probabilities';
      document.querySelector<HTMLDetailsElement>('#method-section')?.setAttribute('open', '');
      openSections.add('method-section');
    }
    else if (action === 'exercise') {
      const choice = target.dataset.preset;
      if (choice?.startsWith('time-')) {
        selectMode('time'); applyPreset(choice === 'time-stationary' ? 'plusZ' : 'plusX');
        lab = prepareState(lab, draft.theta, draft.phi, draft.length); sessions.time.origin = 'prepared'; sessions.time.transfer = null;
        Object.assign(draft, { hx: 0, hy: 0, hz: 0.5, end: 2 * Math.PI, method: 'spectral' });
        lab = calculateTime(lab, [0, 0, 0.5], 2 * Math.PI, 'spectral'); timeIndex = 0;
        openSections.add('time-controls-section'); render(); document.querySelector('#workspace')?.scrollIntoView({ block: 'start' }); return;
      }
      if (choice?.startsWith('family-')) {
        selectMode('family'); draft.delta = choice === 'family-crossing' ? 0 : 0.6;
        lab = calculateFamily(lab, draft.delta); familyIndex = 100; branch = 'lower'; render(); document.querySelector('#workspace')?.scrollIntoView({ block: 'start' }); return;
      }
      selectMode('state');
      applyPreset(choice === 'sequence' ? 'plusZ' : 'plusX');
      lab = prepareState(lab, draft.theta, draft.phi, draft.length); sessions.state.origin = 'prepared'; sessions.state.transfer = null;
      panels.state = choice === 'phase' ? [panel('bloch'), panel('amplitudes'), panel('probabilities')] : [panel('bloch'), panel('density'), panel('probabilities')];
      if (choice === 'phase' || choice === 'mixture') panels.state[2].basis = 'x';
      if (choice === 'sequence') { draft.protocol = 'zz'; openSections.add('sampling-section'); }
      setNotice('applyExercise');
    }
    render();
    if (action === 'show-method') document.querySelector('#method-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (action === 'exercise') { const d = document.querySelector<HTMLDetailsElement>('#prepare-section'); if (d) d.open = true; if (target.dataset.preset === 'sequence') { const s = document.querySelector<HTMLDetailsElement>('#sampling-section'); if (s) s.open = true; } document.querySelector('#workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  } catch { setNotice(action === 'seed' ? 'validSeed' : 'error', true); render(); }
});

app.addEventListener('input', event => {
  const input = event.target as HTMLInputElement;
  if (system === 'box') { handleBoxInput(input); refreshBoxInputs(app, input, input.id === 'box-time' || input.id === 'box-time-value'); return; }
  if (input.id === 'coordinate') { setCoordinate(Number(input.value)); return; }
  const key = input.dataset.draft as keyof typeof draft | undefined;
  if (key && input.type !== 'select-one') {
    (draft as unknown as Record<string, number | string>)[key] = input.value === '' ? NaN : Number(input.value);
    if (key === 'theta' || key === 'phi' || key === 'length') {
      draft.preset = 'custom';
      const preset = document.querySelector<HTMLSelectElement>('#preset'); if (preset) preset.value = 'custom';
      const output = document.querySelector(`[data-output="${key}"]`); if (output) output.textContent = input.value + (input.dataset.suffix ?? '');
    }
    const status = document.querySelector('#result-status'); if (status) status.outerHTML = resultStatus();
  }
});
app.addEventListener('change', event => {
  const input = event.target as HTMLInputElement | HTMLSelectElement;
  if (input.id === 'system-select') { selectSystem(input.value as System); render(); return; }
  if (input.id === 'experiment-select') { if (system === 'qubit') selectMode(input.value as Mode); else { captureBoxDetails(app); selectBoxExperiment(input.value as BoxMode); } render(); return; }
  if (system === 'box') {
    if (handleBoxChange(input)) {
      if (input.tagName === 'INPUT') refreshBoxInputs(app, input);
      else render();
    }
    return;
  }
  if (input.dataset.panelBasis) { const p = panels[mode].find(p => p.id === Number(input.dataset.panelBasis)); if (p) p.basis = input.value as Axis; render(); }
  else if (input.dataset.panelGamma) { const p = panels[mode].find(p => p.id === Number(input.dataset.panelGamma)); if (p) p.gamma = Number(input.value); render(); }
  else if (input.dataset.panelTool) { const p = panels[mode].find(p => p.id === Number(input.dataset.panelTool)); if (p) p.tool = input.value as Tool; render(); }
  else if (input.dataset.view === 'branch') { branch = input.value as 'lower' | 'upper'; render(); }
  else if (input.dataset.view === 'codeFragment') { codeFragment = input.value; render(); }
  else if (input.dataset.draft && input.tagName === 'SELECT') {
    const key = input.dataset.draft;
    (draft as unknown as Record<string, number | string>)[key] = input.value;
    if (key === 'preset') applyPreset(input.value);
    render();
  }
});
app.addEventListener('click', event => {
  if (system !== 'qubit') return;
  const chart = (event.target as Element).closest<SVGSVGElement>('svg[data-chart="line"]');
  if (!chart) return;
  const wrapper = chart.closest<HTMLElement>('[data-select-coordinate]');
  const parent = chart.closest<HTMLElement>('[data-panel]');
  if (!wrapper || wrapper.dataset.selectCoordinate !== mode || panels[mode].find(p => p.id === Number(parent?.dataset.panel))?.pinned) return;
  const point = chart.createSVGPoint(); point.x = (event as MouseEvent).clientX; point.y = (event as MouseEvent).clientY;
  const matrix = chart.getScreenCTM(); if (!matrix) return;
  const local = point.matrixTransform(matrix.inverse());
  setCoordinate((local.x - 64) / 532 * 200);
});
app.addEventListener('submit', event => event.preventDefault());

// Read-only inspection supports reproducibility and presentation-invariance checks.
Object.defineProperty(window, '__quantumLab', { value: () => { saveSession(); return JSON.parse(JSON.stringify({ lab, mode, system, timeIndex, familyIndex, branch, lang, panels, draft, sessions, box: boxSnapshot() })); }, writable: false });
render();
fetch('./source.json').then(response => { if (!response.ok) throw new Error('Source metadata'); return response.json(); }).then((data: SourceInfo) => { source = data; render(); }).catch(() => { source = null; });
