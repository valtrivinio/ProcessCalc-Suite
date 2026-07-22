// src/core/fluid/pipeSizing.ts
import { colebrookFriction, reynolds } from './flowEquations';

const pipeDB = [
  { nominal: 0.5, ID_m: 0.0158, OD_m: 0.0213, schedule: 40 },
  { nominal: 1, ID_m: 0.0266, OD_m: 0.0334, schedule: 40 },
  { nominal: 2, ID_m: 0.0525, OD_m: 0.0603, schedule: 40 },
  { nominal: 3, ID_m: 0.0779, OD_m: 0.0889, schedule: 40 },
  { nominal: 4, ID_m: 0.1023, OD_m: 0.1143, schedule: 40 },
  { nominal: 6, ID_m: 0.1541, OD_m: 0.1683, schedule: 40 },
  { nominal: 8, ID_m: 0.2027, OD_m: 0.2191, schedule: 40 },
  { nominal: 10, ID_m: 0.2545, OD_m: 0.2731, schedule: 40 },
  { nominal: 12, ID_m: 0.3032, OD_m: 0.3239, schedule: 40 },
  { nominal: 2, ID_m: 0.0498, OD_m: 0.0603, schedule: 80 },
  { nominal: 4, ID_m: 0.0972, OD_m: 0.1143, schedule: 80 },
];

export function sizePipe(Q: number, rho: number, mu_cP: number, eps: number, maxVel?: number) {
  maxVel = maxVel || 30;
  for (const pipe of pipeDB) {
    const A = Math.PI * (pipe.ID_m / 2) ** 2;
    const v = Q / A;
    if (v > maxVel) continue;
    const Re = reynolds(rho, v, pipe.ID_m, mu_cP);
    const f = colebrookFriction(eps, pipe.ID_m, Re);
    return { ...pipe, velocity: v, Reynolds: Re, frictionFactor: f };
  }
  throw new Error('No pipe size found for given flow and velocity limit');
}
