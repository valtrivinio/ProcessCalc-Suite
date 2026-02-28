
/**
 * Unit Conversion Engine
 */

export interface UnitDef {
  factor: number; // Multiplier to convert TO base unit
  offset?: number; // Add before multiplying (for base conversion) or subtract after (from base)
}

export interface CategoryDef {
  label: string;
  baseUnit: string;
  units: Record<string, UnitDef>;
}

export const CONVERSION_DATA: Record<string, CategoryDef> = {
  flow: {
    label: 'Volumetric Flow',
    baseUnit: 'm3/h',
    units: {
      'm3/h': { factor: 1 },
      'bbl/d': { factor: 0.0066245 },
      'gpm': { factor: 0.22712 },
      'ft3/min (cfm)': { factor: 1.699 },
      'L/min': { factor: 0.06 },
      'm3/d': { factor: 0.041667 },
      'US gal/min': { factor: 0.2271247 },
      'Imp gal/min': { factor: 0.2727654 },
    }
  },
  massFlow: {
    label: 'Mass Flow',
    baseUnit: 'kg/h',
    units: {
      'kg/h': { factor: 1 },
      'lb/h': { factor: 0.453592 },
      'tonne/h': { factor: 1000 },
      'kg/s': { factor: 3600 },
      'lb/s': { factor: 1632.93 },
    }
  },
  pressure: {
    label: 'Pressure',
    baseUnit: 'bar',
    units: {
      'bar': { factor: 1 },
      'psi': { factor: 0.0689476 },
      'kPa': { factor: 0.01 },
      'MPa': { factor: 10 },
      'atm': { factor: 1.01325 },
      'kg/cm2': { factor: 0.980665 },
      'Pa': { factor: 0.00001 },
      'mmHg': { factor: 0.00133322 },
      'inHg': { factor: 0.0338639 },
    }
  },
  temperature: {
    label: 'Temperature',
    baseUnit: 'C',
    units: {
      'C': { factor: 1, offset: 0 },
      'F': { factor: 0.55555555, offset: -32 }, // (F - 32) * 5/9 = C
      'K': { factor: 1, offset: -273.15 }, // K - 273.15 = C
      'R': { factor: 0.55555555, offset: -491.67 }, // (R - 491.67) * 5/9 = C
    }
  },
  length: {
    label: 'Length',
    baseUnit: 'm',
    units: {
      'm': { factor: 1 },
      'ft': { factor: 0.3048 },
      'inch': { factor: 0.0254 },
      'mm': { factor: 0.001 },
      'cm': { factor: 0.01 },
      'km': { factor: 1000 },
      'mile': { factor: 1609.34 },
    }
  },
  mass: {
    label: 'Mass',
    baseUnit: 'kg',
    units: {
      'kg': { factor: 1 },
      'lb': { factor: 0.453592 },
      'metric ton': { factor: 1000 },
      'oz': { factor: 0.0283495 },
      'g': { factor: 0.001 },
    }
  },
  energy: {
    label: 'Energy',
    baseUnit: 'kJ',
    units: {
      'kJ': { factor: 1 },
      'J': { factor: 0.001 },
      'Btu': { factor: 1.05506 },
      'kcal': { factor: 4.184 },
      'kWh': { factor: 3600 },
      'MMBtu': { factor: 1055060 },
      'ft-lbf': { factor: 0.00135582 },
    }
  },
  power: {
    label: 'Power',
    baseUnit: 'kW',
    units: {
      'kW': { factor: 1 },
      'W': { factor: 0.001 },
      'MW': { factor: 1000 },
      'HP (mech)': { factor: 0.7457 },
      'HP (metric)': { factor: 0.7355 },
      'Btu/h': { factor: 0.00029307 },
    }
  },
  density: {
    label: 'Density',
    baseUnit: 'kg/m3',
    units: {
      'kg/m3': { factor: 1 },
      'lb/ft3': { factor: 16.0185 },
      'g/cm3': { factor: 1000 },
      'lb/gal': { factor: 119.826 },
      'API': { factor: 0 } // Special handling needed, but keeping placeholder
    }
  },
  viscosity: {
    label: 'Viscosity (Dynamic)',
    baseUnit: 'cP',
    units: {
      'cP': { factor: 1 },
      'Pa.s': { factor: 1000 },
      'P': { factor: 100 },
      'lb/ft.s': { factor: 1488.16 },
    }
  },
  gasFlow: {
    label: 'Gas Flow (Standard)',
    baseUnit: 'MMSCFD',
    units: {
      'MMSCFD': { factor: 1 },
      'Sm3/d': { factor: 0.0000353147 },
      'Sm3/h': { factor: 0.00084755 },
      'SCFM': { factor: 0.00144 },
    }
  }
};

/**
 * Convert value from one unit to another
 */
export function convertUnit(value: number, fromUnit: string, toUnit: string, category: string): number {
  const catDef = CONVERSION_DATA[category];
  if (!catDef) return NaN;

  const fromDef = catDef.units[fromUnit];
  const toDef = catDef.units[toUnit];

  if (!fromDef || !toDef) return NaN;

  // 1. Convert FROM unit TO Base unit
  // Formula: (Value + Offset) * Factor = BaseValue
  // Note: For Temp, offset is applied BEFORE factor (if factor is 1). 
  // Actually, standard linear conversion: y = mx + c.
  // Here we defined: Base = (Val + Offset) * Factor ??
  // Let's check Temp:
  // C to K: K = C + 273.15. Base=C.
  // K def: factor=1, offset=-273.15.
  // Base = (K + (-273.15)) * 1 = K - 273.15 = C. Correct.
  
  // F to C: C = (F - 32) * 5/9.
  // F def: factor=0.555, offset=-32.
  // Base = (F + (-32)) * 0.555 = (F-32)*5/9 = C. Correct.
  
  const valInBase = (value + (fromDef.offset || 0)) * fromDef.factor;

  // 2. Convert Base unit TO Target unit
  // Formula: (BaseValue / Factor) - Offset = TargetValue
  const result = (valInBase / toDef.factor) - (toDef.offset || 0);

  return result;
}
