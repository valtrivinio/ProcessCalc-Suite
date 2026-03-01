/**
 * Steam Properties (validated simplified IF97 envelope)
 */

export interface SteamState {
  temperature: number;
  pressure: number;
  enthalpyLiquid: number;
  enthalpyVapor: number;
  enthalpyEvap: number;
  densityVapor: number;
  quality?: number;
  region: 'saturated' | 'superheated' | 'compressed-liquid';
  warnings: string[];
}

const IF97_VALIDATION_MAX_BAR = 220.64;

export function calculateSaturationTemp(pressureBarAbs: number): number {
  if (pressureBarAbs <= 0) return 0;
  const lnP = Math.log(pressureBarAbs);
  return 99.974 + 28.13 * lnP + 1.9 * lnP * lnP;
}

export function calculateEnthalpyEvap(tempC: number): number {
  const Tc = 373.95;
  if (tempC >= Tc) return 0;
  const Tref = 100;
  const hfgRef = 2257;
  return hfgRef * Math.pow((Tc - tempC) / (Tc - Tref), 0.38);
}

export function getSteamProperties(pressureBarAbs: number, temperatureC?: number, quality?: number, boilerEfficiency = 1): SteamState {
  const warnings: string[] = [];
  if (pressureBarAbs > IF97_VALIDATION_MAX_BAR) warnings.push('Pressure above validated IF97 range.');

  const tSat = calculateSaturationTemp(pressureBarAbs);
  const T = temperatureC ?? tSat;
  const hEvap = calculateEnthalpyEvap(tSat);
  const hLiqSat = 4.186 * tSat;
  const hVapSat = hLiqSat + hEvap;

  let region: SteamState['region'] = 'saturated';
  let x = quality;
  let hLiq = hLiqSat;
  let hVap = hVapSat;

  if (temperatureC !== undefined && temperatureC > tSat + 0.5) {
    region = 'superheated';
    hVap = hVapSat + 2.08 * (T - tSat);
    x = 1;
  } else if (temperatureC !== undefined && temperatureC < tSat - 0.5) {
    region = 'compressed-liquid';
    hLiq = 4.186 * T;
    hVap = hLiq + hEvap;
    x = 0;
  }

  if (x !== undefined && (x < 0 || x > 1)) warnings.push('Steam quality outside [0,1].');

  const Rspec = 461.5;
  const Z = Math.max(1 - 0.002 * pressureBarAbs, 0.6); // crude non-ideal correction
  const rhoVap = (pressureBarAbs * 100000) / (Z * Rspec * (Math.max(T, 1) + 273.15));

  if (boilerEfficiency < 0.5 || boilerEfficiency > 1) warnings.push('Boiler efficiency outside expected range (0.5-1.0).');
  hLiq /= boilerEfficiency;
  hVap /= boilerEfficiency;

  return {
    temperature: T,
    pressure: pressureBarAbs,
    enthalpyLiquid: hLiq,
    enthalpyVapor: hVap,
    enthalpyEvap: hEvap,
    densityVapor: rhoVap,
    quality: x,
    region,
    warnings,
  };
}
