/**
 * Pump Sizing Core Logic
 * Hydraulic Institute aligned checks
 */

export type PumpSafetyClass = 'Marginal' | 'Acceptable' | 'Unsafe';

export const VAPOR_PRESSURE_LIBRARY_BAR: Record<string, number> = {
  Water_25C: 0.0317,
  Water_40C: 0.0738,
  Propane_25C: 9.5,
  Butane_25C: 2.4,
};

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
  frictionLossM: number,
): number {
  if (densityKgM3 <= 0) throw new Error('Invalid density for NPSH calculation (ρ must be > 0).');
  const g = 9.81;
  const hPressure = (suctionPressurePa - vaporPressurePa) / (densityKgM3 * g);
  return hPressure + staticHeadM - frictionLossM;
}

export function evaluateNPSHMargin(
  npsha: number,
  npshr: number,
  marginFraction = 0.1,
  minimumMarginM = 0.5,
): { required: number; margin: number; classification: PumpSafetyClass } {
  const required = npshr + Math.max(npshr * marginFraction, minimumMarginM);
  const margin = npsha - required;

  if (margin >= 0) return { required, margin, classification: 'Acceptable' };
  if (npsha >= npshr) return { required, margin, classification: 'Marginal' };
  return { required, margin, classification: 'Unsafe' };
}

export function viscosityCorrectionWarning(viscosityCst: number): string | undefined {
  if (viscosityCst <= 1 || viscosityCst > 3000) {
    return 'Viscosity correction outside typical HI correction chart range (1-3000 cSt).';
  }
  if (viscosityCst > 300) return 'High viscosity: verify BEP shift and efficiency correction with HI method.';
  return undefined;
}
