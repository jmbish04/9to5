# 9to5 Scout - API Integration Guide

## Overview

This guide provides comprehensive documentation for integrating with the 9to5 Scout backend API, including authentication, data fetching patterns, error handling, and real-time features.

## API Client Architecture

### 1. Base API Client Setup

```typescript
// src/lib/api/client.ts
import { ApiError } from './errors';
import { getAuthToken, refreshAuthToken } from '../auth';

export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = new URL(endpoint, this.baseURL);
    
    // Add authentication header
    const token = getAuthToken();
    const headers = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url.toString(), {
        ...options,
        headers,
      });

      // Handle authentication errors
      if (response.status === 401) {
        const newToken = await refreshAuthToken();
        if (newToken) {
          headers.Authorization = `Bearer ${newToken}`;
          // Retry the request
          const retryResponse = await fetch(url.toString(), {
            ...options,
            headers,
          });
          return this.handleResponse<T>(retryResponse);
        }
        throw new ApiError(401, 'Authentication failed');
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Network error', error);
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorText;
      } catch {
        // Use text as is
      }

      throw new ApiError(response.status, errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    
    return response.text() as T;
  }

  // HTTP method helpers
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }
    return this.request<T>(url.pathname + url.search);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create singleton instance
export const api = new ApiClient(import.meta.env.PUBLIC_API_BASE);
```

### 2. Error Handling

```typescript
// src/lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  get isServerError() {
    return this.status >= 500;
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

// Error boundary for API errors
export function ApiErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode;
  fallback?: (error: ApiError) => React.ReactNode;
}) {
  return (
    <ErrorBoundary
      fallback={({ error }) => {
        if (error instanceof ApiError) {
          return fallback?.(error) || <DefaultApiErrorDisplay error={error} />;
        }
        throw error; // Re-throw non-API errors
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## Job Discovery API Integration

### 1. Job Listing and Search

```typescript
// src/lib/api/jobs.ts
import { api } from './client';
import type { Job, JobFilters, JobListResponse } from '@/types/api';

export const jobsApi = {
  // List jobs with filters
  async list(filters: JobFilters = {}): Promise<JobListResponse> {
    return api.get<JobListResponse>('/api/jobs', {
      limit: filters.limit || 50,
      offset: filters.offset || 0,
      status: filters.status,
      source: filters.source,
      location: filters.location,
      company: filters.company,
      salary_min: filters.salary_min,
      salary_max: filters.salary_max,
      remote: filters.remote,
      experience_level: filters.experience_level,
      posted_after: filters.posted_after?.toISOString(),
    });
  },

  // Get job details
  async get(jobId: string): Promise<Job> {
    return api.get<Job>(`/api/jobs/${jobId}`);
  },

  // Semantic search
  async search(query: string): Promise<Job[]> {
    return api.get<Job[]>('/api/agent/query', { q: query });
  },

  // Get job tracking information
  async getTracking(jobId: string) {
    return api.get(`/api/jobs/${jobId}/tracking`);
  },

  // Update monitoring settings
  async updateMonitoring(jobId: string, settings: {
    daily_monitoring_enabled?: boolean;
    monitoring_frequency_hours?: number;
  }) {
    return api.put(`/api/jobs/${jobId}/monitoring`, settings);
  },
};

// React Query hooks for jobs
export function useJobs(filters: JobFilters = {}) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => jobsApi.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true,
  });
}

export function useJob(jobId: string) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.get(jobId),
    enabled: !!jobId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useJobSearch(query: string) {
  return useQuery({
    queryKey: ['job-search', query],
    queryFn: () => jobsApi.search(query),
    enabled: query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
```

### 2. Infinite Scrolling Implementation

```typescript
// src/hooks/useInfiniteJobs.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api/jobs';
import type { JobFilters } from '@/types/api';

export function useInfiniteJobs(filters: JobFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['jobs-infinite', filters],
    queryFn: ({ pageParam = 0 }) =>
      jobsApi.list({
        ...filters,
        offset: pageParam,
        limit: 20,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.length * 20;
      return lastPage.jobs.length === 20 ? totalFetched : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Usage in component
export function InfiniteJobList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteJobs();

  const jobs = data?.pages.flatMap(page => page.jobs) ?? [];

  return (
    <div className="job-list">
      {jobs.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
      
      {hasNextPage && (
        <Button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="load-more-button"
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </div>
  );
}
```

## AI Features Integration

### 1. Job Fit Scoring

```typescript
// src/lib/api/ai.ts
import { api } from './client';
import type { JobRating, JobRatingRequest } from '@/types/api';

export const aiApi = {
  // Generate job fit rating
  async generateJobRating(request: JobRatingRequest): Promise<JobRating> {
    return api.post<JobRating>('/api/applicant/job-rating', request);
  },

  // Get all job ratings for user
  async getJobRatings(userId: string): Promise<JobRating[]> {
    return api.get<JobRating[]>(`/api/applicant/${userId}/job-ratings`);
  },

  // Generate cover letter
  async generateCoverLetter(request: CoverLetterRequest): Promise<{
    cover_letter: string;
    html: string;
  }> {
    return api.post('/api/cover-letter', request);
  },

  // Generate resume optimization
  async generateResume(request: ResumeRequest): Promise<{
    summary: string;
    experience_bullets: string[];
    skills: string[];
  }> {
    return api.post('/api/resume', request);
  },
};

// Hooks for AI features
export function useJobRating(userId: string, jobId: string) {
  return useMutation({
    mutationFn: () => aiApi.generateJobRating({ user_id: userId, job_id: jobId }),
    onSuccess: (rating) => {
      // Cache the rating result
      queryClient.setQueryData(['job-rating', userId, jobId], rating);
    },
  });
}

export function useCoverLetterGenerator() {
  return useMutation({
    mutationFn: aiApi.generateCoverLetter,
    onError: (error) => {
      toast.error('Failed to generate cover letter');
    },
  });
}
```

### 2. Content Generation Components

```typescript
// src/components/ai/CoverLetterGenerator.tsx
import { useCoverLetterGenerator } from '@/lib/api/ai';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface CoverLetterGeneratorProps {
  job: Job;
  userProfile: UserProfile;
}

export function CoverLetterGenerator({ job, userProfile }: CoverLetterGeneratorProps) {
  const [generatedContent, setGeneratedContent] = useState('');
  const generateMutation = useCoverLetterGenerator();

  const handleGenerate = () => {
    generateMutation.mutate({
      job_title: job.title,
      company_name: job.company,
      job_description_text: job.description,
      candidate_career_summary: userProfile.summary,
    }, {
      onSuccess: (result) => {
        setGeneratedContent(result.cover_letter);
      },
    });
  };

  return (
    <div className="cover-letter-generator">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">AI Cover Letter Generator</h3>
        <Button 
          onClick={handleGenerate}
          disabled={generateMutation.isLoading}
        >
          {generateMutation.isLoading ? 'Generating...' : 'Generate Cover Letter'}
        </Button>
      </div>

      {generatedContent && (
        <Textarea
          value={generatedContent}
          onChange={(e) => setGeneratedContent(e.target.value)}
          className="min-h-[400px]"
          placeholder="Generated cover letter will appear here..."
        />
      )}

      {generateMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to generate cover letter. Please try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

## Real-Time Features

### 1. WebSocket Integration for Live Updates

```typescript
// src/lib/websocket/client.ts
import { useEffect, useRef, useState } from 'react';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private url: string) {}

  connect(onMessage: (data: any) => void, onError?: (error: Event) => void) {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.reconnect(onMessage, onError);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  private reconnect(onMessage: (data: any) => void, onError?: (error: Event) => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting WebSocket (attempt ${this.reconnectAttempts})`);
        this.connect(onMessage, onError);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

// Hook for WebSocket connections
export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    wsRef.current = new WebSocketClient(url);
    
    wsRef.current.connect(
      (message) => {
        setLastMessage(message);
        setIsConnected(true);
      },
      () => {
        setIsConnected(false);
      }
    );

    return () => {
      wsRef.current?.disconnect();
    };
  }, [url]);

  const sendMessage = (data: any) => {
    wsRef.current?.send(data);
  };

  return { isConnected, lastMessage, sendMessage };
}
```

### 2. Real-Time Job Updates

```typescript
// src/hooks/useJobUpdates.ts
import { useWebSocket } from '@/lib/websocket/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

export function useJobUpdates() {
  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket('/ws/job-updates');

  useEffect(() => {
    if (lastMessage) {
      const { type, data } = lastMessage;

      switch (type) {
        case 'job_updated':
          // Invalidate job queries to refetch
          queryClient.invalidateQueries(['job', data.job_id]);
          queryClient.invalidateQueries(['jobs']);
          
          toast({
            title: 'Job Updated',
            description: `${data.job_title} has been updated`,
          });
          break;

        case 'new_job_match':
          // Add to job cache
          queryClient.setQueryData(['jobs'], (oldData: any) => {
            if (oldData) {
              return {
                ...oldData,
                jobs: [data.job, ...oldData.jobs],
              };
            }
          });

          toast({
            title: 'New Job Match',
            description: `Found a new job that matches your preferences: ${data.job.title}`,
          });
          break;

        case 'job_closed':
          // Update job status in cache
          queryClient.setQueryData(['job', data.job_id], (oldData: any) => {
            if (oldData) {
              return { ...oldData, status: 'closed' };
            }
          });
          break;
      }
    }
  }, [lastMessage, queryClient]);
}

// Usage in app root
export function AppWithRealTimeUpdates({ children }: { children: React.ReactNode }) {
  useJobUpdates();
  return <>{children}</>;
}
```

## Data Synchronization Patterns

### 1. Optimistic Updates

```typescript
// src/hooks/useSaveJob.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api/jobs';

export function useSaveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, action }: { jobId: string; action: 'save' | 'unsave' }) => {
      // Optimistically update the UI
      queryClient.setQueryData(['saved-jobs'], (oldData: string[] = []) => {
        return action === 'save' 
          ? [...oldData, jobId]
          : oldData.filter(id => id !== jobId);
      });

      // Make the API call
      return action === 'save' 
        ? jobsApi.saveJob(jobId)
        : jobsApi.unsaveJob(jobId);
    },
    onError: (error, { jobId, action }) => {
      // Revert optimistic update on error
      queryClient.setQueryData(['saved-jobs'], (oldData: string[] = []) => {
        return action === 'save'
          ? oldData.filter(id => id !== jobId)
          : [...oldData, jobId];
      });

      toast.error('Failed to update saved jobs');
    },
    onSuccess: () => {
      // Optionally show success message
      toast.success('Job saved successfully');
    },
  });
}
```

### 2. Background Data Sync

```typescript
// src/hooks/useBackgroundSync.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useBackgroundSync() {
  const queryClient = useQueryClient();

  // Sync every 5 minutes when tab is visible
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (!document.hidden) {
        // Invalidate stale queries
        queryClient.invalidateQueries(['jobs']);
        queryClient.invalidateQueries(['saved-jobs']);
        queryClient.invalidateQueries(['job-ratings']);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(syncInterval);
  }, [queryClient]);

  // Sync when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        queryClient.invalidateQueries({ stale: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [queryClient]);
}
```

## Error Handling Patterns

### 1. Global Error Handler

```typescript
// src/components/providers/ErrorProvider.tsx
import { createContext, useContext, useState } from 'react';
import { ApiError } from '@/lib/api/errors';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorContextValue {
  errors: ApiError[];
  addError: (error: ApiError) => void;
  removeError: (index: number) => void;
  clearErrors: () => void;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = useState<ApiError[]>([]);

  const addError = (error: ApiError) => {
    setErrors(prev => [...prev, error]);
    // Auto-remove error after 5 seconds
    setTimeout(() => {
      setErrors(prev => prev.filter(e => e !== error));
    }, 5000);
  };

  const removeError = (index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  };

  const clearErrors = () => {
    setErrors([]);
  };

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
      <ErrorDisplay errors={errors} onRemove={removeError} />
    </ErrorContext.Provider>
  );
}

function ErrorDisplay({ 
  errors, 
  onRemove 
}: { 
  errors: ApiError[]; 
  onRemove: (index: number) => void;
}) {
  if (errors.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {errors.map((error, index) => (
        <Alert key={index} variant="destructive" className="max-w-md">
          <AlertDescription>
            {error.message}
            <button
              onClick={() => onRemove(index)}
              className="ml-2 text-xs underline"
            >
              Dismiss
            </button>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
}
```

### 2. Query Error Handling

```typescript
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api/errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on client errors (4xx)
        if (error instanceof ApiError && error.isClientError) {
          return false;
        }
        // Retry up to 3 times for server errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        if (error instanceof ApiError) {
          console.error('Query error:', error.message);
          // Global error handling could go here
        }
      },
    },
    mutations: {
      onError: (error) => {
        if (error instanceof ApiError) {
          console.error('Mutation error:', error.message);
          // Global error handling for mutations
        }
      },
    },
  },
});
```

## Performance Optimization

### 1. Request Deduplication

```typescript
// src/lib/api/request-deduplication.ts
const pendingRequests = new Map<string, Promise<any>>();

export function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

// Usage in API client
export const jobsApi = {
  async get(jobId: string): Promise<Job> {
    return deduplicateRequest(
      `job-${jobId}`,
      () => api.get<Job>(`/api/jobs/${jobId}`)
    );
  },
};
```

### 2. Pagination and Virtual Scrolling

```typescript
// src/components/VirtualJobList.tsx
import { FixedSizeList as List } from 'react-window';
import { useInfiniteJobs } from '@/hooks/useInfiniteJobs';

export function VirtualJobList({ filters }: { filters: JobFilters }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteJobs(filters);

  const jobs = data?.pages.flatMap(page => page.jobs) ?? [];

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const job = jobs[index];
    
    // Load more when near the end
    if (index === jobs.length - 10 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }

    if (!job) {
      return (
        <div style={style} className="p-4">
          <JobCardSkeleton />
        </div>
      );
    }

    return (
      <div style={style} className="p-4">
        <JobCard job={job} />
      </div>
    );
  };

  return (
    <List
      height={600}
      itemCount={jobs.length + (hasNextPage ? 1 : 0)}
      itemSize={200}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

This comprehensive API integration guide provides developers with everything they need to effectively integrate with the 9to5 Scout backend, implement real-time features, handle errors gracefully, and optimize performance for the best user experience.
