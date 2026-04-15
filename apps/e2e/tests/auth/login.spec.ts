import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'adminproofly@gmail.com'
const ADMIN_PASSWORD = 'Admin123456'

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'commit' })
    // Wait for the login form to be visible
    await page.getByLabel('Email').waitFor({ state: 'visible', timeout: 30_000 })
  })

  test('should redirect unauthenticated user to /login', async ({ page }) => {
    // Try to access admin dashboard directly
    await page.goto('/admin', { waitUntil: 'commit' })

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/)
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill in email
    await page.getByLabel('Email').fill(ADMIN_EMAIL)

    // Fill in password
    await page.getByLabel('Password').fill(ADMIN_PASSWORD)

    // Click submit button
    await page.getByRole('button', { name: /continue/i }).click()

    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 })

    // Should see sidebar or dashboard content
    await expect(page.locator('text=Dashboard').first()).toBeVisible()
  })

  test('should show error on invalid credentials', async ({ page }) => {
    // Fill wrong credentials
    await page.getByLabel('Email').fill(ADMIN_EMAIL)
    await page.getByLabel('Password').fill('wrongpassword123')

    // Click submit
    await page.getByRole('button', { name: /continue/i }).click()

    // Should stay on login page
    await expect(page).toHaveURL(/\/login/)

    // Should show error message
    await expect(
      page.locator('text=Email atau password salah')
    ).toBeVisible({ timeout: 10_000 })
  })

  test('should validate empty email field', async ({ page }) => {
    // Only fill password, leave email empty
    await page.getByLabel('Password').fill(ADMIN_PASSWORD)

    // Submit button should be disabled when email is empty
    const submitButton = page.getByRole('button', { name: /continue/i })
    await expect(submitButton).toBeDisabled()
  })

  test('should validate short password', async ({ page }) => {
    // Fill email
    await page.getByLabel('Email').fill(ADMIN_EMAIL)

    // Fill short password (less than 6 chars)
    const passwordField = page.getByLabel('Password')
    await passwordField.fill('abc')
    // Trigger blur to activate validation
    await passwordField.blur()

    // Should show validation error
    await expect(
      page.locator('text=Password minimal 6 karakter')
    ).toBeVisible({ timeout: 5_000 })
  })
})
