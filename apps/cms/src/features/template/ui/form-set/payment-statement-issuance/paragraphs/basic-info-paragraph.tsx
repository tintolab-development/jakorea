import {
  PaymentStatementBasicInfoDetailForm,
  type PaymentStatementBasicInfoAutofillValues,
} from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'
import type { PaymentStatementIssuanceParagraphDisplayMode } from '@/features/template/ui/form-set/payment-statement-issuance/display-mode'

interface BasicInfoParagraphProps {
  values?: Partial<PaymentStatementBasicInfoAutofillValues>
  displayMode?: PaymentStatementIssuanceParagraphDisplayMode
  onlyPaymentPurposeLocked?: boolean
  lockedProfileFields?: boolean
  hideResidentFields?: boolean
  onValuesChange?: (values: PaymentStatementBasicInfoAutofillValues) => void
}

export function BasicInfoParagraph({
  values,
  displayMode = 'editor',
  onlyPaymentPurposeLocked,
  lockedProfileFields,
  hideResidentFields,
  onValuesChange,
}: BasicInfoParagraphProps) {
  return (
    <div className="form-editor-body payment-statement-basic-info-detail-form-host">
      <PaymentStatementBasicInfoDetailForm
        values={values}
        displayMode={displayMode}
        onlyPaymentPurposeLocked={onlyPaymentPurposeLocked}
        lockedProfileFields={lockedProfileFields}
        hideResidentFields={hideResidentFields}
        onValuesChange={onValuesChange}
      />
    </div>
  )
}
