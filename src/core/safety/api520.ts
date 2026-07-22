// src/core/safety/api520.ts

export function api520Gas(
  W: number, T: number, P1: number, P2: number,
  M: number, k: number, Z: number,
  Kd: number = 0.975, Kb: number = 1, Kc: number = 1
) {
  const C = 520 * Math.sqrt(k * Math.pow(2/(k+1), (k+1)/(k-1)));
  const r = P2 / P1;
  let F2 = 1;
  if (r > Math.pow(2/(k+1), k/(k-1))) {
    F2 = Math.sqrt( (k/(k-1)) * ( Math.pow(r, 2/k) * (1 - Math.pow(r, (k-1)/k)) ) / (1 - r) );
  }
  const A = (W * Math.sqrt(T * Z)) / (C * Kd * P1 * Kb * Kc * Math.sqrt(M));
  return { area: A, F2, choked: F2 === 1 };
}

// Alias for UI compatibility (in case it expects sizeReliefValve)
export const sizeReliefValve = api520Gas;
