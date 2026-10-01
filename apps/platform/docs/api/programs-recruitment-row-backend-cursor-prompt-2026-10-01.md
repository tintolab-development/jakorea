# Cursor prompt — 참여하기 목록을 모집 공고 행으로 (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
Homepage Admin(`JAHOMEADMINBACK`, `:8081`)은 이 화면의 프로그램 목록이 아니다. 그 레포를 수정하지 마라.  
프론트 레포를 전부 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.  
**이 작업에서 Platform·CMS 프론트를 고치지 마라.**

| 항목 | 값 |
|------|-----|
| 대상 레포 | **JABACK만** |
| 작성일 | 2026-10-01 |
| 프론트 문서 경로 | `apps/platform/docs/api/programs-recruitment-row-backend-cursor-prompt-2026-10-01.md` |
| FE 상태 | **수용 구조 완료 (PARTIAL).** 목록 entry identity·상세 exact focus·application-options exact match 준비됨. **가짜 1:N row를 프론트에서 만들지 않음** |
| 블로커 | 현재 `GET /api/portal/programs` 가 **program당 1행**이고 행에 `recruitmentId` 없음 → 화면 1:N E2E 불가 |

확인 기준: 로그인 없이 `GET http://localhost:8080/api/portal/programs`.  
Platform `/programs` 는 이미 이 API만 쓴다.

| Method | Path | 화면 |
|--------|------|------|
| GET | `/api/portal/programs` | 참여하기 목록. 전체 탭은 `portalTab` 생략. `page` 0-base, `size=10` |
| GET | `/api/portal/programs?portalTab=YOUTH_YOUNG` | 청소년·청년 |
| GET | `/api/portal/programs?portalTab=ORGANIZATION` | 기관 |
| GET | `/api/portal/programs?portalTab=INSTRUCTOR` | 강사 |
| GET | `/api/portal/programs/{programId}` | 상세. 아래 `recruitmentId`(+`applicationType`) 쿼리 추가 |
| GET | `/api/portal/programs/{programId}/application-options` | 회원 신청 옵션. path 유지 |
| POST | `/api/portal/programs/{programId}/applications` | 신청 제출. `recruitmentId`+`applicationType`+`formBindingId` 일치 검증 |

`portalTab` enum(`YOUTH_YOUNG` / `ORGANIZATION` / `INSTRUCTOR`)과 `recruitmentStatus` enum(`UPCOMING` / `OPEN` / `CLOSED`) 이름은 바꾸지 마라.

---

## FE가 이미 하는 일 (백엔드가 맞추면 바로 연결됨)

프론트는 **API에 값이 있을 때만** 통과한다. 없으면 생성·복제하지 않는다.

1. **목록**  
   - 행의 `recruitmentId` / `recruitmentType` / `targetType` / `applicationType`(단일)을 optional pass-through.  
   - React key: `recruitmentId` 있으면 `{programId}:{recruitmentId}`, 없으면 `{programId}`.  
   - 클릭 시 상세 URL에 **단일** `recruitmentId`(+ `applicationType`) focus 전달.
2. **상세**  
   - `recruitmentId` exact → 그 모집 1건만.  
   - `applicationType`만으로 후보 ≥2 (예: UJAT 상·하반기 `VOLUNTEER`) → **임의 첫 행 선택 금지**, ambiguous 처리.  
   - `portalCategories` 개수만큼 가짜 recruitment 복제 **안 함**.
3. **신청**  
   - `application-options`에서 selection `recruitmentId`가 있으면 **그 id만**. 매칭 없으면 null. 다른 `canApply` option으로 이동하지 않음.  
   - 제출은 선택된 option의 `recruitmentId` + `applicationType` + `formBindingId`.

→ 백엔드가 목록을 **모집 공고 행**으로 바꾸고 상세 쿼리를 지원하면, 프론트 추가 작업 없이 1:N 흐름이 연결된다.

---

## Goal

한 `programId`에 모집이 여러 개여도, 목록·상세·신청이 **같은 모집 공고**를 가리키게 하라.

### 지금 (깨짐)

- 목록 = 프로그램당 한 행. `recruitmentId` 없음.  
- 탭별 `recruitmentStatus`·기간·`availableApplicationTypes`는 탭 기준으로는 오지만, **같은 탭에 같은 신청 유형 모집이 둘**이면(182102의 182222·182223) 카드는 하나.  
- 상세 `GET /api/portal/programs/{programId}` 는 `recruitmentId`를 받지 않음. `title`·`summary`·`recruitmentGuide`·`additionalContentHtml`·상위 `recruitmentStatus`가 프로그램 전체 값.  
- 프론트는 탭/`applicationType`으로 `recruitments[]`만 좁힌다. 모집마다 다른 제목·안내·추가 내용은 나눌 수 없고, id 없이 후보가 둘이면 ambiguous.

### 필요한 단위

```text
목록: 공개 모집 공고마다 한 행
      recruitmentId, recruitmentType, targetType, applicationType
      그 양식의 제목·요약·모집 기간·모집 상태

상세: ?recruitmentId=&applicationType= 이면
      그 recruitmentId 의 안내·추가 내용·기간·상태·recruitments[] 만

신청: 목록에서 고른 recruitmentId + applicationType
      (application-options 를 다른 모집으로 고르지 않음)
```

`application-options`의 path는 유지해도 된다. 목록 행에 `recruitmentId`와 단일 `applicationType`이 있으면 프론트가 그 쌍으로 옵션을 고정한다.  
제출 `POST …/applications` 는 그 `recruitmentId` + `applicationType` + `formBindingId` 조합이 아니면 **거절**하라.

---

## 탭과 신청 유형

한 모집 행의 `applicationType`을 탭 이름으로 다시 쓰지 마라.

| portalTab | 그 탭 행의 applicationType |
|-----------|----------------------------|
| `YOUTH_YOUNG` | `INDIVIDUAL` 또는 `VOLUNTEER` |
| `ORGANIZATION` | `ORGANIZATION` |
| `INSTRUCTOR` | `INSTRUCTOR` |

- `TRAINED_TEACHER` + `PARTICIPANT` / `ORGANIZATION` 은 **기관 탭**. 강사 탭·`applicationType=INSTRUCTOR`로 넣지 마라. 예: `186016`.
- `VOLUNTEER`는 **청소년·청년 탭**. 기관 탭에 넣으면서 `applicationType`을 `ORGANIZATION`으로 바꾸지 마라.
- `targetType=BOTH` 처럼 한 `recruitmentId`에 `INDIVIDUAL`과 `ORGANIZATION`이 있으면 **신청 유형마다 한 행**. `recruitmentId`는 같고 `applicationType`만 다르다. 예: `186010` / `186050`.
- UJAT 상·하반기처럼 같은 `applicationType=VOLUNTEER` 모집이 둘이면 **각각 다른 `recruitmentId`로 두 행**. 월을 추론해 합치지 마라.

---

## 목록 행에 추가할 필드

기존 프로그램 필드는 유지한다. 아래를 **행마다** 넣어라. 없으면 프론트는 다시 추론하지 않고 현행(program 단위)로만 동작한다.

| 필드 | 의미 |
|------|------|
| `recruitmentId` | 이 카드의 모집 id (**필수**, 1:N의 핵심) |
| `recruitmentType` | `PARTICIPANT` / `VOLUNTEER` / `INSTRUCTOR` |
| `targetType` | `SCHOOL` / `ORGANIZATION` / `INDIVIDUAL` / `COLLEGE_STUDENT` / `TEACHER` / `BOTH` 등 실제 값 |
| `applicationType` | 이 카드의 신청 양식 **하나**. 배열이 아니다 |
| `title` | 그 모집 공고 제목. 모집별 제목이 없으면 프로그램 제목. **지어 내지 마라** |
| `summary` | 그 모집 요약. 없으면 프로그램 요약 |
| `recruitmentStatus` | 이 `recruitmentId`(+ `applicationType`)의 `UPCOMING` / `OPEN` / `CLOSED` |
| `recruitmentStartAt` | 이 모집의 시작 |
| `recruitmentEndAt` | 이 모집의 종료 |

`availableApplicationTypes`는 그 행의 `applicationType` 하나만 담거나, 같은 값이면 유지해도 된다.  
한 행에 `INSTRUCTOR`와 `VOLUNTEER`를 같이 넣지 마라.

### Pagination / 필터

- `totalElements` / `totalPages` = **프로그램 수가 아니라 이 행(모집 entry) 수**.
- 모집 마감 필터에도 그 모집 행이 남아야 한다. `OPEN`만 남기면 모집마감 목록이 빈다.
- `canApply=false` 인 OPEN 모집도 목록에서 빼지 마라.
- 전체 탭(`portalTab` 생략)도 모집 행 기준. 같은 프로그램이 모집 수만큼 나올 수 있다.
- **같은 `programId`로 merge하지 마라.** 같은 탭에 ORGANIZATION 모집이 둘이면 두 행.

---

## 상세

`GET /api/portal/programs/{programId}?recruitmentId={recruitmentId}&applicationType={applicationType}`

- 쿼리가 없으면 지금처럼 프로그램 전체를 내려도 된다 (하위 호환).
- 쿼리가 있으면 아래만 그 모집 기준이다.
  - `recruitments[]` = 그 `recruitmentId` **한 건**. 다른 모집(상·하반기 형제 포함)을 섞지 마라.
  - 상위 `recruitmentStatus`, `recruitmentStartAt`, `recruitmentEndAt` = 그 행과 같다.
  - `recruitmentGuide`, `additionalContentHtml` = 그 모집에 저장된 안내·추가 내용. 모집별 값이 없으면 프로그램 값을 유지하고, 응답에 모집별 필드가 없음을 숨기지 마라. 프로그램 문장을 모집별로 쪼개어 만들지 마라.
  - `title`, `summary` = 목록 행과 같은 규칙.
- `recruitmentId`가 그 프로그램의 모집이 아니면 **404**.

프론트는 이미 목록→상세 URL에 `recruitmentId`(단일)와 `applicationType`을 넣는다.

---

## 신청 (application-options / submit)

path 변경 불필요. 계약만 강화.

1. options 응답의 각 item에 `recruitmentId`, `applicationType`, `formBindingId`, `canApply`가 있어야 한다 (기존과 동일해도 됨).
2. 프론트는 목록에서 고른 `recruitmentId`로 **exact match**만 고른다. 다른 OPEN/`canApply`로 redirect하지 않는다.
3. `POST …/applications` body의 `recruitmentId` + `applicationType` + `formBindingId`가 그 프로그램의 유효 조합이 아니면 **4xx**.

---

## 재현 (2026-10-01 로컬)

### 1. 182102 — 기관 OPEN, 청소년·청년 CLOSED

`GET /api/portal/programs/182102` 모집:

| recruitmentId | recruitmentType | targetType | applicationTypes | status |
|---------------|-----------------|------------|------------------|--------|
| 182221 | PARTICIPANT | SCHOOL | ORGANIZATION | OPEN |
| 182222 | VOLUNTEER | COLLEGE_STUDENT | VOLUNTEER | CLOSED |
| 182223 | VOLUNTEER | COLLEGE_STUDENT | VOLUNTEER | CLOSED |

기대 목록:

| 호출 | 행 |
|------|----|
| `portalTab=ORGANIZATION&recruitmentStatus=OPEN` | `182102` + `recruitmentId=182221` + `applicationType=ORGANIZATION` + `OPEN` **한 행** |
| `portalTab=YOUTH_YOUNG&recruitmentStatus=OPEN` | `182102` 없음 |
| `portalTab=YOUTH_YOUNG&recruitmentStatus=CLOSED` | `182222`, `182223` **두 행**. 둘 다 `applicationType=VOLUNTEER`, `CLOSED`. 기간은 각 행의 `startAt`~`endAt`. 182221 기간으로 합치지 마라 |

상세 `?recruitmentId=182222&applicationType=VOLUNTEER` 의 `recruitments[]` 는 182222만. 상위 상태는 `CLOSED`.

### 2. 182103 — 182102의 반대

| recruitmentId | applicationTypes | status |
|---------------|------------------|--------|
| 182231 | ORGANIZATION | CLOSED |
| 182232 | VOLUNTEER | OPEN |
| 182233 | VOLUNTEER | CLOSED |

| 호출 | 행 |
|------|----|
| `portalTab=ORGANIZATION&recruitmentStatus=CLOSED` | `182231` 한 행, `CLOSED` |
| `portalTab=YOUTH_YOUNG&recruitmentStatus=OPEN` | `182232` 한 행, `OPEN` |
| `portalTab=YOUTH_YOUNG&recruitmentStatus=CLOSED` | `182233` 한 행, `CLOSED`. **182232를 이 필터에 넣지 마라.** (측정 당시 OPEN이 CLOSED 필터에 섞인 적 있음) |

### 3. 168004 — 세 탭, 모집 세 개

| recruitmentId | applicationTypes |
|---------------|------------------|
| 168241 | ORGANIZATION |
| 168242 | INSTRUCTOR |
| 168243 | VOLUNTEER |

각 탭의 OPEN 목록에 168004는 **그 탭의 recruitmentId 한 행**만.

- 기관 → 168241, `applicationType=ORGANIZATION`
- 강사 → 168242, `applicationType=INSTRUCTOR`
- 청소년·청년 → 168243, `applicationType=VOLUNTEER`

한 행의 `availableApplicationTypes`에 세 유형을 같이 넣지 마라.

### 4. 186010 — 한 모집, 신청 유형 둘

`186050` `PARTICIPANT` / `BOTH` / `applicationTypes: INDIVIDUAL, ORGANIZATION`. 강사 탭에는 없다.

| 탭 | 행 |
|----|----|
| `YOUTH_YOUNG` | `recruitmentId=186050`, `applicationType=INDIVIDUAL` |
| `ORGANIZATION` | `recruitmentId=186050`, `applicationType=ORGANIZATION` |
| `INSTRUCTOR` | 없음 |

### 5. 186016 — 교육받은 교사

`186059` `PARTICIPANT` / `ORGANIZATION` / `applicationType=ORGANIZATION`.  
기관 탭에만 있다. 강사 탭에 없고 `applicationType`은 `INSTRUCTOR`가 아니다.

---

## Out of scope / 금지

- Platform·CMS 프론트 수정.
- `portalTab`·`recruitmentStatus` enum 이름 변경, path 삭제.
- 목록을 로그인 전용으로 바꾸기.
- 신청 양식이 없거나 `canApply=false` 인 공개 모집을 목록·상세에서 제거.
- `TRAINED_TEACHER`를 강사 모집으로 바꾸기.
- 기관 탭이라고 `VOLUNTEER`를 `ORGANIZATION` 신청으로 바꾸기.
- 모집별 제목·안내가 DB에 없을 때 문장을 지어 내기.
- 상·하반기 월 추론으로 두 `VOLUNTEER`를 한 행으로 합치기.
- TRUNCATE. prod Flyway에 로컬 테스트 프로그램을 넣지 마라.

---

## Done when

로그인 없이 조회한다. 아래 8개를 **실제 JSON 일부**로 답변에 적어라  
(`programId`, `recruitmentId`, `applicationType`, `recruitmentStatus`, `recruitmentStartAt`, `recruitmentEndAt`).

1. `portalTab=YOUTH_YOUNG&recruitmentStatus=CLOSED` 에 `182102`가 `recruitmentId=182222`와 `182223` **두 행**. 각 행에 `recruitmentId`, `recruitmentType=VOLUNTEER`, `applicationType=VOLUNTEER`, `CLOSED`, 그 행의 시작·종료. `182221`은 없다.
2. `portalTab=ORGANIZATION&recruitmentStatus=OPEN` 의 `182102`는 `recruitmentId=182221`, `applicationType=ORGANIZATION`, `OPEN` 한 행.
3. `182103`: 기관 CLOSED → `182231`, 청소년 OPEN → `182232`만. 청소년 CLOSED에 OPEN인 `182232` 없음.
4. `168004`: 세 탭에 각각 168243 / 168241 / 168242, 행의 `applicationType`은 하나.
5. `186010`: 청소년 `INDIVIDUAL`, 기관 `ORGANIZATION`, 둘 다 `recruitmentId=186050`. 강사 탭 없음.
6. `186016`: 기관 탭의 `186059`, `applicationType=ORGANIZATION`. 강사 탭 없음.
7. `GET /api/portal/programs/182102?recruitmentId=182222&applicationType=VOLUNTEER` 의 `recruitments`는 182222만, 상위 `recruitmentStatus=CLOSED`.
8. 다른 프로그램의 `recruitmentId`로 상세 → **404**.

완료 후 FE handoff 한 줄:

```text
BACKEND PROGRAM RECRUITMENT ROW = DONE
→ Platform 목록에 recruitmentId 행이 보이면 1:N E2E 재검증
```

**Last updated:** 2026-10-01
