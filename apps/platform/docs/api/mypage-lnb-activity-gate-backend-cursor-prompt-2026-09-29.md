# Cursor prompt — 회원포탈 마이페이지 활동 API 게이트·상세 표시상태 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 계약과 재현만** 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(enum·NOT NULL·권한)만 하라.

이 문서는 프론트 레포 경로:

`apps/platform/docs/api/mypage-lnb-activity-gate-backend-cursor-prompt-2026-09-29.md`

확인 기준: 로컬 `GET http://localhost:8080/v3/api-docs` 와 **해당 신청을 소유한 회원 Bearer**.  
관리자 토큰으로 회원 API를 통과시키지 마라.

Platform FE는 이미 아래 path를 호출한다. **path·required·enum 라벨을 새로 만들거나 바꾸지 마라.**

| Method | Path | FE 사용 |
|--------|------|---------|
| GET | `/api/portal/me/dashboard` | 나의 홈 신청/진행/종료 건수 |
| GET | `/api/portal/me/calendar?from&to` | 나의 홈 월 달력. `from`/`to`는 `YYYY-MM-DDTHH:mm:ss` |
| GET | `/api/portal/me/program-applications` | 교육·봉사·강의 목록. query `applicationType` |
| GET | `/api/portal/me/program-applications/{applicationType}/{applicationId}` | 상세 |
| GET | `.../notices`, `.../notices/{postId}` | 안내 목록·상세 |
| GET | `.../schedules` | 교육일정·봉사 배정 |
| GET | `.../forms?formType=SURVEY\|SATISFACTION` | 설문·만족도 목록 |
| GET | `.../expense-receipts` | 정산(영수증) 목록 |
| GET | `/api/portal/me/settlement-applications` | 정산 신청 목록. `programId`로 화면에서 거른다 |
| GET | `/api/portal/public/faqs` | 문의내역 FAQ. 비로그인 허용 |
| GET/POST | `/api/portal/me/inquiries` | 1:1 목록·작성 |
| GET/DELETE | `/api/portal/me/inquiries/{inquiryId}` | 1:1 상세·삭제 |
| GET | `/api/portal/me/inquiries/category-options` | 작성 카테고리 |
| GET | `/api/portal/me/inquiries/program-options` | 작성 프로그램 |

---

## Goal

목록 `displayStatus = 진행 중` 인 내 신청에서, 안내·일정·설문·영수증 조회가 **같은 회원 Bearer로 200**이 되게 하라.  
상세 응답의 표시 상태가 목록과 같게 내려오게 하라.

로컬 재현 신청 (회원 포탈 로그인 세션, `applicationType=VOLUNTEER`):

- `applicationId` **185981**, `programId` **182105**
- 같은 제목의 다른 신청 id가 더 있다(182981, 185961, 182961, 185941, 182941). 중복 렌더가 아니다. **id를 합치거나 지우지 마라.**

목록 항목 `displayStatus`는 `진행 중` 또는 `결과 대기`다.  
상세 `GET .../VOLUNTEER/185981` 은 `applicationStatus=FINAL_SELECTED`, `cancellable=false`, `capabilities.canCancelApplication=false`, `participation` 이 비어 있거나 `participantId`가 없고, `summary.scheduleCount=14` 였다. 상세 JSON에는 **`displayStatus` 필드가 없다.**

같은 Bearer로 측정한 활동 API:

| 호출 | 결과 |
|------|------|
| `GET .../VOLUNTEER/185981/notices` | **200**, `items: []`, `totalElements: 0` |
| `GET .../VOLUNTEER/185981/schedules` | **403** `error.code=PARTICIPATION_REQUIRED`, message `선정된 프로그램 참여자만 이용할 수 있습니다.` |
| `GET .../VOLUNTEER/185981/forms?formType=SURVEY` | **403** 같은 코드 |
| `GET .../VOLUNTEER/185981/expense-receipts` | **403** 같은 코드 |

`summary.scheduleCount=14` 인데 일정 GET이 403인 상태가 버그다.  
FE는 이 403을 빈 목록으로 숨기지 않고 `배정현황을 불러오지 못했습니다.`로 보여 준다.

---

## Out of scope / 금지

- Platform·CMS 프론트 수정.
- 위 표의 path 추가·이름 변경·required 변경.
- `ApplicationListItemResponse.displayStatus` enum 값 변경. 허용 값은 지금과 같다: `결과 대기`, `서류 합격`, `진행 중`, `진행 완료`, `활동 포기`, `신청 반려`, `작성 중`, `신청 취소`.
- `ApplicationSummary` 필드 의미 변경. FE는 나의 홈을 이렇게 더한다: 신청 = `submitted + approved`, 진행 = `inProgress`, 종료 = `completed + giveUp + rejected + cancelled`. draft는 신청 카드에 넣지 않는다.
- 2026-09 달력이 비어 있는 것을 버그로 채우지 마라. 해당 월에 `PortalScheduleItem`이 없으면 빈 배열이 맞다.
- 문의 FAQ가 0건인 것을 가짜 회원 문의로 만들지 마라. 공개 FAQ는 §4.
- TRUNCATE. prod Flyway에 운영 카피를 넣지 마라.
- 강사 정산 path (`/api/portal/me/instructor-assignments/{assignmentId}/settlement-applications/*`) 를 일반 회원 영수증 path와 합치지 마라.

---

## 1. 진행 중 신청의 활동 API 403

목록 `displayStatus`가 `진행 중` 또는 `진행 완료`인 신청은, 그 회원의 Bearer로 아래가 **403 `PARTICIPATION_REQUIRED`가 아니어야** 한다.

- `GET .../schedules`
- `GET .../forms?formType=SURVEY`
- `GET .../forms?formType=SATISFACTION`
- `GET .../expense-receipts`
- `GET .../notices` (이미 200이면 유지)

원인으로 볼 곳:

1. `applicationStatus`가 `FINAL_SELECTED`(또는 목록에서 `진행 중`으로 바꾸는 상태)인데 `participation` 행이 없어 활동 API만 참여자 가드를 탄다.
2. 상세 `summary.scheduleCount`는 일정이 있다고 세고, schedules GET은 참여자 가드로 막는다.

고치는 방법 (둘 중 데이터 모델에 맞는 하나. path는 유지):

- 선정 확정 시 참여 행을 만들고, 활동 API 가드가 그 행을 이 신청의 소유 회원으로 인식하게 한다. 또는
- 활동 API 가드를 목록 `displayStatus`와 같게 맞춘다. `진행 중`/`진행 완료`면 조회를 허용한다. 미선정(`결과 대기`, `신청 반려`, `작성 중`, `신청 취소`)은 지금처럼 403이어도 된다.

허용 후 응답:

- 일정이 없으면 **200** `items: []`. 403이 아니다.
- 일정이 있으면 `EducationScheduleItem` 과 같은 기존 필드(`scheduleId`, `sessionNo`, `title`, `startAt`, `endAt`, `locationName`, `scheduleStatus`, `attendanceStatus`)로 200.
- `formType` 쿼리는 `SURVEY`, `SATISFACTION` 을 받는다. 다른 값으로 바꾸지 마라.
- 영수증이 없으면 **200** 빈 목록.

185981만이 아니라, 목록 `displayStatus=진행 중` 인 VOLUNTEER 185961·182961·182981 도 같은 규칙이다.  
`결과 대기` 인 185941·182941 은 활동 API를 열 필요가 없다.

---

## 2. 상세 `displayStatus`를 목록과 같은 값으로

`ApplicationListItemResponse.displayStatus` 는 있다.  
`ApplicationDetailResponse` 스키마에는 **`displayStatus`가 없다.**

상세 200 바디에 목록과 **같은 계산·같은 enum 문자열**로 `displayStatus`를 넣어라.  
예: 목록이 `진행 중`이면 상세도 `진행 중`. `FINAL_SELECTED` 원문만 주고 화면 라벨을 비우지 마라.

같이 맞출 것:

- `cancellable` 과 `capabilities.canCancelApplication` 은 목록 `cancellable` 과 같다. `진행 중`인데 취소 불가면 둘 다 `false`.
- `participation.status` / `completionStatus` 가 있으면 상세에 채운다. 참여 행을 §1에서 만들었다면 `participantId`가 null이면 안 된다.
- 기존 필드 삭제·rename 금지. 추가는 optional로.

FE는 필드가 없을 때 `applicationStatus`로 임시 매핑한다(`FINAL_SELECTED` → 진행 중, `WAITING_REVIEW` → 결과 대기).  
필드를 내리면 그 임시 매핑보다 **응답 값이 우선**이다. enum 밖 문자열을 넣지 마라.

---

## 3. 목록 카드 모집 기간

`ApplicationListItemResponse` 에는 `educationStartAt` / `educationEndAt` 만 있고 모집 시작·종료가 없다.  
상세 `program`(`ProgramSummary`)에는 `recruitmentStartAt` / `recruitmentEndAt` 가 있다.

목록 항목에 아래 **optional** 필드를 추가하라. 이름은 `ProgramSummary`와 같다.

- `recruitmentStartAt` (date-time, nullable)
- `recruitmentEndAt` (date-time, nullable)

값이 없으면 null. 진행 기간 필드를 모집 기간에 복사하지 마라.  
기존 `educationStartAt` / `educationEndAt` 의미는 유지한다.

---

## 4. 공개 FAQ·안내 시드 (로컬만, 비어 있을 때)

측정:

- `GET /api/portal/public/faqs` → 200, `items: []`, `totalElements: 0`
- `GET .../VOLUNTEER/185981/notices` → 200, `items: []`

화면이 빈 상태를 보여주는 것은 맞다.  
로컬에서 마이페이지 FAQ·진행 중 안내를 확인해야 하면 **공개 FAQ**와 **그 신청에 연결된 안내 글**을 로컬 시드로 1건 이상 넣어라.

- FAQ는 `PublicFaqItemResponse`: `faqId`, `categoryName`, `title`, `content`. 비로그인 `GET /api/portal/public/faqs`에 포함한다.
- 안내는 회원 Bearer `GET .../notices` 의 `items[]`에 `postId`, `title`, `unread`, `createdAt` 이 있고, `GET .../notices/{postId}` 에 `content`가 있다.
- 운영 DB에 이 시드를 Flyway로 넣지 마라.

---

## 5. 바꾸지 말 것 (이미 FE가 이 계약으로 동작함)

- 나의 홈 건수는 §Out of scope의 `ApplicationSummary` 합이다. 교육/봉사 LNB 탭 건수와 숫자가 달라도 필드를 나누지 마라. 홈은 회원 전체 신청 합계다.
- 1:1 목록 `MemberPortalInquiryListItem` 에는 본문이 없다. FE는 펼칠 때 `GET /api/portal/me/inquiries/{inquiryId}` 로 `content`·`answers[].content`를 읽는다. 목록에 본문을 억지로 넣지 않아도 된다.
- 작성 body는 `MemberPortalInquiryCreateRequest`: `category`, `title`, `content` required, `programId` optional. `해당 없음`은 `programId` 생략이다.
- 문의 프로그램 옵션은 `GET .../inquiries/program-options` 배열(`programId`, `programName`)이다. 이 path를 유지하라.
- 정산 **작성 화면**과 설문 **본문 제출**은 아직 FE가 목록만 붙였다.  
  제출 path는 이미 있다: `POST /api/portal/me/form-responses/submit`, `POST .../expense-receipts`, `POST /api/portal/me/programs/{programId}/form-bindings/{bindingId}/responses`.  
  이번 작업에서 그 path를 새로 만들거나 영수증 POST를 정산 신청 POST로 바꾸지 마라. §1이 200이 되면 FE가 이어서 붙인다.

---

## Done 기준

회원 Bearer, `VOLUNTEER` **185981**:

1. `GET .../schedules` → 200. 403 `PARTICIPATION_REQUIRED` 가 아니다. 일정이 있으면 `items.length >= 1` 이고 `summary.scheduleCount`와 모순되지 않는다. 없으면 `items: []`.
2. `GET .../forms?formType=SURVEY` → 200. `formType=SATISFACTION` 도 200.
3. `GET .../expense-receipts` → 200.
4. `GET .../VOLUNTEER/185981` 의 `displayStatus`가 목록과 같은 `진행 중`이다.
5. 목록 `GET /api/portal/me/program-applications?applicationType=VOLUNTEER` 항목에 `recruitmentStartAt`/`recruitmentEndAt` 키가 있다. 모르는 값이면 null.
6. `결과 대기` 신청(185941 또는 182941)의 schedules GET은 403이어도 된다. `진행 중`과 응답이 같으면 안 된다.
7. `displayStatus` enum 문자열과 기존 path는 diff에 변경이 없다.

답변에 185981 schedules의 HTTP status, `items.length`, 상세 `displayStatus`, 참여 행을 만들었는지 여부만 적어라.
