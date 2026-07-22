// src/core/fluid/flowEquations.ts
import { R_UNIVERSAL } from '../constants';

export function reynolds(rho: number, v: number, D: number, mu_cP: number) {
  const mu = mu_cP * 0.001;
  if (mu <= 0) return Infinity;
  return (rho * v * D) / mu;
}

export function colebrookFriction(eps: number, D: number, Re: number): number {
  if (Re <= 0) return 0.064;
  if (Re < 2300) return 64 / Re;
  const relRough = eps / D;
  let f = 0.02;
  for (let i = 0; i < 100; i++) {
    const sqrtF = Math.sqrt(f);
    const lhs = 1 / sqrtF;
    const rhs = -2 * Math.log10(relRough / 3.7 + 2.51 / (Re * sqrtF));
    const diff = lhs - rhs;
    if (Math.abs(diff) < 1e-8) return f;
    f = f * (1 - 0.5 * diff / (1 + 2.51/(Re*sqrtF)));
    if (f < 0.001) f = 0.001;
    if (f > 0.1) f = 0.1;
  }
  return f;
}

export function machNumber(v: number, k: number, P: number, rho: number, MW: number, Z: number, T: number) {
  const R_specific = R_UNIVERSAL / (MW / 1000);
  const c = Math.sqrt(k * Z * R_specific * T);
  return v / c;
}
