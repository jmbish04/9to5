import type { APIRoute } from 'astro';
import { AgentOrchestrator, getAgentsConfig } from '../../../lib/ai';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { analysis_type = 'market_analysis' } = body;

    // Initialize orchestrator
    const config = getAgentsConfig('development');
    const orchestrator = new AgentOrchestrator(config);

    let agentRequest;
    
    switch (analysis_type) {
      case 'market_analysis':
        const { role, location, timeframe } = body;
        if (!role || !location) {
          return new Response(JSON.stringify({
            error: 'role and location are required for market analysis'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        agentRequest = AgentOrchestrator.createMarketAnalysisRequest(
          'default-user',
          role,
          location,
          timeframe
        );
        break;
      
      case 'salary_analysis':
        const { role: salary_role, location: salary_location, experience_years, skills } = body;
        if (!salary_role || !salary_location || experience_years === undefined || !skills) {
          return new Response(JSON.stringify({
            error: 'role, location, experience_years, and skills are required for salary analysis'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        agentRequest = AgentOrchestrator.createSalaryAnalysisRequest(
          'default-user',
          salary_role,
          salary_location,
          experience_years,
          skills
        );
        break;
      
      case 'company_intelligence':
        const { company_name, metrics } = body;
        if (!company_name) {
          return new Response(JSON.stringify({
            error: 'company_name is required for company intelligence'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        agentRequest = AgentOrchestrator.createCompanyIntelligenceRequest(
          'default-user',
          company_name,
          metrics
        );
        break;
      
      case 'skill_trends':
        const { skills: trend_skills, timeframe: trends_timeframe } = body;
        if (!trend_skills || !Array.isArray(trend_skills)) {
          return new Response(JSON.stringify({
            error: 'skills array is required for skill trends analysis'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        agentRequest = AgentOrchestrator.createSkillTrendsRequest(
          'default-user',
          trend_skills,
          trends_timeframe
        );
        break;
      
      default:
        return new Response(JSON.stringify({
          error: `Unknown analysis type: ${analysis_type}`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    // Process the request
    const response = await orchestrator.processRequest(agentRequest);

    if (response.status === 'error') {
      return new Response(JSON.stringify({
        error: response.error?.message || 'Market intelligence analysis failed',
        code: response.error?.code
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      request_id: response.request_id,
      analysis_type,
      data: response.data,
      metadata: response.metadata
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Market intelligence error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const analysis_type = searchParams.get('type') || 'market_analysis';
    const role = searchParams.get('role');
    const location = searchParams.get('location');
    const timeframe = searchParams.get('timeframe');

    if (analysis_type === 'market_analysis') {
      if (!role || !location) {
        return new Response(JSON.stringify({
          error: 'role and location query parameters are required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Initialize orchestrator
      const config = getAgentsConfig('development');
      const orchestrator = new AgentOrchestrator(config);

      const agentRequest = AgentOrchestrator.createMarketAnalysisRequest(
        'default-user',
        role,
        location,
        timeframe || '6 months'
      );

      // Process the request
      const response = await orchestrator.processRequest(agentRequest);

      if (response.status === 'error') {
        return new Response(JSON.stringify({
          error: response.error?.message || 'Market analysis failed',
          code: response.error?.code
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        request_id: response.request_id,
        analysis_type,
        data: response.data,
        metadata: response.metadata
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      error: 'GET method only supports market_analysis type'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Market intelligence GET error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};