// src/core/safety/api520.ts

// API 520 standard orifice areas (in mm²) for common sizes
export const API_ORIFICES = {
  'D': 7.69,
  'E': 12.45,
  'F': 19.61,
  'G': 31.61,
  'H': 49.83,
  'J': 78.97,
  'K': 126.45,
  'L': 197.93,
  'M': 316.13,
  'N': 506.45,
  'P': 806.45,
  'Q': 1290.32,
  'R': 2064.52,
  'T': 3193.55,
} as const;

export type OrificeSize = keyof typeof API_ORIFICES;

// Main sizing function
export function api520Gas(W: number, T: number, P1: number, P2: number, M: number, k: number, Z: number, Kd: number = 0.975, Kb: number = 1, Kc: number = 1) {
  const C = 520 * Math.sqrt(k * Math.pow(2/(k+1), (k+1)/(k-1)));
  const r = P2 / P1;
  let F2 = 1;
  if (r > Math.pow(2/(k+1), k/(k-1))) {
    F2 = Math.sqrt( (k/(k-1)) * ( Math.pow(r, 2/k) * (1 - Math.pow(r, (k-1)/k)) ) / (1 - r) );
  }
  const A = (W * Math.sqrt(T * Z)) / (C * Kd * P1 * Kb * Kc * Math.sqrt(M));
  return { area: A, F2, choked: F2 === 1 };
}

// Alias for UI compatibility (ReliefValve expects calculateReliefArea)
export function calculateReliefArea(params: {
  W: number;
  T: number;
  P1: number;
  P2: number;
  M: number;
  k: number;
  Z: number;
  Kd?: number;
  Kb?: number;
  Kc?: number;
}) {
  const result = api520Gas(params.W, params.T, params.P1, params.P2, params.M, params.k, params.Z, params.Kd, params.Kb, params.Kc);
  // Also return the selected orifice size if needed
  const area = result.area;
  let selectedOrifice: OrificeSize | null = null;
  for (const [size, areaVal] of Object.entries(API_ORIFICES)) {
    if (areaVal >= area) {
      selectedOrifice = size as OrificeSize;
      break;
    }
  }
  return {
    area,
    selectedOrifice,
    choked: result.choked,
    F2: result.F2,
  };
}
