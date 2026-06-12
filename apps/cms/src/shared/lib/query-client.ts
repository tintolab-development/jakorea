/**
 * 앱 전역 QueryClient 싱글톤
 * Provider·auth 경계(clear/remove)에서 동일 인스턴스 사용
 */
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
})
