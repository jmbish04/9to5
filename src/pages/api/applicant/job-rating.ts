import { validateApiTokenResponse } from '@/lib/api';
import { AgentOrchestrator } from '@/lib/ai/orchestrator';
import { getAgentsConfig } from '@/lib/ai/config';

const getOrchestrator = () => {
  const env = process.env.NODE_ENV || 'development';
  const configs = getAgentsConfig(env);
  return new AgentOrchestrator(configs);
};

export async function POST({ locals, request }: { locals: any; request: Request }) {
  const { API_TOKEN } = locals.runtime.env as { API_TOKEN: string };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  try {
    const body = await request.json();
    const { job_id, user_profile } = body;

    if (!job_id || !user_profile) {
      return Response.json(
        { error: { code: 'missing_params', message: 'job_id and user_profile are required' } },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const orchestrator = getOrchestrator();
    
    // Create agent request for job fit analysis
    const agentRequest = {
      user_id: user_profile.user_id || 'anonymous',
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agent_name: 'job_discovery',
      payload: {
        type: 'job_fit_analysis',
        payload: { job_id, user_profile }
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
        job_match: response.data,
        metadata: response.metadata
      },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    console.error('POST /api/applicant/job-rating failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to analyze job fit' } },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}