/**
 * 산출 내역서 — 지급 정정 요청 건 「지급 정정」 팝업 (시안 12432:437066, w600)
 *
 * - 프로그램 기준 적용: 강사비 유형(1~3급) 셀렉트만. 단가는 프로그램 저장값을 BE가 쓴다.
 * - 특강 강사비 / 기타 인건비: 지급 기준 셀렉트(w120) + 강사비 입력 + 「원」
 */

import { useEffect, useState } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import type { SettlementCorrectionApprovalRequest } from '@/shared/api/generated/settlement/schemas'
import {
  buildPaymentCorrectionApprovalRequest,
  EMPTY_PAYMENT_CORRECTION_FORM,
  isPaymentCorrectionManualPricing,
  PAYMENT_CORRECTION_CALCULATION_UNIT_OPTIONS,
  PAYMENT_CORRECTION_PRICING_MODE_OPTIONS,
  PAYMENT_CORRECTION_STANDARD_WAGE_OPTIONS,
  type PaymentCorrectionCalculationUnit,
  type PaymentCorrectionFormValue,
  type PaymentCorrectionPricingMode,
  type PaymentCorrectionStandardWageType,
} from '@/features/settlement/lib/payment-correction'
import './payment-order-payment-correction-modal.css'

export interface PaymentOrderPaymentCorrectionModalProps {
  open: boolean
  instructorName: string
  confirmLoading?: boolean
  zIndex?: number
  onCancel: () => void
  onConfirm: (body: SettlementCorrectionApprovalRequest) => void
}

export function PaymentOrderPaymentCorrectionModal({
  open,
  instructorName,
  confirmLoading = false,
  zIndex,
  onCancel,
  onConfirm,
}: PaymentOrderPaymentCorrectionModalProps) {
  const [form, setForm] = useState<PaymentCorrectionFormValue>(EMPTY_PAYMENT_CORRECTION_FORM)
  const [error, setError] = useState<string | null>(null)

  /* eslint-disable react-hooks/set-state-in-effect -- 열 때마다 입력 초기화 */
  useEffect(() => {
    if (open) {
      setForm(EMPTY_PAYMENT_CORRECTION_FORM)
      setError(null)
    }
  }, [open])
  /* eslint-enable react-hooks/set-state-in-effect */

  const update = (patch: Partial<PaymentCorrectionFormValue>) => {
    setForm(prev => ({ ...prev, ...patch }))
    setError(null)
  }

  const handleConfirm = () => {
    const result = buildPaymentCorrectionApprovalRequest(form)
    if (!result.ok) {
      setError(result.message)
      return
    }
    onConfirm(result.body)
  }

  const manual = isPaymentCorrectionManualPricing(form.pricingMode)
  const name = instructorName.trim() || '-'

  return (
    <ContentModal
      open={open}
      onCancel={() => {
        if (!confirmLoading) onCancel()
      }}
      title="강사비 지급 정정 안내"
      width={600}
      zIndex={zIndex}
      className="payment-order-payment-correction-modal"
      footer={
        <div className="payment-order-payment-correction__footer-actions">
          <CmsButton variant="secondary" size="h40" disabled={confirmLoading} onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="h40"
            loading={confirmLoading}
            disabled={form.pricingMode == null}
            onClick={handleConfirm}
          >
            지급 정정
          </CmsButton>
        </div>
      }
    >
      <p className="payment-order-payment-correction__line">
        <span className="payment-order-payment-correction__name">[{name}]</span> 님의 강사비 책정
        방식을 정정해 주세요.
      </p>
      <p className="payment-order-payment-correction__line">선택한 방식으로 강사비가 재산정됩니다.</p>

      <div className="payment-order-payment-correction__field">
        <span className="payment-order-payment-correction__label">
          강사비 책정 방식
          <span className="payment-order-payment-correction__required" aria-hidden>
            *
          </span>
        </span>
        <CmsRadioGroup
          size="medium"
          className="payment-order-payment-correction__radios"
          value={form.pricingMode ?? undefined}
          disabled={confirmLoading}
          onChange={e =>
            update({
              pricingMode: e.target.value as PaymentCorrectionPricingMode,
              standardWageType: null,
              calculationUnit: null,
              unitAmount: '',
            })
          }
        >
          {PAYMENT_CORRECTION_PRICING_MODE_OPTIONS.map(option => (
            <CmsRadio key={option.value} value={option.value}>
              {option.label}
            </CmsRadio>
          ))}
        </CmsRadioGroup>

        {form.pricingMode === 'PROGRAM_STANDARD' ? (
          <div className="payment-order-payment-correction__inputs">
            <CmsSelect
              className="payment-order-payment-correction__select"
              placeholder="강사비 유형"
              aria-label="강사비 유형"
              disabled={confirmLoading}
              value={form.standardWageType ?? undefined}
              options={PAYMENT_CORRECTION_STANDARD_WAGE_OPTIONS}
              onChange={value =>
                update({ standardWageType: value as PaymentCorrectionStandardWageType })
              }
            />
          </div>
        ) : null}

        {manual ? (
          <div className="payment-order-payment-correction__inputs">
            <CmsSelect
              className="payment-order-payment-correction__select"
              placeholder="지급 기준"
              aria-label="지급 기준"
              disabled={confirmLoading}
              value={form.calculationUnit ?? undefined}
              options={PAYMENT_CORRECTION_CALCULATION_UNIT_OPTIONS}
              onChange={value =>
                update({ calculationUnit: value as PaymentCorrectionCalculationUnit })
              }
            />
            <CmsNumericInput
              mode="currency"
              className="payment-order-payment-correction__amount"
              inputSize="medium"
              placeholder="강사비를 입력해 주세요"
              aria-label="강사비"
              disabled={confirmLoading}
              value={form.unitAmount}
              onValueChange={value => update({ unitAmount: value })}
            />
            <span className="payment-order-payment-correction__unit">원</span>
          </div>
        ) : null}

        {error ? (
          <p className="payment-order-payment-correction__error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </ContentModal>
  )
}
