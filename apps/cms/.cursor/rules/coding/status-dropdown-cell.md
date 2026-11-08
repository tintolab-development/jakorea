---
priority: high
always_include: false
category: coding
globs: ["**/shared/components/status-tag*.tsx", "**/shared/components/status-tag*.css", "**/shared/lib/status-tag-specs.ts", "**/shared/components/status-dropdown-cell*.tsx", "**/shared/components/status-dropdown-cell*.css", "**/shared/components/program-lifecycle-status*.tsx", "**/*program-list*.tsx", "**/recruitment-status-widget*", "**/settlement-management/payment-order-*-status-detail-fullpage-modal.tsx", "**/program-managers-tab.tsx", "**/school-detail-fullpage-view.tsx", "**/participating-instructor-fullpage-view.tsx", "**/participating-institutions-section.css", "**/program-status-participating-shared.css"]
---

# 상태·역할 태그 + `StatusDropdownCell`

상태·역할·권한·평가 같은 **값 태그**는 공통 `StatusTag` 하나만 쓴다. 테이블·상세·폼 어디서든 같은 크기·폰트다.

## 절대 규칙

1. **값별 색은 prop으로만** — `tone`(프리셋) 또는 `accentColor`. 화면 CSS로 태그 색을 지정하지 않는다.
2. **덮어쓰기 CSS 금지** — 화면/feature CSS에서 `.status-tag`, `.status-dropdown-cell__*`, 태그용 도메인 클래스의 크기·색·폰트·패딩을 지정하지 않는다. `!important`로 맞추는 것도 금지.
3. **크기는 공통 고정** — 정본은 `shared/components/status-tag.css`.
   - 높이 32px · 최소 너비 100px · 최대 너비 없음(텍스트 길이에 따라 늘어남)
   - padding 6px 10px · gap 4px · 12px / 600 / line-height 110% · radius 6px
4. `StatusTag`는 `className`·`style`을 받지 않는다. 새 색이 필요하면 `status-tag.css`에 tone 프리셋을 추가하거나 `accentColor`를 쓴다.

## 구성

| 파일 | 역할 |
|---|---|
| `shared/components/status-tag.tsx` / `.css` | 공통 태그 (`label`, `tone`, `accentColor`, `mutedLabel`) |
| `shared/lib/status-tag-specs.ts` | 값 → `{ label, tone | accentColor }` 매핑 (`getXxxTag`) |
| `shared/components/status-dropdown-cell.tsx` / `.css` | 태그 클릭 → 드롭다운 변경. 태그는 셀이 직접 그린다 |
| `shared/components/editable-status-badge.tsx` | `StatusTag` 별칭(기존 호출 호환) |

tone 프리셋: `blue` · `gray` · `green` · `greenOverlay` · `red` · `orange` · `purple` · `pink`.

## 사용법

```tsx
import { StatusDropdownCell, STATUS_DROPDOWN_CELL_CLASSNAME } from '@/shared/components/status-dropdown-cell'
import { getInstructorRoleTag } from '@/shared/lib/status-tag-specs'

<StatusDropdownCell
  status={record.role}
  statusOptions={ROLE_ORDER}
  getTag={getInstructorRoleTag}
  isItemDisabled={(cur, opt) => cur === opt}
  onChange={next => save(record.id, next)}
  isOpen={openId === record.id}
  onOpenChange={open => setOpenId(open ? record.id : null)}
/>

// 읽기 전용도 같은 태그
<StatusTag {...getInstructorRoleTag(role)} />
```

- 테이블 열에는 `STATUS_DROPDOWN_CELL_CLASSNAME`만 지정한다(td 상하 패딩 0).
- 그룹 구분 여백은 `isGroupStart`.
- 트리거는 닫힘·열림 박스 크기가 같아(1px 테두리 + padding 7px) 열 때 레이아웃이 밀리지 않는다. 별도 셸·너비 고정 불필요.
- 패널은 트리거 너비 이상, 옵션 태그는 패널 폭에 맞춰 정렬된다.

## 금지 (이전 방식)

- `renderBadge`로 화면별 배지 컴포넌트 주입
- `tagLayout`(`tag100`/`tag160`/`paymentOrderLine`), `style={{ width }}` 로 너비 지정
- `STATUS_DROPDOWN_CELL_TAG_100/160/INLINE_TAG100/PAYMENT_ORDER_LINE_*` 클래스
- feature CSS에서 `status-dropdown-cell__*` 선택자 사용

**Last updated:** 2026-11-08
