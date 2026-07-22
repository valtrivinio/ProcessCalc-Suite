// src/core/thermal/heatTransfer.ts

// --- Original functions (kept for compatibility) ---

export function dittusBoelter(Re: number, Pr: number, cooling: boolean = false) {
  const n = cooling ? 0.3 : 0.4;
  return 0.023 * Math.pow(Re, 0.8) * Math.pow(Pr, n);
}

export function heatTransferCoefficient(Re: number, Pr: number, k_fluid: number, D: number, cooling?: boolean) {
  const Nu = dittusBoelter(Re, Pr, cooling);
  return (Nu * k_fluid) / D;
}

export function lmtd(T_h_in: number, T_h_out: number, T_c_in: number, T_c_out: number) {
  const dT1 = T_h_in - T_c_out;
  const dT2 = T_h_out - T_c_in;
  if (Math.abs(dT1 - dT2) < 0.001) return dT1;
  return (dT1 - dT2) / Math.log(dT1 / dT2);
}

export function heatDuty(U: number, A: number, LMTD: number, F: number = 1) {
  return U * A * LMTD * F;
}

// --- Aliases / additions for UI compatibility ---

// Alias for lmtd – matches what HeatTransfer.tsx expects
export const calculateLMTD = lmtd;

// LMTD correction factor for shell-and-tube heat exchangers (1-2 pass)
// Based on Bowman et al. correlation (simplified)
export function calculateFt(
  T_h_in: number,
  T_h_out: number,
  T_c_in: number,
  T_c_out: number,
  passes: '1-2' | '2-4' = '1-2'
): number {
  // If no temperature cross, Ft = 1.0
  if (T_h_out <= T_c_out) return 1.0;

  const dT1 = T_h_in - T_c_out;
  const dT2 = T_h_out - T_c_in;
  const R = dT1 / dT2;
  const S = (T_c_out - T_c_in) / (T_h_in - T_c_in);

  // For 1-2 pass shell-and-tube, approximate Ft using standard correlation
  // This is a simplified version – for production, use a proper curve fit
  if (R === 1) {
    const denominator = 1 - S * (1 - 1 / R);
    if (denominator <= 0) return 0.95;
    return 0.95; // Approximate for R=1
  }

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
    return Math.min(Math.max(Ft, 0.70), 1.0); // Clamp to reasonable range
  } catch {
    return 0.90; // Fallback
  }
}

// Common fouling factors (m²·K/W) – from TEMA standards
export const FOULING_FACTORS = {
  // Water
  'water-distilled': 0.00009,
  'water-cooling-tower': 0.00018,
  'water-sea': 0.00009,
  'water-brackish': 0.00035,
  // Gases
  'air': 0.00018,
  'flue-gas': 0.00035,
  'hydrocarbon-gas': 0.00018,
  // Liquids
  'crude-oil': 0.00035,
  'fuel-oil': 0.00053,
  'gasoline': 0.00018,
  'kerosene': 0.00018,
  'light-hydrocarbon': 0.00018,
  'heavy-hydrocarbon': 0.00035,
  // Process streams
  'steam-oil': 0.00018,
  'steam-water': 0.00009,
  'refrigerant-liquid': 0.00018,
  'refrigerant-gas': 0.00009,
  // Default
  'default': 0.00018,
} as const;

export type FoulingFluid = keyof typeof FOULING_FACTORS;

// Helper to get fouling factor with fallback
export function getFoulingFactor(fluid: string): number {
  return FOULING_FACTORS[fluid as FoulingFluid] ?? FOULING_FACTORS.default;
}
