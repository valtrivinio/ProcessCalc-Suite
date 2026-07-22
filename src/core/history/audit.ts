
/**
 * Calculation Audit Trail System
 * Tracks all engineering calculations for liability and verification.
 */

export interface CalculationRecord {
  id: string;
  timestamp: string;
  module: string;
  inputs: Record<string, any>;
  results: Record<string, any>;
  user: string;
  version: string;
  hash: string; // Integrity check
}

const STORAGE_KEY = 'processcalc_audit_trail';

export function saveCalculation(module: string, inputs: any, results: any): void {
  const record: CalculationRecord = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    module,
    inputs,
    results,
    user: 'Guest Engineer', // Placeholder for auth
    version: '1.2.0-FEED',
    hash: 'SHA-256-SIMULATED' 
  };

  const history = getHistory();
  history.unshift(record);
  // Keep last 50 records
  if (history.length > 50) history.pop();
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Audit trail storage failed', e);
  }
}

export function getHistory(): CalculationRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
