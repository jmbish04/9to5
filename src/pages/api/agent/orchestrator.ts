// API endpoint for agent orchestration
import type { APIRoute } from 'astro';
import { AgentOrchestrator } from '../../../lib/agent-orchestrator';

const orchestrator = new AgentOrchestrator();

export const POST: APIRoute = async ({ request }) => {
  try {
    const agentRequest = await request.json();
    
    // Validate request structure
    if (!agentRequest.type || !agentRequest.payload) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: type, payload'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await orchestrator.processRequest(agentRequest);
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
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

export const GET: APIRoute = async () => {
  try {
    const agents = orchestrator.getAgentConfigs();
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        agents,
        system_status: 'operational',
        version: '1.0.0'
      }
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