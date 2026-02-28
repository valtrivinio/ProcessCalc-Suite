import React, { useState } from 'react';
import { SectionHeader, Input, ResultCard } from '../components/UI';
import { validateNumber } from '../utils/validation';
import { FluidSelector } from '../components/FluidSelector';

export default function FluidProperties() {
  // API <-> SG
  const [api, setApi] = useState<string>('');
  const [sg, setSg] = useState<string>('');
  const [gasSg, setGasSg] = useState<string>('');
  
  // Flash Results
  const [flashResult, setFlashResult] = useState<any>(null);
  
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Calculations
  const calculateSG = (apiVal: string) => {
    if (!apiVal) {
      setSg('');
      return;
    }
    const val = parseFloat(apiVal);
    if (isNaN(val)) return;
    const res = 141.5 / (val + 131.5);
    setSg(res.toFixed(4));
  };

  const calculateAPI = (sgVal: string) => {
    if (!sgVal) {
      setApi('');
      return;
    }
    const val = parseFloat(sgVal);
    if (isNaN(val) || val <= 0) return;
    const res = (141.5 / val) - 131.5;
    setApi(res.toFixed(2));
  };

  const handleApiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApi(val);
    calculateSG(val);
  };

  const handleSgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSg(val);
    calculateAPI(val);
  };

  const handleGasSgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGasSg(e.target.value);
  };

  // Water density at 60F approx 999 kg/m3
  const waterDensity = 999.0; 
  const calculatedDensity = (sg && !isNaN(parseFloat(sg))) ? (parseFloat(sg) * waterDensity).toFixed(1) : '-';
  
  // Gas MW
  const gasMw = (gasSg && !isNaN(parseFloat(gasSg))) ? (parseFloat(gasSg) * 28.96).toFixed(2) : '-';

  return (
    <div className="space-y-8">
      <SectionHeader 
        title="Fluid Properties & Flash" 
        description="Calculate thermodynamic properties using EOS and standard correlations." 
      />

      {/* EOS Flash Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Component Property Flash (Peng-Robinson)</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <FluidSelector 
              onFluidChange={(props) => setFlashResult(props)}
              initialTemp="25"
              initialPressure="1.013"
            />
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Calculated Properties</h4>
            <div className="grid grid-cols-2 gap-4">
              <ResultCard title="Phase" value={flashResult?.phase || '-'} />
              <ResultCard title="Density" value={flashResult?.density.toFixed(2) || '-'} unit="kg/m³" />
              <ResultCard title="Viscosity" value={flashResult?.viscosity.toFixed(3) || '-'} unit="cP" />
              <ResultCard title="Z-Factor" value={flashResult?.compressibility.toFixed(4) || '-'} />
              <ResultCard title="Mol. Weight" value={flashResult?.molecularWeight.toFixed(2) || '-'} unit="g/mol" />
              <ResultCard title="Enthalpy" value={flashResult?.enthalpy ? (flashResult.enthalpy/1000).toFixed(2) : '-'} unit="kJ/kg" subtext="Ideal Gas Ref" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* API <-> SG Converter */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">API Gravity ↔ Specific Gravity</h3>
          <div className="space-y-4">
            <Input 
              label="API Gravity" 
              value={api} 
              onChange={handleApiChange}
              type="number"
              placeholder="e.g. 35"
            />
            <div className="flex justify-center text-slate-400 dark:text-slate-500">
              <span className="text-sm">⇅</span>
            </div>
            <Input 
              label="Specific Gravity (SG) @ 60°F" 
              value={sg} 
              onChange={handleSgChange}
              type="number"
              step="0.0001"
              placeholder="e.g. 0.85"
            />
          </div>
          
          <div className="mt-6 rounded-lg bg-slate-50 dark:bg-slate-900 p-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Derived Properties</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Density (Water=1)</span>
                <span className="font-mono text-lg font-semibold text-slate-900 dark:text-white">{sg || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Density @ 60°F</span>
                <span className="font-mono text-lg font-semibold text-slate-900 dark:text-white">{calculatedDensity} <span className="text-sm font-sans text-slate-400 dark:text-slate-500">kg/m³</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Gas MW Estimation */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Gas Properties</h3>
          <div className="space-y-4">
            <Input 
              label="Gas Specific Gravity (Air=1)" 
              type="number"
              placeholder="e.g. 0.65"
              value={gasSg}
              onChange={handleGasSgChange}
            />
            
            <div className="mt-6 rounded-lg bg-slate-50 dark:bg-slate-900 p-4">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Estimated Molecular Weight</h4>
              <div>
                <span className="font-mono text-2xl font-semibold text-slate-900 dark:text-white">{gasMw}</span>
                <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">g/mol</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Assumes Air MW = 28.96 g/mol</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
