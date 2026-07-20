# 회원 관리 API — 백엔드 핸드오프 (갭·스펙 불일치)

프론트 CMS 회원 관리 LNB 3화면 API 연동 후 확인된 **미존재 API·구조 불일치** 목록입니다.  
OpenAPI 기준: `openapi/backend.openapi.json` (v9)

연동 명세: [members-api-integration.md](./members-api-integration.md)  
회원 상세 미존재 endpoint 전용: [members-api-detail-missing-endpoints-handoff.md](./members-api-detail-missing-endpoints-handoff.md)

---

## 우선순위 요약

| 우선순위 | 건수 | 대표 항목 |
|----------|------|-----------|
| P0 | 4 | 목록 item DTO, 기본정보 PATCH, 관리자 권한 신청 API, enum 문서화 |
| P1 | 8 | 목록 필터, 권한 UI 모델, 상세 확장 필드, instructor-profile 스키마, consentType enum, external provider |
| P2 | 4 | 프로그램 역할 할당, 코멘트/소속 교사, 정산 list DTO, role permission endpoint 정리 |

---

## P0 — 회원 목록·상세·권한 승인

### 1. `GET /api/users` 목록 item DTO

| | |
|---|---|
| **화면** | `/users/list?kind=*` |
| **UI 요구** | 회원명·이메일·역할·가입일·활성 상태·기관명·강사 지표 등 목록 행 |
| **현재 API** | `PageResponse` — `items: {}` (타입 미정의) |
| **갭 유형** | 스펙 누락 |
| **프론트 임시 대응** | `MemberListItemResponse` 수동 타입 + 런타임 mapper (`map-member-list-item.ts`) |
| **제안** | `MemberListItemResponse` 스키마 정의 후 `PageResponse<MemberListItemResponse>` |

**제안 필드 (최소)**

| UI | 제안 API 필드 |
|----|----------------|
| `User.id` | `uuid` |
| `memberId` | `memberId` |
| `name` | `name` 또는 `organizationName` |
| `email` | `email` (마스킹 정책 명시) |
| `role` | `roles[]` 또는 단일 `primaryRole` |
| `isActive` | `memberStatus` enum |
| `createdAt` | `createdAt` |
| `schoolInfo.schoolName` | `organizationName` / `organizationText` |
| `participationHistory` | `participationCount` (선택) |

---

### 2. `PATCH /api/admin/users/{memberId}` 회원 기본정보 수정

| | |
|---|---|
| **화면** | 회원 상세 풀페이지 — 기본정보 탭 「정보 수정」 |
| **UI 요구** | 이름·연락처·이메일·기관 정보·강사 계좌·관리자 권한 유형 등 `patchUserBasicInfo` |
| **현재 API** | `PATCH /api/admin/users/{memberId}` (`AdminMemberBasicInfoUpdateRequest`) |
| **프론트** | `isMemberBasicInfoPatchRemoteEnabled()` — `members` remote 시 활성. 관리자 코멘트는 `POST .../comments` 분리 |
| **잔여 갭** | 코멘트 수정/삭제 API 없음(등록만). 강사 이력서 상세 배열 미제공 |

---

### 3. 관리자 권한 신청 목록·승인·반려 API

| | |
|---|---|
| **화면** | `/admin/permission-requests` — **관리자** 탭 |
| **UI 요구** | `MemberPermissionApplicationRow` — 개인→관리자 승인, 관리자 권한 variant 승인 |
| **현재 API** | **없음** (`instructor-role-requests`만 존재) |
| **갭 유형** | API 없음 |
| **프론트 임시 대응** | mock 목록 + 「API 미제공」 안내 |
| **제안** | `GET /api/admin-permission-requests` + approve/reject 또는 통합 워크플로 API |

---

### 4. `role` / `memberStatus` / `instructorStatus` enum

| | |
|---|---|
| **화면** | 목록 필터·배지·kind 탭 |
| **UI 값** | `INDIVIDUAL`, `SCHOOL`, `INSTRUCTOR`, `ADMIN` |
| **현재 API** | query param·응답 enum **문서화 없음** |
| **갭 유형** | 문서화 |
| **프론트 임시 대응** | UI `SCHOOL` → API `SCHOOL` 가정, status는 `ACTIVE`/`INACTIVE` 추론 |
| **제안** | OpenAPI enum + UI↔API 매핑표 (예: `INSTITUTION` vs `SCHOOL`) |

---

## P1 — 필터·상세·권한 설정

### 5. 목록 고급 필터 쿼리 파라미터

| | |
|---|---|
| **화면** | `/users/list` kind별 필터 |
| **UI 요구** | 가입일 범위, 기관 지역, 강사 유형, 정산 현황, 관리자 권한 variant, 순수 강사만 |
| **현재 API** | `keyword`, `role`, `memberStatus`, `instructorStatus`, `organizationId` 만 존재 |
| **갭 유형** | 쿼리 파라미터 없음 |
| **프론트 임시 대응** | remote 시 해당 필터 무시 + 경고 배너 |
| **제안** | `createdAtFrom/To`, `region`, `instructorType`, `settlementStatus`, `adminRoleCode` 등 |

---

### 6. 권한 설정 UI vs API 모델 불일치

| | |
|---|---|
| **화면** | `/admin/settings/permissions` |
| **UI (mock)** | `AdminLevel` + `ProgramRole` × 카테고리 체크박스 (`crud_program_open` 등 UI id) |
| **API** | `admin roleCode` × `permissionCodes` (`AdminPermissionResponse.code`) |
| **갭 유형** | 구조 불일치 |
| **프론트 임시 대응** | `adminPermissions` remote 시 API domain 그룹 UI + PUT 저장; ProgramRole mock 미사용 |
| **제안** | UI id ↔ `permission.code` 매핑표 또는 API에 program-role 매트릭스 endpoint |

**임시 roleCode 매핑 (백엔드 확인 필요)**

| UI 탭 | 프론트 가정 roleCode |
|-------|----------------------|
| master | `MASTER` |
| pm | `PM` |
| partner | `PARTNER` |
| viewer | `VIEWER` |

---

### 7. `MemberDetailResponse` 확장 필드 부재

| | |
|---|---|
| **화면** | 회원 상세 — 역할별 섹션 |
| **UI 요구** | `schoolInfo`, `instructorInfo`(계좌), `adminLevel`, `programRoles`, `adminComment` |
| **현재 API** | `MemberDetailResponse` 기본 필드 + `roles[]` only |
| **갭 유형** | 구조 불일치 |
| **프론트 임시 대응** | 기본 필드만 매핑, 나머지 탭/섹션 mock |
| **제안** | 역할별 nested DTO 또는 sub-resource GET 통합 |

---

### 8. `GET /api/users/{memberId}/instructor-profile` 응답 스키마

| | |
|---|---|
| **화면** | 강사 상세 기본정보 |
| **UI 요구** | 계좌·이력서·활동 유형 등 |
| **현재 API** | `InstructorDetailResponse` 존재하나 OpenAPI path 응답 연결 약함 |
| **갭 유형** | 스펙 누락/문서화 |
| **프론트 임시 대응** | `businessIncomeYn`, `careerText`, `activityTypes` 등 일부 매핑; 계좌·자격증 mock |
| **제안** | Swagger 예시 + 계좌 필드 정책(마스킹) 명시 |

---

### 9. CMS 회원별 프로그램 이력·신청·관리자 이력 API

| | |
|---|---|
| **화면** | 회원 상세 — 프로그램 이력 / 신청 / 관리자 담당 프로그램 |
| **현재 API** | `GET .../applications`, `.../program-history`, `.../admin-programs` (Admin) |
| **프론트** | remote 시 API 조회 연동 완료 |
| **잔여 갭** | 신청 **진행상태 변경** mutation 없음. `lectureAttendance`, `hasLectureReportSubmission` 등 UI 전용 필드 없음. 관리자 프로그램 lifecycle·필터 필드 제한적 |

---

### 13. `consentType` enum 문서화

| | |
|---|---|
| **화면** | 회원 상세 — 정보 제공 동의 |
| **API** | `GET /api/users/{memberId}/consent-records` — `consentType` string (enum 미정의) |
| **UI 라벨** | 개인정보 수집, 마케팅, 초상권, 지급조서, 성범죄 경력조회, 행정정보 공동이용, 교육진행자 서약 |
| **갭 유형** | 문서화 |
| **프론트 임시 대응** | `map-member-consent-records.ts` 임시 `consentType`→라벨 매핑 |
| **제안** | OpenAPI enum + UI 라벨 매핑표 |

---

### 14. `external-identifiers` provider enum·마스킹

| | |
|---|---|
| **화면** | 회원 상세 — 1365 ID |
| **API** | `GET /api/users/{memberId}/external-identifiers` — `provider`, `externalIdMasked`, `verified` |
| **갭 유형** | 문서화 |
| **프론트 임시 대응** | `provider`에 `1365` 포함 시 매핑; `external1365Id` fallback |
| **제안** | `provider` enum (`VOLUNTEER_1365` 등), 원문 조회 정책(unmask 연동 여부) |

---

### 15. 회원 상세 강사 정산 탭 — list DTO 갭

| | |
|---|---|
| **화면** | 회원 상세 — 강사 정산 현황 탭 |
| **API** | `GET /api/settlements?instructorMemberId=` (settlement 모듈) |
| **UI 요구** | `institutionName`, 세부 invoice line items, 프로그램명 필터 서버 지원 |
| **현재 API** | `SettlementListItemResponse`에 기관명 없음; invoice 상세는 별도 `GET /api/settlements/{id}` |
| **갭 유형** | 구조 불일치 |
| **프론트 임시 대응** | list→`InstructorSettlementListRow` mapper + placeholder invoice; 클라이언트 필터 |
| **제안** | list item에 `institutionName` 추가 또는 Admin 전용 member settlements endpoint |

---

## P2 — 부가 기능

### 10. 프로그램 역할(PM 등) 할당 API

| | |
|---|---|
| **화면** | 관리자 회원 상세 — 프로그램 역할 |
| **UI 요구** | `updateUserProgramRole`, `programRoles` |
| **현재 API** | 없음 |
| **프론트 임시 대응** | mock only |

---

### 11. 관리자 코멘트·소속 교사 목록

| | |
|---|---|
| **화면** | 회원 상세 — 관리자 코멘트, 기관 소속 교사 |
| **현재 API** | `GET/POST .../comments`, `GET .../affiliated-teachers` |
| **프론트** | remote 시 API 조회·코멘트 등록 연동 |
| **잔여 갭** | 코멘트 수정/삭제. 소속 교사 재직 현황 변경 mutation |

---

### 12. role permission `PUT` vs `PATCH` 중복

| | |
|---|---|
| **API** | `PUT /api/admin/admin-roles/{roleCode}/permissions` **와** `PATCH /api/admin/roles/{roleId}/permissions` |
| **갭 유형** | 스펙 정리 |
| **프론트 임시 대응** | `PUT` + `roleCode` 사용 |
| **제안** | canonical endpoint 하나로 통일, deprecated 표기 |

---

## 부록 — 사전 등록(`pre-register`) 필드 갭

| UI 등록 모달 | `AdminPreRegisterMemberRequest` | 비고 |
|--------------|----------------------------------|------|
| 비밀번호 | **없음** | 사전 등록 후 본인 가입 플로우 가정 |
| 관리자 `adminLevel` | **없음** | |
| 강사 계좌 정보 | **없음** | `oneLineIntro`만 매핑 |
| `id1365` | `external1365Id` | 개인 등록 시 매핑 가능 |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-12 | 회원 관리 mock→API Phase 0~5 프론트 연동 기준 초안 |
| 2026-06-12 | 상세 하위 탭 Phase A~C — consent/external-id/정산 연동, #9 확장, #13~#15 추가 |
| 2026-06-26 | 회원 상세 mock→API 전환 — 기본정보 PATCH, 코멘트, 소속 교사, 신청/참여/관리자 프로그램 이력 |
