# Cursor prompt — 정산 항목 설정 카탈로그·산출 엔진 (CMS 기획 SSOT)

아래 지시를 **이 백엔드 레포에서 실행**하라. 질문은 엔티티를 찾아도 판단이 안 될 때만 하라. 프론트 레포는 없다.

프론트 CMS 정산 관리 → **정산 항목 설정** 카탈로그가 2026-06 기획(취소선 반영) + 목록 시안으로 고정됐다. current config 마스터와 **정산 산출 엔진**을 이 SSOT에 맞춰라.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-26 |
| **화면** | CMS LNB `정산 관리` → `정산 항목 설정` (`/settlement-management/item-settings`) |
| **API** | `GET/PUT /api/admin/settlement-configs/current` 및 item duplicate/delete |
| **FE mock SSOT** | `apps/cms/src/data/mock/settlement-item-settings.ts` (임금 6 + 지급 6 + 공제 1 = **13건**) |
| **구 시드 문서** | [settlement-item-settings-dummy-seed-backend-request.md](./settlement-item-settings-dummy-seed-backend-request.md) — CASE-05~07·13은 **폐기**. 본 문서가 카탈로그 SSOT |

관련 프론트 핸드오프(산출 내역서 items type 7종·`calculationDetail`):  
`settlement-payment-order-detail-backend-handoff.md` §3.5·§3.6, `settlement-api-backend-gaps.md` §9(구문서 — GET only는 **오타**, OpenAPI에 PUT/layout/`detailJson` 이미 있음).

---

## Goal

1. `GET /api/admin/settlement-configs/current` 가 **13건**을 반환한다. 한글명·순서는 아래 마스터 표와 **정확히** 같다.
2. 구 카탈로그(보조 강사비, 다수인출강비, 단순인건비, 회의참석비, `교통비 (1사1교)` 카드)는 current에서 **제거**하거나 `useYn=false` 후 목록에 안 나온다.
3. 정산 산출(settlement items)이 아래 **비즈니스 규칙**을 따른다. 설정 카드 문구만 바꾸고 계산이 구규칙이면 실패다.
4. 시드는 **idempotent**. `seedLabel=settlement-config-catalog-v2-2026-08`.
5. `local` (또는 dummy seed profile)만. prod 마이그레이션에 넣지 마라.

완료 조건 (관리자 JWT):

- `GET /api/admin/settlement-configs/current`
  - `wageItems` 6건: `1급 강사비`, `2급 강사비`, `3급 강사비`, `특강 강사비`, `기타 인건비`, `제미나이 강사비` (이 순서)
  - `paymentItems` 6건 (`useYn !== false`): `강사 교통비`, `학생 교통비`, `식사비`, `숙박비`, `숙박비 (1사1교)`, `활동비` (이 순서)
  - `deductionItems` 1건: `일용근로자 원천징수세액`
- `wageItemType` enum: `TIER1` `TIER2` `TIER3` `SPECIAL_LECTURE` `OTHER_LABOR` `GEMINI`
- `paymentItemType` enum: `TRANSPORT_INSTRUCTOR` `TRANSPORT_STUDENT` `MEAL` `LODGING_GENERAL` `LODGING_1C1S` `ACTIVITY`
- 지급 항목만 `POST .../items/{itemKind}/{itemId}/duplicate` · `DELETE .../items/{itemKind}/{itemId}` 허용. 임금·공제는 **409**
- 산출 엔진 수용 기준(아래 §4) curl/테스트가 통과한다

---

## Out of scope / 금지

- 상세 모달 **필드 저장 UI 스키마**를 프론트 모달 시안 없이 새로 만들지 마라. 계산에 필요한 `detailJson`/명시 필드만 P0.
- 산출 내역서 라벨에서 교통비를 `강사 교통비`/`학생 교통비`로 **쪼개 노출하지 마라**. 지급조서·산정 상세 타이틀은 카드명과 무관하게 **「교통비」**. `SettlementFrontendItemResponse.type` 은 `transportation` 유지. 분기는 `paymentItemType` 또는 `calculationDetail.layout`.
- 구 CASE-05 보조 / CASE-06 다수인출강 / CASE-07 단순인건비 / CASE-13 회의참석비를 current 활성 시드에 넣지 마라.
- Gemini 차시 환산과 1~3급 차시 환산을 **한 함수로 합치지 마라**.
- `taxableYn` 고정값만으로 영수증 제출 후 비과세를 끝내지 마라. 산출 시점에 **실제 증빙 첨부 여부**로 재평가.
- Platform 정산 API와 테이블을 섞지 마라. CMS admin config + settlement calculation만.

---

## 1. 마스터 13건

목록 카드 설명은 FE mock과 동일하게 내려라 (`description`).

### 1.1 임금 (`wageItems`)

| 순서 | `wageItemType` | name | description | layout | 스코프 |
|------|----------------|------|-------------|--------|--------|
| 1 | `TIER1` | `1급 강사비` | 상세 기준에 따라 적용되는 임금입니다. | `tier1` | 공통. 한도 500,000 |
| 2 | `TIER2` | `2급 강사비` | 상세 기준에 따라 적용되는 임금입니다. | `tier1` | 한도 400,000 |
| 3 | `TIER3` | `3급 강사비` | 일반적으로 사용되는 강사 임금입니다. | `tier1` | 한도 300,000 |
| 4 | `SPECIAL_LECTURE` | `특강 강사비` | 금액 한도가 별도 적용되는 임금입니다. | `specialLecture` | 강사 승인 시 1시간 **또는** 하루(출강 1회) + 금액 |
| 5 | `OTHER_LABOR` | `기타 인건비` | 금액 한도가 별도 적용되는 임금입니다. | `specialLecture` | 특강과 동일 선택(1시간/하루) |
| 6 | `GEMINI` | `제미나이 강사비` | 제미나이 프로그램에서 사용되는 강사 임금입니다. | `gemini` | **제미나이 프로그램만** |

폐기 `wageItemType`: `ASSISTANT` `MULTI_INSTRUCTOR` `SIMPLE_LABOR`. 기존 row는 `useYn=false` 또는 삭제.

`iconKey` 권장: `wage_tier1` `wage_tier2` `wage_tier3` `wage_special_lecture` `wage_other_labor` `wage_gemini`.

### 1.2 지급 (`paymentItems`)

| 순서 | `paymentItemType` | itemName | description | layout | `taxableYn` 기본 | 증빙 기본 | 한도 |
|------|-------------------|----------|-------------|--------|------------------|-----------|------|
| 1 | `TRANSPORT_INSTRUCTOR` | `강사 교통비` | 편도 30km 이상 이동 시 지원되는 비용입니다. | `transport` | true | 불필요 | — |
| 2 | `TRANSPORT_STUDENT` | `학생 교통비` | 편도 30km 이상 이동 시 지원되는 비용입니다. | `transport` | false | 필수 | — |
| 3 | `MEAL` | `식사비` | 식사 시 지원되는 비용입니다. | `meal` | false(증빙 시) | 라디오 | 30,000 |
| 4 | `LODGING_GENERAL` | `숙박비` | 타지로 출장 시 지원되는 비용입니다. | `lodging` | false | 필수 | 150,000/일 |
| 5 | `LODGING_1C1S` | `숙박비 (1사1교)` | 1사1교 프로그램에서 타지역 출장 시 지원되는 숙박 비용입니다. | `lodging` | true | 불필요 | **80,000 고정**/일 |
| 6 | `ACTIVITY` | `활동비` | 활동비로 지원되는 비용입니다. | `meal`(동형) | false(증빙 시) | 라디오 | 50,000 |

구 `교통비` / `교통비 (1사1교)` 카드는 **강사/학생**으로 재분리. 1사1교 프로그램의 강사 교통비는 `TRANSPORT_INSTRUCTOR`를 쓴다 (별도 1사1교 교통비 카드 없음).

`iconKey` 권장: 교통 `pay_transport`, 숙박 `pay_lodging`, 식사 `pay_meal`, 활동 `pay_activity`.

### 1.3 공제 (`deductionItems`)

| itemName | layout | config envelope |
|----------|--------|-----------------|
| `일용근로자 원천징수세액` | `withholdingDailyWorker` | `dailyIncomeThreshold=125000`, `earnedIncomeDeduction=150000`, `smallTaxExemptionThreshold=1000` |

세율 설정값: 사업소득 3.3% / 기타소득 8.8% / 상금 4.4% / 면접·지원금·경품 22%. **카드는 1건**. 세율 4종을 별도 카드로 쪼개지 마라.

`iconKey`: `deduct_business_33`.

---

## 2. OpenAPI · DTO

기존 path를 재사용하라. 신규 전용 목록 API를 만들지 마라.

### 2.1 Enum (문서화 + 검증)

`WageItemResponse.wageItemType` / upsert: OpenAPI `enum` 6종. 자유 문자열 금지.

`PaymentItemResponse`에 **`paymentItemType`** 추가 (string enum 6종). `itemName`만으로 강사/학생·1사1교를 구분하지 마라.

`SettlementFrontendItemResponse.type` 7종 유지:

`instructor_fee` | `transportation` | `accommodation` | `meal` | `activity` | `withholding` | `other`

`items[].calculationDetail.layout` 권장:

| layout | 대상 |
|--------|------|
| `lectureFeeTier` | 1~3급 |
| `lectureFeeSpecial` | 특강·기타 인건비 |
| `lectureFeeGemini` | 제미나이 |
| `transportInstructor` | 강사 교통비 |
| `transportStudent` (또는 기존 `transportOneWay` + subtype) | 학생 교통비 |
| `lodgingGeneral` / `lodging1s1g` | 숙박 |
| `meal` / `activity` | 식사·활동 |

### 2.2 CRUD 가드

- `POST /api/admin/settlement-configs/current/items/{itemKind}/{itemId}/duplicate`
- `DELETE /api/admin/settlement-configs/current/items/{itemKind}/{itemId}`

`itemKind=payment` 만 성공. `wage` / `deduction` → **409** (메시지: 임금/공제 항목은 복제·삭제할 수 없습니다).  
config 전체 `DELETE /current` 는 운영 실수 방지를 위해 막거나 권한+확인. 프론트 목록 더보기는 지급 카드만.

임금 `wageItemType` 코드는 불변. 이름·설명·한도·`detailJson` 문구는 PUT으로 수정 가능 (`editableYn`).

### 2.3 Config envelope

기존 필드 유지: `configName`, `effectiveFrom`/`To`, `dailyIncomeThreshold`, `earnedIncomeDeduction`, `smallTaxExemptionThreshold`, `useYn`.

권장 시드: `configName=JA Korea 기본 정산 설정`, `effectiveFrom=2026-01-01`, `effectiveTo=2099-12-31`, `useYn=true`.

---

## 3. 산출 엔진 — 비즈니스 규칙 (P0)

### 3.1 1~3급 강사비 차시

강의 시간 → 차시 (30분 이상 올림):

| 시간 | 차시 |
|------|------|
| 0분 ~ 29분 | **미지급 (0)** |
| 30분 ~ 1시간 29분 | 1 |
| 1시간 30분 ~ 2시간 29분 | 2 |
| 2시간 30분 ~ 3시간 29분 | 3 |
| 이후 | 동일 패턴 |

프로그램 등록 시 급수별 **최대 한도 내** 금액.  
**1사1교만**: 자택–출강지 편도 **200km 초과** 시 추가 금액(장거리). 일반 프로그램에 장거리 가산 적용 금지.

### 3.2 특강 강사비 · 기타 인건비

강사 승인 시 **1시간 기준 vs 하루(출강 1회)** 선택 + 지급액. 자격/비고 문구는 계산에 쓰지 마라.

### 3.3 제미나이 강사비 (1~3급과 다름)

제미나이 프로그램에만 매칭. **1~4차시 고정액**.

| 차시 | 시간 |
|------|------|
| 1 | 00:00 ~ 1:29 (**미지급 구간 없음**) |
| 2 | 1:30 ~ 2:29 |
| 3 | 2:30 ~ 3:29 |
| 4 | 3:30 ~ |

고정액 4칸은 `detailJson` (예: `session1Won`…`session4Won`) 또는 `rateItems`. 시드 금액: 1차시 **0** / 2차시 **170,000** / 3차시 **220,000** / 4차시 **270,000**. 값이 없으면 산출 0 + 로그. 1~3급 미지급(0~29분) 규칙을 여기 넣지 마라.

### 3.4 교통비

공통: **편도 30km 미만이면 정산 신청 항목에 노출하지 않음** (금액 0으로 보여주지 말 것).

- **학생:** 대중교통 실비. 영수증 필수. **세금 미징수**. 산출 type=`transportation`, layout=`transportStudent`.
- **강사:** 네이버 지도 거리 기준 **왕복** 유류비 + 톨비. 영수증 없음. **세금 징수**. layout=`transportInstructor`.

지급조서 산정 상세 라벨은 둘 다 **교통비**.

### 3.5 숙박비

- 강사만. 학생은 대상 아님 (프로그램 등록에서 미선택 — 서버가 학생 숙박 라인을 만들지 마라).
- **일반:** 1일 최대 150,000. 증빙 검토 후 지급. 세금 미징수.
- **1사1교:** 1일 **80,000 고정**. 영수증 없음. 세금 징수.

### 3.6 식사비 · 활동비

한도 내 금액. 증빙 라디오. **영수증이 있으면 세금 미징수, 없으면 징수.**  
활동비는 식사비와 산정 동형. Notion 활동비 페이지 본문이 「식사비」로 복붙된 것은 **오탈자** — 항목 코드는 `ACTIVITY`.

### 3.7 공제 · 원천징수

적용: 프로그램 등록 시 공제 항목 1건.

세율 선택:

- 강사 **사업소득자** → 3.3%
- 그 외 강사·학생 → 기타소득 **8.8%**
- 상금 4.4% / 면접·지원금·경품 22%는 해당 지급 성격일 때만

조건:

- 1일 일용근로자 수익이 **125,000 초과**일 때만 산출
- 원천징수세액이 **1,000 이하이면 0원**

식:

```
(1일 급여 총액 - 근로소득공제 150,000) × 세율 - 산출세액의 55% = 원천징수세액
```

`items[]`에 `type=withholding`, **음수** `amount`. `items` 합 = `totalAmount` / `netPaymentAmount`와 정합.

**지급 항목 중 영수증 첨부 완료 분은 과세표준에 넣지 마라.**

### 3.8 지급조서 항목 노출 순서

`강사비 > 교통비 > 숙박비 > 활동비 > 식사비` (> 원천징수는 마지막 권장)

---

## 4. 수용 기준 (테스트로 고정)

단위 테스트 또는 local 시나리오:

1. **차시 1~3급:** 29분 → 0차시, 30분 → 1, 89분 → 1, 90분 → 2.
2. **차시 제미나이:** 10분 → 1차시 (0이 아님). 90분 → 2차시.
3. **장거리:** 1사1교 + 편도 201km → 장거리 금액 적용. 일반 프로그램 + 201km → 미적용.
4. **교통 30km:** 편도 29.9km → 교통 라인 없음. 30km 학생 → 대중교통 라인 + 비과세(증빙 있음). 30km 강사 → 왕복 유류+톨 + 과세.
5. **숙박 1사1교:** 금액 80,000 고정, 영수증 없어도 지급, 과세.
6. **원천징수:** 일 급여 300,000 / 사업소득 3.3% — 식과 1,000원 절사 적용. withholding 라인 음수. 일 급여 125,000 이하 → withholding 0 또는 라인 없음.
7. **CRUD:** 지급 duplicate 200. 임금 duplicate 409. 공제 delete 409.
8. **목록 GET:** 13건, 이름·순서 일치. `보조 강사비`/`회의참석비` 없음.

OpenAPI 재생성 후 `WageItemType` / `PaymentItemType` enum이 프론트 Orval에 반영 가능해야 한다.

---

## 5. 시드 JSON 요약 (v2)

`GET/PUT` 바디와 맞춰 upsert. `detailJson`은 **string**. 아래는 객체 표기.

```json
{
  "seedLabel": "settlement-config-catalog-v2-2026-08",
  "configName": "JA Korea 기본 정산 설정",
  "effectiveFrom": "2026-01-01",
  "effectiveTo": "2099-12-31",
  "dailyIncomeThreshold": 125000,
  "earnedIncomeDeduction": 150000,
  "smallTaxExemptionThreshold": 1000,
  "useYn": true,
  "wageItems": [
    {
      "wageItemType": "TIER1",
      "name": "1급 강사비",
      "description": "상세 기준에 따라 적용되는 임금입니다.",
      "calculationUnit": "시간",
      "layout": "tier1",
      "iconKey": "wage_tier1",
      "basisHours": 1,
      "maxLimitWon": 500000,
      "detailJson": { "compareKind": "standard" }
    },
    {
      "wageItemType": "TIER2",
      "name": "2급 강사비",
      "description": "상세 기준에 따라 적용되는 임금입니다.",
      "layout": "tier1",
      "iconKey": "wage_tier2",
      "basisHours": 1,
      "maxLimitWon": 400000
    },
    {
      "wageItemType": "TIER3",
      "name": "3급 강사비",
      "description": "일반적으로 사용되는 강사 임금입니다.",
      "layout": "tier1",
      "iconKey": "wage_tier3",
      "basisHours": 1,
      "maxLimitWon": 300000
    },
    {
      "wageItemType": "SPECIAL_LECTURE",
      "name": "특강 강사비",
      "description": "금액 한도가 별도 적용되는 임금입니다.",
      "layout": "specialLecture",
      "iconKey": "wage_special_lecture",
      "detailJson": { "unitChoice": ["hour", "day"] }
    },
    {
      "wageItemType": "OTHER_LABOR",
      "name": "기타 인건비",
      "description": "금액 한도가 별도 적용되는 임금입니다.",
      "layout": "specialLecture",
      "iconKey": "wage_other_labor",
      "detailJson": { "unitChoice": ["hour", "day"] }
    },
    {
      "wageItemType": "GEMINI",
      "name": "제미나이 강사비",
      "description": "제미나이 프로그램에서 사용되는 강사 임금입니다.",
      "layout": "gemini",
      "iconKey": "wage_gemini",
      "detailJson": {
        "session1Won": 0,
        "session2Won": 170000,
        "session3Won": 220000,
        "session4Won": 270000
      }
    }
  ],
  "paymentItems": [
    {
      "paymentItemType": "TRANSPORT_INSTRUCTOR",
      "itemName": "강사 교통비",
      "description": "편도 30km 이상 이동 시 지원되는 비용입니다.",
      "layout": "transport",
      "iconKey": "pay_transport",
      "taxableYn": true,
      "useYn": true,
      "detailJson": {
        "minOneWayKm": 30,
        "transportCommuteMode": "private_car",
        "evidenceSubmission": "not_required",
        "roundTrip": true
      }
    },
    {
      "paymentItemType": "TRANSPORT_STUDENT",
      "itemName": "학생 교통비",
      "description": "편도 30km 이상 이동 시 지원되는 비용입니다.",
      "layout": "transport",
      "iconKey": "pay_transport",
      "taxableYn": false,
      "useYn": true,
      "detailJson": {
        "minOneWayKm": 30,
        "transportCommuteMode": "public_transit",
        "evidenceSubmission": "required"
      }
    },
    {
      "paymentItemType": "MEAL",
      "itemName": "식사비",
      "description": "식사 시 지원되는 비용입니다.",
      "layout": "meal",
      "iconKey": "pay_meal",
      "maxLimitWon": 30000,
      "taxableYn": false,
      "useYn": true,
      "detailJson": { "evidenceSubmission": "required" }
    },
    {
      "paymentItemType": "LODGING_GENERAL",
      "itemName": "숙박비",
      "description": "타지로 출장 시 지원되는 비용입니다.",
      "layout": "lodging",
      "iconKey": "pay_lodging",
      "maxLimitWon": 150000,
      "taxableYn": false,
      "useYn": true,
      "detailJson": { "evidenceSubmission": "required" }
    },
    {
      "paymentItemType": "LODGING_1C1S",
      "itemName": "숙박비 (1사1교)",
      "description": "1사1교 프로그램에서 타지역 출장 시 지원되는 숙박 비용입니다.",
      "layout": "lodging",
      "iconKey": "pay_lodging",
      "maxLimitWon": 80000,
      "taxableYn": true,
      "useYn": true,
      "detailJson": { "fixedAmountWon": 80000, "evidenceSubmission": "not_required" }
    },
    {
      "paymentItemType": "ACTIVITY",
      "itemName": "활동비",
      "description": "활동비로 지원되는 비용입니다.",
      "layout": "meal",
      "iconKey": "pay_activity",
      "maxLimitWon": 50000,
      "taxableYn": false,
      "useYn": true,
      "detailJson": { "evidenceSubmission": "required" }
    }
  ],
  "deductionItems": [
    {
      "itemName": "일용근로자 원천징수세액",
      "layout": "withholdingDailyWorker",
      "iconKey": "deduct_business_33",
      "useYn": true,
      "description": "일용직 급여에서 원천징수하는 소득세액입니다.",
      "detailJson": {
        "withholdingExclusionMaxWon": 1000,
        "withholdingEarnedIncomeDeductionWon": 150000,
        "withholdingTaxRateBusiness": 3.3,
        "withholdingTaxRateOther": 8.8,
        "withholdingTaxRatePrize": 4.4,
        "withholdingTaxRateInterview": 22
      }
    }
  ]
}
```

제미나이 `sessionNWon` 이 0이면 **정책 금액을 운영/기획에 확인**하고 시드에 실제 원 단위를 넣어라. 0 고정으로 배포하지 마라.

1~3급 `qualificationLines`/`remarkLines` 는 구 FE mock(2026-07) 급수 자격 문구를 재사용해도 된다. 계산에 쓰지 않음.

---

## 6. 구현 순서

1. SettlementConfig / WageItem / PaymentItem / DeductionItem 엔티티를 찾아라.
2. enum·`paymentItemType`·CRUD 가드를 추가하라.
3. local 시더를 **v2 13건**으로 교체하라. 구 15건과 라벨이 겹치면 v1을 비활성하고 v2 upsert.
4. 산출 서비스(정산 신청·`GET /settlements/{id}` items)에 §3 규칙을 넣어라.
5. 스테이징/local에서 §4 체크리스트를 돌려라.
6. OpenAPI를 갱신하라. 프론트 Orval은 프론트가 한다.

---

## 7. 작업 후 보고

- 변경 파일·마이그레이션
- GET current 응답 요약 (13 name + type)
- 산출 테스트 목록과 결과
- 제미나이 차시 고정액에 넣은 숫자와 출처
- 구현하지 못한 항목 (네이버 지도 유류비 연동 등) — 우회(수동 금액)와 함께
