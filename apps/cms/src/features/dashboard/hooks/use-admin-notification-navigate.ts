import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { Notification } from '@/features/dashboard/api/notification-service'
import {
  buildPaymentOrderInstructorDetailPath,
  PAYMENT_ORDERS_LIST_PATH,
  resolveAdminNotificationNavigation,
} from '@/features/dashboard/lib/admin-notification-navigation'
import { applyProgramDetailSection } from '@/features/dashboard/lib/admin-notification-program-section'
import { navigateToProgramAdminDetail } from '@/features/program/general/lib/navigate-to-program-admin-detail'
import { fetchSettlementDetailRemote } from '@/features/settlement-management/api/settlement-api-client'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'

/**
 * 알림 클릭 → 상세 이동. 이동 대상이 있으면 true.
 * 프로그램 상세는 유형 경로를 확정한 뒤 1회 navigate (임시 경로 경유 금지 — url-driven-detail-modal 규칙 3).
 * 강사비 정정 요청은 정산 상세(GET /api/admin/settlements/{settlementId})의 instructorId(강사 회원 ID)로
 * 신청자 별 지급 현황 상세를 연다. 확인하지 못하면 지급조서 확인 목록으로 간다.
 */
export function useAdminNotificationNavigate(options?: {
  /** 관리자 권한 변경 알림 — 「내 정보 확인」 팝업을 연다 (팝업은 헤더가 가진다) */
  onOpenProfile?: () => void
}): (notification: Notification) => boolean {
  const onOpenProfile = options?.onOpenProfile
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return useCallback(
    (notification: Notification) => {
      const destination = resolveAdminNotificationNavigation(notification)
      if (!destination) return false
      if (destination.kind === 'profile') {
        if (!onOpenProfile) return false
        onOpenProfile()
        return true
      }
      if (destination.kind === 'program') {
        const section = destination.section
        navigateToProgramAdminDetail(navigate, destination.programId, {
          queryClient,
          transformUrl: section ? url => applyProgramDetailSection(url, section) : undefined,
        })
        return true
      }
      if (destination.kind === 'payment-statement-correction') {
        const settlementId = Number(destination.settlementId)
        void queryClient
          .fetchQuery({
            queryKey: settlementQueryKeys.paymentOrders.settlement(settlementId),
            queryFn: () => fetchSettlementDetailRemote(settlementId),
            staleTime: 30_000,
          })
          .then(detail => {
            const instructorMemberId = detail.instructorId?.trim()
            navigate(
              instructorMemberId && /^\d+$/.test(instructorMemberId)
                ? buildPaymentOrderInstructorDetailPath(instructorMemberId)
                : PAYMENT_ORDERS_LIST_PATH
            )
          })
          .catch(() => {
            navigate(PAYMENT_ORDERS_LIST_PATH)
          })
        return true
      }
      navigate(destination.path)
      return true
    },
    [navigate, onOpenProfile, queryClient]
  )
}
