# Cursor prompt — 개인 과제 제출 현황: 「교육 진행 예정」 판정·과제 기간 파싱 수정 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/general-individual-assignment-submission-status-period-backend-cursor-prompt-2026-10-07.md`

> **긴급도: 높음 (운영 판단 오류).** 프로그램이 진행 중이고 관리자가 공통정보에서 1차시 과제 기간을
> 오늘부터로 저장했는데도, CMS 과제 관리의 「제출 파일」이 전원 **「교육 진행 예정」**으로 나온다.
> 「과제 제출 기한」도 `-`로 표시되어 기한 미준수 비고가 계산되지 않는다.
> FE는 `submissionStatus` / `assignmentPeriodStart·End`를 **그대로 표시**하므로 FE 수정으로 해결할 수 없다.

---

## 증상 (로컬, 2026-10-07 01:1x KST)

CMS 일반 프로그램(개인) 상세 → 프로그램 진행 현황 → 과제 관리

- 재현 URL: `http://localhost:3000/programs/general?programId=186046&lnb=progress&tab=progress_assignments`
- 엔드포인트: `GET /api/admin/programs/186046/assignment-submissions`
- 화면: `1회차 과제 · 2026.10.13 00:00~00:00`, 과제 제출 기한 `-`, 참여자 전원 `submissionStatus = SCHEDULED`
- 관리자가 공통정보에서 1차시 과제 기간을 `26년 10월 7일(수) ~ 26년 10월 20일(화)`로 저장(01:12 KST)한 뒤에도 동일

### 로컬 DB 실측 (`ja_cms_local`, program_id = 186046)

| 위치 | 값 | updated_at (KST) |
|---|---|---|
| `general_program_detail.config_jsonb` → `generalCommonInfo.curriculumSessions[0]` | `title: "1차시"`, `assignmentEnabled: true`, `assignmentPeriod: "26년 10월 7일(수) ~ 26년 10월 20일(화)"` | 2026-10-07 01:12 |
| `general_program_detail.config_jsonb` → `generalCommonInfo.curriculumSessions[1]` | `title: "2차시"`, `assignmentEnabled: false` | 〃 |
| `general_program_detail.config_jsonb` → `generalCommonInfo.educationScheduleLines` | `26년 10월 20일(화) 10:00 ~ 12:00` 외 4줄 (첫 교육일 10/20) | 〃 |
| `program_schedule` (id `186617`, session_no 1) | `start_at 2026-10-12 15:00Z` (= 10/13 00:00 KST), `end_at 2026-11-07 15:00Z` | 2026-10-06 23:16 (공통정보 저장 후에도 미변경) |
| `program_schedule` session_no 2 | **없음** | — |

---

## 원인 (코드 확인 완료)

### 원인 A — 상태 판정이 `program_schedule.start_at`만 본다

`GeneralIndividualAssignmentSubmissionQueryService` → `GeneralIndividualAssignmentRosterPolicy.submissionStatus(schedule.startAt(), submitted, now)`:

```java
if (scheduleStartAt != null && now != null && scheduleStartAt.isAfter(now)) {
    return SCHEDULED;
}
```

- `program_schedule.start_at`(10/13)이 미래라서 무조건 `SCHEDULED`.
- 관리자가 저장한 **과제 기간(`assignmentPeriod`) 시작일은 판정에 쓰이지 않는다.**
- 공통정보 저장(`general_program_detail`) 시 `program_schedule`이 동기화되지 않아 값이 계속 어긋난다.

### 원인 B — 과제 기간 파서가 FE 저장 형식을 못 읽는다

`GeneralIndividualAssignmentRosterPolicy.parsePeriod`:

```java
private static final Pattern DATE = Pattern.compile("(\\d{4})[./-](\\d{1,2})[./-](\\d{1,2})");
```

- `2026.10.07` / `2026-10-07`만 매칭.
- CMS 공통정보는 `curriculumSessions[].assignmentPeriod`를 **`26년 10월 7일(수) ~ 26년 10월 20일(화)`** 형식으로 저장한다.
- 매칭 실패 → `periodFor(...)`가 `Period(null, null)` → 응답 `assignmentPeriodStart/End = null` → FE `-`, `remark()` 기한 계산 불가.

---

## 요청

### ① 과제 기간 파서가 공통정보 저장 형식을 지원

`parsePeriod`가 아래 형식을 모두 파싱하도록 확장하라 (Asia/Seoul, 시작일 00:00:00 / 종료일 23:59:59 규칙 유지).

| 입력 예 | 기대 |
|---|---|
| `26년 10월 7일(수) ~ 26년 10월 20일(화)` | 2026-10-07 ~ 2026-10-20 |
| `2026년 10월 7일 ~ 2026년 10월 20일` | 2026-10-07 ~ 2026-10-20 |
| `2026.10.07 ~ 2026.10.20` (기존) | 2026-10-07 ~ 2026-10-20 |
| `2026-10-07` (단일, 기존) | 종료일만 2026-10-07 (기존 동작 유지) |

- 2자리 연도는 `20YY`로 해석.
- 요일 괄호 `(수)`·공백 차이는 무시.
- 이미 공통정보 날짜 문자열 파서(`ProgramEducationScheduleLines` 등)가 있으면 **재사용**하고 새 정규식을 중복으로 만들지 마라.

### ② 「교육 진행 예정(SCHEDULED)」 판정 기준 변경

회차별 판정 우선순위를 다음으로 바꿔라.

1. 해당 회차에 **과제 기간 시작일**(form binding `startAt` → 공통정보 `assignmentPeriod` 파싱 결과 순, 기존 `periodFor` 우선순위 유지)이 있으면  
   → `now < periodStart`일 때만 `SCHEDULED`
2. 과제 기간 시작일이 없을 때만 기존처럼 `program_schedule.start_at` 기준
3. 제출 건이 있으면 기간과 무관하게 `SUBMITTED` (기존 유지)

기대 결과 (재현 데이터, now = 2026-10-07):

| 회차 | 과제 기간 | 기대 `submissionStatus` | 기대 `assignmentPeriodStart / End` |
|---|---|---|---|
| 1회차 (`program_schedule` 186617) | 10/07 ~ 10/20 | 미제출자 `NOT_SUBMITTED`, 제출자 `SUBMITTED` | `2026-10-06T15:00:00Z` / `2026-10-20T14:59:59Z` |

`submissionStatus` 필터(`NOT_SUBMITTED` / `SUBMITTED`)와 `matches()`도 바뀐 상태 기준으로 동작해야 한다.

### ③ 공통정보 ↔ `program_schedule` 불일치 조사·보고 (수정 여부는 판단 후 보고)

재현 데이터에서 다음이 어긋나 있다. **원인과 정책을 확인해 보고**하라. 동기화가 원래 의도된 동작이면 수정하고, 의도가 아니면 수정하지 말고 이유를 적어라.

- 커리큘럼은 1·2차시 2개인데 `program_schedule`은 session_no 1 한 줄 → 2차시 과제가 목록에 안 나옴
- `educationScheduleLines` 첫 교육일은 10/20인데 `program_schedule` 1회차는 10/13 00:00 ~ 11/08 00:00 (시간 정보 없음, 화면에 `00:00~00:00`으로 표시)
- 공통정보 저장(`ProgramServiceDetailCommandService` 계열) 시 `ProgramScheduleCommandService`로 회차가 생성·갱신되는 경로가 있는지

### ④ OpenAPI 반영

- `submissionStatus` description에 판정 규칙 명시:  
  `SCHEDULED: 과제 기간 시작 전(기간 미설정 시 회차 시작 전) | NOT_SUBMITTED | SUBMITTED`
- `assignmentPeriodStart` / `assignmentPeriodEnd` description에 출처(binding → 공통정보 assignmentPeriod) 명시

---

## 하지 말 것

- 응답 필드 추가·삭제·이름 변경 금지 (`submissionStatus`, `assignmentPeriodStart`, `assignmentPeriodEnd` 그대로)
- path·쿼리 파라미터 변경 금지
- 공통정보 JSON 저장 형식(`26년 10월 7일(수) ~ …`)을 백엔드에서 다른 형식으로 바꿔 쓰지 말 것 (CMS 편집 화면이 이 문자열을 다시 읽음)
- 프로그램 전체 진행 상태(`IN_PROGRESS` 등)만으로 회차 상태를 덮어쓰지 말 것 — 회차·과제 기간 단위 판정 유지
- 일반 기관형·UJAT·1사1교 과제/강의보고서 판정 로직 변경 금지 (개인 과제 제출 현황 한정)

## 보고 형식

1. 변경 파일과 판정·파서 변경 위치
2. ① 파서 입력별 결과 (위 표 4종)
3. 재현 데이터 확인: `GET /api/admin/programs/186046/assignment-submissions` 응답의 1회차 `assignmentPeriodStart/End`, 참여자 `submissionStatus`
4. ③ 조사 결과 (동기화 경로 유무, 수정했는지/안 했는지와 이유)
5. 테스트 이름 (한글 날짜 파싱, 2자리 연도, 과제 기간 시작 전 → SCHEDULED, 기간 중 미제출 → NOT_SUBMITTED, 기간 미설정 시 회차 시작 fallback, 제출 → SUBMITTED)
6. `docs/frontend` handoff (판정 규칙 변경 요약)

---

## FE 후속 작업 (참고, 백엔드 작업 아님)

- 없음 (FE는 `submissionStatus` / `assignmentPeriodStart·End`를 그대로 매핑:
  `apps/cms/src/features/program/general/api/adapters/progress-assignment-adapters.ts`)
- 백엔드 반영 후 과제 관리 화면에서 「미제출」 표시·과제 제출 기한·기한 미준수 비고만 재확인
