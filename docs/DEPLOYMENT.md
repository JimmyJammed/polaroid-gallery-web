# Deployment and integration

npm run build produces the static demonstration in dist/ and the library build in dist/library/. A normal application imports the packed library into its own build. The component requires no server, account, telemetry service, or vendor endpoint.

npm run preview serves the built demo locally. Deploy a built application to your chosen static host using its normal build process. Do not expose the source ZIP, artifacts/, .package-staging/, or private source maps. A public marketing deployment should omit dist/library/ because it contains library distribution files rather than demo runtime assets.

The examples use root-relative image URLs. If hosting below a path prefix, configure Vite base and adjust the image URLs to that prefix or use imported asset URLs.

Use Node 22.18+ for the build tools. The browser runtime uses native dialog, inert, ResizeObserver, and IntersectionObserver. Browser coverage is documented in VALIDATION.md; physical-device verification is recorded separately from emulation.
