const { chromium } = require('/Users/jashan/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(require.resolve('sharp', { paths: [require.resolve('next/package.json')] }));
const root = process.cwd();
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  const source = await sharp(path.join(root, 'public/media/collection-trio-v2.webp')).metadata();
  for (const width of [1920, 1440, 900, 768, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto('http://localhost:3100', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    const trio = page.locator('#first-edition');
    await trio.scrollIntoViewIfNeeded();
    await trio.locator('img').evaluate(img => img.decode());
    const metrics = await trio.locator('img').evaluate(img => ({
      src: img.currentSrc, width: img.getBoundingClientRect().width,
      height: img.getBoundingClientRect().height,
      fit: getComputedStyle(img).objectFit,
      ancestors: [img.parentElement, img.parentElement.parentElement, img.parentElement.parentElement.parentElement].map(el => ({transform:getComputedStyle(el).transform,filter:getComputedStyle(el).filter})),
    }));
    const cta = await trio.getByRole('link', { name: 'Choose your hour' }).getAttribute('href');
    if (width === 1440 || width === 390) await trio.screenshot({ path: `output/audit/trio-refreshed-${width}.png`, animations: 'disabled' });
    const salon = page.locator('#salon');
    await salon.scrollIntoViewIfNeeded();
    await salon.locator('img').evaluate(img => img.decode());
    const salonMetrics = await salon.evaluate(el => {
      const img = el.querySelector('img');
      const input = el.querySelector('input');
      const button = el.querySelector('button');
      const section = el.getBoundingClientRect();
      return { src: img.currentSrc, filter:getComputedStyle(img).filter, transform:getComputedStyle(img).transform,
        inputFits: input.getBoundingClientRect().left >= section.left && input.getBoundingClientRect().right <= section.right,
        buttonFits: button.getBoundingClientRect().left >= section.left && button.getBoundingClientRect().right <= section.right,
        inputType: input.type, required: input.required };
    });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (width === 1440 || width === 390) await salon.screenshot({ path: `output/audit/salon-refreshed-${width}.png`, animations: 'disabled' });
    const item = { width, status:response.status(), overflow, errors, trio:{...metrics, retinaSufficient:source.width >= metrics.width * 2, uncropped:Math.abs(metrics.width / metrics.height - 1.5) < .01, cta}, salon:salonMetrics };
    results.push(item);
    console.log(JSON.stringify(item));
    await context.close();
  }
  // The shared Salon backdrop also renders on the collection page.
  const page = await browser.newPage({ viewport:{width:1440,height:1000}, reducedMotion:'reduce' });
  await page.goto('http://localhost:3100/collection', {waitUntil:'domcontentloaded'});
  await page.locator('#salon').scrollIntoViewIfNeeded();
  await page.locator('#salon img').evaluate(img => img.decode());
  const shared = await page.locator('#salon img').getAttribute('src');
  const pills = await page.locator('main').getByText(/^NO\.\s*(I|II|III)\s*·/i).count();
  results.push({route:'/collection',sharedSalonBackdrop:shared.includes('salon-backdrop'),productPhotoPills:pills});
  fs.writeFileSync('output/audit/image-refresh-results.json', JSON.stringify(results,null,2));
  await browser.close();
  if (results.some(r => r.status && (r.status!==200 || r.overflow || r.errors.length || !r.trio.retinaSufficient || !r.trio.uncropped || r.trio.cta!=='/collection' || !r.salon.inputFits || !r.salon.buttonFits))) process.exitCode = 1;
})().catch(error => {console.error(error); process.exitCode=1;});
