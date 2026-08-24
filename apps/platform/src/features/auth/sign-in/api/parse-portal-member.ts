import type {
  HomepageMeResponse,
  PhoneIdentityChangeResponse,
  PortalProfileResponse,
} from './types'

function unwrapData(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.success === true && root.data && typeof root.data === 'object') {
    return root.data as Record<string, unknown>
  }
  return root
}

function optionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function optionalNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function optionalBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : undefined
}

export function parseHomepageMeResponse(payload: unknown): HomepageMeResponse {
  const root = unwrapData(payload)
  if (!root) {
    throw new Error('회원 정보를 해석할 수 없습니다.')
  }

  return {
    memberId: optionalNumber(root.memberId),
    memberUuid: optionalString(root.memberUuid),
    email: optionalString(root.email),
    name: optionalString(root.name),
    status: optionalString(root.status),
    memberType: optionalString(root.memberType),
    ageGroup: optionalString(root.ageGroup),
    teacher: optionalBoolean(root.teacher),
    identityVerified: optionalBoolean(root.identityVerified),
    lastLoginAt: optionalString(root.lastLoginAt),
    registeredByAdmin: optionalBoolean(root.registeredByAdmin),
    adminProvisionedOnboardingRequired: optionalBoolean(root.adminProvisionedOnboardingRequired),
    adminProvisionedOnboardingStep: optionalString(root.adminProvisionedOnboardingStep),
    identitySelfSignupCompletedAfterAdminRegistration: optionalBoolean(
      root.identitySelfSignupCompletedAfterAdminRegistration,
    ),
    passwordChangeRequired: optionalBoolean(root.passwordChangeRequired),
  }
}

export function parsePortalProfileResponse(payload: unknown): PortalProfileResponse {
  const root = unwrapData(payload)
  if (!root) {
    throw new Error('회원 프로필을 해석할 수 없습니다.')
  }

  return {
    memberId: optionalNumber(root.memberId),
    email: optionalString(root.email),
    name: optionalString(root.name),
    phone: optionalString(root.phone),
    birthDate: optionalString(root.birthDate),
    gender: optionalString(root.gender),
    memberType: optionalString(root.memberType),
    teacher: optionalBoolean(root.teacher),
    instructor: optionalBoolean(root.instructor),
    postalCode: optionalString(root.postalCode),
    address: optionalString(root.address),
    addressDetail: optionalString(root.addressDetail),
    regionSido: optionalString(root.regionSido),
    regionSigungu: optionalString(root.regionSigungu),
    schoolOrganizationId: optionalNumber(root.schoolOrganizationId),
    schoolName: optionalString(root.schoolName),
    grade: optionalString(root.grade),
    affiliationName: optionalString(root.affiliationName),
    schoolEnrollmentStatus: optionalString(root.schoolEnrollmentStatus),
    teacherEmploymentStatus: optionalString(root.teacherEmploymentStatus),
    external1365Id: optionalString(root.external1365Id),
    accountStatus: optionalString(root.accountStatus),
    joinedAt: optionalString(root.joinedAt),
  }
}

export function parsePhoneIdentityChangeResponse(payload: unknown): PhoneIdentityChangeResponse {
  const root = unwrapData(payload)
  if (!root) {
    throw new Error('연락처 변경 결과를 해석할 수 없습니다.')
  }

  return {
    memberId: optionalNumber(root.memberId),
    phone: optionalString(root.phone),
    changedAt: optionalString(root.changedAt),
  }
}
