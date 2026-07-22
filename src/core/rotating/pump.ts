import { G } from '../constants';
export function npsha(P_s, P_v, rho, h_s, h_f) {
  const raw = (P_s - P_v) / (rho * G) + h_s - h_f;
  return raw - 0.6;
}
export const calculateNPSHa = npsha;
export function hydraulicPower(Q, H, rho) {
  return (rho * G * Q * H) / 1000;
}
export const calculateHydraulicPower = hydraulicPower;
