#!/usr/bin/env node

// Test runner for P1 Core Platform Foundation
import { PlatformIntegrationTests } from './platform-tests.js';

console.log('🧪 9to5 Scout - P1 Core Platform Foundation Tests');
console.log('Testing comprehensive AI agent integration and core infrastructure\n');

const tester = new PlatformIntegrationTests();
tester.runAllTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});