# 일반 프로그램 등록 완료 · `POST /api/admin/programs` — 백엔드 핸드오프

CMS `/programs/general` **신규 프로그램 등록 위저드**에서 「프로그램 등록 완료」 시 호출하는 생성 API 계약입니다.  
OpenAPI에 경로가 이미 있더라도, **FE mock·등록 스냅샷·현재 전송 body·확인 요청**을 한곳에 모아 BE 개발·검증용으로 전달합니다.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-15 |
| **갱신** | 2026-07-15 — BE create 계약·FE 매퍼/`autoApply`/후원사 연동 반영 |
| **대상 화면** | `/programs/general?new=1` → 공통정보 → (모집) → **신청정보** → 「프로그램 등록 완료」 |
| **Method / Path** | `POST /api/admin/programs` |
| **OpenAPI** | `operationId: createProgram` · schema `ProgramCreateRequest` → 응답 `ApiResponse` + `ProgramResponse`(또는 동등 detail) |
| **FE remote 모듈** | `VITE_REAL_API_MODULES`에 `programs` + API 로그인 JWT |
| **관련 문서** | [**등록 플로우 API 전체 목록**](./programs-registration-flow-api-backend-handoff.md) · [programs-api-integration.md](./programs-api-integration.md) · [programs-api-backend-gaps.md](./programs-api-backend-gaps.md) · [programs-api-remaining-work.md](./programs-api-remaining-work.md) · [backend-handoff.md](./backend-handoff.md) · [form-template-json-contract.md](./form-template-json-contract.md) |

---

## 1. 한눈에 보기

| CMS 사용자 동작 | FE가 기대하는 API | FE 현재 상태 |
|-----------------|-------------------|--------------|
| 위저드 **중간 저장**(헤더 저장) | 프로그램 POST **없음** | form-template draft만 (`PUT …/form-template-versions/{versionId}` 또는 localStorage) |
| 신청정보 탭에서 **작성만** | 프로그램 POST **없음** | 동일 (draft) |
| **「프로그램 등록 완료」** | **`POST /api/admin/programs` 1회** | remote ON → `createGeneralProgram` → `createAdminProgramRemote` / OFF → localStorage mock |

> **중요**: 신청정보 작성 단계 자체에는 programs POST가 없습니다.  
> 생성 POST는 신청정보 단계 푸터의 **등록 완료**에서만 발생합니다. (중복 생성 방지)

---

## 2. CMS UI 플로우 (FE 기준)

```text
/programs/general?new=1
    │
    ├─ Phase: 공통 정보 (registration-general draft)
    ├─ Phase: 모집 정보 (선택 참여자 유형별 recruitment draft)
    └─ Phase: 신청 정보 (application-* draft)
              │
              ├─ 헤더 「저장」 → template draft만 (programs POST 없음)
              └─ 「프로그램 등록 완료」
                    → persistGeneralProgramRegistration()
                    → (remote) POST /api/admin/programs
                    → 성공 시 URL: programId + lnb=info (상세 모달)
```

관련 FE 코드:

| 역할 | 경로 |
|------|------|
| 위저드 UI | `features/program/general/ui/registration/registration-fullpage-modal.tsx` |
| 단계·완료 버튼 | `features/program/general/hooks/use-registration-flow.ts` |
| 등록 완료 호출 | `features/template/hooks/use-program-registration-editor.ts` → `handleCompleteRegistration` |
| mock 스냅샷 / persist | `features/program/general/lib/registration-local-save.ts` |
| remote create | `features/program/general/api/admin-general-programs-service.ts` → `createGeneralProgram` |
| HTTP | `features/program/general/api/programs-api-client.ts` → `createAdminProgramRemote` |
| body 매핑 | `features/program/general/api/adapters/general-program-adapters.ts` → `mapGeneralProgramToCreateRequest` |
| CMS nested JSON | `features/program/general/lib/general-program-service-detail-json.ts` |

---

## 3. Mock / local 대체 경로 (참고)

실 API 모듈 OFF 또는 로컬 개발 시 FE는 아래 mock을 사용합니다. BE 구현 시 **대체 대상**입니다.

### 3.1 등록 완료 → localStorage (일반)

| 항목 | 값 |
|------|-----|
| 함수 | `persistGeneralRegistrationFormLocal` |
| 스토리지 키 | `cms.jakorea.generalRegistrationLocalSaves.v1` |
| 프로그램 id prefix | `general-local-` |
| 스냅샷 빌더 | `buildGeneralProgramListRowFromRegistrationSnapshot` |

로컬 레코드 형상:

```json
{
  "version": 1,
  "id": "general-local-<uuid>",
  "savedAt": "2026-07-15T05:00:00.000Z",
  "program": { /* CMS Program 도메인 객체 — 아래 4절 참고 */ },
  "registrationDraft": { /* WritingFormDraft — 프로그램 POST body에 넣지 않음 */ }
}
```

### 3.2 remote OFF fallback create

| 항목 | 값 |
|------|-----|
| 함수 | `programService.create` (`entities/program/api/program-service.ts`) |
| 동작 | 인메모리 `mockPrograms`에 push, `id = program-{timestamp}-…` |
| 참고 | 위저드 등록 완료의 **주** mock은 localStorage(3.1). `programService.create`는 `createGeneralProgram`의 remote-OFF 분기·레거시 CRUD용 |

### 3.3 Mock이 프로그램에 넣는 값 (등록 스냅샷)

`buildGeneralProgramListRowFromRegistrationSnapshot` (`variant: 'general'`) 기준 **현재 FE가 remote create 전에 만드는 값**입니다.  
※ 폼 UI 입력과 **아직 전량 바인딩되지 않은 하드코드/파생값**이 포함됩니다. BE는 “이 필드가 온다” 수준으로 수용하고, 폼→body 완전 매핑은 FE 후속 작업입니다.

| CMS `Program` 필드 | mock 스냅샷 값 (일반) | 비고 |
|--------------------|----------------------|------|
| `sponsorId` | 기본정보 UI 선택값 (remote 필수) · 없으면 local mock 폴백 | BE 존재 검증 |
| `title` / `mainTitle` | `신규 일반 프로그램 (YYYY-MM-DD HH:mm)` | 하드코드 |
| `type` | `offline` | |
| `format` | `workshop` | |
| `category` | 참여자 체크에 따라 `school` / `instructor` / `volunteer` / `individual` | |
| `description` | `일반 프로그램 등록(임시 저장)` | |
| `startDate` / `endDate` | 당해 `04-01` ~ `12-31` (day start/end ISO) | 사업(운영) 기간으로 매핑 |
| `applicationStartDate` / `applicationEndDate` | 오늘 ~ +30일 | |
| `status` | `pending` | |
| `lifecycleStatus` | `recruiting_students` | 목록 `periodStatus=RECRUITING`에 대응 기대 |
| `businessArea` | `경제금융` | |
| `targetLevel` | `elementary` | |
| `generalParticipantTypes` | 체크된 유형 (`individual` / `school_institution` / `teacher_instructor` / `volunteer`) · 없으면 `school_institution` | **탑레벨 CreateRequest에 없음** → `serviceDetailJson` |
| `generalSurveyMenuKeys` | `survey`, `satisfaction`, `lecture_evaluation` | 동일 |
| `rounds[]` | 1개: 3/1~3/15, capacity 30, `deliveryType: offline` | CreateRequest `rounds`로 전송 |
| `scheduleTimeEnabled` / `startTime` / `endTime` | true / `09:00` / `18:00` | CreateRequest에 미전송(현재) |
| `studentListRequired` | `required` | 미전송(현재) |

**참여자 유형 UI → mock `generalParticipantTypes`**

| UI flag | enum |
|---------|------|
| individual | `individual` |
| organization | `school_institution` |
| teacherInstructor | `teacher_instructor` |
| volunteer | `volunteer` |

---

## 4. Remote 요청 계약

### 4.1 HTTP

```http
POST /api/admin/programs
Authorization: Bearer <admin access token>
Content-Type: application/json
```

모듈 게이트: `programs` + MFA 완료 JWT.  
Swagger 태그: `프로그램` · OpenAPI 스냅샷: `apps/cms/openapi/backend.openapi.json`.

### 4.2 Request body (`ProgramCreateRequest`)

FE 매핑: `mapGeneralProgramToCreateRequest` → `mapProgramCoreFieldsToRequest`.

OpenAPI에 정의된 필드 중 **등록 완료 경로에서 실제로 채워질 수 있는 것**(현재 스냅샷 기준 ★, 공통정보 PATCH와 공유되는 필드 ○):

| 필드 | 등록 스냅샷 | 설명 |
|------|:-----------:|------|
| `sponsorId` | ★ | 후원사 id (UI 선택 · remote 필수) |
| `programType` | ★ | create 전용 `GENERAL` |
| `title` | ★ | 프로그램명 |
| `mainTitle` | ★ | 없으면 FE가 `title` 복사 |
| `type` | ★ | 예: `offline` |
| `format` | ★ | 예: `workshop` |
| `category` | ★ | 예: `school` |
| `description` | ★ | |
| `startDate` / `endDate` | ★ | ISO-8601 (사업 기간) |
| `businessStartDate` / `businessEndDate` | ★ | create 전용 — `startDate`/`endDate` mirror |
| `applicationStartDate` / `applicationEndDate` | ★ | ISO-8601 |
| `status` | ★ | 예: `pending` |
| `lifecycleStatus` | ★ | 예: `recruiting_students` → BE `RECRUITING` |
| `businessArea` | ★ | |
| `targetLevel` | ★ | 단일. 다중은 `serviceDetailJson.targetLevels` |
| `rounds` | ★ | `ProgramRoundRequest[]` → BE `program_schedule` |
| `serviceDetailJson` | ★(내용 있을 때) | **JSON string** (이중 stringify 금지). §5 |
| `autoApplyDefaultFormBindings` | ★ | create 전용 `true` — BE가 기본 form-bindings 적용 |
| `instructors` | ○ | 스냅샷은 0 |
| 기타 (`venue`, `contactEmail`, `recruitmentGuide`, `wagePolicies`, `schedules`, `adminAssignments`, `paymentItems`, …) | ○/미전송 | Create schema에는 있으나 등록 스냅샷은 대부분 미설정 |

**Create body에 넣지 않는 것**

| 항목 | 처리 |
|------|------|
| `generalParticipantTypes` 등 nested | `serviceDetailJson`으로만 (BE round-trip 지원) |
| 등록/모집/신청 **WritingFormDraft** | form-templates `PUT` (programs POST에 미포함) |
| form-bindings apply | BE create 자동 — FE `…/default-form-bindings/apply` **미호출** |

### 4.3 샘플 body (일반 프로그램 등록 완료 · 현재 FE)

날짜는 실행 시점에 따라 달라집니다. 구조 참고용입니다.

```json
{
  "sponsorId": "<선택된_후원사_id>",
  "programType": "GENERAL",
  "title": "신규 일반 프로그램 (2026-07-15 14:30)",
  "mainTitle": "신규 일반 프로그램 (2026-07-15 14:30)",
  "type": "offline",
  "format": "workshop",
  "category": "school",
  "description": "일반 프로그램 등록(임시 저장)",
  "startDate": "2026-04-01T00:00:00.000Z",
  "endDate": "2026-12-31T23:59:59.999Z",
  "businessStartDate": "2026-04-01T00:00:00.000Z",
  "businessEndDate": "2026-12-31T23:59:59.999Z",
  "applicationStartDate": "2026-07-15T00:00:00.000Z",
  "applicationEndDate": "2026-08-14T23:59:59.999Z",
  "status": "pending",
  "lifecycleStatus": "recruiting_students",
  "businessArea": "경제금융",
  "targetLevel": "elementary",
  "instructors": 0,
  "rounds": [
    {
      "roundNumber": 1,
      "startDate": "2026-03-01T00:00:00.000Z",
      "endDate": "2026-03-15T23:59:59.999Z",
      "capacity": 30,
      "status": "active",
      "curriculum": "신규 일반 프로그램 (2026-07-15 14:30) 커리큘럼",
      "deliveryType": "offline"
    }
  ],
  "serviceDetailJson": "{\"schemaVersion\":1,\"generalParticipantTypes\":[\"school_institution\"],\"generalSurveyMenuKeys\":[\"survey\",\"satisfaction\",\"lecture_evaluation\"]}",
  "autoApplyDefaultFormBindings": true
}
```

`serviceDetailJson` pretty 예시:

```json
{
  "schemaVersion": 1,
  "generalParticipantTypes": ["school_institution"],
  "generalSurveyMenuKeys": ["survey", "satisfaction", "lecture_evaluation"]
}
```

공통정보 저장(PATCH)과 동일 스키마로 교육구조·모집 nested가 추가될 수 있습니다 (§5).

### 4.4 기대 응답

OpenAPI 예시(요약):

```json
{
  "success": true,
  "data": {
    "id": 5001,
    "uuid": "program-sample-uuid",
    "programCode": "PRG-2026-001",
    "programType": "GENERAL",
    "deliveryType": "OFFLINE",
    "draftStatus": "PUBLISHED",
    "periodStatus": "RECRUITING",
    "nameKo": "신규 일반 프로그램 (2026-07-15 14:30)",
    "businessYear": 2026,
    "businessStartDate": "2026-04-01",
    "businessEndDate": "2026-12-31",
    "adminAssignments": [],
    "schedules": []
  }
}
```

FE 성공 처리:

1. `mapAdminProgramDetailToProgram(data)`로 CMS `Program` 변환
2. 목록 쿼리 invalidate
3. URL을 `programId=<id>&lnb=info` 로 전환 후 상세 모달

**FE가 응답에서 반드시 쓰는 것**

| 필요 | 이유 |
|------|------|
| 안정적인 프로그램 id (`data.id` 또는 FE 어댑터가 읽는 id 필드) | 상세 URL·이후 API path |
| 목록/상세에 보이는 제목 (`title`/`mainTitle` 또는 list의 `nameKo`) | 목록 반영 |
| `serviceDetailJson` round-trip (보냈으면 상세 GET에 유지) | 참여자 유형·설문 메뉴·교육구조 표시 |

날짜 필드: FE는 ISO datetime 전송. BE는 `startDate`/`endDate`·`business*`·`application*` ISO 허용 (합의 완료).

---

## 5. `serviceDetailJson` v1 (CMS nested)

탑레벨 `ProgramCreateRequest` / `ProgramUpdateRequest`에 없는 CMS 전용 필드를 **JSON string**으로 실어 보냅니다.  
스키마 SSOT: `general-program-service-detail-json.ts`.

| 키 | 용도 |
|----|------|
| `schemaVersion` | 항상 `1` |
| `generalCommonInfo` | 교육 일정·임금·모집 설정 nested |
| `generalParticipantTypes` | 참여자 유형 배열 |
| `generalSurveyMenuKeys` | 설문 LNB 메뉴 |
| `targetLevels` | 다중 대상 학년 |
| `generalProgramEducationStructure` | 커리큘럼형 / 일정형 |
| `generalProgramSessionRound` | 수업 회차 유형 |
| `generalProgramAudience` | 기관 / 개인 |
| `instructorApplicationStartDate` / `EndDate` | 강사 모집 기간 |
| `volunteerApplicationStartDate` / `EndDate` | 봉사자 모집 기간 |
| `resultAnnouncementDate` / `resultAnnouncementMethod` | 결과 발표 |

**BE (완료)**

1. Create/Update 시 문자열 영속 · GET detail round-trip
2. `schemaVersion` v1 유지·확장 시 bump 합의
3. 이중 JSON stringify 금지

---

## 6. 이 POST에 포함하지 않는 것

등록 위저드에서 다루는 내용이라도 **programs create와 분리**된 API입니다.

| 데이터 | API | 시점 |
|--------|-----|------|
| 등록/모집/신청 WritingFormDraft | `PUT /api/admin/form-template-versions/{versionId}` (`schemaJson` 등) | 중간 저장·등록 완료 직전 draft persist |
| 사용자(학교/개인) 실제 신청 제출 | Platform `…/form-bindings/…/responses` 등 | 프로그램 생성 **이후** |
| 프로그램↔양식 바인딩 | create 시 BE 자동 (`autoApplyDefaultFormBindings`) · FE apply **미호출** | 생성과 동일 트랜잭션/후처리 |
| 게시글/설문 등록 | `POST …/posts`, surveys | 상세 운영 |

양식 시드·draft 계약: [writing-form-seeds-backend-handoff.md](./writing-form-seeds-backend-handoff.md) · [form-template-json-contract.md](./form-template-json-contract.md).

---

## 7. BE·FE 계약 체크리스트

### P0 — 등록 완료 (BE 완료 · FE 연동)

- [x] Create `programType: "GENERAL"`
- [x] `lifecycleStatus` → `RECRUITING`
- [x] ISO datetime + `businessStartDate`/`businessEndDate`
- [x] `sponsorId` 검증 · FE UI 선택값 전송
- [x] `serviceDetailJson` round-trip
- [x] `rounds[]` → schedule
- [x] `autoApplyDefaultFormBindings: true`
- [ ] 스테이징 수동 QA (JWT create → list → detail)

### P2 — 등록 UX 고도화 (FE 후속)

- [ ] 폼 실제 입력값 → Create 필드 전량 매핑 (현재 FE는 스냅샷 하드코드 비중 큼)
- [ ] 생성자 admin → OWNER `adminAssignments` 자동 부여 (mock `programService.create`는 유사 동작 있음)

---

## 8. 수락 기준 (QA)

| # | 시나리오 | 기대 |
|---|----------|------|
| 1 | remote ON · 「프로그램 등록 완료」 | Network에 `POST /api/admin/programs` **정확히 1회** |
| 2 | 등록 위저드 헤더 「저장」만 | programs POST **없음** |
| 3 | 성공 | 목록에 행 추가 · URL `programId` · 상세 정보 탭 오픈 |
| 4 | 실패 (4xx/5xx) | FE `showAlert` + `getGeneralProgramApiErrorMessage` · `new=1` 유지 |
| 5 | remote OFF | localStorage `general-local-*` 생성 · POST 없음 |
| 6 | body | `programType=GENERAL`, `autoApplyDefaultFormBindings=true`, `business*`, 실 `sponsorId` |
| 7 | form-bindings | BE 자동 · FE apply **미호출** |

---

## 9. 에러 응답 (FE 처리 참고)

공통: [backend-handoff.md](./backend-handoff.md) 에러 래퍼.

| HTTP | FE 기대 |
|------|---------|
| 400 | validation → 사용자 메시지 |
| 401 | 재로그인 |
| 403 | 권한 없음 |
| 409 | 충돌(중복·상태) — programs PATCH와 동일 계열 메시지 매핑 가능 |
| 500 | 일반 실패 알림 |

등록 완료 실패 시 FE 문구 예:「프로그램 등록 중 오류가 발생했습니다. 다시 시도해 주세요.」

---

## 10. 범위 밖 (이 문서에서 다루지 않음)

- 1사1교(`economy`) / 교육받은 교사(`trainedTeachers`) / UJAT / Gemini 등록 POST (별 variant·prefix)
- 신청 목록 승인 API (`applications` 모듈)
- Platform 사용자 신청서 제출 POST

일반 프로그램 **등록 완료 create**만 범위입니다.
