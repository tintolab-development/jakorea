# 정산 항목 설정 — 구 항목 제거 + v2 누락 항목 추가 요청 (BE)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-28 |
| **대상** | 백엔드 (SettlementConfig current seed / GET / **PUT 저장**) |
| **우선순위** | **P0** |
| **화면** | CMS LNB `정산 관리` → `정산 항목 설정` (`/settlement-management/item-settings`) |
| **API** | `GET` · **`PUT`** `/api/admin/settlement-configs/current` |
| **카탈로그 SSOT** | v2 **13건** — [`settlement-item-settings-seed-v2.payload.json`](./settlement-item-settings-seed-v2.payload.json) · FE mock [`settlement-item-settings.ts`](../../src/data/mock/settlement-item-settings.ts) |

**관련**

- 시드·상세 핸드오프: [`settlement-item-settings-backend-seed-handoff-2026-08-27.md`](./settlement-item-settings-backend-seed-handoff-2026-08-27.md)
- 산출·enum: [`settlement-item-settings-category-backend-cursor-prompt.md`](./settlement-item-settings-category-backend-cursor-prompt.md)
- **사용 금지:** [`settlement-item-settings-dummy-seed-backend-request.md`](./settlement-item-settings-dummy-seed-backend-request.md) · [`settlement-item-settings-seed.payload.json`](./settlement-item-settings-seed.payload.json) (v1 15건)

---

## 1. 요청 한 줄

`GET /api/admin/settlement-configs/current` 를 **v2 13건으로 맞춰 달라.** 상세 **저장은 PUT이 DB에 남고, 다음 GET에 그대로** 나와야 한다.

1. **추가:** current에 **아예 없는** v2 항목을 seed하고 GET에 내려 달라.  
   예: **기타 인건비** (`OTHER_LABOR`) — 서버 응답에 없어서 CMS 카드가 안 나온다.
2. **제거:** 구 v1 항목(보조 강사비, 다수인출강비, 단순인건비, 회의참석비, `교통비`, `교통비 (1사1교)`, `자원봉사자 활동비`)은 GET에서 빼 달라.
3. **저장:** CMS 상세 「저장」→ `PUT /api/admin/settlement-configs/current` (전체 upsert). 지급 요건·비고·한도·이용 수단·증빙·차시 금액을 **persist** 하고 GET round-trip.

프론트는 GET 배열을 **합성·이름 재작성하지 않는다.**  
없는 type은 카드가 없고, 있는 구 항목은 그대로 보인다.

---

## 2. 왜 지금 요청하는가

| 현상 | 원인 | FE가 하는 일 |
|------|------|----------------|
| **기타 인건비·제미나이 강사비 등 카드 없음** | GET `wageItems`에 해당 type **미포함** | 없음 → 그리지 않음 |
| 보조 강사비 등 구 카드가 보임 | GET에 v1 row가 **활성으로 포함** | 있음 → 그대로 그림 |
| 상세 저장 후 새로고침하면 시드/빈 값으로 복귀 | PUT `detailJson`·요건 필드를 안 저장하거나 GET에 안 실음 | remote 저장 시 **PUT 호출함** |

임금은 `useYn`을 보지 않으므로, 구 임금은 **배열에서 삭제**해야 목록에서 사라진다.  
누락 임금은 `useYn=true`로 **row를 만들어 GET에 실어야** 카드가 생긴다.

과거 정산 전표 이력을 위해 구 row를 남기더라도 **`/current` 응답에는 넣지 말 것.**

---

## 3. 추가 대상 (GET에 반드시 있어야 함)

아래는 “있으면 유지”가 아니라 **현재 GET에 없어서 시드·응답에 넣어 달라는 항목**이다.  
이미 내려오고 이름·type이 표와 같으면 그대로 두면 된다.

정렬: [`settlement-config-catalog-order.ts`](../../src/features/settlement-management/api/settlement-configs/settlement-config-catalog-order.ts)

### 3.1 임금 — GET 제목 필드는 **`name`** (PUT은 `itemName`)

`name`이 비고 `itemName`만 있으면 CMS 카드가 `임금 항목`으로 떨어진다.

| 순서 | `wageItemType` | GET `name` | 비고 |
|------|----------------|------------|------|
| 1 | `TIER1` | 1급 강사비 | 있으면 유지 |
| 2 | `TIER2` | 2급 강사비 | 있으면 유지 |
| 3 | `TIER3` | 3급 강사비 | 있으면 유지 |
| 4 | `SPECIAL_LECTURE` | 특강 강사비 | 있으면 유지 |
| 5 | **`OTHER_LABOR`** | **기타 인건비** | **GET에 없음 → 추가 필수** |
| 6 | **`GEMINI`** | **제미나이 강사비** | GET에 없으면 **추가** |

`OTHER_LABOR` 시드 요지 (목록 카드 + **상세 시안 2026-08-28**):

- `layout`: `specialLecture` (조건 가로 표만 — 1급 `tier1` 산정·한도 행 없음)
- `iconKey`: `wage_other_labor`
- `description`: `금액 한도가 별도 적용되는 임금입니다.`
- **상세 본문(조건)은 시안과 동일 2행만.** 초기값에 **문구를 넣지 말 것.**

#### 3.1.1 기타 인건비 상세 (GET/시드)

팝업 구성 SSOT = 시안. **특강 강사비와 layout만 같고, 지급 요건·비고 문구는 복사하지 않는다.**

| UI | 시드 필드 | 초기값 |
|----|-----------|--------|
| 제목 | GET `name` | `기타 인건비` |
| 설명 | `description` | `금액 한도가 별도 적용되는 임금입니다.` |
| 조건 › **지급 요건** | `qualificationLines` (또는 `detailJson.qualificationLines`) | **`[]` / 생략.** 빈 textarea + placeholder `내용을 입력해 주세요.` |
| 조건 › **비고** | `remarkLines` | **`[]` / 생략.** 동일 placeholder |

시안에 **없는** 것 (시드·GET에 넣지 말 것):

- 산정 기준(시간·단위) 행, 최대 한도(`maxLimitWon` / `amount`)
- 특강 문구 (`국내외 해당 분야 최고 권위자…`, 유급 내부직원 비고 등)
- 1급 카탈로그 기본값(지급 요건 5줄, 비고 2줄, 한도 500,000)
- 구 `SIMPLE_LABOR` / 보조 강사비 상세

`detailJson` 예: `{"compareKind":"standard"}`. `qualificationLines`·`remarkLines`는 **빈 배열**. null 대신 특강/1급 카피를 채우지 말 것.

#### 3.1.2 제미나이 강사비 상세 (GET/시드)

팝업 구성 SSOT = 시안. **기타 인건비와 다름** — 조건 문구가 있고, **산정 기준 1~4차시** 행이 있다. `layout`: `gemini`.

| UI | 시드 필드 | 시안 값 (그대로) |
|----|-----------|------------------|
| 제목 | GET `name` | `제미나이 강사비` |
| 설명 | `description` | `제미나이 프로그램에서 사용되는 강사 임금입니다.` |
| 조건 › **지급 요건** | `qualificationLines` | `["제미나이 프로그램에서 사용되는 강사 임금"]` |
| 조건 › **비고** | `remarkLines` | 아래 2줄 **순서·문자열 일치** |
| 산정 기준 › **1차시** | `detailJson.session1Won` 또는 `rateItems[0]` | `0` |
| 산정 기준 › **2차시** | `session2Won` / `rateItems` unitCount=2 | `170000` |
| 산정 기준 › **3차시** | `session3Won` / unitCount=3 | `220000` |
| 산정 기준 › **4차시** | `session4Won` / unitCount=4 | `270000` |

비고 2줄:

1. `실적보고서를 기반으로 차시 산출하여 금액 산정`
2. `별도의 지급조서 작성 및 확인 절차 없이 계좌 지급 대상 목록으로 노출 및 처리`

`detailJson` 예:

```json
{
  "session1Won": 0,
  "session2Won": 170000,
  "session3Won": 220000,
  "session4Won": 270000
}
```

`rateItems` 병행 가능: `[{ "unitCount": 1, "amount": 0 }, { "unitCount": 2, "amount": 170000 }, { "unitCount": 3, "amount": 220000 }, { "unitCount": 4, "amount": 270000 }]`

시안에 **없는** 것: 1급 시간·한도 행, 특강 `unitChoice`, 기타 인건비처럼 빈 요건. 차시 금액을 비우거나 특강 layout으로 내려주지 말 것.

### 3.2 지급 — 목록 시안 6건 (GET `itemName` · `description` · `useYn: true` · `paymentItemType`)

**목록 SSOT = 2026-08-28 시안(총 6건).** GET `paymentItems` 활성 6건의 **제목·설명·순서**가 아래와 **문자열 일치**해야 한다.  
구 카드(`교통비`, `교통비 (1사1교)`, `회의참석비`, `자원봉사자 활동비`)를 rename만 해서 맞추지 말 것. type·이름·설명이 다르면 **삭제 후 아래 row로 추가**.

| 순서 | `paymentItemType` | GET `itemName` | GET `description` (시안) |
|------|-------------------|----------------|--------------------------|
| 1 | `TRANSPORT_INSTRUCTOR` | **강사 교통비** | 편도 30km 이상 이동 시 지원되는 비용입니다. |
| 2 | `TRANSPORT_STUDENT` | **교통비(학생)** | 편도 30km 이상 이동 시 지원되는 비용입니다. |
| 3 | `MEAL` | 식사비 | 식사 시 지원되는 비용입니다. |
| 4 | `LODGING_GENERAL` | 숙박비 | 타지로 출장 시 지원되는 비용입니다. |
| 5 | `LODGING_1C1S` | **숙박비 (1사1교)** | 타지로 출장 시 지원되는 비용입니다. |
| 6 | `ACTIVITY` | **활동비** | 활동비로 지원되는 비용입니다. |

시안에 **없는** 지급 카드 (GET에 있으면 실패):

| 구 카드명 | 하면 안 되는 처리 |
|-----------|-------------------|
| 교통비 | `강사 교통비`로 이름만 바꾸면 안 됨. `TRANSPORT_INSTRUCTOR` row를 **새로** 두고 구 `교통비`는 제거 |
| 교통비 (1사1교) | **교통비(학생)이 아님.** 이 카드는 제거. 교통비(학생)는 `TRANSPORT_STUDENT` **별도 추가** |
| 회의참석비 | 제거. 시안 6건에 없음 |
| 자원봉사자 활동비 | `활동비`로 **itemName을 이 문자열로** 바꾸거나 구 row 삭제 후 `ACTIVITY` 추가 |

`숙박비 (1사1교)`는 시안에 **있음** — 지우지 말 것. `교통비 (1사1교)`와 다름.

#### 3.2.1 강사 교통비 상세 (GET/시드)

팝업 구성 SSOT = 시안. `paymentItemType`: `TRANSPORT_INSTRUCTOR`, `layout`: `transport`.  
**교통비(학생)과 다름** (대중교통·증빙 필요·KTX 문구를 넣지 말 것). 구 카드명 `교통비`를 이 상세로 **rename만** 하지 말 것.

| UI | 시드 필드 | 시안 값 |
|----|-----------|---------|
| 제목 | GET `itemName` | `강사 교통비` |
| 설명 | `description` | `편도 30km 이상 이동 시 지원되는 비용입니다.` |
| 조건 › **지급 요건** | `qualificationLines` | 아래 1줄 |
| 조건 › **비고** | `remarkLines` | 아래 1줄 |
| 산정 기준 › **산정 기준 단위** | `minDistanceKm` 또는 `basisHours` | `30` · 접미 `km(편도) 초과 시` |
| 산정 기준 › **이용 수단** | `transportCommuteMode` | **`private_car`** (자차 선택). `public_transit` / `user_choice` 아님 |
| 산정 기준 › **증빙 자료 제출 여부** | `evidenceSubmission` | **`not_required`** (불필요). `required` 아님 |

지급 요건:

- `네이버 지도를 기준으로, 입력된 강사 자택 주소 및 강의 장소 기준으로 거리 및 유류와 톨비가 고려된 금액 자동 산출`

비고:

- `실비 영수증이 없을 경우 강사 교통비를 지급하지 않는 것이 원칙이나, 팀별 판단에 따라 편도 교통비 영수증만으로도 왕복 교통비를 지급`

`detailJson` 예:

```json
{
  "transportCommuteMode": "private_car",
  "evidenceSubmission": "not_required",
  "minDistanceKm": 30,
  "qualificationLines": [
    "네이버 지도를 기준으로, 입력된 강사 자택 주소 및 강의 장소 기준으로 거리 및 유류와 톨비가 고려된 금액 자동 산출"
  ],
  "remarkLines": [
    "실비 영수증이 없을 경우 강사 교통비를 지급하지 않는 것이 원칙이나, 팀별 판단에 따라 편도 교통비 영수증만으로도 왕복 교통비를 지급"
  ]
}
```

시드 참고: `taxableYn: true`, `useYn: true`. 한도 행은 시안에 없음.

#### 3.2.2 교통비(학생) 상세 (GET/시드)

팝업 구성 SSOT = 시안. `paymentItemType`: `TRANSPORT_STUDENT`, `layout`: `transport`.  
**강사 교통비와 다름** (자차·증빙 불필요·강사 자격 문구를 넣지 말 것). **구 `교통비 (1사1교)`와 다름.**

| UI | 시드 필드 | 시안 값 |
|----|-----------|---------|
| 제목 | GET `itemName` | `교통비(학생)` |
| 설명 | `description` | `편도 30km 이상 이동 시 지원되는 비용입니다.` |
| 조건 › **지급 요건** | `qualificationLines` | 아래 2줄 **순서·문자열 일치** |
| 조건 › **비고** | `remarkLines` | `["실비 영수증 필수 제출"]` |
| 산정 기준 › **산정 기준 단위** | `minDistanceKm` 또는 `basisHours` / `detailJson.minDistanceKm` | `30` · 접미 `km(편도) 초과 시` |
| 산정 기준 › **이용 수단** | `transportCommuteMode` | **`public_transit`** (대중교통 선택). `private_car` / `user_choice` 아님 |
| 산정 기준 › **증빙 자료 제출 여부** | `evidenceSubmission` | **`required`** (필요). `not_required` 아님 |

지급 요건 2줄:

1. `대중교통 이용비(KTX일반, 고속버스, 전세버스 등)`
2. `톨비의 경우, 별도 영수증 증빙 처리해서 산출`

`detailJson` 예:

```json
{
  "transportCommuteMode": "public_transit",
  "evidenceSubmission": "required",
  "minDistanceKm": 30,
  "qualificationLines": [
    "대중교통 이용비(KTX일반, 고속버스, 전세버스 등)",
    "톨비의 경우, 별도 영수증 증빙 처리해서 산출"
  ],
  "remarkLines": ["실비 영수증 필수 제출"]
}
```

시드 참고: `taxableYn: false`, `useYn: true`. 한도(`maxLimitWon`) 행은 시안에 없음.

#### 3.2.3 활동비 상세 (GET/시드)

팝업 구성 SSOT = 시안. `paymentItemType`: `ACTIVITY`.  
구 `자원봉사자 활동비`를 이름만 바꾸지 말 것. **한도 `50,000`은 구 시드 — 쓰지 말 것.**

| UI | 시드 필드 | 시안 값 |
|----|-----------|---------|
| 제목 | GET `itemName` | `활동비` |
| 설명 | `description` | `활동비로 지원되는 비용입니다.` |
| 조건 › **지급 요건** | `qualificationLines` | `["참여자에게 지급되는 지원비"]` |
| 조건 › **비고** | `remarkLines` | **`[]`** (빈 textarea. 내용 넣지 말 것) |
| 산정 기준 › **최대 한도 금액** | `maxLimitWon` (`maxAmount` 동기화) | **`1000000`** (1,000,000원) |
| 산정 기준 › **증빙 자료 제출 여부** | `evidenceSubmission` | **`required`** (필요) |

시안에 **없는** 것: 산정 기준 단위(시간·km) 행, 이용 수단, 교통비 문구.

`layout`: `meal` 또는 `volunteerActivity` (조건 2행 + 한도·증빙. 1급 `tier1` / 교통 `transport` 아님).

`detailJson` 예:

```json
{
  "evidenceSubmission": "required",
  "qualificationLines": ["참여자에게 지급되는 지원비"],
  "remarkLines": []
}
```

`taxableYn: false`, `useYn: true`. [`settlement-item-settings-seed-v2.payload.json`](./settlement-item-settings-seed-v2.payload.json) p-6의 `maxLimitWon: 50000`은 **폐기**. GET은 **1000000**.

### 3.3 공제 1

| `itemName` |
|------------|
| 일용근로자 원천징수세액 |

합계 **13건**. 상세 수치·`detailJson`은 [`settlement-item-settings-seed-v2.payload.json`](./settlement-item-settings-seed-v2.payload.json).

---

## 4. 제거 대상 (current에서 없어야 함)

구 시드 CASE-05·06·07·08·09·13. **제목 또는 type이 GET에 있으면 실패.**

### 4.1 임금 (`wageItems`) — 배열에서 제거 (`useYn=false` 불가)

| 구 카드명 | `wageItemType` | 구 layout |
|-----------|----------------|-----------|
| **보조 강사비** | `ASSISTANT` | `assistantInstructor` |
| **다수인출강비** | `MULTI_INSTRUCTOR` | `multiInstructor` |
| **단순인건비** | `SIMPLE_LABOR` | `simpleLabor` |

### 4.2 지급 (`paymentItems`) — current 활성에서 제거

시안 지급은 **6건**이다. 아래가 GET에 있으면 실패.

| 구 카드명 | 비고 |
|-----------|------|
| **회의참석비** | layout `meetingAttendance` |
| **교통비** (단일 카드) | 강사/학생 미분리 |
| **교통비 (1사1교)** | **학생 교통비도, 숙박비 (1사1교)도 아님** |
| **자원봉사자 활동비** | 시안 카드명은 **활동비** |

### 4.3 혼동 금지

| 제거 | **시안 (GET에 있어야 함)** |
|------|---------------------------|
| 단순인건비 `SIMPLE_LABOR` | **기타 인건비 `OTHER_LABOR` — 별도 row** |
| 교통비 | **강사 교통비** `TRANSPORT_INSTRUCTOR` — 별도 row |
| 교통비 (1사1교) | **교통비(학생)** `TRANSPORT_STUDENT` — 별도 row. 구 카드를 이 이름으로 바꾸지 말 것 |
| 자원봉사자 활동비 | **활동비** `ACTIVITY` |
| — | **숙박비 (1사1교)** `LODGING_1C1S` (유지) |

단순인건비를 기타 인건비로 **rename만** 하지 말 것. type이 `OTHER_LABOR`이고 GET `name`이 `기타 인건비`여야 한다.

---

## 5. PUT 저장 · GET round-trip (P0)

CMS 상세 모달 **저장**은 `PUT /api/admin/settlement-configs/current` 한 번이다. body는 **current config 전체** (wage + payment + deduction upsert, 항목 `id` 유지).  
OpenAPI `updateCurrentConfig`는 이미 있다. **요청: PUT으로 받은 상세 필드를 DB에 남기고, 직후 GET이 그와 같아야 한다.**

### 5.1 CMS가 보내는 것

| 구분 | PUT 필드 | 비고 |
|------|----------|------|
| 공통 | `itemName`, `description`, `layout`, `iconKey`, `emojiOverride` | 임금 GET 제목은 **`name`** ← PUT `itemName`을 GET `name`에 반영 |
| 임금 | `qualificationLines[]`, `remarkLines[]`, `basisHours`, `maxLimitWon`, `detailJson`, `rateItems` (제미나이) | flat + `detailJson` 둘 다 persist |
| 지급 | `maxLimitWon` / `maxAmount`, `taxableYn`, `useYn`, `paymentItemType`, **`detailJson`만** | OpenAPI `PaymentItemUpsertRequest`에 `qualificationLines` **없음** |
| 공제 | `detailJson` | 세율·요건·비고는 JSON 안 |

지급 `detailJson`에 실리는 키 (무시하면 교통비·활동비 저장 실패):

- `qualificationLines`, `remarkLines`
- `evidenceSubmission` (`required` \| `not_required`)
- `transportCommuteMode` (`private_car` \| `public_transit`) — `user_choice` 저장 금지
- `minDistanceKm` / `minOneWayKm`

제미나이 `detailJson`: `session1Won`~`session4Won` + `rateItems`.

`detailJson`은 **merge**. PUT에 없는 기존 키를 지우지 말 것. JSON parse 가능한 string으로 GET에 반환.

### 5.2 하면 안 되는 것

- PUT 200만 주고 GET은 시드 초기값 (활동비 한도 다시 50000, 요건 빈 배열 등)
- 지급 요건을 flat으로만 받고 `detailJson`을 drop
- 임금 PUT `itemName`을 저장하고 GET `name`을 비움

### 5.3 수용 (PUT 후 GET)

관리자 JWT:

1. `GET` current → 활동비 `id` 확인
2. `PUT` 동일 body에서 해당 항목만 `maxLimitWon: 999000`, `detailJson.qualificationLines: ["round-trip-test"]`
3. `GET` 다시 → 그 `id`의 한도 `999000`, `detailJson`(또는 임금 flat)에 `round-trip-test`
4. 강사 교통비: PUT `detailJson.transportCommuteMode=public_transit` → GET 동일
5. 기타 인건비: PUT `qualificationLines: ["저장테스트"]` → GET 동일 (빈 시드여도 **덮어쓰기 유지**)

항목 `id`는 PUT 전후 **불변**.

---

## 6. BE 작업

1. current에 없는 §3 항목 **insert** 후 GET에 포함. 특히 `OTHER_LABOR` / `GEMINI` / `TRANSPORT_INSTRUCTOR` / `TRANSPORT_STUDENT` / `ACTIVITY`.
2. §4 구 항목은 **local/dev** current에서 hard delete (또는 current GET omit). prod 마이그레이션에 넣지 말 것.
3. 시드를 **v2 13건**으로 교체. `seedLabel=settlement-config-catalog-v2-2026-08`. 페이로드: [`settlement-item-settings-seed-v2.payload.json`](./settlement-item-settings-seed-v2.payload.json).
4. 폐기 type 신규 시드 금지: `ASSISTANT` `MULTI_INSTRUCTOR` `SIMPLE_LABOR` 및 지급 `MEETING`.
5. OpenAPI enum에 `OTHER_LABOR` `GEMINI` 및 지급 6종이 없으면 **추가** 후 GET에 직렬화.
6. **PUT persist:** `detailJson` + 임금 `qualificationLines`/`remarkLines`/`maxLimitWon`/`rateItems`를 DB에 저장. 지급 요건은 **detailJson 필수**. GET이 PUT과 같아야 함 (§5.3).

상세 산출 규칙은 핸드오프·category prompt.

---

## 7. 수용 기준

관리자 JWT로 `GET /api/admin/settlement-configs/current` 후:

**추가 (없으면 실패)**

- [ ] `wageItems`에 `wageItemType=OTHER_LABOR` **있고** `name === "기타 인건비"`
- [ ] 해당 항목 `qualificationLines` **길이 0** (또는 없음). `remarkLines` **길이 0**. 특강/1급 문구 없음
- [ ] 해당 항목에 `maxLimitWon` / 한도 `amount` **없음**(null). 산정 기준 행용 수치를 채워 보내지 않음
- [ ] `wageItems`에 `wageItemType=GEMINI` **있고** `name === "제미나이 강사비"` · `layout === "gemini"`
- [ ] 해당 항목 지급 요건 1줄·비고 2줄이 §3.1.2와 **문자열 일치**
- [ ] 1~4차시 금액 `0` / `170000` / `220000` / `270000` (`detailJson` 또는 `rateItems`)
- [ ] 활성 `paymentItems` **정확히 6건**, 순서·`itemName`이 §3.2 표와 일치
- [ ] `TRANSPORT_INSTRUCTOR` + `itemName === "강사 교통비"` · `layout === "transport"`
- [ ] 해당 항목 §3.2.1: 지급 요건 1줄(네이버 지도·유류·톨비), 비고 1줄, `minDistanceKm=30`, `transportCommuteMode=private_car`, `evidenceSubmission=not_required`
- [ ] `TRANSPORT_STUDENT` + `itemName === "교통비(학생)"` · `layout === "transport"`
- [ ] 해당 항목 §3.2.2: 지급 요건 2줄·비고 1줄, `minDistanceKm=30`, `transportCommuteMode=public_transit`, `evidenceSubmission=required`
- [ ] `MEAL` / `LODGING_GENERAL` / `LODGING_1C1S` 각각 `식사비` / `숙박비` / `숙박비 (1사1교)`
- [ ] `ACTIVITY` + `itemName === "활동비"`
- [ ] 해당 항목 §3.2.3: 지급 요건 1줄 `참여자에게 지급되는 지원비`, `remarkLines` 빈 배열, `maxLimitWon === 1000000`, `evidenceSubmission=required` (한도 50000 실패)
- [ ] `LODGING_1C1S.description` = `타지로 출장 시 지원되는 비용입니다.` (시안. 숙박비와 동일)
- [ ] `wageItems.length === 6` · `deductionItems` 1

**제거 (있으면 실패)**

- [ ] 응답에 없음: `보조 강사비`, `다수인출강비`, `단순인건비`, `회의참석비`, `교통비 (1사1교)`, `자원봉사자 활동비`
- [ ] `wageItemType`에 `ASSISTANT` `MULTI_INSTRUCTOR` `SIMPLE_LABOR` 없음
- [ ] 카드명 `교통비`만 있는 지급 항목 없음

**필드**

- [ ] 임금 제목은 GET **`name`** (PUT `itemName`만 주면 CMS는 `임금 항목`)
- [ ] 지급에 `paymentItemType` 있음

**PUT round-trip (§5.3)**

- [ ] PUT 후 GET: 활동비 `maxLimitWon`·`detailJson.qualificationLines` 유지
- [ ] PUT 후 GET: 강사 교통비 `transportCommuteMode` 유지
- [ ] PUT 후 GET: 기타 인건비 `qualificationLines` 유지 (시드 빈 배열이어도 덮어쓴 값)
- [ ] 항목 `id` PUT 전후 동일
- [ ] 임금 PUT `itemName` → GET `name` 반영

---

## 8. 백엔드 Cursor 프롬프트 (복붙)

```markdown
## 정산 항목 설정 — v2 누락 추가 + 구 카탈로그 제거 (P0)

GET /api/admin/settlement-configs/current 를 v2 13건으로 맞춰라.
CMS는 GET을 합성하지 않는다. 배열에 없으면 카드가 없고, 있으면 그대로 그린다.
임금은 useYn을 보지 않는다 → 구 임금은 삭제, 없는 v2 임금은 row를 만들어 GET에 실어라.

### 추가 (GET에 없으면 insert — 특히 기타 인건비)
임금 name + type:
  1급 강사비 TIER1, 2급 TIER2, 3급 TIER3, 특강 SPECIAL_LECTURE,
  기타 인건비 OTHER_LABOR (현재 미응답 → 필수 추가).
    상세 시안: 조건 표 = 지급 요건 + 비고 2행만. 둘 다 빈 배열(내용 없음).
    특강 문구·1급 5줄 요건·한도 500000 넣지 마라. layout=specialLecture.
  제미나이 강사비 GEMINI (없으면 추가). layout=gemini.
    조건: 지급 요건 1줄 "제미나이 프로그램에서 사용되는 강사 임금"
    비고 2줄: 실적보고서 차시 산출 / 지급조서 없이 계좌 지급 목록 노출
    산정 기준 1~4차시: 0 / 170000 / 220000 / 270000 (기타 인건비처럼 비우지 마라)
  GET 제목 필드는 name (itemName만 있으면 CMS가 "임금 항목")
지급 — 시안 6건 (itemName + description 문자열 일치, paymentItemType 필수):
  1 강사 교통비 TRANSPORT_INSTRUCTOR.
    상세: 지급 요건 네이버 지도·자택·강의장소·유류·톨비 자동 산출 1줄,
    비고 실비 없을 때 원칙 미지급·팀 판단 시 편도 영수증으로 왕복 가능,
    산정 30km(편도) 초과, 이용 수단=자차(private_car), 증빙=불필요(not_required).
    교통비(학생) 상세 복붙 금지.
  2 교통비(학생) TRANSPORT_STUDENT. itemName 정확히 이 문자열(학생 교통비 아님).
    구 "교통비 (1사1교)"를 이 이름으로 바꾸지 마라. 구 카드 삭제 + 이 type 추가.
    상세: 지급 요건 2줄(대중교통 이용비 / 톨비 영수증), 비고 "실비 영수증 필수 제출",
    산정 30km(편도) 초과, 이용 수단=대중교통(public_transit), 증빙=필요(required).
    강사 교통비(자차·증빙 불필요) 복붙 금지.
  3 식사비 MEAL / 식사 시 지원되는 비용입니다.
  4 숙박비 LODGING_GENERAL / 타지로 출장 시 지원되는 비용입니다.
  5 숙박비 (1사1교) LODGING_1C1S / 설명은 숙박비와 동일(타지로 출장 시…). 이 카드는 유지.
  6 활동비 ACTIVITY. itemName 활동비 (자원봉사자 활동비면 이 문자열로).
    상세: 지급 요건 "참여자에게 지급되는 지원비", 비고 빈 배열,
    최대 한도 1000000원 (50000 금지), 증빙=필요(required).
    산정 단위(시간/km)·이용 수단 행 없음.
공제: 일용근로자 원천징수세액

### 삭제 (current에 있으면 안 됨)
- wage: ASSISTANT 보조 강사비, MULTI_INSTRUCTOR 다수인출강비, SIMPLE_LABOR 단순인건비
- payment: 회의참석비, 카드명 "교통비", "교통비 (1사1교)", "자원봉사자 활동비"
- SIMPLE_LABOR를 OTHER_LABOR로 rename만 하지 마라. 기타 인건비는 별도 OTHER_LABOR row.
- 교통비 (1사1교) ≠ 교통비(학생). 교통비 (1사1교) 삭제 ≠ 숙박비 (1사1교) 유지.

### PUT persist (P0) — 조회만이 아님
CMS 상세 저장 = PUT /api/admin/settlement-configs/current 전체 upsert (id 유지).
지급 요건·비고·한도·이용수단·증빙·차시 금액을 DB에 남기고 다음 GET과 같아야 한다.
PaymentItem에 qualificationLines flat 없음 → detailJson에 넣고 GET에도 그대로.
detailJson merge (기존 키 삭제 금지). 임금 PUT itemName → GET name.
수용: 활동비 한도 PUT 999000 후 GET 유지. 기타 인건비 qualificationLines PUT 후 GET 유지.
강사 교통비 transportCommuteMode PUT 후 GET 유지.

dummy-seed CASE-05~07·08·09·13 / seed.payload.json 사용 금지.
seedLabel=settlement-config-catalog-v2-2026-08, local/dev only.
PUT 예시: settlement-item-settings-seed-v2.payload.json
상세: settlement-item-settings-backend-seed-handoff-2026-08-27.md
  · settlement-item-settings-category-backend-cursor-prompt.md
```
