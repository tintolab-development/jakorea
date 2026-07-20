import type { InstructorMemberProfile, ProgramRole, User } from '@/types/user'
import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'
import {
  mapMemberStatusToIsActive,
  resolvePrimaryUserRole,
} from '@/features/user/api/map-member-role'
import { mapApiUserListRowMetrics } from '@/features/user/api/map-user-list-row-metrics'
import {
  isMemberListItemResponse,
  type MemberListItemResponse,
} from '@/features/user/api/types/member-list-item'

function fallbackUuid(memberId?: number): string {
  if (memberId != null) return `member-${memberId}`
  return `member-unknown-${crypto.randomUUID()}`
}

function resolveListItemUuid(item: MemberListItemResponse, memberId?: number): string {
  const uuid = typeof item.uuid === 'string' ? item.uuid.trim() : ''
  if (uuid) return uuid
  const id = typeof item.id === 'string' ? item.id.trim() : ''
  if (id) return id
  return memberId != null ? fallbackUuid(memberId) : fallbackUuid()
}

function mapInstructorMemberProfile(raw?: string): InstructorMemberProfile | undefined {
  const v = raw?.trim()
  if (v === 'school_teacher' || v === 'instructor_dual' || v === 'instructor_only') return v
  return undefined
}

function mapProgramRoles(
  raw?: Record<string, string>
): Record<string, ProgramRole> | undefined {
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

export function mapMemberListItemToUser(item: MemberListItemResponse): Omit<User, 'password'> {
  const memberId = typeof item.memberId === 'number' ? item.memberId : undefined
  const uuid = resolveListItemUuid(item, memberId)

  if (memberId != null) {
    registerMemberIdMapping(uuid, memberId)
  }

  const role = resolvePrimaryUserRole(item.roles, item.role)
  const now = new Date().toISOString()
  const listMetrics = mapApiUserListRowMetrics(item.listMetrics)
  const instructorMemberProfile = mapInstructorMemberProfile(item.instructorMemberProfile)
  const programRoles = mapProgramRoles(item.programRoles)

  const user: Omit<User, 'password'> = {
    id: uuid,
    memberId,
    email: String(item.email ?? '').trim() || '-',
    name: String(item.name ?? item.organizationName ?? item.organizationText ?? '').trim() || '-',
    phone: item.phone?.trim() || undefined,
    role,
    isActive: resolveListItemIsActive(item),
    createdAt: item.createdAt ?? now,
    updatedAt: item.updatedAt ?? now,
    registeredByAdmin: Boolean(item.registeredByAdmin ?? item.preRegistered),
    identitySelfSignupCompletedAfterAdminRegistration: Boolean(
      item.identitySelfSignupCompletedAfterAdminRegistration ?? item.identityVerified
    ),
    id1365: item.external1365Id?.trim() || undefined,
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
  }

  if (role === 'SCHOOL') {
    const schoolName = String(
      item.schoolInfo?.schoolName ?? item.organizationName ?? item.organizationText ?? item.name ?? ''
    ).trim()
    if (schoolName) {
      user.schoolInfo = {
        schoolName,
        address: item.schoolInfo?.address?.trim() ?? '',
        ...(item.schoolInfo?.position?.trim()
          ? { position: item.schoolInfo.position.trim() }
          : {}),
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

  return user
}

export function mapMemberListItems(items: unknown[] | undefined): Omit<User, 'password'>[] {
  if (!items?.length) return []
  return items.filter(isMemberListItemResponse).map(mapMemberListItemToUser)
}
