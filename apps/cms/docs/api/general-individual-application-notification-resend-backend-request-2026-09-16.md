# BE 구현 요청 — 일반 프로그램 개인 신청 결과 알림 재발송 API

**작성일:** 2026-09-16  
**대상:** Admin CMS 일반 프로그램 개인 참여자 신청  
**QA 프로그램:** `168006` (`[개인] 커리큘럼형 복수회차 테스트 프로그램`)  
**대상 화면:** 참여자 신청 목록 → 1차 서류 심사 대상자 상세 → 프로그램 승인 현황 → 알림 재발송  
**FE 상태:** 재발송 모달과 로컬 상태 갱신만 존재하며 실제 HTTP 호출은 없음  
**관련 문서:** [개인 신청 목록·상세 표시 필드](./general-individual-application-display-fields-backend-request-2026-09-16.md)

## 백엔드 전달용 프롬프트

아래 요구사항에 따라 일반 프로그램 개인 참여자 신청의 **프로그램 승인/반려 결과 알림 재발송 API**를 구현해 주세요.

현재 CMS에는 프로그램 승인 현황 옆 「알림 재발송」 버튼과 확인 모달이 구현되어 있습니다.
그러나 개인 신청용 API가 없어 확인 시 FE mock/local state의 발송 시각만 갱신되고 실제 알림 이벤트는 생성되지 않습니다.

현재 존재하는 유사 구현:

```http
POST /api/admin/instructor-applications/{applicationId}/notifications/resend
```

- Controller: `ProgramApplicationCanonicalAdminController#resendInstructorApplicationNotification`
- Service: `InstructorApplicationAdminService#resendNotification`
- Request: `InstructorApplicationRequests.Notification`
- Side effect: `ApplicationDecisionSideEffectService#enqueueDecisionNotification`
- Response: `ApplicationDecisionResponse`

위 강사 신청 구현의 권한·상태 검증·예약 검증·outbox/event 생성 방식을 재사용하여 개인 신청용 endpoint를 추가해 주세요.

---

## 1. 신규 endpoint

```http
POST /api/admin/individual-applications/{applicationId}/notifications/resend
```

권한:

```java
@RequiresAdminPermission("APPLICATION_WRITE")
```

프로그램 capability:

- 대상 신청의 프로그램에 `APPLICATION_REVIEW` capability가 있어야 합니다.
- 일반 프로그램 개인 신청만 허용합니다.
- URL의 `applicationId`로 조회한 신청 건의 실제 프로그램 범위를 서버에서 검증합니다.

---

## 2. 요청 계약

CMS 모달은 다음 두 발송 방식을 지원합니다.

- 즉시 발송
- 직접 설정한 미래 시각에 예약 발송

개인 신청의 현재 상태가 `REJECTED`라면 반려 사유도 함께 전달합니다.

권장 request:

```json
{
  "timing": "IMMEDIATE",
  "scheduledAt": null,
  "reason": null
}
```

예약 발송:

```json
{
  "timing": "SCHEDULED",
  "scheduledAt": "2026-09-18T03:30:00Z",
  "reason": null
}
```

반려 알림 재발송:

```json
{
  "timing": "IMMEDIATE",
  "scheduledAt": null,
  "reason": "신청 자격 요건을 충족하지 못했습니다."
}
```

권장 DTO:

```java
public record IndividualApplicationNotificationResendRequest(
        String timing,
        Instant scheduledAt,
        @Size(max = 500) String reason
) {
}
```

검증 규칙:

1. `timing=IMMEDIATE`
   - `scheduledAt`은 `null`이어야 합니다.
2. `timing=SCHEDULED`
   - `scheduledAt`은 필수이며 서버 현재 시각보다 미래여야 합니다.
3. `timing`이 `null` 또는 빈 값이면 기존 강사 API와 동일하게 `IMMEDIATE`로 정규화할 수 있습니다.
4. 신청 상태가 `REJECTED`이면 `reason`은 trim 후 필수입니다.
5. 신청 상태가 `APPROVED`이면 `reason`은 사용하지 않으며 `null`로 정규화합니다.
6. 지원하지 않는 timing이나 잘못된 예약 시각은 `422 INVALID_NOTIFICATION_SCHEDULE`로 응답합니다.

---

## 3. 상태별 발송 이벤트

개인 신청의 canonical `application_status`를 조회하여 다음 이벤트를 생성합니다.

| 현재 상태 | eventType | 결과 |
|---|---|---|
| `APPROVED` | `INDIVIDUAL_APPLICATION_APPROVED` | 기존 승인 결과 알림 재발송 |
| `REJECTED` | `INDIVIDUAL_APPLICATION_REJECTED` | 요청의 반려 사유를 사용해 반려 결과 알림 재발송 |
| 그 외 | 생성하지 않음 | `409 INDIVIDUAL_APPLICATION_NOTIFICATION_RESEND_NOT_ALLOWED` |

다음 상태에서는 재발송을 허용하지 않습니다.

- `WAITING_REVIEW`
- `SUBMITTED`
- `DOCUMENT_PASSED`
- `REJECTION_CANCELLED`
- `GIVE_UP`
- `RESERVE`
- 알 수 없는 legacy 상태

상태를 변경하기 위한 API가 아닙니다.

- `application_status`, `document_status`, `interview_status`, `final_result_status`를 변경하지 않습니다.
- participant 생성/삭제 또는 승인·반려 transition을 다시 실행하지 않습니다.
- 기존 신청의 승인/반려 결과에 맞는 알림 event/outbox만 새로 생성합니다.

---

## 4. 알림 내용과 반려 사유

### 승인 상태

- 기존 `INDIVIDUAL_APPLICATION_APPROVED` event binding과 템플릿을 재사용합니다.
- 신청자와 대상 프로그램을 기존 신청 건에서 해석합니다.

### 반려 상태

- 기존 `INDIVIDUAL_APPLICATION_REJECTED` event binding과 템플릿을 재사용합니다.
- CMS 모달에서 입력한 `reason`을 알림 변수에 반영합니다.
- 신청 테이블의 기존 반려 사유를 변경할지 여부는 아래 기준을 따릅니다.

권장:

- 재발송 요청의 `reason`은 **이번 발송 payload snapshot**으로 저장합니다.
- 과거 승인/반려 decision 이력과 원래 `reject_reason`은 덮어쓰지 않습니다.
- 운영 정책상 신청의 현재 반려 사유도 갱신해야 한다면 변경 전/후 audit log를 별도로 남깁니다.

---

## 5. 중복 요청·트랜잭션·감사

- 알림 event/outbox 생성은 기존 `enqueueDecisionNotification` 경로를 재사용합니다.
- 요청 성공 전에 transaction이 rollback되면 event/outbox도 남지 않아야 합니다.
- 동일 사용자의 더블 클릭이나 네트워크 재시도로 의도하지 않은 중복 발송이 발생하지 않게 합니다.
- 가능하면 `Idempotency-Key`를 지원하고 동일 key 재요청에는 같은 결과를 반환합니다.
- 재발송 자체는 운영상 반복 실행 가능한 작업이므로 서로 다른 idempotency key의 정상 재발송은 허용합니다.
- 관리자 ID, 신청 ID, 프로그램 ID, 상태, timing, scheduledAt, notificationEventId를 감사 가능한 형태로 기록합니다.
- 연락처·이메일·반려 사유 원문을 일반 애플리케이션 로그에 출력하지 않습니다.

---

## 6. 응답 계약

기존 `ApplicationDecisionResponse`를 재사용하는 것을 권장합니다.

예시:

```json
{
  "applicationId": 1690625,
  "applicationType": "INDIVIDUAL",
  "fromStatus": "APPROVED",
  "toStatus": "APPROVED",
  "participantId": 1690702,
  "notificationEventId": 123456,
  "availableActions": [
    "NOTIFICATION_RESEND"
  ]
}
```

조건:

- 재발송은 상태 전이가 아니므로 `fromStatus === toStatus`입니다.
- 승인 신청에 연결된 participant가 있으면 `participantId`를 반환하고, 없으면 `null`을 허용합니다.
- `notificationEventId`는 성공 시 필수입니다.
- `availableActions`는 재조회 시점의 서버 권한/상태 기준으로 반환합니다.

---

## 7. 오류 계약

| HTTP | errorCode | 조건 |
|---|---|---|
| `404` | `INDIVIDUAL_APPLICATION_NOT_FOUND` | 신청 ID 없음 |
| `403` | 기존 권한/capability 오류 | `APPLICATION_WRITE` 또는 프로그램 심사 권한 없음 |
| `409` | `INDIVIDUAL_APPLICATION_NOTIFICATION_RESEND_NOT_ALLOWED` | 승인/반려 외 상태 |
| `409` | `DUPLICATE_NOTIFICATION_REQUEST` | 같은 idempotency key의 충돌 요청 |
| `422` | `INVALID_NOTIFICATION_SCHEDULE` | timing 또는 예약 시각 오류 |
| `422` | `INDIVIDUAL_APPLICATION_REJECTION_REASON_REQUIRED` | 반려 상태인데 사유 누락 |
| `500` 또는 기존 알림 오류 | 기존 outbox/event 오류 코드 | 알림 이벤트 생성 실패 |

오류 응답은 프로젝트 공통 error envelope를 사용해 주세요.

---

## 8. OpenAPI

구현 후 backend OpenAPI에 다음을 반영해 주세요.

- 신규 path와 `operationId`
- `applicationId` path parameter
- request schema
- `timing` enum: `IMMEDIATE`, `SCHEDULED`
- `scheduledAt` date-time
- `reason` 최대 500자
- 상태별 허용 조건
- 응답 `ApplicationDecisionResponse`
- 403/404/409/422 오류 코드
- `APPLICATION_WRITE` 권한 요구사항

권장 operationId:

```text
resendIndividualApplicationNotification
```

---

## 9. 테스트

필수 서비스/컨트롤러 테스트:

1. 승인 신청 즉시 재발송 성공
2. 승인 신청 예약 재발송 성공
3. 반려 신청 + 사유 즉시 재발송 성공
4. 반려 신청 + 사유 예약 재발송 성공
5. 반려 신청 사유 누락 `422`
6. 과거 시각 예약 `422`
7. `IMMEDIATE`인데 `scheduledAt` 존재 시 `422`
8. 승인/반려 외 상태 `409`
9. 존재하지 않는 신청 `404`
10. 권한 없음 `403`
11. 재발송 후 신청 상태 불변
12. 성공 응답의 `notificationEventId` 존재
13. outbox/event type과 신청자·프로그램 연결 정확성
14. 같은 회원의 다른 프로그램 신청으로 수신자가 바뀌지 않음
15. idempotency key 중복 요청 방어
16. 감사 정보 기록 및 개인정보 로그 미노출

---

## 10. `168006` 스모크

`168006` 시드에서 실제 application PK를 조회하여 다음을 검증해 주세요.

- `APPROVED` 개인 신청 1건
- `REJECTED` 개인 신청 1건

예시:

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: individual-1690625-resend-001" \
  http://localhost:8080/api/admin/individual-applications/1690625/notifications/resend \
  -d '{
    "timing": "IMMEDIATE",
    "scheduledAt": null,
    "reason": null
  }'
```

반려:

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: individual-rejected-resend-001" \
  http://localhost:8080/api/admin/individual-applications/{rejectedApplicationId}/notifications/resend \
  -d '{
    "timing": "IMMEDIATE",
    "scheduledAt": null,
    "reason": "신청 자격 요건을 충족하지 못했습니다."
  }'
```

---

## 11. 수락 기준

1. 개인 신청 승인/반려 상태에서 재발송 endpoint 호출이 성공합니다.
2. 실제 notification event/outbox가 생성되고 수신자가 해당 신청의 회원과 일치합니다.
3. 승인/반려 상태와 eventType이 일치합니다.
4. 즉시/예약 발송이 요청 계약대로 동작합니다.
5. 반려 재발송 사유가 해당 발송 payload에 반영됩니다.
6. 재발송 전후 신청 상태와 심사 결과는 변경되지 않습니다.
7. 권한·프로그램 capability·상태 검증을 서버에서 수행합니다.
8. OpenAPI와 실제 요청/응답이 일치합니다.
9. `notificationEventId`로 발송 이력을 추적할 수 있습니다.
10. 기존 강사/기관/봉사자 알림 발송 동작에 회귀가 없습니다.

---

## 12. BE 완료 후 FE 전달 정보

- 최종 endpoint와 operationId
- request/response OpenAPI schema
- timing enum과 timezone 기준
- 반려 사유 저장/스냅샷 정책
- idempotency 지원 방식
- 오류 코드
- `168006` 승인/반려 application PK
- 실제 응답 예시
- 로컬에서 event/outbox 확인하는 방법
- 추가된 테스트 목록

## FE 후속 작업

BE 구현과 OpenAPI 전달 후 FE에서 다음을 진행합니다.

1. OpenAPI/Orval 재생성
2. 개인 신청 알림 재발송 mutation 추가
3. 모달 payload의 `immediate/manual`을 `IMMEDIATE/SCHEDULED`로 변환
4. `manualNotifyAt`을 ISO `scheduledAt`으로 변환
5. 성공 후 개인 신청 목록·상세 query invalidate
6. 성공 응답 확인 후에만 모달 닫기와 완료 상태 반영
7. 요청 중 버튼 loading/중복 클릭 방지
8. 403/404/409/422 오류 메시지 처리
9. mock/localStorage 재발송 갱신 제거

## 비범위

- 존재하지 않는 endpoint를 FE에 임시 하드코딩
- generic 수동 알림 발송 API로 결과 알림을 우회
- 재발송 시 신청 상태를 다시 승인/반려 처리
- 기존 승인/반려 decision 이력 덮어쓰기
- 일반 프로그램 개인 신청 외 유형의 API 변경
