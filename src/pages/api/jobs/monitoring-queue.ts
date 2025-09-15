import { validateApiTokenResponse } from '@/lib/api';

interface QueuedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  employment_type: string;
  last_crawled_at: string;
  monitoring_priority: number;
  days_since_last_check: number;
}

export async function GET({ locals, request }: { locals: any; request: Request }) {
  const { API_TOKEN } = locals.runtime.env as { API_TOKEN: string };
  const invalid = await validateApiTokenResponse(request, API_TOKEN);
  if (invalid) return invalid;

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 100);

  try {
    // Mock data for now - in a real implementation this would query the database
    // for jobs that need monitoring based on their last_crawled_at and monitoring settings
    const mockJobs: QueuedJob[] = [
      {
        id: 'job-001',
        title: 'Senior Frontend Developer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        url: 'https://techcorp.com/jobs/senior-frontend-dev',
        employment_type: 'Full-time',
        last_crawled_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        monitoring_priority: 8,
        days_since_last_check: 2
      },
      {
        id: 'job-002',
        title: 'React Developer',
        company: 'StartupXYZ',
        location: 'Remote',
        url: 'https://startupxyz.com/careers/react-dev',
        employment_type: 'Full-time',
        last_crawled_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        monitoring_priority: 6,
        days_since_last_check: 3
      },
      {
        id: 'job-003',
        title: 'Full Stack Engineer',
        company: 'BigTech Inc',
        location: 'New York, NY',
        url: 'https://bigtech.com/jobs/fullstack-eng',
        employment_type: 'Full-time',
        last_crawled_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        monitoring_priority: 9,
        days_since_last_check: 1
      },
      {
        id: 'job-004',
        title: 'TypeScript Developer',
        company: 'DevShop',
        location: 'Austin, TX',
        url: 'https://devshop.com/positions/typescript-dev',
        employment_type: 'Contract',
        last_crawled_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        monitoring_priority: 4,
        days_since_last_check: 5
      },
      {
        id: 'job-005',
        title: 'Node.js Backend Developer',
        company: 'CloudCorp',
        location: 'Seattle, WA',
        url: 'https://cloudcorp.com/careers/nodejs-backend',
        employment_type: 'Full-time',
        last_crawled_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        monitoring_priority: 7,
        days_since_last_check: 4
      }
    ];

    // Sort by priority (high to low) then by days since last check (high to low)
    const sortedJobs = mockJobs
      .sort((a, b) => {
        if (a.monitoring_priority !== b.monitoring_priority) {
          return b.monitoring_priority - a.monitoring_priority;
        }
        return b.days_since_last_check - a.days_since_last_check;
      })
      .slice(0, limit);

    const response = {
      total_jobs: mockJobs.length,
      returned_jobs: sortedJobs.length,
      jobs: sortedJobs
    };

    return Response.json(response, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    console.error('Error fetching monitoring queue:', error);
    return Response.json(
      { error: 'Failed to fetch monitoring queue' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}