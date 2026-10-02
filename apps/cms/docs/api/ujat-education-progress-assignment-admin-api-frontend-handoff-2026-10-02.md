# UJAT 교육 진행 · 과제 관리 API

작성일: 2026-10-02
대상: CMS UJAT 프로그램 상세 → 교육 진행 → 상/하반기 과제 관리 (`edu_h1_assignments` / `edu_h2_assignments`)

`useUjatEducationProgressAssignments`의 unavailable 고정을 끄고 아래 목록을 쓴다. `partner-assignments`와 일반 `GET /api/admin/programs/{programId}/assignment-submissions`는 이 화면 데이터가 아니다.

## 목록

```http
GET /api/admin/program-execution/programs/{programId}/ujat/assignment-submissions?semesterType=FIRST_HALF&educationRegionCode=SEOUL
Authorization: Bearer <관리자>
```

권한: `ASSIGNMENT_READ` (지역 배정 Matrix와 동일).

| 쿼리 | 규칙 |
|---|---|
| `semesterType` | 필수. `FIRST_HALF` \| `SECOND_HALF`. 없으면 **400** `UJAT_SEMESTER_TYPE_REQUIRED`. 그 외 값 **400** `UJAT_SEMESTER_TYPE_INVALID`. 상·하반기를 한 응답에 섞지 않는다. |
| `educationRegionCode` | 필수. 활성 UJAT 교육 권역 코드. 없으면 **400** `UJAT_EDUCATION_REGION_CODE_REQUIRED`. 없는 코드 **400** `UJAT_EDUCATION_REGION_CODE_UNKNOWN`. |
| `isoDate` | 선택. `YYYY-MM-DD`. 생략·빈 문자열이면 그 반기·지역 교육일 전체. 형식 오류 **400** `UJAT_ASSIGNMENT_ISO_DATE_INVALID`. |

UJAT/DGBONG/`UJAT_DGBONG`이 아니면 **404** `UJAT_PROGRAM_REQUIRED`. 프로그램이 없으면 **404** `PROGRAM_NOT_FOUND`.

## 응답

`UjatAssignmentSubmissionListResponse`

- `semesterType`, `educationRegionCode`: 요청을 정규화한 값.
- `items`: 교육 진행일 배열. 없으면 `[]` (null 아님).
- 각 날짜의 `volunteers`: 그 날 행. 없으면 `[]`.

날짜 그룹:

| 필드 | 의미 |
|---|---|
| `scheduleId` | 교육일 |
| `isoDate` | Asia/Seoul 기준 `YYYY-MM-DD`. 화면 라벨 `YYYY.MM.DD` |
| `planSubmissionPeriodStart` / `End` | 교육일 7일 전 00:00 ~ 전날 23:59:59 (`+09:00`) |
| `logSubmissionPeriodStart` / `End` | 교육일 00:00 ~ 7일 후 23:59:59 (`+09:00`) |

봉사자 행은 그 교육일·지역에 배정된 사람이다. 미배정 봉사자는 없다. 활동 포기(`GIVE_UP`, `WITHDRAWN_BEFORE_START`)는 그 교육일에 진행 이력(출석, 그 날에 묶인 제출, 또는 이미 시작한 활성 배정)이 있을 때만 포함한다.

| 필드 | 없을 때 |
|---|---|
| `memberName` | 봉사자명 |
| `institutionName` | 배정 기관명. 없으면 `null` |
| `assignedClass` | 학급 라벨. 없으면 `null` |
| `organizationApplicationId`, `educationSlotId` | 없으면 `null` |
| `isDropout` | 포기/시작 전 철회면 `true` |
| `hasProgressHistory` | 그 교육일 진행 이력 |
| `plan`, `log` | 항상 객체. 한 상태로 합치지 않는다 |

`plan` / `log` (`UjatAssignmentSubmissionDocument`):

| `status` | 화면 |
|---|---|
| `NOT_SUBMITTED` | 미제출. `submittedAt`, `feedbackDeliveredAt`, `formResponseId`는 `null`. 보기 버튼 비활성 |
| `SUBMITTED` | 기한 내 제출 |
| `DEADLINE_MISSED` | 기간 종료 시각 이후 제출. 수정 제출이어도 기한이 지나면 이 값 |
| `REVISED` | 기한 내 수정 제출 (`revision_no` > 1) |

제출이 교육일(`context_type=PROGRAM_SCHEDULE`/`SCHEDULE`, `EDUCATION_SLOT`/`UJAT_EDUCATION_SLOT`, 또는 projection `program_schedule_id`/`schedule_id`)에 묶여 있으면 그 날만 쓴다. 그렇지 않으면 회원 단위 최신 제출을 배정된 교육일마다 두고, 상태만 그 날 기한으로 계산한다. 초안은 미제출이다.

행 라벨(미제출 / 교육계획서 미제출 / 교육일지 미제출 / 기한 미준수 / 제출 완료)은 프론트 합성 규칙을 유지한다. 서버는 `plan.status`와 `log.status`만 준다.

보기:

- `GET /api/admin/form-responses/{formResponseId}` (`FORM_RESPONSE_READ`)
- 문서 스냅샷: `GET /api/admin/form-responses/{formResponseId}/document-snapshot`

이 티켓에서 뷰어 POST는 없다. `formResponseId`가 `null`이면 보기를 열지 않는다.

비고 예 (프론트 조합):

- `DEADLINE_MISSED` → `교육 계획서 기한 미준수 (yy.MM.dd)` / `교육일지 기한 미준수`
- `REVISED` → `교육 계획서 수정 제출` / `교육일지 수정 제출`. 날짜는 `submittedAt`
- `feedbackDeliveredAt` → `피드백 전달 완료`

## 예시

`2026-10-17` 교육일, 계획서만 제출:

```json
{
  "semesterType": "FIRST_HALF",
  "educationRegionCode": "SEOUL",
  "items": [
    {
      "scheduleId": 701,
      "isoDate": "2026-10-17",
      "planSubmissionPeriodStart": "2026-10-10T00:00:00+09:00",
      "planSubmissionPeriodEnd": "2026-10-16T23:59:59+09:00",
      "logSubmissionPeriodStart": "2026-10-17T00:00:00+09:00",
      "logSubmissionPeriodEnd": "2026-10-24T23:59:59+09:00",
      "volunteers": [
        {
          "participantId": 3001,
          "memberId": 4001,
          "memberName": "김봉사",
          "organizationApplicationId": 5001,
          "institutionName": "○○초등학교",
          "assignedClass": "3학년 2반",
          "educationSlotId": 8001,
          "isDropout": false,
          "hasProgressHistory": true,
          "plan": {
            "status": "SUBMITTED",
            "submittedAt": "2026-10-15T11:00:00+09:00",
            "feedbackDeliveredAt": "2026-10-16T09:00:00+09:00",
            "formResponseId": 91001
          },
          "log": {
            "status": "NOT_SUBMITTED",
            "submittedAt": null,
            "feedbackDeliveredAt": null,
            "formResponseId": null
          }
        }
      ]
    }
  ]
}
```

## 로컬 확인

UJAT Primary 시드 프로그램 `182104` (진행 중), `182105` (종료). 지역 예: `SEOUL`.

```http
GET /api/admin/program-execution/programs/182104/ujat/assignment-submissions?semesterType=FIRST_HALF&educationRegionCode=SEOUL
GET /api/admin/program-execution/programs/182104/ujat/assignment-submissions?semesterType=SECOND_HALF&educationRegionCode=SEOUL
```

시드의 계획서(`issuance-2`)·일지(`issuance-ujat-edu-journal`)는 교육일이 아니라 봉사자 단위라, 배정된 교육일마다 같은 `formResponseId`가 반복되고 기한 비교만 날짜별로 달라진다.

## 수용 기준

- 상반기 응답에 하반기 `isoDate`가 없고, 다른 `educationRegionCode` 봉사자가 없다.
- 활동 포기자 중 그 날 진행 이력이 없는 행이 없다.
- 미제출 보기는 `formResponseId == null`이라 비활성이다.
- 배정·출석·직접배정 API 요청/응답은 그대로다.
