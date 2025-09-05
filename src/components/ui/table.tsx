import * as React from 'react';

export function Table({ className = '', children }: React.PropsWithChildren<{ className?: string }>) {
  return <table className={`w-full border-collapse text-sm ${className}`}>{children}</table>;
}
export function THead({ children }: React.PropsWithChildren) {
  return <thead className="bg-neutral-50 text-neutral-600">{children}</thead>;
}
export function TBody({ children }: React.PropsWithChildren) {
  return <tbody className="divide-y divide-neutral-200">{children}</tbody>;
}
export function TR({ children }: React.PropsWithChildren) {
  return <tr className="hover:bg-neutral-50">{children}</tr>;
}
export function TH({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) {
  return <th className={`px-3 py-2 text-left font-medium ${className}`}>{children}</th>;
}
export function TD({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) {
  return <td className={`px-3 py-2 align-top ${className}`}>{children}</td>;
}
