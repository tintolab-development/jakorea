---
priority: high
always_include: false
category: coding
globs: ["**/shared/components/status-dropdown-cell*.tsx", "**/shared/components/status-dropdown-cell*.css", "**/shared/components/program-lifecycle-status*.tsx", "**/*program-list*.tsx", "**/recruitment-status-widget*", "**/settlement-management/payment-order-*-status-detail-fullpage-modal.tsx", "**/program-managers-tab.tsx", "**/school-detail-fullpage-view.tsx", "**/participating-instructor-fullpage-view.tsx", "**/participating-institutions-section.css", "**/program-status-participating-shared.css"]
---

# `StatusDropdownCell` (editable status in tables)

Use the shared stack for **badge + dropdown to change status** inside Ant `Table` columns.

**See also:** [table-implementation.md](../tables/table-implementation.md), [component-patterns.md](./component-patterns.md).

---

## Building blocks

| Piece | Role |
|-------|------|
| `StatusDropdownCell` | Generic cell: badge, dropdown, loading |
| `ProgramLifecycleStatusCell` | Program lifecycle wrapper |
| `AppStatusBadge` | Badge base |
| `ProgramLifecycleStatusBadge` | Lifecycle labels/colors |

Keep **one** generic cell; inject options/rules via props. Add thin domain wrappers only.

---

## Imports

```tsx
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_132_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_132_HEADER_CLASSNAME,
} from '@/shared/components'
```

---

## Key props (`StatusDropdownCell`)

| Prop | Notes |
|------|--------|
| `status`, `statusOptions` | Current + ordered options |
| `renderBadge` | `(status) => ReactNode` |
| `isItemDisabled` | `(current, option) => boolean` |
| `onChange` | If omitted → read-only badge |
| `isUpdating` | Disable + spinner while saving |
| `isOpen` / `onOpenChange` | Single open dropdown per table (`openId === rowId`) |
| `tagLayout` | `'default'` or `'tag132'` (fixed 132×33 + mint active ring) |

---

## Column wiring

Use **`onCell`** for `td` classes (not only `column.className`), e.g.:

```tsx
onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
```

For **`tag132`**: add `STATUS_DROPDOWN_CELL_TAG_132_CLASSNAME` on body cells and `STATUS_DROPDOWN_CELL_TAG_132_HEADER_CLASSNAME` via `onHeaderCell` on `th`. Column **`width: 150`** matches shared CSS.

Do **not** rebuild raw Ant `Dropdown` for the same pattern—extend `StatusDropdownCell`.

---

## Related CSS

Shared styles live in `status-dropdown-cell.css` (tag layout, mint wrapper). Keep domain-specific badge class names on the badge root as required by design.

---

**Last updated:** 2026-04-21
