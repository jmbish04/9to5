// Change detection and notification API
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const since = url.searchParams.get('since'); // ISO timestamp
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const jobId = url.searchParams.get('job_id');
    
    let query = `
      SELECT 
        jc.*,
        j.title as job_title,
        j.company,
        j.url as job_url
      FROM job_changes jc
      JOIN jobs j ON jc.job_id = j.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (since) {
      conditions.push('jc.changed_at > ?');
      params.push(since);
    }
    
    if (jobId) {
      conditions.push('jc.job_id = ?');
      params.push(jobId);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY jc.changed_at DESC LIMIT ?';
    params.push(limit);
    
    const stmt = db.prepare(query);
    const changes = await stmt.bind(...params).all();
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        changes: changes.results?.map(change => ({
          id: change.id,
          job_id: change.job_id,
          job_title: change.job_title,
          company: change.company,
          job_url: change.job_url,
          field: change.field,
          old_value: change.old_value,
          new_value: change.new_value,
          changed_at: change.changed_at,
          change_type: determineChangeType(change.field, change.old_value, change.new_value)
        })) || [],
        total_count: changes.results?.length || 0,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Change detection error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const body = await request.json();
    const { job_id, field, old_value, new_value, snapshot_id } = body;
    
    if (!job_id || !field) {
      return new Response(JSON.stringify({
        success: false,
        error: 'job_id and field are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Record the change
    const changeId = crypto.randomUUID();
    const insertQuery = db.prepare(`
      INSERT INTO job_changes (id, job_id, snapshot_id, changed_at, field, old_value, new_value)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    await insertQuery.bind(
      changeId,
      job_id,
      snapshot_id || null,
      new Date().toISOString(),
      field,
      old_value || null,
      new_value || null
    ).run();
    
    // Get job details for notifications
    const jobQuery = db.prepare('SELECT title, company, url FROM jobs WHERE id = ?');
    const job = await jobQuery.bind(job_id).first();
    
    // Trigger notifications if configured
    await triggerChangeNotifications(locals.runtime.env, {
      job_id,
      job_title: job?.title,
      company: job?.company,
      job_url: job?.url,
      field,
      old_value,
      new_value,
      change_type: determineChangeType(field, old_value, new_value)
    });
    
    return new Response(JSON.stringify({
      success: true,
      change_id: changeId,
      message: 'Change recorded successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Change recording error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

function determineChangeType(field: string, oldValue: any, newValue: any): string {
  if (!oldValue && newValue) return 'added';
  if (oldValue && !newValue) return 'removed';
  if (field === 'status') return 'status_change';
  if (field.includes('salary')) return 'salary_change';
  if (field === 'title') return 'title_change';
  if (field === 'location') return 'location_change';
  return 'modified';
}

async function triggerChangeNotifications(env: any, changeData: any): Promise<void> {
  // TODO: Implement email notifications, webhook calls, etc.
  // This would integrate with the email_config table and send notifications
  // to users who have opted in for job change alerts
  console.log('Change notification triggered:', changeData);
}