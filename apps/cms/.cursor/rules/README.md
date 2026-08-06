# CMS project rules

Development standards for **JAKorea CMS** (`apps/cms`).

## CMS · Admin 공유 UI (SSOT)

Homepage Admin과 **치수·필터 URL 의도·테이블 셸**을 같이 쓴다. 공통 수정은 아래 폴더만.

→ [`.cursor/rules/cms-admin-ui/`](../../../../.cursor/rules/cms-admin-ui/README.md)

| 공유 룰 | 용도 |
|---------|------|
| [filter-area-dimensions](../../../../.cursor/rules/cms-admin-ui/filter-area-dimensions.mdc) | 필터 240 · gap 12 · 조회 160 |
| [list-filter-url-sync](../../../../.cursor/rules/cms-admin-ui/list-filter-url-sync.mdc) | draft + searchParams |
| [list-table-shell](../../../../.cursor/rules/cms-admin-ui/list-table-shell.mdc) | 카드·툴바 갭 |
| [cms-data-table](../../../../.cursor/rules/cms-admin-ui/cms-data-table.mdc) | `cms-data-table` 패딩 |
| [table-th](../../../../.cursor/rules/cms-admin-ui/table-th.mdc) / [table-td-divider](../../../../.cursor/rules/cms-admin-ui/table-td-divider.mdc) | th · 값 셀 디바이더 |
| [styling-tokens](../../../../.cursor/rules/cms-admin-ui/styling-tokens.mdc) | 토큰 우선 |

Admin 구현 스택: [`apps/admin/.cursor/rules`](../../../admin/.cursor/rules/README.md) (`useListFilterUrl` — CMS `useTablePage`와 다름).

## Start here

- [Project overview](./project-overview.md)
- [FSD structure](./architecture/fsd-structure.md)

## Architecture

- [FSD structure](./architecture/fsd-structure.md) — Feature-Sliced Design  
- [Routing](./architecture/routing.md) — React Router and route naming  

## Coding

- [Code style](./coding/code-style.md) — ESLint, Prettier, TS, naming  
- **[Feature file naming](./coding/feature-file-naming.mdc)** — CMS 전역 파일명 간략화 (**alwaysApply**, 필수)  
- [Component patterns](./coding/component-patterns.md) — shared UI usage  
- [List page composition](./coding/list-page-composition.mdc) — filter + table layout (공유 URL 의도 → cms-admin-ui)  
- [List page table stack](./tables/list-page-table-stack.md) — `useTablePage`  
- **[TableFilterGroup layout](./design/table-filter-group-layout.mdc)** — 260px·gap·responsive wrap·겹침 금지 패턴  
- [Status dropdown cell](./coding/status-dropdown-cell.md) — `StatusDropdownCell`, tag layout  
- [Custom hooks](./coding/custom-hooks.md)  
- **[React hooks — early return 뒤 훅 금지](./coding/react-hooks-after-early-return.mdc)** — `Rendered more hooks…` 방지 (tsx/훅 편집 시)  
- [Type safety & consistency](./coding/type-safety-and-consistency.md) — no deprecated APIs  
- [Refactoring principles](./coding/refactoring-principles.md)  
- [Template feature implementation](./coding/template-management.md) — `features/template`, `pages/templates`  
- [Form editor modes (view / edit / write)](./template/form-editor-modes.mdc) — 템플릿 양식 모드·설명글 예외  

## UI / UX

- [UI principles](./design/ui-principles.md)  
- [숫자 입력 UX](./design/numeric-input-ux.mdc) — 정수·소수·금액·날짜 텍스트·숫자형 식별자 입력 규칙
- [Modal viewport centering](./design/modal-viewport-centering.md) — center modals in viewport  
- Prefer **`ContentModal`**; direct **`TealHeaderModal`** use is deprecated  
- [CMS 공통 Alert 모달](./libraries/cms-alert-modal.md) — 단일 확인 안내 (`useCmsAlert` / `cmsAlertModal`)  
- [Event handling](./design/event-handling.md)  
- [Color system](./design/color-system.md)  
- [Color palette](./design/color-palette.md)  
- [Instructor settlement status (8종)](./design/instructor-settlement-status.mdc) — 정산 현황 라벨·색상·UI 공통  
- [Styling tokens](./design/styling-tokens.md)  
- **[Design System Impact audit 지표 동기화](./design/design-system-impact-audit.mdc)** — DS/`shared`/토큰 변경 시 `#impact-audit`·Canvas 수치 갱신  
- [Schedule / calendar UX](./design/schedule-calendar-ux.md)  
- [Calendar sub-right list](./design/calendar-sub-right-list.md) — `.calendar-list` / `.calendar-list-item` 공통 shell·mint hover  
- [Cross table (행·열 교차 격자)](./design/cross-table.md) — `CrossTable` (`@/shared/ui/cross-table`)  
- **[DetailInfoForm 다블록 레이아웃](./design/detail-info-form-layout.mdc)** — `title` + `hideHeader` 2개, `applicant-instructor-basic-info`  
- [Table td divider (값 셀 `|` 금지)](./design/table-td-divider.mdc) — `withProgramDetailTdDivider`, `DetailInfoForm.TdDivider`  
- [Design requests](./design/design-requests.md)  

## Libraries

- [Ant Design usage](./libraries/ant-design-usage.md)  
- [CMS 공통 Alert 모달](./libraries/cms-alert-modal.md) — `useCmsAlert`, `cmsAlertModal`, 토큰·안내 문구  
- [Shared packages](./libraries/shared-packages.md) — `@jakorea/ui`, `@jakorea/utils`  
- [Required libraries](./libraries/required-libraries.md)  

## State

- [State management](./state/state-management.md) — Zustand  

## Data

- [Mock data](./data/mock-data.md)  
- [API spec (mock)](./data/api-spec-mock.md)  
- [API routes & apiClient (실 연동)](./data/api-routes-and-client.md) — 경로 상수, `apiClient`, env, 점진 mock 전환  
- [API spec detailed](../../docs/api/api-spec-mock-detailed.md)  
- [API spec extended](../../docs/api/api-spec-mock-extended.md)  

## Forms

- [Form validation](./forms/form-validation.md) — RHF + Zod  

## Tables

- [Table implementation](./tables/table-implementation.md) — Ant Table patterns  
- [Table td divider (값 셀 `|` 금지)](./design/table-td-divider.mdc) — 디바이더 컴포넌트 필수  
- [Table management](./tables/table-management.md) — TanStack table & URL sync  
- [Status dropdown cell](./coding/status-dropdown-cell.md)  

## Environment

- [Browser support](./environment/browser-support.md)  
- [Package management](./environment/package-management.md) — pnpm workspace  
- [Tech stack](./environment/tech-stack.md)  

## Process

- **[약관 및 동의 정책](../../../.cursor/rules/terms-and-consent-policy.mdc)** — 필수/선택·동의서·유효기간·미동의 제한 (**alwaysApply**, 모노레포 공통)
- **[회원 상세 · 등록 동의 UI](./process/member-detail-consent-agreement-cms.md)** — preset·필드 매핑·템플릿 id
- **[프로그램 유형 간 간섭 방지](./process/program-type-isolation.mdc)** — 일반·UJAT·1사1교·Gemini UI/로직 격리, 공유 코드 변경 시 유저 확인 (**alwaysApply**)
- [개발 프로세스](./process/development-process.md) - Phase별 개발 프로세스
- [진행 상황 관리](./process/progress-management.md) - PROGRESS.md 기록 규칙
- [역할별 Persona](./process/persona.md) - 시니어 PM, 기획자, UX/UI 디자이너, 개발자 역할 정의
- [관리자 공지 등록·수정 모달 UI](./process/admin-notice-form-modal-spec.md) - `ContentModal` large, 필터·폼 간격, 에디터·첨부 행 치수
- [수료증/참여인증서 발급](./process/member-program-certificate-issue-spec.md) - 발급 자격·문서 종류 기획, 화면 고정 안내 미삽입 정책
- [후원사 상세 > 프로그램 진행 이력 — 참여자 유형](./process/sponsor-program-history-participant-type.md) - 학교/기관·개인 학습자만 (`school` | `individual`)
- [프로그램 이력 삭제 — 진행 중 차단](./process/program-history-delete-blocked.md) - `EDUCATION_IN_PROGRESS` 포함 시 삭제 불가 모달
- [교재 관리 — 사업 분야](./process/textbook-management.md) - 교재 사업 분야 4종(기획 고정), 코드 상수 `textbook-business-areas.ts`
- [Development process](./process/development-process.md)  
- [Progress management](./process/progress-management.md)  
- [Personas](./process/persona.md)  
- [Admin notice modal](./process/admin-notice-form-modal-spec.md)  
- [Certificate issue spec](./process/member-program-certificate-issue-spec.md)  
- **[UJAT 교육 지역 관리](./process/ujat-education-region-management-spec.md)** — `/programs/ujat/regions` 목록·DnD·인라인 수정·등록/삭제 모달
- **[UJAT 프로그램 목록](./process/ujat-program-list-page-spec.md)** — 진행년도 필터·테이블 컬럼·신규 등록·임시저장 이력 안내
- **[UJAT 프로그램 도메인 특성](./process/ujat-program-characteristics-spec.md)** — 봉사자=강사, 8지역, 금요일 1~4교시, 학교 1회·봉사자 상·하반기 2회 모집 (**목록·상세 공통 기획**)
- [UJAT 기관 신청 목록](./process/ujat-institution-application-list-table-spec.md) — 진행일 열·희망일 `O`·선택 임시 배정
- [UJAT 신청 기관 임시 배정](./process/ujat-institution-schedule-assign-spec.md) — `inst_schedule_assign` 날짜별 배정·배정값 산정
- [UJAT 참여 봉사자 상세 — 교육 배정 및 진행 현황](./process/volunteer-assignment-tab-spec.md) — 역할 드롭다운·출결 담당 1명·활동 포기 행 오버레이
- [일반 프로그램 — 참여 강사 상세 · 활동 포기](./process/participating-instructor-activity-withdraw-spec.md) — 기관 사유 포기·실적 반영(중단일까지) API 연동 규칙
- [일반 프로그램 — 기관 합반 신청 여부](./process/applicant-institution-combined-class-spec.md) — 단일 회차·라디오+셀렉·타 학년 lookup·교육 일정 안내
- Other `process/*` files — feature-specific UI specs (English).  

---

**Last updated:** 2026-06-04
