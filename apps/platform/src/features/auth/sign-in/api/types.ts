import type {
  InstructorPortalEditableProfile,
  InstructorRoleRequestProfile,
  InstructorRoleRequestSettlement,
} from '@/features/mypage/instructor-apply/api/types'

/** 포털 회원 로그인 OpenAPI 최소 타입 (앱 경계 — CMS generated import 금지) */

export type MemberLoginRequest = {
  email: string
  password: string
}

export type AuthTokenResponse = {
  accessToken?: string
  refreshToken?: string
  tokenType?: string
  expiresInSeconds?: number
  /** 관리자 발급 임시 비밀번호 변경 필요 */
  passwordChangeRequired?: boolean
  /** CMS 관리자가 등록한 회원의 포털 온보딩이 아직 남아 있는지 */
  adminProvisionedOnboardingRequired?: boolean
  /** 다음 서버 처리 단계. PROFILE, IDENTITY, PASSWORD, PROFILE_REVIEW, DONE */
  adminProvisionedOnboardingStep?: string
  /** CMS 관리자에 의해 생성된 회원인지 */
  registeredByAdmin?: boolean
  /** 관리자 등록 후 본인 프로필·본인인증·비밀번호 변경까지 완료했는지 */
  identitySelfSignupCompletedAfterAdminRegistration?: boolean
}

export type PasswordChangeRequest = {
  currentPassword: string
  newPassword: string
}

/** GET /api/portal/auth/me — HomepageMeResponse */
export type HomepageMeResponse = {
  memberId?: number
  memberUuid?: string
  email?: string
  name?: string
  status?: string
  memberType?: string
  /** `UNDER_14` | `OVER_14` */
  ageGroup?: string
  teacher?: boolean
  instructor?: boolean
  identityVerified?: boolean
  lastLoginAt?: string
  registeredByAdmin?: boolean
  adminProvisionedOnboardingRequired?: boolean
  adminProvisionedOnboardingStep?: string
  identitySelfSignupCompletedAfterAdminRegistration?: boolean
  passwordChangeRequired?: boolean
}

/** CMS 미등록 학교(NEIS 등) 선택값 — OpenAPI PortalSchoolSelectionRequest */
export type PortalSchoolSelectionRequest = {
  schoolOrganizationId?: number
  provider?: string
  /** NEIS `ATPT_OFCDC_SC_CODE` */
  educationOfficeCode?: string
  externalSchoolCode?: string
  name?: string
  schoolLevel?: string
  organizationCategory?: string
  regionSido?: string
  regionSigungu?: string
  zipcode?: string
  address?: string
}

/**
 * PATCH /api/portal/me/profile — OpenAPI `UpdatePortalProfileRequest`.
 * 이메일·이름·휴대폰·생년월일·성별은 본인인증 필드로 PATCH 대상이 아님.
 */
export type UpdatePortalProfileRequest = {
  postalCode?: string | null
  address?: string | null
  addressDetail?: string | null
  regionSido?: string | null
  regionSigungu?: string | null
  grade?: string | null
  affiliationName?: string | null
  /** 소속 해제 시 `null`로 전달해 CMS 학교 FK를 비운다 */
  schoolOrganizationId?: number | null
  schoolName?: string | null
  schoolSelection?: PortalSchoolSelectionRequest
  schoolEnrollmentStatus?: string | null
  teacherEmploymentStatus?: string | null
  external1365Id?: string | null
  instructorProfile?: InstructorPortalProfileUpdate
}

/** PATCH — 강사 포탈 프로필 (editable profile + optional settlement) */
export type InstructorPortalProfileUpdate = {
  profile?: InstructorPortalEditableProfile
  settlement?: InstructorRoleRequestSettlement
}

/** GET — 강사 포탈 프로필 응답 */
export type InstructorPortalProfileResponse = {
  profile?: InstructorRoleRequestProfile
  settlement?: InstructorRoleRequestSettlement
}

/** GET /api/portal/me/profile — PortalTeacherOrganizationResponse */
export type PortalTeacherOrganizationResponse = {
  organizationId?: number
  organizationName?: string
  neisCode?: string
  organizationCategory?: string
  address?: string
  addressDetail?: string
  zipCode?: string
  regionSido?: string
  regionSigungu?: string
  employmentStatus?: string
  affiliationStatus?: string
  affiliationStartedAt?: string
}

/** GET /api/portal/me/profile — PortalProfileResponse */
export type PortalProfileResponse = {
  memberId?: number
  email?: string
  name?: string
  phone?: string
  /** API `YYYY-MM-DD` */
  birthDate?: string
  /** API `M` | `F` (또는 male/female) */
  gender?: string
  memberType?: string
  teacher?: boolean
  instructor?: boolean
  under14?: boolean
  /** `UNDER_14` | `OVER_14` */
  ageGroup?: string
  postalCode?: string
  address?: string
  addressDetail?: string
  regionSido?: string
  regionSigungu?: string
  schoolOrganizationId?: number
  schoolName?: string
  grade?: string
  affiliationName?: string
  /** API `ENROLLED` | `NONE` 등 */
  schoolEnrollmentStatus?: string
  /** API `ACTIVE` | `ON_LEAVE` | `EMPLOYED` 등 */
  teacherEmploymentStatus?: string
  /** 교사 회원 현재 학교. 기관 주소의 SSOT */
  teacherOrganization?: PortalTeacherOrganizationResponse
  external1365Id?: string
  accountStatus?: string
  joinedAt?: string
  /** 만 14세 미만 회원 보호자. 본인 포탈 조회 전용 */
  guardian?: {
    guardianName?: string
    guardianRelation?: string
    guardianPhone?: string
  }
  instructorProfile?: InstructorPortalProfileResponse
  socialAccounts?: string[]
  listMetrics?: {
    settlementStatusLabel?: string
    jaEvaluationGrade?: string
    instructorFeeGradeLabel?: string
  }
}

/** POST /api/portal/me/phone/identity/confirm — OpenAPI `PhoneIdentityConfirmRequest` */
export type PhoneIdentityConfirmRequest = {
  identityVerificationSessionId?: number
  profileToken: string
}

/** POST /api/portal/me/phone/identity/confirm — OpenAPI `PhoneIdentityChangeResponse` */
export type PhoneIdentityChangeResponse = {
  memberId?: number
  phone?: string
  changedAt?: string
}

/** POST /api/portal/me/withdrawals — `confirmationText` 고정 확인 문구 (OpenAPI example·enum) */
export const PORTAL_WITHDRAWAL_CONFIRMATION_TEXT = '회원탈퇴'

/**
 * POST /api/portal/me/withdrawals — OpenAPI `PortalWithdrawalRequest`
 * 본인 확인 SoT는 `currentPassword`. `confirmationText`는 서버 `@NotBlank` 검증(고정 문구 `회원탈퇴`).
 */
export type PortalWithdrawalRequest = {
  currentPassword: string
  reason: string
  confirmationText?: string
}

/** POST /api/portal/me/withdrawals — OpenAPI `PortalWithdrawalResponse` */
export type PortalWithdrawalResponse = {
  memberId?: number
  status?: string
  withdrawnAt?: string
  message?: string
}
