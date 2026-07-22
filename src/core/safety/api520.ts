// src/core/safety/api520.ts

// API 526 orifice designations (letters) and areas (in²)
export const API_ORIFICES = [
  { letter: 'D', area: 7.69 },
  { letter: 'E', area: 12.45 },
  { letter: 'F', area: 19.61 },
  { letter: 'G', area: 31.61 },
  { letter: 'H', area: 49.83 },
  { letter: 'J', area: 78.97 },
  { letter: 'K', area: 126.45 },
  { letter: 'L', area: 197.93 },
  { letter: 'M', area: 316.13 },
  { letter: 'N', area: 506.45 },
  { letter: 'P', area: 806.45 },
  { letter: 'Q', area: 1290.32 },
  { letter: 'R', area: 2064.52 },
  { letter: 'T', area: 3193.55 },
] as const;

// Helper: find orifice by letter (returns the whole object or undefined)
export function findOrificeByLetter(letter: string) {
  return API_ORIFICES.find(o => o.letter === letter);
}

// Helper: get area by letter (returns number or undefined)
export function getOrificeArea(letter: string): number | undefined {
  return findOrificeByLetter(letter)?.area;
}

// Original gas sizing function (kept as-is)
export function api520Gas(
  W: number,
  T: number,
  P1: number,
  P2: number,
  M: number,
  k: number,
  Z: number,
  Kd: number = 0.975,
  Kb: number = 1,
  Kc: number = 1
) {
  const C = 520 * Math.sqrt(k * Math.pow(2 / (k + 1), (k + 1) / (k - 1)));
  const r = P2 / P1;
  let F2 = 1;
  if (r > Math.pow(2 / (k + 1), k / (k - 1))) {
    F2 = Math.sqrt(
      (k / (k - 1)) *
        (Math.pow(r, 2 / k) * (1 - Math.pow(r, (k - 1) / k))) /
        (1 - r)
    );
  }
  const A = (W * Math.sqrt(T * Z)) / (C * Kd * P1 * Kb * Kc * Math.sqrt(M));
  return { area: A, F2, choked: F2 === 1 };
}

// Alias for UI compatibility
export const calculateReliefArea = api520Gas;
