// /api/agent/recommendations.ts
import type { APIRoute } from 'astro';
import { validateApiTokenResponse } from '@/lib/api';
import { AgentOrchestrator } from '@/lib/ai/orchestrator';
import { getAgentsConfig } from '@/lib/ai/config';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

const getOrchestrator = () => {
  const env = process.env.NODE_ENV || 'development';
  const configs = getAgentsConfig(env);
  return new AgentOrchestrator(configs);
};

export const GET: APIRoute = async ({ locals, request, url }) => {
  const API_TOKEN = (locals as any)?.runtime?.env?.API_TOKEN as string | undefined;

  // API token validation
  const invalid = await validateApiTokenResponse(request, API_TOKEN as string);
  if (invalid) {
    // ensure CORS on the validation response as well
    return new Response(await invalid.text(), {
      status: invalid.status,
      headers: { ...Object.fromEntries(invalid.headers), ...JSON_HEADERS },
    });
  }

  try {
    const user_id = url.searchParams.get('user_id');
    const limit = Number.parseInt(url.searchParams.get('limit') || '20', 10);

    if (!user_id || Number.isNaN(limit) || limit <= 0) {
      return new Response(
        JSON.stringify({
          error: { code: 'missing_or_invalid_params', message: 'user_id is required and limit must be > 0' },
        }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    const orchestrator = getOrchestrator();

    const agentRequest = {
      user_id,
      request_id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      agent_name: 'job_discovery',
      payload: {
        type: 'recommendations',
        payload: { user_id, limit },
      },
    };

    const response = await orchestrator.processRequest(agentRequest as any);

    if (response?.status === 'error') {
      return new Response(JSON.stringify({ error: response.error }), {
        status: 500,
        headers: JSON_HEADERS,
      });
    }

    return new Response(
      JSON.stringify({
        request_id: response.request_id,
        recommendations: response.data,
        metadata: response.metadata,
      }),
      { status: 200, headers: JSON_HEADERS },
    );
  } catch (err: any) {
    console.error('GET /api/agent/recommendations failed', err);
    return new Response(
      JSON.stringify({
        error: { code: 'internal_error', message: 'Failed to get recommendations' },
      }),
      { status: 500, headers: JSON_HEADERS },
    );
  }
};