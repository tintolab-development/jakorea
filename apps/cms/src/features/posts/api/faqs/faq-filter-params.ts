import type { FaqsParams } from '@/shared/api/generated/posts/schemas'

export const FAQ_LIST_PAGE_SIZE = 500

function parseVisibility(raw: string | null): 'public' | 'private' {
  return raw === 'private' ? 'private' : 'public'
}

export function faqsParamsFromSearchParams(searchParams: URLSearchParams): FaqsParams {
  const params: FaqsParams = {
    page: 0,
    size: FAQ_LIST_PAGE_SIZE,
    visibility: parseVisibility(searchParams.get('af_vis')),
  }

  const title = searchParams.get('af_q')?.trim()
  if (title) params.title = title

  const author = searchParams.get('af_auth')?.trim()
  if (author) params.author = author

  const category = searchParams.get('af_cat')?.trim()
  if (category && category !== 'ALL') params.category = category

  const createdFrom = searchParams.get('af_from')?.trim()
  const createdTo = searchParams.get('af_to')?.trim()
  if (createdFrom) params.createdFrom = createdFrom
  if (createdTo) params.createdTo = createdTo

  return params
}
