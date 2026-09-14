# Polaroid Gallery — Animated Web UI Component

Framework-neutral TypeScript image gallery with GSAP transitions, presets, keyboard navigation, and an optional React adapter.

**Source-available · Experimental · Web** · [Live demo](https://hickman.biz/portfolio/tactile-photo-gallery)

![Desktop preview](previews/demo-desktop.png)

## Run locally

Use Node 22.18 or newer and npm.

```sh
git clone https://github.com/JimmyJammed/polaroid-gallery-web.git
cd polaroid-gallery-web
npm ci
npm run dev
```

Open the local URL printed by Vite. Run `npm run build` to generate `dist/`, then `npm run preview` to inspect it. No private registry, sibling checkout, or secrets are required.

## Integration example

After `npm run pack:library`, install the generated archive in your application with `npm install ./vendor/tactile-photo-gallery-1.1.1.tgz`.

```ts
import { createPolaroidGallery } from 'tactile-photo-gallery';
import 'tactile-photo-gallery/styles.css';
const gallery = createPolaroidGallery(document.querySelector('#photos')!, {
  items: [{ id: 'coast', src: '/coast.webp', alt: 'Rocky coast at dawn' }],
});
// Call when your view unmounts:
gallery.destroy();
```

## Documentation

- [Accessibility](docs/ACCESSIBILITY.md)
- [Api](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Case Study](docs/CASE_STUDY.md)
- [Customization](docs/CUSTOMIZATION.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Getting Started](docs/GETTING_STARTED.md)
- [Migration](docs/MIGRATION.md)
- [Product](docs/PRODUCT.md)
- [Releases](docs/RELEASES.md)
- [Testing](docs/TESTING.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Validation](docs/VALIDATION.md)

## License and distribution

This is an authorized distribution source for the Falcon Forged Digital Product License. Downloading here grants the existing license rights, including personal and commercial end-product use; no purchase is required. Redistribution as a competing template or component kit remains restricted. This is source-available, not open-source software.

Created by Jimmy Hickman. Copyright Falcon Forged Ventures LLC. [License](LICENSE.md) · [License summary](LICENSE-SUMMARY.md) · [Third-party and asset notices](THIRD_PARTY_LICENSES.md). No public npm publication or stable release is implied.
