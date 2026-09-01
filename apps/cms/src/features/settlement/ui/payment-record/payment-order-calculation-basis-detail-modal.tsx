/**
 * 산출 내역서 — 산정 기준 상세 read-only 모달
 */

import { useState, useCallback, useEffect } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import type { PaymentOrderCalculationTableRow } from './payment-order-calculation-breakdown-table'
import {
  isSupportedBasisDetailLayout,
  resolvePaymentOrderCalculationBasisDetailForRow,
  resolveBasisDetailModalTitle,
  type PaymentOrderCalculationBasisDetail,
  type PaymentOrderCalculationBasisDetailResolveContext,
} from './payment-order-calculation-basis-detail'
import {
  PaymentOrderCalculationBasisDetailLectureFeeGeminiView,
  PaymentOrderCalculationBasisDetailLectureFeeSpecialView,
  PaymentOrderCalculationBasisDetailLectureFeeTierView,
} from './payment-order-calculation-basis-detail-lecture-fee-tier-view'
import {
  PaymentOrderCalculationBasisDetailTransportInstructorView,
  PaymentOrderCalculationBasisDetailTransportOneWayView,
  PaymentOrderCalculationBasisDetailTransportRoundTripView,
} from './payment-order-calculation-basis-detail-transport-views'
import {
  PaymentOrderCalculationBasisDetailLodging1s1gView,
  PaymentOrderCalculationBasisDetailLodgingGeneralView,
} from './payment-order-calculation-basis-detail-lodging-views'
import { PaymentOrderCalculationBasisDetailMealView } from './payment-order-calculation-basis-detail-meal-view'
import { PaymentOrderCalculationBasisDetailActivityView } from './payment-order-calculation-basis-detail-activity-view'
import { PaymentOrderCalculationBasisDetailWithholdingView } from './payment-order-calculation-basis-detail-withholding-view'
import type { PaymentOrderCalculationStatementDetailContext } from '@/features/settlement/lib/resolve-settlement-item-setting-for-calculation-row'
import './payment-order-calculation-basis-detail-modal.css'

export interface PaymentOrderCalculationBasisDetailModalProps {
  open: boolean
  onCancel: () => void
  detail: PaymentOrderCalculationBasisDetail | null
  /** 다른 모달 위에 겹칠 때 (산출 내역서 등) */
  zIndex?: number
}

export function PaymentOrderCalculationBasisDetailModal({
  open,
  onCancel,
  detail,
  zIndex = 1100,
}: PaymentOrderCalculationBasisDetailModalProps) {
  if (!open || !detail) {
    return null
  }

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={resolveBasisDetailModalTitle(detail)}
      size="default"
      width={800}
      className="payment-order-calculation-basis-detail-modal"
      titleBodyGap="always"
      zIndex={zIndex}
      footer={
        <CmsButton variant="primary" size="large" onClick={onCancel}>
          취소
        </CmsButton>
      }
    >
      {detail.layout === 'lectureFeeTier' ? (
        <PaymentOrderCalculationBasisDetailLectureFeeTierView detail={detail} />
      ) : null}
      {detail.layout === 'lectureFeeSpecial' ? (
        <PaymentOrderCalculationBasisDetailLectureFeeSpecialView detail={detail} />
      ) : null}
      {detail.layout === 'lectureFeeGemini' ? (
        <PaymentOrderCalculationBasisDetailLectureFeeGeminiView detail={detail} />
      ) : null}
      {detail.layout === 'transportRoundTrip' ? (
        <PaymentOrderCalculationBasisDetailTransportRoundTripView detail={detail} />
      ) : null}
      {detail.layout === 'transportOneWay' ? (
        <PaymentOrderCalculationBasisDetailTransportOneWayView detail={detail} />
      ) : null}
      {detail.layout === 'transportInstructor' ? (
        <PaymentOrderCalculationBasisDetailTransportInstructorView detail={detail} />
      ) : null}
      {detail.layout === 'lodgingGeneral' ? (
        <PaymentOrderCalculationBasisDetailLodgingGeneralView detail={detail} />
      ) : null}
      {detail.layout === 'lodging1s1g' ? (
        <PaymentOrderCalculationBasisDetailLodging1s1gView detail={detail} />
      ) : null}
      {detail.layout === 'meal' ? (
        <PaymentOrderCalculationBasisDetailMealView detail={detail} />
      ) : null}
      {detail.layout === 'activity' ? (
        <PaymentOrderCalculationBasisDetailActivityView detail={detail} />
      ) : null}
      {detail.layout === 'withholding' ? (
        <PaymentOrderCalculationBasisDetailWithholdingView detail={detail} />
      ) : null}
    </ContentModal>
  )
}

export type PaymentOrderCalculationBasisDetailModalContext =
  PaymentOrderCalculationStatementDetailContext &
    PaymentOrderCalculationBasisDetailResolveContext

export function usePaymentOrderCalculationBasisDetailModal(
  parentOpen = true,
  context?: PaymentOrderCalculationBasisDetailModalContext | null
) {
  const [basisDetailOpen, setBasisDetailOpen] = useState(false)
  const [selectedBasisDetail, setSelectedBasisDetail] =
    useState<PaymentOrderCalculationBasisDetail | null>(null)

  useEffect(() => {
    if (!parentOpen) {
      setBasisDetailOpen(false)
      setSelectedBasisDetail(null)
    }
  }, [parentOpen])

  const closeBasisDetailModal = useCallback(() => {
    setBasisDetailOpen(false)
    setSelectedBasisDetail(null)
  }, [])

  const handleBasisDetailClick = useCallback(
    (row: PaymentOrderCalculationTableRow) => {
      const resolvedDetail = resolvePaymentOrderCalculationBasisDetailForRow(row, context)
      if (resolvedDetail && isSupportedBasisDetailLayout(resolvedDetail)) {
        setSelectedBasisDetail(resolvedDetail)
        setBasisDetailOpen(true)
        return
      }

      window.alert('준비 중입니다.')
    },
    [context]
  )

  return {
    basisDetailOpen,
    selectedBasisDetail,
    handleBasisDetailClick,
    closeBasisDetailModal,
  }
}
