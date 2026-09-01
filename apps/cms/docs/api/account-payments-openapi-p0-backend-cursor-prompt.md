# Cursor prompt — 계좌 지급 확인 OpenAPI·런타임 P0 (CMS FE 갭 해소)

아래 지시를 **이 백엔드 레포에서 실행**하라. 질문은 엔티티를 찾아도 판단이 안 될 때만 하라. 프론트 레포는 없다.

프론트 CMS 정산 관리 → **계좌 지급 확인**이 P0 연동을 끝냈다. live `/v3/api-docs`에는 아직 list extras·쿼리·상세 embed가 없어 FE가 settlement OpenAPI 필터에서 codegen만 보강 중이다. **OpenAPI와 런타임을 FE 계약에 맞춰라.** 시드·409·budget은 기존 핸드오프와 동일 기준.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-27 |
| **화면** | CMS LNB `정산 관리` → `계좌 지급 확인` (`/settlement-management/account-payments`) |
| **모듈 플래그(FE)** | `VITE_REAL_API_MODULES=...,accountPayments` |
| **FE 핸드오프** | `account-payments-backend-seed-handoff-2026-08-27.md` |
| **시드 스펙** | `account-payments-seed-v1.spec.json` · label `account-payments-catalog-v1-2026-08` |
| **갭** | `settlement-api-backend-gaps.md` §4~§5.2 |

---

## Goal

1. **`/v3/api-docs`에 아래 계약을 정식 반영**한다. path는 바꾸지 않는다.
2. 런타임 응답·필터가 문서와 같다. FE는 `pnpm --filter cms fetch:openapi && generate:api` 후 **로컬 OpenAPI 패치를 제거할 수 있어야** 한다.
3. 계좌 지급 대기 canonical 값은 **`WAITING_PAYMENT`** 이다. 응답을 `REQUESTED`로 위장하지 않는다.
4. 목록은 지급조서 `statementStatus=CONFIRMED` 건만. 상세는 `GET …/account-payments/{id}` **1회**로 산출 테이블을 채운다.

완료 조건 (관리자 JWT + local seed):

- OpenAPI `AccountPaymentListItemResponse`에 extras 6필드 존재
- OpenAPI `listAccountPayments` query에 `fromDate`/`toDate`/`instructorName`/`programName`/`year` 존재
- OpenAPI `AccountPaymentDetailResponse.settlement` → `$ref: SettlementFrontendResponse` (null 허용)
- `GET /api/admin/account-payments?size=100` ≥32건, 대기≈19(`WAITING_PAYMENT`) / 완료≈13(`PAID`)
- `GET …/account-payments/{id}` Network에 `/settlements/{id}` 없이 산출 items 표시 가능
- `budget-summary?year=2026` → `annualBudgetAmount=109150000`

---

## Out of scope / 금지

- 목록 path를 바꾸지 마라. `/api/admin/account-payments` 유지.
- 목록 UI 필터를 `CONFIRMED` / `CORRECTION_REQUESTED` **paymentStatus**로 만들지 마라. 대기/완료 2종만.
- 신청자명(`instructorName`)을 서버에서 마스킹하지 마라. FE는 실명 표시.
- `POST …/exports/bulk-transfer|tax-report` downloadUrl은 P1. 이번 P0에서 FE 연결 요구하지 않음. path 유지만.
- 계좌 상세에서 FE가 `GET /settlements/{id}`를 다시 치게 만들지 마라. embed로 끝낸다. (지급조서 산출 SSOT용 `GET /settlements/{id}` path 자체는 **유지**)

---

## 1. Paths (유지)

| Method | Path | 비고 |
|--------|------|------|
| GET | `/api/admin/account-payments` | query·DTO 보강 |
| GET | `/api/admin/account-payments/{paymentId}` | settlement embed DTO만 변경 |
| PATCH | `/api/admin/account-payments/{paymentId}/paid` | 409 message |
| PATCH | `/api/admin/account-payments/bulk-paid` | body `{ paymentIds[], reason }` (`ids` legacy 허용) |
| GET | `/api/admin/settlements/budget-summary?year=` | 요약 카드 |
| GET | `/api/admin/settlements/{settlementId}` | 유지. 계좌 상세에서는 호출하지 않게 만드는 것이 목표 |

---

## 2. 상태 계약 (중요)

| API `paymentStatus` | 목록 필터 | FE UI | 라벨 |
|---------------------|-----------|-------|------|
| **`WAITING_PAYMENT`** / `FAILED` | 대기 | `awaiting_confirmation` | 계좌 지급 대기 중 |
| 쿼리 `status=REQUESTED` | 대기 버킷 **alias** | 동일 | BE가 `WAITING_PAYMENT`+`FAILED`로 해석 |
| `PAID` | 완료 | `account_paid` | 계좌 지급 완료 |

- **응답** 대기 건의 `paymentStatus`는 **`WAITING_PAYMENT`**. `REQUESTED`로 내려 위장하지 마라 (지급조서 `statementStatus=REQUESTED`와 이름 충돌).
- 시드 권장: `WAITING_PAYMENT` / `PAID`만. `CONFIRMED`/`CORRECTION_REQUESTED`를 계좌 목록 주력 시드로 쓰지 마라.
- 목록 노출 전제: 연계 Settlement `statementStatus=CONFIRMED`만.

---

## 3. 목록 DTO extras (`AccountPaymentListItemResponse`)

기존 필드 유지 + **추가**:

| 필드 | 타입 | UI |
|------|------|-----|
| `programNameKo` | string | 프로그램명 (우선) |
| `programName` | string | 호환. `programNameKo` 우선 |
| `institutionName` | string \| null | 참여 기관. 개인=`null` → FE `-` |
| `sessionOrdinal` | int \| null | 차시 번호. `sessionLabel` 없으면 `N차시` |
| `sessionLabel` | string \| null | 예 `"2 ~ 3차시"`. 개인=`null` → `-` |
| `lectureDate` | date \| null | **캘린더 출강일** (이체일 아님) |

기존 유지: `instructorName`(실명), `scheduledPaymentDate`(이체 예정일·날짜 필터), `netPaymentAmount`, `paymentStatus`, `bankName` / `maskedAccountNo` / `accountHolder`(계좌만 마스킹).

### 목록 query

| query | 의미 |
|-------|------|
| `status` | `REQUESTED` \| `WAITING_PAYMENT` \| `PAID` \| `FAILED` |
| `fromDate` / `toDate` | **이체 예정일**(`scheduledPaymentDate`). 출강일 아님 |
| `instructorName` / `programName` | contains |
| `year` | 이체일 기준 전년-12-01 ~ 당해-12-31. `fromDate`/`toDate` 있으면 **그 값 우선** |
| `page` / `size` | 기본 size=20. 한 페이지 보려면 **size≥32** (FE는 size=100 루프) |

---

## 4. 상세 embed (gaps §5.2 안 A)

`GET /api/admin/account-payments/{id}`:

```json
{
  "payment": { "...AccountPaymentListItemResponse" },
  "settlement": { "...SettlementFrontendResponse" }
}
```

- `settlement` = `GET /settlements/{id}` 와 **동일 계약** (`SettlementFrontendResponse`). Gemini 등 정산 없음 → `null`.
- OpenAPI `$ref`를 `SettlementResponse`에서 **`SettlementFrontendResponse`로 교체**.
- embed 필수 UI 필드: `programNameKo`, 사업기간, 진행 회차, `institutionName`, 차시 표시, 강의비 책정, 사업소득자, `items[]`(+`calculationDetail`), `expectedTransferDate`.
- `settlement.instructorName`도 계좌 경로에서는 **실명**.

---

## 5. PATCH paid / bulk-paid · 409

미확인 지급조서 → **409**:

```
error.code = "PAYMENT_STATEMENT_STATUS_CONFLICT"
message   = "지급조서 확인 완료 후 계좌 지급을 처리할 수 있습니다."
error.details.statementStatus = "REQUESTED" 등
```

FE는 **message**를 모달에 보여준다. code로 분기.

---

## 6. 예산 요약

`GET /api/admin/settlements/budget-summary?year=2026`

| 필드 | UI |
|------|-----|
| `annualBudgetAmount` | `{year}년 예산 총액` — local seed **109150000** |
| `completedPaymentAmount` | 해당 연도 `PAID` 합 |

대기 합은 FE가 목록 `WAITING_PAYMENT`(+FAILED) net으로 계산해도 된다 (BE 카드 3번째 필드 없음).

---

## 7. FE가 이미 하는 일 (참고)

- settlement OpenAPI 필터(`filter-openapi-settlement.mjs`)로 extras·query·embed를 **codegen만** 보강 (원본에 있으면 덮지 않음).
- 목록: extras 직접 매핑, settlements join **없음**. 필터 `status=WAITING_PAYMENT`|`PAID`.
- 상세: `GET …/account-payments/{id}` **1회만** (`GET /settlements/{id}` 제거됨).
- 대량이체·세금신고: **Client Excel** SSOT. BE export 미연결.

BE가 `/v3/api-docs`를 맞추면 FE는 패치 제거 + OpenAPI 재생성이면 된다.

---

## 8. Acceptance checklist

- [ ] OpenAPI: list extras 6필드 + list query 5종 + detail.settlement → SettlementFrontendResponse
- [ ] Runtime list: 프로그램·기관·차시·출강일·이체일·금액·계좌 스냅샷 (개인 기관/차시 null)
- [ ] `status=WAITING_PAYMENT` / `PAID` 필터; 대기 응답이 **WAITING_PAYMENT** (REQUESTED 위장 금지)
- [ ] `fromDate`/`toDate` = 이체 예정일; 캘린더는 `lectureDate`
- [ ] 상세 1회만으로 산출·산정 기준 (Network에 `/settlements/{id}` 없음)
- [ ] paid / bulk-paid: CONFIRMED만 200; 아니면 409 + 안내 message
- [ ] `budget-summary?year=2026` → annualBudgetAmount=109150000, completedPaymentAmount=PAID 합
- [ ] 신청자명 마스킹 금지
- [ ] `/v3/api-docs` 갱신 후 FE `fetch:openapi && generate:api`로 로컬 패치 불필요

---

## 9. 복붙용 한 줄 Goal

> 계좌 지급 P0: OpenAPI·런타임에 list extras·이체일/이름/year 쿼리·detail.settlement=SettlementFrontendResponse·canonical WAITING_PAYMENT를 반영하고, path는 유지하며 FE local OpenAPI 패치를 없앨 수 있게 하라.
