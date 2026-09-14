# Migration validation — 2026-09-14

Local Node 26.7.0, npm 11.19.0. Extracted standalone version 1.1.1. `npm ci`, lint, typecheck, unit tests, production build and product verification passed. 8 unit tests passed. Clean vanilla and React packed-library consumers passed build, browser, declaration and SSR checks. All 64 browser cases passed across Chromium, Firefox, WebKit and emulated iPhone.

No physical-device or assistive-technology certification is claimed. Historical notes in other documents are not new migration results.

Fresh public Git clone installation, build and product verification passed. The legacy packaging wrapper also exported and validated a clean standalone ZIP. All 15 runtime/declaration files matched the website’s existing 1.1.1 artifact; its 32 browser integration checks passed.
