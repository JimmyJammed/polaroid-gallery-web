# Accessibility and motion

Browse photos is visible before the reveal and opens the complete selected interactive collection. Undealt cards are inert and absent from focus navigation; they are always available through Browse photos. A decorative primary is an image, not a button that promises an unavailable action.

The pile uses one roving card tab stop. Left/Right move between images, Home/End go to the endpoints. Keyboard interaction reveals the collection. Native dialog provides background inertness. Tab cycles through viewer controls; Escape dismisses from the beginning of opening. Focus returns to the initiating control where possible, otherwise Browse photos.

The viewer supports Left/Right and horizontal swipe navigation. RTL reverses left/right navigation. Captions and position are announced politely. Swipe is scoped to the viewer; the gallery does not intercept page scrolling.

Reduced motion and Save-Data expose the static complete selection without scroll pinning. A preference change while mounted reconciles the state. Save-Data avoids speculative high-resolution upgrades. The library does not override the host document's global motion flags.

Supply truthful alt descriptions. The examples contain static links before enhancement; React renders a linked-image fallback on the server. For vanilla integrations, put equivalent static content in the root before calling the factory. It is restored on destroy.
