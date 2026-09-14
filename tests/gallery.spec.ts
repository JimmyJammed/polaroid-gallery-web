import { test, expect } from '@playwright/test';
import type { Gallery, GalleryOptions } from '../src/types';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { PolaroidGallery } from '../src/react';
declare global { interface Window { gallery: Gallery; smallGallery: Gallery; sampleItems: GalleryOptions['items']; galleryFactory: (root: HTMLElement, options: GalleryOptions) => Gallery; extra?: Gallery } }
test.beforeEach(async ({ page }) => { await page.goto('/'); await page.waitForFunction(() => !!window.gallery); });
test('counts, primary changes, validation and empty state', async ({ page }) => {
  for (const count of [0, 1, 2, 5, 12, 50, 100, 250]) {
    await page.evaluate(n => window.gallery.update({ items: Array.from({ length: n }, (_, i) => ({ id: `test-${i}`, src: '/images/scene-1.svg', alt: `Image ${i}` })), count: n }), count);
    await expect(page.locator('#gallery .tpg-card')).toHaveCount(count);
  }
  const valid = await page.evaluate(() => {
    window.gallery.update({ items: window.sampleItems, count: 5, primaryId: 'scene-5' });
    const before = window.gallery.getState();
    try { window.gallery.update({ count: -1 }); } catch { /* intended */ }
    return { before, after: window.gallery.getState() };
  });
  expect(valid.after.selectedIds).toEqual(valid.before.selectedIds); expect(valid.after.selectedIds[0]).toBe('scene-5');
});
test('keyboard browse before scroll reveal is visible and complete', async ({ page }) => {
  await page.evaluate(() => window.gallery.update({ presentation: 'scroll-deal', primaryInteractive: false }));
  await page.locator('#gallery .tpg-browse').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('dialog[open] .tpg-status')).toContainText('1 of 11');
  await expect(page.locator('dialog[open] .tpg-held')).toHaveCSS('opacity', '1');
  for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); expect(await page.evaluate(() => !!document.activeElement?.closest('dialog[open]'))).toBe(true); }
  await page.keyboard.press('Escape'); await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('#gallery .tpg-browse')).toBeFocused();
});
test('open, rapid paging, interruption and reopen preserve identity', async ({ page }) => {
  await page.evaluate(() => window.gallery.open('scene-1'));
  await page.evaluate(() => { window.gallery.close(); window.gallery.open('scene-2'); window.gallery.open('scene-3'); });
  await expect.poll(() => page.evaluate(() => window.gallery.getState().phase)).toBe('open');
  await expect(page.locator('dialog[open] .tpg-held')).toHaveAttribute('data-photo-id', 'scene-3');
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowLeft');
  await expect.poll(() => page.evaluate(() => window.gallery.getState().phase)).toBe('open');
  await page.keyboard.press('Escape'); await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('#gallery .tpg-card')).toHaveCount(12);
  await expect(page.locator('#gallery .tpg-flight')).toHaveCount(0);
});
test('active update, removal and two instances', async ({ page }) => {
  await page.evaluate(() => { window.gallery.open('scene-2'); window.gallery.update({ count: 5 }); });
  await expect(page.locator('dialog[open] .tpg-held')).toHaveAttribute('data-photo-id', 'scene-2');
  await page.evaluate(() => window.gallery.update({ items: window.sampleItems.filter(p => p.id !== 'scene-2') }));
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('#small-gallery .tpg-card')).toHaveCount(3);
  await page.evaluate(() => window.smallGallery.open()); await expect(page.locator('dialog[open] .tpg-status')).toContainText('1 of 3');
  await page.evaluate(() => window.smallGallery.update({items:[]}));
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('#small-gallery .tpg-browse')).toBeFocused();
});
test('resize while opening and closing; hidden host recovers', async ({ page }) => {
  await page.evaluate(() => window.gallery.open('scene-3'));
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('dialog[open] .tpg-held')).toBeVisible();
  for (const selector of ['.tpg-close', '.tpg-next', '.tpg-prev']) {
    const box = await page.locator(`dialog[open] ${selector}`).boundingBox(); expect(box).toBeTruthy(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.y).toBeGreaterThanOrEqual(0); expect(box!.y + box!.height).toBeLessThanOrEqual(391);
  }
  await page.evaluate(() => window.gallery.close());
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.locator('#gallery').evaluate(el => { el.style.display = 'none'; });
  await page.locator('#gallery').evaluate(el => { el.style.display = ''; el.style.width = '300px'; });
  await expect(page.locator('#gallery .tpg-stage')).toHaveCSS('width', '300px');
});
test('reduced motion updates while open and removes pin', async ({ page }) => {
  await page.evaluate(() => window.gallery.update({ presentation: 'scroll-deal' }));
  await page.evaluate(() => window.gallery.open());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('#gallery')).toHaveAttribute('data-tpg-motion', 'reduced');
  await expect(page.locator('#gallery .pin-spacer')).toHaveCount(0);
  await page.evaluate(() => window.gallery.close()); await expect(page.locator('dialog[open]')).toHaveCount(0);
});
test('failure states and original view keep viewer usable', async ({ page }) => {
  await page.route('**/missing.svg', route => route.abort());
  await page.evaluate(() => window.gallery.update({ items: [{ id: 'bad', src: '/missing.svg', alt: 'Unavailable image', fullSrc: '/missing.svg', originalSrc: '/images/scene-1.svg' }] }));
  await page.locator('#gallery .tpg-browse').click();
  await expect(page.locator('dialog[open] .tpg-image-error')).toBeVisible();
  await page.locator('dialog[open] .tpg-fit').click(); await expect(page.locator('dialog[open] .tpg-card')).toHaveClass(/tpg-original/);
  await expect(page.locator('dialog[open] .tpg-image')).toHaveAttribute('src', '/images/scene-1.svg');
  await page.locator('dialog[open] .tpg-close').click(); await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('#gallery .tpg-image')).toHaveAttribute('src', '/images/scene-1.svg');
});
test('destroy restores fallback and cancels async effects', async ({ page }) => {
  await page.evaluate(async () => {
    const root = document.createElement('div'); root.id = 'temporary'; root.innerHTML = '<a href="#">Original fallback</a>'; document.body.append(root);
    for (let i = 0; i < 10; i++) { const g = window.galleryFactory(root, { items: window.sampleItems, presentation: 'scroll-deal' }); g.open(); g.destroy(); g.destroy(); }
  });
  await expect(page.locator('#temporary')).toHaveText('Original fallback');
  await expect(page.locator('dialog')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden');
});
test('React Strict Mode updates and teardown', async ({ page }) => {
  await page.goto('/examples/react/'); await expect(page.locator('.tpg-card')).toHaveCount(6);
  await page.getByLabel('Count').fill('2'); await expect(page.locator('.tpg-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'Open first photo' }).click(); await expect(page.locator('dialog[open]')).toHaveCount(1);
  await page.keyboard.press('Escape'); await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Toggle gallery' }).click(); await expect(page.locator('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Toggle gallery' }).click(); await expect(page.locator('.tpg-card')).toHaveCount(2);
});
test('no overflow on narrow portrait or landscape', async ({ page }) => {
  for (const [width, height] of [[320,568],[390,844],[844,390],[768,1024]]) {
    await page.setViewportSize({ width, height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
test('Save-Data avoids motion chunks and high resolution upgrades', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { configurable: true, value: Object.assign(new EventTarget(), { saveData: true }) }));
  await page.reload(); await page.waitForFunction(() => !!window.gallery);
  await page.evaluate(() => window.gallery.update({ presentation: 'scroll-deal', items: [{ id: 'one', src: '/images/scene-1.svg', fullSrc: '/never-fetch-full.svg', alt: 'Coast' }] }));
  await page.locator('#gallery .tpg-browse').click();
  await expect(page.locator('#gallery')).toHaveAttribute('data-tpg-motion', 'reduced');
  const requests = await page.evaluate(() => performance.getEntriesByType('resource').map(e => e.name));
  expect(requests.some(url => url.includes('never-fetch-full') || /\/motion-[^/]+\.js/.test(url))).toBe(false);
});
test('delayed full-resolution decode never replaces a newer selection', async ({ page }) => {
  let release!: () => void;
  const delay = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/delayed-full.svg', async route => { await delay; await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>' }); });
  await page.evaluate(() => window.gallery.update({ items: [{ id: 'a', src: '/images/scene-1.svg', fullSrc: '/delayed-full.svg', alt: 'First' }, { id: 'b', src: '/images/scene-2.svg', alt: 'Second' }] }));
  await page.evaluate(() => { window.gallery.open('a'); window.gallery.open('b'); });
  release();
  await expect(page.locator('dialog[open] .tpg-image')).toHaveAttribute('src', '/images/scene-2.svg');
});
test('long captions, roving keyboard and reverse navigation', async ({ page }) => {
  await page.evaluate(() => window.gallery.update({ items: window.sampleItems.map(p => ({ ...p, caption: 'A long descriptive caption '.repeat(25) })) }));
  await page.locator('#gallery button.tpg-card[tabindex="0"]').focus(); await page.keyboard.press('End');
  await expect(page.locator('#gallery [data-photo-id="scene-12"]')).toBeFocused();
  await page.keyboard.press('Home'); await expect(page.locator('#gallery [data-photo-id="scene-1"]')).toBeFocused();
  await page.keyboard.press('Enter'); await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog[open]'))).toBe(true);
  await expect(page.locator('dialog[open] .tpg-status')).toContainText('A long descriptive caption');
});
test('SSR markup hydrates without replacement warnings', async ({ page }) => {
  const props = { items: [{ id: 'ssr', src: '/images/scene-1.svg', alt: 'Server-rendered coast' }] };
  const html = renderToString(createElement(PolaroidGallery, props));
  expect(html).toBe(renderToString(createElement(PolaroidGallery, props)));
  expect(renderToString(createElement(PolaroidGallery, { ...props, count: 0 }))).not.toContain('<img');
  const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8'));
  const entry = manifest['examples/react/hydrate.tsx'];
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/hydration-check', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head>${(entry.css ?? []).map((css: string) => `<link rel="stylesheet" href="/${css}">`).join('')}</head><body><div id="hydration-root">${html}</div><script type="module" src="/${entry.file}"></script></body></html>` }));
  await page.goto('/hydration-check'); await expect(page.locator('.tpg-card')).toHaveCount(1);
  expect(errors).toEqual([]);
});
test('viewer swipe pages and teardown restores scroll', async ({ page }) => {
  await page.locator('#gallery .tpg-browse').click();
  await page.locator('dialog[open]').evaluate(el => {
    const start = new Event('touchstart', { bubbles: true }); Object.defineProperty(start, 'touches', { value: [{ clientX: 220, clientY: 150 }] }); el.dispatchEvent(start);
    const end = new Event('touchend', { bubbles: true }); Object.defineProperty(end, 'changedTouches', { value: [{ clientX: 100, clientY: 155 }] }); el.dispatchEvent(end);
  });
  await expect(page.locator('dialog[open] .tpg-status')).toContainText('2 of 12');
  await page.keyboard.press('Escape'); await expect(page.locator('dialog[open]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden');
});
test('pin is continuous and owned spacers are removed after async teardown', async ({ page }) => {
  await page.evaluate(() => window.gallery.update({ presentation: 'scroll-deal', primaryInteractive: false, headerOffset: 20 }));
  await expect(page.locator('#gallery .pin-spacer')).toHaveCount(1);
  const start = await page.locator('#gallery .tpg-stage').evaluate(el => el.getBoundingClientRect().top + scrollY - 20);
  await page.evaluate(y => scrollTo(0, y), start - 2);
  await page.waitForTimeout(100);
  const before = await page.locator('#gallery figure.tpg-card').boundingBox();
  await page.evaluate(y => scrollTo(0, y), start + 2);
  await page.waitForTimeout(100);
  const after = await page.locator('#gallery figure.tpg-card').boundingBox();
  expect(Math.abs(before!.x - after!.x)).toBeLessThan(2);
  expect(Math.abs(before!.y - after!.y)).toBeLessThan(5);
  expect(Math.abs(before!.width - after!.width)).toBeLessThan(2);
  await page.setViewportSize({ width: 600, height: 900 });
  const spacer = page.locator('#gallery .pin-spacer');
  await expect.poll(() => spacer.evaluate(el => { const stage = el.querySelector<HTMLElement>('.tpg-stage')!; return Math.round(parseFloat(getComputedStyle(el).paddingBottom) / stage.clientHeight * 100); })).toBe(85);
  await page.evaluate(() => window.gallery.destroy());
  await expect(page.locator('#gallery .pin-spacer')).toHaveCount(0);
  await page.setViewportSize({ width: 640, height: 480 });
  await expect(page.locator('#gallery .pin-spacer')).toHaveCount(0);
});
