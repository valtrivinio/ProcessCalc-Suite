// src/core/thermal/eos.ts

// Cubic equation solver (real roots only)
export function solveCubic(a: number, b: number, c: number, d: number): number[] {
  if (Math.abs(a) < 1e-12) {
    // Quadratic fallback
    if (Math.abs(b) < 1e-12) return [];
    const disc = c * c - 4 * b * d;
    if (disc < 0) return [];
    if (Math.abs(disc) < 1e-12) return [-c / (2 * b)];
    return [(-c + Math.sqrt(disc)) / (2 * b), (-c - Math.sqrt(disc)) / (2 * b)];
  }
  const A = b / a;
  const B = c / a;
  const C = d / a;
  const p = B - (A * A) / 3;
  const q = (2 * A * A * A) / 27 - (A * B) / 3 + C;
  const disc = (q * q) / 4 + (p * p * p) / 27;
  if (disc > 0) {
    const u = Math.cbrt(-q / 2 + Math.sqrt(disc));
    const v = Math.cbrt(-q / 2 - Math.sqrt(disc));
    return [u + v - A / 3];
  } else if (Math.abs(disc) < 1e-12) {
    const u = Math.cbrt(-q / 2);
    return [2 * u - A / 3, -u - A / 3];
  } else {
    const theta = Math.acos(-q / (2 * Math.sqrt(Math.pow(-(p / 3), 3))));
    const r = 2 * Math.sqrt(-p / 3);
    return [
      r * Math.cos(theta / 3) - A / 3,
      r * Math.cos((theta + 2 * Math.PI) / 3) - A / 3,
      r * Math.cos((theta + 4 * Math.PI) / 3) - A / 3,
    ];
  }
}

// Peng-Robinson equation of state
export class PengRobinson {
  private R = 8.314462618;

  calculate(
    components: Array<{ component: { Tc: number; Pc: number; omega: number; MW: number }; moleFraction: number }>,
    temperature: number,
    pressure: number
  ) {
    const T = temperature + 273.15;
    const P = pressure; // in bar
    const R = this.R;

    // Compute pure-component parameters
    const a = components.map(c => {
      const Tr = T / c.component.Tc;
      const alpha = (1 + (0.37464 + 1.54226 * c.component.omega - 0.26992 * c.component.omega ** 2) * (1 - Math.sqrt(Tr))) ** 2;
      return 0.45724 * (R ** 2 * c.component.Tc ** 2) / c.component.Pc * alpha;
    });
    const b = components.map(c => 0.0778 * R * c.component.Tc / c.component.Pc);
    const z = components.map(c => c.moleFraction);
    const MW = components.map(c => c.component.MW);

    // Mixing rules
    let am = 0;
    let bm = 0;
    for (let i = 0; i < components.length; i++) {
      bm += z[i] * b[i];
      for (let j = 0; j < components.length; j++) {
        am += z[i] * z[j] * Math.sqrt(a[i] * a[j]);
      }
    }

    const A = am * P / (R * R * T * T);
    const B = bm * P / (R * T);
    const Acoef = -(1 - B);
    const Bcoef = A - 3 * B * B - 2 * B;
    const Ccoef = -(A * B - B * B - B * B * B);
    const roots = solveCubic(1, Acoef, Bcoef, Ccoef).filter(r => r > 0);
    let Z: number;
    let phase: string;
    if (roots.length === 1) {
      Z = roots[0];
      phase = T > 500 ? 'Supercritical' : P > 50 ? 'Liquid' : 'Vapor';
    } else if (roots.length >= 2) {
      const maxRoot = Math.max(...roots);
      const minRoot = Math.min(...roots);
      Z = P > 20 ? minRoot : maxRoot;
      phase = P > 20 ? 'Liquid' : 'Vapor';
    } else {
      Z = 1;
      phase = 'Unknown';
    }

    const MW_avg = z.reduce((sum, zi, i) => sum + zi * MW[i], 0);
    const density = (P * 1e5) / (Z * R * T) * MW_avg / 1000; // kg/m³

    return {
      temperature,
      pressure,
      phase,
      compressibility: Z,
      density,
      enthalpy: 0,
      entropy: 0,
      viscosity: 0.01,
      molecularWeight: MW_avg,
    };
  }
}
