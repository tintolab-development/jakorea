import type { User } from '@/types/user'
import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'
import {
  mapMemberStatusToIsActive,
  resolvePrimaryUserRole,
} from '@/features/user/api/map-member-role'
import {
  isMemberListItemResponse,
  type MemberListItemResponse,
} from '@/features/user/api/types/member-list-item'

function fallbackUuid(memberId?: number): string {
  if (memberId != null) return `member-${memberId}`
  return `member-unknown-${crypto.randomUUID()}`
}

export function mapMemberListItemToUser(item: MemberListItemResponse): Omit<User, 'password'> {
  const memberId = typeof item.memberId === 'number' ? item.memberId : undefined
  const uuid =
    typeof item.uuid === 'string' && item.uuid.trim()
      ? item.uuid.trim()
      : memberId != null
        ? fallbackUuid(memberId)
        : fallbackUuid()

  if (memberId != null) {
    registerMemberIdMapping(uuid, memberId)
  }

  const role = resolvePrimaryUserRole(item.roles, item.role)
  const now = new Date().toISOString()

  const user: Omit<User, 'password'> = {
    id: uuid,
    memberId,
    email: String(item.email ?? '').trim() || '-',
    name: String(item.name ?? item.organizationName ?? item.organizationText ?? '').trim() || '-',
    phone: item.phone?.trim() || undefined,
    role,
    isActive: mapMemberStatusToIsActive(item.memberStatus, item.status),
    createdAt: item.createdAt ?? now,
    updatedAt: item.updatedAt ?? now,
    registeredByAdmin: Boolean(item.preRegistered),
    id1365: item.external1365Id?.trim() || undefined,
  }

  if (role === 'SCHOOL') {
    const orgName = String(item.organizationName ?? item.organizationText ?? item.name ?? '').trim()
    if (orgName) {
      user.schoolInfo = { schoolName: orgName, address: '' }
      user.name = orgName
    }
  }

  return user
}

export function mapMemberListItems(items: unknown[] | undefined): Omit<User, 'password'>[] {
  if (!items?.length) return []
  return items.filter(isMemberListItemResponse).map(mapMemberListItemToUser)
}
