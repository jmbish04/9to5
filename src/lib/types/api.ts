// Extend temporary types for Applicant & AI tools (replace with generated types later)
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

/* ===== Applicant & AI types (subset from OpenAPI) ===== */

export interface ApplicantProfile {
  id?: string;
  user_id: string;
  name?: string;
  email?: string;
  phone?: string;
  current_title?: string;
  target_roles?: string[];
  years_experience?: number;
  education_level?: string;
  skills?: string[];
  preferences?: {
    locations?: string[];
    salary_min?: number;
    salary_max?: number;
    employment_types?: string[];
    remote_preference?: 'required' | 'preferred' | 'no_preference';
  };
  created_at?: string;
  updated_at?: string;
}

export interface JobHistoryEntry {
  id: string;
  applicant_id: string;
  company_name?: string;
  job_title?: string;
  department?: string;
  employment_type?: string;
  start_date?: string; // date
  end_date?: string;   // date
  is_current?: boolean;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  responsibilities?: string; // markdown
  achievements?: string;     // markdown
  skills_used?: string[];
  technologies?: string[];
  keywords?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface JobHistorySubmission {
  id: string;
  applicant_id: string;
  raw_content: string;
  content_type: 'text/plain' | 'text/markdown' | 'application/json';
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error?: string;
  processed_entries?: number;
  submitted_at?: string;
  processed_at?: string;
}

export interface ApplicantHistoryResponse {
  applicant?: ApplicantProfile | null;
  job_history: JobHistoryEntry[];
  submissions: JobHistorySubmission[];
}

export interface CoverLetterResponse {
  cover_letter: string;
  html?: string;
}

export interface ResumeResponse {
  summary: string;
  experience_bullets: string[];
  skills: string[];
}

export interface JobRating {
  id: string;
  applicant_id: string;
  job_id: string;
  overall_score: number; // 1-100
  skill_match_score?: number;
  experience_match_score?: number;
  compensation_fit_score?: number;
  location_fit_score?: number;
  company_culture_score?: number;
  growth_potential_score?: number;
  rating_summary?: string;
  recommendation?: 'Strong Match' | 'Good Fit' | 'Consider' | 'Pass';
  strengths?: string[];
  gaps?: string[];
  improvement_suggestions?: string;
  created_at?: string;
  updated_at?: string;
}
