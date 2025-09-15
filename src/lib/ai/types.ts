// Core AI agent types and interfaces
export interface AgentRequest {
  user_id: string;
  request_id: string;
  agent_name: string;
  payload: any;
  context?: AgentContext;
}

export interface AgentResponse {
  request_id: string;
  agent_name: string;
  status: 'success' | 'error' | 'partial';
  data?: any;
  error?: AgentError;
  metadata?: AgentMetadata;
}

export interface AgentContext {
  user_id: string;
  session_id: string;
  conversation_id: string;
  request_id: string;
  parent_message_id?: string;
}

export interface AgentError {
  code: string;
  message: string;
  details?: any;
}

export interface AgentMetadata {
  execution_time_ms: number;
  model_used?: string;
  tokens_used?: {
    input: number;
    output: number;
  };
  confidence_score?: number;
  cost?: number;
}

// Job Discovery Agent Types
export interface JobSearchQuery {
  query: string;
  user_id: string;
  context: {
    previous_searches: string[];
    applied_jobs: string[];
    saved_jobs: string[];
  };
  filters?: {
    location?: string;
    remote_ok?: boolean;
    salary_min?: number;
    salary_max?: number;
    employment_type?: string;
    experience_level?: string;
  };
}

export interface JobMatch {
  job_id: string;
  fit_score: number;
  fit_explanation: string;
  highlighted_skills: string[];
  salary_match: number;
  location_match: number;
  culture_match?: number;
}

export interface JobRecommendation {
  jobs: JobMatch[];
  search_intent: string;
  suggested_filters: any;
  total_matches: number;
  confidence_score: number;
}

// Content Generation Agent Types
export interface CoverLetterRequest {
  job_id: string;
  user_profile: UserProfile;
  tone: 'professional' | 'enthusiastic' | 'conservative';
  length: 'short' | 'medium' | 'long';
  highlights: string[];
}

export interface ResumeOptimizationRequest {
  resume_content: string;
  job_description: string;
  target_keywords: string[];
  optimization_focus: ('keywords' | 'structure' | 'achievements')[];
}

export interface UserProfile {
  name: string;
  email: string;
  experience_years: number;
  current_role?: string;
  skills: string[];
  achievements: string[];
  preferences: {
    work_style?: string;
    location_preferences?: string[];
    salary_range?: {
      min: number;
      max: number;
      currency: string;
    };
  };
}

export interface ContentGenerationResult {
  content: string;
  quality_metrics: {
    grammar_score: number;
    readability_score: number;
    keyword_density: number;
    tone_consistency: number;
    personalization_score: number;
    ats_compatibility: number;
  };
  suggestions?: string[];
}

// Agent Configuration Types
export interface AgentConfig {
  name: string;
  model: string;
  timeout: number;
  max_retries: number;
  rate_limit?: {
    requests_per_minute: number;
    burst_limit: number;
  };
  quality_threshold?: number;
  cache_ttl?: number;
}

export interface AgentsConfig {
  job_discovery: AgentConfig;
  career_coach: AgentConfig;
  content_generation: AgentConfig;
  market_intelligence: AgentConfig;
}

// Base Agent Interface
export abstract class BaseAgent {
  protected config: AgentConfig;
  
  constructor(config: AgentConfig) {
    this.config = config;
  }
  
  abstract execute(request: AgentRequest): Promise<AgentResponse>;
  abstract healthCheck(): Promise<boolean>;
}

// Agent Metrics
export interface AgentMetrics {
  agent_name: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  p95_response_time: number;
  error_rate: number;
  cache_hit_rate?: number;
  cost_per_request?: number;
}

export interface AgentHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time: number;
  error_rate: number;
  last_check: Date;
  details: {
    model_availability: boolean;
    api_connectivity: boolean;
    cache_status: boolean;
    queue_depth: number;
  };
}