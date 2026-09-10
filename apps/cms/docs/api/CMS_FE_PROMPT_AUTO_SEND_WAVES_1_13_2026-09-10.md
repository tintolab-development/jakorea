# FE 수신 — 자동발송 Wave1–13 진행분 적용 2026-09-10

> 원본 BE SSOT: `JABACK/docs/frontend/CMS_FE_PROMPT_AUTO_SEND_WAVES_1_13_2026-09-10.md`  
> 매트릭스: [`CMS_FE_PROMPT_AUTO_SEND_CASE_PRIORITY_2026-09-10.md`](./CMS_FE_PROMPT_AUTO_SEND_CASE_PRIORITY_2026-09-10.md)  
> 피커 Option A: [`CMS_FE_PROMPT_ALIMTALK_PICKER_VARIABLES_OPTION_A_2026-09-10.md`](./CMS_FE_PROMPT_ALIMTALK_PICKER_VARIABLES_OPTION_A_2026-09-10.md)

## FE 반영 (2026-09-10)

- [x] OpenAPI fetch + `forms-surveys` Orval (`createFeedback` = POST `…/form-responses/{id}/feedback`)
- [x] `generate:api:forms-surveys` 스크립트 추가
- [x] CMS 인박스 `eventType` 한글 라벨 맵 (`notification-event-type-labels.ts`) + adapter 연동
  - BE QA 키 정합: `UJAT_VOLUNTEER_ATTENDANCE_STATUS_CHANGED`, `PROGRAM_PARTICIPANT_COMPLETION_NOT_COMPLETED`, Wave5 cancel 키
  - G2: `PROGRAM_NOTICE_CREATED` ≠ `ADMIN_PROGRAM_NOTICE_CREATED` (관리자 접미사)
- [x] UJAT 교육계획서·교육일지 피드백 → `useCreateFormResponseFeedbackMutation` + `formResponseId` 파이프
- [x] 일반 프로그램 과제 제출 내역 「피드백 작성」CTA (`formResponseId` / `submissionId`)
- [x] Portal GET feedback (`usePortalFormResponseFeedbackQuery`, 모달 open 시에만 enabled)
- [x] 자동발송 ALIMTALK/스케줄러 invent 없음 확인
- [x] 수동 피커 Option A 유지

### TanStack Query / CRUD

- CMS: `formResponseQueryKeys.feedback(responseId)` — create 성공 시 `setQueryData`만, form-templates/UJAT detail 광범위 invalidate 없음
- CMS: 회원 과제 제출 목록은 `member-detail-assignment-submissions` prefix만 invalidate
- Platform: `platformQueryKeys.mypage.formResponseFeedback(id)` — Class D, `enabled: feedbackOpen`

### Orval 참고

- operationId는 BE OpenAPI 기준 **`createFeedback`** (문서의 `createFormResponseFeedback` 별칭과 동일 path)
- body: `{ content: string }` max 4000
- 로컬 `backend.openapi.json` path 수: **714** (문서 x-route-count 873과 다를 수 있음 — BE info 필드 미포함 시)

## QA

- [ ] CMS 인박스: 신규 eventType이 raw 코드로 안 보임
- [ ] UJAT 문서뷰어 + `formResponseId` → 피드백 등록 200 · 상태 반영
- [ ] formResponseId 없는 mock → UI만 반영(로컬)
- [ ] 일반 과제 remote 상세 + formResponseId → 피드백 CTA
- [ ] 포털 피드백 확인 모달 — open 시에만 GET
- [ ] ALIMTALK 잔여 케이스 약속 카피 없음

## Out of scope (유지)

- 자동발송 path invent · 스케줄러 FE 토글 · SYSTEM 변수 usable 처리
- Platform 인박스 eventType 라벨 맵 (인박스 UI 미연동)
