import React, { useState, useEffect } from 'react';
import { SectionHeader, Input, ResultCard, Select } from '../components/UI';
import { validateNumber, hasErrors } from '../utils/validation';
import { calculateReliefArea, API_ORIFICES, findOrificeByLetter } from '../core/safety/api520';

export default function ReliefValve() {
  const [massFlow, setMassFlow] = useState('10000');
  const [setPressure, setSetPressure] = useState('10');
  const [backPressure, setBackPressure] = useState('0');
  const [temp, setTemp] = useState('150');
  const [mw, setMw] = useState('44');
  const [k, setK] = useState('1.3');
  const [z, setZ] = useState('0.95');
  const [valveType, setValveType] = useState('Conventional');
  const [ruptureDisk, setRuptureDisk] = useState('No');
  const [area, setArea] = useState(0);
  const [selectedOrifice, setSelectedOrifice] = useState<string | null>(null);
  const [ratedFlow, setRatedFlow] = useState(0);
  const [isSubcritical, setIsSubcritical] = useState(false);
  const [criticalPressure, setCriticalPressure] = useState(0);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const errs: any = {};
    errs.massFlow = validateNumber(parseFloat(massFlow), 'Mass Flow', { min: 0, required: true });
    errs.setPressure = validateNumber(parseFloat(setPressure), 'Set Pressure', { min: 0, required: true });
    errs.backPressure = validateNumber(parseFloat(backPressure), 'Back Pressure', { min: 0, required: true });
    errs.temp = validateNumber(parseFloat(temp), 'Temperature', { min: -273.15, required: true });
    errs.mw = validateNumber(parseFloat(mw), 'Molecular Weight', { min: 1, required: true });
    errs.k = validateNumber(parseFloat(k), 'Heat Capacity Ratio', { min: 1.01, required: true });
    errs.z = validateNumber(parseFloat(z), 'Compressibility', { min: 0.1, max: 2, required: true });
    setErrors(errs);
  }, [massFlow, setPressure, backPressure, temp, mw, k, z]);

  useEffect(() => {
    if (hasErrors(errors)) return;

    const W = parseFloat(massFlow) * 2.20462; // kg/h to lb/h
    const P1 = (parseFloat(setPressure) + 1.01325) * 14.5038; // barg to psia
    const P2 = (parseFloat(backPressure) + 1.01325) * 14.5038; // barg to psia
    const T = (parseFloat(temp) + 273.15) * 1.8; // °C to °R
    const M = parseFloat(mw);
    const K = parseFloat(k);
    const Z = parseFloat(z);
    const Kc = ruptureDisk === 'Yes' ? 0.9 : 1.0;
    const Kb = 1; // simplified, could be computed from back pressure

    const result = calculateReliefArea(W, T, P1, P2, M, K, Z, 0.975, Kb, Kc);
    setArea(result.area * 6.4516); // cm²
    setIsSubcritical(!result.choked);
    setCriticalPressure((P1 * Math.pow(2 / (K + 1), K / (K - 1)) - 14.7) / 14.5038);

    // Find the smallest orifice that meets the required area (in in²)
    const requiredIn2 = result.area;
    const orifice = API_ORIFICES.find(o => o.area >= requiredIn2);
    if (orifice) {
      setSelectedOrifice(orifice.letter);
      // Rated flow: area / required * massFlow (approx)
      setRatedFlow((orifice.area / requiredIn2) * parseFloat(massFlow));
    } else {
      setSelectedOrifice(null);
      setRatedFlow(0);
    }
  }, [massFlow, setPressure, backPressure, temp, mw, k, z, valveType, ruptureDisk, errors]);

  return (
    <div className="space-y-8">
      <SectionHeader title="Relief Valve Sizing (API 520 Professional)" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <h3 className="font-semibold text-slate-900 dark:text-white">Relief Parameters</h3>
          <Input label="Mass Flow" unit="kg/h" value={massFlow} onChange={e => setMassFlow(e.target.value)} error={errors.massFlow} />
          <Input label="Set Pressure" unit="barg" value={setPressure} onChange={e => setSetPressure(e.target.value)} error={errors.setPressure} />
          <Input label="Back Pressure" unit="barg" value={backPressure} onChange={e => setBackPressure(e.target.value)} error={errors.backPressure} />
          <Input label="Temperature" unit="°C" value={temp} onChange={e => setTemp(e.target.value)} error={errors.temp} />
          <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Fluid Properties</h4>
            <Input label="Molecular Weight" unit="g/mol" value={mw} onChange={e => setMw(e.target.value)} error={errors.mw} />
            <Input label="Heat Capacity Ratio (k)" value={k} onChange={e => setK(e.target.value)} error={errors.k} />
            <Input label="Compressibility (Z)" value={z} onChange={e => setZ(e.target.value)} error={errors.z} />
          </div>
          <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Valve Configuration</h4>
            <Select
              label="Valve Type"
              options={[
                { value: 'Conventional', label: 'Conventional' },
                { value: 'Balanced', label: 'Balanced Bellows' },
              ]}
              value={valveType}
              onChange={e => setValveType(e.target.value)}
            />
            <Select
              label="Rupture Disk Upstream?"
              options={[
                { value: 'No', label: 'No' },
                { value: 'Yes', label: 'Yes (Kc=0.9)' },
              ]}
              value={ruptureDisk}
              onChange={e => setRuptureDisk(e.target.value)}
            />
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResultCard title="Required Area" value={area.toFixed(2)} unit="cm²" subtext={`${(area / 6.4516).toFixed(3)} in²`} />
            <ResultCard title="Selected Orifice" value={selectedOrifice ? `"${selectedOrifice}"` : 'N/A'} subtext="API 526 Standard" />
            <ResultCard title="Rated Capacity" value={ratedFlow.toFixed(0)} unit="kg/h" subtext={`${((ratedFlow / parseFloat(massFlow)) * 100 || 0).toFixed(0)}% of Required`} />
            <ResultCard title="Flow Regime" value={isSubcritical ? 'Subcritical' : 'Critical'} subtext={isSubcritical ? 'Using F2 Correction' : 'Choked Flow'} />
          </div>
          {isSubcritical && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
              <h4 className="text-amber-800 dark:text-amber-200 font-bold flex items-center gap-2">⚠️ Subcritical Flow</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Backpressure is high ({parseFloat(backPressure).toFixed(1)} barg). Critical Pressure is {criticalPressure.toFixed(1)} barg.
                The valve capacity is reduced by factor F2. Ensure the selected valve is large enough.
              </p>
            </div>
          )}
          <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 rounded-xl">
            <h4 className="font-semibold mb-4">API 520 Calculation Summary</h4>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Relieving Pressure (P1)</span>
                <span>{(parseFloat(setPressure) * 1.1 + 1.013).toFixed(2)} bara</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Back Pressure (P2)</span>
                <span>{(parseFloat(backPressure) + 1.013).toFixed(2)} bara</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Correction Factors</span>
                <span>Kd=0.975, Kc={ruptureDisk === 'Yes' ? '0.9' : '1.0'}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Orifice Utilization</span>
                <span className="text-green-400">
                  {selectedOrifice
                    ? ((area / (findOrificeByLetter(selectedOrifice)?.area || 1) * 6.4516) / 6.4516 * 100).toFixed(1) + '%'
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
