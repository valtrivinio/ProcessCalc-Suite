
/**
 * Compressor Sizing & Analysis
 * Based on GPSA Engineering Data Book / API 617
 */

export interface CompressorResult {
  polytropicHead: number; // kJ/kg
  dischargeTemp: number; // C
  gasPower: number; // kW
  brakePower: number; // kW
  volumetricFlowInlet: number; // m3/h
}

/**
 * Calculate Polytropic Head
 * Hp = (Z_avg * R * T1 / (MW * (n-1)/n)) * [ (P2/P1)^((n-1)/n) - 1 ]
 * @param P1 Inlet Pressure (kPa abs)
 * @param P2 Discharge Pressure (kPa abs)
 * @param T1 Inlet Temp (K)
 * @param Z1 Inlet Compressibility
 * @param Z2 Discharge Compressibility (Estimated)
 * @param MW Molecular Weight
 * @param k Heat Capacity Ratio (Cp/Cv)
 * @param eta_p Polytropic Efficiency (0-1)
 */
export function calculateCompressor(
  P1: number,
  P2: number,
  T1: number,
  Z1: number,
  MW: number,
  k: number,
  eta_p: number,
  massFlow: number // kg/h
): CompressorResult {
  const R_univ = 8.314; // kJ/kmol.K
  
  // Polytropic exponent n
  // (n-1)/n = (k-1)/(k * eta_p)
  const m = (k - 1) / (k * eta_p);
  const n = 1 / (1 - m);

  // Discharge Temp T2
  // T2 = T1 * (P2/P1)^m
  const pr = P2 / P1;
  const T2 = T1 * Math.pow(pr, m);

  // Average Z (Simplified: assume Z2 approx Z1 or linear)
  // Ideally iterate, but for sizing Z_avg = Z1 is often used or (Z1+Z2)/2
  // Let's use Z1 for now as Z2 requires EOS at T2,P2
  const Z_avg = Z1; 

  // Polytropic Head (kJ/kg)
  // Hp = (Z_avg * (8.314/MW) * T1 / m) * (pr^m - 1)
  // Note: 8.314 is J/mol.K -> 8314 J/kmol.K. 
  // MW in g/mol = kg/kmol.
  // So (8314 / MW) gives J/kg.K
  // Result in J/kg. Divide by 1000 for kJ/kg.
  
  const R_gas = 8314 / MW; // J/kg.K
  const Hp_J = (Z_avg * R_gas * T1 / m) * (Math.pow(pr, m) - 1);
  const Hp_kJ = Hp_J / 1000;

  // Gas Power (kW)
  // P = (MassFlow_kg_s * Hp_kJ) / eta_p
  const massFlow_s = massFlow / 3600;
  const gasPower = (massFlow_s * Hp_kJ) / eta_p;

  // Brake Power (add mechanical losses ~3%)
  const brakePower = gasPower / 0.97;

  // Inlet Volumetric Flow (m3/h)
  // PV = nRT -> V = nRT/P = (m/MW)RT/P
  // V (m3) = (mass_kg * 1000 / MW) * 8.314 * T1 / (P1_kPa)
  // Flow m3/h
  const volFlow = (massFlow / MW) * 8.314 * T1 / P1; // (kg/h / (kg/kmol)) * kJ/kmol.K * K / kPa = kmol/h * ...

  return {
    polytropicHead: Hp_kJ,
    dischargeTemp: T2 - 273.15, // C
    gasPower,
    brakePower,
    volumetricFlowInlet: volFlow
  };
}
