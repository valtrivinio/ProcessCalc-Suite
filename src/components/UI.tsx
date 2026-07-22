import React from 'react';

export function Input({ label, unit, ...props }) {
  return (
    <div className="input-group">
      {label && (
        <label>
          {label} {unit && <span className="unit">[{unit}]</span>}
        </label>
      )}
      <input {...props} />
    </div>
  );
}

export function Select({ options, label, ...props }) {
  // Convert object to array of {label, value}
  let optionsArray = [];
  if (Array.isArray(options)) {
    optionsArray = options;
  } else if (options && typeof options === 'object') {
    optionsArray = Object.entries(options).map(([key, val]) => ({
      label: key,
      value: val,
    }));
  }
  // If still empty, provide a fallback
  if (optionsArray.length === 0) {
    optionsArray = [{ label: 'No options', value: '' }];
  }

  return (
    <div className="select-group">
      {label && <label>{label}</label>}
      <select {...props}>
        {optionsArray.map((opt) => (
          <option key={opt.label + opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ResultCard({ title, children }) {
  return (
    <div className="result-card">
      {title && <h3>{title}</h3>}
      <div>{children}</div>
    </div>
  );
}

export function SectionHeader({ title, children }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export function Card({ children, className = '', variant = 'default' }) {
  const base = 'rounded-lg border p-4 shadow-sm';
  const variants = {
    default: 'bg-white border-gray-200',
    outline: 'bg-transparent border-gray-300',
    ghost: 'bg-transparent border-transparent shadow-none',
  };
  return <div className={`${base} ${variants[variant]} ${className}`}>{children}</div>;
}
