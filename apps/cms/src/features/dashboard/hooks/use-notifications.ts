/**
 * 알림 데이터 처리 훅
 * - 전역 알림 스토어 사용
 * - 헤더 모달과 위젯 간 상태 동기화
 */

import { useEffect, useMemo } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { shouldUseDashboardRemoteApi } from '../api/admin-dashboard-service'
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
  const useMockList = !(user?.role === 'ADMIN' && shouldUseDashboardRemoteApi())
  const {
    notifications: storeNotifications,
    loading,
    fetchNotifications,
    markAsRead,
    removeNotification,
    markAllAsRead,
    refresh,
  } = useNotificationStore()

  const notifications = useMockList ? storeNotifications : []

  // 사용자 변경 시 알림 로드 (목록 API 없음 — ADMIN 실 API는 count만 사용)
  useEffect(() => {
    if (!user?.id) {
      useNotificationStore.setState({ notifications: [] })
      return
    }
    if (!useMockList) {
      useNotificationStore.setState({ notifications: [] })
      return
    }
    void fetchNotifications()
  }, [user?.id, useMockList, fetchNotifications])

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
