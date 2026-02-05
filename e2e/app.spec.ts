import { test, expect } from '@playwright/test'

test('app loads successfully', async ({ page }) => {
  await page.goto('/')
  
  await expect(page.locator('h1')).toContainText('Daily Quests')
})

test('create a new list', async ({ page }) => {
  await page.goto('/')
  
  page.on('dialog', dialog => {
    dialog.accept('My Test List')
  })
  
  await page.click('button:has-text("New list")')
  
  await expect(page.locator('button:has-text("My Test List")')).toBeVisible()
})
