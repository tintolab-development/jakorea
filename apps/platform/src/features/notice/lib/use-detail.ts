import { useCallback, useState } from 'react'
import { useShouldUsePlatformMockData } from '@/shared/hooks'
import type { NoticeDetail, NoticeDetailStatus } from '../model/types'
import { toNoticeDetailView } from './map-detail'
import { getMockNoticeDetailById } from './mock-notices'

export type NoticeDetailQuery = {
  data: NoticeDetail | null
  status: NoticeDetailStatus
  error: Error | null
  refetch: () => void
}

/**
 * 공지 상세 조회.
 * 실제 공개 API가 준비되기 전에는 mock만 읽고, 없는 엔드포인트를 호출하지 않는다.
 */
export function useNoticeDetail(id: string | null): NoticeDetailQuery {
  useShouldUsePlatformMockData()
  const [retryCount, setRetryCount] = useState(0)

  const refetch = useCallback(() => {
    setRetryCount(count => count + 1)
  }, [])

  void retryCount

  if (!id) {
    return { data: null, status: 'not-found', error: null, refetch }
  }

  const found = getMockNoticeDetailById(id)
  if (!found) {
    return { data: null, status: 'not-found', error: null, refetch }
  }

  return {
    data: toNoticeDetailView(found),
    status: 'ready',
    error: null,
    refetch,
  }
}
