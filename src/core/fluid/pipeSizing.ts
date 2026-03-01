/**
 * Pipe Sizing Core Logic
 * ASME B36.10M / Crane TP-410 / GPSA
 */

import { clamp } from '../utils/engine';

export interface PipeSchedule {
  nps: string;
  schedule: string;
  id_mm: number;
  od_mm: number;
  wall_mm: number;
}

export interface FrictionFactorResult {
  frictionFactor: number;
  reynoldsBand: 'laminar' | 'transition' | 'turbulent';
  convergence: { converged: boolean; iterations: number; residual: number; capped?: boolean };
  warnings: string[];
}

export interface CompressibleFlowAssessment {
  criticalPressureRatio: number;
  criticalPressure: number;
  isChoked: boolean;
  chokedWarning?: string;
}

export const PIPE_DATABASE: PipeSchedule[] = [
  { nps: '0.5', schedule: '40', id_mm: 15.8, od_mm: 21.3, wall_mm: 2.77 },
  { nps: '0.75', schedule: '40', id_mm: 20.9, od_mm: 26.7, wall_mm: 2.87 },
  { nps: '1', schedule: '40', id_mm: 26.6, od_mm: 33.4, wall_mm: 3.38 },
  { nps: '1.5', schedule: '40', id_mm: 40.9, od_mm: 48.3, wall_mm: 3.68 },
  { nps: '2', schedule: '40', id_mm: 52.5, od_mm: 60.3, wall_mm: 3.91 },
  { nps: '2', schedule: '80', id_mm: 49.3, od_mm: 60.3, wall_mm: 5.54 },
  { nps: '3', schedule: '40', id_mm: 77.9, od_mm: 88.9, wall_mm: 5.49 },
  { nps: '4', schedule: '40', id_mm: 102.3, od_mm: 114.3, wall_mm: 6.02 },
  { nps: '6', schedule: '40', id_mm: 154.1, od_mm: 168.3, wall_mm: 7.11 },
  { nps: '8', schedule: '40', id_mm: 202.7, od_mm: 219.1, wall_mm: 8.18 },
  { nps: '10', schedule: '40', id_mm: 254.5, od_mm: 273.0, wall_mm: 9.27 },
  { nps: '12', schedule: '40', id_mm: 304.8, od_mm: 323.8, wall_mm: 9.52 },
];

export function calculateReynolds(density: number, velocity: number, diameter: number, viscosity: number): number {
  if (diameter <= 0 || density <= 0) return 0;
  const mu = Math.max(viscosity, 1e-9);
  return Math.max((density * Math.max(velocity, 0) * diameter) / mu, 0);
}

/** Swamee-Jain explicit equation as robust turbulent seed. */
export function calculateFrictionFactorSwameeJain(reynolds: number, roughness: number, diameter: number): number {
  const re = Math.max(reynolds, 4000);
  const relRoughness = clamp(Math.max(roughness, 0) / Math.max(diameter, 1e-9), 1e-12, 0.2);
  return 0.25 / Math.pow(Math.log10(relRoughness / 3.7 + 5.74 / Math.pow(re, 0.9)), 2);
}

export function calculateFrictionFactorHaaland(reynolds: number, roughness: number, diameter: number): number {
  if (reynolds <= 0) return 0;
  if (reynolds < 2300) return 64 / Math.max(reynolds, 1);

  const relRoughness = clamp(Math.max(roughness, 0) / Math.max(diameter, 1e-9), 1e-12, 0.2);
  const term1 = Math.pow(6.9 / reynolds, 1.11);
  const term2 = relRoughness / 3.7;
  const fInvSqrt = -1.8 * Math.log10(term1 + term2);
  return 1 / Math.pow(fInvSqrt, 2);
}

export function calculateFrictionFactorDetailed(
  reynolds: number,
  roughness: number,
  diameter: number,
  maxIterations = 30,
  tolerance = 1e-8,
): FrictionFactorResult {
  const warnings: string[] = [];
  if (reynolds <= 1) {
    warnings.push('Reynolds number near zero. Friction factor set to laminar asymptote.');
    return {
      frictionFactor: 64,
      reynoldsBand: 'laminar',
      convergence: { converged: true, iterations: 0, residual: 0 },
      warnings,
    };
  }

  const relRoughness = Math.max(roughness, 0) / Math.max(diameter, 1e-9);
  if (relRoughness > 0.2) warnings.push('Relative roughness above practical turbulent correlation range (ε/D > 0.2).');

  if (reynolds < 2300) {
    return {
      frictionFactor: 64 / reynolds,
      reynoldsBand: 'laminar',
      convergence: { converged: true, iterations: 0, residual: 0 },
      warnings,
    };
  }

  if (reynolds >= 2300 && reynolds <= 4000) {
    const fLam = 64 / 2300;
    const fTurb = calculateFrictionFactorSwameeJain(4000, roughness, diameter);
    const blend = (reynolds - 2300) / (4000 - 2300);
    return {
      frictionFactor: fLam + blend * (fTurb - fLam),
      reynoldsBand: 'transition',
      convergence: { converged: true, iterations: 0, residual: 0 },
      warnings: [...warnings, 'Transition flow interpolation used (2300 < Re < 4000).'],
    };
  }

  let f = calculateFrictionFactorSwameeJain(reynolds, roughness, diameter);
  let residual = Number.POSITIVE_INFINITY;

  for (let i = 1; i <= maxIterations; i++) {
    const term = clamp(relRoughness / 3.7 + 2.51 / (reynolds * Math.sqrt(Math.max(f, 1e-12))), 1e-12, 1e3);
    const fNew = 1 / Math.pow(-2 * Math.log10(term), 2);
    residual = Math.abs(fNew - f);
    f = fNew;
    if (residual <= tolerance) {
      return { frictionFactor: f, reynoldsBand: 'turbulent', convergence: { converged: true, iterations: i, residual }, warnings };
    }
  }

  warnings.push('Colebrook iteration hit cap; using last iterate.');
  return {
    frictionFactor: f,
    reynoldsBand: 'turbulent',
    convergence: { converged: false, iterations: maxIterations, residual, capped: true },
    warnings,
  };
}

export function calculateFrictionFactor(reynolds: number, roughness: number, diameter: number): number {
  return calculateFrictionFactorDetailed(reynolds, roughness, diameter).frictionFactor;
}

export function calculatePressureDrop(
  f: number,
  L: number,
  D: number,
  rho: number,
  v: number,
  sumK = 0,
  equivalentLength = 0,
): number {
  const effectiveLength = Math.max(L, 0) + Math.max(equivalentLength, 0);
  return (f * (effectiveLength / Math.max(D, 1e-9)) + Math.max(sumK, 0)) * (rho * v * v / 2);
}

export function calculateMachNumber(velocity: number, k: number, RSpecific: number, T: number): number {
  const a = Math.sqrt(Math.max(k * RSpecific * T, 1e-9));
  return velocity / a;
}

export function calculateCriticalPressureRatio(k: number): number {
  const kk = Math.max(k, 1.01);
  return Math.pow(2 / (kk + 1), kk / (kk - 1));
}

export function assessCompressibleFlow(P1: number, P2: number, k: number, mach: number): CompressibleFlowAssessment {
  const ratio = calculateCriticalPressureRatio(k);
  const criticalPressure = P1 * ratio;
  const isChoked = P2 <= criticalPressure || mach >= 1;
  return {
    criticalPressureRatio: ratio,
    criticalPressure,
    isChoked,
    chokedWarning: isChoked ? 'Potential sonic choking detected. Validate with adiabatic compressible model.' : undefined,
  };
}
