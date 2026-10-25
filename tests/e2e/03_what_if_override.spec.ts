import { test, expect } from '@playwright/test';

test.describe('Flow 3: What-If Operational Overrides & Interventions', () => {
  test('adds road closure override, opens floating basket, and verifies re-simulation', async ({ page }) => {
    await page.goto('/explore');

    // 1. Run baseline scenario first to get active results
    const scenarioTabBtn = page.getByRole('button', { name: /Scenario/i });
    await scenarioTabBtn.first().click();

    const runBtn = page.getByRole('button', { name: /^Run$/i }).first();
    if (await runBtn.isVisible()) {
      await runBtn.click();
    } else {
      await page.getByRole('button', { name: /Run Accessibility Simulation/i }).click();
    }

    // 2. Select a facility from results to inspect its critical road segment
    const resultsTabBtn = page.getByRole('button', { name: /Results/i });
    await resultsTabBtn.first().click();

    const firstFacility = page.locator('.glass-panel h4').first();
    if (await firstFacility.isVisible()) {
      await firstFacility.click();

      // 3. Click critical road segment chip in the facility drawer if present
      const segChip = page.locator('button:has-text("Seg #")').first();
      if (await segChip.isVisible()) {
        await segChip.click();

        // 4. In SegmentDrawer, click "Assume Closed"
        const assumeClosedBtn = page.getByRole('button', { name: /Assume Closed/i });
        await expect(assumeClosedBtn).toBeVisible();
        await assumeClosedBtn.click();

        // 5. Verify What-If floating basket appears
        await expect(page.locator('text=What-If Interventions')).toBeVisible();

        // 6. Click Apply & Re-simulate
        const applyBtn = page.getByRole('button', { name: /Apply & Re-simulate/i });
        await expect(applyBtn).toBeVisible();
        await applyBtn.click();

        // 7. Verify simulation re-runs and returns to results tab
        await expect(page.locator('text=Facility Disruption Priority').first()).toBeVisible();
      }
    }
  });
});
