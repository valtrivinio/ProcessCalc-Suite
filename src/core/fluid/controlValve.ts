/**
 * Control Valve Sizing (ISA 75.01)
 */

export interface ValveResult {
  Cv: number;
  Kv: number;
  flowRegime: 'Subcritical' | 'Critical' | 'Choked' | 'Flashing Risk';
  chokedPressureDrop?: number;
  expansionFactor?: number;
  reynoldsFactor?: number;
  warnings?: string[];
}

function reynoldsCorrectionFactor(ReValve: number): number {
  if (ReValve >= 10000) return 1;
  if (ReValve <= 10) return 0.1;
  return Math.max(0.1, Math.min(1, 0.33 * Math.log10(ReValve) + 0.01));
}

export function sizeLiquidValve(
  flowRate: number,
  P1: number,
  P2: number,
  SG: number,
  Pv: number,
  FL = 0.9,
  Ff = 0.96,
  ReValve = 1e5,
): ValveResult {
  const warnings: string[] = [];
  let dP = P1 - P2;
  let regime: ValveResult['flowRegime'] = 'Subcritical';

  const dPChoked = Math.pow(FL, 2) * (P1 - Ff * Pv);
  if (dP >= dPChoked) {
    dP = dPChoked;
    regime = 'Choked';
  }

  if (Pv >= 0.9 * P2) {
    warnings.push('Downstream pressure near vapor pressure: flashing/two-phase risk.');
    if (regime !== 'Choked') regime = 'Flashing Risk';
  }

  if (dP <= 0 || SG <= 0) return { Cv: 0, Kv: 0, flowRegime: 'Subcritical', warnings };

  const FR = reynoldsCorrectionFactor(ReValve);
  const KvIdeal = flowRate * Math.sqrt(SG / dP);
  const Kv = KvIdeal / FR;
  const Cv = Kv * 1.156;

  return { Cv, Kv, flowRegime: regime, chokedPressureDrop: dPChoked, reynoldsFactor: FR, warnings };
}

export function sizeGasValve(
  flowRate: number,
  P1: number,
  P2: number,
  T1: number,
  MW: number,
  Z: number,
  k: number,
  xT = 0.72,
): ValveResult {
  const warnings: string[] = [];
  const dP = P1 - P2;
  const x = dP / Math.max(P1, 1e-9);
  const Fk = k / 1.4;
  const xChoked = xT * Fk;

  let Y = 1 - x / (3 * xChoked);
  let regime: ValveResult['flowRegime'] = 'Subcritical';
  let xEff = x;

  if (x >= xChoked) {
    xEff = xChoked;
    regime = 'Choked';
    Y = 2 / 3;
  }

  Y = Math.min(Math.max(Y, 2 / 3), 1);
  const N8 = 94.8;
  const Kv = flowRate / (N8 * P1 * Y * Math.sqrt((Math.max(xEff, 1e-9) * MW) / (T1 * Math.max(Z, 0.2))));
  const Cv = Kv * 1.156;

  if (x > 0.7) warnings.push('High pressure drop ratio; validate noise and trim erosion limits.');

  return { Cv, Kv, flowRegime: regime, expansionFactor: Y, warnings };
}

export function validateBetaRatio(beta: number): string | undefined {
  if (beta <= 0 || beta >= 1) return 'Invalid beta ratio. Must satisfy 0 < β < 1.';
  if (beta > 0.7) return 'β > 0.7 warning: reduced discharge coefficient accuracy and higher cavitation/noise risk.';
  return undefined;
}
