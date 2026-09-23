# 1사1교 · 임금/지급항목이 정산 테이블에 안 남음 + JSON 미러

**작성일:** 2026-09-23  
**우선순위:** P0 (정산 금액이 등록값과 다름) · P1 (JSON 이중 복본)  
**요청 대상:** Programs API · `programType=COMPANY_SCHOOL`  
**이 문서만으로 구현·검수할 수 있다.**

**범위:** 1사1교(`COMPANY_SCHOOL`)만. 일반 / UJAT / 교육받은 교사 / Gemini 기본 merge 규칙을 이 요청으로 바꾸지 말 것.

**같은 날 전 유형 요청 (이 문서 밖, 이미 전달):**

- 목록 프로그램명: [programs-detail-edit-list-title-backend-handoff-2026-09-23.md](./programs-detail-edit-list-title-backend-handoff-2026-09-23.md) **요청 A**
- 사업 기간 달력연도 강제 제거: 같은 파일 **요청 B**

교육받은 교사 A/B 두 API wipe 문서는 1사1교에 적용하지 않는다. 1사1교 공통정보 저장은 `PATCH /api/admin/programs/{id}` 한 번이다.

---

## 한줄

CMS 1사1교 등록·수정에서 넣은 **1~3급 강사비·장거리비·지급항목**은 `serviceDetailJson.program.generalCommonInfo`에만 남고, GET `settlementPolicy`는 **유형 기본값(1급 50만원, 장거리 교통비 포함)** 으로 따로 만들어진다.  
상세 화면과 이후 정산이 `settlementPolicy`를 보면 등록값과 다르다.  
추가로 GET `serviceDetailJson`에 루트 `generalCommonInfo`(임금 없음)를 붙여 같은 JSON에 값이 두 벌이다.

---

## 오늘 1사1교에서 저장이 안 되는 / 어긋나는 항목

관측 프로그램: `id=186014` · `GET /api/admin/programs/186014` · 2026-09-23  
제목: `기업가정신 스타트업 체험`

| # | CMS 공통정보 항목 | 등록 때 넣은 값 | GET에 남는 곳 | 실제 문제 |
|---|-------------------|-----------------|---------------|-----------|
| 1 | **1급 강사비 / 1급 장거리비** | 기본 170,000 · 장거리 30,000 | JSON `wageGradeRows`만. `settlementPolicy`는 500,000 / 500,000 | **정산 테이블에 등록 금액이 없음** |
| 2 | **2급 강사비 / 2급 장거리비** | 150,000 · 20,000 | JSON만. settlement 400,000 / 400,000 | 동일 |
| 3 | **3급 강사비 / 3급 장거리비** | 130,000 · 10,000 | JSON만. settlement 300,000 / 300,000 | 동일 |
| 4 | **지급 항목** | `교통비(일사일교)`, `숙박비(일사일교)` | JSON `paymentItems`만. settlement는 `TRANSPORTATION` + **`LONG_DISTANCE_TRANSPORTATION`** + `LODGING` | **폼에 없는 장거리 교통비가 생김** |
| 5 | **공제 항목** | `일용근로자 원천징수세액` | JSON 라벨 + settlement `deductionType=DAILY_WORKER_WITHHOLDING` | 의미는 맞음. 라벨/enum만 이중 |
| 6 | `serviceDetailJson` 루트 `generalCommonInfo` | FE는 보내지 않음 | BE가 제목·후원 등만 미러. **임금 키 없음** | 같은 GET에 신값(nested)과 빈 임금(루트)이 공존 |
| 7 | **사업 운영 기간** (요청 B) | 임의 기간 · 연도 걸침 | `business*`를 1/1~12/31이 아니면 **등록 거절** | 기간 자체가 저장 실패 |
| 8 | **목록 프로그램명** (요청 A) | 상세에서 고친 `mainTitle` | 상세 GET은 신값, 목록 GET은 생성명 | 목록만 구값 |

**저장되는 항목 (186014 기준, 이번 요청 대상 아님)**

대표/영문 제목, 세부 프로그램명(`detailedProgramId` / `detailedProgramName`), 후원사, 연락처, 소개·모집안내·추가 HTML, KPI 인원/학교/학급, 커리큘럼 문구·차시 테이블(JSON), 모집·운영 `startDate`/`endDate`, 신청 기간.  
이 값들은 1차 컬럼 또는 `program.generalCommonInfo`에 등록값으로 남아 있다.

OpenAPI `ProgramUpdateRequest.serviceDetailJson` 주석:  
`TRAINED_TEACHER`만 replace · 루트 미러 금지. **GENERAL 및 그 외 유형은 nested merge + editor mirror.**  
`COMPANY_SCHOOL`이 “그 외”로 분류되어 루트 미러가 붙는 것으로 보인다.

---

## 재현 (186014)

### 등록 시 FE가 넣는 임금 (화면 SSOT)

`POST /api/admin/programs` 의 `serviceDetailJson` (파싱 후):

```json
{
  "schemaVersion": 1,
  "program": {
    "generalCommonInfo": {
      "wageGradeRows": [
        { "grade": "1급 강사비", "pricing": "1시간 당 | 기본 : 170,000원 | 장거리 : 30,000원" },
        { "grade": "2급 강사비", "pricing": "1시간 당 | 기본 : 150,000원 | 장거리 : 20,000원" },
        { "grade": "3급 강사비", "pricing": "1시간 당 | 기본 : 130,000원 | 장거리 : 10,000원" }
      ],
      "paymentItems": "교통비(일사일교), 숙박비(일사일교)",
      "deductionItems": "일용근로자 원천징수세액"
    }
  }
}
```

FE 1사1교 adapter는 create/update에 **`wagePolicies` / `paymentItems`를 아직 넣지 않는다.**  
OpenAPI `ProgramCreateRequest` / `ProgramUpdateRequest`에는 두 배열이 있다. 서버가 JSON만 보고 정산 row를 안 만들면 기본값이 남는다.

### GET `settlementPolicy` (실제, 기본값)

```json
{
  "structuredPolicyYn": true,
  "programType": "COMPANY_SCHOOL",
  "longDistanceThresholdKm": 200.00,
  "deductionType": "DAILY_WORKER_WITHHOLDING",
  "wagePolicies": [
    { "feeGrade": "GRADE_1", "feeKind": "NORMAL", "calculationUnit": "HOUR", "amount": 500000, "maxAmount": 500000 },
    { "feeGrade": "GRADE_2", "feeKind": "NORMAL", "calculationUnit": "HOUR", "amount": 400000, "maxAmount": 400000 },
    { "feeGrade": "GRADE_3", "feeKind": "NORMAL", "calculationUnit": "HOUR", "amount": 300000, "maxAmount": 300000 },
    { "feeGrade": "GRADE_1", "feeKind": "LONG_DISTANCE", "calculationUnit": "HOUR", "amount": 500000, "maxAmount": 500000 },
    { "feeGrade": "GRADE_2", "feeKind": "LONG_DISTANCE", "calculationUnit": "HOUR", "amount": 400000, "maxAmount": 400000 },
    { "feeGrade": "GRADE_3", "feeKind": "LONG_DISTANCE", "calculationUnit": "HOUR", "amount": 300000, "maxAmount": 300000 }
  ],
  "paymentItems": [
    { "itemType": "TRANSPORTATION", "useYn": true },
    { "itemType": "LONG_DISTANCE_TRANSPORTATION", "useYn": true },
    { "itemType": "LODGING", "useYn": true }
  ]
}
```

### 기대 `settlementPolicy` (같은 등록)

```json
{
  "structuredPolicyYn": true,
  "programType": "COMPANY_SCHOOL",
  "deductionType": "DAILY_WORKER_WITHHOLDING",
  "wagePolicies": [
    { "feeGrade": "GRADE_1", "feeKind": "NORMAL", "calculationUnit": "HOUR", "amount": 170000, "maxAmount": 500000 },
    { "feeGrade": "GRADE_2", "feeKind": "NORMAL", "calculationUnit": "HOUR", "amount": 150000, "maxAmount": 400000 },
    { "feeGrade": "GRADE_3", "feeKind": "NORMAL", "calculationUnit": "HOUR", "amount": 130000, "maxAmount": 300000 },
    { "feeGrade": "GRADE_1", "feeKind": "LONG_DISTANCE", "calculationUnit": "HOUR", "amount": 30000, "maxAmount": 500000 },
    { "feeGrade": "GRADE_2", "feeKind": "LONG_DISTANCE", "calculationUnit": "HOUR", "amount": 20000, "maxAmount": 400000 },
    { "feeGrade": "GRADE_3", "feeKind": "LONG_DISTANCE", "calculationUnit": "HOUR", "amount": 10000, "maxAmount": 300000 }
  ],
  "paymentItems": [
    { "itemType": "TRANSPORTATION", "useYn": true },
    { "itemType": "LODGING", "useYn": true }
  ]
}
```

`LONG_DISTANCE_TRANSPORTATION` 은 폼에서 고르지 않았으면 `useYn: false` 이거나 배열에 넣지 않는다.  
`maxAmount` 는 급수 한도(1급 500,000 · 2급 400,000 · 3급 300,000)를 유지해도 된다. **`amount`가 등록 금액이어야 한다.**

---

## API

| # | Method | Path | 화면 |
|---|--------|------|------|
| A | `POST` | `/api/admin/programs` | 1사1교 등록 완료 (`programType=COMPANY_SCHOOL`) |
| B | `PATCH` | `/api/admin/programs/{id}` | 상세 공통정보 임금·지급항목 수정 |
| C | `GET` | `/api/admin/programs/{id}` | 상세 재조회 |

권한: 관리자 · 프로그램 생성/수정/조회.

---

## 서버가 할 일

### 1. 등록·수정 때 정산 정책을 등록값으로 저장 (P0)

`COMPANY_SCHOOL` create/update에서 `settlementPolicy` / `wagePolicies` / `paymentItems`를 **유형 기본 50만원으로 채우지 말 것.**

우선순위:

1. 요청 body에 `wagePolicies` / `paymentItems`가 있으면 그 배열을 persist.
2. 없고 `serviceDetailJson`에 `program.generalCommonInfo.wageGradeRows`가 있으면 그 금액으로 wage row를 만든다.
3. `paymentItems` 문자열(또는 라벨) → `TRANSPORTATION` / `LODGING` 등 enum. **문자열에 없는 항목을 기본으로 켜지 말 것.**
4. `deductionItems`가 `일용근로자 원천징수세액` 이면 `deductionType=DAILY_WORKER_WITHHOLDING`.

`pricing` 파싱:

- `1시간 당 | 기본 : {n}원 | 장거리 : {m}원`
- `feeKind=NORMAL` ← `기본`
- `feeKind=LONG_DISTANCE` ← `장거리`
- `feeGrade` ← `1급`/`2급`/`3급` → `GRADE_1`/`GRADE_2`/`GRADE_3`
- `calculationUnit=HOUR`

이미 만들어진 `186014` 는 다음 저장(PATCH) 또는 마이그레이션으로 JSON 금액과 settlement를 맞출 것. 기본 50만원을 유지하지 말 것.

### 2. GET에서 두 소스가 같아야 한다 (P0)

같은 프로그램에 대해:

| 화면 | JSON (`program.generalCommonInfo`) | `settlementPolicy` |
|------|-------------------------------------|-------------------|
| 1급 기본 | `170,000원` | `GRADE_1` + `NORMAL` + `amount=170000` |
| 1급 장거리 | `30,000원` | `GRADE_1` + `LONG_DISTANCE` + `amount=30000` |
| 지급 | `교통비(일사일교), 숙박비(일사일교)` | `TRANSPORTATION`, `LODGING` 만 `useYn: true` |

정산 엔진은 이 `settlementPolicy`를 쓴다. JSON만 맞고 테이블이 50만원이면 실패다.

### 3. `COMPANY_SCHOOL` JSON은 envelope 교체 · 루트 미러 금지 (P1)

`serviceDetailJson` persist:

```json
{
  "schemaVersion": 1,
  "program": { }
}
```

- 요청 body로 **교체**. 기존 blob과 deep merge 금지.
- 루트 `generalCommonInfo` / 루트 `title` / `sponsorId` / `businessStartDate` 평탄 미러 **금지**.
- 재조회 `serviceDetailJson` === 마지막 POST/PATCH 의 JSON (서버가 키를 추가하지 않음).
- OpenAPI `ProgramUpdateRequest.serviceDetailJson` 주석의 “그 외 유형 keep merge + editor mirrors”에서 **`COMPANY_SCHOOL`을 빼 주세요.** `TRAINED_TEACHER`와 같이 replace.

일반(`GENERAL_*`) merge는 이 요청으로 바꾸지 말 것.

---

## 지급항목 라벨 ↔ enum

| CMS / JSON 라벨 | `itemType` | 186014 등록 |
|-----------------|------------|-------------|
| `교통비(일사일교)` · `강사 교통비` | `TRANSPORTATION` | 사용 |
| `숙박비(일사일교)` · `숙박비 (1사1교)` | `LODGING` | 사용 |
| (폼에서 고른 경우만) | `LONG_DISTANCE_TRANSPORTATION` | **사용 안 함** |

폼에 없는 enum을 create 기본값으로 `useYn: true` 하지 말 것.

---

## 검수

새 `COMPANY_SCHOOL` 1건 + 기존 `186014` PATCH 1건.

- [ ] create 후 GET `settlementPolicy.wagePolicies` `GRADE_1` `NORMAL` `amount` === JSON 1급 기본 (예: 170000). 500000 아님
- [ ] 같은 GET 1급 `LONG_DISTANCE` `amount` === JSON 장거리 (예: 30000)
- [ ] 2급·3급도 JSON과 동일
- [ ] `paymentItems` 에 `LONG_DISTANCE_TRANSPORTATION` `useYn: true` 가 **폼에 없을 때 없음**
- [ ] `TRANSPORTATION` · `LODGING` 은 폼에서 고른 것만 true
- [ ] `deductionType=DAILY_WORKER_WITHHOLDING` (공제가 그 항목일 때)
- [ ] GET `serviceDetailJson`에 루트 `generalCommonInfo` 없음. `program.generalCommonInfo.wageGradeRows` 만
- [ ] 상세에서 1급 기본을 180,000으로 PATCH → GET JSON과 `settlementPolicy` 둘 다 180000
- [ ] 일반 프로그램 create/update JSON merge 동작이 이 배포로 바뀌지 않음

---

## 회신 부탁

1. create 때 `wagePolicies` 없이 JSON만 오면 서버가 파싱해 settlement를 채울지, FE가 `wagePolicies[]`를 반드시 보내야 하는지  
2. 기존 `186014` 등 이미 기본 50만원으로 만들어진 row를 PATCH 때 맞출지, 배치로 맞출지  
3. `COMPANY_SCHOOL` `serviceDetailJson`을 `TRAINED_TEACHER`와 같이 replace로 바꿀 수 있는지  
4. 정산 산출이 `settlementPolicy`만 보는지, JSON도 보는지  
