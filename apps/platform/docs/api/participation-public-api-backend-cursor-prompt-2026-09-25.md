# Cursor prompt — Platform 참여하기 잔여 공개 계약 (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 계약만** 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(enum·NOT NULL·권한)만 하라.

이 문서는 프론트 레포 경로:

`apps/platform/docs/api/participation-public-api-backend-cursor-prompt-2026-09-25.md`

확인 기준: 2026-09-25 로컬 `GET http://localhost:8080/v3/api-docs` (OpenAPI 3.1, version `v9`).

이미 있는 목록·상세는 프론트가 쓰고 있다. 이 작업은 **없는 공개 계약만** 채운다.

- `GET /api/portal/programs`, `GET /api/portal/programs/{programId}` 는 유지.
- `GET /api/portal/public/notices` 는 **공지**다. 라이브 카테고리명은 `공지`이고 스키마 설명은 「공개 공지사항」이다. 결과 확인 화면을 이 path에 붙이지 마라.
- 신청 옵션·신청폼 조회·임시저장·제출 path는 있다. `form`과 `answers`만 타입이 없다. path를 새로 만들지 마라.

---

## Goal

1. 로그인 없이 보는 **결과 확인** 목록·상세 API를 추가한다.
2. `ProgramDetailResponse`에 상세 화면이 요구하는 **선택 필드**를 덧붙인다. 기존 필드를 지우거나 이름을 바꾸지 마라.
3. 신청폼 `form` / `answers`의 JSON 모양을 OpenAPI에 적는다. 저장 경로는 유지한다.

---

## Out of scope / 금지

- `GET /api/portal/programs`, `GET /api/portal/programs/{programId}` 의 기존 필드 삭제·rename·필수화.
- `applicationPathId`에 지원 방법 문장을 넣기. 이 필드는 설명도 없고 라이브 값은 `null`이다. 지원 방법은 아래 신규 문자열 필드로만 내려라.
- `GET /api/portal/public/notices`, `GET /api/portal/public/notices/{noticeId}` 를 결과 확인 응답으로 재사용하거나, 공지 카테고리에 합격 글을 섞기.
- `GET /api/portal/programs/{programId}/application-options`
- `GET /api/portal/programs/{programId}/form-bindings/{bindingId}` (`operationId` `renderApplicationForm`)
- `PUT /api/portal/programs/{programId}/applications/draft` (`operationId` `saveDraft`)
- `POST /api/portal/programs/{programId}/applications` (`operationId` `submit_1`)
- 위 네 path의 required (`recruitmentId`, `applicationType`, `formBindingId`), `requestedSchedules` max 3, `preferredScheduleBlocks` max 10 변경.
- 신청 **접수** 전용 알림 `eventType` 신설.
- Platform·CMS 프론트 수정.
- TRUNCATE. prod Flyway에 운영 카피를 넣지 마라.

---

## 유지 (변경 금지)

| Method | Path | 역할 |
|--------|------|------|
| GET | `/api/portal/programs` | 참여하기 목록. 로그인 불필요 |
| GET | `/api/portal/programs/{programId}` | 참여하기 상세. 로그인 불필요 |
| GET | `/api/portal/public/notices` | 공지 목록. 결과 확인이 아님 |
| GET | `/api/portal/public/notices/{noticeId}` | 공지 상세 |
| GET | `/api/portal/programs/{programId}/application-options` | 신청 옵션. 회원 Bearer. 라이브 무토큰은 401 |
| GET | `/api/portal/programs/{programId}/form-bindings/{bindingId}` | 신청폼 조회. query `recruitmentId`, `applicationType` 둘 다 필요 |
| PUT | `/api/portal/programs/{programId}/applications/draft` | 임시저장. body `SaveApplicationRequest` |
| POST | `/api/portal/programs/{programId}/applications` | 최종 제출. body `SaveApplicationRequest`. 응답 `ApplicationSaveResponse` |

---

## 1. 결과 확인 (신규, 공개)

로그인 없이 호출한다. 공지 API와 저장소가 같아도 **응답 path는 분리**한다. 카테고리가 `최종 합격 발표` 또는 `서류 심사 결과`인 글만 내려라. `공지`, `필독`, `안내`, `정산`, `시스템`, `봉사단`, `강사단`은 이 API에 넣지 마라.

```http
GET /api/portal/public/program-results
GET /api/portal/public/program-results/{resultId}
```

목록 query (전부 optional, 없으면 아래 기본값):

| query | 기본 | 의미 |
|-------|------|------|
| `page` | `0` | 0-base |
| `size` | `10` | 페이지 크기 |
| `categoryId` | 생략 = 전체 | 위 두 카테고리 id만. 그 외 id는 400 |
| `keyword` | 생략 | **제목과 본문**을 함께 검색. 제목만 검색하지 마라 |
| `sort` | `LATEST` | `LATEST`(발표일 내림차순) 또는 `TITLE`(제목 가나다) |

목록 항목:

| 필드 | 타입 | 화면 |
|------|------|------|
| `resultId` | int64 | 상세 path |
| `categoryId` | int64 | 탭 필터 |
| `categoryName` | string | `최종 합격 발표` 또는 `서류 심사 결과` |
| `title` | string | 제목 |
| `announcedAt` | date-time | 발표일. 작성 시각과 같으면 그 값을 써라 |
| `viewCount` | int64 | 목록에는 없어도 된다 |

목록 래퍼는 `items`, `page`, `size`, `totalElements`, `totalPages`. 카테고리 탭용으로 허용 카테고리 배열 `categories: [{ categoryId, categoryName }]` 를 같은 응답 또는 `GET /api/portal/public/program-results/categories` 중 한곳에 넣어라. 이름 순서가 바뀌어도 id는 유지한다.

상세:

| 필드 | 타입 | 화면 |
|------|------|------|
| `resultId` | int64 | |
| `categoryId` | int64 | |
| `categoryName` | string | 배지 |
| `title` | string | |
| `announcedAt` | date-time | `2026년 01월 15일 오후 3:00` 형태로 프론트가 포맷한다. 서버는 ISO-8601 |
| `viewCount` | int64 | 조회수. 같은 이용자·같은 글은 쿠키 기준 1일 1회만 증가 (공개 공지 상세와 같은 규칙) |
| `content` | string | HTML 본문 |
| `attachments` | array | 없으면 빈 배열. 항목은 `originalFilename`, `fileSize`, `downloadEndpoint` |
| `previous` | object 또는 null | `{ resultId, title }`. 같은 정렬·같은 카테고리 기준 이전 글 |
| `next` | object 또는 null | `{ resultId, title }` |

없는 id는 404. 비공개·다른 카테고리 글은 404. 첨부 다운로드는 로그인 없이 받게 하라. 기존 공개 파일 path가 있으면 그 `downloadEndpoint`를 재사용하고, 새 업로드 path를 만들지 마라.

---

## 2. 프로그램 상세 선택 필드 (기존 GET에 추가)

`GET /api/portal/programs/{programId}` 의 `ProgramDetailResponse`에 **optional** 로만 추가한다. 값이 없으면 `null` 또는 필드를 생략한다. 빈 문자열로 채우지 마라.

프로그램:

| 필드 | 타입 | 화면 라벨 |
|------|------|-----------|
| `applicationMethod` | string | 지원방법. 버튼 안내 문장. `applicationPathId`와 별개 |

모집 `RecruitmentResponse` (해당 모집 행에):

| 필드 | 타입 | 화면 |
|------|------|------|
| `interviewEnabled` | boolean | `false`면 서류·면접 행을 만들지 마라. 프론트도 숨긴다 |
| `documentPassAnnouncementAt` | date-time | 1차 서류 합격자 발표. `interviewEnabled`가 true일 때만 의미 있음 |
| `interviewStartAt` | date-time | 2차 면접 기간 시작 |
| `interviewEndAt` | date-time | 2차 면접 기간 끝 |
| `finalPassAnnouncementAt` | date-time | 최종 합격자 발표. 면접이 없어도 있으면 내려라 |

관리자 프로그램·모집에 이미 같은 의미의 컬럼이 있으면 **그 값을 복사**하고 컬럼을 새로 만들지 마라. 없으면 nullable 컬럼을 추가한다. 기존 컬럼명이 다르면 답변에 admin 필드명과 portal 필드명의 대응을 적어라. portal 응답 키는 위 표 그대로다.

일정 `ScheduleResponse` (UJAT 공개 일정용, optional):

| 필드 | 타입 | 의미 |
|------|------|------|
| `term` | string | `FIRST_HALF` 또는 `SECOND_HALF`. 아니면 `null` |
| `scheduleKind` | string | `PRE_EDUCATION`(사전교육), `EDUCATION`(교육), `CLOSING`(수료·폐회), `SESSION`(일반 회차) |
| `publiclyVisible` | boolean | `false`면 이 일정은 공개 상세 배열에 **넣지 마라**. 선택 불가 요일을 숨기는 규칙이다 |

`learningSupportContent`, `otherMatters`는 이미 있다. 키를 바꾸지 마라. 대상별 숨김은 프론트가 한다.

라이브 `GET /api/portal/programs/186025` (2026-09-25)에는 `applicationMethod`, 서류·면접·최종 합격 시각, `term`, `scheduleKind`, `publiclyVisible`이 없다. `recruitments[0].selectionMethod`는 `null`이다. `selectionMethod`를 발표일로 쓰지 마라.

---

## 3. 신청폼 JSON 모양 (path 유지, 스키마만)

프론트 렌더러가 받는 draft는 `paragraphs` 배열이 있는 작성 양식 JSON이다. 지금 `ApplicationFormResponse.form`과 `draftAnswers`, `SaveApplicationRequest.answers`는 `additionalProperties`뿐이라 프론트가 시드 양식을 걷어낼 수 없다.

OpenAPI에 아래를 적어라. 예시 값은 개인정보가 없는 한 건이다.

1. `form`은 CMS에 저장된 **그 프로그램 신청 양식 템플릿 버전 문서**다. 최소로 `paragraphs` 배열이 있어야 한다. 문단 id는 템플릿에 저장된 id 그대로다.
2. `draftAnswers`와 `answers`의 키는 **문단 id**다. 값은 그 문단의 답(문자열, 문자열 배열, 또는 객)이다. 키 규칙을 한 줄로 적어라.
3. `GET .../form-bindings/{bindingId}` 가 임시저장이 있으면 `draftAnswers`를 채운다. 없으면 `null` 또는 `{}`.
4. `PUT` draft와 `POST` submit은 같은 `answers` 키 규칙을 받는다.

path, required, 일정 배열 상한은 바꾸지 마라. 스키마를 적을 수 없으면 코드는 건드리지 말고, 답변에 「미정」과 저장소에 들어 있는 JSON 한 건(개인정보 제거)만 붙여라.

---

## 완료 조건

1. `GET /api/portal/public/program-results` 와 `GET /api/portal/public/program-results/{resultId}` 가 OpenAPI에 있고, 무토큰 200이다. 공지 카테고리 글은 목록에 없다.
2. `ProgramDetailResponse` / `RecruitmentResponse` / `ScheduleResponse`에 섹션 2의 optional 키가 있다. 기존 키 이름은 diff에 삭제되지 않는다.
3. `form`·`answers` 키 규칙이 OpenAPI description 또는 답변 예시에 있다. 신청 path 네 개의 required와 maxItems는 그대로다.
4. 답변에 공개 결과 목록 1페이지와 프로그램 상세 1건(개인정보 없는 값)을 붙인다. 지원방법은 `applicationMethod`에만 있다.
