import { validateApiTokenResponse } from '@/lib/api';

export async function GET({ locals, params, request }: { 
  locals: any; 
  params: { id: string; snapshotId: string }; 
  request: Request 
}) {
  const { API_TOKEN, DB } = locals.runtime.env as { API_TOKEN: string; DB: D1Database };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  const { id: jobId, snapshotId } = params;

  try {
    // Get snapshot record from DB
    const snapshot = await DB.prepare(
      'SELECT id, job_id, taken_at, content_type, r2_key FROM job_snapshots WHERE id = ? AND job_id = ?'
    ).bind(snapshotId, jobId).first();
    
    if (!snapshot) {
      return Response.json(
        { error: { code: 'not_found', message: 'Snapshot not found' } }, 
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // For now, return mock content since R2 integration isn't fully implemented
    // In production, this would fetch from R2 using the r2_key
    let content = '';
    let contentType = 'text/html';
    
    if (snapshot.content_type === 'text/html') {
      content = `
        <div class="job-content">
          <h1>Software Engineer - Frontend</h1>
          <p><strong>Company:</strong> TechCorp Inc.</p>
          <p><strong>Location:</strong> San Francisco, CA</p>
          <p><strong>Type:</strong> Full-time</p>
          
          <h2>Job Description</h2>
          <p>We are seeking a talented Frontend Engineer to join our growing team. You will work on building scalable web applications using modern JavaScript frameworks.</p>
          
          <h2>Requirements</h2>
          <ul>
            <li>3+ years experience with React.js</li>
            <li>Strong knowledge of TypeScript</li>
            <li>Experience with modern build tools</li>
            <li>Knowledge of CSS frameworks</li>
          </ul>
          
          <h2>Benefits</h2>
          <ul>
            <li>Competitive salary ($120k - $180k)</li>
            <li>Health, dental, and vision insurance</li>
            <li>401k matching</li>
            <li>Remote work flexibility</li>
          </ul>
        </div>
      `;
      contentType = 'text/html';
    } else if (snapshot.content_type === 'text/markdown') {
      content = `
# Software Engineer - Frontend

**Company:** TechCorp Inc.  
**Location:** San Francisco, CA  
**Type:** Full-time  

## Job Description

We are seeking a talented Frontend Engineer to join our growing team. You will work on building scalable web applications using modern JavaScript frameworks.

## Requirements

- 3+ years experience with React.js
- Strong knowledge of TypeScript
- Experience with modern build tools
- Knowledge of CSS frameworks

## Benefits

- Competitive salary ($120k - $180k)
- Health, dental, and vision insurance
- 401k matching
- Remote work flexibility
      `;
      contentType = 'text/markdown';
    } else if (snapshot.content_type === 'application/pdf') {
      return Response.json(
        { error: { code: 'unsupported_inline', message: 'PDF files open in new tab' } }, 
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    } else if (snapshot.content_type === 'image/png') {
      return Response.json(
        { error: { code: 'unsupported_inline', message: 'PNG files open in new tab' } }, 
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    console.error('GET /api/jobs/:id/snapshots/:snapshotId/content failed', err);
    return Response.json(
      { error: { code: 'internal_error', message: 'Failed to load snapshot content' } }, 
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}