# 정산 관리 API 연동 명세

LNB 「정산 관리」 3화면(지급조서·계좌 지급·정산 항목 설정)과 Swagger API 매핑입니다.

공통 가이드: [backend-handoff.md](./backend-handoff.md) · [api-routes-and-client.md](./api-routes-and-client.md)

---

## 모듈 키

| env | 화면 |
|-----|------|
| `VITE_REAL_API_MODULES=...,paymentOrders` | 지급조서 확인 (리스트·상세·캘린더) |
| `VITE_REAL_API_MODULES=...,accountPayments` | 계좌 지급 확인 (리스트·상세·캘린더·지급 완료) |
| `VITE_REAL_API_MODULES=...,settlementConfigs` | 정산 항목 설정 (v2 카탈로그 GET/PUT·지급 duplicate/delete) |

실 API 호출 추가 조건: MFA 완료 후 유효 JWT (`hasRemoteAdminJwt()`).

---

## 코드 위치

| 역할 | 경로 |
|------|------|
| Orval 생성 | `src/shared/api/generated/settlement/` |
| OpenAPI subset | `openapi/settlement.openapi.json` (`scripts/filter-openapi-settlement.mjs`) |
| 공통 query keys | `features/settlement-management/api/settlement-query-keys.ts` |
| 캐시 clear | `features/settlement-management/api/clear-settlement-query-cache.ts` |
| 지급조서 | `features/settlement-management/api/payment-orders/` |
| 계좌 지급 | `features/settlement-management/api/account-payments/` |
| 캘린더 adapter | `features/settlement-management/api/calendar/` |
| 정산 항목 | `features/settlement-management/api/settlement-configs/` |

---

## TanStack Query 캐시

- Key prefix: `['cms', 'settlement', …]`
- `logout` / `completeAdminAuth` → `clearSettlementQueryCache()`
- **원장 연동 invalidate** (`invalidateSettlementLedgerCaches`): confirm / reject / paid / failed 이후
  - 지급조서: `paymentOrders.all()` (list·detail·settlement 산출·statements)
  - 캘린더: `calendar.all()`
  - 계좌 지급: lists · details · budgetSummary  
  한쪽만 무효화하면 다른 화면이 stale이 된다.

---

## 지급조서 ↔ 계좌 지급 원장

같은 `settlement` 한 줄이 두 화면을 지난다.

1. 지급조서 확인 — `REQUESTED|REAPPLICATION|CONFIRMED|CORRECTION_REQUESTED|REJECTED` (Gemini·`NONE`·`paymentStatus=PAID` 제외)
2. confirm / bulk-confirm → `statementStatus=CONFIRMED` + `paymentStatus=WAITING_PAYMENT` + `account_payment` 생성. 이체 예정일 body가 있으면 양쪽에 반영.
3. 계좌 지급 — `statementStatus=CONFIRMED`만. 응답 `paymentStatus`는 **`WAITING_PAYMENT|PAID|FAILED`** (REQUESTED로 위장하지 않음).
4. 계좌에서 `PAID` → 그 settlement는 지급조서 목록에서 사라짐.

**날짜 필터:** 지급조서 = 출강일(`lectureDate`). 계좌 지급 = 이체 예정일(`scheduledPaymentDate` / expectedTransferDate).

**시드 ID:** 한글명으로 merge 금지. 박틴토 지급조서 `memberId=170201` ≠ 계좌 지급 `169202`. 연동 검증은 **`settlementId`** (예: confirm `170601` → 계좌 지급에 같은 settlementId `WAITING_PAYMENT`).

시드 라벨: `payment-orders-catalog-v1-2026-08` · `account-payments-catalog-v1-2026-08`.

**BE 전달 (원장 연동 SSOT):**
- Cursor 프롬프트: [settlement-ledger-link-p0-backend-cursor-prompt.md](./settlement-ledger-link-p0-backend-cursor-prompt.md)
- DB Seed 업데이트: [settlement-ledger-link-db-seed-update-2026-08-27.md](./settlement-ledger-link-db-seed-update-2026-08-27.md)

**FE 검증 (BE local demo seed 반영 후):**
- [settlement-ledger-link-fe-seed-ssot-2026-08-27.md](./settlement-ledger-link-fe-seed-ssot-2026-08-27.md) — 금지 사항 · 고정 ID · 수용 체크리스트

---

## 지급조서 확인 (`/settlement-management/payment-orders`)

| Method | Path | UI |
|--------|------|-----|
| GET | `/api/settlements/aggregates` | 프로그램별·신청자별 목록 (리스트: `pendingItemBucket`, 캘린더: `statementStatus`) |
| GET | `/api/settlements` | **지급 현황 상세 라인** (`programId` / `instructorMemberId` + `fromDate`/`toDate` = 출강일) |
| GET | `/api/settlements/statements` | statementId 매핑 **임시** — P0 embed 있으면 skip |
| GET | `/api/settlements/{settlementId}` | 산출 내역서 |
| PATCH | `/api/settlements/statements/{statementId}/confirm` | 단건 확인 |
| POST | `/api/settlements/statements/bulk-confirm` | 일괄 확인 |
| PATCH | `/api/settlements/statements/{statementId}/reject` | 신청 반려 (`reason` + 알림 스케줄) |
| GET | `/api/settlements/{settlementId}/payment-statement/download` | 지급조서 다운로드 (확인 완료만) |
| GET | `/api/settlements/calendar` | 캘린더 뷰 (출강일·기간) |
| GET | `/api/settlements/calendar/summary` | 월별 요약 (hook 준비) |
| GET | `/api/settlements/calendar/dates/{date}` | 일자 상세 (hook 준비) |

**P0 핸드오프 (백엔드 복붙):** [payment-orders-openapi-p0-backend-cursor-prompt.md](./payment-orders-openapi-p0-backend-cursor-prompt.md) (API + DB seed)  
**상세 필드 SSOT:** [settlement-payment-order-detail-backend-handoff.md](./settlement-payment-order-detail-backend-handoff.md)

---

## 계좌 지급 확인 (`/settlement-management/account-payments`)

| Method | Path | UI |
|--------|------|-----|
| GET | `/api/account-payments` | 목록·캘린더. 필터 `fromDate`/`toDate` = **이체 예정일**. `status=WAITING_PAYMENT`\|`PAID` |
| GET | `/api/account-payments/{paymentId}` | 상세 **1회** (`settlement` = SettlementFrontendResponse embed) |
| PATCH | `/api/account-payments/{paymentId}/paid` | 지급 완료 (목록·상세) |
| PATCH | `/api/account-payments/{paymentId}/failed` | 지급 실패 (hook만) |
| PATCH | `/api/account-payments/bulk-paid` | 일괄 지급 완료 |
| GET | `/api/settlements/budget-summary?year=&fromDate=&toDate=` | 요약 카드. **목록과 동일 이체 예정일**을 `fromDate`/`toDate`로 전달. `annualBudgetAmount`=후원사 연도별 기부금 합계, `expectedSettlementAmount`=기간∩CONFIRMED∩WAITING_PAYMENT |
| POST | `/api/settlements/exports/bulk-transfer` | 대량이체 export — body `status: "PAID"`만 (미지급 포함 시 BE 거절). FE는 선택 건 PAID 검증 후 호출 + Client Excel 미리보기 |
| POST | `/api/settlements/exports/tax-report` | 세금신고 export — 동일 `status: "PAID"` |
| GET | `/api/settlements/exports` | export 이력 |

**캘린더:** account-payments 목록 — 일자 배치는 **이체 예정일(`scheduledPaymentDate`)**. `lectureDate`는 교육 진행일 표시용.

**목록 UI:** 대기/완료 2종. 컬럼 `강의 진행 차시`. 개인 프로그램은 기관·차시 `-`.

**대량이체 양식 SSOT:** 시안 9열 (`bulk-transfer-fortune-data.ts`).

**409 `PAYMENT_STATEMENT_STATUS_CONFLICT`:** message `지급조서 확인 완료 후 계좌 지급을 처리할 수 있습니다.` + `error.details.statementStatus`.

**BE 시드·API 보완 핸드오프:** [account-payments-backend-seed-handoff-2026-08-27.md](./account-payments-backend-seed-handoff-2026-08-27.md) · [account-payments-seed-v1.spec.json](./account-payments-seed-v1.spec.json)

---

## 정산 항목 설정 (`/settlement-management/item-settings`)

| Method | Path | UI |
|--------|------|-----|
| GET | `/api/settlement-configs/current` | 카드 목록 조회 |

remote 시 카드 삭제·복제·상세 저장 UI 비활성.

---

## API 갭 상세

백엔드 협의용: [settlement-api-backend-gaps.md](./settlement-api-backend-gaps.md) · [지급 현황 상세](./settlement-payment-order-detail-backend-handoff.md)
