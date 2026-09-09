/**
 * 정산 신청서 — 교통비 신청 블록
 * 상단(거리·유류비·톨비) / 하단(총 산정 교통비) 표 분리. 입력값은 자동 산출로 전부 disabled.
 */

import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { PaymentStatementIssuanceParagraphDisplayMode } from '@/features/template/ui/form-set/payment-statement-issuance/display-mode'
import { CmsInput } from '@/shared/ui/cms-input'
import './settlement-transport-fee-detail-form.css'

const INPUT_W = 244

export type SettlementTransportFeeAutofillValues = {
  distanceKm: string
  fuelCost: string
  tollFee: string
  totalTransportFee: string
}

const EMPTY: SettlementTransportFeeAutofillValues = {
  distanceKm: '',
  fuelCost: '',
  tollFee: '',
  totalTransportFee: '',
}

export type SettlementTransportFeeDetailFormProps = {
  values?: Partial<SettlementTransportFeeAutofillValues>
  className?: string
  displayMode?: PaymentStatementIssuanceParagraphDisplayMode
}

function textOrDash(value: string): string {
  return value.trim() || '-'
}

function SuffixInput({
  value,
  width = INPUT_W,
  placeholder,
  'aria-label': ariaLabel,
  suffix,
}: {
  value: string
  width?: number
  placeholder?: string
  'aria-label': string
  suffix: string
}) {
  return (
    <div className="detail-info-form-inputs-wrapper-no-gap settlement-transport-fee-detail-form__suffix-row">
      <CmsInput
        disabled
        inputSize="medium"
        placeholder={placeholder}
        value={value}
        width={width}
        aria-label={ariaLabel}
      />
      <span className="settlement-transport-fee-detail-form__suffix">{suffix}</span>
    </div>
  )
}

export function SettlementTransportFeeDetailForm({
  values: valuesProp,
  className,
  displayMode = 'editor',
}: SettlementTransportFeeDetailFormProps) {
  const v = { ...EMPTY, ...valuesProp }
  const isDocumentMode = displayMode === 'document'
  const mode = isDocumentMode ? 'view' : 'edit'
  const rootClass = ['settlement-transport-fee-detail-form', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass}>
      <DetailInfoForm title="교통비 신청" hideHeader mode={mode}>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="자택과 출강지 간의 거리"
            fullRow
            view={textOrDash(v.distanceKm ? `${v.distanceKm} km (편도)` : '')}
            edit={
              <SuffixInput
                value={v.distanceKm}
                placeholder="거리"
                aria-label="자택과 출강지 간 거리(km)"
                suffix="km (편도)"
              />
            }
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="유류비"
            view={textOrDash(v.fuelCost ? `${v.fuelCost}원` : '')}
            edit={<SuffixInput value={v.fuelCost} aria-label="유류비" suffix="원" />}
          />
          <DetailInfoForm.Field
            label="톨비"
            view={textOrDash(v.tollFee ? `${v.tollFee}원` : '')}
            edit={<SuffixInput value={v.tollFee} aria-label="톨비" suffix="원" />}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm
        title="총 산정 교통비"
        hideHeader
        mode={mode}
        className="settlement-transport-fee-detail-form__total-block"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="총 산정 교통비"
            fullRow
            view={textOrDash(v.totalTransportFee ? `${v.totalTransportFee}원` : '')}
            edit={
              <SuffixInput value={v.totalTransportFee} aria-label="총 산정 교통비" suffix="원" />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
