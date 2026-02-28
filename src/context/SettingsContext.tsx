import React, { createContext, useContext, useState, useEffect } from 'react';

export type UnitSystem = 'SI' | 'Imperial';
export type Theme = 'light' | 'dark' | 'system';

interface AppSettings {
  unitSystem: UnitSystem;
  theme: Theme;
  precision: number;
  atmPressure: number; // in bar
  stdTemp: number; // in °C
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const defaultSettings: AppSettings = {
  unitSystem: 'SI',
  theme: 'system',
  precision: 4,
  atmPressure: 1.01325,
  stdTemp: 15,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('petrocalc-settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('petrocalc-settings', JSON.stringify(settings));
    
    const applyTheme = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      
      console.log('Applying theme:', settings.theme);
      if (settings.theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        console.log('System theme:', systemTheme);
        root.classList.add(systemTheme);
      } else {
        root.classList.add(settings.theme);
      }
    };

    applyTheme();

    // Listen for system theme changes if in system mode
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
