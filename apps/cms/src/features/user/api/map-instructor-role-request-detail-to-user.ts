import type { InstructorRoleRequestDetailResponse } from '@/shared/api/generated/members/schemas/instructorRoleRequestDetailResponse'
import type { TermsAgreement } from '@/shared/api/generated/members/schemas/termsAgreement'
import type { TermsAgreementRow } from '@/shared/api/generated/members/schemas/termsAgreementRow'
import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'
import {
  normalizeInstructorCmsProfileFromApi,
  normalizeInstructorCmsSettlementFromApi,
} from '@/features/user/api/map-instructor-cms-profile'
import { toApiBirthDate, toDisplayGender } from '@/features/user/api/map-member-gender-birth'
import type { User } from '@/types/user'

function mapTermsAgreements(rows: TermsAgreement[] | undefined): TermsAgreementRow[] | undefined {
  if (!rows?.length) return undefined
  return rows.map(row => ({
    termsType: row.termsType?.trim() || undefined,
    termsVersion: row.version?.trim() || undefined,
    required: row.required,
    agreed: row.agreed,
  }))
}

function mapApprovalStatus(
  status: string | undefined
): User['permissionApprovalStatus'] | undefined {
  const upper = status?.trim().toUpperCase()
  if (upper === 'PENDING' || upper === 'APPROVED' || upper === 'REJECTED') return upper
  return undefined
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

  const homeLine = cmsProfile?.homeAddress?.line?.trim()
  const homeDetail = cmsProfile?.homeAddress?.detail?.trim()

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
    permissionApprovalStatus: mapApprovalStatus(detail.status),
    permissionApprovalHandledAt: detail.decidedAt ?? undefined,
    createdAt: appliedAt,
    updatedAt: detail.decidedAt ?? appliedAt,
    instructorMemberProfile:
      cmsProfile?.memberType === 'SCHOOL_TEACHER' ? 'school_teacher' : 'instructor_only',
    listMetrics: {
      permissionApplicationTypeLabel: detail.requestedActivityType?.trim() || undefined,
    },
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
