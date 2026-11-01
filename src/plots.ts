import type { Vec3 } from './quantum.ts';

export interface Series {
  label: string;
  color: string;
  data: readonly (readonly [number, number])[];
}

export interface ChartOptions {
  xLabel: string;
  yLabel: string;
  xRange: readonly [number, number];
  yRange: readonly [number, number];
  cursor?: number;
  id: string;
  ariaLabel: string;
}

const INK = '#153e50';
const TEAL = '#138a80';
const AMBER = '#c9953b';
const GRID = '#ebece6';
const PALETTE = [TEAL, AMBER, '#6b76a0'];
const FONT = "Georgia, 'Times New Roman', serif";
const DASHES = ['', '7 4', '2 4'];
const XML_ENTITIES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
};

function xml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => XML_ENTITIES[char]!);
}

function safeId(value: string): string {
  return `q-${value.replace(/[^A-Za-z0-9_-]/g, '-') || 'plot'}`;
}

function color(value: string, index: number): string {
  // Colors are presentation data, never arbitrary SVG paint-server URLs.
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) ? value : PALETTE[index % PALETTE.length]!;
}

function coord(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function rangeSpan(range: readonly [number, number]): number {
  const span = range[1] - range[0];
  if (!range.every(Number.isFinite) || !Number.isFinite(span) || span <= 0) {
    throw new RangeError('Chart ranges must be finite and strictly increasing.');
  }
  return span;
}

function ticks(range: readonly [number, number]): { values: number[]; step: number } {
  const span = rangeSpan(range);
  const raw = span / 5;
  const power = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / power;
  const unit = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  const step = unit * power || span / 4;
  const first = Math.ceil((range[0] - span * 1e-10) / step);
  const values: number[] = [];
  for (let i = 0; i < 20; i++) {
    const value = (first + i) * step;
    if (value > range[1] + span * 1e-10) break;
    if (value >= range[0] - span * 1e-10) values.push(Math.abs(value) < step * 1e-10 ? 0 : value);
  }
  return { values, step };
}

function tickText(value: number, step: number): string {
  if (value === 0) return '0';
  const absolute = Math.abs(value);
  if (absolute >= 10000 || absolute < 0.001) {
    return value.toExponential(2).replace(/\.?(0+)(?=e)/, '').replace('e+', 'e').replace('-', '−');
  }
  const digits = Math.min(12, Math.max(0, Math.ceil(-Math.log10(step)) + 1));
  return value.toFixed(digits).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1').replace('-', '−');
}

function polylinePath(
  points: readonly (readonly [number, number])[],
  project: (point: readonly [number, number]) => readonly [number, number],
): string {
  let drawing = false;
  let result = '';
  for (const point of points) {
    if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) {
      drawing = false;
      continue;
    }
    const [x, y] = project(point);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      drawing = false;
      continue;
    }
    result += `${drawing ? 'L' : 'M'}${coord(x)},${coord(y)} `;
    drawing = true;
  }
  return result.trim();
}

/** A static plot: it only renders supplied data and never evaluates a model. */
export function lineChart(series: Series[], options: ChartOptions): string {
  const width = 620;
  const height = 310;
  const left = 64;
  const right = 24;
  const top = 40;
  const bottom = 58;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const xSpan = rangeSpan(options.xRange);
  const ySpan = rangeSpan(options.yRange);
  const X = (x: number) => left + (x - options.xRange[0]) * plotWidth / xSpan;
  const Y = (y: number) => top + (options.yRange[1] - y) * plotHeight / ySpan;
  const xt = ticks(options.xRange);
  const yt = ticks(options.yRange);
  const id = safeId(options.id);
  const xGrid = xt.values.map((x) => `
    <line x1="${coord(X(x))}" y1="${top}" x2="${coord(X(x))}" y2="${top + plotHeight}" stroke="${x === 0 ? '#c9d7d4' : GRID}"/>
    <text class="chart-tick" x="${coord(X(x))}" y="${top + plotHeight + 21}" text-anchor="middle">${xml(tickText(x, xt.step))}</text>`).join('');
  const yGrid = yt.values.map((y) => `
    <line x1="${left}" y1="${coord(Y(y))}" x2="${left + plotWidth}" y2="${coord(Y(y))}" stroke="${y === 0 ? '#c9d7d4' : GRID}"/>
    <text class="chart-tick" x="${left - 12}" y="${coord(Y(y) + 4)}" text-anchor="end">${xml(tickText(y, yt.step))}</text>`).join('');
  const paths = series.map((s, index) => {
    const d = polylinePath(s.data, ([x, y]) => [X(x), Y(y)]);
    const dash = DASHES[index % DASHES.length];
    return `<path d="${d}" fill="none" stroke="${color(s.color, index)}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}><title>${xml(s.label)}</title></path>`;
  }).join('');
  const slot = plotWidth / Math.max(1, series.length);
  const legend = series.map((s, index) => {
    const x = left + index * slot;
    const maxLength = Math.max(3, Math.floor((slot - 36) / 7));
    const characters = Array.from(s.label);
    const label = characters.length > maxLength ? `${characters.slice(0, maxLength - 1).join('')}…` : s.label;
    const dash = DASHES[index % DASHES.length];
    return `<g class="chart-legend"><title>${xml(s.label)}</title><line x1="${coord(x)}" y1="18" x2="${coord(x + 22)}" y2="18" stroke="${color(s.color, index)}" stroke-width="2.5"${dash ? ` stroke-dasharray="${dash}"` : ''}/><text x="${coord(x + 30)}" y="22">${xml(label)}</text></g>`;
  }).join('');
  const cursor = options.cursor;
  const cursorSvg = cursor !== undefined && Number.isFinite(cursor) && cursor >= options.xRange[0] && cursor <= options.xRange[1]
    ? `<line x1="${coord(X(cursor))}" y1="${top}" x2="${coord(X(cursor))}" y2="${top + plotHeight}" stroke="${AMBER}" stroke-width="1.5" stroke-dasharray="4 4"/><path d="M${coord(X(cursor) - 4)},${top - 6} L${coord(X(cursor) + 4)},${top - 6} L${coord(X(cursor))},${top - 1} Z" fill="${AMBER}"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" class="scientific-chart" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${xml(options.ariaLabel)}" data-chart="line" data-view-width="${width}" data-view-height="${height}" data-plot-left="${left}" data-plot-top="${top}" data-plot-width="${plotWidth}" data-plot-height="${plotHeight}" data-x-min="${options.xRange[0]}" data-x-max="${options.xRange[1]}" data-y-min="${options.yRange[0]}" data-y-max="${options.yRange[1]}" style="display:block;width:100%;height:auto">
    <title>${xml(options.ariaLabel)}</title>
    <defs><clipPath id="${id}-clip"><rect x="${left}" y="${top}" width="${plotWidth}" height="${plotHeight}"/></clipPath></defs>
    <g font-family="${xml(FONT)}" font-size="13" fill="${INK}">
      ${legend}
      <rect x="${left}" y="${top}" width="${plotWidth}" height="${plotHeight}" rx="2" fill="#fcfdf9"/>
      ${xGrid}${yGrid}
      <path d="M${left},${top} V${top + plotHeight} H${left + plotWidth}" fill="none" stroke="#a7b9b7"/>
      <g clip-path="url(#${id}-clip)">${paths}</g>
      ${cursorSvg}
      <text class="chart-axis-label" x="${left + plotWidth / 2}" y="${height - 10}" text-anchor="middle" font-size="15">${xml(options.xLabel)}</text>
      <text class="chart-axis-label" x="17" y="${top + plotHeight / 2}" text-anchor="middle" font-size="15" transform="rotate(-90 17 ${top + plotHeight / 2})">${xml(options.yLabel)}</text>
    </g>
  </svg>`;
}

/** Orthographic projection of a unit Bloch sphere, with no inferred state for null. */
export function blochSvg(r: Vec3 | null, rawId: string, ariaLabel: string): string {
  if (r !== null && (r.length !== 3 || !r.every(Number.isFinite) || Math.hypot(...r) > 1 + 1e-8)) {
    throw new RangeError('The Bloch vector must be finite and lie in the unit ball.');
  }
  const width = 520;
  const height = 330;
  const cx = 260;
  const cy = 168;
  const radius = 116;
  const id = safeId(rawId);
  const azimuth = Math.PI / 6;
  const elevation = 40 * Math.PI / 180;
  const project = ([x, y, z]: Vec3): readonly [number, number] => [
    cx + radius * (Math.cos(azimuth) * x - Math.sin(azimuth) * y),
    cy + radius * (Math.sin(azimuth) * Math.sin(elevation) * x + Math.cos(azimuth) * Math.sin(elevation) * y - Math.cos(elevation) * z),
  ];
  const curve = (point: (angle: number) => Vec3) => Array.from({ length: 97 }, (_, i) => project(point(2 * Math.PI * i / 96)));
  const ringPath = (points: readonly (readonly [number, number])[]) => polylinePath(points, (p) => p);
  const latitudes = [-0.6, 0, 0.6].map((z) => {
    const radiusXY = Math.sqrt(1 - z * z);
    return `<path d="${ringPath(curve((a) => [radiusXY * Math.cos(a), radiusXY * Math.sin(a), z]))}"/>`;
  }).join('');
  const meridians = [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4].map((a) =>
    `<path d="${ringPath(curve((t) => [Math.cos(a) * Math.cos(t), Math.sin(a) * Math.cos(t), Math.sin(t)]))}"/>`,
  ).join('');
  const axes: readonly { direction: Vec3; label: string; dx: number; dy: number }[] = [
    { direction: [1, 0, 0], label: 'x', dx: 13, dy: 4 },
    { direction: [0, 1, 0], label: 'y', dx: -10, dy: 15 },
    { direction: [0, 0, 1], label: 'z', dx: 0, dy: -12 },
  ];
  const axisSvg = axes.map(({ direction, label, dx, dy }) => {
    const end = project([direction[0] * 1.24, direction[1] * 1.24, direction[2] * 1.24]);
    const start = project([direction[0] * -1.12, direction[1] * -1.12, direction[2] * -1.12]);
    return `<line x1="${coord(start[0])}" y1="${coord(start[1])}" x2="${cx}" y2="${cy}" stroke="#bccbc8" stroke-dasharray="3 5"/><line x1="${cx}" y1="${cy}" x2="${coord(end[0])}" y2="${coord(end[1])}" stroke="${INK}" stroke-opacity="0.55" marker-end="url(#${id}-axis)"/><text x="${coord(end[0] + dx)}" y="${coord(end[1] + dy)}" fill="${INK}" font-size="18" font-style="italic" text-anchor="middle">${label}</text>`;
  }).join('');
  let stateSvg = '';
  if (r !== null) {
    const end = project(r);
    const ground = project([r[0], r[1], 0]);
    const screenLength = Math.hypot(end[0] - cx, end[1] - cy);
    stateSvg = `<path d="M${coord(end[0])},${coord(end[1])} L${coord(ground[0])},${coord(ground[1])} L${cx},${cy}" fill="none" stroke="${TEAL}" stroke-opacity="0.25" stroke-dasharray="3 4"/>
      ${screenLength > 0.2 ? `<line x1="${cx}" y1="${cy}" x2="${coord(end[0])}" y2="${coord(end[1])}" stroke="${TEAL}" stroke-width="3.5" stroke-linecap="round" marker-end="url(#${id}-vector)"/>` : ''}
      <circle cx="${coord(end[0])}" cy="${coord(end[1])}" r="5.5" fill="${AMBER}" stroke="#fffdf7" stroke-width="2"/>
      <text x="${coord(end[0] + 12)}" y="${coord(end[1] - 10)}" fill="${TEAL}" font-size="18" font-style="italic">r</text>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" class="bloch-chart" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${xml(ariaLabel)}" data-chart="bloch" style="display:block;width:100%;height:auto">
    <title>${xml(ariaLabel)}</title>
    <defs>
      <radialGradient id="${id}-wash" cx="37%" cy="29%" r="72%"><stop offset="0" stop-color="#fffefa"/><stop offset="1" stop-color="#eaf3ee" stop-opacity="0.7"/></radialGradient>
      <marker id="${id}-axis" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,1 L7,4 L0,7" fill="none" stroke="${INK}" stroke-width="1.2"/></marker>
      <marker id="${id}-vector" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="3" markerHeight="3" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="${TEAL}"/></marker>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="url(#${id}-wash)" stroke="#d6e1da" stroke-width="1.2"/>
    <g fill="none" stroke="#b7cdc4" stroke-width="1" stroke-dasharray="3 5" stroke-opacity="0.75">${latitudes}${meridians}</g>
    <g font-family="${xml(FONT)}">${axisSvg}<circle cx="${cx}" cy="${cy}" r="2" fill="${INK}" fill-opacity="0.35"/>${stateSvg}</g>
  </svg>`;
}
