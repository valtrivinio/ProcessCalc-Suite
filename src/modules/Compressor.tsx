import React, { useState, useEffect } from 'react';
import { SectionHeader, Input, ResultCard } from '../components/UI';
import { validateNumber, hasErrors } from '../utils/validation';
import { calculateCompressor } from '../core/rotating/compressor';

export default function Compressor() {
  // Inputs
  const [flow, setFlow] = useState('10000'); // kg/h
  const [pIn, setPIn] = useState('5'); // barg
  const [pOut, setPOut] = useState('20'); // barg
  const [tempIn, setTempIn] = useState('30'); // C
  
  // Gas Properties
  const [mw, setMw] = useState('20'); // g/mol
  const [k, setK] = useState('1.3'); // Cp/Cv
  const [zIn, setZIn] = useState('0.95'); // Compressibility
  const [eff, setEff] = useState('75'); // Polytropic Efficiency %

  // Results
  const [polyHead, setPolyHead] = useState(0);
  const [gasPower, setGasPower] = useState(0);
  const [brakePower, setBrakePower] = useState(0);
  const [dischargeTemp, setDischargeTemp] = useState(0);
  const [volFlow, setVolFlow] = useState(0);
  const [ratio, setRatio] = useState(0);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Validation
  useEffect(() => {
    const newErrors: Record<string, string | undefined> = {
      flow: validateNumber(flow, 'Mass Flow', { min: 0, required: true }),
      pIn: validateNumber(pIn, 'Suction Pressure', { min: -1, required: true }),
      pOut: validateNumber(pOut, 'Discharge Pressure', { min: -1, required: true }),
      tempIn: validateNumber(tempIn, 'Suction Temp', { min: -273.15, required: true }),
      mw: validateNumber(mw, 'Gas MW', { min: 1, required: true }),
      k: validateNumber(k, 'Heat Capacity Ratio', { min: 1.01, required: true }),
      zIn: validateNumber(zIn, 'Compressibility', { min: 0.1, max: 2, required: true }),
      eff: validateNumber(eff, 'Efficiency', { min: 1, max: 100, required: true }),
    };

    if (!newErrors.pIn && !newErrors.pOut && parseFloat(pOut) <= parseFloat(pIn)) {
      newErrors.pOut = 'Discharge Pressure must be > Suction Pressure';
    }

    setErrors(newErrors);
  }, [flow, pIn, pOut, tempIn, mw, k, zIn, eff]);

  // Calculation
  useEffect(() => {
    if (hasErrors(errors)) return;

    const massFlow = parseFloat(flow);
    const P1_kPa = (parseFloat(pIn) + 1.01325) * 100;
    const P2_kPa = (parseFloat(pOut) + 1.01325) * 100;
    const T1_K = parseFloat(tempIn) + 273.15;
    const Z1 = parseFloat(zIn);
    const MW = parseFloat(mw);
    const kVal = parseFloat(k);
    const eta_p = parseFloat(eff) / 100;

    const result = calculateCompressor(P1_kPa, P2_kPa, T1_K, Z1, MW, kVal, eta_p, massFlow);

    setPolyHead(result.polytropicHead);
    setGasPower(result.gasPower);
    setBrakePower(result.brakePower);
    setDischargeTemp(result.dischargeTemp);
    setVolFlow(result.volumetricFlowInlet);
    setRatio(P2_kPa / P1_kPa);

  }, [flow, pIn, pOut, tempIn, mw, k, zIn, eff, errors]);

  return (
    <div className="space-y-8">
      <SectionHeader 
        title="Compressor Sizing (Professional)" 
        description="Polytropic head and power calculation for centrifugal compressors (GPSA/API 617)." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <h3 className="font-semibold text-slate-900 dark:text-white">Operating Conditions</h3>
          <Input label="Mass Flow" unit="kg/h" value={flow} onChange={e => setFlow(e.target.value)} error={errors.flow} />
          <Input label="Suction Pressure" unit="barg" value={pIn} onChange={e => setPIn(e.target.value)} error={errors.pIn} />
          <Input label="Discharge Pressure" unit="barg" value={pOut} onChange={e => setPOut(e.target.value)} error={errors.pOut} />
          <Input label="Suction Temp" unit="°C" value={tempIn} onChange={e => setTempIn(e.target.value)} error={errors.tempIn} />
          
          <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Gas Properties</h4>
            <Input label="Molecular Weight" unit="g/mol" value={mw} onChange={e => setMw(e.target.value)} error={errors.mw} />
            <Input label="Heat Capacity Ratio (k)" value={k} onChange={e => setK(e.target.value)} error={errors.k} />
            <Input label="Compressibility (Z)" value={zIn} onChange={e => setZIn(e.target.value)} error={errors.zIn} />
            <Input label="Polytropic Efficiency" unit="%" value={eff} onChange={e => setEff(e.target.value)} error={errors.eff} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResultCard 
              title="Polytropic Head" 
              value={polyHead.toFixed(2)} 
              unit="kJ/kg" 
              subtext="Energy per unit mass"
            />
            <ResultCard 
              title="Gas Power" 
              value={gasPower.toFixed(2)} 
              unit="kW" 
              subtext="Internal Power"
            />
            <ResultCard 
              title="Brake Power" 
              value={brakePower.toFixed(2)} 
              unit="kW" 
              subtext="Shaft Power (w/ Mech Loss)"
            />
            <ResultCard 
              title="Discharge Temp" 
              value={dischargeTemp.toFixed(1)} 
              unit="°C" 
              subtext={dischargeTemp > 150 ? "⚠️ High Temp!" : "Estimated"}
            />
            <ResultCard 
              title="Inlet Volumetric Flow" 
              value={volFlow.toFixed(1)} 
              unit="m³/h" 
              subtext="Actual (Am³/h)"
            />
            <ResultCard 
              title="Compression Ratio" 
              value={ratio.toFixed(2)} 
              subtext={ratio > 3.5 ? "⚠️ Consider Multi-stage" : "Single Stage Feasible"}
            />
          </div>

          {/* Warnings */}
          {dischargeTemp > 150 && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
              <h4 className="text-red-800 dark:text-red-200 font-bold flex items-center gap-2">
                ⚠️ High Discharge Temperature
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Discharge temperature is {dischargeTemp.toFixed(1)}°C. This may exceed material limits or cause oil degradation. 
                Consider intercooling or lowering compression ratio per stage.
              </p>
            </div>
          )}

          <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 rounded-xl">
            <h4 className="font-semibold mb-4">Compressor Summary</h4>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Polytropic Efficiency</span>
                <span>{eff}%</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Polytropic Exponent (n)</span>
                <span>{(1 / (1 - ((parseFloat(k)-1)/(parseFloat(k)*(parseFloat(eff)/100))))).toFixed(3)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Driver Size Estimate</span>
                <span className="text-green-400">{(brakePower * 1.1).toFixed(1)} kW (w/ 10% margin)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
