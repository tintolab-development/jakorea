# Cursor prompt — 일반 봉사자 신청 상세에 신청서 답변 projection 추가 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/volunteer-application-general-projection-backend-cursor-prompt-2026-10-07.md`

> **긴급도: 높음 (심사 불가).**
> CMS 「봉사자 1차 서류 심사 대상자 상세」에서 회원이 제출한 자유 작성 4문항, 이전 참여 JA 봉사 프로그램이 보이지 않는다.
> 서류 심사의 핵심 근거가 화면에 없다.
>
> 범위: **일반 봉사자** 신청 상세(`GET /api/admin/volunteer-applications/{id}`, `POST /api/admin/volunteer-applications/{id}/privacy/unmask`)만.
> UJAT 봉사자(`application.ujat`), 개인·강사·기관 신청은 바꾸지 마라.
>
> 관련 문서: `volunteer-application-list-essay-fields-backend-cursor-prompt-2026-10-07.md`(목록 표 칸). 이 문서와 같은 추출 규칙을 써라.

---

## 재현 (로컬, 2026-10-07)

- 프로그램 `186050`(일반), 봉사자 신청 `1691347`, form_response `1851457`.
- DB에는 답이 정상 저장되어 있다.

```text
program-volunteer-application-seed-ja-experience       = "program-volunteer-application-ja-experience-yes"
program-volunteer-application-seed-previous-ja-program = {"applicationYear":"2021","programName":"123123123123"}
program-volunteer-application-seed-free-text-items     = {"items":[
  {"id":"intro","bodyText":"…"},{"id":"educationExperience","bodyText":"…"},
  {"id":"necessity","bodyText":"…"},{"id":"jaExperience","bodyText":"…"}]}
```

- CMS가 쓰는 `GET /api/admin/form-responses/1851457`는 위 답변 모두 `answerValueJson: null`, `answerDisplayText: null`로 준다.
- `GET /api/admin/volunteer-applications/1691347`에는 일반 봉사자용 답변 필드가 없다(UJAT만 `application.ujat`에 있음).

## 원인

1. `FormResponsePrivacyService.filterAnswers` → `FormAnswerDisclosurePolicy.classify`가 `form_question.pii_category`를 본다.
2. 일반 봉사자 신청 양식 문항(`form_question` 1179~1185)은 `pii_category`가 모두 `NULL`이다. `NULL`은 `RESTRICTED`로 분류된다.
3. `RESTRICTED`는 사유를 입력한 해제 요청(`POST /api/admin/form-responses/{id}/privacy-detail`)에서, 그것도 MASTER 또는 `SENSITIVE_PII_READ` 보유자에게만 열린다.
4. 그래서 일반 조회에서는 JA 경험 선택값처럼 개인정보가 아닌 답까지 모두 `null`이 된다. CMS 「개인정보 상세보기」는 봉사자 신청 해제 API를 쓰므로, 해제 후에도 form-response 답은 열리지 않는다.

## 요구 사항

### 1. 상세 응답에 `application.general` 추가 — `VolunteerApplicationDetailResponse`

UJAT의 `application.ujat`(`UjatProjection`)와 같은 방식으로, 일반 봉사자 신청이면 `application.general`을 채운다. UJAT 프로그램 신청이면 `null`.

| 필드 | 타입 | 출처 답변 키 | 규칙 |
| --- | --- | --- | --- |
| `jaExperience` | `Boolean`, nullable | `program-volunteer-application-seed-ja-experience` | `…-ja-experience-yes`/`YES`/`있음` → `true`, `…-no`/`NO`/`없음` → `false`, 그 외 `null`. `VolunteerApplicationRuntimeProjectionService`의 YES/NO 집합을 재사용하라. |
| `previousJaProgram` | `{ applicationYear: String?, programName: String? }`, nullable | `program-volunteer-application-seed-previous-ja-program` | 객체 답의 두 값을 trim. 둘 다 비면 `null`. |
| `essayIntro` | `String`, nullable | `program-volunteer-application-seed-free-text-items` | `items[]`에서 `id = intro`의 `bodyText` |
| `essayEducationExperience` | `String`, nullable | 〃 | `id = educationExperience` |
| `essayNecessity` | `String`, nullable | 〃 | `id = necessity` |
| `essayJaExperience` | `String`, nullable | 〃 | `id = jaExperience` |

- 원본은 `VolunteerApplicationAdminService`가 이미 읽는 `rawAnswersJson`(최신 form_response)이다. `ujatProjection`의 `essayItems` / `objectAnswer`를 일반 키에 그대로 적용하라.
- `notApplicable: true`인 답은 `null`.
- 숨김 단락(지원 형태 때문에 hidden)의 값은 `null`. UJAT projection과 같은 규칙이다.

### 2. 마스킹

> **변경(2026-10-07):** 기획 결정으로 4문항은 마스킹하지 않는다. 아래 내용 대신 `volunteer-application-essay-unmasked-backend-cursor-prompt-2026-10-07.md`를 따른다.

- 마스킹 상세: `essay*`에는 `PrivacyMaskingSupport.maskFreeText`를 적용하라. `jaExperience`, `previousJaProgram`은 개인정보가 아니므로 원문 그대로.
- 해제 상세(기존 `POST /api/admin/volunteer-applications/{id}/privacy/unmask`): `essay*` 원문.
- UJAT 마스킹 상세의 `essay*` 정책과 같다.
- **확인 필요:** CMS 시안은 연락처·이메일은 마스킹하고 자유 작성은 원문으로 보여준다. 기획이 자유 작성을 마스킹 대상이 아니라고 정했으면 `essay*`도 원문으로 내려라. 정해지지 않았으면 위 기본값(마스킹)으로 구현하고 완료 보고에 적어라.

### 3. 문항 분류(권장, 별도 커밋)

- 일반 봉사자 신청 양식 seed의 `pii_category`를 채워라: `ja-experience`·`previous-ja-program`·`interview-schedule`·`activity-schedule` → `NONE`, `free-text-items` → 자유 작성 정책에 맞는 값.
- 이미 발행된 template version(로컬 `form_question` 1179~1185)은 마이그레이션으로 갱신하라.
- 이 작업이 없어도 1·2번만으로 CMS 화면은 동작한다.

### 4. Swagger·테스트

- `GeneralProjection` record에 `@Schema(nullable = true)`와 마스킹 설명을 붙여라.
- 테스트:
  - 4문항·JA 경험·이전 프로그램이 모두 있는 일반 신청: 마스킹 상세에서 `essay*` 마스킹, 나머지 원문.
  - 같은 신청의 해제 상세: `essay*` 원문.
  - free-text 답이 없는 신청: `essay*` 모두 `null`.
  - UJAT 신청: `application.general = null`, `application.ujat` 기존과 동일.

## 완료 조건

- `GET /api/admin/volunteer-applications/1691347` → `application.general.jaExperience = true`, `previousJaProgram = { applicationYear: "2021", programName: "123123123123" }`, `essay*` 4개 값 존재.
- 해제 상세에서 `essay*`가 원문.
- UJAT·개인·강사·기관 상세 응답이 바뀌지 않는다.

## 프론트 상태 (참고, 백엔드 작업 아님)

- CMS는 이미 `application.general`을 읽도록 반영되어 있다(`readGeneralVolunteerProjection`). 필드가 오면 추가 배포 없이 화면에 보인다.
- 필드가 없으면 기존 값을 유지하므로 배포 순서는 상관없다.
