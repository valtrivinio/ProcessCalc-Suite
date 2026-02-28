import React, { useState, useEffect } from 'react';
import { SectionHeader, Input, ResultCard } from '../components/UI';
import { validateNumber, hasErrors } from '../utils/validation';
import { calculateHydraulicPower, calculateNPSHa } from '../core/rotating/pump';

export default function PumpSizing() {
  // Operating Conditions
  const [flow, setFlow] = useState('100'); // m3/h
  const [head, setHead] = useState('50'); // m
  const [density, setDensity] = useState('1000'); // kg/m3
  const [efficiency, setEfficiency] = useState('75'); // %
  
  // Suction Conditions (for NPSHa)
  const [suctionPressure, setSuctionPressure] = useState('1.013'); // bar(a)
  const [vaporPressure, setVaporPressure] = useState('0.03'); // bar(a) (Water @ 25C)
  const [suctionElevation, setSuctionElevation] = useState('2'); // m (above pump CL)
  const [suctionLosses, setSuctionLosses] = useState('0.5'); // m

  // Results
  const [hydPower, setHydPower] = useState(0);
  const [brakePower, setBrakePower] = useState(0);
  const [npsha, setNpsha] = useState(0);
  const [dischargePressure, setDischargePressure] = useState(0);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Validation
  useEffect(() => {
    const newErrors = {
      flow: validateNumber(flow, 'Flow Rate', { min: 0, required: true }),
      head: validateNumber(head, 'Head', { min: 0, required: true }),
      density: validateNumber(density, 'Density', { min: 0.1, required: true }),
      efficiency: validateNumber(efficiency, 'Pump Efficiency', { min: 1, max: 100, required: true }),
      suctionPressure: validateNumber(suctionPressure, 'Suction Pressure', { min: 0, required: true }),
      vaporPressure: validateNumber(vaporPressure, 'Vapor Pressure', { min: 0, required: true }),
    };
    setErrors(newErrors);
  }, [flow, head, density, efficiency, suctionPressure, vaporPressure]);

  // Calculation
  useEffect(() => {
    if (hasErrors(errors)) return;

    const Q = parseFloat(flow);
    const H = parseFloat(head);
    const rho = parseFloat(density);
    const eff = parseFloat(efficiency) / 100;
    
    // Power
    const P_hyd = calculateHydraulicPower(Q, H, rho);
    setHydPower(P_hyd);
    setBrakePower(eff > 0 ? P_hyd / eff : 0);

    // NPSHa
    // P_suction_abs (Pa)
    const P_s_Pa = parseFloat(suctionPressure) * 100000;
    const P_v_Pa = parseFloat(vaporPressure) * 100000;
    const h_static = parseFloat(suctionElevation);
    const h_loss = parseFloat(suctionLosses);

    const NPSHa = calculateNPSHa(P_s_Pa, P_v_Pa, rho, h_static, h_loss);
    setNpsha(NPSHa);

    // Discharge Pressure
    // P_d = P_s + (rho * g * H)
    const P_d_Pa = P_s_Pa + (rho * 9.81 * H);
    setDischargePressure(P_d_Pa / 100000); // bar(a)

  }, [flow, head, density, efficiency, suctionPressure, vaporPressure, suctionElevation, suctionLosses, errors]);

  return (
    <div className="space-y-8">
      <SectionHeader 
        title="Pump Sizing (Professional)" 
        description="Hydraulic power, Brake Horsepower, and NPSHa calculation." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <h3 className="font-semibold text-slate-900 dark:text-white">Operating Conditions</h3>
          <Input label="Flow Rate" unit="m³/h" value={flow} onChange={e => setFlow(e.target.value)} error={errors.flow} />
          <Input label="Differential Head" unit="m" value={head} onChange={e => setHead(e.target.value)} error={errors.head} />
          <Input label="Fluid Density" unit="kg/m³" value={density} onChange={e => setDensity(e.target.value)} error={errors.density} />
          <Input label="Pump Efficiency" unit="%" value={efficiency} onChange={e => setEfficiency(e.target.value)} error={errors.efficiency} />
          
          <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Suction Conditions (NPSH)</h4>
            <Input label="Suction Pressure" unit="bar(a)" value={suctionPressure} onChange={e => setSuctionPressure(e.target.value)} error={errors.suctionPressure} />
            <Input label="Vapor Pressure" unit="bar(a)" value={vaporPressure} onChange={e => setVaporPressure(e.target.value)} error={errors.vaporPressure} />
            <Input label="Static Head (Suction)" unit="m (+/-)" value={suctionElevation} onChange={e => setSuctionElevation(e.target.value)} placeholder="Height above pump CL" />
            <Input label="Suction Line Losses" unit="m" value={suctionLosses} onChange={e => setSuctionLosses(e.target.value)} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResultCard 
              title="Hydraulic Power" 
              value={hydPower.toFixed(2)} 
              unit="kW" 
              subtext="Fluid Power"
            />
            <ResultCard 
              title="Brake Power (Shaft)" 
              value={brakePower.toFixed(2)} 
              unit="kW" 
              subtext={`@ ${efficiency}% Eff`}
            />
            <ResultCard 
              title="NPSH Available" 
              value={npsha.toFixed(2)} 
              unit="m" 
              subtext={npsha < 1 ? "⚠️ Critical Cavitation Risk" : "Margin Check Required"}
            />
            <ResultCard 
              title="Discharge Pressure" 
              value={dischargePressure.toFixed(2)} 
              unit="bar(a)" 
              subtext="Estimated"
            />
          </div>
          
          {npsha < 3 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
              <h4 className="text-amber-800 dark:text-amber-200 font-bold flex items-center gap-2">
                ⚠️ Low NPSH Available
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                NPSHa is {npsha.toFixed(2)} m. Ensure Pump NPSHr is at least 0.5m lower (NPSHr &lt; {(npsha - 0.5).toFixed(2)} m) to prevent cavitation damage.
              </p>
            </div>
          )}

          <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 rounded-xl">
            <h4 className="font-semibold mb-4">Pump Performance Summary</h4>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Mass Flow</span>
                <span>{((parseFloat(flow) * parseFloat(density))/1000).toFixed(1)} tonne/h</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Differential Pressure</span>
                <span>{((dischargePressure - parseFloat(suctionPressure))).toFixed(2)} bar</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Estimated Motor Size</span>
                <span className="text-green-400">{(brakePower * 1.1).toFixed(1)} kW (w/ 10% margin)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
