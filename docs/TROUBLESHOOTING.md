# Troubleshooting

Empty gallery: check that items is nonempty, count is not zero, and the root has a measurable width. A lone decorative primary intentionally has no viewer action; set primaryInteractive true to browse it.

Image unavailable: inspect the source URL, server response, and content security policy. Larger-image failures preserve the thumbnail. Original view requires originalSrc and a permitted network request.

Unexpected selection: count includes the primary. Default ordering follows the supplied items. Sample selection is deterministic for a seed. Auto selects once per explicit configuration update so resize does not swap images.

Scroll reveal absent: reduced motion and Save-Data deliberately disable it. Check presentation and the count. A failed motion chunk falls back to browsing. Do not mount inside an already pinned container without testing its geometry.

Host header overlap: set headerOffset. Do not apply scale/transform to the page body; coordinate transforms on modal ancestors can invalidate viewport geometry.

React duplicate initialization: use the adapter or call destroy from your effect cleanup. Do not let React reconcile the DOM owned by the imperative controller.

Styles missing: import tactile-photo-gallery/styles.css. Both core and adapter use it.

Build after moving the package: install the library tarball by a relative path or copy source into your own build. There is no dependency on a private repository.
