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

// Career Coach Agent Types
export interface CareerAnalysisRequest {
  user_profile: UserProfile;
  target_roles?: string[];
  career_goals?: string[];
  timeframe?: string;
}

export interface SkillGapAnalysisRequest {
  user_skills: string[];
  target_skills: string[];
  job_id?: string;
  target_role?: string;
}

export interface LearningPathRequest {
  current_skills: string[];
  target_skills: string[];
  timeframe: string;
  learning_style: 'visual' | 'hands-on' | 'theoretical' | 'balanced';
  availability_hours_per_week?: number;
}

export interface CareerCoachResult {
  current_position_assessment?: {
    strengths: string[];
    areas_for_improvement: string[];
    market_position: string;
    experience_level: number;
  };
  career_opportunities?: Array<{
    role: string;
    growth_potential: 'low' | 'medium' | 'high' | 'very_high';
    required_skills: string[];
    time_to_achieve: string;
    salary_range: string;
  }>;
  career_roadmap?: {
    short_term: string[];
    medium_term: string[];
    long_term: string[];
  };
  skill_gap_analysis?: {
    missing_skills: string[];
    matching_skills: string[];
    skill_match_percentage: number;
    critical_gaps: string[];
    nice_to_have_gaps: string[];
  };
  learning_path?: {
    total_duration: string;
    learning_style: string;
    phases: Array<{
      phase: string;
      duration: string;
      focus_areas: string[];
      learning_activities: string[];
    }>;
    milestones: Array<{
      week: number;
      milestone: string;
      validation: string;
    }>;
  };
  learning_recommendations?: Array<{
    skill: string;
    learning_resources: Array<{
      type: 'course' | 'certification' | 'practice' | 'book';
      name: string;
      provider: string;
      duration: string;
    }>;
    estimated_learning_time: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  actionable_recommendations?: Array<{
    category: 'skill_development' | 'networking' | 'experience' | 'education';
    action: string;
    priority: 'high' | 'medium' | 'low';
    timeline: string;
    impact: string;
  }>;
  salary_guidance?: {
    current_market_rate: string;
    negotiation_strategies: string[];
    timing_recommendations: string;
    market_trends: string;
  };
  interview_preparation?: {
    common_questions: string[];
    technical_topics: string[];
    behavioral_scenarios: string[];
    practice_recommendations: string[];
  };
  confidence_score: number;
}

// Market Intelligence Agent Types
export interface MarketAnalysisRequest {
  role?: string;
  location?: string;
  timeframe?: string;
  skills?: string[];
  experience_level?: string;
}

export interface SalaryAnalysisRequest {
  role: string;
  location: string;
  experience_years: number;
  skills: string[];
  company_size?: 'startup' | 'mid-size' | 'enterprise';
}

export interface CompanyIntelligenceRequest {
  company_name: string;
  metrics?: ('hiring' | 'growth' | 'culture' | 'salary')[];
}

export interface SkillTrendsRequest {
  skills: string[];
  timeframe?: string;
  location?: string;
}

export interface MarketIntelligenceResult {
  market_overview?: {
    job_demand: 'low' | 'moderate' | 'high' | 'very_high';
    growth_rate: string;
    market_size: string;
    competition_level: 'low' | 'moderate' | 'high';
    hiring_trends: string[];
  };
  salary_trends?: {
    current_range: string;
    median_salary: string;
    salary_growth: string;
    top_paying_locations: string[];
    salary_by_experience: Record<string, string>;
  };
  salary_analysis?: {
    base_salary_range: string;
    recommended_ask: string;
    skill_premiums: Array<{
      skill: string;
      premium_percentage: number;
      premium_amount: string;
    }>;
    location_adjustment: string;
    market_percentile: number;
    negotiation_range: {
      conservative: string;
      target: string;
      optimistic: string;
    };
  };
  skill_demand?: {
    most_requested: string[];
    emerging_skills: string[];
    declining_skills: string[];
    skill_premiums: Record<string, string>;
  };
  skill_trends?: {
    timeframe: string;
    trend_data: Array<{
      skill: string;
      current_demand: number;
      demand_change: string;
      growth_trajectory: 'declining' | 'stable' | 'growing' | 'explosive';
      job_postings_count: number;
      average_salary_premium: string;
      related_skills: string[];
      industry_adoption: number;
    }>;
    emerging_technologies: string[];
    declining_technologies: string[];
  };
  company_rankings?: Array<{
    company: string;
    hiring_health: 'poor' | 'fair' | 'good' | 'excellent';
    avg_salary: string;
    work_life_balance: number;
    growth_opportunities: number;
  }>;
  company_intelligence?: {
    company_name: string;
    hiring_health: 'poor' | 'fair' | 'good' | 'excellent';
    recent_funding?: string;
    employee_growth: string;
    glassdoor_rating: number;
    work_life_balance: number;
    career_opportunities: number;
    compensation_benefits: number;
    culture_values: number;
    recent_news: string[];
    interview_process: {
      typical_rounds: number;
      average_duration: string;
      process_steps: string[];
    };
    salary_competitiveness: string;
    benefits_highlights: string[];
  };
  geographic_analysis?: {
    top_tech_hubs: Array<{
      city: string;
      job_count: number;
      avg_salary: string;
      cost_of_living_index: number;
    }>;
    remote_opportunities: {
      percentage_remote: string;
      hybrid_percentage: string;
      in_office_percentage: string;
      salary_impact: string;
    };
    relocation_recommendations: string[];
  };
  market_comparison?: {
    vs_national_average: string;
    vs_local_average: string;
    vs_similar_roles: string;
  };
  market_predictions?: string[];
  recommendations?: string[];
  confidence_score: number;
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
  [key: string]: AgentConfig;
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