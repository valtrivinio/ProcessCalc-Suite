// src/core/constants.ts
export const G = 9.80665; // m/s²
export const R_UNIVERSAL = 8.314462618; // J/(mol·K)
export const ATM_PA = 101325; // Pa
export const PSI_TO_PA = 6894.76;
export const BAR_TO_PA = 100000;

export const UNIT_CONVERSIONS = {
  cP_to_Pas: 0.001,
  mm_to_m: 0.001,
  inch_to_m: 0.0254,
} as const;
