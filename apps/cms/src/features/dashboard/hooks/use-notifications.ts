/**
 * 알림 데이터 처리 훅
 * - 전역 알림 스토어 사용 (mock)
 * - ADMIN + dashboard remote: GET /api/admin/notifications
 */

import { useEffect, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  hideAdminNotification,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  shouldUseDashboardRemoteApi,
} from '../api/admin-dashboard-service'
import { useAdminNotifications } from '../hooks/use-admin-notifications'
import {
  applyAllNotificationsRead,
  applyNotificationHidden,
  applyNotificationRead,
} from '../lib/notification-query-cache'
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
  const queryClient = useQueryClient()
  const useRemoteList = user?.role === 'ADMIN' && shouldUseDashboardRemoteApi()
  const {
    notifications: storeNotifications,
    loading: storeLoading,
    fetchNotifications,
    markAsRead: markStoreAsRead,
    removeNotification: removeStoreNotification,
    markAllAsRead: markStoreAllAsRead,
    refresh: refreshStore,
  } = useNotificationStore()

  const { data: remoteNotifications = [], isLoading: remoteLoading, refetch } = useAdminNotifications(
    useRemoteList
  )

  const { mutateAsync: markRemoteAsRead } = useMutation({
    mutationFn: (notificationId: string) => markAdminNotificationAsRead(notificationId),
    onSuccess: (_data, notificationId) => {
      applyNotificationRead(queryClient, notificationId)
    },
  })

  const { mutateAsync: hideRemoteNotification } = useMutation({
    mutationFn: (notificationId: string) => hideAdminNotification(notificationId),
    onSuccess: (_data, notificationId) => {
      applyNotificationHidden(queryClient, notificationId)
    },
  })

  const { mutateAsync: markRemoteAllAsRead } = useMutation({
    mutationFn: () => markAllAdminNotificationsAsRead(),
    onSuccess: () => {
      applyAllNotificationsRead(queryClient)
    },
  })

  const notifications = useRemoteList ? remoteNotifications : storeNotifications
  const loading = useRemoteList ? remoteLoading : storeLoading

  useEffect(() => {
    if (!user?.id) {
      useNotificationStore.setState({ notifications: [] })
      return
    }
    if (!useRemoteList) {
      void fetchNotifications()
    }
  }, [user?.id, useRemoteList, fetchNotifications])

  const unreadCount = useMemo(
    () => notifications.filter(notification => !notification.read).length,
    [notifications]
  )

  const refresh = async () => {
    if (useRemoteList) {
      await refetch()
      return
    }
    await refreshStore()
  }

  const markAsRead = async (notificationId: string) => {
    if (useRemoteList) {
      await markRemoteAsRead(notificationId)
      return
    }
    await markStoreAsRead(notificationId)
  }

  const removeNotification = async (notificationId: string) => {
    if (useRemoteList) {
      await hideRemoteNotification(notificationId)
      return
    }
    await removeStoreNotification(notificationId)
  }

  const markAllAsRead = async () => {
    if (useRemoteList) {
      await markRemoteAllAsRead()
      return
    }
    await markStoreAllAsRead()
  }

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
