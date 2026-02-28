import React from 'react';
import { SectionHeader, Input, Select } from '../components/UI';
import { useSettings, Theme, UnitSystem } from '../context/SettingsContext';
import { Moon, Sun, Monitor, Ruler, Globe, Save } from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <SectionHeader 
        title="Application Settings" 
        description="Configure units, display preferences, and standard conditions." 
      />

      <div className="grid grid-cols-1 gap-8">
        
        {/* Appearance */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
              <Monitor className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Appearance</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['light', 'dark', 'system'] as Theme[]).map((theme) => (
              <button
                key={theme}
                onClick={() => updateSettings({ theme })}
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border transition-all ${
                  settings.theme === theme
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {theme === 'light' && <Sun className="h-4 w-4" />}
                {theme === 'dark' && <Moon className="h-4 w-4" />}
                {theme === 'system' && <Monitor className="h-4 w-4" />}
                <span className="capitalize">{theme}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Units & Precision */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg text-green-600 dark:text-green-300">
              <Ruler className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Units & Precision</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Preferred Unit System
              </label>
              <div className="flex rounded-md shadow-sm" role="group">
                {(['SI', 'Imperial'] as UnitSystem[]).map((sys) => (
                  <button
                    key={sys}
                    onClick={() => updateSettings({ unitSystem: sys })}
                    className={`flex-1 px-4 py-2 text-sm font-medium border first:rounded-l-lg last:rounded-r-lg ${
                      settings.unitSystem === sys
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {sys}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Sets default units for new calculations. Existing inputs are not converted automatically.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Result Precision
              </label>
              <select
                value={settings.precision}
                onChange={(e) => updateSettings({ precision: parseInt(e.target.value) })}
                className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-slate-700"
              >
                {[2, 3, 4, 5, 6].map((p) => (
                  <option key={p} value={p}>{p} Decimal Places</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Standard Conditions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg text-purple-600 dark:text-purple-300">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Standard Conditions</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Atmospheric Pressure (bar)" 
              type="number"
              step="0.00001"
              value={settings.atmPressure}
              onChange={(e) => updateSettings({ atmPressure: parseFloat(e.target.value) })}
            />
            <Input 
              label="Standard Temperature (°C)" 
              type="number"
              value={settings.stdTemp}
              onChange={(e) => updateSettings({ stdTemp: parseFloat(e.target.value) })}
            />
          </div>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Used for gas volume conversions (Sm³ ↔ Nm³).
          </p>
        </div>

      </div>
    </div>
  );
}
