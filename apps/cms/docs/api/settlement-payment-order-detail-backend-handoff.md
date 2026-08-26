# 지급 현황 상세 — API 연동·백엔드 핸드오프

**화면:** 정산 관리 > 지급조서 확인 > 행 클릭 → 지급 현황 상세 풀페이지  
**프론트 경로:** `features/settlement-management/api/payment-orders/`, `use-payment-order-detail-fullpage-modal.ts`  
**연동 명세:** [settlement-api-integration.md](./settlement-api-integration.md)  
**공통 갭:** [settlement-api-backend-gaps.md](./settlement-api-backend-gaps.md)  
**UI 필드 SSOT (기본 정보·목록 전 열):** [settlement-payment-order-detail-ui-fields-backend-handoff.md](./settlement-payment-order-detail-ui-fields-backend-handoff.md)

**Last updated:** 2026-08-26 (`nameEn` 발급 필드 · unmask)

---

## 1. 프론트 변경 요약 (2026-08-24)

지급 현황 상세 진입 시 **전체 settlements/statements fetch + 클라이언트 필터** 대신, 아래 scoped 호출로 전환했습니다.

| 단계 | Method | Path | Query |
|------|--------|------|-------|
| 정산 라인 목록 | GET | `/api/admin/settlements` | `programId` **또는** `instructorMemberId`, (선택) `fromDate`, `toDate` |
| statementId 매핑 | GET | `/api/admin/settlements/statements` | **임시 우회** — §3.1·§4 참고. **권장:** settlements 목록 DTO에 `statementId` embed (§4) |
| 산출 내역서 | GET | `/api/admin/settlements/{settlementId}` | 라인별 (기존 유지) · **⭐ §3.6 필수 필드** |
| 지급조서 확인 | PATCH | `/api/admin/settlements/statements/{statementId}/confirm` | 단건 순차 (기존 유지) |

**aggregateKey:** 목록 집계 행의 `programId` / `instructorMemberId` 문자열.

**기간:** 목록 URL에 적용된 강의 출강일(`po_from`, `po_to`)을 상세 API `fromDate`/`toDate`에 그대로 전달.

---

## 2. 서버에서 **지금 당장** 확인할 것 (신규 API 없이)

아래가 동작해야 상세 라인 테이블이 채워집니다.

- [ ] `GET /api/admin/settlements?programId={id}` — 해당 프로그램 정산 라인 반환
- [ ] `GET /api/admin/settlements?instructorMemberId={id}` — 해당 강사 정산 라인 반환
- [ ] 동일 API에 `fromDate`, `toDate` 전달 시 **출강일(`lectureDate`) 기준** 필터
- [ ] 응답 `SettlementListItemResponse`에 **`settlementId`, `programId`, `instructorMemberId`, `statementStatus`, `lectureDate`, `netPaymentAmount`** 포함
- [ ] *(임시)* `GET /api/admin/settlements/statements` — 프론트가 settlementId join용으로 2차 호출 중 → **§4 반영 후 제거 예정**

> **기본 정보·목록 모든 열 SSOT:** [settlement-payment-order-detail-ui-fields-backend-handoff.md](./settlement-payment-order-detail-ui-fields-backend-handoff.md) — 참여 기관명·차시·진행 회차·강사 헤더 등 **서버 제공 필수**.

### UI 필드 ↔ API (상세 라인 1행 — 요약)

전체 매핑·헤더 embed는 **[UI 필드 SSOT 문서](./settlement-payment-order-detail-ui-fields-backend-handoff.md)** 참고.

| UI (`PaymentOrderAdminProgramDetailInstructorRow` 등) | API 필드 | 비고 |
|------------------------------------------------------|----------|------|
| `instructorName` / `programName` | `instructorName` / `programNameKo` | |
| `lectureDate` | `lectureDate` | |
| `sessionOrdinal` | **`sessionOrdinal`** (제안) | ❌ 현재 `scheduleId` fallback — SSOT 문서 §4 |
| `processingStatus` | `statementStatus` | REQUESTED→pending 등 ([§11 갭 문서](./settlement-api-backend-gaps.md#11-ui-8종-vs-api-statementpayment-status)) |
| `estimatedAmount` | `netPaymentAmount` | |
| `lectureFeePaymentScheduledDate` | `expectedTransferDate` | |
| `statementId` | **`SettlementListItemResponse.statementId`** (요청) | 현재는 statements 2차 조회 join — §4 |
| `institutionName` | **`institutionName`** (요청) | 현재 UI `-` — SSOT 문서 §4 |

---

## 3. 서버 **수정 권장** (P1 — 성능·정확도)

### 3.1 statements 목록 — settlementId 스코프 필터 *(차선 — §4 미적용 시)*

| | |
|---|---|
| **현재** | `GET /api/settlements/statements` — `status`, `page`, `size` 만 지원 |
| **프론트 임시** | statements **전체 pagination** 후, 상세 settlements의 `settlementId` 집합으로 **클라이언트 필터** |
| **문제** | statement 건수 증가 시 상세 진입마다 전량 조회 |
| **제안** | `settlementIds`(comma-separated 또는 repeated param) 또는 `programId` / `instructorMemberId` 필터 추가 |

예:

```
GET /api/admin/settlements/statements?settlementIds=1,2,3
GET /api/admin/settlements/statements?programId=42
```

> **우선순위:** 아래 §4(`statementId` embed)가 반영되면 §3.1은 불필요.

### 3.2 settlements 목록 — `statementId` embed *(§4와 동일)*

§4 백엔드 수정 요청 본문 참고.

### 3.3 상세 기본정보 (강사 블록) — **P0 서버 요청**

| | |
|---|---|
| **UI** | 강사 상세 풀페이지 · 산출 내역서 신청자 블록 — 성별/생년·연락처·이메일·주소·계좌 |
| **현재 API** | `SettlementFrontendResponse`에 **개인정보·계좌 필드 없음** (`instructorName`만) |
| **프론트 임시** | remote 시 `-` 표시 (`instructorIdentityFromLine`) |
| **요청 필드** | `gender`, `birthDate`, `phone`, `email`, `address`, `bankName`, `accountNumber`, `accountHolder` |
| **제안** | **권장:** ① `GET /settlements/{id}` 루트 embed + ② `GET /settlements?instructorMemberId=` `instructorHeader`. 차선: `GET /api/admin/members/{instructorMemberId}` 조합 |
| **SSOT** | [UI 필드 SSOT §4.5](./settlement-payment-order-detail-ui-fields-backend-handoff.md#45--백엔드-요청-p0--강사-프로필계좌-현재-ui--) |

> **§3.6과 구분:** 본 절은 **프로필·계좌**. 강의비 등급·산정 기준은 **회원 API가 아니라 `GET /settlements/{id}`에 필수** ([§3.6](#36--get-settlementssettlementid-필수-확장--강의비-책정-기준산정-기준-상세-p1차단)).  
> **개인정보 마스킹 규칙**은 [§3.7](#37-개인정보-마스킹-정책--p0-서버-수정-요청-사람-이름-마스킹-금지) 참고. 지급조서 발급·산출 내역서 원문 열람은 [§3.8](#38-지급조서-발급원문--산출-내역서-unmask-api-p0).

### 3.4 참여 기관명 · 차시 · 프로그램 진행 회차

| | |
|---|---|
| **UI** | 상세 라인 「참여 기관명」·「N차시」·프로그램 기본정보 「진행 회차」·「사업 운영 기간」 |
| **현재 API** | 라인 `institutionName`·`sessionOrdinal`·기간·회차 **제공됨 (FE 매핑 완료)** |
| **제안** | [UI 필드 SSOT 문서](./settlement-payment-order-detail-ui-fields-backend-handoff.md) |
| **프론트** | 매핑 완료. **잔여:** 강사 프로필 §3.3 |

### 3.5 산출 내역서 — 산정 항목 `type` enum 확장 *(P1)*

| | |
|---|---|
| **UI** | 지급 현황 상세 > 산출 내역서 > **산정 항목** 컬럼 |
| **현재 API** | `GET /api/admin/settlements/{settlementId}` → `SettlementFrontendResponse.items[]` |
| **item DTO** | `SettlementFrontendItemResponse` — `type`(string, enum 미정의), `description`, `amount` |
| **문제** | `type`이 `instructor_fee` 등 **snake_case 코드**로만 내려와 UI에 그대로 노출됨. OpenAPI에 허용 값·한글 라벨 규격 없음 |
| **프론트 대응** | `shared/constants/settlement-item-type.ts`에서 코드→한글 매핑 (서버 enum 확정 전 임시) |

#### 백엔드 수정 요청

1. **`SettlementFrontendItemResponse.type`에 enum(또는 문서화된 상수 집합) 정의** — OpenAPI `enum` 또는 별도 `SettlementItemType` 스키마
2. **아래 7종을 SSOT로 합의** — 산출 내역서·지급조서·정산 신청 items 공통 사용 권장

| `type` (제안 코드) | 산정 항목 (UI 라벨) | 비고 |
|--------------------|---------------------|------|
| `instructor_fee` | 강사비 | 기존 |
| `transportation` | 교통비 | 기존 |
| `accommodation` | 숙박비 | 기존 |
| `meal` | 식사비 | **신규** — 정산 항목 설정 「식사비」 |
| `activity` | 활동비 | **신규** — UJAT·자원봉사 활동비 등 |
| `withholding` | 원천징수 | **신규** — 공제 라인. `amount`는 **음수** 권장 |
| `other` | 기타 | 기존 |

3. **`description`** — 항목별 상세(차시·거리·공제율 등)는 기존처럼 자유 텍스트. **카테고리명은 `type`으로만** 내려주고 UI는 위 표로 라벨 변환
4. **원천징수 표현** — `type: "withholding"` + 음수 `amount` 라인을 items에 포함. 상위 `withholdingTaxAmount`만 두고 items에 없으면 산출 내역서 합계 행·라인 불일치
5. **breaking change 없음** — 기존 4종(`instructor_fee`, `transportation`, `accommodation`, `other`) 응답 유지. 신규 3종은 해당 정산에 항목 있을 때만 추가

#### 응답 예시 (제안)

```json
{
  "items": [
    { "type": "instructor_fee", "description": "강사비 (3차시)", "amount": 300000 },
    { "type": "transportation", "description": "대전 → 서울 (146.8km)", "amount": 31500 },
    { "type": "meal", "description": "식사비", "amount": 15000 },
    { "type": "activity", "description": "UJAT 활동비", "amount": 20000 },
    { "type": "withholding", "description": "원천징수 8.8%", "amount": -32508 }
  ],
  "totalAmount": 333992
}
```

#### 수용 기준 (Acceptance)

- [ ] OpenAPI에 `SettlementFrontendItemResponse.type` 허용 값 7종 명시
- [ ] 스테이징: 식사비·활동비·원천징수가 포함된 정산 상세 조회 시 items에 해당 `type` 존재
- [ ] 원천징수 라인 `amount` 음수, `items` 합계 = `totalAmount` (또는 `netPaymentAmount`와 정합)
- [ ] 프론트 Orval 재생성 후 enum 타입 반영 가능

#### 프론트 후속 (백엔드 enum 반영 후)

- `settlement-item-type.ts` — 서버 enum과 1:1 동기화 확인
- `map-settlement-detail-to-calculation-statement.ts` — `type` 라벨 매핑 유지 (현재 연동됨)

### 3.6 ⭐ **`GET /settlements/{settlementId}` 필수 확장** — 강의비 책정 기준·산정 기준 상세 *(P1·차단)*

> **백엔드 전달 핵심:** 산출 내역서·「산정 기준 상세 > 상세 보기」·강사비 등급 모달에 필요한 데이터는 **반드시 `GET /api/admin/settlements/{settlementId}` 응답(`SettlementFrontendResponse`)에 포함**해야 합니다.  
> **회원 API(`GET /members/{id}`)만으로는 불충분** — 정산 건마다 적용된 **매칭·프로그램 임금 정책·산출 스냅샷**이 settlement 상세에 있어야 합니다.

| | |
|---|---|
| **대상 API** | **`GET /api/admin/settlements/{settlementId}`** (산출 내역서 모달의 **유일** 상세 소스) |
| **현재 DTO** | `SettlementFrontendResponse` — `items[]`(type·description·amount), `totalAmount`, `calculationResult`(unknown) |
| **프론트 임시** | `lectureFeeStandardTitle: '—'` 고정 · `items[].basisDetail` 미매핑 |
| **사용자 증상** | 강사비 행 **「산정 기준 상세 > 상세 보기」→ 「준비 중입니다.」** · 기본정보 「강의비 책정 기준」 `-` |
| **§3.3과 구분** | §3.3 = 강사 **프로필·계좌**(이름·주소·계좌). **본 절 = 정산 산출 맥락**(등급·책정·항목별 산정 근거) — **둘 다 필요하나 역할 다름** |

#### 필수 포함 필드 (SettlementFrontendResponse 루트)

아래는 **신규 endpoint 없이** 기존 `GET /settlements/{id}` DTO에 **embed** 요청합니다.

| 필드 (제안명) | 타입 | UI 사용처 | 필수 |
|---------------|------|-----------|------|
| `lectureFeeStandardTitle` | `string` | 산출 내역서 기본정보 「강의비 책정 기준」·강사비 **등급 모달** 매핑 (예: `2급 강사비`, `특강 강사비`) | **✅** |
| `lectureFeeStandardAmount` | `number` 또는 포맷된 `string` | 동일 블록 금액 표시 | **✅** |
| `wageItemType` | `string` (enum) | `lectureFeeStandardTitle` 대체 가능 — `TIER1`/`TIER2`/`TIER3`/`SPECIAL_LECTURE` 등 ([정산 config `WageItemResponse`](../../src/shared/api/generated/settlement/schemas/wageItemResponse.ts)와 동일 SSOT) | 택1 (title과 **하나는 필수**) |
| `feeGrade` | `string` | 매칭·강사 정책 등급 코드 — 프론트가 title로 normalize 가능 시 | 선택 (title/wageItemType 없을 때) |
| `lectureSessionDisplay` | `string` | 강의 진행 회차 (예: `2 ~ 3차시`) — 없으면 schedule join | 권장 |
| `institutionName` | `string` | 산출 내역 테이블 「참여 기관명」 | 권장 |

> **`lectureFeeStandardTitle` 또는 `wageItemType` 중 최소 1개는 null/빈값이 아니어야** 강사비 행 상세 보기가 동작합니다. 둘 다 없으면 프론트는 「준비 중」만 표시할 수 있습니다.

#### 필수 포함 필드 (items[] — 항목별 산정 기준 상세)

교통비·숙박비·식사비·활동비 등 **항목별 「상세 보기」** 는 행마다 산출 근거 JSON이 필요합니다. **별도 API 2차 호출 없이** `items[]`에 embed 요청.

| 필드 (제안명) | 타입 | UI 사용처 | 필수 |
|---------------|------|-----------|------|
| `type` | enum (§3.5 7종) | 산정 항목 컬럼 | **✅** |
| `description` | `string` | 항목 설명 | **✅** |
| `amount` | `number` | 정산 금액 | **✅** |
| `calculationDetail` | `object` 또는 `basisJson` (`string` JSON) | 「산정 기준 상세」 모달 layout·영수증·거리 등 — mock `basisDetail`에 대응 | **✅** (해당 type에 산정 UI 있을 때) |

**`calculationDetail.layout` (제안)** — 프론트 read-only viewer와 1:1:

| layout | 대상 `type` | 비고 |
|--------|-------------|------|
| `lectureFeeTier` | `instructor_fee` | tier·책정금·차시 — **루트 `lectureFeeStandardTitle` 없을 때 item fallback** |
| `transportRoundTrip` / `transportOneWay` / `transportInstructor` | `transportation` | |
| `lodgingGeneral` / `lodging1s1g` | `accommodation` | |
| `meal` | `meal` | |
| `activity` | `activity` | |

원천징수(`withholding`)는 공제 항목 설정 read-only 모달 — `calculationDetail` 없어도 `type`+음수 `amount`로 처리 가능.

#### 응답 예시 (제안 — **`GET /settlements/{id}` 전체**)

```json
{
  "id": "12345",
  "programId": "42",
  "instructorId": "9001",
  "period": "2026-08",
  "lectureFeeStandardTitle": "2급 강사비",
  "lectureFeeStandardAmount": 915000,
  "wageItemType": "TIER2",
  "lectureSessionDisplay": "2 ~ 3차시",
  "institutionName": "○○초등학교",
  "items": [
    {
      "type": "instructor_fee",
      "description": "프로그램 1회 강의비 (2급 강사)",
      "amount": 915000,
      "calculationDetail": {
        "layout": "lectureFeeTier",
        "tier": "2",
        "categoryLabel": "2급 강사비",
        "feeAssessmentWon": 915000,
        "lectureTimeDisplay": "2차시",
        "totalWon": 915000
      }
    },
    {
      "type": "transportation",
      "description": "대전 → 서울 (146.8km)",
      "amount": 31500,
      "calculationDetail": {
        "layout": "transportInstructor",
        "categoryLabel": "교통비(1사1교)",
        "distanceKm": 146.8,
        "fuelCostWon": 30000,
        "tollFeeWon": 1500,
        "totalWon": 31500
      }
    },
    {
      "type": "withholding",
      "description": "원천징수 8.8%",
      "amount": -83292
    }
  ],
  "totalAmount": 863208
}
```

#### 수용 기준 (Acceptance) — **미충족 시 산출 내역서 상세 보기 불가**

- [ ] **`GET /settlements/{settlementId}`** 응답에 `lectureFeeStandardTitle` **또는** `wageItemType` 포함 (null/`—` 아님)
- [ ] 동일 응답에 `lectureFeeStandardAmount`(또는 UI 표시 가능 금액) 포함
- [ ] `instructor_fee` item에 `calculationDetail`(또는 동등 JSON) 포함 **또는** 루트 title/wageItemType으로 강사비 모달 매핑 가능
- [ ] `transportation` / `accommodation` / `meal` / `activity` item — 해당 항목 존재 시 **`calculationDetail` 포함** (상세 보기 「준비 중」 방지)
- [ ] **회원 API 추가 호출 없이** 위 필드만으로 산출 내역서·산정 기준 모달 E2E 가능
- [ ] OpenAPI·Orval 재생성 후 프론트 `map-settlement-detail-to-calculation-statement.ts`에서 `'—'` placeholder 제거

#### 프론트 후속 (백엔드 반영 후)

1. `map-settlement-detail-to-calculation-statement.ts` — `lectureFeeStandardTitle` / `lectureFeeStandardAmount` API 매핑
2. `items[].calculationDetail` → `PaymentOrderCalculationStatementLine.basisDetail` 변환
3. `resolve-settlement-item-setting-for-calculation-row.ts` — `wageItemType` → 정산 항목 설정 id 매핑 (필요 시)
4. 스테이징: 강사비 행 상세 보기 → **「준비 중」 없이** 등급별 강사비 모달 또는 산정 기준 상세 모달

#### ❌ 비권장 / 불충분한 대안

| 대안 | 불충분 이유 |
|------|-------------|
| `GET /members/{instructorMemberId}`만 제공 | 강사 **기본 등급** ≠ **해당 정산·매칭에 적용된** 책정 기준 |
| 목록 API(`GET /settlements`)에만 embed | 산출 내역서는 **`GET /settlements/{id}`** 단건 조회 — 목록 필드만으로는 모달 데이터 부족 |
| `calculationResult` unknown blob만 | layout·항목 index 매핑 불명 — **`items[].calculationDetail` per-line** 권장 |

### 3.7 개인정보 **마스킹 정책** — **P0 서버 수정 요청** (사람 이름 마스킹 금지)

> **백엔드 전달 (정산 관리 전체):** UI 라벨 **신청자명·성명** 등 **사람 이름**은 마스킹하지 않습니다.  
> `instructorName` / `nameKo`를 `홍*동`처럼 **사전 마스킹하면 FE가 원문을 복원할 수 없습니다.** **plain 제공.**  
> SSOT: [UI 필드 문서 §1.1](./settlement-payment-order-detail-ui-fields-backend-handoff.md#11--p0-서버-수정-요청--신청자명성명-등-사람-이름-마스킹-금지)

#### 적용 화면 (정산 관리 LNB)

- **지급조서 확인** 목록 — 컬럼 「신청자명」
- 지급 현황 상세 풀페이지 — 「성명」 / 목록 「신청자명」
- **산출 내역서** 모달 — 기본 정보 「성명」
- **계좌 지급 확인** 목록·상세 — 「신청자명」
- 캘린더 뷰 강사명

#### 필드별 규칙 (SSOT)

| 구분 | 필드 (API·UI 예) | 마스킹 | 비고 |
|------|------------------|--------|------|
| **미마스킹 (필수)** | `instructorName` / `nameKo` — **신청자명·성명** | ❌ **하지 않음** | 정산 관리 **전 API 응답 원문** |
| **미마스킹** | `bankName` — **은행명** | ❌ **하지 않음** | 정산 계좌 정보 좌측 |
| **마스킹** | `phone` / 연락처 | ✅ | 예: `010-****-5678` (FE) |
| **마스킹** | `email` / 이메일 | ✅ | 예: `ti***@example.com` (FE) |
| **마스킹** | `accountNumber` / 계좌번호 | ✅ | 숫자만 `*` — **은행명과 분리** |
| **마스킹** | `accountHolder` / 예금주 | ✅ | 「성명/신청자명」과 **다른 필드**. 성만 노출 |

#### 정산 계좌 정보 표시 (UI 합성)

프론트는 **은행명 + 마스킹된 계좌번호** | **마스킹된 예금주** 형태로 조합합니다.

```
{bankName} {maskedAccountNumber} | {maskedAccountHolder}
예: 국민은행 ************1234 | 홍**
```

- **은행명(`bankName`)은 절대 마스킹하지 않음**
- 계좌번호·예금주만 마스킹
- API는 가능하면 **`bankName` / `accountNumber` / `accountHolder` 분리** — 한 문자열에 섞어 내려보내지 않음

#### 백엔드 수정 요청

1. **`instructorName`·`nameKo`** — 아래 API에서 **마스킹 금지** (plain). `*` 포함 금지.
   - `GET /api/admin/settlements` · `GET /api/admin/settlements/{id}`
   - `GET /api/admin/settlements/aggregates`
   - `GET /api/admin/settlements/calendar`
   - `GET /api/admin/account-payments` 및 상세
   - `instructorHeader.nameKo`
2. **연락처·이메일·계좌번호·예금주** — plain으로 내려주고 FE가 마스킹
3. **예금주(`accountHolder`)를 신청자명/성명과 동일 취급하지 말 것** — 예금주만 마스킹 대상
4. **OpenAPI·응답 예시**에 이름 필드는 unmasked 예시 (`홍길동`) 사용

#### 수용 기준 (Acceptance)

- [ ] 위 API의 `instructorName` / `nameKo` — **원문** (마스킹 패턴 `*` 없음)
- [ ] `bankName` — **원문** · `accountNumber`·`accountHolder` — plain (FE 마스킹)
- [ ] 스테이징 **정산 관리**: 목록 「신청자명」·상세 「성명」·산출 내역서 「성명」이 **전체 이름**. 연락처·이메일·계좌(번호·예금주)만 마스킹

#### 프론트 참고 구현

- `payment-order-instructor-basic-info.tsx` — `nameKo` plain · 연락처·이메일·계좌 마스킹
- `map-settlement-detail-to-calculation-statement.ts` — 동일
- `shared/constants/download-policy.ts` — `MASKING_POLICY` (계좌번호: 숫자만 `*`, 예금주: 성만 노출)

### 3.8 지급조서 발급(원문) · 산출 내역서 unmask API — **P0**

화면 산출 내역서는 §3.7대로 연락처·이메일·계좌를 **마스킹 표시**합니다.  
**지급조서 발급 PDF·미리보기**와 산출 내역서 「개인정보 확인」은 **원문**이 필요합니다.  
FE는 목 샘플로 채우지 않습니다 — DTO/unmask가 없으면 **공란**. `nameEn`은 발급 양식 필드(산출 내역서 UI에는 없음).

회원 상세와 동일:

| | |
|---|---|
| **Method / Path** | `POST /api/admin/settlements/{settlementId}/privacy/unmask` |
| **Body** | `{ "reason": string }` (1~500자, 감사 로그) |
| **응답** | `SettlementFrontendResponse` — phone, email, address, bankName, accountNumber, accountHolder, gender, birthDate, **nameEn**, **주민등록번호**(발급 양식) **전부 원문** |

상세·필드 표·bulk: [UI SSOT §1.2](./settlement-payment-order-detail-ui-fields-backend-handoff.md#12--p0-서버-요청--지급조서-발급원문--산출-내역서-unmask-api)

**SET-006 bulk ZIP**과 구분: ZIP은 파일 묶음. **PDF 본문 PII는 본 unmask(원문)** — 마스킹 문자열을 넣지 말 것.

---

## 4. 백엔드 **수정 요청** — `GET /settlements` 목록에 `statementId` 포함 *(권장·P1)*

프론트는 지급 현황 상세 진입 시 **`statementId`를 얻기 위해** `GET /settlements/statements`를 **2차 호출**하고 있습니다.  
**우회 제거**를 위해 아래 DTO 확장을 요청합니다.

### 요청 요약

| 항목 | 내용 |
|------|------|
| **대상 API** | `GET /api/admin/settlements` (기존 목록·상세 scoped query 동일) |
| **대상 DTO** | `SettlementListItemResponse` |
| **추가 필드** | `statementId?: number` — 해당 정산 라인(`settlementId`)에 연결된 지급조서 ID |
| **관계** | `settlementId` 1건당 지급조서 0~1건. `statementStatus`가 null/미생성이면 `statementId`도 null |
| **OpenAPI** | 스펙·Orval 재생성 후 프론트 `fetchAllPaymentStatementsRemote` 상세 경로 **제거** |

### 프론트 사용처 (필드 필요 이유)

| 기능 | API |
|------|-----|
| 라인 「지급조서 확인」 | `PATCH /api/admin/settlements/statements/{statementId}/confirm` |
| 「일괄 확인」 | 동일 PATCH (또는 bulk-confirm) — 라인별 `statementId` 필요 |
| 산출 내역서 모달 | 라인에 `statementId` 바인딩 |

현재는 `PaymentStatementListItemResponse`에서 `settlementId`로 join (`map-settlement-detail.ts`).

### 수용 기준 (Acceptance)

- [ ] `GET /settlements?programId={id}` 응답 각 item에 `statementId` 포함 (지급조서 있는 라인)
- [ ] `GET /settlements?instructorMemberId={id}` 동일
- [ ] `statementStatus`와 `statementId` 일관 — 조서 미생성 라인은 둘 다 null/부재
- [ ] 기존 `statementStatus`, `settlementId` 등 필드 **breaking change 없음**
- [ ] 스테이징: 상세 1행 confirm 시 Network에 **`/statements` 목록 호출 없음** (프론트 반영 후)

### 프론트 후속 (백엔드 반영 후)

1. `getPaymentOrdersDetailContextRemote` — `fetchPaymentStatementsForSettlementIds` 제거
2. `map-settlement-detail.ts` — `item.statementId` 직접 매핑
3. Orval 재생성 (`SettlementListItemResponse.statementId`)

### 대안 (비권장)

§3.1처럼 `GET /statements?settlementIds=` 필터만 추가해도 2차 호출은 줄일 수 있으나, **여전히 API 2번**이므로 DTO embed가 더 단순합니다.

---

## 5. 서버 **추가 권장** (기존 갭 문서와 연계)

상세 화면에서도 아래는 **별도 API/DTO**가 필요합니다. ([settlement-api-backend-gaps.md](./settlement-api-backend-gaps.md) P0/P1)

| 우선순위 | 항목 | 상세 화면 영향 |
|----------|------|----------------|
| **P0** | **신청자명·성명 마스킹 금지** — [UI SSOT §1.1](./settlement-payment-order-detail-ui-fields-backend-handoff.md#11--p0-서버-수정-요청--신청자명성명-등-사람-이름-마스킹-금지) | 정산 관리 목록·상세·산출 내역서·계좌 지급 **이름 원문** |
| **P0** | **지급조서 발급 원문 + 산출 내역서 unmask** — [UI SSOT §1.2](./settlement-payment-order-detail-ui-fields-backend-handoff.md#12--p0-서버-요청--지급조서-발급원문--산출-내역서-unmask-api) · [§3.8](#38-지급조서-발급원문--산출-내역서-unmask-api-p0) | 발급 PDF에 마스킹 금지 · `POST .../privacy/unmask` |
| P0 | `POST .../statements/bulk-confirm` + 이체 예정일 | 「일괄 확인」 모달 |
| P0 | `PATCH .../statements/{id}/reject` | 산출 내역서 「신청 반려」 |
| P1 | 산출 내역서 DTO (`GET /settlements/{id}` 확장) | 산출 내역서 모달 본문 · **items[].type enum 7종** ([§3.5](./settlement-payment-order-detail-backend-handoff.md#35-산출-내역서--산정-항목-type-enum-확장-p1)) · **⭐ 강의비 책정·calculationDetail 필수** ([§3.6](./settlement-payment-order-detail-backend-handoff.md#36--get-settlementssettlementid-필수-확장--강의비-책정-기준산정-기준-상세-p1차단)) |
| **P0** | 강사 프로필·계좌 embed — [UI SSOT §4.5](./settlement-payment-order-detail-ui-fields-backend-handoff.md#45--백엔드-요청-p0--강사-프로필계좌-현재-ui--) | 풀페이지·산출 내역서 **성별/생년·연락처·주소·계좌** (`-` 해소) |
| P1 | `GET /settlements/aggregates` (목록용) | 상세와 무관, 목록 성능 |

---

## 6. 신규 전용 API 필요 여부 — 결론

| 범위 | 신규 API 필수? |
|------|----------------|
| **상세 정산 라인 목록** (프로그램별 강사 라인 / 강사별 프로그램 라인) | **아니오** — 기존 `GET /settlements` scoped query로 충분 (프론트 연동 완료) |
| **statementId** | **DTO 필드 추가** — `SettlementListItemResponse.statementId` (§4). 신규 endpoint 불필요 |
| **강사 기본정보·계좌** | **예 (또는 회원 API 조합)** · 화면 마스킹: **이름·은행명 plain** / 연락처·이메일·계좌번호·예금주만 ([§3.7](#37-개인정보-마스킹-정책--p0-서버-수정-요청-사람-이름-마스킹-금지)) · **발급·원문 열람은 unmask ([§3.8](#38-지급조서-발급원문--산출-내역서-unmask-api-p0))** |
| **참여 기관명·차시·프로그램 헤더** | **DTO 필드 추가** — [UI 필드 SSOT](./settlement-payment-order-detail-ui-fields-backend-handoff.md) |
| **일괄 확인·반려·산출서** | **예** — 기존 갭 문서 항목 |
| **강의비 책정·산정 기준 상세** | **아니오 (신규 API 불필요)** — **`GET /settlements/{id}` DTO 확장 필수** (§3.6). 회원 API 단독 불가 |

---

## 7. 스테이징 점검 (상세)

1. 목록에서 프로그램 행 클릭 → Network에 `GET /settlements?programId=` (및 `fromDate`/`toDate`) 확인
2. 강사별 탭에서 행 클릭 → `GET /settlements?instructorMemberId=` 확인
3. 상세 테이블 건수 = API 라인 건수 (동일 기간·동일 program/instructor)
4. 라인 「지급조서 확인」→ `PATCH .../confirm` 후 목록·상세 상태 일치
5. `statementId` 없는 라인 → confirm/산출서 버튼 비활성 또는 에러 (seed 데이터 점검)
6. 산출 내역서 → **`GET /settlements/{id}`** 응답에 `lectureFeeStandardTitle`(또는 `wageItemType`)·`items[].calculationDetail` 확인
7. 강사비 행 「산정 기준 상세 > 상세 보기」→ **등급별 강사비 모달** (「준비 중」 아님)

---

## 8. 문의

프론트: `features/settlement-management/`  
테스트: `admin-payment-orders-service.test.ts` (`buildPaymentOrdersDetailListParams`)
