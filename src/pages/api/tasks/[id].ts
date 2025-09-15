import { validateApiTokenResponse } from '@/lib/api';
import type { components } from '@/lib/types/openapi';

type TaskConfig = components['schemas']['TaskConfig'];

export async function GET({ locals, request, params }: { locals: any; request: Request; params: any }) {
  const { API_TOKEN, DB } = locals.runtime.env as { API_TOKEN: string; DB: D1Database };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  const { id } = params;

  try {
    const stmt = DB.prepare(`SELECT * FROM tasks WHERE id = ?`).bind(id);
    const { results } = await stmt.all();

    if (!results || results.length === 0) {
      return Response.json(
        { error: { code: 'not_found', message: 'Task not found' } },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const row = results[0] as any;
    const task: TaskConfig = {
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
    };

    return Response.json(task, { 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  } catch (err) {
    console.error('GET /api/tasks/:id failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to get task' } }, 
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
    const task = await request.json() as TaskConfig;
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
      UPDATE tasks SET 
        name = ?, description = ?, expected_output = ?, agent_id = ?, 
        context_tasks = ?, output_schema = ?, enabled = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      task.name,
      task.description,
      task.expected_output,
      task.agent_id,
      task.context_tasks ? JSON.stringify(task.context_tasks) : null,
      task.output_schema ? JSON.stringify(task.output_schema) : null,
      task.enabled !== false ? 1 : 0,
      now,
      id
    );

    const result = await stmt.run();

    if (result.changes === 0) {
      return Response.json(
        { error: { code: 'not_found', message: 'Task not found' } },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const updatedTask: TaskConfig = {
      id,
      name: task.name,
      description: task.description,
      expected_output: task.expected_output,
      agent_id: task.agent_id,
      context_tasks: task.context_tasks,
      output_schema: task.output_schema,
      enabled: task.enabled !== false,
      created_at: task.created_at || now, // Keep original if provided
      updated_at: now
    };

    return Response.json(updatedTask, { 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  } catch (err) {
    console.error('PUT /api/tasks/:id failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to update task' } }, 
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
    const stmt = DB.prepare(`DELETE FROM tasks WHERE id = ?`).bind(id);
    const result = await stmt.run();

    if (result.changes === 0) {
      return Response.json(
        { error: { code: 'not_found', message: 'Task not found' } },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    return new Response(null, { 
      status: 204, 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  } catch (err) {
    console.error('DELETE /api/tasks/:id failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to delete task' } }, 
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}