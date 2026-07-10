/**
 * 정산 관리 > 지급조서 확인 — 지급 현황 상세 풀페이지 모달 (프로그램·강사 공통 셸)
 */

import type { Dayjs } from 'dayjs'
import { Spin } from 'antd'
import type {
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import {
  PaymentOrderDetailView,
  type PaymentOrderDetailViewProps,
} from '@/features/settlement/ui/payment-record'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
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
  const { isOpen, onClose, type } = props
  const { canRender, detailLoading, detailError, sharedViewProps, viewBranch } =
    usePaymentOrderDetailFullPageModalState(props)

  const title = type === 'instructor' ? '강사 지급 현황 상세' : '프로그램 지급 현황 상세'

  if (!isOpen) {
    return null
  }

  if (detailLoading) {
    return (
      <DetailFullPageModal open={isOpen} onClose={onClose} title={title}>
        <div className="detail-fullpage-modal__loading" role="status" aria-label="상세 불러오는 중">
          <Spin size="large" />
        </div>
      </DetailFullPageModal>
    )
  }

  if (detailError) {
    return (
      <DetailFullPageModal open={isOpen} onClose={onClose} title={title}>
        <div className="page-content-error" role="alert">
          {detailError instanceof Error ? detailError.message : '상세를 불러오지 못했습니다.'}
        </div>
      </DetailFullPageModal>
    )
  }

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
