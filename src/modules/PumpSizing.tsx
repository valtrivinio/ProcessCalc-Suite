import React, { useState, useEffect } from 'react';
import { SectionHeader, Input, ResultCard } from '../components/UI';
import { validateNumber, hasErrors } from '../utils/validation';
import {
  calculateHydraulicPower,
  calculateNPSHa,
  npshaDesignValid,
  viscosityCorrectionFactors,
  vaporPressureWaterBar,
} from '../core/rotating/pump';

export default function PumpSizing() {
  // Operating Conditions
  const [flow, setFlow] = useState('100'); // m3/h
  const [head, setHead] = useState('50'); // m
  const [density, setDensity] = useState('1000'); // kg/m3
  const [viscosity, setViscosity] = useState('1'); // cP
  const [efficiency, setEfficiency] = useState('75'); // %

  // Suction Conditions (for NPSHa)
  const [suctionPressure, setSuctionPressure] = useState('1.013'); // bar(a)
  const [vaporPressure, setVaporPressure] = useState('0.03'); // bar(a)
  const [pvFromWaterTemp, setPvFromWaterTemp] = useState(''); // °C — when set, overrides vaporPressure for Pv
  const [suctionElevation, setSuctionElevation] = useState('2'); // m
  const [suctionLosses, setSuctionLosses] = useState('0.5'); // m
  const [npshr, setNpshr] = useState(''); // m — required NPSH (optional)

  // Results
  const [hydPower, setHydPower] = useState(0);
  const [brakePower, setBrakePower] = useState(0);
  const [npsha, setNpsha] = useState(0);
  const [npshaFail, setNpshaFail] = useState<{ valid: boolean; failReason?: string }>({ valid: true });
  const [dischargePressure, setDischargePressure] = useState(0);
  const [viscosityCorrected, setViscosityCorrected] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Validation
  useEffect(() => {
    const newErrors: Record<string, string | undefined> = {
      flow: validateNumber(flow, 'Flow Rate', { min: 0, required: true }),
      head: validateNumber(head, 'Head', { min: 0, required: true }),
      density: validateNumber(density, 'Density', { min: 0.1, required: true }),
      viscosity: validateNumber(viscosity, 'Viscosity', { min: 0.001, required: true }),
      efficiency: validateNumber(efficiency, 'Pump Efficiency', { min: 1, max: 100, required: true }),
      suctionPressure: validateNumber(suctionPressure, 'Suction Pressure', { min: 0, required: true }),
      vaporPressure: validateNumber(vaporPressure, 'Vapor Pressure', { min: 0, required: true }),
    };
    if (npshr !== '') newErrors.npshr = validateNumber(npshr, 'NPSHr', { min: 0, required: false });
    setErrors(newErrors);
  }, [flow, head, density, viscosity, efficiency, suctionPressure, vaporPressure, npshr]);

  // Calculation
  useEffect(() => {
    if (hasErrors(errors)) return;

    const Q = parseFloat(flow);
    let H = parseFloat(head);
    const rho = parseFloat(density);
    const visCp = parseFloat(viscosity) || 1;
    let eff = parseFloat(efficiency) / 100;

    const { headFactor, efficiencyFactor } = viscosityCorrectionFactors(visCp);
    setViscosityCorrected(visCp > 10);
    if (visCp > 10) {
      H = H * headFactor;
      eff = eff * efficiencyFactor;
    }

    const P_s_Pa = parseFloat(suctionPressure) * 100000;
    const P_v_bar = pvFromWaterTemp !== '' && !isNaN(parseFloat(pvFromWaterTemp))
      ? vaporPressureWaterBar(parseFloat(pvFromWaterTemp))
      : parseFloat(vaporPressure);
    const P_v_Pa = P_v_bar * 100000;
    const h_static = parseFloat(suctionElevation) || 0;
    const h_loss = parseFloat(suctionLosses) || 0;

    const NPSHa = calculateNPSHa(P_s_Pa, P_v_Pa, rho, h_static, h_loss);
    setNpsha(NPSHa);

    const npshrVal = npshr !== '' ? parseFloat(npshr) : undefined;
    setNpshaFail(npshaDesignValid(NPSHa, npshrVal));

    const P_hyd = calculateHydraulicPower(Q, H, rho);
    setHydPower(P_hyd);
    setBrakePower(eff > 0 ? P_hyd / eff : 0);

    const P_d_Pa = P_s_Pa + (rho * 9.81 * H);
    setDischargePressure(P_d_Pa / 100000);
  }, [flow, head, density, viscosity, efficiency, suctionPressure, vaporPressure, pvFromWaterTemp, suctionElevation, suctionLosses, npshr, errors]);

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
          <Input label="Viscosity" unit="cP" value={viscosity} onChange={e => setViscosity(e.target.value)} error={errors.viscosity} placeholder=">10 cP applies correction" />
          <Input label="Pump Efficiency" unit="%" value={efficiency} onChange={e => setEfficiency(e.target.value)} error={errors.efficiency} />
          <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Suction Conditions (NPSH)</h4>
            <Input label="Suction Pressure" unit="bar(a)" value={suctionPressure} onChange={e => setSuctionPressure(e.target.value)} error={errors.suctionPressure} />
            <Input label="Vapor Pressure" unit="bar(a)" value={vaporPressure} onChange={e => setVaporPressure(e.target.value)} error={errors.vaporPressure} disabled={pvFromWaterTemp !== ''} />
            <Input label="Or Pv from water temp" unit="°C" value={pvFromWaterTemp} onChange={e => setPvFromWaterTemp(e.target.value)} placeholder="e.g. 25 → Pv from Antoine" />
            <Input label="Static Head (Suction)" unit="m (+/-)" value={suctionElevation} onChange={e => setSuctionElevation(e.target.value)} placeholder="Height above pump CL" />
            <Input label="Suction Line Losses" unit="m" value={suctionLosses} onChange={e => setSuctionLosses(e.target.value)} />
            <Input label="NPSH required (NPSHr)" unit="m" value={npshr} onChange={e => setNpshr(e.target.value)} error={errors.npshr} placeholder="Optional — fail if NPSHa < NPSHr" />
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
              subtext={!npshaFail.valid ? 'FAIL' : npsha < 1 ? '⚠️ Critical' : 'Margin OK'}
            />
            <ResultCard 
              title="Discharge Pressure" 
              value={dischargePressure.toFixed(2)} 
              unit="bar(a)" 
              subtext="Estimated"
            />
          </div>
          
          {!npshaFail.valid && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
              <h4 className="text-red-800 dark:text-red-200 font-bold flex items-center gap-2">
                ❌ Design invalid — do not accept
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{npshaFail.failReason}</p>
            </div>
          )}
          {npshaFail.valid && npsha < 3 && npsha >= 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
              <h4 className="text-amber-800 dark:text-amber-200 font-bold flex items-center gap-2">
                ⚠️ Low NPSH Available
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                NPSHa is {npsha.toFixed(2)} m. Ensure Pump NPSHr is at least 0.5 m lower to prevent cavitation.
              </p>
            </div>
          )}
          {viscosityCorrected && (
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Viscosity &gt; 10 cP: head and efficiency corrected per Hydraulic Institute style. Power and NPSHa use corrected values.
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
