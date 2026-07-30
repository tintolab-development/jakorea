import type { AdminAccountApprovalDetailResponse } from '@/shared/api/generated/members/schemas/adminAccountApprovalDetailResponse'
import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'
import { roleCodeToAdminPermissionVariant } from '@/features/user/api/admin-approval-role'
import {
  resolveIdentitySelfSignupCompletedAfterAdminRegistration,
  resolveRegisteredByAdmin,
} from '@/features/user/api/resolve-member-registration-flags'
import { toDisplayGender } from '@/features/user/api/map-member-gender-birth'
import { mapMemberStatusToIsActive } from '@/features/user/api/map-member-role'
import type { User } from '@/types/user'

function fallbackUuid(memberId?: number): string {
  if (memberId != null) return `member-${memberId}`
  return `member-unknown-${crypto.randomUUID()}`
}

export function mapAdminAccountDetailToUser(
  detail: AdminAccountApprovalDetailResponse,
  options?: { memberId?: number; fallbackId?: string }
): Omit<User, 'password'> {
  const adminAccountId = detail.id
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

  return {
    id: options?.fallbackId?.trim() || uuid,
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
    birthDate: detail.birthDate ?? undefined,
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
    listMetrics: permissionVariant ? { adminPermissionVariant: permissionVariant } : undefined,
  }
}
