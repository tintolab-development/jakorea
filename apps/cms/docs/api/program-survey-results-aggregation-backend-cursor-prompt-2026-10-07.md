# Cursor prompt — 프로그램 설문·만족도 결과 집계 (응답 마스킹 · summary 옵션 집계 · 건수 일치) (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/program-survey-results-aggregation-backend-cursor-prompt-2026-10-07.md`

> **긴급도: 높음 (기능 미동작).** CMS 프로그램 상세 → 설문 관리(설문조사 · 만족도조사)에서
> 응답이 있는데도 결과 그래프가 0으로 보인다. FE는 그래프를 그리려고 응답 목록을 받은 뒤
> 응답마다 상세를 다시 조회하고 있어 호출 수도 많다(N+1).
> FE 쪽 원인(문항 구성 version 불일치, 미리보기 파싱)은 FE에서 이미 고쳤다. 남은 원인은 아래 백엔드 항목이다.

---

## 증상 (로컬, 2026-10-07 11:0x KST)

- CMS 일반 프로그램 상세 → 설문 관리 → 설문조사 / 만족도조사 탭
- 바인딩 목록의 `submittedCount` > 0, 응답 목록 `GET .../responses`에도 행이 있음
- 그런데 척도형·선택형 문항 그래프의 모든 항목이 0이고, 주관식 표도 비어 있음

### FE가 결과를 그리는 방식 (현재)

1. `GET /api/admin/programs/{programId}/surveys/{templateVersionId}/responses` → 응답 목록 (page/size 미지정 → 기본 `size=20`)
2. 각 행의 `answerPreviewJson`으로 답이 부족하면
   `GET /api/admin/programs/{programId}/surveys/{templateVersionId}/responses/{formResponseId}` → 응답별 상세 (N+1)
3. 답(`questionKey` → 값)을 문항 단락 id와 매칭해 FE에서 집계
4. `GET .../summary`는 총 응답 수(`totalResponseCount`)만 사용

---

## 원인

### A. 설문 문항 답이 전부 마스킹된다 (핵심)

- 설문/만족도/강의평가 템플릿 `schemaJson` 단락에는 `piiCategory`가 없다.
  `FormTemplateQuestionSnapshotService`가 `text(node, "piiCategory", "privacyCategory")`로 읽으므로
  게시 시 `form_question.pii_category = NULL`로 저장된다.
- `FormAnswerDisclosurePolicy.classify(null)` → **`RESTRICTED`**
  (주석: "Includes absent/unknown metadata …")
- 그 결과 세 곳 모두 답이 나가지 않는다.

| 위치 | 코드 | 결과 |
|---|---|---|
| 응답 상세 `surveyAnswers()` | `FormP1AdminService` — `mayReveal(pii_category, false, false)` | `answerValueJson`, `answerDisplayText` 모두 `null` |
| 응답 목록 `answer_preview_json` | `upper(COALESCE(preview.pii_category,'RESTRICTED')) IN ('NON_PII','PUBLIC','NONE')` | `answerDisplayText: null` |
| 요약 `surveySummary()` `topAnswers` | `UPPER(COALESCE(q.pii_category,'')) IN ('NONE','PUBLIC','NON_PII')` | `[]` |

→ 응답은 있는데 FE가 받을 수 있는 답 값이 없다. 그래서 그래프가 0이다.

### B. summary가 그래프용 데이터를 주지 못한다

- `topAnswers`는 `answer_display_text` 기준 상위 20개다. 척도·단일선택의 `answer_display_text`는 **옵션 value(id)** 다.
  (`optionLabelDisplay`는 Collection 값에만 라벨을 적용한다.)
- 옵션 라벨과 0건 옵션이 없어서, FE가 summary만으로는 막대그래프를 그릴 수 없다.
  그래서 FE가 응답 전체와 상세를 다시 받는다.

### C. 응답 건수 기준이 API마다 다르다

| API | 기준 |
|---|---|
| 바인딩 `submittedCount` (`ProgramFormBindingQueryService`) | `response_status = 'SUBMITTED'`, `program_form_binding_id` 기준, revision·보존기간 필터 없음 |
| summary `totalResponseCount` (`surveySummary`) | `response_status IN ('SUBMITTED','APPROVED','COMPLETED')`, `latest_revision_yn`, 보존기간 필터, `template_version_id` 기준 |
| 응답 목록 `surveyResponses` | `program_id + template_version_id` 기준, 상태 필터 확인 필요 |

- 포털 제출 fallback(`POST /api/portal/me/form-responses/submit`)은 `programFormBindingId` 없이 들어온다.
  이때 `form_response.program_form_binding_id`가 채워지는지 확인하라. 비어 있으면 바인딩 `submittedCount`가 0으로 남는다.

---

## 요청

### ① 설문 계열 선택형 문항은 기본 `NON_PII` (A 해결)

대상 템플릿: `form_type`이 `SURVEY`, `SATISFACTION`, `LECTURE_EVALUATION`인 템플릿의 게시 version.

| 문항 타입 (`question_type`, 정규화 후) | `pii_category`가 없을 때 기본값 |
|---|---|
| 척도형(`scale_type`), 단일·복수 선택(`multiple_choice`), 별점(`star_rate`) | **`NON_PII`** |
| 주관식(`short_essay`) | **정책 결정 필요** — 아래 참고 |
| 설문자 정보(user_info / 이름·연락처 등) | 기존대로 (`RESTRICTED` 또는 `GENERAL`) |
| 명시적인 `piiCategory`가 있는 문항 | 명시값 유지 (덮어쓰지 마라) |

- 게시 시 스냅샷(`FormTemplateQuestionSnapshotService`)에서 기본값을 채워라. 조회 시점마다 분기하지 마라.
- **이미 게시된 version 백필 마이그레이션**을 추가하라. 대상: 위 form_type, `pii_category IS NULL`, 선택형 타입.
- 주관식: 설문 의견란이라 CMS 결과 화면(주관식 응답 표)에 원문이 보여야 한다.
  `NON_PII`로 둘지, `GENERAL`로 두고 관리자 사유 인증을 요구할지 **임의로 정하지 말고 보고에 명시**하라.
  결정 전까지는 주관식은 기존 동작을 유지하고, 선택형만 먼저 반영하라.

### ② summary에 선택지별 집계 추가 (B 해결, FE N+1 제거용)

`GET /api/admin/programs/{programId}/surveys/{templateVersionId}/summary`

선택형 문항(척도·단일/복수 선택·별점) 행의 `summaryJson`에 **additive** 필드 `options`를 추가하라.

```json
{
  "totalResponses": 12,
  "answeredCount": 11,
  "blankCount": 1,
  "distinctAnswerCount": 4,
  "topAnswers": [ ... 기존 그대로 ... ],
  "options": [
    { "value": "scale-1", "label": "매우 그렇다", "displayOrder": 0, "count": 5 },
    { "value": "scale-2", "label": "그렇다",     "displayOrder": 1, "count": 6 },
    { "value": "scale-3", "label": "보통",       "displayOrder": 2, "count": 0 }
  ]
}
```

- 기준: `form_question_option`(해당 `template_version_id`의 문항 옵션) **전체**를 `display_order` 순으로. 응답 0건 옵션도 `count: 0`으로 포함.
- 카운트: `form_response_answer.answer_value_jsonb`의 원시 value로 센다(라벨 아님).
  복수 선택(배열 값)은 선택된 value마다 1씩.
- 옵션 목록에 없는 value(템플릿 수정 전 응답 등)는 `options`에 넣지 말고 `unmatchedCount`(number)로 합산하라.
- 별점은 옵션 테이블이 없으면 `1..max` 정수를 value로, label은 `"{n}점"`.
- 주관식·기타 타입 행에는 `options`를 넣지 마라.
- ①의 PII 판정은 그대로 따른다. `options`의 **건수는 PII와 무관하게 공개 가능**하다(값 원문이 아님).
  단 `RESTRICTED`/`GENERAL` 문항이면 `options`를 생략하라.
- 응답 범위(scoped_responses)는 기존 summary 조건을 유지한다.

### ③ 응답 건수 기준 통일 (C 해결)

- 바인딩 `submittedCount`를 summary `totalResponses`와 **같은 조건**으로 맞춰라:
  `response_status IN ('SUBMITTED','APPROVED','COMPLETED')`, `latest_revision_yn = true`, 보존기간 미만료.
- 바인딩 기준 집계가 `program_form_binding_id`만 보면, 바인딩 id 없이 저장된 응답이 빠진다.
  `program_form_binding_id = pfb.id` **또는** (`program_form_binding_id IS NULL` AND `program_id = pfb.program_id` AND `template_version_id = pfb.template_version_id`)로 묶어라.
  같은 version이 같은 프로그램에 두 번 바인딩되는 경우가 있으면 보고하고 임의로 합치지 마라.
- 포털 fallback 제출(`/api/portal/me/form-responses/submit`)에서 `programFormBindingId`가 없을 때
  `program_id + template_version_id`로 **활성 바인딩이 1개면 그 id를 채워 저장**하라. 2개 이상이면 기존 동작 유지 + 보고.

### ④ 응답 목록 계약 명확화 (문서·OpenAPI)

`GET .../surveys/{templateVersionId}/responses`

- `answerPreviewJson`은 문자열 안의 **JSON 배열**이다. OpenAPI `description`에 형태를 명시하라:
  `[{ "questionKey": string, "questionLabel": string, "answerDisplayText": string | null }]`, 최대 5개, PII 문항은 `null`.
- 응답이 배열(`List`)이라 총 건수·다음 페이지 여부를 알 수 없다. 기존 배열 응답은 유지하고,
  **`X-Total-Count` 응답 헤더**를 추가하라(경로·스키마 변경 없이 additive).

---

## 하지 말 것

- 기존 필드 삭제·이름·타입 변경 금지 (`topAnswers`, `answerPreviewJson` 형식 유지)
- path·쿼리 파라미터 변경 금지
- 설문자 정보(이름·연락처 등) 문항을 `NON_PII`로 바꾸지 말 것
- 명시적 `piiCategory`가 있는 문항을 덮어쓰지 말 것
- `FormAnswerDisclosurePolicy.classify(null) → RESTRICTED` 기본 규칙 자체를 바꾸지 말 것
  (다른 양식·신청서에 영향). 설문 계열 문항 메타데이터를 채우는 방식으로만 해결하라.
- 응답 상세 API를 묶음 조회로 바꾸는 등 새 엔드포인트 추가는 하지 말 것 (② summary로 대체)

## 보고 형식

1. 변경 파일 + 마이그레이션 파일명
2. ① 백필 대상 건수 (form_type별, question_type별) / 주관식 정책 결정 여부와 근거
3. ② summary 응답 예시 (척도 1문항, 복수선택 1문항, 0건 옵션 포함)
4. ③ 재현 프로그램 1건에서 바인딩 `submittedCount` = summary `totalResponses` = 응답 목록 `X-Total-Count` 확인
5. 테스트 이름
   - 설문 템플릿 게시 시 선택형 `pii_category = NON_PII`, 설문자 정보 문항은 유지
   - 응답 상세에서 선택형 `answerValueJson`이 null이 아님
   - summary `options`에 0건 옵션 포함, 복수 선택 카운트
   - bindingId 없는 fallback 제출이 `submittedCount`에 반영됨
6. `docs/frontend` handoff (summary `options` 필드 표 + PII 규칙 + `X-Total-Count`)

---

## FE 후속 작업 (참고, 백엔드 작업 아님)

- OpenAPI 재동기화 → orval 재생성
- `apps/cms/src/features/program/shared/ui/survey-management/survey-poll-results-view.tsx`
  척도·선택형 그래프를 summary `options`로 그리도록 전환. 응답 목록·상세는 주관식 표에만 사용.
- `apps/cms/src/features/program/general/hooks/use-general-program-posts-surveys.ts`
  `mapResponsesWithDetails`의 응답별 상세 조회는 주관식이 있는 경우에만 남김. `X-Total-Count`로 페이지 수집.
- 만족도 응답 수는 지금 `max(submittedCount, 불러온 응답 수)`로 보정 중. ③ 반영 후 `submittedCount`만 사용.
