# BE 디버그 요청 — TT 기관 알림 재발송 `500 DATABASE_ERROR`

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-09-27 |
| **상태** | ⏳ BE 조사 필요 (FE 요청·path는 정상) |
| **traceId** | `dd288e6b87ac44b4bdd61a2723c26c2a` |
| **관련 handoff** | `JABACK/docs/frontend/program-organization-notification-resend-all-types-frontend-handoff-2026-09-27.md` |

아래를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고 이 문서와 BE 로그만 사용하라.

---

## 한줄

CMS FE가 TT 전용 재발송 path를 계약대로 호출했는데 **`500 DATABASE_ERROR`** 가 났다.  
요청 body·path·권한 진입까지는 통과한 것으로 보이므로, **SQL/마이그레이션/멱등 테이블/outbox INSERT** 쪽을 `traceId`로 추적해 원인을 고치고 FE에 root cause를 회신하라.

---

## FE에서 재현한 요청

```http
POST /api/admin/programs/186025/trained-teacher/organization-applications/1698007/notifications/resend
Content-Type: application/json
Idempotency-Key: (FE가 생성한 org/tt 키)
```

```json
{
  "timing": "IMMEDIATE",
  "scheduledAt": null,
  "reason": "11"
}
```

응답:

```json
{
  "success": false,
  "data": null,
  "message": "데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  "error": {
    "code": "DATABASE_ERROR",
    "message": "데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    "field": null,
    "traceId": "dd288e6b87ac44b4bdd61a2723c26c2a",
    "details": null
  }
}
```

화면: `/programs/trained-teachers?programId=186025&…&applicantId=1698007` (반려 재발송, reason 입력)

---

## FE 판정 (이미 확인)

| 항목 | 결과 |
|------|------|
| path | ✅ TT 전용 path (공통 path 아님) |
| body | ✅ `IMMEDIATE` + `scheduledAt: null` + 반려 `reason` |
| HTTP 의미 | `DATABASE_ERROR` = `DataAccessException` 매핑 (`AuthExceptionHandler#handleDatabase`) |
| FE 수정으로 해결 가능? | ❌ — 서버 SQL/스키마 문제 |

`403`/`404`/`409`/`422`가 아니라 **500 DB**이므로 계약 검증(상태·채널) 이후 단계에서 터진 것이다.

구현 앵커:

- `TrainedTeacherAdminController#resendOrganizationApplicationNotification`
- `OrganizationApplicationNotificationAdminService#resendNotification(…, TRAINED_TEACHER)`
- 멱등 INSERT: `organization_application_notification_resend_request` (`V206__organization_application_notification_resend.sql`)
- outbox INSERT: `ApplicationDecisionSideEffectService#enqueueDecisionNotification`
- audit INSERT: `audit_log` / `ORGANIZATION_APPLICATION_NOTIFICATION_RESENT`

---

## Goal

1. `traceId=dd288e6b87ac44b4bdd61a2723c26c2a` 로컬 BE 로그에서 **root SQLException / PSQLException 메시지**를 찾아라.  
2. 동일 재현 curl로 원인을 재확인하고 **고쳐라**.  
3. 같은 `programId`/`applicationId`로 **200** + `notificationEventId`를 돌려라.  
4. FE handoff에 root cause 한 줄 + 수정(마이그레이션/코드)을 적어라.

---

## 우선 의심 가설 (순서대로 확인)

### H1. Flyway `V206` 미적용 (가장 유력)

멱등 테이블이 없으면 `INSERT INTO organization_application_notification_resend_request` 가  
`relation … does not exist` → `DataAccessException` → `DATABASE_ERROR`.

```sql
SELECT version, description, success
  FROM flyway_schema_history
 WHERE version = '206'
    OR script ILIKE '%organization_application_notification_resend%';

SELECT to_regclass('public.organization_application_notification_resend_request');
```

없으면 `V206` migrate 후 재시작·재현.

### H2. 멱등 FK / CHECK 위반

`V206` FK:

- `admin_id` → `admin_account(id)`
- `application_id` → `program_organization_application(id)`
- `participant_id` → `program_participant(id)` (완료 UPDATE 시)

```sql
SELECT id, program_id, application_status, teacher_member_id
  FROM program_organization_application
 WHERE id = 1698007;

SELECT id, program_type, deleted_at
  FROM program
 WHERE id = 186025;
```

`program_id`/`TRAINED_TEACHER` 일치·신청 존재 확인.  
완료 UPDATE 시 `participant_id`가 orphan이면 FK 실패 가능.

### H3. outbox INSERT 실패

`application_decision_notification_outbox` INSERT  
(`recipient_actor_*`, `rejection_reason_snapshot`, `notification_event_id` sequence 등).

`teacher_member_id` NULL이면 보통 `IllegalStateException` → `INTERNAL_SERVER_ERROR`  
(DB_ERROR가 아니면 H3는 부차).

### H4. audit_log INSERT 실패

`ORGANIZATION_APPLICATION_NOTIFICATION_RESENT` payload / 컬럼 제약.

---

## 필수 조사 절차

1. BE 로그에서 `traceId=dd288e6b87ac44b4bdd61a2723c26c2a` 검색  
   → `Database operation failed` 근처 **rootType / PSQLException / SQL state / detail** 복사  
2. H1~H4 SQL로 스키마·행 확인  
3. 관리자 Bearer로 재현:

```bash
curl -sS -X POST \
  "http://localhost:8080/api/admin/programs/186025/trained-teacher/organization-applications/1698007/notifications/resend" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: tt-debug-resend-001" \
  -d '{"timing":"IMMEDIATE","scheduledAt":null,"reason":"11"}'
```

4. 수정 후 동일 curl **200**  
5. outbox 확인:

```sql
SELECT notification_event_id, event_type, recipient_actor_id, rejection_reason_snapshot, next_attempt_at
  FROM application_decision_notification_outbox
 WHERE source_domain = 'PROGRAM_APPLICATION'
   AND source_id = 1698007
 ORDER BY created_at DESC
 LIMIT 5;
```

기대 event: 반려면 `ORGANIZATION_APPLICATION_REJECTED` (UJAT 아님).

---

## Out of scope / 금지

- FE·path·operationId 변경으로 “우회”
- `DATABASE_ERROR`를 FE에서 숨기기
- 원인을 모른 채 seed PK만 바꾸라고 FE에 떠넘기기 (가능하면 **이 PK도** 고쳐서 동작하게)

---

## 수락 기준

1. `traceId`에 해당하는 root SQL 원인이 문서화됨  
2. 위 curl이 **200** · `fromStatus=toStatus` · `notificationEventId` 존재  
3. 신청 `application_status` / 원 반려 사유 불변  
4. 로컬에 `V206` 테이블이 존재하고 Flyway success  
5. FE handoff에 root cause + 수정 내용 1절 추가  

---

## FE 후속

BE 수정·재시작 후 CMS에서 동일 신청 재발송만 재검증한다.  
FE 추가 변경은 **불필요** (요청 shape는 이미 계약 준수).

**Last updated:** 2026-09-27
