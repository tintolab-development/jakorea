# CMS 관리자 역할 RBAC · 마스킹 해제 · 양식 버전 · 회원 등록 — BE 수정 요청

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-09-01 |
| **우선순위** | **P0** (뷰어 조회 불가 · 파트너 승인/열람 불가 · 프로그램/회원 등록 차단) |
| **요청 대상** | Admin role matrix · Members · Notifications · Forms-surveys |
| **화면** | CMS 회원 관리 · 권한 승인 · 헤더 알림 · 일반 프로그램 등록 · 회원 신규 등록 |
| **OpenAPI** | `apps/cms/openapi/members.openapi.json` · `notifications.openapi.json` · `forms-surveys.openapi.json` |
| **FE 역할 가드** | `apps/cms/src/shared/lib/admin-role-policy.ts` |
| **FE 권한 매트릭스(조회 전용 UI)** | `apps/cms/src/pages/admin/settings/admin-permission-settings-ui-data.ts` |
| **선행** | [member-pre-register-filled-document-500-backend-request-2026-08-26.md](./member-pre-register-filled-document-500-backend-request-2026-08-26.md) · [member-consent-filled-document-backend-handoff-2026-08-25.md](./member-consent-filled-document-backend-handoff-2026-08-25.md) · [writing-form-seeds-backend-handoff.md](../writing-form-seeds-backend-handoff.md) |

---

## 1. 요약

스테이징에서 **어드민(뷰어) / 어드민(파트너)** JWT로 CMS를 쓰면 아래 API가 **403**으로 막히고, 별도로 양식·회원 등록이 **500/404**로 끊깁니다. FE 화면 가드는 이미 허용하는데 서버 역할 매트릭스·엔드포인트 스코프가 더 좁습니다.

| # | 역할 | 관측 | 기대 |
|---|------|------|------|
| A | **VIEWER** | 목록 GET 4종이 **403** | 조회(READ) 성공. 쓰기·승인은 계속 차단 |
| B | **PARTNER** | 강사 unmask **403** | 주민등록번호·계좌 **외** 원문 200. 해당 필드는 마스킹 유지 |
| C | **PARTNER** | 강사 권한 승인/반려 **403** | `INSTRUCTOR_APPROVE` 허용, **200** |
| D | (공통) | 일반 프로그램 등록 진입 즉시 `PUT .../form-template-versions/11` **500** | 500 금지. DRAFT 저장 또는 4xx+code |
| E | (공통) | 회원 등록 성범죄 동의서 `GET .../form-template-versions/56` **404** | `agreement-crime` 버전 시드 · **200** |
| F | (공통) | 일반/강사 회원 등록 시 동의서 작성·동의 후 **500** | 기존 P0 재확인. 작성 본문 persist **200** |

FE는 403/500을 우회하려고 payload를 빼지 않습니다. **역할 매트릭스·필드 단위 마스킹·시드·500→4xx** 가 서버 수정입니다.

---

## 2. 역할별 기대 권한 (SSOT)

CMS 「관리자 권한 설정」 조회 전용 화면 + `canAdminAction()` 과 맞출 것. 코드 이름은 OpenAPI에 있는 권한을 우선하고, 없으면 동등 READ/WRITE를 매핑해 문서·시드에 밝힐 것.

### 2.1 VIEWER

| 허용 | 차단 |
|------|------|
| CMS 목록·상세 **조회** (회원 전체, 관리자 목록, 권한 승인 **목록**, 헤더 알림) | 등록·수정·삭제·발송·다운로드 |
| 화면 열람 카테고리 (로그인/다운로드/개인정보조회/버그 이력 **제외**) | 개인정보 원문 unmask |
| | 회원·강사·관리자 **승인/반려** |
| | 보안 로그 4종 |

`canAdminAction({ action: 'view' })` 는 보안 로그 외 **항상 true**. 뷰어 JWT로 목록 GET이 403이면 화면이 비어 있습니다.

### 2.2 PARTNER

마스터/PM과 동일하게 **조회 + 쓰기 + 강사 승인** 가능. **예외만** 차단:

| 차단 (unchecked) | API 함의 |
|------------------|----------|
| 주민등록번호 확인 (`pii_rrn`) | RRN 원문 미노출. unmask **전체 403 금지** |
| 계좌정보 확인 (`pii_account`) | 계좌번호 원문 미노출. 지급조서 등 **문서 전체 403 금지**, 해당 필드만 마스킹 |
| 회원 로그인/파일다운로드/개인정보조회/버그 이력 | 해당 로그 GET만 403 |
| 관리자 권한 신청 승인/반려 | `admin-approval-requests` **approve/reject** 만 마스터. **목록 GET은 허용** |

강사 권한 신청 승인/반려(`misc_instructor_permission_approval`)는 파트너 **체크됨** → `INSTRUCTOR_APPROVE` **grant**.

### 2.3 PM / MASTER (참고)

- PM: 파트너와 같고 + RRN/계좌 열람. 관리자 권한 승인·보안 로그는 마스터만.
- MASTER: 전부.

---

## 3. 이슈 A — VIEWER 목록 GET 403

### 3.1 재현

`roleCode=VIEWER` 관리자로 로그인 후 CMS 진입.

| Method | Path | 현재 | 기대 |
|--------|------|------|------|
| `GET` | `/api/admin/notifications?page=0&size=20&unreadOnly=false` | **403** | **200** (본인 수신함) |
| `GET` | `/api/admin/members/all` | **403** | **200** (마스킹 목록) |
| `GET` | `/api/admin/admin-accounts` | **403** | **200** |
| `GET` | `/api/admin/admin-approval-requests` | **403** | **200** (조회만) |

쓰기 API(등록·삭제·승인)는 뷰어 **403 유지**.

### 3.2 OpenAPI vs 런타임

| Path | OpenAPI 필요 권한 | OpenAPI 접근 범위 | 추정 원인 |
|------|-------------------|-------------------|-----------|
| `GET /api/admin/notifications` | 「별도 세부 권한 없음」 | 제한 없음 | 런타임이 `NOTIFICATION_READ` 또는 마스터 스코프를 요구 |
| `GET /api/admin/members/all` | `ADMIN_READ+MEMBER_READ` | CMS | VIEWER 매트릭스에 READ 미부여 |
| `GET /api/admin/admin-accounts` | `ADMIN_READ` | CMS | 동일 |
| `GET /api/admin/admin-approval-requests` | `ADMIN_READ` | **「마스터 관리자만 가능」** | 목록까지 마스터 스코프. **조회는 4역할 모두**여야 함 |

승인 mutation(`POST .../approve`)은 계속 마스터만.

### 3.3 BE 요청 (필수)

1. **VIEWER 역할 시드**에 아래를 grant.
   - `MEMBER_READ`
   - `ADMIN_READ` (목록·상세 조회)
   - `NOTIFICATION_READ` (헤더 알림. OpenAPI가 권한 없음이면 런타임 가드를 인증된 관리자 전원으로 완화)
   - `INSTRUCTOR_REQUEST_READ` (강사 권한 승인 **목록** 조회. 승인 mutation은 제외)
2. `GET /api/admin/admin-approval-requests` 스코프를 **마스터 전용에서 관리자 전원 조회로 변경**. OpenAPI 「마스터 관리자만」문구 삭제. **approve/reject/bulk**만 마스터.
3. 뷰어에게 `MEMBER_WRITE` / `ADMIN_WRITE` / `INSTRUCTOR_APPROVE` / `PRIVACY_RAW_READ` 를 **주지 말 것**.
4. 권한 부족은 **403 + `error.code`** (`ACCESS_DENIED`). 본문 없이 403만 주지 말 것.

### 3.4 검증

- [ ] VIEWER로 위 4개 GET **200**
- [ ] VIEWER로 `POST .../instructor-role-requests/{id}/approve` **403**
- [ ] VIEWER로 `POST .../admin-approval-requests/{id}/approve` **403**
- [ ] VIEWER로 회원 등록 pre-register **403**
- [ ] 헤더 알림 벨 목록이 비지 않음

---

## 4. 이슈 B — PARTNER 개인정보 unmask 403 (필드 단위)

### 4.1 재현

`roleCode=PARTNER` 로 강사 회원 상세 → 개인정보 마스킹 해제.

| Method | Path | 현재 | 기대 |
|--------|------|------|------|
| `POST` | `/api/admin/users/{memberId}/instructor/privacy/unmask` | **403** | **200**, RRN·계좌만 마스킹 유지 |

Network에 GET으로 보일 수 있으나 **계약·FE는 POST** (`unmaskInstructorMemberPrivacy`, body `{ reason }`). GET만 열려 있고 POST가 403이면 동일하게 맞춰 줄 것.

같은 정책이 필요한 형제 API:

| Path | 용도 |
|------|------|
| `POST /api/admin/users/{id}/individual/privacy/unmask` | 개인 회원 |
| `POST /api/admin/users/{id}/privacy/unmask` | 레거시 |
| `POST /api/admin/instructor-role-requests/{id}/privacy/unmask` | 강사 권한 신청 상세 |
| `POST /api/admin/users/{id}/consent-records/{consentType}/filled-document` | 동의서 보기 |

OpenAPI 강사 unmask: `PRIVACY_RAW_READ` 단일 게이트 → 파트너에 권한이 없거나 있어도 RRN이 들어 있으면 **요청 전체 403**.

filled-document: `MEMBER_READ+DYNAMIC_PRIVACY_PERMISSION`. 지급조서에 RRN/계좌가 있다고 **문서 전체 403** 하면 안 됨.

### 4.2 필드 정책 (파트너)

**원문 허용 (unmask 200에 포함)**

- 성별·생년월일
- 주소
- 연락처·이메일
- 학력
- 연동 소셜계정
- 정보 동의 항목 / 동의서 본문 중 RRN·계좌가 **아닌** 칸

**원문 금지 (응답에 남겨 두되 마스킹)**

- 주민등록번호 (앞·뒤 전체)
- 계좌번호
- 위 값이 들어 있는 sidecar/문서 **칸만** — 문서 자체는 열람 가능

**지급조서 사전 동의서** (`PAYMENT_STATEMENT_PRE_CONSENT` / `paymentBasicInfo`)

| 필드 | 파트너 |
|------|--------|
| `nameKo` / `nameEn` / 소속 / 주소 | 원문 가능 |
| `residentFront` / `residentBack` | **마스킹 유지** |
| `accountNumber` | **마스킹 유지** |
| `bankName` / `accountHolder` / `paymentPurpose` | 원문 가능 (계좌번호만 금지) |

성범죄·행정정보 동의서: 주민/계좌가 본문에 있으면 그 칸만 마스킹. **filled-document 403으로 화면을 막지 말 것.**

마스터·PM은 기존처럼 RRN·계좌 포함 전부 원문.

### 4.3 BE 요청 (필수)

1. 파트너에게 **부분 개인정보 열람** grant.
   - `PRIVACY_RAW_READ` (또는 동등) **부여**
   - `PRIVACY_RRN_READ` / `PRIVACY_ACCOUNT_READ`(또는 동등)는 **미부여**
   - 코드가 하나뿐이면 unmask **핸들러에서 역할별 필드 필터**. 권한 없음 ≠ 요청 전체 403.
2. unmask **200**.
   - 허용 필드: 원문
   - 금지 필드: 상세 GET과 동일한 마스크 패턴 유지
   - 감사로그: 실제 원문 나간 필드만 기록. RRN을 안 줬으면 RRN 열람으로 기록하지 말 것.
3. filled-document / 지급조서 스냅샷도 **동일 필드 필터**. `DYNAMIC_PRIVACY_PERMISSION`이 RRN을 요구해 403 나지 않게 할 것.
4. 파트너가 RRN만 따로 요청하는 API가 있으면 그때만 **403 + code** (`PRIVACY_RRN_FORBIDDEN` 등).
5. 뷰어는 unmask **403 유지**.

### 4.4 검증

- [ ] 파트너 + 강사 상세 unmask **200**, 전화·주소 원문, RRN·계좌 마스크
- [ ] 파트너 + 지급조서 「동의서 보기」 **200**, `resident*`·`accountNumber` 마스크, 성명·주소 원문
- [ ] 마스터 unmask 시 RRN·계좌 원문
- [ ] 뷰어 unmask **403 + code**

---

## 5. 이슈 C — PARTNER 강사 권한 승인/반려 403

### 5.1 재현

파트너로 권한 승인(강사) → 승인 또는 반려.

| Method | Path | OpenAPI 권한 | 현재 | 기대 |
|--------|------|--------------|------|------|
| `POST` | `/api/admin/instructor-role-requests/{id}/approve` | `INSTRUCTOR_APPROVE` | **403** | **200** |
| `POST` | `/api/admin/instructor-role-requests/{id}/reject` | `INSTRUCTOR_APPROVE` | **403** | **200** |

bulk-approve / bulk-reject / reset-pending 도 같은 권한이면 파트너에게 **동일 grant**.

관리자 탭 승인/반려는 파트너 **불가** (마스터만). 강사 탭만 허용.

### 5.2 BE 요청 (필수)

1. `PARTNER`(및 `PM`) 매트릭스에 `INSTRUCTOR_APPROVE` **grant**.
2. `VIEWER`에는 **미부여**.
3. 관리자 승인 API(`POST /api/admin/admin-approval-requests/.../approve|reject`)는 마스터만. 파트너 403 유지.

### 5.3 검증

- [ ] 파트너 강사 단건 승인·반려 **200**, 목록 상태 갱신
- [ ] 파트너 관리자 승인 **403**
- [ ] 뷰어 강사 승인 **403**

---

## 6. 이슈 D — 일반 프로그램 등록 `PUT /api/admin/form-template-versions/11` 500

### 6.1 재현

CMS → 일반 프로그램 등록 화면 **진입 직후** (저장 버튼 전).

```
PUT /api/admin/form-template-versions/11
```

**HTTP 500**. 등록 플로우가 깨지거나 콘솔/네트워크에 서버 오류가 남음.

`11`은 스테이징 `registration-general` 의 `latestVersionId`로 추정 (환경마다 숫자 다름).

### 6.2 FE가 PUT 하는 이유

등록 에디터는 프로그램 생성 전 양식 draft를 `PUT .../form-template-versions/{id}` 로 맞춥니다 (`saveFormTemplateVersionDraft` → `updateFormTemplateVersionRemote`).

- templateCode: `registration-general`
- body: `schemaJson` + 선택 `extensionJson` (`overlay` / `editorState`)
- 스텝 전환·임시저장·등록 완료 직전에도 동일 PUT

**카탈로그 게시본을 운영 데이터가 덮으면 안 됩니다.** 지금 500은 게시(PUBLISHED) 버전 PUT, 스키마 검증, NPE 후보입니다.

### 6.3 BE 요청 (필수)

1. **HTTP 500 금지.** 실패는 4xx + `error.code` (`FORM_VERSION_IMMUTABLE`, `VALIDATION_ERROR` 등).
2. `versionId=11`(또는 해당 템플릿 latest)이 **PUBLISHED** 이면:
   - PUT으로 게시본을 깨지 말 것.
   - **새 DRAFT를 만들어 저장** 후 그 versionId를 200으로 주거나
   - **409** + 「게시 버전은 수정 불가, DRAFT id 사용」.
3. `registration-general` 시드: **DRAFT 1개 + PUBLISHED 1개**. FE `resolveTemplateVersionId` 는 DRAFT를 먼저 고름. DRAFT가 없으면 게시본 PUT → 500이 납니다.
4. `extensionJson` 만 바뀌는 임시저장도 동일하게 DRAFT에만 기록.
5. 스택트레이스·`DATABASE_ERROR` 를 클라이언트로 흘리지 말 것.

시드 JSON: [form-template-seeds/registration-general.json](../form-template-seeds/registration-general.json)  
계약: [form-template-json-contract.md](../form-template-json-contract.md)

### 6.4 검증

- [ ] 일반 프로그램 등록 진입 시 PUT **500 없음**
- [ ] 게시 버전 GET 내용이 등록 임시저장 후에도 불변
- [ ] 임시저장 후 GET DRAFT에 `editorState`/`overlay` 반영
- [ ] 실패 시 4xx + `error.code` (500 아님)

---

## 7. 이슈 E — 성범죄 동의서 `GET /api/admin/form-template-versions/56` 404

### 7.1 재현

회원 신규 등록 → 약관 및 동의 → **성범죄 경력조회 및 아동학대 관련 범죄전력조회 동의서** 작성.

```
GET /api/admin/form-template-versions/56
```

**404**. 모달이 템플릿 이미지를 못 받거나 fallback만 씀.

`56`은 목록 캐시의 `agreement-crime` `latestVersionId`. 목록에 id가 있는데 GET이 404면 **깨진 FK / 미시드 버전**.

### 7.2 FE

`loadWritingFormTemplateDraft('agreement-crime')` → 목록에서 versionId resolve → `GET /api/admin/form-template-versions/{id}`.

시드: [form-template-seeds/agreement-crime.json](../form-template-seeds/agreement-crime.json)  
`paragraphs: []` 허용 (정적 이미지 + 파일 교체).

### 7.3 BE 요청 (필수)

1. `templateCode=agreement-crime` 행 + **실제 존재하는** version 시드. 목록 `latestVersionId` = GET 가능한 id.
2. 고아 version id를 목록에 넣지 말 것. 없으면 목록에서 id를 빼거나 버전을 재생성.
3. GET 404 본문: `FORM_TEMPLATE_VERSION_NOT_FOUND` (또는 동등) + `error.code`. 빈 404 금지.
4. `settingsJson` 문서 이미지 URL이 있으면 관리자가 읽을 수 있게. 없어도 schema-only **200**.

### 7.4 검증

- [ ] `GET /api/admin/form-templates?formType=WRITING` 의 `agreement-crime.latestVersionId` 로 GET **200**
- [ ] 회원 등록 성범죄 동의서 모달 오픈 시 해당 GET **404 없음**

---

## 8. 이슈 F — 회원 등록 동의서 작성 후 500 (재확인)

**여전히 P0.** 상세는 기존 문서와 동일합니다. 재현이 2026-09-01에도 남음.

- [member-pre-register-filled-document-500-backend-request-2026-08-26.md](./member-pre-register-filled-document-500-backend-request-2026-08-26.md)
- 동의 current 404 · 성범죄 업로드: [member-consent-terms-current-404-crime-upload-401-backend-request-2026-08-31.md](./member-consent-terms-current-404-crime-upload-401-backend-request-2026-08-31.md)

### 8.1 재현 (동일)

1. 회원 관리 → 일반 회원 또는 강사 신규 등록.
2. 필수 약관 동의.
3. 동의서 작성 필요 항목(초상권·지급조서·교육진행자·행정정보·성범죄) 중 **1건 이상** 작성 후 **동의**로 제출.
4. 등록.

**기대:** `POST /api/admin/users/pre-register/individual` 또는 `.../instructor` **200/201**, 회원 생성, 상세 「동의서 보기」 복원.  
**실제:** **HTTP 500**, 회원 미생성.

미동의만 보내면 통과하는 경우가 있어 persist 경로(`filledDocument` / `evidenceFileObjectId`)가 1순위.

### 8.2 BE 요청 (필수) — 기존 문서 요약

1. `TermsAgreementRequest.filledDocument.schemaJson` = `WritingFormDraft` **객체** (이중 stringify 없음).
2. 지급조서는 `paymentBasicInfo` sidecar.
3. 성범죄는 `evidenceFileObjectId`, `filledDocument` 없음.
4. 검증 실패는 **4xx + code**. persist NPE는 수정.
5. `filledDocument` 를 빼는 FE 우회를 요구하지 말 것.

---

## 9. 하지 말 것

- VIEWER 조회 403을 「메뉴 숨김」으로 FE에 떠넘기지 말 것. 메뉴는 보이고 서버가 막힘.
- 파트너 unmask를 RRN 때문에 **통째로 403**.
- 지급조서 동의서 보기를 문서 단위로 403.
- 강사 승인과 관리자 승인을 같은 권한으로 묶지 말 것.
- 게시 양식 PUT 실패를 **500**.
- 목록에만 있는 version id로 GET **404**.
- 동의서 작성 등록 500을 boolean-only payload로 숨기라고 하지 말 것.

---

## 10. FE 참고 경로

| 파일 | 역할 |
|------|------|
| `apps/cms/src/shared/lib/admin-role-policy.ts` | VIEWER view / PARTNER pii vs piiRrn·piiAccount / 강사 approve |
| `apps/cms/src/pages/admin/settings/admin-permission-settings-ui-data.ts` | 역할별 체크 매트릭스 |
| `apps/cms/src/features/user/api/member-privacy-unmask.ts` | 역할별 unmask POST |
| `apps/cms/src/features/user/api/members-api-client.ts` | instructor approve/reject · unmask 클라이언트 |
| `apps/cms/src/features/template/api/admin-form-templates-service.ts` | version resolve · GET/PUT draft |
| `apps/cms/src/features/template/hooks/use-program-registration-editor.ts` | 등록 화면 draft PUT |
| `apps/cms/src/features/user/shared/ui/member-consent-crime-modal.tsx` | 성범죄 동의서 → `agreement-crime` GET |
| `apps/cms/src/features/user/api/attach-filled-documents.ts` | pre-register `filledDocument` |

---

## 11. 전달 체크리스트

| # | 항목 | 담당 |
|---|------|------|
| 1 | VIEWER에 MEMBER_READ · ADMIN_READ · NOTIFICATION_READ · INSTRUCTOR_REQUEST_READ grant | BE |
| 2 | `admin-approval-requests` **GET** 마스터 전용 해제, mutation은 마스터 유지 | BE |
| 3 | PARTNER unmask 200 + RRN/계좌 필드 마스킹 (문서 일부 차단) | BE |
| 4 | PARTNER `INSTRUCTOR_APPROVE` grant | BE |
| 5 | `PUT form-template-versions/{id}` 500 제거, PUBLISHED면 DRAFT 분기 | BE |
| 6 | `agreement-crime` version 시드, GET latest **200** | BE |
| 7 | pre-register filledDocument **200** (기존 P0) | BE |
| 8 | 스테이징 VIEWER·PARTNER 계정 + 강사 회원 id · 권한신청 id · traceId 샘플 | BE |

수정 일정과 스테이징 검증 계정(VIEWER 1 · PARTNER 1 · 강사 회원 1 · PENDING 강사 권한신청 1)을 회신해 주세요.
