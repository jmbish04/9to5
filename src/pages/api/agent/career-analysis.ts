import type { APIRoute } from 'astro';
import { AgentOrchestrator, getAgentsConfig } from '../../../lib/ai';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { user_profile, target_roles, career_goals, analysis_type = 'career_analysis' } = body;

    // Validate required fields
    if (!user_profile) {
      return new Response(JSON.stringify({
        error: 'user_profile is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize orchestrator
    const config = getAgentsConfig('development');
    const orchestrator = new AgentOrchestrator(config);

    let agentRequest;
    
    switch (analysis_type) {
      case 'career_analysis':
        agentRequest = AgentOrchestrator.createCareerAnalysisRequest(
          'default-user',
          user_profile,
          target_roles,
          career_goals
        );
        break;
      case 'skill_gap_analysis':
        const { user_skills, target_skills, job_id } = body;
        if (!user_skills || !target_skills) {
          return new Response(JSON.stringify({
            error: 'user_skills and target_skills are required for skill gap analysis'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        agentRequest = AgentOrchestrator.createSkillGapAnalysisRequest(
          'default-user',
          user_skills,
          target_skills,
          job_id
        );
        break;
      case 'learning_path':
        const { current_skills, target_skills: learning_target_skills, timeframe, learning_style } = body;
        if (!current_skills || !learning_target_skills) {
          return new Response(JSON.stringify({
            error: 'current_skills and target_skills are required for learning path'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        agentRequest = AgentOrchestrator.createLearningPathRequest(
          'default-user',
          current_skills,
          learning_target_skills,
          timeframe,
          learning_style
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
        error: response.error?.message || 'Career analysis failed',
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
    console.error('Career analysis error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};