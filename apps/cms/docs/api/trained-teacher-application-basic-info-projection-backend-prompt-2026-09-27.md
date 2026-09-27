# Cursor prompt — TRAINED_TEACHER 신청 basic-info CMS↔Portal 필드 투영 (JABACK)

| 항목 | 값 |
|------|-----|
| **상태** | ✅ BE 수용 · FE 어댑터 반영 (2026-09-27) |
| **BE handoff** | `JABACK/docs/frontend/trained-teacher-basic-info-projection-frontend-handoff-2026-09-27.md` |

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 계약만** 사용하라.

프론트 문서:

`apps/cms/docs/api/trained-teacher-application-basic-info-projection-backend-prompt-2026-09-27.md`

관련: `apps/platform/docs/api/participation-trained-teachers-apply-backend-cursor-prompt-2026-09-27.md`

---

## Goal

Platform이 CMS 교육받은 교사 신청 양식과 **동일한 basic-info 필드**를  
`answers["program-application-trained-teachers-seed-basic-info"]` 객체로 제출한다.  
BE는 이를 form_response에 저장하고, TT 기관 신청 DTO에 **투영**해 CMS 상세 `-` 빈칸을 없앤다.

path·`SaveApplicationRequest` required 는 바꾸지 마라.

---

## Platform이 보내는 answers shape (이미 FE 반영)

`POST /api/portal/programs/{programId}/applications`

```json
{
  "recruitmentId": 1,
  "applicationType": "ORGANIZATION",
  "formBindingId": 1,
  "answers": {
    "program-application-trained-teachers-seed-personal-info": { "bottomConsent": "agree" },
    "program-application-trained-teachers-seed-third-party": { "bottomConsent": "agree" },
    "program-application-trained-teachers-seed-basic-info": {
      "schoolName": "JA서이초등학교",
      "applicationGrade": "3",
      "educationGrade": "3",
      "addressDetail": "송파구 ○○로 12",
      "detailAddress": "송파구 ○○로 12",
      "classCount": 1,
      "studentCount": 11,
      "totalStudents": 11,
      "educationFormat": "online",
      "educationPlace": "inside",
      "educationPlaceDetail": "3층 시청각실",
      "teacherName": "이진희",
      "teacherTel": "02-1234-5678",
      "teacherMobile": "010-1234-5678",
      "teacherEmail": "teacher@example.com",
      "applicationReason": "진로 교육 강화",
      "otherRequests": "주차 가능 여부 문의"
    },
    "program-application-trained-teachers-seed-preferred-schedule": []
  },
  "preferredScheduleBlocks": [],
  "requestedClassCount": 1,
  "requestedStudentCount": 11
}
```

`applicationGrade`/`educationGrade`, `addressDetail`/`detailAddress`, `studentCount`/`totalStudents` 는 **동의어 쌍**이다. 하나만 와도 된다.

---

## BE 요구

### 1. form_response 저장

- paragraph id `program-application-trained-teachers-seed-basic-info` 의 객체 answers를  
  **거절하지 말고** 저장한다 (WRITING APPLICATION 스냅샷 비어 있어도 paragraph id 허용 — 기존 TT 계약과 동일).
- `questionKeySnapshot` 은 paragraph id 또는 하위 필드 키 모두 허용.  
  CMS FE는 paragraph JSON 통째와 flat key 모두 읽는다.

### 2. TT organization-application DTO 투영

`GET …/trained-teacher/organization-applications` 및 `/{id}` 에 반영:

| answers 키 | DTO 필드 (없으면 추가) |
|------------|------------------------|
| `applicationGrade` / `educationGrade` | `educationGrade` |
| `addressDetail` / `detailAddress` | `addressDetail` (신규 허용) |
| `applicationReason` | `applicationReason` (신규 허용) |
| `otherRequests` | `otherRequests` (신규 허용) — **일정 memo와 분리** |
| `classCount` | `classCount` / `requestedClassCount` |
| `studentCount` / `totalStudents` | `studentCount` / `requestedStudentCount` |
| `desiredEducationScheduleMemo` | 일정 메모 전용. otherRequests로 넣지 마라 |

OpenAPI에 `addressDetail` · `applicationReason` · `otherRequests` 가 없으면 **additive**로 추가하라. path·required 변경 금지.

### 3. form_response context

제출 성공 시 `ORGANIZATION_APPLICATION` + `contextId=applicationId` 로 form_response가 연결되어  
CMS `GET /api/admin/form-responses?contextType=&contextId=` 로 최신 answers를 읽을 수 있어야 한다.

---

## 수용 조건

1. 위 shape POST 후 TT org-application GET에 `educationGrade` · `addressDetail` · `applicationReason` · `otherRequests` 가 비어 있지 않다 (보낸 값 기준).
2. `desiredEducationScheduleMemo` 만 있는 레거시 건은 otherRequests를 memo로 덮지 않는다.
3. CMS `/programs/trained-teachers` 기관 신청 상세 「신청 사유·기타 요청·신청 학년·상세 주소」가 `-`가 아니다.
4. 신청 4 path required / maxItems 불변.

답변에 개인정보 없는 sample GET 1건(필드명·값 존재 여부)을 붙여라.

## FE 반영 (2026-09-27)

- Platform: basic-info answers shape 제출 (`apply-trained-teachers-basic-info`)
- CMS: `mapTrainedTeacherOrganizationApplicationToRow`가 DTO `addressDetail`·`applicationReason`·`otherRequests`·`educationGrade` 매핑. memo→otherRequests 금지.
- form_response nested hydrate는 보조로 유지.

**Last updated:** 2026-09-27
