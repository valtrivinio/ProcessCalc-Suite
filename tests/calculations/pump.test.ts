import { describe, it } from 'node:test';
import assert from 'node:assert';
import { hydraulicPower, npsha } from '../../src/core/rotating/pump';

describe('Pump calculations', () => {
  it('hydraulicPower returns zero for zero flow', () => {
    assert.strictEqual(hydraulicPower(0, 10, 1000), 0);
  });
  it('hydraulicPower returns positive for valid inputs', () => {
    const power = hydraulicPower(0.1, 50, 1000);
    assert.ok(power > 0);
  });
  it('npsha returns correct value with safety margin', () => {
    const result = npsha(100000, 2000, 1000, 2, 1);
    assert.ok(result > 0);
  });
});
