import type { FaqsParams } from '@/shared/api/generated/posts/schemas'
import { FaqRequestStatus } from '@/shared/api/generated/posts/schemas/faqRequestStatus'

export const FAQ_LIST_PAGE_SIZE = 500

export function faqsParamsFromSearchParams(searchParams: URLSearchParams): FaqsParams {
  const params: FaqsParams = {
    page: 0,
    size: FAQ_LIST_PAGE_SIZE,
  }

  const vis = searchParams.get('af_vis')
  if (vis === 'public') {
    params.status = 'published'
  } else if (vis === 'private') {
    params.status = FaqRequestStatus.임시저장
  }

  return params
}
