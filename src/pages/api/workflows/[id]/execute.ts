import { validateApiTokenResponse } from '@/lib/api';
import type { operations } from '@/lib/types/openapi';

type ExecuteWorkflowResponse = operations['executeWorkflow']['responses']['200']['content']['application/json'];

export async function POST({ locals, request, params }: { locals: any; request: Request; params: any }) {
  const { API_TOKEN, DB } = locals.runtime.env as { API_TOKEN: string; DB: D1Database };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  const { id } = params;

  try {
    const body = await request.json().catch(() => ({}));
    const context = body?.context || {};

    // Get the workflow
    const workflowStmt = DB.prepare(`SELECT * FROM workflows WHERE id = ? AND enabled = 1`).bind(id);
    const { results: workflowResults } = await workflowStmt.all();

    if (!workflowResults || workflowResults.length === 0) {
      return Response.json(
        { error: { code: 'not_found', message: 'Workflow not found or disabled' } },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const workflow = workflowResults[0] as any;
    const taskSequence = JSON.parse(workflow.task_sequence) as string[];

    if (taskSequence.length === 0) {
      return Response.json(
        { error: { code: 'validation_error', message: 'Workflow has no tasks to execute' } },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Get all tasks and agents in the sequence
    const taskPlaceholders = taskSequence.map(() => '?').join(',');
    const tasksStmt = DB.prepare(`
      SELECT t.*, a.name as agent_name, a.role as agent_role, a.llm, a.system_prompt, 
             a.max_tokens, a.temperature, a.enabled as agent_enabled
      FROM tasks t 
      JOIN agents a ON t.agent_id = a.id 
      WHERE t.id IN (${taskPlaceholders}) AND t.enabled = 1 AND a.enabled = 1
    `).bind(...taskSequence);
    
    const { results: taskResults } = await tasksStmt.all();

    if (!taskResults || taskResults.length !== taskSequence.length) {
      return Response.json(
        { error: { code: 'validation_error', message: 'Some tasks or agents in workflow are missing or disabled' } },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Create a map for quick task lookup
    const taskMap = new Map();
    taskResults.forEach((task: any) => {
      taskMap.set(task.id, task);
    });

    // Execute workflow simulation (in a real implementation, this would integrate with actual AI agents)
    const executionId = crypto.randomUUID();
    const startTime = new Date().toISOString();
    const taskResults_exec: any[] = [];
    let accumulatedOutput = '';

    for (let i = 0; i < taskSequence.length; i++) {
      const taskId = taskSequence[i];
      const task = taskMap.get(taskId);
      
      if (!task) {
        return Response.json(
          { error: { code: 'execution_error', message: `Task ${taskId} not found during execution` } },
          { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }

      const taskStartTime = new Date().toISOString();
      
      // Simulate task execution (in production, this would call actual AI agents)
      const simulatedOutput = `Task "${task.name}" executed by agent "${task.agent_name}" (${task.agent_role}). ` +
        `Expected output: ${task.expected_output}. ` +
        `Context from previous tasks: ${accumulatedOutput || 'None'}. ` +
        `Additional context: ${JSON.stringify(context)}.`;
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const taskEndTime = new Date().toISOString();
      accumulatedOutput += simulatedOutput + ' ';

      taskResults_exec.push({
        task_id: taskId,
        task_name: task.name,
        agent_id: task.agent_id,
        agent_name: task.agent_name,
        status: 'completed',
        output: simulatedOutput,
        started_at: taskStartTime,
        completed_at: taskEndTime,
        execution_time_ms: 100 // Simulated
      });
    }

    const endTime = new Date().toISOString();

    const response: ExecuteWorkflowResponse = {
      execution_id: executionId,
      workflow_id: id,
      workflow_name: workflow.name,
      status: 'completed',
      started_at: startTime,
      completed_at: endTime,
      task_results: taskResults_exec,
      final_output: accumulatedOutput.trim(),
      context: context
    };

    return Response.json(response, { 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  } catch (err) {
    console.error('POST /api/workflows/:id/execute failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to execute workflow' } }, 
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}