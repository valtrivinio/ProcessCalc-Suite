/**
 * Separator Sizing (API 12J / GPSA)
 */

export interface SeparatorResult {
  diameter: number;
  height: number;
  vGas: number;
  vGasMax: number;
  liquidVolume: number;
  slendernessRatio: number;
  orientation: 'vertical' | 'horizontal';
  inletMomentum: number;
  carryoverRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  warnings: string[];
}

export interface SeparatorInput {
  qGas: number;
  qLiquid: number;
  rhoGas: number;
  rhoLiquid: number;
  retentionTime: number;
  pressureBar: number;
  orientation?: 'vertical' | 'horizontal';
  hasMistEliminator?: boolean;
  inletNozzleDiameterM?: number;
}

export function calculateKValue(pressureBar: number, hasMistEliminator = true): number {
  // GPSA style smooth pressure dependence (m/s), anchored to 0.35 ft/s at low pressure.
  const pPsia = pressureBar * 14.5038;
  const baseFtS = 0.35 / Math.pow(1 + pPsia / 1500, 0.2);
  let kMps = baseFtS * 0.3048;
  if (!hasMistEliminator) kMps *= 0.5;
  return Math.max(kMps, 0.02);
}

export function calculateGasDensityFromZ(Pbar: number, TK: number, MW: number, Z: number): number {
  const PPa = Pbar * 1e5;
  const MkgMol = MW / 1000;
  return (PPa * MkgMol) / (Math.max(Z, 0.2) * 8.314462618 * TK);
}

function horizontalLiquidAreaFraction(fillFraction: number): number {
  // Circle segment area fraction for horizontal separator liquid section.
  const h = Math.min(Math.max(fillFraction, 1e-3), 0.999);
  const theta = 2 * Math.acos(1 - 2 * h);
  return (theta - Math.sin(theta)) / (2 * Math.PI);
}

export function sizeSeparator(input: SeparatorInput): SeparatorResult {
  const {
    qGas,
    qLiquid,
    rhoGas,
    rhoLiquid,
    retentionTime,
    pressureBar,
    orientation = 'vertical',
    hasMistEliminator = true,
    inletNozzleDiameterM = 0.1,
  } = input;

  const warnings: string[] = [];
  if (rhoLiquid <= rhoGas) {
    throw new Error('Separator invalid: liquid density must exceed gas density (ρL > ρG).');
  }

  const K = calculateKValue(pressureBar, hasMistEliminator);
  const vTerminal = K * Math.sqrt((rhoLiquid - rhoGas) / rhoGas);
  const vDesign = 0.75 * vTerminal;

  const qGasS = qGas / 3600;
  const qLiqM3 = (qLiquid / 60) * retentionTime;

  let D = Math.max(Math.ceil(Math.sqrt((4 * qGasS) / (Math.PI * Math.max(vDesign, 1e-6))) * 10) / 10, 0.4);
  let H = 0;

  if (orientation === 'vertical') {
    const A = Math.PI * (D / 2) ** 2;
    const Hliq = qLiqM3 / A;
    H = Hliq + Math.max(D, 1.0) + 0.3;
  } else {
    // Horizontal sizing: gas cross-sectional area at 50% fill + retention via cylindrical volume.
    const fill = 0.5;
    const liqAreaFrac = horizontalLiquidAreaFraction(fill);
    const gasArea = (1 - liqAreaFrac) * Math.PI * (D / 2) ** 2;
    if (qGasS / gasArea > vDesign) {
      D *= Math.sqrt((qGasS / gasArea) / vDesign);
    }
    const A = liqAreaFrac * Math.PI * (D / 2) ** 2;
    const L = Math.max(qLiqM3 / Math.max(A, 1e-6), 1.5 * D);
    H = L;
  }

  const areaFlow = Math.PI * (D / 2) ** 2;
  const vGas = qGasS / areaFlow;
  const slenderness = H / D;

  const inletArea = Math.PI * (inletNozzleDiameterM / 2) ** 2;
  const vinlet = qGasS / Math.max(inletArea, 1e-6);
  const inletMomentum = rhoGas * vinlet * vinlet;
  const apiMomentumLimit = 7000; // Pa-equivalent criterion used in API12J practices.
  if (inletMomentum > apiMomentumLimit) warnings.push('Inlet momentum exceeds API guideline; inlet diverter upgrade required.');

  let carryoverRisk: SeparatorResult['carryoverRisk'] = 'LOW';
  if (vGas > 0.9 * vTerminal) carryoverRisk = 'HIGH';
  else if (vGas > 0.75 * vTerminal) carryoverRisk = 'MEDIUM';

  if (carryoverRisk !== 'LOW') warnings.push(`Carryover risk ${carryoverRisk} based on gas velocity margin.`);

  return {
    diameter: D,
    height: H,
    vGas,
    vGasMax: vTerminal,
    liquidVolume: qLiqM3,
    slendernessRatio: slenderness,
    orientation,
    inletMomentum,
    carryoverRisk,
    warnings,
  };
}

export function sizeVerticalSeparator(
  qGas: number,
  qLiquid: number,
  rhoGas: number,
  rhoLiquid: number,
  retentionTime: number,
  pressureBar: number,
): SeparatorResult {
  return sizeSeparator({ qGas, qLiquid, rhoGas, rhoLiquid, retentionTime, pressureBar, orientation: 'vertical' });
}
