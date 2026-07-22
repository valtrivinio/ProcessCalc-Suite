// src/core/thermal/eos.ts
// Cubic equation of state helpers (Peng-Robinson)

export function solveCubic(a: number, b: number, c: number, d: number): number[] {
  // Solves a*x^3 + b*x^2 + c*x + d = 0
  // Returns array of real roots
  if (Math.abs(a) < 1e-12) {
    // Quadratic fallback
    const disc = c * c - 4 * b * d;
    if (disc < 0) return [];
    if (Math.abs(disc) < 1e-12) return [-c / (2 * b)];
    return [(-c + Math.sqrt(disc)) / (2 * b), (-c - Math.sqrt(disc)) / (2 * b)];
  }
  const f = (3 * a * c - b * b) / (3 * a * a);
  const g = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
  const h = (g * g) / 4 + (f * f * f) / 27;
  if (h > 0) {
    const r = -g / 2 + Math.sqrt(h);
    const s = Math.cbrt(r);
    const t = -g / 2 - Math.sqrt(h);
    const u = Math.cbrt(t);
    return [s + u - b / (3 * a)];
  } else if (Math.abs(h) < 1e-12) {
    const r = Math.cbrt(-g / 2);
    return [2 * r - b / (3 * a), -r - b / (3 * a)];
  } else {
    const theta = Math.acos(-g / (2 * Math.sqrt(Math.pow(-(f / 3), 3))));
    const r = 2 * Math.sqrt(-f / 3);
    const roots = [
      r * Math.cos(theta / 3) - b / (3 * a),
      r * Math.cos((theta + 2 * Math.PI) / 3) - b / (3 * a),
      r * Math.cos((theta + 4 * Math.PI) / 3) - b / (3 * a),
    ];
    return roots;
  }
}
