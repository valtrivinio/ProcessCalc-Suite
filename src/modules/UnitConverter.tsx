import React, { useState, useMemo } from 'react';
import { SectionHeader } from '../components/UI';
import { CONVERSION_DATA, convertUnit } from '../core/utils/unitConversion';

export default function UnitConverter() {
  const [value, setValue] = useState<string>('1');
  const [category, setCategory] = useState<string>('flow');
  const [fromUnit, setFromUnit] = useState<string>('bbl/d');
  const [toUnit, setToUnit] = useState<string>('m3/h');

  // Get current category data
  const currentCategory = CONVERSION_DATA[category];
  const unitKeys = useMemo(() => Object.keys(currentCategory.units), [currentCategory]);

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const newUnits = Object.keys(CONVERSION_DATA[newCat].units);
    // Set sensible defaults: first and second unit, or first and first if only one exists
    setFromUnit(newUnits[0]);
    setToUnit(newUnits[1] || newUnits[0]);
  };

  const calculate = (): string => {
    if (!value) return '-';
    const val = parseFloat(value);
    if (isNaN(val)) return '-';

    const result = convertUnit(val, fromUnit, toUnit, category);

    // Formatting
    if (Math.abs(result) < 1e-6 || Math.abs(result) > 1e6) {
      return result.toExponential(4);
    }
    return result.toPrecision(6);
  };

  return (
    <div className="space-y-8">
      <SectionHeader 
        title="Engineering Unit Converter" 
        description="Comprehensive unit conversion for Oil & Gas engineering parameters." 
      />

      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 lg:p-8">
        
        {/* Category Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CONVERSION_DATA).map(([key, data]) => (
              <button
                key={key}
                onClick={() => handleCategoryChange(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  category === key 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {data.label}
              </button>
            ))}
          </div>
        </div>

        {/* Converter Interface */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-6 items-start">
          
          {/* FROM Section */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-700">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">From</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter value..."
              className="block w-full rounded-lg border-slate-300 dark:border-slate-600 py-3 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg bg-white dark:bg-slate-800"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="block w-full rounded-lg border-slate-300 dark:border-slate-600 py-2.5 text-slate-700 dark:text-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-slate-800"
            >
              {unitKeys.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Arrow Icon */}
          <div className="flex justify-center md:pt-12 text-slate-400 dark:text-slate-500">
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>

          {/* TO Section */}
          <div className="space-y-4 bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800">
            <label className="block text-sm font-semibold text-blue-900 dark:text-blue-300 uppercase tracking-wider">To</label>
            <div className="flex items-center w-full rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 py-3 px-4 text-blue-900 dark:text-blue-300 shadow-sm text-lg font-mono font-bold min-h-[54px] overflow-x-auto">
              {calculate()}
            </div>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="block w-full rounded-lg border-blue-200 dark:border-blue-700 py-2.5 text-blue-900 dark:text-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-slate-800"
            >
              {unitKeys.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Info Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            1 {fromUnit} = {(convertUnit(1, fromUnit, toUnit, category)).toPrecision(6)} {toUnit} (approx)
          </p>
        </div>
      </div>
    </div>
  );
}
