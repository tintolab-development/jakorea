# Cursor prompt — 회원포탈 프로그램 상세 교육 장소 구분 (JABACK)

| 항목 | 값 |
|---|---|
| 대상 레포 | JABACK |
| 주 API | `GET /api/portal/programs/{programId}` |
| 대상 화면 | 회원포탈(사용자 홈페이지) 프로그램 상세 → 기본정보 「교육 장소」 |
| 프로그램 유형 | 포탈 상세를 내려주는 **전 유형** (GENERAL_INDIVIDUAL, GENERAL_ORGANIZATION, TRAINED_TEACHER, COMPANY_SCHOOL, UJAT, GEMINI) |
| 우선순위 | P0 |
| 작성일 | 2026-09-29 |
| 상태 | **아직 미수정.** 포탈 응답에 `venueKind`가 없다. 구현하라. |
| FE | 수정하지 마라. Platform은 `venueKind`를 이미 읽는다. OpenAPI 재생성·프론트 레포 수정 불필요 |
| 실측 | 로컬 `GET http://localhost:8080/api/portal/programs/186018` (`TRAINED_TEACHER`). `venue` = `"상세내용"`. `venueKind` 키 없음 |

프론트 레포를 고치지 마라. 아래는 **백엔드만** 고치는 지시다.

---

## 증상

CMS 공통정보 교육 장소는 라디오와 상세가 나뉜다.

- 라디오: `기관 안` / `기관 밖` / `기타(직접입력)`
- 상세 입력: `서울시 강서구 가양 데시앙플렉스` (실측 186018은 `상세내용`)

회원포탈 기본정보 「교육 장소」는 `venue` 한 줄만 보여서 **상세 문장만** 나온다.  
기대 문장은 구분자 쉼표다.

```text
기관 안, 서울시 강서구 가양 데시앙플렉스
기관 밖, 인근 구립도서관 강의실
기타, 별관 301호
```

한글 라벨 조합은 **프론트가 한다.** 백엔드는 코드와 상세 문장을 **따로** 내려라.  
`venue`에 `기관 안, …` 또는 `기관 안 | …`를 넣지 마라. CMS 조회 화면의 `|` 포맷을 포탈 응답에 복사하지 마라.

---

## 원인 (현행 코드 — 여기서 고쳐라)

구분값은 이미 supplement에 있다. 포탈 DTO가 `venue`만 통과시킨다.

1. `ProgramDetailSupplement` (`com.jakorea.cms.program.service.ProgramDetailSupplement`)
   - `venue`, `venueDetail`, `venueKind`, `institutionType` 가 있다.
2. `ProgramDetailSupplementService.load`
   - `venueKind` ← `text(detail, "venueKind", "venue_kind", "educationVenueKind")`
   - `venueDetail` ← `text(detail, "venueDetail", "venue_detail", "venueOther", "locationDetail")`
   - `institutionType` ← `text(detail, "institutionType", "organizationType", "institution_type")`
   - `text()`는 `generalCommonInfo` 등 중첩 객체를 이미 걷는다. nested `generalCommonInfo.venueKind = "inside"` 는 supplement까지 온다.
   - `TRAINED_TEACHER`의 `venue`만 `firstText(venue, venueDetail)` 이다. 그 외 유형은 `venue` 키만 쓴다. 기관 안/밖은 상세가 `venueDetail`에만 있고 top-level `venue`가 비는 경우가 있다.
3. `HomepageProgramDtos.ProgramDetailResponse`
   - 필드가 `String venue` 하나다. `venueKind` 없음.
4. `HomepageProgramQueryService` 의 `new ProgramDetailResponse(` **한 곳**
   - `supplement.venue()` 만 넘긴다. `supplement.venueKind()` 는 버린다.

관리자 `ProgramResponse.venueKind` 는 이미 있다. 이 작업은 **포탈 상세 응답에 같은 코드를 노출**하는 것이다. 관리자 GET/PATCH 계약을 바꾸지 마라.

---

## 수정

### 1. `ProgramDetailResponse`에 `venueKind` 추가

`venue` 바로 다음 컴포넌트.

```java
String venue,
@Schema(description = "교육 장소 구분. inside=기관 안, outside=기관 밖, other=기타. 없으면 null.",
        allowableValues = {"inside", "outside", "other"}, nullable = true)
String venueKind,
```

- 값: `inside` | `outside` | `other` | `null`
- 한글 라벨, `inside_school` / `outside_school` 을 이 필드에 넣지 마라.
- null이면 필드를 생략해도 된다. 있으면 위 세 값만.

`new ProgramDetailResponse(` 는 `HomepageProgramQueryService` 한 곳이다. 생성자 인자 순서를 그 호출과 맞춰라. 다른 레코드(`TrainedTeacherProgramDetailResponse` 등)는 건드리지 마라.

### 2. 구분 정규화

`supplement.venueKind()` 를 우선한다.

| 입력 | `venueKind` 응답 |
|---|---|
| `inside` / `outside` / `other` (대소문자 무시, trim) | 그 값의 소문자 |
| 위 값이 없고 `institutionType` = `inside_school` | `inside` |
| 위 값이 없고 `institutionType` = `outside_school` | `outside` |
| 둘 다 없음 | `null` |

- `venueKind=other` 인데 예전에 남은 `institutionType=inside_school` 이 있으면 **other를 유지**한다. `inside`로 되돌리지 마라.
- 구분이 비었다고 `inside`를 기본값으로 넣지 마라.

### 3. `venue`는 상세 문장만

- 기존 상세 문장을 유지한다. 186018이면 `"상세내용"` 그대로.
- 종류 코드를 붙이거나 한글 접두사를 만들지 마라.
- `venue`가 비어 있고 `venueDetail`에 문장이 있으면, **전 프로그램 유형**에서 `venue`에 `venueDetail`을 쓴다. 지금 이 fallback은 `TRAINED_TEACHER`에만 있다. 기관 안/밖은 주소가 `venueDetail`에만 있는 경우가 있어서, 유형을 한정하면 포탈은 `기관 안`만 보이고 주소가 빠진다.
- `venue`와 `venueDetail`이 둘 다 있으면 기존처럼 `venue`를 우선한다. 두 문장을 쉼표로 합치지 마라.

---

## 기대 응답

`GET /api/portal/programs/186018` (nested `venueKind=inside`, 상세 `상세내용`):

```json
{
  "venue": "상세내용",
  "venueKind": "inside"
}
```

주소가 상세에 들어간 프로그램:

```json
{
  "venue": "서울시 강서구 가양 데시앙플렉스",
  "venueKind": "inside"
}
```

기관 밖:

```json
{
  "venue": "인근 구립도서관 강의실",
  "venueKind": "outside"
}
```

기타. `institutionType`이 `inside_school`로 남아 있어도 `other`:

```json
{
  "venue": "별관 301호",
  "venueKind": "other"
}
```

구분 정보가 전혀 없는 기존 프로그램:

```json
{
  "venue": "기존 장소 문장"
}
```

`venueKind`는 null 또는 생략. `inside`로 채우지 마라. `venue` 문장도 바꾸지 마라.

---

## 하지 말 것

- `venue`에 `기관 안, …` / `기관 안 | …` 를 저장하거나 응답으로 조합
- 포탈 응답에 `institutionType`, `venueDetail`을 새로 노출 (프론트는 `venue` + `venueKind`만 쓴다)
- 관리자 `GET/PATCH /api/admin/programs/{id}` 의 `venue` / `venueKind` / `institutionType` 의미 변경
- `generalCommonInfo` JSON을 포탈 응답에 포함
- 교육 진행 필드(`educationStructure`, `educationScheduleLines` 등)와 신청 `line:N` 동작 변경
- 프론트 레포, OpenAPI codegen, 포탈 목록 API 수정

---

## 수락

1. 186018 `GET /api/portal/programs/186018` → `venueKind` = `inside`, `venue` = 기존 상세 문장(`상세내용`). 응답에 `기관 안` 한글이 없다.
2. 기관 안 + 상세 `서울시 강서구 가양 데시앙플렉스` → `venueKind=inside`, `venue`는 그 주소 그대로.
3. 기관 밖 → `outside`. 기타 → `other`. 기타인데 남은 `inside_school`이 있어도 `inside`가 아니다.
4. 구분도 `institutionType`도 없으면 `venueKind`는 null. `venue`는 기존 문장.
5. `venue`가 비고 `venueDetail`만 있는 일반/1사1교/UJAT/Gemini도 `venue`에 그 상세가 채워진다.
6. 관리자 프로그램 GET의 `venue` / `venueKind`는 이 변경 전과 같다.
7. 로컬 `bootRun`을 재기동한 뒤 2번을 다시 호출해 확인한다. 재기동 전 프로세스는 옛 클래스를 서빙한다.
