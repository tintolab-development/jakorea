/**
 * 정산 신청서 — 숙박비 신청 블록
 */

import { useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { PaymentStatementIssuanceParagraphDisplayMode } from '@/features/template/ui/form-set/payment-statement-issuance/display-mode'
import { ParagraphFileUpload } from '@/features/template/ui/shared/paragraph-file-upload'
import { CmsInput } from '@/shared/ui/cms-input'
import {
  ADMIN_FILE_OWNER,
  ADMIN_FILE_PURPOSE,
  buildAdminFileOwner,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'
import './settlement-accommodation-fee-detail-form.css'

const INPUT_W = 244

const ACCOMMODATION_RECEIPT_ACCEPT =
  '.jpg,.jpeg,.png,.xls,.xlsx,.pdf,.doc,.docx'

const ACCOMMODATION_RECEIPT_GUIDE_LINES = [
  '- 파일은 최대 15M까지 JPG, PNG, Excel, PDF, Word 형식만 등록 가능합니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

export type SettlementAccommodationFeeAutofillValues = {
  accommodationFee: string
}

const EMPTY: SettlementAccommodationFeeAutofillValues = {
  accommodationFee: '',
}

export type SettlementAccommodationFeeDetailFormProps = {
  values?: Partial<SettlementAccommodationFeeAutofillValues>
  className?: string
  displayMode?: PaymentStatementIssuanceParagraphDisplayMode
}

function textOrDash(value: string): string {
  return value.trim() || '-'
}

export function SettlementAccommodationFeeDetailForm({
  values: valuesProp,
  className,
  displayMode = 'editor',
}: SettlementAccommodationFeeDetailFormProps) {
  const v = { ...EMPTY, ...valuesProp }
  const isDocumentMode = displayMode === 'document'
  const disabled = isDocumentMode
  const [receiptFileNames, setReceiptFileNames] = useState<string[]>([])

  return (
    <DetailInfoForm
      title="숙박비 신청"
      hideHeader
      mode={isDocumentMode ? 'view' : 'edit'}
      className={['settlement-accommodation-fee-detail-form', className].filter(Boolean).join(' ')}
    >
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
                placeholder="직접 입력"
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
          label="영수증 제출"
          fullRow
          view={<span className="settlement-accommodation-fee-detail-form__view-muted">-</span>}
          edit={
            <ParagraphFileUpload
              disabled={disabled}
              accept={ACCOMMODATION_RECEIPT_ACCEPT}
              guideLines={ACCOMMODATION_RECEIPT_GUIDE_LINES}
              fileNames={receiptFileNames}
              onFilesChange={files => {
                setReceiptFileNames(prev => [...prev, ...files.map(file => file.name)])
                const owner = buildAdminFileOwner(
                  ADMIN_FILE_OWNER.SETTLEMENT,
                  1,
                  ADMIN_FILE_PURPOSE.EXPENSE_RECEIPT
                )
                void (async () => {
                  for (const file of files) {
                    await uploadAdminFileMaybeMock({ file, owner }).catch(() => undefined)
                  }
                })()
              }}
              onRemoveFile={index =>
                setReceiptFileNames(prev => prev.filter((_, currentIndex) => currentIndex !== index))
              }
            />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
