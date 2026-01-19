/**
 * 알림 데이터 처리 훅
 * - Mock 기반 데이터 로딩
 * - 읽음/삭제/전체 읽음 처리
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type Notification,
} from '../api/notification-service'

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
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const data = await getNotifications(user.id, user.role)
      setNotifications(data)
    } catch (error) {
      console.error('알림 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.role])

  useEffect(() => {
    if (user?.id) {
      refresh()
    }
  }, [refresh, user?.id])

  const markAsRead = useCallback(async (notificationId: string) => {
    await markNotificationAsRead(notificationId)
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    )
  }, [])

  const removeNotification = useCallback(async (notificationId: string) => {
    await deleteNotification(notificationId)
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId))
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return

    await markAllNotificationsAsRead(user.id)
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })))
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
