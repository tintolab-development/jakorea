/**
 * 지급 현황 상세(강사) — 마스킹 해제 `usePersonalInfoReveal` 바인딩
 */

import { useCallback } from 'react'
import type {
  PaymentOrderAdminInstructorDetail,
  PaymentOrderAdminProgramDetail,
} from '@/data/mock/payment-order-admin-list'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'

type DetailForPrivacy = PaymentOrderAdminProgramDetail | PaymentOrderAdminInstructorDetail

export function usePaymentOrderDetailInstructorPrivacyReveal(options: {
  isOpen: boolean
  kind: 'program' | 'instructor'
  instructorRowKey: number | null
  detail: DetailForPrivacy | null
}) {
  const { isOpen, kind, instructorRowKey, detail } = options

  const resolvePersonalInfoAccessItem = useCallback(() => {
    if (detail && 'nameKo' in detail) {
      return detail.nameKo ?? '지급 현황 상세 강사'
    }
    return '지급 현황 상세 강사'
  }, [detail])

  return usePersonalInfoReveal({
    resolveAccessItem: resolvePersonalInfoAccessItem,
    resetDeps: [isOpen, kind, instructorRowKey],
    controlMode: 'toggleRemask',
  })
}
