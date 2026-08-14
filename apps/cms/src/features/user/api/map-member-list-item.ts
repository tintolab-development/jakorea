import type { ProgramRole, User, UserRole } from '@/types/user'
import { parseAdminAccountIdFromUserId } from '@/features/user/api/fetch-admin-member-detail'
import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'
import {
  coercePositiveInt,
  isUserResponseDisplayRowId,
} from '@/features/user/api/user-response-row-id'
import {
  mapMemberStatusToIsActive,
  memberRolesIncludeSchool,
  resolvePrimaryUserRoleFromRoles,
  copyMemberRoles,
  inferInstructorMemberProfileFromRoles,
} from '@/features/user/api/map-member-role'
import { mapApiUserListRowMetrics } from '@/features/user/api/map-user-list-row-metrics'
import {
  isMemberListItemResponse,
  type MemberListItemResponse,
} from '@/features/user/api/types/member-list-item'
import { normalizeRevokedInstructorUser } from '@/features/user/shared/lib/apply-instructor-permission-revoked'
import {
  resolveIdentitySelfSignupCompletedAfterAdminRegistration,
  resolveRegisteredByAdmin,
} from '@/features/user/api/resolve-member-registration-flags'
import { parseMemberIdFromUserId } from '@/features/user/detail/lib/resolve-member-detail-restore-hint'

function fallbackUuid(memberId?: number): string {
  if (memberId != null) return `member-${memberId}`
  return `member-unknown-${crypto.randomUUID()}`
}

function resolveListItemUuid(
  item: MemberListItemResponse,
  memberId?: number,
  adminAccountId?: number
): string {
  const uuid = typeof item.uuid === 'string' ? item.uuid.trim() : ''
  if (uuid && !isUserResponseDisplayRowId(uuid)) return uuid

  if (adminAccountId != null) return `admin-account-${adminAccountId}`
  if (memberId != null) return `member-${memberId}`

  const id = typeof item.id === 'string' ? item.id.trim() : ''
  if (id && !isUserResponseDisplayRowId(id)) return id

  return fallbackUuid(memberId)
}

function mapProgramRoles(raw?: Record<string, string>): Record<string, ProgramRole> | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const mapped: Record<string, ProgramRole> = {}
  for (const [programId, role] of Object.entries(raw)) {
    const upper = role.trim().toUpperCase()
    if (upper === 'OWNER' || upper === 'PARTNER' || upper === 'ASSISTANT') {
      mapped[programId] = upper
    }
  }
  return Object.keys(mapped).length > 0 ? mapped : undefined
}

function resolveListItemIsActive(item: MemberListItemResponse): boolean {
  if (typeof item.isActive === 'boolean') return item.isActive
  if (item.loginEnabled === false) return false
  return mapMemberStatusToIsActive(item.memberStatus, item.status)
}

function resolveListItemRole(item: MemberListItemResponse): UserRole {
  const role = resolvePrimaryUserRoleFromRoles(item.roles)
  if (role === 'ADMIN') return role
  if (item.adminAccountId != null && item.adminAccountId > 0) return 'ADMIN'
  if (item.adminId != null && item.adminId > 0) return 'ADMIN'
  if (typeof item.adminLevel === 'string' && item.adminLevel.trim()) return 'ADMIN'
  return role
}

function resolveListItemMemberId(item: MemberListItemResponse): number | undefined {
  const fromField = coercePositiveInt(item.memberId)
  if (fromField != null) return fromField

  const listItemId = typeof item.id === 'string' ? item.id.trim() : ''
  const fromListItemId = parseMemberIdFromUserId(listItemId)
  if (fromListItemId != null) return fromListItemId

  const uuid = typeof item.uuid === 'string' ? item.uuid.trim() : ''
  return parseMemberIdFromUserId(uuid)
}

function resolveListItemAdminAccountId(
  item: MemberListItemResponse,
  role: UserRole
): number | undefined {
  const fromAdminAccountId = coercePositiveInt(item.adminAccountId)
  if (fromAdminAccountId != null) return fromAdminAccountId

  const fromAdminId = coercePositiveInt(item.adminId)
  if (fromAdminId != null) return fromAdminId

  if (role !== 'ADMIN') return undefined

  for (const token of [item.uuid, item.id]) {
    if (typeof token !== 'string') continue
    const trimmed = token.trim()
    if (!trimmed || isUserResponseDisplayRowId(trimmed)) continue
    const fromAdminAccountPrefix = parseAdminAccountIdFromUserId(trimmed)
    if (fromAdminAccountPrefix != null) return fromAdminAccountPrefix
  }
  return undefined
}

export function mapMemberListItemToUser(item: MemberListItemResponse): Omit<User, 'password'> {
  const memberId = resolveListItemMemberId(item)
  const role = resolveListItemRole(item)
  const adminAccountId = resolveListItemAdminAccountId(item, role)
  const uuid = resolveListItemUuid(item, memberId, adminAccountId)
  if (memberId != null) {
    registerMemberIdMapping(uuid, memberId)
  }
  const listItemId = typeof item.id === 'string' ? item.id.trim() : ''
  if (listItemId && listItemId !== uuid && memberId != null) {
    registerMemberIdMapping(listItemId, memberId)
  }

  const now = new Date().toISOString()
  const listMetrics = mapApiUserListRowMetrics(item.listMetrics)
  const instructorMemberProfile = inferInstructorMemberProfileFromRoles(item.roles)
  const programRoles = mapProgramRoles(item.programRoles)
  const roles = copyMemberRoles(item.roles)

  const user: Omit<User, 'password'> = {
    id: uuid,
    memberId,
    email: String(item.email ?? '').trim() || '-',
    name: String(item.name ?? item.organizationName ?? item.organizationText ?? '').trim() || '-',
    phone: item.phone?.trim() || undefined,
    role,
    ...(roles ? { roles } : {}),
    isActive: resolveListItemIsActive(item),
    createdAt: item.createdAt ?? now,
    updatedAt: item.updatedAt ?? now,
    registeredByAdmin: resolveRegisteredByAdmin({
      role,
      registeredByAdmin: item.registeredByAdmin,
      preRegistered: item.preRegistered,
      createdByAdmin: item.createdByAdmin,
      adminAccountId,
    }),
    identitySelfSignupCompletedAfterAdminRegistration:
      resolveIdentitySelfSignupCompletedAfterAdminRegistration({
        role,
        registeredByAdmin: item.registeredByAdmin,
        preRegistered: item.preRegistered,
        createdByAdmin: item.createdByAdmin,
        adminAccountId,
        identitySelfSignupCompletedAfterAdminRegistration:
          item.identitySelfSignupCompletedAfterAdminRegistration,
        identityVerified: item.identityVerified,
      }),
    id1365: item.external1365Id?.trim() || undefined,
    ...(adminAccountId != null ? { adminAccountId } : {}),
    ...(item.affiliation?.trim() ? { affiliation: item.affiliation.trim() } : {}),
    ...(item.affiliatedSchoolUserId?.trim()
      ? { affiliatedSchoolUserId: item.affiliatedSchoolUserId.trim() }
      : {}),
    ...(item.affiliatedSchoolName?.trim()
      ? { affiliatedSchoolName: item.affiliatedSchoolName.trim() }
      : {}),
    ...(instructorMemberProfile ? { instructorMemberProfile } : {}),
    ...(typeof item.participationHistory === 'number'
      ? { participationHistory: item.participationHistory }
      : {}),
    ...(programRoles ? { programRoles } : {}),
    ...(listMetrics ? { listMetrics } : {}),
    ...(() => {
      const instructorStatus = item.instructorStatus?.trim()
      if (instructorStatus) return { instructorApprovalStatus: instructorStatus }
      const memberStatus = (item.memberStatus ?? item.status)?.trim().toUpperCase()
      if (memberStatus === 'REVOKED') return { instructorApprovalStatus: 'REVOKED' }
      return {}
    })(),
  }

  if (role === 'SCHOOL') {
    const schoolName = String(
      item.schoolInfo?.schoolName ??
        item.organizationName ??
        item.organizationText ??
        item.name ??
        ''
    ).trim()
    const address =
      item.schoolInfo?.address?.trim() ||
      (typeof item.address === 'string' ? item.address.trim() : '') ||
      ''
    const schoolInfoLoose = item.schoolInfo as
      | (NonNullable<MemberListItemResponse['schoolInfo']> & { addressDetail?: string })
      | undefined
    const addressDetail =
      schoolInfoLoose?.addressDetail?.trim() ||
      (typeof item.addressDetail === 'string' ? item.addressDetail.trim() : '') ||
      undefined
    if (schoolName) {
      user.schoolInfo = {
        schoolName,
        address,
        ...(addressDetail ? { addressDetail } : {}),
        ...(item.schoolInfo?.position?.trim() ? { position: item.schoolInfo.position.trim() } : {}),
      }
      user.name = schoolName
    }
  }

  if (role === 'INSTRUCTOR' && item.instructorInfo) {
    const info = item.instructorInfo
    user.instructorInfo = {
      bankName: info.bankName?.trim() ?? '',
      accountNumber: info.accountNumber?.trim() ?? '',
      accountHolder: info.accountHolder?.trim() ?? user.name,
      isBusinessIncome: Boolean(info.isBusinessIncome),
    }
  }

  return normalizeRevokedInstructorUser(user)
}

/** 학교(교사) 회원 관리 — `roles`에 SCHOOL 포함 항목만 (SCHOOL_TEACHER 토큰은 제외) */
export function filterMemberListItemsForSchoolRole(
  items: unknown[] | undefined
): MemberListItemResponse[] {
  if (!items?.length) return []
  return items.filter(
    (item): item is MemberListItemResponse =>
      isMemberListItemResponse(item) && memberRolesIncludeSchool(item.roles)
  )
}

export function mapMemberListItems(items: unknown[] | undefined): Omit<User, 'password'>[] {
  if (!items?.length) return []
  return items.filter(isMemberListItemResponse).map(mapMemberListItemToUser)
}
