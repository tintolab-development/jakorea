import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { GetUsersPageResult } from '@/entities/user/api/user-service'
import { parseAdminAccountIdFromUserId } from '@/features/user/api/fetch-admin-member-detail'
import { getMemberIdByUuid, registerMemberIdMapping } from '@/features/user/api/member-id-registry'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import { parseOrganizationIdFromUserId } from '@/features/user/api/map-school-organization-to-user'
import type { MemberDetailUrlContext } from '@/features/user/detail/lib/teacher-detail-url-context'
import {
  memberListKindToUserRole,
  type MemberListKind,
} from '@/shared/config/member-list-kinds'
import type { User, UserRole } from '@/types/user'

export type MemberDetailRestoreHint = {
  memberId?: number
  organizationId?: number
  role?: UserRole
  email?: string
  adminAccountId?: number
  user?: Omit<User, 'password'>
}

const MEMBER_ID_PREFIX = /^member-(\d+)$/i

export function parseMemberIdFromUserId(userId: string): number | undefined {
  const trimmed = userId.trim()
  const prefixed = trimmed.match(MEMBER_ID_PREFIX)
  if (prefixed) return Number(prefixed[1])
  if (/^\d+$/.test(trimmed)) return Number(trimmed)
  return undefined
}

export function findUserInMemberListQueries(
  queryClient: QueryClient,
  userId: string
): Omit<User, 'password'> | undefined {
  const queries = [
    ...queryClient.getQueriesData<InfiniteData<GetUsersPageResult>>({
      queryKey: [...memberQueryKeys.all, 'list'],
    }),
    ...queryClient.getQueriesData<InfiniteData<GetUsersPageResult>>({
      queryKey: [...memberQueryKeys.all, 'schoolsList'],
    }),
  ]

  for (const [, data] of queries) {
    if (!data?.pages) continue
    for (const page of data.pages) {
      const found = page.users.find(user => user.id === userId)
      if (found) return found
    }
  }

  return undefined
}

export function resolveMemberDetailRestoreHint(options: {
  userId: string
  urlCtx: MemberDetailUrlContext
  listKind: MemberListKind
  storeUsersById: Record<string, Omit<User, 'password'>>
  listUsers: Omit<User, 'password'>[]
  queryClient?: QueryClient
}): MemberDetailRestoreHint {
  const { userId, urlCtx, listKind, storeUsersById, listUsers, queryClient } = options
  const fromStore = storeUsersById[userId]
  const fromList = listUsers.find(user => user.id === userId)
  const fromCache =
    queryClient && !fromStore && !fromList
      ? findUserInMemberListQueries(queryClient, userId)
      : undefined

  const user = fromStore ?? fromList ?? fromCache
  const organizationId =
    user?.organizationId ?? parseOrganizationIdFromUserId(userId) ?? undefined
  const adminAccountId = user?.adminAccountId ?? parseAdminAccountIdFromUserId(userId)
  const memberId =
    urlCtx.memberId ??
    user?.memberId ??
    getMemberIdByUuid(userId) ??
    parseMemberIdFromUserId(userId)

  if (user?.memberId != null) {
    registerMemberIdMapping(userId, user.memberId)
  }

  const role =
    user?.role ??
    urlCtx.role ??
    (urlCtx.instructorMemberProfile != null ? ('INSTRUCTOR' as const) : undefined) ??
    (organizationId != null ? ('SCHOOL' as const) : undefined) ??
    memberListKindToUserRole(listKind)

  return {
    memberId,
    organizationId,
    role,
    email: user?.email,
    adminAccountId,
    user,
  }
}

export type MemberDetailOpenIdentity = {
  ids?: readonly string[]
  memberId?: number
  organizationId?: number
  adminAccountId?: number
}

export function memberDetailOpenIdentityFromUser(
  user: Pick<User, 'id' | 'memberId' | 'organizationId' | 'adminAccountId'>
): MemberDetailOpenIdentity {
  return {
    ids: [user.id],
    memberId: user.memberId,
    organizationId: user.organizationId,
    adminAccountId: user.adminAccountId,
  }
}

/**
 * 목록 uuid와 canonical `admin-account-{id}` / `organization-{id}`가
 * 같은 회원 상세를 가리키면 true — URL 복원 effect의 재GET 방지.
 */
export function isSameMemberDetailIdentity(
  open: MemberDetailOpenIdentity | null | undefined,
  targetId: string,
  hint: Pick<MemberDetailRestoreHint, 'memberId' | 'organizationId' | 'adminAccountId'>
): boolean {
  if (!open) return false
  const trimmed = targetId.trim()
  if (!trimmed) return false
  if (open.ids?.some(id => id === trimmed)) return true

  const targetAdmin = hint.adminAccountId ?? parseAdminAccountIdFromUserId(trimmed)
  if (targetAdmin != null && open.adminAccountId != null && targetAdmin === open.adminAccountId) {
    return true
  }

  const targetOrg = hint.organizationId ?? parseOrganizationIdFromUserId(trimmed)
  if (targetOrg != null && open.organizationId != null && targetOrg === open.organizationId) {
    return true
  }

  const targetMember = hint.memberId ?? parseMemberIdFromUserId(trimmed)
  if (targetMember != null && open.memberId != null && targetMember === open.memberId) {
    return true
  }

  return false
}

export function canResolveMemberIdForDetailRestore(
  userId: string,
  hint: Pick<
    MemberDetailRestoreHint,
    'memberId' | 'organizationId' | 'role' | 'adminAccountId'
  >
): boolean {
  if (hint.organizationId != null || parseOrganizationIdFromUserId(userId) != null) {
    return true
  }
  if (hint.adminAccountId != null && hint.adminAccountId > 0) {
    return true
  }
  if (parseAdminAccountIdFromUserId(userId) != null) {
    return true
  }
  if (hint.role === 'SCHOOL' && hint.organizationId != null) return true
  return hint.memberId != null || parseMemberIdFromUserId(userId) != null
}
