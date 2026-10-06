# Cursor prompt — 개인 신청 「면접 진행 가능 일정」 필수 검증으로 제출 실패 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 재현·요청에만** 답하라.

이 문서는 프론트 레포 경로:

`apps/platform/docs/api/individual-application-interview-schedule-required-backend-cursor-prompt-2026-10-06.md`

관련 코드:

- `src/main/java/com/jakorea/cms/form/service/ProgramFormRuntimeContextService.java` (`resolvePolicy`)
- `src/main/java/com/jakorea/cms/form/service/FormAnswerValidator.java` (`validateAnswers`)
- `src/main/java/com/jakorea/cms/homepage/application/service/IndividualApplicationInterviewAvailabilityService.java`
- `src/main/resources/local-demo/form-templates/application-participant-individual.json`
- 도입 커밋: `d4e020d1 feat(applicationflow): 개인 신청 시점 운영 스냅샷을 저장한다` (2026-09-16)

---

## 증상

Platform 일반 프로그램 개인 신청(프로그램 **186046**, 모집 **186109**, binding **187055**)에서 화면의 필수 항목을 모두 채워 제출해도 400이 난다.

`POST /api/portal/programs/186046/applications`

```json
{
  "recruitmentId": 186109,
  "applicationType": "INDIVIDUAL",
  "formBindingId": 187055,
  "answers": {
    "program-participant-application-seed-personal-info": { "bottomConsent": "agree" },
    "program-participant-application-seed-third-party": { "bottomConsent": "agree" },
    "program-participant-application-seed-self-intro": "123123",
    "program-participant-application-seed-schedule": ["line:0", "line:1", "line:2", "line:3", "line:4"]
  }
}
```

```json
{
  "success": false,
  "message": "필수 입력값 또는 필수 항목을 확인해 주세요.",
  "error": { "code": "VALIDATION_FAILED", "field": null, "traceId": "393e044e4b4b46be91b4d9d6d7b3ed87" }
}
```

---

## FE가 확인한 사실 (로컬 DB, 2026-10-06 23:17 KST)

binding 187055 → `template_version_id = 319`. `form_question` 필수 문항:

| question_key | type | required_yn |
|---|---|---|
| `program-participant-application-seed-personal-info` | HORIZONTAL_TABLE | t |
| `program-participant-application-seed-third-party` | HORIZONTAL_TABLE | t |
| `program-participant-application-seed-self-intro` | SHORT_ESSAY | t |
| `program-participant-application-seed-team-info` | HORIZONTAL_TABLE | t |
| `program-participant-application-seed-interview-schedule` | HORIZONTAL_TABLE | t |
| `program-participant-application-seed-schedule` | MULTIPLE_CHOICE | t |

프로그램 186046 런타임 설정:

| 항목 | 값 |
|---|---|
| `general_program_runtime_setting.participation_method` | `INDIVIDUAL` |
| `education_schedule_mode` / `session_round_type` | `FIXED_DATE` / `MULTI` |
| `general_program_detail.config_jsonb.businessArea` | `진로취업` |
| `program_interview_slot` (program_id=186046) | **0건** |
| `interviewEnabled` | 없음 |

판정:

- `team-info`: `resolvePolicy`가 `participation_method=INDIVIDUAL`이라 `hidden`에 넣음 → 문제 아님.
- `interview-schedule`: 개인 신청(`ApplicationFlavor.INDIVIDUAL`)에서 **숨김·optional 처리 경로가 없음**. 그래서 `FormAnswerValidator`가 `Required form answer is missing: program-participant-application-seed-interview-schedule`을 던지고, `ClientErrorMessageResolver`의 `GENERIC_REQUIRED_PATTERN`이 이를 일반 문구로 바꾼다. **이것이 제출 실패 원인이다.**
- `line:N` 일정 값은 `ProgramEducationScheduleLines` 계약대로라 문제 아님.

FE 사정: `@jakorea/form-schema` 개인 신청 seed(양식 SSOT)에는 면접 단락이 없다. FE는 원격 schema에 「면접 진행 가능 일정」 단락이 오면 제거하고(`migrateProgramParticipantApplicationParagraphs`) 답도 보내지 않는다. 면접이 없는 프로그램에서 신청자가 채울 수 있는 값도 없다.

---

## 요청

1. **면접이 없는 프로그램이면 개인 신청 면접 문항을 숨겨라.**  
   `resolvePolicy`(또는 개인 신청 audience 정책)에서 `INDIVIDUAL` flavor이고 프로그램 면접이 꺼져 있거나(`interviewEnabled` false/null) 면접 슬롯이 0건이면, `program-participant-application-seed-interview-schedule`(및 `IndividualApplicationInterviewAvailabilityService.INTERVIEW_KEYS`의 개인 면접 키)를 `hiddenQuestionKeys`에 넣어라.  
   - GET form-binding 응답: 해당 단락 `runtimeHidden: true` + `runtimeContext.hiddenQuestionKeys`에 키 포함.
   - 제출 검증: 필수에서 제외. 키가 오면 기존 규칙대로 `Hidden runtime form question cannot be submitted`.
2. **면접이 있는 프로그램의 개인 면접 계약을 명시하라.** 봉사자처럼 `dynamic_interview_slots` 옵션(`interview-slot:{id}`)으로 내려줄지, 선택지 형식·필수 여부·빈 슬롯일 때 동작(`runtimeResolved` / `options: []`)을 FE handoff 문서로 정리하라. FE는 이 계약이 정해지면 면접이 있을 때만 단락을 노출하도록 맞춘다.
3. **로컬 템플릿 정합성 확인.** `application-participant-individual.json`에 면접 단락을 `requiredMark/answerRequired: true`로 둔 것이 의도인지 보고하라. 의도가 아니면 FE SSOT와 맞춰 제거하거나 optional로 바꾸는 안을 제안하라.
4. (선택) `Required form answer is missing: {key}` 예외는 `error.field`에 `{key}`를 채워 내려주면 FE가 원인 문항을 바로 안내할 수 있다. 가능 여부만 보고하라.

---

## 보고 형식

1. 수정한 파일·정책 요약 (요청 1).
2. 재현 결과: 위 payload로 `POST /api/portal/programs/186046/applications` → **201/200** 확인. 응답 원문 첨부.
3. GET `/api/portal/programs/186046/form-bindings/187055?recruitmentId=186109&applicationType=INDIVIDUAL` 응답에서 면접 단락의 `runtimeHidden`과 `runtimeContext.hiddenQuestionKeys` 원문.
4. 요청 2의 FE handoff 문서 경로 (`JABACK/docs/frontend/...`).
5. 요청 3·4 결론.

## FE 기대 (변경 금지 계약)

- 다른 문항의 답 형식은 그대로다: 동의 표는 `{ "bottomConsent": "agree" | "disagree" }`, 서술형은 문자열, 희망 교육 일정은 `line:N` 배열.
- 팀 정보 숨김 규칙(`participation_method` 기반)은 바꾸지 않는다.
