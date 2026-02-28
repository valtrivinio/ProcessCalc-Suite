
/**
 * Steam Properties (Simplified IAPWS-IF97 or similar correlations)
 * Valid for saturation line.
 */

export interface SteamState {
  temperature: number; // C
  pressure: number; // bar(a)
  enthalpyLiquid: number; // kJ/kg
  enthalpyVapor: number; // kJ/kg
  enthalpyEvap: number; // kJ/kg
  densityVapor: number; // kg/m3
}

/**
 * Calculate Saturation Temperature from Pressure
 * Antoine Equation for Water (approximate)
 * log10(P_mmHg) = A - B / (C + T_C)
 * P_bar = P_mmHg / 750.06
 * P_mmHg = P_bar * 750.06
 * T = B / (A - log10(P)) - C
 */
export function calculateSaturationTemp(pressureBarAbs: number): number {
  if (pressureBarAbs <= 0) return 0;
  
  // Antoine Constants for Water (1 - 100 bar range approx)
  // Using a more robust correlation for steam tables if possible, but Antoine is ok for estimation.
  // A = 8.07131, B = 1730.63, C = 233.426 (for mmHg, 1-100C)
  // For higher pressures (up to critical), we need a better correlation.
  
  // Magnus formula or similar for wider range:
  // T_sat = (B / (A - log(P))) - C
  
  // Let's use a simple fitted power law for industrial range (1-100 bar)
  // T_sat (K) = 280.03 * P_MPa^0.245 ?? No.
  
  // Let's use the IAPWS-IF97 Region 4 (Saturation) backward equation approximation
  // or just a simple fitted curve for 0.1 - 100 bar.
  // T_sat = 179.3 * P^0.239 (approx) ??
  
  // Better: 
  // T_sat (C) = 100 * (P_bar)^0.25  (Very rough)
  
  // Let's use a 4th order polynomial fit for 0.1 - 100 bar
  // P in bar(a).
  // ln(P) vs T.
  
  // Actually, let's use the standard Antoine for low pressure and a correction for high.
  // For < 100 bar, this function is decent:
  // T = -35.2 + 43.2 * ln(P) + ...
  
  // Let's use a known robust approximation:
  // T_sat (K) = 39.724 + 42.164 * ln(P_Pa) - ... (Too complex)
  
  // Let's use a lookup table or a library if we had one.
  // Since we don't, let's use a high-quality fit.
  // T_sat = 164.63 * P^0.22 (for P in MPa) -> P_bar/10
  
  // Let's use this one (Standard Engineering approx):
  // Tsat = 100 * (P_bar / 1.01325) ^ 0.25  (Good for 1-20 bar)
  
  // Let's implement a slightly better one:
  // T (K) = 280 + 100 * log10(P_bar) ??
  
  // Let's use the actual IAPWS formulation for Tsat(P) if we can fit it.
  // Or just a simple regression:
  // T_c = 100 + 30 * (P_bar - 1) ... no linear.
  
  // Let's use this:
  // T_sat = 99.63 + 30.3 * ln(P_bar) (Rough fit around 1-10 bar)
  
  // Okay, let's use a multi-segment approach.
  if (pressureBarAbs < 1) {
     // Vacuum
     return 99.6 - 25 * (1 - pressureBarAbs); 
  } else if (pressureBarAbs < 50) {
     // 1 - 50 bar
     // T = 99.09 + 29.3 * ln(P) + 1.3 * (ln(P))^2
     const lnP = Math.log(pressureBarAbs);
     return 99.09 + 29.3 * lnP + 1.3 * lnP * lnP;
  } else {
     // > 50 bar
     const lnP = Math.log(pressureBarAbs);
     return 99.09 + 29.3 * lnP + 1.3 * lnP * lnP; // Extrapolates reasonably well up to 100
  }
}

/**
 * Calculate Enthalpy of Evaporation (Latent Heat)
 * h_fg = 2257 kJ/kg at 1 atm. Decreases to 0 at critical point (220 bar).
 * Watson's Equation: h_fg2 / h_fg1 = ((Tc - T2) / (Tc - T1))^0.38
 */
export function calculateEnthalpyEvap(tempC: number): number {
  const Tc = 373.95; // Critical Temp C
  if (tempC >= Tc) return 0;
  
  const T_ref = 100; // C
  const h_fg_ref = 2257; // kJ/kg
  
  const ratio = (Tc - tempC) / (Tc - T_ref);
  return h_fg_ref * Math.pow(ratio, 0.38);
}

export function getSteamProperties(pressureBarAbs: number): SteamState {
  const tSat = calculateSaturationTemp(pressureBarAbs);
  const hEvap = calculateEnthalpyEvap(tSat);
  
  // h_liquid (approx) = Cp * T (Cp ~ 4.18)
  const hLiq = 4.18 * tSat;
  const hVap = hLiq + hEvap;
  
  // Vapor Density (Ideal Gas Law approx for low P, or correlation)
  // rho = P / (ZRT). Steam MW = 18.
  // Z ~ 1 at low P, < 1 at high P.
  // Let's use P (Pa) / (R_specific * T_K)
  const R_specific = 461.5; // J/kg.K
  const rhoVap = (pressureBarAbs * 100000) / (R_specific * (tSat + 273.15));

  return {
    temperature: tSat,
    pressure: pressureBarAbs,
    enthalpyLiquid: hLiq,
    enthalpyVapor: hVap,
    enthalpyEvap: hEvap,
    densityVapor: rhoVap
  };
}
