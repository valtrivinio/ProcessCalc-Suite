import React from 'react';

// ---------- Input ----------
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

// ---------- Select ----------
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: any; // array or object
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

// ---------- ResultCard ----------
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

// ---------- SectionHeader ----------
export function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

// ---------- Card ----------
interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
}
export function Card({ children, className = '', variant = 'default' }: CardProps) {
  const base = 'rounded-lg border p-4 shadow-sm';
  const variants = {
    default: 'bg-white border-gray-200',
    outline: 'bg-transparent border-gray-300',
    ghost: 'bg-transparent border-transparent shadow-none',
  };
  return <div className={`${base} ${variants[variant]} ${className}`}>{children}</div>;
}

// ---------- Badge (often used) ----------
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}
export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-200 text-gray-800',
    success: 'bg-green-200 text-green-800',
    warning: 'bg-yellow-200 text-yellow-800',
    danger: 'bg-red-200 text-red-800',
    info: 'bg-blue-200 text-blue-800',
  };
  return <span className={`inline-block px-2 py-1 text-xs rounded ${variants[variant]}`}>{children}</span>;
}

// ---------- Alert (useful) ----------
interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
}
export function Alert({ children, variant = 'info' }: AlertProps) {
  const variants = {
    info: 'bg-blue-50 border-blue-400 text-blue-800',
    success: 'bg-green-50 border-green-400 text-green-800',
    warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
    error: 'bg-red-50 border-red-400 text-red-800',
  };
  return <div className={`p-3 border-l-4 rounded ${variants[variant]}`}>{children}</div>;
}
