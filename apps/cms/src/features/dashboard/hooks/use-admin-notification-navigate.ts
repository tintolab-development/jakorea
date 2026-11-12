import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { Notification } from '@/features/dashboard/api/notification-service'
import { resolveAdminNotificationNavigation } from '@/features/dashboard/lib/admin-notification-navigation'
import { navigateToProgramAdminDetail } from '@/features/program/general/lib/navigate-to-program-admin-detail'

/**
 * 알림 클릭 → 상세 이동. 이동 대상이 있으면 true.
 * 프로그램 상세는 유형 경로를 확정한 뒤 1회 navigate (임시 경로 경유 금지 — url-driven-detail-modal 규칙 3).
 */
export function useAdminNotificationNavigate(): (notification: Notification) => boolean {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return useCallback(
    (notification: Notification) => {
      const destination = resolveAdminNotificationNavigation(notification)
      if (!destination) return false
      if (destination.kind === 'program') {
        navigateToProgramAdminDetail(navigate, destination.programId, { queryClient })
        return true
      }
      navigate(destination.path)
      return true
    },
    [navigate, queryClient]
  )
}
