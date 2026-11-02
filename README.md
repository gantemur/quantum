# Quantum laboratory · Квантын лаборатори

A Mongolian-first browser laboratory for quantum mechanics. Choose a physical system and an experiment: a qubit for preparation, measurement, fixed-Hamiltonian evolution, and parameter families; or an infinite 1D box for finite complex state construction, energy measurement, and spectral evolution.

**Open the laboratory:** https://gantemur.github.io/quantum/

## Run locally

Use Node.js 24 or later.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4173`. The application makes no external runtime requests. The English option is in the header; only that language preference is stored locally.

`npm run build` produces a self-contained static site in `dist/`. It uses Node's TypeScript stripping, native browser modules, SVG, and CSS. There is no application framework or numerical runtime dependency. Serve the generated directory over HTTP; do not open the HTML using a `file:` URL.

## Explore

The **System** selector chooses the model; **Experiment** chooses an investigation with its own preparation, method settings, results, cursor, and panels. Navigation preserves each workspace during the page session. Explicit transfer buttons copy a prepared or selected state into another experiment. Editing settings leaves calculated results attached to their original inputs until you calculate again.

- **State and measurement:** prepare any Bloch-ball state using direction and length, rotate it, inspect a density matrix or pure-state amplitudes in the x/y/z basis, predict outcomes, and explicitly sample a projective measurement.
- **Repeated preparations:** run one-axis, z → z, or z → x → z protocols on independently prepared copies. Predicted joint probabilities and sampled counts remain attached to that run's input and seed.
- **Time evolution:** calculate a bounded trajectory for a fixed `H = h · sigma`, using either a spectral unitary or a Bloch rotation. The whole curve and selected states remain available as static results.
- **Spectrum and parameter:** inspect the energies and eigenstates of `H(lambda) = Delta sigma_x + lambda sigma_z`. Lambda indexes separate Hamiltonians; it does not imply a physical ramp.

- **Box state construction:** edit 1–16 complex eigenstate coefficients, normalize and apply a preparation, inspect the position wavefunction/density and energy populations, measure energy, and sample independently prepared copies. A fixed localized target makes cutoff comparisons meaningful.
- **Box evolution:** evolve an applied finite superposition analytically, inspect an exact selected time, and compare its mean-position history with conserved energy populations. Length, mass, cutoff, method, and actual result inputs remain visible.

Panels have independent representation settings and can be added, removed, collapsed, featured, duplicated, or pinned to a result. Viewing and layout changes do not perform measurements or consume random draws. The learning area below the workspace contains mathematics, actual source excerpts, contextual exercises, hints, and bounded projects in Mongolian and English.

**Setup JSON**, **Data CSV**, and **Figure SVG** export the active experiment. JSON is a versioned setup record, not a complete restorable session. CSV contains the current applied result, with inputs, coordinate meaning, units, and source provenance in comment lines. SVG exports the first expanded panel that contains a graph, including a pinned reference when that panel is pinned; its metadata records the actual binding and numerical-source revision. Collapsed and nongraph panels are skipped.

The current release covers qubits and the infinite 1D box. Oscillator experiments, persistent workspace import/restore, and iterative calculations remain future work. Workspace state is retained while the page remains open; a reload starts fresh except for the language preference.

## Scientific conventions

The state is `rho = (I + r · sigma)/2`, with `|r| <= 1`. The Hamiltonian is traceless, `H = h · sigma`, in units with `hbar = 1`. Pauli measurements have outcomes ±1; physical spin components have outcomes ±hbar/2. A mixed state is represented by its density matrix, without a fictitious unique ket. At `h = 0`, the full space is degenerate and the tool does not choose an arbitrary eigenaxis.

The box is on `[0,L]`, with `hbar=1`, positive mass, and a maximum of 16 sine modes. Spectral phases and moments are analytic for the chosen finite expansion; the localized target projection uses numerical quadrature. Retained target weight is reported separately from the normalized prepared state and from left-half probability.

See [the qubit mathematical guide](docs/MATHEMATICS.md) and [the box guide](docs/BOX.md) for formulas, normalization, sampling, result ownership, resource bounds, and code provenance.

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
| `src/box.ts` | Box modes, complex expansions, analytic moments, spectral histories, and energy measurement |
| `src/box-ui.ts` | Box experiment workspaces, explicit operations, retained results, panels, and exercises |
| `src/exports.ts` | CSV formatting and portable SVG/download assembly |
| `src/lab.ts` | Explicit operations and immutable-by-convention result records |
| `src/plots.ts` | Static SVG renderers |
| `src/main.ts` | Experiment controls, linked selections, independent panels, and learning integration |
| `src/i18n.ts`, `src/lessons.ts`, `src/box-lessons.ts` | Mongolian/English interface and original teaching content |
| `scripts/build.mjs` | Type stripping, static-site assembly, and exact source-excerpt extraction |

The build attaches a SHA-256 of each numerical source file to its excerpts. A clean Git checkout or a supplied full `SOURCE_REVISION` also gives immutable source links. Local uncommitted builds are labelled as source snapshots.
