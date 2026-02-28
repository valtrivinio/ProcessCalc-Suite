
/**
 * Peng-Robinson Equation of State Implementation
 */

export interface FluidState {
  temperature: number; // C
  pressure: number; // bar
  phase: 'Liquid' | 'Vapor' | 'Two-Phase' | 'Supercritical';
  compressibility: number; // Z
  density: number; // kg/m3
  enthalpy: number; // kJ/kg (Departure from Ideal Gas)
  entropy: number; // kJ/kg.K
  viscosity: number; // cP (Correlation)
  molecularWeight: number; // g/mol
}

export interface Component {
  name: string;
  Tc: number; // Critical Temp (K)
  Pc: number; // Critical Pressure (bar)
  omega: number; // Acentric Factor
  MW: number; // g/mol
}

export const COMPONENTS: Record<string, Component> = {
  Methane: { name: 'Methane', Tc: 190.56, Pc: 45.99, omega: 0.011, MW: 16.04 },
  Ethane: { name: 'Ethane', Tc: 305.32, Pc: 48.72, omega: 0.099, MW: 30.07 },
  Propane: { name: 'Propane', Tc: 369.83, Pc: 42.48, omega: 0.152, MW: 44.1 },
  Butane: { name: 'Butane', Tc: 425.12, Pc: 37.96, omega: 0.2, MW: 58.12 },
  Pentane: { name: 'Pentane', Tc: 469.7, Pc: 33.7, omega: 0.251, MW: 72.15 },
  Hexane: { name: 'Hexane', Tc: 507.6, Pc: 30.25, omega: 0.301, MW: 86.18 },
  Nitrogen: { name: 'Nitrogen', Tc: 126.2, Pc: 33.9, omega: 0.037, MW: 28.01 },
  CO2: { name: 'CO2', Tc: 304.1, Pc: 73.8, omega: 0.224, MW: 44.01 },
  Water: { name: 'Water', Tc: 647.1, Pc: 220.6, omega: 0.344, MW: 18.02 },
};

export function calculateEOS(componentName: string, T_C: number, P_bar: number): FluidState {
  const comp = COMPONENTS[componentName];
  if (!comp) throw new Error(`Component ${componentName} not found`);

  const T = T_C + 273.15; // K
  const P = P_bar; // bar
  const R = 0.08314; // bar.L/(mol.K)

  const Tr = T / comp.Tc;
  const Pr = P / comp.Pc;

  // Peng-Robinson Parameters
  const kappa = 0.37464 + 1.54226 * comp.omega - 0.26992 * comp.omega ** 2;
  const alpha = (1 + kappa * (1 - Math.sqrt(Tr))) ** 2;

  const a = 0.45724 * (R * comp.Tc) ** 2 * alpha / comp.Pc;
  const b = 0.07780 * R * comp.Tc / comp.Pc;

  const A = a * P / (R * T) ** 2;
  const B = b * P / (R * T);

  // Cubic Equation: Z^3 - (1-B)Z^2 + (A - 3B^2 - 2B)Z - (AB - B^2 - B^3) = 0
  const c2 = -(1 - B);
  const c1 = A - 3 * B ** 2 - 2 * B;
  const c0 = -(A * B - B ** 2 - B ** 3);

  const roots = solveCubic(1, c2, c1, c0);
  
  // Root Selection
  // If 1 real root: Supercritical or Single Phase
  // If 3 real roots: Two Phase (Smallest = Liquid Z, Largest = Vapor Z)
  // We need to check Gibbs energy to find stable phase, but for simplicity:
  // If Tr < 1 and Pr < 1 (roughly), check vapor pressure.
  
  let Z = 0;
  let phase: FluidState['phase'] = 'Vapor'; // Default

  // Filter real positive roots
  const realRoots = roots.filter(r => r > 0);
  
  if (realRoots.length === 1) {
    Z = realRoots[0];
    phase = Tr > 1 ? 'Supercritical' : (P > comp.Pc ? 'Liquid' : 'Vapor'); // Simplified
  } else {
    // 3 roots
    const Z_vap = Math.max(...realRoots);
    const Z_liq = Math.min(...realRoots);
    
    // Determine phase stability via Fugacity or simple Psat check
    // Using Wilson's correlation for Psat
    const Psat_approx = comp.Pc * Math.exp(5.37 * (1 + comp.omega) * (1 - 1/Tr));
    
    if (P > Psat_approx) {
      Z = Z_liq;
      phase = 'Liquid';
    } else {
      Z = Z_vap;
      phase = 'Vapor';
    }
  }

  // Density
  // rho = P * MW / (Z * R * T)  (g/L = kg/m3)
  // R in bar.L/mol.K
  const density = (P * comp.MW) / (Z * R * T);

  // Viscosity (Lucas Method or simple correlation)
  // Simplified gas viscosity
  const visc = 0.01; // Placeholder for complex viscosity logic

  return {
    temperature: T_C,
    pressure: P_bar,
    phase,
    compressibility: Z,
    density,
    enthalpy: 0, // Needs departure function implementation
    entropy: 0,
    viscosity: visc,
    molecularWeight: comp.MW
  };
}

function solveCubic(a: number, b: number, c: number, d: number): number[] {
  // Cardano's method
  if (Math.abs(a) < 1e-9) return []; // Not cubic
  
  const p = (3*a*c - b*b)/(3*a*a);
  const q = (2*b*b*b - 9*a*b*c + 27*a*a*d)/(27*a*a*a);
  
  // Discriminant
  const D = (q/2)**2 + (p/3)**3;
  
  if (D > 0) {
    const u = Math.cbrt(-q/2 + Math.sqrt(D));
    const v = Math.cbrt(-q/2 - Math.sqrt(D));
    return [u + v - b/(3*a)];
  } else if (D === 0) {
    const u = Math.cbrt(-q/2);
    return [2*u - b/(3*a), -u - b/(3*a)];
  } else {
    const r = Math.sqrt(Math.pow(-(p/3), 3));
    const phi = Math.acos(-q/(2*r));
    const t1 = 2 * Math.cbrt(r) * Math.cos(phi/3) - b/(3*a); // Wait, r is sqrt, not cbrt
    // Trigonometric solution for 3 real roots
    const k = 2 * Math.sqrt(-p/3);
    return [
      k * Math.cos(phi/3) - b/(3*a),
      k * Math.cos((phi + 2*Math.PI)/3) - b/(3*a),
      k * Math.cos((phi + 4*Math.PI)/3) - b/(3*a)
    ];
  }
}
