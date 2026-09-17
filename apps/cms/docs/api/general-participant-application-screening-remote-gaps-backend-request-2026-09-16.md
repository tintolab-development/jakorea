# 일반 프로그램 참여자 신청 심사 — remote 보완 · 백엔드 요청

**작성일:** 2026-09-16  
**우선순위:** P1  
**대상:** 일반 프로그램 상세 → 참여자 신청 목록 (1차 서류 심사 · 1차 서류 합격자 · 상세)  
**관련(기완료 배선):** [general-individual-application-screening-api-backend-request-2026-09-15.md](./general-individual-application-screening-api-backend-request-2026-09-15.md)  
**시드(별도 SSOT):** [general-program-remote-db-full-graph-seed-backend-request-2026-09-16.md](./general-program-remote-db-full-graph-seed-backend-request-2026-09-16.md)

FE에서 즉시 가능한 연동(상세 row 전달 · 승인/반려·document-result 호출 · unmask · 기존 슬롯 재사용)과 별도로, **서버 계약·응답 보완이 필요한 항목**을 LNB 기준으로 정리한다.

---

## LNB 기준 remote 보완 요약

### 참여자 신청 목록 > 참여자 1차 서류 심사 대상자

- 승인/반려 일괄 API 누락 (`POST …/document-results/bulk`)
- 단건 `document-result` OpenAPI 스펙 누락 (런타임 FE 호출은 존재)
- 목록 응답에 담당자 A/B 서류평가·반려 사유·신청서 요약 필드 부족
- `documentStatus` 서버 필터·페이지네이션 보완 필요

### 참여자 신청 목록 > 참여자 1차 서류 심사 대상자 > 참여자 1차 서류 심사 대상자 상세

- 상세 조회 API 부재 (`GET …/individual-applications/{applicationId}`)
- 담당자 A/B 서류평가 저장 API 부재 (`PATCH …/manager-evaluations`)
- 승인/반려 알림 옵션(`notifyTiming`, `scheduledAt`) `document-result` 계약 미지원
- 반려 사유·알림 발송 결과·재발송 시각 응답 계약 보완 필요
- 개인정보·신청서 본문을 상세에 채울 데이터 계약 필요 (`memberId`·소속·주소·지원동기 등)

### 참여자 신청 목록 > 1차 서류 합격자

- 면접 가능 날짜·시간(`interviewAvailability`) 데이터 부족
- 현재 면접 배정 상태·슬롯 정보 부족 (목록 enrich 일부는 09-15 문서 기준 BE 완료이나 OpenAPI/FE 스냅샷·실응답 검증 필요)
- 면접 배정 요청 스키마에 `individualApplicationId` OpenAPI 누락 (런타임은 FE 확장 타입으로 호출)
- 목록 페이지네이션·서버 필터 보완 필요 (현재 FE 최초 50건 위주)

### 참여자 신청 목록 > 1차 서류 합격자 > 참여자 1차 서류 합격자 상세

- 상세 조회 API 부재 (신청 ID 기준 GET)
- 개인정보 원문 조회용 `memberId` 제공 필요 (목록·상세 항상 포함)
- 참여 승인 시 즉시·예약 알림 옵션 미지원
- 참여 반려 시 알림 옵션·반려 사유 계약 보완 필요
- unmask 응답을 상세 필드에 반영할 데이터 계약 필요

---

## 1) 1차 서류 심사 대상자 — 서류 결과 일괄 처리

### 요청 배경

현재 FE는 선택 승인·선택 반려 시 아래 단건 API를 선택 인원수만큼 순차 호출합니다.

- `POST /api/admin/individual-applications/{applicationId}/document-result`
- 승인 body: `{ "result": "PASS" }`
- 반려 body: `{ "result": "FAIL", "reason": "..." }`

다건 선택 시 요청 횟수가 증가하고, 중간 요청 실패 시 일부만 처리된 상태가 됩니다. 이미 구현된 봉사자 일괄 서류 결과 API와 같은 계약을 개인 참여자에도 요청합니다.

### 신규 API

`POST /api/admin/individual-applications/document-results/bulk`

#### 권한·범위

- 권한: `APPLICATION_WRITE`
- 담당 프로그램 범위 내 신청만 처리
- 감사로그 저장 필수

#### 요청

```json
{
  "ids": [1001, 1002, 1003],
  "result": "PASS",
  "reason": null
}
```

- `ids`: 개인 신청 ID, 1~100건
- `result`: `PASS` 또는 `FAIL`
- `reason`: `FAIL`일 때 필수, 2~500자
- 요청 내 모든 ID는 동일 프로그램 소속이어야 함

기존 `BulkResultRequest`를 재사용할 수 있습니다.

#### 응답

기존 봉사자 bulk와 동일한 `ApiResponse<BulkActionResponse>`를 요청합니다.

```json
{
  "success": true,
  "data": {
    "requestedCount": 3,
    "successCount": 2,
    "failureCount": 1,
    "successIds": [1001, 1002],
    "failures": [
      {
        "id": 1003,
        "code": "INVALID_STATUS",
        "message": "이미 처리된 신청입니다."
      }
    ]
  },
  "message": null,
  "error": null
}
```

#### 상태·동시성 정책

- 서류 심사 대기 상태만 `PASS`/`FAIL`로 전이
- 이미 승인·반려·활동 포기된 ID는 재처리하지 않음
- 일부 실패를 허용하고 ID별 실패 코드·메시지를 반환
- 동시 처리 충돌은 해당 ID의 failure에 `CONFLICT`로 반환
- 요청 전체 형식 오류·권한 오류는 각각 400·403
- 처리 후 `GET /api/admin/programs/{programId}/individual-applications`에서 최신 `documentStatus`가 조회되어야 함

#### OpenAPI

- path: `/api/admin/individual-applications/document-results/bulk`
- operationId: `bulkIndividualDocumentResult`
- `BulkResultRequest`, `BulkActionResponse`, `BulkFailure` 기존 schema 재사용
- 단건 개인 `document-result` path도 FE OpenAPI 스냅샷에 누락되어 있으면 함께 반영

#### FE 연동 계획

1. OpenAPI 동기화 및 Orval 생성
2. 선택 2건 이상이면 신규 bulk API 1회 호출
3. 단건은 기존 `document-result` 유지
4. 성공·부분 성공 후 해당 프로그램의 individual applications query만 invalidate
5. failures가 있으면 성공/실패 건수와 서버 메시지를 Alert Modal로 안내

#### 수락 기준

- PASS 3건 일괄 처리 후 세 건 모두 서류 합격 목록으로 이동
- FAIL 3건과 공통 반려 사유가 상태 이력·알림에 반영
- 이미 처리된 ID가 섞이면 나머지 대기 건은 처리되고 실패 ID가 응답에 포함
- 타 프로그램·권한 밖 ID는 처리되지 않음
- 감사로그에 관리자·프로그램·대상 ID·결과·사유 기록
- 변경 직후 목록 재조회에서 최신 상태 확인

---

## 2) 1차 서류 심사 대상자 상세 — 담당자 평가 · 상세 조회 · 알림

### 현황 (FE)

| 기능 | API | 연동 |
|------|-----|------|
| 목록 조회 | `GET …/programs/{programId}/individual-applications` | remote 실제 프로그램 연동 (FE seed는 mock) |
| 단건 서류 결과 | `POST …/document-result` | 목록 일괄·**상세 승인/반려 FE 연동** (OpenAPI 스냅샷 누락) |
| 담당자 A/B 서류평가 | 없음 | mock만 (새로고침 시 소실) |
| 상세 조회 | 신청 ID 기준 GET 없음 | 목록 row 전달에 의존 |

### 서버 보완 요청

1. **상세 조회 API**  
   `GET /api/admin/individual-applications/{applicationId}`  
   신청서 본문·회원 기본정보·연락처·소속·주소·심사 상태·반려 사유·담당자 평가 포함

2. **담당자 서류평가 저장**  
   `PATCH /api/admin/individual-applications/{applicationId}/manager-evaluations`  
   body 예: `{ "managerType": "A"|"B", "evaluation": "PASS"|"NEUTRAL"|"FAIL"|"UNREVIEWED" }`  
   목록·상세 응답에 `managerAEvaluation` / `managerBEvaluation` (+ evaluatorId·evaluatedAt) 포함

3. **document-result 알림 옵션**  
   `notifyTiming` / `scheduledAt` / 알림 이벤트 ID / 재발송 여부·발송 시각  
   FE 승인·반려 모달이 수집하는 값을 서버가 수용

4. **목록 enrich**  
   담당자 A/B 평가·서류 반려 사유·제출 문서·신청서 요약·`availableActions`·`memberId`

5. **상태·동시성**  
   `DOCUMENT_PENDING`에서만 PASS/FAIL · 중복 시 `409 CONFLICT` · 감사로그 필수

---

## 3) 1차 서류 합격자 — 목록 · 면접 배정

### 현황 (FE)

| 기능 | API | 연동 |
|------|-----|------|
| 목록 조회 | `GET /api/admin/programs/{programId}/individual-applications` | remote 실제 프로그램 연동 (FE seed는 mock). `documentStatus=PASS` 필터 |
| 면접 슬롯 조회 | `GET /api/admin/programs/{programId}/interview-slots` | remote ON 시 연동 |
| 면접 슬롯 생성 | `POST /api/admin/programs/{programId}/interview-slots` | 연동 (동일 일시 기존 슬롯 재사용) |
| 면접 배정 | `POST /api/admin/interview-assignments` (`individualApplicationId`) | 연동 (OpenAPI 스키마 불일치 → FE 확장 타입) |

### 서버 보완 요청

1. **면접 가능 일정**  
   목록(또는 상세) 응답에 참여자가 신청한 면접 가능 날짜·시간대 배열 제공  
   (FE 면접일 배정 팝업이 신청 시간대만 노출)

2. **배정 상태·슬롯**  
   `assignedInterviewSlotId` / `assignedInterviewStartAt` / `assignedInterviewEndAt` / 배정 상태  
   OpenAPI·실응답·Orval 생성물까지 일치 (09-15 enrich와 스냅샷 동기화)

3. **OpenAPI**  
   `InterviewAssignmentCreateRequest`에 `individualApplicationId` 공식 추가  
   (`volunteerApplicationId`와 상호 배타)

4. **목록 API**  
   페이지네이션·서버 필터 (`documentStatus`, 이름 검색 등)  
   상세 진입·unmask에 필요한 `applicationId` · `memberId` 항상 포함

---

## 4) 참여자 1차 서류 합격자 상세

### 현황 (FE)

| 기능 | API | 연동 |
|------|-----|------|
| 상세 조회 | 신청 ID 기준 GET 없음 | 목록 row 전달 (mock ID 재조회 제거) |
| 참여 승인 | `POST /api/admin/individual-applications/{applicationId}/approve` | FE 연동 (알림 옵션은 서버 미지원) |
| 참여 반려 | `POST /api/admin/individual-applications/{applicationId}/reject` | FE 연동 (알림·사유 계약 보완 필요) |
| 개인정보 상세보기 | `POST /api/admin/users/{memberId}/individual/privacy/unmask` | FE 연동 (`memberId` 있을 때) |

### 서버 보완 요청

1. **상세 조회 API**  
   예: `GET /api/admin/individual-applications/{applicationId}`  
   상세 화면 필드·`memberId`·면접 가능 일정·배정 정보·승인 상태 포함

2. **memberId**  
   목록·상세 응답에 숫자 `memberId` 필수 (unmask path용)

3. **승인·반려 알림**  
   즉시 / 예약 발송 시각을 request body로 수용  
   반려 시 `reason` 필수 및 알림 본문 반영

4. **unmask 응답**  
   상세에 표시할 원문 필드(연락처·이메일·주소 등)와 FE 매핑 계약 명시

---

## FE 즉시 연동 (서버 대기와 병행)

서버 갭과 무관하게 FE에서 진행하는 항목:

- [x] 1차 서류 합격자·2차 면접 상세에 목록 row 전달 (mock ID 재조회 제거)
- [x] 1차 서류 심사 상세 승인·반려 → `document-result` 호출 + query invalidate
- [x] 합격자/일반 상세 참여 승인·반려 → 기존 `approve` / `reject` API 호출 + query invalidate
- [x] 개인정보 상세보기 → `memberId`가 있을 때 unmask 호출
- [x] 면접 배정 시 기존 슬롯 ID가 있으면 재사용 (동일 일시 슬롯 중복 생성 방지)

서버 대기 (FE mock 유지):

- 담당자 A/B 서류평가 저장 API
- 상세 GET / 신청서 본문 enrich
- bulk document-results
- document-result / approve·reject 알림 옵션 계약

---

## 수락 기준 (종합)

- [ ] 1차 서류 심사: bulk PASS/FAIL 후 목록·합격 탭 상태 일치
- [ ] 1차 서류 심사 상세: `document-result` 후 목록·상세 상태 일치
- [ ] 담당자 평가: PATCH 후 새로고침해도 유지
- [ ] 1차 서류 합격자: 면접 가능 일정이 팝업과 목록 숫자가 일치
- [ ] 면접 배정: `individualApplicationId`로 배정 후 목록에 배정 일시 반영
- [ ] 상세: GET(또는 동등 enrich)로 remote 신청 상세가 비지 않음
- [ ] 상세 승인·반려 후 목록 상태·알림 반영
- [ ] 개인정보 상세보기: `memberId` unmask 후 마스킹 해제·감사로그
