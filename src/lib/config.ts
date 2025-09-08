export function getApiBase(): string {
  const base = (globalThis as any).__PUBLIC_API_BASE__ ?? (typeof process !== 'undefined' ? process.env.PUBLIC_API_BASE : undefined) ?? (typeof window !== 'undefined' ? (window as any).PUBLIC_API_BASE : undefined);
  if (!base) throw new Error('PUBLIC_API_BASE is not set');
  return String(base).replace(/\/+$/, '');
}
