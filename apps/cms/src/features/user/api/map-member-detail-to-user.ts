import type { InstructorDetailResponse } from '@/shared/api/generated/members/schemas'
import type { MemberDetailResponse } from '@/shared/api/generated/members/schemas'
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
    user.instructorInfo = {
      bankName: '',
      accountNumber: '',
      accountHolder: detail.name?.trim() ?? '',
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

  return user
}
