# 문서 이관 SSOT (2026-10-10)

EXTRACT/MERGE 후보의 고유 요약·계약 마커를 여기로 이관했다. 원문 md/mdc는 삭제한다.

- **JSON 시드 제외·유지:** `apps/cms/docs/api/settlement-item-settings-seed.payload.json` 등
- **KEEP_REFERENCE 유지:** 계약 밀도가 높은 BE 요청 문서 (삭제 안 함)
- **유지:** `apps/cms/docs/requirements-specification/progress.md`

## 그룹 파일

- [`admin-seeds.md`](./admin-seeds.md) — Admin 시드·연동 프롬프트 이관 SSOT (8 sources)
- [`cms-api-gaps.md`](./cms-api-gaps.md) — CMS API gaps·conversion·settlement dummy(md) 이관 SSOT (21 sources)
- [`program-dummy-seeds.md`](./program-dummy-seeds.md) — Program dummy seeds·gaps 이관 SSOT (10 sources)
- [`cms-autosend-notif.md`](./cms-autosend-notif.md) — CMS auto-send·알림 QA 이관 SSOT (5 sources)
- [`cms-mock-rules.md`](./cms-mock-rules.md) — CMS api-spec-mock·스타일 위임 이관 SSOT (4 sources)
- [`cms-impl-design-qa.md`](./cms-impl-design-qa.md) — CMS design·implementation·QA 이관 SSOT (4 sources)
- [`mvp-roadmap.md`](./mvp-roadmap.md) — MVP·roadmap 이관 SSOT (progress.md는 원본 유지) (8 sources)
- [`admin-platform-kit.md`](./admin-platform-kit.md) — admin-platform-kit 중간검증 이관 SSOT (6 sources)
- [`claude-guides.md`](./claude-guides.md) — docs/claude 가이드 이관 SSOT (2 sources)
- [`platform-misc.md`](./platform-misc.md) — Platform 이관 SSOT (1 sources)
- [`merge-rules.md`](./merge-rules.md) — CMS coding rule wrappers 이관 기록 (canonical=모노레포 루트 규칙) (3 sources)

## 삭제된 원본 수

- 삭제: **72**
- 이미 없음: 0
- KEEP 유지(이관 대상에서 제외): 22 paths in policy set

## 삭제 목록

- `apps/admin/docs/api/site-management-platform-seed-backend-cursor-prompt-2026-09-23.md`
- `apps/admin/docs/api/site-management-platform-seed-backend-cursor-prompt-2026-09-25.md`
- `apps/admin/docs/api/site-management-seed-2026-09-23.md`
- `apps/admin/docs/api/directions-dummy-seed-backend-request.md`
- `apps/admin/docs/api/education-platform-seed-backend-cursor-prompt-2026-09-20.md`
- `apps/admin/docs/api/people-dummy-seed-backend-request.md`
- `apps/admin/docs/api/recruit-guide-platform-seed-backend-cursor-prompt-2026-09-25.md`
- `apps/admin/docs/api/site-management-seed-ready-frontend-cursor-prompt-2026-09-25.md`
- `apps/cms/docs/api/settlement-item-settings-dummy-seed-backend-request.md`
- `apps/cms/docs/api/data-management-api-backend-gaps.md`
- `apps/cms/docs/api/forms-surveys-api-backend-gaps.md`
- `apps/cms/docs/api/gemini-recruitment-patch-invalid-value-instant-backend-prompt-2026-09-30.md`
- `apps/cms/docs/api/logs-api-backend-gaps.md`
- `apps/cms/docs/api/logs-api-conversion-status-backend-handoff.md`
- `apps/cms/docs/api/posts-api-backend-gaps.md`
- `apps/cms/docs/api/programs-api-backend-gaps-consolidated.md`
- `apps/cms/docs/api/programs-api-backend-gaps.md`
- `apps/cms/docs/api/programs-api-conversion-roadmap.md`
- `apps/cms/docs/api/programs-api-remaining-work.md`
- `apps/cms/docs/api/programs-company-school-detail-api-conversion-status.md`
- `apps/cms/docs/api/programs-detail-api-conversion-status.md`
- `apps/cms/docs/api/programs-gemini-performance-api-conversion-status.md`
- `apps/cms/docs/api/programs-gemini-visiting-training-api-conversion-status.md`
- `apps/cms/docs/api/programs-trained-teachers-api-conversion-status.md`
- `apps/cms/docs/api/programs-ujat-detail-api-conversion-status.md`
- `apps/cms/docs/api/programs-ujat-education-regions-api-conversion-status.md`
- `apps/cms/docs/api/settlement-api-backend-gaps.md`
- `apps/cms/docs/api/templates-api-conversion-status-backend-handoff.md`
- `apps/cms/docs/api/trained-teacher-registration-flow-backend-prompt-2026-09-18.md`
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/00-fe-mock-id-map-and-rules.md`
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/01-general-program-dummy-seed.md`
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/02-company-school-dummy-seed.md`
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/03-ujat-program-dummy-seed.md`
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/04-trained-teachers-dummy-seed.md`
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/05-nested-child-data-dummy-seed.md`
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/06-gemini-dummy-seed.md`
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/README-BE.md`
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/programs-api-backend-gaps-consolidated.md`
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/programs-seed-case-api-coverage-backend-handoff-2026-07-30.md`
- `apps/cms/docs/api/CMS_FE_PROMPT_AUTO_SEND_CASE_PRIORITY_2026-09-10.md`
- `apps/cms/docs/api/CMS_FE_PROMPT_AUTO_SEND_WAVES_1_13_2026-09-10.md`
- `apps/cms/docs/api/CMS_FE_PROMPT_TEMPLATE_VARIABLES_ENABLED_ENRICH_2026-09-09.md`
- `apps/cms/docs/api/notification-send-selectable-not-success-qa-2026-09-11.md`
- `apps/cms/docs/api/notification-sms-nhn-catalog-crud-qa-2026-09-11.md`
- `apps/cms/.cursor/rules/data/api-spec-mock.md`
- `apps/cms/.cursor/rules/process/styling-token-refactor-delegation.md`
- `apps/cms/docs/api/api-spec-mock-detailed.md`
- `apps/cms/docs/api/api-spec-mock-extended.md`
- `apps/cms/docs/design/dashboard-program-progress-improvement.md`
- `apps/cms/docs/implementation/rich-text-editor-tiptap-migration.md`
- `apps/cms/docs/implementation/template-form-draft-local-save.md`
- `apps/cms/docs/qa/form-template-fe-gap-report.md`
- `apps/cms/docs/requirements-specification/MVP/README.md`
- `apps/cms/docs/requirements-specification/MVP/phases-frontend-mock.md`
- `apps/cms/docs/requirements-specification/MVP/v0.1-foundation.md`
- `apps/cms/docs/requirements-specification/MVP/v0.2-front-core.md`
- `apps/cms/docs/requirements-specification/MVP/v0.3-admin-ops.md`
- `apps/cms/docs/requirements-specification/MVP/v0.4-settlement-report.md`
- `apps/cms/docs/requirements-specification/MVP/v0.5-security-compliance.md`
- `apps/cms/docs/roadmap/MVP_ROADMAP_V4_DETAILED.md`
- `docs/admin-platform-kit/05-frontend-architecture-cursor-crosscheck.md`
- `docs/admin-platform-kit/08-gpt-handoff-generic-cms-new-project.md`
- `docs/admin-platform-kit/11-review-gpt-impl-plan-10.md`
- `docs/admin-platform-kit/13-revalidate-doc-12.md`
- `docs/admin-platform-kit/15-consensus-doc-14.md`
- `docs/admin-platform-kit/17-accept-doc-16-and-10r1.md`
- `docs/claude/CMS_QA_CHECKLIST.md`
- `docs/claude/CURSOR_REFACTORING_GUIDE.md`
- `apps/platform/docs/api/instructor-schedule-options-program-186048-verification-backend-cursor-prompt-2026-10-06.md`
- `apps/cms/.cursor/rules/coding/react-component-render-as-jsx.mdc`
- `apps/cms/.cursor/rules/coding/react-hooks-after-early-return.mdc`
- `apps/cms/.cursor/rules/coding/rich-text-compose-input-perf.mdc`
