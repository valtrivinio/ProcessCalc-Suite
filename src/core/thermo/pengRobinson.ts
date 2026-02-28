/**
 * Alternative Peng-Robinson implementation (SI units, class-based).
 * Not used by the UI; FluidProperties and EOS use src/core/thermo/eos.ts.
 */
import { Component } from '../data/components';

export interface EOSResult {
  Z: number;
  density: number; // kg/m3
  phase: 'gas' | 'liquid' | 'supercritical';
}

const R = 8.314462618; // J/(mol·K)

export class PengRobinson {
  
  /**
   * Calculate Z-factor and Density for a single component
   * @param comp Component properties
   * @param T Temperature in Kelvin
   * @param P Pressure in bar (absolute)
   */
  static calculate(comp: Component, T: number, P: number): EOSResult {
    // Convert P to Pascals for R usage, but standard PR uses critical P in same units as P
    // Let's stick to SI: P in Pa, T in K, R = 8.314
    const P_Pa = P * 100000;
    const Pc_Pa = comp.Pc * 100000;
    const Tc = comp.Tc;
    const omega = comp.omega;

    const Tr = T / Tc;
    
    // Kappa
    const kappa = 0.37464 + 1.54226 * omega - 0.26992 * omega * omega;
    
    // Alpha
    const alpha = Math.pow(1 + kappa * (1 - Math.sqrt(Tr)), 2);

    // a and b parameters
    const a_c = 0.45724 * (R * R * Tc * Tc) / Pc_Pa;
    const b_c = 0.07780 * (R * Tc) / Pc_Pa;

    const a = a_c * alpha;
    const b = b_c;

    // Cubic Equation Coefficients: Z^3 + c2*Z^2 + c1*Z + c0 = 0
    // A = aP / (RT)^2
    // B = bP / RT
    const A = (a * P_Pa) / Math.pow(R * T, 2);
    const B = (b * P_Pa) / (R * T);

    const c2 = -(1 - B);
    const c1 = A - 3 * B * B - 2 * B;
    const c0 = -(A * B - B * B - B * B * B);

    const roots = this.solveCubic(1, c2, c1, c0);
    
    // Select root
    // For now, simple logic: Max root = Vapor Z, Min root = Liquid Z
    // If supercritical (Tr > 1), usually one real root
    let Z = 0;
    
    // Filter real roots > 0
    const validRoots = roots.filter(r => r > 0);
    
    if (validRoots.length === 0) {
      Z = 1; // Fallback to ideal
    } else if (validRoots.length === 1) {
      Z = validRoots[0];
    } else {
      // Multiple roots: check phase
      // If T > Tc, use max root (gas-like)
      // If T < Tc, we need to know if we want liquid or gas. 
      // For this simplified engine, we'll assume Gas phase if T > Tc or P is low, Liquid if T < Tc and P is high?
      // Better: Return both or let context decide. 
      // For generic "Gas Properties" module, prefer Gas root (Max)
      Z = Math.max(...validRoots);
    }

    // Density = PM / ZRT
    // P in Pa, M in kg/mol, R = 8.314, T in K -> kg/m3
    const M_kg = comp.mw / 1000;
    const rho = (P_Pa * M_kg) / (Z * R * T);

    let phase: EOSResult['phase'] = 'gas';
    if (T > Tc && P > comp.Pc) phase = 'supercritical';
    else if (Z < 0.1) phase = 'liquid'; // Crude check

    return { Z, density: rho, phase };
  }

  // Solve x^3 + ax^2 + bx + c = 0
  // Returns real roots
  private static solveCubic(a3: number, a2: number, a1: number, a0: number): number[] {
    // Normalize to x^3 + Ax^2 + Bx + C = 0
    const A = a2 / a3;
    const B = a1 / a3;
    const C = a0 / a3;

    const Q = (3 * B - A * A) / 9;
    const R_val = (9 * A * B - 27 * C - 2 * A * A * A) / 54;
    const D = Q * Q * Q + R_val * R_val; // Discriminant

    if (D > 0) {
      // One real root
      const S = Math.cbrt(R_val + Math.sqrt(D));
      const T = Math.cbrt(R_val - Math.sqrt(D));
      return [S + T - A / 3];
    } else if (D === 0) {
      // All real, at least two equal
      const S = Math.cbrt(R_val);
      return [
        2 * S - A / 3,
        -S - A / 3
      ];
    } else {
      // Three distinct real roots
      const theta = Math.acos(R_val / Math.sqrt(-Q * Q * Q));
      const sqrt_minus_Q = Math.sqrt(-Q);
      return [
        2 * sqrt_minus_Q * Math.cos(theta / 3) - A / 3,
        2 * sqrt_minus_Q * Math.cos((theta + 2 * Math.PI) / 3) - A / 3,
        2 * sqrt_minus_Q * Math.cos((theta + 4 * Math.PI) / 3) - A / 3
      ];
    }
  }
}
