# 정산 관리 API — 백엔드 핸드오프 (갭·스펙 불일치)

> **CMS 강사 회원 상세 → 정산 현황** 탭 API 보완은 **[강사 상세 통합 SSOT](./members/instructor-member-detail-program-history-settlement-backend-handoff-2026-08-25.md)** (SET-001~009)를 우선 참고하세요. 본 문서는 **정산 관리 LNB** 3화면 전체 갭입니다.

프론트 CMS 정산 관리 LNB 3화면 API 연동 후 확인된 **미존재 API·구조 불일치** 목록입니다.  
OpenAPI 기준: `openapi/backend.openapi.json` (v9, 351 paths — 2026-06-12 동기화)

---

## 우선순위 요약

| 우선순위 | 건수 | 대표 항목 |
|----------|------|-----------|
| P0 | 8 | **사람 이름 마스킹 금지**, **지급조서 발급 원문 + 산출 내역서 unmask**, 강사 프로필·계좌 embed, 집계 목록, 일괄 confirm, 목록 필터, **계좌 지급 409 메시지**, **계좌 지급 상세 1회 조회** |
| P1 | 4 | 산출 내역서 DTO, 연간 예산, bulk paid, config CRUD |
| P2 | 3 | iconKey, 캘린더 adapter, 상태 enum 매핑표 |

---

## P0 — 신청자명·성명 등 **사람 이름 마스킹 금지**

| | |
|---|---|
| **화면** | 정산 관리 **전체** — 지급조서 확인 목록 「신청자명」, 지급 현황 상세·산출 내역서 「성명」, 계좌 지급 「신청자명」, 캘린더 강사명 |
| **요청** | `instructorName` / `nameKo`를 **plain**으로 반환. `홍*동` 등 **BE 사전 마스킹 금지** |
| **SSOT** | [UI 필드 SSOT §1.1](./settlement-payment-order-detail-ui-fields-backend-handoff.md#11--p0-서버-수정-요청--신청자명성명-등-사람-이름-마스킹-금지) · [핸드오프 §3.7](./settlement-payment-order-detail-backend-handoff.md#37-개인정보-마스킹-정책--p0-서버-수정-요청-사람-이름-마스킹-금지) |
| **대상 API** | `GET /settlements`, `GET /settlements/{id}`, `GET /settlements/aggregates`, `GET /settlements/calendar`, `GET /account-payments` |
| **구분** | 예금주(`accountHolder`)는 이름 컬럼이 아님 — 기존처럼 마스킹 가능(또는 FE) |

---

## P0 — 지급조서 발급(원문) · 산출 내역서 unmask API

| | |
|---|---|
| **화면** | 산출 내역서 모달 「개인정보 확인」· **지급조서 발급** PDF/미리보기 |
| **요청** | `POST /api/admin/settlements/{settlementId}/privacy/unmask` `{ reason }` → `SettlementFrontendResponse` **전 PII 원문**. 발급 양식에 마스킹·목 샘플 기입 금지. **FE는 공란 유지** (최강사 샘플 없음) |
| **원문 필드** | phone, email, address, bankName, accountNumber, accountHolder, gender, birthDate, **nameEn**(발급), 주민등록번호(발급) |
| **SSOT** | [UI 필드 SSOT §1.2](./settlement-payment-order-detail-ui-fields-backend-handoff.md#12--p0-서버-요청--지급조서-발급원문--산출-내역서-unmask-api) · [핸드오프 §3.8](./settlement-payment-order-detail-backend-handoff.md#38-지급조서-발급원문--산출-내역서-unmask-api-p0) |
| **SET-006과 구분** | bulk ZIP은 **파일 묶음**. PDF **내용**의 원문 PII는 본 항목 (SET-009) |

---

## P0 — 지급 현황 상세 (기본 정보 · 정산 목록 전 열)

| | |
|---|---|
| **화면** | 지급조서 확인 → 행 클릭 → **지급 현황 상세** 풀페이지 |
| **요구** | **기본 정보** + **신청자별/프로그램별 정산 목록** 테이블 **모든 열** 값을 서버에서 제공 |
| **상세 SSOT** | [settlement-payment-order-detail-ui-fields-backend-handoff.md](./settlement-payment-order-detail-ui-fields-backend-handoff.md) |
| **프론트 임시** | 강사 프로필·계좌 `-` — **[UI SSOT §4.5 P0 요청](./settlement-payment-order-detail-ui-fields-backend-handoff.md#45--백엔드-요청-p0--강사-프로필계좌-현재-ui--)** (`gender`, `birthDate`, `phone`, `email`, `address`, 계좌 3종). 발급용 `nameEn`은 상세 GET·unmask |
| **산출 내역서 모달** | 강의비·회차·기관명 매핑됨. **강사 PII는 동일 §4.5** |
| **제안** | **`GET /settlements/{id}`에 화면 8필드 + `nameEn` embed**. 풀페이지 `instructorHeader`는 화면 8필드만 — [UI SSOT §4.5](./settlement-payment-order-detail-ui-fields-backend-handoff.md#45--백엔드-요청-p0--강사-프로필계좌-현재-ui--) |

### 필수 라인 필드 (`SettlementListItemResponse`)

| UI 컬럼 | API 필드 | 현재 |
|---------|----------|------|
| 신청자명 / 프로그램명 | `instructorName` / `programNameKo` | ✅ |
| 참여 기관명 | `institutionName` | ✅ |
| 교육 진행 일자 | `lectureDate` | ✅ |
| N차시 | `sessionOrdinal` (1-based) | ✅ (`scheduleId` 미사용) |
| 지급조서 처리 현황 | `statementStatus` | ✅ |
| 정산 신청 금액 | `netPaymentAmount` | ✅ |

### 필수 헤더 embed (프로그램 상세 기본 정보)

| UI | API | 현재 |
|----|-----|------|
| 사업 운영 기간 | `businessPeriodStart`, `businessPeriodEnd` | ✅ 목록 DTO |
| 프로그램 진행 회차 | `sessionCompleted` / `sessionTotal` | ✅ 목록 DTO |

### 필수 헤더 embed (강사 상세 기본 정보)

| UI | API | 현재 |
|----|-----|------|
| 성별·생년 | `gender`, `birthDate` | ❌ **서버 요청** |
| 연락처·이메일·주소·계좌 | `phone`, `email`, `address`, `bankName`, `accountNumber`, `accountHolder` | ❌ **서버 요청** — [UI SSOT §4.5](./settlement-payment-order-detail-ui-fields-backend-handoff.md#45--백엔드-요청-p0--강사-프로필계좌-현재-ui--) |
| 총 정산 예정 금액 | `totalEstimatedAmount` | 집계 목록 값 |

---

## P0 — 지급 현황 상세 (라인 목록 · API 스코프)

| | |
|---|---|
| **화면** | 지급조서 확인 → 행 클릭 → 지급 현황 상세 |
| **프론트 (2026-08-24)** | `GET /api/settlements?programId=` 또는 `?instructorMemberId=` + 목록 `fromDate`/`toDate` |
| **statements** | **임시** — `GET /statements` 전량 fetch 후 settlementId join. **P0:** settlements DTO에 `statementId` embed → [지급조서 확인 P0](./payment-orders-openapi-p0-backend-cursor-prompt.md) · [상세 핸드오프 §4](./settlement-payment-order-detail-backend-handoff.md#4-백엔드-수정-요청--get-settlements-목록에-statementid-포함-p0) |
| **상세 핸드오프** | [settlement-payment-order-detail-backend-handoff.md](./settlement-payment-order-detail-backend-handoff.md) · [UI 필드 SSOT](./settlement-payment-order-detail-ui-fields-backend-handoff.md) |

### P0 — `SettlementListItemResponse.statementId`

| | |
|---|---|
| **갭** | 라인 DTO에 `statementStatus`만 있고 **`statementId` 없음** → 상세 진입 시 `GET /statements` 2차 호출 |
| **제안** | `GET /api/admin/settlements` 응답 item에 `statementId?: number` 추가 (신규 endpoint 불필요) |
| **수용 후** | 프론트 statements join 제거 — [P0 프롬프트](./payment-orders-openapi-p0-backend-cursor-prompt.md) · [핸드오프 §4](./settlement-payment-order-detail-backend-handoff.md#4-백엔드-수정-요청--get-settlements-목록에-statementid-포함-p0) |

---

## P0 — 지급조서 확인

> **백엔드 복붙 SSOT (2026-08-27):** [payment-orders-openapi-p0-backend-cursor-prompt.md](./payment-orders-openapi-p0-backend-cursor-prompt.md) — **API + DB seed 한 문서.**  
> 교차: [payment-orders-backend-seed-handoff-2026-08-27.md](./payment-orders-backend-seed-handoff-2026-08-27.md) · [payment-orders-seed-v1.spec.json](./payment-orders-seed-v1.spec.json)
>
> 집계 목록·일괄 confirm·리스트 `pendingItemBucket` / 캘린더 `statementStatus`·목록 가시성(Gemini·`PAID`·`NONE` 제외)·총액에서 반려·정정 제외·혼재 `PARTIAL`·reject 알림 스케줄·`statementId` embed·시안 시드 교체는 **위 프롬프트가 SSOT**. 본 절은 **잔여만** 둔다.

### 잔여

| 항목 | SSOT |
|------|------|
| 지급 현황 상세 **UI 필드** (기본 정보·목록 전 열·산출 모달) | [settlement-payment-order-detail-ui-fields-backend-handoff.md](./settlement-payment-order-detail-ui-fields-backend-handoff.md) |
| 상세 scoped GET·산출 DTO | [settlement-payment-order-detail-backend-handoff.md](./settlement-payment-order-detail-backend-handoff.md) — `statementId` embed는 **P0 문서로 승격** |
| 강사 PII embed·발급 unmask | 본 문서 상단 P0 이름/unmask 절 · UI SSOT §4.5 / §1.2 |

---

## P0 — 계좌 지급 확인

> **시드·API 일괄 핸드오프 (2026-08-27):** [account-payments-backend-seed-handoff-2026-08-27.md](./account-payments-backend-seed-handoff-2026-08-27.md) · [account-payments-seed-v1.spec.json](./account-payments-seed-v1.spec.json)  
> OpenAPI v9에는 `budget-summary`·`bulk-paid` path가 이미 있음. 아래 §4·§5는 **응답 계약·시드·목록 extras·상세 embed**를 FE 시안과 맞추는 작업으로 해석.

### 4. 연간 예산 요약 카드

| | |
|---|---|
| **화면** | `/settlement-management/account-payments` 상단 「{연도}년 예산 총액」 |
| **UI mock** | `MOCK_ACCOUNT_PAYMENT_ANNUAL_BUDGET` (= **109_150_000**) |
| **현재 API** | `GET /api/admin/settlements/budget-summary?year=` (OpenAPI 존재 · FE hook 연동) |
| **프론트 임시 대응** | remote인데 응답 없으면 `—` |
| **요청** | `annualBudgetAmount` · `completedPaymentAmount` 필드 확정 + year=2026 시드 109150000 |
---

### 5. 일괄 지급 완료

| | |
|---|---|
| **UI** | 목록 다중 선택 → 「계좌 지급 완료」 |
| **현재 API** | `PATCH /api/admin/account-payments/bulk-paid` (OpenAPI·FE mutation 연동) |
| **요청** | body `{ paymentIds[] }` 안정화 + §5.1 409 message · 시드 CONFIRMED만 200 |
---

### 5.1 ⭐ **P0 서버 수정 요청** — 지급 완료 409 `message` 상세화

계좌 지급 확인에서 「지급 완료 처리」/「일괄 지급 처리」 시 지급조서가 **확인 완료(`CONFIRMED`)가 아니면** 409가 납니다.  
CMS는 서버 `message`를 **그대로 모달에 표시**하므로, 운영자가 **다음에 무엇을 해야 하는지** 알 수 있어야 합니다.

| | |
|---|---|
| **화면** | `/settlement-management/account-payments` 목록·상세 「지급 완료 처리」 |
| **대상 API** | `PATCH /api/admin/account-payments/{paymentId}/paid` · `PATCH /api/admin/account-payments/bulk-paid` |
| **현재** | `code: PAYMENT_STATEMENT_STATUS_CONFLICT` · `message: 현재 지급조서 상태에서는 해당 작업을 수행할 수 없습니다.` |
| **요청** | **`code`는 유지**. `message`만 **현재 지급조서 상태 + 다음 행동**을 포함 |
| **권장 payload** | `error.details.statementStatus` (현재 enum) 포함 — FE 분기·로그용 |

**메시지 예시 (`statementStatus`별)**

| 현재 `statementStatus` | 요청 `message` |
|------------------------|----------------|
| `REQUESTED` (확인 대기) | 지급조서 확인 완료 후 계좌 지급을 처리할 수 있습니다. |
| `REJECTED` (신청 반려) | 신청이 반려된 지급조서는 계좌 지급을 처리할 수 없습니다. |
| `CORRECTION_REQUESTED` (정정 요청) | 지급 정정 요청이 처리된 후 계좌 지급을 완료할 수 있습니다. |
| 그 외·미생성 | 지급조서 확인 완료 후 계좌 지급을 처리할 수 있습니다. |

```
❌ 현재 지급조서 상태에서는 해당 작업을 수행할 수 없습니다.
✅ 지급조서 확인 완료 후 계좌 지급을 처리할 수 있습니다.
```

**수용:** 스테이징에서 지급조서 미확인 건을 지급 완료하면, 모달 본문이 위 예시처럼 **확인 완료 후 처리**를 안내한다. `code`는 기존 `PAYMENT_STATEMENT_STATUS_CONFLICT` 유지.

---

### 5.2 ⭐ **P0 서버 보완 요청** — 계좌 지급 현황 상세를 `GET /account-payments/{id}` 1회로

계좌 지급 현황 풀페이지 상세는 **지급 단건 1회**로 기본 정보 + 산출 블록 + 산정 기준 상세를 채워야 합니다.  
지금은 화면용 필드가 embed에 없어 FE가 `GET /settlements/{id}`를 **추가로** 칩니다. 리소스가 둘인 것은 정상이나, **한 화면에서 두 번 조회하는 것은 우회**입니다.

| | |
|---|---|
| **화면** | `/settlement-management/account-payments` → 행 클릭 → **계좌 지급 현황 상세** |
| **대상 API** | `GET /api/admin/account-payments/{paymentId}` |
| **현재 응답** | `AccountPaymentDetailResponse` = `payment`(`AccountPaymentListItemResponse`) + `settlement`(**`SettlementResponse`**) |
| **FE 임시 대응** | `Promise.all` — 위 API + `GET /api/admin/settlements/{settlementId}` (`SettlementFrontendResponse`) |
| **요청** | 상세 **1회**로 화면을 채울 수 있게 embed를 **화면용 정산 DTO**로 맞춤. FE는 이후 정산 단건 호출을 제거 |

**현재 embed로 부족한 필드** (`SettlementResponse`에 없음 → `GET /settlements/{id}`로 우회)

| UI | 필요 필드 | 출처 (정산 단건) |
|----|-----------|------------------|
| 프로그램명 | `programNameKo` | `SettlementFrontendResponse` |
| 사업 운영 기간 | `businessPeriodStart` / `businessPeriodEnd` (`period`) | 동일 |
| 프로그램 진행 회차 | `sessionCompleted` / `sessionTotal` / `programSessionProgressDisplay` | 동일 |
| 참여 기관명 | `institutionName` | 동일 |
| 회차 | `sessionOrdinal` / `lectureSessionDisplay` | 동일 |
| 강의비 책정 기준 | `lectureFeeStandardTitle` / `lectureFeeStandardAmount` (`wageItemType`) | 동일 |
| 사업소득자 여부 | `businessIncomeEarnerLabel` | 동일 |
| 산출 라인 | `items[]`: `type`, `description`, `amount` | 동일 |
| 산정 기준 상세 | `items[].calculationDetail` | 동일 |

`payment` 쪽(은행·계좌·지급 상태·실지급액·이체 예정일)은 현재 상세로 충분합니다.  
강사 연락처·주소·성별 등 PII는 **본 항목 범위 아님** — [UI SSOT §4.5](./settlement-payment-order-detail-ui-fields-backend-handoff.md#45--백엔드-요청-p0--강사-프로필계좌-현재-ui--) · [§1.2 unmask](./settlement-payment-order-detail-ui-fields-backend-handoff.md#12--p0-서버-요청--지급조서-발급원문--산출-내역서-unmask-api).

**제안 (택 1, 권장 A)**

| 안 | 내용 |
|----|------|
| **A (권장)** | `GET /account-payments/{id}`의 `settlement`를 **`GET /settlements/{id}`와 동일 계약** (`SettlementFrontendResponse`)으로 내림. 산출·산정 상세 SSOT를 한 DTO로 유지 |
| B | 기존 `settlement`(`SettlementResponse`)는 유지하고 `settlementFrontend`를 **추가** embed |

A를 택하면 OpenAPI `AccountPaymentDetailResponse.settlement` `$ref`를 `SettlementFrontendResponse`로 바꾸면 됩니다.

```
❌ 상세 진입 = GET /account-payments/{id} + GET /settlements/{id}
✅ 상세 진입 = GET /account-payments/{id} 만 (화면용 settlement embed)
```

**수용**

- [ ] 계좌 지급 현황 상세 오픈 시 Network에 **지급 단건만** 존재 (`/settlements/{id}` 없음)
- [ ] 기본 정보: 프로그램명·사업 기간·진행 회차·강의비 책정 기준·사업소득자 · 이체 예정일·계좌가 `'—'`가 아님
- [ ] 산출 테이블: 기관명·회차·항목 type/금액, 「상세 보기」가 `calculationDetail`로 동작
- [ ] `GET /settlements/{id}` 계약은 **유지** (지급조서 확인 산출 내역서). 본 요청은 **계좌 지급 상세 embed만** 맞춤

---

## P1 — 상세·export

### 6. account-payments 단건 상세 GET

→ **구현됨.** 남은 갭은 embed DTO — **[§5.2](#52--p0-서버-보완-요청--계좌-지급-현황-상세를-get-account-paymentsid-1회로)** (화면용 `SettlementFrontendResponse` embed, 상세 1회 조회).

---

### 7. 산출 내역서 UI 블록

| | |
|---|---|
| **UI** | `PaymentOrderProgramCalculationStatement` — 세션 블록·산정 라인·합계 수식 |
| **현재 API** | `GET /api/settlements/{id}` → `SettlementFrontendResponse` (`items`, `calculationResult` unknown) |
| **갭** | 12종 layout mock과 API flat items 불일치 |
| **갭 (항목 type)** | `items[].type` enum 미정의 — UI는 7종(강사비·교통비·숙박비·**식사비·활동비·원천징수**·기타) 필요 → [핸드오프 §3.5](./settlement-payment-order-detail-backend-handoff.md#35-산출-내역서--산정-항목-type-enum-확장-p1) |
| **갭 (산정 상세·차단)** | **`GET /settlements/{id}`**에 `lectureFeeStandardTitle`/`wageItemType`·`items[].calculationDetail` **없음** → 강사비 행 상세 보기 「준비 중」 → [핸드오프 §3.6](./settlement-payment-order-detail-backend-handoff.md#36--get-settlementssettlementid-필수-확장--강의비-책정-기준산정-기준-상세-p1차단) |
| **갭 (상세 UI)** | 강사 프로필·계좌 **미제공** (`gender`/`birthDate`/`phone`/`email`/`address`/계좌). 발급용 **`nameEn`** 도 상세 GET·unmask에 필요 → [UI 필드 SSOT §4.5](./settlement-payment-order-detail-ui-fields-backend-handoff.md#45--백엔드-요청-p0--강사-프로필계좌-현재-ui--) |
| **갭 (마스킹)** | **신청자명·성명 마스킹 금지 (P0)** — `instructorName`/`nameKo` plain. BE 사전 마스킹 시 복원 불가 → [UI SSOT §1.1](./settlement-payment-order-detail-ui-fields-backend-handoff.md#11--p0-서버-수정-요청--신청자명성명-등-사람-이름-마스킹-금지) |
| **갭 (발급·unmask)** | 산출 내역서 **화면 마스킹 해제 API 없음** · 발급 양식은 DTO 없으면 **공란**(목 샘플 제거됨) → [UI SSOT §1.2](./settlement-payment-order-detail-ui-fields-backend-handoff.md#12--p0-서버-요청--지급조서-발급원문--산출-내역서-unmask-api) |
| **프론트 임시 대응** | `settlement-item-type.ts` 코드→한글 매핑. `lectureFeeStandardTitle: '—'`·`basisDetail` 미매핑 |
| **제안** | **`GET /settlements/{id}` DTO 확장 (필수)** — §3.5 type enum + **§3.6** + **[UI 필드 SSOT §4](./settlement-payment-order-detail-ui-fields-backend-handoff.md#4-산출-내역서-모달-목록-상세-보기)** 산출 내역서 모달 |

---

### 8. export 미리보기 vs 비동기 export

| | |
|---|---|
| **UI mock** | Fortune Sheet 인-browser 미리보기 |
| **현재 API** | `POST .../exports/bulk-transfer`, `POST .../exports/tax-report` + `GET .../exports` 이력 |
| **갭** | 동기 시트 데이터 없음 — 파일 download URL 필요 |
| **제안** | export 생성 후 `downloadUrl` / polling status in `SettlementExportHistoryResponse` |

---

## P1 — 정산 항목 설정

### 9. 설정 CRUD·상세 저장

> **2026-08-27 갱신:** OpenAPI v9 (`settlement.openapi.json`) 기준. 상세 핸드오프·v2 시드: [settlement-item-settings-backend-seed-handoff-2026-08-27.md](./settlement-item-settings-backend-seed-handoff-2026-08-27.md)

| | |
|---|---|
| **UI** | 카드 삭제·복제·13건 v2 카탈로그 `layout` 상세 모달 저장 |
| **현재 API** | `GET/PUT/DELETE /api/admin/settlement-configs/current` + item duplicate/delete **OpenAPI 존재** |
| **프론트 임시 대응** | remote 시 **GET만** 연동; 편집·삭제·복제 **readOnly** |
| **BE 우선 작업** | v2 13건 seed + `paymentItemType` enum + `detailJson` layout 스키마 |

**OpenAPI v9 — 이미 있는 필드**

| 필드 | WageItem | PaymentItem | DeductionItem |
|------|----------|-------------|---------------|
| `layout` | O | O | O |
| `detailJson` (string) | O | O | O |
| `iconKey`, `emojiOverride` | O | O | O |
| `basisHours`, `maxLimitWon` | O (wage) | O (`maxLimitWon`) | — |
| `qualificationLines`, `remarkLines` | O (wage flat) | **없음** | **없음** |
| `rateItems[]` | O (gemini) | — | — |

**잔여 갭 (P0)**

| UI mock / FE 필요 | API v9 |
|-------------------|--------|
| `paymentItemType` (6종 enum) | **없음** — `itemName`만으로 강사/학생 구분 불가 |
| payment/deduction `qualificationLines`, `remarkLines` | flat 없음 → **detailJson 내부** 또는 DTO 확장 |
| 상세 모달 API 매핑 | FE 미구현 — mock `getSettlementItemSettingDetail` 사용 |
| v2 카탈로그 13건 DB seed | 구 v1 15건과 불일치 — [seed-v2.payload.json](./settlement-item-settings-seed-v2.payload.json) |
| `maxAmount` vs `maxLimitWon` (payment) | 둘 다 존재 — SSOT `maxLimitWon` 동기화 규칙 필요 |

**CRUD 가드 (OpenAPI 존재, FE 미연동)**

- `POST .../items/{itemKind}/{itemId}/duplicate` — payment만 200
- `DELETE .../items/{itemKind}/{itemId}` — payment만 200; wage/deduction → 409 기대

---

## P2 — 캘린더 (Phase 5, API는 존재)

### 10. 캘린더 API vs UI mock

**프론트 연동 (2026-06):** 지급조서 캘린더 → `GET /api/settlements/calendar`. 계좌 지급 캘린더 → `GET /api/account-payments` (이체 예정일).

**존재하는 API:**

| Method | Path |
|--------|------|
| GET | `/api/settlements/calendar?fromDate&toDate` |
| GET | `/api/settlements/calendar/dates/{date}` |
| GET | `/api/settlements/calendar/summary?year&month` |

**`SettlementCalendarItemResponse`:** `date`, `settlementId`, `programNameKo`, `instructorName`, `statementStatus`, `paymentStatus`, `expectedAmount`, `completedAmount`

**UI mock 추가 필드:** `calendarSlotStartTime`, `calendarSlotEndTime`, `calendarWeekGridLabel`, 프로그램/강사 **집계 행** 기반 이벤트

**잔여 갭:** calendar 응답에 `slotStartTime`, `slotEndTime` 없음 — 월간 뷰만 사용 중이라 회귀 낮음. 프로그램별 캘린더는 프론트 `(programId, date)` 집계.

---

## P2 — 공통 상태 매핑

### 11. UI 8종 vs API statement/payment status

| API `statementStatus` | UI `PaymentOrderAdminProcessingStatus` |
|-----------------------|----------------------------------------|
| `REQUESTED` | `pending` |
| `CONFIRMED` | `confirmed` |
| `CORRECTION_REQUESTED` | `correction` |
| `REJECTED` | `application_rejected` |

| API `paymentStatus` | UI `AccountPaymentTransferStatus` |
|---------------------|-----------------------------------|
| `REQUESTED` | `awaiting_confirmation` |
| `CONFIRMED` | `partial_confirmation` |
| `PAID` | `account_paid` |
| `CORRECTION_REQUESTED` | `payment_correction_requested` |

**요청:** 백엔드 enum 전체 목록·전이 다이어그램 공유 ( `@/shared/constants/instructor-settlement-status` 8종과 1:1 여부 확인)

### 12. 지급조서 신청 반려 (statement reject)

| | |
|---|---|
| **UI** | 산출 내역서 모달 「신청 반려」 |
| **현재 API** | `PATCH .../statements/{id}/confirm` only — **reject 없음** |
| **프론트 임시 대응** | remote 시 반려 버튼 **비활성** + 안내 |
| **제안** | `PATCH /api/settlements/statements/{statementId}/reject` + `{ reason }` |

---

## 스테이징 점검 체크리스트 (백엔드)

- [ ] `SETTLEMENT_READ` / `SETTLEMENT_WRITE` 권한으로 3화면 API 호출
- [ ] settlements 목록 seed 데이터로 집계 결과 sanity check
- [ ] `confirm` 후 statements·settlements 상태 일치
- [ ] `markPaid` 후 account-payments 목록 갱신
- [ ] 지급조서 미확인 건 `markPaid`/`bulk-paid` 409 — `message`가 「지급조서 확인 완료 후 …」 형태 (코드 `PAYMENT_STATEMENT_STATUS_CONFLICT` 유지)
- [ ] 계좌 지급 현황 상세 — `GET /account-payments/{id}` 1회만으로 산출·산정 기준 표시 (`GET /settlements/{id}` 불필요, §5.2)
- [ ] export API 감사로그 fail-closed 정책 (403/409 케이스)
- [ ] `settlement-configs/current` wage/payment/deduction items UI 매핑 가능 여부

---

## 문의

프론트 담당: CMS `features/settlement-management/`  
연동 명세: [settlement-api-integration.md](./settlement-api-integration.md)
