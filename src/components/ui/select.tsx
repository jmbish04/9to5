import * as React from 'react';
type Option = { label: string; value: string };
export function Select({
  value,
  onChange,
  options,
  className = ''
}: {
  value?: string;
  onChange?: (v: string) => void;
  options: Option[];
  className?: string;
}) {
  return (
    <select
      className={`h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm ${className}`}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
