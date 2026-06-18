const { test, expect } = require('@playwright/test');

test.describe('Ecosystem Visual Stages Logic', () => {

  // Helper to inject a specific ecoScore into localStorage and reload
  async function setEcoScoreAndReload(page, score) {
    await page.goto('/');
    await page.evaluate((s) => {
      const profile = {
        userId: "usr_local_test",
        name: "Test User",
        joinedDate: new Date().toISOString(),
        points: s * 10,
        level: Math.floor(s/10),
        co2Target: 10,
        currentCo2: 5,
        ecoScore: s,
        stats: { transport: 0, food: 0, energy: 0, lifestyle: 0 }
      };
      localStorage.setItem("ecosphere_userProfile", JSON.stringify(profile));
    }, score);
    await page.reload();
    // Wait for SVG to load
    await expect(page.locator('#eco-island-svg')).toBeVisible();
  }

  test('Stage 1 (Score < 28) should show polluted sky and sad sage', async ({ page }) => {
    await setEcoScoreAndReload(page, 20);
    
    // Check sky gradient
    const skyFill = await page.locator('#sky-bg').getAttribute('fill');
    expect(skyFill).toBe('url(#sky-gradient-polluted)');
    
    // Check smog is visible
    await expect(page.locator('#smog-group')).toHaveCSS('opacity', '1');
    
    // Check sad frown on sage (M-5,-4 Q0,-8 5,-4)
    const sageMouth = await page.locator('#sage-mouth').getAttribute('d');
    expect(sageMouth).toBe('M-5,-4 Q0,-8 5,-4');
  });

  test('Stage 3 (Score 48-67) should show growing sky and sun rays', async ({ page }) => {
    await setEcoScoreAndReload(page, 55);
    
    const skyFill = await page.locator('#sky-bg').getAttribute('fill');
    expect(skyFill).toBe('url(#sky-gradient-growing)');
    
    // Sun rays should be visible
    await expect(page.locator('#sun-rays')).toHaveCSS('opacity', '0.6');
    
    // Smog should be gone
    await expect(page.locator('#smog-group')).toHaveCSS('opacity', '0');
    
    // Slight smile on sage
    const sageMouth = await page.locator('#sage-mouth').getAttribute('d');
    expect(sageMouth).toBe('M-5,-6 Q0,-3 5,-6');
  });

  test('Stage 5 (Score >= 85) should show paradise sky, rainbow, and sparkles', async ({ page }) => {
    await setEcoScoreAndReload(page, 95);
    
    const skyFill = await page.locator('#sky-bg').getAttribute('fill');
    expect(skyFill).toBe('url(#sky-gradient-paradise)');
    
    // Rainbow visible
    await expect(page.locator('#rainbow-group')).toHaveCSS('opacity', '1');
    
    // Sparkles visible
    await expect(page.locator('#sage-sparkles')).toHaveCSS('opacity', '1');
    
    // Huge grin on sage
    const sageMouth = await page.locator('#sage-mouth').getAttribute('d');
    expect(sageMouth).toBe('M-6,-8 Q0,0 6,-8');
    
    // Rabbit visible
    await expect(page.locator('#rabbit-group')).toHaveCSS('opacity', '1');
  });
});
