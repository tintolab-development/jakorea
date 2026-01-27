/**
 * 알림 데이터 처리 훅
 * - 전역 알림 스토어 사용
 * - 헤더 모달과 위젯 간 상태 동기화
 */

import { useEffect, useMemo } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useNotificationStore } from '../model/notification-store'
import type { Notification } from '../api/notification-service'

interface UseNotificationsResult {
  notifications: Notification[]
  loading: boolean
  unreadCount: number
  refresh: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  removeNotification: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

export function useNotifications(): UseNotificationsResult {
  const { user } = useAuthStore()
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    removeNotification,
    markAllAsRead,
    refresh,
  } = useNotificationStore()

  // 사용자 변경 시 알림 로드
  useEffect(() => {
    if (user?.id) {
      fetchNotifications()
    } else {
      // 사용자가 없으면 알림 초기화
      useNotificationStore.setState({ notifications: [] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const unreadCount = useMemo(
    () => notifications.filter(notification => !notification.read).length,
    [notifications]
  )

  return {
    notifications,
    loading,
    unreadCount,
    refresh,
    markAsRead,
    removeNotification,
    markAllAsRead,
  }
}
