import type { GalleryOptions } from './types.ts';
export const presets = {
  portfolio: { preset: 'portfolio', presentation: 'scroll-deal', count: 'auto', primaryInteractive: false, primaryScale: 1.9, mobileAutoMax: 30 },
  scrapbook: { preset: 'scrapbook', presentation: 'scatter', primaryInteractive: true, primaryScale: 1.4 },
  editorial: { preset: 'editorial', presentation: 'scatter', primaryInteractive: true, primaryScale: 1.2, primaryRotation: 0 }
} satisfies Record<string, Partial<GalleryOptions>>;
