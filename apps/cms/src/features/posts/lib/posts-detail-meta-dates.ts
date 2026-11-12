/**
 * 공지·FAQ 상세 상단 일시 (QA-0315) — 목록 「수정일시」와 같은 값(updatedAt, 없으면 createdAt).
 */
import { formatDateTimeSecondsDot } from '@/shared/utils/date'

export type PostsDetailMetaDate = { key: 'created' | 'updated'; text: string }

export function resolvePostsDetailMetaDates(post: {
  createdAt: string
  updatedAt?: string | null
}): PostsDetailMetaDate[] {
  const updatedAt = post.updatedAt?.trim() ? post.updatedAt : post.createdAt
  return [
    { key: 'created', text: `작성일시 ${formatDateTimeSecondsDot(post.createdAt)}` },
    { key: 'updated', text: `최종 수정일시 ${formatDateTimeSecondsDot(updatedAt)}` },
  ]
}
