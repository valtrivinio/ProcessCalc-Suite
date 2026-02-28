
/**
 * Heat Transfer Core Logic
 * TEMA / GPSA
 */

export function calculateLMTD(
  Th_in: number, 
  Th_out: number, 
  Tc_in: number, 
  Tc_out: number, 
  type: 'counter' | 'parallel' = 'counter'
): number {
  const dTl = Th_in - Tc_out;
  const dTr = Th_out - Tc_in;
  
  if (dTl === dTr) return dTl;
  return (dTl - dTr) / Math.log(dTl / dTr);
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
  
  const sqrtR2P1 = Math.sqrt(R * R + 1);
  const num = sqrtR2P1 * Math.log((1 - P) / (1 - R * P));
  const den = (R - 1) * Math.log((2 - P * (R + 1 - sqrtR2P1)) / (2 - P * (R + 1 + sqrtR2P1)));
  
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
