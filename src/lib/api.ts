// Add Applicant & AI endpoints (Milestone 2)
import type { paths, operations, components } from './types/openapi';
// Import legacy types for schemas that aren't fully defined in OpenAPI yet
import type {
  ApplicantProfile,
  JobHistoryEntry,
  JobHistorySubmission,
  JobRating
} from './types/api';

// Use the specified API base URL from the requirements
const API_BASE = 'https://9to5-scout.hacolby.workers.dev';

// Type aliases for better readability and to handle missing OpenAPI schema definitions
type MonitoringStatusResponse = operations['getMonitoringStatus']['responses']['200']['content']['application/json'];
type JobsListResponse = operations['listJobs']['responses']['200']['content']['application/json'];
type JobResponse = operations['getJob']['responses']['200']['content']['application/json'];
type JobTrackingResponse = operations['getJobTracking']['responses']['200']['content']['application/json'];
type CoverLetterResponse = operations['generateCoverLetter']['responses']['200']['content']['application/json'];
type ResumeResponse = operations['generateResume']['responses']['200']['content']['application/json'];

// For endpoints with missing schemas, use legacy types with proper interface
type ApplicantHistoryResponse = {
  applicant?: ApplicantProfile | null;
  job_history: JobHistoryEntry[];
  submissions: JobHistorySubmission[];
};

type SubmitJobHistoryResponse = {
  success: boolean;
  submission_id: string;
  applicant_id: string;
  entries_processed: number;
  entries: JobHistoryEntry[];
};

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} :: ${text}`.slice(0, 2048));
  }
  // some endpoints may return empty
  if (res.status === 204) return undefined as unknown as T;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

export function validateApiTokenResponse(
  request: Request,
  apiToken: string,
): Response | undefined {
  const authHeader = request.headers.get('Authorization');
  const xApiTokenHeader = request.headers.get('x-api-token');

  let token: string | null = null;

  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring('Bearer '.length).trim();
    } else if (authHeader.startsWith('Token ')) {
      token = authHeader.substring('Token '.length).trim();
    }
  } else if (xApiTokenHeader) {
    token = xApiTokenHeader.trim();
  }

  const timingSafeEqual = (a: string, b: string): boolean => {
    if (a.length !== b.length) {
      return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  };

  if (!token || !timingSafeEqual(token, apiToken)) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  return undefined;
}

export async function getMonitoringStatus(): Promise<MonitoringStatusResponse> {
  return http<MonitoringStatusResponse>('/api/monitoring/status');
}

export interface ListJobsParams {
  limit?: number;
  offset?: number;
  status?: 'open' | 'closed';
  source?: 'SCRAPED' | 'EMAIL' | 'MANUAL';
}
export async function listJobs(params: ListJobsParams = {}): Promise<JobsListResponse> {
  const qs = new URLSearchParams();
  if (params.limit != null) qs.set('limit', String(params.limit));
  if (params.offset != null) qs.set('offset', String(params.offset));
  if (params.status) qs.set('status', params.status);
  if (params.source) qs.set('source', params.source);
  const q = qs.toString();
  return http<JobsListResponse>(`/api/jobs${q ? `?${q}` : ''}`);
}

export async function getJob(id: string): Promise<JobResponse> {
  return http<JobResponse>(`/api/jobs/${encodeURIComponent(id)}`);
}

export async function getJobTracking(id: string): Promise<JobTrackingResponse> {
  return http<JobTrackingResponse>(`/api/jobs/${encodeURIComponent(id)}/tracking`);
}

export async function updateJobMonitoring(id: string, body: {
  daily_monitoring_enabled?: boolean;
  monitoring_frequency_hours?: number;
}): Promise<JobResponse> {
  return http<JobResponse>(`/api/jobs/${encodeURIComponent(id)}/monitoring`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

/* ===== Applicant & AI endpoints ===== */

export async function getApplicantHistory(userId: string): Promise<ApplicantHistoryResponse> {
  return http<ApplicantHistoryResponse>(`/api/applicant/${encodeURIComponent(userId)}/history`);
}

export async function submitApplicantHistory(body: {
  user_id: string;
  raw_content: string;
  content_type?: 'text/plain' | 'text/markdown' | 'application/json';
}): Promise<SubmitJobHistoryResponse> {
  return http<SubmitJobHistoryResponse>(`/api/applicant/history`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function createCoverLetter(body: {
  job_title: string;
  company_name: string;
  job_description_text: string;
  candidate_career_summary: string;
  hiring_manager_name?: string;
}): Promise<CoverLetterResponse> {
  return http<CoverLetterResponse>(`/api/cover-letter`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function createResume(body: {
  job_title: string;
  company_name: string;
  job_description_text: string;
  candidate_career_summary: string;
}): Promise<ResumeResponse> {
  return http<ResumeResponse>(`/api/resume`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function generateJobRating(body: {
  user_id: string;
  job_id: string;
}): Promise<JobRating> {
  return http<JobRating>(`/api/applicant/job-rating`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

// Utility
export function fmtDateTime(ts?: string) {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    return d.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
  } catch {
    return ts;
  }
}
