# Cursor prompt — 로컬 OpenAPI 동기화(2026-10-06) 후 백엔드 확인 요청 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/openapi-local-sync-backend-cursor-prompt-2026-10-06.md`

---

## 배경

CMS가 `GET http://localhost:8080/v3/api-docs`(783 paths)로 OpenAPI를 갱신하고 orval 클라이언트를 재생성했다.
FE는 아래 계약 변경을 반영했다. 각 항목에서 **백엔드가 확인·답변해야 할 부분만** 정리한다.

| FE 반영 | 내용 |
|---------|------|
| UJAT 봉사자 모집 행 `recruitTerm` | 상반기 행에 `recruitTerm: "FIRST_HALF"` 전송. 상반기 판별을 `startAt` 순서 → `recruitTerm`으로 변경 |
| `RecipientCandidateResponse` | `recipientName`·`recipientContact` 우선, 없으면 `*Masked` |
| `AccountPaymentDetailResponse.sensitiveAccount` | 계좌 지급 상세·지급 확인 모달에서 원문 계좌 우선, 없으면 마스킹값 |
| `RequestedScheduleResponse.id` null 허용 | FE에서 미지정으로 처리 |

---

## ① UJAT `recruitTerm` — 기존 데이터·저장 흐름 (우선순위 높음)

### FE가 보내는 요청 (`PUT/POST` 프로그램 저장의 `recruitments`)

```json
[
  { "id": 182211, "recruitmentType": "PARTICIPANT", "targetType": "ORGANIZATION", "applicationType": "ORGANIZATION", "...": "..." },
  { "id": 182212, "recruitmentType": "VOLUNTEER", "targetType": "COLLEGE_STUDENT", "applicationType": "VOLUNTEER",
    "recruitTerm": "FIRST_HALF", "startAt": "...", "endAt": "...", "maxCount": 30 }
]
```

- 봉사자 행은 **상반기 1개만** 보낸다. 기존 행이 있으면 `recruitTerm == FIRST_HALF` 행의 `id`, 없으면 `recruitTerm`이 null인 행의 `id`를 붙인다. 신규 생성이면 `id` 없이 `recruitTerm: "FIRST_HALF"`만 보낸다.
- 하반기 행은 프로그램 저장 요청에 넣지 않는다. 하반기 문구·기간 변경은 **`id` + `recruitmentType` + `applicationType` + 바뀐 필드만** 보내는 행 단위 요청으로 간다(`recruitTerm` 미포함).

### 확인 요청

1. **세 번째 이후 봉사자 행이 NULL로 남는 문제**  
   `V14__ujat_recruitment_term_ssot_20261005.sql`은 UJAT 봉사자 행 중 3번째 이후를 `recruit_term = NULL`로 둔다.
   그런데 `ProgramRecruitmentRowCommandService.validateProgramRows`는 **INACTIVE가 아닌 모든 VOLUNTEER 행**에 term을 요구한다(`UJAT_RECRUIT_TERM_REQUIRED`).
   → 이런 프로그램은 **어떤 저장도 실패**한다.
   - 로컬·운영 DB에서 `status <> 'INACTIVE'` 이고 `recruit_term IS NULL`인 UJAT VOLUNTEER 행 개수를 조회해 보고하라.
   - 남아 있다면 처리 방침(INACTIVE 전환 / 백필 / 검증 완화)을 정하고 반영하라.
2. **신규 생성 경로**  
   `POST` 프로그램 생성(UJAT)에서도 `recruitments[].recruitTerm`이 `resolveRecruitTerm`과 같은 규칙으로 저장되는지 테스트로 확인하라.
3. **하반기 행 생성 주체**  
   FE는 하반기(`SECOND_HALF`) 봉사자 모집 행을 **만들지 않는다**. 하반기 행을 누가·언제 만드는지(BE 자동 생성 / 별도 API / FE가 추가로 보내야 함) 답하라. FE가 보내야 한다면 요청 형태를 명시하라.
4. **행 단위 저장에서 term 유지**  
   `recruitTerm` 없이 `id`만 보낸 VOLUNTEER 행 요청은 저장된 term을 그대로 쓰는지(`resolveRecruitTerm`의 `row` 분기), 보내지 않은 하반기 행은 그대로 남는지 테스트 이름으로 답하라.

---

## ② `InstructorApplicationDetailResponse.instructorCmsProfile` 스키마 표기

`docs/frontend/instructor-application-detail-resume-profile-frontend-handoff-2026-10-06.md`는
생성 타입이 `instructorCmsProfile?: InstructorCmsProfile | null`이 된다고 했지만, **실행 서버 스펙과 커밋본이 다르다.**

| 출처 | `InstructorApplicationDetailResponse.instructorCmsProfile` |
|------|------|
| 커밋본 `openapi/backend.openapi.json` | `{ "allOf": [{ "$ref": "…/InstructorCmsProfile" }], "nullable": true }` — 정상 |
| 실행 서버 `GET /v3/api-docs` | `{ "type": "null", "$ref": "…/InstructorCmsProfile" }` — 문제 |

`type: "null"`과 `$ref`를 한 객체에 같이 쓰면 생성기가 `type`을 무시해 **null 불가 객체**(`instructorCmsProfile?: InstructorCmsProfile`)로 만든다.
FE는 `/v3/api-docs`로 생성하므로 임시로 `Omit` 후 `InstructorCmsProfile | null`로 덮어쓰고 있다(`applications-api-client.ts`).

- springdoc 런타임 출력(customizer 또는 DTO `@Schema`)을 커밋본과 같은 표현으로 맞춰라.
  3.1 표현을 쓰려면 `"oneOf": [{ "$ref": "#/components/schemas/InstructorCmsProfile" }, { "type": "null" }]`.
- 런타임 출력에서 같은 패턴(`type: "null"` + `$ref`)을 쓰는 다른 필드가 있으면 목록을 보고하라.

---

## ③ 수신자 후보 원문 노출 (`RecipientCandidateResponse`)

`NotificationRecipientCandidateService`(약 340행)는 deprecated 별칭 `recipientNameMasked`·`recipientContactMasked`에도 **원문을 그대로** 넣는다.

1. 별칭에 원문을 넣는 것이 의도인지 확인하라. 의도라면 별칭 제거 일정을 알려 달라(FE는 이미 원문 필드 우선).
2. 감사 로그: FE는 수신자 설정 팝업을 열 때, 그리고 **검색·페이지 이동마다** 후보 API를 다시 호출한다. 호출마다 개인정보 조회 로그가 쌓이는 것이 정책상 허용되는지 확인하라.
3. 발송 이력(전송 결과) 응답의 `recipientContactMasked`는 **계속 마스킹**인지 확인하라. FE는 이력 화면을 변경하지 않았다.

---

## ④ 계좌 지급 상세 `sensitiveAccount` 권한 조건

`GET /api/admin/account-payments/{id}` 설명: 프로그램 PM/마스터 권한 확인 후 `sensitiveAccount` 반환, 고정 사유 조회 로그 기록.

1. 권한이 없는 관리자일 때 **상세 전체 403**인지, **`sensitiveAccount`만 null**인지 답하라.
   FE는 null이면 마스킹 계좌로 표시한다. 403이면 해당 관리자는 상세 팝업 자체를 못 연다.
2. FE는 팝업을 열 때마다 상세를 호출한다(캐시 없음). 조회마다 로그 1건이 맞는지 확인하라.

---

## ⑤ 커밋된 `openapi/backend.openapi.json`과 실행 서버 스펙 불일치

CMS `generate:api`의 병합 스크립트는 `JABACK/openapi/backend.openapi.json`(커밋본, 804 paths)에서 일부 스키마를 가져온다.
실행 서버(`localhost:8080`, HEAD `d787f1fe`)와 비교하면:

| 항목 | 커밋본 | 실행 서버 | BE 소스 |
|------|--------|-----------|---------|
| `OrganizationApplicationListItemResponse.educationGrade` · `region` · `combinedClassPartnerGrades` | 있음 | 없음 | 없음 |
| `/internal/admin-ops/**`, `/api/admin/files/*/raw/**`, `/api/internal/file-scan/callbacks` 등 21개 path | 있음 | 없음 | — |

- 커밋본을 현재 소스로 다시 생성해 커밋하라.
- 21개 path가 서버 프로필에 따라 빠지는 것이 의도인지 확인하라.

FE는 위 3개 목록 필드를 쓰지 않으므로 화면 영향은 없다.

---

## ⑥ operationId 변경 (낮음)

이번 갱신에서 `updateMarketingConsent` → `updateMarketingConsent_1`, `download` → `download_1`, `download_2` → `download_3`처럼 **엔드포인트가 추가될 때 기존 operationId가 밀렸다**.
생성 함수 이름이 바뀌어 FE import가 깨질 수 있다. 중복 이름 메서드에 `@Operation(operationId = "...")`로 고정 ID를 지정하라.

---

## 참고 (별도 문서에서 진행 중)

- 일반 기관 날짜 지정형 `requested-schedules` (`id`·`startPeriod` null): `apps/cms/docs/api/general-organization-fixed-date-requested-schedules-backend-cursor-prompt-2026-10-06.md`

---

## 하지 말 것

- 이 문서의 path·응답 필드 이름 변경 금지 (② 스키마 표기 수정은 예외)
- 일반·1사1교·Gemini 모집 행에 `recruitTerm` 허용 금지 (현재 `UJAT_RECRUIT_TERM_NOT_ALLOWED` 유지)

## 보고 형식

1. ①~⑥ 항목별 답변 (확인 결과 · 변경 여부)
2. ① 조회 SQL과 결과 개수
3. 변경했다면 테스트 이름과 재생성한 `openapi/backend.openapi.json` 커밋 해시
4. FE 변경이 필요한 항목은 `docs/frontend` handoff로 정리
