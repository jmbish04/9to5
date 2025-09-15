// Agents management API
import type { APIRoute } from 'astro';
import { AgentOrchestrator } from '../../lib/agent-orchestrator';

const orchestrator = new AgentOrchestrator();

export const GET: APIRoute = async ({ url }) => {
  try {
    const enabled = url.searchParams.get('enabled');
    let agents = orchestrator.getAgentConfigs();
    
    // Filter by enabled status if specified
    if (enabled !== null) {
      const isEnabled = enabled === 'true';
      agents = agents.filter(agent => agent.enabled === isEnabled);
    }
    
    // Transform to match expected AgentConfig interface with additional fields
    const enhancedAgents = agents.map(agent => ({
      ...agent,
      id: agent.name.toLowerCase().replace(/\s+/g, '_'),
      role: getAgentRole(agent.name),
      goal: getAgentGoal(agent.name),
      backstory: getAgentBackstory(agent.name),
      llm: agent.model,
      max_tokens: agent.max_tokens,
      temperature: agent.temperature
    }));
    
    return new Response(JSON.stringify(enhancedAgents), {
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const newAgent = await request.json();
    
    // Validate required fields
    if (!newAgent.name || !newAgent.enabled === undefined) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: name, enabled'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // In a real implementation, this would save to database
    // For now, return the agent config
    const agentConfig = {
      ...newAgent,
      id: newAgent.name.toLowerCase().replace(/\s+/g, '_'),
      created_at: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(agentConfig), {
      status: 201,
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

function getAgentRole(agentName: string): string {
  switch (agentName) {
    case 'Job Discovery Agent':
      return 'Intelligent Job Matching Specialist';
    case 'Career Coach Agent':
      return 'Personalized Career Development Advisor';
    case 'Content Generation Agent':
      return 'Professional Content Creator';
    case 'Market Intelligence Agent':
      return 'Market Research and Analysis Expert';
    default:
      return 'AI Assistant';
  }
}

function getAgentGoal(agentName: string): string {
  switch (agentName) {
    case 'Job Discovery Agent':
      return 'Help users find the perfect job matches through semantic search and intelligent filtering';
    case 'Career Coach Agent':
      return 'Provide personalized career guidance, skill gap analysis, and professional development recommendations';
    case 'Content Generation Agent':
      return 'Create compelling, personalized application materials including cover letters and resume optimizations';
    case 'Market Intelligence Agent':
      return 'Deliver actionable market insights, salary benchmarking, and competitive intelligence';
    default:
      return 'Assist users with AI-powered capabilities';
  }
}

function getAgentBackstory(agentName: string): string {
  switch (agentName) {
    case 'Job Discovery Agent':
      return 'Trained on millions of job postings and successful placements, I understand the nuances of job matching beyond simple keyword searches. I can interpret your career aspirations and match them with opportunities that align with your values and goals.';
    case 'Career Coach Agent':
      return 'With extensive knowledge of career development patterns and industry trends, I serve as your personal career advisor. I analyze your current position, identify growth opportunities, and create actionable roadmaps for your professional journey.';
    case 'Content Generation Agent':
      return 'Specialized in professional communication and application materials, I create content that resonates with hiring managers. I understand ATS systems, industry-specific language, and how to highlight your unique value proposition.';
    case 'Market Intelligence Agent':
      return 'I continuously analyze job market data, salary trends, and company intelligence to provide you with the most current and relevant market insights. My goal is to keep you informed about the competitive landscape.';
    default:
      return 'I am an AI assistant designed to help with various tasks and provide intelligent insights.';
  }
}