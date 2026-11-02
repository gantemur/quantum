# The infinite-box experiment

This guide states the model, conventions, and mathematical checks for the box experiment. The system is a particle of mass `m > 0` confined to `[0,L]`, with `L > 0`. The potential vanishes inside, the walls are impenetrable, and `hbar = 1`. The wavefunction satisfies Dirichlet conditions at both endpoints.

## The sine basis and finite preparations

The normalized energy eigenfunctions and energies are

\[
\phi_n(x)=\sqrt{\frac{2}{L}}\sin\frac{n\pi x}{L},
\qquad
E_n=\frac{\pi^2n^2}{2mL^2},
\qquad n=1,2,\ldots.
\]

Their inner products obey `⟨φ_j,φ_k⟩ = δ_jk`. A finite preparation uses the first `N` modes:

\[
\psi_N(x,0)=\sum_{n=1}^N c_n\phi_n(x),
\qquad \sum_{n=1}^N|c_n|^2=1.
\]

The coefficients may be complex. Their real and imaginary parts are editable; the all-zero vector cannot define a normalized preparation. The interface supports `1 ≤ N ≤ 16`, `0.2 ≤ L ≤ 5`, and `0.1 ≤ m ≤ 5` in the declared model units. This is a retained-space limit, not the number of spatial plotting points.

A finite expansion is itself a valid state of the ideal box. If it is being used to approximate another target state, the omitted modes introduce a separate approximation error. Increasing the plotting resolution cannot recover omitted modes. Changing `N`, changing the coefficients, and changing the display grid have different meanings.

## Fixed-Hamiltonian evolution

Each retained energy component evolves independently:

\[
c_n(t)=c_n(0)e^{-iE_nt},
\qquad
\psi_N(x,t)=\sum_{n=1}^N c_n(t)\phi_n(x).
\]

These formulas are exact for the prepared finite expansion. Evaluation still uses floating-point arithmetic. There is no numerical time-integration step, but a plotted history has finite time sampling and a wavefunction curve has finite spatial sampling. A rapidly varying curve may require a shorter displayed interval or denser sampling; a visually smooth line is not a convergence certificate.

For this fixed closed system, normalization, the energy probabilities `p_n = |c_n|²`, and the mean energy `Σ p_n E_n` are conserved. The complex wavefunction can vary even when the position density is stationary. For one eigenstate, all time dependence is a common phase, so `|ψ_n(x,t)|² = |φ_n(x)|²`.

A generated time result captures its input preparation and model. Selecting a retained time inspects that result. It does not apply a new preparation, repeat a measurement, or change the original input. Generate a new result explicitly to investigate a changed preparation or model.

## Position density and moments

The position density is `|ψ(x)|²`. Probabilities refer to intervals:

\[
P(a\le x\le b)=\int_a^b|\psi(x)|^2\,dx,
\qquad
P_{\rm left}=\int_0^{L/2}|\psi(x)|^2\,dx.
\]

The wavefunction has units `L^(-1/2)` and the density has units `L^(-1)`. A density value is not the probability of an exact position. Changing `L` changes these scales; comparing shapes in the dimensionless coordinate `y = x/L` does not remove the normalization factor.

The moments and position variance are

\[
\langle x\rangle=\int_0^Lx|\psi(x)|^2\,dx,
\qquad
\operatorname{Var}(x)=\langle x^2\rangle-\langle x\rangle^2.
\]

These quantities can also be evaluated from matrix elements in the retained sine basis. Energy probabilities and moments of position are different analyses of the same state. No momentum-measurement distribution or finite-resolution position-measurement update is supplied by this experiment. In particular, a Fourier array used in another numerical setting would require its own physical and boundary conventions before it could be called a momentum measurement.

The spatial panels plot dimensionless `y=x/L`, `sqrt(L) Re(psi)`, `sqrt(L) Im(psi)`, and `L|psi|²`. This keeps length comparisons explicit: integrate the displayed density over `y` to obtain probability. Moment tables and spatial CSV files also provide the corresponding physical-coordinate quantities in the declared length convention. Vertical scales remain fixed while inspecting time; a visible clipping notice and explicit **Fit vertical range** action handle curves beyond the current scale.

## The fixed localized target

Comparing truncations requires a target that remains fixed. Let

\[
g(y)=y(1-y)\exp\left[-\frac{(y-1/4)^2}{2(1/10)^2}\right],
\qquad 0\le y\le1,
\]

and set `G = g/‖g‖_{L²(0,1)}`. The normalized spatial target is

\[
\chi(x)=L^{-1/2}G(x/L).
\]

Its projection coefficients are

\[
a_n=\langle\phi_n,\chi\rangle
=\sqrt2\int_0^1G(y)\sin(n\pi y)\,dy.
\]

Compute these integrals for each selected cutoff. The retained **squared norm**, or retained weight, is

\[
\eta_N=\|P_N\chi\|^2=\sum_{n=1}^N|a_n|^2.
\]

The corresponding unit-normalized preparation uses `c_n = a_n/√η_N`. Thus its norm is 1 even when the target has appreciable omitted weight `1−η_N`. If a diagnostic instead displays `√η_N`, its label must identify a norm rather than a squared norm.

For exact orthogonal projection, `η_N` is nondecreasing with `N` and does not exceed 1. Numerical quadrature introduces its own error. The left-half probability of the normalized preparation is a different quantity and need not vary monotonically with `N`. Nor does small omitted norm automatically establish a small energy error: energy weights the coefficients by the growing values `E_n ∝ n²`.

The localized preset is a projection of this stated target, not an optimization of left-half probability. Editing its coefficients produces a new preparation. Any retained-target diagnostic must continue to describe its actual target/projection provenance rather than being silently attached to the edited state.

## Energy measurements and independent copies

The box levels are nondegenerate. An explicit energy measurement returns `E_n` with probability `|c_n|²` and leaves `φ_n`, up to a global phase. A second immediate energy measurement of that same state has the same outcome with probability 1 in this ideal model.

Repeated-preparation sampling instead starts each copy from the captured input state. Its histogram estimates the original energy probabilities without using the previous copy's post-measurement state as the next input. Opening a probability panel or inspecting stored results performs no measurement. Record the input coefficients, model parameters, trial count, and seed with a sampled result.

The position-density plot is mathematical inspection. It does not collapse the state into an exact position eigenstate, and no such nonnormalizable state is represented by the finite sine expansion.

## Hand-checkable reference cases

For an individual level, symmetry gives `⟨x⟩ = L/2` and `P_left = 1/2`. Direct integration gives

\[
\operatorname{Var}_n(x)=L^2\left(\frac1{12}-\frac1{2\pi^2n^2}\right).
\]

For the equal real preparation `(φ_1 + φ_2)/√2`, the density is

\[
|\psi(x,t)|^2
=\frac{\phi_1(x)^2+\phi_2(x)^2}{2}
+\phi_1(x)\phi_2(x)\cos[(E_2-E_1)t].
\]

Using `⟨φ_1,xφ_2⟩ = −16L/(9π²)`, we obtain

\[
\langle x\rangle(t)
=\frac L2-\frac{16L}{9\pi^2}\cos[(E_2-E_1)t].
\]

Likewise,

\[
P_{\rm left}(t)=\frac12+\frac4{3\pi}\cos[(E_2-E_1)t].
\]

The relative-phase angular frequency is `E_2−E_1 = 3π²/(2mL²)` and the interference period is `T = 4mL²/(3π)`. Setting the second coefficient to `i/√2` shifts the interference phase without changing the two energy probabilities or mean energy.

For `L = m = 1`, the ground energy is `π²/2` and the equal two-mode mean energy is `5π²/4`. These cases provide simple references for signs, factors of two, normalization, moments, and time labels. They do not establish that every target-projection or plotting resolution is adequate.

## Exercises and reproducible evidence

E04 compares a stationary density with two-mode interference. E05 projects the same localized target at `N = 4, 8, 16`, retaining the distinction between preparation normalization, target retention, and spatial probability. Reading an exercise or a hint preserves the workspace; applying its starting preset is an explicit action.

The bounded box project combines the ground state, equal two-mode state, and three localized truncations. It requires analytic reference checks, a small independent-copy energy histogram, and an explanation of remaining errors. It does not require a second numerical propagation method or any later oscillator feature.

For a comparison, retain `L`, `m`, `N`, complex preparation coefficients, selected/generated times, and any sampling metadata. Setup JSON, numerical CSV, and SVG figures support different parts of that record. A figure alone is not a complete experiment record. An exported setup describes its included settings; it should not be interpreted as containing unexported sampled histories.

Short code excerpts should identify the actual phase/reconstruction or measurement calculation used by the current build. Exact finite-expansion identities, numerical target quadrature, and sampled measurement frequencies should retain their distinct labels.
