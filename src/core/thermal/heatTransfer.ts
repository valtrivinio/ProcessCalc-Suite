/**
 * Heat Transfer Core Logic
 * TEMA / GPSA
 */

export type ExchangerType = '1-2' | '2-4' | '1-1';
export type HeatMode = 'sensible' | 'condensing' | 'boiling';

export interface HeatValidation {
  status: 'VALID' | 'WARNING' | 'INVALID' | 'SAFETY RISK';
  warnings: string[];
  energyMismatchPct?: number;
}

export function calculateLMTD(
  Th_in: number,
  Th_out: number,
  Tc_in: number,
  Tc_out: number,
  type: 'counter' | 'parallel' = 'counter',
): number {
  const dT1 = type === 'counter' ? Th_in - Tc_out : Th_in - Tc_in;
  const dT2 = type === 'counter' ? Th_out - Tc_in : Th_out - Tc_out;

  if (dT1 <= 0 || dT2 <= 0) return NaN;
  if (Math.abs(dT1 - dT2) < 1e-10) return dT1;
  return (dT1 - dT2) / Math.log(dT1 / dT2);
}

export function calculateFt(
  Th_in: number,
  Th_out: number,
  Tc_in: number,
  Tc_out: number,
  shellConfig: ExchangerType = '1-2',
): number {
  if (shellConfig === '1-1') return 1;

  const R = (Th_in - Th_out) / Math.max(Tc_out - Tc_in, 1e-12);
  const P = (Tc_out - Tc_in) / Math.max(Th_in - Tc_in, 1e-12);

  if (shellConfig === '2-4') {
    // Approximate Bell-Delaware style correction for two-shell pass behavior.
    const F12 = calculateFt(Th_in, Th_out, Tc_in, Tc_out, '1-2');
    return Math.min(1, Math.max(0.5, 0.92 * F12 + 0.05));
  }

  const sqrtR2P1 = Math.sqrt(R * R + 1);
  const num = sqrtR2P1 * Math.log((1 - P) / Math.max(1 - R * P, 1e-12));
  const den = (R - 1) * Math.log(
    (2 - P * (R + 1 - sqrtR2P1)) / Math.max(2 - P * (R + 1 + sqrtR2P1), 1e-12),
  );

  const Ft = num / den;
  return Number.isFinite(Ft) ? Ft : NaN;
}

export function calculatePhaseChangeDuty(massFlowKgH: number, latentHeatKJkg: number): number {
  return (massFlowKgH * latentHeatKJkg) / 3600;
}

export function energyBalanceCheck(QhotKW: number, QcoldKW: number, tolerancePct = 3): HeatValidation {
  const ref = Math.max(Math.abs(QhotKW), Math.abs(QcoldKW), 1e-9);
  const mismatchPct = (Math.abs(QhotKW - QcoldKW) / ref) * 100;
  const warnings: string[] = [];

  if (mismatchPct > tolerancePct) {
    warnings.push(`Energy mismatch ${mismatchPct.toFixed(2)}% exceeds tolerance ${tolerancePct}%.`);
    return { status: mismatchPct > tolerancePct * 2 ? 'SAFETY RISK' : 'WARNING', warnings, energyMismatchPct: mismatchPct };
  }

  return { status: 'VALID', warnings, energyMismatchPct: mismatchPct };
}

export function validateStreamTemperatures(
  Th_in: number,
  Th_out: number,
  Tc_in: number,
  Tc_out: number,
  allowTemperatureCross = false,
): HeatValidation {
  const warnings: string[] = [];
  if (Th_in <= Th_out || Tc_out <= Tc_in) {
    return { status: 'INVALID', warnings: ['Invalid monotonic profile: verify stream inlet/outlet assignment.'] };
  }

  if (Th_out < Tc_out || Th_in < Tc_in) {
    if (allowTemperatureCross) {
      warnings.push('Temperature cross detected. Accept only with verified phase change or multi-zone model.');
      return { status: 'WARNING', warnings };
    }
    return { status: 'SAFETY RISK', warnings: ['Temperature cross hard-stop: violates single-zone exchanger assumptions.'] };
  }

  return { status: 'VALID', warnings };
}

export const FOULING_FACTORS = {
  Clean: 0.0000,
  'Water (Treated)': 0.00018,
  'Water (River)': 0.00035,
  'Oil (Light)': 0.00018,
  'Oil (Heavy)': 0.00035,
  'Gas (Clean)': 0.00018,
  'Gas (Dirty)': 0.00035,
};
