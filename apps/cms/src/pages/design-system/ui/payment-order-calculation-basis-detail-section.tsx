import { useCallback, useMemo, useState } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import {
  PaymentOrderCalculationBasisDetailModal,
  buildActivityBasisDetail,
  buildLectureFeeTierBasisDetail,
  buildLodgingBasisDetail,
  buildMealBasisDetail,
  buildTravelBasisDetail,
  buildWithholdingBasisDetail,
  resolveBasisDetailModalTitle,
  type PaymentOrderCalculationBasisDetail,
} from '@/features/settlement/ui/payment-record'
import { DsDemo, DsSection } from './section'

type BasisDetailDemoItem = {
  id: string
  label: string
  detail: PaymentOrderCalculationBasisDetail
}

function buildPaymentOrderCalculationBasisDetailDemos(): BasisDetailDemoItem[] {
  const lectureFeeTier2 = buildLectureFeeTierBasisDetail('2급 강사비', 915000, 1)
  if (!lectureFeeTier2) {
    throw new Error('lecture fee tier demo payload missing')
  }

  return [
    {
      id: 'lecture-fee-tier-1',
      label: '강사비 1급',
      detail: buildLectureFeeTierBasisDetail('1급 강사비', 500000, 1)!,
    },
    {
      id: 'lecture-fee-tier-2',
      label: '강사비 2급',
      detail: lectureFeeTier2,
    },
    {
      id: 'lecture-fee-tier-3',
      label: '강사비 3급',
      detail: buildLectureFeeTierBasisDetail('3급 강사비', 300000, 2)!,
    },
    {
      id: 'transport-round-trip',
      label: '교통비 · 학생 왕복',
      detail: buildTravelBasisDetail(0),
    },
    {
      id: 'transport-one-way',
      label: '교통비 · 학생 편도',
      detail: buildTravelBasisDetail(1),
    },
    {
      id: 'transport-instructor',
      label: '교통비 · 강사(1사1교)',
      detail: buildTravelBasisDetail(2),
    },
    {
      id: 'lodging-general',
      label: '숙박비 · 일반',
      detail: buildLodgingBasisDetail(0),
    },
    {
      id: 'lodging-1s1g',
      label: '숙박비 · 1사1교',
      detail: buildLodgingBasisDetail(1),
    },
    {
      id: 'meal',
      label: '식사비',
      detail: buildMealBasisDetail(),
    },
    {
      id: 'activity',
      label: '활동비',
      detail: buildActivityBasisDetail(),
    },
    {
      id: 'withholding',
      label: '원천징수',
      detail: buildWithholdingBasisDetail(300000),
    },
  ]
}

export function PaymentOrderCalculationBasisDetailSection() {
  const demos = useMemo(() => buildPaymentOrderCalculationBasisDetailDemos(), [])
  const [open, setOpen] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<PaymentOrderCalculationBasisDetail | null>(
    null
  )

  const openDemo = useCallback((detail: PaymentOrderCalculationBasisDetail) => {
    setSelectedDetail(detail)
    setOpen(true)
  }, [])

  const closeDemo = useCallback(() => {
    setOpen(false)
    setSelectedDetail(null)
  }, [])

  return (
    <DsSection
      id="payment-order-calculation-basis-detail"
      title="Payment order · calculation basis detail"
      description="지급조서 산출 내역서 — 산정 기준 상세 read-only 모달(800px ContentModal + ModalSpecTable)입니다."
    >
      <p className="ds-note">
        실제 화면: 정산 관리 → 지급조서 확인 → 산출 내역서 → 「상세 보기」. payload SSOT는{' '}
        <code>payment-order-calculation-basis-detail.ts</code> · 렌더는{' '}
        <code>PaymentOrderCalculationBasisDetailModal</code>.
      </p>

      <DsDemo label="산정 기준 상세 모달 (전체 레이아웃)">
        <div className="ds-modal-process-grid">
          {demos.map(demo => (
            <CmsButton key={demo.id} variant="default" onClick={() => openDemo(demo.detail)}>
              {demo.label}
            </CmsButton>
          ))}
        </div>
        <p className="ds-demo__hint">
          {demos.map(demo => resolveBasisDetailModalTitle(demo.detail)).join(' · ')}
        </p>
      </DsDemo>

      <PaymentOrderCalculationBasisDetailModal
        open={open}
        onCancel={closeDemo}
        detail={selectedDetail}
      />
    </DsSection>
  )
}
