/**
 * 공지·FAQ 상세 상단 일시 (QA-0315) — 목록 「수정일시」와 같은 값(updatedAt, 없으면 createdAt).
 */
import { formatDateTimeDot, formatDateTimeSecondsDot } from '@/shared/utils/date'

export type PostsDetailMetaDate = { key: 'created' | 'updated'; text: string }

function resolveUpdatedAt(post: { createdAt: string; updatedAt?: string | null }): string {
  return post.updatedAt?.trim() ? post.updatedAt : post.createdAt
}

export function resolvePostsDetailMetaDates(post: {
  createdAt: string
  updatedAt?: string | null
}): PostsDetailMetaDate[] {
  return [
    { key: 'created', text: `작성일시 ${formatDateTimeSecondsDot(post.createdAt)}` },
    { key: 'updated', text: `최종 수정일시 ${formatDateTimeSecondsDot(resolveUpdatedAt(post))}` },
  ]
}

/** 공지사항 상세 상단 안내 — 수정일은 어드민에서만 보인다 (시안 QA 2026-11) */
export const NOTICE_DETAIL_UPDATED_AT_GUIDE =
  '※ 수정일은 어드민 화면에서만 노출되며, 홈페이지에서는 작성일만 노출됩니다.'

/**
 * 공지사항 상세 상단 — `작성일 : YYYY.MM.DD HH:mm` · `수정일 : YYYY.MM.DD HH:mm` (시안 QA 2026-11).
 * 수정일은 서버 응답 `updatedAt`(수정 저장 응답으로 상세 캐시 갱신), 없으면 작성일과 같다.
 */
export function resolveNoticeDetailMetaDates(post: {
  createdAt: string
  updatedAt?: string | null
}): PostsDetailMetaDate[] {
  return [
    { key: 'created', text: `작성일 : ${formatDateTimeDot(post.createdAt)}` },
    { key: 'updated', text: `수정일 : ${formatDateTimeDot(resolveUpdatedAt(post))}` },
  ]
}
