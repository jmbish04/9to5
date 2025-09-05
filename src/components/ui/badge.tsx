import * as React from 'react';
export function Badge({ children, variant = 'default' }: React.PropsWithChildren<{ variant?: 'default' | 'info' | 'accent' | 'secondary' | 'warning' | 'success' | 'destructive' }>) {
  const map: Record<string, string> = {
    default: 'bg-neutral-200 text-neutral-800',
    info: 'bg-blue-100 text-blue-700',
    accent: 'bg-indigo-100 text-indigo-700',
    secondary: 'bg-neutral-100 text-neutral-700',
    warning: 'bg-amber-100 text-amber-800',
    success: 'bg-green-100 text-green-800',
    destructive: 'bg-red-100 text-red-700'
  };
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${map[variant]}`}>{children}</span>;
}
