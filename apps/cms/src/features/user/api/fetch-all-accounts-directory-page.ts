import type { User } from '@/types/user'
import type { AllTabRoleFilterValue } from '@/features/user/api/map-roles-exact-any-of'
import { mapAccountDirectoryItems } from '@/features/user/api/map-account-directory-item-to-user'
import {
  fetchAllCmsMembersAndAdminsPageRemote,
  type FetchAllCmsMembersAndAdminsParams,
} from '@/features/user/api/members-api-client'
import { matchesAllTabRoleFilter } from '@/features/user/shared/lib/member-list-display'

export type DirectoryPageResult = {
  users: Omit<User, 'password'>[]
  total: number
  hasMore: boolean
}

function directoryHasMore(
  page: number,
  pageSize: number,
  itemCount: number,
  totalPages: number | undefined
): boolean {
  if (totalPages != null && totalPages > 0) return page + 1 < totalPages
  return itemCount >= pageSize
}

function directoryExhausted(
  sourcePage: number,
  itemCount: number,
  pageSize: number,
  totalPages: number | undefined
): boolean {
  if (totalPages != null && totalPages > 0) return sourcePage + 1 >= totalPages
  return itemCount < pageSize
}

/**
 * `GET /api/admin/members/all` — OpenAPI에 회원 유형(role) 필터가 없어
 * 개인·강사·학교(교사) 등은 accountType 후 목록 유형 열과 같은 기준으로 클라이언트 매칭한다.
 */
export async function fetchAllAccountsDirectoryPage(
  params: {
    search?: string
    createdAtFrom?: string
    createdAtTo?: string
    accountType?: 'MEMBER' | 'ADMIN_ACCOUNT'
    allTabRoleFilter?: AllTabRoleFilterValue | 'ALL'
  },
  page: number,
  pageSize: number
): Promise<DirectoryPageResult> {
  const roleFilter = params.allTabRoleFilter ?? 'ALL'
  const baseParams: FetchAllCmsMembersAndAdminsParams = {
    keyword: params.search?.trim() || undefined,
    accountType: params.accountType,
  }

  const needsClientRoleScan = roleFilter !== 'ALL' && roleFilter !== 'ADMIN'

  if (!needsClientRoleScan) {
    const res = await fetchAllCmsMembersAndAdminsPageRemote({
      ...baseParams,
      page,
      size: pageSize,
    })
    let users = mapAccountDirectoryItems(res.items)
    if (roleFilter === 'ADMIN') {
      users = users.filter(user => matchesAllTabRoleFilter(user, 'ADMIN'))
    }
    const total = res.totalElements ?? users.length
    return {
      users,
      total,
      hasMore: directoryHasMore(page, pageSize, res.items?.length ?? users.length, res.totalPages),
    }
  }

  const targetOffset = page * pageSize
  const matched: Omit<User, 'password'>[] = []
  let sourcePage = 0
  let exhausted = false
  const maxSourcePages = 200

  while (!exhausted && matched.length < targetOffset + pageSize && sourcePage < maxSourcePages) {
    const res = await fetchAllCmsMembersAndAdminsPageRemote({
      ...baseParams,
      page: sourcePage,
      size: pageSize,
    })
    matched.push(
      ...mapAccountDirectoryItems(res.items).filter(user =>
        matchesAllTabRoleFilter(user, roleFilter)
      )
    )
    exhausted = directoryExhausted(sourcePage, res.items?.length ?? 0, pageSize, res.totalPages)
    sourcePage += 1
  }

  const users = matched.slice(targetOffset, targetOffset + pageSize)
  const hasMore = exhausted ? targetOffset + users.length < matched.length : true
  const total = exhausted ? matched.length : Math.max(matched.length, targetOffset + users.length)

  return { users, total, hasMore }
}
