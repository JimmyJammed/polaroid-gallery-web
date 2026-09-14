# Changelog

## [1.1.1] — standalone source snapshot, 2026-09-14

Migrates the current 1.1.1 implementation, including responsive grid presentation, into the public source-available repository. Preserves the existing library exports and website runtime. This entry records the current snapshot; no stable release or npm publication is declared.

## Library [1.0.1] — 2026-09-14

Skip redundant reveal renders and tabindex writes while preserving focus and loading
changes. Layout/options changes invalidate the cache. Package README uses the actual
archive version. Draft library update; this does not publish a storefront release.

Validation: 5 model tests and all 64 browser tests pass. Website optical rendering
was optimized separately to use a frozen bounded backdrop.

## [1.0.0]

Draft release. Configurable image count and primary; three presets; native modal viewer; same-card motion; keyboard/swipe navigation; original-image option; responsive scroll deal; live updates; React adapter; scoped CSS; source ZIP and library packaging.

Physical iOS and Android checks remain a release-review requirement unless recorded as completed in docs/VALIDATION.md.
