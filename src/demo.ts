import { createPolaroidGallery } from './index.ts';
import { presets } from './presets.ts';
import type { GalleryOptions } from './types.ts';
import './styles.css';
import './demo.css';
const names = ['The coast at dawn', 'Desert afternoon', 'Blue mountain lake', 'A quiet harbor', 'Moon over the dunes', 'The green valley', 'Island sunset', 'Alpine morning', 'A summer sky', 'The far shore', 'Night in the hills', 'Homeward'];
export const sampleItems = names.map((alt, i) => ({ id: `scene-${i + 1}`, src: `/images/scene-${i + 1}.svg`, originalSrc: `/images/scene-${i + 1}.svg`, alt, caption: alt }));
const host = document.querySelector<HTMLElement>('#gallery')!;
const count = document.querySelector<HTMLInputElement>('#count')!;
const primary = document.querySelector<HTMLSelectElement>('#primary')!;
const preset = document.querySelector<HTMLSelectElement>('#preset')!;
const seed = document.querySelector<HTMLInputElement>('#seed')!;
const motion = document.querySelector<HTMLSelectElement>('#motion')!;
const code = document.querySelector<HTMLElement>('#usage')!;
sampleItems.forEach(p => { const o = document.createElement('option'); o.value = p.id; o.textContent = p.alt; primary.append(o); });
function config(): GalleryOptions {
  return { ...presets[preset.value as keyof typeof presets], items: sampleItems, count: Number(count.value), primaryId: primary.value || 'scene-1', seed: Number(seed.value), motion: motion.value as 'auto' | 'reduced' };
}
const gallery = createPolaroidGallery(host, config());
const small = createPolaroidGallery(document.querySelector<HTMLElement>('#small-gallery')!, { ...presets.editorial, items: sampleItems.slice(0, 3), seed: 16 });
function sync() {
  document.querySelector('output')!.value = count.value;
  gallery.update(config());
  const { items: _items, ...options } = config();
  code.textContent = `import { createPolaroidGallery } from 'tactile-photo-gallery';\nimport 'tactile-photo-gallery/styles.css';\n\nconst gallery = createPolaroidGallery(root, {\n  items: yourPhotos,\n${JSON.stringify(options, null, 2).slice(2, -2).split('\n').map(l => `  ${l}`).join('\n')}\n});`;
}
for (const input of [count, primary, preset, seed, motion]) input.addEventListener('change', sync);
sync();
document.querySelector('#copy')!.addEventListener('click', async e => {
  try { await navigator.clipboard.writeText(code.textContent ?? ''); (e.target as HTMLElement).textContent = 'Copied'; }
  catch { (e.target as HTMLElement).textContent = 'Select and copy the code below'; }
});
// The harness is available only in development/test builds and never in the library.
if (import.meta.env.DEV || location.hostname === '127.0.0.1' || location.hostname === 'localhost') {
  Object.assign(window, { gallery, smallGallery: small, galleryFactory: createPolaroidGallery, sampleItems });
}
