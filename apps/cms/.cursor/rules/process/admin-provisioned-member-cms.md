---
priority: high
category: process
---

# CMS — 회원 등록 유형 · 관리자 등록 회원 (Admin-provisioned member)

개인·교사·강사·학교(기관) 회원에 공통되는 CMS 상세 정책이다. 구현·목 데이터는 `User.registeredByAdmin`, `User.identitySelfSignupCompletedAfterAdminRegistration` 및 [`admin-provisioned-member-policy.ts`](apps/cms/src/features/user/shared/lib/admin-provisioned-member-policy.ts)를 기준으로 맞춘다.

## 1. 회원 등록 유형 (CMS에서의 취급)

| 구분 | 조건 |
|------|------|
| **관리자 등록** (기본정보 일괄 수정 가능) | `registeredByAdmin === true` **이고** `identitySelfSignupCompletedAfterAdminRegistration !== true` |
| **직접 등록**으로 취급 | 위가 아닌 경우 — 최초부터 직접 가입했거나, **관리자 등록 후 본인 직접 가입(추가 절차)을 완료한 경우** (`identitySelfSignupCompletedAfterAdminRegistration === true`) |

코드: `shouldShowCmsMemberInfoEditButton` = 관리자 등록 분기, `isSelfRegisteredMemberForCmsBasicInfo` = 직접 등록 분기(논리 반대).

## 2. [정보 수정] 시 편집 가능 범위

### 2.1 관리자 등록 회원

- **(관리자가) 기본정보 수정 가능** — 읽기 전용으로 지정된 항목은 제외한다.
- **읽기 전용(예시)**: 가입일, 연동된 소셜 계정, 학교 상세의 등록일·프로그램 신청/수강 횟수(시스템 지표) 등 — 화면에서 `readOnlyDisplay` 또는 동일 의미로 고정.

### 2.2 직접 등록 회원

- **(관리자가) 기본정보 수정 불가** — 상세에서 기본정보 필드는 편집 모드여도 읽기 전용으로 둔다.
- **예외 — 관리자 회원 (`role === 'ADMIN'`) 직접 등록**: 저장 시 `draftToAdminMemberRestrictedPatch`(코멘트 + 권한 유형)로 SCHOOL용 코멘트 전용 패치와 구분한다.
- **예외 — 관리자 코멘트**: CMS에 **관리자(`role === 'ADMIN'`)** 로 로그인한 경우 회원 상세에서 [관리자 코멘트] 블록은 **권한 승인 현황과 무관하게 항상 노출**한다(본문 없을 때 `작성된 코멘트가 없습니다.`). **편집·저장** 가능 여부는 등록 유형·대상 role 등 기존 규칙을 따른다(§3).
- **예외 — 강사 회원 (`role === 'INSTRUCTOR'`)**: 위 조건 충족 시 관리자 코멘트에 더해 **강사비 등급** (`listMetrics.instructorTypeLabel` ↔ draft `instructorFeeGrade`) 편집·저장 가능.

저장 시 분기: `use-user-detail-controller` — 직접 등록 + 강사는 `draftToAdminCommentAndInstructorFeePatch`, 그 외 역할은 코멘트만 패치하는 분기(예: `draftToSchoolAdminCommentOnlyPatch`). 관리자 회원이 **관리자 등록**이면서 저장 주체가 **마스터**이면 `draftToBasicInfoPatch`, 그렇지 않으면(비마스터 또는 코멘트 전용 세션) `draftToAdminMemberRestrictedPatch`(코멘트 + 권한 유형).

## 3. 관리자 코멘트 섹션 노출

- **회원 상세**: 로그인 사용자가 CMS **관리자**(`isCmsAdminUser`)이면 기본 탭에서 [관리자 코멘트] 블록을 **항상** 노출한다. (`shouldShowAdminCommentSectionForViewer` = 관리자 로그인 **또는** `shouldShowAdminCommentSection` → `permissionApprovalStatus === 'APPROVED'`). 본문이 없으면 **`작성된 코멘트가 없습니다.`** 를 표시한다. **열람**은 편집 권한(예: 마스터 전용 기본정보)과 별개로, 관리자 로그인이면 항상 가능하다.
- **프로그램·학교(기관) 상세** (`SchoolDetailFullpageView` 신청 정보 탭): 동일하게 **관리자 로그인 시에만** [관리자 코멘트] 영역을 노출하고, 빈 값일 때 문구는 회원 상세와 같이 **`작성된 코멘트가 없습니다.`** 로 통일한다.
- **관리자 회원 상세 (`대상 role === 'ADMIN'`)** — 코멘트·권한 유형 vs 그 외 기본정보:
  - **[관리자 코멘트]**, **권한 유형**: CMS에 로그인한 **모든 관리자**(`AdminLevel` MASTER / ADMIN / GENERAL)가 열람·수정 가능. (`canAccessAdminCommentInAdminDetail` = `isCmsAdminUser`)
  - **그 외 기본정보**(성명, 연락처, 이메일 등): **마스터 관리자만** 수정 가능. 대상이 **관리자 등록** 회원(`shouldShowCmsMemberInfoEditButton`)일 때만 일괄 편집 UI가 풀림 (`canEditAdminMemberInfo` = `isMasterAdminUser` + 관리자 등록).
  - 비마스터가 [정보 수정]으로 들어온 경우: 코멘트·권한 유형만 저장 패치에 포함하고(`draftToAdminMemberRestrictedPatch`), 성명·연락처 등은 화면상 읽기 전용으로 둔다.

UI: 기본 탭에서 `UserDetailAdminCommentSection` + `DetailInfoForm` — **「관리자에 의해 등록」 안내 문구는 `DetailInfoForm`의 `description`으로만** 노출한다 (타이틀 우측·다른 섹션 중복 문구 없음).

## 4. 기본 정보 description 문구 (관리자 등록 안내)

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

## 구현 참조 파일

- 정책: `apps/cms/src/features/user/shared/lib/admin-provisioned-member-policy.ts` (`shouldShowAdminCommentSectionForViewer`, `isCmsAdminUser` 등)
- 상세 UI·필드 잠금: `apps/cms/src/features/user/detail/ui/user-basic-info-section.tsx`
- 저장: `apps/cms/src/features/user/detail/lib/use-user-detail-controller.ts`, `admin-provisioned-member-basic-info-draft.ts`
- 타입 설명: `apps/cms/src/types/user.ts` (`registeredByAdmin`, `identitySelfSignupCompletedAfterAdminRegistration`)
