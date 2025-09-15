import { validateApiTokenResponse } from '@/lib/api';
import { AgentOrchestrator } from '@/lib/ai/orchestrator';
import { getAgentsConfig } from '@/lib/ai/config';

const getOrchestrator = () => {
  const env = process.env.NODE_ENV || 'development';
  const configs = getAgentsConfig(env);
  return new AgentOrchestrator(configs);
};

export async function GET({ locals, request }: { locals: any; request: Request }) {
  const { API_TOKEN } = locals.runtime.env as { API_TOKEN: string };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  try {
    const url = new URL(request.url);
    const user_id = url.searchParams.get('user_id');
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    if (!user_id) {
      return Response.json(
        { error: { code: 'missing_params', message: 'user_id is required' } },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const orchestrator = getOrchestrator();
    
    // Create agent request for personalized recommendations
    const agentRequest = {
      user_id,
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agent_name: 'job_discovery',
      payload: {
        type: 'recommendations',
        payload: { user_id, limit }
      }
    };
    
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
    console.error('GET /api/agent/recommendations failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to get recommendations' } },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}