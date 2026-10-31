import { AccountDirectoryItemResponseAccountType } from '@/shared/api/generated/members/schemas/accountDirectoryItemResponseAccountType'
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

/**
 * 전체 탭 혼합 삭제 대상.
 * 생성 스키마 `Target`은 신청 일괄 승인 항목과 이름이 겹치므로, 삭제 응답 `TargetResult`와 같은 accountType·id를 쓴다.
 */
export type AccountDirectoryBulkDeleteTarget = {
  accountType: AccountDirectoryItemResponseAccountType
  id: number
}

/** 전체 탭 혼합 삭제 — typed targets */
export function toAccountDirectoryBulkDeleteTargets(
  users: Omit<User, 'password'>[]
): AccountDirectoryBulkDeleteTarget[] {
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
