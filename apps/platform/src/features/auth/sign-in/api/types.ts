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
}

/** GET /api/portal/auth/me — HomepageMeResponse */
export type HomepageMeResponse = {
  memberId?: number
  memberUuid?: string
  email?: string
  name?: string
  status?: string
  memberType?: string
  ageGroup?: string
  teacher?: boolean
  identityVerified?: boolean
  lastLoginAt?: string
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
  external1365Id?: string
  accountStatus?: string
  joinedAt?: string
}
