import type { InstructorDetailResponse } from '@/shared/api/generated/members/schemas'
import type { MemberDetailResponse } from '@/shared/api/generated/members/schemas'
import type { User } from '@/types/user'
import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'
import {
  mapMemberStatusToIsActive,
  resolvePrimaryUserRole,
} from '@/features/user/api/map-member-role'

function fallbackUuid(memberId?: number): string {
  if (memberId != null) return `member-${memberId}`
  return `member-unknown-${crypto.randomUUID()}`
}

export function mapMemberDetailToUser(
  detail: MemberDetailResponse,
  instructorProfile?: InstructorDetailResponse | null
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

  const role = resolvePrimaryUserRole(detail.roles)
  const now = new Date().toISOString()

  const user: Omit<User, 'password'> = {
    id: uuid,
    memberId,
    email: String(detail.email ?? '').trim() || '-',
    name: String(detail.name ?? '').trim() || '-',
    phone: detail.phone?.trim() || undefined,
    role,
    gender: detail.gender?.trim() || undefined,
    birthDate: detail.birthDate ?? undefined,
    isActive: mapMemberStatusToIsActive(undefined, detail.status),
    createdAt: detail.createdAt ?? now,
    updatedAt: detail.updatedAt ?? now,
    registeredByAdmin: Boolean(detail.preRegistered),
    id1365: detail.external1365Id?.trim() || undefined,
    identitySelfSignupCompletedAfterAdminRegistration: detail.identityVerified === true,
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
