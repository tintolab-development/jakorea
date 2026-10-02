# Cursor prompt — 일반 개인 진행 현황 · 과제 관리 admin API (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/general-individual-progress-assignment-admin-api-backend-request-2026-10-02.md`

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-10-02 |
| 상태 | BE 반영 · FE 연동 (`assignment-submissions` 목록) |
| 대상 | CMS 백엔드 `JABACK` (`localhost:8080`) |
| 우선순위 | **P1** (기존 갭 ID **P2-5**) |
| 화면 | CMS 일반 프로그램 상세 → LNB 프로그램 진행 현황 → **과제 관리** (`progress_assignments`) |
| 대상 프로그램 | 일반 **개인**만 (`generalProgramAudience=individual`). 기관·1사1교·Gemini·UJAT 아님 |

UJAT 교육 진행 과제 탭과 **path·스키마를 공유하지 마라.**  
UJAT 요청은 별도 문서다.

- [ujat-education-progress-assignment-admin-api-backend-request-2026-10-02.md](./ujat-education-progress-assignment-admin-api-backend-request-2026-10-02.md)

관련(이 티켓에서 구현하지 말고 겹치지 마라):

- [general-individual-progress-survey-remote-gaps-backend-request-2026-09-17.md](./general-individual-progress-survey-remote-gaps-backend-request-2026-09-17.md) §C — 같은 갭의 이전 기록
- [programs-api-backend-gaps.md](./programs-api-backend-gaps.md) P2-5
- 회원 1인 `GET /api/admin/users/{memberId}/applications/{applicationId}/assignment-submissions` — **유지**. 프로그램 LNB 대체로 쓰지 마라.

---

## 1. 한 줄 요약

일반 **개인** 프로그램 진행 현황 과제 관리 탭은 **회차(`scheduleId`)별 전체 참여자 제출 목록**이 필요하다.

지금 OpenAPI에는 프로그램 스코프 과제 admin API가 없다.  
회원 1인 assignment-submissions 만으로는 이 화면을 채울 수 없다.

---

## 2. 지금

CMS FE (`ParticipatingIndividualProgressAttendanceSection` 과 같은 LNB, 과제 탭):

- 훅: `use-participating-individual-progress-assignment.ts`
- 실프로그램: remote 호출 없음. 빈 목록 + (temp-mock 만 local)
- 주석: 프로그램 단위 과제 admin API 없음 (P2-5)

있는 API:

```http
GET /api/admin/users/{memberId}/applications/{applicationId}/assignment-submissions
```

- 스코프: **회원 1인 · 신청 1건**
- 화면: 회원 상세 과제 제출 내역
- 프로그램 LNB(회차 × 전체 참여자)에 쓰지 않는다. N+1 로 조합하지 마라.

출석 탭은 이미 다른 계약이다. 이 티켓에서 출석 path를 바꾸지 마라.

- `GET /api/admin/dashboard/program-schedules`
- `GET /api/admin/program-execution/programs/{programId}/schedules/{scheduleId}/attendances`
- `PUT /api/admin/program-schedules/{scheduleId}/attendances`

---

## 3. 화면이 필요한 것

LNB는 `isGeneralIndividualProgram` 일 때만 노출한다. 기관 프로그램 LNB에는 없다.

### 3.1 회차 그룹 헤더

회차마다 한 블록.

| UI | 의미 |
|----|------|
| `{N}회차 과제` | `sessionNo` |
| 교육 일정 요약 | 날짜 · 시작~종료 시각 · 일정명 |
| 교육 기간 라벨 | 회차 일자 |
| `과제 제출 기한 : …` | 그 회차 과제 제출 기간 |

과제가 꺼진 회차(`assignmentEnabled=false` / 기간 없음)는 목록에 넣지 않거나, 넣더라도 행을 `scheduled` 없이 **미해당**으로 구분할 수 있게 하라. FE는 과제 있는 회차만 그린다.

### 3.2 행 (참여자)

출석 탭과 **같은 사람 · 같은 `scheduleId` · 같은 `participantId`.**

| UI 열 | 필요 필드 |
|-------|-----------|
| 참여자명 | `memberName` |
| 성별 및 생년월일 | `gender`, `birthDate` (목록에 없으면 추가) |
| 소속 및 학년 | `affiliation` / `organizationName`, `grade` |
| 제출 파일 | 아래 제출 상태 + 파일명 |
| 비고 | 아래 remark |

제출 상태 (FE `submission.kind`):

| 값 | UI |
|----|-----|
| `NOT_SUBMITTED` | 미제출 |
| `SUBMITTED` | 파일명 링크 (1~2개) |
| `SCHEDULED` | 교육 진행 예정 (회차 시작 전) |

비고 (FE `remarkKind`). 날짜가 있으면 `YYYY.MM.DD` 또는 `YY.MM.DD` 라벨과 함께 내려라.

| 값 | UI |
|----|-----|
| `NONE` | `-` |
| `DEADLINE_MISSED` | 과제 기한 미준수 (`date`) |
| `REVISION_SUBMITTED` | 과제 수정 제출 (`date`) |
| `FEEDBACK_DELIVERED` | 피드백 전달 완료 (`date`) |

필터(서버에서 지원하거나, 목록 전량 + FE 필터. **전량 한 번에** 주는 것을 우선):

- `scheduleId`
- 참여자명
- 소속
- 학년
- 제출 현황 `NOT_SUBMITTED` / `SUBMITTED` (`SCHEDULED` 는 필터 옵션에 없음)

대상 행: `participantType` 이 개인 참여자 (`INDIVIDUAL` / `STUDENT` / `PARTICIPANT`).  
강사·봉사자 행을 이 목록에 넣지 마라.

---

## 4. 해야 할 일

### 4.1 목록 API (필수)

프로그램 스코프 신규 path. 회원 path를 확장하지 마라.

요청 예:

```http
GET /api/admin/programs/{programId}/assignment-submissions?scheduleId=
Authorization: Bearer <관리자>
```

- `scheduleId` 생략: 과제 있는 회차 전부
- `scheduleId` 지정: 그 회차만
- 권한: 프로그램 진행 조회와 동일 (`PROGRAM_READ` 또는 출석 목록과 같은 권한). OpenAPI에 명시하라.
- 페이지네이션: 회차 수가 적으면 배열 한 방. 참여자가 많으면 `page`/`size` 를 회차 안 행에만 써도 된다. **회차를 페이지로 자르지 마라.**

응답은 회차 그룹이어야 한다. 납작한 회원 submissions 배열만 주지 마라.

```json
{
  "items": [
    {
      "scheduleId": 601,
      "sessionNo": 1,
      "scheduleName": "1회차",
      "startAt": "2026-10-20T10:00:00+09:00",
      "endAt": "2026-10-20T12:00:00+09:00",
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
          "grade": "2학년",
          "submissionStatus": "SUBMITTED",
          "remarkKind": "FEEDBACK_DELIVERED",
          "remarkAt": "2026-10-21T09:00:00+09:00",
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

규칙:

1. `programId` 가 일반 개인이 아니면 404 또는 빈 `items`. UJAT/1사1교/Gemini 응답을 이 path에 넣지 마라.
2. 참여자 상세 과제 탭·출석 탭과 `participantId` / `scheduleId` 가 같아야 한다.
3. `files[]` 는 제출된 파일만. 미제출은 `[]` + `NOT_SUBMITTED`.
4. `MemberAssignmentSubmissionResponse` 를 그대로 재사용하지 마라. 그 스키마는 1인 스코프다. 필드를 빌려도 **새 response 타입**을 만들어라.
5. `openapi/backend.openapi.json` 에 path + schema 를 올려라.

### 4.2 파일 보기 / ZIP (이번 티켓에서 가능하면)

LNB 테이블 파일명 클릭·일괄 다운로드는 FE가 아직 coming soon 이다.  
목록에 `fileObjectId` / `downloadable` 이 있으면 1차는 충분하다.

선택:

```http
GET /api/admin/programs/{programId}/assignment-submissions/download?scheduleId=
```

없으면 다음 티켓으로 미뤄도 된다. 목록 없이 ZIP만 만들지 마라.

### 4.3 쓰지 말 것

- `GET …/users/{memberId}/applications/{applicationId}/assignment-submissions` 를 참여자마다 호출하라고 FE에 시키지 마라
- UJAT `partner-assignments` / 교육계획서·교육일지 스키마
- 출석 `attendances` 에 과제 필드를 끼워 넣기
- 기관 프로그램·1사1교 과제 LNB용으로 이 path를 일반화하기

---

## 5. 하지 말 것

- UJAT 과제 관리와 동일 path / 동일 DTO
- 기존 출석·참여자·submission-team API 시그니처 변경
- 회원 1인 assignment-submissions 계약을 깨기
- FE mock 시드를 BE가 대신 넣으라고 하기 (목록 API만)

---

## 6. Done when

1. 일반 개인 프로그램에서  
   `GET /api/admin/programs/{programId}/assignment-submissions` 가 과제 있는 회차와 개인 참여자 행을 반환한다.
2. `?scheduleId=` 는 그 회차만 반환한다.
3. 같은 프로그램 출석 목록의 `participantId` · `scheduleId` 와 맞다.
4. 강사·봉사자 행이 없다.
5. 기관/UJAT/1사1교 프로그램으로 호출하면 빈 목록 또는 404. UJAT 계획서/일지가 섞이지 않는다.
6. OpenAPI에 새 path와 response 스키마가 있다.
7. 회원 `…/users/{id}/applications/{id}/assignment-submissions` 는 그대로다.

**Last updated:** 2026-10-02
