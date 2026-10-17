import type {
  InstructorPortalProfileResponse,
  HomepageMeResponse,
  PhoneIdentityChangeResponse,
  PortalProfileResponse,
  PortalTeacherOrganizationResponse,
} from './types'
import type { InstructorRoleRequestProfile } from '@/features/mypage/instructor-apply/api/types'

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

function optionalObject(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return undefined
}

function parseInstructorPortalProfile(
  value: unknown,
): InstructorPortalProfileResponse | undefined {
  const root = optionalObject(value)
  if (!root) return undefined
  const profile = optionalObject(root.profile)
  const settlement = optionalObject(root.settlement)
  return {
    ...(profile ? { profile: profile as InstructorRoleRequestProfile } : {}),
    ...(settlement
      ? { settlement: settlement as InstructorPortalProfileResponse['settlement'] }
      : {}),
  }
}

function parseTeacherOrganization(value: unknown): PortalTeacherOrganizationResponse | undefined {
  if (!value || typeof value !== 'object') return undefined
  const org = value as Record<string, unknown>
  return {
    organizationId: optionalNumber(org.organizationId),
    organizationName: optionalString(org.organizationName),
    neisCode: optionalString(org.neisCode),
    organizationCategory: optionalString(org.organizationCategory),
    address: optionalString(org.address),
    addressDetail: optionalString(org.addressDetail),
    zipCode: optionalString(org.zipCode),
    regionSido: optionalString(org.regionSido),
    regionSigungu: optionalString(org.regionSigungu),
    employmentStatus: optionalString(org.employmentStatus),
    affiliationStatus: optionalString(org.affiliationStatus),
    affiliationStartedAt: optionalString(org.affiliationStartedAt),
  }
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
    under14: optionalBoolean(root.under14),
    ageGroup: optionalString(root.ageGroup),
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
    teacherOrganization: parseTeacherOrganization(root.teacherOrganization),
    external1365Id: optionalString(root.external1365Id),
    accountStatus: optionalString(root.accountStatus),
    joinedAt: optionalString(root.joinedAt),
    instructorProfile: parseInstructorPortalProfile(root.instructorProfile),
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
