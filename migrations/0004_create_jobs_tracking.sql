-- Migration for job tracking and monitoring
-- Based on schema.sql

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  site_id TEXT,
  url TEXT,
  canonical_url TEXT,
  title TEXT,
  company TEXT,
  location TEXT,
  employment_type TEXT,
  department TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT,
  source TEXT,
  status TEXT,
  posted_at TEXT,
  first_seen_at TEXT,
  last_crawled_at TEXT,
  daily_monitoring_enabled INTEGER DEFAULT 0,
  monitoring_frequency_hours INTEGER DEFAULT 24
);

CREATE TABLE IF NOT EXISTS job_snapshots (
  id TEXT PRIMARY KEY,
  job_id TEXT,
  taken_at TEXT,
  r2_key TEXT,
  content_type TEXT
);

CREATE TABLE IF NOT EXISTS job_changes (
  id TEXT PRIMARY KEY,
  job_id TEXT,
  snapshot_id TEXT,
  changed_at TEXT,
  field TEXT,
  old_value TEXT,
  new_value TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_monitoring ON jobs(daily_monitoring_enabled);
CREATE INDEX IF NOT EXISTS idx_job_changes_job_id ON job_changes(job_id);
CREATE INDEX IF NOT EXISTS idx_job_snapshots_job_id ON job_snapshots(job_id);