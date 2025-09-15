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
    const orchestrator = getOrchestrator();
    const healthStatus = await orchestrator.healthCheck();
    const metrics = orchestrator.getMetrics();

    // Convert Maps to objects for JSON serialization
    const healthObj = Object.fromEntries(healthStatus);
    const metricsObj = Object.fromEntries(metrics);

    return Response.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        agents: healthObj,
        metrics: metricsObj
      },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    console.error('GET /api/agent/health failed', err);
    return Response.json(
      { 
        status: 'error',
        timestamp: new Date().toISOString(),
        error: { code: 'health_check_failed', message: 'Failed to check agent health' } 
      },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}