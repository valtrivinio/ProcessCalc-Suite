import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, Calculator, Droplets, Flame, Cylinder, 
  Activity, Wind, Gauge, ShieldAlert, Beaker, 
  ArrowRightLeft, Zap, Settings 
} from 'lucide-react';
import { cn } from '../utils/cn';

const navItems = [
  { name: 'Dashboard', path: '/', icon: Calculator },
  { name: 'Pipe Sizing', path: '/pipe-sizing', icon: Activity },
  { name: 'Heat Transfer', path: '/heat-transfer', icon: Flame },
  { name: 'Vessel Sizing', path: '/vessel-sizing', icon: Cylinder },
  { name: 'Pump Sizing', path: '/pump-sizing', icon: Droplets },
  { name: 'Compressor', path: '/compressor', icon: Wind },
  { name: 'Valves & Orifice', path: '/valves', icon: Gauge },
  { name: 'Relief Valve', path: '/relief-valve', icon: ShieldAlert },
  { name: 'Fluid Properties', path: '/fluid-properties', icon: Beaker },
  { name: 'Unit Converter', path: '/converter', icon: ArrowRightLeft },
  { name: 'Utilities', path: '/utilities', icon: Zap },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar Backdrop for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 dark:bg-slate-950 text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-slate-800",
          !isSidebarOpen && "-translate-x-full lg:w-20"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 bg-slate-950 dark:bg-black/20">
          <div className={cn("flex items-center gap-2 font-bold text-xl", !isSidebarOpen && "lg:hidden")}>
            <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center">
              <Calculator className="h-5 w-5 text-white" />
            </div>
            <span>PetroCalc</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 rounded hover:bg-slate-800 lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:block p-1 rounded hover:bg-slate-800"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100vh-4rem)]">
          <nav className="flex-1 overflow-y-auto scrollbar-thin py-4">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-blue-600 text-white" 
                          : "text-slate-400 hover:bg-slate-800 hover:text-white",
                        !isSidebarOpen && "lg:justify-center lg:px-0"
                      )}
                      title={!isSidebarOpen ? item.name : undefined}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className={cn(!isSidebarOpen && "lg:hidden")}>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-slate-800">
            <Link
              to="/settings"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                location.pathname === '/settings'
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white",
                !isSidebarOpen && "lg:justify-center lg:px-0"
              )}
              title="Settings"
            >
              <Settings className="h-5 w-5 shrink-0" />
              <span className={cn(!isSidebarOpen && "lg:hidden")}>Settings</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-slate-800 dark:text-white">
              {navItems.find(i => i.path === location.pathname)?.name || (location.pathname === '/settings' ? 'Settings' : 'Dashboard')}
            </h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
