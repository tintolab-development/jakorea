import type { InstructorRoleRequestDetailResponse } from '@/shared/api/generated/members/schemas/instructorRoleRequestDetailResponse'
import type { TermsAgreement } from '@/shared/api/generated/members/schemas/termsAgreement'
import type { TermsAgreementRow } from '@/shared/api/generated/members/schemas/termsAgreementRow'
import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'
import {
  normalizeInstructorCmsProfileFromApi,
  normalizeInstructorCmsSettlementFromApi,
} from '@/features/user/api/map-instructor-cms-profile'
import { toInstructorFeeGradeDisplayLabel } from '@/features/user/api/map-instructor-activity-display'
import { mapInstructorRoleRequestStatusToApplicationStatus } from '@/features/user/api/lib/map-permission-approval-status'
import { toApiBirthDate, toDisplayGender } from '@/features/user/api/map-member-gender-birth'
import type { User } from '@/types/user'

function mapTermsAgreements(rows: TermsAgreement[] | undefined): TermsAgreementRow[] | undefined {
  if (!rows?.length) return undefined
  return rows.map(row => ({
    termsType: row.termsType?.trim() || undefined,
    termsVersion: row.version?.trim() || undefined,
    required: row.required,
    agreed: row.agreed,
    agreedAt: row.agreedAt,
  }))
}

function mapSocialProviders(
  accounts: InstructorRoleRequestDetailResponse['socialAccounts']
): string[] | undefined {
  const providers = accounts
    ?.filter(a => (a.status ?? 'CONNECTED').toUpperCase() === 'CONNECTED')
    .map(a => a.provider?.trim())
    .filter((value): value is string => Boolean(value))
  return providers?.length ? providers : undefined
}

/** `GET /api/admin/instructor-role-requests/{requestId}` → 권한 승인 상세 User */
export function mapInstructorRoleRequestDetailToUser(
  detail: InstructorRoleRequestDetailResponse,
  options?: { fallbackId?: string }
): Omit<User, 'password'> {
  const requestId = detail.requestId
  const memberId = detail.memberId
  const uuid =
    options?.fallbackId?.trim() ||
    (memberId != null ? `member-${memberId}` : `instructor-role-request-${requestId ?? 'unknown'}`)

  if (memberId != null) {
    registerMemberIdMapping(uuid, memberId)
  }

  const now = new Date().toISOString()
  const appliedAt = detail.requestedAt ?? now
  const joinedAt = detail.joinedAt?.trim()
  const cmsProfile = normalizeInstructorCmsProfileFromApi(detail.profile)
  const cmsSettlement = normalizeInstructorCmsSettlementFromApi(detail.settlement)
  const termsAgreements = mapTermsAgreements(detail.termsAgreements)
  const birthDate = toApiBirthDate(detail.birthDate)
  const genderDisplay = toDisplayGender(detail.gender)
  const socialAccounts = mapSocialProviders(detail.socialAccounts)

  const feeGradeLabel = cmsProfile?.defaultFeeGrade
    ? toInstructorFeeGradeDisplayLabel(cmsProfile.defaultFeeGrade)
    : undefined
  const jaGrade = cmsProfile?.defaultJaGrade?.trim()

  const homeLine = cmsProfile?.homeAddress?.line?.trim()
  const homeDetail = cmsProfile?.homeAddress?.detail?.trim()

  const permissionNotificationResentAt = detail.notificationResentAt ?? undefined
  const permissionApprovalHandledAt = detail.decidedAt ?? undefined
  const permissionApprovalStatus = mapInstructorRoleRequestStatusToApplicationStatus(detail.status)

  return {
    id: uuid,
    memberId,
    instructorRoleRequestId: requestId,
    email: String(detail.email ?? '').trim() || '-',
    name: String(detail.name ?? '').trim() || '-',
    phone: detail.phone?.trim() || undefined,
    role: 'INSTRUCTOR',
    gender: genderDisplay === '-' ? undefined : genderDisplay,
    birthDate: birthDate ?? detail.birthDate ?? undefined,
    isActive: true,
    permissionApprovalStatus,
    permissionApprovalHandledAt,
    permissionNotificationResentAt,
    createdAt: joinedAt || appliedAt,
    updatedAt: detail.decidedAt ?? joinedAt ?? appliedAt,
    instructorMemberProfile:
      cmsProfile?.memberType === 'SCHOOL_TEACHER' ? 'school_teacher' : 'instructor_only',
    listMetrics: {
      permissionApplicationTypeLabel: detail.requestedActivityType?.trim() || undefined,
      ...(feeGradeLabel ? { instructorFeeGradeLabel: feeGradeLabel } : {}),
      ...(jaGrade ? { jaEvaluationGrade: jaGrade } : {}),
    },
    ...(socialAccounts ? { socialAccounts } : {}),
    ...(cmsProfile?.oneLineIntro?.trim() ? { bio: cmsProfile.oneLineIntro.trim() } : {}),
    ...(homeLine ? { detailAddress: homeLine } : {}),
    ...(homeDetail ? { detailAddressDetail: homeDetail } : {}),
    ...(cmsProfile ? { instructorCmsProfile: cmsProfile } : {}),
    ...(cmsSettlement
      ? {
          instructorCmsSettlement: cmsSettlement,
          instructorInfo: {
            bankName: cmsSettlement.bankName?.trim() ?? '',
            accountNumber: cmsSettlement.accountNumber?.trim() ?? '',
            accountHolder: cmsSettlement.accountHolder?.trim() ?? '',
            isBusinessIncome: Boolean(cmsSettlement.businessIncome),
          },
        }
      : {}),
    ...(cmsProfile?.instructorCareerSummary?.trim()
      ? { instructorCareerText: cmsProfile.instructorCareerSummary.trim() }
      : {}),
    ...(cmsProfile?.essays?.freeWrite1?.trim()
      ? { instructorSelfIntroduction: cmsProfile.essays.freeWrite1.trim() }
      : {}),
    ...(termsAgreements ? { termsAgreements } : {}),
  }
}
