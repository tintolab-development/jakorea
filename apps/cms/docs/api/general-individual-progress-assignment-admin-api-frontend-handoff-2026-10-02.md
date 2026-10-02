# 일반 개인 진행 현황 · 과제 관리 API

작성일: 2026-10-02

일반 **개인** 프로그램 LNB 과제 관리 탭은 아래 목록만 호출한다. 회원 1인 `assignment-submissions`와 UJAT `.../ujat/assignment-submissions`는 이 화면용이 아니다.

## 엔드포인트

```http
GET /api/admin/programs/{programId}/assignment-submissions
Authorization: Bearer <관리자>
```

권한: `PROGRAM_READ`

쿼리 (모두 생략 가능):

| 이름 | 의미 |
|------|------|
| `scheduleId` | 그 회차만. 생략하면 과제 있는 회차 전부 |
| `memberName` | 참여자명 부분 일치 |
| `affiliation` | 소속 부분 일치 |
| `grade` | 학년 부분 일치 |
| `submissionStatus` | `NOT_SUBMITTED` 또는 `SUBMITTED`. `SCHEDULED`는 서버 필터가 아니다 |
| `page`, `size` | 생략하면 회차 안 참여자 전량. 지정하면 **회차는 자르지 않고** 각 회차의 행만 자른다. `size` 최대 200 |

## 응답

`items`는 회차 그룹이다. `items`, `participants`, `files`는 없으면 `[]`이고 `null`이 아니다.

없으면 `null`: `sessionNo`, `scheduleName`, `startAt`, `endAt`, `assignmentPeriodStart`, `assignmentPeriodEnd`, `memberName`, `gender`, `birthDate`, `affiliation`, `organizationName`, `grade`, `remarkAt`.

`organizationName`은 `affiliation`과 같다.

```json
{
  "items": [
    {
      "scheduleId": 601,
      "sessionNo": 1,
      "scheduleName": "1회차",
      "startAt": "2026-10-20T01:00:00Z",
      "endAt": "2026-10-20T03:00:00Z",
      "assignmentEnabled": true,
      "assignmentPeriodStart": "2026-10-20T00:00:00+09:00",
      "assignmentPeriodEnd": "2026-10-27T23:59:59+09:00",
      "participants": [
        {
          "participantId": 1001,
          "memberId": 2001,
          "memberName": "홍길동",
          "gender": "MALE",
          "birthDate": "2008-03-01",
          "affiliation": "○○중학교",
          "organizationName": "○○중학교",
          "grade": "2학년",
          "submissionStatus": "SUBMITTED",
          "remarkKind": "FEEDBACK_DELIVERED",
          "remarkAt": "2026-10-21T00:00:00Z",
          "files": [
            {
              "fileObjectId": 9001,
              "originalFileName": "과제_제출.pdf",
              "downloadable": true
            }
          ]
        }
      ]
    }
  ]
}
```

| 필드 | 값 |
|------|----|
| `submissionStatus` | `NOT_SUBMITTED` 미제출, `SUBMITTED` 제출(파일 0~n개), `SCHEDULED` 회차 시작 전 |
| `remarkKind` | `NONE` `-`, `DEADLINE_MISSED` 기한 미준수, `REVISION_SUBMITTED` 수정 제출, `FEEDBACK_DELIVERED` 피드백 전달. 날짜는 `remarkAt` |
| `gender` | `MALE` / `FEMALE` |

과제 없는 회차(`assignmentEnabled=false`이고 회차 과제 바인딩도 없음)는 `items`에 없다.

`participantId`와 `scheduleId`는 같은 프로그램 출석 행과 같다. 강사·봉사자 행은 없다.

기관, 1사1교, UJAT, Gemini로 호출하면 `200`과 `{"items":[]}`. UJAT 계획서/일지는 이 응답에 없다.

없는 프로그램: `404` `PROGRAM_NOT_FOUND`. 다른 프로그램의 `scheduleId`: `404` `PROGRAM_SCHEDULE_NOT_FOUND`.

## 화면

- `isGeneralIndividualProgram` LNB 과제 탭만 이 API를 쓴다.
- 회차 헤더: `sessionNo`, `scheduleName`, `startAt`~`endAt`, `assignmentPeriodStart`~`assignmentPeriodEnd`.
- 행: `memberName`, `gender`, `birthDate`, `affiliation`, `grade`, `submissionStatus`, `files`, `remarkKind`, `remarkAt`.
- 파일명 클릭·ZIP은 이번 API에 없다. `fileObjectId`와 `downloadable`만 사용한다.
- 회원 상세 `GET /api/admin/users/{memberId}/applications/{applicationId}/assignment-submissions`는 그대로다. 참여자마다 호출하지 않는다.

## 스키마

OpenAPI: `openapi/backend.openapi.json`

- path: `/api/admin/programs/{programId}/assignment-submissions`
- schema: `GeneralIndividualAssignmentSubmissionListResponse`

codegen 후 과제 탭 훅이 이 operation을 쓰게 바꾼다.

## 수용 기준

- 일반 개인 프로그램에서 과제 회차와 개인 참여자만 보인다.
- `?scheduleId=`는 그 회차만 반환한다. 과제 없는 회차는 빈 `items`다.
- 강사 행이 없다.
- UJAT/기관 프로그램은 빈 `items`다.
