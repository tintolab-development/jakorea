# Cursor prompt — 봉사자 신청 「면접 진행 가능 일정」 선택지가 비는 문제 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/volunteer-interview-slot-options-from-schedule-info-backend-cursor-prompt-2026-10-07.md`

> **긴급도: 높음 (신청 불가).**
> 면접을 운영하는 일반 봉사자 프로그램에서 면접 문항이 필수로 보이지만 선택지가 0개다.
> 회원은 면접 일정을 고를 수 없어 봉사자 신청을 제출하지 못한다.
>
> 범위: 일반 봉사자(`program-volunteer-application-seed-interview-schedule`)와 UJAT 봉사자(`ujat-program-application-volunteer-seed-interview-schedule`).
> 개인(참여자) 면접, 강사·기관 신청은 바꾸지 마라.

---

## 재현 (로컬, 2026-10-07)

- 프로그램 `186050`(일반, 봉사자 모집 `recruitmentId=186117`, `formBindingId=187088`).
- `GET /api/portal/programs/186050/form-bindings/187088?recruitmentId=186117&applicationType=VOLUNTEER`
  - `runtimeContext.audienceApplication.hiddenQuestionKeys` = `[]`
  - `dynamicQuestions["program-volunteer-application-seed-interview-schedule"]` = `{ inputMode: "dynamic_interview_slots", optionCount: 0, resolved: true }`
  - 해당 문단 `items: []`, `runtimeResolved: true`
- 운영 판정 근거: `program_recruitment(186117).interview_enabled = true`, `general_program_detail.config_jsonb.generalVolunteerInterviewEnabled = true`.
- `program_interview_slot`: 로컬 DB **전체 0건**(186050만이 아니다).
- 같은 상태: `186052`(모집 행 `interview_enabled = true`, 슬롯 0).

## 원인

1. 신청 선택지는 `ProgramApplicationAudienceRuntimeLoader.loadInterviewSlotOptions`가 **`program_interview_slot` 행만** 읽는다(오늘 이후·종료 전).
2. CMS 프로그램 등록/수정에서 운영자가 입력하는 「봉사자 면접 진행 가능 일정」은 테이블이 아니라 **`config_jsonb.generalCommonInfo.volunteerInterviewScheduleInfo`에만 저장**된다. 이 값을 슬롯으로 바꾸는 코드가 없다.
3. CMS가 `program_interview_slot`을 만드는 경로는 **서류 합격자에게 면접일을 배정할 때**(`POST /api/admin/programs/{programId}/interview-slots` → `POST /api/admin/interview-assignments`)뿐이다. 신청 단계에는 슬롯이 하나도 없다.
4. 그 결과 면접은 「운영」으로 판정되어 숨겨지지 않고 필수로 남는데, 선택지는 0개다.

### `volunteerInterviewScheduleInfo` 실제 값 (186050)

```json
{
  "availableTimeSlots": "10:00 ~ 10:30",
  "recurringUnavailable": "공휴일"
}
```

필드 정의(CMS 저장 형식):

| 필드 | 형식 | 의미 |
| --- | --- | --- |
| `availableTimeSlots` | `"HH:mm ~ HH:mm, HH:mm ~ HH:mm"` (쉼표 구분) | 면접 가능 시간대 |
| `recurringUnavailable` | 문자열 (예: `공휴일`, 요일명) | 반복 불가일 |
| `specificUnavailableDateIsos` | `YYYY-MM-DD[]` | 직접 지정 불가일 |
| `specificUnavailableDates` | 표시용 문자열 | 표시 전용 |
| `exceptions[]` | `{ blockId, exceptionDateIso, availableTimeSlots }` | 특정 날짜만 다른 시간대 |

주의: **면접 날짜 범위(시작일·종료일)가 없다.** 시간대와 불가일만으로는 날짜별 슬롯을 만들 수 없다.

---

## 요청

### A. [결정 필요] 신청용 면접 선택지의 출처를 정하고 보고하라

아래 중 하나를 택하고, 이유와 함께 보고하라. 권장은 **A-1**이다.

- **A-1 (권장) 설정 기반 선택지:** `volunteerInterviewScheduleInfo`(+ 날짜 범위)로 신청 화면 선택지를 계산한다. 회원이 고른 값은 「희망 일정」으로 저장하고, 실제 `program_interview_slot`은 기존처럼 배정 시 만든다.
- **A-2 슬롯 선생성:** 프로그램 저장(등록·수정) 시 설정을 펼쳐 `program_interview_slot`을 미리 만든다. 설정이 바뀌면 배정 없는 슬롯만 갱신·삭제하는 규칙이 필요하다.

어느 쪽이든 **날짜 범위**를 정해야 한다. 후보를 비교해 하나를 정하고 보고하라.

| 후보 | 186050 값 | 비고 |
| --- | --- | --- |
| 봉사자 모집 종료 다음날 ~ `resultAnnouncementDate` | 2026-11-02 ~ 2026-11-02 | 186052는 발표일이 모집 시작 전이라 범위가 깨진다 |
| 봉사자 모집 기간(`program_recruitment.start_at ~ end_at`) | 2026-10-01 ~ 2026-11-02 | 서류 심사 전 면접이 섞일 수 있다 |
| 신규 필드 `volunteerInterviewScheduleInfo.periodStartDate/periodEndDate` | 없음 | CMS 입력 추가 필요 → FE 후속 작업 |

신규 필드를 택하면 키 이름·형식(`YYYY-MM-DD`, KST)을 확정해서 알려라. FE가 CMS 입력을 추가한다.

### B. [확정] 선택지 계약은 지금과 같게 유지하라

FE는 이미 아래 형식을 읽는다. 바꾸지 마라.

- 문단 `runtimeResolved: true`, `items[]` 또는 `options[]`
- 각 항목: `id`(또는 `option_value`), `label`(또는 `option_label`), 메타데이터에 `slotDate`(`YYYY-MM-DD`), `startAt`/`endAt`(ISO)
- 제출 값: 선택한 `id` 배열
- A-1을 택하면 `id`가 `interview-slot:{id}`가 아니어도 된다. 예: `interview-option:2026-11-02T10:00`. 제출 검증이 그 `id`를 받도록 맞춰라.
- 공휴일·직접 불가일·`exceptions[]`를 반영하고, 지난 시각은 빼라.

### C. [확정] 운영인데 선택지가 0개면 막지 마라

설정이 비었거나 범위가 지나서 선택지가 0개인 경우:

- 면접 문항을 `hiddenQuestionKeys`에 넣고 문단에 `runtimeHidden: true`를 붙여라(면접 미운영과 동일 처리). 답 없이 제출이 성공해야 한다.
- 또는 문항을 선택(optional)으로 내려라. 둘 중 무엇을 택했는지 보고하라.
- 지금처럼 「필수 + 0개」로 내려 신청을 막는 상태는 없어야 한다.

### D. [확정] 배정 흐름 호환

- CMS 서류 합격자 목록의 「면접일 배정」(`GET/POST .../interview-slots`, `POST /api/admin/interview-assignments`)은 그대로 동작해야 한다.
- A-1이면 CMS 신청 상세에 회원이 고른 희망 면접 일정이 보이도록 `GET /api/admin/volunteer-applications/{id}`의 기존 면접 가능 일정 응답 필드에 담아라. 필드 이름을 보고하라.

---

## 회귀 테스트

1. `186050` 설정(`10:00 ~ 10:30`, 공휴일 제외) + 정한 날짜 범위 → 신청폼 선택지 1개 이상, 공휴일 날짜 없음.
2. 선택지 하나 선택해 제출 → 201, CMS 상세에서 선택값 확인.
3. 목록에 없는 `id` 제출 → 400.
4. 설정이 비었거나 범위가 지난 운영 프로그램 → 면접 숨김(또는 선택)으로 내려오고 답 없이 제출 성공.
5. 면접 미운영 프로그램(UJAT `186026` 등, `interview_enabled` 미설정 + 슬롯 0) → 기존처럼 숨김.
6. 서류 합격자 면접일 배정 → 기존과 동일하게 슬롯 생성·배정.

## 보고 형식

- A에서 고른 방식과 날짜 범위 규칙(신규 필드면 키·형식)
- C에서 고른 처리(숨김/선택)
- 변경 파일, OpenAPI 갱신 여부, 회귀 테스트 이름
- FE가 해야 할 일(신규 필드 입력, 제출 `id` 형식 변경 등)이 있으면 목록으로
