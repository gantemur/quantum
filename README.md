# Quantum laboratory · Квантын лаборатори

A Mongolian-first browser laboratory for quantum mechanics. The current experiment is a single qubit: prepare pure or mixed states, inspect representations, perform measurements, and compare a fixed-Hamiltonian evolution with a static Hamiltonian family.

## Run locally

Use Node.js 24 or later.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4173`. The application makes no external runtime requests. The English option is in the header; only that language preference is stored locally.

`npm run build` produces a self-contained static site in `dist/`. It uses Node's TypeScript stripping, native browser modules, SVG, and CSS. There is no application framework or numerical runtime dependency. Serve the generated directory over HTTP; do not open the HTML using a `file:` URL.

## Explore

- **State and measurement:** prepare any Bloch-ball state using direction and length, rotate it, inspect a density matrix or pure-state amplitudes in the x/y/z basis, predict outcomes, and explicitly sample a projective measurement.
- **Repeated preparations:** run one-axis, z → z, or z → x → z protocols on independently prepared copies. Predicted joint probabilities and sampled counts remain attached to that run's input and seed.
- **Time evolution:** calculate a bounded trajectory for a fixed `H = h · sigma`, using either a spectral unitary or a Bloch rotation. The whole curve and selected states remain available as static results.
- **Spectrum and parameter:** inspect the energies and eigenstates of `H(lambda) = Delta sigma_x + lambda sigma_z`. Lambda indexes separate Hamiltonians; it does not imply a physical ramp.

Panels have independent representation settings and can be added, removed, collapsed, featured, duplicated, or pinned to a result. Viewing and layout changes do not perform measurements or consume random draws. The learning area below the workspace contains mathematics, actual source excerpts, three exercises, hints, and a bounded state-reconstruction project in Mongolian and English.

The application currently covers a two-state finite model. Box/oscillator experiments, general saved-workspace import/export, and large iterative calculations are not implemented.

## Scientific conventions

The state is `rho = (I + r · sigma)/2`, with `|r| <= 1`. The Hamiltonian is traceless, `H = h · sigma`, in units with `hbar = 1`. Pauli measurements have outcomes ±1; physical spin components have outcomes ±hbar/2. A mixed state is represented by its density matrix, without a fictitious unique ket. At `h = 0`, the full space is degenerate and the tool does not choose an arbitrary eigenaxis.

See [the mathematical and numerical guide](docs/MATHEMATICS.md) for formulas, normalization, sampling, result ownership, resource bounds, and code provenance.

## Checks

```sh
npm run check
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

The numerical tests include hand-checkable spin states and matrix elements, independent complex-series evolution references, phase and basis conventions, measurements, conditional protocols, and seeded batching. Orchestration tests check retained inputs, explicit RNG use, bounds, and result ownership. Browser checks exercise the actual controls and presentation invariants. Browser emulation does not establish physical-device performance.

## Source guide

| File | Responsibility |
| --- | --- |
| `src/quantum.ts` | Pure numerical functions; no UI, hidden clock, or internal RNG state |
| `src/lab.ts` | Explicit operations and immutable-by-convention result records |
| `src/plots.ts` | Static SVG renderers |
| `src/main.ts` | Experiment controls, linked selections, independent panels, and learning integration |
| `src/i18n.ts`, `src/lessons.ts` | Mongolian/English interface and original teaching content |
| `scripts/build.mjs` | Type stripping, static-site assembly, and exact source-excerpt extraction |

The build attaches a SHA-256 of the numerical source to its excerpts. A clean Git checkout or a supplied full `SOURCE_REVISION` also gives immutable source links. Local uncommitted builds are labelled as source snapshots.
