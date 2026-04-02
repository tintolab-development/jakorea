---
priority: high
always_include: false
category: coding
globs: ["**/shared/components/status-dropdown-cell*.tsx", "**/shared/components/program-lifecycle-status*.tsx", "**/*program-list*.tsx", "**/recruitment-status-widget*", "**/settlement-management/payment-order-*-status-detail-fullpage-modal.tsx"]
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
| 대시보드 위젯 테이블 | `features/dashboard/ui/recruitment-status-widget.tsx` / `.css` |
| 교육 프로그램 테이블 | `features/program/ui/program-list.tsx` / `program-list.css` |

---

## 6. 체크리스트 (상태 드롭다운 셀 추가 시)

- [ ] 컬럼에 `onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME })` 지정 (또는 동일 효과로 td에 해당 클래스가 확실히 붙는 방식)
- [ ] 테이블 CSS에 `tr:has(td.status-dropdown-cell__cell-status)`, `tr:has(td .status-dropdown-cell__status-trigger--open)` 행 높이 고정 규칙 추가
- [ ] 행 클릭으로 상세 이동 시 `.status-dropdown-cell__status-trigger` 클릭은 제외
- [ ] 새 도메인 배지는 `AppStatusBadge` 기반으로 추가; 필요 시 `status-dropdown-cell.css`에 드롭다운 내 배지 색상 추가
- [ ] 새 도메인 셀은 `StatusDropdownCell` 직접 사용하거나, 동일 패턴의 얇은 래퍼만 추가

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

참고 구현: `pages/settlement-management/payment-order-program-settlement-table.tsx`, `payment-order-instructor-settlement-table.tsx`, 배지 `shared/components/payment-order-line-processing-status-badge.tsx` · `textbook-status-badge.css`(confirmed / correction; 라인 변형은 말줄임만).
