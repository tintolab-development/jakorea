import type { PortalProfileResponse } from '@/features/auth/sign-in'
import { formatBirthDateInput } from '@/features/auth/sign-up'
import type {
  EmploymentStatus,
  GenderType,
  MemberType,
  SchoolStatus,
} from '@/features/auth/sign-up'
import type { AdminRegisteredWizardState } from '../model/wizard-state'

function mapMemberType(profile: PortalProfileResponse): MemberType {
  if (profile.teacher === true) return 'teacher'
  const memberType = profile.memberType?.trim().toUpperCase()
  if (memberType === 'TEACHER') return 'teacher'
  return 'general'
}

function mapGender(value: string | undefined): GenderType | undefined {
  const normalized = value?.trim().toUpperCase()
  if (normalized === 'M' || normalized === 'MALE') return 'male'
  if (normalized === 'F' || normalized === 'FEMALE') return 'female'
  return undefined
}

function mapBirthDate(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length < 8) return undefined
  return formatBirthDateInput(digits)
}

function mapSchoolStatus(value: string | undefined): SchoolStatus | undefined {
  const normalized = value?.trim().toUpperCase().replace(/-/g, '_')
  if (!normalized) return undefined
  if (normalized === 'ENROLLED' || normalized === 'IN_SCHOOL' || normalized === 'YES') {
    return 'enrolled'
  }
  if (normalized === 'NONE' || normalized === 'NOT_ENROLLED' || normalized === 'NO') {
    return 'none'
  }
  return undefined
}

function mapEmploymentStatus(value: string | undefined): EmploymentStatus | undefined {
  const normalized = value?.trim().toUpperCase().replace(/-/g, '_')
  if (normalized === 'ACTIVE' || normalized === 'EMPLOYED') return 'employed'
  if (normalized === 'ON_LEAVE') return 'on-leave'
  return undefined
}

function mapSchoolAddress(profile: PortalProfileResponse): string | undefined {
  const parts = [profile.regionSido?.trim(), profile.regionSigungu?.trim()].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : undefined
}

/**
 * GET /api/portal/me/profile → 관리자 등록 온보딩 wizard 필드.
 * 본인인증으로 이미 채운 birthDate/gender/verified* 는 덮어쓰지 않는다.
 */
export function mapPortalProfileToAdminRegisteredWizardPartial(
  profile: PortalProfileResponse,
  current: AdminRegisteredWizardState,
): Partial<AdminRegisteredWizardState> {
  const memberType = mapMemberType(profile)
  const mappedGender = mapGender(profile.gender)
  const mappedBirthDate = mapBirthDate(profile.birthDate)
  const schoolStatus = mapSchoolStatus(profile.schoolEnrollmentStatus)
  const employmentStatus = mapEmploymentStatus(profile.teacherEmploymentStatus)
  const schoolAddress = mapSchoolAddress(profile)

  return {
    email: profile.email?.trim() || current.email,
    memberType,
    birthDate: current.birthDate || mappedBirthDate,
    gender: current.gender ?? mappedGender,
    verifiedName: current.verifiedName || profile.name?.trim() || undefined,
    verifiedPhone: current.verifiedPhone || profile.phone?.trim() || undefined,
    address: profile.address?.trim() ?? current.address ?? '',
    addressDetail: profile.addressDetail?.trim() ?? current.addressDetail ?? '',
    schoolName: profile.schoolName?.trim() || profile.affiliationName?.trim() || current.schoolName || '',
    grade: profile.grade?.trim() ?? current.grade ?? '',
    schoolStatus:
      schoolStatus ??
      (profile.schoolName?.trim()
        ? 'enrolled'
        : (current.schoolStatus ?? (memberType === 'teacher' ? undefined : 'none'))),
    employmentStatus: employmentStatus ?? current.employmentStatus,
    schoolAddress: schoolAddress ?? current.schoolAddress,
    volunteerId: profile.external1365Id?.trim() ?? current.volunteerId ?? '',
    profileHydrated: true,
  }
}
