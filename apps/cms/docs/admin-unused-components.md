# ADMIN 실접근 기준 미사용 후보 컴포넌트 (.tsx) — 인증·회원 관리 경로 제외

**출처:** [admin-used-unused-components.md](./admin-used-unused-components.md)의 미사용 항목에서, 아래 **추가 제외**를 적용한 목록입니다.
우선순위 분류는 [admin-unused-components-priority.md](./admin-unused-components-priority.md)를 참고하세요.

**1차 판정:** `canAccessPath(path, 'ADMIN') === true` 시드에서 **정적 import**만 따라간 미도달 `.tsx` ([`scripts/admin-reachable-modules.mjs`](../scripts/admin-reachable-modules.mjs)).

**추가 제외 (본 문서):** 다음 페이지를 시드로 한 **정적 import** 도달 집합에 포함되는 `.tsx`는 “로그인·회원가입·회원 관리 화면에서 실제 사용”으로 보고 목록에서 뺐습니다. 시드는 [`scripts/auth-users-reachable.mjs`](../scripts/auth-users-reachable.mjs)의 `SEED_FILES`와 동일합니다.

인증: `pages/auth/login-page.tsx`, `pages/auth/register-page.tsx`, `pages/auth/mfa-page.tsx`. 회원 관리(`/users`): `pages/users/user-list-page.tsx`, `pages/users/participant-list-page.tsx`, `pages/users/instructor-list-page.tsx`.

**별도 제외:** 경로·파일명에 `drawer`가 포함된 `.tsx`는 목록에서 제외합니다.

**스캔 범위:** `src/pages`, `src/features`, `src/widgets`, `src/entities`, `src/shared` 하위 `.tsx`.

**총 86개 파일** (미도달 114개 − 인증·`/users` 정적 도달 28개 − drawer 경로 0개). 동적 import·문자열 경로는 미반영이므로 [admin-component-inventory.md](./admin-component-inventory.md)의 한계도 적용됩니다.

*생성: 2026-03-24T05:58:12.588Z*

---

## `features/application/`

- `features/application/lib/application-helpers.tsx`

## `features/auth/`

- `features/auth/ui/session-warning-modal.tsx`

## `features/certificate-template/`

- `features/certificate-template/ui/certificate-background-upload.tsx`
- `features/certificate-template/ui/certificate-preview.tsx`
- `features/certificate-template/ui/certificate-text-fields-editor.tsx`

## `features/education-record/`

- `features/education-record/ui/education-record-list.tsx`

## `features/instructor/`

- `features/instructor/ui/instructor-detail.tsx`
- `features/instructor/ui/instructor-form.tsx`
- `features/instructor/ui/instructor-list.tsx`

## `features/permission-request/`

- `features/permission-request/ui/permission-request-review-modal.tsx`

## `features/program/`

- `features/program/ui/satisfaction-survey-modal.tsx`

## `features/school/`

- `features/school/ui/school-detail-modal.tsx`
- `features/school/ui/school-detail.tsx`
- `features/school/ui/school-form.tsx`
- `features/school/ui/settlement-detail-modal.tsx`
- `features/school/ui/teacher-basic-info-tab.tsx`
- `features/school/ui/teacher-detail-modal.tsx`
- `features/school/ui/teacher-resume-tab.tsx`
- `features/school/ui/teacher-settlement-tab.tsx`
- `features/school/ui/teacher-teaching-history-tab.tsx`

## `features/settlement/`

- `features/settlement/ui/instructor-settlement-form.tsx`
- `features/settlement/ui/settlement-calculation-summary.tsx`
- `features/settlement/ui/settlement-calendar.tsx`
- `features/settlement/ui/settlement-submit-modal.tsx`

## `features/sponsor/`

- `features/sponsor/ui/sponsor-detail.tsx`
- `features/sponsor/ui/sponsor-form.tsx`
- `features/sponsor/ui/sponsor-list.tsx`

## `features/template/`

- `features/template/ui/bulk-send-email-modal.tsx`
- `features/template/ui/bulk-send-sms-modal.tsx`
- `features/template/ui/email-template-form-modal.tsx`
- `features/template/ui/email-template-preview-modal.tsx`
- `features/template/ui/email-template-table.tsx`
- `features/template/ui/sms-template-form-modal.tsx`
- `features/template/ui/sms-template-preview-modal.tsx`
- `features/template/ui/sms-template-table.tsx`
- `features/template/ui/template-filters.tsx`

## `pages/admin/`

- `pages/admin/settings/permission-customization-page.tsx`

## `pages/education-records/`

- `pages/education-records/education-record-list-page.tsx`

## `pages/error/`

- `pages/error/error-page.tsx`
- `pages/error/forbidden-page.tsx`

## `pages/instructors/`

- `pages/instructors/instructor-detail-page.tsx`
- `pages/instructors/instructor-documents-page.tsx`
- `pages/instructors/instructor-form-page.tsx`
- `pages/instructors/instructor-list-page.tsx`
- `pages/instructors/instructor-mypage-page.tsx`
- `pages/instructors/instructor-reports-page.tsx`
- `pages/instructors/instructor-schedule-page.tsx`

## `pages/my-learning/`

- `pages/my-learning/my-learning-page.tsx`

## `pages/mypage/`

- `pages/mypage/profile-page.tsx`

## `pages/notices/`

- `pages/notices/faq-page.tsx`
- `pages/notices/inquiry-page.tsx`
- `pages/notices/notice-list-page.tsx`

## `pages/posts/`

- `pages/posts/admin-category-page.tsx`
- `pages/posts/admin-faq-page.tsx`
- `pages/posts/admin-inquiry-page.tsx`
- `pages/posts/admin-notice-list-page.tsx`

## `pages/programs/`

- `pages/programs/my-favorite-programs-page.tsx`
- `pages/programs/my-program-applications-page.tsx`
- `pages/programs/my-program-detail-page.tsx`
- `pages/programs/my-program-history-page.tsx`
- `pages/programs/my-program-list-page.tsx`
- `pages/programs/program-satisfaction-page.tsx`

## `pages/schedules/`

- `pages/schedules/my-schedule-calendar-page.tsx`
- `pages/schedules/my-schedule-detail-page.tsx`
- `pages/schedules/my-schedule-list-page.tsx`

## `pages/schools/`

- `pages/schools/school-detail-page.tsx`
- `pages/schools/school-form-page.tsx`
- `pages/schools/school-list-page.tsx`

## `pages/settlements/`

- `pages/settlements/my-monthly-settlement-page.tsx`
- `pages/settlements/my-settlement-detail-page.tsx`
- `pages/settlements/my-settlement-list-page.tsx`
- `pages/settlements/my-settlement-submission-page.tsx`

## `pages/sponsors/`

- `pages/sponsors/sponsor-detail-page.tsx`
- `pages/sponsors/sponsor-form-page.tsx`
- `pages/sponsors/sponsor-list-page.tsx`

## `pages/surveys/`

- `pages/surveys/school-my-learning-page.tsx`

## `pages/templates/`

- `pages/templates/template-email-page.tsx`
- `pages/templates/template-files-page.tsx`
- `pages/templates/template-list-page.tsx`
- `pages/templates/template-program-forms-page.tsx`
- `pages/templates/template-sms-page.tsx`

## `shared/components/`

- `shared/components/interview-status-badge.tsx`
- `shared/components/permission-button.tsx`
- `shared/components/program-category-badge.tsx`
- `shared/components/program-lifecycle-status-cell.tsx`
- `shared/components/session-format-badge.tsx`

---

## 별칭 `@/` 미참조 후보 (위 미사용 목록 중)

다른 소스 파일 본문에 `@/pages/…`, `@/features/…`, `@/shared/…` 등 **별칭 경로 문자열**이 나타나지 않는 항목입니다.

- 라우터만 동적 `import('@/pages/…')`로 묶인 **페이지**는 전형적인 **오탐**입니다.
- **상대 경로**(`./teacher-detail-modal` 등)로만 묶인 컴포넌트도 **오탐**입니다.
- 그 외는 실제 미연결(고아) 가능성이 있어 정리 후보로 보면 됩니다.

총 **11**개.

- `features/application/lib/application-helpers.tsx`
- `features/permission-request/ui/permission-request-review-modal.tsx`
- `features/school/ui/settlement-detail-modal.tsx`
- `features/school/ui/teacher-basic-info-tab.tsx`
- `features/school/ui/teacher-detail-modal.tsx`
- `features/school/ui/teacher-resume-tab.tsx`
- `features/school/ui/teacher-settlement-tab.tsx`
- `features/school/ui/teacher-teaching-history-tab.tsx`
- `shared/components/interview-status-badge.tsx`
- `shared/components/permission-button.tsx`
- `shared/components/program-lifecycle-status-cell.tsx`

---

## 갱신 방법

1. `cd apps/cms && node scripts/admin-reachable-modules.mjs`
2. `node scripts/build-admin-unused-components-doc.mjs` (본 문서)
3. 시드 변경 시 `scripts/auth-users-reachable.mjs`의 `SEED_FILES`만 수정하면 됩니다.
