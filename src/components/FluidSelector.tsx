
import React, { useState } from 'react';
import { Select, Input } from './UI';
import { calculateEOS, COMPONENTS } from '../core/thermo/eos';

interface FluidSelectorProps {
  onFluidChange: (props: any) => void;
  initialTemp?: string;
  initialPressure?: string;
}

export function FluidSelector({ onFluidChange, initialTemp = '25', initialPressure = '1.013' }: FluidSelectorProps) {
  const [fluid, setFluid] = useState('Methane');
  const [temp, setTemp] = useState(initialTemp);
  const [pressure, setPressure] = useState(initialPressure);

  const handleCalculate = () => {
    try {
      const result = calculateEOS(fluid, parseFloat(temp), parseFloat(pressure));
      onFluidChange(result);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      <Select 
        label="Fluid Component" 
        options={Object.keys(COMPONENTS).map(c => ({ value: c, label: c }))}
        value={fluid}
        onChange={(e) => setFluid(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Temperature" unit="°C" value={temp} onChange={(e) => setTemp(e.target.value)} />
        <Input label="Pressure" unit="bar(a)" value={pressure} onChange={(e) => setPressure(e.target.value)} />
      </div>
      <button 
        onClick={handleCalculate}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        Calculate Properties
      </button>
    </div>
  );
}
