export function validateNumber(value, label, options = {}) {
  if (options.required && (value === undefined || value === null)) {
    return `${label} is required.`;
  }
  if (typeof value !== 'number' || isNaN(value)) {
    return `${label} must be a valid number.`;
  }
  if (options.min !== undefined && value < options.min) {
    return `${label} must be ≥ ${options.min} ${options.unit || ''}`;
  }
  if (options.max !== undefined && value > options.max) {
    return `${label} must be ≤ ${options.max} ${options.unit || ''}`;
  }
  return null;
}

export function hasErrors(errors) {
  if (Array.isArray(errors)) {
    return errors.some(e => e !== null && e !== undefined && e !== '');
  }
  if (errors && typeof errors === 'object') {
    return Object.values(errors).some(e => e !== null && e !== undefined && e !== '');
  }
  return false;
}
