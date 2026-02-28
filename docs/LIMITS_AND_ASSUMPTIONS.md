# ProcessCalc-Suite — Limits and Assumptions

This document summarizes limits, assumptions, and scope for each calculation module. Use for design review and to avoid misuse.

---

## Thermodynamics (EOS)

- **Scope:** Single-component Peng-Robinson only. No multicomponent mixing rules or binary interaction parameters.
- **Inputs:** Component name, T (°C), P (bar). Component list: Methane, Ethane, Propane, Butane, Pentane, Hexane, Nitrogen, CO2, Water.
- **Limits:** No explicit T/P bounds; behavior near critical and at very high P is approximate. Enthalpy/entropy are placeholders (not implemented). Viscosity is placeholder.
- **Do not use for:** Multi-component gas mixtures, liquid density at high pressure without validation.

---

## Pipe Sizing

- **Incompressible:** Darcy-Weisbach + Colebrook-White. Laminar for Re < 2300. Friction factor iteration: 20 max, tolerance 1e-6.
- **Compressible:** Isothermal gas model when Mach > 0.3 and gas params (P1, T, MW, Z, k) provided. Choke handled approximately. No adiabatic option.
- **Roughness:** From MATERIAL_ROUGHNESS (pipeStandards) or user input (mm).
- **Limits:** No minor loss K-factors. Elevation head included. Pipe database: NPS 2–12, Schedule 40 only in active DB.
- **Do not use for:** Gas at Mach > 0.3 without entering gas params (incompressible result is invalid).

---

## Heat Exchanger

- **LMTD:** Valid only when ΔTl > 0 and ΔTr > 0 (no temperature cross). Invalid/cross returns `valid: false` and area = 0.
- **Ft:** 1-2 shell/tube only. Ft undefined when P→1 or R→1 or temperature cross; guarded to avoid division by zero.
- **Phase change:** Not implemented. Duty = m·Cp·ΔT only.
- **Do not use for:** Condensing/evaporating streams without manual LMTD or equivalent Cp.

---

## Separator

- **K-value:** Pressure bands and mist eliminator (hasMistEliminator) applied. Gas density is user input; not derived from EOS/Z.
- **Geometry:** Vertical only (horizontal reuses vertical logic as placeholder). Slenderness capped (L/D > 6 → D increased).
- **Do not use for:** Horizontal sizing without separate verification. Sour service or special K without validation.

---

## Pump

- **NPSHa:** Full formula with static head and friction. Design **invalid** when NPSHa < 0 or NPSHa < NPSHr (if NPSHr entered).
- **Viscosity:** Correction applied when viscosity > 10 cP (head and efficiency factors). Approximate HI-style.
- **Vapor pressure:** User input or Antoine for water via “Pv from water temp” (°C).
- **Limits:** No pump curve or system curve. Brake power from hydraulic power and efficiency only.

---

## Compressor

- **Polytropic:** Head and T2 from polytropic exponent; Z_avg = Z1 (Z2 not iterated). Inlet volumetric flow uses ideal gas (no Z).
- **Limits:** Single stage only. No surge margin or operating range. Max discharge temp warning at 150 °C.

---

## Control Valve (ISA 75.01)

- **Liquid:** Choked ΔP = FL²(P1−Pv). No Reynolds correction (FR) for viscous liquids.
- **Gas:** Expansion factor Y and choked limit xT·Fk. Z in density. No beta ratio validation.

---

## Relief Valve (API 520)

- **Critical:** Area = W√(TZ) / (C·Kd·P1·Kb·Kc·√M). C from k.
- **Subcritical:** F2 applied in denominator (larger area). Kb from backpressure for conventional valves (approximation).
- **Limits:** Gas/vapor only. Orifice table API 526 standard. Rupture disk Kc = 0.9 when selected.

---

## Steam / Utilities

- **Steam:** Saturation T(P) and h_fg from correlations; not full IAPWS-IF97. Vapor density from ideal gas. No quality (x) in output.
- **Cooling water:** Cp = 4.18 kJ/(kg·K) constant.

---

## Numerical

- **Iteration:** Colebrook 20 iterations, tolerance 1e-6; no “did not converge” flag. LMTD and Ft guarded for NaN/Inf where implemented.
- **Units:** Core uses SI/bar/°C; relief uses psia, lb/h, °R for API 520.

---

*Last updated with post-audit fixes: relief F2, pipe compressible, LMTD/Ft validation, pump NPSH fail and viscosity/Pv, unit tests, MATERIAL_ROUGHNESS integration.*
