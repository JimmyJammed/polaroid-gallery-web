# Customization

Use src/demo.ts as a runnable vanilla integration and examples/react/main.tsx as a runnable React integration. Replace the sample items and keep the original image files in your own application's public directory or image CDN.

Presets are exported from tactile-photo-gallery/presets. Spread a preset first, then apply your overrides. Updating preset alone changes theme; spreading the preset also changes its motion and selection defaults.

```ts
gallery.update({ ...presets.portfolio, primaryId: 'cover', count: 'auto' });
```

Set these CSS variables on the gallery root: --tpg-bg, --tpg-ink, --tpg-paper, --tpg-accent, --tpg-height, --tpg-caption-font. The viewer inherits paper and caption-font values when configuration is applied. Call update({}) after changing those root theme tokens while mounted.

Portfolio uses a decorative larger primary and an asymmetric desktop scroll fill. Phone stages use a shorter fill/hold run. Scrapbook and Editorial are immediately browsable. The optional originalSrc adds a View original button with contained aspect ratio; it does not add zoom or panning.

Provide concise captions. Longer text is preserved in the viewer status and can scroll there. Source images never need EXIF dates or a particular filename convention.
