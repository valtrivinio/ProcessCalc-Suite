import React, { useState, useEffect } from 'react';
import { SectionHeader, Input, ResultCard, Select } from '../components/UI';
import { validateNumber, hasErrors } from '../utils/validation';
import { sizeLiquidValve, sizeGasValve } from '../core/fluid/controlValve';

export default function Valves() {
  const [fluidType, setFluidType] = useState<'Liquid' | 'Gas'>('Liquid');
  
  // Common Inputs
  const [p1, setP1] = useState('10'); // bar(a)
  const [p2, setP2] = useState('8'); // bar(a)
  
  // Liquid Inputs
  const [liqFlow, setLiqFlow] = useState('50'); // m3/h
  const [sg, setSg] = useState('1.0'); // Water = 1
  const [pv, setPv] = useState('0.03'); // bar(a)
  const [fl, setFl] = useState('0.9'); // Recovery Factor
  
  // Gas Inputs
  const [gasFlow, setGasFlow] = useState('1000'); // kg/h
  const [temp, setTemp] = useState('25'); // C
  const [mw, setMw] = useState('18'); // g/mol
  const [z, setZ] = useState('1.0');
  const [k, setK] = useState('1.4');
  const [xt, setXt] = useState('0.72');

  // Results
  const [cv, setCv] = useState(0);
  const [kv, setKv] = useState(0);
  const [regime, setRegime] = useState('');
  const [expansionY, setExpansionY] = useState(0);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Validation
  useEffect(() => {
    const newErrors: Record<string, string | undefined> = {
      p1: validateNumber(p1, 'Inlet Pressure', { min: 0.1, required: true }),
      p2: validateNumber(p2, 'Outlet Pressure', { min: 0, required: true }),
    };

    if (fluidType === 'Liquid') {
      newErrors.liqFlow = validateNumber(liqFlow, 'Flow Rate', { min: 0, required: true });
      newErrors.sg = validateNumber(sg, 'Specific Gravity', { min: 0.1, required: true });
      newErrors.pv = validateNumber(pv, 'Vapor Pressure', { min: 0, required: true });
      newErrors.fl = validateNumber(fl, 'FL Factor', { min: 0.1, max: 1, required: true });
    } else {
      newErrors.gasFlow = validateNumber(gasFlow, 'Mass Flow', { min: 0, required: true });
      newErrors.temp = validateNumber(temp, 'Temperature', { min: -273.15, required: true });
      newErrors.mw = validateNumber(mw, 'Molecular Weight', { min: 1, required: true });
      newErrors.z = validateNumber(z, 'Compressibility', { min: 0.1, max: 2, required: true });
      newErrors.k = validateNumber(k, 'Heat Capacity Ratio', { min: 1.01, required: true });
      newErrors.xt = validateNumber(xt, 'xT Factor', { min: 0.1, max: 1, required: true });
    }

    if (!newErrors.p1 && !newErrors.p2 && parseFloat(p2) >= parseFloat(p1)) {
      newErrors.p2 = 'Outlet Pressure must be < Inlet Pressure';
    }

    setErrors(newErrors);
  }, [fluidType, p1, p2, liqFlow, sg, pv, fl, gasFlow, temp, mw, z, k, xt]);

  // Calculation
  useEffect(() => {
    if (hasErrors(errors)) return;

    const P1 = parseFloat(p1);
    const P2 = parseFloat(p2);

    if (fluidType === 'Liquid') {
      const Q = parseFloat(liqFlow);
      const S = parseFloat(sg);
      const Pv = parseFloat(pv);
      const FL = parseFloat(fl);
      
      const res = sizeLiquidValve(Q, P1, P2, S, Pv, FL);
      setCv(res.Cv);
      setKv(res.Kv);
      setRegime(res.flowRegime);
      setExpansionY(0); // N/A
    } else {
      const W = parseFloat(gasFlow);
      const T = parseFloat(temp) + 273.15;
      const MW = parseFloat(mw);
      const Z = parseFloat(z);
      const K = parseFloat(k);
      const XT = parseFloat(xt);

      const res = sizeGasValve(W, P1, P2, T, MW, Z, K, XT);
      setCv(res.Cv);
      setKv(res.Kv);
      setRegime(res.flowRegime);
      setExpansionY(res.expansionFactor || 0);
    }
  }, [fluidType, p1, p2, liqFlow, sg, pv, fl, gasFlow, temp, mw, z, k, xt, errors]);

  return (
    <div className="space-y-8">
      <SectionHeader 
        title="Control Valve Sizing (ISA 75.01)" 
        description="Calculate Cv/Kv for Liquid (Incompressible) and Gas (Compressible) service." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          
          {/* Fluid Type Selector */}
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
            {['Liquid', 'Gas'].map((type) => (
              <button
                key={type}
                onClick={() => setFluidType(type as any)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                  fluidType === type 
                    ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <h3 className="font-semibold text-slate-900 dark:text-white">Process Conditions</h3>
          <Input label="Inlet Pressure (P1)" unit="bar(a)" value={p1} onChange={e => setP1(e.target.value)} error={errors.p1} />
          <Input label="Outlet Pressure (P2)" unit="bar(a)" value={p2} onChange={e => setP2(e.target.value)} error={errors.p2} />

          {fluidType === 'Liquid' ? (
            <>
              <Input label="Flow Rate" unit="m³/h" value={liqFlow} onChange={e => setLiqFlow(e.target.value)} error={errors.liqFlow} />
              <Input label="Specific Gravity" value={sg} onChange={e => setSg(e.target.value)} error={errors.sg} />
              <Input label="Vapor Pressure" unit="bar(a)" value={pv} onChange={e => setPv(e.target.value)} error={errors.pv} />
              <Input label="Recovery Factor (FL)" value={fl} onChange={e => setFl(e.target.value)} error={errors.fl} placeholder="0.9 Globe, 0.6 Butterfly" />
            </>
          ) : (
            <>
              <Input label="Mass Flow" unit="kg/h" value={gasFlow} onChange={e => setGasFlow(e.target.value)} error={errors.gasFlow} />
              <Input label="Temperature" unit="°C" value={temp} onChange={e => setTemp(e.target.value)} error={errors.temp} />
              <Input label="Molecular Weight" unit="g/mol" value={mw} onChange={e => setMw(e.target.value)} error={errors.mw} />
              <Input label="Compressibility (Z)" value={z} onChange={e => setZ(e.target.value)} error={errors.z} />
              <Input label="Heat Capacity Ratio (k)" value={k} onChange={e => setK(e.target.value)} error={errors.k} />
              <Input label="Press. Drop Ratio (xT)" value={xt} onChange={e => setXt(e.target.value)} error={errors.xt} placeholder="0.72 Globe" />
            </>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResultCard 
              title="Required Cv" 
              value={cv.toFixed(2)} 
              subtext="US Units"
            />
            <ResultCard 
              title="Required Kv" 
              value={kv.toFixed(2)} 
              subtext="Metric Units"
            />
            <ResultCard 
              title="Flow Regime" 
              value={regime} 
              subtext={regime === 'Choked' ? "⚠️ Flow Limited" : "Normal"}
            />
            {fluidType === 'Gas' && (
              <ResultCard 
                title="Expansion Factor (Y)" 
                value={expansionY.toFixed(3)} 
                subtext="Compressibility Effect"
              />
            )}
            <ResultCard 
              title="Est. Valve Size" 
              value={cv > 0 ? Math.sqrt(cv/12).toFixed(1) : '-'} 
              unit="inch" 
              subtext="Rough Estimate"
            />
          </div>
          
          {regime === 'Choked' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
              <h4 className="text-amber-800 dark:text-amber-200 font-bold flex items-center gap-2">
                ⚠️ Choked Flow Detected
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                The valve is operating in choked flow conditions. Increasing pressure drop further will not increase flow rate. 
                Cavitation (liquids) or high noise/vibration (gas) may occur.
              </p>
            </div>
          )}

          <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 rounded-xl">
            <h4 className="font-semibold mb-4">Sizing Guidelines</h4>
            <p className="text-sm text-slate-400 mb-2">
              • Select a valve where calculated Cv is approx 70-80% of rated Cv.
            </p>
            <p className="text-sm text-slate-400 mb-2">
              • For Liquids: Ensure P2 &gt; Pv to avoid flashing/cavitation.
            </p>
            <p className="text-sm text-slate-400">
              • For Gases: Check for aerodynamic noise if dP/P1 &gt; 0.5.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
