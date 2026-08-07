# Handover: Platform 회원가입 — CMS 등록 학교 선택 · 교사 가입 `DATABASE_ERROR`

**대상:** 백엔드  
**앱:** Platform (사용자 홈페이지)  
**일시:** 2026-08-06  
**환경:** `https://cascade-ducking-refill.ngrok-free.dev`

---

## 공통

| 항목 | 값 |
|------|-----|
| FE | `apps/platform` 회원가입 (`/auth/sign-up`) |
| 에러 envelope | `{ success, message, error: { code, message, field, traceId } }` |
| 학교 검색 API (BE 캐시) | `GET /api/portal/organizations/schools` |
| 교사 가입 API | `POST /api/portal/auth/signup/teacher` |
| 일반 가입 API | `POST /api/portal/auth/signup/general` |

---

## [❌] 1. CMS에 등록된 학교 선택 시 회원 등록 실패

### 증상

CMS **학교(기관) 사전등록**으로 올라간 학교(예: `강서초등학교`, `고양고등학교`)를 Platform 가입에서 NEIS 검색으로 **동일 학교명** 선택 후 가입 시 실패하거나, CMS 기관과 연결되지 않음.

### 재현 경로 (Platform)

1. `/auth/sign-up` → **교사회원** 또는 **일반회원(재학 중)**
2. 소속/학교 검색 → NEIS에서 CMS와 동일 학교명 선택
3. 가입 완료 → API 실패

### FE 동작 (원인 후보)

학교 검색 UI는 **NEIS API만** 사용합니다. CMS 기관 캐시 API는 **선택 시 호출하지 않습니다.**

- 검색 모달: `apps/platform/src/features/auth/sign-up/ui/school-search-modal/school-search-modal.tsx`
- 가입 매핑: `apps/platform/src/features/auth/sign-up/model/mapper/map-signup-request.ts`

NEIS 선택 시 전달되는 값:

- `name` (학교명)
- `neisCode` → `schoolSelection.externalSchoolCode`
- `address`

**전달되지 않는 값:** `organizationId` / `schoolOrganizationId`

→ 요청 body에는 **`schoolSelection`(NEIS)만** 포함되고, CMS PK는 없음.

### BE 기관 캐시 (동일 학교는 이미 존재)

```http
GET /api/portal/organizations/schools?keyword=고양고등학교&page=0&size=5
```

```json
{
  "content": [{
    "organizationId": 6,
    "name": "고양고등학교",
    "organizationCategory": "SCHOOL",
    "address": "경기도 고양시 덕양구 삼송로 171"
  }],
  "totalElements": 1,
  "source": "LOCAL_ORGANIZATION_CACHE",
  "nextAction": "SELECT_CMS_ORGANIZATION"
}
```

| 학교명 (관측) | CMS `organizationId` |
|---------------|----------------------|
| 강서초등학교 | **165101** |
| 고양고등학교 | **6** |

```http
GET /api/portal/organizations/schools?keyword=강서초등학교&page=0&size=5
```

→ `organizationId: 165101` 반환 확인 (2026-08-06).

### 기대 vs 실제 요청

| 케이스 | OpenAPI/BE 기대 | FE 실제 (2026-08-06) |
|--------|-----------------|----------------------|
| CMS 등록 학교 | `teacher.organizationId` 또는 `member.schoolOrganizationId` | **미전송** |
| CMS 미등록 학교 | `member.schoolSelection` (NEIS resolve/create) | NEIS 코드·명·주소만 전송 |

### BE 확인 요청

1. CMS 캐시에 **이미 있는** 학교에 `schoolSelection`만 보낼 때:
   - 기존 `organizationId`로 **매칭**하는지?
   - **신규 insert**를 시도해 unique/FK 위반 → `DATABASE_ERROR`가 나는지?
2. NEIS `externalSchoolCode` ↔ CMS `organizationId` **매칭 규칙** 문서화
3. 일반회원 재학 중: `schoolOrganizationId` 필수 검증 시 NEIS-only 선택 허용 여부

### FE 후속 (참고)

가입 전 `GET /api/portal/organizations/schools?keyword={학교명}`로 `organizationId` 매칭 후 body에 포함하는 작업 예정.

관련 문서: [signup-school-organization-handover.md](./signup-school-organization-handover.md)

---

## [❌] 2. 교사 등록 실패 — `database operation failed`

### 증상

교사회원 가입 완료 시 HTTP **500**, 응답 메시지: `DATABASE_ERROR: database operation failed`

### API

```http
POST /api/portal/auth/signup/teacher
Content-Type: application/json
```

### 관측된 에러 (실제 QA, 2026-08-06)

```json
{
  "success": false,
  "data": null,
  "message": "DATABASE_ERROR: database operation failed",
  "error": {
    "code": "DATABASE_ERROR",
    "message": "database operation failed",
    "field": null,
    "traceId": "edb8ca0e40704af69a625796b4f358c3"
  }
}
```

**서버 로그 조회 요청:** `traceId = edb8ca0e40704af69a625796b4f358c3`

### 재현에 사용된 요청 body (요약)

```json
{
  "teacher": {
    "member": {
      "email": "test3@test.com",
      "password": "password1!",
      "name": "최지원",
      "phone": "01033275124",
      "birthDate": "1994-04-04",
      "gender": "F",
      "under14": false,
      "identityVerified": true,
      "identityVerificationSessionId": 7,
      "schoolName": "고양고등학교",
      "schoolSelection": {
        "provider": "NEIS",
        "externalSchoolCode": "7530576",
        "name": "고양고등학교",
        "address": "경기도 고양시 덕양구 삼송로 171",
        "organizationCategory": "SCHOOL"
      },
      "termsAgreements": [
        { "termsType": "SERVICE_TERMS", "version": "2026-01", "required": true, "agreed": true },
        { "termsType": "PRIVACY_COLLECTION", "version": "2026-01", "required": true, "agreed": true },
        { "termsType": "TEACHER_INFO_COLLECTION", "version": "2026-01", "required": false, "agreed": false },
        { "termsType": "MARKETING", "version": "2026-01", "required": false, "agreed": false },
        { "termsType": "PORTRAIT_RIGHTS", "version": "2026-01", "required": false, "agreed": false }
      ]
    },
    "employmentStatus": "EMPLOYED"
  }
}
```

**주의:** `teacher.organizationId` / `member.schoolOrganizationId` **없음**.  
동일 학교는 CMS 캐시에 **`organizationId: 6`** 으로 이미 존재.

### OpenAPI 계약 vs payload

| 스키마 | required | payload |
|--------|----------|---------|
| `HomepageTeacherSignupRequest` | `teacher` | ✅ |
| `TeacherSignupRequest` | `member` | ✅ (`organizationId` optional) |
| `MemberSignupRequest` | `email`, `password`, `name` | ✅ |
| `PortalSchoolSelectionRequest` | **없음** (전부 optional) | provider, code, name, address |

OpenAPI **required 기준으로는 필수 누락 필드 없음.**  
`schoolSelection`에 없는 optional 필드: `schoolLevel`, `regionSido`, `regionSigungu`, `zipcode`.

### BE 확인 요청 (우선순위)

1. **`traceId: edb8ca0e40704af69a625796b4f358c3`** — 실패 SQL / constraint / stack trace
2. `schoolSelection` → organization **create/upsert** 경로:
   - CMS 캐시(`organizationId=6`)와 **중복 insert**?
   - NOT NULL / FK / unique 위반?
3. **대조 실험:** 동일 payload에 `"organizationId": 6`, `"schoolOrganizationId": 6` 추가 시 성공 여부
4. 실패 시 **400 VALIDATION** vs **500 DATABASE_ERROR** 구분 (운영·FE 대응용)

### 유력 가설 (FE 관점)

CMS 등록 학교인데 `organizationId` 없이 `schoolSelection`만 보내면, 서버가 **canonical organization을 새로 insert**하려다 DB 제약 위반 → `DATABASE_ERROR`.

---

## BE 회신 요청 체크리스트

- [ ] **이슈 1:** CMS 등록 학교 + `schoolSelection` only → 기대 동작 (매칭 vs 신규 생성 vs 4xx)
- [ ] **이슈 2:** `traceId edb8ca0e40704af69a625796b4f358c3` 근본 원인 (SQL/constraint)
- [ ] NEIS `externalSchoolCode` ↔ CMS `organizationId` 매칭 API/규칙
- [ ] 검증용 샘플 `organizationId` + 학교명 1~2건 공유
- [ ] (선택) `DATABASE_ERROR` 대신 business code / field 단위 에러

---

## 관련 코드·문서

| 구분 | 경로 |
|------|------|
| Platform 학교 검색 모달 | `apps/platform/src/features/auth/sign-up/ui/school-search-modal/` |
| 가입 요청 매핑 | `apps/platform/src/features/auth/sign-up/model/mapper/map-signup-request.ts` |
| BE 학교 검색 클라이언트 | `apps/platform/src/features/auth/sign-up/api/client.ts` → `searchHomepageSchools` |
| OpenAPI 스키마 | `apps/cms/openapi/backend.openapi.json` — `PortalSchoolSelectionRequest`, `TeacherSignupRequest` |
| 선행 handoff | [signup-school-organization-handover.md](./signup-school-organization-handover.md) |

**Last updated:** 2026-08-06
