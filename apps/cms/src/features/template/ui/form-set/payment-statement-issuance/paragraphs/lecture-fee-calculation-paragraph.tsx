import {
  LectureFeeCalculationDetailForm,
  type LectureFeeCalculationAutofillValues,
} from '@/features/template/ui/form-set/lecture-fee-calculation-detail-form'
import type { PaymentStatementIssuanceParagraphDisplayMode } from '@/features/template/ui/form-set/payment-statement-issuance/display-mode'

interface LectureFeeCalculationParagraphProps {
  values?: Partial<LectureFeeCalculationAutofillValues>
  displayMode?: PaymentStatementIssuanceParagraphDisplayMode
}

export function LectureFeeCalculationParagraph({
  values,
  displayMode = 'editor',
}: LectureFeeCalculationParagraphProps) {
  return (
    <div className="form-editor-body lecture-fee-calculation-detail-form-host">
      <LectureFeeCalculationDetailForm values={values} displayMode={displayMode} />
    </div>
  )
}
