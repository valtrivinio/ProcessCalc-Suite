/**
 * Alternative pipe flow equations (Newton-Raphson Colebrook, Mach from k/P/rho).
 * Not used by the UI; PipeSizing uses src/core/fluid/pipeSizing.ts.
 */
export const GRAVITY = 9.80665; // m/s^2
export const ATM_PA = 101325; // Pa

/**
 * Calculate Reynolds Number
 * @param rho Density (kg/m3)
 * @param v Velocity (m/s)
 * @param D Diameter (m)
 * @param mu Viscosity (cP)
 */
export function calculateReynolds(rho: number, v: number, D: number, mu: number): number {
  const mu_Pas = mu * 0.001;
  if (mu_Pas <= 0) return 0;
  return (rho * v * D) / mu_Pas;
}

/**
 * Solve Colebrook-White Equation for Friction Factor (f)
 * 1/sqrt(f) = -2 * log10( (eps/3.7D) + (2.51 / (Re * sqrt(f))) )
 * Uses Newton-Raphson iteration
 */
export function solveColebrook(Re: number, eps: number, D: number): number {
  if (Re < 2300) {
    return 64 / Re; // Laminar
  }

  // Initial guess: Swamee-Jain
  const term1 = eps / (3.7 * D);
  const term2 = 5.74 / Math.pow(Re, 0.9);
  let f = 0.25 / Math.pow(Math.log10(term1 + term2), 2);

  // Newton-Raphson
  for (let i = 0; i < 10; i++) {
    const sqrtF = Math.sqrt(f);
    const term = (eps / (3.7 * D)) + (2.51 / (Re * sqrtF));
    const g = (1 / sqrtF) + 2 * Math.log10(term);
    const dg = -0.5 * Math.pow(f, -1.5) + (2 / (Math.LN10 * term)) * (-1.255 / (Re * f * sqrtF));
    
    const f_new = f - (g / dg);
    if (Math.abs(f_new - f) < 1e-6) return f_new;
    f = f_new;
  }
  return f;
}

/**
 * Calculate Darcy-Weisbach Pressure Drop
 * dP = f * (L/D) * (rho * v^2 / 2)
 */
export function calculateDarcydP(f: number, L: number, D: number, rho: number, v: number): number {
  return f * (L / D) * (rho * v * v / 2); // Pa
}

/**
 * Calculate Mach Number
 * @param v Velocity (m/s)
 * @param k Heat Capacity Ratio (Cp/Cv)
 * @param P Pressure (Pa)
 * @param rho Density (kg/m3)
 */
export function calculateMach(v: number, k: number, P: number, rho: number): number {
  // Sonic velocity c = sqrt(k * P / rho) for ideal gas? 
  // Or c = sqrt(k * Z * R * T / M)
  // Let's use P/rho relationship: c = sqrt(k * P / rho)
  if (rho <= 0 || P <= 0) return 0;
  const c = Math.sqrt(k * P / rho);
  return v / c;
}
