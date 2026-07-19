# 회원 관리 API — 백엔드 전달용 핸드오프 (2026-07-20)

CMS **회원 관리** LNB(회원 목록 · 권한 승인 · 권한 설정) 연동 과정에서 FE가 확인·조치한 내용과, **백엔드 확인·수정이 필요한 항목**을 한곳에 모았습니다.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-20 |
| **대상** | `members` / `admin-accounts` / `instructor-role-requests` / `admin-approval-requests` |
| **FE 앱** | `apps/cms` |
| **관련 명세** | [members-api-integration.md](./members-api-integration.md) · [members-api-backend-gaps.md](./members-api-backend-gaps.md) |
| **E2E 인덱스** | [e2e-backend-fixes-index.md](./e2e-backend-fixes-index.md) |
| **기존 E2E 상세** | [e2e-members-pre-register-handoff.md](./e2e-members-pre-register-handoff.md) |

---

## 1. FE 측에서 이미 전환·연결한 것 (참고)

백엔드 작업 우선순위 판단용입니다. **아래는 FE가 OpenAPI에 맞춰 호출하도록 바꿨거나 배선 완료한 항목**입니다.

| 화면/동작 | FE 호출 (현행) | 비고 |
|-----------|----------------|------|
| 관리자 **신규 등록** | `POST /api/admin/admin-accounts` (`createAdmin`) | 더 이상 관리자 등록에 `pre-register` 사용 안 함. 기본 `roleCode=VIEWER` |
| 관리자 **권한 유형** 드롭다운 | `PATCH /api/admin/admin-accounts/{adminId}/role` | adminId는 `GET /api/admin/admin-accounts?keyword=email` 로 해석 |
| 소속 교사 **재직 현황** | `PATCH /api/admin/users/{memberId}/affiliated-teachers/{teacherMemberId}/employment-status` | 목록 행에 **숫자 teacherMemberId** 가 있어야 저장 가능 |
| 관리자 **코멘트** 저장 | 기존 있으면 `PATCH …/comments/{commentId}`, 없으면 `POST …/comments` | |
| 담당 프로그램 이력 **삭제** | `DELETE …/users/{memberId}/admin-programs/{programId}` | |
| 강사 권한 **알림 재발송** | `POST …/instructor-role-requests/{requestId}/resend-notification` | |

연동 표: [members-api-integration.md](./members-api-integration.md) 「회원 상세 탭·섹션별 연동」·관리자 등록 행.

---

## 2. 백엔드 요청 목록 (우선순위)

### P0 — 등록·목록 계약 (E2E·운영 블로커)

#### M-P0-1. `pre-register`에 **role / memberType** 추가

| | |
|---|---|
| **Path** | `POST /api/admin/users/pre-register` |
| **스키마** | `AdminPreRegisterMemberRequest` |
| **증상** | 학교·강사(및 과거 관리자)를 kind별 모달에서 등록해도 `GET /api/admin/users?role=SCHOOL|INSTRUCTOR|ADMIN` 목록에 안 보임 |
| **FE 임시** | 해당 kind에 없으면 **전체 회원**에서 조회·수정·삭제 폴백 |
| **요청** | 요청 body에 `role` (또는 `memberType`) 추가 · 목록 필터와 동일 enum (`INDIVIDUAL` / `SCHOOL` / `INSTRUCTOR` / `ADMIN`) · 저장 후 kind 목록에 즉시 노출 |
| **상세** | [e2e-members-pre-register-handoff.md](./e2e-members-pre-register-handoff.md) **M2** |

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

기존 갭 문서와 중복되는 항목은 [members-api-backend-gaps.md](./members-api-backend-gaps.md) · [members-api-detail-missing-endpoints-handoff.md](./members-api-detail-missing-endpoints-handoff.md) 를 함께 보시면 됩니다. (일부 문구는 2026-06 기준이라 **현재 Orval에 endpoint가 생긴 뒤 FE만 미배선인 경우**가 있습니다.)

---

## 3. 확인 부탁 체크리스트 (BE)

- [ ] `AdminPreRegisterMemberRequest`에 `role` 추가 및 SCHOOL/INSTRUCTOR 저장·목록 반영  
- [ ] `createAdmin` 응답 ↔ `GET /api/admin/users?role=ADMIN` 동일 계정 식별 가능 여부  
- [ ] ADMIN을 `pre-register`로 보낼 때 기대 응답(4xx 메시지) vs createAdmin only  
- [ ] affiliated-teachers 응답에 숫자 `teacherMemberId`  
- [ ] `changeAdminRole` body `roleCode` enum 확정 (MASTER / PM / PARTNER / VIEWER)  
- [ ] 목록 고급 필터 query 지원 일정  
- [ ] 관리자 승인 알림 재발송 endpoint 제공 여부  
- [ ] (선택) users 목록 ADMIN 행에 `adminAccountId`

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

인프라성 `NETWORK_ERROR` / 30s timeout 은 [e2e-backend-fixes-index.md](./e2e-backend-fixes-index.md) «NETWORK_ERROR» 절 참고 (비즈니스 코드 수정 대상 아님).

---

## 5. 관련 FE 파일 (구현 위치)

| 주제 | 경로 |
|------|------|
| 관리자 생성 | `entities/user/api/user-service.ts` → `createAdminAccountRemote` |
| 권한 유형 | 동 파일 `patchAdminPermissionVariantRemote` · `admin-approval-role.ts` |
| 재직 현황 | `detail/ui/detail-info/user-detail-fullpage-basic-tab-content.tsx` |
| 코멘트 upsert | `user-service.ts` `patchUserBasicInfoRemote` |
| 담당 프로그램 삭제 | `detail/ui/admin-managed-program-history.tsx` |
| 강사 알림 재발송 | `pages/admin/permission-request-list-page.tsx` |
| API 클라이언트 | `features/user/api/members-api-client.ts` |

---

**Last updated:** 2026-07-20  
**작성:** CMS FE (회원 관리 API 연동 · E2E 관측 기준)
