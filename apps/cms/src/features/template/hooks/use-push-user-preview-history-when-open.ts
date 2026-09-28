/**
 * 설문 양식 미리보기처럼 모달을 연 뒤에 `userPreview=1`을 히스토리에 push 한다.
 * 모달이 열린 다음 쿼리를 넣어야, 페이지의 URL 동기화가
 * “아직 안 열린 userPreview”를 바로 지우는 레이스에 걸리지 않는다.
 * 뒤로가기는 그 쿼리가 빠질 때 `useWritingUserPreviewUrlAuxiliarySync`가 모달을 닫는다.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  TEMPLATE_USER_PREVIEW_ACTIVE,
  TEMPLATE_USER_PREVIEW_QUERY_KEY,
} from '@/features/template/lib/template-user-preview-url'

export function usePushUserPreviewHistoryWhenOpen(isOpen: boolean) {
  const [, setSearchParams] = useSearchParams()
  const pendingRef = useRef(false)
  const [requestId, setRequestId] = useState(0)

  const requestHistoryPush = useCallback(() => {
    pendingRef.current = true
    setRequestId(id => id + 1)
  }, [])

  useEffect(() => {
    if (!pendingRef.current || !isOpen) return
    pendingRef.current = false
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.set(TEMPLATE_USER_PREVIEW_QUERY_KEY, TEMPLATE_USER_PREVIEW_ACTIVE)
        return next
      },
      { replace: false }
    )
  }, [isOpen, requestId, setSearchParams])

  return requestHistoryPush
}
