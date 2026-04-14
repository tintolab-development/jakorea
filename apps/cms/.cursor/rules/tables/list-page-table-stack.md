---
priority: medium
always_include: false
category: tables
---

# CMS 목록 페이지 — 필터·테이블 공통 스택

신규 **목록(리스트) 화면**을 추가할 때는 가능한 한 아래 스택을 따른다. Ant Design `Table`의 컬럼 폭·`ellipsis`·`fixed`·`cms-data-table` 등 UI 세부는 [table-implementation.md](./table-implementation.md)를 본다.

## 레이아웃

- 필터 카드 + 구분선 + 테이블 영역: **`FilterTableLayout`** (`@/shared/components/filter-table-layout` 또는 `@/shared/ui` 배럴).
- 필터 필드 정의: **`TableFilterGroup`**과 동일한 `fields` 배열 (`FilterFieldConfig`).

## 상태·URL·조회

- URL 동기화·조회 버튼·(필요 시) TanStack 컬럼 필터 연동: **`useTablePage`** + 도메인별 **`TablePageConfig`** (`@/shared/components/table-system`).
- 페이지별로 `*.config.ts` 또는 `getXxxTablePageConfig(context)`에 다음을 둔다.
  - `columns` — `tanstack`, `filterKeys`, `resolveAntdColumns`
  - `filters` — `initialPending`, `syncPendingFromUrl`, `hasActiveFilters`, `getBaseCount`, 필요 시 **`onFilterChange`**
  - `filterFn` — `searchParams` 기준으로 `dataForTable` / `filteredData` 계산
  - `getSearchSync` — `useTableSearch`용 `paramConfig`, `tableConfig`, `afterApplyParams`

## 필터 카드 변경 핸들러

- 필터 키·값을 `pendingFilters` 형태로 바꾸는 로직은 **`config.filters.onFilterChange`** 에만 둔다.
- 화면 컴포넌트에서는 **`onFilterChange={handleFilterChange}`** 만 사용한다 (`useTablePage` 반환값).

## 이중 상태 금지

- **pending(카드) + applied(별도 state)** 로 테이블 데이터를 나누지 않는다. 적용된 필터의 단일 소스는 **`searchParams`(조회 반영 후)** 로 맞추고, 카드 임시 값은 `pendingFilters` + **`applySearch`** 로 유지한다.

## 예외

- 풀페이지 모달·중첩 UI 등에서 전역 URL을 쓰기 어렵다면, 쿼리 키 **네임스페이스** 또는 `useTableWithQuery`의 **주입 가능한 searchParams** 설계를 택하고, 예외 사유를 PR/코멘트에 남긴다.
