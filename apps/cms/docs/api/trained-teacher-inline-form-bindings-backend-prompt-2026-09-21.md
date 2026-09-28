# BE 전달 프롬프트 — 교육받은 교사 create 인라인 `formBindings` 거절 (`INLINE_PROGRAM_FORM_BINDINGS_GENERAL_ONLY`)

**작성일:** 2026-09-21  
**우선순위:** P0  
**대상 화면:** CMS `/programs/trained-teachers` → 「프로그램 등록」→ 등록 완료  
**범위:** `POST /api/admin/programs` 의 `programType=TRAINED_TEACHER` + `programDraftId` + `formBindings`  
**비범위:** 일반(`GENERAL` / `GENERAL_INDIVIDUAL`) create의 기존 인라인 formBindings 동작은 유지  
**관련 문서:**
- [programs-non-general-registration-form-bindings-backend-request-2026-09-18.md](./programs-non-general-registration-form-bindings-backend-request-2026-09-18.md) ← 제품 계약 SSOT
- [program-draft-registration-backend-handoff-2026-09-21.md](./program-draft-registration-backend-handoff-2026-09-21.md) §9 (옵션 1)
- [trained-teacher-registration-flow-backend-prompt-2026-09-18.md](./trained-teacher-registration-flow-backend-prompt-2026-09-18.md)
- [trained-teacher-program-draft-database-error-backend-prompt-2026-09-21.md](./trained-teacher-program-draft-database-error-backend-prompt-2026-09-21.md)
- OpenAPI v9 `ProgramCreateRequest` / `ProgramFormBindingRequest`

---

## 한줄 요약

교육받은 교사 **등록 완료** 시 FE는 일반과 동일하게 create body에 `programDraftId` + `formBindings`(등록 중 수정·publish한 전용 version)를 보냅니다.  
BE가 `INLINE_PROGRAM_FORM_BINDINGS_GENERAL_ONLY` 로 **일반만** 허용해 400이 납니다.  
이 분기를 제거하고, `TRAINED_TEACHER`에서도 옵션 1(인라인 formBindings)을 같은 트랜잭션으로 받아 주세요.  
`autoApplyDefaultFormBindings: true`만으로 공용 시드를 최종 binding하면 **등록 중 수정분이 사라집니다.**

---

## 재현

1. CMS 로그인 (admin JWT)
2. `/programs/trained-teachers` → 「프로그램 등록」
3. 공통 → 모집 → 신청 작성 후 「등록 완료」
4. Network:

```http
POST /api/admin/programs
```

5. 실제 요청 (2026-09-21 로컬 `localhost:3000` → BE 프록시, 발췌)

```json
{
  "programType": "TRAINED_TEACHER",
  "applicationTargetMode": "ORGANIZATION",
  "autoApplyDefaultFormBindings": false,
  "programDraftId": 42,
  "formBindings": [
    {
      "formType": "REGISTRATION",
      "templateId": 5107,
      "templateVersionId": 256,
      "active": true,
      "required": false
    }
  ],
  "title": "교육받은교사(테스트)",
  "sponsorId": "1627251",
  "sponsors": [{ "sponsorId": "1627251", "sponsorContactId": "1627253" }]
}
```

`formBindings`에는 등록·모집·신청이 함께 올 수 있습니다. 위는 실제 캡처에서 REGISTRATION만 발췌한 예시입니다.

6. 실제 응답

```json
{
  "success": false,
  "data": null,
  "message": "인라인 프로그램 양식 연결은 일반 프로그램에서만 사용할 수 있습니다.",
  "error": {
    "code": "INLINE_PROGRAM_FORM_BINDINGS_GENERAL_ONLY",
    "message": "인라인 프로그램 양식 연결은 일반 프로그램에서만 사용할 수 있습니다.",
    "field": "formBindings",
    "traceId": "483e57d9e8d7418490ae78b9db41cd3b",
    "details": null
  }
}
```

프로그램 row는 생성되지 않아야 정상(현재처럼 실패)이지만, **실패 이유(일반만 허용)가 제품 계약과 다릅니다.**

---

## 기대 계약 (옵션 1 — 권장)

OpenAPI v9 `ProgramCreateRequest`:

| 필드 | TRAINED_TEACHER create |
|---|---|
| `programType` | `TRAINED_TEACHER` |
| `applicationTargetMode` | `ORGANIZATION` |
| `autoApplyDefaultFormBindings` | **`false`** (`formBindings` 지정 시) |
| `programDraftId` | **필수** (`formBindings` 지정 시). 등록 위저드 `GET/PUT /api/admin/program-draft?programType=TRAINED_TEACHER` 의 draft id |
| `formBindings` | **허용** — 일반과 동일 스키마 |

각 binding 항목 (`ProgramFormBindingRequest`):

| 필드 | 설명 |
|---|---|
| `formType` | `REGISTRATION` / `RECRUITMENT` / `APPLICATION` |
| `templateId` | 프로그램 전용(또는 draft-owned) template id |
| `templateVersionId` | **등록 중 수정 후 publish된** version id |
| `active` | `true` |
| `required` | FE는 `false` 고정 (BE가 `true` 강제하지 말 것) |
| `targetRole` | 신청/모집은 `ORGANIZATION` 가능. REGISTRATION은 생략 가능 |

### TRAINED_TEACHER 기대 binding 세트

| 역할 | formType | 시작 시드 templateCode | 최종 binding |
|---|---|---|---|
| 공통(등록) | `REGISTRATION` | `registration-trained-teachers` | **수정본** `templateId` / `templateVersionId` |
| 참여 기관 모집 | `RECRUITMENT` | `recruitment-trained-teachers` | 동일 |
| 참여 기관 신청 | `APPLICATION` | `application-trained-teachers` | 동일 |

- 참여자 유형은 학교/기관만. 강사·봉사자 기본 binding **없음**.
- 일반(`registration-general` 등) 세트와 **섞이면 안 됨**.
- 공용 카탈로그 published id를 그대로 binding하면 안 됨. 전용 copy/version이어야 함.

### 검증 규칙 (GENERAL과 동일, 유형만 확장)

| # | 규칙 |
|---|---|
| 1 | `autoApplyDefaultFormBindings: false` 이면 `programDraftId` + `formBindings` **필수** |
| 2 | `autoApplyDefaultFormBindings: true` 이면 `formBindings` **금지** (또는 무시·400 중 하나로 고정) |
| 3 | `formBindings` 지정 시 `programType`이 `GENERAL*` **또는** `TRAINED_TEACHER` (**권장: `COMPANY_SCHOOL` · `UJAT`도 동일**) |
| 4 | `INLINE_PROGRAM_FORM_BINDINGS_GENERAL_ONLY` **삭제 또는 TRAINED_TEACHER에는 적용하지 않음** |
| 5 | create 실패 시 프로그램 row · 고아 template/version · binding 롤백 |
| 6 | 성공 시 `GET …/programs/{id}/form-bindings` 가 요청한 `templateVersionId`를 가리킴 |

---

## 하면 안 되는 것

| ❌ | ✅ |
|---|---|
| `programType != GENERAL` 이면 인라인 formBindings 400 | 유형별 시드 code만 다르고, create 계약은 동일 |
| `autoApplyDefaultFormBindings: true`로 공용 시드를 최종 binding | 등록 중 수정·publish한 version으로 binding |
| 모집/신청만 copy하고 공통(등록)은 시드 고정 | 공통·모집·신청 모두 수정본 매핑 |
| `required: true` / `targetType` 미전송을 이유로 400 | OpenAPI대로 `required` optional, FE는 `targetRole` 사용 |

---

## FE 현황 (참고)

FE는 이미 옵션 1 payload를 만들 수 있습니다 (`prepareRegistrationCreateFormBindings` → create enrich).

현재 로컬 BE가 400을 반환하므로, **임시로** `TRAINED_TEACHER` create는 `autoApplyDefaultFormBindings: true`만 보내고 `formBindings`를 빼 둔 상태입니다.  
이 우회는 **등록은 되지만 위저드 수정본이 프로그램에 안 붙습니다.**  
BE가 본 계약을 수용하면 FE는 다시 `autoApplyDefaultFormBindings: false` + `programDraftId` + `formBindings`를 보냅니다.

선행 이슈: `GET/PUT /api/admin/program-draft?programType=TRAINED_TEACHER` 가 `DATABASE_ERROR`이면 `programDraftId`를 만들 수 없습니다. 본 이슈와 **함께** 고쳐 주세요.

---

## 수락 기준 (QA)

1. 위 재현 payload(또는 동등한 REGISTRATION+RECRUITMENT+APPLICATION 3건)로 `POST /api/admin/programs` → **201/200**, `INLINE_PROGRAM_FORM_BINDINGS_GENERAL_ONLY` 없음.
2. create 후 form-bindings에 요청한 `templateVersionId` 3종(또는 보낸 건수)이 존재. 일반 시드 code 미혼합.
3. 등록 중 신청 양식에 단락 추가 → create → 프로그램 상세 신청 양식에 해당 단락 존재. 공용 `application-trained-teachers` 시드 **불변**.
4. 수정 없이 완료해도 전용 `templateId`/`templateVersionId` (공용 catalog id 직접 binding 금지 권장).
5. 일반 프로그램 create 인라인 formBindings **회귀 없음**.
6. (권장) 1사1교·UJAT도 동일 코드 경로로 인라인 formBindings 허용. 유형별 시드 세트만 유형별 표 따름.

---

## BE 이슈/PR 본문 (복사용)

아래만 복사해서 백엔드 이슈에 붙여 주세요.

### 요청 요약

CMS 교육받은 교사 프로그램 신규 등록 완료 시 FE는 일반과 같은 옵션 1으로 create합니다.

```
POST /api/admin/programs
programType=TRAINED_TEACHER
autoApplyDefaultFormBindings=false
programDraftId=<wizard draft id>
formBindings=[{ formType, templateId, templateVersionId, active, required:false, targetRole? }]
```

현재 BE는 `INLINE_PROGRAM_FORM_BINDINGS_GENERAL_ONLY` 로 400을 반환합니다.  
이 분기를 제거하고 TRAINED_TEACHER에서도 인라인 formBindings를 같은 트랜잭션으로 publish/bind 해 주세요.

일반(GENERAL) 기본 동작은 유지해 주세요.  
1사1교·UJAT도 같은 게이트면 함께 풀어 주세요(시드 templateCode만 유형별).

### 왜 필요한가

등록 위저드에서 고친 공통·모집·신청 양식이 프로그램 SSOT가 되어야 합니다.  
`autoApplyDefaultFormBindings: true`만 쓰면 공용 시드가 최종 binding이 되어 수정분이 유실됩니다.

### TRAINED_TEACHER 기대 세트

| formType | 시작 templateCode |
|---|---|
| REGISTRATION | registration-trained-teachers |
| RECRUITMENT | recruitment-trained-teachers |
| APPLICATION | application-trained-teachers |

최종 binding은 위 시드의 **수정본 copy/version** 이어야 합니다.

### 재현 응답

- code: `INLINE_PROGRAM_FORM_BINDINGS_GENERAL_ONLY`
- message: `인라인 프로그램 양식 연결은 일반 프로그램에서만 사용할 수 있습니다.`
- field: `formBindings`
- traceId 예: `483e57d9e8d7418490ae78b9db41cd3b`

### 수락

- 동일 payload 201/200
- GET form-bindings = 요청 version
- 공용 시드 불변
- GENERAL 회귀 없음
- (선행) `GET/PUT /api/admin/program-draft?programType=TRAINED_TEACHER` 가 `DATABASE_ERROR`가 아니어야 `programDraftId`를 만들 수 있음
