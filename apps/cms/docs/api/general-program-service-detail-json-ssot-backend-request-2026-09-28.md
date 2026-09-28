# BE 수정 요청 — 일반 프로그램 `serviceDetailJson` 조회·저장 SSOT

**작성일:** 2026-09-28  
**문서 성격:** **이 파일만** 보고 구현·검수 가능  
**대상 API:**  
- `POST /api/admin/programs` (일반 등록 create)  
- `GET /api/admin/programs/{programId}`  
- `PATCH` / `PUT` 프로그램 상세 (`serviceDetailJson` 포함)  
**적용 `programType`:** `GENERAL_INDIVIDUAL` · `GENERAL_ORGANIZATION` (`GENERAL` 레거시 포함)  
**범위 제외:** 1사1교 · UJAT · 교육받은 교사 · Gemini — 일반 `generalRegistration.*` 키를 이식하지 말 것.  
**1사1교:** [`company-school-service-detail-json-ssot-backend-request-2026-09-28.md`](./company-school-service-detail-json-ssot-backend-request-2026-09-28.md)

---

## 백엔드 전달용 프롬프트

일반 프로그램 CMS **등록 화면 · 상세 조회 · 정보 수정**이 서로 다른 값을 보여 줍니다.

원인은 **두 저장소가 어긋난 채 persist·GET**되기 때문입니다.

| 저장소 | CMS가 읽는 화면 |
|--------|-----------------|
| `serviceDetailJson.generalCommonInfo` | 상세 **조회** (공통정보 테이블) |
| `serviceDetailJson.registration.overlay` (`generalRegistration.*`) | 등록 폼 · 상세 **정보 수정** |

추가로 GET이 `generalCommonInfo.announcementTitle`을 대표 프로그램명(`title`/`mainTitle`)으로 **덮어씁니다.** 등록에서 넣은 공고용명이 조회에서 사라집니다.

**요구:** create/PATCH **저장 시점**과 GET **응답 시점** 모두에서

1. 공고용명을 대표명으로 덮지 말 것  
2. 현재 교육 진행 구조(커리큘럼형 / 일정형)에 **해당하는 overlay만** 남길 것  
3. `generalCommonInfo`와 overlay·top-level 컬럼을 **한 규칙으로 재계산**해 양쪽이 같은 의미를 갖게 할 것  

CMS FE fallback에 의존하지 말 것. FE 보정은 임시이며, **BE가 맞춘 GET이 SSOT**여야 재발이 멈춘다.

---

## 0. 재현 프로그램 (2026-09-27~28 실측)

| ID | 유형 | 작성 화면 | 핵심 실패 |
|----|------|-----------|-----------|
| **186009** | 기관 · 일정형 · 단일 · 교육/참여/IPS **전부 일정 별 상이** | (기존 상세) | 루트 교육형태 없음 vs overlay `offline`; 행 IPS Inspire vs 루트 Prepare; 임금 nested 1원 vs overlay 10만; 커리큘럼 overlay 잔재 |
| **186012** | 개인 · 커리큘럼형 · 복수 · 교육형태만 **일정 별 상이** | 등록 후 GET | 공고용 `789` → GET `123`; `deliveryType` 드롭; 일정형 overlay 잔재(offline/team/Inspire); 단원명 overlay≠`curriculumSessions` |
| **186013** | 개인 · 일정형 · 복수 · 교육/참여/IPS **전부 일정 공통** | 등록 후 GET | 공고용 장문 → GET 대표명; `deliveryType` 드롭; **커리큘럼 overlay 잔재**; 일정별 overlay가 공통값과 반대(`online`/`individual`/`kick_off_event`); 세부프로그램 nested=일정명, overlay=`경제 리터러시 기초` |

세 건 모두 `programDraftId`가 있는 등록이 포함된다. **드래프트 머지로 반대 구조 키가 들어온 채 create**되어도, BE는 **현재 `generalProgramEducationStructure` 기준으로 sanitize**해야 한다. “FE가 보낸 그대로 저장”은 재발 원인이다.

---

## 1. 금지 (재발 포인트)

### 1.1 GET에서 공고용명을 대표명으로 치환하지 말 것

**금지**

```text
generalCommonInfo.announcementTitle = program.title
serviceDetailJson 루트 announcementTitle = program.title
```

`title` / `mainTitle` / `representativeProgramNameKo`와 문자열이 같으면 **공고용명이 아니라 대표명 alias**이다. 이때는 overlay `generalRegistration.basicInfo.publicProgramTitle`을 써야 한다.

| 프로그램 | CREATE 공고용 | GET nested (잘못) | overlay (유지됨) |
|----------|---------------|-------------------|------------------|
| 186012 | `789` | `123` | `789` |
| 186013 | `2026 청소년 경제금융 교육 참여자 모집` | `청소년 경제금융 탐험` | 공고용 장문 |

**기대 GET**

- `generalCommonInfo.announcementTitle` = overlay `publicProgramTitle` (비어 있지 않으면)  
- 루트 `announcementTitle`를 내려도 **동일 문자열**  
- `title` / `mainTitle`은 대표명 그대로 (`123`, `청소년 경제금융 탐험`)

### 1.2 `rounds[].deliveryType` 드롭 금지

CREATE가 `deliveryType: "offline"` 등을 보내면 GET `rounds[]`에 **동일 값**이 있어야 한다. 186012·186013 GET은 `null`.

일정 공통이면 top-level `type`과 맞출 수 있다. 일정 별 상이면 회차/일정 행 교육 형태와 맞추거나, 행이 여러 값이면 `null`이 아니라 **명시적 정책**(첫 행 / omit)을 OpenAPI에 고정한다. **조용히 null은 금지.**

### 1.3 반대 구조 overlay persist 금지

| `generalProgramEducationStructure` | **남길 prefix** | **삭제할 prefix** |
|------------------------------------|-----------------|-------------------|
| `curriculum` | `generalRegistration.educationCurriculum.*` | `generalRegistration.educationScheduleCurriculum.*` |
| `schedule` | `generalRegistration.educationScheduleCurriculum.*` | `generalRegistration.educationCurriculum.*` |

`educationScheduleSettings.scheduleLines`는 **교육 진행 예정일**이라 커리큘럼·일정 **둘 다** 쓸 수 있다. 일정 블록 전용 키(`*ByDetail`, `groupTimesByDetail`, `eventNameByDetail`)만 일정형에서 유지한다.

사전 교육 토글이 `false`이면 `preEducationScheduleName` / `preEducationScheduleLine` / `teacherTraining*` 등 사전교육 키를 제거한다.

### 1.4 일정 공통인데 일정별 overlay에 다른 enum 두지 말 것

`educationFormScheduleDetail` / `participationScheduleDetail` / `ipsScheduleDetail` 가 `common`이면:

- `*ByDetail` / `*BySession`(해당 차원)을 **삭제**하거나  
- typeSettings 공통값과 **완전히 동일**하게 맞춘다.

**금지 예 (186013 CREATE를 그대로 저장한 결과)**

- 화면·nested: 오프라인 · 팀 · Inspire/Radio  
- overlay: `educationFormByDetail[1]=online`, `participationByDetail[1]=individual`, `ipsByDetailIndex[1]=kick_off_event`

수정 화면이 overlay를 읽으면 조회와 즉시 불일치한다.

### 1.5 세부 프로그램명을 일정명으로 채우지 말 것

일정형(`schedule`)이면:

- overlay `detailedProgramId` = `__detailed_program_none__` (또는 팀 합의 sentinel)  
- `detailedProgramName` = 비움 또는 `해당없음`  
- **금지:** 행사/세부 일정명(`필요와 욕구, 현명한 소비`)을 `generalCommonInfo.detailedProgramName`에 복사  
- **금지:** 이전 드래프트 값(`경제 리터러시 기초`, `AI와 미래 일자리`)을 overlay에 잔존

CMS 조회는 일정형에서 세부 프로그램명을 **「해당없음」**으로 고정한다 (`resolveGeneralProgramDetailedProgramNameDisplay`). GET nested가 일정명이면 다른 API·리포트가 오인한다.

커리큘럼형이면 `detailedProgramId` + 카탈로그명만. overlay와 nested **동일**.

### 1.6 임금 nested를 overlay와 다르게 두지 말 것

`wageGradeRows[].pricing` 금액 = overlay `wageInfo.grade{1,2,3}Fee`.  
186009처럼 nested `1원` + overlay `100000`이면 GET에서 **overlay로 nested를 재작성**한다.  
`paymentItems` = `paymentItemLabels` 또는 `paymentItemValues` 해석 결과.

### 1.7 `scheduleDateByDetailIso`에 한글 문장 넣지 말 것

키 이름대로 **ISO-8601 datetime** (또는 date).  
한글 `26년 10월 12일(월) 10:00 ~ 12:00`는 `scheduleDetails[].scheduleDateLabel` / 예정일 lines 전용이다. ISO 파서가 깨지면 진행 일정 보강이 실패한다.

---

## 2. overlay 키 계약 (`generalRegistration.`)

### 2.1 공통 (구조 무관)

| 키 | 의미 | nested 대응 |
|----|------|-------------|
| `basicInfo.publicProgramTitle` | 공고용 프로그램명 | `generalCommonInfo.announcementTitle` |
| `basicInfo.localProgramTitleKo` | 대표 국문 | `title` / `mainTitle` |
| `basicInfo.programTitleEn` | 대표 영문 | `titleEn` |
| `basicInfo.detailedProgramId` | 세부 프로그램 id. 일정형=`__detailed_program_none__` | `detailedProgramId` |
| `basicInfo.detailedProgramName` | 세부 프로그램 표시명. 일정형은 해당없음 | `detailedProgramName` |
| `basicInfo.operationRangeSeal` | `{ start, end }` ISO | `startDate` / `endDate` / business* |
| `typeSettings.singleEducationForm` · `multiCommonEducationForm` · `educationForm` | 일정 **공통** 교육 형태 enum | `educationFormLabel` (`common`일 때만) |
| `typeSettings.singleParticipation` · `multiCommonParticipation` | 일정 **공통** 참여 방식. **기관이면 저장하지 않음** | `participationMethod` |
| `typeSettings.ipsType` | `{ category, detail }` | 루트 `ipsTypeSummary` + top-level `ips` / `programChannel` / `programCategory` |
| `wageInfo.grade1Fee` … `grade3Fee` | 숫자 | `wageGradeRows` |
| `wageInfo.paymentItemValues` · `paymentItemLabels` | 지급 항목 | `paymentItems` |
| `educationScheduleSettings.scheduleLines` | 교육 진행 예정일 문자열 배열 | `educationScheduleLines` |

교육 형태 enum: `online` \| `offline` \| `hybrid` \| `participant_selection`  
한글 라벨: `온라인` \| `오프라인` \| `온/오프라인` \| `참여자 선택`

### 2.2 커리큘럼형만 (`educationCurriculum.`)

| 키 | 인덱스 | nested |
|----|--------|--------|
| `unitNameBySession` / `unitContentBySession` | 1-based 회차/차시 | `curriculumSessions[].title` / `description` |
| `educationFormBySession` | 교육형태 **perSchedule**일 때만 의미 | `curriculumSessions[].educationFormLabel` |
| `participationBySession` | 개인 + 참여 **perSchedule** | `participationMethodLabel` |
| `ipsBySession` | IPS **perSchedule** | `ipsTypeSummary` (행) |
| `assignmentByRound` | 개인 + 복수 | `assignmentEnabled` / `assignmentPeriod` |
| `progressSessionByRound` / `roundContentByRound` | 복수 회차 진도 | 세션 메타 |

**`curriculumSessions[i]`와 `unitNameBySession[i+1]`(또는 동일 인덱스 규약)은 반드시 동일 제목.**  
186012: nested 제목 `1차시`, overlay `필요와 욕구, 현명한 소비` → **작성 화면 값(1차시)이 SSOT.** persist 시 overlay를 세션에 맞추거나 세션을 overlay에 맞추되, **둘을 다르게 두지 말 것.**

### 2.3 일정형만 (`educationScheduleCurriculum.`)

| 키 | 인덱스 | 규칙 |
|----|--------|------|
| `eventNameByDetail` | 본 일정 **1부터**, 사전 교육 **0** | `scheduleDetails[].name` |
| `scheduleDateByDetailIso` | 동일 | **ISO만** |
| `educationFormByDetail` | **perSchedule일 때만** | 행 `educationFormLabel` |
| `participationByDetail` | 개인 + **perSchedule일 때만** | 행 `participationMethodLabel` |
| `ipsByDetailIndex` | **perSchedule일 때만** | 행 `ipsTypeSummary` |
| `assignmentByDetail` | 개인 + 복수 등 과제 노출 시 | 행 assignment* |
| `groupTimesByDetail` | 단일 회차 날짜지정 등 진행 그룹 | `progressTimeSummary` |

그룹 시간 요약: 슬롯 **1개** → `13:30 ~ 15:30` (접두어 `그룹 A` 없음). **2개 이상** → `그룹 A : … \| 그룹 B : …`.

복수 회차 **행사 일정** 레이아웃은 화면에 **진행 일정**이 있다. `scheduleDateLabel`과 `groupTimes` 시각을 **서로 다른 값으로 남기지 말 것** (186013: 라벨 10:00~12:00 vs group 13:30~15:30).

---

## 3. `generalCommonInfo` 재계산 규칙

저장·GET 모두 아래를 적용한 뒤 JSON을 내려보낸다.

### 3.1 교육 형태

`educationFormScheduleDetail === 'common'`

- 루트 `educationFormLabel` = typeSettings 공통 enum의 한글  
- 해석 순서: `multiCommonEducationForm` → `singleEducationForm` → `educationForm`  
- 행 `educationFormLabel`은 omit

`=== 'perSchedule'`

- 루트 `educationFormLabel` **omit / null** (186009처럼 없으면 조회 `-`가 됨 — **행에만** 채움)  
- 커리큘럼: `curriculumSessions[i].educationFormLabel` ← `educationFormBySession`  
- 일정: `scheduleDetails[j].educationFormLabel` ← `educationFormByDetail` (사전교육 0, 본일정 1+)

top-level `type`: 일정이 공통이면 그 enum. perSchedule이고 행이 모두 같으면 그 값. 섞이면 문서화한 단일 정책.

### 3.2 참여 방식

- **기관(`generalProgramAudience=organization` 또는 types에 school_institution만):** `participationMethod` · 행 `participationMethodLabel` · overlay `*Participation*` **저장하지 않음** (`GENERAL_ORGANIZATION_PARTICIPATION_METHOD_NOT_ALLOWED`).  
- 개인 + `common`: 루트 `participationMethod` = `individual` \| `team`.  
- 개인 + `perSchedule`: 루트 omit, 행 라벨만.

### 3.3 IPS

- 루트 `ipsTypeSummary` = `일정 공통` 또는 `일정 별 상이` + typeSettings `ipsType`만.  
  **행 IPS와 섞지 말 것** (186009: 루트 Prepare vs 행 Inspire/Podcast).  
- perSchedule 행 = `ipsBySession` / `ipsByDetailIndex`만.  
- top-level `ips` / `programChannel` / `programCategory`는 **공통 IPS**와 맞춘다. perSchedule이면 대표값을 행에서 파생하거나 null — **stale Prepare + 행 Inspire 금지.**

### 3.4 일정형 행 vs 예정일

- `scheduleDetails` 길이 = 등록한 세부/행사 일정 수.  
- `educationScheduleLines` = 교육 진행 예정일(별 단락). 일정 1건이어도 예정일이 여러 줄일 수 있다.  
- 행 `name` = `eventNameByDetail`. 세부 프로그램명과 섞지 말 것.

### 3.5 KPI

overlay `kpi.instructor` / `volunteer`가 `null`(해당없음)이면 nested `0`과 **의미가 같게** 맞춘다. GET에서 한쪽만 5, 한쪽만 null로 두지 말 것.

---

## 4. create / PATCH 처리 순서 (권장)

1. 요청 `serviceDetailJson` + typed 컬럼 + `programDraftId` 머지본을 만든다.  
2. `generalProgramEducationStructure` / `generalProgramSessionRound` / audience를 **typed 또는 JSON extras에서 확정**한다.  
3. **§1.3 sanitize** — 반대 구조 overlay 삭제, 사전교육 OFF 키 삭제.  
4. **§1.4** — `common`이면 일정별/회차별 교육·참여·IPS 키를 지우거나 공통값으로 덮는다.  
5. **§3**으로 `generalCommonInfo`를 overlay에서 재작성한다. (드래프트 stale nested보다 overlay·확정 구조 우선, 단 **작성 화면과 모순되는 overlay는 3·4 이후 값**을 쓴다.)  
6. `curriculumSessions` ↔ `unitNameBySession` 등 **같은 인덱스 동기화**.  
7. 공고용명: `publicProgramTitle` → `announcementTitle`. title로 덮지 않음.  
8. `rounds[].deliveryType` 보존.  
9. GET도 5~8을 **다시 적용**해 응답한다. DB에 stale이 있어도 GET이 깨끗해야 한다. (마이그레이션은 기존 186009/012/013 재조회 시 동일.)

---

## 5. 검수 체크리스트

저장 직후 `GET /api/admin/programs/{id}` 의 `serviceDetailJson`을 파싱한다.

### 5.1 모든 일반 프로그램

- [ ] `generalCommonInfo.announcementTitle` === overlay `publicProgramTitle` (공고용이 대표명과 다를 때)  
- [ ] `announcementTitle` !== `title` 인 케이스가 GET에서 대표명으로 바뀌지 않음  
- [ ] CREATE에 `deliveryType`이 있으면 GET `rounds[].deliveryType` 동일  
- [ ] `wageGradeRows` 금액 === `grade*Fee`  
- [ ] 커리큘럼형이면 `educationScheduleCurriculum.*` 없음  
- [ ] 일정형이면 `educationCurriculum.*` 없음  

### 5.2 186012 동등 (개인 커리큘럼 · 교육형태 perSchedule)

- [ ] 공고용 `789` 유지  
- [ ] `curriculumSessions[0].title` === `unitNameBySession` (작성값 `1차시`)  
- [ ] `educationFormByDetail` / `participationByDetail` / `ipsByDetailIndex` **없음**  
- [ ] 루트 `educationFormLabel` 없음, 세션 `educationFormLabel` = `온라인`  

### 5.3 186013 동등 (개인 일정 · 전부 common)

- [ ] 공고용 `2026 청소년 경제금융 교육 참여자 모집` 유지  
- [ ] 루트 교육형태 `오프라인`, 참여 `team`, IPS `Inspire | Radio`  
- [ ] overlay에 `educationFormByDetail=online` 등 **반대 enum 없음**  
- [ ] `detailedProgramId` none, `detailedProgramName` 해당없음 (일정명·`경제 리터러시 기초` 아님)  
- [ ] `scheduleDateByDetailIso`가 ISO이거나 키 제거 후 라벨만 사용  
- [ ] 진행 일정과 `groupTimes` 시각이 모순되지 않음  

### 5.4 186009 동등 (기관 일정 · 전부 perSchedule)

- [ ] 루트 `educationFormLabel` 없음, `scheduleDetails[0].educationFormLabel` = overlay `educationFormByDetail`  
- [ ] 루트 `ipsTypeSummary`는 typeSettings(일정 별 상이 + Prepare 등), **행 IPS와 불일치 금지**  
- [ ] 기관이라 참여 방식 필드 없음  
- [ ] 임금 overlay 금액이 nested에 반영  

### 5.5 CMS 화면 (BE 배포 후)

- 상세 조회 공통정보와 「정보 수정」(등록 폼)의 공고용명·교육형태·IPS·임금·일정/회차 제목이 **동일**  
- 유형 전환(커리큘럼↔일정) 후 저장·재조회 시 이전 구조 값이 수정 화면에 나타나지 않음  

---

## 6. FE와의 경계

CMS는 현재 조회에서 overlay로 임금·공고명·교육형태를 **임시 보정**한다 (`applyRegistrationWageOverlayToCommonInfo`, `applyResolvedAnnouncementTitle`, `resolveStoredEducationFormLabel`).

- BE가 본 문서를 지키면 해당 fallback은 **제거 가능**하다.  
- **조회 레이아웃**(단일 일정형 sub 블록에 교육 형태 행이 없음 등)은 FE 표시 이슈이며 BE 범위가 아니다. **데이터만** 맞으면 유형 설정·수정 폼은 정상이다.  
- create body에 반대 구조 키가 들어오는 것은 드래프트 머지 FE 이슈일 수 있으나, **sanitize는 BE 필수**다. FE만 고쳐도 기존 DB·구 클라이언트는 재발한다.

---

## 7. OpenAPI / 구현 메모

- `serviceDetailJson.schemaVersion` = `1` 유지. 필드 의미 변경은 본 문서가 계약이다.  
- overlay 키 문자열을 rename하지 말 것. CMS `generalRegistration.*` 와 1:1.  
- 인덱스: 사전 교육 `0`, 본 회차/본 일정 `1`부터 — FE `overlayIpsIndexForScheduleDetail` 와 동일.  
- 기관 참여 방식 키를 거절하거나 strip.  

**Last updated:** 2026-09-28

