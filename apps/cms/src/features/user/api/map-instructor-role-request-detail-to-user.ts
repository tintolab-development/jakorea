import type { InstructorRoleRequestDetailResponse } from '@/shared/api/generated/members/schemas/instructorRoleRequestDetailResponse'
import type { TermsAgreement } from '@/shared/api/generated/members/schemas/termsAgreement'
import type { TermsAgreementRow } from '@/shared/api/generated/members/schemas/termsAgreementRow'
import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'
import {
  normalizeInstructorCmsProfileFromApi,
  normalizeInstructorCmsSettlementFromApi,
} from '@/features/user/api/map-instructor-cms-profile'
import {
  toEmploymentStatusDisplayLabel,
  toInstructorActivityTypeLabel,
  toInstructorFeeGradeDisplayLabel,
} from '@/features/user/api/map-instructor-activity-display'
import { mapInstructorRoleRequestStatusToApplicationStatus } from '@/features/user/api/lib/map-permission-approval-status'
import { applyScheduleChangeCancelCountToUser } from '@/features/user/api/resolve-schedule-change-cancel-count'
import {
  parseApprovalNotificationCase,
  parseApprovalNotificationState,
} from '@/features/user/api/lib/approval-notification-case'
import { toApiBirthDate, toDisplayGender } from '@/features/user/api/map-member-gender-birth'
import type { User } from '@/types/user'

function mapTermsAgreements(rows: TermsAgreement[] | undefined): TermsAgreementRow[] | undefined {
  if (!rows?.length) return undefined
  return rows.map(row => {
    const mapped: TermsAgreementRow & { consentRecordId?: number } = {
      termsType: row.termsType?.trim() || undefined,
      termsVersion: row.version?.trim() || undefined,
      required: row.required,
      agreed: row.agreed,
      ...(row.agreedAt?.trim() ? { agreedAt: row.agreedAt.trim() } : {}),
    }
    if (typeof row.consentRecordId === 'number' && Number.isFinite(row.consentRecordId)) {
      mapped.consentRecordId = row.consentRecordId
    }
    return mapped
  })
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
  const cmsProfile = normalizeInstructorCmsProfileFromApi(detail.profile)
  const cmsSettlement = normalizeInstructorCmsSettlementFromApi(detail.settlement)
  const termsAgreements = mapTermsAgreements(detail.termsAgreements)
  const birthDate = toApiBirthDate(detail.birthDate)
  const genderDisplay = toDisplayGender(detail.gender)

  const feeGradeLabel = cmsProfile?.defaultFeeGrade
    ? toInstructorFeeGradeDisplayLabel(cmsProfile.defaultFeeGrade)
    : undefined
  const jaGrade = cmsProfile?.defaultJaGrade?.trim()

  const homeLine = cmsProfile?.homeAddress?.line?.trim()
  const homeDetail = cmsProfile?.homeAddress?.detail?.trim()

  const permissionApprovalHandledAt = detail.decidedAt ?? undefined
  const permissionApprovalStatus = mapInstructorRoleRequestStatusToApplicationStatus(detail.status)
  const requestStatusUpper = (detail.status ?? '').trim().toUpperCase()
  const instructorApprovalStatus = requestStatusUpper === 'REVOKED' ? 'REVOKED' : undefined
  const approvalNotificationCase = parseApprovalNotificationCase(detail.approvalNotificationCase)
  const approvalNotificationState = parseApprovalNotificationState(detail.approvalNotificationState)
  const isSchoolTeacherApplicant = cmsProfile?.memberType === 'SCHOOL_TEACHER'
  const employmentStatusLabel = toEmploymentStatusDisplayLabel(
    cmsProfile?.affiliation?.employmentStatus
  )

  return applyScheduleChangeCancelCountToUser(
    {
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
    ...(instructorApprovalStatus ? { instructorApprovalStatus } : {}),
    ...(approvalNotificationCase != null ? { approvalNotificationCase } : {}),
    ...(approvalNotificationState != null ? { approvalNotificationState } : {}),
    ...(detail.approvalNotificationScheduledAt !== undefined
      ? { approvalNotificationScheduledAt: detail.approvalNotificationScheduledAt }
      : {}),
    ...(detail.approvalNotificationSentAt !== undefined
      ? { approvalNotificationSentAt: detail.approvalNotificationSentAt }
      : {}),
    createdAt: appliedAt,
    updatedAt: detail.decidedAt ?? appliedAt,
    instructorMemberProfile: isSchoolTeacherApplicant ? 'instructor_dual' : 'instructor_only',
    listMetrics: {
      permissionApplicationTypeLabel: toInstructorActivityTypeLabel(detail.requestedActivityType),
      ...(feeGradeLabel ? { instructorFeeGradeLabel: feeGradeLabel } : {}),
      ...(jaGrade ? { jaEvaluationGrade: jaGrade } : {}),
      ...(employmentStatusLabel ? { employmentStatusLabel } : {}),
    },
    ...(cmsProfile?.oneLineIntro?.trim() ? { bio: cmsProfile.oneLineIntro.trim() } : {}),
    ...(homeLine ? { detailAddress: homeLine } : {}),
    ...(homeDetail ? { detailAddressDetail: homeDetail } : {}),
    ...(cmsProfile ? { instructorCmsProfile: cmsProfile } : {}),
    ...(cmsSettlement
      ? {
          instructorCmsSettlement: cmsSettlement,
          instructorInfo: {
            ...(cmsSettlement.bankName?.trim() ? { bankName: cmsSettlement.bankName.trim() } : {}),
            ...(cmsSettlement.accountNumber?.trim()
              ? { accountNumber: cmsSettlement.accountNumber.trim() }
              : {}),
            ...(cmsSettlement.accountHolder?.trim()
              ? { accountHolder: cmsSettlement.accountHolder.trim() }
              : {}),
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
    },
    detail
  )
}
