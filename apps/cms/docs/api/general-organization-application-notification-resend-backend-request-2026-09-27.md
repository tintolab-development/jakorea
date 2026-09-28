# BE 요청 — 일반 프로그램 기관 신청 결과 알림 재발송 (검증·완성)

**작성일:** 2026-09-27  
**대상:** Admin CMS 일반 프로그램 · 기관 신청  
**화면:** 참여자 신청 목록 → 기관 신청 상세 → 기본 정보 → 프로그램 승인 현황 → 「알림 재발송」  
**FE 증상:** `API 연동 안내` 모달 (`일반 프로그램 · 기관 신청 알림 재발송`)  
**관련:**  
- [개인 신청 알림 재발송 요청](./general-individual-application-notification-resend-backend-request-2026-09-16.md)  
- [기관 remote 갭 SSOT](./general-organization-institution-remote-gaps-backend-request-2026-09-16.md) (A-1 알림 재발송 행)

이 문서만으로 검증·보완·스모크할 수 있다.

---

## 한줄

OpenAPI·로컬 `v3/api-docs`에  
`POST /api/admin/organization-applications/{applicationId}/notifications/resend`  
가 **이미 등록**되어 있고 “구현 완료”로 표기된다.  
그러나 CMS FE는 기관 재발송을 **의도적으로 unavailable**로 막아 두었고, HTTP 클라이언트가 없다.  
백엔드는 **런타임이 강사/개인 재발송과 동일하게 동작하는지 검증·보완**하고, FE 연동에 필요한 계약·스모크 PK를 회신해 달라.

---

## FE에서 확인한 사실 (2026-09-27)

| 항목 | 결과 |
|------|------|
| 로컬 `GET /v3/api-docs` path | ✅ 존재 · `operationId=resendOrganizationApplicationNotification` |
| 검토 메모 | `2026-09-25 general organization application result notification resend contract` |
| 무인증 `POST …/notifications/resend` | **401** (라우트 등록됨 · **404 아님**) |
| CMS FE 버튼 클릭 | `notifyProgramApiUnavailable('general-org-application-notification-resend', …)` |
| FE HTTP client | ❌ `applications-api-client`에 org resend 없음 (강사·개인만 있음) |
| Orval dashboard subset | path 미포함 · request schema 타입만 잔존 |
| 2026-09-16 갭 문서 | 알림 재발송을 **「API 없음 · BE 요청 제외(보류)」**로 적어 둠 → **현재 OpenAPI와 불일치** |

즉 화면의 “API 연동 안내”는 **BE에 path가 없어서가 아니라**, FE가 연동을 보류한 상태에서 뜬다.  
그래도 FE가 붙이려면 BE 런타임(이벤트·상태·응답·idempotency)이 개인/강사와 같은 수준인지 **확인·보완**이 필요하다.

---

## 백엔드 전달용 프롬프트

아래를 **CMS 백엔드 레포(JABACK, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고 이 문서 계약만 사용하라.

### Goal

일반 프로그램 **기관 신청**의 승인/반려 결과 알림을 CMS 「알림 재발송」으로 다시 보낼 수 있게 하라.

이미 OpenAPI에 있는 endpoint를 **신규 path로 바꾸지 마라.**

```http
POST /api/admin/organization-applications/{applicationId}/notifications/resend
```

- `operationId`: `resendOrganizationApplicationNotification`
- Request: `OrganizationApplicationNotificationResendRequest` (`timing`, `scheduledAt`, `reason`)
- Header(optional): `Idempotency-Key`
- Response: `ApplicationDecisionResponse`
- 권한: `APPLICATION_WRITE` · 프로그램 `APPLICATION_REVIEW` capability · 담당 프로그램 범위

강사·개인 재발송과 동일한 패턴을 유지한다.

```http
POST /api/admin/instructor-applications/{applicationId}/notifications/resend
POST /api/admin/individual-applications/{applicationId}/notifications/resend
```

참고 구현(개인 요청 문서와 동일 계열):

- Side effect: `ApplicationDecisionSideEffectService#enqueueDecisionNotification` (또는 기관 동등 경로)
- 상태 전이 없이 **알림 event/outbox만** 생성

### Out of scope / 금지

- path·operationId 변경
- FE·Orval 수정
- 재발송 시 신청 상태를 다시 승인/반려 처리
- 기존 decision 이력·원 반려 사유 덮어쓰기(재발송 `reason`은 **이번 발송 snapshot**)
- 강사/개인/봉사자 재발송 계약 변경
- TRUNCATE · prod Flyway에 운영 카피 삽입

---

## 1. 런타임 검증 (필수)

관리자 Bearer로 다음을 확인하라. OpenAPI “구현 완료”만으로 끝내지 마라.

1. `APPROVED` 기관 신청 1건 — `timing=IMMEDIATE` 성공 · `notificationEventId` 존재 · `fromStatus === toStatus === APPROVED`
2. `REJECTED` 기관 신청 1건 — `reason` 포함 즉시 재발송 성공 · 반려 event 생성
3. `AUTO_REJECTED`(화면 “사전 반려” 등) — **정책 확정 후** 허용 또는 `409 …_NOT_ALLOWED` (아래 §3)
4. `WAITING_REVIEW` / `SUBMITTED` — `409` (재발송 불가)
5. 존재하지 않는 `applicationId` — `404`
6. 권한 없는 관리자 — `403`
7. `timing=SCHEDULED` + 미래 `scheduledAt` 성공 · 과거 시각 `422`
8. `IMMEDIATE` + `scheduledAt` 동시 → `422`
9. 동일 `Idempotency-Key` 재요청 — 동일 결과 · 중복 event 없음
10. 재발송 전후 `application_status` 불변
11. outbox/event 수신자가 **해당 기관 신청의 담당 교사(회원)** 와 일치
12. 감사로그 기록 · 연락처/이메일/사유 원문 일반 로그 미노출

실패·stub·TODO면 강사/개인과 같은 수준으로 **완성**하라.

---

## 2. 요청 계약 (FE 모달과 맞춤)

CMS 모달은 즉시 / 예약 두 방식이다.

즉시:

```json
{
  "timing": "IMMEDIATE",
  "scheduledAt": null,
  "reason": null
}
```

예약:

```json
{
  "timing": "SCHEDULED",
  "scheduledAt": "2026-09-28T03:30:00Z",
  "reason": null
}
```

반려 재발송:

```json
{
  "timing": "IMMEDIATE",
  "scheduledAt": null,
  "reason": "신청 자격 요건을 충족하지 못했습니다."
}
```

검증:

| 조건 | 기대 |
|------|------|
| `timing` null/빈 값 | `IMMEDIATE`로 정규화 가능 (강사와 동일) |
| `IMMEDIATE` | `scheduledAt` null |
| `SCHEDULED` | `scheduledAt` 필수 · 서버 now보다 미래 |
| `REJECTED`(및 재발송 허용한 반려 계열) | `reason` trim 후 필수 · max 500 |
| `APPROVED` | `reason` 미사용 · null 정규화 |
| 잘못된 timing/예약 | `422 INVALID_NOTIFICATION_SCHEDULE` |

---

## 3. 상태별 event

| 현재 상태 | eventType (기존 승인/반려 바인딩 재사용) | 결과 |
|-----------|------------------------------------------|------|
| `APPROVED` | 기관 승인 결과 알림 (기존 approve 경로와 동일 키) | 재발송 허용 |
| `REJECTED` | 기관 반려 결과 알림 (기존 reject 경로와 동일 키) | `reason` snapshot으로 재발송 |
| `AUTO_REJECTED` | **정책 확정 필요** | 반려와 동일 허용 **또는** `409 ORGANIZATION_APPLICATION_NOTIFICATION_RESEND_NOT_ALLOWED` |
| 그 외 | — | `409 ORGANIZATION_APPLICATION_NOTIFICATION_RESEND_NOT_ALLOWED` |

`AUTO_REJECTED` 정책을 회신에 **한 줄로 명시**하라.  
CMS는 승인·반려 UI에서만 재발송 버튼을 노출한다. `AUTO_REJECTED`를 UI `rejected`로 매핑하면 버튼이 보일 수 있다.

상태를 바꾸기 위한 API가 아니다.

- `application_status` / participant / 승인·반려 transition 재실행 금지
- 기존 결과에 맞는 알림 event/outbox만 생성

---

## 4. 응답

`ApplicationDecisionResponse` 재사용.

```json
{
  "applicationId": 123456,
  "applicationType": "ORGANIZATION",
  "fromStatus": "APPROVED",
  "toStatus": "APPROVED",
  "participantId": 789,
  "notificationEventId": 123456,
  "availableActions": ["NOTIFICATION_RESEND"]
}
```

- `fromStatus === toStatus`
- 성공 시 `notificationEventId` 필수
- 연결 participant 없으면 `participantId` null 허용
- 목록/상세 재조회 시 **최근 알림 발송 시각**(또는 동등 필드)이 갱신되어 FE가 「승인 현황」 옆 시각을 표시할 수 있어야 한다. 필드명이 있으면 회신에 적어라.

---

## 5. 오류 계약

| HTTP | errorCode | 조건 |
|------|-----------|------|
| 404 | `ORGANIZATION_APPLICATION_NOT_FOUND` | 신청 없음 |
| 403 | 기존 권한/capability | `APPLICATION_WRITE` 또는 심사 권한 없음 |
| 409 | `ORGANIZATION_APPLICATION_NOTIFICATION_RESEND_NOT_ALLOWED` | 허용 상태 아님 |
| 409 | `DUPLICATE_NOTIFICATION_REQUEST` | idempotency 충돌 |
| 422 | `INVALID_NOTIFICATION_SCHEDULE` | timing/예약 오류 |
| 422 | `ORGANIZATION_APPLICATION_REJECTION_REASON_REQUIRED` | 반려인데 사유 없음 |
| 5xx / 기존 알림 코드 | — | outbox/event 실패 |

공통 error envelope 사용.

---

## 6. OpenAPI

구현·검증 후 OpenAPI가 실제와 일치하는지 확인해라.

- path / operationId 유지
- `timing` enum `IMMEDIATE` \| `SCHEDULED` (가능하면 schema에 enum 명시)
- `scheduledAt` date-time · `reason` max 500
- `Idempotency-Key` optional header
- 403/404/409/422 코드 문서화
- dashboard Orval subset에 이 path가 빠지지 않게 **applications 워크플로우 스펙에 포함**되는지 확인 (FE codegen이 쓰게)

---

## 7. 스모크 curl

로컬 DB에서 일반 프로그램 기관 신청 `APPROVED` / `REJECTED` (필요 시 `AUTO_REJECTED`) PK를 골라라.

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: org-approved-resend-001" \
  http://localhost:8080/api/admin/organization-applications/{approvedApplicationId}/notifications/resend \
  -d '{"timing":"IMMEDIATE","scheduledAt":null,"reason":null}'
```

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: org-rejected-resend-001" \
  http://localhost:8080/api/admin/organization-applications/{rejectedApplicationId}/notifications/resend \
  -d '{"timing":"IMMEDIATE","scheduledAt":null,"reason":"신청 자격 요건을 충족하지 못했습니다."}'
```

---

## 8. 수락 기준

1. 위 path로 승인/반려 재발송이 성공한다.
2. notification event/outbox가 생성되고 수신자가 해당 신청 담당 교사와 일치한다.
3. 즉시/예약·반려 사유 snapshot이 계약대로다.
4. 재발송 전후 신청 상태가 변하지 않는다.
5. 권한·capability·상태 검증이 서버에서 이뤄진다.
6. OpenAPI ↔ 실제 요청/응답이 일치한다.
7. `notificationEventId`로 이력을 추적할 수 있다.
8. 강사/개인 재발송에 회귀가 없다.
9. `AUTO_REJECTED` 허용 여부가 문서·오류 코드와 일치한다.

---

## 9. BE 완료 후 FE 전달 정보

- 최종 path / operationId (변경 없음 확인)
- request/response 예시 JSON
- `AUTO_REJECTED` 정책
- 목록·상세의 **알림 발송 시각 필드명**
- 사용 eventType 키 (승인/반려)
- idempotency 동작
- 오류 코드 최종 목록
- 스모크에 쓴 `applicationId` (APPROVED / REJECTED [/ AUTO_REJECTED])
- outbox 확인 방법
- 추가·수정한 테스트 목록

---

## FE 후속 (이 문서 범위 밖 · 참고)

BE 검증·회신 후 FE에서:

1. OpenAPI/Orval 재생성 (dashboard subset에 path 포함 확인)
2. `resendOrganizationApplicationNotification` client + mutation
3. `applicant-list`의 `notifyProgramApiUnavailable(…기관 신청 알림 재발송)` 제거 → 모달 확인 후 HTTP 호출
4. `immediate/manual` → `IMMEDIATE/SCHEDULED`, `manualNotifyAt` → ISO `scheduledAt`
5. 성공 시에만 모달 닫기 · 목록/상세 invalidate
6. loading·중복 클릭 방지 · 403/404/409/422 메시지
7. SSOT 갭 문서 A-1 알림 재발송 행을 ✅로 갱신

---

## 비범위

- FE mock/localStorage로 발송 시각만 갱신
- generic 수동 알림 API로 우회
- path를 `resend-notification` 등으로 rename
- 1사1교/UJAT/Gemini 전용 별도 path (일반 기관 canonical과 동일하면 공유)
