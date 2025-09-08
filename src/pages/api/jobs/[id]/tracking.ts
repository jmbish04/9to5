import { validateApiTokenResponse } from '@/lib/api';

export async function GET({ locals, params, request }: { locals: any; params: { id: string }; request: Request }) {
  const { API_TOKEN, DB } = locals.runtime.env as { API_TOKEN: string; DB: D1Database };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  try {
    const job = await DB.prepare(
      'SELECT id, site_id, url, canonical_url, title, company, location, employment_type, department, salary_min, salary_max, salary_currency, source, status, posted_at, first_seen_at, last_crawled_at, daily_monitoring_enabled, monitoring_frequency_hours FROM jobs WHERE id = ?'
    ).bind(params.id).first();
    if (!job) {
      return Response.json({ error: { code: 'not_found', message: 'Job not found' } }, { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const snapshots = await DB.prepare(
      'SELECT id, job_id, taken_at as tracking_date, r2_key, content_type FROM job_snapshots WHERE job_id = ? ORDER BY taken_at DESC'
    ).bind(params.id).all();
    const changes = await DB.prepare(
      'SELECT id, job_id, snapshot_id, changed_at as tracking_date, field, old_value, new_value FROM job_changes WHERE job_id = ? ORDER BY changed_at DESC'
    ).bind(params.id).all();

    const timeline = [
      ...(snapshots.results || []).map((s: any) => ({
        id: s.id,
        job_id: s.job_id,
        tracking_date: s.tracking_date,
        status: 'checked',
        snapshot_id: s.id
      })),
      ...(changes.results || []).map((c: any) => ({
        id: c.id,
        job_id: c.job_id,
        tracking_date: c.tracking_date,
        status: 'changed',
        change_summary: c.field ? `${c.field} changed` : undefined,
        snapshot_id: c.snapshot_id
      }))
    ].sort((a, b) => new Date(b.tracking_date).getTime() - new Date(a.tracking_date).getTime());

    return Response.json({
      job,
      timeline,
      snapshots: snapshots.results || [],
      changes: changes.results || []
    }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (err) {
    console.error('GET /api/jobs/:id/tracking failed', err);
    return Response.json({ error: { code: 'internal_error', message: 'Failed to load tracking' } }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
