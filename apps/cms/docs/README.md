# CMS 문서 인덱스

`apps/cms` 경로 내 MD 문서를 카테고리별로 정리한 인덱스입니다.

---

## 📁 문서 구조 요약

| 영역 | 경로 | 용도 |
|------|------|------|
| **개발 규칙** | `.cursor/rules/` | AI/개발자용 코딩 규칙, 아키텍처, 디자인 가이드 |
| **스킬** | `.cursor/skills/` | Cursor 스킬 정의 |
| **프로젝트 문서** | `docs/` | 요구사항, 검증, 전략, 구현 등 |

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
| [progress-management.md](../.cursor/rules/process/progress-management.md) | PROGRESS.md 기록 규칙 |
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
| [MVP_ROADMAP_V3.md](roadmap/MVP_ROADMAP_V3.md) | 로드맵 v3 |
| [MVP_ROADMAP_V4_DETAILED.md](roadmap/MVP_ROADMAP_V4_DETAILED.md) | 로드맵 v4 상세 |
| [CURRENT_STATUS.md](status/CURRENT_STATUS.md) | 현재 상태 |
| [REQUIREMENTS_PRIORITY.md](status/REQUIREMENTS_PRIORITY.md) | 요구사항 우선순위 |
| [PROGRESS.md](status/PROGRESS.md) | 진행 상황 (루트→이동) |
| [NEXT_PHASE_CHECKLIST.md](status/NEXT_PHASE_CHECKLIST.md) | 다음 Phase 체크리스트 (루트→이동) |
| [PHASE_1_BRIEFING.md](status/PHASE_1_BRIEFING.md) | Phase 1 브리핑 (루트→이동) |

---

## 3. 검증 & QA & 감사

| 문서 | 설명 |
|------|------|
| [phase-0.5-integration-verification.md](verification/phase-0.5-integration-verification.md) | Phase 0.5 통합 검증 |
| [settlement-accommodation-fix.md](verification/settlement-accommodation-fix.md) | 정산 숙박 수정 |
| [settlement-submit-modal-business-logic-paths.md](verification/settlement-submit-modal-business-logic-paths.md) | 정산 제출 모달 로직 |
| [phase-0.4.2-verification.md](phase-verification/phase-0.4.2-verification.md) | Phase 0.4.2 검증 |
| [phase-0.5.1-verification.md](phase-verification/phase-0.5.1-verification.md) | Phase 0.5.1 검증 |
| [phase-0.5.2-verification.md](phase-verification/phase-0.5.2-verification.md) | Phase 0.5.2 검증 |
| [phase-0.5.3-verification.md](phase-verification/phase-0.5.3-verification.md) | Phase 0.5.3 검증 |
| [auth-permission-qa-checklist.md](qa/auth-permission-qa-checklist.md) | 인증/권한 QA 체크리스트 |
| [auth-permission-qa-report.md](qa/auth-permission-qa-report.md) | 인증/권한 QA 리포트 |
| [qa-verification-report.md](qa/qa-verification-report.md) | QA 검증 리포트 (루트→이동) |
| [membership-permission-policy-qa-report.md](qa/membership-permission-policy-qa-report.md) | 멤버십 권한 QA |
| [sponsor-management-qa-report.md](qa/sponsor-management-qa-report.md) | 후원사 관리 QA |
| [template-management-verification-report.md](qa/template-management-verification-report.md) | 템플릿 관리 검증 |
| [게시글_관리_QA_검증_결과.md](qa/게시글_관리_QA_검증_결과.md) | 게시글 관리 QA |
| [admin-permission-audit-report.md](audit/admin-permission-audit-report.md) | 어드민 권한 감사 |
| [admin-permission-fix-summary.md](audit/admin-permission-fix-summary.md) | 어드민 권한 수정 요약 |
| [role-permission-verification-report.md](audit/role-permission-verification-report.md) | 역할 권한 검증 |

---

## 4. 전략 & 계획

| 문서 | 설명 |
|------|------|
| [STRATEGY_DECISION.md](strategy/STRATEGY_DECISION.md) | 전략 결정 |
| [EXCEL_INTEGRATION_STRATEGY.md](strategy/EXCEL_INTEGRATION_STRATEGY.md) | 엑셀 연동 전략 |
| [excel-data-analysis.md](strategy/excel-data-analysis.md) | 엑셀 데이터 분석 (루트→이동) |
| [DASHBOARD_IMPROVEMENT_SIMPLIFIED.md](strategy/DASHBOARD_IMPROVEMENT_SIMPLIFIED.md) | 대시보드 개선 |
| [settlement-menu-improvement.md](strategy/settlement-menu-improvement.md) | 정산 메뉴 개선 |
| [certificate-template-enhancement.md](planning/certificate-template-enhancement.md) | 수료증 템플릿 계획 |
| [PLANNING_REQUESTS.md](planning/PLANNING_REQUESTS.md) | 기획 요청사항 (루트→이동) |

---

## 5. 구현 & 마이그레이션 & 리팩토링

| 문서 | 설명 |
|------|------|
| [certificate-template-implementation-summary.md](implementation/certificate-template-implementation-summary.md) | 수료증 템플릿 구현 |
| [REFACTORING_LOG.md](migration/REFACTORING_LOG.md) | 리팩토링 로그 |
| [ANT_DESIGN_MIGRATION_ESTIMATE.md](migration/ANT_DESIGN_MIGRATION_ESTIMATE.md) | Ant Design 마이그레이션 |
| [heavy-pages-analysis.md](refactoring/heavy-pages-analysis.md) | 무거운 페이지 분석 |
| [refactoring-priority-report.md](refactoring/refactoring-priority-report.md) | 리팩토링 우선순위 |

---

## 6. 기능별 가이드

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

### 위젯
| 문서 | 설명 |
|------|------|
| [dnd-widget-manual-test-checklist.md](widget/dnd-widget-manual-test-checklist.md) | DnD 위젯 테스트 |
| [naverworks-widget-editor-plan.md](widget/naverworks-widget-editor-plan.md) | 네이버웍스 위젯 에디터 |

---

## 7. API & 기술

| 문서 | 설명 |
|------|------|
| [api-spec-mock-detailed.md](api/api-spec-mock-detailed.md) | API 명세 상세 |
| [api-spec-mock-extended.md](api/api-spec-mock-extended.md) | API 명세 확장 |

---

## 8. 디자인 & UX

| 문서 | 설명 |
|------|------|
| [dashboard-program-progress-improvement.md](design/dashboard-program-progress-improvement.md) | 대시보드 프로그램 진행 개선 |
| [JA코리아 사용자화면 프롬프트_1219.md](design/JA코리아 사용자화면 프롬프트_1219.md) | 사용자화면 프롬프트 |

---

## 9. 인터뷰 & 멤버 & 클로드 프롬프트

| 문서 | 설명 |
|------|------|
| [initial_interview.md](interview/initial_interview.md) | 초기 인터뷰 |
| [CLIENT_INTERVIEW_2024-12-19.md](interview/CLIENT_INTERVIEW_2024-12-19.md) | 클라이언트 인터뷰 |
| [ia-members.md](members/ia-members.md) | IA 멤버 |
| [CURSOR-PROMPT-PHASE-0.1.1.md](claude-prompt/CURSOR-PROMPT-PHASE-0.1.1.md) | Cursor 프롬프트 Phase 0.1.1 |
| [CLEANUP_BENEFITS.md](claude-prompt/CLEANUP_BENEFITS.md) | 정리 이점 |
| [CLEANUP_DEPRECATED_CODE.md](claude-prompt/CLEANUP_DEPRECATED_CODE.md) | Deprecated 코드 정리 |
| [POLICY_TO_AUDIT.md](claude-prompt/POLICY_TO_AUDIT.md) | 감사 정책 |
| [QA-STATUS.md](claude-prompt/QA-STATUS.md) | QA 상태 |
| [NEXT_CONTEXT_PROMPT.md](claude-prompt/NEXT_CONTEXT_PROMPT.md) | 다음 컨텍스트 프롬프트 (루트→이동) |

---

## 10. 기타 & 루트 문서

| 문서 | 설명 |
|------|------|
| [test-accounts.md](test-accounts.md) | 테스트 계정 |
| [INSTRUCTOR_SETTLEMENT_DATA_CHECK.md](check/INSTRUCTOR_SETTLEMENT_DATA_CHECK.md) | 강사 정산 데이터 점검 |
| [LOGO_PATH_GUIDE.md](../public/logo/LOGO_PATH_GUIDE.md) | 로고 경로 가이드 |
| [logo/README.md](../public/logo/README.md) | 로고 README |
| [README.md](../README.md) | CMS 루트 README |

### 루트 (apps/cms/) 문서 → docs/ 정리 완료
이전 루트 산재 문서는 카테고리별로 `docs/` 하위로 이동되었습니다.

---

## 11. Cursor 스킬

| 문서 | 설명 |
|------|------|
| [frontend-design/SKILL.md](../.cursor/skills/frontend-design/SKILL.md) | 프론트엔드 디자인 스킬 |
| [typescript/SKILL.md](../.cursor/skills/typescript/SKILL.md) | TypeScript 스킬 |

---

**마지막 업데이트**: 2025-02-11
