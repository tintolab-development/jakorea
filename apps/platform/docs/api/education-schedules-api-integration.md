# 마이페이지 교육일정 탭 — Portal API 계약

화면: 사용자 플랫폼 > 마이페이지 > 교육 현황 상세 > **교육일정** 탭

목록 SSOT: `GET /api/portal/me/program-applications/{applicationType}/{applicationId}/schedules`

FE는 이 탭에서 프로그램 상세(`curriculumSessions` / `scheduleDetails`)를 목록 SSOT로 쓰지 않는다. BE가 프로그램 교육 진행 정의를 신청 건 회차 `items[]`로 펼쳐 준다.

과제가 전 일정에 없어도 **일정 카드는 노출**한다. `assignment`가 없거나 `enabled=false`이면 과제 블록만 숨긴다.

## BE 확인 합의 (2026-10-12)

### 1. `items[]` 출처 — **A**

카드 개수·순서 SSOT는 프로그램 교육 진행 정의(`curriculumSessions` / `scheduleDetails`)다. 출석·과제는 `sessionNo` / `program_schedule_id`(`scheduleId`)로 join한다.

- 운영 `program_schedule`만 있으면 정의에 있는 차시·일정이 빠져 카드가 안 나온다. 요구사항(과제 없어도 일정 항목 노출)과 맞지 않는다.
- 운영 행과 정의가 **1:1**이면 내부 구현은 B여도 된다. 다만 GET `items.length`·순서가 정의와 같아야 한다.
- `scheduleId`는 운영 행이 있으면 넣고, 아직 없어도 **카드는 내려준다**. 이번 범위는 읽기만이라 쓰기 키가 비어도 된다.

### 2. 이번 작업 범위 — **읽기만**

`GET .../schedules` 목록을 아래 계약에 맞게 확장한다.

- 과제 제출 POST, 결석 사유 POST는 **이번 범위 밖**. FE 버튼은 아직 「준비 중」.
- 결석 사유 쓰기는 신규 `POST .../absence-reason`(단수)를 만들지 않는다. 기존 `.../absence-reasons`(복수)를 유지한다. FE가 제출을 붙일 때 그 경로를 쓴다.
- GET item의 `absenceReason`은 기존 결석 사유 저장값을 실어 주면 된다.
- 과제 제출 POST / 기존 form submit 관계는 쓰기 라운드에서 따로 정한다.

---

## 현재 FE가 읽는 필드

```
scheduleId, sessionNo, title, startAt, endAt, locationName,
scheduleStatus, attendanceStatus, surveyCount
```

`scheduleStatus`, `surveyCount`는 교육일정 탭에서 쓰지 않는다. 유지해도 되고 빼도 된다.

이미 있는 읽기 API:

- `GET /api/portal/me/form-responses/{formResponseId}/feedback`

과제 제출·결석 사유 POST는 FE에 없다. 버튼은 「준비 중」.

---

## 4조합

프로그램 상세와 같은 축:

- `educationStructure`: `CURRICULUM` | `SCHEDULE`
- `sessionRound`: `SINGLE` | `MULTI`

**단일회차 = item 1개가 아니다.** 단일이어도 차시/세부일정이 여러 줄일 수 있다. 카드 1장 = `items` 1개.

| 조합 | items 출처 | 행 라벨 | `title` | 상세 |
| --- | --- | --- | --- | --- |
| 커리큘럼 × 단일 | `curriculumSessions[]` | `sessionLabel` 예 `1차시` (없으면 `N차시`) | 단원명 | `content`, `startAt`/`endAt` |
| 커리큘럼 × 복수 | 동일 | `sessionLabel` 예 `1회차` (없으면 `N회차`) | 단원명 | 동일 + 회차별 과제기간 |
| 일정 × 단일 | `scheduleDetails[]` | `scheduleLabel` 예 `세부 일정 01` | 일정명 | `progressTimeLabel` 또는 `groupTimes`, `blockKind` |
| 일정 × 복수 | 동일 | `세부 일정` → `행사 일정` (프로그램 상세와 동일) | 일정명 | 날짜+시간을 한 줄 |

과제·출석·결석 사유는 4조합 모두 **item 단위**.

- `blockKind`는 일정형만: `PRE_EDUCATION` | `SUB` | `EVENT`. 커리큘럼은 omit.
- `groupTimes[]` `{ startTime, endTime }`는 일정형 그룹 시간. `progressTimeLabel`과 둘 중 하나 또는 둘 다.

---

## GET `/schedules` 응답

```ts
type EducationStructure = 'CURRICULUM' | 'SCHEDULE'
type SessionRound = 'SINGLE' | 'MULTI'

type ScheduleListResponse = {
  educationStructure: EducationStructure
  sessionRound: SessionRound
  items: ScheduleItem[]
}

type ScheduleItem = {
  scheduleId: number
  sessionNo: number
  startAt: string
  endAt?: string
  title: string
  locationName?: string
  attendanceStatus?: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' | null
  absenceReason?: string

  sessionLabel?: string
  unitName?: string
  content?: string

  scheduleLabel?: string
  scheduleName?: string
  blockKind?: 'PRE_EDUCATION' | 'SUB' | 'EVENT'
  progressTimeLabel?: string
  groupTimes?: Array<{ startTime?: string; endTime?: string }>

  assignment?: Assignment | null
}

type Assignment = {
  enabled: boolean
  submitStartAt: string
  submitEndAt: string
  periodLabel?: string
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'FEEDBACK' | 'REVISION_SUBMITTED'
  formResponseId?: number
  submissions?: Array<{
    id: number | string
    kind: 'FILE' | 'URL'
    fileName: string
    url?: string
  }>
}
```

빈 `items` → 탭 empty (`등록된 교육일정이 없어요.`).

### 일정 필드

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `scheduleId` | required | 행 id, 쓰기 API 키 |
| `sessionNo` | required | 1-based. 활동 포기 `lastParticipatedSession` 필터 |
| `startAt` | required | ISO. 카드 날짜 + 진행 완료/예정 |
| `endAt` | optional | ISO. 진행 시간 |
| `title` | required | 카드 서브타이틀. 커리큘럼=단원명, 일정형=일정명 |
| `sessionLabel` | optional | 커리큘럼 `1차시` / `1회차` |
| `scheduleLabel` | optional | 일정형 `세부 일정 01` / `행사 일정 01` |
| `blockKind` | optional | 일정형만 |
| `unitName` | optional | 단원명. `title`과 같으면 생략 가능 |
| `content` | optional | 교육내용 (커리큘럼 `description`) |
| `scheduleName` | optional | 일정명. `title`과 같으면 생략 가능 |
| `progressTimeLabel` | optional | 없으면 FE가 `startAt`~`endAt` 포맷 |
| `groupTimes` | optional | 일정형 그룹 시간 |
| `locationName` | optional | 장소 |
| `attendanceStatus` | optional/null | `PRESENT` \| `LATE` \| `ABSENT` \| `EXCUSED`. 예정 회차 null |
| `absenceReason` | optional | `EXCUSED`일 때 카드에 표시 |

### 과제 필드 (`assignment`)

null/omit 또는 `enabled=false` → 과제 블록 숨김, 일정 카드는 유지.

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `enabled` | required if object | false면 블록 숨김 |
| `submitStartAt` | enabled일 때 required | ISO. 이 시각 전 과제 블록 숨김 |
| `submitEndAt` | enabled일 때 required | ISO. 마감 후 문구 분기 |
| `periodLabel` | optional | 없으면 FE가 start~end 포맷 |
| `status` | enabled일 때 required | 아래 enum |
| `formResponseId` | FEEDBACK일 때 필요 | 피드백 GET 키 |
| `submissions` | 제출 완료 시 | 칩 표시 |

`status`:

| 값 | UI |
| --- | --- |
| `NOT_SUBMITTED` | [과제 제출하기] |
| `SUBMITTED` | 제출 파일/링크 칩. 마감 전 재제출 가능 |
| `FEEDBACK` | [피드백 확인] + [수정 제출하기] |
| `REVISION_SUBMITTED` | 수정 제출 완료, 제출 버튼 비활성 |

`submissions[]`:

| 필드 | 설명 |
| --- | --- |
| `id` | string 또는 number |
| `kind` | `FILE` \| `URL` |
| `fileName` | 칩 라벨 |
| `url` | 확인용 optional |

제출 수단: **파일 첨부 또는 링크**. 둘 다 허용.

---

## 쓰기 API (이번 범위 밖)

이번 BE 작업은 GET 확장만. 아래는 FE가 제출 UI를 붙일 때 쓸 예정이며, **신규 단수 경로를 만들지 않는다.**

### 과제 제출/수정 (미구현, 경로 미확정)

FE는 「준비 중」. 기존 form submit과 맞출지, `POST .../schedules/{scheduleId}/assignment`를 둘지는 쓰기 라운드에서 정한다.

- 예정 body: `files[]` 및/또는 `urls[]`
- 마감 전 재제출, 피드백 후 수정 제출은 같은 제출 API

### 결석 사유 (기존 유지)

`.../absence-reasons` (복수). 신규 `POST .../absence-reason` 단수는 쓰지 않는다.

- FE 노출 조건: 진행 예정, 또는 출석=`ABSENT`
- GET item `absenceReason`에 저장된 사유를 내려 준다

### 피드백 확인 (기존)

`GET /api/portal/me/form-responses/{formResponseId}/feedback`

목록 `assignment.formResponseId`와 연결한다.

---

## FE 후속 (BE 합의 후)

- `apps/platform/src/features/mypage/education/schedules/lib/map-from-portal.ts`에 assignment / absence / 상세 문구 매핑
- Row / AssignmentBlock UI는 mock 구조 유지
- 제출·결석 버튼의 「준비 중」은 쓰기 API 연결 후 교체

---

## GENERAL_INDIVIDUAL · `INDIVIDUAL` 신청 (2026-10-14)

### 제품·BE 기대

- 교육일정 탭은 **신청 건(applicationId) 단위** 목록이다.
- 노출 행: **사전 교육 등 필수** (`scheduleCurriculumPreEducation` / `PRE_EDUCATION`) **+** 해당 신청의 희망 일정 (`preferredEducationSchedules`, form `line:N` / `schedule:id`).
- OpenAPI: participant/volunteer는 **CMS 확정 education-scope**와 Portal 목록이 같아야 하고, `scopeStatus=ASSIGNMENT_SCOPED`가 확정 스코프의 정상 모드다.

### Platform FE (현재)

- **합성·필터 없음** — `GET .../schedules` 응답만 렌더.
- 신청 탭 「진행 희망 교육 일정」은 신청 상세·answers lookup — **교육일정 탭과 API 분리**.
- `scheduleId === null` → 출석·결석 블록 숨김 ([`EducationScheduleRow`](../../src/features/mypage/education/schedules/ui/row.tsx)).

### CMS · Admin

- 개인 **참여자** participant에 대한 `GET/PUT .../education-scope` **화면 없음** (API는 존재).
- `education-scope` API를 쓰는 CMS UI: 일반 개인 프로그램 **참여 봉사자 → 봉사 배정 현황**만.
- 개인 신청 승인: `POST .../approve` (CMS). `approve-with-education-scope` **미연동**.

### BE 이슈 재현 (handoff)

- applicationId `1694669`, participantId `1694770`, programId `186099` — 신청 `line:0`/`line:1` 저장됐으나 schedules **정의 4행 전체**, `RECORDED_ONLY`, `scheduleId` 없음, `summary.scheduleCount: 0`.
- JABACK 요청서: [`portal-individual-education-schedules-scope-backend-request-2026-10-14.md`](./portal-individual-education-schedules-scope-backend-request-2026-10-14.md)

### OpenAPI 문서 tension (BE 정리 요청)

- `items` description(정의 SSOT) vs operation description(확정 스코프) — **INDIVIDUAL Portal 목록**은 **participant eligible scope**로 문서·구현 일치 필요.
