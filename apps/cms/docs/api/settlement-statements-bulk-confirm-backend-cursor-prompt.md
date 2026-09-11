# Cursor prompt — 지급조서 일괄 확인 (`POST …/statements/bulk-confirm`)

> 작성: 2026-09-11 · FE(CMS)  
> 대상: JA Korea CMS Java Backend (Settlement / Payment statements · OpenAPI · local readiness)  
> FE 화면: 정산 관리 > 지급조서 확인 > 지급 현황 상세 → **일괄 확인**  
> FE API: `POST /api/admin/settlements/statements/bulk-confirm`  
> OpenAPI: `apps/cms/openapi/settlement.openapi.json` → `bulkConfirmPaymentStatements` / `SettlementBulkStatusChangeRequest`  
> FE 구현: `use-confirm-payment-statement-mutation.ts` · `bulkConfirmPaymentStatementsRemote`

아래 **「프롬프트 (복사용)」** 코드펜스 안 전체를 백엔드 Cursor/담당자에게 그대로 전달하면 된다.

---

## FE에서 확인한 것 (2026-09-11)

| 항목 | 내용 |
|------|------|
| 증상 | CMS 「지급조서 일괄 확인」 실패 (FE 알림: 지급조서 일괄 확인 오류/실패) |
| HTTP | `POST /api/admin/settlements/statements/bulk-confirm` |
| FE body | OpenAPI `SettlementBulkStatusChangeRequest`와 일치 (아래 예시) |
| Vite proxy (실패 시각) | `connect ECONNREFUSED 127.0.0.1:8080` — **BE 미수신** |
| 직후 health | `GET /actuator/health` → `status: "OUT_OF_SERVICE"` (8080 listen은 됨) |
| 결론 | **FE 페이로드 버그가 아님.** 로컬 BE가 요청을 받지 못하거나 readiness가 OUT_OF_SERVICE인 상태. BE UP 후에도 4xx/5xx가 나면 그때의 `error.code`·traceId로 비즈니스 검증을 이어갈 것 |

### 요청 body 예시 (FE 실제 · DevTools)

```json
{
  "statementIds": [169754],
  "reason": "지급조서 확인",
  "lectureFeePaymentScheduledDate": "2026-10-20",
  "scheduledPaymentDate": "2026-10-20"
}
```

- `reason`: FE 고정 문구 `"지급조서 확인"` (`minLength: 2` 충족)
- 날짜: UI 강의비 지급 예정일 1값을 **양쪽 필드에 동일** 전송 (OpenAPI: 상호 호환·동일 처리)
- `statementIds`: 상세 라인에서 고른 지급조서 PK (legacy `ids`는 보내지 않음)

### FE가 BE에 기대하는 성공 조건

1. 로컬/스테이징 BE `readiness`가 **UP** (OUT_OF_SERVICE·ECONNREFUSED면 FE는 일괄 확인 불가)
2. `statementIds` 대상이 **확인 가능 상태**(예: REQUESTED 등 — 서버 전이 규칙 SSOT)
3. `scheduledPaymentDate` / `lectureFeePaymentScheduledDate` 중 하나 이상 유효 `date`면 **동일 값으로 저장**
4. 실패 시 envelope에 **안정적 `error.code` + 한글 message + (가능하면) field/statementId** — FE `getSettlementApiErrorMessage`로 노출

---

## 프롬프트 (복사용)

```text
당신은 JA Korea CMS Java 백엔드(Settlement / Payment statements)를 점검·보강한다.
프론트 레포는 없다. Controller / Service / Statement entity·상태머신 / Flyway·seed / OpenAPI / error code resolver / Actuator readiness를 찾아 맞춰라.
질문은 계약이 코드·노션과 충돌할 때만 하라.
invent-ban: path·필드명을 임의로 만들지 마라. 기존
  POST /api/admin/settlements/statements/bulk-confirm
  SettlementBulkStatusChangeRequest
  (단건) PATCH/POST …/statements/{statementId}/confirm + SettlementStatusChangeRequest
를 재사용한다.

════════════════════════════════════════════════════════════════
A. 배경 / 재현 (FE 2026-09-11)
════════════════════════════════════════════════════════════════
CMS Admin 「정산 관리 > 지급조서 확인」→ 행 상세 → 라인 선택 → 「일괄 확인」
→ 강의비 지급 예정일 입력 → 확인

1) FE는 아래 body만 보낸다 (OpenAPI SettlementBulkStatusChangeRequest).
{
  "statementIds": [169754],
  "reason": "지급조서 확인",
  "lectureFeePaymentScheduledDate": "2026-10-20",
  "scheduledPaymentDate": "2026-10-20"
}

2) 실패 시각 FE Vite proxy:
   POST /api/admin/settlements/statements/bulk-confirm
   → connect ECONNREFUSED 127.0.0.1:8080
   (= 요청이 애플리케이션에 도달하지 않음. 400/409 비즈니스 거절이 아님)

3) 같은 시점 직후:
   GET http://127.0.0.1:8080/actuator/health
   → {"status":"OUT_OF_SERVICE", ...}
   Java 프로세스는 8080 LISTEN 중이나 readiness가 OUT_OF_SERVICE.

FE 결론: payload invent/오타 아님. 먼저 로컬 BE를 UP으로 만든 뒤,
UP 상태에서 동일 body로 재현해 실제 4xx/5xx가 나오면 그 error.code를 고친다.

════════════════════════════════════════════════════════════════
B. 해야 할 일 (우선순위)
════════════════════════════════════════════════════════════════

B1. 로컬 readiness
- Actuator liveness/readiness가 OUT_OF_SERVICE인 원인(DB, Flyway, 의존 컴포넌트)을 찾아
  bootRun 후 GET /actuator/health 가 status UP 이 되게 하라.
- UP 전에는 bulk-confirm 비즈니스 디버깅을 시작하지 마라. FE는 proxy ECONNREFUSED /
  네트워크 실패로만 보인다.

B2. UP 후 동일 요청 재현
- 관리자 Bearer로 POST /api/admin/settlements/statements/bulk-confirm
  body = A절 예시 (statementId는 로컬 seed에 존재하는 REQUESTED(또는 확인 가능) 건으로 교체 가능).
- 성공: 대상 statement → CONFIRMED(서버 enum SSOT), scheduledPaymentDate(또는 동등 컬럼) =
  2026-10-20, 감사로그 기록.
- 실패: ApiError envelope에 error.code / message / field(또는 statementId)를 채워 FE가
  getSettlementApiErrorMessage로 그대로 보여 주게 하라. 모호한 "입력값을 확인해 주세요."만
  내지 마라.

B3. 계약 준수 (이미 OpenAPI에 있음 — 구현·문서 정합만)
SettlementBulkStatusChangeRequest:
- required: reason (min 2, max 500)
- statementIds: 지급조서 일괄 확인 대상 (FE는 이것만 사용; legacy ids는 선택)
- scheduledPaymentDate: date — 강의비 지급 예정일
- lectureFeePaymentScheduledDate: date — FE UI 호환. scheduledPaymentDate와 동일 처리
- FE는 두 날짜 필드를 같은 값으로 보낸다. 한쪽만 와도 동일하게 accept.
- paymentIds는 이 API에서 쓰지 않는다 (계좌 지급 bulk-paid 등 다른 API).

B4. 상태 전이 / 비즈니스 가드
- 이미 CONFIRMED / PAID / 확인 불가 상태면 409 + 안정적 error.code
  (예: STATEMENT_NOT_CONFIRMABLE / SETTLEMENT_INVALID_STATUS — 기존 코드가 있으면 재사용,
   없으면 기존 Settlement error catalog 네이밍에 맞춰 추가하고 OpenAPI에 기술).
- statementIds 중 일부만 실패하는 partial 정책이 있으면 응답에 성공/실패 ID를 명시.
  partial이 아니면 all-or-nothing + 실패한 statementId를 message/field에 포함.
- 감사로그 실패 시 fail-closed(500) — OpenAPI 500 description과 동일.

B5. OpenAPI / 시드
- settlement.openapi(또는 monorepo sync 대상)에 bulk-confirm request/response·error.code 예시 보강.
- 로컬 QA용 REQUESTED statement seed가 없으면 statementId=169754에 상응하는 fixture를 추가하거나
  문서에 “사용 가능한 seed statementId”를 적어 FE와 맞춘다.

════════════════════════════════════════════════════════════════
C. Done 기준
════════════════════════════════════════════════════════════════
1) /actuator/health → status UP (로컬 bootRun 정상)
2) A절 body(유효 statementId)로 bulk-confirm 200 + statement CONFIRMED + 지급 예정일 저장
3) 잘못된 상태/없는 ID는 4xx + 안정적 error.code (FE 매핑 가능)
4) lectureFeePaymentScheduledDate ↔ scheduledPaymentDate 동등 처리 단위 테스트 또는 수동 검증 기록
5) OpenAPI·에러 카탈로그가 구현과 일치

════════════════════════════════════════════════════════════════
D. FE에 회신할 것
════════════════════════════════════════════════════════════════
- readiness OUT_OF_SERVICE 원인이 무엇이었는지 (한 줄)
- UP 후 bulk-confirm 재현 결과 (200 / error.code + sample response JSON)
- statement 확인 가능 상태 enum 목록
- partial vs all-or-nothing 정책
- 로컬 seed에서 쓸 수 있는 statementId 예시
```

---

## 관련 FE 파일

| 파일 | 역할 |
|------|------|
| `features/settlement-management/hooks/use-confirm-payment-statement-mutation.ts` | bulk body 조립 (`reason` + 날짜 dual field) |
| `features/settlement-management/api/settlement-api-client.ts` | `bulkConfirmPaymentStatementsRemote` |
| `features/settlement/ui/payment-record/use-payment-order-detail-lines.tsx` | 일괄 확인 UI · 실패 alert |
| `shared/api/generated/settlement/schemas/settlementBulkStatusChangeRequest.ts` | Orval 타입 |

---

## FE 회신 반영 (2026-09-11)

| 항목 | FE 조치 |
|------|---------|
| readiness OUT_OF_SERVICE | seed/ApplicationRunner 완료 전 `/api/**` 503. **bootRun 재기동 후** `/actuator/health` UP 확인 뒤 재시도 |
| seed statementId | 로컬 QA는 **`170701`** (settlement `170601`). **`169754` 고정 가정 금지** — UI는 상세 라인의 실제 `statementId`만 전송 |
| 확인 가능 상태 | `WAITING_CONFIRM` \| `REQUESTED` \| `REAPPLICATION` \| `ISSUED` → `isConfirmableStatementStatus` |
| 트랜잭션 | **all-or-nothing** (한 건 실패 시 전체 롤백) |
| 에러 매핑 | `SCHEDULED_PAYMENT_DATE_REQUIRED` · `PAYMENT_STATEMENT_IDS_REQUIRED` · `PAYMENT_STATEMENT_NOT_FOUND` · `PAYMENT_STATEMENT_STATUS_CONFLICT` → `getSettlementApiErrorMessage` |
| Orval | `SettlementBulkStatusChangeRequest` 이미 dual date 필드 포함 — OpenAPI 추가 갱신 시 `pnpm` orval 재생성 |

**스모크:** BE UP → 지급조서 확인 상세에서 seed 라인(`170701`) 선택 → 지급 예정일 입력 → 일괄 확인 → 200 CONFIRMED.

**Last updated:** 2026-09-11 (BE 회신 반영)
