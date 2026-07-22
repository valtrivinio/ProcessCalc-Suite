export class PengRobinson {
  calculate(components: any[], temperature: number, pressure: number) {
    const T = temperature + 273.15;
    const P = pressure;
    const R = 8.314462618;

    const comps = components.map(c => {
      const Tr = T / c.component.Tc;
      const alpha = (1 + (0.37464 + 1.54226 * c.component.omega - 0.26992 * c.component.omega ** 2) * (1 - Math.sqrt(Tr))) ** 2;
      const a = 0.45724 * (R * c.component.Tc) ** 2 * alpha / c.component.Pc;
      const b = 0.0778 * R * c.component.Tc / c.component.Pc;
      return { a, b, xi: c.moleFraction, MW: c.component.MW };
    });

    let a_mix = 0,
      b_mix = 0,
      mw_mix = 0;
    for (let i = 0; i < comps.length; i++) {
      b_mix += comps[i].xi * comps[i].b;
      mw_mix += comps[i].xi * comps[i].MW;
      for (let j = 0; j < comps.length; j++) {
        a_mix += comps[i].xi * comps[j].xi * Math.sqrt(comps[i].a * comps[j].a);
      }
    }

    const A = a_mix * P / (R * T) ** 2;
    const B = b_mix * P / (R * T);
    const Z = this.solveCubic(1, -(1 - B), A - 3 * B ** 2 - 2 * B, -(A * B - B ** 2 - B ** 3));

    let phase = 'Vapor';
    let Z_val = Z[0] || 1;
    if (Z.length === 1) {
      Z_val = Z[0];
      phase = T > 400 ? 'Supercritical' : P > 50 ? 'Liquid' : 'Vapor';
    } else {
      const maxZ = Math.max(...Z);
      const minZ = Math.min(...Z);
      Z_val = P > 20 ? minZ : maxZ;
      phase = P > 20 ? 'Liquid' : 'Vapor';
    }

    const density = P * mw_mix / (Z_val * R * T);
    const viscosity = 0.01; // placeholder

    return {
      temperature,
      pressure,
      phase,
      compressibility: Z_val,
      density,
      enthalpy: 0,
      entropy: 0,
      viscosity,
      molecularWeight: mw_mix,
    };
  }

  private solveCubic(a: number, b: number, c: number, d: number): number[] {
    if (Math.abs(a) < 1e-9) return [];
    const f = (3 * a * c - b * b) / (3 * a * a);
    const g = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
    const h = (g / 2) ** 2 + (f / 3) ** 3;
    if (h > 0) {
      const r = -g / 2 + Math.sqrt(h);
      const s = -g / 2 - Math.sqrt(h);
      const root = Math.cbrt(r) + Math.cbrt(s) - b / (3 * a);
      return [root];
    } else if (h === 0) {
      const root1 = 2 * Math.cbrt(-g / 2) - b / (3 * a);
      const root2 = -Math.cbrt(-g / 2) - b / (3 * a);
      return [root1, root2];
    } else {
      const theta = Math.acos(-g / (2 * Math.sqrt(-(f / 3) ** 3)));
      const r = 2 * Math.sqrt(-f / 3);
      const roots = [
        r * Math.cos(theta / 3) - b / (3 * a),
        r * Math.cos((theta + 2 * Math.PI) / 3) - b / (3 * a),
        r * Math.cos((theta + 4 * Math.PI) / 3) - b / (3 * a),
      ];
      return roots;
    }
  }
}
