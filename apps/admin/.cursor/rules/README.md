# Admin project rules

Development standards for **Homepage Admin** (`apps/admin`).

CMS와 UI 스펙을 맞출 때는 아래 **design / tables** 규칙을 우선 보고, `apps/cms` 컴포넌트를 직접 import하지 않는다.

## Design — 레이아웃·패딩·테이블 계열

| 규칙 | 설명 |
|------|------|
| [filter-area-layout.mdc](./design/filter-area-layout.mdc) | 필터 칸 240·gap 12·조회 160×44 (CMS 미러) |
| [list-table-spacing.mdc](./design/list-table-spacing.mdc) | 목록 카드 padding 20 · 툴바 gap 16 · 액션 8 |
| [list-page-composition.mdc](./coding/list-page-composition.mdc) | 필터 카드 + 테이블 카드 조합 |
| [table-implementation.mdc](./tables/table-implementation.mdc) | `cms-data-table` 패딩·열폭 Ant Table |
| [table-th.mdc](./design/table-th.mdc) | th / 라벨 셀 `--BG-header` |
| [detail-info-form-layout.mdc](./design/detail-info-form-layout.mdc) | DetailInfoForm 다블록 |
| [detail-info-nested-table.mdc](./design/detail-info-nested-table.mdc) | Field 값 안 nested 격자 |
| [table-td-divider.mdc](./design/table-td-divider.mdc) | 값 셀 `\|` 금지 · TdDivider |
| [styling-tokens.mdc](./design/styling-tokens.mdc) | color/spacing 토큰 우선 |

## CMS 대조 (이식하지 않음)

| CMS 규칙 | 이유 |
|----------|------|
| `FilterTableLayout` / `useTablePage` / `table-filter-group-layout` (260px · wrap props) | admin은 `admin-filter-area` **240px** 스택 |
| `cross-table.md` | admin에 `CrossTable` UI 미사용 |
| 프로그램 유형·캘린더 필터 등 process/* | CMS 도메인 전용 |

CMS 원문: `apps/cms/.cursor/rules/design/` · `tables/` · `coding/list-page-composition.mdc`

**Last updated:** 2026-08-06
