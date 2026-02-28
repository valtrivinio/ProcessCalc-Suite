
/**
 * Pump Sizing Core Logic
 * Hydraulic Institute Standards
 */

export function calculateHydraulicPower(flowM3h: number, headM: number, densityKgM3: number): number {
  // P (kW) = (rho * g * Q * H) / (3.6e6) ??
  // Q in m3/h -> m3/s = Q/3600
  // P (W) = rho * 9.81 * (Q/3600) * H
  // P (kW) = P(W) / 1000
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
  // NPSHa = (Ps_abs - Pv_abs)/(rho*g) + Hs - Hf
  // Ps_abs in Pa
  const g = 9.81;
  const h_pressure = (suctionPressurePa - vaporPressurePa) / (densityKgM3 * g);
  
  return h_pressure + staticHeadM - frictionLossM;
}
