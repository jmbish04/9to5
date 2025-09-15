import type { APIRoute } from 'astro';

export interface EmailLog {
  id: string;
  created_at: string;
  from_email: string;
  subject: string;
  job_links_extracted: number;
  jobs_processed: number;
  notes?: string;
}

export const GET: APIRoute = async ({ url, request }) => {
  try {
    const env = import.meta.env;
    const db = env.DB;
    
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse query parameters for pagination and filtering
    const searchParams = new URL(request.url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;
    
    const from_email = searchParams.get('from_email');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    // Build query with filters
    let whereConditions = [];
    let params = [];

    if (from_email) {
      whereConditions.push('from_email LIKE ?');
      params.push(`%${from_email}%`);
    }

    if (start_date) {
      whereConditions.push('created_at >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('created_at <= ?');
      params.push(end_date);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM email_logs 
      ${whereClause}
    `;
    
    const { results: countResults } = await db.prepare(countQuery).bind(...params).all();
    const total = countResults?.[0]?.total || 0;

    // Get email logs with pagination
    const dataQuery = `
      SELECT id, created_at, from_email, subject, job_links_extracted, 
             jobs_processed, notes
      FROM email_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const { results } = await db.prepare(dataQuery)
      .bind(...params, limit, offset)
      .all();

    return new Response(JSON.stringify({ 
      email_logs: results || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      success: true 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching email logs:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch email logs',
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const env = import.meta.env;
    const db = env.DB;
    
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { 
      from_email,
      subject,
      job_links_extracted = 0,
      jobs_processed = 0,
      notes = ''
    } = body;

    if (!from_email || !subject) {
      return new Response(JSON.stringify({ 
        error: 'from_email and subject are required',
        success: false
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO email_logs (id, created_at, from_email, subject, 
                             job_links_extracted, jobs_processed, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      created_at,
      from_email,
      subject,
      job_links_extracted,
      jobs_processed,
      notes
    ).run();

    return new Response(JSON.stringify({ 
      message: 'Email log created successfully',
      success: true,
      email_log: {
        id,
        created_at,
        from_email,
        subject,
        job_links_extracted,
        jobs_processed,
        notes
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating email log:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create email log',
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};