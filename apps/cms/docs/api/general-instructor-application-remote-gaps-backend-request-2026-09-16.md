# 일반 프로그램 강사 신청 — remote 보완 · 백엔드 요청

**작성일:** 2026-09-16
**최종 검토:** 2026-09-16 (OpenAPI `backend.openapi.json` 재대조)
**우선순위:** P1
**대상:** 일반 프로그램 상세 → 강사 신청 목록 · 강사 신청 상세
**범위:** 일반 프로그램 기관·개인 참여 모드의 **강사 신청** (Gemini 강사 신청 API와 별도)
**관련:** [programs-api-integration.md](./programs-api-integration.md)

---

## 서버 전달 필요 여부 (결론)

| 구분 | 서버 전달? | 비고 |
|------|:---:|------|
| 목록 GET / 상세 GET / 승인·반려 / bulk / 승인·반려 취소 / 알림 재발송 / 코멘트 PATCH | **불필요** (이미 OpenAPI path·구현완료) | **FE 연동**이 병목 |
| 목록 페이지네이션·`status` 필터 안정성 · `availableActions` 값 계약 | **선택 (P2 확인)** | FE가 쓰기 전 BE 동작 스모크만 요청 |
| 승인 `assignments[].scheduleId` ↔ 강의배정 모달 슬롯 매핑 | **P1 확인** | FE 슬롯에 `scheduleId`/`organizationApplicationId` 없으면 approve body에 배정 불가 |
| 정보 수정(강의비·기본정보 전체 PATCH) | **필요 시 P2** | 현재 PATCH는 `managerComment`만 |

**이전 문서의 「상세 GET / cancel-approval / cancel-rejection / 코멘트 API 부재」는 폐기.**
OpenAPI에 이미 존재하며 FE 미배선이 원인입니다.

---

## OpenAPI 기준 API 현황 (2026-09-16)

| Method | Path | FE |
|--------|------|-----|
| GET | `/api/admin/programs/{programId}/instructor-applications` | ✅ 목록 remote (`page=0,size=50` 고정 · `status` 미전달) |
| GET | `/api/admin/instructor-applications/{applicationId}` | 🔄 FE 연동 진행 |
| PATCH | `/api/admin/instructor-applications/{applicationId}` (`managerComment`) | 🔄 FE 연동 진행 |
| POST | `…/{id}/approve` body `Approval` (`assignments`, `feePolicy`, `notification`) | 🔄 bare→body 연동 진행 |
| POST | `…/{id}/reject` body `Rejection` (`reason`, `notification`) | ⚠️ `reason`만 전송 (알림 옵션 보완) |
| POST | `…/bulk-approve` (`ids`) | ✅ |
| POST | `…/bulk-reject` (`ids`, `reason`) | ✅ |
| POST | `…/{id}/cancel-approval` (`Cancellation`) | 🔄 FE 연동 진행 |
| POST | `…/{id}/cancel-rejection` (`Cancellation`) | 🔄 FE 연동 진행 |
| POST | `…/{id}/notifications/resend` (`Notification`) | 🔄 FE 연동 진행 |

별도: `POST /api/admin/programs/{programId}/instructor-assignments` — 진행현황 배정용. 신청 승인 플로우와는 `Approval.assignments`가 SSOT.

---

## LNB 기준 — 남은 gap

### 강사 신청 목록

- FE adapter가 목록 DTO enrich 필드를 비워 둠 → **FE 매핑 수정** (서버 요청 아님)
  - `homeAddress` · `jaLectureExperienceYears` · `jaEvaluationGrade` · `contact` · `email` · `availableActions` · `availableScheduleMemo`
- 페이지네이션: FE 50건 고정 → 서버 `totalElements`/`totalPages` 스모크 후 FE 페이지 연동 (P2)
- 서버 `status` query: OpenAPI 있음, FE 미사용(클라 필터) — 정렬만 맞으면 서버 전달 불필요

### 강사 신청 상세

- 상세 GET 미호출 → **FE 연동**
- 승인 시 `feePolicy`·`notification` 미전송 → **FE 연동**
- 승인 시 `assignments` — 모달 슬롯에 `scheduleId` 없으면 빈 배열. **BE/FE: 목록·상세 `availableScheduleSlots` 또는 기관 schedule id를 모달에 실을 계약 확인**
- 정보 수정(강의비 등): PATCH가 코멘트만 → UI는 API 없음 안내(`program-api-unavailable`) 또는 P2 PATCH 확장
- unmask: `instructorMemberId` + member unmask 호출은 됨. 응답→상세 필드 재채우기는 계약 확인 후 FE

---

## FE 즉시 연동 (본 라운드)

- [x] 목록 조회 remote
- [x] 단건/일괄 승인·반려
- [ ] 목록 DTO 필드 매핑
- [ ] 상세 GET + 코멘트 PATCH
- [ ] 승인 취소 · 반려 취소 · 알림 재발송
- [ ] 승인 body (`feePolicy` · `notification` · 가능 시 `assignments`)
- [ ] mock 로컬 patch 제거 → remote 실패/미지원 시 `notifyProgramApiUnavailable`

---

## 수락 기준

- [ ] 목록에 주소·JA 강의 경력·JA 평가 등급·연락처 표시 (DTO 매핑)
- [ ] 상세 진입 시 GET detail로 프로필·희망 일정·코멘트 표시
- [ ] 승인 취소·반려 취소·알림 재발송·코멘트 저장이 remote로 반영
- [ ] 상세 승인 시 fee/notification이 서버에 저장
- [ ] 강의 배정 `scheduleId` 매핑 가능 시 assignments 영속화
- [ ] API 없는 정보 수정은 mock 없이 API 연동 안내 모달

**Last updated:** 2026-09-16
