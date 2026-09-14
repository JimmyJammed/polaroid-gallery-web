# Getting started

1. Install Node 22.18+ and clone this repository.
2. Run npm ci, then npm run dev.
3. Explore the configurator and /examples/react/.
4. Replace the sample items with your image URLs and meaningful alt descriptions.

To use the library in a different application, run npm run pack:library and copy artifacts/tactile-photo-gallery-1.1.1.tgz into that application's vendor directory. Run npm install ./vendor/tactile-photo-gallery-1.1.1.tgz.

```ts
import { createPolaroidGallery } from 'tactile-photo-gallery';
import 'tactile-photo-gallery/styles.css';
const gallery = createPolaroidGallery(document.querySelector('#photos')!, {
  items: [{ id: 'coast', src: '/photos/coast.webp', alt: 'A quiet rocky coast', caption: 'The coast at dawn' }],
  count: 1,
});
// On route teardown:
gallery.destroy();
```

The gallery root must have a measurable width. The default gallery height comes from --tpg-height. A hidden root is measured when it becomes visible.

React imports PolaroidGallery from tactile-photo-gallery/react. Import the same stylesheet once, pass items and options as props, and use its ref for open/close. The adapter owns its inner DOM; do not render children into that subtree.

The pack command also emits a SHA-256 file beside the tarball. From artifacts/, run `shasum -a 256 -c tactile-photo-gallery-1.1.1.tgz.sha256` (macOS) or `sha256sum -c tactile-photo-gallery-1.1.1.tgz.sha256` (Linux) to verify it.
