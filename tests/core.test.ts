/**
 * Core calculation unit tests — safety-critical equation verification
 */
import { describe, it, expect } from 'vitest';
import {
  calculateLMTD,
  calculateFt,
} from '../src/core/thermal/heatTransfer';
import {
  calculateReynolds,
  calculateFrictionFactor,
  calculatePressureDrop,
  sonicVelocityGas,
  calculatePressureDropCompressibleIsothermal,
} from '../src/core/fluid/pipeSizing';
import {
  calculateReliefArea,
} from '../src/core/safety/api520';
import {
  calculateNPSHa,
  npshaDesignValid,
  viscosityCorrectionFactors,
  vaporPressureWaterBar,
} from '../src/core/rotating/pump';

describe('Heat transfer', () => {
  it('LMTD valid when dTl and dTr positive', () => {
    const r = calculateLMTD(100, 60, 25, 45, 'counter');
    expect(r.valid).toBe(true);
    expect(r.temperatureCross).toBe(false);
    expect(r.value).toBeGreaterThan(0);
    expect(r.value).toBeCloseTo(44.25, 1);
  });

  it('LMTD invalid on temperature cross', () => {
    const r = calculateLMTD(100, 40, 50, 60, 'counter');
    expect(r.valid).toBe(false);
    expect(r.temperatureCross).toBe(true);
  });

  it('Ft returns number for valid 1-2 range', () => {
    const ft = calculateFt(150, 80, 25, 45);
    expect(Number.isFinite(ft)).toBe(true);
    expect(ft).toBeGreaterThan(0);
    expect(ft).toBeLessThanOrEqual(1);
  });
});

describe('Pipe sizing', () => {
  it('Reynolds and friction factor laminar', () => {
    const Re = calculateReynolds(1000, 0.5, 0.1, 0.001);
    expect(Re).toBe(50000);
    const f = calculateFrictionFactor(2000, 0.0001, 0.1); // Re < 2300 → laminar
    expect(f).toBeCloseTo(64 / 2000, 4);
  });

  it('Darcy-Weisbach pressure drop', () => {
    const dP = calculatePressureDrop(0.02, 100, 0.1, 1000, 2);
    expect(dP).toBeGreaterThan(0);
    expect(dP).toBeCloseTo(0.02 * (100 / 0.1) * (1000 * 4 / 2), 0);
  });

  it('Sonic velocity gas', () => {
    const c = sonicVelocityGas(1.4, 300, 29, 1);
    expect(c).toBeGreaterThan(300);
    expect(c).toBeLessThan(400);
  });

  it('Compressible isothermal dP', () => {
    const P1 = 5e5;
    const res = calculatePressureDropCompressibleIsothermal(
      P1, 300, 29, 1, 1, 0.02, 100, 0.1, Math.PI * 0.05 * 0.05
    );
    expect(res.dP_Pa).toBeGreaterThan(0);
    expect(res.P2_Pa).toBeLessThan(P1);
    expect(res.isChoked).toBe(false);
  });
});

describe('Relief valve API 520', () => {
  it('Critical flow area', () => {
    const r = calculateReliefArea(10000, 100, 14.7, 500, 1, 44, 1.3, 0.975, 1, 1);
    expect(r.area).toBeGreaterThan(0);
    expect(r.isSubcritical).toBe(false);
    expect(r.designation).toBeDefined();
  });

  it('Subcritical uses F2 (larger area)', () => {
    const critical = calculateReliefArea(10000, 100, 50, 500, 1, 44, 1.3, 0.975, 1, 1);
    const subcritical = calculateReliefArea(10000, 100, 80, 500, 1, 44, 1.3, 0.975, 1, 1);
    expect(subcritical.isSubcritical).toBe(true);
    expect(subcritical.area).toBeGreaterThan(critical.area);
  });
});

describe('Pump', () => {
  it('NPSHa formula', () => {
    const n = calculateNPSHa(101325, 3000, 1000, 1, 0.5);
    expect(n).toBeCloseTo((101325 - 3000) / (1000 * 9.81) + 1 - 0.5, 1);
  });

  it('NPSHa fail when negative', () => {
    const v = npshaDesignValid(-0.5);
    expect(v.valid).toBe(false);
    expect(v.failReason).toContain('negative');
  });

  it('NPSHa fail when less than NPSHr', () => {
    const v = npshaDesignValid(2, 3);
    expect(v.valid).toBe(false);
  });

  it('Viscosity correction above 10 cP', () => {
    const { headFactor, efficiencyFactor } = viscosityCorrectionFactors(100);
    expect(headFactor).toBeLessThan(1);
    expect(efficiencyFactor).toBeLessThan(1);
  });

  it('Vapor pressure water at 100 °C ~ 1 bar', () => {
    const pv = vaporPressureWaterBar(100);
    expect(pv).toBeGreaterThan(0.9);
    expect(pv).toBeLessThan(1.1);
  });
});
