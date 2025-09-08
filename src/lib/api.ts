// Add Applicant & AI endpoints (Milestone 2)
import type {
  Job,
  MonitoringStatus,
  JobTrackingPayload,
  ApplicantHistoryResponse,
  CoverLetterResponse,
  ResumeResponse,
  JobRating
} from './types/api';

const API_BASE = 'https://9to5-scout.hacolby.workers.dev';

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

export async function validateApiTokenResponse(
  request: Request,
  apiToken: string,
): Promise<Response | undefined> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (token !== apiToken) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }
  return undefined;
}

export async function getMonitoringStatus(): Promise<MonitoringStatus> {
  return http<MonitoringStatus>('/api/monitoring/status');
}

export interface ListJobsParams {
  limit?: number;
  offset?: number;
  status?: 'open' | 'closed';
  source?: 'SCRAPED' | 'EMAIL' | 'MANUAL';
}
export async function listJobs(params: ListJobsParams = {}): Promise<Job[]> {
  const qs = new URLSearchParams();
  if (params.limit != null) qs.set('limit', String(params.limit));
  if (params.offset != null) qs.set('offset', String(params.offset));
  if (params.status) qs.set('status', params.status);
  if (params.source) qs.set('source', params.source);
  const q = qs.toString();
  return http<Job[]>(`/api/jobs${q ? `?${q}` : ''}`);
}

export async function getJob(id: string): Promise<Job> {
  return http<Job>(`/api/jobs/${encodeURIComponent(id)}`);
}

export async function getJobTracking(id: string): Promise<JobTrackingPayload> {
  return http<JobTrackingPayload>(`/api/jobs/${encodeURIComponent(id)}/tracking`);
}

export async function updateJobMonitoring(id: string, body: {
  daily_monitoring_enabled?: boolean;
  monitoring_frequency_hours?: number;
}): Promise<Job> {
  return http<Job>(`/api/jobs/${encodeURIComponent(id)}/monitoring`, {
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
}): Promise<{
  success: boolean;
  submission_id: string;
  applicant_id: string;
  entries_processed: number;
  entries: unknown[];
}> {
  return http(`/api/applicant/history`, {
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