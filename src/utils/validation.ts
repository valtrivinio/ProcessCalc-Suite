export const validateNumber = (
  value: string, 
  label: string, 
  rules: { 
    min?: number; 
    max?: number; 
    required?: boolean; 
    mustBeInteger?: boolean;
    greaterThan?: number;
  } = {}
): string | undefined => {
  if (!value && rules.required) return `${label} is required`;
  if (!value) return undefined;

  const num = parseFloat(value);
  if (isNaN(num)) return `${label} must be a valid number`;

  if (rules.mustBeInteger && !Number.isInteger(num)) return `${label} must be an integer`;
  
  if (rules.min !== undefined && num < rules.min) return `${label} must be ≥ ${rules.min}`;
  if (rules.max !== undefined && num > rules.max) return `${label} must be ≤ ${rules.max}`;
  if (rules.greaterThan !== undefined && num <= rules.greaterThan) return `${label} must be > ${rules.greaterThan}`;

  return undefined;
};

export const hasErrors = (errors: Record<string, string | undefined>) => {
  return Object.values(errors).some(error => error !== undefined);
};
