# 정산 관리 API — 백엔드 핸드오프 (갭·스펙 불일치)

> **CMS 강사 회원 상세 → 정산 현황** 탭 API 보완은 **[강사 상세 통합 SSOT](./members/instructor-member-detail-program-history-settlement-backend-handoff-2026-08-25.md)** (SET-001~009)를 우선 참고하세요. 본 문서는 **정산 관리 LNB** 3화면 전체 갭입니다.

프론트 CMS 정산 관리 LNB 3화면 API 연동 후 확인된 **미존재 API·구조 불일치** 목록입니다.  
OpenAPI 기준: `openapi/backend.openapi.json` (v9, 351 paths — 2026-06-12 동기화)

---

## 우선순위 요약

| 우선순위 | 건수 | 대표 항목 |
|----------|------|-----------|
| P0 | 6 | **사람 이름 마스킹 금지**, **지급조서 발급 원문 + 산출 내역서 unmask**, 강사 프로필·계좌 embed, 집계 목록, 일괄 confirm, 목록 필터 |
| P1 | 5 | 산출 내역서 DTO, 연간 예산, bulk paid, account 상세 GET, config CRUD |
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
| **요청** | `POST /api/admin/settlements/{settlementId}/privacy/unmask` `{ reason }` → `SettlementFrontendResponse` **전 PII 원문**. 발급 양식에 마스킹 문자열 기입 금지 |
| **원문 필드** | phone, email, address, bankName, accountNumber, accountHolder, gender, birthDate, 주민등록번호(발급) |
| **SSOT** | [UI 필드 SSOT §1.2](./settlement-payment-order-detail-ui-fields-backend-handoff.md#12--p0-서버-요청--지급조서-발급원문--산출-내역서-unmask-api) · [핸드오프 §3.8](./settlement-payment-order-detail-backend-handoff.md#38-지급조서-발급원문--산출-내역서-unmask-api-p0) |
| **SET-006과 구분** | bulk ZIP은 **파일 묶음**. PDF **내용**의 원문 PII는 본 항목 (SET-009) |

---

## P0 — 지급 현황 상세 (기본 정보 · 정산 목록 전 열)

| | |
|---|---|
| **화면** | 지급조서 확인 → 행 클릭 → **지급 현황 상세** 풀페이지 |
| **요구** | **기본 정보** + **신청자별/프로그램별 정산 목록** 테이블 **모든 열** 값을 서버에서 제공 |
| **상세 SSOT** | [settlement-payment-order-detail-ui-fields-backend-handoff.md](./settlement-payment-order-detail-ui-fields-backend-handoff.md) |
| **프론트 임시** | 강사 프로필·계좌 `-` — **[UI SSOT §4.5 P0 요청](./settlement-payment-order-detail-ui-fields-backend-handoff.md#45--백엔드-요청-p0--강사-프로필계좌-현재-ui--)** (`gender`, `birthDate`, `phone`, `email`, `address`, 계좌 3종) |
| **산출 내역서 모달** | 강의비·회차·기관명 매핑됨. **강사 PII는 동일 §4.5** |
| **제안** | **`GET /settlements/{id}` + `instructorHeader`에 강사 프로필·계좌 8필드 embed** — [UI SSOT §4.5](./settlement-payment-order-detail-ui-fields-backend-handoff.md#45--백엔드-요청-p0--강사-프로필계좌-현재-ui--) |

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
| **statements** | **임시** — `GET /statements` 전량 fetch 후 settlementId join. **요청:** settlements DTO에 `statementId` embed → [§4 핸드오프](./settlement-payment-order-detail-backend-handoff.md#4-백엔드-수정-요청--get-settlements-목록에-statementid-포함-권장p1) |
| **상세 핸드오프** | [settlement-payment-order-detail-backend-handoff.md](./settlement-payment-order-detail-backend-handoff.md) · [UI 필드 SSOT](./settlement-payment-order-detail-ui-fields-backend-handoff.md) |

### P1 — `SettlementListItemResponse.statementId` *(권장)*

| | |
|---|---|
| **갭** | 라인 DTO에 `statementStatus`만 있고 **`statementId` 없음** → 상세 진입 시 `GET /statements` 2차 호출 |
| **제안** | `GET /api/admin/settlements` 응답 item에 `statementId?: number` 추가 (신규 endpoint 불필요) |
| **수용 후** | 프론트 statements join 제거 — [핸드오프 §4](./settlement-payment-order-detail-backend-handoff.md#4-백엔드-수정-요청--get-settlements-목록에-statementid-포함-권장p1) |

---

## P0 — 지급조서 확인

### 1. 프로그램별·강사별 집계 목록

| | |
|---|---|
| **화면** | `/settlement-management/payment-orders` (리스트 뷰) |
| **UI 요구** | `PaymentOrderAdminProgramRow` / `PaymentOrderAdminInstructorRow` — 프로그램명·강사명·참여 수·지급 대기 건수·정산 예정금 **집계 행** |
| **현재 API** | `GET /api/settlements` → `SettlementListItemResponse[]` (정산 **라인** 단위) |
| **갭 유형** | 구조 불일치 |
| **프론트 임시 대응** | 전체 settlements fetch 후 `programId` / `instructorMemberId`로 **클라이언트 집계** |
| **제안** | `GET /api/settlements/aggregates?groupBy=program\|instructor` 또는 동일 필터를 지원하는 집계 endpoint |

**UI 필드 ↔ API (라인 기준)**

| UI (집계 행) | API (라인) | 비고 |
|--------------|------------|------|
| `programName` | `programNameKo` | 집계 키: `programId` |
| `instructorCount` | `instructorMemberId` distinct count | 클라이언트 계산 |
| `pendingPaymentSettlementItemCount` | `statementStatus === REQUESTED` count | API pending 정의 합의 필요 |
| `estimatedAmount` | `sum(netPaymentAmount)` | |
| `settlementRelevantAttendanceDates` | `lectureDate[]` | |

---

### 2. 지급조서 일괄 확인 + 이체 예정일

| | |
|---|---|
| **화면** | 지급 현황 상세 → 「일괄 확인」 모달 |
| **UI 요구** | 선택 라인 일괄 확인 + **강의비 지급 예정일** (`lectureFeePaymentScheduledDate`) |
| **현재 API** | `PATCH /api/settlements/statements/{statementId}/confirm` — **단건**, body: `{ reason? }` only |
| **갭 유형** | bulk API 없음, 예정일 필드 없음 |
| **프론트 임시 대응** | `statementId` 순차 PATCH |
| **제안** | `POST /api/settlements/statements/bulk-confirm` + `{ statementIds[], scheduledPaymentDate?, reason? }` |

---

### 3. 목록·상세 서버 필터

| | |
|---|---|
| **UI 필터** | 프로그램명·강사명 검색, 출강일 기간, 지급 대기 버킷(0 / 1~5 / 6~10 / 11+) |
| **현재 API query** | `programId`, `instructorMemberId`, `statementStatus`, `paymentStatus`, `page`, `size` |
| **갭 유형** | 필터 부족 |
| **프론트 임시 대응** | 클라이언트 필터 |
| **제안** | `search`, `fromDate`, `toDate`, `pendingItemBucket` 또는 집계 API와 함께 제공 |

---

## P0 — 계좌 지급 확인

### 4. 연간 예산 요약 카드

| | |
|---|---|
| **화면** | `/settlement-management/account-payments` 상단 「{연도}년 예산 총액」 |
| **UI mock** | `MOCK_ACCOUNT_PAYMENT_ANNUAL_BUDGET` |
| **현재 API** | **없음** |
| **프론트 임시 대응** | remote 시 `—` 표시 |
| **제안** | `GET /api/settlements/budget-summary?year=` |

---

### 5. 일괄 지급 완료

| | |
|---|---|
| **UI** | 목록 다중 선택 → 「계좌 지급 완료」 |
| **현재 API** | `PATCH /api/account-payments/{paymentId}/paid` **단건만** |
| **제안** | `PATCH /api/account-payments/bulk-paid` `{ paymentIds[], reason? }` |

---

## P1 — 상세·export

### 6. account-payments 단건 상세 GET

| | |
|---|---|
| **UI** | 계좌 지급 현황 풀페이지 상세 (개인정보·산출 블록) |
| **현재 API** | `GET /api/account-payments` (목록) + `settlementId`만 제공 |
| **제안** | `GET /api/account-payments/{paymentId}` 또는 settlement embed DTO |

---

### 7. 산출 내역서 UI 블록

| | |
|---|---|
| **UI** | `PaymentOrderProgramCalculationStatement` — 세션 블록·산정 라인·합계 수식 |
| **현재 API** | `GET /api/settlements/{id}` → `SettlementFrontendResponse` (`items`, `calculationResult` unknown) |
| **갭** | 12종 layout mock과 API flat items 불일치 |
| **갭 (항목 type)** | `items[].type` enum 미정의 — UI는 7종(강사비·교통비·숙박비·**식사비·활동비·원천징수**·기타) 필요 → [핸드오프 §3.5](./settlement-payment-order-detail-backend-handoff.md#35-산출-내역서--산정-항목-type-enum-확장-p1) |
| **갭 (산정 상세·차단)** | **`GET /settlements/{id}`**에 `lectureFeeStandardTitle`/`wageItemType`·`items[].calculationDetail` **없음** → 강사비 행 상세 보기 「준비 중」 → [핸드오프 §3.6](./settlement-payment-order-detail-backend-handoff.md#36--get-settlementssettlementid-필수-확장--강의비-책정-기준산정-기준-상세-p1차단) |
| **갭 (상세 UI)** | 강사 프로필·계좌 **미제공** (`gender`/`birthDate`/`phone`/`email`/`address`/계좌) → [UI 필드 SSOT §4.5](./settlement-payment-order-detail-ui-fields-backend-handoff.md#45--백엔드-요청-p0--강사-프로필계좌-현재-ui--) |
| **갭 (마스킹)** | **신청자명·성명 마스킹 금지 (P0)** — `instructorName`/`nameKo` plain. BE 사전 마스킹 시 복원 불가 → [UI SSOT §1.1](./settlement-payment-order-detail-ui-fields-backend-handoff.md#11--p0-서버-수정-요청--신청자명성명-등-사람-이름-마스킹-금지) |
| **갭 (발급·unmask)** | 산출 내역서 **화면 마스킹 해제 API 없음** · 지급조서 발급이 마스킹 값을 바인딩 → [UI SSOT §1.2](./settlement-payment-order-detail-ui-fields-backend-handoff.md#12--p0-서버-요청--지급조서-발급원문--산출-내역서-unmask-api) |
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

| | |
|---|---|
| **UI** | 카드 삭제·복제·12종 `layout` 상세 모달 저장 |
| **현재 API** | `GET /api/settlement-configs/current` **only** |
| **프론트 임시 대응** | remote 시 조회만, 편집·삭제·복제 **비활성** |
| **제안** | `PUT/PATCH /api/settlement-configs/current` + item detail schema (layout별 필드) |

**Config item 필드 갭**

| UI mock | API |
|---------|-----|
| `iconKey`, `emojiOverride` | 없음 |
| `layout` (tier1, transport, …) | 없음 |
| `basisHours`, `maxLimitWon`, `qualificationLines` | `WageItemResponse.amount`, `PaymentItemResponse.maxAmount` 등 flat |

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
- [ ] export API 감사로그 fail-closed 정책 (403/409 케이스)
- [ ] `settlement-configs/current` wage/payment/deduction items UI 매핑 가능 여부

---

## 문의

프론트 담당: CMS `features/settlement-management/`  
연동 명세: [settlement-api-integration.md](./settlement-api-integration.md)
