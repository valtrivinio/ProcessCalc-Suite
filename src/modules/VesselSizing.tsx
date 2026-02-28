import React, { useState, useEffect } from 'react';
import { SectionHeader, Input, ResultCard, Select } from '../components/UI';
import { validateNumber, hasErrors } from '../utils/validation';
import { sizeVerticalSeparator } from '../core/process/separator';

export default function Separator() {
  // Inputs
  const [orientation, setOrientation] = useState('Vertical');
  const [gasFlow, setGasFlow] = useState('1000'); // m3/h (Actual)
  const [liqFlow, setLiqFlow] = useState('10'); // m3/h (Actual)
  const [pressure, setPressure] = useState('20'); // barg
  const [temp, setTemp] = useState('40'); // C
  const [gasRho, setGasRho] = useState('15'); // kg/m3
  const [liqRho, setLiqRho] = useState('850'); // kg/m3
  const [retentionTime, setRetentionTime] = useState('5'); // minutes

  // Results
  const [diameter, setDiameter] = useState(0);
  const [height, setHeight] = useState(0);
  const [vGas, setVGas] = useState(0);
  const [vGasMax, setVGasMax] = useState(0);
  const [slenderness, setSlenderness] = useState(0);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Validation
  useEffect(() => {
    const newErrors = {
      gasFlow: validateNumber(gasFlow, 'Gas Flow', { min: 0, required: true }),
      liqFlow: validateNumber(liqFlow, 'Liquid Flow', { min: 0, required: true }),
      pressure: validateNumber(pressure, 'Pressure', { min: 0, required: true }),
      temp: validateNumber(temp, 'Temperature', { min: -273.15, required: true }),
      gasRho: validateNumber(gasRho, 'Gas Density', { min: 0.01, required: true }),
      liqRho: validateNumber(liqRho, 'Liquid Density', { min: 0.1, required: true }),
      retentionTime: validateNumber(retentionTime, 'Retention Time', { min: 0.1, required: true }),
    };
    setErrors(newErrors);
  }, [gasFlow, liqFlow, pressure, temp, gasRho, liqRho, retentionTime]);

  // Calculation
  useEffect(() => {
    if (hasErrors(errors)) return;

    const qGas = parseFloat(gasFlow);
    const qLiq = parseFloat(liqFlow);
    const rhoG = parseFloat(gasRho);
    const rhoL = parseFloat(liqRho);
    const tRet = parseFloat(retentionTime);
    const P_bar = parseFloat(pressure);

    if (orientation === 'Vertical') {
      const result = sizeVerticalSeparator(qGas, qLiq, rhoG, rhoL, tRet, P_bar);
      setDiameter(result.diameter);
      setHeight(result.height);
      setVGas(result.vGas);
      setVGasMax(result.vGasMax);
      setSlenderness(result.slendernessRatio);
    } else {
      // Horizontal placeholder (reuse vertical logic for now or add horizontal core later)
      // For now, just warn or use vertical as approximation for demo
      const result = sizeVerticalSeparator(qGas, qLiq, rhoG, rhoL, tRet, P_bar);
      setDiameter(result.diameter);
      setHeight(result.height); // Horizontal length would be different
      setVGas(result.vGas);
      setVGasMax(result.vGasMax);
      setSlenderness(result.slendernessRatio);
    }

  }, [orientation, gasFlow, liqFlow, pressure, temp, gasRho, liqRho, retentionTime, errors]);

  return (
    <div className="space-y-8">
      <SectionHeader 
        title="Separator Sizing (2-Phase)" 
        description="API 12J / GPSA Sizing for Vertical Separators." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <h3 className="font-semibold text-slate-900 dark:text-white">Design Parameters</h3>
          
          <Select 
            label="Orientation" 
            options={[{value: 'Vertical', label: 'Vertical'}, {value: 'Horizontal', label: 'Horizontal (Coming Soon)'}]} 
            value={orientation} 
            onChange={(e) => setOrientation(e.target.value)} 
          />

          <Input label="Gas Flow (Actual)" unit="m³/h" value={gasFlow} onChange={e => setGasFlow(e.target.value)} error={errors.gasFlow} />
          <Input label="Liquid Flow (Actual)" unit="m³/h" value={liqFlow} onChange={e => setLiqFlow(e.target.value)} error={errors.liqFlow} />
          <Input label="Operating Pressure" unit="barg" value={pressure} onChange={e => setPressure(e.target.value)} error={errors.pressure} />
          <Input label="Operating Temp" unit="°C" value={temp} onChange={e => setTemp(e.target.value)} error={errors.temp} />
          
          <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-4">
            <Input label="Gas Density" unit="kg/m³" value={gasRho} onChange={e => setGasRho(e.target.value)} error={errors.gasRho} />
            <Input label="Liquid Density" unit="kg/m³" value={liqRho} onChange={e => setLiqRho(e.target.value)} error={errors.liqRho} />
            <Input label="Liquid Retention Time" unit="min" value={retentionTime} onChange={e => setRetentionTime(e.target.value)} error={errors.retentionTime} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResultCard 
              title="Diameter (ID)" 
              value={diameter.toFixed(2)} 
              unit="m" 
              subtext="Minimum Required"
            />
            <ResultCard 
              title="Height (T/T)" 
              value={height.toFixed(2)} 
              unit="m" 
              subtext="Seam to Seam"
            />
            <ResultCard 
              title="Slenderness Ratio" 
              value={slenderness.toFixed(1)} 
              subtext={slenderness > 4 ? "Tall Column" : "Standard (2.5 - 4)"}
            />
            <ResultCard 
              title="Gas Velocity" 
              value={vGas.toFixed(2)} 
              unit="m/s" 
              subtext={`Limit: ${vGasMax.toFixed(2)} m/s`}
            />
          </div>

          <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 rounded-xl">
            <h4 className="font-semibold mb-4">Vessel Dimensions</h4>
            <div className="flex items-center justify-between text-lg font-mono border-b border-slate-700 pb-4 mb-4">
              <span>Recommended Size</span>
              <span className="text-green-400">{diameter.toFixed(2)}m ID x {height.toFixed(2)}m T/T</span>
            </div>
            <p className="text-sm text-slate-400">
              Sizing based on GPSA terminal velocity for gas separation and liquid retention volume. 
              Includes allowance for mist eliminator (0.3m) and disengagement height (1.0m or 1D).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
