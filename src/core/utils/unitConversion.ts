
/**
 * Unit Conversion Engine
 */

export interface UnitDef { factor: number; offset?: number }
export interface CategoryDef { label: string; baseUnit: string; units: Record<string, UnitDef> }

export interface StandardConditions {
  name: string;
  temperatureC: number;
  pressureBarA: number;
}

export const STANDARD_CONDITIONS: Record<string, StandardConditions> = {
  SCFM: { name: 'SCFM', temperatureC: 15.56, pressureBarA: 1.01325 },
  Nm3h: { name: 'Nm3/h', temperatureC: 0, pressureBarA: 1.01325 },
  Sm3h: { name: 'Sm3/h', temperatureC: 15, pressureBarA: 1.01325 },
};

export const CONVERSION_DATA: Record<string, CategoryDef> = {
  flow: { label: 'Volumetric Flow', baseUnit: 'm3/h', units: { 'm3/h': { factor: 1 }, 'bbl/d': { factor: 0.0066245 }, 'gpm': { factor: 0.22712 }, 'ft3/min (cfm)': { factor: 1.699 }, 'L/min': { factor: 0.06 }, 'm3/d': { factor: 0.041667 }, 'US gal/min': { factor: 0.2271247 }, 'Imp gal/min': { factor: 0.2727654 } } },
  massFlow: { label: 'Mass Flow', baseUnit: 'kg/h', units: { 'kg/h': { factor: 1 }, 'lb/h': { factor: 0.453592 }, 'tonne/h': { factor: 1000 }, 'kg/s': { factor: 3600 }, 'lb/s': { factor: 1632.93 } } },
  pressure: { label: 'Pressure', baseUnit: 'bar', units: { bar: { factor: 1 }, psi: { factor: 0.0689476 }, kPa: { factor: 0.01 }, MPa: { factor: 10 }, atm: { factor: 1.01325 }, 'kg/cm2': { factor: 0.980665 }, Pa: { factor: 0.00001 }, mmHg: { factor: 0.00133322 }, inHg: { factor: 0.0338639 } } },
  temperature: { label: 'Temperature', baseUnit: 'C', units: { C: { factor: 1, offset: 0 }, F: { factor: 0.55555555, offset: -32 }, K: { factor: 1, offset: -273.15 }, R: { factor: 0.55555555, offset: -491.67 } } },
  length: { label: 'Length', baseUnit: 'm', units: { m: { factor: 1 }, ft: { factor: 0.3048 }, inch: { factor: 0.0254 }, mm: { factor: 0.001 }, cm: { factor: 0.01 }, km: { factor: 1000 }, mile: { factor: 1609.34 } } },
  mass: { label: 'Mass', baseUnit: 'kg', units: { kg: { factor: 1 }, lb: { factor: 0.453592 }, 'metric ton': { factor: 1000 }, oz: { factor: 0.0283495 }, g: { factor: 0.001 } } },
  energy: { label: 'Energy', baseUnit: 'kJ', units: { kJ: { factor: 1 }, J: { factor: 0.001 }, Btu: { factor: 1.05506 }, kcal: { factor: 4.184 }, kWh: { factor: 3600 }, MMBtu: { factor: 1055060 }, 'ft-lbf': { factor: 0.00135582 } } },
  power: { label: 'Power', baseUnit: 'kW', units: { kW: { factor: 1 }, W: { factor: 0.001 }, MW: { factor: 1000 }, 'HP (mech)': { factor: 0.7457 }, 'HP (metric)': { factor: 0.7355 }, 'Btu/h': { factor: 0.00029307 } } },
  density: { label: 'Density', baseUnit: 'kg/m3', units: { 'kg/m3': { factor: 1 }, 'lb/ft3': { factor: 16.0185 }, 'g/cm3': { factor: 1000 }, 'lb/gal': { factor: 119.826 }, SG: { factor: 999.016 } } },
  viscosity: { label: 'Viscosity (Dynamic)', baseUnit: 'cP', units: { cP: { factor: 1 }, 'Pa.s': { factor: 1000 }, P: { factor: 100 }, 'lb/ft.s': { factor: 1488.16 } } },
  gasFlow: { label: 'Gas Flow (Standard)', baseUnit: 'MMSCFD', units: { MMSCFD: { factor: 1 }, 'Sm3/d': { factor: 0.0000353147 }, 'Sm3/h': { factor: 0.00084755 }, SCFM: { factor: 0.00144 } } },
};

export function apiToSG(api: number): number { return 141.5 / (api + 131.5); }
export function sgToAPI(sg: number): number { return 141.5 / sg - 131.5; }
export function sgToDensity(sg: number, refDensity = 999.016): number { return sg * refDensity; }
export function densityToSG(density: number, refDensity = 999.016): number { return density / refDensity; }

export function convertUnit(value: number, fromUnit: string, toUnit: string, category: string): number {
  const catDef = CONVERSION_DATA[category];
  if (!catDef || !Number.isFinite(value)) return NaN;

  if (category === 'density' && (fromUnit === 'API' || toUnit === 'API')) {
    const density = fromUnit === 'API' ? sgToDensity(apiToSG(value)) : (fromUnit === 'SG' ? sgToDensity(value) : convertUnit(value, fromUnit, 'kg/m3', category));
    if (toUnit === 'API') return sgToAPI(densityToSG(density));
    if (toUnit === 'SG') return densityToSG(density);
    return convertUnit(density, 'kg/m3', toUnit, category);
  }

  const fromDef = catDef.units[fromUnit];
  const toDef = catDef.units[toUnit];
  if (!fromDef || !toDef) return NaN;

  const valInBase = (value + (fromDef.offset || 0)) * fromDef.factor;
  return (valInBase / toDef.factor) - (toDef.offset || 0);
}

export function validateUnitRequest(category: string, fromUnit: string, toUnit: string): string | undefined {
  const catDef = CONVERSION_DATA[category];
  if (!catDef) return `Unknown category: ${category}`;
  if (!(fromUnit in catDef.units) && fromUnit !== 'API') return `Unsupported fromUnit ${fromUnit} for ${category}`;
  if (!(toUnit in catDef.units) && toUnit !== 'API') return `Unsupported toUnit ${toUnit} for ${category}`;
  return undefined;
}

export function roundEngineering(value: number, sigFigs = 4): number {
  if (value === 0 || !Number.isFinite(value)) return value;
  const exp = Math.floor(Math.log10(Math.abs(value)));
  const scale = Math.pow(10, sigFigs - exp - 1);
  return Math.round(value * scale) / scale;
}
