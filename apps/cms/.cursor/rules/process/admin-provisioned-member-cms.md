---
priority: high
category: process
---

# CMS — 관리자 등록 회원 (Admin-provisioned member)

회원이 **관리자 회원 등록**으로만 생성된 경우와, 이후 **본인인증·직접 가입**을 마친 경우의 UI·버튼 노출 규칙입니다. 구현·목 데이터는 `User.registeredByAdmin`, `User.identitySelfSignupCompletedAfterAdminRegistration` 및 [`admin-provisioned-member-policy.ts`](apps/cms/src/features/user/shared/lib/admin-provisioned-member-policy.ts)를 기준으로 맞춘다.

## 1. 정보 수정 가능 범위

- **관리자가 등록한 회원 제외**: 기본정보는 원칙적으로 **수정 불가**이며, **관리자 코멘트만 수정 가능**하다.
- 단, **강사 회원(`role === 'INSTRUCTOR'`)**은 위 예외에 더해 **강사비 등급**(`listMetrics.instructorTypeLabel`) 수정이 가능하다.
- **관리자가 등록한 회원**(`registeredByAdmin === true` && `identitySelfSignupCompletedAfterAdminRegistration !== true`)은
  기본정보 전반을 수정할 수 있다. 다만 **등록일/가입일/연동된 소셜 계정** 등 읽기 전용 지정 항목은 제외한다.

## 2. [정보 수정] 버튼 노출 조건

- 회원 상세(기본 모드)에서는 `all_users` / `institution` / `instructor` / `admin` 기본정보 본문에 대해 **[정보 수정]** 버튼을 노출한다.
- 버튼 클릭 시 실제 편집 가능한 범위는 상단 **1. 정보 수정 가능 범위** 정책을 따른다.

## 3. 기본 정보 섹션 문구

- 다음을 **모두** 만족할 때만, 기본 정보 `DetailInfoForm`의 **description**에 다음 문구를 포함한다.  
  **`*관리자에 의해 등록된 회원입니다`**
  1. `registeredByAdmin === true`
  2. `identitySelfSignupCompletedAfterAdminRegistration !== true`  
     (관리자 등록 후 사용자가 직접 가입·추가 절차를 마친 경우에는 **이 문구는 노출하지 않음**)
- (전략이 내려주는 `basicTab.caption`이 있으면 같은 description에 이어 붙인다. `resolveUserDetailBasicTabCaption` 참고.)
- **[관리자 코멘트]** 블록은 `권한 승인 현황`이 **승인 완료(APPROVED)** 인 회원에게만 노출한다.
- 권한 승인 현황 값은 **회원 권한 승인 페이지**에서 관리하며, 상세 화면은 해당 상태를 기준으로 노출 여부를 결정한다.
- 단, **관리자 상세(`User.role === 'ADMIN'`)의 [관리자 코멘트]는 마스터 관리자만 열람/수정**할 수 있다.
- 또한 **관리자 코멘트 외 관리자 회원 기본정보 수정은 마스터 관리자만 가능**하며,
  대상도 `registeredByAdmin === true` && `identitySelfSignupCompletedAfterAdminRegistration !== true` 인 경우로 제한한다.

## 4. API 연동 시

- 백엔드 필드명이 다르면 응답 매핑 레이어에서 위 두 플래그로 정규화한다.
- 플래그가 없거나 `false`면 일반 회원 플로우(수정 버튼 없음)로 처리한다.
- 권한 승인 현황 필드가 제공되면 `permissionApprovalStatus`로 정규화하여
  `APPROVED`일 때만 관리자 코멘트 섹션을 렌더한다.

## 5. Mock / 로컬 생성

- CMS `createUser`(관리자 회원 등록)로 생성되는 목 사용자에는 `registeredByAdmin: true`를 부여한다. (`user-service.ts`)
- 시연용 시나리오는 `apps/cms/src/data/mock/users.ts` 개인 회원 샘플(이메일 `individual1@` / `individual2@`)을 참고한다.

## 5.1 관리자 권한 유형(목록/상세 표기)

- 관리자 권한 유형은 아래 3가지로 구분한다.
  1. **마스터 관리자**
  2. **중간관리자(PM/파트너)**
  3. **뷰어**
- 관리자 목록 `권한 유형` 드롭다운/필터/태그 문구는 위 용어를 기준으로 통일한다.

## 6. 학교(기관) 회원 상세 (`User.role === 'SCHOOL'`, 기본정보 본문 `institution`)

### 6.1 헤더 버튼 (한 줄, 좌→우)

- **학교 상세**: **[학교 삭제]** → **[정보 수정]**(`secondary`) → **[개인정보 상세보기]**(`primary`, `usePersonalInfoToggle`).
- **기타 회원 상세**: 기존과 같이 **[회원 탈퇴]** 등 액션 뒤에 **[개인정보 상세보기]**(`primary`).
- 편집 중에는 삭제·탈퇴 액션과 개인정보 버튼이 비활성/숨김 처리되는 기존 규칙을 따른다.
- **개인정보 상세보기**로 마스킹을 해제한 뒤에는 `SchoolAffiliatedTeachersSection` 소속 교사 표의 **연락처·이메일**도 원문으로 표시한다.

### 6.2 [정보 수정] · 편집 가능 범위

- **관리자가 등록한 학교**(`registeredByAdmin === true` 이고 `identitySelfSignupCompletedAfterAdminRegistration !== true`): 기관명·기관 소재지(주소 검색 + 상세 주소)·프로그램 신청/수강 횟수·관리자 코멘트 수정 가능. **등록일(`createdAt`)** 만 항상 수정 불가(view 고정).
- **그 외 학교**: 기본정보(기관명·주소·지표 등)는 **수정 불가**. **[정보 수정]** 으로 진입 시 **관리자 코멘트**만 편집·저장한다.
- **[관리자 코멘트]** 블록은 위 구분과 무관하게 노출한다.
- 공통 원칙: **관리자가 등록한 회원 제외 모든 회원은 관리자 코멘트만 수정 가능**, **강사 회원은 강사비 등급도 수정 가능**.

### 6.3 기본 정보 타이틀 우측 안내

- 다음을 **모두** 만족할 때만 `DetailInfoForm` 타이틀 우측에 **「관리자에 의해 등록된 학교입니다」** 를 표시한다.
  1. `registeredByAdmin === true`
  2. `identitySelfSignupCompletedAfterAdminRegistration !== true`
  3. `schoolInfo.affiliatedTeachers` 중 **`linkedUserId`가 있는 행이 없음** (해당 학교명으로 가입·연동된 교사 회원이 없을 때).
- 연동된 교사가 생기면(위 3번이 깨지면) 해당 안내는 **비노출**한다.

구현 기준: [`admin-provisioned-member-policy.ts`](apps/cms/src/features/user/shared/lib/admin-provisioned-member-policy.ts)의 `shouldShowAdminRegisteredSchoolTitleNotice`, `schoolHasAffiliatedTeacherLinkedAccount`.
