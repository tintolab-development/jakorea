# Cursor prompt — 면접 평가를 마스터·PM은 A·B 한 번에, 담당자는 각자 저장 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/volunteer-interview-evaluation-master-pm-both-scores-backend-cursor-prompt-2026-10-07.md`

> **긴급도: 높음 (2차 면접 평가 저장 불가).**
> CMS 「봉사자 2차 면접 대상자 상세 → 면접 평가」에서 담당자 A 5점, B 5점, 비고를 저장하면 400이 난다.
> 화면은 A·B를 한 폼에서 받고, 지금은 두 점수의 **합(10)** 을 `scoreTotal`로 보낸다.
> 서버는 `scoreTotal`을 **평가자 한 명의 점수**로 보고 **0~5만** 허용한다.
>
> 기획: **마스터 관리자** 또는 **해당 프로그램 PM 한 명**은 A·B를 한 요청에 모두 넣을 수 있다. **그 외 관리자**는 지금까지처럼 자기 슬롯 하나만 넣는다.

---

## 재현 (로컬, 2026-10-07)

- 프로그램 `186050`, 봉사자 신청 `1691347` (이건희일반). 면접 일정은 배정되어 있다.
- CMS 면접 평가 모달: 담당자 A `5`, 담당자 B `5`, 비고 `1221`, 화면 총합 `10`.
- `POST /api/admin/interview-assignments/{assignmentId}/evaluations`
  body `{ "scoreTotal": 10, "comment": "1221" }`
- 응답 400. `ApplicationDecisionService.recordVolunteerInterviewEvaluation` 메시지:
  `scoreTotal must be between 0 and 5 for one evaluator.`
- CMS는 이 문장을 숨기고 「봉사자 신청 상태 변경 중 오류가 발생했습니다.」만 보여 준다.

## 현재 서버 규칙 (바꾸기 전)

`ApplicationDecisionService.recordVolunteerInterviewEvaluation` (`applicationflow/service/ApplicationDecisionService.java`, 약 585행):

1. `scoreTotal` 필수. `0` 이상 `5.0` 이하. 한 평가자 점수다.
2. 같은 `evaluator_admin_id`는 배정당 1행. 유니크 인덱스  
   `ux_program_interview_evaluation_assignment_evaluator_once`  
   `(interview_assignment_id, evaluator_admin_id)`.
3. 배정당 평가 행은 최대 2개.
4. `program_interview_evaluation`에는 슬롯 컬럼이 없다. 상세는 `submitted_at, id` 순으로 1, 2를 붙인다  
   (`VolunteerApplicationAdminService.interviewEvaluations`, 약 370행).

서류 평가의 「마스터 또는 프로그램 PM이면 A·B 모두 수정」과 같은 권한이다.  
참고: `VolunteerDocumentEvaluationService.canEditAllSlots` — `AdminDataScopeService.isMaster()` 이거나  
`program_admin_assignment.assignment_role = 'PM'`.

역할 코드는 `admin_role.code`: 글로벌 마스터는 `MASTER`. PM은 글로벌 역할이 아니라 **그 프로그램의** `program_admin_assignment.assignment_role = 'PM'`이다.

---

## 요구 사항

### 1. 요청 본문 — `InterviewEvaluationRequest`

기존 필드는 유지한다. 슬롯 점수를 추가한다.

| 필드 | 타입 | 규칙 |
| --- | --- | --- |
| `scoreTotal` | number, nullable | **레거시.** `managerAScore`·`managerBScore`가 둘 다 없으면, 지금처럼 평가자 한 명의 점수(0~5)로 빈 슬롯에 저장한다. |
| `comment` | string, nullable | 비고. 이번 요청으로 쓰는 행에 저장한다. |
| `managerAScore` | number, nullable | 담당자 A. **0 이상 5 이하.** |
| `managerBScore` | number, nullable | 담당자 B. **0 이상 5 이하.** |

- `managerAScore` 또는 `managerBScore`가 있으면 슬롯 저장이다. 이 경우 `scoreTotal`은 무시한다. 합계를 `scoreTotal`로 받지 마라.
- 셋 다 없으면 400. 메시지에 점수가 필요하다는 뜻을 남긴다.
- 각 슬롯 점수가 0~5 밖이면 400. 메시지 예: `담당자 점수는 0~5점이어야 합니다.`

### 2. 누가 무엇을 쓸 수 있나

호출자는 기존과 같이 `APPLICATION_WRITE`와 해당 배정의 심사 권한이 있어야 한다 (`requireInterviewAssignmentCapability`).

**마스터 또는 해당 프로그램 PM** (`canFillBoth`):

- `managerAScore`와 `managerBScore`를 **한 요청에 둘 다** 보낼 수 있다.
- 각 슬롯은 upsert다. 비어 있으면 삽입, 있으면 점수·비고·`evaluator_admin_id`(현재 관리자)·`submitted_at`을 갱신한다. 다른 관리자가 넣은 슬롯도 마스터·PM은 덮어쓸 수 있다.
- 한 슬롯만 보내면 그 슬롯만 upsert한다.

**그 외 관리자:**

- 한 요청에 A·B를 **둘 다** 보내면 400.  
  메시지: `담당자 A·B 점수를 함께 입력하려면 마스터 관리자 또는 해당 프로그램 PM이어야 합니다.`
- 슬롯 하나만 보낸다. 그 슬롯이 비어 있거나 **자기 행**이면 저장·수정한다.
- 다른 관리자 행이 있는 슬롯은 400.  
  메시지: `이 담당자 점수는 다른 관리자가 이미 입력했습니다.`
- 이미 다른 슬롯에 자기 행이 있는데 나머지 슬롯을 또 쓰면 400.  
  메시지: `담당자 점수는 한 슬롯만 입력할 수 있습니다.`
- 레거시 `scoreTotal`만 온 경우도 지금과 같다. 같은 관리자는 배정당 한 슬롯, 배정당 최대 2슬롯. 빈 슬롯은 1 다음 2.

프로그램 ID는 배정에서 구한다. 봉사자 배정이면 `program_volunteer_application.program_id`, 개인 배정이면 `program_individual_application.program_id`. 이 엔드포인트는 둘 다 탄다. PM 판정은 그 `program_id` 기준이다.

### 3. 저장 스키마

`program_interview_evaluation`에 슬롯을 둔다.

- 컬럼 `evaluator_order smallint`. 허용 값 `1`(담당자 A), `2`(담당자 B).
- 기존 행은 배정별로 `submitted_at, id` 순 `row_number()`로 1, 2를 채운다. 3 이상은 만들지 마라. 이미 2행을 넘는 배정이 있으면 마이그레이션을 실패시키지 말고, 3번째부터는 `evaluator_order`를 비워 두고 완료 보고에 건수를 적어라.
- 유니크 `ux_program_interview_evaluation_assignment_evaluator_once` `(interview_assignment_id, evaluator_admin_id)` 를 **제거**한다. 마스터·PM 한 명이 1행·2행을 같이 가져야 한다.
- 새 유니크: `(interview_assignment_id, evaluator_order)` WHERE 둘 다 NOT NULL. 이름 예: `ux_program_interview_evaluation_assignment_order`.
- Flyway는 현재 마지막이 `V239__general_progress_textbook_delivery_and_volunteer_kind_20261002.sql`이다. 다음 번호로 추가한다.
- 삽입·갱신 컬럼: `evaluator_order`, `score_total`(그 슬롯 점수 0~5), `comment`, `evaluator_admin_id`, `evaluation_status = 'SUBMITTED'`.

배정·신청 면접 상태 전이는 유지한다.

- 점수가 있는 슬롯이 1개면 `PARTIALLY_EVALUATED`.
- 2개면 `EVALUATED`.
- 기존 `updateVolunteerInterviewEvaluationStatus` / `updateIndividualInterviewEvaluationStatus`를 그대로 쓴다.

### 4. 조회 — 슬롯 번호를 내려라

CMS는 `evaluatorOrder === 1`을 담당자 A, `2`를 담당자 B로 읽고, 총합은 두 점수의 합으로 계산한다.

**상세** `GET /api/admin/volunteer-applications/{id}` → `screening.interviewEvaluations[]`  
(`VolunteerApplicationDetailResponse.InterviewEvaluationSummary`. 이미 `evaluatorOrder`, `score`, `remark`가 있다.)

- `ORDER BY evaluation.evaluator_order NULLS LAST, evaluation.submitted_at, evaluation.id`
- `evaluator_order`가 있으면 그 값을 `evaluatorOrder`로 쓴다. 없으면 지금처럼 조회 순 1, 2.
- `score`는 그 슬롯의 `score_total`(0~5)이다. 두 점수의 합을 한 원소의 `score`에 넣지 마라.
- `screening.interviewTotalScore`는 지금처럼 슬롯 점수 합이다. 점수가 하나도 없으면 null.
- `screening.interviewEvaluationRemark`는 비고가 있는 슬롯 중 마지막 값. 지금 상세 조립과 같다.
- 개인 신청 상세(`IndividualApplicationAdminService.interviewEvaluations`)도 같은 정렬·`evaluator_order`를 쓴다. 저장 API가 같기 때문이다.

**목록** `GET /api/admin/programs/{programId}/volunteer-applications` → `items[].interviewEvaluations[]`

- `array_agg` 순서를 `COALESCE(e.evaluator_order, 99), e.id`로 바꾼다.
- 목록 summary에 `evaluatorOrder`를 포함한다. 없으면 CMS가 「B만 있는 행」을 A로 읽는다.
- 점수 필드는 기존 `scoreTotal`을 유지해도 된다. 값은 슬롯 점수(0~5)다.

### 5. 응답

`InterviewEvaluationResponse` 스키마는 유지한다.

- `scoreTotal`: 저장 후 그 배정의 슬롯 점수 합. 한 슬롯만 있으면 그 점수.
- `evaluationId`: 이번에 쓴 행 중 A가 있으면 A, 없으면 B.
- `evaluationStatus`: `SUBMITTED`.

### 6. 테스트

1. 마스터가 `{ managerAScore: 5, managerBScore: 5, comment: "1221" }` → 200. 행 2개, `evaluator_order` 1·2, 같은 `evaluator_admin_id`. 배정·신청 면접 상태 `EVALUATED`. 상세 `interviewEvaluations`에 order 1 score 5, order 2 score 5. `interviewTotalScore` 10. remark `1221`.
2. 같은 마스터가 A만 `4`로 다시 보내면 슬롯 1만 4로 바뀌고 슬롯 2는 5로 남는다.
3. PM(`program_admin_assignment.assignment_role = 'PM'`, 그 프로그램)도 1번과 같이 둘 다 저장된다.
4. PM이 아닌 일반 관리자가 A·B를 같이 보내면 400.
5. 일반 관리자 A가 슬롯 1만 저장한 뒤, 다른 일반 관리자 B가 슬롯 2만 저장하면 200, 상태 `EVALUATED`.
6. 일반 관리자가 이미 다른 사람이 쓴 슬롯을 쓰면 400.
7. 일반 관리자가 슬롯 1을 쓴 뒤 슬롯 2를 쓰면 400.
8. 레거시 `{ scoreTotal: 3, comment: "한 명" }` 은 빈 슬롯 하나에 3점으로 들어간다. `{ scoreTotal: 10 }` 은 400.
9. 개인 신청 면접 배정에도 마스터의 A·B 한 요청이 같은 규칙으로 저장된다.

## 하지 말 것

- 합계 1~10을 `scoreTotal` 한 컬럼에만 저장하고 A·B를 버리지 마라.
- 마스터가 두 슬롯을 쓰려고 `evaluator_admin_id` 유니크를 우회하는 가짜 관리자 ID를 만들지 마라.
- UJAT 전용 평가 API를 새로 만들지 마라. 이 경로는 일반 봉사자·개인 신청이 이미 같이 쓴다.
- 서류 평가(`document-evaluations`) 규칙은 바꾸지 마라.

## 완료 보고

- 마이그레이션 파일명
- `evaluator_order`가 비어 남은 기존 행 수 (3슬롯 이상 배정)
- 위 테스트 1·4·5·8 결과
