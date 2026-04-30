import {
  PaymentStatementBasicInfoDetailForm,
  type PaymentStatementBasicInfoAutofillValues,
} from '@/features/template/ui/form-set/payment-statement-basic-info-detail-form'

interface BasicInfoParagraphProps {
  values?: Partial<PaymentStatementBasicInfoAutofillValues>
}

export function BasicInfoParagraph({ values }: BasicInfoParagraphProps) {
  return (
    <div className="form-editor-body payment-statement-basic-info-detail-form-host">
      <PaymentStatementBasicInfoDetailForm values={values} />
    </div>
  )
}
