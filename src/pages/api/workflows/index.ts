import { validateApiTokenResponse } from '@/lib/api';
import type { components } from '@/lib/types/openapi';

type WorkflowConfig = components['schemas']['WorkflowConfig'];

export async function GET({ locals, request }: { locals: any; request: Request }) {
  const { API_TOKEN, DB } = locals.runtime.env as { API_TOKEN: string; DB: D1Database };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  const url = new URL(request.url);
  const enabled = url.searchParams.get('enabled');

  try {
    let query = `SELECT * FROM workflows`;
    const params: any[] = [];
    
    if (enabled !== null) {
      query += ` WHERE enabled = ?`;
      params.push(enabled === 'true' ? 1 : 0);
    }
    
    query += ` ORDER BY created_at DESC`;

    const stmt = DB.prepare(query).bind(...params);
    const { results } = await stmt.all();

    const workflows = (results ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      task_sequence: JSON.parse(row.task_sequence),
      enabled: Boolean(row.enabled),
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    return Response.json(workflows, { 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  } catch (err) {
    console.error('GET /api/workflows failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to list workflows' } }, 
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

export async function POST({ locals, request }: { locals: any; request: Request }) {
  const { API_TOKEN, DB } = locals.runtime.env as { API_TOKEN: string; DB: D1Database };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  try {
    const workflow = await request.json() as WorkflowConfig;
    
    // Generate ID and timestamps
    const id = workflow.id || crypto.randomUUID();
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
      INSERT INTO workflows (
        id, name, description, task_sequence, enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      workflow.name,
      workflow.description,
      JSON.stringify(workflow.task_sequence),
      workflow.enabled !== false ? 1 : 0,
      now,
      now
    );

    await stmt.run();

    const createdWorkflow: WorkflowConfig = {
      id,
      name: workflow.name,
      description: workflow.description,
      task_sequence: workflow.task_sequence,
      enabled: workflow.enabled !== false,
      created_at: now,
      updated_at: now
    };

    return Response.json(createdWorkflow, { 
      status: 201,
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  } catch (err) {
    console.error('POST /api/workflows failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to create workflow' } }, 
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}