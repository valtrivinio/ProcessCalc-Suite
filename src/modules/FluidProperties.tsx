import React, { useState } from 'react';
import { SectionHeader, Input, ResultCard, Select } from '../components/UI';
import { validateNumber } from '../utils/validation';
import { PengRobinson } from '../core/thermal/eos';

const COMPONENTS = {
  Methane: { Tc: 190.56, Pc: 45.99, omega: 0.011, MW: 16.04 },
  Ethane: { Tc: 305.32, Pc: 48.72, omega: 0.099, MW: 30.07 },
  Propane: { Tc: 369.83, Pc: 42.48, omega: 0.152, MW: 44.1 },
  Butane: { Tc: 425.12, Pc: 37.96, omega: 0.2, MW: 58.12 },
  Pentane: { Tc: 469.7, Pc: 33.7, omega: 0.251, MW: 72.15 },
  Hexane: { Tc: 507.6, Pc: 30.25, omega: 0.301, MW: 86.18 },
  Nitrogen: { Tc: 126.2, Pc: 33.9, omega: 0.037, MW: 28.01 },
  CO2: { Tc: 304.1, Pc: 73.8, omega: 0.224, MW: 44.01 },
  Water: { Tc: 647.1, Pc: 220.6, omega: 0.344, MW: 18.02 },
};

export default function FluidProperties() {
  const [component, setComponent] = useState('Methane');
  const [temperature, setTemperature] = useState('25');
  const [pressure, setPressure] = useState('1.013');
  const [result, setResult] = useState<any>(null);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs: any = {};
    errs.temp = validateNumber(parseFloat(temperature), 'Temperature', { min: -273.15, required: true });
    errs.pressure = validateNumber(parseFloat(pressure), 'Pressure', { min: 0, required: true });
    setErrors(errs);
    return !Object.values(errs).some(e => e !== null);
  };

  const calculate = () => {
    if (!validate()) return;
    const comp = COMPONENTS[component as keyof typeof COMPONENTS];
    if (!comp) return;
    const eos = new PengRobinson();
    const result = eos.calculate(
      [{ component: comp, moleFraction: 1 }],
      parseFloat(temperature),
      parseFloat(pressure)
    );
    setResult(result);
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Fluid Properties & Flash" />
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Component Property Flash (Peng-Robinson)</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Select
              label="Fluid Component"
              options={Object.keys(COMPONENTS).map(key => ({ value: key, label: key }))}
              value={component}
              onChange={e => setComponent(e.target.value)}
            />
            <Input
              label="Temperature"
              unit="°C"
              value={temperature}
              onChange={e => setTemperature(e.target.value)}
              error={errors.temp}
            />
            <Input
              label="Pressure"
              unit="bar(a)"
              value={pressure}
              onChange={e => setPressure(e.target.value)}
              error={errors.pressure}
            />
            <button
              onClick={calculate}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Calculate Properties
            </button>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Calculated Properties</h4>
            <div className="grid grid-cols-2 gap-4">
              <ResultCard title="Phase" value={result?.phase || '-'} />
              <ResultCard title="Density" value={result?.density ? result.density.toFixed(2) : '-'} unit="kg/m³" />
              <ResultCard title="Viscosity" value={result?.viscosity ? result.viscosity.toFixed(3) : '-'} unit="cP" />
              <ResultCard title="Z-Factor" value={result?.compressibility ? result.compressibility.toFixed(4) : '-'} />
              <ResultCard title="Mol. Weight" value={result?.molecularWeight ? result.molecularWeight.toFixed(2) : '-'} unit="g/mol" />
              <ResultCard title="Enthalpy" value={result?.enthalpy ? (result.enthalpy / 1e3).toFixed(2) : '-'} unit="kJ/kg" subtext="Ideal Gas Ref" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
