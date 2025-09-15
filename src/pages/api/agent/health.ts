import { validateApiTokenResponse } from '@/lib/api';
import { AgentOrchestrator } from '@/lib/ai/orchestrator';

const getOrchestrator = (locals: any) => {
  const env = locals?.runtime?.env;
  const database = locals?.runtime?.env?.DB;
  
  return new AgentOrchestrator({
    env,
    database
  });
};

export async function GET({ locals, request }: { locals: any; request: Request }) {
  const { API_TOKEN } = locals.runtime.env as { API_TOKEN: string };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  try {
    const orchestrator = getOrchestrator(locals);
    const systemStatus = await orchestrator.getSystemStatus();
    const configuration = orchestrator.getConfiguration();

    // Test OpenAI connectivity if available
    let openaiStatus = null;
    if (configuration.openai.enabled) {
      openaiStatus = await orchestrator.testOpenAIConnection();
    }

    // Convert Maps to objects for JSON serialization
    const healthObj = Object.fromEntries(systemStatus.agents);

    return Response.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        agents: healthObj,
        configuration: systemStatus.configuration,
        database_stats: systemStatus.database_stats,
        openai_status: openaiStatus,
        environment: configuration.environment
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