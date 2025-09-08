# 9to5 Scout - Development Setup Guide

## Prerequisites

### Required Software
- **Node.js**: Version 18.x or later
- **npm**: Version 9.x or later (comes with Node.js)
- **Git**: Latest version
- **VS Code**: Recommended IDE with extensions
- **Wrangler CLI**: Cloudflare Workers CLI tool

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "astro-build.astro-vscode",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "streetsidesoftware.code-spell-checker",
    "gruntfuggly.todo-tree",
    "eamodio.gitlens"
  ]
}
```

## Environment Setup

### 1. Clone and Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-org/9to5-scout-frontend.git
cd 9to5-scout-frontend

# Install dependencies
npm install

# Install Wrangler CLI globally
npm install -g wrangler
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Copy development variables template
cp .dev.vars.example .dev.vars
```

### 3. Environment Variables Setup

#### `.env.local` (Client-side variables)
```env
# API Configuration
PUBLIC_API_BASE=https://9to5-scout.hacolby.workers.dev
PUBLIC_APP_ENV=development

# Feature Flags
PUBLIC_ENABLE_AI_FEATURES=true
PUBLIC_ENABLE_ANALYTICS=false
PUBLIC_ENABLE_PWA=true

# Analytics (if enabled)
PUBLIC_GOOGLE_ANALYTICS_ID=
PUBLIC_POSTHOG_KEY=

# Sentry (optional)
PUBLIC_SENTRY_DSN=
```

#### `.dev.vars` (Server-side variables for Wrangler)
```env
# API Authentication
API_TOKEN=your_development_api_token_here

# Database (if needed)
DATABASE_URL=

# Third-party Services
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Email Services
RESEND_API_KEY=

# Development flags
NODE_ENV=development
```

## Development Workflow

### 1. Start Development Server
```bash
# Standard Astro development
npm run dev

# With Wrangler for full Workers environment
npm run wrangler:dev

# Development server with type checking
npm run dev:typecheck
```

### 2. Development Commands
```bash
# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Code formatting
npm run format
npm run format:check

# Testing
npm run test
npm run test:watch
npm run test:coverage

# Build
npm run build
npm run preview
```

## Project Structure Deep Dive

```
9to5-scout-frontend/
├── .astro/                 # Astro build artifacts (auto-generated)
├── .vscode/               # VS Code workspace settings
├── public/                # Static assets
│   ├── favicon.ico
│   ├── manifest.json     # PWA manifest
│   └── robots.txt
├── src/
│   ├── components/       # React/Astro components
│   │   ├── ui/          # shadcn/ui base components
│   │   ├── forms/       # Form-specific components
│   │   ├── charts/      # Data visualization
│   │   ├── job/         # Job-related components
│   │   └── layouts/     # Layout components
│   ├── pages/           # File-based routing
│   │   ├── api/         # API routes (if needed)
│   │   ├── jobs/        # Job-related pages
│   │   ├── profile/     # User profile pages
│   │   └── analytics/   # Analytics dashboard
│   ├── lib/             # Utility libraries
│   │   ├── api/         # API client and types
│   │   ├── auth/        # Authentication utilities
│   │   ├── stores/      # Zustand stores
│   │   ├── utils/       # General utilities
│   │   └── hooks/       # Custom React hooks
│   ├── styles/          # Global styles
│   │   ├── globals.css  # Global CSS and Tailwind
│   │   └── components/  # Component-specific styles
│   ├── types/           # TypeScript type definitions
│   │   ├── api.ts       # API types (auto-generated)
│   │   ├── global.ts    # Global types
│   │   └── components.ts # Component prop types
│   └── middleware.ts    # Astro middleware
├── __tests__/           # Test files
│   ├── components/      # Component tests
│   ├── utils/          # Utility tests
│   └── e2e/            # End-to-end tests
├── docs/               # Project documentation
├── astro.config.mjs    # Astro configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── tsconfig.json      # TypeScript configuration
├── wrangler.toml      # Cloudflare Workers configuration
├── package.json       # Dependencies and scripts
└── README.md          # Project overview
```

## API Integration Setup

### 1. Generate TypeScript Types
```bash
# Generate types from OpenAPI schema
npm run generate-types

# Manual generation (if script fails)
npx openapi-typescript https://9to5-scout.hacolby.workers.dev/openapi.json \
  --output src/types/api.ts
```

### 2. API Client Configuration
```typescript
// src/lib/api/client.ts
import { ApiClient } from './generated-client';

export const api = new ApiClient({
  baseURL: import.meta.env.PUBLIC_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 3. Environment-Specific Configuration
```typescript
// src/lib/config.ts
export const config = {
  api: {
    baseURL: import.meta.env.PUBLIC_API_BASE,
    timeout: 10000,
  },
  features: {
    aiFeatures: import.meta.env.PUBLIC_ENABLE_AI_FEATURES === 'true',
    analytics: import.meta.env.PUBLIC_ENABLE_ANALYTICS === 'true',
    pwa: import.meta.env.PUBLIC_ENABLE_PWA === 'true',
  },
  app: {
    environment: import.meta.env.PUBLIC_APP_ENV,
    version: import.meta.env.PUBLIC_APP_VERSION,
  },
};
```

## Database Schema (if using local data)

### 1. Setup D1 Database (Development)
```bash
# Create D1 database
wrangler d1 create 9to5-scout-dev

# Apply migrations
wrangler d1 migrations apply 9to5-scout-dev --local

# Seed development data
npm run db:seed
```

### 2. Database Schema
```sql
-- migrations/001_initial_schema.sql
CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  preferences TEXT NOT NULL, -- JSON blob
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_searches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  query TEXT NOT NULL, -- JSON blob
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  status TEXT DEFAULT 'saved',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Development Best Practices

### 1. Code Organization
```typescript
// Component structure example
// src/components/job/JobCard.tsx
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Job } from '@/types/api';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: Job;
  variant?: 'default' | 'compact';
  onSave?: (jobId: string) => void;
  className?: string;
}

export function JobCard({ 
  job, 
  variant = 'default', 
  onSave, 
  className 
}: JobCardProps) {
  return (
    <Card className={cn('job-card', className)}>
      {/* Component implementation */}
    </Card>
  );
}

// Export with display name for debugging
JobCard.displayName = 'JobCard';
```

### 2. State Management Patterns
```typescript
// src/lib/stores/jobStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Job, JobFilters } from '@/types/api';

interface JobState {
  jobs: Job[];
  filters: JobFilters;
  savedJobs: string[];
  loading: boolean;
  
  // Actions
  setJobs: (jobs: Job[]) => void;
  updateFilters: (filters: Partial<JobFilters>) => void;
  toggleSaveJob: (jobId: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useJobStore = create<JobState>()(
  persist(
    (set, get) => ({
      jobs: [],
      filters: {},
      savedJobs: [],
      loading: false,
      
      setJobs: (jobs) => set({ jobs }),
      updateFilters: (filters) => 
        set((state) => ({ 
          filters: { ...state.filters, ...filters } 
        })),
      toggleSaveJob: (jobId) =>
        set((state) => ({
          savedJobs: state.savedJobs.includes(jobId)
            ? state.savedJobs.filter(id => id !== jobId)
            : [...state.savedJobs, jobId]
        })),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'job-storage',
      partialize: (state) => ({
        savedJobs: state.savedJobs,
        filters: state.filters,
      }),
    }
  )
);
```

### 3. Custom Hooks Patterns
```typescript
// src/lib/hooks/useJobs.ts
import { useQuery } from '@tanstack/react-query';
import { useJobStore } from '@/lib/stores/jobStore';
import { api } from '@/lib/api/client';

export function useJobs() {
  const { filters, setJobs, setLoading } = useJobStore();
  
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      setLoading(true);
      try {
        const response = await api.jobs.list(filters);
        setJobs(response.data);
        return response.data;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  });
}

// Usage in component
export function JobList() {
  const { data: jobs, isLoading, error } = useJobs();
  
  if (isLoading) return <JobListSkeleton />;
  if (error) return <ErrorState error={error} />;
  
  return (
    <div className="job-list">
      {jobs?.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
```

## Testing Setup

### 1. Testing Configuration
```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
};

// jest.setup.ts
import '@testing-library/jest-dom';
import { server } from './src/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 2. Mock Service Worker Setup
```typescript
// src/mocks/handlers.ts
import { rest } from 'msw';
import { Job } from '@/types/api';

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Frontend Developer',
    company: 'Tech Corp',
    location: 'San Francisco, CA',
    salary_min: 80000,
    salary_max: 120000,
  },
];

export const handlers = [
  rest.get('/api/jobs', (req, res, ctx) => {
    return res(ctx.json(mockJobs));
  }),
  
  rest.get('/api/jobs/:id', (req, res, ctx) => {
    const { id } = req.params;
    const job = mockJobs.find(j => j.id === id);
    
    if (!job) {
      return res(ctx.status(404));
    }
    
    return res(ctx.json(job));
  }),
];

// src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

## Deployment Setup

### 1. Cloudflare Workers Configuration
```toml
# wrangler.toml
name = "9to5-scout-frontend"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[site]
bucket = "./dist"

[build]
command = "npm run build"

[env.development]
name = "9to5-scout-frontend-dev"
vars = { NODE_ENV = "development" }

[env.staging]
name = "9to5-scout-frontend-staging"
vars = { NODE_ENV = "staging" }

[env.production]
name = "9to5-scout-frontend"
vars = { NODE_ENV = "production" }
route = "app.9to5scout.com/*"
```

### 2. GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main, staging, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Run linting
        run: npm run lint
      
      - name: Type check
        run: npm run typecheck
      
      - name: Build
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          environment: ${{ github.ref == 'refs/heads/main' && 'production' || (github.ref == 'refs/heads/staging' && 'staging' || 'development') }}
```

## Troubleshooting

### Common Issues

#### 1. Build Errors
```bash
# Clear caches and reinstall
rm -rf node_modules .astro dist
npm install

# Check for TypeScript errors
npm run typecheck

# Verify Astro configuration
npx astro check
```

#### 2. API Connection Issues
```typescript
// Check API connectivity
const testApiConnection = async () => {
  try {
    const response = await fetch(`${import.meta.env.PUBLIC_API_BASE}/api/health`);
    console.log('API Status:', response.status);
  } catch (error) {
    console.error('API Connection Failed:', error);
  }
};
```

#### 3. Environment Variable Problems
```bash
# Verify environment variables are loaded
npm run dev -- --verbose

# Check variable values (be careful with secrets)
echo $PUBLIC_API_BASE
```

### Development Tools

#### 1. Browser DevTools Setup
- Install React Developer Tools
- Install Astro DevTools (when available)
- Enable Performance tab for Core Web Vitals

#### 2. VS Code Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "request": "launch",
      "type": "chrome",
      "url": "http://localhost:4321",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

#### 3. Performance Monitoring
```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# Bundle analyzer
npm run build
npm run analyze
```

## Next Steps

1. **Complete Environment Setup**: Follow all setup steps above
2. **Verify API Connection**: Test API endpoints and authentication
3. **Start Development**: Begin with foundation tasks (T1.1.1 - T1.1.7)
4. **Review Architecture**: Study technical_architecture.md
5. **Implement Components**: Follow component_library_spec.md
6. **Monitor Performance**: Use performance_optimization_checklist.md

This setup guide provides everything needed to get started with developing the 9to5 Scout frontend platform efficiently and following best practices.
