import { validateApiTokenResponse } from '@/lib/api';
import type { components } from '@/lib/types/openapi';

type AgentConfig = components['schemas']['AgentConfig'];

export async function GET({ locals, request, params }: { locals: any; request: Request; params: any }) {
  const { API_TOKEN, DB } = locals.runtime.env as { API_TOKEN: string; DB: D1Database };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  const { id } = params;

  try {
    const stmt = DB.prepare(`SELECT * FROM agents WHERE id = ?`).bind(id);
    const { results } = await stmt.all();

    if (!results || results.length === 0) {
      return Response.json(
        { error: { code: 'not_found', message: 'Agent not found' } },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const row = results[0] as any;
    const agent: AgentConfig = {
      id: row.id,
      name: row.name,
      role: row.role,
      goal: row.goal,
      backstory: row.backstory,
      llm: row.llm,
      system_prompt: row.system_prompt,
      max_tokens: row.max_tokens,
      temperature: row.temperature,
      enabled: Boolean(row.enabled),
      created_at: row.created_at,
      updated_at: row.updated_at
    };

    return Response.json(agent, { 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  } catch (err) {
    console.error('GET /api/agents/:id failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to get agent' } }, 
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

export async function PUT({ locals, request, params }: { locals: any; request: Request; params: any }) {
  const { API_TOKEN, DB } = locals.runtime.env as { API_TOKEN: string; DB: D1Database };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  const { id } = params;

  try {
    const agent = await request.json() as AgentConfig;
    const now = new Date().toISOString();

    // Validate required fields
    if (!agent.name || !agent.role || !agent.goal || !agent.backstory || !agent.llm) {
      return Response.json(
        { error: { code: 'validation_error', message: 'Missing required fields' } },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const stmt = DB.prepare(`
      UPDATE agents SET 
        name = ?, role = ?, goal = ?, backstory = ?, llm = ?, 
        system_prompt = ?, max_tokens = ?, temperature = ?, enabled = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      agent.name,
      agent.role,
      agent.goal,
      agent.backstory,
      agent.llm,
      agent.system_prompt || null,
      agent.max_tokens || 4000,
      agent.temperature || 0.7,
      agent.enabled !== false ? 1 : 0,
      now,
      id
    );

    const result = await stmt.run();

    if (result.changes === 0) {
      return Response.json(
        { error: { code: 'not_found', message: 'Agent not found' } },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const updatedAgent: AgentConfig = {
      id,
      name: agent.name,
      role: agent.role,
      goal: agent.goal,
      backstory: agent.backstory,
      llm: agent.llm,
      system_prompt: agent.system_prompt,
      max_tokens: agent.max_tokens || 4000,
      temperature: agent.temperature || 0.7,
      enabled: agent.enabled !== false,
      created_at: agent.created_at || now, // Keep original if provided
      updated_at: now
    };

    return Response.json(updatedAgent, { 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  } catch (err) {
    console.error('PUT /api/agents/:id failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to update agent' } }, 
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

export async function DELETE({ locals, request, params }: { locals: any; request: Request; params: any }) {
  const { API_TOKEN, DB } = locals.runtime.env as { API_TOKEN: string; DB: D1Database };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  const { id } = params;

  try {
    const stmt = DB.prepare(`DELETE FROM agents WHERE id = ?`).bind(id);
    const result = await stmt.run();

    if (result.changes === 0) {
      return Response.json(
        { error: { code: 'not_found', message: 'Agent not found' } },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    return new Response(null, { 
      status: 204, 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  } catch (err) {
    console.error('DELETE /api/agents/:id failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to delete agent' } }, 
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}