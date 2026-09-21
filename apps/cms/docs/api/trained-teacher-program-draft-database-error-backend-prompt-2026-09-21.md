# BE 전달 프롬프트 — 교육받은 교사 등록 위저드 `program-draft` DATABASE_ERROR

**작성일:** 2026-09-21  
**우선순위:** P0  
**대상 화면:** CMS `/programs/trained-teachers` → 「프로그램 등록」  
**범위:** `programType=TRAINED_TEACHER` 의 `GET/PUT/DELETE /api/admin/program-draft`  
**비범위:** 일반(`GENERAL`) · 1사1교(`COMPANY_SCHOOL`) · UJAT · Gemini 기본 동작 변경 금지  
**관련 문서:**
- [programs-trained-teachers-api-backend-handoff.md](./programs-trained-teachers-api-backend-handoff.md)
- [trained-teacher-registration-flow-backend-prompt-2026-09-18.md](./trained-teacher-registration-flow-backend-prompt-2026-09-18.md)
- OpenAPI v9 `ProgramDraftItemResponse` / `ProgramDraftUpsertRequest` / `ProgramDraftSaveResponse`

---

## 한줄 요약

교육받은 교사 **신규 등록 화면을 여는 순간** FE가 `GET /api/admin/program-draft?programType=TRAINED_TEACHER`를 호출하는데, BE가 `DATABASE_ERROR`를 반환합니다.  
임시저장이 없는 정상 진입이 SQL 예외가 되면 안 됩니다. 없거나 실패한 draft를 5xx로 포장하지 말고, 조회·생성·삭제가 `TRAINED_TEACHER`에서 round-trip 되게 수정해 주세요.

---

## 재현

1. CMS 로그인 (admin JWT)
2. `/programs/trained-teachers` → 「프로그램 등록」
3. Network:

```http
GET /api/admin/program-draft?programType=TRAINED_TEACHER
```

4. 실제 응답 (2026-09-21 로컬 `localhost:3000` → BE 프록시):

```json
{
  "success": false,
  "data": null,
  "message": "데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  "error": {
    "code": "DATABASE_ERROR",
    "message": "데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    "field": null
  }
}
```

같은 세션에서 이어서 호출될 수 있는 요청:

```http
DELETE /api/admin/program-draft?programType=TRAINED_TEACHER
PUT  /api/admin/program-draft
```

`PUT` body 예:

```json
{
  "programType": "TRAINED_TEACHER",
  "draftPayload": {
    "version": 1,
    "registrationTemplateCode": "registration-trained-teachers",
    "formVersions": {},
    "savedAt": "2026-09-21T02:00:00.000Z"
  }
}
```

---

## FE가 이미 한 조치 (깨지지 않게 유지)

등록 버튼 클릭 시 draft GET은 **임시저장 존재 여부 probe**입니다.  
`DATABASE_ERROR`를 화면 진입 차단으로 쓰지 않도록 FE는 다음을 반영했습니다.

| 항목 | FE 조치 |
|------|---------|
| GET 실패 / `success: false` / `data: null` | 임시저장 없음으로 처리 · 시드 폼으로 진입 |
| DELETE 실패 | 세션만 비우고 진행 |
| 전역 서버 오류 팝업 | GET/DELETE·ensure용 PUT에서는 띄우지 않음 |
| 사용자 「저장」 PUT | 기존처럼 오류 표시 |

**한계:** 등록 완료 시 FE는 `programDraftId`가 필요합니다 (`buildRegistrationCreateFormBindings` → `POST /api/admin/programs`의 `programDraftId` + formBindings).  
GET/PUT이 계속 500이면 **화면은 열려도 등록 완료는 실패**합니다. BE 수정이 필수입니다.

---

## 백엔드 전달용 프롬프트 (복사용)

아래를 BE 이슈/PR 본문에 그대로 붙여 주세요.

````markdown
## 요청 요약

CMS 교육받은 교사 프로그램 등록 화면 진입 시 아래 API가 `DATABASE_ERROR`를 반환합니다.

```
GET /api/admin/program-draft?programType=TRAINED_TEACHER
```

이 API는 등록 위저드의 **관리자별 임시저장 SSOT**입니다.  
일반(`GENERAL`) / 1사1교(`COMPANY_SCHOOL`) / UJAT와 동일한 path이며, `programType` 쿼리만 다릅니다.

`TRAINED_TEACHER`만 SQL 예외가 나면 안 됩니다.  
임시저장이 없는 것은 정상입니다. 5xx/`DATABASE_ERROR`로 처리하지 마세요.

일반·1사1교·UJAT·Gemini 기본 동작은 변경하지 마세요.

---

### 왜 호출하는가

CMS `/programs/trained-teachers` → 「프로그램 등록」:

1. **GET** — 이어서 작성할 임시저장이 있는지
2. 없으면 신규(fresh) 진입. 있으면 안내 팝업 후 continue/fresh
3. fresh면 **DELETE** 후 **PUT**으로 빈 draft 생성
4. 위저드 중간 저장·단계 동기화는 **PUT**
5. 등록 완료 `POST /api/admin/programs`에 `programDraftId` + formBindings를 붙임

`programType` 값은 프로그램 create와 동일하게 **`TRAINED_TEACHER`** 입니다.  
(`TRAINED_TEACHERS` 복수형, `EDUCATED_TEACHER` 등 다른 enum 금지)

등록 템플릿 코드: `registration-trained-teachers`  
모집/신청 바인딩: `recruitment-trained-teachers` / `application-trained-teachers`

---

### P0-1 — GET은 “없음”을 오류로 만들지 말 것

**요청**
- 해당 관리자 + `TRAINED_TEACHER` draft 행이 없으면 **성공 + 빈 데이터**
- Hibernate/JPA `NoResultException`, empty ResultSet, enum 캐스팅 실패를 `DATABASE_ERROR`로 포장하지 말 것
- `draftPayload` JSON 파싱 실패 시에도 관리자 화면이 열리지 못하는 5xx 대신, 가능하면 4xx 또는 payload=null + 유효한 `draftId` echo

**수용 응답 (권장, HTTP 200)**

없음:

```json
{
  "success": true,
  "data": null,
  "message": null,
  "error": null
}
```

있음:

```json
{
  "success": true,
  "data": {
    "draftId": 123,
    "programType": "TRAINED_TEACHER",
    "draftPayload": {
      "version": 1,
      "registrationTemplateCode": "registration-trained-teachers",
      "formVersions": {},
      "savedAt": "..."
    },
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

OpenAPI `ProgramDraftItemResponse`:
- `draftId` number (필수, FE가 이 값으로 form version copy owner를 잡음)
- `programType` string
- `draftPayload` object (FE opaque JSON)
- `createdAt` / `updatedAt` string (optional)

404를 쓸 경우 전용 코드(예: `PROGRAM_DRAFT_NOT_FOUND`)로 고정하고, `DATABASE_ERROR`는 쓰지 마세요.  
FE는 GET 실패를 “없음”으로 폴백하지만, 등록 완료에는 성공한 GET 또는 PUT이 필요합니다.

---

### P0-2 — `programType=TRAINED_TEACHER` DB/enum 지원

의심 지점 (로컬 로그 SQLException으로 확인):

1. `program_draft.program_type`(또는 동등 컬럼) CHECK/enum에 `TRAINED_TEACHER` 누락
2. Java enum에 `TRAINED_TEACHER` 없음 → PostgreSQL enum/`varchar` 불일치
3. unique 제약 `(admin_id, program_type)` 조회 시 타입 캐스팅 실패
4. 기존 손상 row의 `draft_payload` JSON 역직렬화 예외를 GET 전체에 전파
5. Flyway/Liquibase 미적용으로 로컬 DB만 구버전

**요청**
- programs create가 받는 `programType=TRAINED_TEACHER`와 **같은 enum/컬럼 값**을 program-draft에도 사용
- 마이그레이션이 필요하면 `GENERAL` / `COMPANY_SCHOOL` / `UJAT` 기존 행을 깨지 말 것
- 손상 payload가 있으면 GET이 500이 되지 않게 하고, DELETE로 해당 (admin, type) 행을 지울 수 있게 할 것

---

### P0-3 — PUT upsert

```http
PUT /api/admin/program-draft
Content-Type: application/json
```

```json
{
  "programType": "TRAINED_TEACHER",
  "draftPayload": {
    "version": 1,
    "activeStep": "program",
    "registrationTemplateCode": "registration-trained-teachers",
    "formVersions": {
      "registration-trained-teachers": { "templateId": 1, "draftVersionId": 2 }
    },
    "savedAt": "2026-09-21T02:00:00.000Z",
    "programTitleKo": "대표 프로그램명"
  }
}
```

**요청**
- `(현재 로그인 admin, programType)` 기준 upsert
- `draftPayload`는 **opaque JSON object**. FE `version: 1` 스키마를 서버 DTO로 강제 매핑하지 말 것
- 응답 `data.draftId` number 필수 (`ProgramDraftSaveResponse`)
- `programType` echo는 `TRAINED_TEACHER`
- GET과 같은 행을 읽고 쓸 것 (PUT 성공 후 GET이 다시 DATABASE_ERROR면 안 됨)

**draftPayload FE 계약 (참고, 서버 검증 최소화)**

| 필드 | 타입 | 의미 |
|------|------|------|
| `version` | `1` | payload 버전 |
| `registrationTemplateCode` | string | TT는 `registration-trained-teachers` |
| `formVersions` | `{ [templateCode]: { templateId, draftVersionId } }` | draft-owned form version |
| `activeStep` | string? | 위저드 단계 키 |
| `savedAt` | ISO string | 안내 팝업 시각 |
| `programTitleKo` | string? | 안내 팝업 제목 |

알 수 없는 키는 버리지 말고 그대로 저장·echo 하는 것을 권장합니다.

---

### P0-4 — DELETE

```http
DELETE /api/admin/program-draft?programType=TRAINED_TEACHER
```

**요청**
- 행이 없어도 성공 (idempotent). 없음을 `DATABASE_ERROR`로 만들지 말 것
- 응답 예: `{ "success": true, "data": { "deletedCount": 0 } }`
- 이후 GET은 P0-1 빈 성공

fresh 진입(신규로 시작)에서 FE가 DELETE를 먼저 호출합니다.

---

### P0-5 — 스모크 (같은 관리자 토큰)

아래가 모두 통과해야 합니다. 다른 `programType` 회귀도 한 번씩.

```bash
# 1) 없음 조회 — 200, success true, data null (또는 전용 NOT_FOUND). DATABASE_ERROR 금지
GET /api/admin/program-draft?programType=TRAINED_TEACHER

# 2) 생성
PUT /api/admin/program-draft
{ "programType": "TRAINED_TEACHER", "draftPayload": { "version": 1, "registrationTemplateCode": "registration-trained-teachers", "formVersions": {}, "savedAt": "2026-09-21T00:00:00.000Z" } }
# → data.draftId number

# 3) 재조회 — 같은 draftId, payload echo
GET /api/admin/program-draft?programType=TRAINED_TEACHER

# 4) 삭제 — 200
DELETE /api/admin/program-draft?programType=TRAINED_TEACHER

# 5) 다시 조회 — 빈 성공
GET /api/admin/program-draft?programType=TRAINED_TEACHER

# 회귀
GET /api/admin/program-draft?programType=GENERAL
GET /api/admin/program-draft?programType=COMPANY_SCHOOL
GET /api/admin/program-draft?programType=UJAT
```

CMS 수동:
1. `/programs/trained-teachers` → 프로그램 등록 → 전역 「서버 오류」/`DATABASE_ERROR` 없이 폼 표시
2. 대표 프로그램명 입력 후 저장 → PUT 2xx
3. 목록으로 나갔다가 다시 등록 → 이어서 작성 안내 또는 fresh
4. 등록 완료 → `POST /api/admin/programs` 에 `programType=TRAINED_TEACHER` + `programDraftId` 전달 가능

---

### 조사 체크리스트 (BE)

- [ ] 로컬/스테이징 로그의 root cause (`SQLException`, enum, JSONB, NoResultException)
- [ ] DB enum/CHECK에 `TRAINED_TEACHER` 존재
- [ ] Java enum ↔ DB 값 문자열 일치 (`TRAINED_TEACHER`)
- [ ] GET no-row 경로가 예외가 아니라 empty
- [ ] 손상 `draft_payload`가 GET 500을 유발하는지, DELETE로 복구 가능한지
- [ ] unique 키가 admin + programType인지, TT만 누락된 제약이 있는지
- [ ] `DATABASE_ERROR` 래핑 전에 원인 코드/traceId를 남기는지 (FE message는 한국어 유지)

원인 코드를 회신해 주세요. 예:
- A. enum/컬럼에 `TRAINED_TEACHER` 없음 → 마이그레이션
- B. no-row를 예외로 처리 → empty 200
- C. 기존 JSON payload 역직렬화 실패 → opaque JSON + DELETE 복구
- D. 기타 (스택 요약)

---

### 하지 말 것

- `programType`을 `GENERAL`로 강제하거나 TT GET을 GENERAL draft로 대체
- 없으면 500/`DATABASE_ERROR`
- `draftPayload`를 서버 DTO로 깨뜨려 `formVersions`/`savedAt` 유실
- 일반·1사1교·UJAT program-draft 계약 변경
- FE가 고치도록 `DATABASE_ERROR`를 정상 빈 응답처럼 쓰라고 요청 (등록 완료에 draftId가 필요함)
````

---

## FE 호출 매핑 (참고)

| 시점 | Method | FE |
|------|--------|----|
| 목록 「프로그램 등록」 | GET | `fetchRegistrationDraftNotice('registration-trained-teachers')` |
| fresh 진입 | DELETE | `deleteRegistrationProgramDraftRemote('TRAINED_TEACHER')` |
| 위저드 오픈/ensure | GET → 없으면 PUT | `ensureRegistrationProgramDraftId` |
| 단계 동기화 | PUT | `syncRegistrationProgramDraft` |
| 등록 완료 | GET/PUT 후 create | `programDraftId` + formBindings |

클라이언트: `apps/cms/src/features/program/general/api/program-draft-api-client.ts`

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-09-21 | 최초. 로컬 재현 `GET …?programType=TRAINED_TEACHER` → `DATABASE_ERROR`. FE는 진입 폴백만 적용, 등록 완료는 BE 수정 필요 |
