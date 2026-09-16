# 일반 프로그램 봉사자 신청 심사 — remote 보완 · 백엔드 요청

**작성일:** 2026-09-16  
**우선순위:** P1  
**대상:** 일반 프로그램(개인) 상세 → 봉사자 신청 목록 (1차 서류 심사 대상자 · 상세)  
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

---

## FE 연동 현황 (2026-09-16)

| 기능 | API | 연동 |
|------|-----|------|
| 목록 조회 | `GET /api/admin/programs/{programId}/volunteer-applications` | remote 실제 프로그램 연동 (FE seed는 mock) |
| 선택 승인/반려 (단건) | `POST …/volunteer-applications/{id}/document-result` | 연동 |
| 선택 승인/반려 (다건) | `POST …/volunteer-applications/document-results/bulk` | 연동 (2건 이상 bulk, 단건은 document-result) |
| 서류 승인/반려 (상세) | 동일 `document-result` | 연동 |
| 개인정보 상세보기 | `POST /api/admin/users/{memberId}/individual/privacy/unmask` | 연동 (`memberId` 목록 어댑터 매핑) |
| 상세 조회 | — | 목록 row로 표시 (전용 GET 없음) |
| 승인 취소 / 반려 취소 | — | mock만 |
| 담당자 서류 평가 | — | mock만 |

---

## 1) 상세 조회 API

### 요청

`GET /api/admin/volunteer-applications/{applicationId}`

권한: `APPLICATION_READ` (또는 목록과 동일 권한)

### 응답에 포함할 필드 (최소)

- 신청 ID · `memberId` · 회원명
- `documentStatus` · `interviewStatus` · `finalResultStatus` · `reserveRank` · `giveUpYn`
- 연락처·이메일·주소 등 마스킹된 개인정보 요약
- 에세이(자기소개·교육경험·필요성·JA경험)
- 면접 가능 날짜·시간대
- 담당자 A/B 서류평가 현황
- `availableActions`

### 수락 기준

- remote 신청 ID로 상세 진입 시 화면이 비지 않음
- 목록 row에 없는 에세이·평가·면접 가능일이 상세에 표시됨

---

## 2) 승인 취소 · 반려 취소

기관·개인 신청과 동일 패턴으로 봉사자 path 추가를 요청한다.

| 동작 | 제안 path |
|------|-----------|
| 승인 취소 | `POST /api/admin/volunteer-applications/{applicationId}/cancel-approval` |
| 반려 취소 | `POST /api/admin/volunteer-applications/{applicationId}/cancel-rejection` |

- 권한: `APPLICATION_WRITE`
- 담당 프로그램 범위 내만
- 감사로그 필수
- 상태: 서류 PASS → 대기 / 서류 FAIL → 대기로 복귀
- 알림 옵션(즉시·예약)이 화면에서 있으면 body로 수용

### 수락 기준

- 합격(반려) 상태에서 취소 후 1차 서류 심사 대기 목록에 재노출
- 이미 면접 배정·최종 결과 이후면 409 또는 failure 코드로 거부

---

## 3) 담당자 A/B 서류평가 저장

### 요청 (제안)

`PATCH /api/admin/volunteer-applications/{applicationId}/manager-evaluations`

```json
{
  "manager": "A",
  "evaluation": "PASS"
}
```

- `manager`: `A` | `B`
- `evaluation`: 화면 정의서와 동일 enum (예: `UNREVIEWED` / `PASS` / `FAIL` / `HOLD` — FE `GeneralManagerEvaluation`과 합의)
- 권한: `APPLICATION_WRITE`
- 감사로그 필수

### 수락 기준

- 목록·상세에서 변경한 평가가 재조회 시 유지
- A/B 독립 저장

---

## 4) 목록 enrich · 필터 · 페이지네이션

`GET /api/admin/programs/{programId}/volunteer-applications`

### 보완

1. `page` / `size` / `totalElements` 서버 페이지네이션
2. `documentStatus` 등 서버 필터 (1차 서류 대기만 조회 가능)
3. 목록 항목에 담당자 평가·연락처(마스킹)·에세이 요약·`memberId` 포함 (또는 상세 GET으로 충분하면 목록은 `memberId`·상태만 필수로 명시)

---

## 5) 서류 결과 알림 옵션

`document-result` / `document-results/bulk` body에 즉시·예약 알림 시각을 수용할 수 있으면 FE 모달 `notifyTiming`과 맞춘다.

```json
{
  "result": "PASS",
  "reason": null,
  "notifyTiming": "IMMEDIATE",
  "scheduledNotifyAt": null
}
```

미지원 시 FE는 상태만 서버에 반영하고 알림은 후속 과제로 둔다.

---

## 수락 기준 (종합)

- [ ] 상세 GET으로 remote 봉사 신청 상세가 채워짐
- [ ] 승인 취소·반려 취소 후 목록 상태 일치
- [ ] 담당자 A/B 서류평가 저장·재조회 일치
- [ ] 목록 페이지네이션·`documentStatus` 필터로 대기 건만 조회 가능
- [ ] (선택) 서류 결과 알림 옵션이 API·발송에 반영
