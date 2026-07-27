# 1사1교 프로그램 더미 시드 요청 (BE)

CMS `/programs/company-school` (legacy `/programs/economy-education`) **목록 · 상세(풀페이지 모달) · LNB · 모집/신청/진행** 분기를 FE와 동일하게 검증하려면, 아래 **케이스 단위**로 더미 프로그램을 만들어 주세요.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-23 |
| **갱신** | 2026-07-23 — 초안 (FE mock 8건 + P1/P2 표면·갭) |
| **대상** | 1사1교만 (`programType=COMPANY_SCHOOL`) — 일반 / UJAT / Gemini **제외** |
| **FE SSOT** | [1c-1s-program-characteristics.mdc](../../../../.cursor/rules/1c-1s-program-characteristics.mdc) · [`economy-programs.ts`](../../src/data/mock/economy-programs.ts) · [`1c-1s/README.md`](../../src/features/program/1c-1s/README.md) · [`overview-stage-counts.ts`](../../src/features/program/1c-1s/lib/overview-stage-counts.ts) |

**관련 문서**

- [programs-company-school-api-backend-handoff.md](./programs-company-school-api-backend-handoff.md)
- [programs-company-school-detail-api-conversion-status.md](./programs-company-school-detail-api-conversion-status.md)
- [programs-registration-flow-api-backend-handoff.md](./programs-registration-flow-api-backend-handoff.md)
- [writing-form-seeds-backend-handoff.md](./writing-form-seeds-backend-handoff.md) (`registration-economy` · `application-economy`)
- [settlement-item-settings-dummy-seed-backend-request.md](./settlement-item-settings-dummy-seed-backend-request.md) (교통비/숙박비 1사1교)
- 포맷 참고(대상 제외): [general-program-dummy-seed-backend-request.md](./general-program-dummy-seed-backend-request.md)

> **금지**
>
> - 기존 E2E·일반 시드 title(`[수정 가능] 일반 프로그램 더미` 등)과 같게 만들거나 덮어쓰지 마세요.
> - E2E 수정 더미 `[수정 가능] 1사1교 프로그램 더미`(CS-EDIT) title을 다른 CASE와 같게 만들거나 덮어쓰지 마세요.
> - **봉사자** 신청/참여 행, **합반**, **과제** 관리 시드를 만들지 마세요.
> - 일반 프로그램의 audience×structure×session 8종 매트릭스를 1사1교에 복제하지 마세요 (유형 축이 고정).

**Remote 게이트 (검증 시)**

```env
VITE_API_SERVER=https://<backend-host>/
VITE_REAL_API_MODULES=adminAuth,formsSurveys,programs,applications,programProgress
VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true
```

---

## 0. 이 문서를 읽는 법

1. **§1 마스터 리스트**에서 만들 케이스 번호(`CS-01` …)를 고른다.
2. 각 CASE의 **시드 레시피**(필드 표·JSON)를 그대로 채운다.
3. **§2 상세 UI 잠금표**로 “이 시드가 열어 주는 상세 화면”을 확인한다.
4. 우선순위: **P0 → P1 → P2**.
5. 신청·참여·정산 **행 단위** 시드는 부록 A의 **상태 매트릭스**만 참고 (프로그램 CASE와 1:1 매핑 아님). 행은 **프로그램 id에 명시적으로 스코프**한다.

```text
P0 필수   CS-01 ~ CS-08    (lifecycle 8단계 × 설문 none/single/full)   FE mock 8건
P1 권장   CS-09 ~ CS-26    (모집·면접·교육형태·임금·중첩·양식 갭)
P2 권장   CS-27 ~ CS-38    (목록·bulk·후원사·게시글·필터 운영)
```

**FE mock 프로그램 시드 합계: 8건** (`economy-prog-001` ~ `008`).  
P1·P2는 FE에 없는 **BE 신규 시드**가 포함됩니다 (title로 FE mock과 구분).

---

## 0.1 도메인 공통 강제 (모든 CASE)

1사1교는 **학교/기관 + 강사**만 대상입니다. 모든 시드에 아래를 강제하세요.

```json
{
  "programType": "COMPANY_SCHOOL",
  "generalParticipantTypes": ["school_institution", "teacher_instructor"],
  "generalVolunteers": 0,
  "staffVolunteers": 0,
  "returningVolunteers": 0,
  "generalVolunteerInterviewEnabled": false,
  "generalProgramAudience": "organization",
  "generalProgramEducationStructure": "curriculum",
  "generalProgramSessionRound": "single",
  "rounds": [{ "roundNumber": 1 }],
  "businessArea": "경제금융",
  "studentListRequired": "not_required"
}
```

| 고정 항목 | 값 | 비고 |
|-----------|-----|------|
| 교육 진행 구조 | `curriculum` | 일정형 없음 |
| 수업 회차 | `single` | `rounds` 길이 = 1 |
| 참여 방식 | organization (학교/기관) | 개인 audience 없음 |
| 봉사자 | 없음 | KPI·LNB·행 시드 금지 |
| 합반 | 불가 | 기관 상세 UI 비노출 |
| 과제 | 없음 | progress 과제 탭 없음 |
| 운영 기간 | 권장 1년 단위 | 등록 스냅샷은 종종 1/1–12/31 |
| 양식 바인딩 | `registration-economy` · `application-economy` | create 직후 |

공통정보(FE mock 공유 기본 — CASE별로 덮어쓸 수 있음):

```json
{
  "generalCommonInfo": {
    "curriculumSessions": [
      {
        "sessionLabel": "1차시",
        "title": "1단원 나를 알리는 기술",
        "description": "채용 공고 읽기, 이력서 작성하기 등 취업에 필요한 단계들을 알아봅니다."
      },
      {
        "sessionLabel": "2차시",
        "title": "2단원 나를 보여주는 기술",
        "description": "올바른 면접 태도에 대해 알아보고, 직접 면접 체험을 해보는 시간을 갖습니다."
      }
    ],
    "educationScheduleMode": "period",
    "educationScheduleLines": ["2026. 03. 01 ~ 2026. 12. 30"],
    "wageGradeRows": [
      { "grade": "1급 강사비", "pricing": "1시간 당 | 기본 : 500,000원 | 장거리 : 500,000원" },
      { "grade": "2급 강사비", "pricing": "1시간 당 | 기본 : 400,000원 | 장거리 : 400,000원" },
      { "grade": "3급 강사비", "pricing": "1시간 당 | 기본 : 300,000원 | 장거리 : 300,000원" }
    ],
    "paymentItems": "교통비(일사일교), 숙박비(일사일교)",
    "deductionItems": "일용근로자 원천징수세액"
  }
}
```

---

## 1. 마스터 케이스 리스트 (한눈에)

`full` = `["survey","satisfaction","lecture_evaluation"]`

| CASE | 우선 | FE `programId` | title (권장 / FE mock) | lifecycle | status | survey | overview 목적 | 한 줄 목적 |
|------|------|----------------|------------------------|-----------|--------|--------|---------------|------------|
| **CS-01** | P0 | `economy-prog-001` | `HSBC/HKU Business Case Competition 2026 모집 안내` | `planned` | pending | none | 예정 | 설문 없음 · FULL LNB−설문 |
| **CS-02** | P0 | `economy-prog-002` | `2026 JA Korea 대학생경제교육봉사단 UJAT 36기 모집` | `recruiting_students` | pending | single | 예정 | 학교 모집 중 · 설문조사만 |
| **CS-03** | P0 | `economy-prog-003` | `EY한영-JA Korea Growth to Professional 2026 …` | `recruiting_instructors` | pending | full | 예정 | 강사 모집 기간 + 설문 full |
| **CS-04** | P0 | `economy-prog-004` | `2026년 JA Korea 초등 경제교육 모집 안내` | `matching_completed` | pending | none | 예정 | 매칭 완료 · `inside_school` |
| **CS-05** | P0 | `economy-prog-005` | `2026 SAP-함께 성장하JA! …` | `education_before_textbook` | active | single | 예정 | 교재 전 |
| **CS-06** | P0 | `economy-prog-006` | `2026 SAP-JA Korea Global Career Discovery …` | `education_after_textbook` | active | full | **진행** | 진행 버킷 + 설문 full |
| **CS-07** | P0 | `economy-prog-007` | `2026년 JA Korea 경제금융교육 전문강사단 모집` | `education_completed` | completed | full | **완료** | 완료 + 설문 full |
| **CS-08** | P0 | `economy-prog-008` | `2026년 한국씨티은행-JA Korea 특별한 JOB담 …` | `document_processing_completed` | completed | none | **완료** | 문서처리 완료 · 설문 없음 |
| **CS-09** | P1 | *(BE 신규)* | `【1사1교·LNB】설문 none 대조` | planned | pending | none | 예정 | 설문 LNB 숨김 대조 |
| **CS-10** | P1 | *(BE 신규)* | `【1사1교·LNB】만족도 교사-only` | education_after_textbook | active | full | 진행 | 만족도 **교사** 탭만 |
| **CS-11** | P1 | *(BE 신규)* | `【1사1교·LNB】강의평가 포함` | education_after_textbook | active | full | 진행 | `lecture_evaluation` |
| **CS-12** | P1 | *(BE 신규)* | `【1사1교·모집】학교·강사 기간 병행` | recruiting_instructors | pending | full | 예정 | 기간 겹침 |
| **CS-13** | P1 | *(BE 신규)* | `【1사1교·모집】강사 면접 on` | recruiting_instructors | pending | full | 예정 | interview 일정 채움 |
| **CS-14** | P1 | *(BE 신규)* | `【1사1교·모집】강사 면접 off` | recruiting_instructors | pending | single | 예정 | 서류만 |
| **CS-15** | P1 | *(BE 신규)* | `【1사1교·모집】학생 명단 not_required` | recruiting_students | pending | single | 예정 | 명단 기본값 |
| **CS-16** | P1 | *(BE 신규)* | `【1사1교·모집】학급·배정 강사 한도` | matching_completed | pending | none | 예정 | maxClass / maxAssignable |
| **CS-17** | P1 | *(FE 갭)* | `【1사1교·갭】교육형태 참여자선택` | planned | pending | full | 예정 | 신청폼 교육형태 노출 |
| **CS-18** | P1 | *(BE 신규)* | `【1사1교·모집】교육형태 오프라인 고정` | planned | pending | full | 예정 | 선택 UI 숨김 대조 |
| **CS-19** | P1 | *(BE 신규)* | `【1사1교】inside_school` | matching_completed | pending | none | 예정 | CS-04 계열 |
| **CS-20** | P1 | *(BE 신규)* | `【1사1교】교재 미정` | education_before_textbook | active | single | 예정 | 상세 「미정」 |
| **CS-21** | P1 | *(BE 신규)* | `【1사1교·임금】급수·일사일교 지급` | education_after_textbook | active | full | 진행 | wage/payment 문구 |
| **CS-22** | P1 | *(BE 신규)* | `【1사1교·정산】편도 100km+` | education_after_textbook | active | full | 진행 | 장거리 정산 행 |
| **CS-23** | P1 | *(BE 신규)* | `【1사1교·중첩】학교 출석 데이터` | education_after_textbook | active | full | 진행 | Phase 7 |
| **CS-24** | P1 | *(BE 신규)* | `【1사1교·중첩】강사 배정·희망 일정` | matching_completed | pending | full | 예정 | 배정 UI |
| **CS-25** | P1 | *(BE 신규)* | `【1사1교·nav】LNB disable` | planned | pending | full | 예정 | 신청/설문 숨김 |
| **CS-26** | P1 | *(BE 신규)* | `【1사1교·양식】economy binding` | planned | pending | full | 예정 | registration/application-economy |
| **CS-27** | P2 | *(BE 신규)* | `【1사1교·위젯】일정 카테고리` | education_after_textbook | active | full | 진행 | schedule widget |
| **CS-28** | P2 | *(BE 신규)* | `【1사1교·후원사】상세 링크` | planned | pending | none | 예정 | sponsor detail |
| **CS-29** | P2 | *(BE 신규)* | `【1사1교·게시글】첨부 포함` | planned | pending | none | 예정 | posts/files (001 패턴) |
| **CS-30** | P2 | *(BE 신규)* | `【1사1교·bulk】강의보고 PDF` | education_completed | completed | full | 완료 | bulk download |
| **CS-31** | P2 | *(BE 신규)* | `【1사1교·bulk】기관 일괄 승인/반려` | recruiting_students | pending | single | 예정 | bulk approve |
| **CS-32** | P2 | *(BE 신규)* | `【1사1교·bulk】목록 예정만 삭제` | planned | pending | none | 예정 | bulk delete |
| **CS-33** | P2 | *(BE 신규)* | `【1사1교·정산항목】교통·숙박 연결` | education_after_textbook | active | full | 진행 | settlement configs |
| **CS-34** | P2 | *(BE 신규)* | `【1사1교·담당자】managers` | planned | pending | none | 예정 | Phase 10 |
| **CS-35** | P2 | *(BE 신규)* | `【1사1교·설문】responses/answers` | education_after_textbook | active | full | 진행 | Phase 9 |
| **CS-36** | P2 | *(BE 신규)* | `【1사1교·딥링크】programId` | education_after_textbook | active | full | 진행 | `?programId=` |
| **CS-37** | P2 | *(BE 신규)* | `【1사1교·필터】businessYear·keyword` | recruiting_students | pending | single | 예정 | list query |
| **CS-38** | P2 | *(BE 신규)* | `【1사1교】title 충돌 방지 샘플` | planned | pending | none | 예정 | 일반 시드와 구분 |
| **CS-EDIT** | E2E | *(BE 신규)* | `[수정 가능] 1사1교 프로그램 더미` | `planned` | pending | full | 예정 | 상세 풀페이지 수정 E2E 전용 |

권장 BE id: FE 정합 시 `economy-prog-00N` 유지, 신규는 `company-school-seed-CS-NN` (title로 FE와 구분).  
E2E 수정 더미 id 권장: `company-school-seed-CS-EDIT`.

---

## 2. 상세 UI 잠금표 (이 시드가 열어 주는 화면)

상세 풀페이지 모달 LNB는 **1사1교 전용 골격**입니다. 일반 프로그램과 달리 봉사자·개인 참여자·출석/과제/게시글 progress 탭이 **없습니다**.

| 상세 UI | 잠금 조건 | 대표 CASE |
|---------|-----------|-----------|
| LNB 「기관 신청 목록」 | types ⊇ `school_institution` | **전 CASE** |
| LNB 「강사 신청 목록」 | types ⊇ `teacher_instructor` | **전 CASE** |
| LNB 봉사자 신청 / 진행「참여 봉사자」 | **항상 없음** | — |
| progress「참여 기관」·「참여 강사」 | 고정 children | **전 CASE** |
| progress 출석·과제·게시글 | **없음** (일반 individual만) | — |
| 합반 UI | **항상 숨김** | **전 CASE** |
| 모집 — 최대 일정 수 / 1일 최대 차시 | **숨김** (`!isCompanySchool`) | vs 일반 |
| 모집 — 학급·배정 강사 한도 | `maxClassCount` / `maxAssignableInstructors` | CS-16 |
| 모집 — 학생 명단 | 기본 `not_required` | CS-15 |
| 모집 — 강사 면접 일정 | interview 필드 on/off | CS-13 vs CS-14 |
| 설문 LNB | `generalSurveyMenuKeys` non-empty | CS-02,03,05–07,10–11 |
| 설문 none | keys=`[]` | CS-01,04,08,09 |
| 만족도 **교사-only** | company-school + `satisfaction` ∈ keys | **CS-10** (학생/봉사 탭 없음) |
| 강의평가 | `lecture_evaluation` ∈ keys | CS-03,06,07,11 |
| 신청 정보 미리보기 | info → 신청 탭 | **전 CASE** |
| 교육형태「참여자 선택」 | 신청 폼 선택 노출 | **CS-17** (갭) |
| 교육형태 고정 | 선택 UI 숨김 | **CS-18** |
| 임금·장거리 표시 | wageGradeRows + 일사일교 지급 문구 | CS-21 |
| 편도 ≥100km 정산 | 강사 중첩 정산 | **CS-22** |
| navigation LNB disable | 서버 navigation `enabled:false` | **CS-25** |

### 목록 overview 4카드 (mock 기준)

remote OFF mock은 **운영 기간(start/end)** 우선, 없으면 lifecycle 폴백 ([`overview-stage-counts.ts`](../../src/features/program/1c-1s/lib/overview-stage-counts.ts)).

| 카드 | remote API `periodStatus` | mock lifecycle 폴백 예 |
|------|---------------------------|------------------------|
| 예정 `scheduled` | `RECRUITING` | `recruiting_students` · `recruiting_instructors` · `matching_completed` · `education_before_textbook` (+ `planned`는 날짜 기준) |
| 진행 `in_progress` | `IN_PROGRESS` | `education_after_textbook` |
| 완료 `completed` | `COMPLETED` | `education_completed` · `document_processing_completed` |

P0에서 **진행 1건(CS-06)·완료 2건(CS-07,08)·나머지 예정**이 보이도록 start/end 또는 periodStatus를 맞춰 주세요.

---

## 3. P0 시드 레시피 (CS-01 ~ CS-08) — 필수

### 공통 규칙 (P0)

- §0.1 도메인 강제 JSON 전부 적용
- **프로그램당 하위 행 최소치**
  - 기관 신청: `pending` / `approved` / `rejected` 각 ≥1
  - 강사 신청: `pending` / `approved` / `rejected` 각 ≥1
  - 참여 기관 · 참여 강사: 각 ≥1
  - **봉사자·합반·과제 행 금지**
- form binding: `registration-economy` + `application-economy` (가능하면 create 시 기본 바인딩)

---

### CS-01 — planned · 설문 none

| 항목 | 값 |
|------|-----|
| FE mock id | `economy-prog-001` |
| title (FE) | `HSBC/HKU Business Case Competition 2026 모집 안내` |
| `status` / `lifecycleStatus` | `pending` / `planned` |
| survey | `[]` |
| `institutionType` | `outside_school` |
| `targetLevel` | `elementary` |
| textbook | `Business Case Study Workbook` |
| **상세에서 확인** | LNB 기관·강사·진행(기관/강사)·담당자 · **설문 LNB 없음** · 게시글 앵커(FE는 001에 posts 연동) |

```json
{
  "programType": "COMPANY_SCHOOL",
  "title": "HSBC/HKU Business Case Competition 2026 모집 안내",
  "mainTitle": "HSBC/HKU Business Case Competition 2026",
  "status": "pending",
  "lifecycleStatus": "planned",
  "generalParticipantTypes": ["school_institution", "teacher_instructor"],
  "generalSurveyMenuKeys": [],
  "generalVolunteerInterviewEnabled": false,
  "generalProgramAudience": "organization",
  "generalProgramEducationStructure": "curriculum",
  "generalProgramSessionRound": "single",
  "institutionType": "outside_school",
  "targetLevel": "elementary",
  "businessArea": "경제금융",
  "ips": "Succeed",
  "programCategory": "Competition (대회+시상)",
  "textbookName": "Business Case Study Workbook"
}
```

---

### CS-02 — recruiting_students · 설문 single

| 항목 | 값 |
|------|-----|
| FE mock id | `economy-prog-002` |
| title | `2026 JA Korea 대학생경제교육봉사단 UJAT 36기 모집` |
| `status` / `lifecycleStatus` | `pending` / `recruiting_students` |
| survey | `["survey"]` |
| `targetLevel` | `high` |
| channel | `학교 방문 (School visit)` |
| **상세에서 확인** | 학교 모집 중 · 설문 LNB에 **설문조사만** |

```json
{
  "programType": "COMPANY_SCHOOL",
  "title": "2026 JA Korea 대학생경제교육봉사단 UJAT 36기 모집",
  "status": "pending",
  "lifecycleStatus": "recruiting_students",
  "generalSurveyMenuKeys": ["survey"],
  "generalParticipantTypes": ["school_institution", "teacher_instructor"],
  "targetLevel": "high",
  "programChannel": "학교 방문 (School visit)",
  "textbookName": "우리 지역",
  "instructors": 30,
  "instructorCapacity": 80
}
```

---

### CS-03 — recruiting_instructors · 설문 full

| 항목 | 값 |
|------|-----|
| FE mock id | `economy-prog-003` |
| title | `EY한영-JA Korea Growth to Professional 2026 대학생 참가자 모집` |
| `status` / `lifecycleStatus` | `pending` / `recruiting_instructors` |
| survey | **full** |
| 강사 모집 기간 | `instructorApplicationStartDate` / `instructorApplicationEndDate` **필수** |
| **상세에서 확인** | 강사 모집 병행 필드 · 설문 full(조사+만족도+강의평가) |

```json
{
  "programType": "COMPANY_SCHOOL",
  "title": "EY한영-JA Korea Growth to Professional 2026 대학생 참가자 모집",
  "status": "pending",
  "lifecycleStatus": "recruiting_instructors",
  "generalSurveyMenuKeys": ["survey", "satisfaction", "lecture_evaluation"],
  "instructorApplicationStartDate": "<ISO>",
  "instructorApplicationEndDate": "<ISO>",
  "applicationStartDate": "<ISO>",
  "applicationEndDate": "<ISO>",
  "ips": "Prepare",
  "textbookName": "Career Readiness Module",
  "instructors": 12
}
```

---

### CS-04 — matching_completed · 설문 none · inside_school

| 항목 | 값 |
|------|-----|
| FE mock id | `economy-prog-004` |
| title | `2026년 JA Korea 초등 경제교육 모집 안내` |
| `status` / `lifecycleStatus` | `pending` / `matching_completed` |
| survey | `[]` |
| `institutionType` | **`inside_school`** |
| `targetLevel` | `elementary` |
| **상세에서 확인** | 매칭 완료 · 교내 · 설문 없음 |

```json
{
  "programType": "COMPANY_SCHOOL",
  "title": "2026년 JA Korea 초등 경제교육 모집 안내",
  "status": "pending",
  "lifecycleStatus": "matching_completed",
  "generalSurveyMenuKeys": [],
  "institutionType": "inside_school",
  "targetLevel": "elementary",
  "textbookName": "Personal Finance",
  "instructors": 24,
  "totalParticipants": 238
}
```

---

### CS-05 — education_before_textbook · 설문 single

| 항목 | 값 |
|------|-----|
| FE mock id | `economy-prog-005` |
| title | `2026 SAP-함께 성장하JA! 참여 고등학생 모집 안내 (IT, SW 멘토링)` |
| `status` / `lifecycleStatus` | `active` / `education_before_textbook` |
| survey | `["survey"]` |
| **상세에서 확인** | 교재 전 단계 · 설문 single |

```json
{
  "programType": "COMPANY_SCHOOL",
  "title": "2026 SAP-함께 성장하JA! 참여 고등학생 모집 안내 (IT, SW 멘토링)",
  "status": "active",
  "lifecycleStatus": "education_before_textbook",
  "generalSurveyMenuKeys": ["survey"],
  "textbookName": "Digital Skills for Future",
  "partnerInvolvement": true,
  "courseDeliveredBy": "Jointly",
  "instructors": 28
}
```

---

### CS-06 — education_after_textbook · 설문 full · **진행 카드**

| 항목 | 값 |
|------|-----|
| FE mock id | `economy-prog-006` |
| title | `2026 SAP-JA Korea Global Career Discovery 원데이 취업 멘토링 대학생 참여자 모집` |
| `status` / `lifecycleStatus` | `active` / `education_after_textbook` |
| survey | **full** |
| overview | **진행** — start ≤ today < end 또는 `periodStatus=IN_PROGRESS` |
| **상세에서 확인** | 진행 버킷 · 설문 full · 참여 학교/학생 수 |

```json
{
  "programType": "COMPANY_SCHOOL",
  "title": "2026 SAP-JA Korea Global Career Discovery 원데이 취업 멘토링 대학생 참여자 모집",
  "status": "active",
  "lifecycleStatus": "education_after_textbook",
  "generalSurveyMenuKeys": ["survey", "satisfaction", "lecture_evaluation"],
  "participatingSchoolCount": 12,
  "participatingStudentCount": 360,
  "instructorCapacity": 40,
  "programCategory": "Workshop (워크숍)",
  "textbookName": "Career Discovery Guide"
}
```

---

### CS-07 — education_completed · 설문 full · **완료 카드**

| 항목 | 값 |
|------|-----|
| FE mock id | `economy-prog-007` |
| title | `2026년 JA Korea 경제금융교육 전문강사단 모집` |
| `status` / `lifecycleStatus` | `completed` / `education_completed` |
| survey | **full** |
| overview | **완료** |
| **상세에서 확인** | 교육 완료 · 설문 full |

```json
{
  "programType": "COMPANY_SCHOOL",
  "title": "2026년 JA Korea 경제금융교육 전문강사단 모집",
  "status": "completed",
  "lifecycleStatus": "education_completed",
  "generalSurveyMenuKeys": ["survey", "satisfaction", "lecture_evaluation"],
  "participatingSchoolCount": 15,
  "participatingStudentCount": 462,
  "textbookName": "어린이 금융박사 홈즈"
}
```

---

### CS-08 — document_processing_completed · 설문 none · **완료 카드**

| 항목 | 값 |
|------|-----|
| FE mock id | `economy-prog-008` |
| title | `2026년 한국씨티은행-JA Korea 특별한 JOB담 참가자 모집` |
| `status` / `lifecycleStatus` | `completed` / `document_processing_completed` |
| survey | `[]` |
| `institutionType` | `inside_school` |
| channel | `기업 연계 세미나 (Corporate seminar)` |
| **상세에서 확인** | 문서처리 완료 · 설문 없음 |

```json
{
  "programType": "COMPANY_SCHOOL",
  "title": "2026년 한국씨티은행-JA Korea 특별한 JOB담 참가자 모집",
  "status": "completed",
  "lifecycleStatus": "document_processing_completed",
  "generalSurveyMenuKeys": [],
  "institutionType": "inside_school",
  "programChannel": "기업 연계 세미나 (Corporate seminar)",
  "textbookName": "진로와 금융",
  "participatingSchoolCount": 8,
  "participatingStudentCount": 356
}
```

---

## 4. P1 시드 레시피 (CS-09 ~ CS-26) — 권장

P0로 커버되지 않는 **모집·면접·교육형태·임금·중첩·양식** 표면입니다. FE mock에 없으면 title에 `【1사1교·…】` 접두를 쓰고 id는 `company-school-seed-CS-NN` 권장.

### CS-09 — 설문 none 대조

CS-01과 동일 골격 + 명시적으로 keys=`[]`. 상세에서 설문 LNB가 **전혀 없어야** 함.

### CS-10 — 만족도 교사-only

```json
{
  "generalSurveyMenuKeys": ["survey", "satisfaction", "lecture_evaluation"],
  "lifecycleStatus": "education_after_textbook",
  "status": "active"
}
```

**상세에서 확인:** 만족도 탭이 **교사만** (학생·봉사자 탭 없음).  
FE: `isInstitutionTeacherOnlySatisfactionProgram` ([`survey-audience.ts`](../../src/features/program/general/lib/survey-audience.ts)).

### CS-11 — 강의평가 포함

keys에 `lecture_evaluation` 포함. 설문 LNB 하위 3항목 확인.

### CS-12 — 학교·강사 모집 기간 병행

`applicationStart/EndDate`와 `instructorApplicationStart/EndDate`가 **겹치는** 기간. 모집 탭 학교↔강사 sub 모두 활성.

### CS-13 — 강사 면접 on

강사 모집 정보에 면접 시작/종료/방법 필드 채움 (서류+면접 선발 UI).

```json
{
  "lifecycleStatus": "recruiting_instructors",
  "interviewStartDate": "<ISO>",
  "interviewEndDate": "<ISO>",
  "interviewMethod": "offline"
}
```

(필드명은 BE 계약/`serviceDetailJson`에 맞게 매핑 — FE는 강사 모집 표시용.)

### CS-14 — 강사 면접 off

면접 일정 **비움**. 서류 위주 모집 UI 대조.

### CS-15 — 학생 명단 not_required

```json
{ "studentListRequired": "not_required" }
```

모집 정보에서 명단 필수 아님 표시.

### CS-16 — 학급·배정 강사 한도

```json
{
  "generalCommonInfo": {
    "participantRecruitmentInfo": {
      "maxClassCount": 4,
      "maxAssignableInstructors": 2
    }
  }
}
```

> 1사1교에서는 **최대 일정 수 / 1일 최대 차시** 모집 UI는 숨김. 학급·배정 강사만.

### CS-17 — 교육형태「참여자 선택」(FE mock 갭)

교육형태 값을 **참여자 선택**으로 시드. 기관 신청 폼에 교육형태 선택 항목 노출.

```json
{
  "generalCommonInfo": {
    "educationFormLabel": "참여자 선택"
  }
}
```

### CS-18 — 교육형태 오프라인 고정

`educationFormLabel`: `오프라인` (또는 동등 enum). 신청 폼에 교육형태 선택 **숨김** (CS-17 대조).

### CS-19 — inside_school

CS-04와 동일하게 `institutionType=inside_school`. 목록/상세 교내 구분 확인.

### CS-20 — 교재 미정

textbook / 교재 바인딩을 비워 학교 상세·일정에 **「미정」** 표기.

### CS-21 — 임금·일사일교 지급 문구

§0.1 `wageGradeRows` + `paymentItems: "교통비(일사일교), 숙박비(일사일교)"` + `deductionItems` 유지. 공통정보 임금 섹션 확인.

### CS-22 — 편도 ≥100km 정산 행

참여 강사 중첩에 **편도 100km 이상** 거리·장거리 강사비 적용 행 ≥1.  
(상세 conversion Phase 8 — 교통비/숙박비 1사1교 전용 처리.)

### CS-23 — 학교 출석 데이터

참여 기관 중첩에 출석 세션 데이터 ≥1 학교. (Phase 7)

### CS-24 — 강사 배정·희망 일정

승인 강사 + 기관 배정 + 희망 일정 포맷(company-school schedule) 행.

### CS-25 — navigation LNB disable

`GET …/navigation`에서 예: 설문 또는 신청 LNB `enabled:false` 1건. FE가 disabled 키를 숨기는지 확인.

### CS-26 — economy form binding

create 직후 form-bindings:

| binding | template key |
|---------|----------------|
| 등록 | `registration-economy` |
| 신청 | `application-economy` |

시드: [writing-form-seeds-backend-handoff.md](./writing-form-seeds-backend-handoff.md).

---

## 5. P2 시드 레시피 (CS-27 ~ CS-38) — 운영

| CASE | 시드 포인트 |
|------|-------------|
| **CS-27** | 일정 위젯 `company_school` 카테고리 이벤트 ≥1 |
| **CS-28** | 후원사 상세에 본 프로그램 링크 (FE mock은 001–008 후원사 연동) |
| **CS-29** | 게시글·첨부 ≥1 (FE: `economy-prog-001` posts/files 패턴) |
| **CS-30** | 강의보고서 bulk PDF 대상 행 ≥2 |
| **CS-31** | 기관 신청 pending ≥3 (일괄 승인/반려 QA) |
| **CS-32** | overview **예정**만 bulk delete 가능 정책용 시드 |
| **CS-33** | 정산 항목 마스터에 `교통비 (1사1교)` / `숙박비 (1사1교)` 연결 — [settlement-item-settings 시드](./settlement-item-settings-dummy-seed-backend-request.md) |
| **CS-34** | 담당자 1명 이상 (managers API 준비 시) |
| **CS-35** | 설문 responses/summary + answers 샘플 (Phase 9) |
| **CS-36** | 안정적 numeric/string `programId` — `?programId=` deep-link round-trip |
| **CS-37** | `businessYear` 필터·keyword(title) 검색에 걸리도록 연도·제목 명시 |
| **CS-38** | title이 일반/UJAT/E2E 시드와 **절대 충돌하지 않음** 검증용 샘플 1건 |

---

## 6. 필드 사전 (1사1교)

| FE / 도메인 키 | 값 | 설명 |
|----------------|-----|------|
| `programType` | `COMPANY_SCHOOL` | 목록 filter·create 필수 |
| `generalProgramAudience` | `organization` | 고정 |
| `generalProgramEducationStructure` | `curriculum` | 고정 |
| `generalProgramSessionRound` | `single` | 고정 · rounds=1 |
| `generalParticipantTypes` | `school_institution` + `teacher_instructor` | 봉사 제외 |
| `generalVolunteerInterviewEnabled` | `false` | 고정 |
| `generalSurveyMenuKeys` | `survey` \| `satisfaction` \| `lecture_evaluation` | 설문 LNB |
| `studentListRequired` | `not_required` (기본) | 일반 기관과 다름 |
| `educationScheduleMode` | `period` (mock) | 모집 최대일정 UI는 1사1교에서 숨김 |
| `maxClassCount` / `maxAssignableInstructors` | number | 학급·배정 한도 |
| `instructorApplicationStart/EndDate` | ISO | 강사 모집 병행 |
| `institutionType` | `inside_school` \| `outside_school` | 교내/교외 |
| `status` | `pending` \| `active` \| `completed` | |
| `lifecycleStatus` | `planned` · `recruiting_students` · `recruiting_instructors` · `matching_completed` · `education_before_textbook` · `education_after_textbook` · `education_completed` · `document_processing_completed` | 8단계 |
| `paymentItems` | `교통비(일사일교), 숙박비(일사일교)` | 일반 지급과 구분 |
| wage 장거리 | 급수별 `장거리 : N원` | 편도 100km 기준 |

생성 API/`serviceDetailJson` 매핑은 [programs-company-school-api-backend-handoff.md](./programs-company-school-api-backend-handoff.md) · [programs-create-api-backend-handoff.md](./programs-create-api-backend-handoff.md) 참고.

---

## 7. 검증 체크리스트

### P0 (CS-01~08)

- [ ] `/programs/company-school`에서 8개 title 각각 검색됨
- [ ] `programType=COMPANY_SCHOOL`만 노출 (GENERAL과 섞이지 않음)
- [ ] overview: 진행(CS-06) · 완료(CS-07,08) · 나머지 예정 구분
- [ ] 전 CASE: LNB 기관 신청 · 강사 신청 · 진행(참여 기관/강사) · **봉사자 LNB 없음**
- [ ] 합반 UI 없음 · 과제 탭 없음
- [ ] CS-01/04/08: 설문 LNB 없음 / CS-02/05: 설문조사만 / CS-03/06/07: 설문 full
- [ ] CS-03: 강사 모집 기간 필드 표시
- [ ] CS-04: `inside_school`
- [ ] 기관·강사 신청 3상태 행 · 참여 기관/강사 ≥1
- [ ] 일반 E2E title과 충돌 없음
- [ ] `[수정 가능] 1사1교 프로그램 더미`(CS-EDIT) 와 title 충돌 없음 · 목록 검색·「정보 수정」 가능

### E2E 수정 더미 (CS-EDIT)

- [ ] title 정확히 `[수정 가능] 1사1교 프로그램 더미`
- [ ] `lifecycleStatus=planned` · **사업 시작일 미래** (정보 수정 게이트)
- [ ] 학교/기관 + 강사만 · 봉사자 없음 · economy 양식 바인딩
- [ ] 일반 `[수정 가능] 일반 프로그램 더미` 와 title 충돌 없음

### P1 (CS-09~26)

- [ ] CS-10: 만족도 **교사만**
- [ ] CS-13 vs CS-14: 강사 면접 일정 on/off
- [ ] CS-16: 학급·배정 한도 (최대 일정/일일차시 UI는 **없음**)
- [ ] CS-17 vs CS-18: 교육형태 참여자선택 노출/숨김
- [ ] CS-22: 100km+ 장거리 정산 행
- [ ] CS-25: navigation disable 반영
- [ ] CS-26: economy 양식 binding

### P2 (CS-27~38)

- [ ] 일정 위젯 · 후원사 · 게시글
- [ ] bulk 승인/삭제/강의보고
- [ ] deep-link · businessYear/keyword
- [ ] 정산 항목 1사1교 교통·숙박

---

## 8. BE 회신 요청

1. 구현한 **CASE 번호 목록** + 각 **programId** + 최종 **title**
2. 목록/상세 응답에서 `programType` · participantTypes · surveyKeys · lifecycle · instructorApplication 기간 · wage/payment 노출 여부 (필드명)
3. P1 갭(CS-17 교육형태 참여자선택 · CS-22 100km · CS-23 출석 · CS-25 navigation) 수용 여부
4. (선택) 부록 A 하위 상태 시드를 프로그램에 붙일지 여부
5. 스테이징에서 `VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true` round-trip 가능 여부

---

## 9. FE 코드 참조

| 역할 | 경로 |
|------|------|
| Mock 8건 | `src/data/mock/economy-programs.ts` |
| 도메인 특성 | `.cursor/rules/1c-1s-program-characteristics.mdc` |
| API service/adapters | `src/features/program/1c-1s/api/*` |
| overview 4카드 | `src/features/program/1c-1s/lib/overview-stage-counts.ts` |
| 식별 | `src/features/program/1c-1s/lib/is-company-school-program.ts` |
| 등록 스냅샷 | `src/features/program/general/lib/registration-local-save.ts` (`variant=economy`) |
| 만족도 교사-only | `src/features/program/general/lib/survey-audience.ts` |
| 상세 LNB (company-school) | `src/features/program/general/ui/detail-modal/program-detail-fullpage-modal.tsx` |
| README | `src/features/program/1c-1s/README.md` |
| E2E 수정 더미 title | `tests/e2e/pages/company-school-seed-titles.ts` → `EDITABLE_COMPANY_SCHOOL_DUMMY_TITLE` |
| E2E 수정 스펙 | `tests/e2e/flows/programs/company-school-edit.spec.ts` |

---

## 5b. CS-EDIT — E2E 상세 풀페이지 수정 더미

Playwright `company-school-edit` 전용. **대표 프로그램명(국문)은 E2E가 변경하지 않으므로** title을 고정하세요.

| 항목 | 값 |
|------|-----|
| title | `[수정 가능] 1사1교 프로그램 더미` |
| id 권장 | `company-school-seed-CS-EDIT` |
| lifecycle | `planned` |
| status | `pending` |
| survey | full (`survey` · `satisfaction` · `lecture_evaluation`) |
| 사업 운영 기간 | **현재일 기준 +2개월 이후** 시작 (수정 가능 정책) |
| participantTypes | `school_institution` + `teacher_instructor` only |
| 양식 | `registration-economy` · `application-economy` |
| 봉사자 | **없음** |

공통 강제(§0.1) + 위 표. 모집·신청 양식 필드가 채워져 있어야 「정보 수정」·「양식 수정」이 동작합니다.

```json
{
  "programType": "COMPANY_SCHOOL",
  "title": "[수정 가능] 1사1교 프로그램 더미",
  "lifecycleStatus": "planned",
  "status": "pending",
  "generalParticipantTypes": ["school_institution", "teacher_instructor"],
  "generalVolunteers": 0,
  "generalProgramAudience": "organization",
  "generalProgramEducationStructure": "curriculum",
  "generalProgramSessionRound": "single",
  "rounds": [{ "roundNumber": 1 }],
  "generalSurveyMenuKeys": ["survey", "satisfaction", "lecture_evaluation"],
  "businessArea": "경제금융",
  "studentListRequired": "not_required"
}
```

---

## 부록 A — 하위 행 상태 매트릭스 (시드 참고)

> FE 신청 mock은 programId 스코프가 약합니다. **BE 시드는 프로그램별 행을 명시적으로 묶으세요.**

### A-1. 기관 신청

| 필드 | 값 |
|------|-----|
| `approvalStatus` | `pending` \| `rejected` \| `approved` |
| 합반 | **시드하지 않음** (UI 비노출) |
| 알림 시점 | `immediate` \| `on_announcement` \| `manual` (지원 시) |

### A-2. 강사 신청

| 필드 | 값 |
|------|-----|
| `approvalStatus` | `pending` \| `rejected` \| `approved` |
| 거리 | 일반 / **편도 ≥100km** (CS-22) |
| 교사 겸직 재직 | `ACTIVE` \| `ON_LEAVE` \| `TRANSFERRED` (지원 시) |

### A-3. 봉사자·개인 참여자

**시드 금지.**

### A-4. 참여 기관

| 필드 | 값 |
|------|-----|
| 교재 | `preparing` \| `shipping` \| `delivered` \| `not_applicable` \| **미정** (CS-20) |
| 승인 | `pending` \| `rejected` \| `approved` \| `cancelled` |
| 출석 세션 | CS-23 |

### A-5. 참여 강사 정산

정산 **8종** 각 ≥1 (가능하면 CS-06/22에 분산):

| status | 라벨 |
|--------|------|
| `payment_statement_reapplication` | 지급조서 재신청 |
| `awaiting_confirmation` | 확인 대기 중 |
| `partial_confirmation` | 확인 진행 중 |
| `payment_statement_verified` | 지급조서 확인 완료 |
| `account_paid` | 계좌 지급 완료 |
| `none` | 해당 없음 |
| `application_rejected` | 신청 반려 |
| `payment_correction_requested` | 지급 정정 요청 |

부가: 장거리(100km+) · `교통비(일사일교)` · `숙박비(일사일교)`.

### A-6. 만족도 audience

| 프로그램 조건 | 만족도 탭 |
|---------------|-----------|
| 1사1교 + `satisfaction` ∈ keys | **교사만** (학생·봉사 탭 없음) |

---

## 부록 B — 일반 프로그램 시드와의 차이

| 항목 | 1사1교 (본 문서) | 일반 ([general-program-dummy-seed](./general-program-dummy-seed-backend-request.md)) |
|------|------------------|-------------------------------------------------------------------------------------|
| `programType` | `COMPANY_SCHOOL` | `GENERAL` |
| CASE 축 | lifecycle × survey × 운영 표면 | audience × structure × session × LNB 매트릭스 |
| 봉사자 | **없음** | LNB·면접 가능 |
| 개인 audience | **없음** | CASE-03 등 |
| 복수 회차 / 일정형 | **없음** | multi / schedule CASE |
| progress | 기관·강사만 | 개인 시 출석·과제·게시글 |
| 합반 | **숨김** | 가능 |
| 모집 최대일정/일일차시 | **숨김** | period·curriculum multi에서 노출 |
| 만족도 | 교사-only | 교사\|학생 / 참여자 / 봉사 |
| 임금 | 장거리·일사일교 지급 | 일반 지급 |
| FE mock 수 | 8건 | 25건(+갭) |
| Gate | `VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED` | `programs` 모듈 |

---

## 부록 C — QA 빠른 조회 (FE id ↔ CASE)

| FE `programId` | CASE | lifecycle | survey |
|----------------|------|-----------|--------|
| `economy-prog-001` | CS-01 | planned | none |
| `economy-prog-002` | CS-02 | recruiting_students | single |
| `economy-prog-003` | CS-03 | recruiting_instructors | full |
| `economy-prog-004` | CS-04 | matching_completed | none |
| `economy-prog-005` | CS-05 | education_before_textbook | single |
| `economy-prog-006` | CS-06 | education_after_textbook | full |
| `economy-prog-007` | CS-07 | education_completed | full |
| `economy-prog-008` | CS-08 | document_processing_completed | none |

P1·P2 (`CS-09`~`CS-38`): FE id 없음 — BE `company-school-seed-CS-NN` 권장.
