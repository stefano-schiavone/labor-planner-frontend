import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
   test.beforeEach(async ({ page }) => {
      await page.goto('/login');
   });

   test('shows validation errors on empty form', async ({ page }) => {
      // Set up route interception for this specific test
      await page.route('**/api/auth/login', route =>
         route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'should not be called for invalid form' }),
         })
      );

      let called = false;
      await page.route('**/api/auth/login', route => {
         called = true;
         return route.fulfill({ status: 500, body: '{}' });
      });

      // Set up dialog handler before any interaction
      let dialogMessage = '';
      page.once('dialog', async dialog => {
         dialogMessage = dialog.message();
         await dialog.dismiss();
      });

      await page.getByRole('button', { name: 'Log in' }).click();

      // Wait for dialog to have been handled
      await expect.poll(() => dialogMessage).toContain('Invalid email');
      expect(called).toBe(false);
   });

   test('shows validation error for invalid email format', async ({ page }) => {
      let called = false;
      await page.route('**/api/auth/login', route => {
         called = true;
         return route.fulfill({ status: 500, body: '{}' });
      });

      await page.getByLabel('Email').fill('invalid-email');
      await page.getByLabel('Password').fill('password123');

      let dialogMessage = '';
      page.once('dialog', async dialog => {
         dialogMessage = dialog.message();
         await dialog.dismiss();
      });

      await page.getByRole('button', { name: 'Log in' }).click();

      await expect.poll(() => dialogMessage).toContain('Invalid email');
      expect(called).toBe(false);
   });

   test('shows validation error for missing password', async ({ page }) => {
      let called = false;
      await page.route('**/api/auth/login', route => {
         called = true;
         return route.fulfill({ status: 500, body: '{}' });
      });

      await page.getByLabel('Email').fill('user@example.com');
      await page.getByLabel('Password').fill('');

      let dialogMessage = '';
      page.once('dialog', async dialog => {
         dialogMessage = dialog.message();
         await dialog.dismiss();
      });

      await page.getByRole('button', { name: 'Log in' }).click();

      await expect.poll(() => dialogMessage).toContain('Invalid password');
      expect(called).toBe(false);
   });

   test('shows error for wrong credentials (mocked backend)', async ({ page }) => {
      await page.route('**/api/auth/login', async route => {
         await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Bad credentials' }),
         });
      });

      await page.getByLabel('Email').fill('nonexistent@example.com');
      await page.getByLabel('Password').fill('wrongpassword');

      let dialogMessage = '';
      page.once('dialog', async dialog => {
         dialogMessage = dialog.message();
         await dialog.dismiss();
      });

      await page.getByRole('button', { name: 'Log in' }).click();

      await expect.poll(() => dialogMessage).toContain('Incorrect credentials');
   });

   test('successfully logs in (mocked backend)', async ({ page }) => {
      await page.route('**/api/auth/login', async route => {
         await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ accessToken: 'fake-jwt-token' }),
         });
      });

      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Password').fill('password');
      await page.getByRole('button', { name: 'Log in' }).click();

      await page.waitForURL('/active');

      const token = await page.evaluate(() => localStorage.getItem('accessToken'));
      expect(token).toBe('fake-jwt-token');
   });

   test('successfully logs in (real backend user)', async ({ page }) => {
      // DO NOT set up any route interception - let it hit the real backend

      const email = 'stefanocloud32@gmail.com';
      const password = 'Stefano123';

      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password').fill(password);
      await page.getByRole('button', { name: 'Log in' }).click();

      await page.waitForURL('/active');

      const token = await page.evaluate(() => localStorage.getItem('accessToken'));
      expect(token).not.toBeNull();
   });
});
