-- Migration for AI agent configuration and orchestration
-- Core platform foundation for agent management

CREATE TABLE IF NOT EXISTS agent_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'job_discovery', 'career_coach', 'content_generation', 'market_intelligence'
  enabled INTEGER DEFAULT 1,
  model TEXT DEFAULT 'gpt-4',
  temperature REAL DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4000,
  timeout_ms INTEGER DEFAULT 30000,
  rate_limit_per_minute INTEGER DEFAULT 60,
  description TEXT,
  capabilities TEXT, -- JSON array of capabilities
  configuration TEXT, -- JSON object for agent-specific config
  created_at TEXT,
  updated_at TEXT
);

-- Task definitions for automated workflows
CREATE TABLE IF NOT EXISTS agent_tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  agent_id TEXT,
  description TEXT,
  schedule_pattern TEXT, -- cron-like pattern
  enabled INTEGER DEFAULT 1,
  last_run_at TEXT,
  next_run_at TEXT,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  configuration TEXT, -- JSON object for task-specific config
  created_at TEXT,
  updated_at TEXT
);

-- Workflow orchestration
CREATE TABLE IF NOT EXISTS agent_workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  enabled INTEGER DEFAULT 1,
  steps TEXT, -- JSON array of workflow steps
  trigger_conditions TEXT, -- JSON object defining when to trigger
  success_actions TEXT, -- JSON array of actions on success
  failure_actions TEXT, -- JSON array of actions on failure
  created_at TEXT,
  updated_at TEXT
);

-- Performance monitoring and analytics
CREATE TABLE IF NOT EXISTS agent_performance (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  request_type TEXT,
  response_time_ms INTEGER,
  success INTEGER, -- 0 or 1
  error_message TEXT,
  user_satisfaction INTEGER, -- 1-5 rating if available
  tokens_used INTEGER,
  cost_estimate REAL,
  created_at TEXT
);

-- Email configuration for notifications
CREATE TABLE IF NOT EXISTS email_config (
  id TEXT PRIMARY KEY,
  recipient_email TEXT,
  include_new_jobs INTEGER DEFAULT 0,
  include_job_changes INTEGER DEFAULT 0,
  include_statistics INTEGER DEFAULT 0,
  frequency_hours INTEGER DEFAULT 24,
  last_sent_at TEXT,
  enabled INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY,
  created_at TEXT,
  from_email TEXT,
  to_email TEXT,
  subject TEXT,
  job_links_extracted INTEGER,
  jobs_processed INTEGER,
  status TEXT,
  notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_configs_type ON agent_configs(type);
CREATE INDEX IF NOT EXISTS idx_agent_configs_enabled ON agent_configs(enabled);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_id ON agent_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_enabled ON agent_tasks(enabled);
CREATE INDEX IF NOT EXISTS idx_agent_workflows_enabled ON agent_workflows(enabled);
CREATE INDEX IF NOT EXISTS idx_agent_performance_agent_id ON agent_performance(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_performance_created_at ON agent_performance(created_at);
CREATE INDEX IF NOT EXISTS idx_email_config_enabled ON email_config(enabled);