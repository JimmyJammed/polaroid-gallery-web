# Public API

## Items

Each PhotoItem requires a unique nonempty id, src, and alt. Optional fields: fullSrc (a larger framed image), originalSrc (the uncropped source), caption, width, height, and objectPosition (CSS object-position). Width and height are metadata reserved for consumers; square framing does not change based on them. Images may be local or remote. The core has no image service dependency.

## Configuration

- items: ordered collection. Immutable inputs are not modified.
- count: nonnegative integer or auto. Omitted means all supplied items. Explicit values clamp to available images. Zero shows the empty state. Count includes the primary.
- primaryId: forced into the selection first; absent or missing uses the first supplied item. Missing explicit IDs warn in development.
- primaryInteractive: true by default; false renders the primary as a figure and excludes it from viewer navigation.
- primaryScale: positive scale relative to ordinary cards (default 1.5).
- primaryRotation: degrees (default -2.5).
- primaryPosition: normalized x/y fractions (default center).
- seed: finite number (default 42). Stable ID hashing defines scatter. Reordering the input does not randomize individual positions.
- selection: ordered (default) or sample (deterministic with seed).
- presentation: scatter (default) or scroll-deal. ScrollTrigger is loaded only for scroll-deal with enhanced motion and at least two items.
- preset: scrapbook (default), portfolio, or editorial. Use the exported presets object to apply complete preset defaults.
- motion: auto (respects system preference) or reduced. Save-Data also selects static presentation.
- autoMax/mobileAutoMax: defaults 100/30. Auto is selected at initialization and explicit updates, not every resize, to preserve collection identity.
- headerOffset: nonnegative header clearance in pixels for pinning (default 0).
- label, browseLabel, emptyLabel: customizable visible/accessibility text for the gallery.
- onOpen/onChange: { id, index, total }, with zero-based index in the selected interactive collection. onClose fires when dismissal completes. Teardown does not emit a synthetic close callback.

## Controller

update(partialOptions) validates before applying. Existing active selection survives if still interactive and selected; otherwise the viewer closes and focuses Browse photos. Event callbacks are replaced with supplied callbacks.

open(id?) opens a selected interactive image, or the first if omitted. Unknown IDs are ignored. Calling open during a transition supersedes that transition. close() is safe while opening; destroy() is idempotent and restores pre-existing root content and releases the modal, scroll lock, listeners, observers, and animation resources.

getState() returns phase, activeId, selectedIds, revealedCount, and motion. It is useful for integrations and tests; do not use it as a per-frame animation subscription.

## React

PolaroidGallery accepts GalleryOptions plus className, and a ref exposing open(id?)/close(). Server rendering includes linked static images. Client enhancement replaces only the core-owned subtree. Effects clean up under Strict Mode and route unmounts.

## Entry points

- tactile-photo-gallery: controller and TypeScript types.
- tactile-photo-gallery/react: React adapter.
- tactile-photo-gallery/presets: preset options.
- tactile-photo-gallery/scroll: lower-level attachScrollDeal for advanced integrations. Normally use presentation instead.
- tactile-photo-gallery/styles.css: scoped styles.

Explicit counts up to 100 are the main supported visual envelope; 250 is a stress-test case, not a recommended mobile composition. There is no virtualization or automatic infinite loading.

### Full grid (library 1.1.0)

Use `presentation: 'grid'` with `count: items.length` and
`primaryInteractive: true` for a complete, upright photo grid. Columns adapt to
container width; stage height grows to fit every row. All prints use equal sizes
and zero rotation, independent of primary scale/position. Viewer and keyboard
browsing follow item order. Grid uses no scroll pinning.
