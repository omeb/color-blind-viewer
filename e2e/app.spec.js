import { test, expect } from '@playwright/test'

test.describe('Colorblind Viewer App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })
  
  test('has correct title and heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Colorblind Viewer/)
    await expect(page.getByRole('heading', { name: /Colorblind Viewer/i })).toBeVisible()
  })
  
  test('displays URL input form', async ({ page }) => {
    await expect(page.getByLabel(/website url/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /load website/i })).toBeVisible()
  })
  
  test('submit button is disabled when input is empty', async ({ page }) => {
    const button = page.getByRole('button', { name: /load website/i })
    await expect(button).toBeDisabled()
  })
  
  test('submit button is enabled when URL is entered', async ({ page }) => {
    const input = page.getByLabel(/website url/i)
    const button = page.getByRole('button', { name: /load website/i })
    
    await input.fill('example.com')
    await expect(button).toBeEnabled()
  })
  
  test('displays all vision impairment filter buttons', async ({ page }) => {
    await expect(page.getByText('Protanopia')).toBeVisible()
    await expect(page.getByText('Deuteranopia')).toBeVisible()
    await expect(page.getByText('Tritanopia')).toBeVisible()
    await expect(page.getByText('Achromatopsia')).toBeVisible()
    await expect(page.getByText('Cataracts')).toBeVisible()
    await expect(page.getByText('Low Vision')).toBeVisible()
  })
  
  test('info panel is visible and collapsible', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /about vision impairments/i })
    await expect(toggle).toBeVisible()
    
    // Check if expanded by default
    await expect(page.getByText(/why this matters/i)).toBeVisible()
    
    // Collapse
    await toggle.click()
    await expect(page.getByText(/why this matters/i)).not.toBeVisible()
    
    // Expand again
    await toggle.click()
    await expect(page.getByText(/why this matters/i)).toBeVisible()
  })
  
  test('filter buttons are interactive', async ({ page }) => {
    const protanopiaButton = page.getByText('Protanopia').locator('..')
    
    // Click to activate
    await protanopiaButton.click()
    await expect(protanopiaButton).toHaveClass(/active/)
    
    // Click again to deactivate
    await protanopiaButton.click()
    await expect(protanopiaButton).not.toHaveClass(/active/)
  })
  
  test('shows clear button when filter is active', async ({ page }) => {
    const protanopiaButton = page.getByText('Protanopia').locator('..')
    
    // No clear button initially
    await expect(page.getByRole('button', { name: /clear active filter/i })).not.toBeVisible()
    
    // Activate filter
    await protanopiaButton.click()
    
    // Clear button appears
    await expect(page.getByRole('button', { name: /clear active filter/i })).toBeVisible()
  })
  
  test('info panel shows filter-specific info when filter is active', async ({ page }) => {
    const protanopiaButton = page.getByText('Protanopia').locator('..')
    
    // Activate filter
    await protanopiaButton.click()
    
    // Check for filter-specific info
    await expect(page.getByText(/red-blind/i)).toBeVisible()
    await expect(page.getByText('Prevalence:')).toBeVisible()
  })
  
  test('has accessible skip link', async ({ page }) => {
    // Tab to skip link
    await page.keyboard.press('Tab')
    
    const skipLink = page.getByText('Skip to main content')
    await expect(skipLink).toBeFocused()
  })
  
  test('keyboard navigation works', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab') // Skip link
    await page.keyboard.press('Tab') // URL input
    
    const input = page.getByLabel(/website url/i)
    await expect(input).toBeFocused()
  })
  
  test('displays empty state message in viewer', async ({ page }) => {
    await expect(page.getByText(/enter a website url above/i)).toBeVisible()
  })
  
  test('footer has GitHub link', async ({ page }) => {
    const githubLink = page.getByRole('link', { name: /view on github/i })
    await expect(githubLink).toBeVisible()
    await expect(githubLink).toHaveAttribute('href', /github.com/)
  })
})

