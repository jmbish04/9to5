import * as React from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/button';
import { ThemeToggle } from '../theme-toggle';
import { cn } from '@/lib/utils';

const NavLink = ({ href, label, isActive }: { href: string; label: string; isActive?: boolean }) => (
  <a 
    href={href} 
    className={cn(
      "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
      "hover:bg-accent hover:text-accent-foreground",
      isActive && "bg-accent text-accent-foreground"
    )}
  >
    {label}
  </a>
);

export function AppShell({ children }: React.PropsWithChildren) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  
  // Close sidebar when clicking outside on mobile
  const sidebarRef = React.useRef<HTMLElement>(null);
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          {/* Mobile sidebar toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="mr-2 px-2 md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation"
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          {/* Logo */}
          <div className="mr-4 flex">
            <a href="/admin" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-xl">9to5 Scout</span>
            </a>
          </div>

          {/* Desktop navigation - hidden on mobile */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <NavLink href="/admin" label="Dashboard" />
            <NavLink href="/admin/jobs" label="Jobs" />
            <NavLink href="/admin/applicant" label="Applicant" />
            <NavLink href="/admin/agents" label="Agents" />
          </nav>

          {/* Right side */}
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              {/* Add search component here later if needed */}
            </div>
            <nav className="flex items-center space-x-2">
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" />
        )}

        {/* Sidebar */}
        <aside
          ref={sidebarRef}
          className={cn(
            "fixed top-14 z-40 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block",
            sidebarOpen && "block"
          )}
        >
          <div className="py-6 pr-6 lg:py-8">
            {/* Mobile close button */}
            <div className="flex items-center justify-between mb-4 md:hidden">
              <span className="font-semibold">Navigation</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <nav className="space-y-2">
              <div className="space-y-1">
                <NavLink href="/admin" label="Dashboard" />
                <NavLink href="/admin/jobs" label="Jobs" />
                <NavLink href="/admin/applicant" label="Applicant" />
                <NavLink href="/admin/agents" label="Agents" />
                <NavLink href="/admin/tasks" label="Tasks" />
                <NavLink href="/admin/workflows" label="Workflows" />
              </div>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex w-full flex-col overflow-hidden">
          <div className="container flex-1 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
