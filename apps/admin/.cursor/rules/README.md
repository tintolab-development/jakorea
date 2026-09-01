# Admin project rules

Development standards for **Homepage Admin** (`apps/admin`).

## SSOT — CMS · Admin 공유 UI

**공통 스펙(치수·URL 필터 의도·테이블 셸)은 루트 공유 룰을 수정한다.**

→ [`.cursor/rules/cms-admin-ui/`](../../../../.cursor/rules/cms-admin-ui/README.md)

| 공유 | 내용 |
|------|------|
| [filter-area-dimensions](../../../../.cursor/rules/cms-admin-ui/filter-area-dimensions.mdc) | 240 · gap 12 · 조회 160 |
| [list-filter-url-sync](../../../../.cursor/rules/cms-admin-ui/list-filter-url-sync.mdc) | draft + searchParams 단일 소스 |
| [list-table-shell](../../../../.cursor/rules/cms-admin-ui/list-table-shell.mdc) | 카드 20 · 툴바 16 · 액션 8 |
| [cms-button-action-sizes](../../../../.cursor/rules/cms-admin-ui/cms-button-action-sizes.mdc) | 툴바·모달 푸터 large 140×44 |
| [file-select-detail-form](../../../../.cursor/rules/cms-admin-ui/file-select-detail-form.mdc) | FileSelect + DetailInfoForm |
| [cms-data-table](../../../../.cursor/rules/cms-admin-ui/cms-data-table.mdc) | cms-data-table 패딩 |
| [table-th](../../../../.cursor/rules/cms-admin-ui/table-th.mdc) | `--BG-header` |
| [table-td-divider](../../../../.cursor/rules/cms-admin-ui/table-td-divider.mdc) | `\|` 금지 |
| [styling-tokens](../../../../.cursor/rules/cms-admin-ui/styling-tokens.mdc) | 토큰 우선 |

`apps/cms` 컴포넌트를 직접 import하지 않는다. 스펙은 공유 룰 + 아래 Admin 어댑터.

## Admin 어댑터 (구현 스택 · 경로)

| 규칙 | 설명 |
|------|------|
| [reuse-shared-ui.mdc](./coding/reuse-shared-ui.mdc) | `Cms*` 재사용 · CMS import 금지 |
| [filter-area-layout.mdc](./design/filter-area-layout.mdc) | `admin-filter-area` 마크업 |
| [list-table-spacing.mdc](./design/list-table-spacing.mdc) | `admin-list-card` · CSS 토큰 path |
| [cms-button-action-sizes.mdc](./design/cms-button-action-sizes.mdc) | 툴바·모달 푸터 large · content-modal/table-header path |
| [list-page-composition.mdc](./coding/list-page-composition.mdc) | 2카드 + `useListFilterUrl` |
| [table-implementation.mdc](./tables/table-implementation.mdc) | admin `cms-data-table.css` · 상수 |
| [table-th.mdc](./design/table-th.mdc) | admin theme path |
| [detail-info-form-layout.mdc](./design/detail-info-form-layout.mdc) | form-template-runtime |
| [detail-document-form-card.mdc](./design/detail-document-form-card.mdc) | **alwaysApply** · 흰 카드 fill · 툴바 title · 조회/수정 shift 최소화 |
| [detail-loading-before-empty.mdc](./design/detail-loading-before-empty.mdc) | 단건·상세 로딩 Spin 먼저 · RQ isLoading / isPending |
| [detail-info-nested-table.mdc](./design/detail-info-nested-table.mdc) | Field 값 안 nested 격자 |
| [table-td-divider.mdc](./design/table-td-divider.mdc) | Admin TdDivider import |
| [styling-tokens.mdc](./design/styling-tokens.mdc) | admin theme-provider path |
| [api-mock-remote.mdc](./data/api-mock-remote.mdc) | Mock/API 로그인 · 이중 프록시 · capabilities |
| [list-filter-query-api.mdc](./data/list-filter-query-api.mdc) | 필터 `applied` → list GET query · queryKey · DnD 병합 |
| [mutation-fetch-amplification.mdc](./data/mutation-fetch-amplification.mdc) | mutation 후 불필요 list GET 금지 |
| [mutation-failure-alert.mdc](./data/mutation-failure-alert.mdc) | 저장·수정 실패 시 필드/원인 알림 모달 |

## CMS 전용 — Admin에 이식하지 않음

| CMS | 이유 |
|-----|------|
| `FilterTableLayout` / `useTablePage` / `TableFilterGroup` | admin은 `admin-filter-area` + `useListFilterUrl` |
| `process/*` · 프로그램 유형 · 캘린더 필터 | CMS 도메인 |
| `cross-table.md` | admin 미사용 |

**Last updated:** 2026-08-13
