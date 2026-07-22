// src/core/rotating/pump.ts
import { G } from '../constants';

// Original function – kept for compatibility
export function npsha(P_s: number, P_v: number, rho: number, h_s: number, h_f: number) {
  const raw = (P_s - P_v) / (rho * G) + h_s - h_f;
  return raw - 0.6; // safety margin
}

// Alias expected by PumpSizing.tsx
export const calculateNPSHa = npsha;

// Original function – kept for compatibility
export function hydraulicPower(Q: number, H: number, rho: number) {
  return (rho * G * Q * H) / 1000;
}

// Alias expected by PumpSizing.tsx
export const calculateHydraulicPower = hydraulicPower;
