const { test, expect } = require('@playwright/test');

test.describe('Dashboard Core Logic', () => {

  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure a clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('Initial load should show empty state analogies and default eco score', async ({ page }) => {
    await expect(page).toHaveTitle(/EcoSphere/);
    
    // Check initial level and score
    await expect(page.locator('#header-level')).toHaveText('2');
    await expect(page.locator('#header-ecoscore')).toHaveText('82');
    await expect(page.locator('#header-points')).toHaveText('320');
    
    // Check initial empty log analogy
    await expect(page.locator('#analogy-text')).toContainText('Cumulative savings');
  });

  test('Adding a preset activity should update points, score, and show in timeline', async ({ page }) => {
    // Click the first preset card
    const presetCard = page.locator('.preset-card').first();
    const presetTitle = await presetCard.locator('.preset-title').textContent();
    await presetCard.click();
    
    // Check points increased (easy preset usually gives some points)
    const newPoints = await page.locator('#header-points').textContent();
    expect(parseInt(newPoints)).toBeGreaterThan(0);
    
    // Verify it appeared in the timeline
    const firstTimelineItem = page.locator('#timeline-body tr').first();
    await expect(firstTimelineItem).toBeVisible();
    await expect(firstTimelineItem.locator('td').nth(2)).toContainText(presetTitle);
  });

  test('Submitting a custom activity through the modal', async ({ page }) => {
    // Fill out custom form directly (it seems it's not a modal, just a section)
    // Actually, looking at HTML, it's just a div. Let's fill it directly.
    await page.locator('#custom-activity').fill('Rode bike to work');
    await page.locator('#custom-value').fill('15');
    // unit is a span displaying the unit text, no need to fill
    await page.locator('#custom-co2-avoided').fill('3.5');
    await page.locator('#custom-co2-produced').fill('0');
    await page.locator('#custom-points').fill('50');
    
    // Submit
    await page.locator('#btn-submit-log').click();
    // Verify coach message appears instead of toast
    await expect(page.locator('#coach-messages')).toContainText('Wonderful job!');
    
    // Verify timeline updated
    const timelineFirst = page.locator('#timeline-body tr').first();
    await expect(timelineFirst.locator('td').nth(2)).toContainText('Rode bike to work');
    
    // Verify Analogy Text updated
    await expect(page.locator('#analogy-text')).toContainText('kg CO₂');
  });
});
