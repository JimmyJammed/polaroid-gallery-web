# From a personal photo wall to a reusable component

## Separate the experience from its host

The original wall combined photo selection, site-specific layout and transitions.
The extracted library accepts photo records and presentation options. The website
adapter retains its photo manifest, sampling policy and portrait selection; the
component owns the gallery subtree and interaction lifecycle.

The demo and homepage use the same versioned archive. This exercises reuse directly
without inventing an empty shared package in the public showcase repository.

## Preserve identity through motion

Stable IDs connect selection, card geometry and viewer state. A card travels from
its pile into the viewer and returns; opening, paging and closing are explicit
states whose outstanding work can be cancelled. Outer layout transforms and inner
hover transforms have different owners.

A native dialog supplies modal semantics. The browse entry is available before
scroll dealing completes, so animation progress does not define what can be browsed.
The decorative primary is separate from the collection's identity and count.

## Different consumers, one package

The TypeScript core owns an isolated subtree and exposes update/open/close/destroy.
The React adapter keeps its container and static fallback under React ownership.
The website builds from a checked-in, checksummed archive; it does not need access
to the private product checkout or a private npm registry.

Commercial source remains separately maintained. Public installation and source
licensing can be revisited deliberately; adding a showcase does not open-source it.

## Evidence boundaries

The inherited draft contains validation records for its library, examples and
customer packaging. The integration branch rechecks the archive, builds the current
website, and verifies the demo route. Broader motion profiling, physical touch
hardware and assistive-technology testing are separate release-review work.
