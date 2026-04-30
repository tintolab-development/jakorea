import {
  PaymentStatementBasicInfoDetailForm,
  type PaymentStatementBasicInfoAutofillValues,
} from '@/features/template/ui/form-set/payment-statement-basic-info-detail-form'
import type { PaymentStatementIssuanceParagraphDisplayMode } from '@/features/template/ui/form-set/payment-statement-issuance/display-mode'

interface BasicInfoParagraphProps {
  values?: Partial<PaymentStatementBasicInfoAutofillValues>
  displayMode?: PaymentStatementIssuanceParagraphDisplayMode
}

export function BasicInfoParagraph({ values, displayMode = 'editor' }: BasicInfoParagraphProps) {
  return (
    <div className="form-editor-body payment-statement-basic-info-detail-form-host">
      <PaymentStatementBasicInfoDetailForm values={values} displayMode={displayMode} />
    </div>
  )
}
