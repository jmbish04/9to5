import { getApiBase } from './config';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('API error', res.status, path, text);
    throw new Error(`API ${res.status} ${path}`);
  }
  return res.json() as Promise<T>;
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

// Monitoring
export const getMonitoringStatus = () =>
  req<{ last_run_at?: string; next_scheduled_at?: string; queued?: number; recent_counts?: Record<string, number> }>('/api/monitoring/status');
export const runMonitor = () =>
  req<{ run_id: string; status: string }>('/api/runs/monitor', { method: 'POST' });

// Jobs
export const listJobs = (q: { limit?: number; offset?: number; status?: string; source?: string } = {}) =>
  req<any[]>(
    '/api/jobs?' +
      new URLSearchParams(
        Object.entries(q)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)])
      ).toString()
  );
export const getJob = (id: string) => req<any>(`/api/jobs/${id}`);
export const getJobTracking = (id: string) => req<any>(`/api/jobs/${id}/tracking`);
export const updateJobMonitoring = (
  id: string,
  body: { daily_monitoring_enabled?: boolean; monitoring_frequency_hours?: number }
) => req<any>(`/api/jobs/${id}/monitoring`, { method: 'PUT', body: JSON.stringify(body) });

// Applicant & AI
export const getApplicant = () => req<any>('/api/applicant');
export const getApplicantHistory = () => req<any>('/api/applicant/history');
export const submitApplicantHistory = (body: {
  user_id: string;
  raw_content: string;
  content_type?: 'text/plain' | 'text/markdown' | 'application/json';
}) =>
  req<{ success: boolean; submission_id: string; applicant_id: string; entries_processed: number; entries: unknown[] }>(
    '/api/applicant/history',
    { method: 'POST', body: JSON.stringify(body) }
  );
export const rateJob = (body: { job_id: string; rating: number; rationale?: string }) =>
  req<{ success: boolean }>(`/api/applicant/job-rating`, { method: 'POST', body: JSON.stringify(body) });
export const generateCoverLetter = (body: any) =>
  req<{ cover_letter: string; html?: string }>(`/api/cover-letter`, { method: 'POST', body: JSON.stringify(body) });
export const generateResume = (body: any) =>
  req<{ summary: string; experience_bullets: string[]; skills: string[] }>(`/api/resume`, { method: 'POST', body: JSON.stringify(body) });
export const createCoverLetter = generateCoverLetter;
export const createResume = generateResume;
export const generateJobRating = rateJob;

// Email
export const getEmailConfigs = () => req<{ configs: any[] }>(`/api/email/configs`);
export const updateEmailConfigs = (cfg: any) =>
  req<{ success: boolean }>(`/api/email/configs`, { method: 'PUT', body: JSON.stringify(cfg) });
export const getEmailLogs = (q: { limit?: number } = {}) =>
  req<{ logs: any[] }>(
    '/api/email/logs?' +
      new URLSearchParams(
        Object.entries(q)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)])
      ).toString()
  );
export const sendEmailInsights = () =>
  req<{ success: boolean; message: string }>(`/api/email/insights/send`, { method: 'POST' });

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
