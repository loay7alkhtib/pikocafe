#!/usr/bin/env node

const https = require('https');
const http = require('http');

const DEFAULT_URL = process.env.HEALTH_CHECK_URL || 'http://localhost:3000/api/health';
const TIMEOUT = 30000; // 30 seconds

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const request = client.get(url, { timeout: TIMEOUT }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: response.statusCode,
            data: parsed,
            headers: response.headers,
          });
        } catch (error) {
          resolve({
            status: response.statusCode,
            data: data,
            headers: response.headers,
            parseError: error.message,
          });
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.on('timeout', () => {
      request.destroy();
      reject(new Error(`Request timeout after ${TIMEOUT}ms`));
    });
  });
}

async function runHealthCheck() {
  console.log(`🏥 Running health check against: ${DEFAULT_URL}`);
  console.log('⏳ Waiting for response...');
  
  const startTime = Date.now();
  
  try {
    const response = await makeRequest(DEFAULT_URL);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Health check completed in ${duration}ms`);
    console.log(`📊 Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('🎉 Application is healthy!');
      
      if (response.data) {
        console.log('📋 Health details:');
        console.log(`   Status: ${response.data.status}`);
        console.log(`   Version: ${response.data.version}`);
        console.log(`   Environment: ${response.data.environment}`);
        
        if (response.data.checks) {
          console.log('🔍 Service checks:');
          Object.entries(response.data.checks).forEach(([service, check]) => {
            const status = check.status === 'healthy' ? '✅' : '❌';
            const responseTime = check.responseTime ? ` (${check.responseTime}ms)` : '';
            console.log(`   ${service}: ${status} ${check.status}${responseTime}`);
            
            if (check.error) {
              console.log(`      Error: ${check.error}`);
            }
          });
        }
      }
      
      process.exit(0);
    } else {
      console.log('⚠️ Application returned non-200 status');
      console.log('📋 Response:', JSON.stringify(response.data, null, 2));
      process.exit(1);
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ Health check failed after ${duration}ms`);
    console.log(`💥 Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔌 Connection refused - is the server running?');
    } else if (error.code === 'ENOTFOUND') {
      console.log('🌐 Host not found - check the URL');
    } else if (error.message.includes('timeout')) {
      console.log('⏰ Request timed out - server may be overloaded');
    }
    
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.length > 0) {
  const url = args[0];
  process.env.HEALTH_CHECK_URL = url;
}

// Run the health check
runHealthCheck();
