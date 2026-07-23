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
  STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_HEADER_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_160_HEADER_CLASSNAME,
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
| `tagLayout` | `'default'`, `'tag100'`, `'tag160'`, `'paymentOrderLine'`; 새 도메인은 기본값 우선 |
| `chrome` | `'cell'`(기본·테이블 열) / `'hug'`(폼·상세 인라인 — 패딩 0, 열림 시 가로 밀림 방지) |
| `style` | 도메인별 배지 폭·패널 폭이 필요할 때 generic 크기를 주입 |

---

## Column wiring

Use **`onCell`** for `td` classes (not only `column.className`), e.g.:

```tsx
onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
```

For **`tag100`** (재직·권한·교재배송·서류평가): add `STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME` on body cells and `STATUS_DROPDOWN_CELL_TAG_100_HEADER_CLASSNAME` via `onHeaderCell`. Column **`width: 116`** matches shared CSS (`1 + 7 + 100 + 7 + 1` border-box). Use `EditableStatusBadge` in `renderBadge`.

For a 132×33 badge in a 160px column, use **`tag160`** with `STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME` and `STATUS_DROPDOWN_CELL_TAG_160_HEADER_CLASSNAME`. Do not restore the removed `tag132` option or constants.

**교재명 인라인 tag100**(참여 기관 상세 등):  
`<span className={STATUS_DROPDOWN_CELL_INLINE_TAG100_CLASSNAME}>` + `tagLayout="tag100"`(chrome 기본 `cell`).  
- 셸이 레이아웃 폭을 **항상 116×48**로 예약 → 열림 크롬이 overview 표만 가로로 키우던 회귀 방지.  
- `chrome="hug"`를 교재명에 쓰지 않는다.

폼·상세 **밀착형 인라인**(재직·담당자 평가·후원 상태): **`chrome="hug"`**.  
- 트리거·패널 배지 밀착. 조상은 `min-width: 0` / `overflow: clip` / `width: 100%` 유지.

표·섹션 래퍼는 **`width/max-width: 100%` + `min-width: 0` + `overflow: clip`**.  
풀페이지 모달 `__main`도 **`overflow-x: clip`**. 트리거 `onMouseDown` preventDefault.

새 도메인 상태는 우선 `tagLayout="default"`와 `style`로 크기를 주입한다. `paymentOrderLine`처럼 명확한 공통 계약이 있을 때만 전용 layout을 추가한다.

Do **not** rebuild raw Ant `Dropdown` for the same pattern—extend `StatusDropdownCell`.

---

## Related CSS

Shared styles live in `status-dropdown-cell.css`. Keep domain-specific badge class names on the badge root as required by design.

테이블/상세 래퍼는 StatusDropdown 열림 시 가로 밀림을 막기 위해 **`overflow: clip`**(스크롤포트 없는 클리핑). `overflow: hidden`은 스크롤포트가 되어 scroll-into-view로 UI가 밀릴 수 있다.

---

**Last updated:** 2026-07-23
