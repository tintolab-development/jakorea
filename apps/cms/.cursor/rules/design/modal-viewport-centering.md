---
priority: high
always_include: true
category: design
---

# Modal viewport centering (CMS)

## Rule

**All modals must be centered relative to the browser viewport (the full visible window), not relative to the main content column beside the sidebar.**

Dialogs must not appear “centered” only within the padded content area or the main layout region to the right of the sidebar. Horizontal and vertical alignment must use the **full screen** as the reference.

## Rationale

The CMS shell uses a fixed sidebar and a scrollable main region (`layout-content`). Flex-only centering or default Ant Design positioning can visually align modals to the main column or drift slightly when `body`/`html` use `min-width`, scrollbars, or nested layout constraints. Users expect overlays to sit in the **center of the entire application window**.

## Implementation guidance

1. **Portal target** — `TealHeaderModal` (and therefore `ContentModal`) sets **`getContainer={() => document.body}`** on Ant Design `Modal` so the overlay is never mounted under a layout/app wrapper where `position: fixed` would be resolved against the wrong ancestor. Prefer this pattern for other modal wrappers unless there is a documented exception.

2. **Overlay (`ant-modal-wrap`)** — Ensure the wrap covers the viewport: e.g. `position: fixed; inset: 0; width: 100%; margin: 0` where layout or legacy CSS might shrink or offset it.

3. **Dialog box (`.ant-modal`)** — When flex centering on the wrap is not enough, anchor the dialog to the viewport explicitly, e.g. `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%)` (with `max-width` / `width` as per design), scoped to that modal’s class to avoid breaking other dialogs.

4. **Stacked modals** — Higher `zIndex` modals must still use the same viewport-centered rule; do not offset based on the underlying page region.

5. **Colocated CSS** — Put viewport-centering overrides in the feature’s colocated `.css` next to the modal component (e.g. `notice-delete-confirm-modal.css`), not global one-off hacks, unless promoting a shared pattern into `shared/ui`.

## Related components

- Prefer **`ContentModal`** for standard content dialogs; it builds on **`TealHeaderModal`**.
- Full-page / `teal-header-modal--full` layouts follow their own rules; this document applies to **standard centered overlays**.

## References in repo

- Example fixes: `notice-register-modal.css`, `notice-delete-confirm-modal.css` (viewport wrap + dialog positioning).
