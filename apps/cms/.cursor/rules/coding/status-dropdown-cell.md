---
priority: high
always_include: false
category: coding
globs: ["**/shared/components/status-dropdown-cell*.tsx", "**/shared/components/status-dropdown-cell*.css", "**/shared/components/program-lifecycle-status*.tsx", "**/*program-list*.tsx", "**/recruitment-status-widget*", "**/settlement-management/payment-order-*-status-detail-fullpage-modal.tsx", "**/program-managers-tab.tsx", "**/school-detail-fullpage-view.tsx", "**/participating-instructor-fullpage-view.tsx", "**/participating-institutions-section.css", "**/program-status-participating-shared.css"]
---

# 테이블용 상태 드롭다운 셀 (StatusDropdownCell) 아키텍처

테이블에서 **상태 배지 + 클릭 시 드롭다운으로 상태 변경**이 필요한 컬럼은 공통 컴포넌트 체계를 사용합니다. 새 테이블·새 도메인(정산, 신청 등) 추가 시 이 패턴을 따릅니다.

**관련 규칙**: [테이블 구현 컨텍스트](../tables/table-implementation.md), [컴포넌트 패턴](./component-patterns.md)

---

## 1. 구조 요약

| 구분 | 역할 | 위치 |
|------|------|------|
| **StatusDropdownCell** | 공통 셀: 배지 + 드롭다운 UI, 도메인 무관 | `@/shared/components/status-dropdown-cell` |
| **ProgramLifecycleStatusCell** | 프로그램 진행 현황 전용 래퍼 | `@/shared/components/program-lifecycle-status-cell` |
| **AppStatusBadge** | 공통 배지 베이스 (label + modifier class) | `@/shared/components/app-status-badge` |
| **ProgramLifecycleStatusBadge** | 진행 현황 배지 (AppStatusBadge + 라벨/색상) | `@/shared/components/program-lifecycle-status-badge` |

- **배지**: 도메인별로 `AppStatusBadge` 기반 래퍼 하나만 두고, 라벨·모디파이어는 상수/설정에서 가져옴.
- **셀**: `StatusDropdownCell` 1종만 두고, 옵션 목록·비활성 규칙·배지 렌더는 props로 주입. 도메인 전용 셀은 얇은 래퍼로만 추가.

---

## 2. StatusDropdownCell (공통 셀)

여러 테이블·도메인에서 재사용하는 **제네릭** 테이블 셀입니다. 상태 타입 `T`(string), 옵션 목록·비활성 규칙·배지 렌더를 모두 props로 받습니다.

### 2.1 import

```tsx
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  // 활성(민트) 래퍼 + 132×33 태그 열(tag132)일 때만 추가
  STATUS_DROPDOWN_CELL_TAG_132_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_132_HEADER_CLASSNAME,
} from '@/shared/components'
```

### 2.2 Props

| Prop | 타입 | 설명 |
|------|------|------|
| `status` | `T \| null` | 현재 상태. null이면 `emptyPlaceholder` 표시 |
| `statusOptions` | `readonly T[]` | 드롭다운에 표시할 상태 목록(순서 유지) |
| `renderBadge` | `(status: T) => ReactNode` | 각 상태를 배지로 렌더(도메인별 배지 컴포넌트) |
| `isItemDisabled` | `(current, option) => boolean` | 옵션 비활성화 조건(선택 불가 시 true) |
| `getItemClassName` | `(option) => string \| undefined` | 드롭다운 메뉴 항목 className(그룹 구분 여백 등) |
| `onChange` | `(newStatus: T) => void \| Promise<void>` | 상태 변경 시 호출. 없으면 드롭다운 미표시, 배지만 표시 |
| `isUpdating` | `boolean` | 변경 요청 중(트리거 비활성 + "…" 표시) |
| `isOpen` | `boolean` | 드롭다운 열림 여부(테이블에서는 `openDropdownId === rowId`) |
| `onOpenChange` | `(open: boolean) => void` | 드롭다운 열기/닫기(테이블에서는 `setOpenId(open ? rowId : null)`) |
| `emptyPlaceholder` | `ReactNode` | status가 null일 때 표시(기본 `'-'`) |
| `tagLayout` | `'default' \| 'tag132'` | 선택. **아래 §2.4** — 커스텀 폭 태그(132×33) + 활성 래퍼 스펙 |

### 2.3 테이블 컬럼에 적용

- **데이터 셀(td)**에 클래스를 주려면 컬럼 **`onCell`**으로 `className: STATUS_DROPDOWN_CELL_CLASSNAME`을 넘깁니다. (`Column.className`만 쓰면 헤더에만 걸리는 경우가 있어, 신청자 목록·참여기관 테이블과 동일하게 `onCell`을 권장합니다.)

```tsx
{
  title: '모집 신청 현황',
  key: 'lifecycleStatus',
  width: 140,
  align: 'center',
  onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
  render: (_, record) => (
    <ProgramLifecycleStatusCell
      record={record}
      onStatusChange={handleLifecycleStatusChange}
      isUpdating={updatingStatusId === record.id}
      openDropdownId={openStatusDropdownId}
      onOpenDropdownChange={setOpenStatusDropdownId}
    />
  ),
}
```

### 2.4 상태 변경 드롭다운 + **활성(민트) 래퍼 태그** (tag132)

테이블에서 **고정 폭 상태 태그(132×33)** 를 쓰고, 열릴 때 **민트 테두리 래퍼**·**동일 폭 드롭다운 패널**이 필요하면 **반드시** 공통 `StatusDropdownCell`의 **`tagLayout="tag132"`** 를 사용합니다. Ant Design `Dropdown`을 화면마다 새로 조합하지 않습니다.

| 항목 | 규칙 |
|------|------|
| **컴포넌트** | `@/shared/components/status-dropdown-cell`의 `StatusDropdownCell` 단일 구현만 사용 |
| **본문 셀(td)** | `onCell`에 `STATUS_DROPDOWN_CELL_CLASSNAME` + `STATUS_DROPDOWN_CELL_TAG_132_CLASSNAME` (문자열 합치기) |
| **헤더(th)** | `onHeaderCell: () => ({ className: STATUS_DROPDOWN_CELL_TAG_132_HEADER_CLASSNAME })` — **th/td 세로선·폭 정렬**에 필요 |
| **컬럼 width** | **150** (`status-dropdown-cell.css`의 tag132 border-box 스펙과 일치) |
| **셀 안 컴포넌트** | `tagLayout="tag132"` |
| **배지 마크업** | 태그 루트에 도메인 클래스 유지(예: `program-managers-tab__role-badge`, `school-detail-fullpage-view__role-tag`). 치수는 공통 CSS가 tag132일 때 132×33로 맞춤 |

**예시(컬럼 정의 일부)**

```tsx
{
  title: '권한',
  dataIndex: 'role',
  key: 'role',
  width: 150,
  align: 'center',
  onHeaderCell: () => ({ className: STATUS_DROPDOWN_CELL_TAG_132_HEADER_CLASSNAME }),
  onCell: () => ({
    className: `${STATUS_DROPDOWN_CELL_CLASSNAME} ${STATUS_DROPDOWN_CELL_TAG_132_CLASSNAME}`,
  }),
  render: (role, record) => (
    <StatusDropdownCell
      status={role}
      statusOptions={...}
      renderBadge={...}
      onChange={...}
      isOpen={openId === record.id}
      onOpenChange={(open) => setOpenId(open ? record.id : null)}
      tagLayout="tag132"
    />
  ),
}
```

**CSS·레이아웃 (지키기)**

- **td에 `display: flex` 금지** — 테이블 열 폭이 깨져 th와 세로선이 어긋남. 본문은 `table-cell` + 트리거만 `inline-flex`(공통 시트에 정의됨).
- **스코프된 136px 규칙** (`participating-institutions-section`, `school-detail-fullpage-view` 등)을 추가·수정할 때는 **tag132 셀/트리거를 제외**할 것:  
  `td.status-dropdown-cell__cell-status:not(.status-dropdown-cell__cell-status--tag-132)`,  
  `.status-dropdown-cell__status-trigger--open:not(.status-dropdown-cell__status-trigger--tag-132)`  
  (그렇지 않으면 열림 시 트리거가 136px로 강제되어 132 태그 + 패딩이 눌림.)
- **담당자 목록 등 `cms-data-table--fluid`** 테이블은 열 width가 헤더/본문에 같이 먹도록 해당 테이블에 한해 `table-layout: fixed` 오버라이드가 필요할 수 있음(기존 `program-managers-tab` 참고).
- 새 도메인 태그 클래스를 tag132 트리거·메뉴에 쓰면 `status-dropdown-cell.css`의 tag132 블록에 **트리거·오버레이 양쪽** 선택자를 추가해 132×33이 일관되게 적용되게 할 것.

**참고 구현**: `features/program/ui/program-managers-tab.tsx`(권한), `school-detail-fullpage-view.tsx` / `participating-instructor-fullpage-view.tsx`(역할).

---

## 3. 새 테이블에서 사용할 때 (UI shifting 방지)

다른 테이블에 상태 드롭다운 셀을 넣을 때는 아래를 적용합니다.

1. **컬럼 onCell**  
   `onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME })` 지정.

2. **테이블 CSS에 행 높이 고정**  
   드롭다운 열어도 행 높이가 바뀌지 않도록 다음 규칙 추가.

```css
/* 상태 드롭다운 셀 사용 행: 고정 높이 */
.my-table-wrapper .ant-table-tbody > tr:has(td.status-dropdown-cell__cell-status) {
  height: 47px;
  min-height: 47px;
  max-height: 47px;
  overflow: visible;
}

.my-table-wrapper .ant-table-tbody > tr:has(td.status-dropdown-cell__cell-status) > td.status-dropdown-cell__cell-status {
  padding-top: 0;
  padding-bottom: 0;
  overflow: visible;
}

/* 드롭다운 열린 행도 동일 높이 유지 */
.my-table-wrapper .ant-table-tbody > tr:has(td .status-dropdown-cell__status-trigger--open) > td {
  height: 47px !important;
  min-height: 47px !important;
  max-height: 47px !important;
}
```

3. **행 클릭 시 상세 이동 제외**  
   행 클릭으로 상세로 이동하는 테이블이면, 드롭다운 트리거 클릭은 행 클릭으로 전파되지 않도록 합니다.

```tsx
onRow={(record) => ({
  onClick: (event) => {
    const target = event.target as HTMLElement
    if (target.closest('.status-dropdown-cell__status-trigger')) return
    onView(record)
  },
})}
```

---

## 4. 새 도메인(상태 타입) 추가 시

예: 정산 상태, 신청 상태 등 다른 상태를 같은 셀 UI로 쓰고 싶을 때.

### 4.1 배지

- **AppStatusBadge** 기반으로 도메인용 배지 하나 추가.  
  예: `SettlementStatusBadge` → `getSettlementStatusLabel(status)`, modifier `settlement-status-badge--{status}`.
- 배지 스타일은 해당 배지 CSS에서 정의.  
  드롭다운 **안**에서 쓰일 때 색상이 필요하면 `status-dropdown-cell.css`에  
  `.status-dropdown-cell__dropdown-overlay .app-status-badge.도메인배지--상태` 블록을 추가.

### 4.2 셀

- **방법 A**: 해당 테이블/페이지에서 직접 `StatusDropdownCell` 사용.  
  `statusOptions`, `renderBadge`, `isItemDisabled`, `getItemClassName`, `onChange` 등만 넘김.
- **방법 B**: 도메인 전용 래퍼 추가(예: `ProgramLifecycleStatusCell`처럼).  
  상수(순서, 그룹, 비활성 규칙) + 해당 배지만 조합해 `StatusDropdownCell`에 넘기는 얇은 래퍼.

```tsx
// 예: 정산 상태 셀 래퍼
export function SettlementStatusCell({ record, onChange, ... }) {
  return (
    <StatusDropdownCell<SettlementStatus>
      status={record.settlementStatus}
      statusOptions={SETTLEMENT_STATUS_ORDER}
      renderBadge={(s) => <SettlementStatusBadge status={s} />}
      isItemDisabled={(cur, opt) => cur === opt}
      onChange={onChange ? (s) => onChange(record, s) : undefined}
      isOpen={openDropdownId === record.id}
      onOpenChange={(open) => onOpenDropdownChange(open ? record.id : null)}
      ...
    />
  )
}
```

---

## 5. 참고 파일

| 용도 | 파일 |
|------|------|
| 공통 셀 컴포넌트 | `shared/components/status-dropdown-cell.tsx` |
| 공통 셀 스타일 | `shared/components/status-dropdown-cell.css` |
| 프로그램 진행 현황 래퍼 | `shared/components/program-lifecycle-status-cell.tsx` |
| 대시보드 위젯 테이블 | `features/dashboard/ui/recruitment-status-widget.tsx`, `dashboard-widget-table.css` |
| 교육 프로그램 테이블 | `features/program/ui/program-list.tsx` / `program-list.css` |

---

## 6. 체크리스트 (상태 드롭다운 셀 추가 시)

- [ ] 컬럼에 `onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME })` 지정 (또는 동일 효과로 td에 해당 클래스가 확실히 붙는 방식)
- [ ] 테이블 CSS에 `tr:has(td.status-dropdown-cell__cell-status)`, `tr:has(td .status-dropdown-cell__status-trigger--open)` 행 높이 고정 규칙 추가
- [ ] 행 클릭으로 상세 이동 시 `.status-dropdown-cell__status-trigger` 클릭은 제외
- [ ] 새 도메인 배지는 `AppStatusBadge` 기반으로 추가; 필요 시 `status-dropdown-cell.css`에 드롭다운 내 배지 색상 추가
- [ ] 새 도메인 셀은 `StatusDropdownCell` 직접 사용하거나, 동일 패턴의 얇은 래퍼만 추가
- [ ] **활성 래퍼 + 132×33 태그 스펙이면** §2.4: `tagLayout="tag132"`, `TAG_132`/`HEADER` 상수, 컬럼 width **150**, 스코프 CSS에서 136px 규칙은 `:not(--tag-132)` 로 분리

---

## 7. 지급 조서 처리 현황 (정산 관리 · 풀페이지 모달 내 목록)

강사별/프로그램별 **정산 목록** 테이블에서 행 단위로 지급 조서 처리 현황을 바꿀 때는, 풀페이지 모달 **신청자 목록**의 **프로그램 승인 현황** 열과 **같은 배지 계열**을 씁니다.

| 항목 | 규칙 |
|------|------|
| 셀 | `@/shared/components/status-dropdown-cell`의 `StatusDropdownCell` + `STATUS_DROPDOWN_CELL_CLASSNAME` (`onCell`) |
| 배지 | `PaymentOrderLineProcessingStatusBadge` → 내부적으로 `TextbookStatusBadge` `variant="payment-order-line"` (`app-status-badge` + `textbook-status-badge--*` 색상) |
| 현재값 비활성화 | `isItemDisabled={(cur, opt) => cur === opt}` (신청자 목록 프로그램 승인 현황과 동일) |
| 행 클릭 전파 차단 | 셀을 `<div onClick={(e) => e.stopPropagation()} style={{ display: 'inline-block' }}>` 로 감싸기 |
| 너비 | 신청자 프로그램 승인 현황과 동일: 컬럼·`td.status-dropdown-cell__cell-status` **152px**, 배지 **120px**(`app-status-badge`). 드롭다운 오버레이는 `body`에 붙으므로 전역 `status-dropdown-cell.css`(152px)와 맞출 것 — 배지만 넓히면 메뉴·트리거와 어긋남. |

참고 구현: `features/settlement/ui/payment-record/payment-order-detail-filter-table.tsx`(program·instructor `mode`), 배지 `shared/components/payment-order-line-processing-status-badge.tsx` · `textbook-status-badge.css`(confirmed / correction; 라인 변형은 말줄임만).
