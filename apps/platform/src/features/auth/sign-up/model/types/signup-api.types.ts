/**
 * 홈페이지 회원가입 OpenAPI 최소 타입.
 * CMS generated 스키마를 import하지 않는다 (앱 경계).
 */

export type HomepageEmailAvailabilityResponse = {
  email?: string
  exists?: boolean
  available?: boolean
  nextAction?: string
  message?: string
}

export type SignupTermsAgreementPayload = {
  termsType?: string
  version?: string
  required?: boolean
  agreed?: boolean
  termsSnapshotJson?: string
}

export type SignupTermsDocument = {
  termsType?: string
  label?: string
  version?: string
  title?: string
  content?: string
  contentFormat?: string
  required?: boolean
  documentRequired?: boolean
  notAgreedRestriction?: string
  retentionPolicy?: string
  agreementPayload?: SignupTermsAgreementPayload
}

export type SignupTermsCatalogResponse = {
  memberType?: string
  ageGroup?: string
  generatedAt?: string
  terms?: SignupTermsDocument[]
}

export type TermsAgreementRequest = {
  termsType: string
  version: string
  required?: boolean
  agreed?: boolean
  termsSnapshotJson?: string
}

/** CMS 미등록 학교(NEIS 등) 선택값 — OpenAPI PortalSchoolSelectionRequest */
export type PortalSchoolSelectionRequest = {
  provider?: string
  externalSchoolCode?: string
  name?: string
  schoolLevel?: string
  organizationCategory?: string
  regionSido?: string
  regionSigungu?: string
  zipcode?: string
  address?: string
}

export type MemberSignupRequest = {
  email: string
  password: string
  name: string
  phone?: string
  birthDate?: string
  gender?: string
  under14?: boolean
  identityVerified?: boolean
  identityVerificationSessionId?: number
  guardianVerificationSessionId?: number
  schoolEnrollmentStatus?: string
  schoolOrganizationId?: number
  schoolName?: string
  /** CMS 미등록 학교 — organizationId 없을 때 사용 */
  schoolSelection?: PortalSchoolSelectionRequest
  grade?: string
  affiliationName?: string
  postalCode?: string
  address?: string
  addressDetail?: string
  regionSido?: string
  regionSigungu?: string
  external1365Id?: string
  termsAgreements?: TermsAgreementRequest[]
}

export type TeacherSignupRequest = {
  member: MemberSignupRequest
  /** CMS 등록 학교 PK. 미등록이면 생략하고 member.schoolSelection 사용 */
  organizationId?: number
  employmentStatus?: string
}

export type HomepageGeneralSignupRequest = {
  member: MemberSignupRequest
}

export type HomepageTeacherSignupRequest = {
  teacher: TeacherSignupRequest
}

export type HomepageSignupResponse = {
  memberId?: number
  memberUuid?: string
  status?: string
  memberType?: string
  nextStep?: string
  loginEnabled?: boolean
  message?: string
}

export type HomepageOrganizationSearchItem = {
  organizationId?: number
  name?: string
  organizationCategory?: string
  regionSido?: string
  regionSigungu?: string
  zipcode?: string
  address?: string
}

export type HomepageOrganizationSearchResponse = {
  content?: HomepageOrganizationSearchItem[]
  page?: number
  size?: number
  totalElements?: number
  source?: string
}

export type SearchHomepageSchoolsParams = {
  keyword?: string
  regionSido?: string
  regionSigungu?: string
  organizationCategory?: string
  page?: number
  size?: number
}
