
/**
 * Heat Transfer Core Logic
 * TEMA / GPSA
 */

export interface LMTDResult {
  value: number;
  valid: boolean;
  temperatureCross: boolean;
}

/**
 * LMTD with validation. Valid only when dTl > 0 and dTr > 0 (no temperature cross).
 */
export function calculateLMTD(
  Th_in: number,
  Th_out: number,
  Tc_in: number,
  Tc_out: number,
  _type: 'counter' | 'parallel' = 'counter'
): LMTDResult {
  const dTl = Th_in - Tc_out;
  const dTr = Th_out - Tc_in;

  if (dTl <= 0 || dTr <= 0) {
    return { value: NaN, valid: false, temperatureCross: true };
  }
  if (dTl === dTr) {
    return { value: dTl, valid: true, temperatureCross: false };
  }
  const lmtd = (dTl - dTr) / Math.log(dTl / dTr);
  const valid = Number.isFinite(lmtd) && lmtd > 0;
  return { value: lmtd, valid, temperatureCross: false };
}

export function calculateFt(
  Th_in: number,
  Th_out: number,
  Tc_in: number,
  Tc_out: number
): number {
  // 1-2 Shell/Tube Correction Factor
  const R = (Th_in - Th_out) / (Tc_out - Tc_in);
  const P = (Tc_out - Tc_in) / (Th_in - Tc_in);

  if (!Number.isFinite(R) || !Number.isFinite(P)) return NaN;
  if (Th_in - Tc_in === 0) return NaN;
  if (R === 1) return NaN;
  if (P >= 1 || P <= 0 || R <= 0) return NaN;

  const sqrtR2P1 = Math.sqrt(R * R + 1);
  const den = (R - 1) * Math.log((2 - P * (R + 1 - sqrtR2P1)) / (2 - P * (R + 1 + sqrtR2P1)));
  if (den === 0 || !Number.isFinite(den)) return NaN;

  const num = sqrtR2P1 * Math.log((1 - P) / (1 - R * P));
  if (!Number.isFinite(num)) return NaN;

  return num / den;
}

export const FOULING_FACTORS = {
  'Clean': 0.0000,
  'Water (Treated)': 0.00018,
  'Water (River)': 0.00035,
  'Oil (Light)': 0.00018,
  'Oil (Heavy)': 0.00035,
  'Gas (Clean)': 0.00018,
  'Gas (Dirty)': 0.00035,
};
