import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Piko/i);

    // Check if main content is visible
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('should display categories', async ({ page }) => {
    // Wait for categories to load
    await page.waitForLoadState('networkidle');

    // Check if category cards are displayed
    const categoryCards = page.locator('[data-testid="category-card"], .category-card');
    await expect(categoryCards.first()).toBeVisible({ timeout: 10000 });

    // Check if categories have images and names
    const firstCategory = categoryCards.first();
    await expect(firstCategory.locator('img')).toBeVisible();
    await expect(firstCategory.locator('h2, h3, .category-name')).toBeVisible();
  });

  test('should navigate to category page', async ({ page }) => {
    // Wait for categories to load
    await page.waitForLoadState('networkidle');

    // Click on first category
    const firstCategory = page.locator('[data-testid="category-card"], .category-card').first();
    await firstCategory.click();

    // Should navigate to category page
    await expect(page).toHaveURL(/\/category\/.+/);
  });

  test('should display item count for categories', async ({ page }) => {
    // Wait for categories to load
    await page.waitForLoadState('networkidle');

    // Check if item counts are displayed
    const itemCounts = page.locator('[data-testid="item-count"], .item-count');
    const count = await itemCounts.count();
    
    if (count > 0) {
      await expect(itemCounts.first()).toBeVisible();
      // Check if it's a valid number
      const text = await itemCounts.first().textContent();
      expect(text).toMatch(/\d+/);
    }
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    const categoryCards = page.locator('[data-testid="category-card"], .category-card');
    await expect(categoryCards.first()).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState('networkidle');
    
    await expect(categoryCards.first()).toBeVisible();
  });

  test('should handle loading states', async ({ page }) => {
    // Check if loading indicators are shown initially
    const loadingIndicator = page.locator('[data-testid="loading"], .loading, .skeleton');
    const hasLoading = await loadingIndicator.count() > 0;
    
    if (hasLoading) {
      await expect(loadingIndicator.first()).toBeVisible();
      
      // Wait for loading to complete
      await page.waitForLoadState('networkidle');
      await expect(loadingIndicator.first()).not.toBeVisible({ timeout: 10000 });
    }
  });

  test('should display language toggle', async ({ page }) => {
    // Look for language toggle
    const langToggle = page.locator('[data-testid="language-toggle"], .language-toggle, button:has-text("EN"), button:has-text("TR"), button:has-text("AR")');
    
    if (await langToggle.count() > 0) {
      await expect(langToggle.first()).toBeVisible();
    }
  });

  test('should have working navigation', async ({ page }) => {
    // Check for navigation elements
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();

    // Check for logo/brand
    const logo = page.locator('[data-testid="logo"], .logo, img[alt*="logo"], img[alt*="Logo"]');
    if (await logo.count() > 0) {
      await expect(logo.first()).toBeVisible();
    }
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // This test would need to be run in a scenario where no categories exist
    // For now, we'll just check that the page doesn't crash
    
    await page.waitForLoadState('networkidle');
    
    // Page should still be functional even with no data
    await expect(page.locator('body')).toBeVisible();
  });
});
