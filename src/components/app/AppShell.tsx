import * as React from 'react';
import { Button } from '../ui/button';

const NavLink = ({ href, label }: { href: string; label: string }) => (
  <a href={href} className="block rounded-md px-3 py-2 text-sm hover:bg-neutral-100">
    {label}
  </a>
);

export function AppShell({ children }: React.PropsWithChildren) {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setOpen((v) => !v)} aria-label="Toggle navigation">☰</Button>
            <a href="/admin" className="text-sm font-semibold">9to5-Scout</a>
          </div>
          <div className="text-xs text-neutral-500">Cloudflare Pages · Astro + React</div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-4 px-4 py-4">
        <aside className={`col-span-12 md:col-span-3 lg:col-span-2 ${open ? '' : 'hidden'}`}>
          <nav className="rounded-lg border border-neutral-200 bg-white p-2">
            <NavLink href="/admin" label="Dashboard" />
            <NavLink href="/admin/discovery" label="Discovery" />
            <NavLink href="/admin/jobs" label="Jobs" />
            <NavLink href="/admin/applicant" label="Applicant" />
            <NavLink href="/admin/agents" label="Agents" />
            <NavLink href="/admin/tasks" label="Tasks" />
            <NavLink href="/admin/workflows" label="Workflows" />
          </nav>
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-10">{children}</main>
      </div>
    </div>
  );
}
