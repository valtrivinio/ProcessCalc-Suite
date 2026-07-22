// src/core/thermal/heatTransfer.ts
export function dittusBoelter(Re: number, Pr: number, cooling: boolean = false) {
  const n = cooling ? 0.3 : 0.4;
  return 0.023 * Math.pow(Re, 0.8) * Math.pow(Pr, n);
}

export function heatTransferCoefficient(Re: number, Pr: number, k_fluid: number, D: number, cooling?: boolean) {
  const Nu = dittusBoelter(Re, Pr, cooling);
  return (Nu * k_fluid) / D;
}

export function lmtd(T_h_in: number, T_h_out: number, T_c_in: number, T_c_out: number) {
  const dT1 = T_h_in - T_c_out;
  const dT2 = T_h_out - T_c_in;
  if (Math.abs(dT1 - dT2) < 0.001) return dT1;
  return (dT1 - dT2) / Math.log(dT1 / dT2);
}

export function heatDuty(U: number, A: number, LMTD: number, F: number = 1) {
  return U * A * LMTD * F;
}
