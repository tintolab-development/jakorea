# Cursor prompt — TRAINED_TEACHER 신청 basic-info를 기관 신청 컬럼에 투영 (JABACK)

| 항목 | 값 |
|------|-----|
| **상태** | BE 반영됨. FE는 `JABACK/docs/frontend/trained-teacher-basic-info-column-projection-frontend-handoff-2026-09-28.md` 를 따른다 (2026-09-28) |
| **선행** | `apps/cms/docs/api/trained-teacher-application-basic-info-projection-backend-prompt-2026-09-27.md` |

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약만** 사용하라.

path·`SaveApplicationRequest` required·`preferredScheduleBlocks` maxItems 는 바꾸지 마라.

---

## 증상

Platform에서 교육받은 교사 프로그램 신청의 기본 정보를 모두 넣고 제출하면,  
`form_response_answer`에는 값이 있다. CMS 기관 신청 상세 표는 비어 있다.

로컬 재현 (개인정보 원문은 문서에 넣지 말 것):

| 항목 | 값 |
|------|-----|
| program | `186010` · `TRAINED_TEACHER` · 우리 동네 소비와 저축 |
| organization application | `1691187` · `SUBMITTED` · 2026-09-27 23:55 UTC |
| form_response | `1694334` · `ORGANIZATION_APPLICATION` |

`program_organization_application` 1691187:

- `requested_class_count = 2`, `requested_student_count = 111` (이 두 값만 저장됨)
- `requested_grade` NULL
- `organization_address_detail_snapshot` NULL
- `application_reason_snapshot` NULL
- `other_requests_snapshot` NULL

같은 신청의 `form_response_answer.question_key_snapshot = program-application-trained-teachers-seed-basic-info`:

- `answer_value_jsonb`는 JSON 객체이고 `applicationGrade`/`educationGrade`/`addressDetail`/`applicationReason`/`otherRequests`가 들어 있다
- `answer_display_text`는 JSON이 아니다. Java `Map.toString()` (`{schoolName=..., applicationGrade=2, ...}`)이다

CMS가 보여주는 값:

| 칸 | 화면 | 이유 |
|----|------|------|
| 상세 주소 | 기관 마스터 `organization.address_detail` (예: 본관) | `COALESCE(snapshot, organization.address_detail)`. snapshot이 없어 학교 주소가 나온다. 신청자가 입력한 `addressDetail`이 아니다 |
| 신청 학년 | 빈 칸 | TT 목록 `educationGrade`는 `program_education_setting.target_grade_*`다. 이 프로그램은 대상 학년이 비어 있다. 신청 학년 `requested_grade`는 읽지 않는다 |
| 신청 사유 · 기타 요청사항 | `-` | snapshot 컬럼이 NULL |

관리자 `GET /api/admin/form-responses/{id}`는 이 답을 기본 응답에서 비운다.  
`question_id`가 NULL이라 `pii_category`가 없고, `FormAnswerDisclosurePolicy`가 RESTRICTED로 본다.  
개인정보 상세보기 전에는 `answerValueJson`·`answerDisplayText`가 둘 다 null이다.  
basic-info 객체에는 교사 연락처가 섞여 있으므로, CMS가 form 답 전체를 열어 학년을 채우게 하지 마라.

---

## 이미 된 것 (건드리지 마라)

Platform `POST /api/portal/programs/{programId}/applications` body는 그대로다.

```json
{
  "answers": {
    "program-application-trained-teachers-seed-basic-info": {
      "applicationGrade": "2",
      "educationGrade": "2",
      "addressDetail": "신청자가 입력한 상세 주소",
      "detailAddress": "신청자가 입력한 상세 주소",
      "applicationReason": "신청 사유",
      "otherRequests": "기타 요청",
      "educationFormat": "online",
      "classCount": 2,
      "studentCount": 111
    }
  },
  "requestedClassCount": 2,
  "requestedStudentCount": 111
}
```

`applicationGrade`/`educationGrade`, `addressDetail`/`detailAddress`, `studentCount`/`totalStudents`는 동의어다. 하나만 있어도 된다.

학급 수·학생 수는 `HomepageProgramApplicationStore.updateOrganizationRequestedMetrics`가 이미 저장한다.  
희망 일정은 `preferred_schedule_blocks_jsonb`에 이미 저장된다. 이 둘은 유지하라.

CMS 기관 신청 상세 GET(`OrganizationApplicationQueryService`)은 이미 아래를 읽는다.

- `requested_grade`
- `COALESCE(organization_address_detail_snapshot, organization.address_detail)`
- `application_reason_snapshot`
- `other_requests_snapshot`
- `requested_education_format`

FE는 이 상세의 `requestedGrade`를 신청 학년 칸에 넣고, 숫자만 있으면 `N학년`으로 표시한다.  
FE는 form 답이 내려올 때 `answerValueJson` 객체를 `answerDisplayText`보다 우선한다.  
**컬럼만 채우면 상세 표가 채워진다. DTO 필드명·path를 새로 만들지 마라.**

---

## 해야 할 일

### 1. Portal 제출·임시저장 시 컬럼 투영

`ORGANIZATION` 신청의 draft(`PUT .../applications/draft`)와 submit(`POST .../applications`) 양쪽에서,  
answers 안의 basic-info 객체를 `program_organization_application`에 반영하라.

찾을 키 (먼저 있는 객체):

1. `program-application-trained-teachers-seed-basic-info`
2. `program-application-institution-seed-basic-info`
3. 그 외, 값 객체에 `applicationGrade` 또는 `educationGrade` 또는 `applicationReason`이 있는 항목

| answers 키 | 컬럼 | 제약 |
|------------|------|------|
| `applicationGrade` / `educationGrade` | `requested_grade` | varchar(50). 숫자 `2`는 `"2"`로 저장. FE가 `2학년`으로 표시한다. `학년`을 붙이지 마라 |
| `addressDetail` / `detailAddress` | `organization_address_detail_snapshot` | varchar(255). 기관 마스터 주소로 채우지 마라 |
| `applicationReason` | `application_reason_snapshot` | |
| `otherRequests` | `other_requests_snapshot` | `requested_schedule_memo`와 분리. 일정 메모를 여기 넣지 마라 |
| `educationFormat` | `requested_education_format` | `online`→`ONLINE`, `offline`→`OFFLINE`, `hybrid`→`HYBRID`. 그 외는 NULL로 두고 체크 제약을 깨지 마라 |
| `classCount` / `studentCount` | 기존 metrics UPDATE | 이미 동작. 덮어써 지우지 마라 |

값이 없는 키는 기존 컬럼을 NULL로 지우지 마라 (`COALESCE` 또는 값 있을 때만 SET).

호출 위치: `HomepageProgramApplicationCommandService.syncOrganizationRequestedMetrics`와 같은 draft·submit 경로.  
metrics가 모두 null이어도 basic-info가 있으면 이 투영은 실행하라.

### 2. TT 목록 `educationGrade`

`TrainedTeacherProgramService.queryOrganizationApplications`의 `education_grade`는 지금 프로그램 대상 학년(`program_education_setting`)만 본다.

신청 학년을 우선하라.

```text
COALESCE(NULLIF(btrim(oa.requested_grade), ''), 기존 프로그램 대상 학년 CASE)
```

프로그램 대상 학년 fallback은 유지하라. `requested_grade`가 없을 때만 쓴다.

### 3. 이미 제출된 행 백필

위 로컬 건을 포함해, `response_status = SUBMITTED` 이고 snapshot이 비어 있으며  
basic-info `answer_value_jsonb`에 해당 키가 있는 `ORGANIZATION_APPLICATION`을 같은 규칙으로 UPDATE 하라.

`answer_display_text`는 파싱하지 마라. JSON인 `answer_value_jsonb`만 써라.

관리자가 이미 넣은 snapshot은 덮지 마라.

### 4. 하지 마라

- `SaveApplicationRequest` required, path, maxItems 변경
- basic-info 답 전체를 개인정보 미해제 응답에 실어 보내기 (전화·이메일이 들어 있다)
- `desiredEducationScheduleMemo` → `otherRequests`
- 기관 마스터 `address_detail`을 신청 snapshot의 기본값으로 INSERT

`answer_display_text`를 JSON이나 짧은 라벨로 바꾸는 것은 선택이다. FE는 이미 `answerValueJson`을 우선한다.  
필수 수정은 1~3이다.

---

## 수용 조건

1. 위 shape로 POST한 뒤 `program_organization_application.requested_grade` · `organization_address_detail_snapshot` · `application_reason_snapshot` · `other_requests_snapshot`이 보낸 값이다.
2. 기관 마스터 상세 주소와 신청 `addressDetail`이 다르면, 기관 신청 상세 GET의 `organizationAddressDetail`은 신청 값이다.
3. TT organization-applications GET의 `educationGrade`는 `requested_grade`가 있으면 그 값이다.
4. 기존 1691187도 재제출 없이 1번의 컬럼이 채워진다.
5. 신청 4 path의 required / maxItems diff는 없다.

답변에 개인정보 없는 컬럼 존재 여부(값 원문 대신 NULL 여부·길이)를 붙여라.
