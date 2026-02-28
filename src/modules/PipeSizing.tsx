import React, { useState, useEffect } from 'react';
import { SectionHeader, Input, ResultCard, Select } from '../components/UI';
import { validateInput, checkRange } from '../core/utils/engine';
import { PIPE_DATABASE, calculateReynolds, calculateFrictionFactor, calculatePressureDrop } from '../core/fluid/pipeSizing';
import { AlertTriangle, ShieldAlert, Info, FileText } from 'lucide-react';

export default function PipeSizing() {
  // Inputs
  const [flow, setFlow] = useState('100'); // m3/h
  const [density, setDensity] = useState('1000'); // kg/m3
  const [viscosity, setViscosity] = useState('1.0'); // cP
  const [length, setLength] = useState('100'); // m
  const [elevation, setElevation] = useState('0'); // m
  const [roughness, setRoughness] = useState('0.0457'); // mm (Carbon Steel)
  const [sumK, setSumK] = useState('0'); // Minor losses
  
  // Pipe Selection
  const [nps, setNps] = useState('4');
  const [schedule, setSchedule] = useState('40');

  // Results
  const [velocity, setVelocity] = useState(0);
  const [reynolds, setReynolds] = useState(0);
  const [frictionFactor, setFrictionFactor] = useState(0);
  const [pressureDrop, setPressureDrop] = useState(0); // bar
  const [mach, setMach] = useState(0);
  const [validationResults, setValidationResults] = useState<string[]>([]);

  // Calculation
  useEffect(() => {
    try {
      // 1. Validate Inputs
      validateInput(parseFloat(flow), 'Flow Rate', 0);
      validateInput(parseFloat(density), 'Density', 0.1);
      validateInput(parseFloat(viscosity), 'Viscosity', 0.001);
      validateInput(parseFloat(length), 'Length', 0);
      validateInput(parseFloat(roughness), 'Roughness', 0);

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
      const K = parseFloat(sumK) || 0;

      const Re = calculateReynolds(rho, v, D_m, mu_Pas);
      const f = calculateFrictionFactor(Re, e_m, D_m);
      
      const dP_friction_Pa = calculatePressureDrop(f, parseFloat(length), D_m, rho, v, K);
      const dP_elevation_Pa = rho * 9.81 * parseFloat(elevation);
      
      const dP_total_bar = (dP_friction_Pa + dP_elevation_Pa) / 100000;
      
      const c = rho > 500 ? 1480 : 340; 
      const Ma = v / c;

      setVelocity(v);
      setReynolds(Re);
      setFrictionFactor(f);
      setPressureDrop(dP_total_bar);
      setMach(Ma);

      // 2. Engineering Checks
      const checks: string[] = [];
      if (v > 3.0 && rho > 500) checks.push('Velocity exceeds 3.0 m/s (Erosion Risk)');
      if (Ma > 0.3) checks.push('High Mach Number (> 0.3) - Compressibility significant');
      if (Re > 2300 && Re < 4000) checks.push('Flow in Transition Region - Results may vary');
      setValidationResults(checks);

    } catch (e) {
      console.error(e);
    }
  }, [flow, density, viscosity, length, elevation, roughness, nps, schedule, sumK]);

  return (
    <div className="space-y-8 relative">
      {/* Professional Watermark */}
      <div className="absolute top-0 right-0 opacity-10 pointer-events-none select-none rotate-12 transform origin-top-right">
        <p className="text-4xl font-bold text-slate-900 dark:text-white border-4 border-slate-900 dark:border-white p-4">
          PRELIMINARY DESIGN ONLY
        </p>
      </div>

      <SectionHeader 
        title="Pipe Sizing & Hydraulics" 
        description="Validated ASME B36.10M sizing with Darcy-Weisbach / Colebrook-White engine." 
      />

      {/* Professional Warning Bar */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5" />
        <div className="text-sm text-amber-800 dark:text-amber-200">
          <p className="font-semibold">Professional Liability Notice</p>
          <p>This module is for Front-End Engineering Design (FEED) support. Final construction line sizing MUST be verified by a Licensed Professional Engineer (PE) using certified hydraulic simulation software.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">Process Inputs</h3>
            <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded uppercase">V&V Case: PIPE-01</span>
          </div>
          
          <Input label="Flow Rate" unit="m³/h" value={flow} onChange={e => setFlow(e.target.value)} />
          <Input label="Density" unit="kg/m³" value={density} onChange={e => setDensity(e.target.value)} />
          <Input label="Viscosity" unit="cP" value={viscosity} onChange={e => setViscosity(e.target.value)} />
          <Input label="Length" unit="m" value={length} onChange={e => setLength(e.target.value)} />
          <Input label="Elevation Change" unit="m (+/-)" value={elevation} onChange={e => setElevation(e.target.value)} />
          
          <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Mechanical Specs</h4>
            <div className="grid grid-cols-2 gap-4">
              <Select 
                label="NPS" 
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
            <Input label="Roughness (ε)" unit="mm" value={roughness} onChange={e => setRoughness(e.target.value)} />
            <Input label="Minor Losses (ΣK)" unit="-" value={sumK} onChange={e => setSumK(e.target.value)} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResultCard 
              title="Pressure Drop" 
              value={pressureDrop.toFixed(3)} 
              unit="bar" 
              subtext={`ΔP/100m: ${(pressureDrop / parseFloat(length) * 100).toFixed(3)}`}
            />
            <ResultCard 
              title="Velocity" 
              value={velocity.toFixed(2)} 
              unit="m/s" 
              subtext={`Mach: ${mach.toFixed(3)}`}
            />
            <ResultCard 
              title="Reynolds Number" 
              value={reynolds.toExponential(2)} 
              subtext={reynolds > 4000 ? "Turbulent" : reynolds < 2300 ? "Laminar" : "Transition"}
            />
            <ResultCard 
              title="Friction Factor" 
              value={frictionFactor.toFixed(4)} 
              subtext="Colebrook-White (f)"
            />
          </div>
          
          {validationResults.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
              <h4 className="text-red-800 dark:text-red-200 font-bold flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" /> Engineering Warnings
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                {validationResults.map((check, i) => <li key={i}>{check}</li>)}
              </ul>
            </div>
          )}

          <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Calculation Audit Trail</h4>
              <FileText className="w-4 h-4 text-slate-500" />
            </div>
            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Governing Equation</span>
                <span>Darcy-Weisbach (Crane TP-410)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Friction Method</span>
                <span>Colebrook-White (Iterative)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Inner Diameter</span>
                <span>{PIPE_DATABASE.find(p => p.nps === nps && p.schedule === schedule)?.id_mm} mm</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Inlet Momentum (ρv²)</span>
                <span>{(parseFloat(density) * velocity * velocity).toFixed(0)} Pa</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Head Loss</span>
                <span className="text-emerald-400">{(pressureDrop * 100000 / (parseFloat(density) * 9.81)).toFixed(2)} m</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              Reset Inputs
            </button>
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all">
              Generate PDF Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
