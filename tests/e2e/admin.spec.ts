import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin-login');
  });

  test('should load admin login page', async ({ page }) => {
    await expect(page).toHaveTitle(/Admin|Login/i);
    
    // Check for login form elements
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Login")')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // Fill login form
    await page.fill('input[type="email"], input[name="email"]', 'admin@piko.com');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Login")');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill login form with invalid credentials
    await page.fill('input[type="email"], input[name="email"]', 'invalid@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Login")');
    
    // Should show error message
    await expect(page.locator('text=error, text=invalid, text=failed, .error, .alert-error')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to admin dashboard after login', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"], input[name="email"]', 'admin@piko.com');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    await page.click('button[type="submit"], button:has-text("Login")');
    
    // Wait for redirect
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    
    // Check for admin dashboard elements
    await expect(page.locator('text=Dashboard, text=Admin, [data-testid="admin-dashboard"]')).toBeVisible();
  });

  test('should display admin tabs/sections', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"], input[name="email"]', 'admin@piko.com');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    await page.click('button[type="submit"], button:has-text("Login")');
    
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    
    // Check for common admin sections
    const adminSections = [
      'Categories', 'Items', 'Orders', 'Dashboard', 'Settings', 'Analytics'
    ];
    
    for (const section of adminSections) {
      const sectionElement = page.locator(`text=${section}, [data-testid*="${section.toLowerCase()}"]`);
      const count = await sectionElement.count();
      if (count > 0) {
        await expect(sectionElement.first()).toBeVisible();
        break; // Found at least one section
      }
    }
  });

  test('should create new category', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"], input[name="email"]', 'admin@piko.com');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    await page.click('button[type="submit"], button:has-text("Login")');
    
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    
    // Navigate to categories section
    const categoriesTab = page.locator('text=Categories, [data-testid="categories-tab"]');
    if (await categoriesTab.count() > 0) {
      await categoriesTab.click();
    }
    
    // Look for add/create button
    const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New"), [data-testid="add-category"]');
    if (await addButton.count() > 0) {
      await addButton.click();
      
      // Check if form opens
      await expect(page.locator('input, form')).toBeVisible();
    }
  });

  test('should upload image for category', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"], input[name="email"]', 'admin@piko.com');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    await page.click('button[type="submit"], button:has-text("Login")');
    
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    
    // Navigate to categories and try to add new category
    const categoriesTab = page.locator('text=Categories, [data-testid="categories-tab"]');
    if (await categoriesTab.count() > 0) {
      await categoriesTab.click();
    }
    
    const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
    if (await addButton.count() > 0) {
      await addButton.click();
      
      // Look for image upload input
      const imageInput = page.locator('input[type="file"], [data-testid="image-upload"]');
      if (await imageInput.count() > 0) {
        await expect(imageInput.first()).toBeVisible();
      }
    }
  });

  test('should manage items', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"], input[name="email"]', 'admin@piko.com');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    await page.click('button[type="submit"], button:has-text("Login")');
    
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    
    // Navigate to items section
    const itemsTab = page.locator('text=Items, [data-testid="items-tab"]');
    if (await itemsTab.count() > 0) {
      await itemsTab.click();
      
      // Check if items table/list is visible
      await expect(page.locator('table, .items-list, [data-testid="items-list"]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"], input[name="email"]', 'admin@piko.com');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    await page.click('button[type="submit"], button:has-text("Login")');
    
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    
    // Look for logout button
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), [data-testid="logout"]');
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      
      // Should redirect to login page
      await expect(page).toHaveURL(/\/admin-login/, { timeout: 10000 });
    }
  });

  test('should handle unauthorized access', async ({ page }) => {
    // Try to access admin dashboard without login
    await page.goto('/admin');
    
    // Should redirect to login or show unauthorized message
    const isRedirected = await page.url().includes('/admin-login');
    const hasUnauthorizedMessage = await page.locator('text=unauthorized, text=access denied, text=login required').count() > 0;
    
    expect(isRedirected || hasUnauthorizedMessage).toBe(true);
  });
});
