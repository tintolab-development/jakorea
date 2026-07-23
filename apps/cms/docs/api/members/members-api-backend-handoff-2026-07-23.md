# 회원 관리 API — 백엔드 전달용 핸드오프 (2026-07-23)

CMS **회원 관리** LNB(회원 목록 · 권한 승인 · 권한 설정) 연동 과정에서 FE가 확인·조치한 내용과, **백엔드 확인·수정이 필요한 항목**을 한곳에 모았습니다.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-20 (등록·상세 API 분리 · **회원 정보 마스킹 정책**: 2026-07-23) |
| **대상** | `members` / `admin-accounts` / `instructor-role-requests` / `admin-approval-requests` |
| **FE 앱** | `apps/cms` |
| **관련 명세** | [members-api-integration-2026-07-23.md](./members-api-integration-2026-07-23.md) · [members-api-backend-gaps-2026-07-23.md](./members-api-backend-gaps-2026-07-23.md) |
| **E2E 인덱스** | [e2e-backend-fixes-index.md](../e2e-backend-fixes-index.md) |
| **문서 목록** | [members/README.md](./README.md) |
| **기존 E2E 상세** | [e2e-members-pre-register-handoff-2026-07-23.md](./e2e-members-pre-register-handoff-2026-07-23.md) |

---

## 1. FE 측에서 이미 전환·연결한 것 (참고)

백엔드 작업 우선순위 판단용입니다. **아래는 FE가 OpenAPI에 맞춰 호출하도록 바꿨거나 배선 완료한 항목**입니다.

| 화면/동작 | FE 호출 (현행) | 비고 |
|-----------|----------------|------|
| 관리자 **신규 등록** | `POST /api/admin/admin-accounts` (`createAdmin`) | **관리자만 별도 API** (pre-register와 분리). 기본 `roleCode=VIEWER` |
| 개인·학교·강사 **신규 등록** | `POST /api/admin/users/pre-register` (현행 단일) | BE 확정안: **역할별 등록 path 분리** — §2 M-P0-1 |
| 회원 **상세 조회** | `GET /api/admin/users/{memberId}` (+ instructor-profile 등) | BE 확정안: **역할별 상세 path/DTO 분리** — §2 M-P0-1 |
| 관리자 **권한 유형** 드롭다운 | `PATCH /api/admin/admin-accounts/{adminId}/role` | adminId는 `GET /api/admin/admin-accounts?keyword=email` 로 해석 |
| 소속 교사 **재직 현황** | `PATCH /api/admin/users/{memberId}/affiliated-teachers/{teacherMemberId}/employment-status` | 목록 행에 **숫자 teacherMemberId** 가 있어야 저장 가능 |
| 관리자 **코멘트** 저장 | 기존 있으면 `PATCH …/comments/{commentId}`, 없으면 `POST …/comments` | |
| 담당 프로그램 이력 **삭제** | `DELETE …/users/{memberId}/admin-programs/{programId}` | |
| 강사 권한 **알림 재발송** | `POST …/instructor-role-requests/{requestId}/resend-notification` | |

연동 표: [members-api-integration-2026-07-23.md](./members-api-integration-2026-07-23.md) 「회원 상세 탭·섹션별 연동」·관리자 등록 행.

---

## 2. 백엔드 요청 목록 (우선순위)

### P0 — 등록·목록 계약 (E2E·운영 블로커)

#### M-P0-1. 회원 **등록·상세 API 역할별 분리** (canonical — FE·BE 합의)

| | |
|---|---|
| **배경** | CMS는 kind별 모달(개인 / 학교 / 강사 / 관리자)이며, **관리자 등록은 이미** `POST /api/admin/admin-accounts` 로 분리됨 |
| **현행 (임시)** | 개인·학교·강사는 **단일** `POST /api/admin/users/pre-register` + `AdminPreRegisterMemberRequest` · 상세는 **단일** `GET /api/admin/users/{memberId}` |
| **증상** | kind별 등록 후 `GET …/users?role=SCHOOL\|INSTRUCTOR` 목록 미노출 · 화면 필드(주소·NEIS·동의·강사 이력)와 단일 DTO 불일치 · **학교(기관) vs 소속 교사** 상세·코멘트가 동일 member 축으로 섞일 위험 |
| **FE 임시** | kind 목록에 없으면 **전체 회원**에서 CRUD 폴백 · 매퍼 `map-pre-register-request.ts` |
| **BE 요청 (확정 방향)** | **B안:** 역할별 **등록 path + 요청 스키마** · 역할별 **상세 GET path + 응답 DTO** (관리자는 등록·상세 모두 **admin-accounts / ADMIN 전용** 유지) |
| **E2E·상세** | [e2e-members-pre-register-handoff-2026-07-23.md](./e2e-members-pre-register-handoff-2026-07-23.md) **M2** |

**관리자 (이미 분리 — 유지)**

| CMS | 등록 | 상세·목록 |
|-----|------|-----------|
| `kind=admins` | `POST /api/admin/admin-accounts` | `GET /api/admin/users?role=ADMIN` + `admin-accounts` 식별 정합 (M-P0-2) |

**개인 · 학교(기관) · 강사 — BE path 확정 필요 (예시)**

| CMS kind | 화면 | 등록 API (제안) | 상세 API (제안) | 비고 |
|----------|------|-----------------|-----------------|------|
| `all` | 회원 신규 등록 | `POST …/pre-register/individual` (또는 `…/members/individual`) | `GET …/users/{memberId}/individual` | 주소·재학·1365·동의 등 |
| `institutions` | 학교 신규 등록 | `POST …/pre-register/school` | `GET …/users/{memberId}/school` | 기관명·NEIS 코드·**기관 소재지** · `…/affiliated-teachers` |
| `instructors` | 강사 추가 등록 | `POST …/pre-register/instructor` | `GET …/users/{memberId}/instructor` (+ `…/instructor-profile`) | 교사/일반 강사·계좌·이력·동의 |

- 단일 `pre-register`에 `role`만 추가하는 방안(A안)은 **본 핸드오프에서 canonical 아님** (OpenAPI·FE mapper 분리 불가).
- **학교(기관) memberId**와 **소속 교사 memberId**·관리자 코멘트는 **별도 저장·조회** (동일 코멘트 API 키 공유 금지).
- 기존 `POST /api/admin/users/pre-register` · `AdminPreRegisterMemberRequest`는 **deprecated** 또는 individual 전용으로 한정할지 BE 명시.

**수락 기준 (요약)**

1. kind별 등록 후 **해당 kind 목록**에서 1건 검색 가능  
2. OpenAPI에 역할별 등록·상세 스키마 반영 → Orval 재생성  
3. FE가 kind별 mapper·클라이언트로 전환 가능한 path 확정 (관리자는 pre-register 미사용)

#### M-P0-2. 관리자 계정 ↔ 회원 목록 **식별자 정합**

| | |
|---|---|
| **배경** | FE는 관리자 등록을 `createAdmin`으로 전환함 |
| **증상 위험** | `admin-accounts` 의 `id`/`uuid` 와 `GET /api/admin/users?role=ADMIN` 의 `memberId`/`uuid` 가 다르면, 등록 직후 **관리자 회원 목록에서 행을 못 찾음** · 삭제·상세 API 경로가 엇갈림 |
| **요청** | 1) `createAdmin` 응답에 **회원 목록에서 쓰는 `memberId` + `uuid`** 를 포함하거나<br>2) `GET /api/admin/users?role=ADMIN` 이 `admin-accounts` 와 **동일 계정을 동일 uuid/memberId로** 노출<br>3) 문서에 “관리자 생성 canonical API = `admin-accounts`” 명시 (pre-register로 ADMIN 생성 시 기대 4xx) |
| **관련** | 기존 E2E M1(pre-register 500) — FE는 createAdmin으로 우회. 목록·CRUD E2E는 정합 확인 전 **skip** |

#### M-P0-3. 회원·관리자 목록 행에 **adminAccountId** (권장)

| | |
|---|---|
| **화면** | `/users/list?kind=admins` 권한 유형 드롭다운 |
| **현 FE** | 이메일/uuid로 `GET /api/admin/admin-accounts` 를 추가 조회해 `adminId` 확보 후 `changeAdminRole` |
| **요청** | `GET /api/admin/users` (ADMIN) 또는 `listMetrics` 에 `adminAccountId`(number) 를 내려 주면 추가 round-trip 없이 role 변경 가능 |
| **참고** | OpenAPI `changeAdminRole`: 마스터만 · `ADMIN_WRITE` · 감사로그 |

---

### P1 — 목록·상세 DTO / 필터

#### M-P1-1. 소속 교사 목록 행의 **teacherMemberId**

| | |
|---|---|
| **Path** | `GET /api/admin/users/{memberId}/affiliated-teachers` |
| **PATCH** | `…/affiliated-teachers/{teacherMemberId}/employment-status` |
| **요청** | 응답 항목에 **숫자 `teacherMemberId`(또는 `memberId`)** 를 명시. `id`가 UUID만 있으면 FE가 PATCH를 못 함 |
| **employmentStatus** | `ACTIVE` \| `ON_LEAVE` \| `TRANSFERRED` \| `WITHDRAWN` (문서화) |

#### M-P1-2. 회원 목록 **고급 필터** API 파라미터

FE는 remote 모드에서 아래를 **요청에서 제외**하고 경고 배너를 띄웁니다.

| UI 필터 | FE 내부 키 | 요청 |
|---------|------------|------|
| 가입일 | `createdAtFrom` / `createdAtTo` | query 지원 |
| 기관 지역 | `institutionLocation` | query 지원 |
| 강사 유형 | `instructorType` | query 지원 |
| 정산 현황 | `settlementStatus` | query 지원 |
| 관리자 권한 유형 | `adminPermissionVariant` | `VIEWER`/`PARTNER`/`MASTER`(또는 FE variant) 필터 |
| 순수 강사만 | `instructorListPureOnly` | 정책 확정 후 query |

코드: `member-remote-capabilities.ts` (`getUnsupportedMemberListFilterLabels`).

#### M-P1-3. `listMetrics.adminPermissionVariant` / `roleCode` 표기 통일

| | |
|---|---|
| **요청** | 목록·상세에서 권한 유형을 `MASTER` \| `PM` \| `PARTNER` \| `VIEWER` **또는** `manager` \| `partner` \| `viewer` 중 **하나로 문서화** |
| **FE** | 양쪽 모두 수신 가능하도록 매핑함 (`roleCodeToAdminPermissionVariant`) |
| **권장** | API는 `roleCode`(MASTER/PARTNER/VIEWER) SSOT, listMetrics는 동일 값 또는 생략하고 roleCode만 |

#### M-P1-4. 관리자 권한 **알림 재발송** API

| | |
|---|---|
| **강사** | `POST …/instructor-role-requests/{requestId}/resend-notification` — FE 연결됨 |
| **관리자** | Orval members subset에 **동등 API 없음** |
| **요청** | `POST /api/admin/admin-approval-requests/{adminId}/resend-notification` (또는 동일 의미 path) 추가 · OpenAPI 반영 |

#### M-P1-5. 회원 정보 **마스킹 정책** (목록·상세 API · OpenAPI 재확인)

| | |
|---|---|
| **화면** | 회원 목록 · 회원 상세(`SCR_MEMBER`) · 소속 교사 연락처 등 |
| **FE 기본** | 마스킹된 값 표시 · 「개인정보 상세보기」 시 `POST /api/admin/users/{memberId}/privacy/unmask` 로 원문 조회 (`logs` 모듈·감사로그) |
| **BE 요청** | 아래 정책을 **목록·상세 GET 기본 응답**에 적용할지, 또는 `masked*` / `displayLabel` 필드로 내려줄지 **OpenAPI에 명시**. unmask 시에만 원문. **역할별 상세 DTO(M-P0-1)** 설계 시 필드별 정책 동일 적용 |
| **FE 참고 구현** | `src/shared/constants/download-policy.ts` (`MASKING_POLICY`) · 상세 주소 블러 `user-basic-info/display.ts` |

**참고 — 회원 정보 마스킹 (CMS 표시·API 정합 SSOT)**

| 항목 | 마스킹 | 표시 예시 · 비고 |
|------|--------|------------------|
| **회원명** | **하지 않음** | 원문 |
| **성별** | **하지 않음** | 원문 |
| **전화번호** | 가운데 **4자리** `*` | `010-****-5678` (하이픈 형식 기준) |
| **이메일** | `@` 앞 로컬파트 — **앞 3글자** 노출 + `***` | `0915***@naver.com` (`@` 앞 세 자리를 `*` 처리 — 기획 문구) |
| **주소 (자택)** | **동(읍·면)까지 노출**, 그 **이후 상세주소는 블러** (별표 마스킹 아님) | `강서구 화곡동` + 상세 구간 CSS blur · FE는 공백 단위 앞 2토큰 노출 후 tail blur |
| **주소 (기관)** | **해당 없음** (마스킹·블러 미적용) | 학교·기관 소재지 등 **기관 주소** |
| **계좌** | **은행명 제외** — 계좌번호 **숫자 전부** `*` · 예금주는 **성(씨)만** 노출 | `농협 --**` / `박**` (은행명 + 마스킹 번호 + 마스킹 예금주) |
| **학력 — 학교명** | 학교명 마스킹 | `**대학교` (학교명 본문 마스킹·유형 접미만 노출 등 화면 규칙에 맞게) |
| **1365 ID** | **뒤 3자리** `*` | 예: `0915123***` |

> **FE 참고:** `MASKING_POLICY.email`은 현재 로컬 **앞 3자 + `***@domain`** 입니다. 기획 예시(`0915***@…`)와 BE OpenAPI 예시는 **한 가지 규칙으로 확정**해 주세요.

**BE 확인 체크 (마스킹)**

1. 목록 `GET /api/admin/users` — email·phone 등 **기본 응답**이 위 규칙과 일치하는지 (또는 FE가 unmask 전까지 마스킹 문자열을 받는지)  
2. 상세·`instructor-profile` 계좌·학력·`external-identifiers`(1365) — 필드별 마스킹/unmask 연동  
3. **기관 주소** vs **회원 자택 주소** 필드 분리 — 자택만 블러 정책  
4. M-P0-1 **유형별 상세 API** 확정 시 동일 정책을 DTO·문서에 반복 명시  

---

### P2 — 상세 액션 · 교차 도메인 (OpenAPI 일부 있음 / UI·모듈 미완)

| ID | 항목 | Path / 비고 | FE 상태 |
|----|------|-------------|---------|
| M-P2-1 | 신청 이력 삭제 | `DELETE …/users/{memberId}/applications/{applicationId}` | Orval 있음 · UI 미배선 |
| M-P2-2 | 참여 이력 삭제 | `DELETE …/program-history/{id}` | Orval 있음 · UI 미배선 |
| M-P2-3 | program-roles 조회/저장 | `GET/PUT …/program-roles` | Orval 있음 · 회원 상세 UI 미배선 |
| M-P2-4 | enrollment-summary / lecture-reports / assignment-submissions | members subset | enrichment 모달 mock |
| M-P2-5 | 강사 권한 박탈 | instructors revoke (subset 밖) | UI «준비 중» |
| M-P2-6 | 수료증 일괄 발급 | certificates 모듈 | «준비 중» |
| M-P2-7 | 동의서 문서 열기 | public terms | alert |
| M-P2-8 | 권한 승인 상태 **PENDING 초기화** | 전용 API 없음 | mock `updateMockUserById` |
| M-P2-9 | instructor-profile 계좌·자격증 배열 | DTO 확장 | 부분 mock/빈 값 |
| M-P2-10 | 권한 설정 ProgramRole 매트릭스 | domain×permission만 제공 | ProgramRole UI는 BE 설계 필요 |

기존 갭 문서와 중복되는 항목은 [members-api-backend-gaps-2026-07-23.md](./members-api-backend-gaps-2026-07-23.md) · [members-api-detail-missing-endpoints-handoff-2026-06-26.md](./members-api-detail-missing-endpoints-handoff-2026-06-26.md) 를 함께 보시면 됩니다. (일부 문구는 2026-06 기준이라 **현재 Orval에 endpoint가 생긴 뒤 FE만 미배선인 경우**가 있습니다.)

---

## 3. 확인 부탁 체크리스트 (BE)

- [ ] **개인 / 학교 / 강사** 등록·상세 **path·DTO 분리** 확정 및 OpenAPI 반영 (관리자는 `admin-accounts` 유지)  
- [ ] 단일 `pre-register` · `AdminPreRegisterMemberRequest` 처리 (deprecated vs individual-only)  
- [ ] 학교(기관) vs 소속 교사 **memberId·코멘트** 분리 정책  
- [ ] `createAdmin` 응답 ↔ `GET /api/admin/users?role=ADMIN` 동일 계정 식별 가능 여부  
- [ ] `pre-register`로 ADMIN 생성 시 **4xx** (createAdmin only)  
- [ ] affiliated-teachers 응답에 숫자 `teacherMemberId`  
- [ ] `changeAdminRole` body `roleCode` enum 확정 (MASTER / PM / PARTNER / VIEWER)  
- [ ] 목록 고급 필터 query 지원 일정  
- [ ] 관리자 승인 알림 재발송 endpoint 제공 여부  
- [ ] (선택) users 목록 ADMIN 행에 `adminAccountId`  
- [ ] **회원 정보 마스킹** — §M-P1-5 표 · 목록/상세/unmask · 기관 주소 vs 자택 · 1365·계좌·학력  
- [ ] 역할별 상세 DTO(M-P0-1)에 마스킹 필드 정책 반영

---

## 4. FE 재현 · 로그

```bash
# 회원 목록 CRUD (관리자 full CRUD는 skip · 권한 유형 변경 스펙 포함)
pnpm --filter cms test:e2e:members

# 권한 유형만
pnpm --filter cms exec playwright test \
  tests/e2e/flows/members/admin-permission-type.spec.ts --project=chromium
```

에러 확인:

1. 터미널 `========== E2E 백엔드 에러 로그 ==========`  
2. `apps/cms/test-results/e2e-error-log-latest.json`  
3. 브라우저 `http://localhost:3000/e2e-error-log` (MD 다운로드 가능)

인프라성 `NETWORK_ERROR` / 30s timeout 은 [e2e-backend-fixes-index.md](../e2e-backend-fixes-index.md) «NETWORK_ERROR» 절 참고 (비즈니스 코드 수정 대상 아님).

---

## 5. 관련 FE 파일 (구현 위치)

| 주제 | 경로 |
|------|------|
| 관리자 생성 | `entities/user/api/user-service.ts` → `createAdminAccountRemote` |
| 개인·학교·강사 등록 (임시 단일 pre-register) | `map-pre-register-request.ts` · `preRegisterMemberRemote` · `member-register-modal` / `school-register-modal` / `instructor-register-modal` |
| 권한 유형 | 동 파일 `patchAdminPermissionVariantRemote` · `admin-approval-role.ts` |
| 재직 현황 | `detail/ui/detail-info/user-detail-fullpage-basic-tab-content.tsx` |
| 코멘트 upsert | `user-service.ts` `patchUserBasicInfoRemote` |
| 담당 프로그램 삭제 | `detail/ui/admin-managed-program-history.tsx` |
| 강사 알림 재발송 | `pages/admin/permission-request-list-page.tsx` |
| API 클라이언트 | `features/user/api/members-api-client.ts` |
| 마스킹 표시 | `shared/constants/download-policy.ts` · `detail/ui/user-basic-info/display.ts` |
| 개인정보 unmask | `features/logs/api/privacy-unmask-fetcher.ts` |

---

**Last updated:** 2026-07-23  
**작성:** CMS FE (회원 관리 API 연동 · E2E 관측 기준)
