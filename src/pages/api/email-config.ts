import type { APIRoute } from 'astro';

export interface EmailConfig {
  id: string;
  recipient_email: string;
  include_new_jobs: boolean;
  include_job_changes: boolean;
  include_statistics: boolean;
  frequency_hours: number;
  last_sent_at?: string;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const env = import.meta.env;
    const db = env.DB;
    
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all email configurations
    const { results } = await db.prepare(`
      SELECT id, recipient_email, include_new_jobs, include_job_changes, 
             include_statistics, frequency_hours, last_sent_at
      FROM email_config
      ORDER BY recipient_email
    `).all();

    return new Response(JSON.stringify({ 
      email_configs: results || [],
      success: true 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching email configs:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch email configurations',
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
      recipient_email, 
      include_new_jobs = false, 
      include_job_changes = false,
      include_statistics = false,
      frequency_hours = 24 
    } = body;

    if (!recipient_email) {
      return new Response(JSON.stringify({ 
        error: 'recipient_email is required',
        success: false
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const id = crypto.randomUUID();
    
    await db.prepare(`
      INSERT INTO email_config (id, recipient_email, include_new_jobs, include_job_changes, 
                               include_statistics, frequency_hours)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      recipient_email,
      include_new_jobs ? 1 : 0,
      include_job_changes ? 1 : 0,
      include_statistics ? 1 : 0,
      frequency_hours
    ).run();

    return new Response(JSON.stringify({ 
      message: 'Email configuration created successfully',
      success: true,
      email_config: {
        id,
        recipient_email,
        include_new_jobs,
        include_job_changes,
        include_statistics,
        frequency_hours
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating email config:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create email configuration',
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
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
      id,
      recipient_email, 
      include_new_jobs = false, 
      include_job_changes = false,
      include_statistics = false,
      frequency_hours = 24 
    } = body;

    if (!id) {
      return new Response(JSON.stringify({ 
        error: 'id is required',
        success: false
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await db.prepare(`
      UPDATE email_config 
      SET recipient_email = ?, include_new_jobs = ?, include_job_changes = ?, 
          include_statistics = ?, frequency_hours = ?
      WHERE id = ?
    `).bind(
      recipient_email,
      include_new_jobs ? 1 : 0,
      include_job_changes ? 1 : 0,
      include_statistics ? 1 : 0,
      frequency_hours,
      id
    ).run();

    if (result.changes === 0) {
      return new Response(JSON.stringify({ 
        error: 'Email configuration not found',
        success: false
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Email configuration updated successfully',
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating email config:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update email configuration',
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
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
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({ 
        error: 'id is required',
        success: false
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await db.prepare(`DELETE FROM email_config WHERE id = ?`).bind(id).run();

    if (result.changes === 0) {
      return new Response(JSON.stringify({ 
        error: 'Email configuration not found',
        success: false
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Email configuration deleted successfully',
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting email config:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete email configuration',
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};