# Oscillator laboratory

The Q3 oscillator laboratory has two experiments with deliberately different coordinates.

## Coherent motion

For
[
H=rac{p^2}{2m}+rac12momega^2x^2,qquad
E_n=omega(n+	frac12),
]
the coherent state is represented in a finite harmonic basis by
[
c_n=e^{-|alpha|^2/2}rac{alpha^n}{sqrt{n!}},qquad n=0,ldots,N-1.
]
The interface reports the retained probability weight before renormalizing the truncated vector. Time evolution uses the exact spectral phases in this retained space.

The main comparison is between the quantum first moments and the classical oscillator with the same coherent amplitude. The finite matrices for the ladder operators also expose the inevitable cutoff defect in ([a,a^dagger]): low states see the canonical value, while the top retained state compensates so the finite-dimensional commutator has zero trace.

## Anharmonic method comparison

The bounded model is
[
H=rac12(p^2+x^2)+lambda x^4,qquad hbar=m=omega=1.
]

Rayleigh–Ritz uses the first (N) harmonic states. The projected (x^4) matrix is assembled from its exact harmonic-basis matrix elements before truncation, so increasing (N) gives nested trial spaces and the ground-state energy has the usual variational upper-bound behavior. A separately refined basis provides the reference used in the interface. The displayed residual is
[
|Hc-Ec|_2.
]

The second method uses the normalized Gaussian family
[
psi_eta(x)=(eta/pi)^{1/4}e^{-eta x^2/2},qquad eta>0,
]
whose energy is
[
E(eta)=rac14(eta+eta^{-1})+rac{3lambda}{4eta^2}.
]
A deterministic bounded gradient iteration retains every iterate. Its iteration number is a computational coordinate, not physical time. A small gradient only certifies stationarity inside this one-parameter family; it is not a discretization or model-error certificate.

## Activities

- **E06:** coherent motion, uncertainty, and cutoff.
- **E07:** ladder-operator algebra under finite truncation.
- **E09:** energy landscape and deterministic optimization history.
- **P02:** compare the Gaussian variational family with finite-basis Rayleigh–Ritz over several couplings, using basis refinement as an independent reference.

Workspace save/restore is versioned and deliberately bounded to the oscillator Q3 workspace. CSV exports label either physical time or algorithm iteration explicitly.
