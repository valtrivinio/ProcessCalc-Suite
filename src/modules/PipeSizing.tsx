import React, { useState, useEffect } from 'react';
import { SectionHeader, Input, ResultCard, Select } from '../components/UI';
import { validateNumber, hasErrors } from '../utils/validation';
import {
  PIPE_DATABASE,
  calculateReynolds,
  calculateFrictionFactor,
  calculatePressureDrop,
  sonicVelocityGas,
  calculatePressureDropCompressibleIsothermal,
} from '../core/fluid/pipeSizing';
import { MATERIAL_ROUGHNESS } from '../core/data/pipeStandards';

export default function PipeSizing() {
  // Inputs
  const [flow, setFlow] = useState('100'); // m3/h
  const [density, setDensity] = useState('1000'); // kg/m3
  const [viscosity, setViscosity] = useState('1.0'); // cP
  const [length, setLength] = useState('100'); // m
  const [elevation, setElevation] = useState('0'); // m
  const [roughness, setRoughness] = useState('0.0457'); // mm (Carbon Steel)

  // Gas compressible (optional): when density < 500 and Mach > 0.3
  const [inletPressureBar, setInletPressureBar] = useState('5');
  const [temperatureC, setTemperatureC] = useState('40');
  const [mw, setMw] = useState('18');
  const [zFactor, setZFactor] = useState('1.0');
  const [kRatio, setKRatio] = useState('1.4');

  // Pipe Selection
  const [nps, setNps] = useState('4');
  const [schedule, setSchedule] = useState('40');

  // Results
  const [velocity, setVelocity] = useState(0);
  const [reynolds, setReynolds] = useState(0);
  const [frictionFactor, setFrictionFactor] = useState(0);
  const [pressureDrop, setPressureDrop] = useState(0); // bar
  const [pressureDropCompressible, setPressureDropCompressible] = useState<number | null>(null);
  const [compressibleChoked, setCompressibleChoked] = useState(false);
  const [mach, setMach] = useState(0);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const isGas = parseFloat(density) < 500;
  const hasGasParams =
    isGas &&
    inletPressureBar !== '' &&
    temperatureC !== '' &&
    mw !== '' &&
    zFactor !== '' &&
    kRatio !== '';

  // Validation
  useEffect(() => {
    const newErrors: Record<string, string | undefined> = {
      flow: validateNumber(flow, 'Flow Rate', { min: 0, required: true }),
      density: validateNumber(density, 'Density', { min: 0.1, required: true }),
      viscosity: validateNumber(viscosity, 'Viscosity', { min: 0.001, required: true }),
      length: validateNumber(length, 'Length', { min: 0, required: true }),
      elevation: validateNumber(elevation, 'Elevation', { required: true }),
      roughness: validateNumber(roughness, 'Roughness', { min: 0, required: true }),
    };
    if (hasGasParams) {
      newErrors.inletPressureBar = validateNumber(inletPressureBar, 'Inlet Pressure', { min: 0.01, required: true });
      newErrors.temperatureC = validateNumber(temperatureC, 'Temperature', { min: -273.15, required: true });
      newErrors.mw = validateNumber(mw, 'MW', { min: 1, required: true });
      newErrors.zFactor = validateNumber(zFactor, 'Z', { min: 0.1, max: 2, required: true });
      newErrors.kRatio = validateNumber(kRatio, 'k', { min: 1.01, required: true });
    }
    setErrors(newErrors);
  }, [flow, density, viscosity, length, elevation, roughness, inletPressureBar, temperatureC, mw, zFactor, kRatio, hasGasParams]);

  // Calculation (block only on main line/pipe errors; gas params optional)
  const blockingErrors = ['flow', 'density', 'viscosity', 'length', 'elevation', 'roughness'];
  const hasBlockingErrors = blockingErrors.some(k => (errors as Record<string, string | undefined>)[k]);
  const gasParamsValid = hasGasParams && !errors.inletPressureBar && !errors.temperatureC && !errors.mw && !errors.zFactor && !errors.kRatio;

  useEffect(() => {
    if (hasBlockingErrors) return;

    const pipe = PIPE_DATABASE.find(p => p.nps === nps && p.schedule === schedule);
    if (!pipe) return;

    const D_mm = pipe.id_mm;
    const D_m = D_mm / 1000;
    const A_m2 = Math.PI * Math.pow(D_m / 2, 2);

    const Q_m3s = parseFloat(flow) / 3600;
    const v = Q_m3s / A_m2;

    const rho = parseFloat(density);
    const mu_Pas = parseFloat(viscosity) / 1000; // cP -> Pa.s
    const e_m = parseFloat(roughness) / 1000;
    const L = parseFloat(length);
    const elev = parseFloat(elevation);

    const Re = calculateReynolds(rho, v, D_m, mu_Pas);
    const f = calculateFrictionFactor(Re, e_m, D_m);

    const dP_friction_Pa = calculatePressureDrop(f, L, D_m, rho, v);
    const dP_elevation_Pa = rho * 9.81 * elev;

    let Ma: number;
    if (isGas && gasParamsValid) {
      const T_K = parseFloat(temperatureC) + 273.15;
      const MW = parseFloat(mw);
      const Z = parseFloat(zFactor);
      const k = parseFloat(kRatio);
      const c = sonicVelocityGas(k, T_K, MW, Z);
      Ma = c > 0 ? v / c : 0;
    } else {
      const c = rho > 500 ? 1480 : 340;
      Ma = v / c;
    }

    let dP_total_Pa = dP_friction_Pa + dP_elevation_Pa;
    let dP_compressible_bar: number | null = null;
    let choked = false;

    if (isGas && Ma > 0.3 && gasParamsValid) {
      const P1_Pa = parseFloat(inletPressureBar) * 100000;
      const T_K = parseFloat(temperatureC) + 273.15;
      const MW = parseFloat(mw);
      const Z = parseFloat(zFactor);
      const massFlow_kg_s = (Q_m3s * rho);
      const comp = calculatePressureDropCompressibleIsothermal(P1_Pa, T_K, MW, Z, massFlow_kg_s, f, L, D_m, A_m2);
      dP_compressible_bar = (comp.dP_Pa + dP_elevation_Pa) / 100000;
      dP_total_Pa = comp.dP_Pa + dP_elevation_Pa;
      choked = comp.isChoked;
    }

    setVelocity(v);
    setReynolds(Re);
    setFrictionFactor(f);
    setPressureDrop(dP_total_Pa / 100000);
    setPressureDropCompressible(dP_compressible_bar);
    setCompressibleChoked(choked);
    setMach(Ma);
  }, [flow, density, viscosity, length, elevation, roughness, nps, schedule, inletPressureBar, temperatureC, mw, zFactor, kRatio, hasBlockingErrors, gasParamsValid, errors.inletPressureBar, errors.temperatureC, errors.mw, errors.zFactor, errors.kRatio]);

  return (
    <div className="space-y-8">
      <SectionHeader 
        title="Pipe Sizing (ASME B36.10M)" 
        description="Pressure drop calculation using Darcy-Weisbach and Colebrook-White iteration." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <h3 className="font-semibold text-slate-900 dark:text-white">Line Conditions</h3>
          <Input label="Flow Rate" unit="m³/h" value={flow} onChange={e => setFlow(e.target.value)} error={errors.flow} />
          <Input label="Density" unit="kg/m³" value={density} onChange={e => setDensity(e.target.value)} error={errors.density} />
          <Input label="Viscosity" unit="cP" value={viscosity} onChange={e => setViscosity(e.target.value)} error={errors.viscosity} />
          <Input label="Length" unit="m" value={length} onChange={e => setLength(e.target.value)} error={errors.length} />
          <Input label="Elevation Change" unit="m (+/-)" value={elevation} onChange={e => setElevation(e.target.value)} error={errors.elevation} />
          
          <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Pipe Selection</h4>
            <div className="grid grid-cols-2 gap-4">
              <Select 
                label="Nominal Size (NPS)" 
                options={Array.from(new Set(PIPE_DATABASE.map(p => p.nps))).map(n => ({ value: n, label: `${n}"` }))} 
                value={nps} 
                onChange={e => setNps(e.target.value)} 
              />
              <Select 
                label="Schedule" 
                options={PIPE_DATABASE.filter(p => p.nps === nps).map(p => ({ value: p.schedule, label: `SCH ${p.schedule}` }))} 
                value={schedule} 
                onChange={e => setSchedule(e.target.value)} 
              />
            </div>
            <Select
              label="Roughness from material"
              options={[
                { value: '', label: 'Custom (enter below)' },
                ...Object.entries(MATERIAL_ROUGHNESS).map(([name, val]) => ({ value: val.toString(), label: `${name} (${val} mm)` })),
              ]}
              value={Object.values(MATERIAL_ROUGHNESS).some(v => Math.abs(v - parseFloat(roughness)) < 1e-6) ? roughness : ''}
              onChange={e => { const v = e.target.value; if (v !== '') setRoughness(v); }}
            />
            <Input label="Roughness" unit="mm" value={roughness} onChange={e => setRoughness(e.target.value)} error={errors.roughness} />
            {isGas && (
              <div className="border-t border-slate-200 dark:border-slate-600 pt-4 space-y-2">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Gas compressible (when Mach &gt; 0.3)</h4>
                <Input label="Inlet pressure" unit="bar(a)" value={inletPressureBar} onChange={e => setInletPressureBar(e.target.value)} error={errors.inletPressureBar} />
                <Input label="Temperature" unit="°C" value={temperatureC} onChange={e => setTemperatureC(e.target.value)} error={errors.temperatureC} />
                <Input label="MW" unit="g/mol" value={mw} onChange={e => setMw(e.target.value)} error={errors.mw} />
                <Input label="Z" value={zFactor} onChange={e => setZFactor(e.target.value)} error={errors.zFactor} />
                <Input label="k (Cp/Cv)" value={kRatio} onChange={e => setKRatio(e.target.value)} error={errors.kRatio} />
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResultCard
              title="Pressure Drop"
              value={pressureDrop.toFixed(3)}
              unit="bar"
              subtext={pressureDropCompressible != null ? 'Compressible isothermal + Elev' : 'Total (Friction + Elev)'}
            />
            {pressureDropCompressible != null && (
              <ResultCard
                title="Compressible ΔP (friction)"
                value={(pressureDropCompressible - (parseFloat(density) * 9.81 * parseFloat(elevation)) / 100000).toFixed(3)}
                unit="bar"
                subtext={compressibleChoked ? 'Choked flow' : 'Isothermal gas'}
              />
            )}
            <ResultCard 
              title="Velocity" 
              value={velocity.toFixed(2)} 
              unit="m/s" 
              subtext={`Mach: ${mach.toFixed(3)}`}
            />
            <ResultCard 
              title="Reynolds Number" 
              value={reynolds.toExponential(2)} 
              subtext={reynolds > 4000 ? "Turbulent" : "Laminar"}
            />
            <ResultCard 
              title="Friction Factor" 
              value={frictionFactor.toFixed(4)} 
              subtext="Colebrook-White (f)"
            />
          </div>
          
          {mach > 0.3 && !(isGas && gasParamsValid) && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
              <h4 className="text-red-800 dark:text-red-200 font-bold flex items-center gap-2">
                ⚠️ High Mach Number — Use compressible flow
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Mach = {mach.toFixed(3)}. Incompressible Darcy-Weisbach may underestimate ΔP. Enter gas params above (inlet pressure, T, MW, Z, k) to use isothermal compressible flow.
              </p>
            </div>
          )}
          {mach > 0.3 && isGas && gasParamsValid && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
              <h4 className="text-green-800 dark:text-green-200 font-bold flex items-center gap-2">
                Compressible flow (isothermal) applied
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Pressure drop uses isothermal gas formula. Elevation head added to friction.
              </p>
            </div>
          )}

          <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 rounded-xl">
            <h4 className="font-semibold mb-4">Pipe Details</h4>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Inner Diameter</span>
                <span>{PIPE_DATABASE.find(p => p.nps === nps && p.schedule === schedule)?.id_mm} mm</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Flow Regime</span>
                <span>{reynolds < 2300 ? "Laminar" : reynolds < 4000 ? "Transition" : "Turbulent"}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Head Loss</span>
                <span className="text-green-400">{(pressureDrop * 100000 / (parseFloat(density) * 9.81)).toFixed(2)} m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
