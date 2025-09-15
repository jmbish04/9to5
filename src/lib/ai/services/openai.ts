// OpenAI service for real AI model integration
import type { AIEnvironmentConfig } from '../config';

export interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: OpenAIMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIService {
  private apiKey: string;
  private baseURL: string;
  private timeout: number;

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';
    this.timeout = config.timeout || 30000;
  }

  // Create from AI environment configuration
  static fromAIConfig(aiConfig: AIEnvironmentConfig): OpenAIService | null {
    if (!aiConfig.openai.enabled || !aiConfig.openai.apiKey) {
      return null;
    }

    return new OpenAIService({
      apiKey: aiConfig.openai.apiKey,
      baseURL: aiConfig.openai.baseUrl,
      timeout: aiConfig.openai.timeout
    });
  }

  async createChatCompletion(
    model: string,
    messages: OpenAIMessage[],
    options?: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      frequency_penalty?: number;
      presence_penalty?: number;
    }
  ): Promise<OpenAIResponse> {
    const requestBody = {
      model,
      messages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.max_tokens || 1500,
      top_p: options?.top_p || 1,
      frequency_penalty: options?.frequency_penalty || 0,
      presence_penalty: options?.presence_penalty || 0
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json() as OpenAIResponse;
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('OpenAI request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async createEmbedding(
    input: string | string[],
    model: string = 'text-embedding-3-small'
  ): Promise<{ data: Array<{ embedding: number[]; index: number }>; usage: { prompt_tokens: number; total_tokens: number } }> {
    const requestBody = {
      input,
      model
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('OpenAI request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Helper method to check if API key is available
  static isAvailable(apiKey?: string): boolean {
    return !!apiKey && apiKey.startsWith('sk-');
  }

  // Create a service instance if API key is available
  static createIfAvailable(apiKey?: string, config?: Partial<OpenAIConfig>): OpenAIService | null {
    if (!OpenAIService.isAvailable(apiKey)) {
      return null;
    }
    
    return new OpenAIService({
      apiKey: apiKey!,
      ...config
    });
  }

  // Test connection to OpenAI API
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.createChatCompletion(
        'gpt-3.5-turbo',
        [{ role: 'user', content: 'Hello' }],
        { max_tokens: 5 }
      );
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}