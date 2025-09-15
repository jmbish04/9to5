// Job Discovery Agent API - Natural language job search
import type { APIRoute } from 'astro';
import { AgentOrchestrator } from '../../../lib/agent-orchestrator';

const orchestrator = new AgentOrchestrator();

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { query, filters, user_id, context } = body;
    
    if (!query) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Query parameter is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const agentRequest = {
      type: 'job_discovery' as const,
      payload: {
        query,
        filters: filters || {},
        user_preferences: context?.user_preferences || {}
      },
      user_id,
      context
    };
    
    const result = await orchestrator.processRequest(agentRequest);
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};