---
priority: high
category: process
---

# CMS — admin-provisioned vs self-serve members

Align UI and mocks with `User.registeredByAdmin`, `User.identitySelfSignupCompletedAfterAdminRegistration`, and `admin-provisioned-member-policy.ts`.

## Registration type

| Treat as | Condition |
|----------|-----------|
| **Admin-provisioned** (broader CMS edit) | `registeredByAdmin === true` **and** `identitySelfSignupCompletedAfterAdminRegistration !== true` |
| **Self-registered** | Otherwise — signed up directly, or finished self-signup after admin invite |

`shouldShowCmsMemberInfoEditButton` ≈ admin-provisioned (full basic-info edit); `isSelfRegisteredMemberForCmsBasicInfo` ≈ inverse for basic-info rules.

### API → flag normalization (`resolve-member-registration-flags.ts`)

- `registeredByAdmin` ← `registeredByAdmin` / `preRegistered` / `createdByAdmin` / (ADMIN + `adminAccountId`)
- `identitySelfSignupCompletedAfterAdminRegistration` ← explicit flag **or** `identityVerified === true`  
  (어드민 등록 회원도 본인 최초로그인·본인인증 완료 시 `identityVerified: true`로 잠금)

### [정보 수정] after admin invite + identity verify

| 상태 | [정보 수정] | 수정 범위 |
|------|-------------|-----------|
| 어드민 등록 + `identityVerified: false` (미완료) | 노출 | 기본정보 전체 (역할별 기존 규칙) |
| 어드민 등록 + `identityVerified: true` (완료) | **숨김** | 수정 불가 |
| 위 + **강사·교사겸강사** (`instructor_only` / `instructor_dual`) | **노출** | 조회 레이아웃 전체 유지 + **강사비 등급·JA 평가 등급만** 인라인 편집 (`instructor_fee_ja` scope, `draftToInstructorFeeAndJaGradePatch`) |
| 위 + **순수 교사** (`school_teacher`) | **숨김** | 교사 상세는 기본 정보·약관만 (강사 제출양식·등급 수정 없음) |

헬퍼: `isCmsInstructorFeeJaRestrictedEditTarget`, `shouldShowCmsMemberInfoEditButtonOrInstructorRestricted`.  
코멘트는 별도 [코멘트 작성] 경로 유지.

## Who can edit what

- **Admin-provisioned (미본인인증):** admins can edit basic info except fields marked read-only (join date, linked socials, system counts, etc.).  
- **Self-registered / 본인인증 완료 후:** basic info stays read-only for admins; exceptions:  
  - **ADMIN** self-registered: comment via [코멘트 작성]; permission type may use `draftToAdminMemberRestrictedPatch` where still wired.  
  - **Admin comment**: separate header action; CMS admin login always sees the comment block.  
  - **INSTRUCTOR** (`instructor_only` · `instructor_dual`) after admin-provisioned identity verify: [정보 수정] shows with **fee grade + JA evaluation grade only**.  
  - **순수 교사** (`school_teacher`): 본인인증 후 [정보 수정] 숨김 — 기본 정보·약관만 조회.  
- **ADMIN member detail:** all admin roles can edit comment + permission type; **only master** edits other profile fields when member is admin-provisioned (`canEditAdminMemberInfo`). Non-master saves comment/permission only via restricted patch.  
- Captions “registered by admin” live in **`DetailInfoForm` `description`** only — no duplicate titles.

## Institution (school) detail

- Admin-provisioned: editable name, location, admin comment; **createdAt** and **application/enrollment counts** read-only.  
- Self-registered: lock basic fields; **admin comment** editable.  
- Use `InstitutionFields` + `draftToSchoolInstitutionBasicInfoPatch` (counts excluded).

- **(관리자가) 기본정보 수정 불가** — 상세에서 기본정보 필드는 편집 모드여도 읽기 전용으로 둔다.
- **예외 — 관리자 회원 (`role === 'ADMIN'`) 직접 등록**: 저장 시 `draftToAdminMemberRestrictedPatch`(코멘트 + 권한 유형)로 SCHOOL용 코멘트 전용 패치와 구분한다.
- **예외 — 관리자 코멘트**: CMS에 **관리자(`role === 'ADMIN'`)** 로 로그인한 경우 회원 상세에서 [관리자 코멘트] 블록은 **권한 승인 현황과 무관하게 항상 노출**한다(본문 없을 때 `작성된 코멘트가 없습니다.`). **편집·저장** 가능 여부는 등록 유형·대상 role 등 기존 규칙을 따른다(§3).
- **예외 — 강사·교사겸강사 (`instructor_only` / `instructor_dual`)**: 어드민 등록 후 본인인증 완료 시에도 [정보 수정] 노출. **강사비 등급**·**JA 평가 등급**만 저장 (`draftToInstructorFeeAndJaGradePatch`). 관리자 코멘트는 별도 [코멘트 작성]. 순수 교사(`school_teacher`)는 제외.

Normalize API fields to the two flags above. CMS-created users get `registeredByAdmin: true` in mocks (`user-service.ts`, `mock/users.ts`).

## Header actions

- **회원 상세**: 로그인 사용자가 CMS **관리자**(`isCmsAdminUser`)이면 기본 탭에서 [관리자 코멘트] 블록을 **항상** 노출한다. (`shouldShowAdminCommentSectionForViewer` = 관리자 로그인 **또는** `shouldShowAdminCommentSection` → `permissionApprovalStatus === 'APPROVED'`). 본문이 없으면 **`작성된 코멘트가 없습니다.`** 를 표시한다. **열람**은 편집 권한(예: 마스터 전용 기본정보)과 별개로, 관리자 로그인이면 항상 가능하다.
- **프로그램·학교(기관) 상세** (`SchoolDetailFullpageView` 신청 정보 탭): 동일하게 **관리자 로그인 시에만** [관리자 코멘트] 영역을 노출하고, 빈 값일 때 문구는 회원 상세와 같이 **`작성된 코멘트가 없습니다.`** 로 통일한다.
- **관리자 회원 상세 (`대상 role === 'ADMIN'`)** — 코멘트·권한 유형 vs 그 외 기본정보:
  - **[관리자 코멘트]**, **권한 유형**: CMS에 로그인한 **모든 관리자**(`AdminLevel` MASTER / ADMIN / GENERAL)가 열람·수정 가능. (`canAccessAdminCommentInAdminDetail` = `isCmsAdminUser`)
  - **그 외 기본정보**(성명, 연락처, 이메일 등): **마스터 관리자만** 수정 가능. 대상이 **관리자 등록** 회원(`shouldShowCmsMemberInfoEditButton`)일 때만 일괄 편집 UI가 풀림 (`canEditAdminMemberInfo` = `isMasterAdminUser` + 관리자 등록).
  - 비마스터가 [정보 수정]으로 들어온 경우: 코멘트·권한 유형만 저장 패치에 포함하고(`draftToAdminMemberRestrictedPatch`), 성명·연락처 등은 화면상 읽기 전용으로 둔다.

## Implementation map

- Policy: `admin-provisioned-member-policy.ts`  
- UI locks: `user-basic-info-section.tsx`  
- Save: `use-user-detail-controller.ts`, `admin-provisioned-member-basic-info-draft.ts`  
- Types: `types/user.ts`  

- **회원** `*관리자에 의해 등록된 회원입니다`: `shouldShowAdminRegisteredMemberDetailCaption` — 관리자 등록이면서 직접 가입 미완료일 때.
- **학교** `*관리자에 의해 등록된 학교입니다`: `shouldShowAdminRegisteredSchoolDetailCaption` — 학교·관리자 등록·직접 가입 미완료·연동 교사 없음 등 조건 충족 시. `resolveUserDetailBasicTabCaption`에서 회원/학교 문구는 상호 배타적으로 합친다.

직접 가입 완료 후에는 위 별표 문구 비노출(직접 등록 취급).

## 5. 학교(기관) 상세 (`institution`)

- **관리자 등록 학교**: 기관명·기관 소재지·관리자 코멘트 수정 가능. **프로그램 신청/수강 횟수**는 시스템 지표로 **수정 불가**. **등록일(`createdAt`)** 읽기 전용.
- **직접 등록 학교**: 기본정보(기관명·주소) 잠금, **관리자 코멘트**만 예외.

구현: `InstitutionFields` + `draftToSchoolInstitutionBasicInfoPatch` (횟수 필드 미포함).

학교 전용 타이틀 우측 문구는 사용하지 않음 — 학교 안내는 §4와 같이 **description**만 사용.

## 6. API / Mock

- 백엔드 필드명이 다르면 응답 매핑에서 `registeredByAdmin`, `identitySelfSignupCompletedAfterAdminRegistration`으로 정규화한다.
- CMS `createUser`(관리자 회원 등록)로 생성되는 목 사용자에는 `registeredByAdmin: true`를 부여한다. (`user-service.ts`)
- 시연용: `apps/cms/src/data/mock/users.ts` 등.

## 7. 관리자 권한 유형(목록/상세 표기)

- **마스터 관리자** / **중간관리자(PM·파트너)** / **뷰어** — 목록·필터·태그 용어 통일.

## 8. 헤더 버튼(요약)

- 학교 상세: **[학교 삭제]** → **[정보 수정]** → **[개인정보 상세보기]** 등 기존 `user-detail-header`·풀페이지 셸 규칙을 따른다. 편집 중 삭제·탈퇴·개인정보 버튼 처리는 기존과 동일.
- 강사/관리자 **권한 승인 상세 모드** 상단 버튼은 권한 승인 현황별로 아래 순서·variant를 고정한다. (`PermissionHeaderActions`)
  - **승인 완료(`APPROVED`)**: **[승인 취소]** (`variant="delete"`) / **[개인정보 상세보기]**
  - **승인 대기(`PENDING`)**: **[신청 반려]** (`variant="delete"`) / **[신청 승인]** (`variant="secondary"`) / **[개인정보 상세보기]**
  - **신청 반려(`REJECTED`)**: **[반려 취소]** (`variant="delete"`) / **[개인정보 상세보기]**

## 9. 권한 승인 현황(기본 정보 값 셀)

- 대상: **권한 승인 상세 모드 강사/관리자 공통** (`mode="permission"`, role `INSTRUCTOR`/`ADMIN`)
- 상태가 `PENDING`이 아니면 값 셀을 **상태 텍스트 + divider + [알림 재발송] + 일시** 순서로 렌더한다.
  - 버튼: `CmsButton`, `size="small"`
  - 간격: 상태/`|`/버튼/일시 사이 **12px**
  - 일시 우선순위:
    1) `permissionNotificationResentAt`(알림 재발송 이력 존재 시)
    2) `permissionApprovalHandledAt`(최근 승인/반려 처리 시각)
- 상태가 `PENDING`이면 상태 텍스트만 노출하고 divider/버튼/일시는 숨긴다.
- 일시 텍스트 스타일은 다음을 고정한다.
  - `color: var(--default-BK, #3D3D3D)`
  - `font-family: Pretendard`
  - `font-size: 16px`
  - `font-style: normal`
  - `font-weight: 500`
  - `line-height: 150%`
  - `opacity: 0.6`

## 10. 권한 신청 목록 노출 정책 (강사/학교)

- **강사 권한 신청 목록**에는 `role === 'INSTRUCTOR'` 중에서도 **순수 강사**(`instructorMemberProfile === 'instructor_only'`)만 노출한다.
- 다음 대상은 강사 권한 신청 목록에서 제외한다.
  - 일반 교사형 강사(`school_teacher`)
  - 교사 겸 강사(`instructor_dual`)
  - 개인/학교 회원(`INDIVIDUAL`/`SCHOOL`)
- **학교(교사) 회원**(`role === 'SCHOOL'`)은 별도 승인 절차 없이 가입 시 `permissionApprovalStatus = 'APPROVED'`로 자동 처리한다.

## 구현 참조 파일

- 정책: `apps/cms/src/features/user/shared/lib/admin-provisioned-member-policy.ts` (`shouldShowAdminCommentSectionForViewer`, `isCmsAdminUser` 등)
- 상세 UI·필드 잠금: `apps/cms/src/features/user/detail/ui/user-basic-info-section.tsx`
- 저장: `apps/cms/src/features/user/detail/lib/use-user-detail-controller.ts`, `admin-provisioned-member-basic-info-draft.ts`
- 타입 설명: `apps/cms/src/types/user.ts` (`registeredByAdmin`, `identitySelfSignupCompletedAfterAdminRegistration`)
