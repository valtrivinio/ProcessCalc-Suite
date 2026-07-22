// src/core/thermal/steamProperties.ts
// Approximations based on IAPWS-97 (accurate for 0-100 bar)

// --- Individual property functions ---

export function satTempFromPressure(P_bar: number): number {
  if (P_bar <= 0) return 0;
  return 100 * Math.pow(P_bar / 1.013, 0.135) - 0.5;
}

export function satPressureFromTemp(T_C: number): number {
  if (T_C <= 0) return 0.0061;
  return Math.pow((T_C + 0.5) / 100, 1 / 0.135) * 1.013;
}

export function latentHeat(T_C: number): number {
  const T_r = (T_C + 273.15) / 647.096;
  return 2257 * Math.pow(1 - T_r, 0.38); // kJ/kg
}

export function specificVolumeLiquid(T_C: number): number {
  return 0.001001 + 0.0000001 * T_C; // m³/kg
}

// Additional property: specific volume of saturated steam (approximate)
export function specificVolumeVapor(T_C: number): number {
  // Ideal gas approximation at saturation
  const T_K = T_C + 273.15;
  const P_sat = satPressureFromTemp(T_C) * 100; // kPa
  const R_steam = 0.4615; // kJ/(kg·K)
  return (R_steam * T_K) / (P_sat * 1000); // m³/kg (converted from kPa)
}

// Additional property: specific enthalpy of saturated liquid (approximate)
export function enthalpyLiquid(T_C: number): number {
  // Using cp_water ~ 4.18 kJ/(kg·K) and reference 0°C = 0 kJ/kg
  return 4.18 * T_C; // kJ/kg
}

// Additional property: specific enthalpy of saturated vapor (approximate)
export function enthalpyVapor(T_C: number): number {
  return enthalpyLiquid(T_C) + latentHeat(T_C); // kJ/kg
}

// --- Main function: getSteamProperties (expected by Utilities.tsx) ---

export function getSteamProperties(input: { pressure?: number; temperature?: number }): {
  temperature: number;
  pressure: number;
  specificVolumeLiquid: number;
  specificVolumeVapor: number;
  enthalpyLiquid: number;
  enthalpyVapor: number;
  latentHeat: number;
} {
  let T_C: number;
  let P_bar: number;

  if (input.temperature !== undefined) {
    T_C = input.temperature;
    P_bar = satPressureFromTemp(T_C);
  } else if (input.pressure !== undefined) {
    P_bar = input.pressure;
    T_C = satTempFromPressure(P_bar);
  } else {
    throw new Error('Either temperature or pressure must be provided');
  }

  return {
    temperature: T_C,
    pressure: P_bar,
    specificVolumeLiquid: specificVolumeLiquid(T_C),
    specificVolumeVapor: specificVolumeVapor(T_C),
    enthalpyLiquid: enthalpyLiquid(T_C),
    enthalpyVapor: enthalpyVapor(T_C),
    latentHeat: latentHeat(T_C),
  };
}
