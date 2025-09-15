import type { 
  AgentRequest, 
  AgentResponse, 
  AgentConfig,
  AgentHealthStatus,
  AgentsConfig
} from './types';
import { BaseAgent } from './types';
import { JobDiscoveryAgent } from './agents/job-discovery';
import { ContentGenerationAgent } from './agents/content-generation';
import { CareerCoachAgent } from './agents/career-coach';
import { MarketIntelligenceAgent } from './agents/market-intelligence';
import { OpenAIService } from './services/openai';
import { AIDatabase } from './services/database';
import { createAIConfig, isOpenAIAvailable, getAgentsConfig } from './config';

export interface OrchestratorConfig {
  env?: any; // Cloudflare env object
  database?: D1Database;
}

export class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private metrics: Map<string, any> = new Map();
  private openaiService: OpenAIService | null = null;
  private database: AIDatabase | null = null;
  private aiConfig: any;
  
  constructor(config: OrchestratorConfig = {}) {
    // Load AI configuration from environment
    this.aiConfig = createAIConfig(config.env);
    
    // Initialize database if available
    if (config.database) {
      this.database = new AIDatabase(config.database);
    }
    
    // Initialize OpenAI service if available
    if (isOpenAIAvailable(this.aiConfig)) {
      this.openaiService = OpenAIService.fromAIConfig(this.aiConfig);
    }
    
    this.initializeAgents();
  }
  
  private initializeAgents(): void {
    const agentConfigs = getAgentsConfig(this.aiConfig.environment);
    
    // Initialize Job Discovery Agent
    this.agents.set('job_discovery', new JobDiscoveryAgent({
      ...agentConfigs.job_discovery,
      openaiService: this.openaiService,
      database: this.database
    } as any));
    
    // Initialize Content Generation Agent
    this.agents.set('content_generation', new ContentGenerationAgent({
      ...agentConfigs.content_generation,
      openaiService: this.openaiService,
      database: this.database
    } as any));
    
    // Initialize Career Coach Agent
    this.agents.set('career_coach', new CareerCoachAgent({
      ...agentConfigs.career_coach,
      openaiService: this.openaiService,
      database: this.database
    } as any));
    
    // Initialize Market Intelligence Agent
    this.agents.set('market_intelligence', new MarketIntelligenceAgent({
      ...agentConfigs.market_intelligence,
      openaiService: this.openaiService,
      database: this.database
    } as any));
  }
  
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    const agent = this.agents.get(request.agent_name);
    
    if (!agent) {
      return {
        request_id: request.request_id,
        agent_name: request.agent_name,
        status: 'error',
        error: {
          code: 'agent_not_found',
          message: `Agent '${request.agent_name}' not available`
        },
        metadata: {
          execution_time_ms: 0
        }
      };
    }
    
    try {
      // Check agent health before processing
      const isHealthy = await agent.healthCheck();
      if (!isHealthy) {
        return {
          request_id: request.request_id,
          agent_name: request.agent_name,
          status: 'error',
          error: {
            code: 'agent_unhealthy',
            message: `Agent '${request.agent_name}' is currently unavailable`
          },
          metadata: {
            execution_time_ms: 0
          }
        };
      }
      
      // Process the request
      const response = await agent.execute(request);
      
      // Update metrics
      this.updateMetrics(request.agent_name, response);
      
      return response;
    } catch (error) {
      return {
        request_id: request.request_id,
        agent_name: request.agent_name,
        status: 'error',
        error: {
          code: 'orchestrator_error',
          message: error instanceof Error ? error.message : 'Unknown orchestrator error'
        },
        metadata: {
          execution_time_ms: 0
        }
      };
    }
  }
  
  async processMultiAgentWorkflow(requests: AgentRequest[]): Promise<AgentResponse[]> {
    // Process multiple agent requests in parallel or sequence based on dependencies
    const responses: AgentResponse[] = [];
    
    for (const request of requests) {
      const response = await this.processRequest(request);
      responses.push(response);
      
      // If any critical agent fails, we might want to stop the workflow
      if (response.status === 'error' && this.isCriticalAgent(request.agent_name)) {
        break;
      }
    }
    
    return responses;
  }
  
  async healthCheck(): Promise<Map<string, AgentHealthStatus>> {
    const healthStatus = new Map<string, AgentHealthStatus>();
    
    for (const [name, agent] of Array.from(this.agents.entries())) {
      try {
        const startTime = Date.now();
        const isHealthy = await agent.healthCheck();
        const responseTime = Date.now() - startTime;
        
        const metrics = this.metrics.get(name);
        const errorRate = metrics ? (metrics.failed_requests / metrics.total_requests) : 0;
        
        healthStatus.set(name, {
          status: isHealthy ? 'healthy' : 'unhealthy',
          response_time: responseTime,
          error_rate: errorRate,
          last_check: new Date(),
          details: {
            model_availability: isHealthy,
            api_connectivity: isHealthy,
            cache_status: true, // Mock
            queue_depth: 0 // Mock
          }
        });
      } catch (error) {
        healthStatus.set(name, {
          status: 'unhealthy',
          response_time: 0,
          error_rate: 1,
          last_check: new Date(),
          details: {
            model_availability: false,
            api_connectivity: false,
            cache_status: false,
            queue_depth: -1
          }
        });
      }
    }
    
    return healthStatus;
  }
  
  getMetrics(): Map<string, any> {
    return new Map(this.metrics);
  }

  // Get comprehensive system status
  async getSystemStatus(): Promise<{
    agents: Map<string, AgentHealthStatus>;
    configuration: {
      openai_enabled: boolean;
      agents_enabled: boolean;
      fallback_mode: boolean;
      database_available: boolean;
      environment: string;
    };
    database_stats?: {
      total_requests: number;
      success_rate: number;
      avg_execution_time: number;
      total_cost_cents: number;
    };
  }> {
    const agents = await this.healthCheck();
    
    const result = {
      agents,
      configuration: {
        openai_enabled: isOpenAIAvailable(this.aiConfig),
        agents_enabled: this.aiConfig.agents.enabled,
        fallback_mode: this.aiConfig.agents.fallbackMode,
        database_available: !!this.database,
        environment: this.aiConfig.environment
      }
    } as any;

    // Add database statistics if available
    if (this.database) {
      try {
        result.database_stats = await this.database.getAgentRequestStats(undefined, 24);
      } catch (error) {
        console.warn('Failed to get database stats:', error);
      }
    }

    return result;
  }

  // Get AI configuration
  getConfiguration(): any {
    return { ...this.aiConfig };
  }

  // Test OpenAI connectivity if available
  async testOpenAIConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.openaiService) {
      return { success: false, error: 'OpenAI service not available' };
    }

    try {
      return await this.openaiService.testConnection();
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  private updateMetrics(agentName: string, response: AgentResponse): void {
    const current = this.metrics.get(agentName) || {
      total_requests: 0,
      successful_requests: 0,
      failed_requests: 0,
      average_response_time: 0,
      total_response_time: 0
    };
    
    current.total_requests++;
    
    if (response.status === 'success') {
      current.successful_requests++;
    } else {
      current.failed_requests++;
    }
    
    if (response.metadata?.execution_time_ms) {
      current.total_response_time += response.metadata.execution_time_ms;
      current.average_response_time = current.total_response_time / current.total_requests;
    }
    
    this.metrics.set(agentName, current);
  }
  
  private isCriticalAgent(agentName: string): boolean {
    // Define which agents are critical for the workflow
    const criticalAgents = ['job_discovery', 'content_generation', 'career_coach', 'market_intelligence'];
    return criticalAgents.includes(agentName);
  }
  
  // Utility methods for creating requests
  static createJobSearchRequest(
    user_id: string, 
    query: string, 
    context?: any
  ): AgentRequest {
    return {
      user_id,
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agent_name: 'job_discovery',
      payload: {
        type: 'semantic_search',
        payload: {
          query,
          user_id,
          context: context || {
            previous_searches: [],
            applied_jobs: [],
            saved_jobs: []
          }
        }
      }
    };
  }
  
  static createCoverLetterRequest(
    user_id: string,
    job_id: string,
    user_profile: any,
    options?: {
      tone?: 'professional' | 'enthusiastic' | 'conservative';
      length?: 'short' | 'medium' | 'long';
      highlights?: string[];
    }
  ): AgentRequest {
    return {
      user_id,
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agent_name: 'content_generation',
      payload: {
        type: 'cover_letter',
        payload: {
          job_id,
          user_profile,
          tone: options?.tone || 'professional',
          length: options?.length || 'medium',
          highlights: options?.highlights || []
        }
      }
    };
  }
  
  static createResumeOptimizationRequest(
    user_id: string,
    resume_content: string,
    job_description: string,
    target_keywords: string[]
  ): AgentRequest {
    return {
      user_id,
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agent_name: 'content_generation',
      payload: {
        type: 'resume_optimization',
        payload: {
          resume_content,
          job_description,
          target_keywords,
          optimization_focus: ['keywords', 'structure', 'achievements']
        }
      }
    };
  }

  static createCareerAnalysisRequest(
    user_id: string,
    user_profile: any,
    target_roles?: string[],
    career_goals?: string[]
  ): AgentRequest {
    return {
      user_id,
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agent_name: 'career_coach',
      payload: {
        type: 'career_analysis',
        payload: {
          user_profile,
          target_roles,
          career_goals,
          timeframe: '6 months'
        }
      }
    };
  }

  static createSkillGapAnalysisRequest(
    user_id: string,
    user_skills: string[],
    target_skills: string[],
    job_id?: string
  ): AgentRequest {
    return {
      user_id,
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agent_name: 'career_coach',
      payload: {
        type: 'skill_gap_analysis',
        payload: {
          user_skills,
          target_skills,
          job_id
        }
      }
    };
  }

  static createLearningPathRequest(
    user_id: string,
    current_skills: string[],
    target_skills: string[],
    timeframe: string = '3 months',
    learning_style: 'visual' | 'hands-on' | 'theoretical' | 'balanced' = 'balanced'
  ): AgentRequest {
    return {
      user_id,
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agent_name: 'career_coach',
      payload: {
        type: 'learning_path',
        payload: {
          current_skills,
          target_skills,
          timeframe,
          learning_style
        }
      }
    };
  }

  static createMarketAnalysisRequest(
    user_id: string,
    role: string,
    location: string,
    timeframe: string = '6 months'
  ): AgentRequest {
    return {
      user_id,
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agent_name: 'market_intelligence',
      payload: {
        type: 'market_analysis',
        payload: {
          role,
          location,
          timeframe
        }
      }
    };
  }

  static createSalaryAnalysisRequest(
    user_id: string,
    role: string,
    location: string,
    experience_years: number,
    skills: string[]
  ): AgentRequest {
    return {
      user_id,
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agent_name: 'market_intelligence',
      payload: {
        type: 'salary_intelligence',
        payload: {
          role,
          location,
          experience_years,
          skills
        }
      }
    };
  }

  static createCompanyIntelligenceRequest(
    user_id: string,
    company_name: string,
    metrics: string[] = ['hiring', 'growth', 'culture', 'salary']
  ): AgentRequest {
    return {
      user_id,
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agent_name: 'market_intelligence',
      payload: {
        type: 'company_intelligence',
        payload: {
          company_name,
          metrics
        }
      }
    };
  }

  static createSkillTrendsRequest(
    user_id: string,
    skills: string[],
    timeframe: string = '12 months'
  ): AgentRequest {
    return {
      user_id,
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agent_name: 'market_intelligence',
      payload: {
        type: 'skill_trends',
        payload: {
          skills,
          timeframe
        }
      }
    };
  }
}