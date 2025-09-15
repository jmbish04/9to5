import { validateApiTokenResponse } from '@/lib/api';

export async function GET({ locals, request }: { locals: any; request: Request }) {
  const { API_TOKEN, DB } = locals.runtime.env as { API_TOKEN: string; DB: D1Database };

  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  try {
    // Get active jobs monitored
    const activeRow = await DB.prepare(
      'SELECT COUNT(*) as count FROM jobs WHERE daily_monitoring_enabled = 1'
    ).first<{ count: number }>();

    // Calculate jobs needing check (last crawled > monitoring frequency)
    const needingCheckRow = await DB.prepare(`
      SELECT COUNT(*) as count FROM jobs 
      WHERE daily_monitoring_enabled = 1 
      AND datetime(last_crawled_at) < datetime('now', '-' || monitoring_frequency_hours || ' hours')
    `).first<{ count: number }>();

    // Get last updated timestamp
    const lastRow = await DB.prepare(
      'SELECT MAX(last_crawled_at) as last FROM jobs'
    ).first<{ last: string }>();

    // Get recent activity (last 7 days)
    const recentActivityRows = await DB.prepare(`
      SELECT 
        DATE(changed_at) as tracking_date,
        COUNT(*) as jobs_checked,
        COUNT(CASE WHEN field != 'status' OR new_value != 'closed' THEN 1 END) as jobs_modified,
        COUNT(CASE WHEN field = 'status' AND new_value = 'closed' THEN 1 END) as jobs_closed,
        0 as errors
      FROM job_changes 
      WHERE datetime(changed_at) >= datetime('now', '-7 days')
      GROUP BY DATE(changed_at)
      ORDER BY tracking_date DESC
      LIMIT 7
    `).all<{
      tracking_date: string;
      jobs_checked: number;
      jobs_modified: number;
      jobs_closed: number;
      errors: number;
    }>();

    // Get market statistics by role and location
    const marketStatsRows = await DB.prepare(`
      SELECT 
        CASE 
          WHEN title LIKE '%Senior%' OR title LIKE '%Sr%' THEN 'Senior Developer'
          WHEN title LIKE '%Full Stack%' THEN 'Full Stack Developer'
          WHEN title LIKE '%Frontend%' OR title LIKE '%Front-end%' THEN 'Frontend Developer'
          WHEN title LIKE '%Backend%' OR title LIKE '%Back-end%' THEN 'Backend Developer'
          WHEN title LIKE '%DevOps%' THEN 'DevOps Engineer'
          ELSE 'Software Engineer'
        END as role,
        CASE 
          WHEN location LIKE '%Remote%' THEN 'Remote'
          WHEN location LIKE '%San Francisco%' OR location LIKE '%SF%' THEN 'San Francisco, CA'
          WHEN location LIKE '%New York%' OR location LIKE '%NYC%' THEN 'New York, NY'
          WHEN location LIKE '%Seattle%' THEN 'Seattle, WA'
          WHEN location LIKE '%Los Angeles%' OR location LIKE '%LA%' THEN 'Los Angeles, CA'
          WHEN location LIKE '%Austin%' THEN 'Austin, TX'
          WHEN location LIKE '%Chicago%' THEN 'Chicago, IL'
          ELSE COALESCE(location, 'Unknown')
        END as location,
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN datetime(first_seen_at) >= datetime('now', '-7 days') THEN 1 END) as new_jobs,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_jobs,
        CAST(AVG(CASE WHEN salary_min > 0 THEN salary_min END) AS INTEGER) as avg_salary_min,
        CAST(AVG(CASE WHEN salary_max > 0 THEN salary_max END) AS INTEGER) as avg_salary_max
      FROM jobs
      WHERE title IS NOT NULL AND title != ''
      GROUP BY role, location
      HAVING COUNT(*) >= 1
      ORDER BY total_jobs DESC, avg_salary_max DESC
      LIMIT 10
    `).all<{
      role: string;
      location: string;
      total_jobs: number;
      new_jobs: number;
      closed_jobs: number;
      avg_salary_min: number;
      avg_salary_max: number;
    }>();

    return Response.json({
      active_jobs_monitored: activeRow?.count ?? 0,
      jobs_needing_check: needingCheckRow?.count ?? 0,
      last_updated: lastRow?.last ?? new Date().toISOString(),
      recent_activity: recentActivityRows.results || [],
      market_statistics: marketStatsRows.results || []
    }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (err) {
    console.error('GET /api/monitoring/status failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to load monitoring status' } },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
