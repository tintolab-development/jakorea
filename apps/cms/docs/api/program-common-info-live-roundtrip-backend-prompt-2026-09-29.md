# Cursor prompt — 프로그램 공통정보 PATCH가 서버 제약으로 거절되지 않게 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(enum·NOT NULL·체크 제약)만 하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/program-common-info-live-roundtrip-backend-prompt-2026-09-29.md`

대상은 CMS 관리자 API다. 홈페이지 어드민(`JAHOMEADMINBACK`, `localhost:8081`)이 아니다.

확인 기준: 로컬 `GET http://localhost:8080/v3/api-docs` 와 **관리자 Bearer**.  
로그인 `POST /api/admin/auth/login` `{ "email": "admin1@jakorea.org", "password": "test1234!" }` 다음 `POST /api/admin/auth/mfa/verify` `{ "challengeUuid", "verificationCode": "000000" }`.  
CMS vitest는 이 계약을 검증하지 못한다. 저장 직후 **같은 id GET** 으로만 통과를 판단하라.

path·필드명·enum을 새로 만들지 마라. Gemini 공통정보 API는 없다. 만들지 마라.

| Method | Path |
|--------|------|
| POST | `/api/admin/programs` |
| PATCH | `/api/admin/programs/{programId}` |
| GET | `/api/admin/programs/{programId}` |
| GET | `/api/admin/programs/{programId}/sponsors` |
| DELETE | `/api/admin/programs/{programId}` |

---

## Goal

공통정보만 담은 PATCH가 아래 네 가지로 통째 거절되지 않게 하라.

1. UJAT `educationStructure: "CURRICULUM"` 은 `detailedProgramId` 없이 저장된다.
2. 1사1교는 `education_structure` 가 null이어도 공통정보 PATCH가 된다. `CURRICULUM` 에 `detailed_program_id` 가 없어도 된다.
3. 일반 프로그램 PATCH에 `recruitments` · `schedules` · `formBindings` 가 없으면 발행 준비 검사로 거절하지 않는다.
4. `DELETE /api/admin/programs/{programId}` 는 자식 행 때문에 `500 DATABASE_ERROR` 가 나지 않는다.

프론트는 이미 이렇게 보낸다. 요청 형식을 프론트에 되돌리지 마라.

---

## 재현

오늘(2026-09-29) 로컬 서버에서 저장 직후 GET으로 확인한 결과다.

### 1. UJAT CURRICULUM

Java `ProgramEducationConfigurationService.validateStructureAndDetailedProgram` 은 UJAT을 세부 프로그램 필수에서 뺀다.  
DB `ck_program_education_structure_detail`(V172) 은 `COMPANY_SCHOOL` / `ONE_COMPANY_ONE_SCHOOL` 만 빼고, UJAT `CURRICULUM` + `detailed_program_id IS NULL` 을 거절한다.  
`DatabaseIntegrityErrorResolver` 가 제약 이름 없이 `409 CONSTRAINT_VIOLATION` 으로 바꾼다.

```http
POST /api/admin/programs
{ "programType": "UJAT", "educationStructure": "CURRICULUM" }
→ 409 CONSTRAINT_VIOLATION
```

행은 만들어지지 않았다. `detailedProgramId` 는 보내지 않았다.

모집 중 UJAT `182103` 에 `educationStructure` 없이 `ips` 와 `serviceDetailJson.registration.overlay` 만 PATCH하면 GET에 IPS·지역정원·불가일이 남는다. 그 경로는 유지한다. 막힌 것은 `CURRICULUM` 저장이다.

### 2. 1사1교

V172는 1사1교 `education_structure` 를 `CURRICULUM` 으로 맞추고 `detailed_program_id` 없이 `CURRICULUM` 을 허용한다. Java는 어긋난다.

- `ProgramTypeWritePolicy.validateEducationStructure`: 저장값이 `CURRICULUM` 이 아니면 `COMPANY_SCHOOL_EDUCATION_STRUCTURE_FIXED`. 컬럼이 null이면 담당자만 보내는 PATCH도 걸린다.
- `validateStructureAndDetailedProgram`: UJAT만 세부 프로그램을 면제한다. 1사1교 `CURRICULUM` + null 은 `400 CURRICULUM_PROGRAM_DETAILED_PROGRAM_REQUIRED`.
- `ProgramWriteCommandMapper` 가 `serviceDetailJson` 의 `program.generalProgramEducationStructure` 를 교육 구조 수정으로 올린다.

| 요청 | 결과 |
|---|---|
| `170001` 에 `sponsors` 만 | `400 COMPANY_SCHOOL_EDUCATION_STRUCTURE_FIXED`. 담당자 null 유지 |
| `170001` 에 운영 기간 + `serviceDetailJson` | `400 CURRICULUM_PROGRAM_DETAILED_PROGRAM_REQUIRED` |
| `educationStructure: "CURRICULUM"`, `detailedProgramId: 163012` 로 만든 `186016` 에 날짜·`period`·`generalVolunteers: 0`·`sponsorContactId: "1627253"` | `200`. GET 시작/종료 `2026-11-22` / `2026-12-23`, mode `period`, 봉사 0, 담당자 `1627253` |
| `186016` 에 `sponsorContactId: "contact-9"` | `400 INVALID_VALUE`. 담당자 `1627253` 유지 |

`163012` 를 `170001` 에 붙이지 마라.

### 3. 일반 프로그램

`GeneralProgramPublishReadinessPolicy.assertReadyForPublishedGeneralProgram` 이 생성과 수정 끝에 항상 돈다.  
참가자 모집에 `operationStartDate` / `operationEndDate` 가 없으면 대표명만 바꿔도 `400 GENERAL_PROGRAM_ACTIVE_PARTICIPANT_RECRUITMENT_REQUIRED` 다.  
모집을 같이 보내 운영일을 채우면 이미 시작된 강사 모집은 `409 PROGRAM_INSTRUCTOR_RECRUITMENT_EDIT_PERIOD_ENDED` 다.  
공통정보 화면은 모집 행을 보내지 않는다.

| 대상 | 요청 | 결과 |
|---|---|---|
| `168007` (사업 종료 `2027-01-27`, 참가자·강사 모집 운영일 null, 일정 1건) | `mainTitle`, `partnerInvolvement`, `totalParticipants`, `serviceDetailJson` 만 | `400 GENERAL_PROGRAM_ACTIVE_PARTICIPANT_RECRUITMENT_REQUIRED`. 값 불변 |
| `168007` | 위 + 모집 운영일 | `409 PROGRAM_INSTRUCTOR_RECRUITMENT_EDIT_PERIOD_ENDED` |
| `186017` (생성 시 모집 운영일·일정·기본 신청서 바인딩 있음, 사업 종료 `2027-03-31`) | 같은 공통정보 | `200` |

`186017` GET: `mainTitle` `원격검증 대표명`, `partnerInvolvement` `false`, `totalParticipants` `40`, `generalVolunteers` `3`, `staffVolunteers` `2`, `generalTeachers` `6`, `educatedTeachers` `9`, `generalCommonInfo.announcementTitle` `원격검증공고`.

### 4. 삭제

`ProgramCommandService.deleteProgram` 은 첨부만 지운 뒤 `DELETE FROM program` 을 친다. 모집·일정·폼 바인딩·후원 배정이 남아 `500 DATABASE_ERROR` 다. 제약 이름은 응답에 없다.

`DELETE` `186015`, `186016`, `186017` 모두 500. 세 행은 아직 있다.

| id | 유형 | 상태 |
|---|---|---|
| `186015` | GENERAL_ORGANIZATION | 제목 `원격검증 일반`. 사업 종료 `2026-08-31`. 공통정보 PATCH는 `409 PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED`. 공통정보는 안 바뀜 |
| `186016` | COMPANY_SCHOOL | 제목 `원격검증 1사1교`. 날짜 `2026-11-22`~`2026-12-23`, mode `period`, 담당자 `1627253` |
| `186017` | GENERAL_ORGANIZATION | 제목 `원격검증 일반 미래`. 3절 GET 값이 저장돼 있음 |

---

## 해야 할 것

### UJAT

- `ck_program_education_structure_detail` 에서 UJAT(`UJAT`, `DGBONG`, `UJAT_DGBONG`)도 `CURRICULUM` + `detailed_program_id IS NULL` 을 허용한다. V172의 1사1교 예외와 같은 조건이다.
- 기존 UJAT을 `SCHEDULE` 로 되돌리지 마라.
- UJAT `CURRICULUM` 저장에 `CURRICULUM_PROGRAM_DETAILED_PROGRAM_REQUIRED` 와 `CONSTRAINT_VIOLATION` 이 나면 안 된다.

### 1사1교

- null `education_structure` 는 갱신 전에 `CURRICULUM` 으로 본다. `COMPANY_SCHOOL_EDUCATION_STRUCTURE_FIXED` 는 요청이 `CURRICULUM` 이 아닌 구조를 넣을 때만 쓴다.
- 1사1교 `CURRICULUM` 은 `detailed_program_id` 없이 저장된다. Java를 V172와 맞춘다.
- `serviceDetailJson.program.generalProgramEducationStructure` 가 `curriculum` / `CURRICULUM` 인 것만으로 1사1교·UJAT에 `CURRICULUM_PROGRAM_DETAILED_PROGRAM_REQUIRED` 를 내지 마라.
- `170001` 처럼 구조가 null인 기존 1사1교를 `CURRICULUM` 으로 백필한다. `detailed_program_id` 는 비운다.

### 일반

- 요청에 `recruitments`, `schedules`, `formBindings` 가 없으면 발행 준비 검사로 수정 전체를 거절하지 마라.
- 그 검사는 생성, 그리고 그 세 키를 **이번 요청에 넣은 수정**에만 둔다.
- `168001`~`168008` 의 모집 운영일이 없다는 이유로 대표명·파트너·KPI·공고 PATCH를 400으로 막지 마라.
- `PROGRAM_*_RECRUITMENT_EDIT_PERIOD_ENDED` 는 요청이 그 모집 유형을 바꿀 때만 쓴다.

### 삭제

- 프로그램 삭제 전에 모집, 일정, 회차, 폼 바인딩, 후원 배정, 상세 테이블을 같은 트랜잭션에서 지우거나 FK `ON DELETE CASCADE` 를 둔다.
- 실패하면 제약 이름이 응답에 보이게 한다.
- `186015`, `186016`, `186017` 만 삭제한다. 시드 `168001`~`168008`, `170001`, `182103` 은 지우지 마라.

---

## 하지 말 것

- 사업 종료일이 오늘보다 이전이면 `409 PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED` 를 유지한다. `186015`(종료 `2026-08-31`), 완료 UJAT `182105` 에서 확인했다.
- `sponsorContactId` 가 숫자가 아니면 `400 INVALID_VALUE` 를 유지한다. `contact-9` 거절은 맞다.
- 1사1교 GET 날짜는 요청 instant의 서울 달력 `yyyy-MM-dd` 다. `2026-11-21T15:00:00.000Z` → `2026-11-22`. 이 변환을 빼지 마라.
- `partnerInvolvement: false` 와 KPI `0` 을 null이나 이전 값으로 덮지 마라.
- 공통정보 PATCH에 모집 행을 넣어서 발행 준비 검사를 통과시키는 우회를 하지 마라.
- 새 path, 새 enum, Gemini 공통정보 API를 만들지 마라.

---

## 검수

각 검수는 PATCH(또는 POST) 직후 GET이다. 프론트 단위 테스트로 대체하지 마라.

```http
POST /api/admin/programs
{
  "programType": "UJAT",
  "title": "UJAT CURRICULUM 검증",
  "educationStructure": "CURRICULUM",
  "businessStartDate": "2026-11-01",
  "businessEndDate": "2027-03-31"
}
```

GET `educationStructure` 는 `CURRICULUM`, `detailedProgramId` 는 null. 검수 후 이 행은 삭제한다.

```http
PATCH /api/admin/programs/170001
{
  "startDate": "2026-11-21T15:00:00.000Z",
  "endDate": "2026-12-22T15:00:00.000Z",
  "businessStartDate": "2026-11-21T15:00:00.000Z",
  "businessEndDate": "2026-12-22T15:00:00.000Z",
  "generalVolunteers": 0,
  "sponsors": [{ "sponsorId": "1627251", "sponsorContactId": "1627253" }]
}
```

200. GET 시작/사업/1회차 `2026-11-22`, 종료 `2026-12-23`, `educationStructure` `CURRICULUM`, `detailedProgramId` null, `generalVolunteers` 0.  
`GET /sponsors` 의 `sponsorContactId` 는 `"1627253"`.  
검수 후 `170001` 날짜·담당자는 패치 전 값으로 되돌린다.

```http
PATCH /api/admin/programs/168007
{
  "mainTitle": "원격검증 대표명",
  "partnerInvolvement": false,
  "totalParticipants": 40
}
```

200. GET `mainTitle` `원격검증 대표명`, `partnerInvolvement` `false`, `totalParticipants` `40`.  
`recruitments[].operationStartDate` 는 패치 전과 같다.  
검수 후 `168007` 의 세 필드는 패치 전 값으로 되돌린다. 모집 행은 바꾸지 마라.

```http
DELETE /api/admin/programs/186015
DELETE /api/admin/programs/186016
DELETE /api/admin/programs/186017
```

각각 200 또는 204. `GET /api/admin/programs/186017` 은 404.

---

## 완료 보고

아래만 답하라.

- UJAT `CURRICULUM` POST의 HTTP 상태와 GET `educationStructure`, `detailedProgramId`
- `170001` PATCH의 HTTP 상태와 GET 날짜·`educationStructure`·`generalVolunteers`·담당자. 원복 여부
- `168007` PATCH의 HTTP 상태와 GET `mainTitle`·`partnerInvolvement`·`totalParticipants`. 모집 `operationStartDate` 가 바뀌지 않았는지. 원복 여부
- `186015` / `186016` / `186017` DELETE 상태와 `186017` GET 상태
- 바꾼 마이그레이션·클래스 이름
