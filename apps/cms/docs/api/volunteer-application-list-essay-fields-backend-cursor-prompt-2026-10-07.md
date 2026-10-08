# Cursor prompt — 일반 봉사자 신청 목록에 자유 작성 4문항 본문 추가 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/volunteer-application-list-essay-fields-backend-cursor-prompt-2026-10-07.md`

> **긴급도: 중간 (심사 화면 정보 누락).**
> CMS 「1차 서류 심사」 표에는 자유 작성 4문항 열이 있는데, 목록 API가 본문을 주지 않아 모든 행이 `-`로 보인다.
> 담당자는 행마다 상세를 열어야 답을 볼 수 있다.
>
> 범위: **일반 봉사자** 신청 목록(`GET /api/admin/programs/{programId}/volunteer-applications`)만.
> UJAT 봉사자, 개인·강사·기관 신청 목록과 상세 응답은 바꾸지 마라.

---

## 재현 (로컬, 2026-10-07)

- 프로그램 `186050`(일반), 봉사자 신청 `1691346`, `1691347`.
- `form_response.id = 1851457`(context `VOLUNTEER_APPLICATION`, `context_id = 1691347`)의 `form_response_answer`:

```text
question_key_snapshot = program-volunteer-application-seed-free-text-items
answer_value_jsonb    = {"items":[
  {"id":"intro","label":"1. 자기소개 및 지원동기를 자유롭게 작성해 주세요.","bodyText":"12321312312312"},
  {"id":"educationExperience","label":"2. 교육봉사, 강사 아르바이트 등 ...","bodyText":"312312312312312"},
  {"id":"necessity","label":"3. 초등학생 대상 경제 교육의 필요성 ...","bodyText":"3123123123123"},
  {"id":"jaExperience","label":"4. 초·중·고 당시 학교에서 JA Korea ...","bodyText":"123123123123123"}
]}
```

- `GET /api/admin/programs/186050/volunteer-applications` 응답 항목에는 `essaySubmitted: true`만 있고 본문 필드가 없다.

## 원인

- `VolunteerApplicationListItemResponse`에 자유 작성 본문 필드가 없다.
- `VolunteerApplicationQueryService`의 `application_form` LATERAL은 `essay_submitted`(존재 여부)만 계산한다.
- 일반 봉사자 상세(`VolunteerApplicationDetailResponse`)에도 일반용 essay 필드가 없다. CMS 상세는 별도로 form-response API를 불러 본문을 채운다. 목록에서 같은 방식을 쓰면 행마다 요청이 나가므로 쓸 수 없다.

## 요구 사항

### 1. 응답 필드 추가 — `VolunteerApplicationListItemResponse`

| 필드 | 타입 | 출처 (`items[].id`) |
| --- | --- | --- |
| `essayIntro` | `String`, nullable | `intro` |
| `essayEducationExperience` | `String`, nullable | `educationExperience` |
| `essayNecessity` | `String`, nullable | `necessity` |
| `essayJaExperience` | `String`, nullable | `jaExperience` |

- 출처 답변 키: `program-volunteer-application-seed-free-text-items`(최신 `VOLUNTEER_APPLICATION` form_response).
- 값은 `items[]`에서 `id`가 일치하는 항목의 `bodyText`를 trim한 것이다. 비었거나 항목이 없으면 `null`.
- 답변이 `notApplicable: true`이면 4개 모두 `null`.
- 기존 필드(`essaySubmitted` 포함)는 그대로 둔다. 필드 추가만 하므로 기존 클라이언트와 호환된다.
- UJAT 봉사자 행(UJAT 프로그램 목록)은 이 필드를 `null`로 둔다. UJAT 본문은 기존 상세의 `application.ujat.essay*`가 담당한다.

### 2. 조회 — N+1 금지

- 기존 `application_form` LATERAL(최신 form_response를 고르는 부분)에서 같은 행의 `form_response_answer`를 한 번 더 읽어 4개 값을 뽑는다.
- `answer_value_jsonb`가 `text` 컬럼이므로 `::jsonb` 캐스팅이 필요하다. 파싱 실패 행이 목록 전체를 깨뜨리지 않게 하라(예: `answer_value_jsonb LIKE '{%'` 조건 후 캐스팅, 또는 Java에서 기존 `essayItems` 로직 재사용).
- 참고 구현: `VolunteerApplicationAdminService.essayItems` / `objectAnswer`(UJAT 키 `ujat-program-application-volunteer-seed-free-text-items` 기준)와 같은 규칙을 일반 키에 적용하면 된다.

### 3. 마스킹

> **변경(2026-10-07):** 기획 결정으로 4문항은 마스킹하지 않는다. 아래 내용 대신 `volunteer-application-essay-unmasked-backend-cursor-prompt-2026-10-07.md`를 따른다.

- 목록은 마스킹 응답이다(연락처·이메일이 이미 마스킹됨). 4개 필드도 **`PrivacyMaskingSupport.maskFreeText`를 적용**하라. UJAT 마스킹 상세의 `essay*`와 같은 정책이다.
- 목록에 해제(unmask) 경로를 새로 만들지 마라.
- 정책상 목록에서 자유 작성을 원문으로 보여야 한다면 구현 전에 확인을 요청하라. 프론트는 받은 문자열을 그대로 표시한다.

### 4. Swagger·테스트

- 새 필드에 `@Schema(nullable = true, description = "…")`를 붙이고 마스킹 여부를 설명에 적어라.
- 테스트:
  - 4문항이 모두 있는 신청: 4개 필드에 마스킹된 값이 채워진다.
  - free-text 답변이 없는 신청: 4개 모두 `null`, `essaySubmitted = false`.
  - `notApplicable: true` 답변: 4개 모두 `null`.
  - 깨진 JSON 답변 1건이 섞여도 목록 조회가 성공한다.

## 완료 조건

- `GET /api/admin/programs/186050/volunteer-applications`에서 `1691347` 행에 `essayIntro`·`essayEducationExperience`·`essayNecessity`·`essayJaExperience`가 마스킹된 값으로 온다.
- 목록 쿼리 수가 늘지 않는다(페이지당 단일 쿼리 유지).
- UJAT·개인·강사·기관 목록 응답이 바뀌지 않는다.

## 프론트 후속 (참고, 백엔드 작업 아님)

- CMS `mapVolunteerApplicationToGeneralVolunteerApplicantRow`가 현재 4개 값을 `''`로 고정한다. 백엔드 반영 후 새 필드를 매핑한다.
- CMS 표시 규칙은 이미 수정되어 있다. 「JA 봉사 경험 있음」 신청자라도 답이 있으면 4문항을 보여준다.
