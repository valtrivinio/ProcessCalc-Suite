// src/core/fluid/controlValve.ts
export function sizeControlValveLiquid(
  Q: number, P1: number, P2: number,
  fluid: { SG: number; Pv: number; Pc: number }
) {
  const dP = P1 - P2;
  const Ff = 0.96 - 0.28 * Math.sqrt(fluid.Pv / fluid.Pc);
  const dPchoked = (0.9 ** 2) * (P1 - Ff * fluid.Pv);
  const effectiveDP = Math.min(dP, dPchoked);
  const Kv = Q * Math.sqrt(fluid.SG / effectiveDP);
  return { Kv, Cv: Kv * 1.156, choked: dP > dPchoked, dPchoked };
}

export function sizeControlValveGas(
  W: number, P1: number, P2: number,
  fluid: { MW: number; T: number; Z: number; k: number }
) {
  const x = (P1 - P2) / P1;
  const Fk = fluid.k / 1.4;
  const xT = 0.72;
  const Y = x < Fk * xT ? 1 - x / (3 * Fk * xT) : 2/3;
  const N8 = 94.8;
  const Kv = W / (N8 * P1 * Y * Math.sqrt(Math.min(x, Fk*xT) * fluid.MW / (fluid.T * fluid.Z)));
  return { Kv, Cv: Kv * 1.156, Y };
}
