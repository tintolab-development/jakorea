/**
 * 정산 신청서 — 숙박비 신청 블록
 */

import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { PaymentStatementIssuanceParagraphDisplayMode } from '@/features/template/ui/form-set/payment-statement-issuance/display-mode'
import { ParagraphFileUpload } from '@/features/template/ui/shared/paragraph-file-upload'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio } from '@/shared/ui/cms-radio'
import './settlement-accommodation-fee-detail-form.css'

const INPUT_W = 244

export type SettlementAccommodationFeeAutofillValues = {
  preConsultation: 'consulted' | 'na' | ''
  accommodationFee: string
}

const EMPTY: SettlementAccommodationFeeAutofillValues = {
  preConsultation: '',
  accommodationFee: '80,000',
}

export type SettlementAccommodationFeeDetailFormProps = {
  values?: Partial<SettlementAccommodationFeeAutofillValues>
  className?: string
  displayMode?: PaymentStatementIssuanceParagraphDisplayMode
}

function textOrDash(value: string): string {
  return value.trim() || '-'
}

function preConsultLabel(v: SettlementAccommodationFeeAutofillValues['preConsultation']): string {
  if (v === 'consulted') return '협의 완료'
  if (v === 'na') return '해당 없음'
  return '-'
}

export function SettlementAccommodationFeeDetailForm({
  values: valuesProp,
  className,
  displayMode = 'editor',
}: SettlementAccommodationFeeDetailFormProps) {
  const v = { ...EMPTY, ...valuesProp }
  const isDocumentMode = displayMode === 'document'
  const disabled = isDocumentMode

  return (
    <DetailInfoForm
      title="숙박비 신청"
      hideHeader
      mode={isDocumentMode ? 'view' : 'edit'}
      className={['settlement-accommodation-fee-detail-form', className].filter(Boolean).join(' ')}
    >
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="사전 협의 확인"
          fullRow
          view={preConsultLabel(v.preConsultation)}
          edit={
            <CmsRadio.Group
              className="settlement-accommodation-fee-detail-form__radios"
              size="large"
              value={v.preConsultation || undefined}
              disabled={disabled}
            >
              <CmsRadio value="consulted">협의 완료</CmsRadio>
              <CmsRadio value="na">해당 없음</CmsRadio>
            </CmsRadio.Group>
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="숙박비"
          fullRow
          view={textOrDash(v.accommodationFee ? `${v.accommodationFee}원` : '')}
          edit={
            <div className="detail-info-form-inputs-wrapper-no-gap settlement-accommodation-fee-detail-form__suffix-row">
              <CmsInput
                disabled={disabled}
                inputSize="medium"
                value={v.accommodationFee}
                width={INPUT_W}
                aria-label="숙박비"
              />
              <span className="settlement-accommodation-fee-detail-form__suffix">원</span>
            </div>
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="실비 영수증 제출"
          fullRow
          view={<span className="settlement-accommodation-fee-detail-form__view-muted">-</span>}
          edit={
            <ParagraphFileUpload
              disabled={disabled}
              guideLines={[
                '- 파일은 총 최대 15MB까지 JPG, PNG 형식만 등록 가능합니다.',
                '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
              ]}
            />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
