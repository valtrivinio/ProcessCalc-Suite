
/**
 * Pipe Sizing Core Logic
 * ASME B36.10M / Crane TP-410 / GPSA
 */

export interface PipeSchedule {
  nps: string;
  schedule: string;
  id_mm: number;
  od_mm: number;
  wall_mm: number;
}

export const PIPE_DATABASE: PipeSchedule[] = [
  { nps: '0.5', schedule: '40', id_mm: 15.8, od_mm: 21.3, wall_mm: 2.77 },
  { nps: '0.75', schedule: '40', id_mm: 20.9, od_mm: 26.7, wall_mm: 2.87 },
  { nps: '1', schedule: '40', id_mm: 26.6, od_mm: 33.4, wall_mm: 3.38 },
  { nps: '1.5', schedule: '40', id_mm: 40.9, od_mm: 48.3, wall_mm: 3.68 },
  { nps: '2', schedule: '40', id_mm: 52.5, od_mm: 60.3, wall_mm: 3.91 },
  { nps: '2', schedule: '80', id_mm: 49.3, od_mm: 60.3, wall_mm: 5.54 },
  { nps: '3', schedule: '40', id_mm: 77.9, od_mm: 88.9, wall_mm: 5.49 },
  { nps: '4', schedule: '40', id_mm: 102.3, od_mm: 114.3, wall_mm: 6.02 },
  { nps: '6', schedule: '40', id_mm: 154.1, od_mm: 168.3, wall_mm: 7.11 },
  { nps: '8', schedule: '40', id_mm: 202.7, od_mm: 219.1, wall_mm: 8.18 },
  { nps: '10', schedule: '40', id_mm: 254.5, od_mm: 273.0, wall_mm: 9.27 },
  { nps: '12', schedule: '40', id_mm: 304.8, od_mm: 323.8, wall_mm: 9.52 },
];

export function calculateReynolds(
  density: number, // kg/m3
  velocity: number, // m/s
  diameter: number, // m
  viscosity: number // Pa.s (kg/m.s)
): number {
  return (density * velocity * diameter) / Math.max(viscosity, 1e-10);
}

/**
 * Haaland equation for explicit friction factor calculation
 */
export function calculateFrictionFactorHaaland(
  reynolds: number,
  roughness: number, // m
  diameter: number // m
): number {
  if (reynolds < 2300) return 64 / Math.max(reynolds, 1);
  
  const term1 = Math.pow(6.9 / reynolds, 1.11);
  const term2 = (roughness / diameter) / 3.7;
  const f_inv_sqrt = -1.8 * Math.log10(term1 + term2);
  return 1 / Math.pow(f_inv_sqrt, 2);
}

export function calculateFrictionFactor(
  reynolds: number,
  roughness: number, // m
  diameter: number // m
): number {
  if (reynolds < 2300) return 64 / Math.max(reynolds, 1);
  
  // Colebrook-White Iteration
  let f = calculateFrictionFactorHaaland(reynolds, roughness, diameter);
  for (let i = 0; i < 10; i++) {
    const term = (roughness / diameter) / 3.7 + 2.51 / (reynolds * Math.sqrt(f));
    const f_new = 1 / Math.pow(-2 * Math.log10(term), 2);
    if (Math.abs(f - f_new) < 1e-7) return f_new;
    f = f_new;
  }
  return f;
}

export function calculatePressureDrop(
  f: number,
  L: number, // m
  D: number, // m
  rho: number, // kg/m3
  v: number, // m/s
  sumK: number = 0 // Minor losses
): number {
  // Darcy-Weisbach: dP = (f * L/D + sumK) * (rho * v^2 / 2)
  return (f * (L / D) + sumK) * (rho * v * v / 2); // Pa
}

/**
 * Critical Pressure Ratio for Gas Choke
 */
export function calculateCriticalPressureRatio(k: number): number {
  return Math.pow(2 / (k + 1), k / (k - 1));
}
