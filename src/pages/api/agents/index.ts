import { validateApiTokenResponse } from '@/lib/api';
import type { components } from '@/lib/types/openapi';

type AgentConfig = components['schemas']['AgentConfig'];

export async function GET({ locals, request }: { locals: any; request: Request }) {
  const { API_TOKEN, DB } = locals.runtime.env as { API_TOKEN: string; DB: D1Database };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  const url = new URL(request.url);
  const enabled = url.searchParams.get('enabled');

  try {
    let query = `SELECT * FROM agents`;
    const params: any[] = [];
    
    if (enabled !== null) {
      query += ` WHERE enabled = ?`;
      params.push(enabled === 'true' ? 1 : 0);
    }
    
    query += ` ORDER BY created_at DESC`;

    const stmt = DB.prepare(query).bind(...params);
    const { results } = await stmt.all();

    const agents = (results ?? []).map((row: any) => ({
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
    }));

    return Response.json(agents, { 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  } catch (err) {
    console.error('GET /api/agents failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to list agents' } }, 
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

export async function POST({ locals, request }: { locals: any; request: Request }) {
  const { API_TOKEN, DB } = locals.runtime.env as { API_TOKEN: string; DB: D1Database };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  try {
    const agent = await request.json() as AgentConfig;
    
    // Generate ID and timestamps
    const id = agent.id || crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Validate required fields
    if (!agent.name || !agent.role || !agent.goal || !agent.backstory || !agent.llm) {
      return Response.json(
        { error: { code: 'validation_error', message: 'Missing required fields' } },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const stmt = DB.prepare(`
      INSERT INTO agents (
        id, name, role, goal, backstory, llm, system_prompt, 
        max_tokens, temperature, enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
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
      now
    );

    await stmt.run();

    const createdAgent: AgentConfig = {
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
      created_at: now,
      updated_at: now
    };

    return Response.json(createdAgent, { 
      status: 201,
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  } catch (err) {
    console.error('POST /api/agents failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to create agent' } }, 
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}