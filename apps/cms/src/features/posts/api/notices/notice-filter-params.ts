import { POSTS_LIST_PAGE_SIZE } from '@/features/posts/api/posts-list-page'
import type { NoticesParams } from '@/shared/api/generated/posts/schemas'

export const NOTICE_LIST_PAGE_SIZE = POSTS_LIST_PAGE_SIZE

/** URL에 값이 없으면 전체 — 서버는 visibility 미전송 시 공개만 주므로 ALL을 명시한다. */
function parseVisibility(raw: string | null): 'ALL' | 'public' | 'private' {
  if (raw === 'public' || raw === 'private') return raw
  return 'ALL'
}

export function noticesParamsFromSearchParams(
  searchParams: URLSearchParams,
  page = 0
): NoticesParams {
  const params: NoticesParams = {
    page,
    size: NOTICE_LIST_PAGE_SIZE,
    visibility: parseVisibility(searchParams.get('an_vis')),
  }

  const title = searchParams.get('an_q')?.trim()
  if (title) params.title = title

  const author = searchParams.get('an_auth')?.trim()
  if (author) params.author = author

  const category = searchParams.get('an_cat')?.trim()
  if (category && category !== 'ALL') params.category = category

  const createdFrom = searchParams.get('an_from')?.trim()
  const createdTo = searchParams.get('an_to')?.trim()
  if (createdFrom) params.createdFrom = createdFrom
  if (createdTo) params.createdTo = createdTo

  return params
}
