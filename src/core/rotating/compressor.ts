/**
 * Compressor Sizing & Analysis
 * Based on GPSA Engineering Data Book / API 617 aware checks
 */

export interface CompressorResult {
  polytropicHead: number;
  dischargeTemp: number;
  gasPower: number;
  brakePower: number;
  volumetricFlowInlet: number;
  Z2: number;
  stageCount: number;
  warnings: string[];
  status: 'VALID' | 'WARNING' | 'INVALID' | 'SAFETY RISK';
}

export interface CompressorOptions {
  stages?: number;
  intercoolerOutletK?: number;
  zEstimator?: (T: number, P: number) => number;
}

function singleStage(
  P1: number,
  P2: number,
  T1: number,
  Z1: number,
  MW: number,
  k: number,
  etaP: number,
  massFlow: number,
  zEstimator?: (T: number, P: number) => number,
) {
  const m = (k - 1) / (k * etaP);
  const pr = P2 / P1;
  const T2 = T1 * Math.pow(pr, m);
  const Z2 = zEstimator ? zEstimator(T2, P2) : Z1;
  const Zavg = (Z1 + Z2) / 2;
  const Rgas = 8314 / MW;
  const HpJ = (Zavg * Rgas * T1 / m) * (Math.pow(pr, m) - 1);
  const HpKJkg = HpJ / 1000;
  const massFlowS = massFlow / 3600;
  const gasPower = (massFlowS * HpKJkg) / etaP;
  const brakePower = gasPower / 0.97;
  const volFlow = (massFlow / MW) * 8.314 * T1 * Z1 / P1;

  return { HpKJkg, T2, Z2, gasPower, brakePower, volFlow };
}

export function calculateCompressor(
  P1: number,
  P2: number,
  T1: number,
  Z1: number,
  MW: number,
  k: number,
  eta_p: number,
  massFlow: number,
  options: CompressorOptions = {},
): CompressorResult {
  const stages = Math.max(options.stages ?? 1, 1);
  const warnings: string[] = [];
  let totalHead = 0;
  let totalGasPower = 0;
  let totalBrake = 0;

  const stagePR = Math.pow(P2 / P1, 1 / stages);
  let stageP1 = P1;
  let stageT1 = T1;
  let stageZ1 = Z1;
  let lastZ2 = Z1;

  for (let i = 0; i < stages; i++) {
    const stageP2 = stageP1 * stagePR;
    const s = singleStage(stageP1, stageP2, stageT1, stageZ1, MW, k, eta_p, massFlow, options.zEstimator);
    totalHead += s.HpKJkg;
    totalGasPower += s.gasPower;
    totalBrake += s.brakePower;
    stageP1 = stageP2;
    stageT1 = i < stages - 1 ? options.intercoolerOutletK ?? T1 : s.T2;
    stageZ1 = options.zEstimator ? options.zEstimator(stageT1, stageP1) : stageZ1;
    lastZ2 = s.Z2;
  }

  const dischargeTempC = stageT1 - 273.15;
  if (dischargeTempC > 150) warnings.push('Discharge temperature above 150°C advisory threshold.');
  let status: CompressorResult['status'] = 'VALID';
  if (dischargeTempC > 150) status = 'WARNING';
  if (dischargeTempC > 200) {
    warnings.push('Discharge temperature above 200°C hard limit.');
    status = 'SAFETY RISK';
  }

  const headPerStage = totalHead / stages;
  if (headPerStage < 20 || headPerStage > 250) warnings.push('Polytropic head per stage outside common centrifugal envelope (~20-250 kJ/kg).');
  warnings.push('Surge margin is advisory only; verify against OEM map (recommended >10%).');

  const volFlow = (massFlow / MW) * 8.314 * T1 * Z1 / P1;

  return {
    polytropicHead: totalHead,
    dischargeTemp: dischargeTempC,
    gasPower: totalGasPower,
    brakePower: totalBrake,
    volumetricFlowInlet: volFlow,
    Z2: lastZ2,
    stageCount: stages,
    warnings,
    status,
  };
}
