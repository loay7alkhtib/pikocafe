#!/usr/bin/env node

// Simple script to initialize categories in the Piko Cafe database
const https = require('https');

const API_BASE = 'https://loay7alkhtib.supabase.co/functions/v1/make-server-4050140e';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYXk3YWxraHRpYiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzMzNjUwNTQ4LCJleHAiOjIwNDkyMjY1NDh9.Nh8cZv5tR7q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8';

async function makeRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${endpoint}`);
    
    const requestOptions = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: options.method || 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          resolve({ error: 'Invalid JSON response', data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function initializeCategories() {
  console.log('🚀 Initializing Piko Cafe categories...');
  
  try {
    const response = await makeRequest('/init-categories');
    
    if (response.success) {
      console.log('✅ Categories initialized successfully!');
      console.log(`📊 Created ${response.categoriesCount} categories:`);
      
      response.categories.forEach((category, index) => {
        console.log(`   ${index + 1}. ${category.icon} ${category.names.en} (${category.id})`);
      });
      
      console.log('\n🎉 Your Piko Cafe is now ready with all categories!');
      console.log('🌐 Visit your website to see the categories in action.');
      
    } else {
      console.error('❌ Failed to initialize categories:', response.error);
    }
    
  } catch (error) {
    console.error('💥 Error during initialization:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify the Supabase project is running');
    console.log('   3. Make sure the API key is correct');
  }
}

// Run the initialization
initializeCategories();
