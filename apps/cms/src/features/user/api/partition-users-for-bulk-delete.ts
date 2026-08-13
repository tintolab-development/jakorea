import { AccountDirectoryItemResponseAccountType } from '@/shared/api/generated/members/schemas/accountDirectoryItemResponseAccountType'
import type { Target } from '@/shared/api/generated/members/schemas/target'
import { getMemberIdByUuid } from '@/features/user/api/member-id-registry'
import { parseOrganizationIdFromUserId } from '@/features/user/api/map-school-organization-to-user'
import { parseMemberIdFromUserId } from '@/features/user/detail/lib/resolve-member-detail-restore-hint'
import type { User } from '@/types/user'

function resolveMemberId(user: Omit<User, 'password'>): number | undefined {
  return user.memberId ?? getMemberIdByUuid(user.id) ?? parseMemberIdFromUserId(user.id) ?? undefined
}

function resolveOrganizationId(user: Omit<User, 'password'>): number | undefined {
  return user.organizationId ?? parseOrganizationIdFromUserId(user.id)
}

/** 전체 탭 혼합 삭제 — typed targets */
export function toAccountDirectoryBulkDeleteTargets(
  users: Omit<User, 'password'>[]
): Target[] {
  return users.map(user => {
    if (user.role === 'ADMIN' || user.adminAccountId != null) {
      const id = user.adminAccountId
      if (id == null) {
        throw new Error(`관리자 계정 id가 없습니다: ${user.name}`)
      }
      return {
        accountType: AccountDirectoryItemResponseAccountType.ADMIN_ACCOUNT,
        id,
      }
    }
    const id = resolveMemberId(user)
    if (id == null) {
      throw new Error(`회원 id가 없습니다: ${user.name}`)
    }
    return {
      accountType: AccountDirectoryItemResponseAccountType.MEMBER,
      id,
    }
  })
}

export function collectAdminAccountIds(users: Omit<User, 'password'>[]): number[] {
  return users.map(user => {
    if (user.adminAccountId == null) {
      throw new Error(`관리자 계정 id가 없습니다: ${user.name}`)
    }
    return user.adminAccountId
  })
}

export function collectMemberIds(users: Omit<User, 'password'>[]): number[] {
  return users.map(user => {
    const id = resolveMemberId(user)
    if (id == null) {
      throw new Error(`회원 id가 없습니다: ${user.name}`)
    }
    return id
  })
}

export function collectOrganizationIds(users: Omit<User, 'password'>[]): number[] {
  return users.map(user => {
    const id = resolveOrganizationId(user)
    if (id == null) {
      throw new Error(`학교 organization id가 없습니다: ${user.name}`)
    }
    return id
  })
}
