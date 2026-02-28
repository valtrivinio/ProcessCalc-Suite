import React from 'react';
import { SectionHeader } from '../components/UI';
import { Link } from 'react-router-dom';
import { Activity, Flame, Cylinder, Droplets, Wind, Gauge, ShieldAlert, Beaker, ArrowRightLeft, Zap } from 'lucide-react';

const tools = [
  { name: 'Pipe Sizing', path: '/pipe-sizing', icon: Activity, desc: 'Velocity, dP, Reynolds No.' },
  { name: 'Heat Transfer', path: '/heat-transfer', icon: Flame, desc: 'Exchanger duty, LMTD' },
  { name: 'Vessel Sizing', path: '/vessel-sizing', icon: Cylinder, desc: 'Separators & KO Drums' },
  { name: 'Pump Sizing', path: '/pump-sizing', icon: Droplets, desc: 'Power, Head, NPSH' },
  { name: 'Compressor', path: '/compressor', icon: Wind, desc: 'Power estimation, Discharge T' },
  { name: 'Valves & Orifice', path: '/valves', icon: Gauge, desc: 'Cv, Flow sizing' },
  { name: 'Relief Valve', path: '/relief-valve', icon: ShieldAlert, desc: 'API 520 Sizing' },
  { name: 'Fluid Properties', path: '/fluid-properties', icon: Beaker, desc: 'Density, SG, API' },
  { name: 'Unit Converter', path: '/converter', icon: ArrowRightLeft, desc: 'O&G specific units' },
  { name: 'Utilities', path: '/utilities', icon: Zap, desc: 'Steam, Cooling Water' },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight sm:text-4xl">PetroCalc Suite</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          Professional engineering calculation tools for the Oil & Gas industry.
          Select a module to begin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link 
            key={tool.path} 
            to={tool.path}
            className="group relative flex flex-col items-start p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200"
          >
            <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <tool.icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {tool.name}
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {tool.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
