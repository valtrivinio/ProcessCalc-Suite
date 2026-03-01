/**
 * API 520 Part I - Relief Valve Sizing
 */

export interface ReliefResult {
  area: number;
  designation: string;
  ratedFlow: number;
  isSubcritical: boolean;
  criticalPressure: number;
  kbUsed: number;
  status: 'VALID' | 'WARNING' | 'INVALID' | 'SAFETY RISK';
  warnings: string[];
}

export const API_ORIFICES = [
  { letter: 'D', area: 0.110 },
  { letter: 'E', area: 0.196 },
  { letter: 'F', area: 0.307 },
  { letter: 'G', area: 0.503 },
  { letter: 'H', area: 0.785 },
  { letter: 'J', area: 1.287 },
  { letter: 'K', area: 1.838 },
  { letter: 'L', area: 2.853 },
  { letter: 'M', area: 3.6 },
  { letter: 'N', area: 4.34 },
  { letter: 'P', area: 6.38 },
  { letter: 'Q', area: 11.05 },
  { letter: 'R', area: 16.0 },
  { letter: 'T', area: 26.0 },
];

export function interpolateKbGauge(backpressureGaugePct: number): number {
  // Digitized style approximation of API 520 Fig 30 for conventional valves.
  if (backpressureGaugePct <= 30) return 1;
  if (backpressureGaugePct >= 50) return 0.75;
  const frac = (backpressureGaugePct - 30) / 20;
  return 1 - frac * 0.25;
}

export function calculateReliefArea(
  W: number,
  P1: number,
  P2: number,
  T: number,
  Z: number,
  M: number,
  k: number,
  Kd = 0.975,
  Kb = 1.0,
  Kc = 1.0,
  accumulationPct = 10,
  balancedBellows = false,
): ReliefResult {
  const warnings: string[] = [];
  let status: ReliefResult['status'] = 'VALID';

  if (accumulationPct > 21) {
    warnings.push('Accumulation exceeds API defaults.');
    status = 'WARNING';
  }

  const criticalRatio = Math.pow(2 / (k + 1), k / (k - 1));
  const Pcf = P1 * criticalRatio;
  const isSubcritical = P2 > Pcf;

  const backpressureGaugePct = ((P2 - 14.7) / Math.max(P1 - 14.7, 1e-9)) * 100;
  const kbEff = balancedBellows ? 1 : Math.min(Kb, interpolateKbGauge(Math.max(backpressureGaugePct, 0)));
  if (!balancedBellows && kbEff < 0.9) warnings.push('Low Kb due to high built-up backpressure on conventional valve.');

  const C = 520 * Math.sqrt(k * Math.pow(2 / (k + 1), (k + 1) / (k - 1)));
  let F2 = 1;

  if (isSubcritical) {
    const r = P2 / P1;
    const term = (k / (k - 1)) * (Math.pow(r, 2 / k) - Math.pow(r, (k + 1) / k));
    F2 = Math.sqrt(Math.max(term, 1e-12));
    warnings.push('Subcritical gas relief regime detected; F2 correction applied.');
  }

  const area = (W * Math.sqrt(T * Z / M)) / (C * Kd * P1 * kbEff * Kc * F2);
  const selected = API_ORIFICES.find((o) => o.area >= area) || API_ORIFICES[API_ORIFICES.length - 1];

  if (selected.area === API_ORIFICES[API_ORIFICES.length - 1].area && area > selected.area) {
    status = 'SAFETY RISK';
    warnings.push('Required area exceeds largest standard API orifice.');
  }

  return {
    area,
    designation: selected.letter,
    ratedFlow: W * (selected.area / Math.max(area, 1e-12)),
    isSubcritical,
    criticalPressure: Pcf,
    kbUsed: kbEff,
    status,
    warnings,
  };
}

export function calculateLiquidReliefArea(
  Qgpm: number,
  rhoLbFt3: number,
  deltaPpsi: number,
  Kv = 1,
  Kd = 0.65,
): number {
  // API 520 liquid sizing style; returns area in in²
  const G = rhoLbFt3 / 62.4;
  return Qgpm / (38 * Kd * Kv * Math.sqrt(Math.max(deltaPpsi / Math.max(G, 1e-9), 1e-9)));
}
