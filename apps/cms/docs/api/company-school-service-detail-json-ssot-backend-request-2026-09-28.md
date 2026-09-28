# BE 수정 요청 — 1사1교 `serviceDetailJson` 조회·저장 SSOT

**작성일:** 2026-09-28  
**문서 성격:** **이 파일만** 보고 구현·검수 가능  
**대상 API:**  
- `POST /api/admin/programs` (`programType: COMPANY_SCHOOL`)  
- `GET /api/admin/programs/{programId}`  
- `PATCH` / `PUT` 1사1교 상세 (`serviceDetailJson` 포함)  
**적용:** `COMPANY_SCHOOL` 만  
**범위 제외:** 일반(`GENERAL_*`) · UJAT · 교육받은 교사 · Gemini  

일반 프로그램 동일 계열 이슈는  
[`general-program-service-detail-json-ssot-backend-request-2026-09-28.md`](./general-program-service-detail-json-ssot-backend-request-2026-09-28.md)  
— **키·구조를 이 문서에 이식하지 말 것.**

---

## 백엔드 전달용 프롬프트

1사1교 CMS **등록 화면 · 상세 조회 · 정보 수정**이 서로 다른 값을 보여 줍니다.

원인은 다음이 **한 응답에 섞이기** 때문입니다.

1. GET이 **운영 기간을 사업연도(1/1~12/31)로 치환**한다.  
2. GET이 `announcementTitle`을 **대표 프로그램명**으로 덮는다.  
3. GET이 `serviceDetailJson`을 **이중 flatten**한다 (`program.generalCommonInfo`는 풍부, 루트 `generalCommonInfo`는 얇고 공고용명이 틀림).  
4. create overlay에 **일반 프로그램 키(`generalRegistration.*`)** 와 **봉사자 블록**이 남아 persist된다.

**요구:** 저장·GET에서

- `startDate`/`endDate` = 등록 **사업 운영 기간** (`businessYear`와 분리)  
- 공고용명 = `economyRegistration.basicInfo.publicProgramTitle`  
- JSON은 FE write shape 한 경로 (`{ schemaVersion, program, registration.overlay }`)  
- overlay는 **`economyRegistration.*`만**  
- 봉사자 모집·면접 블록 없음  

CMS FE fallback(`extractCompanySchoolWageSidecar`, `applyResolvedAnnouncementTitle`)에 의존하지 말 것.

---

## 0. 재현 — programId `186014` (2026-09-28)

- **유형:** 1사1교 · 커리큘럼 고정 · 2차시 · 참여자 학교/기관+강사 · 봉사자 없음  
- **드래프트:** `programDraftId: 6`  
- **작성 화면:** 대표 `(0928 09:05) 대표 프로그램명 국문/영문`, 공고용 `(0928 09:05) 공고용 프로그램명`, 세부 `1차 교육 워크숍`, 운영 `2026.10.27 ~ 2026.12.07`, 예정 기간 `2026.10.27 ~ 2026.12.01`, KPI 38/7/9/12, 임금 14+4 / 12+3 / 10+2만, 설문 설문+강의평가

---

## 1. 1사1교 도메인 전제 (저장 시 깨면 안 됨)

- 사업 운영 기간은 **화면에서 고른 아무 날짜**. 같은 해·1/1~12월 31일·연도 걸침 제한 없음 (`2025.04.01 ~ 2027.08.23` 포함). `businessYear`는 목록 필터일 뿐 **일정 컬럼을 연도로 바꾸라는 뜻이 아님.** 기간 계약은 [`program-business-period-any-dates-backend-request-2026-09-28.md`](./program-business-period-any-dates-backend-request-2026-09-28.md).  
- 교육 진행 구조 **커리큘럼형 고정**, 수업 회차 **단일 고정**, 과제 없음. 「프로그램 유형 설정」 단락 없음.  
- 참여자 **학교/기관 + 강사**. **봉사자 없음.**  
- 임금에 **장거리(`grade*DistanceFee`)** 가 있다. 일반 프로그램 임금 키와 다름.  
- overlay prefix: **`economyRegistration.`** 만.

---

## 2. FE write JSON shape

```json
{
  "schemaVersion": 1,
  "program": {
    "generalCommonInfo": { },
    "generalProgramEducationStructure": "curriculum",
    "generalParticipantTypes": ["school_institution", "teacher_instructor"],
    "generalSurveyMenuKeys": ["survey", "lecture_evaluation"]
  },
  "registration": {
    "overlay": {
      "economyRegistration.basicInfo.publicProgramTitle": "…",
      "economyRegistration.basicInfo.repKo": "…",
      "economyRegistration.educationCurriculum.session1.title": "…"
    }
  }
}
```

GET도 **같은 트리**를 유지한다. 루트에 typed 컬럼을 복제할 때 `program.generalCommonInfo`를 **세션·임금·공고용명 없이** 얇게 만들지 말 것.

---

## 3. overlay 키 계약 (`economyRegistration.`)

| 키 | 의미 | nested / typed |
|----|------|----------------|
| `basicInfo.publicProgramTitle` | 공고용 프로그램명 | `program.generalCommonInfo.announcementTitle` |
| `basicInfo.repKo` / `repEn` | 대표 국문/영문 | `title` / `mainTitle` / `titleEn` |
| `basicInfo.detailedProgramId` / `detailedProgramName` | 세부 프로그램 | `detailedProgramId` / `detailedProgramName` |
| `basicInfo.operationRangeSeal` | `{ start, end }` ISO | **사업 운영 기간** `startDate`/`endDate` |
| `basicInfo.surveyItems` | `survey`/`satisfaction`/`lecture_evaluation` | `generalSurveyMenuKeys` |
| `basicInfo.ipsCategory` | `prepare` 등 | `ips` |
| `kpi.participantCount` / `instructor` / `dispatchedSchool` / `dispatchedClass` | KPI | `kpi` · `approvedStudentCount` 등 |
| `educationCurriculum.session{n}.title` / `description` | 차시 | `curriculumSessions[n-1]` |
| `educationScheduleSettings.dateRangeSeal` | 교육 진행 **예정** 기간 | `educationScheduleLines` (기간 모드) |
| `wageInfo.grade{1,2,3}Fee` | 기본 시급 | `wageGradeRows` pricing 기본 |
| `wageInfo.grade{1,2,3}DistanceFee` | 장거리 | pricing `장거리` |
| `wageInfo.paymentItemValues` | 지급 항목 id | `paymentItems` — **라벨 또는 동일 id 스키마 하나로** |

**금지:** `generalRegistration.*` (typeSettings 교육형태·참여 방식 포함). 1사1교 화면에 없음.

---

## 4. 금지 (186014에서 재현)

### 4.1 운영 기간을 사업연도로 치환하지 말 것

| | CREATE | GET (잘못) |
|--|--------|------------|
| typed `startDate`/`endDate` | 2026-10-26T15 ~ 2026-12-07T15 (KST 10.27~12.07) | **2026-01-01 ~ 2026-12-31** |
| `businessStartDate`/`businessEndDate` | **화면에서 고른 기간과 동일** (`2025.04.01 ~ 2027.08.23`처럼 연도 걸침도 그대로) | GET이 연도로 바꾸면 안 됨 |
| 모집 `operationStartDate`/`operationEndDate` | — | **1/1~12/31** |
| `lifecycleStatus` | 운영이 미래면 scheduled | **`in_progress`** (연중이라) |

`businessYear=2026`은 유지해도 된다. **프로그램 일정 컬럼을 연도로 덮지 말 것.**

### 4.2 공고용명을 대표명으로 덮지 말 것

| 위치 | CREATE | GET 186014 |
|------|--------|------------|
| `program.generalCommonInfo.announcementTitle` | 공고용 | **유지 (맞음)** |
| overlay `publicProgramTitle` | 공고용 | 유지 |
| `program.announcementTitle` (형제) | — | **대표 국문** |
| 루트 `announcementTitle` / 루트 `generalCommonInfo.announcementTitle` | — | **대표 국문** |

모든 복사본이 overlay 공고용명과 같아야 한다.

### 4.3 flatten으로 임금·차시를 버리지 말 것

루트 `generalCommonInfo`에 KPI·대표명만 있고 `curriculumSessions`/`wageGradeRows`가 없으면 CMS 조회가 빈 임금으로 갈 수 있다. FE는 `program.generalCommonInfo`를 우선하는 임시 보정이 있다.

**기대:** 루트 복제를 만들지 않거나, 만들면 **중첩과 완전 동일**.

### 4.4 `deliveryType` 드롭 금지

CREATE `rounds[].deliveryType: offline` → GET 동일.

### 4.5 봉사자·일반 유형 설정 persist 금지

- `volunteerRecruitmentInfo` 삭제  
- `generalVolunteerInterviewEnabled` false, 봉사자 수 0  
- `generalParticipantTypes`에 `volunteer` 없음  
- overlay에서 `generalRegistration.` 전부 삭제  

### 4.6 플래그 혼동 금지

| 필드 | 의미 | 186014 잘못 |
|------|------|-------------|
| `fixedSessionCount` / `fixed_session_count` | **차시 개수** (2) | — |
| `maxDailySessionCount` / `maxSessionsPerDay` | **하루 최대 시수** (화면 3) | GET **2** (차시 수와 혼동) |
| `studentListRequired` | `required` / `not_required` | GET typed는 required |
| `studentRosterRequiredYn` | 동일 의미 boolean | GET **false** |

### 4.7 지급 항목 스키마

CREATE nested `paymentItems` = `"p-166204, p-166201"`.  
화면은 숙박비·교통비. GET `settlementPolicy.paymentItems`는 LODGING/TRANSPORTATION.  
**한 계약으로 정규화** (라벨 문자열 또는 id 배열). comma-id를 조회 라벨로 쓰지 말 것.

### 4.8 기간 3종을 맞출 것

CREATE부터 이미 갈라짐.

| 소스 | 186014 값 |
|------|-----------|
| 화면 운영 | 10.27 ~ 12.07 |
| 화면 예정 | 10.27 ~ 12.01 |
| overlay `operationRangeSeal.end` | 12-06T15 |
| overlay `dateRangeSeal.end` | **11-30T15** |
| `educationScheduleLines` | `2026. 10. 27 ~ 2026. 12. 01` |

persist 전 **운영 seal ↔ typed start/end**, **예정 seal ↔ lines**를 각각 맞춘다.

---

## 5. 작성 화면 ↔ CREATE ↔ GET 대조표 (186014)

| 항목 | 등록 화면 | CREATE | GET |
|------|-----------|--------|-----|
| 공고용명 | `(0928 09:05) 공고용 프로그램명` | 중첩 commonInfo + overlay | 중첩만 유지, **루트·형제는 대표명** |
| 대표 국문/영문 | `(0928 09:05) 대표…` | typed + `repKo`/`repEn` | 유지 |
| 세부 프로그램 | `1차 교육 워크숍` / `900131` | 동일 | 동일 |
| 운영 기간 | 10.27 ~ 12.07 | typed 10-26T15 ~ 12-07T15 | **1/1 ~ 12/31** |
| 예정 기간 | 10.27 ~ 12.01 | lines OK, seal ~11-30 | lines 유지 |
| 1·2차시 | 온라인 정보의 신뢰 / 필요와 욕구… | sessions = session1/2 | 중첩만. 루트 flatten 없음 |
| 임금+장거리 | 14/4, 12/3, 10/2만 | overlay Fee+DistanceFee | 중첩·settlementPolicy OK. 루트 flatten 없음 |
| 설문 | 설문·강의평가 | keys 일치 | 유지 |
| 학생 명단 | 제출 필요 | `required` | typed OK, **rosterYn false** |
| 하루 시수 | 3 | `maxSessionsPerDay: 3` | **maxDailySessionCount: 2** |
| 봉사자 | 없음 | volunteer 블록 있음 | persist |

---

## 6. 저장·GET 처리 순서

1. `programType=COMPANY_SCHOOL` 확정.  
2. overlay에서 **`generalRegistration.` 삭제**.  
3. `volunteerRecruitmentInfo` · 봉사자 면접 필드 삭제. types에서 `volunteer` 제거.  
4. `operationRangeSeal` → typed `startDate`/`endDate` (연도 치환 금지).  
5. `dateRangeSeal` ↔ `educationScheduleLines` 동기화.  
6. `session{n}` ↔ `curriculumSessions[n-1]`.  
7. `publicProgramTitle` → 모든 `announcementTitle`. `title`로 덮지 않음.  
8. `studentRosterRequiredYn` = (`studentListRequired` === `required`).  
9. `maxDailySessionCount` = `maxSessionsPerDay` (차시 수와 분리).  
10. `rounds[].deliveryType` 보존.  
11. 응답 JSON은 `{ schemaVersion, program, registration }` 유지. 루트 `generalCommonInfo`를 만들면 **program 쪽과 동일 내용**.

---

## 7. 검수 체크리스트

```http
GET /api/admin/programs/186014
```

- [ ] `startDate`/`endDate` ≈ 2026-10-27 ~ 2026-12-07 (**1/1~12/31 아님**)  
- [ ] 모집 `operationStartDate`/`operationEndDate`가 연도가 아님  
- [ ] `lifecycleStatus`가 운영 기간 기준 (2026-09-28 기준 scheduled)  
- [ ] 모든 `announcementTitle` = `(0928 09:05) 공고용 프로그램명`  
- [ ] `rounds[0].deliveryType` = `offline`  
- [ ] `program.generalCommonInfo`에 차시 2 · 임금 3행(장거리 포함)  
- [ ] 루트에 얇은 `generalCommonInfo`가 있으면 위와 **동일**  
- [ ] overlay에 `generalRegistration.` 없음  
- [ ] `volunteerRecruitmentInfo` 없음  
- [ ] `studentListRequired=required` ↔ `studentRosterRequiredYn=true`  
- [ ] `maxDailySessionCount` = 3 (또는 화면 일차 상한)  
- [ ] CMS 상세 조회와 정보 수정의 공고용명·운영기간·임금이 동일  

**Last updated:** 2026-09-28
