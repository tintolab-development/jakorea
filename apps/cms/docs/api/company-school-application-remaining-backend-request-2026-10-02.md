# Cursor prompt — 1사1교 기관·강사 신청 남은 admin API (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/company-school-application-remaining-backend-request-2026-10-02.md`

이전 파일명 `company-school-organization-application-remaining-backend-request-2026-10-02.md` 를 이 파일로 합쳤다. **기관 신청 + 강사 신청** 잔여를 한 티켓에서 닫아라.

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-10-02 |
| 갱신 | 2026-10-02 — 강사 신청 목록/상세 감사 후 **B 강사 path · D 강사 PATCH · E resolvedScheduleId · F 강사 GET** 추가 |
| 대상 | CMS 백엔드 `JABACK` (`localhost:8080`) |
| 우선순위 | **P1** (A 기관 알림 시점 · B COMPANY_SCHOOL 허용 · E 희망일정 매핑) / **P2** (C 1사1교 기관 필드 · D 강사 정보 수정 · F 강사 상세 필드) |
| 화면 | CMS **1사1교** 프로그램 상세 → LNB **기관 신청 목록/상세**, **강사 신청 목록/상세** |
| 대상 프로그램 | `programType=COMPANY_SCHOOL` 만. 일반·UJAT·Gemini·교육받은 교사 전용 path 아님 |

**전용 path를 만들지 마라.** 1사1교는 이미 공유

`/api/admin/programs/{programId}/organization-applications`  
`/api/admin/organization-applications/{applicationId}` …  
`/api/admin/programs/{programId}/instructor-applications`  
`/api/admin/instructor-applications/{applicationId}` …

를 쓴다. `company-school-applications` 같은 새 리소스를 열지 마라.

알림 시점·강사 PATCH 계약은 일반 문서와 **같은 티켓에서 한 번만** 열어라. 이 문서는 1사1교 화면에 다시 적는다. 구현은 아래를 따른다.

- 기관 승인·반려·취소 시점: `apps/cms/docs/api/general-organization-application-decision-notify-timing-backend-request-2026-10-02.md` **§A · §B**
- 강사 정보 수정 PATCH · 상세 필드 · 일괄 승인 시점: 같은 문서 **§C · §D · §E**

이미 다른 문서로 전달한 것은 **이 파일에서 다시 만들지 마라.**

- 일반 진행 현황 잔여: `general-program-progress-remaining-backend-request-2026-10-02.md`
- 1사1교 진행 현황 · 참여 기관 잔여: `company-school-program-progress-institution-remaining-backend-request-2026-10-02.md`
- 1사1교 진행 현황 · 참여 강사 잔여: `company-school-program-progress-instructor-remaining-backend-request-2026-10-02.md`
- 개인 참여자 `cancel-approval`: `general-individual-application-cancel-approval-backend-request-2026-10-02.md`
- 일반/UJAT 과제 관리: `general-individual-progress-assignment-admin-api-backend-request-2026-10-02.md`, `ujat-education-progress-assignment-admin-api-backend-request-2026-10-02.md`

클라 엑셀 다운로드는 FE 로컬이다. **엑셀 export API를 만들지 마라.**  
합반은 일반 기관만이다. **COMPANY_SCHOOL 에 organization-merge-groups 를 열지 마라.**

---

## 1. 한 줄 요약

1사1교 기관·강사 신청의 조회·결정·unmask·코멘트·재발송은 공유 path 로 이미 열려 있다.  
남은 서버 일은 **(A) 기관 승인·반려·취소 알림 시점**, **(B) COMPANY_SCHOOL 을 403 하지 말 것**, **(C) 기관 신청서 전용 GET 필드**, **(D) 강사 정보 수정 PATCH**, **(E) 승인 기관 희망일정의 `resolvedScheduleId`**, **(F) 강사 상세 GET 필드** 이다.

---

## 2. FE가 이미 붙인 것 — 시그니처를 깨지 마라

1사1교 상세에는 면접 하위 탭이 없다. 기관은 **목록 + 신청 정보**, 강사는 **목록 + 신청 정보(이력서 포함)** 한 화면이다.

이 티켓에서 아래 계약을 바꾸지 마라. 새 도메인·새 리소스를 만들지 마라.

### 2.1 기관 신청

| 화면 액션 | path | 비고 |
|-----------|------|------|
| 목록 조회 | `GET /api/admin/programs/{programId}/organization-applications` | `status` / `keyword` / `recruitHalf` / `recruitmentId` / `page` / `size` |
| 진행 희망 일정 | `GET /api/admin/organization-applications/{id}/requested-schedules` | 목록 행마다. 강사 승인 배정 슬롯도 이 응답을 쓴다 |
| 신청 상세 | `GET /api/admin/organization-applications/{id}` | |
| 양식 답 | form_response by context `ORGANIZATION_APPLICATION` | |
| 관리자 코멘트 | admin comment upsert `ORGANIZATION_APPLICATION` | |
| 정보 수정 | `PATCH /api/admin/organization-applications/{id}` | `OrganizationApplicationUpdateRequest` |
| 개인정보 원문 | `POST …/organization-applications/{id}/privacy/unmask` | |
| 단건 승인 | `POST …/approve` | **body 없음.** FE는 모달 시점을 **버린다** |
| 단건 반려 | `POST …/reject` | `reason` 만 |
| 일괄 승인/반려 | `bulk-approve` / `bulk-reject` | 승인 body 없음. 반려 `reason` 만 |
| 승인/반려 취소 | `cancel-approval` / `cancel-rejection` | `reason` 만. FE는 시점을 **버린다** |
| 알림 재발송 | `POST …/notifications/resend` | `timing` / `scheduledAt` / `reason` — **이 티켓에서 바꾸지 마라** |

### 2.2 강사 신청

| 화면 액션 | path | 비고 |
|-----------|------|------|
| 목록 조회 | `GET /api/admin/programs/{programId}/instructor-applications` | |
| 신청 상세 | `GET /api/admin/instructor-applications/{id}` | 이력서는 이 GET·양식 값. 별도 resume path 없음 |
| 양식 답 | form_response `INSTRUCTOR_APPLICATION` | |
| 코멘트 | `PATCH …/instructor-applications/{id}` | `managerComment` only. **정보 수정의 강의료·사업소득은 이 path에 필드가 없어 저장하지 않는다** |
| 개인정보 원문 | `POST …/instructor-applications/{id}/privacy/unmask` | |
| 단건 승인 | `POST …/approve` | `assignments` + `feePolicy` + `notification` — **FE가 시점 전달함** |
| 단건 반려 | `POST …/reject` | `reason` + `notification` — **FE가 시점 전달함** |
| 일괄 승인 | `POST …/instructor-applications/bulk-approve` | `ids` + 있으면 `timing`/`scheduledAt`. 배정·강의료 없음 |
| 일괄 반려 | `bulk-reject` 또는 단건 `reject` 반복 | |
| 승인/반려 취소 | `cancel-approval` / `cancel-rejection` | `reason` + `notification` — **FE가 시점 전달함** |
| 알림 재발송 | `POST …/notifications/resend` | |
| 소속 재직 현황 | `PATCH …/organizations/schools/{organizationId}/teachers/{teacherMemberId}/employment-status` | `affiliationOrganizationId` + `instructorMemberId`가 있을 때만. **신청 PATCH에 재직 필드를 넣지 마라** |

강사 단건 승인의 `assignments[].scheduleId` 는 기관 `requested-schedules.resolvedScheduleId` 이다. 없으면 FE가 그 슬롯을 고를 수 없다.

---

## 3. 화면이 버리는 값 (기관만)

CMS 기관 모달은 알림 시점을 받는다. OpenAPI에 필드가 없어 FE는 **보내지 않는다.**

| 액션 | 화면이 받는 값 | 지금 보내는 값 |
|------|----------------|----------------|
| 기관 승인 / 일괄 승인 | 알림 시점 | 없음 |
| 기관 반려 / 일괄 반려 | 사유 + 시점 | `reason` 만 |
| 기관 승인 취소 | 사유 + 시점 | `reason` 만 |
| 기관 반려 취소 | 이미 발송이면 사유 + 시점 | `reason` 만 |

강사 단건 승인·반려·취소·재발송은 시점을 **이미 보낸다.** 강사 일괄 승인은 `timing`/`scheduledAt` 을 보내려 한다. body가 없으면 서버가 무시하거나 400 내지 말고 **즉시 발송**으로 받아라.

FE가 없는 필드를 지어내지 마라. 이 티켓에서 OpenAPI를 열어라.

---

## A. 기관 신청 승인·반려·취소 알림 시점 — P1

일반 문서 **§A · §B** 와 **같은 계약**이다. 1사1교용 body를 따로 만들지 마라.

### A.1 승인 / 일괄 승인

```http
POST /api/admin/organization-applications/{applicationId}/approve
POST /api/admin/organization-applications/bulk-approve
```

body를 받아라. `OrganizationApplicationNotificationResendRequest` 와 같은 시점 필드를 우선한다. 새 enum을 만들지 마라.

```json
{
  "timing": "IMMEDIATE",
  "scheduledAt": null
}
```

규칙:

1. body 생략: 지금과 같이 **즉시 발송**.
2. `timing=SCHEDULED`: `scheduledAt` 필수, 현재 시각 이후. 아니면 400.
3. `bulk-approve` 는 한 시점을 모든 건에 적용.
4. 응답 `notificationEventId` 를 채워라.
5. 승인 직후 `notifications/resend` 를 한 번 더 부르게 하지 마라.

### A.2 반려 / 일괄 반려

`reject` / `bulk-reject` 에 같은 `timing` / `scheduledAt` 을 추가하라. `reason` 은 그대로 필수. 시점 없으면 즉시.

### A.3 승인 취소 / 반려 취소

공유 `ApplicationDecisionCancelRequest` 에 강사 `Cancellation.notification` 과 같은 시점 필드를 추가하라. 기관 전용 body만 만들지 마라. `reason` only 는 즉시.

### A.4 쓰지 말 것

- 1사1교 전용 approve/reject/cancel path
- 강사 단건 `approve` 시그니처를 이 티켓에서 바꾸기
- 재발송 시그니처 변경

---

## B. COMPANY_SCHOOL 허용 — P1

공유 path는 `GENERAL` 만이 아니라 **`COMPANY_SCHOOL` 에서도 200** 이어야 한다.  
다음이 COMPANY_SCHOOL 이면 **403 / 404 / “일반 프로그램만”** 으로 거절하지 마라.

### B.1 기관

| path |
|------|
| `GET /api/admin/programs/{programId}/organization-applications` |
| `GET /api/admin/organization-applications/{id}` |
| `GET /api/admin/organization-applications/{id}/requested-schedules` |
| `PATCH /api/admin/organization-applications/{id}` |
| `POST …/privacy/unmask` |
| `POST …/approve` · `…/reject` · `…/bulk-approve` · `…/bulk-reject` |
| `POST …/cancel-approval` · `…/cancel-rejection` |
| `POST …/notifications/resend` |

### B.2 강사

| path |
|------|
| `GET /api/admin/programs/{programId}/instructor-applications` |
| `GET /api/admin/instructor-applications/{id}` |
| `PATCH /api/admin/instructor-applications/{id}` |
| `POST …/privacy/unmask` |
| `POST …/approve` · `…/reject` · `…/bulk-approve` · `…/bulk-reject` |
| `POST …/cancel-approval` · `…/cancel-rejection` |
| `POST …/notifications/resend` |

규칙:

1. 권한은 지금과 같다. 유형만 막지 마라.
2. `availableActions` 는 일반과 같은 enum. 기관은 `APPROVE` / `REJECT` / `CANCEL_APPROVAL` / `CANCEL_REJECTION` / `RESEND_NOTIFICATION`. 강사도 동일하게 빼지 마라.
3. 목록·상세 `programType` 은 `COMPANY_SCHOOL` 그대로.
4. 합반(`organization-merge-groups`) 은 COMPANY_SCHOOL 에 **열지 마라.**

---

## C. 1사1교 기관 신청서 전용 필드 — P2

Platform `application-economy` 에는 아래가 있다. OpenAPI 기관 DTO에는 **없다.**

| 화면 라벨 | Platform overlay | CMS 모델 |
|-----------|------------------|----------|
| 전년도 참여 여부 | `application.economy.previousYearParticipation` | `detail.previousYearParticipation` |
| 결연 금융회사명 | `application.economy.lessonReply` | `detail.affiliatedFinancialCompany` |

`GET …/organization-applications/{id}` (가능하면 목록 item도)에 내려라. 새 path를 만들지 마라.

```json
{
  "previousYearParticipation": "참여",
  "affiliatedFinancialCompany": "JA Korea 협력 금융사"
}
```

- `previousYearParticipation`: `참여` / `미참여` (Platform `yes`/`no` 매핑)
- 없으면 null. 400 내지 마라.
- 이 티켓에서 PATCH로 두 필드를 수정할 필요는 없다. GET만 채워라.

---

## D. 강사 신청 정보 수정 PATCH — P2

일반 문서 **§C** 와 같다. COMPANY_SCHOOL 강사 신청에도 **같은 Update** 를 열어라. 1사1교 전용 PATCH를 만들지 마라.

지금 `PATCH …/instructor-applications/{id}` 는 `managerComment` 만 있다. CMS 정보 수정은 아래를 같이 저장한다. 필드가 없어 FE는 저장하지 않는다.

- 강사비 책정 기준 / 지급 기준 / 금액 / 강사비 등급
- 사업소득자 해당 여부

승인 때 쓰는 `FeePolicy` 를 재사용하라. `managerComment` only body 는 지금처럼 코멘트만 갱신.

GET 상세에도 `feePolicy` / `businessIncomeEarnerStatus` 를 내려라. 목록 `instructorFeeGradeSnapshot` 만으로는 화면을 복원할 수 없다.

---

## E. 기관 희망일정의 `resolvedScheduleId` — P1

강사 단건 승인 `assignments[].scheduleId` 는 **program_schedule id** 이다.  
CMS는 승인된 기관의 `GET …/requested-schedules` 에서 `resolvedScheduleId` 를 슬롯 키로 쓴다.

### E.1 지금

`RequestedScheduleResponse.resolvedScheduleId` 는 optional 이다. null 이면 FE가 그 일정을 고르지 못한다. 1사1교에서 기관은 승인됐는데 운영 일정이 안 생기면 강사 승인이 빈 캘린더가 된다.

### E.2 해야 할 일

COMPANY_SCHOOL 기관 신청이 **승인**되면 각 희망 일정에 `resolvedScheduleId` 를 채워라. 새 path를 만들지 마라.

규칙:

1. 승인 시점에 program_schedule 가 있으면 그 id 를 `resolvedScheduleId` 에 넣어라.
2. 아직 일정이 없으면 null. FE는 그 슬롯을 비활성으로 둔다. 200 은 유지.
3. 승인된 1사1교 기관의 희망 일정이 있는데 **전부 null** 이면 강사 배정이 불가능하다. 승인 후 매핑을 만드는 쪽이 우선이다.
4. `requested-schedules.id` 를 `scheduleId` 로 쓰지 마라. 강사 approve Assignment 는 program_schedule id 다.
5. 일반 기관과 같은 필드명을 써라. COMPANY_SCHOOL 전용 키를 만들지 마라.

---

## F. 강사 신청 상세 GET 필드 — P2

일반 문서 **§D** 와 같다. COMPANY_SCHOOL 상세 GET에도 내려라.

- `affiliationOrganizationId` — 재직 현황 저장에 필요. 목록에만 있고 상세에 없으면 상세 단독 조회 시 드롭다운이 실패한다.
- `feePolicy` / `businessIncomeEarnerStatus` — D 와 같이 정보 수정 복원.

새 ID 체계를 만들지 마라.

---

## 4. 요청하지 않는 것

- 목록 소재지/학년 서버 필터 신규 쿼리
- 캘린더 전용 API
- 엑셀 export API
- 1사1교 합반
- 기관 신청 상세 강사 배정 탭 (화면 미마운트)
- 강사 일괄 승인에 `assignments` / `feePolicy` 필수화 — 일괄은 배정 없이 승인 가능해야 한다
- 진행 현황(참여 기관/참여 강사) path

---

## 5. 완료 조건

1. 기관 `approve` / `bulk-approve` / `reject` / `bulk-reject` / cancel 이 시점을 받고, 생략 시 즉시.
2. B.1 · B.2 path 전부 COMPANY_SCHOOL 에서 403 나지 않는다. `availableActions` 가 일반과 같이 내려간다.
3. 기관 상세 GET에 전년도·결연 값이 있으면 채운다.
4. 강사 PATCH 가 `feePolicy` + `businessIncomeEarnerStatus` 를 받고, `managerComment` only 는 그대로다.
5. 승인된 COMPANY_SCHOOL 기관 `requested-schedules` 에 `resolvedScheduleId` 가 있으면 채운다.
6. 강사 상세 GET에 `affiliationOrganizationId` · `feePolicy` 가 목록과 같이 내려간다.
7. OpenAPI를 갱신한다. 1사1교 전용 path는 없다.
8. 기존 body 없는 기관 approve · `reason` only cancel · 강사 `managerComment` only PATCH 가 400 되지 않는다.

---

## 6. 검증

COMPANY_SCHOOL 프로그램 하나, 기관 신청·강사 신청 몇 건으로:

1. 기관 목록 GET + requested-schedules → 200.
2. 기관 상세 GET + PATCH + unmask + 코멘트 → 200.
3. 기관 승인 body 시점 / body 없음 → 예약·즉시. 403 아님.
4. 강사 목록·상세 GET + unmask + 코멘트 PATCH → 200.
5. 강사 단건 승인 `assignments.scheduleId` = 기관 `resolvedScheduleId` → 200.
6. 강사 단건 반려·취소 + `notification` → 200.
7. 강사 재직 현황은 회원 school teacher path. 신청 PATCH에 재직 필드 없음.
8. 정보 수정 PATCH 에 feePolicy 를 넣으면 GET에 돌아온다. `managerComment` only 는 코멘트만.
9. 같은 프로그램이 COMPANY_SCHOOL 인데 기관/강사 approve 가 403 이면 **실패**.
