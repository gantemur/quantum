# The qubit experiment

This guide states the model and conventions used by the implemented experiment. All calculations are for one two-state system, with floating-point arithmetic. Small formulas are exact for that declared model; sampled frequencies retain statistical fluctuations.

## State and representations

Write the density matrix as

\[
\rho=\frac{I+\mathbf r\cdot\boldsymbol\sigma}{2},\qquad |\mathbf r|\le1.
\]

In the z basis, its upper-right entry is `(r_x - i r_y)/2`. Its eigenvalues are `(1 ± |r|)/2`, and its purity is `(1 + |r|²)/2`. A vector on the sphere represents a pure state; the interior describes mixed states. The maximally mixed state is at the origin.

Preparation controls specify `r = s(sin(theta) cos(phi), sin(theta) sin(phi), cos(theta))`. Angles in the interface are degrees. The pure-state amplitudes panel shows a representative ket with an explicitly selected global phase. Changing that convention leaves the density matrix and all probabilities unchanged. It does not track the physically irrelevant overall phase accumulated by a particular Schrödinger-picture ket. Mixed states have no unique ket.

Basis order is (+, −) for the selected Pauli operator. The conventions are `|±x> = (1, ±1)/sqrt(2)` and `|±y> = (1, ±i)/sqrt(2)`. These passive changes of representation do not apply a physical rotation. A physical rotation is a separate command using `U = exp(-i angle n · sigma/2)`.

## Measurement and repetitions

For a unit axis `n`, the projectors are `P± = (I ± n · sigma)/2`. The Born probabilities are

\[
p_\pm=\operatorname{Tr}(\rho P_\pm)=\frac{1\pm\mathbf r\cdot\mathbf n}{2}.
\]

An explicit measurement samples one outcome and conditions the state on it, giving the Bloch vector `±n`. The outcome labels ±1 refer to `n · sigma`; the physical spin component is `hbar n · sigma/2`.

Opening a probability panel is an inspection. It does not sample an outcome or update the state. Repeated-preparation runs make fresh copies of the captured live state. Within each copy, the specified axes are measured successively. Thus z → z and z → x → z are different joint distributions. The displayed table includes impossible paths with zero predicted probability.

Sampling uses explicit Mulberry32 state. One draw is consumed for each measurement event, including deterministic outcomes. A batch records its input state, protocol, initial seed, final seed, trial count, and joint counts. A live measurement record includes its input/output states, axis, probability, draw, and seed transition. Replaying or viewing a result consumes no random numbers. Resetting the seed is an explicit action; applying a preparation does not reset it.

The interface retains the latest 12 live operations and the most recent batch. A batch supports at most 2,000 trials in this interface. The pure numerical API has separate declared bounds. These limits do not change the mathematical probabilities.

## Fixed-Hamiltonian evolution

The implemented Hamiltonian is `H = h · sigma`, with `hbar = 1`. The two energies are `±|h|`, and the nondegenerate eigenaxes are `±h/|h|`. The spectral propagator is

\[
U(t)=\cos(|\mathbf h|t)I-i\sin(|\mathbf h|t)\,\widehat{\mathbf h}\cdot\boldsymbol\sigma.
\]

The spectral method calculates `U rho U†`. The alternative method applies a spatial Bloch rotation through `2|h|t`; it is an independently written evaluation of the same exact finite-model evolution. This factor of two is tested against hand-checkable precession and an independent complex matrix exponential series.

Norm, purity, and the mean energy are conserved for this fixed closed-system model. There is no ODE integration step. There is still a display-sampling resolution: trajectories use at least 201 points and at least 32 samples per precession period over the declared interval. The UI bounds each h component to [-5,5] and the positive interval end to 100. Dense curves can still exceed a screen's visual resolution; shorten the interval to inspect individual oscillations. The selection cursor traverses retained points across the whole interval, and labels their actual physical times.

Each experiment owns its preparation, draft settings, and retained results. Switching experiments or systems preserves those records without transferring a state or consuming a random draw. Explicit transfer buttons copy a current or selected state into another experiment; transferring a selected family eigenstate also copies its actual Hamiltonian, not an uncalculated draft. At a degenerate point the transfer is unavailable.

A trajectory captures its input, Hamiltonian, interval, method, and run identity. Later live-state measurements do not silently modify it. A new calculation is required to use a changed input. At `h = 0`, evolution is the identity.

## A Hamiltonian family

The spectrum experiment uses `H(lambda) = Delta sigma_x + lambda sigma_z` over `lambda ∈ [-3,3]`, with `Delta ∈ [0,3]`. Its eigenvalues are `±sqrt(lambda² + Delta²)`. A single fixed energy scale covers every supported Delta, including pinned comparisons.

This is a family of static problems. A driven crossing would additionally require a time schedule, preparation, and time-dependent propagation; that experiment is not implied here. At `Delta = lambda = 0`, both eigenvalues are zero, every state is an eigenstate, and there is no uniquely selected eigenaxis. State inspectors explain that degeneracy instead of inventing a vector.

## Source inspection and checks

Short excerpts are extracted from marked regions of `src/quantum.ts` and `src/box.ts` during the build. Each excerpt records its own source path, line range, and SHA-256; immutable links use the build’s full source revision when available. The build fails if a required fragment is absent. Their source hash identifies the same module that is compiled into the application. The excerpts retain function names, validation calls, and comments; helper definitions and complete context are available in the linked module. They are actual implementation source, not substituted pseudocode.

The numerical core can be imported without the interface. Its tests use direct states, complex matrix operations, eigenpair residuals, an independent series calculation, and conditional probability fixtures. Result-orchestration and browser checks verify that representation, layout, language, and inspection do not mutate scientific results or advance random state.

Useful external reference points include [QuTiP's measurement documentation](https://qutip.readthedocs.io/en/latest/guide/guide-measurement.html) for the distinction between predicted statistics and sampled measurements, and [MIT's graduate quantum theory syllabus](https://ocw.mit.edu/courses/8-321-quantum-theory-i-fall-2017/pages/syllabus/) for the broader role of states, symmetry, measurement, and dynamics. The application is independently implemented and its exercises are original.
