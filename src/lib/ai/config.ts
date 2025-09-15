import type { AgentsConfig } from './types';

// Environment-based AI configuration
export interface AIEnvironmentConfig {
  openai: {
    apiKey?: string;
    baseUrl: string;
    timeout: number;
    enabled: boolean;
  };
  agents: {
    enabled: boolean;
    fallbackMode: boolean;
  };
  environment: 'development' | 'production';
}

// Create environment configuration from Cloudflare env
export function createAIConfig(env?: any): AIEnvironmentConfig {
  const isProduction = env?.NODE_ENV === 'production' || env?.ENVIRONMENT === 'production';
  
  return {
    openai: {
      apiKey: env?.OPENAI_API_KEY,
      baseUrl: env?.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      timeout: parseInt(env?.OPENAI_TIMEOUT || '30000', 10),
      enabled: !!(env?.OPENAI_API_KEY && env.OPENAI_API_KEY.startsWith('sk-'))
    },
    agents: {
      enabled: env?.AI_AGENTS_ENABLED !== 'false',
      fallbackMode: env?.AI_FALLBACK_MODE !== 'false'
    },
    environment: isProduction ? 'production' : 'development'
  };
}

// Check if OpenAI is available and configured
export function isOpenAIAvailable(config: AIEnvironmentConfig): boolean {
  return config.openai.enabled && !!config.openai.apiKey;
}

// Default agent configurations for different environments
export const getAgentsConfig = (env: string = 'development'): AgentsConfig => {
  const configs = {
    development: {
      job_discovery: {
        name: 'job_discovery',
        model: 'gpt-3.5-turbo',
        timeout: 10000,
        max_retries: 2,
        cache_ttl: 300,
        rate_limit: {
          requests_per_minute: 60,
          burst_limit: 10
        }
      },
      career_coach: {
        name: 'career_coach',
        model: 'gpt-4',
        timeout: 15000,
        max_retries: 3,
        rate_limit: {
          requests_per_minute: 30,
          burst_limit: 5
        }
      },
      content_generation: {
        name: 'content_generation',
        model: 'gpt-4',
        timeout: 30000,
        max_retries: 2,
        quality_threshold: 0.8,
        rate_limit: {
          requests_per_minute: 20,
          burst_limit: 3
        }
      },
      market_intelligence: {
        name: 'market_intelligence',
        model: 'gpt-3.5-turbo',
        timeout: 20000,
        max_retries: 2,
        cache_ttl: 600,
        rate_limit: {
          requests_per_minute: 40,
          burst_limit: 8
        }
      }
    },
    production: {
      job_discovery: {
        name: 'job_discovery',
        model: 'gpt-4',
        timeout: 5000,
        max_retries: 3,
        cache_ttl: 600,
        rate_limit: {
          requests_per_minute: 100,
          burst_limit: 20
        }
      },
      career_coach: {
        name: 'career_coach',
        model: 'gpt-4',
        timeout: 10000,
        max_retries: 3,
        rate_limit: {
          requests_per_minute: 50,
          burst_limit: 10
        }
      },
      content_generation: {
        name: 'content_generation',
        model: 'gpt-4',
        timeout: 20000,
        max_retries: 2,
        quality_threshold: 0.9,
        rate_limit: {
          requests_per_minute: 20,
          burst_limit: 5
        }
      },
      market_intelligence: {
        name: 'market_intelligence',
        model: 'gpt-4',
        timeout: 15000,
        max_retries: 2,
        cache_ttl: 1200,
        rate_limit: {
          requests_per_minute: 60,
          burst_limit: 12
        }
      }
    }
  };

  return configs[env as keyof typeof configs] || configs.development;
};

// Model pricing (tokens per dollar)
export const MODEL_PRICING = {
  'gpt-3.5-turbo': {
    input: 0.0015, // per 1K tokens
    output: 0.002
  },
  'gpt-4': {
    input: 0.03,
    output: 0.06
  },
  'gpt-4-turbo': {
    input: 0.01,
    output: 0.03
  }
} as const;

// Quality thresholds for different agent types
export const QUALITY_THRESHOLDS = {
  job_discovery: {
    min_fit_score: 60,
    recommendation_confidence: 0.8
  },
  content_generation: {
    min_grammar_score: 85,
    min_readability_score: 60,
    min_personalization: 70
  },
  career_coach: {
    min_confidence_score: 0.75,
    min_actionability: 0.8
  }
} as const;

// Feature flags for AI capabilities
export const AI_FEATURES = {
  semantic_search: true,
  job_fit_scoring: true,
  cover_letter_generation: true,
  resume_optimization: true,
  career_guidance: true,
  market_analysis: true,
  interview_prep: false, // Phase 3
  salary_negotiation: false, // Phase 3
  network_building: false // Phase 3
} as const;