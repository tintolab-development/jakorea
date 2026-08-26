# 지급 현황 상세 — UI 필드 SSOT (백엔드 핸드오프)

**화면:** 정산 관리 > 지급조서 확인 > 행 클릭 → **지급 현황 상세** 풀페이지 · 목록 **「산출 내역 > 상세 보기」** → **산출 내역서** 모달  
**범위:** 풀페이지 **기본 정보** + **정산 목록** + **산출 내역서 모달** 본문 전 필드  
**프론트:** `use-payment-order-detail-fullpage-modal.ts`, `use-payment-order-detail-lines.tsx`, `map-settlement-detail.ts`, `map-settlement-detail-to-calculation-statement.ts`, `payment-order-calculation-statement-modal-impl.tsx`  
**연관:** [settlement-payment-order-detail-backend-handoff.md](./settlement-payment-order-detail-backend-handoff.md) (API 흐름·statementId) · [settlement-api-backend-gaps.md](./settlement-api-backend-gaps.md)

> **회원 상세 BE 전달:** 본 문서는 [members/README.md §필수 묶음](./members/README.md#회원-상세-이력정산--백엔드-전달-필수-묶음) **#6** 으로 포함됩니다. 강사 회원 상세 정산 **SET-005** — **§4 산출 내역서 모달** SSOT. (정산 관리 LNB 지급 현황 상세와 동일 필드 계약.)

**Last updated:** 2026-08-26

> **작성 기준:** **실제 화면 라벨·테이블 컬럼**만 포함. mock 타입·다른 화면 필드는 제외.  
> 근거: `payment-order-*-basic-info.tsx`, `use-payment-order-detail-lines.tsx`, `payment-order-calculation-statement-*-basic-section.tsx`, `payment-order-calculation-breakdown-table.tsx`.

---

## 1. 백엔드 전달 핵심

지급 현황 상세에 표시되는 **모든 값**은 **서버 응답 DTO**에서 내려와야 합니다.

프론트가 mock·집계·fallback으로 **대체·추론·`-` 표시하면 안 되는** 항목입니다.

| 금지 | 올바른 API 소스 | FE (2026-08-26) |
|------|-----------------|-----------------|
| 정산 라인 **건수** → 프로그램 진행 회차 (`5 / 5`) | `sessionCompleted` / `sessionTotal` | ✅ 목록 DTO |
| `scheduleId`(PK) → `N차시` | `sessionOrdinal` | ✅ |
| `lectureDate` min/max → 사업 운영 기간 | `businessPeriodStart/End` | ✅ |
| `institutionName: '-'` | `SettlementListItemResponse.institutionName` | ✅ |
| 강사 프로필·계좌 `-` | `instructorHeader` 또는 members API | ❌ DTO 미제공 |
| 산출 내역서 `'—'`·「준비 중」 | **`GET /settlements/{settlementId}`** 전 필드 | ✅ 매핑 (PII·typed `calculationDetail` 없으면 「준비 중」) |

**주 API (풀페이지 목록):** `GET /api/admin/settlements?programId=` · `GET /api/admin/settlements?instructorMemberId=`  
**주 API (산출 내역서 모달):** `GET /api/admin/settlements/{settlementId}` — 라인 `settlementId`로 **모달 오픈 시 1건 조회**  
**표기 규칙**

- 교육 진행 일자 열: `{lectureDate(요일)}` \| `{sessionOrdinal}차시` — [`PaymentOrderLectureDateSessionCell`](../../src/features/settlement/ui/payment-record/payment-order-lecture-date-session-cell.tsx)
- 프로그램 진행 회차: `{sessionCompleted} / {sessionTotal}` (예: `4 / 16`) — **프로그램 커리큘럼 기준**, 정산 라인 수와 무관

---

## 2. 프로그램 기준 상세 (`po_detail_type=program`)

목록 **프로그램별** 집계 행 클릭.

### 2.1 기본 정보

| UI 라벨 | UI 필드 | 표시 예 | API 필드 (제안) | 필수 | 현재 |
|---------|---------|---------|-----------------|------|------|
| 프로그램명 | `programName` | JA 경제교실 | `programNameKo` (헤더) | ✅ | 집계 목록에서 전달 |
| 사업 운영 기간 | `businessPeriodStart` ~ `End` | `2025. 12. 08(월) ~ …` | `businessPeriodStart`, `businessPeriodEnd` | ✅ | ✅ 목록 DTO (없으면 lectureDate min/max) |
| 프로그램 진행 회차 | `sessionCompleted` / `sessionTotal` | `4 / 16` | 동일 또는 `programSessionProgressDisplay` | ✅ | ✅ 목록 DTO |
| 지급 조서 처리 현황 | 집계 배지 | 확인 완료 등 | 라인 `statementStatus` 집계 또는 헤더 | ✅ | FE 라인 집계 |

### 2.2 신청자별 정산 목록

| UI 컬럼 | UI 필드 | API (`SettlementListItemResponse`) | 필수 | 현재 |
|---------|---------|-------------------------------------|------|------|
| No. | `no` | (클라이언트 순번) | — | ✅ |
| **신청자명** | `instructorName` | `instructorName` (plain) | ✅ | ✅ |
| **참여 기관명** | `institutionName` | `institutionName` / `schoolName` | ✅ | ✅ |
| **교육 진행 일자** | `lectureDate` + `sessionOrdinal` | `lectureDate`, `sessionOrdinal` | ✅ | ✅ (`scheduleId` 미사용) |
| 지급조서 처리 현황 | `processingStatus` | `statementStatus` | ✅ | ✅ |
| 정산 신청 금액 | `estimatedAmount` | `netPaymentAmount` | ✅ | ✅ |
| 산출 내역 | — | `settlementId` | ✅ | ✅ |

「교육 진행 일자」열은 `{날짜(요일)} | {N}차시` 한 셀 — 차시는 **별도 컬럼 아님**.

**비표시(액션용) 필드:** `statementId`(지급조서 확인), `expectedTransferDate`(확인 후 이체 예정일) — 테이블 열 아님.

**목록 필터(서버 권장):** 신청자명·참여 기관명 검색, `statementStatus`, `lectureDate` 기간.

---

## 3. 강사 기준 상세 (`po_detail_type=instructor`)

목록 **신청자(강사)별** 집계 행 클릭.

### 3.1 기본 정보

[`payment-order-instructor-basic-info.tsx`](../../src/pages/settlement-management/payment-order-instructor-basic-info.tsx) 기준.

| UI 라벨 | UI 필드 | API (제안) | 필수 | 현재 |
|---------|---------|------------|------|------|
| 한글 (성명) | `nameKo` | `nameKo` / `instructorName` | ✅ plain | ❌ `-` |
| 연락처 | `phone` | `phone` | ✅ → FE 마스킹 | ❌ `-` |
| 이메일 | `email` | `email` | ✅ → FE 마스킹 | ❌ `-` |
| 자택 주소 | `address` | `address` | ✅ → FE 블러 | ❌ `-` |
| 정산 계좌 정보 | `bankName`, `accountNumber`, `accountHolder` | 동일 (분리 필드) | ✅ 은행명 plain | ❌ `-` |
| 지급 조서 처리 현황 | 집계 배지 | 라인 집계 / embed | ✅ | FE 집계 |
| 총 정산 예정 금액 | `totalEstimatedAmount` | embed 또는 `sum(netPaymentAmount)` | ✅ | 집계 목록 값 |

> **영문 성명·성별/생년월일은 풀페이지 기본 정보 UI에 없음** — 산출 내역서 모달(§4.2)과 구분.

마스킹: [상세 핸드오프 §3.7](./settlement-payment-order-detail-backend-handoff.md#37-개인정보-마스킹-정책-지급-현황--산출-내역서)

### 3.2 프로그램별 정산 목록

| UI 컬럼 | UI 필드 | API | 필수 | 현재 |
|---------|---------|-----|------|------|
| No. | `no` | (클라이언트) | — | ✅ |
| **프로그램명** | `programName` | `programNameKo` | ✅ | ✅ |
| **참여 기관명** | `institutionName` | `institutionName` | ✅ | ✅ |
| **교육 진행 일자** | `lectureDate` + `sessionOrdinal` | `lectureDate`, `sessionOrdinal` | ✅ | ✅ (`scheduleId` 미사용) |
| 지급조서 처리 현황 | `processingStatus` | `statementStatus` | ✅ | ✅ |
| 정산 신청 금액 | `estimatedAmount` | `netPaymentAmount` | ✅ | ✅ |
| 산출 내역 | — | `settlementId` | ✅ | ✅ |

---

## 4. 산출 내역서 모달 (목록 「상세 보기」)

**트리거:** 정산 목록 행 **「산출 내역 > 상세 보기」** → `PaymentOrderCalculationStatementModalImpl` (`title: 산출 내역서`)  
**Remote:** `useSettlementDetailQuery(settlementId)` → `GET /api/admin/settlements/{settlementId}` → `map-settlement-detail-to-calculation-statement.ts`

진입 경로에 따라 **기본 정보 블록 UI가 다름** (`entryKind`):

| 풀페이지 진입 | `entryKind` | 기본 정보 컴포넌트 |
|---------------|-------------|-------------------|
| **프로그램** 상세 → 신청자별 목록 | `instructor` | [`payment-order-calculation-statement-instructor-basic-section.tsx`](../../src/features/settlement/ui/payment-record/payment-order-calculation-statement-instructor-basic-section.tsx) |
| **강사** 상세 → 프로그램별 목록 | `program` | [`payment-order-calculation-statement-program-basic-section.tsx`](../../src/features/settlement/ui/payment-record/payment-order-calculation-statement-program-basic-section.tsx) |

### 4.1 기본 정보 — 프로그램 맥락 (`entryKind=program`)

강사 상세에서 프로그램 라인 「상세 보기」 시.

| UI 라벨 | API (`SettlementFrontendResponse` 등) | 필수 | Remote 현재 |
|---------|----------------------------------------|------|-------------|
| 프로그램명 | `programNameKo` embed 또는 목록 `programNameKo` | ✅ | ✅ (목록) |
| 프로그램 진행 회차 | `sessionCompleted`/`sessionTotal` 또는 `programSessionProgressDisplay` | ✅ | ✅ |
| 사업 운영 기간 | `period` 또는 `businessPeriodStart`/`End` | ✅ | ✅ |
| 지급조서 처리 현황 | `statementStatus` (+ 반려 시 `correctionReason` 등) | ✅ | △ 목록 라인 |
| 강의비 책정 기준 | `lectureFeeStandardTitle` + `lectureFeeStandardAmount` | ✅ | ✅ |
| 사업소득자 여부 | `businessIncomeEarnerLabel` 또는 boolean embed | ✅ | ✅ (없으면 `'해당 없음'`) |

**지급조서 처리 현황 부가 표기 (상태별):**

| 상태 | UI |
|------|-----|
| `application_rejected` | `신청 반려` \| `사유 : {processingRejectionReason}` |
| `confirmed` | `{상태 문구}` \| `이체 예정일 : {lectureFeePaymentScheduledDateDisplay}` |
| 그 외 | `{statementStatus → UI 라벨}` |

### 4.2 기본 정보 — 신청자(강사) 맥락 (`entryKind=instructor`)

프로그램 상세에서 신청자 라인 「상세 보기」 시.

| UI 라벨 | API | 필수 | Remote 현재 |
|---------|-----|------|-------------|
| 성명 | `instructorName` / `nameKo` (plain) | ✅ | △ 목록 이름만 |
| 성별 및 생년월일 | `gender`, `birthDate` → FE 포맷 | ✅ | ❌ `'-'` |
| 연락처 | `phone` | ✅ → FE 마스킹 | ❌ `-` |
| 이메일 | `email` | ✅ → FE 마스킹 | ❌ `-` |
| 자택 주소지 | `address` | ✅ → FE 블러 | ❌ `-` |
| 정산 계좌 정보 | `bankName`, `accountNumber`, `accountHolder` | ✅ | ❌ `-` |
| 지급조서 처리 현황 | §4.1과 동일 | ✅ | △ |
| 강의비 책정 기준 | §4.1과 동일 | ✅ | ✅ |
| 사업소득자 여부 | §4.1과 동일 | ✅ | ✅ |

성명 옆 **일정 변경&취소** 배지: `scheduleChangeCancelCount` ≥ 1 (선택).

> **영문 성명 UI 없음** — `nameEn` BE 요청 대상 아님.

### 4.3 산출 내역 테이블

[`payment-order-calculation-breakdown-table.tsx`](../../src/features/settlement/ui/payment-record/payment-order-calculation-breakdown-table.tsx) — `blocks[]` 1블록 = 기관·일자·회차 + `lines[]`.

| UI 컬럼 | API 소스 | 필수 | Remote 현재 |
|---------|----------|------|-------------|
| 참여 기관명 | `institutionName` (루트 또는 블록) | ✅ | ✅ |
| 강의 진행 일자 | `lectureDate` → 요일 포맷 | ✅ | ✅ 목록 `lectureDate` |
| 강의 구간 | `lectureSessionDisplay` 또는 `sessionOrdinal` | ✅ | ✅ |
| 산정 항목 | `items[].type` → UI 라벨 | ✅ | ✅ (코드 매핑) |
| 항목 설명 | `items[].description` | ✅ | ✅ |
| 정산 금액 | `items[].amount` | ✅ | ✅ |
| 산정 기준 상세 | `items[].calculationDetail` | ✅ (해당 항목) | ✅ `basisJson` typed payload / 없으면 「준비 중」 |
| 합계 | `totalAmount` | ✅ | ✅ |

**강의 구간 표기:** 프로그램 상세 진입(`entryKind=instructor`) 시 UI는 **「회차」** (`2 ~ 3회차`). 강사 상세 진입 시 **「차시」**.

### 4.4 `GET /settlements/{settlementId}` 필수 필드 (산출 내역서 SSOT)

상세: [핸드오프 §3.6](./settlement-payment-order-detail-backend-handoff.md#36--get-settlementssettlementid-필수-확장--강의비-책정-기준산정-기준-상세-p1차단). 본 화면 기준 **필수 요약**:

| 구분 | 필드 |
|------|------|
| **루트** | `totalAmount`, `period`, `programNameKo`, `programSessionProgressDisplay`(또는 sessionCompleted/Total), `lectureFeeStandardTitle`, `lectureFeeStandardAmount`, `wageItemType`(택1), `institutionName`, `lectureSessionDisplay`, `businessIncomeEarnerLabel`, 강사 embed(`nameKo`, `gender`, `birthDate`, `phone`, `email`, `address`, 계좌 3종) |
| **`items[]`** | `type`, `description`, `amount`, **`calculationDetail`** (산정 기준 상세 모달) |
| **상태** | `statementStatus`, `expectedTransferDate`, `correctionReason`(반려 사유) |

#### 응답 예시 (요약)

```json
{
  "settlementId": 1001,
  "programNameKo": "JA 경제교실",
  "period": "2025. 12. 08(월) ~ 2026. 12. 30(수)",
  "programSessionProgressDisplay": "4 / 16",
  "lectureFeeStandardTitle": "2급 강사비",
  "lectureFeeStandardAmount": 915000,
  "businessIncomeEarnerLabel": "해당 없음",
  "institutionName": "○○초등학교",
  "lectureSessionDisplay": "2 ~ 3차시",
  "instructorName": "홍길동",
  "gender": "M",
  "birthDate": "1990-01-15",
  "phone": "01012345678",
  "email": "user@example.com",
  "address": "서울특별시 …",
  "bankName": "국민은행",
  "accountNumber": "1234567890",
  "accountHolder": "홍길동",
  "statementStatus": "REQUESTED",
  "items": [
    {
      "type": "instructor_fee",
      "description": "강사비 (2차시)",
      "amount": 915000,
      "calculationDetail": { "layout": "lectureFeeTier", "tier": "2", "totalWon": 915000 }
    }
  ],
  "totalAmount": 915000
}
```

### 4.5 Remote 잔여 (DTO 미제공)

강사 PII는 `SettlementFrontendResponse`에 **아직 없음** — `instructorIdentityFromLine` placeholder 유지.

| 항목 | 현재 |
|------|------|
| `genderBirthDisplay` | `'-'` |
| 강사 연락처·주소·계좌 | 전부 `'-'` |

---

## 5. `SettlementListItemResponse` 필수 확장

**대상:** `GET /api/admin/settlements` (상세 scoped query)

| 필드 | 타입 | UI | 필수 | 비고 |
|------|------|-----|------|------|
| `settlementId` | `number` | 키·산출 내역 | ✅ | 기존 |
| `statementId` | `number` | confirm·bulk | ✅ | [핸드오프 §4](./settlement-payment-order-detail-backend-handoff.md#4-백엔드-수정-요청--get-settlements-목록에-statementid-포함-권장p1) |
| `programId` | `number` | 스코프 | ✅ | 기존 |
| `programNameKo` | `string` | 강사 상세 목록 | ✅ | 기존 |
| `instructorMemberId` | `number` | 스코프 | ✅ | 기존 |
| `instructorName` | `string` | 신청자명 | ✅ | plain |
| **`institutionName`** | `string` | 참여 기관명 | ✅ | **신규** — assignment/schedule join |
| `lectureDate` | `string` | 교육 진행 일자 | ✅ | 기존 |
| **`sessionOrdinal`** | `number` | `N차시` | ✅ | **신규** — `scheduleId`와 별도 |
| `lectureSessionDisplay` | `string` | 산출 내역서 보조 | 권장 | 예: `2 ~ 3차시` |
| `scheduleId` | `number` | join 키 | 선택 | **UI 차시로 사용 금지** |
| `statementStatus` | enum | 처리 현황 | ✅ | 기존 |
| `netPaymentAmount` | `number` | 정산 신청 금액 | ✅ | 기존 |
| `expectedTransferDate` | `string` | 이체 예정일 | 선택 | 기존 |

### 라인 응답 예시

```json
{
  "settlementId": 1001,
  "statementId": 501,
  "programId": 42,
  "programNameKo": "JA 경제교실",
  "instructorMemberId": 9001,
  "instructorName": "홍길동",
  "institutionName": "○○초등학교",
  "lectureDate": "2026-08-15",
  "sessionOrdinal": 3,
  "scheduleId": 88001,
  "statementStatus": "REQUESTED",
  "netPaymentAmount": 915000
}
```

---

## 6. 프로그램·강사 헤더 embed (풀페이지 기본 정보)

라인 API만으로 헤더를 채울 수 없으면 **wrapper DTO**에 embed합니다.

### 6.1 `programHeader` (`GET /settlements?programId=`)

| 필드 | 타입 | UI |
|------|------|-----|
| `programId` | `number` | — |
| `programNameKo` | `string` | 프로그램명 |
| `businessPeriodStart` | date | 사업 운영 기간 시작 |
| `businessPeriodEnd` | date | 사업 운영 기간 종료 |
| `sessionCompleted` | `number` | 진행 회차 (분자) |
| `sessionTotal` | `number` | 총 회차 (분모) |

**출처:** programs / programProgress / 스케줄(커리큘럼).

### 6.2 `instructorHeader` (`GET /settlements?instructorMemberId=`)

| 필드 | UI 라벨 |
|------|---------|
| `nameKo` | 한글 (성명) |
| `phone` | 연락처 |
| `email` | 이메일 |
| `address` | 자택 주소 |
| `bankName`, `accountNumber`, `accountHolder` | 정산 계좌 정보 |
| `totalEstimatedAmount` | 총 정산 예정 금액 |

`nameEn` **미포함** — 본 화면 UI 없음.

**대안:** `GET /api/admin/members/{instructorMemberId}` 조합 — [상세 핸드오프 §3.3](./settlement-payment-order-detail-backend-handoff.md#33-상세-기본정보-강사-블록)

### 6.3 wrapper 예시

```json
{
  "programHeader": {
    "programId": 42,
    "programNameKo": "JA 경제교실",
    "businessPeriodStart": "2025-12-08",
    "businessPeriodEnd": "2026-12-30",
    "sessionCompleted": 4,
    "sessionTotal": 16
  },
  "items": []
}
```

---

## 7. 프론트 매핑 상태 (2026-08-26)

`map-settlement-detail.ts` · `map-settlement-detail-to-calculation-statement.ts`:

| 항목 | 매핑 |
|------|------|
| 참여 기관명 | `item.institutionName` |
| 차시 | `item.sessionOrdinal` (`scheduleId` 미사용) |
| 진행 회차 | 목록 `sessionCompleted`/`sessionTotal` (라인 건수 미사용) |
| 사업 운영 기간 | 목록 `businessPeriodStart`/`End` |
| 강사 프로필 (풀페이지) | **잔여** `'-'` — DTO에 `instructorHeader` 없음 |
| 산출 내역서 필드 | `GET /settlements/{id}` 매핑 완료 (강사 PII 제외) |

---

## 8. 수용 기준 (Acceptance)

**풀페이지**

- [ ] 프로그램 기본 정보 **진행 회차** — 총 회차 ≠ 정산 라인 수
- [ ] **사업 운영 기간** — 프로그램 운영 일정과 일치
- [ ] 목록 **참여 기관명** — 전 행 `-` 없음
- [ ] 목록 **교육 진행 일자 + N차시** — `sessionOrdinal` ≠ `scheduleId`

**산출 내역서 모달**

- [ ] `GET /settlements/{id}` 1회로 기본 정보·테이블·합계 채움 — `'—'`·「준비 중」 없음
- [ ] **강의비 책정 기준**·**프로그램 진행 회차**·**참여 기관명** API 값 표시
- [ ] 강사 맥락 — 성명(plain)·성별/생년·연락처·주소·계좌 API 원문 (마스킹은 FE)
- [ ] **산정 기준 상세 > 상세 보기** — `calculationDetail`로 모달 동작

- [ ] OpenAPI·Orval 재생성 후 placeholder 제거

---

## 9. 우선순위

| 우선순위 | 항목 |
|----------|------|
| **P0** | §5 — 목록 `institutionName`, `sessionOrdinal`, `statementId` |
| **P0** | §6 — `programHeader` / `instructorHeader` |
| **P0** | §4 — **`GET /settlements/{id}`** 산출 내역서 전 필드 |
| P1 | [핸드오프 §3.6](./settlement-payment-order-detail-backend-handoff.md#36--get-settlementssettlementid-필수-확장--강의비-책정-기준산정-기준-상세-p1차단) OpenAPI 상세 |

---

## 10. 문의

프론트: `features/settlement-management/api/payment-orders/map-settlement-detail.ts`, `map-settlement-detail-to-calculation-statement.ts`
