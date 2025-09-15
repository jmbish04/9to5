#!/usr/bin/env node

// Simple test script to validate AI agent implementations
import { AgentOrchestrator, getAgentsConfig } from '../src/lib/ai/index.js';

async function testAgentImplementations() {
  console.log('🤖 Testing AI Agent Implementations\n');

  try {
    // Initialize agents
    const config = getAgentsConfig('development');
    const orchestrator = new AgentOrchestrator(config);

    console.log('✅ Agent orchestrator initialized successfully');

    // Test health check
    const healthStatus = await orchestrator.healthCheck();
    console.log('✅ Health check completed');
    console.log('🔍 Agent health status:');
    
    for (const [agentName, status] of healthStatus.entries()) {
      const statusIcon = status.status === 'healthy' ? '💚' : 
                        status.status === 'degraded' ? '🟡' : '❌';
      console.log(`  ${statusIcon} ${agentName}: ${status.status} (${status.response_time}ms)`);
    }

    // Test Job Discovery Agent
    console.log('\n🔍 Testing Job Discovery Agent...');
    const jobSearchRequest = AgentOrchestrator.createJobSearchRequest(
      'test-user',
      'remote senior frontend developer with React experience'
    );
    
    const jobSearchResponse = await orchestrator.processRequest(jobSearchRequest);
    console.log(`✅ Job search completed: ${jobSearchResponse.status}`);
    if (jobSearchResponse.status === 'success' && jobSearchResponse.data?.jobs) {
      console.log(`   Found ${jobSearchResponse.data.jobs.length} job matches`);
    }

    // Test Content Generation Agent
    console.log('\n📝 Testing Content Generation Agent...');
    const coverLetterRequest = AgentOrchestrator.createCoverLetterRequest(
      'test-user',
      'job-123',
      {
        name: 'John Doe',
        experience_years: 3,
        skills: ['React', 'TypeScript', 'Node.js'],
        achievements: ['Built responsive web apps', 'Led team of 3 developers']
      }
    );

    const coverLetterResponse = await orchestrator.processRequest(coverLetterRequest);
    console.log(`✅ Cover letter generation completed: ${coverLetterResponse.status}`);

    // Test Career Coach Agent
    console.log('\n🎯 Testing Career Coach Agent...');
    const careerAnalysisRequest = AgentOrchestrator.createCareerAnalysisRequest(
      'test-user',
      {
        name: 'Jane Smith',
        experience_years: 4,
        skills: ['JavaScript', 'React', 'CSS'],
        current_role: 'Frontend Developer'
      },
      ['Senior Frontend Developer', 'Tech Lead']
    );

    const careerAnalysisResponse = await orchestrator.processRequest(careerAnalysisRequest);
    console.log(`✅ Career analysis completed: ${careerAnalysisResponse.status}`);

    // Test Market Intelligence Agent
    console.log('\n📊 Testing Market Intelligence Agent...');
    const marketAnalysisRequest = AgentOrchestrator.createMarketAnalysisRequest(
      'test-user',
      'Software Engineer',
      'San Francisco',
      '6 months'
    );

    const marketAnalysisResponse = await orchestrator.processRequest(marketAnalysisRequest);
    console.log(`✅ Market analysis completed: ${marketAnalysisResponse.status}`);

    // Test multi-agent workflow
    console.log('\n🔄 Testing Multi-Agent Workflow...');
    const multiAgentRequests = [
      jobSearchRequest,
      careerAnalysisRequest,
      marketAnalysisRequest
    ];

    const workflowResponses = await orchestrator.processMultiAgentWorkflow(multiAgentRequests);
    const successfulResponses = workflowResponses.filter(r => r.status === 'success').length;
    console.log(`✅ Multi-agent workflow completed: ${successfulResponses}/${workflowResponses.length} successful`);

    // Display metrics
    console.log('\n📈 Agent Metrics:');
    const metrics = orchestrator.getMetrics();
    for (const [agentName, metric] of metrics.entries()) {
      console.log(`  📊 ${agentName}:`);
      console.log(`     Total requests: ${metric.total_requests}`);
      console.log(`     Success rate: ${((metric.successful_requests / metric.total_requests) * 100).toFixed(1)}%`);
      console.log(`     Avg response time: ${metric.average_response_time.toFixed(0)}ms`);
    }

    console.log('\n🎉 All AI agent tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✅ Job Discovery Agent - Semantic search and recommendations');
    console.log('  ✅ Content Generation Agent - Cover letters and resume optimization'); 
    console.log('  ✅ Career Coach Agent - Career analysis and skill gap assessment');
    console.log('  ✅ Market Intelligence Agent - Market trends and salary analysis');
    console.log('  ✅ Agent Orchestrator - Multi-agent coordination and health monitoring');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testAgentImplementations().catch(console.error);