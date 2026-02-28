
/**
 * API 520 Part I - Relief Valve Sizing
 */

export interface ReliefResult {
  area: number; // in2
  designation: string; // API Letter
  ratedFlow: number; // lb/h
  isSubcritical: boolean;
  criticalPressure: number; // psia
}

export const API_ORIFICES = [
  { letter: 'D', area: 0.110 },
  { letter: 'E', area: 0.196 },
  { letter: 'F', area: 0.307 },
  { letter: 'G', area: 0.503 },
  { letter: 'H', area: 0.785 },
  { letter: 'J', area: 1.287 },
  { letter: 'K', area: 1.838 },
  { letter: 'L', area: 2.853 },
  { letter: 'M', area: 3.60 },
  { letter: 'N', area: 4.34 },
  { letter: 'P', area: 6.38 },
  { letter: 'Q', area: 11.05 },
  { letter: 'R', area: 16.00 },
  { letter: 'T', area: 26.00 },
];

export function calculateReliefArea(
  W: number, // lb/h
  P1: number, // psia (Relieving Pressure)
  P2: number, // psia (Back Pressure)
  T: number, // R (Relieving Temp)
  Z: number, // Compressibility
  M: number, // MW
  k: number, // Cp/Cv
  Kd: number = 0.975,
  Kb: number = 1.0,
  Kc: number = 1.0
): ReliefResult {
  
  // Critical Pressure Ratio
  // Pcf = P1 * (2/(k+1))^(k/(k-1))
  const criticalRatio = Math.pow(2 / (k + 1), k / (k - 1));
  const Pcf = P1 * criticalRatio;
  
  let isSubcritical = false;
  const C = 520 * Math.sqrt(k * Math.pow(2 / (k + 1), (k + 1) / (k - 1)));

  // Subcritical flow: F2 factor (API 520 backpressure correction for subcritical)
  // F2 = sqrt( (k/(k-1)) * (r^(2/k) - r^((k+1)/k)) ), r = P2/P1
  let F2 = 1.0;
  if (P2 > Pcf) {
    isSubcritical = true;
    const r = P2 / P1;
    const term1 = k / (k - 1);
    const term2 = Math.pow(r, 2 / k) - Math.pow(r, (k + 1) / k);
    F2 = Math.sqrt(term1 * term2);
    if (F2 <= 0 || !Number.isFinite(F2)) F2 = 0.01; // guard: avoid division by zero
  }

  // Area: Critical  A = W*sqrt(T*Z) / (C*Kd*P1*Kb*Kc*sqrt(M))
  //       Subcritical: same with F2 in denominator (larger area) — API 520 Eq for subcritical
  const area = (W * Math.sqrt(T * Z)) / (C * F2 * Kd * P1 * Kb * Kc * Math.sqrt(M));
  
  // Select Orifice
  const selected = API_ORIFICES.find(o => o.area >= area) || API_ORIFICES[API_ORIFICES.length - 1];
  
  return {
    area,
    designation: selected.letter,
    ratedFlow: W * (selected.area / area),
    isSubcritical,
    criticalPressure: Pcf
  };
}
