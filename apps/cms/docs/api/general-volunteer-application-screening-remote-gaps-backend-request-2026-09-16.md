# 일반 프로그램 봉사자 신청 심사 — remote 보완 · 백엔드 요청

**작성일:** 2026-09-16  
**우선순위:** P1  
**대상:** 일반 프로그램(개인) 상세 → 봉사자 신청 목록 (1차 서류 심사 · 1차 서류 합격자 · 2차 면접 · 상세)  
**관련(참여자 갭):** [general-participant-application-screening-remote-gaps-backend-request-2026-09-16.md](./general-participant-application-screening-remote-gaps-backend-request-2026-09-16.md)

FE에서 즉시 가능한 연동과 별도로, **서버 계약·응답 보완이 필요한 항목**을 LNB 기준으로 정리한다.

---

## LNB 기준 remote 보완 요약

### 봉사자 신청 목록 > 1차 서류 심사 대상자

* 목록 페이지네이션·서버 필터(`documentStatus`) 보완 필요 (현재 FE 최초 50건 + 클라이언트 필터)
* 목록 응답에 담당자 A/B 서류평가·에세이·연락처 등 상세/목록 표시용 필드 부족

### 봉사자 신청 목록 > 1차 서류 심사 대상자 > 봉사자 1차 서류 심사 대상자 상세

* 상세 조회 API 부재 (`GET …/volunteer-applications/{applicationId}`)
* 승인 취소 API 부재 (`cancel-approval`)
* 반려 취소 API 부재 (`cancel-rejection`)
* 담당자 A/B 서류평가 저장 API 부재
* 상세 본문(에세이·면접 가능일·개인정보 마스킹 필드) 데이터 계약 필요
* 서류 승인/반려 알림 옵션(`notifyTiming`) `document-result` 계약 미지원

### 봉사자 신청 목록 > 1차 서류 합격자

* 면접 가능 날짜·시간(`interviewAvailability`) 데이터 부족
* 현재 면접 배정 상태·슬롯 정보(`assignedInterview*`) 목록 enrich 부족·스냅샷 검증 필요
* 목록 페이지네이션·서버 필터(`documentStatus=PASS` 등) 보완 필요

### 봉사자 신청 목록 > 1차 서류 합격자 > 봉사자 1차 서류 합격자 상세

* 상세 조회 API 부재 (`GET …/volunteer-applications/{applicationId}`)
* 상세 본문(에세이·면접 가능일·개인정보) 데이터 계약 필요
* 활동 포기 시 알림·일정 옵션 body 계약 보완 필요(화면 모달과 맞춤)

### 봉사자 신청 목록 > 2차 면접 대상자

* 목록 페이지네이션·서버 필터 보완 필요
* 면접 배정 ID(`interviewAssignmentId`)·배정 일시 enrich 부족 (면접 평가 path·목록 표시용)
* 담당자 A/B 점수 필드가 평가 API·목록에 없음 (현재 evaluations는 `scoreTotal`/`comment`만)

### 봉사자 신청 목록 > 2차 면접 대상자 > 봉사자 2차 면접 대상자 상세

* 상세 조회 API 부재
* 상세 본문·면접 평가 이력 데이터 계약 필요
* 면접 평가 request에 담당자 A/B 점수 분리 필드 부재 (FE는 합산 `scoreTotal` + remark로 전송)
* 합격/불합격 알림 옵션(`notifyTiming`) `final-result` 계약 미지원

---

## FE 연동 현황 (2026-09-16)

> FE seed 프로그램은 mock 유지. 아래는 remote 실제 프로그램 기준.  
> OpenAPI `VolunteerApplicationListItemResponse`에는 `interviewAssignmentId` / `assignedInterview*` / `interviewAvailability`가 없음 — FE는 확장 필드가 오면 매핑하나, 미제공 시 평가·일정 UI가 비거나 실패할 수 있음.

| 화면 | 기능 | API | 연동 |
|------|------|-----|------|
| 1차 서류 심사 | 목록 | `GET …/programs/{programId}/volunteer-applications` | 연동 (page=0, size=50 + FE 필터) |
| 1차 서류 심사 | 선택 승인/반려 | `document-result` / `document-results/bulk` | 연동 (2건↑ bulk) |
| 1차 서류 심사 상세 | 서류 승인/반려 · 개인정보 | `document-result` · unmask | 연동 |
| 1차 서류 심사 상세 | 승인 취소 · 반려 취소 | — | mock만 (API 부재) |
| 1차 서류 합격자 | 목록 · 면접 배정/재배정 | 목록 + `interview-slots` + `POST /api/admin/interview-assignments` | 연동 (가용일정·배정 enrich는 서버 갭) |
| 1차 서류 합격자 상세 | 활동 포기 · 개인정보 | `give-up` · unmask | 연동 |
| 2차 면접 | 목록 | 동일 목록 API | 연동 |
| 2차 면접 | 선택 합격/불합격 | `final-result` / `final-results/bulk` | 연동 (2건↑ bulk) |
| 2차 면접 | 면접일 재배정 | `interview-assignments` | 연동 |
| 2차 면접 상세 | 활동 포기 · 합격/불합격 | `give-up` · `final-result` | 연동 |
| 2차 면접 상세 | 면접 평가 | `POST …/interview-assignments/{assignmentId}/evaluations` | 부분 연동 (`interviewAssignmentId` 없으면 저장 불가) |
| 2차 면접 상세 | 개인정보 | unmask | 연동 |
| 공통 상세 | 상세 GET / 담당자 서류평가 | — | 미연동(API 부재) |

---

## 1) 상세 조회 API

`GET /api/admin/volunteer-applications/{applicationId}`

응답 최소: `memberId` · 상태 필드 · 에세이 · 면접 가능일 · 담당자 서류평가 · `interviewAssignmentId` · `assignedInterview*` · 평가 점수 · `availableActions`

---

## 2) 목록 enrich · 필터 · 페이지네이션

`GET …/programs/{programId}/volunteer-applications`

1. `page` / `size` / `totalElements`
2. `documentStatus` / 면접·최종 상태 서버 필터
3. `interviewAvailability` · `assignedInterview*` · **`interviewAssignmentId`**
4. (선택) 담당자 A/B 면접 점수·서류평가

---

## 3) 면접 평가 계약 보완

현재: `POST /api/admin/interview-assignments/{assignmentId}/evaluations`  
body: `{ scoreTotal, comment }`

요청:

- 목록/상세에 `interviewAssignmentId` 필수 제공
- (권장) `managerAScore` / `managerBScore` 분리 필드 또는 comment 규칙 문서화
- 평가 조회·재조회 시 점수 반영

---

## 4) 승인 취소 · 반려 취소 · 담당자 서류평가

| 동작 | 제안 path |
|------|-----------|
| 승인 취소 | `POST …/volunteer-applications/{id}/cancel-approval` |
| 반려 취소 | `POST …/volunteer-applications/{id}/cancel-rejection` |
| 담당자 서류평가 | `PATCH …/volunteer-applications/{id}/manager-evaluations` |

---

## 수락 기준 (종합)

- [ ] 상세 GET으로 remote 봉사 신청 상세가 채워짐
- [ ] 1차 서류 합격자: 면접 가능 일 수 = 배정 팝업
- [ ] 2차 면접: bulk PASS/FAIL/RESERVE 후 목록 상태 일치
- [ ] 면접 평가: `interviewAssignmentId`로 저장 후 재조회 점수 반영
- [ ] 면접일 재배정 후 목록 일시 갱신
- [ ] 활동 포기·give-up 상태 일치
