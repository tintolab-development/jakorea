---
priority: high
always_include: false
category: tables
---

# Ant Design `Table` implementation (CMS)

**공유 스펙 (CMS·Admin):** [cms-admin-ui/cms-data-table](../../../../.cursor/rules/cms-admin-ui/cms-data-table.mdc) · [table-th](../../../../.cursor/rules/cms-admin-ui/table-th.mdc)

**See also:** [UI principles — filters](../design/ui-principles.md), [table td divider](../design/table-td-divider.mdc), [table management](./table-management.md), [Ant Design usage](../libraries/ant-design-usage.md), [status dropdown cell](../coding/status-dropdown-cell.md).

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

Use `rowSelection` when bulk actions exist. Selection column width follows `--table-selection-column-width` (60px default; 공유 정렬 시 68px 패턴은 공유 룰 참고). Align overrides only when a spec requires it.

---

## Styling (typical CMS list)

- **신규·정렬:** 공유 룰 — th **54px** 패턴 · `var(--BG-header)` ([cms-data-table](../../../../.cursor/rules/cms-admin-ui/cms-data-table.mdc)).  
- 레거시 화면의 ~57px / `#EDF0F2` 단독 표기는 점진 이관.  
- Body cells: middle vertical align; zebra/hover per global table CSS if applicable.  
- Avoid horizontal overflow: fixed widths + `scroll={{ x: true }}` when many columns.

### Disabled row (활동 포기 등)

Non-interactive tbody rows use shared **`cms-data-table__row--disabled`**:

| Item | Detail |
|------|--------|
| Constant | `CMS_DATA_TABLE_ROW_DISABLED_CLASS` (`@/shared/constants/table`) |
| CSS | `shared/ui/cms-data-table.css` (global via `index.css`) |
| Apply | `rowClassName` or `onRow({ className })` on Ant `Table` |
| Effect | Cell `pointer-events: none`; each `td::after` overlay `rgba(255,255,255,0.55)` (not `tr::after` — breaks Ant Table cols); hover stays white |
| Accent text | `.cms-data-table__cell-accent--danger` on status label (e.g. 활동 포기) |
| `clickable-table` | Exclude disabled rows from mint hover: `:not(.cms-data-table__row--disabled)` |

**Examples:** UJAT 1차 서류 합격자 면접일 배정 현황, 참여 봉사자 · 교육 배정 및 진행 현황 (배정 학급 활동 포기 행).

(Exact pixel specs for a feature belong in that feature’s design doc—keep this file as **patterns**, not a full mock.)

---

## Do / Don’t

- **Do** keep filter apply behaviour consistent with [UI principles](../design/ui-principles.md) when the screen uses “apply filters” UX.  
- **Don’t** hardcode one-off column widths that fight the shared table CSS without reason.

---

**Last updated:** 2026-08-06
