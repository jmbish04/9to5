-- Migration for applicant profiles and history
-- Enhanced applicant management and AI agent support

CREATE TABLE IF NOT EXISTS applicant (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  current_title TEXT,
  target_roles TEXT,
  skills TEXT,
  experience_years INTEGER,
  resume_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  preferences TEXT, -- JSON string for user preferences
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS applicant_history (
  id TEXT PRIMARY KEY,
  applicant_id TEXT,
  job_id TEXT,
  action TEXT, -- 'viewed', 'saved', 'applied', 'interview', 'offer', 'rejected'
  created_at TEXT,
  notes TEXT,
  application_status TEXT,
  follow_up_date TEXT
);

-- User profiles for personalized AI recommendations
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE,
  career_level TEXT, -- 'entry', 'mid', 'senior', 'executive'
  industry_preferences TEXT, -- JSON array of preferred industries
  location_preferences TEXT, -- JSON array of preferred locations
  salary_expectations TEXT, -- JSON object with min/max
  work_type_preferences TEXT, -- 'remote', 'hybrid', 'onsite', 'flexible'
  skills_primary TEXT, -- JSON array of primary skills
  skills_learning TEXT, -- JSON array of skills to learn
  career_goals TEXT, -- Long-term career objectives
  ai_preferences TEXT, -- JSON object for AI agent preferences
  created_at TEXT,
  updated_at TEXT
);

-- Agent interaction logs for improving recommendations
CREATE TABLE IF NOT EXISTS agent_interactions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  agent_type TEXT, -- 'job_discovery', 'career_coach', 'content_generation', 'market_intelligence'
  request_type TEXT,
  query TEXT,
  response_summary TEXT,
  satisfaction_score INTEGER, -- 1-5 rating
  created_at TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_applicant_email ON applicant(email);
CREATE INDEX IF NOT EXISTS idx_applicant_history_user ON applicant_history(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applicant_history_job ON applicant_history(job_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_user ON agent_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_type ON agent_interactions(agent_type);