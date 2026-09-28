# Cursor prompt — CMS · Platform 자동발송 잔여 계약 (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 계약만** 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(enum·NOT NULL·권한)만 하라.

이 문서는 프론트 레포 경로:

`docs/notifications/cms-platform-auto-send-backend-cursor-prompt-2026-09-25.md`

관련 FE 계약: `docs/notifications/cms-platform-auto-send.md`

자동발송(알림톡·메일·문자·WEB outbox)은 이미 catalog가 보낸다. 이 작업은 **없는 producer HTTP만** 채운다. 채널 bind·스케줄러·NHN 템플릿·새 `eventType`을 만들지 마라.

---

## Goal

1. 일반 프로그램 **기관 신청** 결과 알림 재발송을 개인 신청과 같은 계약으로 추가한다.
2. UJAT 기관 일정 **승인**이 `UJAT_ORGANIZATION_SCHEDULE_APPROVED`를 만드는 관리자 API가 없으면 그때만 추가한다. 있으면 path만 답변에 적는다.
3. 회원 인박스·관리자 인박스에 **실제로 적재되는** `eventType`과 현재 채널을 답변에 적는다. 코드로 키 이름을 바꾸지 마라.

---

## Out of scope / 금지

- `GET /api/portal/me/notifications`, unread-count, `PATCH .../read|hidden|clicked`, `PATCH .../read-all` 의 path·스키마 변경.
- `POST /api/admin/individual-applications/{applicationId}/notifications/resend` 변경.
- `POST /api/admin/instructor-applications/{applicationId}/notifications/resend` 변경.
- 신청 **접수** 전용 `eventType` 신설. `POST /api/portal/programs/{programId}/applications` 변경.
- `ADMIN_*` 이벤트를 `GET /api/portal/me/notifications`에 넣기. `ADMIN_*`는 관리자 인박스만.
- 채널 on/off API, NHN 템플릿 작성, 휴면·동의 만료 스케줄러 신설.
- 동의 철회 `POST /api/portal/me/consents/documents/{documentId}/withdraw`, 신청 취소 `POST /api/portal/me/program-applications/{applicationType}/{applicationId}/cancel`, `GET /api/portal/me/program-applications`. 이미 있다.
- Platform·CMS 프론트 수정.
- TRUNCATE. prod Flyway에 운영 카피를 넣지 마라.

---

## 유지 (변경 금지)

| Method | Path | 역할 |
|--------|------|------|
| GET | `/api/portal/me/notifications` | 회원 WEB 인박스. 스키마 `MemberNotificationResponse` |
| GET | `/api/portal/me/notifications/unread-count` | 미확인 수 |
| PATCH | `/api/portal/me/notifications/{recipientId}/read` | 읽음 |
| PATCH | `/api/portal/me/notifications/{recipientId}/hidden` | 숨김 |
| PATCH | `/api/portal/me/notifications/{recipientId}/clicked` | 클릭 |
| PATCH | `/api/portal/me/notifications/read-all` | 전체 읽음 |
| POST | `/api/admin/individual-applications/{applicationId}/notifications/resend` | 개인 결과 알림 재발송. `operationId` `resendIndividualApplicationNotification` |
| POST | `/api/admin/instructor-applications/{applicationId}/notifications/resend` | 강사 결과 알림 재발송 |

회원 인박스 항목은 `title`, `message`, `notificationCategoryLabel`을 채운다. `title`은 **한글 제목**이다. raw `eventType` 문자열과 같게 내려보내지 마라.

---

## 1. 기관 신청 결과 알림 재발송 (신규)

OpenAPI에 이 path는 없다. 개인 재발송을 복제한다.

```http
POST /api/admin/organization-applications/{applicationId}/notifications/resend
```

권한:

```java
@RequiresAdminPermission("APPLICATION_WRITE")
```

범위:

- 일반 프로그램 **기관(학교) 신청만** 허용한다.
- UJAT·Gemini·1사1교 신청은 이 path로 받지 마라. 403 또는 404.
- URL의 `applicationId`로 조회한 신청의 프로그램 범위를 서버에서 검증한다. 담당 프로그램 밖이면 403.

헤더 (개인과 동일, optional):

| 이름 | 값 |
|------|-----|
| `Idempotency-Key` | 문자열. 같은 키 재요청은 중복 enqueue를 만들지 않는다 |

Body. 필드명은 `IndividualApplicationNotificationResendRequest`와 같다. 스키마 이름을 개인용으로 재사용해도 되고, 기관용 이름을 새로 두되 **필드는 아래 세 개만** 둔다.

| 필드 | 타입 | 규칙 |
|------|------|------|
| `timing` | string | 개인 재발송과 같은 enum. 즉시 / 예약 |
| `scheduledAt` | date-time | 예약일 때만. 과거 시각은 400 |
| `reason` | string | min 0, max 500. **반려 재발송일 때만** 스냅샷에 포함한다. 승인 재발송의 reason은 알림 본문에 넣지 마라 |

응답: `ApplicationDecisionResponse` (개인 재발송과 같은 스키마).

부작용:

- 해당 신청의 **마지막 승인 또는 반려**와 같은 decision notification을 outbox에 다시 넣는다.
- 새 `eventType`을 만들지 마라. 승인/반려 때 이미 쓰는 키를 재사용한다.
- 승인·반려가 한 번도 없는 신청은 409.
- 감사로그 실패 시 성공 처리하지 마라 (fail-closed).

에러:

| status | 조건 |
|--------|------|
| 400 | body 검증 실패, 예약 시각이 과거 |
| 401 | 인증 없음 |
| 403 | `APPLICATION_WRITE` 없음, 프로그램 범위 밖, 일반 기관 신청이 아님 |
| 409 | 상태 전이 불가, 멱등 충돌, 승인/반려 이력 없음 |
| 500 | 감사로그 또는 enqueue 실패 |

OpenAPI와 컨트롤러·서비스를 같이 갱신하라. operationId 예: `resendOrganizationApplicationNotification`.

---

## 2. UJAT 기관 일정 승인 (없을 때만)

CMS가 지금 호출하는 수정 요청:

```http
POST /api/admin/programs/{programId}/ujat/organization-applications/{applicationId}/schedule-change-request
```

body: `{ "reason": string }`. 이 path는 유지한다.

승인 부수효과가 **`UJAT_ORGANIZATION_SCHEDULE_APPROVED`** 인 관리자 API를 먼저 찾아라.

- **있으면:** 새 path를 만들지 마라. 답변에 method·path·요청 body·발생 `eventType`만 적어라.
- **없으면:** 일반 프로그램 일정 확정과 같은 권한·409(동시 수정) 규칙으로 승인만 추가한다.

없을 때의 계약:

```http
POST /api/admin/programs/{programId}/ujat/organization-applications/{applicationId}/schedule-approval
```

- 권한: 해당 UJAT 프로그램 일정 승인에 이미 쓰는 관리자 권한. 없으면 `APPLICATION_WRITE`와 프로그램 범위 검증.
- 성공 시 이벤트 키는 **`UJAT_ORGANIZATION_SCHEDULE_APPROVED` 만**. 새 키 금지.
- 반려(수정 요청)는 위 `schedule-change-request`가 담당한다. 반려 path를 복제하지 마라.
- 이미 승인된 건의 재승인은 409.
- UJAT가 아닌 프로그램 id는 403 또는 404.

---

## 3. 답변 인벤토리 (코드 변경 아님)

OpenAPI `MemberNotificationResponse.eventType` 예시는 `INDIVIDUAL_APPLICATION_APPROVED`이다. FE 라벨 맵에는 이 키가 없다. **키 문자열을 바꾸거나 예시를 고쳐서 맞추지 마라.** 런타임에 적재되는 이름을 답변에 적어라.

표를 두 개 작성한다. 행은 catalog에 있는 키만. 채널이 꺼져 있으면 칸을 비운다. 「시트에 있다」와 「지금 나간다」를 구분한다. 승인된 템플릿이 bind된 외부채널만 ALIMTALK / EMAIL / SMS에 표시한다. 승인 전 WEB만이면 WEB만 표시한다.

### 회원 인박스 (`GET /api/portal/me/notifications`)

| eventType | WEB | EMAIL | ALIMTALK | SMS | 비고 |
|-----------|-----|-------|----------|-----|------|
| (실제 키) | | | | | |

`ADMIN_*` 가 이 목록에 있으면 결함이다. 회원 API에서 빼라. 그게 이 섹션에서 허용하는 **유일한** 코드 수정이다.

### 관리자 인박스 (`GET /api/admin/notifications`)

| eventType | WEB | EMAIL | ALIMTALK | SMS | 비고 |
|-----------|-----|-------|----------|-----|------|
| (실제 키) | | | | | |

FE가 이미 라벨로 가진 키는 아래와 같다. 표에서 빠지면 「미적재」라고 비고에 적어라. 없는 키를 이 작업에서 insert하지 마라.

`MEMBER_LOGIN_FAILURE_NOTICE`, `MEMBER_LOGIN_LOCK_NOTICE`, `ADMIN_LOGIN_LOCK_NOTICE`, `ADMIN_MFA_FAILURE_NOTICE`, `MEMBER_SIGNUP_COMPLETED`, `MEMBER_CONSENT_COMPLETED`, `MEMBER_CONSENT_WITHDRAWN`, `DORMANT_ACCOUNT_TRANSITIONED`, `DORMANT_ACCOUNT_PRE_NOTICE`, `MEMBER_CONSENT_EXPIRING`, `MEMBER_IDENTITY_VERIFIED`, `DORMANT_ACCOUNT_WITHDRAWAL_PRE_NOTICE`, `MEMBER_WITHDRAWAL_COMPLETED`, `ORGANIZATION_APPLICATION_APPROVAL_CANCELLED`, `ORGANIZATION_APPLICATION_REJECTION_CANCELLED`, `INDIVIDUAL_APPLICATION_REJECTION_CANCELLED`, `PROGRAM_APPLICATION_CANCELLED`, `ADMIN_PROGRAM_APPLICATION_CANCELLED`, `STUDENT_ROSTER_SUBMISSION_DEADLINE_NOTICE`, `PORTRAIT_CONSENT_SUBMISSION_DEADLINE_NOTICE`, `LECTURE_REPORT_SUBMISSION_DEADLINE_NOTICE`, `EXPENSE_RECEIPT_SUBMISSION_DEADLINE_NOTICE`, `SETTLEMENT_APPLICATION_SUBMISSION_DEADLINE_NOTICE`, `UJAT_ORGANIZATION_SCHEDULE_SUBMITTED`, `UJAT_ORGANIZATION_SCHEDULE_APPROVED`, `UJAT_ORGANIZATION_SCHEDULE_REVISION_REQUESTED`, `UJAT_VOLUNTEER_ATTENDANCE_STATUS_CHANGED`, `UJAT_ATTENDANCE_MANAGER_CHANGED`, `PROGRAM_PARTICIPANT_COMPLETION_COMPLETED`, `PROGRAM_PARTICIPANT_COMPLETION_NOT_COMPLETED`, `ACTIVITY_ORGANIZATION_ASSIGNED`, `ACTIVITY_ORGANIZATION_ASSIGNMENT_CANCELLED`, `PROGRAM_START_NOTICE`, `PROGRAM_PREPARATION_NOTICE`, `PROGRAM_NOTICE_CREATED`, `SETTLEMENT_CORRECTION_COMPLETED`, `PROGRAM_INFO_CHANGED`, `EDUCATION_SCHEDULE_CONFIRMED`, `EDUCATION_SCHEDULE_CHANGED_BEFORE_ASSIGNMENT`, `EDUCATION_SCHEDULE_CHANGED_AFTER_ASSIGNMENT`, `ASSIGNMENT_FEEDBACK_REQUESTED`, `EDUCATION_PLAN_FEEDBACK_REQUESTED`, `EDUCATION_JOURNAL_FEEDBACK_REQUESTED`, `ADMIN_INDIVIDUAL_PROGRAM_INSTRUCTOR_UNASSIGNED`, `ADMIN_ORGANIZATION_PROGRAM_INSTRUCTOR_UNASSIGNED`, `ADMIN_PROGRAM_NOTICE_CREATED`, `ADMIN_PORTRAIT_CONSENT_UNSUBMITTED`, `ADMIN_STUDENT_ROSTER_UNSUBMITTED`

구 키 `UJAT_VOLUNTEER_ATTENDANCE_NOTICE`, `PROGRAM_PARTICIPANT_COMPLETION_FAILED` 는 신규 enqueue에 쓰지 마라. 이미 적재된 행은 그대로 둔다.

`MemberNotificationResponse` 한 건 예시(개인정보 없는 값)를 답변에 붙여라. `title`이 한글이고 `eventType` raw와 다른지 보여라.

---

## 완료 조건

1. 기관 재발송 POST가 OpenAPI·컨트롤러·서비스에 있고, 개인 재발송과 같은 enqueue 경로를 탄다.
2. UJAT 일정 승인은 기존 path를 답변에 적었거나, 없었을 때만 `UJAT_ORGANIZATION_SCHEDULE_APPROVED` 하나의 신규 path를 추가했다.
3. 답변에 회원/관리자 `eventType`×채널 표가 있다.
4. 위 「금지」목록의 path·`eventType` 문자열은 diff에 없다.
