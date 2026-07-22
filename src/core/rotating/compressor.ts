// src/core/rotating/compressor.ts
import { R_UNIVERSAL } from '../constants';

function calculateZ_RK(T: number, P: number, Tc: number, Pc: number): number {
  const Tr = T / Tc, Pr = P / Pc;
  const a = 0.42748 * (R_UNIVERSAL ** 2 * Tc ** 2.5) / Pc;
  const b = 0.08664 * (R_UNIVERSAL * Tc) / Pc;
  let Z = 1.0;
  for (let i = 0; i < 20; i++) {
    const A = a * P / ((R_UNIVERSAL * T) ** 2);
    const B = b * P / (R_UNIVERSAL * T);
    const fZ = Z**3 - Z**2 + (A - B - B**2) * Z - A * B;
    const fPrime = 3*Z**2 - 2*Z + (A - B - B**2);
    const newZ = Z - fZ / fPrime;
    if (Math.abs(newZ - Z) < 1e-6) { Z = newZ; break; }
    Z = newZ;
  }
  return Z;
}

export function sizeCompressor(P1: number, P2: number, T1: number, MW: number, massFlow: number, eta_p: number, k: number, Tc: number, Pc: number) {
  const R = R_UNIVERSAL / (MW / 1000);
  const pr = P2 / P1;
  const Z1 = calculateZ_RK(T1, P1, Tc, Pc);
  const m = (k-1) / (k * eta_p);
  const T2_ideal = T1 * Math.pow(pr, m);
  const Z2 = calculateZ_RK(T2_ideal, P2, Tc, Pc);
  const Z_avg = (Z1 + Z2) / 2;
  const Hp = (Z_avg * R * T1 / m) * (Math.pow(pr, m) - 1);
  const gasPower = (massFlow * Hp) / eta_p;
  const brakePower = gasPower / 0.97;
  return { Hp, T2: T2_ideal, Z_avg, gasPower, brakePower };
}
