# Testing

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium firefox webkit
npm run test:browser
npm run pack:library
```

Browser tests cover count boundaries, primary selection, pre-reveal keyboard access, focus containment, interruptions, active updates/removal, resize, reduced motion, failed images, teardown, React Strict Mode, and responsive overflow. Unit tests cover pure selection and layout, including 250-item stress inputs.

Use a fresh clone for final verification. Run the vanilla and React examples from the clone and install the generated tarball in clean consumer applications. Check physical iOS/Android swipe, address-bar resize, keyboard, orientation, and scroll restoration before marking those devices tested. Emulated mobile WebKit is not a physical iPhone test.

`npm run verify:consumers` packs the library, installs it in isolated vanilla and React projects, builds and opens both in Chromium, then checks server rendering and declaration resolution. `npm run verify:release` combines that check with the browser matrix. Set VERIFY_BASE_URL to test an already running production preview; otherwise Playwright builds and starts one.

Long captions can receive keyboard focus in the viewer status area and scroll vertically. Automated swipe tests exercise the viewer's gesture handler; validate native touch delivery on real devices separately.
