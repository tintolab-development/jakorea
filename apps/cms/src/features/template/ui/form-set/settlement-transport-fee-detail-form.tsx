/**
 * 정산 신청서 — 교통비 신청 블록
 */

import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { PaymentStatementIssuanceParagraphDisplayMode } from '@/features/template/ui/form-set/payment-statement-issuance/display-mode'
import { ParagraphFileUpload } from '@/features/template/ui/paragraph/shared/paragraph-file-upload'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio } from '@/shared/ui/cms-radio'
import './settlement-transport-fee-detail-form.css'

const INPUT_W = 244

export type SettlementTransportFeeAutofillValues = {
  distanceKm: string
  travelMethod: 'car' | 'public' | ''
  fuelCost: string
  tollFee: string
  totalTransportFee: string
}

const EMPTY: SettlementTransportFeeAutofillValues = {
  distanceKm: '',
  travelMethod: '',
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

function travelLabel(method: SettlementTransportFeeAutofillValues['travelMethod']): string {
  if (method === 'car') return '자차'
  if (method === 'public') return '대중교통'
  return '-'
}

export function SettlementTransportFeeDetailForm({
  values: valuesProp,
  className,
  displayMode = 'editor',
}: SettlementTransportFeeDetailFormProps) {
  const v = { ...EMPTY, ...valuesProp }
  const isDocumentMode = displayMode === 'document'
  const disabled = isDocumentMode

  return (
    <DetailInfoForm
      title="교통비 신청"
      hideHeader
      mode={isDocumentMode ? 'view' : 'edit'}
      className={['settlement-transport-fee-detail-form', className].filter(Boolean).join(' ')}
    >
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="자택과 출강지 간의 거리"
          fullRow
          view={textOrDash(v.distanceKm ? `${v.distanceKm} km (편도)` : '')}
          edit={
            <div className="detail-info-form-inputs-wrapper-no-gap settlement-transport-fee-detail-form__suffix-row">
              <CmsInput
                disabled={disabled}
                inputSize="medium"
                placeholder="거리"
                value={v.distanceKm}
                width={INPUT_W}
                aria-label="자택과 출강지 간 거리(km)"
              />
              <span className="settlement-transport-fee-detail-form__suffix">km (편도)</span>
            </div>
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="이동 방식"
          fullRow
          view={travelLabel(v.travelMethod)}
          edit={
            <CmsRadio.Group
              className="settlement-transport-fee-detail-form__radios"
              size="large"
              value={v.travelMethod || undefined}
              disabled={disabled}
            >
              <CmsRadio value="car">자차</CmsRadio>
              <CmsRadio value="public">대중교통</CmsRadio>
            </CmsRadio.Group>
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="유류비"
          fullRow
          view={textOrDash(v.fuelCost ? `${v.fuelCost}원` : '')}
          edit={
            <div className="detail-info-form-inputs-wrapper-no-gap settlement-transport-fee-detail-form__suffix-row">
              <CmsInput
                disabled={disabled}
                inputSize="medium"
                value={v.fuelCost}
                width={INPUT_W}
                aria-label="유류비"
              />
              <span className="settlement-transport-fee-detail-form__suffix">원</span>
            </div>
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="통행료"
          fullRow
          view={textOrDash(v.tollFee ? `${v.tollFee}원` : '')}
          edit={
            <div className="detail-info-form-inputs-wrapper-no-gap settlement-transport-fee-detail-form__suffix-row">
              <CmsInput
                disabled={disabled}
                inputSize="medium"
                value={v.tollFee}
                width={INPUT_W}
                aria-label="통행료"
              />
              <span className="settlement-transport-fee-detail-form__suffix">원</span>
            </div>
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="총 산정 교통비"
          fullRow
          view={textOrDash(v.totalTransportFee ? `${v.totalTransportFee}원` : '')}
          edit={
            <div className="detail-info-form-inputs-wrapper-no-gap settlement-transport-fee-detail-form__suffix-row">
              <CmsInput
                disabled={disabled}
                inputSize="medium"
                value={v.totalTransportFee}
                width={INPUT_W}
                aria-label="총 산정 교통비"
              />
              <span className="settlement-transport-fee-detail-form__suffix">원</span>
            </div>
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="증빙 첨부"
          fullRow
          view={<span className="settlement-transport-fee-detail-form__view-muted">-</span>}
          edit={
            <ParagraphFileUpload
              disabled={disabled}
              guideLines={[
                '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
                '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
              ]}
            />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
