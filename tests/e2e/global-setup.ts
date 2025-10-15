import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to start...');
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check if the application is responding
    const title = await page.title();
    console.log(`📱 Application title: ${title}`);

    // Verify health endpoint
    console.log('🏥 Checking health endpoint...');
    const healthResponse = await page.request.get('/api/health');
    
    if (healthResponse.ok()) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData);
    } else {
      console.warn('⚠️ Health check failed:', await healthResponse.text());
    }

    // Store any global state that tests might need
    await page.context().storageState({ path: 'tests/e2e/auth-state.json' });

    console.log('✅ E2E test setup completed successfully');

  } catch (error) {
    console.error('❌ E2E test setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
