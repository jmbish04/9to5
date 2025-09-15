#!/usr/bin/env node
// Comprehensive test for AI Integration Phase P2

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:4321',
  timeout: 10000,
  verbose: true
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

// Test agent health endpoint
async function testAgentHealth() {
  log('\n🔍 Testing Agent Health Endpoint...', colors.cyan);
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/agent/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    logSuccess('Agent health endpoint responding');
    
    if (TEST_CONFIG.verbose) {
      console.log('Health Status:', JSON.stringify(data, null, 2));
    }

    // Verify expected structure
    if (data.status === 'ok' && data.agents && data.configuration) {
      logSuccess('Health response has correct structure');
      
      // Check agent availability
      const expectedAgents = ['job_discovery', 'content_generation', 'career_coach', 'market_intelligence'];
      const availableAgents = Object.keys(data.agents);
      
      for (const agent of expectedAgents) {
        if (availableAgents.includes(agent)) {
          logSuccess(`${agent} agent available`);
        } else {
          logError(`${agent} agent missing`);
        }
      }
      
      // Check configuration
      logInfo(`OpenAI enabled: ${data.configuration.openai_enabled}`);
      logInfo(`Agents enabled: ${data.configuration.agents_enabled}`);
      logInfo(`Fallback mode: ${data.configuration.fallback_mode}`);
      logInfo(`Database available: ${data.configuration.database_available}`);
      logInfo(`Environment: ${data.configuration.environment}`);
      
    } else {
      logError('Health response missing required fields');
    }

    return true;
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    return false;
  }
}

// Test semantic job search
async function testSemanticSearch() {
  log('\n🔍 Testing Semantic Job Search...', colors.cyan);
  
  const testQuery = {
    query: "remote frontend developer position with React and good work-life balance",
    user_id: "test-user-123",
    context: {
      previous_searches: [],
      applied_jobs: [],
      saved_jobs: []
    }
  };

  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/agent/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testQuery)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    logSuccess('Semantic search endpoint responding');
    
    if (TEST_CONFIG.verbose) {
      console.log('Search Response:', JSON.stringify(data, null, 2));
    }

    // Verify response structure
    if (data.results && Array.isArray(data.results)) {
      logSuccess('Search response has correct structure');
      logInfo(`Found ${data.results.length} job matches`);
    } else {
      logError('Search response missing results array');
    }

    return true;
  } catch (error) {
    logError(`Semantic search failed: ${error.message}`);
    return false;
  }
}

// Test job recommendations
async function testJobRecommendations() {
  log('\n🔍 Testing Job Recommendations...', colors.cyan);
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/agent/recommendations?user_id=test-user-123&limit=5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    logSuccess('Job recommendations endpoint responding');
    
    if (TEST_CONFIG.verbose) {
      console.log('Recommendations Response:', JSON.stringify(data, null, 2));
    }

    // Verify response structure
    if (data.recommendations && Array.isArray(data.recommendations)) {
      logSuccess('Recommendations response has correct structure');
      logInfo(`Generated ${data.recommendations.length} recommendations`);
    } else {
      logError('Recommendations response missing recommendations array');
    }

    return true;
  } catch (error) {
    logError(`Job recommendations failed: ${error.message}`);
    return false;
  }
}

// Test job fit analysis
async function testJobFitAnalysis() {
  log('\n🔍 Testing Job Fit Analysis...', colors.cyan);
  
  const testRequest = {
    job_id: "test-job-456",
    user_profile: {
      skills: ["React", "TypeScript", "Node.js"],
      experience_years: 3,
      preferences: {
        remote_work: true,
        work_life_balance: "high"
      }
    }
  };

  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/applicant/job-rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testRequest)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    logSuccess('Job fit analysis endpoint responding');
    
    if (TEST_CONFIG.verbose) {
      console.log('Fit Analysis Response:', JSON.stringify(data, null, 2));
    }

    // Verify response structure
    if (typeof data.fit_score === 'number' && data.analysis) {
      logSuccess('Fit analysis response has correct structure');
      logInfo(`Job fit score: ${data.fit_score}/100`);
    } else {
      logError('Fit analysis response missing required fields');
    }

    return true;
  } catch (error) {
    logError(`Job fit analysis failed: ${error.message}`);
    return false;
  }
}

// Test cover letter generation
async function testCoverLetterGeneration() {
  log('\n🔍 Testing Cover Letter Generation...', colors.cyan);
  
  const testRequest = {
    job_id: "test-job-456",
    user_profile: {
      name: "John Doe",
      experience: "3 years as Frontend Developer",
      achievements: ["Built responsive web apps", "Led team of 3 developers"]
    },
    tone: "professional",
    length: "medium",
    highlights: ["teamwork", "innovation", "problem-solving"]
  };

  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/cover-letter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testRequest)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    logSuccess('Cover letter generation endpoint responding');
    
    if (TEST_CONFIG.verbose && data.content) {
      console.log('Generated Cover Letter Preview:', data.content.substring(0, 200) + '...');
    }

    // Verify response structure
    if (data.content && data.quality_metrics) {
      logSuccess('Cover letter response has correct structure');
      logInfo(`Quality score: ${data.quality_metrics.overall_score}`);
    } else {
      logError('Cover letter response missing required fields');
    }

    return true;
  } catch (error) {
    logError(`Cover letter generation failed: ${error.message}`);
    return false;
  }
}

// Test resume optimization
async function testResumeOptimization() {
  log('\n🔍 Testing Resume Optimization...', colors.cyan);
  
  const testRequest = {
    resume_content: "John Doe\nSoftware Developer\n\nExperience:\n- Worked on web applications\n- Used JavaScript and React",
    job_description: "Senior Frontend Developer position requiring React, TypeScript, and modern web development skills",
    target_keywords: ["React", "TypeScript", "Frontend"],
    optimization_focus: ["keywords", "structure", "achievements"]
  };

  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/resume-optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testRequest)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    logSuccess('Resume optimization endpoint responding');
    
    if (TEST_CONFIG.verbose && data.optimized_content) {
      console.log('Optimized Resume Preview:', data.optimized_content.substring(0, 200) + '...');
    }

    // Verify response structure
    if (data.optimized_content && data.improvements) {
      logSuccess('Resume optimization response has correct structure');
      logInfo(`ATS score: ${data.ats_score || 'N/A'}`);
    } else {
      logError('Resume optimization response missing required fields');
    }

    return true;
  } catch (error) {
    logError(`Resume optimization failed: ${error.message}`);
    return false;
  }
}

// Test career analysis
async function testCareerAnalysis() {
  log('\n🔍 Testing Career Analysis...', colors.cyan);
  
  const testRequest = {
    user_profile: {
      current_role: "Frontend Developer",
      skills: ["React", "JavaScript", "CSS"],
      experience_years: 3,
      goals: ["Senior role", "Team leadership"]
    },
    target_roles: ["Senior Frontend Developer", "Tech Lead"]
  };

  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/agent/career-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testRequest)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    logSuccess('Career analysis endpoint responding');
    
    if (TEST_CONFIG.verbose) {
      console.log('Career Analysis Response:', JSON.stringify(data, null, 2));
    }

    // Verify response structure
    if (data.analysis && data.recommendations) {
      logSuccess('Career analysis response has correct structure');
      logInfo(`Confidence score: ${data.confidence_score || 'N/A'}`);
    } else {
      logError('Career analysis response missing required fields');
    }

    return true;
  } catch (error) {
    logError(`Career analysis failed: ${error.message}`);
    return false;
  }
}

// Test market intelligence
async function testMarketIntelligence() {
  log('\n🔍 Testing Market Intelligence...', colors.cyan);
  
  const testRequest = {
    analysis_type: "salary_analysis",
    parameters: {
      role: "Senior Frontend Developer",
      location: "San Francisco, CA",
      experience_years: 5,
      skills: ["React", "TypeScript", "Node.js"]
    }
  };

  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/agent/market-intelligence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testRequest)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    logSuccess('Market intelligence endpoint responding');
    
    if (TEST_CONFIG.verbose) {
      console.log('Market Intelligence Response:', JSON.stringify(data, null, 2));
    }

    // Verify response structure
    if (data.analysis && data.insights) {
      logSuccess('Market intelligence response has correct structure');
      logInfo(`Data confidence: ${data.confidence_score || 'N/A'}`);
    } else {
      logError('Market intelligence response missing required fields');
    }

    return true;
  } catch (error) {
    logError(`Market intelligence failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log('🚀 Starting AI Integration Phase P2 Tests', colors.bright);
  log('=' * 50);
  
  const tests = [
    { name: 'Agent Health', func: testAgentHealth },
    { name: 'Semantic Search', func: testSemanticSearch },
    { name: 'Job Recommendations', func: testJobRecommendations },
    { name: 'Job Fit Analysis', func: testJobFitAnalysis },
    { name: 'Cover Letter Generation', func: testCoverLetterGeneration },
    { name: 'Resume Optimization', func: testResumeOptimization },
    { name: 'Career Analysis', func: testCareerAnalysis },
    { name: 'Market Intelligence', func: testMarketIntelligence }
  ];

  const results = [];
  
  for (const test of tests) {
    try {
      const success = await test.func();
      results.push({ name: test.name, success });
    } catch (error) {
      logError(`Test "${test.name}" threw error: ${error.message}`);
      results.push({ name: test.name, success: false, error: error.message });
    }
  }

  // Summary
  log('\n📊 Test Results Summary', colors.cyan);
  log('=' * 30);
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const color = result.success ? colors.green : colors.red;
    log(`${status} ${result.name}`, color);
    
    if (!result.success && result.error) {
      log(`   Error: ${result.error}`, colors.red);
    }
  });
  
  log(`\nOverall: ${passed}/${total} tests passed`, passed === total ? colors.green : colors.yellow);
  
  if (passed === total) {
    logSuccess('🎉 All AI Integration Phase P2 tests passed!');
  } else {
    logWarning('⚠️ Some tests failed. Check the logs above for details.');
  }
  
  return passed === total;
}

// Run tests if called directly
if (process.argv[1] === __filename) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    logError(`Test runner failed: ${error.message}`);
    process.exit(1);
  });
}

export { runAllTests };