# BE 로컬 시드 SSOT — 지급조서 ↔ 계좌 지급 원장 연동 (FE Cursor)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-27 |
| **대상** | CMS 프론트 `paymentOrders` + `accountPayments` |
| **BE** | JA CMS Backend **local demo seed** (이미 반영됨). Flyway/DataLoader가 아님 |
| **전제** | BE local 재시작 + `JA_LOCAL_DEMO_ENABLED=true` |
| **BE→FE 원문 요지** | 두 카탈로그 라벨·고정 ID·원장 연동. 한글명 merge 금지 |
| **관련** | [settlement-ledger-link-db-seed-update-2026-08-27.md](./settlement-ledger-link-db-seed-update-2026-08-27.md) · [settlement-api-integration.md](./settlement-api-integration.md) · seed JSON 동폴더 |

모듈 플래그:

```text
VITE_REAL_API_MODULES=...,paymentOrders,accountPayments
```

BE local 재시작 후 **두 라벨이 모두** 있어야 한다. 프로그램 `summary`에 아래 문자열이 들어간다. 시안 케이스는 **고정 ID**로만 찾을 것.

| 라벨 | 화면 |
|------|------|
| `payment-orders-catalog-v1-2026-08` | 지급조서 확인 `/settlement-management/payment-orders` |
| `account-payments-catalog-v1-2026-08` | 계좌 지급 확인 `/settlement-management/account-payments` |

---

## 0. FE가 하면 안 되는 것

- `박틴토` / `김틴토` 이름으로 두 화면 행을 합치기 (memberId가 다름)
- 대기 상태를 응답/UI canonical로 `REQUESTED`에 넣기 (계좌 대기는 **`WAITING_PAYMENT`**)
- 계좌 상세에서 `GET /api/admin/settlements/{id}` 추가 호출 (embed only)
- confirm / reject / paid 후 한쪽 캐시만 invalidate
- 구 시드 `로컬 테스트 경제교육`, 마스킹 이름, 「11건 이상인데 대기 6」을 시안으로 쓰기 (BE가 정산 목록에서 격리함)
- 지급조서 화면에 PAID / Gemini / NONE를 기대하기
- net=0 CONFIRMED 필러를 계좌 지급 목록에 기대하기

---

## 1. 원장 한 줄이 두 화면을 지난다

```
[지급조서 큐]
REQUESTED | REAPPLICATION | RESUBMITTED | CONFIRMED | CORRECTION_REQUESTED | REJECTED
  (Gemini · NONE/DRAFT · payment_status=PAID 제외)
        │ confirm / bulk-confirm
        ▼
CONFIRMED + paymentStatus=WAITING_PAYMENT + account_payment 생성
  (body 이체일 있으면 양쪽 반영, 없으면 settlement 이체일 복사)
        │
        ▼ [계좌 지급 큐] statementStatus=CONFIRMED만
WAITING_PAYMENT | FAILED  →  PAID
        │
        ▼ PAID
지급조서 목록·aggregates·calendar에서 해당 settlement 제외
```

| 단계 | statementStatus | paymentStatus | 지급조서 | 계좌 |
|------|-----------------|---------------|----------|------|
| 확인 대기 | `REQUESTED` | — | ✅ | ❌ |
| 재신청 | `REAPPLICATION` | — | ✅ | ❌ |
| 확인 완료·이체 대기 | `CONFIRMED` | `WAITING_PAYMENT` | ✅ 확인 완료 | ✅ 대기 |
| 계좌 지급 완료 | `CONFIRMED` | `PAID` | ❌ | ✅ 완료 |
| 반려 | `REJECTED` | — | ✅ (총액 제외) | ❌ |

FE 캐시: `invalidateSettlementLedgerCaches` — confirm / reject / paid / failed 후  
`paymentOrders.all` + `calendar.all` + `accountPayments` lists/details/budgetSummary.

---

## 2. 날짜 필터

| 화면 | fromDate / toDate | 기본 URL / 시드 |
|------|-------------------|-----------------|
| 지급조서 | **출강일** `lectureDate` | FE 기본 `po_from`/`po_to` = **당월 1일 ~ 익월 1일** (예: 2026-08-01 ~ 2026-09-01). 월말 잘림 아님 |
| 계좌 지급 | **이체 예정일** | 레거시 2026-02 · 대기 쇼케이스 **2026-09-15** · Q3 8·9·10월 |

계좌 날짜를 출강일로 보내지 말 것. 지급조서에 이체일을 날짜 필터로 쓰지 말 것.

---

## 3. 고정 ID (이름으로 찾지 말 것)

### 3.1 memberId 분리

| 이름 | 지급조서 memberId | 계좌 지급 memberId |
|------|-------------------|--------------------|
| 박틴토 | **170201** | **169202** |
| 김틴토 | **170202** | **169201** |

스코프/집계는 `instructorMemberId` / `programId` / `settlementId`.

### 3.2 지급조서 프로그램

| 케이스 | programId | 기대 |
|--------|----------|------|
| 초등 PARTIAL | **170302** | 대기 5, 총액 2,000,000 · `2026년 JA Korea 초등 경제교육` |
| HSBC 1_5 | **170301** | 대기 3, 915,000 |
| 확인완료 NONE | **170303** | 대기 0, 625,000 |
| 재신청 8 | **170304** | REAPPLICATION 8, 1,200,000 |
| 11+ | **170305** | 대기 12 |

### 3.3 연동 핵심 settlement

| ID | 내용 |
|----|------|
| **170601** | 박틴토(170201) REQUESTED · 특강 915,000 + 교통 31,500 + 숙박 80,000 · 원천 8.8% · 식사/활동 없음 |
| confirm 후 | 계좌에 같은 `settlementId=170601`, `WAITING_PAYMENT` |

### 3.4 계좌 카탈로그 프로그램 (접미사)

| programId | 이름 |
|-----------|------|
| 169301 | `HSBC/HKU 2026 (계좌 지급 카탈로그)` |
| 169302 | `2026 초등 경제교육 (계좌 지급 카탈로그)` |
| 169303 | `2026 멘토링 (계좌 지급 카탈로그)` |
| 169304 | `2026 중등 경제교육 (계좌 지급 카탈로그)` |

레거시 accountPaymentId **169801–169832**.  
이미 CONFIRMED·net>0 쇼케이스 이체일 **2026-09-15**.  
`budget-summary?year=2026` → `annualBudgetAmount` **109150000**.

8월 출강 필터의 지급조서에 `(계좌 지급 카탈로그)` CONFIRMED가 **확인 완료**로 보일 수 있음 — 연동상 정상. 시안 검증은 **1703xx**.

---

## 4. API 경로 (유지 · FE가 치는 것)

| 화면 | Method | Path |
|------|--------|------|
| 지급조서 목록 | GET | `/api/admin/settlements/aggregates` |
| 지급조서 상세 라인 | GET | `/api/admin/settlements` (`programId` / `instructorMemberId`) |
| 산출 | GET | `/api/admin/settlements/{settlementId}` |
| 확인 | PATCH/POST | `…/statements/{id}/confirm` · `…/bulk-confirm` |
| 반려 | PATCH | `…/statements/{id}/reject` (`notificationType`, `scheduledNotificationAt`) |
| 계좌 목록 | GET | `/api/admin/account-payments` |
| 계좌 상세 | GET | `/api/admin/account-payments/{id}` (`settlement` embed) |
| 지급 완료 | PATCH | `…/account-payments/{id}/paid` · `bulk-paid` |
| 예산 | GET | `/api/admin/settlements/budget-summary?year=` |

---

## 5. FE 수용 체크리스트 (local demo seed)

1. [ ] `.env`에 `paymentOrders,accountPayments` · BE `JA_LOCAL_DEMO_ENABLED=true` · 재시작
2. [ ] 지급조서 `/settlement-management/payment-orders` URL `po_from`/`po_to` = 당월1~익월1 (월말 아님)
3. [ ] Network `aggregates` — programId **170302** PARTIAL · 대기 5 · 2,000,000
4. [ ] **170601** 상세 산출이 mock이 아니라 API (특강/교통/숙박 · 원천 8.8%)
5. [ ] 170601 confirm(+이체일) → invalidate 후 계좌 목록에 같은 settlementId · `WAITING_PAYMENT` (목록 수동 새로고침 불필요)
6. [ ] 계좌에서 그 건 PAID → 지급조서 목록에서 사라짐
7. [ ] 지급조서 대기 필터에 PAID 없음 · 계좌 대기 응답 `WAITING_PAYMENT`
8. [ ] 김틴토/박틴토 이름만으로 두 화면 금액 merge 안 됨
9. [ ] 계좌 상세 Network에 `/settlements/{id}` 없음
10. [ ] codegen: reject 알림 필드 · `pendingItemBucket` · list `statementId`

---

## 6. FE 코드 앵커 (이미 반영된 것)

| 역할 | 경로 |
|------|------|
| 교차 invalidate | `features/settlement-management/api/invalidate-settlement-ledger-caches.ts` |
| confirm/reject | `hooks/use-confirm-payment-statement-mutation.ts` |
| paid/failed | `hooks/use-account-payment-mutations.ts` |
| 계좌 대기 매핑 | `api/account-payments/build-account-payments-list-params.ts` → `WAITING_PAYMENT` |
| 계좌 상세 embed | `map-account-payment-detail.ts` · `mapAccountPaymentDetailFromGetApi` |
| 출강일 기본 기간 | `pages/settlement-management/payment-orders-date-range.ts` |
| memberId 행 필드 | `map-account-payment-rows.ts` (`instructorMemberId`) |

OpenAPI 갱신 후: `pnpm --filter cms fetch:openapi && pnpm --filter cms generate:api`

---

## 7. 기계 스펙

- [`payment-orders-seed-v1.spec.json`](./payment-orders-seed-v1.spec.json)
- [`account-payments-seed-v1.spec.json`](./account-payments-seed-v1.spec.json)
