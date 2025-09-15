import { validateApiTokenResponse } from '@/lib/api';
import type { components } from '@/lib/types/openapi';

type TaskConfig = components['schemas']['TaskConfig'];

export async function GET({ locals, request }: { locals: any; request: Request }) {
  const { API_TOKEN, DB } = locals.runtime.env as { API_TOKEN: string; DB: D1Database };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  const url = new URL(request.url);
  const enabled = url.searchParams.get('enabled');
  const agent_id = url.searchParams.get('agent_id');

  try {
    let query = `SELECT * FROM tasks`;
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (enabled !== null) {
      conditions.push('enabled = ?');
      params.push(enabled === 'true' ? 1 : 0);
    }

    if (agent_id) {
      conditions.push('agent_id = ?');
      params.push(agent_id);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY created_at DESC`;

    const stmt = DB.prepare(query).bind(...params);
    const { results } = await stmt.all();

    const tasks = (results ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      expected_output: row.expected_output,
      agent_id: row.agent_id,
      context_tasks: row.context_tasks ? JSON.parse(row.context_tasks) : undefined,
      output_schema: row.output_schema ? JSON.parse(row.output_schema) : undefined,
      enabled: Boolean(row.enabled),
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    return Response.json(tasks, { 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  } catch (err) {
    console.error('GET /api/tasks failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to list tasks' } }, 
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

export async function POST({ locals, request }: { locals: any; request: Request }) {
  const { API_TOKEN, DB } = locals.runtime.env as { API_TOKEN: string; DB: D1Database };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  try {
    const task = await request.json() as TaskConfig;
    
    // Generate ID and timestamps
    const id = task.id || crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Validate required fields
    if (!task.name || !task.description || !task.expected_output || !task.agent_id) {
      return Response.json(
        { error: { code: 'validation_error', message: 'Missing required fields' } },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Check if agent exists
    const agentStmt = DB.prepare(`SELECT id FROM agents WHERE id = ?`).bind(task.agent_id);
    const { results: agentResults } = await agentStmt.all();
    if (!agentResults || agentResults.length === 0) {
      return Response.json(
        { error: { code: 'validation_error', message: 'Agent not found' } },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const stmt = DB.prepare(`
      INSERT INTO tasks (
        id, name, description, expected_output, agent_id, context_tasks, 
        output_schema, enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      task.name,
      task.description,
      task.expected_output,
      task.agent_id,
      task.context_tasks ? JSON.stringify(task.context_tasks) : null,
      task.output_schema ? JSON.stringify(task.output_schema) : null,
      task.enabled !== false ? 1 : 0,
      now,
      now
    );

    await stmt.run();

    const createdTask: TaskConfig = {
      id,
      name: task.name,
      description: task.description,
      expected_output: task.expected_output,
      agent_id: task.agent_id,
      context_tasks: task.context_tasks,
      output_schema: task.output_schema,
      enabled: task.enabled !== false,
      created_at: now,
      updated_at: now
    };

    return Response.json(createdTask, { 
      status: 201,
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  } catch (err) {
    console.error('POST /api/tasks failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to create task' } }, 
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}