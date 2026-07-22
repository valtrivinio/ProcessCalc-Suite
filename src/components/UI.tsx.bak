import React, { InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  unit?: string;
  error?: string;
}

export function Input({ label, unit, error, className, ...props }: InputProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="relative rounded-md shadow-sm">
        <input
          className={cn(
            "block w-full rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 font-mono bg-white dark:bg-slate-800",
            error && "ring-red-300 focus:ring-red-500 dark:ring-red-900",
            unit && "pr-12"
          )}
          {...props}
        />
        {unit && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-slate-500 dark:text-slate-400 sm:text-sm">{unit}</span>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <select
        className={cn(
          "block w-full rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-slate-800",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ResultCard({ title, value, unit, subtext }: { title: string; value: string | number; unit?: string; subtext?: string }) {
  return (
    <div className="overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 py-5 shadow sm:p-6 border border-slate-100 dark:border-slate-700">
      <dt className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">{title}</dt>
      <dd className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white font-mono break-all">
        {value}
        {unit && <span className="ml-2 text-lg text-slate-400 dark:text-slate-500 font-sans">{unit}</span>}
      </dd>
      {subtext && <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{subtext}</p>}
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 py-5 shadow sm:p-6 border border-slate-100 dark:border-slate-700", className)}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
      <h2 className="text-lg font-semibold leading-6 text-slate-900 dark:text-white">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
  );
}
