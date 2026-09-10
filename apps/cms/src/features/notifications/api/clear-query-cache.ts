import { queryClient } from '@/shared/lib/query-client'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'

/** 로그인·로그아웃 경계에서 알림 서버 상태가 재사용되지 않도록 제거한다. */
export function clearNotificationsQueryCache(): void {
  void queryClient.removeQueries({ queryKey: notificationsQueryKeys.all })
}
