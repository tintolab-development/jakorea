import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'

/**
 * 라우트 상세에서 삭제 후 목록으로 replace 이동한다.
 * 상세 쿼리를 먼저 끄고, 언마운트 때 detail 캐시를 제거해 404 GET을 막는다.
 */
export function useLeaveDeletedDetail(listPath: string, detailQueryKey: QueryKey | undefined) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [detailEnabled, setDetailEnabled] = useState(true)
  const pendingRemoveKeyRef = useRef<QueryKey | null>(null)

  useEffect(() => {
    return () => {
      const key = pendingRemoveKeyRef.current
      if (!key) return
      queryClient.removeQueries({ queryKey: key, exact: true })
    }
  }, [queryClient])

  const goList = useCallback(() => {
    navigate(listPath)
  }, [listPath, navigate])

  const leaveToList = useCallback(() => {
    if (detailQueryKey) pendingRemoveKeyRef.current = detailQueryKey
    flushSync(() => {
      setDetailEnabled(false)
    })
    navigate(listPath, { replace: true })
  }, [detailQueryKey, listPath, navigate])

  const runDeleteThenLeave = useCallback(
    async (deleteFn: () => Promise<unknown>) => {
      flushSync(() => {
        setDetailEnabled(false)
      })
      try {
        await deleteFn()
      } catch (error) {
        setDetailEnabled(true)
        throw error
      }
      if (detailQueryKey) pendingRemoveKeyRef.current = detailQueryKey
      navigate(listPath, { replace: true })
    },
    [detailQueryKey, listPath, navigate]
  )

  return { detailEnabled, goList, leaveToList, runDeleteThenLeave }
}
