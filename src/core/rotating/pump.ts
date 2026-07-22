// src/core/rotating/pump.ts
import { G } from '../constants';

export function npsha(P_s: number, P_v: number, rho: number, h_s: number, h_f: number) {
  const raw = (P_s - P_v) / (rho * G) + h_s - h_f;
  return raw - 0.6; // safety margin
}

export function hydraulicPower(Q: number, H: number, rho: number) {
  return (rho * G * Q * H) / 1000;
}
