import { useEffect, useRef } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'

/**
 * localStorage mock write 등으로 window CustomEvent가 발생하면
 * 해당 query family를 invalidate한다. (mutation onSuccess 무효화와 별개로, 다른 탭·외부 쓰기 동기화용)
 */
export function useInvalidateOnWindowEvent(eventName: string, queryKey: QueryKey) {
  const queryClient = useQueryClient()
  const queryKeyRef = useRef(queryKey)
  queryKeyRef.current = queryKey

  useEffect(() => {
    const handler = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeyRef.current })
    }
    window.addEventListener(eventName, handler)
    return () => window.removeEventListener(eventName, handler)
  }, [eventName, queryClient])
}
