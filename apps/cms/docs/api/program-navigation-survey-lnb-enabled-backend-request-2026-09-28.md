# BE 수정 요청 — 프로그램 상세 「설문 관리」 navigation 활성 정책 (CMS 공통)

**작성일:** 2026-09-28  
**대상:** Admin CMS 프로그램 상세 풀페이지 LNB · `SURVEY`  
**대상 API:** `GET /api/admin/programs/{programId}/navigation`  
**적용 범위:** CMS에 **「설문 관리」 LNB가 있는** 모든 `canonicalProgramType` (아래 §0)  
**범위 제외:** Gemini(찾아가는 연수·실적) 등 **설문 관리 LNB가 없는** 유형 · Platform 회원 포털

## 백엔드 전달용 프롬프트

아래 요구사항은 **일반 프로그램만이 아니라**, 동일 navigation API를 쓰는 **1사1교 · 교육받은 교사 · UJAT** 등 CMS 설문 LNB가 있는 유형에 **공통** 적용한다.

**「설문 관리」** navigation `SURVEY.enabled` 계산을 **공통정보 「설문 진행 항목」**(유형별 overlay·keys, §0)과 일치시켜 주세요.

현재 BE는 `SURVEY.enabled=false` 시 reason으로 **「설문 사용 설정 또는 게시된 설문 폼이 없습니다.」** 등을 내려, 공통정보에서는 설문 진행 항목이 켜져 있는데 navigation만 비활성인 **불일치**가 발생합니다. CMS에서는 게시 전 설문·만족도·강의평가를 **등록·게시하기 위해** 설문 관리 메뉴에 진입해야 하므로, **「게시된 설문 폼 / FormBinding 유무」로 LNB를 끄면 안 됩니다.**

프로그램 유형별로 **다른 overlay 키·2depth 라벨**을 쓰더라도, **`SURVEY.enabled` 정책은 동일**해야 한다 (유형 간 간섭·일괄 `AND` 금지).

---

## 0. 적용 programType · 유형별 설문 SSOT

### 0.1 navigation `SURVEY` 를 내려야 하는 CMS 유형

| `canonicalProgramType` (예) | CMS 상세 화면 | 설문 LNB |
|-----------------------------|---------------|----------|
| `GENERAL_INDIVIDUAL` | 일반 프로그램 풀페이지 | ✅ |
| `GENERAL_ORGANIZATION` | 일반 프로그램 풀페이지 | ✅ |
| `GENERAL` (레거시) | 일반 (audience/types로 분기) | ✅ |
| `COMPANY_SCHOOL` / 1사1교 | `ProgramDetailFullPageModal` (1c-1s) | ✅ |
| `TRAINED_TEACHER` | 교육받은 교사 상세 | ✅ |
| `UJAT_*` (UJAT 초·중·고 등) | UJAT 프로그램 상세 | ✅ |
| Gemini · 기타 | 설문 LNB 없음 | ❌ `SURVEY` 항목 없거나 N/A |

Gemini는 본 문서 **비활성 예외**로 두고, UJAT·1사1교·교육받은 교사를 **일반과 동일 navigation 정책**으로 맞춘다.

### 0.2 공통정보 「설문 진행 항목」— 유형별 저장 위치 (상세 GET)

BE navigation 계산은 **상세 GET과 동일 JSON**을 읽어야 한다. overlay 우선, 없을 때만 `generalSurveyMenuKeys` fallback.

| 유형 | overlay `surveyItems` 키 (1순위 SSOT) | 체크 항목 (등록 양식) | `generalSurveyMenuKeys` (2순위) |
|------|----------------------------------------|----------------------|----------------------------------|
| 일반 · 교육받은 교사 | `registration.overlay` → `generalRegistration.basicInfo.surveyItems` | `survey`, `satisfaction`, `lecture_evaluation` (3종) | `serviceDetailJson.generalSurveyMenuKeys` |
| 1사1교 | `registration.overlay` → `economyRegistration.basicInfo.surveyItems` | 동일 3종 | 동일 |
| UJAT | `registration.overlay` → `ujat.basicInfo.surveyItems` | `survey`, `volunteer_satisfaction`, `school_satisfaction`, `lecture_evaluation` (4종) | 동일 컬럼 (PATCH 시 FE가 3종 envelope + 레거시 키 normalize) |

공통 규칙:

- overlay에 **`surveyItems` 객체가 있으면** 그 boolean이 SSOT (**전부 `false` = 0개 선택**, keys만 켜져 있어도 overlay wins).
- **`surveyItems` 키 자체가 없으면** `generalSurveyMenuKeys` 를 정규화해 사용 (FE `resolveGeneralSurveyMenuKeys` / UJAT overlay reader와 동일).

### 0.3 CMS LNB 2depth (FE 참고 — navigation metadata용)

| 유형 | 2depth (체크 ON 항목만) | 비고 |
|------|-------------------------|------|
| 일반 · 1사1교 · 교육받은 교사 | 설문조사 · 만족도조사 · 강의평가 | 만족도 audience는 프로그램 types에 따라 FE 분기 |
| UJAT | 설문조사 · 봉사단 만족도조사 · 학교 만족도조사 · 강의평가 | 일반 3종과 **분리** (program-type isolation) |

navigation `metadata.activeSurveyMenuKeys` 를 내릴 경우, **저장 envelope(`generalSurveyMenuKeys`) 기준 3종** 또는 UJAT는 **4종 raw 키** 중 팀 합의 1안을 OpenAPI에 고정한다. LNB 라벨과 1:1일 필요는 없으나 **체크 ON/OFF와 불일치하면 안 됨**.

---

## 1. 현상과 확인할 응답

### 1.1 화면·API 불일치 (유형 공통)

1. CMS 프로그램 상세 → 공통정보 「설문 진행 항목」에 항목이 **체크**되어 있다.
2. `GET /api/admin/programs/{programId}/navigation` 의 `SURVEY.enabled`는 **`false`** 이다.
3. reason이 **게시된 설문 폼 없음** 등 **운영/게시 상태**를 가리킨다.

→ **모든 유형**에서 공통정보 SSOT와 navigation SSOT가 **다른 기준**을 쓰면 동일 버그.

### 1.2 백엔드 확인 절차

```http
GET /api/admin/programs/{programId}
GET /api/admin/programs/{programId}/navigation
```

`programType` / `canonicalProgramType` 으로 §0.2 overlay 키를 선택해 `surveyItems` · `generalSurveyMenuKeys` 를 파싱한다.

navigation 발췌 (오류 패턴):

```json
{
  "key": "SURVEY",
  "label": "설문 관리",
  "enabled": false,
  "reason": "설문 사용 설정 또는 게시된 설문 폼이 없습니다."
}
```

다음이면 navigation 정책 오류 (유형 무관):

- overlay/keys 기준 **설문 진행 항목 1개 이상 ON** 인데 `SURVEY.enabled=false`
- `enabled=false` reason이 **게시된 설문 폼 / 바인딩 / responses 유무**만 근거
- 공통정보 PATCH 후 navigation 재조회에 설문 항목 변경 미반영
- **일반만 수정하고 UJAT·1사1교·TT는 기존 「폼 없음」 로직 유지** (유형 간 불일치)

---

## 2. CMS 제품 규칙 (navigation이 따라야 할 기준)

**§0.1 유형**에 대해 공통:

| depth | 규칙 |
|-------|------|
| **1depth 「설문 관리」** | 해당 유형에 설문 LNB가 있으면 **항상 노출** (`SURVEY.enabled=true`) |
| **2depth** | 공통정보 「설문 진행 항목」 **체크된 항목만** (§0.3) |
| **본문 (2depth 없음)** | 체크 **0개** → 「설문 진행 항목이 없습니다.」 (또는 유형별 empty copy) |

**「게시된 설문 폼 없음」** → LNB off ❌ · 각 2depth **empty state** ✅ (등록 CTA).

> **참고:** 교육받은 교사 더미 시드 문서(`trained-teacher-survey-lnb-cases-…`)에 「keys 길이 0 → LNB 숨김」 기술이 남아 있으면, **navigation·제품 규칙은 본 문서 SSOT**로 갱신한다. TT-S-01 같은 CASE는 **`SURVEY.enabled=true` + keys `[]`** 로 기대값을 맞춘다.

---

## 3. 기대 navigation 계약 — `SURVEY` (공통)

### 3.1 Canonical 키

```text
SURVEY
(legacy alias: surveys — FE 호환만, 신규는 SURVEY)
```

### 3.2 활성 계산

1. `canonicalProgramType` 이 §0.1 **설문 LNB 있음** → 아래 2·3 적용.  
2. **§0.2** 로 `activeSurveyKeys` (또는 UJAT 4종 raw) 계산.  
3. **`SURVEY.enabled` (CMS 공통):**

```text
설문 LNB를 제공하는 programType
→ SURVEY.enabled = true
→ reason = null
```

- 체크 **0개**여도 CMS는 1depth·empty 진입 → **enabled 는 true** (0개는 `activeSurveyKeys=[]` 로 표현).
- **`GET …/surveys` 목록 empty** · FormBinding 0건 → **enabled 변경 금지**.

**금지 (모든 유형):**

```text
ProgramFormBinding / 게시 상태 / responseCount 만으로 SURVEY.enabled = false
```

### 3.3 비활성 계산 (예외)

- §0.1 **설문 LNB 없음** (Gemini 등) → `SURVEY` 미포함 또는 `enabled=false` + 유형 미지원 reason
- 프로그램 상세 **조회 권한 없음** (권한 reason은 정책 reason과 구분)

**금지:** 체크 0개 + 「게시된 설문 없음」 reason 으로 CMS 설문 LNB off.

### 3.4 (선택) metadata

```json
{
  "key": "SURVEY",
  "label": "설문 관리",
  "enabled": true,
  "reason": null,
  "metadata": {
    "activeSurveyMenuKeys": ["survey", "satisfaction", "lecture_evaluation"],
    "surveyItemsSource": "generalRegistration.basicInfo.surveyItems"
  }
}
```

- UJAT 예: `activeSurveyMenuKeys` 에 `volunteer_satisfaction` 등 4종 또는 normalized keys — OpenAPI 한 안으로 고정.

### 3.5 구현 구조 (유형 간 간섭 방지)

- **`SURVEY.enabled` 계산기 1곳** + `programType` 별 **overlay path resolver** (§0.2).
- 일반용 「폼 게시됨」 조건을 UJAT·1사1교·TT에 **복사하지 말 것**.
- navigation 캐시/스냅샷이 상세 GET `registration.overlay` 보다 **오래된 surveyItems** 를 쓰지 않을 것.

---

## 4. 재현 · 검증 케이스

### 4.1 일반 기관형 — `programId=186009` (실측)

- `programType`: `GENERAL_ORGANIZATION`
- overlay: `generalRegistration.basicInfo.surveyItems` — 3종 `true`
- `generalSurveyMenuKeys`: `["survey","satisfaction","lecture_evaluation"]`
- navigation **현재:** `SURVEY.enabled=false` (오류)
- **기대:** `enabled=true`, reason null

### 4.2 1사1교 (`COMPANY_SCHOOL`)

- overlay: `economyRegistration.basicInfo.surveyItems`
- 등록 기본값이 3종 ON인 CASE가 많음 → keys·overlay **불일치** 시 navigation만 off 되면 **「설문 관리」 전체 누락** (과거 FE 버그).  
- **기대:** overlay/keys와 무관하게 **CMS 1depth는 enabled true**; 2depth는 체크 항목만.

검증: 1사1교 Primary 1건 — overlay 3종 ON + `GET …/surveys` empty → `SURVEY.enabled=true`.

### 4.3 교육받은 교사 (`TRAINED_TEACHER`)

- overlay: `generalRegistration.basicInfo.surveyItems` (일반과 동일 키)
- `generalParticipantTypes`: `["school_institution"]` — 만족도 **교사 only** (LNB 라벨은 「만족도조사」)
- **기대:** keys `[]` 이어도 `SURVEY.enabled=true` (empty 본문). keys `["survey"]` only → enabled true, metadata 1키.

검증: TT-S-02~09 유형 — navigation survey **enabled true** + keys 조합별 metadata 일치.  
(TT-S-01 none keys → enabled true, activeSurveyKeys [].)

### 4.4 UJAT

- overlay: `ujat.basicInfo.surveyItems` (4종)
- `generalSurveyMenuKeys` PATCH envelope는 FE normalize (봉사/학교 만족도 → legacy keys)
- **기대:** 4종 중 1개라도 true → `SURVEY.enabled=true`; **게시 전** UJAT도 동일.

검증: UJAT Primary 1건 — overlay survey only true, surveys API empty → `SURVEY.enabled=true`.

---

## 5. 구현 요구사항

1. **모든 §0.1 유형**에 동일 §3 정책 적용 (일반 only hotfix 금지).
2. FormBinding / 게시 / response 조건을 **LNB enable에서 제거** 또는 분리.
3. enable 입력 = 상세 GET `registration.overlay` + `generalSurveyMenuKeys` (유형별 path §0.2).
4. 공통정보·TT detail·1사1교 economy·UJAT basic PATCH 후 navigation **즉시** 반영.
5. `reason` 문구 — 게시 전 프로그램에 「게시된 설문 없음」 **금지**.
6. OpenAPI: `SURVEY` = CMS 설문 LNB 진입 (공통정보 체크·유형 기준), Gemini 등 예외 명시.
7. **회귀:** Gemini navigation · UJAT 전용 **다른 LNB 키** · 진행 현황(`PROGRAM_EXECUTION`) 정책은 건드리지 않음.

---

## 6. 필수 테스트 (유형별 최소 1건)

### 공통

- [ ] FormBinding 0 · surveys empty → **모든 유형** `SURVEY.enabled=true`
- [ ] overlay surveyItems 전부 false → enabled true, activeSurveyKeys `[]`
- [ ] overlay 일부 true → enabled true, keys 일치
- [ ] 설문 진행 항목 PATCH → navigation 재조회 반영

### 유형별

- [ ] **GENERAL_ORGANIZATION** — 186009 (3종 ON)
- [ ] **GENERAL_INDIVIDUAL** — satisfaction + survey 조합 1건
- [ ] **COMPANY_SCHOOL** — economy overlay 3종 ON, surveys empty
- [ ] **TRAINED_TEACHER** — keys `[]` + keys `["survey"]` 각각
- [ ] **UJAT** — `ujat.basicInfo.surveyItems` 4종 중 2종 ON
- [ ] **Gemini** — SURVEY 미포함 또는 비활성 유지 (회귀)

---

## 7. 완료 조건

1. §4 케이스별 수정 전·후 navigation 스냅샷 보관.
2. **186009** 및 1사1교·TT·UJAT 각 1건 이상에서 `SURVEY.enabled=true` (게시 전 포함).
3. 「게시된 설문 폼 없음」만으로 CMS 설문 LNB off — **유형 전부** 없음.
4. OpenAPI·단위 테스트 — **programType matrix** (최소 5유형).
5. `trained-teacher-survey-lnb-cases-…` 등 FE/시드 문서의 navigation 기대값이 본 계약과 **충돌하지 않음** (필요 시 시드 문서 follow-up).

---

## 8. FE 참고 (유형별)

| 유형 | 상세 모달 / navigation hook | 2depth·empty SSOT | navigation `SURVEY` (2026-09-28) |
|------|----------------------------|-------------------|----------------------------------|
| 일반 | `detail-fullpage-modal` · `useGeneralProgramNavigation` | `resolveProgramSurveyMenuKeys` · `getGeneralSurveyMenuItems` | **enabled=false 무시** (1depth 항상) |
| 1사1교 · TT | `program-detail-fullpage-modal` · 동일 hook | 동일 (economy overlay path) | 동일 hook — **hideSurvey 제거** |
| UJAT | `ujat-program-detail-fullpage-modal` | `ujat.basicInfo.surveyItems` · `resolveUjatSurveyMenuItems` | navigation **미연동** (로컬 types 기준). BE 수정 후 UJAT도 동일 API 쓸 경우 §3 준수 |
| Gemini | — | 설문 LNB 없음 | — |

BE 계약 정리 후:

- 일반·1사1교·TT는 navigation ↔ 상세 GET **일치** 검증.
- UJAT는 navigation 연동 시 **4종 overlay** 기준으로 동일 enabled 정책 적용.

**관련 FE (일반·1c-1s·TT 공유):**  
`use-general-program-navigation.ts`, `general-survey-menu-keys.ts`, `getGeneralSurveyMenuItems`, `GENERAL_SURVEY_MENU_EMPTY_COPY`

**관련 FE (UJAT):**  
`registration-survey-items.ts`, `resolveUjatSurveyMenuItems`, `ujat-program-detail-sidebar.tsx`

**Last updated:** 2026-09-28
