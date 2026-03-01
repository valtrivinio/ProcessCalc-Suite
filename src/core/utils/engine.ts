/**
 * Global Engineering Engine Utilities
 * Convergence Control, Input Validation, and deterministic numerical guards.
 */

export type EngineeringStatus = 'VALID' | 'WARNING' | 'INVALID' | 'SAFETY RISK';

export interface ConvergenceConfig {
  tolerance: number;
  maxIterations: number;
  name: string;
}

export interface IterationReport {
  converged: boolean;
  iterations: number;
  residual: number;
  capped: boolean;
}

export class ConvergenceError extends Error {
  iterations: number;
  residual: number;
  constructor(name: string, iterations: number, residual: number) {
    super(`[NO CONVERGENCE] ${name} failed after ${iterations} iterations (residual=${residual}).`);
    this.name = 'ConvergenceError';
    this.iterations = iterations;
    this.residual = residual;
  }
}

export class NumericalError extends Error {
  classification: EngineeringStatus;
  constructor(message: string, classification: EngineeringStatus = 'INVALID') {
    super(message);
    this.name = 'NumericalError';
    this.classification = classification;
  }
}

export function enforceFinite(value: number, name: string, classification: EngineeringStatus = 'INVALID'): void {
  if (Number.isNaN(value)) throw new NumericalError(`[NaN TRAP] ${name} evaluated to NaN.`, classification);
  if (!Number.isFinite(value)) throw new NumericalError(`[NUMERICAL OVERFLOW] ${name} is not finite.`, classification);
}

/**
 * Input Validation Engine
 */
export function validateInput(value: number, name: string, min?: number, max?: number): void {
  enforceFinite(value, name);
  if (min !== undefined && value < min) throw new NumericalError(`[OUT OF RANGE] ${name} (${value}) < ${min}.`);
  if (max !== undefined && value > max) throw new NumericalError(`[OUT OF RANGE] ${name} (${value}) > ${max}.`);
}

export interface ValidationResult {
  status: 'PASS' | 'WARNING' | 'FAIL';
  message?: string;
}

export function checkRange(value: number, min: number, max: number, name: string): ValidationResult {
  if (value < min || value > max) {
    return { status: 'FAIL', message: `${name} (${value.toFixed(3)}) outside physical range [${min}, ${max}]` };
  }
  return { status: 'PASS' };
}

export function statusRank(status: EngineeringStatus): number {
  return { VALID: 0, WARNING: 1, INVALID: 2, 'SAFETY RISK': 3 }[status];
}

export function mergeStatus(...statuses: EngineeringStatus[]): EngineeringStatus {
  return statuses.reduce((worst, current) => (statusRank(current) > statusRank(worst) ? current : worst), 'VALID');
}

/**
 * Numerical Stability Helpers
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function safeLog(val: number): number {
  return Math.log(Math.max(val, 1e-15));
}

export function safeSqrt(val: number): number {
  return Math.sqrt(Math.max(val, 0));
}

export function roundEngineering(value: number, significantDigits = 4): number {
  if (!Number.isFinite(value) || value === 0) return value;
  const exp = Math.floor(Math.log10(Math.abs(value)));
  const scale = 10 ** (significantDigits - exp - 1);
  return Math.round(value * scale) / scale;
}

/**
 * Benchmark Case Interface for V&V
 */
export interface BenchmarkCase {
  id: string;
  module: string;
  description: string;
  inputs: Record<string, any>;
  expectedResults: Record<string, number>;
  tolerance: number; // %
  source: string; // e.g., "GPSA Fig 17-2"
}
