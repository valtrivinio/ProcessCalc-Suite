import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'enginuitypro_workspace';

export function useWorkspace<T>(
  moduleId: string,
  defaultState: T,
  version: string = '1.0'
): [T, (newState: T) => void, () => void] {
  const [state, setState] = useState<T>(defaultState);

  // Load on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const workspace = JSON.parse(raw);
      if (workspace.version === version && workspace[moduleId]) {
        setState(workspace[moduleId]);
      }
    } catch (_) { /* ignore */ }
  }, [moduleId, version]);

  // Save on change
  const save = useCallback((newState: T) => {
    setState(newState);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const workspace = raw ? JSON.parse(raw) : { version };
      workspace[moduleId] = newState;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch (_) { /* ignore */ }
  }, [moduleId, version]);

  const reset = useCallback(() => {
    setState(defaultState);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const workspace = JSON.parse(raw);
        delete workspace[moduleId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
      }
    } catch (_) { /* ignore */ }
  }, [defaultState, moduleId]);

  return [state, save, reset];
}
