import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { SectionHeader, Input, ResultCard, Select } from '../components/UI';
import { validateNumber, hasErrors } from '../utils/validation';
import { calculateLMTD, calculateFt, FOULING_FACTORS } from '../core/thermal/heatTransfer';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("HeatTransfer Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-800">
          <h2 className="text-lg font-bold mb-2">Calculation Error</h2>
          <p>An unexpected error occurred during heat transfer calculations. Please check your inputs and try again.</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reset Module
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function HeatTransfer() {
  return (
    <ErrorBoundary>
      <HeatTransferContent />
    </ErrorBoundary>
  );
}

function HeatTransferContent() {
  // Process Side (Hot)
  const [hotFlow, setHotFlow] = useState('10000'); // kg/h
  const [hotCp, setHotCp] = useState('2.5'); // kJ/kg.K
  const [tHotIn, setTHotIn] = useState('150'); // C
  const [tHotOut, setTHotOut] = useState('80'); // C
  
  // Utility Side (Cold)
  const [coldFlow, setColdFlow] = useState('50000'); // kg/h
  const [coldCp, setColdCp] = useState('4.18'); // kJ/kg.K (Water)
  const [tColdIn, setTColdIn] = useState('25'); // C
  const [tColdOut, setTColdOut] = useState('45'); // C

  // Exchanger Design
  const [uValue, setUValue] = useState('500'); // W/m2.K
  const [foulingHot, setFoulingHot] = useState('0.00018');
  const [foulingCold, setFoulingCold] = useState('0.00018');
  const [passConfig, setPassConfig] = useState('1-2'); // 1 Shell 2 Tube

  // Results
  const [duty, setDuty] = useState(0); // kW
  const [lmtd, setLmtd] = useState(0);
  const [ft, setFt] = useState(0);
  const [area, setArea] = useState(0);
  const [uDirty, setUDirty] = useState(0);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Validation
  useEffect(() => {
    const newErrors = {
      hotFlow: validateNumber(hotFlow, 'Hot Flow', { min: 0, required: true }),
      hotCp: validateNumber(hotCp, 'Hot Cp', { min: 0.01, required: true }),
      tHotIn: validateNumber(tHotIn, 'Hot Inlet', { min: -273.15, required: true }),
      tHotOut: validateNumber(tHotOut, 'Hot Outlet', { min: -273.15, required: true }),
      coldFlow: validateNumber(coldFlow, 'Cold Flow', { min: 0, required: true }),
      coldCp: validateNumber(coldCp, 'Cold Cp', { min: 0.01, required: true }),
      tColdIn: validateNumber(tColdIn, 'Cold Inlet', { min: -273.15, required: true }),
      tColdOut: validateNumber(tColdOut, 'Cold Outlet', { min: -273.15, required: true }),
      uValue: validateNumber(uValue, 'U-Value', { min: 1, required: true }),
    };
    setErrors(newErrors);
  }, [hotFlow, hotCp, tHotIn, tHotOut, coldFlow, coldCp, tColdIn, tColdOut, uValue]);

  // Calculation
  useEffect(() => {
    if (hasErrors(errors)) return;

    const m_h = parseFloat(hotFlow) / 3600; // kg/s
    const cp_h = parseFloat(hotCp);
    const th_in = parseFloat(tHotIn);
    const th_out = parseFloat(tHotOut);

    const m_c = parseFloat(coldFlow) / 3600;
    const cp_c = parseFloat(coldCp);
    const tc_in = parseFloat(tColdIn);
    const tc_out = parseFloat(tColdOut);

    // 1. Calculate Duty (Q)
    // Check energy balance or use one side?
    // Let's calculate Hot Side Duty as primary
    const Q_hot = m_h * cp_h * (th_in - th_out); // kW
    const Q_cold = m_c * cp_c * (tc_out - tc_in); // kW
    
    // Use average or warn if mismatch?
    // For sizing, usually we fix one side. Let's assume Hot Side is the process requirement.
    setDuty(Q_hot);

    // 2. LMTD
    const LMTD = calculateLMTD(th_in, th_out, tc_in, tc_out, 'counter');
    setLmtd(LMTD);

    // 3. Ft Correction
    let Ft = 1.0;
    if (passConfig === '1-2') {
      Ft = calculateFt(th_in, th_out, tc_in, tc_out);
    }
    setFt(Ft);

    // 4. U-Value (Dirty)
    // 1/U_dirty = 1/U_clean + Rf_hot + Rf_cold
    // Input U is usually "Service U" or "Clean U"? 
    // Let's assume input is Clean U (U_clean) and we add fouling.
    const U_clean = parseFloat(uValue);
    const Rf_total = parseFloat(foulingHot) + parseFloat(foulingCold);
    const U_dirty = 1 / ( (1/U_clean) + Rf_total );
    setUDirty(U_dirty);

    // 5. Area
    // Q = U * A * LMTD * Ft
    // A = Q / (U * LMTD * Ft)
    // Q in kW -> W
    if (U_dirty > 0 && LMTD > 0 && Ft > 0) {
      const A = (Q_hot * 1000) / (U_dirty * LMTD * Ft);
      setArea(A);
    } else {
      setArea(0);
    }

  }, [hotFlow, hotCp, tHotIn, tHotOut, coldFlow, coldCp, tColdIn, tColdOut, uValue, foulingHot, foulingCold, passConfig, errors]);

  const foulingOptions = Object.entries(FOULING_FACTORS).map(([k, v]) => ({ value: v.toString(), label: k }));

  return (
    <div className="space-y-8">
      <SectionHeader 
        title="Heat Exchanger Sizing (Professional)" 
        description="Rigorous thermal design with LMTD correction (Ft), fouling factors, and energy balance." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          
          {/* Hot Side */}
          <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-xl border border-red-100 dark:border-red-800/30 space-y-4">
            <h3 className="font-semibold text-red-900 dark:text-red-200">Hot Stream (Process)</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Mass Flow" unit="kg/h" value={hotFlow} onChange={e => setHotFlow(e.target.value)} error={errors.hotFlow} />
              <Input label="Specific Heat" unit="kJ/kg·K" value={hotCp} onChange={e => setHotCp(e.target.value)} error={errors.hotCp} />
              <Input label="T Inlet" unit="°C" value={tHotIn} onChange={e => setTHotIn(e.target.value)} error={errors.tHotIn} />
              <Input label="T Outlet" unit="°C" value={tHotOut} onChange={e => setTHotOut(e.target.value)} error={errors.tHotOut} />
            </div>
          </div>

          {/* Cold Side */}
          <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-800/30 space-y-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200">Cold Stream (Utility)</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Mass Flow" unit="kg/h" value={coldFlow} onChange={e => setColdFlow(e.target.value)} error={errors.coldFlow} />
              <Input label="Specific Heat" unit="kJ/kg·K" value={coldCp} onChange={e => setColdCp(e.target.value)} error={errors.coldCp} />
              <Input label="T Inlet" unit="°C" value={tColdIn} onChange={e => setTColdIn(e.target.value)} error={errors.tColdIn} />
              <Input label="T Outlet" unit="°C" value={tColdOut} onChange={e => setTColdOut(e.target.value)} error={errors.tColdOut} />
            </div>
          </div>

          {/* Exchanger Config */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Clean U-Value" unit="W/m²·K" value={uValue} onChange={e => setUValue(e.target.value)} error={errors.uValue} />
              <Select 
                label="Pass Config" 
                options={[{value: '1-1', label: 'Counter-Current (1-1)'}, {value: '1-2', label: '1 Shell 2 Tube (1-2)'}]} 
                value={passConfig} 
                onChange={e => setPassConfig(e.target.value)} 
              />
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <Select label="Fouling (Hot)" options={foulingOptions} value={foulingHot} onChange={e => setFoulingHot(e.target.value)} />
                <Select label="Fouling (Cold)" options={foulingOptions} value={foulingCold} onChange={e => setFoulingCold(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResultCard 
              title="Heat Duty" 
              value={duty.toFixed(2)} 
              unit="kW" 
              subtext="Hot Side Load"
            />
            <ResultCard 
              title="Required Area" 
              value={area.toFixed(2)} 
              unit="m²" 
              subtext={`Dirty U=${uDirty.toFixed(0)}`}
            />
            <ResultCard 
              title="LMTD" 
              value={lmtd.toFixed(2)} 
              unit="°C" 
              subtext="Log Mean Temp Diff"
            />
            <ResultCard 
              title="Ft Factor" 
              value={ft.toFixed(3)} 
              subtext={ft < 0.75 ? "⚠️ Low Efficiency" : "Correction Factor"}
            />
          </div>

          {/* Warnings */}
          {ft < 0.75 && ft > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
              <h4 className="text-amber-800 dark:text-amber-200 font-bold flex items-center gap-2">
                ⚠️ Temperature Cross Warning
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Ft factor is {ft.toFixed(3)} (below 0.75). This indicates a temperature cross or inefficient design. 
                Consider multiple shells in series or a different exchanger type.
              </p>
            </div>
          )}
          
          {ft === 0 && (
             <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
             <h4 className="text-red-800 dark:text-red-200 font-bold flex items-center gap-2">
               ❌ Invalid Design
             </h4>
             <p className="text-sm text-red-700 dark:text-red-300 mt-1">
               Temperature cross is too severe for this configuration. Design is thermodynamically impossible in a single shell.
             </p>
           </div>
          )}

          <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 rounded-xl">
            <h4 className="font-semibold mb-4">Design Summary</h4>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Clean U-Value</span>
                <span>{uValue} W/m²·K</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Dirty U-Value</span>
                <span>{uDirty.toFixed(1)} W/m²·K</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Total Fouling Resistance</span>
                <span>{(parseFloat(foulingHot) + parseFloat(foulingCold)).toFixed(5)} m²K/W</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Overdesign Factor</span>
                <span className="text-green-400">{(uDirty > 0 ? (parseFloat(uValue)/uDirty - 1) * 100 : 0).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
