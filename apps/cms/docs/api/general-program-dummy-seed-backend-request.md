# 일반 프로그램 개인·기관 더미 시드 요청 (BE)

CMS `/programs/general` **목록 · 상세(풀페이지 모달) · LNB · 모집/신청/진행** 분기를 FE와 동일하게 검증하려면, 아래 **케이스 단위**로 더미 프로그램을 만들어 주세요.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-21 |
| **갱신** | 2026-07-21 — 상세 페이지 케이스 전부 리스트업 |
| **대상** | 일반 프로그램만 (UJAT / 1사1교 / Gemini **제외**) |
| **FE SSOT** | [general-program-type-variant-spec.md](../../.cursor/rules/process/general-program-type-variant-spec.md) · [`variant.ts`](../../src/features/program/general/lib/variant.ts) · [`general-programs.ts`](../../src/data/mock/general-programs.ts) · [`detail-meta.ts`](../../src/features/program/general/lib/detail-meta.ts) |

**관련 문서**

- [programs-create-api-backend-handoff.md](./programs-create-api-backend-handoff.md)
- [programs-registration-flow-api-backend-handoff.md](./programs-registration-flow-api-backend-handoff.md)
- [general-program-institution-application-bridge-spec.md](../../.cursor/rules/process/general-program-institution-application-bridge-spec.md)
- [mock-data.md](../../.cursor/rules/data/mock-data.md)

> **금지:** 기존 E2E 시드 `[수정 가능] 일반 프로그램 더미` 와 title을 같게 만들거나 덮어쓰지 마세요.

---

## 0. 이 문서를 읽는 법

1. **§1 마스터 리스트**에서 만들 케이스 번호(`CASE-01` …)를 고른다.
2. 각 CASE의 **시드 레시피**(필드 JSON 형태)를 그대로 채운다.
3. **§2 상세 UI 잠금표**로 “이 시드가 열어 주는 상세 화면”을 확인한다.
4. 우선순위: **P0 → P1 → P2 → P3(갭)**.

```text
P0 필수   CASE-01 ~ CASE-09   (유형 8종 + 교육·IPS 일정별 상이)
P1 권장   CASE-10 ~ CASE-18   (LNB 강사×봉사×설문 9건)
P2 권장   CASE-19 ~ CASE-24   (개인/기관 면접·만족도 대조)
P3 갭     CASE-25 ~ CASE-27   (FE mock 없음 — 기관 신청 브리지 전용)
```

---

## 1. 마스터 케이스 리스트 (한눈에)

| CASE | 우선 | title (권장) | audience | structure | session | 한 줄 목적 |
|------|------|--------------|----------|-----------|---------|------------|
| **CASE-01** | P0 | `일반 프로그램 (기관)_커리큘럼형_단일 회차` | org | curriculum | single | 기관 상세 SSOT · 모집 한도 · FULL LNB |
| **CASE-02** | P0 | `일반 프로그램 (기관)_커리큘럼형_복수 회차` | org | curriculum | multi | 회차·과제 · 최대일정+1일최대차시 |
| **CASE-03** | P0 | `일반 프로그램 (개인)_커리큘럼형_단일 회차` | ind | curriculum | single | 개인 LNB · 출석/과제/게시글 · 면접 on |
| **CASE-04** | P0 | `일반 프로그램 (개인)_커리큘럼형_복수 회차` | ind | curriculum | multi | 개인 + 복수 회차 |
| **CASE-05** | P0 | `일반 프로그램 (기관)_일정형_단일 회차` | org | schedule | single | 일정형 공통정보 · date 기본(한도 숨김 대조) |
| **CASE-06** | P0 | `일반 프로그램 (기관)_일정형_복수 회차` | org | schedule | multi | **희망 일정 단락 전체 숨김** |
| **CASE-07** | P0 | `일반 프로그램 (개인)_일정형_단일 회차` | ind | schedule | single | 개인 + 일정형 |
| **CASE-08** | P0 | `일반 프로그램 (개인)_일정형_복수 회차` | ind | schedule | multi | 개인 + 일정형 복수 |
| **CASE-09** | P0 | `일반 프로그램 (기관)_커리큘럼형_복수 회차 · 교육·IPS 일정별 상이` | org | curriculum | multi | 회차별 교육형태·IPS 상이 |
| **CASE-10** | P1 | `【LNB】강사O · 봉사면접2depth · 설문full` | org | curriculum | single | LNB full |
| **CASE-11** | P1 | `【LNB】강사O · 봉사면접없음 · 설문full` | org | curriculum | single | 봉사 1depth |
| **CASE-12** | P1 | `【LNB】강사X · 봉사면접2depth · 설문full` | org | curriculum | single | 강사 LNB 없음 |
| **CASE-13** | P1 | `【LNB】강사X · 봉사면접없음 · 설문none` | org | curriculum | single | 설문 없음 |
| **CASE-14** | P1 | `【LNB】강사X · 봉사면접없음 · 설문single` | org | curriculum | single | 설문조사만 |
| **CASE-15** | P1 | `【LNB】강사O · 봉사없음 · 설문none` | org | curriculum | single | 강사만 |
| **CASE-16** | P1 | `【LNB】강사X · 봉사면접2depth · 설문none` | org | curriculum | single | 봉사만+면접 |
| **CASE-17** | P1 | `【LNB】강사O · 봉사면접2depth · 설문none` | org | curriculum | single | 설문 없이 FULL 신청 |
| **CASE-18** | P1 | `【LNB】강사X · 봉사면접2depth · 설문single` | org | curriculum | single | 봉사+설문 single |
| **CASE-19** | P2 | `【면접】개인 · 참여자면접2depth · 강사O · 봉사X` | ind | schedule | multi | 참여자 면접만 |
| **CASE-20** | P2 | `【면접】개인 · 참여자+봉사 면접2depth` | ind | — | — | 양쪽 면접 · 만족도 봉사탭 |
| **CASE-21** | P2 | `【면접】개인 · 참여자·봉사 면접없음` | ind | — | — | 면접 1depth 대조 |
| **CASE-22** | P2 | `【면접】기관 · 봉사면접2depth` | org | — | — | 기관+봉사 면접 |
| **CASE-23** | P2 | `【면접】기관 · 봉사면접없음` | org | — | — | 봉사 있으나 1depth |
| **CASE-24** | P2 | `【만족도】기관 · 교사|학생 (봉사없음)` | org | — | — | 만족도 교사·학생 탭 |
| **CASE-25** | P3 | `【브리지】기관 · 일정형단일 · 기간지정 · 최대일정수` | org | schedule | single | FE mock **갭** |
| **CASE-26** | P3 | `【브리지】기관 · 교육형태 참여자선택` | org | — | — | 희망 교육 형태 FE mock **갭** |
| **CASE-27** | P3 | `【브리지】기관 · 사전안내 불필요` | org | — | — | 안내 단락 숨김 FE mock **갭** |

`org` = `organization`, `ind` = `individual`

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
| 설문 none | `[]` | 13,15–17 |
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

---

### CASE-01 — 기관 · 커리큘럼 · 단일

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-type-org-curriculum-single` |
| title | `일반 프로그램 (기관)_커리큘럼형_단일 회차` |
| 필드 | `audience=organization`, `structure=curriculum`, `session=single` |
| 권장 부가 | `educationScheduleMode=period`, `maxScheduleCount` 설정 (예: 3), 학생 명단 필수 |
| **상세에서 확인** | 「기관 신청 목록」·「참여 기관」·강사/봉사 LNB(봉사 면접 2depth)·설문 full · 모집 한도·최대 일정 수 · 커리큘럼 차시 공통정보 |

---

### CASE-02 — 기관 · 커리큘럼 · 복수

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-type-org-curriculum-multi` |
| title | `일반 프로그램 (기관)_커리큘럼형_복수 회차` |
| 필드 | org + curriculum + **multi**, `rounds` ≥ 2 |
| 권장 부가 | `educationScheduleMode=period`, `maxScheduleCount`, **`maxSessionsPerDay`** (예: 2) |
| **상세에서 확인** | 회차별 커리큘럼·과제 UI · 모집 **최대 일정 수 + 1일 최대 차시** · 기관 신청 폼 일정당 차시 상한 |

---

### CASE-03 — 개인 · 커리큘럼 · 단일

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-type-ind-curriculum-single` |
| title | `일반 프로그램 (개인)_커리큘럼형_단일 회차` |
| 필드 | `audience=individual`, curriculum, single, types 개인 FULL, **`generalParticipantInterviewEnabled=true`** |
| **상세에서 확인** | 「참여자 신청 목록」+ **면접 2depth** · 진행「참여자」·**출석·과제·게시글** · 모집「면접 유무」 · KPI 파견학교「해당 없음」 · 참여 방식(개인/팀) · 기관 한도 필드 **숨김** |

---

### CASE-04 — 개인 · 커리큘럼 · 복수

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-type-ind-curriculum-multi` |
| title | `일반 프로그램 (개인)_커리큘럼형_복수 회차` |
| 필드 | individual + curriculum + multi, interview on |
| **상세에서 확인** | CASE-03 LNB + 복수 회차 커리큘럼 |

---

### CASE-05 — 기관 · 일정형 · 단일

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-type-org-schedule-single` |
| title | `일반 프로그램 (기관)_일정형_단일 회차` |
| 필드 | org + schedule + single |
| 권장 | FE mock과 같이 `educationScheduleMode` 미설정/`date` → **최대 일정 수 UI 숨김 대조군** |
| **상세에서 확인** | 일정형 공통정보(세부 일정) · 기관 LNB FULL · (date면) 희망일정 한도 미노출 |

---

### CASE-06 — 기관 · 일정형 · 복수

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-type-org-schedule-multi` |
| title | `일반 프로그램 (기관)_일정형_복수 회차` |
| 필드 | org + schedule + **multi**, rounds ≥ 2 |
| **상세에서 확인** | 일정형 복수 공통정보 · 기관 신청 **「진행 희망 교육 일정」단락 전체 숨김** (period/date 무관) |

---

### CASE-07 — 개인 · 일정형 · 단일

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-type-ind-schedule-single` |
| title | `일반 프로그램 (개인)_일정형_단일 회차` |
| 필드 | individual + schedule + single, interview on |
| **상세에서 확인** | CASE-03 LNB + 일정형 공통정보 |

---

### CASE-08 — 개인 · 일정형 · 복수

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-type-ind-schedule-multi` |
| title | `일반 프로그램 (개인)_일정형_복수 회차` |
| 필드 | individual + schedule + multi, interview on |
| **상세에서 확인** | 개인 LNB + 일정형 복수 |

---

### CASE-09 — 기관 · 커리큘럼 · 복수 · 교육·IPS 일정별 상이

| 항목 | 값 |
|------|-----|
| FE mock id | `general-prog-type-org-curriculum-multi-edu-ips-per-schedule` |
| title | `일반 프로그램 (기관)_커리큘럼형_복수 회차 · 교육·IPS 일정별 상이` |
| 필드 | CASE-02와 동일 유형 + **회차별** `educationForm` / `ips` 가 서로 다름 (`perSchedule`) |
| **상세에서 확인** | 공통정보에서 회차마다 교육 형태·IPS 라벨이 **다르게** 표시 (CASE-02와 구분) |

---

## 4. P1 시드 레시피 (CASE-10 ~ 18) — LNB 매트릭스

전부: `audience=organization`, `structure=curriculum`, `session=single`, `school_institution` 기본 포함.  
FE: `general-prog-lnb-16` … `general-prog-lnb-24`.

| CASE | FE id | 강사 | 봉사 | `generalVolunteerInterviewEnabled` | `generalSurveyMenuKeys` | `generalParticipantTypes` |
|------|-------|------|------|------------------------------------|-------------------------|---------------------------|
| 10 | `…-lnb-16` | O | 면접2depth | `true` | full | school+instructor+volunteer |
| 11 | `…-lnb-17` | O | 면접없음 | `false` | full | school+instructor+volunteer |
| 12 | `…-lnb-18` | X | 면접2depth | `true` | full | school+volunteer |
| 13 | `…-lnb-19` | X | 면접없음 | `false` | `[]` | school+volunteer |
| 14 | `…-lnb-20` | X | 면접없음 | `false` | `["survey"]` | school+volunteer |
| 15 | `…-lnb-21` | O | **없음** | omit | `[]` | school+instructor |
| 16 | `…-lnb-22` | X | 면접2depth | `true` | `[]` | school+volunteer |
| 17 | `…-lnb-23` | O | 면접2depth | `true` | `[]` | school+instructor+volunteer |
| 18 | `…-lnb-24` | X | 면접2depth | `true` | `["survey"]` | school+volunteer |

**full** = `["survey","satisfaction","lecture_evaluation"]`

### 상세에서 CASE별 확인 포인트

| CASE | 상세 확인 |
|------|-----------|
| 10 | 강사·봉사·설문 전부 · 봉사 **서류/합격/2차면접** 2depth |
| 11 | 봉사 LNB는 있으나 **면접 하위 메뉴 없음** |
| 12 | **강사 신청/진행 LNB 없음** · 봉사 2depth · 설문 full |
| 13 | 설문 LNB 비활성 · 봉사 1depth |
| 14 | 설문조사만 (만족도·강의평가 없음) |
| 15 | **봉사자 LNB 없음** · 강사만 · 설문 없음 |
| 16 | 강사 없음 · 봉사 2depth · 설문 없음 |
| 17 | 강사+봉사 2depth · 설문 없음 |
| 18 | 강사 없음 · 봉사 2depth · 설문 single |

---

## 5. P2 시드 레시피 (CASE-19 ~ 24) — 면접·만족도 대조

FE 캘린더/QA mock id를 참고용으로 적습니다. 스테이징 title은 아래 권장명을 써도 됩니다.

### CASE-19 — 개인 · 참여자 면접만 (강사 O · 봉사 X)

| 항목 | 값 |
|------|-----|
| FE 참고 id | `general-prog-scheduled-2` |
| types | `["individual","teacher_instructor"]` |
| flags | `generalParticipantInterviewEnabled=true`, volunteer **없음** |
| survey | full (만족도 포함) |
| **상세** | 참여자 신청 2depth · 진행 출석/과제/게시글 · 만족도 탭 **「참여자」** · 봉사 LNB 없음 |

### CASE-20 — 개인 · 참여자+봉사 면접 모두 on

| 항목 | 값 |
|------|-----|
| FE 참고 id | `general-prog-in-progress-2` |
| types | `["individual","volunteer"]` (+ 필요 시 instructor) |
| flags | participant interview `true`, volunteer interview `true` |
| **상세** | 참여자·봉사 **각각** 면접 2depth · 만족도는 봉사자 상/하반기 쪽으로 갈릴 수 있음 |

### CASE-21 — 개인 · 면접 전부 없음

| 항목 | 값 |
|------|-----|
| FE 참고 id | `general-prog-completed-2` |
| types | individual + volunteer |
| flags | 두 interview 모두 `false` |
| survey | `["survey"]` 권장 |
| **상세** | 신청 LNB **1depth** · 면접 하위 없음 |

### CASE-22 — 기관 · 봉사 면접 2depth

| 항목 | 값 |
|------|-----|
| FE 참고 id | `general-prog-in-progress-3` |
| types | school + instructor + volunteer |
| flags | `generalVolunteerInterviewEnabled=true` |
| **상세** | 「기관 신청 목록」+ 봉사 면접 2depth |

### CASE-23 — 기관 · 봉사 있으나 면접 없음

| 항목 | 값 |
|------|-----|
| FE 참고 id | `general-prog-completed-1` |
| types | school + instructor + volunteer |
| flags | `generalVolunteerInterviewEnabled=false` |
| survey | `[]` 가능 |
| **상세** | 봉사 LNB 있으나 2depth 없음 |

### CASE-24 — 기관 · 만족도 교사|학생 (봉사 없음)

| 항목 | 값 |
|------|-----|
| FE 참고 id | `general-prog-in-progress-1` |
| types | `["school_institution","teacher_instructor"]` (**volunteer 없음**) |
| survey | satisfaction 포함 (예: `["survey","satisfaction"]`) |
| **상세** | 만족도 탭 **교사 | 학생** (봉사자 탭 없음) |

---

## 6. P3 갭 케이스 (CASE-25 ~ 27) — FE mock 없음, BE 신규 요청

유형 8종만으로는 안 열리는 **기관 신청 브리지** UI입니다.  
스펙: [general-program-institution-application-bridge-spec.md](../../.cursor/rules/process/general-program-institution-application-bridge-spec.md)

### CASE-25 — 일정형 단일 + **기간 지정** + 최대 일정 수

| 항목 | 값 |
|------|-----|
| 왜 필요? | CASE-05는 보통 `date`라서 **최대 일정 수**가 안 열림 |
| 필드 | org + schedule + single + **`educationScheduleMode=period`** + `maxScheduleCount` (예: 3) |
| **상세/신청** | 모집「신청 가능 최대 일정 수」· 신청 폼 희망 일정 지망 블록 |

### CASE-26 — 교육 형태「참여자 선택」

| 항목 | 값 |
|------|-----|
| 왜 필요? | FE 스크린샷 mock은 교육형태가 `온라인` 고정 |
| 필드 | org + 교육 형태 라벨/값이 **참여자 선택** (`participant_selection`) |
| **상세/신청** | 기관 신청에 **「희망 교육 형태」** 필드 노출 |

### CASE-27 — 사전 안내「불필요」

| 항목 | 값 |
|------|-----|
| 왜 필요? | JOB담 등 기존 mock은 사전 안내 필요=`true` |
| 필드 | `participantRecruitmentInfo.preEducationNoticeRequired=false` (또는 동등 API 필드) |
| **상세/신청** | 기관 신청 폼에서 **안내 사항 단락 숨김** |

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
| `preEducationNoticeRequired` | boolean | false → 안내 사항 단락 숨김 |
| `category` | `school` \| `individual` … | 목록 필터 (기관→`school`, 개인→`individual`) |

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

대표 시드: CASE-01·02(period 권장), CASE-05(date 대조), CASE-06(숨김), CASE-25(period+schedule single 갭).

---

## 9. 검증 체크리스트

### P0 (CASE-01~09)

- [ ] `/programs/general`에서 9개 title 각각 검색됨
- [ ] 기관 5건(01,02,05,06,09): LNB「기관 신청 목록」·「참여 기관」
- [ ] 개인 4건(03,04,07,08): LNB「참여자 신청 목록」·「참여자」·출석·과제·게시글
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

### P2~P3

- [ ] CASE-19 vs 21: 참여자 면접 2depth on/off
- [ ] CASE-24: 만족도 교사|학생
- [ ] CASE-25~27: 브리지 갭 UI

---

## 10. BE 회신 요청

1. 구현한 **CASE 번호 목록** + 각 **programId** + 최종 **title**
2. 목록/상세 응답에서 audience · structure · session · participantTypes · interview · surveyKeys 노출 여부 (필드명)
3. P3(CASE-25~27) 수용 여부

---

## 11. FE 코드 참조

| 역할 | 경로 |
|------|------|
| 8종 상수 | `src/features/program/general/lib/variant.ts` |
| Mock 시드 | `src/data/mock/general-programs.ts` |
| 상세 LNB | `src/features/program/general/lib/detail-meta.ts` |
| 모집 표시 | `src/features/program/general/lib/participant-recruitment-display.ts` |
| 기관 신청 브리지 | `src/features/program/general/lib/institution-application-program-bridge.ts` |
| 공통정보 스크린샷 | `src/features/program/general/lib/detail-common-info-display.ts` |
| 개인/기관·만족도 | `src/features/program/general/lib/survey-audience.ts` |
| E2E 수정 더미 | `tests/e2e/pages/general-program-edit.page.ts` → `EDITABLE_DUMMY_TITLE` |

**Last updated:** 2026-07-21
