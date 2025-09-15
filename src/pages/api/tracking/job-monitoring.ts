// Real-time job tracking and change detection API
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const jobId = url.searchParams.get('job_id');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    if (!jobId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'job_id parameter is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get job details with tracking status
    const jobQuery = db.prepare(`
      SELECT 
        j.*,
        COUNT(jc.id) as change_count,
        MAX(jc.changed_at) as last_change_at
      FROM jobs j 
      LEFT JOIN job_changes jc ON j.id = jc.job_id 
      WHERE j.id = ?
      GROUP BY j.id
    `);
    
    const job = await jobQuery.bind(jobId).first();
    
    if (!job) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Job not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get recent changes
    const changesQuery = db.prepare(`
      SELECT 
        jc.*,
        js.taken_at as snapshot_date
      FROM job_changes jc
      LEFT JOIN job_snapshots js ON jc.snapshot_id = js.id
      WHERE jc.job_id = ?
      ORDER BY jc.changed_at DESC
      LIMIT ?
    `);
    
    const changes = await changesQuery.bind(jobId, limit).all();
    
    // Get monitoring status
    const monitoring = {
      enabled: !!job.daily_monitoring_enabled,
      frequency_hours: job.monitoring_frequency_hours || 24,
      last_crawled: job.last_crawled_at,
      next_check: calculateNextCheck(job.last_crawled_at, job.monitoring_frequency_hours)
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        job: {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          status: job.status,
          url: job.url,
          posted_at: job.posted_at,
          salary_range: {
            min: job.salary_min,
            max: job.salary_max,
            currency: job.salary_currency
          }
        },
        tracking: {
          change_count: job.change_count,
          last_change_at: job.last_change_at,
          monitoring
        },
        recent_changes: changes.results?.map(change => ({
          id: change.id,
          field: change.field,
          old_value: change.old_value,
          new_value: change.new_value,
          changed_at: change.changed_at,
          snapshot_date: change.snapshot_date
        })) || []
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Job tracking error:', error);
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
    const { job_id, monitoring_enabled, frequency_hours } = body;
    
    if (!job_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'job_id is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Update job monitoring settings
    const updateQuery = db.prepare(`
      UPDATE jobs 
      SET 
        daily_monitoring_enabled = ?,
        monitoring_frequency_hours = ?
      WHERE id = ?
    `);
    
    await updateQuery.bind(
      monitoring_enabled ? 1 : 0,
      frequency_hours || 24,
      job_id
    ).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Job monitoring settings updated'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Job monitoring update error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

function calculateNextCheck(lastCrawled: string | null, frequencyHours: number): string {
  if (!lastCrawled) {
    return new Date().toISOString();
  }
  
  const lastCheck = new Date(lastCrawled);
  const nextCheck = new Date(lastCheck.getTime() + (frequencyHours * 60 * 60 * 1000));
  return nextCheck.toISOString();
}