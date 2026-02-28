# STRICT VERIFICATION AUDIT REPORT
## ProcessCalc-Suite — Engineering Calculation Software

**Auditor role:** Principal Process Engineer, Thermodynamics Specialist, API Compliance Reviewer, Engineering Software QA Auditor  
**Assumption:** Software may be used in real plant design; incorrect results could cause fatalities.  
**Classification of findings:** ✅ Fully Implemented | ⚠️ Partially Implemented | ❌ Not Implemented | 🚨 Dangerous Misimplementation

---

## GLOBAL VERIFICATION SUMMARY

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Equations correctly implemented | ⚠️ Partially | Per-module details below; some formulas correct, others simplified or wrong. |
| Algorithm branching (not hardcoded) | ⚠️ Partially | Some branches (e.g. laminar/turbulent, critical/subcritical) exist; compressible pipe flow and subcritical relief not properly branched. |
| Correction factors actively applied | ⚠️ Partially | Ft, fouling, K, Kd/Kb/Kc present; F2 (relief) computed but **not used**; Kb always 1 in relief. |
| Real-gas Z used where required | ⚠️ Partially | EOS produces Z; compressor/relief/valve accept Z as input; **separator and pipe sizing do not use Z** (user enters density). No multicomponent EOS. |
| Safety logic (warnings/fail states) | ⚠️ Partially | Warnings for Mach >0.3, Ft <0.75, NPSHa <3, high T discharge, subcritical relief; **no hard FAIL or lock-out**; NPSHa can be negative with no fail. |
| Dimensional consistency | ✅ Largely | SI/bar/°C used consistently in core; relief uses psia/lb/h; unit conversion layer exists. |
| Database lookups (pipe, API, steam) | ⚠️ Partially | Pipe table in use (pipeSizing); **pipeStandards.ts and MATERIAL_ROUGHNESS unused**. API orifices used. Steam is **correlations, not full tables**. |
| Iteration solver convergence | ⚠️ Partially | Colebrook: 20 iter, tol 1e-6; **no convergence flag**; no max-iter failure path. Cubic EOS: closed form, no iteration. |
| Edge-case handling | ❌ Weak | No guards for LMTD when dTl/dTr ≤ 0 or log(dTl/dTr) invalid; no zero-P/zero-T handling in EOS output; Ft division by zero when P→1. |
| Dummy/unused variables | ⚠️ Present | F2 in api520 computed and never used; **pengRobinson.ts and flowEquations.ts not imported** (dead code). |

---

## 🔴 THERMODYNAMIC ENGINE VERIFICATION

| Item | Status | Notes |
|------|--------|------|
| Peng-Robinson EOS implemented | ✅ | In `eos.ts`: α(Tr, ω), a/b, cubic Z³+c2 Z²+c1 Z+c0. |
| Cubic equation solver present | ✅ | Cardano in `eos.ts`; second implementation in `pengRobinson.ts` (unused). |
| Root selection (vapor vs liquid) | ⚠️ Partially | Single root: Tr>1 → Supercritical; else P vs Pc. Three roots: Wilson Psat vs P for liquid/vapor. **No Gibbs/fugacity**; possible wrong phase near critical. |
| Mixing rules for multicomponent | ❌ Not Implemented | Only **single-component** EOS. No van der Waals or other mixing; no multi-component gas support. |
| Binary interaction parameters | ❌ Not Implemented | N/A single-component. |
| Z used in Compressor | ✅ | Z1 input; Z_avg = Z1 (Z2 not computed). |
| Z used in Separator | ❌ | **User enters gas density**; no EOS/Z integration. |
| Z used in Gas Pipe Flow | ❌ | Pipe sizing uses user density; **no Z, no compressible branch**. |
| Z used in Relief Valve | ✅ | Z in area formula. |
| Z used in Control Valve (gas) | ✅ | ρ1 = P1*MW/(Z*R*T). |
| Density from Z (not ideal) | ✅ | ρ = PM/(ZRT) in eos.ts. |
| **Stress: 100 bar methane** | ⚠️ | EOS runs; root selection may be coarse near critical. |
| **Stress: Near critical** | ⚠️ | Tr≈1, Pr≈1: single root, phase "Supercritical" or heuristic; **no critical-region handling**. |
| **Stress: Low T / multi-component** | ❌ | Multi-component not supported. Low T: same EOS, no special handling. |
| **Silent fallback to ideal gas** | ⚠️ | pengRobinson.ts uses Z=1 if no valid roots; **eos.ts** does not—returns roots or phase from logic. No explicit "EOS failed, using ideal" path in UI. |

**Verdict:** ✅ Equations and solver present for **single-component** PR. ❌ No multicomponent, no integration of Z into separator/pipe. ⚠️ Root selection and critical region are simplified.

---

## 1️⃣ PIPE SIZING VERIFICATION

| Item | Status | Notes |
|------|--------|------|
| Pipe schedule DB (NPS + Schedule) | ✅ | `PIPE_DATABASE` in pipeSizing.ts; ID from DB. |
| ID retrieved from database | ✅ | Used in PipeSizing.tsx. |
| Roughness by material | ⚠️ Partially | User enters roughness (default 0.0457 mm); **MATERIAL_ROUGHNESS in pipeStandards.ts not used**. |
| Elevation head included | ✅ | dP_elevation = ρ*g*elevation; total ΔP = friction + elevation. |
| Minor loss K-factor | ❌ Not Implemented | **No minor loss term** in core or UI. |
| Mach number calculation | ⚠️ Cosmetic | **Hardcoded c**: ρ>500 → 1480 m/s, else 340 m/s. Not from real gas or fluid. |
| Sonic velocity check | ⚠️ | Warning when Mach > 0.3; **no sonic limit or choke**. |
| Compressible flow branch | ❌ Not Implemented | **Darcy-Weisbach only**; no isothermal/adiabatic gas ΔP when Mach > 0.3. |
| Colebrook iterative solver | ✅ | Fixed-point iteration, 20 iter, 1e-6; **flowEquations.ts** (Newton-Raphson) exists but **unused**. |
| Swamee-Jain fallback only? | ✅ No | Colebrook used; no SJ-only path. |
| **Low Re laminar** | ✅ | Re < 2300 → f = 64/Re. |
| **High Re turbulent** | ✅ | Colebrook. |
| **Gas Mach > 0.3** | 🚨 | **Darcy-Weisbach used without compressible correction** → underestimates ΔP; **FAIL**. |
| **Elevation > 50 m** | ✅ | Elevation term applied. |
| **Minor loss heavy system** | ❌ | Not implemented. |

**Verdict:** ✅ DB, elevation, Colebrook. ❌ No minor loss, no compressible branch. 🚨 Use for gas at Mach > 0.3 without correction is **dangerous**.

---

## 2️⃣ HEAT EXCHANGER VERIFICATION

| Item | Status | Notes |
|------|--------|------|
| Automatic LMTD calculation | ✅ | From Th_in, Th_out, Tc_in, Tc_out; counter-current. |
| Ft correction applied | ✅ | 1-2 shell/tube Ft from R, P; used in area. |
| Fouling factor included | ✅ | Rf_hot + Rf_cold; U_dirty = 1/(1/U_clean + Rf). |
| Phase change handled | ❌ Not Implemented | **No condensing/evaporating**; duty = m*Cp*ΔT only. |
| Temperature cross detection | ⚠️ Partially | **No ΔTlm sign check**; if dTl or dTr ≤ 0, **log(dTl/dTr) invalid** → NaN/Inf. Ft < 0.75 triggers warning. |
| ΔTlm sign validation | ❌ Not Implemented | **No guard** for dTl≤0, dTr≤0, or dTl/dTr≤0. |
| **Near temperature cross** | ⚠️ | Ft warning; LMTD can go NaN if cross. |
| **Ft < 0.75** | ✅ | Warning shown. |
| **Condensing steam** | ❌ | No LMTD or duty for phase change; user must use equivalent Cp or manual LMTD. |
| User must manually enter LMTD? | ✅ No | LMTD is calculated. |

**Verdict:** ✅ LMTD, Ft, fouling. ❌ No phase change, no LMTD/ΔT sign validation → **possible NaN and invalid area**.

---

## 3️⃣ SEPARATOR VERIFICATION

| Item | Status | Notes |
|------|--------|------|
| Variable K-value vs pressure | ✅ | K bands: 0.107 → 0.09/0.08/0.07/0.06 for P > 10/30/60/100 bar. |
| Z-based gas density | ❌ Not Implemented | **User enters gas density**; no EOS/Z link. |
| Nozzle momentum | ❌ Not Implemented | Not in sizing. |
| Retention time logic | ✅ | Vol_liq = Q_liq * t_retention; height from volume. |
| Slenderness check (L/D) | ✅ | If ratio > 6, D increased and recalc. |
| Mist eliminator impacts K | ✅ | hasMistEliminator false → K *= 0.5; **UI always passes true** (not selectable). |
| K fixed constant? | ✅ No | K varies with P and mist eliminator. |

**Verdict:** ✅ K(P), retention, slenderness, mist eliminator in core. ❌ Gas density not from Z; mist eliminator not exposed in UI.

---

## 4️⃣ PUMP VERIFICATION

| Item | Status | Notes |
|------|--------|------|
| Viscosity correction | ❌ Not Implemented | **No viscosity correction** for head or efficiency (e.g. Hydraulic Institute). |
| Full NPSHa calculated | ✅ | (Ps-Pv)/(ρg) + Hs - Hf. |
| Vapor pressure from Antoine | ❌ Not Implemented | **User enters Pv**; no Antoine or steam table. |
| NPSH margin check triggers FAIL | ❌ Not Implemented | **Warning only** when NPSHa < 3 m; **no FAIL state**; negative NPSHa still returns value. |
| **High viscosity (200 cP)** | ❌ | No correction; head/power may be wrong. |
| **Low suction, high T near Pv** | ⚠️ | NPSHa can go negative; only advisory. |

**Verdict:** ✅ NPSHa formula. ❌ No viscosity correction, no Antoine, no hard NPSH fail.

---

## 5️⃣ COMPRESSOR VERIFICATION

| Item | Status | Notes |
|------|--------|------|
| Z at suction & discharge | ⚠️ Partially | **Z1 only**; Z_avg = Z1; Z2 not computed from EOS. |
| Polytropic efficiency affects head & temp | ✅ | m = (k-1)/(k*ηp); T2 = T1*(P2/P1)^m; head uses m. |
| Discharge temperature formula | ✅ | Polytropic T2 = T1*pr^m (not isentropic). |
| Multi-stage logic | ❌ Not Implemented | Single stage only. |
| Surge margin warning | ❌ Not Implemented | No surge margin or operating range. |
| Max discharge temp check | ✅ | Warning when T2 > 150 °C. |
| Discharge temp = isentropic? | ✅ No | Polytropic used. |
| **Inlet volumetric flow** | ⚠️ | **Ideal gas**: V = (massFlow/MW)*8.314*T1/P1; **Z not used** → wrong for real gas. |

**Verdict:** ✅ Polytropic head/temp, efficiency, high-T warning. ⚠️ Z2 not used; inlet volume ideal gas. ❌ No multi-stage, no surge.

---

## 6️⃣ ORIFICE & CONTROL VALVE

| Item | Status | Notes |
|------|--------|------|
| ISA 75.01 gas equations | ✅ | Gas sizing with x, Fk, xT, choked limit. |
| Expansion factor Y | ✅ | Y = 1 - x/(3*Fk*xT); 2/3 when choked. |
| Reynolds correction FR | ❌ Not Implemented | **No FR** for liquid (viscous) in controlValve. |
| Choked flow detection | ✅ | Liquid: dP_choked = FL²(P1-Pv). Gas: x_choked = xT*Fk. |
| Beta ratio validation | ❌ Not Implemented | No β or d/D check. |
| **Gas near critical pressure ratio** | ✅ | Choked limit and Y applied. |
| **High ΔP cavitation** | ⚠️ | FL²(P1-Pv) used; no Ff or Pc. |
| **Viscous liquid** | ❌ | No FR; Cv may be wrong for high viscosity. |

**Verdict:** ✅ ISA-style gas/liquid, Y, choke. ❌ No FR, no beta validation.

---

## 7️⃣ RELIEF VALVE (API 520)

| Item | Status | Notes |
|------|--------|------|
| Critical vs subcritical logic | ✅ | Pcf = P1*(2/(k+1))^(k/(k-1)); isSubcritical = P2 > Pcf. |
| Backpressure correction Kb | ⚠️ Partially | **Kb passed but always 1.0** in UI; no chart or formula. |
| Rupture disk factor Kc | ✅ | Kc = 0.9 if rupture disk. |
| Discharge coefficient Kd | ✅ | 0.975. |
| Standard API orifice table | ✅ | API_ORIFICES letter → area in². |
| Overdesign % reported | ✅ | Rated flow vs required; orifice utilization %. |
| **Subcritical area formula** | 🚨 | **F2 computed but NOT used in area**; area = W√(TZ)/(C*Kd*P1*Kb*Kc*√M) for both regimes → **subcritical area UNDER-estimated** → **relief valve undersized** → **FAIL**. |
| **Built-up backpressure 30%** | ⚠️ | Kb=1; no correction. |
| **Subcritical case** | 🚨 | Same formula as critical; dangerous. |
| **High MW gas** | ✅ | M in formula. |

**Verdict:** ✅ Critical ratio, Kd/Kc, orifice table. 🚨 **Subcritical: F2 not applied in area** → **Dangerous misimplementation**. ⚠️ Kb not implemented.

---

## 8️⃣ STEAM & UTILITIES

| Item | Status | Notes |
|------|--------|------|
| Steam table lookup | ❌ Not Implemented | **Correlations only**: Tsat(P) piecewise ln(P) fit; h_fg Watson-style. |
| Pressure-based enthalpy | ⚠️ Partially | h_liq ≈ 4.18*T; h_fg from correlation; **not IAPWS-IF97**. |
| Quality handling | ❌ Not Implemented | No x (vapor fraction) in getSteamProperties. |
| Boiler efficiency correction | ❌ Not Implemented | Not in Utilities. |
| Cp = constant assumed? | ⚠️ | CW duty uses Cp = 4.18; steam h_liq = 4.18*T. **Not full tables.** |

**Verdict:** ❌ No real steam tables; approximate Tsat and h_fg only. Not fixed to full IAPWS.

---

## 🧠 NUMERICAL STABILITY CHECK

| Item | Status | Notes |
|------|--------|------|
| Iteration tolerance configurable | ❌ | Hardcoded 1e-6 (pipe), 1e-6 (flowEquations unused). |
| Max iteration cap | ✅ | 20 (pipe), 10 (flowEquations); **no convergence failure handling**. |
| Convergence detection | ⚠️ | Return last f after 20 iter; **no "did not converge" flag**. |
| Failure fallback strategy | ❌ | No global fallback; EOS returns roots or heuristic. |
| Very small/large number handling | ❌ | No checks for 0/Inf/NaN in LMTD, Ft, or area. |
| Unit consistency validation | ⚠️ | Unit conversion exists; core assumes fixed units (bar, m, kg/m³). |
| **Extreme low flow** | ⚠️ | Re → 0: f = 64/Re → large; no clamp. |
| **Extreme high pressure** | ⚠️ | EOS may be coarse; relief/compressor depend on inputs. |
| **Very small diameter** | ⚠️ | Re can be very high; no diameter limit. |
| **Near-zero ΔT** | 🚨 | LMTD: dTl≈dTr → 0/0 or log≈0 → **NaN/Inf**; no guard. |

**Verdict:** ⚠️ Iteration caps present; ❌ no configurable tolerance, no convergence/fail path, no guards for LMTD/ΔT.

---

## 📊 PER-MODULE SUMMARY (RATINGS)

| Module | Implementation Status | Engineering Accuracy (0–100%) | Safety Robustness | Numerical Stability | Commercial Design Readiness | Hidden Failure Risks | Liability Exposure |
|--------|------------------------|-------------------------------|-------------------|--------------------|-----------------------------|----------------------|--------------------|
| **Thermodynamics (EOS)** | ⚠️ Partial | 65 | Medium | Good | FEED | Wrong phase near critical; single-component only | Medium |
| **Pipe Sizing** | ⚠️ Partial | 60 | Low | Good | FEED | Gas at Mach >0.3 wrong; no minor loss | **High** |
| **Heat Exchanger** | ⚠️ Partial | 70 | Medium | Low | FEED | LMTD NaN on temp cross; no phase change | Medium |
| **Separator** | ⚠️ Partial | 70 | Medium | Good | FEED | Gas density not from Z | Medium |
| **Pump** | ⚠️ Partial | 65 | Low | Good | FEED | No visc correction; no NPSH fail | Medium |
| **Compressor** | ⚠️ Partial | 72 | Medium | Good | FEED | Z2 not used; ideal V_inlet | Medium |
| **Control Valve** | ⚠️ Partial | 75 | Medium | Good | EPC Support | No FR (viscous) | Low–Medium |
| **Relief Valve** | 🚨 Partial | 50 | **Low** | Good | **Not ready** | **Subcritical F2 not used** | **Very High** |
| **Steam/Utilities** | ❌ Partial | 50 | Medium | Good | Student | Approximate only | Medium |

---

## 📊 FINAL OUTPUT

### Overall Engineering Weapon Score: **58 / 100**

**Reasons:**  
- Relief valve subcritical error is **safety-critical** and rates as dangerous.  
- Pipe sizing for compressible gas without correction is **dangerous**.  
- No automated tests; duplicate/dead code (pengRobinson, flowEquations, pipeStandards); incomplete API 520 and steam.  
- Strong points: EOS and cubic solver, Colebrook, LMTD/Ft/fouling, polytropic compressor, ISA valve sizing, separator K(P).

### Classification: **FEED Tool with High-Risk Modules**

- **Not** a Professional Engineering Platform: relief and pipe gas sizing have dangerous gaps; no formal QA/test; no subcritical relief fix.  
- **Not** purely Student Calculator: equations and structure are largely professional-level.  
- **EPC Support Tool** only if relief and gas pipe are **not** used for final sizing, or after **targeted fixes and verification**.  
- **High-Risk Software** in current form if used for **relief valve sizing in subcritical service** or **gas pipeline ΔP at Mach > 0.3** without independent verification.

### Recommended Immediate Actions (before any commercial or safety-critical use)

1. **Relief (API 520):** Implement subcritical area using F2 (or API chart) and **use it** in the area formula; add Kb from backpressure.  
2. **Pipe:** Add compressible flow branch when Mach > 0.3 (or block/warn and require external calc).  
3. **Heat exchanger:** Validate LMTD (dTl, dTr > 0; handle temperature cross with clear error or Ft=0).  
4. **Pump:** Add NPSHa < 0 or NPSHa < NPSHr as **FAIL** (no design acceptance); consider viscosity correction and Antoine for Pv.  
5. **General:** Add unit tests for core equations; remove or integrate dead code (pengRobinson, flowEquations, pipeStandards); document limits and assumptions per module.

---

## 🔥 HARD MODE: Intentional Breakage and Failure Behavior

Deliberate extreme/illogical inputs and observed (or expected) behavior:

| Input / Scenario | Expected Behavior | Risk |
|------------------|-------------------|------|
| **LMTD: Th_out > Tc_in and Tc_out > Th_in** (temperature cross) | dTl or dTr negative → log(negative) or log(0) → **NaN**; area = Q/(U*LMTD*Ft) → **NaN** or **Inf**; UI may show "0" or broken values. | **No guard**; design appears to run but is invalid. |
| **LMTD: dTl = dTr** (parallel or equal approach) | Code returns dTl (correct limit); no division by zero. | OK. |
| **Ft: P = 1** (Tc_out = Th_in) | Denominator (R-1)*ln(...) can be 0 → **Ft = Inf/NaN**. | **No guard**. |
| **Relief: Subcritical (P2 > Pcf)** | F2 computed but **not used**; area too small → **undersized valve**; relief may not pass required flow. | **Dangerous**. |
| **EOS: P = 0** | B = 0; cubic still has roots; density = P*M/(ZRT) = **0**. No crash. | Acceptable. |
| **EOS: T = 0 K or negative** | Tr invalid; sqrt(Tr) or similar can produce NaN/Inf. | **No guard**. |
| **Pipe: Re = 0** | Laminar branch: f = 64/0 → **Inf**; ΔP → Inf. | **No guard**. |
| **Pipe: Gas, Mach 0.5** | Darcy-Weisbach used; **wrong ΔP**; warning shown but calculation still wrong. | **User may ignore warning**. |
| **Pump: NPSHa = -1 m** | Value displayed; warning only if < 3 m. **No FAIL**; user can "accept" design. | **Cavitation risk**. |
| **Compressor: P2 < P1** | UI validation: "Discharge Pressure must be > Suction Pressure". | OK. |
| **Control valve: P2 ≥ P1** | UI validation. | OK. |
| **Separator: rhoL < rhoG** | sqrt((rhoL-rhoG)/rhoG) **negative** → **NaN** for v_t. | **No guard**. |

**Summary:** The software does **not** consistently reject or fail on invalid inputs. Several paths produce **NaN/Inf** or **wrong but plausible** results (especially relief subcritical and gas pipe). Warnings exist but are not enforced; no global "design invalid" state.

---

*End of Verification Audit Report.*
