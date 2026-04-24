# Dashboard widgets — drop on right of 100% row → 50% / 50%

## Goal

When a resizable widget is **100%** wide and another widget is dropped on its **right**, both become **50%** on one row: existing → left 50%, dropped → right 50%. Persist in `widthByRole` / grid span (12+12 in a 24-col grid).

## Acceptance

- With widget A at 100%, dragging B onto A’s right yields A left 50%, B right 50%, same row.  
- Survives refresh if persistence is enabled.

## Hit testing (implementation summary)

- **Slot rects:** `[data-dashboard-slot-id]` → `getBoundingClientRect()`.  
- **Pointer:** start from `activatorEvent`, add `delta` through `onDragMove` for drop position.

### When `over` is a widget

- Dropping on a **100%** widget: use **full rect** of that widget. If policy requires right-half only for split, follow current code (original doc: right half triggers split + insert right).

### When `over` is empty (row-first)

1. Exclude the dragging slot from rects.  
2. Group slots into **rows** by vertical overlap (~8px).  
3. Find row by `y`; inside row, insert by x vs slot midpoints / row ends / gutters.  
4. If y matches no row, fall back to nearest slot (vertical distance weighted 2×).

### When split applies

- Dropping onto a 100% widget’s **right half**, or inserting **after** a 100% widget in a row when pointer is in the “empty right” zone → set both widgets to 50%.

See `dashboard-widget-reorder-ux.md` for store updates.

**Last updated:** 2026-04-21
