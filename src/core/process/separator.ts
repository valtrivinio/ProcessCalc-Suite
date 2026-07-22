function getKFactor(pressureBar, hasMistEliminator) {
  let K = 0.107;
  if (pressureBar > 0 && pressureBar <= 10) K = 0.107 - 0.007 * pressureBar;
  else if (pressureBar > 10 && pressureBar <= 20) K = 0.065 - 0.002 * (pressureBar - 10);
  else if (pressureBar > 20 && pressureBar <= 50) K = 0.045 - 0.0005 * (pressureBar - 20);
  else K = 0.030;
  return hasMistEliminator ? K * 1.67 : K * 0.5;
}
export function sizeSeparator(params) {
  const K = getKFactor(params.pressureBar, params.hasMistEliminator);
  const Vt = K * Math.sqrt((params.rhoL - params.rhoG) / params.rhoG);
  const Vdesign = 0.75 * Vt;
  let D = Math.sqrt((4 * params.gasFlow) / (Math.PI * Vdesign));
  let H = 0, iterations = 0;
  do {
    const volLiquid = params.liquidFlow * params.retentionTime * 60;
    const area = Math.PI * (D / 2) ** 2;
    H = (volLiquid / area) + 0.5;
    const slenderness = H / D;
    if (slenderness < 2.5) D *= 0.95;
    else if (slenderness > 6) D *= 1.05;
    iterations++;
    if (iterations > 50) break;
  } while ((H/D < 2.5 || H/D > 6) && iterations < 50);
  return { D, H, slenderness: H/D, Vdesign, K };
}
export const sizeVerticalSeparator = sizeSeparator;
