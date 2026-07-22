
/**
 * Global Engineering Engine Utilities
 * Convergence Control & Input Validation
 */

export interface ConvergenceConfig {
  tolerance: number;
  maxIterations: number;
  name: string;
}

export class ConvergenceError extends Error {
  iterations: number;
  constructor(name: string, iterations: number) {
    super(`[NO CONVERGENCE] ${name} failed to converge after ${iterations} iterations.`);
    this.name = 'ConvergenceError';
    this.iterations = iterations;
  }
}

/**
 * Input Validation Engine
 */
export function validateInput(value: number, name: string, min?: number, max?: number): void {
  if (isNaN(value)) throw new Error(`[INVALID INPUT] ${name} is NaN.`);
  if (!isFinite(value)) throw new Error(`[INVALID INPUT] ${name} is infinite.`);
  if (min !== undefined && value < min) throw new Error(`[OUT OF RANGE] ${name} (${value}) is below minimum (${min}).`);
  if (max !== undefined && value > max) throw new Error(`[OUT OF RANGE] ${name} (${value}) is above maximum (${max}).`);
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

/**
 * Numerical Solvers
 */

export function solveNewtonRaphson(
  f: (x: number) => number,
  df: (x: number) => number,
  initialGuess: number,
  config: ConvergenceConfig
): number {
  let x = initialGuess;
  for (let i = 0; i < config.maxIterations; i++) {
    const fx = f(x);
    if (Math.abs(fx) < config.tolerance) return x;
    
    const dfx = df(x);
    if (Math.abs(dfx) < 1e-12) throw new Error(`[NUMERICAL ERROR] Derivative near zero in ${config.name} at x=${x}`);
    
    const x_new = x - fx / dfx;
    if (isNaN(x_new)) throw new Error(`[NUMERICAL ERROR] NaN detected in ${config.name}`);
    
    if (Math.abs(x_new - x) < config.tolerance) return x_new;
    x = x_new;
  }
  throw new ConvergenceError(config.name, config.maxIterations);
}

export function solveSecant(
  f: (x: number) => number,
  x0: number,
  x1: number,
  config: ConvergenceConfig
): number {
  let a = x0;
  let b = x1;
  
  for (let i = 0; i < config.maxIterations; i++) {
    const fa = f(a);
    const fb = f(b);
    
    if (Math.abs(fb) < config.tolerance) return b;
    if (Math.abs(fa - fb) < 1e-12) throw new Error(`[NUMERICAL ERROR] Flat slope in ${config.name}`);
    
    const x_new = b - fb * (b - a) / (fb - fa);
    if (isNaN(x_new)) throw new Error(`[NUMERICAL ERROR] NaN detected in ${config.name}`);
    
    if (Math.abs(x_new - b) < config.tolerance) return x_new;
    a = b;
    b = x_new;
  }
  throw new ConvergenceError(config.name, config.maxIterations);
}
