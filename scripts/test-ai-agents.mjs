#!/usr/bin/env node

// Test script to verify AI agent endpoints
import { readFileSync } from 'fs';
import { join } from 'path';

const API_BASE = process.env.PUBLIC_API_BASE || 'http://localhost:4321';
const API_TOKEN = process.env.API_TOKEN || 'test-token';

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  console.log(`\n${config.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ Failed (${response.status}):`, data);
      return null;
    }
    
    console.log(`✅ Success (${response.status}):`, data);
    return data;
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return null;
  }
}

async function testAIAgents() {
  console.log('🤖 Testing AI Agent endpoints...\n');

  // Test 1: Agent health check
  await makeRequest('/api/agent/health');

  // Test 2: Semantic job search
  await makeRequest('/api/agent/query', {
    method: 'POST',
    body: JSON.stringify({
      query: 'remote frontend developer with React experience',
      user_id: 'test-user-123',
      context: {
        previous_searches: [],
        applied_jobs: [],
        saved_jobs: []
      }
    })
  });

  // Test 3: Job recommendations
  await makeRequest('/api/agent/recommendations?user_id=test-user-123&limit=5');

  // Test 4: Job fit analysis
  await makeRequest('/api/applicant/job-rating', {
    method: 'POST',
    body: JSON.stringify({
      job_id: 'test-job-456',
      user_profile: {
        user_id: 'test-user-123',
        name: 'John Doe',
        experience_years: 3,
        current_role: 'Frontend Developer',
        skills: ['React', 'TypeScript', 'JavaScript', 'CSS'],
        preferences: {
          remote_ok: true,
          salary_range: { min: 80000, max: 120000, currency: 'USD' }
        }
      }
    })
  });

  // Test 5: Cover letter generation
  await makeRequest('/api/cover-letter', {
    method: 'POST',
    body: JSON.stringify({
      job_id: 'test-job-456',
      user_profile: {
        user_id: 'test-user-123',
        name: 'John Doe',
        experience_years: 3,
        current_role: 'Frontend Developer',
        skills: ['React', 'TypeScript', 'JavaScript'],
        achievements: ['Built responsive web applications', 'Led team of 3 developers']
      },
      tone: 'professional',
      length: 'medium',
      highlights: ['teamwork', 'problem-solving', 'React expertise']
    })
  });

  // Test 6: Resume optimization
  await makeRequest('/api/resume-optimize', {
    method: 'POST',
    body: JSON.stringify({
      resume_content: 'Experienced Frontend Developer with 3 years of experience. Worked on React applications.',
      job_description: 'We are looking for a Senior Frontend Developer with React, TypeScript, and leadership experience.',
      target_keywords: ['React', 'TypeScript', 'Leadership', 'Senior']
    })
  });

  console.log('\n🎉 AI Agent tests completed!');
}

testAIAgents().catch(console.error);