# 9to5 Scout - Technical Architecture Document

## Overview
This document outlines the technical architecture for the 9to5 Scout frontend application, built with Astro, React, and Cloudflare Workers.

## Architecture Principles

### 1. Island Architecture
- **Static-First**: Most content is statically generated for optimal performance
- **Selective Hydration**: Only interactive components are hydrated on the client
- **Progressive Enhancement**: Core functionality works without JavaScript

### 2. Performance-First Design
- **Core Web Vitals**: All metrics must be in the "Good" range
- **Bundle Optimization**: Aggressive code splitting and lazy loading
- **Caching Strategy**: Multi-layer caching for optimal user experience

### 3. Scalability & Maintainability
- **Component-Based**: Reusable, testable components
- **Type Safety**: Comprehensive TypeScript coverage
- **State Management**: Predictable state with minimal complexity

## Technology Stack

### Core Framework
```
Astro 4.x
├── React 18.x (Islands)
├── TypeScript 5.x
├── Tailwind CSS 3.x
└── shadcn/ui Components
```

### Build & Deployment
```
Vite (Build Tool)
├── Rollup (Bundler)
├── Cloudflare Workers (Runtime)
├── Cloudflare Pages (Hosting)
└── GitHub Actions (CI/CD)
```

### State & Data Management
```
Client State
├── Zustand (Global State)
├── React Query (Server State)
├── React Hook Form (Form State)
└── Local Storage (Persistence)
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   ├── forms/          # Form-specific components
│   ├── charts/         # Data visualization components
│   └── layouts/        # Layout components
├── pages/              # Astro pages (file-based routing)
├── lib/                # Utility functions and configurations
│   ├── api/           # API client and types
│   ├── utils/         # General utilities
│   ├── stores/        # Zustand stores
│   └── hooks/         # Custom React hooks
├── styles/            # Global styles and Tailwind config
├── types/             # TypeScript type definitions
└── assets/            # Static assets (images, icons)
```

## Component Architecture

### Design System Hierarchy
```
Design Tokens (Tailwind Config)
├── Base Components (shadcn/ui)
├── Composite Components (Custom)
├── Feature Components (Job-specific)
└── Page Templates (Layouts)
```

### Component Patterns

#### 1. Server Components (Astro)
```astro
---
// Server-side logic and data fetching
const jobs = await fetchJobs();
---

<div class="job-grid">
  {jobs.map(job => (
    <JobCard job={job} client:load />
  ))}
</div>
```

#### 2. Interactive Islands (React)
```tsx
// components/JobCard.tsx
import { useState } from 'react';
import { Card } from '@/components/ui/card';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const [saved, setSaved] = useState(false);
  
  return (
    <Card className="job-card">
      {/* Job content */}
      <SaveButton 
        saved={saved} 
        onToggle={() => setSaved(!saved)}
      />
    </Card>
  );
}
```

#### 3. Composite Components
```tsx
// components/JobSearch.tsx
export function JobSearch() {
  return (
    <div className="job-search">
      <SearchInput />
      <SearchFilters />
      <SearchResults />
    </div>
  );
}
```

## State Management Strategy

### 1. Global State (Zustand)
```typescript
// stores/userStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  user: User | null;
  preferences: UserPreferences;
  setUser: (user: User) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      preferences: defaultPreferences,
      setUser: (user) => set({ user }),
      updatePreferences: (prefs) => 
        set((state) => ({ 
          preferences: { ...state.preferences, ...prefs }
        })),
    }),
    { name: 'user-storage' }
  )
);
```

### 2. Server State (React Query)
```typescript
// lib/api/queries.ts
import { useQuery } from '@tanstack/react-query';

export function useJobs(filters: JobFilters) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => api.jobs.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useJobDetails(jobId: string) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api.jobs.get(jobId),
    enabled: !!jobId,
  });
}
```

### 3. Form State (React Hook Form)
```typescript
// components/JobFilters.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const filtersSchema = z.object({
  location: z.string().optional(),
  salary_min: z.number().optional(),
  remote: z.boolean().default(false),
});

export function JobFilters() {
  const { register, handleSubmit, watch } = useForm({
    resolver: zodResolver(filtersSchema),
  });
  
  // Auto-submit on change
  const watchedValues = watch();
  useEffect(() => {
    onFiltersChange(watchedValues);
  }, [watchedValues]);
  
  return (
    <form>
      {/* Filter inputs */}
    </form>
  );
}
```

## API Integration

### 1. Type-Safe API Client
```typescript
// lib/api/client.ts
import type { paths } from './generated/api-types';

class ApiClient {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  async get<T>(
    endpoint: keyof paths,
    params?: any
  ): Promise<T> {
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }
    
    return response.json();
  }
}

export const api = new ApiClient(import.meta.env.PUBLIC_API_BASE);
```

### 2. Generated TypeScript Types
```bash
# Generate types from OpenAPI schema
npx openapi-typescript https://9to5-scout.hacolby.workers.dev/openapi.json \
  --output src/lib/api/generated/api-types.ts
```

### 3. Error Handling
```typescript
// lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Custom error boundary
export function ApiErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error }) => (
        <ErrorDisplay error={error} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## Performance Optimizations

### 1. Code Splitting
```typescript
// Lazy load heavy components
const JobAnalytics = lazy(() => import('./JobAnalytics'));
const CareerAssistant = lazy(() => import('./CareerAssistant'));

// Route-based splitting (automatic with Astro)
// pages/jobs/[id].astro -> separate bundle
```

### 2. Image Optimization
```astro
---
// components/OptimizedImage.astro
import { Image } from 'astro:assets';
---

<Image
  src={imageSrc}
  alt={altText}
  width={800}
  height={600}
  format="webp"
  loading="lazy"
  class="rounded-lg"
/>
```

### 3. Virtual Scrolling
```tsx
// components/VirtualJobList.tsx
import { FixedSizeList as List } from 'react-window';

export function VirtualJobList({ jobs }: { jobs: Job[] }) {
  const Row = ({ index, style }: { index: number, style: any }) => (
    <div style={style}>
      <JobCard job={jobs[index]} />
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={jobs.length}
      itemSize={200}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

## Security Considerations

### 1. Authentication
```typescript
// lib/auth.ts
export class AuthManager {
  private tokenKey = 'auth_token';
  
  setToken(token: string) {
    // Store in httpOnly cookie (preferred)
    document.cookie = `${this.tokenKey}=${token}; HttpOnly; Secure; SameSite=Strict`;
  }
  
  getToken(): string | null {
    // Fallback to localStorage for development
    return localStorage.getItem(this.tokenKey);
  }
  
  async refreshToken(): Promise<string> {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const { token } = await response.json();
    this.setToken(token);
    return token;
  }
}
```

### 2. Content Security Policy
```typescript
// astro.config.mjs
export default defineConfig({
  security: {
    contentSecurityPolicy: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", "data:", "https:"],
      'connect-src': ["'self'", "https://9to5-scout.hacolby.workers.dev"],
    },
  },
});
```

## Monitoring & Analytics

### 1. Performance Monitoring
```typescript
// lib/monitoring.ts
export function trackWebVitals() {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
}

// Custom performance marks
export function markFeatureUsage(feature: string) {
  performance.mark(`feature-${feature}`);
  
  // Send to analytics (privacy-compliant)
  if (typeof window !== 'undefined') {
    window.gtag?.('event', 'feature_usage', {
      feature_name: feature,
      timestamp: Date.now(),
    });
  }
}
```

### 2. Error Tracking
```typescript
// lib/error-tracking.ts
export function setupErrorTracking() {
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Send to monitoring service
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Send to monitoring service
  });
}
```

## Testing Strategy

### 1. Component Testing
```typescript
// __tests__/JobCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { JobCard } from '../components/JobCard';

describe('JobCard', () => {
  const mockJob = {
    id: '1',
    title: 'Frontend Developer',
    company: 'Tech Corp',
    location: 'San Francisco',
  };
  
  it('renders job information correctly', () => {
    render(<JobCard job={mockJob} />);
    
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('San Francisco')).toBeInTheDocument();
  });
  
  it('handles save/unsave actions', () => {
    render(<JobCard job={mockJob} />);
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    
    expect(saveButton).toHaveTextContent('Unsave');
  });
});
```

### 2. E2E Testing
```typescript
// cypress/e2e/job-search.cy.ts
describe('Job Search Flow', () => {
  beforeEach(() => {
    cy.visit('/jobs');
  });
  
  it('should search and filter jobs', () => {
    // Search for jobs
    cy.get('[data-testid="search-input"]').type('frontend developer');
    cy.get('[data-testid="search-button"]').click();
    
    // Apply filters
    cy.get('[data-testid="location-filter"]').select('San Francisco');
    cy.get('[data-testid="remote-filter"]').check();
    
    // Verify results
    cy.get('[data-testid="job-card"]').should('have.length.greaterThan', 0);
    cy.get('[data-testid="job-card"]').first().should('contain', 'Frontend');
  });
  
  it('should save a job', () => {
    cy.get('[data-testid="job-card"]').first().within(() => {
      cy.get('[data-testid="save-button"]').click();
    });
    
    cy.get('[data-testid="save-button"]').should('contain', 'Saved');
  });
});
```

## Deployment Configuration

### 1. Astro Configuration
```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    mode: 'directory',
  }),
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false, // Use shadcn/ui base styles
    }),
  ],
  vite: {
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            'vendor-charts': ['recharts'],
            'vendor-forms': ['react-hook-form', '@hookform/resolvers'],
          },
        },
      },
    },
  },
});
```

### 2. Cloudflare Workers Configuration
```toml
# wrangler.toml
name = "9to5-scout-frontend"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "9to5-scout-frontend"
routes = [
  { pattern = "app.9to5scout.com/*", zone_name = "9to5scout.com" }
]

[env.staging]
name = "9to5-scout-frontend-staging"
routes = [
  { pattern = "staging.9to5scout.com/*", zone_name = "9to5scout.com" }
]

[[env.production.vars]]
PUBLIC_API_BASE = "https://api.9to5scout.com"

[[env.staging.vars]]
PUBLIC_API_BASE = "https://staging-api.9to5scout.com"
```

## Maintenance & Updates

### 1. Dependency Management
```json
{
  "scripts": {
    "deps:check": "npm-check-updates",
    "deps:update": "npm-check-updates -u",
    "deps:audit": "npm audit",
    "deps:fix": "npm audit fix"
  }
}
```

### 2. Performance Monitoring
```typescript
// lib/performance-budget.ts
export const performanceBudget = {
  'bundle-size': {
    'initial': '200kb',
    'chunks': '100kb',
  },
  'core-web-vitals': {
    'lcp': '2.5s',
    'fid': '100ms',
    'cls': '0.1',
  },
  'lighthouse': {
    'performance': 90,
    'accessibility': 100,
    'best-practices': 90,
    'seo': 90,
  },
};
```

This architecture provides a solid foundation for building a scalable, performant, and maintainable job search platform that can grow with the needs of the business and users.
