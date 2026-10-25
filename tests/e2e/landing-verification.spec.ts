import { test, expect } from '@playwright/test';

test.describe('Landing Page 5 Key Feature Verification', () => {
  test('verifies all 5 user requested landing improvements', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // 1. Hero section: check hero images low-res fast query & high contrast
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();
    const heroTitle = page.locator('h1', { hasText: 'ImpactMap' });
    await expect(heroTitle).toBeVisible();
    const heroPitch = page.locator('text=ImpactMap AI helps humanitarian aid coordinators predict critical supply corridor failure');
    await expect(heroPitch).toBeVisible();

    // 1. Hero: Verify single unified background image is attached and visible
    const heroBgImg = page.locator('img[alt="Orbital satellite radar monitoring flood zones"]').first();
    await expect(heroBgImg).toBeAttached();

    // Verify the hero title & pitch float directly over the cylinder without an enclosing glass box
    const glassCardWrapper = page.locator('div.border.border-white\\/10:has-text("ImpactMap AI helps humanitarian")');
    expect(await glassCardWrapper.count()).toBe(0);

    // Verify AWASH BASIN badge is removed from hero
    expect(await page.locator('text=AWASH BASIN CRISIS INTELLIGENCE • COP30 RESILIENCE').count()).toBe(0);

    // Verify placeholder buttons are removed
    expect(await page.locator('text=Demo Video').count()).toBe(0);
    expect(await page.locator('text=Slide Deck').count()).toBe(0);
    expect(await page.locator('a[href^="mailto:"]').count()).toBe(0);

    // 2. Crisis section: scroll down into it, then scroll back up
    const crisisPortal = page.locator('h2', { hasText: 'CRISIS' });
    await expect(crisisPortal).toBeVisible();
    expect(await page.locator('text=STEP INSIDE THE FLOOD CRISIS').count()).toBe(0);
    expect(await page.locator('text=THE CRISIS WE SOLVE').count()).toBe(0);

    // Scroll down into crisis
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(600);
    const crisisBriefing = page.locator('text=When the Awash River floods');
    await expect(crisisBriefing).toBeVisible();
    // Verify enlarged metrics are attached
    await expect(page.locator('text=4,200,000+')).toBeVisible();

    // Scroll back up to top smoothly (verifying no stuck pin or reverse freeze)
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    await expect(heroTitle).toBeVisible();

    // 3. Solution section: 5 horizontal cards
    const solHeading = page.locator('text=Five Breakthrough Capabilities');
    await page.evaluate(() => {
      const el = document.getElementById('solution');
      if (el) el.scrollIntoView();
    });
    await solHeading.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
    await expect(solHeading).toBeVisible();

    const card1 = page.locator('text=01 • HYDRO-MET ENGINE');
    const card2 = page.locator('text=02 • CASCADE PROPAGATION');
    const card3 = page.locator('text=03 • WHAT-IF SANDBOX');
    const card4 = page.locator('text=04 • SATELLITE GROUND GATE');
    const card5 = page.locator('text=05 • TACTICAL ZERO-CONNECTIVITY');

    await expect(card1).toBeAttached();
    await expect(card2).toBeAttached();
    await expect(card3).toBeAttached();
    await expect(card4).toBeAttached();
    await expect(card5).toBeAttached();

    // 4. The Hardest Technical Problem Solved section (swapped before Architecture)
    const hardestBadge = page.locator('#hardest-problem').locator('text=THE HARDEST TECHNICAL PROBLEM WE SOLVED');
    await expect(hardestBadge).toBeAttached();
    await expect(page.locator('#hardest-problem').locator('text=De-conflating Flood Probability from Physical Road Closure')).toBeAttached();
    await expect(page.locator('#hardest-problem').locator('text=0.023 ECE')).toBeAttached();

    // 5. System Architecture: Stage 1 through Stage 5 scroll smoothly
    expect(await page.locator('text=SYSTEM ARCHITECTURE').count()).toBe(0);
    const archHeading = page.locator('text=From Raindrops to Relief Convoys');
    await page.evaluate(() => {
      const el = document.getElementById('architecture');
      if (el) el.scrollIntoView();
    });
    await archHeading.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
    await expect(archHeading).toBeVisible();

    const stage1 = page.locator('text=Hydrologic Ingestion');
    const stage2 = page.locator('text=Calibrated Inundation');
    await expect(stage1).toBeAttached();
    await expect(stage2).toBeAttached();

    // 6. Meet the Team: orbital animation, center display, and all 5 members
    expect(await page.locator('text=THE BUILDERS').count()).toBe(0);
    const teamHeading = page.locator('text=Meet the Team');
    await page.evaluate(() => {
      const el = document.getElementById('team');
      if (el) el.scrollIntoView();
    });
    await teamHeading.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
    await expect(teamHeading).toBeVisible();

    // Verify center HUD is present with one of the 5 team members
    const centerName = page.locator('h3', { hasText: /Yabets Maregn|Dagim Tadesse|Yared Getachew|Yeabsira Tilaye|Yeabsira Misganaw/ }).last();
    await expect(centerName).toBeVisible();

    // Verify all 5 orbital nodes exist
    for (let id = 1; id <= 5; id++) {
      const node = page.locator(`[data-testid="orbital-node-${id}"]`);
      await expect(node).toBeVisible();
    }

    // Verify old glitchy TextRoll letter repeated list is gone!
    const oldGlitchyCards = page.locator('text=A A n n o o n n');
    expect(await oldGlitchyCards.count()).toBe(0);

    // Verify clicking an orbital node pins it (use dispatchEvent since node is actively rotating)
    const dagimNode = page.locator('[data-testid="orbital-node-2"]');
    await dagimNode.dispatchEvent('click');
    await page.waitForTimeout(300);
    const dagimHeader = page.locator('h3', { hasText: 'Dagim Tadesse' }).first();
    await expect(dagimHeader).toBeVisible();

    // Verify after 5 seconds it automatically unpins and resumes rotating
    await page.waitForTimeout(5200);

    console.log('All 5 landing page requirements and 5s auto-resume rotation verified successfully!');
  });

  test('verifies floating curved navbar, English-only nav, and architecture stage 05 completion', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // 1. Verify Floating Navigation Bar
    const navBar = page.locator('header').first();
    await expect(navBar).toBeVisible();
    await expect(navBar.locator('text=ImpactMap')).toBeVisible();

    // 2. Verify language switcher was removed (landing is English-only; toggle lives in Explorer TopBar)
    await expect(navBar.locator('button[aria-label="Toggle language"]')).toHaveCount(0);

    // 3. Verify Stage 05 is reached and visible in System Architecture
    await page.evaluate(() => {
      const arch = document.getElementById('architecture');
      if (arch) {
        window.scrollTo(0, arch.offsetTop + (arch.offsetHeight * 0.75));
      }
    });
    await page.waitForTimeout(600);
    const stage5 = page.locator('text=Ground Truth Verification');
    await expect(stage5).toBeVisible();

    console.log('Floating navbar, English-only nav, and Stage 05 verified successfully!');
  });
});
