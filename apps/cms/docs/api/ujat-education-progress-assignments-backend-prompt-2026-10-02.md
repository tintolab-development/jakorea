# Cursor prompt — UJAT 교육 진행 「과제」 목록 API (JABACK)

| 항목 | 값 |
|---|---|
| 대상 레포 | **JABACK만** |
| 신규 요청 | 프로그램·교육지역·반기 단위 과제(교육계획서·교육일지) 제출 목록 |
| 대상 화면 | CMS → 프로그램 관리 → **UJAT** 상세 → 교육 진행 → **과제** |
| URL | `/programs/ujat?programId={id}&lnb=education_progress&tab=edu_h1_assignments` (하반기 `edu_h2_assignments`) |
| 프로그램 유형 | `UJAT` 만 |
| 우선순위 | **P1** (목록 API 없음 → 화면이 빈 목록) |
| 작성일 | 2026-10-02 |

---

## 한줄

`localhost:8080` OpenAPI(`apps/cms/openapi/backend.openapi.json`)에 **프로그램 단위 과제 제출 목록** path가 없다.  
단건 조회·피드백 등록은 이미 있으므로 목록만 새로 만들어 주면 된다.

## 이미 있는 API (재사용, 신규 만들지 말 것)

| API | 용도 |
|---|---|
| `GET /api/admin/form-responses/{responseId}` | 「교육 계획서 보기」「교육일지 보기」 본문 |
| `POST /api/admin/form-responses/{responseId}/feedback` | 보기 모달의 피드백 등록 (`body.content`) |
| `GET /api/admin/program-execution/programs/{programId}/ujat/allocation-matrix` | 출석·지역 배정. 과제 행의 소스가 아님 |

회원 단건 `GET /api/admin/users/{memberId}/applications/{applicationId}/assignment-submissions` 은 이 화면(지역 탭 × 교육일 그룹)을 채우지 못한다.

## FE 현황

- 과제 탭은 목록을 호출하지 않는다. 세션 배열이 항상 빈 배열이라 교육일 그룹·행이 없다.
- 필터(교육 진행일·봉사자명·배정 기관·제출 현황)는 받아 온 행을 화면에서만 거른다. 서버 필터는 필수가 아니다.
- 상반기 `tab=edu_h1_*` → `semesterType=FIRST_HALF`, 하반기 `edu_h2_*` → `SECOND_HALF`. 출석·지역과 같다.
- 교육 지역 탭 코드는 allocation-matrix와 같은 `educationRegionCode` (`SEOUL`, `GYEONGGI_SOUTH`, …).

## 요구사항

`GET /api/admin/program-execution/programs/{programId}/ujat/assignment-submissions`

쿼리 (필수):

- `educationRegionCode`
- `semesterType` = `FIRST_HALF` | `SECOND_HALF`

권한: 출석·allocation-matrix와 동일 (`PROGRAM_READ` 계열).

교육일(`schedule`)마다 그룹 하나. 그룹 안은 그 날 그 지역에 배정된 봉사자 1행.

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "scheduleId": 12001,
        "educationDate": "2026-04-03",
        "planSubmissionPeriod": { "from": "2026-03-20", "to": "2026-04-02" },
        "logSubmissionPeriod": { "from": "2026-04-03", "to": "2026-04-10" },
        "volunteers": [
          {
            "participantId": 9001,
            "memberId": 8001,
            "volunteerName": "김범수",
            "institutionName": "서울○○초등학교",
            "assignedClass": "4-1",
            "activityAbandoned": false,
            "hasProgressOnDate": true,
            "plan": {
              "status": "SUBMITTED",
              "submittedAt": "2026-04-01T09:00:00+09:00",
              "feedbackDeliveredAt": null,
              "formResponseId": 55001
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
}
```

### `plan` / `log` `status`

| 값 | 화면 |
|---|---|
| `NOT_SUBMITTED` | 보기 버튼 비활성. 제출 현황은 미제출 계열 |
| `SUBMITTED` | 보기 활성. 기한 안 제출 |
| `REVISED` | 보기 활성. 비고 `교육 계획서 수정 제출 (제출일)` / `교육일지 수정 제출 (제출일)` |
| `DEADLINE_MISSED` | 보기 활성. 비고 `… 기한 미준수 (제출일)` |

제출 현황 라벨은 FE가 두 문서 status를 합쳐 만든다. 서버가 합친 문자열을 줄 필요는 없다.

- 둘 다 `NOT_SUBMITTED` → 미제출
- 계획서만 `NOT_SUBMITTED` → 교육계획서 미제출
- 일지만 `NOT_SUBMITTED` → 교육일지 미제출
- 둘 다 `DEADLINE_MISSED` → 기한 미준수
- 계획서만 `DEADLINE_MISSED` → 교육계획서 기한 미준수
- 일지만 `DEADLINE_MISSED` → 교육일지 기한 미준수
- 그 외 (`SUBMITTED` / `REVISED`) → 제출 완료

`feedbackDeliveredAt`이 있고 아직 `REVISED`가 아니면 비고 `피드백 전달 완료 (작성일)`.

### 행 포함 규칙

- 활동 포기(`activityAbandoned=true`)여도 그 교육일에 진행 이력(`hasProgressOnDate=true`)이 있으면 포함한다.
- 포기이고 그 날 진행 이력이 없으면 제외한다.
- `formResponseId`는 제출본이 있을 때만. 보기·피드백은 기존 form-responses API를 쓴다.
- 제출 기간은 교육일 헤더에 그대로 표시한다. 날짜만 주면 FE가 `YY. MM. DD (요일)`로 포맷한다.
- 다른 `semesterType`·다른 `educationRegionCode` 행은 섞지 않는다. 출석 matrix와 같은 일정 집합이어야 한다.

## 검증

- [ ] `programId=186026`, `semesterType=FIRST_HALF`, 지역 1곳 조회 시 해당 반기·지역 교육일만 반환
- [ ] `SECOND_HALF`와 `FIRST_HALF`의 `scheduleId` 집합이 겹치지 않음
- [ ] 제출된 문서의 `formResponseId`로 `GET /api/admin/form-responses/{responseId}` 200
- [ ] 미제출은 `status=NOT_SUBMITTED`, `formResponseId=null`
- [ ] 기한 지난 제출은 `DEADLINE_MISSED` + `submittedAt`
- [ ] OpenAPI(`v3/api-docs`)에 path·200 schema 노출

## FE 참고

목록이 오면 `apps/cms/src/features/program/ujat/ui/detail-modal/progress/assignments/use-list.ts`가 빈 배열 대신 이 응답을 쓴다.  
보기·피드백 모달은 `formResponseId`만 있으면 기존 form-responses API로 동작한다.
