import {
  LECTURE_FEE_CALCULATION_LINES_SAMPLE,
  type PaymentStatementCalculationLinesViewModel,
} from '@/features/template/model/lecture-fee-calculation-lines-sample'
import { PaymentStatementIssuanceCalculationLinesTable } from '@/features/template/ui/form-set/payment-statement-issuance-calculation-lines-table'

interface CalculationLinesParagraphProps {
  lines?: PaymentStatementCalculationLinesViewModel
}

export function CalculationLinesParagraph({ lines }: CalculationLinesParagraphProps) {
  const linesVm = lines ?? LECTURE_FEE_CALCULATION_LINES_SAMPLE

  return (
    <div className="form-editor-body payment-statement-issuance-calculation-lines-host">
      <PaymentStatementIssuanceCalculationLinesTable
        blocks={linesVm.blocks}
        formulaLabel={linesVm.formulaLabel}
        totalAmount={linesVm.totalAmount}
      />
    </div>
  )
}
