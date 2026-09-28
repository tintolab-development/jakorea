# Cursor prompt — 참여하기 목록 탭·모집상태 (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
Homepage Admin(`JAHOMEADMINBACK`, `:8081`)은 이 화면의 프로그램 목록이 아니다. 그 레포를 수정하지 마라.  
프론트 레포를 전부 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/platform/docs/api/programs-portal-tab-category-backend-cursor-prompt-2026-09-29.md`

확인 기준: 로그인 없이 `GET http://localhost:8080/api/portal/programs`.  
Platform `/programs` 는 이미 이 API만 쓴다. mock 카탈로그를 붙이지 않았고, 이번 작업에서 프론트를 고치지 마라.

| Method | Path | 화면 |
|--------|------|------|
| GET | `/api/portal/programs` | 참여하기 목록. 전체 탭은 `portalTab` 생략. `page` 0-base, `size=10` |
| GET | `/api/portal/programs?portalTab=YOUTH_YOUNG` | 청소년·청년 |
| GET | `/api/portal/programs?portalTab=ORGANIZATION` | 기관 |
| GET | `/api/portal/programs?portalTab=INSTRUCTOR` | 강사 |
| GET | `/api/portal/programs/{programId}` | 상세 |

path·쿼리 이름·`recruitmentStatus` enum(`UPCOMING` / `OPEN` / `CLOSED`)을 바꾸지 마라.

---

## Goal

같은 `programId`가 탭마다 다른 모집 배지로 나오지 않게 하라.  
`portalCategories`는 그 프로그램에 **실제로 있는 모집 대상**만 담아라.

로컬 측정 (2026-09-29, `sort=LATEST`, `size=50`):

| 탭 | totalElements |
|----|----------------|
| 전체 (`portalTab` 없음) | 28 |
| `YOUTH_YOUNG` | 12 |
| `ORGANIZATION` | 24 |
| `INSTRUCTOR` | 9 |

세 탭 합이 28보다 큰 것은 한 프로그램이 여러 `portalCategories`에 들어가기 때문이다.

---

## 재현

### 1. 같은 프로그램의 `recruitmentStatus`가 탭마다 다름

`programId` **182102**, 제목 `2026년 JA Korea 대학생경제교육봉사단 (기관 모집)`, `programType=UJAT`.

| 호출 | `recruitmentStatus` |
|------|---------------------|
| `GET /api/portal/programs` (전체) | `OPEN` |
| `GET /api/portal/programs?portalTab=ORGANIZATION` | `OPEN` |
| `GET /api/portal/programs?portalTab=YOUTH_YOUNG` | `CLOSED` |

기관 모집 프로그램을 청소년·청년 탭에 `CLOSED`로 넣지 마라.  
이 프로그램의 기관 모집이 열려 있으면 `ORGANIZATION`에서만 `OPEN`이면 된다. 청소년·청년 탭에 넣을 봉사 모집이 없으면 그 탭 결과에서 빼라.

### 2. `portalCategories`가 모집 대상보다 넓음

목록 행 기준:

| programId | programType | portalCategories | availableApplicationTypes |
|-----------|-------------|------------------|---------------------------|
| 168008 | `GENERAL_INDIVIDUAL` | `INSTRUCTOR`, `YOUTH_YOUNG` | `INDIVIDUAL`, `INSTRUCTOR`, `VOLUNTEER` |
| 168005 | `GENERAL_INDIVIDUAL` | `YOUTH_YOUNG` | `INDIVIDUAL` |
| 168004 | `GENERAL_ORGANIZATION` | `INSTRUCTOR`, `ORGANIZATION`, `YOUTH_YOUNG` | `INSTRUCTOR`, `ORGANIZATION`, `VOLUNTEER` |
| 168001 | `GENERAL_ORGANIZATION` | `INSTRUCTOR`, `ORGANIZATION` | `INSTRUCTOR`, `ORGANIZATION` |
| 186001 | `TRAINED_TEACHER` | `ORGANIZATION` | (기관 탭에만 노출) |
| 182103 | `UJAT` | 청소년·청년·기관 양쪽에 노출 | 봉사 신청만 CMS에 15건. 기관 신청 0건 |
| 182102 | `UJAT` | 청소년·청년·기관 | 기관 신청 5건. 봉사 신청 0건 |

`168005`처럼 개인 모집만 있으면 `portalCategories`는 `["YOUTH_YOUNG"]` 하나다. 이 형태를 유지하라.  
`168008`·`168004`처럼 강사·봉사 모집이 없는데 그 탭 코드가 들어가 있으면 빼라. 모집이 실제로 있을 때만 해당 코드를 넣어라.

탭 코드와 모집 대상:

| portalCategories | 모집 |
|------------------|------|
| `YOUTH_YOUNG` | 개인(`INDIVIDUAL`) 또는 봉사(`VOLUNTEER`) |
| `ORGANIZATION` | 기관(`ORGANIZATION`). 교육받은 교사, UJAT 기관, 제미나이 기관, 1사1교 기관 포함 |
| `INSTRUCTOR` | 강사(`INSTRUCTOR`) |

교육받은 교사(`TRAINED_TEACHER`)를 강사 탭으로 옮기지 마라. 지금처럼 기관 탭이 맞다.  
강사 탭은 강사 모집이 있는 프로그램만이다.

한 프로그램에 모집이 둘 이상이면 해당 코드만 배열에 넣어도 된다. 없는 모집의 코드는 넣지 마라.

### 3. 전체 목록의 `recruitmentStatus`

`portalTab` 없이 호출한 행의 `recruitmentStatus`는 그 행의 `portalCategories`에 속한 모집과 모순이면 안 된다.

- 속한 모집 중 하나라도 `OPEN`이면 전체를 `CLOSED`로 내리지 마라.
- 182102 전체=`OPEN`, 청소년 탭=`CLOSED` 처럼 탭이 다른 모집을 가리키면 §1대로 탭 소속부터 고쳐라.

배지 값 의미는 유지한다. `OPEN`/`RECRUITING`=모집 중, `UPCOMING`/`SCHEDULED`=모집 예정, `CLOSED`=모집 완료.  
`periodStatus`와 `recruitmentStatus`를 섞지 마라.

---

## Out of scope / 금지

- Platform·CMS 프론트 수정.
- path 추가, `portalTab` enum 변경, 목록을 로그인 전용으로 바꾸기.
- **신청이 없는 프로그램을 목록에서 빼기.** 아래 3건은 CMS 신청 0건이어도 모집 예정 공개 프로그램이다. 유지하라.
  - `186009` 제목 `111`, `TRAINED_TEACHER`, `UPCOMING`, 기관 탭
  - `185002` 제미나이 찾아가는 연수 모집 예정, `UPCOMING`, 기관 탭
  - `182101` 2026년 JA Korea 대학생경제교육봉사단 (예정), `UJAT`
- 참여하기 목록을 `GET /api/portal/me/program-applications` 로 바꾸기. 그 API는 마이페이지 내 신청이다.
- CMS 신청 목록 path를 새로 만들기. 아래는 이미 신청 건을 돌려준다. 건수가 0인 것은 신청이 없는 것이다.
  - `GET /api/admin/programs/{programId}/individual-applications`
  - `GET /api/admin/programs/{programId}/organization-applications`
  - `GET /api/admin/programs/{programId}/instructor-applications`
  - `GET /api/admin/programs/{programId}/volunteer-applications`
  - `GET /api/admin/programs/{programId}/trained-teacher/organization-applications`
- 교육받은 교사 신청을 기관 신청과 다른 id로 복제하지 마라. `186006`은 두 목록 모두 `186363`, `186361` 이다. 같은 신청이다.
- TRUNCATE. prod Flyway에 로컬 테스트 프로그램을 넣지 마라.

---

## Done 기준

로그인 없이 조회한다.

1. `182102`는 `portalTab=YOUTH_YOUNG` 결과에 없거나, 그 탭에 남을 때는 봉사 모집이 있고 `recruitmentStatus`가 전체·기관 탭과 모순되지 않는다. 기관 모집이 `OPEN`이면 `portalTab=ORGANIZATION`에서 `OPEN`이다.
2. `168005`의 `portalCategories`는 `["YOUTH_YOUNG"]` 이다.
3. `168008`의 `portalCategories`에 `INSTRUCTOR` 또는 `YOUTH_YOUNG`이 있으려면 그 타입 모집이 있다. 없으면 그 코드를 제거한다. `168004`도 같다.
4. `186001` 등 `TRAINED_TEACHER`는 `ORGANIZATION` 탭에 있고 `INSTRUCTOR` 탭에는 없다.
5. `186009`, `185002`, `182101`은 신청 0건이어도 목록에서 사라지지 않는다.
6. 전체 28건 전후로 공개 프로그램을 삭제하지 않는다. 탭 소속과 `recruitmentStatus`만 맞춘다.

답변에 `182102`·`168008`·`168004`의 `portalCategories`와, 전체/청소년/기관 호출의 `recruitmentStatus`만 적어라.
