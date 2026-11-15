/**
 * 정산 관리 > 지급조서 확인 — 지급 현황 상세 풀페이지 모달 (프로그램·강사 공통 셸)
 */

import type { Dayjs } from 'dayjs'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import type {
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProgramRow,
} from '@/features/settlement-management/model/payment-order-admin-list'
import {
  PaymentOrderDetailView,
  type PaymentOrderDetailViewProps,
} from '@/features/settlement/ui/payment-record'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { IndividualSettlementReviewDetailModal } from '@/features/program/general/ui/detail-modal/program-status/individual-settlement-review-detail-modal'
import type { PaymentOrderPayeeTypeFilter } from './payment-orders-table.config'
import { usePaymentOrderDetailFullPageModalState } from './use-payment-order-detail-fullpage-modal'

export type PaymentOrderDetailFullPageModalProps = {
  type: 'program' | 'instructor'
  isOpen: boolean
  onClose: () => void
  /** 열림 + type 일치 시 해당 행. 닫힌 상태에서는 null 권장 */
  data: PaymentOrderAdminProgramRow | PaymentOrderAdminInstructorRow | null
  /** 목록 페이지에 조회 적용된 기간(URL) — 상세 기간 필터 초기값 */
  listPageDateRange: [Dayjs | null, Dayjs | null] | null
  /** 목록 페이지에 조회 적용된 정산 대상자 구분 */
  listPagePayeeType?: PaymentOrderPayeeTypeFilter
}

function resolveDetailContentError(
  detailLoading: boolean,
  detailError: unknown,
  hasDetail: boolean
): string | null {
  if (detailLoading) return null
  if (detailError) {
    return getSettlementApiErrorMessage(detailError, '상세를 불러오지 못했습니다.')
  }
  if (!hasDetail) return '상세를 불러오지 못했습니다.'
  return null
}

export function PaymentOrderDetailFullPageModal(props: PaymentOrderDetailFullPageModalProps) {
  const { isOpen, onClose } = props
  const { detailLoading, detailError, sharedViewProps, viewBranch, receiptReview } =
    usePaymentOrderDetailFullPageModalState(props)

  if (!isOpen) {
    return null
  }

  const contentError = resolveDetailContentError(
    detailLoading,
    detailError,
    Boolean(viewBranch?.detail)
  )

  if (!viewBranch) {
    return (
      <DetailFullPageModal
        open={isOpen}
        onClose={onClose}
        title="지급 현황 상세"
        loading={detailLoading}
        error={contentError}
      />
    )
  }

  return (
    <>
      <PaymentOrderDetailView
        {...({
          ...sharedViewProps,
          ...viewBranch,
          contentLoading: detailLoading,
          contentError,
        } as PaymentOrderDetailViewProps)}
      />
      {/* 영수증 정산 신청 행(개인 참여자·봉사자) — 프로그램 상세의 영수증 검토 모달을 그대로 쓴다 */}
      <IndividualSettlementReviewDetailModal
        open={receiptReview.target != null}
        programId={
          receiptReview.target?.programId != null ? String(receiptReview.target.programId) : ''
        }
        participantId=""
        settlementApplicationId={receiptReview.target?.individualSettlementApplicationId ?? null}        onClose={receiptReview.close}
        onReviewed={receiptReview.onReviewed}
      />
    </>
  )
}
