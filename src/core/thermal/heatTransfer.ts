export function dittusBoelter(Re, Pr, cooling = false) {
  const n = cooling ? 0.3 : 0.4;
  return 0.023 * Math.pow(Re, 0.8) * Math.pow(Pr, n);
}
export function heatTransferCoefficient(Re, Pr, k_fluid, D, cooling) {
  const Nu = dittusBoelter(Re, Pr, cooling);
  return (Nu * k_fluid) / D;
}
export function lmtd(T_h_in, T_h_out, T_c_in, T_c_out) {
  const dT1 = T_h_in - T_c_out;
  const dT2 = T_h_out - T_c_in;
  if (Math.abs(dT1 - dT2) < 0.001) return dT1;
  return (dT1 - dT2) / Math.log(dT1 / dT2);
}
export const calculateLMTD = lmtd;
export function heatDuty(U, A, LMTD, F = 1) {
  return U * A * LMTD * F;
}
export function calculateFt(T_h_in, T_h_out, T_c_in, T_c_out, passes = '1-2') {
  if (T_h_out <= T_c_out) return 1.0;
  const dT1 = T_h_in - T_c_out;
  const dT2 = T_h_out - T_c_in;
  const R = dT1 / dT2;
  const S = (T_c_out - T_c_in) / (T_h_in - T_c_in);
  if (R === 1) return 0.95;
  try {
    const sqrtR2Plus1 = Math.sqrt(R * R + 1);
    const numerator = 1 - S;
    const denominator = 1 - S * R;
    if (denominator <= 0 || numerator <= 0) return 0.90;
    const term1 = (1 - S) / (1 - S * R);
    const term2 = (2 / S) - 1 - R + sqrtR2Plus1;
    const term3 = (2 / S) - 1 - R - sqrtR2Plus1;
    if (term2 <= 0 || term3 <= 0) return 0.90;
    const logArg1 = term1;
    const logArg2 = term2 / term3;
    if (logArg1 <= 0 || logArg2 <= 0) return 0.90;
    const Ft = (sqrtR2Plus1 / (R - 1)) * (Math.log(logArg1) / Math.log(logArg2));
    return Math.min(Math.max(Ft, 0.70), 1.0);
  } catch { return 0.90; }
}
export const FOULING_FACTORS = {
  'water-distilled': 0.00009,
  'water-cooling-tower': 0.00018,
  'water-sea': 0.00009,
  'water-brackish': 0.00035,
  'air': 0.00018,
  'flue-gas': 0.00035,
  'hydrocarbon-gas': 0.00018,
  'crude-oil': 0.00035,
  'fuel-oil': 0.00053,
  'gasoline': 0.00018,
  'kerosene': 0.00018,
  'light-hydrocarbon': 0.00018,
  'heavy-hydrocarbon': 0.00035,
  'steam-oil': 0.00018,
  'steam-water': 0.00009,
  'refrigerant-liquid': 0.00018,
  'refrigerant-gas': 0.00009,
  'default': 0.00018,
};
export function getFoulingFactor(fluid) {
  return FOULING_FACTORS[fluid] ?? FOULING_FACTORS.default;
}
