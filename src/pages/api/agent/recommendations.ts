// Personalized job recommendations
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  try {
    const user_id = url.searchParams.get('user_id');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    if (!user_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'user_id parameter is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Mock personalized recommendations based on user behavior
    const recommendations = {
      user_id,
      recommendations: [
        {
          job_id: 'job-001',
          title: 'Senior Frontend Developer',
          company: 'TechCorp',
          location: 'Remote',
          fit_score: 92,
          recommendation_reason: 'Perfect match for React and TypeScript skills',
          salary_range: { min: 120000, max: 150000 },
          posted_date: '2024-01-10'
        },
        {
          job_id: 'job-002', 
          title: 'Full Stack Engineer',
          company: 'StartupCo',
          location: 'San Francisco, CA',
          fit_score: 85,
          recommendation_reason: 'Good cultural fit and growth opportunity',
          salary_range: { min: 110000, max: 140000 },
          posted_date: '2024-01-09'
        },
        {
          job_id: 'job-003',
          title: 'React Developer',
          company: 'MegaCorp',
          location: 'New York, NY', 
          fit_score: 78,
          recommendation_reason: 'Strong technical match, stable company',
          salary_range: { min: 100000, max: 130000 },
          posted_date: '2024-01-08'
        }
      ],
      metadata: {
        total_recommendations: 3,
        recommendation_engine_version: '2.1',
        last_updated: new Date().toISOString(),
        factors_considered: [
          'skills_match',
          'experience_level',
          'salary_preferences', 
          'location_preferences',
          'company_culture_fit',
          'career_growth_potential'
        ]
      }
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: recommendations
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};