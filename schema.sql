-- Schema for job monitoring and applicant support

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

CREATE TABLE IF NOT EXISTS applicant (
  id TEXT PRIMARY KEY,
  email TEXT,
  phone TEXT,
  current_title TEXT,
  target_roles TEXT,
  skills TEXT
);

CREATE TABLE IF NOT EXISTS applicant_history (
  id TEXT PRIMARY KEY,
  applicant_id TEXT,
  job_id TEXT,
  action TEXT,
  created_at TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS email_config (
  id TEXT PRIMARY KEY,
  recipient_email TEXT,
  include_new_jobs INTEGER,
  include_job_changes INTEGER,
  include_statistics INTEGER,
  frequency_hours INTEGER,
  last_sent_at TEXT
);

CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY,
  created_at TEXT,
  from_email TEXT,
  subject TEXT,
  job_links_extracted INTEGER,
  jobs_processed INTEGER,
  notes TEXT
);
