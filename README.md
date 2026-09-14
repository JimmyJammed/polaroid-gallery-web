# Polaroid Gallery — Animated Web UI Component

[![platform: Web](https://img.shields.io/badge/platform-Web-2563eb)](docs/GETTING_STARTED.md)
[![language: TypeScript](https://img.shields.io/badge/language-TypeScript-3178c6?logo=typescript&logoColor=white)](package.json)
[![integration: React adapter](https://img.shields.io/badge/integration-React%20adapter-149eca?logo=react&logoColor=white)](docs/API.md)
[![Package version](https://img.shields.io/github/package-json/v/JimmyJammed/polaroid-gallery-web/main?label=package&color=blue)](package.json)
[![Node: 22.18+](https://img.shields.io/badge/Node-22.18%2B-339933?logo=nodedotjs&logoColor=white)](package.json)
[![license: source-available](https://img.shields.io/badge/license-source--available-a16207)](LICENSE.md)
[![demo: view live](https://img.shields.io/badge/demo-view%20live-2563eb)](https://hickman.biz/portfolio/tactile-photo-gallery)

[![unit tests: 8 passed (local)](https://img.shields.io/badge/unit%20tests-8%20passed%20%28local%29-2e7d32)](https://github.com/JimmyJammed/polaroid-gallery-web/blob/96672178d6b2509efb680d9963b5e532b35b0b1d/docs/VALIDATION.md)
[![UI tests: 64 passed (local)](https://img.shields.io/badge/UI%20tests-64%20passed%20%28local%29-2e7d32)](https://github.com/JimmyJammed/polaroid-gallery-web/blob/96672178d6b2509efb680d9963b5e532b35b0b1d/docs/VALIDATION.md)
[![build: verified locally](https://img.shields.io/badge/build-verified%20locally-2e7d32)](https://github.com/JimmyJammed/polaroid-gallery-web/blob/96672178d6b2509efb680d9963b5e532b35b0b1d/docs/VALIDATION.md)

Test and build badges record local verification on **2026-09-14**, not live CI status. Click them for scope and results; the package badge reads `package.json`, not an npm release.

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
