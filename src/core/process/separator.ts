
/**
 * Separator Sizing (API 12J / GPSA)
 */

export interface SeparatorResult {
  diameter: number; // m
  height: number; // m
  vGas: number; // m/s (Terminal Velocity)
  vGasMax: number; // m/s (Allowable)
  liquidVolume: number; // m3
  slendernessRatio: number; // H/D
}

/**
 * Calculate K-Value for Gas-Liquid Separation (GPSA)
 * K = sqrt( (rhoL - rhoG) / rhoG ) * V
 * Actually V = K * sqrt(...)
 * K typically 0.03 - 0.1 m/s (0.1 - 0.35 ft/s) depending on mist eliminator
 */
export function calculateKValue(pressureBar: number, hasMistEliminator: boolean = true): number {
  // GPSA Fig 7-9 approximation
  // K varies with pressure.
  // 0-100 psig: K ~ 0.35 ft/s (0.107 m/s)
  // Higher pressure, K decreases.
  
  // Simplified correlation for K (m/s) with Mist Eliminator:
  // K = 0.107 * (1 - 0.003 * P_bar) roughly, but let's use standard values.
  
  let K_mps = 0.107; // Standard for low pressure with mesh pad
  
  if (pressureBar > 10) K_mps = 0.09;
  if (pressureBar > 30) K_mps = 0.08;
  if (pressureBar > 60) K_mps = 0.07;
  if (pressureBar > 100) K_mps = 0.06;

  if (!hasMistEliminator) K_mps *= 0.5; // Without demister, V must be lower

  return K_mps;
}

/**
 * Vertical Separator Sizing
 * @param qGas m3/h (Actual)
 * @param qLiquid m3/h (Actual)
 * @param rhoGas kg/m3
 * @param rhoLiquid kg/m3
 * @param retentionTime min (Liquid retention)
 */
export function sizeVerticalSeparator(
  qGas: number,
  qLiquid: number,
  rhoGas: number,
  rhoLiquid: number,
  retentionTime: number,
  pressureBar: number
): SeparatorResult {
  
  // 1. Gas Capacity (Terminal Velocity)
  // V_t = K * sqrt((rhoL - rhoG) / rhoG)
  const K = calculateKValue(pressureBar, true);
  const v_t = K * Math.sqrt((rhoLiquid - rhoGas) / rhoGas);
  
  // Design Velocity (usually 75% of terminal)
  const v_design = 0.75 * v_t;
  
  // Min Diameter for Gas Separation
  // A_gas = Q_gas / v_design
  const qGas_s = qGas / 3600;
  const A_gas = qGas_s / v_design;
  const D_gas = Math.sqrt(4 * A_gas / Math.PI);

  // 2. Liquid Capacity (Retention Time)
  // Vol_liq = Q_liq * t_retention
  const qLiq_m3min = qLiquid / 60;
  const Vol_liq = qLiq_m3min * retentionTime;
  
  // Assume Liquid Height. For vertical, usually H_liq ~ 0.5D to 1D + surge.
  // Let's iterate or set standard geometry.
  // Standard: H_total / D ratio = 2.5 to 4.
  
  // Let's pick a Diameter that satisfies Gas, then check Height.
  // Round D up to nearest standard size (e.g. 0.1m increments)
  let D = Math.ceil(D_gas * 10) / 10;
  if (D < 0.3) D = 0.3; // Min 12"

  // Calculate Liquid Height required
  const A_cross = Math.PI * Math.pow(D / 2, 2);
  const H_liq = Vol_liq / A_cross;
  
  // Total Height
  // H_total = H_liq + H_disengagement + H_mist_eliminator
  // H_disengagement usually D or min 1m.
  const H_disengage = Math.max(D, 1.0);
  const H_mist = 0.3; // Space for demister
  const H_total = H_liq + H_disengage + H_mist;

  // Check Slenderness
  let ratio = H_total / D;
  
  // Optimization loop (simple)
  // If ratio < 2.5, increase H (and thus D stays same, but maybe we force D smaller? No, D is set by gas)
  // If ratio > 6, increase D to reduce H.
  
  if (ratio > 6) {
    D = D * 1.2; // Increase D
    // Recalc H
    const A_new = Math.PI * Math.pow(D / 2, 2);
    const H_liq_new = Vol_liq / A_new;
    const H_total_new = H_liq_new + Math.max(D, 1.0) + 0.3;
    ratio = H_total_new / D;
  }

  return {
    diameter: D,
    height: H_total,
    vGas: qGas_s / (Math.PI * Math.pow(D/2, 2)),
    vGasMax: v_t,
    liquidVolume: Vol_liq,
    slendernessRatio: ratio
  };
}
