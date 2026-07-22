import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  unit?: string;
}

export function Input({ label, unit, ...props }: InputProps) {
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

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: any; // can be array or object
  label?: string;
}

export function Select({ options, label, ...props }: SelectProps) {
  // Convert options to array if needed
  const optionsArray = Array.isArray(options) 
    ? options 
    : Object.entries(options).map(([key, val]) => ({ label: key, value: val }));

  return (
    <div className="select-group">
      {label && <label>{label}</label>}
      <select {...props}>
        {optionsArray.map((opt: any) => (
          <option key={opt.label + opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ResultCardProps {
  title?: string;
  children: React.ReactNode;
}

export function ResultCard({ title, children }: ResultCardProps) {
  return (
    <div className="result-card">
      {title && <h3>{title}</h3>}
      <div>{children}</div>
    </div>
  );
}

export function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
