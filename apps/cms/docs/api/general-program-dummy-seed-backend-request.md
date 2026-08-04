# 일반 프로그램 개인·기관 더미 시드 요청 (BE)

CMS `/programs/general` **목록 · 상세(풀페이지 모달) · LNB · 모집/신청/진행** 분기를 FE와 동일하게 검증하려면, 아래 **케이스 단위**로 더미 프로그램을 만들어 주세요.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-21 |
| **갱신** | 2026-07-23 — FE mock 필드 추출 · CASE별 시드 레시피 상세화 · 하위 상태 부록 |
| **대상** | 일반 프로그램만 (UJAT / 1사1교 / Gemini **제외**) |
| **FE SSOT** | [general-program-type-variant-spec.md](../../.cursor/rules/process/general-program-type-variant-spec.md) · [`variant.ts`](../../src/features/program/general/lib/variant.ts) · [`general-programs.ts`](../../src/data/mock/general-programs.ts) · [`detail-common-info-display.ts`](../../src/features/program/general/lib/detail-common-info-display.ts) · [`detail-meta.ts`](../../src/features/program/general/lib/detail-meta.ts) |

**관련 문서**

- [programs-create-api-backend-handoff.md](./programs-create-api-backend-handoff.md)
- [programs-registration-flow-api-backend-handoff.md](./programs-registration-flow-api-backend-handoff.md)
- [general-program-institution-application-bridge-spec.md](../../.cursor/rules/process/general-program-institution-application-bridge-spec.md)
- [mock-data.md](../../.cursor/rules/data/mock-data.md)

> **금지:** 기존 E2E 시드 `[수정 가능] 일반 프로그램 더미` 와 title을 같게 만들거나 덮어쓰지 마세요.

---

## 0. 이 문서를 읽는 법

1. **§1 마스터 리스트**에서 만들 케이스 번호(`CASE-01` …)를 고른다.
2. 각 CASE의 **시드 레시피**(필드 표·JSON)를 그대로 채운다.
3. **§2 상세 UI 잠금표**로 “이 시드가 열어 주는 상세 화면”을 확인한다.
4. 우선순위: **P0 → P1 → P2 → P3(갭)**.
5. 신청·참여·정산 **행 단위** 시드는 부록 A의 **상태 매트릭스**만 참고 (프로그램 CASE와 1:1 매핑 아님).

```text
P0 필수   CASE-01 ~ CASE-09   (유형 8종 + 교육·IPS 일정별 상이)     FE mock 9건
P1 권장   CASE-10 ~ CASE-18   (LNB 강사×봉사×설문 9건)               FE mock 9건
P2 권장   CASE-19 ~ CASE-24   (개인/기관 면접·만족도 대조)           FE mock 6건
P3 갭     CASE-25 ~ CASE-27   (FE mock 없음 — 기관 신청 브리지)     BE 신규 3건
참고      scheduled-1         (캘린더 QA A — CASE 번호 없음)
```

**FE mock 프로그램 시드 합계: 25건** (캘린더 7 + 유형 8 + 행15 1 + LNB 9).  
개인 audience 시드는 FE에서 `applyIndividualGeneralProgramScheduledState`로 **`status=pending`, `lifecycleStatus=planned`** 로 덮어씁니다. BE도 동일하게 맞춰 주세요.

---

## 1. 마스터 케이스 리스트 (한눈에)

| CASE | 우선 | FE `programId` | title (권장 / FE mock) | audience | structure | session | 한 줄 목적 |
|------|------|----------------|------------------------|----------|-----------|---------|------------|
| **CASE-01** | P0 | `general-prog-type-org-curriculum-single` | `일반 프로그램 (기관)_커리큘럼형_단일 회차` | org | curriculum | single | 기관 상세 SSOT · 모집 한도 · FULL LNB |
| **CASE-02** | P0 | `general-prog-type-org-curriculum-multi` | `일반 프로그램 (기관)_커리큘럼형_복수 회차` | org | curriculum | multi | 회차·과제 · 최대일정+1일최대차시 |
| **CASE-03** | P0 | `general-prog-type-ind-curriculum-single` | `일반 프로그램 (개인)_커리큘럼형_단일 회차` | ind | curriculum | single | 개인 LNB · 출석/과제/게시글 · 면접 on |
| **CASE-04** | P0 | `general-prog-type-ind-curriculum-multi` | `일반 프로그램 (개인)_커리큘럼형_복수 회차` | ind | curriculum | multi | 개인 + 복수 회차 |
| **CASE-05** | P0 | `general-prog-type-org-schedule-single` | `일반 프로그램 (기관)_일정형_단일 회차` | org | schedule | single | 일정형 공통정보 · date 기본(한도 숨김 대조) |
| **CASE-06** | P0 | `general-prog-type-org-schedule-multi` | `일반 프로그램 (기관)_일정형_복수 회차` | org | schedule | multi | **희망 일정 단락 전체 숨김** |
| **CASE-07** | P0 | `general-prog-type-ind-schedule-single` | `일반 프로그램 (개인)_일정형_단일 회차` | ind | schedule | single | 개인 + 일정형 |
| **CASE-08** | P0 | `general-prog-type-ind-schedule-multi` | `일반 프로그램 (개인)_일정형_복수 회차` | ind | schedule | multi | 개인 + 일정형 복수 |
| **CASE-09** | P0 | `general-prog-type-org-curriculum-multi-edu-ips-per-schedule` | `…커리큘럼형_복수 회차 · 교육·IPS 일정별 상이` | org | curriculum | multi | 회차별 교육형태·IPS 상이 |
| **CASE-10** | P1 | `general-prog-lnb-16` | `【LNB·16】강사 있음 · 봉사자 있음(면접 2depth) · 설문 있음(하위 4항목)` | org | curriculum | single | LNB full |
| **CASE-11** | P1 | `general-prog-lnb-17` | `【LNB·17】…봉사자 있음(면접 없음) · 설문 full` | org | curriculum | single | 봉사 1depth |
| **CASE-12** | P1 | `general-prog-lnb-18` | `【LNB·18】강사 없음 · 봉사 면접2depth · 설문 full` | org | curriculum | single | 강사 LNB 없음 |
| **CASE-13** | P1 | `general-prog-lnb-19` | `【LNB·19】강사 없음 · 봉사 면접없음 · 설문 없음` | org | curriculum | single | 설문 없음 |
| **CASE-14** | P1 | `general-prog-lnb-20` | `【LNB·20】강사 없음 · 봉사 면접없음 · 설문 single` | org | curriculum | single | 설문조사만 · completed |
| **CASE-15** | P1 | `general-prog-lnb-21` | `【LNB·21】강사 있음 · 봉사자 없음 · 설문 없음` | org | curriculum | single | 강사만 · recruiting_instructors |
| **CASE-16** | P1 | `general-prog-lnb-22` | `【LNB·22】강사 없음 · 봉사 면접2depth · 설문 없음` | org | curriculum | single | 봉사만+면접 · recruiting_students |
| **CASE-17** | P1 | `general-prog-lnb-23` | `【LNB·23】강사 있음 · 봉사 면접2depth · 설문 없음` | org | curriculum | single | 설문 없이 FULL 신청 |
| **CASE-18** | P1 | `general-prog-lnb-24` | `【LNB·24】강사 없음 · 봉사 면접2depth · 설문 single` | org | curriculum | single | 봉사+설문 single · completed |
| **CASE-19** | P2 | `general-prog-scheduled-2` | `【예정·캘린더·B】UJAT 36기` | ind | schedule | multi | 참여자 면접만 · 만족도「참여자」 |
| **CASE-20** | P2 | `general-prog-in-progress-2` | `【진행·캘린더·B】특별한 JOB탐` | ind | schedule | single | 참여자+봉사 면접 · 만족도 봉사탭 |
| **CASE-21** | P2 | `general-prog-completed-2` | `【완료·캘린더·B】Global Career Discovery` | ind | schedule | single | 면접 1depth 대조 |
| **CASE-22** | P2 | `general-prog-in-progress-3` | `【진행·캘린더·C】기관·봉사자 면접 QA` | org | curriculum | single | 기관+봉사 면접 2depth |
| **CASE-23** | P2 | `general-prog-completed-1` | `【완료·캘린더·A】SAP 함께 성장JA` | org | — | — | 봉사 있으나 면접 없음 |
| **CASE-24** | P2 | `general-prog-in-progress-1` | `【진행·캘린더·A】Growth to Professional 2026` | org | curriculum | multi | 만족도 교사\|학생 (봉사없음) |
| **CASE-25** | P3 | *(FE 없음)* | `【브리지】기관 · 일정형단일 · 기간지정 · 최대일정수` | org | schedule | single | FE mock **갭** |
| **CASE-26** | P3 | *(FE 없음)* | `【브리지】기관 · 교육형태 참여자선택` | org | — | — | 희망 교육 형태 FE mock **갭** |
| **CASE-27** | P3 | *(FE 없음)* | `【브리지】기관 · 사전안내 불필요` | org | — | — | 안내 단락 숨김 FE mock **갭** |

`org` = `organization`, `ind` = `individual`

**참고 시드 (CASE 번호 없음):** `general-prog-scheduled-1` — `【예정·캘린더·A】HSBC Business Case 2026` · org · types=`school_institution`만 · survey full · `lifecycleStatus=recruiting_students` · `status=pending`.

---

## 2. 상세 UI 잠금표 (이 시드가 열어 주는 화면)

상세 풀페이지 모달 LNB·모집·진행은 **프로그램 필드**로 켜집니다.

| 상세 UI | 잠금 조건 | 대표 CASE |
|---------|-----------|-----------|
| LNB 「기관 신청 목록」 | `audience=organization` + `school_institution` | 01,02,05,06,09–18,22–27 |
| LNB 「참여자 신청 목록」 | `audience=individual` + `individual` | 03,04,07,08,19–21 |
| LNB 강사 신청 · 진행「참여 강사」 | `teacher_instructor` ∈ types | FULL / 10,11,15,17,19 … |
| LNB 봉사자 신청 · 진행「참여 봉사자」 | `volunteer` ∈ types | FULL / 10–14,16–18,20–23 … |
| 참여자 신청 **면접 2depth** | individual + `generalParticipantInterviewEnabled=true` | 03,04,07,08,19,20 |
| 참여자 신청 **1depth(면접 없음)** | individual + interview `false` | 21 |
| 봉사자 신청 **면접 2depth** | volunteer + `generalVolunteerInterviewEnabled=true` | 01–09 FULL, 10,12,16–18,20,22 |
| 봉사자 신청 **1depth** | volunteer + interview `false` | 11,13,14,21,23 |
| 진행「참여 기관」 | organization + school | org CASE |
| 진행「참여자」+ **출석·과제·게시글** | **individual만** | 03,04,07,08,19–21 |
| 모집 — 학생 명단·최대 학급·배정 강사 한도 | organization (기관 모집) | org CASE |
| 모집 — 참여자「면접 유무」·서류/면접 일정 | individual + interview | 19,20 vs 21 |
| 모집 — **최대 일정 수** | org + `educationScheduleMode=period` + (curriculum any \| schedule+single) | 01,02,25 |
| 모집 — **1일 최대 차시** | org + curriculum + **multi** + `period` | 02,09 |
| 기관 신청 — **희망 일정 단락 숨김** | org + schedule + **multi** | **06** |
| 기관 신청 — **희망 교육 형태** | org + 교육형태「참여자 선택」 | **26** (갭) |
| 기관 신청 — 안내 사항 숨김 | `preEducationNoticeRequired=false` | **27** (갭) |
| 설문 LNB full | keys = survey+satisfaction+lecture_evaluation | 01–09,10–12 … |
| 설문 single | `['survey']` | 14,18,21 |
| 설문 none | `[]` | 13,15–17,23 |
| 만족도 탭 **교사\|학생** | org + satisfaction + **봉사 없음** | **24** |
| 만족도 탭 **참여자** | individual + satisfaction + **봉사 없음** | **19** |
| 만족도 탭 **봉사자(상/하)** | satisfaction + volunteer | 20 등 |
| 공통정보 — 회차별 교육형태·IPS 상이 | per-schedule flags | **09** |

---

## 3. P0 시드 레시피 (CASE-01 ~ 09) — 필수

### 공통 규칙 (P0)

```json
{
  "generalVolunteerInterviewEnabled": true,
  "generalSurveyMenuKeys": ["survey", "satisfaction", "lecture_evaluation"]
}
```

| audience | `generalParticipantTypes` | 목록 `category` | `generalParticipantInterviewEnabled` |
|----------|---------------------------|-----------------|--------------------------------------|
| organization | `["school_institution","teacher_instructor","volunteer"]` | `school` | (미사용 / omit) |
| individual | `["individual","teacher_instructor","volunteer"]` | `individual` | `true` |
| multi | `rounds` **길이 ≥ 2** | | |

개인·기관 **상호 배타** — `individual`과 `school_institution`를 동시에 넣지 마세요.

**개인 audience 강제 상태 (FE mock과 동일):**

```json
{ "status": "pending", "lifecycleStatus": "planned" }
```

---

### CASE-01 — 기관 · 커리큘럼 · 단일

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-type-org-curriculum-single` |
| title (FE) | `【유형·7】일반 프로그램 (기관)_커리큘럼형_단일 회차` |
| title (권장 BE) | `일반 프로그램 (기관)_커리큘럼형_단일 회차` |
| `status` / `lifecycleStatus` | `active` / `education_in_progress` |
| 유형 필드 | `audience=organization`, `structure=curriculum`, `session=single` |
| types | `school_institution` + `teacher_instructor` + `volunteer` |
| 면접·설문 | volunteer interview `true`, survey **full** |
| 모집 한도 (mock) | `educationScheduleMode=period`, `maxScheduleCount=3`, `maxSessionsPerDay=8`, `maxClassCount=4`, `maxAssignableInstructors=2`, `studentListRequired=required`, `preEducationNoticeRequired=true` |
| 공통정보 핵심 | `educationFormLabel=온라인`, `ipsTypeSummary=일정 공통 \| Prepare \| 해당없음`, curriculumSessions 2차시 |
| **상세에서 확인** | 「기관 신청 목록」·「참여 기관」·강사/봉사 LNB(봉사 면접 2depth)·설문 full · 모집 한도·최대 일정 수 · 커리큘럼 차시 공통정보 |

```json
{
  "generalProgramAudience": "organization",
  "generalProgramEducationStructure": "curriculum",
  "generalProgramSessionRound": "single",
  "category": "school",
  "status": "active",
  "lifecycleStatus": "education_in_progress",
  "generalParticipantTypes": ["school_institution", "teacher_instructor", "volunteer"],
  "generalVolunteerInterviewEnabled": true,
  "generalSurveyMenuKeys": ["survey", "satisfaction", "lecture_evaluation"],
  "generalCommonInfo": {
    "educationFormLabel": "온라인",
    "educationScheduleMode": "period",
    "participantRecruitmentInfo": {
      "preEducationNoticeRequired": true,
      "maxScheduleCount": 3,
      "maxSessionsPerDay": 8,
      "maxClassCount": 4,
      "maxAssignableInstructors": 2
    }
  },
  "studentListRequired": "required"
}
```

---

### CASE-02 — 기관 · 커리큘럼 · 복수

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-type-org-curriculum-multi` |
| title (권장) | `일반 프로그램 (기관)_커리큘럼형_복수 회차` |
| `status` / `lifecycleStatus` | `active` / `education_in_progress` |
| 필드 | org + curriculum + **multi**, `rounds` ≥ 2 |
| 공통정보 | CASE-01 모집 한도 상속 + curriculumSessions **회차** 단위(1회차·2회차, assignmentEnabled) |
| **상세에서 확인** | 회차별 커리큘럼·과제 UI · 모집 **최대 일정 수 + 1일 최대 차시** · 기관 신청 폼 일정당 차시 상한 |

```json
{
  "generalProgramAudience": "organization",
  "generalProgramEducationStructure": "curriculum",
  "generalProgramSessionRound": "multi",
  "category": "school",
  "status": "active",
  "lifecycleStatus": "education_in_progress",
  "generalParticipantTypes": ["school_institution", "teacher_instructor", "volunteer"],
  "generalVolunteerInterviewEnabled": true,
  "generalSurveyMenuKeys": ["survey", "satisfaction", "lecture_evaluation"],
  "generalCommonInfo": {
    "educationScheduleMode": "period",
    "participantRecruitmentInfo": {
      "maxScheduleCount": 3,
      "maxSessionsPerDay": 8,
      "maxClassCount": 4
    }
  }
}
```

---

### CASE-03 — 개인 · 커리큘럼 · 단일

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-type-ind-curriculum-single` |
| title (권장) | `일반 프로그램 (개인)_커리큘럼형_단일 회차` |
| `status` / `lifecycleStatus` | **`pending` / `planned`** (개인 강제) |
| types | `individual` + `teacher_instructor` + `volunteer` |
| flags | `generalParticipantInterviewEnabled=true`, `generalVolunteerInterviewEnabled=true`, survey full |
| **상세에서 확인** | 「참여자 신청」2depth · 진행「참여자」+ **출석·과제·게시글** · 강사/봉사 LNB · 설문 full |

```json
{
  "generalProgramAudience": "individual",
  "generalProgramEducationStructure": "curriculum",
  "generalProgramSessionRound": "single",
  "category": "individual",
  "status": "pending",
  "lifecycleStatus": "planned",
  "generalParticipantTypes": ["individual", "teacher_instructor", "volunteer"],
  "generalParticipantInterviewEnabled": true,
  "generalVolunteerInterviewEnabled": true,
  "generalSurveyMenuKeys": ["survey", "satisfaction", "lecture_evaluation"]
}
```

---

### CASE-04 — 개인 · 커리큘럼 · 복수

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-type-ind-curriculum-multi` |
| title (권장) | `일반 프로그램 (개인)_커리큘럼형_복수 회차` |
| 필드 | CASE-03 + `session=multi`, `rounds` ≥ 2 |
| `status` / `lifecycleStatus` | `pending` / `planned` |
| **상세에서 확인** | CASE-03 LNB + 복수 회차 커리큘럼 |

---

### CASE-05 — 기관 · 일정형 · 단일

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-type-org-schedule-single` |
| title (권장) | `일반 프로그램 (기관)_일정형_단일 회차` |
| `status` / `lifecycleStatus` | `active` / `education_in_progress` |
| 유형 | org + schedule + single · FULL LNB · volunteer interview on · survey full |
| 공통정보 핵심 | `educationFormLabel=온라인`, `ipsTypeSummary=일정 공통 \| Succeed \| Competition…`, scheduleDetails(오리엔테이션·온라인 워크숍) |
| `educationScheduleMode` | FE 스크린샷 mock은 **미설정 → 표시 기본 `date`** (최대 일정 수 **숨김** 대조). period+한도는 **CASE-25** |
| **상세에서 확인** | 일정형 공통정보 · 희망 일정 힌트만 / 한도 숨김 · FULL LNB |

```json
{
  "generalProgramAudience": "organization",
  "generalProgramEducationStructure": "schedule",
  "generalProgramSessionRound": "single",
  "category": "school",
  "status": "active",
  "lifecycleStatus": "education_in_progress",
  "generalParticipantTypes": ["school_institution", "teacher_instructor", "volunteer"],
  "generalVolunteerInterviewEnabled": true,
  "generalSurveyMenuKeys": ["survey", "satisfaction", "lecture_evaluation"],
  "generalCommonInfo": {
    "educationFormLabel": "온라인",
    "educationScheduleMode": "date"
  }
}
```

---

### CASE-06 — 기관 · 일정형 · 복수

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-type-org-schedule-multi` |
| title (권장) | `일반 프로그램 (기관)_일정형_복수 회차` |
| `status` / `lifecycleStatus` | `active` / `education_after_textbook` (유형 index 5 mock) |
| 공통정보 (FE overlay) | `educationFormScheduleDetail=perSchedule`, `participationScheduleDetail=perSchedule`, `ipsScheduleDetail=perSchedule`, 행사 일정 01·02 |
| **상세에서 확인** | 기관 신청에서 **희망 일정 단락 전체 숨김** · 행사 일정·과제 설정 UI |

```json
{
  "generalProgramAudience": "organization",
  "generalProgramEducationStructure": "schedule",
  "generalProgramSessionRound": "multi",
  "category": "school",
  "status": "active",
  "lifecycleStatus": "education_after_textbook",
  "generalParticipantTypes": ["school_institution", "teacher_instructor", "volunteer"],
  "generalVolunteerInterviewEnabled": true,
  "generalSurveyMenuKeys": ["survey", "satisfaction", "lecture_evaluation"],
  "generalCommonInfo": {
    "educationFormScheduleDetail": "perSchedule",
    "participationScheduleDetail": "perSchedule",
    "ipsScheduleDetail": "perSchedule"
  }
}
```

---

### CASE-07 — 개인 · 일정형 · 단일

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-type-ind-schedule-single` |
| title (권장) | `일반 프로그램 (개인)_일정형_단일 회차` |
| `status` / `lifecycleStatus` | `pending` / `planned` |
| flags | participant + volunteer interview `true`, survey full |
| 공통정보 | scheduleDetails 최소 1건(`세부 일정 01` / `1차 교육` / 참여방식 `팀`) — FE type seed |
| **상세에서 확인** | CASE-03 LNB + 일정형 공통정보 |

---

### CASE-08 — 개인 · 일정형 · 복수

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-type-ind-schedule-multi` |
| title (권장) | `일반 프로그램 (개인)_일정형_복수 회차` |
| 필드 | CASE-07 + `session=multi`, `rounds` ≥ 2 |
| `status` / `lifecycleStatus` | `pending` / `planned` |
| **상세에서 확인** | 개인 LNB + 일정형 복수 회차 |

---

### CASE-09 — 기관 · 커리큘럼 · 복수 · 교육·IPS 일정별 상이

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-type-org-curriculum-multi-edu-ips-per-schedule` |
| title (FE) | `【유형·15】일반 프로그램 (기관)_커리큘럼형_복수 회차 · 교육·IPS 일정별 상이` |
| `status` / `lifecycleStatus` | `active` / `education_after_textbook` |
| 필드 | CASE-02와 동일 유형 + **회차별** educationForm / ips 상이 |
| 공통정보 핵심 | `educationFormScheduleDetail=perSchedule`, `ipsScheduleDetail=perSchedule`, `participationScheduleDetail=common`, `ipsTypeSummary=일정 별 상이 \| Prepare \| 해당없음` |
| 회차 예시 | 1회차 `educationFormLabel=온라인` · 2회차 `educationFormLabel=오프라인` |
| **상세에서 확인** | 공통정보에서 회차마다 교육 형태·IPS 라벨이 **다르게** 표시 (CASE-02와 구분) |

```json
{
  "generalProgramAudience": "organization",
  "generalProgramEducationStructure": "curriculum",
  "generalProgramSessionRound": "multi",
  "status": "active",
  "lifecycleStatus": "education_after_textbook",
  "generalParticipantTypes": ["school_institution", "teacher_instructor", "volunteer"],
  "generalVolunteerInterviewEnabled": true,
  "generalSurveyMenuKeys": ["survey", "satisfaction", "lecture_evaluation"],
  "generalCommonInfo": {
    "educationFormScheduleDetail": "perSchedule",
    "ipsScheduleDetail": "perSchedule",
    "participationScheduleDetail": "common",
    "educationScheduleMode": "period",
    "curriculumSessions": [
      { "sessionLabel": "1회차", "educationFormLabel": "온라인", "ipsTypeSummary": "Prepare | 해당없음" },
      { "sessionLabel": "2회차", "educationFormLabel": "오프라인", "ipsTypeSummary": "Prepare | 해당없음" }
    ]
  }
}
```

---

## 4. P1 시드 레시피 (CASE-10 ~ 18) — LNB 매트릭스

전부: `audience=organization`, `structure=curriculum`, `session=single`, `school_institution` 기본 포함.  
FE: `general-prog-lnb-16` … `general-prog-lnb-24`.

| CASE | FE id | 강사 | 봉사 | `generalVolunteerInterviewEnabled` | `generalSurveyMenuKeys` | `generalParticipantTypes` | `status` / `lifecycleStatus` (FE) |
|------|-------|------|------|------------------------------------|-------------------------|---------------------------|-----------------------------------|
| 10 | `…-lnb-16` | O | 면접2depth | `true` | full | school+instructor+volunteer | `active` / `education_after_textbook` |
| 11 | `…-lnb-17` | O | 면접없음 | `false` | full | school+instructor+volunteer | `active` / `education_after_textbook` |
| 12 | `…-lnb-18` | X | 면접2depth | `true` | full | school+volunteer | `active` / `education_after_textbook` |
| 13 | `…-lnb-19` | X | 면접없음 | `false` | `[]` | school+volunteer | `active` / `education_after_textbook` |
| 14 | `…-lnb-20` | X | 면접없음 | `false` | `["survey"]` | school+volunteer | **`completed` / `document_processing_completed`** |
| 15 | `…-lnb-21` | O | **없음** | omit | `[]` | school+instructor | **`pending` / `recruiting_instructors`** |
| 16 | `…-lnb-22` | X | 면접2depth | `true` | `[]` | school+volunteer | **`pending` / `recruiting_students`** |
| 17 | `…-lnb-23` | O | 면접2depth | `true` | `[]` | school+instructor+volunteer | `active` / `education_after_textbook` |
| 18 | `…-lnb-24` | X | 면접2depth | `true` | `["survey"]` | school+volunteer | **`completed` / `education_completed`** |

**full** = `["survey","satisfaction","lecture_evaluation"]`

### 상세에서 CASE별 확인 포인트

| CASE | 상세 확인 |
|------|-----------|
| 10 | 강사·봉사·설문 전부 · 봉사 **서류/합격/2차면접** 2depth |
| 11 | 봉사 LNB는 있으나 **면접 하위 메뉴 없음** |
| 12 | **강사 신청/진행 LNB 없음** · 봉사 2depth · 설문 full |
| 13 | 설문 LNB 비활성 · 봉사 1depth |
| 14 | 설문조사만 (만족도·강의평가 없음) · 완료 lifecycle |
| 15 | **봉사자 LNB 없음** · 강사만 · 설문 없음 · 강사 모집 중 |
| 16 | 강사 없음 · 봉사 2depth · 설문 없음 · 학생 모집 중 |
| 17 | 강사+봉사 2depth · 설문 없음 · 면접 방법 FE: `화상 면접` |
| 18 | 강사 없음 · 봉사 2depth · 설문 single · 교육 완료 |

### CASE-10 시드 JSON 예시 (나머지 P1은 위 표의 열만 바꿔 시드)

```json
{
  "title": "【LNB·16】강사 있음 · 봉사자 있음(면접 2depth) · 설문 있음(하위 4항목)",
  "generalProgramAudience": "organization",
  "generalProgramEducationStructure": "curriculum",
  "generalProgramSessionRound": "single",
  "category": "instructor",
  "status": "active",
  "lifecycleStatus": "education_after_textbook",
  "generalParticipantTypes": ["school_institution", "teacher_instructor", "volunteer"],
  "generalVolunteerInterviewEnabled": true,
  "interviewMethod": "대면 면접",
  "generalSurveyMenuKeys": ["survey", "satisfaction", "lecture_evaluation"]
}
```

---

## 5. P2 시드 레시피 (CASE-19 ~ 24) — 면접·만족도 대조

FE 캘린더/QA mock id를 참고용으로 적습니다. 스테이징 title은 FE 접두를 그대로 써도 되고, 아래 권장명을 써도 됩니다.

### CASE-19 — 개인 · 참여자 면접만 (강사 O · 봉사 X)

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-scheduled-2` |
| title (FE) | `【예정·캘린더·B】UJAT 36기` |
| types | `["individual","teacher_instructor"]` |
| flags | `generalParticipantInterviewEnabled=true`, volunteer **없음** |
| 유형 | `audience=individual`, `structure=schedule`, `session=multi` |
| survey | full (만족도 포함) |
| `status` / `lifecycleStatus` | `pending` / `planned` |
| 일정 | start `2026-07-05` · end `2026-10-15` · 강사 신청 기간 4/1–4/30 |
| **상세** | 참여자 신청 2depth · 진행 출석/과제/게시글 · 만족도 탭 **「참여자」** · 봉사 LNB 없음 |

```json
{
  "generalProgramAudience": "individual",
  "generalProgramEducationStructure": "schedule",
  "generalProgramSessionRound": "multi",
  "category": "individual",
  "status": "pending",
  "lifecycleStatus": "planned",
  "generalParticipantTypes": ["individual", "teacher_instructor"],
  "generalParticipantInterviewEnabled": true,
  "generalSurveyMenuKeys": ["survey", "satisfaction", "lecture_evaluation"]
}
```

---

### CASE-20 — 개인 · 참여자+봉사 면접 모두 on

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-in-progress-2` |
| title (FE) | `【진행·캘린더·B】특별한 JOB탐` |
| types | `["individual","volunteer"]` |
| flags | participant interview `true`, volunteer interview `true` |
| 유형 | individual · schedule · **single** |
| survey | full |
| `status` / `lifecycleStatus` | `pending` / `planned` (개인 강제) |
| 면접 | method `대면 면접`, 기간 `2026-05-08` ~ `2026-05-12` |
| **상세** | 참여자·봉사 **각각** 면접 2depth · 만족도는 봉사자 상/하반기 탭 |

```json
{
  "generalProgramAudience": "individual",
  "generalProgramEducationStructure": "schedule",
  "generalProgramSessionRound": "single",
  "category": "volunteer",
  "status": "pending",
  "lifecycleStatus": "planned",
  "generalParticipantTypes": ["individual", "volunteer"],
  "generalParticipantInterviewEnabled": true,
  "generalVolunteerInterviewEnabled": true,
  "interviewMethod": "대면 면접",
  "generalSurveyMenuKeys": ["survey", "satisfaction", "lecture_evaluation"]
}
```

---

### CASE-21 — 개인 · 면접 전부 없음

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-completed-2` |
| title (FE) | `【완료·캘린더·B】Global Career Discovery` |
| types | individual + volunteer |
| flags | 두 interview 모두 `false` |
| survey | `["survey"]` |
| `status` / `lifecycleStatus` | `pending` / `planned` (개인 강제 — FE는 완료 탭 일정만 유지) |
| **상세** | 신청 LNB **1depth** · 면접 하위 없음 |

```json
{
  "generalProgramAudience": "individual",
  "generalProgramEducationStructure": "schedule",
  "generalProgramSessionRound": "single",
  "category": "individual",
  "status": "pending",
  "lifecycleStatus": "planned",
  "generalParticipantTypes": ["individual", "volunteer"],
  "generalParticipantInterviewEnabled": false,
  "generalVolunteerInterviewEnabled": false,
  "generalSurveyMenuKeys": ["survey"]
}
```

---

### CASE-22 — 기관 · 봉사 면접 2depth

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-in-progress-3` |
| title (FE) | `【진행·캘린더·C】기관·봉사자 면접 QA` |
| types | school + instructor + volunteer |
| flags | `generalVolunteerInterviewEnabled=true` |
| 유형 | organization · curriculum · single |
| survey | `["survey","satisfaction"]` |
| `status` / `lifecycleStatus` | `active` / `education_in_progress` |
| **상세** | 「기관 신청 목록」+ 봉사 면접 2depth |

```json
{
  "generalProgramAudience": "organization",
  "generalProgramEducationStructure": "curriculum",
  "generalProgramSessionRound": "single",
  "category": "school",
  "status": "active",
  "lifecycleStatus": "education_in_progress",
  "generalParticipantTypes": ["school_institution", "teacher_instructor", "volunteer"],
  "generalVolunteerInterviewEnabled": true,
  "interviewMethod": "대면 면접",
  "generalSurveyMenuKeys": ["survey", "satisfaction"]
}
```

---

### CASE-23 — 기관 · 봉사 있으나 면접 없음

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-completed-1` |
| title (FE) | `【완료·캘린더·A】SAP 함께 성장JA` |
| types | school + instructor + volunteer |
| flags | `generalVolunteerInterviewEnabled=false` |
| survey | `[]` |
| `status` / `lifecycleStatus` | `completed` / `education_completed` |
| audience/structure/session | FE seed에 audience 미설정 — **org + school types**로 시드 (structure/session은 curriculum/single 권장) |
| **상세** | 봉사 LNB 있으나 2depth 없음 |

```json
{
  "category": "school",
  "status": "completed",
  "lifecycleStatus": "education_completed",
  "generalProgramAudience": "organization",
  "generalProgramEducationStructure": "curriculum",
  "generalProgramSessionRound": "single",
  "generalParticipantTypes": ["school_institution", "teacher_instructor", "volunteer"],
  "generalVolunteerInterviewEnabled": false,
  "generalSurveyMenuKeys": []
}
```

---

### CASE-24 — 기관 · 만족도 교사|학생 (봉사 없음)

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-in-progress-1` |
| title (FE) | `【진행·캘린더·A】Growth to Professional 2026` |
| types | `["school_institution","teacher_instructor"]` (**volunteer 없음**) |
| survey | `["survey","satisfaction"]` |
| 유형 | curriculum · **multi** (audience 미설정 → org로 시드) |
| `status` / `lifecycleStatus` | `active` / `education_in_progress` |
| **상세** | 만족도 탭 **교사 \| 학생** (봉사자 탭 없음) |

```json
{
  "generalProgramAudience": "organization",
  "generalProgramEducationStructure": "curriculum",
  "generalProgramSessionRound": "multi",
  "category": "instructor",
  "status": "active",
  "lifecycleStatus": "education_in_progress",
  "generalParticipantTypes": ["school_institution", "teacher_instructor"],
  "generalSurveyMenuKeys": ["survey", "satisfaction"]
}
```

---

### 참고 — `general-prog-scheduled-1` (CASE 번호 없음)

| 항목 | 값 |
|------|-----|
| title | `【예정·캘린더·A】HSBC Business Case 2026` |
| types | `["school_institution"]`만 |
| survey | full |
| `status` / `lifecycleStatus` | `pending` / `recruiting_students` |
| 일정 | start `2026-06-20` · end `2026-09-30` |
| 용도 | 캘린더 예정 탭 · 기관만 LNB (강사/봉사 없음) |

---

## 6. P3 갭 케이스 (CASE-25 ~ 27) — FE mock 없음, BE 신규 요청

유형 8종만으로는 안 열리는 **기관 신청 브리지** UI입니다.  
스펙: [general-program-institution-application-bridge-spec.md](../../.cursor/rules/process/general-program-institution-application-bridge-spec.md)

### CASE-25 — 일정형 단일 + **기간 지정** + 최대 일정 수

| 항목 | 값 |
|------|-----|
| 왜 필요? | CASE-05는 보통 `date`라서 **최대 일정 수**가 안 열림 |
| 필드 | org + schedule + single + **`educationScheduleMode=period`** + `maxScheduleCount` (예: 3) |
| types | CASE-01과 동일 FULL 권장 |
| **상세/신청** | 모집「신청 가능 최대 일정 수」· 신청 폼 희망 일정 지망 블록 |

```json
{
  "generalProgramAudience": "organization",
  "generalProgramEducationStructure": "schedule",
  "generalProgramSessionRound": "single",
  "generalParticipantTypes": ["school_institution", "teacher_instructor", "volunteer"],
  "generalVolunteerInterviewEnabled": true,
  "generalSurveyMenuKeys": ["survey", "satisfaction", "lecture_evaluation"],
  "generalCommonInfo": {
    "educationScheduleMode": "period",
    "participantRecruitmentInfo": { "maxScheduleCount": 3 }
  }
}
```

### CASE-26 — 교육 형태「참여자 선택」

| 항목 | 값 |
|------|-----|
| 왜 필요? | FE 스크린샷 mock은 교육형태가 `온라인` 고정 |
| 필드 | org + 교육 형태 라벨/값이 **참여자 선택** (`participant_selection`) |
| **상세/신청** | 기관 신청에 **「희망 교육 형태」** 필드 노출 |

```json
{
  "generalProgramAudience": "organization",
  "generalParticipantTypes": ["school_institution", "teacher_instructor", "volunteer"],
  "generalCommonInfo": {
    "educationFormLabel": "참여자 선택"
  }
}
```

### CASE-27 — 사전 안내「불필요」

| 항목 | 값 |
|------|-----|
| 왜 필요? | JOB담 등 기존 mock은 사전 안내 필요=`true` |
| 필드 | `participantRecruitmentInfo.preEducationNoticeRequired=false` |
| **상세/신청** | 기관 신청 폼에서 **안내 사항 단락 숨김** |

```json
{
  "generalProgramAudience": "organization",
  "generalParticipantTypes": ["school_institution", "teacher_instructor", "volunteer"],
  "generalCommonInfo": {
    "participantRecruitmentInfo": { "preEducationNoticeRequired": false }
  }
}
```

---

## 7. 필드 사전 (BE 매핑용)

| FE / 도메인 키 | 값 | 설명 |
|----------------|-----|------|
| `generalProgramAudience` | `organization` \| `individual` | 대분류 — 개인/기관 **상호 배타** |
| `generalProgramEducationStructure` | `curriculum` \| `schedule` | 커리큘럼형 / 일정형 |
| `generalProgramSessionRound` | `single` \| `multi` | 단일 / 복수 (`multi` → rounds≥2) |
| `generalParticipantTypes` | `school_institution` \| `individual` \| `teacher_instructor` \| `volunteer` | LNB·진행·모집 탭 잠금 |
| `generalParticipantInterviewEnabled` | boolean | **개인만** — 참여자 신청 면접 2depth |
| `generalVolunteerInterviewEnabled` | boolean | 봉사자 신청 면접 2depth |
| `generalSurveyMenuKeys` | `survey` \| `satisfaction` \| `lecture_evaluation` | 설문 LNB |
| `educationScheduleMode` | `date` \| `period` | 기관 희망 일정·한도 UI |
| `maxScheduleCount` | number | 신청 가능 최대 일정 수 |
| `maxSessionsPerDay` | number | 1일(일정당) 최대 차시 — curriculum+multi+period |
| `maxClassCount` | number | 신청 가능 최대 학급 수 (기관) |
| `maxAssignableInstructors` | number | 배정 가능 최대 강사 수 |
| `preEducationNoticeRequired` | boolean | false → 안내 사항 단락 숨김 |
| `studentListRequired` | `required` \| … | 학생 명단 필수 여부 |
| `educationFormScheduleDetail` | `common` \| `perSchedule` | 교육형태 일정별 상이 |
| `ipsScheduleDetail` | `common` \| `perSchedule` | IPS 일정별 상이 |
| `category` | `school` \| `individual` \| `instructor` \| `volunteer` | 목록 필터 (기관→`school`, 개인→`individual` 권장) |
| `status` | `pending` \| `active` \| `completed` | 목록/상세 상태 |
| `lifecycleStatus` | 예: `planned`, `recruiting_students`, `recruiting_instructors`, `education_in_progress`, `education_after_textbook`, `education_completed`, `document_processing_completed` | 진행 단계 |

생성 API/`serviceDetailJson` 매핑은 [programs-create-api-backend-handoff.md](./programs-create-api-backend-handoff.md) 참고.

---

## 8. 기관 신청 브리지 — 조합 요약

| 교육 구조 | 회차 | `educationScheduleMode` | 희망 일정 본문 | 최대 일정 수 | 1일 최대 차시 |
|-----------|------|-------------------------|----------------|--------------|---------------|
| curriculum | single | `period` | O | O | X |
| curriculum | multi | `period` | O | O | **O** |
| schedule | single | `period` | O | O | X |
| schedule | multi | (any) | **단락 전체 숨김** | — | — |
| (any applicable) | — | `date` | 힌트만 / 한도 숨김 | X | X |

대표 시드: CASE-01·02(period), CASE-05(date 대조), CASE-06(숨김), CASE-25(period+schedule single 갭).

---

## 9. 검증 체크리스트

### P0 (CASE-01~09)

- [ ] `/programs/general`에서 9개 title 각각 검색됨
- [ ] 기관 5건(01,02,05,06,09): LNB「기관 신청 목록」·「참여 기관」
- [ ] 개인 4건(03,04,07,08): LNB「참여자 신청 목록」·「참여자」·출석·과제·게시글 · `pending`/`planned`
- [ ] FULL LNB: 강사·봉사자·설문 노출, 봉사 면접 2depth
- [ ] multi: rounds≥2, 회차 UI가 single과 다름
- [ ] CASE-06: 기관 신청에서 희망 일정 단락 **없음**
- [ ] CASE-09: 회차별 교육형태·IPS가 CASE-02와 **다름**
- [ ] `[수정 가능] 일반 프로그램 더미` 와 title 충돌 없음

### P1 (CASE-10~18)

- [ ] 강사 X → 강사 신청/진행 LNB 없음
- [ ] 봉사 없음 → 봉사자 LNB 없음
- [ ] 면접 false → 봉사 2depth 없음
- [ ] 설문 none/single/full 메뉴 차이
- [ ] CASE-14/18 completed lifecycle, CASE-15/16 recruiting lifecycle

### P2~P3

- [ ] CASE-19 vs 21: 참여자 면접 2depth on/off
- [ ] CASE-19: 만족도「참여자」 / CASE-24: 만족도 교사\|학생 / CASE-20: 봉사자 상·하
- [ ] CASE-25~27: 브리지 갭 UI

---

## 10. BE 회신 요청

1. 구현한 **CASE 번호 목록** + 각 **programId** + 최종 **title**
2. 목록/상세 응답에서 audience · structure · session · participantTypes · interview · surveyKeys · lifecycle 노출 여부 (필드명)
3. P3(CASE-25~27) 수용 여부
4. (선택) 부록 A 하위 상태 시드를 프로그램에 붙일지 여부

---

## 11. FE 코드 참조

| 역할 | 경로 |
|------|------|
| 8종 상수 | `src/features/program/general/lib/variant.ts` |
| Mock 시드 (25건) | `src/data/mock/general-programs.ts` |
| 공통정보 스크린샷 | `src/features/program/general/lib/detail-common-info-display.ts` |
| 상세 LNB | `src/features/program/general/lib/detail-meta.ts` |
| 모집 표시 | `src/features/program/general/lib/participant-recruitment-display.ts` |
| 기관 신청 브리지 | `src/features/program/general/lib/institution-application-program-bridge.ts` |
| 만족도 audience | `src/features/program/general/lib/survey-audience.ts` |
| 정산 8종 | `src/shared/constants/instructor-settlement-status.ts` |
| E2E 수정 더미 | `tests/e2e/pages/general-program-edit.page.ts` → `EDITABLE_DUMMY_TITLE` |

---

## 부록 A — 하위 mock 상태 매트릭스 (시드 참고)

> 신청·참여·정산 mock은 **대부분 programId 공통 데모**입니다. CASE마다 행을 복제하지 말고, **상태 조합이 목록에 한 번씩** 보이도록 시드하세요.

### A-1. 기관 신청 (`applicant-institutions`)

| 필드 | 값 |
|------|-----|
| `approvalStatus` | `pending` \| `rejected` \| `approved` |
| 알림 시점 | `immediate` \| `on_announcement` \| `manual` |
| 특수 시나리오 | 합반(동일 학교·다른 학년), 진월초 특수 행 |

### A-2. 강사 신청 (`applicant-instructors`)

| 필드 | 값 |
|------|-----|
| `approvalStatus` | `pending` \| `rejected` \| `approved` |
| 교사 겸직 재직 | `ACTIVE` \| `ON_LEAVE` \| `TRANSFERRED` |
| 데모 스코프 예 | `INDIVIDUAL_PROGRAM_DEMO_INSTRUCTOR_PROGRAM_ID` = `general-prog-scheduled-2` (CASE-19) |

### A-3. 개인 참여자 신청 (`general-individual-applications-mock`)

| 필드 | 값 |
|------|-----|
| `approvalStatus` | `pending` \| `rejected` \| `approved` (+ 반려 사유 예: 인원초과) |
| 동의 | `personalInfoConsent` / `thirdPartyConsent` = `agree` \| `disagree` |
| 서류 | `pass` \| `fail` \| `pending` |
| 담당자 평가 | `pass` \| `neutral` \| `fail` \| `unreviewed` |
| 면접 배정 | `waiting` \| `assigned` \| `withdrawn` |
| 2차 면접 | `pass` 등 |

### A-4. 봉사자 신청 (`general-volunteer-applicants-mock`)

| 필드 | 값 |
|------|-----|
| 신청유형 | `new` \| `ujat-graduate` |
| 서류 / 면접 배정 | 개인 참여자와 동일 패턴 |
| 2차 면접 | `waiting` \| `completed` \| `pass` \| `fail` \| `reserve1`…`reserve4` \| `withdrawn` |

### A-5. 참여 기관 (`participating-schools`)

| 필드 | 값 |
|------|-----|
| 교재 | `preparing` \| `shipping` \| `delivered` \| `not_applicable` |
| 승인 | `pending` \| `rejected` \| `approved` \| `cancelled` |
| 세션 | `completed` \| `pending` \| `not_planned` |

### A-6. 참여 강사 정산 (`participating-instructors` / settlement)

정산 **8종** (각 1명 이상):

| status | 라벨 |
|--------|------|
| `payment_statement_reapplication` | 지급조서 재신청 |
| `awaiting_confirmation` | 확인 대기 |
| `partial_confirmation` | 부분 확인 |
| `payment_statement_verified` | 지급조서 확인 완료 |
| `account_paid` | 계좌 지급 완료 |
| `none` | 해당없음 |
| `application_rejected` | 신청 반려 |
| `payment_correction_requested` | 지급 정정 요청 |

부가: `lectureRound`(진행 전 / 1·2회차 / 완료), `activityWithdraw`, 개인 강사 회차별 verified / rejected / correction_requested / none / scheduled.

### A-7. 만족도 audience (`survey-audience.ts`)

| 프로그램 조건 | 만족도 탭 |
|---------------|-----------|
| org + satisfaction + **volunteer 없음** | 교사 \| 학생 (CASE-24) |
| individual + satisfaction + **volunteer 없음** | 참여자 (CASE-19) |
| satisfaction + **volunteer 있음** | 상반기 봉사자 \| 하반기 봉사자 (CASE-20 등) |

### A-8. QA 별칭 (FE 상수)

```text
GENERAL_PARTICIPANT_APPLICATION_QA
  individualWithInterview2Depth  → general-prog-scheduled-2   (CASE-19)
  individualWithBothInterviews   → general-prog-in-progress-2 (CASE-20)
  individualNoInterview          → general-prog-completed-2   (CASE-21)

GENERAL_VOLUNTEER_APPLICATION_QA
  individualWithInterview2Depth      → general-prog-in-progress-2 (CASE-20)
  individualNoInterview              → general-prog-completed-2   (CASE-21)
  organizationNoInterview            → general-prog-completed-1   (CASE-23)
  organizationWithInterview2Depth    → general-prog-in-progress-3 (CASE-22)
  lnbInterview2Depth                 → general-prog-lnb-16        (CASE-10)
  lnbNoInterview                     → general-prog-lnb-17        (CASE-11)
  lnbNoVolunteer                     → general-prog-lnb-21        (CASE-15)
```

---

## 부록 B — FE `programId` ↔ CASE 빠른 조회

| FE `programId` | CASE |
|----------------|------|
| `general-prog-type-org-curriculum-single` | 01 |
| `general-prog-type-org-curriculum-multi` | 02 |
| `general-prog-type-ind-curriculum-single` | 03 |
| `general-prog-type-ind-curriculum-multi` | 04 |
| `general-prog-type-org-schedule-single` | 05 |
| `general-prog-type-org-schedule-multi` | 06 |
| `general-prog-type-ind-schedule-single` | 07 |
| `general-prog-type-ind-schedule-multi` | 08 |
| `general-prog-type-org-curriculum-multi-edu-ips-per-schedule` | 09 |
| `general-prog-lnb-16` … `general-prog-lnb-24` | 10 … 18 |
| `general-prog-scheduled-2` | 19 |
| `general-prog-in-progress-2` | 20 |
| `general-prog-completed-2` | 21 |
| `general-prog-in-progress-3` | 22 |
| `general-prog-completed-1` | 23 |
| `general-prog-in-progress-1` | 24 |
| *(없음)* | 25, 26, 27 |
| `general-prog-scheduled-1` | 참고(번호 없음) |

**Last updated:** 2026-07-23
