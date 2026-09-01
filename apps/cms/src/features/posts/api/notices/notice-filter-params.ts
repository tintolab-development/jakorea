import type { NoticesParams } from '@/shared/api/generated/posts/schemas'
import { NoticeRequestStatus } from '@/shared/api/generated/posts/schemas/noticeRequestStatus'

export const NOTICE_LIST_PAGE_SIZE = 500

export function noticesParamsFromSearchParams(searchParams: URLSearchParams): NoticesParams {
  const params: NoticesParams = {
    page: 0,
    size: NOTICE_LIST_PAGE_SIZE,
  }

  const vis = searchParams.get('an_vis')
  if (vis === 'public') {
    params.status = 'published'
  } else if (vis === 'private') {
    params.status = NoticeRequestStatus.임시저장
  }

  return params
}
