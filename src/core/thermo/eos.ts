/**
 * Thermodynamic Property Engine
 * Modular architecture supporting multiple EOS models
 */

export interface FluidState {
  temperature: number;
  pressure: number;
  phase: 'Liquid' | 'Vapor' | 'Two-Phase' | 'Supercritical';
  compressibility: number;
  density: number;
  enthalpy: number;
  entropy: number;
  viscosity: number;
  molecularWeight: number;
  warnings?: string[];
}

export interface Component {
  name: string;
  Tc: number;
  Pc: number;
  omega: number;
  MW: number;
}

export interface MixtureComponent {
  component: Component;
  moleFraction: number;
}

export type PropertyModel = 'Peng-Robinson' | 'SRK' | 'NRTL' | 'UNIQUAC';

export interface PropertyPackage {
  name: PropertyModel;
  calculate(mixture: MixtureComponent[], T_C: number, P_bar: number): FluidState;
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

const BIP: Record<string, number> = {
  'Methane-CO2': 0.12,
  'Methane-Ethane': 0.01,
  'Methane-Propane': 0.02,
  'CO2-Water': 0.19,
};

function kij(a: string, b: string): number {
  return BIP[`${a}-${b}`] ?? BIP[`${b}-${a}`] ?? 0;
}

function gasViscosityLeeKesler(TK: number, MW: number): number {
  const T = TK * 1.8;
  const K = ((9.4 + 0.02 * MW) * Math.pow(T, 1.5)) / (209 + 19 * MW + T);
  const X = 3.5 + 986 / T + 0.01 * MW;
  const Y = 2.4 - 0.2 * X;
  return 1e-4 * K * Math.exp(X * Math.pow(0.001, Y));
}

function liquidViscositySimple(TC: number): number {
  return Math.max(0.1, 1.79 * Math.exp(-0.0337 * (TC - 20)));
}

export class PengRobinsonPackage implements PropertyPackage {
  name: PropertyModel = 'Peng-Robinson';

  calculate(mixture: MixtureComponent[], T_C: number, P_bar: number): FluidState {
    const warnings: string[] = [];
    const T = T_C + 273.15;
    const P = P_bar;
    const R = 0.08314;

    const sumX = mixture.reduce((a, b) => a + b.moleFraction, 0);
    if (Math.abs(sumX - 1) > 1e-5) warnings.push('Mole fractions normalized internally.');

    const norm = mixture.map((m) => ({ ...m, moleFraction: m.moleFraction / sumX }));

    const comps = norm.map((m) => {
      const Tr = T / m.component.Tc;
      const kappa = 0.37464 + 1.54226 * m.component.omega - 0.26992 * m.component.omega ** 2;
      const alpha = (1 + kappa * (1 - Math.sqrt(Tr))) ** 2;
      const ai = (0.45724 * (R * m.component.Tc) ** 2 * alpha) / m.component.Pc;
      const bi = (0.0778 * R * m.component.Tc) / m.component.Pc;
      return { ai, bi, xi: m.moleFraction, MW: m.component.MW, name: m.component.name };
    });

    let aMix = 0;
    let bMix = 0;
    let mwMix = 0;

    for (let i = 0; i < comps.length; i++) {
      bMix += comps[i].xi * comps[i].bi;
      mwMix += comps[i].xi * comps[i].MW;
      for (let j = 0; j < comps.length; j++) {
        const aij = Math.sqrt(comps[i].ai * comps[j].ai) * (1 - kij(comps[i].name, comps[j].name));
        aMix += comps[i].xi * comps[j].xi * aij;
      }
    }

    const A = (aMix * P) / (R * T) ** 2;
    const B = (bMix * P) / (R * T);

    const roots = solveCubic(1, -(1 - B), A - 3 * B ** 2 - 2 * B, -(A * B - B ** 2 - B ** 3)).filter((r) => r > 0);
    if (roots.length === 0) throw new Error('Degenerate cubic root set for PR EOS.');

    let Z = Math.max(...roots);
    let phase: FluidState['phase'] = 'Vapor';

    if (roots.length > 1 && P > 20) {
      Z = Math.min(...roots);
      phase = 'Liquid';
      warnings.push('Multiple real roots: selecting liquid-like root at high pressure.');
    }

    if (T > 650 || P > 250) warnings.push('Thermodynamic state outside validated package envelope.');

    const density = (P * mwMix) / (Z * R * T);
    const muGas = gasViscosityLeeKesler(T, mwMix);
    const muLiq = liquidViscositySimple(T_C);

    return {
      temperature: T_C,
      pressure: P_bar,
      phase,
      compressibility: Z,
      density,
      enthalpy: Number.NaN,
      entropy: Number.NaN,
      viscosity: phase === 'Liquid' ? muLiq : muGas,
      molecularWeight: mwMix,
      warnings: [...warnings, 'Enthalpy/entropy not available in this package revision.'],
    };
  }
}

export function calculateEOS(componentName: string, T_C: number, P_bar: number): FluidState {
  const comp = COMPONENTS[componentName];
  if (!comp) throw new Error(`Component ${componentName} not found`);
  return new PengRobinsonPackage().calculate([{ component: comp, moleFraction: 1 }], T_C, P_bar);
}

function solveCubic(a: number, b: number, c: number, d: number): number[] {
  if (Math.abs(a) < 1e-12) throw new Error('Degenerate cubic coefficient (a≈0).');
  const p = (3 * a * c - b * b) / (3 * a * a);
  const q = (2 * b ** 3 - 9 * a * b * c + 27 * a * a * d) / (27 * a ** 3);
  const D = q ** 2 / 4 + p ** 3 / 27;

  if (Math.abs(D) < 1e-15) {
    const u = Math.cbrt(-q / 2);
    return [2 * u - b / (3 * a), -u - b / (3 * a)];
  }
  if (D > 0) {
    const u = Math.cbrt(-q / 2 + Math.sqrt(D));
    const v = Math.cbrt(-q / 2 - Math.sqrt(D));
    return [u + v - b / (3 * a)];
  }

  const phi = Math.acos(-q / (2 * Math.sqrt(-((p / 3) ** 3))));
  const k = 2 * Math.sqrt(-p / 3);
  return [
    k * Math.cos(phi / 3) - b / (3 * a),
    k * Math.cos((phi + 2 * Math.PI) / 3) - b / (3 * a),
    k * Math.cos((phi + 4 * Math.PI) / 3) - b / (3 * a),
  ];
}
