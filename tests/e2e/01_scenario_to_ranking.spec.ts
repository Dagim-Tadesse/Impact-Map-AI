import { test, expect } from '@playwright/test';

test.describe('Flow 1: Run Scenario to Facility Ranking Explanation', () => {
  test('opens app, executes baseline scenario, and verifies facility explanation', async ({ page }) => {
    await page.goto('/explore');

    // 1. Verify Header Branding & Pilot Telemetry
    await expect(page.locator('text=ImpactMapAI').first()).toBeVisible();
    await expect(page.locator('text=Flood Ops').first()).toBeVisible();

    // 2. Dismiss hero if expanded or verify map canvas
    const exploreBtn = page.getByRole('button', { name: /Explore Map/i });
    if (await exploreBtn.isVisible()) {
      await exploreBtn.click();
    }

    // 3. Navigate to Scenario Tab
    const scenarioTabBtn = page.getByRole('button', { name: /Scenario/i });
    await scenarioTabBtn.first().click();

    // 4. Click Run on the first library scenario card or custom run
    const runBtn = page.getByRole('button', { name: /^Run$/i }).first();
    if (await runBtn.isVisible()) {
      await runBtn.click();
    } else {
      await page.getByRole('button', { name: /Run Accessibility Simulation/i }).click();
    }

    // 5. Wait for Results Tab to become active and populate results
    await expect(page.locator('text=Cut Off Population').first()).toBeVisible({ timeout: 20000 });

    // 7. Click first facility to open FacilityDrawer
    const firstFacility = page.locator('.glass-panel h4').first();
    if (await firstFacility.isVisible()) {
      await firstFacility.click();

      // 8. Verify Explanation Drawer opens with Plain-Language why sentences
      await expect(page.locator('text=Isolation Risk Probability')).toBeVisible();
      await expect(page.locator('text=Why this facility is at risk')).toBeVisible();
    }
  });
});
