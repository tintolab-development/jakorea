---
priority: high
always_include: false
category: tables
---

# Ant Design `Table` implementation (CMS)

**See also:** [UI principles — filters](../design/ui-principles.md), [table management](./table-management.md), [Ant Design usage](../libraries/ant-design-usage.md), [status dropdown cell](../coding/status-dropdown-cell.md).

---

## Defaults

- Prefer Ant Design **`Table`**. Use **`@tanstack/react-table`** when you need its model + URL sync (see [table-management.md](./table-management.md)).  
- Type rows (`ColumnsType<Row>`). Set `rowKey`.  
- Apply **`cms-data-table`** / feature BEM class for shared styling when the page already uses that pattern.

---

## Columns

| Prop | Notes |
|------|--------|
| `width` | Set for stable layout; common values 56–220px |
| `align` | Often `center` for admin lists |
| `ellipsis` | `true` for long text |
| `render` | `value ?? '-'` for optional text; badges/links as needed |

**Index column:** width ~56–72px, centered.  
**Status:** prefer shared badges; editable status → `StatusDropdownCell` / feature-specific cell (see status-dropdown doc).  
**Actions:** `render` only, `key` set, no `dataIndex`.

---

## Selection column

Use `rowSelection` when bulk actions exist. Selection column width follows `--table-selection-column-width` (60px default). Align overrides only when a spec requires it.

---

## Styling (typical CMS list)

- Header row height ~57px, padding `12px 16px`, background `#EDF0F2`, bold label color.  
- Body cells: middle vertical align; zebra/hover per global table CSS if applicable.  
- Avoid horizontal overflow: fixed widths + `scroll={{ x: true }}` when many columns.

(Exact pixel specs for a feature belong in that feature’s design doc—keep this file as **patterns**, not a full mock.)

---

## Do / Don’t

- **Do** keep filter apply behaviour consistent with [UI principles](../design/ui-principles.md) when the screen uses “apply filters” UX.  
- **Don’t** hardcode one-off column widths that fight the shared table CSS without reason.

---

**Last updated:** 2026-04-21
