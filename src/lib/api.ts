import qs from 'qs';
import type { paths } from './types/openapi';

export const API_BASE = 'https://9to5-scout.hacolby.workers.dev';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

// Typed helpers for key endpoints

export type ListJobsParams = paths['/api/jobs']['get']['parameters']['query'];
export type Job = paths['/api/jobs']['get']['responses']['200']['content']['application/json'][number];
export async function listJobs(params?: ListJobsParams) {
  const query = params ? `?${qs.stringify(params)}` : '';
  return http<paths['/api/jobs']['get']['responses']['200']['content']['application/json']>(`/api/jobs${query}`);
}

export type GetJobResponse = paths['/api/jobs/{id}']['get']['responses']['200']['content']['application/json'];
export async function getJob(id: string) {
  return http<GetJobResponse>(`/api/jobs/${id}`);
}

export type GetJobTrackingResponse = paths['/api/jobs/{id}/tracking']['get']['responses']['200']['content']['application/json'];
export async function getJobTracking(id: string) {
  return http<GetJobTrackingResponse>(`/api/jobs/${id}/tracking`);
}

export type UpdateJobMonitoringBody = paths['/api/jobs/{id}/monitoring']['put']['requestBody']['content']['application/json'];
export type UpdateJobMonitoringResponse = paths['/api/jobs/{id}/monitoring']['put']['responses']['200']['content']['application/json'];
export async function updateJobMonitoring(id: string, body: UpdateJobMonitoringBody) {
  return http<UpdateJobMonitoringResponse>(`/api/jobs/${id}/monitoring`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export type MonitoringStatusResponse = paths['/api/monitoring/status']['get']['responses']['200']['content']['application/json'];
export async function getMonitoringStatus() {
  return http<MonitoringStatusResponse>('/api/monitoring/status');
}

export type SubmitApplicantHistoryBody = paths['/api/applicant/history']['post']['requestBody']['content']['application/json'];
export type SubmitApplicantHistoryResponse = paths['/api/applicant/history']['post']['responses']['200']['content']['application/json'];
export async function submitApplicantHistory(body: SubmitApplicantHistoryBody) {
  return http<SubmitApplicantHistoryResponse>('/api/applicant/history', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export type GetApplicantHistoryResponse = paths['/api/applicant/{user_id}/history']['get']['responses']['200']['content']['application/json'];
export async function getApplicantHistory(userId: string) {
  return http<GetApplicantHistoryResponse>(`/api/applicant/${userId}/history`);
}

export type CoverLetterBody = paths['/api/cover-letter']['post']['requestBody']['content']['application/json'];
export type CoverLetterResponse = paths['/api/cover-letter']['post']['responses']['200']['content']['application/json'];
export async function createCoverLetter(body: CoverLetterBody) {
  return http<CoverLetterResponse>('/api/cover-letter', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export type ResumeBody = paths['/api/resume']['post']['requestBody']['content']['application/json'];
export type ResumeResponse = paths['/api/resume']['post']['responses']['200']['content']['application/json'];
export async function createResume(body: ResumeBody) {
  return http<ResumeResponse>('/api/resume', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export type EmailLogsParams = paths['/api/email/logs']['get']['parameters']['query'];
export type EmailLogsResponse = paths['/api/email/logs']['get']['responses']['200']['content']['application/json'];
export async function getEmailLogs(params?: EmailLogsParams) {
  const query = params ? `?${qs.stringify(params)}` : '';
  return http<EmailLogsResponse>(`/api/email/logs${query}`);
}

export type SemanticSearchParams = paths['/api/agent/query']['get']['parameters']['query'];
export type SemanticSearchResponse = paths['/api/agent/query']['get']['responses']['200']['content']['application/json'];
export async function semanticJobSearch(params: SemanticSearchParams) {
  const query = `?${qs.stringify(params)}`;
  return http<SemanticSearchResponse>(`/api/agent/query${query}`);
}

export default {
  listJobs,
  getJob,
  getJobTracking,
  updateJobMonitoring,
  getMonitoringStatus,
  submitApplicantHistory,
  getApplicantHistory,
  createCoverLetter,
  createResume,
  getEmailLogs,
  semanticJobSearch,
};
