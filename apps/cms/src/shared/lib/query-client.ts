/**
 * 앱 전역 QueryClient 싱글톤
 * Provider·auth 경계(clear/remove)에서 동일 인스턴스 사용
 */
import { QueryClient } from '@tanstack/react-query'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: shouldRetryQuery,
      retryDelay: queryRetryDelay,
    },
    mutations: {
      retry: false,
    },
  },
})
