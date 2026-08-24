/**
 * 산출 내역서 — 산정 기준 상세 read-only 모달
 */

import { useState, useCallback, useEffect } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import type { PaymentOrderCalculationTableRow } from './payment-order-calculation-breakdown-table'
import {
  isSupportedBasisDetailLayout,
  resolveBasisDetailModalTitle,
  type PaymentOrderCalculationBasisDetail,
} from './payment-order-calculation-basis-detail'
import { PaymentOrderCalculationBasisDetailLectureFeeTierView } from './payment-order-calculation-basis-detail-lecture-fee-tier-view'
import {
  PaymentOrderCalculationBasisDetailTransportInstructorView,
  PaymentOrderCalculationBasisDetailTransportOneWayView,
  PaymentOrderCalculationBasisDetailTransportRoundTripView,
} from './payment-order-calculation-basis-detail-transport-views'
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
        <CmsButton variant="secondary" size="large" onClick={onCancel}>
          취소
        </CmsButton>
      }
    >
      {detail.layout === 'lectureFeeTier' ? (
        <PaymentOrderCalculationBasisDetailLectureFeeTierView detail={detail} />
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
    </ContentModal>
  )
}

export function usePaymentOrderCalculationBasisDetailModal(parentOpen = true) {
  const [basisDetailOpen, setBasisDetailOpen] = useState(false)
  const [selectedBasisDetail, setSelectedBasisDetail] =
    useState<PaymentOrderCalculationBasisDetail | null>(null)

  useEffect(() => {
    if (!parentOpen) {
      setBasisDetailOpen(false)
      setSelectedBasisDetail(null)
    }
  }, [parentOpen])

  const handleBasisDetailClick = useCallback((row: PaymentOrderCalculationTableRow) => {
    if (!isSupportedBasisDetailLayout(row.basisDetail)) {
      window.alert('준비 중입니다.')
      return
    }
    setSelectedBasisDetail(row.basisDetail)
    setBasisDetailOpen(true)
  }, [])

  const closeBasisDetailModal = useCallback(() => {
    setBasisDetailOpen(false)
    setSelectedBasisDetail(null)
  }, [])

  return {
    basisDetailOpen,
    selectedBasisDetail,
    handleBasisDetailClick,
    closeBasisDetailModal,
  }
}
