export const API_ORIFICES = {
  D: 7.69,
  E: 12.45,
  F: 19.61,
  G: 31.61,
  H: 49.83,
  J: 78.97,
  K: 126.45,
  L: 197.93,
  M: 316.13,
  N: 506.45,
  P: 806.45,
  Q: 1290.32,
  R: 2064.52,
  T: 3193.55,
};
export function api520Gas(W, T, P1, P2, M, k, Z, Kd = 0.975, Kb = 1, Kc = 1) {
  const C = 520 * Math.sqrt(k * Math.pow(2/(k+1), (k+1)/(k-1)));
  const r = P2 / P1;
  let F2 = 1;
  if (r > Math.pow(2/(k+1), k/(k-1))) {
    F2 = Math.sqrt( (k/(k-1)) * ( Math.pow(r, 2/k) * (1 - Math.pow(r, (k-1)/k)) ) / (1 - r) );
  }
  const A = (W * Math.sqrt(T * Z)) / (C * Kd * P1 * Kb * Kc * Math.sqrt(M));
  return { area: A, F2, choked: F2 === 1 };
}
export function calculateReliefArea(W, T, P1, P2, M, k, Z, Kd = 0.975, Kb = 1, Kc = 1) {
  return api520Gas(W, T, P1, P2, M, k, Z, Kd, Kb, Kc);
}
