# Cursor prompt — 모집 정보를 모집 행마다 완전히 따로 관리 (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

| 항목 | 값 |
|------|-----|
| 대상 | 일반 프로그램 공고 → 모집 정보(여러 건) → 사용자 홈페이지 모집 케이스 |
| 작성일 | 2026-10-01 |
| 프론트 문서 | `apps/cms/docs/api/program-recruitment-independent-management-backend-prompt-2026-10-01.md` |
| 선행 문서 | `program-recruitment-detail-per-case-backend-prompt-2026-10-01.md` (모집 행 문구) |

---

## 목표 모델

```text
프로그램(공고)  ── 공통정보만 가진다 (사업·운영·후원·커리큘럼 등)
 └─ 모집 정보 N건 ── 각자 문구·문의처·대표 이미지·첨부파일·신청 양식을 가진다
     └─ 신청 정보 ── 모집 정보와 1:1 (신청 유형 1개 + 신청 양식 바인딩 1개)
```

- 모집 정보 하나 = `program_recruitment` 행 하나 = 신청 유형(`applicationType`) 하나 = 신청 양식 바인딩 하나.
- 모집 정보끼리 문구·파일·양식을 공유하지 않는다. 프로그램 공통 값으로 채우지도 않는다.
- 사용자 홈페이지는 같은 공고(`programId`) 아래 모집 정보마다 한 카드·한 상세·한 신청으로 노출한다.

---

## 현재 상태 (코드로 확인함)

| 영역 | 지금 | 문제 |
|------|------|------|
| 모집 행 정체성 | `GeneralProgramRecruitmentCommandService.upsert` 가 `program_id + recruitment_type` 으로 기존 행을 찾는다. 요청 DTO `ProgramRecruitmentRequest` 에 `id` 가 없다 | 같은 유형의 모집을 둘 이상 만들 수 없다 (`GENERAL_RECRUITMENT_TYPE_DUPLICATED`). 모집 행에 파일·양식을 안정적으로 붙일 키가 없다 |
| 신청 유형 | `target_type=BOTH` 한 행이 `INDIVIDUAL` / `ORGANIZATION` 두 신청 유형으로 펼쳐진다 (`application-options` SQL의 `unnest`) | 모집 1건에 신청 정보가 2개다. 1:1이 아니다 |
| 문구 | `RecruitmentCaseCopy` 가 `serviceDetailJson` 의 `participantRecruitmentInfo` / `instructorRecruitmentInfo` / `volunteerRecruitmentInfo` 에서 읽는다 | 키가 모집 유형 단위다. 같은 유형 모집이 둘이면 문구를 공유한다 |
| 첨부파일 | `program_attachment(program_id, file_id, attachment_type, …)` — `recruitment_id` 없음. API `PUT /api/admin/programs/{programId}/attachments` | 모든 모집이 같은 첨부를 쓴다. CMS 모집 탭에서 파일을 지우면 다른 탭 파일도 사라진다 |
| 대표 이미지 | `PUT /api/admin/programs/{programId}/thumbnail`, 포털 `thumbnailFileObjectId` 는 프로그램 값 | 모집별 이미지 불가 |
| 신청 양식 | `program_form_binding` 을 `program_id + form_type='APPLICATION' + target_type(신청 유형)` 으로 고른다 | 같은 신청 유형 모집이 둘이면(예: UJAT 봉사자 상·하반기) 같은 양식을 쓴다 |
| 포털 상세 | `HomepageProgramQueryService.getProgram` 이 `attachments(programId)`, 프로그램 썸네일, `PortalProgramPublicFields.applicationMethod(detailJson)` 를 내려준다 | `recruitmentId` 를 지정해도 첨부·이미지·신청 방법이 프로그램 공통이다 |
| 신청 데이터 | `program_*_application.recruitment_id` 이미 존재 | 유지. 이 계약의 기준 키로 쓴다 |

로컬 재현:

```text
GET /api/portal/programs/168004?recruitmentId=168241&applicationType=ORGANIZATION  → attachments [168101,168102]
GET /api/portal/programs/168004?recruitmentId=168242&applicationType=INSTRUCTOR    → attachments [168101,168102]
GET /api/portal/programs/168004?recruitmentId=168243&applicationType=VOLUNTEER     → attachments [168101,168102]
GET /api/portal/programs/186010?recruitmentId=186050&applicationType=INDIVIDUAL    → applicationMethod 기관 행과 동일
```

---

## 1. 데이터

### 1-1. 모집 행

`program_recruitment` 에 아래를 둔다 (컬럼 또는 행 단위 JSON. 다른 행·프로그램 컬럼과 공유하지 않는 저장소여야 한다).

| 필드 | 타입 | 비고 |
|------|------|------|
| `application_type` | varchar, NOT NULL | `INDIVIDUAL` / `ORGANIZATION` / `INSTRUCTOR` / `VOLUNTEER` 중 **하나** |
| `announcement_title` | text, null | 공고용 프로그램명. 없으면 포털 `title` 은 프로그램 제목 |
| `summary` | text, null | |
| `program_description` | text, null | |
| `recruitment_guide` | text, null | |
| `application_method` | text, null | |
| `learning_support_content` | text, null | |
| `additional_content_html` | text, null | |
| `remarks` | text, null | |
| `contact_name` / `contact_phone` / `contact_email` | varchar, null | 모집별 문의처 |
| `thumbnail_file_object_id` | bigint, null | 모집별 대표 이미지 |

- 같은 프로그램에 같은 `recruitment_type` 모집이 여러 개 있어도 된다. 정체성은 `id` 다.
- `target_type=BOTH` 는 새로 만들지 마라. 개인·기관을 둘 다 받으려면 모집 행 2개다.

### 1-2. 모집 첨부

`program_recruitment_attachment(id, recruitment_id NOT NULL, file_id NOT NULL, display_order, created_by_admin_id, created_at)` 를 만든다.

- `recruitment_id` 는 `program_recruitment.id` FK. 모집 삭제 시 함께 정리한다.
- 같은 `recruitment_id + file_id` 중복 금지.
- `program_attachment` 는 공통정보(프로그램) 첨부 전용으로 남긴다. 모집 응답·포털 모집 상세에 섞지 마라.

### 1-3. 신청 양식 바인딩 1:1

`program_form_binding` 의 기존 `target_scope` / `target_scope_id` 를 쓴다.

- 신청 양식: `form_type='APPLICATION'`, `target_scope='RECRUITMENT'`, `target_scope_id=<recruitmentId>`, `target_type=<그 모집의 application_type>`.
- 한 모집에 활성 `APPLICATION` 바인딩은 **정확히 1개**. 두 번째 활성 바인딩은 409 (`RECRUITMENT_APPLICATION_FORM_ALREADY_BOUND`). V156 active slot guard 에 `RECRUITMENT` scope 를 넣는다.
- `target_type` 이 모집의 `application_type` 과 다르면 400 (`RECRUITMENT_APPLICATION_TYPE_MISMATCH`).

---

## 2. CMS 관리자 API

모든 응답은 기존 `{ success, data }` 래퍼를 유지한다.

### 2-1. 모집 행 조회

`GET /api/admin/programs/{programId}` 의 `recruitments[]` 와 `GET /api/admin/programs/{programId}/recruitments` 의 각 행:

```json
{
  "id": 168241,
  "recruitmentType": "PARTICIPANT",
  "targetType": "ORGANIZATION",
  "applicationType": "ORGANIZATION",
  "status": "OPEN",
  "startAt": "...", "endAt": "...",
  "operationStartDate": "...", "operationEndDate": "...",
  "maxCount": 30, "minCount": null, "selectionMethod": "ADMIN_REVIEW",
  "announcementTitle": null,
  "summary": null,
  "programDescription": "...",
  "recruitmentGuide": "...",
  "applicationMethod": null,
  "learningSupportContent": null,
  "additionalContentHtml": null,
  "remarks": null,
  "contactName": null, "contactPhone": null, "contactEmail": null,
  "thumbnailFileObjectId": null,
  "attachments": [
    { "attachmentId": 1, "fileObjectId": 168101, "originalFileName": "안내.pdf",
      "contentType": "application/pdf", "fileSize": 1234, "displayOrder": 0 }
  ],
  "applicationFormBindingId": 22
}
```

값이 없으면 `null` / `[]`. 프로그램 컬럼이나 다른 행 값으로 채우지 마라.

### 2-2. 프로그램 생성·수정의 `recruitments[]`

`ProgramRecruitmentRequest` 에 추가:

| 필드 | 규칙 |
|------|------|
| `id` | 있으면 그 행을 수정. 그 프로그램의 행이 아니면 400 (`RECRUITMENT_NOT_IN_PROGRAM`). 없으면 새 행 |
| `applicationType` | 필수. 행당 하나. 기존 행의 값 변경은 신청이 있으면 409 (`RECRUITMENT_HAS_APPLICATIONS`) |
| 문구·문의처 필드 | 2-1 의 이름 그대로. **보낸 필드만** 그 행에 저장한다 |

- `program_id + recruitment_type` 으로 행을 찾지 마라. `GENERAL_RECRUITMENT_TYPE_DUPLICATED` 검사를 없앤다.
- 요청에 빠진 기존 행은 건드리지 않는다 (암묵 삭제 금지).
- 프로그램 PATCH 최상위 `description`, `recruitmentGuide`, `applicationMethod`, `learningSupportContent`, `additionalContentHtml`, `attachmentFileNames`, `keyVisualImage` 는 공통정보 전용이다. 모집 행에 복사하지 마라. 모집 행 값을 이 컬럼에 쓰지도 마라.

### 2-3. 모집 단건 엔드포인트

| 메서드 | 경로 | 바디 | 동작 |
|--------|------|------|------|
| `PATCH` | `/api/admin/programs/{programId}/recruitments/{recruitmentId}` | 2-1 의 문구·문의처·기간·인원 필드 (부분) | 그 행만 수정 |
| `DELETE` | `/api/admin/programs/{programId}/recruitments/{recruitmentId}` | — | 신청이 있으면 409 (`RECRUITMENT_HAS_APPLICATIONS`) |
| `GET` | `/api/admin/programs/{programId}/recruitments/{recruitmentId}/attachments` | — | 그 모집 첨부 |
| `PUT` | `/api/admin/programs/{programId}/recruitments/{recruitmentId}/attachments` | `{ "fileObjectIds": [..] }` | 그 모집 첨부 전체 교체. 다른 모집·프로그램 첨부는 그대로 |
| `PUT` | `/api/admin/programs/{programId}/recruitments/{recruitmentId}/thumbnail` | `{ "fileObjectId": 123 }` | 그 모집 대표 이미지 |
| `DELETE` | `/api/admin/programs/{programId}/recruitments/{recruitmentId}/thumbnail` | — | 그 모집 대표 이미지 해제 |

- `recruitmentId` 가 `programId` 소속이 아니면 404.
- 파일 업로드 owner 는 기존 `PROGRAM_CONTENT` 를 쓰되 `ownerType='PROGRAM_RECRUITMENT'`, `ownerId=<recruitmentId>` 를 허용한다. 생성 전 staging 업로드(`ownerType='PROGRAM'`, `ownerId=1`) 파일도 위 PUT 으로 연결할 수 있어야 한다.
- 권한은 프로그램 수정 권한과 같다.

### 2-4. 신청 양식 바인딩

`POST /api/admin/programs/{programId}/form-bindings` 에 `targetScope="RECRUITMENT"`, `targetScopeId=<recruitmentId>` 를 허용한다. `PATCH` / `DELETE` 도 같다. 1-3 규칙으로 검증한다.

---

## 3. 사용자 홈페이지(포털) API

### 3-1. 목록 `GET /api/portal/programs`

- 공개 모집 행 하나 = 목록 한 줄. `applicationType` 은 그 행 값 하나, `availableApplicationTypes` 는 그 값 하나짜리 배열.
- `title` = 그 행 `announcementTitle` (없으면 프로그램 제목), `summary` = 그 행 `summary` (없으면 프로그램 요약).
- `thumbnailFileObjectId` = 그 행 값. 없으면 `null` (프로그램 썸네일로 채우지 마라).
- `portalTab` 매핑은 기존 그대로: `INDIVIDUAL`·`VOLUNTEER` → `YOUTH_YOUNG`, `ORGANIZATION` → `ORGANIZATION`, `INSTRUCTOR` → `INSTRUCTOR`.

### 3-2. 상세 `GET /api/portal/programs/{programId}?recruitmentId=&applicationType=`

`recruitmentId` 가 있으면 아래 필드는 **그 모집 행 값만** 쓴다. 없으면 `null` / `[]`.

```text
title (announcementTitle, 없으면 프로그램 제목)
summary
description  ← programDescription
recruitmentGuide
applicationMethod
learningSupportContent
additionalContentHtml
remarks
contactName / contactPhone / contactEmail
thumbnailFileObjectId
attachments[]  ← program_recruitment_attachment
recruitmentStatus / recruitmentStartAt / recruitmentEndAt
recruitments[] ← 그 행 1건
```

- 사업·운영·교육 진행·커리큘럼·일정·후원 등 공통정보는 프로그램 값을 그대로 쓴다.
- `applicationType` 이 그 행 값과 다르면 404. 다른 프로그램의 `recruitmentId` 도 404.
- `recruitmentId` 없이 부르면 공통정보와 `recruitments[]` 전체만 돌려주고, 위 모집 필드는 `null` / `[]`.
- **포털 상세 200 응답 스키마를 OpenAPI 에 추가한다** (지금은 `description: OK` 뿐). 필드명은 위 이름과 기존 이름을 유지한다.

### 3-3. 신청

- `GET /api/portal/programs/{programId}/application-options`: 모집 행마다 옵션 **1개**. `formBindingId` 는 그 모집의 `RECRUITMENT` scope 바인딩. `unnest` 로 한 행을 여러 신청 유형으로 펼치지 마라.
- `POST /api/portal/programs/{programId}/applications`: `recruitmentId` + `applicationType` + `formBindingId` 가 그 모집의 바인딩과 일치하지 않으면 400 (`RECRUITMENT_FORM_BINDING_MISMATCH`). 다른 모집 바인딩으로 대체하지 마라.
- 저장되는 `program_*_application.recruitment_id` 는 요청한 모집 행이다.

목록·상세는 로그인 없이 200 이어야 한다. `portalTab`, `recruitmentStatus` enum 이름은 바꾸지 마라.

---

## 4. 마이그레이션 (기존 데이터)

Flyway 새 버전으로 작성한다 (현재 최신 `V238`). 이력 데이터를 지우지 마라.

1. **`application_type` 채우기**: `INSTRUCTOR` → `INSTRUCTOR`, `VOLUNTEER` → `VOLUNTEER`, `PARTICIPANT` + `ORGANIZATION|SCHOOL|TEACHER` → `ORGANIZATION`, 그 외 `PARTICIPANT` → `INDIVIDUAL`.
2. **`target_type=BOTH` 분리**: 기존 행은 `INDIVIDUAL` 로 남기고, 같은 값으로 `ORGANIZATION` 행을 새로 만든다. `program_organization_application.recruitment_id` 가 원래 행을 가리키면 새 행 id 로 옮긴다. 예: `186010` / `186050` → `186050`(INDIVIDUAL) + 새 id(ORGANIZATION).
3. **문구**: `RecruitmentCaseCopy` 가 지금 행마다 계산하는 값(`serviceDetailJson` 의 `*RecruitmentInfo`, UJAT `ujat.recruit.institution.*` / `ujat.recruit.volunteer.h1.*` / `h2.*`)을 각 행 컬럼에 복사한다. BOTH 에서 나온 두 행은 같은 값으로 시작한다.
4. **첨부·대표 이미지**: 프로그램의 `program_attachment`(썸네일 제외)와 썸네일을 그 프로그램의 **모든 기존 모집 행**에 복사해 지금 화면이 비지 않게 한다. 이후 저장부터는 모집별로 갈라진다.
5. **신청 양식**: 기존 `APPLICATION` 바인딩(`target_scope` 없음/`PROGRAM`)마다, 같은 `target_type` 을 가진 모집 행 각각에 `RECRUITMENT` scope 바인딩을 만든다. 기존 신청 행의 `form_binding_id` 참조가 깨지지 않게 한다 (원본 바인딩은 비활성화하되 삭제하지 마라).
6. 이후 읽기는 행 컬럼과 새 테이블만 쓴다. `RecruitmentCaseCopy` 의 `serviceDetailJson` 경로는 마이그레이션·하위 호환 읽기에만 남긴다.

---

## 5. 범위

- 쓰기 경로(생성·수정·단건 API)는 **일반 프로그램**(`GENERAL_*`)과 **UJAT** 에 적용한다.
- 1사1교·교육받은 교사·Gemini 는 쓰기 동작을 바꾸지 마라. 읽기(포털·CMS 응답)는 마이그레이션된 행 컬럼을 쓰되 지금과 같은 값이 나와야 한다.

---

## 6. OpenAPI

`openapi/backend.openapi.json` 에 반영한다.

- `ProgramRecruitmentResponse`, `ProgramRecruitmentRequest` 신규 필드
- `ProgramRecruitmentAttachmentResponse`, 2-3 엔드포인트, `ProgramFormBindingRequest.targetScope` 의 `RECRUITMENT`
- `PortalProgramListItem.thumbnailFileObjectId` 의미 변경 설명
- **포털 상세 200 응답 스키마** (3-2)

---

## Done when

1. `168004` 의 기관(`168241`)·강사(`168242`)·봉사자(`168243`) 모집에 서로 다른 첨부를 올리면, 세 포털 상세의 `attachments` 가 각각 다르다. 한 모집 첨부를 지워도 다른 두 모집 첨부는 그대로다.
2. 한 모집의 대표 이미지만 바꾸면 그 모집의 목록 카드·상세 이미지만 바뀐다.
3. 일반 프로그램에 `PARTICIPANT` 모집을 두 건(개인용·기관용) 만들 수 있고, 각자 문구·첨부·신청 양식이 다르다.
4. `186010` 이 개인·기관 두 모집 행으로 나뉘고, 각 행의 `application-options` 는 옵션 1개, `formBindingId` 가 서로 다르다.
5. UJAT 봉사자 상·하반기 모집이 서로 다른 신청 양식을 가질 수 있다.
6. 모집 행에 값이 없으면 포털·CMS 응답이 `null` / `[]` 다. 프로그램 공통 문구·첨부·썸네일로 채우지 않는다.
7. 다른 모집의 `formBindingId` 로 신청하면 400 이다.
8. 기존 신청 데이터의 `recruitment_id` / `form_binding_id` 조회가 마이그레이션 후에도 깨지지 않는다.

**Last updated:** 2026-10-01
