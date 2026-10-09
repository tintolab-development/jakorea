# Portal 봉사현황 — 1차 서류 합격 후 `displayStatus` 미반영

**Date:** 2026-10-09  
**Status:** **BE 완료** — FE handoff:  
`JABACK/docs/frontend/mypage-volunteer-document-passed-display-status-frontend-handoff-2026-10-09.md`  
**App:** Platform `/mypage/volunteer/VOLUNTEER/{applicationId}`  
**재현 계정:** `keonhee.dev@test.com`  
**재현 신청:** `VOLUNTEER` / `applicationId=1691347`

## 요약

CMS 1차 서류 합격 시 `document_status`만 바뀌고 `application_status`가 `SUBMITTED`로 남아 Portal `displayStatus`가 「결과 대기」로 고정되던 문제.

BE 수정: `passVolunteerDocument` / `passIndividualDocument`가 **`application_status = DOCUMENT_PASSED`** 로 함께 전이.  
Portal `displayStatus: "서류 합격"` → FE 기존 매핑(`document_passed`)으로 헤더 반영. **FE 코드 변경 없음.**

## 검증

```http
GET /api/portal/me/program-applications/VOLUNTEER/1691347
```

기대: `applicationStatus: "DOCUMENT_PASSED"`, `displayStatus: "서류 합격"`.  
Platform `/mypage/volunteer/VOLUNTEER/1691347` 새로고침 → 헤더 「서류 합격」(주황).

기존 불일치 건: `scripts/db/fix_document_passed_application_status_2026-10-09.sql` (handoff 참고).

## FE

- `apps/platform/src/features/mypage/education/applications/api/mappers.ts` — `"서류 합격"` → `document_passed` 이미 지원.
