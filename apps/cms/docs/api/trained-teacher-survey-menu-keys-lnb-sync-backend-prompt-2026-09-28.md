# Cursor prompt — 교육받은 교사 「설문 진행 항목」↔ 설문 관리 LNB 동기화 (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 계약만** 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(enum·NOT NULL·권한)만 하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/trained-teacher-survey-menu-keys-lnb-sync-backend-prompt-2026-09-28.md`

확인 기준: 로컬 `GET http://localhost:8080/v3/api-docs` · 관리자 Bearer · CMS `/programs/trained-teachers?programId=…`.

관련(참고만, 본 문서만으로 구현):

- [trained-teacher-survey-lnb-cases-dummy-seed-backend-prompt-2026-09-27.md](./trained-teacher-survey-lnb-cases-dummy-seed-backend-prompt-2026-09-27.md) — LNB 케이스 시드
- [trained-teacher-common-info-field-roundtrip-backend-prompt-2026-09-22.md](./trained-teacher-common-info-field-roundtrip-backend-prompt-2026-09-22.md) — `serviceDetailJson` **replace** (deep merge 금지)

---

## Goal

`programType = TRAINED_TEACHER` 상세에서 **공통 정보 「설문 진행 항목」** 체크와 LNB **「설문 관리」 2depth**가 같은 SSOT를 쓰게 하라.

FE(2026-09-28)는 이미:

1. 공통정보 저장 시 `PATCH /api/admin/programs/{id}` body의  
   `serviceDetailJson.program.generalSurveyMenuKeys` 에 선택 키를 넣는다.
2. 같은 JSON의 `registration.overlay` 안  
   `generalRegistration.basicInfo.surveyItems` ·  
   `trainedTeachersRegistration.basicInfo.surveyItems` 를 **keys와 동일 체크맵으로 맞춰** 보낸다.
3. LNB 2depth는 `getGeneralSurveyMenuItems(program)` ←  
   `resolveProgramSurveyMenuKeys` (overlay surveyItems 우선, 없으면 `generalSurveyMenuKeys`).

BE가 keys를 버리거나, overlay만 구값으로 merge하거나, navigation에서 survey를 항상 끄면 **화면에서 체크해도 LNB 자식이 안 생긴다.**

---

## Out of scope / 금지

- Platform·CMS 프론트 수정.
- 일반 / UJAT / 1사1교 / Gemini **기본** navigation·survey 계약 변경.
- TT에 학생·봉사자 만족도 LNB 추가.
- `serviceDetailJson` / `configJson` **deep merge**로 구 `generalSurveyMenuKeys: []` 를 신값 위에 다시 깔기.
- TRUNCATE. prod Flyway에 운영 카피 금지.

---

## 0. SSOT (모든 CASE)

| 필드 | 위치 | 허용 값(정규화 후) |
|------|------|-------------------|
| `generalSurveyMenuKeys` | `serviceDetailJson.program.generalSurveyMenuKeys` | `[]` \| `survey` \| `satisfaction` \| `lecture_evaluation` 조합 |
| overlay 체크맵 | `serviceDetailJson.registration.overlay.*.surveyItems` | `{ survey, satisfaction, lecture_evaluation }` boolean — **keys와 동일** |
| navigation | `GET …/navigation` `lnb[]` key `SURVEY`/`survey`/`surveys` | `enabled: false` 만 FE가 LNB 부모를 숨김 |

```text
none   = []
single = ["survey"]  // 또는 satisfaction / lecture_evaluation 단독
pair   = 3종 중 정확히 2개
full   = ["survey", "satisfaction", "lecture_evaluation"]
```

레거시 `teacher_satisfaction` 등은 FE가 `satisfaction`으로 normalize — **신규 저장은 통합 키만**.

---

## 1. FE LNB 기대 (BE가 맞춰야 할 동작)

```text
「설문 관리」 LNB 부모
  = navigation.survey|surveys 가 enabled:false 가 아님

「설문 관리」 2depth children
  survey            ← keys ∋ survey
  satisfaction      ← keys ∋ satisfaction   → 라벨「만족도조사」(교사 only)
  lecture_evaluation← keys ∋ lecture_evaluation
```

| 공통정보 체크 | GET 후 LNB 2depth |
|---------------|-------------------|
| 설문조사만 | `설문조사` |
| 설문+만족도 | `설문조사`, `만족도조사` |
| 3종 전부 | `설문조사`, `만족도조사`, `강의평가` |
| 전부 해제 | children 없음(부모는 navigation이 막지 않으면 남음 · empty 카피) |

---

## 2. API 계약

| Method | Path | 역할 |
|--------|------|------|
| PATCH | `/api/admin/programs/{id}` | 공통정보 저장 · `serviceDetailJson` **요청 body로 교체** |
| GET | `/api/admin/programs/{id}` | 상세 · keys + overlay echo |
| GET | `/api/admin/programs/{id}/navigation` | LNB enabled |
| GET | `/api/admin/programs/{id}/surveys` | 바인딩된 설문(본문). keys와 별개이나 시드는 맞춤 |

### 2.1 PATCH `serviceDetailJson` (필수)

요청 예(발췌):

```json
{
  "serviceDetailJson": "{\"schemaVersion\":1,\"program\":{\"generalSurveyMenuKeys\":[\"survey\",\"satisfaction\"],\"generalCommonInfo\":{…}},\"registration\":{\"overlay\":{\"generalRegistration.basicInfo.surveyItems\":{\"survey\":true,\"satisfaction\":true,\"lecture_evaluation\":false},\"trainedTeachersRegistration.basicInfo.surveyItems\":{\"survey\":true,\"satisfaction\":true,\"lecture_evaluation\":false}}}}"
}
```

규칙:

1. `serviceDetailJson` 은 기존 blob과 **deep merge 하지 말고 요청 문자열(또는 파싱 후 문서)로 교체**.
2. `program.generalSurveyMenuKeys` 는 **요청 값 그대로** 저장·GET echo.
3. `registration.overlay` 의 surveyItems 가 오면 **그대로** 저장.  
   요청에 overlay가 없고 keys만 있으면, GET 시 overlay surveyItems를 keys로부터 **생성해 echo**해도 된다(권장).
4. 다른 필드 PATCH(제목만 등) 때 **기존 keys를 `[]`로 지우지 말 것**.

### 2.2 GET echo (필수)

`GET /api/admin/programs/{id}` 에서 최소한 하나:

- `serviceDetailJson.program.generalSurveyMenuKeys` = 마지막 저장 배열  
  **또는**
- top-level / envelope 동등 미러 (있으면 FE `parseTrainedTeacherServiceDetailJson`이 읽음)

동시에 overlay surveyItems가 있으면 keys와 **모순 금지**:

| keys | overlay.surveyItems | 결과 |
|------|---------------------|------|
| `["survey"]` | 전부 false | **실패** — LNB 비움 |
| `["survey"]` | survey:true 나머지 false | 성공 |
| `[]` | 전부 false | 성공(항목 없음) |

### 2.3 navigation (필수)

`GET /api/admin/programs/{id}/navigation`:

- keys 길이 > 0 인데 `SURVEY`/`survey`/`surveys` 가 `enabled: false` 이면 **실패**(공통정보에서 켠 항목이 LNB에서 통째로 사라짐).
- keys가 `[]`일 때 enabled true/false는 제품 선택.  
  **권장:** keys 비면 `enabled: false` 또는 FE empty 카피에 맡기고 true 유지.  
  **금지:** keys가 있는데 false.

keys 변경 PATCH 직후 navigation 캐시/계산이 **같은 요청 트랜잭션 기준**으로 맞을 것.

### 2.4 surveys 바인딩 (P1, LNB 본문)

LNB 자식은 keys만으로 그려진다. 본문이 비지 않으려면 keys에 포함된 kind에 대해 form-binding / surveys 목록이 있어야 한다.

| key | 기대 templateCode (시드) |
|-----|--------------------------|
| survey | `survey-default` |
| satisfaction | `survey-teacher` (학생·봉사 템플릿 금지) |
| lecture_evaluation | `survey-admin` |

keys에 넣은 직후 binding이 없어도 LNB 라벨은 보여야 한다. binding은 시드·후속 job으로 맞춰라.

---

## 3. 재현 · 수용 기준

### 재현 (현재 깨짐 패턴)

1. CMS `/programs/trained-teachers?programId={id}` → 공통 정보 「정보 수정」
2. 「설문 진행 항목」에서 설문조사·만족도조사 체크 후 저장
3. 좌측 LNB 「설문 관리」 펼침

**깨짐:** 2depth에 항목이 없거나, 저장 전 상태 유지.  
**Network:** PATCH programs 후 GET detail의 `generalSurveyMenuKeys`가 `[]` 이거나, overlay surveyItems가 전부 false이거나, navigation survey `enabled:false`.

### 수용 (P0)

1. 위 재현 후 GET detail:
   - `generalSurveyMenuKeys` ⊇ 체크한 키
   - overlay surveyItems 가 keys와 동일
2. GET navigation: survey 계열 `enabled !== false`
3. CMS UI: LNB 2depth 라벨이 체크와 1:1
4. 체크 전부 해제 저장 → keys `[]` · overlay 전부 false · 2depth 없음
5. 제목만 바꾸는 PATCH 후에도 keys **유지**

### 수용 (P1)

6. keys full 시드 프로그램에서 `/surveys` 에 3 kind 바인딩 존재(교사 만족도만)
7. [TT-S 시드 문서](./trained-teacher-survey-lnb-cases-dummy-seed-backend-prompt-2026-09-27.md) CASE 중 none/single/full 각 1개 이상 로컬에서 통과

---

## 4. 답변 형식

1. 변경 API·머지 정책 한 줄씩
2. 검증에 쓴 `programId` + 저장 전/후 `generalSurveyMenuKeys` + navigation.survey.enabled
3. deep merge 제거 여부(예/아니오)
4. 남은 갭(바인딩 job 등)만 bullet
