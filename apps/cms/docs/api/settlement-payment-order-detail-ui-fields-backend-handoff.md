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
| **신청자명·성명 `홍*동`** | `instructorName` / `nameKo` **plain** | ❌ **서버 수정 요청 (P0)** — [§1.1](#11--p0-서버-수정-요청--신청자명성명-등-사람-이름-마스킹-금지) |
| **지급조서 발급에 마스킹된 PII** | unmask 원문 → 발급 양식 | ❌ **서버 요청 (P0)** — [§1.2](#12--p0-서버-요청--지급조서-발급원문--산출-내역서-unmask-api) |
| 강사 프로필·계좌 `-` | `instructorHeader` + `GET /settlements/{id}` 루트 embed | ❌ **서버 요청 (P0)** — [§4.5](#45--백엔드-요청-p0--강사-프로필계좌-현재-ui--) |
| 산출 내역서 `'—'`·「준비 중」 | **`GET /settlements/{settlementId}`** 전 필드 | ✅ 매핑 (PII·typed `calculationDetail` 없으면 「준비 중」) |

**주 API (풀페이지 목록):** `GET /api/admin/settlements?programId=` · `GET /api/admin/settlements?instructorMemberId=`  
**주 API (산출 내역서 모달):** `GET /api/admin/settlements/{settlementId}` — 라인 `settlementId`로 **모달 오픈 시 1건 조회**  
**표기 규칙**

- 교육 진행 일자 열: `{lectureDate(요일)}` \| `{sessionOrdinal}차시` — [`PaymentOrderLectureDateSessionCell`](../../src/features/settlement/ui/payment-record/payment-order-lecture-date-session-cell.tsx)
- 프로그램 진행 회차: `{sessionCompleted} / {sessionTotal}` (예: `4 / 16`) — **프로그램 커리큘럼 기준**, 정산 라인 수와 무관

### 1.1 ⭐ **P0 서버 수정 요청** — 신청자명·성명 등 **사람 이름 마스킹 금지**

정산 관리 LNB에서 **사람 이름 UI**(신청자명, 성명, 강사명)는 **항상 원문**이어야 합니다.  
서버가 `홍*동`처럼 **사전 마스킹해 내려보내면 FE가 복원할 수 없음** — **plain 제공**.

| UI 라벨 | API 필드 | 마스킹 |
|---------|----------|--------|
| **신청자명** (지급조서 확인·정산 목록·계좌 지급 목록) | `instructorName` | **금지** |
| **성명** (지급 현황 상세·산출 내역서 기본 정보) | `instructorName` / `nameKo` | **금지** |
| 캘린더·집계 행 강사명 | `instructorName` | **금지** |

**대상 API (응답 필드 전부 plain)**

- `GET /api/admin/settlements` · `GET /api/admin/settlements/{id}`
- `GET /api/admin/settlements/aggregates`
- `GET /api/admin/settlements/calendar`
- `GET /api/admin/account-payments` (및 상세)
- `instructorHeader.nameKo` (embed 시)

```
❌ 홍*동   김**
✅ 홍길동  김민준
```

**마스킹하는 것 (이름 컬럼과 구분):** 연락처·이메일·계좌번호·예금주(`accountHolder`) — **화면은 FE 마스킹**. 지급조서 발급·산출 내역서 원문 열람은 [§1.2](#12--p0-서버-요청--지급조서-발급원문--산출-내역서-unmask-api).  
상세: [핸드오프 §3.7](./settlement-payment-order-detail-backend-handoff.md#37-개인정보-마스킹-정책--p0-서버-수정-요청-사람-이름-마스킹-금지)

**수용:** 스테이징 정산 관리 목록·상세·산출 내역서·계좌 지급에서 이름이 `*` 없이 전체 표시.

### 1.2 ⭐ **P0 서버 요청** — 지급조서 발급(원문) · 산출 내역서 unmask API

화면의 산출 내역서는 연락처·이메일·주소·계좌를 **마스킹 표시**합니다.  
**지급조서(발급용) PDF·미리보기**에는 같은 값을 **마스킹 해제(원문)** 로 넣어야 합니다. 마스킹된 문자열을 문서에 넣으면 안 됩니다.

현재 FE는 산출 내역서 표시값(`phoneDisplay` 등)을 그대로 발급 양식에 바인딩합니다 — **원문 API가 없으면 발급 문서가 깨집니다.**

#### A. 산출 내역서 마스킹 해제 API **(신규)**

회원 상세와 동일 패턴.

| | |
|---|---|
| **Method / Path** | `POST /api/admin/settlements/{settlementId}/privacy/unmask` |
| **Body** | `{ "reason": string }` — 1~500자, 감사 로그 저장 (`AdminPrivacyUnmaskRequest`와 동일) |
| **응답** | `SettlementFrontendResponse` — **아래 필드 전부 원문** (GET 상세와 동일 스키마) |
| **감사** | 회원 unmask와 같이 privacy-access 로그 |

**원문으로 내릴 필드 (산출 내역서 내부 데이터 전부)**

| 필드 | 산출 내역서 UI | 지급조서 발급 양식 |
|------|----------------|-------------------|
| `instructorName` / `nameKo` | 성명 | 성명(한글) |
| `gender`, `birthDate` | 성별 및 생년월일 | (해당 시) |
| `phone` | 연락처 | — |
| `email` | 이메일 | — |
| `address` | 자택 주소지 (블러 해제) | 주소 |
| `bankName` | 정산 계좌 | 은행명 |
| `accountNumber` | 정산 계좌 | 계좌번호 |
| `accountHolder` | 예금주 | 예금주 |
| `residentRegistrationNumber` (또는 `residentFront`+`residentBack`) | 산출 내역서에 없을 수 있음 | **주민등록번호 — 발급 양식 필수** |

GET `/settlements/{id}` 기본 응답은 화면용(이름은 plain, 연락처·계좌는 원문이어도 FE가 마스킹).  
**unmask 응답만** 발급·「개인정보 확인」토글에 사용.

#### B. 지급조서 발급 시 원문 바인딩

| | |
|---|---|
| **화면** | 산출 내역서·정산 목록 「지급조서 발급」→ 지급조서(발급용) 미리보기/PDF |
| **요청** | 발급 시 **A의 unmask 응답(또는 동등 원문 DTO)** 으로 양식 필드 채움 |
| **금지** | 마스킹된 `010-****-5678`, `************1234`, 블러 주소를 PDF에 기입 |
| bulk | 선택 다건 발급 시 settlementId마다 unmask **또는** `POST .../privacy/unmask/bulk` `{ settlementIds, reason }` |

**수용 기준**

- [ ] OpenAPI에 `POST /api/admin/settlements/{settlementId}/privacy/unmask` + body `reason`
- [ ] 응답에 연락처·이메일·주소·계좌번호·예금주 **원문** (`*` 없음)
- [ ] 지급조서 기본정보: 성명·주소·은행·계좌·예금주·주민번호가 원문
- [ ] 감사 로그에 사유·settlementId·관리자 기록
- [ ] 스테이징: 산출 내역서 화면은 마스킹, 발급 PDF는 원문

프론트 후속: 발급 직전 unmask 호출 → `mapInstructorCalculationStatementToIssuanceInput`에 원문 사용. 산출 내역서 「개인정보 확인」은 회원 상세와 동일 confirm 모달.

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
| 한글 (성명) | `nameKo` | `nameKo` / `instructorName` | ✅ plain | ✅ 목록 `instructorName` |
| **성별 및 생년월일** | `genderBirthDisplay` | `gender`, `birthDate` | ✅ | ❌ **DTO 없음 → 서버 요청** |
| **연락처** | `phone` | `phone` | ✅ → FE 마스킹 | ❌ **DTO 없음 → 서버 요청** |
| **이메일** | `email` | `email` | ✅ → FE 마스킹 | ❌ **DTO 없음 → 서버 요청** |
| **자택 주소** | `address` | `address` | ✅ → FE 블러 | ❌ **DTO 없음 → 서버 요청** |
| **정산 계좌 정보** | `bankName`, `accountNumber`, `accountHolder` | 동일 (분리 필드) | ✅ 은행명 plain | ❌ **DTO 없음 → 서버 요청** |
| 지급 조서 처리 현황 | 집계 배지 | 라인 집계 / embed | ✅ | FE 집계 |
| 총 정산 예정 금액 | `totalEstimatedAmount` | embed 또는 `sum(netPaymentAmount)` | ✅ | 집계 목록 값 |

> **영문 성명(`nameEn`) UI 없음** — BE 요청 대상 아님. 성별/생년월일은 **풀페이지·산출 내역서 모두 표시**.

마스킹: [상세 핸드오프 §3.7](./settlement-payment-order-detail-backend-handoff.md#37-개인정보-마스킹-정책--p0-서버-수정-요청-사람-이름-마스킹-금지). 발급·원문 열람: [§1.2](#12--p0-서버-요청--지급조서-발급원문--산출-내역서-unmask-api).

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
| 성별 및 생년월일 | `gender`, `birthDate` → FE 포맷 | ✅ | ❌ **DTO 없음 → 서버 요청** |
| 연락처 | `phone` | ✅ → FE 마스킹 | ❌ **DTO 없음 → 서버 요청** |
| 이메일 | `email` | ✅ → FE 마스킹 | ❌ **DTO 없음 → 서버 요청** |
| 자택 주소지 | `address` | ✅ → FE 블러 | ❌ **DTO 없음 → 서버 요청** |
| 정산 계좌 정보 | `bankName`, `accountNumber`, `accountHolder` | ✅ | ❌ **DTO 없음 → 서버 요청** |
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

### 4.5 ⭐ **백엔드 요청 (P0)** — 강사 프로필·계좌 (현재 UI `-`)

OpenAPI `SettlementFrontendResponse` / `SettlementListItemResponse`에 **아래 필드가 없음**.  
프론트는 `instructorIdentityFromLine`으로 `-`만 표시 중 — **회원 API 2차 호출 없이** 정산 응답에 embed 요청.

**대상 API (둘 다 필요)**

| API | 넣는 위치 | 화면 |
|-----|-----------|------|
| `GET /api/admin/settlements?instructorMemberId=` | `instructorHeader` embed (§6.2) | 강사 기준 **지급 현황 상세** 풀페이지 기본 정보 |
| `GET /api/admin/settlements/{settlementId}` | `SettlementFrontendResponse` 루트 (또는 `instructor` 객체) | **산출 내역서** 모달 신청자 기본 정보 · 계좌 지급 상세 |

**필수 필드 (plain — 마스킹은 FE)**

| 필드 | 타입 | UI 라벨 | 마스킹 |
|------|------|---------|--------|
| `gender` | `"M"` \| `"F"` (또는 `MALE`/`FEMALE`) | 성별 및 생년월일 (FE 합성) | 없음 |
| `birthDate` | `YYYY-MM-DD` | 성별 및 생년월일 (FE 합성) | 없음 |
| `phone` | string | 연락처 | FE |
| `email` | string | 이메일 | FE |
| `address` | string | 자택 주소지 | FE 블러 |
| `bankName` | string | 정산 계좌 — 은행명 | **금지** |
| `accountNumber` | string | 정산 계좌 — 번호 | FE |
| `accountHolder` | string | 정산 계좌 — 예금주 | FE |

`instructorName` / `nameKo`는 목록에 이미 있음. **성명·신청자명은 원문** (사전 마스킹 금지, [§1.1](#11--p0-서버-수정-요청--신청자명성명-등-사람-이름-마스킹-금지)). `nameEn` **요청하지 않음**.

FE 성별·생년 표시 예: `남성 | 1990. 01. 15 (만 36세)` — `gender`+`birthDate`만 있으면 됨.

마스킹 규칙: [상세 핸드오프 §3.7](./settlement-payment-order-detail-backend-handoff.md#37-개인정보-마스킹-정책--p0-서버-수정-요청-사람-이름-마스킹-금지). 발급 PDF는 [§1.2](#12--p0-서버-요청--지급조서-발급원문--산출-내역서-unmask-api).

**수용 기준**

- [ ] OpenAPI `SettlementFrontendResponse`에 위 8필드 포함 (null이어도 스키마에 존재)
- [ ] `GET /settlements?instructorMemberId=` 응답에 동일 필드 embed (`instructorHeader` 또는 동등)
- [ ] 스테이징: 강사 상세 풀페이지·산출 내역서에서 연락처·주소·계좌가 `-`가 아님
- [ ] 은행명·**성명/신청자명** plain (`*` 없음) / 연락처·이메일·계좌번호·예금주는 원문 (FE 마스킹)

프론트 후속: `instructorIdentityFromLine` placeholder 제거.

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

### 6.2 `instructorHeader` (`GET /settlements?instructorMemberId=`) — **P0 요청**

풀페이지 강사 기본 정보. **현재 OpenAPI에 없음** → [§4.5](#45--백엔드-요청-p0--강사-프로필계좌-현재-ui--)와 동일 필드.

| 필드 | UI 라벨 | 필수 |
|------|---------|------|
| `nameKo` | 한글 (성명) | ✅ (목록 `instructorName`으로 대체 가능) |
| **`gender`** | 성별 및 생년월일 | ✅ |
| **`birthDate`** | 성별 및 생년월일 | ✅ |
| **`phone`** | 연락처 | ✅ |
| **`email`** | 이메일 | ✅ |
| **`address`** | 자택 주소 | ✅ |
| **`bankName`**, **`accountNumber`**, **`accountHolder`** | 정산 계좌 정보 | ✅ |
| `totalEstimatedAmount` | 총 정산 예정 금액 | 권장 (없으면 집계 목록 값) |

`nameEn` **미포함**.

**대안:** `GET /api/admin/members/{instructorMemberId}` 조합 — [상세 핸드오프 §3.3](./settlement-payment-order-detail-backend-handoff.md#33-상세-기본정보-강사-블록). **권장은 정산 응답 embed** (상세 진입 시 회원 API 추가 왕복 방지).

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
  "instructorHeader": {
    "nameKo": "홍길동",
    "gender": "M",
    "birthDate": "1990-01-15",
    "phone": "01012345678",
    "email": "user@example.com",
    "address": "서울특별시 …",
    "bankName": "국민은행",
    "accountNumber": "1234567890",
    "accountHolder": "홍길동",
    "totalEstimatedAmount": 915000
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
| 강사 프로필 (풀페이지·산출 내역서) | **`-` — [§4.5 P0 서버 요청](#45--백엔드-요청-p0--강사-프로필계좌-현재-ui--)** |
| 산출 내역서 그 외 필드 | `GET /settlements/{id}` 매핑 완료 |

---

## 8. 수용 기준 (Acceptance)

**풀페이지**

- [ ] 프로그램 기본 정보 **진행 회차** — 총 회차 ≠ 정산 라인 수
- [ ] **사업 운영 기간** — 프로그램 운영 일정과 일치
- [ ] 목록 **참여 기관명** — 전 행 `-` 없음
- [ ] 강사 상세 기본 정보 — 성별/생년·연락처·이메일·주소·계좌가 `-` 아님 ([§4.5](#45--백엔드-요청-p0--강사-프로필계좌-현재-ui--))

**산출 내역서 모달**

- [ ] `GET /settlements/{id}` 1회로 기본 정보·테이블·합계 채움 — `'—'`·「준비 중」 없음
- [ ] **강의비 책정 기준**·**프로그램 진행 회차**·**참여 기관명** API 값 표시
- [ ] 강사 맥락 — 성명(plain)·성별/생년·연락처·주소·계좌 API 원문 (마스킹은 FE)
- [ ] **산정 기준 상세 > 상세 보기** — `calculationDetail`로 모달 동작

- [ ] **지급조서 발급** — unmask 원문으로 성명·주소·계좌·주민번호 기입 ([§1.2](#12--p0-서버-요청--지급조서-발급원문--산출-내역서-unmask-api))
- [ ] **산출 내역서 unmask** — `POST /settlements/{id}/privacy/unmask` 로 화면 마스킹 해제

---

## 9. 우선순위

| 우선순위 | 항목 |
|----------|------|
| **P0** | **§1.1 — 신청자명·성명 등 사람 이름 마스킹 금지** (`instructorName` / `nameKo` plain) |
| **P0** | **§1.2 — 지급조서 발급 원문 + 산출 내역서 `POST .../privacy/unmask`** |
| **P0** | §5 — 목록 `institutionName`, `sessionOrdinal`, `statementId` |
| **P0** | **§4.5 · §6.2 — 강사 프로필·계좌** (`gender`, `birthDate`, `phone`, `email`, `address`, 계좌 3종) — **현재 UI `-`** |
| **P0** | §6.1 — `programHeader` (진행 회차·사업기간 — 목록 라인에 이미 있으면 충족) |
| **P0** | §4 — **`GET /settlements/{id}`** 산출 내역서 전 필드 (프로필 포함) |
| P1 | [핸드오프 §3.6](./settlement-payment-order-detail-backend-handoff.md#36--get-settlementssettlementid-필수-확장--강의비-책정-기준산정-기준-상세-p1차단) OpenAPI 상세 |

---

## 10. 문의

프론트: `features/settlement-management/api/payment-orders/map-settlement-detail.ts`, `map-settlement-detail-to-calculation-statement.ts`
