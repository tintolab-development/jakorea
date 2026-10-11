import { getUsersPage, type GetUsersPageParams } from '@/entities/user/api/user-service'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import type { User } from '@/types/user'

const DEFAULT_MAX_PAGES = 50

/**
 * `listMembers` 페이지를 순회해 전체 회원을 모은다. mock `getUsers` 대체용.
 */
export async function fetchAllMembersPagesRemote(
  filters: GetUsersPageParams,
  maxPages = DEFAULT_MAX_PAGES
): Promise<Omit<User, 'password'>[]> {
  if (!isMembersRemoteEnabled()) {
    throw new Error('회원 목록은 실 API만 지원합니다. VITE_API_SERVER 또는 VITE_API_BASE_URL을 설정하세요.')
  }

  const users: Omit<User, 'password'>[] = []
  let page = 0
  let hasMore = true

  while (hasMore && page < maxPages) {
    const result = await getUsersPage(filters, page)
    users.push(...result.users)
    hasMore = result.hasMore
    page += 1
  }

  return users
}
