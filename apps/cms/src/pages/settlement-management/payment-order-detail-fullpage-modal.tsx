/**
 * 정산 관리 > 지급조서 확인 — 지급 현황 상세 풀페이지 모달 (프로그램·강사 공통 셸)
 */

import type { Dayjs } from 'dayjs'
import type {
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import {
  PaymentOrderDetailView,
  type PaymentOrderDetailViewProps,
} from '@/features/settlement/ui/payment-record'
import { usePaymentOrderDetailFullPageModalState } from './use-payment-order-detail-fullpage-modal'

export type PaymentOrderDetailFullPageModalProps = {
  type: 'program' | 'instructor'
  isOpen: boolean
  onClose: () => void
  /** 열림 + type 일치 시 해당 행. 닫힌 상태에서는 null 권장 */
  data: PaymentOrderAdminProgramRow | PaymentOrderAdminInstructorRow | null
  /** 목록 페이지에 조회 적용된 기간(URL) — 상세 기간 필터 초기값 */
  listPageDateRange: [Dayjs, Dayjs] | null
}

export function PaymentOrderDetailFullPageModal(props: PaymentOrderDetailFullPageModalProps) {
  const { canRender, sharedViewProps, viewBranch } = usePaymentOrderDetailFullPageModalState(props)

  if (!canRender || !viewBranch) {
    return null
  }

  return (
    <PaymentOrderDetailView
      {...({
        ...sharedViewProps,
        ...viewBranch,
      } as PaymentOrderDetailViewProps)}
    />
  )
}
