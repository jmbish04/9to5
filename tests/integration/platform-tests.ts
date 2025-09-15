// Integration tests for core platform components
// Basic test runner for P1 Core Platform Foundation

const API_BASE = 'http://localhost:4321';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  response?: any;
}

class PlatformIntegrationTests {
  private results: TestResult[] = [];
  
  async runAllTests(): Promise<void> {
    console.log('🚀 Running P1 Core Platform Foundation Tests...\n');
    
    // Test E1.1: Agent Orchestrator
    await this.testAgentOrchestrator();
    
    // Test E1.2: Discovery UI (APIs)
    await this.testJobDiscoveryAPIs();
    
    // Test E1.3: Tracking & Monitoring
    await this.testTrackingMonitoring();
    
    // Test E1.4: Profiles & Onboarding
    await this.testProfilesOnboarding();
    
    this.printResults();
  }
  
  private async testAgentOrchestrator(): Promise<void> {
    console.log('📋 Testing Agent Orchestrator...');
    
    // Test job discovery agent
    await this.makeApiTest(
      'Job Discovery Agent Query',
      'POST',
      '/api/agent/query',
      {
        query: 'remote frontend developer with React experience',
        filters: { location: 'remote' },
        user_id: 'test-user-001'
      }
    );
    
    // Test agent recommendations
    await this.makeApiTest(
      'Personalized Job Recommendations',
      'GET',
      '/api/agent/recommendations?user_id=test-user-001&limit=10'
    );
    
    // Test agent orchestrator
    await this.makeApiTest(
      'Agent Orchestrator - Career Coach',
      'POST',
      '/api/agent/orchestrator',
      {
        type: 'career_coach',
        payload: {
          user_profile: {
            career_level: 'mid',
            skills: ['JavaScript', 'React'],
            experience_years: 3
          },
          request_type: 'career_analysis'
        },
        user_id: 'test-user-001'
      }
    );
  }
  
  private async testJobDiscoveryAPIs(): Promise<void> {
    console.log('🔍 Testing Job Discovery APIs...');
    
    // Test job fit analysis
    await this.makeApiTest(
      'Job Fit Analysis',
      'POST',
      '/api/applicant/job-rating',
      {
        job_id: 'test-job-001',
        user_profile: {
          skills: ['React', 'TypeScript', 'Node.js'],
          experience_years: 3,
          preferences: {
            work_type: 'remote',
            salary_range: { min: 80000, max: 120000 }
          }
        }
      }
    );
  }
  
  private async testTrackingMonitoring(): Promise<void> {
    console.log('📊 Testing Tracking & Monitoring...');
    
    // Test job monitoring
    await this.makeApiTest(
      'Job Monitoring Status',
      'GET',
      '/api/tracking/job-monitoring?job_id=test-job-001'
    );
    
    // Test change detection
    await this.makeApiTest(
      'Change Detection API',
      'GET',
      '/api/tracking/change-detection?since=2024-01-01T00:00:00Z&limit=10'
    );
    
    // Test monitoring update
    await this.makeApiTest(
      'Update Job Monitoring',
      'POST',
      '/api/tracking/job-monitoring',
      {
        job_id: 'test-job-001',
        monitoring_enabled: true,
        frequency_hours: 24
      }
    );
  }
  
  private async testProfilesOnboarding(): Promise<void> {
    console.log('👤 Testing Profiles & Onboarding...');
    
    // Test onboarding status
    await this.makeApiTest(
      'Onboarding Status Check',
      'GET',
      '/api/profiles/onboarding?user_id=test-user-001'
    );
    
    // Test onboarding step
    await this.makeApiTest(
      'Onboarding Basic Info Step',
      'POST',
      '/api/profiles/onboarding',
      {
        user_id: 'test-user-001',
        step: 'basic_info',
        data: {
          name: 'Test User',
          email: 'test@example.com',
          current_title: 'Frontend Developer',
          experience_years: 3
        }
      }
    );
    
    // Test user profile
    await this.makeApiTest(
      'User Profile Retrieval',
      'GET',
      '/api/profiles/user-profile?user_id=test-user-001'
    );
  }
  
  private async makeApiTest(
    testName: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: any
  ): Promise<void> {
    try {
      const url = `${API_BASE}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }
      
      console.log(`  ➤ ${testName}...`);
      
      const response = await fetch(url, options);
      const responseData = await response.json().catch(() => ({}));
      
      if (response.ok) {
        console.log(`  ✅ ${testName} - PASSED`);
        this.results.push({
          name: testName,
          success: true,
          response: responseData
        });
      } else {
        console.log(`  ❌ ${testName} - FAILED (${response.status})`);
        this.results.push({
          name: testName,
          success: false,
          error: `HTTP ${response.status}: ${JSON.stringify(responseData)}`
        });
      }
      
    } catch (error) {
      console.log(`  ❌ ${testName} - ERROR`);
      this.results.push({
        name: testName,
        success: false,
        error: error.message
      });
    }
  }
  
  private printResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round((passed / total) * 100)}%\n`);
    
    if (failed > 0) {
      console.log('❌ FAILED TESTS:');
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`  • ${result.name}: ${result.error}`);
      });
    }
    
    console.log('\n🎯 P1 Core Platform Foundation Test Complete');
  }
}

// CLI execution
if (typeof process !== 'undefined' && process.argv) {
  const tester = new PlatformIntegrationTests();
  tester.runAllTests().catch(console.error);
}

export { PlatformIntegrationTests };