import { validateApiTokenResponse } from '@/lib/api';

export async function POST({ locals, request }: { locals: any; request: Request }) {
  const { API_TOKEN } = locals.runtime.env as { API_TOKEN: string };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;
  return Response.json({ run_id: crypto.randomUUID(), status: 'queued' }, { headers: { 'Access-Control-Allow-Origin': '*' } });
}
