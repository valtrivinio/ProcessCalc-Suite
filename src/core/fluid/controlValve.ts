
/**
 * Control Valve Sizing (ISA 75.01)
 */

export interface ValveResult {
  Cv: number; // US Flow Coefficient
  Kv: number; // Metric Flow Coefficient
  flowRegime: 'Subcritical' | 'Critical' | 'Choked';
  chokedPressureDrop?: number; // bar
  expansionFactor?: number; // Y
}

/**
 * Liquid Sizing (Incompressible)
 * Cv = Q * sqrt(G / dP)
 * Check for Choked Flow: dP_choked = FL^2 * (P1 - Pv)
 * If dP > dP_choked, use dP_choked.
 * @param flowRate m3/h
 * @param P1 bar(a)
 * @param P2 bar(a)
 * @param SG Specific Gravity
 * @param Pv Vapor Pressure bar(a)
 * @param FL Liquid Pressure Recovery Factor (0.9 for Globe, 0.6 for Butterfly)
 */
export function sizeLiquidValve(
  flowRate: number,
  P1: number,
  P2: number,
  SG: number,
  Pv: number,
  FL: number = 0.9
): ValveResult {
  let dP = P1 - P2;
  let regime: ValveResult['flowRegime'] = 'Subcritical';
  
  // Choked Flow Check
  // dP_max = FL^2 * (P1 - Ff * Pv)
  // Ff = 0.96 - 0.28 * sqrt(Pv/Pc). Simplified: Ff ~ 0.96 if Pv << Pc.
  // Let's use simplified dP_allow = FL^2 * (P1 - Pv) for now.
  const dP_choked = Math.pow(FL, 2) * (P1 - Pv);

  if (dP >= dP_choked) {
    dP = dP_choked;
    regime = 'Choked';
  }

  // ISA 75.01 Eq for Liquid
  // Kv = Q / sqrt(dP / SG)  (Q in m3/h, dP in bar)
  // Cv = 1.156 * Kv
  
  // Ensure dP is positive
  if (dP <= 0) return { Cv: 0, Kv: 0, flowRegime: 'Subcritical' };

  const Kv = flowRate * Math.sqrt(SG / dP);
  const Cv = Kv * 1.156;

  return {
    Cv,
    Kv,
    flowRegime: regime,
    chokedPressureDrop: dP_choked
  };
}

/**
 * Gas Sizing (Compressible)
 * ISA 75.01 Eq
 * @param flowRate kg/h
 * @param P1 bar(a)
 * @param P2 bar(a)
 * @param T1 K
 * @param MW g/mol
 * @param Z Compressibility
 * @param k Heat Capacity Ratio
 * @param xT Pressure Drop Ratio Factor (0.72 for Globe)
 */
export function sizeGasValve(
  flowRate: number,
  P1: number,
  P2: number,
  T1: number,
  MW: number,
  Z: number,
  k: number,
  xT: number = 0.72
): ValveResult {
  const dP = P1 - P2;
  const x = dP / P1;
  
  // Specific Heat Ratio Factor Fk = k / 1.4
  const Fk = k / 1.4;
  
  // Choked Flow Limit x_T * Fk
  const x_choked = xT * Fk;
  
  let Y = 1.0; // Expansion Factor
  let regime: ValveResult['flowRegime'] = 'Subcritical';
  let x_eff = x;

  if (x >= x_choked) {
    x_eff = x_choked;
    regime = 'Choked';
    Y = 2/3; // At choked limit, Y = 1 - x_choked/(3*x_choked) ?? No, Y = 1 - x/(3*Fk*xT)
    // At limit x = xT*Fk, Y = 1 - 1/3 = 0.667
  } else {
    Y = 1 - (x / (3 * Fk * xT));
  }

  // ISA 75.01 Gas Eq (Mass Flow)
  // C = W / ( N6 * Y * sqrt(x * P1 * rho1) ) ??
  // Let's use the standard form:
  // Cv = W / ( 27.3 * Y * sqrt(x * P1 * rho1) ) ? No units vary.
  
  // Using standard simplified metric:
  // W (kg/h)
  // Kv = W / ( 31.6 * Y * sqrt(x * P1_bar * rho1_kgm3) ) ??
  
  // Let's use the form with MW and T:
  // Cv = W / ( 2.8 * Y * sqrt( dP_psi * P1_psi ) ) ?? No.
  
  // Correct Metric Eq (IEC 60534-2-1):
  // C = W / ( N6 * Y * sqrt( x * P1 * rho1 ) )
  // N6 = 2.73 for W in kg/h, P1 in bar, rho1 in kg/m3.
  // But we have MW/T/Z. rho1 = (MW * P1) / (Z * R * T1)
  
  // Let's calculate rho1 first.
  // P1 in bar -> P1 * 100 kPa.
  // rho = P * MW / (Z * R * T)
  // rho (kg/m3) = (P1_bar * 100 * MW_g_mol) / (Z * 8.314 * T1) -> (P * 1e5 * MW * 1e-3) / ...
  // rho = (P1_bar * 100 * MW) / (Z * 8.314 * T1)  (MW is g/mol = kg/kmol)
  const rho1 = (P1 * 100 * MW) / (Z * 8.314 * T1);

  // Kv = W / ( 31.6 * Y * sqrt( x_eff * P1 * rho1 ) ) ??
  // Let's use the standard W equation from Emerson/Fisher handbook:
  // Cv = W / ( 63.3 * Y * sqrt( x * P1 * rho1 ) ) ?? (Units?)
  
  // Let's use the N8 form (W, P1, MW, T1, Z):
  // C = W / ( N8 * P1 * Y * sqrt( x * MW / (T1 * Z) ) )
  // N8 = 94.8 for W in kg/h, P1 in bar.
  // Kv = W / ( 94.8 * P1 * Y * sqrt( x_eff * MW / (T1 * Z) ) )
  
  const N8 = 94.8;
  const Kv = flowRate / (N8 * P1 * Y * Math.sqrt((x_eff * MW) / (T1 * Z)));
  const Cv = Kv * 1.156;

  return {
    Cv,
    Kv,
    flowRegime: regime,
    expansionFactor: Y
  };
}
