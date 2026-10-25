import { chromium } from 'playwright';
import path from 'path';

async function capture() {
  const browser = await chromium.launch();
  const outDir = '/home/anon/.gemini/antigravity-ide/brain/de278725-b4dc-4b3f-9171-c34b00547357';

  // 1. Mobile (iPhone 14 / modern phone: 390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173/');
  await mobilePage.waitForTimeout(1500);

  // Hero
  await mobilePage.screenshot({ path: path.join(outDir, 'mobile_01_hero.png') });

  // Mobile Hamburger Menu Open
  const menuBtn = mobilePage.locator('button[aria-label="Open menu"]');
  if (await menuBtn.isVisible()) {
    await menuBtn.click();
    await mobilePage.waitForTimeout(400);
    await mobilePage.screenshot({ path: path.join(outDir, 'mobile_nav_menu.png') });
    const closeBtn = mobilePage.locator('button[aria-label="Close menu"]');
    if (await closeBtn.isVisible()) await closeBtn.click();
  }

  // Crisis (Zoom into crisis section)
  await mobilePage.evaluate(() => {
    window.scrollTo({ top: 1200, behavior: 'instant' });
  });
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: path.join(outDir, 'mobile_02_crisis.png') });

  // Solution (aligned to top)
  await mobilePage.evaluate(() => {
    document.getElementById('solution')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: path.join(outDir, 'mobile_03_solution.png') });

  // Architecture (aligned to top)
  await mobilePage.evaluate(() => {
    document.getElementById('architecture')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: path.join(outDir, 'mobile_04_arch.png') });

  // Team (aligned to top)
  await mobilePage.evaluate(() => {
    document.getElementById('team')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: path.join(outDir, 'mobile_05_team.png') });

  // 2. Desktop (1280x800)
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:5173/');
  await desktopPage.waitForTimeout(1500);

  // Desktop Hero
  await desktopPage.screenshot({ path: path.join(outDir, 'desktop_01_hero.png') });

  // Desktop Solution
  await desktopPage.evaluate(() => {
    document.getElementById('solution')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await desktopPage.waitForTimeout(800);
  await desktopPage.screenshot({ path: path.join(outDir, 'desktop_03_solution.png') });

  // Desktop Architecture
  await desktopPage.evaluate(() => {
    document.getElementById('architecture')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await desktopPage.waitForTimeout(800);
  await desktopPage.screenshot({ path: path.join(outDir, 'desktop_04_arch.png') });

  // Desktop Team
  await desktopPage.evaluate(() => {
    document.getElementById('team')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await desktopPage.waitForTimeout(800);
  await desktopPage.screenshot({ path: path.join(outDir, 'desktop_05_team.png') });

  await browser.close();
  console.log('Screenshots captured successfully!');
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
