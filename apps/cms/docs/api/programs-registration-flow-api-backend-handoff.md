# 일반 프로그램 등록 플로우 API — 백엔드 핸드오프

CMS `/programs/general` **신규 프로그램 등록 위저드** 전체에서 FE가 호출하거나, 호출 예정인 API·계약 갭을 한곳에 모은 BE 개발·검증용 문서입니다.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-15 |
| **대상 화면** | `/programs/general?new=1` → 공통정보 → (모집) → 신청정보 → 「프로그램 등록 완료」 |
| **OpenAPI 기준** | 2026-07-15 live `/v3/api-docs` (475 paths) · Swagger UI |
| **FE remote 모듈** | `VITE_REAL_API_MODULES`에 `programs` (+ 양식 저장 시 forms/surveys 계열) + 관리자 JWT |
| **관련 문서** | [**등록 완료 POST 상세**](./programs-create-api-backend-handoff.md) · [programs-api-integration.md](./programs-api-integration.md) · [programs-api-backend-gaps.md](./programs-api-backend-gaps.md) · [form-template-json-contract.md](./form-template-json-contract.md) · [writing-form-seeds-backend-handoff.md](./writing-form-seeds-backend-handoff.md) · [backend-handoff.md](./backend-handoff.md) |

> **범위**: 일반 프로그램(`GENERAL`) **등록 위저드**만. 1사1교·UJAT·Gemini·상세 LNB(신청 승인·면접·출석 등)는 제외.

---

## 1. 한눈에 보기

| CMS 단계 | 사용자 동작 | FE가 기대하는 API | OpenAPI | FE 상태 |
|----------|-------------|-------------------|---------|---------|
| 양식 로드 | 위저드 진입 · 단계 전환 | form-template payload/version **GET** | ✅ | wired / local fallback |
| 중간 저장 | 헤더 「저장」 | `PUT /api/admin/form-template-versions/{versionId}` | ✅ | wired / localStorage |
| 작성만 | 탭 이동 · 입력 | programs POST **없음** | — | draft만 |
| **등록 완료** | 「프로그램 등록 완료」 | **`POST /api/admin/programs` 1회** | ✅ | wired |
| 완료 직후 | 목록·상세 모달 | `GET /api/admin/programs?programType=GENERAL` · `GET …/{id}` | ✅ | wired |

```text
/programs/general?new=1
    │
    ├─ Phase: 공통 정보 (registration-general draft)
    ├─ Phase: 모집 정보 (참여자 유형별 recruitment draft)
    └─ Phase: 신청 정보 (application-* draft)
              │
              ├─ 헤더 「저장」 → form-template draft만 (programs POST 없음)
              └─ 「프로그램 등록 완료」
                    → (선택) template draft persist
                    → POST /api/admin/programs
                    → 성공 시 programId + lnb=info (상세 모달)
```

**중요**: 생성 POST는 신청정보 푸터 **등록 완료**에서만 발생합니다. 중간 저장으로 프로그램을 만들지 않습니다.

등록 완료 body·샘플·수락 기준의 상세는 [programs-create-api-backend-handoff.md](./programs-create-api-backend-handoff.md)를 따릅니다.

---

## 2. 등록 플로우에 필요한 API 목록

### 2.1 P0 — 등록 완료 스모크 (필수)

| Method | Path | operationId | 역할 | OpenAPI | BE 확인 |
|--------|------|-------------|------|---------|---------|
| `POST` | `/api/admin/programs` | `createProgram` | 프로그램 생성 (등록 완료) | ✅ | [ ] 200 + 안정적 `data.id` |
| `GET` | `/api/admin/programs` | `listPrograms` | 생성 직후 목록 노출 | ✅ | [ ] `programType=GENERAL`로 조회됨 |
| `GET` | `/api/admin/programs/{programId}` | `getProgram` | 상세 모달 | ✅ | [ ] title·기간·rounds·`serviceDetailJson` |

**Create 요청 schema**: `ProgramCreateRequest`  
**Create 응답**: `ApiResponse` + `ProgramResponse`(또는 동등 detail)

FE 매핑: `mapGeneralProgramToCreateRequest` → `createAdminProgramRemote`.

### 2.2 P0 — 위저드 중간 저장·양식 (필수)

등록/모집/신청 **WritingFormDraft**는 programs POST에 넣지 않습니다. 별도 form-templates API입니다.

| Method | Path | operationId | 역할 | OpenAPI | BE 확인 |
|--------|------|-------------|------|---------|---------|
| `PUT` | `/api/admin/form-template-versions/{versionId}` | `updateVersion` | draft 중간 저장 (`schemaJson` 등) | ✅ | [ ] DRAFT version 갱신 |
| `GET` | `/api/admin/form-template-versions/{versionId}` | `getVersion` | draft 로드 | ✅ | [ ] |
| `GET` | `/api/admin/form-templates/by-code/{templateCode}/payload` | `getTemplatePayloadByCode` | 코드 기준 최신 payload | ✅ | [ ] 시드 존재 |

**일반 등록 위저드에서 쓰는 templateCode 예**

| 단계 | templateCode |
|------|--------------|
| 공통(등록) | `registration-general` |
| 모집 | `recruitment-participant-school` / `recruitment-participant-individual` / `recruitment-instructor` / `recruitment-volunteer` |
| 신청 | `application-participant-school` / `application-participant-individual` / `application-instructor` / `application-volunteer` |

시드·JSON 계약: [writing-form-seeds-backend-handoff.md](./writing-form-seeds-backend-handoff.md) · [form-template-json-contract.md](./form-template-json-contract.md)  
`registration-general` 시드: [form-template-seeds/registration-general.json](./form-template-seeds/registration-general.json)

### 2.3 P1 — 후원사 (공통정보·Create body)

| Method | Path | operationId | 역할 | OpenAPI | FE 상태 |
|--------|------|-------------|------|---------|---------|
| `GET` | `/api/admin/sponsors` | `sponsors` | 후원사 목록 | ✅ | 공통정보 편집 wired |
| `GET` | `/api/admin/sponsors/{sponsorId}/contacts` | `contacts` | 담당자 | ✅ | 공통정보 편집 wired |

등록 완료 스냅샷은 현재 **mock sponsor 하드코드** 비중이 큼. Create의 `sponsorId`는 실제 유효 id여야 하므로 BE는 존재하지 않는 id에 **400 + 명확한 메시지**를 주세요.

---

## 3. OpenAPI에 있으나 FE 미연동 · 역할 합의 필요

아래는 Path가 이미 있습니다. 등록 UX에 **쓸지 / 서버가 create 시 자동 처리할지**를 BE·FE가 합의해야 합니다.

| Method | Path | operationId | 의도된 역할 | FE | BE 확인 |
|--------|------|-------------|-------------|----|---------|
| `POST` | `/api/admin/programs/drafts` | `saveDraft` | 프로그램 단위 draft | **미사용** — FE는 form-template draft | [ ] form-template draft와 역할 분담 문서화 |
| `GET`/`PUT`/`DELETE` | `/api/admin/program-draft` | (draft CRUD) | 동일 | **미사용** | [ ] 동일 |
| `GET` | `/api/admin/programs/{programId}/default-form-bindings/preview` | `previewDefaultFormBindings` | 기본 양식 바인딩 preview | **미호출** | [ ] GENERAL 후보 목록 올바른지 |
| `POST` | `/api/admin/programs/{programId}/default-form-bindings/apply` | `applyDefaultFormBindings` | 기본 바인딩 일괄 적용 | **미호출** | [ ] create 후 자동 적용 vs FE 호출 |
| `POST` | `/api/admin/programs/{programId}/form-bindings` | `createFormBinding` | 바인딩 단건 | **미호출** | [ ] apply와 관계 |
| `GET` | `/api/admin/programs/{programId}/form-bindings` | `formBindings` | 바인딩 목록 | 상세 트랙 | [ ] |
| `GET` | `/api/admin/programs/code-preview` | `programCodePreview` | 코드 미리보기 | 등록 UI 미사용 | 선택 |

**권장 (등록 UX)**

1. **중간 저장 SSOT**: 계속 `PUT …/form-template-versions/{versionId}` (현재 FE).
2. **생성 후 양식 연결**: create 성공 후 서버가 `default-form-bindings/apply`와 동등 동작을 **자동** 수행하거나, FE가 apply를 1회 호출 — 둘 중 하나를 명시.
3. programs `drafts` API는 위저드와 **병행하지 않음**을 문서화 (혼선 방지).

---

## 4. 계약 갭 · 미비 항목 (개발 체크리스트)

### 4.1 P0 — Create 스모크

- [ ] 관리자 JWT로 `POST /api/admin/programs` 성공 (200 + `data.id`)
- [ ] 직후 `GET /api/admin/programs?programType=GENERAL` 목록에 노출
- [ ] `GET /api/admin/programs/{id}` 에서 title·기간·rounds 확인
- [ ] 생성 프로그램이 **일반(`GENERAL`)** 으로 분류  
      - **갭**: `ProgramCreateRequest`에 `programType` 필드 **없음** (목록 query·`ProgramDraftSaveRequest`에만 존재)  
      - → 서버 기본값/추론 규칙을 **문서화**하거나 Create body에 `programType: "GENERAL"` 공식 필드 추가
- [ ] `lifecycleStatus` / `periodStatus` 매핑: FE `recruiting_students` ↔ 목록 `RECRUITING`

### 4.2 P1 — nested · 날짜 · 후원사

- [ ] `serviceDetailJson` create 저장 + detail GET **round-trip** (이중 stringify 금지)
- [ ] nested 키 v1: `schemaVersion`, `generalParticipantTypes`, `generalSurveyMenuKeys`, (공통정보 저장 시) `generalCommonInfo` 등 — SSOT: `general-program-service-detail-json.ts`
- [ ] `sponsorId` 타입(UUID vs 숫자 string) · 없는 id → 400 메시지
- [ ] `startDate`/`endDate` vs `businessStartDate`/`businessEndDate` 매핑
- [ ] 날짜: FE는 ISO-8601 datetime 전송 — 수신·파싱 허용

### 4.3 P2 — 등록 UX 고도화

- [ ] Create body에 `programType: "GENERAL"` 공식 필드
- [ ] 생성 시 form-bindings 일괄 생성 (apply 자동 또는 FE 호출 계약)
- [ ] 생성자 admin → OWNER `adminAssignments` 자동 부여 여부 명시
- [ ] 폼 실입력값 → Create 필드 전량 매핑 (현재 FE 스냅샷 하드코드 비중 큼 — FE 후속 + BE 수용)
- [ ] CMS만 쓰는 필드(`scheduleTimeEnabled`, `studentListRequired` 등) — Create schema에 없음 · 현재 미전송 · 필요 시 `serviceDetailJson` 또는 schema 확장

---

## 5. Create 요청 · 응답 (요약)

상세 샘플 body·필드표는 [programs-create-api-backend-handoff.md](./programs-create-api-backend-handoff.md) §4.

### 5.1 등록 완료에서 채워질 수 있는 필드

| 필드 | 비고 |
|------|------|
| `sponsorId`, `title`, `mainTitle`, `type`, `format`, `category`, `description` | ★ 스냅샷 |
| `startDate`, `endDate`, `applicationStartDate`, `applicationEndDate` | ★ ISO |
| `status`, `lifecycleStatus`, `businessArea`, `targetLevel` | ★ |
| `rounds[]` | ★ `ProgramRoundRequest` |
| `serviceDetailJson` | ★ CMS nested JSON **string** |
| `instructors`, `venue`, `wagePolicies`, `schedules`, `adminAssignments`, … | Create schema에 있으나 등록 스냅샷은 대부분 미설정 |

### 5.2 Create body에 없는 것

| 항목 | 현재 | BE 요청 |
|------|------|---------|
| `programType` | 목록 query만 `GENERAL` | Create 필드 또는 서버 기본값 문서화 |
| `generalParticipantTypes` 등 | `serviceDetailJson`으로만 | GET detail round-trip |
| WritingFormDraft | form-templates API | programs POST에 넣지 않음 |

### 5.3 FE가 응답에서 반드시 쓰는 것

| 필요 | 이유 |
|------|------|
| 안정적인 프로그램 id | 상세 URL·이후 API path |
| 제목 (`title`/`mainTitle` 또는 list `nameKo`) | 목록 반영 |
| `serviceDetailJson` round-trip | 참여자 유형·설문 메뉴·교육구조 |

---

## 6. 이 플로우에 포함하지 않는 API

| 데이터 | API | 시점 |
|--------|-----|------|
| Platform 사용자 신청 제출 | `…/form-bindings/…/responses` 등 | 프로그램 생성 **이후** |
| 게시글/설문 등록 | `POST …/posts`, surveys | 상세 운영 |
| 신청 승인·면접·출석·과제 | applications / programProgress | 상세 LNB |
| 담당자 CRUD · 신청경로 리소스 | OpenAPI path 없음 또는 부족 | [programs-api-backend-gaps.md](./programs-api-backend-gaps.md) P2 |

---

## 7. 에러 응답 (FE 처리)

공통: [backend-handoff.md](./backend-handoff.md) 에러 래퍼.

| HTTP | FE 기대 |
|------|---------|
| 400 | validation → 사용자 메시지 |
| 401 | 재로그인 |
| 403 | 권한 없음 |
| 409 | 충돌(중복·상태) |
| 500 | 일반 실패 알림 |

등록 완료 실패 문구 예:「프로그램 등록 중 오류가 발생했습니다. 다시 시도해 주세요.」  
실패 시 URL에 `new=1` 유지 (완료 전환 없음).

---

## 8. 수락 기준 (QA)

| # | 시나리오 | 기대 |
|---|----------|------|
| 1 | remote ON · 「프로그램 등록 완료」 | Network에 `POST /api/admin/programs` **정확히 1회** |
| 2 | 위저드 헤더 「저장」만 | programs POST **없음** · form-template PUT(또는 local)만 |
| 3 | 성공 | 목록에 행 추가 · URL `programId` · 상세 정보 탭 |
| 4 | 실패 4xx/5xx | 등록 실패 알림 · `new=1` 유지 |
| 5 | remote OFF | localStorage `general-local-*` · POST 없음 |
| 6 | (합의 후) form-bindings | create 직후 신청/모집 양식 바인딩 존재 또는 apply 성공 |

---

## 9. FE 코드 앵커

| 역할 | 경로 |
|------|------|
| 위저드 UI | `features/program/general/ui/registration/registration-fullpage-modal.tsx` |
| 단계·완료 | `features/program/general/hooks/use-registration-flow.ts` |
| 등록 완료 | `features/template/hooks/use-program-registration-editor.ts` → `handleCompleteRegistration` |
| persist / mock | `features/program/general/lib/registration-local-save.ts` |
| remote create | `features/program/general/api/admin-general-programs-service.ts` → `createGeneralProgram` |
| HTTP | `features/program/general/api/programs-api-client.ts` → `createAdminProgramRemote` |
| body 매핑 | `features/program/general/api/adapters/general-program-adapters.ts` |
| `serviceDetailJson` | `features/program/general/lib/general-program-service-detail-json.ts` |

---

## 10. 우선순위 요약 (BE)

| 우선 | 할 일 |
|------|--------|
| **P0** | `POST /api/admin/programs` 스모크 + GENERAL 분류 + list/detail 반영 + lifecycle↔period 매핑 |
| **P0** | form-template version PUT/GET · `registration-general` 등 시드 payload |
| **P1** | `serviceDetailJson` round-trip · sponsorId · 날짜/business* 매핑 |
| **P2** | Create `programType` · form-bindings apply(자동 또는 FE) · adminAssignments OWNER |
| **합의** | programs draft API vs form-template draft — 위저드는 후자만 사용 |

---

_문서 기준 OpenAPI: 2026-07-15 live `/v3/api-docs`. 스펙 drift 시 Swagger·`apps/cms/openapi/backend.openapi.json`과 재대조._
