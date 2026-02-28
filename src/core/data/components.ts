
export interface Component {
  name: string;
  formula: string;
  mw: number; // g/mol
  Tc: number; // K
  Pc: number; // bar
  omega: number; // Acentric factor
}

export const COMPONENTS: Record<string, Component> = {
  'Methane': { name: 'Methane', formula: 'CH4', mw: 16.04, Tc: 190.56, Pc: 45.99, omega: 0.011 },
  'Ethane': { name: 'Ethane', formula: 'C2H6', mw: 30.07, Tc: 305.32, Pc: 48.72, omega: 0.099 },
  'Propane': { name: 'Propane', formula: 'C3H8', mw: 44.10, Tc: 369.83, Pc: 42.48, omega: 0.152 },
  'n-Butane': { name: 'n-Butane', formula: 'n-C4H10', mw: 58.12, Tc: 425.12, Pc: 37.96, omega: 0.200 },
  'i-Butane': { name: 'i-Butane', formula: 'i-C4H10', mw: 58.12, Tc: 408.14, Pc: 36.48, omega: 0.181 },
  'n-Pentane': { name: 'n-Pentane', formula: 'n-C5H12', mw: 72.15, Tc: 469.7, Pc: 33.70, omega: 0.252 },
  'n-Hexane': { name: 'n-Hexane', formula: 'n-C6H14', mw: 86.18, Tc: 507.6, Pc: 30.25, omega: 0.301 },
  'Nitrogen': { name: 'Nitrogen', formula: 'N2', mw: 28.01, Tc: 126.2, Pc: 33.9, omega: 0.037 },
  'Oxygen': { name: 'Oxygen', formula: 'O2', mw: 32.00, Tc: 154.6, Pc: 50.43, omega: 0.022 },
  'CO2': { name: 'Carbon Dioxide', formula: 'CO2', mw: 44.01, Tc: 304.1, Pc: 73.8, omega: 0.224 },
  'Water': { name: 'Water', formula: 'H2O', mw: 18.02, Tc: 647.1, Pc: 220.6, omega: 0.344 },
  'Air': { name: 'Air', formula: 'Mix', mw: 28.96, Tc: 132.5, Pc: 37.7, omega: 0.035 }, // Pseudo-component
};
