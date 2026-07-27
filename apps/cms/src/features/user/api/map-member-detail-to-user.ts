import type { InstructorDetailResponse } from '@/shared/api/generated/members/schemas'
import type { IndividualMemberDetailResponse } from '@/shared/api/generated/members/schemas'
import type { InstructorMemberDetailResponse } from '@/shared/api/generated/members/schemas'
import type { MemberDetailResponse } from '@/shared/api/generated/members/schemas'
import type { SchoolMemberDetailResponse } from '@/shared/api/generated/members/schemas'
import type { UserResponse } from '@/shared/api/generated/members/schemas'
import type { User } from '@/types/user'
import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'
import { toDisplayGender } from '@/features/user/api/map-member-gender-birth'
import {
  mapMemberStatusToIsActive,
  resolvePrimaryUserRole,
} from '@/features/user/api/map-member-role'

function fallbackUuid(memberId?: number): string {
  if (memberId != null) return `member-${memberId}`
  return `member-unknown-${crypto.randomUUID()}`
}

type MemberDetailMappingSource = MemberDetailResponse &
  Pick<UserResponse, 'socialAccounts' | 'guardianInfo' | 'schoolInfo' | 'role'>

export function mapMemberDetailToUser(
  detail: MemberDetailMappingSource,
  instructorProfile?: InstructorDetailResponse | null,
  options?: { fallbackRole?: User['role'] }
): Omit<User, 'password'> {
  const memberId = detail.memberId
  const uuid =
    typeof detail.uuid === 'string' && detail.uuid.trim()
      ? detail.uuid.trim()
      : memberId != null
        ? fallbackUuid(memberId)
        : fallbackUuid()

  if (memberId != null) {
    registerMemberIdMapping(uuid, memberId)
  }

  const role = resolvePrimaryUserRole(detail.roles, detail.role ?? options?.fallbackRole)
  const now = new Date().toISOString()

  const user: Omit<User, 'password'> = {
    id: uuid,
    memberId,
    email: String(detail.email ?? '').trim() || '-',
    name: String(detail.name ?? '').trim() || '-',
    phone: detail.phone?.trim() || undefined,
    role,
    gender: (() => {
      const display = toDisplayGender(detail.gender)
      return display === '-' ? undefined : display
    })(),
    birthDate: detail.birthDate ?? undefined,
    isActive: mapMemberStatusToIsActive(undefined, detail.status),
    createdAt: detail.joinedAt ?? detail.createdAt ?? now,
    updatedAt: detail.updatedAt ?? now,
    registeredByAdmin: Boolean(detail.preRegistered ?? detail.createdByAdmin),
    id1365: detail.external1365Id?.trim() || undefined,
    identitySelfSignupCompletedAfterAdminRegistration: detail.identityVerified === true,
    socialAccounts: detail.socialAccounts?.map(account => account.trim()).filter(Boolean),
    under14: detail.under14,
    guardianConsentRequired: detail.guardianConsentRequired,
    guardianInfo: detail.guardianInfo
      ? {
          guardianName: detail.guardianInfo.guardianName?.trim() || undefined,
          relation: detail.guardianInfo.relation?.trim() || undefined,
          phone: detail.guardianInfo.phone?.trim() || undefined,
          consentStatus: detail.guardianInfo.consentStatus?.trim() || undefined,
          consentedAt: detail.guardianInfo.consentedAt,
        }
      : undefined,
  }

  if (role === 'SCHOOL') {
    const schoolName = String(
      detail.schoolInfo?.schoolName ?? detail.name ?? ''
    ).trim()
    if (schoolName) {
      user.schoolInfo = {
        schoolName,
        address: detail.schoolInfo?.address?.trim() ?? '',
        ...(detail.schoolInfo?.position?.trim()
          ? { position: detail.schoolInfo.position.trim() }
          : {}),
      }
      user.name = schoolName
    }
  }

  if (role === 'INSTRUCTOR' && instructorProfile) {
    applyInstructorProfile(user, instructorProfile, detail.name)
  }

  return user
}

function applyInstructorProfile(
  user: Omit<User, 'password'>,
  instructorProfile: InstructorDetailResponse,
  memberName?: string | null
) {
  user.instructorInfo = {
    bankName: '',
    accountNumber: '',
    accountHolder: memberName?.trim() ?? '',
    isBusinessIncome: Boolean(instructorProfile.businessIncomeYn),
  }
  const oneLine = instructorProfile.oneLineIntro?.trim()
  const selfIntro = instructorProfile.selfIntroduction?.trim()
  if (oneLine) {
    user.bio = oneLine
  } else if (selfIntro) {
    user.bio = selfIntro
  }
  if (instructorProfile.homeAddress?.trim()) {
    user.detailAddress = instructorProfile.homeAddress.trim()
  }
  if (instructorProfile.careerText?.trim()) {
    user.instructorCareerText = instructorProfile.careerText.trim()
  }
  if (selfIntro) {
    user.instructorSelfIntroduction = selfIntro
  }
  const activityTypes = (instructorProfile.activityTypes ?? []).filter(Boolean)
  if (activityTypes.length > 0) {
    user.affiliation = activityTypes.join(', ')
  }
  user.listMetrics = {
    ...user.listMetrics,
    instructorFeeGradeLabel:
      instructorProfile.defaultFeeGrade?.trim() || user.listMetrics?.instructorFeeGradeLabel,
    jaEvaluationGrade:
      instructorProfile.defaultJaGrade?.trim() || user.listMetrics?.jaEvaluationGrade,
    highestEducationLabel:
      instructorProfile.educationLevel?.trim() || user.listMetrics?.highestEducationLabel,
    instructorCareerSummaryLabel:
      instructorProfile.careerText?.trim() || user.listMetrics?.instructorCareerSummaryLabel,
  }
  if (instructorProfile.status?.trim()) {
    user.instructorApprovalStatus = instructorProfile.status.trim()
  }
}

export function mapIndividualMemberDetailToUser(
  detail: IndividualMemberDetailResponse,
  options?: { fallbackRole?: User['role'] }
): Omit<User, 'password'> {
  const member = detail.member
  if (!member) {
    throw new Error('개인 회원 상세 응답에 member가 없습니다.')
  }
  const user = mapMemberDetailToUser(member, null, {
    fallbackRole: options?.fallbackRole ?? 'INDIVIDUAL',
  })
  const addressLine = [detail.address?.trim(), detail.addressDetail?.trim()]
    .filter(Boolean)
    .join(' ')
  if (addressLine) user.detailAddress = addressLine
  if (detail.schoolName?.trim()) {
    user.affiliation = detail.enrollmentStatus?.trim()
      ? `${detail.schoolName.trim()} | ${detail.enrollmentStatus.trim()}`
      : detail.schoolName.trim()
  }
  return user
}

export function mapSchoolMemberDetailToUser(
  detail: SchoolMemberDetailResponse,
  options?: { fallbackRole?: User['role'] }
): Omit<User, 'password'> {
  const member = detail.member
  if (!member) {
    throw new Error('학교 회원 상세 응답에 member가 없습니다.')
  }
  const user = mapMemberDetailToUser(member, null, {
    fallbackRole: options?.fallbackRole ?? 'SCHOOL',
  })
  const schoolName = detail.organizationName?.trim() || user.schoolInfo?.schoolName || user.name
  const address = [detail.address?.trim(), detail.addressDetail?.trim()].filter(Boolean).join(' ')
  user.role = 'SCHOOL'
  user.schoolInfo = {
    schoolName,
    address,
    ...(detail.position?.trim() ? { position: detail.position.trim() } : {}),
  }
  user.name = schoolName
  return user
}

export function mapInstructorMemberDetailToUser(
  detail: InstructorMemberDetailResponse,
  options?: { fallbackRole?: User['role'] }
): Omit<User, 'password'> {
  const member = detail.member
  if (!member) {
    throw new Error('강사 회원 상세 응답에 member가 없습니다.')
  }
  const profile = detail.instructorProfile ?? null
  const user = mapMemberDetailToUser(member, profile, {
    fallbackRole: options?.fallbackRole ?? 'INSTRUCTOR',
  })
  user.role = 'INSTRUCTOR'
  if (!user.instructorInfo) {
    user.instructorInfo = {
      bankName: detail.bankName?.trim() ?? '',
      accountNumber: detail.accountNumber?.trim() ?? '',
      accountHolder: detail.accountHolder?.trim() ?? member.name?.trim() ?? '',
      isBusinessIncome: Boolean(profile?.businessIncomeYn),
    }
  } else {
    if (detail.bankName?.trim()) user.instructorInfo.bankName = detail.bankName.trim()
    if (detail.accountNumber?.trim()) {
      user.instructorInfo.accountNumber = detail.accountNumber.trim()
    }
    if (detail.accountHolder?.trim()) {
      user.instructorInfo.accountHolder = detail.accountHolder.trim()
    }
  }
  return user
}
