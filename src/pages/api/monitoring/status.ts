import { validateApiTokenResponse } from '@/lib/api';

export async function GET({ locals, request }: { locals: any; request: Request }) {
  const { API_TOKEN, DB } = locals.runtime.env as { API_TOKEN: string; DB: D1Database };

  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  try {
    const activeRow = await DB.prepare(
      'SELECT COUNT(*) as count FROM jobs WHERE daily_monitoring_enabled = 1'
    ).first<{ count: number }>();
    const lastRow = await DB.prepare(
      'SELECT MAX(last_crawled_at) as last FROM jobs'
    ).first<{ last: string }>();

    return Response.json({
      active_jobs_monitored: activeRow?.count ?? 0,
      jobs_needing_check: 0, // TODO: derive from last_crawled_at vs freq
      last_updated: lastRow?.last ?? new Date().toISOString(),
      recent_activity: [],
      market_statistics: []
    }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (err) {
    console.error('GET /api/monitoring/status failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to load monitoring status' } },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
