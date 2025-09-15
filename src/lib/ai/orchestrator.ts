import type { 
  AgentRequest, 
  AgentResponse, 
  AgentConfig,
  AgentHealthStatus 
} from './types';
import { BaseAgent } from './types';
import { JobDiscoveryAgent } from './agents/job-discovery';
import { ContentGenerationAgent } from './agents/content-generation';

export class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private metrics: Map<string, any> = new Map();
  
  constructor(configs: Record<string, AgentConfig>) {
    this.initializeAgents(configs);
  }
  
  private initializeAgents(configs: Record<string, AgentConfig>): void {
    // Initialize Job Discovery Agent
    if (configs.job_discovery) {
      this.agents.set('job_discovery', new JobDiscoveryAgent(configs.job_discovery));
    }
    
    // Initialize Content Generation Agent
    if (configs.content_generation) {
      this.agents.set('content_generation', new ContentGenerationAgent(configs.content_generation));
    }
    
    // TODO: Add other agents as they are implemented
    // - Career Coach Agent
    // - Market Intelligence Agent
    // - Application Assistant Agent
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
    
    for (const [name, agent] of this.agents) {
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
    const criticalAgents = ['job_discovery', 'content_generation'];
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
}