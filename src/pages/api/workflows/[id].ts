import { validateApiTokenResponse } from '@/lib/api';
import type { components } from '@/lib/types/openapi';

type WorkflowConfig = components['schemas']['WorkflowConfig'];

export async function GET({ locals, request, params }: { locals: any; request: Request; params: any }) {
  const { API_TOKEN, DB } = locals.runtime.env as { API_TOKEN: string; DB: D1Database };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  const { id } = params;

  try {
    const stmt = DB.prepare(`SELECT * FROM workflows WHERE id = ?`).bind(id);
    const { results } = await stmt.all();

    if (!results || results.length === 0) {
      return Response.json(
        { error: { code: 'not_found', message: 'Workflow not found' } },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const row = results[0] as any;
    const workflow: WorkflowConfig = {
      id: row.id,
      name: row.name,
      description: row.description,
      task_sequence: JSON.parse(row.task_sequence),
      enabled: Boolean(row.enabled),
      created_at: row.created_at,
      updated_at: row.updated_at
    };

    return Response.json(workflow, { 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  } catch (err) {
    console.error('GET /api/workflows/:id failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to get workflow' } }, 
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
    const workflow = await request.json() as WorkflowConfig;
    const now = new Date().toISOString();

    // Validate required fields
    if (!workflow.name || !workflow.description || !workflow.task_sequence || !Array.isArray(workflow.task_sequence)) {
      return Response.json(
        { error: { code: 'validation_error', message: 'Missing required fields or invalid task_sequence' } },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Validate that all tasks in the sequence exist
    if (workflow.task_sequence.length > 0) {
      const taskPlaceholders = workflow.task_sequence.map(() => '?').join(',');
      const taskStmt = DB.prepare(`SELECT id FROM tasks WHERE id IN (${taskPlaceholders})`).bind(...workflow.task_sequence);
      const { results: taskResults } = await taskStmt.all();
      
      if (!taskResults || taskResults.length !== workflow.task_sequence.length) {
        return Response.json(
          { error: { code: 'validation_error', message: 'One or more tasks in sequence not found' } },
          { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
    }

    const stmt = DB.prepare(`
      UPDATE workflows SET 
        name = ?, description = ?, task_sequence = ?, enabled = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      workflow.name,
      workflow.description,
      JSON.stringify(workflow.task_sequence),
      workflow.enabled !== false ? 1 : 0,
      now,
      id
    );

    const result = await stmt.run();

    if (result.changes === 0) {
      return Response.json(
        { error: { code: 'not_found', message: 'Workflow not found' } },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const updatedWorkflow: WorkflowConfig = {
      id,
      name: workflow.name,
      description: workflow.description,
      task_sequence: workflow.task_sequence,
      enabled: workflow.enabled !== false,
      created_at: workflow.created_at || now, // Keep original if provided
      updated_at: now
    };

    return Response.json(updatedWorkflow, { 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  } catch (err) {
    console.error('PUT /api/workflows/:id failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to update workflow' } }, 
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
    const stmt = DB.prepare(`DELETE FROM workflows WHERE id = ?`).bind(id);
    const result = await stmt.run();

    if (result.changes === 0) {
      return Response.json(
        { error: { code: 'not_found', message: 'Workflow not found' } },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    return new Response(null, { 
      status: 204, 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  } catch (err) {
    console.error('DELETE /api/workflows/:id failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to delete workflow' } }, 
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}