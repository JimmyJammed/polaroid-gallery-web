# Releases and demo rollout

This migration does not declare a stable release or publish to npm. Preserve package names and explicit versions. Run local checks from a fresh clone before tagging; do not overwrite a released archive. Record SHA-256 for artifacts, test a consuming app, then update its versioned dependency. Retain the preceding artifact and deployment for rollback.

The existing hickman.biz demo route stays unchanged. Build with `npm run build`; the deployable output is `dist/`. The website host continues to own routing. Do not change DNS or enable contact sending as part of migration. For a subdirectory deployment, use Vite base-path support and verify asset URLs against that prefix before promoting.
