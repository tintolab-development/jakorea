# BE 수정 요청 (2026-09-21) — 프로그램 등록 program-draft API 계약

**작성일:** 2026-09-21  
**문서 성격:** **이 파일만** 보고 구현·검수 가능 (선행 문서 열람 불필요)

### 적용 범위 — 전 프로그램 유형 공통 (필수)

| | |
|---|---|
| **적용** | **모든** 프로그램 등록 위저드 유형에 **동일 계약**으로 적용한다. |
| **포함 유형** | `GENERAL` · `COMPANY_SCHOOL` · `UJAT` · `TRAINED_TEACHER` |
| **대상 API** | `GET` · `PUT` · `DELETE` `/api/admin/program-draft` |
| **FE SSOT** | `apps/cms/src/features/program/general/lib/registration-program-draft-session.ts` |

**관련 FE 문서:** [programs-non-general-registration-form-bindings-backend-request-2026-09-18.md](./programs-non-general-registration-form-bindings-backend-request-2026-09-18.md) (form-bindings·draft-owned version)

---

## 핵심 요구 (한 줄)

**임시저장 draft가 없을 때 GET은 200 + `draft: null`이어야 하며, 404·500으로 “없음”을 표현하면 안 된다.**

---

## 배경 — 현재 FE 관측 (2026-09-21)

| 시나리오 | 현재 BE | FE 임시 처리 |
|----------|---------|--------------|
| 등록 버튼 → draft 없음 | `GET ?programType=GENERAL` **500** | 404/500을 empty로 간주 (`program-draft-api-client.ts`) |
| 신규 등록(fresh) 진입 | 불필요 DELETE + PUT 중복 | probe 결과로 DELETE 생략, in-flight dedup |
| 이어서 작성(continue) | GET 중복 | 목록 버튼 GET 캐시 재사용 |

FE는 BE 수정 전까지 404/500을 “draft 없음”으로 처리하지만, **정식 계약은 200 null**이다.

---

## 1. GET `/api/admin/program-draft`

### Query

| 이름 | 필수 | 값 |
|------|------|-----|
| `programType` | Y | `GENERAL` \| `COMPANY_SCHOOL` \| `UJAT` \| `TRAINED_TEACHER` |

> OpenAPI `params` object 형태가 아닌 **flat query** `?programType=GENERAL` 로 호출한다.

### 성공 — draft 있음 (200)

```json
{
  "success": true,
  "data": {
    "draft": {
      "draftId": 123,
      "programType": "GENERAL",
      "draftPayload": {
        "version": 1,
        "registrationTemplateCode": "registration-general",
        "formVersions": {},
        "savedAt": "2026-09-21T01:00:00.000Z",
        "programTitleKo": "2026 JA 경제교육",
        "activeStep": "recruit-participant-individual"
      },
      "createdAt": "2026-09-20T12:00:00.000Z",
      "updatedAt": "2026-09-21T01:00:00.000Z"
    }
  }
}
```

### 성공 — draft 없음 (200, **필수**)

```json
{
  "success": true,
  "data": {
    "draft": null
  }
}
```

| 항목 | 규칙 |
|------|------|
| HTTP | **200** |
| `data.draft` | **`null`** (필드 생략 금지 — FE normalize 호환) |
| 404 | **사용 금지** — “리소스 없음”이 아니라 “현재 계정·유형에 저장본 없음”은 정상 상태 |
| 500 | **사용 금지** — 감사로그 등 부가 처리 실패가 empty read를 막으면 안 됨 |

### draftPayload 스키마 (FE v1)

| 필드 | 타입 | 설명 |
|------|------|------|
| `version` | `1` | payload 버전 |
| `registrationTemplateCode` | string | `registration-general` 등 |
| `formVersions` | `Record<templateCode, { templateId, draftVersionId }>` | draft-owned form version refs |
| `savedAt` | ISO8601 | 마지막 저장 시각 |
| `programTitleKo` | string? | 임시저장 안내 팝업 제목 |
| `activeStep` | string? | 위저드 step key |

---

## 2. PUT `/api/admin/program-draft` (upsert)

### Request body

```json
{
  "programType": "GENERAL",
  "draftPayload": {
    "version": 1,
    "registrationTemplateCode": "registration-general",
    "formVersions": {},
    "savedAt": "2026-09-21T01:05:00.000Z"
  }
}
```

| 규칙 | 내용 |
|------|------|
| 동작 | `(accountId, programType)` 당 **1건 upsert** — 없으면 생성, 있으면 덮어쓰기 |
| `draftPayload` | JSON object (stringify 필드명 `draftPayloadJson` **병행 응답 가능**, FE normalize 지원) |
| 동시 PUT | 동일 programType 동시 요청 시 **409** 또는 마지막 쓰기 승 — FE는 in-flight dedup 적용 |

### 성공 응답 (200)

```json
{
  "success": true,
  "data": {
    "draftId": 123,
    "programType": "GENERAL",
    "saved": true
  }
}
```

| 필드 | 필수 | 비고 |
|------|------|------|
| `draftId` | Y | form-template copy `ownerProgramDraftId` |
| `programType` | Y | 요청 echo |
| `saved` | 권장 | `true` |

---

## 3. DELETE `/api/admin/program-draft`

### Query

| 이름 | 필수 | 값 |
|------|------|-----|
| `programType` | Y | 위와 동일 enum |

### 규칙

| 시나리오 | HTTP | 비고 |
|----------|------|------|
| draft 존재 → 삭제 | **200** 또는 **204** | FE 모두 성공 처리 |
| draft 없음 → 삭제 | **200** 또는 **204** | **멱등(idempotent)** — 404 금지 |
| 등록 완료·fresh(기존본 폐기)·continue 완료 후 | DELETE 1회 | form-owned version session 정리 트리거 |

---

## 4. FE 호출 시퀀스 (중복 제거 후)

### A. 신규 등록 — draft 없음 (등록 버튼, 팝업 없음)

```
1. GET ?programType=GENERAL     → 200 { draft: null }
2. PUT  (fresh ensure)          → 200 { draftId }
   (DELETE 생략)
```

### B. 신규 등록 — draft 있음 → 「새로 작성」

```
1. GET ?programType=GENERAL     → 200 { draft: {...} }
2. DELETE ?programType=GENERAL  → 200/204  (서버 draft 폐기)
3. PUT  (fresh ensure)          → 200 { draftId }
```

> **제품 정책:** 「새로 작성」 선택 시 UI는 시드로 시작. 서버 draft 유지 여부는 PM 확인 필요 — 현재 FE fresh 경로는 DELETE 후 새 draftId 생성.

### C. 이어서 작성

```
1. GET ?programType=GENERAL     → 200 { draft: {...} }   (등록 버튼, 1회)
2. (모달 open)                  → GET 생략 (세션 캐시)
3. form edit PUT program-draft  → 임시저장 시
4. 등록 완료 DELETE             → 1회
```

---

## 5. 응답 shape 호환 (FE normalize)

FE `normalizeProgramDraftItem`이 수용하는 형태:

| 형태 | 예 |
|------|-----|
| envelope + nested draft | `{ data: { draft: { draftId, draftPayload } } }` |
| flat item | `{ draftId, draftPayload }` |
| legacy id | `{ id, draftPayloadJson }` |
| **empty** | `{ draft: null }` → **null** |

---

## 6. 감사로그·fail-closed

| API | 정책 |
|-----|------|
| GET (empty) | 감사 실패 시에도 **200 + draft null** — 등록 진입 차단 금지 |
| GET (exists) | 감사 실패 시 500 허용 (민감 payload 포함 시) |
| PUT / DELETE | 기존 fail-closed 정책 유지 |

---

## 7. 검수 체크리스트 (BE)

- [ ] `GET ?programType=GENERAL` — draft 없을 때 **200 + draft:null** (500/404 없음)
- [ ] 4개 programType 각각 empty / exists 케이스
- [ ] `PUT` upsert 후 `GET`으로 동일 `draftId`·payload 반환
- [ ] `DELETE` 멱등 — 없는 draft DELETE → 200/204
- [ ] `draftPayload.formVersions` round-trip (draft-owned copy 연동)
- [ ] Swagger `ProgramDraftResponse.draft` optional → **nullable** 명시

---

## 8. OpenAPI 보완 제안

```yaml
ProgramDraftResponse:
  type: object
  required: [draft]
  properties:
    draft:
      oneOf:
        - $ref: '#/components/schemas/ProgramDraftItemResponse'
        - type: 'null'
```

GET responses에 **404 제거**, empty 예시 추가.

---

## 9. POST `/api/admin/programs` + `programDraftId` / `formBindings` (옵션 1)

등록 완료 시 FE는 아래 형태로 create한다 (`autoApplyDefaultFormBindings: false`).

```json
{
  "programType": "GENERAL_INDIVIDUAL",
  "autoApplyDefaultFormBindings": false,
  "programDraftId": 15,
  "formBindings": [
    {
      "formType": "REGISTRATION",
      "templateId": 89,
      "templateVersionId": 116,
      "active": true,
      "required": false
    },
    {
      "formType": "RECRUITMENT",
      "templateId": 92,
      "templateVersionId": 117,
      "active": true,
      "required": false,
      "targetRole": "INDIVIDUAL"
    },
    {
      "formType": "APPLICATION",
      "templateId": 96,
      "templateVersionId": 118,
      "active": true,
      "required": false,
      "targetRole": "INDIVIDUAL"
    }
  ]
}
```

### 9.1 programType 이중 키 (중요)

| 용도 | programType 값 | 예 |
|------|----------------|-----|
| **program-draft API** (`GET/PUT/DELETE`) | 4값 coarse | `GENERAL` · `COMPANY_SCHOOL` · `UJAT` · `TRAINED_TEACHER` |
| **programs create body** | create enum | `GENERAL_INDIVIDUAL` · `GENERAL_ORGANIZATION` · … |

- `programDraftId`는 **coarse program-draft 키**(`GENERAL` 등)로 생성·copy된 draft여야 한다.
- create body의 `programType: GENERAL_INDIVIDUAL`과 **draft query programType이 다름은 정상**이다.
- BE는 `programDraftId` 검증 시 create `programType`과 draft `programType`을 **1:1 강제하면 안 됨** (coarse ↔ fine 매핑 규칙 문서화).

### 9.2 formBindings 검증 규칙 (BE 필수)

| # | 규칙 |
|---|------|
| 1 | `autoApplyDefaultFormBindings: false`이면 `programDraftId` + `formBindings` **필수** |
| 2 | `autoApplyDefaultFormBindings: true`이면 `formBindings` **금지** (또는 무시·400 중 하나로 고정) |
| 3 | 각 `templateVersionId`는 **PUBLISHED** 상태 |
| 4 | 각 version의 `ownerProgramDraftId` = 요청 `programDraftId` |
| 5 | `formType: REGISTRATION` binding **허용** (공통 등록 양식 — RECRUITMENT/APPLICATION과 동등) |
| 6 | `targetRole`은 RECRUITMENT/APPLICATION에만. REGISTRATION에는 **없음** |
| 7 | 공용 catalog `templateId` 직접 binding **금지** — program-draft copy 전용 id만 |

### 9.3 400 자주 나는 원인 (2026-09-21 관측)

| 원인 | FE/BE | 기대 |
|------|-------|------|
| draft `programType=GENERAL` vs create `GENERAL_INDIVIDUAL` 불일치로 거절 | BE | coarse draft + fine create **허용** |
| `templateVersionId`가 DRAFT 상태 | FE publish 누락 또는 BE publish 실패 | `PROGRAM_FORM_BINDING_REQUIRES_PUBLISHED_VERSION` 등 명확 code |
| `ownerProgramDraftId` ≠ `programDraftId` | FE copy 시 draftId 불일치 | 400 + field |
| `formType: REGISTRATION` 미지원 | BE | enum·validator에 REGISTRATION 추가 |
| BE create formBindings 트랜잭션 미구현 | BE | 400 대신 **501/명시 code** 또는 구현 |

### 9.4 성공 시 기대

- 프로그램 create + form-bindings가 **단일 트랜잭션**으로 commit
- 실패 시 program row만 생기고 binding empty인 **부분 성공 금지**
- 성공 후 `DELETE /api/admin/program-draft?programType=GENERAL` (FE가 호출)

---

**Last updated:** 2026-09-21
