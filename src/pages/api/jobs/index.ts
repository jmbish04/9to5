import { validateApiTokenResponse } from '@/lib/api';
import type { ListJobsParams } from '@/lib/api';

export async function GET({ locals, request }: { locals: any; request: Request }) {
  const { API_TOKEN, DB } = locals.runtime.env as { API_TOKEN: string; DB: D1Database };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '25', 10) || 25;
  const offset = parseInt(url.searchParams.get('offset') || '0', 10) || 0;
  const status = url.searchParams.get('status');
  const source = url.searchParams.get('source');

  try {
    let query = `SELECT id, site_id, url, canonical_url, title, company, location, employment_type, department, salary_min, salary_max, salary_currency, source, status, posted_at, first_seen_at FROM jobs`;
    const params: any[] = [];
    const where: string[] = [];
    if (status) { where.push('status = ?'); params.push(status); }
    if (source) { where.push('source = ?'); params.push(source); }
    if (where.length) query += ' WHERE ' + where.join(' AND ');
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const stmt = DB.prepare(query).bind(...params);
    const { results } = await stmt.all();
    return Response.json(results ?? [], { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (err) {
    console.error('GET /api/jobs failed', err);
    return Response.json({ error: { code: 'internal_error', message: 'Failed to list jobs' } }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
