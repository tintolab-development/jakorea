# 1사1교 프로그램 API 전환 — 백엔드 핸드오프

CMS `/programs/company-school` 및 legacy 호환 경로 `/programs/economy-education`의 **1사1교 핵심 CRUD 전환 코드**를 기준으로 백엔드 계약과 원격 활성 조건을 정리합니다.

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-07-15 |
| 갱신 | 2026-07-16 — 로드맵 Cat1 · 코어 DoD 교차 링크 |
| 대상 | 1사1교 프로그램 목록·상세·등록·수정·삭제 |
| 제안 `programType` | `COMPANY_SCHOOL` |
| 로드맵 | [programs-api-conversion-roadmap.md](./programs-api-conversion-roadmap.md) — **Cat 1** |
| 현재 운영 상태 | FE 연결 완료, **기본 OFF**, OpenAPI/BE 수용 확인 전 원격 활성화 금지 |
| 공통 등록 플로우 | [programs-registration-flow-api-backend-handoff.md](./programs-registration-flow-api-backend-handoff.md) — 공통 원칙만 링크하며 중복하지 않음 |
| **더미 시드 (목록·상세 CASE)** | [company-school-program-dummy-seed-backend-request.md](./company-school-program-dummy-seed-backend-request.md) |

> SSOT는 `src/features/program/1c-1s/api/*`, `general`의 `economy` 등록 분기, 공통 `programs-api-client.ts`, 현재 `openapi/backend.openapi.json`입니다. 1사1교는 학교/기관과 강사를 대상으로 하며 **봉사자가 없습니다.**

**Cat1 코어 DoD (FE → Cat2 진입):** 스테이징 Phase 0–6 통과 + `VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true` QA 가능.  
상세 FE Phase SSOT: [programs-company-school-detail-api-conversion-status.md](./programs-company-school-detail-api-conversion-status.md)  
목록·상세 LNB 검증용 BE 더미: [company-school-program-dummy-seed-backend-request.md](./company-school-program-dummy-seed-backend-request.md)

---

## 1. 현재 FE 연결 상태

| 층 | 실제 파일 | 연결 상태 |
|----|----------|-----------|
| route/page | `src/pages/programs/program-list-page.tsx` | `/programs/company-school`, `/programs/economy-education`, `?new`, `?programId` |
| list query | `1c-1s/api/hooks.ts` → `useCompanySchoolPrograms` | 1사1교 path에서만 enabled, remote 30초 stale / mock 무기한 |
| detail query | 같은 파일 → `useCompanySchoolProgramDetail` | 선택 program id로 상세 GET 연결 |
| create | 등록 editor → `persistGeneralProgramRegistration` → 동적 import `createCompanySchoolProgram` | 별도 create hook도 구현돼 있으나 현재 등록 완료 path는 service를 직접 호출 |
| update mutation | `useUpdateCompanySchoolProgram` | 상세 저장 연결, detail cache set + list invalidate |
| delete mutation | `useDeleteCompanySchoolProgram` | 목록 선택 삭제 연결, detail cache remove + list invalidate |
| service | `1c-1s/api/service.ts` | gate OFF면 economy mock/localStorage, ON이면 공통 programs HTTP |
| adapter | `1c-1s/api/adapters.ts` | list/detail DTO ↔ `Program`, create/update body 생성 |
| query key/retry | `query-keys.ts`, `errors.ts` | local/remote 목록 key 분리, 4xx 재시도 없음 |

실제 호출 체인:

```text
/programs/company-school
  → useCompanySchoolPrograms
  → listCompanySchoolPrograms
  → GET /api/admin/programs
       ?programType=COMPANY_SCHOOL&page=0&size=500
  → mapCompanySchoolListItemToProgram

?programId={id}
  → useCompanySchoolProgramDetail
  → GET /api/admin/programs/{id}
  → mapCompanySchoolDetailToProgram

등록 완료
  → useProgramRegistrationEditor.handleCompleteRegistration
  → persistGeneralProgramRegistration(variant=economy)
  → createCompanySchoolProgram
  → POST /api/admin/programs

상세 저장/삭제
  → PATCH 또는 DELETE /api/admin/programs/{id}
  → cache 갱신/제거 + list invalidate
```

---

## 2. P0 — `COMPANY_SCHOOL` OpenAPI enum (FE schema 반영됨)

FE 상수:

```text
COMPANY_SCHOOL_PROGRAM_API_TYPE = "COMPANY_SCHOOL"
```

**2026-07-16 갱신:** repository OpenAPI(`backend.openapi.json` 등)와 generated schema
(`programCreateRequestProgramType` / `programResponseProgramType`)에 `COMPANY_SCHOOL` enum이
포함되어 있습니다. FE schema 재생성 완료 상태입니다.

스테이징에서 아직 확인할 백엔드 동작:

- DB/domain이 `COMPANY_SCHOOL`을 수용하고 list filter가 정확히 비교하는지
- create → list → detail round-trip 및 PATCH 시 type 보존
- default form binding이 1사1교 template set을 선택하는지
- 봉사자 리소스/필드 미생성
- 미지원 시 GENERAL로 대체하지 않고 400

스테이징 round-trip 통과 전에는 `VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true`를 운영에 켜지 않습니다.

상세 LNB FE 전환 SSOT: [programs-company-school-detail-api-conversion-status.md](./programs-company-school-detail-api-conversion-status.md)

---

## 3. 공통 programs CRUD 계약

모든 원격 요청은 관리자 Bearer JWT를 사용합니다. FE는 DTO 직접 응답과 `{ success: true, data }` 래퍼를 모두 unwrap합니다.

| Method | Path | FE 요청 | FE가 사용하는 응답 |
|--------|------|---------|--------------------|
| `GET` | `/api/admin/programs` | `programType=COMPANY_SCHOOL`, 선택 `keyword`, `periodStatus`, `businessYear`, 고정 `page=0`, `size=500` | page `{ items, page, size, totalElements, totalPages }` |
| `GET` | `/api/admin/programs` (상단 4카드) | 동일 + `size=1`, `periodStatus`별 4회 병렬 (`생략`/`RECRUITING`/`IN_PROGRESS`/`COMPLETED`) | `totalElements`만 사용 |
| `GET` | `/api/admin/programs/{programId}` | encoded id | `ProgramResponse`, `rounds`, `serviceDetailJson` |
| `POST` | `/api/admin/programs` | `ProgramCreateRequest`, §4 참조 | 생성된 `ProgramResponse`, 안정적 id 필수 |
| `PATCH` | `/api/admin/programs/{programId}` | 기존 program + patch를 merge한 `ProgramUpdateRequest` | 갱신된 `ProgramResponse` |
| `DELETE` | `/api/admin/programs/{programId}` | body 없음 | 2xx, body 미사용 |

### 3.1 목록 mapping

| list DTO | FE `Program` |
|----------|--------------|
| `id` | string id |
| `nameKo` | `title`, `mainTitle` |
| `businessStartDate`, `businessEndDate` | `startDate`, `endDate` |
| `periodStatus=IN_PROGRESS/RUNNING` | `education_in_progress` |
| `periodStatus=COMPLETED/ENDED` | `education_completed` |
| 그 외 periodStatus | `recruiting_students` |
| `approvedOrganizationApplicationCount ?? applicantCount` | `approvedStudentCount` |
| `instructorApplicantCount` | `instructors` |
| `organizationApplicationCount` | `participatingSchoolCount` |

### 3.2 요청·응답 주의

- POST만 `programType`, `businessStartDate`, `businessEndDate`, `autoApplyDefaultFormBindings`를 추가합니다.
- PATCH에는 `programType`이 없으므로 서버가 기존 type을 보존해야 합니다.
- `serviceDetailJson`은 JSON 문자열입니다.
- `rounds[]`는 일정 core만 전송합니다.
- 목록은 현재 pagination UI가 아니라 최대 500건을 한 번에 받아 FE 필터를 적용합니다.
- detail의 nested 1사1교 값은 `serviceDetailJson`이 없으면 복원되지 않습니다.

### 3.3 오류 계약

```json
{
  "success": false,
  "data": null,
  "message": "PROGRAM_TYPE_UNSUPPORTED: COMPANY_SCHOOL is not supported",
  "error": {
    "code": "PROGRAM_TYPE_UNSUPPORTED",
    "message": "1사1교 프로그램 유형을 지원하지 않습니다."
  }
}
```

Query는 4xx를 재시도하지 않고, 5xx/네트워크 오류만 제한적으로 재시도합니다. Create/update/delete mutation은 자동 재시도하지 않습니다.

---

## 4. 실제 adapter payload

### 4.1 top-level create/update 필드

| 그룹 | 실제 전송 필드 |
|------|----------------|
| 기본 | `sponsorId`, `title`, `mainTitle`, `titleEn`, `type`, `format`, `category`, `description` |
| 기간/상태 | `startDate`, `endDate`, `applicationStartDate`, `applicationEndDate`, `status`, `lifecycleStatus` |
| 분류/교육 | `businessArea`, `textbookName`, `textbookNameEn`, `schoolId`, `district`, `ips`, `targetLevel`, `institutionType`, `ipOwned`, `courseDeliveredBy`, `partnerInvolvement`, `programCategory`, `programChannel`, `educationTime`, `teamDivision`, `educationProcess` |
| 인원 | `maleParticipants`, `femaleParticipants`, `totalParticipants`, `generalTeachers`, `educatedTeachers`, `instructors` |
| 봉사자 강제값 | `generalVolunteers: 0`, `staffVolunteers: 0`, `returningVolunteers: 0` |
| 운영/콘텐츠 | `managerName`, `venue`, `curriculum`, `contactEmail`, `contactPhone`, `oneLineIntroduction`, `keyVisualImage`, `settlementRuleId`, `applicationPathId`, `additionalContentHtml`, `recruitmentGuide`, `learningSupportContent`, `attachmentFileNames` |
| 일정/확장 | `rounds`, `serviceDetailJson` |
| create 전용 | `programType: "COMPANY_SCHOOL"`, `businessStartDate=startDate`, `businessEndDate=endDate`, `autoApplyDefaultFormBindings: true` |

`keyVisualImage`는 없으면 `posterImage`를 사용하고, `targetLevel`은 `targetLevels[0]`을 우선합니다. 생성 snapshot은 현재 1월 1일~12월 31일의 1년 사업기간을 만듭니다.

### 4.2 versioned `serviceDetailJson`

top-level shape:

| 필드 | 타입 | 의미 |
|------|------|------|
| `schemaVersion` | `1` | 정확히 이 값만 parse |
| `program` | object | 아래 1사1교 FE 확장 필드 |

`program`에 serializer가 실제로 쓰는 필드:

| 영역 | 필드 |
|------|------|
| 이미지/대상/집계 | `posterImage`, `targetLevels`, `approvedStudentCount`, `instructorCapacity`, `participatingSchoolCount`, `participatingStudentCount` |
| 강사 모집·면접 | `instructorApplicationStartDate`, `instructorApplicationEndDate`, `documentPassAnnouncementDate`, `documentPassAnnouncementMethod`, `interviewStartDate`, `interviewEndDate`, `interviewMethod`, `finalPassAnnouncementDate`, `finalPassAnnouncementMethod`, `instructorTarget`, `instructorTargets`, `instructorTargetDetail` |
| 신청/결과 | `applicationMethod`, `otherNotes`, `resultAnnouncementDate`, `resultAnnouncementMethod`, `studentListRequired` |
| form template id | `applicationFormTemplateId`, `surveyFormTemplateId`, `satisfactionFormTemplateId`, `lectureReportFormTemplateId` |
| 1사1교 고정/화면 상태 | `generalParticipantTypes`, `generalVolunteerInterviewEnabled`, `generalParticipantInterviewEnabled`, `generalSurveyMenuKeys`, `generalProgramAudience`, `generalProgramEducationStructure`, `generalProgramSessionRound`, `generalCommonInfo` |
| 시간/감사 표시 | `scheduleTimeEnabled`, `startTime`, `endTime`, `createdByName`, `updatedByName` |
| 봉사자 강제값 | `generalVolunteers`, `staffVolunteers`, `returningVolunteers` 모두 `0` |

serializer는 다음 값을 입력과 무관하게 강제합니다.

```json
{
  "generalParticipantTypes": ["school_institution", "teacher_instructor"],
  "generalVolunteerInterviewEnabled": false,
  "generalVolunteers": 0,
  "staffVolunteers": 0,
  "returningVolunteers": 0
}
```

parser도 위 값을 다시 강제하고 아래 봉사자 필드를 제거합니다.

- `volunteerApplicationStartDate`
- `volunteerApplicationEndDate`
- `volunteerTarget`
- `volunteerTargets`
- `volunteerTargetDetail`

### 4.3 JSON 샘플

```json
{
  "programType": "COMPANY_SCHOOL",
  "sponsorId": "sponsor-1",
  "title": "2026 1사1교",
  "mainTitle": "2026 1사1교",
  "type": "offline",
  "format": "workshop",
  "category": "school",
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-12-31T23:59:59.999Z",
  "businessStartDate": "2026-01-01T00:00:00.000Z",
  "businessEndDate": "2026-12-31T23:59:59.999Z",
  "applicationStartDate": "2026-01-01T00:00:00.000Z",
  "applicationEndDate": "2026-12-31T23:59:59.999Z",
  "generalVolunteers": 0,
  "staffVolunteers": 0,
  "returningVolunteers": 0,
  "rounds": [
    {
      "roundNumber": 1,
      "startDate": "2026-03-01T00:00:00.000Z",
      "endDate": "2026-03-15T23:59:59.999Z",
      "status": "active",
      "deliveryType": "offline"
    }
  ],
  "serviceDetailJson": "{\"schemaVersion\":1,\"program\":{\"targetLevels\":[\"elementary\"],\"instructorCapacity\":30,\"participatingSchoolCount\":10,\"participatingStudentCount\":300,\"studentListRequired\":\"not_required\",\"generalParticipantTypes\":[\"school_institution\",\"teacher_instructor\"],\"generalVolunteerInterviewEnabled\":false,\"generalCommonInfo\":{\"educationScheduleMode\":\"period\",\"wageGradeRows\":[{\"grade\":\"1급 강사비\",\"pricing\":\"기본 500,000원\"}],\"paymentItems\":\"교통비(일사일교), 숙박비(일사일교)\"},\"generalVolunteers\":0,\"staffVolunteers\":0,\"returningVolunteers\":0}}",
  "autoApplyDefaultFormBindings": true
}
```

---

## 5. form-template binding과 등록 호출 순서

1사1교 등록에서 확인되는 templateCode:

| 단계 | templateCode |
|------|--------------|
| 프로그램 공통정보 | `registration-economy` |
| 학교/기관 신청 | `application-economy` |
| 학교/강사 모집 | 일반 등록 flow의 해당 모집 template를 재사용하며 participant flag로 학교·강사만 노출 |

실제 완료 순서:

```text
현재 모집/신청 participant editor 저장
→ useProgramRegistrationEditor.handleCompleteRegistration
→ persistTemplateDraftIfNeeded()
→ persistGeneralProgramRegistration(variant="economy")
→ gate ON이면 createCompanySchoolProgram
→ POST /api/admin/programs (정확히 1회)
→ 목록 refetch + 생성 id 상세로 이동
```

등록 draft:

- `useGeneralProgramRegistrationFlow`는 `economy` variant에 `templateCode=registration-economy`를 전달합니다.
- `persistTemplateDraftIfNeeded()`는 `formsSurveys` 모듈 + JWT일 때 remote draft PUT을 수행합니다.
- participant editor의 현재 탭 저장은 별도 editor에 위임되며 programs POST body에는 draft가 포함되지 않습니다.
- FE는 `default-form-bindings/apply`나 단건 binding POST를 직접 호출하지 않습니다.
- POST의 `autoApplyDefaultFormBindings=true`에 따라 백엔드가 published 1사1교 기본 binding을 적용해야 합니다.

gate를 켜기 전에 백엔드는 `registration-economy`, `application-economy` 및 학교/강사 모집 양식의 시드·기본 binding을 제공해야 합니다.

공통 등록 원칙과 form-template API는 [programs-registration-flow-api-backend-handoff.md](./programs-registration-flow-api-backend-handoff.md)를 참조합니다.

---

## 6. capability — 기본 OFF와 정확한 활성 조건

원격 사용 함수 `shouldUseCompanySchoolRemoteApi()`는 아래 세 조건을 모두 요구합니다.

1. `hasRemoteAdminJwt()`
2. `isRealApiModuleEnabled('programs')`
3. `VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED`를 trim/lowercase 했을 때 정확히 `"true"`

최소 환경:

```env
VITE_API_SERVER=https://<backend-host>/
VITE_REAL_API_MODULES=adminAuth,programs
VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true
```

다음은 모두 OFF입니다.

- opt-in env 미설정, 빈 값, `1`, `yes`, `TRUE ` 이외의 비정상 값 (`TRUE `는 trim/lowercase 후 true)
- `programs` 모듈 없음
- backend URL 없음
- 관리자 JWT 없음

양식 draft까지 원격 검증하려면 `formsSurveys`가 추가로 필요하지만, 현재 `registration-economy` 공통정보는 코드상 remote draft 대상에 연결되지 않았습니다.

```env
VITE_REAL_API_MODULES=adminAuth,formsSurveys,programs
VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true
```

환경 변경 후 Vite dev server를 재시작합니다.

---

## 7. round-trip QA 및 오류 수락 기준

### 7.1 핵심 QA

- [ ] canonical/legacy 두 route가 동일 1사1교 데이터 source 사용
- [ ] 목록 요청에 항상 `programType=COMPANY_SCHOOL`
- [ ] `keyword`, `periodStatus`, `businessYear` 필터와 500건 경계 확인
- [ ] POST 1회 후 안정적 id 반환, list/refetch에서 새 row 노출
- [ ] detail에서 `rounds`와 `serviceDetailJson.schemaVersion=1` 복원
- [ ] PATCH 후 새로고침해도 학교/강사/임금 표시 필드 유지
- [ ] 봉사자 count는 모든 round-trip에서 0, 봉사자 기간/대상은 없음
- [ ] DELETE 후 목록 제거 및 detail 404
- [ ] `COMPANY_SCHOOL` CRUD가 GENERAL/UJAT/Gemini를 변경하지 않음
- [ ] remote OFF에서 기존 economy mock/localStorage와 등록 동작 유지

### 7.2 오류별 수락 기준

| HTTP | 백엔드 조건 | FE/QA 기대 |
|------|-------------|------------|
| 400 | 미지원 type, 잘못된 사업기간/JSON/후원사 | 구조화 오류, 저장 없음, 4xx 재시도 없음 |
| 401 | JWT 없음/만료 | refresh/재로그인, 변경 없음 |
| 403 | 담당 프로그램 범위/쓰기 권한 없음 | 데이터 노출·변경 없음 |
| 409 | 중복 생성, 상태 충돌, binding 중복 | 중복 row/binding 없음, 기존 상태 유지 |
| 500 | program 또는 binding 저장 실패 | 부분 성공 금지, 성공 응답 금지, 사용자 실패 알림 |

특히 현재 1사1교 등록 hook은 GENERAL remote create와 달리 sponsor 미선택 사전 차단을 하지 않습니다. 백엔드는 `sponsorId` 정책을 명확히 하고 누락/존재하지 않는 id를 400으로 반환해야 합니다.

---

## 8. 1사1교 도메인 정책과 누락

### 8.1 봉사자 제외

FE adapter가 보장하는 값:

- 참여 유형: `school_institution`, `teacher_instructor`
- 봉사자 면접: false
- 봉사자 count: 모두 0
- 봉사자 모집 기간/대상: detail parse 시 제거

백엔드도 `COMPANY_SCHOOL`에 봉사자 application/progress/settlement row를 만들거나 GENERAL 기본값을 주입하면 안 됩니다. 목록 집계와 navigation에서도 봉사자 탭은 제외해야 합니다.

### 8.2 임금·장거리·교통·숙박

도메인 정책:

- 편도 **100km 이상** 장거리 출장
- 강사비는 급수 및 기본/장거리 금액을 구분
- 교통비와 숙박비는 1사1교 전용 항목
- 공제 표시는 `일용근로자 원천징수세액`

현재 구현이 보존하는 것은 주로 다음 **표시용 nested 값**입니다.

- `serviceDetailJson.program.generalCommonInfo.wageGradeRows`
- `generalCommonInfo.paymentItems`
- `generalCommonInfo.deductionItems`

하지만 generated `ProgramCreateRequest`가 지원하는 top-level `wagePolicies[]`, `paymentItems[]`를 1사1교 adapter는 채우지 않습니다. 또한 100km 계산 기준, 금액·통화·단위, 증빙, 실비/정액, 숙박 상한, 세금 계산식을 구조화해 보내지 않습니다.

따라서 현재 `serviceDetailJson`은 화면 round-trip용이지 정산 계산 SSOT가 아닙니다. 다음 계약이 누락입니다.

- `COMPANY_SCHOOL` 전용 wage policy schema와 effective date/version
- 거리 산정 출발지·도착지·편도 기준 및 100km 경계
- 교통/숙박 payment item code, 한도, 증빙, 승인 흐름
- 지급/원천징수 계산 결과 및 변경 이력
- programs 정책과 실제 강사 assignment/settlement 연결 id

---

## 9. 핵심 CRUD 외 API 우선순위

| 우선 | 영역 | 현재 판단 |
|------|------|-----------|
| **P0** | `COMPANY_SCHOOL` enum/저장/필터, CRUD round-trip | gate blocker |
| **P0** | create + published default bindings 원자성, `registration-economy`/`application-economy` seed | 등록 후 사용 가능성에 필수 |
| **P0** | 학교·강사만 허용하고 봉사자 제외하는 서버 validation | 유형 격리 필수 |
| **P1** | 학교 신청 목록·승인/반려·일정 선택·강사 배정 | 현재 general/economy UI·mock 의존, type scope 계약 필요 |
| **P1** | 강사 신청·서류/면접/최종 선발 | 핵심 운영 API |
| **P1** | 학교/강사 진행현황, 수업 일정, 출석, 교재, 상태 전이 | 실제 운영 상태 서버화 |
| **P1** | 구조화 wagePolicies/paymentItems 및 거리·교통·숙박 정책 | 정산 정확성에 필수 |
| **P1** | 강사 정산 제출/승인/지급명세 연결 | 프로그램 정책과 assignment 연결 필요 |
| **P2** | 설문·만족도·강의평가, 게시글/알림 | 운영 고도화 |
| **P2** | Excel/export, 보고서, 감사 이력 | core 완료 후 |
| **P2** | 신청경로/담당자 CRUD, 세부 navigation capability | 현재 공통 화면 일부 mock |

---

## 10. OpenAPI 반영 후 FE gate 체크리스트

백엔드:

- [x] `COMPANY_SCHOOL`을 OpenAPI query/create/response enum에 추가 (repo snapshot 2026-07-16)
- [ ] list가 type을 정확히 필터하고 다른 프로그램을 섞지 않음 (스테이징)
- [ ] POST/PATCH가 `serviceDetailJson`을 손실 없이 round-trip
- [ ] PATCH에서 기존 `programType` 보존
- [ ] create와 default bindings를 한 트랜잭션으로 처리
- [ ] published 1사1교 template seeds/binding 제공
- [ ] 봉사자 필드/리소스 생성 차단
- [ ] sponsor, 1년 사업기간, school/instructor 규칙 validation
- [ ] 400/401/403/409/500 구조화 오류 제공

FE/QA:

- [x] generated schema에 `COMPANY_SCHOOL` enum 확인
- [x] `registration-economy` remote draft `templateCode` 연결
- [ ] create → list → detail → PATCH → detail → DELETE 스테이징 스모크
- [ ] 봉사자 0/undefined 불변성과 임금 표시 field snapshot diff
- [ ] GENERAL/UJAT/Gemini 목록 격리 회귀
- [ ] 자동 binding이 published version만 참조하는지 확인
- [ ] 모두 통과한 뒤에만 `VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true`
- [ ] 장애 시 opt-in env를 제거/false로 바꿔 즉시 mock/local로 롤백

---

## 11. 코드 앵커

| 역할 | 경로 |
|------|------|
| route/page wiring | `src/pages/programs/program-list-page.tsx` |
| query/mutation | `src/features/program/1c-1s/api/hooks.ts` |
| service | `src/features/program/1c-1s/api/service.ts` |
| adapter/type constant | `src/features/program/1c-1s/api/adapters.ts` |
| list params | `src/features/program/1c-1s/api/list-params.ts` |
| service detail | `src/features/program/1c-1s/api/service-detail-json.ts` |
| capability | `src/features/program/1c-1s/api/capabilities.ts` |
| registration flow | `src/features/program/general/hooks/use-registration-flow.ts` |
| registration persist | `src/features/program/general/lib/registration-local-save.ts` |
| shared HTTP | `src/features/program/general/api/programs-api-client.ts` |
| wage display | `src/features/program/shared/ui/program-detail/project-info/common-info/program-wage-info-section.tsx` |

_OpenAPI 기준: 2026-07-15 repository snapshot. 백엔드 반영 후 live `/v3/api-docs`와 다시 대조합니다._
