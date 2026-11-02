import { nextRandom,              } from './quantum.js';
import { boxPreset, normalizeBox, boxEnergy, boxWavefunction, boxEvolve, boxMoments, measureBoxEnergy, boxTimeRun, MAX_BOX_MODES, MAX_BOX_TIME_SAMPLES,                                                                          } from './box.js';
import { lineChart,             } from './plots.js';
import { boxLessonContent,                        } from './box-lessons.js';

                                       
                            
                                                                                                
                                                                                                                          
                                                                                                                                                                   
                                                                                                                                                                                                                             
                                                                                                                                                                                                                          
                                                                                                                                                                                                                           
                                                                                                                                                                                                                                                              
                                                                  

const clone =    (value   )    => JSON.parse(JSON.stringify(value))     ;
const copy = (c                    )            => c.map(z => ({ ...z }));
const unit = { length: 1, mass: 1 };
const starting = boxPreset('pair', 8, unit);
let mode          = 'state';
let language           = 'mn';
let nextPanel = 1, nextResult = 2;
let notice                                                    = null;
const state = {
  current: copy(starting.coeffs), params: { ...unit }, revision: 1,
  retainedWeight: null                 , preset: 'pair'                            ,
  prepared: { coeffs: copy(starting.coeffs), params: { ...unit }, retainedWeight: null, preset: 'pair', revision: 1, source: 'preset' }               ,
  seed: 123456789, eventCount: 0, events: []                 , batch: null                      ,
};
const time = {
  input: { coeffs: copy(starting.coeffs), params: { ...unit }, retainedWeight: null, preset: 'pair', revision: 1, source: 'preset' }               ,
  run: boxTimeRun(starting.coeffs, unit, 1, 1), runInputRevision: 1, cursor: 0, cursorDraft: '0', endDraft: '1',
};
function makeDraft(prepared             )        {
  return { length: String(prepared.params.length), mass: String(prepared.params.mass), modes: String(prepared.coeffs.length),
    preset: prepared.preset === 'custom' ? 'pair' : prepared.preset,
    coeffs: Array.from({ length: MAX_BOX_MODES }, (_, i) => ({ re: String(prepared.coeffs[i]?.re ?? 0), im: String(prepared.coeffs[i]?.im ?? 0) })) };
}
const drafts                         = { state: makeDraft(state.prepared), time: makeDraft(time.input) };
let trialDraft = '200', seedDraft = String(state.seed);
const newPanel = (tool      )        => ({ id: nextPanel++, tool, collapsed: false, pinned: null, wave: 'both', coefficientView: 'probabilities', momentView: 'meanX', yMax: tool === 'wavefunction' ? 3 : 8 });
const panels                           = { state: [newPanel('density'), newPanel('coefficients'), newPanel('moments')], time: [newPanel('trajectory'), newPanel('density'), newPanel('coefficients')] };
const dataKinds                            = { state: 'coefficients', time: 'history' };
const fragments                          = { state: 'box-wavefunction', time: 'box-evolution' };
const narrow = typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches;
const opened                               = {
  state: new Set(narrow ? [] : ['box-preparation-section', 'box-math-section']),
  time: new Set(narrow ? [] : ['box-time-controls', 'box-math-section']),
};

const L = (mn        , en        )         => language === 'mn' ? mn : en;
const esc = (value         )         => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ));
const fmt = (value        , digits = 4)         => (Math.abs(value) < 0.5 * 10 ** -digits ? 0 : value).toFixed(digits);
const complexText = (c         )         => `${fmt(c.re)} ${c.im < 0 ? '−' : '+'} ${fmt(Math.abs(c.im))}i`;
const option = (value        , title        , selected        , disabled = false)         => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}>${esc(title)}</option>`;
const button = (action        , label        , cls = '', extra = '', id = action)         => `<button type="button" id="${id}" data-action="${action}" class="${cls}" ${extra}>${label}</button>`;
const details = (id        , title        , body        , cls        )         => `<details id="${id}" class="${cls}" ${opened[mode].has(id) ? 'open' : ''}><summary>${title}<span class="chevron" aria-hidden="true">⌄</span></summary>${body}</details>`;
const number = (id        , label        , value        , min        , max        , step                 , field        )         => `<label class="number-field" for="${id}"><span>${label}</span><input type="number" id="${id}" data-box-draft="${field}" value="${esc(value)}" min="${min}" max="${max}" step="${step}" required></label>`;
const stat = (label        , value        )         => `<div><dt>${label}</dt><dd>${value}</dd></div>`;
const toolName = (tool      )         => ({ density: L('Магадлалын нягт', 'Probability density'), wavefunction: L('Долгион функц', 'Wavefunction'), coefficients: L('Коэффициент ба энерги', 'Coefficients and energy'), moments: L('Дундаж хэмжигдэхүүнүүд', 'Moments'), trajectory: L('Хугацааны хамаарал', 'Time history'), outcomes: L('Энергийн хэмжилтүүд', 'Energy measurements') }[tool]);
const presetName = (kind               )         => ({ ground: L('Үндсэн төлөв', 'Ground state'), pair: L('Хоёр модын суперпозици', 'Two-mode superposition'), phase: L('Харьцангуй фаз π/2', 'Relative phase π/2'), localized: L('Зүүн талд локалчлах', 'Localize on the left') }[kind]);
const available = (which         )         => which === 'time' ? ['trajectory', 'density', 'wavefunction', 'coefficients', 'moments'] : ['density', 'wavefunction', 'coefficients', 'moments', 'outcomes'];

function numeric(raw        , min        , max        , integer = false)         {
  const value = raw.trim() === '' ? NaN : Number(raw);
  if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw new RangeError('Invalid box input');
  return value;
}
function parsedDraft(which = mode)                                                              {
  const d = drafts[which];
  const params = { length: numeric(d.length, 0.2, 5), mass: numeric(d.mass, 0.1, 5) };
  const count = numeric(d.modes, 1, MAX_BOX_MODES, true);
  const coeffs = d.coeffs.slice(0, count).map(c => ({ re: numeric(c.re, -1e100, 1e100), im: numeric(c.im, -1e100, 1e100) }));
  return { params, count, coeffs };
}
function draftChanged(which         )          {
  const applied = which === 'state' ? { coeffs: state.current, params: state.params } : time.input;
  try {
    const d = parsedDraft(which);
    return d.count !== applied.coeffs.length || d.params.length !== applied.params.length || d.params.mass !== applied.params.mass || d.coeffs.some((c, i) => Math.abs(c.re - (applied.coeffs[i]?.re ?? 0)) > 1e-12 || Math.abs(c.im - (applied.coeffs[i]?.im ?? 0)) > 1e-12);
  } catch { return true; }
}
function setNotice(mn        , en        , error = false)       { notice = { mn, en, error }; }
function errorNotice(error         )       {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('maximum is')) setNotice('Энэ интервалд 16385-аас олон хугацааны дээж хэрэгтэй. Интервалыг богиносгох эсвэл оролцох модыг цөөлнө үү. Өмнөх үр дүн хэвээр.', 'This interval needs more than 16,385 time samples. Shorten it or reduce occupied modes. The previous result is retained.', true);
  else if (message.includes('two-mode')) setNotice('Энэ бэлтгэлд дор хаяж хоёр мод хэрэгтэй.', 'This preparation needs at least two modes.', true);
  else if (message.includes('zero coefficient')) setNotice('Бүх коэффициент тэг байж болохгүй.', 'At least one coefficient must be nonzero.', true);
  else setNotice('Утгуудыг шалгана уу: L = 0.2–5, m = 0.1–5, N = 1–16; тоонууд төгсгөлөг байна. Өмнөх төлөв ба үр дүн хэвээр.', 'Check the values: L = 0.2–5, m = 0.1–5, N = 1–16, with finite numbers. The previous state and results are retained.', true);
}
function currentPreparation()              {
  return { coeffs: copy(state.current), params: { ...state.params }, retainedWeight: state.retainedWeight, preset: state.preset, revision: state.revision, source: 'current-state' };
}
function applyPreparation(which         , coeffs           , params               , retainedWeight               , preset                          , source = 'preset')       {
  if (which === 'state') {
    state.current = copy(coeffs); state.params = { ...params }; state.revision++;
    state.retainedWeight = retainedWeight; state.preset = preset;
    state.prepared = { coeffs: copy(coeffs), params: { ...params }, retainedWeight, preset, revision: state.revision, source };
    drafts.state = makeDraft(state.prepared);
  } else {
    time.input = { coeffs: copy(coeffs), params: { ...params }, retainedWeight, preset, revision: time.input.revision + 1, source };
    drafts.time = makeDraft(time.input);
  }
}
function binding(which = mode)          {
  if (which === 'state') return { mode: which, coeffs: copy(state.current), params: { ...state.params }, revision: state.revision, time: null, run: null, retainedWeight: state.retainedWeight, batch: state.batch, events: [...state.events] };
  return { mode: which, coeffs: boxEvolve(time.run.initial, time.cursor, time.run.params), params: { ...time.run.params }, revision: time.run.id, time: time.cursor, run: time.run, retainedWeight: null, batch: null, events: [] };
}
function bindingLabel(b         , tool       )         {
  if (tool === 'outcomes' && b.batch) return `${L('Багц', 'Batch')} #${b.batch.id} · ${L('Оролтын төлөв', 'Input state')} #${b.batch.inputRevision} · N=${b.batch.initial.length}, L=${fmt(b.batch.params.length, 2)}, m=${fmt(b.batch.params.mass, 2)} · ${L('Борны дүрэм', 'Born rule')}`;
  const source = b.mode === 'state' ? `${L('Одоогийн төлөв', 'Current state')} #${b.revision}` : `${L('Үр дүн', 'Run')} #${b.run .id} · t=${fmt(b.time , 6)}`;
  return `${source} · N=${b.coeffs.length} · L=${fmt(b.params.length, 2)}, m=${fmt(b.params.mass, 2)} · ${L('спектрийн задаргаа', 'spectral expansion')}`;
}

function coefficientRows(d       , count        )         {
  return d.coeffs.slice(0, count).map((c, i) => `<tr><th scope="row">${i + 1}</th><td><input id="box-c-${i + 1}-re" aria-label="Re c${i + 1}" type="number" step="any" value="${esc(c.re)}" data-box-coefficient="${i}" data-box-part="re" required></td><td><input id="box-c-${i + 1}-im" aria-label="Im c${i + 1}" type="number" step="any" value="${esc(c.im)}" data-box-coefficient="${i}" data-box-part="im" required></td></tr>`).join('');
}
function preparationDirtyText()         {
  return draftChanged(mode) ? L('Хэрэглээгүй засвар байна.', 'Unapplied edits are present.') : L('Коэффициент ба параметрүүд хэрэглэсэн утгатай тохирч байна.', 'Coefficients and parameters match the applied input.');
}
function preparationControls()         {
  const d = drafts[mode];
  const count = Math.max(1, Math.min(MAX_BOX_MODES, Number.isFinite(Number(d.modes)) ? Math.trunc(Number(d.modes)) : 8));
  const title = mode === 'state' ? L('Төлөв бэлтгэх', 'Prepare a state') : L('Хувьслын эх төлөв', 'Evolution input');
  return details('box-preparation-section', `<span class="section-number">01</span>${title}`, `<form id="box-preset-form"><div class="input-row">${number('box-length', 'L', d.length, 0.2, 5, 'any', 'length')}${number('box-mass', 'm', d.mass, 0.1, 5, 'any', 'mass')}</div>${number('box-modes', L('Модын тоо N', 'Number of modes N'), d.modes, 1, MAX_BOX_MODES, 1, 'modes')}<label class="field-label" for="box-preset">${L('Бэлтгэлийн жишээ', 'Preparation preset')}</label><select id="box-preset" data-box-preset>${(['ground', 'pair', 'phase', 'localized']         ).map(k => option(k, presetName(k), d.preset)).join('')}</select><p class="help">${L('Сонголт ба засвар нь төлөвийг шууд өөрчлөхгүй. Бэлтгэх товчийг дарна.', 'Selections and edits are drafts. Apply a preparation explicitly.')}</p>${button('box-prepare-preset', L('Сонгосон жишээг бэлтгэх', 'Prepare selected preset'), 'primary full')}</form><div class="rule"></div><form id="box-coefficients-form"><label class="field-label">${L('Комплекс коэффициентууд', 'Complex coefficients')}</label><div class="coefficient-editor table-scroll"><table class="coefficient-table results-table"><thead><tr><th>n</th><th>Re cₙ</th><th>Im cₙ</th></tr></thead><tbody>${coefficientRows(d, count)}</tbody></table></div><p class="help">${L('Гараар зассан коэффициентуудаар шинэ төлөв байгуулна. Нормчлолыг энэ товч илээр хийнэ.', 'Edited coefficients define a new preparation. Normalization is performed explicitly by this button.')}</p>${button('box-prepare-coefficients', L('Нормчилж бэлтгэх', 'Normalize and prepare'), 'secondary full')}</form>${mode === 'state' ? button('box-reprepare', L('Сүүлд бэлтгэсэн төлөвт буцах', 'Reprepare the last preparation'), 'text-button full') : ''}<p class="help" data-testid="box-draft-status">${preparationDirtyText()}</p>`, 'control-section');
}
function stateControls()         {
  return `${preparationControls()}${details('box-energy-controls', `<span class="section-number">02</span>${L('Энергийн хэмжилт', 'Energy measurement')}`, `<p class="help">${L('Нэг хэмжилт одоогийн төлөвийг сонгогдсон энергийн өөрийн төлөвт шилжүүлнэ.', 'One measurement updates the current state to the selected energy eigenstate.')}</p>${button('box-measure', L('Нэг удаа хэмжих', 'Measure once'), 'primary full')}<div class="rule"></div><form id="box-batch-form">${number('box-trials', L('Ижил бэлтгэлтэй хуулбарын тоо', 'Independently prepared copies'), trialDraft, 1, 2000, 1, 'trials')}${button('box-sample', L('Багц хэмжилт хийх', 'Sample independent copies'), 'secondary full')}<p class="help">${L('Хуулбар бүр багцын эх төлөвөөс эхэлнэ. Одоогийн төлөв өөрчлөгдөхгүй.', 'Every copy starts from this batch’s input state. The current state is unchanged.')}</p></form><form id="box-seed-form">${number('box-seed', L('Санамсаргүй тооны эх утга', 'Random seed'), seedDraft, 0, 4294967295, 1, 'seed')}${button('box-reset-seed', L('Эх утгыг хэрэглэх', 'Apply seed'), 'text-button full')}<p class="help">${L('Дараагийн генераторын төлөв', 'Next generator state')}: <code data-testid="box-rng">${state.seed}</code></p></form>`, 'control-section')}${details('box-transfer-section', `<span class="section-number">03</span>${L('Хугацааны хувьсал', 'Time evolution')}`, `${button('box-use-state', L('Энэ төлөвийг хувьслын оролт болгох', 'Use this state in evolution'), 'secondary full')}<p class="help">${L('Хувьслын оролтыг илээр хуулна. Хадгалсан хугацааны үр дүнг зөвхөн Тооцоолох үйлдэл шинэчилнэ.', 'Copies this state into a separate evolution input. Only Calculate replaces the retained time result.')}</p>`, 'control-section')}`;
}
function timeControls()         {
  return `${details('box-time-controls', `<span class="section-number">01</span>${L('Спектрийн хувьсал', 'Spectral evolution')}`, `<p class="formula control-formula">cₙ(t) = cₙ(0)e<sup>−iEₙt</sup></p><form id="box-time-form">${number('box-end', L('Төгсгөлийн хугацаа', 'End time'), time.endDraft, 0.0001, 100, 'any', 'end')}<div class="input-state"><span>${L('Хэрэглэсэн оролт', 'Applied input')} #${time.input.revision}</span><code>N=${time.input.coeffs.length}, L=${fmt(time.input.params.length, 2)}, m=${fmt(time.input.params.mass, 2)}</code></div>${button('box-calculate', L('Тооцоолох', 'Calculate'), 'primary full')}<p class="help">${L('Хамгийн хурдан харьцангуй фазын нэг үеүдэд дор хаяж 32 дээж. Дээд хязгаар: 16385 дээж.', 'At least 32 samples per fastest relative-phase period. Limit: 16,385 samples.')}</p></form>${button('box-copy-current', L('Байгуулалтын одоогийн төлөвийг хуулах', 'Copy the current construction state'), 'secondary full')}<p class="help">${L('Шинэ оролт хэрэглэхэд өмнөх үр дүн ба түүний сонгосон хугацаа хадгалагдана.', 'Changing the input retains the previous result and its selected time.')}</p>`, 'control-section')}${preparationControls()}`;
}

function coordinateControls()         {
  if (mode === 'state') {
    const m = boxMoments(state.current, state.params);
    return `<div class="state-summary"><span class="status-dot"></span><span data-testid="box-live-state">${L('Одоогийн төлөв', 'Current state')} #${state.revision} · N=${state.current.length}</span><code>Σ|cₙ|²=${fmt(m.norm, 6)}</code>${state.retainedWeight !== null ? `<span class="purity-chip">η<sub>N</sub>=${fmt(state.retainedWeight, 7)}</span>` : ''}</div>`;
  }
  const stale = time.input.revision !== time.runInputRevision || Number(time.endDraft) !== time.run.end;
  return `<div class="state-summary"><span class="status-dot"></span><span data-testid="box-result-source">${L('Хадгалсан үр дүн', 'Retained run')} #${time.run.id} · ${L('Оролт', 'Input')} #${time.runInputRevision} · L=${fmt(time.run.params.length, 2)}, m=${fmt(time.run.params.mass, 2)}, N=${time.run.initial.length}</span><span>${time.run.sampleCount} ${L('дээж', 'samples')}</span></div>${stale ? `<p class="notice" data-testid="box-result-pending">${L('Оролт эсвэл интервал өөрчлөгдсөн. Тооцоолох хүртэл дээрх үр дүнг харуулна.', 'The input or interval has changed. The run above remains displayed until Calculate.')}</p>` : ''}<div class="coordinate-strip"><label for="box-time">${L('Харах физик хугацаа', 'Inspect physical time')}<output id="box-time-output">t=${fmt(time.cursor, 6)}</output></label><div class="coordinate-row">${button('box-previous', '−', 'square', `aria-label="${L('Өмнөх хугацаа', 'Previous time')}"`)}<input id="box-time" type="range" min="0" max="${time.run.end}" step="any" value="${time.cursor}" aria-label="${L('Физик хугацаа', 'Physical time')}">${button('box-next', '+', 'square', `aria-label="${L('Дараах хугацаа', 'Next time')}"`)}</div><span class="coordinate-endpoints"><span>0</span><span>${fmt(time.run.end, 4)}</span></span><label class="number-field" for="box-time-value"><span>${L('t-ийн нарийн утга', 'Exact t value')}</span><input id="box-time-value" type="number" min="0" max="${time.run.end}" step="any" value="${esc(time.cursorDraft)}"></label><p class="help">${L('Долгион функцийг сонгосон t дээр шууд тооцно; хадгалсан муруйн цэгүүдийн хооронд төлөв интерполяцлахгүй.', 'The wavefunction is evaluated directly at the selected t; states are not interpolated between stored curve samples.')}</p></div>`;
}

function spatialData(b         )                                                                      {
  const intervals = Math.max(256, 32 * b.coeffs.length);
  return Array.from({ length: intervals + 1 }, (_, i) => {
    const y = i / intervals, x = y * b.params.length, value = boxWavefunction(b.coeffs, x, b.params);
    return { y, x, re: value.re, im: value.im, density: value.re ** 2 + value.im ** 2 };
  });
}
function wavePanel(p       , b         )         {
  const samples = spatialData(b), length = b.params.length;
  const density = p.tool === 'density';
  const series           = density ? [{ label: 'L |ψ|²', color: '#138a80', data: samples.map(q => [q.y, length * q.density]         ) }] : [
    ...(p.wave !== 'imaginary' ? [{ label: '√L Re ψ', color: '#138a80', data: samples.map(q => [q.y, Math.sqrt(length) * q.re]         ) }] : []),
    ...(p.wave !== 'real' ? [{ label: '√L Im ψ', color: '#bc7a29', data: samples.map(q => [q.y, Math.sqrt(length) * q.im]         ) }] : []),
  ];
  const clipped = series.some(s => s.data.some(([, v]) => Math.abs(v) > p.yMax * (1 + 1e-12)));
  return `${!density ? `<label class="panel-basis" for="box-wave-${p.id}">${L('Харагдах хэсэг', 'Components')}<select id="box-wave-${p.id}" data-box-wave="${p.id}">${option('both', 'Re, Im', p.wave)}${option('real', 'Re', p.wave)}${option('imaginary', 'Im', p.wave)}</select></label>` : ''}${lineChart(series, { id: `box-spatial-${p.id}`, xLabel: 'x/L', yLabel: density ? 'L |ψ|²' : '√L ψ', xRange: [0, 1], yRange: density ? [0, p.yMax] : [-p.yMax, p.yMax], ariaLabel: toolName(p.tool) })}<div class="chart-foot"><span>${L('Хугацаа сонгоход босоо масштаб тогтмол.', 'Vertical scale stays fixed when selecting time.')}</span>${button('box-fit-panel', L('Масштабыг тааруулах', 'Fit vertical range'), 'text-button', `data-box-id="${p.id}"`, `box-fit-${p.id}`)}</div>${clipped ? `<p class="notice">${L('Муруйн хэсэг масштабаас гарсан байна. Масштабыг тааруулж харна уу.', 'Part of the curve is outside the current range. Fit the vertical range to inspect it.')}</p>` : ''}<p class="panel-caption">${density ? L('y=x/L үед L|ψ|²-ийг y-ээр интегралчлахад 1 гарна. Нягтыг харах нь байрлал хэмжих үйлдэл биш.', 'With y=x/L, integrating L|ψ|² over y gives 1. Inspecting density does not perform a position measurement.') : L('Re ба Im нь бодит орон зайн долгион функцийн хэсгүүд; √L үржигдэхүүн масштабыг хэмжээсгүй болгоно.', 'Re and Im are components of the spatial wavefunction; the √L factor makes this plotted scale dimensionless.')}</p>`;
}
function bars(series                                                      , min        , max        , id        , title        )         {
  const left = 54, top = 42, w = 540, h = 204, count = series[0].values.length;
  const Y = (value        ) => top + h * (max - value) / (max - min);
  const group = w / count, width = Math.min(35, group * 0.72 / series.length);
  return `<svg xmlns="http://www.w3.org/2000/svg" id="${esc(id)}" class="scientific-chart" data-chart="bars" style="display:block;width:100%;height:auto" width="620" height="300" viewBox="0 0 620 300" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><rect x="${left}" y="${top}" width="${w}" height="${h}" fill="#fcfdf9"/><g fill="#61766b" font-size="12" font-family="Georgia,serif">${[0, 0.25, 0.5, 0.75, 1].map(f => { const v = min + f * (max - min); return `<line x1="${left}" y1="${Y(v)}" x2="${left + w}" y2="${Y(v)}" stroke="#e5ebe1"/><text class="chart-tick" x="${left - 8}" y="${Y(v) + 4}" text-anchor="end">${fmt(v, max > 10 ? 0 : 2)}</text>`; }).join('')}${series.map((s, si) => `<text class="box-legend" x="${left + si * 235}" y="21" fill="${s.color}">${esc(s.label)}</text>${s.values.map((v, i) => `<rect x="${left + group * (i + 0.5) + (si - series.length / 2) * width}" y="${Math.min(Y(v), Y(0))}" width="${width * 0.92}" height="${Math.max(0, Math.abs(Y(v) - Y(0)))}" fill="${s.color}"><title>n=${i + 1}, ${esc(s.label)}=${v}</title></rect>`).join('')}`).join('')}${Array.from({ length: count }, (_, i) => `<text class="chart-tick" x="${left + group * (i + 0.5)}" y="268" text-anchor="middle">${i + 1}</text>`).join('')}<text class="chart-axis-label" x="${left + w / 2}" y="291" text-anchor="middle">n</text></g></svg>`;
}
function coefficientPanel(p       , b         )         {
  const probabilities = b.coeffs.map(c => c.re ** 2 + c.im ** 2), energies = b.coeffs.map((_, j) => boxEnergy(j + 1, b.params));
  const selected = p.coefficientView;
  const series = selected === 'coefficients' ? [{ label: 'Re cₙ', color: '#138a80', values: b.coeffs.map(c => c.re) }, { label: 'Im cₙ', color: '#bc7a29', values: b.coeffs.map(c => c.im) }] : [{ label: selected === 'energies' ? 'Eₙ' : '|cₙ|²', color: '#138a80', values: selected === 'energies' ? energies : probabilities }];
  const table = `<div class="table-scroll"><table class="results-table"><thead><tr><th>n</th><th>cₙ</th><th>|cₙ|²</th><th>Eₙ</th></tr></thead><tbody>${b.coeffs.map((c, i) => `<tr><td>${i + 1}</td><td><code>${complexText(c)}</code></td><td>${fmt(probabilities[i], 6)}</td><td>${fmt(energies[i], 5)}</td></tr>`).join('')}</tbody></table></div>`;
  return `<label class="field-label" for="box-coefficient-view-${p.id}">${L('Хэмжигдэхүүн', 'Quantity')}</label><select id="box-coefficient-view-${p.id}" data-box-coefficient-view="${p.id}">${option('probabilities', L('Энергийн магадлалууд', 'Energy probabilities'), selected)}${option('coefficients', L('Комплекс коэффициентууд', 'Complex coefficients'), selected)}${option('energies', L('Энергийн түвшнүүд', 'Energy levels'), selected)}</select>${bars(series, selected === 'coefficients' ? -1 : 0, selected === 'energies' ? energies.at(-1)  * 1.05 : 1, `box-bars-${p.id}`, toolName('coefficients'))}${details(`box-table-${p.id}`, L('Тоон утгууд', 'Numerical values'), table, 'hint')}<p class="panel-caption">${L('Баганын n нь салангид энергийн төлөвийн дугаар. Үргэлжилсэн орон зайн координат биш.', 'The index n labels discrete energy states; it is not a continuous spatial coordinate.')}</p>`;
}
function momentsPanel(b         )         {
  const m = boxMoments(b.coeffs, b.params);
  return `<dl class="stats">${stat('∫|ψ|² dx', fmt(m.norm, 8))}${stat('⟨x⟩', fmt(m.meanX, 6))}${stat('⟨x²⟩', fmt(m.meanX2, 6))}${stat('Var(x)', fmt(m.varianceX, 6))}${stat('Δx', fmt(Math.sqrt(m.varianceX), 6))}${stat('⟨H⟩', fmt(m.meanEnergy, 6))}${stat('P(0≤x≤L/2)', fmt(m.leftProbability, 7))}${b.retainedWeight !== null ? stat('ηₙ', fmt(b.retainedWeight, 8)) : ''}</dl><p class="panel-caption">${L('Дундаж утгуудыг синусын суурийн аналитик матрицын элементүүдээр тооцсон. Байрлалын утгууд нь дээрх L-ийн нэгжтэй.', 'Moments use analytic sine-basis matrix elements. Position quantities use the physical length convention shown above.')}</p>`;
}
function trajectoryPanel(p       , b         )         {
  if (!b.run) return `<p>${L('Энэ самбарт хугацааны үр дүн хэрэгтэй.', 'This panel requires a time result.')}</p>`;
  const run = b.run, length = run.params.length;
  const value = (m            )         => p.momentView === 'meanX' ? m.meanX / length : p.momentView === 'varianceX' ? m.varianceX / length ** 2 : m.leftProbability;
  const label = p.momentView === 'meanX' ? '⟨x⟩/L' : p.momentView === 'varianceX' ? 'Var(x)/L²' : 'P(x≤L/2)';
  const original = run.points[0].moments;
  let energyDrift = 0, normDrift = 0;
  for (const point of run.points) { energyDrift = Math.max(energyDrift, Math.abs(point.moments.meanEnergy - original.meanEnergy)); normDrift = Math.max(normDrift, Math.abs(point.moments.norm - original.norm)); }
  return `<label class="field-label" for="box-moment-view-${p.id}">${L('Хэмжигдэхүүн', 'Quantity')}</label><select id="box-moment-view-${p.id}" data-box-moment-view="${p.id}">${option('meanX', '⟨x⟩/L', p.momentView)}${option('varianceX', 'Var(x)/L²', p.momentView)}${option('leftProbability', 'P(x≤L/2)', p.momentView)}</select>${lineChart([{ label, color: '#138a80', data: run.points.map(point => [point.t, value(point.moments)]         ) }], { id: `box-time-plot-${p.id}`, xLabel: L('Физик хугацаа t', 'Physical time t'), yLabel: label, xRange: [0, run.end], yRange: [0, p.momentView === 'varianceX' ? 0.25 : 1], cursor: b.time ?? 0, ariaLabel: toolName('trajectory') })}<div class="chart-foot"><span>${run.sampleCount} ${L('дээж', 'samples')} · Δφ≤${fmt(run.phaseGap, 4)}</span><span>Δ‖ψ‖²≤${normDrift.toExponential(1)} · Δ⟨H⟩≤${energyDrift.toExponential(1)}</span></div><p class="panel-caption">${L('Муруй нь хадгалсан үр дүн. t сонгох нь эх төлөв эсвэл санамсаргүй тоог өөрчлөхгүй.', 'The curve is a retained result. Selecting t changes neither the input state nor randomness.')}</p>`;
}
function outcomesPanel(b         )         {
  const batch = b.batch;
  const body = batch ? `<div class="record-heading"><span class="pill">${L('Багц', 'Batch')} #${batch.id}</span><strong>N=${batch.trials}</strong></div><p class="record-input">${L('Эх утга', 'Seed')}: ${batch.seedBefore} → ${batch.seedAfter}<br>${L('Оролтын төлөв', 'Input state')} #${batch.inputRevision}</p>${bars([{ label: L('Таамагласан pₙ', 'Predicted pₙ'), color: '#138a80', values: batch.probabilities }, { label: L('Ажигласан давтамж', 'Observed frequency'), color: '#bc7a29', values: batch.counts.map(n => n / batch.trials) }], 0, 1, 'box-batch', toolName('outcomes'))}<div class="table-scroll"><table class="results-table"><thead><tr><th>n</th><th>pₙ</th><th>${L('Тоо', 'Count')}</th><th>${L('Давтамж', 'Frequency')}</th></tr></thead><tbody>${batch.counts.map((count, i) => `<tr><td>${i + 1}</td><td>${fmt(batch.probabilities[i], 5)}</td><td>${count}</td><td>${fmt(count / batch.trials, 5)}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty-state"><span class="math-symbol">Eₙ</span><p>${L('Багц хэмжилт хараахан хийгээгүй.', 'No independent-copy batch has been generated.')}</p></div>`;
  return `${body}<p class="panel-caption">${L('Багц нь өөрийн эх төлөв ба параметрүүдийг хадгалдаг. Дараагийн бэлтгэл хуучин тооллогыг дахин тайлбарлахгүй.', 'Each batch retains its own input state and parameters. Later preparations do not reinterpret its counts.')}</p>${b.events.length ? `<div class="event-log"><h4>${L('Сүүлийн 12 тусдаа хэмжилт', 'Last 12 individual measurements')}</h4><ol>${b.events.map(e => `<li><span class="event-index">${e.index}</span><span>n=${e.n} · E=${fmt(e.energy, 4)}</span><strong>p=${fmt(e.probability, 4)}</strong><small>${L('Оролт', 'Input')} #${e.inputRevision}</small></li>`).join('')}</ol></div>` : ''}`;
}
function panelBody(p       , b         )         {
  if (p.tool === 'density' || p.tool === 'wavefunction') return wavePanel(p, b);
  if (p.tool === 'coefficients') return coefficientPanel(p, b);
  if (p.tool === 'moments') return momentsPanel(b);
  if (p.tool === 'trajectory') return trajectoryPanel(p, b);
  return outcomesPanel(b);
}
function panelHtml(p       , index        )         {
  const b = p.pinned ?? binding();
  return `<article id="box-panel-${p.id}" class="panel ${index === 0 ? 'featured' : ''} ${p.collapsed ? 'is-collapsed' : ''}" data-panel="box-${p.id}" data-tool="${p.tool}"><header class="panel-header"><div class="panel-heading"><span class="panel-number">${String(index + 1).padStart(2, '0')}</span><label class="sr-only" for="box-tool-${p.id}">${L('Самбарын төрөл', 'Panel type')}</label><select id="box-tool-${p.id}" class="tool-select" data-box-tool="${p.id}">${available(mode).map(tool => option(tool, toolName(tool), p.tool)).join('')}</select></div><div class="panel-actions">${button('box-pin-panel', p.pinned ? '●' : '○', `icon-button ${p.pinned ? 'active' : ''}`, `data-box-id="${p.id}" aria-label="${L(p.pinned ? 'Бэхлэлтийг суллах' : 'Үр дүнг бэхлэх', p.pinned ? 'Unpin result' : 'Pin result')}" title="${L(p.pinned ? 'Суллах' : 'Бэхлэх', p.pinned ? 'Unpin' : 'Pin')}" aria-pressed="${!!p.pinned}"`, `box-pin-${p.id}`)}${index > 0 ? button('box-feature-panel', '↖', 'icon-button', `data-box-id="${p.id}" aria-label="${L('Гол самбар болгох', 'Feature panel')}"`, `box-feature-${p.id}`) : ''}${button('box-collapse-panel', p.collapsed ? '+' : '−', 'icon-button', `data-box-id="${p.id}" aria-label="${L(p.collapsed ? 'Дэлгэх' : 'Хураах', p.collapsed ? 'Expand panel' : 'Collapse panel')}" aria-expanded="${!p.collapsed}"`, `box-collapse-${p.id}`)}${button('box-remove-panel', '×', 'icon-button', `data-box-id="${p.id}" aria-label="${L('Самбарыг хасах', 'Remove panel')}" ${panels[mode].length === 1 ? 'disabled' : ''}`, `box-remove-${p.id}`)}</div></header><div class="panel-binding">${p.pinned ? `<span class="pin-label">${L('Бэхэлсэн', 'Pinned')}</span> ` : ''}${bindingLabel(b, p.tool)}</div><div class="panel-body" ${p.collapsed ? 'hidden' : ''}>${p.collapsed ? '' : panelBody(p, b)}</div></article>`;
}

function learning(code                                       )         {
  const c = boxLessonContent(language, mode);
  const titles                         = { 'box-wavefunction': L('Долгион функц байгуулах', 'Reconstruct the wavefunction'), 'box-evolution': L('Спектрийн фазын хувьсал', 'Spectral phase evolution'), 'box-energy-measurement': L('Энергийн хэмжилт', 'Energy measurement') };
  const fragment = fragments[mode];
  const source = `<div id="method-code"><h4>${L('Ажиллаж буй кодын хэсэг', 'Actual source excerpt')}</h4><label class="field-label" for="box-code-fragment">${L('Тооцооны алхам', 'Computational step')}</label><select id="box-code-fragment" data-box-code>${Object.entries(titles).map(([id, title]) => option(id, title, fragment)).join('')}</select>${code(fragment, titles[fragment])}</div>`;
  return `<section class="learning" id="box-learning"><div class="section-title"><div><span class="eyebrow">02 / ${L('Нэг хэмжээст хайрцаг', 'One-dimensional box')}</span><h2>${L('Математик ба судлах ажлууд', 'Mathematics and investigations')}</h2><p>${L('Томьёо, аргын код, дасгал ба төслийг ажигласан үр дүнтэй холбоно.', 'Connect formulas, method source, exercises, and a project to the displayed results.')}</p></div><span class="learning-mark" aria-hidden="true">ψ</span></div><div class="learning-grid"><div>${details('box-math-section', c.mathTitle, `<div class="lesson-body">${c.mathHtml}</div>`, 'lesson')}${details('box-method-section', c.methodTitle, `<div class="lesson-body">${c.methodHtml}${source}</div>`, 'lesson')}${details('box-glossary-section', c.glossaryTitle, `<div class="lesson-body">${c.glossaryHtml}</div>`, 'lesson')}</div><div>${details('box-exercises-section', c.exercisesTitle, `<div class="lesson-body exercises">${c.exercises.map(ex => `<article class="exercise" id="box-${ex.id}"><span class="exercise-id">${ex.id}</span><h4>${ex.title}</h4><p>${ex.question}</p><ol>${ex.steps.map(s => `<li>${s}</li>`).join('')}</ol>${button('box-exercise', L('Эхлэх бэлтгэлийг хэрэглэх', 'Apply starting preparation'), 'secondary', `data-box-preset="${ex.preset}"`, `box-exercise-${ex.id}`)}${details(`box-hint-${ex.id}`, L('Санамж', 'Hint'), `<p>${ex.hint}</p>`, 'hint')}<p class="exercise-check">${ex.check}</p></article>`).join('')}</div>`, 'lesson')}${details('box-project-section', c.projectsTitle, `<div class="lesson-body"><h4>${c.project.title}</h4><p>${c.project.question}</p><ol>${c.project.steps.map(s => `<li>${s}</li>`).join('')}</ol><p class="exercise-check">${c.project.check}</p></div>`, 'lesson')}</div></div></section>`;
}

export function getBoxMode()          { return mode; }
export function selectBoxExperiment(next         )       { if (next === 'state' || next === 'time') { mode = next; notice = null; } }
export function captureBoxDetails(app             )       {
  for (const element of app.querySelectorAll                    ('details[id^="box-"]')) element.open ? opened[mode].add(element.id) : opened[mode].delete(element.id);
}
export function renderBox(lang          , code                                       )         {
  language = lang;
  const kinds             = mode === 'time' ? ['history', 'position', 'coefficients'] : ['coefficients', 'position', 'batch'];
  const names                           = { coefficients: L('Коэффициент ба энергийн хүснэгт', 'Coefficients and energies'), position: L('Сонгосон төлөвийн орон зайн хүснэгт', 'Selected spatial state'), history: L('Хадгалсан хугацааны хүснэгт', 'Retained time history'), batch: L('Багц хэмжилтийн хүснэгт', 'Independent-copy batch') };
  return `<div class="lab-layout"><aside class="controls" aria-label="${L('Туршилтын тохиргоо', 'Experiment setup')}">${mode === 'state' ? stateControls() : timeControls()}</aside><section class="workspace" id="box-workspace" tabindex="-1"><div class="workspace-top"><div><span class="eyebrow">${L('Тооцооллын арга', 'Computational method')}</span>${button('box-show-method', `${L('Төгсгөлөг спектрийн задаргаа', 'Finite spectral expansion')} <span aria-hidden="true">↗</span>`, 'method-link', '', 'box-method-link')}</div><div class="workspace-actions">${button('box-show-method', '&lt;/&gt;', 'code-button', `aria-label="${L('Аргын кодыг харах', 'Show method source')}"`, 'box-code')}${button('box-add-panel', `+ ${L('Самбар', 'Panel')}`, 'secondary', panels[mode].length >= 4 ? 'disabled' : '')}</div></div>${coordinateControls()}<div id="box-notice" class="notice ${notice?.error ? 'error' : ''}" role="status" aria-live="polite">${notice ? esc(notice[language]) : ''}</div><div class="panel-deck" id="box-panel-deck">${panels[mode].map(panelHtml).join('')}</div><div class="workspace-bottom"><span class="status-dot"></span>${L('Самбарын сонголт, масштаб, хэл ба кодыг харах нь төлөв болон санамсаргүй тоог өөрчлөхгүй.', 'Panel, scale, language, and source inspection do not change the state or randomness.')}</div><div class="control-section" style="margin-top:16px"><label class="field-label" for="box-data-kind">${L('CSV-д гаргах өгөгдөл', 'Data for CSV export')}</label><select id="box-data-kind" data-box-data-kind>${kinds.map(kind => option(kind, names[kind], dataKinds[mode], kind === 'batch' && !state.batch)).join('')}</select><p class="help">${L('Дээрх экспортын товчийг ашиглана. Бэхэлсэн самбарын SVG нь тухайн самбарын өөрийн эх өгөгдлийг хадгална.', 'Use the export controls above. A pinned panel’s SVG records that panel’s own source data.')}</p></div></section></div>${learning(code)}`;
}

function ensureOutcomes()       { if (!panels.state.some(p => p.tool === 'outcomes') && panels.state.length < 4) panels.state.push(newPanel('outcomes')); }
function transferToTime()       {
  const p = currentPreparation();
  applyPreparation('time', p.coeffs, p.params, p.retainedWeight, p.preset, `state-${state.revision}`);
  mode = 'time';
  setNotice('Одоогийн төлөвийг хувьслын оролтод хууллаа. Шинэ үр дүн үүсгэхдээ Тооцоолох товчийг дарна.', 'The current state was copied into the evolution input. Press Calculate to generate its result.');
}
function setTime(value        )       {
  if (!Number.isFinite(value) || value < 0 || value > time.run.end) throw new RangeError('Time selection outside retained interval');
  time.cursor = value; time.cursorDraft = String(value);
}
function doMeasurement()       {
  const before = copy(state.current), seedBefore = state.seed, draw = nextRandom(seedBefore);
  const result = measureBoxEnergy(before, state.params, draw.value);
  const event              = { index: ++state.eventCount, inputRevision: state.revision, params: { ...state.params }, before,
    state: copy(result.state), n: result.n, energy: result.energy, probability: result.probability, draw: draw.value, seedBefore, seedAfter: draw.seed };
  state.current = copy(result.state); state.revision++; state.seed = draw.seed; state.retainedWeight = null; state.preset = 'custom';
  state.events = [...state.events, event].slice(-12);
  ensureOutcomes();
  setNotice(`Энерги хэмжив: n=${result.n}, E=${fmt(result.energy, 5)}, p=${fmt(result.probability, 5)}.`, `Energy measured: n=${result.n}, E=${fmt(result.energy, 5)}, p=${fmt(result.probability, 5)}.`);
}
function doBatch()       {
  const trials = numeric(trialDraft, 1, 2000, true), initial = copy(state.current), params = { ...state.params }, seedBefore = state.seed;
  const counts = initial.map(() => 0), probabilities = initial.map(c => c.re ** 2 + c.im ** 2), energies = initial.map((_, i) => boxEnergy(i + 1, params));
  let seedAfter = seedBefore;
  for (let i = 0; i < trials; i++) { const draw = nextRandom(seedAfter); seedAfter = draw.seed; counts[measureBoxEnergy(initial, params, draw.value).n - 1]++; }
  state.batch = { id: nextResult++, inputRevision: state.revision, initial, params, trials, counts, probabilities, energies, seedBefore, seedAfter };
  state.seed = seedAfter; ensureOutcomes(); dataKinds.state = 'batch';
  setNotice('Ижил бэлтгэлтэй хуулбаруудын багц хэмжилт үүслээ. Одоогийн төлөв хэвээр.', 'The independent-copy batch was generated. The current state is unchanged.');
}
function applyExercise(which                   )       {
  const preset                = which === 'stationary' ? 'ground' : which === 'interference' ? 'pair' : 'localized';
  const prepared = boxPreset(preset, 8, unit);
  mode = which === 'localized' ? 'state' : 'time';
  applyPreparation(mode, prepared.coeffs, unit, prepared.retainedWeight, preset, 'exercise');
  if (mode === 'time') time.endDraft = '1';
  opened[mode].add('box-preparation-section');
  setNotice('Дасгалын эх бэлтгэлийг хэрэглэв. Хугацааны шинэ үр дүнг Тооцоолох товчоор үүсгэнэ.', 'The exercise preparation was applied. Generate a new time result with Calculate.');
}
export function handleBoxClick(target                   )          {
  const action = target.dataset.action;
  if (!action?.startsWith('box-')) return false;
  if (target.disabled) return true;
  const form = target.closest('form');
  if (form && !form.reportValidity()) return true;
  const id = Number(target.dataset.boxId), p = panels[mode].find(panel => panel.id === id);
  try {
    if (action === 'box-prepare-preset') {
      const d = drafts[mode], params = { length: numeric(d.length, 0.2, 5), mass: numeric(d.mass, 0.1, 5) };
      const preset = boxPreset(d.preset, numeric(d.modes, 1, MAX_BOX_MODES, true), params);
      applyPreparation(mode, preset.coeffs, params, preset.retainedWeight, d.preset);
      setNotice('Жишээ төлөвийг бэлтгэв.', 'The preset state was prepared.');
    } else if (action === 'box-prepare-coefficients') {
      const d = parsedDraft(); applyPreparation(mode, normalizeBox(d.coeffs), d.params, null, 'custom', 'coefficients');
      setNotice('Коэффициентуудыг нормчилж шинэ төлөв бэлтгэв.', 'The coefficients were normalized and prepared.');
    } else if (action === 'box-reprepare') {
      const p = state.prepared; applyPreparation('state', p.coeffs, p.params, p.retainedWeight, p.preset, 'reprepare');
      setNotice('Сүүлд бэлтгэсэн төлөвийг дахин бэлтгэв. Санамсаргүй тооны дарааллыг ухраагаагүй.', 'The last preparation was restored. Randomness was not rewound.');
    } else if (action === 'box-use-state' || action === 'box-copy-current') transferToTime();
    else if (action === 'box-calculate') {
      const end = numeric(time.endDraft, 0.0001, 100), run = boxTimeRun(time.input.coeffs, time.input.params, end, nextResult);
      time.run = run; time.runInputRevision = time.input.revision; nextResult++; setTime(Math.min(time.cursor, end));
      setNotice('Шинэ хугацааны үр дүнг тооцоолов.', 'A new time result was calculated.');
    } else if (action === 'box-measure') doMeasurement();
    else if (action === 'box-sample') doBatch();
    else if (action === 'box-reset-seed') { state.seed = numeric(seedDraft, 0, 4294967295, true); setNotice('Санамсаргүй тооны эх утгыг хэрэглэв.', 'The random seed was applied.'); }
    else if (action === 'box-add-panel' && panels[mode].length < 4) panels[mode].push(newPanel(available(mode).find(tool => !panels[mode].some(panel => panel.tool === tool)) ?? 'density'));
    else if (action === 'box-pin-panel' && p) p.pinned = p.pinned ? null : binding();
    else if (action === 'box-feature-panel' && p) panels[mode] = [p, ...panels[mode].filter(panel => panel !== p)];
    else if (action === 'box-remove-panel' && p && panels[mode].length > 1) panels[mode] = panels[mode].filter(panel => panel !== p);
    else if (action === 'box-collapse-panel' && p) p.collapsed = !p.collapsed;
    else if (action === 'box-fit-panel' && p) {
      const b = p.pinned ?? binding(), samples = spatialData(b);
      const max = Math.max(...samples.map(q => p.tool === 'density' ? q.density * b.params.length : Math.max(Math.abs(q.re), Math.abs(q.im)) * Math.sqrt(b.params.length)));
      p.yMax = Math.max(0.1, 1.08 * max);
    } else if (action === 'box-previous' || action === 'box-next') setTime(Math.max(0, Math.min(time.run.end, time.cursor + (action === 'box-next' ? 1 : -1) * time.run.end / 200)));
    else if (action === 'box-show-method') {
      opened[mode].add('box-method-section');
      queueMicrotask(() => document.querySelector('#box-method-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } else if (action === 'box-exercise') applyExercise(target.dataset.boxPreset                     );
    return true;
  } catch (error) { errorNotice(error); return true; }
}
export function handleBoxInput(input                  )          {
  if (input.id === 'box-time') { try { setTime(Number(input.value)); } catch (e) { errorNotice(e); } return true; }
  if (input.id === 'box-time-value') {
    const raw = input.value; time.cursorDraft = raw;
    const value = Number(raw);
    if (raw.trim() && Number.isFinite(value) && value >= 0 && value <= time.run.end) { setTime(value); time.cursorDraft = raw; }
    return false;
  }
  if (input.dataset.boxCoefficient !== undefined) {
    const i = Number(input.dataset.boxCoefficient), part = input.dataset.boxPart;
    if (drafts[mode].coeffs[i] && (part === 're' || part === 'im')) drafts[mode].coeffs[i][part] = input.value;
    return false;
  }
  const field = input.dataset.boxDraft;
  if (!field) return false;
  if (field === 'trials') trialDraft = input.value;
  else if (field === 'seed') seedDraft = input.value;
  else if (field === 'end') time.endDraft = input.value;
  else if (field === 'length' || field === 'mass' || field === 'modes') drafts[mode][field] = input.value;
  return false; // Keep transient signs/decimals editable; change commits the display update.
}
export function handleBoxChange(input                                      )          {
  try {
    if (input.id === 'box-time-value') { setTime(numeric(input.value, 0, time.run.end)); return true; }
    if (input.dataset.boxDraft || input.dataset.boxCoefficient !== undefined) { handleBoxInput(input                    ); return true; }
    if (input.hasAttribute('data-box-preset')) { drafts[mode].preset = input.value                 ; return true; }
    if (input.hasAttribute('data-box-data-kind')) { dataKinds[mode] = input.value            ; return true; }
    if (input.hasAttribute('data-box-code')) { fragments[mode] = input.value; return true; }
    const field = ['boxTool', 'boxWave', 'boxCoefficientView', 'boxMomentView'].find(key => input.dataset[key] !== undefined);
    if (!field) return false;
    const p = panels[mode].find(panel => panel.id === Number(input.dataset[field]));
    if (!p) return true;
    if (field === 'boxTool' && available(mode).includes(input.value        )) { p.tool = input.value        ; p.yMax = p.tool === 'wavefunction' ? 3 : 8; }
    else if (field === 'boxWave') p.wave = input.value                 ;
    else if (field === 'boxCoefficientView') p.coefficientView = input.value                            ;
    else if (field === 'boxMomentView') p.momentView = input.value                       ;
    return true;
  } catch (error) { errorNotice(error); return true; }
}

/** Update edited numbers without replacing the control receiving the next click.
 * Cursor evaluation also keeps the active range/number input mounted while dragging/typing.
 */
export function refreshBoxInputs(app             , input                                      , cursor = false)       {
  const noticeElement = app.querySelector             ('#box-notice');
  if (noticeElement) {
    noticeElement.classList.toggle('error', !!notice?.error);
    noticeElement.textContent = notice ? notice[language] : '';
  }
  const status = app.querySelector             ('[data-testid="box-draft-status"]');
  if (status) status.textContent = preparationDirtyText();
  if (input.dataset.boxDraft === 'modes') {
    const count = Number(drafts[mode].modes), body = app.querySelector                         ('.coefficient-table tbody');
    if (Number.isInteger(count) && count >= 1 && count <= MAX_BOX_MODES && body && body.rows.length !== count) body.innerHTML = coefficientRows(drafts[mode], count);
  }
  if (mode === 'time') {
    const stale = time.input.revision !== time.runInputRevision || time.endDraft.trim() === '' || Number(time.endDraft) !== time.run.end;
    let pending = app.querySelector             ('[data-testid="box-result-pending"]');
    if (stale && !pending) {
      pending = document.createElement('p'); pending.className = 'notice'; pending.dataset.testid = 'box-result-pending';
      app.querySelector('[data-testid="box-result-source"]')?.closest('.state-summary')?.after(pending);
    }
    if (pending) {
      if (stale) pending.textContent = L('Оролт эсвэл интервал өөрчлөгдсөн. Тооцоолох хүртэл дээрх үр дүнг харуулна.', 'The input or interval has changed. The run above remains displayed until Calculate.');
      else pending.remove();
    }
  }
  if (!cursor) return;
  captureBoxDetails(app);
  const output = app.querySelector('#box-time-output'); if (output) output.textContent = `t=${fmt(time.cursor, 6)}`;
  const slider = app.querySelector                  ('#box-time'); if (slider) slider.value = String(time.cursor);
  const exact = app.querySelector                  ('#box-time-value'); if (exact && input.id !== 'box-time-value') exact.value = time.cursorDraft;
  for (const p of panels[mode]) {
    const element = app.querySelector             (`#box-panel-${p.id}`), b = p.pinned ?? binding();
    const label = element?.querySelector('.panel-binding');
    if (label) label.innerHTML = `${p.pinned ? `<span class="pin-label">${L('Бэхэлсэн', 'Pinned')}</span> ` : ''}${bindingLabel(b, p.tool)}`;
    const body = element?.querySelector('.panel-body');
    if (body && !p.collapsed) body.innerHTML = panelBody(p, b);
  }
}

function resultMetadata(b         )                          {
  return { system: 'infinite-1d-box', hbar: 1, method: 'finite-sine-spectral', mode: b.mode, parameters: b.params, coefficients: b.coeffs,
    source: b.mode === 'time' ? { runId: b.run .id, initial: b.run .initial, end: b.run .end, selectedTime: b.time, sampleCount: b.run .sampleCount, maxEnergyGap: b.run .maxEnergyGap, phaseGap: b.run .phaseGap } : { stateRevision: b.revision },
    retainedTargetWeight: b.retainedWeight, moments: boxMoments(b.coeffs, b.params) };
}
export function boxSnapshot()          {
  const selected = binding();
  return clone({ mode, state, time, selected: { ...selected, moments: boxMoments(selected.coeffs, selected.params) }, panels, drafts, dataKinds, fragments, trialDraft, seedDraft });
}
export function boxExportSetup()          {
  const layout = panels[mode].map(p => ({ ...p, pinned: p.pinned ? boxFigureMetadata(p.id) : null }));
  const common = { schema: 'quantum-box-setup', schemaVersion: 1, system: 'infinite-1d-box', hbar: 1, method: 'finite-sine-spectral', mode,
    limits: { maxModes: MAX_BOX_MODES, maxTimeSamples: MAX_BOX_TIME_SAMPLES, length: [0.2, 5], mass: [0.1, 5], endTime: [0.0001, 100], measurementTrials: [1, 2000] },
    layout, draft: drafts[mode], dataKind: dataKinds[mode], includesFullTimeHistory: false };
  return clone(mode === 'state' ? { ...common, current: currentPreparation(), prepared: state.prepared,
    nextSeed: state.seed, measurementEvents: state.events, independentCopyBatch: state.batch }
    : { ...common, input: time.input, requestedEnd: time.endDraft,
      retainedRunRecipe: { id: time.run.id, inputRevision: time.runInputRevision, initial: time.run.initial, parameters: time.run.params,
        end: time.run.end, method: 'finite-sine-spectral', maxEnergyGap: time.run.maxEnergyGap, sampleCount: time.run.sampleCount }, selectedTime: time.cursor });
}
export function boxExportData()                                                                                               {
  const kind = dataKinds[mode], b = binding(), metadata = { ...resultMetadata(b), dataset: kind };
  if (kind === 'history') return { metadata, columns: ['t', 'norm', 'mean_x', 'mean_x_squared', 'variance_x', 'mean_energy', 'left_probability'], rows: time.run.points.map(p => [p.t, p.moments.norm, p.moments.meanX, p.moments.meanX2, p.moments.varianceX, p.moments.meanEnergy, p.moments.leftProbability]) };
  if (kind === 'position') return { metadata, columns: ['x', 'x_over_L', 're_psi', 'im_psi', 'density'], rows: spatialData(b).map(p => [p.x, p.y, p.re, p.im, p.density]) };
  if (kind === 'batch') {
    const batch = state.batch;
    if (!batch) throw new RangeError('No energy-measurement batch');
    return { metadata: { system: 'infinite-1d-box', hbar: 1, method: 'projective-energy-measurement', dataset: kind, batch: clone(batch) }, columns: ['n', 'energy', 'predicted_probability', 'count', 'observed_frequency'], rows: batch.counts.map((count, i) => [i + 1, batch.energies[i], batch.probabilities[i], count, count / batch.trials]) };
  }
  return { metadata, columns: ['n', 're_c', 'im_c', 'probability', 'energy'], rows: b.coeffs.map((c, i) => [i + 1, c.re, c.im, c.re ** 2 + c.im ** 2, boxEnergy(i + 1, b.params)]) };
}
export function boxFigureMetadata(panelId                 )                          {
  const id = Number(String(panelId).replace(/^box-/, ''));
  const owner = (['state', 'time']         ).find(which => panels[which].some(panel => panel.id === id));
  if (!owner) throw new RangeError('Unknown box panel');
  const p = panels[owner].find(panel => panel.id === id) , b = p.pinned ?? binding(owner);
  const actual = p.tool === 'outcomes' ? { system: 'infinite-1d-box', hbar: 1, method: 'projective-energy-measurement', batch: b.batch, individualEvents: b.events } : resultMetadata(b);
  return clone({ ...actual, panelId: `box-${id}`, pinned: !!p.pinned, panel: { tool: p.tool, wave: p.wave, coefficientView: p.coefficientView, momentView: p.momentView, yMax: p.yMax }, caption: bindingLabel(b, p.tool) });
}
