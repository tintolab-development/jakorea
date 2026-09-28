# Cursor prompt — 교육받은 교사 설문·만족도 LNB 전 케이스 더미 시드 (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 계약만** 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(enum·NOT NULL·권한)만 하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/trained-teacher-survey-lnb-cases-dummy-seed-backend-prompt-2026-09-27.md`

확인 기준: 로컬 `GET http://localhost:8080/v3/api-docs` · 관리자 Bearer · CMS `/programs/trained-teachers?programId=…`.

---

## Goal

`programType = TRAINED_TEACHER` 프로그램 상세 LNB **「설문 관리」** 에서 교육받은 교사에 **나올 수 있는 설문조사·만족도조사·강의평가 케이스를 전부** 더미로 포괄하라.

앵커 공개 제목 예(등록·목록 노출용): **중학생 진로 설계 워크숍**  
시드 title은 케이스별로 접두어를 붙여 구분한다 (`【TT·설문】…`).

FE는 이미 아래를 소비한다. path를 새로 만들지 마라.

| Method | Path | 역할 |
|--------|------|------|
| GET | `/api/admin/programs?programType=TRAINED_TEACHER` | 목록 · `id` · survey keys 미러(가능하면) |
| GET | `/api/admin/programs/{programId}` | 상세 · `serviceDetailJson` / survey keys |
| GET/PATCH | `/api/admin/programs/{programId}/trained-teacher/detail` | TT 공통정보 · `configJson` |
| GET | `/api/admin/programs/{programId}/navigation` | LNB `enabled` |
| GET | `/api/admin/programs/{programId}/surveys` | 등록된 설문·만족도·강의평가 목록 |
| GET | `/api/admin/programs/{programId}/surveys/{templateVersionId}/responses` | 응답 |
| GET | `/api/admin/programs/{programId}/surveys/{templateVersionId}/summary` | 집계(있으면) |
| GET/POST | `/api/admin/programs/{programId}/form-bindings` | SURVEY 바인딩 |

---

## Out of scope / 금지

- Platform·CMS 프론트 수정.
- 일반 / UJAT / 1사1교 / Gemini **기본** 시드·contracts 변경.
- TT에 **강사 신청 LNB · 봉사자 · 학생용 만족도 · 상·하반기 봉사자 만족도** 시드.
- UJAT형 분리 LNB(`봉사단 만족도` / `학교 만족도`)를 TT에 만들지 마라.
- TRUNCATE. prod Flyway에 운영 카피를 넣지 마라.
- `generalSurveyMenuKeys`에 학생/봉사 전용 키만 넣고 `satisfaction` 통합 키를 빼 버리지 마라.  
  (레거시 `student_satisfaction` 등은 FE가 `satisfaction`으로 normalize 한다 — **의도적 레거시 CASE만** 허용.)

---

## 0. 도메인 강제 (모든 CASE)

```json
{
  "programType": "TRAINED_TEACHER",
  "generalProgramAudience": "organization",
  "generalParticipantTypes": ["school_institution"],
  "generalVolunteers": 0,
  "staffVolunteers": 0
}
```

| 고정 | 값 | 비고 |
|------|-----|------|
| 참여자 | 학교/기관만 | 개인·강사·봉사자 LNB 없음 |
| 만족도 audience | **교사(teacher) only** | 1사1교와 동일. 학생·참여자·봉사 탭 **없음** |
| 설문 LNB children | `survey` · `satisfaction` · `lecture_evaluation` | 등록 3종과 동일 |
| 만족도 템플릿 | `survey-teacher` | `survey-student` 바인딩 금지 |
| 설문조사 템플릿 | `survey-default` | |
| 강의평가 템플릿 | `survey-admin` | |
| 양식(신청/등록) | `registration-trained-teachers` · `recruitment-trained-teachers` · `application-trained-teachers` | 기존 TT create defaults |

`generalSurveyMenuKeys` 허용 값(정규화 후):

```text
none   = []
single = ["survey"]                         // 또는 satisfaction / lecture_evaluation 단독
pair   = 위 3종 중 정확히 2개
full   = ["survey", "satisfaction", "lecture_evaluation"]
```

---

## 1. FE LNB 노출 규칙 (시드가 맞춰야 할 기대)

CMS TT 상세(`ProgramDetailFullPageModal` + trained-teachers 분기):

```text
「설문 관리」 LNB 노출
  = GET …/navigation 에서 survey|surveys 가 enabled:false 가 아님
  ∧ generalSurveyMenuKeys (normalize 후) 길이 > 0

2depth:
  survey            ← keys ∋ survey          → 라벨「설문조사」
  satisfaction      ← keys ∋ satisfaction    → 라벨「만족도조사」(교사-only 본문)
  lecture_evaluation← keys ∋ lecture_evaluation → 라벨「강의평가」
```

본문 상태( LNB와 별개 · 같은 프로그램에 중첩 가능 ):

| 상태 | 의미 | FE UI |
|------|------|-------|
| empty | 해당 kind 바인딩 없음 | 등록 CTA empty |
| before_start | 바인딩 있음 · 응답 0 | 「아직 진행 전」 |
| in_progress / finished | 응답 ≥1 | 결과·다운로드 |

기간·draft·role은 **LNB 노출에 쓰지 않는다.** keys + navigation만.

---

## 2. 마스터 케이스 (P0 필수)

title 접두어: `【TT·설문】`.  
권장 slug id(문자): `trained-teachers-seed-TT-S-NN`.  
숫자 PK만 가능하면 title·`serviceDetailJson.seedCase=TT-S-NN`으로 구분하고 **응답에 programType=TRAINED_TEACHER를 반드시 내려라.**

`full` = `["survey","satisfaction","lecture_evaluation"]`

| CASE | 우선 | title (권장) | `generalSurveyMenuKeys` | navigation.survey | surveys 바인딩 | 한 줄 목적 |
|------|------|--------------|-------------------------|-------------------|----------------|------------|
| **TT-S-01** | P0 | `【TT·설문】none · 중학생 진로 설계 워크숍` | `[]` | enabled | 없음 | 설문 관리 LNB **전체 숨김** |
| **TT-S-02** | P0 | `【TT·설문】survey-only` | `["survey"]` | enabled | SURVEY empty | 2depth「설문조사」만 |
| **TT-S-03** | P0 | `【TT·설문】satisfaction-only · 교사` | `["satisfaction"]` | enabled | SATISFACTION empty | 2depth「만족도조사」만 · **교사-only** |
| **TT-S-04** | P0 | `【TT·설문】lecture-only` | `["lecture_evaluation"]` | enabled | LECTURE empty | 2depth「강의평가」만 |
| **TT-S-05** | P0 | `【TT·설문】survey+satisfaction` | `["survey","satisfaction"]` | enabled | 둘 다 empty | 강의평가 없음 |
| **TT-S-06** | P0 | `【TT·설문】survey+lecture` | `["survey","lecture_evaluation"]` | enabled | 둘 다 empty | 만족도 없음 |
| **TT-S-07** | P0 | `【TT·설문】satisfaction+lecture` | `["satisfaction","lecture_evaluation"]` | enabled | 둘 다 empty | 설문조사 없음 |
| **TT-S-08** | P0 | `【TT·설문】full · 중학생 진로 설계 워크숍` | **full** | enabled | 3종 empty | LNB 3 children + empty CTA |
| **TT-S-09** | P0 | `【TT·설문】nav-disable · keys full` | **full** | **`enabled:false`** | 있어도 됨 | keys 있어도 LNB **숨김** |

### P1 — 본문 런타임 (TT-S-08과 동일 keys · 별도 프로그램)

| CASE | title | SURVEY | SATISFACTION(교사) | LECTURE | 목적 |
|------|-------|--------|--------------------|---------|------|
| **TT-S-10** | `【TT·설문】runtime empty` | 없음 | 없음 | 없음 | empty CTA만 (TT-S-08과 동일해도 됨) |
| **TT-S-11** | `【TT·설문】runtime before_start` | before_start | before_start | before_start | 진행 전 카피 |
| **TT-S-12** | `【TT·설문】runtime responses` | in_progress + responses≥3 | in_progress + responses≥2 | finished + responses≥1 | 결과·summary·export |
| **TT-S-13** | `【TT·설문】legacy keys` | — | — | — | keys에 `teacher_satisfaction` 등 레거시 → FE normalize 후 satisfaction LNB 1개 |

### P2 — 목록·딥링크

| CASE | 목적 |
|------|------|
| **TT-S-14** | 목록 DTO에 survey keys 또는 동등 미러(선택). 없어도 상세 hydrate로 LNB 나와야 함 |
| **TT-S-15** | `?programId=` 딥링크로 TT-S-08 진입 시 LNB survey 기본 탭 |

---

## 3. 시드 레시피

### 3.1 keys → `serviceDetailJson` / detail

FE `parseTrainedTeacherServiceDetailJson`는 `generalSurveyMenuKeys`를 읽는다.  
아래 중 **하나 이상**으로 내려라 (둘 다면 값 일치).

1. `GET /api/admin/programs/{id}` → `serviceDetailJson` (또는 envelope `program.generalSurveyMenuKeys`)
2. `GET …/trained-teacher/detail` → `configJson` 동일 키
3. top-level 필드가 OpenAPI에 있으면 그것

**TT-S-01 예:**

```json
{
  "programType": "TRAINED_TEACHER",
  "title": "【TT·설문】none · 중학생 진로 설계 워크숍",
  "mainTitle": "중학생 진로 설계 워크숍",
  "generalProgramAudience": "organization",
  "generalParticipantTypes": ["school_institution"],
  "generalSurveyMenuKeys": []
}
```

**TT-S-08 예:**

```json
{
  "programType": "TRAINED_TEACHER",
  "title": "【TT·설문】full · 중학생 진로 설계 워크숍",
  "mainTitle": "중학생 진로 설계 워크숍",
  "generalSurveyMenuKeys": ["survey", "satisfaction", "lecture_evaluation"]
}
```

**금지:** keys를 전부 `false`로 보냈을 때 BE/등록 경로가 **3종으로 fallback** 해서 none CASE를 깨뜨리는 것.  
none은 **빈 배열 `[]`이 그대로** 상세에 남아야 한다.

### 3.2 navigation — TT-S-09

`GET /api/admin/programs/{programId}/navigation` 항목 예:

```json
{
  "items": [
    { "key": "SURVEY", "enabled": false },
    { "key": "ORGANIZATION_APPLICATIONS", "enabled": true },
    { "key": "PROGRAM_EXECUTION", "enabled": true },
    { "key": "PROGRAM_STAFF", "enabled": true }
  ]
}
```

`key`는 OpenAPI enum(`SURVEY` / `surveys` / `survey`) 중 FE alias가 받는 값.  
**keys=full 이어도** survey `enabled:false`면 CMS에서 「설문 관리」가 없어야 한다.

### 3.3 surveys 바인딩 · 응답

| kind (FE/계약) | templateCode | TT에서 audience |
|----------------|--------------|-----------------|
| `SURVEY` / 설문조사 | `survey-default` | (단일) |
| `SATISFACTION` / 만족도 | **`survey-teacher`만** | teacher |
| `LECTURE_EVALUATION` / 강의평가 | `survey-admin` | (단일) |

**TT-S-03 · TT-S-08 · TT-S-10~12:** `survey-student` / volunteer용 버전을 **붙이지 마라.**  
붙이면 FE teacher-only 스펙과 어긋난다.

**TT-S-11** — 각 kind 바인딩 1개 + `responses` 빈 배열(또는 summary count=0).  
**TT-S-12** — 각 kind에 raw responses ≥ 표의 건수. PII는 더미(`교사A`, `학교B`).

### 3.4 레거시 keys — TT-S-13

```json
{
  "generalSurveyMenuKeys": ["survey", "teacher_satisfaction", "lecture_evaluation"]
}
```

FE normalize 후 LNB children = survey · satisfaction · lecture_evaluation (satisfaction **하나**).  
BE가 이미 정규화해 `satisfaction`만 내려도 수용.

---

## 4. 수용 조건 (완료 체크)

1. TT-S-01: 상세 LNB에 「설문 관리」 **없음**.
2. TT-S-02~07: 2depth children이 표의 keys와 **1:1**.
3. TT-S-03·08: 만족도 본문에 **교사 외 audience 탭 없음** (학생/봉사 탭 금지). 빈 상태 카피에 「모든 학교에 동일 노출」류 TT/1사1교 문구가 나와도 됨.
4. TT-S-08: children 3개 + 각 탭 empty 등록 CTA.
5. TT-S-09: keys full이어도 navigation disable → 「설문 관리」 **없음**.
6. TT-S-11/12: before_start / responses UI가 공용 survey API로 동작.
7. 모든 CASE `programType=TRAINED_TEACHER`. 강사·봉사 LNB 시드 **없음**.
8. `GET …/surveys`에 TT 만족도로 `survey-student`만 있는 행이 **없음**.
9. 답변에 개인정보 없는 샘플: 각 CASE의 `programId`, `generalSurveyMenuKeys`, navigation survey enabled, surveys kind·templateCode 목록.

---

## 5. 기존 문서와의 관계

| 문서 | 관계 |
|------|------|
| [04-trained-teachers-dummy-seed.md](./be-handoff-program-dummy-seeds/04-trained-teachers-dummy-seed.md) | TT-01~08은 **공통정보·일지** 중심. **본 문서가 설문 LNB 매트릭스 SSOT** |
| [trained-teachers-detail-unconfirmed-api-backend-request-2026-09-16.md](./trained-teachers-detail-unconfirmed-api-backend-request-2026-09-16.md) | surveys `/responses` · export 갭 — TT-S-12가 검증 시드 |
| [company-school-program-dummy-seed-backend-request.md](./company-school-program-dummy-seed-backend-request.md) | 1사1교 CS-09/10/11/25와 **동일 축**. TT는 강사신청 LNB 없음·참여자 school만 |
| [forms-surveys-api-backend-gaps.md](./forms-surveys-api-backend-gaps.md) | `survey-default` · `survey-teacher` · `survey-admin` 시드 |

기존 TT-01~08을 덮어쓰지 마라. **신규 TT-S-*** 만 추가.

---

## 6. Remote 게이트 (FE 검증)

```env
VITE_API_SERVER=http://localhost:8080/
VITE_REAL_API_MODULES=adminAuth,formsSurveys,programs,applications,programProgress
VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED=true
```

수동 확인: `/programs/trained-teachers` → 각 `【TT·설문】` 상세 → LNB 「설문 관리」 children · 만족도 교사-only · TT-S-09 숨김.

---

## 완료 조건 (BE Cursor 출력)

1. TT-S-01 ~ TT-S-09 시드 생성됨 (P1 TT-S-10~13 권장).
2. 각 CASE에 대해 `programId` + keys + navigation.survey.enabled + surveys(kind, templateCode, responseCount) 표를 답변에 붙임.
3. OpenAPI path·required 필드는 diff에 불필요하게 바꾸지 않음.
4. `survey-student`가 TT 만족도 기본 바인딩으로 들어가지 않음.

**Last updated:** 2026-09-27
