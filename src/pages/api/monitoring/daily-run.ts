import { validateApiTokenResponse } from '@/lib/api';

export async function POST({ locals, request }: { locals: any; request: Request }) {
  const { API_TOKEN, DB } = locals.runtime.env as { API_TOKEN: string; DB: D1Database };

  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  try {
    // Get jobs that need monitoring check
    const jobsToCheck = await DB.prepare(`
      SELECT id, url, title, company, monitoring_frequency_hours, last_crawled_at
      FROM jobs 
      WHERE daily_monitoring_enabled = 1 
      AND datetime(last_crawled_at) < datetime('now', '-' || monitoring_frequency_hours || ' hours')
      ORDER BY last_crawled_at ASC
      LIMIT 50
    `).all<{
      id: string;
      url: string;
      title: string;
      company: string;
      monitoring_frequency_hours: number;
      last_crawled_at: string;
    }>();

    let jobsChecked = 0;
    let jobsUpdated = 0;
    let errors = 0;
    const runId = `run-${Date.now()}`;
    const runStartTime = new Date().toISOString();

    // Simulate monitoring process for each job
    for (const job of jobsToCheck.results || []) {
      try {
        // Update last_crawled_at timestamp
        await DB.prepare(
          'UPDATE jobs SET last_crawled_at = ? WHERE id = ?'
        ).bind(runStartTime, job.id).run();

        jobsChecked++;

        // Simulate finding changes in some jobs (30% chance)
        if (Math.random() < 0.3) {
          const changeId = `change-${runId}-${job.id}`;
          
          // Insert a simulated change
          await DB.prepare(`
            INSERT INTO job_changes (id, job_id, snapshot_id, changed_at, field, old_value, new_value)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            changeId,
            job.id,
            `snap-${runId}-${job.id}`,
            runStartTime,
            'description',
            'Previous job description',
            'Updated job description with new requirements'
          ).run();

          jobsUpdated++;
        }

      } catch (jobError) {
        console.error(`Error checking job ${job.id}:`, jobError);
        errors++;
      }
    }

    // Calculate summary stats
    const summary = {
      run_id: runId,
      started_at: runStartTime,
      completed_at: new Date().toISOString(),
      jobs_checked: jobsChecked,
      jobs_updated: jobsUpdated,
      errors_encountered: errors,
      total_jobs_eligible: jobsToCheck.results?.length || 0,
      next_run_needed: jobsChecked > 0 ? true : false
    };

    return Response.json(summary, { 
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    console.error('POST /api/monitoring/daily-run failed', err);
    return Response.json(
      { 
        error: { 
          code: 'internal_error', 
          message: 'Failed to run daily monitoring' 
        },
        run_id: `run-${Date.now()}`,
        started_at: new Date().toISOString(),
        jobs_checked: 0,
        jobs_updated: 0,
        errors_encountered: 1
      },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-token'
    }
  });
}