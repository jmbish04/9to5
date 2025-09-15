// Database service for AI agents
import type { 
  AgentRequest 
} from '../types';

// AI Agent Request tracking
export interface AIAgentRequestRecord {
  id?: number;
  agent_type: 'job_discovery' | 'content_generation' | 'career_coach' | 'market_intelligence';
  user_id?: string;
  request_id: string;
  endpoint: string;
  input_data?: string; // JSON
  response_data?: string; // JSON
  status: 'pending' | 'success' | 'error' | 'timeout';
  execution_time_ms?: number;
  token_usage?: number;
  cost_cents?: number;
  error_message?: string;
  openai_used?: boolean;
  created_at?: string;
  completed_at?: string;
}

// AI Job Match record
export interface AIJobMatchRecord {
  id?: number;
  applicant_id: string;
  job_id: string;
  request_id?: string;
  fit_score: number;
  confidence_score?: number;
  match_reasons?: string; // JSON
  skill_match_score?: number;
  experience_match_score?: number;
  location_match_score?: number;
  salary_match_score?: number;
  culture_match_score?: number;
  created_at?: string;
}

// AI Generated Content record
export interface AIGeneratedContentRecord {
  id?: number;
  applicant_id: string;
  job_id?: string;
  request_id?: string;
  content_type: 'cover_letter' | 'resume_optimization' | 'email_template' | 'interview_prep';
  content: string;
  quality_metrics?: string; // JSON
  is_favorite?: boolean;
  version?: number;
  created_at?: string;
}

// AI Career Insights record
export interface AICareerInsightRecord {
  id?: number;
  applicant_id: string;
  request_id?: string;
  insight_type: 'career_path' | 'skill_gaps' | 'learning_path' | 'salary_guidance' | 'interview_prep';
  current_role?: string;
  target_role?: string;
  insights: string; // JSON
  confidence_score?: number;
  actionable_items?: string; // JSON
  estimated_timeline?: string;
  created_at?: string;
  expires_at?: string;
}

// AI Market Intelligence record
export interface AIMarketIntelligenceRecord {
  id?: number;
  request_id?: string;
  analysis_type: 'salary_analysis' | 'market_trends' | 'company_analysis' | 'skill_demand' | 'geographic_analysis';
  scope?: string;
  data: string; // JSON
  confidence_score?: number;
  data_sources?: string; // JSON
  created_at?: string;
  expires_at: string;
}

// AI User Preferences record
export interface AIUserPreferencesRecord {
  id?: number;
  applicant_id: string;
  agent_preferences?: string; // JSON
  content_style?: string;
  communication_tone?: string;
  privacy_level?: 'minimal' | 'standard' | 'detailed';
  auto_generate_enabled?: boolean;
  feedback_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class AIDatabase {
  constructor(private db: D1Database) {}

  // Agent Request Management
  async createAgentRequest(request: Omit<AIAgentRequestRecord, 'id' | 'created_at'>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO ai_agent_requests (
        agent_type, user_id, request_id, endpoint, input_data, status, openai_used
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      request.agent_type,
      request.user_id || null,
      request.request_id,
      request.endpoint,
      request.input_data || null,
      request.status,
      request.openai_used || false
    ).run();

    return result.meta.last_row_id as number;
  }

  async updateAgentRequest(
    request_id: string, 
    update: Partial<Pick<AIAgentRequestRecord, 'response_data' | 'status' | 'execution_time_ms' | 'token_usage' | 'cost_cents' | 'error_message'>>
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (update.response_data !== undefined) {
      fields.push('response_data = ?');
      values.push(update.response_data);
    }
    if (update.status !== undefined) {
      fields.push('status = ?');
      values.push(update.status);
    }
    if (update.execution_time_ms !== undefined) {
      fields.push('execution_time_ms = ?');
      values.push(update.execution_time_ms);
    }
    if (update.token_usage !== undefined) {
      fields.push('token_usage = ?');
      values.push(update.token_usage);
    }
    if (update.cost_cents !== undefined) {
      fields.push('cost_cents = ?');
      values.push(update.cost_cents);
    }
    if (update.error_message !== undefined) {
      fields.push('error_message = ?');
      values.push(update.error_message);
    }
    
    fields.push('completed_at = CURRENT_TIMESTAMP');

    if (fields.length === 1) return; // Only timestamp update

    const sql = `UPDATE ai_agent_requests SET ${fields.join(', ')} WHERE request_id = ?`;
    await this.db.prepare(sql).bind(...values, request_id).run();
  }

  async getAgentRequestStats(agent_type?: string, timeframe_hours?: number): Promise<{
    total_requests: number;
    success_rate: number;
    avg_execution_time: number;
    total_token_usage: number;
    total_cost_cents: number;
  }> {
    let sql = `
      SELECT 
        COUNT(*) as total_requests,
        AVG(CASE WHEN status = 'success' THEN 1.0 ELSE 0.0 END) as success_rate,
        AVG(execution_time_ms) as avg_execution_time,
        SUM(token_usage) as total_token_usage,
        SUM(cost_cents) as total_cost_cents
      FROM ai_agent_requests 
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (agent_type) {
      sql += ' AND agent_type = ?';
      params.push(agent_type);
    }
    
    if (timeframe_hours) {
      sql += ' AND created_at >= datetime("now", "-" || ? || " hours")';
      params.push(timeframe_hours);
    }

    const result = await this.db.prepare(sql).bind(...params).first();
    
    return {
      total_requests: (result?.total_requests as number) || 0,
      success_rate: (result?.success_rate as number) || 0,
      avg_execution_time: (result?.avg_execution_time as number) || 0,
      total_token_usage: (result?.total_token_usage as number) || 0,
      total_cost_cents: (result?.total_cost_cents as number) || 0
    };
  }

  // Job Matching
  async saveJobMatch(match: Omit<AIJobMatchRecord, 'id' | 'created_at'>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO ai_job_matches (
        applicant_id, job_id, request_id, fit_score, confidence_score, match_reasons,
        skill_match_score, experience_match_score, location_match_score, 
        salary_match_score, culture_match_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      match.applicant_id,
      match.job_id,
      match.request_id || null,
      match.fit_score,
      match.confidence_score || null,
      match.match_reasons || null,
      match.skill_match_score || null,
      match.experience_match_score || null,
      match.location_match_score || null,
      match.salary_match_score || null,
      match.culture_match_score || null
    ).run();

    return result.meta.last_row_id as number;
  }

  async getJobMatches(applicant_id: string, limit: number = 10): Promise<AIJobMatchRecord[]> {
    const results = await this.db.prepare(`
      SELECT * FROM ai_job_matches 
      WHERE applicant_id = ? 
      ORDER BY fit_score DESC, created_at DESC 
      LIMIT ?
    `).bind(applicant_id, limit).all();

    return (results.results as unknown) as AIJobMatchRecord[];
  }

  // Content Generation
  async saveGeneratedContent(content: Omit<AIGeneratedContentRecord, 'id' | 'created_at'>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO ai_generated_content (
        applicant_id, job_id, request_id, content_type, content, quality_metrics, is_favorite, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      content.applicant_id,
      content.job_id || null,
      content.request_id || null,
      content.content_type,
      content.content,
      content.quality_metrics || null,
      content.is_favorite || false,
      content.version || 1
    ).run();

    return result.meta.last_row_id as number;
  }

  async getGeneratedContent(
    applicant_id: string, 
    content_type?: string, 
    job_id?: string
  ): Promise<AIGeneratedContentRecord[]> {
    let sql = 'SELECT * FROM ai_generated_content WHERE applicant_id = ?';
    const params: any[] = [applicant_id];

    if (content_type) {
      sql += ' AND content_type = ?';
      params.push(content_type);
    }

    if (job_id) {
      sql += ' AND job_id = ?';
      params.push(job_id);
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';

    const results = await this.db.prepare(sql).bind(...params).all();
    return (results.results as unknown) as AIGeneratedContentRecord[];
  }

  // Career Insights
  async saveCareerInsight(insight: Omit<AICareerInsightRecord, 'id' | 'created_at'>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO ai_career_insights (
        applicant_id, request_id, insight_type, current_role, target_role,
        insights, confidence_score, actionable_items, estimated_timeline, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      insight.applicant_id,
      insight.request_id || null,
      insight.insight_type,
      insight.current_role || null,
      insight.target_role || null,
      insight.insights,
      insight.confidence_score || null,
      insight.actionable_items || null,
      insight.estimated_timeline || null,
      insight.expires_at || null
    ).run();

    return result.meta.last_row_id as number;
  }

  async getCareerInsights(applicant_id: string, insight_type?: string): Promise<AICareerInsightRecord[]> {
    let sql = `
      SELECT * FROM ai_career_insights 
      WHERE applicant_id = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `;
    const params: any[] = [applicant_id];

    if (insight_type) {
      sql += ' AND insight_type = ?';
      params.push(insight_type);
    }

    sql += ' ORDER BY created_at DESC LIMIT 20';

    const results = await this.db.prepare(sql).bind(...params).all();
    return (results.results as unknown) as AICareerInsightRecord[];
  }

  // Market Intelligence
  async saveMarketIntelligence(intelligence: Omit<AIMarketIntelligenceRecord, 'id' | 'created_at'>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO ai_market_intelligence (
        request_id, analysis_type, scope, data, confidence_score, data_sources, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      intelligence.request_id || null,
      intelligence.analysis_type,
      intelligence.scope || null,
      intelligence.data,
      intelligence.confidence_score || null,
      intelligence.data_sources || null,
      intelligence.expires_at
    ).run();

    return result.meta.last_row_id as number;
  }

  async getMarketIntelligence(analysis_type: string, scope?: string): Promise<AIMarketIntelligenceRecord | null> {
    let sql = `
      SELECT * FROM ai_market_intelligence 
      WHERE analysis_type = ? AND expires_at > CURRENT_TIMESTAMP
    `;
    const params: any[] = [analysis_type];

    if (scope) {
      sql += ' AND scope = ?';
      params.push(scope);
    }

    sql += ' ORDER BY created_at DESC LIMIT 1';

    const result = await this.db.prepare(sql).bind(...params).first();
    return result as AIMarketIntelligenceRecord | null;
  }

  // User Preferences
  async getUserPreferences(applicant_id: string): Promise<AIUserPreferencesRecord | null> {
    const result = await this.db.prepare(`
      SELECT * FROM ai_user_preferences WHERE applicant_id = ?
    `).bind(applicant_id).first();

    return result as AIUserPreferencesRecord | null;
  }

  async saveUserPreferences(preferences: Omit<AIUserPreferencesRecord, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT OR REPLACE INTO ai_user_preferences (
        applicant_id, agent_preferences, content_style, communication_tone,
        privacy_level, auto_generate_enabled, feedback_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      preferences.applicant_id,
      preferences.agent_preferences || null,
      preferences.content_style || 'professional',
      preferences.communication_tone || 'balanced',
      preferences.privacy_level || 'standard',
      preferences.auto_generate_enabled !== false,
      preferences.feedback_enabled !== false
    ).run();

    return result.meta.last_row_id as number;
  }

  // Cleanup old data
  async cleanupExpiredData(): Promise<{ deleted: number }> {
    const result = await this.db.prepare(`
      DELETE FROM ai_market_intelligence WHERE expires_at <= CURRENT_TIMESTAMP
    `).run();

    // Also cleanup old agent requests (keep last 30 days)
    await this.db.prepare(`
      DELETE FROM ai_agent_requests 
      WHERE created_at < datetime('now', '-30 days')
    `).run();

    return { deleted: result.meta.changes || 0 };
  }
}