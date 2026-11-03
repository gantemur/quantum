# Harmonic oscillator and computational methods (Q3)

The oscillator module extends the Quantum laboratory from exact qubit/box investigations to a graduate-level illustration of **approximation and algorithmic progress**. Its two experiments are separate workspaces under the oscillator system.

## Coherent-state evolution

With `ℏ=1`, `m>0` and `ω>0`, the Hamiltonian is `H=ω(a†a+1/2)`. The coherent-state coefficients are

```text
c_n = exp(-|alpha|^2/2) alpha^n / sqrt(n!) ,
E_n = omega (n + 1/2).
```

The application retains the first N components (N ≤ 32), reports the unnormalized retained probability `eta = sum_{n<N}|c_n|²`, then normalizes and evolves that *finite* state with `exp(-i E_n t)`. The comparison labelled classical follows the untruncated coherent-state mean. Differences therefore indicate the finite cutoff, not errors in the exact spectral phases.

The static panels display selected-time position density, the full time history of mean position and width, and the finite ladder commutator. The physical state is **not** advanced by moving the time slider; a full trajectory was calculated earlier.

### Full-observable moments

For a normalized finite coefficient vector, write `A=<a>`, `B=<a²>`, and `nbar=<a†a>`. Then

```text
<x> = sqrt(2/(m omega)) Re A
<p> = sqrt(2 m omega) Im A
<x²> = (2 nbar + 1 + 2 Re B)/(2 m omega)
<p²> = m omega (2 nbar + 1 - 2 Re B)/2 .
```

These are expectations of the **full operators in the finite state**. They must not be replaced by the squares of the projected N×N matrices: `(P_N x P_N)² != P_N x² P_N`, with the difference concentrated at the top cutoff state. For instance, a one-state truncation in the harmonic ground state has `<x²>=1/(2mω)` and `<p²>=mω/2`, not zero. The Q3 recovery explicitly tests this boundary effect.

The displayed position domain covers the classical excursion plus four oscillator length units to avoid cropping displaced coherent states. The grid is for plotting; it does not define a spatial discretization of the Hamiltonian.

## Anharmonic ground state

The selected illustration uses dimensionless

```text
H = p²/2 + x²/2 + lambda x⁴,  0 <= lambda <= 2.
```

**Rayleigh–Ritz:** construct the exact matrix elements of `x⁴` in the first N harmonic eigenfunctions and diagonalize a real symmetric N×N Hamiltonian. Display the smallest Ritz energy and `||H_N c - E_N c||`. This residual measures accuracy within the projected eigenproblem; it is not the error against the infinite-dimensional Hamiltonian.

**Independent refined comparison:** repeat the Ritz calculation with a larger basis (up to 32). The larger-basis result is labelled a numerical reference, not an exact ground-state energy. The comparison does not by itself certify an absolute truncation bound.

**Gaussian variational family:** set `psi_beta(x) ∝ exp(-beta x²/2)` with `beta>0`. Its energy is

```text
E(beta) = (beta + 1/beta)/4 + 3 lambda/(4 beta²).
```

A bounded gradient descent with backtracking retains iterates `(k,beta_k,E_k,E'_k)`. The **iteration number k is computational progress, not physical time**. The Gaussian family gives an upper bound to the exact ground-state energy, even after optimization. Its energy is compared with both Ritz levels, with method-appropriate caveats.

The default history chart scales to the actual iteration and energy ranges. Selecting an earlier k inspects a stored iterate without taking another optimizer step.

## Learning and code

E06 examines coherent motion and truncation; E07 inspects the finite ladder commutator; E09 studies optimization histories; and P02 compares two approximation families over several coupling values. The bottom area includes mathematical background and short source-code excerpts extracted from the actual numerical files during the build.

## Persistence and limits

The method experiment's Save and Restore buttons use browser localStorage with a versioned oscillator-specific schema. Saved records include the two oscillator experiment inputs/results and their time/iteration cursors. Restore validates the record before changing the active results; bad or incompatible records are rejected. This does **not** yet save qubit/box sessions, import arbitrary JSON setup files, or preserve customizable oscillator panel layouts.

Source tests and browser checks cover the scientific identities, boundary/cutoff effects, result selection, invalid-input atomicity, navigation, and bounded restore. Browser viewport testing is not a physical-device or classroom evaluation.
