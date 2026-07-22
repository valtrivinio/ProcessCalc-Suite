
/**
 * Thermodynamic Property Engine
 * Modular architecture supporting multiple EOS models
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

export interface MixtureComponent {
  component: Component;
  moleFraction: number;
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

export type PropertyModel = 'Peng-Robinson' | 'SRK' | 'NRTL' | 'UNIQUAC';

export interface PropertyPackage {
  name: PropertyModel;
  calculate(mixture: MixtureComponent[], T_C: number, P_bar: number): FluidState;
}

/**
 * Peng-Robinson Implementation with Multi-component Mixing Rules
 */
export class PengRobinsonPackage implements PropertyPackage {
  name: PropertyModel = 'Peng-Robinson';

  calculate(mixture: MixtureComponent[], T_C: number, P_bar: number): FluidState {
    const T = T_C + 273.15; // K
    const P = P_bar; // bar
    const R = 0.08314; // bar.L/(mol.K)

    // 1. Calculate individual component parameters
    const comps = mixture.map(m => {
      const Tr = T / m.component.Tc;
      const kappa = 0.37464 + 1.54226 * m.component.omega - 0.26992 * m.component.omega ** 2;
      const alpha = (1 + kappa * (1 - Math.sqrt(Tr))) ** 2;
      const ai = 0.45724 * (R * m.component.Tc) ** 2 * alpha / m.component.Pc;
      const bi = 0.07780 * R * m.component.Tc / m.component.Pc;
      return { ai, bi, xi: m.moleFraction, MW: m.component.MW };
    });

    // 2. Mixing Rules (Van der Waals)
    let a_mix = 0;
    let b_mix = 0;
    let mw_mix = 0;

    for (let i = 0; i < comps.length; i++) {
      b_mix += comps[i].xi * comps[i].bi;
      mw_mix += comps[i].xi * comps[i].MW;
      for (let j = 0; j < comps.length; j++) {
        // Simple mixing rule (kij = 0 for now)
        const aij = Math.sqrt(comps[i].ai * comps[j].ai);
        a_mix += comps[i].xi * comps[j].xi * aij;
      }
    }

    const A = a_mix * P / (R * T) ** 2;
    const B = b_mix * P / (R * T);

    // 3. Solve Cubic
    const c2 = -(1 - B);
    const c1 = A - 3 * B ** 2 - 2 * B;
    const c0 = -(A * B - B ** 2 - B ** 3);

    const roots = solveCubic(1, c2, c1, c0);
    const realRoots = roots.filter(r => r > 0);

    let Z = 0;
    let phase: FluidState['phase'] = 'Vapor';

    if (realRoots.length === 1) {
      Z = realRoots[0];
      // Simplified phase determination for mixtures
      phase = T > 400 ? 'Supercritical' : (P > 50 ? 'Liquid' : 'Vapor'); 
    } else {
      const Z_vap = Math.max(...realRoots);
      const Z_liq = Math.min(...realRoots);
      
      // Fugacity calculation would be better here, using Z_vap for now if P is low
      Z = P > 20 ? Z_liq : Z_vap;
      phase = P > 20 ? 'Liquid' : 'Vapor';
    }

    const density = (P * mw_mix) / (Z * R * T);

    return {
      temperature: T_C,
      pressure: P_bar,
      phase,
      compressibility: Z,
      density,
      enthalpy: 0,
      entropy: 0,
      viscosity: 0.01, // Placeholder
      molecularWeight: mw_mix
    };
  }
}


/**
 * SRK Implementation
 */
export class SRKPackage implements PropertyPackage {
  name: PropertyModel = 'SRK';

  calculate(mixture: MixtureComponent[], T_C: number, P_bar: number): FluidState {
    const T = T_C + 273.15; // K
    const P = P_bar; // bar
    const R = 0.08314; // bar.L/(mol.K)

    // 1. Calculate individual component parameters
    const comps = mixture.map(m => {
      const Tr = T / m.component.Tc;
      const m_srk = 0.480 + 1.574 * m.component.omega - 0.176 * m.component.omega ** 2;
      const alpha = (1 + m_srk * (1 - Math.sqrt(Tr))) ** 2;
      const ai = 0.42748 * (R * m.component.Tc) ** 2 * alpha / m.component.Pc;
      const bi = 0.08664 * R * m.component.Tc / m.component.Pc;
      return { ai, bi, xi: m.moleFraction, MW: m.component.MW };
    });

    // 2. Mixing Rules (Van der Waals)
    let a_mix = 0;
    let b_mix = 0;
    let mw_mix = 0;

    for (let i = 0; i < comps.length; i++) {
      b_mix += comps[i].xi * comps[i].bi;
      mw_mix += comps[i].xi * comps[i].MW;
      for (let j = 0; j < comps.length; j++) {
        const aij = Math.sqrt(comps[i].ai * comps[j].ai); // kij = 0
        a_mix += comps[i].xi * comps[j].xi * aij;
      }
    }

    const A = a_mix * P / (R * T) ** 2;
    const B = b_mix * P / (R * T);

    // 3. Solve Cubic for SRK: Z^3 - Z^2 + (A - B - B^2)Z - AB = 0
    const c2 = -1;
    const c1 = A - B - B ** 2;
    const c0 = -A * B;

    const roots = solveCubic(1, c2, c1, c0);
    const realRoots = roots.filter(r => r > 0);

    let Z = 0;
    let phase: FluidState['phase'] = 'Vapor';

    if (realRoots.length === 1) {
      Z = realRoots[0];
      phase = T > 400 ? 'Supercritical' : (P > 50 ? 'Liquid' : 'Vapor');
    } else {
      const Z_vap = Math.max(...realRoots);
      const Z_liq = Math.min(...realRoots);
      Z = P > 20 ? Z_liq : Z_vap;
      phase = P > 20 ? 'Liquid' : 'Vapor';
    }

    const density = (P * mw_mix) / (Z * R * T);

    return {
      temperature: T_C,
      pressure: P_bar,
      phase,
      compressibility: Z,
      density,
      enthalpy: 0,
      entropy: 0,
      viscosity: 0.01,
      molecularWeight: mw_mix
    };
  }
}

export function calculateEOS(componentName: string, T_C: number, P_bar: number, model: PropertyModel = 'Peng-Robinson'): FluidState {
  const comp = COMPONENTS[componentName];
  if (!comp) throw new Error(`Component ${componentName} not found`);
  
  let pkg: PropertyPackage;
  switch (model) {
    case 'SRK':
      pkg = new SRKPackage();
      break;
    case 'Peng-Robinson':
    default:
      pkg = new PengRobinsonPackage();
      break;
  }

  return pkg.calculate([{ component: comp, moleFraction: 1.0 }], T_C, P_bar);
}

function solveCubic(a: number, b: number, c: number, d: number): number[] {
  if (Math.abs(a) < 1e-9) return [];
  
  const p = (3*a*c - b*b)/(3*a*a);
  const q = (2*b*b*b - 9*a*b*c + 27*a*a*d)/(27*a*a*a);
  const D = (q/2)**2 + (p/3)**3;
  
  if (D > 0) {
    const u = Math.cbrt(-q/2 + Math.sqrt(D));
    const v = Math.cbrt(-q/2 - Math.sqrt(D));
    return [u + v - b/(3*a)];
  } else if (D === 0) {
    const u = Math.cbrt(-q/2);
    return [2*u - b/(3*a), -u - b/(3*a)];
  } else {
    const phi = Math.acos(-q/(2*Math.sqrt(Math.pow(-(p/3), 3))));
    const k = 2 * Math.sqrt(-p/3);
    return [
      k * Math.cos(phi/3) - b/(3*a),
      k * Math.cos((phi + 2*Math.PI)/3) - b/(3*a),
      k * Math.cos((phi + 4*Math.PI)/3) - b/(3*a)
    ];
  }
}
