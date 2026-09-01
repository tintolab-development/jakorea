import type { AdminAccountApprovalDetailResponse } from '@/shared/api/generated/members/schemas/adminAccountApprovalDetailResponse'
import type { AdminTermsAgreementResponse } from '@/shared/api/generated/members/schemas/adminTermsAgreementResponse'
import type { TermsAgreementRow } from '@/shared/api/generated/members/schemas/termsAgreementRow'
import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'
import {
  mapAdminAccountStatusToUserApprovalStatus,
} from '@/features/user/api/lib/map-permission-approval-status'
import { roleCodeToAdminPermissionVariant } from '@/features/user/api/admin-approval-role'
import {
  resolveIdentitySelfSignupCompletedAfterAdminRegistration,
  resolveRegisteredByAdmin,
} from '@/features/user/api/resolve-member-registration-flags'
import { toApiBirthDate, toDisplayGender } from '@/features/user/api/map-member-gender-birth'
import { mapMemberStatusToIsActive } from '@/features/user/api/map-member-role'
import { resolveCanonicalUserDetailId } from '@/features/user/api/user-response-row-id'
import type { User } from '@/types/user'

function mapAdminTermsAgreementsToRows(
  rows: AdminTermsAgreementResponse[] | undefined
): TermsAgreementRow[] | undefined {
  if (!rows?.length) return undefined
  return rows.map(row => ({
    termsType: row.termsType?.trim() || row.consentType?.trim() || undefined,
    termsVersion: row.version?.trim() || undefined,
    required: row.required,
    agreed: row.agreed,
    agreedAt: row.agreedAt,
    sourceFlow: row.sourceFlow,
  }))
}

function fallbackUuid(memberId?: number): string {
  if (memberId != null) return `member-${memberId}`
  return `member-unknown-${crypto.randomUUID()}`
}

export function mapAdminAccountDetailToUser(
  detail: AdminAccountApprovalDetailResponse,
  options?: { memberId?: number; fallbackId?: string }
): Omit<User, 'password'> {
  const adminAccountId = detail.adminAccountId
  const memberId = options?.memberId ?? undefined
  const uuid =
    detail.uuid?.trim() ||
    options?.fallbackId?.replace(/^admin-/, '') ||
    (memberId != null ? fallbackUuid(memberId) : adminAccountId != null
      ? `admin-account-${adminAccountId}`
      : fallbackUuid())

  if (memberId != null) {
    registerMemberIdMapping(uuid, memberId)
  }
  if (options?.fallbackId && memberId != null && options.fallbackId !== uuid) {
    registerMemberIdMapping(options.fallbackId, memberId)
  }

  const now = new Date().toISOString()
  const permissionVariant = roleCodeToAdminPermissionVariant(detail.roleCode)
  const role = 'ADMIN' as const
  const normalizedBirthDate = toApiBirthDate(detail.birthDate)
  const termsAgreements = mapAdminTermsAgreementsToRows(detail.termsAgreements)

  const permissionApprovalStatus = mapAdminAccountStatusToUserApprovalStatus(detail.status)
  const permissionApprovalHandledAt = detail.verifiedAt ?? detail.updatedAt ?? undefined
  const permissionNotificationResentAt = detail.notificationResentAt ?? undefined

  return {
    id: resolveCanonicalUserDetailId(
      { id: options?.fallbackId, memberId, adminAccountId: adminAccountId ?? undefined },
      { id: detail.uuid, memberId, adminAccountId: adminAccountId ?? undefined }
    ),
    memberId,
    adminAccountId,
    email: String(detail.email ?? '').trim() || '-',
    name: String(detail.name ?? '').trim() || '-',
    phone: detail.phone?.trim() || undefined,
    role,
    gender: (() => {
      const display = toDisplayGender(detail.gender)
      return display === '-' ? undefined : display
    })(),
    birthDate: normalizedBirthDate ?? detail.birthDate ?? undefined,
    isActive: mapMemberStatusToIsActive(undefined, detail.status),
    createdAt: detail.createdAt ?? now,
    updatedAt: detail.updatedAt ?? now,
    lastLoginAt: detail.lastLoginAt ?? undefined,
    socialAccounts: detail.socialAccounts
      ?.map(account => account.provider?.trim())
      .filter((value): value is string => Boolean(value)),
    registeredByAdmin: resolveRegisteredByAdmin({
      role,
      adminAccountId,
    }),
    identitySelfSignupCompletedAfterAdminRegistration:
      resolveIdentitySelfSignupCompletedAfterAdminRegistration({ role, adminAccountId }),
    permissionApprovalStatus,
    permissionApprovalHandledAt,
    permissionNotificationResentAt,
    listMetrics: permissionVariant ? { adminPermissionVariant: permissionVariant } : undefined,
    ...(termsAgreements ? { termsAgreements } : {}),
  }
}
