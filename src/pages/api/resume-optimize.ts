import { validateApiTokenResponse } from '@/lib/api';
import { AgentOrchestrator } from '@/lib/ai/orchestrator.js';
import { getAgentsConfig } from '@/lib/ai/config.js';

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
    const { resume_content, job_description, target_keywords = [] } = body;

    if (!resume_content || !job_description) {
      return Response.json(
        { error: { code: 'missing_params', message: 'resume_content and job_description are required' } },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const orchestrator = getOrchestrator();
    const agentRequest = AgentOrchestrator.createResumeOptimizationRequest(
      'anonymous', // Could be extracted from request context
      resume_content,
      job_description,
      target_keywords
    );
    
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
        optimized_resume: response.data,
        metadata: response.metadata
      },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    console.error('POST /api/resume-optimize failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to optimize resume' } },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}