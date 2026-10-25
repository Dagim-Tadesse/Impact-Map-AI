import { test, expect } from '@playwright/test';

test.describe('Flow 2: Signature Cascade Replay Timeline', () => {
  test('triggers pitch demo, scrubs cascade timeline, and verifies day-by-day narration', async ({ page }) => {
    await page.goto('/explore');

    // 1. Trigger Event Simulation from TopBar
    const pitchDemoBtn = page.getByRole('button', { name: /Event Simulation|Pitch Demo/i });
    await expect(pitchDemoBtn).toBeVisible();
    await pitchDemoBtn.click();

    // 2. Verify CascadeBar floating timeline appears
    await expect(page.locator('text=Step 1/')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=mm cumulative')).toBeVisible();

    // 3. Pause playback to scrub manually
    const pauseBtn = page.locator('button[title*="Pause"]').first();
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click();
    }

    // 4. Scrub or click to step 2
    const step2Btn = page.getByRole('button', { name: 'Jump to Step 2' }).first();
    if (await step2Btn.isVisible()) {
      await step2Btn.click();
    } else {
      const slider = page.locator('input[type="range"][min="1"]').first();
      await slider.evaluate((node: HTMLInputElement) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        setter?.call(node, '2');
        node.dispatchEvent(new Event('input', { bubbles: true }));
        node.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    // 5. Verify Day 2 narration updates
    await expect(page.locator('text=Day 2').first()).toBeVisible({ timeout: 5000 });

    // 6. Scrub or click to step 3
    const step3Btn = page.getByRole('button', { name: 'Jump to Step 3' }).first();
    if (await step3Btn.isVisible()) {
      await step3Btn.click();
    } else {
      const slider = page.locator('input[type="range"][min="1"]').first();
      await slider.evaluate((node: HTMLInputElement) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        setter?.call(node, '3');
        node.dispatchEvent(new Event('input', { bubbles: true }));
        node.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
    await expect(page.locator('text=Day 3').first()).toBeVisible({ timeout: 5000 });

    // 7. Exit Cascade Replay
    const exitBtn = page.locator('button[title*="Exit"]').first();
    await exitBtn.click();
    await expect(page.locator('button[title*="Exit"]')).not.toBeVisible();
  });
});
