---
priority: high
category: process
---

# CMS — 관리자 등록 회원 (Admin-provisioned member)

회원이 **관리자 회원 등록**으로만 생성된 경우와, 이후 **본인인증·직접 가입**을 마친 경우의 UI·버튼 노출 규칙입니다. 구현·목 데이터는 `User.registeredByAdmin`, `User.identitySelfSignupCompletedAfterAdminRegistration` 및 [`admin-provisioned-member-policy.ts`](apps/cms/src/features/user/shared/lib/admin-provisioned-member-policy.ts)를 기준으로 맞춘다.

## 1. 정보 수정 가능 범위

- **관리자가 등록한 회원을 제외한** 모든 회원: CMS에서 회원 정보 **수정 불가**로 취급한다. (상세 헤더에 **[정보 수정]** 버튼을 두지 않는다.)
- **관리자가 등록한 회원**(`registeredByAdmin === true`)만 예외적으로 **[정보 수정]** 노출을 검토한다.

## 2. [정보 수정] 버튼 노출 조건

다음을 **모두** 만족할 때만 회원 상세(기본 모드) 헤더에 **[정보 수정]**을 노출한다.

1. `registeredByAdmin === true`
2. `identitySelfSignupCompletedAfterAdminRegistration !== true`  
   (관리자 등록 계정이 **본인인증 후 직접 가입** 절차를 이미 마친 경우, 관리자 화면에서는 일반 회원과 동일하게 보고 **버튼 비노출**)

`onEdit` 콜백이 넘어와도 위 조건을 통과하지 않으면 버튼을 렌더하지 않는다. (`getDefaultHeaderActions`)

## 3. 기본 정보 섹션 문구

- 다음을 **모두** 만족할 때만, 기본 정보 `DetailInfoForm`의 **description**에 다음 문구를 포함한다.  
  **`*관리자에 의해 등록된 회원입니다`**
  1. `registeredByAdmin === true`
  2. `identitySelfSignupCompletedAfterAdminRegistration !== true`  
     (관리자 등록 후 사용자가 직접 가입·추가 절차를 마친 경우에는 **이 문구는 노출하지 않음**)
- (전략이 내려주는 `basicTab.caption`이 있으면 같은 description에 이어 붙인다. `resolveUserDetailBasicTabCaption` 참고.)
- **[관리자 코멘트]** 블록은 위 플래그와 무관하게 회원 상세 기본 탭에 **항상 노출**한다. (`UserDetailAdminCommentSection`)

## 4. API 연동 시

- 백엔드 필드명이 다르면 응답 매핑 레이어에서 위 두 플래그로 정규화한다.
- 플래그가 없거나 `false`면 일반 회원 플로우(수정 버튼 없음)로 처리한다.

## 5. Mock / 로컬 생성

- CMS `createUser`(관리자 회원 등록)로 생성되는 목 사용자에는 `registeredByAdmin: true`를 부여한다. (`user-service.ts`)
- 시연용 시나리오는 `apps/cms/src/data/mock/users.ts` 개인 회원 샘플(이메일 `individual1@` / `individual2@`)을 참고한다.
