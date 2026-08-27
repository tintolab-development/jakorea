# 정산 항목 설정 더미 시드 요청 (BE)

> **SUPERSEDED (2026-08-27):** 본 문서·[`settlement-item-settings-seed.payload.json`](./settlement-item-settings-seed.payload.json)은 **구 v1 (15건)** 이다. 사용하지 마라.
>
> **현행 SSOT:**
> - API·시드 핸드오프: **[settlement-item-settings-backend-seed-handoff-2026-08-27.md](./settlement-item-settings-backend-seed-handoff-2026-08-27.md)**
> - PUT payload v2: **[settlement-item-settings-seed-v2.payload.json](./settlement-item-settings-seed-v2.payload.json)**
> - 산출·enum: **[settlement-item-settings-category-backend-cursor-prompt.md](./settlement-item-settings-category-backend-cursor-prompt.md)**

> **2026-08-26 카탈로그 SSOT 이전:** 임금 6 · 지급 6 · 공제 1 및 산출 엔진 수정은 **[settlement-item-settings-category-backend-cursor-prompt.md](./settlement-item-settings-category-backend-cursor-prompt.md)** 를 사용하라. 본 문서 CASE-05~07·13(보조·다수인출강·단순인건비·회의참석비)과 `교통비 (1사1교)` 카드는 **구버전**이다.

CMS **정산 관리 → 정산 항목 설정** 화면의 카드 목록·상세 모달을 FE mock과 동일하게 검증할 수 있도록, **current config 1건 + item 15건** 더미 시드를 요청합니다.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-21 · **갱신** 2026-07-31 |
| **대상 화면** | LNB `정산 관리` → `정산 항목 설정` |
| **FE path** | `/settlement-management/item-settings` |
| **API** | `GET /api/admin/settlement-configs/current` (Orval / OpenAPI) |
| **모듈 플래그** | `VITE_REAL_API_MODULES=...,settlementConfigs` |
| **FE SSOT** | [`settlement-item-settings.ts`](../../src/data/mock/settlement-item-settings.ts) · [`settlement-item-setting-detail.mock.ts`](../../src/data/mock/settlement-item-setting-detail.mock.ts) |
| **BE 복붙 페이로드** | [`settlement-item-settings-seed.payload.json`](./settlement-item-settings-seed.payload.json) — CASE-01~15 + `detailJson` 객체 |

**관련 문서**

- [settlement-api-integration.md](./settlement-api-integration.md) — 조회 연동
- [settlement-api-backend-gaps.md](./settlement-api-backend-gaps.md) §9 — CRUD·layout 상세 필드 갭
- [settlement-item-setting-detail-modal-variants-spec.md](../../.cursor/rules/process/settlement-item-setting-detail-modal-variants-spec.md) — 상세 모달 변형

**Notion (CMS 기능정의서 · 화면=`정산 항목 설정`)**

| 페이지 | URL | 기획 상태 |
|--------|-----|-----------|
| 목록 개요 | https://app.notion.com/p/33af3e2a77d080ea8313e6df4aa2e538 | 프론트 완료 / 백엔드 확인 |
| 임금 항목 | https://app.notion.com/p/33af3e2a77d08024adb9dec30e3cd0de | 백엔드 확인 |
| 지급 항목 | https://app.notion.com/p/33af3e2a77d080fba08cc349ab4b8b5f | 백엔드 확인 |
| 공제 항목 | https://app.notion.com/p/33af3e2a77d080f89c02da51f89e0a62 | 개발 확인 완료 |
| 1~3급 상세 | https://app.notion.com/p/389f3e2a77d080f0b739c123618f04ed | 백엔드 확인 |
| 특강·기타 | https://app.notion.com/p/389f3e2a77d080b5965ef04114e3e58f | 백엔드 확인 |
| 제미나이 강사비 | https://app.notion.com/p/389f3e2a77d0802b84a5f7b1cefdba95 | 백엔드 확인 · FE mock `w-gemini` (v2 카탈로그) |
| 교통비 | https://app.notion.com/p/389f3e2a77d080a1841ff48d08cfa364 | 백엔드 확인 |
| 숙박비 | https://app.notion.com/p/389f3e2a77d0805580cbf9fd6a659a1e | 백엔드 확인 |
| 식사비 | https://app.notion.com/p/389f3e2a77d080edb8b2c577f605127d | 백엔드 확인 |
| 활동비 | https://app.notion.com/p/389f3e2a77d08042a95cc0fab74fc244 | 백엔드 확인 |

> **중요:** 프로그램 시드처럼 row를 여러 개 만드는 구조가 **아닙니다**.  
> **SettlementConfig current 1건** 안에 `wageItems`(7) + `paymentItems`(7) + `deductionItems`(1) = **15 items** 를 넣으면 됩니다.  
> OpenAPI에 `detailJson?: string` 이 있으므로 layout 전용 필드는 **stringify된 JSON**으로 실어 주세요 (§6.4 · payload 파일).

---

## 0. 이 문서를 읽는 법

1. **§1 Config envelope** 를 만든다.
2. **§2 마스터 리스트**의 CASE-01~15를 `wageItems` / `paymentItems` / `deductionItems`에 채운다.
3. 각 CASE의 **시드 레시피**(§4) 수치·문구를 FE mock과 동일하게 맞춘다.
4. **§3 layout 잠금표**로 상세 모달 UI가 열리는지 확인한다.
5. 우선순위: **P0(01~15) → P1 갭(16~20)**.

```text
P0 필수   CASE-01 ~ CASE-15   (FE mock 카드·상세 전량)
P1 권장   CASE-16 ~ CASE-20   (FE mock 없음 — 비활성·compareKind·장거리·세율카드 등)
```

Remote ON 시 FE는 **조회만** 합니다. 삭제·복제·상세 저장 UI는 비활성입니다.  
시드 목적은 목록 3섹션 + 각 카드 클릭 시 상세 layout이 맞게 열리는지 검증입니다.

---

## 1. Config envelope (필수 1시드)

`GET /api/admin/settlement-configs/current` → `SettlementConfigResponse`

| 필드 | 권장 값 | 비고 |
|------|---------|------|
| `configName` | `JA Korea 기본 정산 설정` | |
| `effectiveFrom` / `effectiveTo` | 유효 기간 (ISO date) | 만료 시 CASE-20 |
| `dailyIncomeThreshold` | `125000` | 일용 수익 기준 (CASE-15 자격 문구와 연계) |
| `earnedIncomeDeduction` | `150000` | 근로소득공제 (CASE-15) |
| `smallTaxExemptionThreshold` | `1000` | 미징수 한도 (CASE-15 `withholdingExclusionMaxWon`) |
| `useYn` | `true` | |
| `wageItems` | CASE-01~07 | 7건 |
| `paymentItems` | CASE-08~14 | 7건 (`useYn !== false`만 목록 노출) |
| `deductionItems` | CASE-15 | 1건 |

권장 시드 라벨: `정산 항목 설정_current` / `settlement-config-current-v1`

---

## 2. 마스터 케이스 리스트 (P0)

| CASE | FE mock id | title (권장, **정확히**) | 배열 | layout | `wageItemType` / 비고 | 한 줄 목적 |
|------|------------|--------------------------|------|--------|----------------------|------------|
| **CASE-01** | `w-1` | `1급 강사비` | wage | `tier1` | `TIER1` | 급수 강사비 SSOT · 한도 50만 |
| **CASE-02** | `w-2` | `2급 강사비` | wage | `tier1` | `TIER2` | 동일 UI · 한도 40만 · 자격 다름 |
| **CASE-03** | `w-3` | `3급 강사비` | wage | `tier1` | `TIER3` | 동일 UI · 한도 30만 · 자격 다름 |
| **CASE-04** | `w-4` | `특강 강사비` | wage | `specialLecture` | `SPECIAL_LECTURE` | 조건 표만 · 한도 null |
| **CASE-05** | `w-5` | `보조 강사비` | wage | `assistantInstructor` | `ASSISTANT` | 짧은 조건 + 시간·한도 5만 |
| **CASE-06** | `w-6` | `다수인출강비` | wage | `multiInstructor` | `MULTI_INSTRUCTOR` | 인원 구간별 한도 01·02 |
| **CASE-07** | `w-7` | `단순인건비` | wage | `simpleLabor` | `SIMPLE_LABOR` | 단순인건비·주휴·증빙 |
| **CASE-08** | `p-1` | `교통비` | payment | `transport` | — | 거리 30km · 사용자선택 · 증빙 필수 |
| **CASE-09** | `p-2` | `교통비 (1사1교)` | payment | `transport` | — | 자차 · 증빙 불필요 · 자격 단문 |
| **CASE-10** | `p-3` | `숙박비` | payment | `lodging` | — | 일·한도 15만 · 1인 1실 |
| **CASE-11** | `p-7` | `숙박비 (1사1교)` | payment | `lodging` | — | 한도 8만 · 고정 지급 |
| **CASE-12** | `p-4` | `식사비` | payment | `meal` | — | 시간·한도 3만 · 증빙 필수 |
| **CASE-13** | `p-5` | `회의참석비` | payment | `meetingAttendance` | — | 이하/초과 이중 한도 |
| **CASE-14** | `p-6` | `자원봉사자 활동비` | payment | `volunteerActivity` | — | meal 동형 · 한도 5만 |
| **CASE-15** | `d-1` | `일용근로자 원천징수세액` | deduction | `withholdingDailyWorker` | — | 공제·세율 4종 |

카드 목록 description (목록 카드 문구):

| mock id | description |
|---------|-------------|
| w-1, w-2 | `상세 기준에 따라 적용되는 임금입니다.` |
| w-3 | `일반적으로 사용되는 강사 임금입니다.` |
| w-4 | `금액 한도가 별도 적용되는 임금입니다.` |
| w-5 | `각종 실기 실습 보조 요원에게 적용되는 임금입니다.` |
| w-6 | `출강 인원이 여러명일 때 적용되는 임금입니다.` |
| w-7 | `1인/1일 단순 근로 시 지원되는 비용입니다.` |
| p-1, p-2 | `편도 30km 이상 이동 시 지원되는 비용입니다.` |
| p-3 | `타지로 출장 시 지원되는 비용입니다.` |
| p-7 | `1사1교 프로그램에서 타지역 출장 시 지원되는 숙박 비용입니다.` |
| p-4 | `식사 시 지원되는 비용입니다.` |
| p-5 | `회의에 참석 시 지원되는 비용입니다.` |
| p-6 | `자원봉사자에게 지원되는 비용입니다.` |
| d-1 | `일용직 급여에서 원천징수하는 소득세액입니다.` |

목록 섹션 제목: `임금 항목` / `지급 항목` / `공제 항목`

FE mapper: 임금 `wageItemType` → 아이콘 (`TIER1`…`SIMPLE_LABOR`). 지급/공제는 **itemName 문자열**로 아이콘 추정 (`교통`/`숙박`/`식사`/`회의`/`자원봉사`).

---

## 3. 상세 layout 잠금표

상세 모달 UI는 `layout`(또는 FE가 id·type으로 추론)에 따라 갈립니다.

| layout | 대표 CASE | 상세 모달에 열리는 컨트롤 |
|--------|-----------|---------------------------|
| `tier1` | 01–03 | 산정 단위(시간) · 기준 시간 · compare 라디오 · **최대 한도** · 자격·비고 리치텍스트 (3열 기본/장거리 금액 UI는 mock에서 null) |
| `specialLecture` | 04 | 조건 표만 (지급 요건·비고) · 산정 단위「전체」 · 한도 null |
| `assistantInstructor` | 05 | 짧은 조건 + 시간·한도 |
| `multiInstructor` | 06 | 산정 **01**(시간당·인원≤5/6–10/11+) · 산정 **02**(시간·동일 구간 한도) |
| `simpleLabor` | 07 | 단순인건비(원) · 주휴수당(원) · 증빙 라디오 |
| `transport` | 08–09 | 거리(km) · 통근모드 · 증빙 · 자격·비고 |
| `lodging` | 10–11 | 일 · 한도(또는 지급액) · 증빙 · 자격 |
| `meal` | 12 | 시간 · 한도 · 증빙 |
| `meetingAttendance` | 13 | 산정01 이하시간·한도 · 산정02 초과시간·한도 |
| `volunteerActivity` | 14 | meal 동형 |
| `withholdingDailyWorker` | 15 | 자격 · 미징수 한도 · 근로소득공제 · 세율 4종 |
| `simple` | (fallback) | mock 카드 없음 — 미지 id용 |

동일 layout이라도 **수치·문구가 다르면 별도 item** (01–03, 08–09, 10–11).

---

## 4. P0 시드 레시피 (CASE별)

아래 값은 FE [`settlement-item-setting-detail.mock.ts`](../../src/data/mock/settlement-item-setting-detail.mock.ts) **그대로**입니다.  
OpenAPI flat 필드에 없는 키는 **layout별 extension / detail JSON** 으로 실어 주세요 (gaps §9).

공통 (대부분):

```json
{
  "compareKind": "standard",
  "basicFeeWon": null,
  "longDistanceFeeWon": null
}
```

---

### CASE-01 — `1급 강사비` (`w-1`, `tier1`, `TIER1`)

| 필드 | 값 |
|------|-----|
| `basisUnit` | `시간` |
| `basisHours` | `1` |
| `maxLimitWon` | `500000` |
| `qualificationLines` | `해당분야 최고의 전문가` / `전·현직 장관(급) 및 대학총장(급)` / `전·현직 국회의원, 대기업 총수, 국영기업체` / `정부 출연 연구기관장, 기업·기관, 단체의 장` / `사회 통념상 상기 자격에 준하는 자로서 교육운영상 사무총장이 인정하는 자` |
| `remarkLines` | `유급의 내부직원에게는 지급 불가` / `강의에 필요한 교재의 원고료, 강사 교통비(실비)는 필요사유에 따라 별도 지급 가능` |
| **상세 확인** | tier1 모달 · 한도 50만 · 자격 5줄 |

OpenAPI 매핑 예: `wageItemType=TIER1`, `name=1급 강사비`, `calculationUnit=시간`, `basisHours=1`, `maxLimitWon=500000`, `qualificationLines=[…]`, `layout=tier1`, `iconKey=wage_tier1`

---

### CASE-02 — `2급 강사비` (`w-2`, `tier1`, `TIER2`)

| 필드 | 값 |
|------|-----|
| `basisUnit` / `basisHours` | `시간` / `1` |
| `maxLimitWon` | `400000` |
| `qualificationLines` | `해당분야 최고의 전문가` / `차관(급)` / `대학교의 조교수 및 부교수 이상, 연구기관의 연구위원급` / `판검사 및 변호사, 공인회계사 등 전문자격증을 가진 자` / `언론인(부장급 이상)` / `사회 통념상 상기 자격에 준하는 자로서 교육운영상 사무총장이 인정하는 자` |
| `remarkLines` | CASE-01과 동일 2줄 |
| **상세 확인** | CASE-01과 **동일 layout**, 한도·자격만 다름 |

---

### CASE-03 — `3급 강사비` (`w-3`, `tier1`, `TIER3`)

| 필드 | 값 |
|------|-----|
| `basisUnit` / `basisHours` | `시간` / `1` |
| `maxLimitWon` | `300000` |
| `qualificationLines` | `해당분야 최고의 전문가` / `4급 이상 공무원, 박사학위 소지 5급 이하 공무원 및 전직 재단 임원` / `대학교의 조교수·강사, 연구기관의 연구원 등` / `사회 통념상 상기 자격에 준하는 자로서 교육운영상 사무총장이 인정하는 자` |
| `remarkLines` | CASE-01과 동일 2줄 |
| **상세 확인** | tier1 · 한도 30만 |

---

### CASE-04 — `특강 강사비` (`w-4`, `specialLecture`, `SPECIAL_LECTURE`)

| 필드 | 값 |
|------|-----|
| `basisUnit` / `basisHours` | `전체` / `1` |
| `maxLimitWon` | `null` |
| `qualificationLines` | `국내외 해당 분야 최고 권위자로 총장이 인정하는 자` |
| `remarkLines` | CASE-01과 동일 2줄 |
| **상세 확인** | 조건 표만 (산정·한도 입력 UI 축소) |

---

### CASE-05 — `보조 강사비` (`w-5`, `assistantInstructor`, `ASSISTANT`)

| 필드 | 값 |
|------|-----|
| `basisUnit` / `basisHours` | `시간` / `1` |
| `maxLimitWon` | `50000` |
| `qualificationLines` | `각종 실기 실습 보조 요원` |
| `remarkLines` | `매해 최저임금 반영하여 지급` |
| **상세 확인** | 짧은 조건 + 시간·한도 |

---

### CASE-06 — `다수인출강비` (`w-6`, `multiInstructor`, `MULTI_INSTRUCTOR`)

| 필드 | 값 |
|------|-----|
| `basisUnit` | `전체` |
| `maxLimitWon` | `null` |
| `qualificationLines` / `remarkLines` | `[]` |
| `multiInstructor01Basis` | `1` |
| `multiInstructor01MaxUnder5` | `500000` |
| `multiInstructor01Max6to10` | `720000` |
| `multiInstructor01Max11plus` | `950000` |
| `multiInstructor02BasisHours` | `1` |
| `multiInstructor02MaxUnder5` | `750000` |
| `multiInstructor02Max6to10` | `1000000` |
| `multiInstructor02Max11plus` | `1200000` |
| **상세 확인** | 인원 구간(≤5 / 6–10 / 11+) × 산정 01·02 한도 표 |

> OpenAPI `WageItemRateResponse`(`unitCount`/`amount`)만으로는 구간 6개가 모호할 수 있음 → layout 전용 필드 또는 rateItems 규칙을 문서화해 주세요.

---

### CASE-07 — `단순인건비` (`w-7`, `simpleLabor`, `SIMPLE_LABOR`)

| 필드 | 값 |
|------|-----|
| `basisUnit` / `basisHours` | `시간` / `1` |
| `maxLimitWon` | `null` |
| `simpleLaborWon` | `82560` |
| `weeklyHolidayAllowanceWon` | `82560` |
| `evidenceSubmission` | `not_required` |
| `qualificationLines` | `1인/1일(1일 8시간 기준) 월 60시간, 1개월 이상 근무시 4대보험 가입 필수` |
| `remarkLines` | `매해 최저임금 반영하여 지급` |
| **상세 확인** | 단순인건비·주휴·증빙「불필요」 |

---

### CASE-08 — `교통비` (`p-1`, `transport`)

| 필드 | 값 |
|------|-----|
| `basisUnit` / `basisHours` | `거리` / `30` |
| `maxLimitWon` | `null` |
| `transportCommuteMode` | `user_choice` |
| `evidenceSubmission` | `required` |
| `qualificationLines` | `교통비(KTX일반, 고속버스, 전세버스, 주유비 등)` / `자가용 이용 시 네이버 지도를 기준으로, 입력된 강사 자택 주소 및 강의 장소 기준으로 거리 및 유가가 고려된 금액 자동 산출` / `톨비의 경우, 별도 영수증 증빙 처리해서 산출` |
| `remarkLines` | `실비 영수증이 없을 경우 강사 교통비를 지급하지 않는 것이 원칙이나, 팀별 판단에 따라 편도 교통비 영수증만으로도 왕복 교통비를 지급` |
| **상세 확인** | 거리 30 · 통근「사용자 선택」 · 증빙 필수 |

OpenAPI: `itemName=교통비`, `layout=transport`, `useYn=true` (+ extension)

---

### CASE-09 — `교통비 (1사1교)` (`p-2`, `transport`)

| 필드 | 값 |
|------|-----|
| `basisUnit` / `basisHours` | `거리` / `30` |
| `transportCommuteMode` | `private_car` |
| `evidenceSubmission` | `not_required` |
| `qualificationLines` | `자가용 이용 시 네이버 지도를 기준으로, 입력된 강사 자택 주소 및 강의 장소 기준으로 거리·유류·톨비가 반영된 금액을 자동 산출합니다.` |
| `remarkLines` | `실비 영수증이 없을 경우 강사 교통비를 지급하지 않는 것이 원칙이나, 팀별 판단에 따라 편도 교통비 영수증만으로도 왕복 교통비를 지급할 수 있습니다.` |
| **상세 확인** | CASE-08과 **다른** 통근모드·증빙·자격 단문 (산정 UI 골격은 동일) |

---

### CASE-10 — `숙박비` (`p-3`, `lodging`)

| 필드 | 값 |
|------|-----|
| `basisUnit` / `basisHours` | `일` / `1` |
| `maxLimitWon` | `150000` |
| `evidenceSubmission` | `required` |
| `qualificationLines` | `1인 1실 기준` |
| `remarkLines` | `[]` |
| **상세 확인** | 일·한도 15만 · 증빙 필수 |

---

### CASE-11 — `숙박비 (1사1교)` (`p-7`, `lodging`)

| 필드 | 값 |
|------|-----|
| `basisUnit` / `basisHours` | `일` / `1` |
| `maxLimitWon` | `80000` |
| `evidenceSubmission` | `required` |
| `qualificationLines` | `숙박비 고정 지급` |
| `remarkLines` | `[]` |
| **상세 확인** | 한도(지급액) **8만** · 자격「고정 지급」(CASE-10과 구분) |

---

### CASE-12 — `식사비` (`p-4`, `meal`)

| 필드 | 값 |
|------|-----|
| `basisUnit` / `basisHours` | `시간` / `1` |
| `maxLimitWon` | `30000` |
| `evidenceSubmission` | `required` |
| `qualificationLines` | `1인 기준` |
| `remarkLines` | `[]` |
| **상세 확인** | 시간·한도 3만 · 증빙 |

---

### CASE-13 — `회의참석비` (`p-5`, `meetingAttendance`)

| 필드 | 값 |
|------|-----|
| `basisUnit` | `전체` |
| `maxLimitWon` | `null` |
| `qualificationLines` / `remarkLines` | `[]` |
| `meetingAttendance01BasisHours` | `2` (이하) |
| `meetingAttendance01MaxLimitWon` | `150000` |
| `meetingAttendance02BasisHours` | `2` (초과) |
| `meetingAttendance02MaxLimitWon` | `200000` |
| **상세 확인** | 이하 15만 / 초과 20만 이중 한도 |

---

### CASE-14 — `자원봉사자 활동비` (`p-6`, `volunteerActivity`)

| 필드 | 값 |
|------|-----|
| `basisUnit` / `basisHours` | `시간` / `1` |
| `maxLimitWon` | `50000` |
| `evidenceSubmission` | `required` |
| `qualificationLines` | `자원봉사자에게 지급되는 교통비, 식사비 등의 활동비(1일 기준)` |
| `remarkLines` | `[]` |
| **상세 확인** | meal과 동형 layout · 한도 5만 |

---

### CASE-15 — `일용근로자 원천징수세액` (`d-1`, `withholdingDailyWorker`)

| 필드 | 값 |
|------|-----|
| `qualificationLines` | `1일 일용근로자의 수익이 125,000원 초과인 경우` |
| `withholdingExclusionMaxWon` | `1000` |
| `withholdingEarnedIncomeDeductionWon` | `150000` |
| `withholdingTaxRateBusiness` | `3.3` |
| `withholdingTaxRateOther` | `8.8` |
| `withholdingTaxRatePrize` | `4.4` |
| `withholdingTaxRateInterview` | `22` |
| config 연계 | `dailyIncomeThreshold=125000`, `earnedIncomeDeduction=150000`, `smallTaxExemptionThreshold=1000` |
| **상세 확인** | 미징수·공제·세율 4종 UI |
| iconKey (목록) | `deduct_business_33` |

OpenAPI: `itemName=일용근로자 원천징수세액`, `layout=withholdingDailyWorker`, `useYn=true` (+ extension)

---

## 4.5 Notion ↔ FE mock 차이 (2026-07-31 대조)

기획(노션)과 **현재 FE 모달 mock**이 어긋난 부분입니다. **P0 시드는 FE mock 기준**으로 두고, 아래는 BE·기획 합의용입니다.

### 임금

| Notion (현행) | FE mock | 비고 |
|---------------|---------|------|
| 1·2·3급 강사비 | ✅ w-1~3 | 한도 50/40/30만 일치 |
| 특강 강사비 | ✅ w-4 | |
| 기타 인건비 | ❌ (단순인건비 w-7만) | 매핑 합의 |
| 제미나이 강사비 | ❌ | 차시 고정액 — P1 |
| ~~보조 / 다수인출강 / 단순인건비~~ (취소선) | ✅ w-5~7 살아 있음 | 시드 유지 vs `useYn=false` |

### 지급

| Notion (현행) | FE mock | 비고 |
|---------------|---------|------|
| 교통비(학생) / 교통비(강사) | 교통비 / 교통비(1사1교) | 네이밍·분리 축 다름 |
| 숙박비 일반 15만·증빙 / 1사1교 8만·증빙없음 | p-3 / p-7 | **p-7 FE는 evidence=required** — 기획은 불필요 |
| 식사비 | ✅ p-4 | |
| 활동비 (구 자원봉사자 활동비) | `자원봉사자 활동비` p-6 | rename |
| ~~회의참석비~~ | ✅ p-5 | 취소선 vs FE 존재 |

### 공제

| Notion | FE mock | 비고 |
|--------|---------|------|
| 일용 125,000 / 미징수 1,000 / 공제 150,000 / 세율 3.3·8.8·4.4·22 | ✅ d-1 | config threshold와 동일 |

---

## 5. P1 갭 케이스 (FE mock 없음 — 선택)

| CASE | 목적 | 시드 요지 |
|------|------|-----------|
| **CASE-16** | `useYn=false` | 지급/공제 1건 `useYn=false` → FE mapper가 **목록에서 숨김** |
| **CASE-17** | `compareKind` | `exceed` 또는 `below` 인 tier1 1건 (현재 전 mock=`standard`) |
| **CASE-18** | 1사1교 거리 금액 | tier1에 `basicFeeWon` / `longDistanceFeeWon` **숫자 채움** (mock은 null) |
| **CASE-19** | 공제 세율 카드 분리 | 3.3 / 8.8 / 4.4 / 22 **개별 카드** (FE는 icon 키만 있고 카드 seed 없음) |
| **CASE-20** | config 비활성 | envelope `useYn=false` 또는 `effectiveTo` 과거 |
| **CASE-21** | 제미나이 강사비 | Notion 1–4차시 고정액 · FE layout 미구현 — 타입/`detailJson`만 합의 |
| **CASE-22** | 기획 취소선 항목 | 보조·다수인출강·단순인건비·회의참석비 `useYn=false` 또는 미시드 |

---

## 6. API · 필드 사전

### 6.1 Endpoints

| Method | Path | FE 사용 |
|--------|------|---------|
| **GET** | `/api/admin/settlement-configs/current` | 카드 목록 (**연동됨**) |
| PUT | `/api/admin/settlement-configs/current` | OpenAPI 있음 · 화면 미연동 |
| DELETE | `/api/admin/settlement-configs/current` | 미연동 |
| POST | `/api/admin/settlement-configs/current/duplicate` | 미연동 |

### 6.2 OpenAPI vs FE mock 상세

| FE mock 필드 | OpenAPI (대략) | 비고 |
|--------------|----------------|------|
| `layout` | `WageItemResponse.layout` 등 (최근 스펙에 추가된 경우 있음) | **시드에 반드시 포함** 권장 |
| `iconKey` / `emojiOverride` | optional | 없으면 FE가 type/name으로 추정 |
| `basisHours`, `maxLimitWon`, `qualificationLines` | Wage 쪽 partial | Payment는 `maxAmount`/`maxLimitWon` 위주 |
| `transportCommuteMode` 등 layout 전용 | `detailJson` (string) | OpenAPI v9에 추가됨 |
| `evidenceSubmission` | `detailJson` | |
| `multiInstructor*` | `detailJson` (또는 `rateItems`) | 구간 6개 규칙 문서화 |
| `meetingAttendance*` | `detailJson` | |
| `withholding*` | `detailJson` + config threshold | |
| `simpleLaborWon` / `weeklyHolidayAllowanceWon` | `detailJson` | |
| `compareKind` / `basicFeeWon` / `longDistanceFeeWon` | `detailJson` | CASE-18 |

### 6.4 `detailJson` 저장 규칙

- OpenAPI: `WageItemResponse.detailJson?: string` / Payment·Deduction 동일.
- 시드·PUT 시 **객체를 `JSON.stringify`한 문자열**로 저장.
- FE mock 키 이름을 그대로 쓴다 ([`settlement-item-settings-seed.payload.json`](./settlement-item-settings-seed.payload.json) 참고).
- Flat에 이미 있는 `layout`, `basisHours`, `maxLimitWon`, `qualificationLines`, `remarkLines`는 flat 우선; `detailJson`에는 layout 전용만 넣어도 되고, mock 전체를 넣어도 됨(중복 허용).

시드 시 **최소**: 목록에 title·type(또는 name)·useYn·layout·한도·자격 줄이 보이도록.  
상세 모달까지 FE mock과 1:1이면 `detailJson`에 layout 전용 필드를 넣어 주세요.

### 6.3 임금 `wageItemType` ↔ iconKey

| wageItemType | iconKey |
|--------------|---------|
| `TIER1` | `wage_tier1` |
| `TIER2` | `wage_tier2` |
| `TIER3` | `wage_tier3` |
| `SPECIAL_LECTURE` | `wage_special_lecture` |
| `ASSISTANT` | `wage_assistant` |
| `MULTI_INSTRUCTOR` | `wage_multi_instructor` |
| `SIMPLE_LABOR` | `wage_simple_labor` |

지급 icon: `pay_transport` / `pay_lodging` / `pay_meal` / `pay_meeting` / `pay_volunteer`  
공제 icon: `deduct_business_33` (및 88/44/22 — CASE-19)

---

## 7. 검증 체크리스트 (FE)

### P0

- [ ] `/settlement-management/item-settings` 에서 섹션 3개: 임금 **7** · 지급 **7** · 공제 **1**
- [ ] 각 title이 §2 표와 일치 (특히 `교통비 (1사1교)`, `숙박비 (1사1교)`)
- [ ] CASE-01~03: 상세 tier1 · 한도 50/40/30만 · 자격 문구 상이
- [ ] CASE-04: specialLecture (조건 표 위주)
- [ ] CASE-06: 인원 구간 한도 6칸 표시
- [ ] CASE-07: 82560 / 주휴 / 증빙 불필요
- [ ] CASE-08 vs 09: 통근모드·증빙·자격 차이
- [ ] CASE-10 vs 11: 한도 15만 vs 8만 · 자격 차이
- [ ] CASE-13: 이하 15만 / 초과 20만
- [ ] CASE-15: 세율 3.3 / 8.8 / 4.4 / 22 + 미징수 1000 + 공제 15만

### P1 (선택)

- [ ] CASE-16: useYn=false 항목이 목록에 안 보임
- [ ] CASE-18: 기본비·장거리비 필드에 값 표시

---

## 8. BE 회신 요청

1. current config **configId** + 구현한 **CASE 번호 목록**
2. 각 item의 **id** (숫자) · `itemName`/`name` · `layout` · `wageItemType`(임금)
3. layout 전용 필드(`multiInstructor*` 등)를 **어느 JSON 경로**에 실었는지 (또는 rateItems 규칙)
4. P1(CASE-16~20) 수용 여부

---

## 9. FE 코드 참조

| 역할 | 경로 |
|------|------|
| 목록 페이지 | `src/pages/settlement-management/settlement-item-settings-page.tsx` |
| 상세 모달 | `src/pages/settlement-management/settlement-item-setting-detail-modal.tsx` |
| 카드 mock | `src/data/mock/settlement-item-settings.ts` |
| 상세 mock | `src/data/mock/settlement-item-setting-detail.mock.ts` |
| Remote 매퍼 | `src/features/settlement-management/api/settlement-configs/map-settlement-config-sections.ts` |
| Query | `src/features/settlement-management/hooks/use-settlement-config-sections-query.ts` |
| OpenAPI schemas | `src/shared/api/generated/settlement/schemas/settlementConfigResponse.ts` 등 |
| BE 복붙 JSON | `docs/api/settlement-item-settings-seed.payload.json` |

**Last updated:** 2026-07-31
