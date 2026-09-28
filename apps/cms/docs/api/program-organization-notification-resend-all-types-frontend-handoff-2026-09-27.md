# FE 핸드오프 반영 — 기관 신청 결과 알림 재발송 (전 유형)

| 항목 | 값 |
|------|-----|
| **상태** | ✅ FE 연동 (2026-09-27) |
| **BE handoff** | `JABACK/docs/frontend/program-organization-notification-resend-all-types-frontend-handoff-2026-09-27.md` |
| **BE 요청 SSOT** | [`program-organization-application-notification-resend-all-types-backend-prompt-2026-09-27.md`](./program-organization-application-notification-resend-all-types-backend-prompt-2026-09-27.md) |

## Path 매핑 (FE)

| 유형 | Path | FE 진입 |
|------|------|---------|
| GENERAL · COMPANY_SCHOOL · UJAT 그룹 | `POST …/organization-applications/{id}/notifications/resend` | `applications-api-client` · `ApplicantList` (`applicationsRemote`) |
| TRAINED_TEACHER | `POST …/programs/{programId}/trained-teacher/organization-applications/{id}/notifications/resend` | `trained-teachers/api/organization-applications-*` · TT surface 게이트 |
| GEMINI / GEMINI_TRAINING | `POST …/gemini/trainings/organization-applications/{id}/notifications/resend` | `gemini/api/visiting-training/*` · 기관 신청 탭 |

공통 path에 TT·Gemini id를 넣지 않는다.

## FE 변경 요약

1. OpenAPI merge + dashboard subset에 공통·TT·Gemini resend path 포함 · Orval 재생성
2. TT: client/service/hook · adapter `resultNotificationSentAt`/`RESEND_NOTIFICATION` · `use-applicants-detail` TT 전용 호출
3. GENERAL/1사1교: 기존 공통 path 유지 (BE allowlist 확장 수용)
4. Gemini: resend client/service · 목록 필드 매핑 · `RESEND_NOTIFICATION` 시 「알림 재발송」+ 모달
5. 버튼은 `availableActions`의 `RESEND_NOTIFICATION` 기준

## UJAT UI

UJAT 기관 신청은 shared `ApplicantList`가 아닐 수 있다.  
공통 path·DTO 투영은 BE가 열었고, 일반/1사1교와 동일 remote를 쓰는 표면에서는 자동 연결된다.  
UJAT 전용 기관 상세에 재발송 CTA가 없으면 별도 UI 작업이 남을 수 있다.

**Last updated:** 2026-09-27
