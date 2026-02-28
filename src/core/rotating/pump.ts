/**
 * Pump Sizing Core Logic
 * Hydraulic Institute Standards
 */

export function calculateHydraulicPower(flowM3h: number, headM: number, densityKgM3: number): number {
  const g = 9.81;
  const Q_m3s = flowM3h / 3600;
  return (densityKgM3 * g * Q_m3s * headM) / 1000;
}

export function calculateNPSHa(
  suctionPressurePa: number,
  vaporPressurePa: number,
  densityKgM3: number,
  staticHeadM: number,
  frictionLossM: number
): number {
  const g = 9.81;
  const h_pressure = (suctionPressurePa - vaporPressurePa) / (densityKgM3 * g);
  return h_pressure + staticHeadM - frictionLossM;
}

/** NPSH design check: fail when NPSHa < 0 or NPSHa < NPSHr (when NPSHr provided). */
export function npshaDesignValid(npshaM: number, npshrM?: number): { valid: boolean; failReason?: string } {
  if (npshaM < 0) return { valid: false, failReason: 'NPSHa is negative — design invalid, cavitation guaranteed.' };
  if (npshrM != null && npshaM < npshrM) return { valid: false, failReason: `NPSHa (${npshaM.toFixed(2)} m) is less than NPSHr (${npshrM.toFixed(2)} m) — design invalid.` };
  return { valid: true };
}

/**
 * Hydraulic Institute viscosity correction (approximate). For viscosity > 10 cP, head and efficiency are reduced.
 * Returns correction factors for head (C_H) and efficiency (C_E). Corrected head = C_H * H, corrected eff = eff * C_E.
 */
export function viscosityCorrectionFactors(viscosityCp: number): { headFactor: number; efficiencyFactor: number } {
  if (viscosityCp <= 10) return { headFactor: 1, efficiencyFactor: 1 };
  // Approximate HI curves: head factor drops to ~0.8–0.9 at 100 cP, efficiency to ~0.5–0.7
  const logVis = Math.log10(Math.max(10, viscosityCp));
  const headFactor = Math.max(0.5, 1 - 0.08 * (logVis - 1));
  const efficiencyFactor = Math.max(0.4, 1 - 0.15 * (logVis - 1));
  return { headFactor, efficiencyFactor };
}

/**
 * Saturation vapor pressure of water (bar) from Antoine-style correlation. Valid ~0–100 °C.
 */
export function vaporPressureWaterBar(tempC: number): number {
  if (tempC >= 373.95) return 220.6; // critical
  const T = tempC + 273.15;
  const lnP = 23.196 - 3816.44 / (T - 46.13);
  return Math.exp(lnP) / 1e5;
}
