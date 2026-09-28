# Cursor prompt — Platform 교육받은 교사 신청 연동 잔여 계약 (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 계약만** 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(enum·NOT NULL·권한)만 하라.

이 문서는 프론트 레포 경로:

`apps/platform/docs/api/participation-trained-teachers-apply-backend-cursor-prompt-2026-09-27.md`

확인 기준: 로컬 `GET http://localhost:8080/v3/api-docs` 와 회원 Bearer 호출.

Platform FE는 이미 아래를 호출한다. path를 새로 만들지 마라.

| Method | Path | 역할 |
|--------|------|------|
| GET | `/api/portal/programs/{programId}/application-options` | 회원 Bearer. `recruitmentId`, `applicationType`, `formBindingId`, `canApply`, `blockedReason` |
| GET | `/api/portal/programs/{programId}/form-bindings/{bindingId}` | query `recruitmentId`, `applicationType`. `form.paragraphs` 작성 양식 |
| PUT | `/api/portal/programs/{programId}/applications/draft` | `SaveApplicationRequest` |
| POST | `/api/portal/programs/{programId}/applications` | `SaveApplicationRequest` → `ApplicationSaveResponse` |

`ApplicationFormResponse.form` 을 `schemaJson` 문자열 래퍼가 아닌 **작성 양식 문서 객체**로 내리는 작업은 이미 반영되어 있어야 한다.  
없으면 먼저 `apps/platform/docs/api/participation-apply-form-document-backend-cursor-prompt-2026-09-25.md` 를 완료하라.

---

## Goal

`program_type = TRAINED_TEACHER` 프로그램에서 Platform 「프로그램 신청하기」가 CMS에 묶인 `application-trained-teachers` 발행 양식을 읽고, 제출할 수 있게 하라.

대상 공개 제목 예: **중학생 진로·직업 탐색 프로그램 모집** (CMS 교육받은 교사 등록 공개 제목).  
실제 `programId` 는 로컬 DB의 해당 TRAINED_TEACHER 프로그램 id 를 써라.

---

## Out of scope / 금지

- Platform·CMS 프론트 수정.
- 신청 path 네 개의 path·required 변경.
- `SaveApplicationRequest` required (`recruitmentId`, `applicationType`, `formBindingId`) 변경.
- `preferredScheduleBlocks` maxItems 10, `requestedSchedules` maxItems 변경.
- `answers` 키 추출 순서 변경. 순서는 `questionKey`, `fieldKey`, `key`, `name`, `id` 다.
- TRUNCATE. prod Flyway에 운영 카피를 넣지 마라.
- 강사(`application-instructor`) 양식을 TRAINED_TEACHER 기본 바인딩으로 바꾸지 마라.

---

## 1. application-options — TRAINED_TEACHER

`GET /api/portal/programs/{programId}/application-options` (회원 Bearer) 응답에 다음이 있어야 한다.

1. `applicationType` 이 `ORGANIZATION` 인 행이 있다. (모집 `target_type` 이 `TEACHER` / `ORGANIZATION` / `SCHOOL` 이면 ORGANIZATION 신청)
2. 그 행의 `formBindingId` 가 null 이 아니다.
3. 그 바인딩의 템플릿 코드가 `application-trained-teachers` 이다. (응답에 templateCode 필드가 없으면 DB `form_template.code` 로 검증하고 답변에 적어라)
4. 발행(`PUBLISHED`) APPLICATION 바인딩이 있고 모집 기간이 열려 있으면 `canApply: true` 이거나, 막힌 이유가 **양식 미구성이 아닌** 회원 자격(`ORGANIZATION_MEMBERSHIP_REQUIRED` 등)이다.
5. 발행 바인딩이 있는데 `blockedReason: APPLICATION_FORM_NOT_CONFIGURED` 이면 버그다. 고쳐라.

바인딩 조인 시 `program_form_binding.target_type` 은 신청 타입 `ORGANIZATION` 과 맞아야 한다.  
`target_role = TEACHER` 만 있고 `target_type` 이 `TEACHER` 로 들어가 ORGANIZATION 옵션에 안 붙는 경우가 있으면, TRAINED_TEACHER 기본/동기화 바인딩의 `target_type` 을 `ORGANIZATION` 으로 맞추거나 options 조인을 고쳐라. path·필드명은 바꾸지 마라.

---

## 2. form-bindings — CMS에서 수정한 발행본

`GET .../form-bindings/{bindingId}?recruitmentId=&applicationType=ORGANIZATION`

1. `form` 은 객체이고 `form.paragraphs` 는 배열이다. `form.schemaJson` 문자열은 없다.
2. 문단 id 는 CMS 시드/프로그램 전용 버전에 저장된 id 그대로다. 최소로 아래 id 가 있거나, CMS가 프로그램 전용으로 바꾼 id 가 그대로 내려온다.

   - `program-application-trained-teachers-seed-personal-info`
   - `program-application-trained-teachers-seed-third-party`
   - `program-application-trained-teachers-seed-basic-info`
   - `program-application-trained-teachers-seed-preferred-schedule`

3. CMS 관리자가 프로그램 신청정보를 수정·재발행·리바인드한 뒤에도, options 의 `formBindingId` → 그 발행 `template_version_id` 의 `schema_jsonb` 가 내려온다. 카탈로그 구버전을 붙이지 마라.
4. 임시저장이 없으면 `draftAnswers` 는 `{}` 다. `null` 로 바꾸지 마라.

---

## 3. 제출 answers / preferredScheduleBlocks

`POST /api/portal/programs/{programId}/applications` body:

```json
{
  "recruitmentId": 1,
  "applicationType": "ORGANIZATION",
  "formBindingId": 1,
  "answers": {
    "program-application-trained-teachers-seed-personal-info": { "bottomConsent": "agree" },
    "program-application-trained-teachers-seed-third-party": { "bottomConsent": "agree" }
  },
  "preferredScheduleBlocks": [
    {
      "preferenceRank": 1,
      "date": "2026-05-12",
      "sessionCount": 1,
      "sessionTimes": [
        {
          "sessionIndex": 1,
          "classPeriod": "3",
          "startTime": "10:00",
          "endTime": "10:45"
        }
      ]
    }
  ]
}
```

규칙:

1. `answers` 키는 문단 id(또는 위 키 추출 순서)다. WRITING APPLICATION 에서 `form_question` 스냅샷이 비어 있으면, **문단 id 답을 unknown key 로 거절하지 마라.** 스냅샷을 publish 때 채우거나, 스냅샷이 비었을 때 schemaJson.paragraphs id 를 허용 키로 인정하라.
2. `preferredScheduleBlocks` 는 TRAINED_TEACHER + ORGANIZATION 에서 ledger(`preferred_schedule_blocks_jsonb`)에 투영한다. 이미 있으면 유지하라.
3. answers 에만 `program-application-trained-teachers-seed-preferred-schedule` 배열을 넣어도 투영되는 기존 동작은 깨지 마라. Platform 은 전용 필드를 보낸다.
4. 필수 동의 문단이 `answerRequired`/`requiredMark` 인데 동의 값이 없으면 submit 만 거절한다. draft(`PUT`)는 부분 답을 허용한다.

---

## 완료 조건

1. 회원 토큰으로 TRAINED_TEACHER `programId` 의 `application-options` 에 ORGANIZATION + non-null `formBindingId` 가 있다. 양식이 발행돼 있으면 `APPLICATION_FORM_NOT_CONFIGURED` 가 아니다.
2. 같은 바인딩으로 `form-bindings` 를 호출하면 `form.paragraphs` 배열이 있고, 교육받은 교사 신청 문단 id(또는 CMS가 저장한 동일 구조)가 보인다. `schemaJson` 문자열 래퍼는 없다.
3. 위 예시 shape 의 `POST .../applications` 가 4xx 로 “Unknown form answer keys” 만으로 실패하지 않는다. (회원 자격·모집 기간·필수값 부족은 별개)
4. 신청 네 path 의 required 와 maxItems 는 diff 에 바뀌지 않는다.
5. 답변에 개인정보 없는 `application-options` 1건과 `form.paragraphs[].id` 목록, submit 결과(성공 또는 거절 코드)를 붙인다.
