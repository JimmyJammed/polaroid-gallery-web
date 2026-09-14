import { mkdtempSync, writeFileSync, rmSync, cpSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from 'node:http';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
async function checkBrowser(work) {
  const server = createServer((req, res) => {
    const path = join(work, 'dist', req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    try { res.setHeader('Content-Type', path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : 'text/html'); res.end(readFileSync(path)); }
    catch { res.statusCode = 404; res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForSelector('.tpg-card'); assert.equal(await page.locator('.tpg-card').count(), 2);
    await page.locator('.tpg-browse').click(); await page.waitForSelector('dialog[open] .tpg-held');
    assert.match(await page.locator('dialog[open] .tpg-status').textContent(), /1 of 2/);
    await page.keyboard.press('Escape'); await page.waitForSelector('dialog[open]', {state:'detached'});
    assert.deepEqual(errors, []);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
execFileSync('npm', ['run', 'pack:library'], { stdio: 'inherit' });
const base = mkdtempSync(join(tmpdir(), 'tactile-consumers-'));
const items = JSON.stringify(['one', 'two'].map(id => ({id,src:'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2210%22/%3E',alt:id})));
try {
  for (const framework of ['vanilla', 'react']) {
    const work = join(base, framework); mkdirSync(work);
    cpSync(resolve(`artifacts/tactile-photo-gallery-${version}.tgz`), join(work, 'gallery.tgz'));
    const run = (command, args) => execFileSync(command, args, { cwd: work, stdio: 'inherit' });
    writeFileSync(join(work, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies: { 'tactile-photo-gallery': 'file:./gallery.tgz', vite: '6.4.3', typescript: '5.9.3', ...(framework === 'react' ? {react:'19.1.1','react-dom':'19.1.1','@types/react':'19.1.16'} : {}) } }));
    writeFileSync(join(work, 'index.html'), '<div id="gallery"></div><script type="module" src="/main.js"></script>');
    writeFileSync(join(work, 'main.js'), framework === 'vanilla'
      ? `import {createPolaroidGallery} from 'tactile-photo-gallery'; import 'tactile-photo-gallery/styles.css'; import {presets} from 'tactile-photo-gallery/presets'; createPolaroidGallery(document.querySelector('#gallery'), {...presets.scrapbook, items:${items}});`
      : `import React from 'react'; import {createRoot} from 'react-dom/client'; import {PolaroidGallery} from 'tactile-photo-gallery/react'; import 'tactile-photo-gallery/styles.css'; createRoot(document.querySelector('#gallery')).render(React.createElement(PolaroidGallery,{items:${items}}));`);
    run('npm', ['install', '--no-audit', '--no-fund']);
    if (framework === 'vanilla') assert.equal(existsSync(join(work, 'node_modules/react')), false, 'Core must not require React');
    const pkg = JSON.parse(readFileSync(join(work, 'node_modules/tactile-photo-gallery/package.json'), 'utf8'));
    assert.deepEqual(Object.keys(pkg.exports).sort(), ['.','./react','./scroll','./presets','./styles.css'].sort());
    for (const forbidden of ['public','examples','product.json','src']) assert.equal(existsSync(join(work, 'node_modules/tactile-photo-gallery', forbidden)), false);
    run('npx', ['vite', 'build']); await checkBrowser(work);
    writeFileSync(join(work, 'types.ts'), `import { createPolaroidGallery, type GalleryOptions } from 'tactile-photo-gallery'; const o: GalleryOptions={items:[],count:'auto'}; const g=createPolaroidGallery(document.createElement('div'),o); g.open(); ${framework === 'react' ? "import {PolaroidGallery} from 'tactile-photo-gallery/react'; void PolaroidGallery;" : ''}`);
    run('npx', ['tsc', '--noEmit', '--strict', '--skipLibCheck', '--module', 'nodenext', '--moduleResolution', 'nodenext', '--target', 'es2022', 'types.ts']);
    if (framework === 'react') {
      writeFileSync(join(work, 'ssr.mjs'), `import assert from 'node:assert/strict'; import React from 'react'; import {renderToString} from 'react-dom/server'; import {PolaroidGallery} from 'tactile-photo-gallery/react'; const props={items:${items}}; const a=renderToString(React.createElement(PolaroidGallery,props)); assert.match(a,/one/); assert.equal(a,renderToString(React.createElement(PolaroidGallery,props)));`);
      run('node', ['ssr.mjs']);
    }
    console.log(`Clean ${framework} packed-library build, browser and declarations passed.`);
  }
} finally { rmSync(base, { recursive: true, force: true }); }
