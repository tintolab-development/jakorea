# UJAT 프로그램 API 전환 — 백엔드 핸드오프

CMS `/programs/ujat`의 **프로그램 핵심 CRUD 전환 코드**를 기준으로, 백엔드 계약과 원격 gate를 열기 전에 필요한 수락 조건을 정리합니다.

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-07-15 |
| 갱신 | 2026-07-16 — OpenAPI `UJAT` enum 반영 반영 · 로드맵 Cat2 · blocker를 스테이징 round-trip으로 정정 |
| 대상 | UJAT 프로그램 목록·상세·등록·수정·삭제 |
| 제안 `programType` | `UJAT` |
| 로드맵 | [programs-api-conversion-roadmap.md](./programs-api-conversion-roadmap.md) — **Cat 2** |
| 상세 FE SSOT | [programs-ujat-detail-api-conversion-status.md](./programs-ujat-detail-api-conversion-status.md) |
| 현재 운영 상태 | FE 연결 완료, **기본 OFF**, 스테이징 BE 수용·round-trip 확인 전 원격 활성화 금지 |
| 공통 등록 플로우 | [programs-registration-flow-api-backend-handoff.md](./programs-registration-flow-api-backend-handoff.md) — 공통 원칙만 참조하며 이 문서에 중복하지 않음 |

> SSOT는 `src/features/program/ujat/api/*`, UJAT 등록 훅, 공통 `programs-api-client.ts`, 현재 `openapi/backend.openapi.json`입니다. 이 문서는 구현보다 앞선 희망 계약이 아니라 **현재 FE가 실제로 보내고 읽는 값**을 기록합니다.

---

## 1. 현재 FE 연결 상태

| 층 | 실제 파일 | 연결 상태 |
|----|----------|-----------|
| route/page | `src/pages/programs/UJAT/page.tsx` | `/programs/ujat`, `?new`, `?programId`, `?ujatStep` 연결 |
| list query | `ujat/api/queries.ts` → `usePrograms` | `list()` 연결, remote 30초 stale / local 무기한 |
| detail query | 같은 파일 → `useProgramDetail` | URL `programId`로 `detail()` 연결, remote에서는 목록 initialData를 placeholder로만 사용 |
| create mutation | 같은 파일 → `useCreateProgram` | 등록 완료에서 `create()` 연결, 성공 시 detail cache set + list invalidate |
| update mutation | 같은 파일 → `useUpdateProgram` | 목록/상세 편집 저장 연결, detail cache set + list invalidate |
| delete mutation | 같은 파일 → `useDeleteProgram` | 서비스 구현 및 cache 정리 완료. 화면별 삭제 action 노출은 별도 QA 필요 |
| service | `ujat/api/service.ts` | gate OFF면 mock/localStorage, ON이면 공통 programs HTTP client |
| adapter | `ujat/api/adapters.ts` | list/detail DTO → `Program`, `Program` → create/update body |
| query key | `ujat/api/query-keys.ts` | local/remote source를 key에 포함해 cache 혼합 방지 |
| retry | `ujat/api/errors.ts` | 4xx 재시도 없음, 그 외 최대 2회 실패 전까지 재시도 |

실제 호출 체인은 다음과 같습니다.

```text
/programs/ujat
  → usePrograms
  → ujat/api/service.list
  → GET /api/admin/programs?programType=UJAT&page=0&size=100
  → fromListItem

?programId={id}
  → useProgramDetail
  → GET /api/admin/programs/{id}
  → fromDetail + parseServiceDetail

등록 완료
  → useUjatProgramRegistrationFlow.handleCompleteRegistration
  → registration draft persist
  → useCreateProgram → service.create
  → POST /api/admin/programs
  → fromDetail → detail cache + list invalidate

상세 저장/삭제
  → PATCH 또는 DELETE /api/admin/programs/{id}
  → detail cache 갱신/제거 + list invalidate
```

---

## 2. P0 blocker — 스테이징 `UJAT` 수용 · round-trip (OpenAPI enum은 FE 반영됨)

FE는 목록 query와 create body에 문자열 **`UJAT`**를 보냅니다.

- `toRemoteListParams`: `programType: 'UJAT'`
- `toCreateRequest`: `programType: 'UJAT'`

**2026-07-16 갱신:** repository OpenAPI(`backend.openapi.json` 등)와 generated schema
(`programCreateRequestProgramType` / `programResponseProgramType`)에 **`UJAT` enum이 포함**되어 있습니다.
구버전 문서의 「OpenAPI가 `type: string`만이라 enum이 없다」는 서술은 **폐기**합니다.

남은 P0는 **스테이징 백엔드 동작**입니다.

1. DB/domain이 `UJAT`를 수용하고 `GET list?programType=UJAT`가 정확히 필터하는지
2. `POST` 저장 후 list/detail에서 같은 `programType`으로 round-trip
3. `PATCH` 시 type·`serviceDetailJson`(incl. `registration`) 보존
4. `autoApplyDefaultFormBindings=true`일 때 UJAT templateCode 집합·상·하반기 binding scope 적용
5. create + default binding이 **한 트랜잭션**으로 성공/실패 (부분 성공 금지)
6. 미지원 환경에서는 임의로 `GENERAL`로 저장하지 말고 400 구조화 오류 반환

이 조치와 스테이징 스모크(§7) 전에는 `ujatPrograms` gate를 켜지 않습니다.

상세 FE Phase: [programs-ujat-detail-api-conversion-status.md](./programs-ujat-detail-api-conversion-status.md)  
교육 지역 전용: [programs-ujat-education-regions-api-backend-handoff.md](./programs-ujat-education-regions-api-backend-handoff.md)

---

## 3. 공통 programs CRUD 계약

모든 요청은 관리자 Bearer JWT를 사용하며 FE는 성공 응답이 DTO 직접형이거나 `{ success: true, data }` 래퍼인 경우 모두 unwrap합니다.

| Method | Path | FE 요청 | FE가 사용하는 응답 |
|--------|------|---------|--------------------|
| `GET` | `/api/admin/programs` | `programType=UJAT`, 선택 `keyword`, `businessYear`, `page`(기본 0), `size`(기본 100) | `{ items, page, size, totalElements, totalPages }`; item의 `id/uuid`, `nameKo`, 사업기간, 신청 집계, 생성·수정일 |
| `GET` | `/api/admin/programs/{programId}` | URL-safe encoded id | `ProgramResponse`; core 필드, `rounds[]`, `serviceDetailJson`, 생성·수정일 |
| `POST` | `/api/admin/programs` | `ProgramCreateRequest`, 아래 §4 | 생성된 `ProgramResponse`; 안정적 `id` 필수 |
| `PATCH` | `/api/admin/programs/{programId}` | `ProgramUpdateRequest`; patch를 기존 `Program`과 merge한 전체 FE snapshot | 갱신된 `ProgramResponse` |
| `DELETE` | `/api/admin/programs/{programId}` | body 없음 | 2xx; body는 사용하지 않음 |

### 3.1 요청·응답 주의

- `POST`만 `programType`, `businessStartDate`, `businessEndDate`, `autoApplyDefaultFormBindings`를 추가합니다.
- `PATCH`에는 `programType`과 `business*`가 없습니다. 기존 type을 보존해야 합니다.
- `serviceDetailJson`은 **JSON object가 아니라 JSON 문자열**입니다.
- `rounds[]`는 `roundNumber`, 날짜, capacity/classCount, status, curriculum, deliveryType을 보냅니다.
- 목록 title은 `nameKo`, 상세 title은 `title` → `mainTitle` 순으로 읽습니다.
- 목록의 `periodStatus`는 현재 UJAT adapter에서 lifecycle/UI 상태로 변환하지 않습니다. UJAT 고유 진행 상태는 `serviceDetailJson.program.ujatProgressStatus`가 상세 SSOT입니다.

### 3.2 오류 계약

오류는 HTTP status와 함께 다음 구조를 권장합니다.

```json
{
  "success": false,
  "data": null,
  "message": "PROGRAM_TYPE_UNSUPPORTED: UJAT is not supported",
  "error": {
    "code": "PROGRAM_TYPE_UNSUPPORTED",
    "message": "UJAT 프로그램 유형을 지원하지 않습니다."
  }
}
```

4xx는 FE query가 재시도하지 않습니다. 5xx/네트워크 오류만 제한적으로 재시도하며 mutation은 재시도하지 않습니다.

---

## 4. 실제 adapter payload

### 4.1 top-level create/update 필드

| 그룹 | 실제 전송 필드 |
|------|----------------|
| 식별/기본 | `sponsorId`, `title`, `mainTitle`, `titleEn`, `type`, `format`, `category`, `description` |
| 기간/상태 | `startDate`, `endDate`, `applicationStartDate`, `applicationEndDate`, `status`, `lifecycleStatus` |
| 분류/교육 | `businessArea`, `textbookName`, `textbookNameEn`, `schoolId`, `district`, `ips`, `targetLevel`, `institutionType`, `ipOwned`, `courseDeliveredBy`, `partnerInvolvement`, `programCategory`, `programChannel`, `educationTime`, `teamDivision`, `educationProcess` |
| 인원 | `maleParticipants`, `femaleParticipants`, `totalParticipants`, `generalVolunteers`, `staffVolunteers`, `returningVolunteers`, `generalTeachers`, `educatedTeachers`, `instructors` |
| 운영/콘텐츠 | `managerName`, `venue`, `curriculum`, `contactEmail`, `contactPhone`, `oneLineIntroduction`, `keyVisualImage`, `settlementRuleId`, `applicationPathId`, `additionalContentHtml`, `recruitmentGuide`, `learningSupportContent`, `attachmentFileNames` |
| 일정/확장 | `rounds`, `serviceDetailJson` |
| create 전용 | `programType: "UJAT"`, `businessStartDate=startDate`, `businessEndDate=endDate`, `autoApplyDefaultFormBindings: true` |

`undefined` 값은 axios JSON 직렬화 과정에서 빠집니다. `keyVisualImage`는 없으면 `posterImage`를 사용하고 `targetLevel`은 `targetLevels[0]`을 우선합니다.

### 4.2 versioned `serviceDetailJson`

top-level shape은 정확히 다음과 같습니다.

| 필드 | 타입 | create/update |
|------|------|---------------|
| `version` | `1` | 항상 |
| `program` | object | 아래 허용 필드 중 값이 `undefined`가 아닌 것 |
| `registration` | object | create에서 등록 snapshot이 있을 때 추가하며, PATCH 전에 기존 상세를 조회해 보존 |
| `registration.draft` | `WritingFormDraft` | `registration-ujat` 공통정보 draft |
| `registration.overlay` | object | UJAT 등록 overlay key/value |

`program`에 저장되는 정확한 필드:

| 영역 | 필드 |
|------|------|
| UJAT 진행/집계 | `ujatProgressStatus`, `ujatFirstHalfVolunteerCount`, `ujatSecondHalfVolunteerCount` |
| 대상/결과 | `targetLevels`, `resultAnnouncementDate`, `resultAnnouncementMethod`, `studentListRequired`, `approvedStudentCount`, `instructorCapacity`, `participatingSchoolCount`, `participatingStudentCount` |
| 강사/봉사 모집·면접 | `instructorApplicationStartDate`, `instructorApplicationEndDate`, `documentPassAnnouncementDate`, `documentPassAnnouncementMethod`, `interviewStartDate`, `interviewEndDate`, `interviewMethod`, `finalPassAnnouncementDate`, `finalPassAnnouncementMethod`, `instructorTarget`, `instructorTargets`, `instructorTargetDetail`, `volunteerApplicationStartDate`, `volunteerApplicationEndDate`, `volunteerTarget`, `volunteerTargets`, `volunteerTargetDetail` |
| 양식/안내 | `applicationMethod`, `otherNotes`, `applicationFormTemplateId`, `surveyFormTemplateId`, `satisfactionFormTemplateId`, `lectureReportFormTemplateId` |
| 시간 | `scheduleTimeEnabled`, `startTime`, `endTime` |

상세 parse는 `version === 1`이고 `program`이 object일 때만 위 allowlist를 복원합니다. 미지원 version, 깨진 JSON, 임의 필드는 조용히 무시됩니다. `registration` snapshot은 UI `Program`으로 복원하지 않지만, PATCH 직전에 현재 상세를 조회해 기존 draft/overlay를 새 `serviceDetailJson`에 다시 포함합니다.

### 4.3 JSON 샘플

```json
{
  "programType": "UJAT",
  "sponsorId": "sponsor-1",
  "title": "2026 UJAT",
  "type": "offline",
  "format": "course",
  "category": "school",
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-12-31T23:59:59.999Z",
  "businessStartDate": "2026-01-01T00:00:00.000Z",
  "businessEndDate": "2026-12-31T23:59:59.999Z",
  "status": "active",
  "lifecycleStatus": "planned",
  "rounds": [],
  "serviceDetailJson": "{\"version\":1,\"program\":{\"ujatProgressStatus\":\"VOLUNTEER_RECRUITING\",\"ujatFirstHalfVolunteerCount\":120,\"ujatSecondHalfVolunteerCount\":100,\"targetLevels\":[\"elementary\"],\"volunteerTargets\":[\"대학생\"],\"scheduleTimeEnabled\":true,\"startTime\":\"09:00\",\"endTime\":\"12:00\"},\"registration\":{\"draft\":{\"schemaVersion\":1,\"formSettings\":{\"titleNumbering\":\"number\"},\"paragraphs\":[]},\"overlay\":{\"ujat.basicInfo.programManagementName\":\"2026 UJAT\"}}}",
  "autoApplyDefaultFormBindings": true
}
```

백엔드는 `serviceDetailJson` 문자열을 parse/재구성해 필드를 손실시키지 말고 **원문 의미를 그대로 저장·반환**해야 합니다.

---

## 5. form-template binding과 등록 호출 순서

UJAT 등록 단계:

1. `registration-ujat`
2. `recruitment-ujat-school`
3. `recruitment-ujat-volunteer` 상반기
4. `recruitment-ujat-volunteer` 하반기
5. `application-ujat-school`
6. `application-ujat-volunteer`

완료 버튼의 실제 순서:

```text
participantVm.handleSave()                 # 현재 탭 저장 시작
→ await registrationVm.persistDraft()     # registration-ujat draft/overlay 저장
→ POST /api/admin/programs                 # 정확히 1회
   programType=UJAT
   autoApplyDefaultFormBindings=true
   serviceDetailJson.registration={draft,overlay}
→ 성공 응답 detail cache set
→ UJAT list invalidate/refetch
→ programId 상세로 이동
```

중요한 현재 제약:

- participant 탭 저장은 완료 함수에서 await되지 않으므로, programs POST와 순서가 엄격히 직렬화되지 않습니다.
- 프로그램 POST body에는 공통 등록 snapshot만 포함되고 모집/신청 탭 draft 전체가 들어가지 않습니다.
- FE는 `default-form-bindings/apply` 또는 단건 `form-bindings` POST를 직접 호출하지 않습니다.
- 백엔드는 `autoApplyDefaultFormBindings=true`를 보고 **published version**의 UJAT 기본 binding을 원자적으로 적용해야 합니다.
- 권장 UJAT 기본 templateCode는 위 5종 코드이며, 상·하반기 봉사 모집처럼 같은 code를 두 번 쓰는 경우 binding scope/term 식별 계약이 추가로 필요합니다.

양식 draft API 자체의 공통 계약은 [programs-registration-flow-api-backend-handoff.md](./programs-registration-flow-api-backend-handoff.md)와 [form-template-json-contract.md](./form-template-json-contract.md)를 따릅니다.

---

## 6. capability — 기본 OFF와 정확한 활성 조건

`shouldUseRemoteApi()`는 아래 **세 조건이 모두 true**일 때만 원격입니다.

1. `hasRemoteAdminJwt()` — API 로그인으로 받은 관리자 JWT 존재
2. `isRealApiModuleEnabled('programs')`
3. `isRealApiModuleEnabled('ujatPrograms')`

`isRealApiModuleEnabled` 자체가 backend URL 설정도 확인하므로 최소 환경 예시는 다음과 같습니다.

```env
VITE_API_SERVER=https://<backend-host>/
VITE_REAL_API_MODULES=adminAuth,programs,ujatPrograms
```

- `VITE_REAL_API_MODULES` 미설정/빈 값: OFF
- `programs`만 있음: OFF
- `ujatPrograms`만 있음: OFF
- JWT 없음: OFF
- gate 변경 후 Vite dev server 재시작 필요
- `formsSurveys`는 프로그램 CRUD gate와 별개이며 등록 draft 원격 저장에 추가로 필요

```env
VITE_REAL_API_MODULES=adminAuth,formsSurveys,programs,ujatPrograms
```

---

## 7. round-trip QA 및 오류 수락 기준

### 7.1 핵심 QA

- [ ] 목록: `GET ...?programType=UJAT`가 다른 유형을 섞지 않고 UJAT만 반환
- [ ] 목록: `businessYear`, `keyword`, `page`, `size` 동작 및 page metadata 일치
- [ ] 상세: list id로 GET 성공, `rounds`와 `serviceDetailJson` 반환
- [ ] 생성: POST 1회 후 안정적 id 반환, 목록 재조회에서 노출
- [ ] 수정: 상세의 값을 PATCH한 뒤 새로고침해도 top-level 및 §4.2 필드 유지
- [ ] 수정: `serviceDetailJson.version=1`과 알 수 없는 미래 필드를 백엔드가 임의 삭제하지 않음
- [ ] 삭제: 2xx 후 list에서 사라지고 동일 id detail은 404
- [ ] remote OFF: 기존 mock/localStorage 동작 유지, 네트워크 요청 없음
- [ ] type 격리: UJAT CRUD가 GENERAL/COMPANY_SCHOOL/Gemini row를 변경하지 않음

### 7.2 오류별 수락 기준

| HTTP | 백엔드 조건 | FE/QA 기대 |
|------|-------------|------------|
| 400 | 미지원 `UJAT`, 잘못된 날짜/JSON/필수값 | 구조화 code/message, 저장 없음, 4xx 재시도 없음 |
| 401 | JWT 없음/만료 | 인증 오류, refresh 또는 재로그인 경로; 데이터 변경 없음 |
| 403 | 프로그램 읽기/쓰기 권한 없음 | 권한 오류, 타 담당 프로그램 정보 노출 없음 |
| 409 | 중복 생성, 상태 전이 충돌, binding 중복 | 기존 row 보존, 중복 프로그램/binding 생성 없음 |
| 500 | 트랜잭션/저장 실패 | 성공 응답 금지, create와 auto-binding 부분 성공 금지, 재시도 후에도 사용자 오류 표시 |

---

## 8. UJAT 교육 지역과 파트너 배정

### 8.1 교육 지역

> **Cat 3 전용 SSOT:** [programs-ujat-education-regions-api-conversion-status.md](./programs-ujat-education-regions-api-conversion-status.md) · [programs-ujat-education-regions-api-backend-handoff.md](./programs-ujat-education-regions-api-backend-handoff.md)

OpenAPI에는 다음 경로가 존재합니다.

- `GET /api/admin/ujat/education-regions`
- `PATCH /api/admin/ujat/education-regions/{regionId}`
- `PUT /api/admin/ujat/education-regions/reorder`
- 사용자 조회 `GET /api/ujat/education-regions`

하지만 현재 FE의 `useUjatEducationRegions`는 API가 아니라 `education-region-store` localStorage/event를 읽습니다. 기본 8개 지역은 서울, 경기(남부), 인천, 대전, 대구, 부산, 광주, 전북(전주)입니다.

즉, programs CRUD가 remote여도 교육 지역은 자동으로 서버화되지 않습니다. `serviceDetailJson`에도 region master 자체는 포함되지 않으므로 다음이 누락 상태입니다.

- 서버 region id/key/name/sortOrder/active와 FE local key의 adapter
- education-regions query/mutation 및 cache invalidate
- localStorage → 서버 one-time migration/충돌 정책
- 삭제·비활성 지역을 기존 신청/배정에서 표시하는 보존 정책

### 8.2 partner assignments

OpenAPI에는 schedule 단위 경로가 있습니다.

- `GET/POST /api/admin/program-execution/programs/{programId}/schedules/{scheduleId}/ujat/partner-assignments`
- `POST .../partner-assignments/{assignmentGroupId}/cancel`

현재 UJAT source에는 이 path를 호출하는 client가 없고, 배정 UI는 mock/local store 중심입니다. 또한 programs adapter가 `schedules[]`를 create/update body에 채우지 않고 `rounds[]`만 채우므로, partner assignment 호출에 필요한 안정적 `scheduleId`를 확보하는 연결도 빠져 있습니다.

관계 계약은 최소한 다음 순서를 보장해야 합니다.

```text
UJAT program
  → program schedules (stable scheduleId)
  → education region key/id
  → institution/class + volunteer partner assignment group
  → confirm/cancel history
```

---

## 9. 핵심 CRUD 외 API 우선순위

| 우선 | 영역 | 현재 판단 |
|------|------|-----------|
| **P0** | `UJAT` programType enum/저장/필터, create-list-detail-PATCH-DELETE round-trip, create+default binding 원자성 | gate 전 필수 blocker |
| **P0** | 등록에 필요한 published UJAT template seeds 및 상·하반기 binding scope | 생성 후 실제 신청 플로우 진입에 필수 |
| **P1** | education-regions GET/PATCH/reorder FE 연결 | 현재 OpenAPI는 있으나 FE localStorage |
| **P1** | program schedule 생성/조회와 partner-assignments GET/POST/cancel 연결 | OpenAPI 일부 존재, FE client 없음·scheduleId 연결 없음 |
| **P1** | 학교/봉사자 신청 목록·서류/면접 배정·평가·최종 결과 | 화면 다수가 mock/local; 공통 applications API의 UJAT scope 검증 필요 |
| **P1** | 출석, 기관·봉사자 진행, 포기/취소, 1365 시간, 수료 상태 | 운영 핵심 상태와 이력·권한 계약 필요 |
| **P1** | 금요일 1~4교시 validation | UI 규칙만이 아니라 서버 schedule validation 필요 |
| **P2** | 과제/문서, 설문·만족도·강의평가, 게시글 | 상세 운영 고도화 |
| **P2** | 정산/지급, 1365 preview/export, 증명서 | 개인정보·감사로그·파일 계약 포함 필요 |
| **P2** | Excel export, 알림, 감사/이력 | core 운영 이후 |

---

## 10. OpenAPI 반영 후 FE gate 체크리스트

백엔드:

- [ ] `UJAT`를 canonical enum과 OpenAPI query/create/response에 추가
- [x] OpenAPI/generated에 `UJAT` enum 반영 (2026-07-16 FE repo 기준) — **남은 건 스테이징 DB·validation·round-trip**
- [ ] POST/PATCH가 `serviceDetailJson` opaque string을 손실 없이 round-trip
- [ ] list가 `programType=UJAT`를 정확히 필터
- [ ] create 응답과 detail 응답이 같은 `ProgramResponse` 의미를 제공
- [ ] create + UJAT default bindings가 한 트랜잭션으로 성공/실패
- [ ] published UJAT template seeds와 binding scope 제공
- [ ] 400/401/403/409/500 구조화 오류 및 권한 검증

FE/QA:

- [ ] 최신 `/v3/api-docs` 수집 및 generated schema 재생성
- [ ] generated `programType`이 enum union으로 생성되는지 확인
- [ ] adapter/unit test에서 OpenAPI enum 타입으로 임시 문자열 우회 제거 가능 여부 확인
- [ ] 스테이징 JWT로 create → list → detail → PATCH → detail → DELETE 스모크
- [ ] `serviceDetailJson` snapshot diff로 필드 손실 확인
- [ ] `formsSurveys` ON에서 draft 및 자동 binding 확인
- [ ] education-regions/partner-assignments는 별도 P1 gate가 준비되기 전 local 상태 유지
- [ ] 모든 스모크 통과 후에만 `VITE_REAL_API_MODULES`에 `programs,ujatPrograms` 추가
- [ ] 실패 시 `ujatPrograms`만 제거해 UJAT를 즉시 local/mock으로 롤백

---

## 11. 코드 앵커

| 역할 | 경로 |
|------|------|
| page/route wiring | `src/pages/programs/UJAT/page.tsx` |
| query/mutation | `src/features/program/ujat/api/queries.ts` |
| service | `src/features/program/ujat/api/service.ts` |
| adapter | `src/features/program/ujat/api/adapters.ts` |
| list params | `src/features/program/ujat/api/list-params.ts` |
| service detail | `src/features/program/ujat/api/service-detail.ts` |
| capability | `src/features/program/ujat/api/capabilities.ts` |
| retry | `src/features/program/ujat/api/errors.ts` |
| registration order | `src/features/program/ujat/hooks/use-ujat-program-registration-flow.ts` |
| registration editor | `src/features/template/ui/form-set/registration-form/UJAT/use-ujat-program-registration-editor.ts` |
| education regions | `src/features/program/ujat/hooks/use-ujat-education-regions.ts`, `lib/education-region-store.ts` |
| shared HTTP | `src/features/program/general/api/programs-api-client.ts` |

_OpenAPI 기준: 2026-07-15 repository snapshot. 백엔드 반영 후 live `/v3/api-docs`와 다시 대조합니다._
