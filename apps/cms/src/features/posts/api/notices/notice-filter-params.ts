import type { NoticesParams } from '@/shared/api/generated/posts/schemas'

export const NOTICE_LIST_PAGE_SIZE = 500

function parseVisibility(raw: string | null): 'public' | 'private' {
  return raw === 'private' ? 'private' : 'public'
}

export function noticesParamsFromSearchParams(searchParams: URLSearchParams): NoticesParams {
  const params: NoticesParams = {
    page: 0,
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
