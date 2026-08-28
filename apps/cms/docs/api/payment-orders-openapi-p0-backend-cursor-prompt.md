# Cursor prompt — 지급조서 확인 OpenAPI·런타임·DB seed P0

**이 파일 전체를 백엔드(JABACK) Cursor에 붙여넣어 실행하라.**  
질문은 엔티티를 찾아도 판단이 안 될 때만 하라. 프론트 레포는 없다.

프론트 CMS 정산 관리 → **지급조서 확인** P0 연동이 끝났다. **OpenAPI·런타임·local/staging seed를 아래 계약에 맞춰라.**  
기존 local 시드(`로컬 테스트 경제교육`, `정산 집계 * 검증 프로그램`, 이름 `정*********1`)는 **시안 케이스로 갱신**해야 한다. 목록만 보이는 검증 시드로는 필터·재신청·반려 취소선·산출이 깨진다.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-27 |
| **화면** | CMS LNB `정산 관리` → `지급조서 확인` (`/settlement-management/payment-orders`) |
| **모듈 플래그(FE)** | `VITE_REAL_API_MODULES=...,paymentOrders` |
| **시드 라벨** | `payment-orders-catalog-v1-2026-08` |
| **기계 스펙 JSON** | 같은 폴더 `payment-orders-seed-v1.spec.json` (이 문서와 동일 케이스) |
| **계좌 지급(후속)** | 별도. confirm 후 `WAITING_PAYMENT` 연계만. 이 화면 시드에 `PAID` 넣지 말 것 |

---

## Goal

1. **`/v3/api-docs`에 아래 계약을 정식 반영**한다. path는 바꾸지 않는다.
2. 런타임 응답·필터가 문서와 같다.
3. **DB seed를 시안 케이스로 갱신**한다 (아래 §12). 제미나이 0, `PAID`/`NONE` 0, 이름 **plain**.
4. 목록은 **확인 대기~확인 완료**(+ 재신청·정정·반려). 총액은 **`REJECTED`·`CORRECTION_REQUESTED` 제외**. 혼재 집계는 **`PARTIAL`**.
5. 리스트 쿼리 `pendingItemBucket`, 캘린더 `statementStatus`. 상세 라인 `SettlementListItemResponse.statementId` embed.

완료 조건 (관리자 JWT + **갱신된** local seed):

- `GET /api/admin/settlements/aggregates?groupBy=program&size=100` — Gemini 0, PAID/NONE 0, **`2026년 JA Korea 초등 경제교육`** 존재, `instructorName` 마스킹 없음
- 리스트 `pendingItemBucket=NONE` / `1_5` / `6_10` / `11_PLUS`가 건수를 가른다 (시드에 0 / 3·5 / 8 / 12)
- 캘린더(또는 aggregates) `statementStatus=REQUESTED` 현황 필터 동작. 날짜는 **출강일**
- `GET /api/admin/settlements?programId={초등 경제교육 id}` 1스코프 — 라인에 `statementId`, 상태 5종(대기/완료/재신청/정정/반려), 반려 금액은 합산에서 빠짐
- 박틴토 산출: 특강 915,000 + 교통 31,500 + 숙박 80,000, 식사/활동 행 없음, 원천 8.8%
- `PATCH …/confirm` + `POST …/bulk-confirm` 200 → `CONFIRMED` (+ 계좌 대기 `WAITING_PAYMENT` 연계 가능)
- `PATCH …/reject` body `reason` + `notificationType` — 구 건 `REJECTED` 유지, 재신청은 **신규 settlement**
- 409 `PAYMENT_STATEMENT_STATUS_CONFLICT` 의 `message`를 FE가 그대로 노출

---

## Out of scope / 금지

- path를 바꾸지 마라. aggregates / settlements / statements confirm·bulk-confirm·reject / calendar / payment-statement download **유지**.
- 목록·캘린더에 제미나이·`PAID`·`NONE`을 넣지 마라.
- 시안 캘린더의 파란 `지급 완료` / `계좌 지급`은 **계좌 지급 화면 잔여**. 이 화면 숏은 `재신청`·`확인 대기`·`확인 완료`·`정정 요청`·`신청 반려`(+ 집계 `일부 확인`)만.
- **신청자명 마스킹 금지.** `홍*동`, `정*********1` 금지. 연락처·계좌는 마스킹 가능.
- 반려 건을 같은 settlement에 overwrite 해서 재신청으로 바꾸지 마라. **신규 settlement**.
- `GET /statements` 전량 join을 FE P0 해법으로 남기지 마라. **`statementId` embed**.
- 강사 프로필 원문 unmask·발급 PDF PII는 상세 UI SSOT(별도). 이번 P0는 목록·필터·집계·confirm/reject·시드.

---

## 1. Paths (유지)

| Method | Path | 이번 P0 |
|--------|------|---------|
| GET | `/api/admin/settlements/aggregates` | 리스트 `pendingItemBucket` / 캘린더 `statementStatus`, `aggregateStatus=PARTIAL` |
| GET | `/api/admin/settlements` | 상세 스코프 + **`statementId` embed** |
| GET | `/api/admin/settlements/{settlementId}` | 산출. 박틴토 시드 금액 |
| PATCH | `/api/admin/settlements/statements/{statementId}/confirm` | 이체 예정일 body |
| POST | `/api/admin/settlements/statements/bulk-confirm` | 동일 |
| PATCH | `/api/admin/settlements/statements/{statementId}/reject` | `reason` + 알림 스케줄 |
| GET | `/api/admin/settlements/calendar` | 출강일, PAID 제외 |
| GET | `/api/admin/settlements/{settlementId}/payment-statement/download` | **CONFIRMED만** |

`GET /api/admin/settlements/statements` 전량은 embed 이후 FE가 제거한다. path는 유지해도 된다.

---

## 2. 상태 계약

| API `statementStatus` | FE UI | 라벨 | 이 화면 노출 | 총액 | 지급 대기 건 |
|-----------------------|--------|------|--------------|------|----------------|
| `REQUESTED` | `pending` | 확인 대기 중 | ✅ | 포함 | 포함 |
| `REAPPLICATION` (또는 `REQUESTED`+`resubmission=true`) | `reapplication` | 지급조서 재신청 | ✅ | 포함 | 포함 |
| `PARTIAL` / `PARTIAL_CONFIRMED` | `partial` | 확인 진행 중 | ✅ 집계 헤더 | — | — |
| `CONFIRMED` | `confirmed` | 지급조서 확인 완료 | ✅ | 포함 | 제외 |
| `CORRECTION_REQUESTED` | `correction` | 지급 정정 요청 | ✅ | **제외** | 제외 |
| `REJECTED` | `application_rejected` | 신청 반려 | ✅ 금액 취소선 | **제외** | 제외 |
| `PAID` | (계좌 지급 완료) | — | ❌ | — | — |
| `NONE` | 해당 없음 | — | ❌ | — | — |

- 라인에 `REAPPLICATION`을 내려라. FE는 `REAPPLICATION`/`RESUBMITTED` 둘 다 재신청으로 매핑.
- 집계 `aggregateStatus`/`processingStatus`: 확인완료만 `CONFIRMED`, 대기·재신청만 `REQUESTED`, **혼재면 `PARTIAL`**. pending/confirmed 2값만 내리지 마라.
- confirm → 라인 `CONFIRMED`. 이후 계좌 지급 대기(`WAITING_PAYMENT`) 연계 가능. **이 화면 목록에는 PAID를 넣지 마라.**
- 재신청: 구 건 `REJECTED` **유지**. 신규 `settlementId` + 신규 `statementId`.

---

## 3. 목록 가시성·총액

| 규칙 | 내용 |
|------|------|
| 프로그램 유형 | **제미나이 0건** (aggregates·settlements·calendar) |
| 상태 | `PAID`·`NONE` 제외 |
| `estimatedAmount` | `REJECTED`·`CORRECTION_REQUESTED` **합산 제외** |
| `pendingPaymentSettlementItemCount` | `REQUESTED` + `REAPPLICATION` |

---

## 4. 리스트 vs 캘린더 query

`GET /api/admin/settlements/aggregates`

| query | 리스트 | 캘린더 |
|-------|--------|--------|
| `groupBy` | `program` \| `instructor` | 동일 |
| `fromDate` / `toDate` | **강의 출강일** | 동일 |
| `search` | 프로그램명 또는 **신청자명** contains | 동일 |
| **`pendingItemBucket`** | `NONE` \| `1_5` \| `6_10` \| `11_PLUS` | **보내지 않음** |
| **`statementStatus`** | **보내지 않음** | `REQUESTED` \| `REAPPLICATION` \| `PARTIAL` \| `CONFIRMED` \| `CORRECTION_REQUESTED` \| `REJECTED` |
| `page` / `size` | 기본 20. FE는 size=100 루프 | 동일 |

버킷 = `pendingPaymentSettlementItemCount`: `NONE`=0, `1_5`=1~5, `6_10`=6~10, `11_PLUS`=11+.  
날짜는 **출강일**. 이체 예정일 필터가 아니다.

---

## 5. 집계 DTO extras

`SettlementAggregateResponse` 유지 + 확정:

| 필드 | UI |
|------|-----|
| `aggregateStatus` 또는 `processingStatus` | 배지. **`PARTIAL`·`REAPPLICATION` 포함** |
| `pendingPaymentSettlementItemCount` | 지급 대기 건수 |
| `estimatedAmount` | 총액 (반려·정정 제외) |
| `settlementRelevantAttendanceDates` | 캘린더 출강일 |
| `instructorName` | 신청자명 **plain** |
| `programName` | 프로그램명 |

서버 집계 상태를 우선. pendingCount로만 2분류하지 마라.

---

## 6. 상세 — `statementId` embed (P0)

`GET /api/admin/settlements?programId=` 또는 `?instructorMemberId=` (+ `fromDate`/`toDate`):

`SettlementListItemResponse.statementId?: number`

- 조서 있는 라인: `statementId` + `statementStatus`
- 미생성: 둘 다 null
- 개인 프로그램: `institutionName` null → FE `-`
- 이름 **plain**. 연락처·계좌 마스킹 가능

---

## 7. confirm / bulk-confirm

```json
{
  "statementIds": [1, 2],
  "reason": "지급조서 확인",
  "lectureFeePaymentScheduledDate": "2026-09-15",
  "scheduledPaymentDate": "2026-09-15"
}
```

일괄 기본일은 FE가 **다음달 셋째 화요일**을 넣는다. BE는 저장만.  
잘못된 상태 → 409 `PAYMENT_STATEMENT_STATUS_CONFLICT`, `message`는 운영자 다음 행동 안내.

---

## 8. reject + 알림 스케줄

`PATCH /api/admin/settlements/statements/{statementId}/reject`

```json
{
  "reason": "제출 서류 미비",
  "notificationType": "IMMEDIATE",
  "scheduledNotificationAt": "2026-08-28T09:15:00"
}
```

| `notificationType` | `scheduledNotificationAt` |
|--------------------|---------------------------|
| `IMMEDIATE` | 생략 |
| `ON_ANNOUNCEMENT` | 생략 (BE가 발표일 해석) |
| `MANUAL` | **필수** ISO datetime |

OpenAPI `SettlementStatusChangeRequest`에 필드 추가. 런타임이 무시하면 시안 알림이 빠진다.

---

## 9. FE가 이미 하는 일 (참고)

- 리스트: aggregates + `pendingItemBucket`. 캘린더: 같은 aggregates + `statementStatus`.
- 상세: scoped `GET /settlements`. statements 전량은 **임시**.
- 산출: `GET /settlements/{id}`. mutation 후 list·detail·calendar만 invalidate.
- mock SSOT: CMS `payment-order-admin-list.ts`.

BE가 `/v3/api-docs`를 맞추면 FE는 `fetch:openapi && generate:api`면 된다.

---

## 10. 409

```
error.code = "PAYMENT_STATEMENT_STATUS_CONFLICT"
message   = (현재 상태 + 다음 행동. 예: 확인 완료된 건만 발급할 수 있습니다.)
```

`code` 유지. `message`만 운영자가 이해하게. FE는 message를 그대로 띄운다.

---

## 11. Acceptance checklist (API)

- [ ] OpenAPI: aggregates query `pendingItemBucket` + `statementStatus` + `fromDate`/`toDate`/`search`
- [ ] OpenAPI: `SettlementListItemResponse.statementId`
- [ ] OpenAPI: reject body `notificationType` / `scheduledNotificationAt`
- [ ] OpenAPI: aggregate `aggregateStatus`에 `PARTIAL` / `REAPPLICATION`
- [ ] Runtime: Gemini 0, PAID/NONE 0, 총액에서 REJECTED·CORRECTION_REQUESTED 제외
- [ ] 혼재 집계 → `PARTIAL`
- [ ] 리스트 버킷 vs 캘린더 현황 query가 다름
- [ ] 상세 1스코프 + statementId
- [ ] confirm / bulk-confirm / reject 스모크 + 409 message
- [ ] 재신청 = 신규 settlement, 구 REJECTED 유지
- [ ] 신청자명 마스킹 없음
- [ ] `/v3/api-docs` 갱신

---

## 12. DB seed 갱신 (필수)

**기존 local/staging 정산 시드를 덮어쓰거나 라벨 `payment-orders-catalog-v1-2026-08`로 교체하라.**  
지금 local에 있는 검증 프로그램(`로컬 테스트 경제교육`, `정산 대기 0건 검증 프로그램`, `정산 집계 11건 이상 검증 프로그램`인데 대기가 6건 등)과 **마스킹된 이름**은 이 화면 수용 기준이 아니다.

### 12.1 연결 엔티티

각 라인:

1. **Member(강사)** — `fullNameKo` **실명** (박틴토, 김틴토, 최틴토, 허틴토, 이틴토)
2. **Program** — 일반/UJAT/1사1교 가능. **제미나이 프로그램에 Settlement를 달지 마라**
3. **Settlement** — `statementStatus`, `lectureDate`, `sessionOrdinal`, `institutionName?`, `netPaymentAmount`, 산출 `items[]`
4. **PaymentStatement** — `statementId` ↔ `settlementId`. 목록 DTO에 embed

출강일은 **당월 1일 ~ 익월 1일** 기본 필터에 들어가게 배치 (검증 시점 기준, 예: 2026-08-01 ~ 2026-09-01).

### 12.2 반드시 넣을 집계 행

| 케이스 | 프로그램/신청자 | aggregateStatus | 지급대기 | estimatedAmount | 비고 |
|--------|-----------------|-----------------|----------|-----------------|------|
| 시안 대표 | `2026년 JA Korea 초등 경제교육` | `PARTIAL` | **5** | 2,000,000 (반려·정정 제외 합) | 대상자 다수 |
| 버킷 1_5 | `HSBC/HKU Business Case Competition 2026 모집 안내` | `REQUESTED` | **3** | 915,000 | |
| 버킷 NONE | (임의 프로그램) | `CONFIRMED` | **0** | 625,000 | |
| 버킷 6_10 | (임의) | `REAPPLICATION` | **8** | 1,200,000 | |
| 버킷 11_PLUS | (임의) | `REQUESTED` | **12** | — | 이름만 11+이고 건수 6이면 실패 |
| 신청자 김틴토 | instructor 집계 | — | **5** | 2,000,000 | 프로그램 수 ≥1 |
| 신청자 박틴토 | instructor 집계 | `PARTIAL` | **2** | 1,845,000 | `scheduleChangeCancelCount=1` |

프로그램별 ≥30행, 신청자별 ≥20행이면 FE 목록 스크롤 검증에 충분. 위 명시 케이스는 **고정**.

### 12.3 초등 경제교육 — 상세 라인 (같은 programId 스코프)

| 신청자 | 기관 | 차시 | statementStatus | net | 비고 |
|--------|------|------|-----------------|-----|------|
| 박틴토 | 강서초등학교 | 3 | `REQUESTED` | 915,000 | 산출 §12.4 |
| 김틴토 | 대구수성초등학교 | 2 | `CONFIRMED` | 300,000 | |
| 최틴토 | 강서초등학교 | 1 | `REAPPLICATION` | 315,000 | **신규** settlement. 구 REJECTED 별도 유지 |
| 허틴토 | 진월초등학교 | 2 | `CORRECTION_REQUESTED` | 480,000 | 총액 제외 |
| 박틴토 | 강서초등학교 | 3 | `REJECTED` | 915,000 | 사유 `제출 서류 미비`. UI 취소선. 총액 제외 |
| 이틴토 | **null** | 1 | `REQUESTED` | 15,000 | 개인 프로그램 → 기관 `-` |

헤더 집계: 확인완료+대기 혼재 → **`PARTIAL`**.

### 12.4 박틴토 산출 (`GET /settlements/{id}`)

| 항목 | 금액 |
|------|------|
| 특강 강의비 | 915,000 |
| 교통비 | 31,500 |
| 숙박비 | 80,000 |
| 식사비 | **행 없음** |
| 활동비 | **행 없음** |
| 원천징수 | 8.8% |

`scheduleChangeCancelCount = 1`.

### 12.5 하지 말 것 (시드)

- 제미나이 프로그램 Settlement
- 이 화면용 `statementStatus=PAID` 또는 `NONE`
- 신청자명 마스킹
- 재신청을 반려 행 UPDATE로 처리
- `11_PLUS` 버킷인데 pendingCount < 11
- 기존 `정산 집계 11건 이상 검증 프로그램`(대기 6건)을 11+ 케이스로 재사용

confirm된 라인은 계좌 지급 시드와 연결해도 된다. **지급조서 확인 목록 응답에는 PAID를 넣지 않는다.**

### 12.6 시드 수용

- [ ] aggregates에 `2026년 JA Korea 초등 경제교육`, 김틴토, 박틴토
- [ ] Gemini 0, PAID/NONE 0, 이름 plain
- [ ] 버킷 NONE / 1_5 / 6_10 / 11_PLUS 각각 ≥1 집계 행 (건수 0 / 3또는5 / 8 / 12)
- [ ] 상세 라인 5종 + 개인 프로그램 기관 null + 반려 사유
- [ ] 박틴토 산출 금액·식사/활동 없음
- [ ] 재신청 행과 구 REJECTED 행이 **둘 다** 존재
- [ ] `statementId` embed로 confirm/reject 가능

---

## 13. 복붙용 한 줄 Goal

> 지급조서 확인 P0: path는 유지하고, Gemini·PAID·NONE 제외, 총액에서 반려·정정 제외, 혼재는 PARTIAL, 리스트 pendingItemBucket / 캘린더 statementStatus, statementId embed, reject 알림 스케줄, 재신청은 신규 settlement. 기존 검증 시드를 시안(초등 경제교육·박틴토/김틴토·버킷 0/3/5/8/12·이름 plain)으로 교체하라.
