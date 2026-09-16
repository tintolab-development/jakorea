# 일반 프로그램 봉사자 신청 심사 — remote 보완 · 백엔드 요청

**작성일:** 2026-09-16  
**우선순위:** P1  
**대상:** 일반 프로그램(개인) 상세 → 봉사자 신청 목록 (1차 서류 심사 · 1차 서류 합격자 · 상세)  
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

---

## FE 연동 현황 (2026-09-16)

| 화면 | 기능 | API | 연동 |
|------|------|-----|------|
| 1차 서류 심사 | 목록 | `GET …/volunteer-applications` | 연동 |
| 1차 서류 심사 | 선택 승인/반려 | `document-result` / `document-results/bulk` | 연동 |
| 1차 서류 심사 상세 | 서류 승인/반려 | `document-result` | 연동 |
| 1차 서류 심사 상세 | 개인정보 | unmask + `memberId` | 연동 |
| 1차 서류 합격자 | 목록 | 동일 목록 API + PASS 필터 | 연동 |
| 1차 서류 합격자 | 면접 배정/재배정 | `interview-slots` + `POST /api/admin/interview-assignments` (`volunteerApplicationId`) | 연동 (가용일정 enrich는 서버 갭) |
| 1차 서류 합격자 상세 | 활동 포기 | `POST …/volunteer-applications/{id}/give-up` | 연동 |
| 1차 서류 합격자 상세 | 개인정보 | unmask | 연동 |
| 공통 상세 | 상세 GET / 승인·반려 취소 / 담당자 서류평가 | — | 미연동(API 부재) |

---

## 1) 상세 조회 API

### 요청

`GET /api/admin/volunteer-applications/{applicationId}`

권한: 목록과 동일

### 응답 최소 필드

- 신청 ID · `memberId` · 회원명
- `documentStatus` · `interviewStatus` · `finalResultStatus` · `reserveRank` · `giveUpYn`
- 마스킹 개인정보 요약
- 에세이 · 면접 가능 날짜·시간대
- 담당자 A/B 서류평가
- 배정된 면접 슬롯/일시 (`assignedInterview*`)
- `availableActions`

---

## 2) 1차 서류 합격자 — 목록 enrich · 필터

`GET /api/admin/programs/{programId}/volunteer-applications`

1. `page` / `size` / `totalElements`
2. `documentStatus` 서버 필터 (PASS만 조회)
3. 면접 가능 일정 배열(`interviewAvailability` 또는 동등)
4. `assignedInterviewSlotId` / `assignedInterviewStartAt` / `assignedInterviewEndAt`
5. `memberId` 항상 포함

---

## 3) 승인 취소 · 반려 취소 · 담당자 서류평가

| 동작 | 제안 path |
|------|-----------|
| 승인 취소 | `POST …/volunteer-applications/{id}/cancel-approval` |
| 반려 취소 | `POST …/volunteer-applications/{id}/cancel-rejection` |
| 담당자 서류평가 | `PATCH …/volunteer-applications/{id}/manager-evaluations` |

- 권한: `APPLICATION_WRITE`
- 감사로그 필수

---

## 4) 활동 포기 · 서류 결과 알림 옵션 (선택)

- `give-up` body에 알림 즉시/예약·포기 일정 옵션이 있으면 FE 모달과 맞춤
- `document-result` / bulk에 `notifyTiming` / `scheduledNotifyAt` 수용

---

## 수락 기준 (종합)

- [ ] 상세 GET으로 remote 봉사 신청 상세가 채워짐
- [ ] 1차 서류 합격자 목록의 면접 가능 일 수 = 배정 팝업 노출 일정
- [ ] 배정 후 목록에 배정 일시 반영
- [ ] 활동 포기 후 `giveUpYn`·목록 상태 일치
- [ ] 승인/반려 취소·담당자 서류평가 저장·재조회 일치
- [ ] 목록 페이지네이션·`documentStatus` 필터 동작
