# Migration validation — 2026-09-14

Local Node 26.7.0, npm 11.19.0. Extracted standalone version 1.1.1. `npm ci`, lint, typecheck, unit tests, production build and product verification passed. 8 unit tests passed. Clean vanilla and React packed-library consumers passed build, browser, declaration and SSR checks. All 64 browser cases passed across Chromium, Firefox, WebKit and emulated iPhone.

No physical-device or assistive-technology certification is claimed. Historical notes in other documents are not new migration results.

Fresh public Git clone installation, build and product verification passed. The legacy packaging wrapper also exported and validated a clean standalone ZIP. All 15 runtime/declaration files matched the website’s existing 1.1.1 artifact; its 32 browser integration checks passed.

## README badge maintenance

The package-version badge reads the main branch package.json. Platform, integration and Node badges describe declared support, not device certification. Test and build badges are dated local snapshots linked to the verification revision. When implementation or dependencies change, rerun relevant checks and update the counts, date and evidence links together; otherwise mark the snapshots as historical. Do not add npm, coverage, uptime or CI-passing badges without the corresponding publication, measured coverage, monitor or workflow. Badge rendering uses [Shields.io](https://shields.io/badges).
