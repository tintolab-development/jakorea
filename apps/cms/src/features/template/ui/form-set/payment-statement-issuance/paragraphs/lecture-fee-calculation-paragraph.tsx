import {
  LectureFeeCalculationDetailForm,
  type LectureFeeCalculationAutofillValues,
  type LectureFeeCalculationFeeLayout,
} from '@/features/template/ui/form-set/lecture-fee-calculation-detail-form'
import type { PaymentStatementIssuanceParagraphDisplayMode } from '@/features/template/ui/form-set/payment-statement-issuance/display-mode'

interface LectureFeeCalculationParagraphProps {
  values?: Partial<LectureFeeCalculationAutofillValues>
  displayMode?: PaymentStatementIssuanceParagraphDisplayMode
  feeLayout?: LectureFeeCalculationFeeLayout
}

export function LectureFeeCalculationParagraph({
  values,
  displayMode = 'editor',
  feeLayout = 'payment_statement',
}: LectureFeeCalculationParagraphProps) {
  return (
    <div className="form-editor-body lecture-fee-calculation-detail-form-host">
      <LectureFeeCalculationDetailForm
        values={values}
        displayMode={displayMode}
        feeLayout={feeLayout}
      />
    </div>
  )
}
