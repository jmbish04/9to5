// Temporary hand-written types for Milestone 1.
// Replace with generated types after you add `openapi-typescript` and run `pnpm types:api`.

export type SourceType = 'SCRAPED' | 'EMAIL' | 'MANUAL';

export interface Job {
  id: string;
  site_id?: string;
  url?: string;
  canonical_url?: string;
  title?: string;
  company?: string;
  location?: string;
  employment_type?: string;
  department?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  source?: SourceType;
  status?: string;
  posted_at?: string;
  first_seen_at?: string;
}

export interface JobTrackingHistory {
  id: string;
  job_id: string;
  tracking_date: string; // date
  status: 'checked' | 'changed' | 'closed' | 'error';
  change_summary?: string;
  snapshot_id?: string;
  content_hash?: string;
  r2_keys?: {
    html_key?: string;
    pdf_key?: string;
    markdown_key?: string;
    screenshot_key?: string;
  };
  created_at?: string;
}

export interface Snapshot {
  id: string;
  job_id: string;
  content_hash?: string;
  title?: string;
  description_html?: string;
  description_md?: string;
  company?: string;
  location?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  status?: string;
  r2_storage_keys?: {
    html_key?: string;
    pdf_key?: string;
    markdown_key?: string;
    screenshot_key?: string;
  };
  created_at?: string;
}

export interface Change {
  id: string;
  job_id: string;
  change_type: 'content' | 'status' | 'closed' | 'salary';
  field_changed?: string;
  old_value?: string;
  new_value?: string;
  ai_summary?: string;
  change_severity?: 'low' | 'medium' | 'high' | 'critical';
  detected_at?: string;
}

export interface MonitoringStatus {
  active_jobs_monitored: number;
  jobs_needing_check: number;
  last_updated: string; // date-time
  recent_activity?: Array<{
    tracking_date: string;
    jobs_checked: number;
    jobs_modified: number;
    jobs_closed: number;
    errors: number;
  }>;
  market_statistics?: Array<{
    date?: string;
    role?: string;
    company?: string;
    location?: string;
    total_jobs?: number;
    new_jobs?: number;
    closed_jobs?: number;
    avg_salary_min?: number;
    avg_salary_max?: number;
    salary_trend?: string;
    top_skills?: string[];
    employment_types?: Record<string, number>;
  }>;
}

export interface JobTrackingPayload {
  job: Job;
  timeline: JobTrackingHistory[];
  snapshots: Snapshot[];
  changes: Change[];
}
