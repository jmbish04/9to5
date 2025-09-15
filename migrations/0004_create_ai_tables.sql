-- Migration number: 0004    2024-12-24T12:09:00.000Z
-- AI Agent Tables for job matching, content generation, and career coaching

-- AI Agent Requests - Track all AI agent API requests for monitoring and billing
DROP TABLE IF EXISTS ai_agent_requests;
CREATE TABLE ai_agent_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_type TEXT NOT NULL CHECK(agent_type IN ('job_discovery', 'content_generation', 'career_coach', 'market_intelligence')),
    user_id TEXT,
    request_id TEXT UNIQUE NOT NULL,
    endpoint TEXT NOT NULL,
    input_data TEXT, -- JSON serialized input
    response_data TEXT, -- JSON serialized response
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'success', 'error', 'timeout')),
    execution_time_ms INTEGER,
    token_usage INTEGER DEFAULT 0,
    cost_cents INTEGER DEFAULT 0,
    error_message TEXT,
    openai_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- AI Job Matching - Store job fit scores and recommendations
DROP TABLE IF EXISTS ai_job_matches;
CREATE TABLE ai_job_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    applicant_id TEXT NOT NULL,
    job_id TEXT NOT NULL,
    request_id TEXT REFERENCES ai_agent_requests(request_id),
    fit_score INTEGER NOT NULL CHECK(fit_score >= 0 AND fit_score <= 100),
    confidence_score REAL CHECK(confidence_score >= 0 AND confidence_score <= 1),
    match_reasons TEXT, -- JSON array of reasons
    skill_match_score INTEGER,
    experience_match_score INTEGER,
    location_match_score INTEGER,
    salary_match_score INTEGER,
    culture_match_score INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES applicant(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- AI Generated Content - Store generated cover letters, resumes, etc.
DROP TABLE IF EXISTS ai_generated_content;
CREATE TABLE ai_generated_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    applicant_id TEXT NOT NULL,
    job_id TEXT,
    request_id TEXT REFERENCES ai_agent_requests(request_id),
    content_type TEXT NOT NULL CHECK(content_type IN ('cover_letter', 'resume_optimization', 'email_template', 'interview_prep')),
    content TEXT NOT NULL,
    quality_metrics TEXT, -- JSON with quality scores
    is_favorite BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES applicant(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- AI Career Insights - Store career coaching recommendations and analysis
DROP TABLE IF EXISTS ai_career_insights;
CREATE TABLE ai_career_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    applicant_id TEXT NOT NULL,
    request_id TEXT REFERENCES ai_agent_requests(request_id),
    insight_type TEXT NOT NULL CHECK(insight_type IN ('career_path', 'skill_gaps', 'learning_path', 'salary_guidance', 'interview_prep')),
    current_role TEXT,
    target_role TEXT,
    insights TEXT NOT NULL, -- JSON with structured insights
    confidence_score REAL CHECK(confidence_score >= 0 AND confidence_score <= 1),
    actionable_items TEXT, -- JSON array of recommended actions
    estimated_timeline TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- When this insight becomes stale
    FOREIGN KEY (applicant_id) REFERENCES applicant(id)
);

-- AI Market Intelligence - Store market analysis and trends
DROP TABLE IF EXISTS ai_market_intelligence;
CREATE TABLE ai_market_intelligence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT REFERENCES ai_agent_requests(request_id),
    analysis_type TEXT NOT NULL CHECK(analysis_type IN ('salary_analysis', 'market_trends', 'company_analysis', 'skill_demand', 'geographic_analysis')),
    scope TEXT, -- e.g., 'san-francisco', 'frontend-developer', 'tech-corp'
    data TEXT NOT NULL, -- JSON with analysis results
    confidence_score REAL CHECK(confidence_score >= 0 AND confidence_score <= 1),
    data_sources TEXT, -- JSON array of data sources used
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL -- Market data becomes stale quickly
);

-- User Preferences for AI - Store user preferences for AI behavior
DROP TABLE IF EXISTS ai_user_preferences;
CREATE TABLE ai_user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    applicant_id TEXT NOT NULL UNIQUE,
    agent_preferences TEXT, -- JSON with per-agent preferences
    content_style TEXT DEFAULT 'professional', -- professional, enthusiastic, conservative
    communication_tone TEXT DEFAULT 'balanced', -- formal, balanced, casual
    privacy_level TEXT DEFAULT 'standard' CHECK(privacy_level IN ('minimal', 'standard', 'detailed')),
    auto_generate_enabled BOOLEAN DEFAULT TRUE,
    feedback_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES applicant(id)
);

-- Create indexes for better performance
CREATE INDEX idx_ai_agent_requests_agent_type ON ai_agent_requests(agent_type);
CREATE INDEX idx_ai_agent_requests_user_id ON ai_agent_requests(user_id);
CREATE INDEX idx_ai_agent_requests_created_at ON ai_agent_requests(created_at);
CREATE INDEX idx_ai_agent_requests_status ON ai_agent_requests(status);

CREATE INDEX idx_ai_job_matches_applicant_id ON ai_job_matches(applicant_id);
CREATE INDEX idx_ai_job_matches_job_id ON ai_job_matches(job_id);
CREATE INDEX idx_ai_job_matches_fit_score ON ai_job_matches(fit_score);

CREATE INDEX idx_ai_generated_content_applicant_id ON ai_generated_content(applicant_id);
CREATE INDEX idx_ai_generated_content_job_id ON ai_generated_content(job_id);
CREATE INDEX idx_ai_generated_content_type ON ai_generated_content(content_type);

CREATE INDEX idx_ai_career_insights_applicant_id ON ai_career_insights(applicant_id);
CREATE INDEX idx_ai_career_insights_type ON ai_career_insights(insight_type);
CREATE INDEX idx_ai_career_insights_expires_at ON ai_career_insights(expires_at);

CREATE INDEX idx_ai_market_intelligence_analysis_type ON ai_market_intelligence(analysis_type);
CREATE INDEX idx_ai_market_intelligence_expires_at ON ai_market_intelligence(expires_at);

-- Update triggers
CREATE TRIGGER update_ai_user_preferences_updated_at 
    AFTER UPDATE ON ai_user_preferences
    BEGIN
        UPDATE ai_user_preferences 
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
    END;