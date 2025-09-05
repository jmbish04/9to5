import * as React from 'react';

export function Card({ className = '', children }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`rounded-lg border border-neutral-200 bg-white shadow-sm ${className}`}>{children}</div>;
}
export function CardHeader({ className = '', children }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`p-4 border-b border-neutral-200 ${className}`}>{children}</div>;
}
export function CardTitle({ className = '', children }: React.PropsWithChildren<{ className?: string }>) {
  return <h3 className={`text-base font-semibold ${className}`}>{children}</h3>;
}
export function CardContent({ className = '', children }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
