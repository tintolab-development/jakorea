# CMS 문서 인덱스

`apps/cms` 경로 내 MD 문서를 카테고리별로 정리한 인덱스입니다. 과거 QA·감사·전략·아카이브 등 참고용 문서는 정리 과정에서 제거되었습니다. 필요하면 `git` 히스토리에서 복원하거나 새로 작성하세요.

---

## 문서 구조 요약

| 영역 | 경로 | 용도 |
|------|------|------|
| **개발 규칙** | `.cursor/rules/` | AI/개발자용 코딩 규칙, 아키텍처, 디자인 가이드 |
| **스킬** | `.cursor/skills/` | Cursor 스킬 정의 |
| **프로젝트 문서** | `docs/` | 요구사항, 구현, 디자인 스펙 등 |

---

## 1. 개발 규칙 (Cursor Rules)

> 상세: [`.cursor/rules/README.md`](../.cursor/rules/README.md)

### 아키텍처
| 문서 | 설명 |
|------|------|
| [fsd-structure.md](../.cursor/rules/architecture/fsd-structure.md) | Feature-Sliced Design 아키텍처 |
| [routing.md](../.cursor/rules/architecture/routing.md) | React Router 설정 및 라우트 네이밍 |

### 코딩 표준
| 문서 | 설명 |
|------|------|
| [code-style.md](../.cursor/rules/coding/code-style.md) | ESLint, Prettier, TypeScript, 파일 명명 |
| [component-patterns.md](../.cursor/rules/coding/component-patterns.md) | 컴포넌트 관심사 분리 |
| [custom-hooks.md](../.cursor/rules/coding/custom-hooks.md) | Custom Hooks 작성 가이드 |
| [type-safety-and-consistency.md](../.cursor/rules/coding/type-safety-and-consistency.md) | 타입 안전성 및 일관성 |
| [refactoring-principles.md](../.cursor/rules/coding/refactoring-principles.md) | 리팩토링 원칙 |

### 디자인
| 문서 | 설명 |
|------|------|
| [color-palette.md](../.cursor/rules/design/color-palette.md) | 색상 팔레트 |
| [color-system.md](../.cursor/rules/design/color-system.md) | 색상 시스템 |
| [styling-tokens.md](../.cursor/rules/design/styling-tokens.md) | CSS 디자인 토큰 |
| [ui-principles.md](../.cursor/rules/design/ui-principles.md) | UI 원칙 |
| [event-handling.md](../.cursor/rules/design/event-handling.md) | 이벤트 처리 |
| [schedule-calendar-ux.md](../.cursor/rules/design/schedule-calendar-ux.md) | 캘린더 UX |
| [design-requests.md](../.cursor/rules/design/design-requests.md) | 디자인 요청사항 |

### 데이터 & API
| 문서 | 설명 |
|------|------|
| [mock-data.md](../.cursor/rules/data/mock-data.md) | Mock 데이터 |
| [api-spec-mock.md](../.cursor/rules/data/api-spec-mock.md) | API 명세 (Mock) |

### 환경 & 라이브러리
| 문서 | 설명 |
|------|------|
| [tech-stack.md](../.cursor/rules/environment/tech-stack.md) | 기술 스택 |
| [browser-support.md](../.cursor/rules/environment/browser-support.md) | 브라우저 지원 |
| [package-management.md](../.cursor/rules/environment/package-management.md) | 패키지 관리 |
| [ant-design-usage.md](../.cursor/rules/libraries/ant-design-usage.md) | Ant Design 사용법 |
| [shared-packages.md](../.cursor/rules/libraries/shared-packages.md) | 공유 패키지 |
| [required-libraries.md](../.cursor/rules/libraries/required-libraries.md) | 필수 라이브러리 |

### 폼 & 테이블 & 상태
| 문서 | 설명 |
|------|------|
| [form-validation.md](../.cursor/rules/forms/form-validation.md) | React Hook Form + Zod |
| [table-management.md](../.cursor/rules/tables/table-management.md) | 테이블 관리 |
| [state-management.md](../.cursor/rules/state/state-management.md) | Zustand 상태 관리 |

### 프로세스
| 문서 | 설명 |
|------|------|
| [development-process.md](../.cursor/rules/process/development-process.md) | Phase별 개발 프로세스 |
| [progress-management.md](../.cursor/rules/process/progress-management.md) | 진행 기록 규칙 |
| [persona.md](../.cursor/rules/process/persona.md) | 역할별 Persona |
| [template-files-improvement.md](../.cursor/rules/process/template-files-improvement.md) | 템플릿 파일 개선 |

---

## 2. 요구사항 & 로드맵

| 문서 | 설명 |
|------|------|
| [requirements.md](requirements-specification/requirements.md) | 요구사항 |
| [progress.md](requirements-specification/progress.md) | 요구사항 진행 |
| [current-vs-requirements.md](requirements-specification/comparison/current-vs-requirements.md) | 현행 vs 요구사항 |
| [matching-management-analysis.md](requirements-specification/analysis/matching-management-analysis.md) | 매칭 관리 분석 |
| [MVP README](requirements-specification/MVP/README.md) | MVP 개요 |
| [v0.1-foundation.md](requirements-specification/MVP/v0.1-foundation.md) | v0.1 기반 |
| [v0.2-front-core.md](requirements-specification/MVP/v0.2-front-core.md) | v0.2 프론트 핵심 |
| [v0.3-admin-ops.md](requirements-specification/MVP/v0.3-admin-ops.md) | v0.3 어드민 |
| [v0.4-settlement-report.md](requirements-specification/MVP/v0.4-settlement-report.md) | v0.4 정산 |
| [v0.5-security-compliance.md](requirements-specification/MVP/v0.5-security-compliance.md) | v0.5 보안 |
| [phases-frontend-mock.md](requirements-specification/MVP/phases-frontend-mock.md) | 프론트엔드 Mock |
| [kakao-alimtalk-integration-info.md](requirements-specification/MVP/kakao-alimtalk-integration-info.md) | 카카오 알림톡 |
| [microsoft-authenticator-2fa-info.md](requirements-specification/MVP/microsoft-authenticator-2fa-info.md) | MS Authenticator 2FA |
| [MVP_ROADMAP_V4_DETAILED.md](roadmap/MVP_ROADMAP_V4_DETAILED.md) | 로드맵 v4 상세 |
| [REQUIREMENTS_PRIORITY.md](status/REQUIREMENTS_PRIORITY.md) | 요구사항 우선순위 |
| [DOCUMENT_VALIDITY_REVIEW_2026-04-20.md](status/DOCUMENT_VALIDITY_REVIEW_2026-04-20.md) | 문서 유효성 분류표 |

---

## 3. 구현 & 도메인

| 문서 | 설명 |
|------|------|
| [certificate-template-implementation-summary.md](implementation/certificate-template-implementation-summary.md) | 수료증 템플릿 구현 |
| [template-form-draft-local-save.md](implementation/template-form-draft-local-save.md) | 템플릿 양식 임시저장 구현 가이드 |
| [form-surface-refactoring-guide.md](implementation/form-surface-refactoring-guide.md) | 템플릿 편집 ↔ 응답 작성 폼 리팩터링 가이드 (surface/JSON/로컬 renderer) |
| [rich-text-editor-tiptap-migration.md](implementation/rich-text-editor-tiptap-migration.md) | Rich Text 에디터·뷰어 마이그레이션 (Toast UI → Tiptap) |
| [instructor-settlement-payment-statement-issue-rules.md](features/instructor-settlement-payment-statement-issue-rules.md) | 강사 정산 지급명세 이슈 규칙 |
| [instructor-fee-budget-criteria.md](settlement/instructor-fee-budget-criteria.md) | 강사 수당·예산 기준 |

---

## 4. 기능별 가이드

### 관리자
| 문서 | 설명 |
|------|------|
| [home-screen-implementation.md](admin/home-screen-implementation.md) | 홈 화면 구현 |
| [migration-guide.md](admin/migration-guide.md) | 마이그레이션 가이드 |

### 강사
| 문서 | 설명 |
|------|------|
| [satisfaction-survey-flow.md](instructor/satisfaction-survey-flow.md) | 만족도 설문 흐름 |
| [migration-guide.md](instructor/migration-guide.md) | 마이그레이션 가이드 |

### 봉사자
| 문서 | 설명 |
|------|------|
| [README.md](volunteer/README.md) | 봉사자 개요 |
| [volunteer-operations.md](volunteer/volunteer-operations.md) | 봉사자 운영 |
| [category-structure.md](volunteer/category-structure.md) | 카테고리 구조 |
| [ia-structure.md](volunteer/ia-structure.md) | IA 구조 |
| [BRANCH_GUIDELINES.md](volunteer/BRANCH_GUIDELINES.md) | 브랜치 가이드 |
| [migration-guide.md](volunteer/migration-guide.md) | 마이그레이션 가이드 |

---

## 5. API

| 문서 | 설명 |
|------|------|
| [programs-api-conversion-roadmap.md](api/programs-api-conversion-roadmap.md) | 프로그램 관리 **미전환 카테고리 순차 로드맵** (Cat1–6 SSOT) |
| [programs-api-backend-gaps-consolidated.md](api/programs-api-backend-gaps-consolidated.md) | 프로그램 Cat1–6 **백엔드 통합 핸드오프** (API 부재·계약 미비·적용 가이드) |
| [**e2e-backend-fixes-index.md**](api/e2e-backend-fixes-index.md) | **E2E 관측** 백엔드 수정 요청 인덱스 (programs · members · adminAuth) |
| [**members/**](api/members/README.md) | **회원 관리 API** — handoff · 연동 · E2E pre-register · gaps · 상세 미존 endpoint |
| [e2e-programs-create-database-error-handoff.md](api/e2e-programs-create-database-error-handoff.md) | 일반 프로그램 등록 `DATABASE_ERROR` (P0) |
| [e2e-admin-auth-mfa-concurrency-handoff.md](api/e2e-admin-auth-mfa-concurrency-handoff.md) | MFA 병렬 challenge (P2) |
| [forms-surveys-api-integration.md](api/forms-surveys-api-integration.md) | 템플릿 양식 API 연동 명세 |
| [forms-surveys-api-migration-guide.md](api/forms-surveys-api-migration-guide.md) | 템플릿 양식 API **PHASE별 마이그레이션 가이드** |
| [forms-surveys-api-backend-gaps.md](api/forms-surveys-api-backend-gaps.md) | 템플릿 양식 **백엔드 갭·미구현 핸드오프** |
| [template-create-api-backend-handoff.md](api/template-create-api-backend-handoff.md) | 템플릿 관리 **신규 템플릿 생성** API·로직 갭 (BE 전달용) |
| [programs-detail-api-conversion-status.md](api/programs-detail-api-conversion-status.md) | 일반 프로그램 상세 LNB Phase·완료율 SSOT |
| [programs-company-school-api-backend-handoff.md](api/programs-company-school-api-backend-handoff.md) | 1사1교 CRUD 전환 계약·gate (Cat1) |
| [programs-company-school-detail-api-conversion-status.md](api/programs-company-school-detail-api-conversion-status.md) | 1사1교 상세 LNB Phase·완료율 SSOT (Cat1) |
| [programs-ujat-api-backend-handoff.md](api/programs-ujat-api-backend-handoff.md) | UJAT 프로그램 CRUD 전환 계약·gate (Cat2) |
| [programs-ujat-detail-api-conversion-status.md](api/programs-ujat-detail-api-conversion-status.md) | UJAT 상세 LNB Phase·완료율 SSOT (Cat2) |
| [programs-ujat-education-regions-api-backend-handoff.md](api/programs-ujat-education-regions-api-backend-handoff.md) | UJAT 교육 지역 BE 계약 (Cat3) |
| [programs-ujat-education-regions-api-conversion-status.md](api/programs-ujat-education-regions-api-conversion-status.md) | UJAT 교육 지역 Phase SSOT (Cat3) |
| [programs-trained-teachers-api-backend-handoff.md](api/programs-trained-teachers-api-backend-handoff.md) | 교육받은 교사 BE 계약 (Cat4) |
| [programs-trained-teachers-api-conversion-status.md](api/programs-trained-teachers-api-conversion-status.md) | 교육받은 교사 Phase SSOT (Cat4) |
| [programs-gemini-visiting-training-api-backend-handoff.md](api/programs-gemini-visiting-training-api-backend-handoff.md) | Gemini 찾아가는 연수 BE 계약 (Cat5) |
| [programs-gemini-visiting-training-api-conversion-status.md](api/programs-gemini-visiting-training-api-conversion-status.md) | Gemini 찾아가는 연수 Phase SSOT (Cat5) |
| [programs-gemini-performance-api-backend-handoff.md](api/programs-gemini-performance-api-backend-handoff.md) | Gemini 실적 관리 BE 계약 (Cat6) |
| [programs-gemini-performance-api-conversion-status.md](api/programs-gemini-performance-api-conversion-status.md) | Gemini 실적 관리 Phase SSOT (Cat6) |
| [api-spec-mock-detailed.md](api/api-spec-mock-detailed.md) | API 명세 상세 |
| [api-spec-mock-extended.md](api/api-spec-mock-extended.md) | API 명세 확장 |

---

## 6. 디자인 (화면·UX 스펙)

| 문서 | 설명 |
|------|------|
| [cms-shared-ssot-migration.md](design-system/cms-shared-ssot-migration.md) | CMS shared SSOT·공통화 마이그레이션 로드맵 (Platform 제외) |
| [wave4-teal-header-review-gate.md](design-system/wave4-teal-header-review-gate.md) | Wave4 TealHeader→ContentModal 카드 이관 게이트 (full 커스텀 유지) |
| [dashboard-widget-catalog-audit.md](design-system/dashboard-widget-catalog-audit.md) | 대시보드 홈 위젯 DS 카탈로그·Not catalogued 추림 |
| [css-override-audit.md](design-system/css-override-audit.md) | feature/shared CSS override 감사 (Phase 4) |
| [numeric-input-ux-audit.md](design-system/numeric-input-ux-audit.md) | 숫자 입력 UX 감사 |
| [add-instructor-modal-spec.md](design/add-instructor-modal-spec.md) | 강사 추가 모달 |
| [applicant-instructor-detail-modal-spec.md](design/applicant-instructor-detail-modal-spec.md) | 지원 강사 상세 모달 |
| [dashboard-program-progress-improvement.md](design/dashboard-program-progress-improvement.md) | 대시보드 프로그램 진행 개선 |
| [lecture-attendance-modal-spec.md](design/lecture-attendance-modal-spec.md) | 출석 모달 |
| [program-detail-applicants-tab-spec.md](design/program-detail-applicants-tab-spec.md) | 프로그램 상세 지원자 탭 |
| [program-managers-tab-spec.md](design/program-managers-tab-spec.md) | 프로그램 담당자 탭 |
| [school-detail-add-instructor-assign-spec.md](design/school-detail-add-instructor-assign-spec.md) | 학교 상세 강사 배정 |
| [school-detail-basic-edit-mode-spec.md](design/school-detail-basic-edit-mode-spec.md) | 학교 상세 기본 편집 |
| [school-detail-modal-spec.md](design/school-detail-modal-spec.md) | 학교 상세 모달 |
| [school-detail-modal-student-list-edit-spec.md](design/school-detail-modal-student-list-edit-spec.md) | 학교 상세 수강생 목록 편집 |

---

## 7. 멤버 & 정책 문서

| 문서 | 설명 |
|------|------|
| [ia-members.md](members/ia-members.md) | IA 멤버 |
| [CLEANUP_BENEFITS.md](claude-prompt/CLEANUP_BENEFITS.md) | 정리 이점 |
| [CLEANUP_DEPRECATED_CODE.md](claude-prompt/CLEANUP_DEPRECATED_CODE.md) | Deprecated 코드·Legacy UI 삭제 기록과 Current 대체 |
| [POLICY_TO_AUDIT.md](claude-prompt/POLICY_TO_AUDIT.md) | 감사 정책 |

---

## 8. Mock 데이터 목록

| 문서 | 설명 |
|------|------|
| [sponsor-list.md](data/sponsor-list.md) | 후원사 관리 목록 mock (132건) |
| [textbook-list.md](data/textbook-list.md) | 교재 관리 목록 mock (22건) |

---

## 9. 기타

| 문서 | 설명 |
|------|------|
| [e2e/playwright-flows.md](e2e/playwright-flows.md) | Playwright E2E 플로우별 headless / UI / headed 실행 스크립트 |
| [test-accounts.md](test-accounts.md) | 테스트 계정 |
| [INSTRUCTOR_SETTLEMENT_DATA_CHECK.md](check/INSTRUCTOR_SETTLEMENT_DATA_CHECK.md) | 강사 정산 데이터 점검 |
| [LOGO_PATH_GUIDE.md](../public/logo/LOGO_PATH_GUIDE.md) | 로고 경로 가이드 |
| [logo/README.md](../public/logo/README.md) | 로고 README |
| [README.md](../README.md) | CMS 루트 README |

---

## 10. Cursor 스킬

| 문서 | 설명 |
|------|------|
| [frontend-design/SKILL.md](../.cursor/skills/frontend-design/SKILL.md) | 프론트엔드 디자인 스킬 |
| [typescript/SKILL.md](../.cursor/skills/typescript/SKILL.md) | TypeScript 스킬 |

---

**마지막 업데이트**: 2026-07-20
