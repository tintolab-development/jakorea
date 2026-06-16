# 회원 관리 API 연동 명세

LNB 「회원 관리」 3화면(회원 목록·권한 승인·권한 설정)과 Swagger API 매핑입니다.

- 공통 가이드: [backend-handoff.md](./backend-handoff.md) · [api-routes-and-client.md](./api-routes-and-client.md)
- 백엔드 갭·스펙 불일치: [members-api-backend-gaps.md](./members-api-backend-gaps.md)
- OpenAPI 기준: `openapi/backend.openapi.json` (v9) · subset: `openapi/members.openapi.json`

---

## 연동 상태 요약 (2026-06-12)

| 화면 | 라우트 | remote 조건 | 데이터 소스 |
|------|--------|-------------|-------------|
| 회원 목록 | `/users/list?kind=*` | `members` | `GET /api/users` |
| 회원 상세 (기본정보) | 풀페이지 모달 | `members` | `GET /api/users/{memberId}` (+ instructor-profile, external-identifiers) |
| 회원 상세 (동의) | 기본정보 탭 | `members` | `GET .../consent-records` |
| 회원 상세 (이력·신청) | 프로그램 이력 탭 | `members` | **mock 유지** + 안내 배너 |
| 회원 상세 (강사 정산) | 정산 현황 탭 | `members` + (`paymentOrders` 또는 `accountPayments`) | `GET /api/settlements?instructorMemberId=` |
| 회원 상세 (강사 정산 mock) | 동일 | `members` only | mock + 「정산 API 미활성」 배너 |
| 회원 등록·삭제 | 목록 액션·모달 | `members` | `pre-register` / `delete` |
| 권한 승인 — 강사 | `/admin/permission-requests` | `instructorRoleRequests` | `instructor-role-requests` |
| 권한 승인 — 관리자 | 동일 | — | **mock 유지** + 안내 배너 |
| 권한 설정 | `/admin/settings/permissions` | `adminPermissions` | `admin-roles` + PUT |
| 권한 설정 (mock UI) | 동일 | `adminPermissions` **비활성** | 로컬 state |

코드만 배포돼 있고 `.env`에 모듈 키가 없으면 **전부 mock**으로 동작합니다. 반드시 `VITE_REAL_API_MODULES`에 키를 포함하고 dev 서버를 재시작하세요.

---

## 로컬 활성화

### 1. 환경 변수 (`.env` / `.env.local`)

```env
VITE_API_SERVER=https://your-backend.example
VITE_REAL_API_MODULES=adminAuth,dashboard,logs,detailedPrograms,textbooks,sponsors,notices,faqs,inquiries,paymentOrders,accountPayments,settlementConfigs,members,instructorRoleRequests,adminPermissions
```

회원 관리만 켜려면 기존 목록 끝에 아래 3개를 추가합니다.

```env
members,instructorRoleRequests,adminPermissions
```

### 2. dev 서버 재시작

`.env` 변경은 Vite 재시작 후 반영됩니다.

```bash
cd apps/cms && pnpm dev
```

### 3. 인증

MFA 완료 후 유효 JWT가 있어야 합니다 (`hasRemoteAdminJwt()`). 권한 부족 시 HTTP 403 — `getMemberApiErrorMessage` 한글 메시지 표시 (axios 자동 refresh 없음).

---

## 모듈 키

등록 위치: [`src/shared/config/real-api-modules.ts`](../../src/shared/config/real-api-modules.ts)

| 키 | 담당 화면 | 분기 함수 |
|----|-----------|-----------|
| `members` | 회원 목록·상세·사전 등록·탈퇴 | `isMembersRemoteEnabled()` |
| `instructorRoleRequests` | 권한 승인 — 강사 탭 | `isInstructorRoleRequestsRemoteEnabled()` |
| `adminPermissions` | 권한 설정 (API 매트릭스 UI) | `isAdminPermissionsRemoteEnabled()` |
| `paymentOrders` 또는 `accountPayments` | 회원 상세 강사 정산 탭 | `isMemberInstructorSettlementsRemoteEnabled()` (`members`와 함께 필요) |

개인정보 마스킹 해제(`POST /api/users/{memberId}/privacy/unmask`)는 **`logs` 모듈** fetcher를 재사용합니다. `logs`가 `VITE_REAL_API_MODULES`에 포함돼 있어야 실 API unmask가 동작합니다.

---

## Orval 코드 생성

```bash
cd apps/cms
pnpm filter:openapi:members          # openapi/members.openapi.json 생성
pnpm exec orval --config orval.config.ts --project members
# 또는 전체
pnpm generate:api
```

subset path prefix (`scripts/filter-openapi-members.mjs`):

- `/api/users`
- `/api/instructor-role-requests`
- `/api/admin/admin-permissions`
- `/api/admin/admin-roles`
- `/api/admin/roles`
- `/api/admin/admin-permission-change-logs`

---

## 코드 위치

| 역할 | 경로 |
|------|------|
| Orval 생성 | `src/shared/api/generated/members/` |
| OpenAPI subset | `openapi/members.openapi.json` |
| remote 분기·필터 갭 | `features/user/api/member-remote-capabilities.ts` |
| query keys | `features/user/api/member-query-keys.ts` |
| 캐시 clear | `features/user/api/clear-member-query-cache.ts` |
| uuid↔memberId 레지스트리 | `features/user/api/member-id-registry.ts` |
| API client | `features/user/api/members-api-client.ts` |
| 에러 메시지 | `features/user/api/get-member-api-error.ts` |
| 목록 mapper | `features/user/api/map-member-list-item.ts` |
| 상세 mapper | `features/user/api/map-member-detail-to-user.ts` |
| 동의 mapper | `features/user/api/map-member-consent-records.ts` |
| 1365 mapper | `features/user/api/map-external-identifiers.ts` |
| 강사 정산 (회원 상세) | `features/user/api/instructor-member-settlements-remote.ts` |
| 정산 list mapper | `features/user/api/map-settlement-to-instructor-member-row.ts` |
| 사전등록 mapper | `features/user/api/map-pre-register-request.ts` |
| 권한 신청 mapper | `features/user/api/map-instructor-role-request-row.ts` |
| Facade (mock 분기) | `entities/user/api/user-service.ts` |
| 목록 hook | `features/user/shared/hooks/use-infinite-user-list.ts` |
| 상세 hook | `features/user/api/hooks/use-member-detail-query.ts` |
| 권한 신청 query | `features/user/api/hooks/use-instructor-role-requests-query.ts` |
| 권한 신청 mutation | `features/user/api/hooks/use-instructor-role-request-mutations.ts` |
| 권한 설정 query/mutation | `features/user/api/hooks/use-admin-role-permissions-query.ts` |
| 권한 설정 UI (remote) | `pages/admin/settings/admin-permissions-remote-panel.tsx` |
| 개인정보 unmask | `features/logs/api/privacy-unmask-fetcher.ts` |

### 데이터 흐름

```
페이지 → user-service.ts (isMembersRemoteEnabled 분기)
       → members-api-client.ts → Orval generated
       → mapper → UI User 타입
```

목록은 `useInfiniteUserList` → `getUsersPage` → `GET /api/users`.  
상세는 행 클릭·URL 복원 시 `fetchUserById` → `GET /api/users/{memberId}` (+ INSTRUCTOR 시 instructor-profile, parallel external-identifiers).

---

## TanStack Query 캐시

- Key prefix: `['cms', 'members', …]`
- 목록: `memberQueryKeys.list(serializeMemberListFilters(filters))`
- 권한 신청: `memberQueryKeys.instructorRoleRequests.list(...)`
- 권한 설정: `memberQueryKeys.adminPermissions.roleMatrix(roleCode)`
- `logout` / `completeAdminAuth` → `clearMemberQueryCache()` (uuid↔memberId 레지스트리 초기화 포함)
- 등록·삭제·승인/반려 성공 후 관련 `invalidateQueries`

---

## 회원 목록 (`/users/list?kind=*`)

| Method | Path | UI |
|--------|------|-----|
| GET | `/api/users` | kind별 무한 스크롤 (15건/페이지) |

### kind → API `role`

| URL `kind` | API `role` |
|------------|------------|
| `all` | (생략) |
| `individual` | `INDIVIDUAL` |
| `institutions` | `SCHOOL` |
| `instructors` | `INSTRUCTOR` |
| `admins` | `ADMIN` |

### 쿼리 매핑

| UI 필터 | API param | 비고 |
|---------|-----------|------|
| `search` | `keyword` | |
| kind 탭 / `role` | `role` | 위 표 참고 |
| `isActive` | `memberStatus` | `ACTIVE` / `INACTIVE` (임시 매핑) |
| `page` (0-based) | `page` | `size=15` |

### remote에서 무시되는 필터

아래 필터는 API에 대응 파라미터가 없어 **요청에서 제외**되고, 적용 중이면 상단 **경고 배너**가 표시됩니다.

- 가입일 (`createdAtFrom` / `createdAtTo`)
- 기관 지역 (`institutionLocation`)
- 강사 유형 (`instructorType`)
- 정산 현황 (`settlementStatus`)
- 관리자 권한 variant (`adminPermissionVariant`)
- 순수 강사만 (`instructorListPureOnly`)

상세: [members-api-backend-gaps.md](./members-api-backend-gaps.md) #5.

### 식별자

| UI | API | 비고 |
|----|-----|------|
| `User.id` | `uuid` | 없으면 `member-{memberId}` |
| `User.memberId` | `memberId` | 상세·삭제·unmask용 숫자 ID |
| 목록 로드 시 | `registerMemberIdMapping(uuid, memberId)` | 레지스트리에 보관 |

`GET /api/users` 응답 `PageResponse.items`는 OpenAPI상 타입 미정의 → `MemberListItemResponse` 수동 타입으로 mapper 처리.

---

## 회원 상세 탭·섹션별 연동

| 탭/섹션 | remote 조건 | API / 데이터 |
|---------|-------------|--------------|
| 기본정보 핵심 | `members` | `GET /api/users/{memberId}` |
| 강사 프로필·이력서 일부 | `members` + INSTRUCTOR | `GET .../instructor-profile` (계좌·자격증 등 일부 mock) |
| 1365 ID | `members` | `GET .../external-identifiers` + `external1365Id` |
| 정보 제공 동의 | `members` | `GET .../consent-records` |
| 관리자 코멘트 | — | mock + 배너 |
| 소속 교사 | — | mock + 배너 |
| 프로그램 이력·신청 | — | `mockUserHistories` / `applicationService` + 배너 |
| 관리자 담당 프로그램 이력 | — | `mockPrograms` + 배너 |
| 강사 정산 현황 | `members` + settlement 모듈 | `GET /api/settlements?instructorMemberId=` |
| 강사 정산 (settlement 미활성) | `members` only | mock + 배너 |

---

## 회원 상세 (`user-detail-fullpage-modal`)

| Method | Path | UI |
|--------|------|-----|
| GET | `/api/users/{memberId}` | 기본정보 탭 (상세 열 때 재조회) |
| GET | `/api/users/{memberId}/instructor-profile` | 강사 프로필 (`INSTRUCTOR`) |
| GET | `/api/users/{memberId}/external-identifiers` | 1365 외부 식별자 |
| GET | `/api/users/{memberId}/consent-records` | 정보 제공 동의 섹션 |
| GET | `/api/settlements?instructorMemberId=` | 강사 정산 탭 (`paymentOrders` 또는 `accountPayments` 모듈) |
| POST | `/api/users/{memberId}/privacy/unmask` | 개인정보 해제 (`memberId` 숫자 전달) |
| POST | `/api/users/{memberId}/delete` | 탈퇴/삭제 |

**저장**: `PATCH /api/users/{memberId}` 미제공 → remote 시 「정보 수정」 버튼 숨김 (`isMemberBasicInfoPatchRemoteEnabled() === false`).

**mock 유지 + 안내 배너** (`members` remote 시):

- 프로그램 이력 (`mockUserHistories`)
- 신청·등록 stub (`applicationService`)
- 관리자 담당 프로그램 이력 (`mockPrograms`)
- 관리자 코멘트
- 기관 소속 교사
- 강사 이력서 일부(계좌·학력 상세·자격증·수상)
- 강사 정산 (`paymentOrders`/`accountPayments` 미활성 시)

---

## 회원 등록·삭제

| Method | Path | UI |
|--------|------|-----|
| POST | `/api/users/pre-register` | 개인·기관·강사·관리자 등록 모달 |
| POST | `/api/users/{memberId}/delete` | 목록/상세 삭제 |

### 사전 등록 필드 매핑

| UI (`CreateUserRequest`) | API (`AdminPreRegisterMemberRequest`) |
|--------------------------|---------------------------------------|
| `name` | `name` |
| `email` | `email` |
| `phone` | `phone` |
| `gender` | `gender` |
| `birthDate` | `birthDate` |
| `schoolInfo.schoolName` | `organizationText` + `name` |
| 강사 소개 | `oneLineIntro` (일부) |
| `password` | **없음** (사전 등록 후 본인 가입 플로우) |

삭제 body: `{ reason: string }` — 최소 5자. 미전달 시 기본값 `CMS 관리자 회원 삭제`.

성공 후 `invalidateQueries` (`memberQueryKeys.all`).

---

## 권한 승인 (`/admin/permission-requests`)

### 강사 탭 (`instructorRoleRequests` 모듈)

| Method | Path | UI |
|--------|------|-----|
| GET | `/api/instructor-role-requests` | 신청 목록 |
| POST | `/api/instructor-role-requests/{requestId}/approve` | 승인 (단건·일괄 순차) |
| POST | `/api/instructor-role-requests/{requestId}/reject` | 반려 |

목록 행: `requestId`, `memberId` 보관. 승인/반려는 `requestId` 기준.  
회원 상세 진입: `userId`가 `member-{id}` 형태일 수 있음 → `resolveMemberIdForApi`로 상세 조회.

승인 body (`InstructorRoleReviewRequest`): `reason`(필수), `feeGrade`, `activityType` 등.

### 관리자 탭

API 없음 — `mockMemberPermissionApplicationsAdmin` + 상단 안내 배너.  
갭: [members-api-backend-gaps.md](./members-api-backend-gaps.md) #3.

---

## 권한 설정 (`/admin/settings/permissions`)

### remote (`adminPermissions` 활성)

| Method | Path | UI |
|--------|------|-----|
| GET | `/api/admin/admin-permissions` | permission 카탈로그 |
| GET | `/api/admin/admin-roles` | role 목록 |
| GET | `/api/admin/admin-roles/{roleCode}/permissions` | 역할별 매트릭스 |
| PUT | `/api/admin/admin-roles/{roleCode}/permissions` | 저장 (`permissionCodes[]`) |

UI: `AdminPermissionsRemotePanel` — `domain`별 체크박스 + 저장 버튼.

### mock (`adminPermissions` 비활성)

기존 `permission-customization-page.tsx` 로컬 state (카테고리 체크박스). 저장/API 없음.

### UI role 탭 → API roleCode (임시, 백엔드 확인 필요)

| UI 탭 | roleCode |
|-------|----------|
| master | `MASTER` |
| pm | `PM` |
| partner | `PARTNER` |
| viewer | `VIEWER` |

---

## 권한 코드 (Swagger 기준)

| API | 권한 (문서 기준) |
|-----|------------------|
| `GET /api/users` | `MEMBER_READ` |
| `GET /api/users/{memberId}` | `MEMBER_READ` |
| `POST /api/users/pre-register` | `MEMBER_CREATE` |
| `POST /api/users/{memberId}/delete` | `MEMBER_WRITE` (추정) |
| `GET /api/instructor-role-requests` | 강사 권한 워크플로 read |
| `POST .../approve`, `.../reject` | write |
| `GET/PUT /api/admin/admin-roles/{roleCode}/permissions` | 마스터 관리자 |

실제 403 메시지는 `getMemberApiErrorMessage` → 「회원 관리 조회 권한이 없습니다…」

---

## 수동 검증 체크리스트

- [ ] `.env`에 `members,instructorRoleRequests,adminPermissions` 포함 + dev 재시작
- [ ] MFA 로그인 후 kind 5종 목록 로드
- [ ] 미지원 필터 적용 시 경고 배너
- [ ] 상세 열기 시 API 재조회 (기본정보·동의·1365)
- [ ] 강사 정산 탭 — settlement 모듈 ON/OFF 시 API/mock 분기
- [ ] 이력·신청·코멘트·소속교사 mock 안내 배너
- [ ] 개인정보 마스킹 해제 (`memberId` + `logs` 모듈)
- [ ] remote 시 「정보 수정」 버튼 미노출
- [ ] 사전 등록 4종 모달 → 목록 갱신
- [ ] 회원 삭제
- [ ] 강사 권한 승인/반려 (단건·일괄)
- [ ] 관리자 탭 mock 안내 배너
- [ ] 권한 설정 remote 저장 (role 탭별)
- [ ] 로그아웃 후 회원 캐시·레지스트리 미노출

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-12 | Phase 0~5 구현 — mock 분기·mapper·hooks·문서 초안 |
| 2026-06-12 | `.env` 모듈 키 활성화, 상세 재조회·memberId unmask 반영, 연동 상태 표 추가 |
| 2026-06-12 | 상세 하위 탭 Phase A~C — consent/external-id/instructor-profile/정산 탭 연동, mock 배너·갭 문서 보강 |
