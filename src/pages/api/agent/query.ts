import { validateApiTokenResponse } from '@/lib/api';
import { AgentOrchestrator } from '@/lib/ai/orchestrator';
import { getAgentsConfig } from '@/lib/ai/config';
import type { APIRoute } from 'astro';

// Initialize orchestrator with environment-based configuration
const getOrchestrator = () => {
  const env = process.env.NODE_ENV || 'development';
  const configs = getAgentsConfig(env);
  return new AgentOrchestrator(configs);
};

export const POST: APIRoute = async ({ locals, request }) => {
  const { API_TOKEN } = locals.runtime.env as { API_TOKEN: string };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  try {
    const body = await request.json();
    const { query, user_id, context } = body;

    if (!query || !user_id) {
      return Response.json(
        { error: { code: 'missing_params', message: 'query and user_id are required' } },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Create agent request for semantic search
    const orchestrator = getOrchestrator();
    const agentRequest = AgentOrchestrator.createJobSearchRequest(user_id, query, context);
    
    // Process the request
    const response = await orchestrator.processRequest(agentRequest);

    if (response.status === 'error') {
      return Response.json(
        { error: response.error },
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    return Response.json(
      {
        request_id: response.request_id,
        recommendations: response.data,
        metadata: response.metadata
      },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    console.error('POST /api/agent/query failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to process agent query' } },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}