# 9to5 Scout - Component Library Specification

## Overview
This document defines the comprehensive component library for the 9to5 Scout platform, built on top of shadcn/ui with custom job search-specific components.

## Design System Foundation

### Color Palette
```typescript
// tailwind.config.js colors
const colors = {
  // Primary Brand Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',  // Main brand blue
    600: '#2563eb',
    900: '#1e3a8a',
  },
  
  // Secondary Colors
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
  
  // Job-specific Colors
  'job-match': {
    excellent: '#22c55e',
    good: '#84cc16',
    fair: '#f59e0b',
    poor: '#ef4444',
  },
  
  // Status Colors
  'job-status': {
    open: '#22c55e',
    closed: '#64748b',
    applied: '#3b82f6',
    interview: '#8b5cf6',
    offer: '#f59e0b',
    rejected: '#ef4444',
  },
};
```

### Typography Scale
```typescript
const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  },
};
```

### Spacing & Layout
```typescript
const spacing = {
  // Component spacing
  'component-xs': '0.5rem',
  'component-sm': '0.75rem', 
  'component-md': '1rem',
  'component-lg': '1.5rem',
  'component-xl': '2rem',
  
  // Layout spacing
  'layout-xs': '1rem',
  'layout-sm': '1.5rem',
  'layout-md': '2rem',
  'layout-lg': '3rem',
  'layout-xl': '4rem',
};
```

## Base Components (shadcn/ui)

### Form Components
- **Button**: Primary, secondary, ghost, outline variants
- **Input**: Text, email, password, search variants
- **Textarea**: Multi-line text input
- **Select**: Dropdown selection
- **Checkbox**: Boolean selection
- **Radio Group**: Single selection from options
- **Switch**: Toggle control
- **Slider**: Range selection
- **Date Picker**: Date and date range selection

### Layout Components
- **Card**: Container for grouped content
- **Sheet**: Sliding panel overlay
- **Dialog**: Modal overlay
- **Popover**: Floating content
- **Tooltip**: Contextual help
- **Tabs**: Content organization
- **Accordion**: Collapsible content
- **Separator**: Visual divider

### Feedback Components
- **Alert**: Status messages
- **Toast**: Temporary notifications
- **Badge**: Status indicators
- **Progress**: Loading and completion states
- **Skeleton**: Loading placeholders
- **Spinner**: Loading indicators

### Navigation Components
- **Breadcrumb**: Navigation hierarchy
- **Pagination**: Content navigation
- **Command**: Search and command palette
- **Context Menu**: Right-click actions
- **Dropdown Menu**: Action menus

## Job Search Specific Components

### 1. Job Display Components

#### JobCard
```typescript
interface JobCardProps {
  job: Job;
  variant?: 'default' | 'compact' | 'detailed';
  showFitScore?: boolean;
  showSaveButton?: boolean;
  onSave?: (jobId: string) => void;
  onApply?: (job: Job) => void;
  className?: string;
}

// Variants:
// - default: Standard card with essential info
// - compact: Minimal info for dense lists
// - detailed: Extended info with description preview
```

#### JobGrid
```typescript
interface JobGridProps {
  jobs: Job[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onJobSelect?: (job: Job) => void;
  emptyState?: React.ReactNode;
  className?: string;
}

// Features:
// - Virtual scrolling for performance
// - Infinite scroll loading
// - Responsive grid layout
// - Empty state handling
```

#### JobDetails
```typescript
interface JobDetailsProps {
  job: Job;
  fitScore?: JobFitScore;
  isTracking?: boolean;
  onToggleTracking?: () => void;
  onApply?: () => void;
  onSave?: () => void;
  className?: string;
}

// Features:
// - Comprehensive job information display
// - Fit score visualization
// - Action buttons (apply, save, track)
// - Company information integration
```

### 2. Search & Filter Components

#### SearchInput
```typescript
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  showHistory?: boolean;
  debounceMs?: number;
  className?: string;
}

// Features:
// - Auto-suggestions
// - Search history
// - Debounced input
// - Keyboard navigation
```

#### FilterPanel
```typescript
interface FilterPanelProps {
  filters: JobFilters;
  onChange: (filters: Partial<JobFilters>) => void;
  onReset?: () => void;
  availableFilters: FilterConfig[];
  collapsible?: boolean;
  className?: string;
}

// Filter Types:
// - Location (autocomplete)
// - Salary range (dual slider)
// - Experience level (multi-select)
// - Company size (select)
// - Job type (checkbox group)
// - Remote options (radio group)
```

#### SavedSearches
```typescript
interface SavedSearchesProps {
  searches: SavedSearch[];
  onSelect: (search: SavedSearch) => void;
  onDelete: (searchId: string) => void;
  onEdit: (search: SavedSearch) => void;
  className?: string;
}

// Features:
// - Quick access to saved searches
// - Search management (edit, delete)
// - Alert configuration
```

### 3. Analytics & Visualization Components

#### FitScoreDisplay
```typescript
interface FitScoreDisplayProps {
  score: JobFitScore;
  variant?: 'gauge' | 'bar' | 'radar' | 'compact';
  showBreakdown?: boolean;
  interactive?: boolean;
  className?: string;
}

// Visualizations:
// - Gauge: Overall score with color coding
// - Bar: Individual category scores
// - Radar: Multi-dimensional view
// - Compact: Minimal score indicator
```

#### TrendChart
```typescript
interface TrendChartProps {
  data: TimeSeriesData[];
  type: 'line' | 'area' | 'bar';
  xAxis: string;
  yAxis: string;
  color?: string;
  showGrid?: boolean;
  interactive?: boolean;
  className?: string;
}

// Use cases:
// - Salary trends over time
// - Job posting frequency
// - Application success rates
// - Market demand analytics
```

#### SalaryChart
```typescript
interface SalaryChartProps {
  data: SalaryData[];
  type: 'distribution' | 'comparison' | 'trend';
  location?: string;
  experience?: string;
  showPercentiles?: boolean;
  className?: string;
}

// Features:
// - Salary distribution visualization
// - Geographic comparisons
// - Experience level breakdown
// - Percentile indicators
```

### 4. Application Management Components

#### ApplicationCard
```typescript
interface ApplicationCardProps {
  application: JobApplication;
  onStatusChange: (status: ApplicationStatus) => void;
  onAddNote: (note: string) => void;
  onScheduleInterview: () => void;
  variant?: 'card' | 'row';
  className?: string;
}

// Features:
// - Status management
// - Quick actions
// - Progress indicators
// - Communication tracking
```

#### ApplicationPipeline
```typescript
interface ApplicationPipelineProps {
  applications: JobApplication[];
  stages: PipelineStage[];
  onMoveApplication: (appId: string, stageId: string) => void;
  onBulkAction: (appIds: string[], action: string) => void;
  className?: string;
}

// Features:
// - Kanban-style pipeline
// - Drag-and-drop functionality
// - Bulk operations
// - Stage customization
```

#### CommunicationTimeline
```typescript
interface CommunicationTimelineProps {
  communications: Communication[];
  onAddCommunication: (comm: Communication) => void;
  onScheduleFollowup: (date: Date) => void;
  editable?: boolean;
  className?: string;
}

// Features:
// - Chronological communication history
// - Communication templates
// - Follow-up scheduling
// - Rich text editing
```

### 5. AI & Assistance Components

#### ContentGenerator
```typescript
interface ContentGeneratorProps {
  type: 'cover-letter' | 'resume' | 'email' | 'message';
  jobContext?: Job;
  userProfile?: UserProfile;
  onGenerate: (content: string) => void;
  templates?: Template[];
  className?: string;
}

// Features:
// - AI-powered content generation
// - Template selection
// - Context-aware generation
// - Real-time editing
```

#### CareerInsights
```typescript
interface CareerInsightsProps {
  insights: CareerInsight[];
  type: 'recommendation' | 'analysis' | 'prediction';
  interactive?: boolean;
  onActionTaken?: (insight: CareerInsight, action: string) => void;
  className?: string;
}

// Insight Types:
// - Skill gap analysis
// - Career path recommendations
// - Market opportunity alerts
// - Application optimization tips
```

#### SkillGapAnalysis
```typescript
interface SkillGapAnalysisProps {
  userSkills: Skill[];
  requiredSkills: Skill[];
  recommendations: LearningRecommendation[];
  onStartLearning: (skill: Skill) => void;
  className?: string;
}

// Features:
// - Visual skill comparison
// - Gap identification
// - Learning recommendations
// - Progress tracking
```

### 6. Data Visualization Components

#### JobMarketMap
```typescript
interface JobMarketMapProps {
  data: GeographicJobData[];
  metric: 'count' | 'salary' | 'growth';
  interactive?: boolean;
  onRegionSelect?: (region: string) => void;
  className?: string;
}

// Features:
// - Geographic data visualization
// - Interactive region selection
// - Multiple metric overlays
// - Zoom and pan capabilities
```

#### CompanyInsights
```typescript
interface CompanyInsightsProps {
  company: Company;
  insights: CompanyInsight[];
  showComparison?: boolean;
  onFollowCompany?: () => void;
  className?: string;
}

// Insights:
// - Hiring trends
// - Employee satisfaction
// - Financial health
// - Culture analysis
```

### 7. Specialized UI Components

#### StatusIndicator
```typescript
interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'pending';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dot' | 'badge' | 'icon';
  className?: string;
}

// Use cases:
// - Job status indicators
// - Application status
// - System health
// - Progress states
```

#### ProgressTracker
```typescript
interface ProgressTrackerProps {
  steps: ProgressStep[];
  currentStep: number;
  variant?: 'linear' | 'circular' | 'dots';
  showLabels?: boolean;
  className?: string;
}

// Use cases:
// - Onboarding progress
// - Application workflow
// - Goal achievement
// - Multi-step forms
```

#### MetricCard
```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  format?: 'number' | 'currency' | 'percentage';
  className?: string;
}

// Use cases:
// - Dashboard metrics
// - KPI displays
// - Performance indicators
// - Analytics summaries
```

## Layout Components

### DashboardLayout
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  actions?: React.ReactNode;
}

// Features:
// - Responsive sidebar
// - Header with navigation
// - Breadcrumb navigation
// - Page-specific actions
```

### ContentLayout
```typescript
interface ContentLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  sidebar?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Features:
// - Flexible content areas
// - Optional sidebar
// - Page headers
// - Action buttons
```

## Responsive Design Patterns

### Breakpoints
```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
};
```

### Mobile-First Components
- **Collapsible sidebar**: Desktop sidebar → mobile drawer
- **Responsive grids**: Auto-adjusting columns
- **Touch-friendly**: Larger touch targets
- **Simplified navigation**: Mobile-optimized menus

## Accessibility Standards

### WCAG 2.1 AA Compliance
- **Color contrast**: Minimum 4.5:1 for normal text
- **Focus management**: Visible focus indicators
- **Keyboard navigation**: Full keyboard support
- **Screen readers**: Proper ARIA labels and landmarks
- **Text scaling**: Support up to 200% zoom

### Component Accessibility Features
```typescript
// Example: Accessible form component
export function AccessibleFormField({
  label,
  error,
  required,
  children,
  ...props
}) {
  const id = useId();
  const errorId = `${id}-error`;
  
  return (
    <div className="form-field">
      <label 
        htmlFor={id}
        className={cn("form-label", required && "required")}
      >
        {label}
        {required && <span aria-label="required">*</span>}
      </label>
      
      {React.cloneElement(children, {
        id,
        'aria-invalid': !!error,
        'aria-describedby': error ? errorId : undefined,
        ...props,
      })}
      
      {error && (
        <div id={errorId} role="alert" className="form-error">
          {error}
        </div>
      )}
    </div>
  );
}
```

## Animation & Motion

### Animation Principles
- **Purposeful**: Animations serve a functional purpose
- **Fast**: Animations complete in 200-300ms
- **Smooth**: 60fps performance
- **Respectful**: Honor `prefers-reduced-motion`

### Common Animation Patterns
```typescript
// Entrance animations
const slideIn = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.2 }
};

// Loading states
const pulse = {
  animate: { opacity: [1, 0.5, 1] },
  transition: { duration: 1.5, repeat: Infinity }
};

// Interactive feedback
const scale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 }
};
```

## Testing Strategy

### Component Testing
```typescript
// Example: JobCard component test
describe('JobCard', () => {
  const mockJob = {
    id: '1',
    title: 'Frontend Developer',
    company: 'Tech Corp',
    location: 'San Francisco',
    salary_min: 80000,
    salary_max: 120000,
  };
  
  it('renders job information correctly', () => {
    render(<JobCard job={mockJob} />);
    
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('San Francisco')).toBeInTheDocument();
    expect(screen.getByText('$80k - $120k')).toBeInTheDocument();
  });
  
  it('handles save action', async () => {
    const onSave = jest.fn();
    render(<JobCard job={mockJob} onSave={onSave} />);
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);
    
    expect(onSave).toHaveBeenCalledWith('1');
  });
  
  it('is accessible', async () => {
    const { container } = render(<JobCard job={mockJob} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Visual Regression Testing
```typescript
// Storybook stories for visual testing
export default {
  title: 'Components/JobCard',
  component: JobCard,
  parameters: {
    docs: { description: { component: 'Job listing card component' } }
  }
};

export const Default = {
  args: { job: mockJob }
};

export const WithFitScore = {
  args: { job: mockJob, showFitScore: true }
};

export const Compact = {
  args: { job: mockJob, variant: 'compact' }
};
```

## Performance Considerations

### Bundle Optimization
- **Tree shaking**: Import only used components
- **Code splitting**: Lazy load heavy components
- **Dynamic imports**: Load on demand

### Rendering Performance
- **React.memo**: Prevent unnecessary re-renders
- **useMemo/useCallback**: Optimize expensive computations
- **Virtual scrolling**: Handle large datasets

### Image Optimization
- **Lazy loading**: Load images on scroll
- **Responsive images**: Multiple sizes and formats
- **Placeholder states**: Skeleton loading

This component library provides a comprehensive foundation for building the 9to5 Scout platform while maintaining consistency, accessibility, and performance standards.
