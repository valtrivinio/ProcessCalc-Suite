
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

/** Sonic velocity for gas: c = sqrt(k * Z * R * T / M), R=8314 J/(kmol·K), M in g/mol */
export function sonicVelocityGas(k: number, T_K: number, MW: number, Z: number): number {
  const R = 8314; // J/(kmol·K)
  return Math.sqrt((k * Z * R * T_K) / MW);
}

/**
 * Isothermal compressible gas pressure drop (Crane TP-410, ideal gas with Z).
 * P1^2 - P2^2 = (f*L/D) * (W/A)^2 * (R*T/(M*Z))  with W = mass flow kg/s, A m², P Pa, R=8314, M=MW g/mol.
 * Returns dP in Pa (P1 - P2). Choke check: if P2 would be <= P_critical, flow is choked.
 */
export function calculatePressureDropCompressibleIsothermal(
  P1_Pa: number,
  T_K: number,
  MW: number,
  Z: number,
  massFlow_kg_s: number,
  f: number,
  L: number,
  D: number,
  A_m2: number
): { dP_Pa: number; P2_Pa: number; isChoked: boolean } {
  const R = 8314; // J/(kmol·K)
  const term = (f * L / D) * Math.pow(massFlow_kg_s / A_m2, 2) * (R * T_K / (MW * Z));
  const P2_sq = P1_Pa * P1_Pa - term;
  if (P2_sq <= 0) {
    // Choked: sonic at exit
    const P_critical = P1_Pa * 0.55; // approx critical pressure ratio ~0.55 for isothermal
    return { dP_Pa: P1_Pa - P_critical, P2_Pa: P_critical, isChoked: true };
  }
  const P2_Pa = Math.sqrt(P2_sq);
  return { dP_Pa: P1_Pa - P2_Pa, P2_Pa, isChoked: false };
}
