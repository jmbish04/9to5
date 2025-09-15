// Simple smoke test for development environment
// Tests core functionality without requiring running server

import { AgentOrchestrator } from '../../src/lib/agent-orchestrator.js';

console.log('🧪 9to5 Scout - Development Smoke Tests');
console.log('Testing core platform components...\n');

async function runSmokeTests() {
  let passed = 0;
  let failed = 0;
  
  // Test 1: Agent Orchestrator Initialization
  try {
    console.log('1. Testing Agent Orchestrator initialization...');
    const orchestrator = new AgentOrchestrator();
    const configs = orchestrator.getAgentConfigs();
    
    if (configs.length === 4) {
      console.log('  ✅ All 4 core agents initialized');
      passed++;
    } else {
      console.log('  ❌ Expected 4 agents, got', configs.length);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ Agent orchestrator failed:', error.message);
    failed++;
  }
  
  // Test 2: Agent Processing (Mock)
  try {
    console.log('2. Testing agent request processing...');
    const orchestrator = new AgentOrchestrator();
    
    const request = {
      type: 'job_discovery',
      payload: {
        query: 'frontend developer react',
        filters: { location: 'remote' }
      },
      user_id: 'test-user'
    };
    
    const response = await orchestrator.processRequest(request);
    
    if (response.success) {
      console.log('  ✅ Job discovery agent processed request');
      passed++;
    } else {
      console.log('  ❌ Agent processing failed:', response.error);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ Agent processing error:', error.message);
    failed++;
  }
  
  // Test 3: Database Migration Files
  try {
    console.log('3. Testing database migration files...');
    const fs = await import('fs');
    const path = await import('path');
    
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const files = fs.readdirSync(migrationsDir);
    const migrationFiles = files.filter(f => f.endsWith('.sql'));
    
    if (migrationFiles.length >= 6) {
      console.log(`  ✅ Found ${migrationFiles.length} migration files`);
      passed++;
    } else {
      console.log(`  ❌ Expected at least 6 migrations, found ${migrationFiles.length}`);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ Migration check failed:', error.message);
    failed++;
  }
  
  // Test 4: API Endpoints Exist
  try {
    console.log('4. Testing API endpoint files...');
    const fs = await import('fs');
    const path = await import('path');
    
    const apiPaths = [
      'src/pages/api/agent/query.ts',
      'src/pages/api/agent/orchestrator.ts',
      'src/pages/api/agent/recommendations.ts',
      'src/pages/api/tracking/job-monitoring.ts',
      'src/pages/api/tracking/change-detection.ts',
      'src/pages/api/profiles/user-profile.ts',
      'src/pages/api/profiles/onboarding.ts'
    ];
    
    let existingFiles = 0;
    for (const apiPath of apiPaths) {
      const fullPath = path.join(process.cwd(), apiPath);
      if (fs.existsSync(fullPath)) {
        existingFiles++;
      }
    }
    
    if (existingFiles === apiPaths.length) {
      console.log(`  ✅ All ${apiPaths.length} core API endpoints exist`);
      passed++;
    } else {
      console.log(`  ❌ Missing API endpoints: ${apiPaths.length - existingFiles}/${apiPaths.length}`);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ API endpoint check failed:', error.message);
    failed++;
  }
  
  // Test 5: Build System
  try {
    console.log('5. Testing build system...');
    const { execSync } = await import('child_process');
    
    // Try to build the project
    execSync('npm run build', { stdio: 'pipe' });
    console.log('  ✅ Build system working');
    passed++;
  } catch (error) {
    console.log('  ❌ Build failed');
    failed++;
  }
  
  // Results Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SMOKE TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All smoke tests passed! P1 foundation is ready.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above.');
  }
}

runSmokeTests().catch(console.error);