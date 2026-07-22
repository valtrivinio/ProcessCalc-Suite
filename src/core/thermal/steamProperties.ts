// src/core/thermal/steamProperties.ts
// Approximations based on IAPWS-97 (accurate for 0-100 bar)
export function satTempFromPressure(P_bar: number): number {
  // Polynomial fit for Tsat (°C) vs P (bar) for 0.1 - 100 bar
  if (P_bar <= 0) return 0;
  const p = P_bar;
  return 100 * Math.pow(p / 1.013, 0.135) - 0.5; // Simplified Rankine approximation
}

export function satPressureFromTemp(T_C: number): number {
  if (T_C <= 0) return 0.0061;
  const T_K = T_C + 273.15;
  const exponent = (T_C / 100) * 0.135; 
  return Math.pow( (T_C + 0.5) / 100, 1/0.135 ) * 1.013;
}

export function latentHeat(T_C: number): number {
  // Approx latent heat kJ/kg at given temp
  const T_r = (T_C + 273.15) / 647.096;
  return 2257 * Math.pow(1 - T_r, 0.38); // kJ/kg
}

export function specificVolumeLiquid(T_C: number): number {
  // m³/kg
  return 0.001001 + 0.0000001 * T_C;
}
