
/**
 * Pipe Sizing Core Logic
 * ASME B36.10M / Crane TP-410
 */

export interface PipeSchedule {
  nps: string;
  schedule: string;
  id_mm: number;
  od_mm: number;
  wall_mm: number;
}

export const PIPE_DATABASE: PipeSchedule[] = [
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
  return (density * velocity * diameter) / viscosity;
}

export function calculateFrictionFactor(
  reynolds: number,
  roughness: number, // m
  diameter: number // m
): number {
  // Colebrook-White Iteration
  // 1/sqrt(f) = -2 log10( (e/D)/3.7 + 2.51/(Re*sqrt(f)) )
  
  if (reynolds < 2300) return 64 / reynolds; // Laminar

  let f = 0.02; // Initial guess
  for (let i = 0; i < 20; i++) {
    const term = (roughness / diameter) / 3.7 + 2.51 / (reynolds * Math.sqrt(f));
    const f_new = 1 / Math.pow(-2 * Math.log10(term), 2);
    if (Math.abs(f - f_new) < 1e-6) return f_new;
    f = f_new;
  }
  return f;
}

export function calculatePressureDrop(
  f: number,
  L: number, // m
  D: number, // m
  rho: number, // kg/m3
  v: number // m/s
): number {
  // Darcy-Weisbach: dP = f * (L/D) * (rho * v^2 / 2)
  return f * (L / D) * (rho * v * v / 2); // Pa
}
