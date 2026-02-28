import React, { useState, useEffect } from 'react';
import { SectionHeader, Input, ResultCard } from '../components/UI';
import { validateNumber, hasErrors } from '../utils/validation';
import { getSteamProperties } from '../core/thermal/steamProperties';

export default function Utilities() {
  // Steam
  const [steamLoad, setSteamLoad] = useState('1000'); // kg/h
  const [steamPressure, setSteamPressure] = useState('3.5'); // barg
  
  // Cooling Water
  const [cwFlow, setCwFlow] = useState('50'); // m3/h
  const [cwTin, setCwTin] = useState('25'); // C
  const [cwTout, setCwTout] = useState('35'); // C

  // Fuel Gas
  const [fgFlow, setFgFlow] = useState('100'); // Nm3/h
  const [lhv, setLhv] = useState('35'); // MJ/Nm3

  // Results
  const [steamDuty, setSteamDuty] = useState(0);
  const [satTemp, setSatTemp] = useState(0);
  const [cwDuty, setCwDuty] = useState(0);
  const [fgDuty, setFgDuty] = useState(0);
  
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Validation
  useEffect(() => {
    const newErrors = {
      steamLoad: validateNumber(steamLoad, 'Steam Load', { min: 0, required: true }),
      steamPressure: validateNumber(steamPressure, 'Steam Pressure', { min: 0, required: true }),
      cwFlow: validateNumber(cwFlow, 'CW Flow', { min: 0, required: true }),
      cwTin: validateNumber(cwTin, 'CW T_in', { min: 0, required: true }),
      cwTout: validateNumber(cwTout, 'CW T_out', { min: 0, required: true }),
      fgFlow: validateNumber(fgFlow, 'Fuel Gas Flow', { min: 0, required: true }),
      lhv: validateNumber(lhv, 'LHV', { min: 0, required: true }),
    };
    setErrors(newErrors);
  }, [steamLoad, steamPressure, cwFlow, cwTin, cwTout, fgFlow, lhv]);

  // Calculation
  useEffect(() => {
    if (hasErrors(errors)) return;

    // Steam Calculation
    const P_steam_abs = parseFloat(steamPressure) + 1.01325;
    const steamProps = getSteamProperties(P_steam_abs);
    const h_evap = steamProps.enthalpyEvap; // kJ/kg
    const m_steam = parseFloat(steamLoad); // kg/h
    const Q_steam_kW = (m_steam * h_evap) / 3600;
    
    setSteamDuty(Q_steam_kW);
    setSatTemp(steamProps.temperature);

    // CW Calculation
    const m_cw_kgs = parseFloat(cwFlow) * 1000 / 3600; // kg/s
    const dT_cw = parseFloat(cwTout) - parseFloat(cwTin);
    const Q_cw_kW = m_cw_kgs * 4.18 * dT_cw;
    setCwDuty(Q_cw_kW);

    // Fuel Gas Calculation
    const V_fg_Nm3s = parseFloat(fgFlow) / 3600;
    const Q_fg_kW = V_fg_Nm3s * parseFloat(lhv) * 1000; // MJ -> kJ
    setFgDuty(Q_fg_kW);

  }, [steamLoad, steamPressure, cwFlow, cwTin, cwTout, fgFlow, lhv, errors]);

  return (
    <div className="space-y-8">
      <SectionHeader 
        title="Utility Load Estimations" 
        description="Quick estimations for steam, cooling water, and fuel gas energy loads." 
      />

      <div className="grid grid-cols-1 gap-6">
        {/* Steam */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-1">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Steam Consumption</h3>
            <div className="space-y-4">
              <Input label="Steam Flow" unit="kg/h" value={steamLoad} onChange={e => setSteamLoad(e.target.value)} error={errors.steamLoad} />
              <Input label="Pressure" unit="barg" value={steamPressure} onChange={e => setSteamPressure(e.target.value)} error={errors.steamPressure} />
            </div>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResultCard 
              title="Latent Heat Duty" 
              value={steamDuty.toFixed(1)} 
              unit="kW" 
              subtext="Heating Value"
            />
            <ResultCard 
              title="Saturation Temp" 
              value={satTemp.toFixed(1)} 
              unit="°C" 
              subtext={`@ ${parseFloat(steamPressure).toFixed(1)} barg`}
            />
          </div>
        </div>

        {/* Cooling Water */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-1">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Cooling Water</h3>
            <div className="space-y-4">
              <Input label="CW Flow" unit="m³/h" value={cwFlow} onChange={e => setCwFlow(e.target.value)} error={errors.cwFlow} />
              <div className="grid grid-cols-2 gap-2">
                <Input label="T In" unit="°C" value={cwTin} onChange={e => setCwTin(e.target.value)} error={errors.cwTin} />
                <Input label="T Out" unit="°C" value={cwTout} onChange={e => setCwTout(e.target.value)} error={errors.cwTout} />
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <ResultCard 
              title="Cooling Duty" 
              value={cwDuty.toFixed(1)} 
              unit="kW" 
              subtext={`Delta T: ${(parseFloat(cwTout) - parseFloat(cwTin)).toFixed(1)} °C`}
            />
          </div>
        </div>

        {/* Fuel Gas */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-1">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Fuel Gas</h3>
            <div className="space-y-4">
              <Input label="Gas Flow" unit="Nm³/h" value={fgFlow} onChange={e => setFgFlow(e.target.value)} error={errors.fgFlow} />
              <Input label="LHV" unit="MJ/Nm³" value={lhv} onChange={e => setLhv(e.target.value)} error={errors.lhv} />
            </div>
          </div>
          <div className="lg:col-span-2">
            <ResultCard 
              title="Energy Release" 
              value={fgDuty.toFixed(1)} 
              unit="kW" 
              subtext="Based on Lower Heating Value"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
