/**
 * 프로그램 게시글 — 현재 로그인 사용자가 작성한 글인지 판별
 * (목록·상세 ⋮ 수정/삭제 노출용)
 */

import type { ProgramPost } from '@/types/domain'
import type { User } from '@/types/user'

const CMS_SYSTEM_AUTHOR_NAMES = new Set(['JA KOREA 알림', 'JA Korea 알림'])

function resolveViewerActorIds(user: Pick<User, 'id' | 'memberId' | 'adminAccountId'>): number[] {
  const ids: number[] = []
  if (typeof user.adminAccountId === 'number' && Number.isFinite(user.adminAccountId)) {
    ids.push(user.adminAccountId)
  }
  if (typeof user.memberId === 'number' && Number.isFinite(user.memberId)) {
    ids.push(user.memberId)
  }
  const fromUuid = Number(String(user.id).replace(/\D/g, ''))
  if (Number.isFinite(fromUuid) && fromUuid > 0) ids.push(fromUuid)
  return [...new Set(ids)]
}

/**
 * 본인 작성글이면 true.
 * 1) createdByActorId ↔ adminAccountId / memberId
 * 2) authorUserId ↔ user.id
 * 3) authorName ↔ user.name
 * 4) CMS 관리자 + 「JA KOREA 알림」표시 공지(temp/mock·CMS actor)
 */
export function isOwnProgramPost(
  post: Pick<
    ProgramPost,
    'id' | 'authorName' | 'authorUserId' | 'createdByActorId' | 'createdByActorType'
  >,
  user: Pick<User, 'id' | 'name' | 'role' | 'memberId' | 'adminAccountId'> | null | undefined
): boolean {
  if (!user) return false

  if (post.createdByActorId != null && Number.isFinite(post.createdByActorId)) {
    return resolveViewerActorIds(user).includes(post.createdByActorId)
  }

  if (post.authorUserId && post.authorUserId === user.id) return true

  const authorName = post.authorName?.trim() ?? ''
  if (authorName && authorName === user.name?.trim()) return true

  if (user.role !== 'ADMIN' || !CMS_SYSTEM_AUTHOR_NAMES.has(authorName)) {
    return false
  }

  const actor = (post.createdByActorType ?? '').trim().toUpperCase()
  const isTemp = String(post.id).startsWith('temp-')
  if (isTemp) return true
  if (actor === 'ADMIN' || actor === 'CMS' || actor === 'SYSTEM' || actor === '') {
    return true
  }
  return false
}
