/**
 * 알림 상태 관리 스토어
 * - 전역 알림 상태 관리
 * - 헤더 모달과 위젯 간 상태 동기화
 */

import { create } from 'zustand'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type Notification,
} from '../api/notification-service'

interface NotificationState {
  notifications: Notification[]
  loading: boolean
  error: Error | null
  lastFetched: number | null

  // Actions
  fetchNotifications: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  removeNotification: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refresh: () => Promise<void>
  clearError: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,
  lastFetched: null,

  fetchNotifications: async () => {
    const { user } = useAuthStore.getState()
    if (!user?.id) {
      set({ notifications: [], loading: false })
      return
    }

    set({ loading: true, error: null })
    try {
      const data = await getNotifications(user.id, user.role)
      set({
        notifications: data,
        loading: false,
        lastFetched: Date.now(),
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error('알림 로드 실패')
      set({ loading: false, error: err })
      console.error('알림 로드 실패:', error)
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      set(state => ({
        notifications: state.notifications.map(notification =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        ),
      }))
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error)
      throw error
    }
  },

  removeNotification: async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
      set(state => ({
        notifications: state.notifications.filter(
          notification => notification.id !== notificationId
        ),
      }))
    } catch (error) {
      console.error('알림 삭제 실패:', error)
      throw error
    }
  },

  markAllAsRead: async () => {
    const { user } = useAuthStore.getState()
    if (!user?.id) return

    try {
      await markAllNotificationsAsRead(user.id)
      set(state => ({
        notifications: state.notifications.map(notification => ({ ...notification, read: true })),
      }))
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error)
      throw error
    }
  },

  refresh: async () => {
    await get().fetchNotifications()
  },

  clearError: () => {
    set({ error: null })
  },
}))
