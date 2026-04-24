# Dashboard widget reorder — behavior & UX notes

## Current behavior (Zustand + persist)

- Store: `orderByRole` (`string[]`), `widthByRole` (`Record<id, 12 | 24>` — 12 = 50%, 24 = 100%).  
- `getOrderedIds(role, defaultIds)` resets if saved ids don’t match default set.  
- On drag end: `arrayMove` → `setOrderedIds`; optionally `setWidgetWidth` for 50/50 splits.  
- Persist key `dashboard-widget-order`.  
- No separate “reorder API” — grid re-lays out from state.

Flow: `handleDragEnd` → `newIndex` from `over` or pointer vs slot rects → `setOrderedIds` → optional width updates → persist → re-render.

## UX improvements (recommended)

1. **Toast** after order/width change: e.g. “Widget layout saved” — once per drop.  
2. **Motion** — align drop animation and slot transition durations; honor `prefers-reduced-motion`.  
3. **Drag overlay** — slight scale (e.g. 1.02) or stronger shadow while dragging.

## Dev checklist

- [ ] Toast only when order or width actually changes  
- [ ] `prefers-reduced-motion` reduces or disables transitions  
- [ ] Overlay affordance for active drag  
- [ ] Regression: 50% split, empty slot drop, drop on another widget  

**Last updated:** 2026-04-21
