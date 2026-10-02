# Cursor prompt — 일반 프로그램 신청 화면 남은 admin API (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/general-organization-application-decision-notify-timing-backend-request-2026-10-02.md`

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-10-02 |
| 갱신 | 2026-10-02 — 강사 감사 후 기관·강사 남은 BE 모음. **같은 날** 봉사자 신청 목록/상세 감사 후 **F·G·B(봉사자 취소)** 추가 |
| 대상 | CMS 백엔드 `JABACK` (`localhost:8080`) |
| 우선순위 | **P1** (A·B·C·F·G) / **P2** (D·E) |
| 화면 | CMS 일반 프로그램 상세 → LNB **기관 신청 목록/상세**, **강사 신청 목록/상세**, **봉사자 신청 목록/상세** (서류 / 서류합격·면접배정 / 2차면접) |
| 대상 path | `organization-applications`, `instructor-applications`, `volunteer-applications`, `interview-assignments`. UJAT·1사1교·Gemini 전용 path 아님 |

이미 다른 문서로 전달한 것은 **이 파일에서 다시 만들지 마라.**

- 개인 참여자 `cancel-approval`: `apps/cms/docs/api/general-individual-application-cancel-approval-backend-request-2026-10-02.md`
- 일반 과제 관리: `apps/cms/docs/api/general-individual-progress-assignment-admin-api-backend-request-2026-10-02.md`
- UJAT 과제 관리: `apps/cms/docs/api/ujat-education-progress-assignment-admin-api-backend-request-2026-10-02.md`
- 1사1교 기관·강사 신청 잔여(같은 path, COMPANY_SCHOOL 허용): `apps/cms/docs/api/company-school-application-remaining-backend-request-2026-10-02.md`

---

## 0. FE가 이미 붙인 것 — 시그니처를 깨지 마라

다음 계약은 열려 있고 CMS가 호출한다. **이 티켓에서 바꾸지 마라.**

| 화면 액션 | path | 비고 |
|-----------|------|------|
| 기관 안내사항 PATCH | `PATCH /api/admin/organization-applications/{id}` | 기존 Update |
| 기관 개인정보 원문 | `POST /api/admin/organization-applications/{id}/privacy/unmask` | `AdminPrivacyUnmaskRequest` |
| 합반 담당 교사 | `POST/DELETE /api/admin/programs/{programId}/organization-merge-groups` | `leadTeacherMemberId`. EFFECTIVE 합반을 취소하지 않고 담당 교사만 바꾸는 PATCH가 필요하면 **다음 티켓** |
| 기관 알림 재발송 | `POST …/organization-applications/{id}/notifications/resend` | `timing` / `scheduledAt` / `reason` |
| 강사 목록/상세 GET | `GET …/programs/{programId}/instructor-applications`, `GET …/instructor-applications/{id}` | |
| 강사 단건 승인 | `POST …/instructor-applications/{id}/approve` | `assignments` + `feePolicy` + `notification` |
| 강사 단건 반려 | `POST …/instructor-applications/{id}/reject` | `Rejection.reason` + `notification` — **FE가 시점 전달함** |
| 강사 승인/반려 취소 | `POST …/cancel-approval`, `…/cancel-rejection` | `Cancellation.reason` + `notification` — **FE가 시점 전달함** |
| 강사 알림 재발송 | `POST …/instructor-applications/{id}/notifications/resend` | |
| 강사 관리자 코멘트 | `PATCH …/instructor-applications/{id}` | `Update.managerComment` only. 코멘트 저장은 이 path |
| 강사 개인정보 원문 | `POST …/instructor-applications/{id}/privacy/unmask` | **FE가 신청 path로 붙임.** 회원 `INSTRUCTOR` unmask로 대체하지 마라 |
| 강사 소속 재직 현황 | `PATCH …/organizations/schools/{organizationId}/teachers/{teacherMemberId}/employment-status` | 목록의 `affiliationOrganizationId` + `instructorMemberId`가 있을 때만 FE가 호출. **신청 PATCH에 재직 필드를 넣지 마라** |
| 봉사자 목록/상세 GET | `GET …/programs/{programId}/volunteer-applications`, `GET …/volunteer-applications/{id}` | |
| 봉사자 서류 결과 | `POST …/volunteer-applications/{id}/document-result` | `DocumentResultRequest.notifyTiming` — **단건은 FE가 전달함.** `scheduledAt` 없음 |
| 봉사자 서류 일괄 | `POST …/volunteer-applications/document-results/bulk` | `BulkResultRequest` — `ids` + `result` + `reason` 만. **시점 필드 없음** |
| 봉사자 담당자 평가 | `PUT …/volunteer-applications/{id}/document-evaluations/{managerSlot}` | |
| 봉사자 면접 배정 | `POST /api/admin/interview-assignments` | `volunteerApplicationId` + `interviewSlotId` 만. **시점 필드 없음** |
| 봉사자 활동 포기 | `POST …/volunteer-applications/{id}/give-up` | `ApplicationGiveUpRequest.reason` |
| 봉사자 최종 결과 | `POST …/volunteer-applications/{id}/final-result` | `VolunteerFinalResultRequest.notifyTiming` 은 스키마에 있음. **FE는 아직 안 보냄** — `scheduledAt` 도 없음 |
| 봉사자 최종 일괄 | `POST …/volunteer-applications/final-results/bulk` | `BulkResultRequest` — 시점 필드 없음 |
| 봉사자 면접 평가 | `POST /api/admin/interview-assignments/{assignmentId}/evaluations` | |
| 봉사자 서류 승인/반려 취소 | `POST …/cancel-approval`, `…/cancel-rejection` | `ApplicationDecisionCancelRequest.reason` 만. **FE가 취소 path는 붙임. 시점은 버림** |
| 봉사자 개인정보 원문 | `POST …/volunteer-applications/{id}/privacy/unmask` | `AdminPrivacyUnmaskRequest`. **FE가 신청 path로 붙임.** 회원 `INDIVIDUAL` unmask로 대체하지 마라 |

강사 일괄 반려에 시점이 있으면 FE는 `bulk-reject`를 쓰지 않고 단건 `reject` + `notification`을 반복한다. `BulkDecisionRequest`에 없는 필드를 지어내지 않는다.

---

## 1. 한 줄 요약

기관 승인·반려·취소, 강사 정보 수정·일괄 승인, 봉사자 면접 배정·취소·서류/최종 **일괄** 알림 시점은 **화면이 받는 값을 보낼 필드가 없다.**  
열린 계약은 FE가 붙였다. 아래 티켓만 열어라.

---

## A. 기관 신청 승인·반려 알림 시점 — P1

### A.1 지금

```http
POST /api/admin/organization-applications/{applicationId}/approve
POST /api/admin/organization-applications/{applicationId}/reject
POST /api/admin/organization-applications/bulk-approve
POST /api/admin/organization-applications/bulk-reject
```

- `approve` / `bulk-approve`: request body 없음. 서버가 바로 알림을 보내는 것으로 보인다.
- `reject` / `bulk-reject`: `ApplicationRejectRequest.reason` 만.

이미 있는 알림 시점 계약(참고만, 시그니처를 깨지 마라):

```http
POST /api/admin/organization-applications/{applicationId}/notifications/resend
```

`OrganizationApplicationNotificationResendRequest`:

- `timing`: `IMMEDIATE` | `SCHEDULED`
- `scheduledAt`: ISO-8601 또는 null
- `reason`: 반려 재발송일 때

CMS FE (`InstitutionApproveModal` / `ProgramApplicationRejectModal`):

- 승인: 알림 시점 선택. 지금은 `approve` 호출 후 시점을 **버린다.**
- 반려: 사유 + 알림 시점. 지금은 `reason` 만 보낸다.

FE가 body를 지어내지 마라. 이 티켓에서 OpenAPI를 열어라.

### A.2 승인 (필수)

`POST …/organization-applications/{applicationId}/approve` 에 body를 받아라.

기존 `OrganizationApplicationNotificationResendRequest` 와 같은 시점 필드를 쓰는 것을 우선한다. 새 enum을 만들지 마라.

요청 예:

```json
{
  "timing": "IMMEDIATE",
  "scheduledAt": null
}
```

예약:

```json
{
  "timing": "SCHEDULED",
  "scheduledAt": "2026-10-20T09:00:00+09:00"
}
```

규칙:

1. body 생략: 지금과 같이 **즉시 발송**. 기존 클라이언트(body 없음)를 깨지 마라.
2. `timing=IMMEDIATE`: 즉시 발송.
3. `timing=SCHEDULED`: `scheduledAt` 필수, 현재 시각 이후. 아니면 400.
4. 권한·감사는 현재 `approve` 와 동일.
5. 응답은 기존 `ApplicationDecisionResponse`. `notificationEventId` 를 채워라.
6. `bulk-approve` 에도 같은 body를 받아라. 일괄은 한 시점을 모든 건에 적용.

### A.3 반려 (필수)

`POST …/reject` / `bulk-reject` 의 `ApplicationRejectRequest` (또는 기관 전용 확장)에 같은 `timing` / `scheduledAt` 을 추가하라.

- `reason` 은 그대로 필수 (2~500).
- body 에 시점 필드가 없으면 **즉시 발송** (지금과 동일).
- `bulk-reject` 도 동일.

### A.4 쓰지 말 것

- 승인 직후 FE가 `notifications/resend` 를 한 번 더 부르게 하지 마라. 시점 없는 승인이 이미 알림을 보내면 중복이다.
- 개인/강사 `approve` 시그니처를 이 티켓에서 바꾸지 마라. 기관만.
- UJAT / 1사1교 / Gemini 전용 path 로 일반화하지 마라.

---

## B. 기관·봉사자 신청 승인 취소·반려 취소 알림 시점 — P1

### B.1 지금

```http
POST /api/admin/organization-applications/{applicationId}/cancel-approval
POST /api/admin/organization-applications/{applicationId}/cancel-rejection
POST /api/admin/volunteer-applications/{applicationId}/cancel-approval
POST /api/admin/volunteer-applications/{applicationId}/cancel-rejection
```

공유 `ApplicationDecisionCancelRequest.reason` 만 있다.

CMS (`InstitutionCancelApprovalModal` / `InstitutionCancelRejectModal`, `GeneralVolunteerDocumentCancelApprovalModal` / `GeneralVolunteerDocumentCancelRejectModal`)는 사유와 함께 **즉시 / 발표일 / 예약**(또는 이미 발송된 경우 즉시·예약)을 받는다. FE는 시점을 **버리고** `reason` 만 보낸다. 봉사자 취소 path 자체는 이미 연동됐다.

### B.2 해야 할 일

강사 `Cancellation.notification` 과 같은 필드를 **공유** `ApplicationDecisionCancelRequest` 에 추가하라. 기관 전용 body만 만들지 마라. 새 enum을 만들지 마라.

```json
{
  "reason": "일정 변경으로 승인 취소",
  "timing": "SCHEDULED",
  "scheduledAt": "2026-10-20T09:00:00+09:00"
}
```

또는 강사와 같이:

```json
{
  "reason": "일정 변경으로 승인 취소",
  "notification": {
    "timing": "SCHEDULED",
    "scheduledAt": "2026-10-20T09:00:00+09:00"
  }
}
```

한 쪽을 고르고 OpenAPI에 밝혀라. **기관·강사 필드 이름을 섞어 두지 마라.**

규칙:

1. `reason` 은 지금과 같이 필수(또는 지금 minLength 유지).
2. 시점 필드 생략: 지금처럼 즉시 처리. 기존 클라이언트(`reason` only)를 400 으로 만들지 마라.
3. `timing=SCHEDULED` 이면 `scheduledAt` 필수, 현재 시각 이후. 아니면 400.
4. 권한·감사·응답은 현재 cancel path 와 동일. `notificationEventId` 를 채워라.
5. 강사 cancel path / `Cancellation` 스키마는 이 티켓에서 바꾸지 마라. 강사 cancel 은 이미 `notification` 을 받는다.
6. **공유 스키마 `ApplicationDecisionCancelRequest` 에 시점 필드를 넣으면** 아래 path가 같이 받는다. 기관 전용 body만 확장하지 마라.
   - `POST …/organization-applications/{id}/cancel-approval`
   - `POST …/organization-applications/{id}/cancel-rejection`
   - `POST …/volunteer-applications/{id}/cancel-approval` — CMS 봉사자 1차 승인 취소 모달이 사유 + 즉시/발표일/예약(이미 발송이면 즉시·예약)을 받는다. FE는 **reason 만** 보낸다.
   - `POST …/volunteer-applications/{id}/cancel-rejection` — 이미 발송된 반려 취소는 사유 + 시점을 받는다. 미발송 변이는 사유 없이 확인만 한다. FE는 미발송일 때 `reason: "반려 취소"` 를 보낸다.
7. 개인 `individual-applications` cancel 시그니처를 **일부러** 바꾸지 마라. 공유 `ApplicationDecisionCancelRequest` 에 optional 시점을 넣는 것은 허용한다(기존 `reason` only 는 즉시).

---

## C. 강사 신청 정보 수정 PATCH — P1

### C.1 지금

```http
PATCH /api/admin/instructor-applications/{applicationId}
```

OpenAPI `Update` 는 `managerComment` 만 있다. 관리자 코멘트 저장은 이 path 로 **이미 연동됐다.**

CMS 강사 신청 상세 「정보 수정」은 아래를 같이 저장한다. 보낼 필드가 없어 FE는 저장하지 않고 안내만 한다.

- 강사비 책정 기준: `program` | `special_lecture` | `other_labor`
- 지급 기준(`measure`): 특강/기타일 때 `출강 1회당` | `1시간 당`. 프로그램 기준은 `해당 없음`
- 금액(`amount`): 원 단위 정수
- 강사비 등급: 예 `3급 강사비`
- 사업소득자 해당 여부: `해당` | `해당 없음`

승인 시 이미 쓰는 `FeePolicy` 를 재사용하라. 새 fee 스키마를 만들지 마라.

### C.2 해야 할 일

`PATCH …/instructor-applications/{applicationId}` 의 `Update` 를 확장하라. `managerComment` 는 그대로 두고 **누락 필드는 유지** (개인 신청 PATCH 와 같은 partial).

요청 예:

```json
{
  "managerComment": "배정 후 강사비 재확인",
  "feePolicy": {
    "basisType": "special_lecture",
    "measure": "출강 1회당",
    "amount": 150000,
    "instructorFeeGrade": "3급 강사비"
  },
  "businessIncomeEarnerStatus": "해당 없음"
}
```

규칙:

1. `managerComment` only body 는 지금과 같이 코멘트만 갱신. 기존 코멘트 클라이언트를 깨지 마라.
2. `feePolicy` 가 있으면 승인 `FeePolicy` 와 같은 검증(필수 4필드, `amount >= 0`).
3. `businessIncomeEarnerStatus` 허용 값: `해당` | `해당 없음`. 다른 문자열은 400.
4. 재직 현황(`employmentStatus`)은 이 PATCH 에 넣지 마라. 회원 학교 교사 employment path 를 쓴다.
5. 응답은 `InstructorApplicationDetailResponse` (또는 지금 PATCH 응답). 저장한 `feePolicy` / `instructorFeeGradeSnapshot` / `businessIncomeEarnerStatus` 를 채워라.
6. GET 상세에도 같은 필드를 내려라. 지금 상세에 `feePolicy`·`businessIncomeEarnerStatus` 가 없다. 목록의 `instructorFeeGradeSnapshot` 만으로는 정보 수정 화면을 복원할 수 없다.
7. 권한은 현재 PATCH 와 동일 (`APPLICATION_WRITE`).

---

## D. 강사 신청 상세 GET 필드 패리티 — P2

목록 `InstructorApplicationListItemResponse` 에 있고 상세 `InstructorApplicationDetailResponse` 에 없는 것:

- `affiliationOrganizationId` — 교사 겸직 재직 현황 저장에 필요. 목록 값이 enrichment 로 남을 수 있으나 상세 단독 조회면 빠진다.

상세에 없어서 정보 수정·재직 배지를 복원하지 못하는 것:

- `affiliationOrganizationId`
- `instructorMemberProfile` (또는 교사 겸직 여부). 없으면 재직 배지 노출 조건을 FE가 목록/회원 스냅샷에 의존한다.
- `employmentStatus` / `affiliationIsCurrentlyEmployed`
- `feePolicy` (`basisType`, `measure`, `amount`, `instructorFeeGrade`)
- `businessIncomeEarnerStatus`

목록에 있는 `affiliationOrganizationId` 를 상세에도 그대로 내려라. 새 ID 체계를 만들지 마라.

---

## E. 강사 일괄 승인 알림 시점 — P2

### E.1 지금

```http
POST /api/admin/instructor-applications/bulk-approve
```

`BulkIdsRequest.ids` 만 있다. 단건 `Approval` 은 `assignments` + `feePolicy` 가 필수라서 FE가 일괄을 단건 승인으로 풀 수 없다(배정·강사비 없이 단건 호출하면 400).

목록 일괄 승인 모달은 알림 시점을 받는다. FE는 `bulk-approve` 만 호출하고 시점을 **버린다.**

### E.2 해야 할 일

`bulk-approve` 에 기관 A와 같은 `timing` / `scheduledAt` 을 받아라. `assignments` / `feePolicy` 를 일괄에 요구하지 마라(지금처럼 배정 없이 승인 가능해야 한다).

```json
{
  "ids": [101, 102],
  "timing": "SCHEDULED",
  "scheduledAt": "2026-10-20T09:00:00+09:00"
}
```

규칙:

1. `ids` only: 지금처럼 즉시 발송. 기존 클라이언트를 깨지 마라.
2. 시점 규칙은 A.2 와 동일.
3. `bulk-reject` 에 notification 을 넣는 것은 **선택**. FE는 시점이 있으면 이미 단건 `reject` 를 반복한다. 넣더라도 기존 `ids` + `reason` 만 있는 요청은 즉시 발송으로 유지하라.

---

## F. 봉사자(·개인) 면접 배정 알림 시점 — P1

### F.1 지금

```http
POST /api/admin/interview-assignments
```

`InterviewAssignmentCreateRequest`:

- `volunteerApplicationId` 또는 `individualApplicationId` (상호 배타)
- `interviewSlotId`

시점 필드가 없다.

CMS (`GeneralVolunteerInterviewAssignModal`, 서류합격·면접배정 목록/상세):

- 배정/재배정 시 **즉시 / 직접 설정(일시)** 을 받는다.
- FE는 슬롯만 만들고 `volunteerApplicationId` + `interviewSlotId` 만 보낸다. **시점을 버린다.**
- 참여자(개인) 면접 배정도 같은 path + `individualApplicationId` 를 쓴다. 필드만 추가하면 된다. 개인 전용 path 를 만들지 마라.

### F.2 해야 할 일

`InterviewAssignmentCreateRequest` 에 서류 결과와 **같은** 시점 필드를 추가하라. 새 enum을 만들지 마라.

이미 있는 값(참고, 시그니처를 깨지 마라):

- `DocumentResultRequest.notifyTiming`: `IMMEDIATE` | `ON_ANNOUNCEMENT` | `MANUAL`

요청 예 (즉시):

```json
{
  "volunteerApplicationId": 1690800,
  "interviewSlotId": 501,
  "notifyTiming": "IMMEDIATE"
}
```

직접 설정:

```json
{
  "volunteerApplicationId": 1690800,
  "interviewSlotId": 501,
  "notifyTiming": "MANUAL",
  "scheduledAt": "2026-10-20T09:00:00+09:00"
}
```

규칙:

1. 시점 필드 생략: 지금처럼 배정만 하고 알림은 현재 서버 기본(즉시)을 유지. 기존 클라이언트(`volunteerApplicationId` + `interviewSlotId` only)를 400 으로 만들지 마라.
2. `notifyTiming=IMMEDIATE`: 즉시 발송.
3. `notifyTiming=MANUAL`: `scheduledAt` 필수, 현재 시각 이후. 아니면 400.
4. `ON_ANNOUNCEMENT` 는 스키마에 있어도 된다. 면접 배정 모달은 지금은 보내지 않는다.
5. `individualApplicationId` 로 호출해도 같은 시점 규칙을 적용하라.
6. 권한·감사·응답은 현재 create 와 동일. 응답에 `notificationEventId` 를 넣을 수 있으면 채워라.
7. 슬롯 생성(`POST …/interview-slots`) 시그니처는 이 티켓에서 바꾸지 마라. 알림은 **배정** 에 붙인다.
8. UJAT 전용 interview path 로 일반화하지 마라. 이 path 만 확장하라.

---

## G. 봉사자 서류·최종 결과 `scheduledAt` 과 일괄 시점 — P1

단건 서류 결과의 `notifyTiming` 은 이미 열려 있고 CMS가 보낸다. **이 enum을 바꾸지 마라.** 빠진 것은 예약 시각과 일괄 body다.

### G.1 지금

```http
POST /api/admin/volunteer-applications/{applicationId}/document-result
POST /api/admin/volunteer-applications/document-results/bulk
POST /api/admin/volunteer-applications/{applicationId}/final-result
POST /api/admin/volunteer-applications/final-results/bulk
```

| 스키마 | 있는 것 | 없는 것 |
|--------|---------|---------|
| `DocumentResultRequest` | `result`, `reason`, `notifyTiming` | `scheduledAt` |
| `VolunteerFinalResultRequest` | `result`, `reserveRank`, `reason`, `notifyTiming` | `scheduledAt` |
| `BulkResultRequest` | `ids`, `result`, `reason`, `reserveRank` | `notifyTiming`, `scheduledAt` |

CMS:

- 서류 승인/반려·일괄 모달은 즉시 / 발표일 / 직접 설정을 받는다. **단건** 은 `notifyTiming` 만 보낸다(`immediate` → `IMMEDIATE` 등). `manual` 이어도 일시를 보낼 필드가 없어 버린다.
- 서류 **일괄** 은 `BulkResultRequest` 에 시점 필드가 없어 `ids` + `result` + `reason` 만 보낸다.
- 2차 면접 합격/불합격·일괄 모달도 시점을 받는다. 단건 `final-result` 의 `notifyTiming` 은 스키마에 있으나 FE는 아직 안 붙인다. `scheduledAt` 이 열리면 같이 보낸다. **일괄** 은 지금 시점을 버린다.

### G.2 해야 할 일

1. `DocumentResultRequest` 와 `VolunteerFinalResultRequest` 에 optional `scheduledAt`(ISO-8601, 기관 예약과 같은 형식)을 추가하라.
2. `notifyTiming=MANUAL` 이면 `scheduledAt` 필수, 현재 시각 이후. 아니면 400.
3. `notifyTiming` 생략 또는 `IMMEDIATE` / `ON_ANNOUNCEMENT`: `scheduledAt` 없어도 지금과 같다.
4. `BulkResultRequest` 에 같은 `notifyTiming` + `scheduledAt` 을 추가하라. 서류 일괄·최종 일괄이 이 스키마를 같이 쓴다.
5. `ids` + `result` (+ `reason`) only: 지금처럼 즉시 발송. 기존 일괄 클라이언트를 400 으로 만들지 마라.
6. 개인 `individual-applications` 의 document-result / final-result / bulk 가 **같은 스키마**를 쓰면 필드만 추가하라. 개인 전용 스키마를 만들지 마라.
7. `notifyTiming` 허용 값을 바꾸지 마라: `IMMEDIATE` | `ON_ANNOUNCEMENT` | `MANUAL`.

요청 예 (서류 단건 예약):

```json
{
  "result": "PASS",
  "notifyTiming": "MANUAL",
  "scheduledAt": "2026-10-20T09:00:00+09:00"
}
```

요청 예 (최종 일괄 예약):

```json
{
  "ids": [1690800, 1690801],
  "result": "PASS",
  "notifyTiming": "MANUAL",
  "scheduledAt": "2026-10-20T09:00:00+09:00"
}
```

---

## 4. 하지 말 것

- 기존 기관 `approve`(body 없음) 클라이언트를 400 으로 만들기
- 합반 merge-groups 시그니처 변경
- 강사 단건 approve / reject / cancel / unmask / resend 시그니처 변경
- 강사 PATCH 에서 `managerComment` only 요청을 실패시키기
- 봉사자 `document-result` / `final-result` 의 기존 `notifyTiming` enum 변경
- 봉사자 cancel / unmask / give-up / document-result 단건 path 를 없애거나 필수 body 로 바꾸기
- `InterviewAssignmentCreateRequest` 에서 기존 `volunteerApplicationId` + `interviewSlotId` only 요청을 400 으로 만들기
- 개인 전용 면접 배정 path 를 새로 만들기. 같은 `POST /api/admin/interview-assignments` 를 확장하라
- UJAT / 1사1교 / Gemini 전용 path 로 일반화
- 봉사자 신청 PATCH·알림 재발송 path 를 이 티켓에서 만들지 마라. 화면에 해당 버튼이 없다
- FE mock 시드를 BE가 넣으라고 하기
- 재직 현황을 강사 신청 PATCH 에 넣기

---

## 5. Done when

1. 기관 `approve` 에 `timing=SCHEDULED` + 미래 `scheduledAt` 을 주면 즉시 알림이 가지 않고 예약된다. body 없는 `approve` 는 지금처럼 즉시 발송.
2. 기관 `reject` / `bulk-approve` / `bulk-reject` 도 같은 시점 규칙을 따른다.
3. 기관·봉사자 `cancel-approval` / `cancel-rejection` 에 시점 + 사유를 주면 같이 적용된다. `reason` only 는 지금과 같다.
4. 강사 `PATCH` 로 `feePolicy` + `businessIncomeEarnerStatus` 를 저장하면 GET 상세에 그대로 돌아온다. `managerComment` only PATCH 는 그대로 동작한다.
5. 강사 GET 상세에 `affiliationOrganizationId` 가 목록과 같이 있다.
6. 강사 `bulk-approve` 에 시점을 주면 일괄 승인 알림이 예약된다.
7. `POST /api/admin/interview-assignments` 에 `notifyTiming=MANUAL` + 미래 `scheduledAt` 을 주면 배정 알림이 예약된다. 시점 없는 create 는 지금과 같다.
8. 봉사자 `document-result` / `final-result` 에 `notifyTiming=MANUAL` + `scheduledAt` 을 주면 예약된다. 일괄 `BulkResultRequest` 도 같다. 시점 없는 일괄은 지금처럼 즉시.
9. OpenAPI에 request/response 스키마가 있다. 개인/강사 단건 approve path, 봉사자 cancel/unmask/document-result 단건 path 는 그대로다.

**Last updated:** 2026-10-02
