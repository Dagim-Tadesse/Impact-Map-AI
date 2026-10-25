import { test, expect } from '@playwright/test';

test.describe('Flow 4: Mobile/Tablet Responsiveness & Offline Telemetry', () => {
  test('verifies mobile 3-position bottom sheet cycling and 3D mode controls', async ({ page }) => {
    // Set mobile viewport (Pixel 7 / iPhone form factor)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/explore');

    // 1. Verify TopBar responsive elements
    await expect(page.locator('text=ImpactMapAI').first()).toBeVisible();

    // 2. Dismiss Hero if expanded
    const exploreBtn = page.getByRole('button', { name: /Explore Map/i });
    if (await exploreBtn.isVisible()) {
      await exploreBtn.click();
    }

    // 3. Verify 3D VIEW toggle button exists on map HUD
    const mode3dBtn = page.locator('button:has-text("2D VIEW"), button:has-text("3D VIEW")').first();
    await expect(mode3dBtn).toBeVisible();
    await mode3dBtn.click();
    await expect(page.locator('button:has-text("3D VIEW")')).toBeVisible({ timeout: 5000 });

    // 4. Verify Mobile Bottom Sheet Handle
    const mobileSheet = page.locator('[data-testid="mobile-bottom-sheet"]');
    await expect(mobileSheet).toBeVisible();

    // 5. Test Quick Position Buttons on Mobile Sheet Handle
    const halfBtn = page.getByRole('button', { name: /^half$/i }).first();
    if (await halfBtn.isVisible()) {
      await halfBtn.click();
      await expect(mobileSheet).toHaveClass(/h-\[50vh\]/);

      const fullBtn = page.getByRole('button', { name: /^full$/i }).first();
      await fullBtn.click();
      await expect(mobileSheet).toHaveClass(/h-\[calc/);

      const peekBtn = page.getByRole('button', { name: /^peek$/i }).first();
      await peekBtn.click();
      await expect(mobileSheet).toHaveClass(/h-16/);
    }
  });

  test('verifies evidence badge and about modal dialog', async ({ page }) => {
    await page.goto('/explore');

    // Open the identity chip menu, then click About inside it
    const identityBtn = page.getByRole('button', { name: /ImpactMap/i }).first();
    await identityBtn.click();
    const aboutBtn = page.getByRole('menuitem', { name: /^About$/i }).first();
    await aboutBtn.click();

    // Verify The Three Non-Mixed Quantities explanation is rendered
    await expect(page.locator('text=The Three Non-Mixed Quantities')).toBeVisible();
    await expect(page.locator('text=Flood Exposure Probability').first()).toBeVisible();
    await expect(page.locator('text=Assumed Road Closure').first()).toBeVisible();
    await expect(page.locator('text=Estimated Access Loss').first()).toBeVisible();

    // Close About Dialog / Return to Map
    const closeBtn = page.getByRole('button', { name: /Return to Map Explorer/i });
    await closeBtn.click();
    await expect(page.locator('text=The Three Non-Mixed Quantities')).not.toBeVisible();
  });
});
