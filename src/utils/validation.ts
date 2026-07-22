export function validateNumber(
  value: number,
  label: string,
  options?: { min?: number; max?: number; required?: boolean; unit?: string }
): string | null {
  if (options?.required && (value === undefined || value === null)) {
    return `${label} is required.`;
  }
  if (typeof value !== 'number' || isNaN(value)) {
    return `${label} must be a valid number.`;
  }
  if (options?.min !== undefined && value < options.min) {
    return `${label} must be ≥ ${options.min} ${options.unit || ''}`;
  }
  if (options?.max !== undefined && value > options.max) {
    return `${label} must be ≤ ${options.max} ${options.unit || ''}`;
  }
  return null;
}

export function hasErrors(errors: (string | null)[]): boolean {
  return errors.some(e => e !== null);
}
