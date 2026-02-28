import React, { useState, useEffect } from 'react';
import { SectionHeader, Input, ResultCard, Select } from '../components/UI';
import { validateNumber, hasErrors } from '../utils/validation';
import { calculateReliefArea, API_ORIFICES } from '../core/safety/api520';

export default function ReliefValve() {
  // Inputs
  const [massFlow, setMassFlow] = useState('10000'); // kg/h
  const [setPressure, setSetPressure] = useState('10'); // barg
  const [backPressure, setBackPressure] = useState('0'); // barg
  const [temp, setTemp] = useState('150'); // C
  
  // Fluid Properties
  const [mw, setMw] = useState('44'); // g/mol
  const [k, setK] = useState('1.3'); // Cp/Cv
  const [z, setZ] = useState('0.95'); // Compressibility

  // Valve Config
  const [valveType, setValveType] = useState('Conventional');
  const [ruptureDisk, setRuptureDisk] = useState('No');

  // Results
  const [areaIn2, setAreaIn2] = useState(0);
  const [areaCm2, setAreaCm2] = useState(0);
  const [designation, setDesignation] = useState('-');
  const [ratedFlow, setRatedFlow] = useState(0);
  const [isSubcritical, setIsSubcritical] = useState(false);
  const [criticalPressure, setCriticalPressure] = useState(0);
  const [kFactorUsed, setKFactorUsed] = useState(1);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Validation
  useEffect(() => {
    const newErrors = {
      massFlow: validateNumber(massFlow, 'Relieving Rate', { min: 0, required: true }),
      setPressure: validateNumber(setPressure, 'Set Pressure', { min: 0.1, required: true }),
      backPressure: validateNumber(backPressure, 'Back Pressure', { min: 0, required: true }),
      temp: validateNumber(temp, 'Relieving Temp', { min: -273.15, required: true }),
      mw: validateNumber(mw, 'Molecular Weight', { min: 1, required: true }),
      k: validateNumber(k, 'Heat Capacity Ratio', { min: 1.01, required: true }),
      z: validateNumber(z, 'Compressibility', { min: 0.1, max: 2, required: true }),
    };
    setErrors(newErrors);
  }, [massFlow, setPressure, backPressure, temp, mw, k, z]);

  // Calculation
  useEffect(() => {
    if (hasErrors(errors)) return;

    const W_lbhr = parseFloat(massFlow) * 2.20462;
    const P_set_psig = parseFloat(setPressure) * 14.5038;
    const P_back_psig = parseFloat(backPressure) * 14.5038;
    
    // Relieving Pressure (10% accumulation)
    const P1_psia = (P_set_psig * 1.1) + 14.7;
    const P2_psia = P_back_psig + 14.7;

    const T_R = (parseFloat(temp) * 1.8) + 32 + 460;
    const M = parseFloat(mw);
    const k_val = parseFloat(k);
    const z_val = parseFloat(z);

    // Backpressure correction Kb (API 520 Fig 30): Conventional valves lose capacity with built-up backpressure
    const criticalRatio = Math.pow(2 / (k_val + 1), k_val / (k_val - 1));
    const Pcf_psia = P1_psia * criticalRatio;
    let Kb = 1.0;
    if (valveType === 'Conventional' && P2_psia < P1_psia) {
      const builtUpRatio = (P2_psia - 14.7) / (P1_psia - 14.7);
      Kb = Math.max(0.6, Math.min(1, 1 - 0.4 * builtUpRatio));
    }

    const Kc = ruptureDisk === 'Yes' ? 0.9 : 1.0;
    const Kd = 0.975; // API effective coefficient

    const result = calculateReliefArea(
      W_lbhr,
      P1_psia,
      P2_psia,
      T_R,
      z_val,
      M,
      k_val,
      Kd,
      Kb,
      Kc
    );

    setKFactorUsed(Kb);
    setAreaIn2(result.area);
    setAreaCm2(result.area * 6.4516);
    setDesignation(result.designation);
    setRatedFlow(result.ratedFlow / 2.20462); // kg/h
    setIsSubcritical(result.isSubcritical);
    setCriticalPressure((result.criticalPressure - 14.7) / 14.5038); // barg

  }, [massFlow, setPressure, backPressure, temp, mw, k, z, valveType, ruptureDisk, errors]);

  return (
    <div className="space-y-8">
      <SectionHeader 
        title="Relief Valve Sizing (API 520 Professional)" 
        description="Sizing for gas/vapor relief with Critical/Subcritical flow logic and correction factors." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <h3 className="font-semibold text-slate-900 dark:text-white">Relief Parameters</h3>
          <Input label="Required Relieving Rate" unit="kg/h" value={massFlow} onChange={e => setMassFlow(e.target.value)} error={errors.massFlow} />
          <Input label="Set Pressure" unit="barg" value={setPressure} onChange={e => setSetPressure(e.target.value)} error={errors.setPressure} />
          <Input label="Back Pressure" unit="barg" value={backPressure} onChange={e => setBackPressure(e.target.value)} error={errors.backPressure} />
          <Input label="Relieving Temp" unit="°C" value={temp} onChange={e => setTemp(e.target.value)} error={errors.temp} />
          
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
              options={[{value: 'Conventional', label: 'Conventional'}, {value: 'Balanced', label: 'Balanced Bellows'}]} 
              value={valveType} 
              onChange={e => setValveType(e.target.value)} 
            />
            <Select 
              label="Rupture Disk Upstream?" 
              options={[{value: 'No', label: 'No'}, {value: 'Yes', label: 'Yes (Kc=0.9)'}]} 
              value={ruptureDisk} 
              onChange={e => setRuptureDisk(e.target.value)} 
            />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResultCard 
              title="Required Area" 
              value={areaCm2.toFixed(2)} 
              unit="cm²" 
              subtext={`${areaIn2.toFixed(3)} in²`}
            />
            <ResultCard 
              title="Selected Orifice" 
              value={`"${designation}"`} 
              subtext="API 526 Standard"
            />
            <ResultCard 
              title="Rated Capacity" 
              value={ratedFlow.toFixed(0)} 
              unit="kg/h" 
              subtext={`${((ratedFlow / (parseFloat(massFlow)||1)) * 100).toFixed(0)}% of Required`}
            />
            <ResultCard 
              title="Flow Regime" 
              value={isSubcritical ? "Subcritical" : "Critical"} 
              subtext={isSubcritical ? "Using F2 Correction" : "Choked Flow"}
            />
          </div>
          
          {isSubcritical && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
              <h4 className="text-amber-800 dark:text-amber-200 font-bold flex items-center gap-2">
                ⚠️ Subcritical Flow
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Backpressure is high ({(parseFloat(backPressure)).toFixed(1)} barg). 
                Critical Pressure is {criticalPressure.toFixed(1)} barg. 
                The valve capacity is reduced by factor F2. Ensure the selected valve is large enough.
              </p>
            </div>
          )}

          <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 rounded-xl">
            <h4 className="font-semibold mb-4">API 520 Calculation Summary</h4>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Relieving Pressure (P1)</span>
                <span>{((parseFloat(setPressure)*1.1 + 1.013)).toFixed(2)} bara</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Back Pressure (P2)</span>
                <span>{((parseFloat(backPressure) + 1.013)).toFixed(2)} bara</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Correction Factors</span>
                <span>Kd=0.975, Kb={kFactorUsed.toFixed(2)}, Kc={ruptureDisk === 'Yes' ? '0.9' : '1.0'}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Orifice Utilization</span>
                <span className="text-green-400">{(areaCm2 / (API_ORIFICES.find(o => o.letter === designation)?.area || 1) * 6.4516 * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
