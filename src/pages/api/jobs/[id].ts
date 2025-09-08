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
    return Response.json(job, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (err) {
    console.error('GET /api/jobs/:id failed', err);
    return Response.json({ error: { code: 'internal_error', message: 'Failed to load job' } }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
