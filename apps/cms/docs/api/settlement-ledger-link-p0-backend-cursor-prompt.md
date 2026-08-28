# Cursor prompt — 지급조서 ↔ 계좌 지급 원장 연동 P0

**이 파일 전체를 백엔드(JABACK) Cursor에 붙여넣어 실행하라.**  
질문은 엔티티를 찾아도 판단이 안 될 때만 하라. 프론트 레포는 없다.

프론트 CMS는 이미 두 화면을 원장 계약에 맞춰 연동했다.  
**OpenAPI·런타임·local/staging seed를 아래 계약에 맞추고, 두 시드 카탈로그를 동시에 올려라.**  
화면 path·라우트·LNB는 바꾸지 않는다.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-27 |
| **화면** | `지급조서 확인` `/settlement-management/payment-orders` · `계좌 지급 확인` `/settlement-management/account-payments` |
| **모듈 플래그(FE)** | `VITE_REAL_API_MODULES=...,paymentOrders,accountPayments` |
| **시드 라벨** | `payment-orders-catalog-v1-2026-08` · `account-payments-catalog-v1-2026-08` |
| **DB 시드 상세** | 같은 폴더 `settlement-ledger-link-db-seed-update-2026-08-27.md` |
| **기계 스펙** | `payment-orders-seed-v1.spec.json` · `account-payments-seed-v1.spec.json` |
| **단건 화면 P0** | `payment-orders-openapi-p0-backend-cursor-prompt.md` · `account-payments-openapi-p0-backend-cursor-prompt.md` (본 문서는 **원장 교차**만) |

---

## Goal

1. 같은 `settlement` 한 줄이 **지급조서 확인 → (confirm) → 계좌 지급 확인 → (PAID)** 로 흐른다.
2. confirm / bulk-confirm 200 시:
   - 라인 `statementStatus=CONFIRMED`, `paymentStatus=WAITING_PAYMENT`
   - 같은 `settlementId`로 `account_payment` 행 생성(또는 upsert)
   - body `lectureFeePaymentScheduledDate` 또는 `scheduledPaymentDate`가 있으면 **지급조서·계좌 지급 모두** 이체 예정일 = 그 날짜. 없으면 settlement에 있던 이체일을 계좌 지급으로 복사.
3. 계좌 지급에서 `PAID` 처리하면 그 settlement는 **지급조서 목록·aggregates·calendar에서 사라진다** (`payment_status=PAID` 제외).
4. 계좌 목록 응답 `paymentStatus`는 **`WAITING_PAYMENT | PAID | FAILED`**. `REQUESTED`로 위장하지 않는다. (쿼리 `status=REQUESTED`는 대기 버킷 **alias**로만 해석)
5. 한글 시안명(김틴토, 박틴토, 초등 경제교육, HSBC)으로 두 화면 행을 merge하지 마라. **ID가 다르다.**
6. `/v3/api-docs`와 런타임이 문서와 같다. FE는 `fetch:openapi && generate:api`만 하면 된다.

완료 조건 (관리자 JWT + **두 시드 모두** 로드):

- 지급조서 출강일 `2026-08-01`~`2026-09-01` → programId **170302** PARTIAL · 대기 5 · 2,000,000
- settlementId **170601** confirm(+이체일) → 계좌 목록에 같은 `settlementId`, `WAITING_PAYMENT`, 신청자 박틴토, 은행 스냅샷, 이체일
- 그 건 PAID → 지급조서 목록에서 170601 사라짐
- 지급조서 목록에 PAID 없음 / 계좌 대기 응답이 `WAITING_PAYMENT`
- 김틴토·박틴토를 이름만으로 묶으면 금액이 합쳐지지 않음 (memberId 분리)
- reject body `notificationType` / `scheduledNotificationAt`, aggregates `pendingItemBucket` / `statementStatus`, list `statementId`가 OpenAPI에 있음

---

## Out of scope / 금지

- path 변경 금지.
  - 지급조서: `GET/POST /api/admin/settlements`, `GET …/aggregates`, statement confirm/reject, calendar
  - 계좌: `GET /api/admin/account-payments`, paid / bulk-paid, budget-summary
- 지급조서 시드/목록에 **`PAID`** 넣지 마라.
- 계좌 지급 목록에 미확인(`REQUESTED`/`REAPPLICATION`) 조서를 넣지 마라. **`statementStatus=CONFIRMED`만.**
- 신청자명 마스킹 금지. 연락처·계좌·예금주만 마스킹 가능.
- 계좌 상세에서 FE가 `GET /settlements/{id}`를 다시 치게 만들지 마라. **`detail.settlement` embed.**
- mock extras/join으로 계좌 상세 settlement를 만들지 마라 (BE 책임은 embed).
- net=0 CONFIRMED 스크롤 필러는 지급조서에만. **계좌 지급에 넣지 마라.**

---

## 1. 원장 상태 머신

```
[지급조서 큐] REQUESTED | REAPPLICATION | RESUBMITTED | CONFIRMED | CORRECTION_REQUESTED | REJECTED
       │  (Gemini · NONE/DRAFT · payment_status=PAID 제외)
       │
       ▼ confirm / bulk-confirm
CONFIRMED + paymentStatus=WAITING_PAYMENT + account_payment 생성
       │
       ▼ [계좌 지급 큐] statementStatus=CONFIRMED만
WAITING_PAYMENT | FAILED  →  PAID
       │
       ▼ PAID
지급조서 목록에서 해당 settlement 제외
```

| 단계 | statementStatus | paymentStatus | 지급조서 목록 | 계좌 목록 |
|------|-----------------|---------------|---------------|-----------|
| 확인 대기 | `REQUESTED` | (미생성 또는 비대기) | ✅ | ❌ |
| 재신청 | `REAPPLICATION` | — | ✅ | ❌ |
| 확인 완료·이체 대기 | `CONFIRMED` | `WAITING_PAYMENT` | ✅ (확인 완료) | ✅ 대기 |
| 계좌 지급 완료 | `CONFIRMED` | `PAID` | ❌ | ✅ 완료 |
| 반려 | `REJECTED` | — | ✅ (총액 제외) | ❌ |

---

## 2. Paths (유지) · 교차 동작

| Method | Path | 원장 역할 |
|--------|------|-----------|
| PATCH | `/api/admin/settlements/statements/{id}/confirm` | CONFIRMED + WAITING_PAYMENT + account_payment |
| POST | `/api/admin/settlements/statements/bulk-confirm` | 동일 (body에 이체일) |
| PATCH | `/api/admin/settlements/statements/{id}/reject` | REJECTED. 재신청은 **신규** settlement |
| PATCH | `/api/admin/account-payments/{id}/paid` | PAID → 지급조서 목록 제외 |
| PATCH | `/api/admin/account-payments/bulk-paid` | 동일 |
| GET | `/api/admin/settlements/aggregates` | 출강일. `payment_status=PAID` 제외 |
| GET | `/api/admin/settlements` | 상세 라인 + `statementId` embed |
| GET | `/api/admin/account-payments` | 이체 예정일. CONFIRMED만. 응답 WAITING_PAYMENT\|PAID\|FAILED |
| GET | `/api/admin/account-payments/{id}` | `settlement` = SettlementFrontendResponse embed |
| GET | `/api/admin/settlements/budget-summary?year=` | 2026 → annualBudgetAmount **109150000** |

### confirm body

```json
{
  "statementIds": […],
  "reason": "지급조서 확인",
  "lectureFeePaymentScheduledDate": "2026-09-15",
  "scheduledPaymentDate": "2026-09-15"
}
```

둘 중 하나 또는 둘 다 허용. 있으면 양쪽 이체일 갱신.

### reject body

```json
{
  "reason": "제출 서류 미비",
  "notificationType": "IMMEDIATE",
  "scheduledNotificationAt": "2026-08-28T09:15:00"
}
```

`MANUAL`일 때 `scheduledNotificationAt`(`LocalDateTime`) 필수.

### 409

| 화면 | code | message 예 | details |
|------|------|------------|---------|
| 지급조서 발급 등 | `PAYMENT_STATEMENT_STATUS_CONFLICT` | `확인 완료된 건만 발급할 수 있습니다.` | — |
| 계좌 paid | 동일 code | `지급조서 확인 완료 후 계좌 지급을 처리할 수 있습니다.` | `statementStatus` |

FE는 `message`를 그대로 노출한다.

---

## 3. 날짜 필터 (화면마다 다름)

| 화면 | fromDate / toDate | 기본 시드 구간 |
|------|-------------------|----------------|
| 지급조서 확인 · aggregates · calendar | **출강일** `lectureDate` | 2026-08-01 ~ 2026-09-01 |
| 계좌 지급 확인 목록·요약 | **이체 예정일** `scheduledPaymentDate` / `expectedTransferDate` | 레거시 2026-02 · 대기 쇼케이스 **2026-09-15** · Q3 8·9·10월 |

계좌 지급 날짜를 출강일로 보내지 마라. 지급조서에 이체일을 날짜 필터로 쓰지 마라.

---

## 4. 지급조서 집계·리스트 계약 (교차에 필요한 최소)

- 혼재 집계 `aggregateStatus=PARTIAL`
- pending = `REQUESTED` + `REAPPLICATION` (+ `RESUBMITTED`)
- 총액에서 `REJECTED`·`CORRECTION_REQUESTED` 제외
- 리스트 `pendingItemBucket=NONE|1_5|6_10|11_PLUS` (구 alias `0`/`1-5`/`6-10`/`11+` 허용)
- 캘린더/집계 현황 = `statementStatus`. `PARTIAL_CONFIRMED` → PARTIAL. `RESUBMITTED` → REAPPLICATION
- 리스트 행 `statementId` embed. confirm/reject/발급은 이 ID
- 재신청 = **새 settlement + statement(`REAPPLICATION`)**. 구 `REJECTED` overwrite 금지

상세는 `payment-orders-openapi-p0-backend-cursor-prompt.md`.

---

## 5. 계좌 지급 계약 (교차에 필요한 최소)

- 목록 전제: 연계 Settlement `statementStatus=CONFIRMED`
- 응답 대기: **`WAITING_PAYMENT`** (쿼리 `REQUESTED`는 alias)
- list extras: `programNameKo`, `institutionName`, `sessionOrdinal`/`sessionLabel`, `lectureDate`
- detail: `settlement` → `$ref: SettlementFrontendResponse` (null 허용)
- paid / bulk-paid: CONFIRMED만 200

상세는 `account-payments-openapi-p0-backend-cursor-prompt.md`.

---

## 6. ID 분리 (검색/집계 버그 방지)

| 이름 | 지급조서 memberId | 계좌 지급 memberId |
|------|-------------------|--------------------|
| 박틴토 | **170201** | **169202** |
| 김틴토 | **170202** | **169201** |

instructor groupBy / 스코프는 **`instructorMemberId`**. 이름 contains만 쓰면 두 줄이 나온다 — 그게 정상이다. 금액 merge 금지.

프로그램명 접미사:

| programId (계좌 카탈로그) | 이름 |
|---------------------------|------|
| 169301 | `HSBC/HKU 2026 (계좌 지급 카탈로그)` |
| 169302 | `2026 초등 경제교육 (계좌 지급 카탈로그)` |
| 169303 | `2026 멘토링 (계좌 지급 카탈로그)` |
| 169304 | `2026 중등 경제교육 (계좌 지급 카탈로그)` |

지급조서 시안 프로그램(170301–170305)과 **이름·ID를 섞지 마라.**  
8월 출강 필터의 지급조서에 `(계좌 지급 카탈로그)` CONFIRMED 행이 **확인 완료**로 보일 수 있다 — 연동상 맞다. 시안 검증은 **1703xx** 이름으로 찾아라.

---

## 7. confirm 후 FE가 기대하는 것

1. 지급조서에서 **170601**(박틴토, memberId **170201**) confirm(+이체일)
2. invalidate 후 계좌 목록에 `settlementId=170601`, `WAITING_PAYMENT`, 신청자 박틴토, 은행 스냅샷, 이체일
3. 이미 시드된 net>0 CONFIRMED(김틴토 초등 300,000 / 확인완료 카탈로그 625,000 등)는 이체일 **2026-09-15** 대기 행으로 계좌에 존재
4. 계좌에서 PAID → 지급조서에서 해당 행 소멸

FE는 confirm / reject / paid / failed 후 **양쪽** 캐시를 무효화한다. BE는 상태·행만 올바르게 쓰면 된다.

---

## 8. Acceptance checklist

### API·런타임
- [ ] confirm → CONFIRMED + WAITING_PAYMENT + account_payment(+이체일 복사/body)
- [ ] PAID → 지급조서 aggregates/list/calendar에서 제외
- [ ] 계좌 응답 `WAITING_PAYMENT` (REQUESTED 위장 없음)
- [ ] 계좌 목록 = CONFIRMED만
- [ ] 지급조서 날짜=출강일, 계좌 날짜=이체일
- [ ] reject 알림 필드 · `statementId` embed · `pendingItemBucket` OpenAPI
- [ ] 계좌 409 message + `details.statementStatus`
- [ ] detail embed = SettlementFrontendResponse
- [ ] `/v3/api-docs` 갱신

### Seed (요약 — 상세는 DB 시드 문서)
- [ ] 라벨 두 개 모두 로드
- [ ] 지급조서: 170301–170305, 170601, member 170201–170205, **PAID 0**
- [ ] 계좌: 169801–169832 레거시 + Q3 + 2026-09-15 대기 쇼케이스 + budget 109150000
- [ ] 박틴토/김틴토 memberId 카탈로그별 분리
- [ ] confirm 170601 → 계좌에 같은 settlementId

---

## 9. 복붙용 한 줄 Goal

> 지급조서↔계좌 지급 원장 P0: confirm 시 CONFIRMED+WAITING_PAYMENT+account_payment(이체일), PAID 시 지급조서 목록 제외, 응답 WAITING_PAYMENT 유지, 날짜 축 분리, 시안 ID(170xxx/169xxx) 분리 시드 두 카탈로그를 동시에 맞춰라. path·LNB 불변.
