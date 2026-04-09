# ADMIN 실접근 기준 사용 중 / 미사용 컴포넌트 목록

**기준:** `canAccessPath(path, 'ADMIN') === true` 인 화면에 대응하는 페이지·레이아웃 시드에서 **정적 import**만 따라간 도달 집합( [`scripts/admin-reachable-modules.mjs`](../scripts/admin-reachable-modules.mjs) ).

| 구분                              | .tsx 개수 |
| --------------------------------- | --------- |
| 사용 중 (도달 가능)               | 174       |
| 미사용 후보 (스캔 범위 내 미도달) | 114       |

스캔 범위: `src/pages`, `src/features`, `src/widgets`, `src/entities`, `src/shared` 하위 `.tsx`.

---

## 사용 중 컴포넌트 (.tsx)

총 **174**개 파일.

> 판정 기준·한계는 [admin-component-inventory.md](./admin-component-inventory.md)를 참고하세요.

### `features/application/`

- `features/application/ui/application-form-modal.tsx`
- `features/application/ui/application-form.tsx`
- `features/application/ui/duplicate-application-alert.tsx`
- `features/application/ui/dynamic-application-form.tsx`
- `features/application/ui/dynamic-form-fields.tsx`
- `features/application/ui/individual-application-form.tsx`
- `features/application/ui/instructor-application-form.tsx`
- `features/application/ui/school-application-form.tsx`

### `features/application-path/`

- `features/application-path/ui/application-path-form.tsx`

### `features/dashboard/`

- `features/dashboard/ui/active-program-card.tsx`
- `features/dashboard/ui/application-statistics-card.tsx`
- `features/dashboard/ui/customer-inquiry-status-widget.tsx`
- `features/dashboard/ui/dashboard-settings-modal.tsx`
- `features/dashboard/ui/dashboard-toolbar.tsx`
- `features/dashboard/ui/dashboard-widget-renderer.tsx`
- `features/dashboard/ui/dashboard-widget-skeleton.tsx`
- `features/dashboard/ui/kpi-achievement-widget.tsx`
- `features/dashboard/ui/matching-statistics-card.tsx`
- `features/dashboard/ui/menu-shortcut-widget.tsx`
- `features/dashboard/ui/monthly-application-card.tsx`
- `features/dashboard/ui/monthly-settlement-card.tsx`
- `features/dashboard/ui/my-activity-summary.tsx`
- `features/dashboard/ui/my-application-summary.tsx`
- `features/dashboard/ui/my-volunteer-activity-summary.tsx`
- `features/dashboard/ui/notification-dropdown.tsx`
- `features/dashboard/ui/notification-modal.tsx`
- `features/dashboard/ui/notification-widget.tsx`
- `features/dashboard/ui/overall-program-progress-card.tsx`
- `features/dashboard/ui/overall-statistics-cards.tsx`
- `features/dashboard/ui/pending-action-card.tsx`
- `features/dashboard/ui/pending-actions-alert.tsx`
- `features/dashboard/ui/pending-actions-row.tsx`
- `features/dashboard/ui/pending-applications-card.tsx`
- `features/dashboard/ui/pending-matchings-card.tsx`
- `features/dashboard/ui/pending-settlements-card.tsx`
- `features/dashboard/ui/pending-tasks-list.tsx`
- `features/dashboard/ui/program-detail-progress-widget.tsx`
- `features/dashboard/ui/program-progress-tabs-table.tsx`
- `features/dashboard/ui/program-schedule-widget.tsx`
- `features/dashboard/ui/program-statistics-card.tsx`
- `features/dashboard/ui/program-status-widget.tsx`
- `features/dashboard/ui/progress-stages-widget.tsx`
- `features/dashboard/ui/progress-step-bar.tsx`
- `features/dashboard/ui/recruitment-status-widget.tsx`
- `features/dashboard/ui/settlement-statistics-card.tsx`
- `features/dashboard/ui/sortable-widget-slot.tsx`
- `features/dashboard/ui/statistics-card.tsx`
- `features/dashboard/ui/unified-activity-feed.tsx`
- `features/dashboard/ui/upcoming-schedules-list.tsx`
- `features/dashboard/ui/volunteer-pending-tasks-list.tsx`
- `features/dashboard/ui/widget-title-with-handle.tsx`

### `features/instructor-application/`

- `features/instructor-application/ui/manual-assignment-modal.tsx`

### `features/program/`

- `features/program/ui/add-instructor-career-section.tsx`
- `features/program/ui/add-instructor-education-section.tsx`
- `features/program/ui/add-instructor-modal.tsx`
- `features/program/ui/add-instructor-native-select.tsx`
- `features/program/ui/add-manager-modal.tsx`
- `features/program/ui/add-student-modal.tsx`
- `features/program/ui/applicant-instructor-detail-modal.tsx`
- `features/program/ui/approval-alarm-send-section.tsx`
- `features/program/ui/assignment-preview-modal.tsx`
- `features/program/ui/assignment-submission-modal.tsx`
- `features/program/ui/basic-info-section.tsx`
- `features/program/ui/constants/program-list-columns.tsx`
- `features/program/ui/curriculum-section.tsx`
- `features/program/ui/detail-info-section.tsx`
- `features/program/program-detail/ui/applicant-list/applicant-calendar-view.tsx`
- `features/program/program-detail/ui/applicant-list/applicant-institution-basic-info.tsx`
- `features/program/program-detail/ui/applicant-list/applicant-institution-instructor-assign-tab.tsx`
- `features/program/program-detail/ui/applicant-list/applicant-instructor-basic-info.tsx`
- `features/program/program-detail/ui/applicant-list/applicant-instructor-resume.tsx`
- `features/program/program-detail/ui/applicant-list/applicant-schedule-list.tsx`
- `features/program/program-detail/ui/applicant-list/applicants-detail-contents.tsx`
- `features/program/program-detail/ui/applicant-list/applicant-list.tsx`
- `shared/ui/detail-modal-sidebar.tsx`
- `features/program/ui/edit-manager-role-modal.tsx`
- `features/program/ui/enrollment-status-detail-modal.tsx`
- `features/program/ui/enrollment-status-table.tsx`
- `features/program/ui/form-field-editor.tsx`
- `features/program/ui/instructor-detail-info-section.tsx`
- `features/program/ui/instructor-recruitment-detail-modal.tsx`
- `features/program/ui/instructor-recruitment-section.tsx`
- `features/program/ui/lecture-attendance-modal.tsx`
- `features/program/ui/manager-delete-guide-modal.tsx`
- `features/program/ui/participant-recruitment-section.tsx`
- `features/program/ui/participating-institutions-calendar-view.tsx`
- `features/program/ui/participating-institutions-section.tsx`
- `features/program/ui/participating-instructors-section.tsx`
- `features/program/ui/program-applicants-tab.tsx`
- `features/program/ui/program-application-card.tsx`
- `features/program/ui/program-application-path-tab.tsx`
- `features/program/ui/program-basic-info-tab.tsx`
- `features/program/ui/program-calendar-view.tsx`
- `features/program/ui/program-detail-drawer.tsx`
- `features/program/ui/program-detail-fullpage-modal.tsx`
- `features/program/ui/program-detail-info-tab.tsx`
- `features/program/ui/program-education-record-tab.tsx`
- `features/program/ui/program-form.tsx`
- `features/program/ui/program-info-card.tsx`
- `features/program/ui/program-kpi-target-section.tsx`
- `features/program/ui/program-lifecycle-workflow.tsx`
- `features/program/ui/program-list.tsx`
- `features/program/ui/program-managers-tab.tsx`
- `features/program/ui/program-mini-calendar.tsx`
- `features/program/ui/program-progress-tab.tsx`
- `features/program/ui/program-rounds-tab.tsx`
- `features/program/ui/program-schedule-list.tsx`
- `features/program/ui/program-schedule-summary-card.tsx`
- `features/program/ui/school-detail-add-instructor-assign-modal.tsx`
- `features/program/ui/school-detail-assign-complete-modal.tsx`
- `features/program/ui/school-detail-assign-overflow-modal.tsx`
- `features/program/ui/school-detail-fullpage-view.tsx`
- `features/program/ui/school-detail-modal.tsx`
- `features/program/ui/school-detail-new-assign-guide-modal.tsx`
- `features/program/ui/school-detail-select-assign-confirm-modal.tsx`
- `features/program/ui/school-detail-student-list-section.tsx`
- `features/program/ui/school-detail-unassign-confirm-modal.tsx`
- `features/program/ui/status-dropdown-cell.tsx`
- `features/program/ui/table/program-table-column-resolver.tsx`
- `features/program/ui/volunteer-detail-info-section.tsx`
- `features/program/ui/volunteer-recruitment-section.tsx`

### `features/user/`

- `features/user/ui/enrollment-program-detail-posts-tab.tsx`
- `features/user/ui/post-detail-modal.tsx`
- `features/user/ui/post-write-modal.tsx`

### `pages/dashboard.tsx/`

- `pages/dashboard.tsx`

### `pages/error/`

- `pages/error/coming-soon-page.tsx`

### `pages/home/`

- `pages/home/index-page.tsx`

### `pages/programs/`

- `pages/programs/education-enrollment-page.tsx`
- `pages/programs/education-program-layout.tsx`
- `pages/programs/program-application-complete-page.tsx`
- `pages/programs/program-application-page.tsx`
- `pages/programs/program-detail-page.tsx`
- `pages/programs/program-form-page.tsx`
- `pages/programs/program-list-modals.tsx`
- `pages/programs/program-list-page.tsx`

### `shared/components/`

- `shared/components/app-status-badge.tsx`
- `shared/components/approval-status-badge.tsx`
- `shared/components/divider.tsx`
- `shared/ui/icons/ProfileAvatarIcon.tsx`
- `shared/components/program-lifecycle-status-badge.tsx`
- `shared/components/program-lifecycle-status-text.tsx`
- `shared/components/schedule-change-history-badge.tsx`
- `shared/components/settlement-status-badge.tsx`
- `shared/components/status-dropdown-cell.tsx`
- `shared/components/textbook-status-badge.tsx`

### `shared/config/`

- `shared/config/menu-config.tsx`

### `shared/lib/`

- `shared/lib/auth/auth-context.tsx`

### `shared/ui/`

- `shared/ui/app-breadcrumb.tsx`
- `shared/ui/app-button.tsx`
- `shared/ui/base-detail-drawer.tsx`
- `shared/ui/confirm-modal.tsx`
- `shared/ui/content-modal.tsx`
- `shared/ui/editable-cell.tsx`
- `shared/ui/empty-state.tsx`
- `shared/ui/file-select-field.tsx`
- `shared/ui/guide-message.tsx`
- `shared/ui/icons/LogoutIcon.tsx`
- `shared/ui/inquiry-modal.tsx`
- `shared/ui/labeled-search-input.tsx`
- `shared/ui/list-page-filters.tsx`
- `shared/ui/page-header.tsx`
- `shared/ui/profile-edit-modal.tsx`
- `shared/ui/recruitment-status-badge.tsx`
- `shared/ui/role-badge.tsx`
- `shared/ui/segmented-tab.tsx`
- `shared/ui/single-cta.tsx`
- `shared/ui/status-badge.tsx`
- `shared/ui/status-display.tsx`
- `shared/ui/teal-header-modal.tsx`
- `shared/ui/unified-filter-card.tsx`

### `widgets/layout/`

- `widgets/layout/header.tsx`
- `widgets/layout/layout.tsx`
- `widgets/layout/main-header.tsx`
- `widgets/layout/sidebar.tsx`

---

## 미사용 후보 컴포넌트 (.tsx)

총 **114**개 파일.

> 판정 기준·한계는 [admin-component-inventory.md](./admin-component-inventory.md)를 참고하세요.

### `features/application/`

- `features/application/lib/application-helpers.tsx`

### `features/auth/`

- `features/auth/ui/mfa-action-buttons.tsx`
- `features/auth/ui/mfa-modal-header.tsx`
- `features/auth/ui/mfa-otp-input.tsx`
- `features/auth/ui/mfa-otp-status.tsx`
- `features/auth/ui/mfa-verification-modal.tsx`
- `features/auth/ui/phone-verification-form.tsx`
- `features/auth/ui/session-warning-modal.tsx`
- `features/auth/ui/social-login-form.tsx`
- `features/auth/ui/social-register-form.tsx`

### `features/certificate-template/`

- `features/certificate-template/ui/certificate-background-upload.tsx`
- `features/certificate-template/ui/certificate-preview.tsx`
- `features/certificate-template/ui/certificate-text-fields-editor.tsx`

### `features/download/`

- `features/download/ui/download-options-modal.tsx`

### `features/education-record/`

- `features/education-record/ui/education-record-list.tsx`

### `features/instructor/`

- `features/instructor/ui/instructor-detail.tsx`
- `features/instructor/ui/instructor-form.tsx`
- `features/instructor/ui/instructor-list.tsx`

### `features/instructor-list/`

- `features/instructor-list/ui/instructor-list.tsx`

### `features/participant/`

- `features/participant/ui/participant-list.tsx`

### `features/permission-request/`

- `features/permission-request/ui/permission-request-button.tsx`
- `features/permission-request/ui/permission-request-modal.tsx`
- `features/permission-request/ui/permission-request-review-modal.tsx`

### `features/program/`

- `features/program/ui/satisfaction-survey-modal.tsx`

### `features/school/`

- `features/school/ui/school-detail-modal.tsx`
- `features/school/ui/school-detail.tsx`
- `features/school/ui/school-form.tsx`
- `features/school/ui/settlement-detail-modal.tsx`
- `features/school/ui/teacher-basic-info-tab.tsx`
- `features/school/ui/teacher-detail-modal.tsx`
- `features/school/ui/teacher-resume-tab.tsx`
- `features/school/ui/teacher-settlement-tab.tsx`
- `features/school/ui/teacher-teaching-history-tab.tsx`

### `features/settlement/`

- `features/settlement/ui/instructor-settlement-form.tsx`
- `features/settlement/ui/settlement-calculation-summary.tsx`
- `features/settlement/ui/settlement-calendar.tsx`
- `features/settlement/ui/settlement-submit-modal.tsx`

### `features/sponsor/`

- `features/sponsor/ui/sponsor-detail.tsx`
- `features/sponsor/ui/sponsor-form.tsx`
- `features/sponsor/ui/sponsor-list.tsx`

### `features/template/`

- `features/template/ui/bulk-send-email-modal.tsx`
- `features/template/ui/bulk-send-sms-modal.tsx`
- `features/template/ui/email-template-form-modal.tsx`
- `features/template/ui/email-template-preview-modal.tsx`
- `features/template/ui/email-template-table.tsx`
- `features/template/ui/sms-template-form-modal.tsx`
- `features/template/ui/sms-template-preview-modal.tsx`
- `features/template/ui/sms-template-table.tsx`
- `features/template/ui/template-filters.tsx`

### `features/user/`

- `features/user/ui/enrollment-program-detail-modal.tsx`
- `features/user/ui/enrollment-program-detail-submissions-tab.tsx`
- `features/user/ui/enrollment-program-detail-view.tsx`
- `features/user/ui/user-create-form.tsx`
- `features/user/ui/user-detail-fullpage-modal.tsx`
- `features/user/ui/user-list.tsx`
- `features/user/ui/user-role-change-modal.tsx`

### `pages/admin/`

- `pages/admin/settings/permission-customization-page.tsx`

### `pages/auth/`

- `pages/auth/login-page.tsx`
- `pages/auth/mfa-page.tsx`
- `pages/auth/register-page.tsx`

### `pages/education-records/`

- `pages/education-records/education-record-list-page.tsx`

### `pages/error/`

- `pages/error/error-page.tsx`
- `pages/error/forbidden-page.tsx`

### `pages/instructors/`

- `pages/instructors/instructor-detail-page.tsx`
- `pages/instructors/instructor-documents-page.tsx`
- `pages/instructors/instructor-form-page.tsx`
- `pages/instructors/instructor-list-page.tsx`
- `pages/instructors/instructor-mypage-page.tsx`
- `pages/instructors/instructor-reports-page.tsx`
- `pages/instructors/instructor-schedule-page.tsx`

### `pages/my-learning/`

- `pages/my-learning/my-learning-page.tsx`

### `pages/mypage/`

- `pages/mypage/profile-page.tsx`

### `pages/notices/`

- `pages/notices/faq-page.tsx`
- `pages/notices/inquiry-page.tsx`
- `pages/notices/notice-list-page.tsx`

### `pages/posts/`

- `pages/posts/admin-category-page.tsx`
- `pages/posts/admin-faq-page.tsx`
- `pages/posts/admin-inquiry-page.tsx`
- `pages/posts/admin-notice-list-page.tsx`

### `pages/programs/`

- `pages/programs/my-favorite-programs-page.tsx`
- `pages/programs/my-program-applications-page.tsx`
- `pages/programs/my-program-detail-page.tsx`
- `pages/programs/my-program-history-page.tsx`
- `pages/programs/my-program-list-page.tsx`
- `pages/programs/program-satisfaction-page.tsx`

### `pages/schedules/`

- `pages/schedules/my-schedule-calendar-page.tsx`
- `pages/schedules/my-schedule-detail-page.tsx`
- `pages/schedules/my-schedule-list-page.tsx`

### `pages/schools/`

- `pages/schools/school-detail-page.tsx`
- `pages/schools/school-form-page.tsx`
- `pages/schools/school-list-page.tsx`

### `pages/settlements/`

- `pages/settlements/my-monthly-settlement-page.tsx`
- `pages/settlements/my-settlement-detail-page.tsx`
- `pages/settlements/my-settlement-list-page.tsx`
- `pages/settlements/my-settlement-submission-page.tsx`

### `pages/sponsors/`

- `pages/sponsors/sponsor-detail-page.tsx`
- `pages/sponsors/sponsor-form-page.tsx`
- `pages/sponsors/sponsor-list-page.tsx`

### `pages/surveys/`

- `pages/surveys/school-my-learning-page.tsx`

### `pages/templates/`

- `pages/templates/template-email-page.tsx`
- `pages/templates/template-files-page.tsx`
- `pages/templates/template-list-page.tsx`
- `pages/templates/template-program-forms-page.tsx`
- `pages/templates/template-sms-page.tsx`

### `pages/users/`

- `pages/users/instructor-list-page.tsx`
- `pages/users/participant-list-page.tsx`
- `pages/users/user-list-page.tsx`

### `shared/components/`

- `shared/ui/icons/GoogleMarkIcon.tsx`
- `shared/components/interview-status-badge.tsx`
- `shared/components/permission-button.tsx`
- `shared/components/program-category-badge.tsx`
- `shared/components/program-enrollment-status-badge.tsx`
- `shared/components/program-lifecycle-status-cell.tsx`
- `shared/components/session-format-badge.tsx`

---

## 갱신 방법

이 파일은 아래 명령으로 `admin-reachable-graph-output.json`과 함께 갱신됩니다.

```bash
cd apps/cms && node scripts/admin-reachable-modules.mjs
```
