# BE 수정 요청 (2026-09-30) — 단독 문서

**작성일:** 2026-09-30  
**우선순위:** P0  
**문서 성격:** **이 파일만** 보고 구현·검수 가능. 선행 문서·OpenAPI·다른 핸드오프를 열지 않아도 된다.  
**대상 API:** `POST /api/admin/programs` · `PATCH /api/admin/programs/{programId}` · `GET /api/admin/programs/{programId}`  
**대상 유형:** `programType = "UJAT"`  
**비대상:** `GENERAL` / `GENERAL_ORGANIZATION` / `GENERAL_INDIVIDUAL` 의 기존 `recruitments[]` 동작은 그대로 둔다.

---

## 핵심 요구 (한 줄)

UJAT 프로그램 생성·수정에서 `recruitments[]` 를 받아 저장하고, 같은 요청의 `formBindings[].targetType` 과 짝을 맞춘다.  
`STRUCTURED_RECRUITMENTS_GENERAL_ONLY` 로 거절하지 않는다.

---

## 현재 장애

CMS `/programs/ujat` → 프로그램 등록 완료 →

```http
POST /api/admin/programs
Authorization: Bearer <admin JWT>
Content-Type: application/json
```

응답:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "STRUCTURED_RECRUITMENTS_GENERAL_ONLY",
    "message": "구조화된 모집 설정은 일반 프로그램에서만 사용할 수 있습니다."
  }
}
```

프로그램 row는 만들어지지 않는다.  
거절 이유(일반만 허용)가 아래 계약과 다르다.

---

## 해야 할 코드 변경

`programType` 이 `UJAT` 인데 요청 body 에 `recruitments` 가 있으면:

1. `STRUCTURED_RECRUITMENTS_GENERAL_ONLY` 를 **내지 않는다.** (삭제하거나 UJAT에는 적용하지 않는다.)
2. `recruitments[]` 를 일반과 **같은 테이블/엔티티**에 저장한다. 스키마는 아래 「요청 필드」와 같다.
3. 같은 요청의 `formBindings[]` 를 `recruitments[].targetType` 에 붙인다. 매칭 규칙은 아래 「바인딩 매칭」과 같다.
4. 모집 기간(`startAt`/`endAt`)이 사업·운영 시작보다 빨라도 `INVALID_VALUE` 로 거절하지 않는다.
5. `programType=UJAT` 이면 `category` / `educationStructure` 로 1사1교 검사를 돌리지 않는다.

`PATCH` 도 동일하다. `recruitments` 가 온 유형만 갱신하고, 나머지 유형 row 는 유지한다.

---

## 요청 필드 (이 문서가 SSOT)

### create body에서 이 이슈가 보는 필드

| 필드 | 타입 | UJAT create |
|---|---|---|
| `programType` | string | 필수. 값 `"UJAT"` |
| `recruitments` | array | **허용. 아래 2건.** |
| `formBindings` | array | 이미 오고 있음. 5건. 거절하지 말 것 |
| `programDraftId` | number | `formBindings` 가 있으면 필수 |
| `autoApplyDefaultFormBindings` | boolean | `formBindings` 가 있으면 `false` |
| `startDate` / `endDate` | ISO-8601 | 프로그램 운영 기간 |
| `businessStartDate` / `businessEndDate` | ISO-8601 | 사업 기간. create에서 운영 기간과 같음 |
| `applicationStartDate` / `applicationEndDate` | ISO-8601 | **생략 가능.** `recruitments` 가 있으면 레거시보다 `recruitments` 우선 |
| `educationStructure` | string | `"SCHEDULE"` |
| `category` | string | `"school"` (표시용). 유형 추론에 쓰지 말 것 |
| `serviceDetailJson` | **string** (JSON object 아님) | 불투명 저장. 아래 「overlay」 참고 |
| `detailedProgramId` | number | **생략 가능.** UJAT 고정형은 카탈로그 id 없음 |
| `sponsors` | array | `{ sponsorId }` 만 올 수 있음. `sponsorContactId` 생략 = 담당자 미선택 |

### `recruitments[]` 원소

| 필드 | 필수 | 값 |
|---|---|---|
| `recruitmentType` | 예 | `"PARTICIPANT"` 또는 `"VOLUNTEER"` |
| `targetType` | 예 | `"ORGANIZATION"` 또는 `"COLLEGE_STUDENT"` |
| `status` | 아니오 | `"ACTIVE"` |
| `startAt` | 아니오 | 모집 시작 ISO-8601 |
| `endAt` | 아니오 | 모집 종료 ISO-8601 |
| `operationStartDate` | 아니오 | 해당 유형 운영 시작. 없으면 create 시 `businessStartDate` fallback |
| `operationEndDate` | 아니오 | 해당 유형 운영 종료. 없으면 create 시 `businessEndDate` fallback |
| `selectionMethod` | 아니오 | `"ADMIN_REVIEW"` |
| `maxCount` | 아니오 | 양수만 저장. `0`·생략 = 제한 없음 |
| `minCount` | 아니오 | 생략 가능 |

### `formBindings[]` 원소 (이미 오는 값. 이 이슈에서 깨면 안 됨)

| 필드 | 값 |
|---|---|
| `formType` | `"REGISTRATION"` / `"RECRUITMENT"` / `"APPLICATION"` |
| `templateId` | number. draft-owned copy |
| `templateVersionId` | number. 등록 중 publish된 version |
| `active` | `true` |
| `required` | `false` (true 로 강제하지 말 것) |
| `targetRole` | `"ORGANIZATION"` 또는 `"VOLUNTEER"`. REGISTRATION 은 생략 |
| `targetType` | `"ORGANIZATION"` 또는 `"COLLEGE_STUDENT"`. REGISTRATION 은 생략 |

공용 카탈로그 version id 를 최종 binding 하면 안 된다. 요청에 온 `templateId` / `templateVersionId` 를 그대로 bind 한다.

---

## UJAT가 보내는 정확한 2건

항상 이 두 row. 더 늘리거나 줄이지 말 것.

| # | recruitmentType | targetType | startAt / endAt | operationStartDate / operationEndDate |
|---|---|---|---|---|
| 1 | `PARTICIPANT` | `ORGANIZATION` | 참여 기관 모집 기간 | `startDate` / `endDate` |
| 2 | `VOLUNTEER` | `COLLEGE_STUDENT` | 봉사자 모집 기간 | 같은 운영 기간 |

상반기·하반기 봉사자 양식은 **템플릿 1개**다. `VOLUNTEER` row 를 2개로 쪼개지 말 것.  
반기별 제목·면접 슬롯은 `serviceDetailJson` overlay 키로만 간다.

---

## 바인딩 매칭 (이 문서가 SSOT)

같은 create/patch 요청 안에서:

| `formBindings` | 붙일 `recruitments` row |
|---|---|
| `formType=RECRUITMENT` 또는 `APPLICATION`, `targetType=ORGANIZATION` (또는 `targetRole=ORGANIZATION`) | `recruitmentType=PARTICIPANT` + `targetType=ORGANIZATION` |
| `formType=RECRUITMENT` 또는 `APPLICATION`, `targetType=COLLEGE_STUDENT` 또는 `targetRole=VOLUNTEER` | `recruitmentType=VOLUNTEER` + `targetType=COLLEGE_STUDENT` |
| `formType=REGISTRATION` | 모집 row 불필요. 프로그램 단위 bind |

`targetRole=VOLUNTEER` 와 `targetType=COLLEGE_STUDENT` 는 **같은 대상**이다.  
`targetRole` 만 있고 `targetType` 이 없어도 VOLUNTEER row 에 붙인다.  
매칭할 row 가 없다고 APPLICATION/RECRUITMENT binding 을 거절하지 말 것 — 그 전에 `recruitments` 2건을 저장하면 된다.

UJAT 기대 binding 5건 (시드 code 는 시작점. 최종은 요청의 copy/version):

| formType | targetRole | targetType | 시작 templateCode |
|---|---|---|---|
| `REGISTRATION` | (없음) | (없음) | `registration-ujat` |
| `RECRUITMENT` | `ORGANIZATION` | `ORGANIZATION` | `recruitment-ujat-school` |
| `RECRUITMENT` | `VOLUNTEER` | `COLLEGE_STUDENT` | `recruitment-ujat-volunteer` |
| `APPLICATION` | `ORGANIZATION` | `ORGANIZATION` | `application-ujat-school` |
| `APPLICATION` | `VOLUNTEER` | `COLLEGE_STUDENT` | `application-ujat-volunteer` |

일반 시드(`registration-general` 등)와 섞지 말 것.

---

## 기간 규칙 (이 문서가 SSOT)

UJAT 모집은 교육·사업이 시작되기 **전에** 연다.

| 비교 | 허용? |
|---|---|
| `recruitments[].startAt` < `businessStartDate` | **허용** |
| `recruitments[].endAt` < `businessStartDate` | **허용** (모집 전체가 사업 시작 전일 수 있음) |
| `recruitments[].startAt` < `operationStartDate` | **허용** |
| `operationStartDate` / `operationEndDate` 가 사업 기간과 같거나 그 안 | 허용 |
| `applicationStartDate` / `applicationEndDate` 없음 | **허용** (`recruitments` 가 있으면) |
| `applicationStartDate` 가 있어도 `recruitments` 가 있으면 | `recruitments` 우선 |

다음으로 거절하지 말 것:

- `INVALID_VALUE` (모집이 사업보다 앞섬)
- 모집이 사업 기간 안에 있어야 한다는 검사 (`APPLICATION_PERIOD_*` 등)
- `startAt` 없음 → 거절 (기간 없이 row 만 저장하면 됨)

---

## 유형 추론 (이 문서가 SSOT)

요청에 `programType: "UJAT"` 가 있으면 그것이 유형이다.

| 하지 말 것 | 이유 |
|---|---|
| `category: "school"` → `COMPANY_SCHOOL` | UJAT FE 가 표시용으로 `school` 을 보낸다 |
| `educationStructure: "SCHEDULE"` → `COMPANY_SCHOOL_EDUCATION_STRUCTURE_FIXED` | 1사1교만 CURRICULUM 고정. UJAT 는 SCHEDULE |
| `detailedProgramId` 없음 → `CURRICULUM_PROGRAM_DETAILED_PROGRAM_REQUIRED` | UJAT 고정형은 카탈로그 id 가 없다 |

---

## overlay / serviceDetailJson (이 문서가 SSOT)

`serviceDetailJson` 은 **JSON 문자열**이다. parse 해서 다시 stringify 할 때 키를 버리지 말 것.

`registration.overlay` 는 키/값 map 이다. 컬럼으로 coerce 하지 말 것.

| overlay 키 | 오면 | 하면 안 되는 것 |
|---|---|---|
| `ujat.basicInfo.sponsorContactId` | 없거나 `""` | Long 파싱 → `INVALID_VALUE` |
| `ujat.basicInfo.sponsorContactIds` | `[]` | 담당자 미선택 |
| `ujat.basicInfo.detailedProgramId` | `"__ujat_volunteer_core__"` | Long 파싱 |
| `ujat.recruit.volunteer.h1.*` / `h2.*` | 반기별 모집 문구·기간 | 공유 키로 합치기 |
| `recruitVolunteer.h1.detailInfo.*` / `h2.detailInfo.*` | 반기별 상세 | 한쪽만 저장 |

담당자 미선택은 top-level `sponsors: [{ "sponsorId": "<id>" }]` (contact 필드 없음) 가 정상이다.

---

## 재현 payload (최소)

아래 JSON 으로 `POST /api/admin/programs` 하면 **201/200** 이어야 한다.  
(실제 등록은 `serviceDetailJson`·`title` 등이 더 붙는다. 아래만으로도 `recruitments` 게이트는 통과해야 한다.)

```json
{
  "programType": "UJAT",
  "title": "우리 동네 소비와 저축 운영",
  "mainTitle": "우리 동네 소비와 저축",
  "type": "offline",
  "format": "course",
  "category": "school",
  "educationStructure": "SCHEDULE",
  "startDate": "2026-10-08T15:00:00.000Z",
  "endDate": "2026-11-02T14:59:59.999Z",
  "businessStartDate": "2026-10-08T15:00:00.000Z",
  "businessEndDate": "2026-11-02T14:59:59.999Z",
  "sponsorId": "163368",
  "sponsors": [{ "sponsorId": "163368" }],
  "autoApplyDefaultFormBindings": false,
  "programDraftId": 10,
  "formBindings": [
    { "formType": "REGISTRATION", "templateId": 479, "templateVersionId": 217, "active": true, "required": false },
    { "formType": "RECRUITMENT", "templateId": 486, "templateVersionId": 218, "active": true, "required": false, "targetRole": "ORGANIZATION", "targetType": "ORGANIZATION" },
    { "formType": "RECRUITMENT", "templateId": 493, "templateVersionId": 219, "active": true, "required": false, "targetRole": "VOLUNTEER", "targetType": "COLLEGE_STUDENT" },
    { "formType": "APPLICATION", "templateId": 500, "templateVersionId": 220, "active": true, "required": false, "targetRole": "ORGANIZATION", "targetType": "ORGANIZATION" },
    { "formType": "APPLICATION", "templateId": 507, "templateVersionId": 221, "active": true, "required": false, "targetRole": "VOLUNTEER", "targetType": "COLLEGE_STUDENT" }
  ],
  "recruitments": [
    {
      "recruitmentType": "PARTICIPANT",
      "targetType": "ORGANIZATION",
      "status": "ACTIVE",
      "startAt": "2026-10-03T15:00:00.000Z",
      "endAt": "2026-10-07T15:00:00.000Z",
      "operationStartDate": "2026-10-08T15:00:00.000Z",
      "operationEndDate": "2026-11-02T14:59:59.999Z",
      "selectionMethod": "ADMIN_REVIEW"
    },
    {
      "recruitmentType": "VOLUNTEER",
      "targetType": "COLLEGE_STUDENT",
      "status": "ACTIVE",
      "startAt": "2026-10-03T15:00:00.000Z",
      "endAt": "2026-10-07T15:00:00.000Z",
      "operationStartDate": "2026-10-08T15:00:00.000Z",
      "operationEndDate": "2026-11-02T14:59:59.999Z",
      "selectionMethod": "ADMIN_REVIEW"
    }
  ],
  "serviceDetailJson": "{\"version\":1,\"program\":{},\"registration\":{\"overlay\":{}}}"
}
```

`templateId` / `templateVersionId` / `programDraftId` 는 환경마다 숫자가 다르다.  
검수 시 해당 환경의 draft-owned copy id 를 쓰면 된다. 게이트 검사는 id 값과 무관하다.

---

## 성공 응답에서 확인할 것

`GET /api/admin/programs/{id}` (또는 create 응답 body)

```json
{
  "programType": "UJAT",
  "educationStructure": "SCHEDULE",
  "recruitments": [
    {
      "recruitmentType": "PARTICIPANT",
      "targetType": "ORGANIZATION",
      "status": "ACTIVE",
      "startAt": "2026-10-03T15:00:00.000Z",
      "endAt": "2026-10-07T15:00:00.000Z",
      "operationStartDate": "2026-10-08T15:00:00.000Z",
      "operationEndDate": "2026-11-02T14:59:59.999Z"
    },
    {
      "recruitmentType": "VOLUNTEER",
      "targetType": "COLLEGE_STUDENT",
      "status": "ACTIVE",
      "startAt": "2026-10-03T15:00:00.000Z",
      "endAt": "2026-10-07T15:00:00.000Z",
      "operationStartDate": "2026-10-08T15:00:00.000Z",
      "operationEndDate": "2026-11-02T14:59:59.999Z"
    }
  ]
}
```

`GET /api/admin/programs/{id}/form-bindings` (경로가 다르면 기존 programs form-bindings 조회)

- 요청한 5건의 `templateVersionId` 가 그대로 있다.
- ORGANIZATION APPLICATION/RECRUITMENT 는 PARTICIPANT row 에, VOLUNTEER/COLLEGE_STUDENT 는 VOLUNTEER row 에 연결된다.

create 실패 시 프로그램 row · 고아 template · binding 이 남으면 안 된다.

---

## PATCH

```http
PATCH /api/admin/programs/{programId}
```

`recruitments` 가 있으면 UJAT 에서도 저장한다. `STRUCTURED_RECRUITMENTS_GENERAL_ONLY` 금지.

잠금 (요청이 **그 유형의 기간을 바꿀 때만**):

- 해당 row 의 `operationStartDate` 당일(Asia/Seoul)이 지났으면 그 유형의 운영 기간 수정 거절
- 해당 row 의 `startAt` 이 지났으면 그 유형의 모집 기간·해당 유형 formBindings 수정 거절
- `operationStartDate` 가 없으면 운영 잠금하지 말 것. `startAt` 으로 대체하지 말 것
- 요청에 `recruitments` 가 없으면 모집 잠금 검사로 전체 PATCH 를 거절하지 말 것

---

## 하면 안 되는 것

| 하지 말 것 | 대신 |
|---|---|
| `programType != GENERAL*` 이면 `recruitments` 400 | `UJAT` 도 저장 |
| `startAt` < `businessStartDate` → `INVALID_VALUE` | 저장 |
| `category=school` + `SCHEDULE` → 1사1교 고정 오류 | `programType` 만 본다 |
| 봉사 `recruitments` 2건(상/하) 강제 | `VOLUNTEER` 1건 |
| overlay 빈 문자열 contact / sentinel id 를 Long 파싱 | 불투명 저장 |
| `autoApplyDefaultFormBindings: true` 로 공용 시드 덮어쓰기 | 요청 `formBindings` version 유지 |
| create 실패 후 프로그램만 남김 | 트랜잭션 롤백 |

---

## 수락 기준

1. 위 재현 payload 로 `POST /api/admin/programs` → **201/200**. code `STRUCTURED_RECRUITMENTS_GENERAL_ONLY` 없음.
2. GET detail `recruitments` 길이 2. `PARTICIPANT`+`ORGANIZATION`, `VOLUNTEER`+`COLLEGE_STUDENT`. `startAt` 이 `businessStartDate` 보다 이전.
3. GET form-bindings 5건. 요청 `templateVersionId` 유지. 기관 바인딩↔PARTICIPANT, 봉사 바인딩↔VOLUNTEER.
4. `category=school` + `educationStructure=SCHEDULE` + `programType=UJAT` 가 `COMPANY_SCHOOL_EDUCATION_STRUCTURE_FIXED` 가 아님.
5. `applicationStartDate` 없이 `recruitments` 만 있어도 생성된다.
6. 일반 프로그램 create 에 `recruitments` 를 보내는 기존 경로 **회귀 없음**.

---

## BE 이슈/PR 본문 (이 섹션만 복사해도 구현 가능)

### 요청

`POST /api/admin/programs` (`programType=UJAT`) 와 `PATCH /api/admin/programs/{id}` 에서 `recruitments[]` 를 받아라.

지금 400:

- code: `STRUCTURED_RECRUITMENTS_GENERAL_ONLY`
- message: `구조화된 모집 설정은 일반 프로그램에서만 사용할 수 있습니다.`

이 코드를 UJAT 에 적용하지 마라.

### 저장할 2건

```
PARTICIPANT + ORGANIZATION   // 기관 모집
VOLUNTEER   + COLLEGE_STUDENT // 봉사자 모집 (상·하반기 합쳐 1건)
```

필드: `recruitmentType`, `targetType`, `status=ACTIVE`, `startAt`, `endAt`, `operationStartDate`, `operationEndDate`, `selectionMethod=ADMIN_REVIEW`.

같은 요청의 `formBindings`:

- ORGANIZATION → PARTICIPANT row
- VOLUNTEER 또는 COLLEGE_STUDENT → VOLUNTEER row
- REGISTRATION 은 프로그램 단위

### 기간

`startAt` / `endAt` 이 `businessStartDate` / `operationStartDate` 보다 빨라도 된다.  
`applicationStartDate` 는 없어도 된다. `recruitments` 가 있으면 그걸 쓴다.

### 유형

`programType=UJAT` 가 있으면 `category=school`, `educationStructure=SCHEDULE` 로 1사1교 검사를 하지 마라.  
`detailedProgramId` 없어도 된다.

### overlay

`serviceDetailJson` 은 문자열. overlay 값을 Long 으로 파싱하지 마라.  
`sponsors: [{ sponsorId }]` 만 있으면 담당자 미선택이다.

### 수락

- 위 payload 201/200
- GET `recruitments` 2건, 모집이 사업보다 앞섬
- form-bindings 5건이 각 row 에 붙음
- GENERAL 회귀 없음
- 실패 시 롤백
