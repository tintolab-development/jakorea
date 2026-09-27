# Cursor prompt — 프로그램 유형별 기관 신청 결과 알림 재발송 (전 유형 · JABACK)

| 항목 | 값 |
|------|-----|
| **상태** | ✅ BE 수용 · FE 연동 (2026-09-27) |
| **작성일** | 2026-09-27 |
| **대상** | Admin CMS · **모든 프로그램 유형**의 기관 신청 「알림 재발송」 |
| **제품 원칙** | 승인·반려 결과 알림을 보내는 유형이면 **유형별로 재발송이 열려 있어야 정상**이다. GENERAL만 열어 두고 나머지는 403/미구현이면 미완성이다. |
| **BE handoff** | `JABACK/docs/frontend/program-organization-notification-resend-all-types-frontend-handoff-2026-09-27.md` |
| **FE 반영 메모** | [`program-organization-notification-resend-all-types-frontend-handoff-2026-09-27.md`](./program-organization-notification-resend-all-types-frontend-handoff-2026-09-27.md) |

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서 계약만** 사용하라.

프론트 문서:

`apps/cms/docs/api/program-organization-application-notification-resend-all-types-backend-prompt-2026-09-27.md`

관련:

- 일반 기관 재발송(기존): [`general-organization-application-notification-resend-backend-request-2026-09-27.md`](./general-organization-application-notification-resend-backend-request-2026-09-27.md)
- TT 단독 초안(본 문서로 통합): [`trained-teacher-organization-application-notification-resend-backend-prompt-2026-09-27.md`](./trained-teacher-organization-application-notification-resend-backend-prompt-2026-09-27.md)
- 유형 로드맵: [`programs-api-conversion-roadmap.md`](./programs-api-conversion-roadmap.md)

---

## 한줄

CMS 기관 신청 상세의 「알림 재발송」은 UI가 여러 프로그램 표면에 공유된다.  
BE는 현재 공통 path를 **GENERAL만** 허용하고(OpenAPI: UJAT·Gemini·1사1교 403), TRAINED_TEACHER 전용 재발송 path는 **없다.**  
**GENERAL · COMPANY_SCHOOL · UJAT · GEMINI(_TRAINING) · TRAINED_TEACHER** 각각에서 승인/반려 결과 알림을 재발송할 수 있게 하라.  
요청/응답 shape·멱등·상태 불변 규칙은 유형 간 **동일**하고, path만 유형 격리 규칙에 맞게 둔다.

---

## FE에서 확인한 사실 (2026-09-27)

| 항목 | 결과 |
|------|------|
| CMS UI | 기관 신청 상세 → 프로그램 승인 여부 → 「알림 재발송」 모달(즉시/예약 · 반려 시 사유) |
| 공통 path | `POST /api/admin/organization-applications/{applicationId}/notifications/resend` |
| OpenAPI 범위 | **GENERAL만** 허용 · **UJAT·Gemini·1사1교 = 403** · TRAINED_TEACHER 미언급(=사실상 비허용) |
| TT 승인/반려 | ✅ `POST …/programs/{programId}/trained-teacher/organization-applications/{id}/approve\|reject` |
| TT 재발송 | ❌ path 없음 |
| FE 현재 | GENERAL remote일 때만 재발송 HTTP 호출. TT 등에서는 버튼 차단/unavailable (무반응 방지) |
| 강사/개인 재발송 | 별도 path 존재(일반 중심). **이번 문서 1차 범위는 기관(ORGANIZATION) 재발송** |

증상 예: `/programs/trained-teachers?…&applicantId=…` 에서 재발송 클릭 무반응 → 계약 갭.

---

## 백엔드 전달용 프롬프트

### Goal

프로그램 유형과 무관하게, **기관 신청이 APPROVED/REJECTED인 건**에 대해 CMS가 결과 알림을 재발송할 수 있게 하라.

- 상태 전이 없음 · 기존 반려 사유 덮어쓰기 없음 · `reason`은 **이번 발송 snapshot**
- 즉시/`SCHEDULED` · `Idempotency-Key` · 오류 코드는 일반 기관 재발송과 **동일 계열**
- 수신자 = 해당 기관 신청 **담당 교사(회원)** (각 유형 approve/reject 알림과 동일)
- 목록/상세에 `resultNotificationSentAt` · `availableActions` ⊇ `RESEND_NOTIFICATION` 투영

### Out of scope / 금지

- FE·Orval·CMS 화면 수정 (BE만)
- 재발송으로 승인/반려 transition 재실행
- 원 decision 이력·원 rejectReason 덮어쓰기
- TRUNCATE · prod Flyway 운영 카피 삽입
- FE mock/localStorage로 발송 시각만 갱신
- 강사/개인/봉사자 재발송 계약 **전면 재설계** (필요 시 §11 참고만 · 1차 DoD 아님)
- 한 유형만 열고 나머지는 “나중에”로 문서만 닫기 — **유형 매트릭스 전 행을 이번 작업에서 닫거나, 불가 행은 handoff에 명시적 blocker**로 남겨라

---

## 1. 유형 매트릭스 (SSOT)

| # | programType (또는 그룹) | CMS 표면 | 기관 신청 API 기반 (현황) | 재발송 전략 (이번 요청) | 우선 |
|---|-------------------------|----------|---------------------------|-------------------------|------|
| A | `GENERAL` (`GENERAL` / `GENERAL_ORGANIZATION` 등 일반 기관) | `/programs/general` | 공통 `…/organization-applications/**` | **기존 path 유지** · 런타임 검증 | P0 |
| B | `COMPANY_SCHOOL` (1사1교) | `/programs/company-school` | 공통 org applications 사용 가정 | **공통 path allowlist에 포함** (403 제거) | P0 |
| C | `UJAT` | `/programs/ujat` | UJAT 전용 `…/programs/{id}/ujat/organization-applications/**` + 공통 혼재 가능 | **공통 allowlist 또는 UJAT 전용 path** 중 하나 · FE와 승인 path와 맞출 것 | P0 |
| D | `GEMINI` / `GEMINI_TRAINING` | `/programs/gemini/…` | 모집 하위 org applications · enum 이중 | **allowlist 또는 Gemini 전용 path** · enum SSOT를 handoff에 확정 | P0 |
| E | `TRAINED_TEACHER` | `/programs/trained-teachers` | TT 전용 `…/trained-teacher/organization-applications/**` | **TT 전용 path 신규** (공통 path에 몰래 태우지 말 것) | P0 |

**제품 규칙:** 위 표의 유형은 **모두** 재발송 가능해야 한다.  
GENERAL만 ✅ 이고 나머지가 403/404면 수락 실패다.

---

## 2. Path 전략 (두 층)

### 2.1 공통 path (A·B, 그리고 C/D가 공통 mutation을 쓰는 경우)

```http
POST /api/admin/organization-applications/{applicationId}/notifications/resend
```

- `operationId`: `resendOrganizationApplicationNotification` (**변경 금지**)
- Request: 기존 `OrganizationApplicationNotificationResendRequest`
- Header: optional `Idempotency-Key`
- Response: `ApplicationDecisionResponse`

**변경점:** OpenAPI·런타임의 “GENERAL only / UJAT·Gemini·1사1교 403”을 폐기하고,  
아래 **허용 programType 집합**으로 교체한다.

허용(최소):

- `GENERAL` 및 일반 기관으로 취급하는 하위 타입(기존과 동일 그룹)
- `COMPANY_SCHOOL`
- `UJAT` — **공통 path로 기관 decision을 하는 경우만**
- `GEMINI` 또는 `GEMINI_TRAINING` — **공통 path로 기관 decision을 하는 경우만** (어느 enum이 기관 row인지 handoff에 확정)

거절:

- `TRAINED_TEACHER` → 공통 path에서는 **계속 403/404** (E는 전용 path 사용)
- 신청이 해당 programType이 아님 / 권한 없음

OpenAPI description을 실제 allowlist와 **일치**시켜라.  
“GENERAL만” 문구를 남겨 두면 FE·QA가 틀린다.

### 2.2 TT 전용 path (E · 필수)

TT는 승인/반려가 이미 전용 path다. 재발송도 동일 네임스페이스에 둔다.

```http
POST /api/admin/programs/{programId}/trained-teacher/organization-applications/{applicationId}/notifications/resend
```

권장 `operationId`: `resendTrainedTeacherOrganizationApplicationNotification`

- `programId` ↔ 신청의 programId · `programType=TRAINED_TEACHER` 일치 검증 (approve/reject와 동일)
- body/header/response 의미는 공통 path와 **동일**
- 공통 path에 TT를 허용해 FE가 공통 URL을 쓰게 만들지 **마라** (유형 격리)

나란히:

```http
POST …/trained-teacher/organization-applications/{id}/approve
POST …/trained-teacher/organization-applications/{id}/reject
POST …/trained-teacher/organization-applications/{id}/notifications/resend   ← 신규
```

### 2.3 UJAT / Gemini 전용 path (C/D · 조건부)

해당 유형의 **승인/반려가 전용 path**이면 재발송도 전용 path를 추가하라.  
예(이름은 기존 라우트 컨벤션에 맞출 것):

```http
POST /api/admin/programs/{programId}/ujat/organization-applications/{applicationId}/notifications/resend
```

```http
POST /api/admin/programs/{programId}/…/organization-applications/{applicationId}/notifications/resend
# Gemini: 기존 recruitment/org-application 라우트 prefix를 따를 것
```

승인/반려가 **공통 path만** 쓰면 §2.1 allowlist로 충분하고, 전용 path는 불필요하다.  
**handoff에 “C/D는 공통 vs 전용 중 무엇으로 닫았는지”를 한 줄로 명시**하라.

---

## 3. 공통 요청 계약 (모든 유형 동일)

CMS 모달: 즉시 / 예약 · 기관 반려일 때만 사유.

### 즉시 승인

```json
{ "timing": "IMMEDIATE", "scheduledAt": null, "reason": null }
```

### 예약 승인

```json
{ "timing": "SCHEDULED", "scheduledAt": "2026-09-28T03:30:00Z", "reason": null }
```

### 즉시 반려

```json
{
  "timing": "IMMEDIATE",
  "scheduledAt": null,
  "reason": "신청 자격 요건을 충족하지 못했습니다."
}
```

| 조건 | 기대 |
|------|------|
| `timing` null/빈 값 | `IMMEDIATE` 정규화 가능 |
| `IMMEDIATE` | `scheduledAt` null |
| `SCHEDULED` | 미래 `scheduledAt` 필수 |
| `IMMEDIATE`+`scheduledAt` / 과거 시각 | `422 INVALID_NOTIFICATION_SCHEDULE` |
| `REJECTED` | `reason` trim 필수 · max 500 · 없으면 `422 …_REJECTION_REASON_REQUIRED` |
| `APPROVED` | `reason` → null |
| `reason` > 500 | `400` |
| 멱등 키 무효 | `400 IDEMPOTENCY_KEY_INVALID` |
| 동일 키·동일 body | 최초 200 재생 · 중복 event 없음 |
| 동일 키·다른 body | `409 DUPLICATE_NOTIFICATION_REQUEST` |

---

## 4. 상태 · event · 불변식 (모든 유형 동일)

| 상태 | 재발송 | event |
|------|--------|-------|
| `APPROVED` | 허용 | 해당 유형 **기관 승인** 결과 알림 (approve와 **동일 eventType**) |
| `REJECTED` | 허용 · reason snapshot | 해당 유형 **기관 반려** 결과 알림 (reject와 **동일 eventType**) |
| `AUTO_REJECTED` | 정책 확정 후 허용 또는 `409 …_NOT_ALLOWED` | handoff에 **유형별 한 줄** |
| `WAITING_REVIEW` / `SUBMITTED` / 기타 | `409 …_NOT_ALLOWED` | — |

불변:

- `application_status` · `approvedAt` · `rejectedAt` · 원 rejectReason
- participant / decision transition 재실행 금지
- 알림 event/outbox만 생성

---

## 5. 응답 (모든 유형 동일 의미)

`ApplicationDecisionResponse` 권장:

```json
{
  "applicationId": 1000007,
  "applicationType": "ORGANIZATION",
  "fromStatus": "REJECTED",
  "toStatus": "REJECTED",
  "participantId": null,
  "notificationEventId": 123456,
  "availableActions": ["VIEW", "RESEND_NOTIFICATION"]
}
```

- `fromStatus === toStatus`
- `notificationEventId` 필수
- CMS FE(GENERAL)는 액션 토큰 **`RESEND_NOTIFICATION`** 사용.  
  다른 철자(`NOTIFICATION_RESEND`)를 쓰면 **전 유형 handoff에 단일 SSOT 문자열**을 정해 FE가 맞춘다. **유형마다 다르게 주지 마라.**

---

## 6. 목록·상세 투영 (유형별 DTO)

재발송 가능 상태의 기관 신청 GET(목록·상세)에:

| 필드 | 의미 |
|------|------|
| `resultNotificationSentAt` | 최근 결과 알림 발송/예약 시각. 없으면 null. 재발송 시 갱신. status 시각과 독립 |
| `availableActions` | 재발송 가능·권한 있으면 `RESEND_NOTIFICATION` 포함 |

적용 대상 예:

- 공통: `OrganizationApplication*` 목록/상세 DTO
- TT: `TrainedTeacherOrganizationApplicationResponse` (+ OpenAPI additive)
- UJAT/Gemini: 각 유형 org-application DTO

path·required 변경 금지 · additive만.

---

## 7. 오류 계약 (공통)

| HTTP | errorCode | 조건 |
|------|-----------|------|
| 404 | `ORGANIZATION_APPLICATION_NOT_FOUND` 등 | 없음 · program 스코프 불일치 |
| 403 | 권한/capability · `FORBIDDEN_APPLICATION_ACTION` | 쓰기/심사 권한 없음 · **허용 유형 밖**(예: 공통 path로 TT 호출) |
| 409 | `ORGANIZATION_APPLICATION_NOTIFICATION_RESEND_NOT_ALLOWED` | 상태 비허용 |
| 409 | `DUPLICATE_NOTIFICATION_REQUEST` | 멱등 충돌 |
| 422 | `INVALID_NOTIFICATION_SCHEDULE` / `…_REJECTION_REASON_REQUIRED` | 스케줄·사유 |
| 400 | `IDEMPOTENCY_KEY_INVALID` / body | |
| 5xx | 기존 알림·감사 | enqueue/감사 실패 |

---

## 8. 런타임 검증 매트릭스 (필수)

유형마다 APPROVED 1 · REJECTED 1 이상을 스모크하라. OpenAPI 문구만으로 끝내지 마라.

| 유형 | 최소 스모크 |
|------|-------------|
| GENERAL | 공통 path 즉시 승인·반려 · 멱등 · 상태 불변 · GET `resultNotificationSentAt` |
| COMPANY_SCHOOL | 공통 path로 **200** (더 이상 403 아님) · 동일 |
| UJAT | 선택한 path(공통 or 전용)로 200 · programId 스코프 |
| GEMINI(_TRAINING) | 확정 enum + path로 200 · 다른 enum 혼입 거절 |
| TRAINED_TEACHER | **전용 path** 200 · 공통 path로 TT id 호출 시 거절 · programId 불일치 거절 |

공통 추가 케이스(유형당 또는 대표 1회+회귀):

1. `WAITING_REVIEW` → 409  
2. 무권한 → 403  
3. `SCHEDULED` 미래 성공 / 과거 422 / IMMEDIATE+scheduledAt 422  
4. 멱등 재생 · 중복 event 없음  
5. 수신자 = 담당 교사  
6. 감사로그 · PII 비로그  
7. **교차 회귀:** GENERAL 재발송 · 각 유형 approve/reject 깨지지 않음  

---

## 9. 스모크 curl 예시

### 9.1 공통 path (GENERAL / COMPANY_SCHOOL / …)

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: org-resend-general-001" \
  "http://localhost:8080/api/admin/organization-applications/{applicationId}/notifications/resend" \
  -d '{"timing":"IMMEDIATE","scheduledAt":null,"reason":null}'
```

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: org-resend-rejected-001" \
  "http://localhost:8080/api/admin/organization-applications/{rejectedApplicationId}/notifications/resend" \
  -d '{"timing":"IMMEDIATE","scheduledAt":null,"reason":"신청 자격 요건을 충족하지 못했습니다."}'
```

1사1교·UJAT·Gemini(공통 사용 시)도 **동일 URL**로 각 유형 `applicationId`를 넣어 200을 확인하라.

### 9.2 TT 전용

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: tt-org-resend-001" \
  "http://localhost:8080/api/admin/programs/{programId}/trained-teacher/organization-applications/{applicationId}/notifications/resend" \
  -d '{"timing":"IMMEDIATE","scheduledAt":null,"reason":null}'
```

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/admin/programs/{programId}/trained-teacher/organization-applications/{applicationId}"
```

기대: `resultNotificationSentAt` non-null · `availableActions` ∋ `RESEND_NOTIFICATION` · status 불변.

---

## 10. OpenAPI

1. 공통 path description/403 문구를 **새 allowlist**에 맞게 수정  
2. TT 전용 path·operationId 등록  
3. UJAT/Gemini 전용 path를 썼다면 등록  
4. 각 유형 org DTO에 `resultNotificationSentAt` additive  
5. `availableActions`에 `RESEND_NOTIFICATION` 문서화  
6. dashboard Orval subset / applications·trained-teacher 워크플로에 path 누락 없이 포함  
7. `GEMINI` vs `GEMINI_TRAINING` 중 기관 row SSOT를 description 또는 별도 note로 명시  

---

## 11. 수락 기준

1. §1 매트릭스 **모든 P0 유형**에서 승인·반려 재발송이 성공한다.  
2. TRAINED_TEACHER는 **전용 path**로 성공하고, 공통 path로는 거절된다.  
3. COMPANY_SCHOOL·UJAT·Gemini는 더 이상 “GENERAL only” 때문에 무조건 403 나지 않는다 (선택한 전략 path로 200).  
4. event/outbox·수신자·멱등·상태 불변·오류 코드가 계약과 같다.  
5. 목록/상세 `resultNotificationSentAt` · `RESEND_NOTIFICATION`이 유형별로 보인다.  
6. OpenAPI ↔ 런타임 일치.  
7. 기존 GENERAL 재발송·각 유형 approve/reject 회귀 없음.  
8. `AUTO_REJECTED` 정책이 유형별로 handoff에 적혀 있다.  

하나라도 “TT만 되고 1사1교는 다음에”면 **수락 보류**다.  
불가 유형이 있으면 handoff에 **blocker 이유·예상 일정**을 명시하고 FE에 전달하라 (침묵 금지).

---

## 12. BE 완료 후 FE 전달 (handoff 체크리스트)

권장 파일:

`JABACK/docs/frontend/program-organization-notification-resend-all-types-frontend-handoff-2026-09-27.md`

포함:

| 항목 | 내용 |
|------|------|
| 유형별 최종 path / operationId | A~E 표 |
| allowlist programType 목록 | 공통 path |
| GEMINI enum SSOT | `GEMINI` vs `GEMINI_TRAINING` |
| request/response 예시 | 승인·반려 각 1 |
| `RESEND_NOTIFICATION` 토큰 확정 | 전 유형 동일 |
| `resultNotificationSentAt` 필드명 | 동명이면 OK · 다르면 유형별 매핑 |
| `AUTO_REJECTED` 정책 | 유형별 한 줄 |
| eventType 키 | 유형×승인/반려 |
| 스모크 PK | programId / applicationId × 유형 × APPROVED/REJECTED |
| 오류 코드 최종 | |
| 회귀 테스트 목록 | |
| OpenAPI sync | `v3/api-docs` |

---

## 13. FE 후속 (범위 밖 · 참고)

BE handoff 후 CMS:

1. OpenAPI/Orval 재생성  
2. GENERAL: 공통 path 유지 (allowlist 확장만 반영)  
3. TT: `trained-teachers/api`에 resend client + sync + adapter (`resultNotificationSentAt` / actions)  
4. 1사1교·UJAT·Gemini: 각 remote sync에서 **해당 path** 호출 · shared `applicant-list` 게이트를 “GENERAL only”에서 **유형별 remote**로 확장  
5. 모달 매핑·invalidate·에러 메시지  
6. 갭/conversion-status 문서 ✅ 갱신  

---

## 14. 강사·개인·봉사자 재발송 (2차 · 참고)

이번 1차 DoD는 **기관(ORGANIZATION)** 이다.  
다만 제품 원칙상 동일하게 유형별 개방이 맞다.

| 신청 종류 | 기존 path (참고) | 후속 |
|-----------|------------------|------|
| 강사 | `POST /api/admin/instructor-applications/{id}/notifications/resend` | 유형 스코프·UJAT 등 허용 여부 점검 |
| 개인 | `POST /api/admin/individual-applications/{id}/notifications/resend` | 일반 외 유형 필요 시 별도 |
| 봉사자(UJAT 등) | 재발송 path 유무 확인 | 갭이면 별도 BE 요청 |

1차 PR에 넣지 않더라도, handoff에 **“2차 후보 / 현재 허용 유형”**을 한 절로 적어 주면 FE 계획이 수월하다.

---

## 비범위 재확인

- FE mock 우회  
- 공통 path rename  
- TT를 공통 path에만 태워 유형 격리 깨기  
- 문서상 TT만 완료 처리  

**Last updated:** 2026-09-27
