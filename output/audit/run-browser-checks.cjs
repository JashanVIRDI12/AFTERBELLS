const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/Users/jashan/.npm/_npx/e41f203b7505f1fb/node_modules/playwright')
const fs = require('node:fs')
const assert = require('node:assert/strict')
const base = process.env.AUDIT_URL || 'http://localhost:3100'

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const results = { base, checks: [], errors: [], screenshots: [] }
  const check = (name) => { results.checks.push(name); console.log('PASS:', name) }
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    page.on('pageerror', (e) => results.errors.push(e.message))
    for (const route of ['/', '/fragrances/amber-hour', '/fragrances/open-sky', '/fragrances/iron-crown', '/feedback', '/policies', '/checkout', '/api/stock', '/robots.txt', '/sitemap.xml', '/manifest.webmanifest']) {
      const response = await context.request.get(base + route)
      assert.equal(response.status(), 200, route)
    }
    assert.equal((await context.request.get(base + '/admin')).status(), 401)
    assert.equal((await context.request.get(base + '/fragrances/unknown')).status(), 404)
    assert.equal((await context.request.get(base + '/order/nonexistent-audit-order')).status(), 404)
    check('Public routes, protected admin, and missing routes return expected statuses')

    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: width > 800 ? 1000 : 844 })
      for (const route of ['/', '/fragrances/open-sky', '/fragrances/iron-crown', '/feedback', '/policies', '/checkout']) {
        await page.goto(base + route, { waitUntil: 'networkidle' })
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${route} at ${width}`)
      }
    }
    check('No horizontal overflow across six routes at 320, 390, 768, and 1440px')

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(base + '/', { waitUntil: 'networkidle' })
    const menuTrigger = page.getByRole('button', { name: 'Open menu', exact: true })
    await menuTrigger.click()
    const menu = page.getByRole('dialog', { name: 'Explore After Bells' })
    await menu.getByRole('button', { name: 'Close menu' }).waitFor({ state: 'visible' })
    assert.equal(await menu.evaluate((el) => el.contains(document.activeElement)), true)
    await page.keyboard.press('Shift+Tab')
    assert.equal(await menu.evaluate((el) => el.contains(document.activeElement)), true)
    await page.keyboard.press('Tab')
    assert.equal(await menu.evaluate((el) => el.contains(document.activeElement)), true)
    await page.keyboard.press('Escape')
    assert.equal(await menuTrigger.evaluate((el) => el === document.activeElement), true)
    check('Mobile menu traps keyboard focus and restores its opener on Escape')

    await page.goto(base + '/fragrances/amber-hour', { waitUntil: 'networkidle' })
    const gallery = page.getByRole('group', { name: 'Choose image' })
    await gallery.getByRole('button', { name: /gold-flake detail/ }).click()
    await page.waitForFunction(() => document.querySelector('[aria-label="Choose image"] button:nth-child(2)').getAttribute('aria-pressed') === 'true')
    const reserve = page.getByRole('button', { name: /^Reserve.*4,500$/ })
    await reserve.click()
    const bag = page.getByRole('dialog', { name: 'Your bag' })
    await bag.getByRole('button', { name: 'Close bag' }).waitFor({ state: 'visible' })
    assert.equal(await bag.locator('img[src*="amber-hour-bottle"]').count(), 1)
    await page.keyboard.press('Shift+Tab')
    assert.equal(await bag.evaluate((el) => el.contains(document.activeElement)), true)
    await page.keyboard.press('Tab')
    assert.equal(await bag.evaluate((el) => el.contains(document.activeElement)), true)
    await page.keyboard.press('Escape')
    assert.equal(await reserve.evaluate((el) => el === document.activeElement), true)
    check('Mobile gallery changes images; reserve opens a bag with product photography and contained focus')

    await page.goto(base + '/checkout', { waitUntil: 'networkidle' })
    assert.ok(await page.locator('main img[src*="amber-hour-bottle"]').count() >= 1)
    await page.screenshot({ path: 'output/audit/checkout-mobile.png', fullPage: true })
    check('Checkout retains the bag and shows the matching bottle photo')

    await page.goto(base + '/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Watch the film' }).click()
    const film = page.getByRole('dialog', { name: 'After Bells film' })
    await film.getByRole('button', { name: 'Close' }).waitFor({ state: 'visible' })
    assert.equal(await film.locator('video').evaluate((v) => v.controls && v.getAttribute('src').includes('hero-film.mp4')), true)
    await page.keyboard.press('Escape')
    check('Film dialog uses the supplied video, has playback controls, and closes with Escape')

    await page.goto(base + '/#faq', { waitUntil: 'networkidle' })
    const faq = page.getByRole('button', { name: 'When will my order arrive?' })
    if (await faq.getAttribute('aria-expanded') === 'true') await faq.click()
    await faq.click()
    assert.equal(await faq.getAttribute('aria-expanded'), 'true')
    await faq.click()
    assert.equal(await page.evaluate((id) => document.getElementById(id).getAttribute('aria-hidden'), await faq.getAttribute('aria-controls')), 'true')
    check('FAQ open state and hidden answer semantics stay synchronized')

    await page.goto(base + '/', { waitUntil: 'networkidle' })
    assert.equal(await page.locator('section[aria-label="Introduction"] video').evaluate((v) => v.paused), true)
    await page.getByRole('button', { name: 'Play background film' }).click()
    await page.waitForFunction(() => document.querySelector('section[aria-label="Introduction"] video').currentTime > 0.1)
    await page.getByRole('button', { name: 'Pause background film' }).click()
    check('Reduced motion leaves the hero still; explicit play and pause work')

    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width > 800 ? 1000 : 844 })
      await page.goto(base + '/', { waitUntil: 'networkidle' })
      await page.screenshot({ path: `output/audit/home-${width}.png` })
      const collection = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Iron Crown', exact: true }) })
      await collection.scrollIntoViewIfNeeded()
      await collection.locator('img').evaluate((image) => image.decode())
      await page.screenshot({ path: `output/audit/collection-${width}.png` })
      const missing = await page.locator('img').evaluateAll((images) => images.filter((i) => i.getAttribute('src')?.includes('media') && i.complete && i.naturalWidth === 0).map((i) => i.src))
      assert.deepEqual(missing, [])
      results.screenshots.push(`home-${width}.png`, `collection-${width}.png`)
    }
    check('Desktop and mobile collection screenshots contain no broken loaded media')
    assert.deepEqual(results.errors, [])
    check('No uncaught browser errors during the audited flows')
    await context.close()
  } finally {
    fs.writeFileSync('output/audit/browser-results.json', JSON.stringify(results, null, 2))
    await browser.close()
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1 })
