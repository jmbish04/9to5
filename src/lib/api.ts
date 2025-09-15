// Typed API client using generated OpenAPI types
import type { paths, components, operations } from './types/openapi';
import { getApiBase } from './config';
// Import legacy types for schemas that aren't fully defined in OpenAPI yet
import type {
  ApplicantProfile,
  JobHistoryEntry,
  JobHistorySubmission,
} from './types/api';


// Type aliases for easier usage
type Job = components['schemas']['Job'];
type AgentConfig = components['schemas']['AgentConfig'];
type TaskConfig = components['schemas']['TaskConfig'];
type WorkflowConfig = components['schemas']['WorkflowConfig'];
type MonitoringStatus = operations['getMonitoringStatus']['responses']['200']['content']['application/json'];
type JobTrackingPayload = operations['getJobTracking']['responses']['200']['content']['application/json'];

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('API error', res.status, path, text);
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

export async function getMonitoringStatus(): Promise<MonitoringStatus> {
  return req<MonitoringStatus>('/api/monitoring/status');
}

export const runMonitor = () =>
  req<{ run_id: string; status: string }>('/api/runs/monitor', { method: 'POST' });

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
  return req<Job[]>(`/api/jobs${q ? `?${q}` : ''}`);
}

export async function getJob(id: string): Promise<Job> {
  return req<Job>(`/api/jobs/${encodeURIComponent(id)}`);
}

export async function getJobTracking(id: string): Promise<JobTrackingPayload> {
  return req<JobTrackingPayload>(`/api/jobs/${encodeURIComponent(id)}/tracking`);
}

export async function updateJobMonitoring(id: string, body: {
  daily_monitoring_enabled?: boolean;
  monitoring_frequency_hours?: number;
}): Promise<Job> {
  return req<Job>(`/api/jobs/${encodeURIComponent(id)}/monitoring`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

export async function getSnapshotContent(jobId: string, snapshotId: string): Promise<string> {
  return http<string>(`/api/jobs/${encodeURIComponent(jobId)}/snapshots/${encodeURIComponent(snapshotId)}/content`);
}

/* ===== Applicant & AI endpoints ===== */

export const getApplicant = () => req<any>('/api/applicant');

export async function getApplicantHistory(userId: string): Promise<operations['getJobHistory']['responses']['200']['content']['application/json']> {
  return req(`/api/applicant/${encodeURIComponent(userId)}/history`);
}

export async function submitApplicantHistory(body: {
  user_id: string;
  raw_content: string;
  content_type?: 'text/plain' | 'text/markdown' | 'application/json';
}): Promise<operations['submitJobHistory']['responses']['200']['content']['application/json']> {
  return req(`/api/applicant/history`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export const rateJob = (body: { job_id: string; rating: number; rationale?: string }) =>
  req<{ success: boolean }>(`/api/applicant/job-rating`, { method: 'POST', body: JSON.stringify(body) });

export async function createCoverLetter(body: {
  job_title: string;
  company_name: string;
  job_description_text: string;
  candidate_career_summary: string;
  hiring_manager_name?: string;
}): Promise<operations['generateCoverLetter']['responses']['200']['content']['application/json']> {
  return req(`/api/cover-letter`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function createResume(body: {
  job_title: string;
  company_name: string;
  job_description_text: string;
  candidate_career_summary: string;
}): Promise<operations['generateResume']['responses']['200']['content']['application/json']> {
  return req(`/api/resume`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function generateJobRating(body: {
  user_id: string;
  job_id: string;
}): Promise<components['schemas']['JobRating']> {
  return req(`/api/applicant/job-rating`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

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

/* ===== Agents, Tasks, and Workflows endpoints ===== */

export async function listAgents(params: { enabled?: boolean } = {}): Promise<AgentConfig[]> {
  const qs = new URLSearchParams();
  if (params.enabled !== undefined) qs.set('enabled', String(params.enabled));
  const q = qs.toString();
  return req<AgentConfig[]>(`/api/agents${q ? `?${q}` : ''}`);
}

export async function getAgent(id: string): Promise<AgentConfig> {
  return req<AgentConfig>(`/api/agents/${encodeURIComponent(id)}`);
}

export async function createAgent(body: AgentConfig): Promise<AgentConfig> {
  return req<AgentConfig>('/api/agents', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function updateAgent(id: string, body: AgentConfig): Promise<AgentConfig> {
  return req<AgentConfig>(`/api/agents/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

export async function deleteAgent(id: string): Promise<void> {
  return req<void>(`/api/agents/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

export async function listTasks(params: { enabled?: boolean; agent_id?: string } = {}): Promise<TaskConfig[]> {
  const qs = new URLSearchParams();
  if (params.enabled !== undefined) qs.set('enabled', String(params.enabled));
  if (params.agent_id) qs.set('agent_id', params.agent_id);
  const q = qs.toString();
  return req<TaskConfig[]>(`/api/tasks${q ? `?${q}` : ''}`);
}

export async function getTask(id: string): Promise<TaskConfig> {
  return req<TaskConfig>(`/api/tasks/${encodeURIComponent(id)}`);
}

export async function createTask(body: TaskConfig): Promise<TaskConfig> {
  return req<TaskConfig>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function updateTask(id: string, body: TaskConfig): Promise<TaskConfig> {
  return req<TaskConfig>(`/api/tasks/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

export async function deleteTask(id: string): Promise<void> {
  return req<void>(`/api/tasks/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

export async function listWorkflows(params: { enabled?: boolean } = {}): Promise<WorkflowConfig[]> {
  const qs = new URLSearchParams();
  if (params.enabled !== undefined) qs.set('enabled', String(params.enabled));
  const q = qs.toString();
  return req<WorkflowConfig[]>(`/api/workflows${q ? `?${q}` : ''}`);
}

export async function getWorkflow(id: string): Promise<WorkflowConfig> {
  return req<WorkflowConfig>(`/api/workflows/${encodeURIComponent(id)}`);
}

export async function createWorkflow(body: WorkflowConfig): Promise<WorkflowConfig> {
  return req<WorkflowConfig>('/api/workflows', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function updateWorkflow(id: string, body: WorkflowConfig): Promise<WorkflowConfig> {
  return req<WorkflowConfig>(`/api/workflows/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

export async function deleteWorkflow(id: string): Promise<void> {
  return req<void>(`/api/workflows/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

export async function executeWorkflow(id: string, body?: { context?: Record<string, any> }): Promise<operations['executeWorkflow']['responses']['200']['content']['application/json']> {
  return req(`/api/workflows/${encodeURIComponent(id)}/execute`, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined
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