# Quantum laboratory · Квантын лаборатори

A Mongolian-first browser laboratory for quantum mechanics. Choose a physical system and an experiment: a qubit for preparation and measurement, a one-dimensional box for complex superpositions, and a harmonic oscillator for coherent-state dynamics and computational-method comparisons.

**Open the laboratory:** https://gantemur.github.io/quantum/

## Run locally

Use Node.js 24 or later.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4173`. The application makes no external runtime requests. The English option is in the header. Language preference and, when explicitly saved, an oscillator workspace are stored locally in the browser.

`npm run build` produces a self-contained static site in `dist/`. It uses Node's TypeScript stripping, native browser modules, SVG, and CSS. There is no application framework or numerical runtime dependency. Serve the generated directory over HTTP; do not open the HTML using a `file:` URL.

## Explore

The **System** selector chooses the model; **Experiment** chooses an investigation with its own preparation, method settings, results, cursor, and panels. Navigation preserves each workspace during the page session. Explicit transfer buttons copy a prepared or selected state into another experiment. Editing settings leaves calculated results attached to their original inputs until you calculate again.

- **State and measurement:** prepare any Bloch-ball state using direction and length, rotate it, inspect a density matrix or pure-state amplitudes in the x/y/z basis, predict outcomes, and explicitly sample a projective measurement.
- **Repeated preparations:** run one-axis, z → z, or z → x → z protocols on independently prepared copies. Predicted joint probabilities and sampled counts remain attached to that run's input and seed.
- **Time evolution:** calculate a bounded trajectory for a fixed `H = h · sigma`, using either a spectral unitary or a Bloch rotation. The whole curve and selected states remain available as static results.
- **Spectrum and parameter:** inspect the energies and eigenstates of `H(lambda) = Delta sigma_x + lambda sigma_z`. Lambda indexes separate Hamiltonians; it does not imply a physical ramp.

- **Box state construction:** edit 1–16 complex eigenstate coefficients, normalize and apply a preparation, inspect the position wavefunction/density and energy populations, measure energy, and sample independently prepared copies. A fixed localized target makes cutoff comparisons meaningful.
- **Box evolution:** evolve an applied finite superposition analytically, inspect an exact selected time, and compare its mean-position history with conserved energy populations. Length, mass, cutoff, method, and actual result inputs remain visible.
- **Oscillator coherent motion:** choose the complex amplitude, mass, frequency, time interval, and number of modes; compare the full finite-expansion expectation values, uncertainty, classical trajectory, and exact selected-time spatial density. The reported retained weight quantifies coherent-state truncation before renormalization.
- **Anharmonic ground state:** compare a Rayleigh–Ritz calculation, a separate larger-basis reference, and a one-parameter Gaussian variational calculation with its complete algorithm-iteration history. Physical time is never confused with iteration number.

Panels have independent representation settings and can be added, removed, collapsed, featured, duplicated, or pinned to a result. Viewing and layout changes do not perform measurements or consume random draws. The learning area below the workspace contains mathematics, actual source excerpts, contextual exercises, hints, and bounded projects in Mongolian and English.

**Setup JSON**, **Data CSV**, and **Figure SVG** export the active experiment. Qubit and box JSON are versioned setup records, not restorable sessions; oscillator JSON includes its bounded session data, but importing that JSON file is not yet implemented. The oscillator provides explicit **Save in browser / Restore saved workspace** controls in its method experiment. CSV contains the current applied result, with inputs, coordinate meaning, units, and source provenance in comment lines. SVG exports the first expanded panel that contains a graph, including a pinned reference when that panel is pinned; its metadata records the actual binding and numerical-source revision. Collapsed and nongraph panels are skipped.

The current release covers qubits, the infinite 1D box, and the oscillator. Q3 adds the computational-history result shape and oscillator-only browser save/restore; unified save/import/restore for every system, adaptive oscillator panels, and advanced numerical methods remain future enhancements. Switching experiments preserves active work during a page session.

## Scientific conventions

The state is `rho = (I + r · sigma)/2`, with `|r| <= 1`. The Hamiltonian is traceless, `H = h · sigma`, in units with `hbar = 1`. Pauli measurements have outcomes ±1; physical spin components have outcomes ±hbar/2. A mixed state is represented by its density matrix, without a fictitious unique ket. At `h = 0`, the full space is degenerate and the tool does not choose an arbitrary eigenaxis.

The box is on `[0,L]`, with `hbar=1`, positive mass, and a maximum of 16 sine modes. Spectral phases and moments are analytic for the chosen finite expansion; the localized target projection uses numerical quadrature. Retained target weight is reported separately from the normalized prepared state and from left-half probability.

See [the qubit mathematical guide](docs/MATHEMATICS.md), [the box guide](docs/BOX.md), and [the oscillator guide](docs/OSCILLATOR.md) for formulas, normalization, numerical diagnostics, resource bounds, and code provenance.

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
| `src/oscillator.ts` | Coherent-state expansions, full operator moments, Rayleigh–Ritz, and variational iteration |
| `src/oscillator-ui.ts` | Oscillator experiment controls, plots, learning area, bounded browser persistence |
| `src/box-ui.ts` | Box experiment workspaces, explicit operations, retained results, panels, and exercises |
| `src/exports.ts` | CSV formatting and portable SVG/download assembly |
| `src/lab.ts` | Explicit operations and immutable-by-convention result records |
| `src/plots.ts` | Static SVG renderers |
| `src/main.ts` | Experiment controls, linked selections, independent panels, and learning integration |
| `src/i18n.ts`, `src/lessons.ts`, `src/box-lessons.ts` | Mongolian/English interface and original teaching content |
| `scripts/build.mjs` | Type stripping, static-site assembly, and exact source-excerpt extraction |

The build attaches a SHA-256 of each numerical source file to its excerpts. A clean Git checkout or a supplied full `SOURCE_REVISION` also gives immutable source links. Local uncommitted builds are labelled as source snapshots.
